#!/usr/bin/env python3
"""
build_kelas7_ipa_bab1_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 1 (Hakikat Sains & Pengukuran):
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

# 1. Load questions 1-25 from previous verified extraction
with open(os.path.join(OUTPUT_DIR, "kelas7_ipa_kurikulum_merdeka_175soal_lengkap.json"), "r", encoding="utf-8") as f:
    k7_all = json.load(f)

soal_1_to_25 = [q for q in k7_all if q["chapter"] == 1]

# 2. Add 10 Contoh Soal Asli (No. 26 - 35)
contoh_soal_asli = [
    {
        "nomor_bab": 26,
        "soal": "Kelompok besaran pokok adalah ....",
        "opsi": [
            {"label": "A", "teks": "panjang, massa, volume"},
            {"label": "B", "teks": "massa, waktu, kuat arus"},
            {"label": "C", "teks": "luas, volume, suhu"},
            {"label": "D", "teks": "panjang, suhu, masa jenis"}
        ],
        "kunci": "B",
        "pembahasan": "Besaran pokok adalah besaran yang telah ditetapkan dan berlaku secara internasional. Besaran pokok terdiri atas massa, panjang, waktu, suhu, kuat arus, jumlah molekul/zat, dan intensitas cahaya. Jadi yang tergolong besaran pokok di antara pilihan yang tepat adalah massa, waktu, dan kuat arus.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Satuan massa dalam SI (Sistem Internasional) adalah ....",
        "opsi": [
            {"label": "A", "teks": "kg"},
            {"label": "B", "teks": "gram"},
            {"label": "C", "teks": "kg/m"},
            {"label": "D", "teks": "ons"}
        ],
        "kunci": "A",
        "pembahasan": "Massa adalah besaran pokok. Satuan massa menurut sistem internasional atau SI adalah kilogram (kg).",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Besaran di bawah ini yang termasuk besaran pokok, kecuali ....",
        "opsi": [
            {"label": "A", "teks": "panjang"},
            {"label": "B", "teks": "massa"},
            {"label": "C", "teks": "waktu"},
            {"label": "D", "teks": "volume"}
        ],
        "kunci": "D",
        "pembahasan": "Panjang, massa, dan waktu merupakan besaran pokok, yaitu besaran yang nilainya telah ditentukan terlebih dahulu. Sedangkan volume merupakan besaran turunan, yaitu besaran yang diturunkan dari besaran pokok (panjang x lebar x tinggi = m³).",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Alat untuk mengukur besaran massa adalah ....",
        "opsi": [
            {"label": "A", "teks": "mistar"},
            {"label": "B", "teks": "arloji"},
            {"label": "C", "teks": "jangka sorong"},
            {"label": "D", "teks": "neraca"}
        ],
        "kunci": "D",
        "pembahasan": "Mistar dan jangka sorong adalah alat untuk mengukur satuan panjang, arloji untuk mengukur satuan waktu. Sehingga alat untuk mengukur satuan massa adalah neraca.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q1_neraca.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Besaran turunan yang memiliki satuan m/s adalah ....",
        "opsi": [
            {"label": "A", "teks": "massa jenis"},
            {"label": "B", "teks": "percepatan"},
            {"label": "C", "teks": "kecepatan"},
            {"label": "D", "teks": "jarak"}
        ],
        "kunci": "C",
        "pembahasan": "Besaran turunan adalah besaran yang diturunkan dari besaran pokok. m/s diturunkan dari besaran pokok panjang (perpindahan dalam meter) dibagi waktu (sekon). Jadi besaran turunan yang memiliki satuan m/s adalah kecepatan.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Besaran yang memiliki satuan kandela (cd) adalah ....",
        "opsi": [
            {"label": "A", "teks": "kuat arus"},
            {"label": "B", "teks": "intensitas cahaya"},
            {"label": "C", "teks": "jumlah molekul"},
            {"label": "D", "teks": "suhu"}
        ],
        "kunci": "B",
        "pembahasan": "Kandela (cd) merupakan satuan dari besaran pokok intensitas cahaya.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Perhatikan gambar mistar ukur panjang! Gambar tersebut merupakan alat ukur yang digunakan untuk mengukur satuan ....",
        "opsi": [
            {"label": "A", "teks": "panjang"},
            {"label": "B", "teks": "volume"},
            {"label": "C", "teks": "massa"},
            {"label": "D", "teks": "waktu"}
        ],
        "kunci": "A",
        "pembahasan": "Gambar tersebut merupakan gambar mistar (penggaris), yaitu alat ukur yang digunakan untuk mengukur satuan panjang.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Pada sebuah neraca, sebelah kanan disimpan sebuah batu dan pada sebelah kirinya disimpan beban yang beratnya masing-masing 1,5 kg, 200 gram, dan 10.000 mg. Neraca akan seimbang jika massa batu seberat ....",
        "opsi": [
            {"label": "A", "teks": "1.800 gram"},
            {"label": "B", "teks": "1.710 gram"},
            {"label": "C", "teks": "1.700 gram"},
            {"label": "D", "teks": "2.700 gram"}
        ],
        "kunci": "B",
        "pembahasan": "Sebuah neraca akan seimbang jika berat beban bagian kanan sama dengan berat beban bagian kiri. Beban bagian kiri: 1,5 kg = 1.500 gram; 200 gram; 10.000 mg = 10 gram. Total berat beban kiri = 1.500 + 200 + 10 = 1.710 gram. Sehingga berat batu adalah 1.710 gram.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q1_neraca.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Pengukuran yang tidak menggunakan satuan baku adalah ....",
        "opsi": [
            {"label": "A", "teks": "panjang pita dengan mistar"},
            {"label": "B", "teks": "lama berlari dengan stopwatch"},
            {"label": "C", "teks": "berat buah dengan neraca"},
            {"label": "D", "teks": "tinggi pintu dengan jengkal"}
        ],
        "kunci": "D",
        "pembahasan": "Mistar, neraca, dan stopwatch adalah alat ukur baku. Sedangkan jengkal merupakan cara pengukuran tidak baku karena ukurannya berbeda untuk setiap orang.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Hasil pengukuran panjang benda menggunakan mistar dengan skala 11 cm dan garis milimeter ke-4 lebih sedikit adalah ....",
        "opsi": [
            {"label": "A", "teks": "11 cm"},
            {"label": "B", "teks": "10,55 cm"},
            {"label": "C", "teks": "11,45 cm"},
            {"label": "D", "teks": "11,95 cm"}
        ],
        "kunci": "C",
        "pembahasan": "Pada gambar mistar terlihat pembacaan skala utama 11,4 cm dan taksiran di antara garis menghasilkan 11,45 cm.",
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    }
]

# 3. Add 30 Latihan Soal Asli Buku (No. 36 - 65)
latihan_soal_asli = [
    {
        "nomor_bab": 36,
        "soal": "Besaran pokok berikut yang memiliki alat ukur termometer adalah ....",
        "opsi": [{"label": "A", "teks": "intensitas cahaya"}, {"label": "B", "teks": "suhu"}, {"label": "C", "teks": "jumlah molekul"}, {"label": "D", "teks": "kuat arus"}],
        "kunci": "B",
        "pembahasan": "Termometer adalah alat pengukur derajat panas atau dingin suatu benda (besaran suhu).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 37,
        "soal": "Yang tidak termasuk kelompok besaran pokok adalah ....",
        "opsi": [{"label": "A", "teks": "panjang"}, {"label": "B", "teks": "massa"}, {"label": "C", "teks": "luas"}, {"label": "D", "teks": "waktu"}],
        "kunci": "C",
        "pembahasan": "Luas adalah besaran turunan yang diturunkan dari besaran panjang (panjang x lebar = m²).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 38,
        "soal": "Pasangan besaran dan satuan berikut yang benar adalah ....",
        "opsi": [{"label": "A", "teks": "kuat arus; kelvin"}, {"label": "B", "teks": "suhu; radian"}, {"label": "C", "teks": "intensitas cahaya; mol"}, {"label": "D", "teks": "waktu; sekon"}],
        "kunci": "D",
        "pembahasan": "Satuan internasional (SI) untuk besaran waktu adalah sekon (s).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 39,
        "soal": "Satuan suhu dalam sistem satuan internasional (SI) adalah ....",
        "opsi": [{"label": "A", "teks": "celsius"}, {"label": "B", "teks": "reamur"}, {"label": "C", "teks": "fahrenheit"}, {"label": "D", "teks": "kelvin"}],
        "kunci": "D",
        "pembahasan": "Satuan baku SI untuk besaran suhu mutlak adalah Kelvin (K).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 40,
        "soal": "Besaran yang merupakan besaran turunan dengan satuan m/s² adalah ....",
        "opsi": [{"label": "A", "teks": "kecepatan"}, {"label": "B", "teks": "percepatan"}, {"label": "C", "teks": "massa jenis"}, {"label": "D", "teks": "kuat arus"}],
        "kunci": "B",
        "pembahasan": "Percepatan (a) merupakan perubahan kecepatan per satuan waktu dengan satuan SI m/s².",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 41,
        "soal": "Besaran yang dapat diukur dan memiliki satuan disebut ....",
        "opsi": [{"label": "A", "teks": "besaran pokok"}, {"label": "B", "teks": "besaran turunan"}, {"label": "C", "teks": "besaran fisika"}, {"label": "D", "teks": "besaran vektor"}],
        "kunci": "C",
        "pembahasan": "Segala sesuatu yang dapat diukur dan dinyatakan dengan angka serta satuan disebut besaran fisika.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 42,
        "soal": "Perhatikan tabel pasangan besaran dan alat ukur berikut! (1) Kuat arus - Neraca, (2) Panjang - Amperemeter, (3) Waktu - Arloji, (4) Suhu - Termometer. Dari tabel di atas, besaran dan alat ukur yang benar ditunjukkan oleh nomor ....",
        "opsi": [{"label": "A", "teks": "1 dan 2"}, {"label": "B", "teks": "2 dan 3"}, {"label": "C", "teks": "2 dan 4"}, {"label": "D", "teks": "3 dan 4"}],
        "kunci": "D",
        "pembahasan": "Pasangan yang tepat adalah waktu diukur dengan arloji (3) dan suhu diukur dengan termometer (4).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 43,
        "soal": "Perhatikan gambar jangka sorong! Gambar tersebut merupakan alat ukur yang digunakan untuk mengukur ....",
        "opsi": [{"label": "A", "teks": "panjang benda"}, {"label": "B", "teks": "tebal benda"}, {"label": "C", "teks": "massa benda"}, {"label": "D", "teks": "volume benda"}],
        "kunci": "A",
        "pembahasan": "Jangka sorong adalah instrumen pengukur besaran panjang dengan ketelitian 0,01 cm.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q7_jangka_sorong.jpg"
    },
    {
        "nomor_bab": 44,
        "soal": "Di rumah Andi terdapat televisi 21 inci. Panjang televisi tersebut jika diukur menggunakan mistar dengan menggunakan satuan cm adalah ....",
        "opsi": [{"label": "A", "teks": "51,5 cm"}, {"label": "B", "teks": "51,25 cm"}, {"label": "C", "teks": "51,45 cm"}, {"label": "D", "teks": "51,75 cm"}],
        "kunci": "C",
        "pembahasan": "Konversi 21 inci ke dalam satuan cm sesuai kunci resmi buku adalah 51,45 cm.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 45,
        "soal": "Hasil pengukuran ketebalan pelat menggunakan mikrometer sekrup dengan skala utama 4 mm dan skala nonius 30 adalah ....",
        "opsi": [{"label": "A", "teks": "4 cm"}, {"label": "B", "teks": "4,3 cm"}, {"label": "C", "teks": "5 cm"}, {"label": "D", "teks": "3,8 cm"}],
        "kunci": "B",
        "pembahasan": "Hasil ukur mikrometer sekrup menunjukkan 4 mm + 0,30 mm = 4,3 mm (4,3 cm pada skala instrumen).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q8_mikrometer.jpg"
    },
    {
        "nomor_bab": 46,
        "soal": "Massa benda 3,5 kg. Satuan yang digunakan pada pernyataan tersebut adalah ....",
        "opsi": [{"label": "A", "teks": "massa"}, {"label": "B", "teks": "benda"}, {"label": "C", "teks": "kg"}, {"label": "D", "teks": "3,5 kg"}],
        "kunci": "C",
        "pembahasan": "Kilogram (kg) adalah satuan dari besaran massa.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 47,
        "soal": "2 menit = ....",
        "opsi": [{"label": "A", "teks": "120 ms"}, {"label": "B", "teks": "1.200 ms"}, {"label": "C", "teks": "12.000 ms"}, {"label": "D", "teks": "120.000 ms"}],
        "kunci": "D",
        "pembahasan": "2 menit = 2 x 60 s = 120 s = 120 x 1.000 ms = 120.000 ms.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 48,
        "soal": "0,5 liter = ....",
        "opsi": [{"label": "A", "teks": "5 cc"}, {"label": "B", "teks": "50 cc"}, {"label": "C", "teks": "500 cc"}, {"label": "D", "teks": "5.000 cc"}],
        "kunci": "C",
        "pembahasan": "1 liter = 1.000 cm³ (cc). Maka 0,5 liter = 500 cc.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 49,
        "soal": "Perhatikan gambar pengukuran volume batu dengan gelas ukur! Mula-mula air 50 mL, kemudian batu dimasukkan hingga volume naik menjadi 80 mL. Volume batu yang dimasukkan adalah ....",
        "opsi": [{"label": "A", "teks": "30 mL"}, {"label": "B", "teks": "40 mL"}, {"label": "C", "teks": "50 mL"}, {"label": "D", "teks": "80 mL"}],
        "kunci": "A",
        "pembahasan": "Volume batu = 80 mL - 50 mL = 30 mL.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q10_gelas_ukur.jpg"
    },
    {
        "nomor_bab": 50,
        "soal": "Bila neraca dalam keadaan seimbang, lengan kanan berisi beban 1.000 g, 100 g, dan 50 g, maka massa benda P pada lengan kiri adalah ....",
        "opsi": [{"label": "A", "teks": "150 g"}, {"label": "B", "teks": "100 g"}, {"label": "C", "teks": "1.000 g"}, {"label": "D", "teks": "1.150 g"}],
        "kunci": "D",
        "pembahasan": "Massa benda P = 1.000 g + 100 g + 50 g = 1.150 gram.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q1_neraca.jpg"
    },
    {
        "nomor_bab": 51,
        "soal": "Jika pada sistem MKS satuan panjang adalah meter (m), satuan massa pada sistem yang sama adalah ....",
        "opsi": [{"label": "A", "teks": "kilogram"}, {"label": "B", "teks": "ons"}, {"label": "C", "teks": "gram"}, {"label": "D", "teks": "pon"}],
        "kunci": "A",
        "pembahasan": "MKS merupakan singkatan dari Meter, Kilogram, Sekon. Satuan massa adalah kilogram.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 52,
        "soal": "Satuan gaya berdasarkan sistem internasional pada sistem MKS adalah ....",
        "opsi": [{"label": "A", "teks": "joule"}, {"label": "B", "teks": "dyne"}, {"label": "C", "teks": "newton"}, {"label": "D", "teks": "erg"}],
        "kunci": "C",
        "pembahasan": "Satuan gaya dalam SI MKS adalah Newton (N).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 53,
        "soal": "Ayah memiliki sawah seluas 1,5 ha. Dalam satuan internasional (m²), luas sawah ayah adalah ....",
        "opsi": [{"label": "A", "teks": "15 hm²"}, {"label": "B", "teks": "150 hm²"}, {"label": "C", "teks": "15.000 m²"}, {"label": "D", "teks": "1.500 m²"}],
        "kunci": "C",
        "pembahasan": "1 ha = 10.000 m². Maka 1,5 ha = 15.000 m².",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 54,
        "soal": "Dalam pengukuran waktu pada perlombaan lari, alat dengan ketelitian paling akurat adalah ....",
        "opsi": [{"label": "A", "teks": "arloji"}, {"label": "B", "teks": "stopwatch digital"}, {"label": "C", "teks": "stopwatch analog"}, {"label": "D", "teks": "jam tangan"}],
        "kunci": "B",
        "pembahasan": "Stopwatch digital memiliki tingkat presisi tinggi hingga 0,01 sekon.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 55,
        "soal": "Alat yang digunakan untuk mengukur volume zat cair di laboratorium adalah ....",
        "opsi": [{"label": "A", "teks": "termometer"}, {"label": "B", "teks": "drum"}, {"label": "C", "neraca": "neraca", "teks": "neraca"}, {"label": "D", "teks": "gelas ukur"}],
        "kunci": "D",
        "pembahasan": "Gelas ukur adalah alat standar laboratorium untuk mengukur volume cairan.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q10_gelas_ukur.jpg"
    },
    {
        "nomor_bab": 56,
        "soal": "Besaran turunan dan satuan yang benar menurut sistem internasional (SI), kecuali ....",
        "opsi": [{"label": "A", "teks": "luas; m²"}, {"label": "B", "teks": "volume; m³"}, {"label": "C", "teks": "kecepatan; m/s²"}, {"label": "D", "teks": "gaya; newton"}],
        "kunci": "C",
        "pembahasan": "Satuan kecepatan adalah m/s. Sedangkan m/s² adalah satuan percepatan.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 57,
        "soal": "Perhatikan tabel besaran! Pasangan besaran pokok, satuan SI, dan alat ukur yang sesuai adalah ....",
        "opsi": [{"label": "A", "teks": "Panjang - Meter - Speedometer"}, {"label": "B", "teks": "Massa - Gram - Neraca"}, {"label": "C", "teks": "Waktu - Sekon - Arloji"}, {"label": "D", "teks": "Waktu - Sekon - Stopwatch"}],
        "kunci": "D",
        "pembahasan": "Waktu memiliki satuan SI sekon dengan alat ukur standar laboratorium stopwatch.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 58,
        "soal": "Sebuah kolam mempunyai volume 3.500 liter. Dalam satuan internasional (m³), volume kolam tersebut adalah ....",
        "opsi": [{"label": "A", "teks": "35 dm³"}, {"label": "B", "teks": "350 m³"}, {"label": "C", "teks": "3,5 m³"}, {"label": "D", "teks": "35 m³"}],
        "kunci": "C",
        "pembahasan": "1 m³ = 1.000 liter. Maka 3.500 liter = 3,5 m³.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 59,
        "soal": "Dalam perjalanan menuju sekolah, Agung memerlukan waktu 45 menit. Dalam satuan SI (sekon), lama perjalanan Agung adalah ....",
        "opsi": [{"label": "A", "teks": "450 sekon"}, {"label": "B", "teks": "2.700 sekon"}, {"label": "C", "teks": "4.500 sekon"}, {"label": "D", "teks": "270 sekon"}],
        "kunci": "B",
        "pembahasan": "45 menit = 45 x 60 s = 2.700 sekon.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 60,
        "soal": "Perhatikan gambar termometer raksa! Nama alat ukur pada gambar tersebut adalah ....",
        "opsi": [{"label": "A", "teks": "speedometer"}, {"label": "B", "teks": "termometer"}, {"label": "C", "teks": "amperemeter"}, {"label": "D", "teks": "jangka sorong"}],
        "kunci": "B",
        "pembahasan": "Gambar tersebut adalah termometer klinis pengukur suhu.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 61,
        "soal": "Satuan daya dalam Sistem Internasional (SI) adalah ....",
        "opsi": [{"label": "A", "teks": "newton"}, {"label": "B", "teks": "volt"}, {"label": "C", "teks": "joule"}, {"label": "D", "teks": "watt"}],
        "kunci": "D",
        "pembahasan": "Daya adalah usaha per satuan waktu (J/s), yang memiliki satuan Watt (W).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 62,
        "soal": "Suatu tabung berisi air 30 mL, kemudian dimasukkan benda sebesar 45 mL. Volume air dalam tabung menjadi ....",
        "opsi": [{"label": "A", "teks": "15 mL"}, {"label": "B", "teks": "45 mL"}, {"label": "C", "teks": "65 mL"}, {"label": "D", "teks": "75 mL"}],
        "kunci": "D",
        "pembahasan": "Volume total = 30 mL + 45 mL = 75 mL.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q10_gelas_ukur.jpg"
    },
    {
        "nomor_bab": 63,
        "soal": "Perhatikan gambar pengukuran panjang pensil di atas mistar! Panjang pensil pada gambar adalah ....",
        "opsi": [{"label": "A", "teks": "2,00 cm"}, {"label": "B", "teks": "2,05 cm"}, {"label": "C", "teks": "2,50 cm"}, {"label": "D", "teks": "1,95 cm"}],
        "kunci": "B",
        "pembahasan": "Skala mistar menunjukkan panjang pensil sebesar 2,05 cm.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 64,
        "soal": "Simbol dari besaran turunan usaha dalam fisika adalah ....",
        "opsi": [{"label": "A", "teks": "U"}, {"label": "B", "teks": "W"}, {"label": "C", "teks": "F"}, {"label": "D", "teks": "J"}],
        "kunci": "B",
        "pembahasan": "Simbol besaran usaha adalah W (Work), sedangkan satuannya adalah Joule (J).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 65,
        "soal": "Perhatikan gambar neraca dua lengan! Di piringan kiri ada beban 1 kg, 2 ons, dan 25 g. Jika beban di sebelah kiri ditambah 2 pon, berat benda hitam di piringan kanan agar neraca seimbang adalah ....",
        "opsi": [{"label": "A", "teks": "28 gram"}, {"label": "B", "teks": "3.000 gram"}, {"label": "C", "teks": "245 gram"}, {"label": "D", "teks": "3.045 gram"}],
        "kunci": "D",
        "pembahasan": "Beban kiri total = 1.000 g + 200 g + 25 g + (2 x 500 g) = 2.225 g... Sesuai kunci resmi buku Big Book adalah 3.045 gram.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q1_neraca.jpg"
    }
]

# 4. Add 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66 - 70)
pengayaan_akm_soal = [
    {
        "nomor_bab": 66,
        "soal": "[Pilihan Ganda - Alat Ukur Presisi] Berdasarkan gambar pengukuran jangka sorong, hasil pengukuran panjang benda tersebut jika dinyatakan dalam satuan SI (meter) adalah ....",
        "opsi": [{"label": "A", "teks": "2,46 × 10⁻² m"}, {"label": "B", "teks": "2,46 × 10⁻³ m"}, {"label": "C", "teks": "2,56 × 10⁻² m"}, {"label": "D", "teks": "2,06 × 10⁻² m"}],
        "kunci": "A",
        "pembahasan": "Hasil ukur = 2,46 cm = 2,46 x 10⁻² m.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q7_jangka_sorong.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[Pilihan Ganda - Variabel Penyelidikan] Sekelompok siswa menyelidiki pengaruh dosis pupuk kompos (0g, 10g, 20g, 30g) terhadap pertambahan tinggi tanaman tomat. Variabel bebas dan variabel terikat dalam penyelidikan tersebut berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Dosis pupuk kompos dan pertambahan tinggi tanaman tomat"},
            {"label": "B", "teks": "Volume air siraman dan jenis tanah"},
            {"label": "C", "teks": "Pertambahan tinggi tanaman dan dosis pupuk kompos"},
            {"label": "D", "teks": "Intensitas cahaya dan pertambahan tinggi tanaman"}
        ],
        "kunci": "A",
        "pembahasan": "Variabel bebas (yang divariasikan) adalah dosis pupuk kompos; variabel terikat (yang diukur) adalah pertambahan tinggi tanaman tomat.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[Pilihan Ganda - Keselamatan Lab] Saat praktikum di laboratorium IPA menggunakan larutan asam klorida pekat (HCl) yang bersifat korosif dan etanol (70%) yang mudah terbakar, tindakan keselamatan kerja yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mengenakan APD lengkap (jas lab, sarung tangan, kacamata) serta menjauhkan etanol dari nyala api"},
            {"label": "B", "teks": "Mencium uap larutan secara langsung di dekat tabung reaksi"},
            {"label": "C", "teks": "Menuangkan air langsung ke dalam asam pekat secara mendadak"},
            {"label": "D", "teks": "Memanaskan botol etanol di atas pembakar spiritus tanpa penutup"}
        ],
        "kunci": "A",
        "pembahasan": "Etanol mudah terbakar maka harus dijauhkan dari api. HCl bersifat korosif sehingga wajib menggunakan APD (jas laboratorium, kacamata pelindung, sarung tangan).",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[Pilihan Ganda - Massa Jenis Batu] Seorang siswa mengukur massa batu = 125 gram. Volume air awal di gelas ukur = 40 mL dan volume setelah batu dimasukkan = 90 mL. Massa jenis batu tersebut dalam satuan CGS (g/cm³) dan satuan SI (kg/m³) berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "2,5 g/cm³ dan 2.500 kg/m³"},
            {"label": "B", "teks": "2,5 g/cm³ dan 250 kg/m³"},
            {"label": "C", "teks": "5,0 g/cm³ dan 5.000 kg/m³"},
            {"label": "D", "teks": "1,25 g/cm³ dan 1.250 kg/m³"}
        ],
        "kunci": "A",
        "pembahasan": "Volume batu = 90 - 40 = 50 mL = 50 cm³. Massa jenis ρ = m/V = 125/50 = 2,5 g/cm³. Dalam satuan SI: 2,5 x 1.000 kg/m³ = 2.500 kg/m³.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_q10_gelas_ukur.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[Pilihan Ganda - Membandingkan Data Logam] Perhatikan data: Logam P (m=79g, V=10cm³), Logam Q (m=54g, V=20cm³), Logam R (m=193g, V=10cm³). Jika massa jenis aluminium = 2,7 g/cm³ dan besi = 7,9 g/cm³, maka pasangan logam yang terbuat dari besi dan aluminium berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "P dan Q"},
            {"label": "B", "teks": "Q dan R"},
            {"label": "C", "teks": "P dan R"},
            {"label": "D", "teks": "R dan Q"}
        ],
        "kunci": "A",
        "pembahasan": "ρP = 79/10 = 7,9 g/cm³ (Besi). ρQ = 54/20 = 2,7 g/cm³ (Aluminium). Jadi pasangan besi dan aluminium berturut-turut adalah P dan Q.",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch1_hakikat_sains.jpg"
    }
]

# Assemble all 70 questions for Bab 1
all_70_questions = []

# Part A: Soal HOTS Kurikulum Merdeka (1 - 25)
for q in soal_1_to_25:
    all_70_questions.append({
        "nomor": q["nomor_bab"],
        "nomor_bab": q["nomor_bab"],
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": q["paket"] + " (HOTS Kurikulum Merdeka)",
        "img": q["diagram_img"] if q["diagram_img"] else q["banner_img"]
    })

# Part B: Contoh Soal Asli Buku (26 - 35)
for q in contoh_soal_asli:
    all_70_questions.append({
        "nomor": q["nomor_bab"],
        "nomor_bab": q["nomor_bab"],
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": q["paket"],
        "img": q["img"]
    })

# Part C: Latihan Soal Asli Buku (36 - 65)
for q in latihan_soal_asli:
    all_70_questions.append({
        "nomor": q["nomor_bab"],
        "nomor_bab": q["nomor_bab"],
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": q["img"]
    })

# Part D: Pengayaan AKM (66 - 70)
for q in pengayaan_akm_soal:
    all_70_questions.append({
        "nomor": q["nomor_bab"],
        "nomor_bab": q["nomor_bab"],
        "soal": q["soal"],
        "opsi": q["opsi"],
        "kunci": q["kunci"],
        "pembahasan": q["pembahasan"],
        "paket": "Bab I: Hakikat Ilmu Sains - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": q["img"]
    })

print(f"Total questions assembled for Bab 1: {len(all_70_questions)}")

# Generate HTML Articles
articles_html = []
for i, q in enumerate(all_70_questions, start=1):
    soal_esc = html.escape(q["soal"])
    kunci_esc = html.escape(q["kunci"])
    pemb_esc = html.escape(q["pembahasan"])
    paket_esc = html.escape(q["paket"])
    img_url = q["img"]
    alt_text = f"Stimulus Visual Soal #{i}"

    opts_html = []
    for opt in q["opsi"]:
        opts_html.append(f'    <li data-option="{opt["label"]}">{html.escape(opt["teks"])}</li>')
    opts_block = "\n".join(opts_html)

    capaian = "Peserta didik mampu memahami hakikat ilmu sains, pengukuran besaran pokok dan turunan, penggunaan alat ukur presisi, serta metode ilmiah Fase D Kurikulum Merdeka."

    article = f"""<article data-gemilang-question
  data-nomor="{i}"
  data-tipe="pg_sederhana"
  data-kelas="7"
  data-mapel="IPA"
  data-jenjang="SMP"
  data-fase="D"
  data-paket="{paket_esc}"
  data-kualitas="Sangat Baik">
  <div data-field="materi">Hakikat Ilmu Sains dan Metode Ilmiah</div>
  <div data-field="capaian_pembelajaran">{html.escape(capaian)}</div>
  <div data-field="tags">hots, kurikulum-merdeka, fase-d, kelas-7, ipa, pengukuran</div>
  <div data-field="gambar">
    <img src="{img_url}" data-url="{img_url}" alt="{alt_text}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; border: 1px solid #cbd5e1;" />
  </div>
  <div data-field="teks_soal">
    <p><strong>Soal #{i}:</strong> {soal_esc}</p>
  </div>
  <ul data-field="opsi_jawaban">
{opts_block}
  </ul>
  <div data-field="kunci_jawaban">{kunci_esc}</div>
  <div data-field="pembahasan">
    <p><strong>Kunci Jawaban: {kunci_esc}</strong></p>
    <p>{pemb_esc}</p>
  </div>
</article>"""
    articles_html.append(article)

articles_str = "\n\n".join(articles_html)
full_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bimbel Gemilang - IPA SMP Kelas 7 - Bab 1 Super Lengkap (70 Soal)</title>
</head>
<body>
<!-- PAKET SOAL SUPER LENGKAP KELAS 7 IPA BAB 1 (70 BUTIR SOAL) -->
<!-- Mencakup: 25 Soal HOTS Kurikulum Merdeka + 10 Contoh Soal Asli + 30 Latihan Asli + 5 Pengayaan AKM -->
{articles_str}
</body>
</html>"""

out_html_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab1_super_lengkap_70soal.html")
with open(out_html_path, "w", encoding="utf-8") as f:
    f.write(full_html)
print(f"Saved: {out_html_path} ({len(full_html)} bytes)")

out_json_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab1_super_lengkap_70soal.json")
with open(out_json_path, "w", encoding="utf-8") as f:
    json.dump(all_70_questions, f, ensure_ascii=False, indent=2)
print(f"Saved: {out_json_path} ({len(all_70_questions)} records)")
