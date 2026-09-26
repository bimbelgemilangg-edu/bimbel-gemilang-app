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
const html = readFileSync(src, 'utf-8');

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
const mH2 = /<h2 class="hbar"[^>]*>[\s\S]{0,300}?Latihan Soal/.exec(html);
const iMulai = mH2 ? mH2.index : html.indexOf('Latihan Soal');
const iKunci = html.indexOf('KUNCI DAN PEMBAHASAN');
const iBahasan = html.indexOf('>Pembahasan<');
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
  } else if (/<table class="grid">/.test(liHtml)) {
    s.tipe = 'pg';
    const grid = /<table class="grid">([\s\S]*?)<\/table>/.exec(liHtml)[1];
    const sel = [...grid.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => stripTag(m[1])).filter(Boolean);
    const pairs = sel.map((c) => { const m = /^\(([A-E])\)\s*([\s\S]*)$/.exec(c); return m ? { L: m[1], t: m[2].trim() } : null; }).filter(Boolean);
    pairs.sort((a, b) => (a.L < b.L ? -1 : 1));
    s.opsi = pairs.map((p) => p.t);
  } else if (liHtml.includes('class="opsi"')) {
    s.tipe = 'pg';
    const reOpt = /<span class="hf">\(([A-E])\)<\/span>\s*<span>([\s\S]*?)<\/span>/g;
    let m; while ((m = reOpt.exec(liHtml))) s.opsi.push(stripTag(m[2]));
  }
  s.teks = stripTag(liHtml
    .replace(/<ul class="(opsi|chk)">[\s\S]*?<\/ul>/g, ' ')
    .replace(/<table class="(tbl|grid)">[\s\S]*?<\/table>/g, ' ')
    .replace(/<div class="diagram">[\s\S]*?<\/div>/g, ' '));
  return s;
}

const soal = [];
{
  const reOl = /<ol class="lst"([^>]*)>([\s\S]*?)<\/ol>/g;
  let mo; let nextNo = 1;
  while ((mo = reOl.exec(areaSoal))) {
    const mStart = /start="(\d+)"/.exec(mo[1]);
    let no = mStart ? Number(mStart[1]) : nextNo;
    const bagian = ('\n' + mo[2]).split(/^ {4}<li>/m).slice(1);
    for (let b of bagian) {
      b = b.split(/^ {4}<\/li>/m)[0];
      const s = parseSoal(b);
      s.no = no;
      // soal MANDIRI: membawa bacaan sendiri di dalam butirnya
      // (diawali "Bacalah ..." + paragraf panjang) -> jangan ditempeli
      // stimulus grup.
      s.mandiri = /^Bacalah\b/.test(s.teks) && s.teks.length > 400;
      // grup stimulus: petik terakhir yang posisinya sebelum <ol> ini
      let gi = -1;
      stimuli.forEach((st, i) => { if (st.pos < mo.index) gi = i; });
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
  const tbl = /<table class="kunci">([\s\S]*?)<\/table>/.exec(areaKunci);
  if (tbl) {
    const sel = [...tbl[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => stripTag(m[1])).filter(Boolean);
    for (const s of sel) {
      const m = /^(\d+)\.\s*(.+)$/.exec(s);
      if (m) kunci[Number(m[1])] = m[2].trim();
    }
  }
}

// ---------- pembahasan ----------
const pembahasan = [];
{
  const reLi = /^ {4}<li>([\s\S]*?)^ {4}<\/li>/gm;
  let m;
  while ((m = reLi.exec(areaBahas))) {
    const blok = m[1];
    const tbl = /<table class="tbl">([\s\S]*?)<\/table>/.exec(blok);
    let tabel = null;
    if (tbl) {
      tabel = [...tbl[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1).map((r) => {
        const per = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((t) => stripTag(t[1]));
        return { pernyataan: per[0] || '', benar: (per[1] || '').includes('✓'), salah: (per[2] || '').includes('✓'), ket: per[3] || '' };
      });
    }
    const tanpaTbl = blok.replace(/<table class="tbl">[\s\S]*?<\/table>/g, ' ');
    pembahasan.push({ teks: stripTag(tanpaTbl), tabel });
  }
}

writeFileSync(out, JSON.stringify({ stimuli, soal, kunci, pembahasan }, null, 2));
console.log('stimuli:', stimuli.length, '| soal:', soal.length, '| kunci:', Object.keys(kunci).length, '| pembahasan:', pembahasan.length);
console.log('nomor soal:', soal.map((s) => s.no).join(','));
console.log('tipe:', soal.map((s) => (s.tipe === 'pg' ? 'P' : s.tipe === 'pgMulti' ? 'M' : 'T')).join(''));
console.log('grup per soal:', soal.map((s) => s.grup + 1).join(','));
console.log('->', out);
