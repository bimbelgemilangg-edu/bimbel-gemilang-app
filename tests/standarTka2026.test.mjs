// tests/standarTka2026.test.mjs
// ============================================================
// Test struktur resmi TKA 2026 (src/utils/standarTka2026.js).
//
//     node tests/standarTka2026.test.mjs
//
// INVARIAN PALING PENTING di berkas ini: SETIAP baris struktur wajib membawa
// `sumber` yang tidak kosong. Itu pagar terhadap "mengarang": angka tanpa
// tuan resmi tidak boleh lolos ke kode ini.
// ============================================================

import assert from 'node:assert/strict';
import {
  MAPEL_WAJIB_TKA, JUMLAH_MAPEL_PILIHAN_SMA, SESI_TKA, BENTUK_SOAL_RESMI,
  strukturTryoutTka, ringkasanStruktur, bandingkanDenganStandar, SURVEI_SD_SMP_MENIT,
} from '../src/utils/standarTka2026.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

uji('mata uji wajib per jenjang sesuai Pusmendik', () => {
  assert.deepEqual(MAPEL_WAJIB_TKA.SD, ['Matematika', 'Bahasa Indonesia']);
  assert.deepEqual(MAPEL_WAJIB_TKA.SMP, ['Matematika', 'Bahasa Indonesia']);
  assert.deepEqual(MAPEL_WAJIB_TKA.SMA, ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris']);
});

uji('SMA: 3 wajib 25 butir/75 menit + pilihan dibatasi 2', () => {
  const baris = strukturTryoutTka('12 SMA', { mapelPilihan: ['Fisika', 'Kimia', 'Biologi'] });
  const wajib = baris.filter((b) => b.kategori === 'wajib');
  const pilihan = baris.filter((b) => b.kategori === 'pilihan');
  assert.equal(wajib.length, 3);
  assert.ok(wajib.every((b) => b.butir === 25 && b.durasiMenit === 75));
  assert.equal(pilihan.length, JUMLAH_MAPEL_PILIHAN_SMA, 'lebih dari 2 pilihan dipotong, bukan ditolak diam-diam');
  assert.ok(pilihan.every((b) => b.butir === 25 && b.durasiMenit === 60));
});

uji('SD & SMP: 2 wajib 30 butir/75 menit, tanpa mapel pilihan', () => {
  for (const j of ['6 SD', '9 SMP']) {
    const baris = strukturTryoutTka(j, { mapelPilihan: ['Fisika'] });
    assert.equal(baris.length, 2);
    assert.ok(baris.every((b) => b.butir === 30 && b.durasiMenit === 75 && b.kategori === 'wajib'));
  }
});

uji('jenjang dibaca dari teks kelas & SMK dipetakan ke struktur SMA', () => {
  assert.equal(strukturTryoutTka('9 SMP').length, 2);
  assert.equal(strukturTryoutTka('13 SMK').length, 3);
  assert.deepEqual(strukturTryoutTka('Semua'), []);
});

uji('total resmi SMA lengkap: 125 butir / 345 menit', () => {
  const ring = ringkasanStruktur(strukturTryoutTka('SMA', { mapelPilihan: ['Fisika', 'Kimia'] }));
  assert.equal(ring.totalButir, 125);
  assert.equal(ring.totalMenit, 345);
  assert.equal(SURVEI_SD_SMP_MENIT, 20);
});

uji('INVARIAN anti-mengarang: setiap baris membawa sumber tidak kosong', () => {
  for (const j of ['SD', 'SMP', 'SMA']) {
    for (const b of strukturTryoutTka(j, { mapelPilihan: ['Fisika'] })) {
      assert.ok(typeof b.sumber === 'string' && b.sumber.trim().length > 10, `baris ${b.mapel} tanpa sumber`);
    }
  }
  for (const grup of Object.values(SESI_TKA)) {
    for (const k of Object.values(grup)) assert.ok(k.sumber.trim().length > 10);
  }
});

uji('bentuk soal resmi terpetaan ke tipe yang ADA di Bank Soal', () => {
  assert.deepEqual(BENTUK_SOAL_RESMI.map((x) => x.tipe), ['pg_sederhana', 'pg_kompleks']);
});

uji('bandingkanDenganStandar menghitung isi keranjang per mapel', () => {
  const keranjang = [
    { mapel: 'Matematika' }, { mapel: 'Matematika' }, { mapel: 'Bahasa Indonesia' },
    { mapel: 'Seni Budaya' }, // tidak resmi: diabaikan, bukan ditebak
  ];
  const baris = bandingkanDenganStandar(keranjang, '9 SMP');
  const mtk = baris.find((b) => b.mapel === 'Matematika');
  const bind = baris.find((b) => b.mapel === 'Bahasa Indonesia');
  assert.equal(mtk.isiKeranjang, 2);
  assert.equal(mtk.butir, 30);
  assert.equal(bind.isiKeranjang, 1);
  assert.ok(!baris.some((b) => b.mapel === 'Seni Budaya'));
});

console.log('');
console.log(`# standarTka2026: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
