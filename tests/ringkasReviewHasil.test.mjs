// tests/ringkasReviewHasil.test.mjs
import assert from 'node:assert/strict';
import { daftarSalahUntukTentor, kunciTampil } from '../src/utils/ringkasReviewHasil.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('hanya skor 0 yang masuk daftar salah, terurut nomor', () => {
  const d = daftarSalahUntukTentor([{ nomor: 5, skor: 0 }, { nomor: 2, skor: 0 }, { nomor: 3, skor: 1 }, { nomor: 4, skor: 0.5 }]);
  assert.deepEqual(d, [{ nomor: 2, kode: '' }, { nomor: 5, kode: '' }]);
});
uji('tanpa soal salah -> daftar kosong & pesan kosong', () => {
  assert.deepEqual(daftarSalahUntukTentor([{ nomor: 1, skor: 1 }]), []);
});
uji('kunci pg_kompleks angka jadi huruf', () => {
  assert.equal(kunciTampil([0, 3]), 'A, D');
  assert.equal(kunciTampil('B'), 'B');
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
