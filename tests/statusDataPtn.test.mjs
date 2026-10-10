// tests/statusDataPtn.test.mjs — pelacakan sumber & validasi edit prodi
//     node tests/statusDataPtn.test.mjs
import assert from 'node:assert/strict';
import {
  STATUS_DATA, bungkusAngka, bungkusSkorHasilEdit, validasiEditProdi,
  labelUntukTampilan, sanggahanSkor,
} from '../src/utils/statusDataPtn.js';

let lulus = 0, gagal = 0;
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); }
  catch (e) { gagal++; console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}

console.log('statusDataPtn — pelacakan sumber & edit admin');

uji('angka tanpa sumber tidak pernah terverifikasi', () => {
  assert.equal(bungkusAngka(700, { sumber: 'xlsx' }).statusData, STATUS_DATA.BELUM_VERIFIKASI);
  assert.equal(bungkusAngka(null, {}).statusData, STATUS_DATA.BELUM_TERSEDIA);
});

uji('edit admin naik ke terverifikasi HANYA bila resmi+url+tanggal lengkap', () => {
  const lengkap = bungkusSkorHasilEdit({ nilai: 708, resmi: true, sumberUrl: 'https://snpmb.id/x', diambilPada: '2026-10-10', tahunSeleksi: 2027 });
  assert.equal(lengkap.statusData, STATUS_DATA.TERVERIFIKASI);
  for (const kurang of [
    { nilai: 708, resmi: true, sumberUrl: 'https://x' },                    // tanpa tanggal
    { nilai: 708, resmi: true, diambilPada: '2026-10-10' },                 // tanpa url
    { nilai: 708, sumberUrl: 'https://x', diambilPada: '2026-10-10' },      // tidak diakui resmi
  ]) {
    assert.equal(bungkusSkorHasilEdit(kurang).statusData, STATUS_DATA.BELUM_VERIFIKASI, JSON.stringify(kurang));
  }
});

uji('edit dengan nilai kosong menghasilkan belum_tersedia, bukan 0', () => {
  const r = bungkusSkorHasilEdit({ nilai: '' });
  assert.equal(r.nilai, null);
  assert.equal(r.statusData, STATUS_DATA.BELUM_TERSEDIA);
});

uji('validasiEditProdi menolak urutan skor terbalik', () => {
  const m = validasiEditProdi({ skorMinimum: 780, skorRataRata: 740, skorMaksimum: 710 });
  assert.ok(m.some((x) => /urutan/.test(x)));
});

uji('validasiEditProdi menolak url & tanggal yang tidak bisa diklik/diaudit', () => {
  assert.ok(validasiEditProdi({ sumberUrl: 'snpmb.id' }).some((x) => /http/.test(x)));
  assert.ok(validasiEditProdi({ diambilPada: '10/10/2026' }).some((x) => /YYYY-MM-DD/.test(x)));
  assert.deepEqual(validasiEditProdi({ skorMinimum: 700, skorRataRata: 720, skorMaksimum: 750, sumberUrl: 'https://x.id', diambilPada: '2026-10-10', tahunSeleksi: 2027 }), []);
});

uji('label tampilan membedakan angka dan kekosongan', () => {
  assert.equal(labelUntukTampilan(bungkusAngka(null, {})).teks, 'Belum tersedia');
  const t = labelUntukTampilan(bungkusAngka(700, { sumber: 'x' }));
  assert.equal(t.teks, '700');
  assert.equal(t.peringatan, true, 'estimasi wajib membawa peringatan');
});

uji('sanggahan menyebut tiga larangan blueprint', () => {
  const t = sanggahanSkor();
  assert.match(t, /estimasi/i);
  assert.match(t, /bukan passing grade resmi/i);
  assert.match(t, /tidak otomatis setara/i);
});

console.log(`\n  LULUS: ${lulus}  GAGAL: ${gagal}`);
if (gagal > 0) process.exit(1);
console.log('✅ Semua test lulus.');
