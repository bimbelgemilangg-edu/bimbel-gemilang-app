#!/usr/bin/env node
// ============================================================
// Runner uji logika — pengganti rantai `node a && node b && ...`
// di package.json yang pernah MELUPAKAN 9 berkas uji (kasus
// 2026-10-14: asalPembahasan, batasCoverFirestore, dst. tidak
// pernah dieksekusi CI karena tidak masuk rantai manual).
//
// Aturan main:
//   - SEMUA berkas tests/*.test.mjs otomatis terdeteksi. Uji baru
//     cukup disimpan di tests/ — tidak perlu edit package.json.
//   - Dieksekusi paralel (pool sebesar inti CPU, maks 8, bisa
//     dipaksa lewat env TEST_CONCURRENCY=1 untuk mode serial).
//   - Output tiap uji disembunyikan kecuali gagal, supaya log CI
//     tetap ringkas; saat gagal, output lengkap dicetak.
//   - Exit code 1 bila ada satu saja uji gagal (kontrak sama
//     dengan rantai lama, jadi gerbang CI tidak berubah).
//
// Pemakaian:
//   npm test                     # semua uji
//   npm test -- kwitansi         # hanya berkas yang namanya mengandung 'kwitansi'
//   TEST_CONCURRENCY=1 npm test  # serial (debug)
// ============================================================
import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { cpus } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const testsDir = path.join(root, 'tests');
const filter = process.argv[2] || '';

const semua = (await readdir(testsDir))
  .filter((f) => f.endsWith('.test.mjs'))
  .sort();
const files = filter ? semua.filter((f) => f.includes(filter)) : semua;

if (files.length === 0) {
  console.error(`Tidak ada berkas uji yang cocok dengan filter "${filter}" di tests/`);
  process.exit(1);
}

const concurrency = Math.max(
  1,
  Math.min(Number(process.env.TEST_CONCURRENCY) || cpus().length || 4, 8)
);

const hasil = [];
const antrian = [...files];
const mulai = Date.now();

async function pekerja() {
  while (antrian.length > 0) {
    const file = antrian.shift();
    const out = await new Promise((resolve) => {
      const child = spawn(process.execPath, [path.join(testsDir, file)], {
        cwd: root,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let buf = '';
      child.stdout.on('data', (d) => (buf += d));
      child.stderr.on('data', (d) => (buf += d));
      child.on('close', (code) => resolve({ code: code ?? 1, buf }));
      child.on('error', () => resolve({ code: 1, buf: 'gagal memulai proses node' }));
    });
    hasil.push({ file, ...out });
    process.stdout.write(out.code === 0 ? '.' : 'F');
  }
}

await Promise.all(
  Array.from({ length: Math.min(concurrency, files.length) }, () => pekerja())
);

const gagal = hasil.filter((h) => h.code !== 0);
const detik = ((Date.now() - mulai) / 1000).toFixed(1);
process.stdout.write('\n\n');

for (const g of gagal) {
  console.error(`════ GAGAL: tests/${g.file} (exit ${g.code}) ════`);
  console.error(g.buf);
}

// Jumlah subtest TAP (# pass N) bila dilaporkan, untuk ringkasan.
let tapPass = 0;
for (const h of hasil) {
  const m = h.buf.match(/^# pass (\d+)$/m);
  if (m) tapPass += Number(m[1]);
}

console.log(
  `Ringkasan uji: ${hasil.length - gagal.length}/${hasil.length} berkas LULOS` +
    (tapPass ? ` (${tapPass} subtest TAP)` : '') +
    ` dalam ${detik}s (paralel ${Math.min(concurrency, files.length)}x)`
);

if (gagal.length > 0) {
  console.error(`${gagal.length} berkas uji GAGAL.`);
  process.exit(1);
}
console.log('Semua uji logika lulus.');
