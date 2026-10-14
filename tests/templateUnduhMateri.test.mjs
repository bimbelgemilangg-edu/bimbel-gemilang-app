// tests/templateUnduhMateri.test.mjs — unduhan materi berlogo Gemilang
import test from 'node:test';
import assert from 'node:assert/strict';
import { htmlUnduhMateriGemilang, LOGO_GEMILANG } from '../src/utils/templateUnduhMateri.js';

const bab = {
  judul: 'Persamaan Kuadrat',
  sections: [{
    judul: 'A. Definisi',
    blocks: [
      { jenis: 'kilat', teks: 'Bentuk umum ax^2+bx+c=0' },
      { jenis: 'paragraf', teks: 'Persamaan kuadrat punya akar-akar.' },
      { jenis: 'rumus', teks: 'x = (-b ± √(b²-4ac)) / 2a' },
      { jenis: 'gambar', alt: 'grafik parabola' },
      { jenis: 'jahat', teks: '<script>alert(1)</script>' },
    ],
  }],
};

test('template memuat kop logo Gemilang, identitas, dan isi bab', () => {
  const html = htmlUnduhMateriGemilang({ judulBuku: 'Buku Gemilang Vol.1', mapel: 'Matematika', jenjang: 'SMA/MA', kelas: '10', bab });
  assert.ok(html.includes(LOGO_GEMILANG), 'logo Gemilang wajib ada');
  assert.match(html, /BIMBEL GEMILANG/);
  assert.match(html, /Persamaan Kuadrat/);
  assert.match(html, /Kelas 10/);
  assert.match(html, /grafik parabola/);
});

test('template meng-escape isi berbahaya (XSS lewat konten buku)', () => {
  const html = htmlUnduhMateriGemilang({ bab });
  assert.ok(!html.includes('<script>alert(1)</script>'), 'script wajib di-escape');
  assert.ok(html.includes('&lt;script&gt;'));
});
