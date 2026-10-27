import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
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

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export async function sync(root, fetcher = fetch) {
  const config = JSON.parse(await readFile(path.join(root, 'album-config.json'), 'utf8'));
  const request = async url => {
    const response = await fetcher(url, { signal: AbortSignal.timeout(120000) });
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    return response;
  };
  const photos = parseAlbum(await (await request(config.url)).text());
  const cache = path.join(root, '.album-cache');
  await mkdir(path.join(cache, 'images'), { recursive: true });
  let state = { version: 1, items: {} };
  try { state = JSON.parse(await readFile(path.join(cache, 'state.json'), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (state.version !== 1 || !state.items) throw new Error('Invalid sync state');
  const known = new Map();
  for (const dir of [path.join(root, 'images'), path.join(cache, 'images')]) {
    for (const name of await readdir(dir)) {
      if (/\.(png|jpe?g|webp)$/i.test(name))
        known.set(hash(await readFile(path.join(dir, name))), path.join(dir, name));
    }
  }
  const output = path.join(root, '_site');
  await mkdir(path.join(output, 'images'), { recursive: true });
  const gallery = [];
  const seen = new Set();
  let downloaded = 0;
  for (const photo of photos) {
    let sha256 = state.items[photo.id];
    let source = known.get(sha256);
    if (!source) {
      const response = await request(`${photo.url}=d`);
      const bytes = Buffer.from(await response.arrayBuffer());
      let extension;
      if (bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) extension = 'png';
      else if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) extension = 'jpg';
      else if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') extension = 'webp';
      else throw new Error('Downloaded content is not a supported image');
      downloaded++;
      sha256 = hash(bytes);
      source = known.get(sha256);
      if (!source) {
        source = path.join(cache, 'images', `${sha256}.${extension}`);
        await writeFile(source, bytes);
        known.set(sha256, source);
      }
      state.items[photo.id] = sha256;
    }
    if (!seen.has(sha256)) {
      const filename = path.basename(source);
      await writeFile(path.join(output, 'images', filename), await readFile(source));
      gallery.push({ src: `images/${filename}`, name: filename.startsWith('ENDFIELD_SHARE_')
        ? path.basename(filename, path.extname(filename)) : `ENDFIELD_SHARE_${Math.floor(photo.timestamp / 1000)}` });
      seen.add(sha256);
    }
  }
  await writeFile(path.join(cache, 'state.json'), JSON.stringify(state, null, 2) + '\n');
  await writeFile(path.join(output, 'photos.js'), `window.PHOTOS = ${JSON.stringify(gallery)};\n`);
  console.log(`Album: ${photos.length}; displayed: ${gallery.length}; downloaded: ${downloaded}; skipped: ${photos.length - downloaded}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await sync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'));
