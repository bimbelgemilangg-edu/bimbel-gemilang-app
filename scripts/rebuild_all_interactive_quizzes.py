#!/usr/bin/env python3
# scripts/rebuild_all_interactive_quizzes.py
# ==============================================================================
# REKONSTRUKSI TOTAL KUIS PEMAHAMAN INTERAKTIF 4 MAPEL TKA SMP 2027
# Menghilangkan seluruh soal kunci/dummy, menggantinya dengan butir soal asli,
# opsi A/B/C/D riil, kunci resmi, pembahasan analitis, dan pecahan tegak KaTeX.
# ==============================================================================

import json
import re
import os

BASE_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app"
DATA_DIR = os.path.join(BASE_DIR, "src/data/modul-smp")

# ==============================================================================
# 1. IPA SMP (Ilmu Pengetahuan Alam - 4 Bab)
# ==============================================================================
IPA_QUIZZES = {
    1: [
        {
            "id": "ipa_smp_b1_q1",
            "soal": "Level 1 · PG1. Pengukuran: Skala utama mikrometer sekrup menunjukkan 3,5 mm dan skala putar segaris di angka 14. Hasil pengukuran tebal pelat logam tersebut adalah …",
            "opsi": {
                "A": "3,14 mm",
                "B": "3,54 mm",
                "C": "3,64 mm",
                "D": "4,90 mm"
            },
            "kunci": "C",
            "pembahasan": "Skala utama = 3,5 mm, skala putar = $14 \\times 0,01 = 0,14$ mm. Jumlahkan: $3,5 + 0,14 = 3,64$ mm. (Jangan terkecoh 3,14 mm!)."
        },
        {
            "id": "ipa_smp_b1_q2",
            "soal": "Level 1 · PG2. Perubahan Zat: Berikut yang termasuk contoh perubahan kimia dalam kehidupan sehari-hari adalah …",
            "opsi": {
                "A": "Es batu mencair di dalam gelas",
                "B": "Kapur barus menyublim di lemari pakaian",
                "C": "Susu segar berubah menjadi yoghurt",
                "D": "Garam dilarutkan ke dalam air hangat"
            },
            "kunci": "C",
            "pembahasan": "Pembuatan yoghurt melibatkan fermentasi bakteri Lactobacillus yang menghasilkan asam laktat (zat baru) → perubahan kimia. Pilihan A, B, dan D hanya perubahan wujud atau pelarutan (perubahan fisika)."
        },
        {
            "id": "ipa_smp_b1_q3",
            "soal": "Level 2 · PG3. Massa Jenis: Kubus logam bersisi 2 cm memiliki massa 64 g. Massa jenis logam tersebut dalam satuan standar internasional (SI) adalah …",
            "opsi": {
                "A": "8 kg/m³",
                "B": "800 kg/m³",
                "C": "8.000 kg/m³",
                "D": "32.000 kg/m³"
            },
            "kunci": "C",
            "pembahasan": "Volume kubus $V = s^3 = 2^3 = 8\\text{ cm}^3$. Massa jenis $\\rho = \\frac{m}{V} = \\frac{64}{8} = 8\\text{ g/cm}^3$. Konversi ke SI (dikalikan 1.000): $8 \\times 1.000 = 8.000\\text{ kg/m}^3$."
        },
        {
            "id": "ipa_smp_b1_q4",
            "soal": "Level 2 · PG4. Suhu: Suhu sebuah ruangan laboratorium tercatat 35°C. Jika diukur menggunakan termometer Fahrenheit, suhu ruangan tersebut adalah …",
            "opsi": {
                "A": "63°F",
                "B": "85°F",
                "C": "95°F",
                "D": "105°F"
            },
            "kunci": "C",
            "pembahasan": "Rumus konversi Celcius ke Fahrenheit: $F = (\\frac{9}{5} \\times C) + 32 = (\\frac{9}{5} \\times 35) + 32 = (9 \\times 7) + 32 = 63 + 32 = 95^\\circ\\text{F}$."
        },
        {
            "id": "ipa_smp_b1_q5",
            "soal": "Level 3 · PG5. Kalor: Sebanyak 2 kg air bersuhu 20°C dipanaskan hingga 70°C ($c_{\\text{air}} = 4.200\\text{ J/kg}^\\circ\\text{C}$). Besar kalor yang dibutuhkan adalah …",
            "opsi": {
                "A": "210 kJ",
                "B": "420 kJ",
                "C": "588 kJ",
                "D": "840 kJ"
            },
            "kunci": "B",
            "pembahasan": "Perubahan suhu $\\Delta T = 70 - 20 = 50^\\circ\\text{C}$. Kalor $Q = m \\cdot c \\cdot \\Delta T = 2 \\times 4.200 \\times 50 = 420.000\\text{ J} = 420\\text{ kJ}$. Trik cepat: $2 \\times 50 = 100$, lalu $100 \\times 4.200 = 420.000\\text{ J}$."
        },
        {
            "id": "ipa_smp_b1_q6",
            "soal": "Level 3 · PGK MCMA6. Asam–Basa & Energi: Pilih dua pernyataan yang BENAR dari daftar berikut:\n(1) Larutan dengan pH 3 dapat mengubah lakmus biru menjadi merah.\n(2) Angin laut terjadi pada malam hari dan bertiup dari laut menuju darat.\n(3) Buah kelapa jatuh mengalami perubahan Energi Potensial menjadi Energi Kinetik.\n(4) Pemisahan campuran air dan alkohol paling tepat menggunakan metode filtrasi.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis butir:\n• (1) BENAR: pH 3 bersifat asam, lakmus biru berubah menjadi merah.\n• (2) SALAH: Angin laut terjadi siang hari (malam hari adalah angin darat).\n• (3) BENAR: Saat jatuh, ketinggian berkurang ($E_p$ turun) dan kecepatan bertambah ($E_k$ naik).\n• (4) SALAH: Air dan alkohol dipisahkan dengan destilasi (titik didih berbeda), bukan filtrasi.\nJadi pernyataan yang benar adalah (1) dan (3)."
        }
    ],
    2: [
        {
            "id": "ipa_smp_b2_q1",
            "soal": "Level 1 · PG1. Hukum Newton: Ketika kita mendayung perahu dengan mendorong air ke belakang, perahu justru terdorong melaju ke depan. Peristiwa ini sesuai dengan prinsip …",
            "opsi": {
                "A": "Hukum Newton I",
                "B": "Hukum Newton II",
                "C": "Hukum Newton III",
                "D": "Hukum Pascal"
            },
            "kunci": "C",
            "pembahasan": "Dayung mendorong air ke belakang ($F_{\\text{aksi}}$), air membalas mendorong perahu ke depan ($F_{\\text{reaksi}}$). Sesuai Hukum Newton III ($F_{\\text{aksi}} = -F_{\\text{reaksi}}$)."
        },
        {
            "id": "ipa_smp_b2_q2",
            "soal": "Level 1 · PG2. Bidang Miring: Sebuah peti seberat 400 N dinaikkan ke atas truk setinggi 1 m menggunakan papan bidang miring sepanjang 4 m. Gaya dorong minimal yang diperlukan adalah …",
            "opsi": {
                "A": "50 N",
                "B": "100 N",
                "C": "200 N",
                "D": "1.600 N"
            },
            "kunci": "B",
            "pembahasan": "Keuntungan mekanis bidang miring $KM = \\frac{s}{h} = \\frac{4}{1} = 4$. Maka gaya minimal $F = \\frac{w}{KM} = \\frac{400}{4} = 100\\text{ N}$."
        },
        {
            "id": "ipa_smp_b2_q3",
            "soal": "Level 2 · PG3. Tekanan Hidrostatis: Seekor ikan berenang pada kedalaman 2 m di bawah permukaan air danau ($\\rho = 1.000\\text{ kg/m}^3, g = 10\\text{ m/s}^2$). Tekanan hidrostatis yang dialami ikan tersebut adalah …",
            "opsi": {
                "A": "2.000 Pa",
                "B": "10.000 Pa",
                "C": "20.000 Pa",
                "D": "200.000 Pa"
            },
            "kunci": "C",
            "pembahasan": "Tekanan hidrostatis $P_h = \\rho \\cdot g \\cdot h = 1.000 \\times 10 \\times 2 = 20.000\\text{ Pa}$ (atau setara $20\\text{ kPa}$)."
        },
        {
            "id": "ipa_smp_b2_q4",
            "soal": "Level 2 · PG4. Cermin & Lensa: Cermin yang dipasang pada kaca spion kendaraan agar menghasilkan bayangan yang bersifat maya, tegak, dan diperkecil adalah …",
            "opsi": {
                "A": "Cermin datar",
                "B": "Cermin cekung",
                "C": "Cermin cembung",
                "D": "Lensa cembung"
            },
            "kunci": "C",
            "pembahasan": "Cermin cembung selalu menghasilkan bayangan maya, tegak, dan diperkecil sehingga bidang pandang pengemudi di spion menjadi sangat luas."
        },
        {
            "id": "ipa_smp_b2_q5",
            "soal": "Level 3 · PG5. Rangkaian Listrik: Dua resistor identik $6\\ \\Omega$ dan $6\\ \\Omega$ dipasang secara paralel, kemudian diserikan dengan resistor $3\\ \\Omega$. Jika rangkaian dihubungkan ke sumber tegangan 18 V, kuat arus totalnya adalah …",
            "opsi": {
                "A": "1,5 A",
                "B": "2 A",
                "C": "3 A",
                "D": "6 A"
            },
            "kunci": "C",
            "pembahasan": "Trik paralel kembar: $6\\ \\Omega \\parallel 6\\ \\Omega = \\frac{6}{2} = 3\\ \\Omega$. Serikan dengan $3\\ \\Omega \\rightarrow R_{\\text{total}} = 3 + 3 = 6\\ \\Omega$. Sesuai Hukum Ohm: $I = \\frac{V}{R} = \\frac{18}{6} = 3\\text{ A}$."
        },
        {
            "id": "ipa_smp_b2_q6",
            "soal": "Level 3 · PGK MCMA6. Gelombang, Listrik & Magnet: Pilih dua pernyataan yang BENAR dari daftar berikut:\n(1) Penggaris plastik yang digosok dengan kain wol akan bermuatan negatif.\n(2) Bunyi dengan frekuensi 25.000 Hz dapat didengar dengan jelas oleh telinga manusia normal.\n(3) Transformator step-up memiliki jumlah lilitan sekunder ($N_s$) lebih banyak daripada lilitan primer ($N_p$).\n(4) Jika jarak antarmuatan diperbesar menjadi 2 kali lipat, gaya Coulomb bertambah 2 kali lebih besar.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis butir:\n• (1) BENAR: Trik 'Pla-Min' — elektron berpindah dari wol ke plastik sehingga plastik bermuatan negatif (−).\n• (2) SALAH: 25.000 Hz adalah gelombang ultrasonik (> 20.000 Hz), di luar batas pendengaran manusia.\n• (3) BENAR: Trafo step-up berfungsi menaikkan tegangan, cirinya $N_s > N_p$.\n• (4) SALAH: Gaya Coulomb berbanding terbalik kuadrat jarak ($F \\propto \\frac{1}{r^2}$). Jarak $2\\times$ membuat gaya menjadi $\\frac{1}{4}$ kali semula.\nJadi pernyataan yang benar adalah (1) dan (3)."
        }
    ],
    3: [
        {
            "id": "ipa_smp_b3_q1",
            "soal": "Level 1 · PG1. Organel Sel: Organel yang berfungsi sebagai tempat respirasi sel untuk menghasilkan energi (ATP) dan dimiliki oleh sel hewan maupun sel tumbuhan adalah …",
            "opsi": {
                "A": "Kloroplas",
                "B": "Dinding sel",
                "C": "Mitokondria",
                "D": "Sentriol"
            },
            "kunci": "C",
            "pembahasan": "Mitokondria adalah “the powerhouse of cell” (tempat respirasi sel dan pembentukan ATP) yang dimiliki baik sel hewan maupun tumbuhan. Kloroplas dan dinding sel hanya ada pada tumbuhan, sedangkan sentriol hanya ada pada hewan."
        },
        {
            "id": "ipa_smp_b3_q2",
            "soal": "Level 1 · PG2. Pencernaan: Enzim pencernaan yang dihasilkan oleh kelenjar pankreas dan berfungsi mengubah lemak menjadi asam lemak serta gliserol adalah …",
            "opsi": {
                "A": "Pepsin",
                "B": "Ptialin",
                "C": "Lipase",
                "D": "Renin"
            },
            "kunci": "C",
            "pembahasan": "Jembatan keledai enzim getah pankreas A-L-T:\n• Amilase: mengubah zat tepung (amilum) menjadi glukosa\n• Lipase: mengubah lemak menjadi asam lemak + gliserol\n• Tripsin: mengubah pepton menjadi asam amino."
        },
        {
            "id": "ipa_smp_b3_q3",
            "soal": "Level 2 · PG3. Sistem Ekskresi: Hasil uji laboratorium menunjukkan sampel urine seorang pasien berwarna ungu saat ditetesi reagen Biuret. Bagian nefron ginjal yang mengalami kerusakan adalah …",
            "opsi": {
                "A": "Glomerulus",
                "B": "Tubulus proksimal",
                "C": "Tubulus distal",
                "D": "Ureter"
            },
            "kunci": "A",
            "pembahasan": "Uji Biuret menghasilkan warna ungu menandakan adanya protein dalam urine (Albuminuria). Hal ini membuktikan bahwa membran saringan pada tahap filtrasi di Glomerulus mengalami kebocoran."
        },
        {
            "id": "ipa_smp_b3_q4",
            "soal": "Level 2 · PG4. Reproduksi: Tempat terjadinya proses fertilisasi (peleburan sel sperma dan sel ovum) pada sistem reproduksi wanita adalah …",
            "opsi": {
                "A": "Ovarium",
                "B": "Tuba Fallopi",
                "C": "Uterus",
                "D": "Serviks"
            },
            "kunci": "B",
            "pembahasan": "Fertilisasi selalu berlangsung di Tuba Fallopi (oviduk). Setelah terbentuk zigot dan berkembang menjadi embrio, barulah embrio menempel dan tumbuh di dinding uterus (rahim)."
        },
        {
            "id": "ipa_smp_b3_q5",
            "soal": "Level 3 · PG5. Hukum Mendel: Tanaman mangga berbuah Besar–Manis (BBMM) disilangkan dengan Kecil–Masam (bbmm) menghasilkan keturunan F1 BbMm. Jika F1 disilangkan sesamanya dan menghasilkan 160 pohon keturunan F2, berapa banyak pohon yang berbuah Besar–Manis?",
            "opsi": {
                "A": "10 pohon",
                "B": "30 pohon",
                "C": "90 pohon",
                "D": "120 pohon"
            },
            "kunci": "C",
            "pembahasan": "Pada persilangan dihibrid heterozigot $BbMm \\times BbMm$, rasio fenotipe F2 adalah $9 : 3 : 3 : 1$. Porsi fenotipe dominan ganda Besar–Manis ($B\\_M\\_$) adalah $\\frac{9}{16}$. Jumlah tanaman $= \\frac{9}{16} \\times 160 = 90$ pohon."
        },
        {
            "id": "ipa_smp_b3_q6",
            "soal": "Level 3 · PGK MCMA6. Biologi Terpadu: Pilih dua pernyataan yang BENAR dari pernyataan di bawah ini:\n(1) Bilik kiri jantung memiliki dinding otot paling tebal untuk memompa darah kaya O₂ ke seluruh tubuh.\n(2) Jamur Rhizopus oryzae berperan utama dalam proses fermentasi susu menjadi yoghurt.\n(3) Percobaan Ingenhousz menggunakan tanaman Hydrilla membuktikan fotosintesis menghasilkan gas O₂.\n(4) Gerak refleks menghindar dikendalikan langsung oleh pusat kesadaran otak besar.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis butir:\n• (1) BENAR: Bilik kiri berdinding paling tebal karena harus memompa darah ke sirkulasi sistemik tubuh.\n• (2) SALAH: Rhizopus oryzae adalah jamur pembuat tempe; yoghurt menggunakan bakteri Lactobacillus bulgaricus.\n• (3) BENAR: Percobaan Ingenhousz membuktikan terbentuknya gelembung gas oksigen ($O_2$) saat terkena sinar matahari.\n• (4) SALAH: Gerak refleks berpangkal di sumsum tulang belakang (medula spinalis), bukan otak besar.\nJadi pernyataan yang benar adalah (1) dan (3)."
        }
    ],
    4: [
        {
            "id": "ipa_smp_b4_q1",
            "soal": "No. 1 · PGPencemaran: Gas polutan sintetis dari kulkas dan pendingin ruangan (AC) generasi lama yang menyebabkan menipisnya lapisan Ozon ($O_3$) di lapisan stratosfer bumi adalah …",
            "opsi": {
                "A": "$\\text{CO}_2$",
                "B": "$\\text{CH}_4$",
                "C": "CFC (Klorofluorokarbon)",
                "D": "$\\text{SO}_2$"
            },
            "kunci": "C",
            "pembahasan": "CFC (Chlorofluorocarbon) melepaskan radikal klorin yang memecah molekul ozon ($O_3$). $\\text{CO}_2$ dan $\\text{CH}_4$ adalah gas rumah kaca pemicu pemanasan global; $\\text{SO}_2$ pemicu hujan asam."
        },
        {
            "id": "ipa_smp_b4_q2",
            "soal": "No. 2 · PGLempeng & Atmosfer: Tumbukan lempeng saling mendekat (konvergen) di dasar samudra berpotensi membentuk palung laut dalam dan tsunami. Lapisan atmosfer bumi tempat meteoroid terbakar habis adalah …",
            "opsi": {
                "A": "Troposfer",
                "B": "Stratosfer",
                "C": "Mesosfer",
                "D": "Termosfer"
            },
            "kunci": "C",
            "pembahasan": "Lapisan Mesosfer berfungsi membakar dan menghancurkan meteoroid yang masuk ke atmosfer bumi karena kepadatan dan gesekan udara yang intens."
        },
        {
            "id": "ipa_smp_b4_q3",
            "soal": "No. 3 · PGTata Surya: Planet terpanas di Tata Surya kita yang berotasi terbalik dari Timur ke Barat akibat selimut atmosfer gas $\\text{CO}_2$ yang sangat tebal adalah …",
            "opsi": {
                "A": "Merkurius",
                "B": "Venus",
                "C": "Mars",
                "D": "Jupiter"
            },
            "kunci": "B",
            "pembahasan": "Venus adalah planet terpanas (suhu permukaan $\\approx 460^\\circ\\text{C}$), lebih panas dari Merkurius, karena mengalami efek rumah kaca ekstrem dari atmosfer $\\text{CO}_2$ yang sangat tebal."
        },
        {
            "id": "ipa_smp_b4_q4",
            "soal": "No. 4 · PGK MCMABumi–Bulan: Tentukan dua pernyataan yang BENAR terkait fenomena kebumian dan antariksa:\n(1) Pergantian 4 musim di belahan bumi utara dan selatan disebabkan oleh revolusi Bumi dan kemiringan poros $23,5^\\circ$.\n(2) Perbedaan zona waktu WIB, WITA, dan WIT disebabkan oleh revolusi tahunan Bumi.\n(3) Pasang purnama (pasang air laut tertinggi) terjadi saat posisi Matahari, Bumi, dan Bulan membentuk garis lurus.\n(4) Gerhana Matahari total terjadi pada saat fase Bulan berada dalam kondisi Bulan Purnama.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis butir:\n• (1) & (3) BENAR: Revolusi bumi menyebabkan musim; pasang purnama terjadi saat syzygy (garis lurus).\n• (2) SALAH: Pembagian zona waktu disebabkan oleh rotasi Bumi pada porosnya.\n• (4) SALAH: Gerhana Matahari terjadi pada fase Bulan Baru (Bulan Mati), bukan Bulan Purnama.\nJadi pernyataan yang benar adalah (1) dan (3)."
        }
    ]
}

