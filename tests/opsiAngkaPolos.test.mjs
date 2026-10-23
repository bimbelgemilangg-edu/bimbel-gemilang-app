// tests/opsiAngkaPolos.test.mjs
// ============================================================
// Test regresi INSIDEN 2026-10-23: opsi jawaban berupa angka polos
// ("15", "27", "243") dan frasa pendek miskin vokal ("7 rak") terhapus
// oleh pembersih OCR/artefak, sehingga soal UTUH ditolak importer dengan
// "Pilihan jawaban kurang dari 2".
//
//     node tests/opsiAngkaPolos.test.mjs
//
// KENAPA INI PENTING
// Fixture di bawah dikutip apa adanya dari berkas HTML keluaran Gemini
// yang dikirim owner 2026-10-23 (391 soal matematika kelas 9 lewat
// /admin/bank-soal/import). 54 dari 391 soal tertolak padahal HTML-nya
// utuh: 50 soal kehilangan SELURUH opsinya, 4 soal sisanya kehilangan
// tiga dari empat. Akar masalahnya ada di DUA pembersih yang berlaku
// ganda untuk teks soal DAN opsi:
//
//   1. bersihkanOcr.js   -- RE_NOMOR_YATIM menganggap baris "15" sebagai
//      nomor halaman yatim; barisGarbar menganggap "7 rak" (rasio vokal
//      0.33, huruf <= 4) sebagai rácak kolom OCR.
//   2. bersihkanArtefakScan.js -- RE_BARIS_NOMOR menganggap "243" sebagai
//      nomor urut kolom sebelah yang lepas.
//
// Untuk TEKS SOAL hasil scan murni, aturan-aturan itu BENAR dan harus
// tetap hidup. Untuk OPSI JAWABAN, baris angka polos ADALAH ISI SAH
// pilihan ganda matematika. Pemisahnya: flag `untukOpsi`.
//
// Test ini memaku DUA arah sekaligus: opsi angka polos selamat, DAN
// pembersih artefak untuk teks soal tidak ikut melunak.
// ============================================================

import assert from 'node:assert/strict';
import { bersihkanOcrTeks } from '../src/utils/bersihkanOcr.js';
import {
  bersihkanArtefakTeks,
  bersihkanArtefakSoal,
} from '../src/utils/bersihkanArtefakScan.js';

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus += 1; console.log('ok ' + lulus + ' - ' + nama); }
  catch (e) { gagal += 1; console.log('not ok ' + (lulus + gagal) + ' - ' + nama); console.log('  ' + e.message); }
}

// ------------------------------------------------------------
// 1. OPSI: angka polos selamat di kedua pembersih
//    (fixture: soal 3 & 13 berkas owner 2026-10-23)
// ------------------------------------------------------------
const OPSI_ANGKA = ['15', '27', '243', '729', '9', '18', '81', '24', '8', '16', '32'];

for (const t of OPSI_ANGKA) {
  uji(`bersihkanOcrTeks(untukOpsi) mempertahankan opsi angka polos "${t}"`, () => {
    assert.equal(bersihkanOcrTeks(t, { untukOpsi: true }).teks, t);
  });
  uji(`bersihkanArtefakTeks(untukOpsi) mempertahankan opsi angka polos "${t}"`, () => {
    assert.equal(bersihkanArtefakTeks(t, { untukOpsi: true }), t);
  });
}

// ------------------------------------------------------------
// 2. OPSI: frasa pendek miskin vokal selamat (kasus "rak")
//    fixture: soal nomor 3 paket 3 berkas owner -- keempat opsinya
//    dulu terhapus semua oleh barisGarbar (rasio vokal 1/3 < 0.34)
// ------------------------------------------------------------
for (const t of ['7 rak', '9 rak', '14 rak', '21 rak', '12 cm', '3 m/s']) {
  uji(`opsi pendek miskin vokal "${t}" tidak lagi dibuang barisGarbar`, () => {
    const r = bersihkanOcrTeks(t, { untukOpsi: true });
    assert.equal(r.teks, t);
  });
}

