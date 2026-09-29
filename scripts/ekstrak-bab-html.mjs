// scripts/ekstrak-bab-html.mjs
// ============================================================
// EKSTRAKTOR GENERIK salinan digital bank owner (seri Sukses TKA
// SMA/Saintek, konversi HTML owner): dipakai bab 1-3 Bahasa
// Indonesia (turn 89) — penerusan pola ekstrak-sastra-html.mjs.
//
// Beda dengan versi sastra: penomoran soal mengikuti atribut
// `start` pada <ol class="lst"> (nomor CETAKAN), karena teks
// petunjuk ("Bacalah ... nomor 12-15") kadang salah cetak
// (kasus bab 3 ejaan). Area dipotong dari heading h2.hbar
// pertama yang memuat "Latihan Soal" s.d. banner kunci.
//
// Pemakaian: node scripts/ekstrak-bab-html.mjs <file.html> [out.json]
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
const out = process.argv[3] || '/tmp/ekstrak-bab.json';
if (!src) { console.error('butuh path file html'); process.exit(1); }
let html = readFileSync(src, 'utf-8');
// Turn 100 (seri Matematika): flag --matematika mengaktifkan konversi
// markup rumus buku (frac/sqrt/sup/sub/entitas) -> LaTeX mentah sebelum
// tag dibuang, supaya renderer KaTeX bisa merender rumus natural.
if (process.argv.includes('--matematika')) {
  const { praMatematika } = await import('./latex-utils.mjs');
  html = praMatematika(html);
}

const entity = (s) => s
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/&lsquo;|&rsquo;/g, "'")
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#10003;/g, '✓')
  .replace(/&rarr;/g, '→');
