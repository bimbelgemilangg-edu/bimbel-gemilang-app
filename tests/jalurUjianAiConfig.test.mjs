// tests/jalurUjianAiConfig.test.mjs
import assert from 'node:assert/strict';
import {
  deteksiJenjangUjianAkhir,
  getDaftarUnitJalurUjian,
  hitungProgresiJalur,
} from '../src/utils/jalurUjianAiConfig.js';

let lulus = 0;
let gagal = 0;
function uji(n, f) {
  try {
    f();
    lulus++;
    console.log(`  ✓ ${n}`);
  } catch (e) {
    gagal++;
    console.log(`  ✗ ${n}\n      ${e.message}`);
  }
}

console.log('--- TEST JALUR UJIAN AI CONFIG ---');

uji('deteksiJenjangUjianAkhir: hanya mendeteksi kelas 6 SD, 9 SMP, 12 SMA/SMK/UTBK', () => {
  // Kelas 6 SD
  assert.equal(deteksiJenjangUjianAkhir('6 SD')?.jenjang, 'SD');
  assert.equal(deteksiJenjangUjianAkhir('Kelas 6')?.jenjang, 'SD');
  assert.equal(deteksiJenjangUjianAkhir({ kelasSekolah: '6 SD' })?.jenjang, 'SD');

  // Kelas 9 SMP
  assert.equal(deteksiJenjangUjianAkhir('9 SMP')?.jenjang, 'SMP');
  assert.equal(deteksiJenjangUjianAkhir('Kelas 9')?.jenjang, 'SMP');
  assert.equal(deteksiJenjangUjianAkhir({ kelasSekolah: '9A SMP' })?.jenjang, 'SMP');

  // Kelas 12 SMA / SMK / Alumni
  assert.equal(deteksiJenjangUjianAkhir('12 SMA')?.jenjang, 'SMA');
  assert.equal(deteksiJenjangUjianAkhir('XII MIPA')?.jenjang, 'SMA');
  assert.equal(deteksiJenjangUjianAkhir('Alumni UTBK')?.jenjang, 'SMA');
  assert.equal(deteksiJenjangUjianAkhir({ kelasSekolah: '12 SMK' })?.jenjang, 'SMA');

  // Jenjang bukan akhir -> HARUS null (menu disembunyikan!)
  assert.equal(deteksiJenjangUjianAkhir('7 SMP'), null);
  assert.equal(deteksiJenjangUjianAkhir('8 SMP'), null);
  assert.equal(deteksiJenjangUjianAkhir('10 SMA'), null);
  assert.equal(deteksiJenjangUjianAkhir('11 SMA'), null);
  assert.equal(deteksiJenjangUjianAkhir('5 SD'), null);
  assert.equal(deteksiJenjangUjianAkhir(''), null);
  assert.equal(deteksiJenjangUjianAkhir(null), null);
});

uji('getDaftarUnitJalurUjian: mengembalikan unit bertahap untuk SD, SMP, SMA', () => {
  const unitsSmp = getDaftarUnitJalurUjian('SMP');
  assert.equal(unitsSmp.length, 5);
  assert.equal(unitsSmp[0].tipe, 'start');
  assert.equal(unitsSmp[0].unitNomor, 1);
  assert.equal(unitsSmp[3].unitNomor, 4);
  assert.equal(unitsSmp[4].tipe, 'review');

  const unitsSd = getDaftarUnitJalurUjian('SD');
  assert.equal(unitsSd.length, 5);
  assert.equal(unitsSd[0].tipe, 'start');

  const unitsSma = getDaftarUnitJalurUjian('SMA');
  assert.equal(unitsSma.length, 5);
  assert.equal(unitsSma[3].jumlahSoal, 50);
});

uji('hitungProgresiJalur: Unit 1 selalu terbuka, Unit N terbuka setelah Unit N-1 selesai', () => {
  const units = getDaftarUnitJalurUjian('SMP');

  // 1. Belum ada sesi yang selesai sama sekali
  const p1 = hitungProgresiJalur(units, []);
  assert.equal(p1.unitList[0].status, 'current');
  assert.equal(p1.unitList[1].status, 'locked');
  assert.equal(p1.unitList[2].status, 'locked');
  assert.equal(p1.unitList[3].status, 'locked');
  assert.equal(p1.selesaiCount, 0);

  // 2. Unit 1 sudah selesai (skor 85)
  const p2 = hitungProgresiJalur(units, [
    { paketId: 'jalur-ai-smp-u1', status: 'selesai', totalSkorPersen: 85, xpFinal: 180 },
  ]);
  assert.equal(p2.unitList[0].status, 'completed');
  assert.equal(p2.unitList[0].skor, 85);
  assert.equal(p2.unitList[1].status, 'current'); // Unit 2 sekarang terbuka!
  assert.equal(p2.unitList[2].status, 'locked');
  assert.equal(p2.selesaiCount, 1);

  // 3. Unit 1 dan Unit 2 sudah selesai
  const p3 = hitungProgresiJalur(units, [
    { paketId: 'jalur-ai-smp-u1', status: 'selesai', totalSkorPersen: 85 },
    { paketId: 'jalur-ai-smp-u2', status: 'selesai', totalSkorPersen: 90 },
  ]);
  assert.equal(p3.unitList[0].status, 'completed');
  assert.equal(p3.unitList[1].status, 'completed');
  assert.equal(p3.unitList[2].status, 'current'); // Unit 3 sekarang terbuka!
  assert.equal(p3.unitList[3].status, 'locked');
  assert.equal(p3.selesaiCount, 2);
});

console.log(`\nHasil test: ${lulus} lulus, ${gagal} gagal.\n`);
if (gagal > 0) process.exit(1);
