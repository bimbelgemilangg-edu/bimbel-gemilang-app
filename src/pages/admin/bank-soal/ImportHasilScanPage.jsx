// src/pages/admin/bank-soal/ImportHasilScanPage.jsx
// ============================================================
// Halaman import hasil scan AI eksternal (Gemini Canvas, ChatGPT,
// Claude, dsb) ke Bank Soal Gemilang.
//
// Cara pakai:
// 1. Di Gemini Canvas / tool AI lain → klik JSON / CSV
// 2. Copy hasilnya
// 3. Paste di sini → preview → isi metadata → Simpan
//
// Support format JSON:
// - FLAT      : array soal langsung, atau { questions:[...] } / { items:[...] }
//               → format lama, dari import single-soal.
// - TRYOUT    : { mata_pelajaran, jenjang, tryout:[ { paket, soal:[...] } ] }
//               → format multi-paket (mis. 7 paket TKA/Tryout sekaligus).
//               Setiap soal di semua paket otomatis dipecah jadi
//               BUTIRAN SOAL TERPISAH (1 dokumen Firestore / soal),
//               supaya nanti bisa di-mix bebas per topik/kesulitan
//               di Panel Guru, tidak terikat ke satu paket lagi.
// - CSV       : teks saja (tanpa gambar, tanpa multi-paket)
//
// Field yang didukung per soal (baik format lama maupun tryout):
// - materi, capaian_pembelajaran → disimpan supaya Panel Guru bisa
//   filter/mix soal per topik & Capaian Pembelajaran, bukan cuma per mapel.
// - tipe_opsi: 'teks' | 'gambar' | 'tabel' → opsi jawaban bisa berupa
//   teks biasa, opsi berbentuk gambar/grafik, atau opsi berbentuk tabel
//   perbandingan (mis. 2 kolom seperti "Rutherford vs Bohr").
// - gambar_soal / opsi bertipe gambar → path gambar dari AI biasanya
//   HANYA referensi nama file (bukan base64 asli), karena tool scan AI
//   tidak selalu ekspor gambar. Soal tetap disimpan, tapi ditandai
//   "gambar referensi belum diupload" supaya admin tahu harus upload
//   manual lewat menu edit soal nanti.
// - pembahasan → ikut tersimpan (sebelumnya selalu kosong).
// - Rumus matematika/fisika dalam notasi biasa (mis. "akar(a^2+b^2)")
//   otomatis dikonversi ke LaTeX (\sqrt{}, superscript) supaya tampil
//   rapi di preview maupun nanti di soal ujian, tanpa AI harus nulis
//   LaTeX manual.
// ============================================================

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import {
  collection, doc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db, auth } from '../../../firebase';

/* Tailwind CDN auto-load */
const useTailwind = () => {
  useEffect(() => {
    if (!document.querySelector('script[src*="cdn.tailwindcss.com"]')) {
      const s = document.createElement('script');
      s.src = 'https://cdn.tailwindcss.com';
      s.async = true;
      document.head.insertBefore(s, document.head.firstChild);
    }
  }, []);
};

/* KaTeX loader — pakai katex.renderToString (sinkron, no timing issue) */
const useKaTeX = () => {
  const [ready, setReady] = useState(!!window.katex);
  useEffect(() => {
    if (window.katex) { setReady(true); return; }
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css';
    document.head.appendChild(css);
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js';
    script.async = true;
    script.onload = () => setReady(true);
    document.body.appendChild(script);
  }, []);
  return ready;
};

/* ── LaTeX + gambar renderer ── */
function findInlineEnd(text, start, close) {
  for (let i = start; i < text.length; i++) {
    if (text[i] === '\n') return -1;
    if (text.startsWith(close, i)) return i;
    if (text[i] === '\\') i++;
  }
  return -1;
}

function processSegment(text, renderMath) {
  let result = '', i = 0;
  while (i < text.length) {
    if (text[i]==='$'&&text[i+1]==='$'){const e=text.indexOf('$$',i+2);if(e!==-1){result+=renderMath(text.slice(i+2,e),true);i=e+2;continue;}}
    if (text[i]==='$'){const e=findInlineEnd(text,i+1,'$');if(e!==-1){result+=renderMath(text.slice(i+1,e),false);i=e+1;continue;}}
    if (text[i]==='\\' && text[i+1]==='['){const e=text.indexOf('\\]',i+2);if(e!==-1){result+=renderMath(text.slice(i+2,e),true);i=e+2;continue;}}
    if (text[i]==='\\' && text[i+1]==='('){const e=text.indexOf('\\)',i+2);if(e!==-1){result+=renderMath(text.slice(i+2,e),false);i=e+2;continue;}}
    const ch=text[i];
    if(ch==='&') result+='&amp;';
    else if(ch==='<') result+='&lt;';
    else if(ch==='>') result+='&gt;';
    else if(ch==='\n') result+='<br>';
    else result+=ch;
    i++;
  }
  return result;
}

