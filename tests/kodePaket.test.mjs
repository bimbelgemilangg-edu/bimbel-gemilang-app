// tests/kodePaket.test.mjs
import assert from 'node:assert/strict';
import { buatKodePaket, kodePaketTampil, parseKodePaket, cocokPencarianPaket } from '../src/utils/kodePaket.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('bentuk kode: GM-JENJANG-JENIS-YYYYMMDD-HHMM', () => {
  const k = buatKodePaket({ jenjang: 'SMA/MA', jenisUjian: 'TKA', tanggal: new Date(2026, 9, 17, 8, 0) });
  assert.equal(k, 'GM-SMA-TKA-20261017-0800');
  const u = buatKodePaket({ jenjang: 'UTBK/SNBT', jenisUjian: 'SNBT/UTBK', tanggal: new Date(2026, 0, 3, 13, 5) });
  assert.equal(u, 'GM-UTBK-UTBK-20260103-1305');
});
uji('paket lama tanpa kode mendapat kode ARSIP turunan yang stabil', () => {
  const p = { id: 'ab12cd', jenjangTemplate: 'SMP/MTs', jenisUjian: 'TKA', createdAt: new Date(2026, 8, 5) };
  const a = kodePaketTampil(p); const b = kodePaketTampil(p);
  assert.equal(a, b);
  assert.ok(a.startsWith('GM-ARSIP-SMP-TKA-20260905-'), a);
});
uji('parse kode asli & arsip', () => {
  assert.deepEqual(parseKodePaket('GM-SMA-TKA-20261017-0800'), { arsip: false, jenjang: 'SMA', jenis: 'TKA', ymd: '20261017', suffix: '0800' });
  assert.equal(parseKodePaket('GM-ARSIP-SMP-TKA-20260905-AB12').arsip, true);
  assert.equal(parseKodePaket('bukan-kode'), null);
});
uji('pencarian: kode, tanggal polos, dan judul', () => {
  const p = { kodePaket: 'GM-SMA-TKA-20261017-0800', judul: 'Try Out Sabtu Pekan 3' };
  assert.equal(cocokPencarianPaket(p, '20261017'), true);
  assert.equal(cocokPencarianPaket(p, 'gm-sma'), true);
  assert.equal(cocokPencarianPaket(p, 'pekan 3'), true);
  assert.equal(cocokPencarianPaket(p, '20260101'), false);
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
