// tests/identitasGuru.test.mjs
// ============================================================
// Test invarian identitas guru ↔ try out (bug owner 2026-10).
//
// Kasusnya nyata: admin menghubungkan paket try out ke Chelsea lewat
// dropdown halaman Terbitkan — yang tersimpan di `tryout_paket.tentorId`
// adalah DOCID Firestore ("epmtJ3g3EMvqlEsA2IrB"), padahal kode lama di
// dashboard guru mencari kode field `guruId` ("GURU-005"). Akibatnya
// banner "Try Out yang Dipercayakan Kepada Anda" tidak pernah muncul
// dan halaman pantau menolak guru yang sah.
//
// Invarian yang dijaga di sini:
//   1. DocId maupun kode GURU-0xx sama-sama diakui (data lama & baru).
//   2. Guru tanpa data login TIDAK pernah cocok dengan paket apa pun
//      (kode lama justru meloloskan kasus ini — lubang akses).
//   3. Paket tanpa tentor bukan milik siapa-siapa.
//   4. NAMA tidak pernah jadi identitas (dua guru bisa bernama sama).
//   5. Daftar identitas dedup & kecil (aman untuk query Firestore 'in').
//   6. Semantik lama bacaIdentitasGuru tidak berubah (oracle legacy).
// ============================================================

import assert from 'node:assert/strict';
import {
  daftarIdGuru,
  guruCocokDenganTentor,
  bacaIdentitasGuru,
} from '../src/utils/identitasGuru.js';

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

// Data tiruan persis bentuk localStorage teacherData:
// { id: docId, ...fieldDokumen } — lihat LoginGuru.jsx.
const CHELSEA = { id: 'epmtJ3g3EMvqlEsA2IrB', guruId: 'GURU-005', nama: 'Chelsea Nadia E' };
const TANPA_KODE = { id: 'H696Qlgrt4DJ3vwLhswS', nama: 'Chindy Wulandari' };

bagian('1) Koneksi buatan admin (tentorId = docId) WAJIB terbaca guru');
uji('docId tersimpan → guru pemilik field guruId cocok', () => {
  assert.equal(guruCocokDenganTentor('epmtJ3g3EMvqlEsA2IrB', CHELSEA), true);
});
uji('kode GURU-0xx tersimpan (jalur lama) → tetap cocok', () => {
  assert.equal(guruCocokDenganTentor('GURU-005', CHELSEA), true);
});
uji('guru tanpa field guruId tetap cocok lewat docId-nya', () => {
  assert.equal(guruCocokDenganTentor('H696Qlgrt4DJ3vwLhswS', TANPA_KODE), true);
});
uji('docId guru LAIN ditolak (bukan cuma "tidak sama string kosong")', () => {
  assert.equal(guruCocokDenganTentor('H696Qlgrt4DJ3vwLhswS', CHELSEA), false);
  assert.equal(guruCocokDenganTentor('GURU-005', TANPA_KODE), false);
});

bagian('2) Identitas kosong / paket tanpa tentor = tidak ada akses');
uji('guru tanpa data login → daftar identitas kosong', () => {
  assert.deepEqual(daftarIdGuru({}), []);
  assert.deepEqual(daftarIdGuru(), []); // tanpa argumen = baca localStorage
});
uji('guru tanpa data login TIDAK cocok dengan paket apa pun', () => {
  assert.equal(guruCocokDenganTentor('epmtJ3g3EMvqlEsA2IrB', {}), false);
});
uji('paket tanpa tentor (null / string kosong) ditolak untuk semua guru', () => {
  assert.equal(guruCocokDenganTentor(null, CHELSEA), false);
  assert.equal(guruCocokDenganTentor('', CHELSEA), false);
  assert.equal(guruCocokDenganTentor(undefined, CHELSEA), false);
});

bagian('3) Nama bukan identitas (anti lubang akses)');
uji('tentorId berisi nama guru TIDAK dianggap cocok', () => {
  assert.equal(guruCocokDenganTentor('Chelsea Nadia E', CHELSEA), false);
});
uji('daftar identitas tidak memuat nama', () => {
  assert.equal(daftarIdGuru(CHELSEA).includes('Chelsea Nadia E'), false);
});

bagian('4) Bentuk daftar identitas: dedup, kecil, urutan stabil');
uji('urutan: kode guruId dulu lalu docId', () => {
  assert.deepEqual(daftarIdGuru(CHELSEA), ['GURU-005', 'epmtJ3g3EMvqlEsA2IrB']);
});
uji('nilai kembar di-dedup (penting: query Firestore "in")', () => {
  const dup = { id: 'GURU-005', guruId: 'GURU-005', teacherId: 'GURU-005' };
  assert.deepEqual(daftarIdGuru(dup), ['GURU-005']);
});
uji('maksimal 3 entri — jauh di bawah batas 30 nilai query "in"', () => {
  assert.ok(daftarIdGuru(CHELSEA).length <= 3);
});
uji('nilai angka & spasi sekitarnya dinormalisasi', () => {
  assert.deepEqual(daftarIdGuru({ id: 42, guruId: ' GURU-9 ' }), ['GURU-9', '42']);
});

bagian('5) Semantik lama bacaIdentitasGuru tidak berubah (oracle legacy)');
// Oracle = implementasi lama sesiPresentasiService.bacaGuru sebelum fix.
const legacy = (d) => ({
  guruId: d.guruId || d.id || d.nama || 'guru',
  guruNama: d.nama || d.teacherName || 'Guru Gemilang',
});
for (const sampel of [CHELSEA, TANPA_KODE, { nama: 'Tanpa Id' }, {}]) {
  uji(`oracle cocok untuk sampel ${JSON.stringify(sampel)}`, () => {
    const baru = bacaIdentitasGuru(sampel);
    const lama = legacy(sampel);
    // lama punya fallback 'guru'; util memakai '' lalu service menambahkan
    // fallback itu — bandingkan setelah fallback diterapkan.
    assert.equal(baru.guruId || 'guru', lama.guruId);
    assert.equal(baru.guruNama, lama.guruNama);
  });
}
uji('docId & semuaId tersedia untuk pencocokan toleran', () => {
  const idt = bacaIdentitasGuru(CHELSEA);
  assert.equal(idt.docId, 'epmtJ3g3EMvqlEsA2IrB');
  assert.deepEqual(idt.semuaId, ['GURU-005', 'epmtJ3g3EMvqlEsA2IrB']);
});

console.log(`\nHasil: ${lulus} lulus, ${gagal} gagal.`);
if (gagal > 0) {
  console.log('Kegagalan:', JSON.stringify(kegagalan, null, 2));
  process.exit(1);
}
