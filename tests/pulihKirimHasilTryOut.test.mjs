// tests/pulihKirimHasilTryOut.test.mjs
// ============================================================
// Uji logika murni pemulihan kirim hasil (src/utils/pulihKirimHasilTryOut.js).
// Lahir dari kejadian 2026-10-08: layar "Gagal Mengirim Hasil" muncul
// beruntun pada siswa SETELAH owner mereset sesi -- updateDoc ke dokumen
// yang sudah dihapus gagal selamanya. Keputusan pemulihannya WAJIB
// terkunci uji supaya gak pernah balik jadi putaran setan lagi.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  kodeGagalKirim,
  putusanPemulihanKirim,
  pilihSesiUtama,
  peringatanSesiBerjalan,
} from '../src/utils/pulihKirimHasilTryOut.js';

test('kodeGagalKirim: dokumen hilang terbaca not-found, selain itu lain', () => {
  assert.equal(kodeGagalKirim({ code: 'not-found', message: 'No document to update' }), 'not-found');
  assert.equal(kodeGagalKirim({ code: 'unavailable', message: 'offline' }), 'lain');
  assert.equal(kodeGagalKirim(new Error('net::ERR_NETWORK')), 'lain');
  assert.equal(kodeGagalKirim(undefined), 'lain');
  assert.equal(kodeGagalKirim(null), 'lain');
});

test('putusanPemulihanKirim: gagal jaringan tetap layar coba-lagi', () => {
  assert.equal(putusanPemulihanKirim({ kode: 'lain', adaSesiLainBerjalan: false }), 'coba-lagi');
  assert.equal(putusanPemulihanKirim({ kode: 'lain', adaSesiLainBerjalan: true }), 'coba-lagi');
});

test('putusanPemulihanKirim: dokumen hilang tanpa sesi baru = tahan lalu mulai lagi', () => {
  assert.equal(putusanPemulihanKirim({ kode: 'not-found', adaSesiLainBerjalan: false }), 'tahan-mulai-lagi');
});

test('putusanPemulihanKirim: dokumen hilang tapi sudah ada sesi berjalan = tahan lalu lanjutkan sesi baru', () => {
  assert.equal(putusanPemulihanKirim({ kode: 'not-found', adaSesiLainBerjalan: true }), 'tahan-lanjutkan-lain');
});

test('pilihSesiUtama: daftar kosong/null aman', () => {
  assert.equal(pilihSesiUtama([]), null);
  assert.equal(pilihSesiUtama(null), null);
  assert.equal(pilihSesiUtama(undefined), null);
});

test('pilihSesiUtama: sesi berjalan menang atas sesi selesai walau urutannya di depan', () => {
  const selesaiLama = { id: 'a', status: 'selesai', waktuMulaiMs: 1000 };
  const berjalanBaru = { id: 'b', status: 'berjalan', waktuMulaiMs: 2000 };
  assert.equal(pilihSesiUtama([selesaiLama, berjalanBaru]), berjalanBaru);
  assert.equal(pilihSesiUtama([berjalanBaru, selesaiLama]), berjalanBaru);
});

test('pilihSesiUtama: sesama status, yang mulai paling baru yang dipakai', () => {
  const lama = { id: 'a', status: 'selesai', waktuMulaiMs: 1000 };
  const baru = { id: 'b', status: 'selesai', waktuMulaiMs: 9000 };
  assert.equal(pilihSesiUtama([lama, baru]), baru);
  const jalanLama = { id: 'c', status: 'berjalan', waktuMulaiMs: 500 };
  const jalanBaru = { id: 'd', status: 'berjalan', waktuMulaiMs: 700 };
  assert.equal(pilihSesiUtama([jalanLama, jalanBaru, lama]), jalanBaru);
});

test('pilihSesiUtama: waktuMulaiMs absen jatuh ke createdAt Firestore', () => {
  const tanpaMs = { id: 'a', status: 'selesai', createdAt: { toMillis: () => 4000 } };
  const tuaMs = { id: 'b', status: 'selesai', waktuMulaiMs: 1000 };
  assert.equal(pilihSesiUtama([tuaMs, tanpaMs]), tanpaMs);
});

test('pilihSesiUtama: status asing tetap tidak membuat crash', () => {
  const aneh = { id: 'x', status: 'entah', waktuMulaiMs: 10 };
  assert.equal(pilihSesiUtama([aneh]), aneh);
});

test('peringatanSesiBerjalan: nol sesi berjalan = tanpa peringatan', () => {
  assert.equal(peringatanSesiBerjalan(0), '');
  assert.equal(peringatanSesiBerjalan(undefined), '');
  assert.equal(peringatanSesiBerjalan(-3), '');
});

test('peringatanSesiBerjalan: menyebut jumlah anak dan nasib jawaban', () => {
  const satu = peringatanSesiBerjalan(1);
  assert.match(satu, /1 anak/);
  assert.match(satu, /DITAHAN AMAN/);
  const banyak = peringatanSesiBerjalan(12);
  assert.match(banyak, /12 anak/);
  assert.match(banyak, /SEDANG MENGERJAKAN/);
});
