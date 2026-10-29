// tests/templatBaris.test.mjs — parser kontrak templat baris
//     node tests/templatBaris.test.mjs
import assert from 'node:assert/strict';
import { parseTemplatBaris, looksLikeTemplatBaris, SKEMA_TEMPLAT_BARIS } from '../src/utils/templatBaris.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('templatBaris — parser kontrak pihak ketiga');

const CONTOH = `SKEMA: gemilang-baris@1
JUDUL PAKET: TO Matriks SMA

##SOAL 1
TIPE: pg_sederhana
MATERI: Matriks
KESULITAN: sedang
KUNCI: A
GAMBAR: tidak
TEKS:
Diketahui matriks $A=\\begin{pmatrix} -1 & 2 \\\\ 3 & 4 \\end{pmatrix}$.
Invers dari $A$ adalah ....
OPSI:
- $\\begin{pmatrix} -2 & 3 \\\\ 1 & -1 \\end{pmatrix}$
- $\\begin{pmatrix} 2 & -3 \\\\ -1 & 1 \\end{pmatrix}$
PEMBAHASAN:
det $A=-11$.
Langkah: tukar diagonal, negasikan off-diagonal.
Jawaban: A
`;

uji('deteksi bentuk templat', () => {
  assert.equal(looksLikeTemplatBaris(CONTOH), true);
  assert.equal(looksLikeTemplatBaris('<html></html>'), false);
});
uji('soal utuh terparse: field, opsi, baris pembahasan terjaga', () => {
  const r = parseTemplatBaris(CONTOH);
  assert.deepEqual(r.errors, []);
  assert.equal(r.judul, 'TO Matriks SMA');
  const q = r.soal[0];
  assert.equal(q.nomor, 1);
  assert.equal(q.tipe, 'pg_sederhana');
  assert.equal(q.kunci_jawaban, 'A');
  assert.equal(q.butuhGambar, false);
  assert.equal(q.opsi_jawaban.length, 2);
  assert.match(q.opsi_jawaban[0].teks, /\\begin\{pmatrix\}/);
  assert.equal(q.teks_soal.split('\n').length, 2, 'baris TEKS terjaga');
  assert.equal(q.pembahasan.split('\n').length, 3, 'baris PEMBAHASAN terjaga');
});
uji('LaTeX TIDAK perlu escaping ganda: backslash tunggal lolos apa adanya', () => {
  const q = parseTemplatBaris(CONTOH).soal[0];
  assert.ok(q.teks_soal.includes('\\begin{pmatrix}'), q.teks_soal);
  assert.ok(!q.teks_soal.includes('\\\\begin'), 'tidak ada doubling');
});
uji('versi skema tak dikenal ditolak dengan pesan ber-baris', () => {
  const r = parseTemplatBaris(CONTOH.replace(SKEMA_TEMPLAT_BARIS, 'gemilang-baris@2'));
  assert.equal(r.errors.length, 1);
  assert.equal(r.errors[0].baris, 1);
  assert.match(r.errors[0].pesan, /tidak dikenal/);
});
uji('field di luar blok soal & opsi kurang dilaporkan per alamat', () => {
  const r = parseTemplatBaris('TIPE: pg_sederhana\n##SOAL 7\nKUNCI: A\nTEKS: x\nOPSI:\n- satu\n');
  assert.ok(r.errors.some((e) => /di luar blok/.test(e.pesan)));
  assert.ok(r.errors.some((e) => /OPSI kurang dari 2/.test(e.pesan) && e.baris === 0));
});
uji('opsi multiline menempel ke opsi sebelumnya, bukan jadi opsi baru', () => {
  const r = parseTemplatBaris('##SOAL 1\nKUNCI: A\nTEKS: t\nOPSI:\n- baris satu\n  lanjutan opsi\n- dua\n');
  assert.equal(r.soal[0].opsi_jawaban.length, 2);
  assert.match(r.soal[0].opsi_jawaban[0].teks, /lanjutan opsi/);
});

// 🔥 2026-10-29 (audit owner: wacana bersama tidak bisa diungkapkan di
// kontrak resmi templat baris — pihak ketiga terpaksa menumpuk wacana ke
// TEKS atau keluar dari kontrak): field opsional BACAAN: + GRUP-BACAAN:.
uji('BACAAN multiline + GRUP-BACAAN masuk field bacaan; TEKS tetap pertanyaan saja', () => {
  const r = parseTemplatBaris([
    'SKEMA: gemilang-baris@1',
    '##SOAL 1',
    'TIPE: pg_sederhana',
    'KUNCI: A',
    'GRUP-BACAAN: bacaan_1',
    'BACAAN:',
    'Baris wacana satu.',
    'Baris wacana dua $x^2$ apa adanya.',
    'TEKS:',
    'Pertanyaan tentang wacana?',
    'OPSI:',
    '- satu',
    '- dua',
  ].join('\n'));
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors));
  const q = r.soal[0];
  assert.deepEqual(q.bacaan, { teks: 'Baris wacana satu.\nBaris wacana dua $x^2$ apa adanya.', gambar: [], grup: 'bacaan_1' });
  assert.equal(q.teks_soal, 'Pertanyaan tentang wacana?');
});
uji('GRUP-BACAAN tanpa BACAAN tetap dibawa (pola irit: importer isi ulang dari master grup)', () => {
  const r = parseTemplatBaris('##SOAL 2\nKUNCI: B\nGRUP-BACAAN: bacaan_1\nTEKS: pertanyaan lanjut?\nOPSI:\n- a\n- b\n');
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors));
  assert.deepEqual(r.soal[0].bacaan, { teks: '', gambar: [], grup: 'bacaan_1' });
});
uji('soal tanpa BACAAN sama sekali: bacaan null (berkas lama tak berubah arti)', () => {
  const q = parseTemplatBaris(CONTOH).soal[0];
  assert.equal(q.bacaan, null);
});
uji('baris "- " di dalam BACAAN tidak dicuri jadi opsi', () => {
  const r = parseTemplatBaris('##SOAL 3\nKUNCI: A\nGRUP-BACAAN: b1\nBACAAN:\n- poin wacana satu\n- poin wacana dua\nTEKS: t?\nOPSI:\n- a\n- b\n');
  assert.equal(r.errors.length, 0, JSON.stringify(r.errors));
  assert.match(r.soal[0].bacaan.teks, /- poin wacana satu\n- poin wacana dua/);
  assert.equal(r.soal[0].opsi_jawaban.length, 2);
});

