// tests/waktuLokal.test.mjs
// ============================================================
// PENGAWAL BUG ZONA WAKTU (2 Nov 2026): string tanggal bisnis WAJIB mengikuti
// zona lokal perangkat, bukan UTC. Sandbox CI berzona UTC sehingga assert
// biasa TIDAK akan pernah menangkap regresi ke toISOString -- karena di UTC
// keduanya identik. Maka bukti sesungguhnya diambil dari PROSES ANAK dengan
// TZ=Asia/Jakarta: pada instan 2026-11-02T19:00Z, WIB sudah tanggal 3
// sementara UTC masih tanggal 2. Bila suatu hari ada yang "merapikan" util
// ini kembali ke toISOString, test ini yang berteriak.
// ============================================================
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tanggalLokalStr, geserHariLokal } from '../src/utils/waktuLokal.js';

const MOD = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'utils', 'waktuLokal.js');
const INSTAN = '2026-11-02T19:00:00Z'; // 02:00 WIB tanggal 3 Nov

function nilaiDiZona(tz) {
  const kode = `import { tanggalLokalStr } from ${JSON.stringify(MOD)};`
    + `console.log(tanggalLokalStr(new Date(${JSON.stringify(INSTAN)})));`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', kode], {
    env: { ...process.env, TZ: tz },
    encoding: 'utf8',
  });
  assert.equal(r.status, 0, `proses anak TZ=${tz} gagal: ${r.stderr}`);
  return r.stdout.trim();
}

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

console.log('waktuLokal: tanggal bisnis = tanggal lokal, bukan UTC');

uji('di Asia/Jakarta, 2026-11-02T19:00Z sudah tanggal 3 (kelas bug timezone tertutup)', () => {
  assert.equal(nilaiDiZona('Asia/Jakarta'), '2026-11-03');
});

uji('di UTC, instan yang sama masih tanggal 2 (bukti dua zona memang beda)', () => {
  assert.equal(nilaiDiZona('UTC'), '2026-11-02');
});

uji('lintas bulan & tahun aman (bukan aritmetika string)', () => {
  assert.equal(geserHariLokal(new Date(2026, 0, 31), 1), '2026-02-01');
  assert.equal(geserHariLokal(new Date(2026, 2, 1), -1), '2026-02-28');
  assert.equal(geserHariLokal(new Date(2026, 11, 31), 1), '2027-01-01');
});

uji('masukan rusak tidak melempar, mengembalikan string kosong', () => {
  assert.equal(tanggalLokalStr('bukan tanggal'), '');
  assert.equal(geserHariLokal(null, 3), '');
});

console.log(gagal === 0 ? `\n✅ waktuLokal: ${lulus} lulus` : `\n❌ waktuLokal: ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
