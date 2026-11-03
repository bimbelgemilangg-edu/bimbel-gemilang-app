// Potong wilayah GAMBAR dari halaman PDF (render 150dpi) lewat ink-bbox
// dalam pita vertikal yang ditentukan manual per halaman.
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, loadImage } from 'canvas';
const IMG = '/tmp/arena/tenants/3615ec0a-62ef-4f7b-bb10-44d4e0a6b5b8/sessions/26e934d0-56d1-43f1-8354-d25cf13cf366/workspace/scratchpad/img-pdf-tka';
const OUT = '/tmp/arena/tenants/3615ec0a-62ef-4f7b-bb10-44d4e0a6b5b8/sessions/26e934d0-56d1-43f1-8354-d25cf13cf366/workspace/repo/public/soal-tka-gel2';
// [halaman, y0, y1, x0, x1] dalam FRAKSI tinggi/lebar halaman
const PITA = [
  [11, 0.10, 0.30, 0.25, 0.78], // 12 grafik daerah arsir
  [12, 0.14, 0.36, 0.15, 0.80], // 13 cupcake (y0 dinaikkan: baris "berikut:" ikut terpotong sebelumnya)
  [13, 0.10, 0.30, 0.25, 0.75], // 14 garis sejajar
  [14, 0.09, 0.27, 0.25, 0.75], // 15 sudut
  [15, 0.10, 0.30, 0.30, 0.70], // 16 bangun ruang
  [16, 0.11, 0.31, 0.30, 0.70], // 17 trapesium
  [17, 0.10, 0.33, 0.30, 0.70], // 18 rak
  [19, 0.16, 0.34, 0.25, 0.75], // 19 tiang-bangunan (garis putus-putus)
  [20, 0.12, 0.30, 0.25, 0.75], // 20 balok kabel
  [21, 0.16, 0.34, 0.25, 0.75], // 21 ruang kelas tali hiasan
  [22, 0.11, 0.36, 0.30, 0.70], // 22 jam
  [24, 0.09, 0.29, 0.30, 0.70], // 24 segitiga
  [25, 0.09, 0.235, 0.25, 0.75], // 25 segitiga (y1 diturunkan: baris pernyataan opsi ikut terpotong sebelumnya)
  [26, 0.12, 0.44, 0.20, 0.80], // 26 diagram garis
  [27, 0.12, 0.42, 0.20, 0.80], // 27 grafik
];
fs.mkdirSync(OUT, { recursive: true });
for (const [hal, y0, y1, x0, x1] of PITA) {
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
  const pad = 10;
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(bw - 1, maxX + pad); maxY = Math.min(bh - 1, maxY + pad);
  const cw = maxX - minX + 1, ch = maxY - minY + 1;
  const out = createCanvas(cw, ch);
  out.getContext('2d').drawImage(tmp, minX, minY, cw, ch, 0, 0, cw, ch);
  const file = path.join(OUT, `gambar-${hal}.png`);
  fs.writeFileSync(file, out.toBuffer('image/png'));
  console.log('OK', `gambar-${hal}.png`, `${cw}x${ch}`, `${(fs.statSync(file).size / 1024).toFixed(0)}KB`);
}
