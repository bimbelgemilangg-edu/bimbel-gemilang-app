// tests/urutanStateRaportAdmin.test.mjs — tripwire crash TDZ prod (v1.5.1)
// Insiden 31 Okt 2026 21.43: 'Cannot access E before initialization' karena
// kunciAlias (membaca aliasIdentitas) terletak SEBELUM useState aliasIdentitas
// di badan komponen — ReferenceError tiap render, tertangkap error boundary.
// Test ini murah & statis: menjamin setiap pembacaan state turunan di badan
// komponen berada SETELAH deklarasi useState state yang dibacanya.
//   node tests/urutanStateRaportAdmin.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const sini = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(sini, '../src/pages/admin/RaportOtomatisPage.jsx'), 'utf8');

let lulus = 0; const gagal = [];
function uji(n, f) {
  try { f(); lulus++; console.log(`  ✓ ${n}`); } catch (e) { gagal.push(n); console.log(`  ✗ ${n}\n      ${String(e.message).slice(0, 200)}`); }
}
console.log('urutanStateRaportAdmin — tripwire TDZ (state dibaca sebelum deklarasi)');

const posisi = (teks) => src.indexOf(teks);

uji('state aliasIdentitas dideklarasikan SEBELUM kunciAlias membacanya', () => {
  const dek = posisi('const [aliasIdentitas, setAliasIdentitas] = useState(');
  const pakai = posisi('const kunciAlias = Object.entries(aliasIdentitas)');
  assert.ok(dek >= 0 && pakai >= 0, 'penanda tidak ditemukan — file direstrukturisasi? perbarui test ini');
  assert.ok(dek < pakai, 'kunciAlias membaca aliasIdentitas sebelum useState-nya = crash TDZ');
});

uji('semua useState inti mendahului turunan kunciFilterAktif', () => {
  const turunan = posisi('const kunciFilterAktif =');
  for (const nama of ['const [hasil, setHasil]', 'const [sedangMenghitung', 'const [petaCapaian', 'const [aliasIdentitas', 'const [rekapGuru']) {
    const p = posisi(nama);
    assert.ok(p >= 0, `penanda ${nama} tidak ditemukan`);
    assert.ok(p < turunan, `${nama} harus dideklarasikan sebelum kunciFilterAktif`);
  }
});

uji('BarisReparasi & helper modul tidak membaca state komponen di level modul', () => {
  const awal = posisi('function BarisReparasi');
  const akhir = src.indexOf('export default function RaportOtomatisPage');
  const potongan = src.slice(awal, akhir);
  for (const nama of ['aliasIdentitas', 'kunciFilterAktif', 'mentah', 'hasil']) {
    assert.ok(!new RegExp(`\\b${nama}\\b`).test(potongan), `BarisReparasi menyentuh ${nama} di luar komponen`);
  }
});

console.log(`\n${gagal.length === 0 ? '✅' : '❌'} urutanStateRaportAdmin: ${lulus} lulus, ${gagal.length} gagal`);
process.exit(gagal.length === 0 ? 0 : 1);
