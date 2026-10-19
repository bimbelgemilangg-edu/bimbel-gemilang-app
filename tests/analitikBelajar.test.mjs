// tests/analitikBelajar.test.mjs
// Uji dashboard Analitik Belajar (owner 14 Okt 2026): kecepatan, kekuatan,
// kelemahan, progres naik/turun — per siswa & kohort.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bangunAnalitikBelajar, detikPerSoalSesi, arahProgres, AMBANG_DELTA, identitasTampilSiswa,
} from '../src/utils/analitikBelajar.js';

const H = 3600_000;
const T0 = new Date(2026, 9, 3, 8, 0, 0).getTime(); // Sabtu pekan 1
const T1 = T0 + 7 * 24 * H;                          // Sabtu pekan 2

const sesi = (over = {}) => ({
  studentId: 'S1', nama: 'Tasya', kelas: '9', paketId: 'p1', jenisUjian: 'TKA',
  totalSkorPersen: 70, waktuSelesaiMs: T0 + 2 * H, createdAtMs: T0, totalSoal: 40,
  subtes: [{ nama: 'Matematika', skorPersen: 80 }, { nama: 'Bahasa Indonesia', skorPersen: 60 }],
  ...over,
});

test('detikPerSoalSesi: jujur null bila waktu mulai tidak sah', () => {
  assert.equal(detikPerSoalSesi(sesi()), 180); // 2 jam / 40 soal
  assert.equal(detikPerSoalSesi(sesi({ createdAtMs: null })), null);
  assert.equal(detikPerSoalSesi(sesi({ totalSoal: 0 })), null);
  assert.equal(detikPerSoalSesi(sesi({ waktuSelesaiMs: T0 })), null);
});

test('arahProgres: ambang 5 poin, di bawahnya stabil, 1 sesi = baru', () => {
  assert.equal(arahProgres(10), 'naik');
  assert.equal(arahProgres(-10), 'turun');
  assert.equal(arahProgres(AMBANG_DELTA), 'naik');
  assert.equal(arahProgres(4), 'stabil');
  assert.equal(arahProgres(null), 'baru');
});

test('per siswa: skor rata, delta sesi terakhir, kuat/lemah, tempo', () => {
  const a = bangunAnalitikBelajar([
    sesi(),
    sesi({ waktuSelesaiMs: T1 + 2 * H, createdAtMs: T1, totalSkorPersen: 90, subtes: [{ nama: 'Matematika', skorPersen: 95 }, { nama: 'Bahasa Indonesia', skorPersen: 85 }] }),
  ]);
  assert.equal(a.siswa.length, 1);
  const s = a.siswa[0];
  assert.equal(s.jumlahSesi, 2);
  assert.equal(s.skorRata, 80);
  assert.equal(s.delta, 20);
  assert.equal(s.arah, 'naik');
  assert.equal(s.detikPerSoal, 180);
  assert.equal(s.terkuat.nama, 'Matematika');
  assert.equal(s.terlemah.nama, 'Bahasa Indonesia');
});

test('kohort: tren pekanan, tempo rata, subtes lemah umum, partisipasi', () => {
  const a = bangunAnalitikBelajar([
    sesi(),
    sesi({ studentId: 'S2', nama: 'Budi', kelas: '9', totalSkorPersen: 50, subtes: [{ nama: 'Matematika', skorPersen: 40 }, { nama: 'Bahasa Indonesia', skorPersen: 60 }] }),
  ]);
  assert.equal(a.kohort.jumlahSiswa, 2);
  assert.equal(a.kohort.jumlahSesi, 2);
  assert.equal(a.kohort.trenPekan.length, 1);
  assert.equal(a.kohort.trenPekan[0].skor, 60);
  assert.equal(a.kohort.detikPerSoalRata, 180);
  assert.equal(a.kohort.subtesLemahUmum[0].nama, 'Bahasa Indonesia'); // lemah Tasya
  // lemah Budi = Matematika(40) vs BIndo(60) -> Matematika; agregat 1-1 urut nama
  assert.equal(a.kohort.subtesLemahUmum.length, 2);
});

test('baris non-TKA/UTBK & tanpa waktu selesai tidak masuk dashboard', () => {
  const a = bangunAnalitikBelajar([
    sesi({ jenisUjian: 'Reguler' }),
    sesi({ waktuSelesaiMs: null }),
  ]);
  assert.equal(a.siswa.length, 0);
  assert.equal(a.kohort.jumlahSesi, 0);
});

test('identitasTampilSiswa: alias nama/kelas/jenjang (regresi tabel ber-ID 19 Okt)', () => {
  assert.equal(identitasTampilSiswa({ namaLengkap: 'Tasya R', kelasSekolah: '9A' }, { studentId: 'STD-1' }).nama, 'Tasya R');
  assert.equal(identitasTampilSiswa({}, { studentName: 'Budi', kelas: '9B' }).nama, 'Budi');
  assert.equal(identitasTampilSiswa({}, { studentId: 'STD-2' }).nama, 'STD-2');
  assert.equal(identitasTampilSiswa({ jenjang: 'SMP/MTs' }, {}).jenjang, 'SMP/MTs');
});
