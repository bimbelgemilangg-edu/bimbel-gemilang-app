// tests/sumberPaket.test.mjs
import assert from 'node:assert/strict';
import { sumberPaket } from '../src/utils/sumberPaket.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('mesin otomatis dikenali + mengakui aktivasi tanpa jejak', () => {
  const a = sumberPaket({ sumber: 'mesin-otomatis', status: 'aktif', riwayatStatus: [] });
  assert.equal(a.label, 'Mesin otomatis (AI)');
  assert.ok(a.detail.includes('TANPA JEJAK'), a.detail);
  const b = sumberPaket({ sumber: 'mesin-otomatis', status: 'aktif', riwayatStatus: [{ status: 'aktif', peran: 'admin', pada: '2026-10-10T01:00:00Z' }] });
  assert.ok(b.detail.includes('admin'), b.detail);
});
uji('tentor: menunggu vs sudah di-approval admin', () => {
  assert.equal(sumberPaket({ dibuatOleh: 'tentor' }).label, 'Tentor (menunggu approval)');
  const s = sumberPaket({ dibuatOleh: 'tentor', disetujuiOleh: 'zalsa', disetujuiPada: '2026-10-12T01:00:00Z' });
  assert.equal(s.label, 'Tentor → approval admin');
  assert.ok(s.detail.includes('zalsa'), s.detail);
});
uji('admin & paket lama tanpa pencatatan', () => {
  assert.equal(sumberPaket({ dibuatOleh: 'admin' }).label, 'Dibuat admin');
  assert.equal(sumberPaket({}).label, 'Sumber tidak tercatat');
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
