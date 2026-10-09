// tests/naskahSemuaTipe.test.mjs
// ============================================================
// Uji bahwa SEMUA tipe soal mencetak bagian jawabannya
// (src/utils/naskahSoal.js + src/utils/cetakLatihan.js).
//
//     node tests/naskahSemuaTipe.test.mjs
//
// KENAPA INI PENTING
// Tangkapan layar owner 2026-10-09 pada dialog cetak: butir benar/salah
// tercetak HANYA perintahnya — tabel pernyataannya tidak ada, siswa disuruh
// mencentang baris yang tidak pernah tercetak. Owner: "jawaban gak muncul,
// perbaiki kedepannya karena ada jawaban bentuk gambar dll, dan itu tampilan
// penataan berantakan."
//
// Akar: kedua mesin cetak hanya merender `opsiJawaban`. Uji di bawah memaku
// bahwa tiap tipe mencetak bagian jawabannya, bahwa lembar siswa TIDAK
// membocorkan kunci, dan bahwa tinggi blok ikut menghitung baris jawaban
// (kalau tidak, kolom meluber = "penataan berantakan").
// ============================================================
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  butirNaskahHtml,
  kunciButirNaskahHtml,
  estimasiTinggiBlokMm,
  barisBenarSalah,
  isiJawabanNaskah,
  kunciPerBaris,
} from '../src/utils/naskahSoal.js';
import { htmlPaketSiswa, htmlKunciTentor } from '../src/utils/cetakLatihan.js';

const BS = {
  tipe: 'benar_salah',
  soal: 'Bacalah pernyataan-pernyataan berikut, lalu beri tanda centang pada kolom yang sesuai.',
  tabelBenarSalah: [
    { pernyataan: 'Intan dijadikan tema parade karena substansinya cukup terbuka.', kunci: 'benar' },
    { pernyataan: 'Parade drama tidak membutuhkan tema sama sekali.', kunci: 'salah' },
  ],
  kunciJawaban: '',
};
const BS_PERNYATAAN_OBJEK = {
  tipe: 'benar_salah',
  soal: 'Tentukan nilai kebenaran pernyataan berikut.',
  pernyataan: [{ teks: 'Pernyataan satu.', jawaban: 'Benar' }, { teks: 'Pernyataan dua.', jawaban: 'Salah' }],
};
const KOMPLEKS = {
  tipe: 'pg_kompleks',
  soal: 'Pernyataan yang benar tentang senyawa ion adalah ....',
  pernyataan: ['Lelehannya menghantarkan listrik', 'Titik lelehnya umumnya tinggi'],
  kunciJawaban: ['A', 'B'],
};
const JODOH = {
  tipe: 'menjodohkan',
  soal: 'Pasangkan tokoh dengan penemuannya.',
  pasangan: [{ kiri: 'Bohr', kanan: 'Model kulit atom' }, { kiri: 'Rutherford', kanan: 'Inti atom' }],
};
const ISIAN = { tipe: 'isian_singkat', soal: 'Proses perubahan wujud dari padat langsung ke gas disebut ....', kunciJawaban: 'menyublim' };
const ESAI = { tipe: 'esai', soal: 'Jelaskan langkah menentukan volume kubus tanpa rumus jadi.', kunciJawaban: 'rubrik' };

// ------------------------------------------------------------
// 1. Naskah dua kolom: lembar siswa
// ------------------------------------------------------------

test('benar/salah: tabel pernyataan TER CETAK di lembar siswa', () => {
  const html = butirNaskahHtml(BS, 2, 92);
  assert.match(html, /nsk-bs/);
  assert.match(html, /Intan dijadikan tema parade/);
  assert.match(html, /Parade drama tidak membutuhkan tema/);
  assert.match(html, /Benar<\/span><span>Salah/);
});

test('benar/salah: bentuk penyimpanan `pernyataan[{teks,jawaban}]` juga tercetak', () => {
  const html = butirNaskahHtml(BS_PERNYATAAN_OBJEK, 3, 92);
  assert.match(html, /Pernyataan satu\./);
  assert.match(html, /Pernyataan dua\./);
});

test('INVARIAN: lembar siswa benar/salah TIDAK membocorkan kunci', () => {
  const html = butirNaskahHtml(BS, 2, 92);
  assert.ok(!/✓/.test(html), 'kotak centang siswa harus kosong');
  assert.ok(!html.includes('nsk-bs-kotak">benar'), 'nilai kunci tidak boleh masuk lembar siswa');
});

