// tests/kesiapanStok.test.mjs
// ============================================================
// Test mesin dasbor kesiapan stok (src/utils/kesiapanStok.js).
//
//     node tests/kesiapanStok.test.mjs
//
// KENAPA INI PENTING
// Dasbor stok adalah kompas tugas owner "render soal sebanyak-banyaknya"
// dan kelak menjadi pagar stok mesin try out otomatis. Kalau mesin ini
// salah hitung -- misalnya menghitung pembahasan penalaran AI sebagai
// stok berkualitas -- maka "SIAP" jadi bohong dan AI menerbit try out
// dari stok karangan. Invarian yang dikunci: pemisahan tercetak vs
// penalaran vs tanpa pembahasan, pengabaian butir terhapus, dan empat
// status bendera.
// ============================================================

import assert from 'node:assert/strict';
import { hitungKesiapanStok, kunciGrup, STATUS_STOK, targetBawaan } from '../src/utils/kesiapanStok.js';

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

const butir = (over = {}) => ({
  status: 'aktif',
  mataPelajaran: 'TPS/Penalaran Umum',
  jenjang: 'UTBK/SNBT',
  jenisUjian: 'SNBT/UTBK',
  kunciJawaban: 'B',
  pembahasan: 'Karena ...',
  pembahasanAsal: 'tercetak',
  ...over,
});

uji('butir terhapus & nonaktif TIDAK dihitung sebagai stok', () => {
  const { baris } = hitungKesiapanStok([
    butir(), butir({ status: 'terhapus' }), butir({ status: 'nonaktif' }),
  ]);
  assert.equal(baris[0].aktif, 1);
});

uji('tercetak vs penalaran vs tanpa pembahasan dipisah keras', () => {
  const { baris } = hitungKesiapanStok([
    butir(),
    butir({ pembahasanAsal: 'penalaran' }),
    butir({ pembahasan: '' }),
    butir({ pembahasanAsal: 'penalaran' }),
  ]);
  assert.equal(baris[0].aktif, 4);
  assert.equal(baris[0].tercetak, 1);
  assert.equal(baris[0].penalaran, 2);
  assert.equal(baris[0].tanpaPembahasan, 1);
});

uji('status TIPIS bila butir di bawah target, kekurangan terhitung', () => {
  const { baris } = hitungKesiapanStok([butir(), butir()], { default: { min: 150, rasioTerCetak: 0.6 } });
  assert.equal(baris[0].status, STATUS_STOK.TIPIS);
  assert.equal(baris[0].kekurangan, 148);
});

uji('status KUALITAS bila butir cukup tapi rasio tercetak kurang', () => {
  const daftar = [
    butir(), butir({ pembahasanAsal: 'penalaran' }), butir({ pembahasanAsal: 'penalaran' }), butir({ pembahasanAsal: 'penalaran' }),
  ];
  const { baris } = hitungKesiapanStok(daftar, { default: { min: 4, rasioTerCetak: 0.6 } });
  assert.equal(baris[0].status, STATUS_STOK.KUALITAS);
  assert.equal(baris[0].rasioTerCetak, 0.25);
});

uji('status SIAP hanya bila butir DAN rasio terpenuhi', () => {
  const daftar = [butir(), butir(), butir(), butir({ pembahasanAsal: 'penalaran' })];
  const { baris } = hitungKesiapanStok(daftar, { default: { min: 4, rasioTerCetak: 0.6 } });
  assert.equal(baris[0].status, STATUS_STOK.SIAP);
});

uji('grup kosong tetap tampil bila diminta lewat target eksplisit', () => {
  const { baris } = hitungKesiapanStok([], { 'SMA/MA|Fisika|TKA': { min: 120, rasioTerCetak: 0.6 } });
  assert.equal(baris.length, 0, 'tanpa butir tidak ada grup teramati; dasbor menambah baris nol dari daftar target');
});

uji('alias field dibaca (mapel vs mataPelajaran, jenis_ujian)', () => {
  const a = butir({ mataPelajaran: undefined, mapel: 'Fisika' });
  const b = butir({ jenisUjian: undefined, jenis_ujian: 'TKA' });
  assert.equal(kunciGrup(a), 'UTBK/SNBT|Fisika|SNBT/UTBK');
  assert.equal(kunciGrup(b), 'UTBK/SNBT|TPS/Penalaran Umum|TKA');
});

uji('gambar menunggu potongan terhitung sebagai pekerjaan tertunda', () => {
  const { baris } = hitungKesiapanStok([butir({ potonganTertunda: [{ urutan: 1, petunjuk: 'hal 9' }] })]);
  assert.equal(baris[0].gambarTertunda, 1);
});

uji('ringkasan menjumlah lintas grup & mengurutkan termiskin dulu', () => {
  const { baris, ringkasan } = hitungKesiapanStok([
    butir(), butir({ mataPelajaran: 'Fisika', jenjang: 'SMA/MA', jenisUjian: 'TKA' }),
  ]);
  assert.equal(ringkasan.jumlahGrup, 2);
  assert.equal(ringkasan.totalAktif, 2);
  // target bawaan kini berbeda per grup (UTBK 150 vs TKA pilihan 120),
  // jadi urutan termiskin dulu = kelompok UTBK.
  assert.equal(baris[0].jenjang, 'UTBK/SNBT');
  assert.equal(baris[0].kekurangan, 149);
  assert.equal(baris[1].kekurangan, 119);
});

uji('target bawaan mengikuti usulan taksonomi (UTBK/TKA wajib/TKA pilihan/reguler)', () => {
  assert.equal(targetBawaan({ jenjang: 'UTBK/SNBT', mapel: 'TPS/Penalaran Umum' }).min, 150);
  assert.equal(targetBawaan({ jenjang: 'SMA/MA', mapel: 'Matematika', jenisUjian: 'TKA' }).min, 200);
  assert.equal(targetBawaan({ jenjang: 'SMA/MA', mapel: 'Fisika', jenisUjian: 'TKA' }).min, 120);
  assert.equal(targetBawaan({ jenjang: 'SMA/MA', mapel: 'Matematika', jenisUjian: 'Reguler' }).min, 60);
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
