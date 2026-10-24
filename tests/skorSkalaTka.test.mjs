// tests/skorSkalaTka.test.mjs
// ============================================================
// Test skala kebiasaan gaya TKA + deteksi jenis ujian
// (src/utils/skorSkalaTka.js & mode baru di hitungSkalaSesi.js).
//
//     node tests/skorSkalaTka.test.mjs
//
// Acuan resmi yang dipaku test ini (riset 2026-10-24):
//   - TKA SMA/SMK 2026: skala 200-800, pembulatan 2 desimal,
//     Kepmendikdasmen No. 56 Tahun 2026; predikat Istimewa >= 725,00
//     per mata uji (kategori Baik/Memadai/Kurang TIDAK ditampilkan karena
//     batas resminya tidak diterbitkan terbuka).
//   - TKA SD/SMP 2026: tetap 0-100.
//   - UTBK-SNBT: 100-1000 per komponen (diuji di skorSkalaUtbk.test.mjs).
// ============================================================

import assert from 'node:assert/strict';
import {
  persenKeSkalaTka, predikatTka, jenjangPaket, tebakJenisUjian,
  jenisUjianPaket, modeSkalaTka, SKALA_TKA_MIN, SKALA_TKA_MAKS, BATAS_ISTIMEWA_TKA,
} from '../src/utils/skorSkalaTka.js';
import { hitungSkalaSesi } from '../src/utils/hitungSkalaSesi.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

// ------------------------------------------------------------
// 1. Pemetaan skala TKA SMA/SMK (200-800, 2 desimal)
// ------------------------------------------------------------
uji('ujung rentang: 0% -> 200 dan 100% -> 800', () => {
  assert.equal(persenKeSkalaTka(0), SKALA_TKA_MIN);
  assert.equal(persenKeSkalaTka(100), SKALA_TKA_MAKS);
});
uji('tengah rentang: 50% -> 500', () => {
  assert.equal(persenKeSkalaTka(50), 500);
});
uji('pembulatan 2 desimal seperti laporan resmi', () => {
  assert.equal(persenKeSkalaTka(12.345), 274.07);
  assert.equal(persenKeSkalaTka(33.333), 400); // 399.998 dibulatkan 2 desimal
});
uji('persen di luar rentang dipotong, bukan meledak', () => {
  assert.equal(persenKeSkalaTka(150), SKALA_TKA_MAKS);
  assert.equal(persenKeSkalaTka(-5), SKALA_TKA_MIN);
  assert.equal(persenKeSkalaTka('abc'), null);
});

// ------------------------------------------------------------
// 2. Predikat Istimewa (satu-satunya batas resmi yang terbuka)
// ------------------------------------------------------------
uji('Istimewa tepat di 725,00 dan tidak di bawahnya', () => {
  assert.equal(predikatTka(BATAS_ISTIMEWA_TKA), 'Istimewa');
  assert.equal(predikatTka(724.99), null);
  assert.equal(predikatTka(800), 'Istimewa');
  assert.equal(predikatTka(null), null);
});

// ------------------------------------------------------------
// 3. Deteksi jenjang & jenis ujian
// ------------------------------------------------------------
uji('jenjang dari targetKelas dan dari isi soal', () => {
  assert.equal(jenjangPaket({ targetKelas: '12 SMA' }), 'SMA');
  assert.equal(jenjangPaket({ targetKelas: '9 SMP' }), 'SMP');
  assert.equal(jenjangPaket({ targetKelas: 'Semua', daftarSoal: [{ kelas: '10 SMA' }, { kelas: '11 SMA' }] }), 'SMA');
  assert.equal(jenjangPaket({ targetKelas: 'Semua' }), null);
});
uji('tebak jenis: subtes UTBK menang atas apa pun', () => {
  const paket = { targetKelas: '12 SMA', daftarSoal: [{ mapel: 'TPS/Penalaran Umum' }] };
  assert.equal(tebakJenisUjian(paket, (m) => m.startsWith('TPS/')), 'utbk');
});
uji('tebak jenis: SMA + mapel TKA -> tka; SD/SMP + mapel TKA -> tka', () => {
  assert.equal(tebakJenisUjian({ targetKelas: '11 SMA', daftarSoal: [{ mapel: 'Matematika' }] }), 'tka');
  assert.equal(tebakJenisUjian({ targetKelas: '8 SMP', daftarSoal: [{ mapel: 'Bahasa Indonesia' }] }), 'tka');
});
uji('tebak jenis: mapel non-TKA -> kurikulum', () => {
  assert.equal(tebakJenisUjian({ targetKelas: '11 SMA', daftarSoal: [{ mapel: 'Seni Budaya' }] }), 'kurikulum');
});
uji('pilihan eksplisit admin menang atas tebakan', () => {
  const paket = { jenisUjian: 'kurikulum', targetKelas: '11 SMA', daftarSoal: [{ mapel: 'Matematika' }] };
  assert.equal(jenisUjianPaket(paket), 'kurikulum');
  assert.equal(jenisUjianPaket({ ...paket, jenisUjian: null }), 'tka');
  assert.equal(jenisUjianPaket({ ...paket, jenisUjian: 'otomatis' }), 'tka');
});
uji('mode skala TKA mengikuti jenjang', () => {
  assert.equal(modeSkalaTka({ targetKelas: '12 SMA' }), 'tka-sma');
  assert.equal(modeSkalaTka({ targetKelas: '6 SD' }), 'tka-dasmen');
});

