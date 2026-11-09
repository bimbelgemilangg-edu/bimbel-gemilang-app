# /Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/scripts/data_tka_matematika.py
import os, base64

IMG_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tka_matematika_paket_a'

def get_b64(filename):
    path = os.path.join(IMG_DIR, filename)
    if not os.path.exists(path):
        return ""
    ext = os.path.splitext(filename)[1].lower().replace('.', '')
    mime = 'image/png' if ext == 'png' else 'image/jpeg'
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f"data:{mime};base64,{data}"

PAKET_MAT = "TKA SMP Kota Yogyakarta Tahap 2 - Matematika Paket A"

SOAL_MATEMATIKA = [
    {
        "nomor": 1,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Operasi Bilangan Bulat",
        "cp": "Peserta didik dapat menyelesaikan masalah kontekstual yang melibatkan aturan penilaian bertanda pada kompetisi matematika.",
        "teks_soal": "Dalam kompetisi Olimpiade Matematika, setiap butir soal dijawab benar diberi skor 5, salah −2 dan tidak dijawab −1. Dari 40 butir soal yang disediakan, Andi menjawab benar 30 butir soal dan salah 6 butir soal. Skor yang diperoleh Andi adalah ….",
        "opsi": [
            {"label": "A", "teks": "140"},
            {"label": "B", "teks": "134"},
            {"label": "C", "teks": "130"},
            {"label": "D", "teks": "125"}
        ],
        "kunci": "B",
        "pembahasan": "Diketahui total 40 butir soal: Benar = 30 soal (skor $30 \\times 5 = 150$), Salah = 6 soal (skor $6 \\times (-2) = -12$), Tidak dijawab = $40 - (30 + 6) = 4$ soal (skor $4 \\times (-1) = -4$). Skor total Andi = $150 + (-12) + (-4) = 150 - 16 = 134$."
    },
    {
        "nomor": 2,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Pecahan dan Urutan Bilangan Rasional",
        "cp": "Peserta didik dapat membandingkan dan mengurutkan berbagai pecahan dan desimal dari nilai terbesar ke terkecil.",
        "teks_soal": "Final lomba Sains diikuti oleh empat orang siswa yaitu Andi, Budi, Candra dan Dewi. Tabel berikut adalah hasil akhir skor yang diperoleh oleh empat siswa tersebut:<br><table border='1' cellpadding='6' style='border-collapse:collapse; margin:10px 0;'><thead><tr><th>Nama</th><th>Skor (dari nilai sempurna)</th></tr></thead><tbody><tr><td>Andi</td><td>0,6</td></tr><tr><td>Budi</td><td>55%</td></tr><tr><td>Candra</td><td>2/3</td></tr><tr><td>Dewi</td><td>0,54</td></tr></tbody></table>Urutan juara pertama sampai dengan keempat adalah ….",
        "opsi": [
            {"label": "A", "teks": "Budi – Dewi – Andi – Candra"},
            {"label": "B", "teks": "Dewi – Budi – Andi – Candra"},
            {"label": "C", "teks": "Candra – Andi – Budi – Dewi"},
            {"label": "D", "teks": "Dewi – Budi – Candra – Andi"}
        ],
        "kunci": "C",
        "pembahasan": "Ubah semua nilai ke bentuk desimal berderajat tiga desimal: Candra = $2/3 \\approx 0{,}667$; Andi = $0{,}6 = 0{,}600$; Budi = $55\\% = 0{,}550$; Dewi = $0{,}54 = 0{,}540$. Urutan skor dari tertinggi (juara 1) ke terendah (juara 4): Candra ($0{,}667$) – Andi ($0{,}600$) – Budi ($0{,}550$) – Dewi ($0{,}540$)."
    },
    {
        "nomor": 3,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Faktor Persekutuan Terbesar (FPB)",
        "cp": "Peserta didik dapat menentukan faktor persekutuan terbesar dari tiga bilangan berpangkat.",
        "teks_soal": "Diketahui tiga bilangan $a = (8 \\times 9)$, $b = (3 \\times 4 + 6)$, dan $c = (8^2 - 4^2)$. Faktor persekutuan terbesar dari $a$, $b$ dan $c$ adalah ….",
        "opsi": [
            {"label": "A", "teks": "$2 \\times 3$"},
            {"label": "B", "teks": "$2^3$"},
            {"label": "C", "teks": "$3^2$"},
            {"label": "D", "teks": "$2^2 \\times 3$"}
        ],
        "kunci": "A",
        "pembahasan": "Hitung masing-masing bilangan dan faktorisasi primanya: $a = 8 \\times 9 = 72 = 2^3 \\times 3^2$; $b = 3 \\times 4 + 6 = 12 + 6 = 18 = 2 \\times 3^2$; $c = 8^2 - 4^2 = 64 - 16 = 48 = 2^4 \\times 3$. FPB diambil dari faktor prima sekutu dengan pangkat terendah: faktor $2$ berpangkat $1$ dan faktor $3$ berpangkat $1$. Jadi FPB = $2 \\times 3$."
    },
    {
        "nomor": 4,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Aritmatika Sosial dan Optimasi",
        "cp": "Peserta didik dapat menganalisis kombinasi pembelian semen yang paling murah berdasarkan kebutuhan luas lantai.",
        "teks_soal": "Seorang kontraktor bangunan akan melapisi lantai sebuah ruang kelas seluas 120 m². Karena proyek harus segera dikerjakan, kontraktor membeli semen di toko bangunan terdekat. Namun, sebagian besar stok semen di toko tersebut sedang habis dan pengiriman ulang belum datang, sehingga hanya tersedia beberapa persediaan berikut:<br><table border='1' cellpadding='6' style='border-collapse:collapse; margin:10px 0;'><thead><tr><th>Jenis semen</th><th>Berat (kg)</th><th>Jumlah</th><th>Harga (Rp)</th></tr></thead><tbody><tr><td>Kemasan K</td><td>5</td><td>6</td><td>40.000</td></tr><tr><td>Kemasan B</td><td>10</td><td>6</td><td>75.000</td></tr></tbody></table>Keterangan: K = semen kemasan kecil, B = semen kemasan besar.<br>Jika 1 kg semen dapat melapisi 2 m² lantai, kombinasi pembelian semen yang paling murah agar seluruh lantai dapat dilapisi adalah ….",
        "opsi": [
            {"label": "A", "teks": "3 kemasan B dan 6 kemasan K"},
            {"label": "B", "teks": "4 kemasan B dan 4 kemasan K"},
            {"label": "C", "teks": "5 kemasan B dan 2 kemasan K"},
            {"label": "D", "teks": "6 kemasan B dan 1 kemasan K"}
        ],
        "kunci": "C",
        "pembahasan": "Kebutuhan semen: $120\\text{ m}^2 / 2\\text{ m}^2/\\text{kg} = 60\\text{ kg}$ semen. Uji setiap opsi kombinasi: A. $3B + 6K = 3(10) + 6(5) = 60\\text{ kg}$, biaya = $3(75.000) + 6(40.000) = 225.000 + 240.000 = \\text{Rp}465.000$. B. $4B + 4K = 4(10) + 4(5) = 60\\text{ kg}$, biaya = $4(75.000) + 4(40.000) = 300.000 + 160.000 = \\text{Rp}460.000$. C. $5B + 2K = 5(10) + 2(5) = 60\\text{ kg}$, biaya = $5(75.000) + 2(40.000) = 375.000 + 80.000 = \\text{Rp}455.000$. D. $6B + 1K = 6(10) + 1(5) = 65\\text{ kg}$, biaya = $6(75.000) + 1(40.000) = 450.000 + 40.000 = \\text{Rp}490.000$. Kombinasi yang paling murah adalah 5 kemasan B dan 2 kemasan K dengan biaya Rp455.000."
    },
    {
        "nomor": 5,
        "tipe": "pg_kompleks",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Perbandingan Skala dan Geometri",
        "cp": "Peserta didik dapat menghitung ukuran sebenarnya, keliling, dan luas ruangan pada denah berskala.",
        "teks_soal": "Perhatikan gambar denah rumah berikut!<br>Pilih lebih dari satu pernyataan berikut yang benar terkait dengan denah tersebut!",
        "gambar": {
            "src": get_b64("q5_denah_rumah.jpeg"),
            "alt": "Denah rumah berskala 1 : 150 menunjukkan garasi ABCD di sudut kiri atas"
        },
        "opsi": [
            {"label": "1", "teks": "Panjang garasi AB sebenarnya adalah 7 m."},
            {"label": "2", "teks": "Lebar garasi AD sebenarnya adalah 4,5 m."},
            {"label": "3", "teks": "Keliling garasi ABCD sebenarnya 24 m."},
            {"label": "4", "teks": "Luas garasi ABCD sebenarnya 31,5 m²."}
        ],
        "kunci": "2, 3",
        "pembahasan": "Skala denah = $1 : 150$. Pada denah garasi ABCD: Panjang $AB = 5{,}0\\text{ cm} \\implies$ panjang sebenarnya = $5{,}0 \\times 150 = 750\\text{ cm} = 7{,}5\\text{ m}$ (Pernyataan 1 Salah). Lebar $AD = 3{,}0\\text{ cm} \\implies$ lebar sebenarnya = $3{,}0 \\times 150 = 450\\text{ cm} = 4{,}5\\text{ m}$ (Pernyataan 2 Benar). Keliling garasi ABCD sebenarnya = $2 \\times (p + l) = 2 \\times (7{,}5 + 4{,}5) = 2 \\times 12 = 24\\text{ m}$ (Pernyataan 3 Benar). Luas garasi ABCD sebenarnya = $p \\times l = 7{,}5 \\times 4{,}5 = 33{,}75\\text{ m}^2$ (Pernyataan 4 Salah). Jadi pernyataan yang benar adalah nomor 2 dan 3."
    },
    {
        "nomor": 6,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Perbandingan Berbalik Nilai",
        "cp": "Peserta didik dapat menyelesaikan masalah kontekstual yang melibatkan perbandingan berbalik nilai antara kecepatan dan waktu tempuh.",
        "teks_soal": "Sebuah mobil menempuh jarak dari kota A ke kota B dalam waktu 1,6 jam dengan kecepatan rata-rata 75 km/jam. Jika mobil ingin menempuh jarak yang sama dalam waktu 1 jam, maka kecepatan rata-rata yang harus dicapai adalah ….",
        "opsi": [
            {"label": "A", "teks": "90 km/jam"},
            {"label": "B", "teks": "100 km/jam"},
            {"label": "C", "teks": "110 km/jam"},
            {"label": "D", "teks": "120 km/jam"}
        ],
        "kunci": "D",
        "pembahasan": "Jarak dari kota A ke B: $s = v_1 \\times t_1 = 75\\text{ km/jam} \\times 1{,}6\\text{ jam} = 120\\text{ km}$. Kecepatan rata-rata baru agar menempuh jarak tersebut dalam waktu $t_2 = 1\\text{ jam}$: $v_2 = \\frac{s}{t_2} = \\frac{120\\text{ km}}{1\\text{ jam}} = 120\\text{ km/jam}$."
    },
    {
        "nomor": 7,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Bentuk Akar",
        "cp": "Peserta didik dapat menyederhanakan operasi hitung aljabar pada bentuk akar.",
        "teks_soal": "Hasil dari $\\frac{2\\sqrt{27}+3\\sqrt{48}}{3\\sqrt{12}}$ adalah ….",
        "opsi": [
            {"label": "A", "teks": "3"},
            {"label": "B", "teks": "$3\\sqrt{3}$"},
            {"label": "C", "teks": "12"},
            {"label": "D", "teks": "$12\\sqrt{3}$"}
        ],
        "kunci": "A",
        "pembahasan": "Sederhanakan masing-masing bentuk akar: $2\\sqrt{27} = 2\\sqrt{9 \\times 3} = 2(3)\\sqrt{3} = 6\\sqrt{3}$; $3\\sqrt{48} = 3\\sqrt{16 \\times 3} = 3(4)\\sqrt{3} = 12\\sqrt{3}$; $3\\sqrt{12} = 3\\sqrt{4 \\times 3} = 3(2)\\sqrt{3} = 6\\sqrt{3}$. Maka: $\\frac{6\\sqrt{3} + 12\\sqrt{3}}{6\\sqrt{3}} = \\frac{18\\sqrt{3}}{6\\sqrt{3}} = 3$."
    },
    {
        "nomor": 8,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Aritmatika Sosial (Diskon)",
        "cp": "Peserta didik dapat menghitung selisih harga pembayaran antara diskon tunggal dan diskon bertingkat.",
        "teks_soal": "Perhatikan tabel!<br><table border='1' cellpadding='6' style='border-collapse:collapse; margin:10px 0;'><thead><tr><th>Toko Arjuna</th><th>Toko Krisna</th></tr></thead><tbody><tr><td>Harga Rp210.000</td><td>Harga Rp200.000</td></tr><tr><td>Diskon 30%</td><td>Diskon 20% + 10%</td></tr></tbody></table>Selisih harga pembayaran untuk pembelian sebuah kaos di Toko Arjuna dan Toko Krisna adalah ….",
        "gambar": {
            "src": get_b64("q8_kaos_diskon.jpeg"),
            "alt": "Kaos dan perbandingan diskon Toko Arjuna vs Toko Krisna"
        },
        "opsi": [
            {"label": "A", "teks": "Rp7.000"},
            {"label": "B", "teks": "Rp4.000"},
            {"label": "C", "teks": "Rp3.000"},
            {"label": "D", "teks": "Rp2.000"}
        ],
        "kunci": "C",
        "pembahasan": "Toko Arjuna: Harga awal Rp210.000, diskon 30%. Harga bayar = $(100\\% - 30\\%) \\times 210.000 = 70\\% \\times 210.000 = \\text{Rp}147.000$. Toko Krisna: Harga awal Rp200.000, diskon $20\\% + 10\\%$. Setelah diskon $20\\%$: $80\\% \\times 200.000 = \\text{Rp}160.000$. Setelah diskon $10\\%$ tambahan: $90\\% \\times 160.000 = \\text{Rp}144.000$. Selisih harga pembayaran = $147.000 - 144.000 = \\text{Rp}3.000$."
    },
    {
        "nomor": 9,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Persamaan Linear Satu Variabel (PLSV)",
        "cp": "Peserta didik dapat menyelesaikan persamaan linear satu variabel dan mengevaluasi nilai bentuk aljabar.",
        "teks_soal": "Diketahui $3(4x + 3) = 6x - 15$. Jika $n$ adalah penyelesaian dari persamaan tersebut, nilai dari $3n + 7$ adalah ….",
        "opsi": [
            {"label": "A", "teks": "19"},
            {"label": "B", "teks": "5"},
            {"label": "C", "teks": "−5"},
            {"label": "D", "teks": "−19"}
        ],
        "kunci": "C",
        "pembahasan": "Selesaikan persamaan: $3(4x + 3) = 6x - 15 \\iff 12x + 9 = 6x - 15 \\iff 12x - 6x = -15 - 9 \\iff 6x = -24 \\iff x = -4$. Jadi penyelesaian $n = -4$. Nilai dari $3n + 7 = 3(-4) + 7 = -12 + 7 = -5$."
    },
    {
        "nomor": 10,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Pertidaksamaan Linear Satu Variabel (PtLSV)",
        "cp": "Peserta didik dapat menyelesaikan masalah kontekstual yang melibatkan pertidaksamaan linear satu variabel.",
        "teks_soal": "Bayu akan membeli sejumlah baju sejenis secara online dengan harga Rp55.000 per potong. Setiap transaksi pembelian dikenakan biaya ongkos kirim Rp15.000 (berapapun jumlah baju yang dibeli). Jika Bayu memiliki uang sebesar Rp385.000, maka jumlah maksimum baju yang dapat dibeli Bayu dengan uang tersebut adalah ….",
        "opsi": [
            {"label": "A", "teks": "8 potong"},
            {"label": "B", "teks": "7 potong"},
            {"label": "C", "teks": "6 potong"},
            {"label": "D", "teks": "5 potong"}
        ],
        "kunci": "C",
        "pembahasan": "Misalkan $x$ adalah jumlah baju yang dibeli. Model pertidaksamaan: $55.000x + 15.000 \\le 385.000 \\iff 55.000x \\le 370.000 \\iff x \\le \\frac{370.000}{55.000} \\approx 6{,}727$. Karena jumlah baju harus berupa bilangan bulat, maka jumlah maksimum baju yang dapat dibeli Bayu adalah 6 potong (total biaya: $6 \\times 55.000 + 15.000 = \\text{Rp}345.000$)."
    },
    {
        "nomor": 11,
        "tipe": "benar_salah",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Sistem Persamaan Linear Dua Variabel (SPLDV)",
        "cp": "Peserta didik dapat memodelkan dan menyelesaikan masalah belanja alat tulis menggunakan SPLDV.",
        "teks_soal": "Punky, Qoni dan Rina akan berbelanja buku dan pensil sejenis di toko yang sama. Punky membeli 2 buah buku dan 1 batang pensil seharga Rp18.500. Qoni membeli 3 buah buku dan 2 batang pensil seharga Rp29.000. Sedangkan Rina membeli 1 buah buku dan 3 batang pensil.<br>Tentukan benar atau salah setiap pernyataan berikut:",
        "pernyataan": [
            {"teks": "A. Harga sebuah buku adalah Rp6.000.", "jawaban": "Salah"},
            {"teks": "B. Harga sebuah pensil adalah Rp2.500.", "jawaban": "Benar"},
            {"teks": "C. Harga pembelian Rina adalah Rp15.500.", "jawaban": "Benar"}
        ],
        "kunci": "A: Salah, B: Benar, C: Benar",
        "pembahasan": "Misalkan $b$ = harga buku dan $p$ = harga pensil. Sistem persamaan: (1) $2b + p = 18.500 \\implies p = 18.500 - 2b$. (2) $3b + 2p = 29.000$. Substitusi (1) ke (2): $3b + 2(18.500 - 2b) = 29.000 \\implies 3b + 37.000 - 4b = 29.000 \\implies -b = -8.000 \\implies b = 8.000$. Harga sebuah buku = Rp8.000 (Pernyataan A Salah). Harga sebuah pensil $p = 18.500 - 2(8.000) = \\text{Rp}2.500$ (Pernyataan B Benar). Total belanja Rina = $1b + 3p = 8.000 + 3(2.500) = 8.000 + 7.500 = \\text{Rp}15.500$ (Pernyataan C Benar)."
    },
    {
        "nomor": 12,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Operasi Bentuk Aljabar dan Luas Segitiga",
        "cp": "Peserta didik dapat mengalikan dua suku aljabar untuk menghitung luas daerah segitiga siku-siku.",
        "teks_soal": "Perhatikan gambar!<br>Luas daerah segitiga PQR adalah ….",
        "gambar": {
            "src": get_b64("q12_segitiga_pqr.png"),
            "alt": "Segitiga PQR siku-siku di P dengan alas (x - 4) cm dan tinggi (2x + 6) cm"
        },
        "opsi": [
            {"label": "A", "teks": "$(x^2 - x - 12)\\text{ cm}^2$"},
            {"label": "B", "teks": "$(x^2 + x - 12)\\text{ cm}^2$"},
            {"label": "C", "teks": "$(2x^2 - 2x - 24)\\text{ cm}^2$"},
            {"label": "D", "teks": "$(2x^2 + 2x - 24)\\text{ cm}^2$"}
        ],
        "kunci": "A",
        "pembahasan": "Segitiga siku-siku di P memiliki alas $PQ = (x - 4)\\text{ cm}$ dan tinggi $PR = (2x + 6)\\text{ cm}$. Rumus luas segitiga: $L = \\frac{1}{2} \\times \\text{alas} \\times \\text{tinggi} = \\frac{1}{2} (x - 4)(2x + 6) = (x - 4)(x + 3) = x^2 + 3x - 4x - 12 = (x^2 - x - 12)\\text{ cm}^2$."
    },
    {
        "nomor": 13,
        "tipe": "pg_kompleks",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Relasi dan Fungsi Linear",
        "cp": "Peserta didik dapat menentukan rumus fungsi, nilai variabel domain, serta membedakan domain dan kodomain.",
        "teks_soal": "Perhatikan diagram panah suatu fungsi berikut!<br>Pilih lebih dari satu pernyataan berikut yang benar!",
        "gambar": {
            "src": get_b64("q13_diagram_panah.png"),
            "alt": "Diagram panah f(x) = ax + b dari himpunan A {-4, q, 3} ke B {19, 4, -2, -8}"
        },
        "opsi": [
            {"label": "1", "teks": "Domain fungsi adalah {−4,1,3}."},
            {"label": "2", "teks": "Kodomain fungsi adalah {19,4, −2}."},
            {"label": "3", "teks": "Nilai q = −1."},
            {"label": "4", "teks": "Rumus fungsi f(x) = −3x + 7."}
        ],
        "kunci": "1, 4",
        "pembahasan": "Fungsi $f(x) = ax + b$. Dari diagram: $f(-4) = -4a + b = 19$ dan $f(3) = 3a + b = -2$. Kurangkan kedua persamaan: $-7a = 21 \\implies a = -3$. Nilai $b = -2 - 3(-3) = 7$. Maka rumus fungsi $f(x) = -3x + 7$ (Pernyataan 4 Benar). Menentukan $q$: $f(q) = 4 \\implies -3q + 7 = 4 \\implies -3q = -3 \\implies q = 1$ (Pernyataan 3 Salah). Domain fungsi adalah himpunan asal A = $\\{-4, q, 3\\} = \\{-4, 1, 3\\}$ (Pernyataan 1 Benar). Kodomain fungsi adalah seluruh himpunan kawan B = $\\{19, 4, -2, -8\\}$ (Pernyataan 2 Salah karena $\\{19, 4, -2\\}$ hanyalah daerah hasil/range). Jadi pernyataan yang benar adalah nomor 1 dan 4."
    },
    {
        "nomor": 14,
        "tipe": "benar_salah",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Barisan Aritmatika",
        "cp": "Peserta didik dapat menentukan suku tertentu dan selisih antarsuku pada barisan aritmatika.",
        "teks_soal": "Diketahui barisan aritmatika: $4, 6, p, 10, 12, 14, q, \\dots$<br>Tentukan benar atau salah untuk setiap pernyataan berikut:",
        "pernyataan": [
            {"teks": "A. Nilai p + q = 24.", "jawaban": "Benar"},
            {"teks": "B. Nilai suku ke – 50 adalah 102.", "jawaban": "Benar"},
            {"teks": "C. Selisih suku ke – 50 dengan suku ke– 3 adalah 98.", "jawaban": "Salah"}
        ],
        "kunci": "A: Benar, B: Benar, C: Salah",
        "pembahasan": "Suku pertama $a = 4$ dan beda $b = 6 - 4 = 2$. Suku ke-3 $p = 4 + 2(2) = 8$. Suku ke-7 $q = 4 + 6(2) = 16$. Pernyataan A: $p + q = 8 + 16 = 24$ (Benar). Pernyataan B: $U_{50} = a + 49b = 4 + 49(2) = 4 + 98 = 102$ (Benar). Pernyataan C: Selisih suku ke-50 dan suku ke-3 $= U_{50} - U_3 = 102 - 8 = 94$ (Salah, seharusnya 94 bukan 98)."
    },
    {
        "nomor": 15,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Deret Aritmatika Kontekstual",
        "cp": "Peserta didik dapat menghitung jumlah n suku pertama deret aritmatika pada soal cerita lari marathon.",
        "teks_soal": "Seorang pelari marathon berlatih setiap hari. Pada hari pertama ia menempuh jarak 10 kilometer, dan untuk setiap hari berikutnya ia selalu menambah jarak larinya sejauh 2 kilometer. Jika pelari tersebut berlatih selama 10 hari, maka jumlah jarak total yang telah ia tempuh selama 10 hari adalah ….",
        "opsi": [
            {"label": "A", "teks": "162 km"},
            {"label": "B", "teks": "190 km"},
            {"label": "C", "teks": "200 km"},
            {"label": "D", "teks": "220 km"}
        ],
        "kunci": "B",
        "pembahasan": "Deret aritmatika dengan $a = 10$, $b = 2$, dan $n = 10$. Jumlah total jarak: $S_{10} = \\frac{n}{2} [2a + (n - 1)b] = \\frac{10}{2} [2(10) + (10 - 1)2] = 5 [20 + 18] = 5 \\times 38 = 190\\text{ km}$."
    },
    {
        "nomor": 16,
        "tipe": "benar_salah",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Garis dan Sudut",
        "cp": "Peserta didik dapat menghitung sudut-sudut pada garis sejajar yang dipotong garis transversal.",
        "teks_soal": "Perhatikan gambar!<br>Tentukan benar atau salah untuk setiap pernyataan berikut terkait gambar tersebut:",
        "gambar": {
            "src": get_b64("q16_garis_sudut.png"),
            "alt": "Dua garis sejajar dipotong dua transversal membentuk segitiga dengan sudut 125, 96, p, q, r"
        },
        "pernyataan": [
            {"teks": "A. Nilai q = 65°", "jawaban": "Salah"},
            {"teks": "B. Nilai r = 84°", "jawaban": "Benar"},
            {"teks": "C. Nilai p = 41°", "jawaban": "Benar"}
        ],
        "kunci": "A: Salah, B: Benar, C: Benar",
        "pembahasan": "Sudut $r$ berpelurus dengan sudut $96^\\circ \\implies r = 180^\\circ - 96^\\circ = 84^\\circ$ (Pernyataan B Benar). Sudut $125^\\circ$ berpelurus dengan sudut dalam yang berseberangan dengan $q$: sudut dalam $= 180^\\circ - 125^\\circ = 55^\\circ$. Berdasarkan sifat sudut dalam berseberangan pada garis sejajar, maka $q = 55^\\circ$ (Pernyataan A Salah, karena tertulis $65^\\circ$). Pada segitiga di antara dua garis sejajar, jumlah sudut segitiga $= 180^\\circ$: $p + r + 55^\\circ = 180^\\circ \\implies p + 84^\\circ + 55^\\circ = 180^\\circ \\implies p = 180^\\circ - 139^\\circ = 41^\\circ$ (Pernyataan C Benar)."
    },
    {
        "nomor": 17,
        "tipe": "benar_salah",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Teorema Pythagoras",
        "cp": "Peserta didik dapat menerapkan teorema Pythagoras dalam menghitung jarak vertikal dan ketinggian pesawat.",
        "teks_soal": "Perhatikan gambar!<br>Diketahui jarak dua tank (AB) adalah 240 m, jarak pandang pesawat C dengan tank A adalah 260 m, dan pesawat D dengan tank A adalah 300 m.<br>Tentukan benar atau salah setiap pernyataan berikut:",
        "gambar": {
            "src": get_b64("q17_tank_pesawat.jpeg"),
            "alt": "Tank A dan B di tanah mendatar dengan pesawat C dan D tegak lurus di atas tank B"
        },
        "pernyataan": [
            {"teks": "A. Jarak tank B dengan pesawat C adalah 100 m", "jawaban": "Benar"},
            {"teks": "B. Jarak tank B dengan pesawat D adalah 120 m", "jawaban": "Salah"},
            {"teks": "C. Jarak pesawat C dan D adalah 80 m", "jawaban": "Benar"}
        ],
        "kunci": "A: Benar, B: Salah, C: Benar",
        "pembahasan": "Segitiga siku-siku di titik B: Jarak tank B ke pesawat C: $BC = \\sqrt{AC^2 - AB^2} = \\sqrt{260^2 - 240^2} = \\sqrt{67.600 - 57.600} = \\sqrt{10.000} = 100\\text{ m}$ (Pernyataan A Benar). Jarak tank B ke pesawat D: $BD = \\sqrt{AD^2 - AB^2} = \\sqrt{300^2 - 240^2} = \\sqrt{90.000 - 57.600} = \\sqrt{32.400} = 180\\text{ m}$ (Pernyataan B Salah, tertulis 120 m). Jarak vertikal pesawat C dan D: $CD = BD - BC = 180\\text{ m} - 100\\text{ m} = 80\\text{ m}$ (Pernyataan C Benar)."
    },
    {
        "nomor": 18,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Kekongruenan Segitiga",
        "cp": "Peserta didik dapat mengidentifikasi sisi-sisi dan sudut-sudut yang bersesuaian pada dua segitiga kongruen.",
        "teks_soal": "Perhatikan gambar!<br>Diketahui segitiga ABC kongruen dengan segitiga DEF. Pernyataan berikut yang benar adalah ….",
        "gambar": {
            "src": get_b64("q18_segitiga_kongruen.jpeg"),
            "alt": "Segitiga ABC dengan AB=9, AC=15, sudut B=101 dan segitiga DEF dengan FE=9, FD=11, sudut E=44, sudut D=35"
        },
        "opsi": [
            {"label": "A", "teks": "besar ∠C = 25°"},
            {"label": "B", "teks": "besar ∠A = 35°"},
            {"label": "C", "teks": "EF + BC = 20 cm"},
            {"label": "D", "teks": "ED – BC = 6 cm"}
        ],
        "kunci": "C",
        "pembahasan": "Pada $\\triangle DEF$, sudut $\\angle F = 180^\\circ - (44^\\circ + 35^\\circ) = 101^\\circ$. Karena $\\triangle ABC \\cong \\triangle DEF$, sudut $\\angle B = 101^\\circ$ bersesuaian dengan $\\angle F = 101^\\circ$. Sisi yang bersesuaian: $AB = FE = 9\\text{ cm}$; $BC = FD = 11\\text{ cm}$; $AC = ED = 15\\text{ cm}$. Sudut yang bersesuaian: $\\angle C = \\angle D = 35^\\circ$ dan $\\angle A = \\angle E = 44^\\circ$. Cek opsi C: $EF + BC = 9\\text{ cm} + 11\\text{ cm} = 20\\text{ cm}$ (Benar)."
    },
    {
        "nomor": 19,
        "tipe": "pg_kompleks",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Kesebangunan Bangun Datar",
        "cp": "Peserta didik dapat menentukan perbandingan sisi yang bersesuaian serta menghitung luas pada bangun persegipanjang sebangun.",
        "teks_soal": "Perhatikan gambar.<br>Pekarangan ABCD dan kolam BEFG berbentuk persegipanjang. Diketahui AD = 15 meter, GF = 1,5 meter, dan FE = 2 meter. Diketahui pekarangan ABCD dan kolam BEFG sebangun.<br>Pilihlah lebih dari satu pernyataan berikut yang benar!",
        "gambar": {
            "src": get_b64("q19_kebun_kolam.jpeg"),
            "alt": "Pekarangan ABCD seluas kebun dan kolam BEFG sebangun"
        },
        "opsi": [
            {"label": "1", "teks": "Panjang sisi CD = 20 meter."},
            {"label": "2", "teks": "Luas pekarangan ABCD = 300 m²."},
            {"label": "3", "teks": "Luas Kolam BEFG = 3 m²."},
            {"label": "4", "teks": "Luas kebun = 270 m²."}
        ],
        "kunci": "1, 2, 3",
        "pembahasan": "Kolam BEFG memiliki lebar $GF = 1{,}5\\text{ m}$ dan panjang $FE = 2\\text{ m}$. Karena pekarangan ABCD sebangun dengan kolam BEFG dan lebarnya $AD = 15\\text{ m}$: Panjang sisi $CD = \\frac{FE}{GF} \\times AD = \\frac{2}{1{,}5} \\times 15 = 20\\text{ meter}$ (Pernyataan 1 Benar). Luas pekarangan ABCD = $20\\text{ m} \\times 15\\text{ m} = 300\\text{ m}^2$ (Pernyataan 2 Benar). Luas kolam BEFG = $2\\text{ m} \\times 1{,}5\\text{ m} = 3\\text{ m}^2$ (Pernyataan 3 Benar). Luas kebun (tanah di luar kolam) = $300\\text{ m}^2 - 3\\text{ m}^2 = 297\\text{ m}^2$ (Pernyataan 4 Salah, tertulis $270\\text{ m}^2$). Jadi pernyataan yang benar adalah nomor 1, 2, dan 3."
    },
    {
        "nomor": 20,
        "tipe": "pg_kompleks",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Transformasi Geometri (Refleksi dan Dilatasi)",
        "cp": "Peserta didik dapat menentukan koordinat titik asal hasil refleksi sumbu Y dan faktor skala dilatasi.",
        "teks_soal": "Perhatikan gambar berikut!<br>Trapesium A’B’C’D’ adalah bayangan dari trapesium ABCD setelah dicerminkan terhadap sumbu Y, kemudian trapesium A’B’C’D’ didilatasi dengan pusat O(0,0) dengan faktor skala $k$ memiliki bayangan akhir trapesium A”B”C”D”.<br>Pilih lebih dari satu pernyataan berikut yang benar!",
        "gambar": {
            "src": get_b64("q20_koordinat_trapesium.png"),
            "alt": "Koordinat kartesius transformasi trapesium refleksi dan dilatasi"
        },
        "opsi": [
            {"label": "1", "teks": "Koordinat titik A adalah A(−4, 3)."},
            {"label": "2", "teks": "Koordinat titik B adalah B(−5, 5)."},
            {"label": "3", "teks": "Faktor skala k = 2."},
            {"label": "4", "teks": "Koordinat titik A” (12,6)."}
        ],
        "kunci": "2, 3, 4",
        "pembahasan": "Dari grafik koordinat: $A'(6, 3)$, $B'(5, 5)$, $C'(3, 5)$, $D'(2, 3)$. Karena $A'B'C'D'$ hasil refleksi $ABCD$ terhadap sumbu Y, koordinat titik asal: $A(-6, 3)$ (Pernyataan 1 Salah) dan $B(-5, 5)$ (Pernyataan 2 Benar). Titik $D'(2, 3)$ didilatasi $[O, k]$ menjadi $D''(4, 6)$, sehingga faktor skala $k = 4/2 = 6/3 = 2$ (Pernyataan 3 Benar). Bayangan akhir titik $A'' = 2 \\times (6, 3) = (12, 6)$ (Pernyataan 4 Benar). Jadi pernyataan yang benar adalah nomor 2, 3, dan 4."
    },
    {
        "nomor": 21,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Keliling Gabungan Bangun Datar",
        "cp": "Peserta didik dapat menghitung keliling kolam gabungan jajargenjang dan belah ketupat.",
        "teks_soal": "Perhatikan gambar!<br>Kolam renang ABCDEF merupakan gabungan jajargenjang ABEF dan belah ketupat BCDE. Diketahui panjang AB = 15 meter, BD = 12 meter, dan EC = 16 meter. Keliling kolam renang tersebut adalah ….",
        "gambar": {
            "src": get_b64("q21_kolam_renang.jpeg"),
            "alt": "Kolam renang ABCDEF gabungan jajargenjang dan belah ketupat"
        },
        "opsi": [
            {"label": "A", "teks": "70 meter"},
            {"label": "B", "teks": "80 meter"},
            {"label": "C", "teks": "100 meter"},
            {"label": "D", "teks": "110 meter"}
        ],
        "kunci": "A",
        "pembahasan": "Pada belah ketupat BCDE, diagonal $BD = 12\\text{ m}$ dan $EC = 16\\text{ m}$. Setengah diagonalnya adalah $6\\text{ m}$ dan $8\\text{ m}$. Sisi belah ketupat: $BC = CD = DE = EB = \\sqrt{6^2 + 8^2} = \\sqrt{100} = 10\\text{ m}$. Pada jajargenjang ABEF: sisi $AB = EF = 15\\text{ m}$ dan sisi $AF = BE = 10\\text{ m}$. Keliling batas luar kolam ABCDEF = $AB + BC + CD + DE + EF + FA = 15 + 10 + 10 + 10 + 15 + 10 = 70\\text{ meter}$."
    },
    {
        "nomor": 22,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Luas Daerah Arsiran Lingkaran dan Trapesium",
        "cp": "Peserta didik dapat menghitung luas daerah yang diarsir antara trapesium siku-siku dan juring lingkaran.",
        "teks_soal": "Perhatikan gambar trapesium siku-siku dan juring lingkaran!<br>Diketahui panjang $AB = 22\\text{ cm}$, $DC = 14\\text{ cm}$, dan $AD = 10\\text{ cm}$. Luas daerah yang diarsir adalah ….",
        "gambar": {
            "src": get_b64("q22_highres.png"),
            "alt": "Trapesium siku-siku ABCD terpotong juring lingkaran dengan jari-jari r = 7 cm"
        },
        "opsi": [
            {"label": "A", "teks": "103 cm²"},
            {"label": "B", "teks": "125 cm²"},
            {"label": "C", "teks": "257 cm²"},
            {"label": "D", "teks": "283 cm²"}
        ],
        "kunci": "B",
        "pembahasan": "Luas trapesium siku-siku: $L_{\\text{trapesium}} = \\frac{AB + DC}{2} \\times AD = \\frac{22 + 14}{2} \\times 10 = 18 \\times 10 = 180\\text{ cm}^2$. Juring lingkaran berpusat di sudut C dengan jari-jari $r = 14 / 2 = 7\\text{ cm}$. Sudut $\\angle C = 180^\\circ - \\angle B \\approx 128{,}66^\\circ$. Luas juring $= \\frac{128{,}66^\\circ}{360^\\circ} \\times \\frac{22}{7} \\times 7^2 \\approx 55\\text{ cm}^2$. Luas daerah arsiran $= 180 - 55 = 125\\text{ cm}^2$."
    },
    {
        "nomor": 23,
        "tipe": "benar_salah",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Jaring-jaring Bangun Ruang Sisi Datar",
        "cp": "Peserta didik dapat mengidentifikasi jaring-jaring prisma segitiga, limas, dan balok.",
        "teks_soal": "Perhatikan gambar jaring-jaring bangun ruang sisi datar berikut!<br>Tentukan benar atau salah untuk setiap pernyataan berikut:",
        "gambar": {
            "src": get_b64("q23_jaring_jaring.png"),
            "alt": "Jaring-jaring (1) prisma segitiga, (2) limas segitiga, (3) balok"
        },
        "pernyataan": [
            {"teks": "A. Gambar (1) adalah jaring-jaring prisma segitiga.", "jawaban": "Benar"},
            {"teks": "B. Gambar (2) adalah jaring-jaring limas segiempat.", "jawaban": "Salah"},
            {"teks": "C. Gambar (3) adalah jaring-jaring balok.", "jawaban": "Benar"}
        ],
        "kunci": "A: Benar, B: Salah, C: Benar",
        "pembahasan": "Gambar (1) memiliki 3 persegi panjang dan 2 segitiga penutup, merupakan jaring-jaring prisma segitiga (Pernyataan A Benar). Gambar (2) tersusun dari 4 segitiga (1 alas dan 3 sisi tegak), merupakan jaring-jaring limas segitiga / bidang empat, bukan limas segiempat (Pernyataan B Salah). Gambar (3) tersusun dari 6 persegi panjang yang kongruen berpasangan, merupakan jaring-jaring balok (Pernyataan C Benar)."
    },
    {
        "nomor": 24,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Luas Permukaan Atap Rumah",
        "cp": "Peserta didik dapat menghitung luas atap rumah gabungan dua segitiga dan dua trapesium sama kaki.",
        "teks_soal": "Perhatikan gambar!<br>Pak Edi berencana membuat atap rumah dari genteng. Atap tersebut terbentuk dari dua segitiga sama kaki kongruen dan dua trapesium sama kaki kongruen. Jika diketahui panjang $AB = 8\\text{ m}$, $BC = 11\\text{ m}$, $DE = 5\\text{ m}$ dan $BE = 5\\text{ m}$, luas atap rumah adalah ….",
        "gambar": {
            "src": get_b64("q24_atap_rumah.jpeg"),
            "alt": "Rumah dengan atap limas perisai terbentuk dari 2 segitiga dan 2 trapesium"
        },
        "opsi": [
            {"label": "A", "teks": "76 m²"},
            {"label": "B", "teks": "88 m²"},
            {"label": "C", "teks": "104 m²"},
            {"label": "D", "teks": "112 m²"}
        ],
        "kunci": "B",
        "pembahasan": "Luas 2 segitiga sama kaki (depan dan belakang): alas $AB = 8\\text{ m}$, sisi miring $5\\text{ m}$, tinggi $t_1 = \\sqrt{5^2 - 4^2} = 3\\text{ m}$. Luas = $2 \\times (\\frac{1}{2} \\times 8 \\times 3) = 24\\text{ m}^2$. Luas 2 trapesium sama kaki (kiri dan kanan): sisi sejajar $BC = 11\\text{ m}$ dan $DE = 5\\text{ m}$, tinggi miring $t_2 = \\sqrt{5^2 - (\\frac{11 - 5}{2})^2} = \\sqrt{5^2 - 3^2} = 4\\text{ m}$. Luas = $2 \\times (\\frac{11 + 5}{2} \\times 4) = 2 \\times 32 = 64\\text{ m}^2$. Total luas atap = $24 + 64 = 88\\text{ m}^2$."
    },
    {
        "nomor": 25,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Volume Bangun Ruang Gabungan (Kubus dan Limas)",
        "cp": "Peserta didik dapat menghitung volume total gabungan kubus dan dua limas kongruen.",
        "teks_soal": "Perhatikan gambar!<br>Bangun tersebut terdiri dari kubus dan dua limas yang kongruen. Diketahui panjang $AB = 12\\text{ cm}$ dan panjang $JT = 30\\text{ cm}$. Volume bangun tersebut adalah ….",
        "gambar": {
            "src": get_b64("q25_kubus_limas.png"),
            "alt": "Bangun ruang kubus dengan dua limas segiempat di atas dan bawahnya"
        },
        "opsi": [
            {"label": "A", "teks": "6.042 cm³"},
            {"label": "B", "teks": "4.608 cm³"},
            {"label": "C", "teks": "3.168 cm³"},
            {"label": "D", "teks": "2.592 cm³"}
        ],
        "kunci": "D",
        "pembahasan": "Kubus memiliki rusuk $s = 12\\text{ cm}$. Tinggi total $JT = 30\\text{ cm}$. Tinggi kedua limas kongruen = $30 - 12 = 18\\text{ cm}$, maka tinggi masing-masing limas $t = 9\\text{ cm}$. Volume kubus = $12^3 = 1.728\\text{ cm}^3$. Volume 2 limas = $2 \\times (\\frac{1}{3} \\times 12^2 \\times 9) = 2 \\times 432 = 864\\text{ cm}^3$. Volume total bangun = $1.728 + 864 = 2.592\\text{ cm}^3$."
    },
    {
        "nomor": 26,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Volume Bangun Ruang Sisi Lengkung",
        "cp": "Peserta didik dapat memecahkan masalah kontekstual kapasitas wadah gabungan tabung-kerucut dan gelas setengah bola.",
        "teks_soal": "Perhatikan gambar!<br>Sebuah tempat minum terbentuk dari gabungan tabung dan kerucut seperti pada gambar. Jika tempat minum tersebut berisi penuh sirup, banyaknya gelas setengah bola yang diperlukan untuk memindah semua sirup adalah ….",
        "gambar": {
            "src": get_b64("q26_tempat_minum.jpeg"),
            "alt": "Tempat minum tabung diameter 24 cm tinggi 36 cm dan kerucut tinggi 12 cm serta gelas setengah bola diameter 12 cm"
        },
        "opsi": [
            {"label": "A", "teks": "30 gelas"},
            {"label": "B", "teks": "35 gelas"},
            {"label": "C", "teks": "40 gelas"},
            {"label": "D", "teks": "45 gelas"}
        ],
        "kunci": "C",
        "pembahasan": "Tempat minum: jari-jari $r = 24 / 2 = 12\\text{ cm}$. Volume tabung = $\\pi r^2 t = \\pi (12^2)(36) = 5.184\\pi\\text{ cm}^3$. Volume kerucut = $\\frac{1}{3} \\pi r^2 t = \\frac{1}{3} \\pi (12^2)(12) = 576\\pi\\text{ cm}^3$. Volume total sirup = $5.184\\pi + 576\\pi = 5.760\\pi\\text{ cm}^3$. Gelas setengah bola: diameter $12\\text{ cm} \\implies r = 6\\text{ cm}$. Volume 1 gelas = $\\frac{2}{3} \\pi r^3 = \\frac{2}{3} \\pi (6^3) = 144\\pi\\text{ cm}^3$. Banyaknya gelas = $\\frac{5.760\\pi}{144\\pi} = 40\\text{ gelas}$."
    },
    {
        "nomor": 27,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Statistika (Diagram Batang)",
        "cp": "Peserta didik dapat menganalisis kenaikan data penjualan tertinggi pada diagram batang.",
        "teks_soal": "Perhatikan diagram berikut!<br>Kenaikan penjualan HP merk Apik tertinggi terjadi pada bulan ….",
        "gambar": {
            "src": get_b64("q27_diagram_hp.png"),
            "alt": "Diagram batang penjualan HP Merk Apik bulan Juli sampai Desember"
        },
        "opsi": [
            {"label": "A", "teks": "Juli – Agustus"},
            {"label": "B", "teks": "September – Oktober"},
            {"label": "C", "teks": "Oktober – November"},
            {"label": "D", "teks": "November – Desember"}
        ],
        "kunci": "A",
        "pembahasan": "Kenaikan penjualan antarbulan: Juli – Agustus = $140 - 110 = 30$ unit; September – Oktober = $145 - 125 = 20$ unit; Oktober – November = $160 - 145 = 15$ unit; November – Desember = $185 - 160 = 25$ unit. Kenaikan tertinggi sebesar 30 unit terjadi pada periode bulan Juli – Agustus."
    },
    {
        "nomor": 28,
        "tipe": "pg_kompleks",
        "paket": PAKET_MAT,
        "kesulitan": "sedang",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Statistika (Ukuran Pemusatan dan Penyebaran)",
        "cp": "Peserta didik dapat menganalisis jangkauan, modus, rata-rata, dan frekuensi data tabel ulangan.",
        "teks_soal": "Perhatikan tabel nilai ulangan matematika kelas 9A berikut!<br><table border='1' cellpadding='6' style='border-collapse:collapse; margin:10px 0;'><thead><tr><th>Nilai</th><th>60</th><th>70</th><th>80</th><th>90</th><th>100</th></tr></thead><tbody><tr><td>Frekuensi</td><td>6</td><td>7</td><td>8</td><td>5</td><td>4</td></tr></tbody></table>Berdasarkan tabel, pilihlah lebih dari satu pernyataan berikut yang benar!",
        "opsi": [
            {"label": "1", "teks": "Jangkauan dari data tersebut adalah 40."},
            {"label": "2", "teks": "Modus dari data tersebut adalah 80."},
            {"label": "3", "teks": "Rata-rata data tersebut adalah 78."},
            {"label": "4", "teks": "Banyak siswa yang memperoleh nilai di atas rata-rata adalah 13 orang."}
        ],
        "kunci": "1, 2, 3",
        "pembahasan": "Total siswa $n = 6 + 7 + 8 + 5 + 4 = 30$ siswa. Jumlah nilai: $(60 \\times 6) + (70 \\times 7) + (80 \\times 8) + (90 \\times 5) + (100 \\times 4) = 360 + 490 + 640 + 450 + 400 = 2.340$. Rata-rata = $2.340 / 30 = 78$ (Pernyataan 3 Benar). Jangkauan = Nilai maks - Nilai min = $100 - 60 = 40$ (Pernyataan 1 Benar). Modus = nilai dengan frekuensi terbanyak yaitu nilai 80 dengan frekuensi 8 (Pernyataan 2 Benar). Siswa dengan nilai di atas rata-rata (> 78) adalah siswa bernilai 80, 90, dan 100 dengan total $8 + 5 + 4 = 17$ orang (Pernyataan 4 Salah, tertulis 13 orang). Jadi pernyataan yang benar adalah nomor 1, 2, dan 3."
    },
    {
        "nomor": 29,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Peluang Teoretik",
        "cp": "Peserta didik dapat menentukan peluang teoretik kejadian munculnya bilangan prima pada cakram putar berangka 1 sampai 8.",
        "teks_soal": "Perhatikan gambar!<br>Cakram putar (spiner) terbagi menjadi 8 bagian yang ukurannya sama besar dan masing-masing diberi nomor urut 1 sampai 8 seperti pada gambar. Jika cakram diputar undi maka peluang bilangan prima berhenti pada jarum penunjuk adalah ….",
        "gambar": {
            "src": get_b64("q29_spinner.jpeg"),
            "alt": "Cakram putar spinner 8 bagian bernomor 1 sampai 8"
        },
        "opsi": [
            {"label": "A", "teks": "3/8"},
            {"label": "B", "teks": "4/8"},
            {"label": "C", "teks": "5/8"},
            {"label": "D", "teks": "7/8"}
        ],
        "kunci": "B",
        "pembahasan": "Ruang sampel cakram putar: $S = \\{1, 2, 3, 4, 5, 6, 7, 8\\} \\implies n(S) = 8$. Kejadian muncul bilangan prima: $A = \\{2, 3, 5, 7\\} \\implies n(A) = 4$. Peluang muncul bilangan prima: $P(A) = \\frac{n(A)}{n(S)} = \\frac{4}{8}$."
    },
    {
        "nomor": 30,
        "tipe": "pg_sederhana",
        "paket": PAKET_MAT,
        "kesulitan": "mudah",
        "kelas": "9",
        "mapel": "Matematika",
        "materi": "Peluang Empirik dan Rasio Keberhasilan",
        "cp": "Peserta didik dapat menganalisis dan membandingkan peluang empirik keberhasilan tumbuh biji tanaman.",
        "teks_soal": "Empat percobaan menanam biji kacang hijau dilakukan dengan tanah dan pupuk yang sama. Hasilnya sebagai berikut:<br>• Percobaan E: ditanam 20 biji kacang hijau jenis A, tumbuh 15 biji.<br>• Percobaan F: ditanam 25 biji kacang hijau jenis B, tumbuh 18 biji.<br>• Percobaan G: ditanam 30 biji kacang hijau jenis C, tumbuh 24 biji.<br>• Percobaan H: ditanam 40 biji kacang hijau jenis D, tumbuh 31 biji.<br>Berdasarkan data tersebut, jenis biji kacang apakah yang paling cocok untuk ditanam pada tanah dan pupuk seperti pada percobaan?",
        "opsi": [
            {"label": "A", "teks": "Kacang hijau jenis A."},
            {"label": "B", "teks": "Kacang hijau jenis B."},
            {"label": "C", "teks": "Kacang hijau jenis C."},
            {"label": "D", "teks": "Kacang hijau jenis D."}
        ],
        "kunci": "C",
        "pembahasan": "Hitung rasio / persentase keberhasilan tumbuh tiap jenis biji: Jenis A = $15/20 = 75\\%$; Jenis B = $18/25 = 72\\%$; Jenis C = $24/30 = 80\\%$; Jenis D = $31/40 = 77{,}5\\%$. Biji kacang hijau jenis C memiliki persentase keberhasilan tumbuh paling tinggi yaitu $80\\%$, sehingga paling cocok ditanam."
    }
]

print("Data Matematika (30 Soal) Loaded Successfully")
