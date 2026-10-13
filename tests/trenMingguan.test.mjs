// tests/trenMingguan.test.mjs
import assert from 'node:assert/strict';
import { kunciMinggu, hitungTrenMingguan, kalimatDelta, targetPoinDariSiswa } from '../src/utils/trenMingguan.js';
let lulus = 0, gagal = 0;
function uji(n, f) { try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${e.message}`); } }

uji('Sabtu & Senin jatuh di pekan yang sama', () => {
  // Senin 2026-10-12 dan Sabtu 2026-10-17 sepekan ISO.
  assert.equal(kunciMinggu(new Date(2026, 9, 12)), kunciMinggu(new Date(2026, 9, 17)));
  assert.equal(kunciMinggu(new Date(2026, 9, 12)), '2026-10-12');
});
uji('delta dihitung terhadap pekan sebelumnya, pekan pertama null', () => {
  const t = hitungTrenMingguan([
    { skor: 50, waktu: new Date(2026, 9, 10) },
    { skor: 70, waktu: new Date(2026, 9, 12) },
    { skor: 78, waktu: new Date(2026, 9, 17) },
  ]);
  assert.equal(t.seri.length, 2);
  assert.equal(t.seri[0].delta, null);
  assert.equal(t.seri[1].delta, 24); // (70+78)/2 = 74 vs 50
  assert.equal(t.terakhir.rataSkor, 74);
});
uji('skor bukan angka & waktu rusak diabaikan, bukan crash', () => {
  const t = hitungTrenMingguan([{ skor: 'abc', waktu: new Date() }, { skor: 60, waktu: null }, { skor: 60, waktu: new Date(2026, 9, 13) }]);
  assert.equal(t.seri.length, 1);
  assert.equal(t.terakhir.jumlah, 1);
});
uji('kalimat delta berbahasa tindakan & menyebut target', () => {
  const t = hitungTrenMingguan([
    { skor: 50, waktu: new Date(2026, 9, 10), mapel: 'TPS/Penalaran Umum' },
    { skor: 62, waktu: new Date(2026, 9, 17), mapel: 'TPS/Penalaran Umum' },
  ]);
  const k = kalimatDelta(t, 80);
  assert.ok(k.includes('+12 poin'), k);
  assert.ok(k.includes('kurang 18 poin'), k);
  assert.ok(k.includes('TPS/Penalaran Umum'), k);
  assert.ok(!/rendah|bodoh|gagal/i.test(k), 'tidak boleh ada bahasa vonis');
});
uji('tanpa data -> kalimat garis start, bukan error', () => {
  assert.ok(kalimatDelta(hitungTrenMingguan([])).includes('garis startmu'));
});
uji('target poin sadar-alias & kosong=null', () => {
  assert.equal(targetPoinDariSiswa({ targetSkor: 700 }), 700);
  assert.equal(targetPoinDariSiswa({ target: { skor: 650 } }), 650);
  assert.equal(targetPoinDariSiswa({ targetKampus: { skorMinimal: 680 } }), 680);
  assert.equal(targetPoinDariSiswa({}), null);
  assert.equal(targetPoinDariSiswa({ targetSkor: 'abc' }), null);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
