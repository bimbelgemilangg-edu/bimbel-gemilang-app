// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 7 — RELASI & FUNGSI, TRANSFORMASI GEOMETRI, DAN TRIGONOMETRI (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 7 Relasi-Fungsi, Transformasi Geometri & Trigonometri h.33-39 (kunci h.22-26; rumus buku ber-markup frac/sqrt/sup dikonversi LaTeX otomatis). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { naturalisasi } from './latex-utils.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-mate7.json', 'utf-8'));

const OCR_FIX = [
 [
  "meneruskan",
  "meneruskan"
 ]
];
function perbaiki(t) {
  let s = String(t);
  for (const [a, b] of OCR_FIX) s = s.split(a).join(b);
  return s.replace(/ {2,}/g, ' ').trim();
}

// ---------- stimulus ----------
function teksStimulus(i) {
  const s = E.stimuli[i];
  return s.paragraf.map(perbaiki).join('\n\n') + (s.sumber ? `\n\n${perbaiki(s.sumber)}` : '');
}

// ---------- kunci (format buku Inggris: huruf, (n,n), T/F, N/O, I/E) ----------
const hurufIdx = (h) => 'ABCDE'.indexOf(String(h).trim().toUpperCase());
function kunciDariPembahasan(no, s) {
  const p = E.pembahasan[no - 1];
  const jw = (p.teks.match(/Jawaban:\s*([\s\S]*)$/) || [])[1] || '';
  if (s.tipe === 'pg') {
    const m = /^([A-E])\b/.exec(jw.trim());
    if (!m) throw new Error(`soal ${no}: pembahasan tanpa kunci huruf (${jw.slice(0, 40)})`);
    return hurufIdx(m[1]);
  }
  if (s.tipe === 'pgMulti') {
    const nums = jw.match(/\d+/g) || [];
    return nums.map((n) => Number(n) - 1);
  }
  if (!p.tabel) throw new Error(`soal ${no}: tabel pembahasan hilang`);
  return p.tabel.map((r) => (r.benar ? 0 : 1));
}
function kunciTabelRingkas(no, kolom, tipe) {
  const raw = String(E.kunci[no] || '').trim();
  if (!raw) return null;
  if (tipe === 'pgMulti') {
    const m = /\(([\d,\s]+)\)/.exec(raw);
    const isi = m ? m[1] : (/^[\d,\s]+$/.test(raw) ? raw : null);
    if (!isi) return null;
    return isi.split(',').map((x) => Number(x.trim()) - 1).filter((x) => !Number.isNaN(x));
  }
  if (tipe === 'pg') return /^[A-E]$/i.test(raw) ? [hurufIdx(raw)] : null;
  const toks = raw.split(',').map((x) => x.trim().toUpperCase());
  return toks.map((t) => {
    if (t === 'TS') return kolom.findIndex((k) => /^(tidak|not)/i.test(k));
    return kolom.findIndex((k) => k.toUpperCase().startsWith(t[0]));
  });
}

