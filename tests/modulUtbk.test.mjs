// tests/modulUtbk.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DAFTAR_SUBTES_MODUL,
  SEMUA_BAB_MODUL,
  getSubtestByKode,
  getBabBySlug,
  getBabTetangga,
  hitungStatistikModulSiswa,
} from '../src/data/ambisModulUtbkData.js';

test('Modul UTBK: kelengkapan 7 Subtes dan total 46 Bab', () => {
  assert.equal(DAFTAR_SUBTES_MODUL.length, 7, 'Harus ada 7 subtes UTBK-SNBT');

  const expectedSubtes = ['PU', 'PPU', 'PBM', 'PK', 'LBIN', 'LBING', 'PM'];
  const actualSubtes = DAFTAR_SUBTES_MODUL.map((s) => s.kode);
  assert.deepEqual(actualSubtes, expectedSubtes, 'Daftar kode 7 subtes harus sesuai standar');

  assert.equal(SEMUA_BAB_MODUL.length, 46, 'Total seluruh bab dari 7 subtes harus 46');

  // Cek jumlah bab per subtes
  const pu = getSubtestByKode('PU');
  assert.equal(pu.totalBab, 6, 'PU harus 6 bab');

  const ppu = getSubtestByKode('PPU');
  assert.equal(ppu.totalBab, 5, 'PPU harus 5 bab');

  const pbm = getSubtestByKode('PBM');
  assert.equal(pbm.totalBab, 6, 'PBM harus 6 bab');

  const pk = getSubtestByKode('PK');
  assert.equal(pk.totalBab, 10, 'PK harus 10 bab');

  const lbin = getSubtestByKode('LBIN');
  assert.equal(lbin.totalBab, 5, 'LBIN harus 5 bab');

  const lbing = getSubtestByKode('LBING');
  assert.equal(lbing.totalBab, 5, 'LBING harus 5 bab');

  const pm = getSubtestByKode('PM');
  assert.equal(pm.totalBab, 9, 'PM harus 9 bab');
});

test('Modul UTBK: validasi struktur dan kelengkapan konten 46 bab', () => {
  SEMUA_BAB_MODUL.forEach((bab) => {
    assert.ok(bab.id, `Bab harus punya id: ${JSON.stringify(bab)}`);
    assert.ok(bab.judul, `Bab ${bab.id} harus punya judul`);
    assert.ok(bab.slug, `Bab ${bab.id} harus punya slug`);
    assert.ok(bab.subtestKode, `Bab ${bab.id} harus punya subtestKode`);
    assert.ok(bab.durasiBacaMenit >= 5, `Bab ${bab.id} durasi minimal 5 menit`);
    assert.ok(Array.isArray(bab.learningObjectives) && bab.learningObjectives.length >= 2, `Bab ${bab.id} harus punya minimal 2 learning objectives`);
    assert.ok(Array.isArray(bab.konsepTeori) && bab.konsepTeori.length >= 1, `Bab ${bab.id} harus punya minimal 1 konsepTeori`);
    assert.ok(bab.trikCepat, `Bab ${bab.id} harus punya trik cepat`);
    assert.ok(Array.isArray(bab.contohSoal) && bab.contohSoal.length >= 1, `Bab ${bab.id} harus punya minimal 1 contoh soal`);
    assert.ok(Array.isArray(bab.kuisPemahaman), `Bab ${bab.id} kuis pemahaman harus array`);
    assert.equal(bab.kuisPemahaman.length, 5, `Bab ${bab.id} harus memiliki tepat 5 butir soal kuis`);

    // Validasi setiap butir soal kuis
    bab.kuisPemahaman.forEach((q, qIdx) => {
      assert.ok(q.id, `Kuis #${qIdx + 1} di bab ${bab.id} harus punya id`);
      assert.ok(q.soal, `Kuis #${qIdx + 1} di bab ${bab.id} harus punya teks soal`);
      assert.ok(Array.isArray(q.opsi) && q.opsi.length === 5, `Kuis #${qIdx + 1} di bab ${bab.id} harus punya 5 opsi (A-E)`);
      assert.ok(['A', 'B', 'C', 'D', 'E'].includes(q.kunci), `Kuis #${qIdx + 1} di bab ${bab.id} kunci harus salah satu A-E`);
      assert.ok(q.pembahasan && q.pembahasan.length > 10, `Kuis #${qIdx + 1} di bab ${bab.id} harus punya pembahasan memadai`);
    });

    assert.ok(Array.isArray(bab.keyTakeaways) && bab.keyTakeaways.length >= 2, `Bab ${bab.id} harus punya key takeaways`);
  });
});

test('Modul UTBK: helper navigasi bab tetangga dan statistik', () => {
  // Bab pertama PU
  const nav1 = getBabTetangga('PU', 'pu-logika-proposisi');
  assert.equal(nav1.prevBab, null, 'Bab 1 tidak memiliki bab sebelumnya');
  assert.ok(nav1.nextBab, 'Bab 1 harus punya nextBab');
  assert.equal(nav1.nextBab.slug, 'pu-kuantor-dan-silogisme');

  // Bab terakhir PU (Bab 6)
  const navLast = getBabTetangga('PU', 'pu-sebab-akibat-dan-simpulan-logis');
  assert.ok(navLast.prevBab, 'Bab 6 harus punya prevBab');
  assert.equal(navLast.nextBab, null, 'Bab 6 adalah bab terakhir di PU');

  // Statistik progres
  const stat = hitungStatistikModulSiswa('siswa_dummy_test');
  assert.equal(stat.totalBab, 46);
  assert.ok(typeof stat.persenTotal === 'number');
  assert.ok(stat.perSubtes['PU']);
  assert.equal(stat.perSubtes['PU'].total, 6);
  assert.equal(stat.perSubtes['PK'].total, 10);
});
