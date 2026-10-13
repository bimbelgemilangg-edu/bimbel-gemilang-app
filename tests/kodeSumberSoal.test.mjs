// tests/kodeSumberSoal.test.mjs
// ============================================================
// Test pendeteksi pembahasan tertukar (src/utils/kodeSumberSoal.js).
//
//     node tests/kodeSumberSoal.test.mjs
//
// KENAPA INI PENTING
// Sampel nyata owner 2026-10-11 ("02 Silogisme", 40 soal) memuat
// pembahasan yang BERPUTAR antar nomor: soal 31 berkode GEL.2/63 mendapat
// pembahasan berkepala GEL.2/69, soal 32 (.../65) mendapat .../63, soal
// 33 (.../69) mendapat .../65. Tidak ada yang menangkapnya: prompt tidak
// menyuruh model memverifikasi, importer tidak memeriksa. Siswa yang
// belajar dari penjelasan nomor lain lebih rugi daripada siswa tanpa
// penjelasan -- yang satu bingung, yang lain yakin pada yang salah.
// Fixture di bawah dikutip dari berkas itu.
// ============================================================

import assert from 'node:assert/strict';
import { ekstrakKodeSumber, cocokKodePembahasan, pesanPembahasanTertukar } from '../src/utils/kodeSumberSoal.js';

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

uji('kode sumber diekstrak dari teks soal & pembahasan', () => {
  assert.equal(
    ekstrakKodeSumber('<p><strong>[UTBK2024/TPS/PU/GEL.2/63]</strong></p>\nEksploitasi minyak...'),
    'UTBK2024/TPS/PU/GEL.2/63',
  );
  assert.equal(
    ekstrakKodeSumber('UTBK2024/TPS/PU/GEL.2/69\nANCOMNPUA wr me wat'),
    'UTBK2024/TPS/PU/GEL.2/69',
  );
});

uji('spasi OCR tidak mengubah sidik jari ("UTBK 2025" == "UTBK2025")', () => {
  assert.equal(ekstrakKodeSumber('[UTBK 2025/TPS/PU/08]'), ekstrakKodeSumber('[UTBK2025/TPS/PU/08]'));
});

uji('teks tanpa kode sumber -> null, bukan tuduhan', () => {
  assert.equal(ekstrakKodeSumber('Perhatikan grafik berikut!'), null);
  const r = cocokKodePembahasan({ teks_soal: '[UTBK2024/TPS/PU/GEL.2/63] Soal...', pembahasan: 'Premis 1 ...' });
  assert.equal(r.cocok, null, 'satu sisi tanpa kode tidak boleh dituduh');
  assert.equal(pesanPembahasanTertukar({ teks_soal: '[UTBK2024/TPS/PU/GEL.2/63] Soal...', pembahasan: 'Premis 1 ...' }), null);
});

uji('kasus nyata sampel: tiga nomor berputar -> semua tertuduh', () => {
  const pasangan = [
    { soal: '[UTBK2024/TPS/PU/GEL.2/63]', bahas: 'UTBK2024/TPS/PU/GEL.2/69' },
    { soal: '[UTBK2024/TPS/PU/GEL.2/65]', bahas: 'UTBK2024/TPS/PU/GEL.2/63' },
    { soal: '[UTBK2024/TPS/PU/GEL.2/69]', bahas: 'UTBK2024/TPS/PU/GEL.2/65' },
  ];
  for (const p of pasangan) {
    const r = cocokKodePembahasan({ teks_soal: `${p.soal} Berdasarkan informasi...`, pembahasan: `${p.bahas}\nPremis 1 ...` });
    assert.equal(r.cocok, false, `${p.soal} vs ${p.bahas} harus tertuduh`);
    const pesan = pesanPembahasanTertukar({ teks_soal: p.soal, pembahasan: p.bahas });
    assert.ok(pesan && pesan.includes('TERTUKAR'), pesan);
    assert.ok(pesan.includes(p.soal.replace(/[[\]]/g, '')) || pesan.includes(p.soal), pesan);
  }
});

uji('pasangan yang SAH tidak dituduh', () => {
  const r = cocokKodePembahasan({
    teks_soal: '[SNMPTN 2012/TPA/213/24] Jika taman X dipelihara...',
    pembahasan: 'SNMPTN 2012/TPA/213/24\nJika taman X dipelihara...\nJawaban. B',
  });
  assert.equal(r.cocok, true);
  assert.equal(pesanPembahasanTertukar({
    teks_soal: '[SNMPTN 2012/TPA/213/24] Jika taman X...',
    pembahasan: 'SNMPTN 2012/TPA/213/24\nJawaban. B',
  }), null);
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
