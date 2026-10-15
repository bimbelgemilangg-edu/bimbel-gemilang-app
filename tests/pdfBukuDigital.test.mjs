// tests/pdfBukuDigital.test.mjs — regresi fitur pratinjau/unduh PDF buku
// (16 Okt 2026): urutan & isi baris PDF dipaku tanpa browser.
import test from 'node:test';
import assert from 'node:assert/strict';
import { susunBarisPdfBab, namaFilePdfBuku } from '../src/utils/pdfBukuDigital.js';

const bab = {
  judul: 'Bab 1 Eksponen',
  sections: [
    {
      id: 's1',
      judul: 'A. Pengertian',
      blocks: [
        { tipe: 'p', teks: 'Eksponen adalah pangkat.' },
        { tipe: 'contoh', teks: '2^3 = 8' },
        { tipe: 'gambar', src: 'https://cdn/x.png', caption: 'grafik' },
        { tipe: 'list', items: ['satu', 'dua'] },
        { tipe: 'tips', teks: 'ingat sifat dasar' },
      ],
    },
  ],
  ujiPemahaman: [
    { id: 'q1', tipe: 'pg', soal: '2^3?', pilihan: ['6', '8'], benar: 1, gambar: { src: 'https://cdn/q.png' } },
  ],
};

test('susunBarisPdfBab: urutan h1 -> h2 -> blok -> soal -> kunci', () => {
  const b = susunBarisPdfBab(bab);
  assert.equal(b[0].tipe, 'h1');
  assert.equal(b[0].teks, 'Bab 1 Eksponen');
  assert.equal(b[1].tipe, 'h2');
  const tipeUrut = b.map((x) => x.tipe).join(',');
  assert.match(tipeUrut, /^h1,h2,p,contoh,gambar,p,p,tips,h2,soal,gambar,opsi,opsi,kunci$/);
});

test('susunBarisPdfBab: kunci memakai huruf dari indeks benar', () => {
  const b = susunBarisPdfBab(bab);
  const kunci = b.find((x) => x.tipe === 'kunci');
  assert.equal(kunci.teks, 'Kunci: 1-B');
});

test('susunBarisPdfBab: bab tanpa soal tidak punya seksi uji & kunci', () => {
  const b = susunBarisPdfBab({ judul: 'X', sections: [{ blocks: [{ tipe: 'p', teks: 'a' }] }] });
  assert.ok(!b.some((x) => x.tipe === 'kunci'));
  assert.ok(!b.some((x) => x.tipe === 'soal'));
});

test('namaFilePdfBuku: slug aman untuk filesystem', () => {
  assert.equal(
    namaFilePdfBuku('Buku Matematika Fase E Kelas 10', 'Bab 8 Teori Peluang'),
    'buku-matematika-fase-e-kelas-10--bab-8-teori-peluang.pdf',
  );
  assert.match(namaFilePdfBuku('', ''), /\.pdf$/);
});
