// tests/modelPilih.test.mjs
// ============================================================
// Test logika murni mode "pilih-dari-bank" (lib/modelPilih.js) —
// AI pemilih soal untuk mesin try out otomatis Sabtu.
//
//     node tests/modelPilih.test.mjs
//
// KENAPA INI PENTING (bug nyata 2026-10-13)
// Handler versi pertama merakit panggilan AI sendiri: model default
// 'gemini-2.5-flash' yang sudah DITUTUP Google untuk akun baru (404),
// dan balasan error provider ditelan — handler tetap menjawab 200 tanpa
// "pilihan" dan tanpa "error". Mesin lalu jatuh ke pemilihan deterministik
// dengan alasan generik, dan admin tidak bisa tahu sebabnya. Test ini
// mengunci tiga janji: (1) rantai model SELALU berujung ke model terbukti,
// (2) balasan AI yang rusak SELALU menghasilkan teks error bernama,
// (3) exception provider SELALU bisa diringkas jadi satu baris jujur.
// ============================================================

import assert from 'node:assert/strict';
import { rantaiModelPilih, uraiBalasanPilihAi, teksErrorAi } from '../lib/modelPilih.js';

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

console.log('modelPilih — rantai model & kejujuran error AI pemilih soal');

const BAWAAN = 'gemini-3.6-flash';
const CADANGAN = ['gemini-3.5-flash-lite'];

// ============================================================
bagian('1. RANTAI MODEL: TIDAK BOLEH ADA JALAN KE MODEL MATI');
// ============================================================

uji('REGRESI 2026-10-13: env kosong → model endpoint terbukti yang dipakai, bukan gemini-2.5-flash', () => {
  const rantai = rantaiModelPilih({}, BAWAAN, CADANGAN);
  assert.deepEqual(rantai, ['gemini-3.6-flash', 'gemini-3.5-flash-lite']);
  assert.ok(!rantai.some((m) => m.includes('2.5')), 'model 2.5 (ditutup untuk akun baru) tidak boleh muncul');
});

uji('GEMINI_MODEL_PILIH menang atas semua (override khusus pemilih)', () => {
  const env = { GEMINI_MODEL_PILIH: 'model-pilih', GEMINI_MODEL: 'model-umum', AI_MODEL: 'model-ai' };
  assert.equal(rantaiModelPilih(env, BAWAAN, CADANGAN)[0], 'model-pilih');
});

uji('urutan hormat: PILIH → GEMINI_MODEL → AI_MODEL → bawaan', () => {
  assert.equal(rantaiModelPilih({ GEMINI_MODEL: 'gm', AI_MODEL: 'am' }, BAWAAN, CADANGAN)[0], 'gm');
  assert.equal(rantaiModelPilih({ AI_MODEL: 'am' }, BAWAAN, CADANGAN)[0], 'am');
});

uji('cadangan endpoint selalu menempel di belakang model utama', () => {
  const rantai = rantaiModelPilih({ GEMINI_MODEL_PILIH: 'model-pilih' }, BAWAAN, CADANGAN);
  assert.deepEqual(rantai, ['model-pilih', 'gemini-3.5-flash-lite']);
});

uji('duplikat dibuang, urutan dipertahankan (override = salah satu cadangan)', () => {
  const rantai = rantaiModelPilih({ GEMINI_MODEL_PILIH: 'gemini-3.5-flash-lite' }, BAWAAN, CADANGAN);
  assert.deepEqual(rantai, ['gemini-3.5-flash-lite']);
});

uji('nilai env berisi spasi/kosong dianggap tidak ada (trim)', () => {
  const rantai = rantaiModelPilih({ GEMINI_MODEL_PILIH: '  ', GEMINI_MODEL: ' model-rapi ' }, BAWAAN, CADANGAN);
  assert.deepEqual(rantai, ['model-rapi', 'gemini-3.5-flash-lite']);
});

uji('INVARIAN: rantai tidak pernah kosong dan tanpa entri kosong', () => {
  for (const env of [{}, { GEMINI_MODEL_PILIH: '' }, { AI_MODEL: 'x' }]) {
    const rantai = rantaiModelPilih(env, BAWAAN, CADANGAN);
    assert.ok(rantai.length >= 1, 'minimal satu model untuk dicoba');
    assert.ok(rantai.every((m) => typeof m === 'string' && m.trim() === m && m !== ''));
  }
});

