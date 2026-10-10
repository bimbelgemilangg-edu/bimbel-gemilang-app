// tests/bersihkanOcr.test.mjs — pembersih sisa OCR jalur impor HTML Master
//     node tests/bersihkanOcr.test.mjs
// Semua contoh sampah di bawah DISALIN dari berkas nyata yang diimpor owner
// (50 soal UTBK TPS-PU, 2026-10-10), bukan dikarang.
import assert from 'node:assert/strict';
import { bersihkanOcrTeks, penandaiKualitasOcr, buangDuplikatOpsiDariTeks } from '../src/utils/bersihkanOcr.js';

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

uji('REGRESI kasus nyata soal 2: salinan opsi di dalam teks soal dibuang', () => {
  // Disalin dari berkas owner: Gemini menaruh kelima opsi JUGA di dalam
  // teks_soal (tanpa awalan huruf, satu opsi terpotong pergantian baris,
  // satu baris bersampah ". _").
  const teks = [
    'Di akhir pekan, keluarga Sumadi selalu pergi',
    'berwisata.',
    'Tidak semua tempat wisata yang dikunjungi terletak',
    'di luar kota.',
    'Simpulan yang tepat tentang kegiatan keluarga',
    'Sumadi di akhir pekan, adalah...',
    'selalu pergi berwisata bukan di luar kota.',
    '. _ selalu pergi berwisata di luar kota.',
    'tidak selalu berwisata, kecuali bukan di luar',
    'kota',
    'tidak selalu berwisata, kecuali di luar kota.',
    'selalu pergi berwisata, di luar kota atau bukan',
    'di luar kota.',
  ].join('\n');
  const opsi = [
    'selalu pergi berwisata bukan di luar kota.',
    'selalu pergi berwisata di luar kota.',
    'tidak selalu berwisata, kecuali bukan di luar kota.',
    'tidak selalu berwisata, kecuali di luar kota.',
    'selalu pergi berwisata, di luar kota atau bukan di luar kota.',
  ];
  const bersih = bersihkanOcrTeks(teks);
  const hasil = buangDuplikatOpsiDariTeks(bersih.teks, opsi);
  assert.ok(!/berwisata bukan di luar kota/.test(hasil.teks), 'salinan opsi harus hilang');
  assert.ok(hasil.teks.includes('Di akhir pekan, keluarga Sumadi selalu pergi berwisata.'), 'reflow menyambung potongan baris');
  assert.ok(hasil.teks.includes('Simpulan yang tepat tentang kegiatan keluarga Sumadi di akhir pekan, adalah...'));
  assert.ok(hasil.catatan.some((c) => /salinan opsi/.test(c)));
});

uji('INVARIAN: teks yang tidak menduplikat opsi tidak berubah', () => {
  const teks = 'Semua tanaman memiliki buah.\nSebagian tanaman berbunga merah.\nSimpulan yang tepat adalah ...';
  const hasil = buangDuplikatOpsiDariTeks(teks, ['semua tanaman yang memiliki buah, berbunga merah.', 'x'.repeat(40)]);
  assert.equal(hasil.teks, teks);
  assert.deepEqual(hasil.catatan, []);
});

uji('opsi pendek tidak dipakai sebagai pisau bedah', () => {
  // Opsi < 20 karakter bisa saja kebetulan menjadi bagian kalimat sah.
  const teks = 'Berapakah hasil dari 2 + 2? Jelaskan langkahnya.';
  const hasil = buangDuplikatOpsiDariTeks(teks, ['2 + 2', '4']);
  assert.equal(hasil.teks, teks);
});

uji('watermark slogan buku dibuang (kasus nyata bab 2)', () => {
  const masuk = [
    'Jika seorang guru menjadi idola para murid, guru',
    'tersebut santun dalam bertutur kata.',
    'HASIL MBKSIMAL',
    'Jika seorang guru berkata kasar, mementingkan',
    'BELAJAR MINIMAL,',
    'dirinya sendiri.',
  ].join('\n');
  const { teks, catatan } = bersihkanOcrTeks(masuk);
  assert.ok(!/MBKSIMAL|MINIMAL,/.test(teks), 'slogan harus hilang');
  assert.ok(teks.includes('tersebut santun dalam bertutur kata.'));
  assert.ok(catatan.some((c) => /struktural/.test(c)));
});

uji('pembahasan tertukar terdeteksi dari kode sumbernya', () => {
  const catatan = penandaiKualitasOcr({
    teksSoal: '[UTBK2024/TPS/PU/GEL.2/63] Eksploitasi minyak bumi di Pulau X ...',
    pembahasan: 'UTBK2024/TPS/PU/GEL.2/69 Apabila jumlah pengunjung ...',
  });
  assert.ok(catatan.some((c) => /tertukar/.test(c)), catatan.join(' | '));
});

uji('pembahasan yang kodonya cocok tidak dituduh', () => {
  const catatan = penandaiKualitasOcr({
    teksSoal: '[UTBK2024/TPS/PU/GEL.2/63] Eksploitasi minyak bumi ...',
    pembahasan: 'UTBK2024/TPS/PU/GEL.2/63 Eksploitasi minyak bumi di Pulau X menyebabkan ...',
  });
  assert.ok(!catatan.some((c) => /tertukar/.test(c)));
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
