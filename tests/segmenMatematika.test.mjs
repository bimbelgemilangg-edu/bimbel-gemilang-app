// tests/segmenMatematika.test.mjs
// ============================================================
// Test SATU SUMBER pemecahan segmen matematika (utils/segmenMatematika.js)
// dan PARITAS antar-permukaan render.
//
//     node tests/segmenMatematika.test.mjs
//
// KENAPA INI PENTING
// Audit owner 2026-10-23 ("pastikan tampilan soal asli dan rapi sampai di
// cetak, try out, dll semuanya") menemukan EMPAT pemecah berbeda: cetak buta
// terhadap \(..\)/\[..\] (mentah di kertas), try out buta terhadap $$
// multiline (mentah di layar), kebijakan ukuran pecahan beda antara kertas
// dan layar, dan guarda "$ " hanya ada di satu tempat. Kini semuanya memakai
// util ini; test memaku perilakunya supaya tidak ada permukaan yang diam-diam
// membelot lagi.
// ============================================================

import assert from 'node:assert/strict';
import {
  pecahSegmenMatematika,
  adaMatematika,
  sumberKaTeX,
} from '../src/utils/segmenMatematika.js';
import { teksKeHtml } from '../src/utils/naskahSoal.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

const jenis = (t) => pecahSegmenMatematika(t).map((s) => s.jenis);

// ------------------------------------------------------------
// 1. Keempat gaya delimiter dikenali, termasuk yang dulu buta
// ------------------------------------------------------------
uji('inline $...$ dikenali', () => {
  assert.deepEqual(jenis('Hasil $\\frac{1}{2}+\\frac{1}{3}$ adalah ....'), ['teks', 'inline', 'teks']);
});
uji('blok $$...$$ MULTILINE dikenali (dulu mentah di try out)', () => {
  const t = 'Rumus:\n$$\\begin{pmatrix} 1 \\\\ 2 \\end{pmatrix}$$\nselesai.';
  assert.deepEqual(jenis(t), ['teks', 'blok', 'teks']);
});
uji('blok \\[...\\] dikenali (dulu mentah di CETAK)', () => {
  assert.deepEqual(jenis('Nilai \\[x^2+1\\] berikut.'), ['teks', 'blok', 'teks']);
});
uji('inline \\(..\\) dikenali (dulu mentah di CETAK)', () => {
  assert.deepEqual(jenis('Nilai \\(x^2+1\\) berikut.'), ['teks', 'inline', 'teks']);
});
uji('isi segmen terlucut delimiter', () => {
  const seg = pecahSegmenMatematika('a $b+c$ d')[1];
  assert.equal(seg.isi, 'b+c');
});

// ------------------------------------------------------------
// 2. Guarda: dolar biasa bukan matematika
// ------------------------------------------------------------
uji('dolar diikuti spasi BUKAN awal math', () => {
  assert.deepEqual(jenis('bayar $ sekarang juga'), ['teks']);
});
uji('teks tanpa delimiter tetap satu segmen teks', () => {
  assert.deepEqual(jenis('Perhatikan pernyataan berikut.'), ['teks']);
});
uji('adaMatematika benar untuk campuran', () => {
  assert.equal(adaMatematika('nilai $x$ ya'), true);
  assert.equal(adaMatematika('nilai x ya'), false);
});

// ------------------------------------------------------------
// 3. Kebijakan ukuran SERAGAM (layar = kertas = buku)
// ------------------------------------------------------------
uji('inline bertingkat mendapat \\displaystyle (pecahan sebesar buku)', () => {
  assert.equal(sumberKaTeX({ jenis: 'inline', isi: '\\frac{1}{2}' }), '\\displaystyle \\frac{1}{2}');
});
uji('inline sederhana tetap rapat (tidak dipaksa displaystyle)', () => {
  assert.equal(sumberKaTeX({ jenis: 'inline', isi: 'x=5' }), 'x=5');
});
uji('blok selalu displaystyle', () => {
  assert.equal(sumberKaTeX({ jenis: 'blok', isi: 'x=5' }), '\\displaystyle x=5');
});

// ------------------------------------------------------------
// 4. PARITAS CETAK: naskahSoal.teksKeHtml kini merender semua gaya
//    (dulu \(..\)/\[..\] tercetak MENTAH di kertas)
// ------------------------------------------------------------
uji('cetak: inline $..$ jadi markup KaTeX', () => {
  const h = teksKeHtml('Hasil $\\frac{1}{2}+\\frac{1}{3}$ adalah ....');
  assert.match(h, /class="katex"/);
  // Sumber LaTeX boleh muncul HANYA di dalam <annotation> MathML (tak
  // terlihat); bagian terlihat tidak boleh memuat kode mentah.
  const terlihat = h.replace(/<annotation[\s\S]*?<\/annotation>/g, '');
  assert.ok(!terlihat.includes('\\frac'), 'tidak boleh ada LaTeX mentah yang terlihat');
});
uji('cetak: \\(..\\) TIDAK lagi mentah di kertas', () => {
  const h = teksKeHtml('Nilai \\(x^2+1\\) berikut.');
  assert.match(h, /class="katex"/);
  assert.ok(!h.includes('\\(x^2+1\\)'), 'delimiter tidak boleh lolos mentah');
});
uji('cetak: \\[..\\] TIDAK lagi mentah di kertas', () => {
  const h = teksKeHtml('Nilai \\[x^2+1\\] berikut.');
  assert.match(h, /class="katex"/);
  assert.ok(!h.includes('\\[x^2+1\\]'));
});
uji('cetak: teks polos tetap di-escape (keamanan HTML)', () => {
  const h = teksKeHtml('a < b & c > d');
  assert.ok(h.includes('&lt;') && h.includes('&amp;'));
});
uji('cetak: placeholder gambar dibuang seperti sebelumnya', () => {
  const h = teksKeHtml('lihat {{GAMBAR_1}} ya');
  assert.ok(!h.includes('{{GAMBAR'));
});

uji('CETAK: ganti baris naskah buku menjadi <br> (2026-10-27)', () => {
  const h = teksKeHtml('Langkah:\n$2^3=8$\nJadi delapan.');
  assert.match(h, /Langkah:<br>/);
  assert.match(h, /<br>Jadi delapan/);
});

console.log('');
console.log(`# segmenMatematika: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