const CG = {
 "1": "Derajat ke radian: kalikan $\\frac{\\pi}{180^\\circ}$, lalu sederhanakan pecahannya.",
 "2": "De-Mi-Sa (depan-miring-samping) + Pythagoras; sudut tumpul di kuadran II membuat $\\tan$ negatif.",
 "3": "Reduksi tiap sudut ke sudut istimewa lewat aturan kuadran, baru operasikan.",
 "4": "$\\cos 75^\\circ = \\cos(45^\\circ + 30^\\circ)$ — rumus jumlah sudut.",
 "5": "Dua sudut elevasi = dua persamaan $\\tan$; eliminasi jaraknya.",
 "6": "Tangga miring = sisi miring: $\\sin 60^\\circ = \\frac{t}{5}$.",
 "7": "Rotasi $R(O,180^\\circ)$: $(x,y) \\to (-x,-y)$; baca koordinat titik dari diagram.",
 "8": "Komposisi transformasi: translasi = tambah vektor; refleksi garis $x=k$: $(2k-x,\\, y)$.",
 "9": "Rotasi berpusat $(a,b)$: geser ke pusat O, putar, kembalikan: $(x,y) \\to (-(y-b)+a,\\, (x-a)+b)$.",
 "10": "Dilatasi pusat $P$ faktor $k$: $A' = P + k(A - P)$.",
 "11": "Akar di penyebut: syaratnya RADIKAN > 0 (bukan $\\geq$): selesaikan $x^{2}-3x-10>0$.",
 "12": "Grafik punya invers = lulus uji garis horizontal (bijektif).",
 "13": "Komposisi dikerjakan dari DALAM: $h(a) \\to g \\to f$.",
 "14": "Trik: dari $f(4x+3)=2x-9$, samakan $2x-9=-7$ dulu, lalu $f^{-1}(-7)=4x+3$.",
 "15": "Tabel invers: $g^{-1}(8)$ = cari x dengan $g(x)=8$.",
 "16": "Tarif linear $T = a + bj$; substitusi total, selesaikan j.",
 "17": "Rantai konversi ukuran = rantai fungsi: selesaikan tahap demi tahap.",
 "18": "Fungsi = tiap anggota domain TEPAT SATU pasangan; cek duplikat kolom pertama.",
 "19": "Refleksi $y=1$: $(x, 2-y)$; lanjut sumbu-x: $(x, -(2-y))$.",
 "20": "Kuadran IV: $\\cos(360^\\circ-85^\\circ)=\\cos 85^\\circ$; ko-fungsi $\\cos 85^\\circ=\\sin 5^\\circ$.",
 "21": "Substitusi $p=x-2$ membuka $(f\\circ g)(p)$; $g$ dari $g(2x+1)$.",
 "22": "Dua segitiga siku-siku berbagi sisi: $\\tan 30^\\circ$ & $\\tan 45^\\circ$; luas $=\\frac{1}{2}\\cdot alas\\cdot tinggi$.",
 "23": "Diagonal dari koordinat: $d_1=|AC|, d_2=|BD|$; luas layang-layang $=\\frac{1}{2}d_1 d_2$.",
 "24": "$(h^{-1}\\circ g^{-1}\\circ f^{-1}) = (f\\circ g\\circ h)^{-1}$ — balik urutan, pakai rumus invers yang diberi.",
 "25": "$\\cos\\alpha = \\frac{samping}{miring}$; pecah gambar jadi dua segitiga siku-siku."
};
const CATATAN_KUNCI = {};
const KONSEP = {"9":"Rotasi $90^{\\circ}$ berlawanan jarum jam pusat $P(-1,2)$: geser $P$ ke origin $(2-(-1), 1-2) = (3,-1)$, putar $(x,y) \\to (-y,x)$ menjadi $(1,3)$, kembalikan $(1+(-1), 3+2) = (0,5)$. Jawaban: D","10":"Dilatasi pusat $P(-2,5)$ faktor $k=3$: $Q' = P + 3(Q-P) = (-2 + 3(-3-(-2)), 5 + 3(4-5)) = (-5, 2)$, jadi $p=-5$ dan $q=2$; maka $3p + 5q = 3(-5) + 5(2) = -5$. Jawaban: A"};
function buatPembahasan(no, s, jawaban) {
  const p = E.pembahasan[no - 1];
  let konsep;
  if (s.tipe === 'tabel' && p.tabel) {
    konsep = p.tabel.map((r, i) => {
      const lab = s.kolom[jawaban[i]].toUpperCase();
      const ket = perbaiki(r.ket);
      return `Baris ${i + 1} — ${lab}${ket ? ': ' + ket : ''}`;
    }).join(' ');
  } else {
    konsep = perbaiki(p.teks.replace(/Jawaban:[\s\S]*$/, ''));
  }
  if (KONSEP[no]) konsep = KONSEP[no];
  return `Jalur konsep: ${naturalisasi(konsep)}${CATATAN_KUNCI[no] || ''} Jalur Cara Gemilang: ${CG[no]}`;
}


