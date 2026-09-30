// scripts/latex-utils.mjs
// ============================================================
// RUMUS NATURAL ALA BUKU (Turn 100 — arahan owner: "pastikan sistem
// menulis rumus secara natural agar jelas sama seperti buku").
//
//  1. praMatematika(html): markup rumus HTML buku (span.frac n/d,
//     span.sqrt rti+rad, <sup>, <sub>, entitas &times; &middot; &le;
//     &isin; dll) -> notasi LaTeX mentah SEBELUM tag dibuang extractor.
//  2. naturalisasi(teks): membungkus "pulau rumus" dengan $...$ agar
//     MathText/KaTeX merender pecahan bertingkat, pangkat, akar, dsb.
//     seperti buku. Setiap bungkaan DIVALIDASI parser KaTeX; gagal
//     compile = dibiarkan polos (tak pernah tampil merah).
// ============================================================
import katex from 'katex';

const ENTITAS = {
  '&times;': '\\times ', '&middot;': '\\cdot ', '&minus;': '-',
  '&le;': '\\leq ', '&ge;': '\\geq ', '&ne;': '\\neq ',
  '&isin;': '\\in ', '&notin;': '\\notin ', '&cup;': '\\cup ',
  '&cap;': '\\cap ', '&sub;': '\\subset ', '&nsub;': '\\not\\subset ',
  '&plusmn;': '\\pm ', '&oplus;': '\\oplus ', '&nabla;': '\\nabla ',
  '&lang;': '\\langle ', '&rang;': '\\rangle ',
  '&#10216;': '\\langle ', '&#10217;': '\\rangle ',
  '&harr;': '\\leftrightarrow ', '&rarr;': '\\rightarrow ',
  '&empty;': '\\emptyset ', '&bull;': '\\bullet ', '&#9675;': '\\circ ',
  '&deg;': '^\\circ ', '&pi;': '\\pi ', '&alpha;': '\\alpha ',
  '&beta;': '\\beta ', '&gamma;': '\\gamma ', '&theta;': '\\theta ',
  '&lambda;': '\\lambda ', '&Delta;': '\\Delta ', '&sigma;': '\\sigma ',
  '&mu;': '\\mu ', '&phi;': '\\phi ', '&Omega;': '\\Omega ',
  '&compfn;': '\\circ ', '&function;': '\\circ ', '&Prime;': "'", '&prime;': "'",
  '&hArr;': '\\Leftrightarrow ', '&#8660;': '\\Leftrightarrow ', '&rArr;': '\\Rightarrow ',
  '&#8722;': '-', '&infin;': '\\infty ', '&ang;': '\\angle ', '&perp;': '\\perp ',
  '&cong;': '\\cong ', '&sim;': '\\sim ', '&prop;': '\\propto ', '&#8730;': '\\sqrt{\\phantom{x}}',
  '&asymp;': '\\approx ', '&#8776;': '\\approx ', '&ang;': '\\angle ',
};

