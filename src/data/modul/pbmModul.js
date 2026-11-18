// src/data/modul/pbmModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const PBM_MODUL = [
  {
    "id": "pbm-ejaan-dan-tanda-baca-eyd-v",
    "babNumber": 1,
    "slug": "pbm-ejaan-dan-tanda-baca-eyd-v",
    "subtestKode": "PBM",
    "judul": "Ejaan & Tanda Baca Sesuai Pedoman EYD V",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Kaidah terkini Ejaan Bahasa Indonesia yang Disempurnakan (EYD V): huruf kapital pada gelar/geografi, huruf miring, tanda koma, titik dua, dan tanda pisah.",
    "learningObjectives": [
      "Menerapkan penulisan huruf kapital pada nama jabatan, geografi (teluk, danau, selat), dan dokumen resmi.",
      "Menggunakan huruf miring untuk istilah asing, judul buku/majalah, dan penegasan kata.",
      "Menempatkan tanda koma secara presisi (sebelum konjungsi koordinatif seperti 'tetapi, melainkan', dan setelah keterangan di awal kalimat).",
      "Membedakan fungsi tanda titik dua (:) dan titik koma (;) dalam perincian naskah."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Kaidah Huruf Kapital Krusial EYD V",
        "isi": "Huruf kapital digunakan untuk: nama orang, bangsa/bahasa, hari/bulan, peristiwa sejarah, dan nama geografi yang diikuti nama diri. PENTING: Nama jabatan HANYA kapital jika diikuti nama orang/lembaga (contoh: Presiden Joko Widodo, Gubernur Jawa Tengah, tetapi 'menjadi seorang presiden'). Geografi kapital jika nama diri (contoh: Selat Sunda, Danau Toba, tetapi 'mandi di danau').",
        "poinPenting": [
          "Bakar sate madura (huruf m kecil karena nama jenis makanan, bukan nama geografi).",
          "Kunci inggris, jeruk bali, pisang ambon (semuanya huruf kecil karena nama jenis).",
          "Tarian Toraja, batik Solo (huruf T dan S kapital karena menyatakan kekhasan budaya/daerah)."
        ]
      },
      {
        "subjudul": "2. Aturan Emas Tanda Koma (,)",
        "isi": "Tanda koma WAJIB dipakai:\n1. Di belakang anak kalimat yang mendahului induk kalimat (Jika hujan deras, pertandingan ditunda).\n2. Di depan konjungsi pertentangan intrakalimat (tetapi, melainkan, sedangkan).\n3. Mengapit keterangan aposisi tambahan.\n4. Di belakang konjungsi antarkalimat (Namun, Oleh karena itu, Meskipun demikian).",
        "poinPenting": [
          "JANGAN gunakan koma di depan kata 'bahwa'!",
          "JANGAN gunakan koma jika induk kalimat mendahului anak kalimat ('Pertandingan ditunda jika hujan deras' - TANPA KOMA)."
        ]
      }
    ],
    "trikCepat": "Cek rumus 'Induk-Anak tanpa Koma, Anak-Induk pakai Koma'! Jika kalimat dimulai dengan kata hubung (Jika, Karena, Walaupun, Ketika), maka di tengah-tengah pemisah antarklausa WAJIB ADA KOMA (,). Jika kalimat diawali subjek inti, koma biasanya tidak diperlukan!",
    "jebakanUmum": "Menaruh koma sebelum kata 'sehingga' atau 'bahwa'. Ingat: 'sehingga' dan 'bahwa' TIDAK PERNAH didahului koma dalam bahasa Indonesia baku!",
    "contohSoal": [
      {
        "soal": "Penulisan tanda baca koma yang BENAR menurut EYD V terdapat pada kalimat...",
        "opsi": {
          "A": "Meskipun cuaca sangat terik para petani tetap bersemangat memanen padi di sawah.",
          "B": "Peneliti menemukan bahwa, varian baru virus tersebut lebih cepat menyebar di ruang tertutup.",
          "C": "Ayah membelikan adik buku cerita, sedangkan ibu membuatkan segelas susu hangat.",
          "D": "Dia tidak datang ke rapat evaluasi karena, kendaraannya mogok di jalan raya.",
          "E": "Perusahaan itu berkembang pesat, sehingga berhasil membuka cabang di lima kota."
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Analisis A: diawali anak kalimat 'Meskipun cuaca sangat terik', seharusnya ada tanda koma setelah kata 'terik'.",
          "Analisis B: tanda koma setelah 'bahwa' adalah kesalahan fatal tanda baca.",
          "Analisis C: tanda koma diletakkan sebelum konjungsi pertentangan 'sedangkan'. Ini adalah penggunaan yang 100% tepat menurut kaidah EYD V.",
          "Analisis D: tanda koma setelah 'karena' salah.",
          "Analisis E: kata 'sehingga' tidak boleh didahului koma.",
          "Maka jawaban yang benar adalah C."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pbm-1-q1",
        "soal": "Penulisan huruf kapital yang TEPAT terdapat pada kalimat...",
        "opsi": [
          {
            "label": "A",
            "text": "Keluarga kami berlibur ke Danau Toba pada liburan semester lalu."
          },
          {
            "label": "B",
            "text": "Ia bermimpi menjadi seorang Menteri di kabinet masa depan."
          },
          {
            "label": "C",
            "text": "Ibu membeli Jeruk Bali di pasar buah tradisional."
          },
          {
            "label": "D",
            "text": "Perjalanan melintasi teluk tersebut memakan waktu dua jam."
          },
          {
            "label": "E",
            "text": "Paman gemar mengoleksi Batik Pekalongan dan Keris Jawa."
          }
        ],
        "kunci": "A",
        "pembahasan": "'Danau Toba' keduanya berhuruf kapital karena merupakan nama geografi yang diikuti nama spesifik danau (A). Pada B 'menteri' harus kecil karena tidak diikuti nama orang. Pada C 'jeruk bali' nama jenis (kecil). Pada D 'teluk' tanpa nama diri (kecil)."
      },
      {
        "id": "pbm-1-q2",
        "soal": "Kalimat berikut yang penulisan huruf miringnya BENAR adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Naskah proklamasi diterbitkan dalam surat kabar *Kompas*."
          },
          {
            "label": "B",
            "text": "Ia sedang membaca buku *Laskar Pelangi* karya Andrea Hirata."
          },
          {
            "label": "C",
            "text": "Istilah *downsizing* sering digunakan dalam restrukturisasi korporasi."
          },
          {
            "label": "D",
            "text": "Semua opsi di atas benar."
          },
          {
            "label": "E",
            "text": "Hanya opsi B dan C yang benar."
          }
        ],
        "kunci": "D",
        "pembahasan": "Huruf miring dipakai untuk: nama surat kabar (Kompas), judul buku (Laskar Pelangi), dan istilah bahasa asing yang belum diserap (downsizing). Jadi semua opsi A, B, C benar (D)."
      },
      {
        "id": "pbm-1-q3",
        "soal": "Tanda titik dua (:) TIDAK TEPAT digunakan pada kalimat...",
        "opsi": [
          {
            "label": "A",
            "text": "Perlengkapan yang wajib dibawa: tenda, matras, dan senter."
          },
          {
            "label": "B",
            "text": "Kami memerlukan perlengkapan kemah: tenda, matras, dan senter."
          },
          {
            "label": "C",
            "text": "Fakultas tersebut membuka tiga jurusan baru: Aktuaria, Biomedis, dan Sains Data."
          },
          {
            "label": "D",
            "text": "Kunci utama keberhasilan adalah: disiplin, konsisten, dan evaluasi berkala."
          },
          {
            "label": "E",
            "text": "Rapat tersebut menghasilkan keputusan: revisi anggaran operasional ditolak."
          }
        ],
        "kunci": "D",
        "pembahasan": "Tanda titik dua TIDAK BOLEH digunakan jika rangkaian rincian tersebut merupakan pelengkap yang mengakhiri pernyataan (langsung menempel pada kopula 'adalah', 'yaitu', atau verba pengantar). Kalimat D seharusnya: 'Kunci utama keberhasilan adalah disiplin, konsisten, dan evaluasi berkala' (tanpa titik dua). Opsi D tepat."
      },
      {
        "id": "pbm-1-q4",
        "soal": "Penggunaan tanda pisah (—) yang benar untuk menyatakan 'sampai dengan' terdapat pada kalimat...",
        "opsi": [
          {
            "label": "A",
            "text": "Ujian berlangsung pada tanggal 10 - 15 November 2026."
          },
          {
            "label": "B",
            "text": "Ujian berlangsung pada tanggal 10—15 November 2026."
          },
          {
            "label": "C",
            "text": "Kereta jurusan Jakarta—Surabaya berangkat pukul 08.00 WIB."
          },
          {
            "label": "D",
            "text": "Opsi B dan C benar."
          },
          {
            "label": "E",
            "text": "Hanya opsi A yang baku menurut EYD V."
          }
        ],
        "kunci": "D",
        "pembahasan": "Tanda pisah em-dash (—) tanpa spasi diapit dipakai untuk menyatakan 'sampai dengan' atau 'sampai ke' antara dua tanggal atau tempat: 10—15 November dan Jakarta—Surabaya. Maka opsi B dan C benar (D)."
      },
      {
        "id": "pbm-1-q5",
        "soal": "Penulisan partikel 'pun' yang benar adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Meskipun hari hujan, ia tetap berangkat ke kantor."
          },
          {
            "label": "B",
            "text": "Jangankan seribu rupiah, satu rupiahpun ia tidak punya."
          },
          {
            "label": "C",
            "text": "Apapun yang terjadi, kita harus tetap berusaha."
          },
          {
            "label": "D",
            "text": "Siapapun yang melanggar akan dikenai sanksi tegas."
          },
          {
            "label": "E",
            "text": "Bagaimanapun juga kita harus menghormati keputusan juri."
          }
        ],
        "kunci": "A",
        "pembahasan": "Partikel pun yang disambung hanya ada 12 konjungsi baku: adapun, andaipun, ataupun, bagaimanapun, biarpun, kalaupun, kendatipun, maupun, meskipun, sekalipun (meski), sungguhpun, walaupun. Pada kalimat A, 'meskipun' benar disambung. 'Satu rupiah pun', 'apa pun', 'siapa pun' seharusnya dipisah."
      }
    ],
    "keyTakeaways": [
      "Nama jabatan hanya kapital jika diikuti nama orang/wilayah resmi.",
      "Anak kalimat di awal wajib diakhiri tanda koma sebelum induk kalimat.",
      "Konjungsi pertentangan intrakalimat (tetapi, melainkan, sedangkan) wajib diawali koma.",
      "Jangan taruh koma sebelum kata 'bahwa' dan 'sehingga'."
    ],
    "rekomendasiLatihan": "Latih kecermatan ejaan naskah di simulasi subtes PBM Gemilang."
  },
  {
    "id": "pbm-kalimat-efektif",
    "babNumber": 2,
    "slug": "pbm-kalimat-efektif",
    "subtestKode": "PBM",
    "judul": "Kalimat Efektif & Syarat Keparalelan / Kehematan",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Mengidentifikasi dan memperbaiki kalimat tidak efektif: kesepadanan struktur (kejelasan S-P), keparalelan bentuk kata (me- dengan me-, di- dengan di-), kehematan (anti-pleonasme), dan kelogisan.",
    "learningObjectives": [
      "Memastikan keutuhan Subjek dan Predikat (menghindari kalimat buntung/tanpa subjek).",
      "Menerapkan prinsip keparalelan bentuk gramatikal dalam perincian (misal: verba aktif me- wajib disejajarkan dengan me-).",
      "Mengeliminasi pleonasme (pemborosan kata: 'agar supaya', 'sangat amat', 'demi untuk').",
      "Menguji kelogisan penalaran kalimat (menghindari kalimat 'Waktu dan tempat kami persilakan')."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Empat Pilar Kalimat Efektif",
        "isi": "Kalimat efektif adalah kalimat yang mampu menyampaikan gagasan secara tepat, padat, dan tidak menimbulkan ambiguitas bagi pembaca. Empat syarat utama:\n1. Kesepadanan: Memiliki Subjek dan Predikat yang jelas. Jangan menaruh preposisi (bagi, untuk, dalam, kepada) di depan Subjek.\n2. Keparalelan: Keselarasan bentuk kata yang dirinci. Jika satu verba aktif meN-, yang lain wajib meN-.\n3. Kehematan: Tidak menggunakan kata bersinonim secara berulang (pleonasme).\n4. Kelogisan: Makna kalimat dapat diterima oleh akal sehat.",
        "poinPenting": [
          "SALAH: 'Bagi para siswa diharapkan berkumpul' (Tidak ada Subjek karena diawali 'Bagi').",
          "BENAR: 'Para siswa diharapkan berkumpul' (Subjek: Para siswa).",
          "SALAH KEPARALELAN: 'Tugas panitia adalah merencanakan acara, pelaksanaan teknis, dan mengawasi jalannya lomba.' (merencanakan [me-], pelaksanaan [pe-an], mengawasi [me-]).",
          "BENAR: '...merencanakan, melaksanakan, dan mengawasi...'"
        ]
      },
      {
        "subjudul": "2. Daftar Pleonasme Populer yang Diharamkan UTBK",
        "isi": "- 'Demi untuk' → pilih salah satu: 'demi' ATAU 'untuk'.\n- 'Agar supaya' → pilih salah satu: 'agar' ATAU 'supaya'.\n- 'Banyak faktor-faktor' → 'banyak faktor' ATAU 'faktor-faktor'.\n- 'Maju ke depan' → 'maju' saja.\n- 'Turun ke bawah' → 'turun' saja.\n- 'Para hadirin sekalian' → 'hadirin' saja.",
        "poinPenting": [
          "Kelogisan: 'Waktu dan tempat kami persilakan' (SALAH, yang dipersilakan adalah pembicara, bukan waktu/tempat).",
          "BENAR: 'Bapak Direktur kami persilakan.'"
        ]
      }
    ],
    "trikCepat": "Trik Keparalelan: Cek imbuhan pada kata-kata yang dipisahkan koma! Jika polanya me-..., me-..., maka kata rincian berikutnya WAJIB me-... juga! Jika polanya di-..., di-..., maka rincian berikutnya WAJIB di-... juga. Jika ada yang melenceng (misal tiba-tiba pe-an atau kata benda), itu pasti kalimat TIDAK EFEKTIF!",
    "jebakanUmum": "Membiarkan kalimat diawali preposisi: 'Untuk mengetahui penyebab kebocoran gas ini memerlukan investigasi menyeluruh.' (SALAH! Kalimat ini tidak punya subjek karena diawali 'Untuk').",
    "contohSoal": [
      {
        "soal": "Kalimat berikut yang merupakan KALIMAT EFEKTIF adalah...",
        "opsi": {
          "A": "Dalam musyawarah itu memutuskan bahwa iuran kas warga dinaikkan menjadi Rp50.000,00.",
          "B": "Kegiatan penelitian ini meliputi perumusan masalah, pengumpulan data, dan menganalisis hasil survei.",
          "C": "Pemerintah berupaya menekan laju inflasi dengan cara memperkuat ketahanan pangan nasional.",
          "D": "Demi untuk kepentingan umum, pelebaran jalan protokol itu terpaksa menggusur sejumlah ruko.",
          "E": "Kepada mahasiswa yang belum mengumpulkan tugas akhir harap segera menghadap dosen pembimbing."
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Analisis A: Diawali 'Dalam...', tidak memiliki Subjek yang jelas (kehilangan kesepadanan).",
          "Analisis B: Melanggar keparalelan: 'perumusan' (pe-an), 'pengumpulan' (pe-an), tetapi 'menganalisis' (me-). Seharusnya 'penganalisisan hasil survei'.",
          "Analisis C: Struktur S (Pemerintah) - P (berupaya menekan) - O (laju inflasi) - K (dengan cara...) sangat padu, hemat, dan paralel. 100% EFEKTIF.",
          "Analisis D: Pleonasme pemborosan kata 'Demi untuk'.",
          "Analisis E: 'Kepada mahasiswa...' merusak fungsi subjek.",
          "Jadi kalimat yang efektif adalah C."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pbm-2-q1",
        "soal": "Perbaikan yang tepat untuk kalimat: 'Bagi seluruh peserta ujian dilarang membawa kalkulator ke dalam ruangan' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Menghilangkan kata 'Bagi'"
          },
          {
            "label": "B",
            "text": "Mengganti kata 'dilarang' dengan 'tidak boleh'"
          },
          {
            "label": "C",
            "text": "Menambahkan kata 'adalah' sebelum kata 'dilarang'"
          },
          {
            "label": "D",
            "text": "Mengubah kata 'ke dalam' menjadi 'didalam'"
          },
          {
            "label": "E",
            "text": "Menghilangkan kata 'seluruh'"
          }
        ],
        "kunci": "A",
        "pembahasan": "Menghilangkan kata 'Bagi' membuat 'seluruh peserta ujian' berfungsi sah sebagai Subjek kalimat yang utuh (A)."
      },
      {
        "id": "pbm-2-q2",
        "soal": "Kalimat yang TIDAK PARALEL bentuk kata rinciannya adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Ibu mencuci piring, menyapu lantai, dan merapikan tempat tidur."
          },
          {
            "label": "B",
            "text": "Tahapan daur ulang mencakup pemilahan sampah, pencucian bahan, dan pencetakan ulang."
          },
          {
            "label": "C",
            "text": "Tugas auditor adalah memeriksa pembukuan, evaluasi prosedur keuangan, dan melaporkan temuan."
          },
          {
            "label": "D",
            "text": "Buku itu telah dibeli, dibaca tuntas, dan disumbangkan ke perpustakaan."
          },
          {
            "label": "E",
            "text": "Ia pandai berenang, berlari cepat, dan menunggang kuda."
          }
        ],
        "kunci": "C",
        "pembahasan": "Pada C, kata 'memeriksa' (verba me-), 'melaporkan' (verba me-), tetapi 'evaluasi' adalah nomina tanpa imbuhan me-. Seharusnya 'mengevaluasi prosedur' agar paralel (C)."
      },
      {
        "id": "pbm-2-q3",
        "soal": "Kalimat yang mengandung pleonasme (pemborosan kata) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Banyak siswa yang berminat mengikuti olimpiade sains."
          },
          {
            "label": "B",
            "text": "Para hadirin sekalian dimohon untuk berdiri menyanyikan lagu Indonesia Raya."
          },
          {
            "label": "C",
            "text": "Mobil itu melaju kencang di jalan tol layang."
          },
          {
            "label": "D",
            "text": "Ia bekerja keras demi masa depan anak-anaknya."
          },
          {
            "label": "E",
            "text": "Harga beras kualitas super stabil sejak pekan lalu."
          }
        ],
        "kunci": "B",
        "pembahasan": "'Para hadirin sekalian' memuat redundansi ganda: 'para' (banyak), 'hadirin' (semua yang hadir), dan 'sekalian'. Cukup gunakan 'Hadirin dimohon...' (B)."
      },
      {
        "id": "pbm-2-q4",
        "soal": "Kalimat yang TIDAK LOGIS menurut nalar bahasa adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Mayat pria itu ditemukan terapung di tepi sungai."
          },
          {
            "label": "B",
            "text": "Untuk mempersingkat waktu, marilah kita buka acara ini bersama-sama."
          },
          {
            "label": "C",
            "text": "Bus pariwisata yang membawa rombongan guru masuk ke jurang."
          },
          {
            "label": "D",
            "text": "Pencuri sepeda motor itu berhasil ditangkap oleh warga."
          },
          {
            "label": "E",
            "text": "Pemerintah membagikan bantuan sosial bagi warga miskin."
          }
        ],
        "kunci": "B",
        "pembahasan": "Waktu tidak dapat dipersingkat atau dipendekkan (1 jam tetap 60 menit). Yang benar adalah 'menghemat waktu' atau 'mengefisienkan waktu'. Ungkapan 'mempersingkat waktu' tidak logis (B)."
      },
      {
        "id": "pbm-2-q5",
        "soal": "Manakah kalimat majemuk bertingkat yang efektif dan padu?",
        "opsi": [
          {
            "label": "A",
            "text": "Meskipun ia sakit keras, tetapi ia tetap hadir dalam ujian akhir semester."
          },
          {
            "label": "B",
            "text": "Walaupun harganya sangat mahal, namun ponsel pintar tersebut tetap laris terjual."
          },
          {
            "label": "C",
            "text": "Karena ia tidak belajar sungguh-sungguh, maka ia tidak lolos seleksi beasiswa."
          },
          {
            "label": "D",
            "text": "Meskipun diguyur hujan lebat, para suporter sepak bola tetap setia mendukung tim kesayangannya."
          },
          {
            "label": "E",
            "text": "Jika ia datang tepat waktu, sehingga kita dapat memulai diskusi lebih cepat."
          }
        ],
        "kunci": "D",
        "pembahasan": "Pada A, B, C terdapat konjungsi ganda yang merusak struktur (meskipun... tetapi; walaupun... namun; karena... maka). Kalimat bertingkat hanya boleh memiliki 1 konjungsi subordinatif. D adalah contoh kalimat bertingkat yang benar (D)."
      }
    ],
    "keyTakeaways": [
      "Subjek tidak boleh diawali kata depan (bagi, untuk, dalam, kepada).",
      "Jaga keparalelan imbuhan pada rincian kata.",
      "Hindari konjungsi ganda: jangan gabungkan 'meskipun' dengan 'tetapi', atau 'karena' dengan 'maka'.",
      "Hindari pleonasme seperti 'demi untuk', 'banyak saksi-saksi', 'para hadirin sekalian'."
    ],
    "rekomendasiLatihan": "Latih kemampuan menyunting kalimat tidak efektif di subtes PBM."
  },
  {
    "id": "pbm-struktur-kalimat-dan-fungsi-sintaksis",
    "babNumber": 3,
    "slug": "pbm-struktur-kalimat-dan-fungsi-sintaksis",
    "subtestKode": "PBM",
    "judul": "Struktur Kalimat (S-P-O-K-Pel) & Klausa Kompleks",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Membedah jabatan fungsi sintaksis: Subjek (S), Predikat (P), Objek (O), Pelengkap (Pel), dan Keterangan (K), serta membedakan Objek vs Pelengkap melalui uji pasif.",
    "learningObjectives": [
      "Mengidentifikasi inti Subjek dan inti Predikat dalam kalimat panjang kompleks.",
      "Menerapkan 'Uji Pasif' untuk membedakan Objek dengan Pelengkap secara mutlak.",
      "Menganalisis perluasan fungsi sintaksis menggunakan klausa bawahan berpenanda 'yang'.",
      "Memisahkan fungsi Keterangan (waktu, tempat, cara, alat, penyebab) dari inti argumen."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Tabel Jabatan Sintaksis Bahasa Indonesia",
        "isi": "Kalimat dasar bahasa Indonesia memiliki pola:\n- S-P (Adik tidur)\n- S-P-O (Ayah membaca koran)\n- S-P-Pel (Kakak belajar berenang)\n- S-P-O-Pel (Ibu membelikan adik sepatu baru)\n- S-P-K (Kami berangkat pagi-pagi).",
        "poinPenting": [
          "Subjek: jawaban atas pertanyaan 'Siapa?' atau 'Apa?' yang melakukan perbuatan.",
          "Predikat: tindakan/keadaan subjek (verba, adjektiva, atau frasa preposisional).",
          "Objek: nomina yang dikenai perbuatan verba transitif aktif (meN-) dan BISA menjadi Subjek saat dipasifkan!"
        ]
      },
      {
        "subjudul": "2. Perbedaan Mutlak Objek vs Pelengkap",
        "isi": "- OBJEK: Mengikuti verba transitif aktif (me-). Jika kalimat diubah ke pasif (di-), objek AKAN BERUBAH MENJADI SUBJEK!\n- PELENGKAP: Mengikuti verba intransitif (ber-, ter-, ber-...-an). Jika kalimat diubah ke pasif, pelengkap TIDAK BISA BERUBAH MENJADI SUBJEK (bahkan kalimatnya tidak bisa dipasifkan).",
        "poinPenting": [
          "'Negara kita berlandaskan Pancasila' -> 'Pancasila' adalah PELENGKAP (bukan Objek, karena tidak bisa dipasifkan: 'Pancasila dilandaskan negara kita' - SALAH).",
          "'Polisi menangkap pencuri' -> 'Pencuri' adalah OBJEK ('Pencuri ditangkap polisi' - SAH)."
        ]
      }
    ],
    "trikCepat": "Gunakan Uji Ubah Pasif: Jika kata setelah predikat BISA dipindahkan ke depan menjadi Subjek pada kalimat berawalan di-, kata tersebut 100% adalah OBJEK! Jika TIDAK BISA dipindahkan ke depan, kata tersebut adalah PELENGKAP!",
    "jebakanUmum": "Menganggap semua kata benda di belakang predikat adalah Objek. Banyak verba berawalan ber- (seperti: beternak ayam, bermain sepak bola, bersenjatakan bambu runcing) diikuti oleh PELENGKAP, bukan objek!",
    "contohSoal": [
      {
        "soal": "Perhatikan kalimat berikut:\n'Petani di lereng Gunung Merapi itu menanami ladangnya dengan aneka jenis palawija.'\nFungsi sintaksis dari frasa *dengan aneka jenis palawija* pada kalimat di atas adalah...",
        "opsi": {
          "A": "Subjek",
          "B": "Predikat",
          "C": "Objek",
          "D": "Pelengkap",
          "E": "Keterangan cara/alat"
        },
        "kunci": "E",
        "pembahasanLangkah": [
          "Analisis struktur:\n- 'Petani di lereng Gunung Merapi itu' = Subjek (S)\n- 'menanami' = Predikat (P, verba transitif)\n- 'ladangnya' = Objek (O, bisa dipasifkan: 'Ladangnya ditanami...')\n- 'dengan aneka jenis palawija' = diawali preposisi 'dengan' yang menyatakan alat/bahan pendukung.",
          "Frasa preposisional yang menyatakan bahan/alat/cara berkedudukan sebagai Keterangan (K).",
          "Maka fungsinya adalah Keterangan (E)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pbm-3-q1",
        "soal": "Pola kalimat 'Ilmuwan muda itu menemukan senyawa antivirus baru di hutan Kalimantan' setara polanya dengan...",
        "opsi": [
          {
            "label": "A",
            "text": "Dokter memeriksa kondisi pasien di ruang rawat darurat."
          },
          {
            "label": "B",
            "text": "Burung merpati terbang tinggi di angkasa luas."
          },
          {
            "label": "C",
            "text": "Adik bermain mobil-mobilan di teras rumah."
          },
          {
            "label": "D",
            "text": "Paman berjualan buah segar di pasar kaget."
          },
          {
            "label": "E",
            "text": "Ibu membelikan adik pakaian baru kemarin malam."
          }
        ],
        "kunci": "A",
        "pembahasan": "Kalimat target berpola S - P - O - K (Ilmuwan muda [S] + menemukan [P] + senyawa antivirus baru [O] + di hutan [K]). Opsi A: Dokter [S] + memeriksa [P] + kondisi pasien [O] + di ruang rawat [K]. Polanya identik S-P-O-K (A)."
      },
      {
        "id": "pbm-3-q2",
        "soal": "Kata yang berkedudukan sebagai PELENGKAP (bukan objek) terdapat pada kalimat...",
        "opsi": [
          {
            "label": "A",
            "text": "Pemerintah membangun jembatan gantung antarprovinsi."
          },
          {
            "label": "B",
            "text": "Kakek bertubuh kekar itu meminum secangkir kopi hitam."
          },
          {
            "label": "C",
            "text": "Negara Indonesia berlandaskan hukum yang adil dan beradab."
          },
          {
            "label": "D",
            "text": "Penulis menyelesaikan naskah novel terbarunya."
          },
          {
            "label": "E",
            "text": "Polisi lalu lintas menertibkan pengendara motor tanpa helm."
          }
        ],
        "kunci": "C",
        "pembahasan": "Pada C, predikatnya adalah 'berlandaskan' (verba intransitif ber-). Frasa 'hukum yang adil' berkedudukan sebagai Pelengkap, bukan objek (tidak bisa dijadikan subjek kalimat pasif). Opsi A, B, D, E semuanya memuat Objek penderita langsung (C)."
      },
      {
        "id": "pbm-3-q3",
        "soal": "Inti Subjek pada kalimat: 'Peningkatan konsumsi daging olahan yang mengandung natrium nitrit tinggi dapat memicu risiko kanker kolorektal' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Daging olahan"
          },
          {
            "label": "B",
            "text": "Konsumsi"
          },
          {
            "label": "C",
            "text": "Natrium nitrit"
          },
          {
            "label": "D",
            "text": "Peningkatan"
          },
          {
            "label": "E",
            "text": "Risiko kanker"
          }
        ],
        "kunci": "D",
        "pembahasan": "Subjek kalimat adalah frasa nomina panjang 'Peningkatan konsumsi daging olahan...'. Inti dari frasa subjek tersebut adalah nomina paling depan yang menjadi kepala frasa (head of noun phrase), yaitu 'Peningkatan' (D)."
      },
      {
        "id": "pbm-3-q4",
        "soal": "Kalimat majemuk yang memiliki induk kalimat berpola S-P-O adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Ketika senja tiba, kami menyaksikan matahari terbenam dari puncak bukit."
          },
          {
            "label": "B",
            "text": "Meskipun hujan turun, ia tetap berlari mengelilingi lapangan."
          },
          {
            "label": "C",
            "text": "Ayah membaca koran sambil mendengarkan siaran berita radio."
          },
          {
            "label": "D",
            "text": "Supaya sehat, kita harus rutin berolahraga setiap pagi."
          },
          {
            "label": "E",
            "text": "Gubernur meresmikan rumah sakit baru itu kemarin sore."
          }
        ],
        "kunci": "A",
        "pembahasan": "Pada A, anak kalimatnya adalah 'Ketika senja tiba' (Keterangan waktu). Induk kalimatnya adalah: 'kami [S] menyaksikan [P] matahari terbenam [O] dari puncak bukit [K]'. Induk kalimat memuat struktur dasar S-P-O (A)."
      },
      {
        "id": "pbm-3-q5",
        "soal": "Manakah kalimat berikut yang PREDIKATNYA bukan berupa kata kerja (verba), melainkan kata sifat (adjektiva)?",
        "opsi": [
          {
            "label": "A",
            "text": "Pemandangan pegunungan Alpen sangat mempesona."
          },
          {
            "label": "B",
            "text": "Burung elang itu mencengkeram mangsanya erat-erat."
          },
          {
            "label": "C",
            "text": "Ibu guru sedang menerangkan rumus kimia dasar."
          },
          {
            "label": "D",
            "text": "Mereka berkemah di tepi danau yang sejuk."
          },
          {
            "label": "E",
            "text": "Perusahaan itu memproduksi panel surya hemat energi."
          }
        ],
        "kunci": "A",
        "pembahasan": "Pada A, 'sangat mempesona' berfungsi sebagai Predikat adjektival (kata sifat yang menerangkan keadaan subjek pemandangan pegunungan). Opsi B, C, D, E predikatnya adalah verba aktif (A)."
      }
    ],
    "keyTakeaways": [
      "Objek selalu mendampingi verba transitif dan bisa berubah menjadi Subjek pasif.",
      "Pelengkap mendampingi verba intransitif (ber-, ter-) dan tidak bisa dipasifkan.",
      "Cari inti subjek dengan mengupas anak kalimat pewatas ('yang...').",
      "Preposisi (di, ke, dari, pada, bagi) menjadikan frasa sebagai Keterangan."
    ],
    "rekomendasiLatihan": "Latih kemampuan bedah sintaksis kalimat kompleks di latihan harian PBM."
  },
  {
    "id": "pbm-kepaduan-paragraf-dan-kohesi",
    "babNumber": 4,
    "slug": "pbm-kepaduan-paragraf-dan-kohesi",
    "subtestKode": "PBM",
    "judul": "Kepaduan Paragraf, Konjungsi & Kohesi-Koherensi",
    "durasiBacaMenit": 12,
    "ringkasanSingkat": "Menganalisis hubungan antar-kalimat menggunakan piranti kohesi (kata rujukan, repetisi kata kunci, substitusi) dan ketepatan pemilihan konjungsi antarkalimat.",
    "learningObjectives": [
      "Membedakan konjungsi intrakalimat (tetapi, karena, jika) dengan konjungsi antarkalimat (namun, oleh karena itu, selain itu).",
      "Menghilangkan kalimat sumbang (kalimat yang tidak padu dan merusak koherensi paragraf).",
      "Menerapkan anafora dan kata rujukan (ini, itu, tersebut, hal ini) untuk merajut kepaduan ide.",
      "Menyusun urutan kalimat acak menjadi paragraf eksposisi yang runtut dan padu."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Pemisahan Mutlak Konjungsi Intra vs Antar",
        "isi": "Banyak peserta UTBK gugur karena mencampuradukkan konjungsi intrakalimat dengan konjungsi antarkalimat:\n- Konjungsi Intrakalimat: menghubungkan klausa dalam satu kalimat (tetapi, sedangkan, melainkan, karena, jika, sehingga). HARAM diletakkan di awal kalimat setelah tanda titik!\n- Konjungsi Antarkalimat: menghubungkan kalimat baru dengan kalimat sebelumnya (Namun, Akan tetapi, Oleh karena itu, Dengan demikian, Selain itu). WAJIB diletakkan di awal kalimat dan DIIKUTI TANDA KOMA (,).",
        "poinPenting": [
          "SALAH BESAR: '. Sehingga inflasi naik.' (Sehingga adalah intrakalimat, tidak boleh di awal kalimat).",
          "BENAR: '. Akibatnya, inflasi naik.' ATAU '. Oleh karena itu, inflasi naik.'",
          "SALAH: '. Namun tidak ada yang hadir.' (Kurang tanda koma).",
          "BENAR: '. Namun, tidak ada yang hadir.'"
        ]
      },
      {
        "subjudul": "2. Mengendus Kalimat Sumbang (Inkoheren)",
        "isi": "Kalimat sumbang adalah kalimat yang keluar dari topik utama paragraf. Untuk menemukannya, tentukan dulu topik paragraf. Kalimat yang membahas hal lain (kendati topiknya masih mirip kata kuncinya) wajib dieliminasi.",
        "poinPenting": [
          "Jika paragraf membahas 'manfaat ekonomi teh hijau bagi petani lokal', kalimat penjelas yang tiba-tiba mengulas 'sejarah dinasti Tiongkok kuno' adalah kalimat sumbang!"
        ]
      }
    ],
    "trikCepat": "Cari kata 'Sehingga', 'Sedangkan', atau 'Dan' yang berada tepat setelah tanda titik (.) di awal kalimat! Keberadaannya otomatis merupakan KESALAHAN KOHEKSI FATAL yang wajib diperbaiki atau diganti dengan konjungsi antarkalimat yang sah seperti 'Oleh karena itu' atau 'Selain itu'!",
    "jebakanUmum": "Menggunakan kata 'namun demikian' (rancu). Bentuk baku menurut bahasa Indonesia adalah 'namun' ATAU 'meskipun demikian' (pilih salah satu, jangan digabung menjadi namun demikian).",
    "contohSoal": [
      {
        "soal": "Bacalah urutan kalimat berikut:\n(1) Produksi sampah plastik perkotaan terus mengalami eskalasi tajam setiap tahun.\n(2) Fasilitas tempat pembuangan akhir (TPA) diproyeksikan mengalami kelebihan kapasitas dalam waktu tiga tahun ke depan.\n(3) [ ... ] pemerintah daerah mulai menggalakkan program pemilahan sampah organik dan anorganik dari tingkat rumah tangga.\nKonjungsi antarkalimat yang paling tepat untuk mengisi bagian rumpang pada kalimat (3) adalah...",
        "opsi": {
          "A": "Walaupun demikian,",
          "B": "Oleh karena itu,",
          "C": "Sebaliknya,",
          "D": "Bahkan,",
          "E": "Selain itu,"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Kalimat (1) dan (2) memaparkan masalah genting: sampah melonjak dan TPA hampir penuh (sebab).",
          "Kalimat (3) menyajikan langkah aksi solutif dari pemerintah daerah untuk merespons masalah tersebut (akibat/respon).",
          "Hubungan logis antara sebab dan tindakan pemecahan masalah adalah hubungan kausal konsekutif (akibat).",
          "Konjungsi antarkalimat yang menyatakan konsekuensi logis adalah 'Oleh karena itu,' (B)."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pbm-4-q1",
        "soal": "Konjungsi intrakalimat berikut yang HARAM diletakkan di awal kalimat setelah tanda titik adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Namun,"
          },
          {
            "label": "B",
            "text": "Sehingga"
          },
          {
            "label": "C",
            "text": "Oleh sebab itu,"
          },
          {
            "label": "D",
            "text": "Selain itu,"
          },
          {
            "label": "E",
            "text": "Dengan demikian,"
          }
        ],
        "kunci": "B",
        "pembahasan": "'Sehingga' adalah konjungsi intrakalimat subordinatif penanda akibat. Konjungsi ini tidak boleh digunakan di awal kalimat mandiri setelah tanda titik (B)."
      },
      {
        "id": "pbm-4-q2",
        "soal": "Perhatikan paragraf berikut:\n'(1) Mangga kiojay asal Thailand kini banyak dibudidayakan di pekarangan rumah. (2) Ukuran buahnya yang luar biasa besar menjadi daya tarik utama bagi penghobi tanaman buah. (3) Daging buahnya tebal dengan biji yang relatif pipih dan rasa manis menyegarkan. (4) Thailand merupakan salah satu negara pendiri organisasi ASEAN di kawasan Asia Tenggara. (5) Perawatan pohon mangga ini pun tergolong mudah karena adaptif di dataran rendah.'\nKalimat yang merusak kepaduan paragraf (sumbang) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Kalimat (1)"
          },
          {
            "label": "B",
            "text": "Kalimat (2)"
          },
          {
            "label": "C",
            "text": "Kalimat (3)"
          },
          {
            "label": "D",
            "text": "Kalimat (4)"
          },
          {
            "label": "E",
            "text": "Kalimat (5)"
          }
        ],
        "kunci": "D",
        "pembahasan": "Topik utama paragraf adalah karakteristik hortikultura mangga kiojay (ukuran, rasa, perawatan). Kalimat (4) yang membicarakan posisi Thailand dalam organisasi geopolitik ASEAN sama sekali tidak relevan (kalimat sumbang, D)."
      },
      {
        "id": "pbm-4-q3",
        "soal": "Manakah penggunaan konjungsi antarkalimat yang BENAR dan baku menurut EYD V?",
        "opsi": [
          {
            "label": "A",
            "text": "Ia gagal dalam ujian pertama. Namun ia tidak putus asa."
          },
          {
            "label": "B",
            "text": "Pasokan listrik terputus. Tetapi teknisi segera memperbaikinya."
          },
          {
            "label": "C",
            "text": "Harga beras naik tinggi. Meskipun demikian, pemerintah memastikan ketersediaan stok pangan tetap aman."
          },
          {
            "label": "D",
            "text": "Hujan turun deras. Sehingga pertandingan sepak bola dihentikan sementara."
          },
          {
            "label": "E",
            "text": "Rapat telah selesai. Walaupun para peserta belum sepakat sepenuhnya."
          }
        ],
        "kunci": "C",
        "pembahasan": "'Meskipun demikian,' adalah konjungsi antarkalimat yang baku, diletakkan di awal kalimat dan diikuti tanda koma. Opsi A salah karena kurang koma setelah 'Namun'. Opsi B, D, E menggunakan konjungsi intrakalimat di awal kalimat (C)."
      },
      {
        "id": "pbm-4-q4",
        "soal": "Piranti kohesi gramatikal yang menggunakan pengacuan kata ganti tunjuk disebut...",
        "opsi": [
          {
            "label": "A",
            "text": "Substitusi"
          },
          {
            "label": "B",
            "text": "Elipsis"
          },
          {
            "label": "C",
            "text": "Referensi (penunjukan anafora/kata rujukan)"
          },
          {
            "label": "D",
            "text": "Sinonimi"
          },
          {
            "label": "E",
            "text": "Kolokasi"
          }
        ],
        "kunci": "C",
        "pembahasan": "Referensi (khususnya anafora) adalah pengacuan kembali pada unsur yang sudah disebutkan sebelumnya dengan menggunakan kata ganti/tunjuk seperti 'ini', 'itu', 'tersebut' (C)."
      },
      {
        "id": "pbm-4-q5",
        "soal": "Urutan yang tepat agar menjadi paragraf yang padu adalah:\n(1) Akibatnya, suhu bumi kian meningkat dari dekade ke dekade.\n(2) Fenomena ini lazim dikenal oleh para ilmuwan sebagai pemanasan global.\n(3) Gas rumah kaca yang dilepaskan ke atmosfer memerangkap radiasi panas matahari.\n(4) Kenaikan suhu tersebut berdampak langsung pada mencairnya gletser di kutub.",
        "opsi": [
          {
            "label": "A",
            "text": "(3) - (1) - (4) - (2)"
          },
          {
            "label": "B",
            "text": "(2) - (3) - (1) - (4)"
          },
          {
            "label": "C",
            "text": "(3) - (2) - (1) - (4)"
          },
          {
            "label": "D",
            "text": "(1) - (4) - (3) - (2)"
          },
          {
            "label": "E",
            "text": "(2) - (1) - (4) - (3)"
          }
        ],
        "kunci": "A",
        "pembahasan": "Urutan logis kausalitas:\n(3) Gas rumah kaca memerangkap panas (sebab awal).\n(1) Akibatnya, suhu bumi meningkat.\n(4) Kenaikan suhu tersebut memicu gletser mencair.\n(2) Fenomena ini dikenal sebagai pemanasan global (penutup simpulan). Urutan: (3)-(1)-(4)-(2) (A)."
      }
    ],
    "keyTakeaways": [
      "Konjungsi antarkalimat wajib di awal kalimat baru dan diikuti tanda koma.",
      "Jangan gunakan konjungsi intrakalimat (sehingga, sedangkan, tetapi) di awal kalimat mandiri.",
      "Kalimat sumbang adalah kalimat yang melenceng dari benang merah topik paragraf.",
      "Gunakan rujukan anafora (tersebut, hal ini) untuk memperkuat kohesi wacana."
    ],
    "rekomendasiLatihan": "Latih penyusunan paragraf acak di latihan harian PBM Gemilang."
  },
  {
    "id": "pbm-perbaikan-kalimat-dan-paragraf",
    "babNumber": 5,
    "slug": "pbm-perbaikan-kalimat-dan-paragraf",
    "subtestKode": "PBM",
    "judul": "Perbaikan Kalimat Rusak, Ambiguitas & Logika Nalar",
    "durasiBacaMenit": 14,
    "ringkasanSingkat": "Teknik merevisi kalimat rancu (kontaminasi), kalimat ambigu bermakna ganda, kalimat tanpa predikat, dan menyempurnakan diksi yang tidak baku.",
    "learningObjectives": [
      "Mendeteksi dan memperbaiki kontaminasi bentuk kata ('mengenyampingkan' vs 'mengesampingkan').",
      "Menghilangkan ambiguitas struktural frasa (misal: 'istri lurah yang baru').",
      "Memulihkan kalimat 'buntung' yang kehilangan predikat akibat perluasan kata 'yang'.",
      "Memilih opsi revisi kalimat yang paling hemat, padu, dan sesuai maksud penulis aslinya."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Jebakan Kalimat Buntung (Tanpa Predikat)",
        "isi": "Kalimat buntung terjadi saat penulis terlalu banyak memasukkan kata 'yang' sehingga seluruh kalimat hanya menjadi satu frasa subjek yang sangat panjang tanpa ada kata kerja yang berfungsi sebagai Predikat.",
        "poinPenting": [
          "BUNTUNG: 'Mahasiswa berprestasi yang menerima penghargaan internasional dari menteri pendidikan minggu lalu.' (Mana Predikatnya? Ini bukan kalimat, hanya Subjek!).",
          "REVISI BENAR: 'Mahasiswa berprestasi menerima penghargaan...' (hilangkan kata 'yang')."
        ]
      },
      {
        "subjudul": "2. Ambiguitas Frasa dan Penataan Tanda Hubung (-)",
        "isi": "Frasa ambigu memiliki lebih dari satu tafsir makna:\nContoh: 'Lukisan adik yang dipajang di galeri'\n- Tafsir 1: Lukisan milik adik.\n- Tafsir 2: Lukisan bergambar adik.\nEYD V menyediakan tanda hubung (-) untuk mempertegas batas kata: 'lukisan-adik yang dipajang'."
      }
    ],
    "trikCepat": "Cek rumus 'Hapus Kata Yang'! Jika sebuah kalimat terdengar belum tuntas dan di dalamnya ada kata 'yang' sebelum kata kerja utama, coba coret kata 'yang' tersebut. Kalimat tersebut seketika akan menjadi utuh dan sah memiliki Predikat!",
    "jebakanUmum": "Memilih revisi kalimat yang mengubah arti asli kalimat awal. Revisi terbaik adalah yang mempertahankan 100% substansi pesan naskah tetapi menyempurnakan struktur tata bahasanya.",
    "contohSoal": [
      {
        "soal": "Perhatikan kalimat berikut:\n'Pakar geologi yang memaparkan data potensi sesar aktif di hadapan komisi kebencanaan daerah.'\nKalimat di atas TIDAK BAKU karena tidak memiliki predikat. Perbaikan yang paling tepat adalah...",
        "opsi": {
          "A": "Menambahkan kata 'adalah' di awal kalimat",
          "B": "Menghilangkan kata 'yang'",
          "C": "Mengganti kata 'memaparkan' menjadi 'dipaparkan'",
          "D": "Menambahkan kata 'telah' sebelum kata 'pakar'",
          "E": "Mengubah kata 'di hadapan' menjadi 'dihadapan'"
        },
        "kunci": "B",
        "pembahasanLangkah": [
          "Analisis struktur: 'Pakar geologi yang memaparkan data... di hadapan komisi...' seluruhnya menjadi satu frasa subjek karena adanya kata pelekat 'yang'.",
          "Akibatnya kalimat tidak memiliki predikat (kalimat buntung).",
          "Jika kata 'yang' dihilangkan, kalimat menjadi: 'Pakar geologi [S] memaparkan [P] data potensi sesar aktif [O] di hadapan komisi... [K]'.",
          "Struktur kalimat menjadi utuh, sempurna, dan berpredikat sah.",
          "Maka perbaikan yang tepat adalah B."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pbm-5-q1",
        "soal": "Bentuk kata yang mengalami kesalahan 'kontaminasi' (kerancuan gabungan dua kata) adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Mengesampingkan"
          },
          {
            "label": "B",
            "text": "Mengenyampingkan"
          },
          {
            "label": "C",
            "text": "Mengetengahkan"
          },
          {
            "label": "D",
            "text": "Mengedepankan"
          },
          {
            "label": "E",
            "text": "Mengikutsertakan"
          }
        ],
        "kunci": "B",
        "pembahasan": "'Mengenyampingkan' adalah bentuk rancu (kontaminasi) dari kata dasar 'samping' (mengesampingkan) yang dicampuradukkan dengan bentuk fonem daerah. Bentuk baku yang benar adalah MENGESAMPINGKAN (B)."
      },
      {
        "id": "pbm-5-q2",
        "soal": "Frasa 'kucing makan tikus mati' bersifat ambigu. Maksud yang menyatakan bahwa kucing memakan bangkai tikus yang sudah mati dipertegas dengan penulisan...",
        "opsi": [
          {
            "label": "A",
            "text": "Kucing makan-tikus mati"
          },
          {
            "label": "B",
            "text": "Kucing-makan tikus mati"
          },
          {
            "label": "C",
            "text": "Kucing makan tikus-mati"
          },
          {
            "label": "D",
            "text": "Kucing makan, tikus mati"
          },
          {
            "label": "E",
            "text": "Kucing, makan tikus mati"
          }
        ],
        "kunci": "C",
        "pembahasan": "Tanda hubung pada 'tikus-mati' menunjukkan bahwa kata sifat 'mati' menerangkan nomina 'tikus' (tikus yang sudah mati dimakan oleh kucing) (C)."
      },
      {
        "id": "pbm-5-q3",
        "soal": "Kalimat yang TIDAK MEMILIKI SUBJEK adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Menurut laporan BMKG menyatakan bahwa potensi gelombang tinggi masih berlangsung."
          },
          {
            "label": "B",
            "text": "BMKG menyatakan bahwa potensi gelombang tinggi masih berlangsung."
          },
          {
            "label": "C",
            "text": "Potensi gelombang tinggi dilaporkan oleh pihak BMKG."
          },
          {
            "label": "D",
            "text": "Laporan resmi BMKG menyebutkan cuaca ekstrem di pesisir selatan."
          },
          {
            "label": "E",
            "text": "Para nelayan mematuhi imbauan keselamatan dari BMKG."
          }
        ],
        "kunci": "A",
        "pembahasan": "Pada A, kalimat diawali preposisi 'Menurut...', sehingga 'laporan BMKG' menjadi frasa keterangan. Kalimat ini langsung meloncat ke verba 'menyatakan' tanpa ada Subjek sah (A)."
      },
      {
        "id": "pbm-5-q4",
        "soal": "Revisi terbaik untuk menyederhanakan kalimat berbelit-belit: 'Adalah merupakan suatu kenyataan yang tidak dapat dibantah lagi bahwasanya kesehatan adalah modal utama hidup' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Kenyataan membuktikan bahwasanya kesehatan modal hidup."
          },
          {
            "label": "B",
            "text": "Tidak dapat dibantah bahwa kesehatan adalah modal utama hidup."
          },
          {
            "label": "C",
            "text": "Adalah benar kesehatan itu adalah modal hidup."
          },
          {
            "label": "D",
            "text": "Merupakan fakta tak terbantahkan kesehatan modal utama."
          },
          {
            "label": "E",
            "text": "Bahwasanya kesehatan merupakan kenyataan hidup."
          }
        ],
        "kunci": "B",
        "pembahasan": "Kalimat awal memuat penumpukan kopula mubazir ('Adalah merupakan', 'bahwasanya'). Revisi paling padat, lugas, dan baku adalah 'Tidak dapat dibantah bahwa kesehatan adalah modal utama hidup' (B)."
      },
      {
        "id": "pbm-5-q5",
        "soal": "Bentuk kata berikut yang merupakan kata baku menurut KBBI adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Analisa dan diagnosa"
          },
          {
            "label": "B",
            "text": "Analisis dan diagnosis"
          },
          {
            "label": "C",
            "text": "Kwalitas dan sistim"
          },
          {
            "label": "D",
            "text": "Resiko dan praktek"
          },
          {
            "label": "E",
            "text": "Aktifitas dan jaman"
          }
        ],
        "kunci": "B",
        "pembahasan": "Bentuk serapan baku dari bahasa Inggris -is/-sis adalah -isis/-is: Analisis (bukan analisa) dan Diagnosis (bukan diagnosa). Kualitas, sistem, risiko, praktik, aktivitas, zaman (B)."
      }
    ],
    "keyTakeaways": [
      "Hapus kata 'yang' berlebih untuk memulihkan Predikat kalimat buntung.",
      "Hindari awalan preposisi jika ingin menjadikan kata sebagai Subjek.",
      "Waspadai kerancuan kontaminasi (mengesampingkan, bukan mengenyampingkan).",
      "Gunakan tanda hubung untuk mengurai ambiguitas frasa."
    ],
    "rekomendasiLatihan": "Selesaikan kuis perbaikan naskah di Roadmap PBM."
  },
  {
    "id": "pbm-penulisan-kata-serapan-dan-istilah",
    "babNumber": 6,
    "slug": "pbm-penulisan-kata-serapan-dan-istilah",
    "subtestKode": "PBM",
    "judul": "Penulisan Kata Serapan, Gabungan Kata & Istilah Baku",
    "durasiBacaMenit": 13,
    "ringkasanSingkat": "Pedoman penyerapan istilah asing: adaptasi fonem (-ity menjadi -itas, -tion menjadi -si), bentuk terikat (pasca-, antar-, multi-, pra-), dan gabungan kata majemuk.",
    "learningObjectives": [
      "Menerapkan aturan penulisan bentuk terikat (pasca-, sub-, multi-, pra-, non-) yang wajib dirangkaikan.",
      "Menuliskan bentuk terikat yang diikuti kata berhuruf kapital menggunakan tanda hubung (misal: non-ASEAN, pro-Indonesia).",
      "Menguasai kaidah penyerapan sufiks asing: -ity → -itas (aktivitas), -tion → -si (standardisasi).",
      "Membedakan gabungan kata yang ditulis terpisah (tanggung jawab, kerja sama) dengan yang ditulis serangkai (tanggungjawabnya jika berkonfiks)."
    ],
    "konsepTeori": [
      {
        "subjudul": "1. Kaidah Bentuk Terikat (Bebas vs Terikat)",
        "isi": "Bentuk terikat seperti: pasca-, antar-, multi-, sub-, pra-, non-, ekstra-, semi-, dwi-, tuna- WAJIB DITULIS SERANGKAI (MENYATU) dengan kata dasar yang mengikutinya.",
        "poinPenting": [
          "BENAR: pascasarjana, antarkota, multilateral, subsektor, prasejarah, nonpemerintah.",
          "SALAH: pasca sarjana, antar kota, multi lateral, pra sejarah.",
          "PENGECUALIAN: Jika kata berikutnya diawali huruf kapital atau angka, wajib diberi TANDA HUBUNG (-): non-Indonesia, pra-1945, se-Jawa Timur."
        ]
      },
      {
        "subjudul": "2. Kaidah Gabungan Kata Majemuk & Imbuhan",
        "isi": "Gabungan kata dasar ditulis terpisah: kerja sama, tanggung jawab, terima kasih, tanda tangan, ibu kota.\nATURAN IMBUHAN:\n1. Jika hanya mendapat awalan SAJA atau akhiran SAJA, tetap TERPISAH (bertanggung jawab, berterima kasih, tanda tangani).\n2. Jika mendapat awalan DAN akhiran sekaligus (KONFIKS), WAJIB DIRANGKAIKAN SERANGKAI (pertanggungjawaban, menandatangani, melipatgandakan).",
        "poinPenting": [
          "bertanggung jawab (terpisah)",
          "pertanggungjawaban (serangkai menyatu)"
        ]
      }
    ],
    "trikCepat": "Hafalkan rumus Konfiks: 'Awalan saja/Akhiran saja = PISAH, Awalan + Akhiran serentak = SERANGKAI SATU KATA!' Contoh: ber- + tanda tangan = bertanda tangan (pisah), tapi me- + tanda tangan + -i = menandatangani (gabung menyatu)!",
    "jebakanUmum": "Menulis 'standardisasi' menjadi 'standarisasi'. Menurut kaidah serapan EYD V, kata serapan dari 'standardization' diserap menjadi 'standardisasi' (mempertahankan huruf d).",
    "contohSoal": [
      {
        "soal": "Penulisan gabungan kata dan bentuk terikat yang TEPAT terdapat pada kalimat...",
        "opsi": {
          "A": "Turnamen sepak bola antar sekolah itu berlangsung sangat meriah.",
          "B": "Mereka mengadakan pertemuan pasca bencana di balai desa.",
          "C": "Ketua organisasi menandatangani surat pertanggungjawaban kegiatan.",
          "D": "Semua anggota wajib memikul tanggungjawab secara bersama-sama.",
          "E": "Kegiatan donor darah ini terbuka bagi masyarakat non muslim."
        },
        "kunci": "C",
        "pembahasanLangkah": [
          "Analisis A: 'antar sekolah' salah, bentuk terikat 'antar-' wajib serangkai: 'antarsekolah'.",
          "Analisis B: 'pasca bencana' salah, bentuk terikat 'pasca-' wajib serangkai: 'pascabencana'.",
          "Analisis C: 'menandatangani' (konfiks me-...-i serangkai) dan 'pertanggungjawaban' (konfiks pe-...-an serangkai). Keduanya 100% baku!",
          "Analisis D: 'tanggungjawab' tanpa konfiks seharusnya terpisah: 'tanggung jawab'.",
          "Analisis E: 'non muslim' seharusnya 'non-Muslim' (dengan tanda hubung karena kata Muslim berhuruf kapital).",
          "Maka opsi yang tepat adalah C."
        ]
      }
    ],
    "kuisPemahaman": [
      {
        "id": "pbm-6-q1",
        "soal": "Penulisan bentuk serapan bahasa asing yang BAKU adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Standarisasi dan sistimatis"
          },
          {
            "label": "B",
            "text": "Standardisasi dan sistematis"
          },
          {
            "label": "C",
            "text": "Kwalifikasi dan efektifitas"
          },
          {
            "label": "D",
            "text": "Hierarki dan hipotesa"
          },
          {
            "label": "E",
            "text": "Kharisma dan tehnologi"
          }
        ],
        "kunci": "B",
        "pembahasan": "Standardisasi (dari standardization, tetap memakai d) dan sistematis (dari systematic). Opsi A salah karena standarisasi. Opsi C kualifikasi/efektivitas. Opsi D hipotesis. Opsi E karisma/teknologi (B)."
      },
      {
        "id": "pbm-6-q2",
        "soal": "Bentuk terikat berikut yang penulisannya SALAH adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Infrastruktur sub-sektor pertanian"
          },
          {
            "label": "B",
            "text": "Pertandingan antarmahasiswa"
          },
          {
            "label": "C",
            "text": "Masyarakat multikultural"
          },
          {
            "label": "D",
            "text": "Zaman prasejarah"
          },
          {
            "label": "E",
            "text": "Seminar pascapanen"
          }
        ],
        "kunci": "A",
        "pembahasan": "Bentuk terikat 'sub-' langsung dirangkai tanpa tanda hubung jika diikuti kata biasa berhuruf kecil: 'subsektor' (bukan sub-sektor) (A)."
      },
      {
        "id": "pbm-6-q3",
        "soal": "Kalimat yang memuat penulisan gabungan kata SECARA BENAR adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Kedua belah pihak sepakat menandatangani nota kesepahaman."
          },
          {
            "label": "B",
            "text": "Ia tidak mau bertangung jawab atas kerugian tersebut."
          },
          {
            "label": "C",
            "text": "Pemerintah melipat gandakan bantuan pangan untuk korban banjir."
          },
          {
            "label": "D",
            "text": "Surat itu telah di tanda tangani oleh kepala dinas."
          },
          {
            "label": "E",
            "text": "Mari kita bekerja-sama untuk membangun desa."
          }
        ],
        "kunci": "A",
        "pembahasan": "'Menandatangani' mendapat konfiks me-...-i sehingga wajib ditulis serangkai menyatu (A). Pada C 'melipatgandakan' harus serangkai karena konfiks me-...-kan. Pada D 'ditandatangani' harus serangkai. Pada E 'bekerja sama' tanpa tanda hubung."
      },
      {
        "id": "pbm-6-q4",
        "soal": "Penulisan kata serapan yang mengikuti kaidah peluluhan fonem akhiran bahasa Inggris '-ic' menjadi '-ik' adalah...",
        "opsi": [
          {
            "label": "A",
            "text": "Elektronik, spesifik, logik"
          },
          {
            "label": "B",
            "text": "Elektronika, spesifikasi, logika"
          },
          {
            "label": "C",
            "text": "Elektronik, spesifik, logis"
          },
          {
            "label": "D",
            "text": "Elektronik, spesifik, kritik"
          },
          {
            "label": "E",
            "text": "Elektro, spesi, logo"
          }
        ],
        "kunci": "D",
        "pembahasan": "Akhiran bahasa asing -ic diserap menjadi -ik: electronic → elektronik, specific → spesifik, critic → kritik (D)."
      },
      {
        "id": "pbm-6-q5",
        "soal": "Manakah penulisan kata bergaris bawah yang BENAR?",
        "opsi": [
          {
            "label": "A",
            "text": "Perusahaan itu memproduksi obat *anti alergi*."
          },
          {
            "label": "B",
            "text": "Delegasi tersebut menghadiri konferensi *non-blok*."
          },
          {
            "label": "C",
            "text": "Pameran ini menampilkan karya seniman *se-Asia Tenggara*."
          },
          {
            "label": "D",
            "text": "Ia menjabat sebagai ketua tim *sub koordinator*."
          },
          {
            "label": "E",
            "text": "Mereka merayakan pesta *pasca-pernikahan*."
          }
        ],
        "kunci": "C",
        "pembahasan": "'se-Asia Tenggara' wajib diberi tanda hubung karena awalan 'se-' diikuti kata yang berhuruf kapital 'Asia Tenggara' (C). Bentuk lain: antialergi (serangkai), nonblok (serangkai), subkoordinator (serangkai), pascapernikahan (serangkai)."
      }
    ],
    "keyTakeaways": [
      "Bentuk terikat (pasca, antar, multi, sub, pra, non) wajib ditulis serangkai.",
      "Gunakan tanda hubung (-) jika bentuk terikat diikuti huruf kapital atau angka (non-ASEAN).",
      "Konfiks me-...-kan / pe-...-an menyatukan gabungan kata (pertanggungjawaban).",
      "Standar serapan baku: standardisasi, sistematis, efektivitas, kualifikasi."
    ],
    "rekomendasiLatihan": "Sempurnakan kemampuan PBM di simulasi paket UTBK 2027 Gemilang."
  }
];
