// tests/cetakLatihan.test.mjs
// ============================================================
// Test mesin cetak paket latihan (src/utils/cetakLatihan.js).
//
//     node tests/cetakLatihan.test.mjs
//
// KENAPA INI PENTING
// Dokumen yang salah cetak biayanya NYATA: kertas, toner, dan waktu
// tentor -- dan satu kebocoran kunci ke lembar siswa merusak satu
// putaran latihan seluruh kelas. Invarian yang paling dijaga di sini:
//   "kunci dan pembahasan TIDAK BOLEH muncul di dokumen siswa"
// dan sebaliknya, lembar kunci wajib memuat peringatan keras.
// ============================================================

import assert from 'node:assert/strict';
import {
  escapeHtml,
  teksKeHtml,
  pilihSoalUntukCetak,
  htmlPaketSiswa,
  htmlKunciTentor,
  htmlLembarCatatan,
} from '../src/utils/cetakLatihan.js';

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

const PAKET = { judul: 'TRYOUT 8 SMP', mapel: 'IPA', targetKelas: '8 SMP', bab: 'Bab 1' };
const SOAL = [
  {
    id: 's1', tipe: 'pg_sederhana', soal: 'Jika $x^2-5x+6=0$, nilai x adalah .... {{GAMBAR}}',
    opsiJawaban: ['1 dan 2', '2 dan 3', '3 dan 4'], kunciJawaban: 'B',
    pembahasan: 'Faktorkan: $(x-2)(x-3)=0$ sehingga x = 2 atau 3.',
    gambarUrls: ['https://contoh.dev/g1.png'],
  },
  {
    id: 's2', tipe: 'pg_kompleks', soal: 'Pernyataan yang benar adalah ....',
    opsiJawaban: ['p', 'q', 'r'], kunciJawaban: ['A', 'C'], pembahasan: 'p dan r benar.',
  },
  { id: 's3', tipe: 'esai', soal: 'Jelaskan proses fotosintesis.', kunciJawaban: '' },
];

console.log('cetakLatihan — mesin cetak paket latihan');

// ============================================================
bagian('1. KEAMANAN CETAK: KUNCI TIDAK BOLEH BOCOR KE SISWA');
// ============================================================

uji('INVARIAN: dokumen siswa tidak memuat kunci, pembahasan, atau peringatan tentor', () => {
  const html = htmlPaketSiswa(PAKET, SOAL);
  assert.ok(!html.includes('Faktorkan'), 'pembahasan bocor ke lembar siswa');
  assert.ok(!html.includes('PEGANGAN TENTOR'), 'kepala kunci bocor ke lembar siswa');
  assert.ok(!/>\s*B\s*</.test(html), 'huruf kunci tampak sebagai konten siswa');
});

uji('dokumen kunci memuat peringatan keras DAN kunci tiap butir', () => {
  const html = htmlKunciTentor(PAKET, SOAL);
  assert.ok(html.includes('PEGANGAN TENTOR — JANGAN DICETAK UNTUK SISWA'));
  assert.ok(html.includes('Kunci:'));
  assert.ok(html.includes('A, C'), 'kunci pg_kompleks tidak tercetak');
  assert.ok(html.includes('Faktorkan'), 'pembahasan tidak tercetak di lembar kunci');
});

uji('lembar catatan punya satu baris per butir + kolom catatan', () => {
  const html = htmlLembarCatatan(PAKET, SOAL);
  const baris = (html.match(/<tr>/g) || []).length;
  assert.equal(baris, SOAL.length + 1, 'baris tabel = soal + header');
  assert.ok(html.includes('Langkah pikir'));
  assert.ok(html.includes('tempel potongan soal di sini'));
});

// ============================================================
bagian('2. ISI & KESELAMATAN HTML');
// ============================================================

uji('escapeHtml menetralkan markup dari bank soal', () => {
  assert.equal(escapeHtml('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
});

uji('rumus $...$ dirender KaTeX, placeholder {{GAMBAR}} dibuang', () => {
  const html = teksKeHtml('Jika $x^2=4$ maka {{GAMBAR}} selesai');
  assert.ok(html.includes('katex'), 'rumus tidak dirender');
  assert.ok(!html.includes('{{GAMBAR}}'), 'placeholder ikut tercetak');
});

uji('teks berbahaya di dalam rumus tidak dieksekusi (throwOnError false)', () => {
  const html = teksKeHtml('$\\frac{1}{0}$ dan $\\unknowncmd{x}$');
  assert.ok(html.length > 0);
  assert.ok(!html.includes('{{'));
});

uji('gambar soal dicetak sebagai <img> terpisah, bukan placeholder', () => {
  const html = htmlPaketSiswa(PAKET, SOAL);
  assert.ok(html.includes('<img class="gbr" src="https://contoh.dev/g1.png"'));
});

uji('opsi jawaban dicetak berhuruf A/B/C', () => {
  const html = htmlPaketSiswa(PAKET, SOAL);
  assert.ok(html.includes('<b>A.</b>'));
  assert.ok(html.includes('<b>C.</b>'));
});

// ============================================================
bagian('3. PEMILIHAN BUTIR');
// ============================================================

uji('maks membatasi jumlah butir', () => {
  assert.equal(pilihSoalUntukCetak(SOAL, { maks: 2 }).length, 2);
});

uji('tanpaEsai membuang esai (tidak cocok untuk lembar gunting)', () => {
  const h = pilihSoalUntukCetak(SOAL, { tanpaEsai: true });
  assert.equal(h.length, 2);
  assert.ok(!h.some((s) => s.tipe === 'esai'));
});

uji('maks 0 / undefined = semua butir; masukan rusak tidak melempar', () => {
  assert.equal(pilihSoalUntukCetak(SOAL, {}).length, 3);
  assert.deepEqual(pilihSoalUntukCetak(null), []);
  assert.deepEqual(pilihSoalUntukCetak(undefined, { maks: 5 }), []);
});

uji('daftar asal TIDAK termutasi (paket dipakai ulang untuk 3 dokumen)', () => {
  const asal = [...SOAL];
  pilihSoalUntukCetak(SOAL, { maks: 1, tanpaEsai: true });
  assert.equal(SOAL.length, asal.length);
});

// ============================================================
bagian('4. TATA LETAK RAMAH KERTAS BEKAS');
// ============================================================

uji('tidak ada background berwarna/abu di CSS cetak (hemat toner, terbaca di atas tinta lama)', () => {
  for (const html of [htmlPaketSiswa(PAKET, SOAL), htmlKunciTentor(PAKET, SOAL), htmlLembarCatatan(PAKET, SOAL)]) {
    assert.ok(!/background:\s*#(?!fff\b)[0-9a-f]{3,6}/i.test(html), 'ada background berwarna di dokumen cetak');
  }
});

uji('setiap butir punya kotak berborder + penanda garis potong', () => {
  const html = htmlPaketSiswa(PAKET, SOAL);
  assert.ok(html.includes('class="kotak"'));
  assert.ok(html.includes('✂'), 'penanda garis potong hilang');
  assert.ok(html.includes('@page'), 'ukuran halaman A4 tidak ditetapkan');
});

uji('kotak soal tidak boleh terbelah antar halaman (page-break-inside avoid)', () => {
  assert.ok(htmlPaketSiswa(PAKET, SOAL).includes('page-break-inside: avoid'));
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
