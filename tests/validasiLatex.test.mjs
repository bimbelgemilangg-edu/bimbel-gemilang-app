// tests/validasiLatex.test.mjs
// ============================================================
// Test gerbang STANDAR SINTAKS LATEX (src/utils/validasiLatex.js).
//
//     node tests/validasiLatex.test.mjs
//
// KENAPA INI PENTING
// Keputusan owner 2026-10-23: prompt impor adalah kontrak; pihak ketiga
// wajib tunduk; sistem MENOLAK keluaran yang melanggar dan TIDAK menambalnya.
// Gerbang ini yang membuat penolakan itu terukur dan berpesan jelas, bukan
// sekadar render merah tanpa penjelasan. Fixture diambil apa adanya dari
// berkas keluaran Gemini yang dikirim owner 2026-10-23.
//
// Test memaku dua arah: pelanggaran TERDETEKSI (lengket, U+0338), dan
// LaTeX sahih TIDAK ikut tertolak (tidak ada false positive yang akan
// menolak soal patuh -- itu justru mengulang kesalahan melunakkan sistem).
// ============================================================

import assert from 'node:assert/strict';
import { periksaLatex, periksaLatexSoal } from '../src/utils/validasiLatex.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

// ------------------------------------------------------------
// 1. Pelanggaran template TERDETEKSI
// ------------------------------------------------------------
uji('macro lengket \\rightarrowa ditolak', () => {
  const t = periksaLatex('Jadi $\\rightarrowa=18$ dan $b=-15$.');
  assert.equal(t.length, 1);
  assert.match(t[0].segmen, /rightarrowa/);
});
uji('span persis screenshot owner ditolak', () => {
  const t = periksaLatex('Titik $A(24,-30)\\rightarrowx=-2,y=5$');
  assert.equal(t.length, 1);
});
uji('negasi solidus gabung U+0338 ditolak', () => {
  assert.equal(periksaLatex('$152̸=180$').length, 1);
  assert.equal(periksaLatex('$\\frac{1}{2}2̸2$').length, 1);
});
uji('pesan temuan menyebut sebab dari KaTeX', () => {
  const t = periksaLatex('$\\rightarrowa=18$');
  assert.ok(t[0].pesan.length > 0);
});

// ------------------------------------------------------------
// 2. LaTeX sahih TIDAK tertolak (penjaga false positive)
// ------------------------------------------------------------
for (const t of [
  '$\\frac{1}{2}$', '$\\leq$', '$\\ell$', '$\\int x\\,dx$', '$\\text{luas}$',
  '$\\lim_{x\\to 0}$', '$\\Rightarrow x$', '$\\rightarrow a=18$', '$152 \\ne 180$',
  '$$\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$$', '\\(x^2+1\\)', '$225^{\\frac12}=15$',
]) {
  uji(`LaTeX sahih tidak ditolak: ${t.slice(0, 34)}`, () => {
    assert.deepEqual(periksaLatex(t), []);
  });
}
uji('teks tanpa math tidak diperiksa dan tidak ditolak', () => {
  assert.deepEqual(periksaLatex('Perhatikan pernyataan berikut.'), []);
});

// ------------------------------------------------------------
// 3. periksaLatexSoal menyebut field pelanggarannya
// ------------------------------------------------------------
uji('field pelanggaran dilaporkan per nama field', () => {
  const t = periksaLatexSoal({
    teks_soal: 'Nilai $\\pir$ adalah ....',
    opsi_jawaban: [{ teks: '$4$' }, { teks: '$\\timest$' }],
    pembahasan: 'Jadi $152̸=180$.',
  });
  const fields = t.map((x) => x.field);
  assert.deepEqual(fields, ['teks soal', 'opsi B', 'pembahasan']);
});
uji('butir patuh lolos tanpa temuan', () => {
  const t = periksaLatexSoal({
    teks_soal: 'Hasil dari $3^3 \\times 3^2 = \\ldots$',
    opsi_jawaban: [{ teks: '$15$' }, { teks: '$27$' }, { teks: '$243$' }, { teks: '$729$' }],
    pembahasan: '$3^{3+2}=3^5=243$. Jawaban: C',
  });
  assert.deepEqual(t, []);
});

console.log('');
console.log(`# validasiLatex: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
