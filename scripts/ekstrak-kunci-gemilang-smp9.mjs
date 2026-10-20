// scripts/ekstrak-kunci-gemilang-smp9.mjs
// ============================================================
// Ekstraksi KUNCI & PEMBAHASAN (pegangan GURU) dari buku PDF
// Gemilang SMP 9 Sem-1 (hal 69-81). Soal TIDAK dipaksa masuk bank
// dari lapisan teks dua-kolom ini (pecahan bertumpuk = sampah);
// berkas kunci ini adalah pasangan resmi untuk JSON soal bersih
// yang diekstrak tool owner kelak. Menulis
// KUNCI-PEMBAHASAN-GEMILANG-SMP9-SEM1.json di akar repo.
// ============================================================
import { createRequire } from 'node:module';
import { promises as fs } from 'node:fs';
const require = createRequire(import.meta.url);
globalThis.pdfjsWorker = require('pdfjs-dist/legacy/build/pdf.worker.js');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const [,, file, dari = '69', sampai = '81', out = 'KUNCI-PEMBAHASAN-GEMILANG-SMP9-SEM1.json'] = process.argv;
const data = new Uint8Array(await fs.readFile(file));
const doc = await pdfjsLib.getDocument({ data, isEvalSupported: false, disableFontFace: true }).promise;
let teks = '';
for (let i = Number(dari); i <= Math.min(Number(sampai), doc.numPages); i += 1) {
  const page = await doc.getPage(i);
  const tc = await page.getTextContent();
  const baris = [];
  let y = null; let line = '';
  for (const it of tc.items) {
    const yy = Math.round(it.transform[5]);
    if (y === null) y = yy;
    if (Math.abs(yy - y) > 3) { baris.push(line.trim()); line = ''; y = yy; }
    line += `${it.str} `;
  }
  baris.push(line.trim());
  teks += `${baris.filter(Boolean).join('\n')}\n`;
  page.cleanup();
}
await doc.destroy();

const entri = [];
const re = /Paket\s*(\d+)\s+No\.?\s*(\d+)\s*[^:]{0,40}:\s*([\s\S]*?)(?=Paket\s*\d+\s+No\.?\s*\d+|$)/g;
let m;
while ((m = re.exec(teks))) {
  const badan = m[3];
  const mk = badan.match(/Jawaban\s*(?:\(([A-E])\)|([A-E]))\s*[:：-]?/i);
  const kunci = mk ? (mk[1] || mk[2]).toUpperCase() : null;
  const pembahasan = badan.replace(/\s+\n/g, '\n').replace(/[ \t]{2,}/g, ' ').trim().slice(0, 2000);
  if (pembahasan) entri.push({ paket: Number(m[1]), nomor: Number(m[2]), kunci, pembahasan });
}
const hasil = {
  sumber: 'Gemilang_Book_Matematika_SMP_Kelas_9_Semester_1.pdf',
  halamanPembahasan: [Number(dari), Number(sampai)],
  keterangan: 'PEGANGAN GURU — kunci & pembahasan lengkap per paket. Soal siswa ada di lembar/paket buku (mode siswa flipbook menyembunyikan halaman ini).',
  statistik: {
    entri: entri.length,
    berkunci: entri.filter((e) => e.kunci).length,
    paket: [...new Set(entri.map((e) => e.paket))].sort((a, b) => a - b),
  },
  entri,
};
await fs.writeFile(out, JSON.stringify(hasil, null, 2));
console.log('entri:', hasil.statistik.entri, '| berkunci:', hasil.statistik.berkunci, '| paket:', hasil.statistik.paket.join(','));
