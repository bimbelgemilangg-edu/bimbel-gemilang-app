// tests/imporHtmlGeminiKeBank.test.mjs
// ============================================================
// Test jembatan ekstraktor HTML Gemini -> dokumen bank_soal
// (src/utils/imporHtmlGeminiKeBank.js).
//
//     node tests/imporHtmlGeminiKeBank.test.mjs
//
// KENAPA INI PENTING
// Salah memetakan SATU field di sini berarti soal yang masuk bank tidak
// terbaca oleh satu halaman tertentu (skoring, cetak, perpustakaan,
// lemari) sementara halaman lain baik-baik saja -- cacat yang baru
// kelihatan berhari-hari kemudian. Test ini mengunci field-field yang
// menjadi tanggungan tiap halaman.
// ============================================================

import assert from 'node:assert/strict';
import { dokumenDariButir, ringkasanImpor } from '../src/utils/imporHtmlGeminiKeBank.js';

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
function bagian(j) { console.log(`\n${j}`); }

const BUTIR = {
  nomor: 7,
  tipe: 'pg_sederhana',
  soal: 'Perhatikan diagram berikut! {{GAMBAR_1}} Bagian B adalah....',
  opsiJawaban: ['bronkus', 'alveolus'],
  kunciJawaban: 'B',
  pembahasan: 'Cabang utama trakea adalah bronkus.',
  pembahasanAsal: 'penalaran',
  materi: 'SISTEM RESPIRASI',
  sumber: 'TKA 2020/44',
  gambarUrls: [],
};
const KONTEKS = { fileName: 'biologi-bag1.html', mapel: 'Biologi', jenjang: 'SMA', kelas: '10' };

console.log('imporHtmlGeminiKeBank — jembatan ekstraktor -> bank_soal');

// ============================================================
bagian('1. FIELD YANG MENJADI TANGGUNGAN TIAP HALAMAN');
// ============================================================

uji('status aktif & asalImpor tertandai (audit & saringan terbit)', () => {
  const d = dokumenDariButir(BUTIR, KONTEKS);
  assert.equal(d.status, 'aktif');
  assert.equal(d.asalImpor, 'html-gemini');
  assert.equal(d.sumberFile, 'biologi-bag1.html');
});

uji('bab dari section-header sampai ke `bab` DAN `materi` (dibaca halaman berbeda)', () => {
  const d = dokumenDariButir(BUTIR, KONTEKS);
  assert.equal(d.bab, 'SISTEM RESPIRASI');
  assert.equal(d.materi, 'SISTEM RESPIRASI');
});

uji('mapel & jenjang konteks menang dan ternormalisasi', () => {
  const d = dokumenDariButir(BUTIR, { ...KONTEKS, mapel: 'bio' });
  assert.equal(d.mataPelajaran, 'Biologi');
  assert.equal(d.mapel, 'Biologi');
  // 🔥 DIPERBARUI 2026-10-08 (dulu mengharapkan 'SMA').
  // `terapkanTaksonomi` kini mengkanonisasi jenjang ke kosakata baku
  // 'SMA/MA' di TITIK TULIS. Alasannya: semua penyaring hierarki
  // (Lemari Soal, Cetak Latihan, Perpustakaan) membandingkan string
  // PERSIS, sedangkan jalur impor scan menulis 'SMA/MA'. Soal ber-jenjang
  // 'SMA' tidak pernah muncul saat tentor memilih 'SMA/MA' — lenyap tanpa
  // error. Rinciannya: src/utils/jenjangBaku.js + tests/taksonomiIdentitas.test.mjs.
  assert.equal(d.jenjang, 'SMA/MA');
  // `jenjangSebelumBaku` SENGAJA tidak ada di sini: nilai 'SMA' datang
  // dari deteksi taksonomi, bukan dari dokumen yang sudah tersimpan, jadi
  // tidak ada yang ditimpa dan tidak ada yang perlu diselamatkan.
  // Jejak itu hanya ditulis bila nilai lama dokumen benar-benar diganti
  // (diuji di tests/taksonomiIdentitas.test.mjs).
  assert.equal(d.jenjangSebelumBaku, undefined);
});

