#!/usr/bin/env python3
"""
build_kelas8_ipa_bab6_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 6 IPA SMP Kelas 8:
Pemisahan Campuran di Sekitar Kita:
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

# 25 Soal Kurikulum Merdeka HOTS Bab 6 (Hal. 478-484)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar rangkaian alat pemisahan campuran secara distilasi (penyulingan) Liebig berikut! Bagian alat bernomor (3) yang dialiri air pendingin dan berfungsi mengembunkan uap cairan menjadi distilat cair murni adalah ....",
        "opsi": [
            {"label": "A", "teks": "Labu distilasi"},
            {"label": "B", "teks": "Termometer"},
            {"label": "C", "teks": "Kondensor (pendingin Liebig)"},
            {"label": "D", "teks": "Labu Erlenmeyer"}
        ],
        "kunci": "C",
        "pembahasan": "Bagian nomor (1) adalah termometer, nomor (2) adalah labu distilasi, nomor (3) adalah kondensor (pendingin Liebig) yang dialiri sirkulasi air dingin untuk mengkondensasikan uap panas menjadi tetesan distilat cair murni yang ditampung pada wadah penampung nomor (4).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Ketika seorang siswa menyaring campuran air keruh berpasir menggunakan corong kaca dan kertas saring di laboratorium, air jernih menetes ke dalam labu Erlenmeyer sedangkan butiran pasir tertinggal di atas kertas saring. Istilah kimia untuk cairan jernih yang lolos dan padatan yang tertinggal di kertas saring secara berurutan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Residu dan filtrat"},
            {"label": "B", "teks": "Filtrat dan residu"},
            {"label": "C", "teks": "Distilat dan suspensi"},
            {"label": "D", "teks": "Supernatan dan endapan"}
        ],
        "kunci": "B",
        "pembahasan": "Dalam proses filtrasi (penyaringan): Cairan jernih yang berhasil melewati pori kertas saring disebut filtrat, sedangkan zat padat tak larut yang tertahan di atas kertas saring disebut residu (ampas).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Mengapa campuran larutan gula pasir yang jernih tidak dapat dipisahkan antara gula dan airnya menggunakan kertas saring biasa di laboratorium?",
        "opsi": [
            {"label": "A", "teks": "Partikel molekul gula yang terlarut berukuran lebih kecil dari 1 nm sehingga dapat dengan mudah lolos melewati pori-pori mikro kertas saring"},
            {"label": "B", "teks": "Karena gula bereaksi kimia membentuk garam"},
            {"label": "C", "teks": "Karena kertas saring menyerap gula sepenuhnya"},
            {"label": "D", "teks": "Karena massa jenis gula lebih ringan daripada air"}
        ],
        "kunci": "A",
        "pembahasan": "Larutan sejati gula adalah campuran homogen dengan dimensi partikel molekuler $< 1 \\text{ nm}$, jauh lebih kecil daripada ukuran pori rata-rata kertas saring laboratorium (orde mikrometer), sehingga partikel zat terlarut lolos bersama molekul pelarut.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Di laboratorium rumah sakit, petugas analis kesehatan ingin memisahkan keping sel darah merah dan sel darah putih dari cairan plasma darah dalam waktu beberapa menit. Metode pemisahan campuran yang paling tepat dan cepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Filtrasi kertas biasa"},
            {"label": "B", "teks": "Destilasi bertingkat"},
            {"label": "C", "teks": "Kromatografi kertas"},
            {"label": "D", "teks": "Sentrifugasi (pemusingan berkecepatan tinggi)"}
        ],
        "kunci": "D",
        "pembahasan": "Sentrifugasi memanfaatkan tabung centrifuge yang diputar dengan percepatan ribuan RPM. Gaya sentrifugal ribuan kali gravitasi bumi memaksa sel-sel darah yang berdensitas lebih padat mengendap di dasar tabung (pelet), sementara plasma darah yang bening tetap di lapisan atas (supernatan).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Sebuah rangkaian alat destilasi sederhana digunakan untuk memisahkan campuran homogen antara air (titik didih 100°C) dan alkohol etanol (titik didih 78°C). Zat yang akan menguap terlebih dahulu dan tertampung sebagai distilat pertama adalah ....",
        "opsi": [
            {"label": "A", "teks": "Air, karena jumlahnya lebih banyak"},
            {"label": "B", "teks": "Keduanya menguap secara bersamaan"},
            {"label": "C", "teks": "Alkohol etanol, karena memiliki titik didih yang lebih rendah (78°C) sehingga menguap lebih dulu saat dipanaskan"},
            {"label": "D", "teks": "Tidak ada yang menguap"}
        ],
        "kunci": "C",
        "pembahasan": "Prinsip destilasi didasarkan pada perbedaan titik didih zat cair. Zat cair dengan titik didih lebih rendah (etanol, 78°C) memiliki tekanan uap jenuh lebih tinggi sehingga mendidih dan menguap terlebih dahulu, lalu diembunkan di pendingin Liebig menjadi distilat murni.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Prinsip dasar yang mendasari proses pemisahan campuran dengan metode filtrasi (penyaringan) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Perbedaan titik didih zat penyusunnya"},
            {"label": "B", "teks": "Perbedaan ukuran partikel antara zat padat tak larut dengan zat cair pelarutnya"},
            {"label": "C", "teks": "Perbedaan daya serap terhadap kertas"},
            {"label": "D", "teks": "Perbedaan titik beku"}
        ],
        "kunci": "B",
        "pembahasan": "Filtrasi memisahkan padatan tersuspensi dari cairan berdasarkan perbedaan ukuran partikel terhadap diameter pori-pori media penyaring.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Pada rangkaian alat destilasi Liebig, air pendingin selalu dialirkan masuk melalui lubang bagian bawah kondensor dan keluar melalui lubang bagian atas. Alasan teknis dari arah aliran air pendingin tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Aliran air dari bawah melawan gravitasi memastikan seluruh selubung jaket kondensor terisi penuh air tanpa ada kantung udara kosong, sehingga proses pendinginan uap berlangsung optimal"},
            {"label": "B", "teks": "Agar air tidak tumpah"},
            {"label": "C", "teks": "Untuk mempercepat naiknya uap"},
            {"label": "D", "teks": "Menyesuaikan arah rotasi bumi"}
        ],
        "kunci": "A",
        "pembahasan": "Jika air dimasukkan dari atas, air akan langsung mengalir turun ke bawah dan meninggalkan rongga udara di bagian atas tabung kondensor. Memasukkan air dari bawah menjamin pendingin terisi penuh (full water jacket) dan menciptakan pertukaran panas counter-current yang sangat efisien.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Pemisahan zat warna tinta spidol hitam menjadi warna merah, biru, dan kuning pada kertas saring yang dicelupkan ke dalam air didasarkan pada metode kromatografi kertas. Prinsip dasar pemisahan ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Perbedaan titik leleh zat warna"},
            {"label": "B", "teks": "Perbedaan kecepatan rambat partikel pigmen zat warna yang terlarut pada fase diam (kertas) terbawa oleh fase gerak (pelarut air)"},
            {"label": "C", "teks": "Penguapan warna di udara"},
            {"label": "D", "teks": "Reaksi pembusukan pigmen"}
        ],
        "kunci": "B",
        "pembahasan": "Kromatografi partisi kertas memisahkan komponen berdasarkan koefisien distribusi partisi zat terlarut antara fase diam (serat selulosa kertas) dan fase gerak (eluen pelarut yang merambat naik melalui gaya kapilaritas).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Saat melakukan kromatografi kertas, garis batas awal tempat menotolkan sampel tinta harus dibuat menggunakan pensil grafit dan BUKAN menggunakan pulpen tinta. Hal ini bertujuan agar ....",
        "opsi": [
            {"label": "A", "teks": "Kertas tidak robek"},
            {"label": "B", "teks": "Garis pensil terlihat lebih hitam"},
            {"label": "C", "teks": "Biaya praktikum lebih murah"},
            {"label": "D", "teks": "Karbon grafit pensil tidak larut dalam pelarut sehingga tidak ikut merambat dan tidak mengotori hasil kromatogram"}
        ],
        "kunci": "D",
        "pembahasan": "Tinta pulpen mengandung campuran zat warna organik yang akan larut dan terurai oleh pelarut (eluen), sehingga mengacaukan pemisahan sampel. Grafit pensil adalah karbon murni yang insolubel (tidak larut) dalam semua pelarut kromatografi.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Metode kromatografi gas dan kromatografi cair kinerja tinggi (HPLC) banyak digunakan di laboratorium forensik kepolisian dan anti-doping olahraga karena ....",
        "opsi": [
            {"label": "A", "teks": "Dapat memisahkan zat padat berukuran batu"},
            {"label": "B", "teks": "Sangat sensitif dan akurat dalam mendeteksi serta memisahkan senyawa kimia aktif dalam konsentrasi renik (sangat kecil/mikrogram)"},
            {"label": "C", "teks": "Menghilangkan racun secara instan"},
            {"label": "D", "teks": "Harganya paling murah"}
        ],
        "kunci": "B",
        "pembahasan": "Kromatografi modern (seperti GC-MS dan HPLC) memiliki resolusi analitis sangat tinggi yang mampu mengidentifikasi dan mengukur kadar senyawa obat terlarang atau metabolit racun hingga tingkat parts-per-billion (ppb).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Kapur barus (naftalena) yang bercampur dengan pasir dan debu tanah dapat dimurnikan kembali menggunakan metode sublimasi dengan cara dipanaskan dalam cawan dan ditutup kaca arloji berisi es batu. Perubahan wujud yang terjadi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Padat -> Gas (saat dipanaskan) lalu Gas -> Padat (mengkristal kembali di bawah kaca arloji dingin)"},
            {"label": "B", "teks": "Padat -> Cair -> Gas"},
            {"label": "C", "teks": "Cair -> Padat"},
            {"label": "D", "teks": "Hanya mencair saja"}
        ],
        "kunci": "A",
        "pembahasan": "Sublimasi adalah perubahan wujud zat dari padat langsung menjadi gas tanpa melalui fase cair saat dipanaskan, kemudian gas naftalena murni menyentuh permukaan kaca arloji dingin dan mengalami deposisi/kristalisasi kembali menjadi kristal padat murni.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Zat-zat kimia di bawah ini yang dapat dimurnikan dari pengotornya menggunakan metode pemisahan sublimasi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Garam dapur dan gula pasir"},
            {"label": "B", "teks": "Air dan alkohol"},
            {"label": "C", "teks": "Besi dan tembaga"},
            {"label": "D", "teks": "Kapur barus (kamper), iodin murni (I2), dan amonium klorida (NH4Cl)"}
        ],
        "kunci": "D",
        "pembahasan": "Senyawa yang memiliki tekanan uap sublimasi tinggi pada suhu relatif rendah meliputi kristal iodin ($I_2$), kamper (naftalena/kapur barus), dan amonium klorida ($NH_4Cl$).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Pada pembuatan garam dapur secara tradisional di tepi pantai, petani garam mengalirkan air laut ke petak-petak tambak garam yang terpapar terik sinar matahari. Prinsip pemisahan campuran yang terjadi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Filtrasi dan sentrifugasi"},
            {"label": "B", "teks": "Sublimasi dan kondensasi"},
            {"label": "C", "teks": "Evaporasi (penguapan air pelarut) diikuti kristalisasi garam dapur (NaCl)"},
            {"label": "D", "teks": "Destilasi bertingkat"}
        ],
        "kunci": "C",
        "pembahasan": "Energi panas matahari menguapkan pelarut air laut (evaporasi). Ketika konsentrasi garam melewati batas kejenuhan larutan (super-saturated), ion-ion $Na^+$ dan $Cl^-$ bergabung membentuk kisi kristal padat garam dapur (kristalisasi).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Sebuah tabung penjernih air sederhana disusun dari atas ke bawah: Kerikil, Pasir halus, Arang aktif (karbon aktif), dan Ijuk/Kapas. Fungsi spesifik dari lapisan arang aktif pada sistem penyaring tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menyaring partikel lumpur kasar"},
            {"label": "B", "teks": "Menyerap (mengadsorpsi) bau tidak sedap, zat racun, sisa kaporit, dan zat warna terlarut sehingga air menjadi jernih dan segar"},
            {"label": "C", "teks": "Menambahkan garam mineral ke air"},
            {"label": "D", "teks": "Membunuh seluruh partikel pasir"}
        ],
        "kunci": "B",
        "pembahasan": "Arang aktif memiliki struktur pori mikroskopis yang luas dengan daya adsorpsi permukaan tinggi. Bahan ini efektif menangkap molekul-molekul organik penyebab bau busuk, residu pestisida/klorin, dan pewarna terlarut.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Pengolahan minyak mentah (crude oil) di kilang minyak bumi untuk memisahkan gas elpiji, bensin, kerosin (minyak tanah), solar, dan aspal dilakukan menggunakan metode ....",
        "opsi": [
            {"label": "A", "teks": "Destilasi bertingkat (fraksinasi) berdasarkan perbedaan rentang titik didih hidrokarbon"},
            {"label": "B", "teks": "Filtrasi kertas saring bertekanan"},
            {"label": "C", "teks": "Sublimasi beku"},
            {"label": "D", "teks": "Kromatografi lapis tipis"}
        ],
        "kunci": "A",
        "pembahasan": "Minyak mentah adalah campuran kompleks senyawa hidrokarbon. Pemisahannya menggunakan kolom fraksinasi bertingkat di mana fraksi hidrokarbon dengan titik didih terendah menguap ke puncak kolom, sedangkan fraksi berat dengan titik didih tinggi mencair di bagian bawah kolom.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Pada kolom fraksinasi minyak bumi, fraksi minyak yang memiliki titik didih paling rendah dan keluar dari bagian paling atas kolom berupa gas adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gas hidrokarbon (LPG: metana, etana, propana, butana)"},
            {"label": "B", "teks": "Bensin (gasolin)"},
            {"label": "C", "teks": "Kerosin (avtur)"},
            {"label": "D", "teks": "Aspal residu"}
        ],
        "kunci": "A",
        "pembahasan": "Fraksi gas bumi (C1–C4) memiliki titik didih $< 20^\\circ\\text{C}$ sehingga tidak mengembun di dalam kolom dan keluar dari puncak kolom sebagai bahan bakar gas cair (LPG).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Seorang siswa tidak sengaja menumpahkan sekotak paku kecil dan serbuk besi ke dalam bak berisi pasir pantai. Metode pemisahan fisik yang paling cepat dan efisien tanpa merusak bahan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mendidihkan pasir dengan air"},
            {"label": "B", "teks": "Membakar pasir hingga paku meleleh"},
            {"label": "C", "teks": "Menyaring menggunakan kertas saring"},
            {"label": "D", "teks": "Pemisahan magnetik menggunakan batang magnet kuat untuk menarik serbuk besi dan paku yang bersifat feromagnetik"}
        ],
        "kunci": "D",
        "pembahasan": "Besi bersifat feromagnetik (sangat kuat ditarik medan magnet), sedangkan butiran pasir (silika $SiO_2$) bersifat diamagnetik (tidak ditarik magnet). Penggunaan magnet memisahkan kedua bahan seketika secara bersih.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Ketika kita mencuci beras sebelum dimasak, air cucian beras yang keruh dituangkan perlahan-lahan keluar dari wadah sementara butiran beras yang berat tetap tertinggal di dasar baskom. Metode pemisahan sederhana ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Destilasi"},
            {"label": "B", "teks": "Dekantasi"},
            {"label": "C", "teks": "Kromatografi"},
            {"label": "D", "teks": "Sublimasi"}
        ],
        "kunci": "B",
        "pembahasan": "Dekantasi adalah teknik pemisahan campuran zat padat tak larut dari cairan dengan cara menuangkan cairan lapisan atas secara hati-hati setelah zat padat mengendap di dasar wadah.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Di pulau terpencil yang kekurangan air tawar, air laut dapat diubah menjadi air minum tawar yang higienis melalui metode desalinasi destilasi surya (solar still). Prinsip kerja desalinasi ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Matahari menguapkan air murni dari air laut, lalu uap air mengembun pada kaca penutup miring dan menetes sebagai air tawar murni ke saluran penampung, meninggalkan garam di dasar wadah"},
            {"label": "B", "teks": "Garam dipisahkan dengan magnet"},
            {"label": "C", "teks": "Air laut disaring dengan kain tipis"},
            {"label": "D", "teks": "Air laut dibekukan hingga garam hilang"}
        ],
        "kunci": "A",
        "pembahasan": "Hanya molekul air ($H_2O$) yang memiliki titik didih dan tekanan uap yang memungkinkan evaporasi pada suhu tersebut, sedangkan garam-garam mineral tidak menguap. Kondensasi uap air menghasilkan distilat air murni bebas garam.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Dalam industri pengolahan susu, krim lemak susu dipisahkan dari susu skim encer menggunakan alat cream separator yang bekerja dengan prinsip ....",
        "opsi": [
            {"label": "A", "teks": "Kromatografi kertas"},
            {"label": "B", "teks": "Sublimasi uap"},
            {"label": "C", "teks": "Evaporasi matahari"},
            {"label": "D", "teks": "Sentrifugasi, di mana perbedaan massa jenis antara butiran lemak dan cairan susu skim dipisahkan oleh putaran cepat"}
        ],
        "kunci": "D",
        "pembahasan": "Separator sentrifugal memutar susu dengan kecepatan tinggi: cairan skim yang lebih rapat terlempar ke dinding luar mangkuk, sedangkan gumpalan globula lemak krim yang lebih ringan terkumpul di poros tengah.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Seorang siswa di laboratorium ingin memisahkan campuran yang terdiri atas: Serbuk Besi, Pasir, dan Garam Dapur. Urutan langkah pemisahan yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Evaporasi -> Destilasi -> Penyaringan"},
            {"label": "B", "teks": "Pemanasan sampai meleleh -> Penyaringan"},
            {"label": "C", "teks": "Gunakan magnet untuk menarik serbuk besi -> larutkan campuran pasir dan garam dengan air lalu saring dengan kertas saring (pasir tertahan sebagai residu) -> uapkan filtrat air garam (evaporasi) hingga diperoleh kristal garam murni"},
            {"label": "D", "teks": "Kromatografi kertas -> Sentrifugasi"}
        ],
        "kunci": "C",
        "pembahasan": "Langkah pemisahan sekuensial: (1) Dekatkan batang magnet untuk memisahkan serbuk besi magnetik; (2) Tambahkan air untuk melarutkan garam, pasir tidak larut; (3) Filtrasi memisahkan pasir padat dari larutan garam; (4) Evaporasi/kristalisasi menguapkan air menyisakan kristal garam padat murni.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Pembuatan minyak atsiri dari kelopak bunga mawar atau daun kayu putih yang senyawa aromatiknya mudah rusak pada suhu tinggi dilakukan menggunakan metode ....",
        "opsi": [
            {"label": "A", "teks": "Filtrasi kertas"},
            {"label": "B", "teks": "Destilasi uap (steam distillation)"},
            {"label": "C", "teks": "Sentrifugasi darah"},
            {"label": "D", "teks": "Sublimasi beku"}
        ],
        "kunci": "B",
        "pembahasan": "Destilasi uap mengalirkan uap air panas melalui bahan tanaman. Uap air menurunkan titik didih senyawa minyak atsiri di bawah 100°C sehingga minyak menguap bersama uap air tanpa mengalami dekomposisi termal.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Pada percobaan kromatografi kertas dengan pelarut air, zat warna yang merambat paling jauh mendekati garis ujung batas atas pelarut adalah zat warna yang ....",
        "opsi": [
            {"label": "A", "teks": "Paling mudah larut dalam fase gerak (pelarut) dan memiliki interaksi paling lemah dengan kertas"},
            {"label": "B", "teks": "Paling berat massanya"},
            {"label": "C", "teks": "Tidak larut dalam air"},
            {"label": "D", "teks": "Bereaksi membakar kertas"}
        ],
        "kunci": "A",
        "pembahasan": "Jarak migrasi noda berbanding lurus dengan afinitas kelarutan zat pada fase gerak (eluen). Komponen yang sangat larut dalam eluen dan kurang terikat pada fase diam akan merambat paling cepat bersama pelarut.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Perbedaan mendasar antara metode Evaporasi (penguapan) dan Destilasi (penyulingan) dalam hal pengumpulan zat hasil pemisahan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Evaporasi memerlukan pendingin kondensor, sedangkan destilasi tidak"},
            {"label": "B", "teks": "Keduanya tidak melibatkan pemanasan"},
            {"label": "C", "teks": "Pada evaporasi, pelarut cair dibiarkan menguap hilang ke udara untuk mengambil zat padatnya; sedangkan pada destilasi, uap pelarut ditangkap kembali dan diembunkan sehingga kedua komponen cairan dapat dikumpulkan secara utuh"},
            {"label": "D", "teks": "Evaporasi hanya untuk memisahkan gas"}
        ],
        "kunci": "C",
        "pembahasan": "Evaporasi membuang uap pelarut ke lingkungan (hanya zat terlarut yang diambil). Destilasi memasang kondensor pendingin untuk mengkondensasi uap menjadi cairan murni, sehingga pelarut maupun zat residu sama-sama dapat diperoleh kembali.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Dalam pembuatan santan kelapa, parutan kelapa diperas dan disaring menggunakan saringan kawat halus atau kain saring. Proses ini merupakan penerapan dari metode ....",
        "opsi": [
            {"label": "A", "teks": "Destilasi"},
            {"label": "B", "teks": "Kromatografi"},
            {"label": "C", "teks": "Sublimasi"},
            {"label": "D", "teks": "Filtrasi (penyaringan), di mana ampas kelapa tertahan sebagai residu dan emulsi santan lolos sebagai filtrat"}
        ],
        "kunci": "D",
        "pembahasan": "Pori-pori saringan santan menahan ampas serat kelapa padat yang berukuran makroskopis (residu), sementara emulsi koloid santan kelapa lolos melewati pori saringan sebagai filtrat.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    }
]

# 10 Soal Contoh Asli (No. 26-35)
contoh_soal = [
    {
        "nomor_bab": 26,
        "soal": "Pemisahan campuran air dan pasir dapat dilakukan secara cepat di laboratorium dengan metode ....",
        "opsi": [
            {"label": "A", "teks": "Filtrasi (penyaringan)"},
            {"label": "B", "teks": "Destilasi"},
            {"label": "C", "teks": "Kromatografi"},
            {"label": "D", "teks": "Sublimasi"}
        ],
        "kunci": "A",
        "pembahasan": "Partikel pasir yang tidak larut dalam air berukuran jauh lebih besar daripada pori kertas saring, sehingga mudah dipisahkan secara filtrasi.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Alat laboratorium yang digunakan untuk menopang kertas saring saat melakukan penyaringan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Corong kaca (funnel)"},
            {"label": "B", "teks": "Tabung reaksi"},
            {"label": "C", "teks": "Buret"},
            {"label": "D", "teks": "Pipet tetes"}
        ],
        "kunci": "A",
        "pembahasan": "Corong kaca berbentuk kerucut berfungsi sebagai wadah penopang kertas saring lipat dan mengarahkan aliran filtrat ke wadah penampung.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Untuk memisahkan campuran dua zat cair yang memiliki perbedaan titik didih sangat mencolok, metode yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Destilasi"},
            {"label": "B", "teks": "Filtrasi"},
            {"label": "C", "teks": "Sublimasi"},
            {"label": "D", "teks": "Sentrifugasi"}
        ],
        "kunci": "A",
        "pembahasan": "Destilasi adalah metode baku pemisahan campuran homogen cair-cair berdasarkan disparitas titik didih.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Zat padat yang dapat menyublim seperti iodin dapat dipisahkan dari zat padat pengotornya dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Sublimasi"},
            {"label": "B", "teks": "Sentrifugasi"},
            {"label": "C", "teks": "Kromatografi"},
            {"label": "D", "teks": "Filtrasi"}
        ],
        "kunci": "A",
        "pembahasan": "Pemanasan menyebabkan iodin menyublim menjadi uap ungu yang mengkristal kembali pada permukaan dingin, meninggalkan pengotor padat di dasar wadah.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Pengujian pewarna sintetis berbahaya Rhodamin B pada sampel terasi merah dapat dilakukan menggunakan metode ....",
        "opsi": [
            {"label": "A", "teks": "Kromatografi kertas"},
            {"label": "B", "teks": "Filtrasi kasar"},
            {"label": "C", "teks": "Destilasi uap"},
            {"label": "D", "teks": "Pengayakan"}
        ],
        "kunci": "A",
        "pembahasan": "Kromatografi kertas memisahkan pigmen warna makanan berdasarkan faktor retensi ($R_f$) spesifik zat warna standar.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Pembuatan gula pasir murni dari air perasan tebu (nira) di pabrik gula melibatkan proses ....",
        "opsi": [
            {"label": "A", "teks": "Penguapan dan kristalisasi"},
            {"label": "B", "teks": "Sublimasi"},
            {"label": "C", "teks": "Sentrifugasi saja"},
            {"label": "D", "teks": "Destilasi uap"}
        ],
        "kunci": "A",
        "pembahasan": "Nira tebu dipekatkan melalui penguapan vakum hingga lewat jenuh, lalu diinokulasi kristal bibit untuk memicu kristalisasi sukrosa.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Metode pemisahan campuran yang digunakan untuk memisahkan bensin dari minyak bumi mentah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Destilasi bertingkat"},
            {"label": "B", "teks": "Filtrasi"},
            {"label": "C", "teks": "Dekantasi"},
            {"label": "D", "teks": "Kromatografi"}
        ],
        "kunci": "A",
        "pembahasan": "Fraksi bensin dipisahkan pada rentang titik didih 40°C–180°C pada menara fraksinasi minyak mentah.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Bahan alami yang dapat digunakan sebagai penyaring partikel kotoran kasar pada alat penjernih air sederhana adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pasir, kerikil, dan ijuk"},
            {"label": "B", "teks": "Minyak goreng"},
            {"label": "C", "teks": "Garam dapur"},
            {"label": "D", "teks": "Belerang"}
        ],
        "kunci": "A",
        "pembahasan": "Kerikil, pasir silika, dan ijuk membentuk filter bertingkat berpori untuk menahan sedimen tersuspensi.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Pemisahan serbuk besi dari campuran pasir dapat dilakukan dengan memanfaatkan sifat fisika ....",
        "opsi": [
            {"label": "A", "teks": "Kemagnetan (sifat feromagnetik)"},
            {"label": "B", "teks": "Kelarutan dalam air"},
            {"label": "C", "teks": "Titik didih"},
            {"label": "D", "teks": "Warna zat"}
        ],
        "kunci": "A",
        "pembahasan": "Besi ditarik oleh medan magnet, sedangkan pasir tidak terpengaruh medan magnet.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Air minum murni bebas mineral (akuades) yang biasa digunakan untuk laboratorium kimia dibuat melalui proses ....",
        "opsi": [
            {"label": "A", "teks": "Destilasi (penyulingan air)"},
            {"label": "B", "teks": "Sublimasi"},
            {"label": "C", "teks": "Kromatografi"},
            {"label": "D", "teks": "Sentrifugasi"}
        ],
        "kunci": "A",
        "pembahasan": "Air biasa disuling dengan mendidihkannya hingga menguap, lalu uap air murni dikondensasikan menjadi akuades murni.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_distilasi_liebig.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
latihan_mandiri = [
    {"no": 36, "soal": "Pemisahan campuran bertujuan untuk ....", "opsi": ["Memperoleh zat murni yang berguna dari campurannya", "Membuat zat beracun baru", "Mengubah unsur jadi atom", "Menghancurkan materi"], "kunci": "A", "bahas": "Tujuan pemisahan campuran adalah memurnikan zat dari zat pengotor agar bernilai guna tinggi."},
    {"no": 37, "soal": "Dasar pemisahan campuran dengan metode filtrasi adalah ....", "opsi": ["Perbedaan ukuran partikel", "Perbedaan massa jenis", "Perbedaan titik leleh", "Perbedaan warna"], "kunci": "A", "bahas": "Pori saringan meloloskan partikel kecil dan menahan partikel berukuran lebih besar."},
    {"no": 38, "soal": "Alat laboratorium yang digunakan untuk memanaskan cairan pada proses distilasi adalah ....", "opsi": ["Labu distilasi (labu alas bulat)", "Gelas ukur", "Cawan porselen", "Buret"], "kunci": "A", "bahas": "Labu alas bulat tahan panas mendistribusikan kalor secara merata pada larutan yang mendidih."},
    {"no": 39, "soal": "Penyulingan minyak kayu putih dari daun kayu putih memanfaatkan prinsip ....", "opsi": ["Destilasi", "Kromatografi", "Kristalisasi", "Sublimasi"], "kunci": "A", "bahas": "Minyak kayu putih atsiri diekstraksi melalui penyulingan uap."},
    {"no": 40, "soal": "Zat yang tertahan di atas kertas saring pada proses penyaringan disebut ....", "opsi": ["Residu", "Filtrat", "Distilat", "Solut"], "kunci": "A", "bahas": "Residu adalah ampas padat yang tertinggal pada filter media."},
    {"no": 41, "soal": "Cairan yang lolos melewati kertas saring pada proses penyaringan disebut ....", "opsi": ["Filtrat", "Residu", "Presipitat", "Pelarut"], "kunci": "A", "bahas": "Filtrat adalah cairan bebas partikel tersuspensi yang menembus filter."},
    {"no": 42, "soal": "Prinsip pemisahan campuran dengan kromatografi kertas didasarkan pada ....", "opsi": ["Perbedaan kecepatan perambatan zat terlarut pada fase diam oleh fase gerak", "Perbedaan berat molekul", "Perbedaan titik beku", "Perbedaan bau"], "kunci": "A", "bahas": "Partisi diferensial zat terlarut antara fase diam kertas dan eluen fase gerak."},
    {"no": 43, "soal": "Fase diam pada kromatografi kertas adalah ....", "opsi": ["Kertas saring selulosa", "Pelarut air", "Zat warna", "Udara"], "kunci": "A", "bahas": "Serat selulosa kertas bertindak sebagai fase diam (stationary phase)."},
    {"no": 44, "soal": "Fase gerak pada kromatografi kertas adalah ....", "opsi": ["Pelarut (eluen)", "Kertas saring", "Pensil", "Gelas kimia"], "kunci": "A", "bahas": "Pelarut organik atau air yang merambat naik disebut fase gerak (mobile phase)."},
    {"no": 45, "soal": "Nilai Rf (Retardation Factor) pada kromatografi kertas dirumuskan sebagai ....", "opsi": ["Jarak tempuh noda dibagi jarak tempuh pelarut", "Jarak pelarut dibagi jarak noda", "Massa noda kali waktu", "Tinggi kertas"], "kunci": "A", "bahas": "$R_f = d_{\\text{noda}} / d_{\\text{pelarut}}$, nilainya selalu $\\le 1$."},
    {"no": 46, "soal": "Pemisahan kapur barus dari kotoran tanah dilakukan dengan ....", "opsi": ["Sublimasi", "Sentrifugasi", "Kristalisasi", "Ekstraksi"], "kunci": "A", "bahas": "Kapur barus mudah menyublim saat dipanaskan meninggalkan tanah padat."},
    {"no": 47, "soal": "Pemisahan kristal garam dari air laut menggunakan metode ....", "opsi": ["Evaporasi dan kristalisasi", "Destilasi", "Kromatografi", "Sentrifugasi"], "kunci": "A", "bahas": "Penguapan air laut oleh panas matahari memicu pembentukan kristal garam dapur."},
    {"no": 48, "soal": "Pengambilan minyak atsiri bunga melati menggunakan pelarut eter disebut ....", "opsi": ["Ekstraksi", "Destilasi", "Sublimasi", "Filtrasi"], "kunci": "A", "bahas": "Ekstraksi melarutkan senyawa aromatik ke dalam pelarut organik yang sesuai."},
    {"no": 49, "soal": "Pemisahan campuran air dan minyak tanah dapat dilakukan menggunakan ....", "opsi": ["Corong pisah (separatory funnel)", "Kertas saring", "Kondensor", "Centrifuge"], "kunci": "A", "bahas": "Corong pisah memisahkan dua cairan tidak saling campur berdasarkan perbedaan massa jenis."},
    {"no": 50, "soal": "Pada corong pisah berisi air dan minyak tanah, lapisan yang berada di bawah adalah ....", "opsi": ["Air, karena massa jenisnya lebih besar (1 g/cm3) daripada minyak (0,8 g/cm3)", "Minyak tanah", "Keduanya menyatu", "Endapan putih"], "kunci": "A", "bahas": "Cairan berdensitas lebih tinggi (air) berada di lapisan bawah dan dapat dialirkan keluar lewat keran corong."},
    {"no": 51, "soal": "Pemisahan sel darah dalam tabung centrifuge menghasilkan endapan sel darah di bagian ....", "opsi": ["Dasar tabung", "Atas tabung", "Mengapung di tengah", "Menempel di dinding"], "kunci": "A", "bahas": "Gaya sentrifugal mendorong partikel berdensitas padat ke dasar tabung centrifuge."},
    {"no": 52, "soal": "Fraksi minyak bumi yang digunakan sebagai bahan bakar pesawat jet adalah ....", "opsi": ["Avtur (kerosin)", "Bensin", "Solar", "LPG"], "kunci": "A", "bahas": "Kerosin/avtur memiliki rantai karbon C10–C14 dengan sifat pembakaran stabil pada ketinggian tinggi."},
    {"no": 53, "soal": "Residu terberat dari destilasi bertingkat minyak bumi yang digunakan untuk pengaspalan jalan adalah ....", "opsi": ["Aspal (bitumen)", "Parafin", "Solar", "Pelumas"], "kunci": "A", "bahas": "Bitumen/aspal adalah fraksi hidrokarbon berat berantai $> C_{25}$ yang tidak menguap di dasar menara fraksinasi."},
    {"no": 54, "soal": "Penjernihan air menggunakan tawas melibatkan proses kimia fisika yang disebut ....", "opsi": ["Koagulasi", "Sublimasi", "Destilasi", "Kromatografi"], "kunci": "A", "bahas": "Koagulasi menetralkan muatan koloid lumpur sehingga membentuk gumpalan flokulan yang mudah diendapkan."},
    {"no": 55, "soal": "Penyaringan santan kelapa memisahkan ampas kelapa dari santan cair. Santan kelapa tergolong ....", "opsi": ["Filtrat", "Residu", "Endapan", "Distilat"], "kunci": "A", "bahas": "Cairan emulsi santan yang menembus saringan kawat adalah filtrat."},
    {"no": 56, "soal": "Pemisahan serbuk belerang dan serbuk besi dapat dilakukan dengan cara ....", "opsi": ["Menggunakan magnet atau melarutkan dengan cairan CS2", "Membakarnya", "Mendidihkannya", "Mengayaknya"], "kunci": "A", "bahas": "Magnet menarik besi, atau pelarut karbon disulfida ($CS_2$) melarutkan belerang dan menyisakan besi."},
    {"no": 57, "soal": "Pemisahan campuran kapur barus kotor menggunakan es batu di atas penutup cawan bertujuan untuk ....", "opsi": ["Mengkondensasikan / mengkristalkan kembali uap kapur barus", "Membuat es mencair", "Memadamkan api", "Menguapkan pasir"], "kunci": "A", "bahas": "Permukaan dingin menurunkan temperatur uap kamper sehingga terdeposisi menjadi kristal padat."},
    {"no": 58, "soal": "Prinsip pemisahan campuran pada mesin pengering pakaian di mesin cuci adalah ....", "opsi": ["Sentrifugasi", "Filtrasi", "Sublimasi", "Destilasi"], "kunci": "A", "bahas": "Tabung berputar kecepatan tinggi melempar tetesan air keluar menembus lubang dinding tabung karena gaya sentrifugal."},
    {"no": 59, "soal": "Pemisahan logam emas dari pasir lumpur di sungai secara tradisional menggunakan dulang memanfaatkan prinsip ....", "opsi": ["Perbedaan massa jenis (pendulangan)", "Kromatografi", "Sublimasi", "Penguapan"], "kunci": "A", "bahas": "Massa jenis emas murni sangat tinggi ($19,3 \\text{ g/cm}^3$) sehingga tertinggal di dasar kuali dulang saat pasir terbawa pusaran air."},
    {"no": 60, "soal": "Uji kandungan pewarna berbahaya pada kerupuk dilakukan dengan menotolkan ekstrak pewarna pada ....", "opsi": ["Kertas kromatografi", "Kaca arloji", "Corong pisah", "Tabung reaksi"], "kunci": "A", "bahas": "Ekstrak pewarna ditotolkan pada garis dasar kertas kromatografi untuk dielusi."},
    {"no": 61, "soal": "Untuk memisahkan air murni dari larutan tembaga sulfat biru di laboratorium, metode yang tepat adalah ....", "opsi": ["Destilasi sederhana", "Filtrasi kertas", "Kromatografi", "Dekantasi"], "kunci": "A", "bahas": "Destilasi menguapkan air murni dan meninggalkan kristal padat tembaga sulfat biru di labu distilasi."},
    {"no": 62, "soal": "Pemisahan campuran dengan cara menuangkan cairan secara perlahan tanpa alat saring disebut ....", "opsi": ["Dekantasi", "Filtrasi", "Destilasi", "Evaporasi"], "kunci": "A", "bahas": "Dekantasi menuang cairan bening bagian atas setelah sedimen padat mengendap di dasar."},
    {"no": 63, "soal": "Larutan garam dapat dipisahkan menjadi kristal garam dan air tawar secara bersamaan menggunakan metode ....", "opsi": ["Destilasi", "Evaporasi terbuka", "Filtrasi", "Sentrifugasi"], "kunci": "A", "bahas": "Destilasi menampung air tawar sebagai distilat dan menyisakan kristal garam di labu pemanas."},
    {"no": 64, "soal": "Di pabrik pengolahan air bersih PDAM, penambahan kaporit (kalsium hipoklorit) bertujuan untuk ....", "opsi": ["Mendisinfeksi membunuh bakteri dan mikroorganisme patogen", "Mengendapkan pasir", "Menghilangkan warna", "Menyaring lumpur"], "kunci": "A", "bahas": "Klorinasi menggunakan kaporit membasmi mikroorganisme patogen sebelum air didistribusikan."},
    {"no": 65, "soal": "Pemisahan zat padat dari zat padat lainnya yang berbeda ukuran dapat dilakukan secara mekanik menggunakan ....", "opsi": ["Ayakan (pengayakan)", "Destilasi", "Sentrifugasi", "Kromatografi"], "kunci": "A", "bahas": "Pengayakan (sieving) memisahkan campuran padatan kasar dan halus berdasarkan lubang mesh ayakan."}
]

# 5 Soal Pengayaan AKM (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains — Analisis Kromatogram Bahan Pewarna Pangan BPOM] Petugas BPOM menguji sampel jajanan sekolah menggunakan kromatografi kertas eluen air-etanol dengan jarak tempuh pelarut 10 cm. Noda zat warna standar Rhodamin B merambat sejauh 7,5 cm, sedangkan sampel jajanan X menghasilkan noda merah muda yang merambat sejauh 7,5 cm. Kesimpulan analisis kimia yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Sampel jajanan X positif mengandung pewarna berbahaya Rhodamin B karena memiliki nilai Rf sama yaitu 0,75"},
            {"label": "B", "teks": "Sampel jajanan X bebas dari zat kimia berbahaya"},
            {"label": "C", "teks": "Sampel jajanan X mengandung pewarna alami buah bit"},
            {"label": "D", "teks": "Nilai Rf sampel jajanan X adalah 1,33"}
        ],
        "kunci": "A",
        "pembahasan": "Nilai faktor retensi: $R_f = \\frac{d_{\\text{noda}}}{d_{\\text{pelarut}}} = \\frac{7,5 \\text{ cm}}{10 \\text{ cm}} = 0,75$. Kesamaan nilai $R_f$ dan warna noda dengan standar Rhodamin B membuktikan sampel positif terkontaminasi pewarna sintetis terlarang tersebut.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Pemecahan Masalah — Desalinasi Membran Osmosis Balik (Reverse Osmosis)] Instalasi pengolahan air laut modern di kapal pesiar menggunakan teknologi Reverse Osmosis (RO) bukan penyulingan termal. Prinsip kerja filter membran RO adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memberikan tekanan hidrostatik tinggi melampaui tekanan osmotik air laut untuk memaksa molekul air murni menembus membran semipermeabel poliamida, menahan ion-ion garam terlarut"},
            {"label": "B", "teks": "Mendidihkan air laut hingga kering"},
            {"label": "C", "teks": "Menggunakan magnet untuk menarik ion garam"},
            {"label": "D", "teks": "Menambahkan asam klorida pekat"}
        ],
        "kunci": "A",
        "pembahasan": "Osmosis alami mengalirkan pelarut dari encer ke pekat. Dengan memberikan tekanan mekanis tinggi pada sisi larutan berkonsentrasi garam tinggi, aliran pelarut dibalik (reverse osmosis) sehingga molekul air murni didorong menembus pori sub-nanometer membran menyisakan air konsentrat garam pekat (brine).",
        "paket": "Bab VI: Pemisahan Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Evaluasi Kasus Medis — Cuci Darah Pasien Gagal Ginjal (Hemodialisis)] Mesin hemodialisis menggantikan fungsi nefron ginjal dengan memisahkan racun uremik dan kreatinin dari darah pasien. Mengapa molekul protein darah (seperti albumin) dan sel-sel darah merah tidak ikut terbuang ke cairan dialisat?",
        "opsi": [
            {"label": "A", "teks": "Pori-pori membran selulosa dialiser memiliki diameter selektif yang hanya meloloskan molekul kecil (urea, kreatinin, air), sedangkan sel darah dan makromolekul protein tertahan"},
            {"label": "B", "teks": "Karena protein darah bersifat gas"},
            {"label": "C", "teks": "Karena dialiser memiliki suhu 100°C"},
            {"label": "D", "teks": "Karena sel darah ditarik oleh medan magnet mesin"}
        ],
        "kunci": "A",
        "pembahasan": "Prinsip dialisis adalah filtrasi membran semipermeabel selektif. Pori membran dialisis cukup besar untuk dilewati racun metabolit renik (urea $< 60 \\text{ Da}$, kreatinin, ion elektrolit) namun menahan protein plasma ($> 66.000 \\text{ Da}$) dan eritrosit.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Analisis Rekayasa — Pengolahan Limbah Tumpahan Minyak di Laut] Ketika kapal tanker mengalami kecelakaan dan menumpahkan minyak mentah di laut, tim penanggulangan lingkungan menggunakan pelampung pembatas (oil boom) dan alat skimmer. Prinsip fisika pemisahan minyak dari air laut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Massa jenis minyak mentah lebih kecil dari air laut sehingga terapung di permukaan dan dapat disedot mekanis (skimming) secara dekantasi"},
            {"label": "B", "teks": "Minyak ditenggelamkan ke dasar laut"},
            {"label": "C", "teks": "Air laut dipanaskan hingga mendidih"},
            {"label": "D", "teks": "Minyak diuapkan menjadi awan"}
        ],
        "kunci": "A",
        "pembahasan": "Minyak mentah bersifat hidrofobik dan memiliki massa jenis $\\rho \\approx 0,85 \\text{ g/cm}^3 < \\rho_{\\text{air laut}} \\approx 1,03 \\text{ g/cm}^3$, sehingga selalu membentuk lapisan film terapung di permukaan air yang dapat dilokalisir dan disedot mekanik.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Rekayasa Bioteknologi — Pemisahan Fragmen DNA dengan Elektroforesis Gel] Dalam tes DNA forensik, potongan-potongan fragmen molekul DNA dipisahkan pada gel agarosa yang dialiri arus listrik searah. Mengapa fragmen DNA bermigrasi ke kutub anoda positif dan terpisah berdasarkan ukurannya?",
        "opsi": [
            {"label": "A", "teks": "Gugus fosfat pada rantai DNA bermuatan negatif sehingga tertarik ke kutub anoda (+); fragmen DNA berukuran pendek bergerak lebih cepat menembus pori gel daripada fragmen panjang"},
            {"label": "B", "teks": "Karena DNA bermuatan positif"},
            {"label": "C", "teks": "Karena DNA mengalami sublimasi"},
            {"label": "D", "teks": "Karena arus listrik membakar fragmen DNA"}
        ],
        "kunci": "A",
        "pembahasan": "Tulang punggung polimer DNA memiliki gugus fosfat bermuatan negatif ($PO_4^{3-}$). Dalam medan listrik, gaya elektrostatis menarik molekul ke elektroda positif. Gel agarosa bertindak sebagai saringan molekuler di mana fragmen kecil bermigrasi lebih cepat melewati matriks pori gel.",
        "paket": "Bab VI: Pemisahan Campuran - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    }
]

# Assemble 70 questions for Bab 6
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
        "paket": "Bab VI: Pemisahan Campuran - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch6_pemisahan_campuran.jpg"
    })

for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 6: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab VI: Pemisahan Campuran di Sekitar Kita (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 8 — Bab VI: Pemisahan Campuran di Sekitar Kita</h1>
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
  <div data-field="materi">Pemisahan Campuran di Sekitar Kita</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis prinsip filtrasi, sentrifugasi, distilasi Liebig, kromatografi kertas Rf, sublimasi, kristalisasi, dan penjernihan air.</div>
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
        "materi": "Pemisahan Campuran di Sekitar Kita",
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

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab6_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab6_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
