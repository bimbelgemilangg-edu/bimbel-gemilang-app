// tests/jalurStorage.test.mjs
// ============================================================
// Test konvensi jalur Supabase Storage (src/utils/jalurStorage.js).
//
//     node tests/jalurStorage.test.mjs
//
// KENAPA INI PENTING
// Skema lama menumpuk semua gambar materi semua mapel/bab di satu folder
// `gambar/`. Konvensi baru ini akan dipakai ribuan unggahan (Fase 1 & 4
// skema buku-kliping). Kalau pembentuk jalurnya bocor (spasi, huruf besar,
// slash ganda, nama kosong), kerusakannya menyebar ke setiap URL yang
// tersimpan di Firestore dan baru ketahuan berbulan kemudian.
// ============================================================

import assert from 'node:assert/strict';
import {
  slugify,
  jalurMateri,
  jalurBankSoal,
  jalurBukuProgres,
  jalurPengawasan,
  parseJalur,
  PREFIX_DIKENAL,
} from '../src/utils/jalurStorage.js';

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

console.log('jalurStorage — konvensi folder bucket materi-bimbel');

// ============================================================
bagian('1. SLUG AMAN UNTUK FOLDER');
// ============================================================

uji('huruf besar, spasi, dan simbol dinetralkan', () => {
  assert.equal(slugify('Bahasa Inggris SMA!'), 'bahasa-inggris-sma');
  assert.equal(slugify('  Bab 1: Tenses  '), 'bab-1-tenses');
});

uji('aksen dibuang (résumé -> resume), bukan jadi tanda aneh', () => {
  assert.equal(slugify('Résumé'), 'resume');
});

uji('nama kosong / null jatuh ke penanda, bukan string kosong', () => {
  assert.equal(slugify(''), 'tanpa-nama');
  assert.equal(slugify(null), 'tanpa-nama');
  assert.equal(slugify('***'), 'tanpa-nama');
});

uji('slug dibatasi 40 karakter supaya jalur tidak memanjang tanpa batas', () => {
  assert.ok(slugify('a'.repeat(200)).length <= 40);
});

// ============================================================
bagian('2. BENTUK JALUR PER JENIS ASET');
// ============================================================

uji('materi berjenjang: mapel/kelas/bab/jenis', () => {
  const j = jalurMateri({ mapel: 'Matematika', kelas: 'Kelas 8', bab: 'Bab 01', jenis: 'gambar', nama: 'diagram.png', ts: 111 });
  assert.equal(j, 'materi/matematika/kelas-8/bab-01/gambar/111_diagram.png');
});

uji('bank soal per bab', () => {
  const j = jalurBankSoal({ mapel: 'IPA', bab: 'Bab 3', nama: 'soal1.jpg', ts: 222 });
  assert.equal(j, 'bank-soal/ipa/bab-3/222_soal1.jpg');
});

uji('buku progres per siswa per pertemuan', () => {
  const j = jalurBukuProgres({ studentId: 'SISWA-001', pertemuan: 'Minggu 2', ts: 333 });
  assert.equal(j, 'buku-progres/SISWA-001/minggu-2/333_halaman.jpg');
});

uji('pengawasan try out per paket per sesi (mudah diaudit)', () => {
  const j = jalurPengawasan({ paketId: 'pkt1', sesiId: 'sesi9', ts: 444 });
  assert.equal(j, 'tryout-pengawasan/pkt1/sesi9/444.jpg');
});

uji('field hilang tidak menghasilkan slash ganda atau "undefined"', () => {
  const j = jalurMateri({ mapel: 'IPA', ts: 1 });
  assert.ok(!j.includes('//'), j);
  assert.ok(!j.includes('undefined'), j);
  assert.ok(!j.includes('tanpa-nama/tanpa-nama/tanpa-nama'), j);
});

uji('nama file ber-spasi & beraksen tetap aman di segmen terakhir', () => {
  const j = jalurBankSoal({ mapel: 'IPA', bab: 'Bab 1', nama: 'foto meja guru.jpg', ts: 5 });
  assert.ok(!/\s/.test(j), j);
});

// ============================================================
bagian('3. JALUR BISA DIBACA KEMBALI (untuk perkakas pembersih)');
// ============================================================

uji('parseJalur mengembalikan prefix dan segmen', () => {
  const j = jalurMateri({ mapel: 'IPA', kelas: '8', bab: 'Bab 1', jenis: 'pdf', nama: 'a.pdf', ts: 9 });
  const p = parseJalur(j);
  assert.equal(p.bucketPrefix, 'materi');
  assert.deepEqual(p.segmen.slice(0, 4), ['materi', 'ipa', '8', 'bab-1']);
});

uji('prefix warisan skema datar tetap diakui (jangan disapu sebagai sampah)', () => {
  for (const pre of ['gambar', 'pdf', 'dokumen', 'materi', 'bank-soal', 'buku-progres', 'tryout-pengawasan', 'tugas', 'foto-siswa']) {
    assert.ok(PREFIX_DIKENAL.has(pre), `prefix ${pre} tidak diakui`);
  }
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
