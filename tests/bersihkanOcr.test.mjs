// tests/bersihkanOcr.test.mjs — pembersih sisa OCR jalur impor HTML Master
//     node tests/bersihkanOcr.test.mjs
// Semua contoh sampah di bawah DISALIN dari berkas nyata yang diimpor owner
// (50 soal UTBK TPS-PU, 2026-10-10), bukan dikarang.
import assert from 'node:assert/strict';
import { bersihkanOcrTeks, penandaiKualitasOcr } from '../src/utils/bersihkanOcr.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}
console.log('bersihkanOcr — sampah struktural dibuang, yang meragukan dicatat');

uji('penanda halaman & nomor yatim & simbol dibuang', () => {
  const masuk = [
    'Semua siswa kelas X dapat berbahasa Inggris.',
    'm5 Om>',
    '99',
    '=== PAGE 3 COL 2 ===',
    '9.',
    'AAL-SOAL',
    'Semua siswa kelas X yang menduduki ranking 10',
    '9 9',
    '&',
    'besar, juga harus dapat berbahasa Jepang.',
  ].join('\n');
  const { teks, catatan } = bersihkanOcrTeks(masuk);
  assert.ok(!/PAGE 3 COL 2/.test(teks));
  assert.ok(!/^9\.$/m.test(teks));
  assert.ok(!/AAL-SOAL/.test(teks));
  assert.ok(!/^&$/m.test(teks));
  assert.ok(!/^99$/m.test(teks));
  assert.ok(teks.includes('Semua siswa kelas X dapat berbahasa Inggris.'), 'kalimat asli tidak boleh ikut terbuang');
  assert.ok(teks.includes('besar, juga harus dapat berbahasa Jepang.'));
  assert.ok(catatan.some((c) => /struktural/.test(c)));
  assert.ok(catatan.some((c) => /m5 Om>/.test(c)), 'baris garbar dibuang TAPI dicatat');
});

uji('INVARIAN: teks bersih tidak berubah sama sekali', () => {
  const bersih = 'Semua tanaman memiliki buah.\nSebagian tanaman berbunga merah.\nSimpulan yang tepat adalah ...';
  const r = bersihkanOcrTeks(bersih);
  assert.equal(r.teks, bersih);
  assert.deepEqual(r.catatan, []);
});

uji('INVARIAN: kata terpotong TIDAK ditebak, hanya dicatat', () => {
  const masuk = [
    'Semua tanaman yang memiliki buah, berbunc',
    'bukan merah.',
    'Jawaba',
    'Siswa kelas X yang menduduki ranking 10',
    'besar harus dapat berbahasa Jepang, sehinc',
    'siswa yang tidak menduduki ranking 10 besé',
  ].join('\n');
  const { teks, catatan } = bersihkanOcrTeks(masuk);
  assert.ok(teks.includes('berbunc'), 'potongan kata TETAP ada -- admin yang memutuskan');
  assert.ok(catatan.some((c) => /terpotong/i.test(c) && /PERIKSA MANUAL/i.test(c)));
});

uji('opsi kebocoran lintas kolom ditandai, bukan dipotong', () => {
  const opsiPanjang = 'Sebagian mobil yang memiliki kemampuan menyimpan data besar tidak mudah rusak. '.repeat(10);
  const catatan = penandaiKualitasOcr({
    teksSoal: 'Semua komputer canggih menyimpan data besar.',
    opsi: ['Aman.', opsiPanjang],
  });
  assert.ok(catatan.some((c) => /opsi B sangat panjang/.test(c) || /opsi B.*diduga kemasukan/.test(c)), catatan.join(' | '));
});

uji('penandai mengumpulkan catatan dari teks soal, opsi, dan pembahasan', () => {
  const catatan = penandaiKualitasOcr({
    teksSoal: 'Soal bersih tanpa masalah.',
    opsi: ['a', 'b'],
    pembahasan: '=== PAGE 9 COL 2 ===\nJawaban bersih.',
  });
  assert.ok(catatan.some((c) => /pembahasan/.test(c) && /struktural/.test(c)));
});

uji('string kosong/null aman', () => {
  for (const v of ['', null, undefined, '   ']) {
    const r = bersihkanOcrTeks(v);
    assert.equal(typeof r.teks, 'string');
    assert.deepEqual(r.catatan, []);
  }
  assert.deepEqual(penandaiKualitasOcr(), []);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
