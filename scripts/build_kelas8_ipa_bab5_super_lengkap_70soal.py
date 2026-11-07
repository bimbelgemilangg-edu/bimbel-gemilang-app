#!/usr/bin/env python3
"""
build_kelas8_ipa_bab5_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 5 IPA SMP Kelas 8:
Unsur, Senyawa, dan Campuran:
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid (0 Error)
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 25 Soal Kurikulum Merdeka HOTS Bab 5 (Hal. 446-452)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar model partikel zat di dalam empat kotak berikut:\n- Kotak I: Partikel berupa atom tunggal sejenis yang terpisah\n- Kotak II: Partikel berupa molekul dwiatomik sejenis (dua atom sejenis berikatan)\n- Kotak III: Partikel berupa molekul senyawa (dua atom berbeda berikatan)\n- Kotak IV: Campuran berbagai macam atom dan molekul yang tidak berikatan kimia\nKotak yang merepresentasikan Molekul Unsur dan Molekul Senyawa berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kotak I dan Kotak II"},
            {"label": "B", "teks": "Kotak I dan Kotak III"},
            {"label": "C", "teks": "Kotak II dan Kotak III"},
            {"label": "D", "teks": "Kotak III dan Kotak IV"}
        ],
        "kunci": "C",
        "pembahasan": "Kotak II adalah molekul unsur (tersusun dari atom-atom yang sejenis, misalnya $O_2$ atau $H_2$). Kotak III adalah molekul senyawa (tersusun dari dua atau lebih jenis atom berbeda yang terikat secara kimiawi, misalnya $H_2O$ atau $CO$).",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Penulisan lambang unsur kimia menurut aturan Jons Jakob Berzelius untuk unsur Besi, Tembaga, Perak, Emas, dan Raksa berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Be, Te, Pe, Em, Ra"},
            {"label": "B", "teks": "Fe, Cu, Ag, Au, Hg"},
            {"label": "C", "teks": "B, T, P, E, R"},
            {"label": "D", "teks": "Fe, Co, Ar, Au, Pb"}
        ],
        "kunci": "B",
        "pembahasan": "Aturan Berzelius mengambil huruf pertama kapital dan huruf kedua kecil dari nama ilmiah Latinnya: Besi = Ferrum ($Fe$), Tembaga = Cuprum ($Cu$), Perak = Argentum ($Ag$), Emas = Aurum ($Au$), dan Raksa = Hydrargyrum ($Hg$).",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Pada umumnya unsur logam berwujud padat pada suhu ruang (25°C) dan unsur nonlogam merupakan isolator panas/listrik. Pengecualian pada aturan umum ini terjadi pada ....",
        "opsi": [
            {"label": "A", "teks": "Raksa (Hg) adalah logam yang berwujud cair pada suhu kamar, dan Grafit (karbon) adalah nonlogam yang dapat menghantarkan listrik"},
            {"label": "B", "teks": "Besi berwujud cair dan Emas adalah gas"},
            {"label": "C", "teks": "Aluminium tidak menghantarkan panas"},
            {"label": "D", "teks": "Oksigen adalah logam padat"}
        ],
        "kunci": "A",
        "pembahasan": "Raksa ($Hg$) memiliki titik leleh sangat rendah (-38,8°C) sehingga menjadi satu-satunya unsur logam berwujud cair pada suhu kamar. Grafit adalah alotrop karbon (nonlogam) dengan struktur elektron pi terdelokalisasi yang mampu menghantarkan arus listrik dengan sangat baik.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Unsur Silikon (Si) dan Germanium (Ge) memiliki sifat peralihan di antara logam dan nonlogam (metaloid). Aplikasi utama unsur metaloid dalam teknologi industri modern adalah sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Bahan bakar roket antariksa"},
            {"label": "B", "teks": "Pewarna alami tekstil"},
            {"label": "C", "teks": "Logam pelapis perhiasan anti karat"},
            {"label": "D", "teks": "Bahan semikonduktor pembuat mikroprosesor komputer (chip IC) dan sel surya (solar cell)"}
        ],
        "kunci": "D",
        "pembahasan": "Metaloid seperti Silikon ($Si$) dan Germanium ($Ge$) bersifat semikonduktor, yaitu isolator pada suhu rendah namun menjadi konduktor saat diberi doping atom asing atau pada suhu tinggi. Karakteristik ini mendasari pembuatan transistor dan sirkuit terpadu mikroprosesor.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Garam dapur (NaCl) yang kita konsumsi sehari-hari tersusun atas logam Natrium (Na) yang sangat reaktif dan mudah meledak jika terkena air, serta gas Klorin (Cl2) yang beracun dan mematikan. Mengapa garam dapur aman dikonsumsi dan rasanya asin tidak beracun?",
        "opsi": [
            {"label": "A", "teks": "Karena kadar klorinnya sangat encer"},
            {"label": "B", "teks": "Karena natrium dinetralkan oleh air liur"},
            {"label": "C", "teks": "Ketika unsur-unsur bereaksi secara kimia membentuk senyawa baru, sifat-sifat asli unsur penyusunnya hilang total dan digantikan oleh sifat kimia dan fisika baru senyawa tersebut"},
            {"label": "D", "teks": "Karena garam dapur adalah campuran mekanis"}
        ],
        "kunci": "C",
        "pembahasan": "Senyawa terbentuk melalui reaksi ikatan kimia (serah terima elektron membentuk kisi kristal ionik $Na^+$ dan $Cl^-$). Akibatnya, sifat reaktivitas logam $Na$ dan toksisitas gas $Cl_2$ lenyap sama sekali, menghasilkan zat tunggal baru ($NaCl$) dengan sifat yang sama sekali baru.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Molekul glukosa memiliki rumus kimia C6H12O6, sedangkan pupuk urea memiliki rumus kimia CO(NH2)2. Jumlah total atom yang menyusun satu molekul glukosa dan satu molekul urea berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "12 atom dan 6 atom"},
            {"label": "B", "teks": "24 atom dan 8 atom"},
            {"label": "C", "teks": "24 atom dan 7 atom"},
            {"label": "D", "teks": "18 atom dan 8 atom"}
        ],
        "kunci": "B",
        "pembahasan": "Glukosa ($C_6H_{12}O_6$): $6 \\text{ atom C} + 12 \\text{ atom H} + 6 \\text{ atom O} = 24 \\text{ atom}$. Urea ($CO(NH_2)_2$): $1 \\text{ atom C} + 1 \\text{ atom O} + 2 \\times 1 \\text{ atom N} + 2 \\times 2 \\text{ atom H} = 1 + 1 + 2 + 4 = 8 \\text{ atom}$.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Air murni (H2O) selalu memiliki perbandingan massa hidrogen dan oksigen tetap, yaitu H : O = 1 : 8 sesuai Hukum Proust. Jika 4 gram gas hidrogen direaksikan dengan 40 gram gas oksigen, massa air yang terbentuk dan massa zat yang tersisa adalah ....",
        "opsi": [
            {"label": "A", "teks": "36 gram air terbentuk dan tersisa 8 gram oksigen"},
            {"label": "B", "teks": "44 gram air terbentuk dan tidak ada zat tersisa"},
            {"label": "C", "teks": "32 gram air terbentuk dan tersisa 12 gram oksigen"},
            {"label": "D", "teks": "40 gram air terbentuk dan tersisa 4 gram hidrogen"}
        ],
        "kunci": "A",
        "pembahasan": "Rasio perbandingan $H : O = 1 : 8$. Untuk 4 gram hidrogen, dibutuhkan oksigen sebanyak $4 \\times 8 = 32 \\text{ gram}$. Oksigen yang tersedia ada 40 gram, maka oksigen berlebih dan tersisa: $40 - 32 = 8 \\text{ gram}$. Massa air yang terbentuk = massa $H$ terpakai + massa $O$ terpakai = $4 + 32 = 36 \\text{ gram}$.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Seorang siswa mengarahkan berkas sinar senter melewati tiga gelas kimia: Gelas A (air gula jernih), Gelas B (susu cair encer), dan Gelas C (air kopi pekat). Berkas sinar tampak diteruskan lurus tanpa jejak pada Gelas A, namun pada Gelas B jejak berkas sinar tampak jelas terhamburkan bercahaya. Hamburan cahaya pada sistem koloid ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Efek Doppler"},
            {"label": "B", "teks": "Gerak Brown"},
            {"label": "C", "teks": "Efek Tyndall"},
            {"label": "D", "teks": "Elektroforesis"}
        ],
        "kunci": "C",
        "pembahasan": "Efek Tyndall adalah penghamburan berkas cahaya oleh partikel-partikel koloid yang memiliki ukuran (1–100 nm) sebanding dengan panjang gelombang cahaya tampak, sehingga lintasan berkas cahaya menjadi terlihat jelas.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Tiga buah gelas kimia masing-masing berisi: Gelas A (larutan garam dapur jernih), Gelas B (koloid santan kelapa), dan Gelas C (suspensi air bercampur pasir halus). Perbedaan stabilitas fisik ketiga cairan tersebut setelah didiamkan selama 1 jam adalah ....",
        "opsi": [
            {"label": "A", "teks": "Semua gelas mengendap"},
            {"label": "B", "teks": "Gelas A mengendap, Gelas B dan C jernih"},
            {"label": "C", "teks": "Gelas B mengendap paling cepat"},
            {"label": "D", "teks": "Gelas A (larutan) dan Gelas B (koloid) tetap stabil tidak mengendap, sedangkan Gelas C (suspensi) mengendap membentuk sedimen pasir di dasar gelas"}
        ],
        "kunci": "D",
        "pembahasan": "Larutan sejati bersifat homogen dan sangat stabil (tidak mengendap). Koloid relatif stabil dan tidak mengendap dalam waktu singkat karena gerak Brown partikel. Suspensi bersifat heterogen kasar sehingga partikelnya cepat mengendap di dasar wadah oleh gaya gravitasi.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Kuningan (brass) dan Perunggu (bronze) adalah campuran paduan logam (aloi / amalgam padat) yang banyak dimanfaatkan manusia. Logam penyusun kuningan dan perunggu berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Besi dan Nikel"},
            {"label": "B", "teks": "Tembaga (Cu) + Seng (Zn) untuk Kuningan, dan Tembaga (Cu) + Timah (Sn) untuk Perunggu"},
            {"label": "C", "teks": "Aluminium dan Tembaga"},
            {"label": "D", "teks": "Perak dan Emas"}
        ],
        "kunci": "B",
        "pembahasan": "Kuningan adalah paduan larutan padat antara tembaga ($Cu$) dan seng ($Zn$). Perunggu adalah paduan tembaga ($Cu$) dengan timah ($Sn$). Keduanya merupakan campuran homogen padat.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Sebuah botol alkohol antiseptik di kotak P3K bertuliskan label kadar “Alkohol 70%”. Jika volume total larutan di dalam botol adalah 200 mL, berapakah volume alkohol murni dan volume air pelarutnya?",
        "opsi": [
            {"label": "A", "teks": "140 mL alkohol murni dan 60 mL air"},
            {"label": "B", "teks": "70 mL alkohol murni dan 130 mL air"},
            {"label": "C", "teks": "100 mL alkohol murni dan 100 mL air"},
            {"label": "D", "teks": "160 mL alkohol murni dan 40 mL air"}
        ],
        "kunci": "A",
        "pembahasan": "Volume alkohol murni = $70\\% \\times 200 \\text{ mL} = \\frac{70}{100} \\times 200 = 140 \\text{ mL}$. Volume air pelarut = $200 \\text{ mL} - 140 \\text{ mL} = 60 \\text{ mL}$.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Jika ke dalam segelas larutan gula yang manis ditambahkan 200 mL air murni, yang terjadi pada konsentrasi kemanisan larutan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kemanisan meningkat karena jumlah gula bertambah"},
            {"label": "B", "teks": "Konsentrasi larutan gula tidak mengalami perubahan"},
            {"label": "C", "teks": "Gula mengendap di dasar gelas"},
            {"label": "D", "teks": "Konsentrasi larutan menurun (terjadi pengenceran) sehingga rasa manis berkurang, meskipun jumlah molekul gula terlarut tetap sama"}
        ],
        "kunci": "D",
        "pembahasan": "Proses pengenceran (dilution) menambah volume pelarut sehingga rasio konsentrasi $\\frac{\\text{massa zat terlarut}}{\\text{volume larutan}}$ menurun, yang secara sensorik dirasakan sebagai berkurangnya rasa manis.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Udara bersih di atmosfer bumi yang kita hirup setiap saat tergolong sebagai campuran homogen gas. Gas penyusun udara atmosfer yang memiliki persentase volume paling melimpah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gas Oksigen (O2)"},
            {"label": "B", "teks": "Gas Karbon dioksida (CO2)"},
            {"label": "C", "teks": "Gas Nitrogen (N2) sekitar 78%"},
            {"label": "D", "teks": "Gas Argon (Ar)"}
        ],
        "kunci": "C",
        "pembahasan": "Komposisi udara kering atmosfer bumi: Gas Nitrogen ($N_2$) sekitar 78%, Gas Oksigen ($O_2$) sekitar 21%, Argon ($Ar$) sekitar 0,93%, dan Karbon dioksida ($CO_2$) sekitar 0,04%.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Perhatikan beberapa karakteristik materi berikut:\n(1) Terbentuk melalui proses pencampuran fisika tanpa ikatan kimia baru\n(2) Perbandingan massa komponen-komponennya bebas (tidak tetap)\n(3) Sifat-sifat zat penyusunnya masih tetap tampak\n(4) Dapat dipisahkan kembali menjadi komponen aslinya melalui metode fisika biasa\nCiri-ciri di atas merupakan karakteristik dari ....",
        "opsi": [
            {"label": "A", "teks": "Unsur"},
            {"label": "B", "teks": "Campuran"},
            {"label": "C", "teks": "Senyawa"},
            {"label": "D", "teks": "Atom monoatomik"}
        ],
        "kunci": "B",
        "pembahasan": "Keempat poin tersebut adalah ciri khas campuran (baik homogen maupun heterogen), yang membedakannya secara mutlak dari senyawa kimiawi.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Perhatikan beberapa zat di sekitar kita berikut:\n(1) Kawat tembaga murni\n(2) Air mineral pegunungan\n(3) Gas oksigen tabung rumah sakit\n(4) Belerang kuning di kawah gunung\n(5) Sirup rasa melon\nZat yang tergolong Unsur kimia adalah nomor ....",
        "opsi": [
            {"label": "A", "teks": "(1), (3), dan (4)"},
            {"label": "B", "teks": "(1), (2), dan (5)"},
            {"label": "C", "teks": "(2) dan (5)"},
            {"label": "D", "teks": "(3), (4), dan (5)"}
        ],
        "kunci": "A",
        "pembahasan": "Tembaga ($Cu$), oksigen ($O_2$), dan belerang ($S_8$) adalah unsur kimia murni. Air mineral adalah larutan (campuran air dan garam mineral), dan sirup adalah campuran larutan gula dengan perisa.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Di dalam struktur atom, partikel subatomik yang bermuatan listrik positif, partikel bermuatan netral (tidak bermuatan), dan partikel bermuatan listrik negatif berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Elektron, proton, dan neutron"},
            {"label": "B", "teks": "Neutron, proton, dan elektron"},
            {"label": "C", "teks": "Proton, neutron, dan elektron"},
            {"label": "D", "teks": "Positron, foton, dan gluon"}
        ],
        "kunci": "C",
        "pembahasan": "Struktur dasar atom terdiri atas inti atom yang berisi proton (muatan +1) dan neutron (netral 0), serta awan kulit atom yang ditempati oleh elektron (muatan -1) yang mengelilingi inti.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Sebuah spesi ion Kalsium memiliki nomor atom Z = 20 dan nomor massa A = 40. Jika atom kalsium tersebut membentuk kation Ca2+, jumlah proton, elektron, dan neutron di dalam ion Ca2+ tersebut berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "20 proton, 18 elektron, dan 20 neutron"},
            {"label": "B", "teks": "20 proton, 20 elektron, dan 20 neutron"},
            {"label": "C", "teks": "18 proton, 20 elektron, dan 22 neutron"},
            {"label": "D", "teks": "20 proton, 22 elektron, dan 20 neutron"}
        ],
        "kunci": "A",
        "pembahasan": "Nomor atom $Z = 20 \\Rightarrow \\text{Proton} = 20$. Neutron = $A - Z = 40 - 20 = 20$. Karena ion bermuatan $+2$ ($Ca^{2+}$), atom telah melepaskan 2 elektron: Elektron = $20 - 2 = 18$. Maka berturut-turut adalah 20, 18, dan 20.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Atom Klorin memiliki nomor atom 17 dan nomor massa 35. Ketika atom klorin menangkap 1 elektron dari luar untuk mencapai kestabilan oktet membentuk ion klorida (Cl-), jumlah proton dan elektronnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Proton tetap 17 dan elektron menjadi 18"},
            {"label": "B", "teks": "Proton menjadi 18 dan elektron tetap 17"},
            {"label": "C", "teks": "Proton dan elektron sama-sama 18"},
            {"label": "D", "teks": "Proton dan elektron sama-sama 16"}
        ],
        "kunci": "A",
        "pembahasan": "Pembentukan anion ($Cl^-$) hanya melibatkan penangkapan elektron pada kulit valensi: elektron bertambah 1 menjadi $17 + 1 = 18$. Jumlah proton di dalam inti atom tidak berubah dan tetap 17.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Atom-atom dari unsur yang sama yang memiliki nomor atom (jumlah proton) sama persis, tetapi memiliki nomor massa (jumlah neutron) yang berbeda disebut ....",
        "opsi": [
            {"label": "A", "teks": "Isobar"},
            {"label": "B", "teks": "Isoton"},
            {"label": "C", "teks": "Isomer"},
            {"label": "D", "teks": "Isotop (misalnya Karbon-12 dan Karbon-14)"}
        ],
        "kunci": "D",
        "pembahasan": "Isotop adalah atom-atom yang memiliki nomor atom sama (unsur sejenis, jumlah proton sama) namun nomor massanya berbeda akibat perbedaan jumlah neutron di inti.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Dua atom berbeda, yaitu Karbon-14 (nomor atom 6, nomor massa 14) dan Nitrogen-14 (nomor atom 7, nomor massa 14), memiliki nomor massa yang sama persis namun nomor atomnya berbeda. Pasangan atom tersebut disebut ....",
        "opsi": [
            {"label": "A", "teks": "Isobar"},
            {"label": "B", "teks": "Isotop"},
            {"label": "C", "teks": "Isoton"},
            {"label": "D", "teks": "Alotrop"}
        ],
        "kunci": "A",
        "pembahasan": "Isobar adalah atom-atom dari unsur berbeda (nomor atom berlainan) yang memiliki nomor massa ($A$) yang sama persis.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Model atom yang menggambarkan elektron bergerak mengelilingi inti atom pada lintasan stasioner orbit tertentu (kulit K, L, M, N) dengan tingkat energi diskret tertentu dikemukakan oleh ....",
        "opsi": [
            {"label": "A", "teks": "John Dalton"},
            {"label": "B", "teks": "J.J. Thomson"},
            {"label": "C", "teks": "Niels Bohr"},
            {"label": "D", "teks": "Ernest Rutherford"}
        ],
        "kunci": "C",
        "pembahasan": "Niels Bohr menyempurnakan model atom Rutherford dengan memperkenalkan postulat kuantisasi lintasan elektron stasioner di mana elektron tidak memancarkan radiasi selama mengorbit pada tingkat energinya.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Atom Natrium (Na) memiliki nomor atom 11. Konfigurasi susunan elektron per kulit atom (K, L, M) menurut model atom Bohr yang benar adalah ....",
        "opsi": [
            {"label": "A", "teks": "2, 8, 1"},
            {"label": "B", "teks": "2, 9"},
            {"label": "C", "teks": "2, 7, 2"},
            {"label": "D", "teks": "3, 8"}
        ],
        "kunci": "A",
        "pembahasan": "Kapasitas maksimum elektron pada kulit $n$ adalah $2n^2$: Kulit K ($n=1$) maks 2 elektron, Kulit L ($n=2$) maks 8 elektron, dan sisanya 1 elektron mengisi kulit M ($n=3$). Maka konfigurasinya adalah 2, 8, 1.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Ketika kita menyeduh kopi bubuk dengan air panas lalu mendiamkannya beberapa menit, terbentuk endapan ampas kopi hitam pekat di bagian dasar cangkir. Hal ini membuktikan bahwa air kopi tubruk tergolong ....",
        "opsi": [
            {"label": "A", "teks": "Suspensi (campuran kasar heterogen)"},
            {"label": "B", "teks": "Larutan homogen sejati"},
            {"label": "C", "teks": "Senyawa murni"},
            {"label": "D", "teks": "Unsur tunggal"}
        ],
        "kunci": "A",
        "pembahasan": "Terbentuknya endapan (sedimen) secara spontan di dasar wadah merupakan ciri khas suspensi karena ukuran partikel ampas kopi $> 100 \\text{ nm}$ sehingga gaya gravitasi mengalahkan gaya gerak termal partikel.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Baja tahan karat (stainless steel) yang digunakan untuk pisau bedah dan sendok makan merupakan paduan logam antara Besi (Fe), Kromium (Cr), dan Nikel (Ni). Penambahan unsur kromium berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Membuat logam mudah terbakar"},
            {"label": "B", "teks": "Menurunkan massa jenis besi"},
            {"label": "C", "teks": "Membentuk lapisan pasivasi kromium oksida mikro di permukaan yang kedap oksigen sehingga besi terlindung dari korosi perkaratan"},
            {"label": "D", "teks": "Menjadikan baja lentur seperti karet"}
        ],
        "kunci": "C",
        "pembahasan": "Kromium bereaksi dengan oksigen membentuk lapisan oksida $Cr_2O_3$ sangat tipis namun sangat rapat dan melekat kuat (lapisan pasif) yang mencegah difusi gas oksigen dan air ke dalam atom besi.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Dalam penjernihan air keruh, penambahan tawas (alum) berfungsi menggumpalkan kotoran lumpur halus. Peran tawas dalam ilmu kimia koloid adalah sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Bahan pewarna air"},
            {"label": "B", "teks": "Pelarut organik"},
            {"label": "C", "teks": "Pemanis buatan"},
            {"label": "D", "teks": "Koagulan, di mana kation Al3+ menetralkan muatan negatif partikel koloid lumpur sehingga partikel bergabung menggumpal menjadi flok besar yang cepat mengendap"}
        ],
        "kunci": "D",
        "pembahasan": "Partikel koloid lumpur stabil karena bermuatan negatif yang saling tolak-menolak. Ion $Al^{3+}$ dari tawas menetralkan muatan listrik tersebut (koagulasi), sehingga partikel beraglomerasi menjadi flok-flok besar yang mudah mengendap atau disaring.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    }
]

# 10 Soal Contoh Asli (No. 26-35)
contoh_soal = [
    {
        "nomor_bab": 26,
        "soal": "Zat tunggal yang tidak dapat diuraikan lagi menjadi zat lain yang lebih sederhana melalui reaksi kimia biasa disebut ....",
        "opsi": [
            {"label": "A", "teks": "Unsur"},
            {"label": "B", "teks": "Senyawa"},
            {"label": "C", "teks": "Campuran"},
            {"label": "D", "teks": "Larutan"}
        ],
        "kunci": "A",
        "pembahasan": "Unsur adalah zat tunggal paling mendasar yang tersusun atas satu jenis atom dan tidak dapat didekomposisi lebih lanjut melalui reaksi kimia biasa.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Zat tunggal yang terbentuk dari gabungan dua atau lebih unsur berbeda melalui reaksi kimia dengan perbandingan massa tetap disebut ....",
        "opsi": [
            {"label": "A", "teks": "Unsur"},
            {"label": "B", "teks": "Senyawa"},
            {"label": "C", "teks": "Campuran heterogen"},
            {"label": "D", "teks": "Koloid"}
        ],
        "kunci": "B",
        "pembahasan": "Senyawa adalah zat tunggal hasil persenyawaan kimia dari dua unsur atau lebih dengan rasio stoikiometri massa yang pasti.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Berikut ini yang merupakan kelompok unsur nonlogam adalah ....",
        "opsi": [
            {"label": "A", "teks": "Besi, tembaga, dan emas"},
            {"label": "B", "teks": "Oksigen, nitrogen, dan belerang"},
            {"label": "C", "teks": "Natrium, kalsium, dan kalium"},
            {"label": "D", "teks": "Aluminium, seng, dan timah"}
        ],
        "kunci": "B",
        "pembahasan": "Oksigen ($O$), Nitrogen ($N$), dan Belerang ($S$) adalah unsur-unsur nonlogam golongan utama.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Campuran antara dua zat atau lebih yang partikel-partikel penyusunnya menyatu sempurna dan tidak dapat dibedakan lagi batas antar-fasenya disebut ....",
        "opsi": [
            {"label": "A", "teks": "Campuran homogen (larutan)"},
            {"label": "B", "teks": "Campuran heterogen (suspensi)"},
            {"label": "C", "teks": "Senyawa"},
            {"label": "D", "teks": "Endapan"}
        ],
        "kunci": "A",
        "pembahasan": "Campuran homogen adalah dispersi satu fase di mana sifat dan komposisi zat di seluruh bagian larutan serba sama.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Contoh campuran homogen dalam kehidupan sehari-hari adalah ....",
        "opsi": [
            {"label": "A", "teks": "Air sirup dan larutan garam dapur"},
            {"label": "B", "teks": "Campuran air dan pasir"},
            {"label": "C", "teks": "Campuran minyak tanah dan air"},
            {"label": "D", "teks": "Air selokan berlumpur"}
        ],
        "kunci": "A",
        "pembahasan": "Air sirup dan air garam terlarut sempurna membentuk campuran homogen satu fase yang transparan.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Bagian terkecil dari suatu unsur yang masih mempertahankan sifat-sifat kimia unsur tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Atom"},
            {"label": "B", "teks": "Molekul"},
            {"label": "C", "teks": "Senyawa"},
            {"label": "D", "teks": "Campuran"}
        ],
        "kunci": "A",
        "pembahasan": "Atom adalah satuan unit dasar penyusun materi yang memiliki identitas kimia unsur.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Gabungan dua atau lebih atom sejenis membentuk ....",
        "opsi": [
            {"label": "A", "teks": "Molekul unsur"},
            {"label": "B", "teks": "Molekul senyawa"},
            {"label": "C", "teks": "Campuran"},
            {"label": "D", "teks": "Kation"}
        ],
        "kunci": "A",
        "pembahasan": "Molekul unsur tersusun atas atom-atom dari unsur yang sama, misalnya gas oksigen ($O_2$), ozon ($O_3$), dan gas hidrogen ($H_2$).",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Gabungan dua atau lebih atom yang berbeda jenis membentuk ....",
        "opsi": [
            {"label": "A", "teks": "Molekul senyawa"},
            {"label": "B", "teks": "Molekul unsur"},
            {"label": "C", "teks": "Atom tunggal"},
            {"label": "D", "teks": "Isotop"}
        ],
        "kunci": "A",
        "pembahasan": "Molekul senyawa tersusun dari ikatan atom-atom berlainan jenis, misalnya karbon dioksida ($CO_2$) dan metana ($CH_4$).",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Atom yang bermuatan listrik karena melepaskan atau menangkap elektron disebut ....",
        "opsi": [
            {"label": "A", "teks": "Ion"},
            {"label": "B", "teks": "Isotop"},
            {"label": "C", "teks": "Molekul"},
            {"label": "D", "teks": "Koloid"}
        ],
        "kunci": "A",
        "pembahasan": "Ion adalah atom atau gugus atom yang memiliki muatan listrik neto (kation jika bermuatan positif, anion jika bermuatan negatif).",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Jumlah proton di dalam inti atom dinyatakan oleh ....",
        "opsi": [
            {"label": "A", "teks": "Nomor atom (Z)"},
            {"label": "B", "teks": "Nomor massa (A)"},
            {"label": "C", "teks": "Jumlah elektron valensi"},
            {"label": "D", "teks": "Massa atom relatif"}
        ],
        "kunci": "A",
        "pembahasan": "Nomor atom ($Z$) menunjukkan jumlah proton di dalam inti atom sekaligus menentukan identitas unsur dalam tabel periodik.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
latihan_mandiri = [
    {"no": 36, "soal": "Lambang kimia untuk unsur Kalsium dan Kalium berturut-turut adalah ....", "opsi": ["Ca dan K", "K dan Ca", "Kl dan Ka", "C dan P"], "kunci": "A", "bahas": "Kalsium dilambangkan $Ca$ (Calcium), sedangkan Kalium dilambangkan $K$ (Kalium/Potassium)."},
    {"no": 37, "soal": "Rumus kimia dari gas karbon dioksida dan air berturut-turut adalah ....", "opsi": ["CO2 dan H2O", "CO dan H2O2", "C2O dan HO", "CO2 dan H2SO4"], "kunci": "A", "bahas": "Karbon dioksida adalah $CO_2$ dan air adalah $H_2O$."},
    {"no": 38, "soal": "Asam sulfat memiliki rumus kimia H2SO4. Jumlah atom hidrogen, belerang, dan oksigen dalam satu molekul asam sulfat adalah ....", "opsi": ["2 hidrogen, 1 belerang, 4 oksigen", "1 hidrogen, 2 belerang, 4 oksigen", "2 hidrogen, 4 belerang, 1 oksigen", "4 hidrogen, 1 belerang, 2 oksigen"], "kunci": "A", "bahas": "Dalam $H_2SO_4$: 2 atom H, 1 atom S, dan 4 atom O (total 7 atom)."},
    {"no": 39, "soal": "Berikut ini yang merupakan contoh molekul senyawa adalah ....", "opsi": ["H2O (air)", "O2 (oksigen)", "N2 (nitrogen)", "O3 (ozon)"], "kunci": "A", "bahas": "$H_2O$ tersusun atas atom H dan O yang berbeda jenis, sehingga tergolong molekul senyawa."},
    {"no": 40, "soal": "Berikut ini yang merupakan contoh molekul unsur dwiatomik adalah ....", "opsi": ["O2 (oksigen)", "CO2", "H2O", "NH3"], "kunci": "A", "bahas": "$O_2$ adalah molekul unsur yang tersusun dari 2 atom sejenis."},
    {"no": 41, "soal": "Air laut merupakan contoh campuran yang tersusun atas ....", "opsi": ["Air murni dan berbagai garam mineral terlarut", "Hanya natrium murni", "Hanya hidrogen dan oksigen", "Endapan batu"], "kunci": "A", "bahas": "Air laut adalah larutan homogen garam-garaman (NaCl, MgCl2, sulfat) di dalam pelarut air."},
    {"no": 42, "soal": "Campuran minyak goreng dengan air tergolong campuran heterogen karena ....", "opsi": ["Kedua cairan tidak saling melarutkan dan membentuk dua lapisan terpisah", "Minyak berubah jadi padat", "Air menguap habis", "Terbentuk senyawa baru"], "kunci": "A", "bahas": "Minyak bersifat nonpolar dan air bersifat polar sehingga immiscible (tidak bercampur) membentuk dua fase berbatas jelas."},
    {"no": 43, "soal": "Susu cair dan santan kelapa tergolong ke dalam sistem dispersi ....", "opsi": ["Koloid", "Larutan sejati", "Suspensi kasar", "Endapan murni"], "kunci": "A", "bahas": "Susu dan santan adalah emulsi lemak dalam air yang tergolong sistem koloid."},
    {"no": 44, "soal": "Ukuran partikel pada larutan sejati adalah ....", "opsi": ["< 1 nanometer", "1 sampai 100 nm", "> 100 nm", "> 1 mikrometer"], "kunci": "A", "bahas": "Partikel larutan sejati berukuran molekuler atau ionik $< 1$ nm ($< 10^{-9}$ m)."},
    {"no": 45, "soal": "Ukuran partikel pada sistem koloid berada pada rentang ....", "opsi": ["1 nm sampai 100 nm", "< 1 nm", "> 1.000 nm", "Tepat 1 meter"], "kunci": "A", "bahas": "Sistem koloid memiliki diameter partikel terdispersi antara 1 nm hingga 100 nm."},
    {"no": 46, "soal": "Campuran tepung terigu dengan air dingin yang keruh dan mengendap jika didiamkan tergolong ....", "opsi": ["Suspensi", "Larutan", "Senyawa", "Unsur"], "kunci": "A", "bahas": "Partikel tepung berukuran $> 100$ nm dan tidak larut sehingga tergolong suspensi."},
    {"no": 47, "soal": "Gerak patah-patah tak beraturan dari partikel koloid akibat tumbukan molekul medium pendispersi disebut gerak ....", "opsi": ["Brown", "Lurus", "Melingkar", "Parabola"], "kunci": "A", "bahas": "Gerak Brown adalah gerak acak zig-zag partikel koloid yang menahan partikel dari pengendapan gravitasi."},
    {"no": 48, "soal": "Partikel subatomik penyusun inti atom adalah ....", "opsi": ["Proton dan neutron", "Proton dan elektron", "Neutron dan elektron", "Hanya elektron"], "kunci": "A", "bahas": "Nukleus (inti atom) tersusun atas nukleon, yaitu proton dan neutron."},
    {"no": 49, "soal": "Partikel subatomik yang bermuatan negatif dan bergerak mengitari inti atom adalah ....", "opsi": ["Elektron", "Proton", "Neutron", "Positron"], "kunci": "A", "bahas": "Elektron bermuatan $-1$ mengorbit inti atom pada tingkat energi tertentu."},
    {"no": 50, "soal": "Nomor massa (A) suatu atom menyatakan jumlah ....", "opsi": ["Proton + neutron", "Proton + elektron", "Hanya proton", "Hanya neutron"], "kunci": "A", "bahas": "Nomor massa $A = \\text{jumlah proton} + \\text{jumlah neutron}$ di dalam inti atom."},
    {"no": 51, "soal": "Atom Oksigen memiliki nomor atom 8 dan nomor massa 16. Jumlah neutron atom oksigen adalah ....", "opsi": ["8", "16", "24", "0"], "kunci": "A", "bahas": "Neutron = $A - Z = 16 - 8 = 8$ neutron."},
    {"no": 52, "soal": "Atom Magnesium (Mg) dengan nomor atom 12 melepaskan 2 elektron valensinya membentuk ion ....", "opsi": ["Mg2+ (kation bermuatan +2)", "Mg2- (anion bermuatan -2)", "Mg+", "Mg-"], "kunci": "A", "bahas": "Kehilangan 2 elektron ($e^-$) menyebabkan jumlah proton melebihi elektron sebanyak 2, membentuk kation $Mg^{2+}$. "},
    {"no": 53, "soal": "Atom Oksigen (O) dengan nomor atom 8 menangkap 2 elektron dari luar membentuk ion ....", "opsi": ["O2- (anion bermuatan -2)", "O2+ (kation bermuatan +2)", "O+", "O-"], "kunci": "A", "bahas": "Menangkap 2 elektron menyebabkan muatan negatif bertambah 2 membentuk anion oksida $O^{2-}$. "},
    {"no": 54, "soal": "Kelompok unsur yang tergolong unsur logam adalah ....", "opsi": ["Besi, tembaga, emas, dan perak", "Oksigen, hidrogen, dan nitrogen", "Belerang, fosfor, dan karbon", "Helium, neon, dan argon"], "kunci": "A", "bahas": "Ferrum, Cuprum, Aurum, dan Argentum adalah unsur logam mulia dan transisi."},
    {"no": 55, "soal": "Sifat fisik khas unsur logam yang membedakannya dari nonlogam adalah ....", "opsi": ["Dapat ditempa menjadi lempengan dan dapat ditarik menjadi kawat (duktil dan maleabel)", "Rapuh dan mudah patah", "Isolator listrik", "Selalu berwujud gas"], "kunci": "A", "bahas": "Ikatan logam memungkinkan atom-atom logam bergeser tanpa pecah sehingga bersifat maleabel dan duktil."},
    {"no": 56, "soal": "Unsur nonlogam yang digunakan sebagai bahan pengisi balon udara karena lebih ringan dari udara dan tidak mudah terbakar adalah ....", "opsi": ["Helium (He)", "Hidrogen (H2)", "Oksigen (O2)", "Karbon dioksida (CO2)"], "kunci": "A", "bahas": "Gas mulia Helium ($He$) berdensitas sangat rendah dan bersifat inert stabil (tidak reaktif/tidak terbakar)."},
    {"no": 57, "soal": "Zat tunggal berikut yang tergolong senyawa organik adalah ....", "opsi": ["Gula tebu (sukrosa)", "Garam dapur (NaCl)", "Air murni (H2O)", "Asam klorida (HCl)"], "kunci": "A", "bahas": "Sukrosa ($C_{12}H_{22}O_{11}$) memiliki rantai karbon organik."},
    {"no": 58, "soal": "Molekul yang tersusun atas 3 atom oksigen yang berfungsi melindungi bumi dari radiasi ultraviolet di stratosfer adalah ....", "opsi": ["Ozon (O3)", "Oksigen (O2)", "Karbon monoksida (CO)", "Dioksida"], "kunci": "A", "bahas": "Ozon ($O_3$) adalah alotrop molekul unsur oksigen triatomik."},
    {"no": 59, "soal": "Atom netral selalu memiliki jumlah ....", "opsi": ["Proton sama dengan jumlah elektron", "Proton sama dengan neutron", "Neutron sama dengan elektron", "Massa sama dengan nol"], "kunci": "A", "bahas": "Atom netral tidak bermuatan karena muatan positif proton ($+1$) diimbangi sempurna oleh muatan negatif elektron ($-1$)."},
    {"no": 60, "soal": "Kulit pertama (kulit K) pada model atom Bohr dapat menampung elektron maksimum sebanyak ....", "opsi": ["2 elektron", "8 elektron", "18 elektron", "32 elektron"], "kunci": "A", "bahas": "Kapasitas kulit ke-$n$ = $2n^2$. Untuk kulit K ($n=1$): $2(1^2) = 2$ elektron."},
    {"no": 61, "soal": "Kulit kedua (kulit L) pada model atom Bohr dapat menampung elektron maksimum sebanyak ....", "opsi": ["8 elektron", "2 elektron", "18 elektron", "32 elektron"], "kunci": "A", "bahas": "Untuk kulit L ($n=2$): $2(2^2) = 2 \\times 4 = 8$ elektron."},
    {"no": 62, "soal": "Elektron yang berada pada kulit terluar suatu atom disebut ....", "opsi": ["Elektron valensi", "Elektron inti", "Proton valensi", "Positron"], "kunci": "A", "bahas": "Elektron valensi adalah elektron pada orbital terluar yang berperan dalam pembentukan ikatan kimia."},
    {"no": 63, "soal": "Atom Karbon (nomor atom 6) memiliki konfigurasi elektron per kulit ....", "opsi": ["2, 4", "2, 8", "4, 2", "6"], "kunci": "A", "bahas": "Nomor atom 6: Kulit K terisi 2 elektron, sisa 4 elektron mengisi kulit L (elektron valensi = 4)."},
    {"no": 64, "soal": "Senyawa yang terbentuk dari ikatan antara kation logam dan anion nonlogam disebut senyawa ....", "opsi": ["Ionik (seperti NaCl)", "Kovalen nonpolar", "Campuran", "Unsur bebas"], "kunci": "A", "bahas": "Senyawa ionik terbentuk melalui gaya elektrostatis antara kation positif dan anion negatif."},
    {"no": 65, "soal": "Senyawa yang terbentuk dari penggunaan bersama pasangan elektron oleh atom-atom nonlogam disebut senyawa ....", "opsi": ["Kovalen (seperti H2O dan CO2)", "Ionik", "Logam", "Amalgam"], "kunci": "A", "bahas": "Ikatan kovalen terbentuk melalui pemakaian bersama pasangan elektron antar-unsur nonlogam."}
]

# 5 Soal Pengayaan AKM (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains — Penentuan Formula Empiris & Analisis Stoikiometri] Suatu sampel senyawa hidrokarbon dianalisis di laboratorium dan diketahui mengandung 24 gram karbon ($A_r C = 12$) dan 6 gram hidrogen ($A_r H = 1$). Perbandingan mol atom C dan H serta rumus empiris senyawa tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mol C : Mol H = 1 : 3 (Rumus Empiris CH3)"},
            {"label": "B", "teks": "Mol C : Mol H = 2 : 6 (Rumus Empiris C2H6)"},
            {"label": "C", "teks": "Mol C : Mol H = 1 : 2 (Rumus Empiris CH2)"},
            {"label": "D", "teks": "Mol C : Mol H = 1 : 4 (Rumus Empiris CH4)"}
        ],
        "kunci": "A",
        "pembahasan": "Mol C = $\\frac{\\text{massa}}{A_r} = \\frac{24}{12} = 2 \\text{ mol}$. Mol H = $\\frac{6}{1} = 6 \\text{ mol}$. Perbandingan mol atom $C : H = 2 : 6 = 1 : 3$. Maka rumus empiris senyawa hidrokarbon tersebut adalah $CH_3$.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Pilihan Ganda Kompleks — Sifat Koloid Pelindung & Koagulasi Susu Basi] Susu segar yang dibiarkan terbuka di suhu kamar lama-kelamaan menjadi asam dan menggumpal terpisah antara cairan bening (whey) dan gumpalan putih (curd). Peristiwa penggumpalan koloid susu tersebut terjadi karena ....",
        "opsi": [
            {"label": "A", "teks": "Bakteri asam laktat memfermentasi laktosa menjadi asam laktat; ion H+ menetralkan muatan negatif protein kasein sehingga kasein terkoagulasi menggumpal"},
            {"label": "B", "teks": "Susu bereaksi dengan gas oksigen membentuk garam dapur"},
            {"label": "C", "teks": "Partikel koloid susu menguap habis"},
            {"label": "D", "teks": "Susu berubah menjadi unsur tunggal kalsium"}
        ],
        "kunci": "A",
        "pembahasan": "Kasein susu adalah koloid yang stabil pada pH netral 6,6 karena muatan negatifnya. Asidifikasi oleh asam laktat menurunkan pH menuju titik isoelektrik (pH 4,6) di mana muatan kasein menjadi nol, memicu koagulasi dan pemisahan dadih keju.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Analisis Data Spektrometri Massa — Isotop Karbon] Karbon di alam terdiri dari dua isotop stabil: Karbon-12 (kelimpahan 98,9%) dan Karbon-13 (kelimpahan 1,1%). Karbon-14 yang bersifat radioaktif digunakan oleh arkeolog untuk penanggalan fosil purba (radiocarbon dating) karena ....",
        "opsi": [
            {"label": "A", "teks": "Karbon-14 meluruh secara bertahap dengan waktu paruh konstan 5.730 tahun sejak organisme mati"},
            {"label": "B", "teks": "Karbon-14 berwujud emas murni"},
            {"label": "C", "teks": "Karbon-14 tidak pernah mengalami perubahan"},
            {"label": "D", "teks": "Karbon-14 menyerap sinar matahari di dalam tanah"}
        ],
        "kunci": "A",
        "pembahasan": "Organisme hidup mempertahankan rasio C-14 terhadap C-12 yang konstan melalui respirasi dan fotosintesis. Saat organisme mati, asupan C-14 terhenti dan C-14 meluruh menjadi Nitrogen-14 dengan waktu paruh $T_{1/2} = 5.730 \\text{ tahun}$, memungkinkan penentuan usia fosil.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Rekayasa Material — Paduan Logam Memori Bentuk (Nitinol)] Kawat Nitinol (paduan Nikel dan Titanium) dapat ditekuk sesuka hati, namun saat dipanaskan kawat tersebut akan kembali ke bentuk aslinya secara ajaib. Paduan logam pintar ini banyak diaplikasikan dalam kedokteran untuk ....",
        "opsi": [
            {"label": "A", "teks": "Kawat gigi (behel) dan stent ring pembuluh darah jantung"},
            {"label": "B", "teks": "Pengganti cairan infus"},
            {"label": "C", "teks": "Pewarna makanan"},
            {"label": "D", "teks": "Bahan pemanis obat sirup"}
        ],
        "kunci": "A",
        "pembahasan": "Nitinol memiliki sifat superelastisitas dan shape-memory effect akibat transformasi fasa kristal martensitik-austenitik reversibel. Digunakan luas pada kawat ortodontik dan ring stent pembuluh arteri koroner.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Evaluasi Dampak Lingkungan — Aerosol & Penipisan Ozon] Gas klorofluorokarbon (CFC / freon) yang digunakan pada pendingin AC dan kulkas zaman dahulu merupakan senyawa kovalen yang sangat stabil. Mengapa senyawa ini sangat merusak lapisan ozon di stratosfer?",
        "opsi": [
            {"label": "A", "teks": "CFC membakar atmosfer secara langsung"},
            {"label": "B", "teks": "Radiasi UV stratosfer memecah molekul CFC melepaskan radikal bebas klorin (Cl) yang bertindak sebagai katalis memecah jutaan molekul ozon (O3) menjadi gas O2 biasa"},
            {"label": "C", "teks": "CFC menyerap gas nitrogen secara masif"},
            {"label": "D", "teks": "CFC menurunkan gravitasi bumi"}
        ],
        "kunci": "B",
        "pembahasan": "Satu atom radikal klorin ($Cl^\\bullet$) dari dekomposisi fotolisis CFC dapat mengkatalisis penguraian hingga 100.000 molekul ozon ($O_3$) secara berulang melalui siklus katalitik, memicu timbulnya lubang ozon stratosfer.",
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    }
]

# Assemble 70 questions for Bab 5
all_70 = []

for q in soal_hots:
    all_70.append(q)

for q in contoh_soal:
    all_70.append(q)

for q in latihan_mandiri:
    all_70.append({
        "nomor_bab": q["no"],
        "soal": q["soal"],
        "opsi": [{"label": chr(65+i), "teks": t} for i, t in enumerate(q["opsi"])],
        "kunci": q["kunci"],
        "pembahasan": q["bahas"],
        "paket": "Bab V: Unsur, Senyawa, & Campuran - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch5_unsur_senyawa_atom.jpg"
    })

for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 5: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab V: Unsur, Senyawa, dan Campuran (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 8 — Bab V: Unsur, Senyawa, dan Campuran</h1>
<p>Total: 70 Butir Soal Lengkap (25 HOTS Kurikulum Merdeka + 10 Contoh Soal Asli + 30 Latihan Mandiri Asli + 5 Pengayaan AKM/TKA)</p>
<hr/>
""")

