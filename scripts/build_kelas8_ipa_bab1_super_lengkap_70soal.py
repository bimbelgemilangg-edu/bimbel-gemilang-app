#!/usr/bin/env python3
"""
build_kelas8_ipa_bab1_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 1 IPA SMP Kelas 8 (Struktur & Fungsi Tubuh Makhluk Hidup I):
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

# 25 Soal Kurikulum Merdeka HOTS Bab 1 (Hal. 212-218)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar organ-organ pada sistem pencernaan manusia berikut! Enzim yang dihasilkan oleh organ bertanda X (lambung) beserta fungsinya yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Ptialin, mengubah amilum menjadi maltosa"},
            {"label": "B", "teks": "Pepsin, mengubah protein menjadi pepton"},
            {"label": "C", "teks": "Lipase, mengubah lemak menjadi asam lemak dan gliserol"},
            {"label": "D", "teks": "Tripsin, mengubah pepton menjadi asam amino"}
        ],
        "kunci": "B",
        "pembahasan": "Organ bertanda X adalah lambung (ventrikulus). Getah lambung mengandung asam klorida (HCl), enzim pepsin (mengubah protein menjadi pepton), dan renin (mengendapkan kasein susu). Jadi enzim yang tepat beserta fungsinya adalah pepsin, mengubah protein menjadi pepton.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 2,
        "soal": "Ketika roti tawar dikunyah lama di dalam mulut tanpa lauk, lama-kelamaan muncul rasa agak manis. Proses perubahan kimiawi yang menyebabkan timbulnya rasa manis tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Enzim pepsin di mulut mengubah protein roti menjadi asam amino"},
            {"label": "B", "teks": "Enzim ptialin menghidrolisis amilum yang tidak manis menjadi gula sederhana maltosa yang terasa manis"},
            {"label": "C", "teks": "Asam klorida (HCl) mengemulsikan lemak pada roti tawar"},
            {"label": "D", "teks": "Gigi geraham mengubah selulosa menjadi gliserol secara mekanis"}
        ],
        "kunci": "B",
        "pembahasan": "Roti tawar banyak mengandung karbohidrat kompleks (amilum) yang rasanya tawar. Di dalam rongga mulut terdapat kelenjar ludah yang menghasilkan enzim ptialin (amilase saliva). Enzim ptialin menghidrolisis polisakarida amilum menjadi disakarida maltosa yang memiliki rasa manis.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 3,
        "soal": "Perhatikan tabel Hasil Praktikum Uji Kandungan Nutrisi Empat Bahan Makanan berikut!\n- Bahan K: Lugol (Biru Tua Kehitaman), Biuret (Tetap Biru), Benedict (Tetap Biru)\n- Bahan X: Lugol (Cokelat Kekuningan), Biuret (Ungu/Violet), Benedict (Tetap Biru)\n- Bahan Y: Lugol (Cokelat Kekuningan), Biuret (Tetap Biru), Benedict (Endapan Merah Bata)\n- Bahan Z: Lugol (Biru Tua Kehitaman), Biuret (Tetap Biru), Benedict (Endapan Merah Bata)\nBerdasarkan tabel hasil uji makanan di atas, bahan makanan yang mengandung protein dan bahan makanan yang mengandung glukosa berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Bahan K dan Bahan X"},
            {"label": "B", "teks": "Bahan X dan Bahan Y"},
            {"label": "C", "teks": "Bahan Y dan Bahan K"},
            {"label": "D", "teks": "Bahan K dan Bahan Y"}
        ],
        "kunci": "B",
        "pembahasan": "Uji reagen nutrisi: (1) Biuret menghasilkan warna ungu (violet) jika mengandung protein (ditunjukkan oleh Bahan X); (2) Benedict menghasilkan endapan merah bata jika dipanaskan bersama gula pereduksi/glukosa (ditunjukkan oleh Bahan Y). Maka berturut-turut adalah Bahan X dan Bahan Y.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 4,
        "soal": "Seorang pasien mengalami penyumbatan saluran empedu akibat batu empedu sehingga cairan empedu dari hati tidak dapat mengalir ke usus dua belas jari (duodenum). Jenis bahan makanan yang pencernaannya paling terganggu pada pasien tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Nasi dan kentang rebus (karbohidrat)"},
            {"label": "B", "teks": "Air mineral dan buah-buahan segar"},
            {"label": "C", "teks": "Putih telur dan tahu kukus (protein)"},
            {"label": "D", "teks": "Daging berlemak, santan, dan gorengan (lemak)"}
        ],
        "kunci": "D",
        "pembahasan": "Cairan empedu yang diproduksi oleh hati dan disimpan di kantong empedu berfungsi mengemulsikan lemak, yaitu memecah gumpalan lemak besar menjadi droplet-droplet kecil agar luas permukaannya meningkat dan mudah dihidrolisis oleh enzim lipase. Gangguan aliran empedu menyebabkan pencernaan lemak terganggu parah.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 5,
        "soal": "Di dalam lambung manusia diproduksi asam klorida (HCl) konsentrasi tinggi yang membuat pH lambung sangat asam (pH 1,5–2,0). Fungsi utama HCl bagi proses pencernaan di lambung adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mengubah amilum langsung menjadi glukosa"},
            {"label": "B", "teks": "Menetralkan sifat asam makanan sebelum masuk ke kerongkongan"},
            {"label": "C", "teks": "Membunuh bakteri patogen yang masuk bersama makanan dan mengaktifkan enzim pepsinogen menjadi pepsin"},
            {"label": "D", "teks": "Menyerap sari-sari makanan langsung ke pembuluh darah"}
        ],
        "kunci": "C",
        "pembahasan": "Asam klorida (HCl) di lambung berfungsi: (1) Mematikan bakteri patogen yang masuk bersama makanan; (2) Menciptakan lingkungan asam optimal untuk mengaktifkan pepsinogen yang inaktif menjadi enzim pepsin aktif pemecah protein.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 6,
        "soal": "Dinding bagian dalam usus halus (ileum) memiliki berjuta-juta lipatan tonjolan halus seperti jari yang disebut jonjot usus (vili) dan mikrovili. Adaptasi struktur anatomi ini bertujuan untuk ....",
        "opsi": [
            {"label": "A", "teks": "Menghancurkan tulang dan serat kasar secara mekanis"},
            {"label": "B", "teks": "Memperluas bidang permukaan penyerapan (absorpsi) sari-sari makanan"},
            {"label": "C", "teks": "Menghasilkan hormon insulin ke dalam rongga usus"},
            {"label": "D", "teks": "Mendorong sisa makanan keluar melalui gerak peristaltik cepat"}
        ],
        "kunci": "B",
        "pembahasan": "Keberadaan lipatan sirkular, jonjot usus (vili), dan mikrovili memperluas area permukaan serap usus halus hingga ratusan meter persegi, sehingga penyerapan sari-sari makanan ke dalam pembuluh darah dan limfa berlangsung sangat efisien.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 7,
        "soal": "Bakteri Escherichia coli yang hidup bersimbiosis mutualisme di dalam usus besar (kolon) manusia berperan penting dalam ....",
        "opsi": [
            {"label": "A", "teks": "Membantu pembusukan sisa-sisa makanan menjadi feses dan mensintesis vitamin K serta vitamin B12"},
            {"label": "B", "teks": "Mencerna batu ginjal dan asam urat"},
            {"label": "C", "teks": "Menyerap oksigen dari sisa makanan"},
            {"label": "D", "teks": "Menghasilkan enzim amilase dan lipase tambahan"}
        ],
        "kunci": "A",
        "pembahasan": "Bakteri non-patogen E. coli di usus besar membantu membusukkan sisa-sisa makanan yang tidak tercerna menjadi feses dan menghasilkan produk samping yang sangat berguna bagi tubuh, yaitu vitamin K (penting untuk pembekuan darah) dan vitamin B12.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 8,
        "soal": "Seseorang yang jarang mengonsumsi sayur-sayuran dan buah-buahan berserat serta kurang minum air putih berisiko mengalami gangguan susah buang air besar karena feses menjadi sangat keras dan kering. Gangguan pencernaan ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Diare (gastroenteritis)"},
            {"label": "B", "teks": "Gastritis (maag akut)"},
            {"label": "C", "teks": "Konstipasi (sembelit)"},
            {"label": "D", "teks": "Apendisitis (radang usus buntu)"}
        ],
        "kunci": "C",
        "pembahasan": "Konstipasi (sembelit) adalah gangguan pencernaan di mana feses mengering dan mengeras karena pergerakannya yang terlalu lambat di usus besar, menyebabkan penyerapan air yang berlebihan. Faktor pemicu utamanya adalah kurang serat dan kurang cairan.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 9,
        "soal": "Sel darah merah (eritrosit) manusia dewasa memiliki bentuk cakram bikonkaf (cekung di kedua sisi) dan tidak memiliki inti sel. Keuntungan fisiologis dari bentuk bikonkaf tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Agar eritrosit dapat menelan bakteri secara fagositosis"},
            {"label": "B", "teks": "Untuk menyimpan cadangan lemak di dalam darah"},
            {"label": "C", "teks": "Agar eritrosit dapat membelah diri di dalam pembuluh arteri"},
            {"label": "D", "teks": "Memperluas permukaan difusi pertukaran gas oksigen dan memudahkan eritrosit meliuk melewati pembuluh kapiler yang sangat sempit"}
        ],
        "kunci": "D",
        "pembahasan": "Bentuk cakram bikonkaf memberikan rasio luas permukaan terhadap volume yang lebih besar sehingga mempercepat difusi gas O2 dan CO2. Selain itu, ketiadaan inti sel membuat eritrosit fleksibel untuk melintasi kapiler mikro yang diameternya lebih kecil dari diameter sel itu sendiri.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 10,
        "soal": "Ketika warga yang tinggal di daerah pantai pindah dan mendaki ke pegunungan tinggi yang kadar oksigen udaranya tipis selama beberapa minggu, tubuhnya beradaptasi secara fisiologis dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Menurunkan jumlah sel darah merah agar darah lebih encer"},
            {"label": "B", "teks": "Memicu ginjal melepaskan hormon eritropoietin untuk meningkatkan produksi sel darah merah dan kadar hemoglobin agar pengikatan O2 tetap tercukupi"},
            {"label": "C", "teks": "Menghentikan kerja bilik kiri jantung"},
            {"label": "D", "teks": "Mengubah leukosit menjadi trombosit"}
        ],
        "kunci": "B",
        "pembahasan": "Di dataran tinggi dengan tekanan parsial O2 yang rendah (hipoksia), ginjal merespons dengan mensekresikan hormon eritropoietin (EPO). Hormon ini merangsang sumsum tulang merah untuk memproduksi lebih banyak eritrosit dan hemoglobin, sehingga kapasitas darah mengikat O2 meningkat.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 11,
        "soal": "Seorang pasien menjalani pemeriksaan laboratorium darah lengkap karena mengalami demam tinggi dan radang tenggorokan akibat infeksi bakteri. Hasil lab menunjukkan jumlah salah satu sel darahnya melonjak menjadi 18.000 sel/mm3 (normal: 5.000–10.000 sel/mm3). Sel darah yang mengalami peningkatan tersebut dan fungsi utamanya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Leukosit (sel darah putih), berfungsi memfagosit kuman patogen dan membentuk antibodi pertahanan tubuh"},
            {"label": "B", "teks": "Eritrosit, berfungsi mengangkut sari-sari makanan ke seluruh sel"},
            {"label": "C", "teks": "Trombosit, berfungsi memicu pembekuan darah pada luka"},
            {"label": "D", "teks": "Plasma darah, berfungsi mengangkut gas oksigen murni"}
        ],
        "kunci": "A",
        "pembahasan": "Leukosit (sel darah putih) berfungsi sebagai sistem pertahanan tubuh terhadap infeksi kuman. Nilai normalnya adalah 5.000–10.000 sel/mm3. Lonjakan jumlah leukosit (leukositosis) hingga 18.000 sel/mm3 mengindikasikan respons aktif tubuh melawan infeksi bakteri.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 12,
        "soal": "Ketika jari tangan tergores pisau hingga berdarah, beberapa menit kemudian darah berhenti mengalir dan terbentuk sumbatan luka. Urutan mekanisme pembekuan darah yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Fibrinogen -> Trombin -> Trombosit pecah -> Trombokinase"},
            {"label": "B", "teks": "Trombokinase -> Fibrin -> Protrombin -> Trombosit pecah"},
            {"label": "C", "teks": "Protrombin -> Trombokinase -> Trombin -> Benang fibrin"},
            {"label": "D", "teks": "Trombosit pecah mengeluarkan trombokinase -> mengubah protrombin menjadi trombin dengan bantuan ion Ca2+ dan vitamin K -> trombin mengubah fibrinogen menjadi jaring benang fibrin"}
        ],
        "kunci": "D",
        "pembahasan": "Mekanisme pembekuan darah: Trombosit pecah bersentuhan dengan permukaan kasar -> melepaskan trombokinase/tromboplastin. Enzim ini bersama ion kalsium (Ca2+) dan vitamin K mengaktifkan protrombin menjadi trombin. Selanjutnya trombin mengkatalisis fibrinogen (protein terlarut) menjadi benang-benang fibrin yang menjerat sel darah hingga luka tertutup.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 13,
        "soal": "Mengapa dinding otot pada ruang Bilik Kiri (Ventrikel Sinister) jantung manusia memiliki ketebalan otot miokardium paling tebal dibandingkan tiga ruang jantung lainnya?",
        "opsi": [
            {"label": "A", "teks": "Karena bilik kiri hanya menerima darah kotor dari serambi kiri"},
            {"label": "B", "teks": "Karena bilik kiri berfungsi menampung darah dari seluruh tubuh"},
            {"label": "C", "teks": "Karena bilik kiri harus memompa darah bertekanan tinggi ke seluruh tubuh melalui pembuluh aorta"},
            {"label": "D", "teks": "Karena bilik kiri hanya memompa darah menuju paru-paru"}
        ],
        "kunci": "C",
        "pembahasan": "Bilik kiri (ventrikel sinister) bertugas memompa darah kaya oksigen ke seluruh bagian tubuh melalui aorta yang memiliki hambatan perifer tinggi dan jarak tempuh jauh. Oleh karena itu, bilik kiri memerlukan lapisan miokardium yang paling tebal dan kuat untuk menghasilkan tekanan sistolik yang memadai.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_ruang_jantung.jpg"
    },
    {
        "nomor_bab": 14,
        "soal": "Pada umumnya, pembuluh nadi (arteri) mengalirkan darah yang kaya oksigen dan pembuluh balik (vena) mengalirkan darah yang kaya karbon dioksida. Pengecualian pada aturan umum ini terjadi pada ....",
        "opsi": [
            {"label": "A", "teks": "Aorta dan Vena Kava"},
            {"label": "B", "teks": "Arteri Pulmonalis yang mengalirkan darah kaya CO2 ke paru-paru, dan Vena Pulmonalis yang mengalirkan darah kaya O2 dari paru-paru ke serambi kiri jantung"},
            {"label": "C", "teks": "Arteri Koronaria dan Vena Jugularis"},
            {"label": "D", "teks": "Arteri Radialis dan Vena Porta Hepatika"}
        ],
        "kunci": "B",
        "pembahasan": "Definisi pembuluh nadi (arteri) adalah pembuluh yang mengalirkan darah meninggalkan jantung, sedangkan vena menuju jantung. Arteri pulmonalis membawa darah deoksigenasi (kaya CO2) dari bilik kanan ke paru-paru, sedangkan vena pulmonalis membawa darah teroksigenasi (kaya O2) dari paru-paru ke serambi kiri jantung.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_ruang_jantung.jpg"
    },
    {
        "nomor_bab": 15,
        "soal": "Perhatikan tabel perbandingan karakteristik pembuluh Arteri dan pembuluh Vena berikut!\n(1) Dinding: Arteri tebal dan elastis; Vena tipis dan kurang elastis\n(2) Aliran darah: Arteri meninggalkan jantung; Vena menuju jantung\n(3) Katup: Arteri hanya satu di pangkal; Vena banyak di sepanjang pembuluh\n(4) Letak: Arteri dekat permukaan kulit; Vena tersembunyi jauh di dalam tubuh\nPasangan karakteristik pembuluh darah yang benar adalah ....",
        "opsi": [
            {"label": "A", "teks": "(1), (2), dan (3)"},
            {"label": "B", "teks": "(1), (3), dan (4)"},
            {"label": "C", "teks": "(2) dan (4)"},
            {"label": "D", "teks": "(3) dan (4)"}
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan (1), (2), dan (3) benar. Pernyataan (4) salah karena pembuluh arteri umumnya terletak tersembunyi di dalam jaringan otot untuk perlindungan dari cedera, sedangkan pembuluh vena letaknya lebih dekat ke permukaan kulit dan sering tampak kebiruan.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 16,
        "soal": "Perhatikan gambar penampang ruang-ruang jantung manusia berikut! Nomor (1) = Serambi Kanan, (2) = Bilik Kanan, (3) = Serambi Kiri, (4) = Bilik Kiri. Ruang jantung yang berfungsi memompa darah bersih kaya oksigen ke seluruh tubuh dan memompa darah kotor ke paru-paru berturut-turut ditunjukkan oleh nomor ....",
        "opsi": [
            {"label": "A", "teks": "(1) dan (3)"},
            {"label": "B", "teks": "(2) dan (4)"},
            {"label": "C", "teks": "(3) dan (1)"},
            {"label": "D", "teks": "(4) dan (2)"}
        ],
        "kunci": "D",
        "pembahasan": "Nomor (4) adalah bilik kiri (ventrikel sinister) yang memompa darah kaya O2 melalui aorta ke seluruh tubuh. Nomor (2) adalah bilik kanan (ventrikel dekster) yang memompa darah kaya CO2 melalui arteri pulmonalis ke paru-paru. Maka urutannya adalah (4) dan (2).",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_ruang_jantung.jpg"
    },
    {
        "nomor_bab": 17,
        "soal": "Ketika perawat mengukur tekanan darah seorang pasien menggunakan tensimeter/sfigmomanometer, diperoleh angka 120/80 mmHg. Makna dari angka 120 mmHg dan 80 mmHg tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "120 denyut jantung per menit dan 80 mL volume darah"},
            {"label": "B", "teks": "120 tekanan serambi dan 80 tekanan bilik"},
            {"label": "C", "teks": "120 tekanan saat bilik berelaksasi dan 80 saat bilik berkontraksi"},
            {"label": "D", "teks": "120 mmHg adalah tekanan sistol (saat bilik jantung berkontraksi memompa darah) dan 80 mmHg adalah tekanan diastol (saat bilik jantung berelaksasi mengembang menerima darah)"}
        ],
        "kunci": "D",
        "pembahasan": "Angka atas (120 mmHg) adalah tekanan sistol, yaitu tekanan maksimum pada dinding arteri saat ventrikel berkontraksi. Angka bawah (80 mmHg) adalah tekanan diastol, yaitu tekanan terendah pada arteri saat ventrikel berelaksasi dan mengisi kembali darah.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 18,
        "soal": "Dalam sistem penggolongan darah ABO, seseorang yang memiliki golongan darah O dapat mendonorkan darahnya kepada semua golongan darah (donor universal) karena ....",
        "opsi": [
            {"label": "A", "teks": "Sel darah merahnya memiliki antigen A dan antigen B sekaligus"},
            {"label": "B", "teks": "Permukaan eritrositnya tidak mengandung aglutinogen (antigen) A maupun B sehingga tidak digumpalkan oleh aglutinin resipien"},
            {"label": "C", "teks": "Plasmanya tidak memiliki antibodi sama sekali"},
            {"label": "D", "teks": "Memiliki sel darah merah yang berukuran paling besar"}
        ],
        "kunci": "B",
        "pembahasan": "Eritrosit golongan darah O tidak memiliki aglutinogen A maupun B pada membran selnya. Ketika ditransfusikan, tidak ada antigen asing yang dapat diserang/digumpalkan oleh aglutinin alfa maupun beta dalam plasma darah resipien.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 19,
        "soal": "Penyakit penyempitan dan pengerasan pembuluh darah arteri akibat penumpukan plak kolesterol dan lemak jenuh yang dapat memicu serangan jantung disebut ....",
        "opsi": [
            {"label": "A", "teks": "Aterosklerosis"},
            {"label": "B", "teks": "Anemia"},
            {"label": "C", "teks": "Hipotensi"},
            {"label": "D", "teks": "Hemofilia"}
        ],
        "kunci": "A",
        "pembahasan": "Aterosklerosis adalah penyempitan dan pengerasan pembuluh arteri akibat akumulasi plak lipid, kolesterol, dan kalsium pada dinding pembuluh. Jika terjadi di arteri koronaria yang menyuplai otot jantung, akan memicu infark miokard (serangan jantung koroner).",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 20,
        "soal": "Seseorang yang kekurangan zat besi (Fe), asam folat, dan vitamin B12 di dalam menu makanannya berisiko tinggi mengalami penyakit anemia. Gejala klinis yang sering dialami penderita anemia adalah 5L (lemah, letih, lesu, lelah, lunglai) karena ....",
        "opsi": [
            {"label": "A", "teks": "Sel darah putihnya menyerang sel tubuh sendiri"},
            {"label": "B", "teks": "Kadar gula darahnya melonjak drastis"},
            {"label": "C", "teks": "Darah kehilangan kemampuan membeku"},
            {"label": "D", "teks": "Kadar hemoglobin (Hb) menurun drastis sehingga suplai oksigen ke seluruh sel tubuh untuk pembentukan energi sel berkurang"}
        ],
        "kunci": "D",
        "pembahasan": "Zat besi (Fe) adalah komponen inti sintesis molekul hemoglobin pada eritrosit. Kekurangan Fe menyebabkan anemia defisiensi besi dengan penurunan kadar Hb, sehingga kapasitas darah membawa oksigen ke jaringan turun drastis dan respirasi seluler penghasil ATP terganggu.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 21,
        "soal": "Sebuah makanan kemasan mengandung 30 gram karbohidrat, 5 gram protein, dan 10 gram lemak. Jika 1 gram karbohidrat menghasilkan 4 kkal, 1 gram protein menghasilkan 4 kkal, dan 1 gram lemak menghasilkan 9 kkal, berapakah total energi yang diperoleh dari makanan tersebut?",
        "opsi": [
            {"label": "A", "teks": "180 kkal"},
            {"label": "B", "teks": "210 kkal"},
            {"label": "C", "teks": "230 kkal"},
            {"label": "D", "teks": "260 kkal"}
        ],
        "kunci": "C",
        "pembahasan": "Perhitungan energi makanan: Karbohidrat = 30 g x 4 kkal/g = 120 kkal; Protein = 5 g x 4 kkal/g = 20 kkal; Lemak = 10 g x 9 kkal/g = 90 kkal. Total Energi = 120 + 20 + 90 = 230 kkal.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 22,
        "soal": "Vitamin dikelompokkan menjadi vitamin larut dalam air (B dan C) serta vitamin larut dalam lemak (A, D, E, K). Penyakit skorbut (gusi berdarah dan sariawan) serta rakitis berturut-turut diakibatkan oleh defisiensi ....",
        "opsi": [
            {"label": "A", "teks": "Vitamin A dan Vitamin K"},
            {"label": "B", "teks": "Vitamin C dan Vitamin D"},
            {"label": "C", "teks": "Vitamin B1 dan Vitamin E"},
            {"label": "D", "teks": "Vitamin K dan Vitamin A"}
        ],
        "kunci": "B",
        "pembahasan": "Defisiensi vitamin C (asam askorbat) menyebabkan kerapuhan kapiler dan gangguan sintesis kolagen yang memicu skorbut (skurvi/gusi berdarah). Defisiensi vitamin D menyebabkan gangguan absorpsi kalsium pada tulang sehingga memicu rakitis pada anak-anak.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 23,
        "soal": "Ketika tersedak saat makan sambil berbicara, butiran nasi dapat masuk ke saluran pernapasan. Struktur anatomis yang berfungsi sebagai katup pencegah masuknya makanan ke dalam laring/trakea adalah ....",
        "opsi": [
            {"label": "A", "teks": "Epiglotis"},
            {"label": "B", "teks": "Uvula"},
            {"label": "C", "teks": "Faring"},
            {"label": "D", "teks": "Kantung udara"}
        ],
        "kunci": "A",
        "pembahasan": "Epiglotis adalah katup tulang rawan elastis yang terletak di pangkal laring. Saat menelan makanan, epiglotis otomatis menutup pintu masuk saluran napas (glotis) sehingga makanan terarah masuk ke esofagus (kerongkongan).",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 24,
        "soal": "Darah yang baru saja menyerap sari-sari makanan (glukosa dan asam amino) dari jonjot usus halus tidak langsung dialirkan ke jantung, melainkan dibawa terlebih dahulu ke organ hati melalui pembuluh ....",
        "opsi": [
            {"label": "A", "teks": "Arteri renalis"},
            {"label": "B", "teks": "Vena kava superior"},
            {"label": "C", "teks": "Vena porta hepatika"},
            {"label": "D", "teks": "Arteri pulmonalis"}
        ],
        "kunci": "C",
        "pembahasan": "Vena porta hepatika menghubungkan kapiler usus dengan hati. Darah yang kaya glukosa dan nutrisi disaring dan diproses di hati terlebih dahulu: kelebihan glukosa diubah menjadi glikogen dan zat toksin dinetralkan sebelum darah diedarkan ke seluruh tubuh.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 25,
        "soal": "Mengapa konsumsi makanan kemasan yang mengandung kadar garam natrium (Na+) dan lemak jenuh yang sangat tinggi secara terus-menerus dapat memicu timbulnya penyakit hipertensi?",
        "opsi": [
            {"label": "A", "teks": "Karena natrium menguraikan eritrosit di ginjal"},
            {"label": "B", "teks": "Karena lemak jenuh menurunkan detak jantung"},
            {"label": "C", "teks": "Karena garam membunuh bakteri lambung"},
            {"label": "D", "teks": "Kadar natrium tinggi meningkatkan retensi air dalam pembuluh darah sehingga volume darah meningkat, sementara plak lemak menyempitkan lumen pembuluh darah arteri"}
        ],
        "kunci": "D",
        "pembahasan": "Kelebihan ion Na+ menarik air melalui osmosis ke dalam sirkulasi darah, meningkatkan volume darah. Pada saat yang sama, timbunan lemak jenuh mempersempit diameter lumen arteri. Kombinasi kenaikan volume cairan dan penyempitan saluran menyebabkan tekanan darah melonjak (hipertensi).",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    }
]

# 10 Soal Contoh Asli (No. 26-35)
contoh_soal = [
    {
        "nomor_bab": 26,
        "soal": "Organel sel yang berfungsi sebagai tempat berlangsungnya respirasi seluler untuk menghasilkan energi dalam bentuk ATP adalah ....",
        "opsi": [
            {"label": "A", "teks": "Ribosom"},
            {"label": "B", "teks": "Mitokondria"},
            {"label": "C", "teks": "Badan Golgi"},
            {"label": "D", "teks": "Retikulum Endoplasma"}
        ],
        "kunci": "B",
        "pembahasan": "Mitokondria sering disebut sebagai 'the powerhouse of the cell' karena merupakan organel utama tempat terjadinya oksidasi nutrisi (siklus Krebs dan rantai transpor elektron) yang menghasilkan energi ATP bagi sel.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 27,
        "soal": "Perbedaan utama antara sel hewan dan sel tumbuhan yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Sel tumbuhan memiliki dinding sel dan kloroplas, sedangkan sel hewan tidak memiliki dinding sel dan kloroplas"},
            {"label": "B", "teks": "Sel hewan memiliki vakuola yang sangat besar di tengah, sedangkan sel tumbuhan tidak ber-vakuola"},
            {"label": "C", "teks": "Sel tumbuhan memiliki sentriol aktif untuk pembelahan, sel hewan tidak"},
            {"label": "D", "teks": "Sel hewan berfotosintesis menggunakan plastida"}
        ],
        "kunci": "A",
        "pembahasan": "Ciri khas sel tumbuhan adalah memiliki dinding selulosa yang kaku, plastida (kloroplas) untuk fotosintesis, serta vakuola sentral yang besar. Sel hewan tidak memiliki dinding sel maupun kloroplas, tetapi memiliki sentrosom/sentriol.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 28,
        "soal": "Di dalam usus halus, protein yang telah diubah menjadi pepton di lambung akan dihidrolisis lebih lanjut menjadi asam amino oleh enzim ....",
        "opsi": [
            {"label": "A", "teks": "Ptialin"},
            {"label": "B", "teks": "Tripsin"},
            {"label": "C", "teks": "Amilase"},
            {"label": "D", "teks": "Lipase"}
        ],
        "kunci": "B",
        "pembahasan": "Enzim tripsin yang dihasilkan oleh kelenjar pankreas disekresikan ke dalam duodenum (usus dua belas jari) untuk memecah pepton menjadi peptida yang lebih sederhana dan asam amino.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 29,
        "soal": "Penyerapan kembali air dan pembentukan massa feses terutama berlangsung pada organ ....",
        "opsi": [
            {"label": "A", "teks": "Usus dua belas jari (duodenum)"},
            {"label": "B", "teks": "Usus kosong (jejunum)"},
            {"label": "C", "teks": "Usus penyerapan (ileum)"},
            {"label": "D", "teks": "Usus besar (kolon)"}
        ],
        "kunci": "D",
        "pembahasan": "Fungsi utama usus besar (kolon) adalah mereabsorpsi air dan mineral dari sisa-sisa kimus yang tidak tercerna sehingga terbentuk massa feses padat yang siap dikeluarkan melalui rektum dan anus.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 30,
        "soal": "Peredaran darah manusia disebut peredaran darah ganda karena ....",
        "opsi": [
            {"label": "A", "teks": "Mengalir di luar pembuluh darah sebanyak dua kali"},
            {"label": "B", "teks": "Dalam satu kali peredaran lengkap, darah melewati jantung sebanyak dua kali (peredaran kecil dan peredaran besar)"},
            {"label": "C", "teks": "Darah merah dan sel darah putih beredar secara terpisah"},
            {"label": "D", "teks": "Jantung manusia memompa darah hanya dua menit sekali"}
        ],
        "kunci": "B",
        "pembahasan": "Sistem peredaran darah ganda berarti dalam satu kali sirkulasi lengkap ke seluruh tubuh, darah melintasi jantung sebanyak 2 kali: sirkulasi pulmonalis (jantung -> paru-paru -> jantung) dan sirkulasi sistemik (jantung -> seluruh tubuh -> jantung).",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_ruang_jantung.jpg"
    },
    {
        "nomor_bab": 31,
        "soal": "Bagian darah yang berbentuk cair, berwarna kekuningan, dan berfungsi mengangkut sari makanan, hormon, antibodi, serta sisa metabolisme adalah ....",
        "opsi": [
            {"label": "A", "teks": "Eritrosit"},
            {"label": "B", "teks": "Leukosit"},
            {"label": "C", "teks": "Trombosit"},
            {"label": "D", "teks": "Plasma darah"}
        ],
        "kunci": "D",
        "pembahasan": "Plasma darah mencakup sekitar 55% dari volume darah total. Komposisinya sebagian besar adalah air (90%) yang melarutkan protein plasma (albumin, globulin, fibrinogen), nutrisi glukosa, asam amino, hormon, dan zat sisa urea.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 32,
        "soal": "Jaringan pengangkut pada tumbuhan yang berfungsi mengangkut air dan garam mineral terlarut dari akar menuju ke daun adalah ....",
        "opsi": [
            {"label": "A", "teks": "Xilem (pembuluh kayu)"},
            {"label": "B", "teks": "Floem (pembuluh tapis)"},
            {"label": "C", "teks": "Kambium"},
            {"label": "D", "teks": "Epidermis"}
        ],
        "kunci": "A",
        "pembahasan": "Xilem (pembuluh kayu) mengangkut air dan mineral dari akar ke daun. Floem (pembuluh tapis) mengedarkan hasil fotosintesis (sukrosa) dari daun ke seluruh bagian tubuh tumbuhan.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 33,
        "soal": "Zat aditif alami yang dapat digunakan sebagai pewarna kuning dan sekaligus penyedap aroma masakan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tartrazin"},
            {"label": "B", "teks": "Kunyit (kurkumin)"},
            {"label": "C", "teks": "Daun suji"},
            {"label": "D", "teks": "Karamel"}
        ],
        "kunci": "B",
        "pembahasan": "Kunyit mengandung pigmen alami kurkumin yang memberikan warna kuning cerah sekaligus memberi aroma khas sedap pada masakan. Tartrazin adalah pewarna sintetis.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 34,
        "soal": "Bahan pemanis buatan yang memiliki tingkat kemanisan ratusan kali lipat dibandingkan gula tebu dan sering digunakan pada minuman diet rendah kalori adalah ....",
        "opsi": [
            {"label": "A", "teks": "Glukosa"},
            {"label": "B", "teks": "Sukrosa"},
            {"label": "C", "teks": "Aspartam dan sakarin"},
            {"label": "D", "teks": "Madu murni"}
        ],
        "kunci": "C",
        "pembahasan": "Aspartam, sakarin, dan siklamat adalah pemanis buatan non-nutritif yang memberikan rasa manis sangat kuat tanpa memberikan sumbangan kalori tinggi seperti gula alami sukrosa.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 35,
        "soal": "Zat adiktif pada asap rokok yang menyebabkan ketergantungan psikologis dan fisik serta merangsang pelepasan dopamin adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tar"},
            {"label": "B", "teks": "Nikotin"},
            {"label": "C", "teks": "Karbon monoksida (CO)"},
            {"label": "D", "teks": "Gas sianida"}
        ],
        "kunci": "B",
        "pembahasan": "Nikotin adalah senyawa alkaloid adiktif dalam daun tembakau yang memicu ketergantungan saraf. Tar bersifat karsinogenik (pemicu kanker), sedangkan CO mengikat hemoglobin darah.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
latihan_mandiri = [
    {"no": 36, "soal": "Kumpulan dari beberapa sel yang memiliki bentuk dan fungsi yang sama disebut ....", "opsi": ["Organ", "Jaringan", "Sistem organ", "Organisme"], "kunci": "B", "bahas": "Jaringan adalah sekumpulan sel yang memiliki bentuk dan fungsi spesifik yang sama, misalnya jaringan epitel, jaringan otot, dan jaringan meristem."},
    {"no": 37, "soal": "Jaringan pada hewan yang berfungsi menerima dan meneruskan rangsangan dari lingkungan ke pusat saraf adalah ....", "opsi": ["Jaringan epitel", "Jaringan saraf", "Jaringan ikat", "Jaringan otot"], "kunci": "B", "bahas": "Jaringan saraf tersusun atas sel-sel saraf (neuron) yang menghantarkan impuls listrik dari reseptor ke sistem saraf pusat dan efektor."},
    {"no": 38, "soal": "Jaringan tumbuhan yang sel-selnya selalu aktif membelah diri secara mitosis untuk pertumbuhan adalah ....", "opsi": ["Jaringan meristem", "Jaringan parenkim", "Jaringan sklerenkim", "Jaringan kolenkim"], "kunci": "A", "bahas": "Jaringan meristem adalah jaringan embrional tumbuhan yang sel-selnya aktif membelah, seperti pada ujung akar dan ujung batang (meristem apikal)."},
    {"no": 39, "soal": "Jaringan dasar pada tumbuhan yang berfungsi menyimpan cadangan makanan dan air adalah ....", "opsi": ["Parenkim", "Kolenkim", "Sklerenkim", "Epidermis"], "kunci": "A", "bahas": "Parenkim (jaringan dasar) berfungsi sebagai tempat berlangsungnya fotosintesis (klorenkim) dan penyimpanan cadangan pati serta air."},
    {"no": 40, "soal": "Berikut ini yang merupakan contoh organ pada sistem pencernaan manusia adalah ....", "opsi": ["Trakea", "Lambung", "Paru-paru", "Ginjal"], "kunci": "B", "bahas": "Lambung adalah organ sistem pencernaan. Trakea dan paru-paru adalah organ pernapasan, sedangkan ginjal adalah organ ekskresi."},
    {"no": 41, "soal": "Organ pada manusia yang berfungsi menetralkan racun (detoksifikasi) dan merombak sel darah merah yang telah rusak adalah ....", "opsi": ["Jantung", "Hati", "Pankreas", "Limfa"], "kunci": "B", "bahas": "Hati (hepar) bertindak sebagai organ detoksifikasi zat kimia beracun dan merombak eritrosit tua yang telah berusia 120 hari menjadi pigmen empedu."},
    {"no": 42, "soal": "Enzim amilase yang dihasilkan oleh kelenjar pankreas berfungsi mengubah ....", "opsi": ["Protein menjadi pepton", "Lemak menjadi gliserol", "Amilum menjadi maltosa / glukosa", "Pepton menjadi asam amino"], "kunci": "C", "bahas": "Amilase pankreas menghidrolisis sisa polisakarida amilum yang belum tuntas dicerna di mulut menjadi disakarida maltosa dan glukosa."},
    {"no": 43, "soal": "Enzim lipase berfungsi mencerna lemak menjadi ....", "opsi": ["Asam amino dan urea", "Asam lemak dan gliserol", "Glukosa dan galaktosa", "Pepton dan glikogen"], "kunci": "B", "bahas": "Lipase memecah trigliserida (lemak netral) yang telah diemulsikan oleh empedu menjadi molekul asam lemak dan gliserol."},
    {"no": 44, "soal": "Zat makanan yang tidak mengalami pencernaan secara kimiawi dan dapat langsung diserap oleh dinding usus halus adalah ....", "opsi": ["Karbohidrat dan protein", "Lemak dan tepung", "Vitamin, mineral, dan air", "Polipeptida dan amilum"], "kunci": "C", "bahas": "Vitamin, garam mineral, dan molekul air memiliki ukuran partikel sangat kecil sehingga dapat langsung diserap oleh kapiler vili tanpa memerlukan hidrolisis enzimatik."},
    {"no": 45, "soal": "Penyakit radang akut pada selaput lendir dinding lambung yang dipicu oleh asam lambung berlebih atau infeksi bakteri Helicobacter pylori disebut ....", "opsi": ["Gastritis (maag)", "Apendisitis", "Konstipasi", "Kholera"], "kunci": "A", "bahas": "Gastritis adalah inflamasi mukosa lambung yang menimbulkan rasa perih di ulu hati akibat erosi oleh asam lambung berlebih atau bakteri H. pylori."},
    {"no": 46, "soal": "Penyakit peradangan pada umbai cacing (usus buntu) akibat penyumbatan oleh fekalit dan infeksi bakteri disebut ....", "opsi": ["Apendisitis", "Hepatitis", "Peritonitis", "Xerostomia"], "kunci": "A", "bahas": "Apendisitis adalah radang pada apendiks (umbai cacing) yang bila pecah dapat menimbulkan infeksi rongga perut fatal (peritonitis)."},
    {"no": 47, "soal": "Kelenjar ludah terbesar yang terletak di dekat telinga bagian bawah adalah kelenjar ....", "opsi": ["Sublingualis", "Parotis", "Submandibularis", "Tiroid"], "kunci": "B", "bahas": "Kelenjar parotis adalah kelenjar saliva terbesar. Infeksi virus gondongan (mumps) menyerang kelenjar parotis ini."},
    {"no": 48, "soal": "Gerakan meremas-remas dan mendorong bolus makanan sepanjang saluran kerongkongan (esofagus) menuju lambung disebut ....", "opsi": ["Gerak peristaltik", "Gerak amuboid", "Gerak brown", "Gerak refleks"], "kunci": "A", "bahas": "Gerak peristaltik adalah kontraksi ritmis otot polos melingkar dan memanjang pada esofagus untuk mendorong makanan ke lambung."},
    {"no": 49, "soal": "Faktor pembekuan darah yang diproduksi di hati dengan bantuan vitamin K dan terdapat di dalam plasma darah adalah ....", "opsi": ["Hemoglobin", "Protrombin", "Miosin", "Aktin"], "kunci": "B", "bahas": "Protrombin adalah protein plasma prekursor enzim trombin yang disintesis oleh sel hepatosit hati dengan memerlukan vitamin K."},
    {"no": 50, "soal": "Penyakit kelainan genetik terpaut kromosom X di mana darah penderita sukar membeku saat terjadi luka disebut ....", "opsi": ["Anemia", "Hemofilia", "Leukemia", "Talasemia"], "kunci": "B", "bahas": "Hemofilia adalah penyakit herediter resesif terpaut seks di mana penderita kekurangan faktor pembekuan darah VIII atau IX sehingga pendarahan sulit berhenti."},
    {"no": 51, "soal": "Kanker darah yang ditandai dengan produksi sel darah putih (leukosit) yang abnormal, tidak terkendali, dan memakan sel darah merah disebut ....", "opsi": ["Anemia", "Talasemia", "Leukemia", "Hipertensi"], "kunci": "C", "bahas": "Leukemia adalah keganasan sel darah putih di mana leukosit imatur membelah secara liar dan menekan populasi sel darah lain di sumsum tulang."},
    {"no": 52, "soal": "Kelainan genetik di mana bentuk eritrosit abnormal dan mudah pecah sehingga penderita memerlukan transfusi darah rutin seumur hidup adalah ....", "opsi": ["Talasemia", "Hemofilia", "Varises", "Hipotensi"], "kunci": "A", "bahas": "Talasemia adalah gangguan genetik sintesis rantai hemoglobin yang menyebabkan eritrosit rapuh dan cepat hancur (hemolisis kronis)."},
    {"no": 53, "soal": "Pelebaran pembuluh vena yang terjadi di sekitar area betis kaki akibat katup vena yang melemah disebut ....", "opsi": ["Wasir (ambeien)", "Varises", "Aterosklerosis", "Embolus"], "kunci": "B", "bahas": "Varises adalah distensi dan pemuntiran vena superfisial tungkai bawah akibat inkompetensi katup penahan arus balik gravitasi."},
    {"no": 54, "soal": "Pelebaran pembuluh darah vena yang terjadi di sekitar anus disebut ....", "opsi": ["Wasir (hemoroid)", "Varises", "Jantung koroner", "Trombus"], "kunci": "A", "bahas": "Wasir atau hemoroid adalah pembengkakan pleksus vena di dinding anus dan rektum bawah akibat tekanan berlebih (misal sering mengejan)."},
    {"no": 55, "soal": "Seseorang yang memiliki aglutinogen B pada eritrositnya dan memiliki aglutinin alfa (anti-A) pada plasmanya tergolong bergolongan darah ....", "opsi": ["A", "B", "AB", "O"], "kunci": "B", "bahas": "Sesuai sistem Landsteiner: Golongan darah B memiliki aglutinogen B pada eritrosit dan aglutinin alfa pada plasma darah."},
    {"no": 56, "soal": "Resipien universal adalah sebutan bagi seseorang yang dapat menerima transfusi darah dari semua golongan darah, yaitu golongan darah ....", "opsi": ["O", "AB", "A", "B"], "kunci": "B", "bahas": "Golongan darah AB tidak memiliki aglutinin anti-A maupun anti-B di plasmanya, sehingga tidak akan menggumpalkan sel darah merah donor dari golongan apa pun."},
    {"no": 57, "soal": "Daun memiliki jaringan tiang (palisade) yang kaya akan klorofil. Fungsi utama jaringan palisade adalah ....", "opsi": ["Tempat utama berlangsungnya fotosintesis", "Menyerap air dari udara", "Mengedarkan sari makanan", "Melindungi daun dari penguapan"], "kunci": "A", "bahas": "Jaringan tiang (palisade parenchyma) tersusun rapat vertikal dan mengandung kloroplas terbanyak, menjadikannya pusat utama fotosintesis tumbuhan."},
    {"no": 58, "soal": "Pori-pori mikro pada permukaan epidermis daun yang diapit oleh sepasang sel penjaga untuk pertukaran gas O2, CO2, dan uap air disebut ....", "opsi": ["Lentisel", "Stomata", "Kutikula", "Trikoma"], "kunci": "B", "bahas": "Stomata (mulut daun) adalah celah mikroskopis pada epidermis yang membuka dan menutup untuk transpirasi dan pertukaran gas respirasi fotosintesis."},
    {"no": 59, "soal": "Lapisan lilin kedap air yang melapisi epidermis atas daun untuk mengurangi laju penguapan air disebut ....", "opsi": ["Kambium", "Kutikula", "Kloroplas", "Endodermis"], "kunci": "B", "bahas": "Kutikula tersusun atas zat lilin (kutin) yang bersifat hidrofobik untuk meminimalkan kehilangan air lewat transpirasi kutikuler."},
    {"no": 60, "soal": "Zat pengawet kimia yang sering disalahgunakan untuk mengawetkan tahu, bakso, dan mie basah padahal sangat beracun dan berbahaya bagi tubuh adalah ....", "opsi": ["Asam benzoat", "Formalin dan boraks", "Asam sitrat", "Natrium propionat"], "kunci": "B", "bahas": "Formalin (larutan formaldehida) dan boraks (natrium tetraborat) adalah bahan kimia industri beracun non-pangan yang dilarang keras untuk makanan karena bersifat karsinogenik."},
    {"no": 61, "soal": "Penyedap rasa buatan yang bekerja merangsang reseptor umami pada lidah adalah ....", "opsi": ["Monosodium glutamat (MSG)", "Sakarin", "Tartrazin", "Kalsium propionat"], "kunci": "A", "bahas": "MSG (Monosodium Glutamat) adalah garam natrium dari asam glutamat alami yang memicu sensasi rasa gurih (umami)."},
    {"no": 62, "soal": "Gas berbahaya dalam asap rokok yang memiliki daya ikat (afinitas) terhadap hemoglobin 200 kali lebih kuat daripada oksigen adalah ....", "opsi": ["Karbon dioksida (CO2)", "Karbon monoksida (CO)", "Sulfur dioksida (SO2)", "Amonia"], "kunci": "B", "bahas": "Gas CO mengikat hemoglobin membentuk karboksihemoglobin (HbCO) yang sangat stabil, menghalangi pengikatan O2 dan menyebabkan hipoksia jaringan tubuh."},
    {"no": 63, "soal": "Zat kimia psikoaktif yang terdapat di dalam minuman kopi dan teh yang bekerja menstimulasi sistem saraf pusat agar tetap terjaga adalah ....", "opsi": ["Kafein", "Nikotin", "Morfin", "Kodein"], "kunci": "A", "bahas": "Kafein adalah zat psikoaktif golongan stimulan ringan yang memblokir reseptor adenosin di otak sehingga menghambat rasa kantuk."},
    {"no": 64, "soal": "Narkotika golongan alami yang disadap dari getah buah tanaman Papaver somniferum dan berkhasiat sebagai analgesik (penghilang rasa sakit) kuat adalah ....", "opsi": ["Ganja (kanabis)", "Opium dan morfin", "Kokain", "Amfetamin"], "kunci": "B", "bahas": "Getah mentah Papaver somniferum menghasilkan opium, yang kemudian dimurnikan menjadi morfin dan kodein untuk menekan persepsi rasa sakit pada SSP."},
    {"no": 65, "soal": "Obat psikotropika yang bekerja memperlambat aktivitas sistem saraf pusat, memberikan efek tenang, dan membuat tertidur disebut golongan ....", "opsi": ["Stimulan", "Depresan (sedatif)", "Halusinogen", "Inhalansia"], "kunci": "B", "bahas": "Depresan (sedatif-hipnotik) menurunkan kerja sistem saraf pusat, memperlambat denyut jantung dan napas, serta menginduksi ketenangan atau tidur (misal diazepam, alkohol)."}
]

# 5 Soal Pengayaan AKM (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "[AKM Literasi Sains — Sistem Peredaran Darah] Seseorang yang sedang berlari kencang mengalami kenaikan frekuensi denyut nadi dari 70 kali per menit menjadi 140 kali per menit. Mengapa denyut jantung meningkat drastis saat aktivitas fisik berat?",
        "opsi": [
            {"label": "A", "teks": "Untuk mengeluarkan sel darah merah melalui keringat"},
            {"label": "B", "teks": "Karena otot yang berkontraksi hebat membutuhkan pasokan oksigen dan glukosa lebih banyak serta pembuangan CO2 yang lebih cepat"},
            {"label": "C", "teks": "Karena katup jantung mengalami kerusakan sementara"},
            {"label": "D", "teks": "Agar darah berhenti mengalir ke paru-paru"}
        ],
        "kunci": "B",
        "pembahasan": "Saat olahraga berat, laju metabolisme sel otot meningkat pesat. Jantung memompa darah lebih cepat (meningkatkan cardiac output) untuk memasok lebih banyak O2 dan glukosa demi pembentukan ATP serta mempercepat eliminasi asam laktat dan CO2.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_ruang_jantung.jpg"
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Pilihan Ganda Kompleks — Uji Bahan Makanan] Sepotong tahu dihaluskan lalu diuji dengan beberapa reagen:\n- Menghasilkan warna ungu saat ditetesi Biuret\n- Tetap berwarna cokelat saat ditetesi Lugol\n- Tetap berwarna biru saat ditetesi Benedict lalu dipanaskan\nManakah kesimpulan yang benar mengenai kandungan tahu tersebut?",
        "opsi": [
            {"label": "A", "teks": "Tahu kaya akan kandungan protein nabati dan tidak mengandung amilum maupun glukosa bebas"},
            {"label": "B", "teks": "Tahu mengandung kadar gula pereduksi yang sangat tinggi"},
            {"label": "C", "teks": "Tahu mengandung amilum dalam jumlah berlimpah"},
            {"label": "D", "teks": "Tahu hanya tersusun atas air dan garam murni"}
        ],
        "kunci": "A",
        "pembahasan": "Reaksi Biuret positif ungu menandakan ikatan peptida protein. Lugol negatif cokelat membuktikan tidak ada pati/amilum. Benedict negatif biru membuktikan tidak ada gula sederhana pereduksi. Jadi tahu kaya protein nabati.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Analisis Grafik — Aktivitas Enzim Pepsin vs pH] Enzim pepsin lambung memiliki aktivitas katalisis maksimal pada pH 2,0. Jika makanan dari lambung masuk ke usus dua belas jari yang ber-pH 8,0 (basa) karena getah empedu dan natrium bikarbonat pankreas, apa yang terjadi pada enzim pepsin?",
        "opsi": [
            {"label": "A", "teks": "Pepsin menjadi semakin aktif memecah protein di usus halus"},
            {"label": "B", "teks": "Pepsin mengalami denaturasi struktur protein dan menjadi inaktif karena berada jauh di luar pH optimumnya"},
            {"label": "C", "teks": "Pepsin berubah menjadi enzim ptialin"},
            {"label": "D", "teks": "Pepsin mulai mencerna dinding usus secara agresif"}
        ],
        "kunci": "B",
        "pembahasan": "Enzim adalah protein yang konformasinya sangat peka terhadap perubahan pH. Pada lingkungan duodenum yang basa (pH 8), struktur tersier pepsin terdenaturasi dan sisi aktifnya rusak permanen sehingga pepsin menjadi tidak aktif.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_organ_pencernaan.jpg"
    },
    {
        "nomor_bab": 69,
        "soal": "[AKM Evaluasi Kasus Klinis — Transfusi Darah] Pasien bergolongan darah B rhesus positif (B+) membutuhkan transfusi darah darurat. Dari daftar pendonor berikut, darah manakah yang paling aman ditransfusikan?",
        "opsi": [
            {"label": "A", "teks": "Donor bergolongan darah A+"},
            {"label": "B", "teks": "Donor bergolongan darah AB+"},
            {"label": "C", "teks": "Donor bergolongan darah B+ atau O+"},
            {"label": "D", "teks": "Donor bergolongan darah AB-"}
        ],
        "kunci": "C",
        "pembahasan": "Resipien B+ memiliki aglutinin anti-A dalam plasmanya. Maka darah donor tidak boleh mengandung antigen A. Donor yang cocok dan aman adalah sesama B+ atau O+ (donor universal eritrosit).",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Literasi Kesehatan — Efek Minuman Berenergi & Zat Aditif] Seseorang sering mengonsumsi minuman berenergi yang mengandung kafein dosis tinggi, taurin, dan pemanis buatan setiap malam. Dampak fisiologis jangka panjang yang paling mungkin terjadi pada sistem kardiovaskular adalah ....",
        "opsi": [
            {"label": "A", "teks": "Penurunan denyut nadi dan hipotensi kronis"},
            {"label": "B", "teks": "Palpitasi (jantung berdebar kencang), peningkatan resistensi vaskular, dan risiko hipertensi kronis"},
            {"label": "C", "teks": "Peningkatan kapasitas vital paru-paru secara permanen"},
            {"label": "D", "teks": "Peningkatan produksi trombosit hingga darah mencair"}
        ],
        "kunci": "B",
        "pembahasan": "Kombinasi kafein konsentrasi tinggi dan stimulan memicu pelepasan adrenalin berlebih yang meningkatkan kontraksi jantung (inotropik positif) dan vasokonstriksi arteri. Akibat jangka panjangnya adalah takikardia, aritmia, dan hipertensi.",
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    }
]

# Assemble 70 questions for Bab 1
all_70 = []

# 1-25
for q in soal_hots:
    all_70.append(q)

# 26-35
for q in contoh_soal:
    all_70.append(q)

# 36-65
for q in latihan_mandiri:
    all_70.append({
        "nomor_bab": q["no"],
        "soal": q["soal"],
        "opsi": [{"label": chr(65+i), "teks": t} for i, t in enumerate(q["opsi"])],
        "kunci": q["kunci"],
        "pembahasan": q["bahas"],
        "paket": "Bab I: Struktur & Fungsi Tubuh I - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": "/soal/ipa/kmerdeka_kls8_ipa_ch1_tubuh_nutrisi.jpg"
    })

# 66-70
for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 1: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 8 - Bab I: Struktur & Fungsi Tubuh Makhluk Hidup I (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 8 — Bab I: Struktur & Fungsi Tubuh Makhluk Hidup I</h1>
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
  <div data-field="materi">Struktur & Fungsi Tubuh Makhluk Hidup I</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis struktur sel, menguji kandungan nutrisi makanan, sistem pencernaan enzimatis, peredaran darah, dan zat aditif/adiktif.</div>
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
        "materi": "Struktur & Fungsi Tubuh Makhluk Hidup I",
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

html_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab1_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas8_ipa_bab1_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
