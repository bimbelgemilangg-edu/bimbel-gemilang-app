// scripts/ci-penjaga-komponen.mjs
// ============================================================
// PENJAGA KOMPONEN JSX: menangkap kelas bug yang TIDAK bisa dilihat
// ESLint di setup ini.
//
// LAHIR DARI INSIDEN PRODUKSI 2026-10-12: /admin/students crash
// "ReferenceError: Edit is not defined" setelah merge PR #189. Tombol
// revisi memakai <Edit/> padahal berkas mengimpor Edit3; pemeriksaan
// otomatis saat itu tertipu karena "Edit" adalah substring "Edit3".
// ESLint no-undef TIDAK memeriksa identifier JSX, dan build produksi
// lolos karena Vite/esbuild tidak menganggap nama komponen tak dikenal
// sebagai error -- ia baru meledak di runtime, di depan admin yang
// sedang menambah siswa.
//
// Cara kerja: untuk tiap berkas, kumpulkan (a) nama yang diimpor,
// (b) nama yang didefinisikan lokal, lalu (c) nama komponen JSX yang
// dipakai; selisih (c) - (a) - (b) = pelanggaran. CI menjalankannya
// HANYA pada berkas yang berubah (pola yang sama dengan gerbang lint),
// supaya utang lama tidak melumpuhkan perbaikan darurat.
//
//     node scripts/ci-penjaga-komponen.mjs [berkas...]
// ============================================================
import { readFileSync } from 'node:fs';

const berkas = process.argv.slice(2).filter((f) => /\.jsx?$/.test(f));

function namaTerimpor(teks) {
  const keluar = new Set();
  // 🔧 16 Okt 2026 (insiden PR #235): bentuk CAMPUR `import Default,
  // { Named } from` dulu tak terbaca => false-positive "komponen tidak
  // diimpor". Pola campur default & named kini didukung.
  for (const m of teks.matchAll(/import\s+([A-Z][A-Za-z0-9_]*)\s+from/gs)) keluar.add(m[1]);
  for (const m of teks.matchAll(/import\s+([A-Z][A-Za-z0-9_]*)\s*,\s*\{/gs)) keluar.add(m[1]);
  for (const m of teks.matchAll(/import\s*\*\s*as\s*([A-Za-z][A-Za-z0-9_]*)/gs)) keluar.add(m[1]);
  for (const m of teks.matchAll(/import\s*(?:[A-Za-z0-9_]+\s*,\s*)?\{([^}]*)\}\s*from/gs)) {
    for (const bagian of m[1].split(',')) {
      const lokal = bagian.split(/\bas\b/).pop().trim();
      if (/^[A-Za-z][A-Za-z0-9_]*$/.test(lokal)) keluar.add(lokal);
    }
  }
  return keluar;
}

function namaLokal(teks) {
  const keluar = new Set();
  for (const m of teks.matchAll(/(?:function|class|const|let|var)\s+([A-Z][A-Za-z0-9_]*)/g)) keluar.add(m[1]);
  for (const m of teks.matchAll(/function\s+([A-Z][A-Za-z0-9_]*)/g)) keluar.add(m[1]);
  return keluar;
}

// Buang komentar & literal string sebelum memindai: sebutan <Nama> di
// dokumen/komentar (mis. "<Fragment>" di kepala berkas) bukan pemakaian
// komponen. Positif palsu pada penjaga = penjaga yang diabaikan orang.
function buangKomentarDanString(teks) {
  return String(teks)
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/`(?:[^`\\]|\\[\s\S])*`/g, ' ')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""');
}

function komponenDipakai(teks) {
  const keluar = new Set();
  const bersih = buangKomentarDanString(teks);
  for (const m of bersih.matchAll(/<([A-Z][A-Za-z0-9_]*)(?![A-Za-z0-9_.])/g)) keluar.add(m[1]);
  return keluar;
}

let pelanggaran = 0;
for (const f of berkas) {
  let teks;
  try { teks = readFileSync(f, 'utf8'); } catch { continue; }
  const dikenal = new Set([...namaTerimpor(teks), ...namaLokal(teks)]);
  for (const nama of komponenDipakai(teks)) {
    if (!dikenal.has(nama)) {
      pelanggaran += 1;
      console.log(`❌ ${f}: komponen JSX <${nama}> dipakai tetapi tidak diimpor/didefinisikan di berkas ini.`);
    }
  }
}

if (pelanggaran > 0) {
  console.error(`\nPENJAGA KOMPONEN: ${pelanggaran} pelanggaran. Tambahkan impor yang hilang sebelum merge.`);
  process.exit(1);
}
console.log(`✅ PENJAGA KOMPONEN: bersih (${berkas.length} berkas diperiksa).`);
