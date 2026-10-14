// tests/skorSoalTryOut.test.mjs
// ============================================================
// Test logika skor Try Out -- termasuk perilaku tipe ESAI baru
// (2026-10-04): tidak dinilai otomatis, menunggu penilaian manual
// admin, dan masuk total hanya setelah dinilai.
//
// Sebelumnya logika ini TIDAK punya test sama sekali padahal dipakai
// dua tempat (submit siswa & "Hitung Ulang" admin) -- persis pola yang
// dulu melahirkan bug saldo kembar di modul lain.
// ============================================================

import assert from 'node:assert/strict';
import {
  skorSatuSoal,
  hitungTotalSkor,
  soalBelumDijawab,
  isSoalEsai,
  poinEsai,
  soalBisaDinilai,
  SKALA_NILAI_ESAI,
} from '../src/utils/skorSoalTryOut.js';
import {
  hitungSkorBenarSalah,
  hitungSkorPgKompleks,
  kunciBarisBenarSalah,
} from '../src/utils/skoringSoalKompleks.js';

let lulus = 0, gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try { fn(); lulus++; console.log(`  ✓ ${nama}`); }
  catch (e) {
    gagal++;
    const p = String(e?.message || e);
    kegagalan.push({ nama, p });
    console.log(`  ✗ ${nama}\n      ${p.split('\n').join('\n      ').slice(0, 300)}`);
  }
}
function bagian(j) { console.log(`\n${j}`); }

const pg = (id, kunci) => ({ id, tipe: 'pg_sederhana', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: kunci });
const esai = (id) => ({ id, tipe: 'esai' });

console.log('skorSoalTryOut — test skoring & esai');

bagian('pg_sederhana (regresi)');

uji('jawaban index benar = 1, salah = 0', () => {
  const s = pg('s1', 'B');
  assert.equal(skorSatuSoal(s, 1), 1);
  assert.equal(skorSatuSoal(s, 0), 0);
  assert.equal(skorSatuSoal(s, null), 0);
});

bagian('esai: dasar');

uji('isSoalEsai mengenali tipe esai dan alias uraian', () => {
  assert.equal(isSoalEsai(esai('x')), true);
  assert.equal(isSoalEsai({ id: 'u', tipe: 'uraian' }), true);
  assert.equal(isSoalEsai(pg('y', 'A')), false);
  assert.equal(isSoalEsai(null), false);
});

uji('esai tidak dinilai otomatis (skor 0 walau dijawab)', () => {
  assert.equal(skorSatuSoal(esai('e1'), { teks: 'jawaban panjang', foto: '' }), 0);
});

uji('esai dianggap dijawab kalau ada TEKS atau FOTO', () => {
  assert.equal(soalBelumDijawab(esai('e1'), { teks: 'ada', foto: '' }), false);
  assert.equal(soalBelumDijawab(esai('e1'), { teks: '', foto: 'data:image/jpeg;base64,x' }), false);
  assert.equal(soalBelumDijawab(esai('e1'), { teks: '   ', foto: '' }), true);
  assert.equal(soalBelumDijawab(esai('e1'), null), true);
});

// 🛡️ Regresi audit 2026-10-13: alias lama 'uraian' (pipeline HTML Master)
// dulu tidak dikenali soalBelumDijawab -> uraian berfoto salah dilabeli
// "belum dijawab". Wajib diperlakukan identik dengan 'esai'.
uji('uraian (alias esai) juga dianggap dijawab kalau ada TEKS atau FOTO', () => {
  const uraian = (id) => ({ id, tipe: 'uraian' });
  assert.equal(soalBelumDijawab(uraian('u1'), { teks: 'ada', foto: '' }), false);
  assert.equal(soalBelumDijawab(uraian('u1'), { teks: '', foto: 'data:image/jpeg;base64,x' }), false);
  assert.equal(soalBelumDijawab(uraian('u1'), { teks: '   ', foto: '' }), true);
  assert.equal(soalBelumDijawab(uraian('u1'), null), true);
  assert.equal(soalBelumDijawab(uraian('u1'), 'jawaban string polos'), false);
});

bagian('esai: total skor sebelum & sesudah penilaian');

uji('sebelum dinilai: esai TIDAK masuk penyebut persen', () => {
  // 2 pg (1 benar) + 1 esai belum dinilai -> persen dari bagian otomatis saja
  const daftar = [pg('s1', 'A'), pg('s2', 'A'), esai('e1')];
  const jawaban = { s1: 0, s2: 1, e1: { teks: 'esai saya', foto: '' } };
  const r = hitungTotalSkor(daftar, jawaban);
  assert.equal(r.jumlahEsai, 1);
  assert.equal(r.esaiTernilai, 0);
  assert.equal(r.totalSkorPersen, 50, 'persen harus mencerminkan soal otomatis saja');
});

