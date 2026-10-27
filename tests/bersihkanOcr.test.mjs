// tests/bersihkanOcr.test.mjs — pembersih sisa OCR jalur impor HTML Master
//     node tests/bersihkanOcr.test.mjs
// Semua contoh sampah di bawah DISALIN dari berkas nyata yang diimpor owner
// (50 soal UTBK TPS-PU, 2026-10-10), bukan dikarang.
import assert from 'node:assert/strict';
import { bersihkanOcrTeks, penandaiKualitasOcr, buangDuplikatOpsiDariTeks, lengkapEkorJawaban } from '../src/utils/bersihkanOcr.js';

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

uji('REGRESI: baris kode sumber tidak boleh tertelan aturan garbar', () => {
  // Insiden 2026-10-10: "[SNMPTN 2009/TPA/392/22]" punya rasio vokal rendah
  // sehingga dikira rácak OCR dan dibuang -- preview kehilangan kepala soal.
  for (const kode of [
    '[SNMPTN 2009/TPA/392/22]',
    'SNMPTN 2010/TPA/942/17',
    '[SBMPTN 2019/UTBK I/TPS/PU/01]',
    'UTBK2024/TPS/PU/GEL.2/63',
  ]) {
    const r = bersihkanOcrTeks(`${kode}\nIkan A hidup di air tawar.\nIkan C hidup di air laut.`);
    assert.ok(r.teks.includes(kode), `kode hilang: ${kode} -> ${r.teks}`);
  }
});

// ============================================================
// REGRESI berkas bab 1 UTBK TPS-PU (koreksi owner, 2026-10-10).
// Tiga kerusakan nyata yang semuanya MENGHILANGKAN ISI SOAL:
// ============================================================

uji('REGRESI soal 48/32/35: baris frasa asli TIDAK dimakan aturan garbar', () => {
  // "yang PALING TEPAT?" (soal 48), "yang benar?" (soal 32), "kencang."
  // (soal 35) dulu dibuang karena rasio vokalnya < 0.34. Soal 48 kehilangan
  // seluruh kalimat pertanyaannya, soal 32 kehilangan SELURUH isi soal.
  for (const b of ['yang PALING TEPAT?', 'yang benar?', 'kencang.', 'PALING BENAR?', 'm sil']) {
    const r = bersihkanOcrTeks(b);
    if (b === 'm sil') {
      assert.ok(!r.teks.includes('m sil'), `"${b}" adalah rácak, harus dibuang`);
      assert.ok(r.catatan.some((c) => c.includes('baris sisa OCR dibuang')));
    } else {
      assert.ok(r.teks.includes(b), `"${b}" teks asli, tidak boleh dibuang`);
    }
  }
});

uji('rácak kolom yang pasti tetap dibuang + dicatat', () => {
  // CATATAN: "= Jawaban f" SENGAJA tidak di sini -- itu baris jawaban buku
  // yang hurufnya rusak; membuangnya berarti menghilangkan penutup
  // pembahasan. Ia ditangani lengkapEkorJawaban (uji di bawah).
  for (const b of ['m5 Om>', 'xP ~ xQ', 'm sil', 'q7rT']) {
    const r = bersihkanOcrTeks(b);
    assert.ok(!r.teks.includes(b), `"${b}" seharusnya dibuang`);
    assert.ok(r.catatan.length > 0, `pembuangan "${b}" harus dicatat`);
  }
});

uji('PERTUKARAN DITERIMA: rácak mirip-kata DISIMPAN, bukan ditebak', () => {
  // "Glsd VeIdiiVUl" (rácak nyata di berkas owner) dan "ifn cet iai Re"
  // punya rasio vokal >= 0.34, jadi aturan lama membuangnya. Aturan yang
  // sama persis juga membuang "yang PALING TEPAT?" dan "yang benar?" --
  // yaitu MENGHAPUS kalimat pertanyaan soal 48 & 32. Kehilangan isi soal
  // lebih mahal daripada sisa sampah, jadi sampah yang mirip kata kini
  // DISIMPAN dan hanya dicatat lewat badge "baris terpotong"/catatan OCR.
  for (const b of ['Glsd VeIdiiVUl', 'ifn cet iai Re', 'ae ew PUN', 'PU: 4Semua', 'ive PANE bv es']) {
    assert.ok(bersihkanOcrTeks(b).teks.includes(b), `"${b}" harus tetap ada`);
  }
});

