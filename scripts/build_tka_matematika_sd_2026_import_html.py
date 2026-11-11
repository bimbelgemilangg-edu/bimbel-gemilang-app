# scripts/build_tka_matematika_sd_2026_import_html.py
# Generator Dokumen Master HTML Bank Soal Gemilang: TKA Matematika SD/MI 2026 (30 Soal Lengkap)
import os
import re

OUT_FILE = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/tka_matematika_sd_2026_lengkap.html"
OUT_FILE_IMPOR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/data/impor/tka_matematika_sd_2026_lengkap.html"

os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
os.makedirs(os.path.dirname(OUT_FILE_IMPOR), exist_ok=True)

questions_data = [
    {
        "nomor": 1,
        "tipe": "benar_salah",
        "materi": "Pecahan Senilai dan Representasi Visual",
        "capaian": "Menentukan representasi pecahan dari bagian suatu objek utuh",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Representasi Pecahan Objek Utuh",
            "teks": "Bangun datar berikut merupakan potongan yang terlihat mewakili bagian dari suatu objek utuh ($\\frac{1}{6}$):",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_01_potongan_seperenam.png"]
        },
        "teks_soal": "Manakah dari gambar berikut ini yang merupakan gambar objek utuh tersebut? Tentukan Benar atau Salah pada setiap gambar berikut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "", "gambar": ["/soal/tka-matematika-sd-2026/soal_01_blok_1.png"], "kunci": "Benar"},
            {"teks": "", "gambar": ["/soal/tka-matematika-sd-2026/soal_01_blok_2.png"], "kunci": "Salah"},
            {"teks": "", "gambar": ["/soal/tka-matematika-sd-2026/soal_01_blok_3.png"], "kunci": "Benar"}
        ],
        "kunci": ["Benar", "Salah", "Benar"],
        "pembahasan": "Potongan awal mewakili $\\frac{1}{6}$ dari objek utuh, sehingga 1 objek utuh harus tersusun dari $6$ potongan berukuran dan berproporsi identik. Pada gambar 1, terdapat $6$ potongan identik (grid $2 \\times 3$), sehingga Benar. Pada gambar 2, proporsi potongan berbeda, sehingga Salah. Pada gambar 3, terdapat $6$ potongan identik yang disusun bertingkat ($2 + 2 + 2 = 6$), sehingga Benar."
    },
    {
        "nomor": 2,
        "tipe": "pg_sederhana",
        "materi": "Mengurutkan Bilangan Rasional",
        "capaian": "Mengurutkan beberapa bilangan yang dinyatakan dalam bentuk berbeda",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Kapasitas Pembangkit Listrik di Indonesia",
            "teks": "Tahukah kamu dari mana listrik berasal? Listrik berasal dari pembangkit listrik. Di Indonesia terdapat berbagai macam pembangkit listrik. Pembangkit listrik tersebut telah menghasilkan tenaga listrik sebanyak 40.000 megawatt. Berikut kapasitas listrik yang dihasilkan dari setiap pembangkit listrik:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_02_pembangkit_listrik.png"]
        },
        "teks_soal": "Jenis pembangkit listrik yang menghasilkan listrik terbesar adalah ....",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "PLTA"},
            {"label": "B", "teks": "PLTG"},
            {"label": "C", "teks": "PLTU"},
            {"label": "D", "teks": "PLTGU"}
        ],
        "kunci": "C",
        "pembahasan": "Konversikan seluruh kapasitas listrik ke bentuk persentase:\n- PLTU: $\\frac{1}{2} = 50\\%$\n- PLTA: $0,075 = 7,5\\%$\n- PLTG: $5\\%$\n- PLTGU: $30\\%$\n- PLTD: $\\frac{3}{40} = 7,5\\%$\nPembangkit listrik yang menghasilkan daya terbesar adalah PLTU ($50\\%$)."
    },
    {
        "nomor": 3,
        "tipe": "pg_kompleks",
        "materi": "Faktor Bilangan Cacah",
        "capaian": "Menentukan faktor suatu bilangan cacah dan mengurutkan bilangan",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Bantuan Beras Desa",
            "teks": "Pemerintah suatu desa membuat program untuk memenuhi kebutuhan pokok warganya. Pemerintah desa tersebut akan memberikan bantuan berupa beras kepada warga setempat. Sebelum dibagikan, beras tersebut dimasukkan ke dalam karung-karung dengan ukuran yang sama (Karung Jenis A: 5 kg, Karung Jenis B: 3 kg).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_03_karung_beras.png"]
        },
        "teks_soal": "Pada bulan Januari 2024, terdapat 150 karung beras yang akan dibagikan ke beberapa keluarga kurang mampu. Masing-masing keluarga tersebut akan memperoleh beras dengan jumlah yang sama. Setiap keluarga dapat menerima lebih dari satu karung beras. Berapa banyak keluarga kurang mampu yang mungkin akan menerima beras pada bulan Januari 2024? Pilih semua jawaban benar!",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "30"},
            {"label": "B", "teks": "25"},
            {"label": "C", "teks": "20"}
        ],
        "kunci": ["A", "B"],
        "pembahasan": "Banyak keluarga yang menerima harus merupakan faktor pembagi dari 150 karung beras:\n- $150 : 30 = 5$ karung per keluarga (bilangan bulat $> 1$ karung) $\\rightarrow$ Mungkin.\n- $150 : 25 = 6$ karung per keluarga (bilangan bulat $> 1$ karung) $\\rightarrow$ Mungkin.\n- $150 : 20 = 7,5$ karung (bukan bilangan bulat) $\\rightarrow$ Tidak mungkin.\nJadi jawaban benar adalah 30 dan 25 keluarga."
    },
    {
        "nomor": 4,
        "tipe": "pg_sederhana",
        "materi": "Operasi Hitung Bilangan Cacah",
        "capaian": "Menggunakan operasi bilangan cacah dan menyatakannya dalam berbagai bentuk",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Distribusi Karung Beras Jenis B",
            "teks": "Pemerintah suatu desa membuat program untuk memenuhi kebutuhan pokok warganya. Sebelum dibagikan, beras dimasukkan ke dalam karung Jenis A (5 kg) atau Karung Jenis B (3 kg).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_04_karung_beras.png"]
        },
        "teks_soal": "Pada bulan Juli 2024, pemerintah memiliki persediaan beras sebanyak 1.500 kg. Keseluruhan beras dikemas dalam karung jenis B (3 kg). Sebagian beras tersebut dibagikan kepada 450 keluarga kurang mampu masing-masing satu karung. Berapa karung beras yang tersisa?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "500 karung."},
            {"label": "B", "teks": "300 karung."},
            {"label": "C", "teks": "150 karung."},
            {"label": "D", "teks": "50 karung."}
        ],
        "kunci": "D",
        "pembahasan": "Total karung jenis B yang dihasilkan $= 1.500 : 3 = 500$ karung. Dibagikan kepada 450 keluarga masing-masing 1 karung $= 450$ karung. Sisa karung beras $= 500 - 450 = 50$ karung."
    },
    {
        "nomor": 5,
        "tipe": "pg_sederhana",
        "materi": "Pemodelan Kalimat Matematika",
        "capaian": "Memodelkan masalah kontekstual ke dalam bentuk kalimat matematika yang melibatkan bilangan cacah",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Produksi Keripik Kentang Home Industry",
            "teks": "Sebuah pabrik *home industry* memproduksi keripik kentang. Kentang mentah disimpan dalam karung berkapasitas 100 kg sebagai berikut:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_05_karung_kentang.png"]
        },
        "teks_soal": "Dari satu karung kentang (100 kg) telah dibuat sejumlah keripik dan masih tersisa 4 kg. Setiap 1 kg kentang dapat dibuat menjadi 6 bungkus keripik. Keripik yang sudah jadi dimasukkan ke dalam kardus yang masing-masing memuat 12 bungkus keripik. Perhitungan yang tepat untuk menentukan banyak kardus yang dibutuhkan adalah ....",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "$(100 - 4) \\times 6 : 12$"},
            {"label": "B", "teks": "$(100 - 4) : 6 \\times 12$"},
            {"label": "C", "teks": "$(100 + 4) \\times 6 : 12$"},
            {"label": "D", "teks": "$(100 + 4) : 6 \\times 12$"}
        ],
        "kunci": "A",
        "pembahasan": "Berat kentang yang diolah $= (100 - 4)$ kg. Setiap 1 kg menghasilkan 6 bungkus keripik, sehingga total bungkus keripik $= (100 - 4) \\times 6$. Setiap kardus berisi 12 bungkus, sehingga banyak kardus $= (100 - 4) \\times 6 : 12$."
    },
    {
        "nomor": 6,
        "tipe": "pg_sederhana",
        "materi": "Operasi Campuran Pecahan dan Bilangan Asli",
        "capaian": "Menentukan hasil operasi hitung campuran yang melibatkan pecahan dan bilangan asli",
        "kesulitan": "sedang",
        "teks_soal": "Hasil dari $\\frac{3}{25} \\times 3\\frac{7}{6} + 135 : 15$ adalah ....",
        "opsi": [
            {"label": "A", "teks": "$2\\frac{1}{2}$"},
            {"label": "B", "teks": "$9\\frac{1}{30}$"},
            {"label": "C", "teks": "$9\\frac{1}{2}$"},
            {"label": "D", "teks": "$\\frac{32}{225}$"}
        ],
        "kunci": "C",
        "pembahasan": "Ubah pecahan campuran: $3\\frac{7}{6} = \\frac{3 \\times 6 + 7}{6} = \\frac{25}{6}$.\nHitung perkalian: $\\frac{3}{25} \\times \\frac{25}{6} = \\frac{3}{6} = \\frac{1}{2}$.\nHitung pembagian: $135 : 15 = 9$.\nJumlahkan: $\\frac{1}{2} + 9 = 9\\frac{1}{2}$."
    },
    {
        "nomor": 7,
        "tipe": "benar_salah",
        "materi": "Diagram Alir dan Logika Aritmetika",
        "capaian": "Mengevaluasi kebenaran hasil operasi aritmetika bilangan cacah pada diagram alir",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Diagram Alir Operasi Matematika",
            "teks": "Sebuah program komputer memiliki proses alur berpikir sebagai berikut:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_07_diagram_alir.png"]
        },
        "teks_soal": "Tentukan Benar atau Salah pada setiap pernyataan berikut berdasarkan alur program tersebut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "Jika bilangan yang dimasukkan adalah bilangan ganjil, maka hasil akhir juga bilangan ganjil.", "kunci": "Salah"},
            {"teks": "Hasil akhir adalah nol jika bilangan yang dimasukkan adalah bilangan 0.", "kunci": "Benar"},
            {"teks": "Jika bilangan yang dimasukkan adalah bilangan genap, maka hasil akhir adalah bilangan kelipatan dua.", "kunci": "Benar"}
        ],
        "kunci": ["Salah", "Benar", "Benar"],
        "pembahasan": "- Pernyataan 1: Misal input $1$ (ganjil). $1 + 5 = 6$ (kelipatan 6). Masuk 'Ya': $6 : 3 = 2$, lalu $2 \\times 2 = 4$ (genap). Jadi pernyataan salah.\n- Pernyataan 2: Input $0$. $0 + 5 = 5$ (bukan kelipatan 6). Masuk 'Tidak': $5 - 5 = 0$. Hasil akhir 0 (Benar).\n- Pernyataan 3: Input genap. Jika kelipatan 6, hasil dikalikan 2 (kelipatan dua). Jika bukan kelipatan 6, $(genap + 5) - 5 = genap$ (kelipatan dua). Selalu kelipatan dua (Benar)."
    },
    {
        "nomor": 8,
        "tipe": "pg_sederhana",
        "materi": "Persamaan Sederhana Operasi Hitung",
        "capaian": "Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan atau pengurangan",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Sifat Kemagnetan Benda",
            "teks": "Tahukah kamu bahwa tidak semua benda dapat ditarik magnet? Feromagnetik adalah benda yang mudah ditarik magnet, paramagnetik adalah benda yang lemah ditarik magnet, dan diamagnetik adalah benda yang sulit ditarik magnet.",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_08_magnet_feromagnetik.png"]
        },
        "teks_soal": "Di dalam suatu wadah terdapat 25 benda yang berbeda jenisnya. Ternyata 12 diantaranya termasuk feromagnetik dan 7 lainnya paramagnetik, sedangkan sisanya benda diamagnetik. Setelah itu, benda ditambah sehingga menjadi 9 benda diamagnetik. Berapakah benda diamagnetik yang baru ditambahkan?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "3 benda."},
            {"label": "B", "teks": "5 benda."},
            {"label": "C", "teks": "9 benda."},
            {"label": "D", "teks": "15 benda."}
        ],
        "kunci": "A",
        "pembahasan": "Benda diamagnetik mula-mula $= 25 - (12 + 7) = 25 - 19 = 6$ benda. Agar menjadi 9 benda diamagnetik, tambahan yang diperlukan $= 9 - 6 = 3$ benda."
    },
    {
        "nomor": 9,
        "tipe": "pg_kompleks",
        "materi": "Persamaan Sederhana Pembangkit Listrik Air",
        "capaian": "Menyelesaikan persamaan sederhana menggunakan operasi penjumlahan atau pengurangan",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Pembangkit Listrik Tenaga Air Desa",
            "teks": "Di suatu desa terdapat tiga kincir air untuk memenuhi kebutuhan listrik: Kincir A (94 watt/hari), Kincir B (82 watt/hari), dan Kincir C (96 watt/hari).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_09_kincir_air.png"]
        },
        "teks_soal": "Ketiga kincir digunakan selama dua hari. Sisa daya listrik setelah dua hari dicatat: Kincir A sisa 42 watt, Kincir B sisa 13 watt, dan Kincir C sisa 30 watt. Kincir mana saja yang daya listrik terpakainya lebih dari 150 watt? Pilih semua jawaban yang benar!",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "Kincir A"},
            {"label": "B", "teks": "Kincir B"},
            {"label": "C", "teks": "Kincir C"}
        ],
        "kunci": ["B", "C"],
        "pembahasan": "- Kincir A: Total daya $= 2 \\times 94 = 188$ watt. Terpakai $= 188 - 42 = 146$ watt ($< 150$ watt).\n- Kincir B: Total daya $= 2 \\times 82 = 164$ watt. Terpakai $= 164 - 13 = 151$ watt ($> 150$ watt).\n- Kincir C: Total daya $= 2 \\times 96 = 192$ watt. Terpakai $= 192 - 30 = 162$ watt ($> 150$ watt).\nKincir dengan daya terpakai $> 150$ watt adalah Kincir B dan Kincir C."
    },
    {
        "nomor": 10,
        "tipe": "pg_sederhana",
        "materi": "Operasi Perkalian dan Pembagian Bilangan",
        "capaian": "Menyelesaikan persamaan sederhana menggunakan berbagai bentuk operasi bilangan",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Informasi Kandungan Gizi Ikan Salmon",
            "teks": "Ikan salmon memiliki banyak kandungan bergizi: tinggi protein sekitar 20 gram per porsi, rendah kalori (150 kalori per porsi), dan lemak omega-3 (10 gram per porsi).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_10_manfaat_ikan_salmon.png"]
        },
        "teks_soal": "Jika dalam satu sajian ikan salmon terdapat 80 gram protein, berapa porsi salmon yang disajikan dalam sajian tersebut?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "8 porsi."},
            {"label": "B", "teks": "6 porsi."},
            {"label": "C", "teks": "4 porsi."},
            {"label": "D", "teks": "2 porsi."}
        ],
        "kunci": "C",
        "pembahasan": "Kandungan protein per 1 porsi adalah 20 gram. Banyaknya porsi untuk 80 gram protein $= 80 : 20 = 4$ porsi."
    },
    {
        "nomor": 11,
        "tipe": "benar_salah",
        "materi": "Perbandingan dan Konversi Satuan",
        "capaian": "Mengevaluasi informasi dengan menggunakan persamaan sederhana operasi hitung",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Bahan dan Proses Pembuatan Keju",
            "teks": "Proses pembuatan keju sederhana menggunakan bahan-bahan: 2 gelas susu segar (1 gelas = 200 ml, total 400 ml), 4 sendok teh cuka (1 sdt = 5 ml, total 20 ml), dan garam secukupnya.",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_11_bahan_proses_keju.png"]
        },
        "teks_soal": "Setiap 1 resep pembuatan keju membutuhkan garam sebanyak 4 gr. Seseorang akan membuat keju sebanyak 5 kali resep awal dengan persediaan bahan 2.000 ml susu sapi segar, 140 ml cuka, dan 16 gr garam. Tentukan Benar atau Salah untuk setiap pernyataan berikut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "Seharusnya disediakan garam sebanyak 20 gr.", "kunci": "Benar"},
            {"teks": "Terdapat kekurangan cuka sebanyak 40 ml.", "kunci": "Salah"},
            {"teks": "Tidak perlu tambahan susu sapi segar.", "kunci": "Benar"}
        ],
        "kunci": ["Benar", "Salah", "Benar"],
        "pembahasan": "- Garam yang dibutuhkan $= 5 \\times 4\\text{ gr} = 20\\text{ gr}$. Karena persediaan hanya 16 gr, maka seharusnya disediakan 20 gr (Benar).\n- Cuka yang dibutuhkan $= 5 \\times 20\\text{ ml} = 100\\text{ ml}$. Persediaan 140 ml, sehingga cuka berlebih 40 ml, bukan kurang (Salah).\n- Susu yang dibutuhkan $= 5 \\times 400\\text{ ml} = 2.000\\text{ ml}$. Persediaan tepat 2.000 ml, sehingga tidak perlu tambahan susu segar (Benar)."
    },
    {
        "nomor": 12,
        "tipe": "pg_kompleks",
        "materi": "Kelipatan Persekutuan Terkecil (KPK)",
        "capaian": "Menentukan KPK dan FPB dari informasi kontekstual",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Jadwal Mencuci di Laundry Koin",
            "teks": "Linda dan Vidya mencuci baju kotor di tempat laundry koin yang sama. Linda pergi ke laundry setiap 8 hari sekali, sedangkan Vidya setiap 6 hari sekali.",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_12_laundry_koin_kalender.png"]
        },
        "teks_soal": "Pada tanggal 10 Agustus 2024, Linda dan Vidya bertemu di tempat laundry. Kapankah mereka akan bertemu kembali? Pilih semua jawaban benar!",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "3 September 2024"},
            {"label": "B", "teks": "27 September 2024"},
            {"label": "C", "teks": "21 October 2024"}
        ],
        "kunci": ["A", "B", "C"],
        "pembahasan": "KPK dari 8 dan 6 adalah 24 hari:\n- Pertemuan ke-2: $10\\text{ Agustus} + 24\\text{ hari} = 34\\text{ Agustus} - 31 = 3\\text{ September 2024}$ (Benar).\n- Pertemuan ke-3: $3\\text{ September} + 24\\text{ hari} = 27\\text{ September 2024}$ (Benar).\n- Pertemuan ke-4: $27\\text{ September} + 24\\text{ hari} = 51\\text{ September} - 30 = 21\\text{ Oktober 2024}$ (Benar)."
    },
    {
        "nomor": 13,
        "tipe": "benar_salah",
        "materi": "Sifat dan Karakteristik Bangun Datar",
        "capaian": "Membedakan ciri-ciri berbagai jenis bangun datar",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Hiasan Dinding Huruf Kayu",
            "teks": "Perajin kayu sedang membuat hiasan dinding berbentuk huruf balok E sebagai satu bidang datar:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_13_hiasan_huruf_e.png"]
        },
        "teks_soal": "Bagaimanakah ciri-ciri hiasan dinding berbentuk huruf E tersebut? Tentukan Benar atau Salah untuk setiap pernyataan berikut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "Memiliki 12 sisi.", "kunci": "Benar"},
            {"teks": "Terdapat 12 titik sudut.", "kunci": "Benar"},
            {"teks": "Terdapat 10 sudut siku-siku.", "kunci": "Salah"}
        ],
        "kunci": ["Benar", "Benar", "Salah"],
        "pembahasan": "- Poligon huruf E memiliki 12 ruas garis luar, sehingga mempunyai 12 sisi (Benar).\n- Banyak titik sudut sama dengan banyak sisi, yaitu 12 titik sudut (Benar).\n- Seluruh 12 sudut pada huruf E merupakan sudut tegak lurus (ortogonal), bukan 10 sudut (Salah)."
    },
    {
        "nomor": 14,
        "tipe": "benar_salah",
        "materi": "Bangun Datar Penyusun Segi Banyak",
        "capaian": "Mengidentifikasi berbagai bangun datar penyusun suatu bangun segi banyak",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Gabungan Bangun Datar Segi Banyak",
            "teks": "Gambar berikut memperlihatkan sebuah segi banyak yang dibentuk dari gabungan beberapa bangun datar tanpa beririsan pada grid:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_14_segi_banyak_grid.png"]
        },
        "teks_soal": "Berikut ini adalah pernyataan mengenai bangun datar penyusun segi banyak tersebut. Tentukan Benar atau Salah pada setiap pernyataan berikut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "3 segitiga dan 1 persegi panjang.", "kunci": "Benar"},
            {"teks": "4 segitiga dan 1 trapesium.", "kunci": "Benar"},
            {"teks": "5 segitiga dan 1 layang-layang.", "kunci": "Salah"}
        ],
        "kunci": ["Benar", "Benar", "Salah"],
        "pembahasan": "- Bangun dapat dipartisi menjadi 1 persegi panjang di tengah, serta 3 segitiga (atas, kanan, bawah), sehingga pernyataan 1 benar.\n- Persegi panjang tengah dan segitiga dapat dipartisi kembali menjadi 1 trapesium dan 4 segitiga, sehingga pernyataan 2 benar.\n- Bangun sayap tidak memiliki sumbu simetri layang-layang yang pas dengan 5 segitiga, sehingga pernyataan 3 salah."
    },
    {
        "nomor": 15,
        "tipe": "pg_sederhana",
        "materi": "Visualisasi Spasial Bangun Ruang",
        "capaian": "Menyelesaikan masalah terkait konstruksi bangun ruang dan visualisasi spasial",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Susunan Kubus Satuan",
            "teks": "Gambar berikut memperlihatkan susunan kubus berukuran sama:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_15_susunan_kubus.png"]
        },
        "teks_soal": "Berdasarkan susunan tersebut, jumlah semua kubus yang mungkin adalah ....",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "12"},
            {"label": "B", "teks": "13"},
            {"label": "C", "teks": "14"},
            {"label": "D", "teks": "15"}
        ],
        "kunci": "A",
        "pembahasan": "Hitung jumlah kubus per kolom vertikal:\n- Kolom menara utama: tinggi 4 kubus $= 4$.\n- Kolom samping kiri: tinggi 2 kubus $= 2$.\n- Kolom samping kanan menara: tinggi 2 kubus $= 2$.\n- Kubus di depan kolom kiri: tinggi 1 kubus $= 1$.\n- Kubus di depan menara: tinggi 1 kubus $= 1$.\n- Dua kubus di bagian depan kanan: masing-masing tinggi 1 kubus $= 2$.\nTotal seluruh kubus yang tampak dan menyangga adalah $4 + 2 + 2 + 1 + 1 + 2 = 12$ kubus."
    },
    {
        "nomor": 16,
        "tipe": "pg_kompleks",
        "materi": "Kelogisan Pengukuran Satuan Panjang",
        "capaian": "Mengidentifikasi kelogisan penggunaan satuan baku panjang dalam masalah pengukuran",
        "kesulitan": "mudah",
        "teks_soal": "Berikut ini, manakah yang menunjukkan hasil pengukuran yang paling tepat dan masuk akal? Pilih semua jawaban benar! Jawaban benar lebih dari satu.",
        "opsi": [
            {"label": "A", "teks": "Tinggi tiang bendera di sekolah adalah 8 meter."},
            {"label": "B", "teks": "Jarak rumah Budi ke sekolah adalah 30 milimeter."},
            {"label": "C", "teks": "Lebar buku tulis ini sekitar 20 centimeter."}
        ],
        "kunci": ["A", "C"],
        "pembahasan": "- Opsi A: Tinggi tiang bendera sekolah umumnya berkisar 6-10 meter, sehingga 8 meter sangat masuk akal (Benar).\n- Opsi B: Jarak 30 milimeter setara dengan 3 cm, tidak masuk akal untuk jarak rumah ke sekolah (Salah).\n- Opsi C: Lebar buku tulis umumnya berkisar 15-21 cm, sehingga 20 centimeter sangat masuk akal (Benar)."
    },
    {
        "nomor": 17,
        "tipe": "pg_sederhana",
        "materi": "Representasi Visual Volume Satuan Baku",
        "capaian": "Menentukan representasi visual dari volume benda menggunakan satuan baku",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Eksperimen Air Warna-Warni dalam Botol",
            "teks": "Sepulang sekolah, Dewi dan temannya bermain air warna-warni yang dimasukkan ke dalam botol dengan ukuran dan bentuk yang sama. Botol A diisi air merah 450 ml, botol B air hijau 530 ml, botol C air kuning 540 ml, dan botol D air biru 470 ml.",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_17_botol_warna_warni.png"]
        },
        "teks_soal": "Manakah gambar yang tepat menunjukkan tinggi permukaan air berwarna di setiap botol?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_17_opsi_a.png"},
            {"label": "B", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_17_opsi_b.png"},
            {"label": "C", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_17_opsi_c.png"},
            {"label": "D", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_17_opsi_d.png"}
        ],
        "kunci": "A",
        "pembahasan": "Urutan volume dari yang terkecil ke terbesar:\n$\\text{Botol A } (450\\text{ ml}) < \\text{Botol D } (470\\text{ ml}) < \\text{Botol B } (530\\text{ ml}) < \\text{Botol C } (540\\text{ ml})$.\nGambar pada Opsi A menunjukkan botol C memiliki permukaan air tertinggi, disusul B, D, dan botol A paling rendah."
    },
    {
        "nomor": 18,
        "tipe": "benar_salah",
        "materi": "Kesetimbangan Neraca dan Berat Benda",
        "capaian": "Menentukan representasi kesetimbangan neraca berdasarkan perbandingan berat benda",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Bahan Jajanan Cireng Bu Halimah",
            "teks": "Bu Halimah berjualan jajanan cireng isi ayam suwir pedas. Bahan-bahan yang digunakan: Tepung Tapioka (1.250 g), Tepung Terigu (500 g), Daging Ayam (1.500 g), Bawang (250 g), dan Cabai (250 g).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_18_bahan_cireng.png"]
        },
        "teks_soal": "Bagaimana hubungan berat bahan-bahan tersebut jika ditimbang menggunakan neraca? Tentukan Benar atau Salah pada setiap gambar berikut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "", "gambar": ["/soal/tka-matematika-sd-2026/soal_18_neraca_1.png"], "kunci": "Benar"},
            {"teks": "", "gambar": ["/soal/tka-matematika-sd-2026/soal_18_neraca_2.png"], "kunci": "Salah"},
            {"teks": "", "gambar": ["/soal/tka-matematika-sd-2026/soal_18_neraca_3.png"], "kunci": "Benar"}
        ],
        "kunci": ["Benar", "Salah", "Benar"],
        "pembahasan": "- Gambar 1: Bawang (250 g) dan Cabai (250 g) sama berat, posisi neraca seimbang mendatar (Benar).\n- Gambar 2: Terigu 500 g lebih ringan dari Ayam 1.500 g, seharusnya sisi ayam yang turun ke bawah (Salah).\n- Gambar 3: Tapioka 1.250 g lebih berat dari Terigu 500 g, sisi tapioka turun ke bawah (Benar)."
    },
    {
        "nomor": 19,
        "tipe": "pg_sederhana",
        "materi": "Pengukuran Waktu Jam Analog",
        "capaian": "Menentukan durasi suatu aktivitas berdasarkan keterangan waktu pada jam analog",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Waktu Memasak Bu Nina",
            "teks": "Bu Nina memasak beberapa jenis makanan untuk keluarganya. Waktu mulai dan selesai memasak ditunjukkan pada jam analog berikut:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_19_jam_analog_memasak.png"]
        },
        "teks_soal": "Berapa lama Bu Nina memasak makanan tersebut?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "2 jam 10 menit."},
            {"label": "B", "teks": "2 jam 40 menit."},
            {"label": "C", "teks": "3 jam 10 menit."},
            {"label": "D", "teks": "3 jam 40 menit."}
        ],
        "kunci": "B",
        "pembahasan": "Mulai memasak pukul $07.10$. Selesai memasak pukul $09.50$. Durasi memasak $= 09.50 - 07.10 = 2\\text{ jam } 40\\text{ menit}$."
    },
    {
        "nomor": 20,
        "tipe": "pg_sederhana",
        "materi": "Keliling Segi Banyak Tidak Beraturan",
        "capaian": "Menghitung keliling bangun datar segi banyak tidak beraturan yang diketahui panjang semua sisinya",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Sketsa Bangun Datar Segi Banyak",
            "teks": "Gambar berikut menunjukkan sketsa bangun datar beserta ukurannya:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_20_sketsa_bangun_datar.png"]
        },
        "teks_soal": "Keliling bangun tersebut adalah ....",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "46 cm"},
            {"label": "B", "teks": "50 cm"},
            {"label": "C", "teks": "56 cm"},
            {"label": "D", "teks": "60 cm"}
        ],
        "kunci": "D",
        "pembahasan": "Jumlahkan seluruh sisi luar bangun datar:\n$\\text{Keliling} = 12\\text{ cm} + 10\\text{ cm} + 4\\text{ cm} + 20\\text{ cm} + 4\\text{ cm} + 10\\text{ cm} = 60\\text{ cm}$."
    },
    {
        "nomor": 21,
        "tipe": "pg_sederhana",
        "materi": "Luas Gabungan Segitiga",
        "capaian": "Menentukan luas bangun datar segi banyak yang terbentuk dari gabungan beberapa segitiga",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Bangun Segi Banyak dari Segitiga",
            "teks": "Segi banyak berikut tersusun dari beberapa segitiga yang berukuran sama. Satu segitiga penyusun memiliki luas $16\\text{ cm}^2$:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_21_segi_banyak_bintang.png"]
        },
        "teks_soal": "Berapakah luas segi banyak tersebut?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "$176\\text{ cm}^2$."},
            {"label": "B", "teks": "$160\\text{ cm}^2$."},
            {"label": "C", "teks": "$144\\text{ cm}^2$."},
            {"label": "D", "teks": "$128\\text{ cm}^2$."}
        ],
        "kunci": "C",
        "pembahasan": "Bangun segi banyak tersebut terbentuk dari gabungan 9 segitiga identik. Karena luas 1 segitiga $= 16\\text{ cm}^2$, maka luas total $= 9 \\times 16\\text{ cm}^2 = 144\\text{ cm}^2$."
    },
    {
        "nomor": 22,
        "tipe": "pg_sederhana",
        "materi": "Luas Persegi Panjang",
        "capaian": "Menggunakan konsep keliling atau luas persegi/persegi panjang dalam menyelesaikan permasalahan",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Pameran Lukisan Binatang",
            "teks": "Jimmi melihat pameran 5 lukisan bertema binatang: Lukisan A ($60 \\times 60\\text{ cm}$), B ($90 \\times 80\\text{ cm}$), C ($40 \\times 80\\text{ cm}$), D ($40 \\times 40\\text{ cm}$), dan E ($60 \\times 80\\text{ cm}$).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_22_pameran_lukisan.png"]
        },
        "teks_soal": "Jimmi menyediakan tempat di kamarnya dengan luas $4.800\\text{ cm}^2$. Lukisan manakah yang bisa dipajang Jimmi?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "Lukisan A dan Lukisan B"},
            {"label": "B", "teks": "Lukisan C dan Lukisan D"},
            {"label": "C", "teks": "Lukisan E dan A"},
            {"label": "D", "teks": "Lukisan B dan Lukisan D"}
        ],
        "kunci": "B",
        "pembahasan": "Hitung luas masing-masing lukisan:\n- Luas A $= 3.600\\text{ cm}^2$\n- Luas B $= 7.200\\text{ cm}^2$\n- Luas C $= 40 \\times 80 = 3.200\\text{ cm}^2$\n- Luas D $= 40 \\times 40 = 1.600\\text{ cm}^2$\n- Luas E $= 4.800\\text{ cm}^2$\nKombinasi Lukisan C dan D $= 3.200 + 1.600 = 4.800\\text{ cm}^2$, tepat memenuhi luas tempat yang disediakan."
    },
    {
        "nomor": 23,
        "tipe": "pg_sederhana",
        "materi": "Titik Sudut Bangun Datar",
        "capaian": "Mengidentifikasi bentuk gambar benda berdasarkan ciri-ciri dari segiempat, segitiga, segibanyak, dan lingkaran",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Produksi Keset Kain Perca Desa Makmur",
            "teks": "Desa Makmur memproduksi tiga jenis keset dari kain perca: Jenis 1 (lingkaran diameter 40 cm), Jenis 2 (persegi panjang $60 \\times 40\\text{ cm}$), dan Jenis 3 (segi banyak).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_23_keset_kain_perca.png"]
        },
        "teks_soal": "Suatu hari terdapat pesanan keset jenis 2 yang diberi hiasan pada setiap sudutnya. Berapa banyak hiasan yang ada pada satu keset tersebut?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "2 hiasan"},
            {"label": "B", "teks": "4 hiasan"},
            {"label": "C", "teks": "5 hiasan"},
            {"label": "D", "teks": "6 hiasan"}
        ],
        "kunci": "B",
        "pembahasan": "Keset jenis 2 berbentuk persegi panjang yang memiliki 4 titik sudut. Karena setiap sudut diberi 1 hiasan, maka ada 4 hiasan pada satu keset."
    },
    {
        "nomor": 24,
        "tipe": "benar_salah",
        "materi": "Maksimalisasi Berat Satuan Baku",
        "capaian": "Mengevaluasi pernyataan berdasarkan konsep pengukuran panjang dan berat benda menggunakan satuan baku",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Pengemasan Keset Kain Perca",
            "teks": "Tiga jenis keset: Jenis 1 (berat 800 g), Jenis 2 (berat 1.200 g), dan Jenis 3 (berat 1.500 g).",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_24_keset_kain_perca.png"]
        },
        "teks_soal": "Keset dikemas dalam sebuah kardus berisi dua jenis keset berbeda. Banyak keset pada setiap kardus dimaksimalkan dengan berat total tidak boleh melebihi 10 kg. Berapa banyak keset yang sebaiknya dimasukkan ke dalam kardus? Pilih Benar atau Salah untuk setiap jumlah keset!",
        "gambar": [],
        "pernyataan": [
            {"teks": "12 buah keset.", "kunci": "Benar"},
            {"teks": "7 buah keset.", "kunci": "Salah"},
            {"teks": "6 buah keset.", "kunci": "Salah"}
        ],
        "kunci": ["Benar", "Salah", "Salah"],
        "pembahasan": "Batas berat $= 10\\text{ kg} = 10.000\\text{ g}$. Untuk memaksimalisasi jumlah dengan dua jenis berbeda, pilih Jenis 1 (800 g) dan Jenis 2 (1.200 g). Kombinasi maksimal: 11 keset Jenis 1 ($11 \\times 800 = 8.800\\text{ g}$) ditambah 1 keset Jenis 2 ($1.200\\text{ g}$). Total $= 10.000\\text{ g} = 10\\text{ kg}$. Jumlah keset terbanyak $= 11 + 1 = 12$ buah (Benar). 7 dan 6 bukan jumlah maksimal (Salah)."
    },
    {
        "nomor": 25,
        "tipe": "pg_kompleks",
        "materi": "Pengukuran Besar Sudut",
        "capaian": "Menentukan besar sudut yang terbentuk dari ilustrasi masalah kontekstual berdasarkan jenis sudutnya",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Bukaan Sudut Gunting",
            "teks": "Dua buah gunting terbuka membentuk sudut seperti tampak pada diagram berikut:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_25_sudut_gunting.png"]
        },
        "teks_soal": "Berapa sudut yang mungkin dibentuk oleh gunting B jika gunting A membentuk sudut $35^\\circ$? Pilih semua jawaban benar!",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "$29^\\circ$."},
            {"label": "B", "teks": "$51^\\circ$."},
            {"label": "C", "teks": "$63^\\circ$."}
        ],
        "kunci": ["B", "C"],
        "pembahasan": "Gunting B tampak terbuka lebih lebar daripada gunting A ($35^\\circ$), namun masih berupa sudut lancip ($< 90^\\circ$). Nilai sudut yang lebih besar dari $35^\\circ$ adalah $51^\\circ$ dan $63^\\circ$."
    },
    {
        "nomor": 26,
        "tipe": "pg_sederhana",
        "materi": "Diagram Batang Gabungan Dua Cabang",
        "capaian": "Mengidentifikasi kesalahan penyajian data dalam bentuk diagram batang",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Data Produksi Roti Cabang Jakarta dan Tangerang",
            "teks": "Pengusaha UMKM sedang merintis usaha roti dengan dua cabang di Jakarta dan Tangerang. Data produksi roti per bulan disajikan pada diagram berikut:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_26_produksi_roti_jakarta_tangerang.png"]
        },
        "teks_soal": "Sumbu $x$ menyatakan bulan produksi, sedangkan sumbu $y$ menyatakan jumlah roti yang diproduksi. Berdasarkan informasi yang diberikan, manakah gabungan produksi roti yang tepat dari dua cabang tersebut?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_26_opsi_a.png"},
            {"label": "B", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_26_opsi_b.png"},
            {"label": "C", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_26_opsi_c.png"},
            {"label": "D", "teks": "", "gambar": "/soal/tka-matematika-sd-2026/soal_26_opsi_d.png"}
        ],
        "kunci": "C",
        "pembahasan": "Jumlahkan produksi Jakarta dan Tangerang setiap bulan:\n- Januari: $500 + 500 = 1.000$\n- Februari: $1.000 + 500 = 1.500$\n- Maret: $750 + 1.500 = 2.250$\n- April: $1.200 + 2.000 = 3.200$\n- Mei: $1.500 + 2.500 = 4.000$\nGrafik pada Opsi C menyajikan total data penjumlahan tersebut secara tepat."
    },
    {
        "nomor": 27,
        "tipe": "pg_kompleks",
        "materi": "Interpretasi Diagram Batang Screen Time",
        "capaian": "Menginterpretasi informasi diagram atau tabel untuk menyelesaikan permasalahan",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Laporan Screen Time Siska",
            "teks": "*Screen Time* adalah waktu yang dihabiskan untuk menatap layar perangkat elektronik. Batas *screen time* Siska yang berusia 16 tahun yaitu 2 jam pada hari sekolah dan 2,5 jam pada hari libur.",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_27_screen_time_siska.png"]
        },
        "teks_soal": "Siska sudah melewati batas *screen time* yang diperbolehkan. Tentukanlah pengurangan waktu total *screen time* yang dapat dilakukan oleh Siska pada hari sekolah agar tidak melebihi batas 2 jam! Jawaban benar lebih dari satu!",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "6 jam"},
            {"label": "B", "teks": "5 jam"},
            {"label": "C", "teks": "4 jam"}
        ],
        "kunci": ["A", "B"],
        "pembahasan": "Total waktu layar Siska pada hari sekolah $= 1 + 0,5 + 1 + 2,5 + 2 = 7$ jam. Batas hari sekolah $= 2$ jam. Pengurangan minimal $= 7 - 2 = 5$ jam. Pengurangan 5 jam menghasilkan 2 jam (tepat di batas), dan pengurangan 6 jam menghasilkan 1 jam (di bawah batas). Keduanya valid."
    },
    {
        "nomor": 28,
        "tipe": "pg_sederhana",
        "materi": "Membaca Diagram Batang",
        "capaian": "Menginterpretasi data berdasarkan kategori tertentu",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Penjualan Makanan dan Minuman Kantin Pak Fajar",
            "teks": "Pak Fajar mencatat jumlah menu makanan dan minuman yang terjual di kantin sekolah pada hari Kamis sebagai berikut:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_28_kantin_pak_fajar.png"]
        },
        "teks_soal": "Berapa banyak murid yang membeli telur gulung?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "22"},
            {"label": "B", "teks": "23"},
            {"label": "C", "teks": "24"},
            {"label": "D", "teks": "25"}
        ],
        "kunci": "B",
        "pembahasan": "Pada diagram batang, ketinggian batang menu Telur Gulung berada tepat di garis tengah antara 22 dan 24, yaitu 23 murid."
    },
    {
        "nomor": 29,
        "tipe": "benar_salah",
        "materi": "Analisis Diagram Batang dan Perbandingan",
        "capaian": "Menyelesaikan permasalahan berkaitan dengan penyajian data dalam bentuk diagram batang",
        "kesulitan": "sedang",
        "bacaan": {
            "judul": "Negara dengan Gunung Berapi Aktif di Dunia",
            "teks": "Penelitian menunjukkan panas bumi gunung berapi dapat menghasilkan energi listrik. Berikut data gunung berapi aktif di dunia dari tahun 1960 sampai 2023:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_29_gunung_berapi_aktif.png"]
        },
        "teks_soal": "Dengan 9 gunung berapi yang ada di Tonga, negara tersebut menghasilkan paling sedikit 450 Mw listrik. Asumsikan setiap gunung berapi aktif menghasilkan energi listrik rata-rata yang sama. Tentukan Benar atau Salah untuk setiap pernyataan berikut!",
        "gambar": [],
        "pernyataan": [
            {"teks": "Gunung berapi di Rusia dapat menghasilkan paling sedikit 1.350 Mw listrik.", "kunci": "Benar"},
            {"teks": "Gunung berapi di Vanuatu dapat menghasilkan paling sedikit 450 Mw listrik.", "kunci": "Benar"},
            {"teks": "Gunung berapi di Papua Nugini dapat menghasilkan paling sedikit 550 Mw listrik.", "kunci": "Salah"}
        ],
        "kunci": ["Benar", "Benar", "Salah"],
        "pembahasan": "Daya rata-rata per gunung berapi $= 450 : 9 = 50$ Mw.\n- Rusia (27 gunung berapi) $= 27 \\times 50 = 1.350$ Mw (Benar).\n- Vanuatu (9 gunung berapi) $= 9 \\times 50 = 450$ Mw (Benar).\n- Papua Nugini (13 gunung berapi) $= 13 \\times 50 = 650$ Mw, bukan 550 Mw (Salah)."
    },
    {
        "nomor": 30,
        "tipe": "pg_sederhana",
        "materi": "Interpretasi Diagram dan Selisih Data",
        "capaian": "Menginterpretasi data diagram batang atau tabel untuk menyelesaikan permasalahan",
        "kesulitan": "mudah",
        "bacaan": {
            "judul": "Karya Wisata Siswa SD Pelita",
            "teks": "Siswa kelas 6 SD Pelita mengikuti kegiatan karya wisata ke Monumen Nasional (Monas) dengan menaiki bus:",
            "gambar": ["/soal/tka-matematika-sd-2026/soal_30_karya_wisata_siswa.png"]
        },
        "teks_soal": "Seluruh siswa kelas 6 menempati 1 bus berkapasitas 72 orang siswa tanpa ada kursi yang tersisa. Berapa banyak siswa kelas 6C yang mengikuti karya wisata?",
        "gambar": [],
        "opsi": [
            {"label": "A", "teks": "22 siswa."},
            {"label": "B", "teks": "23 siswa."},
            {"label": "C", "teks": "24 siswa."},
            {"label": "D", "teks": "25 siswa."}
        ],
        "kunci": "B",
        "pembahasan": "Total kapasitas bus $= 72$ siswa. Siswa kelas 6A $= 25$ orang, siswa kelas 6B $= 24$ orang. Siswa kelas 6C $= 72 - (25 + 24) = 72 - 49 = 23$ siswa."
    }
]

