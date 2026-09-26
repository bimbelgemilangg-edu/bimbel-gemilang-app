// scripts/ekstrak-bagan-svg.mjs
// ============================================================
// EKSTRAKTOR BAGAN SVG (turn 90 — koreksi owner: opsi bagan harus
// GAMBAR seperti cetakan/HTML asli, bukan teks).
// Mengambil setiap <svg> di dalam <div class="diagram">:
//   - area soal  -> public/bagan/<prefix>-s<nomor>-<huruf>.svg (opsi A-E)
//   - area materi-> public/bagan/<prefix>-<nama>.svg (kartu gambar)
// SVG dibuat STANDALONE: xmlns + viewBox + <style> kelas asli buku
// + defs marker panah (#ah) bila direferensikan.
// Pemakaian: node scripts/ekstrak-bagan-svg.mjs <html> <outDir> <prefix>
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [src, outDir, prefix] = process.argv.slice(2);
if (!src || !outDir || !prefix) { console.error('butuh: <html> <outDir> <prefix>'); process.exit(1); }
const html = readFileSync(src, 'utf-8');
mkdirSync(outDir, { recursive: true });

// CSS kelas svg dari <style> halaman — ambil SEMUA rule kelas yang
// memuat properti bentuk/teks (fill/stroke/font/text-anchor) supaya
// tidak ada kelas tertinggal (insiden turn 92: v1/v2/v3 & bx/* lolos
// sehingga lingkaran/batang render hitam polos).
const pageStyle = (/<style>([\s\S]*?)<\/style>/.exec(html) || [, ''])[1];
const aturan = pageStyle.split('}')
  .map((s) => s.trim())
  .filter((s) => /^\.?[a-zA-Z0-9_.#-]+\{/.test(s) && /fill|stroke|font|text-anchor/.test(s))
  .filter((s) => s.startsWith('.'))
  .map((s) => s + '}');
aturan.push('text{font-family:Arial,Helvetica,sans-serif}');
const STYLE = '<style>' + aturan.join('') + '</style>';

// defs marker panah global (id="ah") bila ada
let DEFS = '';
{
  const m = /<defs>[\s\S]*?<marker[\s\S]*?<\/defs>/.exec(html) || /<marker[^>]*id="ah"[\s\S]*?<\/marker>/.exec(html);
  if (m) DEFS = m[0].startsWith('<defs>') ? m[0] : `<defs>${m[0]}</defs>`;
}

function bungkus(svg) {
  let vb = /viewBox="([^"]+)"/.exec(svg);
  let aria = /aria-label="([^"]*)"/.exec(svg);
  let inner = svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  const butuhAh = /url\(#ah\)/.test(inner) && !/id="ah"/.test(inner);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb ? vb[1] : '0 0 300 150'}" role="img" aria-label="${aria ? aria[1].replace(/"/g, "'") : 'bagan'}">${STYLE}${butuhAh ? DEFS : ''}<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"></rect>${inner}</svg>`;
}

const peta = [];
// ---- area soal: li ber-diagram ----
const iK = html.indexOf('KUNCI DAN PEMBAHASAN');
const areaSoal = iK > 0 ? html.slice(0, iK) : html;
const reOl = /<ol class="lst"([^>]*)>([\s\S]*?)<\/ol>/g;
let mo; let nextNo = 1;
while ((mo = reOl.exec(areaSoal))) {
  const mStart = /start="(\d+)"/.exec(mo[1]);
  let no = mStart ? Number(mStart[1]) : nextNo;
  const bagian = ('\n' + mo[2]).split(/^ {4}<li>/m).slice(1);
  for (let b of bagian) {
    b = b.split(/^ {4}<\/li>/m)[0];
    if (b.includes('class="diagram"')) {
      const svgs = [...b.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0]);
      const huruf = svgs.map((_, i) => String.fromCharCode(97 + i));
      svgs.forEach((svg, i) => {
        const nama = `${prefix}-s${no}-${huruf[i]}.svg`;
        writeFileSync(join(outDir, nama), bungkus(svg));
        peta.push({ soal: no, opsi: huruf[i].toUpperCase(), file: nama });
      });
    }
    no += 1;
  }
  nextNo = no;
}
// ---- area materi: diagram di luar soal (bagan penjelasan) ----
const materiArea = html.slice(0, (/<h2 class="hbar"[^>]*>[\s\S]{0,300}?Latihan Soal/.exec(html) || { index: 0 }).index);
const svgsMateri = [...materiArea.matchAll(/<div class="diagram">[\s\S]*?<\/div>/g)];
svgsMateri.forEach((dm, i) => {
  const svg = /<svg[\s\S]*?<\/svg>/.exec(dm[0]);
  if (!svg) return;
  const nama = `${prefix}-materi-${i + 1}.svg`;
  writeFileSync(join(outDir, nama), bungkus(svg[0]));
  peta.push({ materi: true, file: nama, aria: (/aria-label="([^"]*)"/.exec(svg[0]) || [])[1] || '' });
});

writeFileSync(join(outDir, `${prefix}-map.json`), JSON.stringify(peta, null, 2));

// Guard turn 92: setiap class yang dipakai di dalam svg WAJIB punya
// rule di <style> yang disematkan — mencegah render hitam polos lagi.
const semuaStyle = aturan.join('');
let kelasHilang = 0;
for (const f of peta) {
  if (!f.file || !f.file.endsWith('.svg')) continue;
  const svg = readFileSync(join(outDir, f.file), 'utf-8');
  for (const m of svg.matchAll(/class="([a-zA-Z0-9_-]+)"/g)) {
    if (!new RegExp('\\.' + m[1] + '\\{').test(semuaStyle)) {
      kelasHilang += 1;
      console.error(`❌ ${f.file}: kelas .${m[1]} tidak punya rule CSS`);
    }
  }
}
if (kelasHilang) process.exit(1);
console.log('guard kelas svg: semua ter-cover ✅');
console.log('bagan tertulis:', peta.length);
peta.forEach((p) => console.log(' ', p.soal ? `soal ${p.soal} opsi ${p.opsi}` : 'materi', '->', p.file));
