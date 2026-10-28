// tests/kelayakanSoal.test.mjs — gerbang "tidak layak tampil"
//     node tests/kelayakanSoal.test.mjs
// Fixture mengikuti bentuk kerusakan NYATA naskah TKA Matematika Lanjut
// (owner 2026-10-28): opsi gambar hilang, gambar rujukan hilang, LaTeX rusak.
import assert from 'node:assert/strict';
import { alasanKelayakan, layakSoal } from '../src/utils/kelayakanSoal.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('kelayakanSoal — gerbang butir layak tampil');

const sehat = {
  tipe: 'pg_sederhana',
  teks_soal: 'Diketahui matriks $A=\\begin{pmatrix} -1 & 2 \\\\ 3 & 4 \\end{pmatrix}$. Inversnya adalah ....',
  opsi_jawaban: [{ teks: '$\\begin{pmatrix} -2 & 3 \\\\ 1 & -1 \\end{pmatrix}$' }, { teks: '$\\begin{pmatrix} 2 & -3 \\\\ -1 & 1 \\end{pmatrix}$' }],
  kunci_jawaban: 'A',
  pembahasan: 'det $A=-11$. Jawaban: A',
};

uji('butir sehat lolos', () => {
  assert.deepEqual(alasanKelayakan(sehat), []);
  assert.equal(layakSoal(sehat), true);
});
uji('kasus soal 15 sumber: opsi gambar hilang -> opsi kosong, DITOLAK', () => {
  const r = alasanKelayakan({ ...sehat, opsi_jawaban: [{ teks: '' }, { teks: '' }, { teks: '' }] });
  assert.ok(r.some((x) => /opsi bermakna hanya 0/.test(x)), r.join('|'));
});
uji('kasus soal 17/21 sumber: menunjuk gambar tanpa visual, DITOLAK', () => {
  const r = alasanKelayakan({ ...sehat, teks_soal: 'Perhatikan gambar segiempat PQRS berikut! Panjang diagonalnya ....' });
  assert.ok(r.some((x) => /menunjuk gambar/.test(x)), r.join('|'));
});
uji('LaTeX rusak (macro lengket) DITOLAK', () => {
  const r = alasanKelayakan({ ...sehat, teks_soal: 'Hasil $\\rightarrowa=18$ adalah ....' });
  assert.ok(r.some((x) => /LaTeX/.test(x)), r.join('|'));
});
uji('pembahasan kosong DITOLAK', () => {
  assert.ok(alasanKelayakan({ ...sehat, pembahasan: '' }).some((x) => /pembahasan kosong/.test(x)));
});
uji('kunci di luar opsi DITOLAK', () => {
  assert.ok(alasanKelayakan({ ...sehat, kunci_jawaban: 'E' }).some((x) => /kunci tidak menunjuk/.test(x)));
});
uji('opsi kembar identik DITOLAK', () => {
  const r = alasanKelayakan({ ...sehat, opsi_jawaban: [{ teks: '4' }, { teks: '4' }] });
  assert.ok(r.some((x) => /identik/.test(x)), r.join('|'));
});
uji('butir dengan gambar pada opsi tetap layak (grafik terbawa)', () => {
  const r = alasanKelayakan({
    ...sehat,
    teks_soal: 'Di bawah ini yang merupakan grafik $y=\\sin(2x)$ adalah ....',
    opsi_jawaban: [{ teks: '', gambar: [{ url: 'https://x/g1.png' }] }, { teks: '', gambar: [{ url: 'https://x/g2.png' }] }],
  });
  assert.deepEqual(r, [], r.join('|'));
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
