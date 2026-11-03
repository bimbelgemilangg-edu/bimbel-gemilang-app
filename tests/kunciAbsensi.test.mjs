// tests/kunciAbsensi.test.mjs
// ============================================================
// PENGAWAL ITEM A5 (v1.6.4): kunci dokumen `attendance` punya SATU format
// (`{siswa}_{tanggal}_{jadwal}`) dan bagian tanggalnya WAJIB tanggal LOKAL.
// Sebelumnya empat penulis menyalin format ini inline dengan sumber tanggal
// berbeda (UTC di sisi guru, lokal di sisi siswa) — pada 00:00-06:59 WIB satu
// kehadiran bisa terbelah menjadi dua dokumen. Process anak ber-TZ
// Asia/Jakarta memastikan regresi ke UTC tertangkap walau CI berzona UTC.
// ============================================================
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { kunciDokumenAbsensi } from '../src/utils/identitasAbsensi.js';

const MOD_WAKTU = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'utils', 'waktuLokal.js');
const MOD_IDENT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'utils', 'identitasAbsensi.js');

let lulus = 0, gagal = 0;
function uji(nama, fn) {
  try { fn(); lulus++; console.log('  ✓', nama); } catch (e) { gagal++; console.log('  ✗', nama, '\n   ', String(e.message).slice(0, 300)); }
}

console.log('kunciAbsensi: satu format kunci, tanggal wajib lokal');

uji('format persis {siswa}_{tanggal}_{jadwal}', () => {
  assert.equal(kunciDokumenAbsensi('s1', '2026-11-02', 'j9'), 's1_2026-11-02_j9');
});

uji('jadwal kosong tetap menyisakan pemisah (format lama scan siswa dipertahankan)', () => {
  assert.equal(kunciDokumenAbsensi('s1', '2026-11-02', ''), 's1_2026-11-02_');
});

uji('null tidak melempar', () => {
  assert.equal(kunciDokumenAbsensi(null, null, null), '__');
});

uji('di Asia/Jakarta, kunci untuk 2026-11-02T19:00Z memakai tanggal 3 (bukan UTC)', () => {
  const kode = `import { tanggalLokalStr } from ${JSON.stringify(MOD_WAKTU)};`
    + `import { kunciDokumenAbsensi } from ${JSON.stringify(MOD_IDENT)};`
    + `console.log(kunciDokumenAbsensi('s1', tanggalLokalStr(new Date('2026-11-02T19:00:00Z')), 'j9'));`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', kode], {
    env: { ...process.env, TZ: 'Asia/Jakarta' }, encoding: 'utf8',
  });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout.trim(), 's1_2026-11-03_j9');
});

console.log(gagal === 0 ? `\n✅ kunciAbsensi: ${lulus} lulus` : `\n❌ kunciAbsensi: ${gagal} gagal`);
process.exit(gagal === 0 ? 0 : 1);