# ==============================================================================
# 2. BAHASA INGGRIS SMP (BIG CP Fase D - 4 Bab)
# ==============================================================================
BIG_QUIZZES = {
    1: [
        {
            "id": "big_smp_b1_q1",
            "soal": "Level 1 · PG1. Prepositions: “My sister was born ____ August 17th, 2012, ____ 6 a.m.” The correct prepositions are …",
            "opsi": {
                "A": "in – at",
                "B": "on – at",
                "C": "at – on",
                "D": "on – in"
            },
            "kunci": "B",
            "pembahasan": "Aturan pemakaian preposisi waktu: untuk tanggal spesifik yang lengkap (August 17th) gunakan 'on'; untuk jam atau waktu tertentu (6 a.m.) gunakan 'at'."
        },
        {
            "id": "big_smp_b1_q2",
            "soal": "Level 1 · PG2. Notice: A sign in a city park reads “KEEP OFF THE GRASS”. This warning means that visitors ____.",
            "opsi": {
                "A": "must cut the grass regularly",
                "B": "are allowed to sit and picnic on the grass",
                "C": "must not step on or walk across the grass",
                "D": "should water the grass every morning"
            },
            "kunci": "C",
            "pembahasan": "Frasa peringatan 'Keep off' bermakna menjauh atau dilarang mendekati/menginjak rumput taman."
        },
        {
            "id": "big_smp_b1_q3",
            "soal": "Level 2 · PG3. Comparison: “Mount Everest is ____ mountain in the world, while Mount Rinjani is ____ than Mount Bromo.”",
            "opsi": {
                "A": "higher – the highest",
                "B": "the highest – higher",
                "C": "the most high – more high",
                "D": "highest – more higher"
            },
            "kunci": "B",
            "pembahasan": "Konteks 'in the world' membutuhkan bentuk Superlative ('the highest'); adanya kata perbandingan 'than' membutuhkan bentuk Comparative ('higher')."
        },
        {
            "id": "big_smp_b1_q4",
            "soal": "Level 2 · PG4. Modals: “Students ____ bring dictionaries during the official English test. It's strictly forbidden.”",
            "opsi": {
                "A": "don't have to",
                "B": "should",
                "C": "mustn't",
                "D": "might"
            },
            "kunci": "C",
            "pembahasan": "Keterangan 'strictly forbidden' (dilarang keras) menandakan larangan mutlak yang wajib berpasangan dengan modal auxiliary 'mustn't' (must not)."
        },
        {
            "id": "big_smp_b1_q5",
            "soal": "Level 3 · PG5. Medicine Label: “Cough Syrup · Adult: 2 teaspoons 3 times a day · Children (6–12 yrs): 1 teaspoon 3 times a day. Keep out of reach of children.” If 1 teaspoon = 5 ml, how much syrup does a 10-year-old child take in one day?",
            "opsi": {
                "A": "5 ml",
                "B": "10 ml",
                "C": "15 ml",
                "D": "30 ml"
            },
            "kunci": "C",
            "pembahasan": "Anak berusia 10 tahun masuk kategori Children (6–12 yrs): takaran 1 sendok teh (5 ml) dikonsumsi 3 kali sehari → $5\\text{ ml} \\times 3 = 15\\text{ ml}$ per hari."
        },
        {
            "id": "big_smp_b1_q6",
            "soal": "Level 3 · PGK MCMA6. Grammar & Expressions: Choose TWO grammatically CORRECT sentences:\n(1) How much money do you need to buy that dictionary?\n(2) The cat is cleaning it's paws on the sofa.\n(3) “I couldn't agree more!” means the speaker strongly agrees with the opinion.\n(4) She can sings English pop songs very beautifully.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis kalimat:\n• (1) BENAR: 'Money' adalah uncountable noun sehingga memakai quantifier 'How much'.\n• (2) SALAH: Kata ganti kepemilikan hewan adalah 'its' (tanpa apostrof), bukan 'it's' (singkatan it is).\n• (3) BENAR: Ungkapan idiomatik 'I couldn't agree more' menyatakan persetujuan mutlak (sangat setuju).\n• (4) SALAH: Setelah modal 'can' wajib diikuti bare infinitive / V1 murni tanpa akhiran -s ('can sing').\nJadi kalimat yang benar adalah (1) dan (3)."
        }
    ],
    2: [
        {
            "id": "big_smp_b2_q1",
            "soal": "Level 1 · PG1. Simple Present: “____ your brother ____ to school by bicycle every morning?”",
            "opsi": {
                "A": "Do – goes",
                "B": "Does – go",
                "C": "Does – goes",
                "D": "Is – go"
            },
            "kunci": "B",
            "pembahasan": "Subjek 'your brother' adalah orang ketiga tunggal (he) → kata bantu tanya adalah 'Does'. Setelah kata bantu 'Does', kata kerja utama kembali ke bentuk dasar V1 ('go')."
        },
        {
            "id": "big_smp_b2_q2",
            "soal": "Level 1 · PG2. Past Continuous: “While I ____ dinner, my best friend knocked on the door.”",
            "opsi": {
                "A": "cook",
                "B": "cooked",
                "C": "was cooking",
                "D": "am cooking"
            },
            "kunci": "C",
            "pembahasan": "Klausa yang diawali kata penghubung 'While' menunjukkan kegiatan berdurasi panjang yang sedang berlangsung di masa lampau ketika disela peristiwa lain ('knocked') → gunakan Past Continuous ('was cooking')."
        },
        {
            "id": "big_smp_b2_q3",
            "soal": "Level 2 · PG3. Present Perfect: “Nadia ____ in Banyuwangi ____ 2019.”",
            "opsi": {
                "A": "lived – for",
                "B": "has lived – since",
                "C": "have lived – since",
                "D": "has lived – for"
            },
            "kunci": "B",
            "pembahasan": "Tahun spesifik '2019' menunjukkan titik awal waktu permulaan kejadian → gunakan 'since'. Subjek 'Nadia' adalah tunggal → gunakan bentuk 'has lived'."
        },
        {
            "id": "big_smp_b2_q4",
            "soal": "Level 2 · PG4. Passive Voice: “Prambanan Temple ____ in the 9th century during the Sanjaya Dynasty.”",
            "opsi": {
                "A": "built",
                "B": "is built",
                "C": "was built",
                "D": "were built"
            },
            "kunci": "C",
            "pembahasan": "Subjek candi berposisi pasif (dibangun) di masa lampau (9th century) dan berbentuk tunggal → pola pasif lampau adalah 'was + V3' ('was built')."
        },
        {
            "id": "big_smp_b2_q5",
            "soal": "Level 3 · PG5. Conjunctions: “We must drink enough mineral water ____ we can stay well hydrated during sports activities.”",
            "opsi": {
                "A": "in order to",
                "B": "so that",
                "C": "because of",
                "D": "despite"
            },
            "kunci": "B",
            "pembahasan": "Konjungsi tujuan yang diikuti oleh anak kalimat lengkap bersubjek dan bermodal ('we can stay') adalah 'so that'. Pilihan 'in order to' harus langsung diikuti bare verb / V1."
        },
        {
            "id": "big_smp_b2_q6",
            "soal": "Level 3 · PGK MCMA6. Grammar Audit: Choose TWO grammatically CORRECT sentences:\n(1) If you study regularly every day, you will achieve a great score in the national exam.\n(2) Did you saw the newly opened science museum yesterday afternoon?\n(3) This delicious traditional rendang is made from beef and thick coconut milk.\n(4) Although it was raining heavily outside, but they still continued playing football.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis kalimat:\n• (1) BENAR: Sesuai kaidah Conditional Type 1 (If + Simple Present, Simple Future: will + V1).\n• (2) SALAH: Setelah auxiliary lampau 'Did', kata kerja wajib kembali ke bentuk V1 murni ('Did you see').\n• (3) BENAR: Kalimat pasif present yang tepat ('is made from').\n• (4) SALAH: Pantang menggabungkan dua konjungsi kontras 'Although' dan 'but' dalam satu kalimat majemuk.\nJadi kalimat yang benar adalah (1) dan (3)."
        }
    ],
    3: [
        {
            "id": "big_smp_b3_q1",
            "soal": "Level 1 · PG1. Genre Identification: A factual text titled “Dolphins: Intelligent Marine Mammals” explaining dolphins' habitat, classification, and diet objectively belongs to ____.",
            "opsi": {
                "A": "Narrative Text",
                "B": "Recount Text",
                "C": "Report Text",
                "D": "Procedure Text"
            },
            "kunci": "C",
            "pembahasan": "Teks yang menyajikan fakta ilmiah objektif mengenai suatu objek makhluk hidup secara umum masuk ke dalam genre Report Text."
        },
        {
            "id": "big_smp_b3_q2",
            "soal": "Level 1 · PG2. Procedure: “First, boil the water. Second, put the tea bag into a cup. Third, pour the hot water.” The text is written with the purpose to ____.",
            "opsi": {
                "A": "entertain readers with a story about tea",
                "B": "tell readers step-by-step how to make a cup of tea",
                "C": "describe the physical features of a porcelain cup",
                "D": "retell the history of tea ceremonies"
            },
            "kunci": "B",
            "pembahasan": "Ciri khas kalimat perintah berurutan (First, Second, Third) menunjukkan teks prosedur yang bertujuan memandu pembaca membuat secangkir teh."
        },
        {
            "id": "big_smp_b3_q3",
            "soal": "Level 2 · PG3. Reference: “Honeybees play a vital role in nature. Without them, many fruit trees could not produce food.” The underlined pronoun “them” refers to ____.",
            "opsi": {
                "A": "fruit trees",
                "B": "nature",
                "C": "food",
                "D": "honeybees"
            },
            "kunci": "D",
            "pembahasan": "Kata ganti jamak 'them' merujuk langsung pada subjek jamak yang diperbincangkan pada kalimat sebelumnya, yaitu 'honeybees' (lebah madu)."
        },
        {
            "id": "big_smp_b3_q4",
            "soal": "Level 2 · PG4. Narrative: The structural section of a Narrative Text where the central problem arises, intensifies, and reaches its emotional climax is called ____.",
            "opsi": {
                "A": "Orientation",
                "B": "Complication",
                "C": "Resolution",
                "D": "Re-orientation"
            },
            "kunci": "B",
            "pembahasan": "Tahapan timbulnya perselisihan atau masalah hingga titik puncak ketegangan cerita naratif disebut sebagai bagian Complication."
        },
        {
            "id": "big_smp_b3_q5",
            "soal": "Level 3 · PG5. Recount Inference: “We finally reached the rim of Mount Ijen at 2 a.m. The mountain wind was freezing, so we put on thick coats. Seeing the mesmerizing natural blue fire made all our exhaustion disappear instantly.” From the excerpt, we can infer that the author felt ____.",
            "opsi": {
                "A": "deeply disappointed and exhausted",
                "B": "greatly amazed and joyful",
                "C": "anxious and terrified",
                "D": "bored and regretful"
            },
            "kunci": "B",
            "pembahasan": "Keterangan 'made all our exhaustion disappear instantly' (rasa letih seketika sirna menyaksikan indahnya fenomena api biru) menyiratkan rasa kagum dan bahagia luar biasa."
        },
        {
            "id": "big_smp_b3_q6",
            "soal": "Level 3 · PGK MCMA6. 5 Genres Check: Choose TWO statements that are ACCURATE according to English text genres:\n(1) Both Recount Text and Narrative Text predominantly use Simple Past Tense (V2).\n(2) Procedure Text predominantly relies on Past Continuous Tense to outline chronological steps.\n(3) Descriptive Text focuses primarily on detailing one specific person, place, or object.\n(4) Foreign song lyrics must always be translated word-for-word literally without considering poetic metaphors.",
            "opsi": {
                "A": "(1) dan (3)",
                "B": "(1) dan (2)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis genre:\n• (1) BENAR: Baik Recount maupun Narrative berorientasi pada peristiwa lampau sehingga menggunakan Past Tense (V2).\n• (2) SALAH: Teks prosedur menggunakan kata kerja imperatif bentuk present (V1), bukan past continuous.\n• (3) BENAR: Descriptive text berfokus mendeskripsikan ciri khusus satu entitas spesifik.\n• (4) SALAH: Lirik lagu sarat majas kiasan (figurative language) yang tidak boleh diartikan secara harfiah kata per kata.\nJadi pernyataan yang tepat adalah (1) dan (3)."
        }
    ],
    4: [
        {
            "id": "big_smp_b4_q1",
            "soal": "No. 1 · PGSchedule: An express flight departs from Jakarta at 09.45 a.m. and safely touches down in Surabaya at 11.15 a.m. (within the same time zone). How long is the flight duration?",
            "opsi": {
                "A": "1 hour 15 minutes",
                "B": "1 hour 30 minutes",
                "C": "2 hours",
                "D": "2 hours 30 minutes"
            },
            "kunci": "B",
            "pembahasan": "Selisih waktu penerbangan: dari pukul 09.45 ke 10.45 dihitung 1 jam, lalu dari 10.45 ke 11.15 bertambah 30 menit. Total durasi adalah 1 jam 30 menit."
        },
        {
            "id": "big_smp_b4_q2",
            "soal": "No. 2 · PGDialogue: Customer: “Excuse me, can I see the menu, please?” · Waiter: “Certainly, here you are. Would you like to order cold beverages first?” Where does this dialogue most likely take place?",
            "opsi": {
                "A": "At a school library",
                "B": "At a restaurant",
                "C": "At a public hospital",
                "D": "At a train terminal"
            },
            "kunci": "B",
            "pembahasan": "Kata kunci percakapan seperti 'menu' dan 'order cold beverages' (memesan minuman) memastikan latar lokasi berada di sebuah restoran."
        },
        {
            "id": "big_smp_b4_q3",
            "soal": "No. 3 · PGJumbled Words: yesterday (1) – bought (2) – a (3) – new (4) – bag (5) – she (6). What is the most grammatically correct sentence arrangement?",
            "opsi": {
                "A": "6–2–3–4–5–1",
                "B": "6–2–3–5–4–1",
                "C": "1–6–3–4–5–2",
                "D": "6–1–2–3–4–5"
            },
            "kunci": "A",
            "pembahasan": "Susunan kalimat SPOK bahasa Inggris yang tepat: Subject [She (6)] + Verb [bought (2)] + Object [a (3) new (4) bag (5)] + Adverb of Time [yesterday (1)]. Menghasilkan pola: 6–2–3–4–5–1."
        },
        {
            "id": "big_smp_b4_q4",
            "soal": "No. 4 · PGK MCMADigital English: Identify TWO statements that are ACCURATE regarding digital English communication:\n(1) Writing an entire email using ALL CAPITAL LETTERS is regarded as shouting and impolite online.\n(2) The phrase “Sincerely yours” is polite and suitable for closing a formal email sent to a school teacher.\n(3) The phrase “more than half” on an infographic pie chart denotes a percentage less than 40%.\n(4) A transitional sentence beginning with “Finally,” should ideally be placed as the introductory opening of an essay.",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (3)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Analisis etika komunikasi:\n• (1) & (2) BENAR: Huruf kapital penuh diartikan berteriak; 'Sincerely' adalah penutup surat resmi yang santun.\n• (3) SALAH: 'More than half' bernilai lebih dari 50%, bukan di bawah 40%.\n• (4) SALAH: 'Finally' digunakan untuk poin konklusi terakhir di penutup paragraf, bukan kalimat pembuka.\nJadi pernyataan yang tepat adalah (1) dan (2)."
        }
    ]
}

# ==============================================================================
# 3. MATEMATIKA SMP (MTK Numerasi TKA - 4 Bab)
# ==============================================================================
MTK_QUIZZES = {
    1: [
        {
            "id": "mtk_smp_b1_q1",
            "soal": "Soal 1 · Unit 1.6 (Promo Belanja) Ani membeli 2 pulpen (@Rp12.000) dan 2 pensil (@Rp8.000). Promo “Hemat Berempat”: setiap pembelian 4 barang (boleh campur) mendapat potongan harga sebesar 1 barang termurah. Total yang harus dibayar Ani adalah …",
            "opsi": {
                "A": "Rp32.000",
                "B": "Rp36.000",
                "C": "Rp40.000",
                "D": "Rp44.000"
            },
            "kunci": "A",
            "pembahasan": "Total harga awal: $2(12.000) + 2(8.000) = 24.000 + 16.000 = \\text{Rp}40.000$. Barang termurah adalah pensil (Rp8.000). Total bayar setelah diskon: $40.000 - 8.000 = \\text{Rp}32.000$."
        },
        {
            "id": "mtk_smp_b1_q2",
            "soal": "Soal 2 · Unit 1.3 (Bilangan Berpangkat) Nilai dari $2^{-3} + 2^{-2} + 5^0$ adalah …",
            "opsi": {
                "A": "$1\\frac{1}{8}$",
                "B": "$1\\frac{3}{8}$",
                "C": "$1\\frac{1}{2}$",
                "D": "$2\\frac{3}{8}$"
            },
            "kunci": "B",
            "pembahasan": "$2^{-3} = \\frac{1}{8}$, $2^{-2} = \\frac{1}{4} = \\frac{2}{8}$, dan $5^0 = 1$. Jumlahkan: $\\frac{1}{8} + \\frac{2}{8} + 1 = 1\\frac{3}{8}$."
        },
        {
            "id": "mtk_smp_b1_q3",
            "soal": "Soal 3 · Unit 1.8 (Faktorisasi Prima) Diketahui bilangan 36 dan 60. Tentukan pasangan faktor persekutuan dari kedua bilangan tersebut:\n(1) $2^2 \\times 3$\n(2) $2 \\times 3$\n(3) $2^2 \\times 3^2$\n(4) $2 \\times 5$",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "$36 = 2^2 \\times 3^2$ dan $60 = 2^2 \\times 3 \\times 5 \\rightarrow \\text{FPB} = 2^2 \\times 3 = 12$. Faktor dari 12 adalah 1, 2, 3, 4, 6, 12. Bentuk (1) bernilai 12 dan bentuk (2) bernilai 6. Keduanya adalah faktor persekutuan."
        },
        {
            "id": "mtk_smp_b1_q4",
            "soal": "Soal 4 · Unit 1.7 (Aritmetika Sosial) Sebuah jaket berlabel harga Rp300.000 mendapat diskon 20%. Tentukan pernyataan yang BENAR:\n(1) Besar potongan harga (diskon) adalah Rp60.000.\n(2) Harga setelah diskon adalah Rp240.000.\n(3) Jika dikenakan PPN 10% dari harga setelah diskon, total yang dibayar menjadi Rp264.000.\n(4) Harga akhirnya setara dengan diskon tunggal 10%.",
            "opsi": {
                "A": "(1), (2), dan (3)",
                "B": "(1) dan (3) saja",
                "C": "(2) dan (4)",
                "D": "Semua pernyataan benar"
            },
            "kunci": "A",
            "pembahasan": "Diskon $= 20\\% \\times 300.000 = \\text{Rp}60.000$ (1 Benar). Harga diskon $= 300.000 - 60.000 = \\text{Rp}240.000$ (2 Benar). Plus PPN $10\\% = 240.000 + 24.000 = \\text{Rp}264.000$ (3 Benar). Diskon tunggal 10% adalah Rp270.000, sehingga (4) Salah."
        },
        {
            "id": "mtk_smp_b1_q5",
            "soal": "Soal 5 · Unit 1.10 (PGK Kategori — Proyek) Renovasi ruang kelas direncanakan selesai dalam 12 hari oleh 6 pekerja. Tentukan kebenaran dari pernyataan berikut:\n(1) Total beban pekerjaan proyek setara 72 hari-orang.\n(2) Agar proyek selesai dalam 8 hari, dibutuhkan tambahan pekerja hingga total 9 orang.\n(3) Jika pekerja dikurangi menjadi 4 orang, proyek akan selesai dalam 8 hari.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "Beban proyek $= 6 \\times 12 = 72$ hari-orang (1 Benar). Selesai 8 hari butuh $\\frac{72}{8} = 9$ orang (2 Benar). Dengan 4 orang butuh $\\frac{72}{4} = 18$ hari, bukan 8 hari (3 Salah)."
        },
        {
            "id": "mtk_smp_b1_q6",
            "soal": "Soal 6 · Unit 1.4 (PGK Kategori — Akar & Notasi) Tentukan kebenaran dari pernyataan operasi matematika berikut:\n(1) $\\sqrt{75} - \\sqrt{27} = 2\\sqrt{3}$.\n(2) Bentuk notasi ilmiah baku dari 0,00048 adalah $4,8 \\times 10^{-4}$.\n(3) Nilai dari $\\sqrt{9} + \\sqrt{16}$ tepat sama dengan $\\sqrt{25}$.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "(1) $5\\sqrt{3} - 3\\sqrt{3} = 2\\sqrt{3}$ (Benar).\n(2) $0,00048 = 4,8 \\times 10^{-4}$ (Benar).\n(3) $\\sqrt{9} + \\sqrt{16} = 3 + 4 = 7 \\neq \\sqrt{25} = 5$ (Salah)."
        }
    ],
    2: [
        {
            "id": "mtk_smp_b2_q1",
            "soal": "Soal 1 · Unit 2.2 (Sifat Distributif) Hasil pengurangan bentuk aljabar $2(3x - 4)$ dari $5(2x + 1)$ adalah …",
            "opsi": {
                "A": "$4x + 13$",
                "B": "$4x - 3$",
                "C": "$16x - 3$",
                "D": "$4x + 5$"
            },
            "kunci": "A",
            "pembahasan": "Ingat pola 'A dari B' berarti $B - A$: $5(2x + 1) - 2(3x - 4) = (10x + 5) - (6x - 8) = 10x - 6x + 5 + 8 = 4x + 13$."
        },
        {
            "id": "mtk_smp_b2_q2",
            "soal": "Soal 2 · Unit 2.9 (Fungsi Linear) Diketahui fungsi linear $f(x) = 4x - 7$. Jika nilai $f(k) = 13$, maka nilai $k$ adalah …",
            "opsi": {
                "A": "3",
                "B": "4",
                "C": "5",
                "D": "6"
            },
            "kunci": "C",
            "pembahasan": "$4k - 7 = 13 \\rightarrow 4k = 20 \\rightarrow k = 5$."
        },
        {
            "id": "mtk_smp_b2_q3",
            "soal": "Soal 3 · Unit 2.5 (PtLSV) Penyelesaian pertidaksamaan $2(x - 3) \\le 4x + 2$ adalah … Tentukan pernyataan yang BENAR:\n(1) Hasil penyederhanaan ruas adalah $-2x \\le 8$.\n(2) Nilai himpunan penyelesaiannya adalah $x \\ge -4$.\n(3) Bilangan bulat terkecil yang memenuhi adalah $-4$.\n(4) Nilai $x = -5$ termasuk anggota himpunan penyelesaian.",
            "opsi": {
                "A": "(1), (2), dan (3)",
                "B": "(1) dan (3) saja",
                "C": "(2) dan (4)",
                "D": "Semua pernyataan benar"
            },
            "kunci": "A",
            "pembahasan": "$2x - 6 \\le 4x + 2 \\rightarrow -2x \\le 8$. Saat dibagi bilangan negatif (-2), tanda pertidaksamaan berbalik arah menjadi $x \\ge -4$. Bilangan bulat terkecil adalah $-4$. Nilai $x = -5$ tidak memenuhi karena $-5 < -4$."
        },
        {
            "id": "mtk_smp_b2_q4",
            "soal": "Soal 4 · Unit 2.10 (Barisan & Deret) Barisan bilangan aritmetika: 5, 9, 13, 17, … Tentukan pernyataan yang BENAR:\n(1) Beda barisan adalah $b = 4$.\n(2) Nilai suku ke-10 ($U_{10}$) adalah 41.\n(3) Jumlah 5 suku pertama ($S_5$) adalah 65.\n(4) Nilai suku ke-6 ($U_6$) adalah 24.",
            "opsi": {
                "A": "(1), (2), dan (3)",
                "B": "(1) dan (2) saja",
                "C": "(2) dan (4)",
                "D": "Semua pernyataan benar"
            },
            "kunci": "A",
            "pembahasan": "$a = 5, b = 4$. $U_{10} = 5 + 9(4) = 41$ (Benar). $S_5 = \\frac{5}{2}(2(5) + 4(4)) = \\frac{5}{2}(26) = 65$ (Benar). $U_6 = 5 + 5(4) = 25$ (bukan 24, Salah)."
        },
        {
            "id": "mtk_smp_b2_q5",
            "soal": "Soal 5 · Unit 2.6 (PGK Kategori — SPLDV Parkir) Di sebuah tempat parkir terdapat 30 kendaraan (mobil roda 4 dan sepeda motor roda 2) dengan jumlah total 84 roda. Tarif parkir mobil Rp5.000 dan sepeda motor Rp2.000. Tentukan kebenaran pernyataan berikut:\n(1) Banyak mobil di tempat parkir adalah 12 unit.\n(2) Banyak motor di tempat parkir adalah 18 unit.\n(3) Total penerimaan retribusi parkir adalah Rp100.000.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "Model SPLDV: $m + t = 30$ dan $4m + 2t = 84 \\rightarrow 2m + t = 42$. Kurangkan: $m = 12$ mobil, $t = 18$ motor. Penerimaan: $12(5.000) + 18(2.000) = 60.000 + 36.000 = \\text{Rp}96.000$ (bukan Rp100.000)."
        },
        {
            "id": "mtk_smp_b2_q6",
            "soal": "Soal 6 · Unit 2.10 (PGK Kategori — Pola Kursi) Sebuah gedung pertunjukan memiliki 8 baris kursi. Baris pertama berisi 20 kursi, dan baris-baris berikutnya selalu bertambah 4 kursi dari baris di depannya. Tentukan kebenaran pernyataan berikut:\n(1) Baris paling belakang (baris ke-8) berisi 48 kursi.\n(2) Total kapasitas tempat duduk di gedung tersebut adalah 272 kursi.\n(3) Jika seluruh kursi terisi penonton dengan tiket Rp25.000 per orang, total hasil penjualan tiket adalah Rp6.800.000.",
            "opsi": {
                "A": "Semua pernyataan Benar",
                "B": "(1) Benar, (2) Benar, (3) Salah",
                "C": "(1) Benar, (2) Salah, (3) Benar",
                "D": "(1) Salah, (2) Benar, (3) Benar"
            },
            "kunci": "A",
            "pembahasan": "$U_8 = 20 + 7(4) = 48$ kursi (Benar). $S_8 = \\frac{8}{2}(20 + 48) = 4(68) = 272$ kursi (Benar). Hasil tiket: $272 \\times 25.000 = \\text{Rp}6.800.000$ (Benar)."
        }
    ],
    3: [
        {
            "id": "mtk_smp_b3_q1",
            "soal": "Soal 1 · Unit 3.1 (Sudut Jarum Jam) Besar sudut terkecil yang dibentuk oleh jarum jam pendek dan jarum menit pada pukul 04.30 adalah …",
            "opsi": {
                "A": "30°",
                "B": "45°",
                "C": "60°",
                "D": "75°"
            },
            "kunci": "B",
            "pembahasan": "Rumus sudut jarum jam: $|30j - 5,5m| = |30(4) - 5,5(30)| = |120 - 165| = |-45| = 45^\\circ$."
        },
        {
            "id": "mtk_smp_b3_q2",
            "soal": "Soal 2 · Unit 3.7 (Lingkaran) Sebuah taman kota berbentuk lingkaran dengan jari-jari 14 m ($\\pi = \\frac{22}{7}$). Di sekeliling tepi taman akan ditanami pohon palem dengan jarak antar pohon 4 m. Banyak pohon palem yang dibutuhkan adalah …",
            "opsi": {
                "A": "11 pohon",
                "B": "22 pohon",
                "C": "44 pohon",
                "D": "88 pohon"
            },
            "kunci": "B",
            "pembahasan": "Keliling lingkaran $K = 2\\pi r = 2 \\times \\frac{22}{7} \\times 14 = 88\\text{ m}$. Banyak pohon yang dibutuhkan $= \\frac{88}{4} = 22$ pohon."
        },
        {
            "id": "mtk_smp_b3_q3",
            "soal": "Soal 3 · Unit 3.4 (Pythagoras) Sebuah tangga sepanjang 5 m disandarkan ke dinding tegak, dengan jarak kaki tangga ke dasar tembok sejauh 3 m. Tentukan pernyataan yang BENAR:\n(1) Tinggi ujung tangga menyentuh tembok adalah 4 m.\n(2) Perbandingan sisi segitiga membentuk triple Pythagoras (3, 4, 5).\n(3) Luas daerah segitiga yang dibentuk tangga, lantai, dan tembok adalah 6 m².\n(4) Jika kaki tangga digeser mendekati tembok menjadi 1 m, tinggi ujung tangga naik tepat 2 m.",
            "opsi": {
                "A": "(1), (2), dan (3)",
                "B": "(1) dan (3) saja",
                "C": "(2) dan (4)",
                "D": "Semua pernyataan benar"
            },
            "kunci": "A",
            "pembahasan": "Tinggi tembok $t = \\sqrt{5^2 - 3^2} = \\sqrt{25 - 9} = 4\\text{ m}$. Luas segitiga $= \\frac{1}{2} \\times 3 \\times 4 = 6\\text{ m}^2$. Jika alas menjadi 1 m, tinggi menjadi $\\sqrt{25 - 1} = \\sqrt{24} \\approx 4,9\\text{ m}$ (hanya naik 0,9 m, bukan 2 m)."
        },
        {
            "id": "mtk_smp_b3_q4",
            "soal": "Soal 4 · Unit 3.12 & 3.13 (Transformasi) Diketahui koordinat titik $M(4, -3)$. Tentukan bayangan transformasi yang BENAR:\n(1) Refleksi terhadap sumbu-X menghasilkan koordinat bayangan $M'(4, 3)$.\n(2) Translasi oleh vektor $T(-2, 5)$ menghasilkan bayangan $M'(2, 2)$.\n(3) Rotasi $90^\\circ$ berlawanan arah jarum jam berpusat di $(0,0)$ menghasilkan bayangan $M'(3, 4)$.\n(4) Dilatasi faktor skala 2 dari pusat $(0,0)$ menghasilkan bayangan $M'(6, -5)$.",
            "opsi": {
                "A": "(1), (2), dan (3)",
                "B": "(1) dan (2) saja",
                "C": "(2) dan (4)",
                "D": "Semua pernyataan benar"
            },
            "kunci": "A",
            "pembahasan": "Refleksi sb-X: $(x, -y) \\rightarrow (4, 3)$. Translasi: $(4-2, -3+5) = (2, 2)$. Rotasi $90^\\circ$: $(-y, x) \\rightarrow (-(-3), 4) = (3, 4)$. Dilatasi $\\times 2$: $(2(4), 2(-3)) = (8, -6)$ (bukan $(6, -5)$)."
        },
        {
            "id": "mtk_smp_b3_q5",
            "soal": "Soal 5 · Unit 3.10 (PGK Kategori — Bangun Ruang) Sebuah monumen berbentuk balok berukuran 120 cm × 60 cm × 40 cm disusun dari batu bata ringan berukuran 60 cm × 20 cm × 10 cm tanpa celah. Tentukan kebenaran dari pernyataan berikut:\n(1) Volume 1 buah bata ringan adalah 12.000 cm³.\n(2) Banyak bata ringan yang dibutuhkan untuk menyusun monumen adalah 24 buah.\n(3) Luas seluruh permukaan monumen balok tersebut adalah 28.800 cm².",
            "opsi": {
                "A": "Semua pernyataan Benar",
                "B": "(1) Benar, (2) Benar, (3) Salah",
                "C": "(1) Benar, (2) Salah, (3) Benar",
                "D": "(1) Salah, (2) Benar, (3) Benar"
            },
            "kunci": "A",
            "pembahasan": "Volume bata $= 60 \\times 20 \\times 10 = 12.000\\text{ cm}^3$ (Benar). Volume monumen $= 120 \\times 60 \\times 40 = 288.000\\text{ cm}^3 \\rightarrow$ butuh $\\frac{288.000}{12.000} = 24$ buah (Benar). $L_p = 2(120(60) + 120(40) + 60(40)) = 2(7.200 + 4.800 + 2.400) = 28.800\\text{ cm}^2$ (Benar)."
        },
        {
            "id": "mtk_smp_b3_q6",
            "soal": "Soal 6 · Unit 3.8 (PGK Kategori — Juring Lingkaran) Sebuah loyang pizza berbentuk lingkaran dengan jari-jari 14 cm dipotong merata menjadi 6 juring pizza sama besar ($\\pi = \\frac{22}{7}$). Tentukan kebenaran dari pernyataan berikut:\n(1) Sudut pusat dari setiap potongan pizza adalah $60^\\circ$.\n(2) Luas dari setiap potongan pizza adalah $102,67$ cm².\n(3) Panjang busur kerak tepi dari setiap satu potongan pizza adalah $\\frac{44}{3}$ cm.",
            "opsi": {
                "A": "Semua pernyataan Benar",
                "B": "(1) Benar, (2) Benar, (3) Salah",
                "C": "(1) Benar, (2) Salah, (3) Benar",
                "D": "(1) Salah, (2) Benar, (3) Benar"
            },
            "kunci": "A",
            "pembahasan": "Sudut pusat $= \\frac{360^\\circ}{6} = 60^\\circ$ (Benar). Luas juring $= \\frac{1}{6} \\times \\frac{22}{7} \\times 14^2 = \\frac{616}{6} = 102,67\\text{ cm}^2$ (Benar). Panjang busur $= \\frac{1}{6} \\times 2 \\times \\frac{22}{7} \\times 14 = \\frac{44}{3}\\text{ cm}$ (Benar)."
        }
    ],
    4: [
        {
            "id": "mtk_smp_b4_q1",
            "soal": "[Unit 4.2] Diagram lingkaran data minat ekskul 200 siswa: IPA $90^\\circ$, Matematika $108^\\circ$, dan sisanya memilih Bahasa. Banyak siswa yang memilih ekskul Bahasa adalah …",
            "opsi": {
                "A": "80 siswa",
                "B": "90 siswa",
                "C": "100 siswa",
                "D": "110 siswa"
            },
            "kunci": "B",
            "pembahasan": "Sudut Bahasa $= 360^\\circ - (90^\\circ + 108^\\circ) = 360^\\circ - 198^\\circ = 162^\\circ$. Banyak siswa $= \\frac{162}{360} \\times 200 = \\frac{9}{20} \\times 200 = 90$ siswa."
        },
        {
            "id": "mtk_smp_b4_q2",
            "soal": "[Unit 4.3] Diketahui data ulangan harian: 6, 8, 7, 9, 7, 5, 7. Tentukan pernyataan yang BENAR:\n(1) Nilai Modus data adalah 7.\n(2) Nilai Median data adalah 7.\n(3) Jangkauan data adalah 3.\n(4) Nilai rata-rata (Mean) lebih besar dari 7.",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Urutkan data: 5, 6, 7, 7, 7, 8, 9.\n• Modus $= 7$ (muncul 3 kali, paling sering).\n• Median $= 7$ (data ke-4 tepat di tengah).\n• Jangkauan $= 9 - 5 = 4$ (bukan 3).\n• Mean $= \\frac{49}{7} = 7$ (tepat 7, bukan lebih besar dari 7).\nJadi pernyataan yang benar adalah (1) dan (2)."
        },
        {
            "id": "mtk_smp_b4_q3",
            "soal": "[Unit 4.4 & 4.5] Sebuah dadu bermata 6 dilempar 1 kali secara acak (dan untuk pernyataan 3 dilempar 90 kali). Tentukan pernyataan yang BENAR:\n(1) Peluang muncul mata dadu bilangan prima adalah $\\frac{1}{2}$.\n(2) Peluang muncul mata dadu faktor dari 6 adalah $\\frac{2}{3}$.\n(3) Dalam 90 lemparan, frekuensi harapan muncul mata dadu > 4 adalah 45 kali.",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (3)",
                "D": "Semua pernyataan benar"
            },
            "kunci": "A",
            "pembahasan": "Titik sampel:\n• Prima {2, 3, 5} $\\rightarrow P = \\frac{3}{6} = \\frac{1}{2}$ (Benar).\n• Faktor dari 6 {1, 2, 3, 6} $\\rightarrow P = \\frac{4}{6} = \\frac{2}{3}$ (Benar).\n• Mata dadu > 4 {5, 6} $\\rightarrow P = \\frac{2}{6} = \\frac{1}{3} \\rightarrow F_h = \\frac{1}{3} \\times 90 = 30$ kali (bukan 45 kali).\nJadi pernyataan yang benar adalah (1) dan (2)."
        }
    ]
}

