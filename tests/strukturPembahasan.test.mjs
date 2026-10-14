// tests/strukturPembahasan.test.mjs — parser struktur pembahasan gaya buku
//     node tests/strukturPembahasan.test.mjs
// Baris uji disalin dari pembahasan asli berkas owner (bab 1 & bab 2).
import assert from 'node:assert/strict';
import {
  pisahKodeSumber, strukturPembahasan, pecahHighlight,
} from '../src/utils/strukturPembahasan.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 220)}`); }
}
console.log('strukturPembahasan — pembahasan gaya buku');

uji('kode sumber dipisah dari teks soal', () => {
  const r = pisahKodeSumber('[SNMPTN 2010/TPA/942/17]\nSemua yang datang basah kuyup.');
  assert.equal(r.kode, 'SNMPTN 2010/TPA/942/17');
  assert.equal(r.teks, 'Semua yang datang basah kuyup.');
  const r2 = pisahKodeSumber('SBMPTN 2019/UTBK I/TPS/PU/08 Berdasarkan paragraf 2...');
  assert.equal(r2.kode, 'SBMPTN 2019/UTBK I/TPS/PU/08');
});

uji('kode di tengah teks tidak dipaksa jadi header', () => {
  const t = 'Perhatikan pernyataan berikut yang panjang sekali sekali sekali sekali sekali sekali SNMPTN 2010/TPA/942/17 untuk dilihat.';
  const r = pisahKodeSumber(t);
  assert.equal(r.kode, null);
  assert.equal(r.teks, t);
});

uji('blok silogisme buku terkelompok sebagai logika', () => {
  const blok = strukturPembahasan([
    'SNMPTN 2010/TPA/942/17',
    'Semua yang datang basah kuyup.',
    'Sebagian yang basah kuyup menderita sakit.',
    'Semua A, B',
    'Sebagian B, C',
    'Kesimpulan : Sebagian A, Bukan C',
    'Sebagian yang datang menderita tidak sakit.',
    'Jawaban B',
  ].join('\n'));
  assert.equal(blok[0].jenis, 'kode');
  assert.equal(blok[1].jenis, 'teks');
  assert.equal(blok[2].jenis, 'teks');
  assert.equal(blok[3].jenis, 'logika');
  assert.deepEqual(blok[3].baris, ['Semua A, B', 'Sebagian B, C']);
  assert.equal(blok[4].jenis, 'kesimpulan');
  assert.equal(blok[5].jenis, 'teks');
  assert.deepEqual(blok[6], { jenis: 'jawaban', huruf: 'B' });
});

uji('varian baris jawaban & premis dari berkas nyata dikenali', () => {
  for (const [baris, jenis] of [
    ['Jawaban E', 'jawaban'], ['Jawaban. B', 'jawaban'], ['Jawaban: C', 'jawaban'],
    ['4 Jawaban B', 'jawaban'], ['Jawaban D', 'jawaban'],
    ['Premis 1 : p>q', 'logika'], ['Premis2 : q>r', 'logika'],
    ['p>q', 'logika'], ['q7rT', 'logika'], ['por', 'logika'], ['p-q', 'logika'],
    ['Kesimpulan : Sebagian C, B', 'kesimpulan'],
  ]) {
    const blok = strukturPembahasan(baris);
    assert.equal(blok[0].jenis, jenis, `"${baris}" -> ${blok[0].jenis}, seharusnya ${jenis}`);
  }
});

uji('INVARIAN: baris tak dikenali tetap paragraf, tidak dipaksa kategori', () => {
  const blok = strukturPembahasan('Karena sama-sama menyukai bahasa Inggris.');
  assert.deepEqual(blok, [{ jenis: 'teks', teks: 'Karena sama-sama menyukai bahasa Inggris.' }]);
});

uji('baris "Jawabar"/"Jawaba" rusak OCR tidak diakui sebagai jawaban', () => {
  // Lebih baik tampil sebagai teks biasa daripada mengklaim huruf jawaban
  // yang tidak ada.
  for (const b of ['Jawaba', 'Jawabar', 'Jawabat']) {
    assert.equal(strukturPembahasan(b)[0].jenis, 'teks', b);
  }
});

uji('highlight eksplisit ==teks== dan <mark> dipecah', () => {
  const b = pecahHighlight('Sebagian dari perempuan yang ==berisiko tinggi untuk bercerai== mengalami kekerasan.');
  assert.deepEqual(b.map((x) => x.highlight), [false, true, false]);
  const c = pecahHighlight('tanpa highlight');
  assert.deepEqual(c, [{ teks: 'tanpa highlight', highlight: false }]);
});

// ============================================================
// REGRESI berkas bab 1 UTBK TPS-PU (koreksi owner, 2026-10-10):
// bentuk baris logika/kesimpulan yang benar-benar tertulis di buku.
// Tanpa ini, preview & naskah cetak tidak pernah mirip buku --
// keluhan owner "tampilan gak sama dengan pdf pembahasan".
// ============================================================

