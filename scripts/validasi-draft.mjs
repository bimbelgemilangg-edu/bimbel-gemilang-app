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

const JENIS_SEC = new Set(['judul', 'paragraf', 'rumus', 'callout', 'contoh', 'gambar', 'langkah', 'poin', 'alur', 'tabelinfo', 'istilah', 'kilat', 'peta', 'caraGemilang', 'zona',
  // 🔥 MATERI INTERAKTIF (Turn 87): widget interaktif dalam sections
  'jodohMini', 'isianRumpang', 'flashcard', 'urutan', 'benarSalah', 'video']);
const JENIS_INTERAKTIF = new Set(['jodohMini', 'isianRumpang', 'flashcard', 'urutan', 'benarSalah', 'video']);
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
      if (jenis === 'poin' && !(Array.isArray(s.items) && s.items.length)) salah(f, `${label} section[${si}] poin tanpa items`);
      if (jenis === 'alur' && !(Array.isArray(s.items) && s.items.length)) salah(f, `${label} section[${si}] alur tanpa items`);
      if (jenis === 'tabelinfo' && !(Array.isArray(s.rows) && s.rows.length)) salah(f, `${label} section[${si}] tabelinfo tanpa rows`);
      if (jenis === 'istilah' && !(Array.isArray(s.items) && s.items.length)) salah(f, `${label} section[${si}] istilah tanpa items`);
      // Turn 54: Firestore menolak nested array -> rows/items WAJIB objek {k,v}
      if (jenis === 'tabelinfo' && Array.isArray(s.rows)
        && s.rows.some((r) => Array.isArray(r))) {
        salah(f, `${label} section[${si}] tabelinfo.rows harus objek {k,v} (nested array ditolak Firestore)`);
      }
      if (jenis === 'istilah' && Array.isArray(s.items)
        && s.items.some((r) => Array.isArray(r))) {
        salah(f, `${label} section[${si}] istilah.items harus objek {k,v} (nested array ditolak Firestore)`);
      }
      if (jenis === 'gambar' && !s.url) salah(f, `${label} section[${si}] gambar tanpa url`);
      if (jenis === 'zona' && !(Array.isArray(s.items) && s.items.length)) salah(f, `${label} section[${si}] zona butuh items soal`);
      if (jenis === 'kilat' && !s.teks) salah(f, `${label} section[${si}] kilat tanpa teks`);
      if (jenis === 'peta' && !s.teks) salah(f, `${label} section[${si}] peta tanpa teks`);

      // 🔥 MATERI INTERAKTIF (Turn 87) -- aturan per widget.
      // CATATAN FIRESTORE: nested array DITOLAK -> items harus berisi
      // objek/string, dan field array (mis. jawaban isianRumpang) hanya
      // boleh berisi string.
      if (JENIS_INTERAKTIF.has(jenis) && jenis !== 'video'
        && !(Array.isArray(s.items) && s.items.length)) {
        salah(f, `${label} section[${si}] ${jenis} butuh items`);
      }
      if (jenis === 'jodohMini') {
        const its = Array.isArray(s.items) ? s.items : [];
        if (its.length < 2) salah(f, `${label} section[${si}] jodohMini minimal 2 pasangan`);
        its.forEach((it, k) => {
          if (Array.isArray(it)) { salah(f, `${label} section[${si}] jodohMini.items[${k}] harus objek {kiri,kanan} (nested array ditolak Firestore)`); return; }
          if (!it || !it.kiri || !it.kanan) salah(f, `${label} section[${si}] jodohMini.items[${k}] butuh kiri & kanan`);
        });
      }
      if (jenis === 'isianRumpang') {
        const its = Array.isArray(s.items) ? s.items : [];
        its.forEach((it, k) => {
          if (!it || typeof it === 'string' || !it.teks) { salah(f, `${label} section[${si}] isianRumpang.items[${k}] butuh objek {teks,jawaban}`); return; }
          const jw = it.jawaban;
          const jwOk = (typeof jw === 'string' && jw.trim())
            || (Array.isArray(jw) && jw.length && jw.every((x) => typeof x === 'string' && x.trim()));
          if (!jwOk) salah(f, `${label} section[${si}] isianRumpang.items[${k}] jawaban wajib string / array string (tanpa nested array)`);
        });
      }
      if (jenis === 'flashcard') {
        const its = Array.isArray(s.items) ? s.items : [];
        if (its.length < 2) salah(f, `${label} section[${si}] flashcard minimal 2 kartu`);
        its.forEach((it, k) => {
          if (Array.isArray(it)) { salah(f, `${label} section[${si}] flashcard.items[${k}] harus objek {depan,belakang} (nested array ditolak Firestore)`); return; }
          if (!it || !it.depan || !it.belakang) salah(f, `${label} section[${si}] flashcard.items[${k}] butuh depan & belakang`);
        });
      }
      if (jenis === 'urutan') {
        const its = Array.isArray(s.items) ? s.items : [];
        if (its.length < 2) salah(f, `${label} section[${si}] urutan minimal 2 langkah`);
        its.forEach((it, k) => {
          const ok = (typeof it === 'string' && it.trim())
            || (it && !Array.isArray(it) && typeof it.teks === 'string' && it.teks.trim());
          if (!ok) salah(f, `${label} section[${si}] urutan.items[${k}] harus string / objek {teks}`);
        });
      }
      if (jenis === 'benarSalah') {
        const its = Array.isArray(s.items) ? s.items : [];
        its.forEach((it, k) => {
          if (!it || Array.isArray(it) || !it.teks) { salah(f, `${label} section[${si}] benarSalah.items[${k}] butuh objek {teks,jawaban}`); return; }
          const jw = it.jawaban;
          const jwOk = typeof jw === 'boolean'
            || ['benar', 'salah', 'b', 's', 'true', 'false'].includes(String(jw).toLowerCase().trim());
          if (!jwOk) salah(f, `${label} section[${si}] benarSalah.items[${k}] jawaban harus boolean / 'benar' / 'salah'`);
        });
      }
      if (jenis === 'video') {
        if (!s.url || !/^https?:\/\//.test(String(s.url))) {
          salah(f, `${label} section[${si}] video butuh url http(s) (YouTube/mp4)`);
        }
      }
    });
    const kuis = b.ujiPemahaman || [];
    kuis.forEach((k, ki) => {
      const label2 = `${label} soal[${ki + 1}]`;
      const opsi = Array.isArray(k.opsi) ? k.opsi.filter(Boolean) : [];
      if (!k.soal || String(k.soal).length < 8) salah(f, `${label2}: teks soal terlalu pendek`);
      if (k.tipe && !['pg', 'pgMulti', 'tabel', 'jodoh', 'isian', 'uraian'].includes(k.tipe)) {
        salah(f, `${label2}: tipe tak didukung: ${k.tipe}`);
      }
      if (k.tipe === 'pgMulti') {
        if (!Array.isArray(k.jawaban) || !k.jawaban.length) {
          salah(f, `${label2}: pgMulti butuh jawaban array (indeks yang dicentang)`);
        } else if (k.jawaban.some((x) => x < 0 || x >= opsi.length)) {
          salah(f, `${label2}: indeks pgMulti di luar rentang opsi`);
        }
      }
      if (k.tipe === 'jodoh') {
        const premis = Array.isArray(k.premis) ? k.premis : [];
        const opsi = Array.isArray(k.opsi) ? k.opsi : [];
        if (!premis.length || opsi.length <= premis.length) {
          salah(f, `${label2}: jodohkan butuh premis & opsi lebih banyak (pengecoh)`);
        }
        if (!Array.isArray(k.jawaban) || k.jawaban.length !== premis.length) {
          salah(f, `${label2}: jawaban jodohkan harus per premis`);
        } else if (k.jawaban.some((c) => c == null || c < 0 || c >= opsi.length)) {
          salah(f, `${label2}: indeks respons jodohkan di luar rentang`);
        }
      }
      if (k.tipe === 'isian' && typeof k.jawaban !== 'string') {
        salah(f, `${label2}: isian singkat butuh jawaban string eksak`);
      }
      if (k.tipe === 'uraian' && !k.pembahasan) {
        salah(f, `${label2}: uraian butuh pembahasan sebagai referensi`);
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
      if (!['tabel', 'isian', 'uraian'].includes(k.tipe) && opsi.length < 2) salah(f, `${label2}: opsi < 2`);
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
