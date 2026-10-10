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

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
