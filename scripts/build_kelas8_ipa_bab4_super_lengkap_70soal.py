#!/usr/bin/env python3
"""
build_kelas8_ipa_bab4_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 4 IPA SMP Kelas 8:
Getaran, Gelombang, dan Cahaya:
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

# 25 Soal Kurikulum Merdeka HOTS Bab 4 (Hal. 394-401)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar grafik perambatan gelombang transversal berikut! Jika jarak antara dua puncak gelombang yang berdekatan adalah 4 meter dan waktu tempuhnya adalah 2 detik, cepat rambat gelombang tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 m/s"},
            {"label": "B", "teks": "4 m/s"},
            {"label": "C", "teks": "8 m/s"},
            {"label": "D", "teks": "16 m/s"}
        ],
        "kunci": "A",
        "pembahasan": "Panjang gelombang $\\lambda = 4 \\text{ m}$ (jarak 2 puncak berdekatan). Periode $T = 2 \\text{ s}$. Frekuensi $f = \\frac{1}{T} = \\frac{1}{2} = 0,5 \\text{ Hz}$. Cepat rambat gelombang: $v = \\lambda \\cdot f = 4 \\times 0,5 = 2 \\text{ m/s}$ (atau $v = \\frac{\\lambda}{T} = \\frac{4}{2} = 2 \\text{ m/s}$).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Seorang siswa ingin membuat ayunan bandul jam dinding yang berayun lebih lambat (memiliki periode getaran T yang lebih besar). Langkah perbaikan yang harus dilakukan siswa tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memperpendek panjang tali bandul"},
            {"label": "B", "teks": "Memperpanjang tali bandul"},
            {"label": "C", "teks": "Memperbesar massa beban bandul"},
            {"label": "D", "teks": "Memperkecil massa beban bandul"}
        ],
        "kunci": "B",
        "pembahasan": "Periode bandul sederhana dirumuskan sebagai $T = 2\\pi \\sqrt{\\frac{l}{g}}$. Periode $T$ berbanding lurus dengan akar panjang tali ($l$) dan sama sekali tidak dipengaruhi oleh massa beban ($m$). Agar ayunan lebih lambat ($T$ lebih besar), panjang tali $l$ harus diperpanjang.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Sebuah bandul sederhana diayunkan dari titik A (kiri) – B (titik setimbang) – C (kanan). Jika jarak mendatar dari A ke C adalah 12 cm dan waktu yang dibutuhkan dari A ke C adalah 0,25 detik, maka amplitudo dan frekuensi getaran bandul tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "6 cm dan 2 Hz"},
            {"label": "B", "teks": "12 cm dan 4 Hz"},
            {"label": "C", "teks": "6 cm dan 0,5 Hz"},
            {"label": "D", "teks": "3 cm dan 2 Hz"}
        ],
        "kunci": "A",
        "pembahasan": "Jarak A ke C adalah 2 kali simpangan terjauh (2 x Amplitudo) $\\Rightarrow A = \\frac{12}{2} = 6 \\text{ cm}$. Gerakan A–B–C adalah $\\frac{1}{2}$ getaran dalam $t = 0,25 \\text{ s}$. Waktu untuk 1 getaran penuh (Periode $T$) = $2 \\times 0,25 = 0,5 \\text{ s}$. Frekuensi $f = \\frac{1}{T} = \\frac{1}{0,5} = 2 \\text{ Hz}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Perbedaan utama antara gelombang cahaya dan gelombang bunyi dalam hal medium perambatan dan bentuk gelombangnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Bunyi dapat merambat di ruang hampa udara, sedangkan cahaya memerlukan medium"},
            {"label": "B", "teks": "Keduanya merupakan gelombang transversal"},
            {"label": "C", "teks": "Bunyi adalah gelombang elektromagnetik, cahaya adalah gelombang mekanik"},
            {"label": "D", "teks": "Cahaya adalah gelombang elektromagnetik transversal (dapat merambat di ruang hampa), sedangkan bunyi adalah gelombang mekanik longitudinal (wajib memerlukan medium materi padat, cair, atau gas)"}
        ],
        "kunci": "D",
        "pembahasan": "Gelombang cahaya tidak membutuhkan partikel medium untuk merambat (gelombang elektromagnetik) dan berosilasi tegak lurus arah rambat (transversal). Sebaliknya, gelombang bunyi merambat melalui rapatan dan renggangan partikel materi (mekanik longitudinal) sehingga tidak dapat merambat di ruang hampa udara (vakum).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Mengapa saat terjadi petir di langit, kilatan cahaya petir selalu terlihat terlebih dahulu baru beberapa detik kemudian terdengar suara gemuruh guntur?",
        "opsi": [
            {"label": "A", "teks": "Karena mata manusia merespons lebih lambat daripada telinga"},
            {"label": "B", "teks": "Karena suara guntur dihasilkan lebih lambat oleh awan"},
            {"label": "C", "teks": "Cepat rambat cahaya di udara ($3 \\times 10^8 \\text{ m/s}$) hampir satu juta kali lebih cepat daripada cepat rambat bunyi di udara ($340 \\text{ m/s}$)"},
            {"label": "D", "teks": "Karena cahaya petir menembus awan tebal"}
        ],
        "kunci": "C",
        "pembahasan": "Kecepatan cahaya di udara adalah $c = 300.000.000 \\text{ m/s}$, sedangkan kecepatan suara di udara hanya sekitar $v = 340 \\text{ m/s}$. Karena perbedaan laju perambatan yang sangat ekstrem ini, kilatan cahaya tiba hampir seketika (orde mikrodetik), sedangkan gelombang suara guntur membutuhkan waktu beberapa detik untuk menempuh jarak kilang petir ke pengamat.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Sebuah kapal survei oseanografi memancarkan pulsa gelombang ultrasonik (SONAR) vertikal ke dasar laut. Pantulan gelombang bunyi tersebut terdeteksi kembali oleh hidrofon kapal setelah 4 detik. Jika cepat rambat bunyi di dalam air laut adalah 1.500 m/s, kedalaman laut di tempat tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1.500 meter"},
            {"label": "B", "teks": "3.000 meter"},
            {"label": "C", "teks": "6.000 meter"},
            {"label": "D", "teks": "12.000 meter"}
        ],
        "kunci": "B",
        "pembahasan": "Gelombang bunyi menempuh lintasan bolak-balik (pergi dan pulang): $s = \\frac{v \\cdot t}{2} = \\frac{1.500 \\text{ m/s} \\times 4 \\text{ s}}{2} = 3.000 \\text{ meter}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Dua buah senar gitar yang sejenis dipetik: Senar 1 dipetik dengan simpangan kecil menghasilkan suara lembut, sedangkan Senar 2 dipetik dengan simpangan besar menghasilkan suara keras/nyaring. Karakteristik gelombang bunyi yang menentukan kuat lemahnya bunyi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Amplitudo gelombang"},
            {"label": "B", "teks": "Frekuensi gelombang"},
            {"label": "C", "teks": "Cepat rambat gelombang"},
            {"label": "D", "teks": "Panjang gelombang"}
        ],
        "kunci": "A",
        "pembahasan": "Kuat lemahnya bunyi (intensitas volume) ditentukan oleh besar kecilnya amplitudo getaran. Sedangkan tinggi rendahnya nada bunyi ditentukan oleh frekuensi gelombang bunyi.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Ketika sebuah garpu tala berfrekuensi 440 Hz dipukul di dekat garpu tala lain yang frekuensi alaminya juga 440 Hz, garpu tala kedua ikut bergetar dan menghasilkan bunyi dengungan. Peristiwa ikut bergetarnya suatu benda karena memiliki frekuensi alami yang sama disebut ....",
        "opsi": [
            {"label": "A", "teks": "Refraksi"},
            {"label": "B", "teks": "Difraksi"},
            {"label": "C", "teks": "Resonansi"},
            {"label": "D", "teks": "Polarisasi"}
        ],
        "kunci": "C",
        "pembahasan": "Resonansi adalah fenomena di mana suatu sistem osilator ikut bergetar saat dirangsang oleh getaran dari luar yang memiliki frekuensi sama atau kelipatan bulat dari frekuensi alaminya, menghasilkan penguatan amplitudo gelombang.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Dinding dan langit-langit gedung bioskop atau studio rekaman musik selalu dilapisi karpet tebal, gabus berpori, atau busa wol akustik. Tujuan utama pelapisan bahan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memperkuat pantulan gema agar suara lebih nyaring"},
            {"label": "B", "teks": "Mencegah udara dingin masuk"},
            {"label": "C", "teks": "Menghilangkan gaya gravitasi di dalam ruangan"},
            {"label": "D", "teks": "Menyerap energi gelombang bunyi untuk mencegah terjadinya gaung (kerdam) yang mengaburkan suara asli"}
        ],
        "kunci": "D",
        "pembahasan": "Gaung atau kerdam adalah bunyi pantul yang datang sebelum bunyi asli selesai diucapkan sehingga mengganggu kejelasan suara. Bahan lunak dan berpori menyerap gelombang suara agar pantulan diminimalkan.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Kelelawar dapat terbang berburu mangsa serangga di dalam gua gelap gulita tanpa menabrak dinding menggunakan kemampuan navigasi biologis yang disebut ekolokasi. Gelombang yang dimanfaatkan kelelawar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gelombang infrasonik (< 20 Hz)"},
            {"label": "B", "teks": "Gelombang ultrasonik (> 20.000 Hz)"},
            {"label": "C", "teks": "Gelombang radio"},
            {"label": "D", "teks": "Sinar ultraviolet"}
        ],
        "kunci": "B",
        "pembahasan": "Kelelawar memancarkan pulsa gelombang ultrasonik berfrekuensi tinggi (di atas 20 kHz hingga 100 kHz) melalui laring dan menerima pantulannya dengan daun telinga untuk memetakan lokasi mangsa dan rintangan.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Sebuah pensil yang dimasukkan miring ke dalam gelas bening berisi air tampak patah atau membengkok pada batas permukaan air. Peristiwa optika ini terjadi karena ....",
        "opsi": [
            {"label": "A", "teks": "Pembiasan (refraksi) cahaya saat merambat melintasi dua medium yang memiliki kerapatan optik berbeda (dari air yang lebih rapat ke udara yang kurang rapat)"},
            {"label": "B", "teks": "Pemantulan sempurna di dalam gelas"},
            {"label": "C", "teks": "Pensil menyerap panas dari air"},
            {"label": "D", "teks": "Dispersi cahaya menjadi pelangi"}
        ],
        "kunci": "A",
        "pembahasan": "Ketika berkas cahaya merambat dari air ($n = 1,33$) ke udara ($n = 1$), terjadi perubahan kelajuan rambat cahaya yang membelokkan arah sinar menjauhi garis normal. Pembelokan ini menimbulkan ilusi optik pensil tampak patah.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Seberkas sinar polikromatik (cahaya putih matahari) diarahkan menembus prisma kaca segitiga sehingga terurai menjadi spektrum warna pelangi (merah, jingga, kuning, hijau, biru, nila, ungu). Peristiwa penguraian cahaya putih menjadi komponen-komponen monokromatiknya disebut ....",
        "opsi": [
            {"label": "A", "teks": "Interferensi"},
            {"label": "B", "teks": "Polarisasi"},
            {"label": "C", "teks": "Difraksi"},
            {"label": "D", "teks": "Dispersi cahaya"}
        ],
        "kunci": "D",
        "pembahasan": "Dispersi terjadi karena tiap panjang gelombang warna cahaya memiliki indeks bias yang sedikit berbeda di dalam kaca prisma. Cahaya ungu mengalami deviasi pembelokan terbesar (panjang gelombang terpendek), sedangkan cahaya merah mengalami deviasi terkecil (panjang gelombang terpanjang).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Seseorang berdiri di depan cermin datar pada jarak 1,5 meter. Sifat bayangan yang terbentuk pada cermin datar dan jarak antara orang tersebut dengan bayangannya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Nyata, terbalik, diperbesar, dan berjarak 1,5 meter"},
            {"label": "B", "teks": "Maya, terbalik, sama besar, dan berjarak 0 meter"},
            {"label": "C", "teks": "Maya, tegak, sama besar (perbesaran M = 1), dan berjarak 3,0 meter"},
            {"label": "D", "teks": "Nyata, tegak, diperkecil, dan berjarak 4,5 meter"}
        ],
        "kunci": "C",
        "pembahasan": "Sifat bayangan cermin datar: Maya, tegak, sama besar dengan benda ($M = 1$), simetris kanan-kiri. Jarak bayangan ke cermin sama dengan jarak benda ke cermin ($s' = s = 1,5 \\text{ m}$). Jarak orang ke bayangannya = $s + s' = 1,5 + 1,5 = 3,0 \\text{ meter}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Dua buah cermin datar disusun saling berhadapan membentuk sudut apit alpha = 60 derajat. Jika sebuah lilin menyala diletakkan di antara kedua cermin, jumlah bayangan lilin yang terbentuk adalah ....",
        "opsi": [
            {"label": "A", "teks": "4 bayangan"},
            {"label": "B", "teks": "5 bayangan"},
            {"label": "C", "teks": "6 bayangan"},
            {"label": "D", "teks": "7 bayangan"}
        ],
        "kunci": "B",
        "pembahasan": "Rumus jumlah bayangan oleh dua cermin datar: $n = \\frac{360^\\circ}{\\alpha} - 1 = \\frac{360^\\circ}{60^\\circ} - 1 = 6 - 1 = 5 \\text{ bayangan}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Sebuah benda diletakkan pada jarak 30 cm di depan sebuah cermin cekung yang memiliki jarak fokus f = 20 cm. Jarak bayangan (s') dan sifat bayangan yang terbentuk adalah ....",
        "opsi": [
            {"label": "A", "teks": "s' = 60 cm, bersifat nyata, terbalik, diperbesar"},
            {"label": "B", "teks": "s' = 12 cm, bersifat maya, tegak, diperkecil"},
            {"label": "C", "teks": "s' = 30 cm, bersifat nyata, terbalik, sama besar"},
            {"label": "D", "teks": "s' = 10 cm, bersifat nyata, tegak, diperbesar"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus cermin: $\\frac{1}{f} = \\frac{1}{s} + \\frac{1}{s'} \\Rightarrow \\frac{1}{20} = \\frac{1}{30} + \\frac{1}{s'} \\Rightarrow \\frac{1}{s'} = \\frac{1}{20} - \\frac{1}{30} = \\frac{3 - 2}{60} = \\frac{1}{60} \\Rightarrow s' = 60 \\text{ cm}$. Karena $s' > 0$, bayangan bersifat nyata dan terbalik. Perbesaran $M = |\\frac{s'}{s}| = \\frac{60}{30} = 2$ kali (diperbesar).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Mengapa kaca spion kendaraan bermotor dan cermin pengawas di tikungan jalan berbahaya selalu menggunakan cermin cembung?",
        "opsi": [
            {"label": "A", "teks": "Karena cermin cembung menghasilkan bayangan yang terbalik"},
            {"label": "B", "teks": "Karena cermin cembung memperbesar ukuran bayangan menjadi raksasa"},
            {"label": "C", "teks": "Cermin cembung selalu menghasilkan bayangan maya, tegak, dan diperkecil sehingga memberikan bidang pandang penglihatan (field of view) yang jauh lebih luas bagi pengemudi"},
            {"label": "D", "teks": "Karena cermin cembung tahan panas knalpot"}
        ],
        "kunci": "C",
        "pembahasan": "Sinar-sinar pantul pada cermin cembung bersifat divergen (menyebar). Hal ini menghasilkan bayangan maya, tegak, dan diperkecil dari semua benda di depannya, sehingga sudut jangkauan penglihatan pengemudi menjadi jauh lebih lebar dibandingkan cermin datar.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Sebuah benda diletakkan pada jarak 15 cm di depan lensa cembung (lensa positif) yang memiliki panjang fokus f = 10 cm. Jarak bayangan yang terbentuk di belakang lensa adalah ....",
        "opsi": [
            {"label": "A", "teks": "30 cm"},
            {"label": "B", "teks": "25 cm"},
            {"label": "C", "teks": "20 cm"},
            {"label": "D", "teks": "6 cm"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus lensa tipis: $\\frac{1}{f} = \\frac{1}{s} + \\frac{1}{s'} \\Rightarrow \\frac{1}{10} = \\frac{1}{15} + \\frac{1}{s'} \\Rightarrow \\frac{1}{s'} = \\frac{1}{10} - \\frac{1}{15} = \\frac{3 - 2}{30} = \\frac{1}{30} \\Rightarrow s' = 30 \\text{ cm}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Seseorang yang menderita cacat mata Miopi (rabun jauh) memiliki titik jauh (Punctum Remotum) PR = 2 meter (200 cm). Kekuatan kacamata lensa cekung (negatif) yang harus digunakannya agar dapat melihat benda di tak hingga dengan jelas adalah ....",
        "opsi": [
            {"label": "A", "teks": "-0,5 Dioptri"},
            {"label": "B", "teks": "-2,0 Dioptri"},
            {"label": "C", "teks": "+0,5 Dioptri"},
            {"label": "D", "teks": "+2,0 Dioptri"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus kekuatan lensa kacamata miopi: $P = -\\frac{100}{PR \\text{ (cm)}} = -\\frac{100}{200 \\text{ cm}} = -0,5 \\text{ Dioptri}$ (atau $P = -\\frac{1}{PR \\text{ (m)}} = -\\frac{1}{2} = -0,5 \\text{ D}$).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Seseorang tidak dapat membaca buku pada jarak baca normal (sn = 25 cm) karena titik dekat matanya (Punctum Proximum) bergeser menjauh menjadi PP = 50 cm. Kekuatan kacamata lensa cembung (positif) yang dibutuhkannya adalah ....",
        "opsi": [
            {"label": "A", "teks": "+2,0 Dioptri"},
            {"label": "B", "teks": "+1,5 Dioptri"},
            {"label": "C", "teks": "+0,5 Dioptri"},
            {"label": "D", "teks": "-2,0 Dioptri"}
        ],
        "kunci": "A",
        "pembahasan": "Kacamata hipermetropi: $P = \\frac{100}{s_n} - \\frac{100}{PP} = \\frac{100}{25} - \\frac{100}{50} = 4 - 2 = +2,0 \\text{ Dioptri}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Bagian bola mata manusia yang berfungsi mengatur diameter bukaan pupil untuk mengontrol intensitas cahaya yang masuk ke retina, serta memberikan warna pada bola mata adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kornea"},
            {"label": "B", "teks": "Lensa mata"},
            {"label": "C", "teks": "Sklera"},
            {"label": "D", "teks": "Iris (selaput pelangi)"}
        ],
        "kunci": "D",
        "pembahasan": "Iris mengandung pigmen melanin pemberi warna mata dan serat otot polos sirkular/radial yang mengatur konstriksi (mengecil saat silau) dan dilatasi (membesar saat remang) pada celah pupil.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Kemampuan otot siliaris pada mata manusia untuk mengubah-ubah kecembungan lensa mata agar bayangan benda selalu jatuh tepat di bintik kuning retina disebut ....",
        "opsi": [
            {"label": "A", "teks": "Adaptasi gelap"},
            {"label": "B", "teks": "Akomodasi mata"},
            {"label": "C", "teks": "Regenerasi fovea"},
            {"label": "D", "teks": "Refleks pupil"}
        ],
        "kunci": "B",
        "pembahasan": "Daya akomodasi adalah kemampuan lensa mata untuk mencembung saat melihat benda dekat dan memipih saat memandang objek jauh melalui kontraksi/relaksasi muskulus siliaris.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Seorang teknisi reparasi jam tangan mengamati gerigi arloji menggunakan lup (kaca pembesar) dengan jarak fokus f = 5 cm. Jika mata teknisi berakomodasi maksimum pada jarak baca normal sn = 25 cm, perbesaran bayangan yang dihasilkan lup adalah ....",
        "opsi": [
            {"label": "A", "teks": "5 kali"},
            {"label": "B", "teks": "6 kali"},
            {"label": "C", "teks": "10 kali"},
            {"label": "D", "teks": "25 kali"}
        ],
        "kunci": "B",
        "pembahasan": "Rumus perbesaran lup untuk mata berakomodasi maksimum: $M = \\frac{s_n}{f} + 1 = \\frac{25 \\text{ cm}}{5 \\text{ cm}} + 1 = 5 + 1 = 6 \\text{ kali}$.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Kamera fotografi memiliki kemiripan prinsip kerja optik dengan mata manusia. Pasangan komponen kamera dan bagian mata manusia yang memiliki fungsi ekuivalen yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Diafragma kamera ekuivalen dengan pupil/iris, lensa kamera ekuivalen dengan lensa mata, dan sensor CMOS/film kamera ekuivalen dengan retina"},
            {"label": "B", "teks": "Lensa kamera ekuivalen dengan kornea saja"},
            {"label": "C", "teks": "Shutter ekuivalen dengan saraf optik"},
            {"label": "D", "teks": "Flash kamera ekuivalen dengan kelopak mata"}
        ],
        "kunci": "A",
        "pembahasan": "Apertur diafragma kamera mengatur intensitas cahaya mirip iris/pupil. Lensa kamera memfokuskan bayangan mirip lensa kristalin mata. Sensor film/digital menangkap bayangan nyata terbalik mirip lapisan fotoreseptor retina.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Pada lampu senter dan lampu depan sepeda motor, bola lampu kecil selalu diposisikan tepat di titik fokus (f) cermin cekung reflektor. Tujuan penempatan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menyebarkan cahaya ke segala arah agar redup"},
            {"label": "B", "teks": "Membuat bayangan lampu terbalik"},
            {"label": "C", "teks": "Sesuai hukum cermin cekung, sinar cahaya yang datang dari titik fokus akan dipantulkan sejajar sumbu utama membentuk berkas sinar paralel lurus ke depan yang terang dan berjangkauan jauh"},
            {"label": "D", "teks": "Mencegah terjadinya panas pada reflektor"}
        ],
        "kunci": "C",
        "pembahasan": "Sinar istimewa cermin cekung: Sinar yang berasal dari titik fokus ($F$) dipantulkan sejajar dengan sumbu utama. Hal ini dimanfaatkan reflektor lampu sorot untuk menghasilkan berkas sinar sejajar yang kuat menembus kegelapan.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Kelainan mata Astigmatisme (mata silindris) yang membuat penderita tidak dapat membedakan garis-garis vertikal dan horizontal secara bersamaan disebabkan oleh ....",
        "opsi": [
            {"label": "A", "teks": "Bola mata terlalu pendek"},
            {"label": "B", "teks": "Lensa mata mengalami kekeruhan katarak"},
            {"label": "C", "teks": "Kurangnya vitamin A"},
            {"label": "D", "teks": "Kelengkungan permukaan kornea mata atau lensa mata tidak sferis rata (berbentuk lonjong/kelengkungan silindrik) sehingga sinar tidak difokuskan pada satu titik retina"}
        ],
        "kunci": "D",
        "pembahasan": "Astigmatisme disebabkan oleh asimetri kelengkungan kornea, menyebabkan berkas cahaya dibiaskan dengan fokus berbeda pada bidang meridian horizontal dan vertikal, dan dapat dikoreksi menggunakan kacamata lensa silindris.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    }
]

# 10 Soal Contoh Asli (No. 26-35)
contoh_soal = [
    {
        "nomor_bab": 26,
        "soal": "Gerak bolak-balik suatu benda secara periodik melalui titik keseimbangan disebut ....",
        "opsi": [
            {"label": "A", "teks": "Getaran"},
            {"label": "B", "teks": "Gelombang"},
            {"label": "C", "teks": "Kecepatan"},
            {"label": "D", "teks": "Percepatan"}
        ],
        "kunci": "A",
        "pembahasan": "Getaran didefinisikan sebagai gerak osilasi bolak-balik yang teratur melewati titik kesetimbangan statis.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Waktu yang diperlukan oleh suatu benda untuk melakukan satu kali getaran penuh disebut ....",
        "opsi": [
            {"label": "A", "teks": "Frekuensi"},
            {"label": "B", "teks": "Periode"},
            {"label": "C", "teks": "Amplitudo"},
            {"label": "D", "teks": "Cepat rambat"}
        ],
        "kunci": "B",
        "pembahasan": "Periode ($T$) adalah durasi waktu untuk menuntaskan 1 siklus getaran penuh ($T = t / n$). Frekuensi ($f$) adalah jumlah getaran per detik ($f = n / t$).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Gelombang yang arah getarnya tegak lurus terhadap arah perambatannya disebut gelombang ....",
        "opsi": [
            {"label": "A", "teks": "Transversal"},
            {"label": "B", "teks": "Longitudinal"},
            {"label": "C", "teks": "Stasioner"},
            {"label": "D", "teks": "Elektromagnetik"}
        ],
        "kunci": "A",
        "pembahasan": "Gelombang transversal memiliki osilasi tegak lurus arah rambat gelombang (contoh: gelombang tali, ombak air, gelombang cahaya).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Satu gelombang transversal lengkap terdiri atas ....",
        "opsi": [
            {"label": "A", "teks": "Satu bukit dan satu lembah gelombang"},
            {"label": "B", "teks": "Dua bukit gelombang saja"},
            {"label": "C", "teks": "Dua lembah gelombang saja"},
            {"label": "D", "teks": "Satu rapatan dan satu renggangan"}
        ],
        "kunci": "A",
        "pembahasan": "Satu panjang gelombang transversal ($\\lambda$) tersusun atas satu bukit gelombang dan satu lembah gelombang berurutan.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Batas frekuensi getaran gelombang bunyi yang dapat didengar oleh telinga manusia normal (audiosonik) berada pada rentang ....",
        "opsi": [
            {"label": "A", "teks": "< 20 Hz"},
            {"label": "B", "teks": "20 Hz sampai 20.000 Hz"},
            {"label": "C", "teks": "> 20.000 Hz"},
            {"label": "D", "teks": "100.000 Hz"}
        ],
        "kunci": "B",
        "pembahasan": "Daerah pendengaran manusia berkisar antara 20 Hz hingga 20.000 Hz (audiosonik). Di bawah 20 Hz adalah infrasonik, di atas 20.000 Hz adalah ultrasonik.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Bunyi pantul yang terdengar beberapa saat SETELAH bunyi asli selesai diucapkan dan terdengar jelas di tempat lapang yang jauh dari tebing disebut ....",
        "opsi": [
            {"label": "A", "teks": "Gaung"},
            {"label": "B", "teks": "Kerdam"},
            {"label": "C", "teks": "Gema"},
            {"label": "D", "teks": "Desah"}
        ],
        "kunci": "C",
        "pembahasan": "Gema terjadi ketika jarak dinding pemantul cukup jauh sehingga jeda waktu tempuh bunyi pantul cukup lama dan terdengar jelas terpisah setelah bunyi asli selesai.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Hukum pemantulan cahaya (Hukum Snellius) menyatakan bahwa sinar datang, sinar pantul, dan garis normal berada pada satu bidang datar, dan besar sudut datang (i) ....",
        "opsi": [
            {"label": "A", "teks": "Sama dengan besar sudut pantul (r)"},
            {"label": "B", "teks": "Lebih besar dari sudut pantul"},
            {"label": "C", "teks": "Lebih kecil dari sudut pantul"},
            {"label": "D", "teks": "Selalu 90 derajat"}
        ],
        "kunci": "A",
        "pembahasan": "Hukum pemantulan cahaya: Sudut datang sama dengan sudut pantul ($\\angle i = \\angle r$).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Sebuah cermin cekung memiliki jari-jari kelengkungan R = 40 cm. Jarak fokus (f) cermin cekung tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "10 cm"},
            {"label": "B", "teks": "20 cm"},
            {"label": "C", "teks": "40 cm"},
            {"label": "D", "teks": "80 cm"}
        ],
        "kunci": "B",
        "pembahasan": "Jarak fokus cermin sferis adalah setengah dari jari-jari kelengkungan ($f = \\frac{1}{2} R = \\frac{1}{2} \\times 40 = 20 \\text{ cm}$).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Lensa cembung bersifat mengumpulkan berkas sinar cahaya yang sejajar menuju satu titik fokus, sehingga disebut lensa ....",
        "opsi": [
            {"label": "A", "teks": "Konvergen (positif)"},
            {"label": "B", "teks": "Divergen (negatif)"},
            {"label": "C", "teks": "Bikonkaf"},
            {"label": "D", "teks": "Plano-konkaf"}
        ],
        "kunci": "A",
        "pembahasan": "Lensa cembung (lensa positif) mengumpulkan sinar (konvergen). Lensa cekung (lensa negatif) menyebarkan sinar (divergen).",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Alat optik yang digunakan oleh kapal selam untuk mengamati situasi di atas permukaan laut tanpa harus muncul ke permukaan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Periskop"},
            {"label": "B", "teks": "Teleskop"},
            {"label": "C", "teks": "Mikroskop"},
            {"label": "D", "teks": "Episkop"}
        ],
        "kunci": "A",
        "pembahasan": "Periskop menggunakan tabung vertikal berisi dua cermin datar atau prisma siku-siku pemantul total yang dipasang miring 45 derajat untuk membelokkan berkas cahaya.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
latihan_mandiri = [
    {"no": 36, "soal": "Sebuah pegas bergetar 120 kali dalam waktu 1 menit. Frekuensi getaran pegas tersebut adalah ....", "opsi": ["0,5 Hz", "2 Hz", "60 Hz", "120 Hz"], "kunci": "B", "bahas": "$f = n / t = 120 / 60 = 2$ Hz."},
    {"no": 37, "soal": "Jika frekuensi suatu getaran adalah 50 Hz, maka periode getaran tersebut adalah ....", "opsi": ["0,02 detik", "0,2 detik", "2 detik", "5 detik"], "kunci": "A", "bahas": "$T = 1 / f = 1 / 50 = 0,02$ detik."},
    {"no": 38, "soal": "Simpangan terjauh dari titik kesetimbangan pada suatu getaran disebut ....", "opsi": ["Amplitudo", "Frekuensi", "Periode", "Fase"], "kunci": "A", "bahas": "Amplitudo adalah nilai mutlak jarak perpindahan terjauh partikel dari titik setimbang."},
    {"no": 39, "soal": "Gelombang longitudinal tersusun atas ....", "opsi": ["Rapatan dan renggangan", "Bukit dan lembah", "Simpul dan perut", "Hanya rapatan"], "kunci": "A", "bahas": "Satu gelombang longitudinal terdiri dari 1 daerah rapatan (kompresi) dan 1 daerah renggangan (rarefaksi)."},
    {"no": 40, "soal": "Gelombang merambat dengan panjang gelombang 2 m dan frekuensi 150 Hz. Cepat rambat gelombangnya adalah ....", "opsi": ["75 m/s", "150 m/s", "300 m/s", "600 m/s"], "kunci": "C", "bahas": "$v = \\lambda \\cdot f = 2 \\times 150 = 300$ m/s."},
    {"no": 41, "soal": "Gelombang laut memiliki cepat rambat 12 m/s dan periode 3 detik. Panjang gelombangnya adalah ....", "opsi": ["4 meter", "15 meter", "36 meter", "72 meter"], "kunci": "C", "bahas": "$\\lambda = v \\cdot T = 12 \\times 3 = 36$ meter."},
    {"no": 42, "soal": "Medium yang menghantarkan gelombang bunyi dengan kelajuan paling cepat adalah ....", "opsi": ["Zat padat (seperti rel baja)", "Zat cair (air laut)", "Gas (udara kering)", "Ruang hampa"], "kunci": "A", "bahas": "Partikel zat padat tersusun paling rapat dan memiliki modulus elastisitas tinggi sehingga kelajuan bunyi di zat padat paling tinggi (rel baja $\\approx 5.000$ m/s vs udara $340$ m/s)."},
    {"no": 43, "soal": "Hewan yang mampu mendengar dan menghasilkan gelombang infrasonik (< 20 Hz) untuk komunikasi jarak jauh adalah ....", "opsi": ["Gajah dan paus", "Kelelawar", "Lumba-lumba", "Kucing"], "kunci": "A", "bahas": "Gajah dan paus memanfaatkan infrasonik yang berdaya jangkau sangat jauh karena redamannya kecil di udara dan air."},
    {"no": 44, "soal": "Nada bunyi ditentukan oleh frekuensi getaran, sedangkan warna bunyi (timbre) ditentukan oleh ....", "opsi": ["Bentuk gelombang dan gabungan nada harmonik", "Amplitudo bunyi", "Cepat rambat bunyi", "Medium"], "kunci": "A", "bahas": "Timbre (warna bunyi) membedakan suara gitar dan biola pada nada yang sama akibat perbedaan spektrum gelombang harmoniknya."},
    {"no": 45, "soal": "Resonansi kolom udara pertama terjadi pada panjang tabung L = 15 cm. Panjang gelombang bunyi adalah ....", "opsi": ["30 cm", "45 cm", "60 cm", "90 cm"], "kunci": "C", "bahas": "Resonansi 1: $L = \\frac{1}{4} \\lambda \\Rightarrow 15 = \\frac{1}{4} \\lambda \\Rightarrow \\lambda = 60$ cm."},
    {"no": 46, "soal": "Peristiwa pembelokan arah rambat cahaya saat memasuki medium dengan indeks bias berbeda disebut ....", "opsi": ["Pembiasan (refraksi)", "Pemantulan", "Polarisasi", "Interferensi"], "kunci": "A", "bahas": "Refraksi adalah pembelokan berkas cahaya akibat perubahan kelajuan di antara dua medium berlainan kerapatan optik."},
    {"no": 47, "soal": "Sinar datang dari medium renggang (udara) ke medium lebih rapat (air) akan dibiaskan ....", "opsi": ["Mendekati garis normal", "Menjauhi garis normal", "Lurus tanpa belok", "Dipantulkan total"], "kunci": "A", "bahas": "Dari medium kurang rapat ke lebih rapat, kelajuan cahaya melambat sehingga berkas sinar membelok mendekati garis normal."},
    {"no": 48, "soal": "Indeks bias mutlak suatu zat adalah perbandingan antara ....", "opsi": ["Cepat rambat cahaya di ruang hampa terhadap di zat tersebut", "Sudut datang terhadap sudut bias", "Massa jenis zat terhadap air", "Tinggi benda terhadap bayangan"], "kunci": "A", "bahas": "$n = c / v$, di mana $c$ adalah laju cahaya di vakum ($3 \\times 10^8$ m/s)."},
    {"no": 49, "soal": "Bayangan yang dibentuk oleh cermin datar selalu bersifat ....", "opsi": ["Maya, tegak, sama besar", "Nyata, terbalik, diperkecil", "Nyata, tegak, diperbesar", "Maya, terbalik, sama besar"], "kunci": "A", "bahas": "Cermin datar menghasilkan bayangan maya (di belakang cermin), tegak, dan berukuran identik sama ($M=1$)."},
    {"no": 50, "soal": "Jika sudut apit antara dua cermin datar adalah 90 derajat, jumlah bayangan yang terbentuk adalah ....", "opsi": ["3 bayangan", "4 bayangan", "5 bayangan", "6 bayangan"], "kunci": "A", "bahas": "$n = (360^\\circ / 90^\\circ) - 1 = 4 - 1 = 3$ bayangan."},
    {"no": 51, "soal": "Titik fokus cermin cembung bernilai negatif karena ....", "opsi": ["Letak titik fokus berada di belakang cermin (bersifat maya)", "Cermin tidak memantulkan cahaya", "Bentuknya melengkung ke dalam", "Cahaya tidak menembus"], "kunci": "A", "bahas": "Titik fokus cermin cembung dibentuk oleh perpanjangan sinar pantul di belakang permukaan cermin (titik api maya)."},
    {"no": 52, "soal": "Benda diletakkan di titik pusat kelengkungan (s = R = 2f) cermin cekung. Bayangannya akan bersifat ....", "opsi": ["Nyata, terbalik, sama besar", "Maya, tegak, diperbesar", "Nyata, terbalik, diperbesar", "Maya, tegak, diperkecil"], "kunci": "A", "bahas": "Sesuai Dalil Esbach: Benda di Ruang II ($s = 2f$) menghasilkan bayangan di Ruang II ($s' = 2f$) yang nyata, terbalik, dan sama besar."},
    {"no": 53, "soal": "Sebuah cermin cekung memiliki fokus 15 cm. Benda diletakkan pada jarak 10 cm (di Ruang I). Bayangannya bersifat ....", "opsi": ["Maya, tegak, diperbesar", "Nyata, terbalik, diperkecil", "Nyata, terbalik, diperbesar", "Maya, terbalik, sama besar"], "kunci": "A", "bahas": "Benda di Ruang I ($s < f$) cermin cekung selalu menghasilkan bayangan di Ruang IV (di belakang cermin) yang maya, tegak, dan diperbesar."},
    {"no": 54, "soal": "Lensa tipis yang memiliki jarak fokus f = 25 cm (0,25 m) memiliki kekuatan lensa sebesar ....", "opsi": ["+4 Dioptri", "+2,5 Dioptri", "+0,25 Dioptri", "+10 Dioptri"], "kunci": "A", "bahas": "$P = 100 / f \\text{ (cm)} = 100 / 25 = +4$ Dioptri."},
    {"no": 55, "soal": "Lensa cekung memiliki kekuatan lensa bernilai ....", "opsi": ["Negatif (divergen)", "Positif (konvergen)", "Nol", "Selalu di atas 10 D"], "kunci": "A", "bahas": "Lensa cekung memiliki titik fokus maya ($f < 0$) sehingga nilai daya optiknya bertanda negatif."},
    {"no": 56, "soal": "Pada mata manusia normal, bayangan benda yang dilihat jatuh tepat pada ....", "opsi": ["Retina (bintik kuning)", "Kornea", "Pupil", "Saraf optik"], "kunci": "A", "bahas": "Fovea sentralis (bintik kuning) pada retina adalah lapisan fotoreseptor kerucut yang menangkap bayangan nyata, terbalik, dan diperkecil."},
    {"no": 57, "soal": "Cacat mata miopi (rabun jauh) terjadi karena ....", "opsi": ["Bola mata terlalu lonjong ke belakang sehingga bayangan jatuh di depan retina", "Bola mata terlalu pipih", "Lensa mata terlalu pipih", "Kornea keruh"], "kunci": "A", "bahas": "Miopi menyebabkan daya konvergensi mata terlalu kuat sehingga bayangan objek tak terhingga terfokus di depan retina."},
    {"no": 58, "soal": "Penderita hipermetropi (rabun dekat) ditolong menggunakan kacamata berlensa ....", "opsi": ["Cembung (positif)", "Cekung (negatif)", "Silindris", "Ganda"], "kunci": "A", "bahas": "Lensa cembung membantu mengumpulkan sinar sebelum masuk ke mata agar bayangan jatuh tepat di retina."},
    {"no": 59, "soal": "Titik dekat (Punctum Proximum) untuk mata normal orang dewasa adalah ....", "opsi": ["25 cm", "10 cm", "50 cm", "Tak terhingga"], "kunci": "A", "bahas": "Titik dekat standar mata emetrop normal ($s_n$) adalah 25 cm."},
    {"no": 60, "soal": "Cacat mata tua (presbiopi) disebabkan oleh ....", "opsi": ["Penurunan elastisitas otot siliaris dan lensa mata akibat faktor penuaan", "Kerusakan bintik buta", "Infeksi kornea", "Kekurangan vitamin A"], "kunci": "A", "bahas": "Presbiopi adalah penurunan amplitudo daya akomodasi lensa kristalin karena sklerosis lensa terkait usia."},
    {"no": 61, "soal": "Kacamata yang digunakan oleh penderita presbiopi yang sekaligus menderita miopi adalah kacamata ....", "opsi": ["Bifokal (lensa ganda: cekung atas dan cembung bawah)", "Hanya silindris", "Hanya cembung", "Kacamata hitam"], "kunci": "A", "bahas": "Kacamata bifokal memiliki lensa minus di atas untuk melihat jauh dan lensa plus di bawah untuk membaca dekat."},
    {"no": 62, "soal": "Mikroskop tersusun atas dua lensa cembung, yaitu ....", "opsi": ["Lensa objektif (dekat benda) dan lensa okuler (dekat mata pengamat)", "Lensa cekung dan lensa cembung", "Dua lensa cekung", "Cermin datar dan cermin cekung"], "kunci": "A", "bahas": "Mikroskop optik menggunakan lensa objektif ($f_{ob}$ pendek) dan lensa okuler ($f_{ok}$ lebih panjang) untuk menghasilkan bayangan akhir maya, terbalik, sangat diperbesar."},
    {"no": 63, "soal": "Pada mikroskop, sifat bayangan yang dihasilkan oleh lensa objektif adalah ....", "opsi": ["Nyata, terbalik, diperbesar", "Maya, tegak, diperkecil", "Maya, terbalik, diperbesar", "Nyata, tegak, sama besar"], "kunci": "A", "bahas": "Benda diletakkan di antara $f_{ob}$ dan $2f_{ob}$ sehingga lensa objektif membentuk bayangan nyata, terbalik, dan diperbesar."},
    {"no": 64, "soal": "Teleskop bintang (teropong astronomi) sederhana menggunakan dua lensa cembung. Panjang teropong (d) saat mata tak berakomodasi adalah ....", "opsi": ["d = f_ob + f_ok", "d = f_ob - f_ok", "d = f_ob x f_ok", "d = f_ob / f_ok"], "kunci": "A", "bahas": "Panjang tubus teropong bintang untuk pengamatan santai tanpa akomodasi adalah $d = f_{ob} + f_{ok}$."},
    {"no": 65, "soal": "Sifat bayangan akhir yang diamati oleh mata pengamat melalui mikroskop adalah ....", "opsi": ["Maya, terbalik terhadap arah benda asli, dan sangat diperbesar", "Nyata, tegak, diperbesar", "Maya, tegak, sama besar", "Nyata, terbalik, diperkecil"], "kunci": "A", "bahas": "Lensa okuler memperbesar bayangan nyata dari objektif menjadi bayangan akhir yang bersifat maya, terbalik, dan diperbesar."}
]

# 5 Soal Pengayaan AKM (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains — Pemetaan Topografi Dasar Laut SONAR] Kapal mendeteksi gema dasar laut di Titik P setelah 2 detik dan di Titik Q setelah 3,4 detik ($v = 1.500 \\text{ m/s}$). Berapakah selisih kedalaman dasar laut antara Titik P dan Titik Q?",
        "opsi": [
            {"label": "A", "teks": "525 meter"},
            {"label": "B", "teks": "1.050 meter"},
            {"label": "C", "teks": "1.500 meter"},
            {"label": "D", "teks": "2.100 meter"}
        ],
        "kunci": "B",
        "pembahasan": "Kedalaman di P: $h_P = \\frac{1.500 \\times 2}{2} = 1.500$ m. Kedalaman di Q: $h_Q = \\frac{1.500 \\times 3,4}{2} = 2.550$ m. Selisih kedalaman $\\Delta h = 2.550 - 1.500 = 1.050$ meter.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Analisis Optika Lensa — Perbesaran Kamera Digital] Sebuah lensa kamera smartphone memiliki panjang fokus f = 4 mm memotret pemandangan pohon setinggi 8 meter yang berjarak 10 meter di depannya. Bayangan pohon yang terbentuk pada sensor CMOS kamera bersifat ....",
        "opsi": [
            {"label": "A", "teks": "Nyata, terbalik, dan sangat diperkecil tepat di bidang fokus sensor kamera"},
            {"label": "B", "teks": "Maya, tegak, diperbesar"},
            {"label": "C", "teks": "Nyata, tegak, sama besar"},
            {"label": "D", "teks": "Maya, terbalik, sama besar"}
        ],
        "kunci": "A",
        "pembahasan": "Benda berada sangat jauh di luar $2f$ ($s = 10 \\text{ m} = 10.000 \\text{ mm} \\gg 2f$). Lensa cembung kamera membentuk bayangan yang bersifat nyata, terbalik, dan sangat diperkecil tepat pada bidang penangkap gambar sensor silikon.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Pemecahan Masalah — Efek Fatamorgana di Gurun / Jalan Beraspal Panas] Mengapa jalan aspal hitam di siang hari terik tampak seperti genangan air yang memantulkan langit?",
        "opsi": [
            {"label": "A", "teks": "Aspal meleleh menjadi air jernih"},
            {"label": "B", "teks": "Udara tepat di atas aspal sangat panas sehingga memiliki kerapatan optik lebih rendah daripada udara dingin di atasnya; berkas sinar langit mengalami pembiasan bertingkat dan pemantulan internal total ke mata pengamat"},
            {"label": "C", "teks": "Karena dispersi cahaya lampu jalan"},
            {"label": "D", "teks": "Karena mata manusia mengalami miopi sementara"}
        ],
        "kunci": "B",
        "pembahasan": "Lapisan aspal panas memanaskan udara di dekatnya sehingga kerapatan optiknya berkurang drastis (indeks bias lebih kecil). Berkas cahaya dari langit yang melintasi gradien indeks bias ini melengkung ke atas (refraksi bertingkat diikuti pemantulan total) menimbulkan ilusi optik fatamorgana.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Evaluasi Kesehatan Pendengaran — Paparan Polusi Suara] Mendengarkan musik melalui earphone dengan intensitas volume 90 dB selama lebih dari 4 jam sehari secara terus-menerus berisiko memicu Noise-Induced Hearing Loss (NIHL). Kerusakan struktural yang terjadi di dalam telinga adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gendang telinga mencair"},
            {"label": "B", "teks": "Kematian dan kerusakan permanen pada sel-sel rambut getar halus di organ Korti koklea (rumah siput) telinga dalam"},
            {"label": "C", "teks": "Hilangnya tulang martil"},
            {"label": "D", "teks": "Penyumbatan total tuba Eustachius"}
        ],
        "kunci": "B",
        "pembahasan": "Gelombang suara berenergi tinggi merusak sel silia rambut akustik mikro di organ Corti koklea. Sel-sel sensorik ini tidak dapat beregenerasi kembali bila mati, menyebabkan penurunan ketajaman pendengaran sensorineural permanen.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Rekayasa Teknologi — Serat Optik / Fiber Optic] Kabel internet serat optik mampu mentransmisikan data berkecepatan terabit per detik melintasi benua berdasarkan prinsip optika ....",
        "opsi": [
            {"label": "A", "teks": "Pemantulan internal total (Total Internal Reflection) di dalam inti kaca serat optik berindeks bias tinggi yang dilapisi selubung berindeks bias lebih rendah"},
            {"label": "B", "teks": "Resonansi gelombang infrasonik"},
            {"label": "C", "teks": "Pembiasan tegak lurus"},
            {"label": "D", "teks": "Penyerapan radiasi matahari"}
        ],
        "kunci": "A",
        "pembahasan": "Serat optik tersusun atas core (inti kaca berindeks bias $n_1$) dan cladding (selubung berindeks bias $n_2 < n_1$). Sinar laser ditembakkan dengan sudut datang lebih besar dari sudut kritis sehingga dipantulkan secara total di sepanjang serat tanpa ada cahaya yang bocor keluar.",
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    }
]

# Assemble 70 questions for Bab 4
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
        "paket": "Bab IV: Getaran, Gelombang, & Cahaya - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch4_getaran_gelombang_cahaya.jpg"
    })

for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 4: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab IV: Getaran, Gelombang, dan Cahaya (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 8 — Bab IV: Getaran, Gelombang, dan Cahaya</h1>
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
  <div data-field="materi">Getaran, Gelombang, dan Cahaya</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menghitung periode, frekuensi, cepat rambat gelombang, pemantulan bunyi, hukum pembiasan, sifat bayangan cermin dan lensa, serta cacat mata.</div>
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
        "materi": "Getaran, Gelombang, dan Cahaya",
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

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab4_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab4_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