uji('kunci, opsi, pembahasan, dan pengakuan penalaran utuh', () => {
  const d = dokumenDariButir(BUTIR, KONTEKS);
  assert.equal(d.kunciJawaban, 'B');
  assert.deepEqual(d.opsiJawaban, ['bronkus', 'alveolus']);
  assert.ok(d.pembahasan.includes('bronkus'));
  assert.equal(d.pembahasanAsal, 'penalaran');
});

uji('taksonomi Merdeka dari Gemini bertahan sampai dokumen bank', () => {
  const d = dokumenDariButir({
    ...BUTIR, kurikulum: 'merdeka', fase: 'E', kelas: '10',
    elemen: 'Pemahaman Sains', capaian: 'CP-001',
  }, KONTEKS);
  assert.equal(d.kurikulum, 'merdeka');
  assert.equal(d.fase, 'E');
  assert.equal(d.kelas, '10');
  assert.equal(d.elemen, 'Pemahaman Sains');
  assert.equal(d.capaian, 'CP-001');
});

uji('teks soal ganda-di field soal & teksSoal (dua generasi reader)', () => {
  const d = dokumenDariButir(BUTIR, KONTEKS);
  assert.equal(d.soal, d.teksSoal);
  assert.ok(d.soal.includes('{{GAMBAR_1}}'));
});

// ============================================================
bagian('2. RINGKASAN PRAKIRIM: BENDERA YANG HARUS DILIHAT ADMIN');
// ============================================================

uji('jumlah per bab untuk pratinjau', () => {
  const r = ringkasanImpor([BUTIR, { ...BUTIR, materi: 'SISTEM SIRKULASI' }, { ...BUTIR, materi: 'SISTEM RESPIRASI' }]);
  assert.equal(r.jumlah, 3);
  assert.deepEqual(r.perBab, [['SISTEM RESPIRASI', 2], ['SISTEM SIRKULASI', 1]]);
});

uji('pembahasan penalaran dihitung sebagai bendera review guru', () => {
  const r = ringkasanImpor([BUTIR, { ...BUTIR, pembahasanAsal: 'tercetak' }]);
  assert.equal(r.penalaran, 1);
});

uji('soal pg tanpa kunci dibenderai; esai tanpa kunci TIDAK (memang begitu)', () => {
  const r = ringkasanImpor([
    { ...BUTIR, kunciJawaban: '' },
    { ...BUTIR, tipe: 'esai', kunciJawaban: '' },
    { ...BUTIR, tipe: 'pg_kompleks', kunciJawaban: [] },
  ]);
  assert.equal(r.tanpaKunci, 2);
});

// ============================================================
bagian('3. ASAL-USUL GAMBAR: META & ANTREAN POTONGAN IKUT KE DOKUMEN');
// ============================================================

uji('gambarMeta & potonganTertunda terbawa utuh (sejajar gambarUrls)', () => {
  const d = dokumenDariButir({
    ...BUTIR,
    gambarUrls: ['https://supabase.contoh/x.jpg'],
    gambarMeta: [{ sumber: 'url-asli', asal: 'https://contoh.contoh/soal', caption: 'Diagram paru' }],
    potonganTertunda: [{ urutan: 2, petunjuk: 'halaman 12, kiri bawah, penampang batang' }],
  }, KONTEKS);
  assert.deepEqual(d.gambarUrls, ['https://supabase.contoh/x.jpg']);
  assert.deepEqual(d.gambarMeta, [{ sumber: 'url-asli', asal: 'https://contoh.contoh/soal', caption: 'Diagram paru' }]);
  assert.deepEqual(d.potonganTertunda, [{ urutan: 2, petunjuk: 'halaman 12, kiri bawah, penampang batang' }]);
});

