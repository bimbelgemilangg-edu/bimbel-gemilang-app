// tests/skorSkalaUtbk.test.mjs — skala menyerupai UTBK, jujur soal dirinya
//     node tests/skorSkalaUtbk.test.mjs
import assert from 'node:assert/strict';
import {
  persenKeSkala, hitungSkalaUtbk, LABEL_SKALA, SKALA_MIN, SKALA_MAKS,
} from '../src/utils/skorSkalaUtbk.js';
import { TOTAL_SOAL_UTBK, TOTAL_MENIT_UTBK, templateTryoutUtbkSabtu, KOMPOSISI_SUBTES_UTBK } from '../src/utils/templateTryoutUtbk.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('skorSkalaUtbk + template Sabtu');

uji('pemetaan linear & monoton di rentang 300-800', () => {
  assert.equal(persenKeSkala(0), SKALA_MIN);
  assert.equal(persenKeSkala(100), SKALA_MAKS);
  assert.equal(persenKeSkala(50), 550);
  let sebelumnya = -1;
  for (let p = 0; p <= 100; p += 1) {
    const s = persenKeSkala(p);
    assert.ok(s >= sebelumnya, `monoton di ${p}`);
    sebelumnya = s;
  }
});

uji('persen di luar 0-100 dipotong, bukan meledak', () => {
  assert.equal(persenKeSkala(140), SKALA_MAKS);
  assert.equal(persenKeSkala(-20), SKALA_MIN);
  assert.equal(persenKeSkala('abc'), null);
  assert.equal(persenKeSkala(null), null);
});

uji('total tertimbang jumlah soal, bukan rata-rata polos', () => {
  const r = hitungSkalaUtbk([
    { kode: 'utbk_pu', benar: 30, total: 30 },   // 100%
    { kode: 'utbk_pm', benar: 0, total: 120 },   // 0%
  ]);
  // 30/150 = 20% -> 300 + 5*20 = 400, BUKAN (800+300)/2 = 550
  assert.equal(r.total, 400);
  assert.equal(r.perSubtes.length, 2);
});

uji('tanpa subtes bernilai -> total null + alasan, bukan 0', () => {
  for (const s of [[], null, [{ benar: 5, total: 0 }], [{ benar: 'x', total: 'y' }]]) {
    const r = hitungSkalaUtbk(s);
    assert.equal(r.total, null);
    assert.ok(r.alasan || r.perSubtes.length === 0);
  }
});

uji('benar tidak bisa melebihi total (data rusak tidak jadi skor surga)', () => {
  const r = hitungSkalaUtbk([{ benar: 999, total: 20 }]);
  assert.equal(r.perSubtes[0].benar, 20);
  assert.equal(r.perSubtes[0].persen, 100);
});

uji('INVARIAN: setiap hasil membawa label kejujuran', () => {
  const r = hitungSkalaUtbk([{ benar: 12, total: 20 }]);
  assert.equal(r.label, LABEL_SKALA);
  assert.match(LABEL_SKALA, /BUKAN skor UTBK resmi/i);
  assert.match(LABEL_SKALA, /IRT/);
});

// ---------------- template Sabtu ----------------
uji('komposisi persis sheet KOMPONEN owner: 155 soal / 195 menit', () => {
  assert.equal(TOTAL_SOAL_UTBK, 155);
  assert.equal(TOTAL_MENIT_UTBK, 195);
  assert.deepEqual(KOMPOSISI_SUBTES_UTBK.map((k) => k.subtes), ['PU', 'PPU', 'PBM', 'PK', 'LBI', 'LBE', 'PM']);
});

uji('template Sabtu: hari=6, timer per subtes, nama mapel = nama resmi MAPEL_UTBK', () => {
  const t = templateTryoutUtbkSabtu();
  assert.deepEqual(t.hariDalamMinggu, [6]);
  assert.equal(t.modeTimer, 'per-subtes');
  assert.ok(t.komposisi.every((k) => k.mapel && k.mapel.startsWith('TPS/') || k.mapel.startsWith('Literasi/')));
  assert.ok(t.komposisi.every((k) => k.jumlah > 0 && k.durasiMenit > 0));
  assert.equal(t.komposisi.reduce((a, b) => a + b.jumlah, 0), 155);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