// Opsi yang ragu tetap DICATAT supaya admin melihatnya di preview,
// walau tidak dibuang -- filosofi repo: jangan buang diam-diam.
uji('opsi yang dicurigai tetap meninggalkan catatan, bukan dibuang diam-diam', () => {
  const r = bersihkanOcrTeks('7 rak', { untukOpsi: true });
  assert.ok(r.catatan.length > 0, 'seharusnya ada catatan kualitas');
  assert.match(r.catatan.join(' '), /DIPERTAHANKAN/i);
});

// ------------------------------------------------------------
// 3. OPSI: sampah yang MUSTAHIL jadi isi pilihan TETAP dibuang
// ------------------------------------------------------------
uji('penanda halaman tetap dibuang walau untukOpsi', () => {
  assert.equal(bersihkanOcrTeks('=== PAGE 3 COL 2 ===', { untukOpsi: true }).teks, '');
  assert.equal(bersihkanArtefakTeks('=== PAGE 8 COL 2 ===', { untukOpsi: true }), '');
});
uji('slogan buku tetap dibuang walau untukOpsi', () => {
  assert.equal(bersihkanOcrTeks('BELAJAR MINIMAL', { untukOpsi: true }).teks, '');
});
uji('garis sampah pemisah kolom tetap dibuang walau untukOpsi', () => {
  assert.equal(bersihkanArtefakTeks('————EEE', { untukOpsi: true }), '');
});

// ------------------------------------------------------------
// 4. TEKS SOAL: pembersih TIDAK ikut melunak (arah sebaliknya)
//    Nomor halaman yatim & nomor urut kolom lepas harus tetap
//    hilang dari teks soal, persis seperti sebelum insiden.
// ------------------------------------------------------------
uji('teks soal: baris angka polos tetap dibuang (tanpa flag)', () => {
  assert.equal(bersihkanOcrTeks('15').teks, '');
  assert.equal(bersihkanArtefakTeks('243'), '');
});
uji('teks soal: nomor urut kolom lepas tetap dibuang (tanpa flag)', () => {
  const t = 'Perhatikan pernyataan berikut.\n12.\n13.\nManakah yang benar?';
  // Baris yang dibuang jadi baris kosong (bukan hilang tanpa jejak baris);
  // yang penting ANGKAnya tidak lagi menempel di teks soal.
  const r = bersihkanArtefakTeks(t);
  assert.ok(!/\d/.test(r), 'angka nomor urut tidak boleh tersisa: ' + r);
  assert.match(r, /Perhatikan pernyataan berikut\./);
  assert.match(r, /Manakah yang benar\?/);
});
uji('bersihkanArtefakSoal: teks_soal dibersihkan tapi opsi_jawaban utuh', () => {
  const q = {
    teks_soal: 'Hasil dari 3³×3²=...\n27.',
    opsi_jawaban: [{ teks: '15' }, { teks: '27' }, { teks: '243' }, { teks: '729' }],
  };
  const r = bersihkanArtefakSoal(q);
  assert.equal(r.teks_soal, 'Hasil dari 3³×3²=...');
  assert.deepEqual(r.opsi_jawaban.map((o) => o.teks), ['15', '27', '243', '729']);
});

// ------------------------------------------------------------
// 5. Kontrak lama yang tidak boleh berubah: tanpa flag, perilaku
//    pembersih IDENTIK dengan sebelum insiden (opsi string polos
//    lewat bersihkanArtefakSoal tetap dibersihkan selayaknya teks).
// ------------------------------------------------------------
uji('opsi berupa string tetap didukung bersihkanArtefakSoal', () => {
  const r = bersihkanArtefakSoal({ opsi_jawaban: ['=== PAGE 2 COL 1 === 5', '6', '7', '8'] });
  assert.equal(r.opsi_jawaban.length, 4);
  assert.equal(r.opsi_jawaban[1], '6');
});

console.log('');
console.log(`# opsiAngkaPolos: ${lulus} lulus, ${gagal} gagal`);
if (gagal > 0) process.exit(1);
