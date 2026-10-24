// tests/skorSkalaUtbk.test.mjs — skala menyerupai UTBK, jujur soal dirinya
//     node tests/skorSkalaUtbk.test.mjs
import assert from 'node:assert/strict';
import {
  persenKeSkala, hitungSkalaUtbk, LABEL_SKALA, SKALA_MIN, SKALA_MAKS,
  BOBOT_KOMPONEN, komponenDariKode,
} from '../src/utils/skorSkalaUtbk.js';
import { TOTAL_SOAL_UTBK, TOTAL_MENIT_UTBK, templateTryoutUtbkSabtu, KOMPOSISI_SUBTES_UTBK } from '../src/utils/templateTryoutUtbk.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('skorSkalaUtbk + template Sabtu');

uji('pemetaan linear & monoton di rentang 100-1000', () => {
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

uji('total BERBOBOT RESMI SNBT 2025, bukan tertimbang jumlah soal', () => {
  const r = hitungSkalaUtbk([
    { kode: 'utbk_pu', benar: 30, total: 30 },   // TPS 100% -> skala 1000
    { kode: 'utbk_pm', benar: 0, total: 120 },   // PM  0%   -> skala 100
  ]);
  // Bobot resmi: TPS 50, PM 15 (dinormalisasi 65 karena komponen lain kosong)
  // -> (50*1000 + 15*100) / 65 = 792. Bukan tertimbang jumlah soal (dahulu 400)
  // dan bukan rata-rata polos (550).
  assert.equal(r.total, 792);
  assert.equal(r.perSubtes.length, 2);
  assert.deepEqual(r.perKomponen.map((k) => k.komponen).sort(), ['PM', 'TPS']);
});

uji('komponen tunggal: total = skala komponen itu (renormalisasi bobot)', () => {
  const r = hitungSkalaUtbk([{ kode: 'LBI', benar: 10, total: 20 }]);
  assert.equal(r.total, r.perKomponen[0].skala);
  assert.equal(r.total, persenKeSkala(50));
  assert.match(r.catatan || '', /dinormalisasi/);
});

uji('kode subtes dua bentuk dikenali komponen yang sama', () => {
  assert.equal(komponenDariKode('PU'), 'TPS');
  assert.equal(komponenDariKode('utbk_pu'), 'TPS');
  assert.equal(komponenDariKode('utbk_lbe'), 'LBE');
  assert.equal(komponenDariKode('PM'), 'PM');
  assert.equal(komponenDariKode('TPS'), 'TPS');
  assert.equal(komponenDariKode('matematika'), null);
});

uji('kode tak dikenal: jatuh ke tertimbang jumlah soal + catatan jujur', () => {
  const r = hitungSkalaUtbk([{ kode: 'XYZ', benar: 1, total: 4 }]);
  assert.equal(r.total, persenKeSkala(25));
  assert.match(r.catatan || '', /tidak dikenal bobot resmi/);
});

uji('bobot resmi berjumlah 100 dan keempat komponen ada', () => {
  assert.equal(Object.values(BOBOT_KOMPONEN).reduce((a, b) => a + b, 0), 100);
  assert.deepEqual(Object.keys(BOBOT_KOMPONEN), ['TPS', 'LBI', 'LBE', 'PM']);
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
  assert.match(LABEL_SKALA, /100-1000/);
  assert.match(LABEL_SKALA, /SNBT 2025/);
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
