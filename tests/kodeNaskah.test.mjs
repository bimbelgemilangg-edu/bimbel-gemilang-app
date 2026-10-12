// tests/kodeNaskah.test.mjs
// Identitas paket pada naskah: kode+logo di pojok atas kop dan di setiap
// kepala seksi (permintaan owner 2026-10-12), tanpa mengubah kotak blok
// yang dipakai estimasi tinggi kolom.
import assert from 'node:assert/strict';
import { kopNaskahHtml } from '../src/utils/naskahSoal.js';
import { judulSeksiHtml } from '../src/utils/seksiNaskahTryOut.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('kop naskah memuat kode paket + logo di pojok atas', () => {
  const h = kopNaskahHtml({ judul: 'Try Out Sabtu', kodePaket: 'GM-SMA-TKA-20261017-0800', jenjangTemplate: 'SMA/MA' }, 'NASKAH SOAL', true);
  assert.ok(h.includes('nsk-kop-kode'), 'chip pojok tidak ada');
  assert.ok(h.includes('GM-SMA-TKA-20261017-0800'), h.slice(0, 200));
  assert.ok(h.includes('<img'), 'logo tidak ada');
});
uji('paket lama tanpa kode tetap mendapat kode ARSIP di kop', () => {
  const h = kopNaskahHtml({ judul: 'X', id: 'zz99', jenjangTemplate: 'SMP/MTs', jenisUjian: 'TKA', createdAt: new Date(2026, 8, 5) }, 'NASKAH', false);
  assert.ok(h.includes('GM-ARSIP-SMP-TKA-20260905-'), h.slice(0, 200));
});
uji('kepala seksi membawa chip kode bila diberikan, polos bila tidak', () => {
  const d = judulSeksiHtml('PENALARAN UMUM', 'GM-UTBK-UTBK-20260103-1305');
  assert.ok(d.includes('nsk-seksi-kode') && d.includes('GM-UTBK-UTBK-20260103-1305'), d);
  assert.equal(judulSeksiHtml('PENALARAN UMUM'), '<div class="nsk-seksi">PENALARAN UMUM</div>');
});
console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