# Generate Clean Gemilang HTML Master
articles_html = []
for q in questions_data:
    nomor = q["nomor"]
    tipe = q["tipe"]
    materi = q["materi"]
    capaian = q["capaian"]
    kesulitan = q["kesulitan"]
    kunci = q["kunci"]
    pembahasan = q["pembahasan"]

    art = [f'<article data-gemilang-question data-nomor="{nomor}" data-paket="1" data-tipe="{tipe}" data-mapel="Matematika" data-kelas="6" data-kesulitan="{kesulitan}">']
    art.append(f'  <div data-field="materi">{materi}</div>')
    art.append(f'  <div data-field="capaian_pembelajaran">{capaian}</div>')

    # Stimulus / Bacaan jika ada (HANYA teks wacana, gambar ditaruh di <div data-field="gambar"> agar masuk q.gambar dan tidak dobel)
    bcn = q.get("bacaan")
    if bcn and bcn.get("teks"):
        judul_attr = f' data-judul="{bcn.get("judul", "")}"' if bcn.get("judul") else ''
        art.append(f'  <div data-field="bacaan" data-grup="wacana_{nomor}"{judul_attr}>')
        if bcn.get("judul"):
            art.append(f'    <h3>{bcn["judul"]}</h3>')
        for p in bcn["teks"].split("\n"):
            if p.strip():
                art.append(f'    <p>{p.strip()}</p>')
        art.append('  </div>')

    # Gambar butir soal (WAJIB di <div data-field="gambar"> agar masuk q.gambar, lolos Gerbang Gemilang, dan bebas warning Upload Gambar Massal)
    gambar_urls = list(q.get("gambar", []))
    if bcn and bcn.get("gambar"):
        for g in bcn["gambar"]:
            if g not in gambar_urls:
                gambar_urls.append(g)

    if gambar_urls:
        art.append('  <div data-field="gambar">')
        for g in gambar_urls:
            max_h = "160px" if "seperenam" in g else "280px"
            art.append(f'    <img src="{g}" data-url="{g}" alt="Ilustrasi Soal {nomor}" style="max-width:100%; max-height:{max_h}; display:block; margin:8px auto; border-radius:8px;" />')
        art.append('  </div>')

    # Teks Soal
    art.append('  <div data-field="teks_soal">')
    for p in q["teks_soal"].split("\n"):
        if p.strip():
            art.append(f'    <p>{p.strip()}</p>')
    art.append('  </div>')

    # Opsi Jawaban (PG / PG Kompleks)
    opsi_list = q.get("opsi", [])
    if opsi_list:
        art.append('  <ol data-field="opsi_jawaban">')
        for o in opsi_list:
            lbl = o.get("label", "")
            t = o.get("teks", "")
            g = o.get("gambar", "")
            isi = []
            if t and g:
                isi.append(f'{t}<br/><img src="{g}" data-url="{g}" alt="Opsi {lbl}" style="max-width:100%; max-height:160px; margin-top:6px; border-radius:6px; border:1px solid #e2e8f0;" />')
            elif g:
                isi.append(f'<img src="{g}" data-url="{g}" alt="Opsi {lbl}" style="max-width:100%; max-height:160px; border-radius:6px; border:1px solid #e2e8f0;" />')
            elif t:
                isi.append(t)
            art.append(f'    <li data-label="{lbl}">{" ".join(isi)}</li>')
        art.append('  </ol>')

    # Pernyataan (Benar / Salah)
    pernyataan_list = q.get("pernyataan", [])
    if pernyataan_list:
        art.append('  <ul data-field="pernyataan">')
        for p in pernyataan_list:
            k_val = p.get("kunci", "Benar")
            isi = []
            if p.get("teks"):
                isi.append(p["teks"])
            for g in p.get("gambar", []):
                isi.append(f'<img src="{g}" data-url="{g}" alt="Gambar Pernyataan" style="max-height:120px; display:inline-block; margin:4px 0; border-radius:6px; border:1px solid #e2e8f0;" />')
            art.append(f'    <li data-jawaban="{k_val}">{" ".join(isi)}</li>')
        art.append('  </ul>')

    # Kunci Jawaban
    if isinstance(kunci, list):
        kunci_str = ",".join(kunci)
    else:
        kunci_str = str(kunci)
    art.append(f'  <meta data-field="kunci_jawaban" data-value="{kunci_str}" />')
    art.append('  <meta data-field="kunci_terverifikasi" data-value="true" />')

    # Pembahasan
    art.append('  <div data-field="pembahasan">')
    for p in pembahasan.split("\n"):
        if p.strip():
            art.append(f'    <p>{p.strip()}</p>')
    art.append('  </div>')

    art.append('</article>\n')
    articles_html.append("\n".join(art))

