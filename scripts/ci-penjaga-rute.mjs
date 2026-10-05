// scripts/ci-penjaga-rute.mjs
// ============================================================
// PENJAGA GERBANG CI -- khusus kelas bug "fitur mati karena rute
// tidak terdaftar". Dijalankan oleh .github/workflows/ci.yml dan
// bisa dijalankan lokal:
//     node scripts/ci-penjaga-rute.mjs
//
// KENAPA BERKAS INI ADA (insiden nyata 2026-10-05):
//   PR #106 menambahkan fitur "Try Out terhubung tentor": impor
//   GuruPantauTryOut di App.jsx, halaman 281 baris, dan banner di
//   TeacherDashboard yang menavigasi ke /guru/tryout-monitor/:paketId.
//   Yang LUPA: <Route>-nya tidak pernah didaftarkan. Klik banner jatuh
//   ke fallback <Route path="*"> lalu dilempar balik ke "/". Fitur itu
//   mati total di produksi -- penilaian esai oleh guru tidak pernah
//   bisa dipakai -- dan tidak ada satu pun gerbang yang menyala.
//
//   Kenapa CI hijau? eslint.config.js memakai
//   `varsIgnorePattern: '^[A-Z_]'`. Itu workaround WAJIB, bukan
//   kelalaian: ESLint pada setup ini TIDAK menghitung pemakaian JSX
//   (terverifikasi lewat probe: komponen yang benar-benar dipakai di
//   JSX tetap dilaporkan "never used"), jadi mencabut pola itu
//   menghasilkan ±2.000 error palsu. Efek sampingnya: impor komponen
//   React yang nganggur jadi tak terlihat oleh lint.
//
//   Sesuai SOP-KESELAMATAN-PERUBAHAN janji #3 ("setiap penghapusan
//   gerbang pengamanan wajib menyebut penggantinya"), penggantinya
//   adalah penjaga sempit ini. Ia TIDAK mencoba jadi linter umum; ia
//   hanya menegakkan dua invarian yang murah dan pasti:
//     A. setiap KOMPONEN yang diimpor App.jsx benar-benar dipakai,
//     B. setiap tujuan navigasi di src/ punya rute yang cocok.
//
//   Bug yang pernah terjadi dua kali adalah kegagalan proses, bukan
//   kegagalan orang. Penjaga ini yang membuatnya tidak bisa terulang.
// ============================================================

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const APP_REL = 'src/App.jsx';
const APP = join(ROOT, APP_REL);

let temuan = 0;
const lapor = (jenis, berkas, detail) => {
  temuan += 1;
  console.log(`  ❌ [${jenis}] ${berkas}: ${detail}`);
};

// ------------------------------------------------------------
// PENGHAPUS KOMENTAR -- state machine, BUKAN regex.
//
// Versi pertama penjaga ini memakai regex `/\/\*[\s\S]*?\*\//g` dan
// itu SALAH BESAR: ia memakan 27.000 dari 40.000 karakter App.jsx
// (satu `/*` di dalam string/komentar JSX membuat pasangan `*/`
// berikutnya "menelan" seluruh kode di antaranya), sehingga
// TeacherLayout, SidebarSiswa, StudentQuizView dll. ikut dilaporkan
// nganggur. Penjaga yang berteriak palsu akan dimatikan orang, jadi
// akurasi di sini bukan kosmetik.
//
// Scanner ini melacak keadaan: string ' " ` , komentar // dan /* */,
// serta literal regex (heuristik: `/` hanya awal regex kalau token
// signifikan sebelumnya memungkinkan posisi operand).
// ------------------------------------------------------------
const BOLEH_REGEX_SETELAH = new Set([
  'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void',
  'case', 'do', 'else', 'yield', 'await', 'throw',
]);

