// tests/cocokkanTargetPaket.test.mjs — penargetan paket ke siswa
// ============================================================
//     node tests/cocokkanTargetPaket.test.mjs
//
// KENAPA INI PENTING
// Ditemukan saat audit 2026-10-10: field targetKelas/targetKategori ditulis
// dalam DUA bentuk (array oleh mesinTryOutOtomatis, string oleh
// rakitTryOutTentor & TerbitkanTryOutPage) tapi dibaca dengan `===` terhadap
// string di empat halaman. ['Semua'] === 'Semua' bernilai false, jadi paket
// dari Jadwal Try Out Otomatis bisa tidak pernah muncul ke siswa -- tanpa
// error, tanpa jejak. Kelas "identitas tidak seragam" yang sudah dipetakan
// docs/PETA-SINKRONISASI-ADMIN-SISWA.md.
//
// Test ini ditulis sebagai INVARIAN (bukan potret output), mengikuti pola
// tests/kwitansi.test.mjs: yang dijaga adalah sifat yang tidak boleh berubah
// walau bentuk datanya berubah.
// ============================================================
import assert from 'node:assert/strict';
import {
  daftarTarget, targetUntukSemua, cocokkanTarget, cocokkanTargetPaket, bentukKanonikTarget,
} from '../src/utils/cocokkanTargetPaket.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}

console.log('cocokkanTargetPaket — penargetan paket ke siswa');

// ---------------------------------------------------------------- normalisasi
uji('string, array, dan string berkoma menghasilkan daftar yang sama', () => {
  assert.deepEqual(daftarTarget('Semua'), ['semua']);
  assert.deepEqual(daftarTarget(['Semua']), ['semua']);
  assert.deepEqual(daftarTarget('12, 11'), ['12', '11']);
  assert.deepEqual(daftarTarget(['12', '11']), ['12', '11']);
});

uji('nilai kosong/rusak tidak melempar error', () => {
  for (const v of [null, undefined, '', '   ', [], [null, ''], 0, false, {}]) {
    assert.ok(Array.isArray(daftarTarget(v)), `harus array untuk ${JSON.stringify(v)}`);
  }
});

uji('INVARIAN: bentuk data tidak mengubah keputusan', () => {
  // Inilah inti perbaikannya. Semua bentuk ini HARUS menghasilkan keputusan
  // yang sama terhadap siswa yang sama.
  const siswa = { kelasSekolah: '12 SMA', kategori: 'Reguler' };
  const bentuk = [
    { targetKelas: 'Semua', targetKategori: 'Semua' },
    { targetKelas: ['Semua'], targetKategori: ['Semua'] },
    { targetKelas: null, targetKategori: undefined },
    {},
  ];
  const hasil = bentuk.map((p) => cocokkanTargetPaket(p, siswa).cocok);
  assert.ok(hasil.every((h) => h === true), `semua bentuk harus cocok, dapat: ${hasil}`);
});

// ------------------------------------------------------------------- untuk semua
uji('target kosong = untuk semua (paket warisan tidak boleh hilang)', () => {
  assert.equal(targetUntukSemua(null), true);
  assert.equal(targetUntukSemua(''), true);
  assert.equal(targetUntukSemua([]), true);
  assert.equal(targetUntukSemua('Semua'), true);
  assert.equal(targetUntukSemua(['Semua']), true);
  assert.equal(targetUntukSemua('semua'), true, 'tidak peka huruf besar/kecil');
});

uji('target spesifik bukan untuk semua', () => {
  assert.equal(targetUntukSemua('12 SMA'), false);
  assert.equal(targetUntukSemua(['12', '11']), false);
});

// ---------------------------------------------------------------- pencocokan
uji('kelas spesifik cocok hanya dengan kelas itu', () => {
  assert.equal(cocokkanTarget('12 SMA', '12 SMA'), true);
  assert.equal(cocokkanTarget('12 SMA', '11 SMA'), false);
  assert.equal(cocokkanTarget(['12', '11'], '11'), true);
  assert.equal(cocokkanTarget(['12', '11'], '10'), false);
});