function RichText({ text, gambar, mathReady }) {
  const html = useMemo(() => {
    const safe = typeof text === 'string' ? text : (text ?? '');
    const imgs = (Array.isArray(gambar) ? gambar : []).filter(Boolean);
    const katexLib = mathReady && window.katex ? window.katex : null;
    const renderMath = (math, display) => {
      if (!katexLib) return display ? `<span>$$${math}$$</span>` : `<span>$${math}$</span>`;
      try { return katexLib.renderToString(math, { displayMode: display, throwOnError: false, output: 'html' }); }
      catch { return display ? `$$${math}$$` : `$${math}$`; }
    };
    const esc = v => String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const makeImg = (g, index = 0) => {
      const src = g?.url || g?.dataUrl || null;
      const alt = esc(g?.deskripsi || `Gambar soal ${index + 1}`).replace(/"/g,'&quot;');
      if (src) return `<figure style="margin:10px 0;text-align:center;"><img src="${src}" alt="${alt}" loading="lazy" style="max-width:100%;max-height:420px;object-fit:contain;border-radius:8px;border:1px solid #e5e7eb;background:#fff;padding:4px;"/></figure>`;
      if (g?.refPath) return `<span style="display:inline-block;margin:6px 0;padding:4px 10px;background:#fef3c7;border:1px dashed #d97706;border-radius:6px;font-size:11px;color:#92400e;">🖼️ Referensi gambar: <code>${esc(g.refPath)}</code> — file asli belum tersedia</span>`;
      return '';
    };

    const parts = safe.split(/(\{\{\s*GAMBAR(?:_\d+|_OPSI_\d+)?\s*\}\})/gi);
    let gIdx = 0, result = '';
    for (const part of parts) {
      if (/^\{\{\s*GAMBAR/i.test(part)) result += makeImg(imgs[gIdx++] || {}, gIdx - 1);
      else result += processSegment(part, renderMath);
    }
    // Jika marker tidak ada, tampilkan semua aset visual setelah teks. Ini mencegah
    // gambar benar-benar hilang hanya karena generator JSON tidak menulis marker.
    if (gIdx === 0 && imgs.length) {
      result += imgs.map((g, i) => makeImg(g, i)).join('');
    } else if (gIdx < imgs.length) {
      result += imgs.slice(gIdx).map((g, i) => makeImg(g, gIdx + i)).join('');
    }
    return result;
  }, [text, gambar, mathReady]);

  return <div className="text-sm text-gray-700 leading-relaxed break-words" dangerouslySetInnerHTML={{ __html: html }} />;
}

/* ============================================================
   KONSTANTA
============================================================ */

const BANK_SOAL_COLLECTION = 'bank_soal';

const DAFTAR_MAPEL = [
  'Matematika','Fisika','Kimia','Biologi',
  'Bahasa Indonesia','Bahasa Inggris',
  'Ekonomi','Geografi','Sosiologi','Sejarah',
  'PKN','TPS/Penalaran Umum','Lainnya',
];
const DAFTAR_JENJANG   = ['SD/MI','SMP/MTs','SMA/MA','SMK','UTBK/SNBT'];
const DAFTAR_KELAS     = ['1','2','3','4','5','6','7','8','9','10','11','12','Semua'];
const DAFTAR_KESULITAN = ['mudah','sedang','sulit'];

const TIPE_LABELS = {
  pg_sederhana  : 'PG Sederhana',
  pg_kompleks   : 'PG Kompleks',
  benar_salah   : 'Benar / Salah',
  isian_singkat : 'Isian Singkat',
  menjodohkan   : 'Menjodohkan',
};

const TIPE_OPSI_LABELS = {
  teks  : null, // tidak perlu badge, ini default
  gambar: '🖼️ Opsi Gambar',
  tabel : '📊 Opsi Tabel',
};

/* ============================================================
   AUTO-FORMAT RUMUS MATEMATIKA / FISIKA → LaTeX
   Banyak hasil scan AI menulis rumus dengan notasi teks biasa
   (akar(...), pangkat pakai ^) tanpa delimiter $...$. Fungsi di
   bawah ini mengubahnya jadi LaTeX otomatis supaya tetap tampil
   rapi lewat KaTeX, tanpa AI/pengguna perlu menulis LaTeX manual.
============================================================ */

// Ubah "akar(EXPR)" (boleh nested) → "$\sqrt{EXPR}$", termasuk
// mengonversi pangkat "^n" di dalam EXPR jadi "^{n}".
function convertAkarSqrt(text) {
  if (!text || text.indexOf('akar(') === -1) return text;
  let result = '', i = 0;
  while (i < text.length) {
    const idx = text.indexOf('akar(', i);
    if (idx === -1) { result += text.slice(i); break; }
    result += text.slice(i, idx);
    let depth = 0, j = idx + 4; // posisi di karakter '('
    const start = j;
    for (; j < text.length; j++) {
      if (text[j] === '(') depth++;
      else if (text[j] === ')') { depth--; if (depth === 0) break; }
    }
    if (j >= text.length) { result += text.slice(idx); break; } // tanda kurung tidak lengkap, biarkan apa adanya
    const inner = text.slice(start + 1, j);
    const innerConverted = convertAkarSqrt(inner)
      .replace(/\^(\d+|\([^()]*\))/g, (m, exp) => `^{${exp.startsWith('(') ? exp.slice(1, -1) : exp}}`);
    result += `$\\sqrt{${innerConverted}}$`;
    i = j + 1;
  }
  return result;
}

// Bungkus pola "BASE^EKSPONEN" yang tersisa (di luar akar) dengan $...$
// supaya pangkat tampil sebagai superscript oleh KaTeX.
function wrapPowNotation(text) {
  if (!text || text.indexOf('^') === -1) return text;
  return text.replace(/([A-Za-z0-9]+|\([^()]*\))\^(\d+|\([^()]*\)|[A-Za-z0-9]+)/g, (m, base, exp) => {
    const expClean = exp.startsWith('(') && exp.endsWith(')') ? exp.slice(1, -1) : exp;
    return `$${base}^{${expClean}}$`;
  });
}

function autoFormatMath(text) {
  if (typeof text !== 'string' || !text) return text || '';
  return wrapPowNotation(convertAkarSqrt(text));
}

/* ============================================================
   HELPER: cocokkan nilai bebas (mis. "FISIKA") ke daftar resmi
   (mis. "Fisika") supaya dropdown metadata bisa auto-terisi.
============================================================ */
function matchFromList(value, list) {
  if (!value) return null;
  const v = String(value).trim().toLowerCase();
  return list.find(item => item.toLowerCase() === v) || null;
}

/* ============================================================
   PARSER JSON — FORMAT LAMA (flat array / {questions:[...]})
============================================================ */

function parseFlatJSON(parsed) {
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.questions)) return parsed.questions;
  if (Array.isArray(parsed.items))     return parsed.items;
  return null;
}

/* ============================================================
   PARSER JSON — FORMAT TRYOUT (multi-paket, nested per soal)
   Struktur: { mata_pelajaran, jenjang, sumber_file,
               tryout: [ { paket, soal: [ {...} ] } ] }
   Setiap soal di setiap paket dipecah jadi 1 baris soal mandiri.
============================================================ */

function isDataImage(value) {
  return typeof value === 'string' && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/i.test(value);
}

function isHttpImage(value) {
  return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function normalizeImageObject(g, fallbackDescription = 'Gambar soal') {
  if (!g) return null;
  if (typeof g === 'string') {
    if (isDataImage(g) || isHttpImage(g)) return { deskripsi: fallbackDescription, dataUrl: g };
    return { deskripsi: fallbackDescription, refPath: g };
  }
  if (typeof g !== 'object') return null;

  const dataUrl = g.dataUrl || g.data_url || g.base64 || g.src || g.imageData || g.data || null;
  const url = g.url || g.imageUrl || g.image_url || g.srcUrl || g.publicUrl || null;
  const refPath = g.refPath || g.ref_path || g.path || g.file || g.filename || g.fileName || g.gambar || null;

  // Jangan menganggap URL sebagai base64. Pertahankan tipe sumbernya.
  return {
    ...g,
    deskripsi: String(g.deskripsi || g.description || fallbackDescription),
    ...(isDataImage(dataUrl) ? { dataUrl } : {}),
    ...(isHttpImage(url) ? { url } : {}),
    ...(!isDataImage(dataUrl) && !isHttpImage(url) && refPath ? { refPath: String(refPath) } : {}),
  };
}

function collectImages(value, fallbackDescription = 'Gambar soal') {
  if (!value) return [];
  const source = Array.isArray(value) ? value : [value];
  return source.flatMap(item => {
    if (!item) return [];
    if (typeof item === 'object' && !Array.isArray(item)) {
      // Beberapa generator JSON menyimpan beberapa gambar di field images/gambar_soal.
      const nested = item.images || item.gambar || item.gambar_soal || item.image || item.image_url;
      if (nested && nested !== item) {
        const own = normalizeImageObject(item, fallbackDescription);
        const nestedImages = collectImages(nested, fallbackDescription);
        // Hindari duplikasi jika nested hanya alias dari object yang sama.
        return own && (own.dataUrl || own.url || own.refPath) ? [own, ...nestedImages] : nestedImages;
      }
    }
    const n = normalizeImageObject(item, fallbackDescription);
    return n ? [n] : [];
  });
}

function imageFromOption(o, label) {
  if (!o) return null;
  const candidate = o.gambar || o.image || o.image_url || o.imageUrl || o.dataUrl || o.data_url || o.src || o.url || o.refPath || null;
  const images = collectImages(candidate, `Gambar opsi ${label}`);
  return images[0] || null;
}

function buildOpsiDariSoal(s) {
  const opsi = Array.isArray(s.opsi) ? s.opsi : (Array.isArray(s.opsi_jawaban) ? s.opsi_jawaban : []);
  const tipeOpsi = s.tipe_opsi || 'teks';

  if (tipeOpsi === 'gambar') {
    return opsi.map((o, i) => {
      if (typeof o === 'string') return o;
      const label = o?.label || String.fromCharCode(65 + i);
      const img = imageFromOption(o, label);
      return img ? `{{GAMBAR_OPSI_${i + 1}}}` : autoFormatMath(String(o?.teks ?? o?.text ?? ''));
    });
  }
  if (tipeOpsi === 'tabel') {
    return opsi.map(o => {
      if (typeof o === 'string') return autoFormatMath(o);
      const parts = Object.keys(o)
        .filter(k => k !== 'label' && !['gambar','image','image_url','imageUrl','dataUrl','data_url','src','url','refPath'].includes(k))
        .map(k => `${k}: ${autoFormatMath(String(o[k] ?? ''))}`);
      return `${o.label ? o.label + '. ' : ''}${parts.join(' | ')}`;
    });
  }
  return opsi.map(o => autoFormatMath(String(typeof o === 'object' ? (o.teks ?? o.text ?? '') : o)));
}

function buildGambarDariSoal(s) {
  const candidates = [
    s.gambar,
    s.gambar_soal,
    s.gambarSoal,
    s.images,
    s.image,
    s.image_url,
    s.imageUrl,
    s.ilustrasi,
    s.diagram,
    s.grafik,
    s.figure,
  ].filter(Boolean);

  const refs = [];
  for (const candidate of candidates) {
    refs.push(...collectImages(candidate, 'Gambar/diagram soal'));
  }

  // Opsi gambar juga harus dipertahankan sebagai aset terpisah.
  if (s.tipe_opsi === 'gambar' && Array.isArray(s.opsi)) {
    s.opsi.forEach((o, i) => {
      const img = imageFromOption(o, String.fromCharCode(65 + i));
      if (img) refs.push({ ...img, jenis: 'opsi', opsiIndex: i });
    });
  }

  // Deduplicate berdasarkan dataUrl/url/refPath.
  const seen = new Set();
  return refs.filter(g => {
    const key = g.dataUrl || g.url || g.refPath || JSON.stringify(g);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flattenTryoutFormat(parsed) {
  const list = [];
  (parsed.tryout || []).forEach(paket => {
    (paket.soal || []).forEach(s => {
      list.push({
        nomor            : s.nomor,
        tipe             : 'pg_sederhana',
        teks_soal        : autoFormatMath(String(s.pertanyaan || '')),
        opsi_jawaban     : buildOpsiDariSoal(s),
        kunci_jawaban    : s.kunci_jawaban || '',
        kunci_terverifikasi: true, // sudah ada kunci + pembahasan dari sumber
        pembahasan       : autoFormatMath(String(s.pembahasan || '')),
        materi           : s.materi || '',
        capaian_pembelajaran: s.capaian_pembelajaran || '',
        tipe_opsi        : s.tipe_opsi || 'teks',
        paket            : paket.paket ?? null,
        gambar           : buildGambarDariSoal(s),
      });
    });
  });
  return list;
}

/* Entry point parser JSON: deteksi format lalu kembalikan
   { list, meta } — meta berisi saran auto-isi metadata. */
function parseJSONRoot(raw) {
  const text = raw.trim();
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(cleaned); // throw jika invalid

  // Format TRYOUT multi-paket
  if (parsed && Array.isArray(parsed.tryout)) {
    const list = flattenTryoutFormat(parsed);
    if (list.length === 0) throw new Error('Struktur "tryout" ditemukan tapi tidak ada soal di dalamnya.');
    const totalPaket = parsed.tryout.length;
    return {
      list,
      meta: {
        mataPelajaran: matchFromList(parsed.mata_pelajaran, DAFTAR_MAPEL),
        jenjang      : matchFromList(parsed.jenjang, DAFTAR_JENJANG),
        sumberFile   : parsed.sumber_file || null,
        infoBanner   : `Format Tryout terdeteksi: ${totalPaket} paket, total ${list.length} soal akan diimpor sebagai butiran soal terpisah.`,
      },
    };
  }

  // Format lama (flat)
  const flat = parseFlatJSON(parsed);
  if (flat) return { list: flat, meta: null };

  throw new Error('Format JSON tidak dikenali. Harap pastikan berupa array soal, {questions:[...]}, atau format tryout multi-paket.');
}

/* ============================================================
   PARSER CSV
   Kolom: Nomor,Tipe,Soal,Pernyataan,Tabel Benar-Salah,
          Pasangan,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci
============================================================ */

function parseCSV(raw) {
  const lines = raw.trim().split('\n');
  if (lines.length < 2) throw new Error('CSV kosong atau hanya header.');

  // Ambil header dari baris pertama
  const header = lines[0].split(',').map(h => h.replace(/"/g,'').trim().toLowerCase());

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    // Parse CSV dengan memperhatikan quoted fields
    const cols = [];
    let cur = '', inQ = false;
    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') { inQ = !inQ; }
      else if (line[c] === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += line[c];
    }
    cols.push(cur);

    const get = (key) => {
      const idx = header.indexOf(key);
      return idx >= 0 ? (cols[idx] || '').trim() : '';
    };

    const opsiJawaban = ['opsi a','opsi b','opsi c','opsi d','opsi e']
      .map(k => get(k)).filter(Boolean);

    results.push({
      nomor          : parseInt(get('nomor')) || i,
      tipe           : get('tipe') || 'pg_sederhana',
      teks_soal      : get('soal'),
      opsi_jawaban   : opsiJawaban,
      pernyataan     : get('pernyataan') ? get('pernyataan').split(' | ').filter(Boolean) : [],
      tabel_benar_salah: get('tabel benar-salah') ? get('tabel benar-salah').split(' | ').filter(Boolean) : [],
      pasangan       : [], // CSV tidak support pasangan menjodohkan
      kunci_jawaban  : get('kunci'),
      gambar         : [],
    });
  }

  if (results.length === 0) throw new Error('Tidak ada baris data di CSV.');
  return results;
}

/* ============================================================
   NORMALIZE SOAL
============================================================ */

function normalizeSoal(q, idx) {
  return {
    nomor            : typeof q.nomor === 'number' ? q.nomor : (parseInt(q.nomor) || idx + 1),
    tipe             : q.tipe             || 'pg_sederhana',
    teks_soal        : String(q.teks_soal || q.soal || ''),
    opsi_jawaban     : Array.isArray(q.opsi_jawaban)   ? q.opsi_jawaban   : [],
    pernyataan       : Array.isArray(q.pernyataan)     ? q.pernyataan     : [],
    tabel_benar_salah: Array.isArray(q.tabel_benar_salah) ? q.tabel_benar_salah : [],
    pasangan         : Array.isArray(q.pasangan)       ? q.pasangan.map(p => ({ kiri: String(p.kiri||''), kanan: String(p.kanan||'') })) : [],
    kunci_jawaban    : String(q.kunci_jawaban || q.kunciJawaban || ''),
    kunci_terverifikasi: Boolean(q.kunci_terverifikasi || q.kunciTerverifikasi),
    gambar           : buildGambarDariSoal(q),
    // Field tambahan (dipakai Panel Guru untuk mixing soal per topik):
    pembahasan       : String(q.pembahasan || ''),
    materi           : String(q.materi || ''),
    capaian_pembelajaran: String(q.capaian_pembelajaran || ''),
    tipe_opsi        : q.tipe_opsi || 'teks',
    paket            : q.paket ?? null,
  };
}

/* ============================================================
   BUILD FIRESTORE DOC
============================================================ */

function buildDoc(q, meta) {
  const gambarUrls = (q.gambar || [])
    .map(g => g.uploadedUrl || g.url || (g.dataUrl?.startsWith('https') ? g.dataUrl : null))
    .filter(Boolean);

  // Path gambar dari sumber yang belum sempat diupload — dicatat supaya
  // admin bisa lengkapi manual lewat menu edit soal nanti.
  const gambarReferensiBelumUpload = (q.gambar || [])
    .filter(g => g.refPath && !g.uploadedUrl && !g.url)
    .map(g => g.refPath);

  return {
    nomor            : q.nomor,
    soal             : q.teks_soal,
    tipe             : q.tipe,
    tipeOpsi         : q.tipe_opsi || 'teks',
    opsiJawaban      : q.opsi_jawaban,
    pernyataan       : q.pernyataan,
    tabelBenarSalah  : q.tabel_benar_salah,
    pasangan         : q.pasangan,
    kunciJawaban     : q.kunci_jawaban,
    kunciTerverifikasi: q.kunci_terverifikasi,
    gambarUrls,
    gambarReferensiBelumUpload,
    mataPelajaran    : meta.mataPelajaran,
    tingkatKelas     : meta.tingkatKelas,
    jenjang          : meta.jenjang,
    // Kategori/bab: pakai isian manual admin kalau ada, kalau tidak
    // jatuh ke "materi" hasil scan AI (mis. "Vektor dan Perpindahan").
    kategori         : meta.kategori || q.materi || '',
    materi           : q.materi || '',
    capaianPembelajaran: q.capaian_pembelajaran || '',
    paketAsal        : q.paket, // null kalau bukan dari format tryout
    tags             : meta.tags,
    tingkatKesulitan : meta.tingkatKesulitan,
    pembahasan       : q.pembahasan || '',
    sumberFile       : meta.sumberFile,
    sumberAI         : meta.sumberAI,
    createdAt        : serverTimestamp(),
    createdBy        : auth.currentUser?.uid || null,
    status           : 'aktif',
  };
}

/* ============================================================
   KOMPONEN UTAMA
============================================================ */

export default function ImportHasilScanPage() {
  useTailwind();
  const mathReady = useKaTeX();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // Input
  const [format,    setFormat]    = useState('json'); // 'json' | 'csv'
  const [rawInput,  setRawInput]  = useState('');
  const [sumberAI,  setSumberAI]  = useState('Gemini Canvas');

  // Parse result
  const [soalList,  setSoalList]  = useState([]);
  const [parseError,setParseError]= useState('');
  const [infoBanner, setInfoBanner] = useState('');
  const [expandedPembahasan, setExpandedPembahasan] = useState({});

  // Metadata
  const [mataPelajaran,    setMataPelajaran]    = useState('Matematika');
  const [tingkatKelas,     setTingkatKelas]     = useState('10');
  const [jenjang,          setJenjang]          = useState('SMA/MA');
  const [kategori,         setKategori]         = useState('');
  const [tags,             setTags]             = useState('');
  const [tingkatKesulitan, setTingkatKesulitan] = useState('sedang');
  const [sumberFile,       setSumberFile]       = useState('');

  // Save state
  const [saving,     setSaving]     = useState(false);
  const [saveResult, setSaveResult] = useState(null);
  const [saveLog,    setSaveLog]    = useState([]);

  // Hitung soal dengan gambar base64
  const totalGambar = useMemo(() => soalList.reduce((n, q) => n + (q.gambar || []).length, 0), [soalList]);
  const totalGambarBase64 = useMemo(() => soalList.reduce((n, q) => n + (q.gambar || []).filter(g => isDataImage(g.dataUrl)).length, 0), [soalList]);
  const soalDenganGambar = useMemo(() => soalList.filter(q => (q.gambar||[]).length > 0).length, [soalList]);
  const soalDenganGambarReferensi = useMemo(() => soalList.filter(q => (q.gambar||[]).some(g => g.refPath && !g.dataUrl && !g.url)).length, [soalList]);

  const daftarMateri = useMemo(() => {
    const s = new Set(soalList.map(q => q.materi).filter(Boolean));
    return Array.from(s);
  }, [soalList]);

  const daftarPaket = useMemo(() => {
    const s = new Set(soalList.map(q => q.paket).filter(p => p !== null && p !== undefined));
    return Array.from(s).sort((a,b)=>a-b);
  }, [soalList]);

  /* ── Parse ── */
  const handleParse = useCallback(() => {
    setParseError('');
    setSoalList([]);
    setSaveResult(null);
    setSaveLog([]);
    setInfoBanner('');
    setExpandedPembahasan({});
    if (!rawInput.trim()) { setParseError('Input kosong.'); return; }
    try {
      let rawList, autoMeta = null;
      if (format === 'json') {
        const parsedRoot = parseJSONRoot(rawInput);
        rawList = parsedRoot.list;
        autoMeta = parsedRoot.meta;
      } else {
        rawList = parseCSV(rawInput);
      }
      const normalized = rawList.map((q, i) => normalizeSoal(q, i));
      setSoalList(normalized);

      if (autoMeta) {
        if (autoMeta.mataPelajaran) setMataPelajaran(autoMeta.mataPelajaran);
        if (autoMeta.jenjang) setJenjang(autoMeta.jenjang);
        if (autoMeta.sumberFile && !sumberFile) setSumberFile(autoMeta.sumberFile);
        if (autoMeta.infoBanner) setInfoBanner(autoMeta.infoBanner);
      }
    } catch (e) {
      setParseError(e.message);
    }
  }, [rawInput, format, sumberFile]);

  /* ── File upload ── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.name.endsWith('.json')) setFormat('json');
    else if (file.name.endsWith('.csv')) setFormat('csv');
    const reader = new FileReader();
    reader.onload = ev => setRawInput(ev.target.result || '');
    reader.readAsText(file);
    setSumberFile(file.name);
  };

  /* ── Simpan ke Bank Soal ── */
  const handleSave = async () => {
    if (soalList.length === 0) return;
    setSaving(true);
    setSaveResult(null);
    const log = [];
    const addLog = (msg) => { log.push(msg); setSaveLog([...log]); };

    const meta = {
      mataPelajaran,
      tingkatKelas,
      jenjang,
      kategori,
      tags    : tags.split(',').map(t => t.trim()).filter(Boolean),
      tingkatKesulitan,
      sumberFile,
      sumberAI,
    };

    // Upload gambar base64 jika ada
    const soalProcessed = [...soalList];
    const toUpload = [];
    soalList.forEach((q, qi) => {
      (q.gambar || []).forEach((g, gi) => {
        if (g.dataUrl?.startsWith('data:image')) {
          toUpload.push({ key: `q${qi}-g${gi}-${Date.now()}`, dataUrl: g.dataUrl, qi, gi });
        }
      });
    });

    if (toUpload.length > 0) {
      addLog(`⏳ Upload ${toUpload.length} gambar ke Supabase...`);
      try {
        const urlMap = {};
        const BATCH_UPLOAD = 8;
        for (let start = 0; start < toUpload.length; start += BATCH_UPLOAD) {
          const batchImages = toUpload.slice(start, start + BATCH_UPLOAD);
          const resp = await fetch('/api/uploadBankSoalImages', {
            method : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body   : JSON.stringify({ images: batchImages.map(i => ({ key: i.key, dataUrl: i.dataUrl })) }),
          });
          const raw = await resp.text();
          let result;
          try { result = JSON.parse(raw); } catch { throw new Error(`Respons server bukan JSON (HTTP ${resp.status})`); }
          if (!resp.ok) throw new Error(result?.error || result?.message || `HTTP ${resp.status}`);
          (result.uploaded || []).forEach(u => { if (u?.key && u?.url) urlMap[u.key] = u.url; });
          const failed = (result.errors || []).length;
          addLog(`📤 Batch ${Math.min(start + BATCH_UPLOAD, toUpload.length)}/${toUpload.length}: ${batchImages.filter(i => urlMap[i.key]).length} berhasil${failed ? `, ${failed} gagal` : ''}.`);
        }

        const missing = toUpload.filter(i => !urlMap[i.key]);
        toUpload.forEach(({ key, qi, gi }) => {
          if (urlMap[key]) {
            const gambar = [...(soalProcessed[qi].gambar || [])];
            gambar[gi] = { ...gambar[gi], uploadedUrl: urlMap[key], dataUrl: null };
            soalProcessed[qi] = { ...soalProcessed[qi], gambar };
          }
        });
        if (missing.length) throw new Error(`${missing.length} gambar tidak mendapatkan URL upload. Penyimpanan soal dibatalkan agar gambar tidak hilang.`);
        addLog(`✅ Semua ${toUpload.length} gambar berhasil diupload.`);
      } catch (err) {
        addLog(`❌ Upload gambar gagal: ${err.message}`);
        setSaveResult({ success: false, error: err.message });
        setSaving(false);
        return;
      }
    }

    const totalRefGambar = soalProcessed.reduce((acc, q) =>
      acc + (q.gambar || []).filter(g => g.refPath && !g.dataUrl?.startsWith('data:image')).length, 0);
    if (totalRefGambar > 0) {
      addLog(`ℹ️ ${totalRefGambar} gambar referensi dari sumber belum ada file aslinya — soal tetap disimpan, tambahkan gambar manual nanti lewat menu edit soal.`);
    }

    // Tulis ke Firestore — setiap soal jadi 1 dokumen mandiri (butiran
    // soal terpisah), supaya Panel Guru bebas mix soal lintas paket/topik.
    addLog(`📝 Menyimpan ${soalProcessed.length} soal ke Firestore sebagai butiran soal terpisah...`);
    try {
      const CHUNK = 400; // writeBatch max 500 ops
      let saved = 0;
      for (let i = 0; i < soalProcessed.length; i += CHUNK) {
        const chunk = soalProcessed.slice(i, i + CHUNK);
        const batch = writeBatch(db);
        chunk.forEach(q => {
          const ref = doc(collection(db, BANK_SOAL_COLLECTION));
          batch.set(ref, buildDoc(q, meta));
        });
        await batch.commit();
        saved += chunk.length;
        addLog(`💾 ${saved}/${soalProcessed.length} soal tersimpan...`);
      }
      addLog(`🎉 Selesai! ${soalProcessed.length} soal berhasil masuk Bank Soal sebagai butiran terpisah.`);
      setSaveResult({ success: true, count: soalProcessed.length });
    } catch (err) {
      addLog(`❌ Gagal simpan ke Firestore: ${err.message}`);
      setSaveResult({ success: false, error: err.message });
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <main style={{ flex: 1, marginLeft: isMobile ? 0 : 260, transition: 'margin-left .3s', minHeight: '100vh' }}>
        <div className="p-6 max-w-5xl mx-auto space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Import Hasil Scan AI</h1>
            <p className="text-gray-500 text-sm mt-1">
              Paste hasil JSON / CSV dari Gemini, ChatGPT, Claude, atau tool AI lain → simpan ke Bank Soal.
              Support format tryout multi-paket (banyak soal berbagai mapel/materi) → tiap soal otomatis
              jadi butiran soal terpisah agar bisa di-mix bebas di Panel Guru.
            </p>
          </div>

          {/* Format selector + Source */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <span className="text-sm font-semibold text-gray-600">Format:</span>
              {['json','csv'].map(f => (
                <button key={f} onClick={() => setFormat(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold border transition-all ${format === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-300 hover:border-blue-400'}`}>
                  {f.toUpperCase()}
                  {f === 'json' && <span className="ml-1.5 text-[10px] font-normal opacity-70">Termasuk gambar & tryout multi-paket</span>}
                  {f === 'csv'  && <span className="ml-1.5 text-[10px] font-normal opacity-70">Teks saja</span>}
                </button>
              ))}

              <div className="ml-auto flex items-center gap-2">
                <label className="text-sm text-gray-500">atau upload file:</label>
                <label className="cursor-pointer px-3 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:border-blue-400 bg-white">
                  📂 Pilih file
                  <input type="file" accept=".json,.csv" onChange={handleFile} className="hidden" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Sumber AI</label>
                <input type="text" value={sumberAI} onChange={e => setSumberAI(e.target.value)}
                  placeholder="mis: Gemini Canvas, ChatGPT, Claude..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Nama file sumber (opsional)</label>
                <input type="text" value={sumberFile} onChange={e => setSumberFile(e.target.value)}
                  placeholder="mis: TO TKA Matematika.pdf"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            {/* Textarea */}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Paste {format.toUpperCase()} di sini:
              </label>
              <textarea
                rows={10}
                value={rawInput}
                onChange={e => setRawInput(e.target.value)}
                placeholder={format === 'json'
                  ? '[\n  {\n    "nomor": 1,\n    "tipe": "pg_sederhana",\n    "teks_soal": "...",\n    ...\n  }\n]\n\n— atau format tryout multi-paket —\n{\n  "mata_pelajaran": "FISIKA",\n  "jenjang": "SMA/MA",\n  "tryout": [\n    { "paket": 1, "soal": [ { "nomor": 1, "materi": "...", "pertanyaan": "...", "opsi": [...], "kunci_jawaban": "C", "pembahasan": "..." } ] }\n  ]\n}'
                  : 'Nomor,Tipe,Soal,Opsi A,Opsi B,Opsi C,Opsi D,Opsi E,Kunci\n1,pg_sederhana,"Soal...",A,B,C,D,E,A'}
                className="w-full border border-gray-300 rounded-xl px-3 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              />
            </div>

            {parseError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
                ❌ {parseError}
              </div>
            )}

            <button onClick={handleParse}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">
              🔍 Parse & Preview
            </button>
          </div>

          {/* Preview */}
          {soalList.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <h2 className="font-bold text-gray-800 text-lg">Preview — {soalList.length} soal</h2>
                  {infoBanner && (
                    <p className="text-xs text-indigo-600 mt-0.5">ℹ️ {infoBanner}</p>
                  )}
                  {soalDenganGambar > 0 && (
                    <p className="text-xs text-blue-600 mt-0.5">
                      🖼️ {soalDenganGambar} soal memiliki {totalGambar} aset gambar ({totalGambarBase64} base64 siap diupload ke Supabase)
                    </p>
                  )}
                  {soalDenganGambarReferensi > 0 && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      ⚠️ {soalDenganGambarReferensi} soal punya referensi gambar dari sumber tapi belum ada file aslinya — akan tetap tersimpan, upload manual nanti.
                    </p>
                  )}
                  {daftarPaket.length > 1 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      📦 Berasal dari {daftarPaket.length} paket berbeda: {daftarPaket.join(', ')} — semua akan digabung jadi soal mandiri (tidak terikat paket).
                    </p>
                  )}
                  {daftarMateri.length > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      📚 {daftarMateri.length} materi/topik terdeteksi — otomatis dipakai sebagai kategori tiap soal kecuali kamu isi Kategori manual di bawah.
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">Scroll untuk lihat semua</span>
              </div>

              {/* Soal list (max 50 preview) */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {soalList.map((q, i) => (
                  <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                        Soal {q.nomor}
                      </span>
                      <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        q.tipe==='pg_sederhana'  ?'bg-sky-100 text-sky-700':
                        q.tipe==='pg_kompleks'   ?'bg-violet-100 text-violet-700':
                        q.tipe==='benar_salah'   ?'bg-amber-100 text-amber-700':
                        q.tipe==='isian_singkat' ?'bg-emerald-100 text-emerald-700':
                                                   'bg-rose-100 text-rose-700'
                      }`}>{TIPE_LABELS[q.tipe]||q.tipe}</span>
                      {TIPE_OPSI_LABELS[q.tipe_opsi] && (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                          {TIPE_OPSI_LABELS[q.tipe_opsi]}
                        </span>
                      )}
                      {q.paket !== null && q.paket !== undefined && (
                        <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Paket {q.paket}</span>
                      )}
                      {q.materi && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">{q.materi}</span>
                      )}
                      {(q.gambar||[]).some(g=>g.dataUrl?.startsWith('data:image')) && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">🖼️ ada gambar</span>
                      )}
                      {(q.gambar||[]).some(g=>g.refPath) && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">🖼️ ref. gambar belum diupload</span>
                      )}
                      {q.kunci_jawaban && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-mono">
                          Kunci: {q.kunci_jawaban}
                        </span>
                      )}
                    </div>

                    {/* Teks soal dengan LaTeX dan gambar */}
                    <RichText text={q.teks_soal} gambar={q.gambar} mathReady={mathReady} />

                    {/* Opsi jawaban */}
                    {(q.opsi_jawaban||[]).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {q.opsi_jawaban.slice(0,5).map((opt, oi) => (
                          <div key={oi} className="text-xs text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded flex items-start gap-1">
                            <span className="font-bold text-blue-600 flex-shrink-0">{String.fromCharCode(65+oi)}.</span>
                            <RichText text={opt} gambar={[]} mathReady={mathReady} />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Pembahasan (collapsible) */}
                    {q.pembahasan && (
                      <div className="mt-2">
                        <button
                          onClick={() => setExpandedPembahasan(prev => ({ ...prev, [i]: !prev[i] }))}
                          className="text-xs text-blue-600 font-semibold hover:underline"
                        >
                          {expandedPembahasan[i] ? '▲ Sembunyikan pembahasan' : '▼ Lihat pembahasan'}
                        </button>
                        {expandedPembahasan[i] && (
                          <div className="mt-1 bg-blue-50 border border-blue-100 rounded-lg p-2">
                            <RichText text={q.pembahasan} gambar={[]} mathReady={mathReady} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

              </div>

              {/* Metadata form */}
              <div className="border-t border-gray-100 pt-5">
                <h3 className="font-semibold text-gray-700 mb-3 text-sm">Metadata Soal</h3>
                <p className="text-xs text-gray-400 mb-3">
                  Metadata ini berlaku untuk semua soal di batch ini. Kategori/bab per soal otomatis
                  memakai "materi" dari hasil scan AI jika kolom Kategori di bawah dikosongkan.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Mata Pelajaran *</label>
                    <select value={mataPelajaran} onChange={e=>setMataPelajaran(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_MAPEL.map(m=><option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Jenjang</label>
                    <select value={jenjang} onChange={e=>setJenjang(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_JENJANG.map(j=><option key={j}>{j}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kelas</label>
                    <select value={tingkatKelas} onChange={e=>setTingkatKelas(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_KELAS.map(k=><option key={k} value={k}>Kelas {k}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kategori / Bab (opsional)</label>
                    <input type="text" placeholder="Kosongkan → pakai 'materi' dari soal" value={kategori} onChange={e=>setKategori(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Kesulitan</label>
                    <select value={tingkatKesulitan} onChange={e=>setTingkatKesulitan(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {DAFTAR_KESULITAN.map(k=><option key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Tags (pisah koma)</label>
                    <input type="text" placeholder="UTBK, TKA, Try Out" value={tags} onChange={e=>setTags(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Log */}
              {saveLog.length > 0 && (
                <div className="bg-gray-900 rounded-xl p-4 font-mono text-xs space-y-1 max-h-40 overflow-y-auto">
                  {saveLog.map((l, i) => <div key={i} className="text-green-400">{l}</div>)}
                </div>
              )}

              {/* Result */}
              {saveResult && (
                <div className={`rounded-xl px-4 py-3 text-sm font-medium ${saveResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                  {saveResult.success
                    ? `✅ ${saveResult.count} soal berhasil disimpan ke Bank Soal Gemilang sebagai butiran terpisah!`
                    : `❌ Gagal: ${saveResult.error}`}
                </div>
              )}

              {/* Save button */}
              {!saveResult?.success && (
                <div className="flex justify-end">
                  <button onClick={handleSave} disabled={saving}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                    {saving ? '⏳ Menyimpan...' : `💾 Simpan ${soalList.length} Soal ke Bank Soal`}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}