// ------------------------------------------------------------
// 🔥 2026-10-29 (insiden Kimia TKA 30 soal owner): field PERNYATAAN +
// fallback berkas lama. Keputusan owner: bug kontrak = perbaiki sistem;
// kesalahan pihak ketiga = biarkan gerbang menolak (parser TIDAK menambal).
// ------------------------------------------------------------
const BS_BARU = `SKEMA: gemilang-baris@1
##SOAL 1
TIPE: benar_salah
KUNCI: S,B,S
GAMBAR: tidak
TEKS:
Tentukan Benar/Salah tiap pernyataan!
PERNYATAAN:
- Rumus kimia hidrokarbon tersebut adalah $\\text{C}_4\\text{H}_{10}$.
- Strukturnya rantai lurus
  (n-butana).
- Titik didihnya lebih rendah dari isomernya.
PEMBAHASAN:
Pernyataan 1 dan 2 benar, pernyataan 3 salah.
`;
const BS_LAMA = `SKEMA: gemilang-baris@1
##SOAL 2
TIPE: benar_salah
KUNCI: B,S,B
GAMBAR: tidak
TEKS:
Tentukan Tepat/Tidak Tepat!
OPSI:
- Komposisi A menghasilkan 1,435 gram.
- Komposisi B menghasilkan 1,435 gram.
- Komposisi C menghasilkan 1,435 gram.
PEMBAHASAN:
Hanya komposisi B.
`;

uji('field PERNYATAAN terparse jadi objek pernyataan (bullet + lanjutan menjorok)', () => {
  const r = parseTemplatBaris(BS_BARU);
  assert.deepEqual(r.errors, [], JSON.stringify(r.errors));
  const q = r.soal[0];
  assert.equal(q.tipe, 'benar_salah');
  assert.equal(q.pernyataan.length, 3);
  assert.match(q.pernyataan[1].teks, /rantai lurus\n\(n-butana\)\./, 'lanjutan menjorok menempel ke pernyataan terakhir');
  assert.equal(q.opsi_jawaban.length, 0, 'tidak ada opsi pada soal benar_salah ber-field PERNYATAAN');
  assert.deepEqual(r.warnings, [], 'tidak ada warning bila kontrak diikuti');
});
uji('berkas lama benar_salah tanpa PERNYATAAN: OPSI dipindah jadi pernyataan + warning lunak', () => {
  const r = parseTemplatBaris(BS_LAMA);
  assert.deepEqual(r.errors, [], JSON.stringify(r.errors));
  const q = r.soal[0];
  assert.equal(q.pernyataan.length, 3, 'pernyataan diisi dari baris OPSI');
  assert.equal(q.pernyataan[0].teks, 'Komposisi A menghasilkan 1,435 gram.');
  assert.equal(q.opsi_jawaban.length, 0, 'opsi dikosongkan supaya tidak dobel hilir');
  assert.equal(r.warnings.length, 1);
  assert.equal(r.warnings[0].nomor, 2);
  assert.match(r.warnings[0].pesan, /OPSI dipakai sebagai pernyataan/);
});
uji('pg_sederhana TIDAK terkena fallback (opsi tetap opsi, tanpa warning)', () => {
  const r = parseTemplatBaris(CONTOH);
  const q = r.soal[0];
  assert.equal(q.opsi_jawaban.length, 2);
  assert.ok(!q.pernyataan || q.pernyataan.length === 0);
  assert.deepEqual(r.warnings, []);
});
uji('parser TIDAK menambal pihak ketiga: baris sitiran "[x.pdf ...]" dibiarkan utuh di teks (gerbang hilir yang menolak)', () => {
  const r = parseTemplatBaris('##SOAL 4\nTIPE: pg_sederhana\nKUNCI: A\nGAMBAR: tidak\nTEKS:\n[Safari.pdf — Kimia Simulasi No. 6, Hal. 165 & 652]\nDiketahui notasi dua macam unsur berikut:\nOPSI:\n- a\n- b\nPEMBAHASAN:\nx\n');
  assert.deepEqual(r.errors, [], JSON.stringify(r.errors));
  const teks = r.soal[0].teks_soal;
  assert.ok(teks.includes('[Safari.pdf — Kimia Simulasi No. 6, Hal. 165 & 652]'), 'sitiran tetap ada, tidak dibuang senyap');
  // Sinyal 1 gerbang impor (salin persis kondisi ImportHasilScanPage.jsx):
  assert.ok(/\.(pdf|docx?|xlsx?|pptx?)\b/i.test(teks), 'gerbang hilir tetap menolaknya -- penambalan bukan urusan parser');
  assert.deepEqual(r.warnings, [], 'parser tidak mengaku memperbaiki apa pun');
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