function buangKomentar(kode) {
  let out = '';
  let i = 0;
  const n = kode.length;
  let charTerakhir = '';   // karakter signifikan terakhir
  let kataTerakhir = '';   // kata (identifier) signifikan terakhir

  const catat = (ch) => {
    out += ch;
    if (/\s/.test(ch)) return;
    charTerakhir = ch;
    if (/[A-Za-z0-9_$]/.test(ch)) kataTerakhir += ch;
    else kataTerakhir = '';
  };

  while (i < n) {
    const c = kode[i];
    const d = kode[i + 1];

    // --- komentar baris ---
    if (c === '/' && d === '/') {
      while (i < n && kode[i] !== '\n') i += 1;
      continue;
    }
    // --- komentar blok (JSX memakai {/* ... */}) ---
    if (c === '/' && d === '*') {
      i += 2;
      while (i < n && !(kode[i] === '*' && kode[i + 1] === '/')) i += 1;
      i += 2;
      out += ' ';
      continue;
    }
    // --- string / template literal: salin utuh, hormati escape ---
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      out += c; i += 1;
      while (i < n) {
        if (kode[i] === '\\') { out += kode[i] + (kode[i + 1] ?? ''); i += 2; continue; }
        const ch = kode[i];
        out += ch; i += 1;
        if (ch === q) break;
      }
      charTerakhir = q; kataTerakhir = '';
      continue;
    }
    // --- literal regex: jangan sampai `/` di dalamnya dibaca sebagai komentar ---
    if (c === '/' && (charTerakhir === '' || '(,=:[!&|?{};+-*%~^<>'.includes(charTerakhir)
        || BOLEH_REGEX_SETELAH.has(kataTerakhir))) {
      out += c; i += 1;
      let dalamKelas = false;
      while (i < n) {
        if (kode[i] === '\\') { out += kode[i] + (kode[i + 1] ?? ''); i += 2; continue; }
        if (kode[i] === '[') dalamKelas = true;
        else if (kode[i] === ']') dalamKelas = false;
        else if (kode[i] === '\n') break;           // bukan regex, keluar
        out += kode[i];
        if (kode[i] === '/' && !dalamKelas) { i += 1; break; }
        i += 1;
      }
      while (i < n && /[dgimsuvy]/.test(kode[i])) { out += kode[i]; i += 1; }
      charTerakhir = '/'; kataTerakhir = '';
      continue;
    }

    catat(c);
    i += 1;
  }
  return out;
}

// ------------------------------------------------------------
// 1. Rute TERDAFTAR di App.jsx.
//    `path="*"` (fallback) sengaja TIDAK dihitung: ia mencocokkan apa
//    pun, jadi kalau ikut dihitung penjaga ini tak akan pernah
//    menemukan tautan mati.
// ------------------------------------------------------------
const appAsli = readFileSync(APP, 'utf8');
const appKode = buangKomentar(appAsli);

const rute = new Set();
for (const m of appKode.matchAll(/<Route\s[^>]*?\bpath=(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
  const p = m[1] ?? m[2] ?? m[3];
  if (p && p !== '*') rute.add(p.replace(/\/+$/, '') || '/');
}
const ruteSegmen = [...rute].map((r) => r.split('/'));

// ------------------------------------------------------------
// 2A. KOMPONEN diimpor App.jsx tapi tidak pernah dipakai di badan.
//     Inilah gerbang yang seharusnya menangkap insiden #106.
//
//     Dibatasi pada nama PascalCase (huruf besar diikuti huruf kecil),
//     jadi konstanta SCREAMING_CASE seperti KATEGORI /
//     LABEL_PERAN_ADMIN tidak ikut -- pesan "rutenya lupa didaftarkan"
//     tidak masuk akal untuk konstanta. `React` dikecualikan: ia impor
//     default yang memang tidak dipakai eksplisit di runtime JSX
//     otomatis, dan menandainya hanya jadi derau.
// ------------------------------------------------------------
const appBaris = appAsli.split('\n');
const badanApp = buangKomentar(appBaris.filter((b) => !/^\s*import\b/.test(b)).join('\n'));

const isKomponen = (nama) => /^[A-Z][a-z]/.test(nama) && nama !== 'React';

const diimpor = new Map();
appBaris.forEach((baris, idx) => {
  if (!/^\s*import\b/.test(baris)) return;
  const dflt = /^\s*import\s+([A-Za-z0-9_$]+)\s*(?:,\s*\{[^}]*\})?\s+from/.exec(baris);
  if (dflt && isKomponen(dflt[1])) diimpor.set(dflt[1], idx + 1);
  const named = /^\s*import\s*(?:[A-Za-z0-9_$]+\s*,\s*)?\{([^}]+)\}\s*from/.exec(baris);
  if (named) {
    for (const bagian of named[1].split(',')) {
      const nama = bagian.trim().split(/\s+as\s+/).pop().trim();
      if (isKomponen(nama)) diimpor.set(nama, idx + 1);
    }
  }
});

for (const [nama, baris] of diimpor) {
  if (new RegExp(`\\b${nama}\\b`).test(badanApp)) continue;
  lapor(
    'komponen-nganggur',
    `${APP_REL}:${baris}`,
    `komponen "${nama}" diimpor tapi tidak pernah dipakai di badan ${APP_REL}. `
    + 'Penyebab tersering: <Route>-nya lupa didaftarkan, sehingga fitur tidak '
    + 'bisa dibuka dari mana pun. Daftarkan rutenya, atau hapus impornya.'
  );
}

