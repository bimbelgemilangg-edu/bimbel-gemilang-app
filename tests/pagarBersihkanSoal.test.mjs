// tests/pagarBersihkanSoal.test.mjs
// ============================================================
// Uji pagar ledakan pembersihan bank soal massal
// (src/utils/pagarBersihkanSoal.js).
//
//     node tests/pagarBersihkanSoal.test.mjs
//
// KENAPA INI PENTING
// `BersihkanSoalPage` adalah satu-satunya fitur yang MENGHAPUS soal
// berdasarkan heuristik otomatis. Dulu ia mencentang otomatis SEMUA
// temuan, termasuk yang tidak pernah tampil di layar ("...dan N lainnya
// tetap ikut tercentang & terhapus"), tanpa ambang kewajaran apa pun.
// Bila detektornya yang keliru, satu klik bisa menyapu seluruh bank.
//
// Uji di bawah memaku tiga invarian yang tidak boleh dilanggar:
//   1. bank sehat      -> nol yang tercentang, nol yang terhapus
//   2. tuduhan massal  -> centang otomatis MATI TOTAL (detektor dicurigai)
//   3. di luar layar   -> tidak pernah ikut tercentang diam-diam
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  putusanPembersihan,
  centangAman,
  teksKonfirmasiHapus,
  AMBANG_PERSEN_RUSAK,
  BATAS_TAYANG_RUSAK,
} from '../src/utils/pagarBersihkanSoal.js';

const daftar = (n, awalan = 'r') =>
  Array.from({ length: n }, (_, i) => ({ id: `${awalan}${i}` }));

const grup = (n, awalan = 'g') =>
  Array.from({ length: n }, (_, i) => ({
    idDisimpan: `${awalan}${i}_simpan`,
    anggota: [{ id: `${awalan}${i}_simpan` }, { id: `${awalan}${i}_lebih` }],
  }));

// ------------------------------------------------------------
// 1. Bank sehat
// ------------------------------------------------------------

test('INVARIAN: bank sehat -> nol tercentang, nol terhapus', () => {
  const p = putusanPembersihan({ totalDiaudit: 4000, jumlahRusak: 0, jumlahDuplikatBerlebih: 0 });
  assert.equal(p.mencurigakan, false);
  assert.equal(p.totalAutoCentang, 0);
  assert.equal(centangAman([], [], p).size, 0);
});

test('temuan kecil yang wajar tetap boleh dicentang otomatis', () => {
  const p = putusanPembersihan({ totalDiaudit: 4000, jumlahRusak: 12, jumlahDuplikatBerlebih: 30 });
  assert.equal(p.mencurigakan, false);
  assert.equal(p.persenRusak, 0.3);
  assert.equal(p.autoCentangRusak, 12);
  assert.equal(p.autoCentangDuplikat, 30);
  assert.equal(p.totalAutoCentang, 42);
});

// ------------------------------------------------------------
// 2. Tuduhan massal = detektor dicurigai
// ------------------------------------------------------------

test('INVARIAN: detektor menuduh 90% bank rusak -> centang otomatis MATI TOTAL', () => {
  const p = putusanPembersihan({ totalDiaudit: 1000, jumlahRusak: 900 });
  assert.equal(p.mencurigakan, true);
  assert.equal(p.bolehAutoCentang, false);
  assert.equal(p.autoCentangRusak, 0);
  assert.equal(p.autoCentangDuplikat, 0);
  assert.equal(p.totalAutoCentang, 0);
  assert.match(p.pesan, /DETEKTORNYA yang keliru/);
  assert.match(p.pesan, /Tidak ada satu pun yang dicentang otomatis/);
});

test('kasus nyata: semua butir dituduh "teks kosong" karena salah nama field', () => {
  // 100% rusak adalah tanda tangan bug field-name, bukan bank rusak.
  const p = putusanPembersihan({ totalDiaudit: 2500, jumlahRusak: 2500 });
  assert.equal(p.mencurigakan, true);
  assert.equal(centangAman(daftar(300), grup(100), p).size, 0, 'nol id boleh tercentang');
});

test('tepat di ambang sudah dianggap mencurigakan (bukan lolos tipis)', () => {
  const p = putusanPembersihan({ totalDiaudit: 1000, jumlahRusak: Math.ceil(1000 * AMBANG_PERSEN_RUSAK / 100) });
  assert.equal(p.mencurigakan, true);
  const q = putusanPembersihan({ totalDiaudit: 1000, jumlahRusak: Math.ceil(1000 * AMBANG_PERSEN_RUSAK / 100) - 1 });
  assert.equal(q.mencurigakan, false);
});

