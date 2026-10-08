// tests/pemulihanXPTryOut.test.mjs
// ============================================================
// Uji murni pengembalian XP saat sesi try out di-reset admin
// (src/utils/pemulihanXPTryOut.js). Permintaan owner 2026-10-08:
// "mengembalikan soal dan poin XP dll anak ke semula biar bisa kerjain
// ulang" -- angkanya WAJIB benar: XP total DAN XP mingguan ditarik
// secukupnya, tidak boleh minus, tidak boleh potong dua kali.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { hitungPemulihanXP, teksKonfirmasiResetSesi } from '../src/utils/pemulihanXPTryOut.js';

const KUNCI = '2026-10-05'; // Senin, inject biar hasil uji gak bergantung hari nyata

test('XP total & mingguan ditarik sebesar XP sesi', () => {
  const hasil = hitungPemulihanXP(
    { xp: 350, xpMingguIni: 120, xpMingguIniKunci: KUNCI },
    90,
    KUNCI,
  );
  assert.deepEqual(hasil, { xp: 260, xpMingguIni: 30, xpMingguIniKunci: KUNCI });
});

test('tidak pernah minus: XP database lebih kecil dari XP sesi berhenti di 0', () => {
  const hasil = hitungPemulihanXP({ xp: 40, xpMingguIni: 10, xpMingguIniKunci: KUNCI }, 90, KUNCI);
  assert.equal(hasil.xp, 0);
  assert.equal(hasil.xpMingguIni, 0);
});

test('minggu sudah lewat: xpMingguIni tidak dipotong lagi (sudah hangus sendiri)', () => {
  // Sesi terjadi minggu lalu (kunci lama). Minggu ini xpMingguIni siswa
  // misalnya 20 dari aktivitas LAIN -- gak boleh ikut dipotong 90.
  const hasil = hitungPemulihanXP(
    { xp: 500, xpMingguIni: 20, xpMingguIniKunci: '2026-09-28' },
    90,
    KUNCI,
  );
  assert.equal(hasil.xp, 410);
  assert.equal(hasil.xpMingguIni, 0); // dasar minggu baru = 0, dipotong -> tetap 0
  assert.equal(hasil.xpMingguIniKunci, KUNCI);
});

test('progres belum ada (dokumen kosong) tetap aman', () => {
  assert.deepEqual(hitungPemulihanXP({}, 50, KUNCI), { xp: 0, xpMingguIni: 0, xpMingguIniKunci: KUNCI });
  assert.deepEqual(hitungPemulihanXP(undefined, 0, KUNCI), { xp: 0, xpMingguIni: 0, xpMingguIniKunci: KUNCI });
});

test('XP sesi nol / aneh tidak mengubah progres', () => {
  const progres = { xp: 100, xpMingguIni: 50, xpMingguIniKunci: KUNCI };
  assert.deepEqual(hitungPemulihanXP(progres, 0, KUNCI), { xp: 100, xpMingguIni: 50, xpMingguIniKunci: KUNCI });
  assert.deepEqual(hitungPemulihanXP(progres, 'abc', KUNCI), { xp: 100, xpMingguIni: 50, xpMingguIniKunci: KUNCI });
  assert.deepEqual(hitungPemulihanXP(progres, -20, KUNCI), { xp: 100, xpMingguIni: 50, xpMingguIniKunci: KUNCI });
});

test('teks konfirmasi menyebut nama, XP, dan peringatan deadline', () => {
  const teks = teksKonfirmasiResetSesi({
    namaSiswa: 'Azzahra', xpFinal: 90, statusSesi: 'selesai', deadlineLewat: true,
  });
  assert.match(teks, /Azzahra/);
  assert.match(teks, /90/);
  assert.match(teks, /DEADLINE/);
  const teksBerjalan = teksKonfirmasiResetSesi({
    namaSiswa: 'Budi', xpFinal: 0, statusSesi: 'berjalan', deadlineLewat: false,
  });
  assert.match(teksBerjalan, /sedang berjalan/);
  assert.doesNotMatch(teksBerjalan, /DEADLINE/);
});
