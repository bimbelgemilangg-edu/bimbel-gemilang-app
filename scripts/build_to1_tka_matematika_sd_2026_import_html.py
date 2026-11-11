# scripts/build_to1_tka_matematika_sd_2026_import_html.py
# Generator Berkas Master HTML Impor Bimbel Gemilang
# Try Out I TKA SD 2025/2026 - Matematika / Numerisasi (30 Soal Lengkap)
# Taksonomi persis sesuai naskah PDF asli:
# - A. Bilangan:
#     A1. Bilangan cacah sampai 1.000.000 (Soal 1-4)
#     A2. Faktor, Kelipatan, FPB dan KPK (Soal 5-8)
#     A3. Pecahan (Soal 9-12)
# - B. Geometri dan Pengukuran:
#     B1. Pengukuran (Soal 13-16)
#     B2. Bangun Datar (Soal 17-21)
#     B3. Bangun Ruang (Soal 22-24)
# - C. Data:
#     C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel (Soal 25-27)
#     C2. Membaca dan menyajikan data dalam bentuk diagram (Soal 28-30)

import os

SOAL_MAT = [
    {
        "nomor": 1,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A1. Bilangan cacah sampai 1.000.000",
        "capaian": "Menghitung hasil operasi penjumlahan dan pengurangan bilangan cacah sampai 1.000.000",
        "teks_soal": "Hasil dari $27.825 + 13.460 - 9.754$ adalah …",
        "opsi": [
            ("A", "31.531"),
            ("B", "31.513"),
            ("C", "31.351"),
            ("D", "31.315")
        ],
        "kunci": "A",
        "pembahasan": "Kerjakan berurutan dari kiri ke kanan:<br/>1. $27.825 + 13.460 = 41.285$<br/>2. $41.285 - 9.754 = 31.531$<br/>Jadi, hasil akhirnya adalah 31.531 (Pilihan A)."
    },
    {
        "nomor": 2,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A1. Bilangan cacah sampai 1.000.000",
        "capaian": "Menghitung hasil operasi hitung campuran bilangan cacah dengan tanda kurung",
        "teks_soal": "Hasil dari $12 + 56 : 8 \\times (12 - 10 : 2)$ adalah …",
        "opsi": [
            ("A", "46"),
            ("B", "61"),
            ("C", "91"),
            ("D", "97")
        ],
        "kunci": "B",
        "pembahasan": "Urutan operasi hitung campuran:<br/>1. Selesaikan operasi di dalam tanda kurung lebih dahulu:<br/>   $(12 - 10 : 2) = (12 - 5) = 7$<br/>2. Lakukan pembagian dan perkalian berurutan dari kiri ke kanan:<br/>   $56 : 8 \\times 7 = 7 \\times 7 = 49$<br/>3. Terakhir lakukan penjumlahan:<br/>   $12 + 49 = 61$<br/>Jadi, hasilnya adalah 61 (Pilihan B)."
    },
    {
        "nomor": 3,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A1. Bilangan cacah sampai 1.000.000",
        "capaian": "Menyelesaikan masalah kontekstual yang melibatkan nilai uang dan kembalian",
        "teks_soal": "Adit pergi ke warung. Ia membawa 2 lembar uang dua puluh ribuan dan 2 lembar uang lima ribuan. Adit membeli 1 bungkus kecap seharga Rp12.000,00 dan 1 kg beras seharga Rp16.000,00.<br/><br/>Manakah pernyataan berikut yang sesuai dan tidak sesuai? Berilah tanda centang (✓) pada setiap kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Jumlah uang yang dibawa Adit adalah Rp50.000,00", "Tepat"),
            ("Total harga barang yang dibeli Adit adalah Rp28.000,00", "Tepat"),
            ("Sisa uang Adit adalah Rp20.000,00", "Tidak tepat"),
            ("Uang Adit tidak cukup untuk membayar barang yang dibeli", "Tidak tepat")
        ],
        "kunci": "Tepat, Tepat, Tidak tepat, Tidak tepat",
        "pembahasan": "Analisis setiap pernyataan:<br/>• Uang yang dibawa Adit $= (2 \\times 20.000) + (2 \\times 5.000) = 40.000 + 10.000 = \\text{Rp}50.000,00$ (Tepat).<br/>• Total belanja $= 12.000 + 16.000 = \\text{Rp}28.000,00$ (Tepat).<br/>• Sisa uang Adit $= 50.000 - 28.000 = \\text{Rp}22.000,00$, bukan Rp20.000,00 (Tidak tepat).<br/>• Uang Adit Rp50.000,00 lebih besar dari total belanja Rp28.000,00, sehingga uangnya cukup (Tidak tepat)."
    },
    {
        "nomor": 4,
        "tipe": "pg_kompleks",
        "kesulitan": "sulit",
        "materi": "A. Bilangan - A1. Bilangan cacah sampai 1.000.000",
        "capaian": "Memecahkan sistem persamaan linier dua variabel kontekstual belanja alat tulis",
        "teks_soal": "Rina, Ridho dan Ima membeli beberapa alat tulis di toko. Rina membeli 2 pensil dan 1 buku seharga Rp14.000,00. Ridho membeli 1 pensil dan 2 buku seharga Rp19.000,00. Ima membeli 1 pensil dan 1 buku di toko yang sama.<br/><br/>Manakah pernyataan berikut yang bernilai benar?<br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Harga 1 buah pensil adalah Rp3.000,00"),
            ("B", "Harga 1 buah buku adalah Rp8.000,00"),
            ("C", "Harga 2 buah pensil adalah Rp5.000,00"),
            ("D", "Uang yang harus dibayar Ima adalah Rp11.000,00")
        ],
        "kunci": "A, B, D",
        "pembahasan": "Misalkan $p = \\text{harga pensil}$ dan $b = \\text{harga buku}$.<br/>Persamaan 1: $2p + b = 14.000 \\Rightarrow b = 14.000 - 2p$<br/>Persamaan 2: $p + 2b = 19.000$<br/>Substitusi $b$: $p + 2(14.000 - 2p) = 19.000 \\Rightarrow p + 28.000 - 4p = 19.000 \\Rightarrow 3p = 9.000 \\Rightarrow p = 3.000$<br/>Harga 1 pensil $= \\text{Rp}3.000,00$ (Pernyataan A Benar).<br/>Harga 1 buku $= 14.000 - 2(3.000) = \\text{Rp}8.000,00$ (Pernyataan B Benar).<br/>Harga 2 pensil $= 2 \\times 3.000 = \\text{Rp}6.000,00$ (Pernyataan C Salah).<br/>Ima membeli 1 pensil dan 1 buku $= 3.000 + 8.000 = \\text{Rp}11.000,00$ (Pernyataan D Benar)."
    },
    {
        "nomor": 5,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menentukan KPK tiga bilangan dalam bentuk faktorisasi prima",
        "teks_soal": "KPK dari 24, 36 dan 42 dalam bentuk faktorisasi prima adalah …",
        "opsi": [
            ("A", "$2^3 \\times 3^2$"),
            ("B", "$2^3 \\times 7$"),
            ("C", "$2^2 \\times 3^3 \\times 7$"),
            ("D", "$2^3 \\times 3^2 \\times 7$")
        ],
        "kunci": "D",
        "pembahasan": "Faktorisasi prima ketiga bilangan:<br/>• $24 = 2^3 \\times 3$<br/>• $36 = 2^2 \\times 3^2$<br/>• $42 = 2 \\times 3 \\times 7$<br/>Untuk KPK, ambil semua faktor prima dengan pangkat tertinggi:<br/>$\\text{KPK} = 2^3 \\times 3^2 \\times 7$ (Pilihan D)."
    },
    {
        "nomor": 6,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menerapkan konsep FPB dalam pembagian buah ke piring secara merata",
        "teks_soal": "Sebanyak 63 jeruk dan 81 apel akan disajikan dalam beberapa piring. Setiap piring berisi jeruk dan apel masing-masing sama banyak. Jumlah piring paling banyak yang perlu disediakan adalah …",
        "opsi": [
            ("A", "9"),
            ("B", "7"),
            ("C", "6"),
            ("D", "3")
        ],
        "kunci": "A",
        "pembahasan": "Mencari FPB dari 63 dan 81:<br/>• $63 = 3^2 \\times 7$<br/>• $81 = 3^4$<br/>$\\text{FPB} = 3^2 = 9$.<br/>Jumlah piring paling banyak yang perlu disediakan adalah 9 piring (Pilihan A)."
    },
    {
        "nomor": 7,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menerapkan konsep KPK untuk menentukan interval kunjungan bersama",
        "teks_soal": "Bu Rina memiliki toko kelontong. Toko tersebut dikunjungi beberapa penjual untuk memasok dagangan. Penjual roti berkunjung tiap 4 hari. Penjual telur berkunjung tiap 5 hari. Pada 1 Agustus 2025 kedua penjual sama-sama mengunjungi toko.<br/><br/>Tiap berapa hari penjual roti dan penjual telur berkunjung bersama-sama ke toko?",
        "opsi": [
            ("A", "10 hari"),
            ("B", "12 hari"),
            ("C", "15 hari"),
            ("D", "20 hari")
        ],
        "kunci": "D",
        "pembahasan": "Interval kedua penjual berkunjung bersama-sama adalah KPK dari periode kunjungan masing-masing:<br/>• Periode penjual roti $= 4 = 2^2$ hari<br/>• Periode penjual telur $= 5$ hari<br/>$\\text{KPK}(4, 5) = 4 \\times 5 = 20$ hari.<br/>Jadi, mereka berkunjung bersama-sama setiap 20 hari sekali (Pilihan D)."
    },
    {
        "nomor": 8,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menentukan suku yang hilang pada pola bilangan kelipatan",
        "teks_soal": "Diketahui urutan bilangan kelipatan yaitu 14, 21, 28, 35, n, 49, 56, m, …<br/><br/>Manakah pernyataan berikut yang sesuai dan tidak sesuai? Berilah tanda centang (✓) pada setiap kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Nilai n adalah 42", "Tepat"),
            ("Nilai m adalah 64", "Tidak tepat"),
            ("Selisih nilai m dan n adalah 21", "Tepat"),
            ("Jumlah nilai m dan n adalah 105", "Tepat")
        ],
        "kunci": "Tepat, Tidak tepat, Tepat, Tepat",
        "pembahasan": "Urutan tersebut adalah kelipatan 7 (bertambah 7 setiap suku):<br/>• $n = 35 + 7 = 42$<br/>• $m = 56 + 7 = 63$<br/>Uji pernyataan:<br/>1. Nilai $n$ adalah 42 (Tepat).<br/>2. Nilai $m$ adalah 64 (Tidak tepat, seharusnya 63).<br/>3. Selisih $m - n = 63 - 42 = 21$ (Tepat).<br/>4. Jumlah $m + n = 63 + 42 = 105$ (Tepat)."
    },
    {
        "nomor": 9,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menghitung operasi penjumlahan dan pengurangan pecahan berpenyebut beda",
        "teks_soal": "Hasil dari $3\\frac{1}{2} + \\frac{2}{5} - 1\\frac{1}{4}$ adalah …",
        "opsi": [
            ("A", "$2\\frac{13}{20}$"),
            ("B", "$2\\frac{11}{20}$"),
            ("C", "$3\\frac{13}{20}$"),
            ("D", "$3\\frac{11}{20}$")
        ],
        "kunci": "A",
        "pembahasan": "Ubah ke pecahan berpenyebut sama (KPK dari 2, 5, 4 adalah 20):<br/>$3\\frac{1}{2} = \\frac{7}{2} = \\frac{70}{20}$<br/>$\\frac{2}{5} = \\frac{8}{20}$<br/>$1\\frac{1}{4} = \\frac{5}{4} = \\frac{25}{20}$<br/>Hitung:<br/>$\\frac{70}{20} + \\frac{8}{20} - \\frac{25}{20} = \\frac{70 + 8 - 25}{20} = \\frac{53}{20} = 2\\frac{13}{20}$ (Pilihan A)."
    },
    {
        "nomor": 10,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Mengalikan bilangan asli dengan pecahan biasa",
        "teks_soal": "Jika $4 \\times \\frac{3}{5} = n$, nilai $n$ adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{5}$"),
            ("B", "$1\\frac{2}{5}$"),
            ("C", "$2\\frac{1}{5}$"),
            ("D", "$2\\frac{2}{5}$")
        ],
        "kunci": "D",
        "pembahasan": "$4 \\times \\frac{3}{5} = \\frac{4 \\times 3}{5} = \\frac{12}{5} = 2\\frac{2}{5}$ (Pilihan D)."
    },
    {
        "nomor": 11,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menyelesaikan masalah kontekstual luas tanah dengan operasi pecahan",
        "teks_soal": "Pak Bayu membeli tiga petak tanah masing-masing seluas $1\\frac{1}{2}$ hektare, $\\frac{3}{4}$ hektare, dan $2\\frac{1}{4}$ hektare. Jika $2\\frac{1}{2}$ hektare dari tanah tersebut ditanami jagung, sisa tanah yang belum ditanami adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{2}$ hektare"),
            ("B", "$1\\frac{3}{4}$ hektare"),
            ("C", "$2$ hektare"),
            ("D", "$2\\frac{1}{4}$ hektare")
        ],
        "kunci": "C",
        "pembahasan": "Total luas tanah Pak Bayu:<br/>$= 1\\frac{1}{2} + \\frac{3}{4} + 2\\frac{1}{4} = 1\\frac{2}{4} + \\frac{3}{4} + 2\\frac{1}{4} = 3\\frac{6}{4} = 4\\frac{2}{4} = 4\\frac{1}{2}$ hektare.<br/>Sisa tanah setelah ditanami jagung:<br/>$= 4\\frac{1}{2} - 2\\frac{1}{2} = 2$ hektare (Pilihan C)."
    },
    {
        "nomor": 12,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menyederhanakan pecahan biasa ke bentuk paling sederhana",
        "teks_soal": "Bentuk paling sederhana dari $\\frac{48}{72}$ adalah …",
        "opsi": [
            ("A", "$\\frac{1}{2}$"),
            ("B", "$\\frac{3}{4}$"),
            ("C", "$\\frac{2}{3}$"),
            ("D", "$\\frac{4}{5}$")
        ],
        "kunci": "C",
        "pembahasan": "Bagi pembilang dan penyebut dengan FPB-nya, yaitu 24:<br/>$\\frac{48 : 24}{72 : 24} = \\frac{2}{3}$ (Pilihan C)."
    },
    {
        "nomor": 13,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Menghitung kecepatan rata-rata dari jarak dan selang waktu tempuh",
        "teks_soal": "Pak Pandu berangkat dari rumahnya ke Cirebon dengan mengendarai mobil. Pak Pandu berangkat dari rumah pukul 07.00 dan tiba di Cirebon pukul 09.30. Jika jarak yang ditempuh Pak Pandu adalah 185 km, kecepatan rata-rata mobil yang dikendarai Pak Pandu adalah …",
        "opsi": [
            ("A", "64 km/jam"),
            ("B", "74 km/jam"),
            ("C", "75 km/jam"),
            ("D", "84 km/jam")
        ],
        "kunci": "B",
        "pembahasan": "Waktu tempuh $= 09.30 - 07.00 = 2\\text{ jam } 30\\text{ menit} = 2,5\\text{ jam}$.<br/>Kecepatan rata-rata:<br/>$v = \\frac{s}{t} = \\frac{185}{2,5} = 74\\text{ km/jam}$ (Pilihan B)."
    },
    {
        "nomor": 14,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Membaca ukuran besar sudut tumpul menggunakan busur derajat",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_14_busur_derajat.png",
        "teks_soal": "Perhatikan gambar berikut!<br/>{{GAMBAR}}<br/>Besar sudut COD tersebut adalah …",
        "opsi": [
            ("A", "$150^\\circ$"),
            ("B", "$120^\\circ$"),
            ("C", "$130^\\circ$"),
            ("D", "$180^\\circ$")
        ],
        "kunci": "C",
        "pembahasan": "Kaki sudut OC berada di garis nol sebelah kanan (skala dalam). Kaki sudut OD menunjuk tepat pada angka $130^\\circ$ skala dalam busur derajat. Jadi besar sudut COD adalah $130^\\circ$ (Pilihan C)."
    },
    {
        "nomor": 15,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Mengonversi dan menghitung operasi penjumlahan dan pengurangan satuan panjang",
        "teks_soal": "Hasil dari $7.500\\text{ mm} + 3,6\\text{ m} - 200\\text{ cm}$ adalah …",
        "opsi": [
            ("A", "91 dm"),
            ("B", "109 dm"),
            ("C", "784 dm"),
            ("D", "1.108 dm")
        ],
        "kunci": "A",
        "pembahasan": "Konversikan seluruh satuan ke desimeter (dm):<br/>• $7.500\\text{ mm} = 7.500 : 100 = 75\\text{ dm}$<br/>• $3,6\\text{ m} = 3,6 \\times 10 = 36\\text{ dm}$<br/>• $200\\text{ cm} = 200 : 10 = 20\\text{ dm}$<br/>Hitung:<br/>$75\\text{ dm} + 36\\text{ dm} - 20\\text{ dm} = 91\\text{ dm}$ (Pilihan A)."
    },
    {
        "nomor": 16,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Mengonversi satuan massa hg, g, dan kg dalam perbandingan bobot",
        "teks_soal": "Jika berat satu kantong gula pasir adalah 5 hg dan berat satu kantong tepung terigu adalah 1.000 gr, manakah pernyataan berikut yang sesuai dan tidak sesuai?<br/><br/>Berilah tanda centang (✓) pada setiap kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Berat 2 kantong gula pasir sama dengan 1000 gr", "Tepat"),
            ("Berat satu kantong tepung adalah 0,1 kg", "Tidak tepat"),
            ("Berat satu kantong tepung dan satu kantong gula adalah 1500 gr", "Tepat"),
            ("Berat 2 kantong gula pasir dan 2 kantong tepung terigu adalah 0,3 kg", "Tidak tepat")
        ],
        "kunci": "Tepat, Tidak tepat, Tepat, Tidak tepat",
        "pembahasan": "Konversi dasar: $1\\text{ hg} = 100\\text{ g}$, $1\\text{ kg} = 1.000\\text{ g}$.<br/>• 1 kantong gula pasir $= 5\\text{ hg} = 500\\text{ g}$.<br/>• 1 kantong tepung terigu $= 1.000\\text{ g} = 1\\text{ kg}$.<br/>Uji pernyataan:<br/>1. Berat 2 kantong gula pasir $= 2 \\times 500\\text{ g} = 1.000\\text{ g}$ (Tepat).<br/>2. Berat 1 kantong tepung $= 1.000\\text{ g} = 1\\text{ kg}$, bukan 0,1 kg (Tidak tepat).<br/>3. Berat 1 kantong tepung + 1 kantong gula $= 1.000 + 500 = 1.500\\text{ g}$ (Tepat).<br/>4. Berat 2 kantong gula + 2 kantong tepung $= 1.000\\text{ g} + 2.000\\text{ g} = 3.000\\text{ g} = 3\\text{ kg}$, bukan 0,3 kg (Tidak tepat)."
    },
    {
        "nomor": 17,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Mengidentifikasi bangun datar berdasarkan sifat-sifat sisi dan sudutnya",
        "teks_soal": "Perhatikan sifat-sifat bangun datar berikut!<br/>- Memiliki sepasang sisi sejajar<br/>- Memiliki 2 pasang sudut yang sama besar<br/>- Jumlah besar 2 sudut yang berdekatan di antara 2 garis sejajar adalah 180°<br/><br/>Bangun datar yang memiliki sifat-sifat tersebut adalah …",
        "opsi": [
            ("A", "Jajar genjang"),
            ("B", "Layang-layang"),
            ("C", "Trapesium siku-siku"),
            ("D", "Trapesium sama kaki")
        ],
        "kunci": "D",
        "pembahasan": "Bangun datar yang memiliki tepat sepasang sisi sejajar dan memiliki 2 pasang sudut sama besar (sudut alas sama besar dan sudut atas sama besar) adalah trapesium sama kaki (Pilihan D)."
    },
    {
        "nomor": 18,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menghitung luas bangun datar trapesium sama kaki",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_18_trapesium.png",
        "teks_soal": "Luas trapesium di samping adalah …<br/>{{GAMBAR}}",
        "opsi": [
            ("A", "$684\\text{ cm}^2$"),
            ("B", "$846\\text{ cm}^2$"),
            ("C", "$864\\text{ cm}^2$"),
            ("D", "$1.386\\text{ cm}^2$")
        ],
        "kunci": "A",
        "pembahasan": "Dari gambar:<br/>• Sisi sejajar atas $a = 34\\text{ cm}$<br/>• Sisi sejajar bawah $b = 42\\text{ cm}$<br/>• Tinggi $t = 18\\text{ cm}$<br/>Luas trapesium:<br/>$L = \\frac{a + b}{2} \\times t = \\frac{34 + 42}{2} \\times 18 = \\frac{76}{2} \\times 18 = 38 \\times 18 = 684\\text{ cm}^2$ (Pilihan A)."
    },
    {
        "nomor": 19,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Mengidentifikasi kumpulan sifat-sifat yang dimiliki oleh persegi panjang",
        "teks_soal": "Perhatikan sifat-sifat bangun datar berikut!<br/>(i) Mempunyai dua pasang sisi sejajar dan sama panjang<br/>(ii) Mempunyai dua diagonal sama panjang<br/>(iii) Kedua diagonalnya saling berpotongan tegak lurus<br/>(iv) Mempunyai dua simetri lipat<br/><br/>Manakah yang merupakan sifat-sifat persegi panjang?",
        "opsi": [
            ("A", "(i), (ii), dan (iii)"),
            ("B", "(i), (ii) dan (iv)"),
            ("C", "(i), (iii) dan (iv)"),
            ("D", "(ii), (iii) dan (iv)")
        ],
        "kunci": "B",
        "pembahasan": "Sifat persegi panjang:<br/>(i) Mempunyai 2 pasang sisi sejajar dan sama panjang (Benar).<br/>(ii) Mempunyai 2 diagonal sama panjang (Benar).<br/>(iii) Diagonal berpotongan tegak lurus bukan sifat persegi panjang melainkan belah ketupat/layang-layang/persegi.<br/>(iv) Mempunyai 2 simetri lipat (Benar).<br/>Jadi yang tepat adalah (i), (ii) dan (iv) (Pilihan B)."
    },
    {
        "nomor": 20,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menghitung luas bangun layang-layang dari panjang kedua diagonalnya",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_20_layang_layang.png",
        "teks_soal": "Perhatikan gambar berikut!<br/>{{GAMBAR}}<br/>Berapakah luas layang-layang pada gambar?",
        "opsi": [
            ("A", "$240\\text{ cm}^2$"),
            ("B", "$320\\text{ cm}^2$"),
            ("C", "$360\\text{ cm}^2$"),
            ("D", "$480\\text{ cm}^2$")
        ],
        "kunci": "A",
        "pembahasan": "Dari gambar layang-layang:<br/>• Diagonal $1 (d_1) = 16\\text{ cm}$<br/>• Diagonal $2 (d_2) = 30\\text{ cm}$<br/>Luas layang-layang:<br/>$L = \\frac{d_1 \\times d_2}{2} = \\frac{16 \\times 30}{2} = 240\\text{ cm}^2$ (Pilihan A)."
    },
    {
        "nomor": 21,
        "tipe": "pg_kompleks",
        "kesulitan": "sulit",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menganalisis syarat ketaksamaan segitiga dan keliling segitiga",
        "teks_soal": "Reza menggambar segitiga yang memiliki keliling 45 cm. Manakah segitiga berikut yang mungkin digambar Reza?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Segitiga ABC dengan panjang sisi 18 cm, 18 cm, dan 9 cm"),
            ("B", "Segitiga KLM dengan panjang sisi 16 cm, 15 cm, dan 8 cm"),
            ("C", "Segitiga PQR dengan panjang sisi 21 cm, 14 cm, dan 10 cm")
        ],
        "kunci": "A, C",
        "pembahasan": "Syarat segitiga: keliling $= 45\\text{ cm}$ dan memenuhi ketaksamaan segitiga (jumlah dua sisi terpendek harus lebih besar dari sisi terpanjang):<br/>• Segitiga ABC: $18 + 18 + 9 = 45\\text{ cm}$. Sisi terpendek $18 + 9 = 27 > 18$ (Memenuhi/Benar).<br/>• Segitiga KLM: $16 + 15 + 8 = 39\\text{ cm} \\neq 45\\text{ cm}$ (Salah).<br/>• Segitiga PQR: $21 + 14 + 10 = 45\\text{ cm}$. Sisi terpendek $14 + 10 = 24 > 21$ (Memenuhi/Benar).<br/>Jadi jawaban yang benar adalah A dan C."
    },
    {
        "nomor": 22,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B3. Bangun Ruang",
        "capaian": "Mengidentifikasi bangun ruang berdasarkan karakteristik rusuk, sisi, dan alas",
        "teks_soal": "Perhatikan sifat-sifat bangun ruang berikut!<br/>- Memiliki 2 rusuk lengkung<br/>- Memiliki 3 bidang sisi<br/>- Memiliki alas dan atap berbentuk lingkaran berukuran sama<br/>- Tidak memiliki titik sudut<br/><br/>Bangun ruang yang memiliki sifat-sifat tersebut adalah …",
        "opsi": [
            ("A", "Balok"),
            ("B", "Tabung"),
            ("C", "Limas segi empat"),
            ("D", "Prisma tegak segitiga")
        ],
        "kunci": "B",
        "pembahasan": "Bangun ruang dengan 3 sisi (alas, tutup, selimut), 2 rusuk lengkung, alas dan atap lingkaran identik, serta tanpa titik sudut adalah tabung (Pilihan B)."
    },
    {
        "nomor": 23,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B3. Bangun Ruang",
        "capaian": "Menghitung volume bangun ruang dengan kubus satuan",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_23_susunan_kubus.png",
        "teks_soal": "Perhatikan gambar berikut!<br/>{{GAMBAR}}<br/>Banyak kubus satuan pada bangun ruang tersebut adalah …",
        "opsi": [
            ("A", "24"),
            ("B", "25"),
            ("C", "26"),
            ("D", "27")
        ],
        "kunci": "C",
        "pembahasan": "Menghitung kubus satuan per lapisan:<br/>• Lapisan bawah (dasar): $4 \\times 3 = 12$ kubus<br/>• Lapisan tengah: 8 kubus<br/>• Lapisan atas: 6 kubus<br/>Total kubus satuan $= 12 + 8 + 6 = 26$ kubus satuan (Pilihan C)."
    },
    {
        "nomor": 24,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B3. Bangun Ruang",
        "capaian": "Menghitung volume gabungan kubus dan balok",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_24_bangun_gabungan.png",
        "teks_soal": "Perhatikan gambar di bawah ini!<br/>{{GAMBAR}}<br/>Volume bangun ruang gabungan di atas adalah …",
        "opsi": [
            ("A", "$935\\text{ cm}^3$"),
            ("B", "$940\\text{ cm}^3$"),
            ("C", "$945\\text{ cm}^3$"),
            ("D", "$950\\text{ cm}^3$")
        ],
        "kunci": "C",
        "pembahasan": "Bangun gabungan terdiri atas kubus dan balok:<br/>• Volume kubus $(s = 7\\text{ cm}) = 7^3 = 343\\text{ cm}^3$<br/>• Volume balok $(p = 14\\text{ cm}, l = 7\\text{ cm}, t = 6\\text{ cm}) = 14 \\times 7 \\times 6 = 588\\text{ cm}^3$<br/>$\\text{Volume Total} = 343 + 588 = 945\\text{ cm}^3$ (Pilihan C)."
    },
    {
        "nomor": 25,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel",
        "capaian": "Menyusun tabel frekuensi yang tepat berdasarkan data acak pilihan ekstrakurikuler",
        "tabel_soal": {
            "header": [],
            "baris": [
                ["Musik", "Pencak silat", "Musik", "Bola basket", "Futsal", "Musik"],
                ["Musik", "Bola basket", "Bola basket", "Pencak silat", "Bola basket", "Pencak silat"],
                ["Bola basket", "Futsal", "Futsal", "Futsal", "Futsal", "Pencak silat"],
                ["Futsal", "Pencak silat", "Bola basket", "Pencak silat", "Futsal", "Musik"],
                ["Bola basket", "Bola basket", "Musik", "Futsal", "Futsal", "Musik"]
            ]
        },
        "teks_soal": "Berikut data ektrakulikuler yang diikuti siswa kelas 6:<br/><br/>Penyajian data tersebut ke dalam bentuk tabel yang benar adalah …",
        "opsi_tabel": [
            ("A", {
                "header": ["Ekstrakulikuler", "Banyak Siswa"],
                "baris": [
                    ["pencak silat", "7"],
                    ["bola basket", "8"],
                    ["futsal", "9"],
                    ["musik", "6"]
                ]
            }),
            ("B", {
                "header": ["Ekstrakulikuler", "Banyak Siswa"],
                "baris": [
                    ["pencak silat", "6"],
                    ["bola basket", "9"],
                    ["futsal", "7"],
                    ["musik", "8"]
                ]
            }),
            ("C", {
                "header": ["Ekstrakulikuler", "Banyak Siswa"],
                "baris": [
                    ["pencak silat", "6"],
                    ["bola basket", "9"],
                    ["futsal", "8"],
                    ["musik", "7"]
                ]
            }),
            ("D", {
                "header": ["Ekstrakulikuler", "Banyak Siswa"],
                "baris": [
                    ["pencak silat", "6"],
                    ["bola basket", "8"],
                    ["futsal", "9"],
                    ["musik", "7"]
                ]
            })
        ],
        "kunci": "D",
        "pembahasan": "Menghitung frekuensi kemunculan tiap ekstrakurikuler dari 30 data siswa:<br/>• Pencak silat = 6 siswa<br/>• Bola basket = 8 siswa<br/>• Futsal = 9 siswa<br/>• Musik = 7 siswa<br/>Total $= 6 + 8 + 9 + 7 = 30$ siswa.<br/>Tabel yang menyajikan data secara tepat adalah Pilihan D."
    },
    {
        "nomor": 26,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "C. Data - C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel",
        "capaian": "Menentukan banyak data dengan kriteria lebih dari nilai tertentu pada tabel",
        "tabel_soal": {
            "header": ["Berat badan (kg)", "Banyak balita (orang)"],
            "baris": [
                ["4", "3"],
                ["5", "9"],
                ["6", "4"],
                ["7", "7"],
                ["8", "2"],
                ["9", "5"],
                ["10", "4"]
            ]
        },
        "teks_soal": "Perhatikan tabel yang menyajikan data berat badan balita (0 – 12 bulan) di Posyandu Sehat Sejahtera berikut!<br/><br/>Balita yang memiliki berat badan lebih dari 6,5 kg sebanyak …",
        "opsi": [
            ("A", "11 orang"),
            ("B", "16 orang"),
            ("C", "18 orang"),
            ("D", "22 orang")
        ],
        "kunci": "C",
        "pembahasan": "Balita dengan berat badan lebih dari 6,5 kg adalah kelompok balita dengan berat 7 kg, 8 kg, 9 kg, dan 10 kg:<br/>$$7 + 2 + 5 + 4 = 18\\text{ orang}$$<br/>Jadi ada 18 balita (Pilihan C)."
    },
    {
        "nomor": 27,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "C. Data - C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel",
        "capaian": "Menilai ketepatan pernyataan berdasarkan data tabel kegemaran olahraga",
        "tabel_soal": {
            "header": ["Jenis olahraga", "Banyak siswa"],
            "baris": [
                ["Renang", "12"],
                ["Bulu tangkis", "8"],
                ["Futsal", "24"],
                ["Bola basket", "6"]
            ]
        },
        "teks_soal": "Perhatikan tabel jenis olahraga kegemaran siswa kelas 6 berikut!<br/><br/>Berdasarkan tabel tersebut, manakah pernyataan berikut yang tepat dan tidak tepat? Berilah tanda centang (✓) pada kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Jenis olahraga yang paling digemari siswa adalah futsal", "Tepat"),
            ("Banyak siswa yang gemar renang dua kali lipat dari bola basket", "Tepat"),
            ("Selisih siswa yang gemar futsal dan bulu tangkis adalah 15 orang", "Tidak tepat"),
            ("Jumlah seluruh siswa kelas 6 adalah 50 orang", "Tepat")
        ],
        "kunci": "Tepat, Tepat, Tidak tepat, Tepat",
        "pembahasan": "Dari tabel jenis olahraga:<br/>• Renang = 12, Bulu tangkis = 8, Futsal = 24, Bola basket = 6.<br/>Analisis pernyataan:<br/>1. Paling digemari adalah futsal (24 orang) (Tepat).<br/>2. Renang (12 orang) $= 2 \\times$ Bola basket (6 orang) (Tepat).<br/>3. Selisih futsal dan bulu tangkis $= 24 - 8 = 16\\text{ orang}$, bukan 15 orang (Tidak tepat).<br/>4. Total siswa $= 12 + 8 + 24 + 6 = 50\\text{ orang}$ (Tepat)."
    },
    {
        "nomor": 28,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C2. Membaca dan menyajikan data dalam bentuk diagram",
        "capaian": "Menyajikan data frekuensi ulangan ke dalam diagram batang yang sesuai",
        "teks_soal": "Berikut data nilai hasil ulangan Bahasa Indonesia dari 30 siswa kelas VI SD Sukamaju:<br/>• Nilai 60 diperoleh 4 siswa<br/>• Nilai 70 diperoleh 8 siswa<br/>• Nilai 80 diperoleh 10 siswa<br/>• Nilai 90 diperoleh 6 siswa<br/>• Nilai 100 diperoleh 2 siswa<br/><br/>Diagram batang yang sesuai dengan data tersebut adalah …",
        "opsi_gambar": [
            ("A", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_a.png"),
            ("B", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_b.png"),
            ("C", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_c.png"),
            ("D", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_d.png")
        ],
        "kunci": "A",
        "pembahasan": "Cocokkan tinggi batang dengan frekuensi nilai:<br/>• Nilai 60 tinggi 4<br/>• Nilai 70 tinggi 8<br/>• Nilai 80 tinggi 10<br/>• Nilai 90 tinggi 6<br/>• Nilai 100 tinggi 2<br/>Diagram batang yang menunjukkan data tersebut secara tepat adalah diagram pada Pilihan A."
    },
    {
        "nomor": 29,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C2. Membaca dan menyajikan data dalam bentuk diagram",
        "capaian": "Menghitung banyak siswa dari diagram lingkaran persentase",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_29_diagram_lingkaran.png",
        "teks_soal": "Perhatikan diagram lingkaran berikut!<br/>{{GAMBAR}}<br/>Diagram lingkaran tersebut menggambarkan kegiatan ekstrakurikuler yang dipilih siswa kelas VI SD Nusa Bangsa. Jika siswa kelas VI berjumlah 50 orang, maka siswa yang suka bulu tangkis adalah …",
        "opsi": [
            ("A", "16 orang"),
            ("B", "14 orang"),
            ("C", "12 orang"),
            ("D", "10 orang")
        ],
        "kunci": "B",
        "pembahasan": "Dari diagram lingkaran:<br/>Persentase bulu tangkis $= 28\\%$.<br/>Banyak siswa yang suka bulu tangkis:<br/>$= \\frac{28}{100} \\times 50 = \\frac{28}{2} = 14\\text{ orang}$ (Pilihan B)."
    },
    {
        "nomor": 30,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "C. Data - C2. Membaca dan menyajikan data dalam bentuk diagram",
        "capaian": "Menganalisis perbandingan data pada diagram batang penjualan buah",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_30_diagram_batang.png",
        "teks_soal": "Perhatikan diagram batang berikut!<br/>{{GAMBAR}}<br/>Berdasarkan diagram tersebut, pernyataan yang benar adalah …<br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Penjualan buah apel lebih banyak daripada buah mangga"),
            ("B", "Buah yang paling banyak terjual adalah semangka"),
            ("C", "Selisih penjualan buah melon dan jeruk adalah 10 kg"),
            ("D", "Total seluruh penjualan buah adalah 300 kg")
        ],
        "kunci": "B, C",
        "pembahasan": "Berdasarkan diagram batang penjualan buah:<br/>• Penjualan buah paling tinggi adalah semangka (Pernyataan B Benar).<br/>• Selisih melon (35 kg) dan jeruk (25 kg) $= 35 - 25 = 10\\text{ kg}$ (Pernyataan C Benar)."
    }
]

def render_html():
    articles = []
    for q in SOAL_MAT:
        num = q["nomor"]
        tipe = q["tipe"]
        kes = q["kesulitan"]
        materi = q["materi"]
        cp = q["capaian"]
        gambar = q.get("gambar")
        tabel_soal = q.get("tabel_soal")
        teks_soal = q["teks_soal"]
        kunci = q["kunci"]
        pembahasan = q["pembahasan"]

        art = [
            f'  <article data-gemilang-question data-nomor="{num}" data-paket="1" data-tipe="{tipe}" data-mapel="Matematika" data-kelas="6" data-kesulitan="{kes}">',
            f'    <div data-field="materi">{materi}</div>',
            f'    <div data-field="capaian_pembelajaran">{cp}</div>'
        ]

        if gambar:
            art.append('    <div data-field="gambar">')
            art.append(f'      <img src="{gambar}" data-url="{gambar}" alt="Ilustrasi Soal {num}" style="max-width:100%; max-height:280px; display:block; margin:10px auto; border-radius:8px; border:1px solid #cbd5e1;" />')
            art.append('    </div>')

        if tabel_soal:
            art.append('    <div data-field="tabel_soal">')
            art.append('      <table style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #cbd5e1; font-size:13.5px;">')
            if tabel_soal.get("header") and len(tabel_soal["header"]) > 0:
                art.append('        <thead>')
                art.append('          <tr style="background:#f1f5f9;">')
                for h in tabel_soal["header"]:
                    art.append(f'            <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">{h}</th>')
                art.append('          </tr>')
                art.append('        </thead>')
            art.append('        <tbody>')
            for row in tabel_soal.get("baris", []):
                art.append('          <tr>')
                for cell in row:
                    align = "center" if not tabel_soal.get("header") else ("left" if not cell.isdigit() else "center")
                    art.append(f'            <td style="border:1px solid #cbd5e1; padding:8px; text-align:{align};">{cell}</td>')
                art.append('          </tr>')
            art.append('        </tbody>')
            art.append('      </table>')
            art.append('    </div>')

        art.append('    <div data-field="teks_soal">')
        art.append(f'      <p>{teks_soal}</p>')
        art.append('    </div>')

        if "opsi_tabel" in q:
            art.append('    <ol data-field="opsi_jawaban">')
            for lbl, tbl in q["opsi_tabel"]:
                art.append(f'      <li data-label="{lbl}">')
                art.append('        <table style="border-collapse:collapse; margin:4px 0; border:1px solid #cbd5e1; font-size:12.5px;">')
                if tbl.get("header"):
                    art.append('          <thead><tr style="background:#f1f5f9;">')
                    for h in tbl["header"]:
                        art.append(f'            <th style="border:1px solid #cbd5e1; padding:5px 12px; text-align:left;">{h}</th>')
                    art.append('          </tr></thead>')
                art.append('          <tbody>')
                for row in tbl["baris"]:
                    art.append('            <tr>')
                    for cell in row:
                        art.append(f'              <td style="border:1px solid #cbd5e1; padding:4px 12px;">{cell}</td>')
                    art.append('            </tr>')
                art.append('          </tbody>')
                art.append('        </table>')
                art.append('      </li>')
            art.append('    </ol>')

        elif "opsi_gambar" in q:
            art.append('    <ol data-field="opsi_jawaban">')
            for lbl, g_path in q["opsi_gambar"]:
                art.append(f'      <li data-label="{lbl}"><img src="{g_path}" data-url="{g_path}" alt="Opsi {lbl} Soal {num}" style="max-width:100%; max-height:160px; border-radius:6px; border:1px solid #e2e8f0;" /></li>')
            art.append('    </ol>')

        elif tipe in ["pg_sederhana", "pg_kompleks"]:
            art.append('    <ol data-field="opsi_jawaban">')
            for lbl, t in q.get("opsi", []):
                art.append(f'      <li data-label="{lbl}">{t}</li>')
            art.append('    </ol>')

        elif tipe in ["benar_salah", "pg_kategori"]:
            art.append('    <ul data-field="pernyataan">')
            for t, jwb in q.get("pernyataan", []):
                art.append(f'      <li data-jawaban="{jwb}">{t}</li>')
            art.append('    </ul>')

        art.append(f'    <meta data-field="kunci_jawaban" data-value="{kunci}" />')
        art.append('    <meta data-field="kunci_terverifikasi" data-value="true" />')
        art.append('    <div data-field="pembahasan">')
        art.append(f'      <p>{pembahasan}</p>')
        art.append('    </div>')
        art.append('  </article>')

        articles.append("\n".join(art))

    html = f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Try Out I TKA Matematika SD/MI 2025/2026 - Master Impor Gemilang</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }}
    header {{
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }}
    h1 {{
      font-size: 22px;
      color: #0f172a;
      margin: 0 0 6px 0;
    }}
    .subtitle {{
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }}
    article {{
      border-bottom: 1px solid #e2e8f0;
      padding: 24px 0;
    }}
    [data-field="materi"] {{
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }}
    [data-field="capaian_pembelajaran"] {{
      font-size: 12px;
      color: #64748b;
      margin-bottom: 12px;
    }}
    [data-field="teks_soal"] {{
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 14px;
    }}
    ol[data-field="opsi_jawaban"] {{
      margin: 0 0 16px 20px;
      padding: 0;
    }}
    ol[data-field="opsi_jawaban"] li {{
      margin-bottom: 8px;
    }}
    ul[data-field="pernyataan"] {{
      list-style-type: none;
      padding: 0;
      margin: 0 0 16px 0;
    }}
    ul[data-field="pernyataan"] li {{
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 6px;
    }}
    [data-field="pembahasan"] {{
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 12px 16px;
      font-size: 13.5px;
      color: #166534;
      border-radius: 0 8px 8px 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>TRY OUT I TES KEMAMPUAN AKADEMIK (TKA) SD/MI</h1>
      <div class="subtitle">Mata Pelajaran: NUMERISASI / MATEMATIKA | Kelas VI | KKG Rejotangan Tulungagung 2025/2026</div>
    </header>
{chr(10).join(articles)}
  </div>
</body>
</html>
"""
    return html

if __name__ == "__main__":
    content = render_html()
    paths = [
        "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_matematika_sd_2026_lengkap.html",
        "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/data/impor/to1_tka_matematika_sd_2026_lengkap.html"
    ]
    for p in paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Generated ({len(content)} bytes): {p}")
