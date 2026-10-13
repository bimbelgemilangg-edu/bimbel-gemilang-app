// tests/layakTryOut.test.mjs
// Gerbang kelayakan butir untuk try out otomatis (mesinTryOutOtomatis.js).
// Bug nyata 2026-10-12: jalur `extra` tidak menyaring status, jadi butir
// terhapus bisa tercebur ke draf saat pool utama kekurangan stok.
import assert from 'node:assert/strict';
import { layakUntukTryOut } from '../src/utils/layakTryOut.js';

let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('butir aktif berkunci layak', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', kunciJawaban: 'B' }), true);
});
uji('butir terhapus & nonaktif DITOLAK', () => {
  assert.equal(layakUntukTryOut({ status: 'terhapus', kunciJawaban: 'B' }), false);
  assert.equal(layakUntukTryOut({ status: 'nonaktif', kunciJawaban: 'B' }), false);
});
uji('pg tanpa kunci DITOLAK, esai tanpa kunci huruf diterima', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_sederhana', kunciJawaban: '' }), false);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_kompleks', kunciJawaban: [] }), false);
  assert.equal(layakForEsai(), true);
  function layakForEsai() { return layakUntukTryOut({ status: 'aktif', tipe: 'esai', kunciJawaban: '' }); }
});
uji('butir bergambar belum dipotong DITOLAK (siswa tak bisa menjawab)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', kunciJawaban: 'A', potonganTertunda: [{ urutan: 1 }] }), false);
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');

// ---- 2026-10-13: saringan kelas dipakai pool utama DAN jalur cadangan ----
import { cocokKelasBank } from '../src/utils/layakTryOut.js';
uji('cocokKelasBank: tepat, mengandung, dan butir tanpa kelas', () => {
  assert.equal(cocokKelasBank({ kelas: '9' }, '9'), true);
  assert.equal(cocokKelasBank({ kelas: '9 SMP' }, '9'), true);
  assert.equal(cocokKelasBank({ kelas: '7' }, '9'), false);
  assert.equal(cocokKelasBank({ kelas: '8' }, '9'), false);
  assert.equal(cocokKelasBank({}, '9'), true, 'butir lama tanpa kelas tetap lolos');
  assert.equal(cocokKelasBank({ kelas: '9' }, ''), true);
});

// ---- 2026-10-13: PAGAR TIPE -- mesin memakai pagar yang sama dengan keranjang ----
// Insiden draf Sabtu: 6 butir menjodohkan lolos ke paket karena mesin tidak
// berkonsultasi ke TIPE_TERDUKUNG; layar siswa merendernya sebagai PG kosong.
uji('menjodohkan DITOLAK walau berkunci & berpasangan (layar siswa belum punya renderer)', () => {
  assert.equal(layakUntukTryOut({
    status: 'aktif', tipe: 'menjodohkan', kunciJawaban: [0, 1, 2],
    pasangan: [{ kiri: 'fotosintesis', kanan: 'daun' }],
  }), false);
});
uji('isian_singkat & numerik berkunci layak (renderer + penilaian sudah ada)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'isian_singkat', kunciJawaban: 'fotosintesis' }), true);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'numerik', kunciJawaban: '12' }), true);
});
uji('tipe didukung lain tetap layak (pagar tidak menyempit)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_sederhana', kunciJawaban: 'A' }), true);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_kompleks', kunciJawaban: [0, 2] }), true);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'benar_salah', kunciJawaban: [true, false] }), true);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'esai' }), true);
});
