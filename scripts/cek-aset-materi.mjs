// scripts/cek-aset-materi.mjs
// ============================================================
// CHECKLIST ASET MATERI (Turn 92 — pencegahan insiden 404 bagan svg
// di live turn 91). Memindai SEMUA file IMPOR-*.json (root) dan
// docs/drafts/*.json, mengumpulkan referensi aset:
//   1. lokal  ('/...' -> public/...)  : wajib ADA di disk dan TERTRACK git
//      (public/ di-gitignore -> file baru wajib `git add -f public/...`)
//   2. remote ('http(s)://...')       : opsi --remote untuk HEAD-check
// Jalankan SEBELUM commit konten:  node scripts/cek-aset-materi.mjs [--remote]
// Exit 1 bila ada aset lokal hilang/belum tracked.
// ============================================================
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const remote = process.argv.includes('--remote');

const files = [
  ...readdirSync(ROOT).filter((f) => /^IMPOR-.*\.json$/.test(f)).map((f) => join(ROOT, f)),
  ...readdirSync(join(ROOT, 'docs/drafts')).filter((f) => f.endsWith('.json')).map((f) => join(ROOT, 'docs/drafts', f)),
];

const tracked = new Set(
  execSync('git ls-files', { cwd: ROOT, maxBuffer: 1024 * 1024 * 8 }).toString()
    .split('\n').filter(Boolean),
);

const lokal = new Map();   // path -> [file...]
const remotelist = new Map();

function scan(v, sumber) {
  if (Array.isArray(v)) { v.forEach((x) => scan(x, sumber)); return; }
  if (v && typeof v === 'object') { Object.values(v).forEach((x) => scan(x, sumber)); return; }
  if (typeof v === 'string') {
    if (v.startsWith('/') && /\.(svg|png|jpe?g|webp|gif|mp4|webm)$/i.test(v)) {
      lokal.set(v, [...(lokal.get(v) || []), sumber]);
    } else if (/^https?:\/\//.test(v) && /\.(svg|png|jpe?g|webp|gif|mp4|webm)(\?|#|$)/i.test(v)) {
      remotelist.set(v, [...(remotelist.get(v) || []), sumber]);
    }
  }
}

for (const f of files) {
  try { scan(JSON.parse(readFileSync(f, 'utf-8')), f.split('/').pop()); } catch (e) {
    console.log(`⚠️  ${f.split('/').pop()} tidak bisa dibaca: ${e.message}`);
  }
}

let masalah = 0;
console.log(`=== ${lokal.size} aset lokal, ${remotelist.size} aset remote ===`);
for (const [p, sumber] of lokal) {
  const disk = existsSync(join(ROOT, 'public', p));
  const git = tracked.has(`public${p}`);
  const ok = disk && git;
  if (!ok) masalah += 1;
  console.log(`${ok ? '✅' : '❌'} ${p}  ${disk ? '' : '[TIDAK ADA di public/] '}${git ? '' : '[BELUM tracked git -> git add -f public' + p + '] '} (${sumber[0]})`);
}
if (remote) {
  for (const [u, sumber] of remotelist) {
    try {
      const r = await fetch(u, { method: 'HEAD' });
      console.log(`${r.ok ? '✅' : '❌'} ${r.status} ${u.slice(0, 90)} (${sumber[0]})`);
      if (!r.ok) masalah += 1;
    } catch (e) {
      console.log(`⚠️  HEAD gagal ${u.slice(0, 90)} : ${e.message}`);
    }
  }
} else if (remotelist.size) {
  console.log(`(remote tidak di-HEAD-check; pakai flag --remote bila perlu)`);
}

console.log(masalah ? `\n===== ${masalah} MASALAH ASET =====` : '\n===== SEMUA ASET LOKAL AMAN (ada + tracked) =====');
process.exit(masalah ? 1 : 0);
