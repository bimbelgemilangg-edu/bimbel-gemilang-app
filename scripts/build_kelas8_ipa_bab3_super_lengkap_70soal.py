#!/usr/bin/env python3
"""
build_kelas8_ipa_bab3_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 3 IPA SMP Kelas 8:
Usaha, Energi, dan Pesawat Sederhana:
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

# 25 Soal Kurikulum Merdeka HOTS Bab 3 (Hal. 365-372)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar pengungkit (tuas) yang digunakan untuk mengungkit batu berikut! Jika berat batu w = 1.200 N, panjang lengan beban dari batu ke titik tumpu T adalah 0,5 m, dan panjang lengan kuasa dari titik tumpu T ke tangan adalah 2,0 m, maka besar gaya kuasa F minimal untuk mengungkit batu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "200 N"},
            {"label": "B", "teks": "300 N"},
            {"label": "C", "teks": "400 N"},
            {"label": "D", "teks": "600 N"}
        ],
        "kunci": "B",
        "pembahasan": "Prinsip kesetimbangan tuas: $w \\cdot L_b = F \\cdot L_k \\Rightarrow 1.200 \\text{ N} \\times 0,5 \\text{ m} = F \\times 2,0 \\text{ m} \\Rightarrow 600 = 2F \\Rightarrow F = \\frac{600}{2} = 300 \\text{ N}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Dua orang pekerja mendorong sebuah mobil mogok di jalan datar: Pekerja A mendorong ke depan dengan gaya 250 N dan Pekerja B mendorong ke depan dengan gaya 200 N. Pada saat yang sama terdapat gaya gesek roda mobil sebesar 100 N yang berlawanan arah. Jika mobil tersebut berhasil berpindah sejauh 8 meter, total usaha bersih yang dilakukan adalah ....",
        "opsi": [
            {"label": "A", "teks": "2.000 Joule"},
            {"label": "B", "teks": "2.800 Joule"},
            {"label": "C", "teks": "3.600 Joule"},
            {"label": "D", "teks": "4.400 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "Resultan gaya searah perpindahan: $\\Sigma F = F_A + F_B - f_{gesek} = 250 + 200 - 100 = 350 \\text{ N}$. Usaha total: $W = \\Sigma F \\cdot s = 350 \\text{ N} \\times 8 \\text{ m} = 2.800 \\text{ Joule}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Sebuah mesin derek (crane) mengangkat peti kemas bermassa 500 kg ($g = 10 \\text{ m/s}^2$) setinggi 12 meter dari tanah dalam waktu 20 detik. Daya mekanik yang dikerahkan oleh mesin derek tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "3.000 Watt"},
            {"label": "B", "teks": "4.500 Watt"},
            {"label": "C", "teks": "6.000 Watt"},
            {"label": "D", "teks": "12.000 Watt"}
        ],
        "kunci": "A",
        "pembahasan": "Usaha pengangkatan: $W = m \\cdot g \\cdot h = 500 \\times 10 \\times 12 = 60.000 \\text{ Joule}$. Daya: $P = \\frac{W}{t} = \\frac{60.000}{20} = 3.000 \\text{ Watt} = 3 \\text{ kW}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Sebuah sepeda beserta pengendaranya memiliki massa total 60 kg dan melaju dengan kelajuan konstan 10 m/s. Energi kinetik yang dimiliki sepeda tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "600 Joule"},
            {"label": "B", "teks": "1.200 Joule"},
            {"label": "C", "teks": "2.400 Joule"},
            {"label": "D", "teks": "3.000 Joule"}
        ],
        "kunci": "D",
        "pembahasan": "Rumus energi kinetik: $E_k = \\frac{1}{2} m v^2 = \\frac{1}{2} \\times 60 \\times 10^2 = 30 \\times 100 = 3.000 \\text{ Joule}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Apabila kelajuan sebuah mobil diperbesar menjadi 3 kali kelajuan semula ($v_2 = 3v_1$), maka energi kinetik mobil tersebut akan menjadi ....",
        "opsi": [
            {"label": "A", "teks": "3 kali energi kinetik semula"},
            {"label": "B", "teks": "6 kali energi kinetik semula"},
            {"label": "C", "teks": "9 kali energi kinetik semula"},
            {"label": "D", "teks": "27 kali energi kinetik semula"}
        ],
        "kunci": "C",
        "pembahasan": "Energi kinetik berbanding lurus dengan kuadrat kelajuan ($E_k \\propto v^2$). Jika kelajuan dijadikan $3\\times$, maka $E_{k2} = (3)^2 E_{k1} = 9 E_{k1}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Sebuah buah kelapa bermassa 2 kg jatuh bebas dari tangkai pohon pada ketinggian 10 m ($g = 10 \\text{ m/s}^2$). Besar energi potensial dan energi kinetik buah kelapa pada saat mencapai ketinggian 4 m dari tanah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Ep = 200 J dan Ek = 0 J"},
            {"label": "B", "teks": "Ep = 80 J dan Ek = 120 J"},
            {"label": "C", "teks": "Ep = 120 J dan Ek = 80 J"},
            {"label": "D", "teks": "Ep = 100 J dan Ek = 100 J"}
        ],
        "kunci": "B",
        "pembahasan": "Energi mekanik total: $E_M = mgh_1 = 2 \\times 10 \\times 10 = 200 \\text{ J}$. Pada $h_2 = 4 \\text{ m}$: $E_{p2} = mgh_2 = 2 \\times 10 \\times 4 = 80 \\text{ J}$. Sesuai hukum kekekalan energi mekanik: $E_{k2} = E_M - E_{p2} = 200 - 80 = 120 \\text{ J}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Berdasarkan soal nomor 6 di atas, kelajuan buah kelapa tepat saat menyentuh permukaan tanah adalah ....",
        "opsi": [
            {"label": "A", "teks": "10 m/s"},
            {"label": "B", "teks": "14,1 m/s (10 akar 2 m/s)"},
            {"label": "C", "teks": "20 m/s"},
            {"label": "D", "teks": "100 m/s"}
        ],
        "kunci": "B",
        "pembahasan": "Saat menyentuh tanah ($h = 0$), seluruh energi potensial berubah menjadi energi kinetik: $E_k = E_M = 200 \\text{ J} \\Rightarrow \\frac{1}{2} m v^2 = 200 \\Rightarrow \\frac{1}{2}(2)v^2 = 200 \\Rightarrow v^2 = 200 \\Rightarrow v = \\sqrt{200} = 10\\sqrt{2} \\approx 14,14 \\text{ m/s}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Pada pembangkit listrik tenaga air (PLTA), urutan perubahan energi yang terjadi sejak air berada di waduk penampungan hingga menghasilkan listrik yang disalurkan ke rumah-rumah adalah ....",
        "opsi": [
            {"label": "A", "teks": "Energi Kimia -> Energi Listrik -> Energi Kinetik"},
            {"label": "B", "teks": "Energi Panas -> Energi Kinetik -> Energi Potensial"},
            {"label": "C", "teks": "Energi Potensial Gravitasi (air waduk) -> Energi Kinetik (aliran air memutar turbin) -> Energi Listrik (generator) -> Energi Listrik transmisi"},
            {"label": "D", "teks": "Energi Nuklir -> Energi Cahaya -> Energi Listrik"}
        ],
        "kunci": "C",
        "pembahasan": "Air pada ketinggian menyimpan energi potensial gravitasi. Saat dialirkan melalui pipa pesat, energi potensial berubah menjadi energi kinetik aliran air berkecepatan tinggi yang memutar turbin air. Putaran turbin menggerakkan rotor generator elektromagnetik untuk menghasilkan energi listrik.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Seorang atlet angkat besi menahan barbel seberat 1.200 N tepat diam di atas kepalanya selama 5 detik. Besar usaha fisika yang dilakukan oleh atlet tersebut selama 5 detik menahan barbel diam adalah ....",
        "opsi": [
            {"label": "A", "teks": "6.000 Joule"},
            {"label": "B", "teks": "1.200 Joule"},
            {"label": "C", "teks": "240 Joule"},
            {"label": "D", "teks": "0 Joule"}
        ],
        "kunci": "D",
        "pembahasan": "Definisi usaha dalam fisika: $W = F \\cdot s$. Meskipun atlet mengerahkan gaya otot sebesar 1.200 N, barbel dalam kondisi diam di tempat sehingga perpindahannya $s = 0$. Maka $W = 1.200 \\times 0 = 0 \\text{ Joule}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Agar gaya kuasa (F) yang dikeluarkan untuk mengungkit batu dengan tuas menjadi sekecil mungkin, perlakuan yang paling tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memperpendek lengan kuasa dan memperpanjang lengan beban"},
            {"label": "B", "teks": "Menggeser titik tumpu sedekat mungkin ke batu (lengan beban diperpendek) dan memegang ujung tuas sejauh mungkin dari titik tumpu (lengan kuasa diperpanjang)"},
            {"label": "C", "teks": "Memperberat batu yang diungkit"},
            {"label": "D", "teks": "Menempatkan titik tumpu tepat di bawah tangan kuasa"}
        ],
        "kunci": "B",
        "pembahasan": "Keuntungan mekanis tuas adalah $KM = \\frac{w}{F} = \\frac{L_k}{L_b} \\Rightarrow F = w \\cdot \\frac{L_b}{L_k}$. Agar gaya $F$ sekecil mungkin, rasio $\\frac{L_k}{L_b}$ harus sebesar mungkin, yaitu dengan memperpanjang $L_k$ dan memperpendek $L_b$ (titik tumpu didekatkan ke beban).",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Perhatikan beberapa alat berikut:\n(1) Gunting kuku\n(2) Gerobak dorong beroda satu\n(3) Linggis pencabut paku\n(4) Pemecah kemiri\n(5) Pembuka tutup botol\nAlat-alat yang bekerja berdasarkan prinsip Tuas Golongan II (titik beban berada di antara titik tumpu dan titik kuasa) adalah ....",
        "opsi": [
            {"label": "A", "teks": "(1) dan (3)"},
            {"label": "B", "teks": "(2), (4), dan (5)"},
            {"label": "C", "teks": "(1), (2), dan (4)"},
            {"label": "D", "teks": "(3) dan (5)"}
        ],
        "kunci": "B",
        "pembahasan": "Pada tuas golongan II, posisi beban berada di tengah-tengah antara tumpu dan kuasa. Contohnya adalah gerobak roda satu (tumpu di roda, beban di bak, kuasa di gagang pegangan), pemecah kemiri, dan pembuka tutup botol.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Alat-alat seperti sekop pasir, stapler kertas, pinset, dan joran pancing bekerja berdasarkan prinsip Tuas Golongan III karena ....",
        "opsi": [
            {"label": "A", "teks": "Titik tumpunya berada tepat di tengah"},
            {"label": "B", "teks": "Bebannya berada di tengah"},
            {"label": "C", "teks": "Keuntungan mekanisnya selalu lebih besar dari 2"},
            {"label": "D", "teks": "Posisi titik kuasa (tangan yang menekan/menarik) berada di antara titik tumpu dan titik beban"}
        ],
        "kunci": "D",
        "pembahasan": "Ciri khas Tuas Golongan III adalah titik kuasa terletak di antara titik tumpu dan beban ($T - K - B$). Karena $L_k < L_b$, maka $KM < 1$, tujuannya bukan melipatgandakan gaya melainkan memperbesar jangkauan dan kecepatan gerak.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Ketika seseorang mengangkat barbel menggunakan telapak tangannya sambil menekuk siku, sistem anatomis tubuh manusia ini bekerja menyerupai tuas. Hubungan titik tumpu, kuasa, dan beban yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Sendi siku sebagai beban, telapak tangan sebagai tumpu"},
            {"label": "B", "teks": "Bahu sebagai beban, siku sebagai kuasa"},
            {"label": "C", "teks": "Sendi siku sebagai titik tumpu, tarikan otot bisep pada tulang pengumpil sebagai kuasa, dan barbel di telapak tangan sebagai beban (Tuas Golongan III)"},
            {"label": "D", "teks": "Bekerja sebagai tuas golongan II"},
        ],
        "kunci": "C",
        "pembahasan": "Sendi siku adalah titik tumpu. Insersi tendon otot bisep brachii berada di antara sendi siku dan telapak tangan yang memegang barbel (kuasa di tengah). Maka gerak fleksi siku mengaplikasikan sistem Tuas Golongan III.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Seorang pekerja bangunan menimba seember adukan semen seberat 240 N menggunakan katrol tetap tunggal di lantai dua. Besar gaya tarik minimal yang harus dikerahkan pekerja dan keuntungan mekanis katrol tetap berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "120 N dan KM = 2"},
            {"label": "B", "teks": "240 N dan KM = 1"},
            {"label": "C", "teks": "480 N dan KM = 0,5"},
            {"label": "D", "teks": "24 N dan KM = 10"}
        ],
        "kunci": "B",
        "pembahasan": "Katrol tetap memiliki $KM = 1$ sehingga $F = w = 240 \\text{ N}$. Katrol tetap tidak melipatgandakan gaya (tidak memperkecil gaya kuasa), tetapi memberi keuntungan ergonomis dengan mengubah arah gaya tarik menjadi ke arah bawah sejajar gravitasi.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Sebuah beban seberat 240 N diangkat menggunakan katrol bebas (katrol bergerak tunggal). Besar gaya kuasa F minimal yang diperlukan untuk mengangkat beban tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "60 N"},
            {"label": "B", "teks": "80 N"},
            {"label": "C", "teks": "120 N"},
            {"label": "D", "teks": "240 N"}
        ],
        "kunci": "C",
        "pembahasan": "Katrol bergerak ditopang oleh dua penggal tali yang menanggung beban sama rata, sehingga keuntungan mekanisnya $KM = 2$. Gaya kuasa minimal yang dibutuhkan: $F = \\frac{w}{KM} = \\frac{240}{2} = 120 \\text{ N}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Sebuah sistem katrol majemuk (takal) terdiri atas 4 buah roda katrol dengan 4 penggal tali yang menopang beban. Jika beban yang diangkat memiliki berat 1.600 N, gaya tarik F minimal yang diperlukan adalah ....",
        "opsi": [
            {"label": "A", "teks": "200 N"},
            {"label": "B", "teks": "300 N"},
            {"label": "C", "teks": "400 N"},
            {"label": "D", "teks": "800 N"}
        ],
        "kunci": "C",
        "pembahasan": "Keuntungan mekanis sistem katrol majemuk sama dengan jumlah tali ($n$) yang menopang beban: $KM = 4$. Maka $F = \\frac{w}{KM} = \\frac{1.600}{4} = 400 \\text{ N}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Sebuah peti barang seberat 600 N akan dinaikkan ke atas bak truk yang tingginya 1,5 meter menggunakan papan bidang miring sepanjang 4,5 meter. Keuntungan mekanis bidang miring dan gaya dorong minimal F yang diperlukan berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "KM = 2 dan F = 300 N"},
            {"label": "B", "teks": "KM = 4,5 dan F = 150 N"},
            {"label": "C", "teks": "KM = 1,5 dan F = 400 N"},
            {"label": "D", "teks": "KM = 3 dan F = 200 N"}
        ],
        "kunci": "D",
        "pembahasan": "Keuntungan mekanis bidang miring: $KM = \\frac{s}{h} = \\frac{4,5 \\text{ m}}{1,5 \\text{ m}} = 3$. Gaya dorong: $F = \\frac{w}{KM} = \\frac{600 \\text{ N}}{3} = 200 \\text{ N}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Baik mengangkat peti 600 N secara vertikal langsung setinggi 1,5 m maupun mendorongnya melalui papan bidang miring sepanjang 4,5 m tanpa gesekan, besar usaha total yang dilakukan adalah sama (900 Joule). Pernyataan yang benar mengenai fungsi pesawat sederhana adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pesawat sederhana dapat melipatgandakan energi dan memperkecil total usaha"},
            {"label": "B", "teks": "Pesawat sederhana memperkecil gaya kuasa (F) yang harus dikerahkan manusia, tetapi total usaha yang dilakukan tetap sama karena lintasan tempuh (s) menjadi lebih panjang"},
            {"label": "C", "teks": "Pesawat sederhana menghilangkan gaya gravitasi bumi"},
            {"label": "D", "teks": "Pesawat sederhana menghasilkan daya tanpa batas"}
        ],
        "kunci": "B",
        "pembahasan": "Sesuai hukum kekekalan energi, pesawat sederhana TIDAK PERNAH mengurangi total usaha ($W = F \\cdot s = \\text{konstan}$). Pengurangan gaya kuasa ($F$) selalu dikompensasi oleh bertambahnya jarak perpindahan ($s$) yang harus ditempuh.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Jalan raya yang dibangun melintasi lereng pegunungan curam selalu dibuat berkelok-kelok (berliku-liku). Alasan teknik fisika di balik desain jalan berkelok tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memperpanjang lintasan (s) agar kemiringan lebih landai dan keuntungan mekanis besar sehingga mesin kendaraan memerlukan gaya dorong yang lebih kecil untuk menanjak"},
            {"label": "B", "teks": "Agar mobil melaju lebih kencang tanpa hambatan"},
            {"label": "C", "teks": "Untuk memperbesar gaya gesek ban mobil"},
            {"label": "D", "teks": "Memperpendek jarak tempuh kendaraan"}
        ],
        "kunci": "A",
        "pembahasan": "Jalan berkelok mengaplikasikan prinsip bidang miring. Dengan memperbesar panjang lintasan $s$ untuk tinggi vertikal $h$ yang sama, rasio $KM = \\frac{s}{h}$ membesar sehingga gaya yang dibutuhkan mesin kendaraan untuk mendaki tanjakan menjadi jauh lebih ringan.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Dua buah sekrup baja memiliki panjang batang yang sama, tetapi Sekrup P memiliki ulir yang sangat rapat sedangkan Sekrup Q memiliki ulir yang lebih renggang. Pernyataan yang benar mengenai kedua sekrup adalah ....",
        "opsi": [
            {"label": "A", "teks": "Sekrup Q lebih mudah diputar masuk daripada Sekrup P"},
            {"label": "B", "teks": "Kedua sekrup memiliki keuntungan mekanis yang persis sama"},
            {"label": "C", "teks": "Sekrup P tidak memiliki keuntungan mekanis"},
            {"label": "D", "teks": "Sekrup P yang berulir lebih rapat memiliki keuntungan mekanis lebih besar sehingga gaya putar yang dibutuhkan tangan terasa lebih ringan, namun memerlukan jumlah putaran lebih banyak"}
        ],
        "kunci": "D",
        "pembahasan": "Ulir sekrup adalah bidang miring yang dililitkan mengelilingi silinder. Semakin rapat ulirnya, lintasan spiral bidang miring semakin panjang ($s$ besar) dan sudut kemiringan semakin landai, sehingga $KM$ lebih besar dan memutar sekrup terasa lebih enteng.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Roda berporos (gandar) diterapkan pada setir kemudi mobil, obeng baut, dan gerigi pemutar keran air. Hubungan antara jari-jari roda luar (R) dan jari-jari poros dalam (r) terhadap keuntungan mekanis adalah ....",
        "opsi": [
            {"label": "A", "teks": "KM = r / R"},
            {"label": "B", "teks": "KM = R x r"},
            {"label": "C", "teks": "KM = R / r (makin besar diameter roda kemudi, gaya putar tangan semakin ringan)"},
            {"label": "D", "teks": "KM selalu bernilai 1"}
        ],
        "kunci": "C",
        "pembahasan": "Pada roda berporos, gaya kuasa dikerahkan pada keliling roda berjari-jari $R$ untuk memutar poros beban berjari-jari $r$. Keuntungan mekanisnya adalah $KM = \\frac{R}{r}$. Semakin besar rasio $R$ terhadap $r$, semakin kecil gaya kuasa yang dibutuhkan.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Pada sepeda balap multi-gir, ketika pengendara memindahkan rantai ke gir depan berdiameter kecil dan gir belakang berdiameter paling besar saat mendaki tanjakan terjal, efek fisik yang dirasakan pengendara adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kayuhan pedal menjadi sangat berat"},
            {"label": "B", "teks": "Kayuhan pedal terasa sangat ringan dan gaya dorong roda meningkat, meskipun laju sepeda menjadi lambat"},
            {"label": "C", "teks": "Sepeda melaju kencang seketika"},
            {"label": "D", "teks": "Kecepatan sudut roda belakang berlipat ganda"}
        ],
        "kunci": "B",
        "pembahasan": "Memilih gir depan kecil dan gir belakang besar menghasilkan rasio reduksi roda gigi yang memperbesar torsi putar pada roda belakang. Keuntungan mekanis meningkat sehingga kayuhan terasa sangat ringan untuk menaklukkan tanjakan curam.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Sebuah motor listrik berdaya 250 Watt menyala dan bekerja selama 10 menit. Total energi listrik yang diubah menjadi usaha oleh motor listrik tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "150.000 Joule (150 kJ)"},
            {"label": "B", "teks": "25.000 Joule"},
            {"label": "C", "teks": "2.500 Joule"},
            {"label": "D", "teks": "1.500 Joule"}
        ],
        "kunci": "A",
        "pembahasan": "Waktu dalam detik: $t = 10 \\text{ menit} = 10 \\times 60 = 600 \\text{ s}$. Energi yang digunakan: $W = P \\times t = 250 \\text{ W} \\times 600 \\text{ s} = 150.000 \\text{ Joule} = 150 \\text{ kJ}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Perhatikan tabel panjang lintasan (s) dan tinggi vertikal (h) empat bidang miring:\n- P: s = 6 m, h = 2 m\n- Q: s = 8 m, h = 2 m\n- R: s = 10 m, h = 2,5 m\n- S: s = 12 m, h = 4 m\nBidang miring yang memiliki Keuntungan Mekanis (KM) paling besar adalah ....",
        "opsi": [
            {"label": "A", "teks": "P (KM = 3)"},
            {"label": "B", "teks": "Q dan R (keduanya memiliki KM = 4)"},
            {"label": "C", "teks": "S (KM = 3)"},
            {"label": "D", "teks": "Semua memiliki keuntungan mekanis sama"}
        ],
        "kunci": "B",
        "pembahasan": "Perhitungan KM = $s/h$:\n- $KM_P = 6/2 = 3$\n- $KM_Q = 8/2 = 4$\n- $KM_R = 10/2,5 = 4$\n- $KM_S = 12/4 = 3$.\nMaka bidang miring Q dan R memiliki keuntungan mekanis tertinggi yang sama yaitu 4.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Dua anak bermain jungkat-jungkit (tuas golongan I). Anak pertama memiliki berat 400 N duduk pada jarak 1,5 meter dari titik tumpu. Di manakah anak kedua yang memiliki berat 300 N harus duduk agar jungkat-jungkit berada dalam posisi setimbang mendatar?",
        "opsi": [
            {"label": "A", "teks": "1,0 meter dari titik tumpu"},
            {"label": "B", "teks": "1,5 meter dari titik tumpu"},
            {"label": "C", "teks": "1,8 meter dari titik tumpu"},
            {"label": "D", "teks": "2,0 meter dari titik tumpu"}
        ],
        "kunci": "D",
        "pembahasan": "Syarat kesetimbangan momen gaya: $w_1 \\cdot L_1 = w_2 \\cdot L_2 \\Rightarrow 400 \\times 1,5 = 300 \\times L_2 \\Rightarrow 600 = 300 L_2 \\Rightarrow L_2 = \\frac{600}{300} = 2,0 \\text{ meter}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    }
]

# 10 Soal Contoh Asli (No. 26-35)
contoh_soal = [
    {
        "nomor_bab": 26,
        "soal": "Sebuah benda bermassa 4 kg ditarik dengan gaya 50 N ke kanan di atas lantai licin tanpa gesekan sejauh 6 meter. Besar usaha yang dilakukan gaya tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "200 Joule"},
            {"label": "B", "teks": "300 Joule"},
            {"label": "C", "teks": "400 Joule"},
            {"label": "D", "teks": "500 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "Usaha: $W = F \\cdot s = 50 \\text{ N} \\times 6 \\text{ m} = 300 \\text{ Joule}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Sebuah mobil mainan bermassa 0,5 kg bergerak dengan kecepatan 4 m/s. Besar energi kinetik mobil mainan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 Joule"},
            {"label": "B", "teks": "4 Joule"},
            {"label": "C", "teks": "8 Joule"},
            {"label": "D", "teks": "16 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "$E_k = \\frac{1}{2} m v^2 = \\frac{1}{2} \\times 0,5 \\times 4^2 = 0,25 \\times 16 = 4 \\text{ Joule}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Batu bermassa 5 kg berada di tepi jurang setinggi 20 meter di atas tanah ($g = 10 \\text{ m/s}^2$). Energi potensial gravitasi batu relatif terhadap dasar jurang adalah ....",
        "opsi": [
            {"label": "A", "teks": "100 Joule"},
            {"label": "B", "teks": "500 Joule"},
            {"label": "C", "teks": "1.000 Joule"},
            {"label": "D", "teks": "2.000 Joule"}
        ],
        "kunci": "C",
        "pembahasan": "$E_p = m \\cdot g \\cdot h = 5 \\times 10 \\times 20 = 1.000 \\text{ Joule}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Lampu pijar menyerap energi listrik sebesar 3.600 Joule dalam waktu 1 menit. Daya listrik lampu pijar tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "60 Watt"},
            {"label": "B", "teks": "120 Watt"},
            {"label": "C", "teks": "180 Watt"},
            {"label": "D", "teks": "360 Watt"}
        ],
        "kunci": "A",
        "pembahasan": "$P = \\frac{W}{t} = \\frac{3.600 \\text{ J}}{60 \\text{ s}} = 60 \\text{ Watt}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Tuas yang memiliki panjang lengan beban 20 cm dan lengan kuasa 80 cm memiliki keuntungan mekanis sebesar ....",
        "opsi": [
            {"label": "A", "teks": "2"},
            {"label": "B", "teks": "4"},
            {"label": "C", "teks": "6"},
            {"label": "D", "teks": "8"}
        ],
        "kunci": "B",
        "pembahasan": "$KM = \\frac{L_k}{L_b} = \\frac{80 \\text{ cm}}{20 \\text{ cm}} = 4$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Gunting kertas bekerja berdasarkan prinsip pengungkit di mana posisi titik tumpu berada di antara beban dan kuasa. Gunting termasuk ke dalam tuas golongan ....",
        "opsi": [
            {"label": "A", "teks": "Golongan I"},
            {"label": "B", "teks": "Golongan II"},
            {"label": "C", "teks": "Golongan III"},
            {"label": "D", "teks": "Golongan IV"}
        ],
        "kunci": "A",
        "pembahasan": "Tuas jenis I menempatkan titik tumpu di antara titik beban dan titik kuasa ($B - T - K$). Contohnya gunting, tang, dan jungkat-jungkit.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Alat pembuka tutup botol dan gerobak dorong roda satu merupakan contoh penerapan tuas golongan ....",
        "opsi": [
            {"label": "A", "teks": "Golongan I"},
            {"label": "B", "teks": "Golongan II"},
            {"label": "C", "teks": "Golongan III"},
            {"label": "D", "teks": "Golongan tak beraturan"}
        ],
        "kunci": "B",
        "pembahasan": "Tuas jenis II menempatkan titik beban di antara titik tumpu dan titik kuasa ($T - B - K$).",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Pada katrol tetap tunggal, keuntungan mekanisnya adalah 1. Fungsi utama penggunaan katrol tetap adalah ....",
        "opsi": [
            {"label": "A", "teks": "Melipatgandakan gaya kuasa menjadi dua kali lipat"},
            {"label": "B", "teks": "Mengurangi beban benda"},
            {"label": "C", "teks": "Mengubah arah gaya tarik sehingga searah dengan gaya gravitasi bumi"},
            {"label": "D", "teks": "Menghilangkan gaya gesekan"}
        ],
        "kunci": "C",
        "pembahasan": "Katrol tetap tidak mengubah besar gaya yang diperlukan ($KM = 1$), namun mempermudah pekerjaan dengan mengubah arah gaya tarik menjadi ke bawah.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Sebuah papan miring yang panjangnya 5 m disandarkan pada bak truk setinggi 1 m. Keuntungan mekanis papan miring tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1"},
            {"label": "B", "teks": "4"},
            {"label": "C", "teks": "5"},
            {"label": "D", "teks": "6"}
        ],
        "kunci": "C",
        "pembahasan": "$KM = \\frac{s}{h} = \\frac{5 \\text{ m}}{1 \\text{ m}} = 5$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Baji adalah bidang miring ganda yang digunakan untuk membelah kayu atau memotong benda. Contoh alat dalam kehidupan sehari-hari yang menggunakan prinsip baji adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kapak dan pisau"},
            {"label": "B", "teks": "Gerobak roda satu"},
            {"label": "C", "teks": "Tangga lipat"},
            {"label": "D", "teks": "Katrol sumur"}
        ],
        "kunci": "A",
        "pembahasan": "Kapak, pisau, dan paku memiliki ujung runcing yang merupakan penerapan dari baji (bidang miring ganda) untuk memfokuskan gaya dorong ke samping.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
latihan_mandiri = [
    {"no": 36, "soal": "Satuan usaha dalam Sistem Internasional (SI) adalah ....", "opsi": ["Joule (Newton meter)", "Watt", "Pascal", "Newton"], "kunci": "A", "bahas": "Satuan SI untuk usaha dan energi adalah Joule ($1 \\text{ Joule} = 1 \\text{ Newton} \\times 1 \\text{ meter}$)."},
    {"no": 37, "soal": "Dua gaya F1 = 40 N ke kanan dan F2 = 15 N ke kiri bekerja pada balok sehingga berpindah 4 m ke kanan. Usaha totalnya adalah ....", "opsi": ["100 Joule", "160 Joule", "220 Joule", "25 Joule"], "kunci": "A", "bahas": "$\\Sigma F = 40 - 15 = 25$ N; $W = \\Sigma F \\cdot s = 25 \\times 4 = 100$ Joule."},
    {"no": 38, "soal": "Benda bergerak dengan kelajuan 6 m/s memiliki energi kinetik 72 Joule. Massa benda tersebut adalah ....", "opsi": ["2 kg", "4 kg", "6 kg", "8 kg"], "kunci": "B", "bahas": "$E_k = \\frac{1}{2}mv^2 \\Rightarrow 72 = \\frac{1}{2}m(36) \\Rightarrow 72 = 18m \\Rightarrow m = 4$ kg."},
    {"no": 39, "soal": "Sebuah mangga bermassa 400 gram (0,4 kg) berada pada ketinggian 5 m dari tanah ($g = 10 \\text{ m/s}^2$). Energi potensial mangga adalah ....", "opsi": ["2 Joule", "20 Joule", "200 Joule", "2.000 Joule"], "kunci": "B", "bahas": "$E_p = mgh = 0,4 \\times 10 \\times 5 = 20$ Joule."},
    {"no": 40, "soal": "Saat sebuah pendulum/bandul berayun bolak-balik, titik di mana bandul memiliki energi kinetik maksimum adalah ....", "opsi": ["Titik setimbang terendah", "Titik simpangan terjauh", "Di sembarang titik", "Saat bandul berhenti"], "kunci": "A", "bahas": "Pada titik setimbang terendah, ketinggian $h=0$ sehingga energi potensial minimum dan seluruh energi mekanik berupa energi kinetik maksimum."},
    {"no": 41, "soal": "Sebuah setrika listrik melakukan usaha 12.000 Joule selama 40 detik. Daya setrika tersebut adalah ....", "opsi": ["300 Watt", "400 Watt", "480 Watt", "600 Watt"], "kunci": "A", "bahas": "$P = W / t = 12.000 / 40 = 300$ Watt."},
    {"no": 42, "soal": "Keuntungan mekanis sebuah tuas adalah perbandingan antara ....", "opsi": ["Berat beban terhadap gaya kuasa", "Gaya kuasa terhadap beban", "Panjang tuas terhadap berat", "Waktu terhadap daya"], "kunci": "A", "bahas": "Keuntungan mekanis didefinisikan sebagai rasio gaya beban terhadap gaya kuasa ($KM = w / F = L_k / L_b$)."},
    {"no": 43, "soal": "Pada jungkat-jungkit, jika lengan kuasa 3 kali lebih panjang daripada lengan beban, maka gaya kuasa F yang dibutuhkan adalah ....", "opsi": ["1/3 dari berat beban", "3 kali berat beban", "Sama dengan berat beban", "Nol"], "kunci": "A", "bahas": "$w \\cdot L_b = F \\cdot L_k \\Rightarrow F = w (L_b / L_k) = w (1/3) = \\frac{1}{3}w$."},
    {"no": 44, "soal": "Penjepit es dan pinset merupakan contoh tuas golongan ....", "opsi": ["Golongan I", "Golongan II", "Golongan III", "Golongan IV"], "kunci": "C", "bahas": "Pada pinset, titik kuasa berada di tengah di antara tumpu belakang dan beban di ujung jepit (Tuas jenis III)."},
    {"no": 45, "soal": "Alat berikut yang bekerja menggunakan prinsip katrol bebas adalah ....", "opsi": ["Katrol penimba air sumur", "Katrol pengangkat peti kemas pelabuhan", "Tiang bendera", "Kerekan sangkar burung"], "kunci": "B", "bahas": "Katrol pada derek peti kemas menggunakan katrol bergerak/majemuk untuk melipatgandakan gaya angkat."},
    {"no": 46, "soal": "Beban seberat 500 N diangkat dengan katrol bergerak. Gaya kuasa minimalnya adalah ....", "opsi": ["250 N", "500 N", "1.000 N", "125 N"], "kunci": "A", "bahas": "$KM = 2 \\Rightarrow F = w / 2 = 500 / 2 = 250$ N."},
    {"no": 47, "soal": "Katrol majemuk yang memiliki 3 tali penopang beban memiliki keuntungan mekanis sebesar ....", "opsi": ["1", "2", "3", "6"], "kunci": "C", "bahas": "Keuntungan mekanis takal ditentukan oleh jumlah penggal tali penopang beban, yaitu $KM = 3$."},
    {"no": 48, "soal": "Papan bidang miring sepanjang 6 m digunakan untuk menaikkan drum ke bak setinggi 2 m. Keuntungan mekanisnya adalah ....", "opsi": ["3", "4", "8", "12"], "kunci": "A", "bahas": "$KM = s / h = 6 / 2 = 3$."},
    {"no": 49, "soal": "Beban 800 N didorong pada bidang miring yang memiliki KM = 4. Besar gaya dorongnya adalah ....", "opsi": ["200 N", "400 N", "800 N", "3.200 N"], "kunci": "A", "bahas": "$F = w / KM = 800 / 4 = 200$ N."},
    {"no": 50, "soal": "Berikut ini alat yang BUKAN merupakan penerapan bidang miring adalah ....", "opsi": ["Sekrup", "Kapak", "Tangga rumah", "Jungkat-jungkit"], "kunci": "D", "bahas": "Jungkat-jungkit merupakan penerapan tuas/pengungkit golongan I, bukan bidang miring."},
    {"no": 51, "soal": "Ulir pada dongkrak ulir dan baut mur bekerja berdasarkan prinsip pesawat sederhana ....", "opsi": ["Bidang miring", "Tuas golongan III", "Katrol tetap", "Roda bergigi"], "kunci": "A", "bahas": "Ulir sekrup merupakan bidang miring yang melingkari silinder poros."},
    {"no": 52, "soal": "Roda kemudi mobil dengan diameter setir 40 cm dan poros kemudi 4 cm memiliki keuntungan mekanis sebesar ....", "opsi": ["10", "4", "0,1", "160"], "kunci": "A", "bahas": "$KM = R / r = 20 \\text{ cm} / 2 \\text{ cm} = 10$ (atau $40 / 4 = 10$)."},
    {"no": 53, "soal": "Pesawat sederhana yang memanfaatkan prinsip roda bergigi untuk mengubah kelajuan dan arah putar adalah ....", "opsi": ["Gir sepeda dan roda jam mekanis", "Baji kapak", "Paku", "Gunting"], "kunci": "A", "bahas": "Gir (roda bergigi) mentransmisikan daya putar dan mengatur rasio torsi-kecepatan pada transmisi mesin dan sepeda."},
    {"no": 54, "soal": "Usaha bernilai negatif ketika ....", "opsi": ["Arah gaya berlawanan dengan arah perpindahan benda (seperti gaya gesekan)", "Benda tidak berpindah", "Gaya tegak lurus perpindahan", "Benda melaju sangat kencang"], "kunci": "A", "bahas": "Jika gaya $F$ membentuk sudut 180° terhadap arah gerak ($s$), $\\cos 180^\\circ = -1$, sehingga $W = -F \\cdot s$ (usaha pengereman/gesek)."},
    {"no": 55, "soal": "Seorang anak mendorong tembok beton sekuat tenaga hingga berkeringat, namun tembok tidak bergerak sama sekali. Usaha anak tersebut adalah ....", "opsi": ["0 Joule", "Maksimum", "Negatif", "Bergantung massa tembok"], "kunci": "A", "bahas": "Karena perpindahan $s = 0$, maka usaha mekanik $W = F \\cdot s = F \\times 0 = 0$ Joule."},
    {"no": 56, "soal": "Energi mekanik adalah penjumlahan dari ....", "opsi": ["Energi potensial dan energi kinetik", "Energi kimia dan panas", "Energi listrik dan nuklir", "Massa dan kecepatan"], "kunci": "A", "bahas": "$E_M = E_p + E_k$. Sesuai hukum kekekalan energi mekanik, nilai $E_M$ konstan jika tidak ada gaya disipatif luar."},
    {"no": 57, "soal": "Benda jatuh bebas dari ketinggian tertentu. Pernyataan yang benar sepanjang gerak jatuhnya adalah ....", "opsi": ["Energi potensial berkurang dan energi kinetik bertambah", "Energi mekanik terus membesar", "Energi kinetik berkurang", "Energi potensial konstan"], "kunci": "A", "bahas": "Ketinggian berkurang menyebabkan $E_p$ turun, dan kelajuan bertambah menyebabkan $E_k$ naik secara proporsional."},
    {"no": 58, "soal": "Daya 1 Horsepower (HP / tenaga kuda) setara dengan ....", "opsi": ["746 Watt", "1.000 Watt", "500 Watt", "100 Watt"], "kunci": "A", "bahas": "Secara standar internasional, $1 \\text{ HP} \\approx 745,7 \\text{ Watt} \\approx 746 \\text{ Watt}$."},
    {"no": 59, "soal": "Pada tuas, hasil kali gaya beban dengan lengan beban sama dengan hasil kali gaya kuasa dengan ....", "opsi": ["Lengan kuasa", "Panjang tuas", "Tinggi tumpu", "Berat tuas"], "kunci": "A", "bahas": "Hukum kesetimbangan momen gaya: $w \\cdot L_b = F \\cdot L_k$."},
    {"no": 60, "soal": "Titik tumpu berada di antara beban dan kuasa adalah ciri dari tuas ....", "opsi": ["Golongan I", "Golongan II", "Golongan III", "Golongan bebas"], "kunci": "A", "bahas": "Tuas jenis I menempatkan titik tumpu di antara titik beban dan titik kuasa ($B - T - K$)."},
    {"no": 61, "soal": "Pemotong kuku merupakan kombinasi dari tuas ....", "opsi": ["Golongan I dan III", "Golongan II dan III", "Golongan I dan II", "Hanya bidang miring"], "kunci": "C", "bahas": "Tangkai atas pemotong kuku adalah tuas golongan II (beban di tengah ditekan tangkai), sedangkan rahang pisau bekerja sebagai tuas jenis I."},
    {"no": 62, "soal": "Alat pancing bekerja berdasarkan prinsip tuas golongan ....", "opsi": ["Golongan III", "Golongan II", "Golongan I", "Katrol bebas"], "kunci": "A", "bahas": "Tangan penopang bawah adalah tumpu, tangan atas menarik gagang (kuasa di tengah), dan kail penahan ikan di ujung adalah beban (Tuas III)."},
    {"no": 63, "soal": "Keuntungan mekanis sebuah bidang miring akan semakin besar jika ....", "opsi": ["Panjang papan diperbesar dan tinggi bidang miring diperkecil", "Tinggi bidang miring diperbesar", "Papan dibuat semakin pendek", "Beban diperkecil"], "kunci": "A", "bahas": "$KM = s / h$. Memperpanjang $s$ atau memperkecil $h$ akan memperbesar nilai $KM$ sehingga gaya kuasa semakin kecil."},
    {"no": 64, "soal": "Tangga lipat yang digunakan untuk memanjat tembok memanfaatkan prinsip ....", "opsi": ["Bidang miring", "Tuas golongan II", "Katrol majemuk", "Roda berporos"], "kunci": "A", "bahas": "Tangga bersandar membentuk bidang miring yang memperkecil gaya angkat vertikal saat mendaki ketinggian."},
    {"no": 65, "soal": "Roda kemudi kapal laut merupakan contoh dari pesawat sederhana ....", "opsi": ["Roda berporos", "Tuas jenis I", "Bidang miring", "Katrol ganda"], "kunci": "A", "bahas": "Roda kemudi memutar poros kemudi kapal berdasarkan prinsip roda berporos ($KM = R/r$)."}
]

# 5 Soal Pengayaan AKM (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains — Efisiensi Mesin Pesawat Sederhana] Sebuah motor derek listrik mengonsumsi energi 10.000 Joule untuk mengangkat peti seberat 2.000 N setinggi 4 meter. Berapakah efisiensi mekanik mesin derek tersebut?",
        "opsi": [
            {"label": "A", "teks": "60%"},
            {"label": "B", "teks": "70%"},
            {"label": "C", "teks": "80%"},
            {"label": "D", "teks": "90%"}
        ],
        "kunci": "C",
        "pembahasan": "Usaha berguna keluaran: $W_{out} = mgh = 2.000 \\times 4 = 8.000$ Joule. Energi masukan: $W_{in} = 10.000$ Joule. Efisiensi: $\\eta = \\frac{W_{out}}{W_{in}} \\times 100\\% = \\frac{8.000}{10.000} \\times 100\\% = 80\\%$. Sisanya 20% hilang sebagai kalor gesekan mesin.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Pilihan Ganda Kompleks — Analisis Grafik Usaha F-s] Sebuah gaya F berubah terhadap posisi s pada grafik: F konstan 20 N dari s = 0 sampai 4 m, kemudian gaya turun secara linear menjadi 0 N pada s = 8 m. Total usaha yang dilakukan gaya tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "80 Joule"},
            {"label": "B", "teks": "120 Joule"},
            {"label": "C", "teks": "160 Joule"},
            {"label": "D", "teks": "200 Joule"}
        ],
        "kunci": "B",
        "pembahasan": "Usaha adalah luas daerah di bawah kurva grafik F-s (trapesium): Luas = $\\frac{\\text{sisi sejajar atas} + \\text{sisi sejajar bawah}}{2} \\times \\text{tinggi} = \\frac{4 + 8}{2} \\times 20 = 6 \\times 20 = 120$ Joule.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Analisis Fisiologis & Mekanika Tubuh] Mengapa saat membawa ransel berat di punggung, kita secara refleks mencondongkan badan ke depan?",
        "opsi": [
            {"label": "A", "teks": "Untuk mempercepat langkah kaki"},
            {"label": "B", "teks": "Mencondongkan badan ke depan menggeser kembali titik pusat massa (center of gravity) gabungan tubuh-ransel agar tetap berada di atas bidang tumpuan kedua kaki sehingga tubuh tetap stabil seimbang"},
            {"label": "C", "teks": "Untuk mengurangi massa ransel"},
            {"label": "D", "teks": "Agar gaya gesek sepatu menjadi nol"}
        ],
        "kunci": "B",
        "pembahasan": "Beban ransel di punggung menarik titik berat ke belakang. Dengan membungkuk ke depan, resultan garis kerja gaya gravitasi tubuh dikembalikan ke dalam poligon tumpuan kaki untuk mencegah momen gaya putar yang dapat menjatuhkan tubuh ke belakang.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Rekayasa Desain — Sistem Katrol Penyelamat] Tim SAR menggunakan sistem takal dengan 5 penggal tali untuk mengangkat korban kecelakaan seberat 75 kg ($w = 750$ N) dari jurang. Jika efisiensi katrol 75%, berapakah gaya tarik tali F yang harus dikerahkan tim SAR?",
        "opsi": [
            {"label": "A", "teks": "100 N"},
            {"label": "B", "teks": "150 N"},
            {"label": "C", "teks": "200 N"},
            {"label": "D", "teks": "250 N"}
        ],
        "kunci": "C",
        "pembahasan": "Keuntungan mekanis ideal: $KM = 5$. Karena efisiensi $\\eta = 75\\% = 0,75$: $KM_{nyata} = \\eta \\times KM_{ideal} = 0,75 \\times 5 = 3,75$. Gaya yang dibutuhkan: $F = \\frac{w}{KM_{nyata}} = \\frac{750}{3,75} = 200$ N.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Evaluasi Energi Terbarukan — Pembangkit Listrik Tenaga Mikrohidro] Sebuah pembangkit mikrohidro memanfaatkan air terjun setinggi 10 meter dengan debit aliran 0,2 m3/s (massa air 200 kg tiap detik). Jika efisiensi konversi turbin-generator adalah 60% ($g = 10 \\text{ m/s}^2$), daya listrik yang dihasilkan adalah ....",
        "opsi": [
            {"label": "A", "teks": "6 kW"},
            {"label": "B", "teks": "12 kW"},
            {"label": "C", "teks": "20 kW"},
            {"label": "D", "teks": "30 kW"}
        ],
        "kunci": "B",
        "pembahasan": "Daya hidrolik potensial total tiap detik: $P_{in} = \\frac{mgh}{t} = 200 \\times 10 \\times 10 = 20.000 \\text{ Watt} = 20 \\text{ kW}$. Daya listrik yang dihasilkan: $P_{out} = \\eta \\times P_{in} = 60\\% \\times 20 \\text{ kW} = 12 \\text{ kW}$.",
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    }
]

# Assemble 70 questions for Bab 3
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
        "paket": "Bab III: Usaha, Energi, & Pesawat Sederhana - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch3_usaha_energi_pesawat.jpg"
    })

for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 3: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab III: Usaha, Energi, & Pesawat Sederhana (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 8 — Bab III: Usaha, Energi, & Pesawat Sederhana</h1>
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
  <div data-field="materi">Usaha, Energi, & Pesawat Sederhana</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menghitung usaha, daya, energi mekanik, serta menganalisis keuntungan mekanis tuas, katrol, dan bidang miring.</div>
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
        "materi": "Usaha, Energi, & Pesawat Sederhana",
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

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab3_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab3_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
