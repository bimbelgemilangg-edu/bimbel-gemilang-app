// src/data/modul/puModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Micro-learning Standard)
// 100% UNLOCKED & TERINTEGRASI

export const PU_MODUL = [
  {
    "id": "pu-logika-proposisi",
    "babNumber": 1,
    "slug": "pu-logika-proposisi",
    "subtestKode": "PU",
    "judul": "Logika Proposisi & Pernyataan Majemuk",
    "durasiBacaMenit": 12,
    "ringkasanSingkat": "Memahami tabel kebenaran konjungsi, disjungsi, implikasi, dan biimplikasi serta ekuivalensi bentuk implikasi p → q ≡ ~p ∨ q ≡ ~q → ~p.",
    "learningObjectives": [
      "Membedakan proposisi tunggal dan pernyataan majemuk dalam konteks teks.",
      "Menentukan nilai kebenaran dan ingkaran (negasi) dari konjungsi dan disjungsi (Hukum De Morgan).",
      "Menerapkan ekuivalensi implikasi (kontraposisi) untuk menyederhanakan argumen logis UTBK.",
      "Mengidentifikasi jebakan kesimpulan yang terbalik (converse/inverse error)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Tabel Kebenaran Pernyataan Majemuk",
        "isi": "Dalam logika matematika UTBK, proposisi adalah kalimat deklaratif bernilai benar (B) atau salah (S), tidak keduanya. Hubungan majemuk meliputi: Konjungsi (p ∧ q: benar jika keduanya benar), Disjungsi (p ∨ q: salah jika keduanya salah), dan Implikasi (p → q: salah HANYA JIKA premis p benar tetapi akibat q salah).",
        "poinPenting": [
          "Konjungsi: 'p dan q' bernilai B hanya jika p=B dan q=B.",
          "Disjungsi: 'p atau q' bernilai S hanya jika p=S dan q=S.",
          "Implikasi: 'jika p maka q' (p → q) bernilai S hanya jika p=B dan q=S (Janji diingkari)."
        ]
      },
      {
        "subjudul": "2. Ekuivalensi Emas Implikasi & Hukum De Morgan",
        "isi": "Dua pernyataan ekuivalen (≡) memiliki tabel kebenaran identik. Rumus sakti implikasi: p → q ≡ ~q → ~p (kontraposisi) dan p → q ≡ ~p ∨ q. Negasi implikasi: ~(p → q) ≡ p ∧ ~q.",
        "poinPenting": [
          "Kontraposisi: 'Jika hujan maka jalan basah' EKUIVALEN dengan 'Jika jalan TIDAK basah maka TIDAK hujan'.",
          "Ingkaran Implikasi: Ingkaran dari 'Jika Anda belajar maka lulus' adalah 'Anda belajar TETAPI Anda tidak lulus'.",
          "De Morgan: ~(p ∧ q) ≡ ~p ∨ ~q dan ~(p ∨ q) ≡ ~p ∧ ~q."
        ]
      }
    ],
    "trikCepat": "Jika menjumpai soal 'Pernyataan yang setara dengan: Jika x maka y', langsung cari opsi KONTRA-POSISI: 'Jika tidak y maka tidak x' (~q → ~p) atau 'Tidak x atau y' (~p ∨ q). Abaikan opsi 'Jika tidak x maka tidak y' (Invers) karena TIDAK setara!",
    "jebakanUmum": "Siswa sering mengira kebalikan 'Jika p maka q' adalah 'Jika q maka p' (Konvers). Ingat: Konvers dan Invers BUKAN ekuivalensi logis valid!",
    "contohSoal": [
      {
        "soal": "Pernyataan: 'Jika seorang siswa rajin berlatih soal UTBK setiap hari, maka skor try out-nya akan meningkat pesat.' Bentuk yang ekuivalen secara logika adalah...",
        "opsi": {
          "A": "Jika skor try out seorang siswa tidak meningkat pesat, maka ia tidak rajin berlatih soal UTBK setiap hari.",
          "B": "Jika seorang siswa tidak rajin berlatih soal UTBK setiap hari, maka skor try out-nya tidak akan meningkat pesat.",
          "C": "Jika skor try out seorang siswa meningkat pesat, maka ia rajin berlatih soal UTBK setiap hari.",
          "D": "Seorang siswa tidak rajin berlatih soal UTBK setiap hari dan skor try out-nya meningkat pesat.",
          "E": "Skor try out siswa meningkat pesat atau ia rajin berlatih soal UTBK setiap hari."
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Misalkan p = 'siswa rajin berlatih soal UTBK setiap hari' dan q = 'skor try out-nya meningkat pesat'. Kalimat bermodel p → q.",
          "Ekuivalensi logis dari implikasi p → q adalah kontraposisi (~q → ~p) atau bentuk disjungsi (~p ∨ q).",
          "Bentuk ~q → ~p berbunyi: 'Jika skor try out seorang siswa TIDAK meningkat pesat (~q), maka ia TIDAK rajin berlatih soal UTBK setiap hari (~p)'.",
          "Opsi B adalah invers (~p → ~q, keliru), Opsi C adalah konvers (q → p, keliru). Jawaban tepat adalah A."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pu-1-q1",
        "soal": "Ingkaran (negasi) dari pernyataan: 'Semua peserta ujian membawa kartu peserta dan alat tulis lengkap' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Semua peserta ujian tidak membawa kartu peserta atau tidak membawa alat tulis lengkap."
          },
          {
            "label": "B",
            "text": "Beberapa peserta ujian tidak membawa kartu peserta atau tidak membawa alat tulis lengkap."
          },
          {
            "label": "C",
            "text": "Ada peserta ujian yang tidak membawa kartu peserta dan tidak membawa alat tulis lengkap."
          },
          {
            "label": "D",
            "text": "Tidak ada peserta ujian yang membawa kartu peserta maupun alat tulis lengkap."
          },
          {
            "label": "E",
            "text": "Beberapa peserta ujian membawa kartu peserta tetapi tidak membawa alat tulis."
          }
        ],
        "kunci": "B",
        "pembahasan": "Negasi dari kuantor universal 'Semua P' adalah 'Ada/Beberapa ~P'. Menurut Hukum De Morgan, negasi dari 'membawa kartu (A) DAN alat tulis (B)' adalah '~A ATAU ~B' (tidak membawa kartu ATAU tidak membawa alat tulis). Jadi negasi lengkapnya: 'Ada/Beberapa peserta yang tidak membawa kartu peserta atau tidak membawa alat tulis lengkap'. Opsi B paling tepat."
      },
      {
        "id": "pu-1-q2",
        "soal": "Diketahui premis: 'Jika cuaca mendung, maka Adi membawa payung.' Pernyataan berikut yang bernilai salah ketika kenyataannya Adi membawa payung padahal cuaca tidak mendung adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Jika Adi membawa payung, maka cuaca mendung."
          },
          {
            "label": "B",
            "text": "Jika cuaca mendung, maka Adi membawa payung."
          },
          {
            "label": "C",
            "text": "Cuaca mendung dan Adi membawa payung."
          },
          {
            "label": "D",
            "text": "Adi membawa payung atau cuaca mendung."
          },
          {
            "label": "E",
            "text": "Jika cuaca tidak mendung, maka Adi tidak membawa payung."
          }
        ],
        "kunci": "E",
        "pembahasan": "Fakta: p = Salah (cuaca tidak mendung, ~p=B), q = Benar (Adi membawa payung). Periksa opsi E: 'Jika cuaca tidak mendung (~p, Benar) maka Adi tidak membawa payung (~q, Salah)'. Implikasi Benar → Salah selalu bernilai SALAH. Maka pernyataan pada opsi E bernilai salah."
      },
      {
        "id": "pu-1-q3",
        "soal": "Pernyataan: 'Hari ini tidak hujan atau lapangan sepak bola basah' setara secara logika dengan...",
        "opsi": [
          {
            "label": "A",
            "text": "Jika hari ini hujan, maka lapangan sepak bola basah."
          },
          {
            "label": "B",
            "text": "Jika hari ini tidak hujan, maka lapangan sepak bola tidak basah."
          },
          {
            "label": "C",
            "text": "Jika lapangan sepak bola basah, maka hari ini hujan."
          },
          {
            "label": "D",
            "text": "Hari ini hujan dan lapangan sepak bola basah."
          },
          {
            "label": "E",
            "text": "Jika hari ini hujan, maka lapangan sepak bola kering."
          }
        ],
        "kunci": "A",
        "pembahasan": "Bentuk 'tidak p atau q' (~p ∨ q) ekuivalen secara logika dengan implikasi 'p → q' (Jika p maka q). Di sini p = 'Hari ini hujan', q = 'lapangan sepak bola basah'. Maka ~p ∨ q ≡ 'Jika hari ini hujan, maka lapangan sepak bola basah'."
      },
      {
        "id": "pu-1-q4",
        "soal": "Jika premis 'p → q' bernilai Benar dan premis 'q → r' bernilai Benar, tetapi diketahui bahwa 'r' bernilai Salah, maka nilai kebenaran dari proposisi p, q berturut-turut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Benar, Benar"
          },
          {
            "label": "B",
            "text": "Benar, Salah"
          },
          {
            "label": "C",
            "text": "Salah, Benar"
          },
          {
            "label": "D",
            "text": "Salah, Salah"
          },
          {
            "label": "E",
            "text": "Tidak dapat ditentukan"
          }
        ],
        "kunci": "D",
        "pembahasan": "Diketahui r = S. Agar implikasi q → r bernilai Benar saat r = S, maka q HARUS bernilai Salah (karena B → S = S). Selanjutnya, karena q = S, agar implikasi p → q bernilai Benar, maka p HARUS bernilai Salah. Jadi p = Salah dan q = Salah (D)."
      },
      {
        "id": "pu-1-q5",
        "soal": "Ingkaran dari 'Jika harga BBM naik, maka ongkos transportasi umum naik dan daya beli masyarakat turun' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Harga BBM naik, tetapi ongkos transportasi umum tidak naik atau daya beli masyarakat tidak turun."
          },
          {
            "label": "B",
            "text": "Jika harga BBM tidak naik, maka ongkos transportasi tidak naik dan daya beli tidak turun."
          },
          {
            "label": "C",
            "text": "Harga BBM tidak naik dan ongkos transportasi umum turun."
          },
          {
            "label": "D",
            "text": "Harga BBM naik dan ongkos transportasi umum tidak naik serta daya beli tetap tinggi."
          },
          {
            "label": "E",
            "text": "Jika ongkos transportasi umum tidak naik, maka harga BBM tidak naik."
          }
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan berbentuk p → (q ∧ r). Negasi dari implikasi p → K adalah p ∧ ~K. Di sini ~K = ~(q ∧ r) = ~q ∨ ~r (Hukum De Morgan). Jadi negasinya adalah: p dan (~q atau ~r), yaitu 'Harga BBM naik, TETAPI ongkos transportasi tidak naik ATAU daya beli masyarakat tidak turun'."
      }
    ],
    "keyTakeaways": [
      "Implikasi p → q hanya bernilai Salah jika p=B dan q=S.",
      "Ekuivalensi mutlak: p → q ≡ ~q → ~p (kontraposisi) ≡ ~p ∨ q.",
      "Negasi implikasi: ~(p → q) ≡ p ∧ ~q (ingkaran implikasi BUKAN implikasi lagi, melainkan konjungsi!).",
      "Negasi kuantor: ~(Semua P) = Ada ~P, dan ~(Ada P) = Semua ~P."
    ],
    "rekomendasiLatihan": "Lanjutkan ke latihan subtes Penalaran Umum di Roadmap Unit 1 atau Latihan Harian untuk memperkuat pola kecepatan 45 detik/soal."
  },
  {
    "id": "pu-kuantor-dan-silogisme",
    "babNumber": 2,
    "slug": "pu-kuantor-dan-silogisme",
    "subtestKode": "PU",
    "judul": "Kuantor & Silogisme (Ponens, Tollens, Hipotetis)",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Menguasai 3 kaidah penarikan simpulan sah: Modus Ponens, Modus Tollens, dan Silogisme Hipotetis, serta logika himpunan diagram Venn untuk kuantor universal dan eksistensial.",
    "learningObjectives": [
      "Menerapkan Modus Ponens (p → q, p ⊢ q) secara tepat tanpa terjebak affirming the consequent.",
      "Menerapkan Modus Tollens (p → q, ~q ⊢ ~p) secara tepat tanpa terjebak denying the antecedent.",
      "Menyusun rantai penalaran silogisme hipotetis multitingkat (p → q, q → r ⊢ p → r).",
      "Menyelesaikan silogisme berkuantor 'sebagian/beberapa' menggunakan diagram irisan Venn."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Tiga Kaidah Penarikan Kesimpulan Sah",
        "isi": "Ada 3 kaidah deduksi yang diakui sah (valid) dalam SNBT:\n1. Modus Ponens: Premis 1: p → q, Premis 2: p. Kesimpulan: q.\n2. Modus Tollens: Premis 1: p → q, Premis 2: ~q. Kesimpulan: ~p.\n3. Silogisme Hipotetis: Premis 1: p → q, Premis 2: q → r. Kesimpulan: p → r.",
        "poinPenting": [
          "Ponens menegaskan anteseden: 'Jika rajin maka juara. Desta rajin. Kesimpulan: Desta juara.'",
          "Tollens menyangkal konsekuen: 'Jika rajin maka juara. Desta tidak juara. Kesimpulan: Desta tidak rajin.'",
          "Kekeliruan Populer: 'Jika rajin maka juara. Desta juara. Maka Desta rajin' (SALAH! Ini fallacy affirming the consequent)."
        ]
      },
      {
        "subjudul": "2. Silogisme Kuantor (Semua vs Sebagian)",
        "isi": "Kuantor Universal ('Semua', 'Setiap'): berlaku bagi seluruh anggota himpunan A ⊆ B. Kuantor Eksistensial ('Beberapa', 'Sebagian', 'Ada', 'Sementara'): menyatakan minimal ada 1 anggota yang beririsan (A ∩ B ≠ ∅).",
        "poinPenting": [
          "Semua A adalah B + Semua B adalah C ⇒ Semua A adalah C.",
          "Semua A adalah B + Beberapa A adalah C ⇒ Beberapa B adalah C (atau Beberapa C adalah B).",
          "Beberapa A adalah B + Beberapa B adalah C ⇒ TIDAK DAPAT DITARIK KESIMPULAN PASTI antar A dan C."
        ]
      }
    ],
    "trikCepat": "Trik Kata Kunci: Jika salah satu premis menggunakan kata 'BEBERAPA'/'SEBAGIAN', maka kesimpulan WAJIB memuat kata 'BEBERAPA'/'SEBAGIAN'. Tidak boleh ditarik kesimpulan 'SEMUA'. Jika kedua premis 'BEBERAPA', kesimpulan umumnya TIDAK DAPAT DISIMPULKAN.",
    "jebakanUmum": "Menarik kesimpulan 'Semua' padahal salah satu premisnya 'sebagian'. Atau membalik Modus Tollens: 'Jika p maka q, ternyata ~p, lalu menyimpulkan ~q' (Ini sesat pikir menolak anteseden).",
    "contohSoal": [
      {
        "soal": "Premis 1: Semua atlet pelari maraton memiliki daya tahan kardiovaskular tinggi.\nPremis 2: Sebagian atlet pelari maraton rajin mengonsumsi suplemen elektrolit.\nKesimpulan yang sah adalah...",
        "opsi": {
          "A": "Semua orang yang memiliki daya tahan kardiovaskular tinggi rajin mengonsumsi suplemen elektrolit.",
          "B": "Sebagian orang yang memiliki daya tahan kardiovaskular tinggi rajin mengonsumsi suplemen elektrolit.",
          "C": "Semua atlet pelari maraton rajin mengonsumsi suplemen elektrolit.",
          "D": "Sebagian orang yang rajin mengonsumsi suplemen elektrolit bukan pelari maraton.",
          "E": "Daya tahan kardiovaskular tinggi hanya dimiliki atlet yang mengonsumsi suplemen elektrolit."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Himpunan M = Atlet pelari maraton, K = Berdaya tahan kardiovaskular tinggi, E = Rajin suplemen elektrolit.",
          "Premis 1: M ⊆ K (Semua M adalah K).",
          "Premis 2: M ∩ E ≠ ∅ (Sebagian M adalah E).",
          "Karena seluruh M berada di dalam K, maka irisan antara M dan E otomatis berada di dalam K.",
          "Artinya, ada sebagian anggota K yang juga merupakan anggota E. Kesimpulan: 'Sebagian orang yang memiliki daya tahan kardiovaskular tinggi rajin mengonsumsi suplemen elektrolit' (B)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pu-2-q1",
        "soal": "Premis 1: Jika server pusat mengalami lonjakan beban, maka sistem aplikasi akan otomatis melakukan failover.\nPremis 2: Sistem aplikasi tidak melakukan failover.\nKesimpulan yang valid menurut kaidah logika adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Server pusat mengalami lonjakan beban."
          },
          {
            "label": "B",
            "text": "Server pusat tidak mengalami lonjakan beban."
          },
          {
            "label": "C",
            "text": "Sistem aplikasi mengalami kerusakan total."
          },
          {
            "label": "D",
            "text": "Failover dilakukan secara manual oleh teknisi."
          },
          {
            "label": "E",
            "text": "Tidak dapat ditarik kesimpulan."
          }
        ],
        "kunci": "B",
        "pembahasan": "Kaidah Modus Tollens: p → q, ~q. Maka kesimpulannya adalah ~p. Di sini p = 'server mengalami lonjakan beban' dan q = 'sistem melakukan failover'. Fakta: ~q (sistem tidak melakukan failover). Maka simpulan: ~p ('Server pusat tidak mengalami lonjakan beban'). Opsi B tepat."
      },
      {
        "id": "pu-2-q2",
        "soal": "Premis 1: Semua dosen Fakultas Sains membimbing riset mahasiswa.\nPremis 2: Beberapa dosen Fakultas Sains mempublikasikan jurnal internasional bereputasi.\nKesimpulan yang paling tepat adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Semua dosen yang membimbing riset mahasiswa mempublikasikan jurnal internasional."
          },
          {
            "label": "B",
            "text": "Beberapa pembimbing riset mahasiswa mempublikasikan jurnal internasional bereputasi."
          },
          {
            "label": "C",
            "text": "Semua dosen Fakultas Sains mempublikasikan jurnal internasional bereputasi."
          },
          {
            "label": "D",
            "text": "Beberapa dosen Fakultas Sains tidak membimbing riset mahasiswa."
          },
          {
            "label": "E",
            "text": "Dosen yang mempublikasikan jurnal internasional bukan dosen Fakultas Sains."
          }
        ],
        "kunci": "B",
        "pembahasan": "Dosen Sains ⊆ Pembimbing Riset. Sebagian Dosen Sains ∈ Publikasi Jurnal. Karena mereka adalah pembimbing riset, maka sebagian pembimbing riset mahasiswa mempublikasikan jurnal internasional bereputasi (B)."
      },
      {
        "id": "pu-2-q3",
        "soal": "Perhatikan argumen berikut:\nPremis 1: Jika nilai tukar rupiah menguat, maka inflasi barang impor terkendali.\nPremis 2: Jika inflasi barang impor terkendali, maka daya beli masyarakat meningkat.\nFakta: Daya beli masyarakat tidak meningkat.\nKesimpulan yang sah adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Nilai tukar rupiah menguat."
          },
          {
            "label": "B",
            "text": "Nilai tukar rupiah tidak menguat."
          },
          {
            "label": "C",
            "text": "Inflasi barang impor terkendali."
          },
          {
            "label": "D",
            "text": "Pemerintah memberi subsidi langsung."
          },
          {
            "label": "E",
            "text": "Nilai tukar rupiah tetap stabil."
          }
        ],
        "kunci": "B",
        "pembahasan": "Silogisme Hipotetis: p → q dan q → r menghasilkan p → r. Diketahui fakta ~r (daya beli tidak meningkat). Terapkan Modus Tollens pada p → r: karena ~r, maka simpulannya adalah ~p ('Nilai tukar rupiah tidak menguat'). Opsi B tepat."
      },
      {
        "id": "pu-2-q4",
        "soal": "Premis 1: Beberapa musisi jazz pandai memainkan alat musik tiup saksofon.\nPremis 2: Beberapa musisi jazz mahir mengaransemen musik orkestra.\nKesimpulan yang sah dari kedua premis adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Beberapa pemain saksofon mahir mengaransemen musik orkestra."
          },
          {
            "label": "B",
            "text": "Semua musisi jazz pandai saksofon dan aransemen orkestra."
          },
          {
            "label": "C",
            "text": "Tidak dapat ditarik kesimpulan yang pasti."
          },
          {
            "label": "D",
            "text": "Musisi yang pandai saksofon pasti musisi jazz."
          },
          {
            "label": "E",
            "text": "Hanya musisi jazz yang mahir mengaransemen musik orkestra."
          }
        ],
        "kunci": "C",
        "pembahasan": "Dua premis yang keduanya berkuantor partikular/eksistensial ('beberapa... beberapa...') tidak menjamin adanya irisan antara himpunan pemain saksofon dan pengaransemen orkestra. Bisa jadi kedua kelompok tersebut saling lepas. Oleh karena itu, TIDAK DAPAT DITARIK KESIMPULAN yang pasti (C)."
      },
      {
        "id": "pu-2-q5",
        "soal": "Manakah di bawah ini yang merupakan contoh SESAT PIKIR (fallacy) menegaskan konsekuen (affirming the consequent)?",
        "opsi": [
          {
            "label": "A",
            "text": "Jika hujan, jalanan basah. Ternyata jalanan basah. Maka tadi hujan."
          },
          {
            "label": "B",
            "text": "Jika hujan, jalanan basah. Ternyata hujan. Maka jalanan basah."
          },
          {
            "label": "C",
            "text": "Jika hujan, jalanan basah. Jalanan tidak basah. Maka tidak hujan."
          },
          {
            "label": "D",
            "text": "Jika belajar, lulus ujian. Ternyata belajar. Maka lulus ujian."
          },
          {
            "label": "E",
            "text": "Jika lampu mati, ruangan gelap. Ruangan tidak gelap. Maka lampu tidak mati."
          }
        ],
        "kunci": "A",
        "pembahasan": "Struktur: p → q, q, maka p adalah sesat pikir menegaskan akibat (affirming the consequent). Jalanan bisa basah karena disiram mobil damkar atau pecah pipa air, belum tentu hujan. Opsi A adalah bentuk fallacy tersebut."
      }
    ],
    "keyTakeaways": [
      "Modus Ponens: p → q, p ⊢ q (sah).",
      "Modus Tollens: p → q, ~q ⊢ ~p (sah).",
      "Silogisme Hipotetis: p → q, q → r ⊢ p → r (sah).",
      "Premis 'beberapa' + 'beberapa' tidak menghasilkan kesimpulan pasti antar predikat."
    ],
    "rekomendasiLatihan": "Latih kemampuan silogisme cepat di Jalur Kemampuan Unit 1 & Unit 2 untuk mempertajam insting eliminasi opsi salah."
  },
  {
    "id": "pu-pola-bilangan-dan-huruf",
    "babNumber": 3,
    "slug": "pu-pola-bilangan-dan-huruf",
    "subtestKode": "PU",
    "judul": "Pola Barisan Bilangan, Deret & Huruf",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Mengenali pola deret larik 1 tingkat, bertingkat dua, selang-seling (fibonacci/alternating), operasi kombinasi (* dan +), serta konversi abjad A=1 hingga Z=26.",
    "learningObjectives": [
      "Mengidentifikasi jenis barisan: selisih konstan, bertingkat dua, geometrik, dan Fibonacci.",
      "Memecahkan pola barisan larik ganda (lompat 1 atau lompat 2 angka).",
      "Mengonversi huruf ke posisi numerik (A=1, B=2, ..., Z=26) untuk memecahkan deret huruf.",
      "Menentukan 2 suku berikutnya dengan akurasi tinggi di bawah 60 detik."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Taksonomi Pola Deret Angka UTBK",
        "isi": "Dalam UTBK, deret angka jarang berupa aritmetika sederhana. Ragam pola yang paling sering muncul:\n1. Deret Selang-Seling (Larik Ganda): Barisan sebenarnya gabungan 2 barisan terpisah yang disisipkan bergantian.\n2. Deret Bertingkat (Tingkat 2/3): Selisih antar suku membentuk deret baru yang beraturan (+2, +4, +6, +8...).\n3. Deret Operasi Kombinasi: Pola operasi berulang seperti (×2, -1, ×2, -1) atau (+3, ×2, +3, ×2).\n4. Deret Fibonacci & Modifikasinya: Suku ke-n merupakan jumlahan dari 2 suku sebelumnya (Un = Un-1 + Un-2).",
        "poinPenting": [
          "Jika angka naik-turun-naik-turun secara periodik, 90% itu adalah deret lompat (larik ganda).",
          "Jika angka melonjak sangat drastis, periksa operasi perkalian atau perpangkatan (n² atau n³)."
        ]
      },
      {
        "subjudul": "2. Strategi Deret Huruf & Konversi Abjad",
        "isi": "Deret huruf dikerjakan paling cepat dengan mengubah huruf menjadi angka urutannya: A=1, B=2, C=3, D=4, E=5, F=6, G=7, H=8, I=9, J=10, K=11, L=12, M=13, N=14, O=15, P=16, Q=17, R=18, S=19, T=20, U=21, V=22, W=23, X=24, Y=25, Z=26.",
        "poinPenting": [
          "Hafalkan patokan kelipatan 5: E=5, J=10, O=15, T=20, Y=25 (Akronim: EJOTY).",
          "Pola huruf sering berupa alfabet ganda atau lompat abjad tetap."
        ]
      }
    ],
    "trikCepat": "Gunakan akronim 'EJOTY' (5, 10, 15, 20, 25) untuk mengonversi huruf apa pun dalam 2 detik tanpa perlu menuliskan alfabet A sampai Z di kertas buram!",
    "jebakanUmum": "Mencoba mencari 1 rumus rumit untuk semua suku berurutan padahal barisan tersebut sebenarnya adalah 2 larik yang saling lompat satu suku.",
    "contohSoal": [
      {
        "soal": "Perhatikan barisan bilangan berikut:\n3, 5, 9, 17, 33, ...\nAngka berikutnya pada barisan tersebut adalah...",
        "opsi": {
          "A": "49",
          "B": "57",
          "C": "65",
          "D": "67",
          "E": "72"
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Hitung selisih antar suku yang berdekatan:\n5 - 3 = +2\n9 - 5 = +4\n17 - 9 = +8\n33 - 17 = +16",
          "Pola selisihnya adalah barisan geometri dengan rasio 2: 2, 4, 8, 16, berikutnya haruslah 16 × 2 = +32.",
          "Suku berikutnya = 33 + 32 = 65.",
          "(Cara alternatif: Un = 2 × Un-1 - 1: 3×2-1=5, 5×2-1=9, 9×2-1=17, 17×2-1=33, 33×2-1=65). Jawaban C."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pu-3-q1",
        "soal": "Diketahui barisan angka: 4, 7, 12, 19, 28, x. Nilai x yang memenuhi pola tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "37"
          },
          {
            "label": "B",
            "text": "39"
          },
          {
            "label": "C",
            "text": "41"
          },
          {
            "label": "D",
            "text": "43"
          },
          {
            "label": "E",
            "text": "45"
          }
        ],
        "kunci": "B",
        "pembahasan": "Selisih antar suku: 7-4 = +3, 12-7 = +5, 19-12 = +7, 28-19 = +9. Pola penambahan bilangan ganjil berurutan (+3, +5, +7, +9). Maka penambahan berikutnya adalah +11. Nilai x = 28 + 11 = 39 (B)."
      },
      {
        "id": "pu-3-q2",
        "soal": "Perhatikan barisan huruf berikut: B, D, G, K, P, ... Huruf berikutnya adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "U"
          },
          {
            "label": "B",
            "text": "V"
          },
          {
            "label": "C",
            "text": "W"
          },
          {
            "label": "D",
            "text": "X"
          },
          {
            "label": "E",
            "text": "Y"
          }
        ],
        "kunci": "B",
        "pembahasan": "Ubah ke angka (EJOTY): B=2, D=4, G=7, K=11, P=16. Selisih: 4-2 = +2, 7-4 = +3, 11-7 = +4, 16-11 = +5. Maka lompatan berikutnya adalah +6: 16 + 6 = 22. Huruf ke-22 dalam alfabet adalah V (karena T=20, U=21, V=22). Jawaban: B."
      },
      {
        "id": "pu-3-q3",
        "soal": "Tentukan dua angka selanjutnya dari barisan lompat: 2, 5, 4, 10, 8, 20, 16, 40, ..., ...",
        "opsi": [
          {
            "label": "A",
            "text": "32, 80"
          },
          {
            "label": "B",
            "text": "24, 60"
          },
          {
            "label": "C",
            "text": "32, 60"
          },
          {
            "label": "D",
            "text": "20, 80"
          },
          {
            "label": "E",
            "text": "30, 70"
          }
        ],
        "kunci": "A",
        "pembahasan": "Pisahkan menjadi dua larik berseling:\nLarik 1 (posisi ganjil: suku 1, 3, 5, 7, 9): 2, 4, 8, 16, ... (pola kali 2) → angka berikutnya adalah 32.\nLarik 2 (posisi genap: suku 2, 4, 6, 8, 10): 5, 10, 20, 40, ... (pola kali 2) → angka berikutnya adalah 80.\nMaka dua suku selanjutnya adalah 32 dan 80 (A)."
      },
      {
        "id": "pu-3-q4",
        "soal": "Pola angka: 1, 3, 4, 7, 11, 18, 29, ... Dua angka berikutnya adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "45, 74"
          },
          {
            "label": "B",
            "text": "47, 76"
          },
          {
            "label": "C",
            "text": "48, 77"
          },
          {
            "label": "D",
            "text": "47, 75"
          },
          {
            "label": "E",
            "text": "46, 75"
          }
        ],
        "kunci": "B",
        "pembahasan": "Ini adalah deret Fibonacci (setiap suku adalah jumlah 2 suku sebelumnya):\n1 + 3 = 4\n3 + 4 = 7\n4 + 7 = 11\n7 + 11 = 18\n11 + 18 = 29\nSuku berikutnya: 18 + 29 = 47\nSuku setelahnya: 29 + 47 = 76\nJadi dua angka berikutnya adalah 47 dan 76 (B)."
      },
      {
        "id": "pu-3-q5",
        "soal": "Deret huruf selang-seling: Z, A, X, C, V, E, T, ... Dua huruf berikutnya adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "G, R"
          },
          {
            "label": "B",
            "text": "H, R"
          },
          {
            "label": "C",
            "text": "G, S"
          },
          {
            "label": "D",
            "text": "F, S"
          },
          {
            "label": "E",
            "text": "G, Q"
          }
        ],
        "kunci": "A",
        "pembahasan": "Pisahkan larik:\nLarik ganjil: Z (26), X (24), V (22), T (20), suku berikutnya berkurang 2 yaitu 18 (R).\nLarik genap: A (1), C (3), E (5), suku berikutnya bertambah 2 yaitu 7 (G).\nKarena suku setelah T adalah posisi genap, maka huruf pertama adalah G, lalu huruf kedua adalah R. Jadi urutannya: G, R (A)."
      }
    ],
    "keyTakeaways": [
      "Langkah 1 selalu cek selisih berurutan; jika tidak konstan, cek apakah selisih membentuk pola bertingkat.",
      "Jika barisan naik-turun atau berulang, langsung uji hipotesis deret lompat (larik 1 dan larik 2).",
      "Gunakan patokan EJOTY (5, 10, 15, 20, 25) untuk menghemat waktu konversi abjad ke angka.",
      "Deret Fibonacci selalu menjumlahkan dua suku sebelumnya."
    ],
    "rekomendasiLatihan": "Tingkatkan kecepatan perhitungan di latihan harian 12 butir soal campuran."
  },
  {
    "id": "pu-penalaran-analitik",
    "babNumber": 4,
    "slug": "pu-penalaran-analitik",
    "subtestKode": "PU",
    "judul": "Penalaran Analitik, Urutan & Posisi",
    "durasiBacaMenit": 15,
    "ringkasanSingkat": "Strategi memetakan kondisi pembatas (constraints) untuk soal urutan ranking, susunan tempat duduk melingkar/sebaris, serta jadwal giliran kerja.",
    "learningObjectives": [
      "Membuat tabel kisi (grid matrix) atau garis bilangan untuk merangkum syarat batas.",
      "Menentukan posisi pasti (anchor) sebelum memetakan kondisi bersyarat.",
      "Menyelesaikan kasus posisi tempat duduk melingkar (berhadapan, bersebelahan).",
      "Mengevaluasi kemungkinan susunan yang pasti benar, mungkin benar, atau pasti salah."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Prinsip Pemodelan Kondisi Batas (Constraints)",
        "isi": "Soal analitik menyajikan sekumpulan tokoh dan beberapa aturan. Kunci menyelesaikannya dalam waktu kurang dari 90 detik adalah NOTASI SINGKAT:\n- 'A lebih tua dari B' ditulis A > B.\n- 'C duduk tepat di antara D dan E' ditulis D-C-E atau E-C-D.\n- 'F tidak boleh duduk di samping G' ditulis F ≠ [G].",
        "poinPenting": [
          "Cari 'Jangkar Pasti' (informasi absolut, misal: 'A duduk di kursi nomor 3' atau 'B tiba paling awal').",
          "Hubungkan aturan lain yang menyebutkan tokoh jangkar tersebut.",
          "Uji opsi jawaban dengan teknik eliminasi: cari opsi yang melanggar salah satu aturan teks."
        ]
      },
      {
        "subjudul": "2. Posisi Meja Melingkar vs Sebaris",
        "isi": "Pada meja melingkar beranggotakan N orang genap (misal 6 atau 8 orang), 'berhadapan' berarti jaraknya berjarak N/2 kursi. Pada barisan linier, perhatikan istilah 'tepat di sebelah' (menempel langsung) vs 'di sebelah kiri' (bisa menempel atau berjarak beberapa kursi).",
        "poinPenting": [
          "'Tepat di sebelah' = menempel langsung.",
          "'Di antara A dan B' = A ... X ... B (tidak selalu tepat di tengah kecuali tertulis 'tepat di tengah')."
        ]
      }
    ],
    "trikCepat": "Gunakan teknik eliminasi opsi langsung! Baca 1 syarat, lalu coret opsi jawaban yang melanggar syarat tersebut. Biasanya hanya dengan mengecek 2-3 syarat, 4 opsi gugur tanpa perlu menyusun seluruh kemungkinan secara manual!",
    "jebakanUmum": "Menghabiskan waktu menggambar semua skenario yang mungkin padahal pertanyaannya hanya menanyakan susunan yang 'PASTI SALAH' yang bisa langsung dicek dari syarat.",
    "contohSoal": [
      {
        "soal": "Enam pelari A, B, C, D, E, dan F menyelesaikan lomba lari dengan ketentuan:\n1. A finis sebelum B tetapi setelah C.\n2. D finis sebelum C.\n3. E finis setelah B.\n4. F finis setelah D tetapi sebelum C.\nUrutan pelari dari yang finis paling awal hingga paling akhir adalah...",
        "opsi": {
          "A": "D - F - C - A - B - E",
          "B": "D - C - F - A - B - E",
          "C": "F - D - C - A - E - B",
          "D": "D - F - A - C - B - E",
          "E": "C - D - F - A - B - E"
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Analisis syarat 1: C finis sebelum A, dan A sebelum B. Maka parsial: C - A - B.",
          "Analisis syarat 2 & 4: D finis sebelum C, dan F finis setelah D tetapi sebelum C. Maka urutan ketiganya: D - F - C.",
          "Gabungkan parsial D-F-C dengan C-A-B: D - F - C - A - B.",
          "Analisis syarat 3: E finis setelah B. Maka E berada di posisi paling akhir setelah B: D - F - C - A - B - E.",
          "Urutan lengkap yang valid adalah D - F - C - A - B - E (A)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pu-4-q1",
        "soal": "Tujuh buku P, Q, R, S, T, U, V disusun di rak dari kiri ke kanan. R berada di sebelah kiri S. T berada di antara Q dan U. P berada paling kiri. V berada di sebelah kanan S. Jika U tepat di sebelah kanan P, buku apakah yang berada di posisi paling kiri kedua?",
        "opsi": [
          {
            "label": "A",
            "text": "Q"
          },
          {
            "label": "B",
            "text": "T"
          },
          {
            "label": "C",
            "text": "U"
          },
          {
            "label": "D",
            "text": "R"
          },
          {
            "label": "E",
            "text": "S"
          }
        ],
        "kunci": "C",
        "pembahasan": "Jangkar: P berada paling kiri (Posisi 1 = P). Diketahui U tepat di sebelah kanan P, maka Posisi 2 = U. Jadi buku di posisi paling kiri kedua adalah U (C)."
      },
      {
        "id": "pu-4-q2",
        "soal": "Lima orang K, L, M, N, O duduk berjajar di bioskop. K tidak ingin duduk di ujung. L duduk di antara M dan N. O duduk di ujung paling kanan. Jika N duduk tepat di sebelah O, di manakah K duduk?",
        "opsi": [
          {
            "label": "A",
            "text": "Ujung paling kiri"
          },
          {
            "label": "B",
            "text": "Tepat di antara L dan M"
          },
          {
            "label": "C",
            "text": "Tepat di sebelah kanan M"
          },
          {
            "label": "D",
            "text": "Tepat di antara M dan ujung kiri"
          },
          {
            "label": "E",
            "text": "Posisi nomor 2 dari kiri"
          }
        ],
        "kunci": "E",
        "pembahasan": "5 kursi: [1] [2] [3] [4] [5].\nO di ujung paling kanan: [5]=O.\nN tepat di sebelah O: [4]=N.\nL duduk di antara M dan N: karena [4]=N, maka [3]=L dan [2] atau [1] adalah M.\nJika M di [1], maka K harus di [2] (karena K tidak boleh di ujung). Susunan: M (1), K (2), L (3), N (4), O (5). K berada di posisi ke-2 dari kiri (E)."
      },
      {
        "id": "pu-4-q3",
        "soal": "Enam sekawan melingkar di meja bundar: Ali, Budi, Citra, Dodi, Eka, dan Fani.\n1. Ali duduk berhadapan dengan Dodi.\n2. Budi duduk di sebelah kanan Ali.\n3. Citra tidak duduk di sebelah Dodi.\nSiapakah yang duduk tepat berhadapan dengan Budi?",
        "opsi": [
          {
            "label": "A",
            "text": "Citra"
          },
          {
            "label": "B",
            "text": "Eka"
          },
          {
            "label": "C",
            "text": "Fani"
          },
          {
            "label": "D",
            "text": "Dodi"
          },
          {
            "label": "E",
            "text": "Tidak dapat dipastikan antara Eka atau Fani"
          }
        ],
        "kunci": "A",
        "pembahasan": "6 kursi meja melingkar (kursi 1 sampai 6).\nPasang Ali di posisi 1, maka Dodi berhadapan di posisi 4.\nBudi di sebelah kanan Ali, misal posisi 2. Maka yang berhadapan dengan Budi adalah posisi 5.\nCitra tidak boleh di sebelah Dodi (tidak boleh di 3 atau 5). Maka Citra harus di posisi 6 atau 2 (sudah diisi Budi), sehingga Citra harus di posisi yang tersisa. Dengan pertimbangan berhadapan, pasangan posisi yang berhadapan dengan Budi terbukti adalah Citra. Opsi A."
      },
      {
        "id": "pu-4-q4",
        "soal": "Manakah pernyataan yang PASTI BENAR jika A > B, C < B, D > A, dan E = C?",
        "opsi": [
          {
            "label": "A",
            "text": "D adalah yang paling kecil nilainya."
          },
          {
            "label": "B",
            "text": "B lebih besar dari D."
          },
          {
            "label": "C",
            "text": "D adalah yang paling besar nilainya."
          },
          {
            "label": "D",
            "text": "E lebih besar dari A."
          },
          {
            "label": "E",
            "text": "B sama dengan E."
          }
        ],
        "kunci": "C",
        "pembahasan": "Urutan ketaksamaan: D > A > B > C = E. Maka D jelas merupakan elemen dengan nilai paling besar (C)."
      },
      {
        "id": "pu-4-q5",
        "soal": "Jadwal piket Senin sampai Jumat diisi oleh Ayu, Bima, Caca, Doni, dan Euis. Doni piket 2 hari setelah Ayu. Caca piket sebelum Bima. Jika Ayu piket hari Selasa, siapakah yang piket hari Kamis?",
        "opsi": [
          {
            "label": "A",
            "text": "Ayu"
          },
          {
            "label": "B",
            "text": "Bima"
          },
          {
            "label": "C",
            "text": "Caca"
          },
          {
            "label": "D",
            "text": "Doni"
          },
          {
            "label": "E",
            "text": "Euis"
          }
        ],
        "kunci": "D",
        "pembahasan": "Ayu piket Selasa. Doni piket 2 hari setelah Ayu = Selasa + 2 hari = Kamis. Jadi yang piket hari Kamis adalah Doni (D)."
      }
    ],
    "keyTakeaways": [
      "Tulis notasi singkat garis urutan atau tabel jangkar.",
      "Eliminasi opsi secara agresif menggunakan syarat teks.",
      "Waspadai kata 'tepat bersebelahan' vs 'berada di sebelah'.",
      "Pada posisi berhadapan meja bundar N genap, posisi berhadapan berselisih N/2."
    ],
    "rekomendasiLatihan": "Selesaikan latihan analitik di simulasi tryout untuk melatih efisiensi waktu."
  },
  {
    "id": "pu-kesesuaian-pernyataan-teks",
    "babNumber": 5,
    "slug": "pu-kesesuaian-pernyataan-teks",
    "subtestKode": "PU",
    "judul": "Kesesuaian Pernyataan Berdasarkan Fakta Teks",
    "durasiBacaMenit": 11,
    "ringkasanSingkat": "Teknik membaca kritis untuk memverifikasi kebenaran klaim: pasti benar, mungkin benar, atau pasti salah sesuai data eksplisit dalam paragraf.",
    "learningObjectives": [
      "Membedakan fakta eksplisit teks dengan asumsi pribadi di luar teks.",
      "Mengidentifikasi distractor distorsi kuantitatif (angka, persentase, tren).",
      "Menentukan opsi yang PASTI BENAR, MUNGKIN BENAR, atau PASTI SALAH.",
      "Menerapkan teknik scanning kata kunci spesifik untuk efisiensi waktu membaca."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Aturan Emas Kesesuaian Pernyataan",
        "isi": "Dalam UTBK Penalaran Umum, kebenaran pernyataan HANYA DINILAI DARI TEKS YANG DISEDIAKAN. Pengetahuan umum Anda di luar teks tidak boleh digunakan jika bertentangan dengan teks.",
        "poinPenting": [
          "Pasti Benar: didukung 100% oleh kalimat dalam teks (paraphrase akurat).",
          "Pasti Salah: bertentangan langsung atau berkebalikan dengan teks.",
          "Tidak Relevan / Tidak Didukung: tidak dibahas di teks (sering jadi jebakan opsi menarik)."
        ]
      },
      {
        "subjudul": "2. Modifikasi Kata Pembatas (Qualifiers)",
        "isi": "Pembuat soal UTBK sering mengubah kata 'sebagian' menjadi 'semua', atau 'berpotensi menyebabkan' menjadi 'pasti menyebabkan'. Waspadai kata mutlak seperti 'selalu', 'pasti', 'hanya', 'tidak pernah'.",
        "poinPenting": [
          "Teks: 'Kopi dapat menurunkan risiko stroke.' Opsi salah: 'Kopi pasti mencegah stroke.'",
          "Teks: 'Sebagian besar UMKM mengalami penurunan omzet.' Opsi salah: 'Seluruh UMKM gulung tikar.'"
        ]
      }
    ],
    "trikCepat": "Gunakan teknik scanning: baca dulu opsi jawaban, tandai kata kunci unik (nama tokoh, istilah asing, angka tahun), lalu cari letak kata kunci tersebut di paragraf. Jangan membaca ulang seluruh teks dari kata pertama!",
    "jebakanUmum": "Memilih opsi yang secara fakta dunia nyata memang benar, padahal fakta tersebut TIDAK TERTULIS di teks bacaan soal.",
    "contohSoal": [
      {
        "soal": "Teks: 'Peningkatan adopsi kecerdasan buatan (AI) di sektor perbankan nasional berhasil memangkas waktu verifikasi berkas kredit dari 3 hari menjadi 15 menit. Kendati demikian, laporan serikat pekerja mencatat bahwa 12% staf administrasi dialihfungsikan ke divisi layanan nasabah lapangan guna mencegah pemutusan hubungan kerja.'\nBerdasarkan teks di atas, manakah pernyataan yang PASTI BENAR?",
        "opsi": {
          "A": "Seluruh bank nasional telah menerapkan AI secara penuh di semua divisi.",
          "B": "Verifikasi kredit dengan bantuan AI berlangsung jauh lebih cepat dibandingkan metode sebelumnya.",
          "C": "Sebanyak 12% pegawai bank mengalami pemutusan hubungan kerja akibat otomatisasi.",
          "D": "Layanan nasabah lapangan kini sepenuhnya dikerjakan oleh robot kecerdasan buatan.",
          "E": "AI menyebabkan penurunan total jumlah kredit yang disalurkan bank."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Cek teks: waktu verifikasi kredit dipangkas dari 3 hari menjadi 15 menit. Ini secara eksplisit membuktikan bahwa verifikasi kredit berlangsung jauh lebih cepat.",
          "Opsi A salah karena teks menyebut 'sektor perbankan nasional' tanpa kata 'seluruh dan semua divisi'.",
          "Opsi C salah karena 12% dialihfungsikan untuk MENCEGAH PHK, bukan di-PHK.",
          "Opsi D dan E tidak didukung oleh teks sama sekali.",
          "Maka pernyataan yang pasti benar adalah B."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pu-5-q1",
        "soal": "Teks: 'Konsumsi sayuran berdaun hijau gelap kaya akan lutein yang terbukti memperlambat laju penurunan fungsi kognitif pada lansia. Namun, efek optimal baru terlihat apabila disertai dengan pola tidur teratur minimal 7 jam per hari.'\nManakah simpulan yang PALING DIDUKUNG oleh bacaan?",
        "opsi": [
          {
            "label": "A",
            "text": "Lansia yang tidur 7 jam per hari tidak akan pernah mengalami penurunan fungsi kognitif."
          },
          {
            "label": "B",
            "text": "Konsumsi sayuran hijau gelap tanpa tidur yang cukup tidak memberikan manfaat maksimal bagi fungsi kognitif lansia."
          },
          {
            "label": "C",
            "text": "Lutein hanya dapat ditemukan pada sayuran berdaun hijau gelap."
          },
          {
            "label": "D",
            "text": "Semua jenis sayuran memiliki kandungan lutein yang setara."
          },
          {
            "label": "E",
            "text": "Penurunan fungsi kognitif lansia semata-mata disebabkan oleh kurangnya tidur."
          }
        ],
        "kunci": "B",
        "pembahasan": "Teks menyatakan 'efek optimal baru terlihat apabila disertai dengan pola tidur teratur minimal 7 jam'. Ini berarti jika tidak disertai tidur cukup, manfaatnya tidak optimal/maksimal (B)."
      },
      {
        "id": "pu-5-q2",
        "soal": "Teks: 'Penjualan kendaraan listrik (EV) di negara X melonjak 45% pada kuartal ketiga berkat insentif pemotongan pajak dari pemerintah. Meskipun demikian, keterbatasan jumlah stasiun pengisian daya cepat (SPKLU) di jalur antarkota masih menjadi kekhawatiran utama calon konsumen luar daerah.'\nPernyataan berikut yang PALING SESUAI dengan teks adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pemerintah negara X menghapus seluruh pajak kendaraan bermotor konvensional."
          },
          {
            "label": "B",
            "text": "Infrastruktur stasiun pengisian daya cepat di jalur antarkota masih belum merata sepenuhnya."
          },
          {
            "label": "C",
            "text": "Penjualan mobil konvensional menurun sebesar 45% pada periode yang sama."
          },
          {
            "label": "D",
            "text": "Konsumen luar daerah menolak membeli kendaraan listrik meskipun stasiun pengisian telah memadai."
          },
          {
            "label": "E",
            "text": "Insentif pajak tidak memengaruhi minat beli masyarakat perkotaan."
          }
        ],
        "kunci": "B",
        "pembahasan": "Teks secara eksplisit menyebut 'keterbatasan jumlah stasiun pengisian daya cepat di jalur antarkota masih menjadi kekhawatiran'. Ini ekuivalen dengan pernyataan bahwa infrastruktur tersebut belum memadai/merata sepenuhnya (B)."
      },
      {
        "id": "pu-5-q3",
        "soal": "Teks: 'Uji klinis fase tiga menunjukkan vaksin Z memiliki efikasi 92% dalam mencegah gejala berat pada kelompok usia produktif. Kendati demikian, tingkat antibodi yang dihasilkan cenderung menurun setelah 6 bulan pascasuntikan kedua.'\nBerdasarkan teks, pernyataan yang PASTI SALAH adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Vaksin Z memberikan perlindungan lebih dari 90% terhadap gejala berat pada usia produktif."
          },
          {
            "label": "B",
            "text": "Kadar antibodi penerima vaksin Z bertahan konstan tanpa penurunan sama sekali setelah 6 bulan."
          },
          {
            "label": "C",
            "text": "Diperlukan evaluasi klinis mengenai kebutuhan dosis penguat (booster)."
          },
          {
            "label": "D",
            "text": "Sebanyak 8% subjek uji klinis mungkin masih berisiko mengalami gejala berat."
          },
          {
            "label": "E",
            "text": "Uji klinis vaksin Z telah mencapai tahap pengujian fase tiga."
          }
        ],
        "kunci": "B",
        "pembahasan": "Teks menyatakan bahwa antibodi 'cenderung menurun setelah 6 bulan'. Maka klaim pada opsi B ('bertahan konstan tanpa penurunan sama sekali') bertentangan 180 derajat dengan fakta teks, sehingga PASTI SALAH."
      },
      {
        "id": "pu-5-q4",
        "soal": "Teks: 'Studi mendapati bahwa siswa yang rutin sarapan tinggi protein menunjukkan fokus belajar 25 menit lebih lama dibanding mereka yang melewatkan sarapan. Namun, asupan gula berlebih saat sarapan justru memicu kantuk di jam pelajaran kedua.'\nManakah pernyataan yang TIDAK DAPAT DISIMPULKAN dari teks?",
        "opsi": [
          {
            "label": "A",
            "text": "Sarapan tinggi protein berhubungan positif dengan durasi fokus belajar siswa."
          },
          {
            "label": "B",
            "text": "Konsumsi gula berlebih pada pagi hari dapat berdampak negatif pada kesiagaan belajar."
          },
          {
            "label": "C",
            "text": "Siswa yang melewatkan sarapan memiliki daya fokus yang lebih singkat."
          },
          {
            "label": "D",
            "text": "Sarapan protein tinggi menjamin seorang siswa pasti meraih peringkat satu di kelasnya."
          },
          {
            "label": "E",
            "text": "Komposisi nutrisi saat sarapan memengaruhi kondisi fisik siswa di kelas."
          }
        ],
        "kunci": "D",
        "pembahasan": "Teks hanya membahas durasi fokus belajar dan kantuk. Klaim bahwa sarapan tinggi protein 'menjamin seorang siswa pasti meraih peringkat satu' adalah generalisasi berlebihan tanpa bukti di teks, sehingga tidak dapat disimpulkan (D)."
      },
      {
        "id": "pu-5-q5",
        "soal": "Kata pembatas (qualifier) manakah yang membuat sebuah opsi menjadi terlalu ekstrem dan sering kali menjadikannya jawaban yang salah dalam soal kesesuaian teks?",
        "opsi": [
          {
            "label": "A",
            "text": "Cenderung dan berpotensi"
          },
          {
            "label": "B",
            "text": "Sebagian besar dan umumnya"
          },
          {
            "label": "C",
            "text": "Dapat dan berkemungkinan"
          },
          {
            "label": "D",
            "text": "Selalu, mutlak, dan satu-satunya"
          },
          {
            "label": "E",
            "text": "Beberapa dan relatif"
          }
        ],
        "kunci": "D",
        "pembahasan": "Kata-kata absolut seperti 'selalu', 'mutlak', 'satu-satunya', dan 'tidak pernah' sering kali membelokkan nuansa teks yang aslinya moderat/probabilistik menjadi klaim ekstrem yang tidak didukung data teks."
      }
    ],
    "keyTakeaways": [
      "Batasi analisis HANYA pada fakta yang tertulis di teks.",
      "Waspadai distorsi kuantitatif dan penggantian kata pembatas (sebagian vs semua).",
      "Gunakan scanning kata kunci alih-alih membaca lambat kata demi kata.",
      "Opsi yang 'pasti salah' bertolak belakang langsung dengan data bacaan."
    ],
    "rekomendasiLatihan": "Latih kecermatan teks di modul LBIN dan Latihan Harian Penalaran Umum."
  },
  {
    "id": "pu-sebab-akibat-dan-simpulan-logis",
    "babNumber": 6,
    "slug": "pu-sebab-akibat-dan-simpulan-logis",
    "subtestKode": "PU",
    "judul": "Hubungan Sebab-Akibat & Simpulan Logis",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Menganalisis hubungan kausalitas (sebab-akibat) vs korelasi kebetulan, serta menentukan apakah peristiwa A adalah sebab dan B adalah akibat.",
    "learningObjectives": [
      "Membedakan hubungan sebab-akibat (kausasi) dengan korelasi semu (coincidence).",
      "Menentukan pola kausalitas: sebab langsung, akibat langsung, atau akibat dari sebab yang tidak berkaitan.",
      "Menilai apakah suatu kondisi merupakan syarat perlu (necessary condition) atau syarat cukup (sufficient condition).",
      "Menyimpulkan implikasi kebijakan atau skenario masa depan secara logis."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Format Soal Sebab-Akibat UTBK",
        "isi": "Soal sebab-akibat menyajikan dua peristiwa (I dan II), kemudian meminta siswa menentukan hubungan keduanya:\n(A) I adalah penyebab dan II adalah akibat.\n(B) II adalah penyebab dan I adalah akibat.\n(C) I dan II adalah akibat dari suatu penyebab yang sama.\n(D) I dan II adalah akibat dari dua penyebab yang tidak saling berhubungan.\n(E) I dan II adalah penyebab yang independen.",
        "poinPenting": [
          "Uji arah kronologis dan logika: Apakah terjadinya I secara logis memicu terjadinya II?",
          "Cari penyebab bersama di balik layar (common cause). Misal: 'Harga payung naik' dan 'Penjualan jas hujan naik' keduanya adalah akibat dari sebab yang sama, yaitu 'Musim hujan ekstrem'."
        ]
      },
      {
        "subjudul": "2. Syarat Perlu vs Syarat Cukup",
        "isi": "- Syarat Perlu (Necessary): Kondisi yang WAJIB ada agar peristiwa terjadi, tapi keberadaannya sendiri belum menjamin peristiwa terjadi (Contoh: 'Punya kuota internet' adalah syarat perlu untuk buka YouTube, tapi belum cukup jika baterai HP habis).\n- Syarat Cukup (Sufficient): Kondisi yang jika terpenuhi SUDAH PASTI menjamin peristiwa terjadi.",
        "poinPenting": [
          "A adalah syarat cukup bagi B berarti: Jika A maka B (A → B).",
          "A adalah syarat perlu bagi B berarti: Jika B maka A (B → A), atau ~A → ~B."
        ]
      }
    ],
    "trikCepat": "Gunakan kata hubung penguji 'KARENA'. Rangkai kalimat: '[Peristiwa II] terjadi KARENA [Peristiwa I]'. Jika terdengar masuk akal secara kausalitas ilmiah/sosial, maka I adalah sebab dan II adalah akibat. Jika terbalik, maka II adalah sebab!",
    "jebakanUmum": "Post hoc ergo propter hoc (mengira peristiwa yang terjadi setelah peristiwa lain otomatis disebabkan oleh peristiwa sebelumnya, padahal hanya kebetulan urutan waktu).",
    "contohSoal": [
      {
        "soal": "Perhatikan dua pernyataan berikut:\n(1) Pemerintah memberlakukan tarif impor tinggi untuk barang-barang tekstil jadi dari luar negeri.\n(2) Utilisasi kapasitas pabrik industri garmen dan tekstil lokal meningkat hingga 85% pada tahun ini.\nManakah di bawah ini yang menggambarkan hubungan antara pernyataan (1) dan (2)?",
        "opsi": {
          "A": "Pernyataan (1) adalah penyebab dan pernyataan (2) adalah akibat.",
          "B": "Pernyataan (2) adalah penyebab dan pernyataan (1) adalah akibat.",
          "C": "Pernyataan (1) dan (2) adalah akibat dari suatu penyebab yang sama.",
          "D": "Pernyataan (1) dan (2) adalah akibat dari dua penyebab yang tidak saling berhubungan.",
          "E": "Pernyataan (1) dan (2) adalah penyebab independen tanpa ada akibat langsung."
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Uji kalimat: 'Utilisasi kapasitas pabrik tekstil lokal meningkat (2) KARENA pemerintah memberlakukan tarif impor tinggi untuk tekstil jadi (1)'.",
          "Hubungan ini sangat logis: tarif impor tinggi membuat barang impor mahal, sehingga pasar beralih membeli produk tekstil lokal, memicu peningkatan utilisasi pabrik dalam negeri.",
          "Maka pernyataan (1) adalah penyebab dan pernyataan (2) adalah akibat langsung (A)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pu-6-q1",
        "soal": "Pernyataan:\n(1) Jumlah penderita infeksi saluran pernapasan akut (ISPA) di kota M melonjak dua kali lipat.\n(2) Indeks standar pencemar udara (ISPU) di kota M berada pada kategori sangat tidak sehat selama tiga pekan berturut-turut.\nHubungan yang paling tepat adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pernyataan (1) adalah penyebab dan (2) adalah akibat."
          },
          {
            "label": "B",
            "text": "Pernyataan (2) adalah penyebab dan (1) adalah akibat."
          },
          {
            "label": "C",
            "text": "Pernyataan (1) dan (2) adalah akibat dari penyebab yang sama."
          },
          {
            "label": "D",
            "text": "Pernyataan (1) dan (2) adalah akibat dari dua penyebab yang tidak berhubungan."
          },
          {
            "label": "E",
            "text": "Kedua pernyataan tidak memiliki kaitan logis."
          }
        ],
        "kunci": "B",
        "pembahasan": "Polusi udara buruk (ISPU sangat tidak sehat) merupakan penyebab medis langsung terjadinya lonjakan penderita ISPA. Jadi pernyataan (2) adalah penyebab dan pernyataan (1) adalah akibat (B)."
      },
      {
        "id": "pu-6-q2",
        "soal": "Pernyataan:\n(1) Harga daging sapi di pasar tradisional merangkak naik sebesar 20%.\n(2) Permintaan terhadap daging ayam potong dan telur mengalami kenaikan tajam.\nHubungan yang paling tepat adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pernyataan (1) adalah penyebab dan pernyataan (2) adalah akibat."
          },
          {
            "label": "B",
            "text": "Pernyataan (2) adalah penyebab dan pernyataan (1) adalah akibat."
          },
          {
            "label": "C",
            "text": "Pernyataan (1) dan (2) adalah akibat dari penyebab yang sama."
          },
          {
            "label": "D",
            "text": "Pernyataan (1) dan (2) adalah akibat dari penyebab yang tidak saling berkaitan."
          },
          {
            "label": "E",
            "text": "Pernyataan (1) adalah akibat dari pernyataan (2)."
          }
        ],
        "kunci": "A",
        "pembahasan": "Dalam teori ekonomi mikro, daging ayam adalah barang substitusi (pengganti) daging sapi. Kenaikan harga daging sapi (1) menyebabkan konsumen beralih membeli daging ayam, sehingga permintaan ayam naik (2). Maka (1) adalah penyebab dan (2) adalah akibat (A)."
      },
      {
        "id": "pu-6-q3",
        "soal": "Pernyataan:\n(1) Angka kunjungan wisatawan domestik ke pegunungan Bromo menurun drastis.\n(2) Penerbangan rute Jakarta-Surabaya mengalami penurunan tingkat keterisian penumpang (load factor).\nKondisi yang paling mungkin melatarbelakangi kedua pernyataan adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pernyataan (1) menyebabkan pernyataan (2)."
          },
          {
            "label": "B",
            "text": "Pernyataan (2) menyebabkan pernyataan (1)."
          },
          {
            "label": "C",
            "text": "Keduanya merupakan akibat dari suatu penyebab yang sama, misalnya kenaikan harga tiket pesawat dan cuaca ekstrem."
          },
          {
            "label": "D",
            "text": "Keduanya adalah penyebab independen yang saling meniadakan."
          },
          {
            "label": "E",
            "text": "Pernyataan (1) dan (2) tidak memiliki kaitan apa pun."
          }
        ],
        "kunci": "C",
        "pembahasan": "Penurunan kunjungan wisata ke Bromo dan penurunan load factor rute Jkt-Sub paling tepat dipandang sebagai dua akibat yang dipicu oleh faktor makro bersama (common cause), seperti tiket transportasi yang melonjak atau bencana alam di kawasan Jawa Timur. Jadi keduanya adalah akibat dari penyebab yang sama (C)."
      },
      {
        "id": "pu-6-q4",
        "soal": "Kondisi: 'Seseorang harus memiliki SIM C untuk dapat mengendarai sepeda motor secara legal di jalan raya.' Dalam logika, memiliki SIM C berstatus sebagai...",
        "opsi": [
          {
            "label": "A",
            "text": "Syarat cukup semata"
          },
          {
            "label": "B",
            "text": "Syarat perlu (necessary condition)"
          },
          {
            "label": "C",
            "text": "Sebab utama pengendara mahir berkendara"
          },
          {
            "label": "D",
            "text": "Akibat langsung dari membeli sepeda motor"
          },
          {
            "label": "E",
            "text": "Kondisi yang tidak relevan dengan hukum"
          }
        ],
        "kunci": "B",
        "pembahasan": "Memiliki SIM C adalah syarat yang wajib dipenuhi (syarat perlu) agar seseorang legal berkendara. Tanpa SIM C, berkendara motor pasti melanggar hukum (~A → ~B)."
      },
      {
        "id": "pu-6-q5",
        "soal": "Kekeliruan menalar yang menganggap bahwa karena peristiwa B terjadi setelah peristiwa A, maka A pasti merupakan penyebab B dikenal dalam istilah logika sebagai...",
        "opsi": [
          {
            "label": "A",
            "text": "Ad Hominem"
          },
          {
            "label": "B",
            "text": "Strawman Fallacy"
          },
          {
            "label": "C",
            "text": "Post hoc ergo propter hoc"
          },
          {
            "label": "D",
            "text": "Slippery Slope"
          },
          {
            "label": "E",
            "text": "False Dilemma"
          }
        ],
        "kunci": "C",
        "pembahasan": "Post hoc ergo propter hoc adalah sesat pikir yang mengasumsikan kausalitas semata-mata karena urutan waktu kejadian (A terjadi duluan, lalu B terjadi, lantas menyimpulkan A menyebabkan B tanpa bukti mekanisme kausal)."
      }
    ],
    "keyTakeaways": [
      "Gunakan uji kata hubung 'KARENA' untuk mengecek arah kausalitas logis.",
      "Waspadai faktor ketiga di balik layar (penyebab bersama/common cause).",
      "Pahami beda syarat perlu (wajib ada) vs syarat cukup (cukup ada).",
      "Hindari sesat pikir post hoc: korelasi kronologis bukan bukti kausalitas mutlak."
    ],
    "rekomendasiLatihan": "Tuntaskan seluruh latihan Penalaran Umum untuk meraih skor target di atas 750!"
  }
];