// ------------------------------------------------------------
// 4. hitungSkalaSesi sadar-mode
// ------------------------------------------------------------
const pg = (id, mapel, kunci = 'A') => ({ id, mapel, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: kunci });

uji('mode tka SMA: skala 200-800 per mata uji + predikat', () => {
  const paket = {
    jenisUjian: 'tka', targetKelas: '12 SMA',
    daftarSoal: [pg('m1', 'Matematika'), pg('m2', 'Matematika', 'B')],
  };
  const sesi = { status: 'selesai', jawaban: { m1: 0, m2: 0 }, soalDinilaiIds: ['m1', 'm2'] };
  const r = hitungSkalaSesi(sesi, paket);
  assert.equal(r.mode, 'tka');
  assert.equal(r.skalaMode, 'tka-sma');
  assert.equal(r.perSubtes[0].skala, 500); // 50% -> 200 + 6*50
  assert.equal(r.perSubtes[0].predikat, null);
  assert.equal(r.total, 500);
  assert.match(r.label, /BUKAN skor TKA resmi/i);
});

uji('mode tka SMA: predikat Istimewa muncul di >= 725', () => {
  const paket = { jenisUjian: 'tka', targetKelas: '12 SMA', daftarSoal: [pg('m1', 'Matematika'), pg('m2', 'Matematika')] };
  const sesi = { status: 'selesai', jawaban: { m1: 0, m2: 0 }, soalDinilaiIds: ['m1', 'm2'] };
  const r = hitungSkalaSesi(sesi, paket);
  assert.equal(r.perSubtes[0].skala, 800);
  assert.equal(r.perSubtes[0].predikat, 'Istimewa');
});

uji('mode tka SD/SMP: skala 0-100 dua desimal', () => {
  const paket = { jenisUjian: 'tka', targetKelas: '6 SD', daftarSoal: [pg('m1', 'Matematika'), pg('m2', 'Matematika'), pg('m3', 'Matematika')] };
  const sesi = { status: 'selesai', jawaban: { m1: 0, m2: 0 }, soalDinilaiIds: ['m1', 'm2', 'm3'] };
  const r = hitungSkalaSesi(sesi, paket);
  assert.equal(r.skalaMode, 'tka-dasmen');
  assert.equal(r.perSubtes[0].skala, 66.67);
  assert.equal(r.perSubtes[0].predikat, null);
});

uji('mode kurikulum: tanpa skala nasional, alasan jujur', () => {
  const paket = { jenisUjian: 'kurikulum', targetKelas: '11 SMA', daftarSoal: [pg('m1', 'Seni Budaya')] };
  const sesi = { status: 'selesai', jawaban: { m1: 0 }, soalDinilaiIds: ['m1'] };
  const r = hitungSkalaSesi(sesi, paket);
  assert.equal(r.mode, 'kurikulum');
  assert.equal(r.total, null);
  assert.match(r.alasan, /kurikulum/);
});

uji('mode utbk tetap jalan (tidak regresi)', () => {
  const paket = { jenisUjian: 'utbk', targetKelas: '12 SMA', daftarSoal: [pg('p1', 'TPS/Penalaran Umum')] };
  const sesi = { status: 'selesai', jawaban: { p1: 0 }, soalDinilaiIds: ['p1'] };
  const r = hitungSkalaSesi(sesi, paket);
  assert.equal(r.mode, 'utbk');
  assert.equal(r.total, 1000);
});

console.log('');
console.log(`# skorSkalaTka: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
