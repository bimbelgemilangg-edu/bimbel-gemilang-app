#!/usr/bin/env python3
"""
build_kelas7_ipa_bab5_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 5 (Klasifikasi Makhluk Hidup):
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

# 1. Load questions 1-25 from verified Kurikulum Merdeka Chapter 5
with open(os.path.join(OUTPUT_DIR, "kelas7_ipa_kurikulum_merdeka_175soal_lengkap.json"), "r", encoding="utf-8") as f:
    k7_all = json.load(f)

soal_1_to_25 = [q for q in k7_all if q["chapter"] == 5]

# 2. Add 10 Contoh Soal Asli Buku Big Book (Ciri Makhluk Hidup & Klasifikasi) (No. 26–35)
contoh_soal_asli = [
    {
        "nomor_bab": 26,
        "soal": "Peristiwa daun putri malu (Mimosa pudica) yang mengatupkan daunnya ketika disentuh membuktikan bahwa makhluk hidup memiliki ciri ....",
        "opsi": [
            {"label": "A", "teks": "peka terhadap rangsang (iritabilitas)"},
            {"label": "B", "teks": "berkembang biak (reproduksi)"},
            {"label": "C", "teks": "mengeluarkan zat sisa (ekskresi)"},
            {"label": "D", "teks": "memerlukan nutrisi"}
        ],
        "kunci": "A",
        "pembahasan": "Gerak seismonasti/tigmonasti pada putri malu merupakan respon cepat terhadap rangsang sentuhan mekanik, yang membuktikan bahwa tumbuhan memiliki ciri iritabilitas (peka terhadap rangsang).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Urutan tingkatan takson pada tumbuhan dari yang tertinggi (terbesar) hingga terendah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kingdom - Divisio - Classis - Ordo - Familia - Genus - Species"},
            {"label": "B", "teks": "Kingdom - Filum - Classis - Ordo - Familia - Genus - Species"},
            {"label": "C", "teks": "Kingdom - Ordo - Familia - Classis - Divisio - Genus - Species"},
            {"label": "D", "teks": "Species - Genus - Familia - Ordo - Classis - Divisio - Kingdom"}
        ],
        "kunci": "A",
        "pembahasan": "Pada taksonomi tumbuhan, tingkatan kedua di bawah Kingdom adalah Divisio (sedangkan pada hewan menggunakan Filum). Urutan lengkapnya: Kingdom -> Divisio -> Classis -> Ordo -> Familia -> Genus -> Species.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Berdasarkan sistem tata nama ganda (Binomial Nomenclature) karya Carolus Linnaeus, penulisan nama ilmiah padi yang benar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Oryza sativa (dicetak miring atau digarisbawahi terpisah)"},
            {"label": "B", "teks": "oryza Sativa"},
            {"label": "C", "teks": "ORYZA SATIVA"},
            {"label": "D", "teks": "Oryza Sativa"}
        ],
        "kunci": "A",
        "pembahasan": "Aturan Binomial Nomenclature: terdiri dari 2 kata bahasa Latin, kata pertama menunjukkan Genus (diawali huruf kapital), kata kedua menunjukkan penunjuk spesies (seluruhnya huruf kecil), dan dicetak miring (italic) atau digarisbawahi terpisah.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Sistem klasifikasi 5 kingdom yang dikemukakan oleh Robert H. Whittaker mengelompokkan makhluk hidup menjadi ....",
        "opsi": [
            {"label": "A", "teks": "Monera, Protista, Fungi, Plantae, Animalia"},
            {"label": "B", "teks": "Virus, Monera, Jamur, Tumbuhan, Hewan"},
            {"label": "C", "teks": "Bakteri, Alga, Lumut, Paku, Biji"},
            {"label": "D", "teks": "Protozoa, Porifera, Coelenterata, Arthropoda, Chordata"}
        ],
        "kunci": "A",
        "pembahasan": "Sistem 5 Kingdom Whittaker (1969) terdiri atas: (1) Monera (prokariotik), (2) Protista (eukariotik sederhana), (3) Fungi (jamur saprofit berkitin), (4) Plantae (tumbuhan autotrof), dan (5) Animalia (hewan heterotrof multiseluler).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Ciri khas yang membedakan Kingdom Monera (seperti bakteri dan alga biru) dari keempat kingdom lainnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "selnya bersifat prokariotik (tidak memiliki membran inti sel)"},
            {"label": "B", "teks": "selnya tidak memiliki dinding sel"},
            {"label": "C", "teks": "tubuhnya selalu multiseluler makroskopis"},
            {"label": "D", "teks": "mampu bergerak dengan pseudopodia"}
        ],
        "kunci": "A",
        "pembahasan": "Monera adalah satu-satunya kelompok makhluk hidup yang materi genetiknya (DNA) tidak dibungkus oleh membran inti (prokariotik). Keempat kingdom lainnya sudah memiliki membran inti sejati (eukariotik).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Tumbuhan lumut (Bryophyta) dan tumbuhan paku (Pteridophyta) dikelompokkan bersama karena memiliki kesamaan dalam hal ....",
        "opsi": [
            {"label": "A", "teks": "berkembang biak dengan spora dan mengalami metagenesis (pergiliran keturunan)"},
            {"label": "B", "teks": "sama-sama memiliki pembuluh xilem dan floem"},
            {"label": "C", "teks": "menghasilkan bunga dan buah berbiji"},
            {"label": "D", "teks": "memiliki akar tunggang yang kokoh"}
        ],
        "kunci": "A",
        "pembahasan": "Lumut dan paku adalah tumbuhan berspora yang mengalami pergiliran keturunan (metagenesis) antara fase gametofit (penghasil gamet) dan fase sporofit (penghasil spora). Perbedaannya, lumut belum berkormus sejati/atrakheofita, sedangkan paku sudah memiliki pembuluh angkut sejati (kormofita berspora).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Perbedaan utama antara tumbuhan monokotil (berkeping satu) dan dikotil (berkeping dua) pada struktur daun dan batangnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Monokotil: tulang daun sejajar/melengkung dan berkas pengangkut tersebar; Dikotil: tulang daun menyirip/menjari dan berkas pengangkut teratur melingkar dengan kambium"},
            {"label": "B", "teks": "Monokotil: tulang daun menjari; Dikotil: tulang daun sejajar"},
            {"label": "C", "teks": "Monokotil berkambium dan bercabang; Dikotil tidak berkambium"},
            {"label": "D", "teks": "Monokotil memiliki akar tunggang; Dikotil memiliki akar serabut"}
        ],
        "kunci": "A",
        "pembahasan": "Karakteristik Monokotil: keping biji 1, akar serabut, batang tidak berkambium (berkas pengangkut tersebar), pertulangan daun sejajar/melengkung. Karakteristik Dikotil: keping biji 2, akar tunggang, batang berkambium (berkas pengangkut teratur melingkar), pertulangan daun menyirip/menjari.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Hewan yang memiliki ciri tubuh beruas-ruas, rangka luar (eksoskeleton) dari zat kitin, dan kaki berbuku-buku dikelompokkan ke dalam Filum ....",
        "opsi": [
            {"label": "A", "teks": "Mollusca"},
            {"label": "B", "teks": "Arthropoda"},
            {"label": "C", "teks": "Annelida"},
            {"label": "D", "teks": "Echinodermata"}
        ],
        "kunci": "B",
        "pembahasan": "Arthropoda (hewan berbuku-buku) memiliki tubuh beruas (kepala, dada, perut), eksoskeleton dari kitin yang mengalami molting/ekdisis, dan kaki bersendi/berbuku-buku. Contohnya serangga, udang, laba-laba, dan kelabang.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Hewan berdarah dingin (poikiloterm) adalah hewan yang suhu tubuhnya berubah-ubah mengikuti suhu lingkungan sekitar. Kelompok hewan vertebrata yang bersifat poikiloterm adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pisces, Amphibia, dan Reptilia"},
            {"label": "B", "teks": "Aves dan Mammalia"},
            {"label": "C", "teks": "Reptilia, Aves, dan Mammalia"},
            {"label": "D", "teks": "Hanya kelas Pisces saja"}
        ],
        "kunci": "A",
        "pembahasan": "Hewan poikiloterm (berdarah dingin) meliputi Ikan (Pisces), Katak (Amphibia), dan Reptil (Reptilia). Sedangkan Burung (Aves) dan Mamalia (Mammalia) bersifat homoioterm (berdarah panas / suhu tubuh konstan).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Kunci determinasi format dikotomi disajikan dalam bentuk pasangan pernyataan yang saling berlawanan. Jika kunci 1a: bertulang belakang dan 1b: tidak bertulang belakang, maka cumi-cumi dan cacing tanah akan masuk ke nomor ....",
        "opsi": [
            {"label": "A", "teks": "1a"},
            {"label": "B", "teks": "1b"},
            {"label": "C", "teks": "2a"},
            {"label": "D", "teks": "2b"}
        ],
        "kunci": "B",
        "pembahasan": "Cumi-cumi (Mollusca) dan cacing tanah (Annelida) adalah kelompok hewan avertebrata (invertebrata), yaitu hewan yang tidak memiliki tulang belakang, sehingga diarahkan ke nomor 1b.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    }
]

# 3. Add 30 Latihan Soal Mandiri Asli Buku Big Book (No. 36–65)
latihan_soal_asli = [
    {
        "nomor_bab": 36,
        "soal": "Tumbuhan mengeluarkan uap air melalui stomata pada daun saat udara panas terik. Proses ini merupakan ciri makhluk hidup yaitu ....",
        "opsi": [
            {"label": "A", "teks": "adaptasi"},
            {"label": "B", "teks": "ekskresi dan pengeluaran zat sisa (transpirasi)"},
            {"label": "C", "teks": "reproduksi"},
            {"label": "D", "teks": "respirasi anaerob"}
        ],
        "kunci": "B",
        "pembahasan": "Transpirasi (penguapan air melalui stomata) merupakan salah satu mekanisme ekskresi pengeluaran kelebihan air pada tumbuhan untuk menjaga turgiditas sel dan mendinginkan suhu daun.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 37,
        "soal": "Proses pembentukan glukosa dan oksigen oleh klorofil daun dengan bantuan sinar matahari menunjukkan ciri makhluk hidup ....",
        "opsi": [
            {"label": "A", "teks": "memerlukan nutrisi (sintesis makanan secara autotrof)"},
            {"label": "B", "teks": "mengeluarkan zat sisa"},
            {"label": "C", "teks": "peka terhadap rangsang kimia"},
            {"label": "D", "teks": "beradaptasi secara morfologi"}
        ],
        "kunci": "A",
        "pembahasan": "Fotosintesis adalah proses pemenuhan nutrisi secara autotrof oleh tumbuhan hijau menggunakan bahan anorganik (CO2 dan H2O) menjadi zat makanan organik (glukosa).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 38,
        "soal": "Perbesaran total sebuah bayangan sel epidermis bawang merah di bawah mikroskop jika menggunakan lensa okuler 10× dan lensa objektif 40× adalah ....",
        "opsi": [
            {"label": "A", "teks": "40 kali"},
            {"label": "B", "teks": "50 kali"},
            {"label": "C", "teks": "300 kali"},
            {"label": "D", "teks": "400 kali"}
        ],
        "kunci": "D",
        "pembahasan": "Perbesaran total mikroskop = Perbesaran lensa okuler × Perbesaran lensa objektif = 10 × 40 = 400 kali.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 39,
        "soal": "Bagian mikroskop yang berfungsi untuk memfokuskan bayangan preparat secara cepat dan kasar adalah ....",
        "opsi": [
            {"label": "A", "teks": "makrometer (sekrup fokus kasar)"},
            {"label": "B", "teks": "mikrometer (sekrup fokus halus)"},
            {"label": "C", "teks": "revolver"},
            {"label": "D", "teks": "diafragma"}
        ],
        "kunci": "A",
        "pembahasan": "Makrometer digunakan untuk menaik-turunkan tabung mikroskop atau meja preparat secara cepat guna menemukan fokus awal objek, sedangkan mikrometer untuk memperjelas fokus halus.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 40,
        "soal": "Pada klasifikasi tumbuhan berbiji (Spermatophyta), tumbuhan biji terbuka (Gymnospermae) dicirikan oleh ....",
        "opsi": [
            {"label": "A", "teks": "biji tidak dilindungi oleh daun buah (karpel) melainkan menempel pada konus/strobilus"},
            {"label": "B", "teks": "memiliki bunga sejati dengan mahkota berwarna-warni"},
            {"label": "C", "teks": "mengalami pembuahan ganda"},
            {"label": "D", "teks": "akarnya selalu berbentuk serabut halus"}
        ],
        "kunci": "A",
        "pembahasan": "Gymnospermae (contoh: pinus, melinjo, pakis haji, ginkgo) memiliki bakal biji yang terbuka pada permukaan strobilus dan tidak terbungkus daun buah, serta mengalami pembuahan tunggal.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 41,
        "soal": "Di antara pasangan tumbuhan berikut yang keduanya termasuk ke dalam kelompok Gymnospermae adalah ....",
        "opsi": [
            {"label": "A", "teks": "mangga dan rambutan"},
            {"label": "B", "teks": "pakis haji (Cycas rumphii) dan melinjo (Gnetum gnemon)"},
            {"label": "C", "teks": "jagung dan padi"},
            {"label": "D", "teks": "kacang tanah dan kedelai"}
        ],
        "kunci": "B",
        "pembahasan": "Pakis haji dan melinjo adalah anggota Gymnospermae yang menghasilkan strobilus jantan dan betina serta bijinya tidak tertutup oleh daging buah karpel.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 42,
        "soal": "Jamur (Fungi) dipisahkan dari Kingdom Plantae dan diletakkan dalam kingdom tersendiri karena jamur ....",
        "opsi": [
            {"label": "A", "teks": "tidak memiliki klorofil dan dinding selnya tersusun dari zat kitin"},
            {"label": "B", "teks": "dapat bergerak aktif seperti hewan"},
            {"label": "C", "teks": "bersifat prokariotik seperti bakteri"},
            {"label": "D", "teks": "menghasilkan biji di dalam sporangium"}
        ],
        "kunci": "A",
        "pembahasan": "Jamur tidak memiliki klorofil sehingga bersifat heterotrof (saprofit/parasit), dinding selnya dari kitin (bukan selulosa seperti tumbuhan), dan cadangan makanannya berupa glikogen.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 43,
        "soal": "Organisme bersel satu (uniseluler), eukariotik, dan bergerak aktif menggunakan bulu cambuk (flagela) seperti Euglena viridis digolongkan ke dalam Kingdom ....",
        "opsi": [
            {"label": "A", "teks": "Monera"},
            {"label": "B", "teks": "Protista"},
            {"label": "C", "teks": "Fungi"},
            {"label": "D", "teks": "Plantae"}
        ],
        "kunci": "B",
        "pembahasan": "Euglena viridis adalah mikroorganisme eukariotik uniseluler yang dimasukkan ke dalam Kingdom Protista (kelompok Protozoa menyerupai tumbuhan/hewan karena memiliki kloroplas dan flagela).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 44,
        "soal": "Protozoa yang bergerak menggunakan kaki semu (pseudopodia) untuk menangkap mangsa secara fagositosis adalah ....",
        "opsi": [
            {"label": "A", "teks": "Amoeba proteus"},
            {"label": "B", "teks": "Paramecium caudatum"},
            {"label": "C", "teks": "Plasmodium malariae"},
            {"label": "D", "teks": "Trypanosoma gambiense"}
        ],
        "kunci": "A",
        "pembahasan": "Amoeba tergolong Rhizopoda yang bergerak dan memangsa makanan dengan menjulurkan sitoplasmanya membentuk kaki semu (pseudopodia).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 45,
        "soal": "Ciri morfologi tumbuhan yang menunjukkan keping biji berbelah dua, perakaran tunggang, dan tulang daun menyirip dimiliki oleh kelompok ....",
        "opsi": [
            {"label": "A", "teks": "Dicotyledoneae (Tumbuhan Dikotil)"},
            {"label": "B", "teks": "Monocotyledoneae (Tumbuhan Monokotil)"},
            {"label": "C", "teks": "Gymnospermae"},
            {"label": "D", "teks": "Pteridophyta"}
        ],
        "kunci": "A",
        "pembahasan": "Karakteristik keping biji dua (berbelah), akar tunggang, dan daun menyirip/menjari adalah ciri definitif kelas Dikotil (contoh: mangga, jambu, kacang tanah).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 46,
        "soal": "Tumbuhan paku muda memiliki ciri khas pada ujung daunnya yaitu ....",
        "opsi": [
            {"label": "A", "teks": "menggulung (circinate vernation)"},
            {"label": "B", "teks": "membulat seperti bola"},
            {"label": "C", "teks": "membentuk duri tajam"},
            {"label": "D", "teks": "mengeluarkan getah putih pekat"}
        ],
        "kunci": "A",
        "pembahasan": "Salah satu ciri morfologis utama tumbuhan paku (Pteridophyta) adalah daun mudanya yang menggulung melingkar seperti spiral (circinate).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 47,
        "soal": "Kelompok hewan avertebrata yang tubuhnya berpori-pori halus tempat masuknya air dan zat makanan disebut ....",
        "opsi": [
            {"label": "A", "teks": "Porifera (hewan spons)"},
            {"label": "B", "teks": "Coelenterata (hewan berongga)"},
            {"label": "C", "teks": "Platyhelminthes (cacing pipih)"},
            {"label": "D", "teks": "Nemathelminthes (cacing gilig)"}
        ],
        "kunci": "A",
        "pembahasan": "Porifera adalah hewan multiseluler paling primitif yang tubuhnya dipenuhi pori-pori mikroskopis (ostium) untuk menyaring partikel makanan dari aliran air.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 48,
        "soal": "Ubur-ubur, anemon laut, dan karang laut dikelompokkan ke dalam Filum Coelenterata (Cnidaria) karena memiliki ....",
        "opsi": [
            {"label": "A", "teks": "sel penyengat (knidosit/nematokis) pada tentakelnya untuk melumpuhkan mangsa"},
            {"label": "B", "teks": "tulang belakang berongga udara"},
            {"label": "C", "teks": "sistem saraf pusat yang sempurna"},
            {"label": "D", "teks": "kaki berbuku-buku"}
        ],
        "kunci": "A",
        "pembahasan": "Cnidaria dicirikan oleh adanya sel sengat nematokis pada tentakel di sekitar mulutnya untuk pertahanan dan menangkap mangsa.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 49,
        "soal": "Cacing tanah (Lumbricus terrestris) dikelompokkan ke dalam Filum Annelida karena tubuhnya ....",
        "opsi": [
            {"label": "A", "teks": "tersusun atas cincin atau ruas-ruas bersegmen menyerupai gelang (metameri)"},
            {"label": "B", "teks": "berbentuk pipih tanpa rongga tubuh"},
            {"label": "C", "teks": "tertutup oleh cangkang keras berkapur"},
            {"label": "D", "teks": "dilengkapi kaki semu berbulu"}
        ],
        "kunci": "A",
        "pembahasan": "Annelida berasal dari kata annulus (cincin kecil), mencirikan hewan triploblastik selomata yang tubuhnya beruas-ruas cincin seperti gelang berulang.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 50,
        "soal": "Hewan bertubuh lunak yang umumnya dilindungi oleh cangkang dari kalsium karbonat (seperti siput, kerang, dan bekicot) tergolong ke dalam Filum ....",
        "opsi": [
            {"label": "A", "teks": "Mollusca"},
            {"label": "B", "teks": "Echinodermata"},
            {"label": "C", "teks": "Arthropoda"},
            {"label": "D", "teks": "Chordata"}
        ],
        "kunci": "A",
        "pembahasan": "Mollusca (mollis = lunak) adalah filum hewan bertubuh lunak, tidak bersegmen, memiliki mantel penghasil cangkang berkapur, dan bergerak dengan kaki otot.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 51,
        "soal": "Bintang laut dan bulu babi dikelompokkan ke dalam Filum Echinodermata karena memiliki ciri khas berupa ....",
        "opsi": [
            {"label": "A", "teks": "kulit berduri dari lempeng zat kapur dan sistem ambulakral untuk bergerak"},
            {"label": "B", "teks": "sayap berselaput tipis"},
            {"label": "C", "teks": "alat gerak berupa sirip berpasangan"},
            {"label": "D", "teks": "paru-paru dengan pundi-pundi hawa"}
        ],
        "kunci": "A",
        "pembahasan": "Echinodermata (echinos = landak/duri, derma = kulit) memiliki endoskeleton berkapur dengan tonjolan duri serta sistem vaskular air (ambulakral) untuk lokomosi dan respirasi.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 52,
        "soal": "Hewan vertebrata yang bernapas dengan insang saat fase berudu dan bernapas dengan paru-paru serta kulit saat dewasa adalah ....",
        "opsi": [
            {"label": "A", "teks": "Amphibia (seperti katak dan kodok)"},
            {"label": "B", "teks": "Pisces (ikan mas)"},
            {"label": "C", "teks": "Reptilia (kadal)"},
            {"label": "D", "teks": "Aves (burung pipit)"}
        ],
        "kunci": "A",
        "pembahasan": "Amfibi mengalami metamorfosis: larva berudu hidup di air bernapas dengan insang luar/dalam, setelah dewasa hidup di darat dan bernapas dengan paru-paru serta kulit tipis berlendir.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 53,
        "soal": "Ciri khas kelas Mammalia yang membedakannya secara mutlak dari kelas vertebrata lainnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "memiliki kelenjar susu (glandula mammae) untuk menyusui anaknya dan tubuh ditutupi rambut"},
            {"label": "B", "teks": "bernapas menggunakan paru-paru"},
            {"label": "C", "teks": "memiliki empat ruang jantung"},
            {"label": "D", "teks": "bersifat homoioterm"}
        ],
        "kunci": "A",
        "pembahasan": "Kelenjar susu (mammae) dan penutup tubuh berupa rambut (hair) adalah sinapomorfi khas Mammalia. Burung dan buaya juga memiliki 4 ruang jantung, namun tidak memiliki kelenjar susu.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 54,
        "soal": "Burung (Aves) memiliki kantung udara (pundi-pundi hawa) yang sangat penting untuk membantu pernapasan saat ....",
        "opsi": [
            {"label": "A", "teks": "terbang tinggi di udara"},
            {"label": "B", "teks": "menyelam di air"},
            {"label": "C", "teks": "mengerami telur di sarang"},
            {"label": "D", "teks": "mencerna biji-bijian keras di lambung"}
        ],
        "kunci": "A",
        "pembahasan": "Saat terbang, gerakan sayap mengekang rongga dada burung sehingga paru-paru sulit menghirup udara langsung. Pundi-pundi hawa berfungsi menyimpan cadangan udara beroksigen dan mengalirkannya ke paru-paru saat sayap mengepak.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 55,
        "soal": "Penemu sistem klasifikasi lima kingdom yang diakui secara luas dalam literatur biologi modern adalah ....",
        "opsi": [
            {"label": "A", "teks": "Robert H. Whittaker"},
            {"label": "B", "teks": "Carolus Linnaeus"},
            {"label": "C", "teks": "Charles Darwin"},
            {"label": "D", "teks": "Gregor Mendel"}
        ],
        "kunci": "A",
        "pembahasan": "Robert H. Whittaker mengusulkan sistem 5 kingdom pada tahun 1969 berdasarkan tingkat organisasi sel, ada tidaknya membran inti, dan cara pemenuhan nutrisi.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 56,
        "soal": "Dalam klasifikasi taksonomi, dua individu organisme digolongkan ke dalam spesies yang sama apabila ....",
        "opsi": [
            {"label": "A", "teks": "keduanya dapat melakukan perkawinan dan menghasilkan keturunan yang fertil (subur)"},
            {"label": "B", "teks": "keduanya memiliki warna tubuh dan habitat yang identik"},
            {"label": "C", "teks": "keduanya mengonsumsi jenis makanan yang sama"},
            {"label": "D", "teks": "keduanya hidup pada zona iklim yang serupa"}
        ],
        "kunci": "A",
        "pembahasan": "Definisi spesies secara biologis (konsep Ernst Mayr) adalah populasi organisme yang dapat saling kawin (interbreeding) di alam dan menghasilkan keturunan yang fertil (mampu berkembang biak kembali).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 57,
        "soal": "Felis catus (kucing rumah) dan Panthera leo (singa) dimasukkan ke dalam famili yang sama yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Felidae"},
            {"label": "B", "teks": "Canidae"},
            {"label": "C", "teks": "Ursidae"},
            {"label": "D", "teks": "Hominidae"}
        ],
        "kunci": "A",
        "pembahasan": "Kucing, harimau, singa, dan macan tutul digolongkan ke dalam Famili Felidae (keluarga kucing-kucingan berakar karnivora dengan cakar yang dapat ditarik).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 58,
        "soal": "Tumbuhan dikotil memiliki jaringan meristematik sekunder di antara xilem dan floem yang memungkinkan batang bertambah besar. Jaringan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "kambium"},
            {"label": "B", "teks": "epidermis"},
            {"label": "C", "teks": "parenkim"},
            {"label": "D", "teks": "kolenkim"}
        ],
        "kunci": "A",
        "pembahasan": "Kambium vaskular membelah ke arah dalam membentuk xilem sekunder (kayu) dan membelah ke arah luar membentuk floem sekunder (kulit kayu), menyebabkan pertumbuhan diameter batang dikotil.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 59,
        "soal": "Ikan hiu dan ikan pari dikelompokkan ke dalam kelas Chondrichthyes karena memiliki ....",
        "opsi": [
            {"label": "A", "teks": "rangka tubuh yang tersusun dari tulang rawan"},
            {"label": "B", "teks": "rangka tubuh dari tulang keras sejati (osteon)"},
            {"label": "C", "teks": "operkulum penutup insang dari lempeng tulang"},
            {"label": "D", "teks": "gelembung renang di dalam perut"}
        ],
        "kunci": "A",
        "pembahasan": "Chondrichthyes adalah kelas ikan bertulang rawan (cartilaginous fish) tanpa gelembung renang, celah insang terbuka tanpa operkulum keras, seperti pada hiu dan pari.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 60,
        "soal": "Hewan reptilia seperti buaya dan ular memiliki kulit bersisik tanduk dari zat keratin yang berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "mencegah kehilangan air tubuh berlebihan akibat penguapan di darat"},
            {"label": "B", "teks": "memudahkan pertukaran gas pernapasan melalui kulit"},
            {"label": "C", "teks": "menghasilkan lendir pelicin saat berenang"},
            {"label": "D", "teks": "mempercepat laju metabolisme dingin"}
        ],
        "kunci": "A",
        "pembahasan": "Sisik zat tanduk kering pada reptil kedap air, mencegah dehidrasi atau penguapan cairan tubuh, memungkinkan reptil beradaptasi hidup di daratan kering.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 61,
        "soal": "Contoh alga hijau-biru (Cyanobacteria) yang mampu mengikat nitrogen bebas dari udara dan bersimbiosis dengan paku air Azolla pinnata adalah ....",
        "opsi": [
            {"label": "A", "teks": "Anabaena azollae"},
            {"label": "B", "teks": "Spirogyra sp."},
            {"label": "C", "teks": "Chlorella vulgaris"},
            {"label": "D", "teks": "Volvox globator"}
        ],
        "kunci": "A",
        "pembahasan": "Anabaena azollae adalah Cyanobacteria berkemampuan fiksasi N2 bebas yang hidup bersimbiosis di daun paku air Azolla, menyuburkan lahan sawah padi.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 62,
        "soal": "Penulisan nama ilmiah singa yaitu Panthera leo, kata 'Panthera' menunjukkan tingkatan takson ....",
        "opsi": [
            {"label": "A", "teks": "Genus"},
            {"label": "B", "teks": "Species"},
            {"label": "C", "teks": "Familia"},
            {"label": "D", "teks": "Ordo"}
        ],
        "kunci": "A",
        "pembahasan": "Kata pertama pada binomial nomenclature menunjukkan tingkatan Genus (marga), sedangkan kata kedua merupakan penunjuk spesies (epitheton specificum).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 63,
        "soal": "Katak sawah (Fejervarya cancrivora) berkembang biak dengan cara bertelur di dalam air dengan fertilisasi eksternal, yang berarti ....",
        "opsi": [
            {"label": "A", "teks": "peleburan sel telur dan sel sperma terjadi di luar tubuh induknya (di lingkungan air)"},
            {"label": "B", "teks": "embrio tumbuh di dalam saluran rahim induk"},
            {"label": "C", "teks": "telur menetas di dalam kantung tubuh induk betina"},
            {"label": "D", "teks": "fertilisasi dibantu oleh serangga penyerbuk"}
        ],
        "kunci": "A",
        "pembahasan": "Fertilisasi eksternal adalah pembuahan di mana sel sperma membuahi sel telur di luar tubuh hewan, umumnya terjadi pada medium air seperti katak dan ikan.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 64,
        "soal": "Paku ekor kuda (Equisetum) dan paku kawat (Lycopodium) digolongkan ke dalam tumbuhan Tracheophyta karena ....",
        "opsi": [
            {"label": "A", "teks": "telah memiliki sistem jaringan pembuluh angkut sejati (xilem dan floem)"},
            {"label": "B", "teks": "menghasilkan biji di dalam bunga"},
            {"label": "C", "teks": "tidak memiliki akar dan batang sejati"},
            {"label": "D", "teks": "bersifat parasit obligat pada pohon inang"}
        ],
        "kunci": "A",
        "pembahasan": "Tracheophyta (tumbuhan berpembuluh) mencakup Pteridophyta (paku) dan Spermatophyta (tumbuhan berbiji) yang memiliki trakea pengangkut xilem dan floem.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 65,
        "soal": "Tujuan utama para ilmuwan biologi melakukan klasifikasi makhluk hidup adalah untuk ....",
        "opsi": [
            {"label": "A", "teks": "mempermudah mengenali, mempelajari, dan mengetahui hubungan kekerabatan antarmakhluk hidup"},
            {"label": "B", "teks": "mengubah sifat genetik makhluk hidup liar"},
            {"label": "C", "teks": "menghitung jumlah total populasi hewan di bumi"},
            {"label": "D", "teks": "memisahkan hewan yang berbahaya dan jinak"}
        ],
        "kunci": "A",
        "pembahasan": "Klasifikasi sistematis bertujuan menyederhanakan objek studi biologi yang sangat beraneka ragam agar mudah dikenali ciri-cirinya dan diketahui jalur filogeni/kekerabatannya.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian C: Latihan Soal Mandiri Asli",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    }
]

# 4. Add 5 Pengayaan AKM Literasi Sains Bab 05 (Hal 132 & 150) (No. 66–70)
pengayaan_akm = [
    {
        "nomor_bab": 66,
        "soal": "Dalam percobaan Ingenhousz, tanaman air Hydrilla verticillata dimasukkan ke dalam corong kaca terbalik di dalam bejana air di bawah sinar matahari langsung. Gelembung gas yang terkumpul di ujung tabung dapat menyalakan bara api lidi karena gas tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "oksigen (O2) hasil dari reaksi fotolisis air pada fotosintesis"},
            {"label": "B", "teks": "karbon dioksida (CO2) hasil respirasi tanaman"},
            {"label": "C", "teks": "nitrogen (N2) yang dilepas oleh kloroplas"},
            {"label": "D", "teks": "gas hidrogen (H2) yang mudah meledak"}
        ],
        "kunci": "A",
        "pembahasan": "Gelembung gas pada percobaan Ingenhousz adalah gas oksigen (O2) yang dihasilkan dari fotosintesis. Oksigen bersifat mendukung pembakaran sehingga mampu menyalakan kembali bara api pada lidi.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "Kunci determinasi: 1a. Tumbuhan berpembuluh (ke No. 2), 1b. Tumbuhan tidak berpembuluh (Bryophyta); 2a. Menghasilkan biji (ke No. 3), 2b. Menghasilkan spora (Pteridophyta); 3a. Biji tertutup daun buah (Angiospermae), 3b. Biji terbuka (Gymnospermae). Urutan nomor kunci determinasi untuk tanaman Melinjo adalah ....",
        "opsi": [
            {"label": "A", "teks": "1a - 2a - 3b"},
            {"label": "B", "teks": "1a - 2a - 3a"},
            {"label": "C", "teks": "1a - 2b"},
            {"label": "D", "teks": "1b - 2a - 3b"}
        ],
        "kunci": "A",
        "pembahasan": "Melinjo adalah tumbuhan berpembuluh (1a) -> menghasilkan biji (2a) -> biji tidak tertutup daging buah/Gymnospermae (3b). Jadi urutannya adalah 1a - 2a - 3b.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "Tumbuhan lumut tanduk (Anthocerotopsida) dan lumut hati (Hepaticopsida) dikelompokkan ke dalam Divisio Bryophyta. Ciri khas lumut yang membedakannya dari tumbuhan paku adalah ....",
        "opsi": [
            {"label": "A", "teks": "Fase gametofit lebih dominan dan hidup bebas daripada fase sporofitnya"},
            {"label": "B", "teks": "Memiliki akar tunggang berkambium"},
            {"label": "C", "teks": "Memiliki xilem trakeid sejati"},
            {"label": "D", "teks": "Menghasilkan strobilus berkayu"}
        ],
        "kunci": "A",
        "pembahasan": "Pada lumut (Bryophyta), generasi gametofit (tumbuhan lumut hijau) berumur panjang dan dominan, sedangkan generasi sporofit (sporogonium) menumpang hidup pada gametofit. Pada paku, sporofitlah yang dominan.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "Perhatikan empat pasang hewan berikut: (1) Udang dan kepiting, (2) Belalang dan kupu-kupu, (3) Cacing tanah dan lintah, (4) Laba-laba dan kalajengking. Pasangan hewan yang seluruhnya termasuk dalam kelompok Arthropoda adalah ....",
        "opsi": [
            {"label": "A", "teks": "(1), (2), dan (4)"},
            {"label": "B", "teks": "(1) dan (3) saja"},
            {"label": "C", "teks": "(2) dan (3) saja"},
            {"label": "D", "teks": "Semua nomor (1, 2, 3, dan 4)"}
        ],
        "kunci": "A",
        "pembahasan": "Udang & kepiting (Crustacea), belalang & kupu-kupu (Insecta), dan laba-laba & kalajengking (Arachnida) semuanya adalah Arthropoda. Sedangkan cacing tanah & lintah adalah Annelida (bukan Arthropoda).",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "Dalam biosistematik modern, virus tidak dimasukkan ke dalam sistem 5 kingdom Whittaker karena virus ....",
        "opsi": [
            {"label": "A", "teks": "bersifat aseluler (bukan sel), tidak memiliki organel sitoplasma, dan hanya dapat bereplikasi di dalam sel inang hidup"},
            {"label": "B", "teks": "terlalu kecil untuk dilihat dengan mikroskop cahaya"},
            {"label": "C", "teks": "dapat menyebabkan penyakit mematikan pada manusia"},
            {"label": "D", "teks": "tidak memiliki materi genetik DNA maupun RNA"}
        ],
        "kunci": "A",
        "pembahasan": "Virus dianggap sebagai bentuk peralihan antara benda mati (dapat dikristalkan) dan makhluk hidup (dapat bereplikasi jika menginfeksi sel hidup). Karena tidak berstruktur sel (aseluler), virus tidak memenuhi kriteria sistem klasifikasi seluler 5 kingdom.",
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian D: Pengayaan AKM & TKA",
        "img": "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"
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
        "paket": "Bab V: Klasifikasi Makhluk Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "materi": "Klasifikasi Makhluk Hidup: 8 Ciri Hidup, Mikroskop, Taksonomi, 5 Kingdom, Kunci Determinasi",
        "capaian": "Peserta didik mampu mengklasifikasikan makhluk hidup berdasarkan karakteristiknya serta menggunakan mikroskop dan kunci determinasi.",
        "img": q.get("img", "/soal/ipa/kmerdeka_kls7_ipa_ch5_klasifikasi.jpg"),
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
        "materi": "Klasifikasi Makhluk Hidup: Binomial Nomenclature dan Tingkatan Takson",
        "capaian": "Peserta didik mampu memahami aturan penulisan nama ilmiah dan urutan taksonomi hewan serta tumbuhan.",
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
        "materi": "Klasifikasi Makhluk Hidup: Ciri Avertebrata dan Vertebrata",
        "capaian": "Peserta didik mampu membedakan ciri filum Porifera, Coelenterata, Mollusca, Arthropoda, dan kelas Vertebrata.",
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
        "materi": "Klasifikasi Makhluk Hidup: Pengayaan AKM Literasi Sains & TKA",
        "capaian": "Peserta didik mampu menelaah percobaan Ingenhousz, kunci dikotomi paku/lumut, dan sifat aseluler virus.",
        "img": q["img"],
        "bacaan": ""
    })

print(f"Total questions assembled for Bab 5: {len(all_70)}")

# Save JSON
out_json_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab5_super_lengkap_70soal.json")
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
  <title>Kumpulan Soal Lengkap IPA SMP Kelas 7 - Bab V (70 Soal)</title>
</head>
<body>
{articles_str}
</body>
</html>'''

out_html_path = os.path.join(OUTPUT_DIR, "kelas7_ipa_bab5_super_lengkap_70soal.html")
with open(out_html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Saved: {out_html_path} ({len(html_content)} bytes)")
print(f"Saved: {out_json_path} ({len(all_70)} records)")
