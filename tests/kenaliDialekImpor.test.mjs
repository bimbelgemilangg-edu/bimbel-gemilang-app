// tests/kenaliDialekImpor.test.mjs
// ============================================================
// Test pengenalan dialek berkas impor (src/utils/kenaliDialekImpor.js).
//
//     node tests/kenaliDialekImpor.test.mjs
//
// KENAPA INI PENTING
// Dua pintu impor HTML bank soal menerima dialek yang SALING TIDAK
// KOMPATIBEL, dan namanya hampir kembar. Berkas sah yang salah pintu
// terbaca nol kartu lalu dibalas pesan yang membuat owner merasa
// bersalah ("aku yang salah jangan jangan?"). Test ini memaku bahwa
// dialek dikenali dengan benar dan bahwa rambu hanya muncul bila
// berkasnya memang milik pintu lain -- tidak boleh pernah menyalahi
// berkas yang sudah berada di pintu yang benar.
// ============================================================

import assert from 'node:assert/strict';
import { kenaliDialekImpor, pesanSalahPintu, URL_PINTU_SCAN, URL_PINTU_PATEN } from '../src/utils/kenaliDialekImpor.js';

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

// Potongan VERBATIM berkas owner "02 Silogisme" (dialek halaman scan).
const CONTOH_SCAN = `<article data-gemilang-question data-nomor="20" data-tipe="pg_sederhana" data-paket="1">
  <div data-field="materi">Penalaran Deduktif / Silogisme</div>
  <div data-field="teks_soal"><p>Berdasarkan paragraf 3, manakah simpulan yang BENAR?</p></div>
  <ol data-field="opsi_jawaban"><li>a</li><li>b</li></ol>
  <meta data-field="kunci_jawaban" data-value="B" />
  <div data-field="pembahasan"><p>Premis 1 ...</p></div>
</article>`;

// Potongan struktur prompt paten (dialek Impor HTML Gemini).
const CONTOH_PATEN = `<div class="question-card" id="q1" data-tipe="pg_sederhana" data-kunci="B">
  <div class="q-body">Perhatikan grafik berikut!</div>
  <div class="options-list"><ul><li><span class="option-text">A) a</span></li></ul></div>
  <div class="pembahasan">Karena ...</div>
</div>`;

uji('dialek halaman scan dikenali & diarahkan ke pintu scan', () => {
  const k = kenaliDialekImpor(CONTOH_SCAN);
  assert.equal(k.dialek, 'scan');
  assert.equal(k.pintuSaran, URL_PINTU_SCAN);
});

uji('dialek prompt paten dikenali & diarahkan ke pintu paten', () => {
  const k = kenaliDialekImpor(CONTOH_PATEN);
  assert.equal(k.dialek, 'paten');
  assert.equal(k.pintuSaran, URL_PINTU_PATEN);
});

uji('JSON bank soal dikenali', () => {
  const k = kenaliDialekImpor('[{"teks_soal":"x","opsi_jawaban":["a"],"kunci_jawaban":"A"}]');
  assert.equal(k.dialek, 'json');
  assert.equal(k.pintuSaran, URL_PINTU_SCAN);
});

uji('berkas kosong/tak dikenali tidak menuduh pintu lain', () => {
  const k = kenaliDialekImpor('sekadar catatan rapat tanpa markup');
  assert.equal(k.dialek, 'tak-dikenal');
  assert.equal(pesanSalahPintu('sekadar catatan rapat tanpa markup', URL_PINTU_SCAN), null);
});

uji('rambu MUNCUL bila berkas scan ditempel ke pintu paten', () => {
  const pesan = pesanSalahPintu(CONTOH_SCAN, URL_PINTU_PATEN);
  assert.ok(pesan, 'rambu seharusnya muncul');
  assert.ok(pesan.includes(URL_PINTU_SCAN), pesan);
  assert.ok(pesan.includes('Bukan berkasnya yang salah'), pesan);
});

uji('rambu MUNCUL bila berkas paten ditempel ke pintu scan', () => {
  const pesan = pesanSalahPintu(CONTOH_PATEN, URL_PINTU_SCAN);
  assert.ok(pesan, 'rambu seharusnya muncul');
  assert.ok(pesan.includes(URL_PINTU_PATEN), pesan);
});

uji('rambu TIDAK muncul bila berkas sudah di pintu yang benar', () => {
  assert.equal(pesanSalahPintu(CONTOH_SCAN, URL_PINTU_SCAN), null);
  assert.equal(pesanSalahPintu(CONTOH_PATEN, URL_PINTU_PATEN), null);
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
