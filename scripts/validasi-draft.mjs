// scripts/validasi-draft.mjs
// ============================================================
// VALIDASI DRAFT MATERI JSON (format Impor JSON admin)
//   node scripts/validasi-draft.mjs [path1.json path2.json ...]
// Tanpa argumen: validasi semua docs/drafts/*.json
// ============================================================
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '../docs/drafts');
const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : readdirSync(DIR).filter((f) => f.endsWith('.json')).map((f) => join(DIR, f));

const JENIS_SEC = new Set(['judul', 'paragraf', 'rumus', 'callout', 'contoh', 'gambar', 'langkah']);
const TIPE_CALLOUT = new Set(['info', 'tips', 'peringatan', 'gemilang', 'guru']);
let masalah = 0;
const salah = (f, teks) => { masalah += 1; console.log(`   ❌ ${f}: ${teks}`); };

for (const f of files) {
  console.log(`\n=== ${f.split('/').pop()} ===`);
  let d;
  try {
    d = JSON.parse(readFileSync(f, 'utf-8'));
  } catch (e) { salah(f, `JSON tidak valid: ${e.message}`); continue; }

  const m = d.materi || {};
  if (!m.judul) salah(f, 'materi.judul wajib diisi');
  if (m.jenjang && !['sd', 'smp', 'sma', 'smk', ''].includes(m.jenjang)) salah(f, `jenjang tak dikenal: ${m.jenjang}`);
  if (m.status && !['draft', 'aktif'].includes(m.status)) salah(f, `status tak dikenal: ${m.status}`);
  console.log(`   materi: "${m.judul}" | ${m.mapel || '?'} | jenjang ${m.jenjang || 'semua'} | kelas ${m.kelas || 'semua'}`);

  const babs = Array.isArray(d.bab) ? d.bab : [];
  if (!babs.length) salah(f, 'tidak ada bab sama sekali');
  babs.forEach((b, bi) => {
    const label = `bab[${bi + 1}] "${b.judul || '(tanpa judul)'}"`;
    if (!b.judul) salah(f, `bab[${bi + 1}] tanpa judul`);
    const secs = b.sections || [];
    if (!secs.length) salah(f, `${label}: tanpa sections`);
    secs.forEach((s, si) => {
      const jenis = s.jenis || 'paragraf';
      if (!JENIS_SEC.has(jenis)) { salah(f, `${label} section[${si}] jenis tak dikenal: ${jenis}`); return; }
      if (jenis === 'rumus' && !s.latex && !s.teks) salah(f, `${label} section[${si}] rumus tanpa latex/teks`);
      if (jenis === 'callout' && s.tipe && !TIPE_CALLOUT.has(s.tipe)) salah(f, `${label} section[${si}] callout tipe aneh: ${s.tipe}`);
      if (jenis === 'contoh' && !s.teks) salah(f, `${label} section[${si}] contoh tanpa teks`);
      if (jenis === 'langkah' && !(Array.isArray(s.items) && s.items.length)) salah(f, `${label} section[${si}] langkah tanpa items`);
      if (jenis === 'gambar' && !s.url) salah(f, `${label} section[${si}] gambar tanpa url`);
    });
    const kuis = b.ujiPemahaman || [];
    kuis.forEach((k, ki) => {
      const label2 = `${label} soal[${ki + 1}]`;
      const opsi = Array.isArray(k.opsi) ? k.opsi.filter(Boolean) : [];
      if (!k.soal || String(k.soal).length < 8) salah(f, `${label2}: teks soal terlalu pendek`);
      if (k.tipe && !['pg', 'pgMulti', 'tabel'].includes(k.tipe)) {
        salah(f, `${label2}: tipe tak didukung: ${k.tipe}`);
      }
      if (k.tipe === 'pgMulti') {
        if (!Array.isArray(k.jawaban) || !k.jawaban.length) {
          salah(f, `${label2}: pgMulti butuh jawaban array (indeks yang dicentang)`);
        } else if (k.jawaban.some((x) => x < 0 || x >= opsi.length)) {
          salah(f, `${label2}: indeks pgMulti di luar rentang opsi`);
        }
      }
      if (k.tipe === 'tabel') {
        const baris = Array.isArray(k.baris) ? k.baris : [];
        const kolom = Array.isArray(k.kolom) ? k.kolom : [];
        if (!baris.length || kolom.length < 2) {
          salah(f, `${label2}: tabel butuh baris[] dan kolom[] (>=2)`);
        }
        if (!Array.isArray(k.jawaban) || k.jawaban.length !== baris.length) {
          salah(f, `${label2}: jawaban tabel harus satu indeks kolom per baris`);
        } else if (k.jawaban.some((c) => c == null || c < 0 || c >= kolom.length)) {
          salah(f, `${label2}: indeks kolom jawaban tabel di luar rentang`);
        }
      }
      if (k.tipe !== 'tabel' && opsi.length < 2) salah(f, `${label2}: opsi < 2`);
      if ((k.tipe || 'pg') === 'pg'
        && (typeof k.jawaban !== 'number' || k.jawaban < 0 || k.jawaban >= opsi.length)) {
        salah(f, `${label2}: indeks jawaban ${k.jawaban} di luar rentang 0..${opsi.length - 1}`);
      }
      if (k.perluKunci) console.log(`   ⚠️  ${label2}: ditandai perluKunci`);
      if (k.pembahasanGambar && !/^https?:\/\//.test(k.pembahasanGambar)) {
        salah(f, `${label2}: pembahasanGambar harus URL http(s)`);
      }
    });
    const adaPdf = b.pdfUrl ? '📄' : '';
    const adaHal = (b.halamanBuku || []).length ? `🖼${b.halamanBuku.length}` : '';
    console.log(`   ${label}: ${secs.length} sections, ${kuis.length} soal ${adaPdf}${adaHal}`);
  });
}

console.log(`\n===== ${masalah ? `${masalah} MASALAH` : 'SEMUA DRAFT VALID'} =====`);
process.exit(masalah ? 1 : 0);
