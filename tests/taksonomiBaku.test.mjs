// tests/taksonomiBaku.test.mjs
// ============================================================
// Uji kewajaran draf taksonomi Literasi & Bahasa Inggris
// (src/utils/taksonomiBaku.js).
//
//     node tests/taksonomiBaku.test.mjs
//
// Draf ini disusun dari nilai `materi` yang benar-benar ada di data produksi
// (Audit Materi 2026-10-08). Uji di bawah tidak memaku ISI kurikulum (itu hak
// owner & guru), melainkan memastikan drafnya tidak melahirkan kerusakan baru:
// tidak ada bab kembar, tidak ada bab kosong, setiap entri punya jenjang &
// kelas, dan nilai materi yang paling banyak di data benar-benar TERCAKUP
// oleh salah satu bab (kalau tidak, pemetaan akan gagal sejak awal).
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_LITERASI, SEED_BAHASA_INGGRIS, SEED_TAMBAHAN, periksaSeed } from '../src/utils/taksonomiBaku.js';

test('semua seed lolos pemeriksaan kewajaran', () => {
  for (const [mapel, seed] of Object.entries(SEED_TAMBAHAN)) {
    assert.deepEqual(periksaSeed(seed), [], `seed ${mapel} harus bebas masalah`);
  }
});

test('periksaSeed menangkap bab kembar, bab kosong, dan entri bolong', () => {
  assert.ok(periksaSeed([{ jenjang: 'SMP/MTs', kelas: 'Semua', babBaku: ['A', 'a'] }]).length > 0, 'kembar beda kapital harus ketangkap');
  assert.ok(periksaSeed([{ jenjang: 'SMP/MTs', kelas: 'Semua', babBaku: ['A', ''] }]).length > 0);
  assert.ok(periksaSeed([{ jenjang: 'SMP/MTs', kelas: 'Semua', babBaku: [] }]).length > 0);
  assert.ok(periksaSeed([{ kelas: 'Semua', babBaku: ['A'] }]).length > 0, 'tanpa jenjang');
  assert.deepEqual(periksaSeed(null), [], 'input kosong tidak melempar');
});

test('nilai materi TERBANYAK di data produksi tercakup draf (tidak gagal sejak awal)', () => {
  // Dari Audit Materi 2026-10-08: nilai dengan butir terbanyak per jenjang.
  const literasiSd = ['Teks Eksposisi', 'Teks Laporan', 'Teks Narasi', 'Teks Petunjuk', 'Teks Deskripsi'];
  const sd = SEED_LITERASI.find((e) => e.jenjang === 'SD/MI');
  for (const v of literasiSd) assert.ok(sd.babBaku.includes(v), `Literasi SD harus menampung "${v}"`);

  const bingSmp = ['Recount Text', 'Descriptive Text', 'Procedure Text'];
  const smp = SEED_BAHASA_INGGRIS.find((e) => e.jenjang === 'SMP/MTs');
  for (const v of bingSmp) assert.ok(smp.babBaku.some((b) => b.toLowerCase().startsWith(v.toLowerCase())), `B.Inggris SMP harus menampung induk "${v}"`);

  const bingSma = ['Narrative Text', 'Procedure Text'];
  const sma = SEED_BAHASA_INGGRIS.find((e) => e.jenjang === 'SMA/MA');
  for (const v of bingSma) assert.ok(sma.babBaku.includes(v), `B.Inggris SMA harus menampung "${v}"`);
});

test('SMA Literasi dipecah (tidak lagi satu tombol untuk puluhan soal)', () => {
  const sma = SEED_LITERASI.find((e) => e.jenjang === 'SMA/MA');
  assert.ok(sma.babBaku.length >= 6, 'satu nilai lama menampung 97 butir; pecahannya harus bermakna');
});

test('fase mengikuti jenjang (A-C SD, D SMP, E-F SMA)', () => {
  assert.equal(SEED_LITERASI.find((e) => e.jenjang === 'SD/MI').fase, 'B-C');
  assert.equal(SEED_LITERASI.find((e) => e.jenjang === 'SMP/MTs').fase, 'D');
  assert.equal(SEED_BAHASA_INGGRIS.find((e) => e.jenjang === 'SMA/MA').fase, 'E-F');
});
