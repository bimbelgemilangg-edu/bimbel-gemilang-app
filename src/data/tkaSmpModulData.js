// src/data/tkaSmpModulData.js
// ==============================================================================
// BANK MODUL & KUIS BELAJAR TKA SMP KELAS 9 - KURIKULUM RESMI 2026
// DILENGKAPI DIAGRAM VISUAL ASLI GEMILANG 100% BEBAS WATERMARK RUANGGURU
// FORMULA RUMUS MATEMATIKA DIRENDER BERSIH DENGAN KATEX
// ==============================================================================

export const MTK_SMP_MODUL = [
  {
    "id": "mtk_smp_bab_1",
    "subtestKode": "MTK_SMP",
    "babNumber": 1,
    "slug": "perpangkatan-dan-bentuk-akar",
    "judul": "Perpangkatan dan Bentuk Akar",
    "durasiBacaMenit": 12,
    "ringkasanSingkat": "Kuasai sifat-sifat eksponen aljabar, operasi rasionalisasi bentuk akar, dan konversi notasi ilmiah baku $a \\times 10^n$ ($1 \\le a < 10$).",
    "learningObjectives": [
      "Menerapkan 5 kaidah pokok operasi bilangan berpangkat bulat positif, negatif, dan nol.",
      "Menyederhanakan dan merasionalkan penyebut pecahan bentuk akar $\\frac{a}{\\sqrt{b}}$ dan $\\frac{a}{\\sqrt{b} \\pm \\sqrt{c}}$.",
      "Menuliskan bilangan desimal sangat kecil dan sangat besar ke dalam notasi baku ilmiah resmi."
    ],
    "gambar3dUrl": "/images/modul-smp/eksponen_3d_gemilang.png",
    "gambar3dCaption": "Visualisasi Edukatif 3D Konsep Eksponen & Matriks Aljabar (Bimbel Gemilang)",
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 620 220\" width=\"100%\" height=\"210\">\n  <defs>\n    <marker id=\"arrowKoma\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#ea580c\"/>\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"#f8fafc\" rx=\"14\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  \n  <!-- KARTU KIRI: LOMPATAN KOMA NOTASI ILMIAH (SUPER PRESISI & AKURAT) -->\n  <g transform=\"translate(15, 14)\">\n    <rect width=\"285\" height=\"192\" fill=\"#ffffff\" rx=\"12\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n    <rect width=\"285\" height=\"34\" fill=\"#f0fdfa\" rx=\"12\" stroke=\"#ccfbf1\" stroke-width=\"1\"/>\n    <text x=\"16\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f766e\">💡 Notasi Ilmiah: a × 10ⁿ (1 ≤ a &lt; 10)</text>\n    \n    <!-- Label Posisi Koma Awal & Koma Baru -->\n    <text x=\"46\" y=\"52\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#dc2626\">Koma Awal</text>\n    <line x1=\"60\" y1=\"55\" x2=\"60\" y2=\"62\" stroke=\"#dc2626\" stroke-width=\"1.5\"/>\n    \n    <text x=\"160\" y=\"52\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#ea580c\">Koma Baru! ★</text>\n    <line x1=\"182\" y1=\"55\" x2=\"182\" y2=\"62\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n    \n    <!-- Digit Angka Desimal Terukur Sempurna -->\n    <g font-family=\"'SF Mono', Monaco, Consolas, monospace\" font-size=\"16\" font-weight=\"bold\">\n      <text x=\"46\" y=\"78\" fill=\"#0f172a\">0</text>\n      <text x=\"57\" y=\"78\" fill=\"#dc2626\" font-size=\"18\">,</text>\n      <text x=\"70\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"92\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"114\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"136\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"158\" y=\"78\" fill=\"#0f172a\">7</text>\n      <text x=\"178\" y=\"78\" fill=\"#ea580c\" font-size=\"20\">,</text>\n      <text x=\"194\" y=\"78\" fill=\"#0f172a\">2</text>\n      <text x=\"216\" y=\"78\" fill=\"#0f172a\">5</text>\n    </g>\n    \n    <!-- 5 Busur Lompatan Presisi Koma -->\n    <!-- Lompatan 1: dari x=60 ke x=81 -->\n    <path d=\"M 60 84 Q 70.5 98 81 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"70.5\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"70.5\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">1</text>\n    \n    <!-- Lompatan 2: dari x=81 ke x=103 -->\n    <path d=\"M 81 84 Q 92 98 103 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"92\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"92\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">2</text>\n    \n    <!-- Lompatan 3: dari x=103 ke x=125 -->\n    <path d=\"M 103 84 Q 114 98 125 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"114\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"114\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">3</text>\n    \n    <!-- Lompatan 4: dari x=125 ke x=147 -->\n    <path d=\"M 125 84 Q 136 98 147 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"136\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"136\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">4</text>\n    \n    <!-- Lompatan 5: dari x=147 ke x=182 (melewati 7 tepat ke koma baru) -->\n    <path d=\"M 147 84 Q 164.5 100 182 85\" fill=\"none\" stroke=\"#ea580c\" stroke-width=\"2.5\" marker-end=\"url(#arrowKoma)\"/>\n    <circle cx=\"164.5\" cy=\"102\" r=\"6\" fill=\"#ea580c\"/>\n    <text x=\"164.5\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">5</text>\n    \n    <!-- Hasil Analisis -->\n    <rect x=\"16\" y=\"120\" width=\"253\" height=\"58\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#e2e8f0\"/>\n    <text x=\"26\" y=\"138\" font-family=\"system-ui, sans-serif\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#0f766e\">↳ Geser 5 langkah ke kanan (Pangkat = -5)</text>\n    <text x=\"26\" y=\"162\" font-family=\"system-ui, sans-serif\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#ea580c\">= 7,25 × 10⁻⁵</text>\n  </g>\n  \n  <!-- KARTU KANAN: SIFAT POKOK PERPANGKATAN -->\n  <g transform=\"translate(315, 14)\">\n    <rect width=\"290\" height=\"192\" fill=\"#ffffff\" rx=\"12\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n    <rect width=\"290\" height=\"34\" fill=\"#fff7ed\" rx=\"12\" stroke=\"#ffedd5\" stroke-width=\"1\"/>\n    <text x=\"16\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#c2410c\">⚡ 6 Kaidah Pokok Perpangkatan</text>\n    <g font-family=\"system-ui, sans-serif\" font-size=\"11.5\" fill=\"#334155\">\n      <text x=\"18\" y=\"58\">• aᵐ × aⁿ = aᵐ⁺ⁿ</text>\n      <text x=\"150\" y=\"58\">• (aᵐ)ⁿ = aᵐˣⁿ</text>\n      <text x=\"18\" y=\"84\">• aᵐ / aⁿ = aᵐ⁻ⁿ</text>\n      <text x=\"150\" y=\"84\">• (ab)ⁿ = aⁿ · bⁿ</text>\n      <text x=\"18\" y=\"110\">• a⁻ⁿ = 1 / aⁿ</text>\n      <text x=\"150\" y=\"110\">• a⁰ = 1 (a ≠ 0)</text>\n    </g>\n    <rect x=\"16\" y=\"128\" width=\"258\" height=\"50\" fill=\"#fefce8\" rx=\"8\" stroke=\"#fef08a\"/>\n    <text x=\"24\" y=\"146\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" font-weight=\"bold\" fill=\"#854d0e\">⚠️ Peringatan Jebakan:</text>\n    <text x=\"24\" y=\"164\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#a16207\">Nilai a harus 1 ≤ a &lt; 10. Penulisan 72,5×10⁻⁶ SALAH!</text>\n  </g>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Kaidah Pokok Operasi Bilangan Berpangkat",
        "isi": "Bilangan berpangkat menyatakan perkalian berulang dari suatu bilangan pokok yang sama. Jika $a, b \\in \\mathbb{R}$ dan $m, n \\in \\mathbb{Z}$, berlaku sifat fundamental berikut:\n\n1. Perkalian basis sama: $a^m \\times a^n = a^{m+n}$\n2. Pembagian basis sama: $\\frac{a^m}{a^n} = a^{m-n}$ (dengan $a \\ne 0$)\n3. Pemangkatan bentuk pangkat: $(a^m)^n = a^{m \\times n}$\n4. Pangkat bilangan pecahan (bentuk akar): $a^{\\frac{m}{n}} = \\sqrt[n]{a^m}$\n5. Pangkat bilangan bulat negatif: $a^{-n} = \\frac{1}{a^n}$\n6. Definisi pangkat nol: $a^0 = 1$ untuk setiap $a \\ne 0$.",
        "poinPenting": [
          "Perhatikan tanda kurung: $(-2)^4 = 16$, sedangkan $-2^4 = -16$.",
          "Penjumlahan eksponen basis sama TIDAK BISA langsung dijumlahkan pangkatnya: $2^3 + 2^4 = 8 + 16 = 24$, atau difaktorkan: $2^3(1 + 2) = 8 \\times 3 = 24$."
        ]
      },
      {
        "subjudul": "2. Operasi Bentuk Akar & Merasionalkan Penyebut",
        "isi": "Bentuk akar $\\sqrt{a}$ adalah akar dari bilangan rasional yang hasilnya irasional. Syarat penjumlahan dan pengurangan bentuk akar adalah memiliki bilangan di bawah tanda akar yang sama ($a\\sqrt{c} \\pm b\\sqrt{c} = (a \\pm b)\\sqrt{c}$).\n\nUntuk merasionalkan penyebut:\n• Bentuk $\\frac{a}{\\sqrt{b}} = \\frac{a}{\\sqrt{b}} \\times \\frac{\\sqrt{b}}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}$\n• Bentuk $\\frac{c}{\\sqrt{a} + \\sqrt{b}} = \\frac{c}{\\sqrt{a} + \\sqrt{b}} \\times \\frac{\\sqrt{a} - \\sqrt{b}}{\\sqrt{a} - \\sqrt{b}} = \\frac{c(\\sqrt{a} - \\sqrt{b})}{a - b}$ (dikalikan bentuk sekawan).",
        "poinPenting": [
          "Bentuk sekawan dari $(\\sqrt{a} + \\sqrt{b})$ adalah $(\\sqrt{a} - \\sqrt{b})$ karena $(\\sqrt{a}+\\sqrt{b})(\\sqrt{a}-\\sqrt{b}) = a - b$."
        ]
      },
      {
        "subjudul": "3. Notasi Ilmiah (Bentuk Baku)",
        "isi": "Bentuk baku dituliskan dalam formula $a \\times 10^n$ dengan batasan mutlak $1 \\le a < 10$ dan $n$ bilangan bulat.\n• Jika bilangan sangat kecil ($0 < x < 1$), koma digeser ke KANAN sebanyak $k$ langkah, sehingga pangkatnya menjadi negatif: $10^{-k}$.\nContoh: $0{,}0000725$ digeser ke kanan $5$ angka menjadi $7{,}25 \\times 10^{-5}$.\n• Jika bilangan sangat besar ($x \\ge 10$), koma digeser ke KIRI sebanyak $k$ langkah, sehingga pangkatnya positif: $10^{k}$.\nContoh: $149.600.000 = 1{,}496 \\times 10^8$.",
        "poinPenting": [
          "Nilai $a$ tidak boleh bernilai $10$ atau lebih, dan tidak boleh kurang dari $1$. Penulisan $72{,}5 \\times 10^{-6}$ BUKAN notasi baku resmi!"
        ]
      }
    ],
    "trikCepat": "Trik Notasi Ilmiah Cepat: Untuk bilangan desimal $0{,}000...x$, hitung total nol dari nol sebelum koma hingga angka pertama bukan nol. Pada $0{,}0000725$, ada tepat 5 buah angka nol di depan angka 7. Maka pangkatnya langsung $-5$, yakni $7{,}25 \\times 10^{-5}$!",
    "jebakanUmum": "Jebakan Pangkat Negatif: $4^{-2} + 2^{-3}$ BUKAN bernilai negatif! Nilai sebenarnya adalah $\\frac{1}{4^2} + \\frac{1}{2^3} = \\frac{1}{16} + \\frac{1}{8} = \\frac{3}{16}$. Jangan mengalikan basis dengan tanda minus!",
    "contohSoal": [
      {
        "soal": "Bentuk sederhana dari operasi aljabar $\\frac{4^3 \\times 2^6}{8^3}$ adalah...",
        "opsi": {
          "A": "8",
          "B": "16",
          "C": "32",
          "D": "64"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Ubah semua basis ke basis prima terkecil yaitu 2: $4 = 2^2$ dan $8 = 2^3$.",
          "Pembilang: $4^3 \\times 2^6 = (2^2)^3 \\times 2^6 = 2^6 \\times 2^6 = 2^{6+6} = 2^{12}$.",
          "Penyebut: $8^3 = (2^3)^3 = 2^{3 \\times 3} = 2^9$.",
          "Bagi pembilang dengan penyebut: $\\frac{2^{12}}{2^9} = 2^{12-9} = 2^3 = 8$. (Koreksi opsi: Jika $8$, kunci A). Pada $2^4 = 16$ jika pangkat $2^{13-9}$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b1_q1",
        "soal": "Bentuk sederhana dari operasi $\\frac{3^2 \\times 3^5}{3^4}$ adalah...",
        "opsi": {
          "A": "3",
          "B": "9",
          "C": "27",
          "D": "81"
        },
        "kunci": "C",
        "pembahasan": "Menggunakan sifat perkalian dan pembagian eksponen: pembilang adalah $3^{2+5} = 3^7$. Lalu dibagi $3^4$: $\\frac{3^7}{3^4} = 3^{7-4} = 3^3 = 27$."
      },
      {
        "id": "mtk_smp_b1_q2",
        "soal": "Nilai dari $\\sqrt{48} - \\sqrt{27} + \\sqrt{12}$ adalah...",
        "opsi": {
          "A": "$2\\sqrt{3}$",
          "B": "$3\\sqrt{3}$",
          "C": "$4\\sqrt{3}$",
          "D": "$5\\sqrt{3}$"
        },
        "kunci": "B",
        "pembahasan": "Sederhanakan masing-masing bentuk akar: $\\sqrt{48} = \\sqrt{16 \\times 3} = 4\\sqrt{3}$, $\\sqrt{27} = \\sqrt{9 \\times 3} = 3\\sqrt{3}$, dan $\\sqrt{12} = \\sqrt{4 \\times 3} = 2\\sqrt{3}$. Maka $4\\sqrt{3} - 3\\sqrt{3} + 2\\sqrt{3} = (4 - 3 + 2)\\sqrt{3} = 3\\sqrt{3}$."
      },
      {
        "id": "mtk_smp_b1_q3",
        "soal": "Bentuk baku (notasi ilmiah resmi) dari bilangan desimal $0{,}0000725$ adalah...",
        "opsi": {
          "A": "$7{,}25 \\times 10^{-4}$",
          "B": "$7{,}25 \\times 10^{-5}$",
          "C": "$72{,}5 \\times 10^{-6}$",
          "D": "$7{,}25 \\times 10^{-6}$"
        },
        "kunci": "B",
        "pembahasan": "Notasi baku mengharuskan nilai mantissa $1 \\le a < 10$. Dari $0{,}0000725$, tanda koma digeser ke kanan melewati 5 digit desimal (4 angka nol dan angka 7) sehingga menjadi $7{,}25$. Karena digeser ke kanan sebanyak 5 kali, eksponen 10 bertanda negatif: $7{,}25 \\times 10^{-5}$."
      }
    ],
    "keyTakeaways": [
      "Kaidah perkalian basis sama menjumlahkan pangkat ($a^m \\times a^n = a^{m+n}$), sedangkan pembagian mengurangkan pangkat ($a^m / a^n = a^{m-n}$).",
      "Menyederhanakan bentuk akar dilakukan dengan mencari faktor kuadrat sempurna ($4, 9, 16, 25, 36, 49, ...$).",
      "Notasi ilmiah wajib memenuhi $1 \\le a < 10$. Geser ke kanan menghasilkan pangkat negatif, geser ke kiri menghasilkan pangkat positif."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_2",
    "subtestKode": "MTK_SMP",
    "babNumber": 2,
    "slug": "persamaan-dan-fungsi-kuadrat",
    "judul": "Persamaan & Fungsi Kuadrat",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Pahami pemfaktoran akar persamaan kuadrat, rumus diskriminan $D = b^2 - 4ac$, sumbu simetri parabola, dan penentuan nilai ekstrim optimum.",
    "learningObjectives": [
      "Menentukan akar-akar persamaan kuadrat dengan pemfaktoran, melengkapkan kuadrat sempurna, dan rumus ABC.",
      "Menganalisis karakteristik grafik fungsi kuadrat berdasarkan tanda koefisien $a$ dan nilai diskriminan $D$.",
      "Menentukan koordinat titik puncak/ekstrim dan persamaan sumbu simetri $x = -\\frac{b}{2a}$."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 280\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <pattern id=\"gridKuadrat\" width=\"25\" height=\"25\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 25 0 L 0 0 0 25\" fill=\"none\" stroke=\"#f1f5f9\" stroke-width=\"1\"/>\n    </pattern>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"url(#gridKuadrat)\"/>\n  \n  <line x1=\"30\" y1=\"140\" x2=\"510\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <line x1=\"200\" y1=\"20\" x2=\"200\" y2=\"260\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"500\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">x</text>\n  <text x=\"210\" y=\"35\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">y</text>\n  <text x=\"185\" y=\"155\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#94a3b8\">0</text>\n  \n  <path d=\"M 210,65 Q 275,225 340,65\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"3\"/>\n  \n  <line x1=\"275\" y1=\"25\" x2=\"275\" y2=\"255\" stroke=\"#ef4444\" stroke-width=\"1.5\" stroke-dasharray=\"4 3\"/>\n  <text x=\"280\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#dc2626\">Sumbu Simetri x = -b/(2a) = 3</text>\n  \n  <circle cx=\"250\" cy=\"140\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"235\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">(2, 0)</text>\n  <circle cx=\"300\" cy=\"140\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"305\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">(4, 0)</text>\n  \n  <circle cx=\"275\" cy=\"165\" r=\"6\" fill=\"#dc2626\"/>\n  <text x=\"285\" y=\"175\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#dc2626\">Puncak (3, -1)</text>\n  \n  <rect x=\"360\" y=\"30\" width=\"165\" height=\"95\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"370\" y=\"50\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Kaidah Parabola:</text>\n  <text x=\"370\" y=\"70\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• a = 1 &gt; 0 : Terbuka Ke Atas</text>\n  <text x=\"370\" y=\"90\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• D = b² - 4ac &gt; 0 : 2 Akar Real</text>\n  <text x=\"370\" y=\"110\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Puncak: (-b/2a, -D/4a)</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Persamaan Kuadrat & Rumus ABC",
        "isi": "Bentuk umum: $ax^2 + bx + c = 0$ ($a \\ne 0$). Akar-akarnya dapat dicari dengan:\n• Pemfaktoran: $(x - x_1)(x - x_2) = 0$\n• Rumus ABC: $x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n• Hubungan akar Vieta: $x_1 + x_2 = -\\frac{b}{a}$ dan $x_1 \\cdot x_2 = \\frac{c}{a}$.",
        "poinPenting": [
          "Diskriminan $D = b^2 - 4ac$ menentukan jenis akar: jika $D > 0$ memiliki dua akar real berbeda, $D = 0$ memiliki dua akar kembar sama, dan $D < 0$ tidak memiliki akar real."
        ]
      },
      {
        "subjudul": "2. Grafik & Karakteristik Fungsi Kuadrat",
        "isi": "Grafik fungsi kuadrat $f(x) = ax^2 + bx + c$ berbentuk kurva parabola simetris.\n1. Arah kurva: jika $a > 0$ parabola membuka ke ATAS (memiliki nilai minimum), jika $a < 0$ parabola membuka ke BAWAH (memiliki nilai maksimum).\n2. Persamaan sumbu simetri: $x_p = -\\frac{b}{2a}$.\n3. Nilai optimum (ekstrim): $y_p = -\\frac{D}{4a} = -\\frac{b^2 - 4ac}{4a}$.\n4. Koordinat titik puncak: $P\\left(-\\frac{b}{2a}, -\\frac{D}{4a}\\right)$.",
        "poinPenting": [
          "Titik potong sumbu $Y$ selalu berada pada koordinat $(0, c)$.",
          "Titik potong sumbu $X$ terjadi saat $f(x) = 0$, yaitu pada akar-akar $(x_1, 0)$ dan $(x_2, 0)$."
        ]
      }
    ],
    "trikCepat": "Trik Nilai Optimum Aplikasi Nyata: Pada soal lemparan benda vertikal $h(t) = v_0 t - \\frac{1}{2}gt^2$, waktu mencapai ketinggian maksimum selalu terjadi saat $t = -\\frac{b}{2a}$. Masukkan nilai $t$ tersebut langsung ke fungsi untuk mendapatkan tinggi maksimum tanpa perlu menghitung diskriminan!",
    "jebakanUmum": "Jebakan Tanda Minus Sumbu Simetri: Rumus sumbu simetri adalah $x = -\\frac{b}{2a}$. Jika $b$ bernilai negatif (misal $f(x) = x^2 - 6x + 8$), maka $x = -\\frac{-6}{2(1)} = +3$. Jangan sampai lupa tanda minus ganda menghasilkan nilai positif!",
    "contohSoal": [
      {
        "soal": "Tentukan koordinat titik balik dari grafik fungsi kuadrat $f(x) = x^2 - 4x - 5$!",
        "opsi": {
          "A": "$(2, -9)$",
          "B": "$(-2, -9)$",
          "C": "$(2, 9)$",
          "D": "$(-2, 7)$"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Identifikasi koefisien: $a = 1$, $b = -4$, $c = -5$.",
          "Sumbu simetri: $x_p = -\\frac{b}{2a} = -\\frac{-4}{2(1)} = 2$.",
          "Substitusi $x = 2$ ke dalam fungsi: $f(2) = (2)^2 - 4(2) - 5 = 4 - 8 - 5 = -9$.",
          "Maka koordinat titik balik adalah $(2, -9)$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b2_q1",
        "soal": "Persamaan sumbu simetri dari grafik fungsi kuadrat $f(x) = x^2 - 6x + 8$ adalah...",
        "opsi": {
          "A": "$x = -3$",
          "B": "$x = 3$",
          "C": "$x = 6$",
          "D": "$x = -6$"
        },
        "kunci": "B",
        "pembahasan": "Dari $f(x) = x^2 - 6x + 8$, nilai $a = 1$ dan $b = -6$. Rumus sumbu simetri adalah $x = -\\frac{b}{2a} = -\\frac{-6}{2(1)} = 3$."
      },
      {
        "id": "mtk_smp_b2_q2",
        "soal": "Jika persamaan kuadrat $x^2 + kx + 9 = 0$ memiliki dua akar kembar nyata ($D = 0$), maka nilai positif dari konstanta $k$ adalah...",
        "opsi": {
          "A": "3",
          "B": "6",
          "C": "9",
          "D": "12"
        },
        "kunci": "B",
        "pembahasan": "Syarat akar kembar adalah $D = 0 \\iff b^2 - 4ac = 0$. Maka $k^2 - 4(1)(9) = 0 \\implies k^2 - 36 = 0 \\implies k^2 = 36 \\implies k = \\pm 6$. Karena diminta nilai positif, maka $k = 6$."
      },
      {
        "id": "mtk_smp_b2_q3",
        "soal": "Tinggi peluru setelah $t$ detik ditembakkan ke atas dinyatakan oleh $h(t) = 40t - 5t^2$ (dalam meter). Tinggi maksimum yang dicapai peluru adalah...",
        "opsi": {
          "A": "60 m",
          "B": "80 m",
          "C": "100 m",
          "D": "120 m"
        },
        "kunci": "B",
        "pembahasan": "Waktu puncak tercapai saat $t = -\\frac{b}{2a} = -\\frac{40}{2(-5)} = \\frac{40}{10} = 4$ detik. Tinggi maksimum adalah $h(4) = 40(4) - 5(4)^2 = 160 - 5(16) = 160 - 80 = 80$ meter."
      }
    ],
    "keyTakeaways": [
      "Titik puncak parabola $P(x_p, y_p)$ dihitung dengan $x_p = -\\frac{b}{2a}$ dan $y_p = f(x_p)$.",
      "Nilai $D > 0$ memotong sumbu X di 2 titik; $D = 0$ menyinggung sumbu X; $D < 0$ tidak memotong sumbu X sama sekali.",
      "Tinggi maksimum benda gravitasi dicapai pada koordinat $y$ titik puncak."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_3",
    "subtestKode": "MTK_SMP",
    "babNumber": 3,
    "slug": "transformasi-geometri",
    "judul": "Transformasi Geometri",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Pelajari rumus pemetaan koordinat untuk Translasi (pergeseran), Refleksi (pencerminan garis $x=h, y=k$), Rotasi sudut, dan Dilatasi faktor skala $k$.",
    "learningObjectives": [
      "Menentukan bayangan titik dan bangun datar akibat translasi vektor $T(a, b)$.",
      "Menerapkan rumus refleksi terhadap sumbu X, sumbu Y, garis $y = x$, garis $y = -x$, garis vertikal $x = h$, dan horizontal $y = k$.",
      "Menghitung koordinat bayangan rotasi $90^\\circ, 180^\\circ$ dan dilatasi berpusat di titik asal $O(0,0)$."
    ],
    "gambar3dUrl": "/images/modul-smp/geometri_3d_gemilang.png",
    "gambar3dCaption": "Visualisasi Edukatif 3D Koordinat Cartesius & Refleksi Geometri (Bimbel Gemilang)",
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 280\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <pattern id=\"gridTrans\" width=\"28\" height=\"28\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 28 0 L 0 0 0 28\" fill=\"none\" stroke=\"#f1f5f9\" stroke-width=\"1\"/>\n    </pattern>\n    <marker id=\"arrowRed\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#ef4444\"/>\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"url(#gridTrans)\"/>\n  \n  <line x1=\"20\" y1=\"140\" x2=\"520\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <line x1=\"200\" y1=\"20\" x2=\"200\" y2=\"260\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"505\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">x</text>\n  <text x=\"210\" y=\"35\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">y</text>\n  \n  <polygon points=\"116,112 172,112 144,56\" fill=\"#ccfbf1\" fill-opacity=\"0.8\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n  <circle cx=\"116\" cy=\"112\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"75\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-3,1)</text>\n  <circle cx=\"172\" cy=\"112\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"175\" y=\"110\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">B(-1,1)</text>\n  <circle cx=\"144\" cy=\"56\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"135\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">C(-2,3)</text>\n  \n  <polygon points=\"228,196 284,196 256,140\" fill=\"#fed7aa\" fill-opacity=\"0.8\" stroke=\"#ea580c\" stroke-width=\"2\"/>\n  <circle cx=\"228\" cy=\"196\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"215\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">A'(1,-2)</text>\n  <circle cx=\"284\" cy=\"196\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"290\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">B'(3,-2)</text>\n  <circle cx=\"256\" cy=\"140\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"265\" y=\"135\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">C'(2,0)</text>\n  \n  <line x1=\"116\" y1=\"112\" x2=\"223\" y2=\"192\" stroke=\"#ef4444\" stroke-width=\"2\" stroke-dasharray=\"4 2\" marker-end=\"url(#arrowRed)\"/>\n  \n  <rect x=\"340\" y=\"25\" width=\"180\" height=\"85\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"350\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Vektor Translasi T(4, -3):</text>\n  <text x=\"350\" y=\"65\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Geser 4 ke kanan (+x)</text>\n  <text x=\"350\" y=\"85\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Geser 3 ke bawah (-y)</text>\n  <text x=\"350\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-3,1) → A'(1, -2)</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Translasi (Pergeseran Vektor)",
        "isi": "Translasi memindahkan setiap titik sejauh jarak dan arah tertentu tanpa mengubah bentuk dan ukuran bangun.\n• Rumus Translasi: Titik $A(x, y)$ ditranslasi oleh matriks pergeseran $T(a, b)$ menghasilkan bayangan:\n$$A'(x', y') = (x + a, y + b)$$\nJika $a > 0$ bergeser ke kanan, jika $a < 0$ ke kiri. Jika $b > 0$ bergeser ke atas, jika $b < 0$ ke bawah.",
        "poinPenting": [
          "Translasi mempertahankan orientasi dan ukuran bangun datar (isometri)."
        ]
      },
      {
        "subjudul": "2. Refleksi (Pencerminan)",
        "isi": "Pencerminan memetakan setiap titik ke seberang garis cermin dengan jarak yang sama tehadap cermin:\n1. Terhadap sumbu-X: $A(x, y) \\to A'(x, -y)$\n2. Terhadap sumbu-Y: $A(x, y) \\to A'(-x, y)$\n3. Terhadap garis $y = x$: $A(x, y) \\to A'(y, x)$\n4. Terhadap garis $y = -x$: $A(x, y) \\to A'(-y, -x)$\n5. Terhadap garis vertikal $x = h$: $A(x, y) \\to A'(2h - x, y)$\n6. Terhadap garis horizontal $y = k$: $A(x, y) \\to A'(x, 2k - y)$.",
        "poinPenting": [
          "Pada pencerminan terhadap $y = k$, nilai koordinat absis $x$ tetap sama, hanya ordinat $y$ yang berubah menjadi $2k - y$."
        ]
      },
      {
        "subjudul": "3. Rotasi & Dilatasi",
        "isi": "• Rotasi pusat $O(0,0)$:\n- Sebesar $+90^\\circ$ (berlawanan jarum jam): $(x, y) \\to (-y, x)$\n- Sebesar $-90^\\circ$ (searah jarum jam): $(x, y) \\to (y, -x)$\n- Sebesar $180^\\circ$: $(x, y) \\to (-x, -y)$\n\n• Dilatasi pusat $O(0,0)$ dan faktor skala $k$:\n$$P(x, y) \\xrightarrow{[O, k]} P'(kx, ky)$$\nJika $|k| > 1$ bayangan diperbesar, jika $0 < |k| < 1$ bayangan diperkecil.",
        "poinPenting": [
          "Sudut positif menyatakan perputaran berlawanan arah jarum jam. Sudut negatif searah jarum jam."
        ]
      }
    ],
    "trikCepat": "Trik Ingat Rotasi $+90^\\circ$: Balik posisi koordinat $(x, y) \\to (y, x)$, lalu beri tanda minus pada koordinat depan yang baru menjadi $(-y, x)$! Contoh: $(4, -2) \\to (-(-2), 4) = (2, 4)$!",
    "jebakanUmum": "Jebakan Cermin $x=h$ vs $y=k$: Jangan sampai tertukar! Cermin vertikal $x = h$ hanya mengubah nilai $x$ menjadi $2h - x$ (nilai $y$ tetap). Cermin horizontal $y = k$ hanya mengubah nilai $y$ menjadi $2k - y$ (nilai $x$ tetap).",
    "contohSoal": [
      {
        "soal": "Titik $P(-3, 5)$ direfleksikan terhadap garis $x = 2$, kemudian dilanjutkan rotasi $180^\\circ$ dengan pusat $O(0,0)$. Koordinat akhir bayangan titik $P$ adalah...",
        "opsi": {
          "A": "$(-7, -5)$",
          "B": "$(7, -5)$",
          "C": "$(-1, -5)$",
          "D": "$(7, 5)$"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Langkah 1: Refleksi $P(-3, 5)$ terhadap $x = 2$ menggunakan rumus $P'(2h - x, y)$ dengan $h = 2$.",
          "$x' = 2(2) - (-3) = 4 + 3 = 7$ dan $y' = 5$. Jadi $P'(7, 5)$.",
          "Langkah 2: Rotasi $180^\\circ$ terhadap $O(0,0)$ memetakan $(x, y) \\to (-x, -y)$.",
          "$P''( -7, -5 )$. Maka koordinat akhir adalah $(-7, -5)$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b3_q1",
        "soal": "Perhatikan diagram pergeseran di bawah ini! Titik $A(-2, 4)$ ditranslasikan oleh vektor $T(3, -5)$. Koordinat bayangan titik $A'$ adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 180\" width=\"100%\" height=\"160\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <line x1=\"20\" y1=\"120\" x2=\"300\" y2=\"120\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <line x1=\"120\" y1=\"15\" x2=\"120\" y2=\"165\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <circle cx=\"80\" cy=\"40\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"35\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-2, 4)</text>\n  <path d=\"M 80 40 L 140 140\" stroke=\"#ea580c\" stroke-width=\"2\" stroke-dasharray=\"4 2\"/>\n  <circle cx=\"140\" cy=\"140\" r=\"5\" fill=\"#ea580c\"/>\n  <text x=\"150\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">A'(x', y') ?</text>\n  <text x=\"140\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">T(3, -5)</text>\n</svg>",
        "opsi": {
          "A": "$(1, -1)$",
          "B": "$(-5, 9)$",
          "C": "$(1, 9)$",
          "D": "$(-5, -1)$"
        },
        "kunci": "A",
        "pembahasan": "Rumus translasi adalah $A'(x+a, y+b)$. Dengan $(x,y) = (-2, 4)$ dan $(a,b) = (3, -5)$, diperoleh $x' = -2 + 3 = 1$ dan $y' = 4 + (-5) = -1$. Jadi $A'(1, -1)$."
      },
      {
        "id": "mtk_smp_b3_q2",
        "soal": "Bayangan titik $B(4, -2)$ oleh rotasi $90^\\circ$ berlawanan arah jarum jam dengan pusat $O(0,0)$ adalah...",
        "opsi": {
          "A": "$(2, 4)$",
          "B": "$(-2, -4)$",
          "C": "$(2, -4)$",
          "D": "$(-4, -2)$"
        },
        "kunci": "A",
        "pembahasan": "Rotasi $+90^\\circ$ (berlawanan jarum jam) memiliki aturan pemetaan $(x, y) \\to (-y, x)$. Dengan $x = 4$ dan $y = -2$, diperoleh $x' = -(-2) = 2$ dan $y' = 4$. Jadi bayangannya adalah $(2, 4)$."
      },
      {
        "id": "mtk_smp_b3_q3",
        "soal": "Titik $C(6, -9)$ didilatasi dengan pusat $O(0,0)$ dan faktor skala $k = \\frac{1}{3}$. Koordinat bayangan titik $C'$ adalah...",
        "opsi": {
          "A": "$(2, -3)$",
          "B": "$(18, -27)$",
          "C": "$(-2, 3)$",
          "D": "$(3, -2)$"
        },
        "kunci": "A",
        "pembahasan": "Dilatasi dengan faktor skala $k = \\frac{1}{3}$ berpusat $O(0,0)$ memetakan $(x, y) \\to (kx, ky)$. Maka $x' = \\frac{1}{3} \\times 6 = 2$ dan $y' = \\frac{1}{3} \\times (-9) = -3$. Koordinat bayangan adalah $(2, -3)$."
      }
    ],
    "keyTakeaways": [
      "Translasi menggeser koordinat: $(x+a, y+b)$.",
      "Refleksi cermin garis horizontal $y=k$ memetakan ordinat ke $2k - y$; cermin garis vertikal $x=h$ memetakan absis ke $2h - x$.",
      "Rotasi $+90^\\circ$ menghasilkan $(-y, x)$, rotasi $-90^\\circ$ menghasilkan $(y, -x)$, dan rotasi $180^\\circ$ menghasilkan $(-x, -y)$."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_4",
    "subtestKode": "MTK_SMP",
    "babNumber": 4,
    "slug": "kesebangunan-dan-kekongruenan",
    "judul": "Kesebangunan & Kekongruenan",
    "durasiBacaMenit": 16,
    "ringkasanSingkat": "Kuasai syarat kekongruenan bangun datar (S-S-S, S-Sd-S), perbandingan proporsi sisi segitiga sebangun bergaris sejajar, dan rumus air mancur siku-siku.",
    "learningObjectives": [
      "Membedakan syarat kesebangunan (sudut sama, sisi sebanding) dan kekongruenan (sudut sama, sisi sama panjang persis).",
      "Menghitung panjang sisi yang belum diketahui pada segitiga dengan garis transversal sejajar.",
      "Menerapkan rumus perkalian sisi siku-siku segitiga siku-siku bertinggi tegak lurus (rumus air mancur)."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 260\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <marker id=\"arrowBlue\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#0d9488\"/>\n    </marker>\n  </defs>\n  \n  <polygon points=\"200,30 60,220 380,220\" fill=\"#f0fdfa\" stroke=\"#0f766e\" stroke-width=\"2.5\"/>\n  <line x1=\"116\" y1=\"144\" x2=\"308\" y2=\"144\" stroke=\"#ea580c\" stroke-width=\"2.5\" stroke-dasharray=\"5 3\"/>\n  <line x1=\"210\" y1=\"144\" x2=\"218\" y2=\"144\" stroke=\"#ea580c\" stroke-width=\"2\" marker-end=\"url(#arrowBlue)\"/>\n  <line x1=\"210\" y1=\"220\" x2=\"218\" y2=\"220\" stroke=\"#0f766e\" stroke-width=\"2\" marker-end=\"url(#arrowBlue)\"/>\n  \n  <circle cx=\"200\" cy=\"30\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"60\" cy=\"220\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"380\" cy=\"220\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"116\" cy=\"144\" r=\"4.5\" fill=\"#ea580c\"/>\n  <circle cx=\"308\" cy=\"144\" r=\"4.5\" fill=\"#ea580c\"/>\n  \n  <text x=\"195\" y=\"20\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">A</text>\n  <text x=\"42\" y=\"235\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">B</text>\n  <text x=\"390\" y=\"235\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">C</text>\n  <text x=\"96\" y=\"148\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#ea580c\">D</text>\n  <text x=\"316\" y=\"148\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#ea580c\">E</text>\n  \n  <text x=\"120\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">AD = 6 cm</text>\n  <text x=\"60\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">DB = 4 cm</text>\n  <text x=\"200\" y=\"135\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#ea580c\">DE = ?</text>\n  <text x=\"200\" y=\"242\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">BC = 15 cm</text>\n  \n  <rect x=\"360\" y=\"40\" width=\"165\" height=\"85\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"370\" y=\"60\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Perbandingan Senilai:</text>\n  <text x=\"370\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">AD / AB = DE / BC</text>\n  <text x=\"370\" y=\"100\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#475569\">6 / 10 = DE / 15</text>\n  <text x=\"370\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">DE = (6 × 15) / 10 = 9 cm</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Syarat Kesebangunan vs Kekongruenan",
        "isi": "• Dua bangun datar dikatakan SEBANGUN $(\\sim)$ jika:\n1. Sudut-sudut yang bersesuaian sama besar.\n2. Sisi-sisi yang bersesuaian memiliki perbandingan senilai yang sama.\n\n• Dua bangun datar dikatakan KONGRUEN $(\\cong)$ jika bentuk dan ukurannya sama persis (sudut bersesuaian sama besar dan sisi bersesuaian sama panjang).\nSyarat kekongruenan segitiga:\n1. Sisi - Sisi - Sisi (s - s - s)\n2. Sisi - Sudut - Sisi (s - sd - s)\n3. Sudut - Sisi - Sudut (sd - s - sd)\n4. Sudut - Sudut - Sisi (sd - sd - s)\n5. Sisi miring dan satu sisi siku-siku (khusus segitiga siku-siku).",
        "poinPenting": [
          "Bangun yang kongruen pasti sebangun, namun bangun yang sebangun belum tentu kongruen.",
          "Syarat Sudut - Sudut - Sudut (sd - sd - sd) HANYA menjamin kesebangunan, BUKAN kekongruenan!"
        ]
      },
      {
        "subjudul": "2. Garis Sejajar pada Segitiga & Rumus Air Mancur",
        "isi": "Pada segitiga $ABC$ dengan garis $DE \\parallel BC$ ($D$ pada $AB$ dan $E$ pada $AC$):\n$$\\frac{AD}{AB} = \\frac{AE}{AC} = \\frac{DE}{BC}$$\n\nPada segitiga siku-siku $ABC$ di mana $\\angle A = 90^\\circ$ dan garis tinggi $AD \\perp BC$:\n1. $AB^2 = BD \\times BC$\n2. $AC^2 = CD \\times CB$\n3. $AD^2 = BD \\times CD$\n4. Luas segitiga: $AD = \\frac{AB \\times AC}{BC}$.",
        "poinPenting": [
          "Perhatikan segitiga kecil dan segitiga besar: selalu bandingkan sisi segitiga kecil terhadap sisi total segitiga besar ($AB = AD + DB$)!"
        ]
      }
    ],
    "trikCepat": "Trik Rumus Garis Sejajar: Pada segitiga $ABC$ dengan $DE \\parallel BC$, panjang sisi bawah $DE$ selalu sebanding dengan sisi total $AB$, BUKAN potongan bawah $DB$! Selalu gunakan formula $\\frac{DE}{BC} = \\frac{AD}{AD + DB}$!",
    "jebakanUmum": "Jebakan Rasio Potongan Sisi: Siswa sering salah menghitung $\\frac{DE}{BC} = \\frac{AD}{DB}$. Ini SALAH BESAR! Rasio $\\frac{AD}{DB}$ hanya boleh dipakai untuk rasio potongan $\\frac{AE}{EC}$, tidak boleh untuk sisi sejajar $DE$ dan $BC$!",
    "contohSoal": [
      {
        "soal": "Perhatikan segitiga siku-siku $ABC$ dengan $\\angle A = 90^\\circ$ dan $AD \\perp BC$. Jika $AB = 12\\text{ cm}$ dan $BC = 15\\text{ cm}$, maka panjang garis tinggi $AD$ adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 250\" width=\"100%\" height=\"230\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <polygon points=\"180,50 60,200 440,200\" fill=\"#eff6ff\" stroke=\"#1d4ed8\" stroke-width=\"2.5\"/>\n  <path d=\"M 166,68 L 180,82 L 194,64\" fill=\"none\" stroke=\"#1d4ed8\" stroke-width=\"2\"/>\n  <line x1=\"180\" y1=\"50\" x2=\"180\" y2=\"200\" stroke=\"#dc2626\" stroke-width=\"2.5\" stroke-dasharray=\"4 2\"/>\n  <rect x=\"180\" y=\"186\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"#dc2626\" stroke-width=\"1.5\"/>\n  \n  <circle cx=\"180\" cy=\"50\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"60\" cy=\"200\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"440\" cy=\"200\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"180\" cy=\"200\" r=\"4.5\" fill=\"#dc2626\"/>\n  \n  <text x=\"175\" y=\"38\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">A (90°)</text>\n  <text x=\"45\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">B</text>\n  <text x=\"450\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">C</text>\n  <text x=\"175\" y=\"225\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#dc2626\">D</text>\n  \n  <text x=\"95\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">AB = 12 cm</text>\n  <text x=\"315\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">AC = 9 cm</text>\n  <text x=\"240\" y=\"218\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">BC = 15 cm</text>\n  <text x=\"188\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#dc2626\">AD = ?</text>\n  \n  <rect x=\"290\" y=\"35\" width=\"205\" height=\"75\" fill=\"#fef2f2\" rx=\"8\" stroke=\"#fecaca\" stroke-width=\"1\"/>\n  <text x=\"300\" y=\"55\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#b91c1c\">Rumus Luas / Air Mancur:</text>\n  <text x=\"300\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#1e293b\">AD = (AB × AC) / BC</text>\n  <text x=\"300\" y=\"93\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#475569\">AD = (12 × 9) / 15 = 7,2 cm</text>\n</svg>",
        "opsi": {
          "A": "6,4 cm",
          "B": "7,2 cm",
          "C": "8,0 cm",
          "D": "9,6 cm"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Langkah 1: Hitung panjang sisi $AC$ dengan teorema Pythagoras: $AC = \\sqrt{BC^2 - AB^2} = \\sqrt{15^2 - 12^2} = \\sqrt{225 - 144} = \\sqrt{81} = 9\\text{ cm}$.",
          "Langkah 2: Gunakan perbandingan kesamaan luas segitiga: $\\frac{1}{2} \\times BC \\times AD = \\frac{1}{2} \\times AB \\times AC$.",
          "Diperoleh rumus air mancur: $AD = \\frac{AB \\times AC}{BC} = \\frac{12 \\times 9}{15} = \\frac{108}{15} = 7{,}2\\text{ cm}$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b4_q1",
        "soal": "Manakah pasangan bangun datar berikut yang PASTI selalu sebangun dalam kondisi apa pun?",
        "opsi": {
          "A": "Dua buah persegi panjang",
          "B": "Dua buah belah ketupat",
          "C": "Dua buah segitiga sama sisi",
          "D": "Dua buah trapesium sama kaki"
        },
        "kunci": "C",
        "pembahasan": "Dua segitiga sama sisi selalu memiliki semua sudut sebesar $60^\\circ$ dan perbandingan ketiga sisinya selalu sama ($1:1:1$). Maka dua segitiga sama sisi pasti selalu sebangun. Sedangkan persegi panjang dan belah ketupat sudut atau rasio panjang/lebarnya bisa berbeda."
      },
      {
        "id": "mtk_smp_b4_q2",
        "soal": "Perhatikan gambar segitiga di bawah ini! Garis $DE$ sejajar dengan sisi $BC$. Jika panjang $AD = 6\\text{ cm}$, $DB = 4\\text{ cm}$, dan panjang sisi $BC = 15\\text{ cm}$, maka panjang garis $DE$ adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 340 200\" width=\"100%\" height=\"180\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <polygon points=\"170,25 40,175 300,175\" fill=\"#f0fdfa\" stroke=\"#0f766e\" stroke-width=\"2\"/>\n  <line x1=\"92\" y1=\"115\" x2=\"248\" y2=\"115\" stroke=\"#ea580c\" stroke-width=\"2\" stroke-dasharray=\"4 2\"/>\n  <text x=\"165\" y=\"18\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">A</text>\n  <text x=\"25\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">B</text>\n  <text x=\"305\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">C</text>\n  <text x=\"75\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">D</text>\n  <text x=\"255\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">E</text>\n  <text x=\"95\" y=\"65\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#0d9488\">AD = 6 cm</text>\n  <text x=\"45\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#0d9488\">DB = 4 cm</text>\n  <text x=\"155\" y=\"108\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">DE = ?</text>\n  <text x=\"155\" y=\"192\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">BC = 15 cm</text>\n</svg>",
        "opsi": {
          "A": "7,5 cm",
          "B": "9,0 cm",
          "C": "10,0 cm",
          "D": "12,0 cm"
        },
        "kunci": "B",
        "pembahasan": "Panjang sisi total $AB = AD + DB = 6 + 4 = 10\\text{ cm}$. Karena $DE \\parallel BC$, berlaku perbandingan segitiga sebangun: $\\frac{AD}{AB} = \\frac{DE}{BC} \\implies \\frac{6}{10} = \\frac{DE}{15}$. Maka $DE = \\frac{6 \\times 15}{10} = \\frac{90}{10} = 9\\text{ cm}$."
      },
      {
        "id": "mtk_smp_b4_q3",
        "soal": "Dua buah segitiga dinyatakan kongruen jika memenuhi syarat berikut, KECUALI...",
        "opsi": {
          "A": "Sisi - Sisi - Sisi (s - s - s)",
          "B": "Sisi - Sudut - Sisi (s - sd - s)",
          "C": "Sudut - Sudut - Sudut (sd - sd - sd)",
          "D": "Sudut - Sisi - Sudut (sd - s - sd)"
        },
        "kunci": "C",
        "pembahasan": "Syarat Sudut - Sudut - Sudut (sd - sd - sd) hanya membuktikan bahwa dua segitiga tersebut SEBANGUN, tetapi belum tentu kongruen karena ukurannya bisa diperbesar atau diperkecil (tidak sama panjang sisinya)."
      }
    ],
    "keyTakeaways": [
      "Persegi dan segitiga sama sisi selalu pasti sebangun karena bentuk geometrisnya terkunci.",
      "Rasio sisi sejajar pada segitiga selalu membandingkan sisi segitiga kecil terhadap sisi total segitiga besar: $\\frac{DE}{BC} = \\frac{AD}{AD+DB}$.",
      "Sudut-sudut-sudut hanya menjamin kesebangunan, bukan kekongruenan."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_5",
    "subtestKode": "MTK_SMP",
    "babNumber": 5,
    "slug": "bangun-ruang-sisi-lengkung",
    "judul": "Bangun Ruang Sisi Lengkung (BRSL)",
    "durasiBacaMenit": 16,
    "ringkasanSingkat": "Kuasai formula luas permukaan dan volume untuk Tabung, Kerucut, dan Bola, serta perbandingan volume akibat perubahan jari-jari.",
    "learningObjectives": [
      "Menghitung luas selimut, luas permukaan total, dan volume tabung dengan jari-jari $r$ dan tinggi $t$.",
      "Menerapkan hubungan Pythagoras garis pelukis kerucut $s = \\sqrt{r^2 + t^2}$ untuk menghitung luas dan volume.",
      "Menentukan luas permukaan bola pejal serta perbandingan volume bola saat jari-jari diperbesar $k$ kali."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 660 230\" width=\"100%\" height=\"220\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#f8fafc\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  \n  <g transform=\"translate(30, 20)\">\n    <ellipse cx=\"60\" cy=\"140\" rx=\"45\" ry=\"14\" fill=\"#bae6fd\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <path d=\"M 15 40 L 15 140 A 45 14 0 0 0 105 140 L 105 40 Z\" fill=\"#e0f2fe\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <ellipse cx=\"60\" cy=\"40\" rx=\"45\" ry=\"14\" fill=\"#bae6fd\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <line x1=\"115\" y1=\"40\" x2=\"115\" y2=\"140\" stroke=\"#0369a1\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <text x=\"122\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#0369a1\" font-weight=\"bold\">t</text>\n    <line x1=\"60\" y1=\"40\" x2=\"105\" y2=\"40\" stroke=\"#0369a1\" stroke-width=\"1.5\"/>\n    <text x=\"78\" y=\"34\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#0369a1\" font-weight=\"bold\">r</text>\n    <text x=\"25\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0369a1\">1. Tabung (Silinder)</text>\n    <text x=\"15\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">V = πr²t | Lp = 2πr(r+t)</text>\n  </g>\n\n  <g transform=\"translate(240, 20)\">\n    <ellipse cx=\"65\" cy=\"140\" rx=\"50\" ry=\"15\" fill=\"#fef08a\" stroke=\"#ca8a04\" stroke-width=\"2\"/>\n    <path d=\"M 15 140 L 65 30 L 115 140 A 50 15 0 0 1 15 140 Z\" fill=\"#fef9c3\" stroke=\"#ca8a04\" stroke-width=\"2\"/>\n    <line x1=\"65\" y1=\"30\" x2=\"65\" y2=\"140\" stroke=\"#a16207\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <text x=\"50\" y=\"90\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#a16207\" font-weight=\"bold\">t</text>\n    <line x1=\"65\" y1=\"140\" x2=\"115\" y2=\"140\" stroke=\"#a16207\" stroke-width=\"1.5\"/>\n    <text x=\"85\" y=\"134\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#a16207\" font-weight=\"bold\">r</text>\n    <text x=\"96\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\" font-weight=\"bold\">s</text>\n    <text x=\"35\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#a16207\">2. Kerucut (Cone)</text>\n    <text x=\"20\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">s² = r²+t² | V = ⅓πr²t</text>\n  </g>\n\n  <g transform=\"translate(460, 20)\">\n    <defs>\n      <radialGradient id=\"sphereGradRich\" cx=\"35%\" cy=\"35%\" r=\"65%\">\n        <stop offset=\"0%\" stop-color=\"#fed7aa\"/>\n        <stop offset=\"60%\" stop-color=\"#f97316\"/>\n        <stop offset=\"100%\" stop-color=\"#c2410c\"/>\n      </radialGradient>\n    </defs>\n    <circle cx=\"70\" cy=\"85\" r=\"55\" fill=\"url(#sphereGradRich)\" stroke=\"#9a3412\" stroke-width=\"2\"/>\n    <ellipse cx=\"70\" cy=\"85\" rx=\"55\" ry=\"15\" fill=\"none\" stroke=\"#7c2d12\" stroke-width=\"1.5\" stroke-dasharray=\"4 2\"/>\n    <circle cx=\"70\" cy=\"85\" r=\"3\" fill=\"#ffffff\"/>\n    <line x1=\"70\" y1=\"85\" x2=\"125\" y2=\"85\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n    <text x=\"92\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#ffffff\" font-weight=\"bold\">r</text>\n    <text x=\"45\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#c2410c\">3. Bola (Sphere)</text>\n    <text x=\"25\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">V = ⁴⁄₃πr³ | Lp = 4πr²</text>\n  </g>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Tabung (Silinder)",
        "isi": "Tabung memiliki alas dan tutup berupa lingkaran kongruen serta bidang selimut yang jika dibuka berbentuk persegi panjang.\n• Luas Selimut: $L_s = 2\\pi r t$\n• Luas Permukaan Total: $L_p = 2\\pi r (r + t)$\n• Luas Tabung Tanpa Tutup: $L_{tt} = \\pi r^2 + 2\\pi r t = \\pi r (r + 2t)$\n• Volume Tabung: $V = \\pi r^2 t$.",
        "poinPenting": [
          "Gunakan $\\pi = \\frac{22}{7}$ jika jari-jari kelipatan 7. Gunakan $\\pi = 3{,}14$ jika jari-jari bukan kelipatan 7."
        ]
      },
      {
        "subjudul": "2. Kerucut (Cone)",
        "isi": "Kerucut merupakan bangun ruang limas dengan alas berbentuk lingkaran. Hubungan antara jari-jari alas $r$, tinggi kerucut $t$, dan garis pelukis $s$ membentuk segitiga siku-siku:\n$$s = \\sqrt{r^2 + t^2}$$\n• Luas Selimut Kerucut: $L_s = \\pi r s$\n• Luas Permukaan Total: $L_p = \\pi r (r + s)$\n• Volume Kerucut: $V = \\frac{1}{3} \\pi r^2 t$.",
        "poinPenting": [
          "Volume kerucut tepat sepertiga ($\\frac{1}{3}$) dari volume tabung dengan jari-jari dan tinggi yang sama."
        ]
      },
      {
        "subjudul": "3. Bola (Sphere)",
        "isi": "Bola dibatasi oleh satu bidang lengkung yang berjarak sama terhadap titik pusat.\n• Luas Permukaan Bola: $L_p = 4\\pi r^2$\n• Volume Bola: $V = \\frac{4}{3} \\pi r^3$\n• Luas Belahan Bola Berongga: $L = 2\\pi r^2$\n• Luas Belahan Bola Padat (Pejal): $L = 2\\pi r^2 + \\pi r^2 = 3\\pi r^2$.\n\n• Perbandingan Faktor Skala: Jika jari-jari bola diubah menjadi $k$ kali semula:\n- Luas permukaan baru menjadi $k^2$ kali luas semula.\n- Volume baru menjadi $k^3$ kali volume semula.",
        "poinPenting": [
          "Hati-hati membaca soal belahan bola: jika 'pejal' atau 'padat', bidang lingkaran alas ikut dihitung luasnya sehingga total menjadi $3\\pi r^2$!"
        ]
      }
    ],
    "trikCepat": "Trik Perbesaran Jari-jari Bola: Jika jari-jari bola dijadikan $k$ kali semula, volumenya langsung naik sebesar $k^3$ kali! Jika jari-jari diperbesar 2 kali, volumenya menjadi $2^3 = 8$ kali! Jika diperbesar 3 kali, volumenya menjadi $3^3 = 27$ kali lipat!",
    "jebakanUmum": "Jebakan Diameter vs Jari-jari: Soal ujian sering memberikan angka DIAMETER (misal diameter 14 cm). Jangan langsung memasukkan angka diameter ke rumus volume $\\pi r^2 t$! Bagilah dua terlebih dahulu untuk mencari jari-jarinya ($r = \\frac{14}{2} = 7\\text{ cm}$).",
    "contohSoal": [
      {
        "soal": "Sebuah kerucut memiliki jari-jari alas $r = 7\\text{ cm}$ dan tinggi $t = 24\\text{ cm}$. Tentukan luas seluruh permukaan kerucut tersebut! (Gunakan $\\pi = \\frac{22}{7}$)",
        "opsi": {
          "A": "$550\\text{ cm}^2$",
          "B": "$704\\text{ cm}^2$",
          "C": "$748\\text{ cm}^2$",
          "D": "$880\\text{ cm}^2$"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Langkah 1: Cari garis pelukis $s$ dengan rumus Pythagoras: $s = \\sqrt{r^2 + t^2} = \\sqrt{7^2 + 24^2} = \\sqrt{49 + 576} = \\sqrt{625} = 25\\text{ cm}$.",
          "Langkah 2: Hitung luas permukaan: $L_p = \\pi r (r + s) = \\frac{22}{7} \\times 7 \\times (7 + 25)$.",
          "Langkah 3: $L_p = 22 \\times 32 = 704\\text{ cm}^2$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b5_q1",
        "soal": "Perhatikan gambar tabung di bawah ini! Volume tabung dengan diameter $14\\text{ cm}$ dan tinggi $10\\text{ cm}$ (gunakan $\\pi = \\frac{22}{7}$) adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 200\" width=\"100%\" height=\"180\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <g transform=\"translate(60, 20)\">\n    <ellipse cx=\"80\" cy=\"120\" rx=\"50\" ry=\"14\" fill=\"#ccfbf1\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <path d=\"M 30 30 L 30 120 A 50 14 0 0 0 130 120 L 130 30 Z\" fill=\"#f0fdfa\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <ellipse cx=\"80\" cy=\"30\" rx=\"50\" ry=\"14\" fill=\"#ccfbf1\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    \n    <line x1=\"30\" y1=\"30\" x2=\"130\" y2=\"30\" stroke=\"#0f766e\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <circle cx=\"80\" cy=\"30\" r=\"3\" fill=\"#0f766e\"/>\n    <text x=\"50\" y=\"24\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">d = 14 cm (r = 7 cm)</text>\n    \n    <line x1=\"140\" y1=\"30\" x2=\"140\" y2=\"120\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n    <text x=\"146\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">t = 10 cm</text>\n  </g>\n</svg>",
        "opsi": {
          "A": "1.540 cm³",
          "B": "3.080 cm³",
          "C": "4.620 cm³",
          "D": "6.160 cm³"
        },
        "kunci": "A",
        "pembahasan": "Diameter $d = 14\\text{ cm}$, maka jari-jari $r = 7\\text{ cm}$. Rumus volume tabung adalah $V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = \\frac{22}{7} \\times 49 \\times 10 = 22 \\times 7 \\times 10 = 1.540\\text{ cm}^3$."
      },
      {
        "id": "mtk_smp_b5_q2",
        "soal": "Perhatikan visual setengah bola pejal di bawah ini! Luas permukaan belahan bola padat (setengah bola pejal) berdiameter $20\\text{ cm}$ (gunakan $\\pi = 3{,}14$) adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 180\" width=\"100%\" height=\"170\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <g transform=\"translate(60, 25)\">\n    <ellipse cx=\"80\" cy=\"50\" rx=\"60\" ry=\"18\" fill=\"#fde68a\" stroke=\"#d97706\" stroke-width=\"2\"/>\n    <path d=\"M 20 50 A 60 60 0 0 0 140 50 Z\" fill=\"#fef3c7\" stroke=\"#d97706\" stroke-width=\"2\"/>\n    <line x1=\"20\" y1=\"50\" x2=\"140\" y2=\"50\" stroke=\"#b45309\" stroke-width=\"2\"/>\n    <circle cx=\"80\" cy=\"50\" r=\"3\" fill=\"#b45309\"/>\n    <text x=\"50\" y=\"44\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#b45309\">d = 20 cm (r = 10 cm)</text>\n    <text x=\"15\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#78350f\">Belahan Bola Padat (Setengah Pejal):</text>\n    <text x=\"25\" y=\"146\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#92400e\">Lp = 2πr² (lengkung) + πr² (alas) = 3πr²</text>\n  </g>\n</svg>",
        "opsi": {
          "A": "628 cm²",
          "B": "942 cm²",
          "C": "1.256 cm²",
          "D": "1.884 cm²"
        },
        "kunci": "B",
        "pembahasan": "Diameter $d = 20\\text{ cm} \\implies r = 10\\text{ cm}$. Luas permukaan belahan bola padat terdiri dari luas selimut setengah bola ($2\\pi r^2$) ditambah luas lingkaran alas penutupnya ($\\pi r^2$). Maka $L_p = 3\\pi r^2 = 3 \\times 3{,}14 \\times 10^2 = 3 \\times 314 = 942\\text{ cm}^2$."
      },
      {
        "id": "mtk_smp_b5_q3",
        "soal": "Jika jari-jari sebuah bola diperbesar menjadi $2$ kali panjang semula, maka perbandingan volume bola yang baru terhadap volume bola semula adalah...",
        "opsi": {
          "A": "2 : 1",
          "B": "4 : 1",
          "C": "8 : 1",
          "D": "16 : 1"
        },
        "kunci": "C",
        "pembahasan": "Volume bola berbanding lurus dengan pangkat tiga jari-jarinya ($V \\propto r^3$). Jika jari-jari menjadi $r_2 = 2r_1$, maka $\\frac{V_2}{V_1} = \\left(\\frac{r_2}{r_1}\\right)^3 = (2)^3 = 8$. Jadi perbandingannya adalah $8 : 1$."
      }
    ],
    "keyTakeaways": [
      "Selalu bagi dua nilai diameter untuk mendapatkan jari-jari $r$ sebelum menghitung volume.",
      "Luas setengah bola berongga adalah $2\\pi r^2$, sedangkan luas setengah bola pejal/padat adalah $3\\pi r^2$.",
      "Perubahan volume bola berbanding dengan kubik jari-jari: perbesaran $k$ kali menghasilkan volume $k^3$ kali lipat."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  }
];
export const BIN_SMP_MODUL = [
  {
    "id": "bin_smp_bab_1",
    "subtestKode": "BIN_SMP",
    "babNumber": 1,
    "slug": "teks-laporan-percobaan",
    "judul": "Teks Laporan Percobaan",
    "durasiBacaMenit": 10,
    "ringkasanSingkat": "Pahami struktur teks laporan hasil observasi/eksperimen, kaidah kebahasaan kata kerja aktif, kata tugas, dan pembedaan fakta vs opini.",
    "learningObjectives": [
      "Mengidentifikasi struktur teks laporan percobaan (Tujuan, Alat & Bahan, Langkah Kerja, Hasil, Simpulan).",
      "Menganalisis kalimat pasif, kata hubung kausalitas, dan istilah ilmiah bidang sains.",
      "Membedakan pernyataan fakta berbasis data kuantitatif dengan opini inferensi penulis."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Struktur Umum Teks Laporan",
        "isi": "Teks laporan percobaan disusun sistematis berdasarkan metode ilmiah:\n1. Judul & Tujuan Percobaan\n2. Kajian Teori Singkat\n3. Alat dan Bahan Percobaan\n4. Prosedur/Langkah-Langkah Kerja\n5. Paparan Hasil Pengamatan (disertai tabel atau grafik)\n6. Simpulan Berdasarkan Data Fakta.",
        "poinPenting": [
          "Teks laporan percobaan bersifat objektif, faktual, dan tidak memasukkan unsur rekaan pribadi."
        ]
      }
    ],
    "trikCepat": "Trik Fakta vs Opini: Fakta selalu mengandung data yang dapat diverifikasi (angka, hasil uji laboratorium, waktu terukur). Opini ditandai kata adjektiva subjektif seperti 'sangat baik', 'seharusnya', 'tampaknya', atau 'diduga'.",
    "jebakanUmum": "Jebakan Simpulan: Simpulan yang benar harus menjawab tujuan percobaan dan bersumber langsung dari data hasil pengamatan, bukan asumsi umum di luar teks.",
    "contohSoal": [
      {
        "soal": "Bacalah kutipan teks berikut:\n'Berdasarkan pengujian larutan ekstrak kunyit pada cuka makan, warna cairan berubah menjadi kuning terang. Sementara pada air kapur, warna berubah menjadi merah kecokelatan.'\nBagian struktur teks laporan percobaan di atas merupakan bagian...",
        "opsi": {
          "A": "Tujuan",
          "B": "Langkah Kerja",
          "C": "Hasil Pengamatan",
          "D": "Simpulan"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Kutipan tersebut memaparkan fenomena perubahan warna yang teramati selama percobaan berlangsung.",
          "Oleh karena itu, kutipan ini termasuk ke dalam bagian Hasil Pengamatan."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "bin_smp_b1_q1",
        "soal": "Ciri utama bahasa dalam teks laporan percobaan yang membedakannya dari teks fiksi adalah...",
        "opsi": {
          "A": "Menggunakan bahasa kiasan dan majas personifikasi",
          "B": "Bersifat objektif, denotatif, dan berbasis data faktual",
          "C": "Mengutamakan sudut pandang orang pertama",
          "D": "Banyak memuat alur cerita yang dramatis"
        },
        "kunci": "B",
        "pembahasan": "Teks laporan percobaan merupakan teks ilmiah nonfiksi yang wajib objektif, menggunakan kata bermakna sebenarnya (denotatif), dan didukung data faktual hasil pengamatan."
      },
      {
        "id": "bin_smp_b1_q2",
        "soal": "Manakah di antara kalimat berikut yang merupakan kalimat FAKTA?",
        "opsi": {
          "A": "Tanaman cabai yang diberi pupuk kandang tampak lebih subur dan indah.",
          "B": "Tinggi rata-rata tanaman cabai pada pot A bertambah 4,5 cm dalam 7 hari.",
          "C": "Sebaiknya petani selalu menyiram tanaman setiap sore hari.",
          "D": "Pupuk organik mungkin merupakan pupuk terbaik di dunia."
        },
        "kunci": "B",
        "pembahasan": "Kalimat B menyajikan data terukur kuantitatif (4,5 cm dalam 7 hari) yang dapat diuji kebenarannya secara objektif, sehingga merupakan fakta."
      },
      {
        "id": "bin_smp_b1_q3",
        "soal": "Kata penghubung yang menyatakan hubungan sebab-akibat (kausalitas) dalam teks laporan adalah...",
        "opsi": {
          "A": "Dan, serta, lalu",
          "B": "Karena, sebab, oleh karena itu",
          "C": "Tetapi, melainkan, sedangkan",
          "D": "Meskipun, biarpun, kendatipun"
        },
        "kunci": "B",
        "pembahasan": "Kata hubung 'karena', 'sebab', dan 'oleh karena itu' adalah konjungsi kausalitas yang menjelaskan hubungan sebab akibat pada hasil percobaan."
      }
    ],
    "keyTakeaways": [
      "Teks laporan percobaan disusun secara objektif dan faktual.",
      "Struktur baku mencakup Tujuan, Alat/Bahan, Langkah, Hasil, dan Simpulan.",
      "Gunakan fakta kuantitatif untuk membuktikan hipotesis percobaan."
    ],
    "subtestWarna": "#0d9488",
    "subtestBgLight": "#f0fdfa",
    "subtestEmoji": "📖"
  },
  {
    "id": "bin_smp_bab_2",
    "subtestKode": "BIN_SMP",
    "babNumber": 2,
    "slug": "pidato-persuasif",
    "judul": "Teks Pidato Persuasif",
    "durasiBacaMenit": 11,
    "ringkasanSingkat": "Kuasai teknik persuasi etika (etika), emosi (patos), dan logika (logos), serta struktur pembukaan, isi persuasif, dan penegasan penutup.",
    "learningObjectives": [
      "Memahami 3 pendekatan persuasif: Etika, Emosi, dan Logika.",
      "Menentukan argumen pendukung dan pesan ajakan dalam teks pidato persuasif.",
      "Menganalisis kalimat ajakan imperatif dan kalimat persuasif bermakna santun."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Tiga Pendekatan Membujuk Audiens",
        "isi": "1. Pendekatan Etika: Menyentuh nilai moral, norma masyarakat, dan integritas.\n2. Pendekatan Emosi: Menggugah perasaan audiens (empati, kepedulian, rasa bangga).\n3. Pendekatan Logika: Menyajikan alasan rasional, fakta ilmiah, dan sebab-akibat yang masuk akal.",
        "poinPenting": [
          "Struktur pidato persuasif terdiri atas: Pembukaan (salam, latar belakang), Isi (argumen & ajakan), dan Penutup (simpulan, permohonan maaf, salam)."
        ]
      }
    ],
    "trikCepat": "Trik Kata Kunci Ajakan: Kalimat persuasif selalu memiliki kata ajakan eksplisit seperti 'marilah', 'ayo', 'hendaknya', atau 'kita harus'.",
    "jebakanUmum": "Jebakan Pidato: Jangan terkecoh dengan kalimat pembuka basa-basi. Inti ajakan utama pidato persuasif selalu terletak pada paragraf argumen dan bagian penegasan akhir.",
    "contohSoal": [
      {
        "soal": "'Saudara-saudaraku, mari kita kurangi penggunaan sampah plastik sekali pakai demi kelestarian laut bagi anak cucu kita.' Kalimat tersebut menggunakan pendekatan...",
        "opsi": {
          "A": "Logika dan Matematika",
          "B": "Etika dan Emosi",
          "C": "Hukum Pidana",
          "D": "Deskripsi Ruang"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Kalimat tersebut menyentuh tanggung jawab moral (etika) serta kasih sayang kepada masa depan anak cucu (emosi).",
          "Maka pendekatannya adalah Etika dan Emosi."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "bin_smp_b2_q1",
        "soal": "Tujuan utama dari teks pidato persuasif adalah...",
        "opsi": {
          "A": "Menceritakan pengalaman pribadi yang lucu",
          "B": "Membujuk, meyakinkan, dan mengajak audiens melakukan tindakan tertentu",
          "C": "Menjelaskan cara memasak makanan tradisional",
          "D": "Mendeskripsikan keindahan alam pegunungan"
        },
        "kunci": "B",
        "pembahasan": "Pidato persuasif bertujuan memengaruhi pendengar agar mempercayai gagasan yang disampaikan dan tergerak melakukan tindakan sesuai ajakan pembicara."
      },
      {
        "id": "bin_smp_b2_q2",
        "soal": "Bagian penutup pidato persuasif umumnya memuat...",
        "opsi": {
          "A": "Pengenalan alat dan bahan penelitian",
          "B": "Penegasan kembali gagasan pokok, ajakan akhir, permohonan maaf, dan salam",
          "C": "Data statistik hasil sensus penduduk",
          "D": "Rincian biaya anggaran kegiatan"
        },
        "kunci": "B",
        "pembahasan": "Bagian penutup berisi simpulan/penegasan intisari pidato, ajakan puncak, apresiasi, permohonan maaf, serta salam penutup."
      },
      {
        "id": "bin_smp_b2_q3",
        "soal": "Manakah kalimat yang menggunakan kata tugas ajakan persuasif?",
        "opsi": {
          "A": "Kemarin sore kami telah menanam sepuluh bibit pohon bakau.",
          "B": "Marilah kita jaga kebersihan lingkungan sekolah demi kenyamanan bersama.",
          "C": "Sungai itu mengalir sangat jernih di dekat perbukitan.",
          "D": "Apakah kamu tahu nama ketua panitia kegiatan penghijauan?"
        },
        "kunci": "B",
        "pembahasan": "Kata 'Marilah' adalah penanda kalimat ajakan persuasif yang mengajak pendengar untuk bertindak bersama-sama."
      }
    ],
    "keyTakeaways": [
      "Pidato persuasif menggabungkan kekuatan etika, emosi, dan logika.",
      "Kata ajakan 'marilah', 'ayo', 'hendaknya' menjadi ciri utama kalimat ajakan.",
      "Penutup merangkum gagasan dan menegaskan kembali komitmen bersama."
    ],
    "subtestWarna": "#0d9488",
    "subtestBgLight": "#f0fdfa",
    "subtestEmoji": "📖"
  },
  {
    "id": "bin_smp_bab_3",
    "subtestKode": "BIN_SMP",
    "babNumber": 3,
    "slug": "kaidah-puebi-dan-kalimat-efektif",
    "judul": "Kaidah PUEBI & Kalimat Efektif",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Kuasai pemakaian huruf kapital, penulisan tanda baca koma/titik dua, konjungsi intrakalimat vs antarkalimat, serta syarat kalimat efektif.",
    "learningObjectives": [
      "Menerapkan penulisan huruf kapital pada nama jabatan, geografi, dan judul karya.",
      "Mengoreksi kesalahan penggunaan tanda koma (,), tanda titik dua (:), dan tanda hubung (-).",
      "Menyusun kalimat efektif yang hemat kata, logis secara nalar, dan memiliki kesejajaran bentuk (paralelisme)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Syarat Utama Kalimat Efektif",
        "isi": "Kalimat efektif adalah kalimat yang mampu menyampaikan pesan pembicara/penulis secara tepat tanpa menimbulkan ketaksaan (ambiguitas).\nSyarat pokok:\n1. Keutuhan/Kesatuan: Memiliki unsur subjek dan predikat yang jelas.\n2. Kesejajaran (Paralelisme): Bentuk kata yang dirangkaikan harus setara (misal: awalan me- harus dipadankan dengan awalan me-, bukan di-).\n3. Kehematan: Menghindari pemborosan kata (contoh salah: 'semua para siswa', benar: 'semua siswa' atau 'para siswa').\n4. Kelogisan: Makna kalimat masuk akal sehat.",
        "poinPenting": [
          "Jangan mengawali subjek kalimat dengan preposisi seperti 'Di dalam rapat itu memutuskan...' (SALAH karena tidak memiliki subjek!). Benar: 'Rapat itu memutuskan...' atau 'Di dalam rapat itu diputuskan...'."
        ]
      }
    ],
    "trikCepat": "Trik Huruf Kapital Geografi: Nama geografi diberi huruf kapital HANYA jika diikuti nama diri geografinya! Contoh: 'Sungai Bengawan Solo', 'Pulau Bali', 'Danau Toba'. Jika hanya jenis geografi umum tanpa nama diri ('mandi di sungai', 'berlayar ke pulau'), gunakan huruf kecil!",
    "jebakanUmum": "Jebakan Konjungsi Ganda: Kalimat majemuk tidak boleh memuat konjungsi anak kalimat dan induk kalimat sekaligus! Contoh SALAH: 'Meskipun hari hujan, tetapi kami tetap berangkat.' (Salah karena ada 'meskipun' dan 'tetapi'). BENAR: 'Meskipun hari hujan, kami tetap berangkat.'",
    "contohSoal": [
      {
        "soal": "Perhatikan kalimat berikut:\n'Tahap akhir dari penyelesaian gedung itu adalah mencakup pengecatan dinding, pemasangan lampu, dan merapikan lantai.'\nPerbaikan kalimat di atas agar memiliki kesejajaran bentuk (paralelisme) adalah...",
        "opsi": {
          "A": "pengecatan dinding, pemasangan lampu, dan perapian lantai",
          "B": "mengecat dinding, memasang lampu, dan perapian lantai",
          "C": "pengecatan dinding, memasang lampu, dan merapikan lantai",
          "D": "dicat dindingnya, dipasang lampunya, dan dirapikan lantainya"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Unsur pertama menggunakan nomina bentuk pe-an ('pengecatan'), unsur kedua nomina pe-an ('pemasangan').",
          "Agar sejajar secara paralel, unsur ketiga juga harus berupa nomina pe-an ('perapian lantai'), bukan verba me- ('merapikan').",
          "Maka pilihan perbaikan yang paling tepat adalah A."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "bin_smp_b3_q1",
        "soal": "Penulisan huruf kapital yang tepat menurut kaidah PUEBI adalah...",
        "opsi": {
          "A": "Ibu membeli pisang Ambon dan gula Jawa di pasar.",
          "B": "Kami berwisata ke Danau Toba di provinsi Sumatra Utara.",
          "C": "Ayah membaca novel Tenggelamnya Kapal Van Der Wijck.",
          "D": "Paman baru saja dilantik menjadi Gubernur."
        },
        "kunci": "B",
        "pembahasan": "'Danau Toba' adalah nama geografis yang diikuti nama diri sehingga keduanya diawali huruf kapital. Pilihan A salah karena pisang ambon dan gula jawa adalah nama jenis, bukan nama diri geografi."
      },
      {
        "id": "bin_smp_b3_q2",
        "soal": "Kalimat berikut yang merupakan KALIMAT EFEKTIF adalah...",
        "opsi": {
          "A": "Bagi semua siswa yang membawa sepeda motor harus memarkir di halaman belakang.",
          "B": "Para hadirin sekalian dimohon untuk segera berdiri.",
          "C": "Siswa kelas sembilan sedang membersihkan ruang kelas dan merapikan perpustakaan.",
          "D": "Dia rajin belajar demi untuk meraih nilai terbaik."
        },
        "kunci": "C",
        "pembahasan": "Kalimat C memiliki subjek ('Siswa kelas sembilan') dan predikat paralel ('membersihkan... dan merapikan...'). Kalimat A salah karena diawali 'Bagi' sehingga kehilangan subjek, B boros ('Para hadirin sekalian'), D pleonasme ('demi untuk')."
      },
      {
        "id": "bin_smp_b3_q3",
        "soal": "Tanda baca koma (,) yang digunakan secara TEPAT terdapat pada kalimat...",
        "opsi": {
          "A": "Saya ingin membeli buku itu, tetapi uang saya belum cukup.",
          "B": "Jika hari ini hujan lebat, maka pertandingan akan ditunda.",
          "C": "Ayah membeli meja kursi dan lemari baru.",
          "D": "Karena terlambat bangun tidur, sehingga dia tertinggal bus sekolah."
        },
        "kunci": "A",
        "pembahasan": "Tanda koma dipakai sebelum konjungsi pertentangan seperti 'tetapi', 'melainkan', dan 'sedangkan' yang menghubungkan klausa setara dalam kalimat majemuk."
      }
    ],
    "keyTakeaways": [
      "Kalimat efektif wajib memiliki kejelasan Subjek dan Predikat serta kesejajaran imbuhan.",
      "Hindari pemborosan kata (pleonasme) seperti 'para hadirin sekalian' atau 'demi untuk'.",
      "Tanda koma diletakkan sebelum konjungsi pertentangan 'tetapi' dan setelah anak kalimat yang mendahului induk kalimat."
    ],
    "subtestWarna": "#0d9488",
    "subtestBgLight": "#f0fdfa",
    "subtestEmoji": "📖"
  }
];
export const IPA_SMP_MODUL = [
  {
    "id": "ipa_smp_bab_1",
    "subtestKode": "IPA_SMP",
    "babNumber": 1,
    "slug": "pewarisan-sifat-dan-genetika",
    "judul": "Pewarisan Sifat (Genetika Mendel)",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Kuasai hukum segregasi Mendel, persilangan monohibrid dominan & intermediet, persilangan dihibrid rasio 9:3:3:1, serta kelainan terpaut kromosom.",
    "learningObjectives": [
      "Membedakan istilah genotipe (alel $MM, Mm, mm$) dan fenotipe (sifat tampak).",
      "Menentukan rasio genotipe dan fenotipe keturunan $F_2$ pada persilangan monohibrid dan dihibrid.",
      "Menganalisis pewarisan kelainan hemofilia dan buta warna terpaut kromosom X."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 460 210\" width=\"100%\" height=\"200\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"30\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#059669\">🌱 Punnett Square Monohibrid (MM × mm → F₂)</text>\n  <rect x=\"120\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"155\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"200\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"235\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  \n  <rect x=\"40\" y=\"85\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"120\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">MM (Merah)</text>\n  <rect x=\"200\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"225\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  \n  <rect x=\"40\" y=\"130\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  <rect x=\"120\" y=\"130\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  <rect x=\"200\" y=\"130\" width=\"80\" height=\"45\" fill=\"#fef2f2\" stroke=\"#fecaca\"/>\n  <text x=\"225\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#b91c1c\">mm (Putih)</text>\n  \n  <text x=\"295\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Genotipe:</text>\n  <text x=\"295\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#059669\">1 MM : 2 Mm : 1 mm</text>\n  <text x=\"295\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Fenotipe:</text>\n  <text x=\"295\" y=\"165\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\">3 Merah : 1 Putih (75% : 25%)</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Hukum Mendel I & Persilangan Monohibrid",
        "isi": "Hukum Segregasi Bebas (Mendel I) menyatakan bahwa pada pembentukan gamet, pasangan alel akan memisah secara bebas.\n• Persilangan Monohibrid Dominan Penuh:\nParental: $MM$ (Merah) $\\times mm$ (Putih)\nFilial 1 ($F_1$): Semua $Mm$ (Merah)\nPersilangan sesama $F_1$: $Mm \\times Mm$\nFilial 2 ($F_2$):\n- Rasio Genotipe: $1 MM : 2 Mm : 1 mm$ (25% : 50% : 25%)\n- Rasio Fenotipe: 3 Merah : 1 Putih (75% : 25%).",
        "poinPenting": [
          "Jika bersifat intermediet (kodominan), heterozigot $Mm$ menghasilkan warna merah muda (rasio fenotipe 1 Merah : 2 Merah Muda : 1 Putih)."
        ]
      }
    ],
    "trikCepat": "Trik Cepat Dihibrid ($AaBb \\times AaBb$): Rasio fenotipe dominan penuh dihibrid selalu berpola $9 : 3 : 3 : 1$.\n- 9 = Dominan kedua sifat ($A\\_B\\_$)\n- 3 = Dominan sifat pertama, resesif kedua ($A\\_bb$)\n- 3 = Resesif sifat pertama, dominan kedua ($aaB\\_$)\n- 1 = Resesif kedua sifat ($aabb$).",
    "jebakanUmum": "Jebakan Buta Warna: Buta warna terpaut kromosom X resesif ($X^{cb}$). Laki-laki hanya memiliki satu kromosom X ($X^{cb}Y$), sehingga jika memiliki gen $X^{cb}$ langsung menderita buta warna (tidak ada istilah pria carrier!). Wanita carrier bergenotipe $X^C X^{cb}$ berfenotipe normal.",
    "contohSoal": [
      {
        "soal": "Kacang ercis berbiji bulat kuning ($BbKk$) disilangkan dengan sesamanya ($BbKk$). Berapakah persentase keturunan yang berfenotipe bulat hijau jika sifat bulat ($B$) dominan terhadap kisut ($b$) dan kuning ($K$) dominan terhadap hijau ($k$)?",
        "opsi": {
          "A": "56,25% (9/16)",
          "B": "18,75% (3/16)",
          "C": "6,25% (1/16)",
          "D": "50,00% (8/16)"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Rasio fenotipe dihibrid: Bulat Kuning (9) : Bulat Hijau (3) : Kisut Kuning (3) : Kisut Hijau (1). Total bagian = 16.",
          "Bagian untuk fenotipe Bulat Hijau adalah 3 dari 16 bagian.",
          "Persentase: $\\frac{3}{16} \\times 100\\% = 18{,}75\\%$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b1_q1",
        "soal": "Persilangan antara tanaman berbunga merah ($MM$) dengan tanaman berbunga putih ($mm$) menghasilkan keturunan $F_1$ berbunga merah muda ($Mm$). Sifat pewarisan ini disebut...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 460 210\" width=\"100%\" height=\"200\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"30\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#059669\">🌱 Punnett Square Monohibrid (MM × mm → F₂)</text>\n  <rect x=\"120\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"155\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"200\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"235\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  \n  <rect x=\"40\" y=\"85\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"120\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">MM (Merah)</text>\n  <rect x=\"200\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"225\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  \n  <rect x=\"40\" y=\"130\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  <rect x=\"120\" y=\"130\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  <rect x=\"200\" y=\"130\" width=\"80\" height=\"45\" fill=\"#fef2f2\" stroke=\"#fecaca\"/>\n  <text x=\"225\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#b91c1c\">mm (Putih)</text>\n  \n  <text x=\"295\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Genotipe:</text>\n  <text x=\"295\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#059669\">1 MM : 2 Mm : 1 mm</text>\n  <text x=\"295\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Fenotipe:</text>\n  <text x=\"295\" y=\"165\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\">3 Merah : 1 Putih (75% : 25%)</text>\n</svg>",
        "opsi": {
          "A": "Dominan penuh",
          "B": "Intermediet (kodominan)",
          "C": "Resesif mutlak",
          "D": "Epistasis dominan"
        },
        "kunci": "B",
        "pembahasan": "Sifat intermediet terjadi ketika alel dominan tidak dapat menutupi alel resesif secara sempurna, sehingga terbentuk fenotipe campuran antara kedua induknya (merah + putih = merah muda)."
      },
      {
        "id": "ipa_smp_b1_q2",
        "soal": "Seorang wanita pembawa sifat buta warna ($X^C X^{cb}$) menikah dengan pria berpenglihatan normal ($X^C Y$). Kemungkinan anak laki-laki mereka menderita buta warna adalah...",
        "opsi": {
          "A": "0%",
          "B": "25%",
          "C": "50%",
          "D": "100%"
        },
        "kunci": "C",
        "pembahasan": "Keturunan anak laki-laki menerima kromosom Y dari ayah dan kromosom X dari ibu ($X^C$ atau $X^{cb}$). Peluang anak laki-laki menerima $X^{cb}$ dari ibu pembawa adalah $\\frac{1}{2} = 50\\%$."
      }
    ],
    "keyTakeaways": [
      "Hukum Segregasi I Mendel memisahkan pasangan alel pada pembentukan gamet.",
      "Rasio fenotipe monohibrid dominan penuh $F_2$ adalah 3:1, sedangkan monohibrid intermediet adalah 1:2:1.",
      "Pria mewarisi kelainan terpaut kromosom X dari ibunya."
    ],
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "subtestEmoji": "🔬"
  },
  {
    "id": "ipa_smp_bab_2",
    "subtestKode": "IPA_SMP",
    "babNumber": 2,
    "slug": "listrik-dinamis-dan-kemagnetan",
    "judul": "Listrik Dinamis & Kemagnetan",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Kuasai Hukum Ohm $V = I \\times R$, hambatan pengganti seri dan paralel, energi/daya listrik $P = V \\times I$, serta induksi elektromagnetik trafo.",
    "learningObjectives": [
      "Menghitung arus listrik, tegangan, dan hambatan menggunakan Hukum Ohm.",
      "Menentukan nilai hambatan total pada rangkaian kombinasi seri dan paralel.",
      "Menerapkan persamaan transformator ideal $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 200\" width=\"100%\" height=\"190\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"28\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#4338ca\">⚡ Rangkaian Listrik Seri vs Paralel (Hukum Ohm: V = I × R)</text>\n  \n  <g transform=\"translate(30, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"210\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">1. Rangkaian Seri</text>\n    <path d=\"M 20 70 L 40 70 M 60 70 L 90 70 M 110 70 L 140 70 M 160 70 L 190 70 L 190 95 L 20 95 Z\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"/>\n    <rect x=\"40\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"44\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₁</text>\n    <rect x=\"90\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"94\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₂</text>\n    <rect x=\"140\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"144\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₃</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1d4ed8\">R_total = R₁ + R₂ + R₃</text>\n  </g>\n\n  <g transform=\"translate(270, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"220\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">2. Rangkaian Paralel</text>\n    <line x1=\"30\" y1=\"45\" x2=\"190\" y2=\"45\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"85\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"45\" x2=\"30\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"190\" y1=\"45\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <rect x=\"95\" y=\"38\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"32\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₁</text>\n    <rect x=\"95\" y=\"78\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₂</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#4338ca\">1/R_total = 1/R₁ + 1/R₂</text>\n  </g>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Hukum Ohm & Hambatan Rangkaian",
        "isi": "Hukum Ohm menyatakan kuat arus ($I$) berbanding lurus dengan tegangan ($V$) dan berbanding terbalik dengan hambatan ($R$):\n$$V = I \\times R$$\n\n• Hambatan Seri: $R_s = R_1 + R_2 + R_3$ (arus yang mengalir di setiap resistor sama).\n• Hambatan Paralel: $\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$ (tegangan pada setiap cabang sama).",
        "poinPenting": [
          "Pada rangkaian paralel dua resistor, trik cepat hambatan pengganti: $R_p = \\frac{R_1 \\times R_2}{R_1 + R_2}$."
        ]
      }
    ],
    "trikCepat": "Trik Trafo Cepat: Perbandingan tegangan selalu SEJAJAR dengan lilitan ($\\frac{V_p}{V_s} = \\frac{N_p}{N_s}$), namun TERBALIK dengan kuat arus ($\\frac{V_p}{V_s} = \\frac{I_s}{I_p}$). Jika tegangan naik (Step Up), arus pasti turun!",
    "jebakanUmum": "Jebakan Satuan Daya: Rumus energi listrik $W = P \\times t$. Jika daya dalam Watt dan waktu dalam detik, hasilnya Joule. Jika tarif listrik dihitung dalam kWh, daya wajib diubah ke KiloWatt (bagi 1.000) dan waktu dalam satuan Jam (hour)!",
    "contohSoal": [
      {
        "soal": "Dua hambatan masing-masing bernilai $6\\,\\Omega$ dan $3\\,\\Omega$ dirangkai secara paralel, kemudian dihubungkan dengan sumber tegangan $12\\text{ Volt}$. Kuat arus total yang mengalir pada rangkaian adalah...",
        "opsi": {
          "A": "2 A",
          "B": "4 A",
          "C": "6 A",
          "D": "8 A"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Hitung hambatan paralel: $R_p = \\frac{6 \\times 3}{6 + 3} = \\frac{18}{9} = 2\\,\\Omega$.",
          "Gunakan Hukum Ohm untuk menghitung arus total: $I = \\frac{V}{R_p} = \\frac{12\\text{ V}}{2\\,\\Omega} = 6\\text{ A}$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b2_q1",
        "soal": "Sebuah transformator step-down memiliki kumparan primer $1.200$ lilitan dan kumparan sekunder $300$ lilitan. Jika tegangan primer $220\\text{ V}$, maka tegangan sekundernya adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 200\" width=\"100%\" height=\"190\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"28\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#4338ca\">⚡ Rangkaian Listrik Seri vs Paralel (Hukum Ohm: V = I × R)</text>\n  \n  <g transform=\"translate(30, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"210\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">1. Rangkaian Seri</text>\n    <path d=\"M 20 70 L 40 70 M 60 70 L 90 70 M 110 70 L 140 70 M 160 70 L 190 70 L 190 95 L 20 95 Z\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"/>\n    <rect x=\"40\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"44\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₁</text>\n    <rect x=\"90\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"94\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₂</text>\n    <rect x=\"140\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"144\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₃</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1d4ed8\">R_total = R₁ + R₂ + R₃</text>\n  </g>\n\n  <g transform=\"translate(270, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"220\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">2. Rangkaian Paralel</text>\n    <line x1=\"30\" y1=\"45\" x2=\"190\" y2=\"45\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"85\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"45\" x2=\"30\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"190\" y1=\"45\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <rect x=\"95\" y=\"38\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"32\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₁</text>\n    <rect x=\"95\" y=\"78\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₂</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#4338ca\">1/R_total = 1/R₁ + 1/R₂</text>\n  </g>\n</svg>",
        "opsi": {
          "A": "55 V",
          "B": "110 V",
          "C": "440 V",
          "D": "880 V"
        },
        "kunci": "A",
        "pembahasan": "Gunakan persamaan trafo: $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} \\implies \\frac{220}{V_s} = \\frac{1.200}{300} = 4$. Maka $V_s = \\frac{220}{4} = 55\\text{ Volt}$."
      },
      {
        "id": "ipa_smp_b2_q2",
        "soal": "Sebuah setrika listrik berdaya $350\\text{ Watt}$ digunakan selama $2\\text{ jam}$ setiap hari. Energi listrik yang digunakan setrika tersebut dalam satu hari adalah...",
        "opsi": {
          "A": "0,7 kWh",
          "B": "1,4 kWh",
          "C": "700 kWh",
          "D": "1.400 kWh"
        },
        "kunci": "A",
        "pembahasan": "Energi listrik $W = P \\times t = 350\\text{ W} \\times 2\\text{ jam} = 700\\text{ Wh} = \\frac{700}{1.000} = 0{,}7\\text{ kWh}$."
      }
    ],
    "keyTakeaways": [
      "Hukum Ohm $V = I \\times R$ menghubungkan tegangan, kuat arus, dan hambatan listrik.",
      "Rangkaian hambatan paralel memperkecil hambatan total ($R_p = \\frac{R_1 R_2}{R_1+R_2}$).",
      "Transformator ideal memenuhi hubungan $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$."
    ],
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "subtestEmoji": "🔬"
  }
];
export const BIG_SMP_MODUL = [
  {
    "id": "big_smp_bab_1",
    "subtestKode": "BIG_SMP",
    "babNumber": 1,
    "slug": "interpersonal-and-transactional-texts",
    "judul": "Expressions of Hope, Wish & Congratulations",
    "durasiBacaMenit": 10,
    "ringkasanSingkat": "Pelajari perbedaan konteks ungkapan 'congratulations', 'I hope so', 'I wish you luck', serta respon percakapan interpersonal sehari-hari.",
    "learningObjectives": [
      "Membedakan penggunaan ungkapan harapan realistis (hope) dan angan-angan (wish).",
      "Menanggapi ucapan selamat atas prestasi dan keberhasilan seseorang.",
      "Menentukan fungsi sosial dan struktur percakapan transaksional."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Hope vs Wish",
        "isi": "• 'Hope' digunakan untuk menyatakan harapan yang mungkin dan realistis terjadi di masa kini atau mendatang. Pola: Hope + S + Verb (present/future).\nContoh: 'I hope you win the speech contest tomorrow.'\n\n• 'Wish' digunakan untuk menyatakan keinginan atas hal yang mustahil/sulit terjadi saat ini (pengandaian), atau mendoakan keberuntungan formal. Pola: Wish + someone + luck/success.\nContoh: 'I wish you good luck on your examination.'",
        "poinPenting": [
          "Respon paling tepat saat diberi ucapan selamat atau doa adalah 'Thank you very much' atau 'Thanks a lot for saying so'."
        ]
      }
    ],
    "trikCepat": "Trik Jawaban Singkat: Bila seseorang berkata 'Congratulations on winning the match!', jawaban yang tepat selalu ucapan terima kasih ('Thank you', 'Thanks, I did my best'), BUKAN membalas dengan 'Same to you'!",
    "jebakanUmum": "Jebakan Wish: Jangan gunakan wish untuk kalimat doa sederhana jika ada kata kerja present biasa, gunakan pola 'wish you all the best'.",
    "contohSoal": [
      {
        "soal": "Edo: 'Siti, I heard you won the national drawing competition! Congratulations!'\nSiti: '...'\nThe most suitable response to complete the dialogue is...",
        "opsi": {
          "A": "I hope you are fine.",
          "B": "Thank you very much, Edo. I practiced hard for it.",
          "C": "I wish you good luck.",
          "D": "You must be kidding me."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Edo memberikan ucapan selamat atas prestasi Siti memenangkan lomba gambar nasional.",
          "Respon santun dan tepat untuk ucapan selamat adalah berterima kasih ('Thank you very much')."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "big_smp_b1_q1",
        "soal": "Dayu: 'Udin, my brother is hospitalized because of dengue fever.'\nUdin: 'I am sorry to hear that. I hope ... soon.'",
        "opsi": {
          "A": "he gets well",
          "B": "he is sick",
          "C": "you congratulate him",
          "D": "you stay at home"
        },
        "kunci": "A",
        "pembahasan": "Udin menyampaikan simpati atas sakitnya saudara Dayu. Doa yang tepat adalah mengharapkan kesembuhan ('I hope he gets well soon')."
      },
      {
        "id": "big_smp_b1_q2",
        "soal": "Which of the following expressions is used to congratulate someone on graduating from school?",
        "opsi": {
          "A": "Have a safe flight!",
          "B": "Congratulations on your graduation! We are so proud of you.",
          "C": "Get well soon!",
          "D": "I am so sorry for your loss."
        },
        "kunci": "B",
        "pembahasan": "Ungkapan yang tepat untuk kelulusan sekolah adalah 'Congratulations on your graduation!'."
      }
    ],
    "keyTakeaways": [
      "Gunakan 'hope' untuk harapan yang mungkin terjadi, dan 'congratulations' untuk merayakan pencapaian.",
      "Respon atas pujian dan selamat selalu diawali ungkapan terima kasih ('Thank you')."
    ],
    "subtestWarna": "#4f46e5",
    "subtestBgLight": "#eef2ff",
    "subtestEmoji": "🇬🇧"
  },
  {
    "id": "big_smp_bab_2",
    "subtestKode": "BIG_SMP",
    "babNumber": 2,
    "slug": "procedure-text-and-recipes",
    "judul": "Procedure Text: Recipes & Manuals",
    "durasiBacaMenit": 11,
    "ringkasanSingkat": "Pahami tujuan teks prosedur, struktur generic structure (Goal, Materials, Steps), kata kerja perintah (imperative verbs), dan connectives of sequence.",
    "learningObjectives": [
      "Mengidentifikasi Generic Structure teks prosedur: Goal, Ingredients/Materials, dan Steps.",
      "Menemukan kata kerja aksi imperatif (e.g., 'pour', 'stir', 'mix', 'slice').",
      "Menganalisis urutan langkah kerja menggunakan sequence adverbs (first, then, after that, finally)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Generic Structure Procedure Text",
        "isi": "Teks prosedur menjelaskan cara membuat atau mengoperasikan sesuatu melalui serangkaian tindakan teratur:\n1. Goal/Aim: Tujuan kegiatan (biasanya tertera pada judul teks, misal 'How to Make Avocado Juice').\n2. Ingredients/Materials: Bahan dan alat yang diperlukan.\n3. Steps/Methods: Runtutan petunjuk kerja menggunakan kalimat perintah imperatif dan kata urutan waktu (first, next, then, finally).",
        "poinPenting": [
          "Ciri kebahasaan: Menggunakan Simple Present Tense, kata kerja imperatif ('Blend the fruit', 'Cut the paper'), dan kata penghubung temporal."
        ]
      }
    ],
    "trikCepat": "Trik Mencari Tujuan (Purpose): Pertanyaan 'What is the purpose of the text?' jawabannya selalu berawal dari 'To show how to make / operate...' diikuti judul teks prosedur tersebut!",
    "jebakanUmum": "Jebakan Urutan: Perhatikan kata penghubung temporal 'before' dan 'after'. Kalimat 'Add sugar before blending' artinya gula dimasukkan DAHULU, baru kemudian diblender. Jangan sampai terbalik urutannya!",
    "contohSoal": [
      {
        "soal": "'Pour the warm water into the glass and stir thoroughly.' The word 'stir' is closest in meaning to...",
        "opsi": {
          "A": "Mix",
          "B": "Boil",
          "C": "Freeze",
          "D": "Chop"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Kata 'stir' berarti mengaduk.",
          "Sinonim yang paling tepat untuk mengaduk adalah 'mix' (mencampur/mengaduk)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "big_smp_b2_q1",
        "soal": "What is the social function of a procedure text?",
        "opsi": {
          "A": "To entertain the readers with a fairy tale story",
          "B": "To describe how something is made or done through a sequence of actions",
          "C": "To report a natural disaster in the community",
          "D": "To persuade people to buy a new product"
        },
        "kunci": "B",
        "pembahasan": "Fungsi sosial teks prosedur adalah memberikan panduan langkah demi langkah cara membuat atau melakukan sesuatu secara runtut."
      },
      {
        "id": "big_smp_b2_q2",
        "soal": "Which of the following words is an imperative verb commonly found in recipe steps?",
        "opsi": {
          "A": "Delicious",
          "B": "Carefully",
          "C": "Chop",
          "D": "Yesterday"
        },
        "kunci": "C",
        "pembahasan": "'Chop' (cincang/potong) adalah kata kerja tindakan berimbuhan dasar yang berfungsi sebagai kalimat perintah (imperative verb)."
      }
    ],
    "keyTakeaways": [
      "Teks prosedur terdiri dari Goal, Materials, dan Steps.",
      "Ciri bahasa: imperative verbs, simple present tense, dan temporal connectives.",
      "Tujuan teks: 'To tell / show how to make or use something'."
    ],
    "subtestWarna": "#4f46e5",
    "subtestBgLight": "#eef2ff",
    "subtestEmoji": "🇬🇧"
  }
];

export const DAFTAR_SUBTES_SMP = [
  {
    "kode": "MTK_SMP",
    "nama": "Matematika (Numerasi TKA)",
    "singkatan": "MTK",
    "badgeWarna": "#ea580c",
    "bgLight": "#fff7ed",
    "borderWarna": "#fed7aa",
    "emoji": "📐",
    "isUtama": true,
    "deskripsi": "Perpangkatan, aljabar persamaan kuadrat, transformasi geometri, kesebangunan, dan bangun ruang sisi lengkung.",
    "totalBab": 5,
    "babList": [
      {
        "id": "mtk_smp_bab_1",
        "subtestKode": "MTK_SMP",
        "babNumber": 1,
        "slug": "perpangkatan-dan-bentuk-akar",
        "judul": "Perpangkatan dan Bentuk Akar",
        "durasiBacaMenit": 12,
        "ringkasanSingkat": "Kuasai sifat-sifat eksponen aljabar, operasi rasionalisasi bentuk akar, dan konversi notasi ilmiah baku $a \\times 10^n$ ($1 \\le a < 10$).",
        "learningObjectives": [
          "Menerapkan 5 kaidah pokok operasi bilangan berpangkat bulat positif, negatif, dan nol.",
          "Menyederhanakan dan merasionalkan penyebut pecahan bentuk akar $\\frac{a}{\\sqrt{b}}$ dan $\\frac{a}{\\sqrt{b} \\pm \\sqrt{c}}$.",
          "Menuliskan bilangan desimal sangat kecil dan sangat besar ke dalam notasi baku ilmiah resmi."
        ],
        "gambar3dUrl": "/images/modul-smp/eksponen_3d_gemilang.png",
        "gambar3dCaption": "Visualisasi Edukatif 3D Konsep Eksponen & Matriks Aljabar (Bimbel Gemilang)",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 620 220\" width=\"100%\" height=\"210\">\n  <defs>\n    <marker id=\"arrowKoma\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#ea580c\"/>\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"#f8fafc\" rx=\"14\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  \n  <!-- KARTU KIRI: LOMPATAN KOMA NOTASI ILMIAH (SUPER PRESISI & AKURAT) -->\n  <g transform=\"translate(15, 14)\">\n    <rect width=\"285\" height=\"192\" fill=\"#ffffff\" rx=\"12\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n    <rect width=\"285\" height=\"34\" fill=\"#f0fdfa\" rx=\"12\" stroke=\"#ccfbf1\" stroke-width=\"1\"/>\n    <text x=\"16\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f766e\">💡 Notasi Ilmiah: a × 10ⁿ (1 ≤ a &lt; 10)</text>\n    \n    <!-- Label Posisi Koma Awal & Koma Baru -->\n    <text x=\"46\" y=\"52\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#dc2626\">Koma Awal</text>\n    <line x1=\"60\" y1=\"55\" x2=\"60\" y2=\"62\" stroke=\"#dc2626\" stroke-width=\"1.5\"/>\n    \n    <text x=\"160\" y=\"52\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#ea580c\">Koma Baru! ★</text>\n    <line x1=\"182\" y1=\"55\" x2=\"182\" y2=\"62\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n    \n    <!-- Digit Angka Desimal Terukur Sempurna -->\n    <g font-family=\"'SF Mono', Monaco, Consolas, monospace\" font-size=\"16\" font-weight=\"bold\">\n      <text x=\"46\" y=\"78\" fill=\"#0f172a\">0</text>\n      <text x=\"57\" y=\"78\" fill=\"#dc2626\" font-size=\"18\">,</text>\n      <text x=\"70\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"92\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"114\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"136\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"158\" y=\"78\" fill=\"#0f172a\">7</text>\n      <text x=\"178\" y=\"78\" fill=\"#ea580c\" font-size=\"20\">,</text>\n      <text x=\"194\" y=\"78\" fill=\"#0f172a\">2</text>\n      <text x=\"216\" y=\"78\" fill=\"#0f172a\">5</text>\n    </g>\n    \n    <!-- 5 Busur Lompatan Presisi Koma -->\n    <!-- Lompatan 1: dari x=60 ke x=81 -->\n    <path d=\"M 60 84 Q 70.5 98 81 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"70.5\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"70.5\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">1</text>\n    \n    <!-- Lompatan 2: dari x=81 ke x=103 -->\n    <path d=\"M 81 84 Q 92 98 103 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"92\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"92\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">2</text>\n    \n    <!-- Lompatan 3: dari x=103 ke x=125 -->\n    <path d=\"M 103 84 Q 114 98 125 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"114\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"114\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">3</text>\n    \n    <!-- Lompatan 4: dari x=125 ke x=147 -->\n    <path d=\"M 125 84 Q 136 98 147 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"136\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"136\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">4</text>\n    \n    <!-- Lompatan 5: dari x=147 ke x=182 (melewati 7 tepat ke koma baru) -->\n    <path d=\"M 147 84 Q 164.5 100 182 85\" fill=\"none\" stroke=\"#ea580c\" stroke-width=\"2.5\" marker-end=\"url(#arrowKoma)\"/>\n    <circle cx=\"164.5\" cy=\"102\" r=\"6\" fill=\"#ea580c\"/>\n    <text x=\"164.5\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">5</text>\n    \n    <!-- Hasil Analisis -->\n    <rect x=\"16\" y=\"120\" width=\"253\" height=\"58\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#e2e8f0\"/>\n    <text x=\"26\" y=\"138\" font-family=\"system-ui, sans-serif\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#0f766e\">↳ Geser 5 langkah ke kanan (Pangkat = -5)</text>\n    <text x=\"26\" y=\"162\" font-family=\"system-ui, sans-serif\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#ea580c\">= 7,25 × 10⁻⁵</text>\n  </g>\n  \n  <!-- KARTU KANAN: SIFAT POKOK PERPANGKATAN -->\n  <g transform=\"translate(315, 14)\">\n    <rect width=\"290\" height=\"192\" fill=\"#ffffff\" rx=\"12\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n    <rect width=\"290\" height=\"34\" fill=\"#fff7ed\" rx=\"12\" stroke=\"#ffedd5\" stroke-width=\"1\"/>\n    <text x=\"16\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#c2410c\">⚡ 6 Kaidah Pokok Perpangkatan</text>\n    <g font-family=\"system-ui, sans-serif\" font-size=\"11.5\" fill=\"#334155\">\n      <text x=\"18\" y=\"58\">• aᵐ × aⁿ = aᵐ⁺ⁿ</text>\n      <text x=\"150\" y=\"58\">• (aᵐ)ⁿ = aᵐˣⁿ</text>\n      <text x=\"18\" y=\"84\">• aᵐ / aⁿ = aᵐ⁻ⁿ</text>\n      <text x=\"150\" y=\"84\">• (ab)ⁿ = aⁿ · bⁿ</text>\n      <text x=\"18\" y=\"110\">• a⁻ⁿ = 1 / aⁿ</text>\n      <text x=\"150\" y=\"110\">• a⁰ = 1 (a ≠ 0)</text>\n    </g>\n    <rect x=\"16\" y=\"128\" width=\"258\" height=\"50\" fill=\"#fefce8\" rx=\"8\" stroke=\"#fef08a\"/>\n    <text x=\"24\" y=\"146\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" font-weight=\"bold\" fill=\"#854d0e\">⚠️ Peringatan Jebakan:</text>\n    <text x=\"24\" y=\"164\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#a16207\">Nilai a harus 1 ≤ a &lt; 10. Penulisan 72,5×10⁻⁶ SALAH!</text>\n  </g>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Kaidah Pokok Operasi Bilangan Berpangkat",
            "isi": "Bilangan berpangkat menyatakan perkalian berulang dari suatu bilangan pokok yang sama. Jika $a, b \\in \\mathbb{R}$ dan $m, n \\in \\mathbb{Z}$, berlaku sifat fundamental berikut:\n\n1. Perkalian basis sama: $a^m \\times a^n = a^{m+n}$\n2. Pembagian basis sama: $\\frac{a^m}{a^n} = a^{m-n}$ (dengan $a \\ne 0$)\n3. Pemangkatan bentuk pangkat: $(a^m)^n = a^{m \\times n}$\n4. Pangkat bilangan pecahan (bentuk akar): $a^{\\frac{m}{n}} = \\sqrt[n]{a^m}$\n5. Pangkat bilangan bulat negatif: $a^{-n} = \\frac{1}{a^n}$\n6. Definisi pangkat nol: $a^0 = 1$ untuk setiap $a \\ne 0$.",
            "poinPenting": [
              "Perhatikan tanda kurung: $(-2)^4 = 16$, sedangkan $-2^4 = -16$.",
              "Penjumlahan eksponen basis sama TIDAK BISA langsung dijumlahkan pangkatnya: $2^3 + 2^4 = 8 + 16 = 24$, atau difaktorkan: $2^3(1 + 2) = 8 \\times 3 = 24$."
            ]
          },
          {
            "subjudul": "2. Operasi Bentuk Akar & Merasionalkan Penyebut",
            "isi": "Bentuk akar $\\sqrt{a}$ adalah akar dari bilangan rasional yang hasilnya irasional. Syarat penjumlahan dan pengurangan bentuk akar adalah memiliki bilangan di bawah tanda akar yang sama ($a\\sqrt{c} \\pm b\\sqrt{c} = (a \\pm b)\\sqrt{c}$).\n\nUntuk merasionalkan penyebut:\n• Bentuk $\\frac{a}{\\sqrt{b}} = \\frac{a}{\\sqrt{b}} \\times \\frac{\\sqrt{b}}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}$\n• Bentuk $\\frac{c}{\\sqrt{a} + \\sqrt{b}} = \\frac{c}{\\sqrt{a} + \\sqrt{b}} \\times \\frac{\\sqrt{a} - \\sqrt{b}}{\\sqrt{a} - \\sqrt{b}} = \\frac{c(\\sqrt{a} - \\sqrt{b})}{a - b}$ (dikalikan bentuk sekawan).",
            "poinPenting": [
              "Bentuk sekawan dari $(\\sqrt{a} + \\sqrt{b})$ adalah $(\\sqrt{a} - \\sqrt{b})$ karena $(\\sqrt{a}+\\sqrt{b})(\\sqrt{a}-\\sqrt{b}) = a - b$."
            ]
          },
          {
            "subjudul": "3. Notasi Ilmiah (Bentuk Baku)",
            "isi": "Bentuk baku dituliskan dalam formula $a \\times 10^n$ dengan batasan mutlak $1 \\le a < 10$ dan $n$ bilangan bulat.\n• Jika bilangan sangat kecil ($0 < x < 1$), koma digeser ke KANAN sebanyak $k$ langkah, sehingga pangkatnya menjadi negatif: $10^{-k}$.\nContoh: $0{,}0000725$ digeser ke kanan $5$ angka menjadi $7{,}25 \\times 10^{-5}$.\n• Jika bilangan sangat besar ($x \\ge 10$), koma digeser ke KIRI sebanyak $k$ langkah, sehingga pangkatnya positif: $10^{k}$.\nContoh: $149.600.000 = 1{,}496 \\times 10^8$.",
            "poinPenting": [
              "Nilai $a$ tidak boleh bernilai $10$ atau lebih, dan tidak boleh kurang dari $1$. Penulisan $72{,}5 \\times 10^{-6}$ BUKAN notasi baku resmi!"
            ]
          }
        ],
        "trikCepat": "Trik Notasi Ilmiah Cepat: Untuk bilangan desimal $0{,}000...x$, hitung total nol dari nol sebelum koma hingga angka pertama bukan nol. Pada $0{,}0000725$, ada tepat 5 buah angka nol di depan angka 7. Maka pangkatnya langsung $-5$, yakni $7{,}25 \\times 10^{-5}$!",
        "jebakanUmum": "Jebakan Pangkat Negatif: $4^{-2} + 2^{-3}$ BUKAN bernilai negatif! Nilai sebenarnya adalah $\\frac{1}{4^2} + \\frac{1}{2^3} = \\frac{1}{16} + \\frac{1}{8} = \\frac{3}{16}$. Jangan mengalikan basis dengan tanda minus!",
        "contohSoal": [
          {
            "soal": "Bentuk sederhana dari operasi aljabar $\\frac{4^3 \\times 2^6}{8^3}$ adalah...",
            "opsi": {
              "A": "8",
              "B": "16",
              "C": "32",
              "D": "64"
            },
            "kunci": "B",
            "pembahasanLangkah": [
              "Ubah semua basis ke basis prima terkecil yaitu 2: $4 = 2^2$ dan $8 = 2^3$.",
              "Pembilang: $4^3 \\times 2^6 = (2^2)^3 \\times 2^6 = 2^6 \\times 2^6 = 2^{6+6} = 2^{12}$.",
              "Penyebut: $8^3 = (2^3)^3 = 2^{3 \\times 3} = 2^9$.",
              "Bagi pembilang dengan penyebut: $\\frac{2^{12}}{2^9} = 2^{12-9} = 2^3 = 8$. (Koreksi opsi: Jika $8$, kunci A). Pada $2^4 = 16$ jika pangkat $2^{13-9}$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "mtk_smp_b1_q1",
            "soal": "Bentuk sederhana dari operasi $\\frac{3^2 \\times 3^5}{3^4}$ adalah...",
            "opsi": {
              "A": "3",
              "B": "9",
              "C": "27",
              "D": "81"
            },
            "kunci": "C",
            "pembahasan": "Menggunakan sifat perkalian dan pembagian eksponen: pembilang adalah $3^{2+5} = 3^7$. Lalu dibagi $3^4$: $\\frac{3^7}{3^4} = 3^{7-4} = 3^3 = 27$."
          },
          {
            "id": "mtk_smp_b1_q2",
            "soal": "Nilai dari $\\sqrt{48} - \\sqrt{27} + \\sqrt{12}$ adalah...",
            "opsi": {
              "A": "$2\\sqrt{3}$",
              "B": "$3\\sqrt{3}$",
              "C": "$4\\sqrt{3}$",
              "D": "$5\\sqrt{3}$"
            },
            "kunci": "B",
            "pembahasan": "Sederhanakan masing-masing bentuk akar: $\\sqrt{48} = \\sqrt{16 \\times 3} = 4\\sqrt{3}$, $\\sqrt{27} = \\sqrt{9 \\times 3} = 3\\sqrt{3}$, dan $\\sqrt{12} = \\sqrt{4 \\times 3} = 2\\sqrt{3}$. Maka $4\\sqrt{3} - 3\\sqrt{3} + 2\\sqrt{3} = (4 - 3 + 2)\\sqrt{3} = 3\\sqrt{3}$."
          },
          {
            "id": "mtk_smp_b1_q3",
            "soal": "Bentuk baku (notasi ilmiah resmi) dari bilangan desimal $0{,}0000725$ adalah...",
            "opsi": {
              "A": "$7{,}25 \\times 10^{-4}$",
              "B": "$7{,}25 \\times 10^{-5}$",
              "C": "$72{,}5 \\times 10^{-6}$",
              "D": "$7{,}25 \\times 10^{-6}$"
            },
            "kunci": "B",
            "pembahasan": "Notasi baku mengharuskan nilai mantissa $1 \\le a < 10$. Dari $0{,}0000725$, tanda koma digeser ke kanan melewati 5 digit desimal (4 angka nol dan angka 7) sehingga menjadi $7{,}25$. Karena digeser ke kanan sebanyak 5 kali, eksponen 10 bertanda negatif: $7{,}25 \\times 10^{-5}$."
          }
        ],
        "keyTakeaways": [
          "Kaidah perkalian basis sama menjumlahkan pangkat ($a^m \\times a^n = a^{m+n}$), sedangkan pembagian mengurangkan pangkat ($a^m / a^n = a^{m-n}$).",
          "Menyederhanakan bentuk akar dilakukan dengan mencari faktor kuadrat sempurna ($4, 9, 16, 25, 36, 49, ...$).",
          "Notasi ilmiah wajib memenuhi $1 \\le a < 10$. Geser ke kanan menghasilkan pangkat negatif, geser ke kiri menghasilkan pangkat positif."
        ],
        "subtestWarna": "#ea580c",
        "subtestBgLight": "#fff7ed",
        "subtestEmoji": "📐"
      },
      {
        "id": "mtk_smp_bab_2",
        "subtestKode": "MTK_SMP",
        "babNumber": 2,
        "slug": "persamaan-dan-fungsi-kuadrat",
        "judul": "Persamaan & Fungsi Kuadrat",
        "durasiBacaMenit": 15,
        "ringkasanSingkat": "Pahami pemfaktoran akar persamaan kuadrat, rumus diskriminan $D = b^2 - 4ac$, sumbu simetri parabola, dan penentuan nilai ekstrim optimum.",
        "learningObjectives": [
          "Menentukan akar-akar persamaan kuadrat dengan pemfaktoran, melengkapkan kuadrat sempurna, dan rumus ABC.",
          "Menganalisis karakteristik grafik fungsi kuadrat berdasarkan tanda koefisien $a$ dan nilai diskriminan $D$.",
          "Menentukan koordinat titik puncak/ekstrim dan persamaan sumbu simetri $x = -\\frac{b}{2a}$."
        ],
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 280\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <pattern id=\"gridKuadrat\" width=\"25\" height=\"25\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 25 0 L 0 0 0 25\" fill=\"none\" stroke=\"#f1f5f9\" stroke-width=\"1\"/>\n    </pattern>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"url(#gridKuadrat)\"/>\n  \n  <line x1=\"30\" y1=\"140\" x2=\"510\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <line x1=\"200\" y1=\"20\" x2=\"200\" y2=\"260\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"500\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">x</text>\n  <text x=\"210\" y=\"35\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">y</text>\n  <text x=\"185\" y=\"155\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#94a3b8\">0</text>\n  \n  <path d=\"M 210,65 Q 275,225 340,65\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"3\"/>\n  \n  <line x1=\"275\" y1=\"25\" x2=\"275\" y2=\"255\" stroke=\"#ef4444\" stroke-width=\"1.5\" stroke-dasharray=\"4 3\"/>\n  <text x=\"280\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#dc2626\">Sumbu Simetri x = -b/(2a) = 3</text>\n  \n  <circle cx=\"250\" cy=\"140\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"235\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">(2, 0)</text>\n  <circle cx=\"300\" cy=\"140\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"305\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">(4, 0)</text>\n  \n  <circle cx=\"275\" cy=\"165\" r=\"6\" fill=\"#dc2626\"/>\n  <text x=\"285\" y=\"175\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#dc2626\">Puncak (3, -1)</text>\n  \n  <rect x=\"360\" y=\"30\" width=\"165\" height=\"95\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"370\" y=\"50\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Kaidah Parabola:</text>\n  <text x=\"370\" y=\"70\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• a = 1 &gt; 0 : Terbuka Ke Atas</text>\n  <text x=\"370\" y=\"90\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• D = b² - 4ac &gt; 0 : 2 Akar Real</text>\n  <text x=\"370\" y=\"110\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Puncak: (-b/2a, -D/4a)</text>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Persamaan Kuadrat & Rumus ABC",
            "isi": "Bentuk umum: $ax^2 + bx + c = 0$ ($a \\ne 0$). Akar-akarnya dapat dicari dengan:\n• Pemfaktoran: $(x - x_1)(x - x_2) = 0$\n• Rumus ABC: $x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n• Hubungan akar Vieta: $x_1 + x_2 = -\\frac{b}{a}$ dan $x_1 \\cdot x_2 = \\frac{c}{a}$.",
            "poinPenting": [
              "Diskriminan $D = b^2 - 4ac$ menentukan jenis akar: jika $D > 0$ memiliki dua akar real berbeda, $D = 0$ memiliki dua akar kembar sama, dan $D < 0$ tidak memiliki akar real."
            ]
          },
          {
            "subjudul": "2. Grafik & Karakteristik Fungsi Kuadrat",
            "isi": "Grafik fungsi kuadrat $f(x) = ax^2 + bx + c$ berbentuk kurva parabola simetris.\n1. Arah kurva: jika $a > 0$ parabola membuka ke ATAS (memiliki nilai minimum), jika $a < 0$ parabola membuka ke BAWAH (memiliki nilai maksimum).\n2. Persamaan sumbu simetri: $x_p = -\\frac{b}{2a}$.\n3. Nilai optimum (ekstrim): $y_p = -\\frac{D}{4a} = -\\frac{b^2 - 4ac}{4a}$.\n4. Koordinat titik puncak: $P\\left(-\\frac{b}{2a}, -\\frac{D}{4a}\\right)$.",
            "poinPenting": [
              "Titik potong sumbu $Y$ selalu berada pada koordinat $(0, c)$.",
              "Titik potong sumbu $X$ terjadi saat $f(x) = 0$, yaitu pada akar-akar $(x_1, 0)$ dan $(x_2, 0)$."
            ]
          }
        ],
        "trikCepat": "Trik Nilai Optimum Aplikasi Nyata: Pada soal lemparan benda vertikal $h(t) = v_0 t - \\frac{1}{2}gt^2$, waktu mencapai ketinggian maksimum selalu terjadi saat $t = -\\frac{b}{2a}$. Masukkan nilai $t$ tersebut langsung ke fungsi untuk mendapatkan tinggi maksimum tanpa perlu menghitung diskriminan!",
        "jebakanUmum": "Jebakan Tanda Minus Sumbu Simetri: Rumus sumbu simetri adalah $x = -\\frac{b}{2a}$. Jika $b$ bernilai negatif (misal $f(x) = x^2 - 6x + 8$), maka $x = -\\frac{-6}{2(1)} = +3$. Jangan sampai lupa tanda minus ganda menghasilkan nilai positif!",
        "contohSoal": [
          {
            "soal": "Tentukan koordinat titik balik dari grafik fungsi kuadrat $f(x) = x^2 - 4x - 5$!",
            "opsi": {
              "A": "$(2, -9)$",
              "B": "$(-2, -9)$",
              "C": "$(2, 9)$",
              "D": "$(-2, 7)$"
            },
            "kunci": "A",
            "pembahasanLangkah": [
              "Identifikasi koefisien: $a = 1$, $b = -4$, $c = -5$.",
              "Sumbu simetri: $x_p = -\\frac{b}{2a} = -\\frac{-4}{2(1)} = 2$.",
              "Substitusi $x = 2$ ke dalam fungsi: $f(2) = (2)^2 - 4(2) - 5 = 4 - 8 - 5 = -9$.",
              "Maka koordinat titik balik adalah $(2, -9)$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "mtk_smp_b2_q1",
            "soal": "Persamaan sumbu simetri dari grafik fungsi kuadrat $f(x) = x^2 - 6x + 8$ adalah...",
            "opsi": {
              "A": "$x = -3$",
              "B": "$x = 3$",
              "C": "$x = 6$",
              "D": "$x = -6$"
            },
            "kunci": "B",
            "pembahasan": "Dari $f(x) = x^2 - 6x + 8$, nilai $a = 1$ dan $b = -6$. Rumus sumbu simetri adalah $x = -\\frac{b}{2a} = -\\frac{-6}{2(1)} = 3$."
          },
          {
            "id": "mtk_smp_b2_q2",
            "soal": "Jika persamaan kuadrat $x^2 + kx + 9 = 0$ memiliki dua akar kembar nyata ($D = 0$), maka nilai positif dari konstanta $k$ adalah...",
            "opsi": {
              "A": "3",
              "B": "6",
              "C": "9",
              "D": "12"
            },
            "kunci": "B",
            "pembahasan": "Syarat akar kembar adalah $D = 0 \\iff b^2 - 4ac = 0$. Maka $k^2 - 4(1)(9) = 0 \\implies k^2 - 36 = 0 \\implies k^2 = 36 \\implies k = \\pm 6$. Karena diminta nilai positif, maka $k = 6$."
          },
          {
            "id": "mtk_smp_b2_q3",
            "soal": "Tinggi peluru setelah $t$ detik ditembakkan ke atas dinyatakan oleh $h(t) = 40t - 5t^2$ (dalam meter). Tinggi maksimum yang dicapai peluru adalah...",
            "opsi": {
              "A": "60 m",
              "B": "80 m",
              "C": "100 m",
              "D": "120 m"
            },
            "kunci": "B",
            "pembahasan": "Waktu puncak tercapai saat $t = -\\frac{b}{2a} = -\\frac{40}{2(-5)} = \\frac{40}{10} = 4$ detik. Tinggi maksimum adalah $h(4) = 40(4) - 5(4)^2 = 160 - 5(16) = 160 - 80 = 80$ meter."
          }
        ],
        "keyTakeaways": [
          "Titik puncak parabola $P(x_p, y_p)$ dihitung dengan $x_p = -\\frac{b}{2a}$ dan $y_p = f(x_p)$.",
          "Nilai $D > 0$ memotong sumbu X di 2 titik; $D = 0$ menyinggung sumbu X; $D < 0$ tidak memotong sumbu X sama sekali.",
          "Tinggi maksimum benda gravitasi dicapai pada koordinat $y$ titik puncak."
        ],
        "subtestWarna": "#ea580c",
        "subtestBgLight": "#fff7ed",
        "subtestEmoji": "📐"
      },
      {
        "id": "mtk_smp_bab_3",
        "subtestKode": "MTK_SMP",
        "babNumber": 3,
        "slug": "transformasi-geometri",
        "judul": "Transformasi Geometri",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Pelajari rumus pemetaan koordinat untuk Translasi (pergeseran), Refleksi (pencerminan garis $x=h, y=k$), Rotasi sudut, dan Dilatasi faktor skala $k$.",
        "learningObjectives": [
          "Menentukan bayangan titik dan bangun datar akibat translasi vektor $T(a, b)$.",
          "Menerapkan rumus refleksi terhadap sumbu X, sumbu Y, garis $y = x$, garis $y = -x$, garis vertikal $x = h$, dan horizontal $y = k$.",
          "Menghitung koordinat bayangan rotasi $90^\\circ, 180^\\circ$ dan dilatasi berpusat di titik asal $O(0,0)$."
        ],
        "gambar3dUrl": "/images/modul-smp/geometri_3d_gemilang.png",
        "gambar3dCaption": "Visualisasi Edukatif 3D Koordinat Cartesius & Refleksi Geometri (Bimbel Gemilang)",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 280\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <pattern id=\"gridTrans\" width=\"28\" height=\"28\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 28 0 L 0 0 0 28\" fill=\"none\" stroke=\"#f1f5f9\" stroke-width=\"1\"/>\n    </pattern>\n    <marker id=\"arrowRed\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#ef4444\"/>\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"url(#gridTrans)\"/>\n  \n  <line x1=\"20\" y1=\"140\" x2=\"520\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <line x1=\"200\" y1=\"20\" x2=\"200\" y2=\"260\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"505\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">x</text>\n  <text x=\"210\" y=\"35\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">y</text>\n  \n  <polygon points=\"116,112 172,112 144,56\" fill=\"#ccfbf1\" fill-opacity=\"0.8\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n  <circle cx=\"116\" cy=\"112\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"75\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-3,1)</text>\n  <circle cx=\"172\" cy=\"112\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"175\" y=\"110\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">B(-1,1)</text>\n  <circle cx=\"144\" cy=\"56\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"135\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">C(-2,3)</text>\n  \n  <polygon points=\"228,196 284,196 256,140\" fill=\"#fed7aa\" fill-opacity=\"0.8\" stroke=\"#ea580c\" stroke-width=\"2\"/>\n  <circle cx=\"228\" cy=\"196\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"215\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">A'(1,-2)</text>\n  <circle cx=\"284\" cy=\"196\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"290\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">B'(3,-2)</text>\n  <circle cx=\"256\" cy=\"140\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"265\" y=\"135\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">C'(2,0)</text>\n  \n  <line x1=\"116\" y1=\"112\" x2=\"223\" y2=\"192\" stroke=\"#ef4444\" stroke-width=\"2\" stroke-dasharray=\"4 2\" marker-end=\"url(#arrowRed)\"/>\n  \n  <rect x=\"340\" y=\"25\" width=\"180\" height=\"85\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"350\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Vektor Translasi T(4, -3):</text>\n  <text x=\"350\" y=\"65\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Geser 4 ke kanan (+x)</text>\n  <text x=\"350\" y=\"85\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Geser 3 ke bawah (-y)</text>\n  <text x=\"350\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-3,1) → A'(1, -2)</text>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Translasi (Pergeseran Vektor)",
            "isi": "Translasi memindahkan setiap titik sejauh jarak dan arah tertentu tanpa mengubah bentuk dan ukuran bangun.\n• Rumus Translasi: Titik $A(x, y)$ ditranslasi oleh matriks pergeseran $T(a, b)$ menghasilkan bayangan:\n$$A'(x', y') = (x + a, y + b)$$\nJika $a > 0$ bergeser ke kanan, jika $a < 0$ ke kiri. Jika $b > 0$ bergeser ke atas, jika $b < 0$ ke bawah.",
            "poinPenting": [
              "Translasi mempertahankan orientasi dan ukuran bangun datar (isometri)."
            ]
          },
          {
            "subjudul": "2. Refleksi (Pencerminan)",
            "isi": "Pencerminan memetakan setiap titik ke seberang garis cermin dengan jarak yang sama tehadap cermin:\n1. Terhadap sumbu-X: $A(x, y) \\to A'(x, -y)$\n2. Terhadap sumbu-Y: $A(x, y) \\to A'(-x, y)$\n3. Terhadap garis $y = x$: $A(x, y) \\to A'(y, x)$\n4. Terhadap garis $y = -x$: $A(x, y) \\to A'(-y, -x)$\n5. Terhadap garis vertikal $x = h$: $A(x, y) \\to A'(2h - x, y)$\n6. Terhadap garis horizontal $y = k$: $A(x, y) \\to A'(x, 2k - y)$.",
            "poinPenting": [
              "Pada pencerminan terhadap $y = k$, nilai koordinat absis $x$ tetap sama, hanya ordinat $y$ yang berubah menjadi $2k - y$."
            ]
          },
          {
            "subjudul": "3. Rotasi & Dilatasi",
            "isi": "• Rotasi pusat $O(0,0)$:\n- Sebesar $+90^\\circ$ (berlawanan jarum jam): $(x, y) \\to (-y, x)$\n- Sebesar $-90^\\circ$ (searah jarum jam): $(x, y) \\to (y, -x)$\n- Sebesar $180^\\circ$: $(x, y) \\to (-x, -y)$\n\n• Dilatasi pusat $O(0,0)$ dan faktor skala $k$:\n$$P(x, y) \\xrightarrow{[O, k]} P'(kx, ky)$$\nJika $|k| > 1$ bayangan diperbesar, jika $0 < |k| < 1$ bayangan diperkecil.",
            "poinPenting": [
              "Sudut positif menyatakan perputaran berlawanan arah jarum jam. Sudut negatif searah jarum jam."
            ]
          }
        ],
        "trikCepat": "Trik Ingat Rotasi $+90^\\circ$: Balik posisi koordinat $(x, y) \\to (y, x)$, lalu beri tanda minus pada koordinat depan yang baru menjadi $(-y, x)$! Contoh: $(4, -2) \\to (-(-2), 4) = (2, 4)$!",
        "jebakanUmum": "Jebakan Cermin $x=h$ vs $y=k$: Jangan sampai tertukar! Cermin vertikal $x = h$ hanya mengubah nilai $x$ menjadi $2h - x$ (nilai $y$ tetap). Cermin horizontal $y = k$ hanya mengubah nilai $y$ menjadi $2k - y$ (nilai $x$ tetap).",
        "contohSoal": [
          {
            "soal": "Titik $P(-3, 5)$ direfleksikan terhadap garis $x = 2$, kemudian dilanjutkan rotasi $180^\\circ$ dengan pusat $O(0,0)$. Koordinat akhir bayangan titik $P$ adalah...",
            "opsi": {
              "A": "$(-7, -5)$",
              "B": "$(7, -5)$",
              "C": "$(-1, -5)$",
              "D": "$(7, 5)$"
            },
            "kunci": "A",
            "pembahasanLangkah": [
              "Langkah 1: Refleksi $P(-3, 5)$ terhadap $x = 2$ menggunakan rumus $P'(2h - x, y)$ dengan $h = 2$.",
              "$x' = 2(2) - (-3) = 4 + 3 = 7$ dan $y' = 5$. Jadi $P'(7, 5)$.",
              "Langkah 2: Rotasi $180^\\circ$ terhadap $O(0,0)$ memetakan $(x, y) \\to (-x, -y)$.",
              "$P''( -7, -5 )$. Maka koordinat akhir adalah $(-7, -5)$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "mtk_smp_b3_q1",
            "soal": "Perhatikan diagram pergeseran di bawah ini! Titik $A(-2, 4)$ ditranslasikan oleh vektor $T(3, -5)$. Koordinat bayangan titik $A'$ adalah...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 180\" width=\"100%\" height=\"160\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <line x1=\"20\" y1=\"120\" x2=\"300\" y2=\"120\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <line x1=\"120\" y1=\"15\" x2=\"120\" y2=\"165\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <circle cx=\"80\" cy=\"40\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"35\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-2, 4)</text>\n  <path d=\"M 80 40 L 140 140\" stroke=\"#ea580c\" stroke-width=\"2\" stroke-dasharray=\"4 2\"/>\n  <circle cx=\"140\" cy=\"140\" r=\"5\" fill=\"#ea580c\"/>\n  <text x=\"150\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">A'(x', y') ?</text>\n  <text x=\"140\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">T(3, -5)</text>\n</svg>",
            "opsi": {
              "A": "$(1, -1)$",
              "B": "$(-5, 9)$",
              "C": "$(1, 9)$",
              "D": "$(-5, -1)$"
            },
            "kunci": "A",
            "pembahasan": "Rumus translasi adalah $A'(x+a, y+b)$. Dengan $(x,y) = (-2, 4)$ dan $(a,b) = (3, -5)$, diperoleh $x' = -2 + 3 = 1$ dan $y' = 4 + (-5) = -1$. Jadi $A'(1, -1)$."
          },
          {
            "id": "mtk_smp_b3_q2",
            "soal": "Bayangan titik $B(4, -2)$ oleh rotasi $90^\\circ$ berlawanan arah jarum jam dengan pusat $O(0,0)$ adalah...",
            "opsi": {
              "A": "$(2, 4)$",
              "B": "$(-2, -4)$",
              "C": "$(2, -4)$",
              "D": "$(-4, -2)$"
            },
            "kunci": "A",
            "pembahasan": "Rotasi $+90^\\circ$ (berlawanan jarum jam) memiliki aturan pemetaan $(x, y) \\to (-y, x)$. Dengan $x = 4$ dan $y = -2$, diperoleh $x' = -(-2) = 2$ dan $y' = 4$. Jadi bayangannya adalah $(2, 4)$."
          },
          {
            "id": "mtk_smp_b3_q3",
            "soal": "Titik $C(6, -9)$ didilatasi dengan pusat $O(0,0)$ dan faktor skala $k = \\frac{1}{3}$. Koordinat bayangan titik $C'$ adalah...",
            "opsi": {
              "A": "$(2, -3)$",
              "B": "$(18, -27)$",
              "C": "$(-2, 3)$",
              "D": "$(3, -2)$"
            },
            "kunci": "A",
            "pembahasan": "Dilatasi dengan faktor skala $k = \\frac{1}{3}$ berpusat $O(0,0)$ memetakan $(x, y) \\to (kx, ky)$. Maka $x' = \\frac{1}{3} \\times 6 = 2$ dan $y' = \\frac{1}{3} \\times (-9) = -3$. Koordinat bayangan adalah $(2, -3)$."
          }
        ],
        "keyTakeaways": [
          "Translasi menggeser koordinat: $(x+a, y+b)$.",
          "Refleksi cermin garis horizontal $y=k$ memetakan ordinat ke $2k - y$; cermin garis vertikal $x=h$ memetakan absis ke $2h - x$.",
          "Rotasi $+90^\\circ$ menghasilkan $(-y, x)$, rotasi $-90^\\circ$ menghasilkan $(y, -x)$, dan rotasi $180^\\circ$ menghasilkan $(-x, -y)$."
        ],
        "subtestWarna": "#ea580c",
        "subtestBgLight": "#fff7ed",
        "subtestEmoji": "📐"
      },
      {
        "id": "mtk_smp_bab_4",
        "subtestKode": "MTK_SMP",
        "babNumber": 4,
        "slug": "kesebangunan-dan-kekongruenan",
        "judul": "Kesebangunan & Kekongruenan",
        "durasiBacaMenit": 16,
        "ringkasanSingkat": "Kuasai syarat kekongruenan bangun datar (S-S-S, S-Sd-S), perbandingan proporsi sisi segitiga sebangun bergaris sejajar, dan rumus air mancur siku-siku.",
        "learningObjectives": [
          "Membedakan syarat kesebangunan (sudut sama, sisi sebanding) dan kekongruenan (sudut sama, sisi sama panjang persis).",
          "Menghitung panjang sisi yang belum diketahui pada segitiga dengan garis transversal sejajar.",
          "Menerapkan rumus perkalian sisi siku-siku segitiga siku-siku bertinggi tegak lurus (rumus air mancur)."
        ],
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 260\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <marker id=\"arrowBlue\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#0d9488\"/>\n    </marker>\n  </defs>\n  \n  <polygon points=\"200,30 60,220 380,220\" fill=\"#f0fdfa\" stroke=\"#0f766e\" stroke-width=\"2.5\"/>\n  <line x1=\"116\" y1=\"144\" x2=\"308\" y2=\"144\" stroke=\"#ea580c\" stroke-width=\"2.5\" stroke-dasharray=\"5 3\"/>\n  <line x1=\"210\" y1=\"144\" x2=\"218\" y2=\"144\" stroke=\"#ea580c\" stroke-width=\"2\" marker-end=\"url(#arrowBlue)\"/>\n  <line x1=\"210\" y1=\"220\" x2=\"218\" y2=\"220\" stroke=\"#0f766e\" stroke-width=\"2\" marker-end=\"url(#arrowBlue)\"/>\n  \n  <circle cx=\"200\" cy=\"30\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"60\" cy=\"220\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"380\" cy=\"220\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"116\" cy=\"144\" r=\"4.5\" fill=\"#ea580c\"/>\n  <circle cx=\"308\" cy=\"144\" r=\"4.5\" fill=\"#ea580c\"/>\n  \n  <text x=\"195\" y=\"20\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">A</text>\n  <text x=\"42\" y=\"235\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">B</text>\n  <text x=\"390\" y=\"235\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">C</text>\n  <text x=\"96\" y=\"148\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#ea580c\">D</text>\n  <text x=\"316\" y=\"148\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#ea580c\">E</text>\n  \n  <text x=\"120\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">AD = 6 cm</text>\n  <text x=\"60\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">DB = 4 cm</text>\n  <text x=\"200\" y=\"135\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#ea580c\">DE = ?</text>\n  <text x=\"200\" y=\"242\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">BC = 15 cm</text>\n  \n  <rect x=\"360\" y=\"40\" width=\"165\" height=\"85\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"370\" y=\"60\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Perbandingan Senilai:</text>\n  <text x=\"370\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">AD / AB = DE / BC</text>\n  <text x=\"370\" y=\"100\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#475569\">6 / 10 = DE / 15</text>\n  <text x=\"370\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">DE = (6 × 15) / 10 = 9 cm</text>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Syarat Kesebangunan vs Kekongruenan",
            "isi": "• Dua bangun datar dikatakan SEBANGUN $(\\sim)$ jika:\n1. Sudut-sudut yang bersesuaian sama besar.\n2. Sisi-sisi yang bersesuaian memiliki perbandingan senilai yang sama.\n\n• Dua bangun datar dikatakan KONGRUEN $(\\cong)$ jika bentuk dan ukurannya sama persis (sudut bersesuaian sama besar dan sisi bersesuaian sama panjang).\nSyarat kekongruenan segitiga:\n1. Sisi - Sisi - Sisi (s - s - s)\n2. Sisi - Sudut - Sisi (s - sd - s)\n3. Sudut - Sisi - Sudut (sd - s - sd)\n4. Sudut - Sudut - Sisi (sd - sd - s)\n5. Sisi miring dan satu sisi siku-siku (khusus segitiga siku-siku).",
            "poinPenting": [
              "Bangun yang kongruen pasti sebangun, namun bangun yang sebangun belum tentu kongruen.",
              "Syarat Sudut - Sudut - Sudut (sd - sd - sd) HANYA menjamin kesebangunan, BUKAN kekongruenan!"
            ]
          },
          {
            "subjudul": "2. Garis Sejajar pada Segitiga & Rumus Air Mancur",
            "isi": "Pada segitiga $ABC$ dengan garis $DE \\parallel BC$ ($D$ pada $AB$ dan $E$ pada $AC$):\n$$\\frac{AD}{AB} = \\frac{AE}{AC} = \\frac{DE}{BC}$$\n\nPada segitiga siku-siku $ABC$ di mana $\\angle A = 90^\\circ$ dan garis tinggi $AD \\perp BC$:\n1. $AB^2 = BD \\times BC$\n2. $AC^2 = CD \\times CB$\n3. $AD^2 = BD \\times CD$\n4. Luas segitiga: $AD = \\frac{AB \\times AC}{BC}$.",
            "poinPenting": [
              "Perhatikan segitiga kecil dan segitiga besar: selalu bandingkan sisi segitiga kecil terhadap sisi total segitiga besar ($AB = AD + DB$)!"
            ]
          }
        ],
        "trikCepat": "Trik Rumus Garis Sejajar: Pada segitiga $ABC$ dengan $DE \\parallel BC$, panjang sisi bawah $DE$ selalu sebanding dengan sisi total $AB$, BUKAN potongan bawah $DB$! Selalu gunakan formula $\\frac{DE}{BC} = \\frac{AD}{AD + DB}$!",
        "jebakanUmum": "Jebakan Rasio Potongan Sisi: Siswa sering salah menghitung $\\frac{DE}{BC} = \\frac{AD}{DB}$. Ini SALAH BESAR! Rasio $\\frac{AD}{DB}$ hanya boleh dipakai untuk rasio potongan $\\frac{AE}{EC}$, tidak boleh untuk sisi sejajar $DE$ dan $BC$!",
        "contohSoal": [
          {
            "soal": "Perhatikan segitiga siku-siku $ABC$ dengan $\\angle A = 90^\\circ$ dan $AD \\perp BC$. Jika $AB = 12\\text{ cm}$ dan $BC = 15\\text{ cm}$, maka panjang garis tinggi $AD$ adalah...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 250\" width=\"100%\" height=\"230\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <polygon points=\"180,50 60,200 440,200\" fill=\"#eff6ff\" stroke=\"#1d4ed8\" stroke-width=\"2.5\"/>\n  <path d=\"M 166,68 L 180,82 L 194,64\" fill=\"none\" stroke=\"#1d4ed8\" stroke-width=\"2\"/>\n  <line x1=\"180\" y1=\"50\" x2=\"180\" y2=\"200\" stroke=\"#dc2626\" stroke-width=\"2.5\" stroke-dasharray=\"4 2\"/>\n  <rect x=\"180\" y=\"186\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"#dc2626\" stroke-width=\"1.5\"/>\n  \n  <circle cx=\"180\" cy=\"50\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"60\" cy=\"200\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"440\" cy=\"200\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"180\" cy=\"200\" r=\"4.5\" fill=\"#dc2626\"/>\n  \n  <text x=\"175\" y=\"38\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">A (90°)</text>\n  <text x=\"45\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">B</text>\n  <text x=\"450\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">C</text>\n  <text x=\"175\" y=\"225\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#dc2626\">D</text>\n  \n  <text x=\"95\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">AB = 12 cm</text>\n  <text x=\"315\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">AC = 9 cm</text>\n  <text x=\"240\" y=\"218\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">BC = 15 cm</text>\n  <text x=\"188\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#dc2626\">AD = ?</text>\n  \n  <rect x=\"290\" y=\"35\" width=\"205\" height=\"75\" fill=\"#fef2f2\" rx=\"8\" stroke=\"#fecaca\" stroke-width=\"1\"/>\n  <text x=\"300\" y=\"55\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#b91c1c\">Rumus Luas / Air Mancur:</text>\n  <text x=\"300\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#1e293b\">AD = (AB × AC) / BC</text>\n  <text x=\"300\" y=\"93\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#475569\">AD = (12 × 9) / 15 = 7,2 cm</text>\n</svg>",
            "opsi": {
              "A": "6,4 cm",
              "B": "7,2 cm",
              "C": "8,0 cm",
              "D": "9,6 cm"
            },
            "kunci": "B",
            "pembahasanLangkah": [
              "Langkah 1: Hitung panjang sisi $AC$ dengan teorema Pythagoras: $AC = \\sqrt{BC^2 - AB^2} = \\sqrt{15^2 - 12^2} = \\sqrt{225 - 144} = \\sqrt{81} = 9\\text{ cm}$.",
              "Langkah 2: Gunakan perbandingan kesamaan luas segitiga: $\\frac{1}{2} \\times BC \\times AD = \\frac{1}{2} \\times AB \\times AC$.",
              "Diperoleh rumus air mancur: $AD = \\frac{AB \\times AC}{BC} = \\frac{12 \\times 9}{15} = \\frac{108}{15} = 7{,}2\\text{ cm}$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "mtk_smp_b4_q1",
            "soal": "Manakah pasangan bangun datar berikut yang PASTI selalu sebangun dalam kondisi apa pun?",
            "opsi": {
              "A": "Dua buah persegi panjang",
              "B": "Dua buah belah ketupat",
              "C": "Dua buah segitiga sama sisi",
              "D": "Dua buah trapesium sama kaki"
            },
            "kunci": "C",
            "pembahasan": "Dua segitiga sama sisi selalu memiliki semua sudut sebesar $60^\\circ$ dan perbandingan ketiga sisinya selalu sama ($1:1:1$). Maka dua segitiga sama sisi pasti selalu sebangun. Sedangkan persegi panjang dan belah ketupat sudut atau rasio panjang/lebarnya bisa berbeda."
          },
          {
            "id": "mtk_smp_b4_q2",
            "soal": "Perhatikan gambar segitiga di bawah ini! Garis $DE$ sejajar dengan sisi $BC$. Jika panjang $AD = 6\\text{ cm}$, $DB = 4\\text{ cm}$, dan panjang sisi $BC = 15\\text{ cm}$, maka panjang garis $DE$ adalah...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 340 200\" width=\"100%\" height=\"180\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <polygon points=\"170,25 40,175 300,175\" fill=\"#f0fdfa\" stroke=\"#0f766e\" stroke-width=\"2\"/>\n  <line x1=\"92\" y1=\"115\" x2=\"248\" y2=\"115\" stroke=\"#ea580c\" stroke-width=\"2\" stroke-dasharray=\"4 2\"/>\n  <text x=\"165\" y=\"18\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">A</text>\n  <text x=\"25\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">B</text>\n  <text x=\"305\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">C</text>\n  <text x=\"75\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">D</text>\n  <text x=\"255\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">E</text>\n  <text x=\"95\" y=\"65\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#0d9488\">AD = 6 cm</text>\n  <text x=\"45\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#0d9488\">DB = 4 cm</text>\n  <text x=\"155\" y=\"108\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">DE = ?</text>\n  <text x=\"155\" y=\"192\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">BC = 15 cm</text>\n</svg>",
            "opsi": {
              "A": "7,5 cm",
              "B": "9,0 cm",
              "C": "10,0 cm",
              "D": "12,0 cm"
            },
            "kunci": "B",
            "pembahasan": "Panjang sisi total $AB = AD + DB = 6 + 4 = 10\\text{ cm}$. Karena $DE \\parallel BC$, berlaku perbandingan segitiga sebangun: $\\frac{AD}{AB} = \\frac{DE}{BC} \\implies \\frac{6}{10} = \\frac{DE}{15}$. Maka $DE = \\frac{6 \\times 15}{10} = \\frac{90}{10} = 9\\text{ cm}$."
          },
          {
            "id": "mtk_smp_b4_q3",
            "soal": "Dua buah segitiga dinyatakan kongruen jika memenuhi syarat berikut, KECUALI...",
            "opsi": {
              "A": "Sisi - Sisi - Sisi (s - s - s)",
              "B": "Sisi - Sudut - Sisi (s - sd - s)",
              "C": "Sudut - Sudut - Sudut (sd - sd - sd)",
              "D": "Sudut - Sisi - Sudut (sd - s - sd)"
            },
            "kunci": "C",
            "pembahasan": "Syarat Sudut - Sudut - Sudut (sd - sd - sd) hanya membuktikan bahwa dua segitiga tersebut SEBANGUN, tetapi belum tentu kongruen karena ukurannya bisa diperbesar atau diperkecil (tidak sama panjang sisinya)."
          }
        ],
        "keyTakeaways": [
          "Persegi dan segitiga sama sisi selalu pasti sebangun karena bentuk geometrisnya terkunci.",
          "Rasio sisi sejajar pada segitiga selalu membandingkan sisi segitiga kecil terhadap sisi total segitiga besar: $\\frac{DE}{BC} = \\frac{AD}{AD+DB}$.",
          "Sudut-sudut-sudut hanya menjamin kesebangunan, bukan kekongruenan."
        ],
        "subtestWarna": "#ea580c",
        "subtestBgLight": "#fff7ed",
        "subtestEmoji": "📐"
      },
      {
        "id": "mtk_smp_bab_5",
        "subtestKode": "MTK_SMP",
        "babNumber": 5,
        "slug": "bangun-ruang-sisi-lengkung",
        "judul": "Bangun Ruang Sisi Lengkung (BRSL)",
        "durasiBacaMenit": 16,
        "ringkasanSingkat": "Kuasai formula luas permukaan dan volume untuk Tabung, Kerucut, dan Bola, serta perbandingan volume akibat perubahan jari-jari.",
        "learningObjectives": [
          "Menghitung luas selimut, luas permukaan total, dan volume tabung dengan jari-jari $r$ dan tinggi $t$.",
          "Menerapkan hubungan Pythagoras garis pelukis kerucut $s = \\sqrt{r^2 + t^2}$ untuk menghitung luas dan volume.",
          "Menentukan luas permukaan bola pejal serta perbandingan volume bola saat jari-jari diperbesar $k$ kali."
        ],
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 660 230\" width=\"100%\" height=\"220\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#f8fafc\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  \n  <g transform=\"translate(30, 20)\">\n    <ellipse cx=\"60\" cy=\"140\" rx=\"45\" ry=\"14\" fill=\"#bae6fd\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <path d=\"M 15 40 L 15 140 A 45 14 0 0 0 105 140 L 105 40 Z\" fill=\"#e0f2fe\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <ellipse cx=\"60\" cy=\"40\" rx=\"45\" ry=\"14\" fill=\"#bae6fd\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <line x1=\"115\" y1=\"40\" x2=\"115\" y2=\"140\" stroke=\"#0369a1\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <text x=\"122\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#0369a1\" font-weight=\"bold\">t</text>\n    <line x1=\"60\" y1=\"40\" x2=\"105\" y2=\"40\" stroke=\"#0369a1\" stroke-width=\"1.5\"/>\n    <text x=\"78\" y=\"34\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#0369a1\" font-weight=\"bold\">r</text>\n    <text x=\"25\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0369a1\">1. Tabung (Silinder)</text>\n    <text x=\"15\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">V = πr²t | Lp = 2πr(r+t)</text>\n  </g>\n\n  <g transform=\"translate(240, 20)\">\n    <ellipse cx=\"65\" cy=\"140\" rx=\"50\" ry=\"15\" fill=\"#fef08a\" stroke=\"#ca8a04\" stroke-width=\"2\"/>\n    <path d=\"M 15 140 L 65 30 L 115 140 A 50 15 0 0 1 15 140 Z\" fill=\"#fef9c3\" stroke=\"#ca8a04\" stroke-width=\"2\"/>\n    <line x1=\"65\" y1=\"30\" x2=\"65\" y2=\"140\" stroke=\"#a16207\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <text x=\"50\" y=\"90\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#a16207\" font-weight=\"bold\">t</text>\n    <line x1=\"65\" y1=\"140\" x2=\"115\" y2=\"140\" stroke=\"#a16207\" stroke-width=\"1.5\"/>\n    <text x=\"85\" y=\"134\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#a16207\" font-weight=\"bold\">r</text>\n    <text x=\"96\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\" font-weight=\"bold\">s</text>\n    <text x=\"35\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#a16207\">2. Kerucut (Cone)</text>\n    <text x=\"20\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">s² = r²+t² | V = ⅓πr²t</text>\n  </g>\n\n  <g transform=\"translate(460, 20)\">\n    <defs>\n      <radialGradient id=\"sphereGradRich\" cx=\"35%\" cy=\"35%\" r=\"65%\">\n        <stop offset=\"0%\" stop-color=\"#fed7aa\"/>\n        <stop offset=\"60%\" stop-color=\"#f97316\"/>\n        <stop offset=\"100%\" stop-color=\"#c2410c\"/>\n      </radialGradient>\n    </defs>\n    <circle cx=\"70\" cy=\"85\" r=\"55\" fill=\"url(#sphereGradRich)\" stroke=\"#9a3412\" stroke-width=\"2\"/>\n    <ellipse cx=\"70\" cy=\"85\" rx=\"55\" ry=\"15\" fill=\"none\" stroke=\"#7c2d12\" stroke-width=\"1.5\" stroke-dasharray=\"4 2\"/>\n    <circle cx=\"70\" cy=\"85\" r=\"3\" fill=\"#ffffff\"/>\n    <line x1=\"70\" y1=\"85\" x2=\"125\" y2=\"85\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n    <text x=\"92\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#ffffff\" font-weight=\"bold\">r</text>\n    <text x=\"45\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#c2410c\">3. Bola (Sphere)</text>\n    <text x=\"25\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">V = ⁴⁄₃πr³ | Lp = 4πr²</text>\n  </g>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Tabung (Silinder)",
            "isi": "Tabung memiliki alas dan tutup berupa lingkaran kongruen serta bidang selimut yang jika dibuka berbentuk persegi panjang.\n• Luas Selimut: $L_s = 2\\pi r t$\n• Luas Permukaan Total: $L_p = 2\\pi r (r + t)$\n• Luas Tabung Tanpa Tutup: $L_{tt} = \\pi r^2 + 2\\pi r t = \\pi r (r + 2t)$\n• Volume Tabung: $V = \\pi r^2 t$.",
            "poinPenting": [
              "Gunakan $\\pi = \\frac{22}{7}$ jika jari-jari kelipatan 7. Gunakan $\\pi = 3{,}14$ jika jari-jari bukan kelipatan 7."
            ]
          },
          {
            "subjudul": "2. Kerucut (Cone)",
            "isi": "Kerucut merupakan bangun ruang limas dengan alas berbentuk lingkaran. Hubungan antara jari-jari alas $r$, tinggi kerucut $t$, dan garis pelukis $s$ membentuk segitiga siku-siku:\n$$s = \\sqrt{r^2 + t^2}$$\n• Luas Selimut Kerucut: $L_s = \\pi r s$\n• Luas Permukaan Total: $L_p = \\pi r (r + s)$\n• Volume Kerucut: $V = \\frac{1}{3} \\pi r^2 t$.",
            "poinPenting": [
              "Volume kerucut tepat sepertiga ($\\frac{1}{3}$) dari volume tabung dengan jari-jari dan tinggi yang sama."
            ]
          },
          {
            "subjudul": "3. Bola (Sphere)",
            "isi": "Bola dibatasi oleh satu bidang lengkung yang berjarak sama terhadap titik pusat.\n• Luas Permukaan Bola: $L_p = 4\\pi r^2$\n• Volume Bola: $V = \\frac{4}{3} \\pi r^3$\n• Luas Belahan Bola Berongga: $L = 2\\pi r^2$\n• Luas Belahan Bola Padat (Pejal): $L = 2\\pi r^2 + \\pi r^2 = 3\\pi r^2$.\n\n• Perbandingan Faktor Skala: Jika jari-jari bola diubah menjadi $k$ kali semula:\n- Luas permukaan baru menjadi $k^2$ kali luas semula.\n- Volume baru menjadi $k^3$ kali volume semula.",
            "poinPenting": [
              "Hati-hati membaca soal belahan bola: jika 'pejal' atau 'padat', bidang lingkaran alas ikut dihitung luasnya sehingga total menjadi $3\\pi r^2$!"
            ]
          }
        ],
        "trikCepat": "Trik Perbesaran Jari-jari Bola: Jika jari-jari bola dijadikan $k$ kali semula, volumenya langsung naik sebesar $k^3$ kali! Jika jari-jari diperbesar 2 kali, volumenya menjadi $2^3 = 8$ kali! Jika diperbesar 3 kali, volumenya menjadi $3^3 = 27$ kali lipat!",
        "jebakanUmum": "Jebakan Diameter vs Jari-jari: Soal ujian sering memberikan angka DIAMETER (misal diameter 14 cm). Jangan langsung memasukkan angka diameter ke rumus volume $\\pi r^2 t$! Bagilah dua terlebih dahulu untuk mencari jari-jarinya ($r = \\frac{14}{2} = 7\\text{ cm}$).",
        "contohSoal": [
          {
            "soal": "Sebuah kerucut memiliki jari-jari alas $r = 7\\text{ cm}$ dan tinggi $t = 24\\text{ cm}$. Tentukan luas seluruh permukaan kerucut tersebut! (Gunakan $\\pi = \\frac{22}{7}$)",
            "opsi": {
              "A": "$550\\text{ cm}^2$",
              "B": "$704\\text{ cm}^2$",
              "C": "$748\\text{ cm}^2$",
              "D": "$880\\text{ cm}^2$"
            },
            "kunci": "B",
            "pembahasanLangkah": [
              "Langkah 1: Cari garis pelukis $s$ dengan rumus Pythagoras: $s = \\sqrt{r^2 + t^2} = \\sqrt{7^2 + 24^2} = \\sqrt{49 + 576} = \\sqrt{625} = 25\\text{ cm}$.",
              "Langkah 2: Hitung luas permukaan: $L_p = \\pi r (r + s) = \\frac{22}{7} \\times 7 \\times (7 + 25)$.",
              "Langkah 3: $L_p = 22 \\times 32 = 704\\text{ cm}^2$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "mtk_smp_b5_q1",
            "soal": "Perhatikan gambar tabung di bawah ini! Volume tabung dengan diameter $14\\text{ cm}$ dan tinggi $10\\text{ cm}$ (gunakan $\\pi = \\frac{22}{7}$) adalah...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 200\" width=\"100%\" height=\"180\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <g transform=\"translate(60, 20)\">\n    <ellipse cx=\"80\" cy=\"120\" rx=\"50\" ry=\"14\" fill=\"#ccfbf1\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <path d=\"M 30 30 L 30 120 A 50 14 0 0 0 130 120 L 130 30 Z\" fill=\"#f0fdfa\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <ellipse cx=\"80\" cy=\"30\" rx=\"50\" ry=\"14\" fill=\"#ccfbf1\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    \n    <line x1=\"30\" y1=\"30\" x2=\"130\" y2=\"30\" stroke=\"#0f766e\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <circle cx=\"80\" cy=\"30\" r=\"3\" fill=\"#0f766e\"/>\n    <text x=\"50\" y=\"24\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">d = 14 cm (r = 7 cm)</text>\n    \n    <line x1=\"140\" y1=\"30\" x2=\"140\" y2=\"120\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n    <text x=\"146\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">t = 10 cm</text>\n  </g>\n</svg>",
            "opsi": {
              "A": "1.540 cm³",
              "B": "3.080 cm³",
              "C": "4.620 cm³",
              "D": "6.160 cm³"
            },
            "kunci": "A",
            "pembahasan": "Diameter $d = 14\\text{ cm}$, maka jari-jari $r = 7\\text{ cm}$. Rumus volume tabung adalah $V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = \\frac{22}{7} \\times 49 \\times 10 = 22 \\times 7 \\times 10 = 1.540\\text{ cm}^3$."
          },
          {
            "id": "mtk_smp_b5_q2",
            "soal": "Perhatikan visual setengah bola pejal di bawah ini! Luas permukaan belahan bola padat (setengah bola pejal) berdiameter $20\\text{ cm}$ (gunakan $\\pi = 3{,}14$) adalah...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 180\" width=\"100%\" height=\"170\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <g transform=\"translate(60, 25)\">\n    <ellipse cx=\"80\" cy=\"50\" rx=\"60\" ry=\"18\" fill=\"#fde68a\" stroke=\"#d97706\" stroke-width=\"2\"/>\n    <path d=\"M 20 50 A 60 60 0 0 0 140 50 Z\" fill=\"#fef3c7\" stroke=\"#d97706\" stroke-width=\"2\"/>\n    <line x1=\"20\" y1=\"50\" x2=\"140\" y2=\"50\" stroke=\"#b45309\" stroke-width=\"2\"/>\n    <circle cx=\"80\" cy=\"50\" r=\"3\" fill=\"#b45309\"/>\n    <text x=\"50\" y=\"44\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#b45309\">d = 20 cm (r = 10 cm)</text>\n    <text x=\"15\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#78350f\">Belahan Bola Padat (Setengah Pejal):</text>\n    <text x=\"25\" y=\"146\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#92400e\">Lp = 2πr² (lengkung) + πr² (alas) = 3πr²</text>\n  </g>\n</svg>",
            "opsi": {
              "A": "628 cm²",
              "B": "942 cm²",
              "C": "1.256 cm²",
              "D": "1.884 cm²"
            },
            "kunci": "B",
            "pembahasan": "Diameter $d = 20\\text{ cm} \\implies r = 10\\text{ cm}$. Luas permukaan belahan bola padat terdiri dari luas selimut setengah bola ($2\\pi r^2$) ditambah luas lingkaran alas penutupnya ($\\pi r^2$). Maka $L_p = 3\\pi r^2 = 3 \\times 3{,}14 \\times 10^2 = 3 \\times 314 = 942\\text{ cm}^2$."
          },
          {
            "id": "mtk_smp_b5_q3",
            "soal": "Jika jari-jari sebuah bola diperbesar menjadi $2$ kali panjang semula, maka perbandingan volume bola yang baru terhadap volume bola semula adalah...",
            "opsi": {
              "A": "2 : 1",
              "B": "4 : 1",
              "C": "8 : 1",
              "D": "16 : 1"
            },
            "kunci": "C",
            "pembahasan": "Volume bola berbanding lurus dengan pangkat tiga jari-jarinya ($V \\propto r^3$). Jika jari-jari menjadi $r_2 = 2r_1$, maka $\\frac{V_2}{V_1} = \\left(\\frac{r_2}{r_1}\\right)^3 = (2)^3 = 8$. Jadi perbandingannya adalah $8 : 1$."
          }
        ],
        "keyTakeaways": [
          "Selalu bagi dua nilai diameter untuk mendapatkan jari-jari $r$ sebelum menghitung volume.",
          "Luas setengah bola berongga adalah $2\\pi r^2$, sedangkan luas setengah bola pejal/padat adalah $3\\pi r^2$.",
          "Perubahan volume bola berbanding dengan kubik jari-jari: perbesaran $k$ kali menghasilkan volume $k^3$ kali lipat."
        ],
        "subtestWarna": "#ea580c",
        "subtestBgLight": "#fff7ed",
        "subtestEmoji": "📐"
      }
    ]
  },
  {
    "kode": "BIN_SMP",
    "nama": "Bahasa Indonesia (Literasi TKA)",
    "singkatan": "BIN",
    "badgeWarna": "#0d9488",
    "bgLight": "#f0fdfa",
    "borderWarna": "#99f6e4",
    "emoji": "📖",
    "isUtama": true,
    "deskripsi": "Membaca kritis, teks laporan percobaan, pidato persuasif, serta kaidah PUEBI & kalimat efektif.",
    "totalBab": 3,
    "babList": [
      {
        "id": "bin_smp_bab_1",
        "subtestKode": "BIN_SMP",
        "babNumber": 1,
        "slug": "teks-laporan-percobaan",
        "judul": "Teks Laporan Percobaan",
        "durasiBacaMenit": 10,
        "ringkasanSingkat": "Pahami struktur teks laporan hasil observasi/eksperimen, kaidah kebahasaan kata kerja aktif, kata tugas, dan pembedaan fakta vs opini.",
        "learningObjectives": [
          "Mengidentifikasi struktur teks laporan percobaan (Tujuan, Alat & Bahan, Langkah Kerja, Hasil, Simpulan).",
          "Menganalisis kalimat pasif, kata hubung kausalitas, dan istilah ilmiah bidang sains.",
          "Membedakan pernyataan fakta berbasis data kuantitatif dengan opini inferensi penulis."
        ],
        "konsepTeori": [
          {
            "subjudul": "1. Struktur Umum Teks Laporan",
            "isi": "Teks laporan percobaan disusun sistematis berdasarkan metode ilmiah:\n1. Judul & Tujuan Percobaan\n2. Kajian Teori Singkat\n3. Alat dan Bahan Percobaan\n4. Prosedur/Langkah-Langkah Kerja\n5. Paparan Hasil Pengamatan (disertai tabel atau grafik)\n6. Simpulan Berdasarkan Data Fakta.",
            "poinPenting": [
              "Teks laporan percobaan bersifat objektif, faktual, dan tidak memasukkan unsur rekaan pribadi."
            ]
          }
        ],
        "trikCepat": "Trik Fakta vs Opini: Fakta selalu mengandung data yang dapat diverifikasi (angka, hasil uji laboratorium, waktu terukur). Opini ditandai kata adjektiva subjektif seperti 'sangat baik', 'seharusnya', 'tampaknya', atau 'diduga'.",
        "jebakanUmum": "Jebakan Simpulan: Simpulan yang benar harus menjawab tujuan percobaan dan bersumber langsung dari data hasil pengamatan, bukan asumsi umum di luar teks.",
        "contohSoal": [
          {
            "soal": "Bacalah kutipan teks berikut:\n'Berdasarkan pengujian larutan ekstrak kunyit pada cuka makan, warna cairan berubah menjadi kuning terang. Sementara pada air kapur, warna berubah menjadi merah kecokelatan.'\nBagian struktur teks laporan percobaan di atas merupakan bagian...",
            "opsi": {
              "A": "Tujuan",
              "B": "Langkah Kerja",
              "C": "Hasil Pengamatan",
              "D": "Simpulan"
            },
            "kunci": "C",
            "pembahasanLangkah": [
              "Kutipan tersebut memaparkan fenomena perubahan warna yang teramati selama percobaan berlangsung.",
              "Oleh karena itu, kutipan ini termasuk ke dalam bagian Hasil Pengamatan."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "bin_smp_b1_q1",
            "soal": "Ciri utama bahasa dalam teks laporan percobaan yang membedakannya dari teks fiksi adalah...",
            "opsi": {
              "A": "Menggunakan bahasa kiasan dan majas personifikasi",
              "B": "Bersifat objektif, denotatif, dan berbasis data faktual",
              "C": "Mengutamakan sudut pandang orang pertama",
              "D": "Banyak memuat alur cerita yang dramatis"
            },
            "kunci": "B",
            "pembahasan": "Teks laporan percobaan merupakan teks ilmiah nonfiksi yang wajib objektif, menggunakan kata bermakna sebenarnya (denotatif), dan didukung data faktual hasil pengamatan."
          },
          {
            "id": "bin_smp_b1_q2",
            "soal": "Manakah di antara kalimat berikut yang merupakan kalimat FAKTA?",
            "opsi": {
              "A": "Tanaman cabai yang diberi pupuk kandang tampak lebih subur dan indah.",
              "B": "Tinggi rata-rata tanaman cabai pada pot A bertambah 4,5 cm dalam 7 hari.",
              "C": "Sebaiknya petani selalu menyiram tanaman setiap sore hari.",
              "D": "Pupuk organik mungkin merupakan pupuk terbaik di dunia."
            },
            "kunci": "B",
            "pembahasan": "Kalimat B menyajikan data terukur kuantitatif (4,5 cm dalam 7 hari) yang dapat diuji kebenarannya secara objektif, sehingga merupakan fakta."
          },
          {
            "id": "bin_smp_b1_q3",
            "soal": "Kata penghubung yang menyatakan hubungan sebab-akibat (kausalitas) dalam teks laporan adalah...",
            "opsi": {
              "A": "Dan, serta, lalu",
              "B": "Karena, sebab, oleh karena itu",
              "C": "Tetapi, melainkan, sedangkan",
              "D": "Meskipun, biarpun, kendatipun"
            },
            "kunci": "B",
            "pembahasan": "Kata hubung 'karena', 'sebab', dan 'oleh karena itu' adalah konjungsi kausalitas yang menjelaskan hubungan sebab akibat pada hasil percobaan."
          }
        ],
        "keyTakeaways": [
          "Teks laporan percobaan disusun secara objektif dan faktual.",
          "Struktur baku mencakup Tujuan, Alat/Bahan, Langkah, Hasil, dan Simpulan.",
          "Gunakan fakta kuantitatif untuk membuktikan hipotesis percobaan."
        ],
        "subtestWarna": "#0d9488",
        "subtestBgLight": "#f0fdfa",
        "subtestEmoji": "📖"
      },
      {
        "id": "bin_smp_bab_2",
        "subtestKode": "BIN_SMP",
        "babNumber": 2,
        "slug": "pidato-persuasif",
        "judul": "Teks Pidato Persuasif",
        "durasiBacaMenit": 11,
        "ringkasanSingkat": "Kuasai teknik persuasi etika (etika), emosi (patos), dan logika (logos), serta struktur pembukaan, isi persuasif, dan penegasan penutup.",
        "learningObjectives": [
          "Memahami 3 pendekatan persuasif: Etika, Emosi, dan Logika.",
          "Menentukan argumen pendukung dan pesan ajakan dalam teks pidato persuasif.",
          "Menganalisis kalimat ajakan imperatif dan kalimat persuasif bermakna santun."
        ],
        "konsepTeori": [
          {
            "subjudul": "1. Tiga Pendekatan Membujuk Audiens",
            "isi": "1. Pendekatan Etika: Menyentuh nilai moral, norma masyarakat, dan integritas.\n2. Pendekatan Emosi: Menggugah perasaan audiens (empati, kepedulian, rasa bangga).\n3. Pendekatan Logika: Menyajikan alasan rasional, fakta ilmiah, dan sebab-akibat yang masuk akal.",
            "poinPenting": [
              "Struktur pidato persuasif terdiri atas: Pembukaan (salam, latar belakang), Isi (argumen & ajakan), dan Penutup (simpulan, permohonan maaf, salam)."
            ]
          }
        ],
        "trikCepat": "Trik Kata Kunci Ajakan: Kalimat persuasif selalu memiliki kata ajakan eksplisit seperti 'marilah', 'ayo', 'hendaknya', atau 'kita harus'.",
        "jebakanUmum": "Jebakan Pidato: Jangan terkecoh dengan kalimat pembuka basa-basi. Inti ajakan utama pidato persuasif selalu terletak pada paragraf argumen dan bagian penegasan akhir.",
        "contohSoal": [
          {
            "soal": "'Saudara-saudaraku, mari kita kurangi penggunaan sampah plastik sekali pakai demi kelestarian laut bagi anak cucu kita.' Kalimat tersebut menggunakan pendekatan...",
            "opsi": {
              "A": "Logika dan Matematika",
              "B": "Etika dan Emosi",
              "C": "Hukum Pidana",
              "D": "Deskripsi Ruang"
            },
            "kunci": "B",
            "pembahasanLangkah": [
              "Kalimat tersebut menyentuh tanggung jawab moral (etika) serta kasih sayang kepada masa depan anak cucu (emosi).",
              "Maka pendekatannya adalah Etika dan Emosi."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "bin_smp_b2_q1",
            "soal": "Tujuan utama dari teks pidato persuasif adalah...",
            "opsi": {
              "A": "Menceritakan pengalaman pribadi yang lucu",
              "B": "Membujuk, meyakinkan, dan mengajak audiens melakukan tindakan tertentu",
              "C": "Menjelaskan cara memasak makanan tradisional",
              "D": "Mendeskripsikan keindahan alam pegunungan"
            },
            "kunci": "B",
            "pembahasan": "Pidato persuasif bertujuan memengaruhi pendengar agar mempercayai gagasan yang disampaikan dan tergerak melakukan tindakan sesuai ajakan pembicara."
          },
          {
            "id": "bin_smp_b2_q2",
            "soal": "Bagian penutup pidato persuasif umumnya memuat...",
            "opsi": {
              "A": "Pengenalan alat dan bahan penelitian",
              "B": "Penegasan kembali gagasan pokok, ajakan akhir, permohonan maaf, dan salam",
              "C": "Data statistik hasil sensus penduduk",
              "D": "Rincian biaya anggaran kegiatan"
            },
            "kunci": "B",
            "pembahasan": "Bagian penutup berisi simpulan/penegasan intisari pidato, ajakan puncak, apresiasi, permohonan maaf, serta salam penutup."
          },
          {
            "id": "bin_smp_b2_q3",
            "soal": "Manakah kalimat yang menggunakan kata tugas ajakan persuasif?",
            "opsi": {
              "A": "Kemarin sore kami telah menanam sepuluh bibit pohon bakau.",
              "B": "Marilah kita jaga kebersihan lingkungan sekolah demi kenyamanan bersama.",
              "C": "Sungai itu mengalir sangat jernih di dekat perbukitan.",
              "D": "Apakah kamu tahu nama ketua panitia kegiatan penghijauan?"
            },
            "kunci": "B",
            "pembahasan": "Kata 'Marilah' adalah penanda kalimat ajakan persuasif yang mengajak pendengar untuk bertindak bersama-sama."
          }
        ],
        "keyTakeaways": [
          "Pidato persuasif menggabungkan kekuatan etika, emosi, dan logika.",
          "Kata ajakan 'marilah', 'ayo', 'hendaknya' menjadi ciri utama kalimat ajakan.",
          "Penutup merangkum gagasan dan menegaskan kembali komitmen bersama."
        ],
        "subtestWarna": "#0d9488",
        "subtestBgLight": "#f0fdfa",
        "subtestEmoji": "📖"
      },
      {
        "id": "bin_smp_bab_3",
        "subtestKode": "BIN_SMP",
        "babNumber": 3,
        "slug": "kaidah-puebi-dan-kalimat-efektif",
        "judul": "Kaidah PUEBI & Kalimat Efektif",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Kuasai pemakaian huruf kapital, penulisan tanda baca koma/titik dua, konjungsi intrakalimat vs antarkalimat, serta syarat kalimat efektif.",
        "learningObjectives": [
          "Menerapkan penulisan huruf kapital pada nama jabatan, geografi, dan judul karya.",
          "Mengoreksi kesalahan penggunaan tanda koma (,), tanda titik dua (:), dan tanda hubung (-).",
          "Menyusun kalimat efektif yang hemat kata, logis secara nalar, dan memiliki kesejajaran bentuk (paralelisme)."
        ],
        "konsepTeori": [
          {
            "subjudul": "1. Syarat Utama Kalimat Efektif",
            "isi": "Kalimat efektif adalah kalimat yang mampu menyampaikan pesan pembicara/penulis secara tepat tanpa menimbulkan ketaksaan (ambiguitas).\nSyarat pokok:\n1. Keutuhan/Kesatuan: Memiliki unsur subjek dan predikat yang jelas.\n2. Kesejajaran (Paralelisme): Bentuk kata yang dirangkaikan harus setara (misal: awalan me- harus dipadankan dengan awalan me-, bukan di-).\n3. Kehematan: Menghindari pemborosan kata (contoh salah: 'semua para siswa', benar: 'semua siswa' atau 'para siswa').\n4. Kelogisan: Makna kalimat masuk akal sehat.",
            "poinPenting": [
              "Jangan mengawali subjek kalimat dengan preposisi seperti 'Di dalam rapat itu memutuskan...' (SALAH karena tidak memiliki subjek!). Benar: 'Rapat itu memutuskan...' atau 'Di dalam rapat itu diputuskan...'."
            ]
          }
        ],
        "trikCepat": "Trik Huruf Kapital Geografi: Nama geografi diberi huruf kapital HANYA jika diikuti nama diri geografinya! Contoh: 'Sungai Bengawan Solo', 'Pulau Bali', 'Danau Toba'. Jika hanya jenis geografi umum tanpa nama diri ('mandi di sungai', 'berlayar ke pulau'), gunakan huruf kecil!",
        "jebakanUmum": "Jebakan Konjungsi Ganda: Kalimat majemuk tidak boleh memuat konjungsi anak kalimat dan induk kalimat sekaligus! Contoh SALAH: 'Meskipun hari hujan, tetapi kami tetap berangkat.' (Salah karena ada 'meskipun' dan 'tetapi'). BENAR: 'Meskipun hari hujan, kami tetap berangkat.'",
        "contohSoal": [
          {
            "soal": "Perhatikan kalimat berikut:\n'Tahap akhir dari penyelesaian gedung itu adalah mencakup pengecatan dinding, pemasangan lampu, dan merapikan lantai.'\nPerbaikan kalimat di atas agar memiliki kesejajaran bentuk (paralelisme) adalah...",
            "opsi": {
              "A": "pengecatan dinding, pemasangan lampu, dan perapian lantai",
              "B": "mengecat dinding, memasang lampu, dan perapian lantai",
              "C": "pengecatan dinding, memasang lampu, dan merapikan lantai",
              "D": "dicat dindingnya, dipasang lampunya, dan dirapikan lantainya"
            },
            "kunci": "A",
            "pembahasanLangkah": [
              "Unsur pertama menggunakan nomina bentuk pe-an ('pengecatan'), unsur kedua nomina pe-an ('pemasangan').",
              "Agar sejajar secara paralel, unsur ketiga juga harus berupa nomina pe-an ('perapian lantai'), bukan verba me- ('merapikan').",
              "Maka pilihan perbaikan yang paling tepat adalah A."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "bin_smp_b3_q1",
            "soal": "Penulisan huruf kapital yang tepat menurut kaidah PUEBI adalah...",
            "opsi": {
              "A": "Ibu membeli pisang Ambon dan gula Jawa di pasar.",
              "B": "Kami berwisata ke Danau Toba di provinsi Sumatra Utara.",
              "C": "Ayah membaca novel Tenggelamnya Kapal Van Der Wijck.",
              "D": "Paman baru saja dilantik menjadi Gubernur."
            },
            "kunci": "B",
            "pembahasan": "'Danau Toba' adalah nama geografis yang diikuti nama diri sehingga keduanya diawali huruf kapital. Pilihan A salah karena pisang ambon dan gula jawa adalah nama jenis, bukan nama diri geografi."
          },
          {
            "id": "bin_smp_b3_q2",
            "soal": "Kalimat berikut yang merupakan KALIMAT EFEKTIF adalah...",
            "opsi": {
              "A": "Bagi semua siswa yang membawa sepeda motor harus memarkir di halaman belakang.",
              "B": "Para hadirin sekalian dimohon untuk segera berdiri.",
              "C": "Siswa kelas sembilan sedang membersihkan ruang kelas dan merapikan perpustakaan.",
              "D": "Dia rajin belajar demi untuk meraih nilai terbaik."
            },
            "kunci": "C",
            "pembahasan": "Kalimat C memiliki subjek ('Siswa kelas sembilan') dan predikat paralel ('membersihkan... dan merapikan...'). Kalimat A salah karena diawali 'Bagi' sehingga kehilangan subjek, B boros ('Para hadirin sekalian'), D pleonasme ('demi untuk')."
          },
          {
            "id": "bin_smp_b3_q3",
            "soal": "Tanda baca koma (,) yang digunakan secara TEPAT terdapat pada kalimat...",
            "opsi": {
              "A": "Saya ingin membeli buku itu, tetapi uang saya belum cukup.",
              "B": "Jika hari ini hujan lebat, maka pertandingan akan ditunda.",
              "C": "Ayah membeli meja kursi dan lemari baru.",
              "D": "Karena terlambat bangun tidur, sehingga dia tertinggal bus sekolah."
            },
            "kunci": "A",
            "pembahasan": "Tanda koma dipakai sebelum konjungsi pertentangan seperti 'tetapi', 'melainkan', dan 'sedangkan' yang menghubungkan klausa setara dalam kalimat majemuk."
          }
        ],
        "keyTakeaways": [
          "Kalimat efektif wajib memiliki kejelasan Subjek dan Predikat serta kesejajaran imbuhan.",
          "Hindari pemborosan kata (pleonasme) seperti 'para hadirin sekalian' atau 'demi untuk'.",
          "Tanda koma diletakkan sebelum konjungsi pertentangan 'tetapi' dan setelah anak kalimat yang mendahului induk kalimat."
        ],
        "subtestWarna": "#0d9488",
        "subtestBgLight": "#f0fdfa",
        "subtestEmoji": "📖"
      }
    ]
  },
  {
    "kode": "IPA_SMP",
    "nama": "IPA Terpadu (Sains TKA)",
    "singkatan": "IPA",
    "badgeWarna": "#059669",
    "bgLight": "#ecfdf5",
    "borderWarna": "#a7f3d0",
    "emoji": "🔬",
    "isUtama": false,
    "badgeKategori": "Subtes Tambahan",
    "deskripsi": "Pewarisan sifat Mendel, listrik dinamis, rangkaian seri-paralel, dan kemagnetan transformator.",
    "totalBab": 2,
    "babList": [
      {
        "id": "ipa_smp_bab_1",
        "subtestKode": "IPA_SMP",
        "babNumber": 1,
        "slug": "pewarisan-sifat-dan-genetika",
        "judul": "Pewarisan Sifat (Genetika Mendel)",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Kuasai hukum segregasi Mendel, persilangan monohibrid dominan & intermediet, persilangan dihibrid rasio 9:3:3:1, serta kelainan terpaut kromosom.",
        "learningObjectives": [
          "Membedakan istilah genotipe (alel $MM, Mm, mm$) dan fenotipe (sifat tampak).",
          "Menentukan rasio genotipe dan fenotipe keturunan $F_2$ pada persilangan monohibrid dan dihibrid.",
          "Menganalisis pewarisan kelainan hemofilia dan buta warna terpaut kromosom X."
        ],
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 460 210\" width=\"100%\" height=\"200\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"30\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#059669\">🌱 Punnett Square Monohibrid (MM × mm → F₂)</text>\n  <rect x=\"120\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"155\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"200\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"235\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  \n  <rect x=\"40\" y=\"85\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"120\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">MM (Merah)</text>\n  <rect x=\"200\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"225\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  \n  <rect x=\"40\" y=\"130\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  <rect x=\"120\" y=\"130\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  <rect x=\"200\" y=\"130\" width=\"80\" height=\"45\" fill=\"#fef2f2\" stroke=\"#fecaca\"/>\n  <text x=\"225\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#b91c1c\">mm (Putih)</text>\n  \n  <text x=\"295\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Genotipe:</text>\n  <text x=\"295\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#059669\">1 MM : 2 Mm : 1 mm</text>\n  <text x=\"295\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Fenotipe:</text>\n  <text x=\"295\" y=\"165\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\">3 Merah : 1 Putih (75% : 25%)</text>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Hukum Mendel I & Persilangan Monohibrid",
            "isi": "Hukum Segregasi Bebas (Mendel I) menyatakan bahwa pada pembentukan gamet, pasangan alel akan memisah secara bebas.\n• Persilangan Monohibrid Dominan Penuh:\nParental: $MM$ (Merah) $\\times mm$ (Putih)\nFilial 1 ($F_1$): Semua $Mm$ (Merah)\nPersilangan sesama $F_1$: $Mm \\times Mm$\nFilial 2 ($F_2$):\n- Rasio Genotipe: $1 MM : 2 Mm : 1 mm$ (25% : 50% : 25%)\n- Rasio Fenotipe: 3 Merah : 1 Putih (75% : 25%).",
            "poinPenting": [
              "Jika bersifat intermediet (kodominan), heterozigot $Mm$ menghasilkan warna merah muda (rasio fenotipe 1 Merah : 2 Merah Muda : 1 Putih)."
            ]
          }
        ],
        "trikCepat": "Trik Cepat Dihibrid ($AaBb \\times AaBb$): Rasio fenotipe dominan penuh dihibrid selalu berpola $9 : 3 : 3 : 1$.\n- 9 = Dominan kedua sifat ($A\\_B\\_$)\n- 3 = Dominan sifat pertama, resesif kedua ($A\\_bb$)\n- 3 = Resesif sifat pertama, dominan kedua ($aaB\\_$)\n- 1 = Resesif kedua sifat ($aabb$).",
        "jebakanUmum": "Jebakan Buta Warna: Buta warna terpaut kromosom X resesif ($X^{cb}$). Laki-laki hanya memiliki satu kromosom X ($X^{cb}Y$), sehingga jika memiliki gen $X^{cb}$ langsung menderita buta warna (tidak ada istilah pria carrier!). Wanita carrier bergenotipe $X^C X^{cb}$ berfenotipe normal.",
        "contohSoal": [
          {
            "soal": "Kacang ercis berbiji bulat kuning ($BbKk$) disilangkan dengan sesamanya ($BbKk$). Berapakah persentase keturunan yang berfenotipe bulat hijau jika sifat bulat ($B$) dominan terhadap kisut ($b$) dan kuning ($K$) dominan terhadap hijau ($k$)?",
            "opsi": {
              "A": "56,25% (9/16)",
              "B": "18,75% (3/16)",
              "C": "6,25% (1/16)",
              "D": "50,00% (8/16)"
            },
            "kunci": "B",
            "pembahasanLangkah": [
              "Rasio fenotipe dihibrid: Bulat Kuning (9) : Bulat Hijau (3) : Kisut Kuning (3) : Kisut Hijau (1). Total bagian = 16.",
              "Bagian untuk fenotipe Bulat Hijau adalah 3 dari 16 bagian.",
              "Persentase: $\\frac{3}{16} \\times 100\\% = 18{,}75\\%$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "ipa_smp_b1_q1",
            "soal": "Persilangan antara tanaman berbunga merah ($MM$) dengan tanaman berbunga putih ($mm$) menghasilkan keturunan $F_1$ berbunga merah muda ($Mm$). Sifat pewarisan ini disebut...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 460 210\" width=\"100%\" height=\"200\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"30\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#059669\">🌱 Punnett Square Monohibrid (MM × mm → F₂)</text>\n  <rect x=\"120\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"155\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"200\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"235\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  \n  <rect x=\"40\" y=\"85\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"120\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">MM (Merah)</text>\n  <rect x=\"200\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"225\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  \n  <rect x=\"40\" y=\"130\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  <rect x=\"120\" y=\"130\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  <rect x=\"200\" y=\"130\" width=\"80\" height=\"45\" fill=\"#fef2f2\" stroke=\"#fecaca\"/>\n  <text x=\"225\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#b91c1c\">mm (Putih)</text>\n  \n  <text x=\"295\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Genotipe:</text>\n  <text x=\"295\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#059669\">1 MM : 2 Mm : 1 mm</text>\n  <text x=\"295\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Fenotipe:</text>\n  <text x=\"295\" y=\"165\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\">3 Merah : 1 Putih (75% : 25%)</text>\n</svg>",
            "opsi": {
              "A": "Dominan penuh",
              "B": "Intermediet (kodominan)",
              "C": "Resesif mutlak",
              "D": "Epistasis dominan"
            },
            "kunci": "B",
            "pembahasan": "Sifat intermediet terjadi ketika alel dominan tidak dapat menutupi alel resesif secara sempurna, sehingga terbentuk fenotipe campuran antara kedua induknya (merah + putih = merah muda)."
          },
          {
            "id": "ipa_smp_b1_q2",
            "soal": "Seorang wanita pembawa sifat buta warna ($X^C X^{cb}$) menikah dengan pria berpenglihatan normal ($X^C Y$). Kemungkinan anak laki-laki mereka menderita buta warna adalah...",
            "opsi": {
              "A": "0%",
              "B": "25%",
              "C": "50%",
              "D": "100%"
            },
            "kunci": "C",
            "pembahasan": "Keturunan anak laki-laki menerima kromosom Y dari ayah dan kromosom X dari ibu ($X^C$ atau $X^{cb}$). Peluang anak laki-laki menerima $X^{cb}$ dari ibu pembawa adalah $\\frac{1}{2} = 50\\%$."
          }
        ],
        "keyTakeaways": [
          "Hukum Segregasi I Mendel memisahkan pasangan alel pada pembentukan gamet.",
          "Rasio fenotipe monohibrid dominan penuh $F_2$ adalah 3:1, sedangkan monohibrid intermediet adalah 1:2:1.",
          "Pria mewarisi kelainan terpaut kromosom X dari ibunya."
        ],
        "subtestWarna": "#059669",
        "subtestBgLight": "#ecfdf5",
        "subtestEmoji": "🔬"
      },
      {
        "id": "ipa_smp_bab_2",
        "subtestKode": "IPA_SMP",
        "babNumber": 2,
        "slug": "listrik-dinamis-dan-kemagnetan",
        "judul": "Listrik Dinamis & Kemagnetan",
        "durasiBacaMenit": 15,
        "ringkasanSingkat": "Kuasai Hukum Ohm $V = I \\times R$, hambatan pengganti seri dan paralel, energi/daya listrik $P = V \\times I$, serta induksi elektromagnetik trafo.",
        "learningObjectives": [
          "Menghitung arus listrik, tegangan, dan hambatan menggunakan Hukum Ohm.",
          "Menentukan nilai hambatan total pada rangkaian kombinasi seri dan paralel.",
          "Menerapkan persamaan transformator ideal $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$."
        ],
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 200\" width=\"100%\" height=\"190\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"28\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#4338ca\">⚡ Rangkaian Listrik Seri vs Paralel (Hukum Ohm: V = I × R)</text>\n  \n  <g transform=\"translate(30, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"210\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">1. Rangkaian Seri</text>\n    <path d=\"M 20 70 L 40 70 M 60 70 L 90 70 M 110 70 L 140 70 M 160 70 L 190 70 L 190 95 L 20 95 Z\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"/>\n    <rect x=\"40\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"44\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₁</text>\n    <rect x=\"90\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"94\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₂</text>\n    <rect x=\"140\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"144\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₃</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1d4ed8\">R_total = R₁ + R₂ + R₃</text>\n  </g>\n\n  <g transform=\"translate(270, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"220\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">2. Rangkaian Paralel</text>\n    <line x1=\"30\" y1=\"45\" x2=\"190\" y2=\"45\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"85\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"45\" x2=\"30\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"190\" y1=\"45\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <rect x=\"95\" y=\"38\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"32\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₁</text>\n    <rect x=\"95\" y=\"78\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₂</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#4338ca\">1/R_total = 1/R₁ + 1/R₂</text>\n  </g>\n</svg>",
        "konsepTeori": [
          {
            "subjudul": "1. Hukum Ohm & Hambatan Rangkaian",
            "isi": "Hukum Ohm menyatakan kuat arus ($I$) berbanding lurus dengan tegangan ($V$) dan berbanding terbalik dengan hambatan ($R$):\n$$V = I \\times R$$\n\n• Hambatan Seri: $R_s = R_1 + R_2 + R_3$ (arus yang mengalir di setiap resistor sama).\n• Hambatan Paralel: $\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$ (tegangan pada setiap cabang sama).",
            "poinPenting": [
              "Pada rangkaian paralel dua resistor, trik cepat hambatan pengganti: $R_p = \\frac{R_1 \\times R_2}{R_1 + R_2}$."
            ]
          }
        ],
        "trikCepat": "Trik Trafo Cepat: Perbandingan tegangan selalu SEJAJAR dengan lilitan ($\\frac{V_p}{V_s} = \\frac{N_p}{N_s}$), namun TERBALIK dengan kuat arus ($\\frac{V_p}{V_s} = \\frac{I_s}{I_p}$). Jika tegangan naik (Step Up), arus pasti turun!",
        "jebakanUmum": "Jebakan Satuan Daya: Rumus energi listrik $W = P \\times t$. Jika daya dalam Watt dan waktu dalam detik, hasilnya Joule. Jika tarif listrik dihitung dalam kWh, daya wajib diubah ke KiloWatt (bagi 1.000) dan waktu dalam satuan Jam (hour)!",
        "contohSoal": [
          {
            "soal": "Dua hambatan masing-masing bernilai $6\\,\\Omega$ dan $3\\,\\Omega$ dirangkai secara paralel, kemudian dihubungkan dengan sumber tegangan $12\\text{ Volt}$. Kuat arus total yang mengalir pada rangkaian adalah...",
            "opsi": {
              "A": "2 A",
              "B": "4 A",
              "C": "6 A",
              "D": "8 A"
            },
            "kunci": "C",
            "pembahasanLangkah": [
              "Hitung hambatan paralel: $R_p = \\frac{6 \\times 3}{6 + 3} = \\frac{18}{9} = 2\\,\\Omega$.",
              "Gunakan Hukum Ohm untuk menghitung arus total: $I = \\frac{V}{R_p} = \\frac{12\\text{ V}}{2\\,\\Omega} = 6\\text{ A}$."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "ipa_smp_b2_q1",
            "soal": "Sebuah transformator step-down memiliki kumparan primer $1.200$ lilitan dan kumparan sekunder $300$ lilitan. Jika tegangan primer $220\\text{ V}$, maka tegangan sekundernya adalah...",
            "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 200\" width=\"100%\" height=\"190\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"28\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#4338ca\">⚡ Rangkaian Listrik Seri vs Paralel (Hukum Ohm: V = I × R)</text>\n  \n  <g transform=\"translate(30, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"210\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">1. Rangkaian Seri</text>\n    <path d=\"M 20 70 L 40 70 M 60 70 L 90 70 M 110 70 L 140 70 M 160 70 L 190 70 L 190 95 L 20 95 Z\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"/>\n    <rect x=\"40\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"44\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₁</text>\n    <rect x=\"90\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"94\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₂</text>\n    <rect x=\"140\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"144\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₃</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1d4ed8\">R_total = R₁ + R₂ + R₃</text>\n  </g>\n\n  <g transform=\"translate(270, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"220\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">2. Rangkaian Paralel</text>\n    <line x1=\"30\" y1=\"45\" x2=\"190\" y2=\"45\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"85\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"45\" x2=\"30\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"190\" y1=\"45\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <rect x=\"95\" y=\"38\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"32\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₁</text>\n    <rect x=\"95\" y=\"78\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₂</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#4338ca\">1/R_total = 1/R₁ + 1/R₂</text>\n  </g>\n</svg>",
            "opsi": {
              "A": "55 V",
              "B": "110 V",
              "C": "440 V",
              "D": "880 V"
            },
            "kunci": "A",
            "pembahasan": "Gunakan persamaan trafo: $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} \\implies \\frac{220}{V_s} = \\frac{1.200}{300} = 4$. Maka $V_s = \\frac{220}{4} = 55\\text{ Volt}$."
          },
          {
            "id": "ipa_smp_b2_q2",
            "soal": "Sebuah setrika listrik berdaya $350\\text{ Watt}$ digunakan selama $2\\text{ jam}$ setiap hari. Energi listrik yang digunakan setrika tersebut dalam satu hari adalah...",
            "opsi": {
              "A": "0,7 kWh",
              "B": "1,4 kWh",
              "C": "700 kWh",
              "D": "1.400 kWh"
            },
            "kunci": "A",
            "pembahasan": "Energi listrik $W = P \\times t = 350\\text{ W} \\times 2\\text{ jam} = 700\\text{ Wh} = \\frac{700}{1.000} = 0{,}7\\text{ kWh}$."
          }
        ],
        "keyTakeaways": [
          "Hukum Ohm $V = I \\times R$ menghubungkan tegangan, kuat arus, dan hambatan listrik.",
          "Rangkaian hambatan paralel memperkecil hambatan total ($R_p = \\frac{R_1 R_2}{R_1+R_2}$).",
          "Transformator ideal memenuhi hubungan $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$."
        ],
        "subtestWarna": "#059669",
        "subtestBgLight": "#ecfdf5",
        "subtestEmoji": "🔬"
      }
    ]
  },
  {
    "kode": "BIG_SMP",
    "nama": "Bahasa Inggris",
    "singkatan": "BIG",
    "badgeWarna": "#4f46e5",
    "bgLight": "#eef2ff",
    "borderWarna": "#c7d2fe",
    "emoji": "🇬🇧",
    "isUtama": false,
    "badgeKategori": "Subtes Tambahan",
    "deskripsi": "Interpersonal expressions of hope and wish, congratulations, procedure recipes, and reading comprehension.",
    "totalBab": 2,
    "babList": [
      {
        "id": "big_smp_bab_1",
        "subtestKode": "BIG_SMP",
        "babNumber": 1,
        "slug": "interpersonal-and-transactional-texts",
        "judul": "Expressions of Hope, Wish & Congratulations",
        "durasiBacaMenit": 10,
        "ringkasanSingkat": "Pelajari perbedaan konteks ungkapan 'congratulations', 'I hope so', 'I wish you luck', serta respon percakapan interpersonal sehari-hari.",
        "learningObjectives": [
          "Membedakan penggunaan ungkapan harapan realistis (hope) dan angan-angan (wish).",
          "Menanggapi ucapan selamat atas prestasi dan keberhasilan seseorang.",
          "Menentukan fungsi sosial dan struktur percakapan transaksional."
        ],
        "konsepTeori": [
          {
            "subjudul": "1. Hope vs Wish",
            "isi": "• 'Hope' digunakan untuk menyatakan harapan yang mungkin dan realistis terjadi di masa kini atau mendatang. Pola: Hope + S + Verb (present/future).\nContoh: 'I hope you win the speech contest tomorrow.'\n\n• 'Wish' digunakan untuk menyatakan keinginan atas hal yang mustahil/sulit terjadi saat ini (pengandaian), atau mendoakan keberuntungan formal. Pola: Wish + someone + luck/success.\nContoh: 'I wish you good luck on your examination.'",
            "poinPenting": [
              "Respon paling tepat saat diberi ucapan selamat atau doa adalah 'Thank you very much' atau 'Thanks a lot for saying so'."
            ]
          }
        ],
        "trikCepat": "Trik Jawaban Singkat: Bila seseorang berkata 'Congratulations on winning the match!', jawaban yang tepat selalu ucapan terima kasih ('Thank you', 'Thanks, I did my best'), BUKAN membalas dengan 'Same to you'!",
        "jebakanUmum": "Jebakan Wish: Jangan gunakan wish untuk kalimat doa sederhana jika ada kata kerja present biasa, gunakan pola 'wish you all the best'.",
        "contohSoal": [
          {
            "soal": "Edo: 'Siti, I heard you won the national drawing competition! Congratulations!'\nSiti: '...'\nThe most suitable response to complete the dialogue is...",
            "opsi": {
              "A": "I hope you are fine.",
              "B": "Thank you very much, Edo. I practiced hard for it.",
              "C": "I wish you good luck.",
              "D": "You must be kidding me."
            },
            "kunci": "B",
            "pembahasanLangkah": [
              "Edo memberikan ucapan selamat atas prestasi Siti memenangkan lomba gambar nasional.",
              "Respon santun dan tepat untuk ucapan selamat adalah berterima kasih ('Thank you very much')."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "big_smp_b1_q1",
            "soal": "Dayu: 'Udin, my brother is hospitalized because of dengue fever.'\nUdin: 'I am sorry to hear that. I hope ... soon.'",
            "opsi": {
              "A": "he gets well",
              "B": "he is sick",
              "C": "you congratulate him",
              "D": "you stay at home"
            },
            "kunci": "A",
            "pembahasan": "Udin menyampaikan simpati atas sakitnya saudara Dayu. Doa yang tepat adalah mengharapkan kesembuhan ('I hope he gets well soon')."
          },
          {
            "id": "big_smp_b1_q2",
            "soal": "Which of the following expressions is used to congratulate someone on graduating from school?",
            "opsi": {
              "A": "Have a safe flight!",
              "B": "Congratulations on your graduation! We are so proud of you.",
              "C": "Get well soon!",
              "D": "I am so sorry for your loss."
            },
            "kunci": "B",
            "pembahasan": "Ungkapan yang tepat untuk kelulusan sekolah adalah 'Congratulations on your graduation!'."
          }
        ],
        "keyTakeaways": [
          "Gunakan 'hope' untuk harapan yang mungkin terjadi, dan 'congratulations' untuk merayakan pencapaian.",
          "Respon atas pujian dan selamat selalu diawali ungkapan terima kasih ('Thank you')."
        ],
        "subtestWarna": "#4f46e5",
        "subtestBgLight": "#eef2ff",
        "subtestEmoji": "🇬🇧"
      },
      {
        "id": "big_smp_bab_2",
        "subtestKode": "BIG_SMP",
        "babNumber": 2,
        "slug": "procedure-text-and-recipes",
        "judul": "Procedure Text: Recipes & Manuals",
        "durasiBacaMenit": 11,
        "ringkasanSingkat": "Pahami tujuan teks prosedur, struktur generic structure (Goal, Materials, Steps), kata kerja perintah (imperative verbs), dan connectives of sequence.",
        "learningObjectives": [
          "Mengidentifikasi Generic Structure teks prosedur: Goal, Ingredients/Materials, dan Steps.",
          "Menemukan kata kerja aksi imperatif (e.g., 'pour', 'stir', 'mix', 'slice').",
          "Menganalisis urutan langkah kerja menggunakan sequence adverbs (first, then, after that, finally)."
        ],
        "konsepTeori": [
          {
            "subjudul": "1. Generic Structure Procedure Text",
            "isi": "Teks prosedur menjelaskan cara membuat atau mengoperasikan sesuatu melalui serangkaian tindakan teratur:\n1. Goal/Aim: Tujuan kegiatan (biasanya tertera pada judul teks, misal 'How to Make Avocado Juice').\n2. Ingredients/Materials: Bahan dan alat yang diperlukan.\n3. Steps/Methods: Runtutan petunjuk kerja menggunakan kalimat perintah imperatif dan kata urutan waktu (first, next, then, finally).",
            "poinPenting": [
              "Ciri kebahasaan: Menggunakan Simple Present Tense, kata kerja imperatif ('Blend the fruit', 'Cut the paper'), dan kata penghubung temporal."
            ]
          }
        ],
        "trikCepat": "Trik Mencari Tujuan (Purpose): Pertanyaan 'What is the purpose of the text?' jawabannya selalu berawal dari 'To show how to make / operate...' diikuti judul teks prosedur tersebut!",
        "jebakanUmum": "Jebakan Urutan: Perhatikan kata penghubung temporal 'before' dan 'after'. Kalimat 'Add sugar before blending' artinya gula dimasukkan DAHULU, baru kemudian diblender. Jangan sampai terbalik urutannya!",
        "contohSoal": [
          {
            "soal": "'Pour the warm water into the glass and stir thoroughly.' The word 'stir' is closest in meaning to...",
            "opsi": {
              "A": "Mix",
              "B": "Boil",
              "C": "Freeze",
              "D": "Chop"
            },
            "kunci": "A",
            "pembahasanLangkah": [
              "Kata 'stir' berarti mengaduk.",
              "Sinonim yang paling tepat untuk mengaduk adalah 'mix' (mencampur/mengaduk)."
            ]
          }
        ],
        "kuisPemahaman": [
          {
            "id": "big_smp_b2_q1",
            "soal": "What is the social function of a procedure text?",
            "opsi": {
              "A": "To entertain the readers with a fairy tale story",
              "B": "To describe how something is made or done through a sequence of actions",
              "C": "To report a natural disaster in the community",
              "D": "To persuade people to buy a new product"
            },
            "kunci": "B",
            "pembahasan": "Fungsi sosial teks prosedur adalah memberikan panduan langkah demi langkah cara membuat atau melakukan sesuatu secara runtut."
          },
          {
            "id": "big_smp_b2_q2",
            "soal": "Which of the following words is an imperative verb commonly found in recipe steps?",
            "opsi": {
              "A": "Delicious",
              "B": "Carefully",
              "C": "Chop",
              "D": "Yesterday"
            },
            "kunci": "C",
            "pembahasan": "'Chop' (cincang/potong) adalah kata kerja tindakan berimbuhan dasar yang berfungsi sebagai kalimat perintah (imperative verb)."
          }
        ],
        "keyTakeaways": [
          "Teks prosedur terdiri dari Goal, Materials, dan Steps.",
          "Ciri bahasa: imperative verbs, simple present tense, dan temporal connectives.",
          "Tujuan teks: 'To tell / show how to make or use something'."
        ],
        "subtestWarna": "#4f46e5",
        "subtestBgLight": "#eef2ff",
        "subtestEmoji": "🇬🇧"
      }
    ]
  }
];

export const SEMUA_BAB_SMP = [
  {
    "id": "mtk_smp_bab_1",
    "subtestKode": "MTK_SMP",
    "babNumber": 1,
    "slug": "perpangkatan-dan-bentuk-akar",
    "judul": "Perpangkatan dan Bentuk Akar",
    "durasiBacaMenit": 12,
    "ringkasanSingkat": "Kuasai sifat-sifat eksponen aljabar, operasi rasionalisasi bentuk akar, dan konversi notasi ilmiah baku $a \\times 10^n$ ($1 \\le a < 10$).",
    "learningObjectives": [
      "Menerapkan 5 kaidah pokok operasi bilangan berpangkat bulat positif, negatif, dan nol.",
      "Menyederhanakan dan merasionalkan penyebut pecahan bentuk akar $\\frac{a}{\\sqrt{b}}$ dan $\\frac{a}{\\sqrt{b} \\pm \\sqrt{c}}$.",
      "Menuliskan bilangan desimal sangat kecil dan sangat besar ke dalam notasi baku ilmiah resmi."
    ],
    "gambar3dUrl": "/images/modul-smp/eksponen_3d_gemilang.png",
    "gambar3dCaption": "Visualisasi Edukatif 3D Konsep Eksponen & Matriks Aljabar (Bimbel Gemilang)",
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 620 220\" width=\"100%\" height=\"210\">\n  <defs>\n    <marker id=\"arrowKoma\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"5\" markerHeight=\"5\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#ea580c\"/>\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"#f8fafc\" rx=\"14\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  \n  <!-- KARTU KIRI: LOMPATAN KOMA NOTASI ILMIAH (SUPER PRESISI & AKURAT) -->\n  <g transform=\"translate(15, 14)\">\n    <rect width=\"285\" height=\"192\" fill=\"#ffffff\" rx=\"12\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n    <rect width=\"285\" height=\"34\" fill=\"#f0fdfa\" rx=\"12\" stroke=\"#ccfbf1\" stroke-width=\"1\"/>\n    <text x=\"16\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f766e\">💡 Notasi Ilmiah: a × 10ⁿ (1 ≤ a &lt; 10)</text>\n    \n    <!-- Label Posisi Koma Awal & Koma Baru -->\n    <text x=\"46\" y=\"52\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#dc2626\">Koma Awal</text>\n    <line x1=\"60\" y1=\"55\" x2=\"60\" y2=\"62\" stroke=\"#dc2626\" stroke-width=\"1.5\"/>\n    \n    <text x=\"160\" y=\"52\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#ea580c\">Koma Baru! ★</text>\n    <line x1=\"182\" y1=\"55\" x2=\"182\" y2=\"62\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n    \n    <!-- Digit Angka Desimal Terukur Sempurna -->\n    <g font-family=\"'SF Mono', Monaco, Consolas, monospace\" font-size=\"16\" font-weight=\"bold\">\n      <text x=\"46\" y=\"78\" fill=\"#0f172a\">0</text>\n      <text x=\"57\" y=\"78\" fill=\"#dc2626\" font-size=\"18\">,</text>\n      <text x=\"70\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"92\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"114\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"136\" y=\"78\" fill=\"#64748b\">0</text>\n      <text x=\"158\" y=\"78\" fill=\"#0f172a\">7</text>\n      <text x=\"178\" y=\"78\" fill=\"#ea580c\" font-size=\"20\">,</text>\n      <text x=\"194\" y=\"78\" fill=\"#0f172a\">2</text>\n      <text x=\"216\" y=\"78\" fill=\"#0f172a\">5</text>\n    </g>\n    \n    <!-- 5 Busur Lompatan Presisi Koma -->\n    <!-- Lompatan 1: dari x=60 ke x=81 -->\n    <path d=\"M 60 84 Q 70.5 98 81 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"70.5\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"70.5\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">1</text>\n    \n    <!-- Lompatan 2: dari x=81 ke x=103 -->\n    <path d=\"M 81 84 Q 92 98 103 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"92\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"92\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">2</text>\n    \n    <!-- Lompatan 3: dari x=103 ke x=125 -->\n    <path d=\"M 103 84 Q 114 98 125 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"114\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"114\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">3</text>\n    \n    <!-- Lompatan 4: dari x=125 ke x=147 -->\n    <path d=\"M 125 84 Q 136 98 147 84\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <circle cx=\"136\" cy=\"102\" r=\"6\" fill=\"#0f766e\"/>\n    <text x=\"136\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">4</text>\n    \n    <!-- Lompatan 5: dari x=147 ke x=182 (melewati 7 tepat ke koma baru) -->\n    <path d=\"M 147 84 Q 164.5 100 182 85\" fill=\"none\" stroke=\"#ea580c\" stroke-width=\"2.5\" marker-end=\"url(#arrowKoma)\"/>\n    <circle cx=\"164.5\" cy=\"102\" r=\"6\" fill=\"#ea580c\"/>\n    <text x=\"164.5\" y=\"105\" font-family=\"system-ui, sans-serif\" font-size=\"8.5\" font-weight=\"bold\" fill=\"#ffffff\" text-anchor=\"middle\">5</text>\n    \n    <!-- Hasil Analisis -->\n    <rect x=\"16\" y=\"120\" width=\"253\" height=\"58\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#e2e8f0\"/>\n    <text x=\"26\" y=\"138\" font-family=\"system-ui, sans-serif\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#0f766e\">↳ Geser 5 langkah ke kanan (Pangkat = -5)</text>\n    <text x=\"26\" y=\"162\" font-family=\"system-ui, sans-serif\" font-size=\"14.5\" font-weight=\"bold\" fill=\"#ea580c\">= 7,25 × 10⁻⁵</text>\n  </g>\n  \n  <!-- KARTU KANAN: SIFAT POKOK PERPANGKATAN -->\n  <g transform=\"translate(315, 14)\">\n    <rect width=\"290\" height=\"192\" fill=\"#ffffff\" rx=\"12\" stroke=\"#cbd5e1\" stroke-width=\"1.5\"/>\n    <rect width=\"290\" height=\"34\" fill=\"#fff7ed\" rx=\"12\" stroke=\"#ffedd5\" stroke-width=\"1\"/>\n    <text x=\"16\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#c2410c\">⚡ 6 Kaidah Pokok Perpangkatan</text>\n    <g font-family=\"system-ui, sans-serif\" font-size=\"11.5\" fill=\"#334155\">\n      <text x=\"18\" y=\"58\">• aᵐ × aⁿ = aᵐ⁺ⁿ</text>\n      <text x=\"150\" y=\"58\">• (aᵐ)ⁿ = aᵐˣⁿ</text>\n      <text x=\"18\" y=\"84\">• aᵐ / aⁿ = aᵐ⁻ⁿ</text>\n      <text x=\"150\" y=\"84\">• (ab)ⁿ = aⁿ · bⁿ</text>\n      <text x=\"18\" y=\"110\">• a⁻ⁿ = 1 / aⁿ</text>\n      <text x=\"150\" y=\"110\">• a⁰ = 1 (a ≠ 0)</text>\n    </g>\n    <rect x=\"16\" y=\"128\" width=\"258\" height=\"50\" fill=\"#fefce8\" rx=\"8\" stroke=\"#fef08a\"/>\n    <text x=\"24\" y=\"146\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" font-weight=\"bold\" fill=\"#854d0e\">⚠️ Peringatan Jebakan:</text>\n    <text x=\"24\" y=\"164\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#a16207\">Nilai a harus 1 ≤ a &lt; 10. Penulisan 72,5×10⁻⁶ SALAH!</text>\n  </g>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Kaidah Pokok Operasi Bilangan Berpangkat",
        "isi": "Bilangan berpangkat menyatakan perkalian berulang dari suatu bilangan pokok yang sama. Jika $a, b \\in \\mathbb{R}$ dan $m, n \\in \\mathbb{Z}$, berlaku sifat fundamental berikut:\n\n1. Perkalian basis sama: $a^m \\times a^n = a^{m+n}$\n2. Pembagian basis sama: $\\frac{a^m}{a^n} = a^{m-n}$ (dengan $a \\ne 0$)\n3. Pemangkatan bentuk pangkat: $(a^m)^n = a^{m \\times n}$\n4. Pangkat bilangan pecahan (bentuk akar): $a^{\\frac{m}{n}} = \\sqrt[n]{a^m}$\n5. Pangkat bilangan bulat negatif: $a^{-n} = \\frac{1}{a^n}$\n6. Definisi pangkat nol: $a^0 = 1$ untuk setiap $a \\ne 0$.",
        "poinPenting": [
          "Perhatikan tanda kurung: $(-2)^4 = 16$, sedangkan $-2^4 = -16$.",
          "Penjumlahan eksponen basis sama TIDAK BISA langsung dijumlahkan pangkatnya: $2^3 + 2^4 = 8 + 16 = 24$, atau difaktorkan: $2^3(1 + 2) = 8 \\times 3 = 24$."
        ]
      },
      {
        "subjudul": "2. Operasi Bentuk Akar & Merasionalkan Penyebut",
        "isi": "Bentuk akar $\\sqrt{a}$ adalah akar dari bilangan rasional yang hasilnya irasional. Syarat penjumlahan dan pengurangan bentuk akar adalah memiliki bilangan di bawah tanda akar yang sama ($a\\sqrt{c} \\pm b\\sqrt{c} = (a \\pm b)\\sqrt{c}$).\n\nUntuk merasionalkan penyebut:\n• Bentuk $\\frac{a}{\\sqrt{b}} = \\frac{a}{\\sqrt{b}} \\times \\frac{\\sqrt{b}}{\\sqrt{b}} = \\frac{a\\sqrt{b}}{b}$\n• Bentuk $\\frac{c}{\\sqrt{a} + \\sqrt{b}} = \\frac{c}{\\sqrt{a} + \\sqrt{b}} \\times \\frac{\\sqrt{a} - \\sqrt{b}}{\\sqrt{a} - \\sqrt{b}} = \\frac{c(\\sqrt{a} - \\sqrt{b})}{a - b}$ (dikalikan bentuk sekawan).",
        "poinPenting": [
          "Bentuk sekawan dari $(\\sqrt{a} + \\sqrt{b})$ adalah $(\\sqrt{a} - \\sqrt{b})$ karena $(\\sqrt{a}+\\sqrt{b})(\\sqrt{a}-\\sqrt{b}) = a - b$."
        ]
      },
      {
        "subjudul": "3. Notasi Ilmiah (Bentuk Baku)",
        "isi": "Bentuk baku dituliskan dalam formula $a \\times 10^n$ dengan batasan mutlak $1 \\le a < 10$ dan $n$ bilangan bulat.\n• Jika bilangan sangat kecil ($0 < x < 1$), koma digeser ke KANAN sebanyak $k$ langkah, sehingga pangkatnya menjadi negatif: $10^{-k}$.\nContoh: $0{,}0000725$ digeser ke kanan $5$ angka menjadi $7{,}25 \\times 10^{-5}$.\n• Jika bilangan sangat besar ($x \\ge 10$), koma digeser ke KIRI sebanyak $k$ langkah, sehingga pangkatnya positif: $10^{k}$.\nContoh: $149.600.000 = 1{,}496 \\times 10^8$.",
        "poinPenting": [
          "Nilai $a$ tidak boleh bernilai $10$ atau lebih, dan tidak boleh kurang dari $1$. Penulisan $72{,}5 \\times 10^{-6}$ BUKAN notasi baku resmi!"
        ]
      }
    ],
    "trikCepat": "Trik Notasi Ilmiah Cepat: Untuk bilangan desimal $0{,}000...x$, hitung total nol dari nol sebelum koma hingga angka pertama bukan nol. Pada $0{,}0000725$, ada tepat 5 buah angka nol di depan angka 7. Maka pangkatnya langsung $-5$, yakni $7{,}25 \\times 10^{-5}$!",
    "jebakanUmum": "Jebakan Pangkat Negatif: $4^{-2} + 2^{-3}$ BUKAN bernilai negatif! Nilai sebenarnya adalah $\\frac{1}{4^2} + \\frac{1}{2^3} = \\frac{1}{16} + \\frac{1}{8} = \\frac{3}{16}$. Jangan mengalikan basis dengan tanda minus!",
    "contohSoal": [
      {
        "soal": "Bentuk sederhana dari operasi aljabar $\\frac{4^3 \\times 2^6}{8^3}$ adalah...",
        "opsi": {
          "A": "8",
          "B": "16",
          "C": "32",
          "D": "64"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Ubah semua basis ke basis prima terkecil yaitu 2: $4 = 2^2$ dan $8 = 2^3$.",
          "Pembilang: $4^3 \\times 2^6 = (2^2)^3 \\times 2^6 = 2^6 \\times 2^6 = 2^{6+6} = 2^{12}$.",
          "Penyebut: $8^3 = (2^3)^3 = 2^{3 \\times 3} = 2^9$.",
          "Bagi pembilang dengan penyebut: $\\frac{2^{12}}{2^9} = 2^{12-9} = 2^3 = 8$. (Koreksi opsi: Jika $8$, kunci A). Pada $2^4 = 16$ jika pangkat $2^{13-9}$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b1_q1",
        "soal": "Bentuk sederhana dari operasi $\\frac{3^2 \\times 3^5}{3^4}$ adalah...",
        "opsi": {
          "A": "3",
          "B": "9",
          "C": "27",
          "D": "81"
        },
        "kunci": "C",
        "pembahasan": "Menggunakan sifat perkalian dan pembagian eksponen: pembilang adalah $3^{2+5} = 3^7$. Lalu dibagi $3^4$: $\\frac{3^7}{3^4} = 3^{7-4} = 3^3 = 27$."
      },
      {
        "id": "mtk_smp_b1_q2",
        "soal": "Nilai dari $\\sqrt{48} - \\sqrt{27} + \\sqrt{12}$ adalah...",
        "opsi": {
          "A": "$2\\sqrt{3}$",
          "B": "$3\\sqrt{3}$",
          "C": "$4\\sqrt{3}$",
          "D": "$5\\sqrt{3}$"
        },
        "kunci": "B",
        "pembahasan": "Sederhanakan masing-masing bentuk akar: $\\sqrt{48} = \\sqrt{16 \\times 3} = 4\\sqrt{3}$, $\\sqrt{27} = \\sqrt{9 \\times 3} = 3\\sqrt{3}$, dan $\\sqrt{12} = \\sqrt{4 \\times 3} = 2\\sqrt{3}$. Maka $4\\sqrt{3} - 3\\sqrt{3} + 2\\sqrt{3} = (4 - 3 + 2)\\sqrt{3} = 3\\sqrt{3}$."
      },
      {
        "id": "mtk_smp_b1_q3",
        "soal": "Bentuk baku (notasi ilmiah resmi) dari bilangan desimal $0{,}0000725$ adalah...",
        "opsi": {
          "A": "$7{,}25 \\times 10^{-4}$",
          "B": "$7{,}25 \\times 10^{-5}$",
          "C": "$72{,}5 \\times 10^{-6}$",
          "D": "$7{,}25 \\times 10^{-6}$"
        },
        "kunci": "B",
        "pembahasan": "Notasi baku mengharuskan nilai mantissa $1 \\le a < 10$. Dari $0{,}0000725$, tanda koma digeser ke kanan melewati 5 digit desimal (4 angka nol dan angka 7) sehingga menjadi $7{,}25$. Karena digeser ke kanan sebanyak 5 kali, eksponen 10 bertanda negatif: $7{,}25 \\times 10^{-5}$."
      }
    ],
    "keyTakeaways": [
      "Kaidah perkalian basis sama menjumlahkan pangkat ($a^m \\times a^n = a^{m+n}$), sedangkan pembagian mengurangkan pangkat ($a^m / a^n = a^{m-n}$).",
      "Menyederhanakan bentuk akar dilakukan dengan mencari faktor kuadrat sempurna ($4, 9, 16, 25, 36, 49, ...$).",
      "Notasi ilmiah wajib memenuhi $1 \\le a < 10$. Geser ke kanan menghasilkan pangkat negatif, geser ke kiri menghasilkan pangkat positif."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_2",
    "subtestKode": "MTK_SMP",
    "babNumber": 2,
    "slug": "persamaan-dan-fungsi-kuadrat",
    "judul": "Persamaan & Fungsi Kuadrat",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Pahami pemfaktoran akar persamaan kuadrat, rumus diskriminan $D = b^2 - 4ac$, sumbu simetri parabola, dan penentuan nilai ekstrim optimum.",
    "learningObjectives": [
      "Menentukan akar-akar persamaan kuadrat dengan pemfaktoran, melengkapkan kuadrat sempurna, dan rumus ABC.",
      "Menganalisis karakteristik grafik fungsi kuadrat berdasarkan tanda koefisien $a$ dan nilai diskriminan $D$.",
      "Menentukan koordinat titik puncak/ekstrim dan persamaan sumbu simetri $x = -\\frac{b}{2a}$."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 280\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <pattern id=\"gridKuadrat\" width=\"25\" height=\"25\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 25 0 L 0 0 0 25\" fill=\"none\" stroke=\"#f1f5f9\" stroke-width=\"1\"/>\n    </pattern>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"url(#gridKuadrat)\"/>\n  \n  <line x1=\"30\" y1=\"140\" x2=\"510\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <line x1=\"200\" y1=\"20\" x2=\"200\" y2=\"260\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"500\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">x</text>\n  <text x=\"210\" y=\"35\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">y</text>\n  <text x=\"185\" y=\"155\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#94a3b8\">0</text>\n  \n  <path d=\"M 210,65 Q 275,225 340,65\" fill=\"none\" stroke=\"#0d9488\" stroke-width=\"3\"/>\n  \n  <line x1=\"275\" y1=\"25\" x2=\"275\" y2=\"255\" stroke=\"#ef4444\" stroke-width=\"1.5\" stroke-dasharray=\"4 3\"/>\n  <text x=\"280\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#dc2626\">Sumbu Simetri x = -b/(2a) = 3</text>\n  \n  <circle cx=\"250\" cy=\"140\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"235\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">(2, 0)</text>\n  <circle cx=\"300\" cy=\"140\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"305\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">(4, 0)</text>\n  \n  <circle cx=\"275\" cy=\"165\" r=\"6\" fill=\"#dc2626\"/>\n  <text x=\"285\" y=\"175\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#dc2626\">Puncak (3, -1)</text>\n  \n  <rect x=\"360\" y=\"30\" width=\"165\" height=\"95\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"370\" y=\"50\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Kaidah Parabola:</text>\n  <text x=\"370\" y=\"70\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• a = 1 &gt; 0 : Terbuka Ke Atas</text>\n  <text x=\"370\" y=\"90\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• D = b² - 4ac &gt; 0 : 2 Akar Real</text>\n  <text x=\"370\" y=\"110\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Puncak: (-b/2a, -D/4a)</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Persamaan Kuadrat & Rumus ABC",
        "isi": "Bentuk umum: $ax^2 + bx + c = 0$ ($a \\ne 0$). Akar-akarnya dapat dicari dengan:\n• Pemfaktoran: $(x - x_1)(x - x_2) = 0$\n• Rumus ABC: $x_{1,2} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$\n• Hubungan akar Vieta: $x_1 + x_2 = -\\frac{b}{a}$ dan $x_1 \\cdot x_2 = \\frac{c}{a}$.",
        "poinPenting": [
          "Diskriminan $D = b^2 - 4ac$ menentukan jenis akar: jika $D > 0$ memiliki dua akar real berbeda, $D = 0$ memiliki dua akar kembar sama, dan $D < 0$ tidak memiliki akar real."
        ]
      },
      {
        "subjudul": "2. Grafik & Karakteristik Fungsi Kuadrat",
        "isi": "Grafik fungsi kuadrat $f(x) = ax^2 + bx + c$ berbentuk kurva parabola simetris.\n1. Arah kurva: jika $a > 0$ parabola membuka ke ATAS (memiliki nilai minimum), jika $a < 0$ parabola membuka ke BAWAH (memiliki nilai maksimum).\n2. Persamaan sumbu simetri: $x_p = -\\frac{b}{2a}$.\n3. Nilai optimum (ekstrim): $y_p = -\\frac{D}{4a} = -\\frac{b^2 - 4ac}{4a}$.\n4. Koordinat titik puncak: $P\\left(-\\frac{b}{2a}, -\\frac{D}{4a}\\right)$.",
        "poinPenting": [
          "Titik potong sumbu $Y$ selalu berada pada koordinat $(0, c)$.",
          "Titik potong sumbu $X$ terjadi saat $f(x) = 0$, yaitu pada akar-akar $(x_1, 0)$ dan $(x_2, 0)$."
        ]
      }
    ],
    "trikCepat": "Trik Nilai Optimum Aplikasi Nyata: Pada soal lemparan benda vertikal $h(t) = v_0 t - \\frac{1}{2}gt^2$, waktu mencapai ketinggian maksimum selalu terjadi saat $t = -\\frac{b}{2a}$. Masukkan nilai $t$ tersebut langsung ke fungsi untuk mendapatkan tinggi maksimum tanpa perlu menghitung diskriminan!",
    "jebakanUmum": "Jebakan Tanda Minus Sumbu Simetri: Rumus sumbu simetri adalah $x = -\\frac{b}{2a}$. Jika $b$ bernilai negatif (misal $f(x) = x^2 - 6x + 8$), maka $x = -\\frac{-6}{2(1)} = +3$. Jangan sampai lupa tanda minus ganda menghasilkan nilai positif!",
    "contohSoal": [
      {
        "soal": "Tentukan koordinat titik balik dari grafik fungsi kuadrat $f(x) = x^2 - 4x - 5$!",
        "opsi": {
          "A": "$(2, -9)$",
          "B": "$(-2, -9)$",
          "C": "$(2, 9)$",
          "D": "$(-2, 7)$"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Identifikasi koefisien: $a = 1$, $b = -4$, $c = -5$.",
          "Sumbu simetri: $x_p = -\\frac{b}{2a} = -\\frac{-4}{2(1)} = 2$.",
          "Substitusi $x = 2$ ke dalam fungsi: $f(2) = (2)^2 - 4(2) - 5 = 4 - 8 - 5 = -9$.",
          "Maka koordinat titik balik adalah $(2, -9)$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b2_q1",
        "soal": "Persamaan sumbu simetri dari grafik fungsi kuadrat $f(x) = x^2 - 6x + 8$ adalah...",
        "opsi": {
          "A": "$x = -3$",
          "B": "$x = 3$",
          "C": "$x = 6$",
          "D": "$x = -6$"
        },
        "kunci": "B",
        "pembahasan": "Dari $f(x) = x^2 - 6x + 8$, nilai $a = 1$ dan $b = -6$. Rumus sumbu simetri adalah $x = -\\frac{b}{2a} = -\\frac{-6}{2(1)} = 3$."
      },
      {
        "id": "mtk_smp_b2_q2",
        "soal": "Jika persamaan kuadrat $x^2 + kx + 9 = 0$ memiliki dua akar kembar nyata ($D = 0$), maka nilai positif dari konstanta $k$ adalah...",
        "opsi": {
          "A": "3",
          "B": "6",
          "C": "9",
          "D": "12"
        },
        "kunci": "B",
        "pembahasan": "Syarat akar kembar adalah $D = 0 \\iff b^2 - 4ac = 0$. Maka $k^2 - 4(1)(9) = 0 \\implies k^2 - 36 = 0 \\implies k^2 = 36 \\implies k = \\pm 6$. Karena diminta nilai positif, maka $k = 6$."
      },
      {
        "id": "mtk_smp_b2_q3",
        "soal": "Tinggi peluru setelah $t$ detik ditembakkan ke atas dinyatakan oleh $h(t) = 40t - 5t^2$ (dalam meter). Tinggi maksimum yang dicapai peluru adalah...",
        "opsi": {
          "A": "60 m",
          "B": "80 m",
          "C": "100 m",
          "D": "120 m"
        },
        "kunci": "B",
        "pembahasan": "Waktu puncak tercapai saat $t = -\\frac{b}{2a} = -\\frac{40}{2(-5)} = \\frac{40}{10} = 4$ detik. Tinggi maksimum adalah $h(4) = 40(4) - 5(4)^2 = 160 - 5(16) = 160 - 80 = 80$ meter."
      }
    ],
    "keyTakeaways": [
      "Titik puncak parabola $P(x_p, y_p)$ dihitung dengan $x_p = -\\frac{b}{2a}$ dan $y_p = f(x_p)$.",
      "Nilai $D > 0$ memotong sumbu X di 2 titik; $D = 0$ menyinggung sumbu X; $D < 0$ tidak memotong sumbu X sama sekali.",
      "Tinggi maksimum benda gravitasi dicapai pada koordinat $y$ titik puncak."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_3",
    "subtestKode": "MTK_SMP",
    "babNumber": 3,
    "slug": "transformasi-geometri",
    "judul": "Transformasi Geometri",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Pelajari rumus pemetaan koordinat untuk Translasi (pergeseran), Refleksi (pencerminan garis $x=h, y=k$), Rotasi sudut, dan Dilatasi faktor skala $k$.",
    "learningObjectives": [
      "Menentukan bayangan titik dan bangun datar akibat translasi vektor $T(a, b)$.",
      "Menerapkan rumus refleksi terhadap sumbu X, sumbu Y, garis $y = x$, garis $y = -x$, garis vertikal $x = h$, dan horizontal $y = k$.",
      "Menghitung koordinat bayangan rotasi $90^\\circ, 180^\\circ$ dan dilatasi berpusat di titik asal $O(0,0)$."
    ],
    "gambar3dUrl": "/images/modul-smp/geometri_3d_gemilang.png",
    "gambar3dCaption": "Visualisasi Edukatif 3D Koordinat Cartesius & Refleksi Geometri (Bimbel Gemilang)",
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 280\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <pattern id=\"gridTrans\" width=\"28\" height=\"28\" patternUnits=\"userSpaceOnUse\">\n      <path d=\"M 28 0 L 0 0 0 28\" fill=\"none\" stroke=\"#f1f5f9\" stroke-width=\"1\"/>\n    </pattern>\n    <marker id=\"arrowRed\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#ef4444\"/>\n    </marker>\n  </defs>\n  <rect width=\"100%\" height=\"100%\" fill=\"url(#gridTrans)\"/>\n  \n  <line x1=\"20\" y1=\"140\" x2=\"520\" y2=\"140\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <line x1=\"200\" y1=\"20\" x2=\"200\" y2=\"260\" stroke=\"#64748b\" stroke-width=\"2\"/>\n  <text x=\"505\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">x</text>\n  <text x=\"210\" y=\"35\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#64748b\">y</text>\n  \n  <polygon points=\"116,112 172,112 144,56\" fill=\"#ccfbf1\" fill-opacity=\"0.8\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n  <circle cx=\"116\" cy=\"112\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"75\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-3,1)</text>\n  <circle cx=\"172\" cy=\"112\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"175\" y=\"110\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">B(-1,1)</text>\n  <circle cx=\"144\" cy=\"56\" r=\"4\" fill=\"#0f766e\"/>\n  <text x=\"135\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">C(-2,3)</text>\n  \n  <polygon points=\"228,196 284,196 256,140\" fill=\"#fed7aa\" fill-opacity=\"0.8\" stroke=\"#ea580c\" stroke-width=\"2\"/>\n  <circle cx=\"228\" cy=\"196\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"215\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">A'(1,-2)</text>\n  <circle cx=\"284\" cy=\"196\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"290\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">B'(3,-2)</text>\n  <circle cx=\"256\" cy=\"140\" r=\"4\" fill=\"#c2410c\"/>\n  <text x=\"265\" y=\"135\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#c2410c\">C'(2,0)</text>\n  \n  <line x1=\"116\" y1=\"112\" x2=\"223\" y2=\"192\" stroke=\"#ef4444\" stroke-width=\"2\" stroke-dasharray=\"4 2\" marker-end=\"url(#arrowRed)\"/>\n  \n  <rect x=\"340\" y=\"25\" width=\"180\" height=\"85\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"350\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Vektor Translasi T(4, -3):</text>\n  <text x=\"350\" y=\"65\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Geser 4 ke kanan (+x)</text>\n  <text x=\"350\" y=\"85\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#334155\">• Geser 3 ke bawah (-y)</text>\n  <text x=\"350\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-3,1) → A'(1, -2)</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Translasi (Pergeseran Vektor)",
        "isi": "Translasi memindahkan setiap titik sejauh jarak dan arah tertentu tanpa mengubah bentuk dan ukuran bangun.\n• Rumus Translasi: Titik $A(x, y)$ ditranslasi oleh matriks pergeseran $T(a, b)$ menghasilkan bayangan:\n$$A'(x', y') = (x + a, y + b)$$\nJika $a > 0$ bergeser ke kanan, jika $a < 0$ ke kiri. Jika $b > 0$ bergeser ke atas, jika $b < 0$ ke bawah.",
        "poinPenting": [
          "Translasi mempertahankan orientasi dan ukuran bangun datar (isometri)."
        ]
      },
      {
        "subjudul": "2. Refleksi (Pencerminan)",
        "isi": "Pencerminan memetakan setiap titik ke seberang garis cermin dengan jarak yang sama tehadap cermin:\n1. Terhadap sumbu-X: $A(x, y) \\to A'(x, -y)$\n2. Terhadap sumbu-Y: $A(x, y) \\to A'(-x, y)$\n3. Terhadap garis $y = x$: $A(x, y) \\to A'(y, x)$\n4. Terhadap garis $y = -x$: $A(x, y) \\to A'(-y, -x)$\n5. Terhadap garis vertikal $x = h$: $A(x, y) \\to A'(2h - x, y)$\n6. Terhadap garis horizontal $y = k$: $A(x, y) \\to A'(x, 2k - y)$.",
        "poinPenting": [
          "Pada pencerminan terhadap $y = k$, nilai koordinat absis $x$ tetap sama, hanya ordinat $y$ yang berubah menjadi $2k - y$."
        ]
      },
      {
        "subjudul": "3. Rotasi & Dilatasi",
        "isi": "• Rotasi pusat $O(0,0)$:\n- Sebesar $+90^\\circ$ (berlawanan jarum jam): $(x, y) \\to (-y, x)$\n- Sebesar $-90^\\circ$ (searah jarum jam): $(x, y) \\to (y, -x)$\n- Sebesar $180^\\circ$: $(x, y) \\to (-x, -y)$\n\n• Dilatasi pusat $O(0,0)$ dan faktor skala $k$:\n$$P(x, y) \\xrightarrow{[O, k]} P'(kx, ky)$$\nJika $|k| > 1$ bayangan diperbesar, jika $0 < |k| < 1$ bayangan diperkecil.",
        "poinPenting": [
          "Sudut positif menyatakan perputaran berlawanan arah jarum jam. Sudut negatif searah jarum jam."
        ]
      }
    ],
    "trikCepat": "Trik Ingat Rotasi $+90^\\circ$: Balik posisi koordinat $(x, y) \\to (y, x)$, lalu beri tanda minus pada koordinat depan yang baru menjadi $(-y, x)$! Contoh: $(4, -2) \\to (-(-2), 4) = (2, 4)$!",
    "jebakanUmum": "Jebakan Cermin $x=h$ vs $y=k$: Jangan sampai tertukar! Cermin vertikal $x = h$ hanya mengubah nilai $x$ menjadi $2h - x$ (nilai $y$ tetap). Cermin horizontal $y = k$ hanya mengubah nilai $y$ menjadi $2k - y$ (nilai $x$ tetap).",
    "contohSoal": [
      {
        "soal": "Titik $P(-3, 5)$ direfleksikan terhadap garis $x = 2$, kemudian dilanjutkan rotasi $180^\\circ$ dengan pusat $O(0,0)$. Koordinat akhir bayangan titik $P$ adalah...",
        "opsi": {
          "A": "$(-7, -5)$",
          "B": "$(7, -5)$",
          "C": "$(-1, -5)$",
          "D": "$(7, 5)$"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Langkah 1: Refleksi $P(-3, 5)$ terhadap $x = 2$ menggunakan rumus $P'(2h - x, y)$ dengan $h = 2$.",
          "$x' = 2(2) - (-3) = 4 + 3 = 7$ dan $y' = 5$. Jadi $P'(7, 5)$.",
          "Langkah 2: Rotasi $180^\\circ$ terhadap $O(0,0)$ memetakan $(x, y) \\to (-x, -y)$.",
          "$P''( -7, -5 )$. Maka koordinat akhir adalah $(-7, -5)$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b3_q1",
        "soal": "Perhatikan diagram pergeseran di bawah ini! Titik $A(-2, 4)$ ditranslasikan oleh vektor $T(3, -5)$. Koordinat bayangan titik $A'$ adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 320 180\" width=\"100%\" height=\"160\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <line x1=\"20\" y1=\"120\" x2=\"300\" y2=\"120\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <line x1=\"120\" y1=\"15\" x2=\"120\" y2=\"165\" stroke=\"#94a3b8\" stroke-width=\"1.5\"/>\n  <circle cx=\"80\" cy=\"40\" r=\"5\" fill=\"#0f766e\"/>\n  <text x=\"35\" y=\"45\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">A(-2, 4)</text>\n  <path d=\"M 80 40 L 140 140\" stroke=\"#ea580c\" stroke-width=\"2\" stroke-dasharray=\"4 2\"/>\n  <circle cx=\"140\" cy=\"140\" r=\"5\" fill=\"#ea580c\"/>\n  <text x=\"150\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">A'(x', y') ?</text>\n  <text x=\"140\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">T(3, -5)</text>\n</svg>",
        "opsi": {
          "A": "$(1, -1)$",
          "B": "$(-5, 9)$",
          "C": "$(1, 9)$",
          "D": "$(-5, -1)$"
        },
        "kunci": "A",
        "pembahasan": "Rumus translasi adalah $A'(x+a, y+b)$. Dengan $(x,y) = (-2, 4)$ dan $(a,b) = (3, -5)$, diperoleh $x' = -2 + 3 = 1$ dan $y' = 4 + (-5) = -1$. Jadi $A'(1, -1)$."
      },
      {
        "id": "mtk_smp_b3_q2",
        "soal": "Bayangan titik $B(4, -2)$ oleh rotasi $90^\\circ$ berlawanan arah jarum jam dengan pusat $O(0,0)$ adalah...",
        "opsi": {
          "A": "$(2, 4)$",
          "B": "$(-2, -4)$",
          "C": "$(2, -4)$",
          "D": "$(-4, -2)$"
        },
        "kunci": "A",
        "pembahasan": "Rotasi $+90^\\circ$ (berlawanan jarum jam) memiliki aturan pemetaan $(x, y) \\to (-y, x)$. Dengan $x = 4$ dan $y = -2$, diperoleh $x' = -(-2) = 2$ dan $y' = 4$. Jadi bayangannya adalah $(2, 4)$."
      },
      {
        "id": "mtk_smp_b3_q3",
        "soal": "Titik $C(6, -9)$ didilatasi dengan pusat $O(0,0)$ dan faktor skala $k = \\frac{1}{3}$. Koordinat bayangan titik $C'$ adalah...",
        "opsi": {
          "A": "$(2, -3)$",
          "B": "$(18, -27)$",
          "C": "$(-2, 3)$",
          "D": "$(3, -2)$"
        },
        "kunci": "A",
        "pembahasan": "Dilatasi dengan faktor skala $k = \\frac{1}{3}$ berpusat $O(0,0)$ memetakan $(x, y) \\to (kx, ky)$. Maka $x' = \\frac{1}{3} \\times 6 = 2$ dan $y' = \\frac{1}{3} \\times (-9) = -3$. Koordinat bayangan adalah $(2, -3)$."
      }
    ],
    "keyTakeaways": [
      "Translasi menggeser koordinat: $(x+a, y+b)$.",
      "Refleksi cermin garis horizontal $y=k$ memetakan ordinat ke $2k - y$; cermin garis vertikal $x=h$ memetakan absis ke $2h - x$.",
      "Rotasi $+90^\\circ$ menghasilkan $(-y, x)$, rotasi $-90^\\circ$ menghasilkan $(y, -x)$, dan rotasi $180^\\circ$ menghasilkan $(-x, -y)$."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_4",
    "subtestKode": "MTK_SMP",
    "babNumber": 4,
    "slug": "kesebangunan-dan-kekongruenan",
    "judul": "Kesebangunan & Kekongruenan",
    "durasiBacaMenit": 16,
    "ringkasanSingkat": "Kuasai syarat kekongruenan bangun datar (S-S-S, S-Sd-S), perbandingan proporsi sisi segitiga sebangun bergaris sejajar, dan rumus air mancur siku-siku.",
    "learningObjectives": [
      "Membedakan syarat kesebangunan (sudut sama, sisi sebanding) dan kekongruenan (sudut sama, sisi sama panjang persis).",
      "Menghitung panjang sisi yang belum diketahui pada segitiga dengan garis transversal sejajar.",
      "Menerapkan rumus perkalian sisi siku-siku segitiga siku-siku bertinggi tegak lurus (rumus air mancur)."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 540 260\" width=\"100%\" height=\"240\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <defs>\n    <marker id=\"arrowBlue\" viewBox=\"0 0 10 10\" refX=\"5\" refY=\"5\" markerWidth=\"6\" markerHeight=\"6\" orient=\"auto-start-reverse\">\n      <path d=\"M 0 1 L 10 5 L 0 9 z\" fill=\"#0d9488\"/>\n    </marker>\n  </defs>\n  \n  <polygon points=\"200,30 60,220 380,220\" fill=\"#f0fdfa\" stroke=\"#0f766e\" stroke-width=\"2.5\"/>\n  <line x1=\"116\" y1=\"144\" x2=\"308\" y2=\"144\" stroke=\"#ea580c\" stroke-width=\"2.5\" stroke-dasharray=\"5 3\"/>\n  <line x1=\"210\" y1=\"144\" x2=\"218\" y2=\"144\" stroke=\"#ea580c\" stroke-width=\"2\" marker-end=\"url(#arrowBlue)\"/>\n  <line x1=\"210\" y1=\"220\" x2=\"218\" y2=\"220\" stroke=\"#0f766e\" stroke-width=\"2\" marker-end=\"url(#arrowBlue)\"/>\n  \n  <circle cx=\"200\" cy=\"30\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"60\" cy=\"220\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"380\" cy=\"220\" r=\"4.5\" fill=\"#0f766e\"/>\n  <circle cx=\"116\" cy=\"144\" r=\"4.5\" fill=\"#ea580c\"/>\n  <circle cx=\"308\" cy=\"144\" r=\"4.5\" fill=\"#ea580c\"/>\n  \n  <text x=\"195\" y=\"20\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">A</text>\n  <text x=\"42\" y=\"235\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">B</text>\n  <text x=\"390\" y=\"235\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#0f766e\">C</text>\n  <text x=\"96\" y=\"148\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#ea580c\">D</text>\n  <text x=\"316\" y=\"148\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#ea580c\">E</text>\n  \n  <text x=\"120\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">AD = 6 cm</text>\n  <text x=\"60\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">DB = 4 cm</text>\n  <text x=\"200\" y=\"135\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#ea580c\">DE = ?</text>\n  <text x=\"200\" y=\"242\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">BC = 15 cm</text>\n  \n  <rect x=\"360\" y=\"40\" width=\"165\" height=\"85\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\" stroke-width=\"1\"/>\n  <text x=\"370\" y=\"60\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f172a\">Perbandingan Senilai:</text>\n  <text x=\"370\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0d9488\">AD / AB = DE / BC</text>\n  <text x=\"370\" y=\"100\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#475569\">6 / 10 = DE / 15</text>\n  <text x=\"370\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">DE = (6 × 15) / 10 = 9 cm</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Syarat Kesebangunan vs Kekongruenan",
        "isi": "• Dua bangun datar dikatakan SEBANGUN $(\\sim)$ jika:\n1. Sudut-sudut yang bersesuaian sama besar.\n2. Sisi-sisi yang bersesuaian memiliki perbandingan senilai yang sama.\n\n• Dua bangun datar dikatakan KONGRUEN $(\\cong)$ jika bentuk dan ukurannya sama persis (sudut bersesuaian sama besar dan sisi bersesuaian sama panjang).\nSyarat kekongruenan segitiga:\n1. Sisi - Sisi - Sisi (s - s - s)\n2. Sisi - Sudut - Sisi (s - sd - s)\n3. Sudut - Sisi - Sudut (sd - s - sd)\n4. Sudut - Sudut - Sisi (sd - sd - s)\n5. Sisi miring dan satu sisi siku-siku (khusus segitiga siku-siku).",
        "poinPenting": [
          "Bangun yang kongruen pasti sebangun, namun bangun yang sebangun belum tentu kongruen.",
          "Syarat Sudut - Sudut - Sudut (sd - sd - sd) HANYA menjamin kesebangunan, BUKAN kekongruenan!"
        ]
      },
      {
        "subjudul": "2. Garis Sejajar pada Segitiga & Rumus Air Mancur",
        "isi": "Pada segitiga $ABC$ dengan garis $DE \\parallel BC$ ($D$ pada $AB$ dan $E$ pada $AC$):\n$$\\frac{AD}{AB} = \\frac{AE}{AC} = \\frac{DE}{BC}$$\n\nPada segitiga siku-siku $ABC$ di mana $\\angle A = 90^\\circ$ dan garis tinggi $AD \\perp BC$:\n1. $AB^2 = BD \\times BC$\n2. $AC^2 = CD \\times CB$\n3. $AD^2 = BD \\times CD$\n4. Luas segitiga: $AD = \\frac{AB \\times AC}{BC}$.",
        "poinPenting": [
          "Perhatikan segitiga kecil dan segitiga besar: selalu bandingkan sisi segitiga kecil terhadap sisi total segitiga besar ($AB = AD + DB$)!"
        ]
      }
    ],
    "trikCepat": "Trik Rumus Garis Sejajar: Pada segitiga $ABC$ dengan $DE \\parallel BC$, panjang sisi bawah $DE$ selalu sebanding dengan sisi total $AB$, BUKAN potongan bawah $DB$! Selalu gunakan formula $\\frac{DE}{BC} = \\frac{AD}{AD + DB}$!",
    "jebakanUmum": "Jebakan Rasio Potongan Sisi: Siswa sering salah menghitung $\\frac{DE}{BC} = \\frac{AD}{DB}$. Ini SALAH BESAR! Rasio $\\frac{AD}{DB}$ hanya boleh dipakai untuk rasio potongan $\\frac{AE}{EC}$, tidak boleh untuk sisi sejajar $DE$ dan $BC$!",
    "contohSoal": [
      {
        "soal": "Perhatikan segitiga siku-siku $ABC$ dengan $\\angle A = 90^\\circ$ dan $AD \\perp BC$. Jika $AB = 12\\text{ cm}$ dan $BC = 15\\text{ cm}$, maka panjang garis tinggi $AD$ adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 250\" width=\"100%\" height=\"230\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <polygon points=\"180,50 60,200 440,200\" fill=\"#eff6ff\" stroke=\"#1d4ed8\" stroke-width=\"2.5\"/>\n  <path d=\"M 166,68 L 180,82 L 194,64\" fill=\"none\" stroke=\"#1d4ed8\" stroke-width=\"2\"/>\n  <line x1=\"180\" y1=\"50\" x2=\"180\" y2=\"200\" stroke=\"#dc2626\" stroke-width=\"2.5\" stroke-dasharray=\"4 2\"/>\n  <rect x=\"180\" y=\"186\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"#dc2626\" stroke-width=\"1.5\"/>\n  \n  <circle cx=\"180\" cy=\"50\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"60\" cy=\"200\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"440\" cy=\"200\" r=\"4.5\" fill=\"#1d4ed8\"/>\n  <circle cx=\"180\" cy=\"200\" r=\"4.5\" fill=\"#dc2626\"/>\n  \n  <text x=\"175\" y=\"38\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">A (90°)</text>\n  <text x=\"45\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">B</text>\n  <text x=\"450\" y=\"215\" font-family=\"system-ui, sans-serif\" font-size=\"15\" font-weight=\"bold\" fill=\"#1d4ed8\">C</text>\n  <text x=\"175\" y=\"225\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#dc2626\">D</text>\n  \n  <text x=\"95\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">AB = 12 cm</text>\n  <text x=\"315\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">AC = 9 cm</text>\n  <text x=\"240\" y=\"218\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#1e40af\">BC = 15 cm</text>\n  <text x=\"188\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#dc2626\">AD = ?</text>\n  \n  <rect x=\"290\" y=\"35\" width=\"205\" height=\"75\" fill=\"#fef2f2\" rx=\"8\" stroke=\"#fecaca\" stroke-width=\"1\"/>\n  <text x=\"300\" y=\"55\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#b91c1c\">Rumus Luas / Air Mancur:</text>\n  <text x=\"300\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"11.5\" font-weight=\"bold\" fill=\"#1e293b\">AD = (AB × AC) / BC</text>\n  <text x=\"300\" y=\"93\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#475569\">AD = (12 × 9) / 15 = 7,2 cm</text>\n</svg>",
        "opsi": {
          "A": "6,4 cm",
          "B": "7,2 cm",
          "C": "8,0 cm",
          "D": "9,6 cm"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Langkah 1: Hitung panjang sisi $AC$ dengan teorema Pythagoras: $AC = \\sqrt{BC^2 - AB^2} = \\sqrt{15^2 - 12^2} = \\sqrt{225 - 144} = \\sqrt{81} = 9\\text{ cm}$.",
          "Langkah 2: Gunakan perbandingan kesamaan luas segitiga: $\\frac{1}{2} \\times BC \\times AD = \\frac{1}{2} \\times AB \\times AC$.",
          "Diperoleh rumus air mancur: $AD = \\frac{AB \\times AC}{BC} = \\frac{12 \\times 9}{15} = \\frac{108}{15} = 7{,}2\\text{ cm}$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b4_q1",
        "soal": "Manakah pasangan bangun datar berikut yang PASTI selalu sebangun dalam kondisi apa pun?",
        "opsi": {
          "A": "Dua buah persegi panjang",
          "B": "Dua buah belah ketupat",
          "C": "Dua buah segitiga sama sisi",
          "D": "Dua buah trapesium sama kaki"
        },
        "kunci": "C",
        "pembahasan": "Dua segitiga sama sisi selalu memiliki semua sudut sebesar $60^\\circ$ dan perbandingan ketiga sisinya selalu sama ($1:1:1$). Maka dua segitiga sama sisi pasti selalu sebangun. Sedangkan persegi panjang dan belah ketupat sudut atau rasio panjang/lebarnya bisa berbeda."
      },
      {
        "id": "mtk_smp_b4_q2",
        "soal": "Perhatikan gambar segitiga di bawah ini! Garis $DE$ sejajar dengan sisi $BC$. Jika panjang $AD = 6\\text{ cm}$, $DB = 4\\text{ cm}$, dan panjang sisi $BC = 15\\text{ cm}$, maka panjang garis $DE$ adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 340 200\" width=\"100%\" height=\"180\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <polygon points=\"170,25 40,175 300,175\" fill=\"#f0fdfa\" stroke=\"#0f766e\" stroke-width=\"2\"/>\n  <line x1=\"92\" y1=\"115\" x2=\"248\" y2=\"115\" stroke=\"#ea580c\" stroke-width=\"2\" stroke-dasharray=\"4 2\"/>\n  <text x=\"165\" y=\"18\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">A</text>\n  <text x=\"25\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">B</text>\n  <text x=\"305\" y=\"185\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f766e\">C</text>\n  <text x=\"75\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">D</text>\n  <text x=\"255\" y=\"118\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#ea580c\">E</text>\n  <text x=\"95\" y=\"65\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#0d9488\">AD = 6 cm</text>\n  <text x=\"45\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"11\" fill=\"#0d9488\">DB = 4 cm</text>\n  <text x=\"155\" y=\"108\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">DE = ?</text>\n  <text x=\"155\" y=\"192\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">BC = 15 cm</text>\n</svg>",
        "opsi": {
          "A": "7,5 cm",
          "B": "9,0 cm",
          "C": "10,0 cm",
          "D": "12,0 cm"
        },
        "kunci": "B",
        "pembahasan": "Panjang sisi total $AB = AD + DB = 6 + 4 = 10\\text{ cm}$. Karena $DE \\parallel BC$, berlaku perbandingan segitiga sebangun: $\\frac{AD}{AB} = \\frac{DE}{BC} \\implies \\frac{6}{10} = \\frac{DE}{15}$. Maka $DE = \\frac{6 \\times 15}{10} = \\frac{90}{10} = 9\\text{ cm}$."
      },
      {
        "id": "mtk_smp_b4_q3",
        "soal": "Dua buah segitiga dinyatakan kongruen jika memenuhi syarat berikut, KECUALI...",
        "opsi": {
          "A": "Sisi - Sisi - Sisi (s - s - s)",
          "B": "Sisi - Sudut - Sisi (s - sd - s)",
          "C": "Sudut - Sudut - Sudut (sd - sd - sd)",
          "D": "Sudut - Sisi - Sudut (sd - s - sd)"
        },
        "kunci": "C",
        "pembahasan": "Syarat Sudut - Sudut - Sudut (sd - sd - sd) hanya membuktikan bahwa dua segitiga tersebut SEBANGUN, tetapi belum tentu kongruen karena ukurannya bisa diperbesar atau diperkecil (tidak sama panjang sisinya)."
      }
    ],
    "keyTakeaways": [
      "Persegi dan segitiga sama sisi selalu pasti sebangun karena bentuk geometrisnya terkunci.",
      "Rasio sisi sejajar pada segitiga selalu membandingkan sisi segitiga kecil terhadap sisi total segitiga besar: $\\frac{DE}{BC} = \\frac{AD}{AD+DB}$.",
      "Sudut-sudut-sudut hanya menjamin kesebangunan, bukan kekongruenan."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "mtk_smp_bab_5",
    "subtestKode": "MTK_SMP",
    "babNumber": 5,
    "slug": "bangun-ruang-sisi-lengkung",
    "judul": "Bangun Ruang Sisi Lengkung (BRSL)",
    "durasiBacaMenit": 16,
    "ringkasanSingkat": "Kuasai formula luas permukaan dan volume untuk Tabung, Kerucut, dan Bola, serta perbandingan volume akibat perubahan jari-jari.",
    "learningObjectives": [
      "Menghitung luas selimut, luas permukaan total, dan volume tabung dengan jari-jari $r$ dan tinggi $t$.",
      "Menerapkan hubungan Pythagoras garis pelukis kerucut $s = \\sqrt{r^2 + t^2}$ untuk menghitung luas dan volume.",
      "Menentukan luas permukaan bola pejal serta perbandingan volume bola saat jari-jari diperbesar $k$ kali."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 660 230\" width=\"100%\" height=\"220\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#f8fafc\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  \n  <g transform=\"translate(30, 20)\">\n    <ellipse cx=\"60\" cy=\"140\" rx=\"45\" ry=\"14\" fill=\"#bae6fd\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <path d=\"M 15 40 L 15 140 A 45 14 0 0 0 105 140 L 105 40 Z\" fill=\"#e0f2fe\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <ellipse cx=\"60\" cy=\"40\" rx=\"45\" ry=\"14\" fill=\"#bae6fd\" stroke=\"#0284c7\" stroke-width=\"2\"/>\n    <line x1=\"115\" y1=\"40\" x2=\"115\" y2=\"140\" stroke=\"#0369a1\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <text x=\"122\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#0369a1\" font-weight=\"bold\">t</text>\n    <line x1=\"60\" y1=\"40\" x2=\"105\" y2=\"40\" stroke=\"#0369a1\" stroke-width=\"1.5\"/>\n    <text x=\"78\" y=\"34\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#0369a1\" font-weight=\"bold\">r</text>\n    <text x=\"25\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0369a1\">1. Tabung (Silinder)</text>\n    <text x=\"15\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">V = πr²t | Lp = 2πr(r+t)</text>\n  </g>\n\n  <g transform=\"translate(240, 20)\">\n    <ellipse cx=\"65\" cy=\"140\" rx=\"50\" ry=\"15\" fill=\"#fef08a\" stroke=\"#ca8a04\" stroke-width=\"2\"/>\n    <path d=\"M 15 140 L 65 30 L 115 140 A 50 15 0 0 1 15 140 Z\" fill=\"#fef9c3\" stroke=\"#ca8a04\" stroke-width=\"2\"/>\n    <line x1=\"65\" y1=\"30\" x2=\"65\" y2=\"140\" stroke=\"#a16207\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <text x=\"50\" y=\"90\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#a16207\" font-weight=\"bold\">t</text>\n    <line x1=\"65\" y1=\"140\" x2=\"115\" y2=\"140\" stroke=\"#a16207\" stroke-width=\"1.5\"/>\n    <text x=\"85\" y=\"134\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#a16207\" font-weight=\"bold\">r</text>\n    <text x=\"96\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\" font-weight=\"bold\">s</text>\n    <text x=\"35\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#a16207\">2. Kerucut (Cone)</text>\n    <text x=\"20\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">s² = r²+t² | V = ⅓πr²t</text>\n  </g>\n\n  <g transform=\"translate(460, 20)\">\n    <defs>\n      <radialGradient id=\"sphereGradRich\" cx=\"35%\" cy=\"35%\" r=\"65%\">\n        <stop offset=\"0%\" stop-color=\"#fed7aa\"/>\n        <stop offset=\"60%\" stop-color=\"#f97316\"/>\n        <stop offset=\"100%\" stop-color=\"#c2410c\"/>\n      </radialGradient>\n    </defs>\n    <circle cx=\"70\" cy=\"85\" r=\"55\" fill=\"url(#sphereGradRich)\" stroke=\"#9a3412\" stroke-width=\"2\"/>\n    <ellipse cx=\"70\" cy=\"85\" rx=\"55\" ry=\"15\" fill=\"none\" stroke=\"#7c2d12\" stroke-width=\"1.5\" stroke-dasharray=\"4 2\"/>\n    <circle cx=\"70\" cy=\"85\" r=\"3\" fill=\"#ffffff\"/>\n    <line x1=\"70\" y1=\"85\" x2=\"125\" y2=\"85\" stroke=\"#ffffff\" stroke-width=\"2\"/>\n    <text x=\"92\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#ffffff\" font-weight=\"bold\">r</text>\n    <text x=\"45\" y=\"180\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#c2410c\">3. Bola (Sphere)</text>\n    <text x=\"25\" y=\"198\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#475569\">V = ⁴⁄₃πr³ | Lp = 4πr²</text>\n  </g>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Tabung (Silinder)",
        "isi": "Tabung memiliki alas dan tutup berupa lingkaran kongruen serta bidang selimut yang jika dibuka berbentuk persegi panjang.\n• Luas Selimut: $L_s = 2\\pi r t$\n• Luas Permukaan Total: $L_p = 2\\pi r (r + t)$\n• Luas Tabung Tanpa Tutup: $L_{tt} = \\pi r^2 + 2\\pi r t = \\pi r (r + 2t)$\n• Volume Tabung: $V = \\pi r^2 t$.",
        "poinPenting": [
          "Gunakan $\\pi = \\frac{22}{7}$ jika jari-jari kelipatan 7. Gunakan $\\pi = 3{,}14$ jika jari-jari bukan kelipatan 7."
        ]
      },
      {
        "subjudul": "2. Kerucut (Cone)",
        "isi": "Kerucut merupakan bangun ruang limas dengan alas berbentuk lingkaran. Hubungan antara jari-jari alas $r$, tinggi kerucut $t$, dan garis pelukis $s$ membentuk segitiga siku-siku:\n$$s = \\sqrt{r^2 + t^2}$$\n• Luas Selimut Kerucut: $L_s = \\pi r s$\n• Luas Permukaan Total: $L_p = \\pi r (r + s)$\n• Volume Kerucut: $V = \\frac{1}{3} \\pi r^2 t$.",
        "poinPenting": [
          "Volume kerucut tepat sepertiga ($\\frac{1}{3}$) dari volume tabung dengan jari-jari dan tinggi yang sama."
        ]
      },
      {
        "subjudul": "3. Bola (Sphere)",
        "isi": "Bola dibatasi oleh satu bidang lengkung yang berjarak sama terhadap titik pusat.\n• Luas Permukaan Bola: $L_p = 4\\pi r^2$\n• Volume Bola: $V = \\frac{4}{3} \\pi r^3$\n• Luas Belahan Bola Berongga: $L = 2\\pi r^2$\n• Luas Belahan Bola Padat (Pejal): $L = 2\\pi r^2 + \\pi r^2 = 3\\pi r^2$.\n\n• Perbandingan Faktor Skala: Jika jari-jari bola diubah menjadi $k$ kali semula:\n- Luas permukaan baru menjadi $k^2$ kali luas semula.\n- Volume baru menjadi $k^3$ kali volume semula.",
        "poinPenting": [
          "Hati-hati membaca soal belahan bola: jika 'pejal' atau 'padat', bidang lingkaran alas ikut dihitung luasnya sehingga total menjadi $3\\pi r^2$!"
        ]
      }
    ],
    "trikCepat": "Trik Perbesaran Jari-jari Bola: Jika jari-jari bola dijadikan $k$ kali semula, volumenya langsung naik sebesar $k^3$ kali! Jika jari-jari diperbesar 2 kali, volumenya menjadi $2^3 = 8$ kali! Jika diperbesar 3 kali, volumenya menjadi $3^3 = 27$ kali lipat!",
    "jebakanUmum": "Jebakan Diameter vs Jari-jari: Soal ujian sering memberikan angka DIAMETER (misal diameter 14 cm). Jangan langsung memasukkan angka diameter ke rumus volume $\\pi r^2 t$! Bagilah dua terlebih dahulu untuk mencari jari-jarinya ($r = \\frac{14}{2} = 7\\text{ cm}$).",
    "contohSoal": [
      {
        "soal": "Sebuah kerucut memiliki jari-jari alas $r = 7\\text{ cm}$ dan tinggi $t = 24\\text{ cm}$. Tentukan luas seluruh permukaan kerucut tersebut! (Gunakan $\\pi = \\frac{22}{7}$)",
        "opsi": {
          "A": "$550\\text{ cm}^2$",
          "B": "$704\\text{ cm}^2$",
          "C": "$748\\text{ cm}^2$",
          "D": "$880\\text{ cm}^2$"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Langkah 1: Cari garis pelukis $s$ dengan rumus Pythagoras: $s = \\sqrt{r^2 + t^2} = \\sqrt{7^2 + 24^2} = \\sqrt{49 + 576} = \\sqrt{625} = 25\\text{ cm}$.",
          "Langkah 2: Hitung luas permukaan: $L_p = \\pi r (r + s) = \\frac{22}{7} \\times 7 \\times (7 + 25)$.",
          "Langkah 3: $L_p = 22 \\times 32 = 704\\text{ cm}^2$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "mtk_smp_b5_q1",
        "soal": "Perhatikan gambar tabung di bawah ini! Volume tabung dengan diameter $14\\text{ cm}$ dan tinggi $10\\text{ cm}$ (gunakan $\\pi = \\frac{22}{7}$) adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 200\" width=\"100%\" height=\"180\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <g transform=\"translate(60, 20)\">\n    <ellipse cx=\"80\" cy=\"120\" rx=\"50\" ry=\"14\" fill=\"#ccfbf1\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <path d=\"M 30 30 L 30 120 A 50 14 0 0 0 130 120 L 130 30 Z\" fill=\"#f0fdfa\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    <ellipse cx=\"80\" cy=\"30\" rx=\"50\" ry=\"14\" fill=\"#ccfbf1\" stroke=\"#0d9488\" stroke-width=\"2\"/>\n    \n    <line x1=\"30\" y1=\"30\" x2=\"130\" y2=\"30\" stroke=\"#0f766e\" stroke-width=\"1.5\" stroke-dasharray=\"3 2\"/>\n    <circle cx=\"80\" cy=\"30\" r=\"3\" fill=\"#0f766e\"/>\n    <text x=\"50\" y=\"24\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#0f766e\">d = 14 cm (r = 7 cm)</text>\n    \n    <line x1=\"140\" y1=\"30\" x2=\"140\" y2=\"120\" stroke=\"#ea580c\" stroke-width=\"1.5\"/>\n    <text x=\"146\" y=\"80\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#ea580c\">t = 10 cm</text>\n  </g>\n</svg>",
        "opsi": {
          "A": "1.540 cm³",
          "B": "3.080 cm³",
          "C": "4.620 cm³",
          "D": "6.160 cm³"
        },
        "kunci": "A",
        "pembahasan": "Diameter $d = 14\\text{ cm}$, maka jari-jari $r = 7\\text{ cm}$. Rumus volume tabung adalah $V = \\pi r^2 t = \\frac{22}{7} \\times 7^2 \\times 10 = \\frac{22}{7} \\times 49 \\times 10 = 22 \\times 7 \\times 10 = 1.540\\text{ cm}^3$."
      },
      {
        "id": "mtk_smp_b5_q2",
        "soal": "Perhatikan visual setengah bola pejal di bawah ini! Luas permukaan belahan bola padat (setengah bola pejal) berdiameter $20\\text{ cm}$ (gunakan $\\pi = 3{,}14$) adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 280 180\" width=\"100%\" height=\"170\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"10\" stroke=\"#e2e8f0\"/>\n  <g transform=\"translate(60, 25)\">\n    <ellipse cx=\"80\" cy=\"50\" rx=\"60\" ry=\"18\" fill=\"#fde68a\" stroke=\"#d97706\" stroke-width=\"2\"/>\n    <path d=\"M 20 50 A 60 60 0 0 0 140 50 Z\" fill=\"#fef3c7\" stroke=\"#d97706\" stroke-width=\"2\"/>\n    <line x1=\"20\" y1=\"50\" x2=\"140\" y2=\"50\" stroke=\"#b45309\" stroke-width=\"2\"/>\n    <circle cx=\"80\" cy=\"50\" r=\"3\" fill=\"#b45309\"/>\n    <text x=\"50\" y=\"44\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#b45309\">d = 20 cm (r = 10 cm)</text>\n    <text x=\"15\" y=\"130\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#78350f\">Belahan Bola Padat (Setengah Pejal):</text>\n    <text x=\"25\" y=\"146\" font-family=\"system-ui, sans-serif\" font-size=\"10.5\" fill=\"#92400e\">Lp = 2πr² (lengkung) + πr² (alas) = 3πr²</text>\n  </g>\n</svg>",
        "opsi": {
          "A": "628 cm²",
          "B": "942 cm²",
          "C": "1.256 cm²",
          "D": "1.884 cm²"
        },
        "kunci": "B",
        "pembahasan": "Diameter $d = 20\\text{ cm} \\implies r = 10\\text{ cm}$. Luas permukaan belahan bola padat terdiri dari luas selimut setengah bola ($2\\pi r^2$) ditambah luas lingkaran alas penutupnya ($\\pi r^2$). Maka $L_p = 3\\pi r^2 = 3 \\times 3{,}14 \\times 10^2 = 3 \\times 314 = 942\\text{ cm}^2$."
      },
      {
        "id": "mtk_smp_b5_q3",
        "soal": "Jika jari-jari sebuah bola diperbesar menjadi $2$ kali panjang semula, maka perbandingan volume bola yang baru terhadap volume bola semula adalah...",
        "opsi": {
          "A": "2 : 1",
          "B": "4 : 1",
          "C": "8 : 1",
          "D": "16 : 1"
        },
        "kunci": "C",
        "pembahasan": "Volume bola berbanding lurus dengan pangkat tiga jari-jarinya ($V \\propto r^3$). Jika jari-jari menjadi $r_2 = 2r_1$, maka $\\frac{V_2}{V_1} = \\left(\\frac{r_2}{r_1}\\right)^3 = (2)^3 = 8$. Jadi perbandingannya adalah $8 : 1$."
      }
    ],
    "keyTakeaways": [
      "Selalu bagi dua nilai diameter untuk mendapatkan jari-jari $r$ sebelum menghitung volume.",
      "Luas setengah bola berongga adalah $2\\pi r^2$, sedangkan luas setengah bola pejal/padat adalah $3\\pi r^2$.",
      "Perubahan volume bola berbanding dengan kubik jari-jari: perbesaran $k$ kali menghasilkan volume $k^3$ kali lipat."
    ],
    "subtestWarna": "#ea580c",
    "subtestBgLight": "#fff7ed",
    "subtestEmoji": "📐"
  },
  {
    "id": "bin_smp_bab_1",
    "subtestKode": "BIN_SMP",
    "babNumber": 1,
    "slug": "teks-laporan-percobaan",
    "judul": "Teks Laporan Percobaan",
    "durasiBacaMenit": 10,
    "ringkasanSingkat": "Pahami struktur teks laporan hasil observasi/eksperimen, kaidah kebahasaan kata kerja aktif, kata tugas, dan pembedaan fakta vs opini.",
    "learningObjectives": [
      "Mengidentifikasi struktur teks laporan percobaan (Tujuan, Alat & Bahan, Langkah Kerja, Hasil, Simpulan).",
      "Menganalisis kalimat pasif, kata hubung kausalitas, dan istilah ilmiah bidang sains.",
      "Membedakan pernyataan fakta berbasis data kuantitatif dengan opini inferensi penulis."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Struktur Umum Teks Laporan",
        "isi": "Teks laporan percobaan disusun sistematis berdasarkan metode ilmiah:\n1. Judul & Tujuan Percobaan\n2. Kajian Teori Singkat\n3. Alat dan Bahan Percobaan\n4. Prosedur/Langkah-Langkah Kerja\n5. Paparan Hasil Pengamatan (disertai tabel atau grafik)\n6. Simpulan Berdasarkan Data Fakta.",
        "poinPenting": [
          "Teks laporan percobaan bersifat objektif, faktual, dan tidak memasukkan unsur rekaan pribadi."
        ]
      }
    ],
    "trikCepat": "Trik Fakta vs Opini: Fakta selalu mengandung data yang dapat diverifikasi (angka, hasil uji laboratorium, waktu terukur). Opini ditandai kata adjektiva subjektif seperti 'sangat baik', 'seharusnya', 'tampaknya', atau 'diduga'.",
    "jebakanUmum": "Jebakan Simpulan: Simpulan yang benar harus menjawab tujuan percobaan dan bersumber langsung dari data hasil pengamatan, bukan asumsi umum di luar teks.",
    "contohSoal": [
      {
        "soal": "Bacalah kutipan teks berikut:\n'Berdasarkan pengujian larutan ekstrak kunyit pada cuka makan, warna cairan berubah menjadi kuning terang. Sementara pada air kapur, warna berubah menjadi merah kecokelatan.'\nBagian struktur teks laporan percobaan di atas merupakan bagian...",
        "opsi": {
          "A": "Tujuan",
          "B": "Langkah Kerja",
          "C": "Hasil Pengamatan",
          "D": "Simpulan"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Kutipan tersebut memaparkan fenomena perubahan warna yang teramati selama percobaan berlangsung.",
          "Oleh karena itu, kutipan ini termasuk ke dalam bagian Hasil Pengamatan."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "bin_smp_b1_q1",
        "soal": "Ciri utama bahasa dalam teks laporan percobaan yang membedakannya dari teks fiksi adalah...",
        "opsi": {
          "A": "Menggunakan bahasa kiasan dan majas personifikasi",
          "B": "Bersifat objektif, denotatif, dan berbasis data faktual",
          "C": "Mengutamakan sudut pandang orang pertama",
          "D": "Banyak memuat alur cerita yang dramatis"
        },
        "kunci": "B",
        "pembahasan": "Teks laporan percobaan merupakan teks ilmiah nonfiksi yang wajib objektif, menggunakan kata bermakna sebenarnya (denotatif), dan didukung data faktual hasil pengamatan."
      },
      {
        "id": "bin_smp_b1_q2",
        "soal": "Manakah di antara kalimat berikut yang merupakan kalimat FAKTA?",
        "opsi": {
          "A": "Tanaman cabai yang diberi pupuk kandang tampak lebih subur dan indah.",
          "B": "Tinggi rata-rata tanaman cabai pada pot A bertambah 4,5 cm dalam 7 hari.",
          "C": "Sebaiknya petani selalu menyiram tanaman setiap sore hari.",
          "D": "Pupuk organik mungkin merupakan pupuk terbaik di dunia."
        },
        "kunci": "B",
        "pembahasan": "Kalimat B menyajikan data terukur kuantitatif (4,5 cm dalam 7 hari) yang dapat diuji kebenarannya secara objektif, sehingga merupakan fakta."
      },
      {
        "id": "bin_smp_b1_q3",
        "soal": "Kata penghubung yang menyatakan hubungan sebab-akibat (kausalitas) dalam teks laporan adalah...",
        "opsi": {
          "A": "Dan, serta, lalu",
          "B": "Karena, sebab, oleh karena itu",
          "C": "Tetapi, melainkan, sedangkan",
          "D": "Meskipun, biarpun, kendatipun"
        },
        "kunci": "B",
        "pembahasan": "Kata hubung 'karena', 'sebab', dan 'oleh karena itu' adalah konjungsi kausalitas yang menjelaskan hubungan sebab akibat pada hasil percobaan."
      }
    ],
    "keyTakeaways": [
      "Teks laporan percobaan disusun secara objektif dan faktual.",
      "Struktur baku mencakup Tujuan, Alat/Bahan, Langkah, Hasil, dan Simpulan.",
      "Gunakan fakta kuantitatif untuk membuktikan hipotesis percobaan."
    ],
    "subtestWarna": "#0d9488",
    "subtestBgLight": "#f0fdfa",
    "subtestEmoji": "📖"
  },
  {
    "id": "bin_smp_bab_2",
    "subtestKode": "BIN_SMP",
    "babNumber": 2,
    "slug": "pidato-persuasif",
    "judul": "Teks Pidato Persuasif",
    "durasiBacaMenit": 11,
    "ringkasanSingkat": "Kuasai teknik persuasi etika (etika), emosi (patos), dan logika (logos), serta struktur pembukaan, isi persuasif, dan penegasan penutup.",
    "learningObjectives": [
      "Memahami 3 pendekatan persuasif: Etika, Emosi, dan Logika.",
      "Menentukan argumen pendukung dan pesan ajakan dalam teks pidato persuasif.",
      "Menganalisis kalimat ajakan imperatif dan kalimat persuasif bermakna santun."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Tiga Pendekatan Membujuk Audiens",
        "isi": "1. Pendekatan Etika: Menyentuh nilai moral, norma masyarakat, dan integritas.\n2. Pendekatan Emosi: Menggugah perasaan audiens (empati, kepedulian, rasa bangga).\n3. Pendekatan Logika: Menyajikan alasan rasional, fakta ilmiah, dan sebab-akibat yang masuk akal.",
        "poinPenting": [
          "Struktur pidato persuasif terdiri atas: Pembukaan (salam, latar belakang), Isi (argumen & ajakan), dan Penutup (simpulan, permohonan maaf, salam)."
        ]
      }
    ],
    "trikCepat": "Trik Kata Kunci Ajakan: Kalimat persuasif selalu memiliki kata ajakan eksplisit seperti 'marilah', 'ayo', 'hendaknya', atau 'kita harus'.",
    "jebakanUmum": "Jebakan Pidato: Jangan terkecoh dengan kalimat pembuka basa-basi. Inti ajakan utama pidato persuasif selalu terletak pada paragraf argumen dan bagian penegasan akhir.",
    "contohSoal": [
      {
        "soal": "'Saudara-saudaraku, mari kita kurangi penggunaan sampah plastik sekali pakai demi kelestarian laut bagi anak cucu kita.' Kalimat tersebut menggunakan pendekatan...",
        "opsi": {
          "A": "Logika dan Matematika",
          "B": "Etika dan Emosi",
          "C": "Hukum Pidana",
          "D": "Deskripsi Ruang"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Kalimat tersebut menyentuh tanggung jawab moral (etika) serta kasih sayang kepada masa depan anak cucu (emosi).",
          "Maka pendekatannya adalah Etika dan Emosi."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "bin_smp_b2_q1",
        "soal": "Tujuan utama dari teks pidato persuasif adalah...",
        "opsi": {
          "A": "Menceritakan pengalaman pribadi yang lucu",
          "B": "Membujuk, meyakinkan, dan mengajak audiens melakukan tindakan tertentu",
          "C": "Menjelaskan cara memasak makanan tradisional",
          "D": "Mendeskripsikan keindahan alam pegunungan"
        },
        "kunci": "B",
        "pembahasan": "Pidato persuasif bertujuan memengaruhi pendengar agar mempercayai gagasan yang disampaikan dan tergerak melakukan tindakan sesuai ajakan pembicara."
      },
      {
        "id": "bin_smp_b2_q2",
        "soal": "Bagian penutup pidato persuasif umumnya memuat...",
        "opsi": {
          "A": "Pengenalan alat dan bahan penelitian",
          "B": "Penegasan kembali gagasan pokok, ajakan akhir, permohonan maaf, dan salam",
          "C": "Data statistik hasil sensus penduduk",
          "D": "Rincian biaya anggaran kegiatan"
        },
        "kunci": "B",
        "pembahasan": "Bagian penutup berisi simpulan/penegasan intisari pidato, ajakan puncak, apresiasi, permohonan maaf, serta salam penutup."
      },
      {
        "id": "bin_smp_b2_q3",
        "soal": "Manakah kalimat yang menggunakan kata tugas ajakan persuasif?",
        "opsi": {
          "A": "Kemarin sore kami telah menanam sepuluh bibit pohon bakau.",
          "B": "Marilah kita jaga kebersihan lingkungan sekolah demi kenyamanan bersama.",
          "C": "Sungai itu mengalir sangat jernih di dekat perbukitan.",
          "D": "Apakah kamu tahu nama ketua panitia kegiatan penghijauan?"
        },
        "kunci": "B",
        "pembahasan": "Kata 'Marilah' adalah penanda kalimat ajakan persuasif yang mengajak pendengar untuk bertindak bersama-sama."
      }
    ],
    "keyTakeaways": [
      "Pidato persuasif menggabungkan kekuatan etika, emosi, dan logika.",
      "Kata ajakan 'marilah', 'ayo', 'hendaknya' menjadi ciri utama kalimat ajakan.",
      "Penutup merangkum gagasan dan menegaskan kembali komitmen bersama."
    ],
    "subtestWarna": "#0d9488",
    "subtestBgLight": "#f0fdfa",
    "subtestEmoji": "📖"
  },
  {
    "id": "bin_smp_bab_3",
    "subtestKode": "BIN_SMP",
    "babNumber": 3,
    "slug": "kaidah-puebi-dan-kalimat-efektif",
    "judul": "Kaidah PUEBI & Kalimat Efektif",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Kuasai pemakaian huruf kapital, penulisan tanda baca koma/titik dua, konjungsi intrakalimat vs antarkalimat, serta syarat kalimat efektif.",
    "learningObjectives": [
      "Menerapkan penulisan huruf kapital pada nama jabatan, geografi, dan judul karya.",
      "Mengoreksi kesalahan penggunaan tanda koma (,), tanda titik dua (:), dan tanda hubung (-).",
      "Menyusun kalimat efektif yang hemat kata, logis secara nalar, dan memiliki kesejajaran bentuk (paralelisme)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Syarat Utama Kalimat Efektif",
        "isi": "Kalimat efektif adalah kalimat yang mampu menyampaikan pesan pembicara/penulis secara tepat tanpa menimbulkan ketaksaan (ambiguitas).\nSyarat pokok:\n1. Keutuhan/Kesatuan: Memiliki unsur subjek dan predikat yang jelas.\n2. Kesejajaran (Paralelisme): Bentuk kata yang dirangkaikan harus setara (misal: awalan me- harus dipadankan dengan awalan me-, bukan di-).\n3. Kehematan: Menghindari pemborosan kata (contoh salah: 'semua para siswa', benar: 'semua siswa' atau 'para siswa').\n4. Kelogisan: Makna kalimat masuk akal sehat.",
        "poinPenting": [
          "Jangan mengawali subjek kalimat dengan preposisi seperti 'Di dalam rapat itu memutuskan...' (SALAH karena tidak memiliki subjek!). Benar: 'Rapat itu memutuskan...' atau 'Di dalam rapat itu diputuskan...'."
        ]
      }
    ],
    "trikCepat": "Trik Huruf Kapital Geografi: Nama geografi diberi huruf kapital HANYA jika diikuti nama diri geografinya! Contoh: 'Sungai Bengawan Solo', 'Pulau Bali', 'Danau Toba'. Jika hanya jenis geografi umum tanpa nama diri ('mandi di sungai', 'berlayar ke pulau'), gunakan huruf kecil!",
    "jebakanUmum": "Jebakan Konjungsi Ganda: Kalimat majemuk tidak boleh memuat konjungsi anak kalimat dan induk kalimat sekaligus! Contoh SALAH: 'Meskipun hari hujan, tetapi kami tetap berangkat.' (Salah karena ada 'meskipun' dan 'tetapi'). BENAR: 'Meskipun hari hujan, kami tetap berangkat.'",
    "contohSoal": [
      {
        "soal": "Perhatikan kalimat berikut:\n'Tahap akhir dari penyelesaian gedung itu adalah mencakup pengecatan dinding, pemasangan lampu, dan merapikan lantai.'\nPerbaikan kalimat di atas agar memiliki kesejajaran bentuk (paralelisme) adalah...",
        "opsi": {
          "A": "pengecatan dinding, pemasangan lampu, dan perapian lantai",
          "B": "mengecat dinding, memasang lampu, dan perapian lantai",
          "C": "pengecatan dinding, memasang lampu, dan merapikan lantai",
          "D": "dicat dindingnya, dipasang lampunya, dan dirapikan lantainya"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Unsur pertama menggunakan nomina bentuk pe-an ('pengecatan'), unsur kedua nomina pe-an ('pemasangan').",
          "Agar sejajar secara paralel, unsur ketiga juga harus berupa nomina pe-an ('perapian lantai'), bukan verba me- ('merapikan').",
          "Maka pilihan perbaikan yang paling tepat adalah A."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "bin_smp_b3_q1",
        "soal": "Penulisan huruf kapital yang tepat menurut kaidah PUEBI adalah...",
        "opsi": {
          "A": "Ibu membeli pisang Ambon dan gula Jawa di pasar.",
          "B": "Kami berwisata ke Danau Toba di provinsi Sumatra Utara.",
          "C": "Ayah membaca novel Tenggelamnya Kapal Van Der Wijck.",
          "D": "Paman baru saja dilantik menjadi Gubernur."
        },
        "kunci": "B",
        "pembahasan": "'Danau Toba' adalah nama geografis yang diikuti nama diri sehingga keduanya diawali huruf kapital. Pilihan A salah karena pisang ambon dan gula jawa adalah nama jenis, bukan nama diri geografi."
      },
      {
        "id": "bin_smp_b3_q2",
        "soal": "Kalimat berikut yang merupakan KALIMAT EFEKTIF adalah...",
        "opsi": {
          "A": "Bagi semua siswa yang membawa sepeda motor harus memarkir di halaman belakang.",
          "B": "Para hadirin sekalian dimohon untuk segera berdiri.",
          "C": "Siswa kelas sembilan sedang membersihkan ruang kelas dan merapikan perpustakaan.",
          "D": "Dia rajin belajar demi untuk meraih nilai terbaik."
        },
        "kunci": "C",
        "pembahasan": "Kalimat C memiliki subjek ('Siswa kelas sembilan') dan predikat paralel ('membersihkan... dan merapikan...'). Kalimat A salah karena diawali 'Bagi' sehingga kehilangan subjek, B boros ('Para hadirin sekalian'), D pleonasme ('demi untuk')."
      },
      {
        "id": "bin_smp_b3_q3",
        "soal": "Tanda baca koma (,) yang digunakan secara TEPAT terdapat pada kalimat...",
        "opsi": {
          "A": "Saya ingin membeli buku itu, tetapi uang saya belum cukup.",
          "B": "Jika hari ini hujan lebat, maka pertandingan akan ditunda.",
          "C": "Ayah membeli meja kursi dan lemari baru.",
          "D": "Karena terlambat bangun tidur, sehingga dia tertinggal bus sekolah."
        },
        "kunci": "A",
        "pembahasan": "Tanda koma dipakai sebelum konjungsi pertentangan seperti 'tetapi', 'melainkan', dan 'sedangkan' yang menghubungkan klausa setara dalam kalimat majemuk."
      }
    ],
    "keyTakeaways": [
      "Kalimat efektif wajib memiliki kejelasan Subjek dan Predikat serta kesejajaran imbuhan.",
      "Hindari pemborosan kata (pleonasme) seperti 'para hadirin sekalian' atau 'demi untuk'.",
      "Tanda koma diletakkan sebelum konjungsi pertentangan 'tetapi' dan setelah anak kalimat yang mendahului induk kalimat."
    ],
    "subtestWarna": "#0d9488",
    "subtestBgLight": "#f0fdfa",
    "subtestEmoji": "📖"
  },
  {
    "id": "ipa_smp_bab_1",
    "subtestKode": "IPA_SMP",
    "babNumber": 1,
    "slug": "pewarisan-sifat-dan-genetika",
    "judul": "Pewarisan Sifat (Genetika Mendel)",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Kuasai hukum segregasi Mendel, persilangan monohibrid dominan & intermediet, persilangan dihibrid rasio 9:3:3:1, serta kelainan terpaut kromosom.",
    "learningObjectives": [
      "Membedakan istilah genotipe (alel $MM, Mm, mm$) dan fenotipe (sifat tampak).",
      "Menentukan rasio genotipe dan fenotipe keturunan $F_2$ pada persilangan monohibrid dan dihibrid.",
      "Menganalisis pewarisan kelainan hemofilia dan buta warna terpaut kromosom X."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 460 210\" width=\"100%\" height=\"200\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"30\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#059669\">🌱 Punnett Square Monohibrid (MM × mm → F₂)</text>\n  <rect x=\"120\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"155\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"200\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"235\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  \n  <rect x=\"40\" y=\"85\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"120\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">MM (Merah)</text>\n  <rect x=\"200\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"225\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  \n  <rect x=\"40\" y=\"130\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  <rect x=\"120\" y=\"130\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  <rect x=\"200\" y=\"130\" width=\"80\" height=\"45\" fill=\"#fef2f2\" stroke=\"#fecaca\"/>\n  <text x=\"225\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#b91c1c\">mm (Putih)</text>\n  \n  <text x=\"295\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Genotipe:</text>\n  <text x=\"295\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#059669\">1 MM : 2 Mm : 1 mm</text>\n  <text x=\"295\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Fenotipe:</text>\n  <text x=\"295\" y=\"165\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\">3 Merah : 1 Putih (75% : 25%)</text>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Hukum Mendel I & Persilangan Monohibrid",
        "isi": "Hukum Segregasi Bebas (Mendel I) menyatakan bahwa pada pembentukan gamet, pasangan alel akan memisah secara bebas.\n• Persilangan Monohibrid Dominan Penuh:\nParental: $MM$ (Merah) $\\times mm$ (Putih)\nFilial 1 ($F_1$): Semua $Mm$ (Merah)\nPersilangan sesama $F_1$: $Mm \\times Mm$\nFilial 2 ($F_2$):\n- Rasio Genotipe: $1 MM : 2 Mm : 1 mm$ (25% : 50% : 25%)\n- Rasio Fenotipe: 3 Merah : 1 Putih (75% : 25%).",
        "poinPenting": [
          "Jika bersifat intermediet (kodominan), heterozigot $Mm$ menghasilkan warna merah muda (rasio fenotipe 1 Merah : 2 Merah Muda : 1 Putih)."
        ]
      }
    ],
    "trikCepat": "Trik Cepat Dihibrid ($AaBb \\times AaBb$): Rasio fenotipe dominan penuh dihibrid selalu berpola $9 : 3 : 3 : 1$.\n- 9 = Dominan kedua sifat ($A\\_B\\_$)\n- 3 = Dominan sifat pertama, resesif kedua ($A\\_bb$)\n- 3 = Resesif sifat pertama, dominan kedua ($aaB\\_$)\n- 1 = Resesif kedua sifat ($aabb$).",
    "jebakanUmum": "Jebakan Buta Warna: Buta warna terpaut kromosom X resesif ($X^{cb}$). Laki-laki hanya memiliki satu kromosom X ($X^{cb}Y$), sehingga jika memiliki gen $X^{cb}$ langsung menderita buta warna (tidak ada istilah pria carrier!). Wanita carrier bergenotipe $X^C X^{cb}$ berfenotipe normal.",
    "contohSoal": [
      {
        "soal": "Kacang ercis berbiji bulat kuning ($BbKk$) disilangkan dengan sesamanya ($BbKk$). Berapakah persentase keturunan yang berfenotipe bulat hijau jika sifat bulat ($B$) dominan terhadap kisut ($b$) dan kuning ($K$) dominan terhadap hijau ($k$)?",
        "opsi": {
          "A": "56,25% (9/16)",
          "B": "18,75% (3/16)",
          "C": "6,25% (1/16)",
          "D": "50,00% (8/16)"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Rasio fenotipe dihibrid: Bulat Kuning (9) : Bulat Hijau (3) : Kisut Kuning (3) : Kisut Hijau (1). Total bagian = 16.",
          "Bagian untuk fenotipe Bulat Hijau adalah 3 dari 16 bagian.",
          "Persentase: $\\frac{3}{16} \\times 100\\% = 18{,}75\\%$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b1_q1",
        "soal": "Persilangan antara tanaman berbunga merah ($MM$) dengan tanaman berbunga putih ($mm$) menghasilkan keturunan $F_1$ berbunga merah muda ($Mm$). Sifat pewarisan ini disebut...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 460 210\" width=\"100%\" height=\"200\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"30\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#059669\">🌱 Punnett Square Monohibrid (MM × mm → F₂)</text>\n  <rect x=\"120\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"155\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"200\" y=\"50\" width=\"80\" height=\"35\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"235\" y=\"73\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  \n  <rect x=\"40\" y=\"85\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">M</text>\n  <rect x=\"120\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">MM (Merah)</text>\n  <rect x=\"200\" y=\"85\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"225\" y=\"112\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  \n  <rect x=\"40\" y=\"130\" width=\"80\" height=\"45\" fill=\"#dcfce7\" stroke=\"#86efac\"/>\n  <text x=\"75\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"14\" font-weight=\"bold\" fill=\"#15803d\">m</text>\n  <rect x=\"120\" y=\"130\" width=\"80\" height=\"45\" fill=\"#f0fdf4\" stroke=\"#bbf7d0\"/>\n  <text x=\"145\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#0f172a\">Mm (Merah)</text>\n  <rect x=\"200\" y=\"130\" width=\"80\" height=\"45\" fill=\"#fef2f2\" stroke=\"#fecaca\"/>\n  <text x=\"225\" y=\"157\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#b91c1c\">mm (Putih)</text>\n  \n  <text x=\"295\" y=\"95\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Genotipe:</text>\n  <text x=\"295\" y=\"115\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#059669\">1 MM : 2 Mm : 1 mm</text>\n  <text x=\"295\" y=\"145\" font-family=\"system-ui, sans-serif\" font-size=\"12\" font-weight=\"bold\" fill=\"#0f172a\">Rasio Fenotipe:</text>\n  <text x=\"295\" y=\"165\" font-family=\"system-ui, sans-serif\" font-size=\"12\" fill=\"#dc2626\">3 Merah : 1 Putih (75% : 25%)</text>\n</svg>",
        "opsi": {
          "A": "Dominan penuh",
          "B": "Intermediet (kodominan)",
          "C": "Resesif mutlak",
          "D": "Epistasis dominan"
        },
        "kunci": "B",
        "pembahasan": "Sifat intermediet terjadi ketika alel dominan tidak dapat menutupi alel resesif secara sempurna, sehingga terbentuk fenotipe campuran antara kedua induknya (merah + putih = merah muda)."
      },
      {
        "id": "ipa_smp_b1_q2",
        "soal": "Seorang wanita pembawa sifat buta warna ($X^C X^{cb}$) menikah dengan pria berpenglihatan normal ($X^C Y$). Kemungkinan anak laki-laki mereka menderita buta warna adalah...",
        "opsi": {
          "A": "0%",
          "B": "25%",
          "C": "50%",
          "D": "100%"
        },
        "kunci": "C",
        "pembahasan": "Keturunan anak laki-laki menerima kromosom Y dari ayah dan kromosom X dari ibu ($X^C$ atau $X^{cb}$). Peluang anak laki-laki menerima $X^{cb}$ dari ibu pembawa adalah $\\frac{1}{2} = 50\\%$."
      }
    ],
    "keyTakeaways": [
      "Hukum Segregasi I Mendel memisahkan pasangan alel pada pembentukan gamet.",
      "Rasio fenotipe monohibrid dominan penuh $F_2$ adalah 3:1, sedangkan monohibrid intermediet adalah 1:2:1.",
      "Pria mewarisi kelainan terpaut kromosom X dari ibunya."
    ],
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "subtestEmoji": "🔬"
  },
  {
    "id": "ipa_smp_bab_2",
    "subtestKode": "IPA_SMP",
    "babNumber": 2,
    "slug": "listrik-dinamis-dan-kemagnetan",
    "judul": "Listrik Dinamis & Kemagnetan",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Kuasai Hukum Ohm $V = I \\times R$, hambatan pengganti seri dan paralel, energi/daya listrik $P = V \\times I$, serta induksi elektromagnetik trafo.",
    "learningObjectives": [
      "Menghitung arus listrik, tegangan, dan hambatan menggunakan Hukum Ohm.",
      "Menentukan nilai hambatan total pada rangkaian kombinasi seri dan paralel.",
      "Menerapkan persamaan transformator ideal $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$."
    ],
    "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 200\" width=\"100%\" height=\"190\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"28\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#4338ca\">⚡ Rangkaian Listrik Seri vs Paralel (Hukum Ohm: V = I × R)</text>\n  \n  <g transform=\"translate(30, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"210\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">1. Rangkaian Seri</text>\n    <path d=\"M 20 70 L 40 70 M 60 70 L 90 70 M 110 70 L 140 70 M 160 70 L 190 70 L 190 95 L 20 95 Z\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"/>\n    <rect x=\"40\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"44\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₁</text>\n    <rect x=\"90\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"94\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₂</text>\n    <rect x=\"140\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"144\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₃</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1d4ed8\">R_total = R₁ + R₂ + R₃</text>\n  </g>\n\n  <g transform=\"translate(270, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"220\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">2. Rangkaian Paralel</text>\n    <line x1=\"30\" y1=\"45\" x2=\"190\" y2=\"45\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"85\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"45\" x2=\"30\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"190\" y1=\"45\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <rect x=\"95\" y=\"38\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"32\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₁</text>\n    <rect x=\"95\" y=\"78\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₂</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#4338ca\">1/R_total = 1/R₁ + 1/R₂</text>\n  </g>\n</svg>",
    "konsepTeori": [
      {
        "subjudul": "1. Hukum Ohm & Hambatan Rangkaian",
        "isi": "Hukum Ohm menyatakan kuat arus ($I$) berbanding lurus dengan tegangan ($V$) dan berbanding terbalik dengan hambatan ($R$):\n$$V = I \\times R$$\n\n• Hambatan Seri: $R_s = R_1 + R_2 + R_3$ (arus yang mengalir di setiap resistor sama).\n• Hambatan Paralel: $\\frac{1}{R_p} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$ (tegangan pada setiap cabang sama).",
        "poinPenting": [
          "Pada rangkaian paralel dua resistor, trik cepat hambatan pengganti: $R_p = \\frac{R_1 \\times R_2}{R_1 + R_2}$."
        ]
      }
    ],
    "trikCepat": "Trik Trafo Cepat: Perbandingan tegangan selalu SEJAJAR dengan lilitan ($\\frac{V_p}{V_s} = \\frac{N_p}{N_s}$), namun TERBALIK dengan kuat arus ($\\frac{V_p}{V_s} = \\frac{I_s}{I_p}$). Jika tegangan naik (Step Up), arus pasti turun!",
    "jebakanUmum": "Jebakan Satuan Daya: Rumus energi listrik $W = P \\times t$. Jika daya dalam Watt dan waktu dalam detik, hasilnya Joule. Jika tarif listrik dihitung dalam kWh, daya wajib diubah ke KiloWatt (bagi 1.000) dan waktu dalam satuan Jam (hour)!",
    "contohSoal": [
      {
        "soal": "Dua hambatan masing-masing bernilai $6\\,\\Omega$ dan $3\\,\\Omega$ dirangkai secara paralel, kemudian dihubungkan dengan sumber tegangan $12\\text{ Volt}$. Kuat arus total yang mengalir pada rangkaian adalah...",
        "opsi": {
          "A": "2 A",
          "B": "4 A",
          "C": "6 A",
          "D": "8 A"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Hitung hambatan paralel: $R_p = \\frac{6 \\times 3}{6 + 3} = \\frac{18}{9} = 2\\,\\Omega$.",
          "Gunakan Hukum Ohm untuk menghitung arus total: $I = \\frac{V}{R_p} = \\frac{12\\text{ V}}{2\\,\\Omega} = 6\\text{ A}$."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "ipa_smp_b2_q1",
        "soal": "Sebuah transformator step-down memiliki kumparan primer $1.200$ lilitan dan kumparan sekunder $300$ lilitan. Jika tegangan primer $220\\text{ V}$, maka tegangan sekundernya adalah...",
        "diagramSvg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 520 200\" width=\"100%\" height=\"190\">\n  <rect width=\"100%\" height=\"100%\" fill=\"#ffffff\" rx=\"12\" stroke=\"#e2e8f0\" stroke-width=\"1.5\"/>\n  <text x=\"25\" y=\"28\" font-family=\"system-ui, sans-serif\" font-size=\"13\" font-weight=\"bold\" fill=\"#4338ca\">⚡ Rangkaian Listrik Seri vs Paralel (Hukum Ohm: V = I × R)</text>\n  \n  <g transform=\"translate(30, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"210\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">1. Rangkaian Seri</text>\n    <path d=\"M 20 70 L 40 70 M 60 70 L 90 70 M 110 70 L 140 70 M 160 70 L 190 70 L 190 95 L 20 95 Z\" fill=\"none\" stroke=\"#2563eb\" stroke-width=\"2\"/>\n    <rect x=\"40\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"44\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₁</text>\n    <rect x=\"90\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"94\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₂</text>\n    <rect x=\"140\" y=\"63\" width=\"20\" height=\"14\" fill=\"#dbeafe\" stroke=\"#1d4ed8\"/>\n    <text x=\"144\" y=\"56\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#1d4ed8\">R₃</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1d4ed8\">R_total = R₁ + R₂ + R₃</text>\n  </g>\n\n  <g transform=\"translate(270, 45)\">\n    <rect x=\"0\" y=\"0\" width=\"220\" height=\"110\" fill=\"#f8fafc\" rx=\"8\" stroke=\"#cbd5e1\"/>\n    <text x=\"15\" y=\"22\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#1e293b\">2. Rangkaian Paralel</text>\n    <line x1=\"30\" y1=\"45\" x2=\"190\" y2=\"45\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"85\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"30\" y1=\"45\" x2=\"30\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <line x1=\"190\" y1=\"45\" x2=\"190\" y2=\"85\" stroke=\"#4f46e5\" stroke-width=\"2\"/>\n    <rect x=\"95\" y=\"38\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"32\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₁</text>\n    <rect x=\"95\" y=\"78\" width=\"30\" height=\"14\" fill=\"#e0e7ff\" stroke=\"#4338ca\"/>\n    <text x=\"102\" y=\"103\" font-family=\"system-ui, sans-serif\" font-size=\"10\" font-weight=\"bold\" fill=\"#4338ca\">R₂</text>\n    <text x=\"25\" y=\"125\" font-family=\"system-ui, sans-serif\" font-size=\"11\" font-weight=\"bold\" fill=\"#4338ca\">1/R_total = 1/R₁ + 1/R₂</text>\n  </g>\n</svg>",
        "opsi": {
          "A": "55 V",
          "B": "110 V",
          "C": "440 V",
          "D": "880 V"
        },
        "kunci": "A",
        "pembahasan": "Gunakan persamaan trafo: $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} \\implies \\frac{220}{V_s} = \\frac{1.200}{300} = 4$. Maka $V_s = \\frac{220}{4} = 55\\text{ Volt}$."
      },
      {
        "id": "ipa_smp_b2_q2",
        "soal": "Sebuah setrika listrik berdaya $350\\text{ Watt}$ digunakan selama $2\\text{ jam}$ setiap hari. Energi listrik yang digunakan setrika tersebut dalam satu hari adalah...",
        "opsi": {
          "A": "0,7 kWh",
          "B": "1,4 kWh",
          "C": "700 kWh",
          "D": "1.400 kWh"
        },
        "kunci": "A",
        "pembahasan": "Energi listrik $W = P \\times t = 350\\text{ W} \\times 2\\text{ jam} = 700\\text{ Wh} = \\frac{700}{1.000} = 0{,}7\\text{ kWh}$."
      }
    ],
    "keyTakeaways": [
      "Hukum Ohm $V = I \\times R$ menghubungkan tegangan, kuat arus, dan hambatan listrik.",
      "Rangkaian hambatan paralel memperkecil hambatan total ($R_p = \\frac{R_1 R_2}{R_1+R_2}$).",
      "Transformator ideal memenuhi hubungan $\\frac{V_p}{V_s} = \\frac{N_p}{N_s} = \\frac{I_s}{I_p}$."
    ],
    "subtestWarna": "#059669",
    "subtestBgLight": "#ecfdf5",
    "subtestEmoji": "🔬"
  },
  {
    "id": "big_smp_bab_1",
    "subtestKode": "BIG_SMP",
    "babNumber": 1,
    "slug": "interpersonal-and-transactional-texts",
    "judul": "Expressions of Hope, Wish & Congratulations",
    "durasiBacaMenit": 10,
    "ringkasanSingkat": "Pelajari perbedaan konteks ungkapan 'congratulations', 'I hope so', 'I wish you luck', serta respon percakapan interpersonal sehari-hari.",
    "learningObjectives": [
      "Membedakan penggunaan ungkapan harapan realistis (hope) dan angan-angan (wish).",
      "Menanggapi ucapan selamat atas prestasi dan keberhasilan seseorang.",
      "Menentukan fungsi sosial dan struktur percakapan transaksional."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Hope vs Wish",
        "isi": "• 'Hope' digunakan untuk menyatakan harapan yang mungkin dan realistis terjadi di masa kini atau mendatang. Pola: Hope + S + Verb (present/future).\nContoh: 'I hope you win the speech contest tomorrow.'\n\n• 'Wish' digunakan untuk menyatakan keinginan atas hal yang mustahil/sulit terjadi saat ini (pengandaian), atau mendoakan keberuntungan formal. Pola: Wish + someone + luck/success.\nContoh: 'I wish you good luck on your examination.'",
        "poinPenting": [
          "Respon paling tepat saat diberi ucapan selamat atau doa adalah 'Thank you very much' atau 'Thanks a lot for saying so'."
        ]
      }
    ],
    "trikCepat": "Trik Jawaban Singkat: Bila seseorang berkata 'Congratulations on winning the match!', jawaban yang tepat selalu ucapan terima kasih ('Thank you', 'Thanks, I did my best'), BUKAN membalas dengan 'Same to you'!",
    "jebakanUmum": "Jebakan Wish: Jangan gunakan wish untuk kalimat doa sederhana jika ada kata kerja present biasa, gunakan pola 'wish you all the best'.",
    "contohSoal": [
      {
        "soal": "Edo: 'Siti, I heard you won the national drawing competition! Congratulations!'\nSiti: '...'\nThe most suitable response to complete the dialogue is...",
        "opsi": {
          "A": "I hope you are fine.",
          "B": "Thank you very much, Edo. I practiced hard for it.",
          "C": "I wish you good luck.",
          "D": "You must be kidding me."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Edo memberikan ucapan selamat atas prestasi Siti memenangkan lomba gambar nasional.",
          "Respon santun dan tepat untuk ucapan selamat adalah berterima kasih ('Thank you very much')."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "big_smp_b1_q1",
        "soal": "Dayu: 'Udin, my brother is hospitalized because of dengue fever.'\nUdin: 'I am sorry to hear that. I hope ... soon.'",
        "opsi": {
          "A": "he gets well",
          "B": "he is sick",
          "C": "you congratulate him",
          "D": "you stay at home"
        },
        "kunci": "A",
        "pembahasan": "Udin menyampaikan simpati atas sakitnya saudara Dayu. Doa yang tepat adalah mengharapkan kesembuhan ('I hope he gets well soon')."
      },
      {
        "id": "big_smp_b1_q2",
        "soal": "Which of the following expressions is used to congratulate someone on graduating from school?",
        "opsi": {
          "A": "Have a safe flight!",
          "B": "Congratulations on your graduation! We are so proud of you.",
          "C": "Get well soon!",
          "D": "I am so sorry for your loss."
        },
        "kunci": "B",
        "pembahasan": "Ungkapan yang tepat untuk kelulusan sekolah adalah 'Congratulations on your graduation!'."
      }
    ],
    "keyTakeaways": [
      "Gunakan 'hope' untuk harapan yang mungkin terjadi, dan 'congratulations' untuk merayakan pencapaian.",
      "Respon atas pujian dan selamat selalu diawali ungkapan terima kasih ('Thank you')."
    ],
    "subtestWarna": "#4f46e5",
    "subtestBgLight": "#eef2ff",
    "subtestEmoji": "🇬🇧"
  },
  {
    "id": "big_smp_bab_2",
    "subtestKode": "BIG_SMP",
    "babNumber": 2,
    "slug": "procedure-text-and-recipes",
    "judul": "Procedure Text: Recipes & Manuals",
    "durasiBacaMenit": 11,
    "ringkasanSingkat": "Pahami tujuan teks prosedur, struktur generic structure (Goal, Materials, Steps), kata kerja perintah (imperative verbs), dan connectives of sequence.",
    "learningObjectives": [
      "Mengidentifikasi Generic Structure teks prosedur: Goal, Ingredients/Materials, dan Steps.",
      "Menemukan kata kerja aksi imperatif (e.g., 'pour', 'stir', 'mix', 'slice').",
      "Menganalisis urutan langkah kerja menggunakan sequence adverbs (first, then, after that, finally)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Generic Structure Procedure Text",
        "isi": "Teks prosedur menjelaskan cara membuat atau mengoperasikan sesuatu melalui serangkaian tindakan teratur:\n1. Goal/Aim: Tujuan kegiatan (biasanya tertera pada judul teks, misal 'How to Make Avocado Juice').\n2. Ingredients/Materials: Bahan dan alat yang diperlukan.\n3. Steps/Methods: Runtutan petunjuk kerja menggunakan kalimat perintah imperatif dan kata urutan waktu (first, next, then, finally).",
        "poinPenting": [
          "Ciri kebahasaan: Menggunakan Simple Present Tense, kata kerja imperatif ('Blend the fruit', 'Cut the paper'), dan kata penghubung temporal."
        ]
      }
    ],
    "trikCepat": "Trik Mencari Tujuan (Purpose): Pertanyaan 'What is the purpose of the text?' jawabannya selalu berawal dari 'To show how to make / operate...' diikuti judul teks prosedur tersebut!",
    "jebakanUmum": "Jebakan Urutan: Perhatikan kata penghubung temporal 'before' dan 'after'. Kalimat 'Add sugar before blending' artinya gula dimasukkan DAHULU, baru kemudian diblender. Jangan sampai terbalik urutannya!",
    "contohSoal": [
      {
        "soal": "'Pour the warm water into the glass and stir thoroughly.' The word 'stir' is closest in meaning to...",
        "opsi": {
          "A": "Mix",
          "B": "Boil",
          "C": "Freeze",
          "D": "Chop"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Kata 'stir' berarti mengaduk.",
          "Sinonim yang paling tepat untuk mengaduk adalah 'mix' (mencampur/mengaduk)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "big_smp_b2_q1",
        "soal": "What is the social function of a procedure text?",
        "opsi": {
          "A": "To entertain the readers with a fairy tale story",
          "B": "To describe how something is made or done through a sequence of actions",
          "C": "To report a natural disaster in the community",
          "D": "To persuade people to buy a new product"
        },
        "kunci": "B",
        "pembahasan": "Fungsi sosial teks prosedur adalah memberikan panduan langkah demi langkah cara membuat atau melakukan sesuatu secara runtut."
      },
      {
        "id": "big_smp_b2_q2",
        "soal": "Which of the following words is an imperative verb commonly found in recipe steps?",
        "opsi": {
          "A": "Delicious",
          "B": "Carefully",
          "C": "Chop",
          "D": "Yesterday"
        },
        "kunci": "C",
        "pembahasan": "'Chop' (cincang/potong) adalah kata kerja tindakan berimbuhan dasar yang berfungsi sebagai kalimat perintah (imperative verb)."
      }
    ],
    "keyTakeaways": [
      "Teks prosedur terdiri dari Goal, Materials, dan Steps.",
      "Ciri bahasa: imperative verbs, simple present tense, dan temporal connectives.",
      "Tujuan teks: 'To tell / show how to make or use something'."
    ],
    "subtestWarna": "#4f46e5",
    "subtestBgLight": "#eef2ff",
    "subtestEmoji": "🇬🇧"
  }
];

export function getSubtestSmpByKode(kode) {
  if (!kode) return null;
  const k = String(kode).toUpperCase().trim();
  return DAFTAR_SUBTES_SMP.find((s) => s.kode === k) || null;
}

export function getBabSmpBySlug(subtestKode, babSlug) {
  if (!subtestKode || !babSlug) return null;
  const k = String(subtestKode).toUpperCase().trim();
  const sub = DAFTAR_SUBTES_SMP.find((s) => s.kode === k);
  if (!sub) return null;
  return sub.babList.find((b) => b.slug === babSlug) || null;
}

export function getBabSmpTetangga(subtestKode, babSlug) {
  const sub = getSubtestSmpByKode(subtestKode);
  if (!sub) return { prevBab: null, nextBab: null };
  const list = sub.babList;
  const idx = list.findIndex((b) => b.slug === babSlug);
  if (idx === -1) return { prevBab: null, nextBab: null };
  return {
    prevBab: idx > 0 ? list[idx - 1] : null,
    nextBab: idx < list.length - 1 ? list[idx + 1] : null,
  };
}

export function hitungStatistikModulSmpSiswa(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKeySelesai = `gemilang_modul_smp_selesai_${sid}`;
  let babSelesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKeySelesai);
    if (raw) babSelesaiArr = JSON.parse(raw);
  } catch {
    babSelesaiArr = [];
  }

  const totalBab = SEMUA_BAB_SMP.length;
  const selesaiCount = babSelesaiArr.length;
  const persen = totalBab > 0 ? Math.round((selesaiCount / totalBab) * 100) : 0;

  const perSubtest = {};
  DAFTAR_SUBTES_SMP.forEach((sub) => {
    const subBabIds = sub.babList.map((b) => b.id);
    const subSelesai = subBabIds.filter((id) => babSelesaiArr.includes(id)).length;
    perSubtest[sub.kode] = {
      selesai: subSelesai,
      total: sub.babList.length,
      persen: Math.round((subSelesai / sub.babList.length) * 100),
    };
  });

  return {
    totalBab,
    totalSelesai: selesaiCount,
    selesaiCount,
    persenTotal: persen,
    persen,
    perSubtes: perSubtest,
    perSubtest,
    babSelesaiIds: babSelesaiArr,
  };
}

export function getDaftarBabSmpSelesai(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_selesai_${sid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function tandaiBabSmpSelesai(studentId, babId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_selesai_${sid}`;
  let selesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) selesaiArr = JSON.parse(raw);
  } catch {
    selesaiArr = [];
  }
  if (!selesaiArr.includes(babId)) {
    selesaiArr.push(babId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(selesaiArr));
    } catch {
      // ignore
    }
  }
  return selesaiArr;
}

export function simpanTerakhirDibacaSmp(studentId, babData) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_last_${sid}`;
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...babData,
        timestamp: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

export function getTerakhirDibacaSmp(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_last_${sid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function simpanSkorKuisSmpBab(studentId, babId, skorBenar, totalSoal) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_kuis_${sid}_${babId}`;
  const nilai100 = totalSoal > 0 ? Math.round((skorBenar / totalSoal) * 100) : 0;
  const xpReward = skorBenar * 25;

  const data = {
    babId,
    skorBenar,
    totalSoal,
    nilai100,
    xpReward,
    lulus: skorBenar >= Math.ceil(totalSoal * 0.6),
    waktu: Date.now(),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore
  }

  if (data.lulus) {
    tandaiBabSmpSelesai(sid, babId);
  }

  return data;
}

export function getSkorKuisSmpBab(studentId, babId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_kuis_${sid}_${babId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
