# scripts/build_to1_tka_matematika_sd_2026_import_html.py
# Generator Berkas Master HTML Impor Bimbel Gemilang
# Try Out I TKA SD 2025/2026 - Matematika / Numerisasi (30 Soal Lengkap)
import os

SOAL_MAT = [
    {
        "nomor": 1,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Operasi Hitung Bilangan Cacah",
        "capaian": "Menghitung hasil operasi penjumlahan dan pengurangan bilangan cacah sampai 1.000.000",
        "teks_soal": "Hasil dari $27.825 + 13.460 - 9.754$ adalah …",
        "opsi": [
            ("A", "31.531"),
            ("B", "31.513"),
            ("C", "31.351"),
            ("D", "31.315")
        ],
        "kunci": "A",
        "pembahasan": "$$27.825 + 13.460 = 41.285$$<br/>$$41.285 - 9.754 = 31.531$$<br/>Jadi, hasil perhitungan adalah 31.531."
    },
    {
        "nomor": 2,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Operasi Hitung Campuran Bilangan Cacah",
        "capaian": "Menyelesaikan operasi hitung campuran dengan tanda kurung sesuai urutan operasi",
        "teks_soal": "Hasil dari $12 + 56 : 8 \\times (12 - 10 : 2)$ adalah …",
        "opsi": [
            ("A", "46"),
            ("B", "61"),
            ("C", "91"),
            ("D", "97")
        ],
        "kunci": "B",
        "pembahasan": "Kerjakan operasi dalam kurung terlebih dahulu:<br/>$$10 : 2 = 5$$<br/>$$12 - 5 = 7$$<br/>Selanjutnya pembagian dan perkalian berurutan dari kiri ke kanan:<br/>$$56 : 8 = 7$$<br/>$$7 \\times 7 = 49$$<br/>Terakhir lakukan penjumlahan:<br/>$$12 + 49 = 61$$"
    },
    {
        "nomor": 3,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Nilai dan Kesetaraan Mata Uang",
        "capaian": "Menentukan kesetaraan nilai pecahan uang rupiah",
        "teks_soal": "Adit pergi ke warung. Ia membawa 2 lembar uang dua puluh ribuan dan 2 lembar uang lima ribuan.<br/><br/>Berdasarkan cerita tersebut, manakah pernyataan berikut yang tepat dan tidak tepat? Berilah tanda centang (✓) pada kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Nilai uang Adit setara dengan selembar uang lima puluh ribuan", "Tepat"),
            ("Nilai uang Adit setara dengan tiga lembar uang dua puluh ribuan", "Tidak tepat"),
            ("Nilai uang Adit setara dengan lima lembar uang sepuluh ribuan", "Tepat"),
            ("Nilai uang Adit setara dengan enam lembar dua ribuan dan 4 lembar sepuluh ribuan", "Tidak tepat")
        ],
        "kunci": "Tepat, Tidak tepat, Tepat, Tidak tepat",
        "pembahasan": "Total uang Adit:<br/>$$2 \\times \\text{Rp } 20.000 + 2 \\times \\text{Rp } 5.000 = \\text{Rp } 40.000 + \\text{Rp } 10.000 = \\text{Rp } 50.000$$<br/>• 1 lembar Rp 50.000 = Rp 50.000 (Tepat)<br/>• 3 lembar Rp 20.000 = Rp 60.000 ≠ Rp 50.000 (Tidak tepat)<br/>• 5 lembar Rp 10.000 = Rp 50.000 (Tepat)<br/>• 6 lembar Rp 2.000 + 4 lembar Rp 10.000 = Rp 12.000 + Rp 40.000 = Rp 52.000 ≠ Rp 50.000 (Tidak tepat)"
    },
    {
        "nomor": 4,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "Aritmetika Sosial (Harga Pembelian)",
        "capaian": "Menghitung total biaya belanja dan pecahan uang pembayaran (jawaban lebih dari satu)",
        "teks_soal": "Rina, Ridho dan Ima membeli beberapa alat tulis di toko. Rina membeli 2 pensil dan 3 buku tulis. Ridho membeli 3 pensil dan 5 buku tulis. Ima membeli 2 pensil dan 4 buku tulis. Di toko tersebut harga satu pensil Rp 2.500,00 dan harga satu buku tulis Rp 4.000,00.<br/><br/>Berdasarkan informasi tersebut, manakah pernyataan berikut yang benar?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Rina membayar dengan 3 lembar uang lima ribuan dan 1 lembar uang dua ribuan"),
            ("B", "Rido membayar dengan 2 lembar uang dua puluh ribuan dan diberi kembalian 4 lembar uang dua ribuan"),
            ("C", "Ima membayar dengan 1 lembar uang dua puluh ribuan dan 1 lembar uang seribuan")
        ],
        "kunci": "A, C",
        "pembahasan": "• Belanja Rina: $2 \\times 2.500 + 3 \\times 4.000 = 5.000 + 12.000 = \\text{Rp } 17.000$.<br/>Uang Rina: $3 \\times 5.000 + 1 \\times 2.000 = 15.000 + 2.000 = \\text{Rp } 17.000$ (BENAR).<br/>• Belanja Ridho: $3 \\times 2.500 + 5 \\times 4.000 = 7.500 + 20.000 = \\text{Rp } 27.500$.<br/>Pembayaran Ridho: $2 \\times 20.000 - 4 \\times 2.000 = 40.000 - 8.000 = \\text{Rp } 32.000 \\ne 27.500$ (SALAH).<br/>• Belanja Ima: $2 \\times 2.500 + 4 \\times 4.000 = 5.000 + 16.000 = \\text{Rp } 21.000$.<br/>Uang Ima: $1 \\times 20.000 + 1 \\times 1.000 = \\text{Rp } 21.000$ (BENAR)."
    },
    {
        "nomor": 5,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "KPK Bentuk Faktorisasi Prima",
        "capaian": "Menentukan KPK dari tiga bilangan dalam bentuk perkalian faktor prima",
        "teks_soal": "KPK dari 24, 36 dan 42 dalam bentuk faktorisasi prima adalah …",
        "opsi": [
            ("A", "$2^3 \\times 3^2$"),
            ("B", "$2^3 \\times 7$"),
            ("C", "$2^2 \\times 3^3 \\times 7$"),
            ("D", "$2^3 \\times 3^2 \\times 7$")
        ],
        "kunci": "D",
        "pembahasan": "Faktorisasi prima tiap bilangan:<br/>$$24 = 2^3 \\times 3$$<br/>$$36 = 2^2 \\times 3^2$$<br/>$$42 = 2 \\times 3 \\times 7$$<br/>KPK diperoleh dengan mengalikan semua faktor prima dengan pangkat terbesar:<br/>$$\\text{KPK} = 2^3 \\times 3^2 \\times 7$$"
    },
    {
        "nomor": 6,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Aplikasi FPB dalam Kehidupan Sehari-hari",
        "capaian": "Menentukan jumlah wadah terbanyak menggunakan konsep FPB",
        "teks_soal": "Sebanyak 63 jeruk dan 81 apel akan disajikan dalam beberapa piring. Setiap piring berisi jeruk dan apel masing-masing sama banyak. Jumlah piring paling banyak yang perlu disediakan adalah …",
        "opsi": [
            ("A", "9"),
            ("B", "7"),
            ("C", "6"),
            ("D", "3")
        ],
        "kunci": "A",
        "pembahasan": "Jumlah piring paling banyak adalah nilai FPB dari 63 dan 81:<br/>$$63 = 3^2 \\times 7$$<br/>$$81 = 3^4$$<br/>$$\\text{FPB} = 3^2 = 9\\text{ piring}$$"
    },
    {
        "nomor": 7,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Aplikasi KPK dalam Kehidupan Sehari-hari",
        "capaian": "Menentukan interval pertemuan bersama berkala menggunakan konsep KPK",
        "teks_soal": "Bu Rina memiliki toko kelontong. Toko tersebut dikunjungi beberapa penjual untuk memasok dagangan. Penjual roti berkunjung tiap 4 hari. Penjual telur berkunjung tiap 5 hari. Pada 1 Agustus 2025 kedua penjual sama-sama mengunjungi toko.<br/><br/>Tiap berapa hari penjual toko dan penjual telur berkunjung bersama-sama ke toko?",
        "opsi": [
            ("A", "10 hari"),
            ("B", "12 hari"),
            ("C", "15 hari"),
            ("D", "20 hari")
        ],
        "kunci": "D",
        "pembahasan": "Kedua penjual akan berkunjung bersama setiap kelipatan persekutuan terkecil (KPK) dari 4 dan 5:<br/>$$\\text{KPK}(4, 5) = 20\\text{ hari}$$"
    },
    {
        "nomor": 8,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Pola Bilangan Kelipatan",
        "capaian": "Menentukan suku yang hilang dan sifat pola bilangan kelipatan",
        "teks_soal": "Diketahui urutan bilangan kelipatan yaitu $14, 21, 28, 35, n, 49, 56, m, \\dots$<br/><br/>Berdasarkan urutan bilangan kelipatan tersebut, manakah pernyataan berikut yang tepat dan tidak tepat? Berilah tanda centang (✓) pada kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Bilangan-bilangan tersebut merupakan kelipatan 7", "Tepat"),
            ("Nilai n yang tepat adalah 42", "Tepat"),
            ("Nilai m yang tepat adalah 70", "Tidak tepat"),
            ("Bilangan-bilangan tersebut merupakan bilangan ganjil", "Tidak tepat")
        ],
        "kunci": "Tepat, Tepat, Tidak tepat, Tidak tepat",
        "pembahasan": "Pola bilangan adalah kelipatan 7 berurutan:<br/>$$n = 35 + 7 = 42$$<br/>$$m = 56 + 7 = 63$$ (bukan 70).<br/>Pola ini memuat percampuran bilangan genap dan ganjil (contoh 14, 28, 42, 56 adalah genap), sehingga pernyataan bilangan ganjil seluruhnya adalah tidak tepat."
    },
    {
        "nomor": 9,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Penjumlahan Pecahan Campuran dan Biasa",
        "capaian": "Menyelesaikan penjumlahan pecahan campuran dan pecahan biasa dengan penyebut berbeda",
        "teks_soal": "Hasil dari $3\\frac{1}{4} + \\frac{5}{8}$ adalah …",
        "opsi": [
            ("A", "$3\\frac{1}{16}$"),
            ("B", "$3\\frac{1}{4}$"),
            ("C", "$3\\frac{4}{8}$"),
            ("D", "$3\\frac{7}{8}$")
        ],
        "kunci": "D",
        "pembahasan": "Samakan penyebut menjadi 8:<br/>$$3\\frac{1}{4} = 3\\frac{2}{8}$$<br/>$$3\\frac{2}{8} + \\frac{5}{8} = 3\\frac{7}{8}$$"
    },
    {
        "nomor": 10,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Perkalian Bilangan Asli dengan Pecahan",
        "capaian": "Menghitung hasil perkalian bilangan bulat dengan pecahan biasa",
        "teks_soal": "Jika $4 \\times \\frac{7}{12} = n$, nilai $n$ yang tepat adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{12}$"),
            ("B", "$1\\frac{1}{4}$"),
            ("C", "$2\\frac{1}{6}$"),
            ("D", "$2\\frac{1}{3}$")
        ],
        "kunci": "D",
        "pembahasan": "$$n = \\frac{4 \\times 7}{12} = \\frac{28}{12}$$<br/>Sederhanakan pembilang dan penyebut dengan membagi 4:<br/>$$n = \\frac{7}{3} = 2\\frac{1}{3}$$"
    },
    {
        "nomor": 11,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Soal Cerita Pengurangan Pecahan",
        "capaian": "Menyelesaikan masalah kontekstual luas tanah yang melibatkan operasi pecahan",
        "teks_soal": "Pak Bayu membeli tiga petak tanah masing-masing seluas $\\frac{1}{2}$ hektare. Dari tanah tersebut, seluas $\\frac{1}{8}$ hektare dan $\\frac{1}{4}$ hektare tanah akan ia berikan kepada kedua anaknya. Sisa luas tanah yang dibeli Pak Bayu adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{8}$ hektare"),
            ("B", "$1\\frac{1}{16}$ hektare"),
            ("C", "$1\\frac{1}{4}$ hektare"),
            ("D", "$1\\frac{1}{2}$ hektare")
        ],
        "kunci": "A",
        "pembahasan": "Total tanah awal:<br/>$$3 \\times \\frac{1}{2} = \\frac{3}{2}\\text{ hektare}$$<br/>Total tanah yang diberikan ke anak:<br/>$$\\frac{1}{8} + \\frac{1}{4} = \\frac{1}{8} + \\frac{2}{8} = \\frac{3}{8}\\text{ hektare}$$<br/>Sisa luas tanah:<br/>$$\\frac{3}{2} - \\frac{3}{8} = \\frac{12}{8} - \\frac{3}{8} = \\frac{9}{8} = 1\\frac{1}{8}\\text{ hektare}$$"
    },
    {
        "nomor": 12,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Menyederhanakan Pecahan",
        "capaian": "Mengubah pecahan biasa tak murni menjadi bentuk pecahan campuran paling sederhana",
        "teks_soal": "Bentuk paling sederhana dari $\\frac{56}{36}$ adalah …",
        "opsi": [
            ("A", "$1\\frac{1}{2}$"),
            ("B", "$1\\frac{4}{9}$"),
            ("C", "$1\\frac{5}{9}$"),
            ("D", "$1\\frac{2}{3}$")
        ],
        "kunci": "C",
        "pembahasan": "Bagi pembilang dan penyebut dengan FPB(56, 36) = 4:<br/>$$\\frac{56 : 4}{36 : 4} = \\frac{14}{9} = 1\\frac{5}{9}$$"
    },
    {
        "nomor": 13,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Kecepatan, Jarak, dan Waktu",
        "capaian": "Menghitung kecepatan rata-rata kendaraan berdasarkan jarak dan selisih waktu",
        "teks_soal": "Pak Pandu berangkat dari rumahnya ke Cirebon dengan mengendarai mobil. Pak Pandu berangkat dari rumah pukul 07.00 dan tiba di Cirebon pukul 09.30. Jika jarak yang ditempuh adalah Pak Pandu 185 km, kecepatan rata-rata mobil yang dikendarai Pak Pandu adalah …",
        "opsi": [
            ("A", "64 km/jam"),
            ("B", "74 km/jam"),
            ("C", "75 km/jam"),
            ("D", "84 km/jam")
        ],
        "kunci": "B",
        "pembahasan": "Waktu tempuh $t = 09.30 - 07.00 = 2\\text{ jam } 30\\text{ menit} = 2,5\\text{ jam}$.<br/>Jarak $s = 185\\text{ km}$.<br/>$$\\text{Kecepatan } v = \\frac{s}{t} = \\frac{185}{2,5} = 74\\text{ km/jam}$$"
    },
    {
        "nomor": 14,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Pengukuran Sudut dengan Busur Derajat",
        "capaian": "Membaca besar sudut menggunakan skala busur derajat",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_14_busur_derajat.png",
        "teks_soal": "Perhatikan gambar busur derajat di atas!<br/><br/>Besar sudut COD tersebut adalah …",
        "opsi": [
            ("A", "150°"),
            ("B", "120°"),
            ("C", "130°"),
            ("D", "180°")
        ],
        "kunci": "B",
        "pembahasan": "Kaki sudut OC terletak pada garis horizontal skala dalam $0^\\circ$. Kaki sudut OD menunjuk tepat pada angka $120^\\circ$ skala dalam. Jadi besar sudut $\\angle\\text{COD} = 120^\\circ$."
    },
    {
        "nomor": 15,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Satuan Panjang",
        "capaian": "Menyelesaikan operasi hitung konversi satuan panjang ke desimeter (dm)",
        "teks_soal": "Hasil dari $7.500\\text{ mm} + 3,6\\text{ m} - 200\\text{ cm}$ adalah …",
        "opsi": [
            ("A", "91 dm"),
            ("B", "109 dm"),
            ("C", "784 dm"),
            ("D", "1.108 dm")
        ],
        "kunci": "A",
        "pembahasan": "Konversikan semua satuan ke desimeter (dm):<br/>• $7.500\\text{ mm} = 75\\text{ dm}$<br/>• $3,6\\text{ m} = 36\\text{ dm}$<br/>• $200\\text{ cm} = 20\\text{ dm}$<br/>Operasi hitung:<br/>$$75 + 36 - 20 = 111 - 20 = 91\\text{ dm}$$"
    },
    {
        "nomor": 16,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Konversi Satuan Berat",
        "capaian": "Menganalisis kesesuaian nilai berat dalam satuan gram, hektogram (hg), dan kilogram (kg)",
        "teks_soal": "Jika berat satu kantong gula pasir adalah 5 hg dan berat satu kantong tepung terigu adalah 1.000 gr, manakah pernyataan berikut yang sesuai dan tidak sesuai?<br/><br/>Berilah tanda centang (✓) pada setiap kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Berat 2 kantong gula pasir sama dengan 1000 gr", "Tepat"),
            ("Berat satu kantong tepung adalah 0,1 kg", "Tidak tepat"),
            ("Berat satu kantong tepung dan satu kantong gula adalah 1500 gr", "Tepat"),
            ("Berat 2 kantong gula pasir dan 2 kantong tepung terigu adalah 0,3 kg", "Tidak tepat")
        ],
        "kunci": "Tepat, Tidak tepat, Tepat, Tidak tepat",
        "pembahasan": "Konversi dasar:<br/>• 1 kantong gula pasir = $5\\text{ hg} = 500\\text{ gr} = 0,5\\text{ kg}$<br/>• 1 kantong tepung = $1.000\\text{ gr} = 10\\text{ hg} = 1\\text{ kg}$<br/>Evaluasi pernyataan:<br/>1. $2 \\times 500\\text{ gr} = 1.000\\text{ gr}$ (Tepat)<br/>2. $1.000\\text{ gr} = 1\\text{ kg} \\ne 0,1\\text{ kg}$ (Tidak tepat)<br/>3. $1.000\\text{ gr} + 500\\text{ gr} = 1.500\\text{ gr}$ (Tepat)<br/>4. $2(0,5\\text{ kg}) + 2(1\\text{ kg}) = 1 + 2 = 3\\text{ kg} \\ne 0,3\\text{ kg}$ (Tidak tepat)"
    },
    {
        "nomor": 17,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Sifat-Sifat Bangun Datar",
        "capaian": "Mengidentifikasi bangun datar berdasarkan sifat-sifat sisi dan sudutnya",
        "teks_soal": "Perhatikan sifat-sifat bangun datar berikut!<br/>• Memiliki sepasang sisi sejajar<br/>• Memiliki 2 pasang sudut yang sama besar<br/>• Jumlah besar 2 sudut yang berdekatan di antara 2 garis sejajar adalah 180°<br/><br/>Bangun datar yang memiliki sifat-sifat tersebut adalah …",
        "opsi": [
            ("A", "Jajar genjang"),
            ("B", "Layang-layang"),
            ("C", "Trapesium siku-siku"),
            ("D", "Trapesium sama kaki")
        ],
        "kunci": "D",
        "pembahasan": "Bangun datar yang memiliki tepat sepasang sisi sejajar dan memiliki 2 pasang sudut sama besar (sudut alas sama besar dan sudut atas sama besar) adalah trapesium sama kaki."
    },
    {
        "nomor": 18,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Luas Trapesium",
        "capaian": "Menghitung luas trapesium dengan rumus luas bangun datar",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_18_trapesium.png",
        "teks_soal": "Perhatikan gambar di atas!<br/><br/>Luas trapesium tersebut adalah …",
        "opsi": [
            ("A", "684 cm²"),
            ("B", "846 cm²"),
            ("C", "864 cm²"),
            ("D", "1.386 cm²")
        ],
        "kunci": "A",
        "pembahasan": "Diketahui pada gambar:<br/>• Sisi atas $a = 34\\text{ cm}$<br/>• Sisi bawah $b = 42\\text{ cm}$<br/>• Tinggi $t = 18\\text{ cm}$<br/>Rumus luas trapesium:<br/>$$\\text{Luas} = \\frac{a + b}{2} \\times t = \\frac{34 + 42}{2} \\times 18 = \\frac{76}{2} \\times 18 = 38 \\times 18 = 684\\text{ cm}^2$$"
    },
    {
        "nomor": 19,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Sifat Bangun Datar Persegi Panjang",
        "capaian": "Mengidentifikasi kumpulan sifat-sifat yang dimiliki oleh persegi panjang",
        "teks_soal": "Perhatikan sifat-sifat bangun datar berikut!<br/>(i) Mempunyai dua pasang sisi sejajar dan sama panjang<br/>(ii) Mempunyai dua diagonal sama panjang<br/>(iii) Kedua diagonalnya saling berpotongan tegak lurus<br/>(iv) Mempunyai dua simetri lipat<br/><br/>Manakah yang merupakan sifat-sifat persegi panjang?",
        "opsi": [
            ("A", "(i), (ii), dan (iii)"),
            ("B", "(i), (ii) dan (iv)"),
            ("C", "(i), (iii) dan (iv)"),
            ("D", "(ii), (iii) dan (iv)")
        ],
        "kunci": "B",
        "pembahasan": "Sifat persegi panjang:<br/>(i) Mempunyai 2 pasang sisi sejajar dan sama panjang (Benar).<br/>(ii) Mempunyai 2 diagonal sama panjang (Benar).<br/>(iii) Diagonal berpotongan tegak lurus bukan sifat persegi panjang melainkan belah ketupat/layang-layang/persegi.<br/>(iv) Mempunyai 2 simetri lipat (Benar).<br/>Jadi yang tepat adalah (i), (ii) dan (iv)."
    },
    {
        "nomor": 20,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Luas Layang-Layang",
        "capaian": "Menghitung luas layang-layang berdasarkan panjang diagonal-diagonalnya",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_20_layang_layang.png",
        "teks_soal": "Perhatikan gambar layang-layang di atas!<br/><br/>Berapakah luas layang-layang pada gambar?",
        "opsi": [
            ("A", "240 cm²"),
            ("B", "320 cm²"),
            ("C", "360 cm²"),
            ("D", "480 cm²")
        ],
        "kunci": "B",
        "pembahasan": "Dari gambar tertera:<br/>• Diagonal horizontal $d_1 = 16\\text{ cm} + 24\\text{ cm} = 40\\text{ cm}$<br/>• Diagonal vertikal $d_2 = 8\\text{ cm} + 8\\text{ cm} = 16\\text{ cm}$<br/>$$\\text{Luas} = \\frac{d_1 \\times d_2}{2} = \\frac{40 \\times 16}{2} = 40 \\times 8 = 320\\text{ cm}^2$$"
    },
    {
        "nomor": 21,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "Keliling dan Ketaksamaan Segitiga",
        "capaian": "Menentukan kemungkinan ukuran sisi segitiga dengan keliling 45 cm (jawaban lebih dari satu)",
        "teks_soal": "Reza menggambar segitiga yang memiliki keliling 45 cm. Manakah segitiga berikut yang mungkin digambar Reza?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Segitiga ABC dengan panjang sisi 18 cm, 18 cm, dan 9 cm"),
            ("B", "Segitiga KLM dengan panjang sisi 16 cm, 15 cm, dan 8 cm"),
            ("C", "Segitiga PQR dengan panjang sisi 21 cm, 14 cm, dan 10 cm")
        ],
        "kunci": "A, C",
        "pembahasan": "Syarat segitiga: keliling = 45 cm dan jumlah 2 sisi lebih panjang dari sisi ketiga ($a+b > c$).<br/>• Segitiga ABC: $18 + 18 + 9 = 45\\text{ cm}$ dan $18 + 9 = 27 > 18$ (BENAR).<br/>• Segitiga KLM: $16 + 15 + 8 = 39\\text{ cm} \\ne 45\\text{ cm}$ (SALAH).<br/>• Segitiga PQR: $21 + 14 + 10 = 45\\text{ cm}$ dan $14 + 10 = 24 > 21$ (BENAR)."
    },
    {
        "nomor": 22,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Sifat Bangun Ruang Prisma Segitiga",
        "capaian": "Mengidentifikasi bangun ruang berdasarkan jumlah sisi, rusuk, dan titik sudut",
        "teks_soal": "Perhatikan sifat-sifat bangun ruang berikut!<br/>• Memiliki 5 sisi, dengan sisi alas dan tutup merupakan segitiga kongruen<br/>• Memiliki 9 rusuk<br/>• Memiliki 6 titik sudut<br/><br/>Bangun ruang yang memiliki sifat-sifat tersebut adalah …",
        "opsi": [
            ("A", "Balok"),
            ("B", "Tabung"),
            ("C", "Limas segi empat"),
            ("D", "Prisma tegak segitiga")
        ],
        "kunci": "D",
        "pembahasan": "Prisma tegak segitiga memiliki:<br/>• 5 sisi (alas dan tutup segitiga, serta 3 sisi tegak persegi/persegi panjang)<br/>• 9 rusuk<br/>• 6 titik sudut."
    },
    {
        "nomor": 23,
        "tipe": "pg_sederhana",
        "kesulitan": "sulit",
        "materi": "Banyak Kubus Satuan Penyusun Bangun Ruang",
        "capaian": "Menghitung total kubus satuan penyusun bangun ruang bertingkat",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_23_susunan_kubus.png",
        "teks_soal": "Perhatikan gambar susunan kubus di atas!<br/><br/>Jika susunan kubus tersebut diuraikan, banyak kubus penyusunnya adalah …",
        "opsi": [
            ("A", "24"),
            ("B", "25"),
            ("C", "26"),
            ("D", "27")
        ],
        "kunci": "C",
        "pembahasan": "Menghitung kubus penyusun per kolom/lapisan:<br/>• Bagian menara bertingkat di kiri terdiri dari tangga 5 kolom: $5 + 4 + 3 + 2 + 1 = 15\\text{ kubus}$.<br/>• Bagian lengan samping kanan terdiri atas tiang setinggi 3 kubus, 2 kubus, serta deretan dasar 3 kubus dan kubus sambungan: $15 + 11 = 26\\text{ kubus}$."
    },
    {
        "nomor": 24,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Volume Bangun Ruang Gabungan",
        "capaian": "Menghitung volume gabungan dua balok",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_24_bangun_gabungan.png",
        "teks_soal": "Perhatikan gambar bangun ruang gabungan di atas!<br/><br/>Volume bangun ruang gabungan di samping adalah …",
        "opsi": [
            ("A", "935 cm³"),
            ("B", "940 cm³"),
            ("C", "945 cm³"),
            ("D", "950 cm³")
        ],
        "kunci": "A",
        "pembahasan": "Bangun gabungan terdiri dari dua balok:<br/>• Balok bawah: panjang $14\\text{ cm}$, lebar $5\\text{ cm}$, tinggi $5\\text{ cm}$:<br/>$$V_1 = 14 \\times 5 \\times 5 = 350\\text{ cm}^3$$<br/>• Balok atas: panjang $9\\text{ cm}$, lebar $5\\text{ cm}$, tinggi $18 - 5 = 13\\text{ cm}$:<br/>$$V_2 = 9 \\times 5 \\times 13 = 585\\text{ cm}^3$$<br/>Total volume gabungan:<br/>$$V = 350 + 585 = 935\\text{ cm}^3$$"
    },
    {
        "nomor": 25,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Menyajikan Data Acak ke dalam Tabel Frekuensi",
        "capaian": "Menyusun tabel frekuensi yang tepat berdasarkan data acak pilihan ekstrakurikuler",
        "tabel_soal": {
            "header": ["Kolom 1", "Kolom 2", "Kolom 3", "Kolom 4", "Kolom 5", "Kolom 6"],
            "baris": [
                ["Musik", "Pencak silat", "Musik", "Bola basket", "Futsal", "Musik"],
                ["Musik", "Bola basket", "Bola basket", "Pencak silat", "Bola basket", "Pencak silat"],
                ["Bola basket", "Futsal", "Futsal", "Futsal", "Futsal", "Pencak silat"],
                ["Futsal", "Pencak silat", "Bola basket", "Pencak silat", "Futsal", "Musik"],
                ["Bola basket", "Bola basket", "Musik", "Futsal", "Futsal", "Musik"]
            ]
        },
        "teks_soal": "Berikut data ekstrakurikuler yang diikuti oleh 30 siswa kelas VI:<br/><br/>Tabel yang tepat untuk mewakili data di atas adalah …",
        "opsi": [
            ("A", "pencak silat: 7 | bola basket: 8 | futsal: 9 | musik: 6"),
            ("B", "pencak silat: 6 | bola basket: 9 | futsal: 7 | musik: 8"),
            ("C", "pencak silat: 6 | bola basket: 9 | futsal: 8 | musik: 7"),
            ("D", "pencak silat: 6 | bola basket: 8 | futsal: 9 | musik: 7")
        ],
        "kunci": "D",
        "pembahasan": "Menghitung frekuensi kemunculan tiap ekstrakurikuler dari 30 data:<br/>• Pencak silat = 6 siswa<br/>• Bola basket = 8 siswa<br/>• Futsal = 9 siswa<br/>• Musik = 7 siswa<br/>Total $= 6 + 8 + 9 + 7 = 30$ siswa. Tabel yang sesuai adalah opsi D."
    },
    {
        "nomor": 26,
        "tipe": "pg_sederhana",
        "kesulitan": "mudah",
        "materi": "Membaca Data Tabel Distribusi Frekuensi",
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
        "teks_soal": "Perhatikan tabel yang menyajikan data berat badan balita (0 – 12 bulan) di Posyandu Sehat Sejahtera di atas!<br/><br/>Balita yang memiliki berat badan lebih dari 6,5 kg sebanyak …",
        "opsi": [
            ("A", "11 orang"),
            ("B", "16 orang"),
            ("C", "18 orang"),
            ("D", "22 orang")
        ],
        "kunci": "C",
        "pembahasan": "Balita dengan berat badan lebih dari 6,5 kg adalah kelompok balita dengan berat 7 kg, 8 kg, 9 kg, dan 10 kg:<br/>$$7 + 2 + 5 + 4 = 18\\text{ orang}$$"
    },
    {
        "nomor": 27,
        "tipe": "benar_salah",
        "kesulitan": "sedang",
        "materi": "Menganalisis Informasi Data Tabel",
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
        "teks_soal": "Perhatikan tabel jenis olahraga kegemaran siswa kelas 6 di atas!<br/><br/>Berdasarkan tabel tersebut, manakah pernyataan berikut yang tepat dan tidak tepat? Berilah tanda centang (✓) pada kolom tepat atau tidak tepat untuk setiap pernyataan!",
        "pernyataan": [
            ("Jenis olahraga yang paling digemari siswa adalah futsal", "Tepat"),
            ("Renang lebih banyak digemari daripada bulu tangkis", "Tepat"),
            ("Jumlah siswa yang gemar olahraga selain futsal ada 25 orang", "Tidak tepat"),
            ("Jumlah olahraga bola basket dan bulu tangkis digemari oleh 15 siswa", "Tidak tepat")
        ],
        "kunci": "Tepat, Tepat, Tidak tepat, Tidak tepat",
        "pembahasan": "• Futsal digemari 24 siswa (terbanyak) → Tepat.<br/>• Renang (12) &gt; Bulu tangkis (8) → Tepat.<br/>• Siswa gemar selain futsal $= 12 + 8 + 6 = 26\\text{ orang} \\ne 25$ → Tidak tepat.<br/>• Bola basket (6) + Bulu tangkis (8) $= 14\\text{ orang} \\ne 15$ → Tidak tepat."
    },
    {
        "nomor": 28,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Menyajikan Data ke Diagram Batang",
        "capaian": "Memilih diagram batang yang tepat untuk merepresentasikan sekumpulan data nilai",
        "teks_soal": "Berikut data nilai hasil ulangan Bahasa Indonesia dari 30 siswa kelas VI SD Merdeka:<br/>60, 70, 70, 80, 80, 70, 80, 100, 70, 90,<br/>90, 70, 60, 80, 90, 90, 80, 60, 70, 90,<br/>70, 80, 100, 80, 80, 90, 80, 90, 80, 90.<br/><br/>Diagram batang yang mewakili data tersebut adalah....",
        "opsi_gambar": [
            ("A", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_a.jpg"),
            ("B", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_b.jpg"),
            ("C", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_c.png"),
            ("D", "/soal/to1-tka-matematika-sd-2026/soal_28_diagram_batang_d.jpg")
        ],
        "kunci": "B",
        "pembahasan": "Frekuensi kemunculan nilai:<br/>• Nilai 60 = 3 siswa<br/>• Nilai 70 = 7 siswa<br/>• Nilai 80 = 10 siswa<br/>• Nilai 90 = 8 siswa<br/>• Nilai 100 = 2 siswa<br/>Diagram batang B menampilkan tinggi batang yang tepat sesuai frekuensi tersebut."
    },
    {
        "nomor": 29,
        "tipe": "pg_sederhana",
        "kesulitan": "sedang",
        "materi": "Diagram Lingkaran Persentase",
        "capaian": "Menghitung banyak anggota bagian pada diagram lingkaran berbentuk persen",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_29_diagram_lingkaran.jpg",
        "teks_soal": "Perhatikan diagram lingkaran di atas!<br/><br/>Diagram lingkaran tersebut menggambarkan kegiatan ekstrakurikuler yang dipilih siswa kelas VI SD Nusa Bangsa. Jika siswa kelas VI berjumlah 50 orang, maka siswa yang suka bulu tangkis adalah....",
        "opsi": [
            ("A", "16 orang"),
            ("B", "14 orang"),
            ("C", "12 orang"),
            ("D", "8 orang")
        ],
        "kunci": "D",
        "pembahasan": "Persentase siswa suka bulu tangkis:<br/>$$100\\% - (28\\% + 32\\% + 24\\%) = 100\\% - 84\\% = 16\\%$$<br/>Banyak siswa yang suka bulu tangkis:<br/>$$16\\% \\times 50 = \\frac{16}{100} \\times 50 = 8\\text{ orang}$$"
    },
    {
        "nomor": 30,
        "tipe": "pg_kompleks",
        "kesulitan": "sedang",
        "materi": "Membaca dan Menganalisis Diagram Batang",
        "capaian": "Menganalisis kebenaran pernyataan berdasarkan grafik diagram batang (jawaban lebih dari satu)",
        "gambar": "/soal/to1-tka-matematika-sd-2026/soal_30_diagram_batang.png",
        "teks_soal": "Perhatikan diagram batang nilai ulangan matematika kelas VI SD Negeri 6 Blah batuh di atas!<br/><br/>Berdasarkan informasi tersebut, manakah pernyataan berikut yang benar?<br/><br/><em>Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.</em>",
        "opsi": [
            ("A", "Nilai 60 adalah nilai ulangan matematika yang diperoleh oleh siswa terbanyak ketiga."),
            ("B", "Jika nilai di bawah 75 remedi, maka terdapat 15 orang siswa yang remedi ulangan matematika."),
            ("C", "Siswa yang mendapatkan nilai ulangan matematika 90 sebanyak 3 orang")
        ],
        "kunci": "B, C",
        "pembahasan": "Berdasarkan diagram batang:<br/>• Nilai 50 = 5 siswa, Nilai 60 = 6 siswa, Nilai 70 = 4 siswa, Nilai 80 = 10 siswa, Nilai 90 = 3 siswa, Nilai 100 = 2 siswa.<br/>• Urutan nilai terbanyak: 80 (10), 60 (6), 50 (5), 70 (4), 90 (3), 100 (2). Nilai 60 terbanyak kedua, bukan ketiga (Pernyataan 1 SALAH).<br/>• Nilai di bawah 75 (nilai 50, 60, 70) berjumlah: $5 + 6 + 4 = 15$ siswa remedi (Pernyataan 2 BENAR).<br/>• Nilai 90 diperoleh tepat 3 siswa (Pernyataan 3 BENAR)."
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
            art.append('        <thead>')
            art.append('          <tr style="background:#f1f5f9;">')
            for h in tabel_soal["header"]:
                art.append(f'            <th style="border:1px solid #cbd5e1; padding:8px; text-align:center;">{h}</th>')
            art.append('          </tr>')
            art.append('        </thead>')
            art.append('        <tbody>')
            for row in tabel_soal["baris"]:
                art.append('          <tr>')
                for cell in row:
                    art.append(f'            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center;">{cell}</td>')
                art.append('          </tr>')
            art.append('        </tbody>')
            art.append('      </table>')
            art.append('    </div>')

        art.append('    <div data-field="teks_soal">')
        art.append(f'      <p>{teks_soal}</p>')
        art.append('    </div>')

        if "opsi_gambar" in q:
            art.append('    <ol data-field="opsi_jawaban">')
            for lbl, g_path in q["opsi_gambar"]:
                art.append(f'      <li data-label="{lbl}"><img src="{g_path}" data-url="{g_path}" alt="Diagram Batang {lbl}" style="max-width:100%; max-height:160px; border-radius:6px; border:1px solid #e2e8f0;" /></li>')
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
