// scratchpad/serve-prototipe.mjs
// Server statis MINI untuk folder prototipe/ (fase 0). Sengaja tanpa dependensi
// dan tidak menyentuh Firestore: prototipe harus bisa dinilai walau kuota baca
// sedang jebol. Ikat 0.0.0.0 supaya pratinjau sandbox reachable.
//   node scratchpad/serve-prototipe.mjs [port]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, normalize, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'prototipe');
const PORT = Number(process.argv[2] || 8090);
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let path = decodeURIComponent(url.pathname);
  if (path === '/' || path === '') path = '/index.html';
  const file = normalize(join(ROOT, path));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end('dilarang'); return; }
  try {
    const isi = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(isi);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('tidak ditemukan: ' + path);
  }
}).listen(PORT, '0.0.0.0', () => {
  console.log(`prototipe hidup di port ${PORT} (folder ${ROOT})`);
});
