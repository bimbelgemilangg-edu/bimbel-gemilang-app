// Config bab 1 — BILANGAN, HIMPUNAN, DAN EKSPONEN (Matematika K12, turn 102)
// Konten memakai String.raw agar LaTeX ditulis natural (backslash tunggal);
// generator men-JSON.stringify sehingga escaping ke builder otomatis benar.
export const INPUT = '../.ekstrak-mate1.json';
export const OUT_DRAFT = 'docs/drafts/draft-matematika-k12-v1-bab1.json';
export const OUT_IMPOT = 'IMPOR-MATEMATIKA-BAB1-TERBARU.json';
export const BUILDER = 'scripts/build-mate-k12-bab1.mjs';
export const SUMBER_TEKS = 'Bab 1 Bilangan-Himpunan-Eksponen (soal+kunci+pembahasan bawaan HTML bank owner; rumus buku dikonversi LaTeX otomatis; salah cetak soal 13 dikoreksi mengikuti pembahasan resmi)';
export const BAHASA = 'id';
export const NATURALISASI = true;

export const CG = {
  1: String.raw`Samakan wujud dulu: $3\frac{3}{8} = 3,375$ dan $125\% = 1,25$; kerjakan $\times$ dan $:$ sebelum $+$ dan $-$ (Kabataku).`,
  2: String.raw`Bakteri = pangkat 2: $n = \frac{t}{T} = \frac{600}{20} = 30$ periode; serap faktor $2$ dari $10 = 5 \cdot 2$ ke basis jadi $5 \cdot 2^{31}$.`,
  3: String.raw`Ubah semua ke basis prima $2$ dan $3$, kurangkan pangkatnya: $2^{2/3 - 1/3} \cdot 3^{1/6 - 1/2} = \left(\frac{2}{3}\right)^{1/3}$.`,
  4: String.raw`Gabungkan jadi satu pangkat: $2^{2026} \times 7^{2026} \times 7 = 14^{2026} \times 7$; satuan $14^{n}$ bergantian $4$-$6$ (ganjil-genap), $2026$ genap.`,
  5: String.raw`Beda tipis = skor $3$-$2$: Gol A $= 3a$, Gol B $= 2a + 3b$, selisih $= 3b - a$ terbesar saat $a$ terkecil yang masih mayoritas ($a = 6, b = 5$).`,
  6: String.raw`Daftarkan anggota dulu baru operasi: $A \cap B$ = yang kembar di keduanya, lalu $\cup\ C$ menambahkan semua anggota $C$.`,
  7: String.raw`Subset = "semua anggota A ada di B": daftar kedua himpunan, cek satu-satu arah panahnya.`,
  8: String.raw`Definisi adalah raja: pasang $a = 4$, $c = 2$, $d = 3$, $e = 2$, $f = -1$ ke $a(b + c) - d \times e + f = 4b + 1 \geq 5$.`,
  9: String.raw`$\sqrt[3]{32.768} = 32$ (ingat $32^{3}$); dan "bagi $25\%$" = "kali $4$" karena $25\% = \frac{1}{4}$.`,
  10: String.raw`Kerjakan dari dalam: $3 \oplus 1 = 3$ dulu, baru selesaikan $\frac{6r}{r + 1} = 4$ dengan kali silang.`,
  11: String.raw`Pecahkan ketiganya ke desimal: $0,19$; $0,1909\ldots$; $0,193$ — selisih tipis, butuh $4$ angka di belakang koma.`,
  12: String.raw`Ubah cerita jadi pertidaksamaan pangkat: $100 \cdot 2^{t/20} \geq 80\% \times 16.000 \Rightarrow 2^{t/20} \geq 2^{7} \Rightarrow t \geq 140$ menit.`,
  13: String.raw`Pola selisih kuadrat $(\sqrt{5} + \sqrt{2})(\sqrt{5} - \sqrt{2}) = 5 - 2 = 3$; rasionalkan $\frac{3}{2 + \sqrt{3}}$ dengan sekawan $2 - \sqrt{3}$.`,
  14: String.raw`Pasangan sekawan: penyebut jadi $4 - 3 = 1$; pembilang $(2 + \sqrt{3})^{2} + (2 - \sqrt{3})^{2}$ — suku akarnya saling menghilangkan.`,
  15: String.raw`Satukan pecahan: $x^{-1} + y^{-1} = \frac{x + y}{xy}$; akar dari kuadrat sempurna turun ke bawah jadi $\frac{\sqrt{x + y}}{xy}$.`,
  16: String.raw`Samakan basis dulu ($27 = 3^{3}$), baru samakan pangkatnya: $2x - 1 = 3x + 9$.`,
  17: String.raw`Menara pangkat diruntuhkan dari dalam: $2^{xyz} = ((2^{x})^{y})^{z} = (5^{y})^{z} = 4^{z} = 3$; sisa $2^{2} = 4$ tinggal dikali.`,
  18: String.raw`Skor $= 4b - s$ (kosong $= 0$), ambang terima $325$; hitung per orang: benar $\times 4$ dikurang salah $\times 1$.`,
  19: String.raw`Tulis dulu ketiga himpunan lengkap, baru uji tiap pernyataan pakai $\cap$ (kembar) dan $\cup$ (gabung tanpa dobel).`,
  20: String.raw`Substitusi $a = -1$ ke dua ruas: $\frac{1}{4} < f(a) < 4$ — tanda $<$ tegas, nilai batas TIDAK ikut.`,
  21: String.raw`Terjemahkan definisi ke rumus: $\Delta(a, b) = \frac{a + b}{a}$ dan $\nabla(a, b) = ab + 2b$; uji pernyataan satu-satu.`,
  22: String.raw`Akar bersarang: $\sqrt{6 + \sqrt{32}} = \sqrt{6 + 2\sqrt{8}}$; cari dua bilangan jumlah $6$ kali $8$ yaitu $4$ dan $2$ → $\sqrt{4} + \sqrt{2}$.`,
  23: String.raw`Baca Venn per daerah: $P \cap Q$ = irisan saja, $(P \cup Q)^{c}$ = di luar kedua lingkaran, $P - Q$ = $P$ buang irisan.`,
  24: String.raw`Kuadrat tersamar: misal $p = 5^{x}$, faktorkan $p^{2} - 126p + 125 = (p - 125)(p - 1)$.`,
  25: String.raw`Substitusi $b = 2$ ke definisi, dapat $a^{2} - 4a = 0$; ambil $a = 4$ (bulat positif, $a \neq 2$ agar penyebut bukan nol).`,
};

