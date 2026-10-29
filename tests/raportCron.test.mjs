// tests/raportCron.test.mjs — logika penjadwalan cron raport bulanan (Fase 3)
// Janji yang dipatok di sini:
//   1. MURNI — tanpa Firebase; waktu masuk sebagai parameter (deterministik)
//   2. WIB — batas hari dihitung UTC+7: 31 Okt 17.30 UTC = 1 Nov WIB → TERBIT
//   3. hanya tanggal 1 WIB yang menerbitkan; hari lain = no-op jujur
//   4. bulan tertutup = bulan sebelumnya (Jan → Des tahun sebelumnya)
//   5. laporan besar 3 bulan hanya saat bulan tertutup = penutup trimester
//      (selaras awal semester Agustus: Agu–Okt, Nov–Jan, Feb–Apr, Mei–Jul)
//   6. override ?periode= salah format → throw (API 400), tidak pernah menebak
// node tests/raportCron.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SELISIH_WIB_MS, BULAN_AWAL_TRIMESTER,
  waktuWib, labelBulanPeriode, bulanSebelumnya, penutupTrimester,
  rencanaTerbitCron, parseOverridePeriode,
} from '../src/utils/raportCron.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 300)}`); }
}
console.log('raportCron — jadwal terbit otomatis (WIB, trimester, override)');

