// tests/adaptorProyekScan.test.mjs — regresi mode 📂 folder proyek scan
// (17 Okt 2026): manifes document.json memisahkan halaman utuh vs figur,
// subset main.tex jadi bab reader, fallback buku-halaman, dan penggabungan
// beberapa root folder jadi satu kesatuan.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseMainTex, petaManifes, proyekScanKeBab, gabungProyekScan,
} from '../src/utils/adaptorProyekScan.js';

const DOK = {
  pages: [
    {
      number: 1, width: 100, height: 100,
      blocks: [
        { image: 'images/page-001-image-001.png', bbox: [0, 0, 100, 100] }, // halaman utuh
        { image: 'images/page-001-image-002.jpeg', bbox: [10, 10, 30, 30] }, // figur
      ],
    },
    { number: 2, width: 100, height: 100, blocks: [{ image: 'images/page-002-image-001.png', bbox: [0, 0, 100, 100] }] },
  ],
};

const TEX = `
% komentar diabaikan
\\chapter{Eksponen}
\\section{Pengertian}
Bentuk $a^n$ dengan $n$ faktor.
\\includegraphics[width=6cm]{images/page-001-image-002.jpeg}
\\begin{itemize}
\\item sifat satu
\\item sifat dua
\\end{itemize}
\\begin{align*}
a^n = a \\times a
\\end{align*}
\\section{Lanjutan}
Teks lanjutan.
`;

test('petaManifes: halaman utuh vs figur dari rasio bbox', () => {
  const { halaman, figur } = petaManifes(DOK);
  assert.equal(halaman.size, 2);
  assert.equal(halaman.get('images/page-001-image-001.png'), 1);
  assert.equal(figur.size, 1);
  assert.equal(figur.get('images/page-001-image-002.jpeg').halaman, 1);
});

test('parseMainTex: chapter/section/gambar/list/math subset', () => {
  const { bab } = parseMainTex(TEX);
  assert.equal(bab.length, 1);
  assert.equal(bab[0].judul, 'Eksponen');
  assert.equal(bab[0].sections.length, 3, 'seksi awal chapter + 2 section');
  const tipe = bab[0].sections[1].blocks.map((b) => b.tipe).join(',');
  assert.equal(tipe, 'p,gambar,list,math');
  assert.equal(bab[0].sections[1].blocks[1].src, 'tex:images/page-001-image-002.jpeg');
  assert.deepEqual(bab[0].sections[1].blocks[2].items, ['sifat satu', 'sifat dua']);
  assert.match(bab[0].sections[1].blocks[3].teks, /a\^n = a \\times a/);
});

test('proyekScanKeBab: tex dikenali -> hanya gambar TERRUJUK yang diunggah', () => {
  const { bab, gambarDiperlukan, statistik } = proyekScanKeBab({ dokumen: DOK, tex: TEX });
  assert.equal(statistik.fallback, false);
  assert.equal(bab.length, 1);
  assert.deepEqual(gambarDiperlukan, ['images/page-001-image-002.jpeg'], 'halaman utuh tidak ikut diunggah bila tak dirujuk');
});

test('proyekScanKeBab: tanpa tex -> fallback buku halaman urut manifes', () => {
  const { bab, statistik, gambarDiperlukan } = proyekScanKeBab({ dokumen: DOK });
  assert.equal(statistik.fallback, true);
  assert.equal(bab.length, 1, '2 halaman muat satu grup');
  assert.equal(bab[0].judul, 'Halaman 1–2');
  assert.equal(gambarDiperlukan.length, 2);
});

test('gabungProyekScan: dua root jadi satu kesatuan, urut nomor bab', () => {
  const texA = '\\chapter{A satu}\nIsi.\n\\chapter{A dua}\nIsi.\n';
  const texB = '\\chapter{B satu}\nIsi.\n';
  const gab = gabungProyekScan([
    { root: 'folderA', dokumen: { pages: [] }, tex: texA },
    { root: 'folderB', dokumen: { pages: [] }, tex: texB },
  ]);
  assert.equal(gab.statistik.root, 2);
  assert.deepEqual(gab.bab.map((b) => b.judul), ['A satu', 'B satu', 'A dua'], 'sort stabil per nomorBab lintas root');
  assert.deepEqual(gab.bab.map((b) => b.rootAsal), ['folderA', 'folderB', 'folderA']);
  assert.ok(gab.gambarPerRoot.has('folderA') && gab.gambarPerRoot.has('folderB'));
});