test('ambang bisa dinaikkan/diturunkan pemanggil', () => {
  assert.equal(putusanPembersihan({ totalDiaudit: 100, jumlahRusak: 40 }).mencurigakan, true);
  assert.equal(putusanPembersihan({ totalDiaudit: 100, jumlahRusak: 40, ambangPersen: 50 }).mencurigakan, false);
});

// ------------------------------------------------------------
// 3. Di luar layar tidak pernah ikut tercentang
// ------------------------------------------------------------

test('INVARIAN: butir di luar batas tayang tidak ikut tercentang diam-diam', () => {
  // 1200/10000 = 12% -> di bawah ambang 15%, jadi temuan dianggap WAJAR.
  // Yang diuji di sini adalah pemotongan batas tayang: walau wajar, hanya
  // 300 yang tampil, jadi hanya 300 yang boleh tercentang.
  const p = putusanPembersihan({ totalDiaudit: 10000, jumlahRusak: 1200 });
  assert.equal(p.mencurigakan, false);
  assert.equal(p.bolehAutoCentang, true);
  assert.equal(p.autoCentangRusak, BATAS_TAYANG_RUSAK);
  assert.equal(p.takTercentangRusak, 900);
  assert.match(p.pesan, /SENGAJA tidak ikut dicentang/);

  const tampil = daftar(BATAS_TAYANG_RUSAK);
  const dicentang = centangAman(tampil, [], p);
  assert.equal(dicentang.size, BATAS_TAYANG_RUSAK);
  assert.equal(dicentang.has('r999'), false, 'butir yang tak tampil tidak boleh tercentang');
});

test('centangAman hanya memakai daftar yang DISODORKAN halaman', () => {
  const p = putusanPembersihan({ totalDiaudit: 5000, jumlahRusak: 5, jumlahDuplikatBerlebih: 800 });
  const dicentang = centangAman(daftar(5), grup(3), p);
  // 5 rusak tampil + 3 grup duplikat tampil (masing-masing 1 anggota berlebih)
  assert.equal(dicentang.size, 8);
  // autoCentangDuplikat = min(800, batasTayang 100) = 100 -> sisa 700 diakui.
  // Angka ini PERKIRAAN untuk pesan layar; angka yang benar-benar dipakai di
  // dialog konfirmasi adalah size himpunan hasil centangAman (lihat halaman).
  assert.equal(p.takTercentangDuplikat, 700, 'sisanya diakui jujur, tidak disembunyikan');
});

test('anggota duplikat yang DISIMPAN tidak pernah ikut tercentang', () => {
  const p = putusanPembersihan({ totalDiaudit: 100, jumlahRusak: 0, jumlahDuplikatBerlebih: 2 });
  const dicentang = centangAman([], [{ idDisimpan: 'a', anggota: [{ id: 'a' }, { id: 'b' }] }], p);
  assert.equal(dicentang.has('a'), false);
  assert.equal(dicentang.has('b'), true);
});

// ------------------------------------------------------------
// 4. Input janggal & pesan
// ------------------------------------------------------------

test('input kosong/negatif/bukan angka tidak menghasilkan NaN', () => {
  for (const masukan of [
    {}, undefined, null,
    { totalDiaudit: -5, jumlahRusak: -9 },
    { totalDiaudit: 'abc', jumlahRusak: 'xyz' },
  ]) {
    const p = putusanPembersihan(masukan);
    assert.equal(Number.isNaN(p.persenRusak), false);
    assert.equal(p.mencurigakan, false, 'bank kosong tidak boleh dituduh');
    assert.equal(p.totalAutoCentang, 0);
  }
});

test('total nol dengan temuan (mustahil) tidak membuat persen Infinity', () => {
  const p = putusanPembersihan({ totalDiaudit: 0, jumlahRusak: 5 });
  assert.equal(p.persenRusak, 0);
  assert.equal(Number.isFinite(p.persenRusak), true);
  assert.equal(p.mencurigakan, false);
});

test('centangAman dengan putusan kosong tidak melempar', () => {
  assert.equal(centangAman(null, null, null).size, 0);
  assert.equal(centangAman(daftar(3), grup(1), undefined).size, 0);
});

test('teks konfirmasi menyebut angka sebenarnya dan peringatan saat mencurigakan', () => {
  assert.equal(teksKonfirmasiHapus(0), '');
  const biasa = teksKonfirmasiHapus(12);
  assert.match(biasa, /12 soal/);
  assert.match(biasa, /soft-delete/);
  const waspada = teksKonfirmasiHapus(12, { mencurigakan: true });
  assert.match(waspada, /bug detektor/);
});
