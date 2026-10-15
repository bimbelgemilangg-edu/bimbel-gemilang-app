// tests/parseTeksBuku.test.mjs — mode teks OCR (bebas kuota AI vision)
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTeksBuku, htmlKeTeks, susunTeksDariItem, bersihkanTeksOcr } from '../src/utils/parseTeksBuku.js';

const TEKS = `
Sampul buku tidak penting
BAB 2 PERSAMAAN KUADRAT
A. Definisi
Persamaan kuadrat adalah persamaan berderajat dua
dalam variabel x. Bentuk umumnya ax^2 + bx + c = 0.
Contoh:
Tentukan akar dari x^2 - 9 = 0 dengan memfaktorkan.
B. Latihan
1. Akar-akar x^2 - 9 = 0 adalah ...
a. 2 dan -2
b. 3 dan -3
c. 4 dan -4
d. 9 dan -9
Kunci: B
Pembahasan: x^2-9=(x-3)(x+3) sehingga akar 3 dan -3.
2. Jumlah akar x^2 - 5x + 6 = 0 adalah ...
(A) 5
(B) 6
(C) -5
(D) 1
Jawaban: A
Pembahasan: x1+x2 = -b/a = 5.
BAB 3 TRIGONOMETRI
Sinus dan cosinus periodik.
`;

test('bab, subbab, contoh, dan paragraf terbaca', () => {
  const { bab } = parseTeksBuku(TEKS);
  assert.equal(bab.length, 2);
  assert.match(bab[0].judul, /PERSAMAAN KUADRAT/);
  const judulSeksi = bab[0].sections.map((s) => s.judul);
  assert.ok(judulSeksi.some((j) => /Definisi/.test(j)));
  const semuaBlok = bab[0].sections.flatMap((s) => s.blocks);
  assert.ok(semuaBlok.some((b) => b.tipe === 'contoh'), 'blok contoh terdeteksi (kontrak reader: field tipe)');
  assert.ok(semuaBlok.some((b) => b.tipe === 'p' && /Bentuk umumnya/.test(b.teks)));
  assert.ok(bab[0].sections.every((s2) => s2.id), 'setiap seksi punya id (navigasi reader)');
  assert.ok(bab[0].ujiPemahaman.every((q) => q.id), 'setiap soal punya id (kunci jawaban quiz)');
});

test('soal pg: pilihan a-d dan (A)-(D), kunci & pembahasan tertangkap', () => {
  const { bab } = parseTeksBuku(TEKS);
  const soal = bab[0].ujiPemahaman;
  assert.equal(soal.length, 2);
  assert.equal(soal[0].pilihan.length, 4);
  assert.equal(soal[0].benar, 1, 'Kunci B = index 1');
  assert.match(soal[0].pembahasan, /akar 3 dan -3/);
  assert.equal(soal[1].benar, 0, 'Jawaban A = index 0');
  assert.match(soal[1].pembahasan, /= 5/);
});

test('soal tanpa kunci DIBUANG jujur (tidak menebak)', () => {
  const { bab } = parseTeksBuku(`BAB 1 X
Materi pengantar bab supaya bab tidak kosong.
1. Soal tanpa kunci?
a. satu
b. dua
`);
  assert.equal(bab[0].ujiPemahaman.length, 0);
});

test('htmlKeTeks melucuti tag jadi baris teks', () => {
  const t = htmlKeTeks('<p>BAB 1 A</p><p>1. Soal?<br>(A) x (B) y</p><p>Kunci: A</p>');
  assert.match(t, /BAB 1 A/);
  const { bab } = parseTeksBuku(t);
  assert.equal(bab[0].ujiPemahaman.length, 1);
});

test('susunTeksDariItem: huruf OCR berposisi jadi kata & baris benar', () => {
  const items = [
    { str: 'Na', transform: [1, 0, 0, 1, 10, 100], width: 20 },
    { str: 'mai', transform: [1, 0, 0, 1, 31, 100], width: 30 },
    { str: 'ku', transform: [1, 0, 0, 1, 70, 100], width: 20 },
    { str: 'B', transform: [1, 0, 0, 1, 10, 80], width: 10 },
    { str: 'AB', transform: [1, 0, 0, 1, 40, 80], width: 20 },
  ];
  const t = susunTeksDariItem(items);
  assert.match(t, /Namai ku/);
  assert.match(t, /B AB/);
});

test('parser mencatat nomor halaman dari penanda (untuk lampiran figur)', () => {
  const t = `--- HALAMAN 12 ---
BAB 1 X
1. Soal bergambar?
a. satu
b. dua
Kunci: A
--- HALAMAN 13 ---
2. Soal halaman 13?
a. satu
b. dua
Kunci: B
`;
  const { bab } = parseTeksBuku(t);
  assert.equal(bab[0].ujiPemahaman[0].halaman, 12);
  assert.equal(bab[0].ujiPemahaman[1].halaman, 13);
});

test('bersihkanTeksOcr: spasi ganda, nomor halaman, hyphen putus', () => {
  const bersih = bersihkanTeksOcr('kata  ganda\n297\npotong-\nbarís');
  assert.ok(!bersih.split('\n').includes('297'), 'nomor halaman sendirian dibuang');
  assert.match(bersih, /kata ganda/);
  assert.match(bersih, /potongbarís/);
});
