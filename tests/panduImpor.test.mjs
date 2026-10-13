// tests/panduImpor.test.mjs
// ============================================================
// Test logika wizard depan impor (src/utils/panduImpor.js).
//
//     node tests/panduImpor.test.mjs
//
// KENAPA INI PENTING
// Wizard ini menyetel metadata mesin (jenisUjian, format, mapel, jenjang)
// yang dipakai prompt AI, taksonomi, dan penamaan folder. Salah memetakan
// satu pilihan berarti soal TKA masuk keranjang reguler atau berkas scan
// diparse sebagai JSON -- cacat yang baru kelihatan setelah ratusan soal
// masuk. Kosakata nilainya SENGAJA dikunci di sini supaya tidak pernah
// menyimpang dari select/format yang sudah ada di halaman impor.
// ============================================================

import assert from 'node:assert/strict';
import { PILIHAN_KONTEN, PILIHAN_UJIAN, PILIHAN_FORMAT, metaDariPilihan, teksPanduan } from '../src/utils/panduImpor.js';

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

uji('jenisUjian memakai kosakata select yang sudah ada di halaman', () => {
  // Select di ImportHasilScanPage hanya mengenal empat nilai ini plus ''.
  const sah = new Set(['TKA', 'SNBT/UTBK', 'Reguler', 'Lainnya']);
  for (const u of PILIHAN_UJIAN) assert.ok(sah.has(u.jenisUjian), `${u.jenisUjian} tidak dikenal select`);
});

uji('format memakai kosakata tombol format yang sudah ada', () => {
  const sah = new Set(['html', 'json', 'csv', 'tex']);
  for (const f of PILIHAN_FORMAT) assert.ok(sah.has(f.format), `${f.format} tidak dikenal halaman`);
});

uji('jalur scan: jenisUjian TKA + format html + butuh prompt', () => {
  const m = metaDariPilihan({ konten: 'seleksi', ujian: 'TKA', format: 'scan', mapel: 'Penalaran Umum', jenjang: 'SMA', kelas: '12' });
  assert.equal(m.pintuLain, null);
  assert.equal(m.jenisUjian, 'TKA');
  assert.equal(m.format, 'html');
  assert.equal(m.butuhPrompt, true);
  assert.equal(m.mapel, 'Penalaran Umum');
  assert.equal(m.kelas, '12');
});

uji('jalur reguler tanpa pilih ujian tetap jatuh ke Reguler', () => {
  const m = metaDariPilihan({ konten: 'reguler', ujian: '', format: 'json' });
  assert.equal(m.jenisUjian, 'Reguler');
  assert.equal(m.format, 'json');
  assert.equal(m.butuhPrompt, false);
});

uji('konten materi & kuis guru diarahkan ke pintu lain, bukan dipaksa di sini', () => {
  const materi = metaDariPilihan({ konten: 'materi' });
  assert.equal(materi.pintuLain, '/admin/buku/impor');
  const kuis = metaDariPilihan({ konten: 'kuis-guru' });
  assert.equal(kuis.pintuLain, '/guru/modul');
  assert.ok(teksPanduan(materi).includes('bukan di halaman ini'));
});

uji('teksPanduan menyebut langkah berikutnya sesuai butuh/tidaknya prompt', () => {
  const scan = metaDariPilihan({ konten: 'seleksi', ujian: 'SNBT/UTBK', format: 'scan' });
  assert.ok(teksPanduan(scan).includes('salin prompt'), teksPanduan(scan));
  const html = metaDariPilihan({ konten: 'seleksi', ujian: 'SNBT/UTBK', format: 'html' });
  assert.ok(teksPanduan(html).includes('tempel atau unggah'), teksPanduan(html));
});

uji('ringkasan pilihan tersusun dari label yang dipilih', () => {
  const m = metaDariPilihan({ konten: 'seleksi', ujian: 'TKA', format: 'scan' });
  assert.ok(m.ringkasan.includes('TKA'), m.ringkasan);
  assert.ok(m.ringkasan.includes('PDF / foto scan buku'), m.ringkasan);
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
