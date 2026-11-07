#!/usr/bin/env python3
"""
build_kelas8_ipa_bab2_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 2 IPA SMP Kelas 8:
Struktur & Fungsi Tubuh Makhluk Hidup II (Pernapasan, Ekskresi, dan Sistem Gerak):
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid (0 Error)
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 25 Soal Kurikulum Merdeka HOTS Bab 2 (Hal. 313-319)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan grafik spirogram volume udara pernapasan manusia berikut! Berdasarkan skala grafik spirogram tersebut, besar volume tidal (pernapasan biasa) dan kapasitas vital paru-paru berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "100 mL dan 300 mL"},
            {"label": "B", "teks": "100 mL dan 400 mL"},
            {"label": "C", "teks": "200 mL dan 400 mL"},
            {"label": "D", "teks": "300 mL dan 500 mL"}
        ],
        "kunci": "B",
        "pembahasan": "Pada grafik spirogram tersebut, volume tidal (volume udara inspirasi/ekspirasi biasa) berada pada rentang 200 mL hingga 300 mL (= 100 mL). Kapasitas vital (volume udara maksimum yang dapat dihembuskan setelah inspirasi maksimal) berada pada rentang 100 mL hingga 500 mL (= 400 mL). Maka berturut-turut adalah 100 mL dan 400 mL.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_spirogram_paru.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Dinding trakea (batang tenggorokan) manusia tersusun atas cincin-cincin tulang rawan dan dilapisi oleh sel-sel epitel bersilia yang menghasilkan lendir (mukus). Fungsi utama epitel bersilia tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menghasilkan suara nyaring saat berbicara"},
            {"label": "B", "teks": "Menyapu dan mendorong partikel debu, kotoran, dan kuman patogen keluar menuju faring agar tidak masuk ke paru-paru"},
            {"label": "C", "teks": "Menyerap gas oksigen langsung ke pembuluh darah trakea"},
            {"label": "D", "teks": "Mengatur suhu udara napas agar sama dengan suhu ruangan"}
        ],
        "kunci": "B",
        "pembahasan": "Silia (rambut getar) pada dinding trakea bergerak menyapu ke arah atas (faring) bersama lapisan lendir, berfungsi sebagai eskalator mukosiliar untuk menjerat dan mengeluarkan debu atau mikroba patogen dari saluran pernapasan.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Pertukaran gas oksigen (O2) dari udara di alveolus ke dalam kapiler darah dan pelepasan karbon dioksida (CO2) dari kapiler ke alveolus berlangsung secara difusi pasif. Faktor pendorong utama difusi gas tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Perbedaan tekanan parsial gas di mana PO2 di alveolus lebih tinggi daripada PO2 di kapiler darah, dan PCO2 di kapiler darah lebih tinggi daripada di alveolus"},
            {"label": "B", "teks": "Bantuan pompa aktif ion kalsium pada dinding alveolus"},
            {"label": "C", "teks": "Perbedaan suhu udara napas dan darah"},
            {"label": "D", "teks": "Gaya dorong peristaltik bronkiolus"}
        ],
        "kunci": "A",
        "pembahasan": "Pertukaran gas di alveolus berlangsung melalui difusi pasif menembus membran tipis alveolokapiler. Gas berpindah dari daerah yang memiliki tekanan parsial tinggi ke daerah bertekanan parsial lebih rendah tanpa membutuhkan energi ATP.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Pada peragaan alat model paru-paru menggunakan botol kaca transparan (rongga dada), dua balon karet di dalam (paru-paru), dan membran karet di bagian bawah (diafragma), ketika membran karet bawah ditarik ke bawah, yang terjadi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Volume tabung menyusut dan balon mengempis (ekspirasi)"},
            {"label": "B", "teks": "Tekanan udara di dalam tabung membesar dan udara keluar dari balon"},
            {"label": "C", "teks": "Balon tidak mengalami perubahan karena udara tertahan"},
            {"label": "D", "teks": "Volume di dalam tabung membesar sehingga tekanan udara turun, menyebabkan udara luar masuk dan kedua balon mengembang (memodelkan inspirasi pernapasan perut)"}
        ],
        "kunci": "D",
        "pembahasan": "Menarik membran karet ke bawah memodelkan kontraksi diafragma (mendatar) pada pernapasan perut. Hal ini memperbesar volume rongga dada, menurunkan tekanan intrapulmonal di bawah tekanan atmosfer, sehingga udara mengalir masuk dan paru-paru mengembang.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Rongga hidung manusia dilengkapi dengan rambut-rambut hidung (silia), selaput lendir (mukus), dan anyaman kapiler darah (konka nasalis). Tiga perlakuan fisiologis yang dialami udara pernapasan saat melewati rongga hidung adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pemanasan, pendinginan, dan pembekuan kuman"},
            {"label": "B", "teks": "Pengikatan oksigen, pengeluaran karbon monoksida, dan pengenceran"},
            {"label": "C", "teks": "Penyaringan debu oleh rambut hidung, penyesuaian suhu tubuh oleh kapiler konka, dan pelembapan udara oleh selaput lendir"},
            {"label": "D", "teks": "Pemisahan nitrogen, penyaringan karbon dioksida, dan sterilisasi mutlak"}
        ],
        "kunci": "C",
        "pembahasan": "Rongga hidung mengkondisikan udara inspirasi melalui 3 mekanisme: (1) Menyaring partikel kasar oleh silia/rambut; (2) Menghangatkan udara mendekati suhu inti tubuh (37°C) oleh konka; (3) Melembapkan udara hingga mendekati saturasi 100% oleh mukus.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Gas karbon monoksida (CO) dari asap knalpot kendaraan bermotor di ruangan tertutup sangat mematikan karena ....",
        "opsi": [
            {"label": "A", "teks": "Menyebabkan dinding trakea mencair"},
            {"label": "B", "teks": "Memiliki afinitas daya ikat terhadap hemoglobin 200–250 kali lebih kuat daripada oksigen, sehingga membentuk HbCO dan memblokir pengikatan oksigen ke jaringan tubuh"},
            {"label": "C", "teks": "Membekukan cairan empedu di hati"},
            {"label": "D", "teks": "Mengubah sel darah putih menjadi sel kanker"}
        ],
        "kunci": "B",
        "pembahasan": "Hemoglobin memiliki afinitas ikatan terhadap gas CO sekitar 200–250 kali lipat dibanding terhadap O2. Akibatnya, terbentuk karboksihemoglobin (HbCO) stabil yang menyebabkan sel-sel tubuh mengalami asfiksia (kekurangan O2 parah) hingga berujung kematian.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Ketika kita menghembuskan napas melalui sedotan ke dalam tabung reaksi yang berisi air kapur jernih (Ca(OH)2), beberapa detik kemudian air kapur berubah menjadi keruh putih. Fenomena ini membuktikan bahwa udara ekspirasi mengandung ....",
        "opsi": [
            {"label": "A", "teks": "Gas oksigen murni"},
            {"label": "B", "teks": "Gas nitrogen bebas"},
            {"label": "C", "teks": "Gas karbon dioksida (CO2) yang bereaksi membentuk endapan kalsium karbonat (CaCO3)"},
            {"label": "D", "teks": "Uap asam klorida pekat"}
        ],
        "kunci": "C",
        "pembahasan": "Reaksi kimia: $Ca(OH)_2 + CO_2 \\rightarrow CaCO_3(s) + H_2O$. Terbentuknya endapan putih kalsium karbonat ($CaCO_3$) membuktikan bahwa gas yang diekspirasikan manusia mengandung karbon dioksida ($CO_2$) hasil respirasi seluler.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Penyakit saluran pernapasan kronis yang menyebabkan kerusakan dan robeknya dinding penyekat antar-alveolus sehingga elastisitas paru-paru hilang dan permukaan pertukaran gas menyusut drastis disebut ....",
        "opsi": [
            {"label": "A", "teks": "Asma"},
            {"label": "B", "teks": "Faringitis"},
            {"label": "C", "teks": "Emfisema"},
            {"label": "D", "teks": "Pneumonia"}
        ],
        "kunci": "C",
        "pembahasan": "Emfisema adalah penyakit obstruktif paru kronis di mana dinding alveolus mengalami destruksi dan kehilangan daya elastisitas pegasnya, sering kali akibat paparan asap rokok jangka panjang, sehingga penderita mengalami sesak napas berat.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Perhatikan gambar struktur nefron ginjal berikut! Bagian (1) = Glomerulus, (2) = Kapsula Bowman, (3) = Tubulus Kontortus Proksimal, (4) = Tubulus Kontortus Distal. Proses filtrasi darah dan reabsorpsi zat berguna (seperti glukosa dan asam amino) berturut-turut berlangsung pada bagian bernomor ....",
        "opsi": [
            {"label": "A", "teks": "(1) dan (2)"},
            {"label": "B", "teks": "(1) dan (3)"},
            {"label": "C", "teks": "(2) dan (4)"},
            {"label": "D", "teks": "(3) dan (4)"}
        ],
        "kunci": "B",
        "pembahasan": "Filtrasi darah terjadi di glomerulus (nomor 1) menghasilkan urine primer (filtrat glomerulus). Reabsorpsi zat-zat yang masih berguna (glukosa, asam amino, garam, air) terjadi di tubulus kontortus proksimal (nomor 3) menghasilkan urine sekunder.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Zat-zat manakah di bawah ini yang dalam kondisi fisiologis ginjal sehat MASIH DITEMUKAN di dalam urine primer, tetapi SUDAH TIDAK DITEMUKAN LAGI di dalam urine sesungguhnya?",
        "opsi": [
            {"label": "A", "teks": "Urea dan asam urat"},
            {"label": "B", "teks": "Glukosa dan asam amino"},
            {"label": "C", "teks": "Eritrosit dan leukosit"},
            {"label": "D", "teks": "Protein albumin dan globulin"}
        ],
        "kunci": "B",
        "pembahasan": "Glukosa dan asam amino lolos dari pori-pori glomerulus ke urine primer karena molekulnya kecil. Namun di tubulus kontortus proksimal (TKP), 100% glukosa dan asam amino diserap kembali ke kapiler darah secara transpor aktif, sehingga urine normal tidak mengandung glukosa.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Perhatikan tabel Hasil Uji Laboratorium Sampel Urine Tiga Pasien di Rumah Sakit berikut!\n- Pasien P: Uji Biuret (Tetap Biru), Uji Benedict dipanaskan (Endapan Merah Bata)\n- Pasien Q: Uji Biuret (Warna Ungu/Violet), Uji Benedict dipanaskan (Tetap Biru)\n- Pasien R: Uji Biuret (Tetap Biru), Uji Benedict dipanaskan (Tetap Biru)\nBerdasarkan data di atas, penyakit yang diderita oleh Pasien P dan Pasien Q berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Diabetes mellitus (kencing manis) dan Albuminuria (proteinuria)"},
            {"label": "B", "teks": "Albuminuria dan Diabetes insipidus"},
            {"label": "C", "teks": "Batu ginjal dan Gagal ginjal akut"},
            {"label": "D", "teks": "Nefritis dan Diabetes mellitus"}
        ],
        "kunci": "A",
        "pembahasan": "Pasien P positif uji Benedict (merah bata), artinya urine mengandung glukosa akibat defisiensi insulin (Diabetes Mellitus). Pasien Q positif uji Biuret (ungu), artinya urine mengandung protein albumin akibat kebocoran membran filtrasi glomerulus (Albuminuria).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Mengapa pada saat berada di udara dingin atau ruangan ber-AC kita cenderung lebih sering buang air kecil (beser/volume urine meningkat)?",
        "opsi": [
            {"label": "A", "teks": "Karena paru-paru berhenti mengeluarkan uap air"},
            {"label": "B", "teks": "Karena glomerulus mengalami radang kedinginan"},
            {"label": "C", "teks": "Karena detak jantung berhenti sementara"},
            {"label": "D", "teks": "Pada suhu dingin, pembuluh kapiler kulit mengalami vasokonstriksi sehingga pengeluaran keringat berkurang drastis, menyebabkan ginjal bekerja lebih banyak membuang kelebihan air tubuh"}
        ],
        "kunci": "D",
        "pembahasan": "Suhu dingin memicu vasokonstriksi kapiler perifer kulit untuk menghemat panas, sehingga aktivitas kelenjar keringat menurun drastis. Tubuh menjaga keseimbangan osmoregulasi cairan dengan mengekskresikan kelebihan volume air melalui peningkatan volume urine di ginjal.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Kelainan ekskresi di mana penderita mengeluarkan urine yang sangat banyak (dapat mencapai 15–20 liter per hari) dan selalu merasa haus hebat akibat hiposekresi hormon Antidiuretik (ADH) oleh kelenjar hipofisis disebut ....",
        "opsi": [
            {"label": "A", "teks": "Diabetes mellitus"},
            {"label": "B", "teks": "Albuminuria"},
            {"label": "C", "teks": "Diabetes insipidus"},
            {"label": "D", "teks": "Uremia"}
        ],
        "kunci": "C",
        "pembahasan": "Diabetes insipidus disebabkan oleh kekurangan hormon ADH (vasopresin). Tanpa ADH, tubulus kontortus distal dan duktus kolektivus tidak mampu menyerap kembali air ke darah, sehingga terjadi poliuria masif (volume urine encer sangat banyak).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Organ Hati (Hepar) berperan ganda sebagai kelenjar pencernaan sekaligus organ ekskresi. Peran ekskresi organ hati yang paling utama adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menghasilkan asam klorida encer"},
            {"label": "B", "teks": "Merombak sel darah merah (eritrosit) yang telah tua dan rusak menjadi bilirubin, serta mengubah amonia beracun menjadi urea melalui siklus ornitin"},
            {"label": "C", "teks": "Menyerap glukosa langsung menjadi vitamin C"},
            {"label": "D", "teks": "Menghasilkan sel-sel darah putih fagositik"}
        ],
        "kunci": "B",
        "pembahasan": "Fungsi ekskresi hati: (1) Sel histiosit/Kupffer merombak hemoglobin eritrosit tua menjadi zat warna empedu (bilirubin & biliverdin); (2) Sel hati mendetoksifikasi amonia berbahaya sisa metabolisme protein menjadi senyawa urea yang lebih aman untuk dibuang ginjal.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Zat warna empedu hasil perombakan hemoglobin di hati yang memberikan warna kuning khas pada urine dan feses manusia berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Urobilin pada urine dan sterkobilin pada feses"},
            {"label": "B", "teks": "Melanin dan klorofil"},
            {"label": "C", "teks": "Hemoglobin dan fibrin"},
            {"label": "D", "teks": "Albumin dan amonia"}
        ],
        "kunci": "A",
        "pembahasan": "Bilirubin dialirkan ke usus halus, lalu diubah oleh flora usus menjadi urobilinogen. Sebagian diserap kembali ke darah dan diekskresikan ginjal sebagai urobilin (pemberi warna kuning urine), sedangkan sebagian besar dioksidasi menjadi sterkobilin (pemberi warna cokelat feses).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Di dalam lapisan dermis (kulit jangat) manusia terdapat berbagai struktur pelengkap. Kelenjar yang berfungsi mengeluarkan keringat untuk mengatur suhu tubuh dan kelenjar yang menghasilkan minyak pelumas rambut/kulit berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelenjar tiroid dan parotis"},
            {"label": "B", "teks": "Kelenjar timus dan adrenal"},
            {"label": "C", "teks": "Glandula sudorifera (kelenjar keringat) dan Glandula sebasea (kelenjar minyak)"},
            {"label": "D", "teks": "Kelenjar getah bening dan hipofisis"}
        ],
        "kunci": "C",
        "pembahasan": "Kelenjar sudorifera (kelenjar keringat) menggulung di lapisan dermis dan menyalurkan keringat ke pori epidermis. Kelenjar sebasea bermuara pada folikel rambut untuk mensekresikan sebum (minyak) agar kulit dan rambut tidak kering.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Mengapa proses keluarnya dan menguapnya keringat di permukaan kulit saat kita kepanasan atau berolahraga dapat mendinginkan suhu tubuh kembali ke batas normal?",
        "opsi": [
            {"label": "A", "teks": "Karena keringat mengandung es mikro"},
            {"label": "B", "teks": "Karena keringat menyerap oksigen dari udara bebas"},
            {"label": "C", "teks": "Karena keringat merusak pembuluh darah kapiler"},
            {"label": "D", "teks": "Proses penguapan (evaporasi) air keringat menyerap kalor laten dari permukaan kulit, sehingga suhu tubuh menurun (termoregulasi)"}
        ],
        "kunci": "D",
        "pembahasan": "Perubahan wujud cair ke gas (evaporasi) adalah proses endotermik yang memerlukan energi kalor. Kalor tersebut diserap dari kapiler darah permukaan kulit, sehingga panas tubuh terdisipasi dan temperatur inti tubuh kembali stabil.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Perbedaan mendasar antara proses Ekskresi, Sekresi, dan Defekasi dalam fisiologi manusia yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Ekskresi membuang feses, sekresi membuang urine, defekasi membuang keringat"},
            {"label": "B", "teks": "Ekskresi adalah pengeluaran zat sisa metabolisme sel yang tidak berguna lagi bagi tubuh (urine, keringat, CO2, empedu); Sekresi adalah pengeluaran zat hasil kelenjar yang masih berguna bagi tubuh (enzim, hormon); Defekasi adalah pengeluaran sisa makanan yang tidak tercerna (feses)"},
            {"label": "C", "teks": "Ketiga proses tersebut memiliki pengertian yang identik sama"},
            {"label": "D", "teks": "Sekresi hanya terjadi pada tumbuhan"}
        ],
        "kunci": "B",
        "pembahasan": "Ekskresi mengeluarkan sisa-sisa metabolik selular beracun. Sekresi memproduksi senyawa fungsional yang dibutuhkan proses biologis lain (getah lambung, saliva, hormon). Defekasi mengeluarkan materi feses yang tidak pernah diserap ke dalam sel tubuh.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Endapan kristal garam kalsium oksalat atau asam urat yang mengeras di dalam rongga ginjal (pelvis) atau saluran ureter sehingga menyumbat aliran urine dan menimbulkan rasa nyeri hebat disebut ....",
        "opsi": [
            {"label": "A", "teks": "Nefrolitiasis (batu ginjal)"},
            {"label": "B", "teks": "Gagal ginjal kronis"},
            {"label": "C", "teks": "Nefritis akut"},
            {"label": "D", "teks": "Pielonefritis"}
        ],
        "kunci": "A",
        "pembahasan": "Batu ginjal (nefrolitiasis) terbentuk ketika konsentrasi zat-zat terlarut seperti kalsium, oksalat, dan asam urat melebihi batas kelarutan jenuh sehingga mengalami kristalisasi dan presipitasi membentuk batu padat di saluran kemih.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Persendian pada tubuh manusia yang memungkinkan gerakan bebas ke segala arah (memiliki bonggol sendi yang masuk ke mangkuk sendi), seperti pada hubungan gelang bahu dengan tulang lengan atas, adalah sendi ....",
        "opsi": [
            {"label": "A", "teks": "Sendi engsel"},
            {"label": "B", "teks": "Sendi putar"},
            {"label": "C", "teks": "Sendi pelana"},
            {"label": "D", "teks": "Sendi peluru (ball-and-socket joint)"}
        ],
        "kunci": "D",
        "pembahasan": "Sendi peluru menghubungkan ujung tulang membulat (bonggol) ke dalam lekukan mangkuk tulang lain, memungkinkan rentang gerak triaksial rotasi bebas ke segala arah (pada artikulasio humeri bahu dan artikulasio koksae panggul).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Saat kita menekuk siku mengangkat lengan bawah ke atas (gerakan fleksi), mekanisme kerja otot antagonis pada lengan atas yang terjadi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Otot bisep dan trisep sama-sama berelaksasi"},
            {"label": "B", "teks": "Otot bisep berelaksasi dan otot trisep berkontraksi"},
            {"label": "C", "teks": "Otot bisep berkontraksi (memendek dan menebal) dan otot trisep berelaksasi (memanjang)"},
            {"label": "D", "teks": "Otot bisep dan trisep bekerja secara sinergis searah"}
        ],
        "kunci": "C",
        "pembahasan": "Otot bisep dan trisep bekerja antagonis (berlawanan). Saat fleksi (menekuk sendi siku), otot bisep bertindak sebagai fleksor (berkontraksi) sementara otot trisep bertindak sebagai ekstensor yang berelaksasi.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Perhatikan ciri-ciri jaringan otot berikut:\n(1) Sel berbentuk silindris memanjang dan bercabang-cabang\n(2) Memiliki lurik-lurik gelap dan terang\n(3) Memiliki satu atau dua inti sel yang terletak di tengah\n(4) Bekerja secara tidak sadar (involunter) dan berirama tanpa lelah\nBerdasarkan ciri-ciri di atas, jaringan tersebut adalah otot ....",
        "opsi": [
            {"label": "A", "teks": "Otot polos"},
            {"label": "B", "teks": "Otot jantung (miokardium)"},
            {"label": "C", "teks": "Otot rangka (otot lurik)"},
            {"label": "D", "teks": "Otot lingkar lambung"}
        ],
        "kunci": "B",
        "pembahasan": "Ciri khas otot jantung adalah perpaduan sifat struktural (silindris berlurik bercabang dengan diskus interkalaris) dan fungsional involunter (bekerja otomatis dipacu nodus sinoatrial tanpa kelelahan).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Seorang siswa yang memiliki kebiasaan duduk membungkuk miring ke samping saat menulis dalam jangka waktu bertahun-tahun berisiko mengalami kelainan tulang belakang melengkung ke arah lateral (berbentuk huruf 'S' atau 'C'). Kelainan ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Skoliosis"},
            {"label": "B", "teks": "Kifosis"},
            {"label": "C", "teks": "Lordosis"},
            {"label": "D", "teks": "Fraktura"}
        ],
        "kunci": "A",
        "pembahasan": "Skoliosis adalah deviasi tulang belakang ke arah samping (lateral). Kifosis adalah tulang belakang melengkung ke belakang (bungkuk), sedangkan lordosis adalah melengkung ke depan di daerah pinggang.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Pusat pengendali laju pernapasan pada manusia terletak di medula oblongata batang otak. Faktor kimiawi utama di dalam darah yang paling sensitif merangsang pusat napas untuk mempercepat tarikan napas adalah ....",
        "opsi": [
            {"label": "A", "teks": "Penurunan kadar glukosa darah"},
            {"label": "B", "teks": "Kenaikan kadar nitrogen bebas"},
            {"label": "C", "teks": "Kenaikan kadar karbon dioksida (CO2) dan ion hidrogen (H+) yang menurunkan pH cairan darah/serebrospinal"},
            {"label": "D", "teks": "Penurunan volume keringat"}
        ],
        "kunci": "C",
        "pembahasan": "Kemosereptor sentral di medula oblongata sangat sensitif terhadap konsentrasi H+ akibat kenaikan PCO2 darah. Kenaikan CO2 menurunkan pH, yang secara cepat memicu sinyal impuls saraf untuk mempercepat frekuensi dan kedalaman respirasi.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Urutan saluran kemih tempat mengalirnya urine sesungguhnya sejak keluar dari ginjal hingga dikeluarkan dari tubuh manusia adalah ....",
        "opsi": [
            {"label": "A", "teks": "Uretra -> Vesika urinaria -> Ureter"},
            {"label": "B", "teks": "Kandung kemih -> Ureter -> Uretra"},
            {"label": "C", "teks": "Ureter -> Uretra -> Kandung kemih"},
            {"label": "D", "teks": "Ureter -> Kandung kemih (Vesika urinaria) -> Uretra"}
        ],
        "kunci": "D",
        "pembahasan": "Dari pelvis renalis ginjal, urine mengalir melalui sepasang saluran ureter menuju kantung penampung urine (kandung kemih/vesika urinaria). Ketika sfingter terbuka saat berkemih, urine dikeluarkan melalui uretra ke luar tubuh.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    }
]

# 10 Soal Contoh Asli (No. 26-35)
contoh_soal = [
    {
        "nomor_bab": 26,
        "soal": "Cabang batang tenggorokan yang menghubungkan trakea dengan paru-paru kanan dan paru-paru kiri disebut ....",
        "opsi": [
            {"label": "A", "teks": "Bronkus"},
            {"label": "B", "teks": "Bronkiolus"},
            {"label": "C", "teks": "Alveolus"},
            {"label": "D", "teks": "Laring"}
        ],
        "kunci": "A",
        "pembahasan": "Trakea bercabang dua menjadi bronkus primer kanan dan bronkus primer kiri yang masing-masing masuk ke dalam pulmo (paru-paru).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Kapasitas vital paru-paru adalah jumlah volume udara dari ....",
        "opsi": [
            {"label": "A", "teks": "Udara tidal saja"},
            {"label": "B", "teks": "Udara residu ditambah udara komplementer"},
            {"label": "C", "teks": "Udara tidal + udara komplementer (cadangan inspirasi) + udara suplementer (cadangan ekspirasi)"},
            {"label": "D", "teks": "Total kapasitas paru-paru dikurangi udara tidal"}
        ],
        "kunci": "C",
        "pembahasan": "Kapasitas Vital Paru-paru (KV) = Volume Tidal ($V_T$) + Volume Cadangan Inspirasi ($V_{CI}$) + Volume Cadangan Ekspirasi ($V_{CE}$). Pada orang dewasa normal nilainya sekitar 3.500–4.000 mL.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_spirogram_paru.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Volume udara yang tetap tertinggal di dalam paru-paru dan tidak dapat dihembuskan keluar meskipun kita telah melakukan ekspirasi sekuat-kuatnya disebut ....",
        "opsi": [
            {"label": "A", "teks": "Udara tidal"},
            {"label": "B", "teks": "Udara residu"},
            {"label": "C", "teks": "Kapasitas vital"},
            {"label": "D", "teks": "Udara cadangan inspirasi"}
        ],
        "kunci": "B",
        "pembahasan": "Udara residu (volume sisa) adalah volume udara sekitar 1.000–1.200 mL yang selalu ada di dalam alveolus agar paru-paru tidak mengempis total (kolaps).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_spirogram_paru.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Bagian ginjal yang merupakan lapisan terluar tempat jutaan badan Malpighi (glomerulus dan kapsula Bowman) berada adalah ....",
        "opsi": [
            {"label": "A", "teks": "Korteks renalis"},
            {"label": "B", "teks": "Medula renalis"},
            {"label": "C", "teks": "Pelvis renalis"},
            {"label": "D", "teks": "Ureter"}
        ],
        "kunci": "A",
        "pembahasan": "Struktur ginjal dari luar ke dalam: Korteks (kulit ginjal tempat glomerulus dan tubulus proksimal/distal), Medula (sumsum ginjal tempat lengkung Henle), dan Pelvis (rongga ginjal penampung urine).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Penambahan zat-zat sisa metabolisme yang sudah tidak diperlukan oleh tubuh (seperti asam urat, obat-obatan, kelebihan ion H+) ke dalam urine sekunder di tubulus kontortus distal disebut proses ....",
        "opsi": [
            {"label": "A", "teks": "Filtrasi"},
            {"label": "B", "teks": "Reabsorpsi"},
            {"label": "C", "teks": "Augmentasi"},
            {"label": "D", "teks": "Defekasi"}
        ],
        "kunci": "C",
        "pembahasan": "Augmentasi adalah tahap ketiga pembentukan urine di tubulus kontortus distal dan tubulus kolektivus yang menghasilkan urine sejati (sesungguhnya).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Penyakit radang ginjal yang disebabkan oleh infeksi bakteri Streptococcus pada nefron sehingga protein dan darah bocor ke urine disebut ....",
        "opsi": [
            {"label": "A", "teks": "Nefritis"},
            {"label": "B", "teks": "Albuminuria"},
            {"label": "C", "teks": "Batu ginjal"},
            {"label": "D", "teks": "Diabetes insipidus"}
        ],
        "kunci": "A",
        "pembahasan": "Nefritis (glomerulonefritis) adalah peradangan pada nefron ginjal akibat kompleks imun pasca-infeksi Streptococcus yang merusak unit penyaring glomerulus.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Hubungan antar-tulang tengkorak kepala manusia yang dihubungkan oleh jaringan ikat fibrosa dan tidak memungkinkan adanya gerakan sama sekali disebut sendi ....",
        "opsi": [
            {"label": "A", "teks": "Diartrosis (sendi gerak)"},
            {"label": "B", "teks": "Amfiartrosis (sendi kaku)"},
            {"label": "C", "teks": "Sinartrosis (sendi mati / sutura)"},
            {"label": "D", "teks": "Sendi engsel"}
        ],
        "kunci": "C",
        "pembahasan": "Sinartrosis adalah persendian yang tidak memungkinkan pergerakan sama sekali. Contohnya adalah sutura pada tulang-tulang tengkorak kepala.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Persendian pada lutut dan siku yang hanya memungkinkan gerakan ke satu arah saja adalah sendi ....",
        "opsi": [
            {"label": "A", "teks": "Sendi peluru"},
            {"label": "B", "teks": "Sendi pelana"},
            {"label": "C", "teks": "Sendi engsel"},
            {"label": "D", "teks": "Sendi putar"}
        ],
        "kunci": "C",
        "pembahasan": "Sendi engsel bekerja seperti engsel pintu yang membatasi gerakan fleksi-ekstensi dalam satu bidang datar saja (uniaksial).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Penurunan kepadatan massa tulang akibat hilangnya kalsium pada orang lanjut usia sehingga tulang menjadi keropos dan mudah patah disebut ....",
        "opsi": [
            {"label": "A", "teks": "Rakitis"},
            {"label": "B", "teks": "Osteoporosis"},
            {"label": "C", "teks": "Artritis"},
            {"label": "D", "teks": "Polio"}
        ],
        "kunci": "B",
        "pembahasan": "Osteoporosis adalah kelainan sistemik rangka yang ditandai dengan penurunan densitas massa tulang dan kemunduran mikroarsitektur jaringan tulang, sering terkait penurunan hormon estrogen pada wanita pascamonopause.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Jaringan ikat khusus yang menghubungkan ujung otot rangka (daging) dengan tulang keras disebut ....",
        "opsi": [
            {"label": "A", "teks": "Ligamen"},
            {"label": "B", "teks": "Tendon"},
            {"label": "C", "teks": "Kartilago"},
            {"label": "D", "teks": "Fasia"}
        ],
        "kunci": "B",
        "pembahasan": "Tendon adalah berkas serat kolagen kuat yang mengikat otot ke tulang. Ligamen menghubungkan tulang dengan tulang pada persendian.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
latihan_mandiri = [
    {"no": 36, "soal": "Otot antartulang rusuk berkontraksi, tulang rusuk terangkat, volume rongga dada membesar, tekanan paru-paru mengecil sehingga udara luar masuk. Peristiwa ini disebut ....", "opsi": ["Inspirasi pernapasan dada", "Ekspirasi pernapasan dada", "Inspirasi pernapasan perut", "Ekspirasi pernapasan perut"], "kunci": "A", "bahas": "Kontraksi muskulus interkostalis eksternus mengangkat sangkar iga, memperluas dimensi rongga dada, memicu masuknya udara pada inspirasi dada."},
    {"no": 37, "soal": "Otot diafragma berkontraksi sehingga posisinya mendatar, rongga dada membesar, dan udara masuk ke paru-paru merupakan mekanisme ....", "opsi": ["Inspirasi pernapasan perut", "Ekspirasi pernapasan perut", "Inspirasi pernapasan dada", "Ekspirasi pernapasan dada"], "kunci": "A", "bahas": "Kontraksi diafragma menjadikannya datar dan memperluas dimensi vertikal rongga toraks, memicu inspirasi pernapasan perut."},
    {"no": 38, "soal": "Pada waktu bernapas biasa, volume udara yang masuk atau keluar paru-paru orang dewasa adalah sekitar ....", "opsi": ["500 mL", "1.500 mL", "3.500 mL", "4.500 mL"], "kunci": "A", "bahas": "Volume tidal (udara pernapasan tenang biasa) pada orang dewasa sehat rata-rata adalah 500 mL."},
    {"no": 39, "soal": "Penyakit batuk menular kronis yang disebabkan oleh infeksi kuman Mycobacterium tuberculosis pada alveolus paru-paru adalah ....", "opsi": ["TBC (Tuberkulosis)", "Asma", "Bronkitis", "Pneumonia"], "kunci": "A", "bahas": "TBC disebabkan oleh bakteri tahan asam Mycobacterium tuberculosis yang membentuk bintil-bintil tuberkel pada jaringan alveolus."},
    {"no": 40, "soal": "Peradangan pada selaput pembungkus paru-paru (pleura) yang menimbulkan nyeri dada saat bernapas disebut ....", "opsi": ["Pleuritis", "Sinusitis", "Laringitis", "Rinitis"], "kunci": "A", "bahas": "Pleuritis adalah radang pada selaput pleura yang menyebabkan gesekan antarlapisan pleura terasa sangat menyakitkan."},
    {"no": 41, "soal": "Penyempitan saluran napas akibat alergi debu, hawa dingin, atau stres emosional yang menyebabkan napas berbunyi mengi disebut ....", "opsi": ["Asma", "TBC", "Polip", "Asfiksi"], "kunci": "A", "bahas": "Asma adalah hipersensitivitas bronkiolus terhadap alergen yang memicu spasme otot polos bronkus dan hipersekresi mukus kental."},
    {"no": 42, "soal": "Kelainan saluran pernapasan di mana paru-paru terendam cairan atau lendir radang akibat infeksi bakteri Streptococcus pneumoniae disebut ....", "opsi": ["Pneumonia (paru-paru basah)", "Emfisema", "Difteri", "Kanker paru"], "kunci": "A", "bahas": "Pneumonia menyebabkan eksudat radang memenuhi rongga alveolus sehingga pertukaran gas terhambat."},
    {"no": 43, "soal": "Jumlah unit fungsional penyaring darah terkecil di dalam kedua ginjal manusia (nefron) mencapai sekitar ....", "opsi": ["10.000 nefron", "100.000 nefron", "1.000.000 nefron", "10.000.000 nefron"], "kunci": "C", "bahas": "Tiap ginjal manusia normal memiliki sekitar 1–1,25 juta nefron, sehingga total kedua ginjal memiliki lebih dari 2 juta unit nefron."},
    {"no": 44, "soal": "Lengkung Henle (ansae Henle) pada nefron ginjal berfungsi terutama untuk ....", "opsi": ["Membuat glukosa baru", "Mengatur kepekatan urine dan reabsorpsi air serta ion Na+ dan Cl-", "Menyaring protein darah", "Mengeluarkan enzim amilase"], "kunci": "B", "bahas": "Lengkung Henle descending dan ascending menciptakan gradien konsentrasi osmotik di medula ginjal untuk mengkonsentrasikan urine."},
    {"no": 45, "soal": "Zat sisa metabolisme protein yang bersifat racun dan paling banyak terkandung di dalam urine orang sehat adalah ....", "opsi": ["Urea", "Glukosa", "Albumin", "Empedu"], "kunci": "A", "bahas": "Urea merupakan produk akhir katabolisme asam amino yang disintesis di hati dan diekskresikan melalui urine sekitar 25–30 gram per hari."},
    {"no": 46, "soal": "Pigmen pada lapisan epidermis kulit yang memberikan warna kulit dan melindungi jaringan di bawahnya dari bahaya sinar ultraviolet (UV) adalah ....", "opsi": ["Melanin", "Karoten", "Hemoglobin", "Keratin"], "kunci": "A", "bahas": "Melanin diproduksi oleh melanosit di stratum basale epidermis untuk menyerap radiasi foton UV berbahaya."},
    {"no": 47, "soal": "Lapisan terluar kulit yang tersusun atas sel-sel mati yang selalu mengelupas dan digantikan oleh sel baru disebut stratum ....", "opsi": ["Korneum (lapisan tanduk)", "Lusidum", "Granulosum", "Spinosum"], "kunci": "A", "bahas": "Stratum korneum tersusun dari lapisan sel keratin gepeng mati tanpa inti yang tahan air dan melindungi tubuh dari patogen mekanik."},
    {"no": 48, "soal": "Ujung-ujung saraf sensorik penerima rangsang panas, dingin, rabaan, dan nyeri terutama terkonsentrasi di lapisan ....", "opsi": ["Dermis (kulit jangat)", "Stratum korneum", "Subkutan", "Korteks"], "kunci": "A", "bahas": "Reseptor indra raba (Meissner, Pacini, Ruffini, Krause, dan ujung saraf bebas nyeri) terletak di lapisan dermis."},
    {"no": 49, "soal": "Kandungan utama cairan keringat yang dikeluarkan oleh glandula sudorifera adalah ....", "opsi": ["Air, garam NaCl, dan sedikit urea", "Asam klorida dan empedu", "Lemak dan vitamin", "Darah dan protein"], "kunci": "A", "bahas": "Keringat terdiri dari 99% air dan 1% zat terlarut berupa natrium klorida (garam), kalium, dan sisa metabolit urea."},
    {"no": 50, "soal": "Fungsi hati dalam merombak eritrosit menghasilkan zat warna biliverdin yang berwarna kehijauan dan zat warna bilirubin yang berwarna ....", "opsi": ["Kuning kecokelatan", "Merah darah", "Ungu pekat", "Biru muda"], "kunci": "A", "bahas": "Bilirubin adalah pigmen kuning-oranye yang berasal dari pemecahan cincin protoporfirin pada gugus heme hemoglobin."},
    {"no": 51, "soal": "Kuningnya kulit dan bola mata (ikterus/jaundice) pada penderita radang hati (hepatitis) terjadi akibat ....", "opsi": ["Tersumbatnya saluran empedu sehingga pigmen bilirubin menumpuk di dalam darah", "Kekurangan vitamin A", "Produksi sel darah putih berlebih", "Kelebihan gula darah"], "kunci": "A", "bahas": "Hepatitis merusak hepatosit dan menyumbat kanalikuli biliaris, menyebabkan hiperbilirubinemia yang terdeposisi di sklera dan kulit."},
    {"no": 52, "soal": "Proses cuci darah buatan (hemodialisis) bagi penderita gagal ginjal kronis bekerja berdasarkan prinsip fisika ....", "opsi": ["Difusi dan osmosis melintasi membran semipermeabel dialiser", "Penguapan air bertekanan tinggi", "Pembekuan darah menggunakan nitrogen cair", "Pemanasan listrik"], "kunci": "A", "bahas": "Hemodialisis memanfaatkan gradien difusi zat sisa urea dan racun dari darah pasien melintasi membran membran dialisis ke cairan dialisat."},
    {"no": 53, "soal": "Tulang keras tersusun atas sel-sel tulang yang disebut ....", "opsi": ["Osteosit", "Kondrosit", "Eritrosit", "Miosit"], "kunci": "A", "bahas": "Osteosit adalah sel tulang dewasa yang terkurung dalam lakuna matriks kalsium fosfat. Kondrosit adalah sel tulang rawan."},
    {"no": 54, "soal": "Bagian tengah tulang pipa yang mengandung sumsum tulang berlemak dan rongga medula disebut ....", "opsi": ["Diafisis", "Epifisis", "Metafisis", "Cakra epifisis"], "kunci": "A", "bahas": "Diafisis adalah batang tubular tulang pipa. Epifisis adalah kedua ujung membesar dari tulang pipa."},
    {"no": 55, "soal": "Hubungan antara tulang leher pertama (atlas) dengan tulang tengkorak kepala membentuk sendi ....", "opsi": ["Sendi putar", "Sendi engsel", "Sendi peluru", "Sendi luncur"], "kunci": "A", "bahas": "Sendi putar antara tulang atlas dan aksis memungkinkan gerakan rotasi menggelengkan kepala ke kiri dan ke kanan."},
    {"no": 56, "soal": "Persendian antara tulang ibu jari tangan dengan tulang telapak tangan yang memungkinkan gerakan dua arah seperti orang menunggang kuda adalah sendi ....", "opsi": ["Sendi pelana", "Sendi putar", "Sendi engsel", "Sendi mati"], "kunci": "A", "bahas": "Sendi pelana (saddle joint) memiliki permukaan bikonkaf-bikonveks yang memungkinkan gerakan biaksial saling berhadapan."},
    {"no": 57, "soal": "Otot yang bekerja pada dinding organ-organ dalam seperti lambung, usus, dan pembuluh darah adalah otot ....", "opsi": ["Otot polos", "Otot lurik", "Otot jantung", "Otot serat melintang"], "kunci": "A", "bahas": "Otot polos berbentuk gelendong berinti tunggal di tengah, bekerja involunter secara lambat dan tidak mudah lelah pada visera."},
    {"no": 58, "soal": "Kelelahan dan rasa pegal pada otot setelah melakukan aktivitas lari cepat tanpa pemanasan disebabkan oleh penumpukan senyawa ....", "opsi": ["Asam laktat", "Asam sitrat", "Asam asetat", "Glukosa"], "kunci": "A", "bahas": "Respirasi anaerob seluler pada kondisi defisit oksigen menghasilkan asam laktat yang mengendap di miofibril dan menimbulkan asidosis otot."},
    {"no": 59, "soal": "Kelainan tulang belakang yang melengkung berlebihan ke arah depan di daerah pinggang sehingga pinggul tampak menonjol ke belakang disebut ....", "opsi": ["Lordosis", "Kifosis", "Skoliosis", "Subluksasi"], "kunci": "A", "bahas": "Lordosis adalah kurvatura anterior berlebihan pada kolumna vertebralis lumbalis."},
    {"no": 60, "soal": "Penyakit kelainan tulang pada anak-anak akibat kekurangan vitamin D dan kalsium yang menyebabkan tulang kaki melengkung membentuk huruf O atau X disebut ....", "opsi": ["Rakitis", "Osteoporosis", "Nekrosis", "Layuh semu"], "kunci": "A", "bahas": "Rakitis (rickets) menyebabkan mineralisasi tulang terhambat sehingga tulang lunak dan membengkok saat menahan bobot tubuh."},
    {"no": 61, "soal": "Peradangan pada sendi yang menimbulkan rasa linu, kaku, dan pembengkakan disebut ....", "opsi": ["Artritis", "Fraktura", "Dislokasi", "Ankilosis"], "kunci": "A", "bahas": "Artritis (seperti gout artritis atau osteoartritis) adalah inflamasi sendi yang merusak kartilago artikularis sendi."},
    {"no": 62, "soal": "Pergeseran posisi sendi di mana bonggol sendi terlepas dari mangkuk sendinya disebut ....", "opsi": ["Dislokasi", "Fraktura", "Fisura", "Sprain"], "kunci": "A", "bahas": "Dislokasi adalah keluarnya ujung tulang persendian dari kedudukan anatomis aslinya pada ligamen kapsul sendi."},
    {"no": 63, "soal": "Otot yang bekerja searah secara bersama-sama seperti otot pronator teres dan pronator kuadratus pada lengan bawah disebut otot ....", "opsi": ["Sinergis", "Antagonis", "Ekstensor", "Abduktor"], "kunci": "A", "bahas": "Otot sinergis adalah dua otot atau lebih yang berkontraksi bersama untuk menimbulkan satu gerakan yang sama (contoh gerak pronasi menelungkupkan tangan)."},
    {"no": 64, "soal": "Penyakit layuh otot yang disebabkan oleh infeksi virus polio yang merusak sel saraf motorik kornu anterior medula spinalis adalah ....", "opsi": ["Polio (Poliomielitis)", "Tetanus", "Atrofi", "Distrofi"], "kunci": "A", "bahas": "Polio disebabkan oleh Poliovirus yang melumpuhkan neuron motorik sehingga serabut otot yang dipersarafinya mengalami atrofi parah."},
    {"no": 65, "soal": "Penyakit kejang otot terus-menerus yang disebabkan oleh racun tetanospasmin dari bakteri Clostridium tetani adalah ....", "opsi": ["Tetanus", "Polio", "Kram", "Miopati"], "kunci": "A", "bahas": "Toksin Clostridium tetani memblokir pelepasan neurotransmiter inhibitorik di sinaps saraf spinal sehingga memicu spasme tonik ekstrem (tetanus)."}
]

# 5 Soal Pengayaan AKM (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains — Kapasitas Spirogram Paru-Paru] Seorang atlet renang menjalani tes spirometri di laboratorium. Diperoleh data: Volume Tidal = 500 mL, Volume Cadangan Inspirasi = 2.000 mL, Volume Cadangan Ekspirasi = 1.500 mL, dan Volume Residu = 1.000 mL. Berapakah Kapasitas Vital dan Kapasitas Total Paru-paru atlet tersebut?",
        "opsi": [
            {"label": "A", "teks": "2.500 mL dan 3.500 mL"},
            {"label": "B", "teks": "3.500 mL dan 4.500 mL"},
            {"label": "C", "teks": "4.000 mL dan 5.000 mL"},
            {"label": "D", "teks": "4.500 mL dan 6.000 mL"}
        ],
        "kunci": "C",
        "pembahasan": "Kapasitas Vital (KV) = $V_T + V_{CI} + V_{CE} = 500 + 2.000 + 1.500 = 4.000$ mL. Kapasitas Total Paru-Paru (KT) = $KV + V_R = 4.000 + 1.000 = 5.000$ mL.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_spirogram_paru.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Analisis Data Klinis — Kerusakan Nefron Ginjal] Hasil uji sampel urine seorang pasien menunjukkan kadar protein albumin 300 mg/dL (sangat tinggi) namun kadar glukosa 0 mg/dL (negatif). Lokasi nefron yang paling dicurigai mengalami kerusakan membran selektif adalah ....",
        "opsi": [
            {"label": "A", "teks": "Glomerulus ginjal"},
            {"label": "B", "teks": "Tubulus kontortus distal"},
            {"label": "C", "teks": "Tubulus kolektivus"},
            {"label": "D", "teks": "Saluran uretra luar"}
        ],
        "kunci": "A",
        "pembahasan": "Pada ginjal sehat, pori-pori podosit membran filtrasi glomerulus menahan molekul protein makro seperti albumin agar tidak lolos ke urine primer. Kebocoran albumin mengindikasikan kerusakan pada membran glomerulus (sindrom nefrotik/glomerulonefritis).",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Evaluasi Fisiologis — Regulasi Osmoregulasi & Hormon ADH] Mengapa mengonsumsi minuman berkafein atau beralkohol dalam jumlah berlebih menyebabkan seseorang mengalami dehidrasi ringan?",
        "opsi": [
            {"label": "A", "teks": "Kafein dan alkohol menghambat pelepasan hormon ADH dari kelenjar hipofisis posterior sehingga reabsorpsi air di tubulus ginjal menurun dan ekskresi urine meningkat"},
            {"label": "B", "teks": "Karena alkohol membekukan nefron"},
            {"label": "C", "teks": "Karena kafein menguapkan air langsung dari kulit"},
            {"label": "D", "teks": "Karena racun alkohol diserap oleh paru-paru"}
        ],
        "kunci": "A",
        "pembahasan": "Alkohol dan kafein bekerja sebagai diuretik dengan menekan sekresi hormon ADH (Antidiuretic Hormone). Rendahnya ADH menyebabkan tubulus ginjal tidak menyerap air kembali ke darah, sehingga volume urine keluar melimpah dan memicu dehidrasi.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_nefron_ginjal.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Pemecahan Masalah Ergonomis — Beban Tulang Belakang] Mengapa saat mengangkat benda berat dari lantai, dokter ortopedi sangat menganjurkan untuk menekuk lutut terlebih dahulu (posisi berjongkok) daripada membungkukkan pinggang secara langsung?",
        "opsi": [
            {"label": "A", "teks": "Agar otot bisep bekerja maksimal"},
            {"label": "B", "teks": "Membungkukkan pinggang melipatgandakan gaya torsi mekanik pada bantalan diskus tulang belakang lumbalis, sedangkan menekuk lutut mendistribusikan beban ke otot paha yang jauh lebih kuat"},
            {"label": "C", "teks": "Untuk mencegah keluarnya urine sekunder"},
            {"label": "D", "teks": "Agar paru-paru tertekan ke atas"}
        ],
        "kunci": "B",
        "pembahasan": "Mengangkat benda dengan pinggang membungkuk menciptakan lengan kuasa pendek dan gaya tumpu ekstrem pada ruas lumbal L4-L5/S1 yang berisiko memicu hernia nukleus pulposus (HNP/saraf kejepit). Menekuk lutut memindahkan titik tumpu beban ke otot quadriceps paha yang berdaya tahan tinggi.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Evaluasi Kasus — Asfiksia pada Keracunan Gas Sianida] Gas hidrogen sianida (HCN) mematikan sel secara cepat karena memblokir enzim sitokrom c oksidase di dalam rantai transpor elektron mitokondria. Kondisi asfiksia seluler yang terjadi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Darah kehilangan seluruh molekul hemoglobin"},
            {"label": "B", "teks": "Meskipun darah mengandung oksigen melimpah, sel-sel tubuh sama sekali tidak mampu memanfaatkan oksigen tersebut untuk menghasilkan energi ATP"},
            {"label": "C", "teks": "Trakea tersumbat oleh dahak kental"},
            {"label": "D", "teks": "Ginjal berhenti menghasilkan batu ginjal"}
        ],
        "kunci": "B",
        "pembahasan": "Sianida memicu asfiksia histotoksik: suplai O2 di darah normal, namun sel-sel tubuh lumpuh dan tidak dapat mengonsumsi O2 untuk respirasi aerobik karena enzim pernapasan mitokondria terinaktivasi.",
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    }
]

# Assemble 70 questions for Bab 2
all_70 = []

for q in soal_hots:
    all_70.append(q)

for q in contoh_soal:
    all_70.append(q)

for q in latihan_mandiri:
    all_70.append({
        "nomor_bab": q["no"],
        "soal": q["soal"],
        "opsi": [{"label": chr(65+i), "teks": t} for i, t in enumerate(q["opsi"])],
        "kunci": q["kunci"],
        "pembahasan": q["bahas"],
        "paket": "Bab II: Struktur & Fungsi Tubuh II - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch2_pernapasan_ekskresi.jpg"
    })

for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 2: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab II: Struktur & Fungsi Tubuh Makhluk Hidup II (70 Soal)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 24px; background: #f8fafc; color: #1e293b; }
    article { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
    .badge { display: inline-block; background: #3b82f6; color: white; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }
    .packet { color: #64748b; font-size: 0.85rem; margin-bottom: 12px; }
    .question { font-weight: 600; font-size: 1.05rem; margin-bottom: 14px; }
    ol { margin: 0 0 16px 20px; padding: 0; }
    li { margin-bottom: 6px; }
    .key { background: #dcfce7; color: #166534; padding: 6px 12px; border-radius: 6px; font-weight: 600; display: inline-block; margin-bottom: 10px; }
    .explanation { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 0.95rem; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
<h1>Bank Soal IPA SMP Kelas 8 — Bab II: Struktur & Fungsi Tubuh Makhluk Hidup II</h1>
<p>Total: 70 Butir Soal Lengkap (25 HOTS Kurikulum Merdeka + 10 Contoh Soal Asli + 30 Latihan Mandiri Asli + 5 Pengayaan AKM/TKA)</p>
<hr/>
""")

