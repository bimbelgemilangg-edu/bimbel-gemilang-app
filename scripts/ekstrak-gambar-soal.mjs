// scripts/ekstrak-gambar-soal.mjs
// ============================================================
// Ekstrak gambar stimulus (data-URI jpeg/png) & svg diagram yang
// berada di BLOK STIMULUS (antara <p class="petik">) area soal ->
// public/<dir>/<prefix>-g<grup>.<ext> + map grup->file.
// Builder memakai field soalGambar per soal sesuai grup stimulusnya
// (pola CBT: setiap soal mandiri membawa gambar stimulusnya).
// Pemakaian: node scripts/ekstrak-gambar-soal.mjs <html> <outDir> <prefix>
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [src, outDir, prefix] = process.argv.slice(2);
if (!src || !outDir || !prefix) { console.error('butuh <html> <outDir> <prefix>'); process.exit(1); }
const html = readFileSync(src, 'utf-8');
mkdirSync(outDir, { recursive: true });

const LATIHAN_RE = /<h2 class="hbar"[^>]*>[\s\S]{0,300}?(Latihan Soal|Exercises?)/;
const iK = html.indexOf('KUNCI DAN PEMBAHASAN');
const mH2 = LATIHAN_RE.exec(html);
const area = html.slice(mH2 ? mH2.index : 0, iK > 0 ? iK : html.length);

// posisi petik = awal tiap grup stimulus
const pos = [];
const rePetik = /<p class="petik">/g;
let m;
while ((m = rePetik.exec(area))) pos.push(m.index);

const peta = [];
pos.forEach((p, g) => {
  const sampai = g + 1 < pos.length ? pos[g + 1] : area.length;
  const blok = area.slice(p, sampai);
  // berhenti di daftar soal (ol) — gambar stimulus selalu sebelum ol
  const cut = blok.indexOf('<ol class="lst"');
  const zona = cut > 0 ? blok.slice(0, cut) : blok;
  let n = 0;
  const imgs = [...zona.matchAll(/<img[^>]*src="data:image\/(jpeg|png|webp);base64,([^"]+)"/g)];
  for (const im of imgs) {
    n += 1;
    const ext = im[1] === 'jpeg' ? 'jpg' : im[1];
    const nama = `${prefix}-g${g + 1}${imgs.length > 1 ? '-' + n : ''}.${ext}`;
    writeFileSync(join(outDir, nama), Buffer.from(im[2], 'base64'));
    peta.push({ grup: g, file: nama });
  }
  const svgs = [...zona.matchAll(/<svg[\s\S]*?<\/svg>/g)];
  for (const sv of svgs) {
    n += 1;
    const nama = `${prefix}-g${g + 1}${svgs.length > 1 ? '-' + n : ''}.svg`;
    const vb = /viewBox="([^"]+)"/.exec(sv[0]);
    const style = (/<style>([\s\S]*?)<\/style>/.exec(html) || [, ''])[1];
    const kelas = style.split('}').map((s) => s.trim())
      .filter((s) => s.startsWith('.') && /fill|stroke|font|text-anchor/.test(s)).map((s) => s + '}');
    writeFileSync(join(outDir, nama),
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb ? vb[1] : '0 0 600 300'}"><style>${kelas.join('')}text{font-family:Arial,Helvetica,sans-serif}</style><rect width="100%" height="100%" fill="#fff"></rect>${sv[0].replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</svg>`);
    peta.push({ grup: g, file: nama });
  }
});
writeFileSync(join(outDir, `${prefix}-map.json`), JSON.stringify(peta, null, 2));
console.log('gambar tertulis:', peta.length);
peta.forEach((p) => console.log(`  grup ${p.grup + 1} -> ${p.file}`));