uji('butir lama tanpa meta gambar tetap sah (kompatibel ke belakang)', () => {
  const d = dokumenDariButir(BUTIR, KONTEKS);
  assert.deepEqual(d.gambarMeta, []);
  assert.deepEqual(d.potonganTertunda, []);
});

uji('ringkasanImpor menghitung tangga gambar: URL asli / terindikasi buatan / menunggu potongan', () => {
  const r = ringkasanImpor(
    [{ materi: 'BAB', kunciJawaban: 'B', tipe: 'pg_sederhana', pembahasanAsal: 'tercetak' }],
    [
      { src: 'https://cdn.contoh/a.jpg', gambarSumber: 'url-asli' },
      { src: 'data:image/png;base64,xx', gambarSumber: 'base64-tanpa-asal' },
      { src: 'data:image/png;base64,yy', gambarSumber: 'warisan' },
    ],
    [{ kartu: 'x', urutan: 1, petunjuk: 'halaman 3' }],
  );
  assert.equal(r.jumlah, 1);
  assert.equal(r.urlAsli, 1);
  assert.equal(r.terindikasiBuatan, 1);
  assert.equal(r.menungguPotongan, 1);
});

uji('pemanggilan ringkasanImpor gaya lama (satu argumen) tidak rusak', () => {
  const r = ringkasanImpor([{ materi: 'B', kunciJawaban: 'A', tipe: 'pg_sederhana' }]);
  assert.equal(r.jumlah, 1);
  assert.equal(r.urlAsli, 0);
  assert.equal(r.terindikasiBuatan, 0);
  assert.equal(r.menungguPotongan, 0);
});

// ============================================================
bagian('4. OPSI KAYA: gambarRefs DISELESAIKAN JADI gambar (kajian PDF Kinematika)');

uji('opsi {teks, gambarRefs} jadi {teks, gambar:[{url,...}]} sejajar gambarUrls', () => {
  const dok = dokumenDariButir({
    nomor: 42,
    tipe: 'pg_kompleks',
    soal: 'Manakah grafik yang tepat?',
    opsiJawaban: [
      { teks: '', gambar: [], gambarRefs: [2] },
      'E. teks polos',
    ],
    kunciJawaban: ['A', 'D'],
    gambarUrls: ['https://cdn.contoh/a.png', 'https://cdn.contoh/b.png'],
    gambarMeta: [
      { sumber: 'url-asli', asal: 'https://x/a', caption: '', region: 'opsi' },
      { sumber: 'url-asli', asal: 'https://x/b', caption: '', region: 'opsi' },
    ],
  }, { fileName: 'kinematika.html', mapel: 'fisika' });
  assert.equal(dok.opsiJawaban.length, 2);
  assert.equal(dok.opsiJawaban[0].gambar.length, 1);
  assert.equal(dok.opsiJawaban[0].gambar[0].url, 'https://cdn.contoh/b.png');
  assert.equal(dok.opsiJawaban[0].gambar[0].asal, 'https://x/b');
  assert.equal(dok.opsiJawaban[0].gambarRefs, undefined, 'referensi internal tidak boleh ikut tersimpan');
  assert.equal(dok.opsiJawaban[1], 'E. teks polos');
});

uji('gambarRefs tanpa url (menunggu potongan) dibuang, opsi tetap ada', () => {
  const dok = dokumenDariButir({
    nomor: 71,
    tipe: 'pg_sederhana',
    soal: 'Pilih.',
    opsiJawaban: [{ teks: '', gambar: [], gambarRefs: [5] }],
    kunciJawaban: 'A',
    gambarUrls: [],
  }, { fileName: 'kinematika.html', mapel: 'fisika' });
  assert.deepEqual(dok.opsiJawaban[0], { teks: '', gambar: [] });
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
