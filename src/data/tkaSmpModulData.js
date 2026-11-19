// src/data/tkaSmpModulData.js
// ==============================================================================
// MODUL BELAJAR TKA SMP KELAS 9 (BIMBEL GEMILANG)
// Mengadopsi struktur UI Ambis Gemilang (100% UNLOCKED)
// Subtes Utama: Matematika (Numerasi) & Bahasa Indonesia (Literasi)
// Subtes Tambahan: IPA Terpadu (Sains) & Bahasa Inggris
// ==============================================================================

// ------------------------------------------------------------------------------
// 1. MATEMATIKA (NUMERASI TKA SMP)
// ------------------------------------------------------------------------------
export const MTK_SMP_MODUL = [
  {
    id: 'mtk-smp-bab-1',
    babNumber: 1,
    slug: 'perpangkatan-dan-bentuk-akar',
    subtestKode: 'MTK_SMP',
    subtestNama: 'Matematika (Numerasi)',
    judul: 'Perpangkatan dan Bentuk Akar',
    durasiBacaMenit: 14,
    ringkasanSingkat: 'Kaidah perkalian berulang bilangan pokok sama, sifat eksponensial aljabar, penyederhanaan bentuk akar kuadrat, dan teknik merasionalkan penyebut pecahan.',
    learningObjectives: [
      'Memahami kaidah perkalian berulang a^n = a × a × ... × a sebanyak n kali.',
      'Menguasai sifat operasi pangkat: a^m × a^n = a^(m+n) dan a^m / a^n = a^(m-n).',
      'Memahami definisi pangkat nol (a^0 = 1, a ≠ 0) dan pangkat bulat negatif (a^-n = 1/a^n).',
      'Menyederhanakan bentuk akar dengan pemfaktoran kuadrat murni.',
      'Merasionalkan penyebut pecahan bentuk akar menggunakan sekawan selisih kuadrat.'
    ],
    konsepTeori: [
      {
        subjudul: '1. Sifat-Sifat Pokok Perpangkatan',
        isi: 'Untuk a, b bilangan real dan m, n bilangan bulat berlaku:\n- Perkalian basis sama: a^m × a^n = a^(m+n)\n- Pembagian basis sama: a^m / a^n = a^(m-n)\n- Pangkat dipangkatkan: (a^m)^n = a^(m×n)\n- Pangkat perkalian: (a × b)^n = a^n × b^n\n- Pangkat pembagian: (a / b)^n = a^n / b^n (b ≠ 0)',
        poinPenting: [
          'Hati-hati dengan tanda kurung: (-2)^4 = +16, sedangkan -2^4 = -16.',
          'Pangkat nol: Setiap bilangan tidak nol jika dipangkatkan 0 bernilai 1 (misal: 2026^0 = 1).'
        ]
      },
      {
        subjudul: '2. Operasi & Merasionalkan Bentuk Akar',
        isi: 'Bentuk akar kuadrat √A disederhanakan dengan mencari faktor kuadrat murni (4, 9, 16, 25, 36, 49, dst):\nContoh: √72 = √(36 × 2) = 6√2.\nPenjumlahan dan pengurangan hanya bisa dilakukan jika bentuk akarnya sejenis:\na√c ± b√c = (a ± b)√c.\nUntuk merasionalkan bentuk a / (√b + √c), kalikan pembilang dan penyebut dengan sekawan (√b - √c).',
        poinPenting: [
          'Ingat rumus selisih kuadrat: (x + y)(x - y) = x² - y².',
          '(√a + √b)(√a - √b) = a - b.'
        ]
      }
    ],
    trikCepat: 'Trik Kilat Gemilang: Untuk merasionalkan pecahan bentuk K / (√A - √B), langsung tuliskan: K(√A + √B) / (A - B). Selisih di penyebut selalu tanpa akar!',
    jebakanUmum: 'Menjumlahkan akar yang tidak sejenis seperti √2 + √3 = √5 (SALAH BESAR!). Bentuk √2 + √3 tidak dapat disederhanakan lagi.',
    contohSoal: [
      {
        soal: 'Hasil dari 4^(-2) + 2^(-3) adalah...',
        opsi: {
          A: '1/16',
          B: '3/16',
          C: '1/8',
          D: '5/16'
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Ubah pangkat negatif ke pecahan: 4^(-2) = 1 / 4² = 1/16.',
          'Ubah pangkat negatif kedua: 2^(-3) = 1 / 2³ = 1/8 = 2/16.',
          'Jumlahkan kedua pecahan: 1/16 + 2/16 = 3/16.',
          'Jawaban yang tepat adalah B.'
        ]
      },
      {
        soal: 'Bentuk rasional dari 12 / (√7 - √3) adalah...',
        opsi: {
          A: '3(√7 + √3)',
          B: '4(√7 + √3)',
          C: '3(√7 - √3)',
          D: '6(√7 + √3)'
        },
        kunci: 'A',
        pembahasanLangkah: [
          'Kalikan dengan sekawan: 12 / (√7 - √3) × (√7 + √3) / (√7 + √3).',
          'Penyebut menjadi (√7)² - (√3)² = 7 - 3 = 4.',
          'Pembilang menjadi 12(√7 + √3).',
          'Bagi pembilang dengan penyebut: 12 / 4 = 3.',
          'Hasil akhir: 3(√7 + √3). Jawaban A.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'mtk-smp-1-q1',
        pertanyaan: 'Bentuk sederhana dari (3² × 3⁵) / 3⁴ adalah...',
        opsi: { A: '3', B: '9', C: '27', D: '81' },
        kunci: 'C',
        pembahasan: '3^(2+5) / 3^4 = 3^7 / 3^4 = 3^(7-4) = 3³ = 27.'
      },
      {
        id: 'mtk-smp-1-q2',
        pertanyaan: 'Nilai dari √48 - √27 + √12 adalah...',
        opsi: { A: '2√3', B: '3√3', C: '4√3', D: '5√3' },
        kunci: 'B',
        pembahasan: '√48 = 4√3 ; √27 = 3√3 ; √12 = 2√3. Maka 4√3 - 3√3 + 2√3 = (4 - 3 + 2)√3 = 3√3.'
      },
      {
        id: 'mtk-smp-1-q3',
        pertanyaan: 'Bentuk baku (notasi ilmiah) dari 0,0000725 adalah...',
        opsi: { A: '7,25 × 10^-4', B: '7,25 × 10^-5', C: '72,5 × 10^-6', D: '7,25 × 10^-6' },
        kunci: 'B',
        pembahasan: 'Geser koma ke kanan 5 kali sampai angka 7,25 (1 ≤ a < 10). Hasilnya 7,25 × 10^(-5).'
      }
    ]
  },
  {
    id: 'mtk-smp-bab-2',
    babNumber: 2,
    slug: 'persamaan-dan-fungsi-kuadrat',
    subtestKode: 'MTK_SMP',
    subtestNama: 'Matematika (Numerasi)',
    judul: 'Persamaan & Fungsi Kuadrat',
    durasiBacaMenit: 15,
    ringkasanSingkat: 'Bentuk umum ax² + bx + c = 0, metode pemfaktoran, rumus kuadratik (ABC), penentu nilai diskriminan (D), serta karakteristik grafik parabola fungsi kuadrat.',
    learningObjectives: [
      'Menentukan akar-akar persamaan kuadrat melalui pemfaktoran dan rumus ABC.',
      'Memahami peranan diskriminan D = b² - 4ac terhadap jenis akar persamaan.',
      'Menentukan sumbu simetri x = -b / (2a) dan nilai optimum y = -D / (4a).',
      'Membaca arah bukaan parabola dari tanda koefisien a (a > 0 terbuka ke atas, a < 0 ke bawah).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Menentukan Akar Persamaan Kuadrat',
        isi: 'Persamaan ax² + bx + c = 0 dapat diselesaikan dengan:\n1. Pemfaktoran: Cari dua angka p dan q sedemikian sehingga p + q = b dan p × q = a × c.\n2. Rumus ABC: x₁,₂ = (-b ± √(b² - 4ac)) / (2a).\n3. Sifat akar: x₁ + x₂ = -b/a, dan x₁ × x₂ = c/a.',
        poinPenting: [
          'D = b² - 4ac:',
          'D > 0: Memiliki dua akar real berbeda (grafik memotong sumbu-X di dua titik).',
          'D = 0: Memiliki dua akar kembar/sama (grafik menyinggung sumbu-X).',
          'D < 0: Tidak memiliki akar real (grafik tidak memotong sumbu-X / definit).'
        ]
      },
      {
        subjudul: '2. Karakteristik Grafik Fungsi Kuadrat f(x) = ax² + bx + c',
        isi: '- Titik potong sumbu-Y di (0, c).\n- Sumbu simetri garis vertikal: x = -b / (2a).\n- Nilai optimum (maksimum atau minimum): y = -D / (4a).\n- Titik puncak (titik balik): (-b/(2a), -D/(4a)).',
        poinPenting: [
          'Jika a > 0: kurva tersenyum (terbuka ke atas, titik puncak minimum).',
          'Jika a < 0: kurva cemberut (terbuka ke bawah, titik puncak maksimum).'
        ]
      }
    ],
    trikCepat: 'Trik Kilat Gemilang: Untuk mencari jumlah dan hasil kali akar tanpa menghitung akar satu-satu, langsung pakai x₁ + x₂ = -b/a dan x₁·x₂ = c/a. Contoh x² - 5x + 6 = 0, maka x₁ + x₂ = 5/1 = 5!',
    jebakanUmum: 'Lupa tanda minus pada rumus sumbu simetri x = -b / (2a) atau keliru memasukkan tanda minus pada koefisien b negatif.',
    contohSoal: [
      {
        soal: 'Akar-akar dari persamaan 2x² - 5x - 3 = 0 adalah...',
        opsi: {
          A: 'x = 3 atau x = -1/2',
          B: 'x = -3 atau x = 1/2',
          C: 'x = 3 atau x = 1/2',
          D: 'x = -3 atau x = -1/2'
        },
        kunci: 'A',
        pembahasanLangkah: [
          'Faktorkan: cari dua bilangan yang jika dikalikan bernilai 2 × (-3) = -6 dan dijumlahkan bernilai -5. Angka tersebut adalah -6 dan +1.',
          'Tuliskan: 2x² - 6x + x - 3 = 0 → 2x(x - 3) + 1(x - 3) = 0.',
          'Maka (2x + 1)(x - 3) = 0.',
          'Akar-akarnya: 2x + 1 = 0 → x = -1/2, atau x - 3 = 0 → x = 3.',
          'Jawaban A.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'mtk-smp-2-q1',
        pertanyaan: 'Sumbu simetri dari grafik fungsi f(x) = x² - 6x + 8 adalah...',
        opsi: { A: 'x = -3', B: 'x = 3', C: 'x = 6', D: 'x = -6' },
        kunci: 'B',
        pembahasan: 'Rumus sumbu simetri x = -b / (2a) = -(-6) / (2 × 1) = 6 / 2 = 3.'
      },
      {
        id: 'mtk-smp-2-q2',
        pertanyaan: 'Jika persamaan kuadrat x² + kx + 9 = 0 memiliki dua akar kembar, maka nilai k positif adalah...',
        opsi: { A: '3', B: '6', C: '9', D: '12' },
        kunci: 'B',
        pembahasan: 'Syarat akar kembar: D = 0 → b² - 4ac = 0 → k² - 4(1)(9) = 0 → k² = 36 → k = 6.'
      },
      {
        id: 'mtk-smp-2-q3',
        pertanyaan: 'Tinggi peluru t detik dinyatakan h(t) = 40t - 5t² (dalam meter). Tinggi maksimum peluru adalah...',
        opsi: { A: '60 m', B: '80 m', C: '100 m', D: '120 m' },
        kunci: 'B',
        pembahasan: 'Waktu puncak: t = -b / (2a) = -40 / (2 × -5) = 4 detik. h(4) = 40(4) - 5(4)² = 160 - 80 = 80 meter.'
      }
    ]
  },
  {
    id: 'mtk-smp-bab-3',
    babNumber: 3,
    slug: 'transformasi-geometri',
    subtestKode: 'MTK_SMP',
    subtestNama: 'Matematika (Numerasi)',
    judul: 'Transformasi Geometri',
    durasiBacaMenit: 12,
    ringkasanSingkat: 'Empat jenis transformasi koordinat: translasi (pergeseran), refleksi (pencerminan sumbu koordinat), rotasi (perputaran sudut), dan dilatasi (perbesaran faktor skala k).',
    learningObjectives: [
      'Menentukan bayangan titik oleh translasi T = (a, b).',
      'Menguasai rumus cepat pencerminan terhadap sumbu-X, sumbu-Y, garis y = x, garis y = -x, dan garis x = h / y = k.',
      'Menentukan bayangan rotasi 90°, 180°, dan 270° berpusat di titik asal O(0,0).',
      'Menentukan bayangan dilatasi dengan faktor skala k dan pusat O(0,0).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Translasi & Refleksi Koordinat',
        isi: '- Translasi T(a, b): A(x, y) → A\'(x + a, y + b).\n- Refleksi sumbu-X: A(x, y) → A\'(x, -y).\n- Refleksi sumbu-Y: A(x, y) → A\'(-x, y).\n- Refleksi garis y = x: A(x, y) → A\'(y, x) (tukar posisi).\n- Refleksi garis y = -x: A(x, y) → A\'(-y, -x) (tukar posisi dan kali minus).\n- Refleksi garis x = h: A(x, y) → A\'(2h - x, y).\n- Refleksi garis y = k: A(x, y) → A\'(x, 2k - y).',
        poinPenting: [
          'Pada refleksi terhadap garis x = h, koordinat y tidak berubah, hanya koordinat x yang berubah menjadi 2h - x.'
        ]
      },
      {
        subjudul: '2. Rotasi & Dilatasi Pusat O(0,0)',
        isi: '- Rotasi +90° (berlawanan jarum jam): (x, y) → (-y, x).\n- Rotasi -90° (searah jarum jam): (x, y) → (y, -x).\n- Rotasi 180°: (x, y) → (-x, -y).\n- Dilatasi [O, k]: (x, y) → (kx, ky).',
        poinPenting: [
          'Jika arah putaran tidak disebutkan, rotasi bernilai positif (berlawanan arah jarum jam).'
        ]
      }
    ],
    trikCepat: 'Trik Menghafal Rotasi: Rotasi +90° = tukar posisi dan yang depan beri tanda minus: (x,y) → (-y, x). Rotasi 180° = tidak tukar posisi, langsung beri minus keduanya: (-x, -y).',
    jebakanUmum: 'Lupa bahwa rotasi searah jarum jam berarti sudutnya bernilai NEGATIF (-90°), yang setara dengan rotasi +270°.',
    contohSoal: [
      {
        soal: 'Titik P(3, -5) dicerminkan terhadap garis y = -x, bayangannya adalah...',
        opsi: {
          A: '(5, -3)',
          B: '(-5, 3)',
          C: '(5, 3)',
          D: '(-3, 5)'
        },
        kunci: 'A',
        pembahasanLangkah: [
          'Rumus refleksi terhadap y = -x adalah (x, y) → (-y, -x).',
          'Titik asal: x = 3, y = -5.',
          'Maka x\' = -(-5) = 5, dan y\' = -(3) = -3.',
          'Bayangan P\' adalah (5, -3). Jawaban A.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'mtk-smp-3-q1',
        pertanyaan: 'Titik A(-2, 4) ditranslasikan oleh T(3, -5). Koordinat bayangan titik A adalah...',
        opsi: { A: '(1, -1)', B: '(-5, 9)', C: '(1, 9)', D: '(-5, -1)' },
        kunci: 'A',
        pembahasan: 'A\' = (-2 + 3, 4 + (-5)) = (1, -1).'
      },
      {
        id: 'mtk-smp-3-q2',
        pertanyaan: 'Bayangan titik B(4, -2) oleh rotasi 90° berlawanan arah jarum jam dengan pusat O(0,0) adalah...',
        opsi: { A: '(2, 4)', B: '(-2, -4)', C: '(2, -4)', D: '(-4, -2)' },
        kunci: 'A',
        pembahasan: 'Rotasi +90°: (x, y) → (-y, x). Maka (4, -2) → (-(-2), 4) = (2, 4).'
      },
      {
        id: 'mtk-smp-3-q3',
        pertanyaan: 'Titik C(6, -9) didilatasi dengan pusat O(0,0) dan faktor skala k = 1/3. Koordinat bayangannya adalah...',
        opsi: { A: '(2, -3)', B: '(18, -27)', C: '(-2, 3)', D: '(3, -2)' },
        kunci: 'A',
        pembahasan: 'C\' = (6 × 1/3, -9 × 1/3) = (2, -3).'
      }
    ]
  },
  {
    id: 'mtk-smp-bab-4',
    babNumber: 4,
    slug: 'kesebangunan-dan-kekongruenan',
    subtestKode: 'MTK_SMP',
    subtestNama: 'Matematika (Numerasi)',
    judul: 'Kesebangunan & Kekongruenan',
    durasiBacaMenit: 13,
    ringkasanSingkat: 'Syarat dua bangun datar kongruen (bentuk dan ukuran sama persis) vs sebangun (sudut sama, sisi sebanding), serta teorema perbandingan sisi segitiga dan trapesium.',
    learningObjectives: [
      'Membedakan konsep kongruen (sama & sebangun) dengan sebangun (proporsional).',
      'Menguasai syarat kekongruenan segitiga: sisi-sisi-sisi (s-s-s), sisi-sudut-sisi (s-sd-s), sudut-sisi-sudut (sd-s-sd).',
      'Menghitung panjang sisi yang belum diketahui pada dua segitiga sebangun.',
      'Menguasai rumus cepat ruas garis sejajar pada trapesium bertingkat.'
    ],
    konsepTeori: [
      {
        subjudul: '1. Syarat Bangun Kongruen & Sebangun',
        isi: '- Dua bangun datar KONGRUEN (≅) jika: 1) Sudut-sudut yang bersesuaian sama besar, dan 2) Sisi-sisi yang bersesuaian sama panjang.\n- Dua bangun datar SEBANGUN (~) jika: 1) Sudut-sudut yang bersesuaian sama besar, dan 2) Sisi-sisi yang bersesuaian memiliki perbandingan yang senilai.',
        poinPenting: [
          'Dua bangun yang kongruen pasti sebangun, tetapi dua bangun yang sebangun belum tentu kongruen.'
        ]
      },
      {
        subjudul: '2. Trapesium Bertingkat (Rumus Silang)',
        isi: 'Pada trapesium ABCD dengan EF sejajar AB dan CD:\nPanjang EF = (AB × DE + CD × AE) / (DE + AE).\nPerkalian dilakukan silang: sisi atas kali potongan bawah + sisi bawah kali potongan atas dibagi jumlah potongan.',
        poinPenting: [
          'Ingat pola kali silang untuk menghemat waktu saat ujian.'
        ]
      }
    ],
    trikCepat: 'Trik Silang Trapesium: EF = (Atas × Bawah + Bawah × Atas) / Total Potongan Sisi Tegak. Sangat cepat menyikat soal HOTS tanpa membuat segitiga bantu.',
    jebakanUmum: 'Membandingkan sisi segitiga kecil dengan sisa trapesium bukan dengan segitiga besar secara utuh.',
    contohSoal: [
      {
        soal: 'Sebuah tiang bendera setinggi 6 m memiliki panjang bayangan 4 m. Pada saat yang sama, sebuah pohon memiliki panjang bayangan 10 m. Tinggi pohon tersebut adalah...',
        opsi: {
          A: '12 m',
          B: '15 m',
          C: '16 m',
          D: '18 m'
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Gunakan perbandingan kesebangunan:',
          'Tinggi Pohon / Tinggi Tiang = Bayangan Pohon / Bayangan Tiang',
          'T / 6 = 10 / 4',
          'T = 6 × (10 / 4) = 6 × 2,5 = 15 meter.',
          'Jawaban B.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'mtk-smp-4-q1',
        pertanyaan: 'Manakah pasangan bangun datar berikut yang PASTI selalu sebangun?',
        opsi: { A: 'Dua persegi panjang', B: 'Dua belah ketupat', C: 'Dua segitiga sama sisi', D: 'Dua trapesium sama kaki' },
        kunci: 'C',
        pembahasan: 'Dua segitiga sama sisi selalu memiliki semua sudut 60° dan perbandingan sisinya selalu sama, sehingga pasti selalu sebangun.'
      },
      {
        id: 'mtk-smp-4-q2',
        pertanyaan: 'Pada segitiga ABC, garis DE sejajar BC (D di AB, E di AC). Jika AD = 6 cm, DB = 4 cm, dan DE = 9 cm, maka panjang BC adalah...',
        opsi: { A: '12 cm', B: '15 cm', C: '13,5 cm', D: '18 cm' },
        kunci: 'B',
        pembahasan: 'AB = AD + DB = 6 + 4 = 10 cm. Perbandingan: DE / BC = AD / AB → 9 / BC = 6 / 10 → BC = (9 × 10) / 6 = 15 cm.'
      },
      {
        id: 'mtk-smp-4-q3',
        pertanyaan: 'Dua segitiga dinyatakan kongruen jika memenuhi syarat berikut, KECUALI...',
        opsi: { A: 'Sisi - Sisi - Sisi', B: 'Sisi - Sudut - Sisi', C: 'Sudut - Sudut - Sudut', D: 'Sudut - Sisi - Sudut' },
        kunci: 'C',
        pembahasan: 'Syarat Sudut - Sudut - Sudut hanya membuktikan bahwa dua segitiga SEBANGUN, tetapi ukurannya belum tentu sama (belum tentu kongruen).'
      }
    ]
  },
  {
    id: 'mtk-smp-bab-5',
    babNumber: 5,
    slug: 'bangun-ruang-sisi-lengkung',
    subtestKode: 'MTK_SMP',
    subtestNama: 'Matematika (Numerasi)',
    judul: 'Bangun Ruang Sisi Lengkung (BRSL)',
    durasiBacaMenit: 14,
    ringkasanSingkat: 'Luas permukaan dan volume tabung, kerucut, serta bola, hubungan garis pelukis s = √(r² + t²), dan aplikasi kasus gabungan bangun ruang.',
    learningObjectives: [
      'Menghitung luas selimut, luas permukaan lengkap, dan volume tabung.',
      'Menguasai hubungan pythagoras pada kerucut: s² = r² + t².',
      'Menghitung luas permukaan dan volume kerucut.',
      'Menghitung luas permukaan bola (4πr²) dan volume bola (4/3 πr³).',
      'Menyelesaikan soal kontekstual bak air, tenda kerucut, dan kubah belahan bola.'
    ],
    konsepTeori: [
      {
        subjudul: '1. Rumus Tabung, Kerucut, dan Bola',
        isi: '- TABUNG: Luas Selimut = 2πrt. Luas Permukaan = 2πr(r + t). Volume = πr²t.\n- KERUCUT: Garis pelukis s = √(r² + t²). Luas Selimut = πrs. Luas Permukaan = πr(r + s). Volume = 1/3 πr²t.\n- BOLA: Luas Permukaan = 4πr². Volume = 4/3 πr³.\n- BELAHAN BOLA PADAT: Luas Permukaan = 3πr² (2πr² selimut + πr² alas penampang).',
        poinPenting: [
          'Jika r kelipatan 7 gunakan π = 22/7, jika bukan kelipatan 7 gunakan π = 3,14.'
        ]
      }
    ],
    trikCepat: 'Perbandingan Volume: Jika jari-jari tabung dan kerucut sama dan tingginya sama, maka Volume Kerucut tepat sepertiga dari Volume Tabung: V_kerucut = 1/3 × V_tabung.',
    jebakanUmum: 'Menghitung luas tenda kerucut atau kubah bola dengan menyertakan luas alas (padahal tenda/kubah bawahnya bolong, hanya perlu luas selimut!).',
    contohSoal: [
      {
        soal: 'Sebuah kerucut memiliki jari-jari 7 cm dan tinggi 24 cm. Luas selimut kerucut tersebut adalah... (π = 22/7)',
        opsi: {
          A: '528 cm²',
          B: '550 cm²',
          C: '704 cm²',
          D: '800 cm²'
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Cari garis pelukis s: s = √(7² + 24²) = √(49 + 576) = √625 = 25 cm.',
          'Luas selimut kerucut = πrs = (22/7) × 7 × 25.',
          'Coret angka 7: 22 × 25 = 550 cm².',
          'Jawaban B.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'mtk-smp-5-q1',
        pertanyaan: 'Volume sebuah tabung dengan diameter 14 cm dan tinggi 10 cm adalah... (π = 22/7)',
        opsi: { A: '1.540 cm³', B: '3.080 cm³', C: '4.620 cm³', D: '6.160 cm³' },
        kunci: 'A',
        pembahasan: 'r = 14 / 2 = 7 cm. Volume = πr²t = (22/7) × 7² × 10 = 22 × 7 × 10 = 1.540 cm³.'
      },
      {
        id: 'mtk-smp-5-q2',
        pertanyaan: 'Luas permukaan belahan bola padat berdiameter 20 cm adalah... (π = 3,14)',
        opsi: { A: '628 cm²', B: '942 cm²', C: '1.256 cm²', D: '1.884 cm²' },
        kunci: 'B',
        pembahasan: 'r = 10 cm. Belahan bola padat memiliki luas 3πr² = 3 × 3,14 × 10² = 3 × 314 = 942 cm².'
      },
      {
        id: 'mtk-smp-5-q3',
        pertanyaan: 'Jika jari-jari bola diperbesar 2 kali semula, maka volumenya menjadi... kali semula.',
        opsi: { A: '2', B: '4', C: '8', D: '16' },
        kunci: 'C',
        pembahasan: 'Volume bola berbanding lurus dengan r³. Jika r menjadi 2r, volume menjadi 2³ = 8 kali lipat.'
      }
    ]
  }
];

// ------------------------------------------------------------------------------
// 2. BAHASA INDONESIA (LITERASI TKA SMP)
// ------------------------------------------------------------------------------
export const BIN_SMP_MODUL = [
  {
    id: 'bin-smp-bab-1',
    babNumber: 1,
    slug: 'teks-laporan-percobaan',
    subtestKode: 'BIN_SMP',
    subtestNama: 'Bahasa Indonesia (Literasi)',
    judul: 'Teks Laporan Percobaan',
    durasiBacaMenit: 12,
    ringkasanSingkat: 'Ciri teks hasil observasi dan eksperimen ilmiah, struktur baku (tujuan, alat/bahan, langkah-langkah, hasil, kesimpulan), serta kaidah kebahasaan kalimat pasif dan kata kerja teknis.',
    learningObjectives: [
      'Mengidentifikasi informasi fakta dan data hasil eksperimen ilmiah.',
      'Menyusun dan menganalisis struktur baku teks laporan percobaan.',
      'Membedakan kalimat aktif dengan kalimat pasif berimbuhan di- / ter-.',
      'Mengidentifikasi konjungsi temporal (kemudian, setelah itu) dan istilah teknis sains.'
    ],
    konsepTeori: [
      {
        subjudul: '1. Struktur Teks Laporan Percobaan',
        isi: '1. Tujuan: Latar belakang dan tujuan penelitian/eksperimen.\n2. Alat dan Bahan: Daftar perlengkapan yang digunakan.\n3. Langkah-Langkah: Tahapan kerja kronologis dan sistematis.\n4. Hasil: Data objektif yang diperoleh (tabel/grafik/deskripsi fakta).\n5. Kesimpulan: Sintesis ringkas dari hasil percobaan sesuai tujuan.',
        poinPenting: [
          'Teks laporan percobaan bersifat OBJEKTIF, universal, dan TIDAK memihak (bebas dari opini pribadi atau prasangka).'
        ]
      },
      {
        subjudul: '2. Ciri Kebahasaan Teks Laporan',
        isi: '- Menggunakan kata benda umum bukan pelaku persona (misal: "larutan", "cawan petri", bukan "saya" atau "kami").\n- Banyak menggunakan kalimat pasif: "Larutan diaduk hingga homogen".\n- Menggunakan kata kerja teknis (mencampurkan, mengkristalkan, memanaskan).\n- Menggunakan konjungsi urutan waktu (pertama, selanjutnya, kemudian).',
        poinPenting: [
          'Kalimat fakta dapat dibuktikan kebenarannya melalui angka/data teruji.'
        ]
      }
    ],
    trikCepat: 'Trik Literasi: Jika ditanya bagian kesimpulan, carilah opsi yang merangkum hubungan antara variabel tujuan dengan hasil eksperimen, tanpa memuat kembali angka-angka detail yang ada di bagian hasil.',
    jebakanUmum: 'Terkecoh antara bagian "hasil" dan "kesimpulan". Hasil memuat data mentah faktual, sedangkan kesimpulan memuat intisari pemaknaan dari data tersebut.',
    contohSoal: [
      {
        soal: 'Perhatikan kutipan teks berikut:\n"Berdasarkan pengujian terhadap empat jenis cairan pencuci, sabun cair dengan ekstrak jeruk nipis terbukti paling cepat melarutkan lemak membandel dalam waktu 45 detik tanpa merusak permukaan piring."\nDalam struktur teks laporan percobaan, kutipan di atas merupakan bagian...',
        opsi: {
          A: 'Tujuan percobaan',
          B: 'Langkah kerja',
          C: 'Simpulan',
          D: 'Alat dan bahan'
        },
        kunci: 'C',
        pembahasanLangkah: [
          'Kutipan menyatakan pemaknaan akhir dari pengujian: "terbukti paling cepat melarutkan lemak".',
          'Ini bukan rincian langkah kerja ataupun tujuan awal, melainkan sintesis akhir hasil percobaan.',
          'Maka bagian tersebut merupakan Simpulan. Jawaban C.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'bin-smp-1-q1',
        pertanyaan: 'Ciri utama teks laporan percobaan yang membedakannya dari teks prosedur adalah...',
        opsi: {
          A: 'Menggunakan langkah kerja urut',
          B: 'Memuat data fakta hasil pengamatan setelah tindakan dilakukan',
          C: 'Menggunakan kalimat perintah imperatif',
          D: 'Memuat daftar bahan-bahan'
        },
        kunci: 'B',
        pembahasan: 'Teks prosedur hanya memuat instruksi cara membuat/melakukan, sedangkan laporan percobaan memuat hasil dan data pengamatan setelah eksperimen selesai.'
      },
      {
        id: 'bin-smp-1-q2',
        pertanyaan: 'Manakah di bawah ini yang merupakan kalimat pasif berkaidah ilmiah?',
        opsi: {
          A: 'Peneliti mencampurkan 5 ml alkohol ke dalam tabung.',
          B: 'Campuran tersebut dituangkan perlahan ke dalam gelas beker.',
          C: 'Kita harus mengamati perubahan warna larutan.',
          D: 'Kamu bisa memanaskan cairan selama 10 menit.'
        },
        kunci: 'B',
        pembahasan: 'Kalimat B menggunakan kata kerja pasif "dituangkan" dengan fokus objek benda, sesuai kaidah teks laporan ilmiah.'
      },
      {
        id: 'bin-smp-1-q3',
        pertanyaan: 'Kata teknis yang tepat untuk menyebut zat yang mempercepat laju reaksi kimia tanpa ikut bereaksi adalah...',
        opsi: { A: 'Katalis', B: 'Emulgator', C: 'Presipitat', D: 'Filtrat' },
        kunci: 'A',
        pembahasan: 'Zat yang mempercepat laju reaksi tanpa ikut habis bereaksi disebut katalis.'
      }
    ]
  },
  {
    id: 'bin-smp-bab-2',
    babNumber: 2,
    slug: 'teks-pidato-persuasif',
    subtestKode: 'BIN_SMP',
    subtestNama: 'Bahasa Indonesia (Literasi)',
    judul: 'Teks Pidato Persuasif',
    durasiBacaMenit: 13,
    ringkasanSingkat: 'Penyampaian gagasan orasi untuk mengajak, membujuk, dan meyakinkan pendengar, struktur etika, logika, dan emosi, serta kaidah kalimat persuasif.',
    learningObjectives: [
      'Menemukan gagasan utama dan pesan tersirat dalam pidato persuasif.',
      'Membedakan tiga pendekatan persuasi: etika (ethos), emosi (pathos), dan logika (logos).',
      'Menganalisis struktur pidato: salam pembuka, pengantar isu, rangkaian argumen, dan ajakan bertindak.',
      'Menggunakan kalimat ajakan/harapan (marilah, hendaknya, seyogianya).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Struktur Pidato Persuasif',
        isi: '1. Pembukaan: Salam pembuka, sapaan hormat, dan pengenalan isu sentral.\n2. Isi (Rangkaian Argumen): Fakta-fakta pendukung, data konkret, dan alasan logis untuk meyakinkan audiens.\n3. Penutup (Pernyataan Ajakan): Kesimpulan orasi, dorongan tindakan nyata, permohonan maaf, dan salam penutup.',
        poinPenting: [
          'Kekuatan pidato persuasif terletak pada kalimat ajakan yang lugas dan argumen yang berlandaskan fakta logis.'
        ]
      }
    ],
    trikCepat: 'Trik Literasi TKA: Soal sering menanyakan kalimat ajakan persuasif. Cari kalimat yang memuat kata kunci: "marilah", "hendaknya", "ayo", "seyogianya", atau "sudah saatnya kita".',
    jebakanUmum: 'Memilih kalimat fakta murni yang tidak memuat unsur bujukan atau ajakan saat diminta menentukan kalimat persuasif.',
    contohSoal: [
      {
        soal: 'Kalimat berikut yang paling tepat digunakan sebagai penutup pidato persuasif tentang pelestarian lingkungan adalah...',
        opsi: {
          A: 'Sampah plastik di lautan mencapai jutaan ton setiap tahunnya.',
          B: 'Oleh karena itu, marilah kita mulai mengurangi penggunaan plastik sekali pakai demi kelestarian bumi anak cucu kita.',
          C: 'Bumi kita terbentuk sekitar 4,5 miliar tahun yang lalu.',
          D: 'Plastik pertama kali ditemukan pada abad ke-20 oleh ilmuwan.'
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Opsi A, C, dan D adalah kalimat fakta/deskripsi informatif.',
          'Opsi B memuat konjungsi simpulan ("Oleh karena itu") dan kata ajakan persuasif ("marilah kita mulai...").',
          'Maka jawaban yang benar adalah B.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'bin-smp-2-q1',
        pertanyaan: 'Metode pendekatan persuasi yang menitikberatkan pada sentuhan perasaan dan empati audiens disebut pendekatan...',
        opsi: { A: 'Etika', B: 'Emosi', C: 'Logika', D: 'Fakta' },
        kunci: 'B',
        pembahasan: 'Pendekatan emosi menyentuh perasaan batin, simpati, atau kepedulian audiens.'
      },
      {
        id: 'bin-smp-2-q2',
        pertanyaan: 'Kata emotif yang tepat untuk menggambarkan kepedulian mendalam adalah...',
        opsi: { A: 'Menatap', B: 'Menyayangkan', C: 'Terpukul', D: 'Prihatin' },
        kunci: 'D',
        pembahasan: 'Kata "prihatin" membawa muatan emotif yang kuat tentang rasa kepedulian dan kesedihan yang mendalam.'
      },
      {
        id: 'bin-smp-2-q3',
        pertanyaan: 'Bagian yang berisi intisari ajakan tindakan pada naskah pidato berada pada bagian...',
        opsi: { A: 'Salam pembuka', B: 'Pengenalan isu', C: 'Penutup', D: 'Sapaan' },
        kunci: 'C',
        pembahasan: 'Pernyataan ajakan tindakan selalu diletakkan pada bagian penutup sebagai klimaks orasi.'
      }
    ]
  },
  {
    id: 'bin-smp-bab-3',
    babNumber: 3,
    slug: 'teks-cerpen-unsur-intrinsik',
    subtestKode: 'BIN_SMP',
    subtestNama: 'Bahasa Indonesia (Literasi)',
    judul: 'Teks Cerita Pendek (Cerpen)',
    durasiBacaMenit: 13,
    ringkasanSingkat: 'Bedah unsur pembangun karya sastra prosa: tema, alur (tahapan plot), penokohan (karakterisasi langsung/tidak langsung), latar, sudut pandang pengarang, dan amanat moral.',
    learningObjectives: [
      'Menentukan tema pokok dan amanat tersirat cerita.',
      'Mengidentifikasi watak tokoh melalui dialog, tindakan, dan pikiran tokoh.',
      'Menganalisis tahapan alur: orientasi, komplikasi, klimaks, dan resolusi.',
      'Menentukan sudut pandang orang pertama (aku/saya) vs orang ketiga (dia/nama tokoh).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Unsur Intrinsik Cerpen',
        isi: '- Tema: Gagasan dasar yang mendasari keseluruhan cerita.\n- Tokoh & Penokohan: Pelaku cerita dan wataknya (protagonis, antagonis, tritagonis).\n- Latar (Setting): Tempat, waktu, dan suasana terjadinya peristiwa.\n- Alur (Plot): Orientasi (awal) → Komplikasi (konflik muncul) → Klimaks (puncak konflik) → Resolusi (penyelesaian).\n- Sudut Pandang (Point of View): Orang pertama pelaku utama ("aku"), orang pertama pelaku sampingan, orang ketiga serbatahu ("ia/dia"), atau orang ketiga pengamat.\n- Amanat: Pesan moral yang ingin disampaikan penulis kepada pembaca.',
        poinPenting: [
          'Watak tokoh tersirat paling sering digali dari reaksi tokoh saat menghadapi konflik tak terduga.'
        ]
      }
    ],
    trikCepat: 'Trik Sudut Pandang: Cukup lihat kata ganti yang dipakai narator. Jika menggunakan "aku" atau "saya", pasti sudut pandang orang pertama. Jika narator memanggil tokoh dengan nama atau "dia/ia", pasti sudut pandang orang ketiga.',
    jebakanUmum: 'Mengira amanat harus tertulis eksplisit. Sebagian besar soal TKA menyajikan amanat secara tersirat yang harus disimpulkan dari akhir tindakan tokoh.',
    contohSoal: [
      {
        soal: 'Kutipan cerpen: "Meskipun lelah seharian mengayuh becak tua di tengah terik matahari, Pak Haris tetap tersenyum ramah dan menyisihkan separuh uang hasil tarikannya ke dalam kotak amal di depan masjid kampung."\nNilai kehidupan yang menonjol dari kutipan cerpen di atas adalah nilai...',
        opsi: {
          A: 'Sosial dan religius',
          B: 'Budaya dan estetika',
          C: 'Politik dan hukum',
          D: 'Pendidikan dan moralitas'
        },
        kunci: 'A',
        pembahasanLangkah: [
          'Tersenyum ramah kepada sesama mencerminkan nilai sosial.',
          'Menyisihkan uang ke kotak amal masjid mencerminkan ketaatan ibadah dan nilai religius.',
          'Maka nilai yang menonjol adalah sosial dan religius. Jawaban A.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'bin-smp-3-q1',
        pertanyaan: 'Tahapan alur ketika masalah dalam cerita mulai memuncak dan berada pada titik ketegangan tertinggi disebut...',
        opsi: { A: 'Orientasi', B: 'Komplikasi', C: 'Klimaks', D: 'Resolusi' },
        kunci: 'C',
        pembahasan: 'Klimaks adalah titik puncak ketegangan cerita sebelum menuju penyelesaian.'
      },
      {
        id: 'bin-smp-3-q2',
        pertanyaan: 'Jika narator menceritakan kisah dengan kata ganti "aku" dan menjadi pusat seluruh kejadian, sudut pandang yang digunakan adalah...',
        opsi: {
          A: 'Orang pertama pelaku utama',
          B: 'Orang pertama pelaku sampingan',
          C: 'Orang ketiga serbatahu',
          D: 'Orang ketiga pengamat'
        },
        kunci: 'A',
        pembahasan: 'Kata ganti "aku" sebagai tokoh utama cerita berarti sudut pandang orang pertama pelaku utama.'
      },
      {
        id: 'bin-smp-3-q3',
        pertanyaan: 'Penggambaran watak tokoh melalui dialog antartokoh disebut teknik penokohan...',
        opsi: { A: 'Analitik langsung', B: 'Dramatik tidak langsung', C: 'Deskriptif', D: 'Narasi bebas' },
        kunci: 'B',
        pembahasan: 'Teknik dramatik menggambarkan karakter tokoh secara tersirat melalui dialog, tindakan, atau pikiran tokoh.'
      }
    ]
  }
];

// ------------------------------------------------------------------------------
// 3. IPA TERPADU (SAINS TKA SMP — SUBTES TAMBAHAN)
// ------------------------------------------------------------------------------
export const IPA_SMP_MODUL = [
  {
    id: 'ipa-smp-bab-1',
    babNumber: 1,
    slug: 'pewarisan-sifat-genetika',
    subtestKode: 'IPA_SMP',
    subtestNama: 'IPA Terpadu (Sains)',
    judul: 'Pewarisan Sifat (Genetika Mendel)',
    durasiBacaMenit: 15,
    ringkasanSingkat: 'Struktur materi genetik (DNA, RNA, gen, kromosom), hukum pewarisan sifat Mendel, persilangan monohibrid (dominan penuh & intermediet), serta persilangan dihibrid.',
    learningObjectives: [
      'Menjelaskan fungsi DNA, RNA, dan kromosom dalam pewarisan sifat makhluk hidup.',
      'Membedakan istilah genotipe (sifat bawaan tak tampak) dengan fenotipe (sifat fisik tampak).',
      'Menghitung perbandingan rasio genotipe dan fenotipe pada persilangan monohibrid (3:1 atau 1:2:1).',
      'Menguasai rasio fenotipe dihibrid Mendel (9:3:3:1).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Konsep Dasar Genetika',
        isi: '- Genotipe: Kode genetik suatu individu, dilambangkan huruf:\n  * Homozigot dominan (misal: BB - Bulat murni)\n  * Heterozigot (misal: Bb - Bulat pembawa sifat kisut)\n  * Homozigot resesif (misal: bb - Kisut)\n- Fenotipe: Karakteristik fisik yang tampak akibat interaksi genotipe dengan lingkungan (warna bunga, rasa manis, tinggi pohon).',
        poinPenting: [
          'Sifat dominan menutupi sifat resesif. Sifat resesif hanya muncul bila berpasangan dengan sesama alel resesif (homozigot resesif).'
        ]
      },
      {
        subjudul: '2. Persilangan Monohibrid dan Dihibrid',
        isi: '- Monohibrid dominan penuh: Persilangan 1 sifat beda Bb × Bb menghasilkan rasio fenotipe 3 Dominan : 1 Resesif.\n- Monohibrid intermediet (kodominan): Sifat kedua induk bercampur, misal Merah (MM) × Putih (mm) menghasilkan F1 Merah Muda (Mm). F2 menghasilkan rasio 1 Merah : 2 Merah Muda : 1 Putih.\n- Dihibrid: Persilangan 2 sifat beda heterozigot (BbKk × BbKk) menghasilkan rasio fenotipe 9 : 3 : 3 : 1.',
        poinPenting: [
          '9 = Kedua sifat dominan (Bulat Kuning)',
          '3 = Sifat 1 dominan, sifat 2 resesif (Bulat Hijau)',
          '3 = Sifat 1 resesif, sifat 2 dominan (Kisut Kuning)',
          '1 = Kedua sifat resesif (Kisut Hijau)'
        ]
      }
    ],
    trikCepat: 'Trik Cepat Dihibrid: Jika disilangkan dua individu heterozigot ganda (AaBb × AaBb), kemungkinan anakan yang memiliki kedua sifat dominan selalu 9/16, salah satu dominan 3/16, dan kedua sifat resesif selalu 1/16.',
    jebakanUmum: 'Lupa memperhatikan kata kunci "dominan penuh" atau "intermediet". Pada intermediet, individu heterozigot memunculkan warna/sifat baru!',
    contohSoal: [
      {
        soal: 'Tanaman mawar berbunga merah (MM) disilangkan dengan mawar berbunga putih (mm). Sifat merah dominan penuh terhadap putih. Jika keturunan F1 disilangkan sesamanya dan menghasilkan 80 tanaman, maka jumlah tanaman mawar merah pada F2 adalah...',
        opsi: {
          A: '20 tanaman',
          B: '40 tanaman',
          C: '60 tanaman',
          D: '80 tanaman'
        },
        kunci: 'C',
        pembahasanLangkah: [
          'P1: MM × mm → F1: 100% Mm (Merah heterozigot).',
          'P2: Mm × Mm menghasilkan F2 dengan genotipe 1 MM : 2 Mm : 1 mm.',
          'Karena sifat merah dominan penuh, maka fenotipe merah adalah MM dan Mm (1 + 2 = 3 bagian dari total 4).',
          'Rasio merah = 3/4.',
          'Jumlah tanaman merah = 3/4 × 80 = 60 tanaman. Jawaban C.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'ipa-smp-1-q1',
        pertanyaan: 'Susunan genetik yang tidak tampak dari luar dan dilambangkan dengan simbol huruf disebut...',
        opsi: { A: 'Fenotipe', B: 'Genotipe', C: 'Kariotipe', D: 'Alel' },
        kunci: 'B',
        pembahasan: 'Genotipe adalah komposisi genetik makhluk hidup yang dilambangkan dengan huruf (seperti BB, Bb, bb).'
      },
      {
        id: 'ipa-smp-1-q2',
        pertanyaan: 'Pada persilangan bunga Mirabilis jalapa merah (MM) dengan putih (mm) yang bersifat intermediet, fenotipe F1 adalah...',
        opsi: { A: 'Merah', B: 'Putih', C: 'Merah muda', D: 'Merah berbintik putih' },
        kunci: 'C',
        pembahasan: 'Intermediet adalah sifat campuran kedua induk tanpa dominasi penuh, menghasilkan warna merah muda.'
      },
      {
        id: 'ipa-smp-1-q3',
        pertanyaan: 'Rasio fenotipe keturunan F2 pada persilangan dihibrid heterozigot mandiri (BbKk × BbKk) adalah...',
        opsi: { A: '3 : 1', B: '1 : 2 : 1', C: '9 : 3 : 3 : 1', D: '12 : 3 : 1' },
        kunci: 'C',
        pembahasan: 'Hukum II Mendel untuk dihibrid menghasilkan perbandingan fenotipe baku 9 : 3 : 3 : 1.'
      }
    ]
  },
  {
    id: 'ipa-smp-bab-2',
    babNumber: 2,
    slug: 'listrik-dinamis-dan-daya',
    subtestKode: 'IPA_SMP',
    subtestNama: 'IPA Terpadu (Sains)',
    judul: 'Listrik Dinamis & Energi Listrik',
    durasiBacaMenit: 14,
    ringkasanSingkat: 'Arus listrik, Hukum Ohm (V = I·R), Hukum I Kirchhoff pada titik percabangan, hambatan pengganti seri dan paralel, energi listrik, daya listrik, dan kalkulasi biaya listrik PLN.',
    learningObjectives: [
      'Menghitung kuat arus listrik I = Q / t.',
      'Mengaplikasikan Hukum Ohm V = I × R pada rangkaian listrik tertutup.',
      'Menghitung hambatan pengganti rangkaian seri dan paralel.',
      'Menghitung konsumsi energi listrik (kWh) dan tagihan biaya listrik rumah tangga.'
    ],
    konsepTeori: [
      {
        subjudul: '1. Hukum Ohm dan Rangkaian Hambatan',
        isi: '- Kuat arus listrik: I = Q / t (Ampere).\n- Hukum Ohm: V = I × R (Volt = Ampere × Ohm).\n- Rangkaian Seri: R_total = R₁ + R₂ + R₃ (Arus I sama di setiap hambatan).\n- Rangkaian Paralel: 1 / R_total = 1/R₁ + 1/R₂ + 1/R₃ (Tegangan V sama di setiap cabang).\n- Hukum I Kirchhoff: Jumlah arus masuk = Jumlah arus keluar (Σ I_masuk = Σ I_keluar).',
        poinPenting: [
          'Hambatan paralel selalu menghasilkan hambatan pengganti yang lebih KECIL daripada hambatan terkecilnya.'
        ]
      },
      {
        subjudul: '2. Daya dan Energi Listrik',
        isi: '- Energi Listrik: W = P × t = V × I × t (Joule).\n- Daya Listrik: P = V × I = I² × R = V² / R (Watt).\n- Biaya Listrik: 1 kWh = 1.000 Watt-jam. Biaya = Total kWh × Tarif per kWh.',
        poinPenting: [
          'Saat menghitung biaya bulanan, kalikan konsumsi per hari dengan 30 hari.'
        ]
      }
    ],
    trikCepat: 'Trik Paralel 2 Resistor: Jika ada 2 resistor paralel R₁ dan R₂, langsung hitung dengan rumus cepat R_p = (R₁ × R₂) / (R₁ + R₂). Kali di atas, jumlah di bawah!',
    jebakanUmum: 'Lupa mengubah satuan daya Watt menjadi KiloWatt (bagi 1.000) saat menghitung tagihan kWh listrik PLN.',
    contohSoal: [
      {
        soal: 'Tiga buah hambatan masing-masing 6 Ω, 3 Ω, dan 2 Ω disusun secara paralel. Hambatan pengganti rangkaian tersebut adalah...',
        opsi: {
          A: '1 Ω',
          B: '2 Ω',
          C: '3 Ω',
          D: '11 Ω'
        },
        kunci: 'A',
        pembahasanLangkah: [
          '1 / R_p = 1/6 + 1/3 + 1/2',
          'Samakan penyebut menjadi 6:',
          '1 / R_p = 1/6 + 2/6 + 3/6 = 6/6 = 1',
          'Maka R_p = 1 / 1 = 1 Ω. Jawaban A.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'ipa-smp-2-q1',
        pertanyaan: 'Sebuah lampu bertuliskan 220 V / 44 W dihubungkan pada sumber tegangan 220 V. Kuat arus yang mengalir adalah...',
        opsi: { A: '0,2 A', B: '0,5 A', C: '2 A', D: '5 A' },
        kunci: 'A',
        pembahasan: 'I = P / V = 44 / 220 = 0,2 Ampere.'
      },
      {
        id: 'ipa-smp-2-q2',
        pertanyaan: 'Sebuah setrika listrik 300 W dinyalakan 2 jam setiap hari selama 30 hari. Total energi listrik yang terpakai adalah...',
        opsi: { A: '18 kWh', B: '30 kWh', C: '60 kWh', D: '180 kWh' },
        kunci: 'A',
        pembahasan: 'Energi per hari = 300 W × 2 jam = 600 Wh. Dalam 30 hari = 600 × 30 = 18.000 Wh = 18 kWh.'
      },
      {
        id: 'ipa-smp-2-q3',
        pertanyaan: 'Menurut Hukum I Kirchhoff, jika arus masuk pada percabangan adalah 10 A dan terbagi menjadi dua cabang dengan cabang pertama 6 A, maka arus pada cabang kedua adalah...',
        opsi: { A: '4 A', B: '6 A', C: '10 A', D: '16 A' },
        kunci: 'A',
        pembahasan: 'Σ I_masuk = Σ I_keluar → 10 = 6 + I₂ → I₂ = 4 Ampere.'
      }
    ]
  }
];

// ------------------------------------------------------------------------------
// 4. BAHASA INGGRIS (LITERASI B. INGGRIS SMP — SUBTES TAMBAHAN)
// ------------------------------------------------------------------------------
export const BIG_SMP_MODUL = [
  {
    id: 'big-smp-bab-1',
    babNumber: 1,
    slug: 'congratulations-hope-wishes',
    subtestKode: 'BIG_SMP',
    subtestNama: 'Bahasa Inggris',
    judul: 'Expressions of Congratulations, Hope & Wishes',
    durasiBacaMenit: 11,
    ringkasanSingkat: 'Pola ungkapan memberikan ucapan selamat atas prestasi orang lain, menyatakan harapan masa depan (hope) vs pengandaian situasi yang belum tentu terjadi (wish).',
    learningObjectives: [
      'Mengidentifikasi ungkapan selamat (congratulating) dalam situasi formal dan informal.',
      'Membedakan penggunaan "hope" (harapan realistis) dengan "wish" (keinginan/harapan imajinatif).',
      'Merespons ucapan selamat dengan sopan dan tepat (accepting congratulations).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Expressing Congratulations',
        isi: '- Useful phrases: "Congratulations on winning the speech contest!", "I\'m very proud of you!", "Well done, you deserved it!".\n- Responses: "Thank you very much", "It\'s very kind of you to say so", "Thanks, I still need to practice more".',
        poinPenting: [
          'Preposisi setelah congratulation biasanya adalah "on": "Congratulations ON your achievement", bukan "for" atau "at".'
        ]
      },
      {
        subjudul: '2. Difference between Hope and Wish',
        isi: '- HOPE: Digunakan untuk situasi masa depan yang realistis dan mungkin terjadi.\n  Contoh: "I hope you pass the entrance exam tomorrow."\n- WISH: Digunakan untuk pengandaian yang bertentangan dengan kenyataan saat ini atau doa berformat khusus.\n  Contoh: "I wish I could fly" (kenyataannya tidak bisa terbang). Atau: "Wish you all the best".',
        poinPenting: [
          'Pola hope + subject + present tense: "I hope you win".'
        ]
      }
    ],
    trikCepat: 'Trik Preposisi: Ingat rumus "Congratulations ON + Noun/V-ing". Jangan terkecoh opsi yang menggunakan "for" atau "in".',
    jebakanUmum: 'Menjawab ucapan selamat dengan "You are welcome" padahal yang tepat adalah "Thank you".',
    contohSoal: [
      {
        soal: 'Edo: "Riri, I heard you won first prize in the national robotic competition."\nRiri: "Yes, Edo, that\'s right."\nEdo: "___________________________"\nRiri: "Thank you very much for saying so."',
        opsi: {
          A: 'I wish you could join next year.',
          B: 'Congratulations on your fantastic achievement!',
          C: 'I hope you are not disappointed.',
          D: 'Never mind, you can try again.'
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Riri baru saja memenangkan juara 1 lomba robotik.',
          'Respon yang logis dari Edo adalah memberikan ucapan selamat yang antusias.',
          'Opsi B "Congratulations on your fantastic achievement!" adalah ungkapan yang paling tepat. Jawaban B.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'big-smp-1-q1',
        pertanyaan: 'Choose the correct preposition: "Congratulations _____ passing your final examination!"',
        opsi: { A: 'at', B: 'for', C: 'on', D: 'in' },
        kunci: 'C',
        pembahasan: 'Ungkapan baku dalam bahasa Inggris menggunakan preposisi "on": Congratulations on passing...'
      },
      {
        id: 'big-smp-1-q2',
        pertanyaan: 'Siti: "I will join the singing audition tomorrow." — Dayu: "Good luck, Siti! I _____ you will get the golden ticket."',
        opsi: { A: 'hope', B: 'wish', C: 'congratulate', D: 'sorry' },
        kunci: 'A',
        pembahasan: 'Menyatakan harapan realistis yang mungkin terwujud di masa depan menggunakan kata kerja "hope".'
      },
      {
        id: 'big-smp-1-q3',
        pertanyaan: 'Which expression shows a response to a congratulation?',
        opsi: {
          A: 'I hope so too',
          B: 'Thanks a lot, it was hard work',
          C: 'I agree with you',
          D: 'Don\'t mention it'
        },
        kunci: 'B',
        pembahasan: 'Jawaban terima kasih atas ucapan selamat diekspresikan dengan "Thanks a lot...".'
      }
    ]
  },
  {
    id: 'big-smp-bab-2',
    babNumber: 2,
    slug: 'procedure-text-recipes-manuals',
    subtestKode: 'BIG_SMP',
    subtestNama: 'Bahasa Inggris',
    judul: 'Procedure Text (Recipes & Manuals)',
    durasiBacaMenit: 12,
    ringkasanSingkat: 'Teks instruksional cara membuat makanan/minuman atau cara mengoperasikan perangkat, struktur Goal/Aim, Materials/Ingredients, Steps/Methods, dan kata kerja imperatif.',
    learningObjectives: [
      'Menemukan tujuan komunikatif teks prosedur (to tell the reader how to make/operate).',
      'Menganalisis generic structure: Goal, Materials, Steps.',
      'Mengidentifikasi imperative verbs (action verbs): chop, blend, stir, plug in.',
      'Memahami temporal connectives (first, next, then, after that, finally).'
    ],
    konsepTeori: [
      {
        subjudul: '1. Generic Structure of Procedure Text',
        isi: '1. Goal / Aim: Judul atau tujuan teks (misal: "How to Make Fresh Orange Juice").\n2. Materials / Ingredients: Daftar bahan dan takaran yang dibutuhkan.\n3. Steps / Methods: Urutan instruksi operasional langkah demi langkah dari awal hingga selesai.',
        poinPenting: [
          'Dalam teks manual (alat elektronik), bagian bahan diganti menjadi "Parts / Equipment".'
        ]
      },
      {
        subjudul: '2. Language Features',
        isi: '- Menggunakan Simple Present Tense.\n- Menggunakan Imperative Sentences (kalimat perintah berawalan kata kerja): "Pour the water", "Stir gently", "Press the power button".\n- Menggunakan Adverbial of Sequence (First, Second, Then, Next, Finally).',
        poinPenting: [
          'Kalimat perintah selalu diawali bentuk kata kerja dasar (Bare Infinitive / V1).'
        ]
      }
    ],
    trikCepat: 'Trik Menjawab Tujuan: Jika soal menanyakan "What is the purpose of the text?", cari opsi yang berawalan "To show / To tell the reader how to make / operate [Judul Teks]".',
    jebakanUmum: 'Keliru menjawab langkah sebelum atau sesudah (before / after). Perhatikan urutan waktu dengan cermat.',
    contohSoal: [
      {
        soal: 'What should we do AFTER boiling the water when making tea?',
        opsi: {
          A: 'Buy the tea bag at the store',
          B: 'Pour the hot water into a cup with the tea bag',
          C: 'Drink the hot tea immediately',
          D: 'Throw away the cup'
        },
        kunci: 'B',
        pembahasanLangkah: [
          'Setelah air mendidih (boiling the water), langkah berikutnya adalah menuangkan air panas ke dalam cangkir berisi kantong teh.',
          'Maka jawaban yang benar adalah B.'
        ]
      }
    ],
    kuisPemahaman: [
      {
        id: 'big-smp-2-q1',
        pertanyaan: 'The communicative purpose of a recipe procedure text is to...',
        opsi: {
          A: 'Describe how delicious the food is',
          B: 'Tell the reader how to prepare or cook a dish through sequential steps',
          C: 'Entertain the reader with a story about cooking',
          D: 'Persuade people to buy ingredients'
        },
        kunci: 'B',
        pembahasan: 'Tujuan teks prosedur resep adalah memberi petunjuk cara menyiapkan atau memasak hidangan melalui urutan langkah.'
      },
      {
        id: 'big-smp-2-q2',
        pertanyaan: 'Which word is an imperative verb?',
        opsi: { A: 'Delicious', B: 'Stir', C: 'Carefully', D: 'Water' },
        kunci: 'B',
        pembahasan: '"Stir" (aduklah) adalah kata kerja tindakan/perintah (imperative action verb).'
      },
      {
        id: 'big-smp-2-q3',
        pertanyaan: '"Finally, serve the fruit salad while it is cold." The word "serve" is closest in meaning to...',
        opsi: { A: 'Cook', B: 'Dish up / present', C: 'Wash', D: 'Cut' },
        kunci: 'B',
        pembahasan: '"Serve" bermakna menyajikan atau menghidangkan makanan (dish up / present).'
      }
    ]
  }
];

// ------------------------------------------------------------------------------
// DAFTAR SUBTES MASTER TKA SMP
// ------------------------------------------------------------------------------
export const DAFTAR_SUBTES_SMP = [
  // 🌟 SUBTES UTAMA TKA SMP (WAJIB & FOKUS INTI)
  {
    kode: 'MTK_SMP',
    nama: 'Matematika (Numerasi TKA)',
    singkatan: 'MTK',
    badgeWarna: '#ea580c',
    bgLight: '#fff7ed',
    borderWarna: '#fed7aa',
    emoji: '📐',
    isUtama: true,
    deskripsi: 'Perpangkatan, aljabar persamaan kuadrat, transformasi geometri, kesebangunan, dan bangun ruang sisi lengkung.',
    totalBab: MTK_SMP_MODUL.length,
    babList: MTK_SMP_MODUL,
  },
  {
    kode: 'BIN_SMP',
    nama: 'Bahasa Indonesia (Literasi TKA)',
    singkatan: 'BIN',
    badgeWarna: '#0d9488',
    bgLight: '#f0fdfa',
    borderWarna: '#99f6e4',
    emoji: '📖',
    isUtama: true,
    deskripsi: 'Membaca kritis, teks laporan percobaan, pidato persuasif, cerpen, serta kaidah PUEBI & kalimat efektif.',
    totalBab: BIN_SMP_MODUL.length,
    babList: BIN_SMP_MODUL,
  },

  // 🚀 SUBTES TAMBAHAN / PILIHAN (SELEKSI SMA UNGGULAN & PENGAYAAN)
  {
    kode: 'IPA_SMP',
    nama: 'IPA Terpadu (Sains TKA)',
    singkatan: 'IPA',
    badgeWarna: '#059669',
    bgLight: '#ecfdf5',
    borderWarna: '#a7f3d0',
    emoji: '🔬',
    isUtama: false,
    badgeKategori: 'Subtes Tambahan',
    deskripsi: 'Pewarisan sifat Mendel, listrik statis & dinamis, kemagnetan, induksi elektromagnetik, dan bioteknologi.',
    totalBab: IPA_SMP_MODUL.length,
    babList: IPA_SMP_MODUL,
  },
  {
    kode: 'BIG_SMP',
    nama: 'Bahasa Inggris',
    singkatan: 'BIG',
    badgeWarna: '#4f46e5',
    bgLight: '#eef2ff',
    borderWarna: '#c7d2fe',
    emoji: '🇬🇧',
    isUtama: false,
    badgeKategori: 'Subtes Tambahan',
    deskripsi: 'Congratulation, expressions of hope, procedure text, grammar tenses, and reading comprehension.',
    totalBab: BIG_SMP_MODUL.length,
    babList: BIG_SMP_MODUL,
  },
];

// Semua Bab Datar dengan atribut visual terpasang otomatis
export const SEMUA_BAB_SMP = DAFTAR_SUBTES_SMP.flatMap((sub) =>
  sub.babList.map((bab) => ({
    ...bab,
    subtestNama: sub.nama,
    subtestSingkatan: sub.singkatan,
    subtestWarna: sub.badgeWarna,
    subtestBgLight: sub.bgLight,
    subtestBorderWarna: sub.borderWarna,
    subtestEmoji: sub.emoji,
    isUtama: sub.isUtama,
    badgeKategori: sub.badgeKategori || (sub.isUtama ? 'Subtes Utama' : 'Subtes Tambahan'),
  }))
);

// Helper get subtest
export function getSubtestSmpByKode(kode) {
  if (!kode) return null;
  const k = String(kode).toUpperCase().trim();
  return DAFTAR_SUBTES_SMP.find((s) => s.kode === k || s.singkatan === k) || null;
}

// Helper get bab
export function getBabSmpBySlug(subtestKode, babSlug) {
  if (!subtestKode || !babSlug) return null;
  const k = String(subtestKode).toUpperCase().trim();
  return SEMUA_BAB_SMP.find(
    (b) => (b.subtestKode === k || b.subtestSingkatan === k) && (b.slug === babSlug || b.id === babSlug)
  ) || null;
}

// Helper bab tetangga
export function getBabSmpTetangga(subtestKode, babSlug) {
  const subtest = getSubtestSmpByKode(subtestKode);
  if (!subtest || !subtest.babList.length) return { prevBab: null, nextBab: null, prev: null, next: null };
  const idx = subtest.babList.findIndex((b) => b.slug === babSlug || b.id === babSlug);
  const p = idx > 0 ? subtest.babList[idx - 1] : null;
  const n = idx < subtest.babList.length - 1 ? subtest.babList[idx + 1] : null;
  return {
    prevBab: p,
    nextBab: n,
    prev: p,
    next: n,
  };
}

// LocalStorage helpers untuk progress siswa SMP
export function hitungStatistikModulSmpSiswa(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_selesai_${sid}`;
  let selesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) selesaiArr = JSON.parse(raw);
  } catch {
    selesaiArr = [];
  }

  const totalBab = SEMUA_BAB_SMP.length;
  const totalSelesai = selesaiArr.length;
  const persenTotal = totalBab > 0 ? Math.round((totalSelesai / totalBab) * 100) : 0;

  const perSubtes = {};
  DAFTAR_SUBTES_SMP.forEach((st) => {
    const selesaiSub = st.babList.filter((b) => selesaiArr.includes(b.id)).length;
    perSubtes[st.kode] = {
      selesai: selesaiSub,
      total: st.totalBab,
      persen: st.totalBab > 0 ? Math.round((selesaiSub / st.totalBab) * 100) : 0,
    };
  });

  return {
    totalBab,
    totalSelesai,
    persenTotal,
    perSubtes,
    babSelesaiIds: selesaiArr,
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
  const xpReward = skorBenar * 25; // 25 XP per jawaban benar

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

  // Tandai bab selesai jika lulus kuis (minimal 60%)
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