// Salah cetak buku didokumentasikan (aturan sumber berjejak).
export const CATATAN_KUNCI = {
  13: String.raw` (Catatan: cetakan buku menuliskan faktor $(\sqrt{6} - \sqrt{2})$ pada soal, tetapi pembahasan resmi menghitung selisih kuadrat $5 - 2 = 3$ — artinya faktor kedua yang dimaksud adalah $(\sqrt{5} - \sqrt{2})$. Teks soal di sini dikoreksi mengikuti pembahasan agar konsisten dengan opsi dan kunci C.)`,
};

// Konsep ditulis ulang untuk soal yang markup bukunya rusak/datar:
// 4 (kurung kurawal penanda pola rusak jadi &#125;), 8 (isi kurung matriks hilang di pembahasan),
// 6/7/19/23 (kurung kurawal himpunan polos hilang bila dirender KaTeX), 22-25 (tipe tabel:
// jalur konsep buku berupa uraian panjang, bukan sekadar label baris).
export const KONSEP = {
  4: String.raw`Gabungkan ke pangkat sama: $2 \cdot 2^{2025} \times 7^{2027} = 2^{2026} \times 7^{2026} \times 7 = 14^{2026} \times 7$. Angka satuan $14^{n}$: $14^{1} \to 4$, $14^{2} \to 6$, $14^{3} \to 4$, $14^{4} \to 6$ — pola berulang tiap $2$: pangkat ganjil $\to 4$, pangkat genap $\to 6$. Karena $2026$ genap, satuan $14^{2026} = 6$; maka satuan $14^{2026} \times 7$ = satuan dari $6 \times 7 = 42$ yaitu $2$. Jawaban: B`,
  6: String.raw`Daftar anggota: $A = \{4, 5, 6\}$ (asli antara $3$ dan $7$), $B = \{1, 3, 5, 7, 9, 11, \ldots\}$ (ganjil), $C = \{2, 3, 5, 7\}$ (prima $\leq 10$). Irisan $A \cap B = \{5\}$ (satu-satunya anggota $A$ yang ganjil). Maka $(A \cap B) \cup C = \{5\} \cup \{2, 3, 5, 7\} = \{2, 3, 5, 7\}$. Jawaban: E`,
  7: String.raw`$A = \{2, 4, 6, 8, 10\}$ (genap positif $\leq 10$) dan $B = \{0, 1, 2, \ldots, 12\}$ (cacah $< 13$). Setiap anggota $A$ juga anggota $B$, tetapi ada anggota $B$ (misalnya $1$) yang bukan anggota $A$; jadi hubungannya $A \subset B$ (A himpunan bagian sejati dari B). Jawaban: B`,
  8: String.raw`Definisi operasi: $\left\langle \begin{matrix} a & b \\ d & e \end{matrix} \right\rangle c\; f = a(b + c) - d \times e + f$. Untuk $A = \left\langle \begin{matrix} 4 & b \\ 3 & 2 \end{matrix} \right\rangle 2\; (-1)$ berarti $a = 4$, $d = 3$, $e = 2$, $c = 2$, $f = -1$, sehingga $A = 4(b + 2) - 3 \times 2 + (-1) = 4b + 8 - 6 - 1 = 4b + 1$. Karena $b$ bilangan asli (minimal $1$), $A = 4b + 1 \geq 5 > 4 = B$, jadi $A > B$. Jawaban: A`,
  19: String.raw`$A = \{2, 3, 5, 7, 11, 13, 17, 19, 23, 29\}$ (prima $\leq 29$), $B = \{5, 7, 9, 11, 13, 15, 17, 19, 21, 23\}$ (ganjil antara $4$ dan $24$), $C = \{1, 2, \ldots, 10\}$ ($10$ asli pertama). Pernyataan 1 Salah: $A \cap B = \{5, 7, 11, 13, 17, 19, 23\}$ (angka $4$ bukan prima). Pernyataan 2 Benar: $B \cap C = \{5, 7, 9\}$. Pernyataan 3 Salah: $A \cap C = \{2, 3, 5, 7\}$ (tanpa $9$). Pernyataan 4 Benar: $n(A \cup B) = 13$. Pernyataan 5 Salah: $n(B \cup C) = 17$, bukan $20$. Jawaban: Pernyataan 2 dan 4`,
  22: String.raw`$\sqrt{6 + \sqrt{32}} = \sqrt{6 + 2\sqrt{8}}$. Pola akar bersarang $\sqrt{(b + c) + 2\sqrt{bc}} = \sqrt{b} + \sqrt{c}$ dengan $b + c = 6$ dan $bc = 8$, yaitu $b = 4$ dan $c = 2$. Jadi $\sqrt{6 + 2\sqrt{4 \cdot 2}} = \sqrt{4} + \sqrt{2} = 2 + \sqrt{2} = p + \sqrt{q}$ sehingga $p = 2$ dan $q = 2$. Baris 1 SALAH ($p = 2$, bukan $3$); Baris 2 BENAR ($q = 2$); Baris 3 BENAR ($p^{q} = 2^{2} = 4$). Jawaban: Salah, Benar, Benar`,
  23: String.raw`Dari diagram Venn: semesta $S = \{1, 2, \ldots, 8\}$, lingkaran $P = \{1, 2, 3, 4\}$, lingkaran $Q = \{4, 5, 6\}$, irisan memuat angka $4$. Baris 1 SALAH: $P \cap Q = \{4\}$, bukan $\{1, 2, 3, 4, 5, 6\}$ (itu gabungan). Baris 2 BENAR: $(P \cup Q)^{c} = \{7, 8\}$ (di luar kedua lingkaran). Baris 3 BENAR: $P - Q = \{1, 2, 3\}$ ($P$ tanpa anggota irisan). Jawaban: Salah, Benar, Benar`,
  24: String.raw`Misal $p = 5^{x}$ sehingga $(5^{x})^{2} - 126 \cdot 5^{x} + 125 = 0$ menjadi $p^{2} - 126p + 125 = 0 \Rightarrow (p - 125)(p - 1) = 0 \Rightarrow p = 125$ atau $p = 1$. Lalu $5^{x} = 5^{3} \Rightarrow x_{1} = 3$ dan $5^{x} = 5^{0} \Rightarrow x_{2} = 0$. Baris 1 BENAR: $x_{1} + x_{2} = 3 + 0 = 3$. Baris 2 BENAR: $2x_{1} + x_{2} = 6 + 0 = 6$. Baris 3 SALAH: $\frac{x_{2}}{x_{1}} = \frac{0}{3} = 0$, bukan $1$. Jawaban: Benar, Benar, Salah`,
  25: String.raw`$a \circ 2 = \frac{a \cdot 2 - (a - 2)^{2}}{a - 2} = 2$. Kali kedua ruas dengan $(a - 2)$: $2a - (a^{2} - 4a + 4) = 2(a - 2) \Rightarrow 2a - a^{2} + 4a - 4 = 2a - 4 \Rightarrow -a^{2} + 4a = 0 \Rightarrow a(a - 4) = 0$, jadi $a = 0$ atau $a = 4$; karena $a$ bulat positif maka $a = 4$. Baris 1 BENAR: $4$ kelipatan $2$. Baris 2 BENAR: $4$ komposit ($1, 2, 4$). Baris 3 SALAH: $1 \circ 2 = \frac{2 - 1}{-1} = -1$, bukan $-4$. Jawaban: Benar, Benar, Salah`,
};

