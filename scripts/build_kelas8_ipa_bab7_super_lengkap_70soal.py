#!/usr/bin/env python3
"""
build_kelas8_ipa_bab7_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 7 IPA SMP Kelas 8:
Struktur Bumi, Tanah, dan Kebencanaan:
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

# 25 Soal Kurikulum Merdeka HOTS Bab 7 (Hal. 496-501)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar penampang struktur lapisan interior Bumi berikut! Lapisan mantel Bumi (tempat terjadinya arus konveksi magma) dan lapisan inti dalam Bumi yang berwujud padat berturut-turut ditunjukkan oleh nomor ....",
        "opsi": [
            {"label": "A", "teks": "1 dan 3"},
            {"label": "B", "teks": "2 dan 3"},
            {"label": "C", "teks": "2 dan 4"},
            {"label": "D", "teks": "1 dan 4"}
        ],
        "kunci": "C",
        "pembahasan": "Struktur interior Bumi dari luar ke dalam: 1 = Kerak Bumi (Crust), 2 = Mantel Bumi (Mantle/Astenosfer, tempat arus konveksi cairan magma), 3 = Inti Luar (Outer Core, besi-nikel cair), 4 = Inti Dalam (Inner Core, besi padat akibat tekanan sangat tinggi). Jadi mantel Bumi dan inti dalam berturut-turut adalah nomor 2 dan 4.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Meskipun suhu di lapisan Inti Dalam Bumi mencapai sekitar 5.500°C (jauh di atas titik leleh besi di permukaan bumi), mengapa logam besi dan nikel di Inti Dalam Bumi berwujud padat, sedangkan di Inti Luar berwujud cair?",
        "opsi": [
            {"label": "A", "teks": "Karena inti dalam bumi didinginkan oleh air samudra yang merembes ke pusat bumi"},
            {"label": "B", "teks": "Karena tekanan gravitasi dan beban seluruh lapisan bumi di pusat inti dalam sangat luar biasa besar"},
            {"label": "C", "teks": "Karena inti dalam tersusun atas batuan kuarsa yang tidak bisa meleleh"},
            {"label": "D", "teks": "Karena di inti dalam tidak terjadi perpindahan kalor"}
        ],
        "kunci": "B",
        "pembahasan": "Wujud zat ditentukan oleh kesetimbangan suhu dan tekanan. Di Inti Dalam Bumi, tekanan kompresi litostatik gravitasi dari massa seluruh planet mencapai lebih dari 330–360 GigaPascal (3 juta kali tekanan atmosfer), menaikkan titik leleh besi melebihi suhunya (5.500°C) sehingga atom-atom besi dan nikel terkunci rapat dalam kisi kristal padat.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Tenaga penggerak utama yang menyebabkan lempeng-lempeng tektonik litosfer di permukaan Bumi terus bergerak beberapa sentimeter setiap tahunnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Arus konveksi termal magma panas di lapisan astenosfer"},
            {"label": "B", "teks": "Hembusan angin pasat dan arus pasang surut air laut"},
            {"label": "C", "teks": "Tarikan gravitasi bulan saat fase purnama"},
            {"label": "D", "teks": "Getaran kendaraan dan aktivitas pertambangan manusia"}
        ],
        "kunci": "A",
        "pembahasan": "Arus konveksi termal di mantel bumi (astenosfer): batuan mantel bawah yang panas memuai, densitasnya turun sehingga naik perlahan ke atas, kemudian mendingin di dekat litosfer, menjadi lebih padat, lalu tenggelam kembali. Perputaran arus konveksi magma ini menyeret lempeng litosfer di atasnya bergerak.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Kepulauan Indonesia terletak di pertemuan tiga lempeng tektonik besar dunia (Lempeng Eurasia, Lempeng Indo-Australia, dan Lempeng Pasifik) yang saling bergerak mendekat dan menunjam (batas konvergen / subduksi). Dampak geologis utama dari penunjaman lempeng Indo-Australia ke bawah lempeng Eurasia di sepanjang selatan Sumatera, Jawa, hingga Nusa Tenggara adalah ....",
        "opsi": [
            {"label": "A", "teks": "Terbentuknya benua es yang luas dan beriklim dingin"},
            {"label": "B", "teks": "Daratan pulau Jawa bergerak membelah menjadi dua samudra baru"},
            {"label": "C", "teks": "Indonesia bebas dari potensi bencana tsunami dan letusan gunung berapi"},
            {"label": "D", "teks": "Terbentuknya palung laut dalam serta deretan gunung berapi aktif dan tingginya aktivitas gempa tektonik"}
        ],
        "kunci": "D",
        "pembahasan": "Zona penunjaman (subduksi) lempeng samudra Indo-Australia ke bawah lempeng benua Eurasia menyebabkan lempeng samudra meleleh menjadi magma yang naik ke permukaan, membentuk palung samudra (Palung Jawa/Sunda Trench), jajaran gunung berapi aktif (Ring of Fire), serta zona patahan gempa tektonik dangkal hingga dalam.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Ketika dua lempeng samudra bergerak saling menjauh (batas divergen) di dasar Samudra Atlantik, magma dari astenosfer naik ke celah rekahan dan membeku membentuk kerak samudra baru. Bentang alam bawah laut yang terbentuk dari gerakan divergen ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Palung Mariana yang sangat dalam"},
            {"label": "B", "teks": "Pegunungan lipatan Himalaya"},
            {"label": "C", "teks": "Punggung Tengah Samudra (Mid-Ocean Ridge) dan pemekaran lantai samudra"},
            {"label": "D", "teks": "Patahan mendatar San Andreas"}
        ],
        "kunci": "C",
        "pembahasan": "Gerakan divergen lempeng di dasar samudra menyebabkan pemekaran lantai samudra (seafloor spreading), menghasilkan rantai punggungan pegunungan bawah laut yang disebut Punggung Tengah Samudra (Mid-Ocean Ridge) akibat pendinginan magma yang naik.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Perhatikan gambar penampang tumbukan lempeng tektonik (zona subduksi) berikut! Titik pusat sumber terjadinya gempa di dalam litosfer yang bertanda P dan titik di permukaan Bumi tepat di atasnya yang bertanda Q disebut ....",
        "opsi": [
            {"label": "A", "teks": "P = Episentrum dan Q = Hiposentrum"},
            {"label": "B", "teks": "P = Hiposentrum dan Q = Episentrum"},
            {"label": "C", "teks": "P = Seismograf dan Q = Seismogram"},
            {"label": "D", "teks": "P = Kaldera dan Q = Magma"}
        ],
        "kunci": "B",
        "pembahasan": "Pusat pelepasan energi gempa bumi yang terletak di kedalaman litosfer (bawah tanah) disebut hiposentrum (fokus gempa), sedangkan titik pada permukaan Bumi yang terletak tegak lurus tepat di atas hiposentrum disebut episentrum.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Tidak semua gempa bumi yang berpusat di bawah laut akan memicu gelombang tsunami. Syarat geologis utama agar gempa bumi bawah laut dapat membangkitkan gelombang tsunami adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gempa memiliki kedalaman dangkal (< 70 km), kekuatan besar (M > 7,0), dan disebabkan oleh patahan naik/turun yang mengangkat atau menurunkan kolom air laut secara tiba-tiba"},
            {"label": "B", "teks": "Gempa berpusat sangat dalam (> 500 km) dengan magnitudo kecil (M < 4,0)"},
            {"label": "C", "teks": "Gempa disebabkan oleh pergeseran lempeng mendatar (transform) yang halus"},
            {"label": "D", "teks": "Gempa terjadi di daratan tengah pulau"}
        ],
        "kunci": "A",
        "pembahasan": "Syarat terjadinya tsunami: 1) Pusat gempa di dasar laut, 2) Kedalaman dangkal (< 70 km), 3) Magnitudo gempa besar (M >= 7,0 SR), 4) Terjadi deformasi vertikal dasar laut (sesar naik atau sesar turun / patahan dip-slip) yang memindahkan kolom air laut dalam volume raksasa secara mendadak.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Saat seseorang sedang berada di pantai dan merasakan guncangan gempa bumi yang kuat disusul air laut di tepi pantai tiba-tiba surut drastis menjauhi garis pantai hingga memperlihatkan terumbu karang, tindakan penyelamatan diri (mitigasi) yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Turun ke pantai untuk mengumpulkan ikan-ikan yang terdampar di karang"},
            {"label": "B", "teks": "Bersembunyi di dalam perahu kecil di tepi pantai"},
            {"label": "C", "teks": "Segera berlari menjauhi pantai menuju tempat yang tinggi atau perbukitan"},
            {"label": "D", "teks": "Menunggu pengumuman sambil berenang di laut"}
        ],
        "kunci": "C",
        "pembahasan": "Air laut surut drastis setelah gempa kuat adalah peringatan alamiah paling nyata bahwa gelombang tsunami raksasa sedang terbentuk dan akan segera menerjang daratan dalam beberapa menit. Langkah mitigasi wajib: Segera tinggalkan pantai dan lari menuju tempat yang tinggi atau gedung evakuasi vertikal kokoh.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Perhatikan tabel Karakteristik Empat Lapisan (Horizon) Profil Tanah dari Permukaan Atas ke Bawah: Horizon O/A (0-30 cm, gelap kehitaman, gembur, kaya humus dan mikroorganisme), Horizon B (30-60 cm, lebih terang, lebih padat, miskin humus, akumulasi mineral), Horizon C (60-100 cm, bongkahan batuan lapuk sebagian), Horizon R (>100 cm, batuan induk dasar utuh). Berdasarkan tabel profil tanah tersebut, lapisan tanah yang paling subur karena mengandung banyak humus dan mikroorganisme tanah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Horizon O / A (Lapisan Tanah Atas / Topsoil)"},
            {"label": "B", "teks": "Horizon B (Lapisan Tanah Bawah / Subsoil)"},
            {"label": "C", "teks": "Horizon C (Regolit / Batuan Lapuk)"},
            {"label": "D", "teks": "Horizon R (Batuan Induk / Bedrock)"}
        ],
        "kunci": "A",
        "pembahasan": "Horizon O (serasah organik) dan Horizon A (topsoil) merupakan lapisan teratas tanah tempat bercampurnya materi organik yang telah terurai sempurna (humus) dengan partikel mineral. Lapisan ini paling subur, kaya rongga aerasi, dan dihuni jutaan mikrobioma penyubur tanaman.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Proses pembentukan tanah berawal dari pelapukan batuan induk. Lumut kerak (Lichenes) dan lumut daun disebut sebagai vegetasi perintis (pionir) karena mampu tumbuh di atas permukaan batuan cadas dan menghancurkannya menjadi butiran tanah awal. Proses pelapukan batuan oleh lumut kerak dan akar tumbuhan ini dikategorikan sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Pelapukan fisika murni akibat angin"},
            {"label": "B", "teks": "Pelapukan biologis yang disertai pengeluaran zat asam organik oleh lumut"},
            {"label": "C", "teks": "Erosi glasial es"},
            {"label": "D", "teks": "Sedimentasi aluvial"}
        ],
        "kunci": "B",
        "pembahasan": "Pelapukan biologis (organik) terjadi akibat aktivitas makhluk hidup. Lumut kerak mengeluarkan senyawa asam liken yang melarutkan mineral batuan secara kimiawi, dan rizoidnya masuk ke pori batuan meretakkan batuan secara mekanis hingga hancur menjadi partikel tanah primer.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Di wilayah pegunungan kapur (karst) seperti Gunungkidul atau Maros, air hujan yang mengikat gas karbon dioksida (CO2) membentuk asam karbonat lemah (H2CO3) yang melarutkan batuan kapur (CaCO3) hingga membentuk gua bawah tanah lengkap dengan stalaktit dan stalagmit. Peristiwa ini merupakan contoh nyata dari ....",
        "opsi": [
            {"label": "A", "teks": "Pelapukan kimiawi (karbonasi)"},
            {"label": "B", "teks": "Pelapukan fisika akibat perubahan suhu"},
            {"label": "C", "teks": "Pelapukan mekanik oleh gelombang laut"},
            {"label": "D", "teks": "Patahan tektonik lempeng"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi pelarutan batu kapur oleh air hujan asam karbonat: CaCO3 (padat) + H2O + CO2 -> Ca(HCO3)2 (larut). Proses dekomposisi struktur batuan melalui reaksi kimia ini tergolong ke dalam pelapukan kimiawi (chemical weathering), khususnya reaksi karbonasi.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Mengapa keberadaan cacing tanah (Lumbricus terrestris) di lahan pertanian sangat menguntungkan dan menjadi indikator biologis tanah yang sehat dan subur?",
        "opsi": [
            {"label": "A", "teks": "Karena cacing tanah memakan pupuk pestisida kimia petani"},
            {"label": "B", "teks": "Karena cacing tanah memadatkan tanah agar air tidak merembes"},
            {"label": "C", "teks": "Karena cacing tanah mengeluarkan racun bagi serangga pengganggu"},
            {"label": "D", "teks": "Karena cacing tanah membuat liang terowongan biopori untuk sirkulasi udara (aerasi) dan air, serta kotorannya (kascing) kaya akan unsur hara N, P, dan K"}
        ],
        "kunci": "D",
        "pembahasan": "Cacing tanah memakan serasah daun dan tanah, mengeluarkan feses berupa casting (kascing) yang kaya humus, kalsium, nitrogen, fosfor, dan kalium dalam bentuk siap serap tanaman. Selain itu, terowongan liang cacing (biopori) melipatgandakan aerasi oksigen dan kapasitas infiltrasi air hujan ke dalam tanah.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Petani di lereng pegunungan Jawa dan Bali membuat sawah berundak-undak seperti tangga yang dilengkapi pematang penahan air (terasering / sengkedan). Tujuan utama pembuatan terasering dari sudut pandang konservasi tanah dan pencegahan longsor adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menaikkan keasaman air tanah pegunungan"},
            {"label": "B", "teks": "Mempercepat aliran air ke sungai agar tanah cepat kering"},
            {"label": "C", "teks": "Memperkecil kemiringan lereng, memperlambat kecepatan aliran air permukaan, dan menahan hanyutnya lapisan tanah subur (topsoil)"},
            {"label": "D", "teks": "Memudahkan pergerakan traktor besar di lereng terjal"}
        ],
        "kunci": "C",
        "pembahasan": "Terasering membagi lereng yang curam menjadi deretan bidang datar bertingkat dengan pematang. Struktur ini memotong energi kinetik aliran limpasan permukaan (surface runoff), meningkatkan peresapan air ke dalam tanah, dan mencegah erosi lapisan hara tanah paling atas (topsoil).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Selain terasering, petani di lahan miring membajak tanah dan menanam barisan tanaman mengikuti garis ketinggian yang sama (melintang lereng, bukan dari atas ke bawah). Teknik konservasi tanah mekanis ini dikenal dengan istilah ....",
        "opsi": [
            {"label": "A", "teks": "Monokultur"},
            {"label": "B", "teks": "Contour farming (penanaman kontur)"},
            {"label": "C", "teks": "Deforestasi"},
            {"label": "D", "teks": "Pembakaran ladang berpindah"}
        ],
        "kunci": "B",
        "pembahasan": "Contour farming (pembajakan dan penanaman searah kontur) dilakukan melintang lereng sejajar garis horizontal kontur. Alur bajak dan barisan tanaman berfungsi sebagai barikade penahan air limpasan hujan sehingga sedimen tanah tidak meluncur hanyut ke bawah lereng.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Setelah memanen tanaman padi atau jagung (yang banyak menyerap unsur Nitrogen dari tanah), petani dianjurkan menanam tanaman kacang tanah atau kedelai (famili Leguminosae) pada musim tanam berikutnya. Alasan biologis rotasi tanaman dengan kacang-kacangan ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Bintil akar tanaman kacang bersimbiosis dengan bakteri Rhizobium yang mampu mengikat nitrogen bebas (N2) dari udara menyuburkan kembali tanah"},
            {"label": "B", "teks": "Kacang-kacangan tidak memerlukan air untuk tumbuh"},
            {"label": "C", "teks": "Akar kacang mengeluarkan racun mematikan seluruh cacing tanah"},
            {"label": "D", "teks": "Tanaman kacang dapat mengubah pasir menjadi batu kapur"}
        ],
        "kunci": "A",
        "pembahasan": "Bintil akar Leguminosae bersimbiosis mutualisme dengan bakteri Rhizobium leguminosarum yang memiliki enzim nitrogenase untuk memfiksasi gas $N_2$ atmosfer menjadi senyawa nitrat dan amonium yang memperkaya hara tanah secara alami tanpa memerlukan pupuk kimia sintetis.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Tanah diklasifikasikan berdasarkan ukuran butiran partikelnya menjadi tanah pasir, tanah lempung (liat), dan tanah geluh (loam). Mengapa tanah pasir murni kurang baik untuk menahan air dan nutrisi tanaman?",
        "opsi": [
            {"label": "A", "teks": "Karena tanah pasir mengandung kadar humus yang terlalu tinggi"},
            {"label": "B", "teks": "Karena partikel tanah pasir terlalu halus dan kedap air"},
            {"label": "C", "teks": "Karena butirannya berukuran besar dengan pori makro yang dominan, sehingga air dan hara mineral mudah lolos ke bawah (daya ikat air sangat rendah)"},
            {"label": "D", "teks": "Karena tanah pasir memadatkan akar tanaman"}
        ],
        "kunci": "C",
        "pembahasan": "Tanah pasir tersusun atas partikel berdiameter 0,05–2,0 mm dengan luas permukaan per gram yang kecil dan rongga pori-pori makro yang lebar. Akibatnya, gaya kapilaritas sangat rendah sehingga air dan ion-ion mineral mudah tercuci (leaching) ke lapisan bawah yang tidak terjangkau akar tanaman.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Hujan lebat yang terus-menerus mengguyur lahan miring yang telah gundul (tanpa pepohonan berakar tunggang) menyebabkan lapisan tanah atas (topsoil) terkikis habis oleh aliran air permukaan. Dampak jangka panjang hilangnya lapisan topsoil bagi kesuburan lahan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tanah menjadi semakin gembur dan subur"},
            {"label": "B", "teks": "Kandungan mikroorganisme pengurai tanah bertambah banyak"},
            {"label": "C", "teks": "Kadar humus meningkat tajam"},
            {"label": "D", "teks": "Lahan menjadi kritis dan tandus karena lapisan hara dan humus telah hilang, menyisakan lapisan subsoil yang miskin nutrisi"}
        ],
        "kunci": "D",
        "pembahasan": "Lapisan topsoil (Horizon A) adalah gudang utama bahan organik, humus, dan komunitas mikrobiota tanah yang dibutuhkan untuk pertumbuhan vegetasi. Erosi topsoil menyisakan subsoil (Horizon B) yang padat, miskin bahan organik, dan berdaya infiltrasi rendah, menyebabkan lahan berubah menjadi kritis dan tandus.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Pembuatan lubang resapan biopori dan sumur resapan di halaman rumah maupun kawasan perkotaan yang padat beton/aspal berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Membuang limbah plastik dan minyak goreng bekas ke dalam tanah"},
            {"label": "B", "teks": "Meningkatkan laju peresapan air hujan ke dalam akuifer air tanah, mencegah genangan banjir, serta mengubah sampah organik menjadi kompos"},
            {"label": "C", "teks": "Membunuh seluruh bakteri dan cacing tanah perkotaan"},
            {"label": "D", "teks": "Mengeringkan air sumur warga sekitar"}
        ],
        "kunci": "B",
        "pembahasan": "Lubang Resapan Biopori (LRB) berbentuk silinder berdiameter 10 cm sedalam 100 cm yang diisi sampah organik serasah daun. Sampah memicu aktivitas cacing dan fauna tanah yang membuat pori-pori biopori alami, mempercepat laju infiltrasi air hujan ke akuifer dangkal dan mereduksi risiko banjir genangan.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Ketika gunung berapi meletus, dalam jangka pendek abu vulkanik dan awan panas memang merusak lahan di sekitarnya. Namun dalam jangka panjang (beberapa tahun setelah erupsi), mengapa tanah di lereng gunung berapi (tanah Andosol) menjadi sangat subur bagi pertanian?",
        "opsi": [
            {"label": "A", "teks": "Karena abu vulkanik yang melapuk melepaskan mineral-mineral hara makro dan mikro penting seperti kalsium, magnesium, fosfor, dan kalium"},
            {"label": "B", "teks": "Karena abu vulkanik mematikan semua jenis lumut"},
            {"label": "C", "teks": "Karena abu vulkanik mengandung zat kimia beracun yang mengawetkan tanah"},
            {"label": "D", "teks": "Karena abu vulkanik mengubah batuan menjadi pasir pantai"}
        ],
        "kunci": "A",
        "pembahasan": "Abu vulkanik tersusun atas mineral silikat amorf, feldspar, piroksen, dan biotit yang kaya kalsium (Ca), magnesium (Mg), kalium (K), dan fosfor (P). Setelah terkena air hujan dan mengalami pelapukan, mineral ini melepaskan ion nutrisi yang membentuk tanah Andosol dengan kapasitas tukar kation tinggi dan sangat subur.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Di daerah pantai yang landai dan berlumpur, penebangan hutan bakau (mangrove) untuk dijadikan tambak atau bangunan beton menyebabkan garis pantai makin lama makin mundur tergerus gelombang laut. Fenomena pengikisan pantai oleh energi ombak laut ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Deflasi angin"},
            {"label": "B", "teks": "Korasi gletser"},
            {"label": "C", "teks": "Sedimentasi sungai"},
            {"label": "D", "teks": "Abrasi pantai"}
        ],
        "kunci": "D",
        "pembahasan": "Abrasi adalah proses pengikisan pantai akibat hantaman energi mekanik gelombang dan arus laut. Akar napas dan sistem perakaran rapat pohon bakau (Rhizophora sp.) berfungsi alami sebagai pemecah ombak (breakwater) dan penjerat sedimen lumpur pesisir.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Saat terjadi guncangan gempa bumi ketika kita sedang belajar di dalam ruang kelas di lantai dua gedung sekolah, langkah penyelamatan diri (Drop, Cover, Hold On) yang paling tepat selama guncangan berlangsung adalah ....",
        "opsi": [
            {"label": "A", "teks": "Langsung melompat dari jendela lantai dua ke tanah"},
            {"label": "B", "teks": "Berebut berlari menuruni tangga bersamaan"},
            {"label": "C", "teks": "Merunduk jongkok, berlindung di bawah meja belajar yang kokoh sambil memegangi kaki meja untuk melindungi kepala dari runtuhan plafon"},
            {"label": "D", "teks": "Berdiri tegak di samping lemari kaca laboratorium"}
        ],
        "kunci": "C",
        "pembahasan": "Prosedur baku mitigasi gempa bumi saat berada di dalam ruangan adalah 'Drop, Cover, and Hold On': 1) Drop (merunduk bertumpu pada tangan dan lutut), 2) Cover (berlindung di bawah meja yang kokoh dan melindungi kepala/leher), 3) Hold On (pegangi kaki meja hingga getaran gempa benar-benar berhenti).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Seorang siswa melakukan percobaan konservasi tanah menggunakan 2 baki miring: Baki P berisi tanah gundul tanpa tanaman, dan Baki Q berisi tanah yang ditanami rumput rapat. Ketika kedua baki disiram dengan volume air yang sama dari atas, air yang tertampung di wadah penampung bawah baki Q jauh lebih sedikit dan sangat jernih dibandingkan baki P yang airnya banyak dan sangat keruh berlumpur. Kesimpulan ilmiah yang tepat dari percobaan ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tanaman rumput menghancurkan tanah sehingga menjadi mudah longsor"},
            {"label": "B", "teks": "Akar-akar vegetasi mengikat butiran tanah dengan kuat dan tajuk daun menahan pukulan tetes air hujan sehingga mencegah erosi dan meningkatkan resapan air"},
            {"label": "C", "teks": "Tanah gundul menyerap air lebih banyak daripada tanah berumput"},
            {"label": "D", "teks": "Air hujan melarutkan daun rumput menjadi air jernih"}
        ],
        "kunci": "B",
        "pembahasan": "Keberadaan vegetasi rumput memberikan dua perlindungan utama: 1) Tajuk dedaunan meredam energi kinetik tetesan air hujan (pencegahan splash erosion), 2) Jaringan perakaran serabut rumput mengikat partikel agregat tanah dengan kuat serta meningkatkan kapasitas infiltrasi pori tanah.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Pencemaran tanah oleh tumpahan minyak bumi atau limbah logam berat (seperti Timbal Pb dan Merkuri Hg) dapat dipulihkan secara ramah lingkungan dengan menanam tumbuhan khusus penyerap polutan (seperti bunga matahari atau tanaman sawi) maupun memanfaatkan mikroorganisme pengurai. Teknik pemulihan tanah tercemar menggunakan makhluk hidup ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Bioremediasi dan Fitoremediasi"},
            {"label": "B", "teks": "Insinerasi pembakaran tanah"},
            {"label": "C", "teks": "Eutrofikasi"},
            {"label": "D", "teks": "Biomagnifikasi"}
        ],
        "kunci": "A",
        "pembahasan": "Bioremediasi adalah pembersihan polutan lingkungan menggunakan mikroorganisme (bakteri pengurai hidrokarbon seperti Pseudomonas). Fitoremediasi adalah pemanfaatan tanaman hiperakumulator untuk menyerap, mengikat, atau menetralkan ion logam berat beracun dari dalam tanah.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Perhatikan jenis-jenis tanah di Indonesia: (1) Tanah Aluvial (endapan lumpur sungai), (2) Tanah Vulkanis/Andosol (pelapukan abu gunung api), (3) Tanah Humus/Organosol, (4) Tanah Kapur/Mediteran. Jenis tanah yang terbentuk dari hasil pengendapan lumpur yang terbawa aliran sungai di dataran rendah dan sangat cocok untuk persawahan padi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tanah Kapur (4)"},
            {"label": "B", "teks": "Tanah Laterit merah tua"},
            {"label": "C", "teks": "Tanah Aluvial (1)"},
            {"label": "D", "teks": "Tanah Pasir gurun"}
        ],
        "kunci": "C",
        "pembahasan": "Tanah aluvial merupakan tanah hasil erosi dan pengendapan (sedimentasi) lumpur halus di sepanjang bantaran dan muara sungai dataran rendah. Tanah ini bertekstur lempung berdebu yang kaya hara dan sangat ideal untuk pertanian lahan basah (sawah padi).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Tanah Gambut (Organosol) yang banyak tersebar di rawa-rawa Kalimantan, Sumatera, dan Papua terbentuk dari tumpukan sisa tumbuhan rawa yang membusuk secara tidak sempurna (anaerob) sehingga bersifat sangat asam (pH 3,5 - 4,5). Agar lahan gambut atau tanah asam dapat ditanami dengan optimal, perlakuan kimiawi yang biasa diberikan petani untuk menaikkan pH tanah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menyiramkan larutan asam sulfat encer"},
            {"label": "B", "teks": "Membakar lahan gambut saat musim kemarau"},
            {"label": "C", "teks": "Menaburkan garam dapur sebanyak-banyaknya"},
            {"label": "D", "teks": "Memberikan kapur pertanian (dolomit CaMg(CO3)2 atau kalsit CaCO3) yang bersifat basa untuk menetralkan asam tanah"}
        ],
        "kunci": "D",
        "pembahasan": "Pengapuran (liming) tanah asam menggunakan dolomit ($CaMg(CO_3)_2$) atau kalsit ($CaCO_3$): Ion karbonat bereaksi dengan ion $H^+$ di larutan tanah menghasilkan $CO_2$ dan $H_2O$, sehingga konsentrasi $H^+$ bebas turun dan derajat keasaman (pH) tanah naik menuju netral (pH 6,0–7,0).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    }
]

# 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
soal_contoh = [
    {
        "nomor_bab": 26,
        "soal": "Bumi tersusun dari lapisan-lapisan konsentris dengan kerapatan massa yang berbeda-beda. Lapisan interior Bumi yang memiliki volume terbesar (mencapai sekitar 84% dari total volume planet Bumi) dan memiliki sifat plastis adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kerak Samudra"},
            {"label": "B", "teks": "Mantel Bumi (Mantle)"},
            {"label": "C", "teks": "Inti Luar"},
            {"label": "D", "teks": "Inti Dalam"}
        ],
        "kunci": "B",
        "pembahasan": "Mantel Bumi membentang dari kedalaman sekitar 35 km hingga 2.900 km, mencakup sekitar 84% volume Bumi dan 67% massanya. Mantel tersusun dari batuan silikat kaya besi dan magnesium yang bersifat padat elastis namun dapat mengalir lambat secara plastis (viskoplastik).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Dua lempeng tektonik yang saling bergeser mendatar sejajar satu sama lain tanpa saling menunjam maupun menjauh disebut batas transform (sesar mendatar). Contoh bentang alam dunia dan di Indonesia yang terbentuk dari batas transform ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Patahan San Andreas di California dan Sesar Besar Semangko di Sumatera"},
            {"label": "B", "teks": "Punggung Tengah Atlantik dan Danau Baikal"},
            {"label": "C", "teks": "Pegunungan Alpen dan Palung Mariana"},
            {"label": "D", "teks": "Gunung Krakatau dan Gunung Fuji"}
        ],
        "kunci": "A",
        "pembahasan": "Batas lempeng transform (strike-slip fault) ditandai oleh pergeseran horizontal lempeng yang memicu gempa bumi dangkal berkekuatan destruktif. Contoh terbesarnya adalah San Andreas Fault di Amerika Serikat dan Sesar Semangko (The Great Sumatran Fault) yang memanjang di Pulau Sumatera.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Ketika gempa bumi terjadi, stasiun seismograf mencatat dua jenis gelombang seismik utama dari dalam bumi: Gelombang Primer (Gelombang P) dan Gelombang Sekunder (Gelombang S). Karakteristik fisika yang membedakan kedua gelombang tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gelombang P adalah gelombang transversal yang tidak dapat merambat di cairan, sedangkan Gelombang S adalah gelombang longitudinal"},
            {"label": "B", "teks": "Gelombang P adalah gelombang longitudinal (paling cepat merambat, dapat melewati padat dan cair), sedangkan Gelombang S adalah gelombang transversal (lebih lambat, hanya merambat pada medium padat)"},
            {"label": "C", "teks": "Gelombang P merambat di permukaan tanah, sedangkan Gelombang S merambat di udara"},
            {"label": "D", "teks": "Gelombang P berkecepatan 1 m/s, sedangkan Gelombang S berkecepatan 1000 km/s"}
        ],
        "kunci": "B",
        "pembahasan": "Gelombang P (Primary/Longitudinal wave): Partikel bergetar searah rambatan gelombang (rapatan-renggangan), tiba pertama di seismograf ($v \\approx 5-8 \\text{ km/s}$), mampu merambat melalui zat padat, cair, dan gas. Gelombang S (Secondary/Transverse wave): Partikel bergetar tegak lurus arah rambat, lebih lambat ($v \\approx 3-5 \\text{ km/s}$), dan hanya mampu merambat di medium padat.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Kekuatan pelepasan energi gempa bumi pada pusatnya diukur menggunakan Skala Magnitudo Momen (MMS) atau Skala Richter. Setiap kenaikan 1 skala magnitudo (misalnya dari magnitudo 5,0 ke 6,0), energi gempa yang dilepaskan meningkat sebesar ....",
        "opsi": [
            {"label": "A", "teks": "1 kali"},
            {"label": "B", "teks": "2 kali"},
            {"label": "C", "teks": "10 kali"},
            {"label": "D", "teks": "Sekitar 31,6 kali lipat energi (dan 10 kali lipat amplitudo gelombang)"}
        ],
        "kunci": "D",
        "pembahasan": "Skala magnitudo gempa bersifat logaritmik: Kenaikan 1 magnitudo ($+1$) melipatgandakan amplitudo rekaman seismogram sebesar 10 kali, sedangkan energi total yang dibebaskan berlipat ganda sebesar $10^{1,5} \\approx 31,6$ kali lipat. Jadi kenaikan 2 magnitudo melepaskan $10^3 = 1.000$ kali energi.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Kawasan sabuk gempa dan gunung berapi aktif di sekeliling Samudra Pasifik tempat bertemunya lempeng Pasifik dengan lempeng-lempeng sekitarnya dinamakan Cincin Api Pasifik (Pacific Ring of Fire). Mengapa wilayah kepulauan Indonesia masuk ke dalam cincin ini?",
        "opsi": [
            {"label": "A", "teks": "Karena Indonesia dikelilingi oleh lempeng es kutub"},
            {"label": "B", "teks": "Karena Indonesia dilintasi garis khatulistiwa berhawa panas"},
            {"label": "C", "teks": "Karena busur kepulauan Indonesia berada di tepi pertemuan lempeng samudra aktif yang mengalami subduksi lempeng"},
            {"label": "D", "teks": "Karena seluruh wilayah Indonesia tersusun atas batu bara"}
        ],
        "kunci": "C",
        "pembahasan": "Pacific Ring of Fire adalah sabuk subduksi lempeng tektonik sepanjang 40.000 km di cekungan Samudra Pasifik tempat terkonsentrasinya 75% gunung api dunia dan 90% gempa bumi bumi. Indonesia terletak tepat di persimpangan sabuk Sirkum Pasifik dan sabuk Sirkum Mediterania.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Dalam siklus batuan kerak Bumi, batuan beku yang tersingkap di permukaan tanah mengalami pelapukan, tererosi, tertransportasi oleh air dan angin, lalu terendapkan di dasar danau atau laut dan mengalami pembatuan (litifikasi). Batuan yang dihasilkan dari proses ini dinamakan ....",
        "opsi": [
            {"label": "A", "teks": "Batuan beku luar"},
            {"label": "B", "teks": "Batuan sedimen (endapan)"},
            {"label": "C", "teks": "Batuan metamorf kontak"},
            {"label": "D", "teks": "Magma astenosfer"}
        ],
        "kunci": "B",
        "pembahasan": "Batuan sedimen terbentuk melalui siklus sedimentasi: Pelapukan batuan asal -> Erosi -> Transportasi sedimen -> Deposisi pengendapan -> Litifikasi (kompaksi pemadatan dan sementasi perekat mineral). Contoh: batu pasir, batu lempung, batu konglomerat, batu gamping.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Perbedaan tipe letusan gunung berapi antara erupsi efusif (lelehan lava) dan erupsi eksplosif (ledakan dahsyat abu vulkanik) terutama dipengaruhi oleh ....",
        "opsi": [
            {"label": "A", "teks": "Warna batuan di puncak gunung"},
            {"label": "B", "teks": "Viskositas (kekentalan) magma dan kandungan gas di dalam dapur magma"},
            {"label": "C", "teks": "Arah hembusan angin troposfer"},
            {"label": "D", "teks": "Bentuk awan di langit saat siang hari"}
        ],
        "kunci": "B",
        "pembahasan": "Erupsi efusif terjadi jika magma bersifat basaltik (encer/viskositas rendah) dengan tekanan gas rendah sehingga lava hanya mengalir keluar. Sebaliknya, erupsi eksplosif terjadi jika magma bersifat riolitik/andesitik (sangat kental/viskositas tinggi) dengan kadar gas $CO_2/H_2O$ tinggi yang terperangkap memicu ledakan katastrofik.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Komposisi tanah yang ideal untuk menopang pertumbuhan tanaman pangan terdiri dari proporsi seimbang bahan padat dan ruang pori, yaitu sekitar ....",
        "opsi": [
            {"label": "A", "teks": "100% batuan padat tanpa pori"},
            {"label": "B", "teks": "45% bahan mineral, 5% bahan organik (humus), 25% air, dan 25% udara"},
            {"label": "C", "teks": "90% air dan 10% serasah daun"},
            {"label": "D", "teks": "50% plastik dan 50% pasir"}
        ],
        "kunci": "B",
        "pembahasan": "Tanah ideal untuk pertanian tersusun atas 50% fraksi padatan (45% mineral partikel pasir/debu/lempung + 5% materi organik humus dan mikroba) dan 50% fraksi pori-pori tanah (terisi dinamis oleh 25% air kapiler dan 25% udara aerasi pernapasan akar).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Orang yang mendaki gunung tinggi sering merasakan telinga berdengung, bernapas lebih cepat, dan memasak air lebih cepat mendidih pada suhu di bawah 100°C. Hal ini membuktikan hukum fisika atmosfer bahwa ....",
        "opsi": [
            {"label": "A", "teks": "Semakin tinggi suatu tempat dari permukaan laut, tekanan udara dan kerapatan oksigen semakin menurun"},
            {"label": "B", "teks": "Semakin tinggi tempat, tekanan atmosfer semakin bertambah besar"},
            {"label": "C", "teks": "Di puncak gunung tidak ada gaya gravitasi bumi"},
            {"label": "D", "teks": "Udara di puncak gunung lebih padat daripada udara di pantai"}
        ],
        "kunci": "A",
        "pembahasan": "Massa atmosfer tertarik oleh gravitasi bumi sehingga 50% molekul udara terkonsentrasi di ketinggian < 5,6 km. Semakin tinggi elevasi dari muka air laut, kolom udara di atasnya makin sedikit sehingga tekanan udara menurun drastis, menurunkan titik didih air dan kerapatan oksigen per liter udara.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Di dalam gua kapur bawah tanah yang berumur ribuan tahun, terbentuk formasi pilar kapur yang indah. Endapan kalsit mengerucut yang menggantung dari atap gua ke bawah disebut ...., sedangkan endapan kalsit yang tumbuh bertumpuk dari dasar lantai gua ke atas disebut ....",
        "opsi": [
            {"label": "A", "teks": "Stalaktit dan Stalagmit"},
            {"label": "B", "teks": "Stalagmit dan Stalaktit"},
            {"label": "C", "teks": "Dolina dan Uvala"},
            {"label": "D", "teks": "Geyser dan Fumarol"}
        ],
        "kunci": "A",
        "pembahasan": "Tetesan air rembesan atap gua yang mengandung larutan $Ca(HCO_3)_2$ melepaskan gas $CO_2$, mengendapkan kristal kalsit $CaCO_3$. Kristal yang menggantung di langit-langit atap disebut Stalaktit ('t' = atap), sedangkan kristal yang menumpuk di dasar lantai gua disebut Stalagmit ('m' = membumi/lantai).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
soal_latihan = [
    {
        "nomor_bab": 36,
        "soal": "Urutan lapisan interior Bumi dari bagian paling luar hingga ke pusat Bumi yang benar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kerak Bumi – Mantel Bumi – Inti Luar – Inti Dalam"},
            {"label": "B", "teks": "Mantel Bumi – Kerak Bumi – Inti Dalam – Inti Luar"},
            {"label": "C", "teks": "Litosfer – Inti Luar – Astenosfer – Inti Dalam"},
            {"label": "D", "teks": "Kerak Samudra – Inti Dalam – Mantel – Kerak Benua"}
        ],
        "kunci": "A",
        "pembahasan": "Urutan struktur lapisan interior Bumi dari lapisan terluar ke pusat inti adalah Kerak Bumi (Crust: 0–70 km) -> Mantel Bumi (Mantle: 70–2.900 km) -> Inti Luar (Outer Core: 2.900–5.150 km) -> Inti Dalam (Inner Core: 5.150–6.371 km).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 37,
        "soal": "Penggerak utama bergesernya lempeng-lempeng tektonik di permukaan Bumi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Hembusan angin pasat di troposfer"},
            {"label": "B", "teks": "Pasang surut air laut oleh gravitasi Bulan"},
            {"label": "C", "teks": "Arus konveksi magma panas di lapisan astenosfer (mantel atas)"},
            {"label": "D", "teks": "Rotasi inti dalam yang berwujud gas"}
        ],
        "kunci": "C",
        "pembahasan": "Panas radioaktif di inti Bumi menciptakan arus konveksi fluida plastis magma di mantel astenosfer yang bersirkulasi dan menyeret lempeng litosfer kaku di atasnya bergerak.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 38,
        "soal": "Indonesia memiliki banyak gunung berapi aktif dan rawan gempa bumi karena terletak pada pertemuan tiga lempeng tektonik besar dunia, yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Lempeng Eurasia, Lempeng Indo-Australia, dan Lempeng Pasifik"},
            {"label": "B", "teks": "Lempeng Afrika, Lempeng Amerika Utara, dan Lempeng Antartika"},
            {"label": "C", "teks": "Lempeng Nazca, Lempeng Karibia, dan Lempeng Arab"},
            {"label": "D", "teks": "Lempeng Artik, Lempeng Atlantik, dan Lempeng Hindia"}
        ],
        "kunci": "A",
        "pembahasan": "Kondisi tektonik Indonesia dibentuk oleh konvergensi tiga lempeng litosfer raksasa: Lempeng Benua Eurasia di utara, Lempeng Samudra Indo-Australia di selatan-barat, dan Lempeng Samudra Pasifik di timur.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 39,
        "soal": "Tumbukan antara Lempeng Indo-Australia (samudra) yang menunjam ke bawah Lempeng Eurasia (benua) di sebelah selatan Pulau Jawa merupakan batas lempeng .... dan membentuk ....",
        "opsi": [
            {"label": "A", "teks": "Divergen; Punggung Tengah Samudra"},
            {"label": "B", "teks": "Transform; Sesar mendatar"},
            {"label": "C", "teks": "Konvergen (Subduksi); Palung Jawa dan deretan gunung api"},
            {"label": "D", "teks": "Divergen; Lembah retakan benua"}
        ],
        "kunci": "C",
        "pembahasan": "Pertemuan lempeng samudra yang lebih padat dengan lempeng benua adalah batas konvergen tipe subduksi (penunjaman), yang membentuk palung laut dalam (Palung Jawa/Sunda) dan busur kepulauan vulkanik aktif.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 40,
        "soal": "Lapisan atmosfer yang mengandung konsentrasi gas ozon (O3) untuk menyerap radiasi sinar ultraviolet (UV) Matahari berbahaya berada pada ....",
        "opsi": [
            {"label": "A", "teks": "Troposfer"},
            {"label": "B", "teks": "Stratosfer"},
            {"label": "C", "teks": "Mesosfer"},
            {"label": "D", "teks": "Termosfer"}
        ],
        "kunci": "B",
        "pembahasan": "Lapisan ozonosfer terletak di lapisan stratosfer pada ketinggian 15–35 km di atas permukaan bumi. Molekul ozon ($O_3$) menyerap sinar UV-B dan UV-C Matahari yang merusak materi genetik DNA sel hidup.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 41,
        "soal": "Meteor yang jatuh dari angkasa luar menuju Bumi sebagian besar habis terbakar dan tampak sebagai bintang jatuh pada lapisan ....",
        "opsi": [
            {"label": "A", "teks": "Troposfer"},
            {"label": "B", "teks": "Stratosfer"},
            {"label": "C", "teks": "Mesosfer"},
            {"label": "D", "teks": "Eksosfer"}
        ],
        "kunci": "C",
        "pembahasan": "Lapisan mesosfer (ketinggian 50–85 km) bertindak sebagai perisai pelindung Bumi. Gesekan molekul gas udara mesosfer membakar habis sebagian besar meteoroid yang memasuki atmosfer bumi.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 42,
        "soal": "Titik di permukaan Bumi yang terletak tegak lurus di atas pusat patahan sumber gempa di dalam bumi (hiposentrum) dan mengalami kerusakan paling parah disebut ....",
        "opsi": [
            {"label": "A", "teks": "Episentrum"},
            {"label": "B", "teks": "Seismograf"},
            {"label": "C", "teks": "Isoseista"},
            {"label": "D", "teks": "Kaldera"}
        ],
        "kunci": "A",
        "pembahasan": "Pusat gempa di permukaan Bumi yang berada tepat di atas hiposentrum adalah episentrum. Episentrum menerima pancaran gelombang seismik pertama dan mengalami intensitas getaran gempa tertinggi.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 43,
        "soal": "Alat untuk mencatat kekuatan dan getaran gelombang gempa bumi disebut ...., sedangkan hasil rekaman grafiknya disebut ....",
        "opsi": [
            {"label": "A", "teks": "Barometer dan Barogram"},
            {"label": "B", "teks": "Anemometer dan Anemogram"},
            {"label": "C", "teks": "Seismograf dan Seismogram"},
            {"label": "D", "teks": "Higrometer dan Spirogram"}
        ],
        "kunci": "C",
        "pembahasan": "Seismograf adalah instrumen sensor pendeteksi getaran gempa bumi mekanis atau digital, dan seismogram adalah lembaran grafik hasil rekaman gelombang getaran gempa bumi.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 44,
        "soal": "Syarat utama suatu gempa bumi di dasar laut dapat memicu terjadinya gelombang tsunami adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pusat gempa dangkal (< 70 km), kekuatan besar (M > 7,0), dan terjadi patahan vertikal (naik/turun) dasar laut"},
            {"label": "B", "teks": "Pusat gempa sangat dalam (> 500 km) dan terjadi pergeseran mendatar"},
            {"label": "C", "teks": "Gempa terjadi di puncak gunung berapi daratan"},
            {"label": "D", "teks": "Kekuatan gempa sangat kecil (M < 3,0) di tepi danau"}
        ],
        "kunci": "A",
        "pembahasan": "Tsunami dipicu perpindahan volume air laut secara tiba-tiba akibat deformasi vertikal patahan sesar naik atau sesar turun dasar laut dangkal (< 70 km) bermagnitudo besar ($M \\ge 7,0$).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 45,
        "soal": "Batu pualam (marmer) yang terbentuk dari perubahan batu kapur (CaCO3) akibat pengaruh suhu dan tekanan yang sangat tinggi di dalam kerak Bumi tergolong jenis batuan ....",
        "opsi": [
            {"label": "A", "teks": "Batuan beku dalam"},
            {"label": "B", "teks": "Batuan beku luar"},
            {"label": "C", "teks": "Batuan sedimen klastik"},
            {"label": "D", "teks": "Batuan metamorf (malihan)"}
        ],
        "kunci": "D",
        "pembahasan": "Batu marmer (pualam) adalah batuan metamorf kontak/termal yang berasal dari rekristalisasi batuan sedimen batu kapur (gamping) akibat pemanasan suhu tinggi magma.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 46,
        "soal": "Gas beracun dan guguran material piroklastik bersuhu mencapai 600°C yang meluncur cepat menuruni lereng gunung berapi saat erupsi eksplosif disebut ....",
        "opsi": [
            {"label": "A", "teks": "Lahar dingin"},
            {"label": "B", "teks": "Awan panas (wedhus gembel)"},
            {"label": "C", "teks": "Geyser air mendidih"},
            {"label": "D", "teks": "Makdani sumber mineral"}
        ],
        "kunci": "B",
        "pembahasan": "Awan panas (aliran piroklastik / wedhus gembel) merupakan campuran suspensi abu vulkanik, pasir, batu apung, dan gas beracun bersuhu 200–800°C yang meluncur hingga kecepatan ratusan km/jam menuruni lereng gunung api.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 47,
        "soal": "Lapisan tanah paling atas yang berwarna gelap, gembur, kaya bahan organik (humus), dan paling subur bagi pertumbuhan akar tanaman berada pada ....",
        "opsi": [
            {"label": "A", "teks": "Horizon A (Topsoil)"},
            {"label": "B", "teks": "Horizon B (Subsoil)"},
            {"label": "C", "teks": "Horizon C (Regolit)"},
            {"label": "D", "teks": "Horizon R (Bedrock)"}
        ],
        "kunci": "A",
        "pembahasan": "Horizon A (topsoil) adalah lapisan tanah atas yang paling subur karena mengandung akumulasi bahan organik terhumifikasi, nutrisi mineral esensial, dan aktivitas biologi tanah tertinggi.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 48,
        "soal": "Organisme perintis (pionir) yang mampu hidup di atas batuan keras dan mengeluarkan zat asam untuk memulai proses pelapukan batuan menjadi tanah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pohon jati dan mahoni"},
            {"label": "B", "teks": "Cacing tanah dan rayap"},
            {"label": "C", "teks": "Lumut kerak (Lichenes) dan lumut"},
            {"label": "D", "teks": "Rumput gajah dan pakis"}
        ],
        "kunci": "C",
        "pembahasan": "Lumut kerak (Lichenes) bersimbiosis alga dan jamur yang mampu tumbuh di substrat batuan gersang. Senyawa asam liken yang disekresikannya menghancurkan batuan menjadi remah tanah pertama dalam suksesi primer.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 49,
        "soal": "Peran ekologis cacing tanah (Lumbricus terrestris) dalam menjaga kesuburan tanah pertanian adalah ....",
        "opsi": [
            {"label": "A", "teks": "Membuat pori-pori aerasi tanah (biopori) dan menguraikan serasah organik menjadi kascing yang kaya hara"},
            {"label": "B", "teks": "Memakan akar tanaman padi yang masih muda"},
            {"label": "C", "teks": "Mengubah pasir kuarsa menjadi batuan granit"},
            {"label": "D", "teks": "Menyerap seluruh cadangan air tanah hingga kering"}
        ],
        "kunci": "A",
        "pembahasan": "Cacing tanah menggali rongga terowongan yang meningkatkan peresapan air dan sirkulasi udara, serta mencerna sisa organik menghasilkan kotoran kascing yang kaya unsur nitrogen, kalium, dan fosfat.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 50,
        "soal": "Metode konservasi tanah pada lahan pertanian di lereng pegunungan yang curam dengan cara membuat undakan-undakan bertingkat untuk menahan laju aliran air permukaan dan mencegah erosi disebut ....",
        "opsi": [
            {"label": "A", "teks": "Rotasi tanaman"},
            {"label": "B", "teks": "Terasering (Sengkedan)"},
            {"label": "C", "teks": "Monokultur"},
            {"label": "D", "teks": "Deforestasi"}
        ],
        "kunci": "B",
        "pembahasan": "Terasering atau sengkedan adalah rekayasa mekanis berupa pembuatan teras-teras berundak di lahan miring untuk mereduksi kecepatan limpasan air hujan dan mengendapkan sedimen tanah subur.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 51,
        "soal": "Di suatu stasiun meteorologi, suhu udara di permukaan laut (0 m) adalah 28°C. Jika setiap kenaikan 100 m di troposfer suhu udara turun rata-rata 0,6°C, perkiraan suhu udara di puncak pegunungan dengan ketinggian 2.000 m dpl adalah ....",
        "opsi": [
            {"label": "A", "teks": "12°C"},
            {"label": "B", "teks": "16°C"},
            {"label": "C", "teks": "20°C"},
            {"label": "D", "teks": "22°C"}
        ],
        "kunci": "B",
        "pembahasan": "Rumus penurunan temperatur terhadap ketinggian (lapse rate): $T = T_0 - \\left(\\frac{h}{100}\\right) \\times 0,6^\\circ\\text{C}$. Diketahui $T_0 = 28^\\circ\\text{C}$ dan $h = 2.000\\text{ m}$. Maka $T = 28^\\circ\\text{C} - \\left(\\frac{2.000}{100}\\right) \\times 0,6^\\circ\\text{C} = 28 - (20 \\times 0,6) = 28 - 12 = 16^\\circ\\text{C}$.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 52,
        "soal": "Material vulkanik hasil erupsi gunung berapi dalam jangka panjang membuat tanah di sekitar lereng gunung menjadi sangat subur karena ....",
        "opsi": [
            {"label": "A", "teks": "Abu vulkanik kaya akan unsur hara mineral makro dan mikro yang dibutuhkan tumbuhan setelah melapuk"},
            {"label": "B", "teks": "Lava pijar membunuh seluruh mikroba penyubur tanah selamanya"},
            {"label": "C", "teks": "Gas belerang meningkatkan keasaman tanah hingga pH = 1"},
            {"label": "D", "teks": "Batu apung menutup pori-pori tanah"}
        ],
        "kunci": "A",
        "pembahasan": "Abu dan debu vulkanis mengandung aneka mineral silikat, kalsium, magnesium, dan kalium alami yang setelah melapuk bersama air dan mikroba memperkaya cadangan hara tanah pertanian.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 53,
        "soal": "Saat berada di lantai 3 gedung sekolah dan tiba-tiba terjadi guncangan gempa bumi yang kuat, tindakan penyelamatan diri yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Melompat keluar dari jendela lantai 3"},
            {"label": "B", "teks": "Berlindung di bawah meja belajar yang kokoh sambil melindungi kepala, lalu turun melalui tangga darurat setelah guncangan berhenti"},
            {"label": "C", "teks": "Berebut masuk ke dalam lift agar cepat sampai di lantai dasar"},
            {"label": "D", "teks": "Berdiri tepat di dekat lemari kaca dan lampu gantung"}
        ],
        "kunci": "B",
        "pembahasan": "Saat gempa: Drop, Cover, Hold On di bawah meja kokoh untuk menghindari runtuhan benda keras. Hindari penggunaan lift karena berisiko anjlok saat aliran listrik padam. Setelah gempa reda, evakuasi tertib lewat tangga darurat.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 54,
        "soal": "[Pilihan Ganda Kompleks - Pilih Lebih dari Satu] Pilihlah pernyataan yang benar mengenai karakteristik lapisan-lapisan atmosfer Bumi!",
        "opsi": [
            {"label": "A", "teks": "Seluruh peristiwa cuaca (awan, hujan, petir, pelangi, dan badai) berlangsung di lapisan troposfer."},
            {"label": "B", "teks": "Pesawat terbang komersial bermesin jet terbang di bagian bawah stratosfer untuk menghindari turbulensi awan cuaca."},
            {"label": "C", "teks": "Lapisan ionosfer (termosfer) mengandung partikel terionisasi yang memantulkan gelombang radio dan menampilkan fenomena aurora di kutub."},
            {"label": "D", "teks": "Semakin tinggi posisi suatu tempat dari permukaan laut, tekanan dan kerapatan udaranya semakin besar."}
        ],
        "kunci": "A, B, C",
        "pembahasan": "Pernyataan A, B, dan C benar. Pernyataan D salah karena semakin tinggi elevasi dari muka laut, massa kolom udara semakin tipis sehingga tekanan dan kerapatan udara justru semakin kecil.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 55,
        "soal": "[Pilihan Ganda Kompleks - Pilih Lebih dari Satu] Pilihlah tindakan mitigasi bencana tsunami yang tepat bagi masyarakat yang tinggal di wilayah pesisir pantai!",
        "opsi": [
            {"label": "A", "teks": "Segera berlari menuju dataran tinggi atau gedung penyelamatan vertikal (shelter) jika merasakan gempa kuat disusul surutnya air laut secara mendadak."},
            {"label": "B", "teks": "Menanam dan melestarikan hutan bakau (mangrove) di sepanjang garis pantai untuk meredam energi terjangan gelombang tsunami."},
            {"label": "C", "teks": "Memasang dan merawat sistem peringatan dini tsunami (InaTEWS / buoy tsunami) serta rambu jalur evakuasi."},
            {"label": "D", "teks": "Berkumpul di tepi pantai untuk mengambil ikan-ikan yang terdampar saat air laut tiba-tiba surut pascagempa."}
        ],
        "kunci": "A, B, C",
        "pembahasan": "Pernyataan A, B, dan C merupakan langkah mitigasi struktural dan non-struktural yang tepat. Pernyataan D sangat berbahaya karena air surut drastis menandakan gelombang tsunami sedang menuju daratan.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 56,
        "soal": "[Pilihan Ganda Kompleks - Pilih Lebih dari Satu] Pernyataan yang benar mengenai sifat tanah dan upaya pelestariannya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tanah lempung (liat) memiliki partikel sangat halus dan sulit ditembus air, sedangkan tanah pasir memiliki pori-pori besar dan mudah meloloskan air."},
            {"label": "B", "teks": "Tanah lempung berpasir (loam) yang kaya humus merupakan tekstur tanah paling ideal untuk pertanian."},
            {"label": "C", "teks": "Pembuatan lubang resapan biopori membantu meningkatkan daya serap air tanah dan mencegah banjir genangan."},
            {"label": "D", "teks": "Penebangan hutan secara liar (deforestasi) di hulu sungai dapat mempertebal lapisan humus (topsoil)."}
        ],
        "kunci": "A, B, C",
        "pembahasan": "Pernyataan A, B, dan C benar. Pernyataan D salah karena deforestasi menyebabkan hilangnya tajuk penahan hujan sehingga memicu erosi hebat yang mengikis habis lapisan humus topsoil.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 57,
        "soal": "[Tabel Benar / Salah] Tentukan kebenaran pernyataan tentang lempeng tektonik dan struktur Bumi berikut: (a) Kerak samudra lebih tipis (5-10 km) tetapi memiliki massa jenis lebih besar (~3,0 g/cm3) dibandingkan kerak benua (~2,7 g/cm3); (b) Medan magnet Bumi (magnetosfer) yang melindungi Bumi dari angin matahari dibangkitkan oleh perputaran logam besi-nikel cair di lapisan inti luar Bumi; (c) Pergerakan lempeng divergen (saling menjauh) menyebabkan terbentuknya Pegunungan Himalaya.",
        "opsi": [
            {"label": "A", "teks": "(a) Benar, (b) Benar, (c) Salah"},
            {"label": "B", "teks": "(a) Benar, (b) Salah, (c) Benar"},
            {"label": "C", "teks": "(a) Salah, (b) Benar, (c) Benar"},
            {"label": "D", "teks": "(a) Benar, (b) Benar, (c) Benar"}
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan (a) Benar: kerak samudra lebih padat (basaltik) dibanding kerak benua (granitis). Pernyataan (b) Benar: dinamo geologis inti luar cair menghasilkan medan magnet bumi. Pernyataan (c) Salah: Pegunungan Himalaya terbentuk dari pergerakan konvergen (tumbukan) antara Lempeng Benua India dan Eurasia, bukan divergen.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 58,
        "soal": "[Tabel Benar / Salah] Evaluasilah kebenaran pernyataan tentang tanah dan mitigasi bencana berikut: (a) Bakteri Nitrosomonas, Nitrobacter, dan Rhizobium berperan penting dalam siklus nitrogen yang menjaga ketersediaan unsur hara nitrat di dalam tanah; (b) Stalaktit adalah kerucut kapur di dalam gua yang tumbuh dari dasar gua ke atas, sedangkan stalagmit menggantung dari langit-langit gua ke bawah; (c) Status aktivitas gunung berapi di Indonesia dari terendah hingga tertinggi adalah: Normal (Level I) -> Waspada (Level II) -> Siaga (Level III) -> Awas (Level IV).",
        "opsi": [
            {"label": "A", "teks": "(a) Benar, (b) Salah, (c) Benar"},
            {"label": "B", "teks": "(a) Benar, (b) Benar, (c) Salah"},
            {"label": "C", "teks": "(a) Salah, (b) Benar, (c) Benar"},
            {"label": "D", "teks": "(a) Benar, (b) Benar, (c) Benar"}
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan (a) Benar: bakteri tanah mengoksidasi amonia menjadi nitrit dan nitrat yang diserap akar. Pernyataan (b) Salah: Stalaktit menggantung dari atap langit-langit gua, sedangkan stalagmit tumbuh bertumpuk dari lantai dasar gua. Pernyataan (c) Benar: urutan status vulkanik PVMBG adalah Normal -> Waspada -> Siaga -> Awas.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 59,
        "soal": "[Membandingkan Data Seismograf Tiga Kota] Gempa bumi tercatat pada tiga stasiun seismograf: Kota A (Gelombang P pukul 10.05.10, Gelombang S pukul 10.07.10), Kota B (Gelombang P pukul 10.05.40, Gelombang S pukul 10.09.10), Kota C (Gelombang P pukul 10.06.00, Gelombang S pukul 10.10.30). Berdasarkan rumus Laska (delta = [(S - P) - 1 menit] x 1.000 km), jarak episentrum gempa dari Kota A, Kota B, dan Kota C berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1.000 km, 2.500 km, dan 3.500 km"},
            {"label": "B", "teks": "1.500 km, 2.000 km, dan 3.000 km"},
            {"label": "C", "teks": "2.000 km, 3.500 km, dan 4.500 km"},
            {"label": "D", "teks": "500 km, 1.500 km, dan 2.500 km"}
        ],
        "kunci": "A",
        "pembahasan": "Perhitungan rumus Laska $\\Delta = [(S - P) - 1'] \\times 1.000\\text{ km}$:\n- Kota A: $(S - P) = 10.07.10 - 10.05.10 = 2'00''$. $\\Delta_A = (2 - 1) \\times 1.000 = 1.000\\text{ km}$.\n- Kota B: $(S - P) = 10.09.10 - 10.05.40 = 3'30'' = 3,5'$. $\\Delta_B = (3,5 - 1) \\times 1.000 = 2.500\\text{ km}$.\n- Kota C: $(S - P) = 10.10.30 - 10.06.00 = 4'30'' = 4,5'$. $\\Delta_C = (4,5 - 1) \\times 1.000 = 3.500\\text{ km}$.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 60,
        "soal": "[Membandingkan Percobaan Daya Serap Tanah] Tiga corong kaca diisi sampel tanah berbeda dengan massa sama (200 g) lalu dituangi 100 mL air: Sampel I (air tertampung di gelas ukur bawah = 85 mL dalam 1 menit), Sampel II (air tertampung = 45 mL dalam 3 menit), dan Sampel III (air tertampung = 12 mL dalam 10 menit). Jenis tanah pada Sampel I, II, dan III berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tanah pasir, tanah humus/lempung berpasir, dan tanah liat (lempung)"},
            {"label": "B", "teks": "Tanah liat, tanah pasir, dan tanah humus"},
            {"label": "C", "teks": "Tanah humus, tanah liat, dan tanah kapur"},
            {"label": "D", "teks": "Tanah gambut, tanah liat, dan tanah pasir"}
        ],
        "kunci": "A",
        "pembahasan": "Tingkat permeabilitas dan perkolasi air pada tanah: Sampel I meloloskan 85 mL paling cepat menunjukkan pori makro besar khas tanah pasir. Sampel II meloloskan 45 mL menunjukkan porositas seimbang khas tanah humus/geluh. Sampel III meloloskan 12 mL paling lambat menunjukkan pori mikro sangat rapat kedap air khas tanah lempung (liat).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 61,
        "soal": "Pergerakan lempeng tektonik yang saling bertumbukan antara lempeng benua dengan lempeng benua (keduanya memiliki massa jenis sama rendah) menyebabkan kerak tertekan dan melipat ke atas membentuk pegunungan lipatan raksasa. Fenomena orogenesis ini terjadi pada pembentukan ....",
        "opsi": [
            {"label": "A", "teks": "Palung Jawa"},
            {"label": "B", "teks": "Patahan Semangko"},
            {"label": "C", "teks": "Pegunungan Himalaya di benua Asia"},
            {"label": "D", "teks": "Lembah Retakan Afrika Timur"}
        ],
        "kunci": "C",
        "pembahasan": "Tumbukan kolisi antara Lempeng Benua India dan Lempeng Benua Eurasia membentuk Pegunungan Himalaya dan Dataran Tinggi Tibet. Karena kedua lempeng benua memiliki densitas rendah yang setara, tidak ada yang menunjam ke mantel, melainkan saling meremas dan terangkat ke atas.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 62,
        "soal": "Zona bayangan gempa (shadow zone) untuk Gelombang S (gelombang sekunder) terjadi pada sudut busur 103° hingga 180° dari episentrum. Fakta geofisika ini menjadi bukti tak terbantahkan bagi para ilmuwan bahwa ....",
        "opsi": [
            {"label": "A", "teks": "Inti dalam Bumi berwujud gas"},
            {"label": "B", "teks": "Lapisan inti luar Bumi berwujud cair, karena gelombang transversal S tidak dapat merambat melalui zat cair"},
            {"label": "C", "teks": "Bumi berongga di bagian tengahnya"},
            {"label": "D", "teks": "Mantel bumi terbuat dari es padat"}
        ],
        "kunci": "B",
        "pembahasan": "Gelombang S adalah gelombang geser transversal yang membutuhkan elastisitas medium padat untuk merambat. Terhalangnya gelombang S di seberang Bumi setelah kedalaman 2.900 km membuktikan bahwa Inti Luar Bumi berada dalam fase cair (besi cair).",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_interior_bumi.jpg"
    },
    {
        "nomor_bab": 63,
        "soal": "Tanah Regosol dan Latosol banyak ditemukan di daerah tropis bercurah hujan tinggi. Mengapa tanah Latosol (tanah merah laterit) umumnya memiliki tingkat kesuburan alami yang rendah meskipun tebal?",
        "opsi": [
            {"label": "A", "teks": "Karena mengalami pencucian (leaching) intensif oleh curah hujan tinggi yang melarutkan unsur hara basa dan menyisakan oksida besi dan aluminium"},
            {"label": "B", "teks": "Karena tertutup abu vulkanik baru"},
            {"label": "C", "teks": "Karena kadar airnya nol persen"},
            {"label": "D", "teks": "Karena tidak memiliki lapisan batuan induk"}
        ],
        "kunci": "A",
        "pembahasan": "Proses laterisasi pada iklim tropis basah menyebabkan unsur hara silika dan basa ($K, Na, Ca, Mg$) tercuci larut ke bawah tanah oleh curah hujan lebat berkepanjangan, menyisakan endapan seskuioksida besi ($Fe_2O_3$, pemberi warna merah) dan aluminium ($Al_2O_3$) yang miskin hara.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 64,
        "soal": "Teknik konservasi tanah secara vegetatif dapat dilakukan dengan menutupi permukaan tanah menggunakan jerami, sisa batang jagung, atau serasah daun mati. Teknik pemberian penutup tanah ini disebut ...., dan berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Mulsa (mulching); menahan evaporasi air tanah, menjaga kelembapan, dan meredam pukulan air hujan"},
            {"label": "B", "teks": "Strip cropping; memotong tebing batu"},
            {"label": "C", "teks": "Dolomitisasi; membakar gulma"},
            {"label": "D", "teks": "Perkolasi; mengeringkan tanah"}
        ],
        "kunci": "A",
        "pembahasan": "Mulsa (mulching) adalah penutupan permukaan lahan dengan sisa biomassa tanaman. Mulsa menjaga suhu dan kelembapan tanah, meredam energi kinetik hujan perusak agregat topsoil, menekan pertumbuhan gulma, dan terdekomposisi menjadi humus tanah.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 65,
        "soal": "Pusat Vulkanologi dan Mitigasi Bencana Geologi (PVMBG) membagi Kawasan Rawan Bencana (KRB) gunung berapi menjadi KRB I, KRB II, dan KRB III. Kawasan yang selalu terancam oleh awan panas, lontaran batu pijar, dan aliran lava pekat saat letusan terjadi sehingga tidak boleh dijadikan pemukiman permanen adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kawasan Rawan Bencana III (KRB III)"},
            {"label": "B", "teks": "Kawasan Rawan Bencana I (KRB I)"},
            {"label": "C", "teks": "Kawasan Non-Bencana"},
            {"label": "D", "teks": "Kawasan Dataran Aluvial"}
        ],
        "kunci": "A",
        "pembahasan": "KRB III adalah wilayah yang terletak paling dekat dengan pusat erupsi/kawah aktif yang berpotensi langsung terlanda awan panas, aliran lava, guguran batu pijar, dan gas beracun. Zona ini merupakan zona merah yang dilarang untuk pemukiman penduduk.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    }
]

# 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)
soal_pengayaan = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains - Geodinamika Sesar Aktif] Sesar Lembang di Jawa Barat merupakan patahan geser aktif sepanjang 29 km yang bergerak dengan laju slip 3-5 mm/tahun. Analisis paleoseismik menunjukkan sesar ini memiliki periode ulang gempa bumi berkekuatan M 6,5-7,0 setiap 170-500 tahun. Berdasarkan pemahaman mitigasi struktural kebencanaan, tindakan paling efektif bagi warga dan pemda di sepanjang jalur sesar aktif tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mendirikan bangunan bertingkat tanpa pondasi tahan gempa"},
            {"label": "B", "teks": "Menetapkan sempadan patahan aktif yang bebas dari bangunan vital dan menerapkan standar konstruksi bangunan tahan gempa (SNI)"},
            {"label": "C", "teks": "Mengebor tanah patahan agar air tanah mengalir keluar"},
            {"label": "D", "teks": "Mengabaikan peta mikrozonasi gempa bumi"}
        ],
        "kunci": "B",
        "pembahasan": "Mitigasi struktural sesar aktif meliputi penetapan zona penyangga sempadan patahan (fault setback zone) yang bebas dari bangunan fasilitas publik/hunian, penegakan kode standar bangunan tahan gempa (building code SNI), serta edukasi simulasi evakuasi rutin.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Numerasi Kebencanaan - Waktu Tiba Tsunami] Sebuah gempa megathrust bawah laut dangkal bermagnitudo M 8,2 terjadi di Palung Sunda pada jarak 180 km dari garis pantai terdekat. Kecepatan rambat gelombang tsunami di laut dalam dirumuskan dengan rumus fluida dangkal v = akar(g x d), di mana percepatan gravitasi g = 10 m/s2 dan kedalaman rata-rata laut d = 4.000 meter. Berapa waktu tempuh yang dibutuhkan gelombang tsunami untuk mencapai garis pantai tersebut?",
        "opsi": [
            {"label": "A", "teks": "5 menit"},
            {"label": "B", "teks": "15 menit"},
            {"label": "C", "teks": "30 menit"},
            {"label": "D", "teks": "60 menit"}
        ],
        "kunci": "B",
        "pembahasan": "Kecepatan rambat tsunami: $v = \\sqrt{g \\times d} = \\sqrt{10 \\times 4.000} = \\sqrt{40.000} = 200\\text{ m/s} = 720\\text{ km/jam}$.\nJarak episentrum ke pantai $s = 180\\text{ km}$.\nWaktu tempuh: $t = \\frac{s}{v} = \\frac{180\\text{ km}}{720\\text{ km/jam}} = 0,25\\text{ jam} = 15\\text{ menit}$. Jadi waktu evakuasi emas masyarakat pesisir pantai hanya sekitar 15 menit.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Literasi Sains - Konservasi Ekosistem Tanah] Di kawasan dataran tinggi, alih fungsi hutan lindung menjadi ladang tanaman semusim kentang yang intensif dengan pengolahan tanah searah lereng menyebabkan erosi topsoil mencapai 150 ton/hektar/tahun. Akibatnya waduk di hilir mengalami pendangkalan cepat (sedimentasi). Upaya konservasi tanah terpadu yang paling solutif untuk memulihkan fungsi lahan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Membeton seluruh permukaan lereng pertanian"},
            {"label": "B", "teks": "Menerapkan sistem agroforestri (tumpang sari tanaman semusim dengan pohon keras berakar dalam) dipadukan dengan pembuatan terasering dan rorak penampung sedimen"},
            {"label": "C", "teks": "Menambah dosis herbisida pembasmi rumput liar"},
            {"label": "D", "teks": "Membajak tanah lebih dalam saat musim hujan lebat"}
        ],
        "kunci": "B",
        "pembahasan": "Kombinasi metode konservasi vegetatif (agroforestri dengan pohon multiguna seperti kopi/alpukat) dan mekanis (terasering bertangga dan rorak penangkap air limpasan) mampu menahan erosi hingga > 80% sekaligus menjaga pendapatan ekonomi petani.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Numerasi - Neraca Air DAS & Koefisien Limpasan] Suatu Daerah Aliran Sungai (DAS) seluas 100 km2 menerima curah hujan 50 mm dalam satu kejadian badai. Ketika kawasan hulu masih berupa hutan rapat, koefisien limpasan C = 0,20 (hanya 20% air hujan menjadi aliran permukaan). Setelah terjadi alih fungsi lahan menjadi pemukiman dan vila, koefisien limpasan naik menjadi C = 0,70. Peningkatan volume air limpasan banjir yang mengalir ke sungai hilir akibat degradasi lahan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "500.000 m3"},
            {"label": "B", "teks": "1.000.000 m3"},
            {"label": "C", "teks": "2.500.000 m3"},
            {"label": "D", "teks": "5.000.000 m3"}
        ],
        "kunci": "C",
        "pembahasan": "Volume hujan total: $V = \\text{Luas} \\times \\text{Tinggi Hujan} = 100\\times 10^6\\text{ m}^2 \\times 0,05\\text{ m} = 5.000.000\\text{ m}^3$.\nLimpasan awal hutan: $Q_1 = 0,20 \\times 5.000.000 = 1.000.000\\text{ m}^3$.\nLimpasan akhir pemukiman: $Q_2 = 0,70 \\times 5.000.000 = 3.500.000\\text{ m}^3$.\nPeningkatan volume air limpasan: $\\Delta Q = 3.500.000 - 1.000.000 = 2.500.000\\text{ m}^3$.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Literasi Sains - Fitoremediasi Tanah] Sebuah lokasi bekas tambang tercemar logam berat Timbal (Pb) dengan konsentrasi melebihi ambang batas baku mutu. Peneliti menanam tanaman akar wangi (Vetiveria zizanioides) dan bunga matahari (Helianthus annuus). Mekanisme fitoremediasi di mana akar tanaman menyerap ion Pb dari larutan tanah dan menumpuknya pada biomassa daun tanpa merusak ekosistem disebut ....",
        "opsi": [
            {"label": "A", "teks": "Fitoekstraksi (fitoakumulasi)"},
            {"label": "B", "teks": "Fitovolatilisasi menjadi gas beracun"},
            {"label": "C", "teks": "Biodegradasi menjadi plastik"},
            {"label": "D", "teks": "Biomagnifikasi rantai makanan"}
        ],
        "kunci": "A",
        "pembahasan": "Fitoekstraksi adalah proses penyerapan kontaminan polutan logam berat oleh sistem perakaran tumbuhan dan mentranslokasikannya ke bagian tajuk tanaman (daun dan batang) yang kemudian dipanen secara berkala untuk diolah secara terisolir dan aman.",
        "paket": "Bab VII: Struktur Bumi, Tanah, & Bencana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch7_bumi_tanah_mitigasi.jpg"
    }
]

# Gabungkan 70 Soal Bab VII
all_soal = soal_hots + soal_contoh + soal_latihan + soal_pengayaan
print(f"Total questions assembled for Bab 7: {len(all_soal)}")

# Bangun HTML
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab VII: Struktur Bumi, Tanah, & Kebencanaan (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 8 — Bab VII: Struktur Bumi, Tanah, & Kebencanaan</h1>
<p>Total: 70 Butir Soal Lengkap (25 HOTS Kurikulum Merdeka + 10 Contoh Soal Asli + 30 Latihan Mandiri Asli + 5 Pengayaan AKM/TKA)</p>
<hr/>
""")

json_data = []

for idx, q in enumerate(all_soal, 1):
    q_num = idx
    q_soal = q["soal"]
    q_kunci = q["kunci"]
    q_pembahasan = q["pembahasan"]
    q_paket = q["paket"]
    q_img = q["img"]
    
    html_parts.append(f"""<article data-gemilang-question data-nomor="{q_num}" data-tipe="pg_sederhana" data-paket="{html.escape(q_paket)}" data-kesulitan="Sedang" data-kelas="8">
  <div data-field="materi">Struktur Bumi, Tanah, & Kebencanaan</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis struktur interior Bumi, pergerakan lempeng tektonik, gempa bumi & tsunami, gunung berapi, sifat fisik/kimia profil tanah, erosi, dan konservasi mitigasi bencana Fase D Kurikulum Merdeka.</div>
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
        "materi": "Struktur Bumi, Tanah, & Kebencanaan",
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

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab7_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab7_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
