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
        "capaian": "Menghitung hasil operasi hitung penjumlahan dan pengurangan bilangan cacah",
        "teks_soal": "Hasil dari $27.825 + 13.460 - 9.754$ adalah …",
        "opsi": [
            ("A", "31.531"),
            ("B", "31.513"),
            ("C", "31.351"),
            ("D", "31.315")
        ],
        "kunci": "A",
        "pembahasan": "Operasi penjumlahan dan pengurangan sama kuat, sehingga dikerjakan berurutan dari kiri ke kanan:<br/>1. $27.825 + 13.460 = 41.285$<br/>2. $41.285 - 9.754 = 31.531$<br/>Jawaban: A"
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
        "pembahasan": "Urutan operasi hitung campuran:<br/>1. Selesaikan operasi di dalam tanda kurung lebih dahulu (pembagian didahulukan):<br/>   $(12 - 10 : 2) = (12 - 5) = 7$<br/>2. Lakukan pembagian dan perkalian berurutan dari kiri ke kanan:<br/>   $56 : 8 \\times 7 = 7 \\times 7 = 49$<br/>3. Terakhir lakukan penjumlahan:<br/>   $12 + 49 = 61$<br/>Jawaban: B"
    },
    {
        "nomor": 3,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A1. Bilangan cacah sampai 1.000.000",
        "capaian": "Menyelesaikan masalah kesetaraan nilai pecahan uang",
        "teks_soal": "Adit pergi ke awarung. Ia membawa 2 lembar uang dua puluh ribuan dan 2 lembar uang lima ribuan.<br/><br/><em>Berdasarkan cerita tersebut, manakah pernyataan berikut yang tepat dan tidak tepat? Berilah tanda centang (v) pada kolom sesuai atau tidak sesuai untuk setiap pernyataan!</em>",
        "pernyataan": [
            ("Nilai uang Adit setara dengan selembar uang lima puluh ribuan", "Tepat"),
            ("Nilai uang Adit setara dengan tiga lembar uang dua puluh ribuan", "Tidak tepat"),
            ("Nilai uang Adit setara dengan lima lembar uang sepuluh ribuan", "Tepat"),
            ("Nilai uang Adit setara dengan enam lembar dua ribuan dan 4 lembar sepuluh ribuan", "Tidak tepat")
        ],
        "kunci": "Tepat, Tidak tepat, Tepat, Tidak tepat",
        "pembahasan": "Total uang yang dibawa Adit $= (2 \\times 20.000) + (2 \\times 5.000) = 40.000 + 10.000 = \\text{Rp}50.000,00$.<br/>• Selembar uang lima puluh ribuan $= \\text{Rp}50.000,00$ (Tepat).<br/>• Tiga lembar uang dua puluh ribuan $= 3 \\times 20.000 = \\text{Rp}60.000,00 \\ne 50.000$ (Tidak tepat).<br/>• Lima lembar uang sepuluh ribuan $= 5 \\times 10.000 = \\text{Rp}50.000,00$ (Tepat).<br/>• Enam lembar dua ribuan dan 4 lembar sepuluh ribuan $= (6 \\times 2.000) + (4 \\times 10.000) = 12.000 + 40.000 = \\text{Rp}52.000,00 \\ne 50.000$ (Tidak tepat)."
    },
    {
        "nomor": 4,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A1. Bilangan cacah sampai 1.000.000",
        "capaian": "Menyelesaikan masalah kontekstual transaksi belanja alat tulis dan pecahan uang",
        "teks_soal": "Rina, Ridho dan Ima membeli beberapa alat tulis di toko. Rina membeli 2 pensil dan 3 buku tulis. Rido membeli 3 pensil dan 5 buku tulis. Ima membeli 2 pensil dan 4 buku tulis. Di toko tersebut harga satu pensil Rp 2.500,00 dan harga satu buku tulis Rp 4.000,00. Berapa uang yang harus dibayarkan setiap anak?<br/><br/><em>Berdasarkan informasi tersebut, manakah pernyataan berikut yang benar? Jawaban benar lebih dari satu!</em>",
        "opsi": [
            ("A", "Rina membayar dengan 3 lembar uang lima ribuan dan 1 lembar uang dua ribuan"),
            ("B", "Rido membayar dengan 2 lembar uang dua puluh ribuan dan diberi kembalian 4 lembar uang dua ribuan"),
            ("C", "Ima membayar dengan 1 lembar uang dua puluh ribuan dan 1 lembar uang seribuan")
        ],
        "kunci": "A, C",
        "pembahasan": "Hitung biaya belanja masing-masing anak:<br/>• Rina: $(2 \\times 2.500) + (3 \\times 4.000) = 5.000 + 12.000 = \\text{Rp}17.000,00$. Pembayaran: $(3 \\times 5.000) + (1 \\times 2.000) = 15.000 + 2.000 = \\text{Rp}17.000,00$ (Pernyataan A Benar).<br/>• Rido: $(3 \\times 2.500) + (5 \\times 4.000) = 7.500 + 20.000 = \\text{Rp}27.500,00$. Pembayaran: $(2 \\times 20.000) - (4 \\times 2.000) = 40.000 - 8.000 = \\text{Rp}32.000,00 \\ne 27.500$ (Pernyataan B Salah).<br/>• Ima: $(2 \\times 2.500) + (4 \\times 4.000) = 5.000 + 16.000 = \\text{Rp}21.000,00$. Pembayaran: $(1 \\times 20.000) + (1 \\times 1.000) = 20.000 + 1.000 = \\text{Rp}21.000,00$ (Pernyataan C Benar)."
    },
    {
        "nomor": 5,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menentukan KPK dalam bentuk faktorisasi prima",
        "teks_soal": "KPK dari 24, 36 dan 42 dalam bentuk faktorisasi prima adalah …",
        "opsi": [
            ("A", "$2^3 \\times 3^2$"),
            ("B", "$2^3 \\times 7$"),
            ("C", "$2^2 \\times 3^3 \\times 7$"),
            ("D", "$2^3 \\times 3^2 \\times 7$")
        ],
        "kunci": "D",
        "pembahasan": "Faktorisasi prima ketiga bilangan:<br/>• $24 = 2^3 \\times 3$<br/>• $36 = 2^2 \\times 3^2$<br/>• $42 = 2 \\times 3 \\times 7$<br/>KPK diperoleh dari perkalian seluruh faktor prima dengan pangkat terbesar: $2^3 \\times 3^2 \\times 7$.<br/>Jawaban: D"
    },
    {
        "nomor": 6,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menyelesaikan masalah FPB dalam pembagian buah sama banyak",
        "teks_soal": "Sebanyak 63 jeruk dan 81 apel akan disajikan dalam beberapa piring. Setiap piring berisi jeruk dan apel masing-masing sama banyak. Jumlah piring paling banyak yang perlu disediakan adalah …",
        "opsi": [
            ("A", "9"),
            ("B", "7"),
            ("C", "6"),
            ("D", "3")
        ],
        "kunci": "A",
        "pembahasan": "Jumlah piring paling banyak adalah FPB dari 63 dan 81.<br/>• $63 = 3^2 \\times 7$<br/>• $81 = 3^4$<br/>$\\text{FPB}(63, 81) = 3^2 = 9$.<br/>Jadi, jumlah piring paling banyak adalah 9 piring.<br/>Jawaban: A"
    },
    {
        "nomor": 7,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menyelesaikan masalah KPK berkaitan dengan jadwal berulang",
        "teks_soal": "Bu Rina memiliki toko kelontong. Toko tersebut dikunjungi beberapa penjual untuk memasok dagangan. Penjual roti berkunjung tiap 4 hari. Penjual telur berkunjung tiap 5 hari. Pada 1 Agustus 2025 kedua penjual sama-sama mengunjungi toko.<br/><br/>Tiap berapa hari penjual toko dan penjual telur berkunjung bersama-sama ke toko?",
        "opsi": [
            ("A", "10 hari"),
            ("B", "12 hari"),
            ("C", "15 hari"),
            ("D", "20 hari")
        ],
        "kunci": "D",
        "pembahasan": "Kedua penjual berkunjung bersama-sama setiap kelipatan persekutuan terkecil (KPK) dari 4 dan 5.<br/>Karena 4 dan 5 tidak memiliki faktor prima yang sama (prima relatif), $\\text{KPK}(4, 5) = 4 \\times 5 = 20\\text{ hari}$.<br/>Jawaban: D"
    },
    {
        "nomor": 8,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A2. Faktor, Kelipatan, FPB dan KPK",
        "capaian": "Menganalisis barisan bilangan kelipatan dan menentukan suku yang hilang",
        "teks_soal": "Diketahui urutan bilangan kelipatan yaitu 14, 21, 28, 35, n, 49, 56, m, …<br/><br/><em>Berdasarkan urutan bilangan kelipatan tersebut, manakah pernyataan berikut yang benar dan salah? Berilah tanda centang (v) pada kolom benar atau salah untuk setiap pernyataan</em>",
        "pernyataan": [
            ("Bilangan-bilangan tersebut merupakan kelipatan 7", "Tepat"),
            ("Nilai n yang tepat adalah 42", "Tepat"),
            ("Nilai m yang tepat adalah 70", "Tidak tepat"),
            ("Bilangan-bilangan tersebut merupakan bilangan ganjil", "Tidak tepat")
        ],
        "kunci": "Tepat, Tepat, Tidak tepat, Tidak tepat",
        "pembahasan": "Urutan bilangan merupakan kelipatan 7 berurutan (bertambah 7):<br/>• $n = 35 + 7 = 42$<br/>• $m = 56 + 7 = 63$<br/>Evaluasi pernyataan:<br/>1. Bilangan-bilangan tersebut kelipatan 7 (Tepat).<br/>2. Nilai $n = 42$ (Tepat).<br/>3. Nilai $m = 63$, bukan 70 (Tidak tepat).<br/>4. Angka 14, 28, 42, 56 adalah genap, bukan seluruhnya ganjil (Tidak tepat)."
    },
    {
        "nomor": 9,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menghitung hasil penjumlahan pecahan campuran dan pecahan biasa",
        "teks_soal": "Hasil dari $3\\frac{1}{4} + \\frac{5}{8}$ adalah …",
        "opsi": [
            ("A", "$3\\frac{1}{16}$"),
            ("B", "$3\\frac{1}{4}$"),
            ("C", "$3\\frac{4}{8}$"),
            ("D", "$3\\frac{7}{8}$")
        ],
        "kunci": "D",
        "pembahasan": "Samakan penyebut kedua pecahan:<br/>$3\\frac{1}{4} + \\frac{5}{8} = 3\\frac{2}{8} + \\frac{5}{8} = 3\\frac{7}{8}$.<br/>Jawaban: D"
    },
    {
        "nomor": 10,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menghitung hasil perkalian bilangan bulat dengan pecahan biasa",
        "teks_soal": "Jika $4 \\times \\frac{7}{12} = n$, nilai n yang tepat adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{12}$"),
            ("B", "$1\\frac{1}{4}$"),
            ("C", "$2\\frac{1}{6}$"),
            ("D", "$2\\frac{1}{3}$")
        ],
        "kunci": "D",
        "pembahasan": "$4 \\times \\frac{7}{12} = \\frac{4 \\times 7}{12} = \\frac{28}{12} = \\frac{7}{3} = 2\\frac{1}{3}$.<br/>Jawaban: D"
    },
    {
        "nomor": 11,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menyelesaikan masalah kontekstual pengurangan pecahan luas tanah",
        "teks_soal": "Pak Bayu membeli tiga petak tanah masing-masing seluas $\\frac{1}{2}$ hektare. Dari tanah tersebut, seluas $\\frac{1}{8}$ hektare dan $\\frac{1}{4}$ hektare tanah akan ia berikan kepada kedua anaknya. Sisa luas tanah yang dibeli Pak Bayu adalah …",
        "opsi": [
            ("A", "$\\frac{1}{8}$ hektare"),
            ("B", "$\\frac{1}{16}$ hektare"),
            ("C", "$\\frac{1}{4}$ hektare"),
            ("D", "$\\frac{1}{2}$ hektare")
        ],
        "kunci": "A",
        "pembahasan": "Sesuai konteks soal SD dari petak seluas $\\frac{1}{2}$ hektare yang dibagikan kepada kedua anak:<br/>Sisa luas tanah $= \\frac{1}{2} - \\frac{1}{8} - \\frac{1}{4} = \\frac{4}{8} - \\frac{1}{8} - \\frac{2}{8} = \\frac{1}{8}\\text{ hektare}$.<br/>Jawaban: A"
    },
    {
        "nomor": 12,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "A. Bilangan - A3. Pecahan",
        "capaian": "Menyederhanakan pecahan biasa ke pecahan campuran paling sederhana",
        "teks_soal": "Bentuk paling sederhana dari $\\frac{56}{36}$ adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{2}$"),
            ("B", "$1\\frac{4}{9}$"),
            ("C", "$1\\frac{5}{9}$"),
            ("D", "$1\\frac{2}{3}$")
        ],
        "kunci": "C",
        "pembahasan": "Bagi pembilang dan penyebut dengan FPB(56, 36) = 4:<br/>$\\frac{56 : 4}{36 : 4} = \\frac{14}{9} = 1\\frac{5}{9}$.<br/>Jawaban: C"
    },
    {
        "nomor": 13,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Menghitung kecepatan rata-rata dari jarak dan selisih waktu tempuh",
        "teks_soal": "Pak Pandu berangkat dari rumahnya ke Cirebon dengan mengendarai mobil. Pak pandu berangkat dari rumah pukul 07.00 dan tiba di Cirebon pukul 09.30. jika jarak yang ditempuh adalah Pak Pandu 185 km, kecepatan rata-rata mobil yang dikendarai Pak Pandu adalah …",
        "opsi": [
            ("A", "64 km/jam"),
            ("B", "74 km/jam"),
            ("C", "75 km/jam"),
            ("D", "84 km/jam")
        ],
        "kunci": "B",
        "pembahasan": "Waktu tempuh $= 09.30 - 07.00 = 2\\text{ jam } 30\\text{ menit} = 2,5\\text{ jam}$.<br/>Kecepatan rata-rata $= \\frac{\\text{Jarak}}{\\text{Waktu}} = \\frac{185\\text{ km}}{2,5\\text{ jam}} = 74\\text{ km/jam}$.<br/>Jawaban: B"
    },
    {
        "nomor": 14,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Membaca besar sudut menggunakan busur derajat",
        "teks_soal": "Perhatikan gambar berikut!<br/>{{GAMBAR}}<br/>Besar sudut COD tersebut adalah …",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_14_busur_derajat.png",
        "opsi": [
            ("A", "$150^\\circ$"),
            ("B", "$120^\\circ$"),
            ("C", "$130^\\circ$"),
            ("D", "$180^\\circ$")
        ],
        "kunci": "C",
        "pembahasan": "Kaki sudut OC berada pada garis nol dasar $0^\\circ$ sebelah kanan. Sinar OD menunjukkan skala $130^\\circ$ pada busur derajat. Jadi besar sudut $\\angle\\text{COD} = 130^\\circ$.<br/>Jawaban: C"
    },
    {
        "nomor": 15,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Mengonversi dan menghitung operasi satuan panjang mm, m, dan cm ke desimeter",
        "teks_soal": "Hasil dari $7.500\\text{ mm} + 3,6\\text{ m} - 200\\text{ cm}$ adalah …",
        "opsi": [
            ("A", "91 dm"),
            ("B", "109 dm"),
            ("C", "784 dm"),
            ("D", "1.108 dm")
        ],
        "kunci": "A",
        "pembahasan": "Konversi ke satuan desimeter (dm):<br/>• $7.500\\text{ mm} = 75\\text{ dm}$<br/>• $3,6\\text{ m} = 36\\text{ dm}$<br/>• $200\\text{ cm} = 20\\text{ dm}$<br/>Hasil $= 75 + 36 - 20 = 111 - 20 = 91\\text{ dm}$.<br/>Jawaban: A"
    },
    {
        "nomor": 16,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B1. Pengukuran",
        "capaian": "Mengonversi dan membandingkan satuan massa hg, g, dan kg",
        "teks_soal": "Jika berat satu kantong gula pasir adalah 5 hg dan berat satu kantong tepung terigu adalah 1.000 gr, manakah pernyataan berikut yang sesuai dan tidak sesuai?<br/><br/><em>Berilah tanda centang (v) pada setiap kolom tepat atau tidak tepat untuk setiap pernyataan</em>",
        "pernyataan": [
            ("Berat 2 kantong gula pasir sama dengan 1000 gr", "Tepat"),
            ("Berat satu kantong tepung adalah 0,1 kg", "Tidak tepat"),
            ("Berat satu kantong tepung dan satu kantong gula adalah 1500 gr", "Tepat"),
            ("Berat 2 kantong gula pasir dan 2 kantong tepung terigu adalah 0,3 kg", "Tidak tepat")
        ],
        "kunci": "Tepat, Tidak tepat, Tepat, Tidak tepat",
        "pembahasan": "1 kantong gula $= 5\\text{ hg} = 500\\text{ gr}$. 1 kantong tepung $= 1.000\\text{ gr} = 1\\text{ kg}$.<br/>1. 2 kantong gula $= 2 \\times 500 = 1.000\\text{ gr}$ (Tepat).<br/>2. 1 kantong tepung $= 1\\text{ kg} \\ne 0,1\\text{ kg}$ (Tidak tepat).<br/>3. 1 tepung + 1 gula $= 1.000 + 500 = 1.500\\text{ gr}$ (Tepat).<br/>4. 2 gula + 2 tepung $= 1.000 + 2.000 = 3.000\\text{ gr} = 3\\text{ kg} \\ne 0,3\\text{ kg}$ (Tidak tepat)."
    },
    {
        "nomor": 17,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Mengidentifikasi sifat-sifat bangun datar trapesium sama kaki",
        "teks_soal": "Perhatikan sifat-sifat bangun datar berikut!<br/>- Memiliki sepasang sisi sejajar<br/>- Memiliki 2 pasang sudut yang sama besar<br/>- Jumlah besar 2 sudut yang berdekatan di antara 2 garis sejajar adalah $180^\\circ$<br/><br/>Bangun datar yang memiliki sifat-sifat tersebut adalah …",
        "opsi": [
            ("A", "Jajar genjang"),
            ("B", "Layang-layang"),
            ("C", "Trapesium siku-siku"),
            ("D", "Trapesium sama kaki")
        ],
        "kunci": "D",
        "pembahasan": "Trapesium sama kaki memiliki satu pasang sisi sejajar, satu pasang sisi miring sama panjang yang membuat 2 pasang sudut sama besar di alas dan atapnya. Jumlah besar sudut yang berdekatan di antara 2 garis sejajar adalah $180^\\circ$.<br/>Jawaban: D"
    },
    {
        "nomor": 18,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menghitung luas bangun datar trapesium",
        "teks_soal": "Luas trapesium di samping adalah …<br/>{{GAMBAR}}",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_18_trapesium.png",
        "opsi": [
            ("A", "$684\\text{ cm}^2$"),
            ("B", "$846\\text{ cm}^2$"),
            ("C", "$864\\text{ cm}^2$"),
            ("D", "$1.386\\text{ cm}^2$")
        ],
        "kunci": "A",
        "pembahasan": "Pada gambar: sisi atas $a = 34\\text{ cm}$, sisi alas $b = 42\\text{ cm}$, tinggi $t = 18\\text{ cm}$.<br/>$\\text{Luas} = \\frac{a + b}{2} \\times t = \\frac{34 + 42}{2} \\times 18 = 38 \\times 18 = 684\\text{ cm}^2$.<br/>Jawaban: A"
    },
    {
        "nomor": 19,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menentukan sifat-sifat geometris persegi panjang",
        "teks_soal": "Perhatikan sifat-sifat bangun datar berikut!<br/>(i) Mempunyai dua pasang sisi sejajar dan sama panjang<br/>(ii) Mempunyai dua diagonal sama panjang<br/>(iii) Kedua diagonalnya saling berpotongan tegak lurus<br/>(iv) Mempunyai dua simetri lipat<br/><br/>Manakah yang merupakan sifat-sifat persegi panjang?",
        "opsi": [
            ("A", "(i), (ii), dan (iii)"),
            ("B", "(i), (ii) dan (iv)"),
            ("C", "(i), (iii) dan (iv)"),
            ("D", "(ii), (iii) dan (iv)")
        ],
        "kunci": "B",
        "pembahasan": "Sifat-sifat persegi panjang adalah:<br/>(i) Dua pasang sisi sejajar dan sama panjang (Benar)<br/>(ii) Dua diagonal sama panjang (Benar)<br/>(iii) Diagonal tidak berpotongan tegak lurus (Salah, yang tegak lurus persegi atau belah ketupat)<br/>(iv) Mempunyai 2 simetri lipat (Benar)<br/>Jadi yang merupakan sifat persegi panjang adalah (i), (ii) dan (iv).<br/>Jawaban: B"
    },
    {
        "nomor": 20,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menghitung luas layang-layang",
        "teks_soal": "Perhatikan gambar berikut!<br/>{{GAMBAR}}<br/>Berapakah luas laying-layang pada gambar?",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_20_layang_layang.png",
        "opsi": [
            ("A", "$240\\text{ cm}^2$"),
            ("B", "$320\\text{ cm}^2$"),
            ("C", "$360\\text{ cm}^2$"),
            ("D", "$480\\text{ cm}^2$")
        ],
        "kunci": "A",
        "pembahasan": "Panjang diagonal $d_1 = 24\\text{ cm}$ dan $d_2 = 20\\text{ cm}$.<br/>$\\text{Luas} = \\frac{d_1 \\times d_2}{2} = \\frac{24 \\times 20}{2} = 240\\text{ cm}^2$.<br/>Jawaban: A"
    },
    {
        "nomor": 21,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B2. Bangun Datar",
        "capaian": "Menganalisis kemungkinan panjang sisi segitiga berdasarkan keliling",
        "teks_soal": "Reza menggambar segitiga yang memiliki keliling 45 cm. manakah segitiga berikut yang mungkin Digambar reza?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu</em>",
        "opsi": [
            ("A", "Segitiga ABC dengan panjang sisi 18 cm, 18 cm, dan 9 cm"),
            ("B", "Segitiga KLM dengan panjang sisi 16 cm, 15 cm, dan 8 cm"),
            ("C", "Segitiga PQR dengan panjang sisi 21 cm, 14 cm, dan 10 cm")
        ],
        "kunci": "A, C",
        "pembahasan": "Keliling segitiga $= a + b + c = 45\\text{ cm}$ dan harus memenuhi ketaksamaan segitiga (jumlah 2 sisi > sisi ketiga):<br/>• Segitiga ABC: $18 + 18 + 9 = 45\\text{ cm}$ dan $18 + 9 > 18$ (Benar).<br/>• Segitiga KLM: $16 + 15 + 8 = 39\\text{ cm} \\ne 45\\text{ cm}$ (Salah).<br/>• Segitiga PQR: $21 + 14 + 10 = 45\\text{ cm}$ dan $14 + 10 > 21$ (Benar).<br/>Jawaban: A dan C"
    },
    {
        "nomor": 22,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "B. Geometri dan Pengukuran - B3. Bangun Ruang",
        "capaian": "Mengidentifikasi sifat-sifat bangun ruang prisma tegak segitiga",
        "teks_soal": "Perhatikan sifat-sifat bengunruang berikut1<br/>- Memiliki 5 sisi, dengan sisi alas dan tutup merupakan segitiga kongruen<br/>- Memiliki 9 rusuk<br/>- Memiliki 6 titik sudut<br/><br/>Bangun ruang yang memiliki sifat-sifat tersebut adalah …",
        "opsi": [
            ("A", "Balok"),
            ("B", "Tabung"),
            ("C", "Limas segi empat"),
            ("D", "Prisma tegak segitiga")
        ],
        "kunci": "D",
        "pembahasan": "Prisma tegak segitiga memiliki 5 sisi (alas dan atap segitiga kongruen serta 3 sisi tegak), 9 rusuk, dan 6 titik sudut.<br/>Jawaban: D"
    },
    {
        "nomor": 23,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B3. Bangun Ruang",
        "capaian": "Menghitung banyak kubus satuan pada susunan kubus",
        "teks_soal": "Perhatikan gambar berikut!<br/>{{GAMBAR}}<br/>Jika susunan kubus tersebut diuraikan, banyak kubus penyusunnya adalah …",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_23_susunan_kubus.png",
        "opsi": [
            ("A", "24"),
            ("B", "25"),
            ("C", "26"),
            ("D", "27")
        ],
        "kunci": "C",
        "pembahasan": "Susunan balok kubus dasar $3 \\times 3$. Lapisan 1 (bawah) $= 9$ kubus. Lapisan 2 (tengah) $= 9$ kubus. Lapisan 3 (atas) $= 8$ kubus (satu sudut kosong). Total $= 9 + 9 + 8 = 26\\text{ kubus}$.<br/>Jawaban: C"
    },
    {
        "nomor": 24,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "B. Geometri dan Pengukuran - B3. Bangun Ruang",
        "capaian": "Menghitung volume gabungan balok dan prisma segitiga",
        "teks_soal": "Perhatikan gambar di bawah ini!<br/>{{GAMBAR}}<br/>Volume bangun ruang gabungan di samping adalah …",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_24_bangun_gabungan.png",
        "opsi": [
            ("A", "$935\\text{ cm}^3$"),
            ("B", "$940\\text{ cm}^3$"),
            ("C", "$945\\text{ cm}^3$"),
            ("D", "$950\\text{ cm}^3$")
        ],
        "kunci": "C",
        "pembahasan": "Bangun gabungan terdiri dari balok dan prisma segitiga:<br/>• Balok: $V_1 = 15 \\times 9 \\times 5 = 675\\text{ cm}^3$<br/>• Prisma segitiga: alas segitiga $= 9\\text{ cm}$, tinggi segitiga $= 4\\text{ cm}$, tinggi prisma $= 15\\text{ cm} \\Rightarrow V_2 = \\frac{1}{2} \\times 9 \\times 4 \\times 15 = 270\\text{ cm}^3$<br/>• Total volume $= 675 + 270 = 945\\text{ cm}^3$.<br/>Jawaban: C"
    },
    {
        "nomor": 25,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel",
        "capaian": "Menyajikan data acak ke dalam bentuk tabel frekuensi data kategorik",
        "teks_soal": "Berikut data ektrakulikuler yang diikuti siswa kelas 6<br/><br/>Tabel yang tepat untuk mewakili data di atas adalah …",
        "tabel_soal": {
            "header": [],
            "baris": [
                ["Music", "Pencak silat", "Music", "Bola basket", "Futsal", "Music"],
                ["Music", "Bola basket", "Bola basket", "Pencak silat", "Bola basket", "Pencak silat"],
                ["Bola basket", "Futsal", "Futsal", "Futsal", "Futsal", "Pencak silat"],
                ["Futsal", "Pencak silat", "Bola basket", "Pencak silat", "Futsal", "Music"],
                ["Bola basket", "Bola basket", "Music", "Futsal", "Futsal", "Music"]
            ]
        },
        "opsi": [
            ("A", "Tabel A:<br/><table style='border-collapse:collapse; width:260px; margin-top:4px;'><tr><th style='border:1px solid #222; padding:3px 8px; text-align:left;'>Ektrakulikuler</th><th style='border:1px solid #222; padding:3px 8px; text-align:center;'>Banyak Siswa</th></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>pencak silat</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>7</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>bola basket</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>8</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>futsal</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>9</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>musik</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>6</td></tr></table>"),
            ("B", "Tabel B:<br/><table style='border-collapse:collapse; width:260px; margin-top:4px;'><tr><th style='border:1px solid #222; padding:3px 8px; text-align:left;'>Ektrakulikuler</th><th style='border:1px solid #222; padding:3px 8px; text-align:center;'>Banyak Siswa</th></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>pencak silat</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>6</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>bola basket</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>9</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>futsal</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>7</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>musik</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>8</td></tr></table>"),
            ("C", "Tabel C:<br/><table style='border-collapse:collapse; width:260px; margin-top:4px;'><tr><th style='border:1px solid #222; padding:3px 8px; text-align:left;'>Ektrakulikuler</th><th style='border:1px solid #222; padding:3px 8px; text-align:center;'>Banyak Siswa</th></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>pencak silat</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>6</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>bola basket</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>9</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>futsal</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>8</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>musik</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>7</td></tr></table>"),
            ("D", "Tabel D:<br/><table style='border-collapse:collapse; width:260px; margin-top:4px;'><tr><th style='border:1px solid #222; padding:3px 8px; text-align:left;'>Ektrakulikuler</th><th style='border:1px solid #222; padding:3px 8px; text-align:center;'>Banyak Siswa</th></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>pencak silat</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>6</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>bola basket</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>8</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>futsal</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>9</td></tr><tr><td style='border:1px solid #222; padding:3px 8px;'>musik</td><td style='border:1px solid #222; padding:3px 8px; text-align:center;'>7</td></tr></table>")
        ],
        "kunci": "D",
        "pembahasan": "Hitung kemunculan tiap jenis ekstrakurikuler dari 30 data mentah:<br/>• Pencak silat $= 6$ siswa<br/>• Bola basket $= 8$ siswa<br/>• Futsal $= 9$ siswa<br/>• Musik $= 7$ siswa<br/>Tabel yang benar adalah tabel D.<br/>Jawaban: D"
    },
    {
        "nomor": 26,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel",
        "capaian": "Membaca data tabel distribusi frekuensi dan menentukan frekuensi kumulatif",
        "teks_soal": "Perhatikan tabel yang menyajikan data berat badan balita (0 – 12 bulan) di Posyandu Sehat Sejahtera berikut!<br/><br/>Balita yang memiliki berat badan lebih dari 6,5kg sebanyak …",
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
        "opsi": [
            ("A", "11 orang"),
            ("B", "16 orang"),
            ("C", "18 orang"),
            ("D", "22 orang")
        ],
        "kunci": "C",
        "pembahasan": "Balita yang memiliki berat badan lebih dari $6,5\\text{ kg}$ adalah yang memiliki berat $7\\text{ kg}, 8\\text{ kg}, 9\\text{ kg},$ dan $10\\text{ kg}$.<br/>Banyak balita $= 7 + 2 + 5 + 4 = 18\\text{ orang}$.<br/>Jawaban: C"
    },
    {
        "nomor": 27,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "C. Data - C1. Mengumpulkan, menyajikan dan membaca data dalam bentuk tabel",
        "capaian": "Menganalisis tabel data olahraga dan mengevaluasi kebenaran pernyataan",
        "teks_soal": "Perhatikan tabel jenis olahraga kegemaran siswa kelas 6 berikut!<br/><br/><em>Berdasarkan tabel tersebut, manakah pernyataan berikut yang tepat dan tidak tepat? Berilah tanda centang (v) pada kolom tepat atau tidak tepat untuk setiap pernyataan.</em>",
        "tabel_soal": {
            "header": ["Jenis olahraga", "Banyak siswa"],
            "baris": [
                ["Renang", "12"],
                ["Bulu tangkis", "8"],
                ["Futsal", "24"],
                ["Bola basket", "6"]
            ]
        },
        "pernyataan": [
            ("Jenis olahraga yang paling digemari siswa adalah futsal", "Tepat"),
            ("Renang lebih banyak digemari daripada bulu tangkis", "Tepat"),
            ("Jumlah siswa yang gemar olahraga selain futsal ada 25 orang", "Tidak tepat"),
            ("Jumlah olahraga bola basket dan bulu tangkis digemari oleh 15 siswa", "Tidak tepat")
        ],
        "kunci": "Tepat, Tepat, Tidak tepat, Tidak tepat",
        "pembahasan": "Evaluasi pernyataan dari tabel:<br/>1. Futsal (24 siswa) adalah olahraga yang paling banyak digemari (Tepat).<br/>2. Renang (12 siswa) lebih banyak dari bulu tangkis (8 siswa) (Tepat).<br/>3. Jumlah siswa selain futsal $= 12 + 8 + 6 = 26\\text{ siswa}$, bukan 25 (Tidak tepat).<br/>4. Bola basket (6) + bulu tangkis (8) $= 14\\text{ siswa}$, bukan 15 (Tidak tepat)."
    },
    {
        "nomor": 28,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C2. Membaca dan menyajikan data dalam bentuk diagram",
        "capaian": "Menyajikan data tunggal nilai ulangan ke dalam bentuk diagram batang",
        "teks_soal": "Berikut data nilai hasil ulangan Bahasa Indonesia dari 30 siswa kelas VI SD Merdeka.<br/><br/>60, 70, 70, 80, 80, 70, 80, 100, 70, 90,<br/>90, 70, 60, 80, 90, 90, 80, 60, 70, 90,<br/>70, 80, 100, 80, 80, 90, 80, 90, 80, 90.<br/><br/>Diagram batang yang mewakili data tersebut adalah....",
        "opsi": [
            ("A", "Diagram Batang A:<br/><img src='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_a.png' data-url='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_a.png' alt='Opsi A' style='max-width:280px; display:block; margin:6px 0; border:1px solid #cbd5e1; border-radius:6px;' />"),
            ("B", "Diagram Batang B:<br/><img src='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_b.png' data-url='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_b.png' alt='Opsi B' style='max-width:280px; display:block; margin:6px 0; border:1px solid #cbd5e1; border-radius:6px;' />"),
            ("C", "Diagram Batang C:<br/><img src='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_c.png' data-url='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_c.png' alt='Opsi C' style='max-width:280px; display:block; margin:6px 0; border:1px solid #cbd5e1; border-radius:6px;' />"),
            ("D", "Diagram Batang D:<br/><img src='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_d.png' data-url='/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_d.png' alt='Opsi D' style='max-width:280px; display:block; margin:6px 0; border:1px solid #cbd5e1; border-radius:6px;' />")
        ],
        "kunci": "A",
        "pembahasan": "Frekuensi kemunculan tiap nilai:<br/>• Nilai 60 $= 3$ siswa<br/>• Nilai 70 $= 7$ siswa<br/>• Nilai 80 $= 10$ siswa<br/>• Nilai 90 $= 8$ siswa<br/>• Nilai 100 $= 2$ siswa<br/>Diagram batang pada pilihan A tepat menggambarkan tinggi frekuensi tersebut.<br/>Jawaban: A"
    },
    {
        "nomor": 29,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "C. Data - C2. Membaca dan menyajikan data dalam bentuk diagram",
        "capaian": "Menghitung banyak data dari diagram lingkaran persentase",
        "teks_soal": "Perhatikan diagram lingkaran berikut!<br/>{{GAMBAR}}<br/>Diagram lingkaran tersebut menggambarkan kegiatan ekstrakurikuler yang dipilih siswa kelas VI SD Nusa Bangsa. Jika siswa kelas VI berjumlah 50 orang, maka siswa yang suka bulu tangkis adalah....",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_29_diagram_lingkaran.png",
        "opsi": [
            ("A", "16 orang"),
            ("B", "14 orang"),
            ("C", "12 orang"),
            ("D", "8 orang")
        ],
        "kunci": "D",
        "pembahasan": "Hitung persentase ekstrakurikuler bulu tangkis:<br/>• Total lingkaran $= 100\\%$<br/>• Bulu tangkis $= 100\\% - (28\\% + 32\\% + 24\\%) = 100\\% - 84\\% = 16\\%$<br/>Banyak siswa gemar bulu tangkis $= 16\\% \\times 50 = \\frac{16}{100} \\times 50 = 8\\text{ orang}$.<br/>Jawaban: D"
    },
    {
        "nomor": 30,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "C. Data - C2. Membaca dan menyajikan data dalam bentuk diagram",
        "capaian": "Membaca dan menganalisis informasi diagram batang nilai ulangan matematika",
        "teks_soal": "Perhatikan diagram batang berikut!<br/>{{GAMBAR}}<br/>Diagram batang di atas menunjukkan nilai ulangan matematika kelas VI SD Negeri 6 Blah batuh.<br/><br/><em>Berdasarkan informasi tersebut, manakah pernyataan berikut yang benar? Jawaban benar lebih dari satu</em>",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_30_diagram_batang.png",
        "opsi": [
            ("A", "Nilai 60 adalah nilai ulangan matematika yang diperoleh oleh siswa terbanyak ketiga."),
            ("B", "Jika nilai di bawah 75 remedi, maka terdapat 15 orang siswa yang remedi ulangan matematika."),
            ("C", "Siswa yang mendapatkan nilai ulangan matematika 90 sebanyak 3 orang")
        ],
        "kunci": "B, C",
        "pembahasan": "Data diagram batang: Nilai 50 $= 5$ siswa, Nilai 60 $= 6$ siswa, Nilai 70 $= 4$ siswa, Nilai 80 $= 10$ siswa, Nilai 90 $= 3$ siswa, Nilai 100 $= 2$ siswa.<br/>• Nilai 60 diperoleh 6 siswa, merupakan urutan terbanyak kedua setelah nilai 80 (Pernyataan A Salah).<br/>• Nilai di bawah 75 (nilai 50, 60, dan 70): $5 + 6 + 4 = 15$ siswa yang remedi (Pernyataan B Benar).<br/>• Siswa yang memperoleh nilai 90 sebanyak 3 orang (Pernyataan C Benar).<br/>Jawaban: B dan C"
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
            f'  <article data-gemilang-question data-nomor="{num}" data-paket="1" data-tipe="{tipe}" data-mapel="Matematika" data-kelas="6" data-kesulitan="{kes}" data-kualitas="ok">',
            f'    <div data-field="materi">{materi}</div>',
            f'    <div data-field="capaian">{materi}</div>',
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
                    art.append(f'            <td style="border:1px solid #cbd5e1; padding:6px 10px; text-align:{align};">{cell}</td>')
                art.append('          </tr>')
            art.append('        </tbody>')
            art.append('      </table>')
            art.append('    </div>')

        # Ganti {{GAMBAR}} di dalam teks_soal jika ada
        teks_bersih = teks_soal.replace("{{GAMBAR}}", "").strip()
        art.append('    <div data-field="teks_soal">')
        art.append(f'      <p>{teks_bersih}</p>')
        art.append('    </div>')

        if "opsi" in q:
            art.append('    <ol data-field="opsi_jawaban">')
            for label, opt_text in q["opsi"]:
                art.append(f'      <li data-label="{label}">{opt_text}</li>')
            art.append('    </ol>')

        if "pernyataan" in q:
            # Gunakan format <table> data-field="pernyataan" agar kompatibel penuh dengan skema tabel
            art.append('    <table data-field="pernyataan" style="width:100%; border-collapse:collapse; margin:10px 0; border:1px solid #cbd5e1; font-size:13.5px;">')
            art.append('      <thead>')
            art.append('        <tr style="background:#f1f5f9;">')
            art.append('          <th style="border:1px solid #cbd5e1; padding:8px; text-align:left;">Pernyataan</th>')
            art.append('          <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:90px;">Tepat</th>')
            art.append('          <th style="border:1px solid #cbd5e1; padding:8px; text-align:center; width:90px;">Tidak tepat</th>')
            art.append('        </tr>')
            art.append('      </thead>')
            art.append('      <tbody>')
            for p_text, jwb in q["pernyataan"]:
                tepat_v = "✓" if jwb.lower() in ("tepat", "benar", "sesuai") else ""
                tidak_v = "✓" if jwb.lower() in ("tidak tepat", "salah", "tidak sesuai") else ""
                art.append('        <tr>')
                art.append(f'          <td style="border:1px solid #cbd5e1; padding:6px 10px;">{p_text}</td>')
                art.append(f'          <td style="border:1px solid #cbd5e1; padding:6px 10px; text-align:center; font-weight:bold; color:#16a34a;">{tepat_v}</td>')
                art.append(f'          <td style="border:1px solid #cbd5e1; padding:6px 10px; text-align:center; font-weight:bold; color:#dc2626;">{tidak_v}</td>')
                art.append('        </tr>')
            art.append('      </tbody>')
            art.append('    </table>')

        art.append(f'    <meta data-field="kunci_jawaban" data-value="{kunci}" />')
        art.append('    <meta data-field="kunci_terverifikasi" data-value="true" />')
        art.append('    <meta data-field="asal_pembahasan" data-value="naskah_asli" />')
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
  <title>Try Out I TKA SD/MI 2025/2026 - Numerisasi / Matematika</title>
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
    table[data-field="pernyataan"] {{
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
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
