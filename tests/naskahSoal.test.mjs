// tests/naskahSoal.test.mjs
// ============================================================
// Test mesin naskah cetak gaya ujian (src/utils/naskahSoal.js).
//
//     node tests/naskahSoal.test.mjs
//
// KENAPA INI PENTING
// Owner minta "sistem menata secara otomatis, gambar tidak terlalu
// kecil dan besar, tentor tinggal pilih ukuran kertas lalu print".
// Yang dijaga di sini ialah janji-janji yang bisa bocor diam-diam:
//   1. gambar tidak pernah nol/NaN dan selalu dalam pagar ukuran;
//   2. butir tidak pernah dibelah antar kolom (urutan indeks utuh);
//   3. kolom tidak pernah melebihi kapasitas tinggi halaman;
//   4. kunci tidak bocor ke fragmen siswa (dan sebaliknya peringatan
//      wajib ada di fragmen kunci);
//   5. @page mengikuti kertas yang dipilih guru.
// ============================================================

import assert from 'node:assert/strict';
import {
  DAFTAR_KERTAS,
  kertasDariKode,
  lebarKolomMm,
  kolomOtomatis,
  kapasitasKolomMm,
  cssPage,
  ukuranGambarNaskah,
  kolomPilihanNaskah,
  susunKeKolom,
  butirNaskahHtml,
  daftarBlokNaskah,
  estimasiTinggiBlokMm,
  susunNaskahDariBlok,
  teksKeHtml,
  escapeHtml,
} from '../src/utils/naskahSoal.js';

let lulus = 0;
let gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try {
    fn();
    lulus += 1;
  } catch (e) {
    gagal += 1;
    kegagalan.push(`${nama}: ${e.message}`);
  }
}

const A4 = kertasDariKode('A4');
const soalContoh = {
  soal: 'Perhatikan gambar berikut! Jika luas daerah lingkaran sama dengan $16\\pi$ cm2, maka luas daerah yang diarsir adalah ... cm2. {{GAMBAR}}',
  gambarUrls: ['https://contoh.dev/lingkaran.png'],
  opsiJawaban: ['8(4 - pi).', '10(4 - 2pi).', '12(3 - pi).', '16(4 - pi).', '20(2 - pi).'],
  kunci: 0,
  pembahasan: 'Luas persegi dikurangi luas lingkaran.',
};

// ---- kertas & geometri ----
uji('daftar kertas memuat empat ukuran yang umum di percetakan Indonesia', () => {
  assert.deepEqual(DAFTAR_KERTAS.map((k) => k.kode), ['A4', 'F4', 'LETTER', 'A5']);
});
uji('kode kertas tidak dikenal jatuh ke A4, bukan crash', () => {
  assert.equal(kertasDariKode('entah-apa').kode, 'A4');
  assert.equal(kertasDariKode(undefined).kode, 'A4');
});
uji('lebar kolom A4 dua kolom = 92mm (210 - 2 margin - sela, dibagi 2)', () => {
  assert.equal(lebarKolomMm(A4, 2), 92);
  assert.equal(lebarKolomMm(A4, 1), 190);
});
uji('kolom otomatis: A4/F4/Letter dua kolom, A5 satu kolom', () => {
  assert.equal(kolomOtomatis(A4), 2);
  assert.equal(kolomOtomatis(kertasDariKode('F4')), 2);
  assert.equal(kolomOtomatis(kertasDariKode('A5')), 1);
});
uji('kapasitas kolom selalu lebih kecil dari tinggi isi halaman (ada slack)', () => {
  for (const k of DAFTAR_KERTAS) {
    assert.ok(kapasitasKolomMm(k) < k.tinggiMm - 20, k.kode);
  }
});
uji('cssPage mengikuti kertas pilihan guru', () => {
  assert.match(cssPage(kertasDariKode('F4')), /@page \{ size: 215mm 330mm; margin: 0; \}/);
});

// ---- ukuran gambar ----
uji('gambar melebar (grafik v-t) jadi blok sepenuh kolom', () => {
  const u = ukuranGambarNaskah(1600, 400, 92);
  assert.equal(u.mode, 'blok');
  assert.equal(u.lebarMm, 87.4);
  assert.equal(u.tinggiMm, 21.8);
});
uji('gambar kotak (lingkaran) mendampingi teks, tidak melebihi 45% kolom', () => {
  const u = ukuranGambarNaskah(800, 700, 92);
  assert.equal(u.mode, 'samping');
  assert.ok(u.lebarMm >= 30 && u.lebarMm <= 0.45 * 92 + 0.01, `lebar ${u.lebarMm}`);
  assert.ok(u.tinggiMm <= 48.01, `tinggi ${u.tinggiMm}`);
});
uji('gambar menjulang (bagian tumbuhan) diblok tengah, lebar minimal 26mm', () => {
  const u = ukuranGambarNaskah(400, 900, 92);
  assert.equal(u.mode, 'blok');
  assert.ok(u.lebarMm >= 26);
  assert.ok(u.tinggiMm <= 70.01);
});
uji('gambar tidak pernah terlalu kecil: lebar samping lantai 30mm', () => {
  const u = ukuranGambarNaskah(1000, 1000, 92);
  assert.ok(u.lebarMm >= 30);
});
uji('rasio rusak (0/NaN/negatif) -> null, pemanggil pakai ukuran darurat', () => {
  assert.equal(ukuranGambarNaskah(0, 100, 92), null);
  assert.equal(ukuranGambarNaskah(NaN, 100, 92), null);
  assert.equal(ukuranGambarNaskah(100, -5, 92), null);
});

