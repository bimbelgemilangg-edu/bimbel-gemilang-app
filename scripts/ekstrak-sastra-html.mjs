// scripts/ekstrak-sastra-html.mjs
// ============================================================
// EKSTRAKTOR sastra.html (bank owner: Sukses TKA SMA Saintek bab 4)
// Memecah file HTML pindai menjadi data terstruktur:
//   { stimuli: [{petik, paragraf[], sumber}], soal: [{no, teks, tipe,
//     petunjuk?, opsi[], baris[], kolom[]}], kunci: {no: string} }
// Pemakaian: node scripts/ekstrak-sastra-html.mjs <path/sastra.html> [out.json]
// Hasil dipakai scripts/build-sastra-k12-bab4.mjs (turn 88).
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
const out = process.argv[3] || '/tmp/ekstrak-sastra.json';
if (!src) { console.error('butuh path file html'); process.exit(1); }
let html = readFileSync(src, 'utf-8');

// ---------- util bersih teks ----------
const entity = (s) => s
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/&lsquo;|&rsquo;/g, "'")
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
  .replace(/&hellip;/g, '…').replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#10003;/g, '✓')
  .replace(/&rarr;/g, '→');
const stripTag = (s) => entity(s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
// teks dengan pergantian baris: <br> dan </p><p> jadi \n
const teksBergaris = (s) => entity(s
  .replace(/<br\s*\/?>/g, '\n')
  .replace(/<[^>]+>/g, '')
  .split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim()).filter(Boolean).join('\n'));

// ---------- potong area dengan penanda UNIK (hindari toc navigasi) ----------
const iMulai = html.indexOf('id="s4-3"');                       // heading 4.3 Latihan Soal
const iKunci = html.indexOf('KUNCI DAN PEMBAHASAN');            // banner kunci
const iBahasan = html.indexOf('>Pembahasan<');                  // heading Pembahasan
if (iMulai < 0 || iKunci < 0 || iBahasan < 0 || !(iMulai < iKunci && iKunci < iBahasan)) {
  console.error('penanda bagian tidak ditemukan / urutan aneh', { iMulai, iKunci, iBahasan });
  process.exit(1);
}
const areaSoal = html.slice(iMulai, iKunci);
const areaKunci = html.slice(iKunci, iBahasan);
const areaBahas = html.slice(iBahasan);

// ---------- stimuli ----------
const stimuli = [];
{
  const rePetik = /<p class="petik">(Bacalah[\s\S]*?)<\/p>/g;
  let m; const pos = [];
  while ((m = rePetik.exec(areaSoal))) pos.push({ idx: m.index, teks: stripTag(m[1]), end: rePetik.lastIndex });
  pos.forEach((p, i) => {
    const sampai = i + 1 < pos.length ? pos[i + 1].idx : areaSoal.length;
    const blok = areaSoal.slice(p.end, sampai);
    const paras = [];
    const reP = /<p class="in">([\s\S]*?)<\/p>/g; let mp;
    while ((mp = reP.exec(blok))) paras.push(teksBergaris(mp[1]));
    const reS = /<p class="sumber">([\s\S]*?)<\/p>/g.exec(blok);
    stimuli.push({ petik: p.teks, paragraf: paras, sumber: reS ? stripTag(reS[1]) : '' });
  });
}

// ---------- soal (25) ----------
// Tiap <ol class="lst"...> memuat <li> soal ber-indentasi 4 spasi;
// li bersarang (opsi/chk) ber-indentasi lebih dalam -> pecah per indentasi.
const soal = [];
{
  const reOl = /<ol class="lst"[^>]*>([\s\S]*?)<\/ol>/g;
  let mo;
  while ((mo = reOl.exec(areaSoal))) {
    const isi = '\n' + mo[1];
    const bagian = isi.split(/^ {4}<li>/m).slice(1);
    for (let b of bagian) {
      b = b.split(/^ {4}<\/li>/m)[0];
      soal.push(parseSoal(b));
    }
  }
}

