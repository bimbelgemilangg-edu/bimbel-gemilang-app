// tests/asalPembahasan.test.mjs
// ============================================================
// Test pembaca asal pembahasan (src/utils/asalPembahasan.js).
//
//     node tests/asalPembahasan.test.mjs
//
// KENAPA INI PENTING
// Tidak semua soal punya pembahasan tercetak, dan pembahasan karangan AI
// yang TIDAK DIAKUI adalah bentuk paling halus dari soal bohong: guru
// membacanya sebagai penjelasan buku, siswa menghafal penalaran yang
// mungkin salah. Pintu prompt paten sudah mewajibkan pengakuan asal;
// util ini membawa kejujuran yang sama ke pintu master. Yang dikunci:
// penanda selalu menang atas meta yang bertentangan, dan penanda tidak
// boleh bocor ke teks yang dibaca manusia.
// ============================================================

import assert from 'node:assert/strict';
import { PENANDA_PENALARAN, deteksiAsalPembahasan } from '../src/utils/asalPembahasan.js';

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

uji('tanpa penanda & tanpa meta -> tercetak, teks utuh', () => {
  const r = deteksiAsalPembahasan({ pembahasan: 'SNMPTN 2012/TPA/213/24\nPremis 1: p>q\nJawaban B' });
  assert.equal(r.asal, 'tercetak');
  assert.equal(r.teksBersih, 'SNMPTN 2012/TPA/213/24\nPremis 1: p>q\nJawaban B');
  assert.equal(r.adaPenanda, false);
});

uji('penanda dibaca sebagai penalaran DAN dibuang dari teks bacaan', () => {
  const r = deteksiAsalPembahasan({ pembahasan: `${PENANDA_PENALARAN}\nKarena Bambang mengikuti karate, ia tidak mengikuti musik.` });
  assert.equal(r.asal, 'penalaran');
  assert.equal(r.adaPenanda, true);
  assert.ok(!r.teksBersih.includes('PENALARAN'), `penanda bocor ke teks: ${r.teksBersih}`);
  assert.ok(r.teksBersih.startsWith('Karena Bambang'), r.teksBersih);
});

uji('meta eksplisit penalaran tanpa penanda tetap diakui', () => {
  const r = deteksiAsalPembahasan({ pembahasan: 'Penjelasan tertulis.', asalEksplisit: 'penalaran' });
  assert.equal(r.asal, 'penalaran');
  assert.equal(r.teksBersih, 'Penjelasan tertulis.');
});

uji('meta mengaku tercetak TAPI penanda ada -> penanda menang (sisi hati-hati)', () => {
  const r = deteksiAsalPembahasan({ pembahasan: `${PENANDA_PENALARAN} penjelasan`, asalEksplisit: 'tercetak' });
  assert.equal(r.asal, 'penalaran', 'pengakuan tercetak tidak boleh menutupi penanda');
});

uji('pembahasan kosong tidak dituduh penalaran (urusan sinyal halaman)', () => {
  const r = deteksiAsalPembahasan({ pembahasan: '' });
  assert.equal(r.asal, 'tercetak');
  assert.equal(r.teksBersih, '');
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