# ==============================================================================
# 4. BAHASA INDONESIA SMP (BIN Literasi TKA - 4 Bab)
# ==============================================================================
BIN_QUIZZES = {
    1: [
        {
            "id": "bin_smp_b1_q1",
            "soal": "Soal 1 [PG · Unit 1.1] Berdasarkan teks stimulus \"Kompos dari Sampah Dapur\", makna istilah teknis 'fermentasi' sesuai konteks bacaan adalah …",
            "opsi": {
                "A": "Pembakaran sampah secara bertahap dalam suhu tinggi",
                "B": "Penguraian bahan organik oleh mikroorganisme di wadah tertutup",
                "C": "Penyiraman tanaman pekarangan secara berkala",
                "D": "Penjemuran kulit buah di bawah terik sinar matahari"
            },
            "kunci": "B",
            "pembahasan": "Konteks kalimat 'Proses fermentasi dibantu oleh bakteri pengurai selama tiga minggu di dalam wadah tertutup' mempertegas bahwa fermentasi bermakna penguraian zat organik oleh mikroorganisme."
        },
        {
            "id": "bin_smp_b1_q2",
            "soal": "Soal 2 [PG · Unit 1.2] Frasa rujukan \"Upaya ini\" pada kalimat terakhir teks stimulus mengacu pada …",
            "opsi": {
                "A": "Membuang sampah rumah tangga ke tempat penampungan akhir",
                "B": "Membeli pupuk kimia sintetis di toko pertanian",
                "C": "Pengolahan sampah organik rumah tangga menjadi pupuk kompos",
                "D": "Menanam berbagai sayuran di pekarangan rumah"
            },
            "kunci": "C",
            "pembahasan": "Frasa demonstratif 'Upaya ini' merujuk langsung pada seluruh proses pembuatan kompos dari sampah sisa dapur yang dipaparkan pada kalimat sebelumnya."
        },
        {
            "id": "bin_smp_b1_q3",
            "soal": "Soal 3 [PGK MCMA · Unit 1.5 Prosedur] Berdasarkan teks Kompos di kiri, benda manakah yang tergolong ke dalam kategori Alat (sarana fisik), bukan Bahan?\n(1) Kulit buah dan sisa sayuran dapur\n(2) Wadah komposter tertutup\n(3) Sendok pengaduk kompos\n(4) Bakteri pengurai (starter kompos)",
            "opsi": {
                "A": "(2) dan (3)",
                "B": "(1) dan (4)",
                "C": "(1) dan (2)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Wadah komposter dan sendok pengaduk adalah Alat (instrumen pendukung). Sementara itu, sisa sayur, kulit buah, dan bakteri pengurai adalah Bahan yang diproses."
        },
        {
            "id": "bin_smp_b1_q4",
            "soal": "Soal 4 [PGK MCMA · Unit 1.6 Latar Waktu] Perhatikan kutipan: “Di teras kayu yang basah, embun masih menggelayut di daun keladi. Pak Karta membelah sisa bambu sebelum kokok ayam kedua terdengar.” Frasa manakah yang membuktikan latar waktu subuh/pagi hari?\n(1) Di teras kayu yang basah\n(2) Embun masih menggelayut di daun keladi\n(3) Pak Karta membelah sisa bambu\n(4) Sebelum kokok ayam kedua terdengar",
            "opsi": {
                "A": "(2) dan (4)",
                "B": "(1) dan (3)",
                "C": "(1) dan (2)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Petunjuk deskripsi alam 'embun masih menggelayut' dan pertanda auditori 'sebelum kokok ayam kedua terdengar' merupakan bukti kuat latar waktu fajar atau dini hari."
        },
        {
            "id": "bin_smp_b1_q5",
            "soal": "Soal 5 · Unit 1.9 & 1.10 (Kesesuaian Informasi) Tentukan kebenaran dari pernyataan berikut berdasarkan teks stimulus Kompos:\n(1) Proses penguraian kompos membutuhkan waktu sekitar 21 hari di wadah tertutup.\n(2) Sisa kantong plastik kemasan juga termasuk bahan utama kompos ramah lingkungan.\n(3) Pengolahan sampah organik dapur menjadi kompos membantu mengurangi volume timbulan sampah rumah tangga.",
            "opsi": {
                "A": "(1) Benar, (2) Salah, (3) Benar",
                "B": "(1) Benar, (2) Benar, (3) Salah",
                "C": "(1) Salah, (2) Benar, (3) Benar",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "(1) Tiga minggu = 21 hari (Benar). (2) Sampah plastik adalah anorganik non-degradable (Salah). (3) Kompos mereduksi sampah dapur (Benar)."
        },
        {
            "id": "bin_smp_b1_q6",
            "soal": "Soal 6 · Unit 1.3 (Denotatif vs Konotatif) Tentukan kebenaran pasangan makna denotatif (harfiah) dan konotatif (kiasan) berikut:\n(1) \"Ibu menyapu remah-remah sampah di lantai dapur.\" (Bermakna Denotatif)\n(2) \"Ia menganggap nasihat tulus pamannya hanya sebagai sampah.\" (Bermakna Konotatif)\n(3) \"Kamar kos yang berantakan itu terlihat kumuh seperti tumpukan sampah.\" (Bermakna Konotatif)",
            "opsi": {
                "A": "Semua pernyataan Benar",
                "B": "(1) dan (2) Benar, (3) Salah",
                "C": "(1) Benar, (2) dan (3) Salah",
                "D": "(1) Salah, (2) dan (3) Benar"
            },
            "kunci": "A",
            "pembahasan": "Seluruh pasangan tepat: nomor (1) bermakna sampah fisik sebenarnya (denotasi), nomor (2) bermakna sesuatu yang tak berharga/sia-sia (konotasi), nomor (3) majas asosiasi kondisi sangat berantakan (konotasi)."
        }
    ],
    2: [
        {
            "id": "bin_smp_b2_q1",
            "soal": "Soal 1 [PG · Unit 2.1 Ide Pokok] Berdasarkan perbandingan dua teks di Halaman 26, gagasan utama Teks A (Berita Perpustakaan) adalah …",
            "opsi": {
                "A": "Lonjakan harga buku cetak di pasaran",
                "B": "Layanan peminjaman buku digital gratis oleh Perpustakaan Kota",
                "C": "Kelebihan laptop dibanding smartphone dalam membaca",
                "D": "Peraturan larangan membawa gawai pribadi ke perpustakaan"
            },
            "kunci": "B",
            "pembahasan": "Kalimat utama Teks A menegaskan bahwa Perpustakaan Kota kini membuka fasilitas peminjaman buku digital secara gratis melalui aplikasi mobile."
        },
        {
            "id": "bin_smp_b2_q2",
            "soal": "Soal 2 [PG · Unit 2.7 Simpulan] Persamaan informasi pokok yang dibahas secara serentak pada Teks A dan Teks B adalah …",
            "opsi": {
                "A": "Ketentuan batas waktu pengembalian buku maksimal 7 hari",
                "B": "Inovasi digital perpustakaan membantu akses literasi bagi pelajar",
                "C": "Program pembagian kuota internet belajar gratis",
                "D": "Rencana penutupan gedung perpustakaan konvensional"
            },
            "kunci": "B",
            "pembahasan": "Kedua teks sama-sama mengulas manfaat nyata inovasi digital perpustakaan dalam mempermudah siswa mengakses bahan bacaan berkualitas."
        },
        {
            "id": "bin_smp_b2_q3",
            "soal": "Soal 3 [PGK MCMA · Unit 2.8 Perbedaan 2 Teks] Manakah yang merupakan perbedaan objektif antara Teks A dan Teks B?\n(1) Teks A memuat data teknis batas waktu peminjaman dan kuota buku.\n(2) Teks B memuat ungkapan impresi emosional kepuasan siswa pengguna.\n(3) Teks A melarang keras pembaca membaca buku di rumah.\n(4) Teks B menyebutkan bahwa buku digital perpustakaan tidak bermanfaat.",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Teks A adalah teks berita faktual dengan rincian 3 buku / 7 hari (1). Teks B adalah teks ulasan opini siswa yang memuat frasa emotif 'Asyik banget!' (2)."
        },
        {
            "id": "bin_smp_b2_q4",
            "soal": "Soal 4 [PGK MCMA · Unit 2.5 Prediksi] Berdasarkan kedua teks, apa kendala logis yang dialami siswa bila tinggal di daerah tanpa konektivitas sinyal internet?\n(1) Siswa kesulitan melakukan pengunduhan file buku digital di aplikasi.\n(2) Siswa tetap dapat membaca langsung buku fisik yang tersedia di gedung perpustakaan.\n(3) Aplikasi perpustakaan akan langsung memblokir akun siswa selamanya.\n(4) Pihak perpustakaan akan mengantarkan buku fisik secara otomatis ke rumah siswa.",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Teks A menyatakan koneksi stabil tetap diperlukan saat mengunduh buku (1), dan layanan peminjaman konvensional di gedung fisik tetap buka (2)."
        },
        {
            "id": "bin_smp_b2_q5",
            "soal": "Soal 5 · Unit 2.10 (Fakta vs Opini pada Teks B) Tentukan kebenaran dari analisis fakta vs opini berikut:\n(1) Kalimat “Asyik banget!” merupakan opini subjektif dari penulis Teks B.\n(2) Ketentuan batas peminjaman maksimal 3 buku selama 7 hari di Teks A adalah fakta.\n(3) Kedua teks sepakat bahwa sistem aplikasi perpustakaan sama sekali tidak memiliki kelemahan.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "(1) dan (2) Benar. (3) Salah karena Teks A secara jujur menyebutkan kelemahan: masih bergantung pada konektivitas internet yang stabil."
        },
        {
            "id": "bin_smp_b2_q6",
            "soal": "Soal 6 · Unit 2.4 (Hubungan Kalimat) Pada Teks A, kalimat terakhir dibuka dengan konjungsi antarkalimat “Namun”. Makna dan fungsi konjungsi tersebut adalah …",
            "opsi": {
                "A": "Menunjukkan pertentangan atau pembatasan terhadap kemudahan yang diuraikan sebelumnya",
                "B": "Menjelaskan urutan langkah kronologis peminjaman buku",
                "C": "Menyajikan contoh judul buku bacaan yang sedang populer",
                "D": "Menegaskan kesimpulan umum seluruh artikel berita"
            },
            "kunci": "A",
            "pembahasan": "Konjungsi pertentangan 'Namun' mengindikasikan syarat atau catatan pembatas (walaupun aplikasi gratis dan praktis, pengguna tetap membutuhkan internet stabil)."
        }
    ],
    3: [
        {
            "id": "bin_smp_b3_q1",
            "soal": "Soal 1 [PG · Unit 3.1 Penokohan] Berdasarkan kutipan cerpen \"Sepatu Raka\", karakter tokoh Raka yang paling menonjol tercermin dari perbuatannya adalah …",
            "opsi": {
                "A": "Manja dan gemar menuntut kepada orang tua",
                "B": "Mandiri, berbakti, dan berempati pada kondisi keluarga",
                "C": "Mudah marah dan putus asa menghadapi keadaan",
                "D": "Ceroboh dan tidak merawat perlengkapan sekolah"
            },
            "kunci": "B",
            "pembahasan": "Raka tidak mau membebani ibunya yang baru pulih dan memilih menjahit sendiri sepatunya yang sobek sambil tetap bersemangat ke sekolah."
        },
        {
            "id": "bin_smp_b3_q2",
            "soal": "Soal 2 [PG · Unit 3.6 Sudut Pandang] Sudut pandang (Point of View) yang dipakai pengarang dalam kutipan cerpen \"Sepatu Raka\" adalah …",
            "opsi": {
                "A": "Orang pertama pelaku utama (aku-an)",
                "B": "Orang kedua sebagai pengamat",
                "C": "Orang ketiga serbatahu (dia-an / nama tokoh)",
                "D": "Sudut pandang campuran berganti-ganti"
            },
            "kunci": "C",
            "pembahasan": "Narator menyebut tokoh dengan nama Raka/ia dan mengetahui pikiran batinnya ('Ia tidak ingin merepotkan ibunya...'). Ini adalah sudut pandang orang ketiga serbatahu."
        },
        {
            "id": "bin_smp_b3_q3",
            "soal": "Soal 3 [PGK MCMA · Unit 3.10 Majas] Perhatikan kalimat berikut! Manakah kalimat yang menggunakan majas Personifikasi?\n(1) Angin malam berbisik lembut di telingaku.\n(2) Daun-daun kering menari gembira tertiup angin sore.\n(3) Wajah gadis itu bersinar indah bagai bulan purnama.\n(4) Suara gelegar petir membelah angkasa raya.",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Perilaku insan 'berbisik' dan 'menari' dilekatkan pada benda mati (angin dan daun) → Personifikasi. Nomor (3) adalah Simile ('bagai'); nomor (4) adalah Hiperbola ('membelah angkasa')."
        },
        {
            "id": "bin_smp_b3_q4",
            "soal": "Soal 4 [PGK MCMA · Unit 3.11 Citraan] Kutipan: “Aroma roti hangat memenuhi dapur kecil itu, sementara denting sendok terdengar riang.” Citraan indra yang dominan hadir adalah …\n(1) Citraan penciuman (pembauan)\n(2) Citraan pendengaran (auditif)\n(3) Citraan perabaan (taktil)\n(4) Citraan pengecapan (gustatif)",
            "opsi": {
                "A": "(1) dan (2)",
                "B": "(1) dan (3)",
                "C": "(2) dan (4)",
                "D": "(3) dan (4)"
            },
            "kunci": "A",
            "pembahasan": "Frasa 'aroma roti hangat' melibatkan indra penciuman, dan frasa 'denting sendok terdengar' melibatkan indra pendengaran."
        },
        {
            "id": "bin_smp_b3_q5",
            "soal": "Soal 5 · Unit 3.7 & 3.8 (Prediksi & Amanat) Tentukan kebenaran dari analisis cerpen Sepatu Raka berikut:\n(1) Jika Raka tidak memiliki rasa peduli pada ibunya, ia mungkin akan merengek memaksa dibelikan sepatu baru.\n(2) Cerita tersebut menanamkan nilai moral kemandirian dan rasa bakti kepada orang tua.\n(3) Raka merasa sangat rendah diri dan malu sehingga memilih membolos dari sekolah.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "(1) dan (2) Benar. (3) Salah karena teks menegaskan Raka tersenyum dan berkata mantap 'Yang penting masih kuat untuk sekolah'."
        },
        {
            "id": "bin_smp_b3_q6",
            "soal": "Soal 6 · Unit 3.9 (Makna Puisi) Perhatikan larik puisi: “Peluh ayah jatuh menjadi jembatan mimpiku.” Tentukan kebenaran dari pernyataan apresiasi berikut:\n(1) Kata peluh melambangkan cucuran keringat, jerih payah, dan perjuangan keras seorang ayah.\n(2) Frasa jembatan mimpiku bermakna sarana atau jalan pembuka bagi anak dalam menggapai cita-citanya.\n(3) Larik tersebut mengisahkan bahwa sang ayah berprofesi sebagai tukang pembuat jembatan di sungai.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "(1) dan (2) Benar sebagai interpretasi puitis. (3) Salah karena menafsirkan metafora puisi secara harfiah."
        }
    ],
    4: [
        {
            "id": "bin_smp_b4_q1",
            "soal": "Soal 1 [PG · Unit 4.1 Relevansi] Cerpen tentang siswa yang kerap menunda-nunda pengerjaan tugas hingga panik keteteran paling relevan digunakan untuk mengingatkan pelajar agar …",
            "opsi": {
                "A": "Menolak tugas yang diberikan oleh guru sekolah",
                "B": "Membiasakan menyusun jadwal belajar dan mencicil tugas sejak awal",
                "C": "Menyalin tugas teman sekelas agar cepat beres",
                "D": "Mengurangi interaksi belajar bersama teman"
            },
            "kunci": "B",
            "pembahasan": "Nilai relevansi cerita mengajarkan sikap disiplin manajemen waktu (proaktif mencicil tugas dan tidak melakukan prokrastinasi)."
        },
        {
            "id": "bin_smp_b4_q2",
            "soal": "Soal 2 [PGK MCMA · Unit 4.5 Evaluasi Kritis] Ciri-ciri informasi hoaks di media sosial yang patut diwaspadai oleh pelajar adalah …\n(1) Memakai judul provokatif yang memancing emosi dan kemarahan pembaca\n(2) Tidak mencantumkan sumber lembaga riset atau redaksi yang jelas\n(3) Memuat kalimat desakan panik seperti 'segera sebarkan ke semua grup'\n(4) Dilengkapi rujukan data resmi dari lembaga kementerian terkait",
            "opsi": {
                "A": "(1), (2), dan (3)",
                "B": "(1) dan (4)",
                "C": "(2) dan (4)",
                "D": "Semua nomor benar"
            },
            "kunci": "A",
            "pembahasan": "Ciri khas hoaks mencakup nomor (1), (2), dan (3). Nomor (4) justru merupakan tanda berita kredibel dan terverifikasi."
        },
        {
            "id": "bin_smp_b4_q3",
            "soal": "Soal 3 [PGK Kategori · Unit 4.3 Fungsi Infografis] Sebuah artikel tentang langkah hemat listrik di rumah tangga dilengkapi dengan infografis visual. Tentukan kebenaran dari pernyataan berikut:\n(1) Infografis membantu pembaca mencerna langkah praktis hemat listrik secara lebih cepat dan ringkas.\n(2) Elemen visual infografis meningkatkan daya tarik minat baca terhadap topik artikel.\n(3) Keberadaan infografis membuat teks artikel menjadi tidak perlu dibaca sama sekali.",
            "opsi": {
                "A": "(1) Benar, (2) Benar, (3) Salah",
                "B": "(1) Benar, (2) Salah, (3) Benar",
                "C": "(1) Salah, (2) Benar, (3) Salah",
                "D": "Semua pernyataan Benar"
            },
            "kunci": "A",
            "pembahasan": "Infografis berfungsi sebagai komplemen visual yang memperkuat pemahaman teks (1 dan 2 Benar). Nomor (3) Salah karena infografis bukan pengganti total teks penjelasan."
        }
    ]
}

def clean_obj(obj):
    if isinstance(obj, str):
        # Clean any PUA characters
        t = re.sub(r'[\ue000-\uf8ff]', '', obj)
        # Fractions to KaTeX upright
        t = t.replace('½', r'$\frac{1}{2}$')
        t = t.replace('⅓', r'$\frac{1}{3}$')
        t = t.replace('⅔', r'$\frac{2}{3}$')
        t = t.replace('¼', r'$\frac{1}{4}$')
        t = t.replace('¾', r'$\frac{3}{4}$')
        t = t.replace('⅛', r'$\frac{1}{8}$')
        t = t.replace('⅜', r'$\frac{3}{8}$')
        t = t.replace('⅝', r'$\frac{5}{8}$')
        t = t.replace('⅞', r'$\frac{7}{8}$')
        return t
    elif isinstance(obj, list):
        return [clean_obj(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: clean_obj(v) for k, v in obj.items()}
    return obj

def apply_quiz_updates(filename, export_name, alias_name, quiz_dict):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r') as f:
        content = f.read()

    m = re.search(r'export const \w+\s*=\s*(\[.*\]);', content, re.DOTALL)
    if not m:
        print(f"Gagal regex pada {filename}")
        return

    data = json.loads(m.group(1))

    # Replace kuisPemahaman in each bab with the accurate parsed data
    for bab_item in data:
        bab_no = bab_item.get("babNumber")
        if bab_no in quiz_dict:
            bab_item["kuisPemahaman"] = quiz_dict[bab_no]
            print(f"  [{filename}] Bab {bab_no} diupdate ({len(quiz_dict[bab_no])} soal)")

    cleaned_data = clean_obj(data)

    header = f"// src/data/modul-smp/{filename}\n// ==============================================================================\n// MODUL MASTER 52 HALAMAN RESMI TKA SMP 2027 - BIMBEL GEMILANG\n// 100% Bebas Kuis Kunci Dummy, Bebas PUA, Pecahan Tegak KaTeX & Terstruktur Rapi\n// ==============================================================================\n\nexport const {export_name} = "
    formatted_json = json.dumps(cleaned_data, ensure_ascii=False, indent=2)
    footer = f";\n\nexport const {alias_name} = {export_name};\nexport default {export_name};\n"

    with open(filepath, 'w') as f:
        f.write(header + formatted_json + footer)

    print(f"Berhasil memperbarui {filename}!\n")

def run():
    print("Memulai rekonstruksi kuis interaktif TKA SMP...")
    apply_quiz_updates("ipaSmpData.js", "IPA_SMP_MODUL", "ipaSmpData", IPA_QUIZZES)
    apply_quiz_updates("bahasaInggrisSmpData.js", "BIG_SMP_MODUL", "bahasaInggrisSmpData", BIG_QUIZZES)
    apply_quiz_updates("matematikaSmpData.js", "MTK_SMP_MODUL", "matematikaSmpData", MTK_QUIZZES)
    apply_quiz_updates("bahasaIndonesiaSmpData.js", "BIN_SMP_MODUL", "bahasaIndonesiaSmpData", BIN_QUIZZES)
    print("Seluruh kuis 4 Mapel TKA SMP 2027 telah diperbarui secara sempurna!")

if __name__ == '__main__':
    run()