// ---------------- kemurnian ----------------
uji('raportCron.js TIDAK mengimpor firebase & tanpa path absolut', () => {
  const src = readFileSync(new URL('../src/utils/raportCron.js', import.meta.url), 'utf8');
  assert.equal(/from\s+['"]firebase/i.test(src), false);
  assert.equal(src.includes('/home/user/'), false);
});

// ---------------- waktuWib ----------------
uji('waktuWib: konstanta UTC+7 & konversi benar', () => {
  assert.equal(SELISIH_WIB_MS, 7 * 3600 * 1000);
  const w = waktuWib('2026-10-31T17:30:00Z');
  assert.deepEqual({ tahun: w.tahun, bulan: w.bulan, tanggal: w.tanggal, jam: w.jam, menit: w.menit },
    { tahun: 2026, bulan: 11, tanggal: 1, jam: 0, menit: 30 });
});
uji('waktuWib: masih 31 Okt bila sebelum 17.00 UTC', () => {
  const w = waktuWib('2026-10-31T16:59:00Z');
  assert.equal(w.tanggal, 31); assert.equal(w.bulan, 10);
});
uji('waktuWib: input tak valid → null (tidak menebak)', () => {
  assert.equal(waktuWib('bukan-tanggal'), null);
  assert.equal(waktuWib(''), null);
  assert.equal(waktuWib(null), null);
});
uji('waktuWib: menerima epoch ms langsung', () => {
  const w = waktuWib(Date.UTC(2026, 10, 1, 0, 5)); // 1 Nov 00.05 UTC = 07.05 WIB
  assert.equal(w.tanggal, 1); assert.equal(w.jam, 7);
});

// ---------------- helper bulan ----------------
uji('labelBulanPeriode: padding dua digit', () => {
  assert.equal(labelBulanPeriode(2026, 8), '2026-08');
  assert.equal(labelBulanPeriode(2027, 11), '2027-11');
});
uji('bulanSebelumnya: lintas tahun (Jan → Des tahun lalu)', () => {
  assert.deepEqual(bulanSebelumnya(2027, 1), { tahun: 2026, bulan: 12 });
  assert.deepEqual(bulanSebelumnya(2026, 10), { tahun: 2026, bulan: 9 });
});
uji('penutupTrimester: Okt menutup Agu–Okt; Sep/Nov bukan penutup', () => {
  assert.equal(BULAN_AWAL_TRIMESTER, 8);
  assert.deepEqual(penutupTrimester(2026, 10), { tahun: 2026, bulan: 8 });
  assert.equal(penutupTrimester(2026, 9), null);
  assert.equal(penutupTrimester(2026, 11), null);
});
uji('penutupTrimester: Jan menutup Nov–Jan (lintas tahun)', () => {
  assert.deepEqual(penutupTrimester(2027, 1), { tahun: 2026, bulan: 11 });
  assert.deepEqual(penutupTrimester(2027, 4), { tahun: 2027, bulan: 2 });
  assert.deepEqual(penutupTrimester(2027, 7), { tahun: 2027, bulan: 5 });
});

// ---------------- rencanaTerbitCron ----------------
uji('rencana: 1 Nov 00.05 WIB → terbit 2026-10 + laporan besar Agu–Okt', () => {
  const r = rencanaTerbitCron('2026-10-31T17:05:00Z');
  assert.equal(r.jalan, true);
  assert.deepEqual(r.periode, [
    { bulan: '2026-10' },
    { mulai: '2026-08', selesai: '2026-10' },
  ]);
});
uji('rencana: 31 Okt 23.59 WIB (bukan tanggal 1) → no-op dengan alasan jujur', () => {
  const r = rencanaTerbitCron('2026-10-31T16:59:00Z');
  assert.equal(r.jalan, false);
  assert.deepEqual(r.periode, []);
  assert.ok(r.alasan.includes('Bukan tanggal 1'));
});
uji('rencana: pertengahan bulan → no-op (snapshot terkunci tak dihitung ulang)', () => {
  const r = rencanaTerbitCron('2026-09-15T05:00:00Z');
  assert.equal(r.jalan, false);
  assert.equal(r.periode.length, 0);
});
uji('rencana: 1 Okt → terbit 2026-09 TANPA laporan besar (Sep bukan penutup)', () => {
  const r = rencanaTerbitCron('2026-09-30T17:05:00Z');
  assert.equal(r.jalan, true);
  assert.deepEqual(r.periode, [{ bulan: '2026-09' }]);
});
uji('rencana: 1 Jan 2027 → terbit 2026-12 tanpa besar (Des bukan penutup)', () => {
  const r = rencanaTerbitCron('2026-12-31T17:05:00Z');
  assert.equal(r.jalan, true);
  assert.deepEqual(r.periode, [{ bulan: '2026-12' }]);
});
uji('rencana: 1 Feb 2027 → terbit 2027-01 + laporan besar Nov–Jan lintas tahun', () => {
  const r = rencanaTerbitCron('2027-01-31T17:05:00Z');
  assert.equal(r.jalan, true);
  assert.deepEqual(r.periode, [
    { bulan: '2027-01' },
    { mulai: '2026-11', selesai: '2027-01' },
  ]);
});
uji('rencana: waktu tak valid → jalan=false, alasan jujur, tanpa periode', () => {
  const r = rencanaTerbitCron('entah-kapan');
  assert.equal(r.jalan, false);
  assert.equal(r.wib, null);
  assert.ok(r.alasan.includes('tidak valid'));
});
uji('rencana: paksaTanggalSatu untuk uji/backfill manual di luar tanggal 1', () => {
  const r = rencanaTerbitCron('2026-11-05T03:00:00Z', { paksaTanggalSatu: true });
  assert.equal(r.jalan, true);
  // bulan tertutup = Okt (penutup trimester Agu–Okt) → ikut laporan besar
  assert.deepEqual(r.periode, [
    { bulan: '2026-10' },
    { mulai: '2026-08', selesai: '2026-10' },
  ]);
  // September bukan penutup → hanya bulanan
  const r2 = rencanaTerbitCron('2026-10-05T03:00:00Z', { paksaTanggalSatu: true });
  assert.deepEqual(r2.periode, [{ bulan: '2026-09' }]);
});

// ---------------- parseOverridePeriode ----------------
uji('parseOverride: bulan tunggal, rentang, dan daftar koma', () => {
  assert.deepEqual(parseOverridePeriode('2026-09'), [{ bulan: '2026-09' }]);
  assert.deepEqual(parseOverridePeriode('2026-08..2026-10'), [{ mulai: '2026-08', selesai: '2026-10' }]);
  assert.deepEqual(parseOverridePeriode('2026-09, 2026-08..2026-10'), [
    { bulan: '2026-09' }, { mulai: '2026-08', selesai: '2026-10' },
  ]);
});
uji('parseOverride: format salah → throw (tidak pernah menebak periode)', () => {
  assert.throws(() => parseOverridePeriode('September'), /tidak dikenal/);
  assert.throws(() => parseOverridePeriode('2026-13'), /tidak dikenal/);
  assert.throws(() => parseOverridePeriode('2026-08..'), /tidak dikenal/);
  assert.throws(() => parseOverridePeriode(''), /kosong/);
});

console.log(`\n[${lulus} lulus, ${gagal} gagal]`);
process.exit(gagal ? 1 : 0);
