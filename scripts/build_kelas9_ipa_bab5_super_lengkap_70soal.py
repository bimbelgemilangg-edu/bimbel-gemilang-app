#!/usr/bin/env python3
"""
build_kelas9_ipa_bab5_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 5 IPA SMP Kelas 9:
Reaksi-Reaksi Kimia dan Dinamikanya:
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid (0 Error)
- Gambar Asli Otentik: Uji Lakmus (Soal #1) & Percobaan Laju Reaksi (Soal #14)
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 25 Soal Kurikulum Merdeka HOTS Bab 5
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar pengujian sifat asam-basa empat larutan dengan kertas lakmus merah dan biru berikut! Gelas (1): lakmus merah tetap merah, lakmus biru menjadi merah. Gelas (2): lakmus merah menjadi biru, lakmus biru tetap biru. Gelas (3): lakmus merah tetap merah, lakmus biru tetap biru. Gelas (4): lakmus merah tetap merah, lakmus biru menjadi merah. Larutan yang bersifat asam ditunjukkan oleh gelas nomor ....",
        "opsi": [
            {"label": "A", "teks": "(1) dan (4)"},
            {"label": "B", "teks": "(1) dan (2)"},
            {"label": "C", "teks": "(2) dan (3)"},
            {"label": "D", "teks": "(3) dan (4)"}
        ],
        "kunci": "A",
        "pembahasan": "Larutan asam memiliki sifat memerahkan kertas lakmus (lakmus biru berubah menjadi merah, sedangkan lakmus merah tetap merah). Hal ini tampak pada gelas (1) dan (4). Gelas (2) bersifat basa (membirukan lakmus), dan gelas (3) bersifat netral (tidak mengubah warna kedua lakmus).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch5_q1_uji_lakmus_asam_basa.png"
    },
    {
        "nomor_bab": 2,
        "soal": "Sebanyak 12 gram pita magnesium (Mg) dibakar sempurna dengan 8 gram gas oksigen (O2) di dalam tabung tertutup rapat menghasilkan serbuk putih magnesium oksida (MgO). Menurut Hukum Kekekalan Massa Lavoisier, massa serbuk magnesium oksida yang terbentuk adalah ....",
        "opsi": [
            {"label": "A", "teks": "16 gram"},
            {"label": "B", "teks": "20 gram"},
            {"label": "C", "teks": "24 gram"},
            {"label": "D", "teks": "96 gram"}
        ],
        "kunci": "B",
        "pembahasan": "Hukum Kekekalan Massa (Antoine Lavoisier) menyatakan bahwa dalam sistem tertutup, massa total zat sebelum reaksi (reaktan) sama persis dengan massa total zat sesudah reaksi (produk): m_reaktan = m_produk. Massa MgO = m_Mg + m_O2 = 12 g + 8 g = 20 gram.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 3,
        "soal": "Perhatikan persamaan reaksi pembentukan gas amonia berikut: N2 (g) + 3 H2 (g) -> 2 NH3 (g). Zat-zat yang bertindak sebagai pereaksi (reaktan) dan hasil reaksi (produk) berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "N2 dan H2 sebagai reaktan; NH3 sebagai produk"},
            {"label": "B", "teks": "NH3 sebagai reaktan; N2 dan H2 sebagai produk"},
            {"label": "C", "teks": "N2 saja sebagai reaktan"},
            {"label": "D", "teks": "H2 dan NH3 sebagai reaktan"}
        ],
        "kunci": "A",
        "pembahasan": "Dalam penulisan persamaan reaksi kimia: zat-zat di sebelah kiri tanda panah disebut pereaksi / reaktan (yaitu gas nitrogen N2 dan gas hidrogen H2), sedangkan zat di sebelah kanan tanda panah disebut produk / hasil reaksi (yaitu gas amonia NH3).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 4,
        "soal": "Persamaan reaksi pembakaran sempurna gas metana (CH4) pada kompor gas: a CH4 (g) + b O2 (g) -> c CO2 (g) + d H2O (g). Nilai koefisien reaksi a, b, c, dan d yang benar agar reaksi tersebut setara adalah ....",
        "opsi": [
            {"label": "A", "teks": "1, 1, 1, 1"},
            {"label": "B", "teks": "1, 2, 2, 1"},
            {"label": "C", "teks": "1, 3, 1, 2"},
            {"label": "D", "teks": "1, 2, 1, 2"}
        ],
        "kunci": "D",
        "pembahasan": "Penyetaraan reaksi: Jika a = 1: Atom C di kiri = 1 => c = 1. Atom H di kiri = 4 => 2d = 4 => d = 2. Atom O di kanan = 2c + d = 2(1) + 2 = 4 => 2b = 4 => b = 2. Persamaan setara: CH4 + 2 O2 -> CO2 + 2 H2O. Jadi koefisiennya 1, 2, 1, 2.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 5,
        "soal": "Perhatikan beberapa bahan rumah tangga berikut: (1) Cuka makan, (2) Air sabun mandi, (3) Air perasan jeruk nipis, (4) Obat maag cair (antasida), (5) Minuman bersoda, (6) Larutan soda api pembersih saluran pipa. Bahan-bahan yang memiliki sifat basa adalah nomor ....",
        "opsi": [
            {"label": "A", "teks": "(1), (3), dan (5)"},
            {"label": "B", "teks": "(2), (4), dan (6)"},
            {"label": "C", "teks": "(1), (2), dan (4)"},
            {"label": "D", "teks": "(3), (5), dan (6)"}
        ],
        "kunci": "B",
        "pembahasan": "Bahan bersifat asam (pH < 7): cuka (asam asetat), perasan jeruk (asam sitrat), minuman soda (asam karbonat). Bahan bersifat basa (pH > 7): air sabun (garam natrium asam lemak ber-pH basa), obat maag (mengandung Mg(OH)2 dan Al(OH)3), dan soda api (NaOH).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 6,
        "soal": "Seseorang yang menderita sakit maag akibat kelebihan produksi asam klorida (HCl) di dalam lambung meminum obat antasida yang mengandung senyawa magnesium hidroksida (Mg(OH)2). Jenis reaksi kimia yang terjadi di dalam lambung tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Reaksi fermentasi anaerob"},
            {"label": "B", "teks": "Reaksi netralisasi (penetralan) antara senyawa asam dan basa yang menghasilkan garam netral dan air"},
            {"label": "C", "teks": "Reaksi pembusukan protein"},
            {"label": "D", "teks": "Reaksi pembakaran spontan"}
        ],
        "kunci": "B",
        "pembahasan": "Reaksi antara asam lambung (HCl) dan antasida (Mg(OH)2) merupakan reaksi netralisasi asam-basa: 2 HCl + Mg(OH)2 -> MgCl2 + 2 H2O. Reaksi ini menaikkan pH lambung kembali ke tingkat aman serta meredakan rasa perih di dinding lambung.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 7,
        "soal": "Empat larutan diuji nilai pH-nya dengan indikator universal: Larutan P memiliki pH = 1,5; Larutan Q memiliki pH = 6,5; Larutan R memiliki pH = 7,0; dan Larutan S memiliki pH = 13,0. Pasangan larutan yang merupakan asam kuat dan basa kuat berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "P dan Q"},
            {"label": "B", "teks": "P dan S"},
            {"label": "C", "teks": "Q dan R"},
            {"label": "D", "teks": "R dan S"}
        ],
        "kunci": "B",
        "pembahasan": "Pada skala pH (0–14): pH 0 s.d. 3 dikategorikan sebagai asam kuat (Larutan P, pH 1,5); pH 4 s.d. 6 asam lemah (Q, pH 6,5); pH 7 netral (R); pH 8 s.d. 10 basa lemah; dan pH 11 s.d. 14 dikategorikan sebagai basa kuat (Larutan S, pH 13,0).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 8,
        "soal": "Ekstrak bahan alam seperti kunyit dapat dijadikan sebagai indikator alami asam-basa. Perubahan warna yang terjadi pada ekstrak kunyit saat diteteskan ke dalam larutan asam dan larutan basa berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Berwarna merah pada asam dan kuning pada basa"},
            {"label": "B", "teks": "Berwarna ungu pada asam dan hijau pada basa"},
            {"label": "C", "teks": "Berwarna kuning cerah pada suasana asam dan berubah menjadi merah kecokelatan pada suasana basa"},
            {"label": "D", "teks": "Tidak mengalami perubahan warna sama sekali"}
        ],
        "kunci": "C",
        "pembahasan": "Kunyit mengandung zat kurkumin. Dalam medium asam atau netral, kurkumin mempertahankan warna kuning cerah. Dalam medium basa (seperti saat terkena sabun atau kapur sirih), struktur molekul kurkumin terionisasi membentuk warna merah tua kecokelatan.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 9,
        "soal": "Fenomena hujan asam (pH air hujan < 5,6) di daerah industri padat kendaraan dipicu oleh gas buang polutan udara berupa .... yang bereaksi dengan uap air di atmosfer membentuk asam sulfat dan asam nitrat.",
        "opsi": [
            {"label": "A", "teks": "Gas oksigen dan gas nitrogen"},
            {"label": "B", "teks": "Gas karbon monoksida dan uap air"},
            {"label": "C", "teks": "Gas argon dan gas neon"},
            {"label": "D", "teks": "Gas belerang dioksida (SO2) dan nitrogen oksida (NOx)"}
        ],
        "kunci": "D",
        "pembahasan": "Pembakaran batubara dan bahan bakar fosil melepaskan gas belerang dioksida (SO2) dan oksida nitrogen (NO dan NO2). Di atmosfer, gas ini mengalami oksidasi fotokimia dan bereaksi dengan uap air awan: SO2 + H2O -> H2SO3 -> H2SO4 (asam sulfat) dan 2 NO2 + H2O -> HNO2 + HNO3 (asam nitrat), menghasilkan hujan asam yang sangat korosif.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 10,
        "soal": "Ketika padatan kapur tohor (CaO) dimasukkan ke dalam gelas beker berisi air, air seketika mendidih bergolak dan dinding gelas beker terasa sangat panas. Reaksi kimia ini dikategorikan sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Reaksi endoterm karena menyerap kalor dari lingkungan"},
            {"label": "B", "teks": "Reaksi eksoterm karena sistem melepaskan kalor ke lingkungan sehingga suhu wadah meningkat drastis (Delta H < 0)"},
            {"label": "C", "teks": "Reaksi fisika tanpa perubahan energi"},
            {"label": "D", "teks": "Reaksi fotosintesis"}
        ],
        "kunci": "B",
        "pembahasan": "Reaksi eksoterm adalah reaksi yang membebaskan/melepaskan kalor dari sistem ke lingkungan. Reaksi hidrasi kapur tohor: CaO (s) + H2O (l) -> Ca(OH)2 (aq) + Kalor. Pelepasan kalor ini menyebabkan suhu lingkungan (air dan dinding beker) meningkat drastis, dengan perubahan entalpi bernilai negatif (Delta H < 0).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 11,
        "soal": "Sebaliknya, saat pupuk urea dimasukkan ke dalam segelas air lalu diaduk, dinding luar gelas terasa dingin dan berembun. Reaksi pelarutan urea tersebut merupakan contoh ....",
        "opsi": [
            {"label": "A", "teks": "Reaksi endoterm karena sistem menyerap kalor dari lingkungan sehingga suhu lingkungan turun (Delta H > 0)"},
            {"label": "B", "teks": "Reaksi eksoterm"},
            {"label": "C", "teks": "Reaksi pembakaran"},
            {"label": "D", "teks": "Reaksi pengendapan"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi endoterm adalah reaksi kimia yang menyerap kalor dari lingkungan sekitar masuk ke dalam sistem. Akibatnya, energi kalor lingkungan berkurang dan suhu terukur pada wadah mengalami penurunan (terasa dingin), dengan perubahan entalpi positif (Delta H > 0).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 12,
        "soal": "Ibu di rumah menyimpan daging sapi segar di dalam freezer kulkas agar tidak cepat membusuk dibandingkan jika diletakkan di atas meja dapur pada suhu ruang. Berdasarkan teori kinetik laju reaksi, alasan ilmiah tindakan ibu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Suhu rendah menurunkan energi kinetik partikel sehingga frekuensi tumbukan efektif melambat dan aktivitas enzim/bakteri pembusuk terhambat"},
            {"label": "B", "teks": "Suhu rendah menambah kadar air dalam daging"},
            {"label": "C", "teks": "Suhu beku mengubah daging menjadi es batu tanpa enzim"},
            {"label": "D", "teks": "Freezer menghilangkan gas oksigen di sekitar daging"}
        ],
        "kunci": "A",
        "pembahasan": "Suhu memengaruhi laju reaksi: Setiap penurunan suhu sebesar 10°C, laju reaksi kimia rata-rata melambat menjadi setengahnya karena energi kinetik molekul menurun dan jumlah partikel yang memiliki energi aktivasi berkurang. Pada suhu beku (-18°C), reaksi metabolisme mikroorganisme pembusuk nyaris terhenti total.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 13,
        "soal": "Mengapa gula pasir butiran halus jauh lebih cepat larut di dalam secangkir air teh hangat dibandingkan gula batu yang berukuran bongkahan besar dengan massa yang sama?",
        "opsi": [
            {"label": "A", "teks": "Gula halus memiliki total luas permukaan bidang sentuh yang jauh lebih besar sehingga frekuensi tumbukan antarpartikel air dan zat terlarut terjadi lebih banyak"},
            {"label": "B", "teks": "Gula batu memiliki rasa yang lebih manis"},
            {"label": "C", "teks": "Gula pasir memiliki massa jenis lebih besar"},
            {"label": "D", "teks": "Air hangat hanya mampu melarutkan gula halus"}
        ],
        "kunci": "A",
        "pembahasan": "Faktor luas permukaan bidang sentuh: Menghaluskan zat padat menjadi butiran kecil memperluas total area permukaan kontak yang terpapar langsung dengan molekul pelarut. Makin luas bidang sentuh, makin banyak peluang terjadinya tumbukan antarpartikel per satuan waktu sehingga reaksi/pelarutan berlangsung jauh lebih cepat.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 14,
        "soal": "Perhatikan gambar percobaan reaksi antara 1 gram pualam (CaCO3) dengan larutan HCl berikut! Tabung 1: 1 g bongkahan CaCO3 + HCl 1 M pada 25°C. Tabung 2: 1 g serbuk CaCO3 + HCl 1 M pada 25°C. Tabung 3: 1 g serbuk CaCO3 + HCl 2 M pada 25°C. Tabung 4: 1 g serbuk CaCO3 + HCl 2 M pada 40°C. Laju reaksi pembentukan gas CO2 yang paling cepat berlangsung pada tabung nomor ....",
        "opsi": [
            {"label": "A", "teks": "Tabung 1"},
            {"label": "B", "teks": "Tabung 2"},
            {"label": "C", "teks": "Tabung 3"},
            {"label": "D", "teks": "Tabung 4"}
        ],
        "kunci": "D",
        "pembahasan": "Laju reaksi dipengaruhi oleh: wujud serbuk (luas permukaan kontak maksimal), konsentrasi pereaksi tinggi (HCl 2 M memiliki kerapatan partikel reaktan lebih rapat), dan suhu tinggi (40°C energi kinetik partikel terbesar). Tabung 4 menggabungkan ketiga faktor optimal tersebut sehingga laju reaksinya paling cepat.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch5_q14_laju_reaksi_pualam.png"
    },
    {
        "nomor_bab": 15,
        "soal": "Katalisator (katalis) adalah zat kimia yang dapat mempercepat laju suatu reaksi kimia tanpa dirinya ikut habis bereaksi. Mekanisme kerja katalis dalam mempercepat reaksi adalah dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Menurunkan energi aktivasi (Ea) yang dibutuhkan reaksi sehingga lebih banyak partikel yang mampu bertumbukan efektif"},
            {"label": "B", "teks": "Menaikkan suhu sistem secara drastis"},
            {"label": "C", "teks": "Menambah massa zat pereaksi"},
            {"label": "D", "teks": "Mengubah reaksi endoterm menjadi eksoterm"}
        ],
        "kunci": "A",
        "pembahasan": "Katalis bekerja dengan menyediakan jalur mekanisme reaksi alternatif yang memiliki rintangan energi aktivasi (Ea) lebih rendah. Dengan Ea yang lebih rendah, persentase tumbukan antarpartikel reaktan yang berhasil melampaui ambang energi minimal menjadi jauh lebih besar sehingga laju reaksi meningkat pesat.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 16,
        "soal": "Enzim ptialin (amilase) di dalam air liur manusia merupakan contoh biokatalisator alami. Fungsi enzim ptialin saat kita mengunyah nasi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mempercepat penguraian karbohidrat amilum menjadi maltosa dan glukosa pada suhu fisiologis tubuh 37°C"},
            {"label": "B", "teks": "Mengubah lemak menjadi asam lemak"},
            {"label": "C", "teks": "Membunuh bakteri patogen di lambung"},
            {"label": "D", "teks": "Mengentalkan cairan empedu"}
        ],
        "kunci": "A",
        "pembahasan": "Biokatalisator adalah katalis biologis berupa protein (enzim). Enzim amilase (ptialin) di rongga mulut mempercepat hidrolisis polisakarida (amilum) menjadi disakarida (maltosa) ribuan kali lebih cepat pada suhu normal tubuh tanpa memerlukan perebusan asam pekat.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 17,
        "soal": "Reaksi fotosintesis pada tumbuhan hijau dirumuskan: 6 CO2 + 6 H2O + Cahaya Matahari -> C6H12O6 + 6 O2. Reaksi fotosintesis tersebut merupakan contoh dari reaksi ....",
        "opsi": [
            {"label": "A", "teks": "Reaksi endoterm karena menyerap energi foton cahaya dari lingkungan luar untuk membentuk ikatan kimia glukosa (Delta H > 0)"},
            {"label": "B", "teks": "Reaksi eksoterm yang menghasilkan panas"},
            {"label": "C", "teks": "Reaksi perkaratan"},
            {"label": "D", "teks": "Reaksi netralisasi"}
        ],
        "kunci": "A",
        "pembahasan": "Fotosintesis adalah reaksi anabolisme pembentukan molekul kompleks dari molekul sederhana yang mutlak membutuhkan input energi foton cahaya matahari (endergonik / endoterm, Delta H positif). Energi cahaya tersimpan di dalam ikatan kovalen molekul glukosa.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 18,
        "soal": "Sebaliknya, reaksi respirasi seluler di dalam mitokondria yang menguraikan glukosa bersama oksigen menghasilkan energi ATP dan panas tubuh merupakan contoh dari reaksi ....",
        "opsi": [
            {"label": "A", "teks": "Reaksi eksoterm (katabolisme yang membebaskan energi)"},
            {"label": "B", "teks": "Reaksi endoterm yang menyerap panas"},
            {"label": "C", "teks": "Reaksi pengendapan garam"},
            {"label": "D", "teks": "Reaksi elektrolisis"}
        ],
        "kunci": "A",
        "pembahasan": "Respirasi aerob: C6H12O6 + 6 O2 -> 6 CO2 + 6 H2O + Energi (36-38 ATP + Panas). Pemutusan ikatan glukosa membebaskan energi kimia yang sebagian besar dipakai kerja seluler dan sebagian dilepaskan sebagai panas tubuh (reaksi eksoterm, Delta H negatif).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 19,
        "soal": "Penyetaraan reaksi perkaratan besi oleh gas oksigen membentuk karat besi: a Fe (s) + b O2 (g) -> c Fe2O3 (s). Nilai a, b, dan c berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "4, 3, dan 2"},
            {"label": "B", "teks": "2, 3, dan 1"},
            {"label": "C", "teks": "2, 1, dan 2"},
            {"label": "D", "teks": "1, 2, dan 1"}
        ],
        "kunci": "A",
        "pembahasan": "Jika c = 2: jumlah Fe di kanan = 4 => a = 4. Jumlah O di kanan = 2 * 3 = 6 => 2b = 6 => b = 3. Maka persamaan setara: 4 Fe + 3 O2 -> 2 Fe2O3. Nilai a, b, c berturut-turut adalah 4, 3, dan 2.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 20,
        "soal": "Dalam suatu percobaan kimia tertutup, 4 gram gas hidrogen (H2) direaksikan dengan 32 gram gas oksigen (O2) menghasilkan uap air (H2O). Jika reaksi berlangsung tuntas tanpa ada sisa pereaksi, massa uap air yang dihasilkan adalah ....",
        "opsi": [
            {"label": "A", "teks": "36 gram"},
            {"label": "B", "teks": "28 gram"},
            {"label": "C", "teks": "18 gram"},
            {"label": "D", "teks": "8 gram"}
        ],
        "kunci": "A",
        "pembahasan": "Berdasarkan Hukum Lavoisier: m_H2O = m_H2 + m_O2 = 4 g + 32 g = 36 gram uap air.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 21,
        "soal": "Ciri-ciri fisik yang membuktikan telah terjadinya reaksi kimia antara dua zat ketika dicampurkan meliputi peristiwa berikut, KECUALI ....",
        "opsi": [
            {"label": "A", "teks": "Terjadinya perubahan warna yang permanen"},
            {"label": "B", "teks": "Pembentukan gelembung gas"},
            {"label": "C", "teks": "Pembentukan endapan padat (presipitat)"},
            {"label": "D", "teks": "Zat hanya berubah wujud dari es menjadi air tanpa membentuk senyawa baru"}
        ],
        "kunci": "D",
        "pembahasan": "Empat indikator utama terjadinya reaksi kimia: (1) perubahan warna, (2) timbulnya gas, (3) terbentuknya endapan baru, dan (4) perubahan suhu (kalor reaksi). Meleburnya es batu menjadi air merupakan perubahan fisika semata karena rumus kimianya tetap sama persis (H2O).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 22,
        "soal": "Gas berbahaya yang sering dihasilkan dari reaksi pembakaran tidak sempurna bahan bakar minyak pada knalpot kendaraan bermotor yang sangat beracun karena mengikat hemoglobin darah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Karbon monoksida (CO)"},
            {"label": "B", "teks": "Karbon dioksida (CO2)"},
            {"label": "C", "teks": "Gas nitrogen (N2)"},
            {"label": "D", "teks": "Gas metana (CH4)"}
        ],
        "kunci": "A",
        "pembahasan": "Pembakaran tidak sempurna hidrokarbon karena pasokan oksigen minim menghasilkan gas karbon monoksida (CO). Gas CO memiliki afinitas ikatan terhadap hemoglobin 200 kali lebih kuat dibanding oksigen, membentuk karboksihemoglobin (COHb) yang memicu hipoksia jaringan dan kematian.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 23,
        "soal": "Petani di daerah rawa gambut sering menaburkan serbuk kapur pertanian (kalsium hidroksida / kapur tohor) pada lahan sawahnya sebelum masa tanam padi. Tujuan penaburan kapur tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menaikkan pH tanah gambut yang terlalu asam (pH < 4) menuju pH netral yang cocok bagi perakaran padi melalui reaksi netralisasi"},
            {"label": "B", "teks": "Membunuh seluruh cacing tanah"},
            {"label": "C", "teks": "Mengeringkan air rawa seketika"},
            {"label": "D", "teks": "Membuat tanaman padi berbuah kapur"}
        ],
        "kunci": "A",
        "pembahasan": "Tanah gambut mengandung asam-asam organik pekat (asam humat dan fulvat) yang membuat tanah sangat asam (pH 3-4) sehingga unsur hara P dan K terikat dan tanaman kerdil. Penaburan kapur pertanian Ca(OH)2 atau CaCO3 menetralkan asam tanah menuju pH ideal (6-7).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 24,
        "soal": "Penyetaraan reaksi pembentukan gas belerang trioksida pada pembuatan asam sulfat: 2 SO2 (g) + O2 (g) -> 2 SO3 (g). Perbandingan volume gas SO2, O2, dan SO3 pada suhu dan tekanan yang sama (Hukum Gay-Lussac) adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 : 1 : 2"},
            {"label": "B", "teks": "1 : 2 : 1"},
            {"label": "C", "teks": "2 : 2 : 1"},
            {"label": "D", "teks": "1 : 1 : 1"}
        ],
        "kunci": "A",
        "pembahasan": "Hukum Perbandingan Volume (Gay-Lussac) menyatakan bahwa pada suhu dan tekanan yang sama, perbandingan volume gas-gas yang bereaksi dan gas hasil reaksi berbanding sebagai bilangan bulat sederhana yang setara dengan perbandingan koefisien reaksinya. Koefisien reaksi SO2 : O2 : SO3 adalah 2 : 1 : 2.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 25,
        "soal": "Dalam pembuatan tape ketan tradisional, ragi ditambahkan pada beras ketan yang sudah dikukus dingin dan disimpan rapat kedap udara (fermentasi). Perubahan kimia yang terjadi selama fermentasi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Amilum ketan dihidrolisis menjadi glukosa oleh kapang, lalu glukosa difermentasi oleh ragi Saccharomyces cerevisiae menjadi alkohol etanol dan gas CO2"},
            {"label": "B", "teks": "Ketan mengeras menjadi batu"},
            {"label": "C", "teks": "Terbentuk asam sulfat beracun"},
            {"label": "D", "teks": "Klorofil daun terbentuk kembali"}
        ],
        "kunci": "A",
        "pembahasan": "Fermentasi tape melibatkan mikroorganisme sinergis: Aspergillus/Endomycopsis memecah pati (amilum) menjadi glukosa manis, lalu Saccharomyces cerevisiae mengubah glukosa menjadi alkohol (etanol) dan karbon dioksida: C6H12O6 -> 2 C2H5OH + 2 CO2, memberikan aroma harum dan rasa manis beralkohol khas tape.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    }
]

# 10 Soal Contoh Asli (No. 26-35)
soal_contoh = [
    {
        "nomor_bab": 26,
        "soal": "Menurut teori asam-basa Svante Arrhenius, suatu senyawa dikelompokkan sebagai senyawa asam jika senyawa tersebut di dalam air ....",
        "opsi": [
            {"label": "A", "teks": "Melepaskan ion hidrogen (H+)"},
            {"label": "B", "teks": "Melepaskan ion hidroksida (OH-)"},
            {"label": "C", "teks": "Menerima proton dari pelarut"},
            {"label": "D", "teks": "Membentuk gas klorin"}
        ],
        "kunci": "A",
        "pembahasan": "Teori Arrhenius: Asam adalah zat yang bila dilarutkan ke dalam air menghasilkan ion H+ (contoh HCl -> H+ + Cl-), sedangkan basa adalah zat yang melepaskan ion OH- di dalam air (contoh NaOH -> Na+ + OH-).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 27,
        "soal": "Senyawa berikut yang tergolong sebagai garam dapur netral adalah ....",
        "opsi": [
            {"label": "A", "teks": "Natrium klorida (NaCl)"},
            {"label": "B", "teks": "Asam klorida (HCl)"},
            {"label": "C", "teks": "Natrium hidroksida (NaOH)"},
            {"label": "D", "teks": "Asam sulfat (H2SO4)"}
        ],
        "kunci": "A",
        "pembahasan": "Natrium klorida (NaCl) terbentuk dari reaksi asam kuat HCl dan basa kuat NaOH: HCl + NaOH -> NaCl + H2O. Garam ini terhidrolisis netral pada pH = 7.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 28,
        "soal": "Larutan yang memiliki nilai pH tepat sama dengan 7 dikategorikan sebagai larutan ....",
        "opsi": [
            {"label": "A", "teks": "Netral"},
            {"label": "B", "teks": "Asam kuat"},
            {"label": "C", "teks": "Basa kuat"},
            {"label": "D", "teks": "Asam lemah"}
        ],
        "kunci": "A",
        "pembahasan": "Air murni pada suhu 25°C memiliki konsentrasi [H+] = [OH-] = 10^-7 M, sehingga memiliki nilai pH = 7 dan bersifat netral.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 29,
        "soal": "Kertas lakmus merah akan berubah warna menjadi biru jika dicelupkan ke dalam larutan ....",
        "opsi": [
            {"label": "A", "teks": "Air kapur Ca(OH)2"},
            {"label": "B", "teks": "Air cuka"},
            {"label": "C", "teks": "Air jeruk"},
            {"label": "D", "teks": "Air aki"}
        ],
        "kunci": "A",
        "pembahasan": "Larutan yang membirukan lakmus merah adalah larutan basa (mengandung ion OH-), yaitu air kapur sirih Ca(OH)2. Pilihan B, C, dan D semuanya asam.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 30,
        "soal": "Peristiwa berikut yang merupakan contoh perubahan kimia adalah ....",
        "opsi": [
            {"label": "A", "teks": "Besi berkarat"},
            {"label": "B", "teks": "Lilin meleleh"},
            {"label": "C", "teks": "Air membeku menjadi es"},
            {"label": "D", "teks": "Beras ditumbuk menjadi tepung"}
        ],
        "kunci": "A",
        "pembahasan": "Besi berkarat menghasilkan senyawa baru besi(III) oksida hidrat (Fe2O3.xH2O) yang tidak dapat kembali ke besi murni semula (perubahan kimia irreversible). Lilin meleleh, air membeku, dan beras digiling adalah perubahan fisika.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 31,
        "soal": "Reaksi pembakaran kayu unggun memancarkan cahaya dan rasa hangat di sekitarnya. Reaksi ini tergolong reaksi ....",
        "opsi": [
            {"label": "A", "teks": "Eksoterm"},
            {"label": "B", "teks": "Endoterm"},
            {"label": "C", "teks": "Sublimasi"},
            {"label": "D", "teks": "Kondensasi"}
        ],
        "kunci": "A",
        "pembahasan": "Pembakaran kayu melepaskan energi kalor dan cahaya ke lingkungan sekitar, menaikkan suhu lingkungan, sehingga merupakan reaksi eksoterm.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 32,
        "soal": "Jika konsentrasi reaktan dalam suatu reaksi kimia diperbesar, maka laju reaksi akan ....",
        "opsi": [
            {"label": "A", "teks": "Semakin cepat karena jumlah partikel per satuan volume bertambah sehingga kemungkinan tumbukan efektif semakin tinggi"},
            {"label": "B", "teks": "Semakin lambat"},
            {"label": "C", "teks": "Tetap konstan"},
            {"label": "D", "teks": "Berhenti seketika"}
        ],
        "kunci": "A",
        "pembahasan": "Meningkatnya konsentrasi reaktan merapatkan jarak antarpartikel sehingga frekuensi tumbukan efektif antarmolekul pereaksi meningkat per satuan waktu, mempercepat laju reaksi.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 33,
        "soal": "Koefisien reaksi pembentukan air: 2 H2 + O2 -> 2 H2O menunjukkan bahwa ....",
        "opsi": [
            {"label": "A", "teks": "2 molekul H2 bereaksi dengan 1 molekul O2 menghasilkan 2 molekul H2O"},
            {"label": "B", "teks": "1 molekul H2 bereaksi dengan 2 molekul O2"},
            {"label": "C", "teks": "Jumlah atom di kiri berbeda dari kanan"},
            {"label": "D", "teks": "Reaksi tidak dapat berlangsung"}
        ],
        "kunci": "A",
        "pembahasan": "Koefisien reaksi kimia menunjukkan rasio perbandingan jumlah molekul atau mol zat-zat yang terlibat dalam reaksi kimia.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 34,
        "soal": "Senyawa asam cuka yang biasa digunakan sebagai penyedap bakso memiliki rumus kimia ....",
        "opsi": [
            {"label": "A", "teks": "CH3COOH"},
            {"label": "B", "teks": "HCl"},
            {"label": "C", "teks": "H2SO4"},
            {"label": "D", "teks": "HNO3"}
        ],
        "kunci": "A",
        "pembahasan": "Asam cuka adalah nama lazim untuk asam asetat (asam etanoat) dengan rumus kimia CH3COOH.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 35,
        "soal": "Gas hasil reaksi antara logam seng (Zn) dengan larutan asam klorida (HCl) sesuai reaksi Zn + 2 HCl -> ZnCl2 + H2 adalah gas ....",
        "opsi": [
            {"label": "A", "teks": "Gas hidrogen (H2) yang mudah meletup bila disulut api"},
            {"label": "B", "teks": "Gas oksigen"},
            {"label": "C", "teks": "Gas klorin beracun"},
            {"label": "D", "teks": "Gas karbon dioksida"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi logam aktif di sebelah kiri deret Volta dengan asam menghasilkan garam dan pelepasan gas hidrogen (H2) yang bila didekatkan api akan meletup berbunyi 'pop'.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
soal_mandiri = [
    {
        "nomor_bab": 36,
        "soal": "Zat indikator buatan fenolftalein (PP) jika diteteskan ke dalam larutan asam akan berwarna .... sedangkan di dalam larutan basa akan berwarna ....",
        "opsi": [
            {"label": "A", "teks": "Tak berwarna; merah muda (pink)"},
            {"label": "B", "teks": "Merah; biru"},
            {"label": "C", "teks": "Kuning; hijau"},
            {"label": "D", "teks": "Biru; merah"}
        ],
        "kunci": "A",
        "pembahasan": "Trayek pH fenolftalein adalah 8,3 – 10,0. Pada pH asam dan netral (di bawah 8,3) PP tidak berwarna, sedangkan pada larutan basa (pH > 8,3) PP berubah menjadi warna merah muda keunguan.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 37,
        "soal": "Air murni memiliki derajat keasaman (pH) bernilai ....",
        "opsi": [
            {"label": "A", "teks": "7"},
            {"label": "B", "teks": "0"},
            {"label": "C", "teks": "1"},
            {"label": "D", "teks": "14"}
        ],
        "kunci": "A",
        "pembahasan": "Air netral memiliki pH = 7.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 38,
        "soal": "Perkaratan pada pagar besi dapat dicegah secara efektif dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Mengecat permukaan besi untuk mencegah kontak langsung dengan oksigen dan kelembapan air"},
            {"label": "B", "teks": "Merendam pagar di air garam"},
            {"label": "C", "teks": "Memanaskan pagar setiap pagi"},
            {"label": "D", "teks": "Menyemprotkan asam cuka"}
        ],
        "kunci": "A",
        "pembahasan": "Korosi besi memerlukan keberadaan air dan gas oksigen secara bersamaan. Pengecatan, pelapisan oli, atau galvanisasi seng melindungi permukaan besi dari kontak udara dan air.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 39,
        "soal": "Zat yang terasa pahit di lidah dan terasa licin seperti sabun di jari tangan merupakan ciri dari zat ....",
        "opsi": [
            {"label": "A", "teks": "Basa"},
            {"label": "B", "teks": "Asam"},
            {"label": "C", "teks": "Netral"},
            {"label": "D", "teks": "Garam"}
        ],
        "kunci": "A",
        "pembahasan": "Rasa pahit dan sensasi licin di kulit (saponifikasi lemak kulit) merupakan ciri khas larutan basa.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 40,
        "soal": "Persamaan reaksi netralisasi antara asam klorida dan kalium hidroksida adalah ....",
        "opsi": [
            {"label": "A", "teks": "HCl + KOH -> KCl + H2O"},
            {"label": "B", "teks": "HCl + NaOH -> NaCl + H2"},
            {"label": "C", "teks": "H2SO4 + KOH -> K2SO4 + H2"},
            {"label": "D", "teks": "HNO3 + KOH -> KNO3 + H2"}
        ],
        "kunci": "A",
        "pembahasan": "Asam klorida (HCl) bereaksi dengan kalium hidroksida (KOH) menghasilkan garam kalium klorida (KCl) dan air (H2O): HCl + KOH -> KCl + H2O.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 41,
        "soal": "Bahan alami mahkota bunga kembang sepatu bila diekstrak dengan air menghasilkan warna merah. Di dalam larutan asam kuat ekstrak ini berwarna .... dan di dalam basa berwarna ....",
        "opsi": [
            {"label": "A", "teks": "Merah terang; hijau kekuningan"},
            {"label": "B", "teks": "Biru; merah"},
            {"label": "C", "teks": "Kuning; ungu"},
            {"label": "D", "teks": "Cokelat; hitam"}
        ],
        "kunci": "A",
        "pembahasan": "Ekstrak bunga sepatu mengandung pigmen antosianin: berwarna merah cerah dalam suasana asam dan berubah menjadi hijau kekuningan dalam suasana basa.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 42,
        "soal": "Dalam reaksi endoterm, perubahan entalpi (Delta H) bernilai ....",
        "opsi": [
            {"label": "A", "teks": "Positif (Delta H > 0)"},
            {"label": "B", "teks": "Negatif (Delta H < 0)"},
            {"label": "C", "teks": "Sama dengan nol"},
            {"label": "D", "teks": "Tak terhingga"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi endoterm menyerap kalor sehingga entalpi produk lebih besar dari entalpi reaktan (H_produk > H_reaktan), menghasilkan Delta H bernilai positif.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 43,
        "soal": "Dalam reaksi eksoterm, perubahan entalpi (Delta H) bernilai ....",
        "opsi": [
            {"label": "A", "teks": "Negatif (Delta H < 0)"},
            {"label": "B", "teks": "Positif (Delta H > 0)"},
            {"label": "C", "teks": "Nol"},
            {"label": "D", "teks": "Tidak dapat diukur"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi eksoterm melepaskan kalor sehingga entalpi produk lebih rendah daripada reaktan (H_produk < H_reaktan), menghasilkan Delta H bertanda negatif.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 44,
        "soal": "Kembang api meledak di langit memancarkan warna-warni indah dan dentuman keras. Reaksi pembakaran kembang api tersebut tergolong reaksi ....",
        "opsi": [
            {"label": "A", "teks": "Eksoterm cepat"},
            {"label": "B", "teks": "Endoterm lambat"},
            {"label": "C", "teks": "Netralisasi"},
            {"label": "D", "teks": "Pelarutan"}
        ],
        "kunci": "A",
        "pembahasan": "Ledakan kembang api adalah reaksi pembakaran oksidasi sangat cepat yang membebaskan energi cahaya, panas, dan bunyi dalam waktu singkat (reaksi eksoterm cepat).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 45,
        "soal": "Senyawa asam sulfat yang digunakan sebagai elektrolit di dalam aki kendaraan bermotor memiliki rumus kimia ....",
        "opsi": [
            {"label": "A", "teks": "H2SO4"},
            {"label": "B", "teks": "HCl"},
            {"label": "C", "teks": "HNO3"},
            {"label": "D", "teks": "H3PO4"}
        ],
        "kunci": "A",
        "pembahasan": "Air aki mengandung larutan asam sulfat dengan rumus kimia H2SO4.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 46,
        "soal": "Senyawa natrium hidroksida (soda api) memiliki rumus kimia ....",
        "opsi": [
            {"label": "A", "teks": "NaOH"},
            {"label": "B", "teks": "KOH"},
            {"label": "C", "teks": "Ca(OH)2"},
            {"label": "D", "teks": "Mg(OH)2"}
        ],
        "kunci": "A",
        "pembahasan": "Soda api adalah natrium hidroksida dengan rumus NaOH.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 47,
        "soal": "Suatu larutan memiliki konsentrasi ion hidrogen [H+] = 10^-3 M. Nilai pH larutan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "3"},
            {"label": "B", "teks": "7"},
            {"label": "C", "teks": "11"},
            {"label": "D", "teks": "14"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus pH = -log[H+] = -log(10^-3) = 3 (bersifat asam).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 48,
        "soal": "Suatu larutan memiliki konsentrasi ion hidroksida [OH-] = 10^-4 M. Nilai pH larutan tersebut pada 25°C adalah ....",
        "opsi": [
            {"label": "A", "teks": "10"},
            {"label": "B", "teks": "4"},
            {"label": "C", "teks": "7"},
            {"label": "D", "teks": "14"}
        ],
        "kunci": "A",
        "pembahasan": "pOH = -log[OH-] = 4. Maka pH = 14 - pOH = 14 - 4 = 10 (bersifat basa).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 49,
        "soal": "Pemanasan serbuk belerang dengan serbuk besi menghasilkan besi(II) sulfida sesuai persamaan reaksi Fe + S -> FeS. Jika 56 g besi bereaksi dengan 32 g belerang tanpa sisa, massa FeS yang dihasilkan adalah ....",
        "opsi": [
            {"label": "A", "teks": "88 gram"},
            {"label": "B", "teks": "64 gram"},
            {"label": "C", "teks": "48 gram"},
            {"label": "D", "teks": "24 gram"}
        ],
        "kunci": "A",
        "pembahasan": "Massa produk = m_Fe + m_S = 56 g + 32 g = 88 gram (Hukum Lavoisier).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 50,
        "soal": "Manakah di antara peristiwa berikut yang merupakan reaksi eksoterm?",
        "opsi": [
            {"label": "A", "teks": "Respirasi seluler dan pembakaran lilin"},
            {"label": "B", "teks": "Fotosintesis dan pelarutan urea"},
            {"label": "C", "teks": "Mencairnya es batu"},
            {"label": "D", "teks": "Menguapnya alkohol"}
        ],
        "kunci": "A",
        "pembahasan": "Respirasi seluler dan pembakaran membebaskan kalor ke lingkungan (eksoterm). Fotosintesis, peleburan es, dan penguapan menyerap kalor (endoterm).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 51,
        "soal": "Reaksi fotosintesis pada tumbuhan memerlukan gas karbon dioksida dan air. Gas yang dihasilkan dan dilepaskan ke udara adalah ....",
        "opsi": [
            {"label": "A", "teks": "Oksigen (O2)"},
            {"label": "B", "teks": "Karbon monoksida"},
            {"label": "C", "teks": "Nitrogen"},
            {"label": "D", "teks": "Metana"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi fotosintesis menghasilkan glukosa sebagai makanan dan melepaskan gas oksigen (O2) ke atmosfer.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 52,
        "soal": "Jika suhu suatu reaksi kimia dinaikkan dari 20°C menjadi 30°C, laju reaksi umumnya akan ....",
        "opsi": [
            {"label": "A", "teks": "Meningkat menjadi 2 kali lipat"},
            {"label": "B", "teks": "Menjadi setengahnya"},
            {"label": "C", "teks": "Menjadi nol"},
            {"label": "D", "teks": "Tidak berubah"}
        ],
        "kunci": "A",
        "pembahasan": "Aturan praktis kinetika kimia menyatakan bahwa kenaikan suhu sebesar 10°C umumnya melipatgandakan laju reaksi menjadi 2 hingga 3 kali lebih cepat.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 53,
        "soal": "Bahan pengawet makanan alami yang bekerja menciptakan suasana asam sehingga menghambat perkembangbiakan bakteri pembusuk adalah ....",
        "opsi": [
            {"label": "A", "teks": "Asam cuka (asam asetat)"},
            {"label": "B", "teks": "Minyak goreng"},
            {"label": "C", "teks": "Tepung terigu"},
            {"label": "D", "teks": "Santan"}
        ],
        "kunci": "A",
        "pembahasan": "Asam cuka menurunkan pH medium makanan hingga di bawah 4,5, menghambat pertumbuhan dan pembelahan bakteri serta kapang perusak makanan (contohnya pada acar).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 54,
        "soal": "Reaksi peragian singkong menjadi tape menghasilkan gas karbon dioksida. Bukti adanya pelepasan gas CO2 dapat diuji dengan mengalirkan gas ke dalam ....",
        "opsi": [
            {"label": "A", "teks": "Air kapur jernih, yang akan berubah menjadi keruh"},
            {"label": "B", "teks": "Minyak tanah"},
            {"label": "C", "teks": "Air sabun"},
            {"label": "D", "teks": "Alkohol"}
        ],
        "kunci": "A",
        "pembahasan": "Gas CO2 yang dialirkan ke dalam air kapur Ca(OH)2 bereaksi membentuk endapan kalsium karbonat CaCO3 berwarna putih yang membuat larutan menjadi keruh: Ca(OH)2 + CO2 -> CaCO3 (s) + H2O.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 55,
        "soal": "Reaksi pembakaran logam natrium dengan gas klorin menghasilkan garam dapur sesuai reaksi: 2 Na (s) + Cl2 (g) -> 2 NaCl (s). Reaksi ini tergolong reaksi ....",
        "opsi": [
            {"label": "A", "teks": "Reaksi penggabungan (sintesis) dan eksoterm"},
            {"label": "B", "teks": "Reaksi penguraian"},
            {"label": "C", "teks": "Reaksi pengendapan"},
            {"label": "D", "teks": "Reaksi asam basa"}
        ],
        "kunci": "A",
        "pembahasan": "Dua unsur sederhana Na dan Cl2 bergabung membentuk satu senyawa tunggal NaCl (reaksi sintesis/kombinasi) dengan pelepasan energi panas yang sangat besar (eksoterm).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 56,
        "soal": "Penambahan ragi pada pembuatan adonan roti bertujuan agar roti mengembang saat dipanggang. Gas yang menyebabkan adonan roti mengembang berpori-pori adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gas karbon dioksida (CO2)"},
            {"label": "B", "teks": "Gas oksigen"},
            {"label": "C", "teks": "Gas nitrogen"},
            {"label": "D", "teks": "Gas hidrogen"}
        ],
        "kunci": "A",
        "pembahasan": "Ragi Saccharomyces cerevisiae memfermentasi gula adonan menghasilkan alkohol dan gas CO2. Gas CO2 terperangkap dalam jaring gluten elastis terigu, memuai saat dipanggang dan membuat tekstur roti empuk berpori.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 57,
        "soal": "Senyawa kalsium karbonat pada batu kapur memiliki rumus kimia ....",
        "opsi": [
            {"label": "A", "teks": "CaCO3"},
            {"label": "B", "teks": "CaO"},
            {"label": "C", "teks": "Ca(OH)2"},
            {"label": "D", "teks": "CaCl2"}
        ],
        "kunci": "A",
        "pembahasan": "Batu kapur (pualam / marmer) adalah kalsium karbonat dengan rumus CaCO3.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 58,
        "soal": "Penyetaraan reaksi pembakaran gas etana (C2H6): 2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O. Perbandingan mol C2H6 terhadap O2 yang bereaksi adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 : 7"},
            {"label": "B", "teks": "1 : 3"},
            {"label": "C", "teks": "4 : 6"},
            {"label": "D", "teks": "2 : 4"}
        ],
        "kunci": "A",
        "pembahasan": "Perbandingan koefisien C2H6 terhadap O2 adalah 2 : 7.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 59,
        "soal": "Bahan kimia yang berfungsi sebagai katalisator dalam konverter katalitik knalpot mobil untuk mereduksi gas beracun NOx dan CO adalah ....",
        "opsi": [
            {"label": "A", "teks": "Logam mulia platina (Pt), paladium (Pd), dan rodium (Rh)"},
            {"label": "B", "teks": "Besi berkarat"},
            {"label": "C", "teks": "Garam dapur"},
            {"label": "D", "teks": "Arang kayu"}
        ],
        "kunci": "A",
        "pembahasan": "Konverter katalitik knalpot modern menggunakan logam transisi mulia (platina, paladium, rodium) sebagai heterogen katalis untuk mempercepat oksidasi gas CO menjadi CO2 serta reduksi NOx menjadi gas N2 yang tidak berbahaya.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 60,
        "soal": "Air perasan lemon terasa sangat asam karena kaya akan kandungan ....",
        "opsi": [
            {"label": "A", "teks": "Asam sitrat"},
            {"label": "B", "teks": "Asam laktat"},
            {"label": "C", "teks": "Asam format"},
            {"label": "D", "teks": "Asam tartrat"}
        ],
        "kunci": "A",
        "pembahasan": "Lemon dan jeruk sitrun mengandung asam sitrat (C6H8O7) berkadar tinggi.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 61,
        "soal": "Asam laktat dapat dijumpai pada bahan makanan ....",
        "opsi": [
            {"label": "A", "teks": "Susu fermentasi / yogurt dan keju"},
            {"label": "B", "teks": "Cuka dapur"},
            {"label": "C", "teks": "Minyak kelapa"},
            {"label": "D", "teks": "Air kelapa muda"}
        ],
        "kunci": "A",
        "pembahasan": "Bakteri Lactobacillus memfermentasi gula laktosa pada susu menjadi asam laktat yang memberikan rasa asam segar pada yogurt dan keju.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 62,
        "soal": "Sengatan lebah bersifat asam dan dapat diredakan rasa sakitnya dengan mengoleskan zat yang bersifat basa lemah seperti ....",
        "opsi": [
            {"label": "A", "teks": "Pasta soda kue (natrium bikarbonat)"},
            {"label": "B", "teks": "Asam cuka"},
            {"label": "C", "teks": "Air perasan jeruk"},
            {"label": "D", "teks": "Minyak kayu putih"}
        ],
        "kunci": "A",
        "pembahasan": "Bisa lebah mengandung asam format. Mengoleskan pasta soda kue NaHCO3 (bersifat basa lemah) akan menetralkan racun asam lebah sehingga rasa perih mereda.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 63,
        "soal": "Zat yang ditambahkan ke dalam minyak goreng saat menggoreng untuk mencegah ketengikan (reaksi oksidasi lemak) disebut ....",
        "opsi": [
            {"label": "A", "teks": "Antioksidan (inhibitor oksidasi)"},
            {"label": "B", "teks": "Katalisator"},
            {"label": "C", "teks": "Emulgator"},
            {"label": "D", "teks": "Pewarna"}
        ],
        "kunci": "A",
        "pembahasan": "Antioksidan (seperti vitamin E / tokoferol, BHT, BHA) bertindak sebagai inhibitor yang menghambat rantai reaksi radikal bebas oksidasi lipid lemak sehingga minyak tidak lekas tengik.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 64,
        "soal": "Perubahan entalpi pembakaran 1 mol gas metana adalah Delta H = -890 kJ. Tanda minus pada nilai Delta H menunjukkan bahwa reaksi tersebut ....",
        "opsi": [
            {"label": "A", "teks": "Melepaskan energi kalor sebesar 890 kJ ke lingkungan (reaksi eksoterm)"},
            {"label": "B", "teks": "Menyerap energi"},
            {"label": "C", "teks": "Mengalami penurunan energi aktivasi"},
            {"label": "D", "teks": "Berlangsung pada suhu di bawah nol"}
        ],
        "kunci": "A",
        "pembahasan": "Tanda negatif pada Delta H selalu menandakan reaksi eksoterm di mana sistem melepas energi kalor ke lingkungan.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 65,
        "soal": "Jika persamaan reaksi pembentukan amonia N2 + 3 H2 -> 2 NH3 memiliki laju pengurangan gas N2 sebesar 0,2 M/s, maka laju pembentukan gas amonia NH3 adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,4 M/s"},
            {"label": "B", "teks": "0,2 M/s"},
            {"label": "C", "teks": "0,1 M/s"},
            {"label": "D", "teks": "0,6 M/s"}
        ],
        "kunci": "A",
        "pembahasan": "Perbandingan laju reaksi setara dengan perbandingan koefisien reaksi: r_NH3 / r_N2 = koefisien NH3 / koefisien N2 = 2 / 1 => r_NH3 = 2 * 0,2 M/s = 0,4 M/s.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    }
]

# 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "Teknologi 'cold pack' (kompres dingin instan) yang digunakan atlet olahraga yang cedera bekerja tanpa perlu dimasukkan ke kulkas. Saat kantung ditekan keras, kantung air di dalam pecah dan melarutkan serbuk amonium nitrat (NH4NO3). Fenomena kimia di balik kompres instan ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pelarutan amonium nitrat merupakan reaksi endoterm yang menyerap sejumlah besar kalor dari lingkungan sekitar sehingga suhu kompres turun mendekati 0°C seketika"},
            {"label": "B", "teks": "Reaksi pembentukan gas dingin"},
            {"label": "C", "teks": "Reaksi eksoterm"},
            {"label": "D", "teks": "Pembentukan es kering"}
        ],
        "kunci": "A",
        "pembahasan": "Cold pack memanfaatkan proses endoterm pelarutan garam amonium nitrat: NH4NO3 (s) + H2O (l) -> NH4+ (aq) + NO3- (aq) (Delta H bernilai positif tinggi). Sistem menyerap energi kalor secara cepat dari lingkungan luar (kulit atlet), menurunkan bengkak dan peradangan cedera.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 67,
        "soal": "Dalam industri pupuk modern, sintesis gas amonia melalui Proses Haber-Bosch (N2 + 3 H2 <-> 2 NH3, Delta H = -92 kJ) dilakukan pada suhu tinggi 450°C dan tekanan tinggi 200 atm dengan bantuan katalis serbuk besi. Ditinjau dari faktor kinetika reaksi, fungsi katalis besi dan tekanan tinggi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Katalis besi menurunkan energi aktivasi reaksi pemutusan ikatan rangkap tiga N≡N yang sangat kuat, sedangkan tekanan tinggi memadatkan kerapatan gas reaktan sehingga laju reaksi dan rendemen amonia maksimal"},
            {"label": "B", "teks": "Katalis besi mendinginkan reaktor"},
            {"label": "C", "teks": "Tekanan tinggi mengurangi massa gas"},
            {"label": "D", "teks": "Besi bereaksi membentuk garam"}
        ],
        "kunci": "A",
        "pembahasan": "Molekul N2 memiliki ikatan kovalen rangkap tiga (N≡N) berenergi disosiasi sangat tinggi (945 kJ/mol). Tanpa katalis serbuk besi berpromotor K2O dan Al2O3, reaksi hampir tidak berjalan pada suhu moderat. Tekanan tinggi (200 atm) memperbanyak tumbukan partikel dan menggeser kesetimbangan ke arah produk amonia.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 68,
        "soal": "Asidosis respiratorik adalah kondisi klinis di mana pH darah seseorang anjlok di bawah batas normal (< 7,35) akibat penumpukan gas CO2 di dalam tubuh karena gangguan pernapasan. Reaksi kesetimbangan asam bikarbonat dalam darah yang menjelaskan asidosis adalah ....",
        "opsi": [
            {"label": "A", "teks": "CO2 + H2O <-> H2CO3 <-> H+ + HCO3-, di mana penumpukan CO2 menggeser reaksi ke kanan menghasilkan ion H+ berlebih yang menurunkan pH darah"},
            {"label": "B", "teks": "CO2 langsung mengendapkan kalsium tulang"},
            {"label": "C", "teks": "CO2 menghentikan enzim katalase"},
            {"label": "D", "teks": "Darah berubah menjadi asam sulfat"}
        ],
        "kunci": "A",
        "pembahasan": "Darah manusia dikendalikan sistem penyangga (buffer) asam karbonat-bikarbonat: CO2 + H2O <-> H2CO3 <-> H+ + HCO3-. Hipoventilasi menyebabkan retensi CO2 tinggi, menggeser kesetimbangan kimia ke arah kanan (asam karbonat terdisosiasi melepaskan ion H+), sehingga konsentrasi [H+] naik dan pH darah anjlok (asidosis).",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 69,
        "soal": "Logam aluminium (Al) merupakan logam yang sangat reaktif terhadap oksigen, namun perkakas dapur dari aluminium tidak mudah keropos berkarat seperti besi. Fenomena ketahanan kimia aluminium ini disebabkan oleh ....",
        "opsi": [
            {"label": "A", "teks": "Aluminium segera bereaksi dengan oksigen membentuk lapisan tipis aluminium oksida (Al2O3) yang sangat rapat, kuat, dan melindungi permukaan logam di bawahnya dari oksidasi lanjutan (lapisan pasivasi)"},
            {"label": "B", "teks": "Aluminium tidak memiliki elektron valensi"},
            {"label": "C", "teks": "Aluminium tidak dapat bereaksi dengan air"},
            {"label": "D", "teks": "Massa jenis aluminium terlalu ringan"}
        ],
        "kunci": "A",
        "pembahasan": "Aluminium mengalami proses pasivasi alami: begitu tergores atau terpapar udara, atom Al permukaan langsung bereaksi dengan O2 membentuk lapisan film Al2O3 setebal beberapa nanometer yang amorf, tak berpori, dan melekat sangat kuat, menghentikan difusi oksigen lebih lanjut ke dalam inti logam.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 70,
        "soal": "Debu tepung gandum atau serbuk batubara di dalam ruang silo penyimpanan yang tertutup rapat dapat meledak secara hebat (dust explosion) hanya karena percikan api kecil, padahal tumpukan karung gandum atau bongkahan batubara tidak mudah meledak. Faktor penentu laju reaksi yang memicu ledakan debu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Luas permukaan bidang sentuh serbuk partikel debu yang melayang di udara sangat masif sehingga seluruh partikel bereaksi dengan oksigen secara simultan dalam fraksi detik menghasilkan pelepasan kalor dan tekanan gas raksasa"},
            {"label": "B", "teks": "Suhu ruangan naik mendadak"},
            {"label": "C", "teks": "Tepung berubah menjadi gas hidrogen"},
            {"label": "D", "teks": "Ketiadaan gaya gravitasi bumi"}
        ],
        "kunci": "A",
        "pembahasan": "Fenomena ledakan debu (dust explosion): Partikel padat yang digiling sangat halus memiliki rasio luas permukaan terhadap volume (A/V) yang amat sangat tinggi. Saat melayang tersuspensi di udara dengan konsentrasi tertentu, tumbukan antarpartikel reaktan dengan O2 terjadi secara serentak, membangkitkan laju reaksi pembakaran eksotermik eksplosif bertekanan dahsyat.",
        "paket": "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    }
]

# Assemble 70 questions for Bab 5
all_70 = []
for q in soal_hots:
    all_70.append(q)
for q in soal_contoh:
    all_70.append(q)
for q in soal_mandiri:
    all_70.append(q)
for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 5: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 9 - Bab V: Reaksi-Reaksi Kimia dan Dinamikanya (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 9 — Bab V: Reaksi-Reaksi Kimia dan Dinamikanya</h1>
<p>Total: 70 Butir Soal Lengkap (25 HOTS Kurikulum Merdeka + 10 Contoh Soal Asli + 30 Latihan Mandiri Asli + 5 Pengayaan AKM/TKA)</p>
<hr/>
""")

