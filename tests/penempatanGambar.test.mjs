// tests/penempatanGambar.test.mjs
// ============================================================
// Test penempatan gambar di posisi placeholder {{GAMBAR}}.
//
//     node tests/penempatanGambar.test.mjs
//
// KENAPA INI PENTING
// Kontrak placeholder sudah ada di pipeline impor sejak lama
// (ImportHasilScanPage.jsx: "placeholder {{GAMBAR}} boleh disisipkan di
// teks_soal untuk posisi gambar tertentu"), tetapi TIDAK ADA pembaca yang
// mengonsumsinya: token mentah tercetak di badan soal yang dibaca siswa
// dan guru, sementara gambarnya ditumpuk di akhir. Kalimat soal jadi
// terputus dari gambarnya ("perhatikan gambar {{GAMBAR}} di atas" tanpa
// gambar di tempat yang ditunjuk).
//
// Invarian yang dikunci:
//   1. gambar masuk DI POSISI placeholder-nya, urutan terjaga
//   2. placeholder tanpa gambar sisa dibuang SENYAP (tidak mencetak token
//      mentah, tidak mencetak gambar rusak)
//   3. soal TANPA placeholder tetap menaruh gambar di akhir (perilaku lama
//      tidak berubah -- ribuan soal lama tidak boleh berubah tampilan)
//   4. teks di sekitar placeholder utuh, termasuk rumus $...$
// ============================================================

import assert from 'node:assert/strict';
import { pisahTeksDanGambar, adaPlaceholderBocor } from '../src/utils/penempatanGambar.js';

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

const jenis = (seg) => seg.map((s) => s.jenis).join(',');

console.log('penempatanGambar — gambar di posisi placeholder');

// ============================================================
bagian('1. GAMBAR MASUK DI POSISI PLACEHOLDER');
// ============================================================

uji('satu placeholder di tengah kalimat', () => {
  const seg = pisahTeksDanGambar('Perhatikan gambar {{GAMBAR}} berikut lalu simpulkan.', ['url1']);
  assert.equal(jenis(seg), 'teks,gambar,teks');
  assert.equal(seg[1].url, 'url1');
  assert.ok(seg[0].isi.includes('Perhatikan gambar'));
  assert.ok(seg[2].isi.includes('berikut lalu simpulkan'));
});

uji('placeholder bernomor memakai gambar sesuai urutannya', () => {
  const seg = pisahTeksDanGambar('A: {{GAMBAR}} B: {{GAMBAR_2}}', ['u1', 'u2']);
  assert.equal(jenis(seg), 'teks,gambar,teks,gambar');
  assert.equal(seg[1].url, 'u1');
  assert.equal(seg[3].url, 'u2');
});

uji('teks di sekitar placeholder utuh termasuk rumus', () => {
  const seg = pisahTeksDanGambar('Jika $x^2=4$ lihat {{GAMBAR}} maka nilai x', ['u']);
  const teks = seg.filter((s) => s.jenis === 'teks').map((s) => s.isi).join('');
  assert.ok(teks.includes('$x^2=4$'), 'rumus ikut rusak');
});

// ============================================================
bagian('2. PLACEHOLDER TANPA GAMBAR TIDAK BOCOR');
// ============================================================

uji('placeholder tanpa gambar dibuang senyap, bukan tercetak mentah', () => {
  const seg = pisahTeksDanGambar('Lihat {{GAMBAR}} lalu jawab.', []);
  assert.equal(jenis(seg), 'teks');
  const semua = seg.map((s) => s.isi || '').join('');
  assert.ok(!semua.includes('{{'), 'token mentah bocor');
  assert.ok(adaPlaceholderBocor('Lihat {{GAMBAR}} lalu jawab.', []) === true);
});

uji('adaPlaceholderBocor false bila gambar mencukupi', () => {
  assert.equal(adaPlaceholderBocor('Lihat {{GAMBAR}}', ['u']), false);
  assert.equal(adaPlaceholderBocor('tanpa placeholder', []), false);
});

// ============================================================
bagian('3. PERILAKU LAMA TIDAK BERUBAH');
// ============================================================