uji('bentuk kesimpulan nyata di buku dikenali', () => {
  for (const b of [
    'Kesimpulan : Sebagian A, B dan Bukan C',
    'Kesimpulan : Semua A yang C, B',
    'Kesimpulan : Sebagian yang C, bukan A',
    'Kesimpulan : Sebagian A, B, C',
    'Kesimpulan :',
    'Kesimpulan : Beberapa A, C',
  ]) {
    const blok = strukturPembahasan(b);
    assert.equal(blok[0].jenis, 'kesimpulan', `"${b}" -> ${blok[0].jenis}`);
  }
});

uji('baris premis tanpa nomor & tanpa spasi tetap blok logika', () => {
  const blok = strukturPembahasan([
    'Rumus :',
    'Premis 1: Semua A,B',
    'beberapa B,C',
    'Kesimpulan : Beberapa A, C',
  ].join('\n'));
  assert.deepEqual(blok.map((b) => b.jenis), ['logika', 'kesimpulan'], JSON.stringify(blok));
  assert.deepEqual(blok[0].baris, ['Rumus :', 'Premis 1: Semua A,B', 'beberapa B,C']);
});

uji('penanda margin buku (PU/PK/K) jadi blok logika, prosa panjang tidak', () => {
  assert.equal(strukturPembahasan('PU: 4Semua mobil yang')[0].jenis, 'logika');
  assert.equal(strukturPembahasan('K: Semua mahasiwa jurusan Hubungan')[0].jenis, 'logika');
  const panjang = 'PU: Syarat menjadi diplomat di negara berkembang adalah harus menguasai beberapa bahasa asing dan ilmu hubungan internasional yang panjang.';
  assert.equal(strukturPembahasan(panjang)[0].jenis, 'teks');
});

uji('kalimat biasa yang memuat kata "semua/sebagian" TIDAK dianggap logika', () => {
  for (const b of [
    'Semua penghuni asrama B adalah pegawai negeri',
    'Sebagian yang seminggu sekali makan jagung adalah penduduk kota.',
    'Kesimpulan yang tepat adalah sebagian pemain di kota C sportif.',
  ]) {
    assert.equal(strukturPembahasan(b)[0].jenis, 'teks', b);
  }
});

uji('baris kode sumber berdiri sendiri walau baris di atasnya belum berakhir', () => {
  const blok = strukturPembahasan([
    'SBMPTN 2019/UTBK I/TPS/PU/08',
    'Tips menentukan kesimpulan adalah mencari',
    'kuantor yaitu kata semua, beberapa, sebagian.',
    'Jawaban: B',
  ].join('\n'));
  assert.deepEqual(blok.map((b) => b.jenis), ['kode', 'teks', 'teks', 'jawaban']);
  assert.equal(blok[3].huruf, 'B');
});

uji('varian jawaban bergaya buku dikenali', () => {
  for (const [baris, huruf] of [['Jawaban: B', 'B'], ['Jawaban : C', 'C'], 'Jawaban E', 'Jawaban. D'].map((x) => (Array.isArray(x) ? x : [x, x.slice(-1)]))) {
    const blok = strukturPembahasan(baris);
    assert.equal(blok[0].jenis, 'jawaban', baris);
    assert.equal(blok[0].huruf, huruf, baris);
  }
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);

uji('panah OCR rusak dipulihkan ke bentuk kanonik buku (sampel owner)', () => {
  // PDF halaman 9 mencetak: p → q / q → r / garis / p → r.
  // OCR/AI pihak ketiga merusaknya jadi "p-q", "qr", "por".
  const blok = strukturPembahasan('p-q\nqr\npor');
  assert.equal(blok.length, 1);
  assert.deepEqual(blok[0].baris, ['p → q', 'q → r', '—————', 'p → r']);
});

uji('varian panah rusak lain (-, 7, o, >, tempel) semuanya pulih', () => {
  const blok = strukturPembahasan('p7q\nqor\np>r\npq');
  assert.deepEqual(blok[0].baris.slice(0, 2), ['p → q', 'q → r']);
});

uji('kuantor & baris berprefiks Premis TIDAK diubah isinya', () => {
  const blok = strukturPembahasan('Premis 1 : p>q\nSemua A, B\nSebagian B, C');
  assert.deepEqual(blok[0].baris, ['Premis 1 : p>q', 'Semua A, B', 'Sebagian B, C']);
});

uji('garis inferensi hanya untuk tumpukan implikasi murni >=3 baris', () => {
  const dua = strukturPembahasan('p-q\nqr');
  assert.deepEqual(dua[0].baris, ['p → q', 'q → r'], 'dua baris tidak boleh dapat garis');
});

console.log('✅ Semua test lulus.');