// Pembersihan artefak scan & penyatuan notasi himpunan agar aman KaTeX.
export const OCR_FIX = [
  [String.raw`\frac{}{} `, ''],
  [String.raw`\frac{}{}`, ''],
  [String.raw`\sqrt{\phantom{x}} 32`, String.raw`\sqrt{32}`],
  [String.raw`\sqrt{\phantom{x}} 4\cdot 8`, String.raw`\sqrt{4 \cdot 8}`],
  [String.raw`\sqrt{\phantom{x}} 4\cdot 2`, String.raw`\sqrt{4 \cdot 2}`],
  [String.raw`\sqrt{\phantom{x}} 8`, String.raw`\sqrt{8}`],
  ['&#125;', ''],
  [String.raw`(\sqrt{6} - \sqrt{2})`, String.raw`(\sqrt{5} - \sqrt{2})`],
  [String.raw`\langle a b d e \rangle c f`, String.raw`\left\langle \begin{matrix} a & b \\ d & e \end{matrix} \right\rangle c\; f`],
  [String.raw`\langle 4 b 3 2 \rangle`, String.raw`\left\langle \begin{matrix} 4 & b \\ 3 & 2 \end{matrix} \right\rangle`],
  [String.raw`A = {x | 3 < x < 7, x \in bilangan asli}`, String.raw`A = \{x \mid 3 < x < 7,\ x \in \text{bilangan asli}\}`],
  [String.raw`B = {x | x bilangan ganjil, x \in bilangan cacah}`, String.raw`B = \{x \mid x\ \text{bilangan ganjil},\ x \in \text{bilangan cacah}\}`],
  [String.raw`C = {x | x \leq 10, x \in bilangan prima}`, String.raw`C = \{x \mid x \leq 10,\ x \in \text{bilangan prima}\}`],
  [String.raw`A = {x | x \leq 10, x \in bilangan genap positif}`, String.raw`A = \{x \mid x \leq 10,\ x \in \text{bilangan genap positif}\}`],
  [String.raw`B = {x | x < 13, x \in bilangan cacah}`, String.raw`B = \{x \mid x < 13,\ x \in \text{bilangan cacah}\}`],
  [String.raw`P \cap Q = {1, 2, 3, 4, 5, 6}`, String.raw`P \cap Q = \{1, 2, 3, 4, 5, 6\}`],
  [String.raw`(P \cup Q)^{c} = {7, 8}`, String.raw`(P \cup Q)^{c} = \{7, 8\}`],
  [String.raw`P - Q = {1, 2, 3}`, String.raw`P - Q = \{1, 2, 3\}`],
  ['diagram venn berikut! S P Q 1 2 3 4 5 6 7 8 Tentukan', String.raw`diagram Venn berikut! Himpunan semesta $S = \{1, 2, 3, 4, 5, 6, 7, 8\}$; lingkaran $P$ memuat $\{1, 2, 3, 4\}$ dan lingkaran $Q$ memuat $\{4, 5, 6\}$ (irisan keduanya adalah angka $4$); angka $7$ dan $8$ berada di luar kedua lingkaran. Tentukan`],
];

