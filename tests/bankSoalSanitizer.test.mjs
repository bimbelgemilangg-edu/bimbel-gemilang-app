// tests/bankSoalSanitizer.test.mjs
// ============================================================
// Test kontrak JSON bank soal -- gerbang yang dilalui setiap file
// yang diupload di Mesin Bank Soal. Docs resminya:
// docs/KONTRAK-JSON-BANK-SOAL.md
//
// Lahir dari kejadian nyata 2026-10-01: owner mengupload JSON soal
// bergambar dan gambarnya LENYAP di tengah pipeline (normalizeGambar
// membuang field url yang justru dipakai renderer try out).
// ============================================================

import assert from 'node:assert/strict';
import {
  parseAndValidateBankSoalJson,
  validateQuestion,
  TIPE_ENUM,
} from '../src/utils/bankSoalSanitizer.js';

let lulus = 0, gagal = 0;
const kegagalan = [];
function uji(nama, fn) {
  try { fn(); lulus++; console.log(`  ✓ ${nama}`); }
  catch (e) {
    gagal++;
    const p = String(e?.message || e);
    kegagalan.push({ nama, p });
    console.log(`  ✗ ${nama}\n      ${p.split('\n').join('\n      ').slice(0, 300)}`);
  }
}
function bagian(j) { console.log(`\n${j}`); }

console.log('bankSoalSanitizer — test kontrak JSON bank soal');

bagian('bentuk terluar yang diterima');

uji('array langsung diterima', () => {
  const r = parseAndValidateBankSoalJson(JSON.stringify([
    { nomor: 1, tipe: 'pg_sederhana', teksSoal: 'x', opsiJawaban: ['a', 'b'], kunciJawaban: 'A', topik: 't' },
  ]));
  assert.equal(r.success, true);
  assert.equal(r.report.total, 1);
});

uji('objek ber-key questions diterima', () => {
  const r = parseAndValidateBankSoalJson(JSON.stringify({ questions: [
    { nomor: 1, tipe: 'pg_sederhana', teksSoal: 'x', opsiJawaban: ['a'], kunciJawaban: 'A', topik: 't' },
  ] }));
  assert.equal(r.report.total, 1);
});

uji('objek ber-key soal diterima', () => {
  const r = parseAndValidateBankSoalJson(JSON.stringify({ soal: [
    { nomor: 1, tipe: 'pg_sederhana', teksSoal: 'x', opsiJawaban: ['a'], kunciJawaban: 'A', topik: 't' },
  ] }));
  assert.equal(r.report.total, 1);
});

bagian('normalisasi field kontrak');

// 🔥 2026-10-06: kontrak bertambah dari 12 menjadi 14 field dengan masuknya
// pembahasan & pembahasanAsal (paten prompt Gemini). Test ini diperbarui
// SENGAJA: penambahan field aditif, dan kunci ini yang menjaga agar field
// baru tidak hilang lagi diam-diam di kemudian hari.
uji('hasil normalisasi memuat persis 14 field kontrak', () => {
  const { normalized } = validateQuestion({
    nomor: '3', tipe: 'pg_sederhana', teksSoal: ' ber spasi ',
    opsiJawaban: ['A. satu', 'B. dua'], kunciJawaban: 'b', topik: ' Topik ',
  }, 0);
  assert.deepEqual(Object.keys(normalized).sort(), [
    'gambar', 'kunciJawaban', 'nomor', 'opsiJawaban', 'pasangan', 'pembahasan',
    'pembahasanAsal', 'pernyataan', 'subtopik', 'tabelBenarSalah', 'teksSoal',
    'tipe', 'topik', 'topikBaru',
  ].sort());
  assert.equal(normalized.nomor, 3);
  assert.equal(normalized.teksSoal, 'ber spasi');
  assert.equal(normalized.topik, 'Topik');
});

uji('opsiJawaban array of object dinormalkan jadi array of string', () => {
  const { normalized } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'x',
    opsiJawaban: [{ text: 'satu' }, { opsi: 'dua' }, { value: 'tiga' }],
    kunciJawaban: 'A', topik: 't',
  }, 0);
  assert.deepEqual(normalized.opsiJawaban, ['satu', 'dua', 'tiga']);
});

