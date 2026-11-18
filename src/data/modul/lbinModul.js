// src/data/modul/lbinModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const LBIN_MODUL = [
  {
    "id": "lbi-ide-pokok-teks-kompleks",
    "babNumber": 1,
    "slug": "lbi-ide-pokok-teks-kompleks",
    "subtestKode": "LBIN",
    "judul": "Menemukan Inti Bacaan & Argumen Sentral Teks Panjang",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Strategi membaca wacana panjang multidisiplin: memetakan tesis utama penulis, membedakan argumen sentral dari ilustrasi pendukung, dan menyaring informasi esensial.",
    "learningObjectives": [
      "Menemukan kalimat tesis (thesis statement) pada teks eksposisi/argumentasi panjang.",
      "Membedakan klaim utama penulis dengan sanggahan balik (counter-argument).",
      "Menghubungkan gagasan pokok antar-paragraf menjadi satu kesatuan tema utuh.",
      "Mengidentifikasi distractor opsi jawaban yang terlalu sempit atau keluar konteks."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Struktur Makro Teks Akademik",
        "isi": "Teks literasi UTBK biasanya terdiri atas 3-5 paragraf. Paragraf 1 memperkenalkan isu dan tesis utama. Paragraf 2 dan 3 menyajikan bukti data empiris dan analisis. Paragraf penutup menegaskan kembali implikasi dari tesis tersebut.",
        "poinPenting": [
          "Argumen sentral biasanya berada pada paragraf pengantar atau paragraf penutup.",
          "Paragraf di tengah hanya berfungsi sebagai pengembang data/ilustrasi teknis."
        ]
      },
      {
        "subjudul": "2. Teknik Membaca Aktif (Active Skimming)",
        "isi": "Jangan membaca setiap kata dengan kecepatan yang sama. Percepat membaca pada kalimat yang berisi contoh kasus, dan perlambat membaca pada kalimat pertama dan terakhir setiap paragraf.",
        "poinPenting": [
          "Tandai kata transisi kritis: 'Namun demikian', 'Akan tetapi', 'Yang lebih mendasar adalah'."
        ]
      }
    ],
    "trikCepat": "Baca kalimat pertama setiap paragraf untuk membuat 'peta mental' teks dalam 30 detik! Gagasan sentral teks adalah intisari gabungan dari kalimat-kalimat pertama tersebut.",
    "jebakanUmum": "Terpaku membaca rincian contoh kasus berulang-ulang sehingga kehabisan waktu sebelum sempat memahami kesimpulan utama penulis.",
    "contohSoal": [
      {
        "soal": "Inti gagasan yang ingin disampaikan oleh penulis dalam wacana transisi energi hijau yang berkeadilan adalah...",
        "opsi": {
          "A": "Pembangunan pembangkit listrik tenaga surya membutuhkan biaya investasi awal yang sangat mahal.",
          "B": "Transisi energi terbarukan harus tetap menjamin perlindungan sosial dan kesejahteraan para pekerja tambang fosil yang terdampak.",
          "C": "Batu bara adalah sumber energi yang paling murah dan melimpah di negara berkembang.",
          "D": "Semua tambang batu bara harus ditutup seketika tanpa kompromi.",
          "E": "Energi hijau hanya cocok diterapkan di negara-negara maju di Eropa."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Konsep 'transisi energi yang berkeadilan' (just energy transition) selalu menekankan dua sisi: percepatan dekarbonisasi dan proteksi terhadap pekerja sektor fosil.",
          "Opsi B merangkum tesis sentral ini dengan sangat presisi dan komprehensif.",
          "Opsi A, C, D, dan E bersifat parsial, terlalu ekstrem, atau menyimpang.",
          "Maka jawabannya adalah B."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "lbi-1-q1",
        "soal": "Kalimat tesis (thesis statement) sebuah artikel ilmiah populer paling sering diletakkan pada bagian...",
        "opsi": [
          {
            "label": "A",
            "text": "Paragraf pengantar (pendahuluan) atau kalimat penutup pendahuluan"
          },
          {
            "label": "B",
            "text": "Tabel data statistik di tengah naskah"
          },
          {
            "label": "C",
            "text": "Daftar pustaka"
          },
          {
            "label": "D",
            "text": "Catatan kaki (footnote)"
          },
          {
            "label": "E",
            "text": "Lampiran kuesioner"
          }
        ],
        "kunci": "A",
        "pembahasan": "Kalimat tesis dirumuskan oleh penulis pada paragraf pengantar untuk memandu pembaca memahami posisi argumentasi yang akan dipertahankan sepanjang esai (A)."
      },
      {
        "id": "lbi-1-q2",
        "soal": "Jika paragraf 1 membahas kelebihan teknologi kecerdasan buatan, paragraf 2 membahas risiko etisnya, dan paragraf 3 mengusulkan regulasi tata kelola yang seimbang, maka tema utama teks tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Larangan penggunaan teknologi kecerdasan buatan"
          },
          {
            "label": "B",
            "text": "Pentingnya regulasi etis untuk menyeimbangkan potensi dan risiko kecerdasan buatan"
          },
          {
            "label": "C",
            "text": "Daftar algoritma AI terbaik dunia"
          },
          {
            "label": "D",
            "text": "Kerugian finansial akibat otomatisasi"
          },
          {
            "label": "E",
            "text": "Masa depan programmer manusia"
          }
        ],
        "kunci": "B",
        "pembahasan": "Tema utama harus menyintesis ketiga paragraf: kelebihan (potensi) + risiko etis + usulan regulasi → Regulasi etis untuk menyeimbangkan potensi dan risiko (B)."
      },
      {
        "id": "lbi-1-q3",
        "soal": "Peran kalimat 'Sebagai contoh, sebuah studi di Finlandia menunjukkan...' dalam struktur teks argumentasi adalah sebagai...",
        "opsi": [
          {
            "label": "A",
            "text": "Tesis utama"
          },
          {
            "label": "B",
            "text": "Klaim sentral"
          },
          {
            "label": "C",
            "text": "Bukti pendukung empiris (evidence)"
          },
          {
            "label": "D",
            "text": "Simpulan akhir wacana"
          },
          {
            "label": "E",
            "text": "Sanggahan terhadap penulis"
          }
        ],
        "kunci": "C",
        "pembahasan": "Frasa 'Sebagai contoh, sebuah studi menunjukkan...' secara gamblang menandakan penyajian bukti pendukung empiris untuk memperkuat argumen sebelumnya (C)."
      },
      {
        "id": "lbi-1-q4",
        "soal": "Manakah kriteria opsi jawaban yang paling tepat dipilih saat menjawab soal gagasan utama teks?",
        "opsi": [
          {
            "label": "A",
            "text": "Memuat angka statistik paling detail"
          },
          {
            "label": "B",
            "text": "Mampu memayungi seluruh ide paragraf tanpa terlalu sempit dan tanpa terlalu luas"
          },
          {
            "label": "C",
            "text": "Memuat kalimat opini yang paling provokatif"
          },
          {
            "label": "D",
            "text": "Hanya merangkum kalimat pertama paragraf ketiga"
          },
          {
            "label": "E",
            "text": "Menggunakan istilah ilmiah yang paling sulit"
          }
        ],
        "kunci": "B",
        "pembahasan": "Gagasan utama yang valid harus memiliki daya rangkul komprehensif: memayungi seluruh isi wacana tanpa terdistorsi menjadi terlalu sempit atau hiperbolis (B)."
      },
      {
        "id": "lbi-1-q5",
        "soal": "Kata transisi 'Di sisi lain' atau 'Sebaliknya' pada awal paragraf ketiga menandakan bahwa paragraf tersebut berisi...",
        "opsi": [
          {
            "label": "A",
            "text": "Pengulangan persis dari paragraf sebelumnya"
          },
          {
            "label": "B",
            "text": "Sudut pandang kontras atau perspektif pembanding terhadap isu"
          },
          {
            "label": "C",
            "text": "Penutupan naskah"
          },
          {
            "label": "D",
            "text": "Definisi leksikal kata sulit"
          },
          {
            "label": "E",
            "text": "Daftar riwayat hidup penulis"
          }
        ],
        "kunci": "B",
        "pembahasan": "Konjungsi pertentangan antarkalimat/paragraf seperti 'Di sisi lain' berfungsi memunculkan perspektif alternatif atau sudut pandang yang kontras dengan bahasan sebelumnya (B)."
      }
    ],
    "keyTakeaways": [
      "Fokus pada kalimat tesis di paragraf pembuka dan penutup.",
      "Terapkan active skimming: baca cepat pada contoh, baca teliti pada klaim.",
      "Tema utama wajib merangkul benang merah seluruh paragraf.",
      "Jangan terkecoh oleh detail bukti statistik saat mencari ide pokok."
    ],
    "rekomendasiLatihan": "Latih kecepatan membaca wacana panjang di tes simulasi Literasi Indonesia."
  },
  {
    "id": "lbi-menyimpulkan-isi-bacaan",
    "babNumber": 2,
    "slug": "lbi-menyimpulkan-isi-bacaan",
    "subtestKode": "LBIN",
    "judul": "Inferensi & Menarik Simpulan Tersirat dari Bacaan",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Menarik kesimpulan logis dari informasi tersirat (implisit) yang tidak tertulis secara harfiah, namun didukung kuat oleh rangkaian premis fakta dalam wacana.",
    "learningObjectives": [
      "Menarik inferensi logis yang tidak melampaui batas kewajaran teks.",
      "Mendeteksi asumsi tersembunyi (unstated assumption) yang menjadi pijakan argumen.",
      "Menghubungkan dua premis terpisah di paragraf berbeda untuk melahirkan simpulan baru.",
      "Menggugurkan kesimpulan palsu yang mengandung generalisasi terburu-buru (hasty generalization)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Memahami Hakikat Inferensi",
        "isi": "Inferensi adalah proses penarikan kesimpulan berdasarkan petunjuk tidak langsung. Dalam UTBK, inferensi yang benar BUKAN tebakan bebas, melainkan konsekuensi logis mutlak dari premis-premis teks.",
        "poinPenting": [
          "Jika teks menyatakan: 'Semua mobil listrik tidak menghasilkan emisi knalpot, dan Kota X hanya mengizinkan kendaraan bebas emisi knalpot melintas di pusat kota.'",
          "Maka inferensi yang sah: 'Mobil listrik diizinkan melintas di pusat Kota X'."
        ]
      },
      {
        "subjudul": "2. Batas Toleransi Simpulan",
        "isi": "Simpulan yang baik tidak boleh menambahkan informasi spekulatif yang tidak ada buktinya sama sekali dalam teks, walaupun hal itu terdengar masuk akal di dunia nyata.",
        "poinPenting": [
          "Jangan pernah memilih opsi inferensi yang melompat terlalu jauh ke masa depan tanpa dasar premis teks."
        ]
      }
    ],
    "trikCepat": "Gunakan Kaidah Implikasi: Tanyakan 'Jika teks ini 100% benar, maka konsekuensi logis apa yang PASTI ikut benar?'. Opsi yang lulus uji konsekuensi inilah yang merupakan inferensi sah!",
    "jebakanUmum": "Memilih opsi yang mengulang kalimat teks secara persis kata demi kata (ini namanya parafrase eksplisit, bukan inferensi tersirat!).",
    "contohSoal": [
      {
        "soal": "Kutipan wacana:\n'Studi epidemiologi menemukan bahwa komunitas pesisir tradisional di wilayah A yang mengonsumsi ikan laut segar setiap hari memiliki rata-rata tekanan darah yang normal hingga usia lanjut. Sebaliknya, generasi muda dari komunitas tersebut yang telah bermigrasi ke kota metropolitan dan sering mengonsumsi makanan cepat saji menunjukkan prevalensi hipertensi sebesar 38% sebelum usia 40 tahun.'\nSimpulan logis yang tersirat dari bacaan tersebut adalah...",
        "opsi": {
          "A": "Faktor genetika merupakan satu-satunya penentu risiko hipertensi pada komunitas wilayah A.",
          "B": "Perubahan pola makan dan gaya hidup perkotaan berkontribusi terhadap meningkatnya risiko hipertensi pada generasi muda.",
          "C": "Ikan laut segar merupakan satu-satunya makanan sehat di dunia.",
          "D": "Semua orang yang tinggal di pesisir dipastikan terbebas dari segala jenis penyakit jantung.",
          "E": "Tinggal di kota metropolitan pasti merusak tekanan darah setiap orang."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Teks membandingkan dua kelompok dari komunitas yang sama (faktor genetik serupa): mereka yang tetap makan ikan laut segar di pesisir (tensi normal) vs yang pindah ke kota dan makan cepat saji (38% hipertensi).",
          "Perbedaan mendasar ada pada pola makan dan lingkungan hidup.",
          "Maka simpulan logisnya adalah perubahan pola makan dan gaya hidup kota berkontribusi meningkatkan risiko hipertensi.",
          "Opsi A, C, D, dan E memuat kata mutlak ('satu-satunya', 'dipastikan terbebas', 'pasti merusak') yang salah secara ilmiah dan teks.",
          "Jadi kesimpulan yang tepat adalah B."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "lbi-2-q1",
        "soal": "Perbedaan mendasar antara 'fakta eksplisit' dan 'inferensi implisit' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Fakta eksplisit bernilai salah, sedangkan inferensi selalu benar."
          },
          {
            "label": "B",
            "text": "Fakta eksplisit tertulis langsung dalam teks, sedangkan inferensi ditarik secara logis dari hubungan antarfakta."
          },
          {
            "label": "C",
            "text": "Inferensi tidak membutuhkan bukti teks sama sekali."
          },
          {
            "label": "D",
            "text": "Fakta eksplisit hanya ada dalam novel fiksi."
          },
          {
            "label": "E",
            "text": "Tidak ada perbedaan antara keduanya."
          }
        ],
        "kunci": "B",
        "pembahasan": "Eksplisit tertera langsung di permukaan kata, sedangkan implisit (inferensi) adalah simpulan logis yang tersirat di balik hubungan antarkalimat (B)."
      },
      {
        "id": "lbi-2-q2",
        "soal": "Teks: 'Tanaman kopi arabika hanya dapat berproduksi optimal pada ketinggian di atas 1.000 meter dpl dengan suhu sejuk 16-22°C. Pemanasan global diproyeksikan menaikkan suhu rata-rata dataran tinggi sebesar 2,5°C dalam tiga dekade mendatang.' Inferensi yang paling didukung adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Produksi kopi arabika akan meningkat drastis di dataran rendah."
          },
          {
            "label": "B",
            "text": "Luas lahan yang ideal bagi budidaya kopi arabika terancam menyusut di masa depan."
          },
          {
            "label": "C",
            "text": "Petani kopi akan beralih menanam pohon jati."
          },
          {
            "label": "D",
            "text": "Harga kopi di kafe akan turun 50%."
          },
          {
            "label": "E",
            "text": "Pemanasan global tidak memengaruhi tanaman perkebunan."
          }
        ],
        "kunci": "B",
        "pembahasan": "Kenaikan suhu di dataran tinggi akan membuat wilayah yang suhunya 16-22°C menjadi semakin berkurang, sehingga area ideal budidaya terancam menyusut (B)."
      },
      {
        "id": "lbi-2-q3",
        "soal": "Kriteria kesimpulan yang BURUK dan harus dihindari peserta UTBK adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Bersifat objektif dan selaras dengan premis teks"
          },
          {
            "label": "B",
            "text": "Melakukan generalisasi berlebihan yang melampaui data yang disajikan teks"
          },
          {
            "label": "C",
            "text": "Menggunakan bahasa yang lugas"
          },
          {
            "label": "D",
            "text": "Merangkum hubungan sebab dan akibat"
          },
          {
            "label": "E",
            "text": "Menunjukkan implikasi praktis isu"
          }
        ],
        "kunci": "B",
        "pembahasan": "Generalisasi terburu-buru yang melampaui bukti naskah (overgeneralization) adalah ciri utama opsi jebakan yang keliru (B)."
      },
      {
        "id": "lbi-2-q4",
        "soal": "Jika seorang penulis menyoroti keberhasilan sistem kereta cepat negara X dan membandingkannya dengan kemacetan parah di negara Y, pesan tersirat yang ingin disampaikan adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Negara Y sebaiknya belajar mengembangkan sistem transportasi publik massal berkecepatan tinggi."
          },
          {
            "label": "B",
            "text": "Semua penduduk negara Y harus pindah ke negara X."
          },
          {
            "label": "C",
            "text": "Negara X tidak memiliki masalah sosial sama sekali."
          },
          {
            "label": "D",
            "text": "Mobil pribadi harus dilarang diproduksi di seluruh dunia."
          },
          {
            "label": "E",
            "text": "Kemacetan lalu lintas adalah hal yang wajar dan tak perlu diatasi."
          }
        ],
        "kunci": "A",
        "pembahasan": "Komparasi positif-negatif tersirat bertujuan memberikan rekomendasi kebijakan bagi pihak yang tertinggal (A)."
      },
      {
        "id": "lbi-2-q5",
        "soal": "Teknik terbaik untuk memverifikasi apakah sebuah opsi inferensi benar atau salah adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Menguji apakah premis teks dapat membuktikan negasi dari opsi tersebut"
          },
          {
            "label": "B",
            "text": "Menghitung jumlah kata dalam opsi"
          },
          {
            "label": "C",
            "text": "Memilih opsi yang paling panjang kalimatnya"
          },
          {
            "label": "D",
            "text": "Memilih opsi A secara otomatis"
          },
          {
            "label": "E",
            "text": "Mengabaikan teks bacaan"
          }
        ],
        "kunci": "A",
        "pembahasan": "Uji pembuktian logis (falsifikasi negasi) memastikan bahwa kesimpulan memang mutlak bertumpu pada data premis teks (A)."
      }
    ],
    "keyTakeaways": [
      "Inferensi bertumpu pada konsekuensi logis mutlak dari premis teks.",
      "Waspadai opsi yang melakukan generalisasi terburu-buru.",
      "Inferensi berbeda dengan parafrase harfiah kalimat teks.",
      "Hindari spekulasi pribadi yang tidak berakar pada bacaan."
    ],
    "rekomendasiLatihan": "Latih kemampuan inferensi pada modul penalaran teks bacaan Gemilang."
  },
  {
    "id": "lbi-menganalisis-argumen-dan-opini",
    "babNumber": 3,
    "slug": "lbi-menganalisis-argumen-dan-opini",
    "subtestKode": "LBIN",
    "judul": "Evaluasi Validitas Argumen, Fakta Empiris vs Opini",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Menganalisis kekuatan argumentasi teks: menguji reliabilitas data pendukung, membedakan fakta objektif dengan opini subjektif, serta mengidentifikasi klaim yang memperlemah atau memperkuat argumen.",
    "learningObjectives": [
      "Memisahkan kalimat fakta (dapat diverifikasi secara empiris) dari kalimat opini (penilaian subjektif).",
      "Menentukan argumen yang MEMPERKUAT (strengthen) atau MEMPERLEMAH (weaken) klaim penulis.",
      "Mengenali kesalahan bernalar (fallacy): ad hominem, strawman, dan false dilemma dalam teks.",
      "Menilai kredibilitas sumber rujukan yang dikutip penulis."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Fakta vs Opini",
        "isi": "- FAKTA: Informasi objektif yang dapat dibuktikan kebenarannya secara nyata melalui pengamatan, dokumen, atau data kuantitatif (contoh: 'Indonesia merdeka tahun 1945', 'Suhu air mendidih pada 100°C di tekanan 1 atm').\n- OPINI: Sikap, pandangan, atau penilaian pribadi yang dapat diperdebatkan (contoh: 'Matematika adalah pelajaran paling menyenangkan', 'Kota X adalah kota paling nyaman untuk ditinggali').",
        "poinPenting": [
          "Kata penanda opini: 'sebaiknya', 'tampaknya', 'sangat indah', 'diyakini', 'menurut hemat saya'."
        ]
      },
      {
        "subjudul": "2. Soal 'Memperlemah' dan 'Memperkuat' Argumen",
        "isi": "Soal meminta peserta menemukan pernyataan baru dari opsi yang:\n- Memperkuat: menambahkan bukti pendukung yang membuat klaim penulis semakin kokoh.\n- Memperlemah: menyajikan fakta alternatif yang membantah premis atau memutus rantai kausalitas klaim penulis.",
        "poinPenting": [
          "Pernyataan yang memperlemah sering berupa fakta bahwa akibat terjadi walau sebab tidak ada, atau adanya faktor penyebab lain yang lebih dominan."
        ]
      }
    ],
    "trikCepat": "Untuk mencari opsi yang MEMPERLEMAH: Cari opsi yang menunjukkan bahwa hubungan kausalitas penulis adalah SALAH atau KEBETULAN SEMATA, misalnya dengan membuktikan adanya faktor C yang sebenarnya menjadi penyebab utama!",
    "jebakanUmum": "Memilih opsi yang hanya mengulang argumen teks saat diminta mencari pernyataan yang memperkuat argumen (harus berupa bukti atau fakta tambahan yang relevan!).",
    "contohSoal": [
      {
        "soal": "Penulis mengklaim: 'Pemberlakuan jam malam bagi remaja terbukti efektif menurunkan angka kenakalan jalanan di Kota B.' Pernyataan berikut yang PALING MEMPERLEMAH klaim penulis tersebut adalah...",
        "opsi": {
          "A": "Angka kenakalan remaja jalanan juga menurun di kota-kota tetangga yang tidak menerapkan kebijakan jam malam.",
          "B": "Banyak orang tua yang mendukung kebijakan jam malam tersebut.",
          "C": "Petualangan malam hari digemari oleh anak muda.",
          "D": "Polisi menambah frekuensi patroli saat jam malam berlaku.",
          "E": "Tingkat kepatuhan remaja terhadap jam malam mencapai 80%."
        },
        "kunci": "A",
        "pembahasanLangkah": [
          "Penulis mengklaim bahwa penurunan kenakalan jalanan disebabkan oleh 'jam malam'.",
          "Opsi A membuktikan bahwa di kota-kota lain yang TIDAK ADA jam malam, angka kenakalan JUGA TETAP MENURUN.",
          "Fakta ini membuktikan bahwa penurunan kenakalan remaja kemungkinan besar dipicu oleh faktor lain (misal musim liburan selesai atau cuaca hujan), bukan karena jam malam.",
          "Ini secara telak MEMPERLEMAH klaim kausalitas penulis.",
          "Maka jawabannya adalah A."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "lbi-3-q1",
        "soal": "Kalimat berikut yang merupakan FAKTA objektif adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Pemandangan matahari terbit di Pantai Sanur sungguh menakjubkan."
          },
          {
            "label": "B",
            "text": "Berdasarkan data BPS, inflasi tahun kalender 2025 tercatat sebesar 2,61%."
          },
          {
            "label": "C",
            "text": "Masakan padang merupakan kuliner paling lezat di nusantara."
          },
          {
            "label": "D",
            "text": "Pendidikan vokasi tampaknya lebih menjanjikan daripada akademik."
          },
          {
            "label": "E",
            "text": "Semua orang seharusnya beralih menggunakan kendaraan listrik."
          }
        ],
        "kunci": "B",
        "pembahasan": "Opsi B memuat data kuantitatif empiris yang dirilis oleh lembaga resmi (BPS) dan dapat diverifikasi langsung. Opsi lainnya memuat kata penilaian subjektif (menakjubkan, paling lezat, tampaknya, seharusnya) (B)."
      },
      {
        "id": "lbi-3-q2",
        "soal": "Pernyataan yang PALING MEMPERKUAT argumen bahwa konsumsi teh hijau dapat meningkatkan metabolisme tubuh adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Riset laboratorium terakreditasi membuktikan senyawa EGCG dalam teh hijau meningkatkan laju oksidasi lemak hingga 17%."
          },
          {
            "label": "B",
            "text": "Harga teh hijau di pasaran relatif terjangkau oleh masyarakat umum."
          },
          {
            "label": "C",
            "text": "Banyak selebritas terkenal menyukai aroma wangi teh hijau."
          },
          {
            "label": "D",
            "text": "Teh hitam dan teh melati memiliki warna seduhan yang lebih pekat."
          },
          {
            "label": "E",
            "text": "Pabrik pengolahan teh mempekerjakan ratusan warga sekitar."
          }
        ],
        "kunci": "A",
        "pembahasan": "Bukti ilmiah laboratorium mengenai mekanisme biokimiawi senyawa EGCG secara langsung memperkuat mekanisme peningkatan metabolisme (A)."
      },
      {
        "id": "lbi-3-q3",
        "soal": "Kekeliruan berpikir (fallacy) yang menyerang kepribadian atau motif lawan bicara alih-alih membantah argumennya disebut...",
        "opsi": [
          {
            "label": "A",
            "text": "Argumentum Ad Hominem"
          },
          {
            "label": "B",
            "text": "Strawman Fallacy"
          },
          {
            "label": "C",
            "text": "Red Herring"
          },
          {
            "label": "D",
            "text": "Appeal to Authority"
          },
          {
            "label": "E",
            "text": "Circular Reasoning"
          }
        ],
        "kunci": "A",
        "pembahasan": "Ad Hominem adalah sesat pikir yang menyerang karakter pribadi, latar belakang, atau fisik orang yang menyampaikan argumen (A)."
      },
      {
        "id": "lbi-3-q4",
        "soal": "Klaim: 'Pemberian subsidi pupuk secara langsung kepada petani lewat kartu tani gagal mencapai target.' Bukti yang paling relevan untuk mendukung klaim tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Banyak petani di pelosok mengeluhkan kendala sinyal mesin gesek dan belum terdaftarnya nama mereka di pangkalan data."
          },
          {
            "label": "B",
            "text": "Pemerintah merencanakan rapat koordinasi pekan depan."
          },
          {
            "label": "C",
            "text": "Pupuk organik dapat dibuat sendiri dari kotoran ternak."
          },
          {
            "label": "D",
            "text": "Harga beras impor di pasar internasional mengalami penurunan."
          },
          {
            "label": "E",
            "text": "Luas sawah di Pulau Jawa mencapai jutaan hektare."
          }
        ],
        "kunci": "A",
        "pembahasan": "Fakta bahwa petani pelosok terkendala sinyal dan tidak terdaftar secara langsung membuktikan kegagalan implementasi target kartu tani di lapangan (A)."
      },
      {
        "id": "lbi-3-q5",
        "soal": "Penanda linguistik yang menunjukkan bahwa sebuah kalimat merupakan OPINI adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Adanya penyebutan tanggal dan lokasi peristiwa"
          },
          {
            "label": "B",
            "text": "Adanya modalitas subjektif seperti 'seharusnya', 'diyakini', dan 'sangat mungkin'"
          },
          {
            "label": "C",
            "text": "Penggunaan satuan ukuran meter atau kilogram"
          },
          {
            "label": "D",
            "text": "Adanya kutipan undang-undang pasal demi pasal"
          },
          {
            "label": "E",
            "text": "Penyajian nama peneliti dan institusi riset"
          }
        ],
        "kunci": "B",
        "pembahasan": "Modalitas epistemik dan deontik seperti 'seharusnya', 'diyakini', 'sangat mungkin' mengindikasikan ketidakpastian atau pertimbangan nilai subjektif dari penutur (B)."
      }
    ],
    "keyTakeaways": [
      "Fakta dapat diverifikasi secara objektif; opini memuat nilai rasa subjektif.",
      "Untuk memperlemah argumen, tunjukkan faktor penyebab lain atau bukti kasus tanpa sebab.",
      "Untuk memperkuat argumen, hadirkan data empiris yang mendukung mekanisme klaim.",
      "Waspadai fallacy ad hominem dan strawman dalam penalaran teks."
    ],
    "rekomendasiLatihan": "Latih analisis argumentasi kritis di Latihan Harian Gemilang."
  },
  {
    "id": "lbi-membaca-grafik-tabel-dan-infografik",
    "babNumber": 4,
    "slug": "lbi-membaca-grafik-tabel-dan-infografik",
    "subtestKode": "LBIN",
    "judul": "Interpretasi Infografik, Diagram & Tabel Terintegrasi Teks",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Membaca data multimodal: memadukan narasi wacana dengan visualisasi grafik batang, garis tren waktu, diagram lingkaran, serta tabel data multikolom.",
    "learningObjectives": [
      "Membaca sumbu horizontal (X) dan vertikal (Y) beserta satuan nilainya secara cermat.",
      "Mengidentifikasi tren data: kenaikan eksponensial, penurunan linier, fluktuasi, atau stasioner.",
      "Memverifikasi konsistensi antara klaim paragraf naskah dengan visualisasi data grafik.",
      "Menghitung persentase kenaikan/penurunan sederhana dari tabel data teks."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Langkah Sistematis Membaca Visual Data",
        "isi": "1. Baca Judul Tabel/Grafik untuk mengetahui topik dan rentang tahun pengamatan.\n2. Cermati Satuan Ukuran (misal: 'dalam triliun rupiah', 'dalam ribuan ton', 'dalam persen').\n3. Identifikasi Titik Tertinggi (Puncak), Titik Terendah (Lembah), dan Anomali Data.\n4. Cocokkan dengan pertanyaan soal: apakah menanyakan tren umum atau titik spesifik?",
        "poinPenting": [
          "Jangan terkecoh oleh skala sumbu yang tidak dimulai dari angka 0 (skala terpotong yang memberi ilusi kenaikan tajam)."
        ]
      },
      {
        "subjudul": "2. Integrasi Narasi Teks dan Visual",
        "isi": "Soal UTBK sering menanyakan: 'Pernyataan pada teks yang TIDAK SESUAI dengan data grafik di atas adalah...'. Siswa wajib mengecek satu per satu angka pada opsi terhadap titik koordinat grafik.",
        "poinPenting": [
          "Jika grafik menunjukkan kenaikan dari 2021 ke 2023 tetapi turun di 2022, klaim teks 'terus meningkat tanpa henti' adalah SALAH."
        ]
      }
    ],
    "trikCepat": "Cek Kata Ekstrem: Jika teks mengatakan 'selalu naik', 'tertinggi sepanjang sejarah', atau 'paling rendah', langsung arahkan mata ke titik puncak atau lembah grafik! Sering kali distorsi soal terletak pada kata pembatas ini.",
    "jebakanUmum": "Mengabaikan satuan pada judul sumbu Y (misal: angka tertulis 50, padahal satuannya 'dalam ribuan jiwa', artinya 50.000 jiwa).",
    "contohSoal": [
      {
        "soal": "Sebuah tabel memperlihatkan ekspor kopi Indonesia (dalam ribuan ton):\n2021: 380\n2022: 430\n2023: 410\n2024: 490\nPernyataan yang PALING TEPAT mendeskripsikan tren data ekspor tersebut adalah...",
        "opsi": {
          "A": "Ekspor kopi selalu mengalami peningkatan dari tahun ke tahun.",
          "B": "Ekspor kopi mengalami penurunan pada tahun 2023 sebelum melonjak mencapai puncaknya pada tahun 2024.",
          "C": "Volume ekspor tertinggi terjadi pada tahun 2022.",
          "D": "Ekspor kopi tahun 2024 meningkat lebih dari dua kali lipat dibanding tahun 2021.",
          "E": "Rata-rata ekspor per tahun berada di bawah 400 ribu ton."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Analisis tren: 2021 ke 2022 naik (380 → 430). 2022 ke 2023 turun (430 → 410). 2023 ke 2024 naik tajam ke titik puncak (410 → 490).",
          "Opsi A salah karena tahun 2023 turun (tidak 'selalu').",
          "Opsi B tepat: mengalami penurunan pada tahun 2023 (dari 430 ke 410) sebelum mencapai puncaknya pada tahun 2024 (490).",
          "Opsi C salah (tertinggi 2024). Opsi D salah (380 × 2 = 760, bukan 490).",
          "Maka jawaban yang tepat adalah B."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "lbi-4-q1",
        "soal": "Langkah pertama yang paling krusial sebelum menganalisis data sebuah grafik adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Langsung memilih opsi jawaban C"
          },
          {
            "label": "B",
            "text": "Membaca judul grafik, label sumbu X dan Y, serta satuan ukurannya"
          },
          {
            "label": "C",
            "text": "Menghitung rata-rata seluruh angka tanpa membaca pertanyaan"
          },
          {
            "label": "D",
            "text": "Mengabaikan keterangan legenda warna"
          },
          {
            "label": "E",
            "text": "Menghubungkan titik secara manual"
          }
        ],
        "kunci": "B",
        "pembahasan": "Memahami judul, label sumbu, dan satuan ukuran adalah fondasi mutlak agar terhindar dari salah tafsir data grafik (B)."
      },
      {
        "id": "lbi-4-q2",
        "soal": "Jika data penjualan meningkat dari 100 unit pada Januari menjadi 150 unit pada Februari, persentase kenaikan penjualan tersebut adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "25%"
          },
          {
            "label": "B",
            "text": "33,3%"
          },
          {
            "label": "C",
            "text": "50%"
          },
          {
            "label": "D",
            "text": "75%"
          },
          {
            "label": "E",
            "text": "150%"
          }
        ],
        "kunci": "C",
        "pembahasan": "Persentase kenaikan = [(Nilai Baru - Nilai Lama) / Nilai Lama] × 100% = [(150 - 100) / 100] × 100% = 50% (C)."
      },
      {
        "id": "lbi-4-q3",
        "soal": "Kelebihan utama penyajian data menggunakan diagram lingkaran (pie chart) dibanding diagram batang adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Memperlihatkan perubahan nilai terhadap waktu secara detail"
          },
          {
            "label": "B",
            "text": "Memperlihatkan proporsi atau persentase pangsa bagian terhadap keseluruhan (100%)"
          },
          {
            "label": "C",
            "text": "Dapat memuat ribuan kategori sekaligus"
          },
          {
            "label": "D",
            "text": "Menghilangkan kebutuhan akan angka"
          },
          {
            "label": "E",
            "text": "Hanya dapat digunakan untuk data cuaca"
          }
        ],
        "kunci": "B",
        "pembahasan": "Pie chart dirancang khusus untuk memvisualisasikan proporsi relatif tiap kategori terhadap total 100% keseluruhan data (B)."
      },
      {
        "id": "lbi-4-q4",
        "soal": "Sebuah wacana menyebut 'Penjualan produk Z merosot tajam', namun grafik memperlihatkan penjualan naik dari 1.000 ke 1.050. Ketidaksesuaian ini menunjukkan bahwa...",
        "opsi": [
          {
            "label": "A",
            "text": "Teks naskah keliru atau bertentangan dengan data faktual grafik"
          },
          {
            "label": "B",
            "text": "Grafik tersebut palsu"
          },
          {
            "label": "C",
            "text": "Angka 1.050 lebih kecil dari 1.000"
          },
          {
            "label": "D",
            "text": "Merosot tajam berarti naik sedikit"
          },
          {
            "label": "E",
            "text": "Satuan penjualan pasti negatif"
          }
        ],
        "kunci": "A",
        "pembahasan": "Klaim narasi 'merosot tajam' berbanding terbalik dengan grafik yang menunjukkan kenaikan. Ini adalah bentuk kontradiksi antara teks dan data grafis (A)."
      },
      {
        "id": "lbi-4-q5",
        "soal": "Grafik garis paling ideal digunakan untuk menyajikan jenis data...",
        "opsi": [
          {
            "label": "A",
            "text": "Komposisi suku bangsa penduduk suatu kota"
          },
          {
            "label": "B",
            "text": "Perkembangan harga emas dunia dari tahun ke tahun (runtun waktu/time series)"
          },
          {
            "label": "C",
            "text": "Daftar nama juara lomba cerdas cermat"
          },
          {
            "label": "D",
            "text": "Warna kesukaan siswa sekolah dasar"
          },
          {
            "label": "E",
            "text": "Denah ruang gedung perpustakaan"
          }
        ],
        "kunci": "B",
        "pembahasan": "Grafik garis (line chart) adalah visualisasi terbaik untuk memperlihatkan tren kontinuitas dan dinamika data deret waktu (time series) (B)."
      }
    ],
    "keyTakeaways": [
      "Perhatikan satuan pada judul sumbu grafik sebelum membaca angka.",
      "Waspadai kata pembatas ekstrem (selalu naik, tanpa henti).",
      "Diagram lingkaran menunjukkan proporsi bagian terhadap total 100%.",
      "Cocokkan setiap klaim paragraf dengan titik koordinat visual grafik."
    ],
    "rekomendasiLatihan": "Latih kecermatan infografis di subtes Literasi Bahasa Indonesia Gemilang."
  },
  {
    "id": "lbi-membandingkan-dua-teks",
    "babNumber": 5,
    "slug": "lbi-membandingkan-dua-teks",
    "subtestKode": "LBIN",
    "judul": "Sintesis & Perbandingan Dua Teks Berbeda Sudut Pandang",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Menemukan titik temu (kesamaan tema), titik tolak perdebatan (perbedaan sudut pandang/argumen), dan merumuskan sintesis harmonis dari dua bacaan bertema sejenis.",
    "learningObjectives": [
      "Menentukan persamaan pokok bahasan dari Teks 1 dan Teks 2.",
      "Mengidentifikasi perbedaan fokus pendekatan atau perspektif antardua teks.",
      "Menemukan argumen Teks 1 yang dibantah atau diperbaiki oleh Teks 2.",
      "Merumuskan pernyataan sintesis yang mewakili substansi kedua wacana."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Format Soal Teks Ganda (Dual Passage)",
        "isi": "Soal menyajikan Teks 1 dan Teks 2 yang membahas topik yang sama (misal: kendaraan listrik), tetapi:\n- Teks 1 fokus pada manfaat lingkungan dan dekarbonisasi.\n- Teks 2 fokus pada dampak negatif pertambangan nikel dan pembuangan limbah baterai.",
        "poinPenting": [
          "Pertanyaan umum 1: 'Persamaan topik yang dibahas kedua teks adalah...'",
          "Pertanyaan umum 2: 'Perbedaan fokus pembahasan antara Teks 1 dan Teks 2 adalah...'",
          "Pertanyaan umum 3: 'Sikap penulis Teks 2 terhadap klaim penulis Teks 1 adalah...'"
        ]
      },
      {
        "subjudul": "2. Metode Matriks Perbandingan Cepat",
        "isi": "Buat catatan mini 2 baris:\n- Teks 1: Topik apa? Pro/Kontra? Sudut pandang apa?\n- Teks 2: Topik apa? Pro/Kontra? Sudut pandang apa?",
        "poinPenting": [
          "Jangan pernah menyamakan 'topik' dengan 'sudut pandang'. Topiknya bisa sama (misal: AI di sekolah), tapi sudut pandangnya bertolak belakang (Teks 1 optimis, Teks 2 cemas)."
        ]
      }
    ],
    "trikCepat": "Gunakan Matriks Kontras: Teks 1 (+) vs Teks 2 (-). Jika Teks 1 menyoroti peluang dan Teks 2 menyoroti ancaman, maka perbedaan utamanya adalah 'keuntungan vs tantangan'! Opsi yang benar akan selalu mencerminkan dualisme ini.",
    "jebakanUmum": "Memilih opsi yang hanya benar untuk Teks 1 saja tetapi sama sekali tidak dibahas di Teks 2 saat menjawab pertanyaan 'Persamaan kedua teks'.",
    "contohSoal": [
      {
        "soal": "Teks 1 mengulas potensi ekonomi digital dalam menciptakan jutaan lapangan kerja baru bagi generasi muda. Teks 2 mengulas risiko otomatisasi kecerdasan buatan yang mengancam kepunahan profesi kerah putih konvensional.\nPerbedaan fokus kedua teks tersebut adalah...",
        "opsi": {
          "A": "Teks 1 menolak digitalisasi, sedangkan Teks 2 mendukung AI.",
          "B": "Teks 1 menyoroti peluang penciptaan kerja oleh ekonomi digital, sedangkan Teks 2 menyoroti ancaman disrupsi tenaga kerja oleh otomatisasi.",
          "C": "Teks 1 dan Teks 2 sama-sama memuji efisiensi teknologi modern.",
          "D": "Teks 1 membahas sektor pertanian, sedangkan Teks 2 membahas sektor kelautan.",
          "E": "Teks 1 pesimis terhadap generasi muda, sedangkan Teks 2 optimis."
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Teks 1: Peluang penciptaan lapangan kerja baru (sudut pandang optimis).",
          "Teks 2: Ancaman kepunahan profesi akibat otomatisasi (sudut pandang kritis/waspada).",
          "Opsi B secara gamblang dan akurat membedakan fokus kedua teks: 'peluang penciptaan kerja' vs 'ancaman disrupsi tenaga kerja'.",
          "Maka jawabannya adalah B."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "lbi-5-q1",
        "soal": "Jika pertanyaan menanyakan 'PERSAMAAN kedua teks', maka kriteria jawaban yang benar adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Gagasan yang hanya tercantum secara mendalam pada Teks 1"
          },
          {
            "label": "B",
            "text": "Pokok bahasan yang dibahas dan disetujui bersama oleh kedua teks"
          },
          {
            "label": "C",
            "text": "Jumlah kata dan paragraf yang identik"
          },
          {
            "label": "D",
            "text": "Penggunaan tanda baca yang persis sama"
          },
          {
            "label": "E",
            "text": "Kritik Teks 2 terhadap Teks 1"
          }
        ],
        "kunci": "B",
        "pembahasan": "Persamaan kedua teks harus berupa payung topik atau premis yang sama-sama dibahas dan diakui oleh kedua belah teks (B)."
      },
      {
        "id": "lbi-5-q2",
        "soal": "Sikap penulis Teks 2 yang menyatakan 'Namun, kalkulasi Teks 1 mengabaikan biaya pemeliharaan infrastruktur jangka panjang' terhadap Teks 1 dapat dikategorikan sebagai...",
        "opsi": [
          {
            "label": "A",
            "text": "Mendukung tanpa syarat"
          },
          {
            "label": "B",
            "text": "Mengoreksi atau mengkritisi kelengkapan argumen Teks 1"
          },
          {
            "label": "C",
            "text": "Menjiplak tulisan Teks 1"
          },
          {
            "label": "D",
            "text": "Mengabaikan topik sepenuhnya"
          },
          {
            "label": "E",
            "text": "Menghibur pembaca"
          }
        ],
        "kunci": "B",
        "pembahasan": "Pernyataan tersebut menunjukkan fungsi korektif: mengkritisi kelemahan atau keterbatasan ruang lingkup perhitungan Teks 1 (B)."
      },
      {
        "id": "lbi-5-q3",
        "soal": "Sintesis yang paling tepat dari dua pandangan yang bertentangan mengenai bekerja dari rumah (WFH) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "WFH harus dihapuskan sama sekali"
          },
          {
            "label": "B",
            "text": "Semua kantor fisik harus dijual"
          },
          {
            "label": "C",
            "text": "Penerapan model kerja hibrida (hybrid working) yang menggabungkan fleksibilitas WFH dengan kolaborasi tatap muka di kantor"
          },
          {
            "label": "D",
            "text": "Pekerja tidak perlu menerima gaji"
          },
          {
            "label": "E",
            "text": "Perusahaan harus melarang penggunaan internet"
          }
        ],
        "kunci": "C",
        "pembahasan": "Sintesis adalah jalan tengah solutif yang menyatukan keunggulan kedua opsi: model hybrid memadukan fleksibilitas dan kolaborasi langsung (C)."
      },
      {
        "id": "lbi-5-q4",
        "soal": "Perbedaan sudut pandang antara artikel akademis jurnalistik dan esai opini pribadi umumnya terletak pada...",
        "opsi": [
          {
            "label": "A",
            "text": "Objektivitas penyajian data dan nada tulisan"
          },
          {
            "label": "B",
            "text": "Kertas yang digunakan untuk mencetak"
          },
          {
            "label": "C",
            "text": "Bahasa yang digunakan"
          },
          {
            "label": "D",
            "text": "Tingkat ketebalan buku"
          },
          {
            "label": "E",
            "text": "Jenis huruf (font)"
          }
        ],
        "kunci": "A",
        "pembahasan": "Artikel akademis mengutamakan objektivitas bebas bias emosional, sedangkan esai opini menekankan keberpihakan subjektif dan persuasi emosional (A)."
      },
      {
        "id": "lbi-5-q5",
        "soal": "Saat membaca dua teks bertema lingkungan, Teks 1 fokus pada solusi regulasi pemerintah, sedangkan Teks 2 fokus pada aksi kesadaran individu. Perbedaan keduanya ada pada aspek...",
        "opsi": [
          {
            "label": "A",
            "text": "Subjek pelaku dan pendekatan pemecahan masalah"
          },
          {
            "label": "B",
            "text": "Negara tempat terjadinya polusi"
          },
          {
            "label": "C",
            "text": "Zaman terjadinya masalah lingkungan"
          },
          {
            "label": "D",
            "text": "Bahasa pengantar"
          },
          {
            "label": "E",
            "text": "Format penerbitan"
          }
        ],
        "kunci": "A",
        "pembahasan": "Teks 1 mengambil pendekatan top-down (regulasi negara), sedangkan Teks 2 mengambil pendekatan bottom-up (kesadaran individu). Perbedaannya ada pada aktor penggerak dan pendekatan solutif (A)."
      }
    ],
    "keyTakeaways": [
      "Petakan topik bersama vs sudut pandang khusus masing-masing teks.",
      "Persamaan harus didukung oleh kedua teks sekaligus.",
      "Perbedaan fokus sering mencerminkan pendekatan peluang vs tantangan.",
      "Sintesis merumuskan titik temu solutif dari kedua perspektif."
    ],
    "rekomendasiLatihan": "Selesaikan latihan teks ganda di modul Literasi Bahasa Indonesia."
  }
];