uji('target spesifik + data siswa kosong = TOLAK, bukan lolos', () => {
  // Sengaja ketat di sisi ini: kalau kelas siswa tidak diketahui, jangan
  // menebak bahwa ia boleh melihat paket untuk kelas tertentu.
  assert.equal(cocokkanTarget('12 SMA', ''), false);
  assert.equal(cocokkanTarget('12 SMA', null), false);
  assert.equal(cocokkanTarget('12 SMA', undefined), false);
});

uji('tidak peka spasi berlebih dan huruf besar/kecil', () => {
  assert.equal(cocokkanTarget('  12 sma ', '12 SMA'), true);
  assert.equal(cocokkanTarget('Reguler', ' reguler '), true);
});

// --------------------------------------------------------------- paket + siswa
uji('kedua dimensi harus lolos (kelas DAN kategori)', () => {
  const paket = { targetKelas: '12 SMA', targetKategori: 'Reguler' };
  assert.equal(cocokkanTargetPaket(paket, { kelasSekolah: '12 SMA', kategori: 'Reguler' }).cocok, true);
  assert.equal(cocokkanTargetPaket(paket, { kelasSekolah: '12 SMA', kategori: 'English' }).cocok, false);
  assert.equal(cocokkanTargetPaket(paket, { kelasSekolah: '9 SMP', kategori: 'Reguler' }).cocok, false);
});

uji('INVARIAN: penolakan selalu membawa alasan yang bisa dibaca manusia', () => {
  // Tanpa alasan, admin yang menerima keluhan "try out-nya tidak muncul"
  // tidak punya bahan diagnosis -- persis masalah yang membuat
  // auditKecocokanSoal() di aksesKontenSiswa.js mengembalikan {cocok, alasan}.
  const kasus = [
    [{ targetKelas: '12 SMA' }, { kelasSekolah: '9 SMP' }],
    [{ targetKategori: 'English' }, { kelasSekolah: '12 SMA', kategori: 'Reguler' }],
    [{ targetKelas: '12 SMA' }, {}],
  ];
  for (const [paket, siswa] of kasus) {
    const r = cocokkanTargetPaket(paket, siswa);
    assert.equal(r.cocok, false);
    assert.ok(r.alasan && r.alasan.length > 10, `alasan harus jelas: ${r.alasan}`);
    assert.ok(!/[uU]ndefined/.test(r.alasan), `alasan tidak boleh memuat undefined: ${r.alasan}`);
  }
});

uji('alasan kosong bila cocok (kontrak {cocok, alasan} konsisten)', () => {
  const r = cocokkanTargetPaket({ targetKelas: 'Semua' }, { kelasSekolah: '7 SMP', kategori: 'Reguler' });
  assert.equal(r.cocok, true);
  assert.equal(r.alasan, '');
});

uji('paket/siswa null tidak melempar error', () => {
  assert.equal(typeof cocokkanTargetPaket(null, null).cocok, 'boolean');
  assert.equal(cocokkanTargetPaket(null, null).cocok, true, 'target kosong = untuk semua');
});

// ------------------------------------------------------- bentuk untuk disimpan
uji('bentuk kanonik menormalkan ke string tunggal', () => {
  assert.equal(bentukKanonikTarget(['Semua']), 'Semua');
  assert.equal(bentukKanonikTarget(null), 'Semua');
  assert.equal(bentukKanonikTarget(''), 'Semua');
  assert.equal(bentukKanonikTarget(['12 SMA']), '12 SMA', 'kapitalisasi asli dipertahankan utk kop naskah');
  assert.deepEqual(bentukKanonikTarget(['12', '11']), ['12', '11'], 'multi-nilai tetap array');
});

uji('INVARIAN: bentuk kanonik selalu cocok untuk target yang sama', () => {
  // Normalisasi saat simpan tidak boleh mengubah SIAPA yang boleh melihat.
  const asli = [['Semua'], 'Semua', null, ['12 SMA'], '12 SMA', ['12', '11']];
  for (const t of asli) {
    const kanonik = bentukKanonikTarget(t);
    for (const siswa of ['12 SMA', '11', '9 SMP', '']) {
      assert.equal(
        cocokkanTarget(kanonik, siswa),
        cocokkanTarget(t, siswa),
        `keputusan berubah setelah dinormalkan: ${JSON.stringify(t)} vs siswa "${siswa}"`,
      );
    }
  }
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
