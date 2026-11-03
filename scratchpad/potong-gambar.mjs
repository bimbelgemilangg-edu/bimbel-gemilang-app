// Potong wilayah GAMBAR dari halaman PDF (render 300dpi = HD) lewat ink-bbox
// dalam pita vertikal fraksional per halaman. Presisi: bbox tinta ketat + pad kecil.
//   node potong-gambar.mjs <config.json>
// config: { img: dir render 300dpi, out: dir aset, pita: [[hal, y0, y1, x0, x1, nama?], ...] }
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from 'canvas';

const cfgPath = process.argv[2];
if (!cfgPath) { console.error('pakai: node potong-gambar.mjs <config.json>'); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const IMG = cfg.img;
const OUT = cfg.out;
fs.mkdirSync(OUT, { recursive: true });
for (const [hal, y0, y1, x0, x1, nama] of cfg.pita) {
  const src = path.join(IMG, `hal-${String(hal).padStart(2, '0')}.png`);
  const img = await loadImage(src);
  const W = img.width, H = img.height;
  const bx = Math.floor(x0 * W), by = Math.floor(y0 * H);
  const bw = Math.floor((x1 - x0) * W), bh = Math.floor((y1 - y0) * H);
  const tmp = createCanvas(bw, bh);
  tmp.getContext('2d').drawImage(img, bx, by, bw, bh, 0, 0, bw, bh);
  const data = tmp.getContext('2d').getImageData(0, 0, bw, bh).data;
  let minX = bw, minY = bh, maxX = -1, maxY = -1;
  for (let y = 0; y < bh; y += 2) {
    for (let x = 0; x < bw; x += 2) {
      const i = (y * bw + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const gelap = (r + g + b) / 3 < 235 || Math.abs(r - g) > 25 || Math.abs(g - b) > 25;
      if (gelap) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
  }
  if (maxX < 0) { console.log('hal', hal, 'KOSONG'); continue; }
  const pad = 16;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(bw - 1, maxX + pad); maxY = Math.min(bh - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const out = createCanvas(cw, ch);
  out.getContext('2d').drawImage(tmp, minX, minY, cw, ch, 0, 0, cw, ch);
  const file = path.join(OUT, nama || `gambar-${hal}.png`);
  fs.writeFileSync(file, out.toBuffer('image/png'));
  console.log('OK', path.basename(file), `${cw}x${ch}`, `${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
}
