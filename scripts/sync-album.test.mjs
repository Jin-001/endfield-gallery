import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
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

test('refresh remote URLs without image downloads, reflect removals and preserve output on failure', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'album-test-'));
  try {
    await writeFile(path.join(root, 'album-config.json'), JSON.stringify({ url: 'https://example.test/album' }));
    let html = album(['AF1Qone', 'AF1Qtwo', 'AF1Qone']);
    const fetcher = async url => {
      assert.equal(url, 'https://example.test/album', 'must never request image bytes');
      return new Response(html);
    };
    await sync(root, fetcher);
    const output = path.join(root, '_site', 'photos.js');
    const load = async () => JSON.parse((await readFile(output, 'utf8')).slice('window.PHOTOS = '.length, -2));
    let photos = await load();
    assert.equal(photos.length, 2);
    assert.equal(photos[0].src, 'https://lh3.googleusercontent.com/AF1Qone=w1920-h1920');
    assert.equal(photos[0].original, 'https://lh3.googleusercontent.com/AF1Qone=s0');
    html = album(['AF1Qtwo']).replace('googleusercontent.com/AF1Qtwo', 'googleusercontent.com/refreshed');
    await sync(root, fetcher);
    photos = await load();
    assert.equal(photos.length, 1);
    assert.match(photos[0].src, /refreshed=/);
    const before = await readFile(output, 'utf8');
    html = 'unavailable';
    await assert.rejects(sync(root, fetcher));
    assert.equal(await readFile(output, 'utf8'), before);
    await assert.rejects(sync(root, async () => new Response('', { status: 503 })));
    assert.equal(await readFile(output, 'utf8'), before);
  } finally { await rm(root, { recursive: true, force: true }); }
});
