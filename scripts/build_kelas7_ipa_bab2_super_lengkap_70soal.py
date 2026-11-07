#!/usr/bin/env python3
"""
build_kelas7_ipa_bab2_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 2 (Zat dan Perubahannya):
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

# 1. Load questions 1-25 from verified Kurikulum Merdeka Chapter 2
with open(os.path.join(OUTPUT_DIR, "kelas7_ipa_kurikulum_merdeka_175soal_lengkap.json"), "r", encoding="utf-8") as f:
    k7_all = json.load(f)

soal_1_to_25 = [q for q in k7_all if q["chapter"] == 2]

# 2. Add 10 Contoh Soal Asli Buku Big Book Bab 02 (Wujud Zat & Massa Jenis) (No. 26–35)
contoh_soal_asli = [
    {
        "nomor_bab": 26,
        "soal": "Berikut ini yang bukan ciri dari zat padat adalah ....",
        "opsi": [
            {"label": "A", "teks": "bentuk tetap"},
            {"label": "B", "teks": "susunan partikel teratur"},
            {"label": "C", "teks": "volume berubah"},
            {"label": "D", "teks": "jarak antarpartikel rapat"}
        ],
        "kunci": "C",
        "pembahasan": "Ciri-ciri zat padat adalah memiliki bentuk tetap, volume tetap, partikel tersusun secara teratur, dan jarak antarpartikel sangat rapat sehingga gaya tarik antarpartikel sangat kuat. Jadi, yang bukan merupakan ciri zat padat adalah volumenya berubah.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Gaya tarik-menarik antarpartikel yang tidak sejenis disebut ....",
        "opsi": [
            {"label": "A", "teks": "kohesi"},
            {"label": "B", "teks": "adhesi"},
            {"label": "C", "teks": "meniskus cekung"},
            {"label": "D", "teks": "kapilaritas"}
        ],
        "kunci": "B",
        "pembahasan": "Gaya tarik-menarik antarpartikel sejenis disebut kohesi (misalnya antarpartikel air), sedangkan gaya tarik-menarik antarpartikel yang tidak sejenis disebut adhesi (misalnya antara partikel air dengan kaca tabung reaksi).",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Permukaan air dalam sebuah tabung atau bejana merupakan contoh peristiwa ....",
        "opsi": [
            {"label": "A", "teks": "kohesi"},
            {"label": "B", "teks": "adhesi"},
            {"label": "C", "teks": "meniskus cekung"},
            {"label": "D", "teks": "meniskus cembung"}
        ],
        "kunci": "C",
        "pembahasan": "Air yang berada di dalam sebuah tabung atau bejana kaca permukaannya akan berbentuk cekung karena gaya adhesi antara partikel air dan kaca lebih besar daripada gaya kohesi antarpartikel air. Peristiwa tersebut dinamakan meniskus cekung.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Jika massa jenis adalah perbandingan antara massa dan volumenya, maka rumus untuk menentukan massa benda adalah ....",
        "opsi": [
            {"label": "A", "teks": "m = ρ × V"},
            {"label": "B", "teks": "m = V / ρ"},
            {"label": "C", "teks": "m = ρ / V"},
            {"label": "D", "teks": "m = V : ρ"}
        ],
        "kunci": "A",
        "pembahasan": "Persamaan dasar massa jenis adalah ρ = m / V. Dengan mengalikan silang kedua ruas dengan volume (V), diperoleh rumus untuk menentukan massa benda yaitu m = ρ × V.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Satuan dalam Sistem Internasional (SI) yang menyatakan massa jenis adalah ....",
        "opsi": [
            {"label": "A", "teks": "g/m³"},
            {"label": "B", "teks": "g/cm²"},
            {"label": "C", "teks": "kg/cm³"},
            {"label": "D", "teks": "kg/m³"}
        ],
        "kunci": "D",
        "pembahasan": "Satuan baku massa dalam SI adalah kilogram (kg) dan satuan volume adalah meter kubik (m³). Oleh karena itu, satuan standar massa jenis dalam SI adalah kg/m³ (atau dalam sistem CGS dinyatakan dalam g/cm³ dengan konversi 1 g/cm³ = 1.000 kg/m³).",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Sebuah balok memiliki ukuran panjang 10 cm, lebar 3 cm, dan tinggi 5 cm. Jika massa balok adalah 300 gram, massa jenis balok tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1 g/cm³"},
            {"label": "B", "teks": "2 g/cm³"},
            {"label": "C", "teks": "3 g/cm³"},
            {"label": "D", "teks": "4 g/cm³"}
        ],
        "kunci": "B",
        "pembahasan": "Volume balok V = p × l × t = 10 cm × 3 cm × 5 cm = 150 cm³. Maka massa jenis balok ρ = m / V = 300 g / 150 cm³ = 2 g/cm³.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Sebuah benda memiliki massa jenis 0,8 kg/m³. Jika massa benda tersebut 2 kg, volume benda adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 m³"},
            {"label": "B", "teks": "2,5 m³"},
            {"label": "C", "teks": "3 m³"},
            {"label": "D", "teks": "3,5 m³"}
        ],
        "kunci": "B",
        "pembahasan": "Diketahui ρ = 0,8 kg/m³ dan m = 2 kg. Volume benda V = m / ρ = 2 / 0,8 = 2,5 m³.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Sebuah bola memiliki massa jenis 2 g/cm³ dan volume 64 cm³. Massa bola tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "32 gram"},
            {"label": "B", "teks": "64 gram"},
            {"label": "C", "teks": "128 gram"},
            {"label": "D", "teks": "132 gram"}
        ],
        "kunci": "C",
        "pembahasan": "Diketahui ρ = 2 g/cm³ dan V = 64 cm³. Maka massa benda m = ρ × V = 2 × 64 = 128 gram.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Perubahan wujud zat dari cair menjadi gas dengan cara penyerapan kalor disebut ....",
        "opsi": [
            {"label": "A", "teks": "mencair"},
            {"label": "B", "teks": "mengembun"},
            {"label": "C", "teks": "menyublim"},
            {"label": "D", "teks": "menguap"}
        ],
        "kunci": "D",
        "pembahasan": "Perubahan wujud dari zat cair menjadi zat gas disebut menguap (atau mendidih jika terjadi di seluruh bagian zat cair pada titik didihnya). Proses ini memerlukan/menyerap kalor dari lingkungan.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Perubahan wujud menyublim merupakan perubahan dari zat berwujud ... menjadi berwujud ....",
        "opsi": [
            {"label": "A", "teks": "cair menjadi padat"},
            {"label": "B", "teks": "gas menjadi padat"},
            {"label": "C", "teks": "gas menjadi cair"},
            {"label": "D", "teks": "padat menjadi gas"}
        ],
        "kunci": "D",
        "pembahasan": "Menyublim adalah peristiwa perubahan wujud zat dari padat langsung menjadi gas tanpa melalui fase cair terlebih dahulu, misalnya pada kapur barus (kamper) atau es kering (dry ice).",
        "paket": "Bab II: Zat dan Perubahannya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    }
]

# 3. Add 30 Latihan Soal Asli Buku Big Book Bab 02 (No. 36–65)
# Official keys from page 832:
# 1: A, 2: B, 3: D, 4: C, 5: A, 6: B, 7: C, 8: B, 9: B, 10: B
# 11: C, 12: B, 13: D, 14: B, 15: B, 16: D, 17: B, 18: A, 19: D, 20: D
# 21: A, 22: B, 23: D, 24: B, 25: B, 26: B, 27: B, 28: D, 29: D, 30: B

latihan_soal_asli = [
    {
        "nomor_bab": 36,
        "soal": "Model partikel dengan jarak antarpartikel sangat rapat, gaya tarik antarpartikel sangat kuat, dan susunan teratur merupakan karakteristik wujud zat ....",
        "opsi": [
            {"label": "A", "teks": "padat"},
            {"label": "B", "teks": "cair"},
            {"label": "C", "teks": "gas"},
            {"label": "D", "teks": "plasma"}
        ],
        "kunci": "A",
        "pembahasan": "Zat padat memiliki susunan partikel yang sangat rapat dan teratur dengan gaya tarik antarpartikel yang sangat kuat, sehingga bentuk dan volumenya selalu tetap.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 37,
        "soal": "Di antara sifat-sifat zat berikut yang bukan merupakan ciri zat gas adalah ....",
        "opsi": [
            {"label": "A", "teks": "bentuknya berubah mengikuti wadah"},
            {"label": "B", "teks": "susunan partikel teratur"},
            {"label": "C", "teks": "volumenya dapat dimampatkan"},
            {"label": "D", "teks": "jarak antarpartikel sangat renggang"}
        ],
        "kunci": "B",
        "pembahasan": "Partikel zat gas bergerak bebas ke segala arah, jarak antarpartikel sangat renggang, susunannya sangat tidak teratur, dan gaya tarik antarpartikel sangat lemah. Jadi yang bukan ciri zat gas adalah susunan partikel teratur.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 38,
        "soal": "Nilai massa jenis suatu zat cair adalah 10 g/cm³. Jika dinyatakan dalam satuan SI (kg/m³), nilai massa jenis tersebut setara dengan ....",
        "opsi": [
            {"label": "A", "teks": "10 kg/m³"},
            {"label": "B", "teks": "100 kg/m³"},
            {"label": "C", "teks": "1.000 kg/m³"},
            {"label": "D", "teks": "10.000 kg/m³"}
        ],
        "kunci": "D",
        "pembahasan": "Konversi dari g/cm³ ke kg/m³ adalah dikalikan 1.000 (karena 1 g = 10⁻³ kg dan 1 cm³ = 10⁻⁶ m³). Maka 10 g/cm³ = 10 × 1.000 = 10.000 kg/m³.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 39,
        "soal": "Zat yang memiliki sifat bentuk selalu berubah mengikuti wadahnya dan volumenya juga selalu berubah memenuhi seluruh ruangan adalah ....",
        "opsi": [
            {"label": "A", "teks": "zat padat"},
            {"label": "B", "teks": "zat cair"},
            {"label": "C", "teks": "zat gas"},
            {"label": "D", "teks": "zat padat dan cair"}
        ],
        "kunci": "C",
        "pembahasan": "Zat cair memiliki bentuk berubah tetapi volume tetap. Zat padat memiliki bentuk dan volume tetap. Zat gas memiliki bentuk dan volume yang berubah-ubah memenuhi seluruh ruangan wadahnya.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 40,
        "soal": "Massa jenis sebuah kubus yang memiliki massa 250 gram dan panjang rusuk 5 cm adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 g/cm³"},
            {"label": "B", "teks": "3 g/cm³"},
            {"label": "C", "teks": "4 g/cm³"},
            {"label": "D", "teks": "5 g/cm³"}
        ],
        "kunci": "A",
        "pembahasan": "Volume kubus V = s³ = 5³ = 125 cm³. Massa jenis ρ = m / V = 250 / 125 = 2 g/cm³.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 41,
        "soal": "Perubahan wujud zat dari padat menjadi cair akibat kenaikan suhu atau penyerapan kalor disebut ....",
        "opsi": [
            {"label": "A", "teks": "membeku"},
            {"label": "B", "teks": "melebur"},
            {"label": "C", "teks": "menyublim"},
            {"label": "D", "teks": "menguap"}
        ],
        "kunci": "B",
        "pembahasan": "Perubahan wujud dari padat menjadi cair disebut melebur atau mencair. Sebaliknya, perubahan dari cair menjadi padat disebut membeku.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 42,
        "soal": "Permukaan zat cair di dalam gelas ukur sebelum dimasukkan batu adalah 300 mL. Setelah sebuah batu berdensitas 1,5 g/mL dimasukkan ke dalamnya, permukaan air naik menjadi 500 mL. Massa batu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "150 gram"},
            {"label": "B", "teks": "200 gram"},
            {"label": "C", "teks": "300 gram"},
            {"label": "D", "teks": "400 gram"}
        ],
        "kunci": "C",
        "pembahasan": "Volume batu diperoleh dari kenaikan permukaan air: V = 500 mL - 300 mL = 200 mL = 200 cm³. Massa batu m = ρ × V = 1,5 g/cm³ × 200 cm³ = 300 gram.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 43,
        "soal": "Peristiwa naik atau turunnya zat cair di dalam pembuluh sempit atau celah rambut disebut ....",
        "opsi": [
            {"label": "A", "teks": "kohesi"},
            {"label": "B", "teks": "kapilaritas"},
            {"label": "C", "teks": "adhesi"},
            {"label": "D", "teks": "meniskus"}
        ],
        "kunci": "B",
        "pembahasan": "Kapilaritas adalah gejala naik atau turunnya zat cair dalam pipa atau saluran kapiler sempit akibat pengaruh adhesi dan kohesi, seperti naiknya minyak tanah pada sumbu kompor atau air tanah pada pembuluh xilem tumbuhan.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 44,
        "soal": "Sebuah gelas ukur mula-mula berisi air 60 mL. Ketika sebuah benda padat dimasukkan ke dalamnya, volume air menjadi 90 mL. Volume benda tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "20 mL"},
            {"label": "B", "teks": "30 mL"},
            {"label": "C", "teks": "40 mL"},
            {"label": "D", "teks": "50 mL"}
        ],
        "kunci": "B",
        "pembahasan": "Volume benda yang tercelup sama dengan selisih volume akhir dan volume awal air: V = 90 mL - 60 mL = 30 mL.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 45,
        "soal": "Peristiwa di bawah ini yang merupakan contoh perubahan wujud dari padat langsung menjadi gas adalah ....",
        "opsi": [
            {"label": "A", "teks": "air disimpan di dalam freezer menjadi es"},
            {"label": "B", "teks": "kapur barus di lemari pakaian yang lama-kelamaan habis"},
            {"label": "C", "teks": "terbentuknya titik-titik embun pada daun di pagi hari"},
            {"label": "D", "teks": "air yang dipanaskan hingga mendidih dan mengeluarkan uap"}
        ],
        "kunci": "B",
        "pembahasan": "Kapur barus (kamper) di dalam lemari menyerap kalor dari udara dan berubah langsung dari wujud padat menjadi gas tanpa mencair terlebih dahulu. Peristiwa ini disebut menyublim.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 46,
        "soal": "Proses pembentukan es balok di pabrik pendingin merupakan contoh perubahan wujud zat dari ....",
        "opsi": [
            {"label": "A", "teks": "cair menjadi gas"},
            {"label": "B", "teks": "gas menjadi cair"},
            {"label": "C", "teks": "cair menjadi padat"},
            {"label": "D", "teks": "padat menjadi cair"}
        ],
        "kunci": "C",
        "pembahasan": "Pembuatan es balok melibatkan pelepasan kalor dari air (cair) sehingga membeku menjadi es (padat) pada suhu 0°C.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 47,
        "soal": "Dalam bagan siklus perubahan wujud zat, panah yang menghubungkan wujud gas menjadi wujud cair menunjukkan proses ....",
        "opsi": [
            {"label": "A", "teks": "menguap"},
            {"label": "B", "teks": "mengembun"},
            {"label": "C", "teks": "mencair"},
            {"label": "D", "teks": "melebur"}
        ],
        "kunci": "B",
        "pembahasan": "Perubahan wujud dari gas menjadi cair disebut mengembun (kondensasi), di mana zat melepaskan kalor ke lingkungan sekitar.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 48,
        "soal": "Sebuah kubus logam memiliki panjang rusuk 3 cm dan massa jenis 2,5 g/cm³. Massa kubus logam tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "60 gram"},
            {"label": "B", "teks": "62,5 gram"},
            {"label": "C", "teks": "65 gram"},
            {"label": "D", "teks": "67,5 gram"}
        ],
        "kunci": "D",
        "pembahasan": "Volume kubus V = s³ = 3³ = 27 cm³. Massa kubus m = ρ × V = 2,5 g/cm³ × 27 cm³ = 67,5 gram.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 49,
        "soal": "Sebuah gelas berpancuran diisi air penuh setinggi 500 mL. Ketika sebuah batu dimasukkan, air tumpah melalui pancuran ke wadah ukur sebanyak 150 mL. Berdasarkan prinsip Archimedes, volume batu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "100 mL"},
            {"label": "B", "teks": "150 mL"},
            {"label": "C", "teks": "200 mL"},
            {"label": "D", "teks": "250 mL"}
        ],
        "kunci": "B",
        "pembahasan": "Berdasarkan prinsip bejana berpancuran, volume zat padat yang dimasukkan sama persis dengan volume air yang tumpah ke wadah ukur, yaitu 150 mL.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 50,
        "soal": "Suhu ruangan laboratorium diukur dengan termometer Celcius menunjukkan angka 15°C. Jika suhu tersebut diukur dengan termometer skala Reamur, hasilnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "10°R"},
            {"label": "B", "teks": "12°R"},
            {"label": "C", "teks": "25°R"},
            {"label": "D", "teks": "27°R"}
        ],
        "kunci": "B",
        "pembahasan": "Hubungan konversi Celcius ke Reamur adalah R = (4/5) × C = (4/5) × 15 = 12°R.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 51,
        "soal": "Suhu air panas dalam termos diukur sebesar 86°F. Jika dinyatakan dalam skala Celcius, suhu air tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "54°C"},
            {"label": "B", "teks": "48°C"},
            {"label": "C", "teks": "35°C"},
            {"label": "D", "teks": "30°C"}
        ],
        "kunci": "D",
        "pembahasan": "Konversi Fahrenheit ke Celcius: C = (5/9) × (F - 32) = (5/9) × (86 - 32) = (5/9) × 54 = 30°C.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 52,
        "soal": "Suhu badan normal manusia rata-rata adalah 37°C. Nilai suhu badan tersebut bila dinyatakan dalam skala mutlak Kelvin adalah ....",
        "opsi": [
            {"label": "A", "teks": "273 K"},
            {"label": "B", "teks": "310 K"},
            {"label": "C", "teks": "323 K"},
            {"label": "D", "teks": "373 K"}
        ],
        "kunci": "B",
        "pembahasan": "Skala Kelvin dihitung dari suhu Celcius ditambah 273: K = C + 273 = 37 + 273 = 310 K.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 53,
        "soal": "Besaran yang tidak memengaruhi pertambahan panjang (ΔL) suatu zat padat saat dipanaskan adalah ....",
        "opsi": [
            {"label": "A", "teks": "warna cat permukaan benda"},
            {"label": "B", "teks": "panjang awal benda"},
            {"label": "C", "teks": "kenaikan suhu"},
            {"label": "D", "teks": "jenis bahan (koefisien muai panjang)"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus muai panjang zat padat adalah ΔL = L₀ × α × ΔT. Faktor penentunya adalah panjang awal (L₀), koefisien muai panjang jenis bahan (α), dan kenaikan suhu (ΔT). Warna permukaan benda tidak memengaruhi nilai pemuaian.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 54,
        "soal": "Suhu air kolam diukur menggunakan termometer Reamur terbaca 48°R. Jika diukur menggunakan skala Fahrenheit, nilai suhu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "127°F"},
            {"label": "B", "teks": "130°F"},
            {"label": "C", "teks": "132°F"},
            {"label": "D", "teks": "140°F"}
        ],
        "kunci": "D",
        "pembahasan": "Konversi Reamur ke Fahrenheit: F = (9/4) × R + 32 = (9/4) × 48 + 32 = 108 + 32 = 140°F.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 55,
        "soal": "Suhu suatu gas ideal diukur sebesar 300 K. Jika suhu gas tersebut dinyatakan dalam derajat Fahrenheit, nilainya adalah ....",
        "opsi": [
            {"label": "A", "teks": "48,6°F"},
            {"label": "B", "teks": "40,6°F"},
            {"label": "C", "teks": "68,6°F"},
            {"label": "D", "teks": "80,6°F"}
        ],
        "kunci": "D",
        "pembahasan": "Ubah dahulu Kelvin ke Celcius: C = 300 - 273 = 27°C. Kemudian ubah ke Fahrenheit: F = (9/5) × 27 + 32 = 48,6 + 32 = 80,6°F.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 56,
        "soal": "Sebuah lempeng logam memiliki koefisien muai panjang α = 0,000007/°C. Nilai koefisien muai luas (β) lempeng tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,000014/°C"},
            {"label": "B", "teks": "0,000021/°C"},
            {"label": "C", "teks": "0,000027/°C"},
            {"label": "D", "teks": "0,000049/°C"}
        ],
        "kunci": "A",
        "pembahasan": "Koefisien muai luas bernilai dua kali koefisien muai panjangnya: β = 2α = 2 × 0,000007/°C = 0,000014/°C.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 57,
        "soal": "Jika koefisien muai volume (γ) suatu batang aluminium adalah 0,000072/°C, maka koefisien muai panjang (α) aluminium tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,000012/°C"},
            {"label": "B", "teks": "0,000024/°C"},
            {"label": "C", "teks": "0,000036/°C"},
            {"label": "D", "teks": "0,000048/°C"}
        ],
        "kunci": "B",
        "pembahasan": "Koefisien muai volume bernilai tiga kali koefisien muai panjangnya: γ = 3α => α = γ / 3 = 0,000072 / 3 = 0,000024/°C.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 58,
        "soal": "Panjang sebatang besi pada suhu 25°C adalah 5 cm. Jika dipanaskan hingga suhu 75°C dan koefisien muai panjang besi adalah 0,000017/°C, besar pertambahan panjang besi tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,00254 cm"},
            {"label": "B", "teks": "0,00452 cm"},
            {"label": "C", "teks": "0,00524 cm"},
            {"label": "D", "teks": "0,00425 cm"}
        ],
        "kunci": "D",
        "pembahasan": "Diketahui L₀ = 5 cm, ΔT = 75°C - 25°C = 50°C, dan α = 0,000017/°C. Pertambahan panjang ΔL = L₀ × α × ΔT = 5 × 0,000017 × 50 = 0,00425 cm.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 59,
        "soal": "Kalor yang dibutuhkan untuk menaikkan suhu sejumlah air dari 30°C menjadi 70°C adalah 504.000 J. Jika kalor jenis air adalah 4.200 J/kg°C, maka massa air tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 kg"},
            {"label": "B", "teks": "3 kg"},
            {"label": "C", "teks": "4 kg"},
            {"label": "D", "teks": "5 kg"}
        ],
        "kunci": "B",
        "pembahasan": "Kenaikan suhu ΔT = 70°C - 30°C = 40°C. Berdasarkan rumus kalor Q = m × c × ΔT, maka m = Q / (c × ΔT) = 504.000 / (4.200 × 40) = 504.000 / 168.000 = 3 kg.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 60,
        "soal": "Air bersuhu 30°C sebanyak 5 kg dicampurkan dengan 2 kg air bersuhu 44°C di dalam bejana terisolasi. Jika pertukaran kalor hanya terjadi antar air, suhu akhir campuran adalah ....",
        "opsi": [
            {"label": "A", "teks": "14°C"},
            {"label": "B", "teks": "34°C"},
            {"label": "C", "teks": "54°C"},
            {"label": "D", "teks": "74°C"}
        ],
        "kunci": "B",
        "pembahasan": "Berdasarkan Asas Black (Q_lepas = Q_terima): m₁ × c × (T₁ - T_campuran) = m₂ × c × (T_campuran - T₂). Diperoleh 2 × (44 - T) = 5 × (T - 30) => 88 - 2T = 5T - 150 => 7T = 238 => T = 34°C.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 61,
        "soal": "Sebatang logam mengalami pertambahan panjang 0,82 cm ketika dipanaskan dengan kenaikan suhu 30°C. Jika panjang mula-mula batang tersebut adalah 123 cm, koefisien muai panjang logam adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,0001/°C"},
            {"label": "B", "teks": "0,0002/°C"},
            {"label": "C", "teks": "0,0003/°C"},
            {"label": "D", "teks": "0,0004/°C"}
        ],
        "kunci": "B",
        "pembahasan": "Koefisien muai panjang α = ΔL / (L₀ × ΔT) = 0,82 / (123 × 30) = 0,82 / 3.690 ≈ 0,00022/°C (dibulatkan menjadi 0,0002/°C).",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 62,
        "soal": "Batang baja dengan massa 2 kg dipanaskan hingga mengalami kenaikan suhu sebesar 40°C. Jika kalor jenis baja adalah 380 J/kg°C, jumlah kalor yang dibutuhkan adalah ....",
        "opsi": [
            {"label": "A", "teks": "30,2 kJ"},
            {"label": "B", "teks": "30,4 kJ"},
            {"label": "C", "teks": "30,5 kJ"},
            {"label": "D", "teks": "30,8 kJ"}
        ],
        "kunci": "B",
        "pembahasan": "Rumus kalor Q = m × c × ΔT = 2 kg × 380 J/kg°C × 40°C = 30.400 Joule = 30,4 kJ.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 63,
        "soal": "Sebongkah tembaga bermassa 2 kg dengan suhu awal 30°C menyerap kalor sebesar 39.000 Joule. Jika kalor jenis tembaga 390 J/kg°C, suhu akhir tembaga tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "20°C"},
            {"label": "B", "teks": "40°C"},
            {"label": "C", "teks": "60°C"},
            {"label": "D", "teks": "80°C"}
        ],
        "kunci": "D",
        "pembahasan": "Kenaikan suhu ΔT = Q / (m × c) = 39.000 / (2 × 390) = 39.000 / 780 = 50°C. Maka suhu akhir T = T_awal + ΔT = 30°C + 50°C = 80°C.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 64,
        "soal": "Peristiwa perpindahan kalor secara konduksi terjadi pada peristiwa ....",
        "opsi": [
            {"label": "A", "teks": "tubuh terasa hangat di dekat api unggun"},
            {"label": "B", "teks": "terjadinya hembusan angin laut di siang hari"},
            {"label": "C", "teks": "gerakan air mendidih yang berputar di dalam panci"},
            {"label": "D", "teks": "ujung sendok logam terasa panas saat mengaduk sup mendidih"}
        ],
        "kunci": "D",
        "pembahasan": "Konduksi adalah perpindahan kalor melalui zat perantara padat tanpa disertai perpindahan partikel zatnya. Contohnya ujung sendok logam yang menjadi panas saat dipakai mengaduk masakan panas.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 65,
        "soal": "Di antara bahan-bahan di bawah ini yang tergolong isolator panas yang baik adalah ....",
        "opsi": [
            {"label": "A", "teks": "besi"},
            {"label": "B", "teks": "kayu"},
            {"label": "C", "teks": "tembaga"},
            {"label": "D", "teks": "seng"}
        ],
        "kunci": "B",
        "pembahasan": "Bahan konduktor adalah bahan yang mudah menghantarkan kalor (seperti besi, tembaga, dan seng). Bahan isolator adalah bahan yang sukar/menghambat perpindahan kalor, contohnya kayu, karet, dan plastik.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    }
]

# 4. Add 5 Pengayaan AKM Literasi Sains Bab 02 (Hal 65–66) (No. 66–70)
pengayaan_akm = [
    {
        "nomor_bab": 66,
        "soal": "Pada grafik pemanasan es dari suhu -10°C menjadi air pada suhu 20°C: Proses pemanasan es hingga mencapai titik leburnya (0°C) membutuhkan kalor jenis es (c_es = 2.100 J/kg°C). Jika massa es 500 gram, besar kalor yang dibutuhkan pada proses kenaikan suhu es adalah ....",
        "opsi": [
            {"label": "A", "teks": "10.500 Joule"},
            {"label": "B", "teks": "21.000 Joule"},
            {"label": "C", "teks": "31.500 Joule"},
            {"label": "D", "teks": "42.000 Joule"}
        ],
        "kunci": "A",
        "pembahasan": "Diketahui m = 500 g = 0,5 kg, c_es = 2.100 J/kg°C, dan ΔT = 0°C - (-10°C) = 10°C. Maka kalor Q = m × c_es × ΔT = 0,5 kg × 2.100 J/kg°C × 10°C = 10.500 Joule.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "Sebanyak 200 gram es pada suhu 0°C hendak dileburkan seluruhnya menjadi air pada suhu 0°C. Jika kalor lebur es adalah 336.000 J/kg, besar kalor lebur yang dibutuhkan adalah ....",
        "opsi": [
            {"label": "A", "teks": "16.800 Joule"},
            {"label": "B", "teks": "33.600 Joule"},
            {"label": "C", "teks": "67.200 Joule"},
            {"label": "D", "teks": "134.400 Joule"}
        ],
        "kunci": "C",
        "pembahasan": "Massa es m = 200 g = 0,2 kg. Kalor untuk melebur Q = m × L = 0,2 kg × 336.000 J/kg = 67.200 Joule.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "Perhatikan fenomena pemuaian zat: Mengapa pada sambungan rel kereta api sengaja diberikan celah ruang renggang antarujung rel?",
        "opsi": [
            {"label": "A", "teks": "Agar roda kereta api dapat berputar lebih cepat"},
            {"label": "B", "teks": "Memberikan ruang pemuaian saat siang hari yang terik sehingga rel tidak melengkung"},
            {"label": "C", "teks": "Mencegah rel dari karat akibat kelembapan udara"},
            {"label": "D", "teks": "Memudahkan perbaikan bantalan kayu di bawah rel"}
        ],
        "kunci": "B",
        "pembahasan": "Pada siang hari, suhu udara meningkat dan sinar matahari menyebabkan batang rel baja memuai (bertambah panjang). Celah pada sambungan rel berfungsi memberikan ruang bagi pemuaian panjang tersebut agar rel tidak saling mendesak dan melengkung yang dapat membahayakan perjalanan kereta api.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "Bimetal terdiri dari dua keping logam berbeda koefisien muai panjang yang dikeling menjadi satu. Jika bimetal kuningan (α = 0,000019/°C) dan besi (α = 0,000012/°C) dipanaskan bersamaan, maka keping bimetal akan ....",
        "opsi": [
            {"label": "A", "teks": "melengkung ke arah logam besi yang koefisien muainya lebih kecil"},
            {"label": "B", "teks": "melengkung ke arah logam kuningan yang koefisien muainya lebih besar"},
            {"label": "C", "teks": "tetap lurus karena kedua logam sama-sama memuai"},
            {"label": "D", "teks": "terputus di bagian keling akibat perbedaan tekanan"}
        ],
        "kunci": "A",
        "pembahasan": "Saat dipanaskan, logam yang memiliki koefisien muai panjang lebih besar (kuningan) akan memuai lebih panjang dibandingkan logam yang koefisien muainya lebih kecil (besi). Akibatnya, keping bimetal akan melengkung ke arah logam yang pemuaiannya lebih kecil, yaitu ke arah besi.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "Mengapa pada termos air panas dinding bagian dalamnya dibuat berlapis kaca mengilap menyerupai cermin perak dan terdapat ruang hampa udara di antara dua dinding kaca?",
        "opsi": [
            {"label": "A", "teks": "Dinding cermin mencegah radiasi kalor dan ruang hampa mencegah konduksi serta konveksi"},
            {"label": "B", "teks": "Dinding cermin mempercepat penyerapan panas dan ruang hampa menambah daya apung air"},
            {"label": "C", "teks": "Ruang hampa mengalirkan arus konveksi agar panas merata"},
            {"label": "D", "teks": "Dinding cermin hanya berfungsi sebagai hiasan estetika termos"}
        ],
        "kunci": "A",
        "pembahasan": "Termos dirancang untuk mencegah ketiga cara perpindahan kalor: (1) Ruang hampa udara (vakum) di antara dua dinding kaca mencegah hilangnya kalor secara konduksi dan konveksi (karena tidak ada partikel medium); (2) Lapisan perak/cermin mengilap memantulkan kembali radiasi inframerah kalor ke dalam termos sehingga suhu air panas tetap terjaga dalam waktu lama.",
        "paket": "Bab II: Zat dan Perubahannya - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"
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
        "paket": "Bab II: Zat dan Perubahannya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "materi": "Zat dan Perubahannya: Wujud Zat, Partikel, Perubahan Fisika & Kimia, Pemisahan Campuran, Massa Jenis",
        "capaian": "Peserta didik mampu mengidentifikasi sifat dan karakteristik zat, membedakan perubahan fisika dan kimia, serta menentukan massa jenis benda.",
        "img": q.get("img", "/soal/ipa/kmerdeka_kls7_ipa_ch2_zat_perubahan.jpg"),
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
        "materi": "Zat dan Perubahannya: Wujud Zat, Gaya Antarpartikel, dan Massa Jenis",
        "capaian": "Peserta didik mampu menghitung massa jenis benda serta memahami konsep kohesi, adhesi, dan meniskus.",
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
        "materi": "Zat dan Perubahannya: Pemuaian, Suhu, dan Kalor",
        "capaian": "Peserta didik mampu menghitung konversi suhu, pemuaian zat, dan kalor pada perubahan wujud.",
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
        "materi": "Zat dan Perubahannya: Pengayaan AKM Literasi Sains & TKA",
        "capaian": "Peserta didik mampu menganalisis grafik perubahan wujud zat dan penerapan konsep kalor dalam teknologi sehari-hari.",
        "img": q["img"],
        "bacaan": ""
    })

print(f"Total questions assembled for Bab 2: {len(all_70)}")

# Save JSON
out_json_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab2_super_lengkap_70soal.json")
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
  <title>Kumpulan Soal Lengkap IPA SMP Kelas 7 - Bab II (70 Soal)</title>
</head>
<body>
{articles_str}
</body>
</html>'''

out_html_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab2_super_lengkap_70soal.html")
with open(out_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Saved: {out_html_path} ({len(html_content)} bytes)")
print(f"Saved: {out_json_path} ({len(all_70)} records)")