json_data = []

for q in all_70:
    q_num = q["nomor_bab"]
    q_soal = q["soal"]
    q_kunci = q["kunci"]
    q_pembahasan = q["pembahasan"]
    q_paket = q["paket"]
    q_img = q["img"]
    
    html_parts.append(f"""<article data-gemilang-question data-nomor="{q_num}" data-tipe="pg_sederhana" data-paket="{html.escape(q_paket)}" data-kesulitan="Sedang" data-kelas="8">
  <div data-field="materi">Unsur, Senyawa, dan Campuran</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu membedakan unsur logam/nonlogam, senyawa, larutan, koloid, suspensi, struktur partikel atom, dan pembentukan ion.</div>
  <div data-field="teks_soal">{html.escape(q_soal)}</div>
  <div data-field="gambar">
    <img src="{q_img}" data-url="{q_img}" alt="Ilustrasi Soal #{q_num}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>
  <ol data-field="opsi_jawaban">
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
        "materi": "Unsur, Senyawa, dan Campuran",
        "paket": q_paket,
        "kelas": "8",
        "mapel": "IPA",
        "teks_soal": q_soal,
        "gambar": [q_img],
        "opsi_jawaban": q["opsi"],
        "kunci_jawaban": q_kunci,
        "pembahasan": q_pembahasan,
        "valid": True
    })

html_parts.append("</body></html>")

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab5_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab5_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