uji('INVARIAN soal 32: pembuangan duplikat opsi tidak pernah mengosongkan teks soal', () => {
  // Kasus nyata: setelah reflow, SELURUH soal jadi satu baris panjang yang
  // "mengandung" opsi E ("Kakek membaca koran di ruang tamu.") karena
  // kalimat pengantar soal memang mengutip frasa itu -> teks soal terhapus
  // total dan preview menampilkan soal kosong.
  const teks = ('Jika kakek membaca koran di ruang tamu, mak kakek tidak menggunakan kacamatanya. '
    + 'Jika kake tidak menggunakan kacamatanya, maka kake akan kesulitan membaca. '
    + 'Pagi ini kakek tida Menggunakan kacamatanya. Kesimpulan man yang benar?');
  const opsi = [
    'Kakek tidak bisa membaca koran.',
    'Pagi ini kakek membaca koran.',
    'Kakek tidak membaca koran pagi ini.',
    'Pagi ini kakek akan kesulitan membaca.',
    'Kakek membaca koran di ruang tamu.',
  ];
  const r = buangDuplikatOpsiDariTeks(teks, opsi);
  assert.ok(r.teks.length > teks.length * 0.5, 'teks soal tidak boleh digerus');
  assert.ok(r.teks.includes('Kesimpulan man yang benar?'), 'kalimat pertanyaan harus tetap ada');
});

uji('pagar 60%: sapuan duplikat yang menggerus teks dibatalkan + dicatat', () => {
  const teks = ['Semua pemain di kota C tidak sportif.', 'Tidak ada pemain di kota C yang sportif.'].join('\n');
  const r = buangDuplikatOpsiDariTeks(teks, [
    'Semua pemain di kota C tidak sportif.',
    'Tidak ada pemain di kota C yang sportif.',
  ]);
  assert.ok(r.teks.trim().length > 0, 'teks tidak boleh kosong total');
  assert.ok(r.catatan.some((c) => c.includes('PERIKSA MANUAL')), 'pembatalan harus dicatat');
});

uji('jagaBaris: baris pembahasan tidak disambung (struktur buku bertahan)', () => {
  const mentah = ['Semua A, B', 'Sebagian B, C', 'Kesimpulan : Sebagian A, Bukan C', 'Jawaban B'].join('\n');
  const tanpaJaga = bersihkanOcrTeks(mentah);
  const denganJaga = bersihkanOcrTeks(mentah, { jagaBaris: true });
  assert.equal(denganJaga.teks, mentah, 'jagaBaris harus mempertahankan baris apa adanya');
  assert.ok(tanpaJaga.teks.split('\n').length < 4, 'tanpa jagaBaris barisnya memang tersambung (itu yang merusak tampilan buku)');
});

uji('pembahasan tanpa penutup "Jawaban: X" dicatat (bukan diperbaiki diam-diam)', () => {
  const tanpa = penandaiKualitasOcr({ pembahasan: 'Penjelasannya panjang lebar.\nSampai dua baris.' });
  assert.ok(tanpa.some((c) => c.includes('penutup "Jawaban: X"')), JSON.stringify(tanpa));
  const dengan = penandaiKualitasOcr({ pembahasan: 'Penjelasannya panjang lebar.\nJawaban: C' });
  assert.ok(!dengan.some((c) => c.includes('penutup "Jawaban: X"')));
  const kosong = penandaiKualitasOcr({ pembahasan: '' });
  assert.ok(!kosong.some((c) => c.includes('penutup "Jawaban: X"')), 'pembahasan kosong tidak boleh dituduh');
});

uji('lengkapEkorJawaban: fragmen "Jawaba/Jawabat/..." dilengkapi dari kunci, bukan ditebak', () => {
  // Hanya fragmen yang ekornya BUKAN satu huruf A-E: satu huruf bisa jadi
  // jawaban tercetak, jadi tidak boleh diklaim ulang (lihat uji di bawah).
  for (const fragmen of ["Jawaba'", 'Jawabai', 'Jawabat', 'Jawabar', 'Jawabab', 'Jawaban |', 'Jawaban (', '= Jawaban f', 'Jawaban']) {
    const r = lengkapEkorJawaban(`Premis pertama.\n${fragmen}`, 'C');
    assert.ok(r.teks.endsWith('Jawaban: C'), `"${fragmen}" -> ${JSON.stringify(r.teks)}`);
    assert.ok(r.catatan.length === 1 && r.catatan[0].includes(fragmen), 'catatan harus menyebut fragmen aslinya');
  }
});