test('lembar kunci benar/salah memuat kunci per baris', () => {
  const html = kunciButirNaskahHtml(BS, 2);
  assert.match(html, /1\. BENAR, 2\. SALAH/i);
});

test('pg_kompleks: pernyataan tercetak sebagai butir berhuruf', () => {
  const html = butirNaskahHtml(KOMPLEKS, 4, 92);
  assert.match(html, /\(A\) /);
  assert.match(html, /Lelehannya menghantarkan listrik/);
});

test('menjodohkan: kolom kiri dan kanan tercetak', () => {
  const html = butirNaskahHtml(JODOH, 5, 92);
  assert.match(html, /nsk-jodoh/);
  assert.match(html, /Bohr/);
  assert.match(html, /Model kulit atom/);
});

test('isian singkat mendapat tempat jawaban; esai mendapat garis', () => {
  assert.match(butirNaskahHtml(ISIAN, 6, 92), /nsk-isian/);
  const esai = butirNaskahHtml(ESAI, 7, 92);
  assert.match(esai, /nsk-esai/);
  assert.equal((esai.match(/<div><\/div>/g) || []).length, 4, 'esai harus punya empat garis jawab');
});

test('pg_sederhana tetap seperti semula (tidak ada tabel aneh)', () => {
  const html = butirNaskahHtml({ tipe: 'pg_sederhana', soal: '2 + 2 =', opsiJawaban: ['3', '4', '5', '6'], kunciJawaban: 'B' }, 8, 92);
  assert.ok(!html.includes('nsk-bs'));
  assert.match(html, /\(B\) 4/);
});

// ------------------------------------------------------------
// 2. Tinggi blok ikut menghitung baris jawaban
// ------------------------------------------------------------

test('INVARIAN: tinggi benar/salah bertambah sesuai jumlah barisnya', () => {
  const dua = estimasiTinggiBlokMm('siswa', BS, 92);
  const lima = estimasiTinggiBlokMm('siswa', { ...BS, tabelBenarSalah: [...BS.tabelBenarSalah, ...BS.tabelBenarSalah, { pernyataan: 'tambahan', kunci: 'benar' }] }, 92);
  assert.ok(lima > dua, `5 baris harus lebih tinggi dari 2 baris (${lima} vs ${dua})`);
});

test('esai ditaksir lebih tinggi daripada isian singkat', () => {
  assert.ok(estimasiTinggiBlokMm('siswa', ESAI, 92) > estimasiTinggiBlokMm('siswa', ISIAN, 92));
});

// ------------------------------------------------------------
// 3. Lembar gunting (cetakLatihan)
// ------------------------------------------------------------

test('lembar siswa mode kotak memuat tabel benar/salah', () => {
  const html = htmlPaketSiswa({ judul: 'Uji' }, [BS], { kertas: 'A4' });
  assert.match(html, /table class="bs"/);
  assert.match(html, /Intan dijadikan tema parade/);
  assert.ok(!/✓/.test(html));
});

test('kunci tentor mode kotak memuat kunci per baris', () => {
  const html = htmlKunciTentor({ judul: 'Uji' }, [BS], { kertas: 'A4' });
  assert.match(html, /1\. BENAR, 2\. SALAH/i);
});

test('lembar siswa mode kotak: menjodohkan & esai tercetak', () => {
  assert.match(htmlPaketSiswa({ judul: 'Uji' }, [JODOH], { kertas: 'A4' }), /class="jodoh"/);
  assert.match(htmlPaketSiswa({ judul: 'Uji' }, [ESAI], { kertas: 'A4' }), /class="esai"/);
});

// ------------------------------------------------------------
// 4. Util pendukung
// ------------------------------------------------------------

test('barisBenarSalah membaca kedua bentuk penyimpanan', () => {
  assert.equal(barisBenarSalah(BS).length, 2);
  assert.equal(barisBenarSalah(BS)[0].kunci, 'benar');
  assert.equal(barisBenarSalah(BS_PERNYATAAN_OBJEK)[1].kunci, 'Salah');
  assert.deepEqual(barisBenarSalah({}), []);
});

test('kunciPerBaris kosong untuk tipe yang tidak butuh', () => {
  assert.equal(kunciPerBaris({ tipe: 'pg_sederhana', kunciJawaban: 'A' }), '');
  assert.equal(kunciPerBaris(null), '');
});

test('isiJawabanNaskah kosong untuk pg_sederhana (opsi sudah cukup)', () => {
  assert.equal(isiJawabanNaskah({ tipe: 'pg_sederhana', opsiJawaban: ['a'] }, 1, 92), '');
});
