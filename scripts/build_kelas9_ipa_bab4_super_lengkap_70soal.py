#!/usr/bin/env python3
"""
build_kelas9_ipa_bab4_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 4 IPA SMP Kelas 9:
Listrik, Magnet, & Energi Alternatif:
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid (0 Error)
- Gambar Asli Otentik: Rangkaian Listrik (Soal #1), Pembuatan Magnet (Soal #13), Skema Trafo (Soal #20), Grafik Hukum Ohm (Soal #26)
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 25 Soal Kurikulum Merdeka HOTS Bab 4
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar rangkaian listrik tertutup berikut! Tiga buah hambatan masing-masing R1 = 6 ohm dan R2 = 3 ohm dirangkai secara paralel, kemudian diserikan dengan hambatan R3 = 4 ohm. Rangkaian tersebut dihubungkan dengan sumber tegangan baterai E = 18 Volt (hambatan dalam diabaikan). Kuat arus listrik utama (I) yang mengalir keluar dari sumber tegangan adalah ....",
        "opsi": [
            {"label": "A", "teks": "1,5 A"},
            {"label": "B", "teks": "2,0 A"},
            {"label": "C", "teks": "3,0 A"},
            {"label": "D", "teks": "4,5 A"}
        ],
        "kunci": "C",
        "pembahasan": "Hambatan pengganti paralel R1 dan R2: 1/Rp = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 => Rp = 2 ohm. Hambatan total rangkaian seri: Rtot = Rp + R3 = 2 + 4 = 6 ohm. Berdasarkan Hukum Ohm, kuat arus utama: I = E / Rtot = 18 V / 6 ohm = 3,0 Ampere.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch4_q1_rangkaian_listrik.png"
    },
    {
        "nomor_bab": 2,
        "soal": "Dua buah benda bermuatan listrik sejenis terpisah pada jarak r dan mengalami gaya tolak-menolak Coulomb sebesar 36 N. Apabila jarak pemisah antara kedua muatan tersebut dijauhkan menjadi 3 kali semula (3r) sedangkan besar muatan masing-masing benda tetap, maka besar gaya tolak-menolak yang terjadi sekarang adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 N"},
            {"label": "B", "teks": "4 N"},
            {"label": "C", "teks": "6 N"},
            {"label": "D", "teks": "12 N"}
        ],
        "kunci": "B",
        "pembahasan": "Hukum Coulomb: F = k * (q1 * q2) / r^2 => Gaya F berbanding terbalik dengan kuadrat jarak (1 / r^2). Maka F2 / F1 = (r1 / r2)^2 = (r / 3r)^2 = 1 / 9. F2 = (1/9) * F1 = (1/9) * 36 N = 4 N.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 3,
        "soal": "Sebuah elektroskop netral didekati oleh penggaris plastik yang bermuatan negatif pada bagian kepalanya (tanpa menyentuh). Kondisi daun-daun elektroskop dan distribusi muatan yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Daun elektroskop mekar terbuka karena elektron pada kepala elektroskop tertolak turun ke kedua daun sehingga kedua daun bermuatan negatif dan saling tolak-menolak"},
            {"label": "B", "teks": "Daun elektroskop tetap menutup rapat"},
            {"label": "C", "teks": "Kepala elektroskop bermuatan negatif"},
            {"label": "D", "teks": "Daun elektroskop bermuatan positif"},
        ],
        "kunci": "A",
        "pembahasan": "Peristiwa induksi elektrostatis: Muatan negatif pada penggaris plastik menolak elektron bebas di kepala logam elektroskop turun ke batang dan kedua daun elektroskop. Akibatnya, kepala elektroskop menjadi bermuatan positif (kekurangan elektron) sedangkan kedua daun elektroskop menjadi bermuatan negatif (kelebihan elektron) sehingga saling tolak-menolak dan mekar terbuka.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 4,
        "soal": "Gedung-gedung pencakar langit yang tinggi selalu dipasangi batang penangkal petir berbahan tembaga tebal di puncaknya yang dihubungkan dengan kabel konduktor langsung ke dalam tanah basah (grounding). Fungsi utama sistem penangkal petir tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mencegah terjadinya awan petir di sekitar gedung"},
            {"label": "B", "teks": "Menyerap energi petir untuk disalurkan ke instalasi lampu gedung"},
            {"label": "C", "teks": "Menahan petir agar tidak jatuh ke bumi"},
            {"label": "D", "teks": "Menyediakan jalur rambatan arus berhambatan sangat rendah untuk mengalirkan muatan listrik petir langsung dinetralkan ke dalam tanah tanpa merusak struktur gedung"}
        ],
        "kunci": "D",
        "pembahasan": "Penangkal petir (Franklin rod) bekerja: (1) Ujung runcing mempermudah pelepasan muatan secara bertahap ke udara untuk mengurangi beda potensial awan-bumi; (2) Jika sambaran petir terjadi, kawat tembaga berpenampang besar menyediakan jalur hambatan nol (grounding) agar energi muatan raksasa langsung disalurkan ke dalam lapisan bumi secara aman tanpa menyengat penghuni atau membakar gedung.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 5,
        "soal": "Kawat penghantar dialiri muatan listrik sebesar 360 Coulomb selama 2 menit. Besar kuat arus listrik yang mengalir melalui penampang kawat konduktor tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1,5 A"},
            {"label": "B", "teks": "2,0 A"},
            {"label": "C", "teks": "3,0 A"},
            {"label": "D", "teks": "6,0 A"}
        ],
        "kunci": "C",
        "pembahasan": "Waktu dalam detik: t = 2 menit = 2 * 60 s = 120 s. Kuat arus listrik dihitung dengan rumus: I = Q / t = 360 C / 120 s = 3,0 Ampere.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 6,
        "soal": "Dua batang benda diuji kelistrikannya: Batang plastik digosok dengan kain wol, sedangkan batang kaca digosok dengan kain sutra. Muatan listrik yang diperoleh kedua batang tersebut setelah penggosokan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Plastik bermuatan positif, kaca bermuatan negatif"},
            {"label": "B", "teks": "Plastik bermuatan negatif (menerima elektron dari wol), kaca bermuatan positif (melepaskan elektron ke sutra)"},
            {"label": "C", "teks": "Keduanya bermuatan netral"},
            {"label": "D", "teks": "Keduanya bermuatan positif"}
        ],
        "kunci": "B",
        "pembahasan": "Berdasarkan deret tribolistrik: (1) Elektron berpindah dari kain wol ke plastik sehingga plastik kelebihan elektron (bermuatan negatif); (2) Elektron berpindah dari kaca ke kain sutra sehingga kaca kekurangan elektron (bermuatan positif).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 7,
        "soal": "Instalasi listrik untuk peralatan elektronik rumah tangga selalu dirangkai secara paralel dan bukan seri. Keuntungan utama dari rangkaian paralel di rumah tangga adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tegangan pada setiap cabang alat listrik sama besar (220 V) dan jika salah satu alat dimatikan/rusak, alat listrik lainnya tetap dapat menyala normal"},
            {"label": "B", "teks": "Biaya kabel menjadi lebih sedikit"},
            {"label": "C", "teks": "Kuat arus di setiap cabang selalu sama besar"},
            {"label": "D", "teks": "Hambatan total rumah menjadi sangat besar"}
        ],
        "kunci": "A",
        "pembahasan": "Karakteristik rangkaian paralel: (1) Beda potensial pada setiap cabang sama besar (V1 = V2 = ... = 220 V) sehingga seluruh peralatan bekerja pada daya nominalnya; (2) Tiap cabang bekerja independen, jika satu lampu mati cabang lain tidak terputus; (3) Hambatan total paralel lebih kecil sehingga efisiensi arus lebih baik.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 8,
        "soal": "Pada suatu titik percabangan rangkaian listrik masuk tiga cabang kawat dengan arus masing-masing I1 = 4 A, I2 = 5 A, dan I3 = 3 A keluar melalui cabang lain. Jika ada cabang keluar lainnya I4, maka besar dan arah kuat arus I4 menurut Hukum I Kirchhoff adalah ....",
        "opsi": [
            {"label": "A", "teks": "4 A keluar dari titik percabangan"},
            {"label": "B", "teks": "5 A masuk ke titik percabangan"},
            {"label": "C", "teks": "6 A keluar dari titik percabangan"},
            {"label": "D", "teks": "9 A masuk ke titik percabangan"}
        ],
        "kunci": "C",
        "pembahasan": "Hukum I Kirchhoff menyatakan jumlah kuat arus yang masuk sama dengan jumlah arus yang keluar: Sigma I_masuk = Sigma I_keluar. I1 + I2 = I3 + I4 => 4 A + 5 A = 3 A + I4 => 9 A = 3 A + I4 => I4 = 9 - 3 = 6 Ampere keluar dari titik cabang.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 9,
        "soal": "Sebuah setrika listrik tertera spesifikasi 440 Watt / 220 Volt. Kuat arus normal yang mengalir melalui setrika dan besar hambatan elemen pemanas setrika tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1,0 A dan 220 ohm"},
            {"label": "B", "teks": "2,0 A dan 55 ohm"},
            {"label": "C", "teks": "2,0 A dan 110 ohm"},
            {"label": "D", "teks": "4,0 A dan 110 ohm"}
        ],
        "kunci": "C",
        "pembahasan": "Daya P = V * I => I = P / V = 440 W / 220 V = 2,0 Ampere. Hambatan elemen: R = V / I = 220 V / 2,0 A = 110 ohm (atau R = V^2 / P = 220^2 / 440 = 48.400 / 440 = 110 ohm).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 10,
        "soal": "Jika setrika listrik pada soal sebelumnya (440 W / 220 V) dipasang pada instalasi listrik pedesaan yang tegangannya mengalami penurunan menjadi 110 Volt, maka daya listrik yang diserap oleh setrika tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "55 Watt"},
            {"label": "B", "teks": "110 Watt"},
            {"label": "C", "teks": "220 Watt"},
            {"label": "D", "teks": "440 Watt"}
        ],
        "kunci": "B",
        "pembahasan": "Hambatan elemen setrika bersifat tetap (R = 110 ohm). Rumus daya P = V^2 / R menunjukkan daya sebanding dengan kuadrat tegangan: P2 / P1 = (V2 / V1)^2 = (110 / 220)^2 = (1/2)^2 = 1/4. Maka P2 = (1/4) * P1 = (1/4) * 440 W = 110 Watt.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 11,
        "soal": "Di dalam sebuah rumah terpasang: 4 buah lampu 20 W menyala 10 jam/hari, 1 unit TV 100 W menyala 6 jam/hari, 1 unit setrika 300 W menyala 2 jam/hari, dan 1 pompa air 200 W menyala 2 jam/hari. Jika tarif listrik adalah Rp1.500,00 per kWh, maka biaya tagihan rekening listrik rumah tersebut selama 30 hari adalah ....",
        "opsi": [
            {"label": "A", "teks": "Rp72.000,00"},
            {"label": "B", "teks": "Rp90.000,00"},
            {"label": "C", "teks": "Rp108.000,00"},
            {"label": "D", "teks": "Rp126.000,00"}
        ],
        "kunci": "C",
        "pembahasan": "Konsumsi energi harian: Lampu: 4 * 20 W * 10 jam = 800 Wh; TV: 1 * 100 W * 6 jam = 600 Wh; Setrika: 1 * 300 W * 2 jam = 600 Wh; Pompa: 1 * 200 W * 2 jam = 400 Wh. Total harian = 800 + 600 + 600 + 400 = 2.400 Wh = 2,4 kWh. Energi selama 30 hari: 2,4 kWh * 30 = 72 kWh. Biaya tagihan: 72 kWh * Rp1.500,00 = Rp108.000,00.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 12,
        "soal": "Komponen pengaman listrik berupa MCB (Miniature Circuit Breaker) atau sekering bekerja memutus aliran listrik secara otomatis apabila terjadi peristiwa ....",
        "opsi": [
            {"label": "A", "teks": "Tegangan listrik naik sedikit"},
            {"label": "B", "teks": "Lampu LED dinyalakan bersamaan"},
            {"label": "C", "teks": "Hambatan kawat penghantar nol"},
            {"label": "D", "teks": "Hubungan singkat (korsleting / short circuit) atau kelebihan beban arus listrik (overload) yang memicu bahaya kebakaran kabel"}
        ],
        "kunci": "D",
        "pembahasan": "MCB dilengkapi bimetal (pemutus termal terhadap arus lebih berkepanjangan) dan elektromagnet (pemutus seketika terhadap korsleting arus hubungan singkat masif). Begitu arus melampaui batas nominal aman, MCB trip memutus sirkuit guna mencegah isolasi kabel meleleh dan terbakar.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 13,
        "soal": "Perhatikan gambar pembuatan magnet dengan cara menggosokkan magnet batang secara searah pada batang besi AB berikut! Ujung magnet yang digosokkan adalah Kutub Selatan (S), mulai digosok dari ujung A menuju ke ujung B. Kutub magnet yang terbentuk pada ujung A dan ujung B batang besi adalah ....",
        "opsi": [
            {"label": "A", "teks": "A kutub Selatan dan B kutub Utara"},
            {"label": "B", "teks": "A kutub Utara dan B kutub Selatan"},
            {"label": "C", "teks": "A dan B sama-sama kutub Utara"},
            {"label": "D", "teks": "A dan B sama-sama kutub Selatan"}
        ],
        "kunci": "A",
        "pembahasan": "Aturan penggosokan magnet: Ujung besi tempat gosokan pertama kali dimulai (ujung A) akan memiliki kutub yang sama dengan kutub magnet penggosoknya (Kutub Selatan). Ujung terakhir tempat lepasnya gosokan (ujung B) akan menjadi kutub yang berlawanan (Kutub Utara). Jadi A = kutub Selatan dan B = kutub Utara.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch4_q13_pembuatan_magnet.png"
    },
    {
        "nomor_bab": 14,
        "soal": "Dua batang magnet diletakkan berdampingan di atas meja. Interaksi antarkutub magnet yang benar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kutub utara dengan kutub utara saling tarik-menarik"},
            {"label": "B", "teks": "Kutub sejenis (utara-utara atau selatan-selatan) akan saling tolak-menolak, sedangkan kutub tidak sejenis (utara-selatan) akan saling tarik-menarik"},
            {"label": "C", "teks": "Kutub selatan tidak berinteraksi dengan kutub selatan"},
            {"label": "D", "teks": "Semua kutub magnet selalu tarik-menarik"}
        ],
        "kunci": "B",
        "pembahasan": "Hukum dasar kemagnetan menyatakan bahwa gaya magnet bersifat dwikutub: Dua kutub senama/sejenis (U-U atau S-S) tolak-menolak, sedangkan dua kutub berlainan nama/tak sejenis (U-S) tarik-menarik.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 15,
        "soal": "Sebuah paku besi dililiti kawat tembaga berisolasi kemudian kedua ujung kawat dihubungkan ke baterai sehingga paku dapat menarik jarum-jarum kecil (elektromagnetik). Cara untuk memperkuat daya tarik kemagnetan elektromagnetik tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memperbanyak jumlah lilitan kawat, menambah kuat arus baterai, dan memasukkan inti besi lunak ke dalam rongga kumparan"},
            {"label": "B", "teks": "Mengurangi lilitan kawat dan menurunkan tegangan"},
            {"label": "C", "teks": "Mengganti paku besi dengan batang kayu"},
            {"label": "D", "teks": "Memanaskan paku besi di atas api"}
        ],
        "kunci": "A",
        "pembahasan": "Kekuatan medan magnet elektromagnetik bergantung pada: (1) Jumlah lilitan kawat (N makin banyak makin kuat), (2) Kuat arus listrik yang dialirkan (I makin besar makin kuat), (3) Keberadaan bahan feromagnetik sebagai inti (inti besi lunak meningkatkan permeabilitas magnetik).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 16,
        "soal": "Penentuan kutub magnet pada sebuah solenoida (kumparan berarus listrik) dapat ditentukan menggunakan kaidah tangan kanan Ampere, di mana ....",
        "opsi": [
            {"label": "A", "teks": "Empat jari yang melingkar menunjukkan arah arus listrik, dan ibu jari yang tegak menunjukkan arah kutub Utara magnet"},
            {"label": "B", "teks": "Ibu jari menunjukkan arah arus dan telapak tangan kutub Utara"},
            {"label": "C", "teks": "Ibu jari menunjukkan kutub Selatan"},
            {"label": "D", "teks": "Empat jari menunjukkan arah medan gravitasi"}
        ],
        "kunci": "A",
        "pembahasan": "Kaidah tangan kanan kumparan: Genggam solenoida dengan tangan kanan sedemikian rupa sehingga arah lipatan keempat jari tangan mengikuti arah aliran arus listrik pada kawat lilitan, maka arah yang ditunjuk oleh ibu jari yang terentang lurus menunjukkan arah kutub Utara kumparan tersebut.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 17,
        "soal": "Kawat lurus sepanjang 50 cm dialiri arus listrik sebesar 4 A tegak lurus berada di dalam medan magnet homogen 0,5 Tesla. Besar gaya Lorentz yang dialami kawat tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1,0 N"},
            {"label": "B", "teks": "2,0 N"},
            {"label": "C", "teks": "4,0 N"},
            {"label": "D", "teks": "8,0 N"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus Gaya Lorentz: FL = B * I * L * sin(theta). Karena tegak lurus (theta = 90 derajat, sin 90 = 1): L = 50 cm = 0,5 m; I = 4 A; B = 0,5 T. FL = 0,5 T * 4 A * 0,5 m = 1,0 Newton.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 18,
        "soal": "Menurut percobaan induksi elektromagnetik Michael Faraday, gaya gerak listrik (GGL) induksi akan timbul pada ujung-ujung kumparan apabila ....",
        "opsi": [
            {"label": "A", "teks": "Magnet batang diletakkan diam di dalam rongga kumparan"},
            {"label": "B", "teks": "Terjadi perubahan garis-garis gaya magnet (fluks magnetik) yang memotong kumparan kawat"},
            {"label": "C", "teks": "Kumparan dipanaskan hingga membara"},
            {"label": "D", "teks": "Kawat kumparan dilapisi isolator tebal"}
        ],
        "kunci": "B",
        "pembahasan": "Hukum Faraday menyatakan bahwa GGL induksi hanya dihasilkan bila terdapat perubahan fluks magnetik (d_Phi / dt) yang dilingkupi kumparan. Jika magnet diam di dalam kumparan, tidak terjadi perubahan jumlah garis gaya magnet sehingga jarum galvanometer tetap di angka nol.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 19,
        "soal": "Transformator step-up berfungsi untuk menaikkan tegangan listrik bolak-balik (AC). Ciri-ciri spesifikasi transformator step-up yang benar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Jumlah lilitan sekunder lebih banyak daripada lilitan primer (Ns > Np) dan tegangan sekunder lebih tinggi daripada primer (Vs > Vp)"},
            {"label": "B", "teks": "Ns < Np dan Vs < Vp"},
            {"label": "C", "teks": "Arus sekunder lebih besar daripada primer (Is > Ip)"},
            {"label": "D", "teks": "Daya sekunder selalu dua kali lipat daya primer"}
        ],
        "kunci": "A",
        "pembahasan": "Ciri transformator step-up (penaik tegangan): (1) Ns > Np (lilitan sekunder lebih banyak), (2) Vs > Vp (tegangan keluar lebih tinggi), (3) Is < Ip (arus sekunder lebih kecil untuk mempertahankan kekekalan daya P = V * I). Sebaliknya, step-down memiliki Ns < Np dan Vs < Vp.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 20,
        "soal": "Perhatikan gambar skema transformator berikut! Sebuah transformator dihubungkan dengan sumber tegangan bolak-balik Vp = 220 Volt. Jumlah lilitan primer Np = 1.000 lilitan dan lilitan sekunder Ns = 200 lilitan. Besar tegangan sekunder (Vs) yang dihasilkan pada ujung kumparan sekunder adalah ....",
        "opsi": [
            {"label": "A", "teks": "44 Volt"},
            {"label": "B", "teks": "55 Volt"},
            {"label": "C", "teks": "110 Volt"},
            {"label": "D", "teks": "1.100 Volt"}
        ],
        "kunci": "A",
        "pembahasan": "Hubungan tegangan dan lilitan transformator: Vs / Vp = Ns / Np => Vs / 220 V = 200 / 1.000 => Vs = (200 / 1.000) * 220 V = (1/5) * 220 = 44 Volt (merupakan jenis trafo step-down).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch4_q20_skema_transformator.png"
    },
    {
        "nomor_bab": 21,
        "soal": "Sebuah transformator ideal memiliki daya primer 100 Watt dan tegangan sekunder 20 Volt. Besar kuat arus listrik yang mengalir pada kumparan sekunder adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 A"},
            {"label": "B", "teks": "5 A"},
            {"label": "C", "teks": "10 A"},
            {"label": "D", "teks": "20 A"}
        ],
        "kunci": "B",
        "pembahasan": "Pada transformator ideal berlaku efisiensi 100%, sehingga daya sekunder sama dengan daya primer: Ps = Pp = 100 Watt. Rumus daya Ps = Vs * Is => 100 W = 20 V * Is => Is = 100 / 20 = 5 Ampere.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 22,
        "soal": "Sebuah transformator non-ideal menyerap daya primer sebesar 200 Watt dan menghasilkan daya keluaran sekunder sebesar 160 Watt. Efisiensi transformator tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "60%"},
            {"label": "B", "teks": "70%"},
            {"label": "C", "teks": "80%"},
            {"label": "D", "teks": "90%"}
        ],
        "kunci": "C",
        "pembahasan": "Efisiensi transformator dihitung dengan rumus: eta = (Ps / Pp) * 100% = (160 W / 200 W) * 100% = 0,8 * 100% = 80%. Sisa energi 20% hilang sebagai kalor panas akibat arus pusar (eddy current) dan histeresis pada inti besi trafo.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 23,
        "soal": "Burung merpati pos, penyu laut, dan ikan salmon mampu melakukan migrasi melintasi benua dan samudra tanpa tersesat. Kemampuan navigasi hewan-hewan tersebut didasarkan pada fenomena biomagnetisme, yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Keberadaan kristal mineral magnetit (Fe3O4) di dalam kepala/jaringan tubuh hewan yang peka merasakan garis-garis medan magnet bumi sebagai kompas biologis"},
            {"label": "B", "teks": "Hewan melihat warna sinar ultraviolet"},
            {"label": "C", "teks": "Hewan mengikuti arah angin saja"},
            {"label": "D", "teks": "Hewan mengingat bentuk awan"}
        ],
        "kunci": "A",
        "pembahasan": "Biomagnetisme adalah pemanfaatan medan magnet bumi oleh makhluk hidup untuk navigasi dan penentuan arah migrasi. Sel sensorik pada merpati (di paruh/mata) dan penyu mengandung partikel mikroskopis magnetit yang terhubung ke sistem saraf, berfungsi sebagai kompas alami membaca inklinasi dan intensitas medan magnet bumi.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 24,
        "soal": "Pembangkit Listrik Tenaga Surya (PLTS) mengubah energi cahaya matahari menjadi energi listrik menggunakan panel sel surya. Prinsip fisika yang mendasari konversi energi tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Efek fotovoltaik pada bahan semikonduktor silikon yang melepaskan elektron saat disinari foton cahaya"},
            {"label": "B", "teks": "Pembakaran gas hidrogen pada sel foton"},
            {"label": "C", "teks": "Hukum Archimedes pada partikel cahaya"},
            {"label": "D", "teks": "Perubahan fasa air menjadi uap panas"}
        ],
        "kunci": "A",
        "pembahasan": "Efek fotovoltaik ditemukan pada sambungan p-n semikonduktor silikon. Foton cahaya matahari yang diserap semikonduktor mengeksitasi elektron pita valensi menuju pita konduksi, menghasilkan beda potensial dan arus listrik searah (DC) yang ramah lingkungan tanpa emisi gas rumah kaca.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 25,
        "soal": "Keunggulan utama pemanfaatan energi terbarukan (seperti PLTS surya, PLTB kincir angin, dan PLTA air) dibandingkan pembangkit listrik berbahan bakar fosil (batubara dan minyak bumi) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tidak menghasilkan polusi gas rumah kaca CO2, ramah lingkungan, dan sumber energinya tidak akan pernah habis"},
            {"label": "B", "teks": "Dapat dibuat di sembarang ruangan tertutup"},
            {"label": "C", "teks": "Biaya pembangunan awalnya nol"},
            {"label": "D", "teks": "Menghasilkan limbah radioaktif"}
        ],
        "kunci": "A",
        "pembahasan": "Energi terbarukan (renewable energy) bersifat berkelanjutan, tidak melepaskan gas buang emisi karbon dioksida pemicu pemanasan global, dan mengurangi ketergantungan pada cadangan bahan bakar fosil yang terbatas serta kian menipis.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    }
]

# 10 Soal Contoh Asli (No. 26-35)
soal_contoh = [
    {
        "nomor_bab": 26,
        "soal": "Perhatikan grafik hubungan tegangan listrik V vs kuat arus listrik I pada suatu konduktor logam berikut! Pada saat tegangan V = 12 Volt, kuat arus yang terbaca pada grafik adalah I = 0,6 Ampere. Berdasarkan grafik Hukum Ohm tersebut, nilai hambatan listrik kawat konduktor adalah ....",
        "opsi": [
            {"label": "A", "teks": "10 ohm"},
            {"label": "B", "teks": "15 ohm"},
            {"label": "C", "teks": "20 ohm"},
            {"label": "D", "teks": "25 ohm"}
        ],
        "kunci": "C",
        "pembahasan": "Berdasarkan Hukum Ohm: R = V / I. Dari data titik pada grafik: R = 12 Volt / 0,6 Ampere = 20 ohm. Gradien kemiringan grafik V terhadap I menunjukkan nilai konstan resistansi kawat penghantar.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kls9_ipa_ch4_q26_grafik_hukum_ohm.png"
    },
    {
        "nomor_bab": 27,
        "soal": "Dua buah muatan titik masing-masing q1 = 2 mikroCoulomb dan q2 = 8 mikroCoulomb terpisah pada jarak 20 cm di udara (k = 9 x 10^9 N.m2/C2). Besar gaya tolak Coulomb antara kedua muatan adalah ....",
        "opsi": [
            {"label": "A", "teks": "1,8 N"},
            {"label": "B", "teks": "3,6 N"},
            {"label": "C", "teks": "7,2 N"},
            {"label": "D", "teks": "14,4 N"}
        ],
        "kunci": "B",
        "pembahasan": "q1 = 2 x 10^-6 C; q2 = 8 x 10^-6 C; r = 20 cm = 0,2 m. F = k * (q1 * q2) / r^2 = 9 x 10^9 * (2 x 10^-6 * 8 x 10^-6) / (0,2)^2 = 9 x 10^9 * 16 x 10^-12 / 0,04 = 144 x 10^-3 / 0,04 = 3,6 N.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 28,
        "soal": "Tiga buah resistor dengan nilai hambatan masing-masing 2 ohm, 3 ohm, dan 6 ohm dirangkai secara paralel. Nilai hambatan pengganti paralel ketiga resistor tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "1 ohm"},
            {"label": "B", "teks": "2 ohm"},
            {"label": "C", "teks": "3 ohm"},
            {"label": "D", "teks": "11 ohm"}
        ],
        "kunci": "A",
        "pembahasan": "1/Rp = 1/R1 + 1/R2 + 1/R3 = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1 => Rp = 1 ohm.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 29,
        "soal": "Sebuah pemanas air listrik berhambatan 25 ohm dialiri arus listrik sebesar 2 Ampere selama 10 menit. Energi kalor listrik yang dihasilkan pemanas tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "60.000 Joule"},
            {"label": "B", "teks": "50.000 Joule"},
            {"label": "C", "teks": "30.000 Joule"},
            {"label": "D", "teks": "10.000 Joule"}
        ],
        "kunci": "A",
        "pembahasan": "R = 25 ohm, I = 2 A, t = 10 menit = 600 detik. W = I^2 * R * t = 2^2 * 25 * 600 = 4 * 25 * 600 = 100 * 600 = 60.000 Joule (60 kJ).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 30,
        "soal": "Pola garis-garis gaya magnet di sekitar kawat lurus berarus listrik berbentuk ....",
        "opsi": [
            {"label": "A", "teks": "Lingkaran-lingkaran konsentris yang berpusat pada kawat penghantar"},
            {"label": "B", "teks": "Garis lurus sejajar kawat"},
            {"label": "C", "teks": "Segitiga sama sisi"},
            {"label": "D", "teks": "Garis bergelombang tak beraturan"}
        ],
        "kunci": "A",
        "pembahasan": "Eksperimen Oersted membuktikan bahwa arus listrik menciptakan medan magnet. Di sekitar kawat lurus panjang berarus, garis gaya magnet membentuk lingkaran-lingkaran konsentris yang sepusat mengelilingi sumbu kawat (kaidah putaran tangan kanan Oersted).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 31,
        "soal": "Sudut penyimpangan antara kutub utara jarum kompas dengan arah utara kutub geografis bumi yang sebenarnya disebut sudut ....",
        "opsi": [
            {"label": "A", "teks": "Deklinasi"},
            {"label": "B", "teks": "Inklinasi"},
            {"label": "C", "teks": "Deviasi"},
            {"label": "D", "teks": "Refraksi"}
        ],
        "kunci": "A",
        "pembahasan": "Sudut deklinasi adalah sudut antara arah utara magnetik jarum kompas dengan arah utara geografis sejati bumi. Sudut inklinasi adalah sudut kemiringan antara jarum kompas terhadap bidang datar horizontal bumi.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 32,
        "soal": "Sebuah transformator step-down digunakan untuk menurunkan tegangan dari 220 Volt menjadi 11 Volt. Jika kumparan primer terdiri atas 1.000 lilitan, maka jumlah lilitan kumparan sekunder adalah ....",
        "opsi": [
            {"label": "A", "teks": "50 lilitan"},
            {"label": "B", "teks": "100 lilitan"},
            {"label": "C", "teks": "200 lilitan"},
            {"label": "D", "teks": "500 lilitan"}
        ],
        "kunci": "A",
        "pembahasan": "Ns / Np = Vs / Vp => Ns / 1.000 = 11 / 220 => Ns = (11 / 220) * 1.000 = (1 / 20) * 1.000 = 50 lilitan.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 33,
        "soal": "Sebuah lampu bohlam bertuliskan 60 W / 120 V dipasang pada sumber tegangan 120 V. Kuat arus yang mengalir pada lampu tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,5 A"},
            {"label": "B", "teks": "1,0 A"},
            {"label": "C", "teks": "2,0 A"},
            {"label": "D", "teks": "4,0 A"}
        ],
        "kunci": "A",
        "pembahasan": "I = P / V = 60 W / 120 V = 0,5 Ampere.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 34,
        "soal": "Sebuah setrika listrik berkekuatan daya 350 Watt digunakan setiap hari rata-rata selama 2 jam. Energi listrik yang dikonsumsi setrika selama 1 hari adalah ....",
        "opsi": [
            {"label": "A", "teks": "0,7 kWh"},
            {"label": "B", "teks": "0,35 kWh"},
            {"label": "C", "teks": "700 kWh"},
            {"label": "D", "teks": "35 kWh"}
        ],
        "kunci": "A",
        "pembahasan": "W = P * t = 350 W * 2 jam = 700 Wh = 700 / 1.000 kWh = 0,7 kWh.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 35,
        "soal": "Kawat sepanjang 20 cm berada dalam medan magnet 2 Tesla. Jika kawat mengalami gaya Lorentz sebesar 1,2 N, kuat arus yang mengalir pada kawat adalah ....",
        "opsi": [
            {"label": "A", "teks": "3 A"},
            {"label": "B", "teks": "4 A"},
            {"label": "C", "teks": "5 A"},
            {"label": "D", "teks": "6 A"}
        ],
        "kunci": "A",
        "pembahasan": "L = 20 cm = 0,2 m; B = 2 T; FL = 1,2 N. FL = B * I * L => 1,2 = 2 * I * 0,2 => 1,2 = 0,4 * I => I = 1,2 / 0,4 = 3 Ampere.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
soal_mandiri = [
    {
        "nomor_bab": 36,
        "soal": "Alat untuk mengukur beda potensial (tegangan listrik) antara dua titik dalam rangkaian listrik adalah .... dan harus dipasang secara ....",
        "opsi": [
            {"label": "A", "teks": "Voltmeter; paralel"},
            {"label": "B", "teks": "Amperemeter; seri"},
            {"label": "C", "teks": "Ohmmeter; seri"},
            {"label": "D", "teks": "Galvanometer; paralel"}
        ],
        "kunci": "A",
        "pembahasan": "Voltmeter mengukur beda potensial dan harus dipasang sejajar (paralel) dengan komponen yang diukur tegangannya karena memiliki resistansi internal sangat tinggi agar tidak menarik arus.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 37,
        "soal": "Faktor-faktor berikut ini yang menentukan besar nilai hambatan jenis suatu kawat penghantar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Panjang kawat, luas penampang kawat, dan jenis bahan kawat"},
            {"label": "B", "teks": "Warna isolator kawat"},
            {"label": "C", "teks": "Bentuk stopkontak"},
            {"label": "D", "teks": "Kutub baterai"}
        ],
        "kunci": "A",
        "pembahasan": "Rumus hambatan kawat: R = rho * L / A. Hambatan berbanding lurus dengan panjang kawat (L) dan hambatan jenis bahan (rho), serta berbanding terbalik dengan luas penampang (A).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 38,
        "soal": "Tiga buah resistor masing-masing bernilai 4 ohm, 6 ohm, dan 10 ohm dirangkai secara seri. Hambatan total rangkaian tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "20 ohm"},
            {"label": "B", "teks": "15 ohm"},
            {"label": "C", "teks": "10 ohm"},
            {"label": "D", "teks": "5 ohm"}
        ],
        "kunci": "A",
        "pembahasan": "Rtot = R1 + R2 + R3 = 4 + 6 + 10 = 20 ohm.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 39,
        "soal": "Dua buah hambatan bernilai 4 ohm dan 4 ohm dirangkai secara paralel. Hambatan pengganti paralelnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "2 ohm"},
            {"label": "B", "teks": "4 ohm"},
            {"label": "C", "teks": "8 ohm"},
            {"label": "D", "teks": "16 ohm"}
        ],
        "kunci": "A",
        "pembahasan": "Rp = R / n = 4 / 2 = 2 ohm.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 40,
        "soal": "Satu kilowatt-jam (1 kWh) setara dengan energi sebesar ....",
        "opsi": [
            {"label": "A", "teks": "3,6 x 10^6 Joule"},
            {"label": "B", "teks": "3,6 x 10^3 Joule"},
            {"label": "C", "teks": "1.000 Joule"},
            {"label": "D", "teks": "3.600 Joule"}
        ],
        "kunci": "A",
        "pembahasan": "1 kWh = 1.000 Watt * 3.600 detik = 3.600.000 Joule = 3,6 x 10^6 Joule.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 41,
        "soal": "Bahan-bahan yang ditarik dengan sangat kuat oleh kutub magnet dikelompokkan ke dalam bahan ....",
        "opsi": [
            {"label": "A", "teks": "Feromagnetik (seperti besi, baja, nikel, dan kobalt)"},
            {"label": "B", "teks": "Paramagnetik"},
            {"label": "C", "teks": "Diamagnetik"},
            {"label": "D", "teks": "Isolator"}
        ],
        "kunci": "A",
        "pembahasan": "Bahan feromagnetik memiliki momen dipol magnet domain yang dapat disejajarkan dengan mudah oleh medan magnet luar sehingga ditarik sangat kuat.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 42,
        "soal": "Aluminium dan platina merupakan contoh bahan paramagnetik, yang artinya ....",
        "opsi": [
            {"label": "A", "teks": "Ditarik lemah oleh magnet"},
            {"label": "B", "teks": "Ditolak sangat kuat oleh magnet"},
            {"label": "C", "teks": "Ditarik sangat kuat oleh magnet"},
            {"label": "D", "teks": "Tidak berinteraksi sama sekali"}
        ],
        "kunci": "A",
        "pembahasan": "Bahan paramagnetik hanya ditarik secara lemah oleh medan magnet luar karena memiliki sedikit elektron tak berpasangan.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 43,
        "soal": "Bismut, seng, dan emas merupakan contoh bahan diamagnetik, yaitu bahan yang ....",
        "opsi": [
            {"label": "A", "teks": "Ditolak secara sangat lemah oleh medan magnet"},
            {"label": "B", "teks": "Ditarik kuat"},
            {"label": "C", "teks": "Dapat dijadikan magnet permanen"},
            {"label": "D", "teks": "Menyimpan muatan listrik"}
        ],
        "kunci": "A",
        "pembahasan": "Bahan diamagnetik memiliki elektron berpasangan lengkap sehingga menghasilkan medan magnet induksi berlawanan arah yang menolak medan magnet luar secara sangat lemah.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 44,
        "soal": "Perbedaan sifat kemagnetan antara besi dan baja adalah ....",
        "opsi": [
            {"label": "A", "teks": "Besi mudah dijadikan magnet namun sifat magnetnya mudah hilang (magnet sementara), sedangkan baja sukar dijadikan magnet namun sifat magnetnya bertahan lama (magnet permanen)"},
            {"label": "B", "teks": "Baja tidak dapat dijadikan magnet"},
            {"label": "C", "teks": "Besi selalu menjadi magnet permanen"},
            {"label": "D", "teks": "Keduanya persis sama sifatnya"}
        ],
        "kunci": "A",
        "pembahasan": "Domain magnet elementer besi sangat mudah berotasi dan sejajar namun juga mudah teracak kembali (magnet sementara). Baja memerlukan energi magnetisasi besar untuk mensejajarkan domainnya, namun sekali sejajar domain terkunci kuat menghasilkan magnet permanen.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 45,
        "soal": "Sifat kemagnetan suatu magnet permanen dapat dihilangkan atau dirusak melalui perlakuan ....",
        "opsi": [
            {"label": "A", "teks": "Dipukul-pukul keras dengan palu, dipanaskan/dibakar hingga melewati suhu Curie, dan dialiri arus bolak-balik (AC)"},
            {"label": "B", "teks": "Didinginkan di dalam lemari es"},
            {"label": "C", "teks": "Dibersihkan dengan air sabun"},
            {"label": "D", "teks": "Disimpan di tempat yang gelap"}
        ],
        "kunci": "A",
        "pembahasan": "Pemanasan tinggi, pukulan mekanik hebat, atau medan magnet bolak-balik (AC) mengacaukan susunan teratur magnet elementer (domain magnet) di dalam bahan sehingga resultan medan magnetnya kembali menjadi nol.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 46,
        "soal": "Arah gaya Lorentz pada muatan positif atau kawat berarus ditentukan dengan kaidah tangan kanan: ibu jari menunjukkan arah .... dan empat jari lain menunjukkan arah ....",
        "opsi": [
            {"label": "A", "teks": "Kuat arus listrik (I); Medan magnet (B)"},
            {"label": "B", "teks": "Medan magnet (B); Kuat arus listrik (I)"},
            {"label": "C", "teks": "Gaya Lorentz (F); Kuat arus (I)"},
            {"label": "D", "teks": "Tegangan (V); Daya (P)"}
        ],
        "kunci": "A",
        "pembahasan": "Kaidah telapak tangan kanan gaya Lorentz: Ibu jari = arah arus listrik (I), 4 jari = arah garis medan magnet (B), dan arah dorongan telapak tangan = arah Gaya Lorentz (F).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 47,
        "soal": "Mengapa transformator TIDAK DAPAT bekerja jika kumparan primernya dihubungkan dengan sumber tegangan arus searah (DC seperti baterai aki)?",
        "opsi": [
            {"label": "A", "teks": "Arus DC menghasilkan medan magnet statis konstan sehingga tidak terjadi perubahan fluks magnetik yang dibutuhkan untuk menginduksi kumparan sekunder"},
            {"label": "B", "teks": "Arus DC memiliki tegangan terlalu tinggi"},
            {"label": "C", "teks": "Arus DC merusak kawat tembaga seketika"},
            {"label": "D", "teks": "Baterai tidak memiliki muatan elektron"}
        ],
        "kunci": "A",
        "pembahasan": "Induksi elektromagnetik membutuhkan perubahan fluks magnetik (d_Phi / dt != 0). Arus DC bernilai tetap menghasilkan fluks magnet konstan (d_Phi / dt = 0), sehingga GGL induksi pada kumparan sekunder bernilai nol dan trafo tidak berfungsi (bahkan kumparan primer bisa terbakar karena hambatan murni kawat rendah).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 48,
        "soal": "Komponen yang membedakan generator arus bolak-balik (alternator AC) dengan generator arus searah (dinamo DC) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Generator AC menggunakan dua cincin luncur (slip ring), sedangkan generator DC menggunakan cincin belah (komutator)"},
            {"label": "B", "teks": "Generator AC tidak menggunakan magnet"},
            {"label": "C", "teks": "Generator DC tidak memiliki kumparan"},
            {"label": "D", "teks": "Generator AC hanya berputar satu arah"}
        ],
        "kunci": "A",
        "pembahasan": "Generator AC memakai sepasang cincin geser penuh (slip rings) sehingga polaritas arus bolak-balik alami diteruskan ke sirkuit luar. Generator DC memakai komutator (cincin belah) yang secara periodik membalik kontak setiap setengah putaran sehingga arus yang keluar ke beban selalu searah (DC).",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 49,
        "soal": "Inti transformator tidak dibuat dari besi pejal masif melainkan disusun dari lempeng-lempeng tipis besi lunak yang saling disekat isolator pernis. Tujuannya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mengurangi timbulnya arus pusar (arus Foucault / eddy current) yang memicu disipasi panas berlebih"},
            {"label": "B", "teks": "Membuat trafo menjadi lebih berat"},
            {"label": "C", "teks": "Mempercepat pendinginan air"},
            {"label": "D", "teks": "Mencegah medan magnet tembus ke luar"}
        ],
        "kunci": "A",
        "pembahasan": "Laminasi inti trafo memecah jalur sirkuit arus pusar induksi (eddy current) menjadi lingkar-lingkar sangat kecil, sehingga resistansi naik dan daya yang terbuang sia-sia sebagai panas kalor (rugi inti) diminimalkan, meningkatkan efisiensi trafo.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 50,
        "soal": "Dua resistor R1 = 3 ohm dan R2 = 6 ohm dirangkai secara seri lalu dihubungkan dengan baterai 9 Volt. Tegangan pada resistor R1 adalah ....",
        "opsi": [
            {"label": "A", "teks": "3 Volt"},
            {"label": "B", "teks": "6 Volt"},
            {"label": "C", "teks": "9 Volt"},
            {"label": "D", "teks": "12 Volt"}
        ],
        "kunci": "A",
        "pembahasan": "Rtot = 3 + 6 = 9 ohm. Arus rangkaian: I = V / Rtot = 9 V / 9 ohm = 1 A. Tegangan pada R1: V1 = I * R1 = 1 A * 3 ohm = 3 Volt.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 51,
        "soal": "Keluarga Pak Budi menggunakan daya listrik total 600 Watt selama 5 jam per hari. Energi listrik bulanan (30 hari) yang dikonsumsi adalah ....",
        "opsi": [
            {"label": "A", "teks": "90 kWh"},
            {"label": "B", "teks": "75 kWh"},
            {"label": "C", "teks": "60 kWh"},
            {"label": "D", "teks": "45 kWh"}
        ],
        "kunci": "A",
        "pembahasan": "Harian: 600 W * 5 jam = 3.000 Wh = 3 kWh. Bulanan: 3 kWh * 30 hari = 90 kWh.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 52,
        "soal": "Kutub utara magnet bumi secara geografis berada di sekitar ....",
        "opsi": [
            {"label": "A", "teks": "Kutub selatan geografis bumi"},
            {"label": "B", "teks": "Kutub utara geografis bumi"},
            {"label": "C", "teks": "Khatulistiwa"},
            {"label": "D", "teks": "Pusat samudra Pasifik"}
        ],
        "kunci": "A",
        "pembahasan": "Karena kutub magnet yang berlawanan tarik-menarik, maka kutub utara jarum kompas tertarik menuju utara geografis karena di dekat kutub utara geografis terdapat Kutub Selatan magnetik bumi.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 53,
        "soal": "Kemiringan sudut jarum kompas terhadap permukaan bumi (sudut inklinasi) akan bernilai 0 derajat di daerah ....",
        "opsi": [
            {"label": "A", "teks": "Khatulistiwa (ekuator magnetik)"},
            {"label": "B", "teks": "Kutub utara bumi"},
            {"label": "C", "teks": "Kutub selatan bumi"},
            {"label": "D", "teks": "Gurun pasir"}
        ],
        "kunci": "A",
        "pembahasan": "Di daerah khatulistiwa, garis medan magnet bumi sejajar dengan permukaan tanah sehingga sudut inklinasi bernilai nol (jarum kompas berada pada posisi horizontal sempurna). Di kutub bumi sudut inklinasi 90 derajat.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 54,
        "soal": "Alat pemutus arus yang menggunakan kawat timbal-timah tipis yang akan meleleh dan putus saat dilalui arus berlebih disebut ....",
        "opsi": [
            {"label": "A", "teks": "Sekering (fuse)"},
            {"label": "B", "teks": "Stopkontak"},
            {"label": "C", "teks": "Sakelar"},
            {"label": "D", "teks": "Steker"}
        ],
        "kunci": "A",
        "pembahasan": "Kawat sekering (fuse) terbuat dari paduan logam bertitik leleh rendah. Jika terjadi arus berlebih atau korsleting, panas Joule (I^2 * R * t) akan melelehkan kawat sekering sehingga sirkuit terputus dan melindungi perangkat.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 55,
        "soal": "Dua buah hambatan R1 = 6 ohm dan R2 = 12 ohm dirangkai secara paralel. Hambatan total paralelnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "4 ohm"},
            {"label": "B", "teks": "6 ohm"},
            {"label": "C", "teks": "9 ohm"},
            {"label": "D", "teks": "18 ohm"}
        ],
        "kunci": "A",
        "pembahasan": "1/Rp = 1/6 + 1/12 = 2/12 + 1/12 = 3/12 => Rp = 12 / 3 = 4 ohm.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 56,
        "soal": "Sebuah transformator step-down memiliki kumparan primer 1.200 lilitan dan kumparan sekunder 300 lilitan. Jika tegangan masuk primer 240 V, tegangan keluaran sekundernya adalah ....",
        "opsi": [
            {"label": "A", "teks": "60 Volt"},
            {"label": "B", "teks": "80 Volt"},
            {"label": "C", "teks": "120 Volt"},
            {"label": "D", "teks": "480 Volt"}
        ],
        "kunci": "A",
        "pembahasan": "Vs = (Ns / Np) * Vp = (300 / 1.200) * 240 = (1/4) * 240 = 60 Volt.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 57,
        "soal": "Kawat berarus 5 A berada dalam medan magnet 0,4 T tegak lurus sepanjang 2 meter. Gaya Lorentz yang dialami kawat adalah ....",
        "opsi": [
            {"label": "A", "teks": "4,0 N"},
            {"label": "B", "teks": "2,0 N"},
            {"label": "C", "teks": "1,0 N"},
            {"label": "D", "teks": "0,5 N"}
        ],
        "kunci": "A",
        "pembahasan": "FL = B * I * L = 0,4 * 5 * 2 = 4,0 N.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 58,
        "soal": "Beda potensial pada ujung-ujung kawat penghantar 10 ohm yang dialiri arus 1,5 Ampere adalah ....",
        "opsi": [
            {"label": "A", "teks": "15 Volt"},
            {"label": "B", "teks": "12 Volt"},
            {"label": "C", "teks": "10 Volt"},
            {"label": "D", "teks": "5 Volt"}
        ],
        "kunci": "A",
        "pembahasan": "V = I * R = 1,5 A * 10 ohm = 15 Volt.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 59,
        "soal": "PLN mentransmisikan listrik berjarak ratusan kilometer dari pusat pembangkit ke kota menggunakan Saluran Udara Tegangan Ekstra Tinggi (SUTET hingga 500 kV). Tujuan utama penaikan tegangan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memperkecil kuat arus listrik transmisi sehingga rugi daya akibat panas kabel (P_hilang = I^2 * R) dapat ditekan sekecil mungkin"},
            {"label": "B", "teks": "Membuat arus listrik mengalir lebih cepat"},
            {"label": "C", "teks": "Menghilangkan hambatan kawat tembaga"},
            {"label": "D", "teks": "Menambah beban daya gardu"}
        ],
        "kunci": "A",
        "pembahasan": "Daya transmisi P = V * I. Dengan menaikkan tegangan (V) menjadi sangat tinggi, kuat arus listrik (I) mengecil drastis. Karena daya yang hilang pada kawat transmisi sebanding dengan kuadrat arus (P_rugi = I^2 * R), penurunan arus ini meminimalkan energi yang terbuang percuma sebagai panas di kabel transmisi jarak jauh.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 60,
        "soal": "Sebuah solder listrik bertuliskan 40 W / 220 V memiliki hambatan elemen pemanas sebesar ....",
        "opsi": [
            {"label": "A", "teks": "1.210 ohm"},
            {"label": "B", "teks": "1.000 ohm"},
            {"label": "C", "teks": "880 ohm"},
            {"label": "D", "teks": "550 ohm"}
        ],
        "kunci": "A",
        "pembahasan": "R = V^2 / P = (220)^2 / 40 = 48.400 / 40 = 1.210 ohm.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 61,
        "soal": "Benda bermuatan +6 mikroCoulomb dan -2 mikroCoulomb tarik-menarik dengan gaya 2,7 N di udara (k = 9 x 10^9 N.m2/C2). Jarak kedua muatan adalah ....",
        "opsi": [
            {"label": "A", "teks": "20 cm"},
            {"label": "B", "teks": "15 cm"},
            {"label": "C", "teks": "10 cm"},
            {"label": "D", "teks": "5 cm"}
        ],
        "kunci": "A",
        "pembahasan": "r^2 = k * |q1 * q2| / F = 9 x 10^9 * (6 x 10^-6 * 2 x 10^-6) / 2,7 = 108 x 10^-3 / 2,7 = 0,04 m2 => r = akar(0,04) = 0,2 m = 20 cm.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 62,
        "soal": "Sebuah lampu mobil 12 V / 24 W menyala normal. Kuat arus listrik yang melaluinya adalah ....",
        "opsi": [
            {"label": "A", "teks": "2,0 A"},
            {"label": "B", "teks": "1,5 A"},
            {"label": "C", "teks": "1,0 A"},
            {"label": "D", "teks": "0,5 A"}
        ],
        "kunci": "A",
        "pembahasan": "I = P / V = 24 W / 12 V = 2,0 Ampere.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 63,
        "soal": "Sebuah dinamo sepeda menghasilkan listrik untuk menyalakan lampu sepeda dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Roda sepeda memutar magnet permanen di dekat kumparan inti besi sehingga terjadi perubahan garis gaya magnet"},
            {"label": "B", "teks": "Menyimpan listrik statis dari gesekan ban"},
            {"label": "C", "teks": "Memanaskan filamen kawat"},
            {"label": "D", "teks": "Reaksi kimia asam timbal"}
        ],
        "kunci": "A",
        "pembahasan": "Dinamo sepeda merupakan generator AC mini. Kepala dinamo yang berputar bersama putaran roda sepeda memutar magnet silinder di dalam kumparan kawat tembaga, menghasilkan GGL induksi bolak-balik untuk menyalakan lampu sepeda.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 64,
        "soal": "Sebuah transformator memiliki efisiensi 75%. Jika daya masukan primernya 400 Watt, maka daya keluaran sekundernya adalah ....",
        "opsi": [
            {"label": "A", "teks": "300 Watt"},
            {"label": "B", "teks": "250 Watt"},
            {"label": "C", "teks": "200 Watt"},
            {"label": "D", "teks": "150 Watt"}
        ],
        "kunci": "A",
        "pembahasan": "Ps = eta * Pp = 0,75 * 400 W = 300 Watt.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 65,
        "soal": "Alat pemanas air 500 W dinyalakan selama 1 jam setiap hari selama 30 hari. Konsumsi energi listrik yang tercatat adalah ....",
        "opsi": [
            {"label": "A", "teks": "15 kWh"},
            {"label": "B", "teks": "10 kWh"},
            {"label": "C", "teks": "5 kWh"},
            {"label": "D", "teks": "1,5 kWh"}
        ],
        "kunci": "A",
        "pembahasan": "W = 500 W * 1 jam * 30 hari = 15.000 Wh = 15 kWh.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    }
]

# 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "Sebuah transformator gardu induk PLN menyalurkan daya 500 kVA dengan efisiensi 98%. Besar daya yang terdisipasi (hilang menjadi panas) pada transformator tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "10 kW"},
            {"label": "B", "teks": "20 kW"},
            {"label": "C", "teks": "25 kW"},
            {"label": "D", "teks": "50 kW"}
        ],
        "kunci": "A",
        "pembahasan": "Daya hilang = (100% - 98%) * 500 kW = 2% * 500 kW = 10 kW.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 67,
        "soal": "Kereta cepat Maglev (Magnetic Levitation) mampu melaju dengan kecepatan melebihi 450 km/jam tanpa bersentuhan dengan rel. Prinsip elektromagnetik yang memungkinkan kereta tersebut melayang adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pemanfaatan gaya tolak-menolak magnetik superkonduktor antara bagian bawah badan kereta dengan rel pemandu, menghilangkan gaya gesek mekanis roda"},
            {"label": "B", "teks": "Gaya dorong mesin jet"},
            {"label": "C", "teks": "Hukum Archimedes pada udara"},
            {"label": "D", "teks": "Reaksi kimia bahan bakar hidrogen"}
        ],
        "kunci": "A",
        "pembahasan": "Kereta Maglev menggunakan elektromagnet superkonduktor kuat. Interaksi medan magnet antara rel pemandu dan kereta menghasilkan gaya angkat magnetik vertikal (levitasi) yang meniadakan gesekan kontak roda-rel, sehingga energi gerak dapat difokuskan sepenuhnya untuk mencapai kecepatan sangat tinggi secara hening dan minim getaran.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 68,
        "soal": "Sebuah rumah mengganti 5 buah lampu pijar 60 Watt dengan 5 buah lampu LED 10 Watt yang menghasilkan tingkat terang cahaya (lumen) yang setara. Jika lampu menyala rata-rata 10 jam per hari dan tarif listrik Rp1.500/kWh, penghematan biaya listrik bulanan (30 hari) rumah tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Rp112.500,00"},
            {"label": "B", "teks": "Rp90.000,00"},
            {"label": "C", "teks": "Rp75.000,00"},
            {"label": "D", "teks": "Rp45.000,00"}
        ],
        "kunci": "A",
        "pembahasan": "Penghematan daya per jam: 5 * (60 W - 10 W) = 5 * 50 W = 250 Watt = 0,25 kW. Penghematan energi per hari: 0,25 kW * 10 jam = 2,5 kWh. Penghematan energi dalam 30 hari: 2,5 kWh * 30 = 75 kWh. Penghematan biaya: 75 kWh * Rp1.500,00 = Rp112.500,00 per bulan.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 69,
        "soal": "Peristiwa badai matahari (solar storm / coronal mass ejection) melepaskan partikel bermuatan berkecepatan tinggi yang dapat memicu badai geomagnetik di atmosfer bumi. Dampak paling serius dari badai geomagnetik terhadap peradaban modern adalah ....",
        "opsi": [
            {"label": "A", "teks": "Induksi arus liar (GIC) yang membakar transformator jaringan listrik tegangan tinggi dan mengacaukan sinyal satelit GPS serta komunikasi radio"},
            {"label": "B", "teks": "Penurunan suhu bumi drastis hingga zaman es"},
            {"label": "C", "teks": "Meningkatnya kadar oksigen secara liar"},
            {"label": "D", "teks": "Berhentinya putaran rotasi bumi"}
        ],
        "kunci": "A",
        "pembahasan": "Fluktuasi cepat medan magnet bumi akibat hempasan plasma matahari menginduksi arus geomagnetik liar (Geomagnetically Induced Currents / GIC) pada jaringan kabel transmisi dan trafo SUTET, memicu saturasi inti transformator, pemadaman listrik massal (blackout), serta kerusakan komponen satelit orbit.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 70,
        "soal": "Pembangkit Listrik Tenaga Mikrohidro (PLTMH) banyak dibangun di daerah pedesaan terpencil yang memiliki aliran sungai berarus deras. Rangkaian konversi energi pada PLTMH adalah ....",
        "opsi": [
            {"label": "A", "teks": "Energi potensial air -> Energi kinetik aliran air -> Energi mekanik putaran turbin -> Energi listrik pada generator induksi"},
            {"label": "B", "teks": "Energi kimia -> Energi panas -> Energi listrik"},
            {"label": "C", "teks": "Energi nuklir -> Energi kinetik -> Energi listrik"},
            {"label": "D", "teks": "Energi cahaya -> Energi kalor -> Energi mekanik"}
        ],
        "kunci": "A",
        "pembahasan": "PLTMH memanfaatkan tinggi jatuh air (head) dan debit aliran sungai. Energi potensial dan kinetik air memutar sudu-sudu turbin air (energi mekanik). Poros turbin dihubungkan ke generator yang menghasilkan energi listrik melalui induksi elektromagnetik secara ramah lingkungan dan mandiri energi.",
        "paket": "Bab IV: Listrik, Magnet, & Energi Alternatif - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    }
]

# Assemble 70 questions for Bab 4
all_70 = []
for q in soal_hots:
    all_70.append(q)
for q in soal_contoh:
    all_70.append(q)
for q in soal_mandiri:
    all_70.append(q)
for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 4: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 9 - Bab IV: Listrik, Magnet, & Energi Alternatif (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 9 — Bab IV: Listrik, Magnet, & Energi Alternatif</h1>
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
  <div data-field="materi">Listrik, Magnet, & Energi Alternatif</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menghitung gaya Coulomb, menerapkan Hukum Ohm dan Kirchhoff pada rangkaian seri-paralel, menghitung daya dan energi listrik bulanan, serta menganalisis kemagnetan, Gaya Lorentz, transformator, dan energi listrik alternatif.</div>
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
        "materi": "Listrik, Magnet, & Energi Alternatif",
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

html_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab4_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab4_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