// ============================================================
bagian('2. BALASAN AI RUSAK WAJIB BERSUARA (tidak pernah 200-bisu)');
// ============================================================

uji('JSON valid lolos apa adanya', () => {
  const { parsed, error } = uraiBalasanPilihAi('{"pilihan":[{"id":"a","alasan":"x"}],"ragu":[]}');
  assert.equal(error, null);
  assert.deepEqual(parsed.pilihan, [{ id: 'a', alasan: 'x' }]);
});

uji('JSON terbungkus kalimat/markdown tetap terbaca', () => {
  const { parsed, error } = uraiBalasanPilihAi('Baik, ini hasilnya:\n```json\n{"pilihan":[{"id":"b"}]}\n```');
  assert.equal(error, null);
  assert.equal(parsed.pilihan[0].id, 'b');
});

uji('balasan kosong → error bernama', () => {
  const { parsed, error } = uraiBalasanPilihAi('');
  assert.equal(parsed, null);
  assert.match(error, /kosong/i);
});

uji('balasan tanpa JSON → error menyebut potongan awal (jejak untuk admin)', () => {
  const { parsed, error } = uraiBalasanPilihAi('Maaf, saya tidak bisa membantu dengan itu.');
  assert.equal(parsed, null);
  assert.match(error, /tidak memuat JSON/);
  assert.match(error, /Maaf, saya/);
});

uji('JSON cacat → error "gagal dibaca", bukan exception melempar', () => {
  const { parsed, error } = uraiBalasanPilihAi('{"pilihan": [{"id": }');
  assert.equal(parsed, null);
  assert.match(error, /gagal dibaca/);
});

uji('JSON tanpa field pilihan / pilihan bukan array → error kontrak', () => {
  for (const teks of ['{"ragu":[]}', '{"pilihan":"a,b"}', '{"pilihan":null}', '{"x":1}']) {
    const { parsed, error } = uraiBalasanPilihAi(teks);
    assert.equal(parsed, null);
    assert.match(error, /pilihan/);
  }
});

uji('INVARIAN: parsed dan error tidak pernah dua-duanya terisi/kosong', () => {
  for (const teks of ['{"pilihan":[]}', 'bukan json', '', '{"pilihan":5}']) {
    const { parsed, error } = uraiBalasanPilihAi(teks);
    assert.ok((parsed === null) !== (error === null), `hasil harus eksklusif untuk: ${teks}`);
  }
});

// ============================================================
bagian('3. EXCEPTION PROVIDER → SATU BARIS JUJUR UNTUK LOG DRAF');
// ============================================================

uji('error provider 404 memuat model, status, dan pesan Google', () => {
  const e = new Error('AI provider HTTP 404');
  e.providerStatus = 404;
  e.providerMessage = 'Model `gemini-2.5-flash` is not found for project';
  e.attemptedModel = 'gemini-2.5-flash';
  const teks = teksErrorAi(e);
  assert.match(teks, /model=gemini-2\.5-flash/);
  assert.match(teks, /HTTP 404/);
  assert.match(teks, /not found/);
});

uji('timeout terbaca sebagai timeout', () => {
  const e = new Error('Layanan AI timeout setelah 30000ms.');
  e.code = 'AI_TIMEOUT';
  assert.match(teksErrorAi(e), /timeout/i);
});

uji('Error polos tetap menghasilkan pesannya', () => {
  assert.match(teksErrorAi(new Error('jaringan putus')), /jaringan putus/);
});

uji('null/undefined → pesan default, tidak pernah string kosong', () => {
  assert.equal(teksErrorAi(null), 'AI gagal tanpa pesan');
  assert.equal(teksErrorAi(undefined), 'AI gagal tanpa pesan');
});

uji('pesan multi-baris dirapikan jadi satu baris dan dipotong <= 240', () => {
  const e = new Error('x');
  e.providerMessage = 'baris1\nbaris2   ' + 'A'.repeat(400);
  const teks = teksErrorAi(e);
  assert.ok(!teks.includes('\n'), 'log draf satu baris');
  assert.ok(teks.length <= 240, `kepanjangan: ${teks.length}`);
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
