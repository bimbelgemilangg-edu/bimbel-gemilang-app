// tests/adaptorBukuLatex.test.mjs — regresi adaptor dialect HTML LaTeX
// + crop presisi (16 Okt 2026): sumber bermutu owner harus terpetakan
// utuh ke kontrak bab reader: latex asli, gambar crop, soal beropsi,
// kunci RESMI buku, dan SOLUSI sebagai pembahasan.
import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptorBukuLatex } from '../src/utils/adaptorBukuLatex.js';

const URI = 'data:image/png;base64,iVBORw0KGgo=';
const HTML = `<!DOCTYPE html><html><head><title>x</title></head><body>
<h1>Buku Digital Matematika Fase E (Kelas 10)</h1>
<h1>BAB 1: EKSPONEN</h1>
<h2>A. PENGERTIAN</h2>
<p>Bentuk $a^n$ artinya $a$ dikali $n$ kali.</p>
<img src="${URI}" alt="Grafik eksponen (Crop Presisi Hal. 3)" />
<blockquote><p>Contoh: $2^3 = 8$</p></blockquote>
<ul><li>sifat satu</li><li>sifat dua</li></ul>
<p><strong>1.</strong> Nilai $2^3$ adalah ....
* A. $6$
* B. $8$
* C. $9$</p>
<p><strong>Jawaban: B</strong></p>
<blockquote><p>💡 SOLUSI SMART! $2^3 = 8$ langsung.</p></blockquote>
<p><strong>2.</strong> Bentuk sederhana $\\dfrac{8}{2}$ adalah ....
* A. $2$
* B. $4$</p>
<p><strong>Kunci Jawaban Latihan Soal Bab 1 (Eksponen):</strong>
1:B | 2:A</p>
<h1>BAB 2: BENTUK AKAR</h1>
<p>Materi akar $\\sqrt{a}$.</p>
</body></html>`;

test('adaptorBukuLatex: bab/seksi/blok sesuai kontrak reader', () => {
  const { bab, statistik, judulBuku } = adaptorBukuLatex(HTML);
  assert.equal(judulBuku, 'Buku Digital Matematika Fase E (Kelas 10)');
  assert.equal(bab.length, 2);
  assert.equal(bab[0].judul, 'BAB 1: EKSPONEN');
  const tipe = bab[0].sections.flatMap((s) => s.blocks.map((b) => b.tipe)).join(',');
  assert.equal(tipe, 'p,gambar,contoh,list');
  assert.match(bab[0].sections[0].blocks[0].teks, /\$a\^n\$/);
  assert.equal(statistik.gambar, 1);
});

test('adaptorBukuLatex: soal beropsi + jawaban inline + SOLUSI jadi pembahasan', () => {
  const { bab } = adaptorBukuLatex(HTML);
  const q1 = bab[0].ujiPemahaman[0];
  assert.equal(q1.nomor, 1);
  assert.deepEqual(q1.pilihan, ['$6$', '$8$', '$9$']);
  assert.equal(q1.benar, 1, 'Jawaban: B inline');
  assert.equal(q1.kunciResmiBuku, true);
  assert.match(q1.pembahasan, /SOLUSI SMART/);
});

test('adaptorBukuLatex: peta kunci resmi terpasang per nomor', () => {
  const { bab, statistik } = adaptorBukuLatex(HTML);
  const q2 = bab[0].ujiPemahaman[1];
  assert.equal(q2.benar, 0, 'kunci 2:A dari peta');
  assert.equal(statistik.soal, 2);
  assert.equal(statistik.soalBerkunci, 2);
});

test('adaptorBukuLatex: bab tanpa latihan tetap ikut sebagai materi', () => {
  const { bab } = adaptorBukuLatex(HTML);
  assert.equal(bab[1].ujiPemahaman.length, 0);
  assert.ok(bab[1].sections[0].blocks[0].teks.includes('\\sqrt{a}'));
});
