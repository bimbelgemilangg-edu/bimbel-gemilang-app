// tests/aturanJenisUjian.test.mjs
// Menjaga keputusan owner 2026-10-13 ("rombak filter aneh"): jenis ujian
// TKA/UTBK menurunkan peserta & cakupan materi OTOMATIS; admin tidak lagi
// mengisi dropdown kelas untuk mode ujian. Bila penurunan ini diubah,
// form admin dan mesin bisa lahirkan sasaran salah lagi -> test gagal.
import assert from 'node:assert/strict';
import {
  KELAS_AKHIR_JENJANG, jenisUjianBaku, aturanJenisUjian, terapkanJenisUjian,
} from '../src/utils/aturanJenisUjian.js';

let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('kelas akhir jenjang resmi: SD 6, SMP 9, SMA/SMK 12', () => {
  assert.deepEqual(KELAS_AKHIR_JENJANG, { SD: '6', SMP: '9', SMA: '12', SMK: '12' });
});

uji('jenisUjianBaku: field eksplisit menang; warisan dibaca dari nama', () => {
  assert.equal(jenisUjianBaku({ jenisUjian: 'Reguler', nama: 'TRY OUT TKA APA SAJA' }), 'Reguler');
  assert.equal(jenisUjianBaku({ nama: 'TRY OUT PEMAHAMAN TKA SMP' }), 'TKA');
  assert.equal(jenisUjianBaku({ nama: 'Try Out UTBK Gemilang (Sabtu)' }), 'SNBT/UTBK');
  assert.equal(jenisUjianBaku({ nama: 'Try Out Wajib' }), 'Reguler');
  assert.equal(jenisUjianBaku({}), 'Reguler');
});

uji('TKA SMP: peserta kelas 9 otomatis, materi bank penuh, tanpa saring kelas', () => {
  const a = aturanJenisUjian({ nama: 'TRY OUT PEMAHAMAN TKA SMP', jenjang: 'SMP' });
  assert.equal(a.jenisUjian, 'TKA');
  assert.equal(a.otomatis, true);
  assert.equal(a.targetKelas, '9');
  assert.equal(a.kelasCakupan, ''); // bank SATU JENJANG penuh
  assert.match(a.materiTeks, /SELURUHNYA/);
  assert.match(a.pesertaTeks, /Kelas 9/);
});

uji('TKA jenjang lain: SD 6, SMA 12; UTBK selalu kelas 12', () => {
  assert.equal(aturanJenisUjian({ nama: 'Try Out TKA SD (Sabtu)', jenjang: 'SD' }).targetKelas, '6');
  assert.equal(aturanJenisUjian({ nama: 'Try Out TKA SMA (Sabtu)', jenjang: 'SMA' }).targetKelas, '12');
  const u = aturanJenisUjian({ nama: 'Try Out UTBK Gemilang (Sabtu)', jenjang: 'SMA' });
  assert.equal(u.jenisUjian, 'SNBT/UTBK');
  assert.equal(u.targetKelas, '12');
  assert.equal(u.kelasCakupan, '');
});

uji('Reguler: peserta & materi kelas yang sama; "Semua" dianggap belum diisi', () => {
  const r = aturanJenisUjian({ jenisUjian: 'Reguler', jenjang: 'SMP', targetKelas: '8' });
  assert.equal(r.otomatis, false);
  assert.equal(r.targetKelas, '8');
  assert.equal(r.kelasCakupan, '8');
  const kosong = aturanJenisUjian({ jenjang: 'SMP', targetKelas: ['Semua'], kelas: '12' });
  assert.equal(kosong.jenisUjian, 'Reguler');
  assert.equal(kosong.targetKelas, ''); // array ["Semua"] warisan = belum diisi
});

uji('terapkanJenisUjian: menimpa sasaran warisan "Semua" pada template TKA', () => {
  const t = terapkanJenisUjian({
    id: 'x', nama: 'Try Out TKA SD (Sabtu)', jenjang: 'SD', kelas: '6', targetKelas: 'Semua',
  });
  assert.equal(t.jenisUjian, 'TKA');
  assert.equal(t.targetKelas, '6');
  assert.equal(t.kelas, '');
  // mode Reguler TIDAK ditimpa (pagar yang menuntut pilihan sadar admin)
  const r = terapkanJenisUjian({ nama: 'Try Out Wajib', jenjang: 'SMA', kelas: '12', targetKelas: ['Semua'] });
  assert.equal(r.jenisUjian, 'Reguler');
  assert.deepEqual(r.targetKelas, ['Semua']);
  assert.equal(r.kelas, '12');
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