// ------------------------------------------------------------
// 2B. Tujuan navigasi tanpa rute.
//     Tiga dialek harus dikenali, kalau tidak penjaga ini berteriak
//     palsu lalu diabaikan orang:
//       a. literal statis   navigate('/guru/dashboard')
//       b. template literal navigate(`/guru/x/${id}`)
//       c. konkatenasi      navigate('/guru/x/' + id)
//     Dialek (c) yang menjebak pemeriksa naif: prefix "/guru/x/"
//     terlihat seperti rute yang tidak ada, padahal ekor dinamisnya
//     membuat ia cocok dengan "/guru/x/:id".
// ------------------------------------------------------------
const DINA = ':__dinamis__';

function uraikanTujuan(literal, ekor) {
  if (!literal.startsWith('/') || literal.startsWith('//')) return null;
  const bersih = literal.split(/[?#]/)[0];
  let segmen;
  if (/\$\{[^}]*\}/.test(bersih)) {
    segmen = bersih.replace(/\$\{[^}]*\}/g, DINA).split('/');       // dialek b
  } else if (bersih.endsWith('/') && /^\s*\+/.test(ekor)) {
    segmen = [...bersih.slice(0, -1).split('/'), DINA];              // dialek c
  } else {
    segmen = bersih.split('/');                                      // dialek a
  }
  while (segmen.length > 1 && segmen[segmen.length - 1] === '') segmen.pop();
  if (segmen.length < 2) return null;                                // "/" = beranda
  return segmen.map((s) => (s.includes(DINA) ? DINA : s));
}

const cocokRute = (segmen) => ruteSegmen.some((rs) => rs.length === segmen.length
  && rs.every((s, i) => s.startsWith(':') || s === '*' || s === segmen[i] || segmen[i] === DINA));

function* jalan(dir) {
  for (const entri of readdirSync(dir)) {
    const p = join(dir, entri);
    if (statSync(p).isDirectory()) yield* jalan(p);
    else if (/\.(js|jsx|mjs)$/.test(entri)) yield p;
  }
}

const KONTEKS = [
  /\bnavigate\(\s*(?:(`[^`]*`)|'([^']*)'|"([^"]*)")([\s\S]{0,24})/g,
  /\bto=\{?\s*(?:(`[^`]*`)|'([^']*)'|"([^"]*)")([\s\S]{0,24})/g,
  /\bhref=\{?\s*(?:(`[^`]*`)|'([^']*)'|"([^"]*)")([\s\S]{0,24})/g,
  /window\.location(?:\.href)?\s*[=(]\s*(?:(`[^`]*`)|'([^']*)'|"([^"]*)")([\s\S]{0,24})/g,
];

const tujuanMati = new Map();
let dipindai = 0;

for (const berkas of jalan(join(ROOT, 'src'))) {
  const rel = relative(ROOT, berkas);
  const isi = buangKomentar(readFileSync(berkas, 'utf8'));
  for (const re of KONTEKS) {
    re.lastIndex = 0;
    for (const m of isi.matchAll(re)) {
      const raw = m[1] ?? m[2] ?? m[3];
      if (raw === undefined) continue;
      const literal = raw.startsWith('`') && raw.endsWith('`') ? raw.slice(1, -1) : raw;
      const seg = uraikanTujuan(literal, m[4] ?? '');
      if (!seg) continue;
      dipindai += 1;
      if (cocokRute(seg)) continue;
      const kunci = seg.join('/').replaceAll(DINA, ':…');
      if (!tujuanMati.has(kunci)) tujuanMati.set(kunci, new Set());
      tujuanMati.get(kunci).add(rel);
    }
  }
}

for (const [tujuan, berkas] of [...tujuanMati].sort()) {
  lapor(
    'tautan-mati',
    [...berkas].slice(0, 6).join(', '),
    `tujuan navigasi "${tujuan}" tidak punya <Route> yang cocok di ${APP_REL}. `
    + 'Pengguna yang menekannya jatuh ke fallback dan dilempar ke beranda.'
  );
}

// ------------------------------------------------------------
console.log('');
console.log(`   rute terdaftar: ${rute.size} · komponen diimpor App.jsx: ${diimpor.size} · tujuan navigasi dipindai: ${dipindai}`);
if (temuan > 0) {
  console.error(`❌ PENJAGA RUTE: ${temuan} temuan. Perbaiki sebelum merge.`);
  process.exit(1);
}
console.log('✅ PENJAGA RUTE: bersih.');