uji('sesudah dinilai: poin esai masuk pembilang & penyebut', () => {
  const daftar = [pg('s1', 'A'), pg('s2', 'A'), esai('e1')];
  const jawaban = { s1: 0, s2: 1, e1: { teks: 'esai saya', foto: '' } };
  // esai dapat 100 -> total = 2 benar dari 3 = 67%
  const r100 = hitungTotalSkor(daftar, jawaban, { e1: { poin: 100 } });
  assert.equal(r100.esaiTernilai, 1);
  assert.equal(r100.totalSkorPersen, 67);
  // esai dapat 50 -> total = 1.5 dari 3 = 50%
  const r50 = hitungTotalSkor(daftar, jawaban, { e1: { poin: 50 } });
  assert.equal(r50.totalSkorPersen, 50);
  // esai dapat 0 -> total = 1 dari 3 = 33%
  const r0 = hitungTotalSkor(daftar, jawaban, { e1: { poin: 0 } });
  assert.equal(r0.totalSkorPersen, 33);
});

uji('esai dinilai sebagian (2 dari 3 dinilai): penyebut ikut yang dinilai', () => {
  const daftar = [pg('s1', 'A'), esai('e1'), esai('e2')];
  const jawaban = { s1: 0, e1: { teks: 'a' }, e2: { teks: 'b' } };
  const r = hitungTotalSkor(daftar, jawaban, { e1: { poin: 100 } });
  // benar 1 pg + esai1 penuh = 2 dari 2 yang ternilai = 100%
  assert.equal(r.totalSkorPersen, 100);
  assert.equal(r.esaiTernilai, 1);
});

bagian('esai: keamanan nilai manual');

uji('poin esai di-clamp ke 0..100', () => {
  assert.equal(poinEsai(esai('e1'), { e1: { poin: 250 } }), 1);
  assert.equal(poinEsai(esai('e1'), { e1: { poin: -40 } }), 0);
});

uji('poin esai rusak (string/NaN) dianggap belum dinilai', () => {
  assert.equal(poinEsai(esai('e1'), { e1: { poin: 'abc' } }), null);
  assert.equal(poinEsai(esai('e1'), { e1: {} }), null);
  assert.equal(poinEsai(esai('e1'), null), null);
  assert.equal(poinEsai(esai('e1'), {}), null);
});

uji('paket tanpa esai tidak berubah perilakunya (regresi)', () => {
  const daftar = [pg('s1', 'A'), pg('s2', 'B')];
  const r = hitungTotalSkor(daftar, { s1: 0, s2: 1 });
  assert.equal(r.totalSkorPersen, 100);
  assert.equal(r.jumlahEsai, 0);
  const kosong = hitungTotalSkor([], {});
  assert.equal(kosong.totalSkorPersen, 0);
});

bagian('benar/salah: keadilan saat kunci baris hilang (bug produksi 194 soal)');

const bsSehat = { id: 'bs1', tipe: 'benar_salah', pernyataan: [
  { teks: 'a', jawaban: 'benar' }, { teks: 'b', jawaban: 'salah' },
] };
const bsSebagian = { id: 'bs2', tipe: 'benar_salah', pernyataan: [
  { teks: 'a', jawaban: 'benar' }, { teks: 'b', jawaban: '' },
] };
const bsRusak = { id: 'bs3', tipe: 'benar_salah', pernyataan: [
  { teks: 'a', jawaban: '' }, { teks: 'b', jawaban: '' },
] };

uji('baris sehat dinilai penuh seperti biasa', () => {
  assert.equal(hitungSkorBenarSalah(bsSehat.pernyataan, ['benar', 'salah']), 1);
  assert.equal(hitungSkorBenarSalah(bsSehat.pernyataan, ['benar', 'benar']), 0.5);
  assert.equal(soalBisaDinilai(bsSehat), true);
});

uji('baris tanpa kunci TIDAK menghukum siswa (penyebut mengecil)', () => {
  // siswa menjawab baris berkunci dengan BENAR; baris rusak diabaikan
  assert.equal(hitungSkorBenarSalah(bsSebagian.pernyataan, ['benar', 'salah']), 1);
  assert.equal(soalBisaDinilai(bsSebagian), true);
});

