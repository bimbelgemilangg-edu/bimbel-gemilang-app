// tests/petaKonten.test.mjs
// ============================================================
// Test peta gabungan konten (src/utils/petaKonten.js): pohon
// jenjang -> mapel -> bab dari tiga sumber yang bahasanya beda-beda.
//
//     node tests/petaKonten.test.mjs
//
// KENAPA INI PENTING
// Keluhan owner: "admin saja kesulitan mencari materi, apalagi guru".
// Akar teknisnya: bank_soal memakai mataPelajaran/materi, buku_digital
// memakai mapel + subkoleksi bab, tryout_paket memakai targetKategori --
// dan penulisannya tidak seragam ("bing", "B. Inggris", "Bahasa Inggris").
// Tanpa normalisasi, pohon pencarian bercabang jadi duplikat yang justru
// menambah bingung. Test ini mengunci bahwa alias jatuh ke simpul yang
// sama dan bahwa pencarian memang menemukan simpulnya.
// ============================================================

import assert from 'node:assert/strict';
import { normMapel, normJenjang, bangunPohon, saringPohon, sebaranKelas } from '../src/utils/petaKonten.js';

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

function bagian(judul) {
  console.log(`\n${judul}`);
}

console.log('petaKonten — satu pohon untuk tiga pulau konten');

// ============================================================
bagian('1. ALIAS JATUH KE SIMPUL YANG SAMA');
// ============================================================

uji('tulisan mapel yang beraneka dinormalkan', () => {
  assert.equal(normMapel('bing'), 'Bahasa Inggris');
  assert.equal(normMapel('B. Inggris'), 'Bahasa Inggris');
  assert.equal(normMapel('matematika'), 'Matematika');
  assert.equal(normMapel('Biologi'), 'Biologi');
});

uji('mapel kosong -> null, bukan simpul hantu', () => {
  assert.equal(normMapel(''), null);
  assert.equal(normMapel(null), null);
});

uji('jenjang terbaca dari teks kelas', () => {
  assert.equal(normJenjang('Kelas 10 SMA'), 'SMA');
  assert.equal(normJenjang('8 SMP'), 'SMP');
});

// ============================================================
bagian('2. POHON MENGGABUNGKAN TIGA SUMBER');
// ============================================================

const soal = [
  { id: 's1', jenjang: 'SMA', mataPelajaran: 'bing', materi: 'Tenses' },
  { id: 's2', jenjang: 'SMA', mataPelajaran: 'Bahasa Inggris', materi: 'Tenses' },
  { id: 's3', jenjang: 'SMA', mataPelajaran: 'Biologi', materi: 'Sistem Reproduksi' },
  { id: 's4', materi: 'Tanpa jenjang' },
];
const buku = [{ id: 'b1', judul: 'BIOLOGI 10', jenjang: 'SMA', mapel: 'Biologi' }];
const paket = [{ id: 'p1', judul: 'TRYOUT 8 SMP', targetKelas: '8 SMP', targetKategori: 'IPA' }];

uji('alias mapel tidak membuat cabang duplikat', () => {
  const pohon = bangunPohon({ soal, buku, paket });
  const sma = pohon.find((j) => j.jenjang === 'SMA');
  const bing = sma.mapel.find((m) => m.mapel === 'Bahasa Inggris');
  assert.equal(bing.jumlah.soal, 2, 'dua soal bing harus satu simpul');
  assert.deepEqual(bing.bab.map((b) => b.bab), ['Tenses']);
  assert.equal(bing.bab[0].soal, 2);
});

uji('buku & paket menempel di simpulnya masing-masing', () => {
  const pohon = bangunPohon({ soal, buku, paket });
  const sma = pohon.find((j) => j.jenjang === 'SMA');
  assert.equal(sma.mapel.find((m) => m.mapel === 'Biologi').jumlah.buku, 1);
  const smp = pohon.find((j) => j.jenjang === 'SMP');
  assert.equal(smp.mapel.find((m) => m.mapel === 'IPA').jumlah.paket, 1);
});

uji('konten tanpa identitas masuk simpul "(Belum dikelompokkan)", bukan hilang', () => {
  const pohon = bangunPohon({ soal, buku, paket });
  const tanpa = pohon.find((j) => j.jenjang === '(Belum dikelompokkan)');
  assert.ok(tanpa, 'simpul belum dikelompokkan harus ada');
  assert.equal(tanpa.mapel.find((m) => m.mapel === '(Belum dikelompokkan)').jumlah.soal, 1);
});

// ============================================================
bagian('3. PENCARIAN MENEMUKAN, BUKAN SEKADAR MENYARING');
// ============================================================

uji('cari nama bab menemukan simpulnya', () => {
  const pohon = bangunPohon({ soal, buku, paket });
  const hasil = saringPohon(pohon, 'reproduksi');
  assert.equal(hasil.length, 1);
  assert.equal(hasil[0].mapel[0].mapel, 'Biologi');
});

uji('cari judul paket juga menemukan', () => {
  const hasil = saringPohon(bangunPohon({ soal, buku, paket }), 'tryout 8');
  assert.ok(hasil.length >= 1);
});

uji('kata kunci ngawur -> pohon kosong, bukan error', () => {
  assert.deepEqual(saringPohon(bangunPohon({ soal, buku, paket }), 'zzz-tidak-ada'), []);
});

uji('query kosong = pohon utuh (tidak ada yang terbuang)', () => {
  const pohon = bangunPohon({ soal, buku, paket });
  assert.equal(saringPohon(pohon, '').length, pohon.length);
});

// ============================================================
bagian('4. SEBARAN KELAS (kompilasi TKA 10-12)');
// ============================================================

uji('sebaran kelas dihitung per kumpulan soal', () => {
  const r = sebaranKelas([
    { kelas: '10' }, { kelas: '10' }, { kelas: '12' }, { kelas: '' },
  ]);
  assert.deepEqual(r, [['(tanpa kelas)', 1], ['10', 2], ['12', 1]]);
});

uji('kumpulan kosong tidak melempar', () => {
  assert.deepEqual(sebaranKelas([]), []);
  assert.deepEqual(sebaranKelas(null), []);
});

// ============================================================
// RINGKASAN
// ============================================================
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