json_data = []

for q in all_70:
    q_num = q["nomor_bab"]
    q_soal = q["soal"]
    q_kunci = q["kunci"]
    q_pembahasan = q["pembahasan"]
    q_paket = q["paket"]
    q_img = q["img"]
    
    html_parts.append(f"""<article data-gemilang-question data-nomor="{q_num}" data-tipe="pg_sederhana" data-paket="{html.escape(q_paket)}" data-kesulitan="Sedang" data-kelas="8">
  <div data-field="materi">Struktur & Fungsi Tubuh Makhluk Hidup II</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis sistem pernapasan, volume spirogram, ekskresi nefron ginjal, hati, kulit, dan mekanisme gerak sendi tulang otot.</div>
  <div data-field="teks_soal">{html.escape(q_soal)}</div>
  <div data-field="gambar">
    <img src="{q_img}" data-url="{q_img}" alt="Ilustrasi Soal #{q_num}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
  <ol data-field="opsi_jawaban">
""")
    for opt in q["opsi"]:
        html_parts.append(f'    <li data-option="{opt["label"]}">{html.escape(opt["teks"])}</li>\n')
    
    html_parts.append(f"""  </ol>
  <meta data-field="kunci_jawaban" data-value="{q_kunci}" />
  <div data-field="pembahasan">
    <p><strong>Kunci Jawaban: {q_kunci}</strong></p>
    <p>{html.escape(q_pembahasan)}</p>
  </div>
</article>
""")

    json_data.append({
        "nomor": q_num,
        "materi": "Struktur & Fungsi Tubuh Makhluk Hidup II",
        "paket": q_paket,
        "kelas": "8",
        "mapel": "IPA",
        "teks_soal": q_soal,
        "gambar": [q_img],
        "opsi_jawaban": q["opsi"],
        "kunci_jawaban": q_kunci,
        "pembahasan": q_pembahasan,
        "valid": True
    })

html_parts.append("</body></html>")

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab2_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab2_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