uji('semua baris tanpa kunci -> soal dikeluarkan dari penilaian', () => {
  assert.equal(soalBisaDinilai(bsRusak), false);
  const daftar = [pg('s1', 'A'), bsRusak];
  const r = hitungTotalSkor(daftar, { s1: 0, bs3: ['benar', 'benar'] });
  assert.equal(r.jumlahTidakBisaDinilai, 1);
  assert.equal(r.totalSkorPersen, 100, 'soal rusak tidak boleh menurunkan persen siswa');
});

uji('dialek kunci baris via field `kunci` (sanitizer) tetap terbaca', () => {
  const baris = [{ pernyataan: 'x', kunci: 'benar' }];
  assert.equal(kunciBarisBenarSalah(baris[0]), 'benar');
  assert.equal(hitungSkorBenarSalah(baris, ['benar']), 1);
});

bagian('🛡️ audit 2026-10-13: kunci tak ternilai & dialek kunci pg_kompleks');

// Kasus NYATA paket Sabtu 17 Okt (4BCDVVX7xwcGfxj58BHq): 4 butir
// pg_sederhana ber-kunci ganda ("A,D" -- sisa impor yang seharusnya
// pg_kompleks). Jawaban siswa apa pun = 0, tapi dulu tetap ikut
// penyebut -> skor maksimal paket terpanggang 87,5%.
uji('pg_sederhana ber-kunci ganda TIDAK bisa dinilai & keluar dari penyebut', () => {
  const rusak = pg('r1', 'A,D');
  assert.equal(soalBisaDinilai(rusak), false);
  const r = hitungTotalSkor([pg('s1', 'B'), rusak], { s1: 1, r1: 0 });
  assert.equal(r.jumlahTidakBisaDinilai, 1);
  assert.equal(r.totalSkorPersen, 100, 'soal kunci-rusak tidak boleh menurunkan persen siswa');
});

uji('pg_sederhana kunci sehat tetap bisa dinilai (regresi pagar baru)', () => {
  assert.equal(soalBisaDinilai(pg('s1', 'B')), true);
  assert.equal(soalBisaDinilai(pg('s2', 2)), true); // kunci index angka
  assert.equal(soalBisaDinilai(pg('s3', 'b')), true); // huruf kecil
  assert.equal(soalBisaDinilai({ id: 's4', tipe: 'pg_sederhana', opsiJawaban: ['fotosintesis', 'daun'], kunciJawaban: 'daun' }), true); // kunci teks lengkap
  assert.equal(soalBisaDinilai(pg('s5', '')), false); // tanpa kunci
});

uji('kunci pg_kompleks dialek string "B,C" kini dinilai penuh (split pemisah)', () => {
  const pgk = { id: 'k1', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'B,C' };
  assert.equal(soalBisaDinilai(pgk), true);
  assert.equal(skorSatuSoal(pgk, ['B', 'C']), 1);
  assert.equal(skorSatuSoal(pgk, ['B']), 0.5);
  // dialek lama tanpa pemisah tetap jalan (split per-huruf)
  assert.equal(hitungSkorPgKompleks('AC', ['A', 'C']), 1);
  // array tetap sumber utama
  assert.equal(hitungSkorPgKompleks(['A', 'D'], ['A', 'D']), 1);
});

uji('pg_kompleks ber-kunci angka (tak pernah bisa dicentang siswa) TIDAK dinilai', () => {
  const pgk = { id: 'k2', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b', 'c', 'd', 'e'], kunciJawaban: '1, 3, 5' };
  assert.equal(soalBisaDinilai(pgk), false);
  const kosong = { id: 'k3', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b'], kunciJawaban: [] };
  assert.equal(soalBisaDinilai(kosong), false);
  const hurufLuarRentang = { id: 'k4', tipe: 'pg_kompleks', opsiJawaban: ['a', 'b'], kunciJawaban: ['A', 'D'] };
  assert.equal(soalBisaDinilai(hurufLuarRentang), false);
});

uji('isian_singkat/numerik tanpa kunci sama sekali TIDAK dinilai', () => {
  assert.equal(soalBisaDinilai({ id: 'i1', tipe: 'isian_singkat', kunciJawaban: '' }), false);
  assert.equal(soalBisaDinilai({ id: 'i2', tipe: 'isian_singkat', kunciJawaban: 'fotosintesis' }), true);
  assert.equal(soalBisaDinilai({ id: 'i3', tipe: 'numerik', kunciJawaban: '', jawabanEkuivalen: ['12'] }), true);
});

console.log(`\n${'='.repeat(56)}\n  LULUS : ${lulus}\n  GAGAL : ${gagal}\n${'='.repeat(56)}`);
if (gagal > 0) {
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}`));
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