uji('lengkapEkorJawaban: TIDAK menyentuh pembahasan yang sudah punya jawaban utuh', () => {
  const teks = 'Semua A, B\nKesimpulan : Sebagian A, B\nJawaban: D';
  const r = lengkapEkorJawaban(teks, 'D');
  assert.equal(r.teks, teks);
  assert.deepEqual(r.catatan, []);
});

uji('lengkapEkorJawaban: satu huruf A-E ambigu -> tidak pernah diklaim ulang', () => {
  // "Jawaban A" dengan kunci C: dibiarkan (ini dugaan kunci yang tidak cocok).
  const beda = lengkapEkorJawaban('Pembahasan.\nJawaban A', 'C');
  assert.equal(beda.teks, 'Pembahasan.\nJawaban A');
  assert.deepEqual(beda.catatan, []);
  // "Jawaba" (bisa jadi "Jawaban" yang putus) dengan kunci A: hanya
  // dinormalkan bentuknya, hurufnya tidak dikarang.
  // "Jawaba" + kunci A: huruf "a" itu bisa "Jawaban" yang putus, bisa huruf
  // kunci A. Keduanya menghasilkan "Jawaban: A", jadi aman ditulis -- tapi
  // tetap dicatat supaya admin tahu baris itu hasil pelengkapan.
  const sama = lengkapEkorJawaban('Pembahasan.\nJawaba', 'A');
  assert.ok(sama.teks.endsWith('Jawaban: A'));
  assert.equal(sama.catatan.length, 1);
  // Tanpa kunci: tidak disentuh sama sekali.
  assert.equal(lengkapEkorJawaban('Pembahasan.\nJawaba', '').teks, 'Pembahasan.\nJawaba');
  // "Jawabe" bisa "Jawaban" putus, bisa "Jawab E": dengan kunci E keduanya
  // bertemu di bentuk yang sama, jadi aman dinormalkan.
  assert.ok(lengkapEkorJawaban('Pembahasan.\nJawabe', 'E').teks.endsWith('Jawaban: E'));
  // ... tapi dengan kunci lain hurufnya TIDAK boleh diganti.
  assert.equal(lengkapEkorJawaban('Pembahasan.\nJawabe', 'C').teks, 'Pembahasan.\nJawabe');
});

uji('lengkapEkorJawaban: huruf yang BEDA dari kunci tidak ditimpa (urusan admin)', () => {
  const teks = 'Pembahasan buku.\nJawaban A';
  const r = lengkapEkorJawaban(teks, 'C');
  assert.equal(r.teks, teks);
  assert.deepEqual(r.catatan, []);
});

uji('lengkapEkorJawaban: tanpa kunci / kunci bukan A-E -> tidak mengarang huruf', () => {
  const teks = 'Penjelasan.\nJawaba';
  assert.equal(lengkapEkorJawaban(teks, '').teks, teks);
  assert.equal(lengkapEkorJawaban(teks, 'AB').teks, teks);
  assert.equal(lengkapEkorJawaban(teks, null).teks, teks);
});

uji('lengkapEkorJawaban: kalimat biasa yang kebetulan menyebut "menjawab" tidak disentuh', () => {
  const teks = 'Siswa diminta menjawab soal berikut dengan cara menuliskan langkahnya terlebih dahulu.';
  const r = lengkapEkorJawaban(teks, 'B');
  assert.equal(r.teks, teks);
  assert.deepEqual(r.catatan, []);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
uji('REGRESI 2026-10-27: baris daftar TIDAK di-reflow jadi satu paragraf', () => {
  const masuk = 'Diberikan tiga himpunan:\n• A = {x | x < 6, x ∈ bilangan asli}\n• B = {x | x bilangan genap}\n• C = {x | x ≤ 10, x ∈ bilangan prima}';
  const r = bersihkanOcrTeks(masuk);
  assert.equal(r.teks.split('\n').length, 4, r.teks);
});

uji('REGRESI 2026-10-27: baris definisi himpunan tidak dimakan barisGarbar', () => {
  const r = bersihkanOcrTeks('C = {x | x ≤ 10}\nA = {x | x ∈ bilangan asli}');
  assert.equal(r.teks.split('\n').length, 2, r.teks);
  assert.deepEqual(r.catatan, []);
});

console.log('✅ Semua test lulus.');
