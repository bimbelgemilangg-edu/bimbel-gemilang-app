import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDaftarUnitJalurUjian,
  getSoalPresetUnitRoadmap,
  hitungProgresiJalur,
  deteksiJenjangUjianAkhir,
} from '../src/utils/jalurUjianAiConfig.js';

test('deteksi jenjang ujian akhir (SD, SMP, SMA/UTBK)', () => {
  const sd = deteksiJenjangUjianAkhir({ kelas: '6 SD' });
  assert.equal(sd.jenjang, 'SD');
  assert.equal(sd.labelBadge, 'TKA SD');

  const smp = deteksiJenjangUjianAkhir({ kelas: '9 SMP' });
  assert.equal(smp.jenjang, 'SMP');
  assert.equal(smp.labelBadge, 'TKA SMP');

  const sma = deteksiJenjangUjianAkhir({ kelas: '12 SMA' });
  assert.equal(sma.jenjang, 'SMA');
  assert.equal(sma.labelBadge, 'UTBK / TKA');

  const reg = deteksiJenjangUjianAkhir({ kelas: '7 SMP' });
  assert.equal(reg, null);
});

test('arsitektur micro-learning: durasi 15-25 menit & 10-15 butir per unit', () => {
  for (const j of ['SD', 'SMP', 'SMA']) {
    const units = getDaftarUnitJalurUjian(j).filter((u) => u.tipe !== 'review');
    assert.ok(units.length >= 5, `Jenjang ${j} minimal memiliki 5 unit bertahap`);
    for (const u of units) {
      assert.ok(u.durasiMenit >= 15 && u.durasiMenit <= 25, `${j} Unit ${u.unitNomor} durasi ${u.durasiMenit} mnt melebihi batas ramah micro-learning`);
      assert.ok(u.jumlahSoal >= 10 && u.jumlahSoal <= 15, `${j} Unit ${u.unitNomor} jumlah soal ${u.jumlahSoal} butir melebihi batas micro-learning`);
      assert.ok(Boolean(u.polaFokus), `${j} Unit ${u.unitNomor} wajib memiliki fokus pola soal`);
    }
  }
});

test('anti-zonk fallback preset: kesiapan 100% soal untuk seluruh unit SD, SMP, SMA', () => {
  // SD
  for (let u = 1; u <= 5; u++) {
    const target = u === 5 ? 15 : 12;
    const soal = getSoalPresetUnitRoadmap('SD', u, target);
    assert.equal(soal.length, target, `SD Unit ${u} gagal menghasilkan ${target} soal master`);
    for (const s of soal) {
      assert.ok(Boolean(s.teksSoal || s.teks_soal || s.soal), 'Teks soal SD wajib terisi');
      assert.ok(Boolean(s.kunciJawaban || s.kunci), 'Kunci jawaban SD wajib terisi');
    }
  }

  // SMP
  for (let u = 1; u <= 6; u++) {
    const target = u === 6 ? 15 : 12;
    const soal = getSoalPresetUnitRoadmap('SMP', u, target);
    assert.equal(soal.length, target, `SMP Unit ${u} gagal menghasilkan ${target} soal master`);
    for (const s of soal) {
      assert.ok(Boolean(s.teksSoal || s.teks_soal || s.soal), 'Teks soal SMP wajib terisi');
      assert.ok(Boolean(s.kunciJawaban || s.kunci), 'Kunci jawaban SMP wajib terisi');
    }
  }

  // SMA / UTBK
  for (let u = 1; u <= 6; u++) {
    const target = u === 6 ? 15 : 12;
    const soal = getSoalPresetUnitRoadmap('SMA', u, target);
    assert.equal(soal.length, target, `SMA Unit ${u} gagal menghasilkan ${target} soal master`);
    for (const s of soal) {
      assert.ok(Boolean(s.teksSoal || s.teks_soal || s.soal), 'Teks soal UTBK wajib terisi');
      assert.ok(Boolean(s.kunciJawaban || s.kunci), 'Kunci jawaban UTBK wajib terisi');
    }
  }
});

test('hitungProgresiJalur: mekanisme gembok bertahap tanpa deadline', () => {
  const units = getDaftarUnitJalurUjian('SMP');

  // Kondisi A: Belum ada pengerjaan sama sekali
  const progA = hitungProgresiJalur(units, []);
  assert.equal(progA.unitList[0].status, 'current', 'Unit 1 harus otomatis terbuka');
  assert.equal(progA.unitList[1].status, 'locked', 'Unit 2 harus terkunci');
  assert.equal(progA.unitList[2].status, 'locked', 'Unit 3 harus terkunci');
  assert.equal(progA.selesaiCount, 0);

  // Kondisi B: Siswa menyelesaikan Unit 1
  const sesiU1 = {
    id: 'sesi-1',
    paketId: units[0].id,
    unitNomor: 1,
    status: 'selesai',
    totalSkorPersen: 85,
    xpFinal: 100,
  };
  const progB = hitungProgresiJalur(units, [sesiU1]);
  assert.equal(progB.unitList[0].status, 'completed', 'Unit 1 harus berstatus completed');
  assert.equal(progB.unitList[0].skor, 85, 'Skor Unit 1 harus 85%');
  assert.equal(progB.unitList[1].status, 'current', 'Unit 2 harus otomatis terbuka');
  assert.equal(progB.unitList[2].status, 'locked', 'Unit 3 tetap terkunci');
  assert.equal(progB.selesaiCount, 1);
});