export function praMatematika(html) {
  let s = String(html);
  // Kurung bertingkat "bkt" = ( + tabel isi + ) -> datarkan dulu agar
  // pemecah sel td tidak terpotong di </td> nested (kasus opsi grid bab 7).
  s = s.replace(
    /<span class="bkt">\s*<span class="ang">([^<]*)<\/span>\s*<table[^>]*>[\s\S]*?<td class="mid">([\s\S]*?)<\/td>[\s\S]*?<\/table>\s*<span class="ang">([^<]*)<\/span>\s*<\/span>/g,
    (m, a, b, c) => a + b + c,
  );
  // fungsi sepotong-sepotong ala buku: { baris1<br>baris2 } -> cases LaTeX
  s = s.replace(/<span class="sys"><span class="b">\{<\/span><span class="rows">([\s\S]*?)<\/span><\/span>/g,
    (m, rows) => '\\begin{cases} ' + rows.replace(/<br\s*\/?>/g, ' \\\\ ').replace(/<[^>]+>/g, '') + ' \\end{cases}');
  // baris rumus terpusat -> block math
  s = s.replace(/<div class="rumc">([\s\S]*?)<\/div>/g, (m, inner) => '\n$' + inner.trim() + '$\n');
  for (let i = 0; i < 6; i++) {
    const before = s;
    s = s.replace(
      /<span class="frac">\s*<span class="n">([\s\S]*?)<\/span>\s*<span class="d">([\s\S]*?)<\/span>\s*<\/span>/g,
      (m, n, d) => `\\frac{${n.trim()}}{${d.trim()}}`,
    );
    if (s === before) break;
  }
  s = s.replace(
    /<span class="sqrt">\s*(?:<span class="rti">([\s\S]*?)<\/span>)?\s*&radic;\s*<span class="rad">([\s\S]*?)<\/span>\s*<\/span>/g,
    (m, rti, rad) => (rti ? `\\sqrt[${rti.trim()}]{${rad.trim()}}` : `\\sqrt{${rad.trim()}}`),
  );
  s = s.replace(/&radic;/g, '\\sqrt{\\phantom{x}}');
  s = s.replace(/<sup>([\s\S]*?)<\/sup>/g, (m, x) => `^{${x.trim()}}`);
  s = s.replace(/<sub>([\s\S]*?)<\/sub>/g, (m, x) => `_{${x.trim()}}`);
  for (const [k, v] of Object.entries(ENTITAS)) s = s.split(k).join(v);
  return s;
}

const PERINTAH_RE = /\\frac\{|\\sqrt|\\times|\\cdot|\\leq|\\geq|\\neq|\\in\b|\\notin|\\subset|\\cup|\\cap|\\rightarrow|\\leftrightarrow|\\oplus|\\nabla|\\pi\b|\\circ|\\pm|\\emptyset|\\bullet|\\langle|\\rangle|\\alpha|\\beta|\\gamma|\\theta|\\lambda|\\Delta|\\sigma|\\mu\b|\\phi|\^\{|_\{|\\\{/;
const KATA_IND = /\b(adalah|yaitu|yakni|sehingga|dengan|untuk|maka|jadi|jika|bila|apabila|kemudian|dan|atau|yang|dari|ke|pada|dalam|luar|hasil|nilai|banyak|jumlah|persen|satuan|buah|orang|tahun|hari|menit|jam|detik|kg|gram|cm|mm|km|meter|liter|derajat|rupiah|ribu|juta|kali|pertandingan|tim|siswa|kelas|kotak|bola|kartu|dadu|koin|titik|garis|sudut|sisi|rusuk|bidang|volume|luas|keliling|tinggi|panjang|lebar|jari|diameter|kelompok|data|tabel|grafik|gambar|nomor|soal|jawaban|cara|langkah|misalkan|diketahui|ditanya|penyelesaian|perhatikan|berdasarkan|menurut|sebesar|setiap|antara|kedua|ketiga|pertama|tersebut|ini|itu|ada|tidak|bukan|lebih|kurang|sama|besar|kecil|Himpunan|himpunan|anggota|gabungan|irisan|komplemen|barisan|deret|suku|bunga|modal|peluang|kejadian|frekuensi|modus|median|rataan|simpangan|kuartil|jangkauan|persamaan|pertidaksamaan|variabel|koefisien|konstanta|substitusi|eliminasi|grafik|himpuan|irisan|kuadrat|akar|pangkat|bilangan|bulat|pecahan|desimal|persentase)\b/i;
const FUNGSI = /^(log|ln|sin|cos|tan|sec|csc|cot|lim|max|min|mod|det)$/i;

// Pulau rumus = substring ASLI berisi perintah LaTeX; kata Indonesia di
// LUAR kurung kurawal menjadi pemisah pulau.
function kandidatPulau(teks) {
  const out = [];
  for (const seg of String(teks).split('\n')) {
    let start = -1; let depth = 0; let i = 0;
    const tutup = (end) => {
      if (start >= 0) {
        const slice = seg.slice(start, end).trim();
        if (slice.length >= 3 && PERINTAH_RE.test(slice)) out.push(slice);
        start = -1;
      }
    };
    while (i < seg.length) {
      const ch = seg[i];
      if (ch === '\\' && /[a-zA-Z]/.test(seg[i + 1] || '')) {
        if (start < 0) start = i;
        let j = i + 1; while (/[a-zA-Z]/.test(seg[j] || '')) j++;
        i = j; continue;
      }
      if (ch === '{') { if (seg[i - 1] === '\\') { i += 1; continue; } if (start < 0) start = i; depth += 1; i += 1; continue; }
      if (ch === '}') { if (seg[i - 1] === '\\') { i += 1; continue; } if (start < 0) start = i; depth -= 1; i += 1; continue; }
      if (depth === 0 && /[a-zA-Z]/.test(ch)) {
        let j = i; while (/[a-zA-Z]/.test(seg[j] || '')) j++;
        const w = seg.slice(i, j);
        const kata = (w.length >= 3 || KATA_IND.test(w)) && !FUNGSI.test(w);
        if (kata) tutup(i); else if (start < 0) start = i;
        i = j; continue;
      }
      if (start < 0 && /\S/.test(ch)) start = i;
      i += 1;
    }
    tutup(seg.length);
  }
  return out;
}

// "&" telanjang (mis. "Eliminasi (1) & (2)") membuat KaTeX menolak seluruh
// pulau; di luar environment begin/end selalu berarti "dan" -> escape \&.
// (Turn 102, kasus pembahasan SPL bab 2 Matematika.)
const escapeAmpLuarEnv = (s) => s
  .split(/(\\begin\{[a-zA-Z*]+\}[\s\S]*?\\end\{[a-zA-Z*]+\})/g)
  .map((p, i) => (i % 2 === 1 ? p : p.split('&').join('\\&')))
  .join('');

const okKatex = (math) => {
  try { katex.renderToString(math, { throwOnError: true }); return true; } catch { return false; }
};

// Nama environment LaTeX (matrix, cases, pmatrix, dst) setelah \begin{ / \end{
// TIDAK boleh dibungkus \text{} — dijaga lookbehind (turn 102: operator kurung
// matriks bab 1 & fungsi sepotong \begin{cases} bab 7).
const fixTekstDalamMat = (m) => m.replace(/(?<![\\A-Za-z])(?<!begin\{)(?<!end\{)(?<!text\{)([a-zA-Z][a-zA-Z ]{1,20}[a-zA-Z])(?=[}\)]|$)/g,
  (w) => (FUNGSI.test(w.trim()) ? w : '\\text{' + w.trim() + '}'));

export function naturalisasi(teks) {
  if (!teks) return teks;
  let t = String(teks);
  if (t.includes('$')) {
    // Teks sudah membawa $...$ manual (rumus asli buku / konten kurasi).
    // Bersihkan sisa align kosong ala buku (rantai "$ = + $") yang tak bermakna.
    return t.replace(/\$[\s=+\\]+\$/g, ' ');
  }
  let ekor = '';
  const iJ = t.search(/\bJawaban:/);
  if (iJ >= 0) { ekor = ' ' + t.slice(iJ); t = t.slice(0, iJ); }
  // Satu-pass anti-tumpang-tindih: kumpulkan semua kemunculan pulau valid,
  // urutkan posisi, rakit ulang sekali jalan — tidak mungkin lahir $$$ dari
  // pulau-pulau rumus yang saling bersinggungan (kasus pembahasan trigono).
  const hits = [];
  for (const p of kandidatPulau(t)) {
    let bersih = p.replace(/\s{2,}/g, ' ').trim();
    bersih = bersih.replace(/%/g, '\\%');
    bersih = escapeAmpLuarEnv(bersih);
    bersih = fixTekstDalamMat(bersih);
    if (!okKatex(bersih)) continue;
    let i = t.indexOf(p);
    while (i >= 0) { hits.push({ i, j: i + p.length, r: '$' + bersih + '$' }); i = t.indexOf(p, i + 1); }
  }
  hits.sort((a, b) => a.i - b.i || b.j - a.j);
  let out = '';
  let last = 0;
  for (const h of hits) {
    if (h.i < last) continue;
    out += t.slice(last, h.i) + h.r;
    last = h.j;
  }
  t = out + t.slice(last);
  t = t + ekor;
  t = t.split('\n').map((bar) => {
    const b = bar.trim();
    if (!b || b.includes('$')) return bar;
    if (PERINTAH_RE.test(b) && !KATA_IND.test(b)
      && /^[0-9A-Za-z_{}\\=+\-/<>,.\s×·°%()|-]+$/.test(b) && okKatex(b)) {
      return `$$${b}$$`;
    }
    return bar;
  }).join('\n');
  return t;
}
