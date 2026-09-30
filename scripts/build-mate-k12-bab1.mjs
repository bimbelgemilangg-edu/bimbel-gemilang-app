// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 1 — BILANGAN, HIMPUNAN, DAN EKSPONEN (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 1 Bilangan-Himpunan-Eksponen (soal+kunci+pembahasan bawaan HTML bank owner; rumus buku dikonversi LaTeX otomatis; salah cetak soal 13 dikoreksi mengikuti pembahasan resmi). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { naturalisasi } from './latex-utils.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-mate1.json', 'utf-8'));

const OCR_FIX = [
 [
  "\\frac{}{} ",
  ""
 ],
 [
  "\\frac{}{}",
  ""
 ],
 [
  "\\sqrt{\\phantom{x}} 32",
  "\\sqrt{32}"
 ],
 [
  "\\sqrt{\\phantom{x}} 4\\cdot 8",
  "\\sqrt{4 \\cdot 8}"
 ],
 [
  "\\sqrt{\\phantom{x}} 4\\cdot 2",
  "\\sqrt{4 \\cdot 2}"
 ],
 [
  "\\sqrt{\\phantom{x}} 8",
  "\\sqrt{8}"
 ],
 [
  "&#125;",
  ""
 ],
 [
  "(\\sqrt{6} - \\sqrt{2})",
  "(\\sqrt{5} - \\sqrt{2})"
 ],
 [
  "\\langle a b d e \\rangle c f",
  "\\left\\langle \\begin{matrix} a & b \\\\ d & e \\end{matrix} \\right\\rangle c\\; f"
 ],
 [
  "\\langle 4 b 3 2 \\rangle",
  "\\left\\langle \\begin{matrix} 4 & b \\\\ 3 & 2 \\end{matrix} \\right\\rangle"
 ],
 [
  "A = {x | 3 < x < 7, x \\in bilangan asli}",
  "A = \\{x \\mid 3 < x < 7,\\ x \\in \\text{bilangan asli}\\}"
 ],
 [
  "B = {x | x bilangan ganjil, x \\in bilangan cacah}",
  "B = \\{x \\mid x\\ \\text{bilangan ganjil},\\ x \\in \\text{bilangan cacah}\\}"
 ],
 [
  "C = {x | x \\leq 10, x \\in bilangan prima}",
  "C = \\{x \\mid x \\leq 10,\\ x \\in \\text{bilangan prima}\\}"
 ],
 [
  "A = {x | x \\leq 10, x \\in bilangan genap positif}",
  "A = \\{x \\mid x \\leq 10,\\ x \\in \\text{bilangan genap positif}\\}"
 ],
 [
  "B = {x | x < 13, x \\in bilangan cacah}",
  "B = \\{x \\mid x < 13,\\ x \\in \\text{bilangan cacah}\\}"
 ],
 [
  "P \\cap Q = {1, 2, 3, 4, 5, 6}",
  "P \\cap Q = \\{1, 2, 3, 4, 5, 6\\}"
 ],
 [
  "(P \\cup Q)^{c} = {7, 8}",
  "(P \\cup Q)^{c} = \\{7, 8\\}"
 ],
 [
  "P - Q = {1, 2, 3}",
  "P - Q = \\{1, 2, 3\\}"
 ],
 [
  "diagram venn berikut! S P Q 1 2 3 4 5 6 7 8 Tentukan",
  "diagram Venn berikut! Himpunan semesta $S = \\{1, 2, 3, 4, 5, 6, 7, 8\\}$; lingkaran $P$ memuat $\\{1, 2, 3, 4\\}$ dan lingkaran $Q$ memuat $\\{4, 5, 6\\}$ (irisan keduanya adalah angka $4$); angka $7$ dan $8$ berada di luar kedua lingkaran. Tentukan"
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
 "1": "Samakan wujud dulu: $3\\frac{3}{8} = 3,375$ dan $125\\% = 1,25$; kerjakan $\\times$ dan $:$ sebelum $+$ dan $-$ (Kabataku).",
 "2": "Bakteri = pangkat 2: $n = \\frac{t}{T} = \\frac{600}{20} = 30$ periode; serap faktor $2$ dari $10 = 5 \\cdot 2$ ke basis jadi $5 \\cdot 2^{31}$.",
 "3": "Ubah semua ke basis prima $2$ dan $3$, kurangkan pangkatnya: $2^{2/3 - 1/3} \\cdot 3^{1/6 - 1/2} = \\left(\\frac{2}{3}\\right)^{1/3}$.",
 "4": "Gabungkan jadi satu pangkat: $2^{2026} \\times 7^{2026} \\times 7 = 14^{2026} \\times 7$; satuan $14^{n}$ bergantian $4$-$6$ (ganjil-genap), $2026$ genap.",
 "5": "Beda tipis = skor $3$-$2$: Gol A $= 3a$, Gol B $= 2a + 3b$, selisih $= 3b - a$ terbesar saat $a$ terkecil yang masih mayoritas ($a = 6, b = 5$).",
 "6": "Daftarkan anggota dulu baru operasi: $A \\cap B$ = yang kembar di keduanya, lalu $\\cup\\ C$ menambahkan semua anggota $C$.",
 "7": "Subset = \"semua anggota A ada di B\": daftar kedua himpunan, cek satu-satu arah panahnya.",
 "8": "Definisi adalah raja: pasang $a = 4$, $c = 2$, $d = 3$, $e = 2$, $f = -1$ ke $a(b + c) - d \\times e + f = 4b + 1 \\geq 5$.",
 "9": "$\\sqrt[3]{32.768} = 32$ (ingat $32^{3}$); dan \"bagi $25\\%$\" = \"kali $4$\" karena $25\\% = \\frac{1}{4}$.",
 "10": "Kerjakan dari dalam: $3 \\oplus 1 = 3$ dulu, baru selesaikan $\\frac{6r}{r + 1} = 4$ dengan kali silang.",
 "11": "Pecahkan ketiganya ke desimal: $0,19$; $0,1909\\ldots$; $0,193$ — selisih tipis, butuh $4$ angka di belakang koma.",
 "12": "Ubah cerita jadi pertidaksamaan pangkat: $100 \\cdot 2^{t/20} \\geq 80\\% \\times 16.000 \\Rightarrow 2^{t/20} \\geq 2^{7} \\Rightarrow t \\geq 140$ menit.",
 "13": "Pola selisih kuadrat $(\\sqrt{5} + \\sqrt{2})(\\sqrt{5} - \\sqrt{2}) = 5 - 2 = 3$; rasionalkan $\\frac{3}{2 + \\sqrt{3}}$ dengan sekawan $2 - \\sqrt{3}$.",
 "14": "Pasangan sekawan: penyebut jadi $4 - 3 = 1$; pembilang $(2 + \\sqrt{3})^{2} + (2 - \\sqrt{3})^{2}$ — suku akarnya saling menghilangkan.",
 "15": "Satukan pecahan: $x^{-1} + y^{-1} = \\frac{x + y}{xy}$; akar dari kuadrat sempurna turun ke bawah jadi $\\frac{\\sqrt{x + y}}{xy}$.",
 "16": "Samakan basis dulu ($27 = 3^{3}$), baru samakan pangkatnya: $2x - 1 = 3x + 9$.",
 "17": "Menara pangkat diruntuhkan dari dalam: $2^{xyz} = ((2^{x})^{y})^{z} = (5^{y})^{z} = 4^{z} = 3$; sisa $2^{2} = 4$ tinggal dikali.",
 "18": "Skor $= 4b - s$ (kosong $= 0$), ambang terima $325$; hitung per orang: benar $\\times 4$ dikurang salah $\\times 1$.",
 "19": "Tulis dulu ketiga himpunan lengkap, baru uji tiap pernyataan pakai $\\cap$ (kembar) dan $\\cup$ (gabung tanpa dobel).",
 "20": "Substitusi $a = -1$ ke dua ruas: $\\frac{1}{4} < f(a) < 4$ — tanda $<$ tegas, nilai batas TIDAK ikut.",
 "21": "Terjemahkan definisi ke rumus: $\\Delta(a, b) = \\frac{a + b}{a}$ dan $\\nabla(a, b) = ab + 2b$; uji pernyataan satu-satu.",
 "22": "Akar bersarang: $\\sqrt{6 + \\sqrt{32}} = \\sqrt{6 + 2\\sqrt{8}}$; cari dua bilangan jumlah $6$ kali $8$ yaitu $4$ dan $2$ → $\\sqrt{4} + \\sqrt{2}$.",
 "23": "Baca Venn per daerah: $P \\cap Q$ = irisan saja, $(P \\cup Q)^{c}$ = di luar kedua lingkaran, $P - Q$ = $P$ buang irisan.",
 "24": "Kuadrat tersamar: misal $p = 5^{x}$, faktorkan $p^{2} - 126p + 125 = (p - 125)(p - 1)$.",
 "25": "Substitusi $b = 2$ ke definisi, dapat $a^{2} - 4a = 0$; ambil $a = 4$ (bulat positif, $a \\neq 2$ agar penyebut bukan nol)."
};
const CATATAN_KUNCI = {"13":" (Catatan: cetakan buku menuliskan faktor $(\\sqrt{6} - \\sqrt{2})$ pada soal, tetapi pembahasan resmi menghitung selisih kuadrat $5 - 2 = 3$ — artinya faktor kedua yang dimaksud adalah $(\\sqrt{5} - \\sqrt{2})$. Teks soal di sini dikoreksi mengikuti pembahasan agar konsisten dengan opsi dan kunci C.)"};
const KONSEP = {"4":"Gabungkan ke pangkat sama: $2 \\cdot 2^{2025} \\times 7^{2027} = 2^{2026} \\times 7^{2026} \\times 7 = 14^{2026} \\times 7$. Angka satuan $14^{n}$: $14^{1} \\to 4$, $14^{2} \\to 6$, $14^{3} \\to 4$, $14^{4} \\to 6$ — pola berulang tiap $2$: pangkat ganjil $\\to 4$, pangkat genap $\\to 6$. Karena $2026$ genap, satuan $14^{2026} = 6$; maka satuan $14^{2026} \\times 7$ = satuan dari $6 \\times 7 = 42$ yaitu $2$. Jawaban: B","6":"Daftar anggota: $A = \\{4, 5, 6\\}$ (asli antara $3$ dan $7$), $B = \\{1, 3, 5, 7, 9, 11, \\ldots\\}$ (ganjil), $C = \\{2, 3, 5, 7\\}$ (prima $\\leq 10$). Irisan $A \\cap B = \\{5\\}$ (satu-satunya anggota $A$ yang ganjil). Maka $(A \\cap B) \\cup C = \\{5\\} \\cup \\{2, 3, 5, 7\\} = \\{2, 3, 5, 7\\}$. Jawaban: E","7":"$A = \\{2, 4, 6, 8, 10\\}$ (genap positif $\\leq 10$) dan $B = \\{0, 1, 2, \\ldots, 12\\}$ (cacah $< 13$). Setiap anggota $A$ juga anggota $B$, tetapi ada anggota $B$ (misalnya $1$) yang bukan anggota $A$; jadi hubungannya $A \\subset B$ (A himpunan bagian sejati dari B). Jawaban: B","8":"Definisi operasi: $\\left\\langle \\begin{matrix} a & b \\\\ d & e \\end{matrix} \\right\\rangle c\\; f = a(b + c) - d \\times e + f$. Untuk $A = \\left\\langle \\begin{matrix} 4 & b \\\\ 3 & 2 \\end{matrix} \\right\\rangle 2\\; (-1)$ berarti $a = 4$, $d = 3$, $e = 2$, $c = 2$, $f = -1$, sehingga $A = 4(b + 2) - 3 \\times 2 + (-1) = 4b + 8 - 6 - 1 = 4b + 1$. Karena $b$ bilangan asli (minimal $1$), $A = 4b + 1 \\geq 5 > 4 = B$, jadi $A > B$. Jawaban: A","19":"$A = \\{2, 3, 5, 7, 11, 13, 17, 19, 23, 29\\}$ (prima $\\leq 29$), $B = \\{5, 7, 9, 11, 13, 15, 17, 19, 21, 23\\}$ (ganjil antara $4$ dan $24$), $C = \\{1, 2, \\ldots, 10\\}$ ($10$ asli pertama). Pernyataan 1 Salah: $A \\cap B = \\{5, 7, 11, 13, 17, 19, 23\\}$ (angka $4$ bukan prima). Pernyataan 2 Benar: $B \\cap C = \\{5, 7, 9\\}$. Pernyataan 3 Salah: $A \\cap C = \\{2, 3, 5, 7\\}$ (tanpa $9$). Pernyataan 4 Benar: $n(A \\cup B) = 13$. Pernyataan 5 Salah: $n(B \\cup C) = 17$, bukan $20$. Jawaban: Pernyataan 2 dan 4","22":"$\\sqrt{6 + \\sqrt{32}} = \\sqrt{6 + 2\\sqrt{8}}$. Pola akar bersarang $\\sqrt{(b + c) + 2\\sqrt{bc}} = \\sqrt{b} + \\sqrt{c}$ dengan $b + c = 6$ dan $bc = 8$, yaitu $b = 4$ dan $c = 2$. Jadi $\\sqrt{6 + 2\\sqrt{4 \\cdot 2}} = \\sqrt{4} + \\sqrt{2} = 2 + \\sqrt{2} = p + \\sqrt{q}$ sehingga $p = 2$ dan $q = 2$. Baris 1 SALAH ($p = 2$, bukan $3$); Baris 2 BENAR ($q = 2$); Baris 3 BENAR ($p^{q} = 2^{2} = 4$). Jawaban: Salah, Benar, Benar","23":"Dari diagram Venn: semesta $S = \\{1, 2, \\ldots, 8\\}$, lingkaran $P = \\{1, 2, 3, 4\\}$, lingkaran $Q = \\{4, 5, 6\\}$, irisan memuat angka $4$. Baris 1 SALAH: $P \\cap Q = \\{4\\}$, bukan $\\{1, 2, 3, 4, 5, 6\\}$ (itu gabungan). Baris 2 BENAR: $(P \\cup Q)^{c} = \\{7, 8\\}$ (di luar kedua lingkaran). Baris 3 BENAR: $P - Q = \\{1, 2, 3\\}$ ($P$ tanpa anggota irisan). Jawaban: Salah, Benar, Benar","24":"Misal $p = 5^{x}$ sehingga $(5^{x})^{2} - 126 \\cdot 5^{x} + 125 = 0$ menjadi $p^{2} - 126p + 125 = 0 \\Rightarrow (p - 125)(p - 1) = 0 \\Rightarrow p = 125$ atau $p = 1$. Lalu $5^{x} = 5^{3} \\Rightarrow x_{1} = 3$ dan $5^{x} = 5^{0} \\Rightarrow x_{2} = 0$. Baris 1 BENAR: $x_{1} + x_{2} = 3 + 0 = 3$. Baris 2 BENAR: $2x_{1} + x_{2} = 6 + 0 = 6$. Baris 3 SALAH: $\\frac{x_{2}}{x_{1}} = \\frac{0}{3} = 0$, bukan $1$. Jawaban: Benar, Benar, Salah","25":"$a \\circ 2 = \\frac{a \\cdot 2 - (a - 2)^{2}}{a - 2} = 2$. Kali kedua ruas dengan $(a - 2)$: $2a - (a^{2} - 4a + 4) = 2(a - 2) \\Rightarrow 2a - a^{2} + 4a - 4 = 2a - 4 \\Rightarrow -a^{2} + 4a = 0 \\Rightarrow a(a - 4) = 0$, jadi $a = 0$ atau $a = 4$; karena $a$ bulat positif maka $a = 4$. Baris 1 BENAR: $4$ kelipatan $2$. Baris 2 BENAR: $4$ komposit ($1, 2, 4$). Baris 3 SALAH: $1 \\circ 2 = \\frac{2 - 1}{-1} = -1$, bukan $-4$. Jawaban: Benar, Benar, Salah"};
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
 {
  "jenis": "judul",
  "teks": "Bilangan & Operasi: Pecahan, Persen, Desimal"
 },
 {
  "jenis": "kilat",
  "teks": "Semua bilangan bisa saling menyamar: pecahan, persen, desimal, sampai pangkat besar. Kunci kecepatan TKA ada dua: pilih SATU wujud (desimal atau pecahan), ubah semuanya ke wujud itu, lalu hitung dengan urutan operasi yang benar."
 },
 {
  "jenis": "peta",
  "teks": "Bab 1 adalah fondasi aritmetika seluruh seri: operasi bilangan muncul lagi di barisan-deret (bab 4), statistika (bab 5), dan bangun ruang (bab 6); himpunan menempel di peluang; eksponen adalah bahasa wajib soal pertumbuhan. Tiga keluarga soal bab ini: hitung campuran, teori himpunan, dan pangkat-akar."
 },
 {
  "jenis": "tabelinfo",
  "judul": "Tukar wujud bilangan (paling sering keluar)",
  "kolom": [
   "Dari",
   "Ke",
   "Contoh & cara"
  ],
  "rows": [
   {
    "k": "Persen",
    "v": "Desimal",
    "w": "$125\\% = 1,25$ — geser koma dua ke kiri."
   },
   {
    "k": "Persen",
    "v": "Pecahan",
    "w": "$75\\% = \\frac{75}{100} = \\frac{3}{4}$ — bagi $100$, sederhanakan."
   },
   {
    "k": "Pecahan",
    "v": "Desimal",
    "w": "$\\frac{3}{8} = 0,375$ — bagi bersusun."
   },
   {
    "k": "Desimal",
    "v": "Pecahan",
    "w": "$0,375 = \\frac{375}{1000} = \\frac{3}{8}$ — hitung angka desimalnya."
   },
   {
    "k": "Pecahan",
    "v": "Persen",
    "w": "$\\frac{2}{5} = \\frac{40}{100} = 40\\%$ — samakan penyebut ke $100$."
   }
  ]
 },
 {
  "jenis": "urutan",
  "judul": "🧩 Susun: urutan operasi campuran (Kabataku)",
  "keterangan": "Salah urutan = hasil mirip pengecoh. Susun dari yang dikerjakan pertama.",
  "items": [
   "Tanda kurung & pengelompokan dikerjakan paling awal",
   "Pangkat dan akar (termasuk bentuk akar bersarang)",
   "Kali dan bagi, urut dari kiri ke kanan",
   "Tambah dan kurang, urut dari kiri ke kanan"
  ]
 },
 {
  "jenis": "benarSalah",
  "judul": "⚖️ Cek rasa bilangan",
  "keterangan": "Gemilang Drill — pemanasan sebelum masuk soal resmi bank.",
  "items": [
   {
    "teks": "$0,25 = 25\\% = \\frac{1}{4}$ adalah bilangan yang sama.",
    "jawaban": true,
    "penjelasan": "Tiga wujud, satu nilai."
   },
   {
    "teks": "Membagi suatu bilangan dengan $0,2$ sama dengan mengalikannya dengan $5$.",
    "jawaban": true,
    "penjelasan": "$0,2 = \\frac{1}{5}$; bagi pecahan = kali kebalikannya."
   },
   {
    "teks": "$3\\frac{3}{8} = 3,375$.",
    "jawaban": true,
    "penjelasan": "$\\frac{3}{8} = 0,375$."
   },
   {
    "teks": "$125\\% \\times 4,2$ hasilnya lebih kecil dari $4,2$.",
    "jawaban": false,
    "penjelasan": "$125\\% = 1,25 > 1$, jadi hasilnya $5,25$ — justru lebih besar."
   }
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-BILANGAN: satu wujud, satu urutan",
  "teks": "Soal campuran pecahan-persen-desimal? Ubah SEMUA ke satu wujud dulu (desimal paling aman bila opsi berdesimal), lalu taati Kabataku tanpa lompat langkah.",
  "items": [
   "Persen tinggal dibagi $100$: $125\\% = 1,25$.",
   "Bagi dengan pecahan = kali kebalikannya: $: 0,2$ sama dengan $\\times 5$.",
   "Pangkat raksasa jangan dihitung penuh — cari POLA angka satuannya."
  ]
 },
 {
  "jenis": "flashcard",
  "judul": "🃏 Flashcard: pola angka satuan pangkat",
  "items": [
   {
    "depan": "Satuan $2^{n}$",
    "belakang": "$2, 4, 8, 6$ — berulang tiap $4$ pangkat."
   },
   {
    "depan": "Satuan $7^{n}$",
    "belakang": "$7, 9, 3, 1$ — berulang tiap $4$ pangkat."
   },
   {
    "depan": "Satuan $14^{n}$",
    "belakang": "$4, 6, 4, 6$ — pangkat ganjil $4$, genap $6$."
   },
   {
    "depan": "Satuan $5^{n}$ dan $6^{n}$",
    "belakang": "Selalu $5$ dan selalu $6$ (pola tetap)."
   }
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Hasil dari $2\\frac{1}{4} \\times 0,5 : 25\\%$ adalah ...",
    "opsi": [
     "$4,5$",
     "$3,5$",
     "$5,0$",
     "$2,25$",
     "$9,0$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $2,25 \\times 0,5 = 1,125$; lalu $1,125 : 0,25 = 4,5$. Jalur Cara Gemilang: satu wujud desimal + Kabataku (kali-bagi dari kiri)."
   },
   {
    "soal": "Angka satuan dari $3^{2026}$ adalah ...",
    "opsi": [
     "$1$",
     "$3$",
     "$7$",
     "$9$",
     "$5$"
    ],
    "jawaban": 3,
    "pembahasan": "Jalur konsep: pola satuan $3^{n}$ adalah $3, 9, 7, 1$ berulang tiap $4$; $2026 = 4 \\times 506 + 2$ sehingga jatuh di angka ke-$2$, yaitu $9$. Jalur Cara Gemilang: sisa bagi $4$ = posisi dalam pola."
   },
   {
    "soal": "Bilangan terbesar di antara $0,45$; $45\\%$; $\\frac{9}{20}$; dan $\\frac{5}{11}$ adalah ...",
    "opsi": [
     "$0,45$",
     "$45\\%$",
     "$\\frac{9}{20}$",
     "$\\frac{5}{11}$",
     "Semua sama besar"
    ],
    "jawaban": 3,
    "pembahasan": "Jalur konsep: $0,45 = 45\\% = \\frac{9}{20} = 0,4500$, sedangkan $\\frac{5}{11} = 0,4545\\ldots$ lebih besar. Jalur Cara Gemilang: desimalkan semua, bandingkan digit ketiga di belakang koma."
   }
  ]
 },
 {
  "jenis": "judul",
  "teks": "Himpunan: Notasi, Operasi, Diagram Venn"
 },
 {
  "jenis": "kilat",
  "teks": "Himpunan adalah kumpulan objek dengan syarat terdefinisi jelas. Notasi pembentuk $\\{x \\mid \\text{syarat}\\}$ dibaca \"x sehingga syarat\". Empat operasi pokok: irisan $\\cap$ (dan), gabungan $\\cup$ (atau), selisih $-$ (buang), dan komplemen $^{c}$ (sisanya semesta)."
 },
 {
  "jenis": "poin",
  "judul": "Membaca notasi pembentuk himpunan",
  "items": [
   "$\\{x \\mid 3 < x < 7,\\ x \\in \\text{bilangan asli}\\} = \\{4, 5, 6\\}$ — batas tegas ($3$ dan $7$) TIDAK ikut.",
   "$\\{x \\mid x \\leq 10,\\ x \\in \\text{bilangan prima}\\} = \\{2, 3, 5, 7\\}$ — prima terkecil adalah $2$, dan $1$ bukan prima.",
   "Cacah dimulai dari $0$; asli dimulai dari $1$; ganjil-genap hanya untuk bilangan bulat."
  ]
 },
 {
  "jenis": "tabelinfo",
  "judul": "Operasi himpunan",
  "kolom": [
   "Simbol",
   "Nama",
   "Artinya"
  ],
  "rows": [
   {
    "k": "$A \\cap B$",
    "v": "Irisan",
    "w": "Anggota yang ada di $A$ DAN di $B$ sekaligus."
   },
   {
    "k": "$A \\cup B$",
    "v": "Gabungan",
    "w": "Semua anggota $A$ ATAU $B$; yang kembar dihitung sekali."
   },
   {
    "k": "$A - B$",
    "v": "Selisih",
    "w": "Anggota $A$ yang BUKAN anggota $B$."
   },
   {
    "k": "$A^{c}$",
    "v": "Komplemen",
    "w": "Anggota semesta $S$ yang berada di luar $A$."
   },
   {
    "k": "$A \\subset B$",
    "v": "Subset",
    "w": "Setiap anggota $A$ juga menjadi anggota $B$."
   }
  ]
 },
 {
  "jenis": "jodohMini",
  "judul": "🔗 Jodohkan: notasi dan artinya",
  "items": [
   {
    "kiri": "$A \\cap B$",
    "kanan": "Irisan — anggota persekutuan"
   },
   {
    "kiri": "$A \\cup B$",
    "kanan": "Gabungan — semua anggota tanpa dobel"
   },
   {
    "kiri": "$A - B$",
    "kanan": "Selisih — A dibuang yang ada di B"
   },
   {
    "kiri": "$A^{c}$",
    "kanan": "Komplemen — di luar A dalam semesta"
   },
   {
    "kiri": "$A \\subset B$",
    "kanan": "A himpunan bagian dari B"
   }
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-HIMPUNAN: daftar dulu, baru operasi",
  "teks": "Hampir semua soal himpunan TKA tuntas dengan satu jurus: DAFTARKAN anggota tiap himpunan secara eksplisit, lalu coret-tandai per operasi. Diagram Venn adalah alat cek, bukan alat hitung.",
  "items": [
   "Notasi $\\{x \\mid \\ldots\\}$: uji angka satu-satu terhadap syaratnya.",
   "Irisan = cari yang kembar; gabungan = tulis semua tanpa duplikat.",
   "Rumus banyak anggota: $n(A \\cup B) = n(A) + n(B) - n(A \\cap B)$."
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Diketahui $S = \\{1, 2, \\ldots, 10\\}$, $A = \\{2, 4, 6, 8, 10\\}$, dan $B = \\{1, 2, 3, 4\\}$. Maka $A \\cap B = $ ...",
    "opsi": [
     "$\\{2, 4\\}$",
     "$\\{1, 2, 3, 4\\}$",
     "$\\{2\\}$",
     "$\\{4\\}$",
     "$\\{1, 2, 3, 4, 6, 8, 10\\}$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: anggota yang muncul di $A$ sekaligus $B$ hanya $2$ dan $4$. Jalur Cara Gemilang: coret kembar dua daftar, abaikan sisanya."
   },
   {
    "soal": "Jika $n(A) = 8$, $n(B) = 7$, dan $n(A \\cap B) = 3$, maka $n(A \\cup B) = $ ...",
    "opsi": [
     "$12$",
     "$13$",
     "$15$",
     "$18$",
     "$10$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $n(A \\cup B) = 8 + 7 - 3 = 12$. Jalur Cara Gemilang: gabungan = jumlah dikurang kembar (dobel dihitung sekali)."
   },
   {
    "soal": "Himpunan $\\{x \\mid x^{2} \\leq 9,\\ x \\in \\text{bilangan bulat}\\}$ sama dengan ...",
    "opsi": [
     "$\\{-3, -2, -1, 0, 1, 2, 3\\}$",
     "$\\{0, 1, 2, 3\\}$",
     "$\\{1, 2, 3\\}$",
     "$\\{-3, 3\\}$",
     "$\\{-2, -1, 0, 1, 2\\}$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $x^{2} \\leq 9 \\Rightarrow -3 \\leq x \\leq 3$; bilangan bulat di antaranya ada $7$. Jalur Cara Gemilang: kuadrat menghapus tanda — jangan lupa anggota negatif."
   }
  ]
 },
 {
  "jenis": "judul",
  "teks": "Eksponen & Bentuk Akar"
 },
 {
  "jenis": "kilat",
  "teks": "Eksponen adalah perkalian berulang: $a^{n} = a \\times a \\times \\ldots \\times a$ sebanyak $n$. Semua sifatnya turunan dari satu ide: basis sama dikali = pangkat ditambah. Bentuk akar adalah pangkat pecahan: $\\sqrt[n]{a^{m}} = a^{m/n}$."
 },
 {
  "jenis": "tabelinfo",
  "judul": "Sifat pangkat wajib hafal",
  "kolom": [
   "Nama",
   "Rumus",
   "Contoh"
  ],
  "rows": [
   {
    "k": "Kali basis sama",
    "v": "$a^{m} \\times a^{n} = a^{m + n}$",
    "w": "$2^{3} \\times 2^{4} = 2^{7}$"
   },
   {
    "k": "Bagi basis sama",
    "v": "$\\frac{a^{m}}{a^{n}} = a^{m - n}$",
    "w": "$\\frac{3^{5}}{3^{2}} = 3^{3}$"
   },
   {
    "k": "Pangkat dipangkatkan",
    "v": "$(a^{m})^{n} = a^{m \\cdot n}$",
    "w": "$(5^{2})^{3} = 5^{6}$"
   },
   {
    "k": "Pangkat negatif",
    "v": "$a^{-n} = \\frac{1}{a^{n}}$",
    "w": "$2^{-3} = \\frac{1}{8}$"
   },
   {
    "k": "Pangkat pecahan",
    "v": "$a^{m/n} = \\sqrt[n]{a^{m}}$",
    "w": "$8^{2/3} = \\sqrt[3]{8^{2}} = 4$"
   },
   {
    "k": "Pangkat nol",
    "v": "$a^{0} = 1$ untuk $a \\neq 0$",
    "w": "$7^{0} = 1$"
   }
  ]
 },
 {
  "jenis": "flashcard",
  "judul": "🃏 Flashcard: akar ⇄ pangkat pecahan",
  "items": [
   {
    "depan": "$\\sqrt{x}$",
    "belakang": "$x^{1/2}$"
   },
   {
    "depan": "$\\sqrt[3]{x^{2}}$",
    "belakang": "$x^{2/3}$"
   },
   {
    "depan": "$\\frac{1}{\\sqrt{x}}$",
    "belakang": "$x^{-1/2}$"
   },
   {
    "depan": "$\\sqrt[4]{x^{3}}$",
    "belakang": "$x^{3/4}$"
   }
  ]
 },
 {
  "jenis": "poin",
  "judul": "Merasionalkan penyebut (3 pola)",
  "items": [
   "Bentuk $\\frac{c}{\\sqrt{a}}$: kali $\\frac{\\sqrt{a}}{\\sqrt{a}}$ menjadi $\\frac{c\\sqrt{a}}{a}$.",
   "Bentuk $\\frac{c}{a + \\sqrt{b}}$: kali sekawan $\\frac{a - \\sqrt{b}}{a - \\sqrt{b}}$; penyebut jadi $a^{2} - b$.",
   "Bentuk $\\frac{c}{\\sqrt{a} + \\sqrt{b}}$: kali $\\frac{\\sqrt{a} - \\sqrt{b}}{\\sqrt{a} - \\sqrt{b}}$; penyebut jadi $a - b$."
  ]
 },
 {
  "jenis": "callout",
  "tipe": "peringatan",
  "judul": "Jebakan bentuk akar",
  "teks": "Akar TIDAK distributif pada tambah-kurang: $\\sqrt{a + b} \\neq \\sqrt{a} + \\sqrt{b}$ (contoh: $\\sqrt{9 + 16} = \\sqrt{25} = 5$, bukan $3 + 4 = 7$). Untuk perkalian boleh dipecah: $\\sqrt{ab} = \\sqrt{a} \\cdot \\sqrt{b}$. Akar bersarang pakai pola $\\sqrt{(b + c) + 2\\sqrt{bc}} = \\sqrt{b} + \\sqrt{c}$ — cari dua bilangan berjumlah $b + c$ dan berkalikan $bc$."
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-EKSPONEN: samakan basis",
  "teks": "Persamaan pangkat? Paksa kedua ruas berbasis sama, lalu SAMAKAN PANGKATNYA. Pertidaksamaan: basis $> 1$ tanda tetap; basis di antara $0$ dan $1$ tanda DIBALIK.",
  "items": [
   "Hafal pangkat kecil: $27 = 3^{3}$, $16 = 2^{4}$, $125 = 5^{3}$, $81 = 3^{4}$, $243 = 3^{5}$.",
   "Kuadrat tersamar $a^{2x} + b \\cdot a^{x} + c = 0$: misal $p = a^{x}$ lalu faktorkan.",
   "Rantai nilai ($2^{x} = 5$, $5^{y} = 4$, dst): runtuhkan menara dari dalam, $((2^{x})^{y})^{z}$."
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Nilai dari $\\frac{2^{5} \\times 3^{4}}{2^{3} \\times 3^{2}}$ adalah ...",
    "opsi": [
     "$24$",
     "$36$",
     "$48$",
     "$72$",
     "$108$"
    ],
    "jawaban": 1,
    "pembahasan": "Jalur konsep: $2^{5 - 3} \\times 3^{4 - 2} = 2^{2} \\times 3^{2} = 4 \\times 9 = 36$. Jalur Cara Gemilang: kurangi pangkat per basis, jangan hitung bilangan besarnya."
   },
   {
    "soal": "Bentuk rasional dari $\\frac{6}{\\sqrt{3}}$ adalah ...",
    "opsi": [
     "$2\\sqrt{3}$",
     "$3\\sqrt{2}$",
     "$2\\sqrt{2}$",
     "$6\\sqrt{3}$",
     "$3\\sqrt{3}$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $\\frac{6}{\\sqrt{3}} \\times \\frac{\\sqrt{3}}{\\sqrt{3}} = \\frac{6\\sqrt{3}}{3} = 2\\sqrt{3}$. Jalur Cara Gemilang: pola pertama rasionalkan — bagi koefisien dengan isi akar."
   },
   {
    "soal": "Jika $3^{x} = 243$ dan $2^{y} = 32$, maka nilai $x + y$ adalah ...",
    "opsi": [
     "$8$",
     "$9$",
     "$10$",
     "$11$",
     "$12$"
    ],
    "jawaban": 2,
    "pembahasan": "Jalur konsep: $243 = 3^{5} \\Rightarrow x = 5$; $32 = 2^{5} \\Rightarrow y = 5$; jadi $x + y = 10$. Jalur Cara Gemilang: hafalan pangkat kecil $3^{5}$ dan $2^{5}$ langsung menutup soal."
   }
  ]
 },
 {
  "jenis": "judul",
  "teks": "Operasi Baru, Pertumbuhan & Penalaran"
 },
 {
  "jenis": "kilat",
  "teks": "Dua pola favorit TKA: (1) operasi DEFINISI BARU dengan simbol aneh ($\\oplus$, $\\Delta$, $\\nabla$, $\\circ$) — kuncinya selalu patuhi definisi; (2) pertumbuhan bakteri/populasi $M_{n} = M_{0} \\cdot 2^{n}$ — eksponen yang menyamar jadi cerita."
 },
 {
  "jenis": "alur",
  "judul": "Langkah menaklukkan soal operasi baru",
  "items": [
   "Tulis ulang definisi memakai slot variabel: $a \\circ b = \\ldots$",
   "Tandai nilai yang dipasang ke tiap slot dari soal (hati-hati posisi di dalam kurung/tabel).",
   "Substitusi mentah-mentah dulu, jangan disederhanakan di kepala.",
   "Hitung dengan Kabataku; cek syarat khusus (penyebut bukan nol, tanda pertidaksamaan)."
  ]
 },
 {
  "jenis": "poin",
  "judul": "Model pertumbuhan & ambang waktu",
  "items": [
   "Membelah dua tiap periode: $M_{n} = M_{0} \\cdot 2^{n}$ dengan $n = \\frac{t}{T}$ (banyak periode = waktu dibagi durasi belah).",
   "Ambang tercapai: ubah cerita jadi pertidaksamaan $M_{0} \\cdot 2^{n} \\geq K$, samakan basis, baca pangkatnya.",
   "Waktu total = periode $\\times$ durasi: $t = n \\times T$; konversikan menit-jam SEBELUM masuk rumus, lalu tambahkan ke jam mulai."
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-OPERASI: definisi adalah raja",
  "teks": "Simbol aneh ($\\oplus$, $\\Delta$, $\\nabla$, $\\circ$) bukan rumus hafalan — itu ATURAN MAIN yang diberikan soal. Substitusi dengan disiplin posisi; jawaban salah hampir selalu karena salah pasang variabel, bukan salah hitung.",
  "items": [
   "Tandai slotnya: mana $a$, mana $b$, mana angka bebas di luar kurung.",
   "Operasi bertingkat seperti $(p \\oplus q) \\oplus r$: selesaikan kurung dalam dulu.",
   "Penalaran skor/keputusan: terjemahkan aturan jadi rumus (misal $4b - s \\geq 325$), uji tiap opsi satu per satu."
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Operasi $\\otimes$ didefinisikan sebagai $a \\otimes b = a^{2} - 2b$. Nilai $3 \\otimes 4$ adalah ...",
    "opsi": [
     "$1$",
     "$5$",
     "$17$",
     "$25$",
     "$-1$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $3 \\otimes 4 = 3^{2} - 2(4) = 9 - 8 = 1$. Jalur Cara Gemilang: pasang $a = 3$ ke slot kuadrat, $b = 4$ ke slot pengurang."
   },
   {
    "soal": "Bakteri membelah dua setiap $15$ menit. Dari $20$ bakteri awal, jumlah bakteri setelah $2$ jam adalah ...",
    "opsi": [
     "$20 \\cdot 2^{8}$",
     "$20 \\cdot 2^{6}$",
     "$40 \\cdot 2^{8}$",
     "$20 \\cdot 2^{9}$",
     "$10 \\cdot 2^{8}$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $2$ jam $= 120$ menit, $n = \\frac{120}{15} = 8$ periode, jadi $M_{8} = 20 \\cdot 2^{8} = 5.120$. Jalur Cara Gemilang: konversi waktu dulu, baru masukkan $n = t/T$."
   },
   {
    "soal": "Operasi $*$ didefinisikan $a * b = \\frac{a + b}{ab}$. Nilai $2 * 3$ adalah ...",
    "opsi": [
     "$\\frac{5}{6}$",
     "$\\frac{6}{5}$",
     "$\\frac{1}{6}$",
     "$\\frac{2}{3}$",
     "$1$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: $2 * 3 = \\frac{2 + 3}{2 \\cdot 3} = \\frac{5}{6}$. Jalur Cara Gemilang: pembilang jumlah, penyebut kali — jangan tertukar."
   }
  ]
 },
 {
  "jenis": "callout",
  "tipe": "info",
  "judul": "Bab 1 tuntas",
  "teks": "Empat keluarga soal bab ini: hitung campuran bilangan, himpunan & Venn, pangkat-akar, serta operasi baru-pertumbuhan. Saat latihan, labeli tiap nomor dengan keluarganya — pola CG-mu terbentuk dalam dua putaran."
 }
];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {};
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 1 Bilangan-Himpunan-Eksponen (soal+kunci+pembahasan bawaan HTML bank owner; rumus buku dikonversi LaTeX otomatis; salah cetak soal 13 dikoreksi mengikuti pembahasan resmi); kunci & pembahasan buku (soal asli #{no})';
const NAT = true;
const GAMBAR_GRUP = {};
const OPSI_TEKS = {};
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
    ...(GAMBAR_GRUP[s.grup] ? { soalGambar: GAMBAR_GRUP[s.grup] } : {}),
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
    judul: "Bab 1 — Bilangan, Himpunan, dan Eksponen (Edisi Cara Gemilang)",
    ringkasan: "Operasi & konversi bilangan (pecahan-persen-desimal, urutan operasi, pola angka satuan), himpunan (notasi pembentuk, irisan-gabungan-selisih-komplemen-subset, diagram Venn), eksponen & bentuk akar (sifat pangkat, persamaan dan pertidaksamaan eksponen, merasionalkan penyebut, akar bersarang), serta operasi definisi baru dan model pertumbuhan — semua rumus ditulis LaTeX natural; 25 soal resmi bank (17 pg, 4 pgMulti, 4 tabel Benar/Salah) + pembahasan dua jalur.",
    estimasiMenit: 75, urutan: 1, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-matematika-k12-v1-bab1.json');
const outImpor = join(ROOT, 'IMPOR-MATEMATIKA-BAB1-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-MATEMATIKA-BAB1-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