uji('soal TANPA placeholder: gambar di akhir (ribuan soal lama aman)', () => {
  const seg = pisahTeksDanGambar('Teks soal biasa.', ['u1', 'u2']);
  assert.equal(jenis(seg), 'teks,gambar,gambar');
});

uji('tanpa gambar dan tanpa placeholder: satu segmen teks utuh', () => {
  const seg = pisahTeksDanGambar('Hanya teks.', []);
  assert.deepEqual(seg, [{ jenis: 'teks', isi: 'Hanya teks.' }]);
});

uji('masukan rusak tidak melempar', () => {
  assert.deepEqual(pisahTeksDanGambar(null, null), []);
  assert.deepEqual(pisahTeksDanGambar(undefined, undefined), []);
  assert.equal(jenis(pisahTeksDanGambar('x', 'bukan-array')), 'teks');
});

uji('gambar kosong/null di daftar diabaikan', () => {
  const seg = pisahTeksDanGambar('a {{GAMBAR}} b', ['', null, 'u3']);
  assert.equal(jenis(seg), 'teks,gambar,teks');
  assert.equal(seg[1].url, 'u3');
});

// ============================================================
bagian('4. TOKEN BERNOMOR DI TEKS MANAPUN (kajian PDF Kinematika)');
// ============================================================

uji('pembahasan menyebut {{GAMBAR_3}} memakai gambarUrls[2], bukan gambar pertama', () => {
  const urls = ['u1', 'u2', 'u3'];
  const meta = [{ region: 'opsi' }, { region: 'opsi' }, { region: 'pembahasan' }];
  const seg = pisahTeksDanGambar(
    'Tahap pertama sudah jelas. {{GAMBAR_3}} Selanjutnya gradien dihitung.',
    urls,
    { meta, region: 'pembahasan' },
  );
  assert.equal(jenis(seg), 'teks,gambar,teks');
  assert.equal(seg[1].url, 'u3');
  assert.equal(seg[1].indeks, 2);
});

uji('gambar sisa region lain TIDAK menumpuk di teks ini (grafik opsi tidak nyasar ke pembahasan)', () => {
  const urls = ['u1', 'u2', 'u3'];
  const meta = [{ region: 'opsi' }, { region: 'opsi' }, { region: 'pembahasan' }];
  const seg = pisahTeksDanGambar('Hanya {{GAMBAR_3}} di sini.', urls, { meta, region: 'pembahasan' });
  assert.deepEqual(seg.filter((s) => s.jenis === 'gambar').map((s) => s.url), ['u3']);
});

uji('tanpa meta (berkas lama) gambar sisa tetap di akhir teks', () => {
  const seg = pisahTeksDanGambar('Hanya {{GAMBAR_3}} di sini.', ['u1', 'u2', 'u3']);
  assert.deepEqual(seg.filter((s) => s.jenis === 'gambar').map((s) => s.url), ['u3', 'u1', 'u2']);
});

uji('token polos dan bernomor bercampur: polos memakai gambar belum terpakai', () => {
  const urls = ['u1', 'u2', 'u3'];
  const seg = pisahTeksDanGambar('{{GAMBAR_2}} lalu {{GAMBAR}} lalu {{GAMBAR}}', urls);
  assert.deepEqual(seg.filter((s) => s.jenis === 'gambar').map((s) => s.url), ['u2', 'u1', 'u3']);
});

uji('nomor tanpa gambar padanannya dibuang senyap, gambar sisa ke akhir', () => {
  const seg = pisahTeksDanGambar('Teks {{GAMBAR_9}} lanjut.', ['u1']);
  assert.equal(jenis(seg), 'teks,gambar');
  assert.equal(seg[1].url, 'u1');
  assert.ok(!JSON.stringify(seg).includes('{{GAMBAR'));
});

uji('adaPlaceholderBocor mendeteksi nomor di luar jangkauan', () => {
  assert.equal(adaPlaceholderBocor('lihat {{GAMBAR_4}}', ['u1', 'u2']), true);
  assert.equal(adaPlaceholderBocor('lihat {{GAMBAR_2}}', ['u1', 'u2']), false);
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