uji('opsi berawalan huruf "A. " TIDAK dibuang otomatis (kontrak: tanpa huruf)', () => {
  // Kontrak menyebut opsi tanpa huruf; kalau AI tetap mengirim pakai huruf,
  // sistem tidak membuangnya diam-diam -- maka dokumen harus tegas.
  const { normalized } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'x', opsiJawaban: ['A. satu'], kunciJawaban: 'A', topik: 't',
  }, 0);
  assert.deepEqual(normalized.opsiJawaban, ['A. satu']);
});

bagian('tipe & peringatan');

uji('tipe tak dikenal jatuh ke pg_sederhana + warning', () => {
  const { normalized, warnings, valid } = validateQuestion({
    tipe: 'pgMulti', teksSoal: 'x', opsiJawaban: ['a'], kunciJawaban: 'A', topik: 't',
  }, 0);
  assert.equal(normalized.tipe, 'pg_sederhana');
  assert.equal(valid, false);
  assert.ok(warnings.some(w => w.includes('pg_sederhana')));
});

uji('enum tipe persis enam nilai (esai masuk 2026-10-04)', () => {
  assert.deepEqual(TIPE_ENUM, [
    'pg_sederhana', 'pg_kompleks', 'benar_salah', 'isian_singkat', 'menjodohkan', 'esai',
  ]);
});

uji('esai tanpa opsiJawaban TIDAK diperingatkan (memang tidak butuh opsi)', () => {
  const { normalized, warnings } = validateQuestion({
    tipe: 'esai', teksSoal: 'Jelaskan proses fotosintesis.',
    kunciJawaban: 'Klorofil menangkap cahaya...', topik: 'Biologi',
  }, 0);
  assert.equal(normalized.tipe, 'esai');
  assert.ok(!warnings.some(w => w.includes('opsiJawaban')));
});

uji('alias lama "uraian" (pipeline HTML Master) disamakan ke esai', () => {
  const { normalized, valid, warnings } = validateQuestion({
    nomor: 19, tipe: 'uraian', teksSoal: 'Jelaskan langkah grafik.',
    kunciJawaban: 'rubrik...', topik: 'SPLDV',
  }, 0);
  assert.deepEqual(warnings, [], 'tidak boleh ada warning sama sekali');
  assert.equal(normalized.tipe, 'esai');
  assert.equal(valid, true, 'uraian dengan rubrik tidak boleh kena warning');
});

uji('esai tanpa kunci/rubrik diperingatkan tapi tetap masuk', () => {
  const { normalized, warnings, valid } = validateQuestion({
    tipe: 'esai', teksSoal: 'Jelaskan.', kunciJawaban: '', topik: 't',
  }, 0);
  assert.equal(normalized.tipe, 'esai');
  assert.equal(valid, false);
  assert.ok(warnings.some(w => w.includes('rubrik')));
});

uji('pg_kompleks tanpa pernyataan diberi warning, tidak dibuang', () => {
  const { valid, warnings } = validateQuestion({
    tipe: 'pg_kompleks', teksSoal: 'x', opsiJawaban: [], pernyataan: [],
    kunciJawaban: ['A'], topik: 't',
  }, 0);
  assert.equal(valid, false);
  assert.ok(warnings.some(w => w.includes('pernyataan')));
});

bagian('GAMBAR (bug nyata 2026-10-01)');

uji('url gambar DIPERTAHANKAN lewat pipeline lengkap', () => {
  const url = 'data:image/png;base64,AAAA';
  const r = parseAndValidateBankSoalJson(JSON.stringify([
    { nomor: 1, tipe: 'pg_sederhana', teksSoal: 'lihat gambar',
      opsiJawaban: ['a'], kunciJawaban: 'A', topik: 't',
      gambar: [{ id: 'GAMBAR_1', deskripsi: 'bangun ruang', url }] },
  ]));
  const g = r.report.hasil[0].gambar;
  assert.equal(g.length, 1);
  assert.equal(g[0].url, url, 'url gambar lenyap di normalizer -- renderer try out tidak akan pernah melihatnya');
});

