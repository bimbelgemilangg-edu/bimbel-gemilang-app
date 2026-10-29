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

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
