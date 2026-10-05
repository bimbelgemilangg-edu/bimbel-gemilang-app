// tests/identitasAbsensi.test.mjs
// ============================================================
// Test identitas pencarian absensi & penggabungan dokumen unik.
//
//     node tests/identitasAbsensi.test.mjs
//
// KENAPA INI PENTING
// Koleksi `attendance` ditulis oleh TIGA tempat dengan field identitas
// yang tidak seragam (studentId berisi kode ATAU docId; nama disimpan
// sebagai `namaSiswa` ATAU `studentName`). Halaman siswa dulu menebak
// dengan tiga query inline yang salah satunya berbasis nama dari
// localStorage -- sehingga setelah nama dibenarkan admin, catatan lama
// tidak ketemu lagi, dan perubahan status terasa "tidak konek".
//
// Karena identitasnya berantakan di DATA, pertahanan pertama adalah
// memastikan DAFTAR PENCARIANNYA lengkap dan tidak pernah mengirim
// query sampah ('' atau duplikat) -- dan bahwa hasil dari query yang
// tumpang tindih tidak menggandakan statistik Hadir/Izin/Sakit/Alpha.
// ============================================================

import assert from 'node:assert/strict';
import { daftarQueryAbsensi, gabungkanDokUnik } from '../src/utils/identitasAbsensi.js';

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

console.log('identitasAbsensi — kelengkapan & keamanan daftar pencarian');

// ============================================================
bagian('1. DAFTAR IDENTITAS LENGKAP (semua dialek penulis tercakup)');
// ============================================================

uji('empat kemungkinan field dicari: studentId(kode), studentId(docId), namaSiswa, studentName', () => {
  const d = daftarQueryAbsensi({ studentId: 'SISWA-001', docId: 'docABC', nama: 'Chelsea' });
  assert.deepEqual(d, [
    { field: 'studentId', nilai: 'SISWA-001' },
    { field: 'studentId', nilai: 'docABC' },
    { field: 'namaSiswa', nilai: 'Chelsea' },
    { field: 'studentName', nilai: 'Chelsea' },
  ]);
});

uji('kode dan docId sama -> tidak mengirim query duplikat', () => {
  const d = daftarQueryAbsensi({ studentId: 'X1', docId: 'X1', nama: 'A' });
  assert.deepEqual(d.filter((x) => x.field === 'studentId'), [{ field: 'studentId', nilai: 'X1' }]);
});

uji('nilai kosong / spasi dibuang (query == "" hanya membuang kuota)', () => {
  const d = daftarQueryAbsensi({ studentId: '  ', docId: '', nama: null });
  assert.deepEqual(d, []);
});

uji('profil kosong -> daftar kosong, tidak melempar', () => {
  assert.deepEqual(daftarQueryAbsensi(), []);
  assert.deepEqual(daftarQueryAbsensi(undefined), []);
});

uji('nilai dipangkas spasi pinggir sebelum dipakai', () => {
  const d = daftarQueryAbsensi({ studentId: '  SISWA-001  ', nama: ' Chelsea ' });
  assert.equal(d[0].nilai, 'SISWA-001');
  assert.equal(d.find((x) => x.field === 'namaSiswa').nilai, 'Chelsea');
});

uji('IDENTITAS STABIL DIDAHULUKAN daripada nama', () => {
  // Setelah admin membenarkan nama, catatan LAMA hanya bisa ketemu lewat
  // studentId/docId. Kalau urutan dibalik (nama dulu), kegagalan query
  // nama akan terasa seperti "absensi hilang".
  const d = daftarQueryAbsensi({ studentId: 'K', docId: 'D', nama: 'N' });
  assert.equal(d[0].field, 'studentId');
  assert.equal(d[d.length - 1].field, 'studentName');
});

// ============================================================
bagian('2. PENGGABUNGAN DOKUMEN UNIK (statistik tidak boleh ganda)');
// ============================================================

const dokSnap = (arr) => arr.map((o) => {
  const data = { ...o };
  delete data.id;
  return { id: o.id, data: () => data };
});

uji('dokumen yang muncul di dua query hanya dihitung sekali', () => {
  const a = dokSnap([{ id: 'r1', status: 'Hadir' }]);
  const b = dokSnap([{ id: 'r1', status: 'Hadir' }, { id: 'r2', status: 'Izin' }]);
  const gab = gabungkanDokUnik([a, b]);
  assert.equal(gab.length, 2);
  assert.deepEqual(gab.map((x) => x.id).sort(), ['r1', 'r2']);
});

uji('isi dokumen diambil dari data() maupun objek polos', () => {
  const lewatFn = dokSnap([{ id: 'r1', status: 'Sakit' }]);
  const polos = [{ id: 'r2', status: 'Alpha' }];
  const gab = gabungkanDokUnik([lewatFn, polos]);
  assert.equal(gab.find((x) => x.id === 'r1').status, 'Sakit');
  assert.equal(gab.find((x) => x.id === 'r2').status, 'Alpha');
});

uji('masukan kosong / rusak tidak melempar', () => {
  assert.deepEqual(gabungkanDokUnik(), []);
  assert.deepEqual(gabungkanDokUnik([]), []);
  assert.deepEqual(gabungkanDokUnik([undefined, null, []]), []);
});

uji('urutan kemunculan pertama dipertahankan (stabil untuk tampilan)', () => {
  const a = dokSnap([{ id: 'r9', status: 'Hadir' }, { id: 'r3', status: 'Hadir' }]);
  const b = dokSnap([{ id: 'r3', status: 'Hadir' }]);
  const gab = gabungkanDokUnik([a, b]);
  assert.deepEqual(gab.map((x) => x.id), ['r9', 'r3']);
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
