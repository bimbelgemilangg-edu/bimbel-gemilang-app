// tests/profilSiswa.test.mjs
// ============================================================
// Test logika PEMBARUAN PROFIL SISWA -- keputusan "apa yang berubah
// dan nilai mana yang menang" saat nama/kelas di Firestore berbeda
// dari salinan localStorage di HP siswa.
//
//     node tests/profilSiswa.test.mjs
//
// KENAPA INI PENTING
// Keluhan owner 2026-10-05: admin membenarkan nama siswa, tapi nama
// lama bertahan di HP siswa karena aplikasi hanya membaca salinan
// localStorage yang ditulis sekali saat login. Perbaikannya
// (src/utils/profilSiswa.js) menarik ulang profil dari Firestore;
// fungsi KEPUTUSANNYA dipisah menjadi murni supaya bisa diuji di Node
// tanpa Firestore -- dan supaya suatu hari tidak ada yang "memperbaiki"
// dengan cara yang malah menimpa data server pakai cache lokal.
//
// Invarian yang dikunci di sini:
//   1. Server adalah sumber kebenaran: kalau berbeda, nilai server menang.
//   2. Server yang kosong/rusak TIDAK boleh menimpa cache dengan string
//      kosong -- nama tidak boleh pernah jadi blank di HP siswa.
//   3. Tidak ada perubahan = tidak ada pengumuman/perubahan (idempoten).
// ============================================================

import assert from 'node:assert/strict';
import { putuskanPembaruanProfil } from '../src/utils/profilSiswa.js';

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

console.log('profilSiswa — keputusan pembaruan nama/kelas siswa');

const cache = { nama: 'Chelsea Nadia E', kelas: '9 SMP' };

// ============================================================
bagian('1. SERVER SUMBER KEBENARAN');
// ============================================================

uji('nama yang dibenarkan admin menang atas cache', () => {
  const h = putuskanPembaruanProfil(cache, { nama: 'Chelsea Nadia Emiliya', kelasSekolah: '9 SMP' });
  assert.equal(h.berubah, true);
  assert.equal(h.nama, 'Chelsea Nadia Emiliya');
});

uji('perubahan kelas juga terdeteksi walau nama sama', () => {
  const h = putuskanPembaruanProfil(cache, { nama: 'Chelsea Nadia E', kelasSekolah: '9A SMP' });
  assert.equal(h.berubah, true);
  assert.equal(h.kelas, '9A SMP');
});

uji('nama dan kelas berubah bersamaan', () => {
  const h = putuskanPembaruanProfil(cache, { nama: 'Nama Baru', kelasSekolah: '8B' });
  assert.equal(h.berubah, true);
  assert.equal(h.nama, 'Nama Baru');
  assert.equal(h.kelas, '8B');
});

// ============================================================
bagian('2. TIDAK ADA PERUBAHAN = TIDAK MENGUMUMKAN APA PUN');
// ============================================================

uji('data identik tidak dianggap berubah (idempoten)', () => {
  const h = putuskanPembaruanProfil(cache, { nama: 'Chelsea Nadia E', kelasSekolah: '9 SMP' });
  assert.equal(h.berubah, false);
});

uji('dipanggil dua kali hasilnya sama (tidak ada keadaan tersembunyi)', () => {
  const server = { nama: 'Chelsea Nadia E', kelasSekolah: '9 SMP' };
  assert.deepEqual(putuskanPembaruanProfil(cache, server), putuskanPembaruanProfil(cache, server));
});

// ============================================================
bagian('3. SERVER KOSONG/RUSAK TIDAK BOLEH MENGHAPUS NAMA');
// ============================================================

uji('nama server kosong -> cache dipertahankan, bukan blank', () => {
  const h = putuskanPembaruanProfil(cache, { nama: '', kelasSekolah: '9 SMP' });
  assert.equal(h.nama, 'Chelsea Nadia E');
  assert.equal(h.berubah, false);
});

uji('nama server hanya spasi -> dianggap kosong', () => {
  const h = putuskanPembaruanProfil(cache, { nama: '   ', kelasSekolah: '9 SMP' });
  assert.equal(h.nama, 'Chelsea Nadia E');
  assert.equal(h.berubah, false);
});

uji('dokumen server tanpa field nama -> cache dipertahankan', () => {
  const h = putuskanPembaruanProfil(cache, { kelasSekolah: '9 SMP' });
  assert.equal(h.nama, 'Chelsea Nadia E');
  assert.equal(h.berubah, false);
});

uji('server null/undefined -> cache dipertahankan, tidak melempar', () => {
  for (const s of [null, undefined]) {
    const h = putuskanPembaruanProfil(cache, s);
    assert.equal(h.nama, 'Chelsea Nadia E');
    assert.equal(h.berubah, false);
  }
});

uji('kelas server hilang -> jadi string kosong, dan itu TERDETEKSI sebagai perubahan', () => {
  // Berbeda dengan nama: kelas memang boleh kosong (data lama tanpa
  // kelas). Kalau server bilang kosong dan cache berisi, itu perubahan
  // sah yang harus sampai ke tampilan, bukan ditelan.
  const h = putuskanPembaruanProfil(cache, { nama: 'Chelsea Nadia E' });
  assert.equal(h.berubah, true);
  assert.equal(h.kelas, '');
});

// ============================================================
bagian('4. NORMALISASI');
// ============================================================

uji('spasi di pinggir nama server dibuang sebelum dibandingkan', () => {
  const h = putuskanPembaruanProfil(cache, { nama: '  Chelsea Nadia E  ', kelasSekolah: '9 SMP' });
  assert.equal(h.berubah, false);
  assert.equal(h.nama, 'Chelsea Nadia E');
});

uji('cache tanpa nama jatuh ke default "Siswa", bukan undefined', () => {
  const h = putuskanPembaruanProfil({ nama: '', kelas: '' }, null);
  assert.equal(h.nama, 'Siswa');
  assert.equal(h.berubah, false);
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
