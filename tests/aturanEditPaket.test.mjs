// tests/aturanEditPaket.test.mjs
import assert from 'node:assert/strict';
import { putusanEditPaket } from '../src/utils/aturanEditPaket.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('draf bebas diedit metadata & isi', () => {
  const p = putusanEditPaket({ status: 'draf', jumlahSesi: 0 });
  assert.equal(p.bolehMetadata, true); assert.equal(p.bolehIsi, true);
});
uji('aktif tanpa sesi: isi masih boleh', () => {
  const p = putusanEditPaket({ status: 'aktif', jumlahSesi: 0 });
  assert.equal(p.bolehIsi, true);
});
uji('aktif BERSESI: metadata boleh, isi DIBEKUKAN dengan alasan jelas', () => {
  const p = putusanEditPaket({ status: 'aktif', jumlahSesi: 12 });
  assert.equal(p.bolehMetadata, true);
  assert.equal(p.bolehIsi, false);
  assert.ok(p.alasan.includes('12 siswa'), p.alasan);
  assert.ok(p.alasan.includes('PAKET REVISI'), p.alasan);
});
uji('nonaktif bervesi tetap membeku (skor lama harus tetap sah)', () => {
  assert.equal(putusanEditPaket({ status: 'nonaktif', jumlahSesi: 3 }).bolehIsi, false);
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
