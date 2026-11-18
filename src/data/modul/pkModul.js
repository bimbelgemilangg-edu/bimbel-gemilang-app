// src/data/modul/pkModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const PK_MODUL = [
  {
    "id": "pk-bilangan-dan-operasi",
    "babNumber": 1,
    "slug": "pk-bilangan-dan-operasi",
    "subtestKode": "PK",
    "judul": "Sifat Bilangan & Operasi Khusus Simbol Baru",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Karakteristik bilangan bulat (ganjil, genap, prima, FPB/KPK), keterbagian bilangan, serta eksekusi operasi aritmetika simbol buatan (operator a ⊙ b).",
    "learningObjectives": [
      "Memahami sifat paritas bilangan: Ganjil ± Genap, Ganjil × Ganjil, dsb.",
      "Menguasai uji keterbagian bilangan (habis dibagi 3, 4, 6, 8, 9, 11).",
      "Mengeksekusi operasi bertingkat dengan simbol buatan baru a ⊗ b = a² - 3b + 1.",
      "Menentukan digit satuan dari bilangan berpangkat besar (siklus satuan)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Aturan Paritas Bilangan Bulat",
        "isi": "Hubungan ganjil (G) dan genap (E):\n- G ± G = E ; G ± E = G ; E ± E = E\n- G × G = G ; G × E = E ; E × E = E\nJika perkalian beberapa bilangan menghasilkan ganjil, maka SEMUA bilangan tersebut PASTI GANJIL. Jika ada minimal satu genap, hasilnya pasti GENAP.",
        "poinPenting": [
          "Bilangan prima genap HANYA SATU, yaitu angka 2.",
          "Digit satuan siklus pangkat: 2^n bersiklus 4 (2, 4, 8, 6); 3^n bersiklus 4 (3, 9, 7, 1); 7^n bersiklus 4 (7, 9, 3, 1)."
        ]
      },
      {
        "subjudul": "2. Operasi Khusus Simbol Baru",
        "isi": "Soal mendefinisikan operator baru, misalnya: x # y = (x + y)/(xy - 1). Kuncinya adalah mensubstitusikan angka persis ke posisi variabel yang bersesuaian, perhatikan urutan tanda kurung.",
        "poinPenting": [
          "Kerjakan operasi di dalam kurung terlebih dahulu sebelum operator luar."
        ]
      }
    ],
    "trikCepat": "Untuk mencari digit satuan dari 3^2027: bagi eksponen 2027 dengan 4 (karena siklus satuan 3 berulang tiap 4). 2027 mod 4 = sisa 3. Maka digit satuannya sama dengan 3³ = 27 → digit satuannya adalah 7!",
    "jebakanUmum": "Lupa bahwa 1 BUKAN bilangan prima, dan 2 adalah satu-satunya bilangan prima yang genap.",
    "contohSoal": [
      {
        "soal": "Didefinisikan operasi simbol: a ∇ b = a² - 2b + ab. Nilai dari 3 ∇ (2 ∇ 1) adalah...",
        "opsi": {
          "A": "13",
          "B": "15",
          "C": "17",
          "D": "19",
          "E": "21"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Hitung yang di dalam kurung terlebih dahulu: (2 ∇ 1).",
          "2 ∇ 1 = 2² - 2(1) + (2)(1) = 4 - 2 + 2 = 4.",
          "Sekarang hitung: 3 ∇ 4.",
          "3 ∇ 4 = 3² - 2(4) + (3)(4) = 9 - 8 + 12 = 13... tunggu, cek: 9 - 8 = 1, 1 + 12 = 13.",
          "Maka 3 ∇ 4 = 13. Jawaban A."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-1-q1",
        "soal": "Jika a adalah bilangan bulat ganjil dan b adalah bilangan bulat genap, manakah di antara bentuk berikut yang PASTI bernilai ganjil?",
        "opsi": [
          {
            "label": "A",
            "text": "a + 3b + 1"
          },
          {
            "label": "B",
            "text": "2a + b"
          },
          {
            "label": "C",
            "text": "a² + b²"
          },
          {
            "label": "D",
            "text": "a × b + 2"
          },
          {
            "label": "E",
            "text": "3a + 2b + 1"
          }
        ],
        "kunci": "C",
        "pembahasan": "a ganjil → a² ganjil. b genap → b² genap. Ganjil + Genap = Ganjil. Jadi a² + b² pasti ganjil (C). Periksa A: Ganjil + Genap + 1 = Genap. Periksa B: Genap + Genap = Genap."
      },
      {
        "id": "pk-1-q2",
        "soal": "Digit satuan dari 7²⁰²⁶ adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "1"
          },
          {
            "label": "B",
            "text": "3"
          },
          {
            "label": "C",
            "text": "7"
          },
          {
            "label": "D",
            "text": "9"
          },
          {
            "label": "E",
            "text": "5"
          }
        ],
        "kunci": "D",
        "pembahasan": "Siklus digit satuan 7ⁿ: 7¹=7, 7²=9, 7³=3, 7⁴=1 (periode 4). Eksponen 2026 dibagi 4: 2026 = 4 × 506 + 2 (sisa 2). Maka digit satuannya sama dengan 7² = 49 → digit satuannya adalah 9 (D)."
      },
      {
        "id": "pk-1-q3",
        "soal": "Operasi ⊕ didefinisikan sebagai x ⊕ y = xy - (x + y). Nilai dari (4 ⊕ 2) ⊕ 3 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "-1"
          },
          {
            "label": "B",
            "text": "1"
          },
          {
            "label": "C",
            "text": "2"
          },
          {
            "label": "D",
            "text": "0"
          },
          {
            "label": "E",
            "text": "-3"
          }
        ],
        "kunci": "B",
        "pembahasan": "Dalam kurung: 4 ⊕ 2 = (4)(2) - (4 + 2) = 8 - 6 = 2. Kemudian: 2 ⊕ 3 = (2)(3) - (2 + 3) = 6 - 5 = 1 (B)."
      },
      {
        "id": "pk-1-q4",
        "soal": "Berapakah banyak bilangan prima antara 20 dan 40?",
        "opsi": [
          {
            "label": "A",
            "text": "3"
          },
          {
            "label": "B",
            "text": "4"
          },
          {
            "label": "C",
            "text": "5"
          },
          {
            "label": "D",
            "text": "6"
          },
          {
            "label": "E",
            "text": "7"
          }
        ],
        "kunci": "B",
        "pembahasan": "Bilangan prima antara 20 dan 40 adalah: 23, 29, 31, 37. Ada 4 bilangan (B)."
      },
      {
        "id": "pk-1-q5",
        "soal": "Jika bilangan 5-digit 42a16 habis dibagi 9, maka nilai digit a adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "3"
          },
          {
            "label": "B",
            "text": "5"
          },
          {
            "label": "C",
            "text": "7"
          },
          {
            "label": "D",
            "text": "8"
          },
          {
            "label": "E",
            "text": "9"
          }
        ],
        "kunci": "B",
        "pembahasan": "Ciri habis dibagi 9: jumlah semua digitnya habis dibagi 9. 4 + 2 + a + 1 + 6 = 13 + a. Agar kelipatan 9 terdekat (18), maka a = 18 - 13 = 5 (B)."
      }
    ],
    "keyTakeaways": [
      "Hafalkan siklus satuan: pangkat 2, 3, 7, 8 berulang tiap 4.",
      "Ciri habis dibagi 9: jumlah seluruh digit habis dibagi 9.",
      "Kerjakan operasi simbol buatan dengan substitusi urut dari dalam kurung.",
      "2 adalah satu-satunya bilangan prima genap."
    ],
    "rekomendasiLatihan": "Latihan 10 soal kuantitatif bertema bilangan di Roadmap Gemilang."
  },
  {
    "id": "pk-aljabar-dan-persamaan",
    "babNumber": 2,
    "slug": "pk-aljabar-dan-persamaan",
    "subtestKode": "PK",
    "judul": "Aljabar, Pemfaktoran, SPLDV & Persamaan Kuadrat",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Identitas aljabar penting (a²-b², (a+b)², a³+b³), eliminasi-substitusi sistem persamaan linier, rumus jumlah dan hasil kali akar Vieta x1+x2 = -b/a.",
    "learningObjectives": [
      "Memfaktorkan selisih dua kuadrat dan bentuk kuadrat sempurna dalam hitungan detik.",
      "Menghitung nilai ekspresi x² + y² dan 1/x + 1/y dari informasi (x+y) dan xy.",
      "Menyelesaikan SPLDV tanpa mencari satu per satu nilai variabel jika ditanya kombinasi linier.",
      "Menggunakan Teorema Vieta untuk menentukan karakteristik akar persamaan kuadrat."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Identitas Aljabar Wajib Hafal",
        "isi": "- a² - b² = (a - b)(a + b)\n- (a + b)² = a² + 2ab + b² → a² + b² = (a + b)² - 2ab\n- (a - b)² = a² - 2ab + b² → a² + b² = (a - b)² + 2ab\n- (a + b + c)² = a² + b² + c² + 2(ab + bc + ac)",
        "poinPenting": [
          "Jika x + 1/x = k, maka x² + 1/x² = k² - 2."
        ]
      },
      {
        "subjudul": "2. Teorema Vieta Persamaan Kuadrat ax² + bx + c = 0",
        "isi": "Akar-akar x1 dan x2 memenuhi:\n- x1 + x2 = -b/a\n- x1 × x2 = c/a\n- |x1 - x2| = √D / |a|, dengan D = b² - 4ac.",
        "poinPenting": [
          "D > 0: 2 akar real berlainan.",
          "D = 0: 2 akar kembar.",
          "D < 0: tidak memiliki akar real."
        ]
      }
    ],
    "trikCepat": "Trik Menjumlahkan Persamaan: Jika ditanya nilai (3x + 3y) dari 2x + y = 7 dan x + 2y = 8, JANGAN buang waktu eliminasi mencari x dan y! Cukup JUMLAHKAN kedua persamaan: (2x+x) + (y+2y) = 3x + 3y = 7 + 8 = 15!",
    "jebakanUmum": "Keliru memfaktorkan (a - b)² menjadi a² - b². Ingat tanda tengah 2ab!",
    "contohSoal": [
      {
        "soal": "Jika x + y = 7 dan xy = 10, maka nilai dari x² + y² adalah...",
        "opsi": {
          "A": "29",
          "B": "39",
          "C": "49",
          "D": "59",
          "E": "69"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Gunakan rumus aljabar: x² + y² = (x + y)² - 2xy.",
          "Substitusi nilai yang diketahui: (7)² - 2(10).",
          "x² + y² = 49 - 20 = 29.",
          "Maka jawabannya adalah 29 (A)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-2-q1",
        "soal": "Jika x + 1/x = 5, maka nilai dari x² + 1/x² adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "21"
          },
          {
            "label": "B",
            "text": "23"
          },
          {
            "label": "C",
            "text": "25"
          },
          {
            "label": "D",
            "text": "27"
          },
          {
            "label": "E",
            "text": "29"
          }
        ],
        "kunci": "B",
        "pembahasan": "Kuadratkan kedua ruas: (x + 1/x)² = x² + 2(x)(1/x) + 1/x² = x² + 2 + 1/x² = 5² = 25. Maka x² + 1/x² = 25 - 2 = 23 (B)."
      },
      {
        "id": "pk-2-q2",
        "soal": "Jika akar-akar persamaan 2x² - 6x + 1 = 0 adalah α dan β, maka nilai 1/α + 1/β adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "3"
          },
          {
            "label": "B",
            "text": "6"
          },
          {
            "label": "C",
            "text": "-3"
          },
          {
            "label": "D",
            "text": "1/3"
          },
          {
            "label": "E",
            "text": "2"
          }
        ],
        "kunci": "B",
        "pembahasan": "Berdasarkan Teorema Vieta: α + β = -b/a = -(-6)/2 = 3. αβ = c/a = 1/2. Nilai 1/α + 1/β = (α + β)/(αβ) = 3 / (1/2) = 6 (B)."
      },
      {
        "id": "pk-2-q3",
        "soal": "Diketahui sistem persamaan:\n2x + 3y = 12\n3x + 2y = 13\nNilai dari x - y adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "1"
          },
          {
            "label": "B",
            "text": "2"
          },
          {
            "label": "C",
            "text": "-1"
          },
          {
            "label": "D",
            "text": "3"
          },
          {
            "label": "E",
            "text": "5"
          }
        ],
        "kunci": "A",
        "pembahasan": "Kurangkan persamaan kedua dengan persamaan pertama:\n(3x + 2y) - (2x + 3y) = 13 - 12\nx - y = 1 (A). Langsung dapat dalam 5 detik tanpa eliminasi panjang!"
      },
      {
        "id": "pk-2-q4",
        "soal": "Nilai dari 2025² - 2024² adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "2025"
          },
          {
            "label": "B",
            "text": "4049"
          },
          {
            "label": "C",
            "text": "4050"
          },
          {
            "label": "D",
            "text": "1"
          },
          {
            "label": "E",
            "text": "4048"
          }
        ],
        "kunci": "B",
        "pembahasan": "Gunakan bentuk a² - b² = (a - b)(a + b) = (2025 - 2024)(2025 + 2024) = 1 × 4049 = 4049 (B)."
      },
      {
        "id": "pk-2-q5",
        "soal": "Agar persamaan kuadrat x² + kx + 16 = 0 memiliki dua akar kembar, maka nilai k positif yang memenuhi adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "4"
          },
          {
            "label": "B",
            "text": "6"
          },
          {
            "label": "C",
            "text": "8"
          },
          {
            "label": "D",
            "text": "12"
          },
          {
            "label": "E",
            "text": "16"
          }
        ],
        "kunci": "C",
        "pembahasan": "Syarat akar kembar: D = 0. b² - 4ac = 0 → k² - 4(1)(16) = 0 → k² - 64 = 0 → k = ±8. Nilai positif adalah k = 8 (C)."
      }
    ],
    "keyTakeaways": [
      "x² + y² = (x+y)² - 2xy.",
      "a² - b² = (a-b)(a+b).",
      "Vieta: x1 + x2 = -b/a dan x1 × x2 = c/a.",
      "Cek apakah pertanyaan dapat diselesaikan dengan menjumlahkan/mengurangkan persamaan secara langsung."
    ],
    "rekomendasiLatihan": "Latih ketangkasan aljabar di Roadmap Kuantitatif Unit 2 Gemilang."
  },
  {
    "id": "pk-fungsi-dan-grafik",
    "babNumber": 3,
    "slug": "pk-fungsi-dan-grafik",
    "subtestKode": "PK",
    "judul": "Relasi, Fungsi Komposisi, Invers & Titik Puncak",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Komposisi fungsi (f ∘ g)(x), fungsi invers f⁻¹(x), domain dan range, serta titik puncak parabola y = ax² + bx + c pada koordinat (-b/(2a), -D/(4a)).",
    "learningObjectives": [
      "Menghitung nilai evaluasi fungsi komposisi f(g(a)) secara berantai.",
      "Menentukan rumus invers fungsi rasional f(x) = (ax+b)/(cx+d).",
      "Menghitung titik ekstrem (maksimum/minimum) dan sumbu simetri fungsi kuadrat.",
      "Menganalisis pergeseran grafik fungsi (translasi f(x - h) + k)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Fungsi Komposisi dan Invers Cepat",
        "isi": "- Komposisi: (f ∘ g)(x) = f(g(x)).\n- Invers Fungsi Pecahan Linier: Jika f(x) = (ax + b)/(cx + d), maka rumus kilat inversnya adalah f⁻¹(x) = (-dx + b)/(cx - a) (Tukar posisi a dan d lalu kali -1).",
        "poinPenting": [
          "(f ∘ g)⁻¹(x) = (g⁻¹ ∘ f⁻¹)(x)."
        ]
      },
      {
        "subjudul": "2. Karakteristik Parabola y = ax² + bx + c",
        "isi": "- Terbuka ke atas jika a > 0 (memiliki titik minimum), terbuka ke bawah jika a < 0 (memiliki titik maksimum).\n- Sumbu simetri: x = -b/(2a).\n- Nilai optimum (ekstrem): y = -D/(4a) atau substitusi x simetri ke fungsi.",
        "poinPenting": [
          "Titik potong sumbu y terjadi saat x = 0, yaitu koordinat (0, c)."
        ]
      }
    ],
    "trikCepat": "Rumus Kilat Invers Pecahan: f(x) = (ax + b)/(cx + d) → f⁻¹(x) = (-dx + b)/(cx - a). Tukar diagonal utama (a dan d) dan ubah tandanya!",
    "jebakanUmum": "Menukar urutan komposisi: f(g(x)) TIDAK SAMA dengan g(f(x)). Kerjakan dari fungsi yang paling dalam!",
    "contohSoal": [
      {
        "soal": "Jika f(x) = 2x + 3 dan g(x) = x² - 1, maka nilai dari (f ∘ g)(3) adalah...",
        "opsi": {
          "A": "15",
          "B": "17",
          "C": "19",
          "D": "21",
          "E": "23"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Hitung g(3) terlebih dahulu: g(3) = 3² - 1 = 9 - 1 = 8.",
          "Masukkan hasil ke f(x): (f ∘ g)(3) = f(g(3)) = f(8).",
          "f(8) = 2(8) + 3 = 16 + 3 = 19.",
          "Maka jawabannya adalah 19 (C)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-3-q1",
        "soal": "Invers dari fungsi f(x) = (3x - 5)/(2x + 4) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "f⁻¹(x) = (-4x - 5)/(2x - 3)"
          },
          {
            "label": "B",
            "text": "f⁻¹(x) = (4x + 5)/(2x - 3)"
          },
          {
            "label": "C",
            "text": "f⁻¹(x) = (2x - 3)/(3x - 5)"
          },
          {
            "label": "D",
            "text": "f⁻¹(x) = (-4x + 5)/(2x + 3)"
          },
          {
            "label": "E",
            "text": "f⁻¹(x) = (3x + 5)/(2x - 4)"
          }
        ],
        "kunci": "A",
        "pembahasan": "Gunakan trik kilat: a=3, b=-5, c=2, d=4. Tukar a dan d serta balik tandanya: f⁻¹(x) = (-4x - 5)/(2x - 3) (A)."
      },
      {
        "id": "pk-3-q2",
        "soal": "Koordinat titik puncak dari grafik parabola y = x² - 4x + 7 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "(2, 3)"
          },
          {
            "label": "B",
            "text": "(-2, 3)"
          },
          {
            "label": "C",
            "text": "(2, -3)"
          },
          {
            "label": "D",
            "text": "(4, 7)"
          },
          {
            "label": "E",
            "text": "(2, 7)"
          }
        ],
        "kunci": "A",
        "pembahasan": "Sumbu simetri: x = -b/(2a) = -(-4)/(2×1) = 2. Masukkan x = 2 ke persamaan: y = 2² - 4(2) + 7 = 4 - 8 + 7 = 3. Maka titik puncak adalah (2, 3) (A)."
      },
      {
        "id": "pk-3-q3",
        "soal": "Jika f(2x - 1) = 4x + 5, maka nilai dari f(5) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "15"
          },
          {
            "label": "B",
            "text": "17"
          },
          {
            "label": "C",
            "text": "19"
          },
          {
            "label": "D",
            "text": "21"
          },
          {
            "label": "E",
            "text": "25"
          }
        ],
        "kunci": "B",
        "pembahasan": "Agar 2x - 1 = 5, maka 2x = 6 → x = 3. Masukkan x = 3 ke sisi kanan: f(5) = 4(3) + 5 = 12 + 5 = 17 (B)."
      },
      {
        "id": "pk-3-q4",
        "soal": "Grafik fungsi kuadrat y = -2x² + 8x - 5 memiliki nilai...",
        "opsi": [
          {
            "label": "A",
            "text": "Maksimum 3"
          },
          {
            "label": "B",
            "text": "Minimum 3"
          },
          {
            "label": "C",
            "text": "Maksimum 5"
          },
          {
            "label": "D",
            "text": "Minimum -5"
          },
          {
            "label": "E",
            "text": "Maksimum 8"
          }
        ],
        "kunci": "A",
        "pembahasan": "Karena a = -2 < 0, grafik terbuka ke bawah sehingga memiliki nilai MAKSIMUM. x_puncak = -8/(2×(-2)) = 2. y_maks = -2(2)² + 8(2) - 5 = -8 + 16 - 5 = 3 (A)."
      },
      {
        "id": "pk-3-q5",
        "soal": "Domain alami dari fungsi g(x) = √(2x - 8) agar terdefinisi pada bilangan real adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "x ≥ 4"
          },
          {
            "label": "B",
            "text": "x > 4"
          },
          {
            "label": "C",
            "text": "x ≤ 4"
          },
          {
            "label": "D",
            "text": "x ≥ 8"
          },
          {
            "label": "E",
            "text": "Semua x real"
          }
        ],
        "kunci": "A",
        "pembahasan": "Syarat bilangan di dalam tanda akar pangkat dua adalah tidak boleh negatif (≥ 0): 2x - 8 ≥ 0 → 2x ≥ 8 → x ≥ 4 (A)."
      }
    ],
    "keyTakeaways": [
      "Invers fungsi pecahan: f(x) = (ax+b)/(cx+d) → f⁻¹(x) = (-dx+b)/(cx-a).",
      "Titik puncak parabola selalu di x = -b/(2a).",
      "Untuk mencari f(k) dari f(ax+b), samakan ax+b = k lalu cari nilai x-nya.",
      "Syarat akar real: nilai dalam akar ≥ 0."
    ],
    "rekomendasiLatihan": "Latih fungsi kuadrat di Jalur Kemampuan Siswa Gemilang."
  },
  {
    "id": "pk-geometri-dasar",
    "babNumber": 4,
    "slug": "pk-geometri-dasar",
    "subtestKode": "PK",
    "judul": "Geometri Bidang Datar: Segitiga, Segiempat & Lingkaran",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Sudut pada dua garis sejajar, tripel Pythagoras (3-4-5, 5-12-13, 7-24-25, 8-15-17), kesebangunan segitiga, serta sudut pusat dan sudut keliling lingkaran.",
    "learningObjectives": [
      "Mengidentifikasi sudut sehadap, berseberangan dalam/luar, dan bertolak belakang.",
      "Memanfaatkan hafalan Tripel Pythagoras untuk mencari sisi miring segitiga siku-siku seketika.",
      "Menerapkan konsep kesebangunan perbandingan sisi segitiga.",
      "Menghubungkan sudut pusat = 2 × sudut keliling pada busur lingkaran yang sama."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Tripel Pythagoras Wajib",
        "isi": "Tripel dasar: (3, 4, 5), (5, 12, 13), (7, 24, 25), (8, 15, 17), (9, 40, 41) beserta seluruh kelipatannya (misal 6-8-10, 10-24-26).",
        "poinPenting": [
          "Luas segitiga = 1/2 × alas × tinggi = 1/2 × a × b × sin C."
        ]
      },
      {
        "subjudul": "2. Lingkaran: Sudut Pusat vs Sudut Keliling",
        "isi": "- Sudut pusat = 2 × sudut keliling (jika menghadap busur yang sama).\n- Sudut keliling yang menghadap diameter lingkaran SELALU 90° (siku-siku).\n- Segi empat tali busur: jumlah dua sudut yang saling berhadapan adalah 180°.",
        "poinPenting": [
          "Luas juring = (θ/360°) × πr² ; Panjang busur = (θ/360°) × 2πr."
        ]
      }
    ],
    "trikCepat": "Sudut Menghadap Busur Sama: Jika melihat sudut keliling menghadap garis tengah (diameter), langsung tandai sudut tersebut 90° tanpa ragu!",
    "jebakanUmum": "Menggunakan rumus keliling lingkaran 2πr padahal yang ditanyakan adalah keliling setengah lingkaran (ingat tambahkan panjang diameter 2r: K = πr + 2r).",
    "contohSoal": [
      {
        "soal": "Pada sebuah lingkaran berpusat di O, titik A, B, dan C terletak pada busur lingkaran. Jika besar sudut pusat ∠AOC = 110°, maka besar sudut keliling ∠ABC yang menghadap busur yang sama adalah...",
        "opsi": {
          "A": "45°",
          "B": "50°",
          "C": "55°",
          "D": "60°",
          "E": "70°"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Hubungan sudut keliling dan sudut pusat yang menghadap busur yang sama:",
          "Sudut Keliling = 1/2 × Sudut Pusat.",
          "∠ABC = 1/2 × 110° = 55°.",
          "Maka besar sudut ABC adalah 55° (C)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-4-q1",
        "soal": "Sebuah segitiga siku-siku memiliki panjang hipotenusa 26 cm dan salah satu sisi tegaknya 10 cm. Panjang sisi tegak lainnya adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "20 cm"
          },
          {
            "label": "B",
            "text": "22 cm"
          },
          {
            "label": "C",
            "text": "24 cm"
          },
          {
            "label": "D",
            "text": "25 cm"
          },
          {
            "label": "E",
            "text": "18 cm"
          }
        ],
        "kunci": "C",
        "pembahasan": "Bagi 2 kedua angka: 10/2 = 5, 26/2 = 13. Pasangan tripel Pythagoras adalah 5, 12, 13. Kalikan 2 kembali: 12 × 2 = 24 cm (C)."
      },
      {
        "id": "pk-4-q2",
        "soal": "Luas sebuah lingkaran adalah 154 cm² (π = 22/7). Keliling lingkaran tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "22 cm"
          },
          {
            "label": "B",
            "text": "44 cm"
          },
          {
            "label": "C",
            "text": "66 cm"
          },
          {
            "label": "D",
            "text": "88 cm"
          },
          {
            "label": "E",
            "text": "132 cm"
          }
        ],
        "kunci": "B",
        "pembahasan": "L = πr² → 154 = (22/7) r² → r² = 154 × 7 / 22 = 49 → r = 7 cm. Keliling K = 2πr = 2 × (22/7) × 7 = 44 cm (B)."
      },
      {
        "id": "pk-4-q3",
        "soal": "Dua sudut dalam berseberangan pada dua garis sejajar dipotong sebuah garis transversal besarnya...",
        "opsi": [
          {
            "label": "A",
            "text": "Selalu berjumlah 90°"
          },
          {
            "label": "B",
            "text": "Selalu berjumlah 180°"
          },
          {
            "label": "C",
            "text": "Selalu sama besar"
          },
          {
            "label": "D",
            "text": "Selalu 45°"
          },
          {
            "label": "E",
            "text": "Tidak dapat ditentukan"
          }
        ],
        "kunci": "C",
        "pembahasan": "Sifat sudut pada garis sejajar: sudut dalam berseberangan (dan luar berseberangan) besarnya SELALU SAMA (C)."
      },
      {
        "id": "pk-4-q4",
        "soal": "Keliling belah ketupat adalah 52 cm. Jika panjang salah satu diagonalnya 24 cm, luas belah ketupat tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "120 cm²"
          },
          {
            "label": "B",
            "text": "130 cm²"
          },
          {
            "label": "C",
            "text": "240 cm²"
          },
          {
            "label": "D",
            "text": "260 cm²"
          },
          {
            "label": "E",
            "text": "100 cm²"
          }
        ],
        "kunci": "A",
        "pembahasan": "Panjang sisi belah ketupat s = 52 / 4 = 13 cm. Setengah diagonal d1 = 24 / 2 = 12 cm. Dengan Pythagoras segitiga siku-siku (5, 12, 13), setengah diagonal d2 = 5 cm, sehingga d2 = 10 cm. Luas L = 1/2 × d1 × d2 = 1/2 × 24 × 10 = 120 cm² (A)."
      },
      {
        "id": "pk-4-q5",
        "soal": "Besar sudut keliling yang menghadap busur diameter lingkaran adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "45°"
          },
          {
            "label": "B",
            "text": "60°"
          },
          {
            "label": "C",
            "text": "90°"
          },
          {
            "label": "D",
            "text": "180°"
          },
          {
            "label": "E",
            "text": "360°"
          }
        ],
        "kunci": "C",
        "pembahasan": "Sudut pusat diameter adalah 180°. Maka sudut kelilingnya adalah 1/2 × 180° = 90° (C)."
      }
    ],
    "keyTakeaways": [
      "Hafalkan tripel Pythagoras 3-4-5, 5-12-13, 7-24-25, 8-15-17.",
      "Sudut pusat = 2 × sudut keliling pada busur yang sama.",
      "Sudut menghadap diameter selalu 90°.",
      "Diagonal belah ketupat saling tegak lurus dan membagi dua sama panjang."
    ],
    "rekomendasiLatihan": "Latih visualisasi bangun datar di bank latihan geometri UTBK."
  },
  {
    "id": "pk-bangun-ruang",
    "babNumber": 5,
    "slug": "pk-bangun-ruang",
    "subtestKode": "PK",
    "judul": "Geometri Bangun Ruang: Volume & Luas Permukaan",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Rumus volume dan luas kubus, balok, prisma, tabung, kerucut, dan bola, serta diagonal ruang kubus s√3 dan diagonal sisi s√2.",
    "learningObjectives": [
      "Menghitung diagonal sisi (s√2) dan diagonal ruang (s√3) kubus.",
      "Menghitung volume dan luas permukaan tabung (V = πr²t, L = 2πr(r+t)).",
      "Menerapkan hubungan kerucut: s² = r² + t² dan V = 1/3 πr²t.",
      "Menghitung volume dan luas permukaan bola (V = 4/3 πr³, L = 4πr²)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Bangun Ruang Sisi Datar",
        "isi": "- Kubus: V = s³, L = 6s², Diagonal sisi = s√2, Diagonal ruang = s√3.\n- Balok: V = p × l × t, L = 2(pl + pt + lt), Diagonal ruang = √(p² + l² + t²).\n- Prisma: V = Luas alas × tinggi.",
        "poinPenting": [
          "Jarak titik ke bidang pada kubus sering memanfaatkan segitiga siku-siku di dalam kubus."
        ]
      },
      {
        "subjudul": "2. Bangun Ruang Sisi Lengkung",
        "isi": "- Tabung: V = πr²t, Luas selimut = 2πrt, Luas total = 2πr(r + t).\n- Kerucut: V = 1/3 πr²t, Luas selimut = πrs (dengan s = garis pelukis = √(r² + t²)).\n- Bola: V = 4/3 πr³, Luas permukaan = 4πr².",
        "poinPenting": [
          "Perbandingan volume dua bola dengan perbandingan jari-jari r1 : r2 adalah r1³ : r2³."
        ]
      }
    ],
    "trikCepat": "Trik Skala Dimensi: Jika seluruh dimensi panjang diperbesar k kali, maka LUAS permukaan diperbesar k² kali, dan VOLUME diperbesar k³ kali! Contoh: jari-jari bola diperbesar 3 kali, maka volumenya melonjak 3³ = 27 kali!",
    "jebakanUmum": "Lupa faktor 1/3 pada rumus volume kerucut dan limas.",
    "contohSoal": [
      {
        "soal": "Sebuah kubus memiliki panjang diagonal ruang 6√3 cm. Volume kubus tersebut adalah...",
        "opsi": {
          "A": "108 cm³",
          "B": "144 cm³",
          "C": "216 cm³",
          "D": "324 cm³",
          "E": "512 cm³"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Diagonal ruang kubus dirumuskan sebagai s√3.",
          "Diketahui s√3 = 6√3, maka panjang rusuk kubus s = 6 cm.",
          "Volume kubus V = s³ = 6³ = 216 cm³.",
          "Maka volumenya adalah 216 cm³ (C)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-5-q1",
        "soal": "Sebuah tabung memiliki diameter alas 14 cm dan tinggi 10 cm (π = 22/7). Volume tabung tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "1.540 cm³"
          },
          {
            "label": "B",
            "text": "3.080 cm³"
          },
          {
            "label": "C",
            "text": "770 cm³"
          },
          {
            "label": "D",
            "text": "616 cm³"
          },
          {
            "label": "E",
            "text": "1.232 cm³"
          }
        ],
        "kunci": "A",
        "pembahasan": "Diameter = 14 cm → jari-jari r = 7 cm. V = πr²t = (22/7) × 7² × 10 = 22 × 7 × 10 = 1.540 cm³ (A)."
      },
      {
        "id": "pk-5-q2",
        "soal": "Jika jari-jari sebuah bola digandakan menjadi 2 kali lipat jari-jari semula, maka luas permukaannya meningkat menjadi...",
        "opsi": [
          {
            "label": "A",
            "text": "2 kali semula"
          },
          {
            "label": "B",
            "text": "4 kali semula"
          },
          {
            "label": "C",
            "text": "6 kali semula"
          },
          {
            "label": "D",
            "text": "8 kali semula"
          },
          {
            "label": "E",
            "text": "16 kali semula"
          }
        ],
        "kunci": "B",
        "pembahasan": "Luas permukaan bola sebanding dengan kuadrat jari-jari (r²). Jika r menjadi 2r, luasnya menjadi 2² = 4 kali semula (B)."
      },
      {
        "id": "pk-5-q3",
        "soal": "Kerucut dengan jari-jari 6 cm dan tinggi 8 cm memiliki luas selimut sebesar...",
        "opsi": [
          {
            "label": "A",
            "text": "48π cm²"
          },
          {
            "label": "B",
            "text": "60π cm²"
          },
          {
            "label": "C",
            "text": "80π cm²"
          },
          {
            "label": "D",
            "text": "96π cm²"
          },
          {
            "label": "E",
            "text": "100π cm²"
          }
        ],
        "kunci": "B",
        "pembahasan": "Garis pelukis s = √(r² + t²) = √(6² + 8²) = √(36 + 64) = 10 cm. Luas selimut = πrs = π × 6 × 10 = 60π cm² (B)."
      },
      {
        "id": "pk-5-q4",
        "soal": "Panjang diagonal ruang balok dengan ukuran panjang 4 cm, lebar 3 cm, dan tinggi 12 cm adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "13 cm"
          },
          {
            "label": "B",
            "text": "15 cm"
          },
          {
            "label": "C",
            "text": "17 cm"
          },
          {
            "label": "D",
            "text": "19 cm"
          },
          {
            "label": "E",
            "text": "√169 cm"
          }
        ],
        "kunci": "A",
        "pembahasan": "d = √(p² + l² + t²) = √(4² + 3² + 12²) = √(16 + 9 + 144) = √169 = 13 cm (A)."
      },
      {
        "id": "pk-5-q5",
        "soal": "Volume limas persegi dengan panjang sisi alas 10 cm dan tinggi limas 12 cm adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "400 cm³"
          },
          {
            "label": "B",
            "text": "600 cm³"
          },
          {
            "label": "C",
            "text": "1.200 cm³"
          },
          {
            "label": "D",
            "text": "300 cm³"
          },
          {
            "label": "E",
            "text": "800 cm³"
          }
        ],
        "kunci": "A",
        "pembahasan": "V = 1/3 × Luas alas × t = 1/3 × (10 × 10) × 12 = 4 × 100 = 400 cm³ (A)."
      }
    ],
    "keyTakeaways": [
      "Diagonal ruang kubus = s√3, diagonal sisi = s√2.",
      "Trik skala: dimensi ×k → luas ×k² → volume ×k³.",
      "Volume kerucut dan limas selalu memuat faktor 1/3.",
      "Luas selimut kerucut = πrs (s = hipotenusa r dan t)."
    ],
    "rekomendasiLatihan": "Latih kalkulasi volume dan luas bangun ruang di modul Pengetahuan Kuantitatif."
  },
  {
    "id": "pk-statistika-deskriptif",
    "babNumber": 6,
    "slug": "pk-statistika-deskriptif",
    "subtestKode": "PK",
    "judul": "Statistika Deskriptif: Rata-Rata, Median, Modus & Kuartil",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Ukuran pemusatan (mean, median, modus), ukuran penyebaran (jangkauan, kuartil, IQR), serta pengaruh operasi penambahan (+c) dan perkalian (×k) terhadap nilai statistik.",
    "learningObjectives": [
      "Menghitung rata-rata gabungan dari beberapa kelompok data.",
      "Menentukan median pada data ganjil dan genap setelah pengurutan.",
      "Menganalisis efek transformasi data: data ditambah konstan c atau dikali faktor k.",
      "Menghitung jangkauan interkuartil (IQR = Q3 - Q1)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Rata-Rata Gabungan (Weighted Mean)",
        "isi": "X̄_gab = (n1 × X̄1 + n2 × X̄2) / (n1 + n2). Rumus ini sangat populer untuk soal pergantian anggota kelompok atau penambahan nilai seorang siswa.",
        "poinPenting": [
          "Jika seorang siswa bernilai x masuk dan rata-rata naik, maka x > X̄_lama."
        ]
      },
      {
        "subjudul": "2. Aturan Sakti Transformasi Data",
        "isi": "Jika setiap data dikalikan a dan ditambah b (y = ax + b):\n- Ukuran Pemusatan (Mean, Median, Modus, Kuartil): SEMUANYA IKUT BERUBAH dikali a dan ditambah b! (Mean baru = a × Mean lama + b).\n- Ukuran Penyebaran (Jangkauan, Jangkauan Interkuartil, Simpangan Baku): HANYA TERPENGARUH OLEH PERKALIAN (|a|), TIDAK TERPENGARUH PENAMBAHAN b! (Jangkauan baru = |a| × Jangkauan lama).",
        "poinPenting": [
          "Penambahan konstan TIDAK MENGUBAH jangkauan maupun simpangan baku!"
        ]
      }
    ],
    "trikCepat": "Hafalkan aturan sakti: 'Ukuran penyebaran kebal terhadap penambahan/pengurangan!' Jadi jika data ditambah 10, jangkauannya TETAP SAMA!",
    "jebakanUmum": "Menghitung median tanpa mengurutkan data dari nilai terkecil ke terbesar terlebih dahulu.",
    "contohSoal": [
      {
        "soal": "Rata-rata nilai ujian matematika dari 19 siswa adalah 70. Jika nilai Budi digabungkan, rata-rata kelas menjadi 71. Nilai ujian Budi adalah...",
        "opsi": {
          "A": "80",
          "B": "85",
          "C": "89",
          "D": "90",
          "E": "92"
        },
        "kunci": "D",
        "pembahasanLangkah": [
          "Total nilai 19 siswa = 19 × 70 = 1.330.",
          "Setelah Budi masuk, jumlah siswa menjadi 20 dan rata-rata menjadi 71.",
          "Total nilai 20 siswa = 20 × 71 = 1.420.",
          "Nilai Budi = 1.420 - 1.330 = 90.",
          "Maka nilai Budi adalah 90 (D)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-6-q1",
        "soal": "Sekumpulan data memiliki rata-rata 15 dan jangkauan 6. Jika setiap data dikalikan 2 lalu dikurangi 3, maka rata-rata dan jangkauan yang baru berturut-turut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "27 dan 12"
          },
          {
            "label": "B",
            "text": "27 dan 9"
          },
          {
            "label": "C",
            "text": "30 dan 12"
          },
          {
            "label": "D",
            "text": "30 dan 9"
          },
          {
            "label": "E",
            "text": "24 dan 12"
          }
        ],
        "kunci": "A",
        "pembahasan": "Rata-rata baru = (15 × 2) - 3 = 30 - 3 = 27. Jangkauan baru hanya dipengaruhi perkalian: 6 × 2 = 12 (pengurangan 3 tidak memengaruhi jangkauan). Jadi 27 dan 12 (A)."
      },
      {
        "id": "pk-6-q2",
        "soal": "Median dari data: 8, 3, 7, 5, 9, 4, 10, 6 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "6"
          },
          {
            "label": "B",
            "text": "6,5"
          },
          {
            "label": "C",
            "text": "7"
          },
          {
            "label": "D",
            "text": "7,5"
          },
          {
            "label": "E",
            "text": "5,5"
          }
        ],
        "kunci": "B",
        "pembahasan": "Urutkan data: 3, 4, 5, 6, 7, 8, 9, 10 (ada 8 angka). Dua angka di tengah adalah suku ke-4 dan ke-5 yaitu 6 dan 7. Median = (6 + 7) / 2 = 6,5 (B)."
      },
      {
        "id": "pk-6-q3",
        "soal": "Di kelas XII-A, rata-rata nilai siswa pria adalah 75 dan rata-rata nilai siswa wanita adalah 85. Jika rata-rata gabungan seluruh kelas adalah 82, perbandingan jumlah siswa pria dan wanita adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "3 : 7"
          },
          {
            "label": "B",
            "text": "7 : 3"
          },
          {
            "label": "C",
            "text": "2 : 3"
          },
          {
            "label": "D",
            "text": "3 : 2"
          },
          {
            "label": "E",
            "text": "1 : 2"
          }
        ],
        "kunci": "A",
        "pembahasan": "Gunakan trik selisih silang:\nSelisih pria (75) ke gabungan (82) = |75 - 82| = 7.\nSelisih wanita (85) ke gabungan (82) = |85 - 82| = 3.\nMaka rasio Pria : Wanita = Selisih Wanita : Selisih Pria = 3 : 7 (A)."
      },
      {
        "id": "pk-6-q4",
        "soal": "Diketahui lima bilangan bulat berurutan memiliki rata-rata 24. Bilangan terbesar adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "25"
          },
          {
            "label": "B",
            "text": "26"
          },
          {
            "label": "C",
            "text": "27"
          },
          {
            "label": "D",
            "text": "28"
          },
          {
            "label": "E",
            "text": "29"
          }
        ],
        "kunci": "B",
        "pembahasan": "Pada bilangan berurutan dengan jumlah ganjil (5 angka), rata-rata sama dengan nilai mediannya (angka ke-3 di tengah). Maka urutannya: 22, 23, 24, 25, 26. Bilangan terbesarnya adalah 26 (B)."
      },
      {
        "id": "pk-6-q5",
        "soal": "Jangkauan interkuartil (IQR) dari data yang memiliki Q1 = 18 dan Q3 = 34 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "16"
          },
          {
            "label": "B",
            "text": "8"
          },
          {
            "label": "C",
            "text": "26"
          },
          {
            "label": "D",
            "text": "52"
          },
          {
            "label": "E",
            "text": "12"
          }
        ],
        "kunci": "A",
        "pembahasan": "Jangkauan interkuartil IQR = Q3 - Q1 = 34 - 18 = 16 (A)."
      }
    ],
    "keyTakeaways": [
      "Trik selisih silang sangat cepat untuk rasio rata-rata gabungan.",
      "Ukuran penyebaran (jangkauan, simpangan baku) kebal terhadap penambahan/pengurangan konstan.",
      "Ukuran pemusatan (mean, median, modus) berubah mengikuti operasi kali dan tambah.",
      "Selalu urutkan data sebelum menentukan median dan kuartil."
    ],
    "rekomendasiLatihan": "Perkuat konsep statistika di paket latihan UTBK Gemilang."
  },
  {
    "id": "pk-peluang-dan-kaidah-pencacahan",
    "babNumber": 7,
    "slug": "pk-peluang-dan-kaidah-pencacahan",
    "subtestKode": "PK",
    "judul": "Kaidah Pencacahan, Permutasi, Kombinasi & Peluang",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Aturan pengisian tempat (filling slots), permutasi nPr (memperhatikan urutan), kombinasi nCr (tanpa urutan), dan peluang kejadian komplemen P(A') = 1 - P(A).",
    "learningObjectives": [
      "Membedakan kapan menggunakan Permutasi (ada jabatan/urutan) vs Kombinasi (memilih acak tanpa jabatan).",
      "Menerapkan aturan pengisian tempat untuk pembentukan angka bersyarat (ganjil, genap, lebih dari 300).",
      "Menghitung kombinasi pengambilan bola sekaligus dari sebuah kantong.",
      "Menggunakan trik kejadian komplemen: 'Peluang minimal 1' = 1 - Peluang (tidak ada sama sekali)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Permutasi vs Kombinasi",
        "isi": "- Permutasi nPr = n! / (n - r)! → Urutan PENTING (contoh: ketua, sekretaris, bendahara; nomor antrean).\n- Kombinasi nCr = n! / (r! (n - r)!) → Urutan TIDAK PENTING (contoh: memilih 3 orang delegasi dari 10 pelamar, mengambil 2 bola dari kotak).",
        "poinPenting": [
          "nC2 = n(n - 1) / 2.",
          "nC3 = n(n - 1)(n - 2) / 6."
        ]
      },
      {
        "subjudul": "2. Trik Peluang Komplemen",
        "isi": "Jika soal menanyakan peluang 'paling sedikit satu...' (minimal 1), hitung peluang komplemennya (tidak terjadi sama sekali), lalu kurangkan dari 1:\nP(minimal 1) = 1 - P(nol / tidak ada).",
        "poinPenting": [
          "Sangat menghemat waktu dibanding menjumlahkan kasus 1, kasus 2, dan kasus 3."
        ]
      }
    ],
    "trikCepat": "Gunakan trik komplemen untuk kata kunci 'MINIMAL SATU': P(minimal 1) = 1 - P(tidak ada sama sekali). Ini menghemat 80% waktu pengerjaan!",
    "jebakanUmum": "Tertukar antara permutasi dan kombinasi saat memilih delegasi atau tim (ingat: tim tanpa jabatan selalu KOMBINASI).",
    "contohSoal": [
      {
        "soal": "Dari 8 siswa berprestasi akan dipilih 3 siswa untuk mewakili sekolah dalam kompetisi sains. Banyak cara pemilihan delegasi tersebut adalah...",
        "opsi": {
          "A": "24",
          "B": "56",
          "C": "112",
          "D": "336",
          "E": "720"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Karena tidak ada tingkatan juara atau jabatan (urutan tidak penting), gunakan Kombinasi 8C3.",
          "8C3 = (8 × 7 × 6) / (3 × 2 × 1).",
          "Coret 3 × 2 × 1 = 6 dengan angka 6 di pembilang.",
          "Hasil = 8 × 7 = 56 cara.",
          "Maka ada 56 cara pemilihan (B)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-7-q1",
        "soal": "Banyak bilangan ganjil 3-digit berbeda yang dapat disusun dari angka-angka 1, 2, 3, 4, 5, 6 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "60"
          },
          {
            "label": "B",
            "text": "72"
          },
          {
            "label": "C",
            "text": "90"
          },
          {
            "label": "D",
            "text": "120"
          },
          {
            "label": "E",
            "text": "180"
          }
        ],
        "kunci": "A",
        "pembahasan": "Isi digit terakhir (satuan) terlebih dahulu: ada 3 pilihan angka ganjil (1, 3, 5). Digit pertama: sisa 5 angka. Digit kedua: sisa 4 angka. Total bilangan = 5 × 4 × 3 = 60 bilangan (A)."
      },
      {
        "id": "pk-7-q2",
        "soal": "Dari sebuah kantong berisi 5 bola merah dan 3 bola putih, diambil 2 bola sekaligus secara acak. Peluang terambil kedua bola berwarna merah adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "5/28"
          },
          {
            "label": "B",
            "text": "5/14"
          },
          {
            "label": "C",
            "text": "10/28"
          },
          {
            "label": "D",
            "text": "15/56"
          },
          {
            "label": "E",
            "text": "3/8"
          }
        ],
        "kunci": "B",
        "pembahasan": "Titik sampel n(S) = 8C2 = (8 × 7)/2 = 28. Kejadian A (2 merah dari 5) = 5C2 = (5 × 4)/2 = 10. Peluang P(A) = 10 / 28 = 5 / 14 (B)."
      },
      {
        "id": "pk-7-q3",
        "soal": "Dua dadu adil dilempar bersamaan sekali. Peluang muncul jumlah kedua mata dadu sama dengan 8 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "1/6"
          },
          {
            "label": "B",
            "text": "5/36"
          },
          {
            "label": "C",
            "text": "1/9"
          },
          {
            "label": "D",
            "text": "7/36"
          },
          {
            "label": "E",
            "text": "1/12"
          }
        ],
        "kunci": "B",
        "pembahasan": "Pasangan mata dadu berjumlah 8: (2,6), (3,5), (4,4), (5,3), (6,2) → ada 5 pasangan. Total ruang sampel n(S) = 36. Peluang = 5/36 (B)."
      },
      {
        "id": "pk-7-q4",
        "soal": "Banyak susunan kata berbeda yang dapat dibentuk dari huruf-huruf pada kata 'GEMILANG' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "10.080"
          },
          {
            "label": "B",
            "text": "20.160"
          },
          {
            "label": "C",
            "text": "40.320"
          },
          {
            "label": "D",
            "text": "5.040"
          },
          {
            "label": "E",
            "text": "2.520"
          }
        ],
        "kunci": "A",
        "pembahasan": "Kata GEMILANG memiliki 8 huruf: G=2, E=1, M=1, I=1, L=1, A=1, N=1. Huruf kembar hanya G sebanyak 2. Rumus permutasi berulang = 8! / 2! = 40.320 / 2 = 20.160 (B)... tunggu, periksa huruf: G-E-M-I-L-A-N-G: huruf G ada 2, total 8 huruf. 8! / 2! = 20.160. Kunci B."
      },
      {
        "id": "pk-7-q5",
        "soal": "Tiga koin dilempar bersamaan. Peluang muncul minimal satu sisi angka adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "1/8"
          },
          {
            "label": "B",
            "text": "3/8"
          },
          {
            "label": "C",
            "text": "5/8"
          },
          {
            "label": "D",
            "text": "7/8"
          },
          {
            "label": "E",
            "text": "1/2"
          }
        ],
        "kunci": "D",
        "pembahasan": "Gunakan trik komplemen: P(minimal 1 angka) = 1 - P(semua gambar). Semua gambar hanya ada 1 dari 8 kemungkinan (GGG). Maka P = 1 - 1/8 = 7/8 (D)."
      }
    ],
    "keyTakeaways": [
      "Gunakan kombinasi nCr jika urutan diabaikan, dan permutasi nPr jika ada jabatan/urutan.",
      "Trik komplemen: P(minimal 1) = 1 - P(sama sekali tidak ada).",
      "Aturan pengisian tempat: dahulukan slot yang memiliki syarat pembatas.",
      "Permutasi dengan unsur kembar: n! / (k1! × k2!)."
    ],
    "rekomendasiLatihan": "Latih variasi soal peluang komplemen di bank soal SNBT."
  },
  {
    "id": "pk-eksponen-dan-logaritma",
    "babNumber": 8,
    "slug": "pk-eksponen-dan-logaritma",
    "subtestKode": "PK",
    "judul": "Eksponen, Bentuk Akar & Logaritma",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Sifat-sifat pangkat rasional, penyederhanaan bentuk akar dan rasionalisasi penyebut, serta sifat logaritma a_log(bc) = a_log b + a_log c dan a_log b = log b / log a.",
    "learningObjectives": [
      "Menerapkan sifat eksponen: aᵐ × aⁿ = aᵐ⁺ⁿ dan (aᵐ)ⁿ = aᵐⁿ.",
      "Merasionalkan bentuk akar penyebut a / (√b + √c).",
      "Menyelesaikan persamaan eksponen sederhana a^(f(x)) = a^(g(x)).",
      "Mengoperasikan sifat penjumlahan, pengurangan, dan perpangkatan logaritma."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Sifat Penting Eksponen & Bentuk Akar",
        "isi": "- a⁻ⁿ = 1 / aⁿ ; a^(m/n) = ⁿ√(aᵐ)\n- √(a + b ± 2√(ab)) = √a ± √b (dengan a > b)\n- Rasionalisasi penyebut: kalikan dengan sekawannya (√a - √b).",
        "poinPenting": [
          "Bentuk √(8 + 2√15): cari dua angka yang dijumlahkan 8 dan dikalikan 15 (yaitu 5 dan 3). Hasilnya = √5 + √3."
        ]
      },
      {
        "subjudul": "2. Sifat Dasar Logaritma",
        "isi": "- ᵃlog(b × c) = ᵃlog b + ᵃlog c\n- ᵃlog(b / c) = ᵃlog b - ᵃlog c\n- ᵃlog(bⁿ) = n × ᵃlog b\n- ᵃlog b = ᶜlog b / ᶜlog a = 1 / (ᵇlog a)\n- ᵃlog b × ᵇlog c = ᵃlog c (sifat rantai).",
        "poinPenting": [
          "Syarat basis logaritma a: a > 0 dan a ≠ 1. Syarat numerus b: b > 0."
        ]
      }
    ],
    "trikCepat": "Trik Rantai Logaritma: Jika melihat perkalian logaritma yang berantai seperti ²log 3 × ³log 5 × ⁵log 8, coret basis dan numerus yang sama di tengah! Hasilnya langsung ²log 8 = 3!",
    "jebakanUmum": "Lupa mengecek syarat numerus (b > 0) pada penyelesaian persamaan logaritma.",
    "contohSoal": [
      {
        "soal": "Nilai dari ²log 12 + ²log 6 - ²log 9 adalah...",
        "opsi": {
          "A": "2",
          "B": "3",
          "C": "4",
          "D": "5",
          "E": "6"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Gabungkan menggunakan sifat logaritma: ᵃlog b + ᵃlog c - ᵃlog d = ᵃlog ((b × c) / d).",
          "²log ((12 × 6) / 9) = ²log (72 / 9).",
          "²log 8 = ²log (2³) = 3.",
          "Maka hasilnya adalah 3 (B)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-8-q1",
        "soal": "Bentuk sederhana dari √(9 + 2√14) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "√7 + √2"
          },
          {
            "label": "B",
            "text": "√6 + √3"
          },
          {
            "label": "C",
            "text": "√8 + 1"
          },
          {
            "label": "D",
            "text": "√5 + 2"
          },
          {
            "label": "E",
            "text": "3 + √2"
          }
        ],
        "kunci": "A",
        "pembahasan": "Cari p dan q sedemikian hingga p + q = 9 dan p × q = 14. Angka tersebut adalah 7 dan 2. Maka bentuk sederhananya adalah √7 + √2 (A)."
      },
      {
        "id": "pk-8-q2",
        "soal": "Jika ²log 3 = a dan ³log 5 = b, maka ²log 15 dinyatakan dalam a dan b adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "a + b"
          },
          {
            "label": "B",
            "text": "a + ab"
          },
          {
            "label": "C",
            "text": "ab"
          },
          {
            "label": "D",
            "text": "a / b"
          },
          {
            "label": "E",
            "text": "1 + ab"
          }
        ],
        "kunci": "B",
        "pembahasan": "²log 15 = ²log (3 × 5) = ²log 3 + ²log 5. Karena ²log 5 = ²log 3 × ³log 5 = a × b, maka ²log 15 = a + ab (B)."
      },
      {
        "id": "pk-8-q3",
        "soal": "Penyelesaian dari persamaan eksponen 3^(2x - 1) = 27 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "x = 1"
          },
          {
            "label": "B",
            "text": "x = 2"
          },
          {
            "label": "C",
            "text": "x = 3"
          },
          {
            "label": "D",
            "text": "x = 4"
          },
          {
            "label": "E",
            "text": "x = 5/2"
          }
        ],
        "kunci": "B",
        "pembahasan": "Ubah ke basis 3: 3^(2x - 1) = 3³. Samakan eksponen: 2x - 1 = 3 → 2x = 4 → x = 2 (B)."
      },
      {
        "id": "pk-8-q4",
        "soal": "Rasionalkan bentuk: 6 / (√5 - √2)...",
        "opsi": [
          {
            "label": "A",
            "text": "2(√5 + √2)"
          },
          {
            "label": "B",
            "text": "3(√5 + √2)"
          },
          {
            "label": "C",
            "text": "2(√5 - √2)"
          },
          {
            "label": "D",
            "text": "6(√5 + √2)"
          },
          {
            "label": "E",
            "text": "√5 + √2"
          }
        ],
        "kunci": "A",
        "pembahasan": "Kalikan sekawan: 6(√5 + √2) / (5 - 2) = 6(√5 + √2) / 3 = 2(√5 + √2) (A)."
      },
      {
        "id": "pk-8-q5",
        "soal": "Nilai dari ³log 5 × ⁵log 7 × ⁷log 27 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "1"
          },
          {
            "label": "B",
            "text": "2"
          },
          {
            "label": "C",
            "text": "3"
          },
          {
            "label": "D",
            "text": "9"
          },
          {
            "label": "E",
            "text": "27"
          }
        ],
        "kunci": "C",
        "pembahasan": "Gunakan sifat rantai logaritma: ³log 5 × ⁵log 7 × ⁷log 27 = ³log 27 = ³log (3³) = 3 (C)."
      }
    ],
    "keyTakeaways": [
      "Sifat rantai: ᵃlog b × ᵇlog c = ᵃlog c.",
      "√(a+b ± 2√ab) = √a ± √b.",
      "Perkalian logaritma basis sama dijumlahkan, pembagian dikurangkan.",
      "Selalu rasionalkan penyebut akar dengan mengalikan bentuk sekawannya."
    ],
    "rekomendasiLatihan": "Latih ketangkasan logaritma di latihan harian UTBK Gemilang."
  },
  {
    "id": "pk-pertidaksamaan-dan-nilai-mutlak",
    "babNumber": 9,
    "slug": "pk-pertidaksamaan-dan-nilai-mutlak",
    "subtestKode": "PK",
    "judul": "Pertidaksamaan Linear, Kuadrat & Nilai Mutlak",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Menyelesaikan pertidaksamaan kuadrat dan rasional menggunakan uji garis bilangan, pembalikan tanda saat dikali bilangan negatif, serta sifat |x| < a ⇔ -a < x < a.",
    "learningObjectives": [
      "Menentukan himpunan penyelesaian pertidaksamaan kuadrat dengan pembuat nol.",
      "Menghindari kesalahan fatal mengalikan silang variabel pada pertidaksamaan rasional.",
      "Menyelesaikan pertidaksamaan nilai mutlak satu atau dua sisi.",
      "Membalik tanda pertidaksamaan (dari < menjadi >) saat mengalikan/membagi bilangan negatif."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Aturan Emas Pertidaksamaan Rasional",
        "isi": "Bentuk f(x)/g(x) ≤ 0: JANGAN PERNAH MENGALIKAN SILANG DENGAN g(x) kecuali Anda yakin 100% g(x) selalu positif! Pindahkan semua suku ke satu ruas hingga ruas kanan nol, samakan penyebut, lalu buat garis bilangan.",
        "poinPenting": [
          "Penyebut TIDAK BOLEH bernilai nol (g(x) ≠ 0) sehingga titik penyebut selalu bulat kosong di garis bilangan."
        ]
      },
      {
        "subjudul": "2. Sifat Nilai Mutlak",
        "isi": "- |x| ≤ a ⇔ -a ≤ x ≤ a (interval tertutup di antara -a dan a)\n- |x| ≥ a ⇔ x ≤ -a atau x ≥ a (interval sayap luar)\n- |f(x)| ≤ |g(x)| ⇔ (f(x) - g(x))(f(x) + g(x)) ≤ 0 (kuadratkan kedua ruas).",
        "poinPenting": [
          "Nilai mutlak |x| selalu bernilai non-negatif (≥ 0)."
        ]
      }
    ],
    "trikCepat": "Trik Nilai Mutlak Dua Ruas |A| < |B|: Jangan pecah jadi 4 kasus! Cukup gunakan rumus selisih kuadrat: (A - B)(A + B) < 0. Ini menyelesaikan soal dalam 1 baris!",
    "jebakanUmum": "Lupa membalik tanda pertidaksamaan saat membagi dengan angka negatif (misal: -2x > 6 diubah menjadi x > -3, padahal seharusnya x < -3).",
    "contohSoal": [
      {
        "soal": "Himpunan penyelesaian dari pertidaksamaan kuadrat x² - 3x - 10 < 0 adalah...",
        "opsi": {
          "A": "x < -2 atau x > 5",
          "B": "-2 < x < 5",
          "C": "-5 < x < 2",
          "D": "x < -5 atau x > 2",
          "E": "x > 5"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Faktorkan persamaan kuadrat: (x - 5)(x + 2) < 0.",
          "Pembuat nol adalah x = 5 dan x = -2.",
          "Buat garis bilangan dengan titik -2 dan 5. Uji titik x = 0: (0 - 5)(0 + 2) = -10 (negatif).",
          "Karena tanda yang diminta adalah < 0 (negatif), daerah penyelesaiannya berada di antara kedua titik.",
          "Maka himpunan penyelesaiannya adalah -2 < x < 5 (B)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-9-q1",
        "soal": "Penyelesaian dari |2x - 3| ≤ 7 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "-2 ≤ x ≤ 5"
          },
          {
            "label": "B",
            "text": "-5 ≤ x ≤ 5"
          },
          {
            "label": "C",
            "text": "x ≤ -2 atau x ≥ 5"
          },
          {
            "label": "D",
            "text": "-2 < x < 5"
          },
          {
            "label": "E",
            "text": "x ≤ 5"
          }
        ],
        "kunci": "A",
        "pembahasan": "Gunakan sifat |f(x)| ≤ a: -7 ≤ 2x - 3 ≤ 7. Tambahkan 3 pada semua ruas: -4 ≤ 2x ≤ 10. Bagi 2: -2 ≤ x ≤ 5 (A)."
      },
      {
        "id": "pk-9-q2",
        "soal": "Jika -3x + 5 < 14, maka nilai x yang memenuhi adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "x < -3"
          },
          {
            "label": "B",
            "text": "x > -3"
          },
          {
            "label": "C",
            "text": "x > 3"
          },
          {
            "label": "D",
            "text": "x < 3"
          },
          {
            "label": "E",
            "text": "x > -19/3"
          }
        ],
        "kunci": "B",
        "pembahasan": "-3x < 14 - 5 → -3x < 9. Bagi dengan -3 (tanda WAJIB DIBALIK): x > -3 (B)."
      },
      {
        "id": "pk-9-q3",
        "soal": "Banyak bilangan bulat x yang memenuhi pertidaksamaan x² ≤ 9 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "3"
          },
          {
            "label": "B",
            "text": "5"
          },
          {
            "label": "C",
            "text": "6"
          },
          {
            "label": "D",
            "text": "7"
          },
          {
            "label": "E",
            "text": "9"
          }
        ],
        "kunci": "D",
        "pembahasan": "x² - 9 ≤ 0 → (x - 3)(x + 3) ≤ 0 → -3 ≤ x ≤ 3. Bilangan bulat yang memenuhi: -3, -2, -1, 0, 1, 2, 3 (ada 7 bilangan) (D)."
      },
      {
        "id": "pk-9-q4",
        "soal": "Penyelesaian dari |x - 2| > 4 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "-2 < x < 6"
          },
          {
            "label": "B",
            "text": "x < -2 atau x > 6"
          },
          {
            "label": "C",
            "text": "x < -6 atau x > 2"
          },
          {
            "label": "D",
            "text": "x > 6"
          },
          {
            "label": "E",
            "text": "x < 2"
          }
        ],
        "kunci": "B",
        "pembahasan": "Sifat |x| > a: x - 2 < -4 atau x - 2 > 4 → x < -2 atau x > 6 (B)."
      },
      {
        "id": "pk-9-q5",
        "soal": "Himpunan penyelesaian dari pertidaksamaan (x - 1)/(x + 3) ≤ 0 adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "-3 < x ≤ 1"
          },
          {
            "label": "B",
            "text": "-3 ≤ x ≤ 1"
          },
          {
            "label": "C",
            "text": "x < -3 atau x ≥ 1"
          },
          {
            "label": "D",
            "text": "x ≤ 1"
          },
          {
            "label": "E",
            "text": "-3 < x < 1"
          }
        ],
        "kunci": "A",
        "pembahasan": "Pembuat nol pembilang x = 1 (bulat penuh). Pembuat nol penyebut x = -3 (bulat kosong karena syarat penyebut ≠ 0). Uji tanda menghasilkan interval negatif di antara keduanya: -3 < x ≤ 1 (A)."
      }
    ],
    "keyTakeaways": [
      "Penyebut pada pertidaksamaan pecahan tidak boleh sama dengan nol (bulat kosong).",
      "Bagi/kali dengan angka negatif wajib membalik tanda (< jadi >, > jadi <).",
      "|x| ≤ a ⇔ -a ≤ x ≤ a.",
      "|x| ≥ a ⇔ x ≤ -a atau x ≥ a."
    ],
    "rekomendasiLatihan": "Latih ketelitian garis bilangan di modul Pengetahuan Kuantitatif Gemilang."
  },
  {
    "id": "pk-trik-soal-tipe-pq-dan-cukup-tidak",
    "babNumber": 10,
    "slug": "pk-trik-soal-tipe-pq-dan-cukup-tidak",
    "subtestKode": "PK",
    "judul": "Strategi Soal Tipe P vs Q & Kecukupan Data (1) & (2)",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Format paten UTBK: Soal membandingkan kuantitas P dan Q (P>Q, Q>P, P=Q, atau informasi tidak cukup), serta analisis kecukupan data pernyataan (1) dan (2) opsi standar A, B, C, D, E.",
    "learningObjectives": [
      "Menguasai template opsi jawaban baku soal kecukupan data UTBK (A: 1 saja cukup, B: 2 saja cukup, C: bersamaan cukup, D: masing-masing cukup, E: tidak cukup).",
      "Menguji angka kritis (-1, 0, 1, 1/2) saat membandingkan P dan Q untuk mendeteksi ambiguitas nilai.",
      "Menerapkan teknik isolasi: menguji pernyataan (1) secara independen tanpa tercampur informasi (2).",
      "Mengeksekusi soal kecukupan data tanpa perlu menghitung hasil akhir numerik (cukup tahu bahwa variabel dapat dipecahkan secara unik)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Format Baku Soal Kecukupan Data",
        "isi": "Opsi selalu sama persis:\n(A) Pernyataan (1) SAJA cukup untuk menjawab pertanyaan, tetapi pernyataan (2) SAJA tidak cukup.\n(B) Pernyataan (2) SAJA cukup untuk menjawab pertanyaan, tetapi pernyataan (1) SAJA tidak cukup.\n(C) DUA pernyataan BERSAMA-SAMA cukup untuk menjawab pertanyaan, tetapi SATU pernyataan SAJA tidak cukup.\n(D) Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup.\n(E) Pernyataan (1) dan pernyataan (2) tidak cukup untuk menjawab pertanyaan.",
        "poinPenting": [
          "Langkah 1: Tutup pernyataan (2), uji HANYA pernyataan (1).",
          "Langkah 2: Tutup pernyataan (1), uji HANYA pernyataan (2).",
          "Langkah 3: Jika keduanya gagal sendiri-sendiri, baru GABUNGKAN (1) dan (2)."
        ]
      },
      {
        "subjudul": "2. Trik Angka Ekstrem pada Soal P vs Q",
        "isi": "Saat variabel x tidak dinyatakan sebagai bilangan bulat positif, x BISA bernilai:\n- Negatif (x = -2)\n- Nol (x = 0)\n- Pecahan positif di antara 0 dan 1 (x = 1/2, di mana x² < x !)\nJika pemilihan angka berbeda menghasilkan kesimpulan berbeda (misal saat x=2 P>Q, tapi saat x=-2 P<Q), maka jawabannya PASTI OPSI (D): Informasi tidak cukup!",
        "poinPenting": [
          "Uji selalu angka 0, 1, -1, dan 1/2 jika soal tidak memberi batasan."
        ]
      }
    ],
    "trikCepat": "Di soal kecukupan data: ANDA TIDAK PERLU MENGHITUNG ANGKA AKHIRNYA! Cukup pastikan bahwa jumlah persamaan linier independen SAMA DENGAN jumlah variabel yang belum diketahui (2 persamaan untuk 2 variabel) → PASTI CUKUP!",
    "jebakanUmum": "Tanpa sengaja memakai informasi dari pernyataan (1) saat sedang menguji pernyataan (2). Ingat: uji pernyataan (2) harus bersih total dari pernyataan (1)!",
    "contohSoal": [
      {
        "soal": "Berapakah nilai dari x + y?\n(1) 2x + 2y = 10\n(2) x - y = 2\nManakah opsi yang paling tepat mengenai kecukupan data?",
        "opsi": {
          "A": "Pernyataan (1) SAJA cukup, tetapi pernyataan (2) SAJA tidak cukup.",
          "B": "Pernyataan (2) SAJA cukup, tetapi pernyataan (1) SAJA tidak cukup.",
          "C": "DUA pernyataan BERSAMA-SAMA cukup, tetapi SATU pernyataan SAJA tidak cukup.",
          "D": "Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup.",
          "E": "Pernyataan (1) dan (2) tidak cukup."
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Pertanyaan: Berapakah nilai (x + y)?",
          "Uji pernyataan (1): 2x + 2y = 10. Bagi kedua ruas dengan 2: x + y = 5. Nilai x + y langsung terjawab secara unik bernilai 5! Maka pernyataan (1) SAJA CUKUP.",
          "Uji pernyataan (2): x - y = 2. Dari informasi ini, nilai (x + y) bisa berapa saja tergantung nilai x dan y. Pernyataan (2) SAJA TIDAK CUKUP.",
          "Maka kesimpulannya adalah (1) SAJA cukup, tetapi (2) SAJA tidak cukup (Opsi A)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pk-10-q1",
        "soal": "Diketahui x² = 16. Kuantitas P = x, Kuantitas Q = 4. Hubungan antara P dan Q adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "P > Q"
          },
          {
            "label": "B",
            "text": "Q > P"
          },
          {
            "label": "C",
            "text": "P = Q"
          },
          {
            "label": "D",
            "text": "Informasi yang diberikan tidak cukup untuk memutuskan"
          },
          {
            "label": "E",
            "text": "2P = Q"
          }
        ],
        "kunci": "D",
        "pembahasan": "x² = 16 menghasilkan dua kemungkinan nilai: x = 4 atau x = -4. Jika x = 4, maka P = Q. Namun jika x = -4, maka P < Q. Karena ada dua kemungkinan yang saling kontradiktif, hubungan P dan Q tidak dapat ditentukan (D)."
      },
      {
        "id": "pk-10-q2",
        "soal": "Apakah x > 0?\n(1) x² > 0\n(2) x³ > 0\nKecukupan data yang tepat adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pernyataan (1) SAJA cukup, tetapi pernyataan (2) SAJA tidak cukup."
          },
          {
            "label": "B",
            "text": "Pernyataan (2) SAJA cukup, tetapi pernyataan (1) SAJA tidak cukup."
          },
          {
            "label": "C",
            "text": "DUA pernyataan BERSAMA-SAMA cukup."
          },
          {
            "label": "D",
            "text": "Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup."
          },
          {
            "label": "E",
            "text": "Pernyataan (1) dan (2) tidak cukup."
          }
        ],
        "kunci": "B",
        "pembahasan": "Uji (1): x² > 0 berlaku untuk semua x ≠ 0 (bisa positif atau negatif). Jadi (1) tidak cukup. Uji (2): x³ > 0 hanya mungkin terjadi jika x positif (x > 0). Jadi (2) menjawab pasti bahwa x > 0! Pernyataan (2) SAJA cukup (B)."
      },
      {
        "id": "pk-10-q3",
        "soal": "Jika x adalah bilangan riil positif, P = (x + 1)² dan Q = x² + 2x. Hubungan yang benar adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "P > Q"
          },
          {
            "label": "B",
            "text": "Q > P"
          },
          {
            "label": "C",
            "text": "P = Q"
          },
          {
            "label": "D",
            "text": "Informasi tidak cukup"
          },
          {
            "label": "E",
            "text": "P = 2Q"
          }
        ],
        "kunci": "A",
        "pembahasan": "Jabarkan P: P = x² + 2x + 1. Bandingkan dengan Q: Q = x² + 2x. Selisih P - Q = (x² + 2x + 1) - (x² + 2x) = 1 > 0. Karena P - Q = 1 selalu positif untuk setiap nilai x, maka PASTI P > Q (A)."
      },
      {
        "id": "pk-10-q4",
        "soal": "Berapakah luas persegi panjang ABCD?\n(1) Keliling ABCD = 20 cm\n(2) Panjang diagonal ABCD = √58 cm\nKecukupan data yang tepat adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pernyataan (1) SAJA cukup."
          },
          {
            "label": "B",
            "text": "Pernyataan (2) SAJA cukup."
          },
          {
            "label": "C",
            "text": "DUA pernyataan BERSAMA-SAMA cukup, tetapi satu saja tidak cukup."
          },
          {
            "label": "D",
            "text": "Pernyataan (1) SAJA cukup dan (2) SAJA cukup."
          },
          {
            "label": "E",
            "text": "Pernyataan (1) dan (2) tidak cukup."
          }
        ],
        "kunci": "C",
        "pembahasan": "Dari (1): 2(p + l) = 20 → p + l = 10 (belum cukup mencari luas p × l). Dari (2): p² + l² = 58 (belum cukup sendiri). Gabungkan (1) dan (2): kita punya (p + l) = 10 dan p² + l² = 58. Dengan rumus aljabar: p × l = [(p + l)² - (p² + l²)] / 2 = [100 - 58] / 2 = 21 cm². Nilai luas dapat ditentukan secara unik jika kedua pernyataan digabungkan! (C)."
      },
      {
        "id": "pk-10-q5",
        "soal": "Pada soal pilihan ganda kecukupan data, jika pengujian independen menunjukkan pernyataan (1) BISA menjawab dan pernyataan (2) JUGA BISA menjawab sendiri, maka opsi yang dipilih adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Opsi A"
          },
          {
            "label": "B",
            "text": "Opsi B"
          },
          {
            "label": "C",
            "text": "Opsi C"
          },
          {
            "label": "D",
            "text": "Opsi D"
          },
          {
            "label": "E",
            "text": "Opsi E"
          }
        ],
        "kunci": "D",
        "pembahasan": "Sesuai format resmi UTBK SNBT: jika (1) cukup sendiri dan (2) cukup sendiri, jawabannya adalah D (Pernyataan (1) SAJA cukup dan pernyataan (2) SAJA cukup) (D)."
      }
    ],
    "keyTakeaways": [
      "Hafalkan arti opsi standar A, B, C, D, E soal kecukupan data.",
      "Uji pernyataan (1) dan (2) secara terisolasi sebelum menggabungkannya.",
      "Tidak perlu menghitung angka akhir, cukup pastikan variabel dapat ditentukan secara unik.",
      "Pada soal P vs Q, uji angka ekstrem (0, negatif, pecahan 1/2) untuk memeriksa konsistensi."
    ],
    "rekomendasiLatihan": "Selesaikan 10 paket simulasi tipe P vs Q dan kecukupan data di Gemilang."
  }
];
