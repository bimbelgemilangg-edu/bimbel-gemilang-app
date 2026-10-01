// scripts/ci-penjaga-konten.mjs
// ============================================================
// PENJAGA GERBANG CI -- pemeriksaan murah yang menangkap kelas bug
// yang SUDAH PERNAH lolos ke produksi di repo ini. Dijalankan oleh
// .github/workflows/ci.yml pada setiap push & pull request, dan bisa
// dijalankan lokal:
//     node scripts/ci-penjaga-konten.mjs
//
// Kenapa berkas ini ada: setiap pemeriksa di sini lahir dari satu
// insiden nyata. Lebih murah menolak di gerbang daripada menemukan
// lagi di HP siswa.
//   1. Kurung himpunan LaTeX hilang  -> Matematika Bab 7 tayang sebagai
//      "A = 2, 3" (backslash '\{' ditelan string literal JS).
//   2. File bernama ber-TAB          -> RendererIsianSingkat.jsx<TAB>
//      lolos commit dan mengacaukan resolusi import.
//   3. Aksara CJK terselip di komentar kode Indonesia -> beberapa kali
//      terjadi dan baru ketemu manual.
//   4. Secret tertempel di kode      -> PAT GitHub pernah ditempel di
//      chat dan nyaris ter-commit; pola serupa harus ditolak di gerbang.
// ============================================================

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
let temuan = 0;

const lapor = (jenis, berkas, detail) => {
  temuan += 1;
  console.log(`  ❌ [${jenis}] ${berkas}: ${detail}`);
};

// ------------------------------------------------------------
// 1. KURUNG HIMPUNAN LATEX di berkas konten IMPOR-*.json
//    Di dalam span $...$: '{' polos yang bukan argumen perintah
//    (\text{, \frac{, ...), bukan argumen kedua '}{' , bukan pangkat
//    '^{'/'_{' , dan bukan setelah huruf = kurung himpunan yang
//    kehilangan backslash.
// ------------------------------------------------------------
const PERINTAH_ARG = new Set(['text', 'frac', 'dfrac', 'tfrac', 'sqrt', 'mathrm', 'mathbf',
  'mathit', 'operatorname', 'overline', 'underline', 'hat', 'bar', 'vec', 'tilde', 'widehat',
  'binom', 'cases', 'matrix', 'pmatrix', 'bmatrix', 'array', 'substack', 'boxed', 'color',
  'textcolor', 'phantom', 'big', 'Big']);

function kurungHimpunanBocor(teks) {
  const hasil = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$/g;
  let m;
  while ((m = re.exec(teks)) !== null) {
    const isi = m[1] ?? m[2];
    for (let i = 0; i < isi.length; i += 1) {
      if (isi[i] !== '{') continue;
      const prev = i > 0 ? isi[i - 1] : '';
      if (prev === '\\' || prev === '}' || prev === '^' || prev === '_') continue;
      let j = i - 1;
      while (j >= 0 && /[a-zA-Z]/.test(isi[j])) j -= 1;
      const nama = isi.slice(j + 1, i);
      if (nama) continue;
      if (prev === '' || /[ =,(:<>+\-*/]/.test(prev)) {
        hasil.push(isi.slice(Math.max(0, i - 14), i + 16));
      }
    }
  }
  return hasil;
}

console.log('1) Kurung himpunan LaTeX pada berkas konten...');
for (const f of readdirSync(ROOT).filter((x) => x.startsWith('IMPOR-') && x.endsWith('.json'))) {
  const bocor = kurungHimpunanBocor(readFileSync(join(ROOT, f), 'utf8'));
  if (bocor.length) lapor('konten', f, `${bocor.length} kurung himpunan kehilangan backslash, mis. ${JSON.stringify(bocor[0])}`);
}
console.log('   selesai.');

// ------------------------------------------------------------
// 2. NAMA FILE JANGGAL (tab / karakter kontrol) & 3. CJK TERSSELIP
// ------------------------------------------------------------
console.log('2) Nama file janggal & aksara terselip...');
const DIR_PERIKSA = ['src', 'api', 'scripts', 'tests', 'docs', 'public'];
const RE_CJK = /[\u3400-\u4E00\u3040-\u30FF\uAC00-\uD7AF]/;

function jalan(dir) {
  const penuh = join(ROOT, dir);
  if (!existsSync(penuh)) return;
  for (const entri of readdirSync(penuh)) {
    const path = join(penuh, entri);
    const rel = relative(ROOT, path);
    if (/[\t\r\n\v\f]/.test(entri)) lapor('nama-file', rel, 'nama berkas mengandung tab/karakter kontrol');
    const st = statSync(path);
    if (st.isDirectory()) { jalan(rel); continue; }
    if (!/\.(js|jsx|mjs|json|md)$/.test(entri)) continue;
    // CJK hanya diperiksa di kode, bukan di tests/ (ada kasus uji unicode
    // yang memang sengaja) dan bukan di konten materi bahasa.
    if (!rel.startsWith('tests') && !rel.startsWith('docs')) {
      const isi = readFileSync(path, 'utf8');
      const baris = isi.split('\n');
      for (let i = 0; i < baris.length; i += 1) {
        if (RE_CJK.test(baris[i])) {
          lapor('aksara', rel, `baris ${i + 1} mengandung aksara CJK terselip: ${baris[i].trim().slice(0, 60)}`);
          break;
        }
      }
    }
  }
}
for (const d of DIR_PERIKSA) jalan(d);
console.log('   selesai.');

// ------------------------------------------------------------
// 4. POLA SECRET YANG TIDAK BOLEH ADA DI REPO
//    (apiKey Firebase web SENGAJA tidak dipolak: itu identifier publik.)
// ------------------------------------------------------------
console.log('3) Pola secret tertempel...');
const POLA = [
  [/github_pat_[A-Za-z0-9_]{10,}/, 'PAT GitHub fine-grained'],
  [/ghp_[A-Za-z0-9]{20,}/, 'PAT GitHub klasik'],
  [/gho_[A-Za-z0-9]{20,}/, 'token OAuth GitHub'],
  [/sk-[A-Za-z0-9]{20,}/, 'kunci gaya OpenAI/Stripe'],
  [/AKIA[0-9A-Z]{16}/, 'access key AWS'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key PEM'],
  [/MIDTRANS_SERVER_KEY\s*=\s*['"][A-Za-z0-9=+/]{8,}/, 'server key Midtrans bernilai'],
  [/SERVICE_ACCOUNT\s*=\s*['"]\{/, 'service account JSON tertempel'],
];
for (const d of ['src', 'api', 'scripts', 'tests']) {
  const penuh = join(ROOT, d);
  if (!existsSync(penuh)) continue;
  (function jalan2(dir) {
    for (const entri of readdirSync(join(ROOT, dir))) {
      const rel = join(dir, entri);
      const st = statSync(join(ROOT, rel));
      if (st.isDirectory()) { jalan2(rel); continue; }
      if (!/\.(js|jsx|mjs)$/.test(entri)) continue;
      const isi = readFileSync(join(ROOT, rel), 'utf8');
      for (const [re, nama] of POLA) {
        if (re.test(isi)) lapor('secret', rel, `pola ${nama} ditemukan di kode`);
      }
    }
  })(d);
}
console.log('   selesai.');

// ------------------------------------------------------------
console.log('');
if (temuan > 0) {
  console.error(`❌ PENJAGA GERBANG: ${temuan} temuan. Perbaiki sebelum merge.`);
  process.exit(1);
}
console.log('✅ PENJAGA GERBANG: bersih.');
