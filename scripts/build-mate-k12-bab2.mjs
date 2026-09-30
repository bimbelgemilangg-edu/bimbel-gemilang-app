// scripts/build-bindo-k12-bab1.mjs
// ============================================================
// BUILDER MATERI: BAHASA INGGRIS WAJIB K12 — BAB 2 — SISTEM PERSAMAAN DAN PERTIDAKSAMAAN LINIER (EDISI CARA GEMILANG) (Turn 98)
// Sumber: Bab 2 Sistem Persamaan & Pertidaksamaan Linier (soal+kunci+pembahasan bawaan HTML bank owner; 4 diagram SVG asli buku diekstrak ke public/gambar-bing/mate2-s5,s7,s8,s21.svg; salah cetak soal 16 dikoreksi mengikuti pembahasan resmi). Kerangka helper diwarisi build-bindo-k12-bab1.mjs.
// ============================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { naturalisasi } from './latex-utils.mjs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const E = JSON.parse(readFileSync(process.argv[2] || '../.ekstrak-mate2.json', 'utf-8'));

const OCR_FIX = [
 [
  "sistem persamaan linier x + 2y + z = 11",
  "sistem persamaan linier -x + 2y + z = 11"
 ],
 [
  "-x + 2y + z = 11 2x - 4y - z = -14",
  "-x + 2y + z = 11\n2x - 4y - z = -14"
 ],
 [
  "4x - y + 3z = 8 2x + 3y + z = 7 4x + 2y + 4z = 5",
  "4x - y + 3z = 8\n2x + 3y + z = 7\n4x + 2y + 4z = 5"
 ],
 [
  "{ \\frac{1}{x} + \\frac{1}{y} = 10 \\frac{5}{x} - \\frac{3}{y} = 26",
  "\\left\\{ \\begin{matrix} \\frac{1}{x} + \\frac{1}{y} = 10 \\\\ \\frac{5}{x} - \\frac{3}{y} = 26 \\end{matrix} \\right."
 ],
 [
  "{ 2x + 7y = 1 ax + by = 3",
  "\\left\\{ \\begin{matrix} 2x + 7y = 1 \\\\ ax + by = 3 \\end{matrix} \\right."
 ],
 [
  "{ \\frac{1}{x} + \\frac{4}{y} + \\frac{3}{z} = 8 \\frac{3}{x} - \\frac{1}{y} + \\frac{1}{z} = 3 \\frac{2}{x} - \\frac{3}{y} + \\frac{1}{z} = 0",
  "\\left\\{ \\begin{matrix} \\frac{1}{x} + \\frac{4}{y} + \\frac{3}{z} = 8 \\\\ \\frac{3}{x} - \\frac{1}{y} + \\frac{1}{z} = 3 \\\\ \\frac{2}{x} - \\frac{3}{y} + \\frac{1}{z} = 0 \\end{matrix} \\right."
 ],
 [
  "{ x - 3y + 2z = -5 2x - 6y = -6 3x + y - z = 22",
  "\\left\\{ \\begin{matrix} x - 3y + 2z = -5 \\\\ 2x - 6y = -6 \\\\ 3x + y - z = 22 \\end{matrix} \\right."
 ],
 [
  "{ 3x + 4y = 24 x + 2y = 10",
  "\\left\\{ \\begin{matrix} 3x + 4y = 24 \\\\ x + 2y = 10 \\end{matrix} \\right."
 ],
 [
  "{ 3x + 4y = 24 3x + 6y = 30",
  "\\left\\{ \\begin{matrix} 3x + 4y = 24 \\\\ 3x + 6y = 30 \\end{matrix} \\right."
 ],
 [
  "Kue Cokelat Kue Vanila Kue Keju Harga Konsumen 1 2 3 1 Rp34.500,00 Konsumen 2 1 2 2 Rp25.000,00 Konsumen 3 1 2 1 Rp21.500,00",
  "Daftar pembelian (banyak kue cokelat, vanila, keju, lalu total harga) — Konsumen 1: 2, 3, 1 seharga Rp34.500,00; Konsumen 2: 1, 2, 2 seharga Rp25.000,00; Konsumen 3: 1, 2, 1 seharga Rp21.500,00."
 ],
 [
  "Kandidat Kerapian kerja Kecepatan kerja Ambar 85 65 Bertrand 80 70 Charlie 75 75 Dedy 70 80 Emir 65 85",
  "Kandidat (nilai kerapian kerja, kecepatan kerja): Ambar (85, 65); Bertrand (80, 70); Charlie (75, 75); Dedy (70, 80); Emir (65, 85)."
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
 "1": "Eliminasi-substitusi standar: samakan koefisien salah satu variabel, kurangkan, lalu back-substitusi ke persamaan paling sederhana.",
 "2": "Pecahan di variabel: misal $p = \\frac{1}{x}$ dan $q = \\frac{1}{y}$ — jadi SPL biasa; di akhir balik lagi $x = \\frac{1}{p}$.",
 "3": "Soal umur berjangkar ke \"saat ini\": lampau $= a - 5$, depan $= a + 4$; susun dua persamaan lalu eliminasi.",
 "4": "SPL tiga variabel: eliminasi variabel yang sama DUA kali (pasangan berbeda) → SPL dua variabel → tangga substitusi.",
 "5": "Daerah pertidaksamaan: gambar garis dari titik potong sumbu, uji titik $(0,0)$; jawaban = irisan semua setengah bidang (arsiran yang ditumpuk semua syarat).",
 "6": "Belanja = SPL tiga harga; cari harga satuan per variabel lewat eliminasi berpasangan, lalu jumlahkan yang ditanya.",
 "7": "Baca arsiran terbalik: titik potong sumbu $(a, 0)$ dan $(0, b)$ memberi garis $bx + ay = ab$; tanda $\\leq$ atau $\\geq$ ditentukan sisi arsiran (uji titik).",
 "8": "Bahan terbatas = pertidaksamaan per bahan; hilangkan desimal dengan mengali (misal $\\times 2$), jangan lupa syarat $x \\geq 0$, $y \\geq 0$.",
 "9": "Daftar harga = SPL tiga variabel; pesanan Anita = total Konsumen 1 ditambah $3x$ — cari $x$ (cokelat) lebih dulu.",
 "10": "Perbandingan $2 : 3 : 1$ → A mendapat $\\frac{2}{6}$ dari total; sisa setelah terpakai $50\\%$ tinggal $\\frac{1}{2}$-nya.",
 "11": "Eliminasi $x$ (kali silang koefisien $5$ dan $3$) → $y$ langsung didapat tanpa mencari harga beras.",
 "12": "Kendaraan & roda: $x + y = 120$ dan $4x + 2y = 300$; dapat $y$ (motor) lalu kalikan harga jualnya.",
 "13": "Banyak penyelesaian tak hingga $\\Leftrightarrow \\frac{a}{2} = \\frac{b}{7} = \\frac{3}{1}$ — kedua persamaan \"kembar\" (sebanding penuh).",
 "14": "Terjemahkan kalimat: jumlah $= 17$, kombinasi $3x + 2y = 43$; eliminasi $y$ (kali $2$ vs kali $1$).",
 "15": "Perbandingan $4 : 1 : 3$ → ketumbar + kunyit $= \\frac{4 + 1}{4 + 1 + 3} \\times$ berat total.",
 "16": "Eliminasi $z$ sekali jalan menghasilkan $x - 2y = -3$; yang ditanya $m = -x + 2y = -(x - 2y)$ — tak perlu mencari $x$, $y$, $z$ satu per satu!",
 "17": "Misal $p = \\frac{1}{x}$, $q = \\frac{1}{y}$, $r = \\frac{1}{z}$ → SPL linier tiga variabel biasa; eliminasi berpasangan lalu balik ke $x : y : z$.",
 "18": "Modelkan $x + y = 65$ dan $x = 2y - 10$; substitusi → $y = 25$, $x = 40$; uji tiap pernyataan dengan dua angka itu.",
 "19": "Rata-rata berbobot: nilai akhir $= \\frac{2(\\text{kerapian}) + 5(\\text{kecepatan})}{7}$; hitung kelimanya, baru bandingkan dengan ambang $78$.",
 "20": "Persamaan (2) dibagi $2$ langsung memberi $x - 3y = -3$ — substitusi ke (1) dapat $z$, sisanya eliminasi biasa.",
 "21": "Grafik garis dibaca per ikan per tahun: \"selalu meningkat\" = tak pernah turun; titik temu dua garis = nilai sama.",
 "22": "Diskon $5\\%$: harga bayar $= 95\\%$ harga asli → bagi $0,95$ dulu untuk mengembalikan harga asli, baru eliminasi normal.",
 "23": "Tiga umur berantai: anak $x$, ibu $x + 25$, ayah $x + 29$; rata-rata $29$ → $\\frac{3x + 54}{3} = 29$.",
 "24": "Program linier: kendala $3x + 4y \\leq 270$ dan $5x + 3y \\leq 340$; uji titik pojok ke $f = 35.000x + 45.000y$ — perpotongan $(50, 30)$ sang juara.",
 "25": "Perbandingan $4 : 3 : 2$ dengan $4$ bagian $= 48$ → $1$ bagian $= 12$; cokelat $= 3 \\times 12$, permen $= 2 \\times 12$."
};
const CATATAN_KUNCI = {"16":" (Catatan: cetakan buku menuliskan persamaan pertama $x + 2y + z = 11$, tetapi pembahasan resmi menyelesaikannya sebagai $-x + 2y + z = 11$ — hanya bentuk negatif itu yang menghasilkan $x - 2y = -3$ dan konsisten dengan kunci E. Teks soal di sini dikoreksi mengikuti pembahasan.)","24":" (Catatan: tabel centang pembahasan pada salinan digital tercacah tidak lengkap — hanya dua baris fragmen tabel kebutuhan sumber daya yang terekam; kunci mengikuti uraian teks pembahasan lengkap dan tabel kunci ringkas \"B,S,B\".)"};
const KONSEP = {"14":"Misal bilangan pertama $= x$ dan bilangan kedua $= y$: $\\left\\{ \\begin{matrix} x + y = 17 \\\\ 3x + 2y = 43 \\end{matrix} \\right.$. Eliminasi $y$: persamaan pertama $\\times 2$ menjadi $2x + 2y = 34$; kurangkan dari persamaan kedua: $(3x + 2y) - (2x + 2y) = 43 - 34 \\Rightarrow x = 9$, lalu $y = 17 - 9 = 8$. Jadi kedua bilangan itu $9$ dan $8$. Jawaban: E","22":"Misal $x$ = harga $1$ kg jeruk dan $y$ = harga $1$ kg apel sebelum diskon. Kemarin: $4x + 3y = 98.000$ …(1). Hari ini diskon $5\\%$: $95\\% \\cdot (3x + 2y) = 65.550$, dikali $\\frac{100}{95}$ menjadi $3x + 2y = 69.000$ …(2). Eliminasi: $(1) \\times 2 \\rightarrow 8x + 6y = 196.000$; $(2) \\times 3 \\rightarrow 9x + 6y = 207.000$; kurangkan: $-x = -11.000 \\Rightarrow x = 11.000$. Substitusi: $4(11.000) + 3y = 98.000 \\Rightarrow 3y = 54.000 \\Rightarrow y = 18.000$. Baris 1 BENAR: harga $1$ kg apel sebelum diskon Rp18.000,00. Baris 2 SALAH: harga jeruk setelah diskon $= 95\\% \\times 11.000 = Rp10.450,00$, bukan Rp10.500,00. Baris 3 SALAH: selisih bayar bila kemarin juga diskon $= 5\\% \\times 98.000 = Rp4.900,00$, bukan Rp49.000,00. Jawaban: Benar, Salah, Salah","23":"Misal usia anak saat ini $= x$; ibu melahirkan saat berusia $25$ tahun → usia ibu $= x + 25$; ayah lebih tua $4$ tahun dari ibu → usia ayah $= x + 29$. Rata-rata usia $= 29$: $\\frac{x + (x + 25) + (x + 29)}{3} = 29 \\Rightarrow 3x + 54 = 87 \\Rightarrow 3x = 33 \\Rightarrow x = 11$. Jadi usia anak $= 11$ tahun, ibu $= 36$ tahun, ayah $= 40$ tahun. Baris 1 SALAH (anak $11$, bukan $10$); Baris 2 SALAH (ibu $36$, bukan $35$); Baris 3 SALAH (ayah $40$, bukan $39$). Jawaban: Salah, Salah, Salah","24":"Misal $x$ = banyak produk A dan $y$ = banyak produk B. Kendala: mesin $3x + 4y \\leq 270$; tenaga manusia $5x + 3y \\leq 340$; $x \\geq 0$, $y \\geq 0$. Fungsi tujuan $f(x, y) = 35.000x + 45.000y$. Titik potong antar-garis kendala: $3x + 4y = 270\\ (\\times 3)$ dan $5x + 3y = 340\\ (\\times 4)$ → $9x + 12y = 810$ vs $20x + 12y = 1.360$ → $-11x = -550 \\Rightarrow x = 50$, $y = 30$. Uji titik pojok: $f(0, 0) = 0$; $f(68, 0) = 2.380.000$; $f(0;\\ 67,5) = 3.037.500$; $f(50, 30) = 1.750.000 + 1.350.000 = 3.100.000$ → maksimum di $(50, 30)$. Baris 1 BENAR: menjual $50$ produk A dan $30$ produk B adalah strategi laba maksimum. Baris 2 SALAH: hanya menjual $68$ produk A memberi Rp2.380.000, bukan maksimum. Baris 3 BENAR: keuntungan maksimum per minggu Rp3.100.000,00. Jawaban: Benar, Salah, Benar","25":"Perbandingan kue kering : cokelat : permen $= 4 : 3 : 2$. Kue kering $4$ bagian $= 48$ bungkus → $1$ bagian $= 12$ bungkus. Cokelat $= 3 \\times 12 = 36$ bungkus; permen $= 2 \\times 12 = 24$ bungkus; total isi paket $= 48 + 36 + 24 = 108$ bungkus. Baris 1 BENAR: cokelat $36$ bungkus. Baris 2 SALAH: permen $24$ bungkus, bukan $20$. Baris 3 BENAR: total $108$ bungkus. Jawaban: Benar, Salah, Benar"};
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
  "teks": "Sistem Persamaan Linier: Dua & Tiga Variabel"
 },
 {
  "jenis": "kilat",
  "teks": "Sistem persamaan linier (SPL) adalah kumpulan persamaan yang berbagi variabel; penyelesaiannya harus memenuhi SEMUA persamaan sekaligus. Dua senjata utama: eliminasi (menghapus satu variabel dengan menjumlahkan/mengurangkan) dan substitusi (memindahkan nilai antar-persamaan)."
 },
 {
  "jenis": "peta",
  "teks": "Bab 2 adalah kuda-kuda TKA: SPL muncul langsung sebagai hitungan, menyamar di soal cerita (harga, umur, perbandingan), menjadi daerah penyelesaian & program linier, lalu dipakai lagi di bab statistika (rata-rata gabungan) dan bangun ruang (dimensi tak diketahui). Kuasai eliminasi + baca titik potong di sini, separuh bab lain ikut terangkat."
 },
 {
  "jenis": "alur",
  "judul": "Metode eliminasi-substitusi campuran",
  "items": [
   "Pilih variabel yang koefisiennya paling mudah disamakan (idealnya sudah $1$ atau $-1$)",
   "Kalikan kedua persamaan agar koefisien variabel itu sama",
   "Jumlahkan atau kurangkan → satu variabel hilang, variabel lain didapat",
   "Substitusikan nilai itu ke persamaan paling sederhana → variabel kedua",
   "Uji ke dua persamaan asal (5 detik, penyelamat nilai)"
  ]
 },
 {
  "jenis": "poin",
  "judul": "Bentuk-bentuk khusus SPL",
  "items": [
   "Variabel di penyebut ($\\frac{1}{x} + \\frac{1}{y} = 10$): misal $p = \\frac{1}{x}$, $q = \\frac{1}{y}$ — selesaikan sebagai SPL biasa, terakhir balik lagi.",
   "Banyak penyelesaian tak hingga $\\Leftrightarrow \\frac{a_{1}}{a_{2}} = \\frac{b_{1}}{b_{2}} = \\frac{c_{1}}{c_{2}}$ (kedua persamaan sebanding penuh — \"kembar\").",
   "Yang ditanya kombinasi $ax + by$: sering tak perlu mencari $x$ dan $y$ satuan — bentuk langsung kombinasinya dari operasi antar-persamaan."
  ]
 },
 {
  "jenis": "tabelinfo",
  "judul": "Syarat banyak penyelesaian SPL dua variabel",
  "kolom": [
   "Perbandingan koefisien",
   "Banyak penyelesaian",
   "Arti geometri"
  ],
  "rows": [
   {
    "k": "$\\frac{a_{1}}{a_{2}} \\neq \\frac{b_{1}}{b_{2}}$",
    "v": "Tepat satu",
    "w": "Dua garis berpotongan di satu titik"
   },
   {
    "k": "$\\frac{a_{1}}{a_{2}} = \\frac{b_{1}}{b_{2}} \\neq \\frac{c_{1}}{c_{2}}$",
    "v": "Tidak ada",
    "w": "Dua garis sejajar (tak pernah bertemu)"
   },
   {
    "k": "$\\frac{a_{1}}{a_{2}} = \\frac{b_{1}}{b_{2}} = \\frac{c_{1}}{c_{2}}$",
    "v": "Tak hingga banyak",
    "w": "Dua garis berimpit (satu garis sama)"
   }
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-SPL: eliminasi strategis",
  "teks": "Jangan eliminasi asal — pilih variabel dengan koefisien termudah. Bila yang ditanya sebuah kombinasi ($ax + by$), cari jalan pintas: kali-tambah persamaan agar kombinasi itu langsung muncul.",
  "items": [
   "Dua persamaan dua variabel: satu kali eliminasi langsung selesai.",
   "Tiga variabel: eliminasi variabel yang SAMA dari dua pasangan → turun jadi dua variabel.",
   "Hasil selalu diuji: substitusi balik ke persamaan asal, $2 \\times 5$ detik penyelamat."
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Penyelesaian sistem $2x + y = 7$ dan $x - y = 2$ memenuhi $x + y = $ ...",
    "opsi": [
     "$3$",
     "$4$",
     "$5$",
     "$6$",
     "$7$"
    ],
    "jawaban": 1,
    "pembahasan": "Jalur konsep: jumlahkan kedua persamaan → $3x = 9 \\Rightarrow x = 3$; substitusi → $y = 1$; jadi $x + y = 4$. Jalur Cara Gemilang: koefisien $y$ sudah $+1$ dan $-1$ — eliminasi termurah, langsung jumlahkan."
   },
   {
    "soal": "Diketahui $\\frac{1}{x} + \\frac{1}{y} = 5$ dan $\\frac{2}{x} - \\frac{1}{y} = 1$. Nilai $x$ adalah ...",
    "opsi": [
     "$\\frac{1}{2}$",
     "$\\frac{1}{3}$",
     "$1$",
     "$2$",
     "$3$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: jumlahkan → $\\frac{3}{x} = 6 \\Rightarrow x = \\frac{1}{2}$. Jalur Cara Gemilang: variabel penyebut tak perlu dimisalkan bila satu kali tambah langsung menumbangkan salah satunya."
   },
   {
    "soal": "Sistem $x + y + z = 6$, $2x - y + z = 3$, dan $x + 2y - z = 2$ mempunyai penyelesaian $x = $ ...",
    "opsi": [
     "$1$",
     "$2$",
     "$3$",
     "$4$",
     "$5$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: (1)+(2) → $3x + 2z = 9$; $2 \\times (1) - (3)$ → $x + 3z = 10$; selesaikan: $z = 3$, $x = 1$, $y = 2$. Jalur Cara Gemilang: eliminasi $y$ dari dua pasangan berbeda, sisanya tangga dua variabel."
   }
  ]
 },
 {
  "jenis": "judul",
  "teks": "Pemodelan Soal Cerita: Harga, Umur, Perbandingan"
 },
 {
  "jenis": "kilat",
  "teks": "Semua soal cerita SPL berpola sama: definisikan variabel, terjemahkan tiap kalimat menjadi satu persamaan, selesaikan, lalu KEMBALI ke pertanyaan. Jebakan tersering: berhenti di $x$ dan $y$ padahal yang diminta kombinasi keduanya."
 },
 {
  "jenis": "urutan",
  "judul": "🧩 Susun: langkah memodelkan soal cerita",
  "keterangan": "Urutan baku dari kalimat ke jawaban.",
  "items": [
   "Definisikan variabel untuk besaran yang belum diketahui",
   "Terjemahkan setiap kalimat informasi menjadi satu persamaan",
   "Selesaikan sistemnya (eliminasi / substitusi / campuran)",
   "Jawab sesuai pertanyaan — bisa berupa x, y, atau kombinasinya"
  ]
 },
 {
  "jenis": "alur",
  "judul": "Contoh berjalan: soal umur (pola soal 3 bank)",
  "items": [
   "Definisikan: umur Abdul saat ini $= a$, umur Yoga saat ini $= y$.",
   "\"Lima tahun lalu Abdul $4$ kali Yoga\": $a - 5 = 4(y - 5) \\Rightarrow a - 4y = -15$ …(1).",
   "\"Empat tahun lagi, 2 kali Abdul = 3 kali Yoga + 1\": $2(a + 4) = 3(y + 4) + 1 \\Rightarrow 2a - 3y = 5$ …(2).",
   "Eliminasi: $(1) \\times 2 \\rightarrow 2a - 8y = -30$; kurangkan dengan (2): $-5y = -35 \\Rightarrow y = 7$, lalu $a = 13$.",
   "Kembali ke pertanyaan: jumlah umur $= a + y = 13 + 7 = 20$ tahun."
  ]
 },
 {
  "jenis": "benarSalah",
  "judul": "⚖️ Cek pemodelan",
  "keterangan": "Gemilang Drill — terjemahkan kalimat dengan disiplin.",
  "items": [
   {
    "teks": "\"Tiga kali bilangan pertama ditambah dua kali bilangan kedua sama dengan 43\" ditulis $3x + 2y = 43$.",
    "jawaban": true,
    "penjelasan": "Koefisien menempel pada variabelnya masing-masing."
   },
   {
    "teks": "\"Jumlah dua bilangan adalah 17\" ditulis $x - y = 17$.",
    "jawaban": false,
    "penjelasan": "Jumlah $= x + y = 17$; selisih baru $x - y$."
   },
   {
    "teks": "Sistem $2x + 3y = 7$ dan $4x + 6y = 14$ mempunyai tepat satu penyelesaian.",
    "jawaban": false,
    "penjelasan": "Koefisien sebanding penuh ($\\frac{2}{4} = \\frac{3}{6} = \\frac{7}{14}$) → berimpit → tak hingga penyelesaian."
   },
   {
    "teks": "Pada soal umur, \"tiga tahun yang akan datang\" untuk umur $a$ ditulis $a + 3$.",
    "jawaban": true,
    "penjelasan": "Masa depan menambah, masa lalu mengurangi."
   }
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-CERITA: definisikan, terjemahkan, kembali",
  "teks": "Kamus terjemahan: \"jumlah\" $= +$, \"selisih\" $= -$, \"kali/perkalian\" $= \\times$, \"perbandingan\" $=$ pecahan. Definisi variabel adalah jangkar — sekali ditetapkan, konsisten sampai akhir.",
  "items": [
   "Umur: sekarang $a$; $k$ tahun lalu $= a - k$; $k$ tahun lagi $= a + k$.",
   "Harga belanjaan: yang ditanya sering kombinasi — cek dulu apakah bisa dirakit langsung dari persamaan.",
   "Perbandingan $p : q$: misalkan nilainya $pk$ dan $qk$ — hanya satu variabel baru."
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Harga $2$ buku dan $1$ pensil Rp8.000,00; harga $1$ buku dan $3$ pensil Rp9.000,00. Harga $1$ buku adalah ...",
    "opsi": [
     "Rp2.000,00",
     "Rp2.500,00",
     "Rp3.000,00",
     "Rp3.500,00",
     "Rp4.000,00"
    ],
    "jawaban": 2,
    "pembahasan": "Jalur konsep: $2b + p = 8.000$ dan $b + 3p = 9.000$; eliminasi → $5b = 15.000 \\Rightarrow b = 3.000$. Jalur Cara Gemilang: kali persamaan kedua dengan $2$ agar $b$ langsung rontok bersama pensilnya."
   },
   {
    "soal": "Lima tahun lalu perbandingan umur Ayah dan Budi $7 : 2$. Tahun ini jumlah umur mereka $55$ tahun. Umur Ayah saat ini adalah ...",
    "opsi": [
     "$35$ tahun",
     "$38$ tahun",
     "$40$ tahun",
     "$42$ tahun",
     "$45$ tahun"
    ],
    "jawaban": 2,
    "pembahasan": "Jalur konsep: lima tahun lalu $A - 5 = 7k$ dan $B - 5 = 2k$; jumlah sekarang $9k + 10 = 55 \\Rightarrow k = 5$; $A = 7(5) + 5 = 40$. Jalur Cara Gemilang: perbandingan = satu variabel $k$; jangan lupa $+5$ untuk kembali ke \"saat ini\"."
   },
   {
    "soal": "Perbandingan uang Rina dan Tina $3 : 5$. Jika selisih uang mereka Rp18.000,00, maka uang Tina adalah ...",
    "opsi": [
     "Rp27.000,00",
     "Rp36.000,00",
     "Rp45.000,00",
     "Rp54.000,00",
     "Rp72.000,00"
    ],
    "jawaban": 2,
    "pembahasan": "Jalur konsep: $5k - 3k = 18.000 \\Rightarrow k = 9.000$; Tina $= 5k = Rp45.000,00$. Jalur Cara Gemilang: selisih perbandingan ($5 - 3 = 2$ bagian) = selisih nyata; satu bagian langsung kebaca."
   }
  ]
 },
 {
  "jenis": "judul",
  "teks": "Pertidaksamaan Linier & Daerah Penyelesaian"
 },
 {
  "jenis": "kilat",
  "teks": "Pertidaksamaan linier dua variabel membagi bidang Cartesius menjadi dua setengah bidang yang dipisah sebuah garis. Sistem pertidaksamaan membentuk daerah layak — irisan semua setengah bidang. Dua keterampilan inti: menggambar garis dari titik potong sumbu dan menentukan tanda dari sisi arsiran."
 },
 {
  "jenis": "poin",
  "judul": "Garis & setengah bidang",
  "items": [
   "Garis melalui $(a, 0)$ dan $(0, b)$: $\\frac{x}{a} + \\frac{y}{b} = 1$ atau $bx + ay = ab$ — hafal pola titik potong, lebih cepat dari gradien.",
   "Uji titik $(0,0)$: substitusi ke pertidaksamaan; pernyataan benar → sisi memuat titik asal adalah daerah penyelesaian.",
   "Daerah penyelesaian SISTEM = irisan semua setengah bidang (arsiran yang ditumpuk semua syarat)."
  ]
 },
 {
  "jenis": "flashcard",
  "judul": "🃏 Flashcard: aturan tanda pertidaksamaan",
  "items": [
   {
    "depan": "Kedua ruas dikali/dibagi bilangan negatif",
    "belakang": "Tanda DIBALIK: $-2x < 6 \\Rightarrow x > -3$"
   },
   {
    "depan": "Tanda $\\leq$ atau $\\geq$",
    "belakang": "Garis batas digambar penuh (tegas); titik batas IKUT penyelesaian"
   },
   {
    "depan": "Tanda $<$ atau $>$",
    "belakang": "Garis batas putus-putus; titik batas TIDAK ikut"
   },
   {
    "depan": "Bingung sisi mana yang diarsir?",
    "belakang": "Uji $(0,0)$ — atau titik lain yang jelas tidak di garis"
   }
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-DAERAH: titik potong + uji titik",
  "teks": "Gambar garis dari dua titik potong sumbu (jangan hitung gradien). Arsir sisi yang lolos uji titik. Soal terbalik (arsiran → sistem): baca titik potongnya, rakit persamaan $\\frac{x}{a} + \\frac{y}{b} = 1$, tentukan tanda dari sisi arsiran.",
  "items": [
   "Syarat $x \\geq 0$, $y \\geq 0$ memotong daerah di kuadran I — hampir selalu ada di soal cerita.",
   "Titik pojok daerah = perpotongan garis-garis batas; simpan untuk soal program linier.",
   "Daerah tak terbatas? Wajar untuk $geq$ — yang penting irisan semua syaratnya."
  ]
 },
 {
  "jenis": "callout",
  "tipe": "peringatan",
  "judul": "Jebakan pertidaksamaan",
  "teks": "Mengali atau membagi dengan NEGATIF membalik tanda — pembunuh nilai nomor satu di bab ini. Dan perhatikan batas: $\\leq$ mengikutkan garis (solid), $<$ tidak (putus-putus). Selalu tulis ulang tanda setiap kali memanipulasi ruas."
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Daerah penyelesaian $2x + y \\leq 4$, $x \\geq 0$, $y \\geq 0$ berbentuk ...",
    "opsi": [
     "segitiga dengan titik sudut $(0,0)$, $(2,0)$, $(0,4)$",
     "segitiga dengan titik sudut $(0,0)$, $(4,0)$, $(0,2)$",
     "persegi panjang di kuadran I",
     "daerah di kanan atas garis $2x + y = 4$",
     "seluruh kuadran I"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: titik potong garis $2x + y = 4$ adalah $(2, 0)$ dan $(0, 4)$; uji $(0,0)$: $0 \\leq 4$ benar → sisi titik asal; dipotong $x, y \\geq 0$ → segitiga $(0,0)$, $(2,0)$, $(0,4)$. Jalur Cara Gemilang: titik potong sumbu = dua titik gambar; uji $(0,0)$ penentu sisi."
   },
   {
    "soal": "Titik yang merupakan penyelesaian sistem $x + y \\leq 5$ dan $2x - y \\geq 1$ adalah ...",
    "opsi": [
     "$(3, 2)$",
     "$(1, 3)$",
     "$(0, 5)$",
     "$(1, 4)$",
     "$(4, 4)$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: uji $(3,2)$: $3 + 2 = 5 \\leq 5$ ✓ dan $2(3) - 2 = 4 \\geq 1$ ✓ — memenuhi keduanya. Opsi lain gagal di salah satu syarat. Jalur Cara Gemilang: soal \"titik mana\" = uji cepat tiap opsi ke kedua syarat, mulai dari angka terkecil."
   },
   {
    "soal": "Pertidaksamaan yang daerah penyelesaiannya berada di atas garis melalui $(4, 0)$ dan $(0, 2)$ adalah ...",
    "opsi": [
     "$x + 2y \\geq 4$",
     "$x + 2y \\leq 4$",
     "$2x + y \\geq 4$",
     "$2x + y \\leq 4$",
     "$x + 4y \\geq 2$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: garis titik potong $a = 4$, $b = 2$: $\\frac{x}{4} + \\frac{y}{2} = 1 \\Leftrightarrow x + 2y = 4$; \"di atas\" = nilai lebih besar; uji $(0, 3)$: $6 \\geq 4$ ✓. Jalur Cara Gemilang: rakit $\\frac{x}{a} + \\frac{y}{b} = 1$, tanda dari uji titik di sisi arsiran."
   }
  ]
 },
 {
  "jenis": "judul",
  "teks": "Program Linier & Interpretasi Data"
 },
 {
  "jenis": "kilat",
  "teks": "Program linier mencari nilai maksimum/minimum fungsi tujuan $f(x, y) = ax + by$ pada daerah layak yang dibatasi pertidaksamaan. Teorema pojok: optimum SELALU dicapai di titik pojok daerah. Soal grafik penjualan = membaca data garis per kategori per tahun."
 },
 {
  "jenis": "alur",
  "judul": "🧭 Resep program linier lima langkah",
  "items": [
   "Definisikan $x$ dan $y$ untuk dua besaran yang diputuskan",
   "Terjemahkan tiap batas sumber daya jadi pertidaksamaan; tambahkan $x \\geq 0$, $y \\geq 0$",
   "Tentukan daerah layak dan SEMUA titik pojoknya (termasuk perpotongan dua garis kendala)",
   "Substitusi tiap pojok ke fungsi tujuan $f(x, y)$",
   "Terbesar = maksimum, terkecil = minimum — jawab sesuai kalimat pertanyaan"
  ]
 },
 {
  "jenis": "caraGemilang",
  "judul": "👑 CG-LP: pojok adalah raja",
  "teks": "Optimum program linier tidak pernah di tengah daerah — selalu di pojok. Daftar pojok, uji semua ke fungsi tujuan, selesai. Pojok \"tersembunyi\" = perpotongan DUA garis kendala (bukan di sumbu) — sering jadi juara.",
  "items": [
   "Kata kunci: \"paling banyak / tidak lebih dari\" → $\\leq$; \"sekurang-kurangnya / minimal\" → $\\geq$.",
   "Perpotongan dua kendala: selesaikan sebagai SPL dua variabel (bab ini juga!).",
   "Satuan wajib konsisten: ribu-rupiah, jam, unit — satu model satu satuan."
  ]
 },
 {
  "jenis": "zona",
  "items": [
   {
    "soal": "Dengan kendala $x + y \\leq 8$, $2x + y \\leq 12$, $x \\geq 0$, $y \\geq 0$, nilai maksimum $f = 3x + 2y$ adalah ...",
    "opsi": [
     "$16$",
     "$18$",
     "$20$",
     "$22$",
     "$24$"
    ],
    "jawaban": 2,
    "pembahasan": "Jalur konsep: pojok: $(0,0) \\to 0$; $(6,0) \\to 18$; $(0,8) \\to 16$; perpotongan $x + y = 8$ dan $2x + y = 12$ → $(4,4) \\to 20$ maksimum. Jalur Cara Gemilang: pojok perpotongan dua kendala diuji terakhir — biasanya sang juara."
   },
   {
    "soal": "Titik potong garis $3x + 4y = 270$ dan $5x + 3y = 340$ adalah ...",
    "opsi": [
     "$(40, 35)$",
     "$(50, 30)$",
     "$(30, 50)$",
     "$(60, 20)$",
     "$(45, 35)$"
    ],
    "jawaban": 1,
    "pembahasan": "Jalur konsep: $(\\times 3)$ vs $(\\times 4)$: $9x + 12y = 810$ dan $20x + 12y = 1.360$ → $-11x = -550 \\Rightarrow x = 50$, $y = 30$. Jalur Cara Gemilang: samakan koefisien $y$ sekali jalan; angka \"kantor\" ($270$, $340$) khas soal program linier."
   },
   {
    "soal": "Lahan parkir $360\\ m^{2}$ muat maksimal $30$ kendaraan. Mobil butuh $6\\ m^{2}$, bus $24\\ m^{2}$. Dengan $x$ = banyak mobil dan $y$ = banyak bus, model matematika yang benar adalah ...",
    "opsi": [
     "$x + y \\leq 30$; $x + 4y \\leq 60$; $x \\geq 0$; $y \\geq 0$",
     "$x + y \\leq 30$; $4x + y \\leq 60$; $x \\geq 0$; $y \\geq 0$",
     "$x + y \\geq 30$; $x + 4y \\leq 60$; $x \\geq 0$; $y \\geq 0$",
     "$x + y \\leq 30$; $x + 4y \\leq 360$; $x \\geq 0$; $y \\geq 0$",
     "$x + y \\leq 360$; $6x + 24y \\leq 30$; $x \\geq 0$; $y \\geq 0$"
    ],
    "jawaban": 0,
    "pembahasan": "Jalur konsep: jumlah kendaraan $x + y \\leq 30$; luas $6x + 24y \\leq 360$ dibagi $6$ menjadi $x + 4y \\leq 60$; jumlah tak pernah negatif. Jalur Cara Gemilang: sederhanakan pertidaksamaan luas dulu (bagi FPB) — opsi pengecoh biasanya lupa menyederhanakan atau menukar koefisien."
   }
  ]
 },
 {
  "jenis": "callout",
  "tipe": "info",
  "judul": "Bab 2 tuntas",
  "teks": "Empat keluarga soal bab ini: SPL murni, model cerita (harga-umur-perbandingan), pertidaksamaan & daerah, program linier & data. Labeli tiap nomor latihan dengan keluarganya; bila macet, kembali ke kartu CG yang sesuai."
 }
];

// ---------- rakit soal ----------
// Turn 90 (koreksi owner): opsi bagan soal 4, 16, 18 pada cetakan/HTML
// asli berupa GAMBAR SVG — diekstrak ke public/bagan/ lewat
// scripts/ekstrak-bagan-svg.mjs; teks opsi menjadi keterangan kecil.
const OPSI_GAMBAR = {};
const SUMBER = 'Bank owner: Sukses Tes Kemampuan Akademik SMA/Saintek, Bab 2 Sistem Persamaan & Pertidaksamaan Linier (soal+kunci+pembahasan bawaan HTML bank owner; 4 diagram SVG asli buku diekstrak ke public/gambar-bing/mate2-s5,s7,s8,s21.svg; salah cetak soal 16 dikoreksi mengikuti pembahasan resmi); kunci & pembahasan buku (soal asli #{no})';
const NAT = true;
const GAMBAR_GRUP = {};
const SOAL_GAMBAR = {"5":"/gambar-bing/mate2-s5.svg","7":"/gambar-bing/mate2-s7.svg","8":"/gambar-bing/mate2-s8.svg","21":"/gambar-bing/mate2-s21.svg"};
const OPSI_TEKS = {"5":["Daerah I","Daerah II","Daerah III","Daerah IV","Daerah V"],"7":["$2x + 3y \\leq 12$; $-3x + 2y \\geq -6$; $x \\geq 0$, $y \\geq 0$","$2x + 3y \\leq 12$; $-3x + 2y \\leq -6$; $x \\geq 0$, $y \\geq 0$","$2x + 3y \\geq 12$; $-3x + 2y \\geq -6$; $x \\geq 0$, $y \\geq 0$","$2x + 3y \\geq 12$; $-3x + 2y \\leq -6$; $x \\geq 0$, $y \\geq 0$","$-2x + 3y \\leq 12$; $3x + 2y \\leq -6$; $x \\geq 0$, $y \\geq 0$"],"8":["$\\begin{cases} 25x + 3y \\leq 70 \\\\ 3x + 25y \\leq 70 \\\\ x \\geq 0 \\\\ y \\geq 0 \\end{cases}$","$\\begin{cases} 25x + 30y \\leq 70 \\\\ 30x + 25y \\leq 70 \\\\ x \\geq 0 \\\\ y \\geq 0 \\end{cases}$","$\\begin{cases} 5x - 6y \\leq 70 \\\\ 6x + 5y \\leq 70 \\\\ x \\geq 0 \\\\ y \\geq 0 \\end{cases}$","$\\begin{cases} 5x + 6y \\leq 140 \\\\ 6x + 5y \\leq 140 \\\\ x \\geq 0 \\\\ y \\geq 0 \\end{cases}$","$\\begin{cases} 5x + 5y \\leq 140 \\\\ 6x + 6y \\leq 140 \\\\ x \\geq 0 \\\\ y \\geq 0 \\end{cases}$"]};
const OV = {"24":{"jaw":[0,1,0]}};
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
    judul: "Bab 2 — Sistem Persamaan dan Pertidaksamaan Linier (Edisi Cara Gemilang)",
    ringkasan: "SPL dua & tiga variabel (eliminasi-substitusi, bentuk kebalikan, syarat banyak penyelesaian), pemodelan soal cerita (harga, umur, perbandingan), pertidaksamaan linier & daerah penyelesaian (titik potong sumbu, uji titik, membaca arsiran), program linier (titik pojok & fungsi tujuan), serta interpretasi grafik garis — semua rumus ditulis LaTeX natural; 25 soal resmi bank (17 pg, 4 pgMulti, 4 tabel Benar/Salah) + pembahasan dua jalur; 4 diagram SVG asli buku (daerah I-V, arsiran, model kaus, grafik penjualan ikan).",
    estimasiMenit: 75, urutan: 2, tipe: 'teks',
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

const outDraft = join(ROOT, 'docs/drafts/draft-matematika-k12-v1-bab2.json');
const outImpor = join(ROOT, 'IMPOR-MATEMATIKA-BAB2-TERBARU.json');
writeFileSync(outDraft, json + '\n');
writeFileSync(outImpor, json + '\n');
console.log('SELESAI IMPOR-MATEMATIKA-BAB2-TERBARU.json | sections:', sections.length, '| soal:', ujiPemahaman.length, '| ukuran:', (json.length / 1024).toFixed(1), 'KB');