function parseSoal(liHtml) {
  const s = { teks: '', tipe: 'pg', petunjuk: '', opsi: [], baris: [], kolom: [] };
  // petunjuk
  const pet = /<span class="petunjuk">([\s\S]*?)<\/span>/.exec(liHtml)
    || /\((Pilihlah kolom[^)]*)\)/.exec(stripTag(liHtml))
    || /(Pilihlah jawaban yang benar! Jawaban benar lebih dari satu\.)/.exec(stripTag(liHtml));
  if (pet) s.petunjuk = stripTag(pet[1] || pet[0]);
  // tipe & struktur
  if (liHtml.includes('class="chk"')) {
    s.tipe = 'pgMulti';
    const reChk = /<ul class="chk">([\s\S]*?)<\/ul>/.exec(liHtml);
    if (reChk) {
      const reLi = /<li>([\s\S]*?)<\/li>/g; let m;
      while ((m = reLi.exec(reChk[1]))) {
        const tanpaCb = m[1].replace(/<span class="cb">[\s\S]*?<\/span>/, '');
        s.opsi.push(stripTag(tanpaCb));
      }
    }
  } else if (/<table class="tbl">/.test(liHtml)) {
    s.tipe = 'tabel';
    const tbl = /<table class="tbl">([\s\S]*?)<\/table>/.exec(liHtml)[1];
    const ths = [...tbl.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => stripTag(m[1]));
    s.kolom = ths.slice(1); // kolom pertama = "Pernyataan"
    const rows = [...tbl.matchAll(/<tr>([\s\S]*?)<\/tr>/g)];
    for (const r of rows.slice(1)) {
      const td = /<td[^>]*>([\s\S]*?)<\/td>/.exec(r[1]);
      if (td) s.baris.push(stripTag(td[1]));
    }
  } else if (/<table class="grid">/.test(liHtml)) {
    // Tata letak opsi 3 kolom seperti cetakan asli (soal #4, #7, #17):
    // sel berbentuk "(A) kisah." di dalam table.grid -> urutkan per huruf.
    s.tipe = 'pg';
    const grid = /<table class="grid">([\s\S]*?)<\/table>/.exec(liHtml)[1];
    const sel = [...grid.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map((m) => stripTag(m[1])).filter(Boolean);
    const pairs = sel.map((c) => {
      const m = /^\(([A-E])\)\s*([\s\S]*)$/.exec(c);
      return m ? { L: m[1], t: m[2].trim() } : null;
    }).filter(Boolean);
    pairs.sort((a, b) => (a.L < b.L ? -1 : 1));
    s.opsi = pairs.map((p) => p.t);
  } else if (liHtml.includes('class="opsi"')) {
    s.tipe = 'pg';
    const reOpt = /<span class="hf">\(([A-E])\)<\/span>\s*<span>([\s\S]*?)<\/span>/g;
    let m; while ((m = reOpt.exec(liHtml))) s.opsi.push(stripTag(m[2]));
  }
  // teks soal = konten sebelum ul/table/petunjuk pertama
  let teks = liHtml
    .replace(/<ul class="(opsi|chk)">[\s\S]*?<\/ul>/g, ' ')
    .replace(/<table class="(tbl|grid)">[\s\S]*?<\/table>/g, ' ')
    .replace(/<span class="petunjuk">[\s\S]*?<\/span>/g, ' ');
  s.teks = stripTag(teks);
  return s;
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

// ---------- pembahasan (urutan = nomor soal) ----------
const pembahasan = [];
{
  // setiap <li> top-level di area bahas; simpan teks + baris keterangan tabel bila ada
  const reLi = /^ {4}<li>([\s\S]*?)^ {4}<\/li>/gm;
  let m;
  while ((m = reLi.exec(areaBahas))) {
    const blok = m[1];
    let teks = '';
    const tbl = /<table class="tbl">([\s\S]*?)<\/table>/.exec(blok);
    if (tbl) {
      const rows = [...tbl[1].matchAll(/<tr>([\s\S]*?)<\/tr>/g)].slice(1);
      const ket = rows.map((r) => {
        const tds = [...r[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)];
        const per = tds.map((t) => stripTag(t[1]));
        return { pernyataan: per[0] || '', benar: (per[1] || '').includes('✓'), salah: (per[2] || '').includes('✓'), ket: per[3] || '' };
      });
      teks = 'TABEL:' + JSON.stringify(ket);
    }
    const jb = /<p class="jb">([\s\S]*?)<\/p>/.exec(blok);
    const tanpaTbl = blok.replace(/<table class="tbl">[\s\S]*?<\/table>/g, ' ');
    pembahasan.push({
      teks: (stripTag(tanpaTbl) + (jb ? ' || ' + stripTag(jb[1]) : '')).trim(),
      tabel: teks.startsWith('TABEL:') ? JSON.parse(teks.slice(6)) : null,
    });
  }
}

// beri nomor
soal.forEach((s, i) => { s.no = i + 1; });

writeFileSync(out, JSON.stringify({ stimuli, soal, kunci, pembahasan }, null, 2));
console.log('stimuli:', stimuli.length,
  '| soal:', soal.length,
  '| kunci:', Object.keys(kunci).length,
  '| pembahasan:', pembahasan.length);
console.log('tipe soal:', soal.map((s) => s.tipe[0].toUpperCase() + (s.tipe === 'pgMulti' ? 'M' : '')).join(''));
console.log('ditulis ke', out);