uji('gambar berupa string polos diperlakukan sebagai url', () => {
  const { normalized } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'x', opsiJawaban: ['a'], kunciJawaban: 'A',
    topik: 't', gambar: ['https://contoh.dev/g.png'],
  }, 0);
  assert.equal(normalized.gambar[0].url, 'https://contoh.dev/g.png');
});

uji('placeholder {{GAMBAR_n}} tanpa pasangan diberi warning', () => {
  const { warnings } = validateQuestion({
    tipe: 'pg_sederhana', teksSoal: 'perhatikan {{GAMBAR_2}}', opsiJawaban: ['a'],
    kunciJawaban: 'A', topik: 't', gambar: [{ id: 'GAMBAR_1', url: 'u' }],
  }, 0);
  assert.ok(warnings.some(w => w.includes('GAMBAR_2')));
});

bagian('latex & teks');

uji('backslash ganda di FILE JSON menjadi backslash tunggal di nilai', () => {
  // Di teks berkas: "\\\\frac" (dua backslash) -- penulisan SAH menurut JSON.
  // Nilai hasil parse harus satu backslash: itulah yang KaTeX butuhkan.
  const raw = '[{"nomor":1,"tipe":"pg_sederhana","teksSoal":"Volume $\\\\frac{1}{2}$ bola",'
    + '"opsiJawaban":["a"],"kunciJawaban":"A","topik":"t"}]';
  const r = parseAndValidateBankSoalJson(raw);
  assert.equal(r.report.hasil[0].teksSoal, 'Volume $\\frac{1}{2}$ bola');
});

uji('backslash TUNGGAL di file (kesalahan umum AI) diselamatkan sanitize', () => {
  // "\frac" satu backslash di teks = escape tidak sah menurut JSON.
  // Lapis sanitizeRawJsonText harus menggandakannya sehingga soal tetap
  // masuk dengan LaTeX utuh, bukan gagal total atau rusak diam-diam.
  const raw = '[{"nomor":1,"tipe":"pg_sederhana","teksSoal":"Hitung $\\frac{3}{4}$",'
    + '"opsiJawaban":["a"],"kunciJawaban":"A","topik":"t"}]';
  const r = parseAndValidateBankSoalJson(raw);
  assert.equal(r.success, true);
  assert.equal(r.report.hasil[0].teksSoal, 'Hitung $\\frac{3}{4}$');
});

uji('PATEN 2026-10-06: pembahasan & pengakuan penalaran ikut kontrak, tidak dibuang', () => {
  const { normalized } = validateQuestion({
    nomor: 1, tipe: 'pg_sederhana', teksSoal: 'Soal', opsiJawaban: ['a', 'b'],
    kunciJawaban: 'A', topik: 't',
    pembahasan: 'Karena A benar.', pembahasan_asal: 'penalaran',
  });
  assert.equal(normalized.pembahasan, 'Karena A benar.');
  assert.equal(normalized.pembahasanAsal, 'penalaran');
});

uji('berkas lama TANPA pembahasan tetap lolos (kontrak aditif, bukan merusak)', () => {
  const { normalized, warnings } = validateQuestion({
    nomor: 2, tipe: 'pg_sederhana', teksSoal: 'Soal lama', opsiJawaban: ['a', 'b'],
    kunciJawaban: 'B', topik: 't',
  });
  assert.equal(normalized.pembahasan, '');
  assert.equal(normalized.pembahasanAsal, 'tercetak');
  assert.ok(!warnings.some((w) => w.includes('pembahasan')), 'berkas lama tidak boleh dihukum');
});

console.log(`\n${'='.repeat(56)}\n  LULUS : ${lulus}\n  GAGAL : ${gagal}\n${'='.repeat(56)}`);
if (gagal > 0) {
  kegagalan.forEach((k, i) => console.log(`  ${i + 1}. ${k.nama}`));
  process.exit(1);
}
console.log('\n✅ Semua test lulus.');
