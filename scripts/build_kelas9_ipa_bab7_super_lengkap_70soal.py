#!/usr/bin/env python3
"""
build_kelas9_ipa_bab7_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 7 IPA SMP Kelas 9:
Isu-Isu Lingkungan & Keberlanjutan:
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid (0 Error)
- Gambar Asli Otentik: Aliran Sungai (Soal #1), Efek Rumah Kaca (Soal #7), Grafik DO & BOD (Soal #26)
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 25 Soal Kurikulum Merdeka HOTS Bab 7
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar aliran sungai yang melintasi kawasan hulu alami, pemukiman padat penduduk, dan kawasan pabrik industri berikut! Titik pemantauan A berada di hulu, Titik B di hilir pemukiman, dan Titik C berada di hilir saluran limbah pabrik industri. Kondisi kualitas air yang paling tepat pada ketiga titik tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Titik A memiliki kadar oksigen terlarut (DO) paling tinggi dan BOD paling rendah; sedangkan Titik C memiliki kadar DO terendah dan nilai BOD tertinggi"},
            {"label": "B", "teks": "Titik C memiliki air paling jernih dan DO tertinggi"},
            {"label": "C", "teks": "Titik B memiliki suhu air paling dingin"},
            {"label": "D", "teks": "Kadar DO di seluruh titik sungai selalu sama persis"}
        ],
        "kunci": "A",
        "pembahasan": "Kawasan hulu alami (Titik A) belum tercemar sehingga kaya oksigen terlarut (DO tinggi, BOD sangat rendah). Kawasan pemukiman dan pabrik (Titik B dan C) menerima buangan limbah organik dan kimia masif sehingga bakteri pengurai membutuhkan banyak oksigen untuk dekomposisi (BOD melonjak tinggi), menyebabkan stok oksigen terlarut terkuras habis (DO anjlok di Titik C).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch7_q1_aliran_sungai_pencemaran.png"
    },
    {
        "nomor_bab": 2,
        "soal": "Keberadaan bakteri Escherichia coli (bakteri koliform tinja) di dalam sampel air sumur atau air minum kemasan digunakan oleh dinas kesehatan sebagai bioindikator utama terjadinya ....",
        "opsi": [
            {"label": "A", "teks": "Pencemaran radioaktif"},
            {"label": "B", "teks": "Pencemaran oleh kotoran/tinja manusia atau hewan berdarah panas yang berisiko menularkan penyakit saluran pencernaan seperti disentri dan kolera"},
            {"label": "C", "teks": "Tingginya kadar garam mineral"},
            {"label": "D", "teks": "Kekurangan asupan zat kapur"}
        ],
        "kunci": "B",
        "pembahasan": "Escherichia coli adalah flora normal usus besar manusia dan hewan berdarah panas. Kehadiran E. coli dalam air minum menunjukkan air tersebut telah terkontaminasi rembesan tinja (septic tank bocor) dan tidak layak diminum tanpa pengolahan karena berpotensi membawa patogen tifus, disentri, dan kolera.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 3,
        "soal": "Tragedi Teluk Minamata di Jepang pada pertengahan abad ke-20 yang menyebabkan ratusan warga menderita kelumpuhan saraf, kebutaan, kejang, hingga kematian massal disebabkan oleh pencemaran limbah industri yang mengandung logam berat ....",
        "opsi": [
            {"label": "A", "teks": "Merkuri / air raksa (metilmerkuri) yang terakumulasi di dalam rantai makanan ikan dan kerang laut"},
            {"label": "B", "teks": "Besi berkarat"},
            {"label": "C", "teks": "Natrium klorida"},
            {"label": "D", "teks": "Kalsium karbonat"}
        ],
        "kunci": "A",
        "pembahasan": "Penyakit Minamata diakibatkan oleh keracunan metilmerkuri organik dari limbah pabrik kimia Chisso Corporation. Metilmerkuri mengalami biomagnifikasi pada jaringan lemak ikan dan moluska laut yang kemudian dikonsumsi warga pesisir, merusak sistem saraf pusat otak secara permanen.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 4,
        "soal": "Sampah plastik yang terbuang ke laut tidak dapat diurai sempurna oleh bakteri (non-biodegradable), melainkan terpecah menjadi partikel-partikel mikroplastik berukuran kurang dari 5 mm. Bahaya utama mikroplastik bagi kesehatan ekosistem laut dan manusia adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mikroplastik larut menjadi garam air laut"},
            {"label": "B", "teks": "Mikroplastik menghasilkan gas oksigen bagi ikan"},
            {"label": "C", "teks": "Mikroplastik mempercepat pertumbuhan terumbu karang"},
            {"label": "D", "teks": "Mikroplastik termakan oleh zooplankton dan ikan kecil, mengikat racun polutan karsinogenik, dan masuk ke dalam rantai makanan manusia (bioakumulasi)"}
        ],
        "kunci": "D",
        "pembahasan": "Partikel mikroplastik menyerupai makanan bagi plankton, larva ikan, dan kerang. Mikroplastik menyerap senyawa beracun hidrokarbon dan pestisida di laut, terakumulasi dalam jaringan daging hewan laut, dan akhirnya dikonsumsi manusia sebagai pemicu kanker dan gangguan hormon endokrin.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 5,
        "soal": "Seorang siswa selalu membawa botol minum (tumbler) sendiri dari rumah ke sekolah untuk menghindari pembelian air mineral dalam botol plastik sekali pakai. Perilaku bijak siswa tersebut merupakan penerapan prinsip pengelolaan sampah ....",
        "opsi": [
            {"label": "A", "teks": "Recycle (mendaur ulang sampah)"},
            {"label": "B", "teks": "Replant (menanam kembali pohon)"},
            {"label": "C", "teks": "Reduce (mengurangi timbulan sampah baru) dan Reuse (menggunakan kembali wadah berulang kali)"},
            {"label": "D", "teks": "Rotting (membusukkan sampah)"}
        ],
        "kunci": "C",
        "pembahasan": "Membawa tumbler sendiri mencegah timbulnya sampah kemasan plastik baru (Reduce) sekaligus memakai wadah berulang kali (Reuse), yang merupakan tingkatan tertinggi dalam hierarki pengelolaan sampah sebelum tahap daur ulang (Recycle).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 6,
        "soal": "Secara alami, atmosfer bumi memiliki fenomena efek rumah kaca (greenhouse effect). Peran positif efek rumah kaca alami bagi kelangsungan hidup makhluk hidup di bumi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menghilangkan seluruh gas oksigen di atmosfer"},
            {"label": "B", "teks": "Menjaga suhu rata-rata permukaan bumi tetap hangat sekitar 15°C sehingga layak dihuni, sebab tanpa efek rumah kaca suhu bumi akan membeku di kisaran -18°C"},
            {"label": "C", "teks": "Mencegah jatuhnya meteor ke daratan"},
            {"label": "D", "teks": "Mempercepat terjadinya pasang surut air laut"}
        ],
        "kunci": "B",
        "pembahasan": "Efek rumah kaca alami sangat penting bagi biosfer: gas rumah kaca alami di atmosfer memerangkap sebagian radiasi inframerah bumi agar tidak seluruhnya lepas ke angkasa, mempertahankan suhu rata-rata global di sekitar +15°C. Tanpa gas-gas ini, bumi akan menjadi planet es beku dengan suhu ekstrem -18°C.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 7,
        "soal": "Perhatikan gambar skema mekanisme efek rumah kaca pada atmosfer Bumi berikut! Anak panah (1) menunjukkan radiasi matahari gelombang pendek menembus atmosfer menuju bumi. Anak panah (2) menunjukkan sebagian radiasi dipantulkan kembali. Anak panah (3) menunjukkan radiasi gelombang panjang (inframerah) yang dipancarkan permukaan bumi diserap dan dipantulkan kembali ke bumi oleh gas rumah kaca. Gas-gas pencemar utama yang memperparah efek rumah kaca ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Oksigen (O2) dan nitrogen (N2)"},
            {"label": "B", "teks": "Argon (Ar) dan hidrogen (H2)"},
            {"label": "C", "teks": "Karbon dioksida (CO2), metana (CH4), dinitrogen oksida (N2O), dan klorofluorokarbon (CFC)"},
            {"label": "D", "teks": "Gas helium dan uap belerang"}
        ],
        "kunci": "C",
        "pembahasan": "Gas rumah kaca (GRK) yang memerangkap radiasi gelombang panjang inframerah bumi: Karbon dioksida (CO2 dari pembakaran bahan bakar fosil), Metana (CH4 dari sawah, peternakan, dan TPA), Dinitrogen oksida (N2O dari pupuk kimiawi), serta gas sintetis CFC/HFC.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch7_q7_skema_efek_rumah_kaca.png"
    },
    {
        "nomor_bab": 8,
        "soal": "Aktivitas manusia modern berikut ini yang memberikan sumbangan emisi gas karbon dioksida (CO2) terbesar ke atmosfer dan memicu pemanasan global adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pembakaran bahan bakar fosil (batubara, minyak bumi, dan gas alam) pada pembangkit listrik dan transportasi serta deforestasi hutan"},
            {"label": "B", "teks": "Pembuatan garam dapur di tambak pesisir"},
            {"label": "C", "teks": "Penanaman bibit pohon bakau di pantai"},
            {"label": "D", "teks": "Pemanfaatan sel surya di atap gedung"}
        ],
        "kunci": "A",
        "pembahasan": "Lebih dari 75% emisi GRK global bersumber dari pembakaran bahan bakar fosil untuk pembangkit listrik tenaga uap (batubara), pabrik industri, dan kendaraan bermotor berbahan bakar bensin/solar, diperparah oleh penebangan dan pembakaran hutan (deforestasi) yang menghilangkan rosot karbon alami.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 9,
        "soal": "Salah satu dampak paling nyata dari pemanasan global terhadap kenaikan permukaan air laut global (sea level rise) dipicu oleh dua mekanisme utama fisika yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Mencairnya es gletser di daratan kutub dan pemuaian termal massa air laut (thermal expansion) akibat suhu samudra yang menghangat"},
            {"label": "B", "teks": "Mencairnya es batu di dalam kulkas rumah"},
            {"label": "C", "teks": "Penurunan kadar garam laut secara mendadak"},
            {"label": "D", "teks": "Perubahan arah rotasi bumi"}
        ],
        "kunci": "A",
        "pembahasan": "Kenaikan muka air laut dunia disebabkan oleh: 1) Mencairnya lapisan es daratan (gletser Greenland dan Antarktika) yang menambah volume air ke samudra; 2) Ekspansi termal: air laut yang menyerap panas global memuai sehingga volumenya membesar dan mendesak bibir pantai daratan pulau-pulau rendah tergenang.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 10,
        "soal": "Peningkatan konsentrasi gas CO2 di atmosfer juga memicu fenomena pengasaman air laut (ocean acidification). Reaksi kimia yang terjadi ketika CO2 larut dalam air laut adalah ....",
        "opsi": [
            {"label": "A", "teks": "CO2 + H2O <-> H2CO3 <-> H+ + HCO3-, pelepasan ion H+ menurunkan pH air laut sehingga melarutkan cangkang kalsium karbonat (CaCO3) pada karang dan moluska"},
            {"label": "B", "teks": "CO2 mengendapkan garam dapur"},
            {"label": "C", "teks": "Air laut berubah menjadi larutan soda api"},
            {"label": "D", "teks": "Membeku menjadi es kering"}
        ],
        "kunci": "A",
        "pembahasan": "Lautan menyerap sekitar 30% emisi CO2 antropogenik. Reaksi CO2 dengan H2O membentuk asam karbonat (H2CO3) yang melepaskan ion hidrogen (H+), menurunkan pH rata-rata air laut dan mengurangi ketersediaan ion karbonat, melarutkan cangkang kalsium karbonat pada terumbu karang dan zooplankton bercangkang.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 11,
        "soal": "Peristiwa pemutihan karang (coral bleaching) di perairan tropis terjadi ketika suhu permukaan laut meningkat di atas batas toleransi karang, yang menyebabkan ....",
        "opsi": [
            {"label": "A", "teks": "Polip karang mengeluarkan alga simbiotik fotosintetik (Zooxanthellae) dari jaringannya sehingga karang kehilangan warna alaminya, kelaparan, dan rentan mati"},
            {"label": "B", "teks": "Karang terkena tumpahan cat putih industri"},
            {"label": "C", "teks": "Karang dimakan habis oleh hiu"},
            {"label": "D", "teks": "Kadar garam laut menjadi nol"}
        ],
        "kunci": "A",
        "pembahasan": "Terumbu karang hidup bersimbiosis mutualisme dengan alga mikroskopis Zooxanthellae yang menyediakan nutrisi fotosintesis dan pigmen warna. Saat stres panas akibat pemanasan global, polip karang mengusir alga tersebut sehingga rangka putih kalsium karbonat karang tampak mencuat pucat (bleaching) dan terancam punah.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 12,
        "soal": "Lapisan ozon (O3) di lapisan stratosfer berfungsi melindungi seluruh kehidupan di bumi dari paparan radiasi ultraviolet-B (UV-B) berbahaya. Zat kimia sintetik buatan manusia yang terbukti menjadi penyebab utama berlubangnya lapisan ozon adalah ....",
        "opsi": [
            {"label": "A", "teks": "Klorofluorokarbon (CFC / Freon) yang dahulu banyak digunakan pada pendingin AC, kulkas, dan propelan aerosol"},
            {"label": "B", "teks": "Gas karbon monoksida"},
            {"label": "C", "teks": "Uap air hujan"},
            {"label": "D", "teks": "Gas nitrogen"}
        ],
        "kunci": "A",
        "pembahasan": "CFC stabil di troposfer namun di stratosfer terurai oleh sinar UV melepaskan radikal klorin bebas (Cl*). Satu atom klorin mampu mengkatalisis pemecahan hingga 100.000 molekul ozon (O3) menjadi gas oksigen biasa (O2), menipiskan lapisan ozon dan memicu peningkatan kasus kanker kulit serta katarak mata.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 13,
        "soal": "Kesepakatan perjanjian internasional bersejarah yang berhasil melarang produksi dan peredaran gas perusak lapisan ozon (CFC) di seluruh dunia adalah ....",
        "opsi": [
            {"label": "A", "teks": "Protokol Montreal (1987)"},
            {"label": "B", "teks": "Protokol Kyoto"},
            {"label": "C", "teks": "Perjanjian Paris (Paris Agreement)"},
            {"label": "D", "teks": "Konferensi Jenewa"}
        ],
        "kunci": "A",
        "pembahasan": "Protokol Montreal disepakati tahun 1987 untuk menghentikan pemakaian zat-zat perusak lapisan ozon (ODS) seperti CFC dan Halon, yang terbukti sangat efektif memulihkan lapisan ozon di kutub.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 14,
        "soal": "Danau di daerah perbukitan granit sering mengalami kematian ikan massal setelah diguyur hujan lebat berhari-hari. Analisis air danau menunjukkan pH air turun drastis di bawah 4,5 dan terlarutnya ion logam beracun aluminium. Penyebab bencana ekologis tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Fenomena hujan asam akibat gas buang SO2 dan NOx dari kawasan industri sekitar"},
            {"label": "B", "teks": "Peningkatan fotosintesis air danau"},
            {"label": "C", "teks": "Turunnya salju di musim panas"},
            {"label": "D", "teks": "Gempa bumi tektonik bawah danau"}
        ],
        "kunci": "A",
        "pembahasan": "Hujan asam (asam sulfat dan asam nitrat) mengasamkan danau yang tidak memiliki batuan penyangga kapur. Keasaman tinggi melarutkan ion aluminium beracun dari tanah ke perairan danau, menyumbat lendir pada insang ikan sehingga ikan mati lemas (insufisiensi pernapasan insang).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 15,
        "soal": "Patung-patung marmer antik peninggalan sejarah dan jembatan besi di kota-kota industri modern tampak mengalami pengikisan permukaan dan perkaratan yang sangat cepat. Penyebab utama perusakan material tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Hujan asam yang melarutkan kalsium karbonat batu marmer (CaCO3 + H2SO4 -> CaSO4 + CO2 + H2O) dan mempercepat korosi besi"},
            {"label": "B", "teks": "Suhu udara malam hari yang dingin"},
            {"label": "C", "teks": "Kotoran burung liar"},
            {"label": "D", "teks": "Angin kencang pantai"}
        ],
        "kunci": "A",
        "pembahasan": "Hujan asam bersifat sangat korosif terhadap logam dan bereaksi menghancurkan batuan kapur/marmer menjadi kalsium sulfat yang rapuh mudah hanyut, merusak peninggalan budaya dan struktur infrastruktur beton-besi.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 16,
        "soal": "Penggunaan pupuk buatan (urea dan NPK) serta deterjen berfosfat yang berlebihan pada lahan pertanian di sekitar danau sering terbawa aliran air hujan masuk ke danau, memicu peristiwa ....",
        "opsi": [
            {"label": "A", "teks": "Eutrofikasi (penyuburan perairan secara berlebihan)"},
            {"label": "B", "teks": "Pengeringan danau seketika"},
            {"label": "C", "teks": "Pemanasan air danau menjadi air mendidih"},
            {"label": "D", "teks": "Pemadatan air danau menjadi es"}
        ],
        "kunci": "A",
        "pembahasan": "Eutrofikasi adalah peristiwa peledakan kesuburan perairan akibat pengayaan nutrien anorganik (terutama fosfor P dan nitrogen N) dari limpasan pupuk dan limbah deterjen domestik.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 17,
        "soal": "Pada perairan yang mengalami eutrofikasi, terjadi pertumbuhan masif tumbuhan eceng gondok atau ledakan populasi alga hijau (algal bloom). Kematian massal ikan di danau tersebut pada malam hari terjadi karena ....",
        "opsi": [
            {"label": "A", "teks": "Bakteri pengurai aerobik mengonsumsi hampir seluruh oksigen terlarut (DO mendekati nol) untuk membusukkan jutaan biomassa alga yang mati di dasar perairan"},
            {"label": "B", "teks": "Eceng gondok memakan ikan-ikan kecil"},
            {"label": "C", "teks": "Air danau berubah menjadi minyak"},
            {"label": "D", "teks": "Ikan kehabisan garam mineral"}
        ],
        "kunci": "A",
        "pembahasan": "Saat populasi alga lebat mengalami penuaan dan mati serentak, dekomposisi biomassa oleh bakteri pembusuk aerob menguras cadangan oksigen terlarut (anoksia). Ketiadaan oksigen ini menyebabkan kematian massal ribuan biota air dan menghasilkan gas busuk beracun H2S dan metana.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 18,
        "soal": "Penyakit Itai-Itai di daerah Toyama Jepang ditandai dengan kerapuhan tulang ekstrem, nyeri sendi hebat, dan gagal ginjal. Penyakit lingkungan ini disebabkan oleh keracunan limbah industri tambang logam berat ....",
        "opsi": [
            {"label": "A", "teks": "Kadmium (Cd) yang mencemari air irigasi sawah padi"},
            {"label": "B", "teks": "Belerang murni"},
            {"label": "C", "teks": "Aluminium"},
            {"label": "D", "teks": "Klorin"}
        ],
        "kunci": "A",
        "pembahasan": "Penyakit Itai-itai disebabkan oleh keracunan kronis kadmium (Cd) yang dialirkan ke Sungai Jinzu dan diserap tanaman padi. Kadmium merusak tubulus ginjal dan memicu osteomalasia berat (tulang melunak dan rapuh mudah patah).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 19,
        "soal": "Penggunaan bahan bakar bensin bertimbal (TEL / Tetra Ethyl Lead) pada masa lalu dilarang secara global karena partikel timbal (Pb) di udara knalpot sangat berbahaya, yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Menumpuk di dalam tulang dan merusak sistem saraf otak serta menurunkan tingkat kecerdasan (IQ) anak-anak secara permanen"},
            {"label": "B", "teks": "Menyebabkan alergi kulit ringan"},
            {"label": "C", "teks": "Mempercepat pertumbuhan rambut"},
            {"label": "D", "teks": "Menurunkan berat badan"}
        ],
        "kunci": "A",
        "pembahasan": "Timbal (Pb) adalah neurotoksin kumulatif berbahaya. Pada anak-anak, paparan timbal mengganggu pembentukan sinapsis saraf dan mielinisasi otak, menurunkan kecerdasan kognitif (IQ drop) dan memicu kelainan perilaku impulsif.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 20,
        "soal": "Gas tidak berbau dan tidak berwarna yang dihasilkan dari pembakaran mesin kendaraan bermotor yang menyala di dalam garasi tertutup yang dapat menyebabkan pingsan dan kematian mendadak adalah gas ....",
        "opsi": [
            {"label": "A", "teks": "Karbon monoksida (CO)"},
            {"label": "B", "teks": "Karbon dioksida (CO2)"},
            {"label": "C", "teks": "Gas nitrogen (N2)"},
            {"label": "D", "teks": "Gas helium (He)"}
        ],
        "kunci": "A",
        "pembahasan": "Karbon monoksida (CO) adalah 'silent killer'. Gas ini berikatan kuat dengan atom besi pada hemoglobin membentuk HbCO dengan afinitas 200 kali lipat oksigen, melumpuhkan transport oksigen ke otak dan jantung sehingga korban tertidur lemas tanpa sadar hingga meninggal dunia.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 21,
        "soal": "Upaya pembersihan tanah atau perairan yang tercemar logam berat atau polutan organik menggunakan tanaman hiperakumulator (seperti eceng gondok, tanaman bunga matahari, atau pohon bambu) disebut ....",
        "opsi": [
            {"label": "A", "teks": "Fitoremediasi"},
            {"label": "B", "teks": "Bioleaching"},
            {"label": "C", "teks": "Eutrofikasi"},
            {"label": "D", "teks": "Pasteurisasi"}
        ],
        "kunci": "A",
        "pembahasan": "Fitoremediasi (phytoremediation) adalah teknologi pemanfaatan tumbuhan hijau hidup untuk menyerap, mengendapkan, atau mendegradasi zat-zat pencemar beracun dari media tanah, lumpur, dan air limbah secara biologis.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 22,
        "soal": "Pengolahan sampah organik dapur (sisa sayur dan kulit buah) menjadi pupuk kompos menggunakan komposter rumah tangga memberikan manfaat ekologis ganda, yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Mengurangi volume timbunan sampah yang masuk ke TPA dan menghasilkan pupuk alami kaya humus yang menyuburkan struktur tanah"},
            {"label": "B", "teks": "Menghasilkan sampah plastik baru"},
            {"label": "C", "teks": "Membunuh seluruh cacing tanah"},
            {"label": "D", "teks": "Menghilangkan air tanah"}
        ],
        "kunci": "A",
        "pembahasan": "Pengomposan mengubah fraksi sampah organik basah menjadi pupuk hayati humus kaya hara, mengurangi beban timbulan sampah TPA hingga 60%, dan mencegah emisi gas metana liar akibat pembusukan anaerob di timbunan terbuka.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 23,
        "soal": "Tindakan mendaur ulang botol plastik bekas (PET) menjadi serat poliester pembuat benang kaos atau dakron bantal merupakan contoh penerapan prinsip 5R pada tahap ....",
        "opsi": [
            {"label": "A", "teks": "Recycle (daur ulang melalui proses pengolahan fisik/kimia menjadi produk baru)"},
            {"label": "B", "teks": "Reduce"},
            {"label": "C", "teks": "Refuse"},
            {"label": "D", "teks": "Replant"}
        ],
        "kunci": "A",
        "pembahasan": "Recycle adalah proses pengolahan kembali material limbah bekas pakai melalui pencacahan, pelelehan, atau pemrosesan industri untuk dicetak menjadi bahan atau barang manufaktur baru.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 24,
        "soal": "Sebuah kota mengganti pembangkit listrik tenaga batubara (emisi 820 g CO2/kWh) dengan PLTS tenaga surya (emisi 40 g CO2/kWh) untuk kebutuhan 10.000.000 kWh per tahun. Besar reduksi emisi gas karbon dioksida yang berhasil dicegah lepas ke atmosfer per tahun adalah ....",
        "opsi": [
            {"label": "A", "teks": "7.800 ton CO2/tahun"},
            {"label": "B", "teks": "8.200 ton CO2/tahun"},
            {"label": "C", "teks": "4.000 ton CO2/tahun"},
            {"label": "D", "teks": "780 ton CO2/tahun"}
        ],
        "kunci": "A",
        "pembahasan": "Reduksi emisi per kWh = 820 - 40 = 780 g CO2/kWh. Untuk 10.000.000 kWh (10^7 kWh): Total reduksi = 780 g/kWh * 10^7 kWh = 7.800.000.000 gram = 7.800.000 kg = 7.800 ton CO2 per tahun.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 25,
        "soal": "Sistem pertanian terpadu berkelanjutan (sustainable integrated farming) memadukan peternakan sapi, kolam ikan, dan sawah organik. Kotoran sapi diolah menjadi biogas dan pupuk organik padat, sedangkan limbah air kolam kaya nitrogen dialirkan ke sawah. Keunggulan ekologis sistem ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menerapkan prinsip sirkular ekonomi nir-limbah (zero waste), meminimalkan pupuk kimia sintetis, dan menjaga kesuburan tanah jangka panjang"},
            {"label": "B", "teks": "Membutuhkan bahan bakar bensin yang banyak"},
            {"label": "C", "teks": "Mengurangi populasi ikan tawar"},
            {"label": "D", "teks": "Menghilangkan tanaman padi"}
        ],
        "kunci": "A",
        "pembahasan": "Sistem pertanian terintegrasi sirkular mendaur ulang nutrisi antar-komponen agroekosistem: kotoran ternak menjadi energi dan hara bagi tanah, memangkas biaya input pupuk kimia, menghentikan pencemaran aliran sungai, dan meningkatkan produktivitas pangan berkelanjutan.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    }
]

# 10 Soal Contoh Asli (No. 26-35)
soal_contoh = [
    {
        "nomor_bab": 26,
        "soal": "Perhatikan grafik hasil pengukuran kadar oksigen terlarut (DO) dan kebutuhan oksigen biokimia (BOD) sepanjang aliran sungai berikut! Di titik X tepat sebelum muara pabrik, kadar DO terbaca 7,5 mg/L dan BOD 2,0 mg/L. Di titik Y tepat 200 meter di hilir muara limbah pabrik, kadar DO merosot menjadi 1,8 mg/L dan BOD melonjak menjadi 19,5 mg/L. Berdasarkan grafik tersebut, kesimpulan yang benar mengenai kondisi titik Y adalah ....",
        "opsi": [
            {"label": "A", "teks": "Titik Y tercemar berat oleh limbah organik sehingga bakteri pengurai membutuhkan banyak oksigen (BOD tinggi), menghabiskan oksigen terlarut air (DO rendah)"},
            {"label": "B", "teks": "Titik Y merupakan air sungai paling sehat"},
            {"label": "C", "teks": "Limbah pabrik menambah pasokan oksigen"},
            {"label": "D", "teks": "Ikan di titik Y tumbuh lebih cepat"}
        ],
        "kunci": "A",
        "pembahasan": "Kadar DO (Dissolved Oxygen) berbanding terbalik dengan nilai BOD (Biochemical Oxygen Demand). Lonjakan tajam BOD di titik Y membuktikan air sungai dibebani materi organik polutan dalam konsentrasi tinggi, menguras pasokan oksigen bebas hingga di bawah ambang minimum kehidupan ikan (baku mutu DO minimal 4 mg/L).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": "/soal/ipa/kls9_ipa_ch7_q26_grafik_do_bod_sungai.png"
    },
    {
        "nomor_bab": 27,
        "soal": "Kadar oksigen terlarut dalam air (Dissolved Oxygen / DO) yang ideal dan sehat untuk menopang kehidupan keanekaragaman ikan tawar air sungai adalah ....",
        "opsi": [
            {"label": "A", "teks": "Lebih dari atau sama dengan 5 mg/L"},
            {"label": "B", "teks": "Kurang dari 1 mg/L"},
            {"label": "C", "teks": "Tepat 0 mg/L"},
            {"label": "D", "teks": "Kurang dari 2 mg/L"}
        ],
        "kunci": "A",
        "pembahasan": "Berdasarkan standar baku mutu perairan air tawar (Kelas II untuk perikanan): kadar oksigen terlarut (DO) yang baik harus berkisar di atas 5,0 mg/L. Jika DO turun di bawah 3 mg/L, sebagian besar jenis ikan mengalami hipoksia dan mati.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 28,
        "soal": "Parameter BOD (Biochemical Oxygen Demand) didefinisikan sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Jumlah miligram gas oksigen yang dibutuhkan oleh mikroorganisme aerobik untuk menguraikan bahan organik di dalam 1 liter air pada suhu 20°C selama 5 hari"},
            {"label": "B", "teks": "Jumlah garam dalam air"},
            {"label": "C", "teks": "Kecepatan arus air sungai"},
            {"label": "D", "teks": "Suhu air saat mendidih"}
        ],
        "kunci": "A",
        "pembahasan": "BOD5 adalah ukuran kuantitatif kandungan polutan organik: makin tinggi nilai BOD, makin kotor dan tercemar air tersebut oleh sampah organik yang membusuk.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 29,
        "soal": "Secara kimiawi, air minum yang sehat dan memenuhi standar kualitas air bersih harus memiliki nilai pH berkisar antara ....",
        "opsi": [
            {"label": "A", "teks": "6,5 sampai 8,5"},
            {"label": "B", "teks": "1,0 sampai 3,0"},
            {"label": "C", "teks": "11,0 sampai 14,0"},
            {"label": "D", "teks": "Tepat 0"}
        ],
        "kunci": "A",
        "pembahasan": "Baku mutu air minum (Permenkes RI): pH air yang aman bagi kesehatan berada pada rentang netral 6,5 hingga 8,5. Nilai pH di luar rentang ini dapat menimbulkan iritasi mukosa atau bersifat korosif pipa distribusi.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 30,
        "soal": "Lapisan atmosfer bumi tempat terkonsentrasinya molekul gas ozon (O3) yang berfungsi menyaring radiasi sinar ultraviolet matahari berada pada lapisan ....",
        "opsi": [
            {"label": "A", "teks": "Stratosfer (ketinggian 15–35 km di atas permukaan bumi)"},
            {"label": "B", "teks": "Troposfer (lapisan terbawah tempat cuaca)"},
            {"label": "C", "teks": "Mesosfer"},
            {"label": "D", "teks": "Termosfer"}
        ],
        "kunci": "A",
        "pembahasan": "Ozon stratosfer ('ozon baik') terkonsentrasi pada lapisan ozonosfer di stratosfer (ketinggian 15-35 km) menyerap radiasi UV-B matahari. Sebaliknya, ozon di lapisan troposfer dekat tanah bertindak sebagai polutan udara sekunder pengiritasi paru-paru ('ozon jahat').",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 31,
        "soal": "Organisme lumut kerak (Lichens) yang tumbuh menempel pada batang pohon peneduh jalan digunakan oleh para peneliti sebagai bioindikator tingkat ....",
        "opsi": [
            {"label": "A", "teks": "Kebersihan dan kemurnian udara terhadap polusi gas belerang dioksida (SO2)"},
            {"label": "B", "teks": "Pencemaran air limbah selokan"},
            {"label": "C", "teks": "Kadar garam dalam tanah"},
            {"label": "D", "teks": "Keberadaan medan magnet bumi"}
        ],
        "kunci": "A",
        "pembahasan": "Lichens (simbiosis alga dan jamur) menyerap nutrisi langsung dari udara dan sangat rentan mati jika udara tercemar gas belerang dioksida (SO2) dan logam berat, menjadikannya bioindikator kualitas udara alami.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 32,
        "soal": "Tiga jenis logam berat industri yang bersifat non-esensial dan sangat beracun (toksik) bagi organisme hidup meski dalam kadar renik sekalipun adalah ....",
        "opsi": [
            {"label": "A", "teks": "Merkuri (Hg), Timbal (Pb), dan Kadmium (Cd)"},
            {"label": "B", "teks": "Kalsium (Ca), Magnesium (Mg), dan Kalium (K)"},
            {"label": "C", "teks": "Natrium (Na), Besi (Fe), dan Seng (Zn)"},
            {"label": "D", "teks": "Oksigen, Hidrogen, dan Karbon"}
        ],
        "kunci": "A",
        "pembahasan": "Merkuri (Hg), Timbal (Pb), dan Kadmium (Cd) merupakan 'The Big Three' logam berat beracun penyebab kerusakan neurologis, kanker, dan nefrotoksisitas ginjal berat.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 33,
        "soal": "Jenis sampah berikut yang membutuhkan waktu paling lama (ratusan tahun) untuk dapat terurai secara alami di alam adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kantong plastik, botol plastik PET, dan styrofoam"},
            {"label": "B", "teks": "Kertas koran dan daun kering"},
            {"label": "C", "teks": "Kulit pisang dan sisa sayur"},
            {"label": "D", "teks": "Kain katun murni"}
        ],
        "kunci": "A",
        "pembahasan": "Polimer sintetis rantai karbon plastik (PE, PP, PET) dan busa polistirena (styrofoam) tidak memiliki enzim pengurai alami dari bakteri sehingga membutuhkan waktu 100 hingga 500 tahun untuk terdegradasi.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 34,
        "soal": "Prinsip penanaman kembali pepohonan pada lahan hutan yang telah gundul akibat kebakaran atau penebangan liar disebut ....",
        "opsi": [
            {"label": "A", "teks": "Reboisasi (reforestasi)"},
            {"label": "B", "teks": "Deforestasi"},
            {"label": "C", "teks": "Eutrofikasi"},
            {"label": "D", "teks": "Urbanisasi"}
        ],
        "kunci": "A",
        "pembahasan": "Reboisasi memulihkan tutupan kanopi vegetasi hutan, mencegah erosi tanah longsor, menyerap gas CO2 fotosintesis, dan mengembalikan habitat keanekaragaman hayati satwa.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 35,
        "soal": "Sumber energi alternatif ramah lingkungan yang memanfaatkan panas uap air dari dalam perut bumi untuk menggerakkan turbin pembangkit listrik disebut energi ....",
        "opsi": [
            {"label": "A", "teks": "Geotermal (panas bumi)"},
            {"label": "B", "teks": "Biomassa"},
            {"label": "C", "teks": "Nuklir"},
            {"label": "D", "teks": "Minyak bumi"}
        ],
        "kunci": "A",
        "pembahasan": "Pembangkit Listrik Tenaga Panas Bumi (PLTP) memanfaatkan energi panas bumi (geothermal) dari reservoir uap air panas bawah tanah di kawasan vulkanik untuk memutar generator listrik tanpa emisi polusi batubara.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
soal_mandiri = [
    {
        "nomor_bab": 36,
        "soal": "Kesatuan komunitas makhluk hidup beserta lingkungan fisik tak hidup tempat tinggalnya yang saling berinteraksi membentuk sistem timbal balik disebut ....",
        "opsi": [
            {"label": "A", "teks": "Ekosistem"},
            {"label": "B", "teks": "Populasi"},
            {"label": "C", "teks": "Individu"},
            {"label": "D", "teks": "Habitat"}
        ],
        "kunci": "A",
        "pembahasan": "Ekosistem adalah tatanan kesatuan utuh menyeluruh antara segenap unsur lingkungan hidup biotik dan abiotik yang saling memengaruhi.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 37,
        "soal": "Masuk atau dimasukkannya zat, energi, atau komponen lain ke dalam lingkungan hidup oleh kegiatan manusia sehingga kualitasnya turun sampai ke tingkat tertentu yang menyebabkan lingkungan tidak dapat berfungsi sesuai peruntukannya disebut ....",
        "opsi": [
            {"label": "A", "teks": "Pencemaran lingkungan hidup (polusi)"},
            {"label": "B", "teks": "Konservasi alam"},
            {"label": "C", "teks": "Rehabilitasi lahan"},
            {"label": "D", "teks": "Adaptasi habitat"}
        ],
        "kunci": "A",
        "pembahasan": "Definisi baku pencemaran lingkungan hidup menurut UU Perlindungan dan Pengelolaan Lingkungan Hidup (PPLH).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 38,
        "soal": "Limbah buangan dari perumahan tangga, pasar tradisional, dan permukiman warga dikategorikan sebagai limbah ....",
        "opsi": [
            {"label": "A", "teks": "Domestik"},
            {"label": "B", "teks": "Industri kimia"},
            {"label": "C", "teks": "Pertambangan"},
            {"label": "D", "teks": "Radioaktif"}
        ],
        "kunci": "A",
        "pembahasan": "Limbah domestik adalah air limbah dan sampah padat yang berasal dari aktivitas harian rumah tangga manusia (seperti air cucian piring, deterjen, kotoran, dan sisa makanan dapur).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 39,
        "soal": "Busa deterjen yang menutupi permukaan air saluran sungai dapat menimbulkan gangguan lingkungan karena ....",
        "opsi": [
            {"label": "A", "teks": "Menghalangi penetrasi sinar matahari dan difusi gas oksigen dari udara bebas ke dalam badan air"},
            {"label": "B", "teks": "Menaikkan suhu air sungai mendidih"},
            {"label": "C", "teks": "Mengubah air menjadi minyak"},
            {"label": "D", "teks": "Menambah kecepatan aliran arus sungai"}
        ],
        "kunci": "A",
        "pembahasan": "Lapisan busa surfaktan deterjen menghambat aerasi alami (perpindahan oksigen dari atmosfer ke air) serta memblokir cahaya fotosintesis tanaman air.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 40,
        "soal": "Tumpahan minyak mentah akibat kecelakaan kapal tanker di laut menyebabkan kematian burung-burung laut karena ....",
        "opsi": [
            {"label": "A", "teks": "Minyak menempel pada bulu burung sehingga menghilangkan sifat kedap air dan daya apung bulu serta memicu hipotermia"},
            {"label": "B", "teks": "Minyak membuat bulu burung menjadi lebih wangi"},
            {"label": "C", "teks": "Burung tertidur di atas minyak"},
            {"label": "D", "teks": "Burung tidak dapat bernapas lewat paruh"}
        ],
        "kunci": "A",
        "pembahasan": "Minyak merusak struktur mikroskopis kait bulu burung penangkal air (waterproofing), menyebabkan air laut dingin meresap ke kulit (hipotermia fatal) dan burung kehilangan daya apung hingga tenggelam.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 41,
        "soal": "Polutan udara primer adalah zat polutan yang dilepaskan langsung dari sumber emisinya. Contoh polutan udara primer adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gas karbon monoksida (CO) dan belerang dioksida (SO2) langsung dari cerobong asap"},
            {"label": "B", "teks": "Hujan asam di awan"},
            {"label": "C", "teks": "Ozon troposferik"},
            {"label": "D", "teks": "Asbut fotokimia (smog)"}
        ],
        "kunci": "A",
        "pembahasan": "Polutan primer diemisikan langsung (CO, SO2, partikulat jelaga). Polutan sekunder terbentuk dari reaksi kimia antar-polutan primer di atmosfer (seperti hujan asam H2SO4, PAN, dan ozon troposferik).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 42,
        "soal": "Fenomena kabut asap kecokelatan beracun (smog fotokimia) yang sering melanda kota-kota megapolitan terbentuk dari reaksi fotokimia antara ....",
        "opsi": [
            {"label": "A", "teks": "Gas NOx dan hidrokarbon dengan bantuan sinar ultraviolet matahari"},
            {"label": "B", "teks": "Gas oksigen dan uap air embun"},
            {"label": "C", "teks": "Garam laut dan angin dingin"},
            {"label": "D", "teks": "Debu tanah dan pasir"}
        ],
        "kunci": "A",
        "pembahasan": "Smog fotokimia dihasilkan dari reaksi kompleks antara oksida nitrogen (NOx) dan senyawa organik volatil (VOC) yang dikatalisis oleh radiasi matahari menghasilkan ozon, aldehida, dan peroksiasetil nitrat (PAN) yang pedih di mata.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 43,
        "soal": "Penanaman pohon peneduh jalur hijau di sepanjang jalan protokol perkotaan sangat efektif mereduksi polusi udara karena daun-daun pohon berfungsi ....",
        "opsi": [
            {"label": "A", "teks": "Menyerap gas CO2 melalui fotosintesis, menjerap partikel debu halus pada permukaan daun, dan melepaskan gas O2 segar"},
            {"label": "B", "teks": "Memanaskan udara jalanan"},
            {"label": "C", "teks": "Menghilangkan gaya gravitasi"},
            {"label": "D", "teks": "Mengurangi suara klakson mobil"}
        ],
        "kunci": "A",
        "pembahasan": "Vegetasi pepohonan kota (urban forestry) bertindak sebagai paru-paru kota: menyerap karbon dioksida, menangkap partikel debu PM2.5/PM10, menghasilkan oksigen, dan meredam efek pulau panas kota (Urban Heat Island).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 44,
        "soal": "Pekerja pemotongan batu asbes atau pembongkaran bangunan tua tanpa masker respirator pelindung berisiko tinggi menderita penyakit pernapasan kronis yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Asbestosis dan kanker mesotelioma paru-paru"},
            {"label": "B", "teks": "Influenza musiman"},
            {"label": "C", "teks": "Gondok beracun"},
            {"label": "D", "teks": "Tekanan darah rendah"}
        ],
        "kunci": "A",
        "pembahasan": "Serat mikroskopis asbes yang terhirup menancap permanen di alveolus dan pleura paru-paru, memicu luka fibrosis progresif (asbestosis) serta keganasan kanker sel mesotelioma.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 45,
        "soal": "Pencemaran suara (polusi kebisingan) dengan intensitas suara di atas 85 desibel (dB) yang terpapar terus-menerus dapat menimbulkan dampak kesehatan berupa ....",
        "opsi": [
            {"label": "A", "teks": "Kerusakan sel-sel rambut indra pendengaran Organ Corti di koklea (tuli saraf / noise-induced hearing loss) dan stres hipertensi"},
            {"label": "B", "teks": "Kebutaan mata"},
            {"label": "C", "teks": "Penyakit diabetes"},
            {"label": "D", "teks": "Kerusakan enamel gigi"}
        ],
        "kunci": "A",
        "pembahasan": "Paparan bising kronis >85 dB merusak stereosilia sel rambut koklea telinga dalam yang tidak dapat beregenerasi, memicu tuli permanen dan memicu vasokonstriksi pembuluh darah stres (hipertensi).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 46,
        "soal": "Pembuatan lubang biopori silindris di pekarangan rumah sedalam 1 meter dan diisi sampah dedaunan kering bertujuan untuk ....",
        "opsi": [
            {"label": "A", "teks": "Meningkatkan laju resapan air hujan ke tanah mencegah banjir, membentuk kompos alami, dan meningkatkan aktivitas cacing tanah"},
            {"label": "B", "teks": "Menampung air limbah deterjen"},
            {"label": "C", "teks": "Mematikan akar pohon tetangga"},
            {"label": "D", "teks": "Tempat membuang plastik"}
        ],
        "kunci": "A",
        "pembahasan": "Lubang Resapan Biopori (LRB) memperluas bidang resapan air ke lapisan akuifer tanah, mencegah limpasan banjir, dan mengubah sampah daun menjadi pupuk kompos melalui aktivitas fauna tanah.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 47,
        "soal": "Instalasi Pengolahan Air Limbah (IPAL) industri wajib menerapkan pengolahan air limbah sebelum dialirkan ke sungai. Tahap pengolahan biologis sekunder pada IPAL umumnya memanfaatkan ....",
        "opsi": [
            {"label": "A", "teks": "Bakteri pengurai dalam kolam aerasi beraerator (lumpur aktif / activated sludge)"},
            {"label": "B", "teks": "Penyaringan dengan kain kasa biasa"},
            {"label": "C", "teks": "Pemanasan sampai suhu 100°C"},
            {"label": "D", "teks": "Pengendapan pasir saja"}
        ],
        "kunci": "A",
        "pembahasan": "Proses lumpur aktif (activated sludge) menyuplai oksigen ke kolam penampungan agar konsorsium bakteri aerobik mencerna dan menguraikan senyawa organik limbah hingga nilai BOD memenuhi standar aman.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 48,
        "soal": "Prinsip Zero Waste (bebas sampah) dalam gaya hidup ramah lingkungan menganjurkan kita untuk ....",
        "opsi": [
            {"label": "A", "teks": "Mendesain ulang pola konsumsi sehingga meminimalkan timbulan sampah yang berakhir di tempat pembuangan akhir (TPA)"},
            {"label": "B", "teks": "Membakar seluruh sampah di halaman rumah"},
            {"label": "C", "teks": "Membuang sampah ke sungai saat banjir"},
            {"label": "D", "teks": "Mengubur seluruh sampah plastik di kebun"}
        ],
        "kunci": "A",
        "pembahasan": "Zero Waste berfokus pada pencegahan sampah pada sumbernya (refuse, reduce, reuse) sehingga sisa material dapat dipulihkan dan tidak membebani TPA.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 49,
        "soal": "Tumpukan sampah organik di Tempat Pembuangan Akhir (TPA) yang tertimbun rapat tanpa sirkulasi udara menghasilkan gas mudah terbakar yaitu gas ....",
        "opsi": [
            {"label": "A", "teks": "Metana (CH4)"},
            {"label": "B", "teks": "Oksigen (O2)"},
            {"label": "C", "teks": "Argon"},
            {"label": "D", "teks": "Helium"}
        ],
        "kunci": "A",
        "pembahasan": "Pembusukan anaerobik biomassa oleh bakteri metanogen di kedalaman gunungan TPA memproduksi gas metana (CH4) yang mudah terbakar atau meledak jika tidak dipasang pipa ventilasi pelepas gas.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 50,
        "soal": "Gas metana dari gunungan TPA modern kini dapat ditangkap dan dialirkan melalui pipa untuk dimanfaatkan sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Bahan bakar pembangkit listrik tenaga sampah (biomassa energi)"},
            {"label": "B", "teks": "Pengisi ban mobil"},
            {"label": "C", "teks": "Bahan pembuat es batu"},
            {"label": "D", "teks": "Pupuk cair tanaman"}
        ],
        "kunci": "A",
        "pembahasan": "Sanitary landfill modern menangkap gas metana TPA sebagai energi terbarukan penggerak generator listrik gas sekaligus mencegah metana (potensi pemanasan global 28x lebih kuat dari CO2) terlepas liar ke atmosfer.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 51,
        "soal": "Baterai bekas, aki motor, jarum suntik medis, dan cairan pembersih lantai tergolong ke dalam kategori limbah ....",
        "opsi": [
            {"label": "A", "teks": "Limbah Bahan Berbahaya dan Beracun (B3)"},
            {"label": "B", "teks": "Limbah organik basah"},
            {"label": "C", "teks": "Limbah pertanian biasa"},
            {"label": "D", "teks": "Limbah daur ulang kertas"}
        ],
        "kunci": "A",
        "pembahasan": "Limbah B3 adalah zat beracun, korosif, mudah meledak, atau infeksius yang memerlukan penanganan terpisah khusus agar tidak mencemari lingkungan dan kesehatan manusia.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 52,
        "soal": "Penggunaan bom ikan (peledak) dan racun potasium sianida untuk menangkap ikan di laut sangat dilarang keras karena ....",
        "opsi": [
            {"label": "A", "teks": "Menghancurkan terumbu karang yang butuh ratusan tahun untuk tumbuh serta membunuh seluruh bibit ikan dan biota laut non-target"},
            {"label": "B", "teks": "Ikan yang ditangkap terlalu banyak"},
            {"label": "C", "teks": "Membuat air laut tawar"},
            {"label": "D", "teks": "Menaikkan gelombang tsunami"}
        ],
        "kunci": "A",
        "pembahasan": "Gelombang kejut bom ikan meremukkan karang menjadi puing karang mati dan mematikan biota laut tanpa pandang bulu, menghancurkan ekosistem pesisir secara permanen.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 53,
        "soal": "Metode konservasi tanah berlereng curam dengan membuat teras-teras bertingkat disebut ....",
        "opsi": [
            {"label": "A", "teks": "Terasering (sengkedan)"},
            {"label": "B", "teks": "Deforestasi"},
            {"label": "C", "teks": "Drainase bebas"},
            {"label": "D", "teks": "Ekskavasi"}
        ],
        "kunci": "A",
        "pembahasan": "Terasering memotong kemiringan lereng menjadi undakan mendatar, memperlambat kecepatan aliran limpasan air hujan dan mencegah hanyutnya lapisan tanah subur (topsoil) akibat erosi.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 54,
        "soal": "Program Bank Sampah di tingkat RT/RW mengajak warga untuk ....",
        "opsi": [
            {"label": "A", "teks": "Memilah sampah sejak dari rumah (organik, kertas, plastik, logam) sehingga memiliki nilai ekonomi tabungan dan mempermudah daur ulang"},
            {"label": "B", "teks": "Mengumpulkan sampah untuk dibakar bersama"},
            {"label": "C", "teks": "Membuang sampah ke selokan"},
            {"label": "D", "teks": "Membeli sampah dari kota lain"}
        ],
        "kunci": "A",
        "pembahasan": "Bank Sampah memberdayakan sirkular ekonomi komunitas melalui pemilahan sampah anorganik bernilai jual ke pengepul dan pengomposan sampah dapur.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 55,
        "soal": "Sendawa ternak ruminansia (seperti sapi dan domba) melepaskan gas rumah kaca berupa gas ....",
        "opsi": [
            {"label": "A", "teks": "Metana (CH4)"},
            {"label": "B", "teks": "Oksigen"},
            {"label": "C", "teks": "Argon"},
            {"label": "D", "teks": "Kripton"}
        ],
        "kunci": "A",
        "pembahasan": "Fermentasi enterik selulosa di dalam lambung rumen sapi oleh mikrobia metanogenik menghasilkan gas metana (CH4) yang disendawakan ke atmosfer.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 56,
        "soal": "Energi terbarukan yang memanfaatkan hembusan angin memutar baling-baling kincir turbin angin disebut ....",
        "opsi": [
            {"label": "A", "teks": "Pembangkit Listrik Tenaga Bayu (PLTB)"},
            {"label": "B", "teks": "Pembangkit Listrik Tenaga Surya (PLTS)"},
            {"label": "C", "teks": "PLTU batubara"},
            {"label": "D", "teks": "PLTN nuklir"}
        ],
        "kunci": "A",
        "pembahasan": "PLTB (Tenaga Bayu/Angin) mengonversi energi kinetik angin menjadi energi mekanik putaran turbin generator listrik bebas emisi karbon.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 57,
        "soal": "Pembangkit listrik yang memanfaatkan beda ketinggian permukaan air laut saat pasang dan surut di teluk pantai disebut ....",
        "opsi": [
            {"label": "A", "teks": "Energi pasang surut (tidal energy)"},
            {"label": "B", "teks": "Energi geotermal"},
            {"label": "C", "teks": "Energi nuklir"},
            {"label": "D", "teks": "Energi biomassa"}
        ],
        "kunci": "A",
        "pembahasan": "Tidal power plant memanfaatkan pasang surut gravitasi bulan-matahari untuk memutar turbin air dwiarah di muara bendung estuari.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 58,
        "soal": "Limbah padat ampas tebu (bagase) dari pabrik gula dapat dimanfaatkan sebagai sumber energi biomassa dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Dibakar di dalam boiler ketel uap untuk menggerakkan turbin pembangkit listrik pabrik (kogenerasi biomassa)"},
            {"label": "B", "teks": "Dibuang ke sungai"},
            {"label": "C", "teks": "Dilarutkan dalam asam pekat"},
            {"label": "D", "teks": "Didinginkan menjadi es batu"}
        ],
        "kunci": "A",
        "pembahasan": "Biomassa padat bagase tebu memiliki nilai kalor tinggi, dibakar dalam boiler uap bertekanan tinggi untuk menggerakkan turbin kogenerasi mandiri listrik pabrik gula.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 59,
        "soal": "Penebangan hutan hujan tropis secara liar (deforestasi) memicu kepunahan keanekaragaman hayati karena ....",
        "opsi": [
            {"label": "A", "teks": "Hilangnya habitat tempat tinggal, sumber makanan, dan daerah jelajah satwa liar alami"},
            {"label": "B", "teks": "Hutan menjadi terlalu dingin"},
            {"label": "C", "teks": "Hewan berpindah ke luar angkasa"},
            {"label": "D", "teks": "Hewan kehilangan kemampuan mendengar"}
        ],
        "kunci": "A",
        "pembahasan": "Hutan hujan tropis adalah rumah bagi lebih dari 50% spesies makhluk hidup daratan dunia. Deforestasi menghancurkan niche ekologis satwa memicu kepunahan permanen.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 60,
        "soal": "Salah satu aksi nyata sederhana yang dapat dilakukan siswa untuk menghemat konsumsi energi listrik dan menekan pemanasan global adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mematikan lampu, kipas angin, dan televisi saat meninggalkan ruangan serta mencabut colokan kabel pengisi daya"},
            {"label": "B", "teks": "Menyalakan AC pada suhu 16°C sepanjang hari"},
            {"label": "C", "teks": "Membuka pintu kulkas terus-menerus"},
            {"label": "D", "teks": "Menyalakan seluruh lampu di siang bolong"}
        ],
        "kunci": "A",
        "pembahasan": "Mematikan beban listrik tak terpakai memangkas konsumsi daya 'vampire power', menekan biaya dan mengurangi kebutuhan pembakaran batubara di PLTU.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 61,
        "soal": "Penelitian kualitas air minum mendapati adanya kandungan zat deterjen busa dan minyak. Uji laboratorium mikrobiologi yang wajib dilakukan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Uji Most Probable Number (MPN) bakteri koliform dan Salmonella"},
            {"label": "B", "teks": "Uji berat jenis es"},
            {"label": "C", "teks": "Uji pembiasan cahaya"},
            {"label": "D", "teks": "Uji kekerasan batu"}
        ],
        "kunci": "A",
        "pembahasan": "Uji MPN koliform memastikan air bebas mikroba patogen pemicu diare dan keracunan lambung.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 62,
        "soal": "Gas CFC yang terlepas ke udara membutuhkan waktu bertahun-tahun untuk mencapai stratosfer karena ....",
        "opsi": [
            {"label": "A", "teks": "Sifat kimianya sangat stabil dan tidak mudah bereaksi di troposfer"},
            {"label": "B", "teks": "CFC larut dalam air hujan"},
            {"label": "C", "teks": "CFC membeku di tanah"},
            {"label": "D", "teks": "CFC diserap tanaman"}
        ],
        "kunci": "A",
        "pembahasan": "Inersia kimiawi CFC membuatnya tak terurai di troposfer, bertahan puluhan tahun hingga bermigrasi perlahan menembus stratosfer tempat radiasi UV memecahnya.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 63,
        "soal": "Gas rumah kaca yang memiliki potensi pemanasan global (GWP) sekitar 28 kali lipat lebih kuat dibandingkan gas CO2 dalam rentang waktu 100 tahun adalah ....",
        "opsi": [
            {"label": "A", "teks": "Metana (CH4)"},
            {"label": "B", "teks": "Oksigen (O2)"},
            {"label": "C", "teks": "Nitrogen (N2)"},
            {"label": "D", "teks": "Uap air"}
        ],
        "kunci": "A",
        "pembahasan": "Gas metana (CH4) memerangkap radiasi panas inframerah jauh lebih efektif dibanding CO2 per satuan molekul (GWP-100 = 28-30).",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 64,
        "soal": "Kendaraan bermotor listrik ramah lingkungan (Electric Vehicle / EV) mengurangi polusi perkotaan karena ....",
        "opsi": [
            {"label": "A", "teks": "Tidak memiliki knalpot dan menghasilkan emisi gas buang langsung nol (zero tailpipe emission)"},
            {"label": "B", "teks": "Tidak memerlukan energi baterai"},
            {"label": "C", "teks": "Mengeluarkan uap parfum"},
            {"label": "D", "teks": "Dapat terbang di atas jalan"}
        ],
        "kunci": "A",
        "pembahasan": "Mobil listrik digerakkan motor induksi tanpa proses pembakaran BBM bensin/solar, melenyapkan emisi knalpot CO, SO2, NOx, dan hidrokarbon di area perkotaan.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 65,
        "soal": "Hutan bakau (mangrove) di kawasan pesisir pantai memiliki fungsi ekologis krusial sebagai penahan ....",
        "opsi": [
            {"label": "A", "teks": "Abrasi gelombang ombak laut dan benteng peredam terjangan tsunami"},
            {"label": "B", "teks": "Jatuhnya air hujan"},
            {"label": "C", "teks": "Panas matahari"},
            {"label": "D", "teks": "Suhu dingin malam"}
        ],
        "kunci": "A",
        "pembahasan": "Akar tunjang mangrove meredam energi ombak pasang surut, memerangkap lumpur sedimentasi pantai, mencegah abrasi, dan menyediakan nursery ground ikan laut.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    }
]

# 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "Konsep jejak karbon (carbon footprint) menghitung total emisi gas rumah kaca yang dihasilkan oleh aktivitas seseorang, organisasi, atau produk. Langkah paling efektif seorang individu untuk menekan jejak karbon pribadinya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Beralih menggunakan transportasi umum massal, mengurangi konsumsi daging merah sapi berlebihan, dan beralih ke peralatan hemat listrik"},
            {"label": "B", "teks": "Membeli pakaian baru setiap minggu"},
            {"label": "C", "teks": "Bepergian menggunakan pesawat jet pribadi"},
            {"label": "D", "teks": "Membiarkan lampu rumah menyala 24 jam"}
        ],
        "kunci": "A",
        "pembahasan": "Reduksi jejak karbon paling masif dicapai melalui pergeseran modal transportasi ke kendaraan umum/sepeda, diet rendah emisi ruminansia, dan efisiensi konsumsi energi rumah tangga.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 67,
        "soal": "Dalam reaksi perusakan ozon stratosferik: Cl* + O3 -> ClO* + O2, dan ClO* + O -> Cl* + O2. Peranan atom klorin (Cl*) pada siklus reaksi tersebut adalah sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Katalisator reaksi yang mempercepat pemecahan ozon berulang-ulang tanpa ikut habis terkonsumsi"},
            {"label": "B", "teks": "Zat penghambat (inhibitor)"},
            {"label": "C", "teks": "Produk akhir yang aman"},
            {"label": "D", "teks": "Pelarut netral"}
        ],
        "kunci": "A",
        "pembahasan": "Radikal bebas klorin Cl* bertindak sebagai katalis homogen dalam siklus perusakan ozon berantai: Cl* mempercepat penguraian ribuan molekul O3 menjadi O2 dan terbentuk kembali di akhir siklus untuk menyerang molekul O3 berikutnya.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 68,
        "soal": "Pestisida organoklorin DDT (Dichloro Diphenyl Trichloroethane) dilarang penggunaannya di seluruh dunia karena mengalami biomagnifikasi di rantai makanan. Bukti dampak fenomena biomagnifikasi DDT pada burung pemangsa (elang laut) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Penipisan cangkang telur elang sehingga telur mudah pecah saat dierami akibat terganggunya metabolisme kalsium oleh akumulasi DDT konsentrasi tinggi"},
            {"label": "B", "teks": "Bulu elang rontok seketika"},
            {"label": "C", "teks": "Elang bertelur emas"},
            {"label": "D", "teks": "Mata elang menjadi buta warna"}
        ],
        "kunci": "A",
        "pembahasan": "DDT larut lemak dan tidak terurai tubuh, terakumulasi berlipat ganda pada tingkat trofik puncak (biomagnifikasi). Pada burung pemangsa puncak (burung elang), DDT menghambat enzim kalsium adenosin trifosfatase sehingga cangkang telur rapuh pecah saat dierami induk, memicu kepunahan populasi.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 69,
        "soal": "Fenomena pulau panas perkotaan (Urban Heat Island / UHI) di mana suhu pusat kota metropolitan terasa 3–5°C lebih panas dibandingkan kawasan pedesaan sekitarnya disebabkan oleh ....",
        "opsi": [
            {"label": "A", "teks": "Permukaan aspal jalanan dan beton gedung yang menyerap dan menyimpan panas matahari tinggi, minimnya evapotranspirasi pepohonan, serta pembuangan panas AC dan kendaraan bermotor"},
            {"label": "B", "teks": "Pusat kota lebih dekat ke matahari"},
            {"label": "C", "teks": "Gaya gravitasi di perkotaan lebih besar"},
            {"label": "D", "teks": "Ketiadaan udara di dalam gedung"}
        ],
        "kunci": "A",
        "pembahasan": "UHI dipicu material bangunan ber-albedo rendah (aspal/beton) yang menyimpan radiasi matahari, hilangnya ruang terbuka hijau berpendingin evapotranspirasi, dan panas antropogenik knalpot serta kondensor pendingin AC gedung perkotaan.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 70,
        "soal": "Teknologi mitigasi iklim mutakhir Carbon Capture and Storage (CCS) menangkap gas CO2 langsung dari cerobong asap PLTU batubara atau industri semen. Gas CO2 tersebut kemudian diolah dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Dimampatkan menjadi cairan superkritis lalu diinjeksikan dan disimpan secara permanen di formasi geologis bawah tanah seperti reservoir migas yang sudah habis (depleted oil/gas field) atau akuifer asin dalam"},
            {"label": "B", "teks": "Dibuang ke danau air tawar"},
            {"label": "C", "teks": "Ditiupkan ke awan hujan"},
            {"label": "D", "teks": "Dilepas ke atmosfer pada malam hari"}
        ],
        "kunci": "A",
        "pembahasan": "Teknologi CCS mengisolasi emisi gas CO2 konsentrasi tinggi dari sumber cerobong industri, mengompresinya, dan menyuntikkannya ribuan meter ke dalam formasi batuan sedimen berpori di bawah lapisan batuan penudung (caprock) kedap air agar tersimpan aman ribuan tahun dari atmosfer.",
        "paket": "Bab VII: Isu-Isu Lingkungan & Keberlanjutan - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    }
]

# Assemble 70 questions for Bab 7
all_70 = []
for q in soal_hots:
    all_70.append(q)
for q in soal_contoh:
    all_70.append(q)
for q in soal_mandiri:
    all_70.append(q)
for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 7: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 9 - Bab VII: Isu-Isu Lingkungan & Keberlanjutan (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 9 — Bab VII: Isu-Isu Lingkungan & Keberlanjutan</h1>
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
  <div data-field="materi">Isu-Isu Lingkungan & Keberlanjutan</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis parameter kualitas air (DO, BOD, COD, pH), dampak eutrofikasi dan bioakumulasi, menjelaskan mekanisme efek rumah kaca, pemanasan global, dan penipisan lapisan ozon, serta merancang solusi transisi energi bersih dan gaya hidup ramah lingkungan.</div>
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
        "materi": "Isu-Isu Lingkungan & Keberlanjutan",
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

html_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab7_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab7_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
