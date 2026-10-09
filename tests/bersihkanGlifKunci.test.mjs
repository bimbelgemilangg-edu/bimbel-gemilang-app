// tests/bersihkanGlifKunci.test.mjs
// ============================================================
// Uji: PELEPAS GLIF PENANDA KUNCI (☑/☐/...) DARI TEKS OPSI
//
//     node tests/bersihkanGlifKunci.test.mjs
//
// KENAPA INI PENTING
// Tangkapan layar owner 2026-10-09 (build 35f7c0d): lembar cetak
// pg_kompleks menampilkan kotak SUDAH TERCENTANG pada opsi yang
// benar -- kunci jawaban bocor ke lembar siswa. Akar masalahnya di
// DATA: 23 butir aktif menyimpan glif ☑/☐ di awal teks opsinya
// (warisan dokumen sumber), dan 23/23 pola centangnya sama persis
// dengan field kunciJawaban. Uji ini mengunci tiga pagar:
//   1. glif penanda dilepas di semua lapisan tampil & impor;
//   2. glif SAHIH di tengah kalimat (materi tentang tanda centang)
//      TIDAK disentuh;
//   3. lembar cetak pg_kompleks menyediakan kotak KOSONG sendiri,
//      jadi format centang siswa tetap jelas walau datanya kotor.
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  RE_PENANDA_KUNCI_AWAL,
  bawaPenandaKunciOpsi,
  bersihkanTeksOpsi,
  daftarOpsiBersih,
  opsiTampilDari,
  soalBawaPenandaKunci,
} from '../src/utils/bersihkanGlifKunci.js';
import { GAYA_NASKAH, butirNaskahHtml, isiJawabanNaskah } from '../src/utils/naskahSoal.js';
import { validateQuestion } from '../src/utils/bankSoalSanitizer.js';
import { deteksiSoalRusak } from '../src/utils/auditIdentitasSoal.js';

// Bentuk persis butir produksi MUSUq9V33B7dGTGNBtw3 (butir nomor 6 di
// tangkapan layar owner) -- dipangkas secukupnya untuk uji.
const BUTIR_KOTOR = {
  tipe: 'pg_kompleks',
  teksSoal: '"Sekolah perlu menerapkan kebijakan anti-perundungan..." Penulisan ejaan kalimat tersebut tidak tepat karena...',
  opsiJawaban: [
    { teks: '☑ Menggunakan bentuk terikat yang salah', gambar: [], tabel: [] },
    { teks: '☐ Menggunakan tanda baca koma yang salah', gambar: [], tabel: [] },
    { teks: '☐ Menggunakan kata hubung yang tidak sesuai', gambar: [], tabel: [] },
    { teks: '☑ Menggunakan imbuhan yang tidak sejajar', gambar: [], tabel: [] },
    { teks: '☑ Menggunakan huruf kapital yang salah', gambar: [], tabel: [] },
  ],
  kunciJawaban: ['A', 'D', 'E'],
};

// Butir SAHIH yang membahas tanda centang sebagai MATERI (produksi
// SxzAjmWxi10CYYm8ttrl): glif ✓ ada di TENGAH kalimat, bukan penanda.
const TEKS_SAHIH = 'Tanda silang merah (×) pada poster melambangkan perilaku yang tidak boleh ditiru, sedangkan tanda centang hijau (✓) melambangkan perilaku yang benar.';

test('glif penanda di awal teks dilepas, isi teks utuh', () => {
  assert.equal(bersihkanTeksOpsi('☑ Menggunakan bentuk terikat yang salah'), 'Menggunakan bentuk terikat yang salah');
  assert.equal(bersihkanTeksOpsi('☐ Menggunakan tanda baca koma yang salah'), 'Menggunakan tanda baca koma yang salah');
  assert.equal(bersihkanTeksOpsi('✅ Opsi dengan centang emoji'), 'Opsi dengan centang emoji');
  assert.equal(bersihkanTeksOpsi('☑️ Opsi centang + variation selector'), 'Opsi centang + variation selector');
  assert.equal(bersihkanTeksOpsi('  ☐☐ ganda ber_spasi'), 'ganda ber_spasi');
  assert.equal(bersihkanTeksOpsi('✔ Opsi tanda centang'), 'Opsi tanda centang');
});

test('teks tanpa penanda awal tidak berubah sedikitpun', () => {
  assert.equal(bersihkanTeksOpsi('Opsi bersih biasa'), 'Opsi bersih biasa');
  assert.equal(bersihkanTeksOpsi(''), '');
  assert.equal(bersihkanTeksOpsi(TEKS_SAHIH), TEKS_SAHIH, 'glif di tengah kalimat adalah materi, bukan penanda');
  assert.equal(bersihkanTeksOpsi('A. Jakarta'), 'A. Jakarta');
  assert.equal(bersihkanTeksOpsi(null), '');
  assert.equal(bersihkanTeksOpsi(undefined), '');
});

