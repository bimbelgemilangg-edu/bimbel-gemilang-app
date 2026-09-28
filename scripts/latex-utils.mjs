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
};

export function praMatematika(html) {
  let s = String(html);
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

const PERINTAH_RE = /\\frac\{|\\sqrt|\\times|\\cdot|\\leq|\\geq|\\neq|\\in\b|\\notin|\\subset|\\cup|\\cap|\\rightarrow|\\leftrightarrow|\\oplus|\\nabla|\\pi\b|\\circ|\\pm|\\emptyset|\\bullet|\\langle|\\rangle|\\alpha|\\beta|\\gamma|\\theta|\\lambda|\\Delta|\\sigma|\\mu\b|\\phi|\^\{|_\{/;
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
      if (ch === '{') { if (start < 0) start = i; depth += 1; i += 1; continue; }
      if (ch === '}') { if (start < 0) start = i; depth -= 1; i += 1; continue; }
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

const okKatex = (math) => {
  try { katex.renderToString(math, { throwOnError: true }); return true; } catch { return false; }
};

const fixTekstDalamMat = (m) => m.replace(/(?<![\\A-Za-z])([a-zA-Z][a-zA-Z ]{1,20}[a-zA-Z])(?=[}\)]|$)/g,
  (w) => (FUNGSI.test(w.trim()) ? w : '\\text{' + w.trim() + '}'));

export function naturalisasi(teks) {
  if (!teks) return teks;
  let t = String(teks);
  if (t.includes('$')) return t; // sudah ber-LaTeX manual (konten kurasi)
  let ekor = '';
  const iJ = t.search(/\bJawaban:/);
  if (iJ >= 0) { ekor = ' ' + t.slice(iJ); t = t.slice(0, iJ); }
  for (const p of kandidatPulau(t)) {
    let bersih = p.replace(/\s{2,}/g, ' ').trim();
    bersih = bersih.replace(/%/g, '\\%');
    bersih = fixTekstDalamMat(bersih);
    if (!okKatex(bersih)) continue;
    t = t.split(p).join(`$${bersih}$`);
  }
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
