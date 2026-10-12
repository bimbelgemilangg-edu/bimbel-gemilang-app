// tests/pembacaTeksSoalTryOut.test.mjs — penjaga: layar ujian wajib pakai pembaca sadar-alias
//     node tests/pembacaTeksSoalTryOut.test.mjs
//
// Lahir dari insiden 2026-10-10: kartu soal di TryOutView menampilkan pilihan
// jawaban TANPA teks soal, karena layarnya membaca `soal || teks_soal` saja
// padahal nama field resmi di KONTRAK-JSON-BANK-SOAL adalah `teksSoal`.
// Butir yang ditulis sesuai kontrak dirender KOSONG di depan siswa.
//
// Kenapa penjaga sumber, bukan test render: repo ini tidak punya test
// komponen (tidak ada jsdom/RTL di dependensi). Membaca sumbernya adalah
// cara termurah memastikan pola yang sudah memakan tiga korban lain
// (mesin cetak, Bersihkan Soal, layar ujian) tidak muncul kembali di
// berkas yang paling kritis: layar ujian siswa.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { teksSoalDari } from '../src/utils/fieldButirSoal.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('pembacaTeksSoalTryOut — layar ujian tidak boleh buta alias');

uji('TryOutView memakai teksSoalDari(), bukan pola alias mentah', () => {
  const src = readFileSync(join(ROOT, 'src/pages/student/tryout/TryOutView.jsx'), 'utf8');
  assert.ok(src.includes("from '../../../utils/fieldButirSoal'"), 'impor fieldButirSoal harus ada');
  assert.ok(src.includes('teksSoalDari(s)'), 'mode tinjau pakai pembaca sadar-alias');
  assert.ok(src.includes('teksSoalDari(soalAktif)'), 'mode pengerjaan pakai pembaca sadar-alias');
  assert.ok(!/teks=\{s\.soal \|\| s\.teks_soal\}/.test(src), 'pola alias mentah mode tinjau harus hilang');
  assert.ok(!/teks=\{soalAktif\.soal \|\| soalAktif\.teks_soal\}/.test(src), 'pola alias mentah mode pengerjaan harus hilang');
});

uji('teksSoalDari mengenal ketiga nama field yang beredar di bank', () => {
  // Lima jalur tulis di repo ini tidak sepakat soal nama field (kepala
  // fieldButirSoal.js). Pembaca wajib mengenal semuanya.
  assert.equal(teksSoalDari({ teksSoal: 'A' }), 'A');
  assert.equal(teksSoalDari({ soal: 'B' }), 'B');
  assert.equal(teksSoalDari({ teks_soal: 'C' }), 'C');
  assert.equal(teksSoalDari({}), '');
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
