import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { parseAlbum, sync } from './sync-album.mjs';

function album(ids, { count = ids.length, token = '' } = {}) {
  const meta = []; meta[21] = count;
  const rows = ids.map(id => [id, ['https://lh3.googleusercontent.com/' + id, 1920, 1183,
    null, null, null, null, null, [null, null, 1]], 1792162926206]);
  return `AF_initDataCallback({key: 'ds:1', hash: '2', data:${JSON.stringify([null, rows, token, meta])}, sideChannel: {}});`;
}

test('reject unavailable, empty and incomplete albums', () => {
  for (const html of ['login', album([]), album(['AF1Qone'], { count: 2 }), album(['AF1Qone'], { token: 'next' })])
    assert.throws(() => parseAlbum(html));
});

test('skip known IDs, deduplicate bytes, reflect removals, preserve output on failure', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'album-test-'));
  try {
    await mkdir(path.join(root, 'images'));
    await writeFile(path.join(root, 'album-config.json'), JSON.stringify({ url: 'https://example.test/album' }));
    const png = Buffer.from('89504e470d0a1a0a0000', 'hex');
    let html = album(['AF1Qone', 'AF1Qtwo']);
    let downloads = 0;
    const fetcher = async url => {
      if (url === 'https://example.test/album') return new Response(html);
      downloads++; return new Response(png);
    };
    await sync(root, fetcher);
    assert.equal(downloads, 2);
    const output = path.join(root, '_site', 'photos.js');
    const first = await readFile(output, 'utf8');
    assert.equal(JSON.parse(first.slice('window.PHOTOS = '.length, -2)).length, 1);
    await sync(root, fetcher);
    assert.equal(downloads, 2, 'second run must not request any image');
    html = album(['AF1Qtwo']);
    await sync(root, fetcher);
    assert.equal(downloads, 2);
    const before = await readFile(output, 'utf8');
    html = 'unavailable';
    await assert.rejects(sync(root, fetcher));
    assert.equal(await readFile(output, 'utf8'), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});