doc_html = f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Soal TKA Matematika SD/MI Tahun 2026 - Master Import</title>
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
    [data-field="bacaan"] {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }}
    [data-field="bacaan"] h3 {{
      margin: 0 0 8px 0;
      font-size: 15px;
      color: #1e3a8a;
    }}
    [data-field="bacaan"] p {{
      margin: 0 0 10px 0;
      font-size: 14px;
      line-height: 1.65;
    }}
    [data-field="teks_soal"] {{
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 14px;
      color: #1e293b;
    }}
    [data-field="opsi_jawaban"] {{
      margin: 12px 0 16px 20px;
      padding: 0;
    }}
    [data-field="opsi_jawaban"] li {{
      margin-bottom: 10px;
      font-size: 14.5px;
      color: #334155;
    }}
    [data-field="pernyataan"] {{
      margin: 12px 0 16px 20px;
      padding: 0;
    }}
    [data-field="pernyataan"] li {{
      margin-bottom: 10px;
      font-size: 14.5px;
      color: #334155;
    }}
    [data-field="pembahasan"] {{
      background: #f1f5f9;
      border-left: 4px solid #3b82f6;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin-top: 14px;
      font-size: 13.5px;
      color: #1e293b;
    }}
    img {{
      max-width: 100%;
      height: auto;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Soal TKA Matematika SD/MI Tahun 2026</h1>
      <div class="subtitle">Bank Soal Resmi Bimbel Gemilang - Paket 1 (30 Butir Soal Lengkap)</div>
    </header>
    {"".join(articles_html)}
  </div>
</body>
</html>"""

with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(doc_html)

with open(OUT_FILE_IMPOR, "w", encoding="utf-8") as f:
    f.write(doc_html)

print(f"Successfully generated HTML Master ({len(questions_data)} questions) at:")
print(f"  - {OUT_FILE} ({len(doc_html)} bytes)")
print(f"  - {OUT_FILE_IMPOR} ({len(doc_html)} bytes)")