export const SECTIONS_DATA = [
  // ===== SUBBAB A: BILANGAN & OPERASI =====
  { jenis: 'judul', teks: 'Bilangan & Operasi: Pecahan, Persen, Desimal' },
  { jenis: 'kilat', teks: String.raw`Semua bilangan bisa saling menyamar: pecahan, persen, desimal, sampai pangkat besar. Kunci kecepatan TKA ada dua: pilih SATU wujud (desimal atau pecahan), ubah semuanya ke wujud itu, lalu hitung dengan urutan operasi yang benar.` },
  { jenis: 'peta', teks: String.raw`Bab 1 adalah fondasi aritmetika seluruh seri: operasi bilangan muncul lagi di barisan-deret (bab 4), statistika (bab 5), dan bangun ruang (bab 6); himpunan menempel di peluang; eksponen adalah bahasa wajib soal pertumbuhan. Tiga keluarga soal bab ini: hitung campuran, teori himpunan, dan pangkat-akar.` },
  {
    jenis: 'tabelinfo', judul: 'Tukar wujud bilangan (paling sering keluar)',
    kolom: ['Dari', 'Ke', 'Contoh & cara'],
    rows: [
      { k: 'Persen', v: 'Desimal', w: String.raw`$125\% = 1,25$ — geser koma dua ke kiri.` },
      { k: 'Persen', v: 'Pecahan', w: String.raw`$75\% = \frac{75}{100} = \frac{3}{4}$ — bagi $100$, sederhanakan.` },
      { k: 'Pecahan', v: 'Desimal', w: String.raw`$\frac{3}{8} = 0,375$ — bagi bersusun.` },
      { k: 'Desimal', v: 'Pecahan', w: String.raw`$0,375 = \frac{375}{1000} = \frac{3}{8}$ — hitung angka desimalnya.` },
      { k: 'Pecahan', v: 'Persen', w: String.raw`$\frac{2}{5} = \frac{40}{100} = 40\%$ — samakan penyebut ke $100$.` },
    ],
  },
  {
    jenis: 'urutan', judul: '🧩 Susun: urutan operasi campuran (Kabataku)',
    keterangan: 'Salah urutan = hasil mirip pengecoh. Susun dari yang dikerjakan pertama.',
    items: [
      'Tanda kurung & pengelompokan dikerjakan paling awal',
      'Pangkat dan akar (termasuk bentuk akar bersarang)',
      'Kali dan bagi, urut dari kiri ke kanan',
      'Tambah dan kurang, urut dari kiri ke kanan',
    ],
  },
  {
    jenis: 'benarSalah', judul: '⚖️ Cek rasa bilangan',
    keterangan: 'Gemilang Drill — pemanasan sebelum masuk soal resmi bank.',
    items: [
      { teks: String.raw`$0,25 = 25\% = \frac{1}{4}$ adalah bilangan yang sama.`, jawaban: true, penjelasan: 'Tiga wujud, satu nilai.' },
      { teks: String.raw`Membagi suatu bilangan dengan $0,2$ sama dengan mengalikannya dengan $5$.`, jawaban: true, penjelasan: String.raw`$0,2 = \frac{1}{5}$; bagi pecahan = kali kebalikannya.` },
      { teks: String.raw`$3\frac{3}{8} = 3,375$.`, jawaban: true, penjelasan: String.raw`$\frac{3}{8} = 0,375$.` },
      { teks: String.raw`$125\% \times 4,2$ hasilnya lebih kecil dari $4,2$.`, jawaban: false, penjelasan: String.raw`$125\% = 1,25 > 1$, jadi hasilnya $5,25$ — justru lebih besar.` },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-BILANGAN: satu wujud, satu urutan',
    teks: String.raw`Soal campuran pecahan-persen-desimal? Ubah SEMUA ke satu wujud dulu (desimal paling aman bila opsi berdesimal), lalu taati Kabataku tanpa lompat langkah.`,
    items: [
      String.raw`Persen tinggal dibagi $100$: $125\% = 1,25$.`,
      String.raw`Bagi dengan pecahan = kali kebalikannya: $: 0,2$ sama dengan $\times 5$.`,
      'Pangkat raksasa jangan dihitung penuh — cari POLA angka satuannya.',
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: pola angka satuan pangkat',
    items: [
      { depan: String.raw`Satuan $2^{n}$`, belakang: '$2, 4, 8, 6$ — berulang tiap $4$ pangkat.' },
      { depan: String.raw`Satuan $7^{n}$`, belakang: '$7, 9, 3, 1$ — berulang tiap $4$ pangkat.' },
      { depan: String.raw`Satuan $14^{n}$`, belakang: '$4, 6, 4, 6$ — pangkat ganjil $4$, genap $6$.' },
      { depan: String.raw`Satuan $5^{n}$ dan $6^{n}$`, belakang: 'Selalu $5$ dan selalu $6$ (pola tetap).' },
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: String.raw`Hasil dari $2\frac{1}{4} \times 0,5 : 25\%$ adalah ...`, opsi: ['$4,5$', '$3,5$', '$5,0$', '$2,25$', '$9,0$'], jawaban: 0, pembahasan: String.raw`Jalur konsep: $2,25 \times 0,5 = 1,125$; lalu $1,125 : 0,25 = 4,5$. Jalur Cara Gemilang: satu wujud desimal + Kabataku (kali-bagi dari kiri).` },
      { soal: String.raw`Angka satuan dari $3^{2026}$ adalah ...`, opsi: ['$1$', '$3$', '$7$', '$9$', '$5$'], jawaban: 3, pembahasan: String.raw`Jalur konsep: pola satuan $3^{n}$ adalah $3, 9, 7, 1$ berulang tiap $4$; $2026 = 4 \times 506 + 2$ sehingga jatuh di angka ke-$2$, yaitu $9$. Jalur Cara Gemilang: sisa bagi $4$ = posisi dalam pola.` },
      { soal: String.raw`Bilangan terbesar di antara $0,45$; $45\%$; $\frac{9}{20}$; dan $\frac{5}{11}$ adalah ...`, opsi: [String.raw`$0,45$`, String.raw`$45\%$`, String.raw`$\frac{9}{20}$`, String.raw`$\frac{5}{11}$`, 'Semua sama besar'], jawaban: 3, pembahasan: String.raw`Jalur konsep: $0,45 = 45\% = \frac{9}{20} = 0,4500$, sedangkan $\frac{5}{11} = 0,4545\ldots$ lebih besar. Jalur Cara Gemilang: desimalkan semua, bandingkan digit ketiga di belakang koma.` },
    ],
  },

  // ===== SUBBAB B: HIMPUNAN =====
  { jenis: 'judul', teks: 'Himpunan: Notasi, Operasi, Diagram Venn' },
  { jenis: 'kilat', teks: String.raw`Himpunan adalah kumpulan objek dengan syarat terdefinisi jelas. Notasi pembentuk $\{x \mid \text{syarat}\}$ dibaca "x sehingga syarat". Empat operasi pokok: irisan $\cap$ (dan), gabungan $\cup$ (atau), selisih $-$ (buang), dan komplemen $^{c}$ (sisanya semesta).` },
  {
    jenis: 'poin', judul: 'Membaca notasi pembentuk himpunan', items: [
      String.raw`$\{x \mid 3 < x < 7,\ x \in \text{bilangan asli}\} = \{4, 5, 6\}$ — batas tegas ($3$ dan $7$) TIDAK ikut.`,
      String.raw`$\{x \mid x \leq 10,\ x \in \text{bilangan prima}\} = \{2, 3, 5, 7\}$ — prima terkecil adalah $2$, dan $1$ bukan prima.`,
      String.raw`Cacah dimulai dari $0$; asli dimulai dari $1$; ganjil-genap hanya untuk bilangan bulat.`,
    ],
  },
  {
    jenis: 'tabelinfo', judul: 'Operasi himpunan',
    kolom: ['Simbol', 'Nama', 'Artinya'],
    rows: [
      { k: String.raw`$A \cap B$`, v: 'Irisan', w: String.raw`Anggota yang ada di $A$ DAN di $B$ sekaligus.` },
      { k: String.raw`$A \cup B$`, v: 'Gabungan', w: String.raw`Semua anggota $A$ ATAU $B$; yang kembar dihitung sekali.` },
      { k: String.raw`$A - B$`, v: 'Selisih', w: String.raw`Anggota $A$ yang BUKAN anggota $B$.` },
      { k: String.raw`$A^{c}$`, v: 'Komplemen', w: String.raw`Anggota semesta $S$ yang berada di luar $A$.` },
      { k: String.raw`$A \subset B$`, v: 'Subset', w: String.raw`Setiap anggota $A$ juga menjadi anggota $B$.` },
    ],
  },
  {
    jenis: 'jodohMini', judul: '🔗 Jodohkan: notasi dan artinya',
    items: [
      { kiri: String.raw`$A \cap B$`, kanan: 'Irisan — anggota persekutuan' },
      { kiri: String.raw`$A \cup B$`, kanan: 'Gabungan — semua anggota tanpa dobel' },
      { kiri: String.raw`$A - B$`, kanan: 'Selisih — A dibuang yang ada di B' },
      { kiri: String.raw`$A^{c}$`, kanan: 'Komplemen — di luar A dalam semesta' },
      { kiri: String.raw`$A \subset B$`, kanan: 'A himpunan bagian dari B' },
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-HIMPUNAN: daftar dulu, baru operasi',
    teks: String.raw`Hampir semua soal himpunan TKA tuntas dengan satu jurus: DAFTARKAN anggota tiap himpunan secara eksplisit, lalu coret-tandai per operasi. Diagram Venn adalah alat cek, bukan alat hitung.`,
    items: [
      String.raw`Notasi $\{x \mid \ldots\}$: uji angka satu-satu terhadap syaratnya.`,
      'Irisan = cari yang kembar; gabungan = tulis semua tanpa duplikat.',
      String.raw`Rumus banyak anggota: $n(A \cup B) = n(A) + n(B) - n(A \cap B)$.`,
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: String.raw`Diketahui $S = \{1, 2, \ldots, 10\}$, $A = \{2, 4, 6, 8, 10\}$, dan $B = \{1, 2, 3, 4\}$. Maka $A \cap B = $ ...`, opsi: [String.raw`$\{2, 4\}$`, String.raw`$\{1, 2, 3, 4\}$`, String.raw`$\{2\}$`, String.raw`$\{4\}$`, String.raw`$\{1, 2, 3, 4, 6, 8, 10\}$`], jawaban: 0, pembahasan: String.raw`Jalur konsep: anggota yang muncul di $A$ sekaligus $B$ hanya $2$ dan $4$. Jalur Cara Gemilang: coret kembar dua daftar, abaikan sisanya.` },
      { soal: String.raw`Jika $n(A) = 8$, $n(B) = 7$, dan $n(A \cap B) = 3$, maka $n(A \cup B) = $ ...`, opsi: ['$12$', '$13$', '$15$', '$18$', '$10$'], jawaban: 0, pembahasan: String.raw`Jalur konsep: $n(A \cup B) = 8 + 7 - 3 = 12$. Jalur Cara Gemilang: gabungan = jumlah dikurang kembar (dobel dihitung sekali).` },
      { soal: String.raw`Himpunan $\{x \mid x^{2} \leq 9,\ x \in \text{bilangan bulat}\}$ sama dengan ...`, opsi: [String.raw`$\{-3, -2, -1, 0, 1, 2, 3\}$`, String.raw`$\{0, 1, 2, 3\}$`, String.raw`$\{1, 2, 3\}$`, String.raw`$\{-3, 3\}$`, String.raw`$\{-2, -1, 0, 1, 2\}$`], jawaban: 0, pembahasan: String.raw`Jalur konsep: $x^{2} \leq 9 \Rightarrow -3 \leq x \leq 3$; bilangan bulat di antaranya ada $7$. Jalur Cara Gemilang: kuadrat menghapus tanda — jangan lupa anggota negatif.` },
    ],
  },

  // ===== SUBBAB C: EKSPONEN & BENTUK AKAR =====
  { jenis: 'judul', teks: 'Eksponen & Bentuk Akar' },
  { jenis: 'kilat', teks: String.raw`Eksponen adalah perkalian berulang: $a^{n} = a \times a \times \ldots \times a$ sebanyak $n$. Semua sifatnya turunan dari satu ide: basis sama dikali = pangkat ditambah. Bentuk akar adalah pangkat pecahan: $\sqrt[n]{a^{m}} = a^{m/n}$.` },
  {
    jenis: 'tabelinfo', judul: 'Sifat pangkat wajib hafal',
    kolom: ['Nama', 'Rumus', 'Contoh'],
    rows: [
      { k: 'Kali basis sama', v: String.raw`$a^{m} \times a^{n} = a^{m + n}$`, w: String.raw`$2^{3} \times 2^{4} = 2^{7}$` },
      { k: 'Bagi basis sama', v: String.raw`$\frac{a^{m}}{a^{n}} = a^{m - n}$`, w: String.raw`$\frac{3^{5}}{3^{2}} = 3^{3}$` },
      { k: 'Pangkat dipangkatkan', v: String.raw`$(a^{m})^{n} = a^{m \cdot n}$`, w: String.raw`$(5^{2})^{3} = 5^{6}$` },
      { k: 'Pangkat negatif', v: String.raw`$a^{-n} = \frac{1}{a^{n}}$`, w: String.raw`$2^{-3} = \frac{1}{8}$` },
      { k: 'Pangkat pecahan', v: String.raw`$a^{m/n} = \sqrt[n]{a^{m}}$`, w: String.raw`$8^{2/3} = \sqrt[3]{8^{2}} = 4$` },
      { k: String.raw`Pangkat nol`, v: String.raw`$a^{0} = 1$ untuk $a \neq 0$`, w: String.raw`$7^{0} = 1$` },
    ],
  },
  {
    jenis: 'flashcard', judul: '🃏 Flashcard: akar ⇄ pangkat pecahan',
    items: [
      { depan: String.raw`$\sqrt{x}$`, belakang: String.raw`$x^{1/2}$` },
      { depan: String.raw`$\sqrt[3]{x^{2}}$`, belakang: String.raw`$x^{2/3}$` },
      { depan: String.raw`$\frac{1}{\sqrt{x}}$`, belakang: String.raw`$x^{-1/2}$` },
      { depan: String.raw`$\sqrt[4]{x^{3}}$`, belakang: String.raw`$x^{3/4}$` },
    ],
  },
  {
    jenis: 'poin', judul: 'Merasionalkan penyebut (3 pola)', items: [
      String.raw`Bentuk $\frac{c}{\sqrt{a}}$: kali $\frac{\sqrt{a}}{\sqrt{a}}$ menjadi $\frac{c\sqrt{a}}{a}$.`,
      String.raw`Bentuk $\frac{c}{a + \sqrt{b}}$: kali sekawan $\frac{a - \sqrt{b}}{a - \sqrt{b}}$; penyebut jadi $a^{2} - b$.`,
      String.raw`Bentuk $\frac{c}{\sqrt{a} + \sqrt{b}}$: kali $\frac{\sqrt{a} - \sqrt{b}}{\sqrt{a} - \sqrt{b}}$; penyebut jadi $a - b$.`,
    ],
  },
  { jenis: 'callout', tipe: 'peringatan', judul: 'Jebakan bentuk akar', teks: String.raw`Akar TIDAK distributif pada tambah-kurang: $\sqrt{a + b} \neq \sqrt{a} + \sqrt{b}$ (contoh: $\sqrt{9 + 16} = \sqrt{25} = 5$, bukan $3 + 4 = 7$). Untuk perkalian boleh dipecah: $\sqrt{ab} = \sqrt{a} \cdot \sqrt{b}$. Akar bersarang pakai pola $\sqrt{(b + c) + 2\sqrt{bc}} = \sqrt{b} + \sqrt{c}$ — cari dua bilangan berjumlah $b + c$ dan berkalikan $bc$.` },
  {
    jenis: 'caraGemilang', judul: '👑 CG-EKSPONEN: samakan basis',
    teks: String.raw`Persamaan pangkat? Paksa kedua ruas berbasis sama, lalu SAMAKAN PANGKATNYA. Pertidaksamaan: basis $> 1$ tanda tetap; basis di antara $0$ dan $1$ tanda DIBALIK.`,
    items: [
      String.raw`Hafal pangkat kecil: $27 = 3^{3}$, $16 = 2^{4}$, $125 = 5^{3}$, $81 = 3^{4}$, $243 = 3^{5}$.`,
      String.raw`Kuadrat tersamar $a^{2x} + b \cdot a^{x} + c = 0$: misal $p = a^{x}$ lalu faktorkan.`,
      String.raw`Rantai nilai ($2^{x} = 5$, $5^{y} = 4$, dst): runtuhkan menara dari dalam, $((2^{x})^{y})^{z}$.`,
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: String.raw`Nilai dari $\frac{2^{5} \times 3^{4}}{2^{3} \times 3^{2}}$ adalah ...`, opsi: ['$24$', '$36$', '$48$', '$72$', '$108$'], jawaban: 1, pembahasan: String.raw`Jalur konsep: $2^{5 - 3} \times 3^{4 - 2} = 2^{2} \times 3^{2} = 4 \times 9 = 36$. Jalur Cara Gemilang: kurangi pangkat per basis, jangan hitung bilangan besarnya.` },
      { soal: String.raw`Bentuk rasional dari $\frac{6}{\sqrt{3}}$ adalah ...`, opsi: [String.raw`$2\sqrt{3}$`, String.raw`$3\sqrt{2}$`, String.raw`$2\sqrt{2}$`, String.raw`$6\sqrt{3}$`, String.raw`$3\sqrt{3}$`], jawaban: 0, pembahasan: String.raw`Jalur konsep: $\frac{6}{\sqrt{3}} \times \frac{\sqrt{3}}{\sqrt{3}} = \frac{6\sqrt{3}}{3} = 2\sqrt{3}$. Jalur Cara Gemilang: pola pertama rasionalkan — bagi koefisien dengan isi akar.` },
      { soal: String.raw`Jika $3^{x} = 243$ dan $2^{y} = 32$, maka nilai $x + y$ adalah ...`, opsi: ['$8$', '$9$', '$10$', '$11$', '$12$'], jawaban: 2, pembahasan: String.raw`Jalur konsep: $243 = 3^{5} \Rightarrow x = 5$; $32 = 2^{5} \Rightarrow y = 5$; jadi $x + y = 10$. Jalur Cara Gemilang: hafalan pangkat kecil $3^{5}$ dan $2^{5}$ langsung menutup soal.` },
    ],
  },

  // ===== SUBBAB D: OPERASI BARU, PERTUMBUHAN & PENALARAN =====
  { jenis: 'judul', teks: 'Operasi Baru, Pertumbuhan & Penalaran' },
  { jenis: 'kilat', teks: String.raw`Dua pola favorit TKA: (1) operasi DEFINISI BARU dengan simbol aneh ($\oplus$, $\Delta$, $\nabla$, $\circ$) — kuncinya selalu patuhi definisi; (2) pertumbuhan bakteri/populasi $M_{n} = M_{0} \cdot 2^{n}$ — eksponen yang menyamar jadi cerita.` },
  {
    jenis: 'alur', judul: 'Langkah menaklukkan soal operasi baru',
    items: [
      String.raw`Tulis ulang definisi memakai slot variabel: $a \circ b = \ldots$`,
      'Tandai nilai yang dipasang ke tiap slot dari soal (hati-hati posisi di dalam kurung/tabel).',
      'Substitusi mentah-mentah dulu, jangan disederhanakan di kepala.',
      'Hitung dengan Kabataku; cek syarat khusus (penyebut bukan nol, tanda pertidaksamaan).',
    ],
  },
  {
    jenis: 'poin', judul: 'Model pertumbuhan & ambang waktu', items: [
      String.raw`Membelah dua tiap periode: $M_{n} = M_{0} \cdot 2^{n}$ dengan $n = \frac{t}{T}$ (banyak periode = waktu dibagi durasi belah).`,
      String.raw`Ambang tercapai: ubah cerita jadi pertidaksamaan $M_{0} \cdot 2^{n} \geq K$, samakan basis, baca pangkatnya.`,
      String.raw`Waktu total = periode $\times$ durasi: $t = n \times T$; konversikan menit-jam SEBELUM masuk rumus, lalu tambahkan ke jam mulai.`,
    ],
  },
  {
    jenis: 'caraGemilang', judul: '👑 CG-OPERASI: definisi adalah raja',
    teks: String.raw`Simbol aneh ($\oplus$, $\Delta$, $\nabla$, $\circ$) bukan rumus hafalan — itu ATURAN MAIN yang diberikan soal. Substitusi dengan disiplin posisi; jawaban salah hampir selalu karena salah pasang variabel, bukan salah hitung.`,
    items: [
      String.raw`Tandai slotnya: mana $a$, mana $b$, mana angka bebas di luar kurung.`,
      String.raw`Operasi bertingkat seperti $(p \oplus q) \oplus r$: selesaikan kurung dalam dulu.`,
      String.raw`Penalaran skor/keputusan: terjemahkan aturan jadi rumus (misal $4b - s \geq 325$), uji tiap opsi satu per satu.`,
    ],
  },
  {
    jenis: 'zona', items: [
      { soal: String.raw`Operasi $\otimes$ didefinisikan sebagai $a \otimes b = a^{2} - 2b$. Nilai $3 \otimes 4$ adalah ...`, opsi: ['$1$', '$5$', '$17$', '$25$', '$-1$'], jawaban: 0, pembahasan: String.raw`Jalur konsep: $3 \otimes 4 = 3^{2} - 2(4) = 9 - 8 = 1$. Jalur Cara Gemilang: pasang $a = 3$ ke slot kuadrat, $b = 4$ ke slot pengurang.` },
      { soal: String.raw`Bakteri membelah dua setiap $15$ menit. Dari $20$ bakteri awal, jumlah bakteri setelah $2$ jam adalah ...`, opsi: [String.raw`$20 \cdot 2^{8}$`, String.raw`$20 \cdot 2^{6}$`, String.raw`$40 \cdot 2^{8}$`, String.raw`$20 \cdot 2^{9}$`, String.raw`$10 \cdot 2^{8}$`], jawaban: 0, pembahasan: String.raw`Jalur konsep: $2$ jam $= 120$ menit, $n = \frac{120}{15} = 8$ periode, jadi $M_{8} = 20 \cdot 2^{8} = 5.120$. Jalur Cara Gemilang: konversi waktu dulu, baru masukkan $n = t/T$.` },
      { soal: String.raw`Operasi $*$ didefinisikan $a * b = \frac{a + b}{ab}$. Nilai $2 * 3$ adalah ...`, opsi: [String.raw`$\frac{5}{6}$`, String.raw`$\frac{6}{5}$`, String.raw`$\frac{1}{6}$`, String.raw`$\frac{2}{3}$`, String.raw`$1$`], jawaban: 0, pembahasan: String.raw`Jalur konsep: $2 * 3 = \frac{2 + 3}{2 \cdot 3} = \frac{5}{6}$. Jalur Cara Gemilang: pembilang jumlah, penyebut kali — jangan tertukar.` },
    ],
  },
  { jenis: 'callout', tipe: 'info', judul: 'Bab 1 tuntas', teks: 'Empat keluarga soal bab ini: hitung campuran bilangan, himpunan & Venn, pangkat-akar, serta operasi baru-pertumbuhan. Saat latihan, labeli tiap nomor dengan keluarganya — pola CG-mu terbentuk dalam dua putaran.' },
];