const stripTag = (s) => entity(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const teksBergaris = (s) => entity(s
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n'));

// ---------- area ----------
const LATIHAN_RE = /<h2 class="hbar"[^>]*>[\s\S]{0,300}?(Latihan Soal|Exercises?)/;
const mH2 = LATIHAN_RE.exec(html);
const iMulai = mH2 ? mH2.index : html.indexOf('Latihan Soal');
// Turn 100: varian banner kunci antar buku (KUNCI DAN PEMBAHASAN /
// KUNCI JAWABAN DAN PEMBAHASAN / "Kunci Jawaban dan Pembahasan"
// gabungan seperti bab statistika). Cari SETELAH heading latihan agar
// tidak kena entri navigasi daftar isi di awal dokumen.
let iKunciRel = html.slice(iMulai).search(/KUNCI (DAN|JAWABAN)/);
let iKunci = iKunciRel >= 0 ? iMulai + iKunciRel : -1;
if (iKunci < 0) iKunci = html.indexOf('>Kunci Jawaban dan Pembahasan<', iMulai);
let iBahasan = iKunci >= 0 ? html.indexOf('>Pembahasan<', iKunci) : -1;
if (iBahasan < 0 && iKunci >= 0) { const kB = html.indexOf('class="ksub">Pembahasan', iKunci); iBahasan = kB >= 0 ? kB : -1; }
if (iBahasan < 0 && iKunci >= 0) iBahasan = html.indexOf('<ol', iKunci);
if (iMulai < 0 || iKunci < 0 || iBahasan < 0 || !(iMulai < iKunci && iKunci < iBahasan)) {
  console.error('penanda area tidak ditemukan', { iMulai, iKunci, iBahasan }); process.exit(1);
}
const areaSoal = html.slice(iMulai, iKunci);
const areaKunci = html.slice(iKunci, iBahasan);
const areaBahas = html.slice(iBahasan);

// ---------- stimuli + grup soal ----------
const stimuli = [];
{
  const rePetik = /<p class="petik">([\s\S]*?)<\/p>/g;
  let m; const pos = [];
  while ((m = rePetik.exec(areaSoal))) pos.push({ idx: m.index, teks: stripTag(m[1]), end: rePetik.lastIndex });
  pos.forEach((p, i) => {
    const sampaiPetik = i + 1 < pos.length ? pos[i + 1].idx : areaSoal.length;
    // bacaan TIDAK PERNAH muncul setelah daftar soal dimulai ->
    // potong blok di <ol class="lst"> pertama (ada soal dengan teks
    // mandiri ber-paragraf di dalam <li>, mis. bab 3 soal 11).
    const olCut = areaSoal.indexOf('<ol class="lst"', p.end);
    const sampai = Math.min(sampaiPetik, olCut < 0 ? sampaiPetik : olCut);
    const blok = areaSoal.slice(p.end, sampai);
    const paras = [];
    const reP = /<p class="in">([\s\S]*?)<\/p>/g; let mp;
    while ((mp = reP.exec(blok))) paras.push(teksBergaris(mp[1]));
    const reS = /<p class="sumber">([\s\S]*?)<\/p>/.exec(blok);
    stimuli.push({ petik: p.teks, paragraf: paras, sumber: reS ? stripTag(reS[1]) : '', pos: p.idx });
  });
}

// ---------- soal: nomor dari atribut start / urutan ----------
function parseSoal(liHtml) {
  const s = { teks: '', tipe: 'pg', opsi: [], baris: [], kolom: [] };
  if (liHtml.includes('class="chk"')) {
    s.tipe = 'pgMulti';
    const reChk = /<ul class="chk">([\s\S]*?)<\/ul>/.exec(liHtml);
    if (reChk) {
      const reLi = /<li>([\s\S]*?)<\/li>/g; let m;
      while ((m = reLi.exec(reChk[1]))) {
        s.opsi.push(stripTag(m[1].replace(/<span class="cb">[\s\S]*?<\/span>/, '')));
      }
    }
  } else if (/<table class="tbl">/.test(liHtml)) {
    s.tipe = 'tabel';
    const tbl = /<table class="tbl">([\s\S]*?)<\/table>/.exec(liHtml)[1];
    s.kolom = [...tbl.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => stripTag(m[1])).slice(1);
    for (const r of [...tbl.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1)) {
      const td = /<td[^>]*>([\s\S]*?)<\/td>/.exec(r[1]);
      if (td) s.baris.push(stripTag(td[1]));
    }
  } else if (liHtml.includes('class="diagram"')) {
    // Opsi bagan = gambar SVG; deskripsi teks diambil dari aria-label
    // (skema soal app tidak mendukung gambar per opsi).
    s.tipe = 'pg';
    const svgs = [...liHtml.matchAll(/<svg[^>]*aria-label="([^"]+)"[^>]*>/g)]
      .map((m) => stripTag(m[1]).replace(/^Opsi\s+[A-E]\s*:\s*/i, '').trim())
      .filter(Boolean);
    s.opsi = svgs;
  } else if (/<ol class="lst2"[^>]*type="A"/.test(liHtml)) {
    // opsi berupa daftar <ol type=A> (huruf implisit urutan)
    s.tipe = 'pg';
    const ol2 = /<ol class="lst2"[^>]*>([\s\S]*?)<\/ol>/.exec(liHtml);
    if (ol2) s.opsi = [...ol2[1].matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => stripTag(m[1]));
  } else if (/<table class="grid">/.test(liHtml)) {
    s.tipe = 'pg';
    const grid = /<table class="grid">([\s\S]*?)<\/table>/.exec(liHtml)[1];
    const sel = [...grid.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => stripTag(m[1])).filter(Boolean);
    const pairs = sel.map((c) => { const m = /^\(([A-E])\)\s*([\s\S]*)$/.exec(c); return m ? { L: m[1], t: m[2].trim() } : null; }).filter(Boolean);
    pairs.sort((a, b) => (a.L < b.L ? -1 : 1));
    s.opsi = pairs.map((p) => (p.t ? p.t : '(lihat grafik pada gambar)'));
  } else if (liHtml.includes('class="opsi"')) {
    s.tipe = 'pg';
    const reOpt = /<span class="hf">\(([A-E])\)<\/span>\s*<span>([\s\S]*?)<\/span>/g;
    let m; while ((m = reOpt.exec(liHtml))) s.opsi.push(stripTag(m[2]));
  }
  s.teks = stripTag(liHtml
    .replace(/<ul class="(opsi|chk)">[\s\S]*?<\/ul>/g, ' ')
    .replace(/<table class="(tbl|grid)">[\s\S]*?<\/table>/g, ' ')
    .replace(/<div class="diagram">[\s\S]*?<\/div>/g, ' '));
  // Turn 98: opsi INLINE tercampur di teks ("... meaning to (A) x. (D) y. (B) z.")
  // -> pecah per penanda huruf, urutkan A-E, bersihkan teks soal.
  if (s.tipe === 'pg' && s.opsi.length === 0 && /\([A-E]\)/.test(s.teks)) {
    const marks = [...s.teks.matchAll(/\(([A-E])\)\s*/g)];
    if (marks.length >= 4) {
      const pairs = marks.map((mk, i2) => {
        const start = mk.index + mk[0].length;
        const end = i2 + 1 < marks.length ? marks[i2 + 1].index : s.teks.length;
        return { L: mk[1], t: s.teks.slice(start, end).trim() };
      });
      pairs.sort((a, b) => (a.L < b.L ? -1 : 1));
      s.opsi = pairs.map((p) => p.t);
      s.teks = s.teks.slice(0, marks[0].index).trim();
    }
  }
  return s;
}

const soal = [];
{
  // Turn 100: pemindai <ol class="lst"> SADAR KEDALAMAN — beberapa bab
  // (Matematika) memiliki <ol> bersarang di dalam li; regex non-greedy
  // lama terpotong di </ol> pertama sehingga soal hilang.
  const blokOl = (str, mulai) => {
    const i = str.indexOf('<ol', mulai);
    if (i < 0) return null;
    const tagEnd = str.indexOf('>', i);
    const reTok = /<ol\b|<\/ol>/g;
    reTok.lastIndex = i;
    let mt; let depth = 0; let end = -1;
    while ((mt = reTok.exec(str))) {
      if (mt[0] === '</ol>') { depth -= 1; if (depth === 0) { end = mt.index; break; } } else depth += 1;
    }
    if (end < 0) return null;
    return {
      idx: i, attrs: str.slice(i, tagEnd), isi: str.slice(tagEnd + 1, end), next: end + 5,
    };
  };
  let pos = 0; let nextNo = 1; let mo;
  while ((mo = blokOl(areaSoal, pos))) {
    pos = mo.next;
    if (!/class="lst"/.test(mo.attrs)) continue;
    const mStart = /start="(\d+)"/.exec(mo.attrs);
    let no = mStart ? Number(mStart[1]) : nextNo;
    const bagian = ('\n' + mo.isi).split(/^ {4}<li>/m).slice(1);
    for (let b of bagian) {
      b = b.split(/^ {4}<\/li>/m)[0];
      const s = parseSoal(b);
      s.no = no;
      // soal MANDIRI: membawa bacaan sendiri di dalam butirnya
      // (diawali "Bacalah ..." + paragraf panjang) -> jangan ditempeli
      // stimulus grup.
      s.mandiri = /^(Bacalah|Read)\b/.test(s.teks) && s.teks.length > 400;
      // grup stimulus: petik terakhir yang posisinya sebelum <ol> ini
      let gi = -1;
      stimuli.forEach((st, i) => { if (st.pos < mo.idx) gi = i; });
      s.grup = gi;
      soal.push(s);
      no += 1;
    }
    nextNo = no;
  }
}

// ---------- kunci ringkas ----------
const kunci = {};
{
  const tbl = /<table class="[^"]*kunci[^"]*"[^>]*>([\s\S]*?)<\/table>/.exec(areaKunci);
  if (tbl) {
    const sel = [...tbl[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((m) => stripTag(m[1])).filter(Boolean);
    let pending = null;
    for (const s of sel) {
      const mp = /^(\d+)\.?$/.exec(s);
      if (mp) { pending = Number(mp[1]); continue; }
      if (pending !== null) { kunci[pending] = s.trim(); pending = null; continue; }
      const m = /^(\d+)\.\s*(.+)$/.exec(s);
      if (m) kunci[Number(m[1])] = m[2].trim();
    }
  }
}

// ---------- pembahasan ----------
const pembahasan = [];
{
  // Turn 100: split berbasis pembuka li 4-spasi (penutup bisa inline
  // seperti di buku statistika); isi di-strip tag kemudian.
  const bagian = ('\n' + areaBahas).split(/^ {4}<li>/m).slice(1);
  for (let blok of bagian) {
    blok = blok.split(/^ {0,4}<\/li>/m)[0];
    const tbl = /<table class="[^"]*tbl[^"]*"[^>]*>([\s\S]*?)<\/table>/.exec(blok);
    let tabel = null;
    if (tbl) {
      tabel = [...tbl[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1).map((r) => {
        const per = [...r[1].matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/g)].map((t) => stripTag(t[1]));
        return { pernyataan: per[0] || '', benar: (per[1] || '').includes('✓'), salah: (per[2] || '').includes('✓'), ket: per[3] || '' };
      });
    }
    const tanpaTbl = blok.replace(/<table[^>]*>[\s\S]*?<\/table>/g, ' ');
    pembahasan.push({ teks: stripTag(tanpaTbl), tabel });
  }
}

writeFileSync(out, JSON.stringify({ stimuli, soal, kunci, pembahasan }, null, 2));
console.log('stimuli:', stimuli.length, '| soal:', soal.length, '| kunci:', Object.keys(kunci).length, '| pembahasan:', pembahasan.length);
console.log('nomor soal:', soal.map((s) => s.no).join(','));
console.log('tipe:', soal.map((s) => (s.tipe === 'pg' ? 'P' : s.tipe === 'pgMulti' ? 'M' : 'T')).join(''));
console.log('grup per soal:', soal.map((s) => s.grup + 1).join(','));
console.log('->', out);
