// scripts/ci-penjaga-impor.mjs
// ============================================================
// PENJAGA GERBANG CI -- resolusi impor lintas modul.
//
// KENAPA BERKAS INI ADA (insiden 2026-10-10): restyle UI try out mengirim
// commit yang mengimpor `hitungSkalaSesi` dari modul yang SALAH
// (skorSkalaUtbk, padahal rumahnya hitungSkalaSesi). ESLint setup ini tidak
// memakai plugin import, test Node tidak mengimpor berkas halaman, dan
// penjaga rute hanya memeriksa App.jsx -- jadi yang menangkapnya adalah
// BUILD PRODUKSI di CI & Vercel, gerbang TERMALAH dan termahal dalam pipa.
//
// Penjaga ini membundel seluruh aplikasi dengan esbuild (mesin yang sama
// dengan inti transform Vite) dalam ±3 detik: impor yang tidak resolve atau
// ekspor yang tidak ada langsung merah di sini, sebelum build sungguhan.
// virtual:pwa-register dimark external karena ia modul virtual milik
// vite-plugin-pwa; aset biner diberi loader file seperti konfigurasi Vite.
// ============================================================
import { build } from 'esbuild';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENTRY = join(ROOT, 'src', 'main.jsx');

if (!existsSync(ENTRY)) {
  console.error('❌ EntryPoint tidak ditemukan:', ENTRY);
  process.exit(1);
}

try {
  await build({
    entryPoints: [ENTRY],
    bundle: true,
    write: false,
    outdir: '.penjaga-impor-tmp', // wajib ada karena loader 'file' memancarkan aset; write:false = tidak benar-benar ditulis
    logLevel: 'silent',
    format: 'esm',
    loader: {
      '.js': 'jsx', '.jsx': 'jsx', '.css': 'css',
      '.ttf': 'file', '.woff': 'file', '.woff2': 'file',
      '.png': 'file', '.jpg': 'file', '.jpeg': 'file', '.svg': 'file',
    },
    external: ['virtual:pwa-register'],
    define: {
      'process.env.NODE_ENV': '"production"',
      __BUILD_STAMP: '"penjaga"',
    },
  });
  console.log('✅ PENJAGA IMPOR: seluruh impor & ekspor lintas modul resolve.');
} catch (e) {
  console.error('❌ PENJAGA IMPOR: bundel gagal --');
  for (const err of e.errors || []) {
    console.error(`   ${err.text}`);
    if (err.location) console.error(`     di ${err.location.file}:${err.location.line}`);
  }
  process.exit(1);
}
