// tests/kualitasButir.test.mjs
// ============================================================
// Test penyortiran laporan kualitas AI (src/utils/kualitasButir.js).
//
//     node tests/kualitasButir.test.mjs
//
// KENAPA INI PENTING
// Otomatisasi alur produksi soal hanya aman bila AI WAJIB mengaku dan
// sistem yang menyortir. Bila pemetaan level->tindakan salah (mis.
// "buram" malah lolos simpan), seluruh otomatisasi jadi mesin pencetak
// soal rusak berskala besar. Test ini memaku: buram & terpotong = HARD
// ERROR (ditahan), tanpa-pembahasan = lunak (antrean), ok & tak dikenal
// = tidak menuduh.
// ============================================================

import assert from 'node:assert/strict';
import { LEVEL_KUALITAS, bacaKualitas, pesanKualitas } from '../src/utils/kualitasButir.js';

let lulus = 0;
let gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try {
    fn();
    lulus += 1;
    console.log(`  ✓ ${nama}`);
  } catch (e) {
    gagal += 1;
    const pesan = String(e && e.message ? e.message : e);
    kegagalan.push({ nama, pesan });
    console.log(`  ✗ ${nama}`);
    console.log(`      ${pesan.split('\n').join('\n      ').slice(0, 400)}`);
  }
}

uji('level baku & alias OCR/AI dinormalkan', () => {
  assert.equal(bacaKualitas('ok'), 'ok');
  assert.equal(bacaKualitas('BURAM'), 'buram');
  assert.equal(bacaKualitas(' blur '), 'buram');
  assert.equal(bacaKualitas('terpotong'), 'terpotong');
  assert.equal(bacaKualitas('truncated'), 'terpotong');
  assert.equal(bacaKualitas('tanpa-pembahasan'), 'tanpa-pembahasan');
});

uji('nilai tak dikenal & kosong -> null (tidak menuduh)', () => {
  assert.equal(bacaKualitas(''), null);
  assert.equal(bacaKualitas(undefined), null);
  assert.equal(bacaKualitas('sempurna-sekali'), null);
});

uji('buram & terpotong = HARD ERROR (ditahan, tidak bisa disimpan)', () => {
  for (const level of ['buram', 'terpotong']) {
    const p = pesanKualitas(level);
    assert.ok(p, level);
    assert.equal(p.keras, true, `${level} harus keras`);
    assert.ok(p.teks.includes('Jangan disimpan dulu'), p.teks);
  }
});

uji('tanpa-pembahasan = lunak (antrean review, tidak memblokir)', () => {
  const p = pesanKualitas('tanpa-pembahasan');
  assert.equal(p.keras, false);
  assert.ok(p.teks.includes('antrean review tentor'), p.teks);
});

uji('ok & tak dikenal tidak menghasilkan pesan', () => {
  assert.equal(pesanKualitas('ok'), null);
  assert.equal(pesanKualitas(bacaKualitas('entah-apa')), null);
});

uji('daftar level tidak berubah tanpa sengaja (kontrak prompt aturan 42)', () => {
  assert.deepEqual(LEVEL_KUALITAS, ['ok', 'buram', 'terpotong', 'tanpa-pembahasan']);
});

console.log(`\n${'='.repeat(60)}`);
console.log(`  LULUS : ${lulus}`);
console.log(`  GAGAL : ${gagal}`);
console.log('='.repeat(60));
if (gagal > 0) {
  console.log('\nRingkasan kegagalan:');
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}\n     ${k.pesan.split('\n')[0]}`));
  console.error('\n❌ ADA TEST YANG GAGAL.');
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