// ---- pilihan ganda ----
uji('pilihan pendek dua kolom, pilihan persamaan panjang satu kolom', () => {
  assert.equal(kolomPilihanNaskah(['8(4 - pi).', '10(4 - 2pi).', '12(3 - pi).', '16(4 - pi).'], 92), 2);
  const panjang = Array(4).fill('x + y = 12 dengan syarat nilai mutlak besar sekali memang');
  assert.equal(kolomPilihanNaskah(panjang, 92), 1);
});
uji('pilihan kurang dari empat tetap satu kolom (esai beropsi ganjil)', () => {
  assert.equal(kolomPilihanNaskah(['a', 'b', 'c'], 92), 1);
});

// ---- penyusun kolom ----
uji('urutan butir tidak pernah diacak dan tidak dibelah', () => {
  const { halaman } = susunKeKolom([50, 60, 70, 80, 90], 150, 2);
  const urut = halaman.flat(2);
  assert.deepEqual(urut, [0, 1, 2, 3, 4]);
});
uji('kolom tidak pernah melewati kapasitas', () => {
  const tinggi = [40, 45, 50, 55, 60, 65, 70];
  const { halaman } = susunKeKolom(tinggi, 100, 2);
  for (const hal of halaman) {
    for (const kol of hal) {
      const jumlah = kol.reduce((a, i) => a + tinggi[i], 0);
      assert.ok(jumlah <= 100, `kolom ${kol} = ${jumlah}`);
    }
  }
});
uji('halaman tidak pernah berisi kolom lebih dari yang diminta', () => {
  const { halaman } = susunKeKolom([30, 30, 30, 30, 30, 30], 60, 2);
  for (const hal of halaman) assert.ok(hal.length <= 2);
});
uji('butir raksasa diberi kolom sendiri dan masuk peringatan', () => {
  const { halaman, peringatan } = susunKeKolom([20, 300, 20], 100, 2);
  assert.deepEqual(peringatan, [1]);
  const sendiri = halaman.flat(1).some((kol) => kol.length === 1 && kol[0] === 1);
  assert.ok(sendiri);
});
uji('daftar kosong tetap menghasilkan susunan sah (tanpa crash)', () => {
  const { halaman } = susunKeKolom([], 100, 2);
  assert.deepEqual(halaman, []);
});

// ---- builder fragmen ----
const blok = daftarBlokNaskah('siswa', { judul: 'Latihan Lingkaran', mapel: 'Matematika' }, [soalContoh], 92, { 'https://contoh.dev/lingkaran.png': 800 / 700 });
const hasil = susunNaskahDariBlok(blok, { kertas: 'A4', tinggiBlokMm: [30, 60] });

uji('fragmen siswa memuat nomor halaman dan kepala beridentitas', () => {
  assert.match(hasil.fragmen, /— 1 \/ 1 —/);
  assert.match(hasil.fragmen, /Nama:/);
  assert.match(hasil.fragmen, /NASKAH SOAL/);
});
uji('fragmen siswa TIDAK memuat kunci maupun pembahasan', () => {
  assert.ok(!/Kunci:/.test(hasil.fragmen));
  assert.ok(!/Luas persegi dikurangi/.test(hasil.fragmen));
});
uji('fragmen kunci memuat peringatan keras dan kunci', () => {
  const blokKunci = daftarBlokNaskah('kunci', { judul: 'Latihan Lingkaran' }, [soalContoh], 92);
  const hKunci = susunNaskahDariBlok(blokKunci, { kertas: 'F4', tinggiBlokMm: [30, 20] });
  assert.match(hKunci.fragmen, /PEGANGAN GURU/);
  assert.match(hKunci.fragmen, /Kunci:/);
  assert.match(hKunci.fragmen, /size: 215mm 330mm/);
});
uji('gambar siswa dicetak dengan ukuran mm eksplisit (stabil sebelum dimuat)', () => {
  assert.match(hasil.fragmen, /width:36\.8mm;height:32\.2mm;object-fit:contain/);
});
uji('placeholder {{GAMBAR}} tidak ikut tercetak mentah', () => {
  assert.ok(!hasil.fragmen.includes('{{GAMBAR'));
});
uji('estimasi tinggi selalu angka positif walau soal kosong', () => {
  assert.ok(estimasiTinggiBlokMm('siswa', {}, 92) > 0);
  assert.ok(estimasiTinggiBlokMm('kunci', {}, 92) > 0);
});
uji('butir naskah menomor sesuai urutan pilihan guru', () => {
  const html = butirNaskahHtml(soalContoh, 12, 92, {});
  assert.match(html, />12\.</);
});
uji('renderer teks bersama: escape & katex tetap jalan', () => {
  assert.equal(escapeHtml('<b>'), '&lt;b&gt;');
  assert.match(teksKeHtml('$x^2$'), /katex/);
});

console.log('============================================================');
console.log(`naskahSoal: lulus ${lulus}, gagal ${gagal}`);
if (gagal) {
  kegagalan.forEach((k) => console.log('  ❌', k));
  process.exit(1);
}
console.log('✅ Semua test naskahSoal lulus.');
