#!/usr/bin/env python3
"""
scripts/update_smp_silabus.py
Sinkronisasi Database Silabus Kurikulum Merdeka SMP (Kelas 7, 8, 9)
untuk 5 Mata Pelajaran Utama: IPS, IPA, Bahasa Inggris, Bahasa Indonesia, Matematika.
Sesuai arahan resmi dan panduan kurikulum guru Bimbel Gemilang.
"""

import json
import re

SILABUS_FILE = 'src/utils/silabusKurikulumMerdeka.js'

NEW_SMP = {
  "7": {
    "ips": {
      "1": [
        {
          "id": "smp7-ips-s1-b1",
          "judul": "Bab 1: Keluarga Awal Kehidupan",
          "subBab": [
            "Keberadaan Diri dan Keluarga",
            "Mengenal Lokasi Tempat Tinggal (Peta, Skala, Simbol)",
            "Sosialisasi dalam Masyarakat (Nilai, Norma, Interaksi)",
            "Aktivitas Memenuhi Kebutuhan Hidup"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami keberadaan diri dan keluarga, keterampilan membaca peta dan lokasi tempat tinggal, proses sosialisasi pembentukan nilai dan norma, serta aktivitas pemenuhan kebutuhan ekonomi."
        },
        {
          "id": "smp7-ips-s1-b2",
          "judul": "Bab 2: Keberagaman Lingkungan Sekitar",
          "subBab": [
            "Berkenalan dengan Lingkungan Sekitar (Alam dan Masyarakat)",
            "Pembiasaan Diri untuk Melestarikan Lingkungan (Udara, Air, Tanah)",
            "Aktivitas Manusia Zaman Praaksara",
            "Pembangunan Berkelanjutan dan Kelangkaan Sumber Daya"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis proses pembentukan lingkungan alam dan masyarakat, kehidupan manusia praaksara, serta menerapkan pembiasaan melestarikan lingkungan dan konsep pembangunan berkelanjutan."
        }
      ],
      "2": [
        {
          "id": "smp7-ips-s2-b3",
          "judul": "Bab 3: Potensi Ekonomi Lingkungan",
          "subBab": [
            "Perubahan Potensi Sumber Daya Alam",
            "Aktivitas Kegiatan Ekonomi (Produksi, Distribusi, Konsumsi)",
            "Permintaan dan Penawaran",
            "Status, Peran Sosial, Diferensiasi dan Stratifikasi Sosial"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis potensi sumber daya alam, mekanisme pasar (permintaan dan penawaran), pelaku kegiatan ekonomi, serta struktur status dan diferensiasi sosial di masyarakat."
        },
        {
          "id": "smp7-ips-s2-b4",
          "judul": "Bab 4: Pemberdayaan Masyarakat",
          "subBab": [
            "Keragaman Sosial Budaya di Masyarakat",
            "Permasalahan Kehidupan Sosial Budaya",
            "Pemberdayaan Masyarakat dan Komunitas Lokal",
            "Uang, Pendapatan, Tabungan, dan Investasi (Literasi Keuangan)"
          ],
          "alokasiSesi": 3,
          "cp": "Mengevaluasi keragaman dan masalah sosial budaya, merumuskan langkah pemberdayaan masyarakat, serta menerapkan literasi keuangan dalam pengelolaan uang, pendapatan, dan tabungan."
        }
      ]
    },
    "ipa": {
      "1": [
        {
          "id": "smp7-ipa-s1-b1",
          "judul": "Bab I: Hakikat Ilmu Sains dan Metode Ilmiah",
          "subBab": [
            "Apa Itu Sains dan Cabang-Cabang Ilmu Sains",
            "Laboratorium IPA dan Aturan Keselamatan Kerja",
            "Merancang Percobaan (Variabel Bebas, Terikat, Kontrol)",
            "Pengukuran (Besaran Pokok, Turunan, Satuan SI)",
            "Pelaporan Hasil Percobaan dan Analisis Data Eksperimen"
          ],
          "alokasiSesi": 3,
          "cp": "Menerapkan metode ilmiah, merancang percobaan mandiri, mematuhi aturan keselamatan laboratorium IPA, serta melakukan pengukuran dan pelaporan data fisis secara presisi."
        },
        {
          "id": "smp7-ipa-s1-b2",
          "judul": "Bab II: Zat dan Perubahannya",
          "subBab": [
            "Wujud Zat dan Model Partikel (Padat, Cair, Gas)",
            "Perubahan Wujud Zat",
            "Perubahan Fisika dan Kimia",
            "Kerapatan Zat (Massa Jenis / Densitas) dan Penerapannya"
          ],
          "alokasiSesi": 3,
          "cp": "Menjelaskan sifat dan wujud zat menggunakan model partikel, membedakan perubahan fisika dan kimia, serta menghitung massa jenis zat dalam penerapannya."
        },
        {
          "id": "smp7-ipa-s1-b3",
          "judul": "Bab III: Suhu, Kalor, dan Pemuaian",
          "subBab": [
            "Suhu dan Pengukurannya (Termometer & Konversi Skala Celcius, Reamur, Fahrenheit, Kelvin)",
            "Kalor dan Perpindahannya (Konduksi, Konveksi, Radiasi, dan Asas Black)",
            "Pemuaian Zat (Pemuaian Panjang, Luas, dan Volume)"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami konsep suhu dan pengukuran termometer, menghitung perpindahan kalor dan azas Black, serta menganalisis fenomena pemuaian zat pada kehidupan sehari-hari."
        },
        {
          "id": "smp7-ipa-s1-b4",
          "judul": "Bab IV: Gerak dan Gaya",
          "subBab": [
            "Gerak Benda (Jarak, Perpindahan, Kelajuan, Kecepatan, GLB, dan GLBB)",
            "Gaya dan Hukum Newton (Hukum I, II, dan III Newton)",
            "Gaya Gesek dan Penerapannya dalam Kehidupan Sehari-hari"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis besaran-besaran kinematika gerak lurus (GLB dan GLBB), serta menerapkan Hukum Newton dan gaya gesek dalam menjelaskan dinamika gerak benda."
        }
      ],
      "2": [
        {
          "id": "smp7-ipa-s2-b5",
          "judul": "Bab V: Klasifikasi Makhluk Hidup",
          "subBab": [
            "Ciri-ciri Makhluk Hidup",
            "Klasifikasi Makhluk Hidup (Sistem 5 Kingdom: Monera, Protista, Fungi, Plantae, Animalia)",
            "Kunci Determinasi dan Kunci Dikotomi"
          ],
          "alokasiSesi": 3,
          "cp": "Mengidentifikasi ciri makhluk hidup, mengklasifikasikan organisme ke dalam 5 kingdom, dan menyusun serta menggunakan kunci determinasi untuk identifikasi spesies."
        },
        {
          "id": "smp7-ipa-s2-b6",
          "judul": "Bab VI: Ekologi dan Keanekaragaman Hayati Indonesia",
          "subBab": [
            "Interaksi dalam Ekosistem (Rantai Makanan, Jaring-Jaring Makanan, Simbiosis, Daur Biogeokimia)",
            "Keanekaragaman Hayati Indonesia (Flora, Fauna Asiatis, Peralihan, Australis)",
            "Pelestarian Lingkungan dan Penanggulangan Pencemaran"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis interaksi antarorganisme dalam ekosistem, kekayaan flora-fauna Nusantara, serta merumuskan aksi nyata pelestarian lingkungan dan pencegahan polusi."
        },
        {
          "id": "smp7-ipa-s2-b7",
          "judul": "Bab VII: Bumi dan Tata Surya",
          "subBab": [
            "Sistem Tata Surya (Karakteristik Matahari, Planet, Asteroid, Komet, Meteor)",
            "Bumi dan Satelitnya (Gerak Rotasi dan Revolusi Bumi serta Bulan)",
            "Fenomena Alam di Bumi (Gerhana Matahari/Bulan, Perubahan Musim, Pasang Surut Air Laut)"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami sistem tata surya, menganalisis pengaruh pergerakan rotasi-revolusi bumi dan bulan terhadap fenomena alam, serta dinamika lapisan bumi."
        }
      ]
    },
    "bing": {
      "1": [
        {
          "id": "smp7-bing-s1-b1",
          "judul": "Chapter 1: About Me",
          "subBab": [
            "Unit 1: Galang from Kalimantan (Greeting, Self-Introduction, and Personal Details)",
            "Unit 2: I Love Fishing (Talking About Hobbies and Personal Interests)",
            "Unit 3: My Friends and I (Describing Physical Features and Personality Traits)"
          ],
          "alokasiSesi": 3,
          "cp": "Interacting, greeting, introducing oneself and peers, and describing personal hobbies and physical appearances using basic English."
        },
        {
          "id": "smp7-bing-s1-b2",
          "judul": "Chapter 2: Culinary and Me",
          "subBab": [
            "Unit 1: My Favorite Food (Talking About Traditional & Modern Food and Drinks)",
            "Unit 2: My Favorite Snack (Describing Taste, Flavors, and Textures)",
            "Unit 3: A Secret Recipe (Cooking Action Verbs, Utensils, and Simple Procedure Text)"
          ],
          "alokasiSesi": 3,
          "cp": "Expressing culinary preferences, describing tastes and textures, and composing simple sequential procedure texts (recipes)."
        },
        {
          "id": "smp7-bing-s1-b3",
          "judul": "Chapter 3: Home Sweet Home",
          "subBab": [
            "Unit 1: My House (Rooms in the House and Household Items)",
            "Unit 2: My House Chores (Daily Cleaning Activities and Household Responsibilities)",
            "Unit 3: Let’s Clean Up! (Prepositions of Place, Imperative Instructions, and House Rules)"
          ],
          "alokasiSesi": 3,
          "cp": "Describing rooms and furniture, discussing daily domestic chores, and giving clear instructions using prepositions of place."
        }
      ],
      "2": [
        {
          "id": "smp7-bing-s2-b4",
          "judul": "Chapter 4: My School Activities",
          "subBab": [
            "Unit 1: My Class Schedule (School Subjects, Days, and Class Timetables)",
            "Unit 2: My Online Class (Online Class Rules, Netiquette, and Virtual Learning)",
            "Unit 3: My Study Habits (Effective Learning Tips, Routines, and Habits)"
          ],
          "alokasiSesi": 3,
          "cp": "Discussing school timetables, class subjects, study routines, and expressing effective learning strategies in English."
        },
        {
          "id": "smp7-bing-s2-b5",
          "judul": "Chapter 5: This is My School",
          "subBab": [
            "Unit 1: School Buildings (Directions and School Campus Facilities)",
            "Unit 2: Extracurricular Activities (After-School Clubs, Schedules, and Hobbies)",
            "Unit 3: School Festival (Special Events, School Festivities, and Event Invitations)"
          ],
          "alokasiSesi": 3,
          "cp": "Asking for and giving directions around school, describing extracurricular activities, and producing written event invitations."
        }
      ]
    },
    "bind": {
      "1": [
        {
          "id": "smp7-bind-s1-b1",
          "judul": "Bab I: Jelajah Nusantara",
          "subBab": [
            "Fokus Teks Deskripsi: Memahami Fungsi dan Ciri Objek (Keindahan Alam, Tempat Wisata, Kuliner Khas)",
            "Menganalisis Unsur Kebahasaan Teks Deskripsi (Kata Konkret, Kalimat Perincian, Citraan Panca Indra)",
            "Menganalisis Teks dalam Sajian Visual/Infografik, Menyunting, dan Menyajikan Teks Deskripsi Sederhana"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami dan menganalisis informasi teks deskripsi, menelaah kaidah kebahasaan cerapan pancaindra, serta menyajikan teks deskripsi tertulis dan lisan."
        },
        {
          "id": "smp7-bind-s1-b2",
          "judul": "Bab II: Berkelana di Dunia Imajinasi",
          "subBab": [
            "Menikmati dan Memahami Nilai-Nilai Puisi Rakyat (Pantun, Gurindam, Syair)",
            "Unsur Pembangun Teks Cerita Fantasi/Naratif (Alur, Tokoh, Latar, Keajaiban, dan Tema)",
            "Menulis Cerita Fantasi Orisinal Menggunakan Majas Metafora, Personifikasi, dan Sarkasme"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis rima dan pesan moral puisi rakyat, membedah struktur cerita fantasi, serta menggubah teks narasi imajinatif orisinal."
        },
        {
          "id": "smp7-bind-s1-b3",
          "judul": "Bab III: Hal yang Baik bagi Tubuh",
          "subBab": [
            "Fokus Teks Prosedur: Mengenali Ciri, Tujuan, dan Ragam Teks Prosedur (Resep Sehat, Tips Olahraga)",
            "Struktur Teks Prosedur (Tujuan, Alat/Bahan, Langkah, Penutup) dan Kaidah Bahasa (Kalimat Perintah, Ajakan, Batasan)",
            "Membaca Infografik Pola Hidup Sehat dan Menyusun Teks Prosedur Bertahap secara Sistematis"
          ],
          "alokasiSesi": 3,
          "cp": "Mengidentifikasi tujuan dan struktur teks prosedur, menelaah kalimat imperatif dan batasan, serta merancang teks prosedur bertahap yang aplikatif."
        }
      ],
      "2": [
        {
          "id": "smp7-bind-s2-b4",
          "judul": "Bab IV: Aksi Nyata para Pelindung Bumi",
          "subBab": [
            "Fokus Teks Persuasi dan Berita Lingkungan Hidup",
            "Membedakan Fakta dan Opini serta Menganalisis Unsur 5W+1H (Adiksimba) dalam Berita",
            "Menulis Teks Berita dan Artikel Persuasi Lingkungan yang Berimbang dan Mengajak Aksi Nyata"
          ],
          "alokasiSesi": 3,
          "cp": "Mengevaluasi akurasi fakta dan opini dalam teks berita lingkungan hidup, serta menulis teks persuasi yang memotivasi kepedulian ekologis."
        },
        {
          "id": "smp7-bind-s2-b5",
          "judul": "Bab V: Membuka Gerbang Dunia",
          "subBab": [
            "Mengenal Buku Bergambar (Picture Book) dan Membedah Ragam Pustaka Fiksi/Nonfiksi",
            "Menganalisis Bagian-Bagian Buku (Cover, Hak Cipta, Daftar Isi, Glosarium, Indeks)",
            "Menyusun Teks Tanggapan Kritis terhadap Karya Visual dan Buku Bacaan secara Santun"
          ],
          "alokasiSesi": 3,
          "cp": "Menanggapi karya visual dan buku bergambar, membedah unsur anatomi buku fiksi/nonfiksi, serta menyusun resensi/tanggapan kritis."
        },
        {
          "id": "smp7-bind-s2-b6",
          "judul": "Bab VI: Sampaikan Melalui Surat",
          "subBab": [
            "Mengenal Surat Pribadi: Struktur, Karakter Bahasa Hangat, dan Etika Berkirim Surat",
            "Mengenal Surat Resmi / Dinas: Kepala Surat, Nomor, Lampiran, Bahasa Baku, dan Cap Resmi",
            "Menulis Surat Pribadi dan Surat Resmi untuk Berbagai Keperluan Komunikasi Tertulis"
          ],
          "alokasiSesi": 3,
          "cp": "Membandingkan unsur kebahasaan surat pribadi dan dinas, serta menulis surat formal maupun personal sesuai etika korespondensi."
        }
      ]
    },
    "mtk": {
      "1": [
        {
          "id": "smp7-mtk-s1-b1",
          "judul": "Bab 1: Bilangan Bulat",
          "subBab": [
            "Memahami Bilangan Bulat Positif dan Negatif pada Garis Bilangan",
            "Operasi Hitung Bilangan Bulat (Penjumlahan, Pengurangan, Perkalian, Pembagian)",
            "Faktor Bilangan Bulat, FPB, KPK, dan Penyelesaian Masalah Kontekstual"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami representasi bilangan bulat pada garis bilangan, melakukan operasi aritmetika bilangan bulat, serta memecahkan masalah kontekstual FPB dan KPK."
        },
        {
          "id": "smp7-mtk-s1-b2",
          "judul": "Bab 2: Bilangan Rasional",
          "subBab": [
            "Memahami Bentuk Bilangan Rasional (Pecahan dan Desimal)",
            "Membandingkan dan Mengurutkan Bilangan Rasional",
            "Operasi Hitung Bilangan Rasional (Penjumlahan, Pengurangan, Perkalian, Pembagian)"
          ],
          "alokasiSesi": 3,
          "cp": "Menyatakan bilangan rasional dalam representasi pecahan dan desimal, membandingkan nilainya, dan melakukan operasi hitung secara terampil."
        },
        {
          "id": "smp7-mtk-s1-b3",
          "judul": "Bab 3: Rasio",
          "subBab": [
            "Konsep Rasio dan Perbandingan Seharga",
            "Penerapan Skala pada Peta dan Denah Gambar",
            "Laju Perubahan Satuan (Kecepatan, Debit, dan Efisiensi Konsumsi)"
          ],
          "alokasiSesi": 3,
          "cp": "Menerapkan konsep rasio perbandingan seharga, skala peta, dan laju perubahan satuan dalam menyelesaikan masalah praktis kehidupan sehari-hari."
        },
        {
          "id": "smp7-mtk-s1-b4",
          "judul": "Bab 4: Bentuk Aljabar",
          "subBab": [
            "Unsur-Unsur Bentuk Aljabar (Variabel, Koefisien, Konstanta, dan Suku)",
            "Sifat dan Operasi Aljabar (Penjumlahan, Pengurangan, Perkalian Suku)",
            "Pemodelan Matematika Menggunakan Bentuk Aljabar"
          ],
          "alokasiSesi": 3,
          "cp": "Menginterpretasikan unsur-unsur aljabar, melakukan operasi hitung aljabar suku sejenis, serta menyusun model matematika dari masalah kontekstual."
        }
      ],
      "2": [
        {
          "id": "smp7-mtk-s2-b5",
          "judul": "Bab 5: Kesebangunan",
          "subBab": [
            "Hubungan Antarsudut (Berpelurus, Berpenyiku, Bertolak Belakang, Sehadap, Berseberangan)",
            "Arti Kesebangunan pada Bangun Datar",
            "Kesebangunan pada Segitiga dan Proporsi Ukuran Geometri"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis relasi sudut-sudut dan menerapkan kriteria kesebangunan bangun datar khususnya segitiga dalam pemecahan masalah geometri."
        },
        {
          "id": "smp7-mtk-s2-b6",
          "judul": "Bab 6: Data dan Diagram (Statistika)",
          "subBab": [
            "Investigasi Statistika dan Macam-Macam Data",
            "Penyajian Data: Diagram Batang, Diagram Garis, dan Diagram Lingkaran",
            "Memilih dan Menginterpretasikan Diagram yang Tepat"
          ],
          "alokasiSesi": 3,
          "cp": "Mengumpulkan data statistika, menyajikannya dalam diagram batang, garis, atau lingkaran, serta menginterpretasikan informasi untuk pengambilan keputusan."
        },
        {
          "id": "smp7-mtk-s2-b7",
          "judul": "Bab 7: Bangun Datar & Bangun Ruang (Pengayaan)",
          "subBab": [
            "Luas dan Keliling Bangun Datar Gabungan",
            "Sifat-Sifat dan Jaring-Jaring Bangun Ruang (Prisma, Limas)",
            "Menghitung Luas Permukaan dan Volume Bangun Ruang Sederhana"
          ],
          "alokasiSesi": 3,
          "cp": "Mendalami perhitungan keliling-luas bangun datar serta menganalisis sifat jaring-jaring, luas permukaan, dan volume bangun ruang."
        }
      ]
    }
  },
  "8": {
    "ips": {
      "1": [
        {
          "id": "smp8-ips-s1-b1",
          "judul": "Bab 1: Kondisi Geografis dan Pelestarian Sumber Daya Alam",
          "subBab": [
            "Keragaman Alam Indonesia (Letak Astronomis, Geografis, Geologis)",
            "Pemanfaatan Sumber Daya Alam (Hutan, Tambang, Kelautan)",
            "Sumber Daya Manusia (Kualitas, Kuantitas, dan Peningkatan Mutu)",
            "Peran Lembaga Sosial dalam Pemanfaatan SDA dan SDM",
            "Interaksi dengan Bangsa Asing di Masa Lalu (Masa Hindu-Buddha)"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis pengaruh letak geografis terhadap potensi SDA dan SDM, peran lembaga sosial, serta interaksi kebudayaan pada masa Hindu-Buddha."
        },
        {
          "id": "smp8-ips-s1-b2",
          "judul": "Bab 2: Kemajemukan Masyarakat Indonesia",
          "subBab": [
            "Keragaman Aktivitas Ekonomi Masyarakat (Zonasi Junghuhn & Sektor)",
            "Mobilitas Sosial (Bentuk, Saluran, Dampak) dan Dinamika Kependudukan",
            "Interaksi Budaya pada Masa Kerajaan-Kerajaan Islam Nusantara"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis keragaman aktivitas ekonomi masyarakat, bentuk saluran mobilitas sosial, serta pengaruh interaksi budaya masa kerajaan Islam di Indonesia."
        }
      ],
      "2": [
        {
          "id": "smp8-ips-s2-b3",
          "judul": "Bab 3: Nasionalisme dan Jati Diri Bangsa",
          "subBab": [
            "Penjelajahan Samudra, Kolonialisme, dan Imperialisme di Indonesia",
            "Pergerakan Kebangsaan Menuju Kemerdekaan (Budi Utomo, Sumpah Pemuda 1928)",
            "Pemerataan Pembangunan dan Peran Lembaga Keuangan",
            "Konflik dan Integrasi Sosial dalam Bingkai Kebangsaan"
          ],
          "alokasiSesi": 3,
          "cp": "Merekonstruksi sejarah perjuangan bangsa menghadapi kolonialisme, peran pemuda menuju kemerdekaan, integrasi sosial, dan pemerataan pembangunan."
        },
        {
          "id": "smp8-ips-s2-b4",
          "judul": "Bab 4: Pembangunan Perekonomian Indonesia",
          "subBab": [
            "Materi Lanjutan Mengenai Perekonomian dan Pembangunan Nasional",
            "Perdagangan Internasional, Ekspor-Impor, dan Neraca Perdagangan",
            "Kebijakan Kurs Valuta Asing dan Perlindungan Pasar Domestik",
            "Transformasi Pembangunan Ekonomi Menuju Indonesia Emas"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis sistem perekonomian nasional, perdagangan luar negeri (ekspor-impor), kebijakan kurs, serta arah pembangunan ekonomi jangka panjang."
        }
      ]
    },
    "ipa": {
      "1": [
        {
          "id": "smp8-ipa-s1-b1",
          "judul": "Bab I: Struktur dan Fungsi Tubuh Makhluk Hidup (Bagian I)",
          "subBab": [
            "Makanan dan Nutrisi (Karbohidrat, Protein, Lemak, Vitamin, Mineral, dan Uji Nutrisi)",
            "Sistem Pencernaan Manusia (Saluran Cerna, Enzim, dan Gangguan Sistem Pencernaan)",
            "Sistem Peredaran Darah Manusia (Jantung, Pembuluh Darah, Komposisi Darah, Golongan Darah, dan Penyakit Sirkulasi)"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis keterkaitan nutrisi makanan, mekanisme organ pencernaan dan peredaran darah, serta menjaga kesehatan sistem organ sirkulasi."
        },
        {
          "id": "smp8-ipa-s1-b2",
          "judul": "Bab II: Struktur dan Fungsi Tubuh Makhluk Hidup (Bagian II)",
          "subBab": [
            "Sistem Pernapasan (Organ Pernapasan, Mekanisme Dada & Perut, serta Volume Udara)",
            "Sistem Ekskresi (Ginjal dan Pembentukan Urine, Kulit, Paru-paru, Hati, serta Gangguan Ekskresi)"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami mekanisme fisiologis pernapasan dan ekskresi manusia dalam mempertahankan homeostasis dan membuang sisa metabolisme tubuh."
        },
        {
          "id": "smp8-ipa-s1-b3",
          "judul": "Bab III: Usaha, Energi, dan Pesawat Sederhana",
          "subBab": [
            "Usaha dan Energi (Energi Kinetik, Potensial, Mekanik, dan Hukum Kekekalan Energi)",
            "Pesawat Sederhana: Tuas / Pengungkit (Jenis 1, 2, dan 3)",
            "Pesawat Sederhana: Bidang Miring, Katrol (Tetap, Bebas, Majemuk), dan Roda Berporos",
            "Perhitungan Keuntungan Mekanis Pesawat Sederhana dalam Kehidupan Sehari-hari"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis konsep usaha dan perubahan energi, serta menghitung keuntungan mekanis berbagai jenis pesawat sederhana dalam meringankan pekerjaan."
        },
        {
          "id": "smp8-ipa-s1-b4",
          "judul": "Bab IV: Getaran, Gelombang, dan Cahaya",
          "subBab": [
            "Getaran (Periode, Frekuensi, dan Amplitudo Ayunan / Pegas)",
            "Gelombang (Gelombang Transversal, Longitudinal, Cepat Rambat, dan Fenomena Gelombang Bunyi)",
            "Cahaya dan Alat Optik (Cermin Datar/Cekung/Cembung, Lensa, Mata, Kacamata, Lup, dan Mikroskop)"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami konsep getaran dan gelombang bunyi, serta menerapkan hukum pemantulan-pembiasan cahaya pada cermin, lensa, dan instrumen optik."
        }
      ],
      "2": [
        {
          "id": "smp8-ipa-s2-b5",
          "judul": "Bab V: Unsur, Senyawa, dan Campuran",
          "subBab": [
            "Unsur (Logam, Nonlogam, Metaloid, dan Penulisan Lambang Unsur)",
            "Senyawa (Sifat, Pembentukan, dan Rumus Kimia Sederhana)",
            "Campuran (Campuran Homogen/Larutan dan Campuran Heterogen/Koloid, Suspensi)"
          ],
          "alokasiSesi": 3,
          "cp": "Mengelompokkan zat berdasarkan sifat dan komposisinya ke dalam unsur, senyawa, dan campuran serta membedakan karakteristiknya."
        },
        {
          "id": "smp8-ipa-s2-b6",
          "judul": "Bab VI: Pemisahan Campuran di Sekitar Kita",
          "subBab": [
            "Metode Pemisahan Campuran: Filtrasi (Penyaringan), Sentrifugasi, dan Kristalisasi",
            "Metode Pemisahan Campuran: Distilasi (Penyulingan), Sublimasi, dan Kromatografi",
            "Penerapan Pemisahan Campuran dalam Kehidupan Sehari-hari (Penjernihan Air Bersih, Pembuatan Garam)"
          ],
          "alokasiSesi": 3,
          "cp": "Menelaah dan mempraktikkan berbagai metode pemisahan campuran fisika-kimia untuk memecahkan persoalan air bersih dan lingkungan."
        },
        {
          "id": "smp8-ipa-s2-b7",
          "judul": "Bab VII: Konservasi Tanah dan Lingkungan",
          "subBab": [
            "Pembentukan Tanah dan Lapisan Profil Tanah (Horison Tanah)",
            "Peran Organisme Tanah bagi Kesuburan dan Siklus Nutrisi Ekosistem",
            "Faktor Kerusakan Tanah (Erosi, Deforestasi, Kontaminasi Limbah)",
            "Upaya Konservasi Tanah dan Pelestarian Lingkungan Berkelanjutan"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis lapisan dan organisme tanah, faktor degradasi lahan, serta merumuskan strategi konservasi tanah untuk ketahanan lingkungan."
        }
      ]
    },
    "bing": {
      "1": [
        {
          "id": "smp8-bing-s1-b1",
          "judul": "Chapter 1: Celebrating Independence Day",
          "subBab": [
            "Unit 1: The Champion of Panjat Pinang (Recount Text on Independence Day Traditions)",
            "Unit 2: Going to a Parade (Costumes, Marching Bands, and Joyful Experiences)",
            "Unit 3: Independence Day at SMP Merdeka (School Event Recount and Past Tense Verbs)"
          ],
          "alokasiSesi": 3,
          "cp": "Comprehending and producing personal recount texts about national holiday celebrations using past tense forms."
        },
        {
          "id": "smp8-bing-s1-b2",
          "judul": "Chapter 2: Kindness Begins with Me",
          "subBab": [
            "Unit 1: Kindness towards Differences (Empathy, Cultural Inclusivity, and Respect)",
            "Unit 2: Kindness and Happiness (Analyzing Narrative Fables and Moral Values)",
            "Unit 3: Kindness and Friendship (Helping Peers and Showing Gratitude in Daily Life)"
          ],
          "alokasiSesi": 3,
          "cp": "Reading and analyzing moral values in narrative stories, and demonstrating kindness and mutual respect through spoken and written English."
        },
        {
          "id": "smp8-bing-s1-b3",
          "judul": "Chapter 3: Love Our World",
          "subBab": [
            "Unit 1: Look Around You (Identifying Local Environmental Issues and Plastic Waste)",
            "Unit 2: This is the Way (Practical Ways to Conserve Energy and Clean Water)",
            "Unit 3: Act Now (Creating Persuasive Slogans, Posters, and Green Action Campaigns)"
          ],
          "alokasiSesi": 3,
          "cp": "Expressing awareness on environmental preservation, designing informative slogans, and advocating eco-friendly practices."
        }
      ],
      "2": [
        {
          "id": "smp8-bing-s2-b4",
          "judul": "Chapter 4: No Littering",
          "subBab": [
            "Unit 1: Did It Rain Last Night (Weather Conditions, Rain, and Flood Awareness)",
            "Unit 2: What Happened to the Sea Animals (Marine Ecosystems and Plastic Pollution)",
            "Unit 3: You Can Help (Organizing Waste Clean-Up and Basic Passive Voice in Simple Past)"
          ],
          "alokasiSesi": 3,
          "cp": "Understanding environmental cause and effect relationships and writing factual reports using basic passive voice structures."
        },
        {
          "id": "smp8-bing-s2-b5",
          "judul": "Chapter 5: Embrace Yourself",
          "subBab": [
            "Unit 1: Be Yourself (Overcoming Insecurity, Positive Self-Image, and Self-Worth)",
            "Unit 2: I Know I Can Do It (Expressing Abilities, Confidence, and Growth Mindset)",
            "Unit 3: Practice Makes Perfect (Showcasing Talents, Hobbies, and Continuous Improvement)"
          ],
          "alokasiSesi": 3,
          "cp": "Articulating personal strengths and confidence, sharing hobbies, and discussing personal growth in English."
        }
      ]
    },
    "bind": {
      "1": [
        {
          "id": "smp8-bind-s1-b1",
          "judul": "Bab I: Menulis Teks Laporan Hasil Observasi (LHO)",
          "subBab": [
            "Ciri dan Karakter Teks Laporan Berdasarkan Pengamatan Fenomena Alam atau Sosial",
            "Struktur Teks LHO: Definisi Umum, Deskripsi Bagian, dan Deskripsi Manfaat",
            "Penggunaan Data Pendukung Ilmiah, Istilah Teknis, dan Kalimat Definisi/Deskripsi",
            "Menulis Teks LHO secara Sistematis Berdasarkan Pengamatan Lapangan Langsung"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis struktur dan ciri kebahasaan teks laporan hasil observasi (LHO) serta menyusun laporan berbasis data faktual."
        },
        {
          "id": "smp8-bind-s1-b2",
          "judul": "Bab II: Menulis Iklan dan Slogan",
          "subBab": [
            "Fokus Teks Persuasif: Menelaah Ragam Iklan Komersial, Layanan Masyarakat, dan Slogan",
            "Menyimpulkan Pesan Iklan, Membuat Slogan Padat Makna, dan Poster Edukasi",
            "Kaidah Kebahasaan Iklan: Kalimat Persuasif, Imperatif, Berima, dan Singkat-Padat",
            "Membuat Iklan Sederhana dengan Mempertimbangkan Unsur Visual dan Bahasa yang Menarik"
          ],
          "alokasiSesi": 3,
          "cp": "Menyimpulkan pesan persuasif dalam iklan dan slogan, serta merancang media promosi visual yang kreatif dan efektif."
        },
        {
          "id": "smp8-bind-s1-b3",
          "judul": "Bab III: Menulis Artikel Ilmiah Populer",
          "subBab": [
            "Karakteristik Artikel Ilmiah Populer: Memadukan Data Ilmiah dengan Bahasa Populer",
            "Membedakan Fakta Ilmiah dan Opini Penulis secara Kritis",
            "Teknik Penulisan: Analogi, Perbandingan, Antonim-Sinonim, dan Kosakata Baku",
            "Menulis Artikel Ilmiah Populer yang Faktual, Menarik, dan Mudah Dipahami Khalayak"
          ],
          "alokasiSesi": 3,
          "cp": "Membedakan fakta dan opini dalam artikel ilmiah populer, serta menyusun artikel berbasis bukti dengan bahasa komunikatif."
        }
      ],
      "2": [
        {
          "id": "smp8-bind-s2-b4",
          "judul": "Bab IV: Mengulas Karya Fiksi",
          "subBab": [
            "Fokus Teks Ulasan/Resensi: Menilai Karya Fiksi (Novel, Cerpen, Buku Komik)",
            "Unsur Intrinsik Karya Fiksi: Tema, Karakter Tokoh, Alur, Latar, dan Sudut Pandang",
            "Membedakan Makna Denotasi dan Konotasi dalam Teks Narasi Sastra",
            "Menulis Resensi Karya Fiksi yang Berimbang, Objektif, dan Santun"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis karya sastra fiksi secara komprehensif dan menyusun teks ulasan/resensi berbobot dengan bahasa santun."
        },
        {
          "id": "smp8-bind-s2-b5",
          "judul": "Bab V: Menciptakan Puisi",
          "subBab": [
            "Mengenal Jenis dan Struktur Puisi: Membedakan Puisi Diafan dan Puisi Prismatis",
            "Unsur Pembangun Puisi: Bait, Larik, Rima, Diksi, dan Menemukan Pesan/Amanat",
            "Eksplorasi Gaya Bahasa / Majas: Metafora, Simile, Personifikasi, dan Repetisi",
            "Menciptakan Puisi Orisinal dan Mendeklamasikannya dengan Ekspresi serta Intonasi Tepat"
          ],
          "alokasiSesi": 3,
          "cp": "Menelaah jenis dan unsur pembangun puisi, mengeksplorasi majas ekspresif, serta menggubah dan menampilkan puisi orisinal."
        },
        {
          "id": "smp8-bind-s2-b6",
          "judul": "Bab VI: Menulis Teks Pidato",
          "subBab": [
            "Fokus Teks Pidato Persuasif: Mengenal Tujuan dan Audiens Pembicara",
            "Mengenali Struktur Teks Pidato: Pembukaan, Isi/Argumen Bertahap, dan Penutup",
            "Kaidah Kebahasaan Pidato: Kalimat Persuasif, Kosakata Emotif, dan Etika Komunikasi",
            "Menyusun Naskah Pidato Persuasif dan Menyampaikannya dengan Penuh Percaya Diri"
          ],
          "alokasiSesi": 3,
          "cp": "Menyusun struktur naskah pidato persuasif yang runtut dan menyampaikan gagasan secara lisan di depan umum dengan lugas."
        }
      ]
    },
    "mtk": {
      "1": [
        {
          "id": "smp8-mtk-s1-b1",
          "judul": "Bab 1: Bilangan Berpangkat",
          "subBab": [
            "Konsep Bilangan Berpangkat Bulat Positif, Negatif, dan Nol",
            "Sifat-Sifat Operasi Hitung Bilangan Berpangkat (Perkalian, Pembagian, Pemangkatan)",
            "Bilangan Bentuk Akar dan Operasi Aljabar Bentuk Akar",
            "Penulisan Bentuk Baku (Notasi Ilmiah) untuk Angka Sangat Besar dan Sangat Kecil"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami bilangan berpangkat dan bentuk akar, melakukan manipulasi aljabar, serta menerapkan notasi ilmiah dalam konteks numerik."
        },
        {
          "id": "smp8-mtk-s1-b2",
          "judul": "Bab 2: Teorema Pythagoras",
          "subBab": [
            "Menemukan dan Membuktikan Konsep Teorema Pythagoras",
            "Mengenal dan Menentukan Kelompok Bilangan Tripel Pythagoras",
            "Menghitung Sisi Segitiga Khusus / Istimewa (Sudut 30°-60°-90° dan 45°-45°-90°)",
            "Penerapan Teorema Pythagoras dalam Pemecahan Masalah Geometri dan Kehidupan Nyata"
          ],
          "alokasiSesi": 3,
          "cp": "Membuktikan rumus Pythagoras, menentukan tripel Pythagoras, dan menghitung jarak atau ketinggian dalam permasalahan nyata."
        },
        {
          "id": "smp8-mtk-s1-b3",
          "judul": "Bab 3: Persamaan dan Pertidaksamaan Linear Satu Variabel",
          "subBab": [
            "Konsep dan Penyelesaian Persamaan Linear Satu Variabel (PLSV)",
            "Konsep dan Penyelesaian Pertidaksamaan Linear Satu Variabel (PtLSV)",
            "Penyajian Himpunan Penyelesaian pada Garis Bilangan",
            "Pemodelan Masalah Nyata Menggunakan Konsep PLSV dan PtLSV"
          ],
          "alokasiSesi": 3,
          "cp": "Menyelesaikan persamaan dan pertidaksamaan linear satu variabel serta menerapkan pemodelan aljabar dalam pemecahan masalah."
        }
      ],
      "2": [
        {
          "id": "smp8-mtk-s2-b4",
          "judul": "Bab 4: Relasi dan Fungsi",
          "subBab": [
            "Memahami Konsep Relasi dan Tiga Cara Penyajiannya (Diagram Panah, Pasangan Berurutan, Diagram Kartesius)",
            "Memahami Konsep Fungsi (Pemetaan): Domain (Daerah Asal), Kodomain (Daerah Kawan), dan Range (Daerah Hasil)",
            "Notasi Fungsi, Nilai Fungsi, dan Pemahaman Korespondensi Satu-Satu (Pengayaan)"
          ],
          "alokasiSesi": 3,
          "cp": "Membedakan relasi dan fungsi, menyajikan fungsi, serta menghitung nilai fungsi linear dan korespondensi satu-satu."
        },
        {
          "id": "smp8-mtk-s2-b5",
          "judul": "Bab 5: Persamaan Garis Lurus",
          "subBab": [
            "Menggambar Grafik Persamaan Garis Lurus pada Bidang Kartesius",
            "Pengertian dan Perhitungan Kemiringan Garis (Gradien)",
            "Menentukan Persamaan Garis melalui Titik dan Gradien Tertentu",
            "Penerapan Persamaan Garis Lurus dalam Kehidupan Nyata (Laju Perubahan Konstan)"
          ],
          "alokasiSesi": 3,
          "cp": "Menghitung gradien garis, melukis grafik persamaan garis lurus, dan memformulasikan persamaan garis lurus dalam berbagai kondisi."
        },
        {
          "id": "smp8-mtk-s2-b6",
          "judul": "Bab 6: Statistika",
          "subBab": [
            "Ukuran Pemusatan Data Tunggal: Menghitung Mean (Nilai Rata-Rata)",
            "Ukuran Pemusatan Data Tunggal: Menentukan Median (Nilai Tengah) dan Modus",
            "Ukuran Penyebaran Data: Jangkauan (Range), Kuartil (Q1, Q2, Q3), dan Jangkauan Interkuartil",
            "Menganalisis dan Membandingkan Kumpulan Data untuk Menarik Kesimpulan yang Tepat"
          ],
          "alokasiSesi": 3,
          "cp": "Menentukan ukuran pemusatan dan penyebaran data tunggal serta menganalisis sebaran data dalam pengambilan kesimpulan statistika."
        }
      ]
    }
  },
  "9": {
    "ips": {
      "1": [
        {
          "id": "smp9-ips-s1-b1",
          "judul": "Bab 1: Manusia dan Perubahan",
          "subBab": [
            "Perubahan Sosial dan Modernisasi di Indonesia",
            "Dampak Globalisasi dalam Kehidupan (Cultural Shock dan Cultural Lag)",
            "Pelestarian Kearifan Lokal Nusantara Menghadapi Modernitas",
            "Karakteristik Fisik, Demografi, dan Letak Geografis 6 Benua di Dunia"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis dinamika perubahan sosial budaya dan globalisasi, strategi pelestarian kearifan lokal, serta letak geografis dan karakteristik demografi antarbenua."
        },
        {
          "id": "smp9-ips-s1-b2",
          "judul": "Bab 2: Perkembangan Ekonomi Digital",
          "subBab": [
            "Peran Uang (Kartal, Giral, dan Elektronik) dan Lembaga Keuangan (Bank & LKBB)",
            "Sistem Pembayaran Digital Modern (QRIS, BI-FAST, dan Dompet Digital)",
            "Perdagangan Era Digital: Model Bisnis E-Commerce (B2B, B2C, C2C)",
            "Literasi Finansial dan Keamanan Transaksi Finansial Digital"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis evolusi uang, peran perbankan dan LKBB, sistem pembayaran digital QRIS, model bisnis e-commerce, serta literasi keamanan keuangan digital."
        }
      ],
      "2": [
        {
          "id": "smp9-ips-s2-b3",
          "judul": "Bab 3: Tantangan Pembangunan Indonesia",
          "subBab": [
            "Lintasan Sejarah Pembangunan RI (Kemerdekaan, Demokrasi Parlementer/Terpimpin, Orba, hingga Reformasi)",
            "Ketergantungan Antarruang dan Deklarasi Djuanda 1957 sebagai Tonggak Geopolitik",
            "Tolok Ukur Kemajuan Ekonomi Nasional: PDB, Indeks Gini, dan Indeks Pembangunan Manusia (IPM)",
            "Karakteristik Perbedaan Negara Maju dan Negara Berkembang"
          ],
          "alokasiSesi": 3,
          "cp": "Merekonstruksi sejarah kebijakan pembangunan nasional, menganalisis tolok ukur kemajuan ekonomi (PDB, IPM, Gini), serta mengevaluasi perbedaan negara maju vs berkembang."
        },
        {
          "id": "smp9-ips-s2-b4",
          "judul": "Bab 4: Kerja Sama Dunia",
          "subBab": [
            "Bentuk Kerja Sama Internasional (Bilateral, Regional ASEAN/APEC, Multilateral PBB/G20)",
            "Peran Aktif Indonesia: Pasukan Garuda dan Diplomasi Warisan Budaya UNESCO",
            "17 Tujuan Pembangunan Berkelanjutan (Sustainable Development Goals / SDGs 2030)"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis bentuk kerja sama internasional, kontribusi aktif Indonesia dalam menjaga perdamaian dunia, serta perwujudan 17 target SDGs 2030."
        },
        {
          "id": "smp9-ips-s2-b5",
          "judul": "Bab 5: Ekonomi Kreatif dan Pembangunan Nasional",
          "subBab": [
            "Hak Kekayaan Intelektual (HaKI) dan Potensi 17 Subsektor Industri Kreatif",
            "Pusat-Pusat Keunggulan Ekonomi Nasional (PT Freeport, Kilang Balongan/Cilacap, Kerajinan Batik)",
            "Integrasi Pasar Bebas Internasional: MEA, AFTA, dan RCEP"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis potensi 17 subsektor ekonomi kreatif, perlindungan HaKI, peran pusat keunggulan ekonomi, serta strategi menghadapi integrasi pasar bebas."
        }
      ]
    },
    "ipa": {
      "1": [
        {
          "id": "smp9-ipa-s1-b1",
          "judul": "Bab 1: Pertumbuhan dan Perkembangan",
          "subBab": [
            "Pertumbuhan dan Perkembangan Manusia (Fase Embrionik, Balita, Remaja/Pubertas, Dewasa, Lansia)",
            "Pertumbuhan dan Perkembangan Hewan (Metamorfosis Sempurna, Tidak Sempurna, dan Regenerasi)",
            "Pertumbuhan dan Perkembangan Tumbuhan (Perkecambahan, Pertumbuhan Primer/Sekunder, Faktor Internal & Eksternal)"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis faktor-faktor internal dan eksternal yang mempengaruhi proses pertumbuhan dan perkembangan makhluk hidup."
        },
        {
          "id": "smp9-ipa-s1-b2",
          "judul": "Bab 2: Sistem Koordinasi, Reproduksi, dan Homeostasis Manusia",
          "subBab": [
            "Sistem Koordinasi Manusia (Neuron, Sistem Saraf Pusat/Tepi, dan Sistem Panca Indra)",
            "Sistem Reproduksi Manusia (Struktur Organ Pria/Wanita, Gametogenesis, Menstruasi, Fertilisasi)",
            "Homeostasis Tubuh (Termoregulasi Suhu, Keseimbangan Cairan Osmoregulasi, dan Kadar Gula Darah)"
          ],
          "alokasiSesi": 3,
          "cp": "Memahami mekanisme sistem saraf, panca indra, dan sistem reproduksi manusia, serta prinsip kerja homeostasis dalam menjaga stabilitas tubuh."
        },
        {
          "id": "smp9-ipa-s1-b3",
          "judul": "Bab 3: Tekanan",
          "subBab": [
            "Tekanan Zat Padat (P = F / A) dan Penerapannya",
            "Tekanan Zat Cair: Tekanan Hidrostatis (P = rho x g x h) dan Bejana Berhubungan",
            "Hukum Pascal dan Penerapannya pada Pompa Hidrolik",
            "Hukum Archimedes (Benda Terapung, Melayang, Tenggelam, dan Gaya Apung)",
            "Tekanan Gas / Udara (Hukum Boyle, Barometer, dan Tekanan Atmosfer)"
          ],
          "alokasiSesi": 3,
          "cp": "Menerapkan prinsip fluida statis dan dinamis (Tekanan Zat Padat, Hidrostatis, Hukum Pascal, Archimedes, dan Boyle) dalam teknologi."
        },
        {
          "id": "smp9-ipa-s1-b4",
          "judul": "Bab 4: Listrik, Magnet, dan Sumber Energi Alternatif",
          "subBab": [
            "Listrik Statis dan Dinamis (Muatan, Hukum Coulomb, Arus, Hambatan Kawat, Hukum Ohm, dan Hukum Kirchhoff)",
            "Rangkaian Listrik Seri, Paralel, serta Perhitungan Daya dan Energi Listrik",
            "Magnet dan Induksi Elektromagnetik (Medan Magnet, Gaya Lorentz, Transformator, dan Generator)",
            "Energi Alternatif / Terbarukan (Tenaga Surya, Angin, Air, Biomassa, dan Konservasi Energi Listrik)"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis konsep kelistrikan, kemagnetan, induksi elektromagnetik, serta pentingnya transisi menuju sumber energi terbarukan."
        }
      ],
      "2": [
        {
          "id": "smp9-ipa-s2-b5",
          "judul": "Bab 5: Reaksi-Reaksi Kimia dan Dinamikanya",
          "subBab": [
            "Konsep Partikel Materi: Atom, Notasi Atom, Molekul Unsur, Molekul Senyawa, dan Ion",
            "Ciri-Ciri Terjadinya Reaksi Kimia di Lingkungan Sekitar",
            "Sifat Asam dan Basa, Identifikasi Indikator pH Alami dan Kertas Lakmus",
            "Energi dan Laju Reaksi Kimia (Reaksi Eksoterm/Endoterm dan Faktor Penentu Laju Reaksi)"
          ],
          "alokasiSesi": 3,
          "cp": "Menjelaskan konsep partikel penyusun materi, mengidentifikasi sifat larutan asam-basa, serta menganalisis dinamika laju reaksi kimia."
        },
        {
          "id": "smp9-ipa-s2-b6",
          "judul": "Bab 6: Pewarisan Sifat dan Bioteknologi",
          "subBab": [
            "Materi Genetik Pembawa Sifat: Kromosom, DNA, dan Gen",
            "Hukum Pewarisan Sifat Mendel: Persilangan Monohibrid dan Dihibrid (Rasio Genotip & Fenotip)",
            "Penerapan Bioteknologi Konvensional (Fermentasi Tempe, Roti, Yoghurt) dan Bioteknologi Modern"
          ],
          "alokasiSesi": 3,
          "cp": "Menerapkan prinsip genetika Hukum Mendel dalam persilangan sifat serta mengevaluasi penerapan bioteknologi bagi kehidupan manusia."
        },
        {
          "id": "smp9-ipa-s2-b7",
          "judul": "Bab 7: Isu-Isu Lingkungan",
          "subBab": [
            "Kesehatan Lingkungan di Indonesia dan Masalah Pengelolaan Limbah",
            "Pemanasan Global (Global Warming), Efek Rumah Kaca, dan Perubahan Iklim",
            "Krisis Energi Global dan Solusi Energi Alternatif Bersih",
            "Ketersediaan Pangan dan Ketahanan Ekologis Nusantara"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis dampak pemanasan global, krisis energi, dan ketahanan pangan, serta merumuskan solusi teknologi ramah lingkungan."
        }
      ]
    },
    "bing": {
      "1": [
        {
          "id": "smp9-bing-s1-b1",
          "judul": "Chapter 1: Exploring Fauna of Indonesia",
          "subBab": [
            "Unit 1: Bekantan (Physical Features, Habitats, Diet, and Conservation Status)",
            "Unit 2: Orangutan and Gorilla (Comparative Factual Report Text)",
            "Unit 3: Indonesian Birds (Cendrawasih, Jalak Bali, and Passive Voice in Present Tense)"
          ],
          "alokasiSesi": 3,
          "cp": "Comprehending and composing factual report texts about Indonesian endemic animals and biodiversity conservation."
        },
        {
          "id": "smp9-bing-s1-b2",
          "judul": "Chapter 2: Taking Trips",
          "subBab": [
            "Fokus pada Recount Text (Menceritakan Pengalaman Perjalanan & Liburan)",
            "Menulis Travel Blog Destinasi Wisata Nusantara (Personal & Historical Recount)",
            "Mengontraskan Past Continuous Tense vs Simple Past Tense untuk Peristiwa Bersamaan"
          ],
          "alokasiSesi": 3,
          "cp": "Reading, comprehending, and producing engaging recount texts about holidays and personal travel experiences."
        }
      ],
      "2": [
        {
          "id": "smp9-bing-s2-b3",
          "judul": "Chapter 3: Journeys to the Fantasy Worlds",
          "subBab": [
            "Fokus pada Narrative Text (Cerita Fantasi, Cerita Rakyat Nusantara, dan Legenda Internasional)",
            "Struktur Naratif: Orientasi, Komplikasi, Klimaks, Resolusi, dan Nilai Moral",
            "Transformasi Kalimat Langsung (Direct Speech) menjadi Kalimat Tak Langsung (Reported Speech)"
          ],
          "alokasiSesi": 3,
          "cp": "Analyzing plot, characterization, and moral messages in narrative fantasy texts, and creating imaginative stories."
        },
        {
          "id": "smp9-bing-s2-b4",
          "judul": "Chapter 4: Upcycling Used Materials",
          "subBab": [
            "Fokus pada Teks Prosedur dan Kesadaran Lingkungan (Upcycling Sampah Plastik & Kardus)",
            "Instruksi Pembuatan Kerajinan Daur Ulang Ramah Lingkungan Langkah demi Langkah",
            "Penggunaan Adverbial Clauses of Purpose (In order to, So that) dan Kalimat Imperatif"
          ],
          "alokasiSesi": 3,
          "cp": "Understanding and writing sequential procedure texts on creative DIY upcycling and environmental stewardship."
        },
        {
          "id": "smp9-bing-s2-b5",
          "judul": "Chapter 5: Digital Life",
          "subBab": [
            "Fokus pada Kehidupan Digital dan Teks Terkait (Algoritma Media Sosial dan Literasi Digital)",
            "Keamanan Berinternet, Bahaya Cyberbullying, dan Deteksi Berita Hoaks (Teks Eksplanasi)",
            "Menyatakan Persetujuan (Agreement), Ketidaksetujuan (Disagreement), dan Opini Berimbang"
          ],
          "alokasiSesi": 3,
          "cp": "Comprehending explanation texts regarding digital technology, and expressing constructive viewpoints on digital well-being."
        }
      ]
    },
    "bind": {
      "1": [
        {
          "id": "smp9-bind-s1-b1",
          "judul": "Bab I: Menganalisis Teks Laporan",
          "subBab": [
            "Penyusunan dan Analisis Teks Laporan Hasil Percobaan atau Observasi Ilmiah",
            "Struktur Teks Laporan: Tujuan, Alat dan Bahan, Langkah Kerja, Hasil Pengamatan, dan Simpulan",
            "Ciri Kebahasaan Ilmiah: Kalimat Kompleks, Kata Teknis/Istilah Ilmiah, dan Kata Tugas Hubungan Logis",
            "Menulis Teks Laporan Ilmiah Berbasis Data Faktual secara Rapi dan Sistematis"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis gagasan, struktur, dan kaidah kebahasaan teks laporan hasil percobaan/observasi, serta menyusun teks laporan berbasis bukti ilmiah."
        },
        {
          "id": "smp9-bind-s1-b2",
          "judul": "Bab II: Menganalisis Cerita Pendek",
          "subBab": [
            "Fokus pada Cerpen: Membedah Unsur Intrinsik (Tema, Alur, Tokoh, Latar, Sudut Pandang, Amanat)",
            "Membedah Unsur Ekstrinsik Cerpen (Nilai Moral, Nilai Sosial Budaya, Latar Pengarang)",
            "Eksplorasi Gaya Bahasa dan Majas dalam Cerpen",
            "Menulis Cerpen Orisinal dengan Kreativitas Alur dan Pesan Moral Kuat"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis unsur pembangun karya sastra cerita pendek dan menuangkan gagasan kreatif dalam bentuk cerpen yang memikat."
        },
        {
          "id": "smp9-bind-s1-b3",
          "judul": "Bab III: Memahami Pidato",
          "subBab": [
            "Fokus pada Teks Pidato Persuasif: Mempelajari Struktur Pidato (Pembukaan, Isi/Argumen, Penutup)",
            "Kaidah Kebahasaan Teks Pidato: Kalimat Persuasif, Kosakata Emotif, dan Kata Bujukan",
            "Teknik Penyampaian Pidato dan Cara Membangun Argumen yang Meyakinkan dengan Percaya Diri"
          ],
          "alokasiSesi": 3,
          "cp": "Menelaah struktur dan penalaran argumen dalam pidato persuasif, serta menulis dan menyampaikan pidato yang meyakinkan khalayak."
        }
      ],
      "2": [
        {
          "id": "smp9-bind-s2-b4",
          "judul": "Bab IV: Memahami Teks Tanggapan Kritis",
          "subBab": [
            "Fokus pada Teks Tanggapan / Resensi Kritis terhadap Karya Fiksi dan Nonfiksi",
            "Struktur Teks Tanggapan: Konteks Objek, Deskripsi Rinci, dan Penilaian Objektif",
            "Memberikan Penilaian terhadap Karya secara Santun, Logis, dan Terstruktur Menggunakan Bahasa Baku"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis dan menyusun teks tanggapan kritis terhadap karya sastra, seni, atau bacaan secara santun, beretika, dan berimbang."
        },
        {
          "id": "smp9-bind-s2-b5",
          "judul": "Bab V: Menyajikan Teks Diskusi",
          "subBab": [
            "Fokus pada Teks Diskusi dan Argumentasi terhadap Isu-Isu Aktual di Masyarakat",
            "Menyusun Argumen Mendukung (Pro) dan Menentang (Kontra) Berdasarkan Data Faktual",
            "Kaidah Kebahasaan Teks Diskusi: Konjungsi Pertentangan, Kohesi, Koherensi, dan Modalitas",
            "Menyimpulkan Solusi secara Objektif di Akhir Teks Diskusi"
          ],
          "alokasiSesi": 3,
          "cp": "Mengevaluasi gagasan pro dan kontra dalam teks diskusi, menyusun argumen berlandaskan bukti, serta merumuskan simpulan solusi yang adil."
        },
        {
          "id": "smp9-bind-s2-b6",
          "judul": "Bab VI: Menulis Surat Pembaca",
          "subBab": [
            "Fokus pada Surat Pembaca untuk Media Massa dan Surat Resmi / Dinas",
            "Struktur Penulisan Surat Pembaca: Judul, Isi Keluhan/Apresiasi Faktual, Harapan, dan Identitas",
            "Mempelajari Kaidah Ejaan (PUEBI/EYD), Kata Baku, dan Struktur Penulisan Surat Formal yang Tepat"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis kaidah bahasa surat pembaca dan surat dinas, serta menyusun surat resmi dan surat pembaca yang santun dan efektif."
        }
      ]
    },
    "mtk": {
      "1": [
        {
          "id": "smp9-mtk-s1-b1",
          "judul": "Bab 1: Bilangan Berpangkat dan Bentuk Akar",
          "subBab": [
            "Sifat-Sifat Operasi Hitung Bilangan Berpangkat (Perkalian, Pembagian, Pemangkatan)",
            "Menyederhanakan dan Mengoperasikan Bentuk Akar (Penjumlahan, Pengurangan, Perkalian)",
            "Merasionalkan Penyebut Pecahan Bentuk Akar",
            "Penerapan Notasi Ilmiah (Bentuk Baku) dalam Konteks Sains dan Teknologi"
          ],
          "alokasiSesi": 3,
          "cp": "Menerapkan sifat operasi bilangan berpangkat dan bentuk akar, merasionalkan penyebut pecahan akar, serta menguasai notasi ilmiah."
        },
        {
          "id": "smp9-mtk-s1-b2",
          "judul": "Bab 2: Persamaan dan Fungsi Kuadrat",
          "subBab": [
            "Bentuk Umum Persamaan Kuadrat (ax² + bx + c = 0) dan Karakteristiknya",
            "Menentukan Akar-Akar Persamaan Kuadrat (Faktorisasi, Melengkapkan Kuadrat Sempurna, Rumus abc)",
            "Karakteristik Nilai Diskriminan (D = b² - 4ac) terhadap Jenis-Jenis Akar",
            "Grafik Fungsi Kuadrat (Parabola): Titik Puncak/Optimum, Sumbu Simetri, dan Titik Potong Sumbu",
            "Aplikasi Persamaan dan Fungsi Kuadrat dalam Pemecahan Masalah Nyata"
          ],
          "alokasiSesi": 3,
          "cp": "Menyelesaikan persamaan kuadrat, menganalisis grafik fungsi kuadrat pada bidang koordinat, dan memecahkan masalah nilai optimum kontekstual."
        },
        {
          "id": "smp9-mtk-s1-b3",
          "judul": "Bab 3: Transformasi Geometri",
          "subBab": [
            "Translasi (Pergeseran Objek pada Koordinat Kartesius)",
            "Refleksi (Pencerminan terhadap Sumbu X, Sumbu Y, Garis y=x, Garis y=-x, dan Titik Asal)",
            "Rotasi (Perputaran Objek dengan Sudut dan Titik Pusat Tertentu)",
            "Dilatasi (Perkalian Skala Objek) dan Analisis Kekongruenan serta Kesebangunan"
          ],
          "alokasiSesi": 3,
          "cp": "Menganalisis dan memodelkan transformasi geometri (translasi, refleksi, rotasi, dilatasi) pada bidang koordinat kartesius."
        }
      ],
      "2": [
        {
          "id": "smp9-mtk-s2-b4",
          "judul": "Bab 4: Bangun Ruang Sisi Lengkung",
          "subBab": [
            "Unsur-Unsur, Jaring-Jaring, dan Luas Permukaan Tabung, Kerucut, dan Bola",
            "Menghitung Volume Bangun Ruang Sisi Lengkung (Tabung, Kerucut, dan Bola)",
            "Pengaruh Perubahan Skala (Jari-Jari dan Tinggi) terhadap Luas Permukaan dan Volume",
            "Penyelesaian Masalah Kontekstual Terkait Bangun Ruang Sisi Lengkung Gabungan"
          ],
          "alokasiSesi": 3,
          "cp": "Menentukan luas permukaan dan volume tabung, kerucut, dan bola serta menyelesaikan masalah kontekstual bangun ruang sisi lengkung."
        },
        {
          "id": "smp9-mtk-s2-b5",
          "judul": "Bab 5: Peluang dan Pemilihan Sampel",
          "subBab": [
            "Dasar-Dasar Teori Peluang: Ruang Sampel, Titik Sampel, dan Kejadian Acak",
            "Menghitung Peluang Empiris (Berdasarkan Percobaan) dan Peluang Teoretis",
            "Menghitung Frekuensi Harapan Suatu Kejadian",
            "Konsep Pemilihan Sampel Representatif dan Pengambilan Keputusan dalam Statistika"
          ],
          "alokasiSesi": 3,
          "cp": "Menentukan ruang sampel percobaan acak, menghitung peluang empiris dan teoretis, serta merancang metode pemilihan sampel yang representatif."
        }
      ]
    }
  }
}

def main():
    with open(SILABUS_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the smp block
    start_smp = content.index('"smp": {')
    start_sma = content.index('"sma": {')

    # Format the new smp block
    smp_json_str = json.dumps(NEW_SMP, ensure_ascii=False, indent=2)
    
    # Indent it by 4 spaces
    indented_lines = []
    for line in smp_json_str.splitlines()[1:-1]:
        indented_lines.append('    ' + line)
    
    new_smp_inner = '\n'.join(indented_lines)
    new_smp_block = f'"smp": {{\n{new_smp_inner}\n  }},\n  '

    # Replace
    new_content = content[:start_smp] + new_smp_block + content[start_sma:]

    with open(SILABUS_FILE, 'w', encoding='utf-8') as f:
        f.write(new_content)

    print(f"Successfully updated {SILABUS_FILE} with complete synced Kurikulum Merdeka SMP syllabus!")

if __name__ == '__main__':
    main()