// ---------- sections (penataan ulang premium) ----------
const sections = [

  // ===== SUBBAB A: RELASI & FUNGSI (7.1-7.2) =====
  { jenis: 'judul', teks: 'Relasi & Fungsi: dari Diagram ke Sifat' },
  { jenis: 'kilat', teks: 'Relasi adalah hubungan antara dua himpunan; fungsi adalah relasi khusus di mana setiap anggota domain dipasangkan TEPAT SATU anggota kodomain. Tiga penyajian: diagram panah, pasangan terurut, dan diagram Kartesius.' },
  { jenis: 'peta', teks: 'Bab 7 adalah puncak aljabar SMA: fungsi menempel di komposisi-invers, transformasi menempel di geometri koordinat, trigonometri menempel di semua soal sudut. Kuasai tes cepat "fungsi atau bukan" dan tabel transformasi — separuh soal bab ini jatuh di sana.' },
  {
    jenis: 'tabelinfo', judul: 'Sifat fungsi (bank 7.2)',
    kolom: ['Sifat', 'Syarat', 'Nama lain'],
    rows: [
      { k: 'Injektif', v: 'Anggota berbeda punya peta berbeda (tak ada dua panah menuju titik sama).', w: 'Satu-satu (into).' },
      { k: 'Surjektif', v: 'Setiap anggota kodomain punya pasangan di domain.', w: 'Pada (onto).' },
      { k: 'Bijektif', v: 'Injektif sekaligus surjektif; korespondensi satu-satu.', w: 'Syarat fungsi punya invers.' },
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek pemahaman: relasi vs fungsi',
    keterangan: 'Gemilang Drill — gunakan tes cepat CG-FUNGSI buku: fungsi itu disiplin.',
    items: [
      { teks: 'Himpunan ${(1,2), (1,3), (2,4)}$ merupakan fungsi.', jawaban: false, penjelasan: 'Anggota domain 1 punya dua pasangan — melanggar tepat satu.' },
      { teks: 'Pada fungsi $f: A \\to B$, range adalah himpunan semua peta di B yang benar-benar terpakai.', jawaban: true, penjelasan: 'Range $\\subseteq$ kodomain.' },
      { teks: 'Fungsi punya invers hanya bila bijektif.', jawaban: true, penjelasan: 'Syarat invers: korespondensi satu-satu.' },
      { teks: 'Diagram panah dengan anggota domain nganggur tetap fungsi dari A ke B.', jawaban: false, penjelasan: 'Semua anggota domain harus mendapat tepat satu panah.' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-FUNGSI: disiplin anak panah',
    teks: 'FUNGSI = setiap anggota domain punya TEPAT SATU anak panah. Pasangan terurut: duplikat kolom pertama dengan pasangan beda = bukan fungsi.',
    items: [
      'Diagram panah: cari domain nganggur atau berpanah ganda.',
      'Pasangan terurut: sorot kolom pertama (domain).',
      'Grafik: uji garis vertikal (fungsi) & garis horizontal (punya invers).',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Relasi "faktor dari" dari $A = {2, 3}$ ke $B = {4, 6, 9}$ disajikan sebagai pasangan terurut ...', opsi: ['${(2,4), (2,6), (3,9)}$', '${(2,4), (3,6), (3,9)}$', '${(4,2), (6,2), (9,3)}$', '${(2,6), (3,4), (3,9)}$', '${(2,4), (2,6), (2,9)}$'], jawaban: 0, pembahasan: 'Jalur konsep: 2 faktor dari 4 dan 6; 3 faktor dari 9. Jalur Cara Gemilang: uji satu-satu tiap pasangan angka.' },
      { soal: 'Fungsi $f: x \\mapsto 2x - 1$ memetakan $3$ ke ...', opsi: ['4', '5', '6', '7', '8'], jawaban: 1, pembahasan: 'Jalur konsep: $f(3) = 2(3)-1 = 5$. Jalur Cara Gemilang: substitusi langsung.' },
      { soal: 'Suatu fungsi dikatakan SURJEKTIF apabila ...', opsi: ['setiap anggota domain berpasangan unik', 'setiap anggota kodomain mempunyai prapeta', 'domain dan kodomain berjumlah sama', 'grafiknya lulus uji garis horizontal', 'inversnya ada'], jawaban: 1, pembahasan: 'Jalur konsep: surjektif = peta menutupi seluruh kodomain. Jalur Cara Gemilang: "sur" = semua terpakai.' },
    ],
  },

  // ===== SUBBAB B: KOMPOSISI & INVERS (7.3-7.4) =====
  { jenis: 'judul', teks: 'Fungsi Komposisi & Invers' },
  { jenis: 'kilat', teks: 'Komposisi $(f \\circ g)(x) = f(g(x))$ dikerjakan dari dalam. Invers membalik pemetaan: $(f \\circ g)^{-1} = g^{-1} \\circ f^{-1}$ — urutan dibalik!' },
  {
    jenis: 'tabelinfo', judul: 'Rumus invers cepat (bank 7.4)',
    kolom: ['Fungsi', 'Invers'],
    rows: [
      { k: '$f(x) = ax + b$', v: '$f^{-1}(x) = \\frac{x - b}{a}$' },
      { k: '$f(x) = \\frac{ax + b}{cx + d}$', v: '$f^{-1}(x) = \\frac{-dx + b}{cx - a}$' },
      { k: '$f(x) = a^{x}$', v: '$f^{-1}(x) = \\,^{a}\\log x$' },
      { k: '$(f \\circ g)(x)$', v: '$(f \\circ g)^{-1}(x) = (g^{-1} \\circ f^{-1})(x)$' },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: fungsi dan inversnya',
    items: [
      { kiri: '$f(x) = 3x - 6$', kanan: '$f^{-1}(x) = \\frac{x + 6}{3}$' },
      { kiri: '$f(x) = \\frac{2x + 1}{x - 3}$', kanan: '$f^{-1}(x) = \\frac{3x + 1}{x - 2}$' },
      { kiri: '$f(x) = 2^{x}$', kanan: '$f^{-1}(x) = \\,^{2}\\log x$' },
      { kiri: '$(f \\circ g)(x)$', kanan: '$(g^{-1} \\circ f^{-1})(x)$' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-INVERS: balik & tukar',
    teks: 'Invers = tukar peran $x$ dan $y$ lalu selesaikan; komposisi invers = BALIK urutan.',
    items: [
      'Linear: pakai $\\frac{x-b}{a}$ langsung.',
      'Pecahan: silang koefisien $\\frac{-dx+b}{cx-a}$.',
      'Nilai $f^{-1}(k)$ tanpa rumus: selesaikan $f(x)=k$.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Jika $f(x) = 2x + 3$ dan $g(x) = x^{2} - 1$, maka $(f \\circ g)(2) = $ ...', opsi: ['3', '6', '9', '11', '13'], jawaban: 2, pembahasan: 'Jalur konsep: $g(2)=3$, lalu $f(3)=9$. Jalur Cara Gemilang: dari dalam dulu.' },
      { soal: 'Invers dari $f(x) = \\frac{3x - 1}{x + 2}$ adalah ...', opsi: ['$f^{-1}(x) = \\frac{-2x - 1}{x - 3}$', '$f^{-1}(x) = \\frac{2x + 1}{3 - x}$', '$f^{-1}(x) = \\frac{x + 2}{3x - 1}$', '$f^{-1}(x) = \\frac{3 - x}{2x + 1}$', '$f^{-1}(x) = \\frac{-2x + 1}{x - 3}$'], jawaban: 0, pembahasan: 'Jalur konsep: rumus silang $\\frac{-dx+b}{cx-a}$ dengan $a=3, b=-1, c=1, d=2$: $\\frac{-2x-1}{x-3}$. Jalur Cara Gemilang: CG-INVERS pecahan.' },
      { soal: 'Diketahui $(f \\circ g)(x) = 6x + 3$ dan $g(x) = 2x - 1$. Maka $f(x) = $ ...', opsi: ['$3x + 6$', '$3x + 3$', '$2x + 6$', '$3x - 6$', '$6x - 3$'], jawaban: 0, pembahasan: 'Jalur konsep: misal $p = 2x-1 \\Rightarrow x = \\frac{p+1}{2}$; $f(p) = 6\\cdot\\frac{p+1}{2}+3 = 3p+6$. Jalur Cara Gemilang: substitusi variabel perantara.' },
    ],
  },

  // ===== SUBBAB C: TRANSFORMASI GEOMETRI (7.5) =====
  { jenis: 'judul', teks: 'Transformasi Geometri: empat gerak dasar' },
  { jenis: 'kilat', teks: 'Translasi menggeser, refleksi mencermin, rotasi memutar, dilatasi memperbesar/mengecilkan. Semua bisa ditulis matriks sehingga komposisinya tinggal kali matriks.' },
  {
    jenis: 'tabelinfo', judul: 'Matriks transformasi (terhadap pusat O)',
    kolom: ['Transformasi', 'Notasi', 'Matriks / aturan'],
    rows: [
      { k: 'Translasi', v: '$T = \\begin{pmatrix} a \\\\ b \\end{pmatrix}$', w: '$(x,y) \\to (x+a, y+b)$' },
      { k: 'Refleksi sumbu-x', v: '$M_x$', w: '$\\begin{pmatrix} 1 & 0 \\\\ 0 & -1 \\end{pmatrix}$' },
      { k: 'Refleksi sumbu-y', v: '$M_y$', w: '$\\begin{pmatrix} -1 & 0 \\\\ 0 & 1 \\end{pmatrix}$' },
      { k: 'Rotasi $90^\\circ$', v: '$R(O,90^\\circ)$', w: '$\\begin{pmatrix} 0 & -1 \\\\ 1 & 0 \\end{pmatrix}$' },
      { k: 'Rotasi $180^\\circ$', v: '$R(O,180^\\circ)$', w: '$\\begin{pmatrix} -1 & 0 \\\\ 0 & -1 \\end{pmatrix}$' },
      { k: 'Dilatasi faktor $k$', v: '$[O, k]$', w: '$\\begin{pmatrix} k & 0 \\\\ 0 & k \\end{pmatrix}$' },
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: langkah komposisi transformasi',
    keterangan: 'Urutan kerja yang benar saat dua transformasi dilanjutkan.',
    items: [
      'Tulis koordinat titik awal',
      'Terapkan transformasi PERTAMA lebih dulu',
      'Hasilnya menjadi masukan transformasi kedua',
      'Bila pusat bukan O, geser pusat ke O dulu dan kembalikan di akhir',
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-TRANSFORMASI: pusat bukan O? geser dulu',
    teks: 'Refleksi garis $x=k$: $(2k-x, y)$; garis $y=k$: $(x, 2k-y)$. Rotasi/dilatasi berpusat $P$: kerjakan $A-P$, transformasi, lalu $+P$.',
    items: [
      'Hafal 4 matriks pokok + 2 rumus refleksi garis.',
      'Komposisi = kali matriks kanan-ke-kiri.',
      'Luas bayangan dilatasi: $k^{2} \\times$ luas awal.',
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: 'Bayangan titik $A(3, -2)$ oleh translasi $T = \\begin{pmatrix} -1 \\\\ 4 \\end{pmatrix}$ adalah ...', opsi: ['$(2, 2)$', '$(4, 2)$', '$(2, -6)$', '$(4, -6)$', '$(-3, 8)$'], jawaban: 0, pembahasan: 'Jalur konsep: $(3-1, -2+4) = (2, 2)$. Jalur Cara Gemilang: translasi = tambah vektor.' },
      { soal: 'Refleksi titik $B(-4, 5)$ terhadap garis $x = 2$ menghasilkan ...', opsi: ['$(8, 5)$', '$(0, 5)$', '$(-8, 5)$', '$(6, 5)$', '$(4, 5)$'], jawaban: 0, pembahasan: 'Jalur konsep: $(2k-x, y) = (4-(-4), 5) = (8, 5)$. Jalur Cara Gemilang: rumus cermin garis vertikal.' },
      { soal: 'Dilatasi pusat $O$ faktor $-2$ pada titik $C(1, 3)$ menghasilkan ...', opsi: ['$(2, 6)$', '$(-2, -6)$', '$(-1, -3)$', '$(3, 1)$', '$(-2, 6)$'], jawaban: 1, pembahasan: 'Jalur konsep: $k(x,y) = -2(1,3) = (-2,-6)$. Jalur Cara Gemilang: faktor negatif = seberang pusat.' },
    ],
  },

  // ===== SUBBAB D: TRIGONOMETRI (7.6) =====
  { jenis: 'judul', teks: 'Trigonometri: sudut, perbandingan, identitas' },
  { jenis: 'kilat', teks: 'Satuan sudut: $180^\\circ = \\pi$ rad. Perbandingan pada segitiga siku-siku: $\\sin = \\frac{de}{mi}$, $\\cos = \\frac{sa}{mi}$, $\\tan = \\frac{de}{sa}$. Identitas pokok: $\\sin^{2}x + \\cos^{2}x = 1$.' },
  {
    jenis: 'tabelinfo', judul: 'Nilai sudut istimewa',
    kolom: ['Sudut', '$\\sin$', '$\\cos$', '$\\tan$'],
    rows: [
      { k: '$0^\\circ$', v: '$0$', w: '$1$', x: '$0$' },
      { k: '$30^\\circ$', v: '$\\frac{1}{2}$', w: '$\\frac{1}{2}\\sqrt{3}$', x: '$\\frac{1}{3}\\sqrt{3}$' },
      { k: '$45^\\circ$', v: '$\\frac{1}{2}\\sqrt{2}$', w: '$\\frac{1}{2}\\sqrt{2}$', x: '$1$' },
      { k: '$60^\\circ$', v: '$\\frac{1}{2}\\sqrt{3}$', w: '$\\frac{1}{2}$', x: '$\\sqrt{3}$' },
      { k: '$90^\\circ$', v: '$1$', w: '$0$', x: 'tak terdefinisi' },
    ],
  },
  {
    jenis: 'poin', judul: 'Tanda per kuadran & rumus jumlah/selisih', items: [
      'Kuadran I semua positif; II hanya $\\sin$; III hanya $\\tan$; IV hanya $\\cos$.',
      '$\\sin(\\alpha \\pm \\beta) = \\sin\\alpha\\cos\\beta \\pm \\cos\\alpha\\sin\\beta$.',
      '$\\cos(\\alpha \\pm \\beta) = \\cos\\alpha\\cos\\beta \\mp \\sin\\alpha\\sin\\beta$.',
      'Konversi: derajat $\\to$ radian kalikan $\\frac{\\pi}{180^\\circ}$; sebaliknya kalikan $\\frac{180^\\circ}{\\pi}$.',
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: reduksi sudut',
    items: [
      { depan: '$\\sin(90^\\circ - x)$', belakang: '$\\cos x$ (ko-fungsi)' },
      { depan: '$\\cos(180^\\circ - x)$', belakang: '$-\\cos x$' },
      { depan: '$\\tan(180^\\circ + x)$', belakang: '$\\tan x$' },
      { depan: '$\\sin(360^\\circ - x)$', belakang: '$-\\sin x$' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-TRIGO: De-Mi-Sa + kuadran',
    teks: 'Segitiga siku-siku: $\\sin=\\frac{de}{mi}$, $\\cos=\\frac{sa}{mi}$, $\\tan=\\frac{de}{sa}$. Sudut besar? Reduksi ke kuadran I-IV dulu, baru nilai istimewa.',
    items: [
      'Tulis kuadran sudutnya untuk menentukan tanda.',
      'Sudut 75/15/105 = paket rumus jumlah/selisih 45 & 30.',
      'Soal ketinggian/jarak: gambar segitiga, tempel $\\tan$ pada sudut elevasi.',
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan ujian', teks: 'Tanda minus kuadran adalah pembunuh nilai terbanyak: $\\cos$ di kuadran II negatif, $\\tan$ di kuadran IV negatif. Selalu tulis kuadran sebelum menghitung.' },
  {
    jenis: 'zona', items: [
      { soal: 'Nilai $\\sin 150^\\circ = $ ...', opsi: ['$-\\frac{1}{2}$', '$\\frac{1}{2}$', '$\\frac{1}{2}\\sqrt{2}$', '$\\frac{1}{2}\\sqrt{3}$', '$-\\frac{1}{2}\\sqrt{3}$'], jawaban: 1, pembahasan: 'Jalur konsep: kuadran II, $\\sin(180^\\circ-30^\\circ)=\\sin 30^\\circ=\\frac{1}{2}$. Jalur Cara Gemilang: CG-TRIGO kuadran II sin positif.' },
      { soal: 'Bentuk $\\frac{2\\sin x \\cos x}{\\cos^{2}x - \\sin^{2}x}$ sama dengan ...', opsi: ['$\\tan x$', '$\\tan 2x$', '$\\sin 2x$', '$\\cot 2x$', '$\\cos 2x$'], jawaban: 1, pembahasan: 'Jalur konsep: pembilang $=\\sin 2x$, penyebut $=\\cos 2x$; hasil $\\tan 2x$. Jalur Cara Gemilang: kenali pola identitas sudut rangkap.' },
      { soal: 'Sebuah tiang setinggi $6$ m dilihat dari jarak $6\\sqrt{3}$ m. Sudut elevasi pengamat adalah ...', opsi: ['$15^\\circ$', '$30^\\circ$', '$45^\\circ$', '$60^\\circ$', '$75^\\circ$'], jawaban: 1, pembahasan: 'Jalur konsep: $\\tan\\theta = \\frac{6}{6\\sqrt{3}} = \\frac{1}{\\sqrt{3}} \\Rightarrow \\theta = 30^\\circ$. Jalur Cara Gemilang: $\\tan$ = depan/samping, cocokkan nilai istimewa.' },
    ],
  },
  { jenis: 'callout', tipe: 'info', judul: 'Bab 7 tuntas', teks: 'Empat keluarga soal bab ini: fungsi & invers, komposisi, transformasi, trigonometri. Saat latihan, beri label keluarga di tiap nomor — pola CG-mu akan terbentuk dalam dua putaran.' },

];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {
  "12": [
    "/gambar-bing/mate7-s12-a.svg",
    "/gambar-bing/mate7-s12-b.svg",
    "/gambar-bing/mate7-s12-c.svg",
    "/gambar-bing/mate7-s12-d.svg",
    "/gambar-bing/mate7-s12-e.svg"
  ]
};
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 7 Relasi-Fungsi, Transformasi Geometri & Trigonometri h.33-39 (kunci h.22-26; rumus buku ber-markup frac/sqrt/sup dikonversi LaTeX otomatis); kunci & pembahasan buku (soal asli #{no})';
const NAT = true;
const GAMBAR_GRUP = {};
const SOAL_GAMBAR = {};
const OPSI_TEKS = {"12":["Grafik A (lihat gambar)","Grafik B (lihat gambar)","Grafik C (lihat gambar)","Grafik D (lihat gambar)","Grafik E (lihat gambar)"]};
const OV = {};
const ujiPemahaman = E.soal.map((s0) => {
  const no = s0.no;
  const nat = (x) => (NAT ? naturalisasi(x) : x);
  const s = { ...s0, teks: nat(perbaiki(s0.teks)), opsi: s0.opsi.map((o) => nat(perbaiki(o))), baris: s0.baris.map((b) => nat(perbaiki(b))), kolom: s0.kolom.map(perbaiki) };
  let jawaban = kunciDariPembahasan(no, s);
  if (OV[no]) jawaban = OV[no].jaw;
  if (OPSI_TEKS[no]) s.opsi = OPSI_TEKS[no];
  const kr = kunciTabelRingkas(no, s.kolom, s.tipe);
  if (kr && !OV[no]) {
    const sama = s.tipe === 'pg' ? kr[0] === jawaban
      : (kr.length === jawaban.length && kr.every((v, i) => v === jawaban[i]));
    if (!sama) throw new Error(`soal ${no}: kunci pembahasan vs tabel ringkas beda (${kr} vs ${jawaban})`);
  }
  if (s.tipe === 'pg' && (jawaban < 0 || jawaban >= s.opsi.length)) throw new Error(`soal ${no} kunci pg di luar opsi`);
  if (s.tipe === 'pgMulti' && jawaban.some((j) => j < 0 || j >= s.opsi.length)) throw new Error(`soal ${no} kunci multi di luar opsi`);
  const kepala = (s.mandiri || s.grup < 0 || !E.stimuli[s.grup]) ? '' : `Bacalah kutipan teks berikut dengan saksama!\n\n${teksStimulus(s.grup)}\n\n`;
  let soalTeks = kepala + s.teks;
  if (s.tipe === 'pgMulti' && !/Jawaban benar lebih dari satu|Pilihlah dua jawaban/.test(soalTeks)) {
    soalTeks += '\n\nPilihlah jawaban yang benar! Jawaban benar lebih dari satu.';
  }
  if (s.tipe === 'tabel') {
    if (!/Benar atau Salah|Tentukan Benar|Setuju|Tentukan setiap/.test(soalTeks)) soalTeks += `\n(Tentukan ${s.kolom[0]}/${s.kolom[1]} untuk setiap pernyataan berikut!)`;
  }
  return {
    soal: soalTeks, tipe: s.tipe,
    ...(s.tipe === 'tabel' ? { kolom: s.kolom, baris: s.baris } : { opsi: s.opsi }),
    ...(OPSI_GAMBAR[no] ? { opsiGambar: OPSI_GAMBAR[no] } : {}),
    ...((GAMBAR_GRUP[s.grup] || SOAL_GAMBAR[no]) ? { soalGambar: GAMBAR_GRUP[s.grup] || SOAL_GAMBAR[no] } : {}),
    jawaban,
    pembahasan: buatPembahasan(no, s, jawaban),
    sumber: SUMBER.replace('{no}', String(no)),
  };
});

// ---------- metadata ----------
const draft = {
  materi: {
    judul: "Matematika — Persiapan TKA 2026 (Edisi Cara Gemilang)",
    mapel: "Matematika", kelas: "", jenjang: "sma", program: 'semua',
    premium: false, warna: "#F59E0B", emoji: "📐",
    deskripsi: "Seri Matematika TKA: bilangan-himpunan-eksponen, sistem persamaan, bangun datar-pythagoras-kesebangunan, barisan-deret, statistika-peluang, bangun ruang, dan relasi-fungsi-transformasi-trigonometri. Semua rumus dirender natural (KaTeX) seperti buku. Impor bab tambahan pakai mode \"tambah\".",
    urutan: 8, status: 'draft',
    daftarPustaka: [
      'Bank owner: salinan digital HTML bab 1,3,4,6,7 buku seri Sukses TKA SMA + tabel kunci di tiap HTML + pembahasan di HTML/PDF "08 Pembahasan"; kunci mengikuti cetakan asli.',
      'Sumber teks adaptasi per stimulus tercantum pada masing-masing teks.',
      'Kartu Cara Gemilang, tabel pola soal, dan Zona Berlatih = Gemilang Drill tim Gemilang mengikuti pola soal bank owner.',
      'Skema widget interaktif: docs/MATERI-INTERAKTIF.md (turn 87).',
    ],
  },
  bab: [{
    judul: "Bab 7 — Relasi & Fungsi, Transformasi Geometri, dan Trigonometri (Edisi Cara Gemilang)",
    ringkasan: "Relasi & fungsi (penyajian, domain-range, injektif/surjektif/bijektif), komposisi & invers (rumus cepat + balik urutan), transformasi geometri (matriks translasi/refleksi/rotasi/dilatasi + pusat bukan O), trigonometri (konversi radian, De-Mi-Sa, sudut istimewa, kuadran, identitas) — semua rumus ditulis LaTeX natural; 25 soal resmi bank (17 pg, 4 pgMulti, 4 tabel B/S) + pembahasan dua jalur ber-LaTeX.",
    estimasiMenit: 75, urutan: 7, tipe: 'teks',
    sections, ujiPemahaman,
  }],
};

const json = JSON.stringify(draft, null, 2);
if (/[\u3400-\u4E00\u3040-\u30FF\uAC00-\uD7AF]/u.test(json)) { console.error('AKSARA ASING!'); process.exit(1); }
for (const sec of sections) {
  if (sec.jenis === 'paragraf') {
    const n = (sec.teks.match(/(?<=[.!?])\s+[A-Z"“]/g) || []).length + 1;
    if (n > 3) { console.error('paragraf >3 kalimat:', sec.teks.slice(0, 50)); process.exit(1); }
  }
}
ujiPemahaman.forEach((q, i) => {
  if (!q.pembahasan.includes('Jalur konsep:') || !q.pembahasan.includes('Jalur Cara Gemilang:')) { console.error('soal', i + 1, 'tidak dua jalur'); process.exit(1); }
});
function nested(v) { if (Array.isArray(v)) return v.some((x) => Array.isArray(x) || nested(x)); if (v && typeof v === 'object') return Object.values(v).some(nested); return false; }
if (nested(draft.bab)) { console.error('nested array!'); process.exit(1); }

const outDraft = join(ROOT, 'docs/drafts/draft-matematika-k12-v1-bab7.json');
const outImpor = join(ROOT, 'IMPOR-MATEMATIKA-BAB7-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-MATEMATIKA-BAB7-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
