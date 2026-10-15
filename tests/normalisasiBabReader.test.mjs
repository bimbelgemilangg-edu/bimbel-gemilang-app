// tests/normalisasiBabReader.test.mjs — pembedahan 15 Okt 2026:
// memaku KONTRAK BACA bab digital (BukuBacaPage.renderBlok & quiz).
// Regresi lapangan: bab impor pernah tersimpan memakai block `jenis`
// (reader merender null => bab kosong) dan tanpa id seksi/soal
// (navigasi & jawaban quiz bocor antar-soal).
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalkanBabUntukReader, TIPE_BLOK_READER } from '../src/utils/normalisasiBabReader.js';

test('alias jenis->tipe untuk block warisan, tipe asli tidak ditimpa', () => {
  const bab = normalkanBabUntukReader({
    judul: 'Bab 1',
    sections: [{ blocks: [{ jenis: 'p', teks: 'a' }, { jenis: 'gambar', src: 'u' }, { tipe: 'math', teks: 'x' }, { jenis: 'aneh', teks: 'y' }] }],
  }, 'Bab 1');
  const b = bab.sections[0].blocks;
  assert.equal(b[0].tipe, 'p');
  assert.equal(b[1].tipe, 'gambar');
  assert.equal(b[2].tipe, 'math');
  assert.equal(b[3].tipe, 'aneh', 'nilai eksotik dibiarkan apa adanya (widget interaktif dll)');
  assert.equal(b[0].jenis, 'p', 'field lama tidak dibuang (editor lama tetap baca)');
});

test('id seksi & soal diisi deterministik bila kosong', () => {
  const bab = normalkanBabUntukReader({
    judul: 'Vektor',
    sections: [{ judul: 'A' }, { id: 'punya-sendiri', judul: 'B' }],
    ujiPemahaman: [{ tipe: 'pg', soal: 'x', pilihan: ['a', 'b'], benar: 0 }, { id: 'qX', tipe: 'pg' }],
  }, 'Vektor');
  assert.equal(bab.sections[0].id, 'vektor-s1');
  assert.equal(bab.sections[1].id, 'punya-sendiri');
  assert.equal(bab.ujiPemahaman[0].id, 'vektor-q1');
  assert.equal(bab.ujiPemahaman[1].id, 'qX');
});

test('gambarUrls[0] menjadi gambar tunggal untuk reader, array tetap utuh', () => {
  const bab = normalkanBabUntukReader({
    judul: 'B',
    ujiPemahaman: [{ tipe: 'pg', gambarUrls: ['https://cdn/x.png', 'https://cdn/y.png'] }],
  }, 'B');
  const q = bab.ujiPemahaman[0];
  assert.equal(q.gambar.src, 'https://cdn/x.png');
  assert.equal(q.gambarUrls.length, 2, 'kontrak bank soal tidak dirusak');
});

test('kontrak reader: hasil normalisasi lulus semua tuntutan renderBlok & quiz', () => {
  const bab = normalkanBabUntukReader({
    judul: 'Bab 8 Teori Peluang',
    sections: [{ blocks: [{ jenis: 'contoh', teks: 'Contoh soal' }] }],
    ujiPemahaman: [{ tipe: 'pg', soal: 'Nilai n?', pilihan: ['1', '2'], benar: 1, gambarUrls: ['g.png'] }],
  }, 'Bab 8 Teori Peluang');
  for (const sek of bab.sections) {
    assert.ok(sek.id, 'seksi ber-id');
    for (const bl of sek.blocks) assert.ok(bl.tipe, 'block ber-tipe');
  }
  for (const q of bab.ujiPemahaman) {
    assert.ok(q.id, 'soal ber-id');
    assert.equal(q.tipe, 'pg');
    assert.ok(q.pilihan.length >= 2 && q.benar >= 0 && q.benar < q.pilihan.length);
    assert.ok(q.gambar && q.gambar.src);
  }
  assert.ok(TIPE_BLOK_READER.includes('gambar'));
});