test('detektor menandai butir kotor & membebaskan butir sahih', () => {
  assert.equal(bawaPenandaKunciOpsi('☑ Teks'), true);
  assert.equal(bawaPenandaKunciOpsi('Teks ☑'), false, 'glif di belakang bukan penanda kunci');
  assert.equal(bawaPenandaKunciOpsi(TEKS_SAHIH), false);
  assert.equal(soalBawaPenandaKunci(BUTIR_KOTOR), true);
  assert.equal(soalBawaPenandaKunci({ opsiJawaban: ['a', 'b'] }), false);
  assert.equal(soalBawaPenandaKunci({}), false);
  assert.equal(soalBawaPenandaKunci(null), false);
});

test('bukti kebocoran: pola centang data kotor == kunci jawabannya', () => {
  const dariGlif = BUTIR_KOTOR.opsiJawaban
    .map((o, i) => (RE_PENANDA_KUNCI_AWAL.test(o.teks) && o.teks.trim().startsWith('☑') ? String.fromCharCode(65 + i) : null))
    .filter(Boolean);
  assert.deepEqual(dariGlif, BUTIR_KOTOR.kunciJawaban, 'centang bawaan data persis sama dengan kunci = bocor');
});

test('opsiTampilDari: glif lepas, gambar & tabel tetap utuh', () => {
  const soal = {
    opsiJawaban: [
      { teks: '☑ satu', gambar: [{ url: 'https://x/y.png' }], tabel: [] },
      '☐ dua',
      42,
    ],
  };
  const tampil = opsiTampilDari(soal);
  assert.equal(tampil[0].teks, 'satu');
  assert.deepEqual(tampil[0].gambar, [{ url: 'https://x/y.png' }]);
  assert.equal(tampil[1], 'dua');
  assert.equal(tampil[2], '42');
  assert.deepEqual(daftarOpsiBersih(BUTIR_KOTOR), [
    'Menggunakan bentuk terikat yang salah',
    'Menggunakan tanda baca koma yang salah',
    'Menggunakan kata hubung yang tidak sesuai',
    'Menggunakan imbuhan yang tidak sejajar',
    'Menggunakan huruf kapital yang salah',
  ]);
});

test('cetak: lembar pg_kompleks BERSIH dari glif & punya kotak kosong sendiri', () => {
  const html = butirNaskahHtml(BUTIR_KOTOR, 6, 90);
  assert.ok(!html.includes('☑'), 'kotak tercentang tidak boleh ikut tercetak');
  assert.ok(!html.includes('☐'), 'kotak bawaan data tidak boleh ikut tercetak');
  assert.equal(html.match(/nsk-kotak-centang/g).length, 5, 'tiap pilihan mendapat kotak kosong dari mesin cetak');
  assert.ok(html.includes('(A) Menggunakan bentuk terikat yang salah'), 'teks opsi tetap terbaca setelah glif lepas');
  assert.ok(GAYA_NASKAH.includes('.nsk-kotak-centang'), 'CSS kotak centang terdaftar di GAYA_NASKAH');
});

test('cetak: tipe lain tidak mendapat kotak centang & pg_kompleks ber-pernyataan tidak dobel', () => {
  const pg = butirNaskahHtml({ tipe: 'pg_sederhana', teksSoal: 'Soal biasa.', opsiJawaban: ['a', 'b', 'c', 'd'], kunciJawaban: 'A' }, 1, 90);
  assert.ok(!pg.includes('nsk-kotak-centang'), 'pg_sederhana tetap tanpa kotak centang');
  const dgnPernyataan = {
    tipe: 'pg_kompleks',
    teksSoal: 'Centang pernyataan yang benar.',
    opsiJawaban: ['☑ pengalih', '☐ pengalih kedua'],
    pernyataan: ['☑ pernyataan satu', '☐ pernyataan dua'],
    kunciJawaban: ['A'],
  };
  const html = butirNaskahHtml(dgnPernyataan, 2, 90);
  assert.equal(html.match(/nsk-kotak-centang/g).length, 2, 'kotak hanya di permukaan centang (pernyataan), tidak dobel di opsi');
  assert.ok(!html.includes('☑'));
  const isi = isiJawabanNaskah(dgnPernyataan, 2, 90);
  assert.equal(isi.match(/nsk-kotak-centang/g).length, 2);
});

test('pintu impor: sanitizer melepas glif sebelum masuk bank', () => {
  const { normalized } = validateQuestion({
    nomor: 1,
    tipe: 'pg_kompleks',
    teksSoal: 'Manakah yang benar?',
    opsiJawaban: ['☑ satu', '☐ dua', '☑ tiga'],
    kunciJawaban: ['A', 'C'],
    topik: 'Uji',
  }, 0);
  assert.deepEqual(normalized.opsiJawaban, ['satu', 'dua', 'tiga']);
});

test('audit: butir penanda kunci masuk daftar perluDicek, bukan rusak', () => {
  const { perluDicek, rusak } = deteksiSoalRusak({ ...BUTIR_KOTOR, teksSoal: BUTIR_KOTOR.teksSoal, topik: 'Uji' });
  assert.ok(perluDicek.some((p) => p.includes('penanda kunci')), 'owner harus melihatnya di halaman audit');
  assert.ok(!rusak.some((r) => r.includes('penanda kunci')), 'ini bukan alasan hapus/bersihkan soal');
});