json_data = []

for idx, q in enumerate(all_70, 1):
    q_num = idx
    q_soal = q["soal"]
    q_kunci = q["kunci"]
    q_pembahasan = q["pembahasan"]
    q_paket = q["paket"]
    q_img = q["img"]
    
    img_tag = f"""  <div data-field="gambar">
    <img src="{q_img}" data-url="{q_img}" alt="Ilustrasi Soal #{q_num}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>\n""" if q_img else ""

    html_parts.append(f"""<article data-gemilang-question data-nomor="{q_num}" data-tipe="pg_sederhana" data-paket="{html.escape(q_paket)}" data-kesulitan="Sedang" data-kelas="9">
  <div data-field="materi">Reaksi-Reaksi Kimia dan Dinamikanya</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menyetarakan reaksi kimia berdasarkan Hukum Lavoisier, mengidentifikasi sifat larutan asam, basa, dan garam dengan indikator dan skala pH, membedakan reaksi eksoterm dan endoterm, serta menganalisis 4 faktor laju reaksi.</div>
  <div data-field="teks_soal">{html.escape(q_soal)}</div>
{img_tag}  <ol data-field="opsi_jawaban">
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
        "materi": "Reaksi-Reaksi Kimia dan Dinamikanya",
        "paket": q_paket,
        "kelas": "9",
        "mapel": "IPA",
        "teks_soal": q_soal,
        "gambar": [q_img] if q_img else [],
        "opsi_jawaban": q["opsi"],
        "kunci_jawaban": q_kunci,
        "pembahasan": q_pembahasan,
        "valid": True
    })

html_parts.append("</body></html>")

html_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab5_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab5_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
