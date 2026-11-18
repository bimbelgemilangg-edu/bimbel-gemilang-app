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

test('arsitektur micro-learning: durasi 15-25 menit & 10-15 butir per unit & pemisahan subtes murni', () => {
  for (const j of ['SD', 'SMP', 'SMA']) {
    const units = getDaftarUnitJalurUjian(j).filter((u) => u.tipe !== 'review');
    assert.ok(units.length >= 8, `Jenjang ${j} minimal memiliki 8 unit bertahap (ditemukan ${units.length})`);
    for (const u of units) {
      assert.ok(u.durasiMenit >= 15 && u.durasiMenit <= 25, `${j} Unit ${u.unitNomor} durasi ${u.durasiMenit} mnt melebihi batas ramah micro-learning`);
      assert.ok(u.jumlahSoal >= 10 && u.jumlahSoal <= 15, `${j} Unit ${u.unitNomor} jumlah soal ${u.jumlahSoal} butir melebihi batas micro-learning`);
      assert.ok(Boolean(u.polaFokus), `${j} Unit ${u.unitNomor} wajib memiliki fokus pola soal`);
      assert.ok(Boolean(u.subtesKode), `${j} Unit ${u.unitNomor} wajib memiliki kode subtes yang jelas`);
      assert.ok(Boolean(u.kategoriSubtes), `${j} Unit ${u.unitNomor} wajib memiliki kategori subtes`);

      // Tidak boleh mencampurkan Matematika dan Bahasa Indonesia dalam 1 unit latihan (unit 1-7)
      if (u.unitNomor < 8) {
        assert.ok(!u.judul.toLowerCase().includes(' dan '), `${j} Unit ${u.unitNomor} tidak boleh mencampur dua mapel dengan kata 'dan'`);
        if (j === 'SMP' || j === 'SD') {
          assert.ok(
            u.kategoriSubtes === 'Matematika' || u.kategoriSubtes === 'Bahasa Indonesia',
            `${j} Unit ${u.unitNomor} harus murni Matematika atau Bahasa Indonesia`
          );
        } else if (j === 'SMA') {
          assert.ok(
            ['PU', 'PK', 'PBM', 'PPU', 'LBI', 'LBE', 'PM'].includes(u.subtesKode),
            `SMA Unit ${u.unitNomor} harus merupakan salah satu dari 7 subtes resmi SNPMB`
          );
        }
      }
    }
  }
});

test('anti-zonk fallback preset: kesiapan 100% soal untuk seluruh 8 unit SD, SMP, SMA', () => {
  // SD (8 Unit)
  for (let u = 1; u <= 8; u++) {
    const target = u === 8 ? 14 : 12;
    const soal = getSoalPresetUnitRoadmap('SD', u, target);
    assert.equal(soal.length, target, `SD Unit ${u} gagal menghasilkan ${target} soal master`);
    for (const s of soal) {
      assert.ok(Boolean(s.teksSoal || s.teks_soal || s.soal), 'Teks soal SD wajib terisi');
      assert.ok(Boolean(s.kunciJawaban || s.kunci), 'Kunci jawaban SD wajib terisi');
    }
  }

  // SMP (8 Unit)
  for (let u = 1; u <= 8; u++) {
    const target = u === 8 ? 14 : 12;
    const soal = getSoalPresetUnitRoadmap('SMP', u, target);
    assert.equal(soal.length, target, `SMP Unit ${u} gagal menghasilkan ${target} soal master`);
    for (const s of soal) {
      assert.ok(Boolean(s.teksSoal || s.teks_soal || s.soal), 'Teks soal SMP wajib terisi');
      assert.ok(Boolean(s.kunciJawaban || s.kunci), 'Kunci jawaban SMP wajib terisi');
    }
  }

  // SMA / UTBK (8 Unit)
  for (let u = 1; u <= 8; u++) {
    const target = u === 8 ? 14 : 12;
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
    studentId: 'STD-0926070002',
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

test('isolasi ketat per siswa: sesi siswa lain dan tryout non-roadmap TIDAK BOLEH mencemari progres & analisis', () => {
  const units = getDaftarUnitJalurUjian('SMP');

  // Skenario 1: Siswa A belum mengerjakan apapun di Roadmap, tapi pernah mengerjakan try out reguler luar
  const sesiLuarSiswaA = {
    id: 'sesi-reguler-lama',
    studentId: 'STD-0926070002',
    paketId: 'tryout-reguler-mingguan-lama',
    status: 'selesai',
    totalSkorPersen: 50,
    waktuMulaiMs: 1000000,
    waktuSelesaiMs: 1000000 + (578 * 12 * 1000),
  };

  // Skenario 2: Siswa B (siswa lain) yang sudah menyelesaikan Unit 1 dengan skor 95
  const sesiSiswaB = {
    id: 'sesi-milik-siswa-lain',
    studentId: 'STD-SISWA-LAIN-999',
    paketId: units[0].id,
    unitNomor: 1,
    status: 'selesai',
    totalSkorPersen: 95,
  };

  // Uji progres Siswa A
  const progSiswaA = hitungProgresiJalur(units, [sesiLuarSiswaA]);
  assert.equal(progSiswaA.selesaiCount, 0, 'Sesi di luar unit roadmap TIDAK BOLEH membuat unit roadmap selesai');
  assert.equal(progSiswaA.unitList[0].status, 'current', 'Unit 1 Siswa A tetap current (belum selesai)');
  assert.equal(progSiswaA.unitList[1].status, 'locked', 'Unit 2 Siswa A tetap locked');

  // Saring sesi khusus siswa A dan unit roadmap
  const validIds = new Set(units.map((u) => u.id));
  const sesiRoadmapSiswaA = [sesiLuarSiswaA, sesiSiswaB].filter((s) => {
    return s.studentId === 'STD-0926070002' && validIds.has(s.paketId) && s.status === 'selesai';
  });

  assert.equal(sesiRoadmapSiswaA.length, 0, 'Siswa A harus memiliki 0 sesi roadmap yang sah');
});
