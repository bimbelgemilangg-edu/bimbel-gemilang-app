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

// ---- 2026-10-13 (audit paket Sabtu): KUNCI HARUS BISA DINILAI, bukan cuma ada ----
// Kasus nyata: 8 butir pg_sederhana B.Indo SMP ber-kunci ganda ("A,D" --
// sisa impor yang seharusnya pg_kompleks) lolos pagar lama dan 4 di antaranya
// masuk paket terbit Sabtu 17 Okt: jawaban siswa apa pun = 0 tapi ikut
// penyebut, skor maksimal paket terpangkas. Pagar baru memakai
// soalBisaDinilai() -- satu sumber kebenaran dengan skoring.
uji('pg_sederhana ber-kunci ganda DITOLAK mesin (tak pernah bisa dijawab benar)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'A,D' }), false);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'B' }), true);
});
uji('pg_kompleks kunci string huruf DITERIMA (dialek data, skoring sudah toleran)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'B,C' }), true);
});
uji('pg_kompleks kunci angka DITOLAK (renderer pakai huruf, siswa tak bisa mencetak skor)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b', 'c', 'd', 'e'], kunciJawaban: '1, 3, 5' }), false);
});

uji('isian_singkat & numerik berkunci layak (renderer + penilaian sudah ada)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'isian_singkat', kunciJawaban: 'fotosintesis' }), true);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'numerik', kunciJawaban: '12' }), true);
});
uji('tipe didukung lain tetap layak (pagar tidak menyempit)', () => {
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_sederhana', kunciJawaban: 'A' }), true);
  // 🛡️ AUDIT 2026-10-13: fixture diperbarui ke bentuk data NYATA.
  // Kunci pg_kompleks angka [0,2] dan benar_salah tanpa baris pernyataan
  // dulu "layak" di atas kertas padahal TIDAK PERNAH bisa dicetak skornya
  // oleh siswa (renderer mengirim huruf; benar_salah dinilai per baris).
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b', 'c'], kunciJawaban: ['A', 'C'] }), true);
  assert.equal(layakUntukTryOut({
    status: 'aktif', tipe: 'benar_salah', kunciJawaban: 'BENAR-SALAH',
    pernyataan: [{ teks: 'x', jawaban: 'benar' }, { teks: 'y', jawaban: 'salah' }],
  }), true);
  assert.equal(layakUntukTryOut({ status: 'aktif', tipe: 'esai' }), true);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