export const META = {
  babJudul: 'Bab 1 — Bilangan, Himpunan, dan Eksponen (Edisi Cara Gemilang)',
  babRingkasan: String.raw`Operasi & konversi bilangan (pecahan-persen-desimal, urutan operasi, pola angka satuan), himpunan (notasi pembentuk, irisan-gabungan-selisih-komplemen-subset, diagram Venn), eksponen & bentuk akar (sifat pangkat, persamaan dan pertidaksamaan eksponen, merasionalkan penyebut, akar bersarang), serta operasi definisi baru dan model pertumbuhan — semua rumus ditulis LaTeX natural; 25 soal resmi bank (17 pg, 4 pgMulti, 4 tabel Benar/Salah) + pembahasan dua jalur.`,
  urutan: 1,
};

export const MATERI = {
  judul: 'Matematika — Persiapan TKA 2026 (Edisi Cara Gemilang)',
  mapel: 'Matematika', kelas: '', jenjang: 'sma',
  warna: '#F59E0B', emoji: '📐', urutan: 8,
  deskripsi: String.raw`Seri Matematika TKA: bilangan-himpunan-eksponen, sistem persamaan, bangun datar-pythagoras-kesebangunan, barisan-deret, statistika-peluang, bangun ruang, dan relasi-fungsi-transformasi-trigonometri. Semua rumus dirender natural (KaTeX) seperti buku. Impor bab tambahan pakai mode "tambah".`,
};
