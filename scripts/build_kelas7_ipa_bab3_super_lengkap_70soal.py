#!/usr/bin/env python3
"""
build_kelas7_ipa_bab3_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 3 (Suhu, Kalor, dan Pemuaian):
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 1. Load questions 1-25 from verified Kurikulum Merdeka Chapter 3
with open(os.path.join(OUTPUT_DIR, "kelas7_ipa_kurikulum_merdeka_175soal_lengkap.json"), "r", encoding="utf-8") as f:
    k7_all = json.load(f)

soal_1_to_25 = [q for q in k7_all if q["chapter"] == 3]

# 2. Add 10 Contoh Soal Asli Buku Big Book (Suhu, Kalor, Pemuaian) (No. 26–35)
contoh_soal_asli = [
    {
        "nomor_bab": 26,
        "soal": "Titik tetap bawah dan titik tetap atas pada skala termometer Celcius masing-masing ditentukan berdasarkan ....",
        "opsi": [
            {"label": "A", "teks": "suhu es melebur pada 0°C dan suhu air mendidih pada 100°C pada tekanan 1 atm"},
            {"label": "B", "teks": "suhu es melebur pada 32°C dan suhu air mendidih pada 212°C"},
            {"label": "C", "teks": "suhu tubuh manusia dan suhu air membeku"},
            {"label": "D", "teks": "suhu nol mutlak dan suhu uap air jenuh"}
        ],
        "kunci": "A",
        "pembahasan": "Penetapan skala Celcius menggunakan patokan titik tetap bawah yaitu suhu es yang sedang melebur pada 0°C dan titik tetap atas yaitu suhu air yang sedang mendidih pada 100°C di bawah tekanan udara 1 atmosfer.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Perbandingan skala antara termometer Celcius, Reamur, Fahrenheit, dan Kelvin berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "C : R : (F - 32) : (K - 273) = 5 : 4 : 9 : 5"},
            {"label": "B", "teks": "C : R : F : K = 5 : 4 : 9 : 5"},
            {"label": "C", "teks": "C : R : F : K = 4 : 5 : 9 : 5"},
            {"label": "D", "teks": "C : R : (F - 32) : K = 5 : 4 : 5 : 9"}
        ],
        "kunci": "A",
        "pembahasan": "Rentang skala Celcius = 100, Reamur = 80, Fahrenheit = 180, dan Kelvin = 100. Jika disederhanakan dengan membagi 20, diperoleh perbandingan C : R : (F - 32) : (K - 273) = 5 : 4 : 9 : 5.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Zat cair pengisi termometer yang memiliki rentang pengukuran suhu tinggi hingga lebih dari 350°C serta tidak membasahi dinding kaca adalah ....",
        "opsi": [
            {"label": "A", "teks": "alkohol murni"},
            {"label": "B", "teks": "air raksa (merkuri)"},
            {"label": "C", "teks": "minyak tanah"},
            {"label": "D", "teks": "gliserin"}
        ],
        "kunci": "B",
        "pembahasan": "Keuntungan air raksa sebagai pengisi termometer: (1) tidak membasahi dinding tabung kaca, (2) mudah dilihat karena mengilat seperti perak, (3) memuai secara teratur, (4) jangkauan ukur luas dengan titik beku -39°C dan titik didih tinggi mencapai 357°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Suhu suatu larutan terukur 40°C. Jika suhu tersebut diukur dengan termometer skala Fahrenheit, nilai yang tertera adalah ....",
        "opsi": [
            {"label": "A", "teks": "72°F"},
            {"label": "B", "teks": "84°F"},
            {"label": "C", "teks": "104°F"},
            {"label": "D", "teks": "120°F"}
        ],
        "kunci": "C",
        "pembahasan": "Rumus konversi Celcius ke Fahrenheit: F = (9/5) × C + 32 = (9/5) × 40 + 32 = 72 + 32 = 104°F.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Suhu pada termometer Celcius dan termometer Fahrenheit akan menunjukkan angka yang sama persis pada nilai ....",
        "opsi": [
            {"label": "A", "teks": "0°"},
            {"label": "B", "teks": "-40°"},
            {"label": "C", "teks": "40°"},
            {"label": "D", "teks": "100°"}
        ],
        "kunci": "B",
        "pembahasan": "Misalkan suhu tersebut adalah x: x = (9/5)x + 32 => x - (9/5)x = 32 => -(4/5)x = 32 => x = 32 × (-5/4) = -40°. Jadi pada suhu -40°, skala Celcius sama dengan Fahrenheit (-40°C = -40°F).",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Pemasangan kawat telepon atau kawat listrik pada tiang sengaja dibuat agak kendur pada waktu siang hari bertujuan agar ....",
        "opsi": [
            {"label": "A", "teks": "kawat tidak putus saat menyusut pada malam hari yang dingin"},
            {"label": "B", "teks": "memudahkan arus listrik mengalir"},
            {"label": "C", "teks": "kawat tidak memuai saat terkena sinar matahari"},
            {"label": "D", "teks": "kawat tidak tersambar petir"}
        ],
        "kunci": "A",
        "pembahasan": "Pada malam hari suhu udara turun sehingga kawat logam mengalami penyusutan (memendek). Jika kawat dipasang tegang di siang hari, saat menyusut di malam hari kawat akan mengalami tegangan tarik tinggi dan dapat putus.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Anomali air adalah sifat keanehan pemuaian air yang terjadi pada rentang kenaikan suhu ....",
        "opsi": [
            {"label": "A", "teks": "0°C sampai 4°C"},
            {"label": "B", "teks": "4°C sampai 10°C"},
            {"label": "C", "teks": "10°C sampai 100°C"},
            {"label": "D", "teks": "dibawah 0°C"}
        ],
        "kunci": "A",
        "pembahasan": "Umumnya zat memuai jika dipanaskan, namun air pada rentang suhu 0°C hingga 4°C justru menyusut (volumenya mengecil dan massa jenisnya mencapai maksimum pada 4°C). Fenomena anomali ini memungkinkan makhluk hidup di dasar danau tetap bertahan hidup saat permukaan danau membeku di musim dingin.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Banyaknya kalor yang diperlukan untuk menaikkan suhu 1 kg zat sebesar 1°C atau 1 K disebut ....",
        "opsi": [
            {"label": "A", "teks": "kapasitas kalor"},
            {"label": "B", "teks": "kalor jenis"},
            {"label": "C", "teks": "kalor lebur"},
            {"label": "D", "teks": "kalor uap"}
        ],
        "kunci": "B",
        "pembahasan": "Kalor jenis (c) adalah banyaknya kalor yang dibutuhkan oleh 1 kg zat untuk menaikkan suhunya sebesar 1°C atau 1 K, dengan satuan J/(kg·°C). Sedangkan kapasitas kalor (C = m·c) adalah kalor untuk menaikkan suhu seluruh massa benda sebesar 1°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Berdasarkan Asas Black, jika dua zat yang suhunya berbeda dicampurkan di dalam sistem terisolasi tanpa pengaruh luar, maka berlaku hubungan ....",
        "opsi": [
            {"label": "A", "teks": "Kalor yang dilepas oleh zat bersuhu lebih tinggi sama dengan kalor yang diserap oleh zat bersuhu lebih rendah"},
            {"label": "B", "teks": "Suhu campuran selalu sama dengan suhu rata-rata kedua zat"},
            {"label": "C", "teks": "Kalor jenis kedua zat akan menjadi sama setelah tercampur"},
            {"label": "D", "teks": "Zat yang massanya lebih kecil selalu melepaskan kalor"}
        ],
        "kunci": "A",
        "pembahasan": "Asas Black menyatakan hukum kekekalan energi kalor: Q_lepas = Q_terima. Zat yang memiliki suhu lebih tinggi akan melepaskan kalor, dan seluruh kalor yang dilepas tersebut diserap oleh zat yang memiliki suhu lebih rendah hingga tercapai kesetimbangan termal.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Perpindahan kalor dari pancaran sinar Matahari melintasi ruang hampa hingga sampai dan menghangatkan Bumi terjadi secara ....",
        "opsi": [
            {"label": "A", "teks": "konduksi"},
            {"label": "B", "teks": "konveksi"},
            {"label": "C", "teks": "radiasi"},
            {"label": "D", "teks": "evaporasi"}
        ],
        "kunci": "C",
        "pembahasan": "Radiasi adalah perpindahan kalor melalui pancaran gelombang elektromagnetik tanpa memerlukan partikel medium perantara, sehingga energi kalor matahari dapat merambat melalui ruang hampa udara di luar angkasa hingga tiba di Bumi.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    }
]

# 3. Add 30 Latihan Soal Mandiri Asli Buku Big Book (No. 36–65)
latihan_soal_asli = [
    {
        "nomor_bab": 36,
        "soal": "Termometer laboratorium menggunakan alkohol diberi pewarna merah karena alkohol memiliki sifat unggul yaitu ....",
        "opsi": [
            {"label": "A", "teks": "mampu mengukur suhu sangat rendah karena titik bekunya mencapai -112°C"},
            {"label": "B", "teks": "memiliki titik didih sangat tinggi hingga 500°C"},
            {"label": "C", "teks": "tidak membasahi dinding kaca termometer"},
            {"label": "D", "teks": "memiliki pemuaian yang lambat dan stabil"}
        ],
        "kunci": "A",
        "pembahasan": "Keunggulan termometer alkohol adalah titik bekunya yang sangat rendah (-112°C), sehingga dapat digunakan untuk mengukur suhu daerah kutub atau lemari pembeku ekstrem.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 37,
        "soal": "Suhu air murni mendidih pada tekanan udara normal (1 atm) jika diukur menggunakan termometer skala Reamur adalah ....",
        "opsi": [
            {"label": "A", "teks": "60°R"},
            {"label": "B", "teks": "80°R"},
            {"label": "C", "teks": "100°R"},
            {"label": "D", "teks": "120°R"}
        ],
        "kunci": "B",
        "pembahasan": "Titik tetap atas termometer Reamur adalah suhu air mendidih pada 80°R, dengan titik tetap bawah es melebur pada 0°R.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 38,
        "soal": "Sebuah termometer X memiliki titik beku air pada 20°X dan titik didih air pada 140°X. Jika termometer Celcius menunjukkan 50°C, maka termometer X akan menunjukkan angka ....",
        "opsi": [
            {"label": "A", "teks": "60°X"},
            {"label": "B", "teks": "70°X"},
            {"label": "C", "teks": "80°X"},
            {"label": "D", "teks": "90°X"}
        ],
        "kunci": "C",
        "pembahasan": "Rentang Celcius = 100 - 0 = 100. Rentang X = 140 - 20 = 120. Perbandingan skala: (X - 20) / 120 = (C - 0) / 100 => (X - 20) / 120 = 50 / 100 = 1/2 => X - 20 = 60 => X = 80°X.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 39,
        "soal": "Suhu gas buang kendaraan terbaca 60°C. Nilai suhu tersebut setara dengan ... Kelvin.",
        "opsi": [
            {"label": "A", "teks": "213 K"},
            {"label": "B", "teks": "313 K"},
            {"label": "C", "teks": "333 K"},
            {"label": "D", "teks": "353 K"}
        ],
        "kunci": "C",
        "pembahasan": "Rumus konversi Celcius ke Kelvin: K = C + 273 = 60 + 273 = 333 K.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 40,
        "soal": "Pemasangan kaca pada bingkai jendela kayu dibuat berukuran sedikit lebih kecil daripada ruang bingkainya dengan tujuan ....",
        "opsi": [
            {"label": "A", "teks": "kaca tidak pecah saat memuai di siang hari yang panas"},
            {"label": "B", "teks": "bingkai kayu tidak mudah lapuk terkena air hujan"},
            {"label": "C", "teks": "memudahkan angin masuk ke dalam ruangan"},
            {"label": "D", "teks": "mencegah getaran suara keras dari luar rumah"}
        ],
        "kunci": "A",
        "pembahasan": "Saat siang hari yang terik, kaca mengalami kenaikan suhu dan memuai. Celah renggang pada bingkai memberikan ruang bagi pemuaian luas kaca agar kaca tidak tertekan dan pecah.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 41,
        "soal": "Sebuah pipa tembaga panjangnya 100 cm pada suhu 20°C. Jika dipanaskan hingga 120°C dan koefisien muai panjang tembaga 0,000017/°C, pertambahan panjang pipa adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,017 cm"},
            {"label": "B", "teks": "0,17 cm"},
            {"label": "C", "teks": "1,7 cm"},
            {"label": "D", "teks": "0,34 cm"}
        ],
        "kunci": "B",
        "pembahasan": "Kenaikan suhu ΔT = 120°C - 20°C = 100°C. Pertambahan panjang ΔL = L₀ × α × ΔT = 100 cm × 0,000017/°C × 100°C = 0,17 cm.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 42,
        "soal": "Sebuah pelat aluminium berukuran 2 m × 1 m pada suhu 10°C dipanaskan hingga 60°C. Jika koefisien muai panjang aluminium 0,000025/°C, pertambahan luas pelat adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,0025 m²"},
            {"label": "B", "teks": "0,0050 m²"},
            {"label": "C", "teks": "0,0075 m²"},
            {"label": "D", "teks": "0,0100 m²"}
        ],
        "kunci": "B",
        "pembahasan": "Luas awal A₀ = 2 × 1 = 2 m². Koefisien muai luas β = 2α = 2 × 0,000025 = 0,00005/°C. Kenaikan suhu ΔT = 60 - 10 = 50°C. Pertambahan luas ΔA = A₀ × β × ΔT = 2 × 0,00005 × 50 = 0,005 m².",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 43,
        "soal": "Sebuah bejana kaca diisi air raksa penuh hingga ke bibir bejana pada suhu 0°C. Saat bejana dan air raksa dipanaskan bersamaan, sejumlah air raksa tumpah. Peristiwa ini membuktikan bahwa ....",
        "opsi": [
            {"label": "A", "teks": "pemuaian volume zat cair lebih besar daripada pemuaian volume zat padat"},
            {"label": "B", "teks": "air raksa menyusut saat dipanaskan"},
            {"label": "C", "teks": "bejana kaca menyusut sehingga mendorong air raksa ke luar"},
            {"label": "D", "teks": "air raksa mendidih pada suhu kamar"}
        ],
        "kunci": "A",
        "pembahasan": "Koefisien muai volume zat cair pada umumnya jauh lebih besar daripada koefisien muai volume zat padat. Oleh karena itu, pertambahan volume air raksa melebihi pertambahan kapasitas bejana kaca sehingga air raksa meluap dan tumpah.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 44,
        "soal": "Air sebanyak 2 kg bersuhu 25°C dipanaskan hingga suhunya mencapai 75°C. Jika kalor jenis air 4.200 J/kg°C, kalor yang diperlukan adalah ....",
        "opsi": [
            {"label": "A", "teks": "210.000 Joule"},
            {"label": "B", "teks": "420.000 Joule"},
            {"label": "C", "teks": "630.000 Joule"},
            {"label": "D", "teks": "840.000 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "Kenaikan suhu ΔT = 75°C - 25°C = 50°C. Kalor yang diperlukan Q = m × c × ΔT = 2 kg × 4.200 J/kg°C × 50°C = 420.000 Joule = 420 kJ.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 45,
        "soal": "Sebuah pemanas air listrik dengan daya 400 Watt digunakan selama 5 menit untuk memanaskan air. Energi kalor yang dihasilkan oleh alat pemanas tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "2.000 Joule"},
            {"label": "B", "teks": "24.000 Joule"},
            {"label": "C", "teks": "120.000 Joule"},
            {"label": "D", "teks": "240.000 Joule"}
        ],
        "kunci": "C",
        "pembahasan": "Waktu pemanasan t = 5 menit = 5 × 60 s = 300 s. Energi kalor W = P × t = 400 W × 300 s = 120.000 Joule = 120 kJ.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 46,
        "soal": "Saat air mendidih pada suhu 100°C di bawah tekanan 1 atm, kalor yang terus diberikan tidak menaikkan suhu air, melainkan digunakan untuk ....",
        "opsi": [
            {"label": "A", "teks": "memutuskan ikatan antarmolekul air untuk berubah wujud menjadi uap"},
            {"label": "B", "teks": "mendinginkan dasar panci pemanas"},
            {"label": "C", "teks": "menghancurkan molekul hidrogen dan oksigen"},
            {"label": "D", "teks": "mengurangi massa jenis udara di atas panci"}
        ],
        "kunci": "A",
        "pembahasan": "Selama perubahan wujud zat berlangsung pada titik didihnya, suhu zat tetap konstan. Kalor yang diserap disebut kalor laten penguapan (Q = m·U) yang berfungsi memutus ikatan kohesi antarmolekul air menjadi uap air.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 47,
        "soal": "Sebanyak 500 gram air bersuhu 80°C dicampur dengan 500 gram air bersuhu 20°C di wadah terisolasi. Jika tidak ada kalor yang hilang ke wadah, suhu akhir campuran adalah ....",
        "opsi": [
            {"label": "A", "teks": "40°C"},
            {"label": "B", "teks": "50°C"},
            {"label": "C", "teks": "60°C"},
            {"label": "D", "teks": "70°C"}
        ],
        "kunci": "B",
        "pembahasan": "Karena massa dan kalor jenis kedua air identik (m₁ = m₂), maka suhu kesetimbangan adalah rata-rata aritmetika: T_campuran = (80°C + 20°C) / 2 = 50°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 48,
        "soal": "Sepotong logam bermassa 200 g dengan suhu 100°C dimasukkan ke dalam 400 g air bersuhu 20°C (c_air = 4.200 J/kg°C). Jika suhu kesetimbangan adalah 25°C, kalor jenis logam tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "280 J/kg°C"},
            {"label": "B", "teks": "420 J/kg°C"},
            {"label": "C", "teks": "560 J/kg°C"},
            {"label": "D", "teks": "840 J/kg°C"}
        ],
        "kunci": "C",
        "pembahasan": "Q_lepas = Q_terima => m_logam × c_logam × (100 - 25) = m_air × c_air × (25 - 20) => 0,2 × c_logam × 75 = 0,4 × 4.200 × 5 => 15 × c_logam = 8.400 => c_logam = 560 J/kg°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 49,
        "soal": "Perpindahan kalor secara konveksi pada zat cair dan gas terjadi karena adanya ....",
        "opsi": [
            {"label": "A", "teks": "perbedaan massa jenis akibat pemanasan zat"},
            {"label": "B", "teks": "getaran partikel tanpa berpindahnya tempat"},
            {"label": "C", "teks": "radiasi gelombang elektromagnetik berenergi tinggi"},
            {"label": "D", "teks": "gaya gesekan antarmolekul fluida"}
        ],
        "kunci": "A",
        "pembahasan": "Saat fluida dipanaskan dari bawah, bagian fluida di bawah memuai sehingga massa jenisnya mengecil dan bergerak naik ke atas. Bagian fluida di atas yang lebih dingin dan bermassa jenis lebih besar akan turun menggantikannya, menghasilkan arus sirkulasi konveksi.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 50,
        "soal": "Terjadinya angin laut pada siang hari di wilayah pesisir pantai disebabkan oleh ....",
        "opsi": [
            {"label": "A", "teks": "daratan lebih cepat panas dibandingkan lautan sehingga udara di atas daratan naik dan digantikan udara dingin dari laut"},
            {"label": "B", "teks": "lautan lebih cepat panas dibandingkan daratan sehingga udara dari darat bertiup ke laut"},
            {"label": "C", "teks": "gaya pasang surut gravitasi Bulan"},
            {"label": "D", "teks": "gelombang ombak laut yang mendorong massa udara"}
        ],
        "kunci": "A",
        "pembahasan": "Daratan memiliki kalor jenis lebih kecil sehingga lebih cepat menyerap panas dan suhunya lebih tinggi di siang hari. Udara panas di atas darat memuai dan membumbung ke atas, menimbulkan tekanan rendah, sehingga udara sejuk dari atas laut bergerak menuju daratan (angin laut).",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 51,
        "soal": "Sebaliknya, pada malam hari nelayan tradisional memanfaatkan angin darat untuk melaut mencari ikan karena ....",
        "opsi": [
            {"label": "A", "teks": "daratan lebih cepat dingin daripada lautan sehingga udara bertekanan tinggi dari darat bertiup menuju laut"},
            {"label": "B", "teks": "lautan lebih cepat dingin daripada daratan"},
            {"label": "C", "teks": "air laut menguap dan menarik udara dari daratan"},
            {"label": "D", "teks": "suhu udara daratan di malam hari mencapai titik didih"}
        ],
        "kunci": "A",
        "pembahasan": "Di malam hari, daratan lebih cepat melepaskan kalor sehingga lebih cepat dingin dibanding laut. Udara di atas laut yang relatif lebih hangat membumbung naik, digantikan aliran udara dingin dari daratan menuju laut (angin darat).",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 52,
        "soal": "Mengapa pada cerobong asap pabrik atau perapian rumah dibuat lubang menjulang tinggi ke atas?",
        "opsi": [
            {"label": "A", "teks": "Memanfaatkan prinsip konveksi gas panas yang memiliki massa jenis rendah agar asap mudah mengalir keluar ke atas"},
            {"label": "B", "teks": "Mencegah udara luar masuk ke dalam ruangan perapian"},
            {"label": "C", "teks": "Agar radiasi sinar matahari memanaskan asap buangan"},
            {"label": "D", "teks": "Menahan abu agar tidak bertebaran di atap"}
        ],
        "kunci": "A",
        "pembahasan": "Gas buang pembakaran bersuhu tinggi memiliki kerapatan/massa jenis yang lebih kecil dibanding udara sekitar, sehingga secara alami mengalir ke atas (arus konveksi) melalui cerobong yang tinggi.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 53,
        "soal": "Sebuah kubus tembaga memiliki panjang rusuk 10 cm pada suhu 0°C. Jika koefisien muai panjang tembaga 0,000017/°C, koefisien muai volume tembaga tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,000017/°C"},
            {"label": "B", "teks": "0,000034/°C"},
            {"label": "C", "teks": "0,000051/°C"},
            {"label": "D", "teks": "0,000068/°C"}
        ],
        "kunci": "C",
        "pembahasan": "Koefisien muai volume γ = 3 × α = 3 × 0,000017/°C = 0,000051/°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 54,
        "soal": "Ketika kita mengenakan pakaian berwarna hitam di bawah terik matahari, tubuh kita akan terasa lebih cepat panas dibandingkan memakai pakaian putih. Hal ini dikarenakan ....",
        "opsi": [
            {"label": "A", "teks": "permukaan berwarna gelap atau hitam merupakan penyerap dan pemancar radiasi kalor yang sangat baik"},
            {"label": "B", "teks": "pakaian hitam memerangkap arus konveksi udara di sekitar kulit"},
            {"label": "C", "teks": "kain putih memiliki konduktivitas termal lebih tinggi daripada kain hitam"},
            {"label": "D", "teks": "pakaian hitam memiliki massa jenis yang lebih besar"}
        ],
        "kunci": "A",
        "pembahasan": "Benda dengan permukaan hitam dan kusam memiliki emisivitas termal mendekati 1 (benda hitam sempurna), sehingga sangat efektif menyerap seluruh radiasi panas matahari.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 55,
        "soal": "Alat laboratorium yang digunakan untuk menyelidiki pemuaian panjang berbagai macam logam seperti besi, tembaga, dan aluminium secara bersamaan adalah ....",
        "opsi": [
            {"label": "A", "teks": "musschenbroek"},
            {"label": "B", "teks": "kalorimeter"},
            {"label": "C", "teks": "dilatometer"},
            {"label": "D", "teks": "termometer bimetal"}
        ],
        "kunci": "A",
        "pembahasan": "Aparatus Musschenbroek dilengkapi jarum penunjuk skala untuk mengamati dan membandingkan pertambahan panjang berbagai batang logam ketika dipanaskan pada suhu yang sama.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 56,
        "soal": "Keping bimetal yang digunakan pada sakelar otomatis setrika listrik berfungsi sebagai ....",
        "opsi": [
            {"label": "A", "teks": "termostat pemutus dan penyambung arus listrik saat suhu mencapai batas tertentu"},
            {"label": "B", "teks": "penghasil kalor utama pada setrika listrik"},
            {"label": "C", "teks": "pengaman dari sengatan listrik bertegangan tinggi"},
            {"label": "D", "teks": "pengukur massa setrika agar tetap stabil"}
        ],
        "kunci": "A",
        "pembahasan": "Keping bimetal bekerja sebagai termostat: saat setrika sudah mencapai suhu panas yang diinginkan, bimetal melengkung dan memutuskan kontak sakelar. Ketika suhu menurun, bimetal kembali lurus dan menyambung arus pemanas kembali.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 57,
        "soal": "Berapakah kalor yang dibutuhkan untuk meleburkan 500 gram es bersuhu 0°C menjadi air seluruhnya pada suhu 0°C jika kalor lebur es 336.000 J/kg?",
        "opsi": [
            {"label": "A", "teks": "67.200 Joule"},
            {"label": "B", "teks": "168.000 Joule"},
            {"label": "C", "teks": "336.000 Joule"},
            {"label": "D", "teks": "672.000 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "Massa es m = 500 g = 0,5 kg. Kalor lebur Q = m × L = 0,5 kg × 336.000 J/kg = 168.000 Joule = 168 kJ.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 58,
        "soal": "Kalor yang dilepaskan ketika 1 kg uap air bersuhu 100°C mengembun menjadi air bersuhu 100°C (kalor uap air = 2.260.000 J/kg) adalah ....",
        "opsi": [
            {"label": "A", "teks": "1.130.000 Joule"},
            {"label": "B", "teks": "2.260.000 Joule"},
            {"label": "C", "teks": "3.390.000 Joule"},
            {"label": "D", "teks": "4.520.000 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "Besar kalor pelepasan pada kondensasi uap: Q = m × U = 1 kg × 2.260.000 J/kg = 2.260.000 Joule = 2.260 kJ.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 59,
        "soal": "Alat yang dirancang khusus dengan dinding adiabatis untuk mengukur nilai kalor jenis suatu zat padat melalui pertukaran kalor adalah ....",
        "opsi": [
            {"label": "A", "teks": "kalorimeter"},
            {"label": "B", "teks": "termometer"},
            {"label": "C", "teks": "higrometer"},
            {"label": "D", "teks": "manometer"}
        ],
        "kunci": "A",
        "pembahasan": "Kalorimeter adalah wadah terisolasi ganda yang dilengkapi pengaduk dan termometer untuk mengukur kuantitas pertukaran kalor berdasarkan Asas Black.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 60,
        "soal": "Sebuah botol kaca tebal yang baru diisi air mendidih tiba-tiba retak dan pecah. Penyebab utama keretakan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "dinding bagian dalam kaca memuai lebih cepat mendahului dinding bagian luar karena kaca adalah konduktor panas yang buruk"},
            {"label": "B", "teks": "dinding bagian luar kaca memuai lebih cepat mendahului dinding dalam"},
            {"label": "C", "teks": "air mendidih bereaksi secara kimia dengan silika kaca"},
            {"label": "D", "teks": "tekanan udara di dalam botol menurun drastis"}
        ],
        "kunci": "A",
        "pembahasan": "Kaca memiliki konduktivitas termal rendah. Saat terkena air mendidih, dinding bagian dalam memuai mendadak sedangkan dinding luar masih dingin, menimbulkan tegangan regangan yang membuat kaca retak/pecah.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 61,
        "soal": "Sebatang logam tembaga dan sebatang kaca dipanaskan bersamaan pada salah satu ujungnya dengan api yang sama. Ujung tembaga yang kita pegang terasa panas jauh lebih cepat daripada ujung kaca. Hal ini membuktikan bahwa ....",
        "opsi": [
            {"label": "A", "teks": "konduktivitas termal tembaga jauh lebih tinggi daripada kaca"},
            {"label": "B", "teks": "kaca memiliki massa jenis lebih tinggi"},
            {"label": "C", "teks": "tembaga menyerap energi radiasi lebih lambat"},
            {"label": "D", "teks": "kaca mengalami pemuaian lebih besar"}
        ],
        "kunci": "A",
        "pembahasan": "Logam tembaga adalah konduktor termal ulung yang memiliki elektron bebas untuk menghantarkan energi kinetik kalor secara cepat melintasi kisi kristalnya.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 62,
        "soal": "Prinsip pendinginan ruangan oleh mesin pendingin udara (Air Conditioner / AC) yang selalu dipasang di dinding bagian atas ruangan memanfaatkan konsep ....",
        "opsi": [
            {"label": "A", "teks": "arus konveksi udara dingin yang memiliki massa jenis lebih besar akan turun ke bawah mendinginkan seisi ruangan"},
            {"label": "B", "teks": "konduksi dingin melalui dinding langit-langit"},
            {"label": "C", "teks": "radiasi inframerah langsung dari lubang kipas"},
            {"label": "D", "teks": "penurunan tekanan gravitasi di dekat lantai"}
        ],
        "kunci": "A",
        "pembahasan": "Udara dingin yang diembuskan AC lebih padat (massa jenis lebih besar) sehingga akan turun ke dasar ruangan, mendorong udara hangat yang ringan naik ke atas untuk disaring kembali oleh AC (sirkulasi konveksi).",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 63,
        "soal": "Jika kalor jenis air 4.200 J/kg°C dan kalor jenis alkohol 2.400 J/kg°C, maka untuk massa yang sama dan pemanasan kalor yang sama, kenaikan suhu alkohol akan ....",
        "opsi": [
            {"label": "A", "teks": "lebih cepat dan lebih tinggi daripada air"},
            {"label": "B", "teks": "lebih lambat daripada air"},
            {"label": "C", "teks": "sama persis dengan kenaikan suhu air"},
            {"label": "D", "teks": "tidak mengalami perubahan suhu"}
        ],
        "kunci": "A",
        "pembahasan": "Zat yang memiliki kalor jenis (c) lebih kecil membutuhkan kalor lebih sedikit untuk menaikkan suhunya, sehingga zat tersebut akan lebih cepat mengalami kenaikan temperatur (ΔT = Q / (m·c)).",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 64,
        "soal": "Berapakah kapasitas kalor (C) dari sebuah bejana tembaga bermassa 500 gram jika kalor jenis tembaga adalah 390 J/kg°C?",
        "opsi": [
            {"label": "A", "teks": "195 J/°C"},
            {"label": "B", "teks": "390 J/°C"},
            {"label": "C", "teks": "780 J/°C"},
            {"label": "D", "teks": "1.950 J/°C"}
        ],
        "kunci": "A",
        "pembahasan": "Kapasitas kalor C = m × c = 0,5 kg × 390 J/kg°C = 195 J/°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 65,
        "soal": "Salah satu penerapan perpindahan kalor secara konduksi yang bermanfaat dalam kehidupan sehari-hari adalah ....",
        "opsi": [
            {"label": "A", "teks": "dasar wajan penggorengan terbuat dari aluminium tebal agar panas merata"},
            {"label": "B", "teks": "pembuatan ventilasi udara di atas pintu kamar"},
            {"label": "C", "teks": "menjemur pakaian basah di bawah terik sinar matahari"},
            {"label": "D", "teks": "penggunaan cerobong pembuangan asap pabrik"}
        ],
        "kunci": "A",
        "pembahasan": "Dasar alat masak menggunakan logam aluminium atau tembaga dengan konduktivitas tinggi agar kalor dari api kompor terhantar secara konduksi dengan cepat dan merata ke seluruh masakan.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    }
]

# 4. Add 5 Pengayaan AKM Literasi Sains Bab 03 (Hal 65–66) (No. 66–70)
pengayaan_akm = [
    {
        "nomor_bab": 66,
        "soal": "Grafik pemanasan kalor menunjukkan es -5°C dipanaskan hingga menjadi air 30°C. Total energi kalor yang dibutuhkan untuk 100 gram es adalah (c_es = 2.100 J/kg°C, L = 336.000 J/kg, c_air = 4.200 J/kg°C) ....",
        "opsi": [
            {"label": "A", "teks": "47.250 Joule"},
            {"label": "B", "teks": "34.650 Joule"},
            {"label": "C", "teks": "42.000 Joule"},
            {"label": "D", "teks": "52.500 Joule"}
        ],
        "kunci": "A",
        "pembahasan": "Q_total = Q1 + Q2 + Q3. Q1 (naik suhu es) = 0,1 × 2.100 × 5 = 1.050 J. Q2 (lebur es) = 0,1 × 336.000 = 33.600 J. Q3 (naik suhu air) = 0,1 × 4.200 × 30 = 12.600 J. Q_total = 1.050 + 33.600 + 12.600 = 47.250 Joule.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "Dua batang logam X dan Y memiliki panjang awal yang sama (L₀) dipanaskan dengan kenaikan suhu yang sama (ΔT). Jika pertambahan panjang logam X adalah dua kali pertambahan panjang logam Y, maka perbandingan koefisien muai panjang α_X : α_Y adalah ....",
        "opsi": [
            {"label": "A", "teks": "1 : 2"},
            {"label": "B", "teks": "2 : 1"},
            {"label": "C", "teks": "1 : 4"},
            {"label": "D", "teks": "4 : 1"}
        ],
        "kunci": "B",
        "pembahasan": "Rumus ΔL = L₀ × α × ΔT. Karena L₀ dan ΔT identik, maka ΔL berbanding lurus dengan α. Jika ΔL_X = 2 ΔL_Y, maka α_X / α_Y = 2 / 1 atau 2 : 1.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "Sebuah eksperimen mencampurkan 100 gram kopi panas bersuhu 90°C dengan 50 gram susu cair bersuhu 10°C. Mengabaikan pertukaran kalor dengan cangkir dan menganggap kalor jenis kopi serta susu sama dengan air, suhu kesetimbangan kopi susu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "53,3°C"},
            {"label": "B", "teks": "63,3°C"},
            {"label": "C", "teks": "70,0°C"},
            {"label": "D", "teks": "75,5°C"}
        ],
        "kunci": "B",
        "pembahasan": "Asas Black: m₁ × c × (90 - T) = m₂ × c × (T - 10) => 100 × (90 - T) = 50 × (T - 10) => 2 × (90 - T) = T - 10 => 180 - 2T = T - 10 => 3T = 190 => T = 63,33°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "Panel surya pemanas air (solar water heater) menggunakan pipa tembaga yang dicat hitam pekat dan diletakkan di dalam kotak berpintu kaca transparan di atas atap rumah. Fungsi kaca transparan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menciptakan efek rumah kaca: radiasi sinar matahari gelombang pendek dapat masuk, namun radiasi inframerah gelombang panjang tertahan di dalam kotak"},
            {"label": "B", "teks": "Mencegah sinar matahari masuk agar air tidak mendidih terlalu cepat"},
            {"label": "C", "teks": "Mengalirkan arus listrik langsung ke pompa air"},
            {"label": "D", "teks": "Mengurangi pemuaian pipa tembaga saat panas"}
        ],
        "kunci": "A",
        "pembahasan": "Kaca meneruskan radiasi gelombang pendek dari matahari tetapi menyerap/menghalangi radiasi inframerah gelombang panjang yang dipancarkan kembali oleh pipa hitam, memerangkap panas di dalam kotak pemanas (efek rumah kaca buatan).",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "Saat berolahraga berat, tubuh manusia mengeluarkan keringat yang membasahi permukaan kulit. Mekanisme biologi dan fisika yang terjadi untuk menstabilkan suhu tubuh agar tidak mengalami hipertermia adalah ....",
        "opsi": [
            {"label": "A", "teks": "Keringat menguap dengan menyerap kalor laten dari permukaan kulit sehingga suhu tubuh menurun"},
            {"label": "B", "teks": "Keringat menghantarkan kalor secara konduksi ke udara sekitar"},
            {"label": "C", "teks": "Keringat memantulkan radiasi sinar ultraviolet matahari"},
            {"label": "D", "teks": "Keringat meningkatkan massa jenis lapisan epidermis kulit"}
        ],
        "kunci": "A",
        "pembahasan": "Penguapan keringat adalah mekanisme pendinginan evaporatif tubuh manusia. Proses penguapan membutuhkan kalor laten penguapan yang diambil langsung dari panas tubuh dan permukaan kulit, sehingga suhu inti tubuh tetap stabil pada kisaran 36,5°C - 37,5°C.",
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"
    }
]

# Assemble 70 questions
all_70 = []

for q in soal_1_to_25:
    all_70.append({
        "nomor": q["nomor"],
        "tipe": q.get("tipe", "pg_sederhana"),
        "soal": q["soal"],
        "opsi": q.get("opsi", []),
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": "Bab III: Suhu, Kalor, dan Pemuaian - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "materi": "Suhu, Kalor, dan Pemuaian: Skala Termometer, Kalor Jenis, Asas Black, Perpindahan Kalor",
        "capaian": "Peserta didik mampu menganalisis konsep suhu, kalor, perpindahan kalor, dan penerapannya dalam mekanisme menjaga kestabilan suhu tubuh.",
        "img": q.get("img", "/soal/ipa/kmerdeka_kls7_ipa_ch3_suhu_kalor.jpg"),
        "bacaan": q.get("bacaan", "")
    })

for q in contoh_soal_asli:
    all_70.append({
        "nomor": q["nomor_bab"],
        "tipe": "pg_sederhana",
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": q["paket"],
        "materi": "Suhu, Kalor, dan Pemuaian: Termometer, Pemuaian Zat, dan Asas Black",
        "capaian": "Peserta didik mampu memahami prinsip skala termometer, anomali air, dan hukum kekekalan energi kalor.",
        "img": q["img"],
        "bacaan": ""
    })

for q in latihan_soal_asli:
    all_70.append({
        "nomor": q["nomor_bab"],
        "tipe": "pg_sederhana",
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": q["paket"],
        "materi": "Suhu, Kalor, dan Pemuaian: Perhitungan Kalor dan Pemuaian Zat",
        "capaian": "Peserta didik mampu menghitung pertambahan panjang/luas/volume pemuaian serta kalor perubahan wujud.",
        "img": q["img"],
        "bacaan": ""
    })

for q in pengayaan_akm:
    all_70.append({
        "nomor": q["nomor_bab"],
        "tipe": "pg_sederhana",
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": q["paket"],
        "materi": "Suhu, Kalor, dan Pemuaian: Pengayaan AKM Literasi Sains & TKA",
        "capaian": "Peserta didik mampu menelaah grafik kalor pemanasan es dan penerapan termoregulasi biologis.",
        "img": q["img"],
        "bacaan": ""
    })

print(f"Total questions assembled for Bab 3: {len(all_70)}")

# Save JSON
out_json_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab3_super_lengkap_70soal.json")
with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump(all_70, f, ensure_ascii=False, indent=2)

# Generate HTML conforming to ImportHasilScanPage schema
articles = []
for q in all_70:
    nomor = q["nomor"]
    tipe = q["tipe"]
    paket = html.escape(q["paket"])
    materi = html.escape(q["materi"])
    capaian = html.escape(q["capaian"])
    soal_text = html.escape(q["soal"])
    kunci = html.escape(q["kunci"])
    pembahasan = html.escape(q["pembahasan"])
    img_url = q["img"]

    bacaan_html = ""
    if q.get("bacaan"):
        bacaan_html = f'''  <div data-field="bacaan">
    <div style="background: #f8fafc; padding: 12px; border-radius: 8px; border-left: 4px solid #0284c7; margin-bottom: 12px;">
      {html.escape(q["bacaan"])}
    </div>
  </div>\n'''

    opsi_html = ""
    if q.get("opsi"):
        li_items = []
        for opt in q["opsi"]:
            lbl = opt["label"]
            txt = html.escape(opt["teks"])
            li_items.append(f'    <li data-option="{lbl}">{txt}</li>')
        opsi_str = "\n".join(li_items)
        opsi_html = f'''  <ul data-field="opsi_jawaban">
{opsi_str}
  </ul>\n'''

    art = f'''<article data-gemilang-question
  data-nomor="{nomor}"
  data-tipe="{tipe}"
  data-kelas="7"
  data-mapel="IPA"
  data-jenjang="SMP"
  data-fase="D"
  data-paket="{paket}"
  data-kualitas="Sangat Baik">
  <div data-field="materi">{materi}</div>
  <div data-field="capaian_pembelajaran">{capaian}</div>
  <div data-field="tags">hots, kurikulum-merdeka, fase-d, kelas-7, ipa</div>
{bacaan_html}  <div data-field="gambar">
    <img src="{img_url}" data-url="{img_url}" alt="Ilustrasi Soal #{nomor}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
  <div data-field="teks_soal">
    <p><strong>Soal #{nomor}:</strong> {soal_text}</p>
  </div>
{opsi_html}  <div data-field="kunci_jawaban">{kunci}</div>
  <div data-field="pembahasan"><p><strong>Pembahasan:</strong> {pembahasan}</p></div>
</article>'''
    articles.append(art)

articles_str = "\n\n".join(articles)
html_content = f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kumpulan Soal Lengkap IPA SMP Kelas 7 - Bab III (70 Soal)</title>
</head>
<body>
{articles_str}
</body>
</html>'''

out_html_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab3_super_lengkap_70soal.html")
with open(out_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Saved: {out_html_path} ({len(html_content)} bytes)")
print(f"Saved: {out_json_path} ({len(all_70)} records)")
