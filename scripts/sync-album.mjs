import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function parseAlbum(html) {
  const match = html.match(/AF_initDataCallback\(\{key: 'ds:1', hash: '[^']*', data:([\s\S]*?), sideChannel: \{\}\}\);/);
  if (!match) throw new Error('Album unavailable or Google format changed');
  const data = JSON.parse(match[1]);
  const rows = data[1];
  if (!Array.isArray(rows) || !rows.length || data[2] || data[3]?.[21] !== rows.length)
    throw new Error('Empty/incomplete album; pagination is not supported. Keeping existing deployment.');
  return rows.map(([id, media, timestamp]) => {
    if (typeof id !== 'string' || !/^AF1Q[\w-]+$/.test(id) ||
        !Array.isArray(media) || !Number.isFinite(timestamp) ||
        !/^https:\/\/lh\d+\.googleusercontent\.com\//.test(media[0]) || media[8]?.[2] !== 1)
      throw new Error('Unsupported photo entry');
    return { id, url: media[0], timestamp };
  });
}

export async function sync(root, fetcher = fetch) {
  const config = JSON.parse(await readFile(path.join(root, 'album-config.json'), 'utf8'));
  const response = await fetcher(config.url, { signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`Album request failed: HTTP ${response.status}`);
  const photos = parseAlbum(await response.text());
  const seen = new Set();
  const gallery = photos.filter(photo => {
    if (seen.has(photo.id)) return false;
    seen.add(photo.id);
    return true;
  }).map(photo => ({
    src: `${photo.url}=w1920-h1920`,
    original: `${photo.url}=d`,
    name: `ENDFIELD_SHARE_${Math.floor(photo.timestamp / 1000)}`
  }));
  const output = path.join(root, '_site');
  await mkdir(output, { recursive: true });
  await writeFile(path.join(output, 'photos.js'), `window.PHOTOS = ${JSON.stringify(gallery)};\n`);
  console.log(`Album: ${photos.length}; displayed: ${gallery.length}; image downloads: 0 (remote URLs)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await sync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
