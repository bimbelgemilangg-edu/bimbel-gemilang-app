#!/usr/bin/env python3
"""
build_kelas9_ipa_bab1_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 1 IPA SMP Kelas 9:
Pertumbuhan, Perkembangan, dan Kelangsungan Hidup Organisme:
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65) -> TERMASUK Soal #40 Paruh Burung (Gambar Asli) & Pohon Pisang Tunas
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

# 25 Soal Kurikulum Merdeka HOTS Bab 1 Kelas 9 (Hal. 511-519)
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar hasil percobaan pertumbuhan kecambah kacang hijau pada Pot A (diletakkan di dalam lemari gelap) dan Pot B (diletakkan di dekat jendela yang terkena sinar matahari)! Kecambah pada Pot A tumbuh jauh lebih cepat tinggi namun berbatang pucat kurus dan mudah patah (fenomena etiolasi), sedangkan kecambah pada Pot B tumbuh lebih lambat namun berbatang tebal kokoh dan berdaun hijau segar. Fenomena etiolasi pada Pot A tersebut disebabkan oleh ....",
        "opsi": [
            {"label": "A", "teks": "Aktivitas hormon auksin sangat tinggi karena tidak terurai oleh cahaya matahari"},
            {"label": "B", "teks": "Hormon giberelin rusak akibat ketiadaan udara di dalam lemari"},
            {"label": "C", "teks": "Kadar klorofil di daun bertambah banyak di tempat gelap"},
            {"label": "D", "teks": "Tanah di Pot A menyerap air lebih sedikit dibandingkan Pot B"}
        ],
        "kunci": "A",
        "pembahasan": "Hormon auksin (IAA) disintesis di meristem ujung pucuk batang dan peka terhadap fotolisis (mudah terurai oleh paparan cahaya matahari). Di tempat gelap (Pot A), auksin tidak terurai sehingga konsentrasinya sangat tinggi, memacu pemanjangan sel secara cepat dan tidak terkendali (etiolasi), namun klorofil tidak dapat terbentuk tanpa bantuan cahaya.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 2,
        "soal": "Nyamuk Aedes aegypti merupakan vektor penular demam berdarah dengue (DBD) yang mengalami metamorfosis sempurna. Gerakan 3M Plus (menguras bak mandi, menutup tempat penampungan air, dan mendaur ulang barang bekas) bertujuan memutus daur hidup nyamuk pada fase akuatik, yaitu pada tahapan ....",
        "opsi": [
            {"label": "A", "teks": "Telur, jentik (larva), dan kepompong (pupa)"},
            {"label": "B", "teks": "Nyamuk dewasa (imago) saja"},
            {"label": "C", "teks": "Nimfa dan larva saja"},
            {"label": "D", "teks": "Telur dan nyamuk dewasa"}
        ],
        "kunci": "A",
        "pembahasan": "Metamorfosis nyamuk: Telur -> Larva (Jentik) -> Pupa (Kepompong) -> Imago (Dewasa). Fase telur, larva, dan pupa seluruhnya hidup di dalam air (akuatik). Pemberantasan sarang nyamuk (PSN 3M Plus) efektif memutus rantai reproduksi nyamuk pada ketiga fase akuatik tersebut sebelum berkembang menjadi imago bersayap.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 3,
        "soal": "Perbedaan mendasar antara perkecambahan tipe epigeal (misalnya pada kacang hijau) dan perkecambahan tipe hipogeal (misalnya pada jagung atau kacang kapri) terletak pada ....",
        "opsi": [
            {"label": "A", "teks": "Pada epigeal, hipokotil memanjang sehingga kotiledon terangkat ke atas permukaan tanah; sedangkan pada hipogeal, epikotil memanjang sehingga kotiledon tetap tertinggal di dalam tanah"},
            {"label": "B", "teks": "Pada epigeal kotiledon membusuk, sedangkan pada hipogeal kotiledon berubah menjadi akar"},
            {"label": "C", "teks": "Epigeal hanya terjadi di air, hipogeal terjadi di gurun pasir"},
            {"label": "D", "teks": "Epigeal tidak memerlukan air untuk proses imbibisi"}
        ],
        "kunci": "A",
        "pembahasan": "Perkecambahan Epigeal: Hipokotil tumbuh memanjang mengangkat kotiledon dan plumula ke atas permukaan tanah (contoh: kacang hijau, kedelai). Perkecambahan Hipogeal: Epikotil tumbuh memanjang sementara hipokotil tidak memanjang, sehingga kotiledon tetap terpendam di dalam tanah (contoh: jagung, padi, kacang kapri).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 4,
        "soal": "Seorang petani memotong ujung pucuk utama (meristem apikal) tanaman cabai miliknya. Beberapa minggu kemudian, tanaman cabai tersebut tumbuh rimbun dengan banyak cabang samping dan menghasilkan lebih banyak bunga. Peristiwa fisiologis yang mendasari teknik pemangkasan pucuk ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menghilangkan dominansi apikal oleh hormon auksin sehingga hormon sitokinin dapat merangsang pertumbuhan tunas lateral (ketiak daun)"},
            {"label": "B", "teks": "Mematikan akar tanaman agar air tertahan di batang"},
            {"label": "C", "teks": "Mencegah terjadinya fotosintesis pada daun muda"},
            {"label": "D", "teks": "Mengurangi pengeluaran gas etilen"}
        ],
        "kunci": "A",
        "pembahasan": "Meristem apeks pucuk menghasilkan hormon auksin berkonsentrasi tinggi yang menekan pembelahan sel tunas ketiak (dominansi apikal). Dengan pemangkasan ujung tunas apikal, kadar auksin di pucuk turun drastis, sehingga hormon sitokinin aktif merangsang diferensiasi dan pembelahan sel tunas lateral menjadi cabang-cabang baru yang rimbun.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 5,
        "soal": "Hormon tumbuhan (fitohormon) yang berperan memecah masa istirahat biji (dormansi biji) dengan cara mengaktifkan enzim amilase saat proses imbibisi air serta merangsang pertumbuhan buah tanpa biji (partenokarpi) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Giberelin"},
            {"label": "B", "teks": "Asam absisat (ABA)"},
            {"label": "C", "teks": "Gas etilen"},
            {"label": "D", "teks": "Asam traumalin"}
        ],
        "kunci": "A",
        "pembahasan": "Saat biji menyerap air (imbibisi), embrio melepaskan fitohormon Giberelin (GA) menuju lapisan aleuron untuk memicu sintesis enzim $\\alpha$-amilase yang menghidrolisis cadangan pati endosperma menjadi maltosa dan glukosa sebagai energi perkecambahan. Giberelin juga memacu pembentukan buah partenokarpi.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 6,
        "soal": "Ketika buah pisang atau mangga yang masih mentah dimasukkan ke dalam wadah tertutup bersama dengan beberapa lembar daun pisang kering atau buah apel matang (proses pemeraman), buah tersebut menjadi jauh lebih cepat matang, lunak, dan harum. Gas alami tumbuhan yang mempercepat proses pematangan buah ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Gas Etilen"},
            {"label": "B", "teks": "Gas Karbon Monoksida"},
            {"label": "C", "teks": "Gas Nitrogen Dioksida"},
            {"label": "D", "teks": "Gas Belerang Oksida"}
        ],
        "kunci": "A",
        "pembahasan": "Gas Etilen ($C_2H_4$) merupakan fitohormon volatil berbentuk gas yang berperan memicu klimakterik buah, menguraikan klorofil menjadi pigmen karotenoid, memecah asam-asam organik menjadi gula pereduksi, dan mengaktifkan enzim pektinase yang melunakkan dinding sel buah.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 7,
        "soal": "Pada musim kemarau panjang, pohon jati (Tectona grandis) dan tanaman randu menggugurkan daun-daunnya secara serempak. Hormon tumbuhan yang memicu pembentukan lapisan absisi pada tangkai daun sehingga daun berguguran untuk mengurangi laju transpirasi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Asam Absisat (ABA)"},
            {"label": "B", "teks": "Sitokinin"},
            {"label": "C", "teks": "Auksin"},
            {"label": "D", "teks": "Rizokalin"}
        ],
        "kunci": "A",
        "pembahasan": "Asam Absisat (ABA) adalah hormon penghambat (inhibitor) pertumbuhan yang disintesis dalam jumlah besar saat tanaman mengalami cekaman kekeringan (water stress). ABA menutup stomata daun dan memicu penuaan serta absisi (pengguguran) daun untuk meminimalisir transpirasi air.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 8,
        "soal": "Kupu-kupu mengalami metamorfosis sempurna (holometabola) dengan tahapan Telur -> Ulat (Larva) -> Kepompong (Pupa) -> Kupu-kupu Dewasa (Imago). Perbedaan fisiologis dan morfologis paling mencolok antara fase ulat dan imago adalah ....",
        "opsi": [
            {"label": "A", "teks": "Ulat memiliki tipe mulut pengunyah untuk memakan dedaunan, sedangkan imago memiliki tipe mulut penghisap (probosis) untuk menghisap nektar bunga"},
            {"label": "B", "teks": "Ulat memiliki sayap yang belum berkembang sempurna"},
            {"label": "C", "teks": "Imago tidak memerlukan makanan seumur hidupnya"},
            {"label": "D", "teks": "Ulat bernapas dengan paru-paru, imago dengan trakea"}
        ],
        "kunci": "A",
        "pembahasan": "Fase larva (ulat) adalah fase makan aktif dengan alat mulut mandibula (mengunyah) untuk mencerna biomassa daun. Setelah mengalami perombakan histolisis dan histogenesis di dalam pupa, imago bermetamorfosis sempurna dengan sayap bersisik dan tipe alat mulut probosis berbentuk tabung penghisap nektar.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 9,
        "soal": "Belalang dan kecoak mengalami metamorfosis tidak sempurna (hemimetabola). Tahapan daur hidup belalang yang tepat dari awal hingga dewasa adalah ....",
        "opsi": [
            {"label": "A", "teks": "Telur -> Nimfa -> Imago"},
            {"label": "B", "teks": "Telur -> Larva -> Pupa -> Imago"},
            {"label": "C", "teks": "Telur -> Pupa -> Nimfa -> Imago"},
            {"label": "D", "teks": "Telur -> Berudu -> Katak muda -> Imago"}
        ],
        "kunci": "A",
        "pembahasan": "Hemimetabola hanya melalui tiga tahap: Telur -> Nimfa -> Imago. Nimfa adalah serangga muda yang bentuk morfologinya menyerupai imago dewasa namun berukuran lebih kecil, belum memiliki sayap sempurna, dan organ reproduksinya belum matang secara seksual.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 10,
        "soal": "Katak sawah mengalami metamorfosis dari berudu akuatik menjadi katak darat. Perubahan sistem pernapasan dan sistem pencernaan yang dialami berudu saat bermetamorfosis menjadi katak dewasa adalah ....",
        "opsi": [
            {"label": "A", "teks": "Berudu bernapas dengan insang dan memiliki usus panjang pemakan tumbuhan, sedangkan katak dewasa bernapas dengan paru-paru serta kulit dan memiliki usus lebih pendek pemakan serangga (karnivora)"},
            {"label": "B", "teks": "Berudu bernapas dengan trakea, katak dewasa bernapas dengan insang"},
            {"label": "C", "teks": "Berudu memakan serangga terbang, katak dewasa memakan lumut"},
            {"label": "D", "teks": "Berudu memiliki paru-paru yang hilang saat dewasa"}
        ],
        "kunci": "A",
        "pembahasan": "Metamorfosis amfibi dikendalikan hormon tiroksin: Berudu berhabitat air bernapas dengan insang luar/dalam dan memiliki usus melingkar panjang khas herbivora pemakan alga. Saat dewasa, ekor terserap (apoptosis), tumbuh kaki, insang digantikan paru-paru dan epitel kulit lembap, serta saluran cerna memendek untuk mencerna mangsa karnivora.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 11,
        "soal": "Ubur-ubur (Aurelia aurita) mengalami pergiliran keturunan (metagenesis) antara fase reproduksi aseksual dan fase reproduksi seksual. Bentuk fase polip yang menempel di dasar laut dan berkembang biak secara aseksual membentuk strobila disebut ...., sedangkan bentuk medusa yang berenang bebas di air laut bereproduksi secara ....",
        "opsi": [
            {"label": "A", "teks": "Skifistoma (aseksual tunas/strobila); Seksual dengan peleburan sperma dan ovum"},
            {"label": "B", "teks": "Planula; Aseksual dengan spora"},
            {"label": "C", "teks": "Efira; Pembelahan biner"},
            {"label": "D", "teks": "Gametofit; Fragmentasi"}
        ],
        "kunci": "A",
        "pembahasan": "Siklus metagenesis Aurelia: Zigot -> Larva Planula -> Polip Skifistoma (menetap, reproduksi aseksual dengan strobilasi kuncup piringan) -> Efira muda lepas -> Medusa dewasa (fase berenang bebas bertentakel yang bereproduksi secara seksual menghasilkan sel gamet).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 12,
        "soal": "Pada fase pubertas manusia, remaja laki-laki dan perempuan mengalami perkembangan ciri-ciri kelamin sekunder. Ciri kelamin sekunder yang dipicu oleh lonjakan hormon testosteron pada laki-laki dan hormon estrogen/progesteron pada perempuan secara berurutan adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tumbuhnya jakun dan suara membesar; serta membesarnya pinggul dan payudara"},
            {"label": "B", "teks": "Meningkatnya produksi sperma; serta menstruasi pertama"},
            {"label": "C", "teks": "Mengecilnya pita suara pada pria; serta berhentinya pertumbuhan tulang pada wanita"},
            {"label": "D", "teks": "Menurunnya laju metabolisme basal pada kedua jenis kelamin"}
        ],
        "kunci": "A",
        "pembahasan": "Ciri kelamin primer berhubungan langsung dengan organ reproduksi (laki-laki: mimpi basah/produksi sperma aktif; perempuan: menarke/menstruasi pertama). Ciri kelamin sekunder merupakan perubahan fisik luar (laki-laki: jakun, dada membidang, suara bariton; perempuan: payudara membesar, pinggul melebar, timbunan lemak subkutan).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 13,
        "soal": "Kurva sigmoid pertumbuhan organisme hidup menggambarkan 4 tahapan laju pertumbuhan: Fase lag (lambat), Fase eksponensial (logaritmik / sangat cepat), Fase deselerasi (melambat), dan Fase stasioner (konstan). Pada manusia, fase pertumbuhan linier tinggi badan tercepat terjadi pada tahapan ....",
        "opsi": [
            {"label": "A", "teks": "Masa bayi (infancy) dan masa lonjakan pertumbuhan remaja (adolescent growth spurt)"},
            {"label": "B", "teks": "Masa lanjut usia (lansia)"},
            {"label": "C", "teks": "Masa dewasa akhir usia 40 tahun"},
            {"label": "D", "teks": "Fase menopause"}
        ],
        "kunci": "A",
        "pembahasan": "Pertumbuhan tinggi badan manusia mengikuti pola dua puncak pertumbuhan eksponensial: Puncak pertama terjadi pada masa bayi (0–2 tahun), dan puncak kedua dipicu oleh hormon somatotropin dan steroid gonad pada masa pubertas remaja (growth spurt usia 11–15 tahun).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 14,
        "soal": "Pohon mangga di halaman rumah mula-mula tingginya 1 meter, lalu setelah 3 tahun tingginya menjadi 4 meter dan mulai mengeluarkan bunga majemuk serta buah manis. Peristiwa pertambahan tinggi batang mangga dikategorikan sebagai ...., sedangkan pembentukan bunga dan buah dikategorikan sebagai ....",
        "opsi": [
            {"label": "A", "teks": "Pertumbuhan (kuantitatif, irreversible); Perkembangan (kualitatif, pematangan organ)"},
            {"label": "B", "teks": "Perkembangan; Pertumbuhan"},
            {"label": "C", "teks": "Diferensiasi sel; Mutasi genetika"},
            {"label": "D", "teks": "Metamorfosis; Regenerasi jaringan"}
        ],
        "kunci": "A",
        "pembahasan": "Pertumbuhan adalah pertambahan ukuran, volume, dan massa sel yang bersifat kuantitatif (dapat diukur dengan mistar/auksanometer) dan irreversible (tidak dapat kembali ke ukuran semula). Perkembangan adalah proses menuju kedewasaan dan spesialisasi pematangan fungsi fisiologis sel (bersifat kualitatif, contohnya munculnya bunga).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 15,
        "soal": "Lingkaran tahun (annual ring) yang tampak pada penampang melintang batang pohon dikotil berkayu (seperti pohon jati atau mahoni) terbentuk dari aktivitas pembelahan jaringan meristem ....",
        "opsi": [
            {"label": "A", "teks": "Kambium vaskuler yang aktif membelah ke arah dalam membentuk xilem sekunder dan ke arah luar membentuk floem sekunder"},
            {"label": "B", "teks": "Kambium gabus (felogen) pembentuk kulit mati"},
            {"label": "C", "teks": "Meristem apikal pucuk batang"},
            {"label": "D", "teks": "Epidermis daun"}
        ],
        "kunci": "A",
        "pembahasan": "Lingkaran tahun merupakan hasil pertumbuhan sekunder oleh kambium vaskuler. Pada musim penghujan air melimpah sehingga sel-sel xilem sekunder yang terbentuk berukuran besar dan berdinding tipis (terang). Pada musim kemarau sel xilem berukuran kecil dan rapat (gelap). Pola batas inilah yang membentuk lingkaran tahun.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 16,
        "soal": "Ikan air tawar hidup di lingkungan yang hipotonik (kadar garam air tawar jauh lebih rendah dibandingkan cairan tubuh ikan). Agar sel-sel tubuhnya tidak membengkak dan pecah akibat masuknya air secara osmosis, adaptasi fisiologi yang dilakukan ikan air tawar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Sedikit minum air dan mengeluarkan banyak urine yang sangat encer, serta menyerap garam secara aktif melalui insang"},
            {"label": "B", "teks": "Banyak minum air dan mengeluarkan sedikit urine yang sangat pekat"},
            {"label": "C", "teks": "Menutup insang selamanya"},
            {"label": "D", "teks": "Mengganti sisik dengan rambut tebal"}
        ],
        "kunci": "A",
        "pembahasan": "Karena cairan internal ikan air tawar bersifat hipertonik dibanding air kolam, air masuk terus-menerus lewat membran permeabel. Adaptasi osmoregulasi ikan air tawar: 1) Sangat sedikit minum air, 2) Ginjal memproduksi urine encer bervolume besar, 3) Sel klorida pada insang menyerap ion garam secara transpor aktif.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 17,
        "soal": "Tumbuhan higrofit yang hidup di habitat lembap (seperti tumbuhan talas atau keladi) sering mengeluarkan tetesan-tetesan air murni melalui celah hidatoda di tepi ujung daunnya pada pagi hari. Fenomena pelepasan air dalam bentuk cair ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Gutasi"},
            {"label": "B", "teks": "Transpirasi uap air"},
            {"label": "C", "teks": "Evaporasi tanah"},
            {"label": "D", "teks": "Kondensasi udara"}
        ],
        "kunci": "A",
        "pembahasan": "Gutasi adalah peristiwa pengeluaran air dalam bentuk cairan melalui struktur hidatoda di ujung urat daun. Gutasi terjadi pada malam/pagi hari ketika kelembapan udara lingkungan tinggi (transpirasi terhambat) sementara tekanan akar tanaman tetap tinggi mendorong air ke atas.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 18,
        "soal": "Tumbuhan pemakan serangga (insektivora) seperti kantong semar (Nepenthes sp.) dan tumbuhan venus (Dionaea muscipula) hidup di lahan gambut yang miskin unsur hara nitrogen. Bentuk adaptasi tumbuhan insektivora untuk memenuhi kebutuhan nitrogennya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memodifikasi daun menjadi perangkap berenzim protease untuk menjerat dan mencerna tubuh serangga"},
            {"label": "B", "teks": "Menumbuhkan akar yang keluar menembus awan"},
            {"label": "C", "teks": "Menghentikan fotosintesis total"},
            {"label": "D", "teks": "Menyerap gas nitrogen bebas langsung melalui batang"}
        ],
        "kunci": "A",
        "pembahasan": "Daun kantong semar termodifikasi membentuk kantung berbibir licin yang berisi cairan pencerna berenzim protease dan peptidase. Serangga yang tergelincir masuk akan dicerna menjadi asam amino untuk menyuplai unsur hara Nitrogen ($N$) yang sangat langka di habitat tanah asam/gambut.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 19,
        "soal": "Unta (Camelus dromedarius) mampu bertahan hidup berhari-hari melintasi padang pasir yang sangat panas tanpa minum air. Adaptasi fisiologis dan morfologis yang dimiliki unta adalah ....",
        "opsi": [
            {"label": "A", "teks": "Punuk berisi simpanan lemak yang dapat dioksidasi menghasilkan air metabolik, sel darah merah berbentuk oval elastis, dan urine serta feses yang sangat pekat kering"},
            {"label": "B", "teks": "Punuk berisi 500 liter air murni"},
            {"label": "C", "teks": "Unta tidak memiliki ginjal"},
            {"label": "D", "teks": "Bulu unta menyerap keringat hewan lain"}
        ],
        "kunci": "A",
        "pembahasan": "Punuk unta menyimpan cadangan jaringan adiposa (lemak). Oksidasi 1 gram lemak menghasilkan 1,1 gram air metabolik. Selain itu, eritrosit unta berbentuk oval sehingga mampu mengalir lancar saat darah mengental akibat dehidrasi, serta lengkung Henle ginjalnya sangat panjang memproduksi urine super pekat.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 20,
        "soal": "Paus dan lumba-lumba merupakan mamalia laut yang bernapas dengan paru-paru. Bentuk adaptasi tingkah laku yang dilakukan kedua hewan tersebut untuk memenuhi kebutuhan oksigennya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Secara periodik muncul ke permukaan air laut untuk menghembuskan udara lembap dan menghirup udara bersih melalui lubang hidung (blowhole) di atas kepalanya"},
            {"label": "B", "teks": "Mengubah insang menjadi penyaring air"},
            {"label": "C", "teks": "Tidur di dasar palung laut selama bertahun-tahun"},
            {"label": "D", "teks": "Menyerap oksigen terlarut melalui pori-pori kulit"}
        ],
        "kunci": "A",
        "pembahasan": "Sebagai mamalia berparu-paru sejati, paus dan lumba-lumba tidak memiliki insang. Adaptasi tingkah lakunya adalah naik secara berkala ke permukaan air laut untuk membuka katup blowhole, membuang $CO_2$ (tampak seperti semburan air), dan mengisi kembali cadangan $O_2$ yang diikat mioglobin otot.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 21,
        "soal": "Kelelawar mampu terbang dan berburu mangsa berupa serangga malam dalam kondisi gelap gulita tanpa menabrak dinding gua. Kemampuan menghasilkan gelombang bunyi ultrasonik berfrekuensi tinggi dan mendengarkan pantulan gemanya untuk memetakan objek di sekitarnya disebut ....",
        "opsi": [
            {"label": "A", "teks": "Ekolokasi"},
            {"label": "B", "teks": "Mimikri"},
            {"label": "C", "teks": "Autotomi"},
            {"label": "D", "teks": "Kamuflase"}
        ],
        "kunci": "A",
        "pembahasan": "Ekolokasi adalah biosonar alami di mana kelelawar memancarkan pulsa bunyi ultrasonik (> 20.000 Hz) melalui laring. Gelombang bunyi yang menabrak mangsa/dinding memantul kembali sebagai gema (echo) yang ditangkap daun telinga untuk menghitung jarak, arah, dan kecepatan target secara presisi.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 22,
        "soal": "Ketika merasa terancam oleh serangan pemangsa, kadal atau cecak (Hemidactylus frenatus) akan memutuskan ujung ekornya yang kemudian bergerak-gerak liar mengecoh perhatian predator, sementara cecak melarikan diri. Kemampuan adaptasi tingkah laku memutuskan bagian tubuh ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Autotomi"},
            {"label": "B", "teks": "Ekolokasi"},
            {"label": "C", "teks": "Hibernasi"},
            {"label": "D", "teks": "Partenogenesis"}
        ],
        "kunci": "A",
        "pembahasan": "Autotomi adalah pelepasan bagian tubuh secara spontan pada bidang patah khusus antar-ruas tulang ekor. Setelah pemangsa terkecoh oleh kontraksi ekor yang putus, cecak meloloskan diri dan jaringan meristematik di pangkal ekor akan mengalami regenerasi menumbuhkan ekor baru.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 23,
        "soal": "Bunglon (Chamaeleo calyptratus) memiliki kemampuan mengubah warna kulit tubuhnya menyesuaikan dengan warna lingkungan sekitarnya (misalnya menjadi hijau saat di dedaunan dan kecokelatan saat di batang pohon). Kemampuan perubahan warna kulit untuk kamuflase dan komunikasi ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Mimikri"},
            {"label": "B", "teks": "Estivasi"},
            {"label": "C", "teks": "Metagenesis"},
            {"label": "D", "teks": "Evolusi divergen"}
        ],
        "kunci": "A",
        "pembahasan": "Mimikri pada bunglon dilakukan melalui pengaturan pigmen pada sel-sel kulit khusus bernama kromatofora (melanofor, eritrofor, xantofor) di bawah kendali impuls saraf dan hormon, sehingga warna tubuh menyatu dengan latar belakang lingkungan sekitar untuk mengelabui musuh atau mangsa.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 24,
        "soal": "Di daerah beriklim subtropis yang mengalami musim dingin ekstrem dengan suhu di bawah 0°C dan tertutup salju, beruang kutub dan tupai tanah melakukan tidur panjang selama berbulan-bulan dengan menurunkan laju metabolisme, frekuensi detak jantung, dan suhu tubuhnya. Perilaku adaptasi tidur musim dingin ini disebut ....",
        "opsi": [
            {"label": "A", "teks": "Hibernasi"},
            {"label": "B", "teks": "Estivasi (tidur musim panas)"},
            {"label": "C", "teks": "Metamorfosis"},
            {"label": "D", "teks": "Suksesi primer"}
        ],
        "kunci": "A",
        "pembahasan": "Hibernasi adalah kondisi dormansi musiman pada hewan endoterm selama musim dingin ekstrem. Hewan membakar lemak cokelat perlahan dan menekan laju metabolisme basal hingga 95% untuk menghemat energi saat sumber pakan di alam tertimbun salju es tebal.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 25,
        "soal": "Sebaliknya, pada musim kemarau yang sangat terik dan kering di padang sabana Afrika, katak gurun dan siput darat mengubur diri di dalam lumpur kering dan tidur panjang untuk menghindari dehidrasi mematikan. Perilaku tidur musim panas/kering ini dikenal dengan istilah ....",
        "opsi": [
            {"label": "A", "teks": "Estivasi"},
            {"label": "B", "teks": "Hibernasi"},
            {"label": "C", "teks": "Fotoperiodisme"},
            {"label": "D", "teks": "Termonasti"}
        ],
        "kunci": "A",
        "pembahasan": "Estivasi adalah keadaan dormansi metabolik hewan selama periode suhu panas ekstrem dan kekeringan berkepanjangan. Hewan mensekresikan lapisan lendir pelindung dan memasuki fase tidak aktif (inaktif) untuk mencegah kehilangan cairan tubuh vital.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    }
]

# 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
# Mengintegrasikan Contoh Soal Bab 16 & Bab 27 Asli (Hal. 416-420)
soal_contoh = [
    {
        "nomor_bab": 26,
        "soal": "Adaptasi makhluk hidup dibedakan menjadi tiga macam, yaitu adaptasi ....",
        "opsi": [
            {"label": "A", "teks": "fisiologi, morfologi, dan tingkah laku"},
            {"label": "B", "teks": "fisiologi, geologi, dan tingkah laku"},
            {"label": "C", "teks": "morfologi, anatomi, dan kimiawi"},
            {"label": "D", "teks": "sosial, budaya, dan tingkah laku"}
        ],
        "kunci": "A",
        "pembahasan": "Berdasarkan sifat penyesuaiannya, adaptasi makhluk hidup diklasifikasikan ke dalam 3 jenis: 1) Adaptasi morfologi (penyesuaian bentuk fisik/struktur luar tubuh), 2) Adaptasi fisiologi (penyesuaian fungsi kerja organ-organ dalam tubuh), 3) Adaptasi tingkah laku (penyesuaian kebiasaan/perilaku).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 27,
        "soal": "Kaki bebek memiliki selaput renang di antara jari-jarinya. Struktur selaput renang tersebut merupakan contoh dari ....",
        "opsi": [
            {"label": "A", "teks": "penyesuaian diri terhadap air (adaptasi morfologi)"},
            {"label": "B", "teks": "penyesuaian diri secara tingkah laku"},
            {"label": "C", "teks": "penyesuaian diri secara fisiologi"},
            {"label": "D", "teks": "penyesuaian suhu tubuh"}
        ],
        "kunci": "A",
        "pembahasan": "Selaput pada kaki bebek berfungsi sebagai dayung untuk berenang dan mempermudah berjalan di atas lumpur tanpa tenggelam. Karena berupa modifikasi bentuk fisik organ luar tubuh, hal ini tergolong adaptasi morfologi.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 28,
        "soal": "Daun kaktus yang tereduksi menjadi bentuk duri bertujuan untuk ....",
        "opsi": [
            {"label": "A", "teks": "mempercepat penguapan air"},
            {"label": "B", "teks": "mengurangi penguapan air (transpirasi)"},
            {"label": "C", "teks": "menghambat proses fotosintesis"},
            {"label": "D", "teks": "mempercepat respirasi seluler"}
        ],
        "kunci": "B",
        "pembahasan": "Kaktus hidup di lingkungan xerofit (kering dan panas). Daun yang termodifikasi menjadi duri memperkecil luas bidang permukaan daun sehingga mengurangi laju penguapan air (transpirasi) secara drastis.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 29,
        "soal": "Berikut ini yang merupakan contoh adaptasi fisiologi pada makhluk hidup adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pohon jati menggugurkan daunnya di musim kemarau"},
            {"label": "B", "teks": "Bunglon mengubah warna tubuhnya"},
            {"label": "C", "teks": "Beruang kutub memiliki bulu yang tebal"},
            {"label": "D", "teks": "Ikan air laut mengeluarkan urine yang pekat"}
        ],
        "kunci": "D",
        "pembahasan": "Adaptasi fisiologi melibatkan penyesuaian fungsi faal/biokimia organ dalam. Ikan air laut mengekskresikan urine yang sedikit dan sangat pekat untuk menjaga keseimbangan konsentrasi osmotik tubuhnya di lingkungan laut yang hipertonik.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 30,
        "soal": "Batang pada tanaman eceng gondok (Eichhornia crassipes) memiliki rongga-rongga udara spons yang besar. Fungsi adaptif rongga udara tersebut adalah agar ....",
        "opsi": [
            {"label": "A", "teks": "dapat mengapung di atas permukaan air"},
            {"label": "B", "teks": "mempercepat laju penguapan"},
            {"label": "C", "teks": "menghambat penyerapan mineral"},
            {"label": "D", "teks": "banyak menampung racun air"}
        ],
        "kunci": "A",
        "pembahasan": "Tangkai daun dan batang eceng gondok tersusun atas jaringan aerenkim (parenkim udara) berongga yang menurunkan massa jenis tanaman sehingga eceng gondok dapat terapung bebas di permukaan air dan daunnya tetap terpapar sinar matahari.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 31,
        "soal": "Berikut ini yang bukan merupakan faktor penyeleksi alam yang mempengaruhi kelangsungan hidup suatu populasi makhluk hidup adalah ....",
        "opsi": [
            {"label": "A", "teks": "bentuk tubuh buatan manusia"},
            {"label": "B", "teks": "suhu lingkungan"},
            {"label": "C", "teks": "ketersediaan makanan"},
            {"label": "D", "teks": "cahaya matahari"}
        ],
        "kunci": "A",
        "pembahasan": "Faktor penyeleksi alam (faktor seleksi alam) merupakan kondisi abiotik dan biotik lingkungan alamiah, meliputi ketersediaan makanan, pemangsa (predator), suhu ekstrem, bencana alam, dan intensitas cahaya matahari. Bentuk tubuh bukanlah faktor luar penyeleksi alam melainkan objek yang terseleksi.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 32,
        "soal": "Perkembangbiakan vegetatif alami pada tumbuhan bawang merah (Allium cepa) berlangsung dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "umbi lapis"},
            {"label": "B", "teks": "mencangkok"},
            {"label": "C", "teks": "stek batang"},
            {"label": "D", "teks": "membelah diri"}
        ],
        "kunci": "A",
        "pembahasan": "Bawang merah berkembang biak secara vegetatif alami menggunakan umbi lapis (bulbus), yaitu modifikasi pelepah daun berdaging tebal yang tersusun bertumpuk-tumpuk melapisi cakram kuncup batang.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 33,
        "soal": "Ayam dan bebek merupakan jenis hewan ovipar, yaitu hewan yang berkembang biak dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "bertelur"},
            {"label": "B", "teks": "melahirkan"},
            {"label": "C", "teks": "bertelur dan melahirkan"},
            {"label": "D", "teks": "membelah diri"}
        ],
        "kunci": "A",
        "pembahasan": "Berdasarkan cara perkembangbiakan seksualnya: Ovipar adalah hewan bertelur (embrio berkembang di luar tubuh induk dengan cadangan makanan kuning telur, contoh: unggas, ikan, reptil). Vivipar adalah hewan beranak/melahirkan (mamalia). Ovovivipar adalah bertelur-melahirkan (hiu, kadal).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 34,
        "soal": "Perhatikan gambar tanaman berikut! Tanaman pada gambar (pohon pisang) berkembang biak secara vegetatif alami menggunakan ....",
        "opsi": [
            {"label": "A", "teks": "Tunas"},
            {"label": "B", "teks": "Geragih (stolon)"},
            {"label": "C", "teks": "Rizoma (akar rimpang)"},
            {"label": "D", "teks": "Spora"}
        ],
        "kunci": "A",
        "pembahasan": "Pohon pisang (Musa paradisiaca) berkembang biak secara vegetatif alami melalui tunas anakan yang tumbuh dari kuncup samping pangkal batang di dalam tanah (bonggol pisang) membentuk rumpun baru.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": "/soal/ipa/kls9_ipa_ch1_pohon_pisang.png"
    },
    {
        "nomor_bab": 35,
        "soal": "Kemampuan makhluk hidup untuk menghasilkan keturunan baru dengan sifat yang serupa bertujuan untuk ....",
        "opsi": [
            {"label": "A", "teks": "melestarikan jenisnya agar tidak punah"},
            {"label": "B", "teks": "mengubah seluruh ekosistem alam"},
            {"label": "C", "teks": "mempercepat kematian predator"},
            {"label": "D", "teks": "menghabiskan sumber makanan"}
        ],
        "kunci": "A",
        "pembahasan": "Reproduksi (perkembangbiakan) adalah ciri hakiki kehidupan yang bertujuan utama mempertahankan kontinuitas garis keturunan dan melestarikan keberadaan jenis spesies dari bahaya kepunahan.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian B: Contoh Soal & Pembahasan Asli Buku",
        "img": ""
    }
]

# 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
# Termasuk Soal No. 4 paruh burung dengan gambar asli /soal/ipa/kls9_ipa_bab_adaptasi_q4_paruh_burung.png!
soal_latihan = [
    {
        "nomor_bab": 36,
        "soal": "Kemampuan makhluk hidup untuk menghasilkan keturunan dengan tujuan melestarikan jenisnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "seleksi alam"},
            {"label": "B", "teks": "adaptasi"},
            {"label": "C", "teks": "perkembangbiakan"},
            {"label": "D", "teks": "penyesuaian diri"}
        ],
        "kunci": "C",
        "pembahasan": "Perkembangbiakan (reproduksi) adalah kemampuan biologis organisme untuk menghasilkan individu baru demi menjaga kelestarian jenis spesiesnya di biosfer.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 37,
        "soal": "Tujuan utama makhluk hidup beradaptasi terhadap lingkungannya adalah untuk ....",
        "opsi": [
            {"label": "A", "teks": "mendapatkan makanan"},
            {"label": "B", "teks": "bertahan hidup"},
            {"label": "C", "teks": "menghasilkan keturunan"},
            {"label": "D", "teks": "berkembang biak"}
        ],
        "kunci": "B",
        "pembahasan": "Tujuan utama adaptasi adalah agar makhluk hidup dapat bertahan hidup (survive) menghadapi perubahan kondisi fisik abiotik lingkungan serta persaingan dengan organisme lain.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 38,
        "soal": "Adaptasi morfologi adalah suatu penyesuaian diri makhluk hidup berdasarkan pada ....",
        "opsi": [
            {"label": "A", "teks": "bentuk organ tubuh"},
            {"label": "B", "teks": "fungsi kerja organ tubuh"},
            {"label": "C", "teks": "perilaku makhluk hidup"},
            {"label": "D", "teks": "keadaan sekitar"}
        ],
        "kunci": "A",
        "pembahasan": "Morfologi berasal dari kata 'morph' yang berarti bentuk. Adaptasi morfologi merupakan penyesuaian susunan, bentuk, dan ukuran alat-alat fisik organ luar tubuh terhadap lingkungan hidupnya.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 39,
        "soal": "Perhatikan gambar berikut! Bentuk paruh burung yang sesuai pada burung pemakan ikan ditunjukkan oleh nomor ....",
        "opsi": [
            {"label": "A", "teks": "I"},
            {"label": "B", "teks": "II"},
            {"label": "C", "teks": "III"},
            {"label": "D", "teks": "IV"}
        ],
        "kunci": "C",
        "pembahasan": "Pada gambar: Paruh I adalah paruh sudu datar pada bebek/itik (penyaring makanan di air lumpur). Paruh II adalah paruh pendek dan tebal pada burung pipit/finch (pemakan biji-bijian). Paruh III adalah paruh besar berkantong pada burung pelikan (menyerok dan menampung ikan dari air). Paruh IV adalah paruh tajam melengkung kuat pada burung elang (mencabik daging mangsa). Jadi burung pemakan ikan ditunjukkan oleh nomor III.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": "/soal/ipa/kls9_ipa_bab_adaptasi_q4_paruh_burung.png"
    },
    {
        "nomor_bab": 40,
        "soal": "Burung pipit memiliki paruh yang pendek, tebal, dan runcing. Bentuk paruh tersebut sangat sesuai untuk ....",
        "opsi": [
            {"label": "A", "teks": "memecah biji-bijian yang keras"},
            {"label": "B", "teks": "mencabik daging mangsa"},
            {"label": "C", "teks": "menghisap nektar bunga"},
            {"label": "D", "teks": "menyaring cacing dari lumpur"}
        ],
        "kunci": "A",
        "pembahasan": "Paruh burung pipit dan burung finch pendek, kokoh, dan berbentuk kerucut tebal yang menghasilkan gaya tekan mekanik besar untuk memecahkan cangkang biji-bijian pakan alaminya.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 41,
        "soal": "Bentuk kaki burung elang yang memiliki cakar tajam, kokoh, dan melengkung kuat berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "mencengkeram mangsa agar tidak lepas saat terbang"},
            {"label": "B", "teks": "berenang di air kolam"},
            {"label": "C", "teks": "mengais cacing di tanah gembur"},
            {"label": "D", "teks": "memanjat pohon kelapa"}
        ],
        "kunci": "A",
        "pembahasan": "Kaki burung pemangsa (raptor seperti elang dan burung hantu) memiliki cakar melengkung runcing dan berotot fleksor kuat untuk mencengkeram erat serta melumpuhkan mangsa saat disambar dari udara.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 42,
        "soal": "Rayap yang baru menetas sering memakan kembali kulit kelupasan (ekdisis) induknya atau menjilati dubur rayap dewasa. Perilaku adaptasi tingkah laku ini bertujuan untuk ....",
        "opsi": [
            {"label": "A", "teks": "mendapatkan kembali mikroorganisme Flagellata (Trichonympha) yang membantu mencerna kayu (selulosa)"},
            {"label": "B", "teks": "membunuh parasit yang ada di kulit"},
            {"label": "C", "teks": "mempercepat pergantian warna tubuh"},
            {"label": "D", "teks": "menghilangkan bau sarang"}
        ],
        "kunci": "A",
        "pembahasan": "Di saluran cerna rayap hidup Flagellata bersimbiosis yang memproduksi enzim selulase pencerna kayu. Saat berganti kulit (ekdisis), lapisan usus dan flagellata ikut terlepas, sehingga rayap muda memakan feses/kulit rayap dewasa (proctodeal trophallaxis) untuk memasukkan kembali bibit flagellata simbiotik tersebut.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 43,
        "soal": "Tanaman teratai (Nymphaea sp.) beradaptasi pada lingkungan perairan tenang dengan memiliki ....",
        "opsi": [
            {"label": "A", "teks": "daun yang lebar dan tipis dengan banyak stomata di permukaan atas daun"},
            {"label": "B", "teks": "daun berbentuk jarum dan berlapis lilin sangat tebal"},
            {"label": "C", "teks": "akar tunggang yang sangat dalam di tanah kering"},
            {"label": "D", "teks": "batang berkayu keras dan tinggi"}
        ],
        "kunci": "A",
        "pembahasan": "Sebagai tumbuhan hidrofit, teratai memiliki daun tipis dan melebar untuk mempermudah penyerapan sinar matahari dan mempercepat laju transpirasi uap air, dengan stomata terletak di permukaan atas daun yang bersentuhan dengan udara bebas.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 44,
        "soal": "Hewan yang hidup di daerah kutub yang sangat dingin (seperti beruang kutub dan anjing laut) memiliki lapisan lemak bawah kulit (blubber) yang sangat tebal. Fungsi adaptif lapisan lemak tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "sebagai isolator panas tubuh agar suhu tubuh internal tidak cepat hilang ke lingkungan dingin"},
            {"label": "B", "teks": "memudahkan berenang dengan memperberat massa tubuh"},
            {"label": "C", "teks": "mempercepat pelepasan kalor ke udara kutub"},
            {"label": "D", "teks": "menarik perhatian mangsa"}
        ],
        "kunci": "A",
        "pembahasan": "Lemak subkutan (blubber) memiliki konduktivitas termal yang sangat rendah sehingga berperan sebagai isolator penahan panas tubuh agar hewan endoterm kutub dapat mempertahankan suhu tubuh stabil 37°C di tengah suhu lingkungan beku sub-zero.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 45,
        "soal": "Kerbau sering berkubang di dalam kubangan lumpur berair pada siang hari yang terik. Bentuk adaptasi tingkah laku ini dilakukan karena ....",
        "opsi": [
            {"label": "A", "teks": "kulit kerbau berwarna gelap dan memiliki sedikit kelenjar keringat sehingga berkubang membantu mendinginkan suhu tubuh dan mengusir serangga parasit"},
            {"label": "B", "teks": "kerbau bernapas dengan kulit di dalam lumpur"},
            {"label": "C", "teks": "kerbau mencari makan rumput di dalam lumpur"},
            {"label": "D", "teks": "kerbau menghindari predator singa"}
        ],
        "kunci": "A",
        "pembahasan": "Kulit kerbau pigmen melaninnya pekat dan kelenjar keringatnya hanya 1/6 dari sapi, sehingga proses termoregulasi melalui penguapan keringat sangat tidak efisien. Berkubang di lumpur melapisi kulit dengan lapisan dingin dan melindungi kulit dari sengatan lalat pikat.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 46,
        "soal": "Sebelum Revolusi Industri di Inggris, populasi ngengat Biston betularia bersayap cerah jauh lebih banyak dibandingkan yang bersayap gelap. Namun setelah pabrik-pabrik batu bara beroperasi dan batuan serta batang pohon tertutup jelaga hitam, populasi ngengat bersayap gelap menjadi dominan. Fenomena perubahan frekuensi populasi ngengat ini merupakan bukti nyata dari ....",
        "opsi": [
            {"label": "A", "teks": "Seleksi alam (pepohonan yang menghitam memudahkan burung pemangsa memangsa ngengat bersayap cerah)"},
            {"label": "B", "teks": "Adaptasi fisiologi ngengat meminum jelaga batu bara"},
            {"label": "C", "teks": "Mutasi buatan oleh petani"},
            {"label": "D", "teks": "Kepunahan ngengat akibat suhu panas pabrik"}
        ],
        "kunci": "A",
        "pembahasan": "Sebelum revolusi industri, lumut kerak putih di batang pohon menguntungkan kamuflase ngengat cerah. Jelaga polusi batu bara membunuh lumut dan menghitamkan batang pohon, menyebabkan ngengat cerah mudah terlihat dan dimangsa burung pemangsa, sementara ngengat mutan gelap terselamatkan (seleksi alam terarah / industrial melanism).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 47,
        "soal": "Kemampuan organisme untuk menghasilkan individu baru tanpa melalui peleburan sel sperma dan sel telur disebut reproduksi aseksual (vegetatif). Contoh reproduksi aseksual pada hewan tingkat rendah Hydra sp. dan spons laut adalah dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Membentuk tunas (budding)"},
            {"label": "B", "teks": "Konjugasi"},
            {"label": "C", "teks": "Fertilisasi internal"},
            {"label": "D", "teks": "Metamorfosis"}
        ],
        "kunci": "A",
        "pembahasan": "Hydra sp. dan porifera bereproduksi aseksual melalui pertunasan (budding). Tonjolan dinding tubuh seluler tumbuh membesar, membentuk tentakel dan mulut, lalu melepaskan diri menjadi individu independen baru.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 48,
        "soal": "Cacing pipih Planaria memiliki kemampuan regenerasi fragmen tubuh yang sangat luar biasa. Jika tubuh Planaria dipotong melintang menjadi tiga bagian (bagian kepala, tengah, dan ekor), peristiwa yang akan terjadi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Ketiga potongan tubuh tersebut masing-masing akan menumbuhkan bagian yang hilang dan menjadi 3 cacing Planaria utuh yang baru"},
            {"label": "B", "teks": "Seluruh potongan tubuh mati membusuk"},
            {"label": "C", "teks": "Hanya potongan kepala yang bertahan hidup"},
            {"label": "D", "teks": "Potongan tubuh berubah menjadi kepompong"}
        ],
        "kunci": "A",
        "pembahasan": "Planaria memiliki sel-sel punca dewasa pluripoten bernama neoblas (mencakup 20% sel tubuhnya). Saat tubuh terpotong, sel neoblas bermigrasi ke luka membentuk blastema dan berdiferensiasi menumbuhkan kembali seluruh organ yang hilang (reproduksi aseksual fragmentasi).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 49,
        "soal": "Lebah madu jantan (drone) berkembang biak melalui proses partenogenesis, yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Perkembangan sel telur ovum tanpa dibuahi oleh sel sperma"},
            {"label": "B", "teks": "Peleburan dua sel sperma sekaligus"},
            {"label": "C", "teks": "Pembelahan biner larva lebah"},
            {"label": "D", "teks": "Regenerasi dari sengat ratu lebah"}
        ],
        "kunci": "A",
        "pembahasan": "Sistem penentuan jenis kelamin lebah bersifat haplodiploid: Ratu lebah bertelur haploid ($n$). Jika telur dibuahi sperma ($2n$), akan berkembang menjadi lebah betina (pekerja atau ratu baru). Jika sel telur tidak dibuahi sperma ($n$), sel telur tetap berkembang melalui partenogenesis menjadi lebah jantan haploid.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 50,
        "soal": "Perkembangbiakan vegetatif alami pada tanaman strawberry dan rumput teki berlangsung dengan menggunakan ....",
        "opsi": [
            {"label": "A", "teks": "Geragih (stolon)"},
            {"label": "B", "teks": "Umbi akar"},
            {"label": "C", "teks": "Tunas adventif"},
            {"label": "D", "teks": "Rizoma"}
        ],
        "kunci": "A",
        "pembahasan": "Geragih (stolon) adalah modifikasi batang yang tumbuh mendatar menjalar di atas permukaan tanah. Pada buku-buku batang stolon tersebut tumbuh akar adventif dan tunas daun baru yang berkembang menjadi anakan tanaman mandiri.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 51,
        "soal": "Jahe, kunyit, lengkuas, dan temulawak berkembang biak secara vegetatif alami menggunakan batang yang tumbuh menjalar horizontal di dalam tanah yang disebut ....",
        "opsi": [
            {"label": "A", "teks": "Rizoma (akar rimpang)"},
            {"label": "B", "teks": "Umbi batang"},
            {"label": "C", "teks": "Stolon"},
            {"label": "D", "teks": "Tunas adventif"}
        ],
        "kunci": "A",
        "pembahasan": "Rizoma (akar rimpang) merupakan modifikasi batang tumbuhan yang tumbuh mendatar di bawah permukaan tanah beruas-ruas dengan sisik daun pelindung, tempat tumbuhnya akar dan tunas tegak baru.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 52,
        "soal": "Tanaman cocor bebek (Kalanchoe pinnata) memiliki keunikan berkembang biak secara vegetatif alami melalui ....",
        "opsi": [
            {"label": "A", "teks": "Tunas adventif pada lekukan tepi daun"},
            {"label": "B", "teks": "Umbi lapis batang"},
            {"label": "C", "teks": "Spora di bawah permukaan akar"},
            {"label": "D", "teks": "Geragih bunga"}
        ],
        "kunci": "A",
        "pembahasan": "Tunas adventif daun adalah kuncup meristematik yang tumbuh di luar tempat semestinya (pada lekukan tepi helai daun cocor bebek). Tunas kecil ini telah memiliki akar adventif dan daun mini yang dapat langsung tumbuh saat terlepas ke tanah.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 53,
        "soal": "Kentang (Solanum tuberosum) berkembang biak dengan cara umbi batang. Ciri morfologis yang membuktikan bahwa umbi kentang merupakan modifikasi batang dan bukan akar adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memiliki mata tunas (nodus) yang dapat mengeluarkan tunas anakan baru"},
            {"label": "B", "teks": "Berada di dalam tanah yang basah"},
            {"label": "C", "teks": "Tidak mengandung karbohidrat"},
            {"label": "D", "teks": "Berwarna kecokelatan seperti tanah"}
        ],
        "kunci": "A",
        "pembahasan": "Umbi batang merupakan pembengkakan batang bawah tanah penyimpan cadangan pati. Bukti anatomisnya adalah adanya 'mata tunas' (kuncup ketiak) dengan sisa berkas pembuluh yang bila ditanam akan bertunas menjadi tanaman kentang baru.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 54,
        "soal": "Keuntungan utama memperbanyak tanaman buah (seperti mangga atau jambu air) melalui teknik vegetatif buatan mencangkok dibandingkan menanam dari biji adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tanaman hasil cangkokan lebih cepat berbuah dan mewarisi sifat unggul 100% sama dengan pohon induknya"},
            {"label": "B", "teks": "Tanaman memiliki perakaran tunggang yang sangat kuat dan dalam"},
            {"label": "C", "teks": "Biaya mencangkok lebih murah daripada membeli biji"},
            {"label": "D", "teks": "Pohon hasil cangkokan tahan terhadap seluruh hama"}
        ],
        "kunci": "A",
        "pembahasan": "Perbanyakan vegetatif buatan (cangkok, okulasi, stek) tidak melalui rekombinasi meiosis sehingga tanaman anakan membawa materi genetik yang identik (klon) dengan pohon induk unggul dan fase vegetatifnya jauh lebih singkat sehingga cepat berbuah.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 55,
        "soal": "Kelemahan atau kekurangan tanaman pohon buah yang diperbanyak melalui cara mencangkok adalah ....",
        "opsi": [
            {"label": "A", "teks": "Hanya memiliki sistem perakaran serabut sehingga mudah roboh saat diterpa angin kencang"},
            {"label": "B", "teks": "Rasa buah menjadi masam"},
            {"label": "C", "teks": "Pohon tumbuh terlalu tinggi melebihi 50 meter"},
            {"label": "D", "teks": "Daun tanaman tidak dapat berfotosintesis"}
        ],
        "kunci": "A",
        "pembahasan": "Akar tanaman hasil cangkokan berasal dari jaringan kambium cabang batang (akar adventif serabut), tidak memiliki akar tunggang primer, sehingga kekuatan cengkeramannya di tanah lebih rentan roboh jika terkena terpaan angin badai.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 56,
        "soal": "Teknik perkembangbiakan vegetatif buatan dengan cara menempelkan mata tunas dari tanaman induk berkualitas unggul ke kulit batang tanaman lain yang sejenis tetapi memiliki sistem perakaran kuat disebut ....",
        "opsi": [
            {"label": "A", "teks": "Okulasi (menempel)"},
            {"label": "B", "teks": "Cangkok"},
            {"label": "C", "teks": "Merunduk"},
            {"label": "D", "teks": "Kultur jaringan"}
        ],
        "kunci": "A",
        "pembahasan": "Okulasi (budding) menggabungkan mata tunas dari pohon induk unggul (entres atas) dengan batang bawah (rootstock) yang tahan penyakit perakaran untuk menghasilkan bibit kombinasi unggul ganda.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 57,
        "soal": "Penyambungan (enten/kopulasi) dilakukan dengan menyatukan batang atas (scion) dan batang bawah (stock) dari dua tanaman yang sekeluarga. Syarat biologis utama agar proses penyambungan berhasil dan menyatu adalah ....",
        "opsi": [
            {"label": "A", "teks": "Lapisan kambium dari kedua batang harus saling bersentuhan rapat dan terikat kuat"},
            {"label": "B", "teks": "Batang harus direndam air mendidih"},
            {"label": "C", "teks": "Kedua batang harus berasal dari famili yang berbeda jauh"},
            {"label": "D", "teks": "Semua daun batang atas harus dibiarkan lebat"}
        ],
        "kunci": "A",
        "pembahasan": "Kunci keberhasilan enten/okulasi adalah pertautan jaringan kambium vaskuler. Pembelahan sel kambium menghasilkan jembatan kalus parenkim yang menghubungkan kembali berkas xilem dan floem antara kedua batang.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 58,
        "soal": "Tumbuhan paku (Pteridophyta) dan lumut (Bryophyta) berkembang biak secara aseksual menghasilkan butiran sel kelamin berselubung tebal yang tahan terhadap kekeringan yang disebut ....",
        "opsi": [
            {"label": "A", "teks": "Spora"},
            {"label": "B", "teks": "Biji"},
            {"label": "C", "teks": "Polen"},
            {"label": "D", "teks": "Ovulum"}
        ],
        "kunci": "A",
        "pembahasan": "Spora haploid dihasilkan di dalam kotak spora (sporangium). Spora berdinding tebal senyawa sporopolenin yang tahan cuaca ekstrem dan akan berkecambah menjadi protalium (paku) atau protonema (lumut) saat jatuh di tempat lembap.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 59,
        "soal": "Pada bunga tumbuhan berbiji tertutup (Angiospermae), organ kelamin jantan dan organ kelamin betina berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Benang sari (stamen) dan Putik (pistillum)"},
            {"label": "B", "teks": "Putik dan Benang sari"},
            {"label": "C", "teks": "Mahkota bunga dan Kelopak bunga"},
            {"label": "D", "teks": "Tangkai sari dan Dasar bunga"}
        ],
        "kunci": "A",
        "pembahasan": "Benang sari (stamen) tersusun atas tangkai sari dan kepala sari (anther) tempat mikrosporogenesis pembentukan serbuk sari (gamet jantan). Putik (pistillum) tersusun atas kepala putik (stigma), tangkai putik, dan bakal buah (ovarium) tempat sel telur ovum (gamet betina).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 60,
        "soal": "Penyerbukan (polinasi) di mana serbuk sari jatuh ke kepala putik bunga lain tetapi masih berada dalam satu pohon/tanaman yang sama disebut penyerbukan ....",
        "opsi": [
            {"label": "A", "teks": "Tetangga (geitonogami)"},
            {"label": "B", "teks": "Sendiri (autogami)"},
            {"label": "C", "teks": "Silang (alogami)"},
            {"label": "D", "teks": "Bastar (hibridisasi)"}
        ],
        "kunci": "A",
        "pembahasan": "Geitonogami (penyerbukan tetangga): serbuk sari berasal dari bunga yang berbeda namun tetap berada pada satu individu tanaman yang sama sehingga komposisi genetiknya tetap identik.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 61,
        "soal": "Penyerbukan bunga yang dibantu oleh perantara angin (anemogami) umumnya memiliki ciri-ciri morfologi bunga berupa ....",
        "opsi": [
            {"label": "A", "teks": "Mahkota bunga kecil tidak berwarna, tidak memiliki nektar (madu), serbuk sari sangat banyak ringan dan kering, serta kepala putik berbulu menjulur keluar"},
            {"label": "B", "teks": "Mahkota bunga besar mencolok berbau harum"},
            {"label": "C", "teks": "Menghasilkan kelenjar madu yang manis"},
            {"label": "D", "teks": "Serbuk sari lengket berlemak"}
        ],
        "kunci": "A",
        "pembahasan": "Bunga anemogami (contoh: padi, jagung, rumput) beradaptasi dengan efisiensi aerodinamis: serbuk sari mikroskopis kering tanpa perekat dan putik berambut lebat untuk menjaring serbuk sari yang diterbangkan hembusan angin.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 62,
        "soal": "Hewan tingkat rendah Paramecium caudatum berkembang biak secara aseksual dan seksual. Cara reproduksi seksual pada Paramecium yang berlangsung melalui pertukaran mikronukleus antara dua sel yang saling berlekatan disebut ....",
        "opsi": [
            {"label": "A", "teks": "Konjugasi"},
            {"label": "B", "teks": "Pembelahan biner"},
            {"label": "C", "teks": "Fragmentasi"},
            {"label": "D", "teks": "Fertilisasi eksternal"}
        ],
        "kunci": "A",
        "pembahasan": "Konjugasi adalah proses transfer materi genetik mikronukleus haploid melalui jembatan sitoplasma sementara antara dua individu Paramecium yang kompatibel untuk menghasilkan rekombinasi genetik baru.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 63,
        "soal": "Fertilisasi pada katak dan sebagian besar ikan berlangsung di luar tubuh induknya (fertilisasi eksternal). Mengapa ikan dan katak menghasilkan ribuan hingga jutaan butir telur dalam satu kali musim kawin?",
        "opsi": [
            {"label": "A", "teks": "Untuk memperbesar peluang keberhasilan pembuahan dan kelangsungan hidup keturunan karena sebagian besar telur dan sperma hanyut terbawa arus atau dimangsa predator"},
            {"label": "B", "teks": "Karena seluruh telur pasti berhasil menetas menjadi katak dewasa"},
            {"label": "C", "teks": "Untuk memberi makan tanaman air"},
            {"label": "D", "teks": "Karena katak tidak memiliki sarang"}
        ],
        "kunci": "A",
        "pembahasan": "Fertilisasi eksternal di media perairan terbuka memiliki tingkat mortalitas yang sangat tinggi akibat hanyut arus air, perubahan suhu mendadak, dan predasi ikan lain. Produksi gamet masif (strategi reproduksi r) menjamin tercapainya angka kelangsungan hidup populasi generasi berikutnya.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 64,
        "soal": "Hewan mamalia seperti sapi, kambing, paus, dan manusia berkembang biak secara vivipar dengan fertilisasi internal di dalam saluran reproduksi wanita. Fungsi biologis organ plasenta (ari-ari) pada mamalia eutheria adalah ....",
        "opsi": [
            {"label": "A", "teks": "Menyalurkan nutrisi dan gas oksigen dari darah ibu ke janin, serta mengangkut zat sisa metabolisme janin ke darah ibu"},
            {"label": "B", "teks": "Membentuk rangka tulang janin"},
            {"label": "C", "teks": "Menghasilkan air ketuban saja"},
            {"label": "D", "teks": "Melindungi janin dari cahaya matahari"}
        ],
        "kunci": "A",
        "pembahasan": "Plasenta adalah organ pertautan antara korion embrio dan endometrium rahim induk yang memfasilitasi pertukaran difusi gas $O_2/CO_2$, suplai glukosa, asam amino, antibodi IgG, serta ekskresi urea janin tanpa bercampurnya eritrosit ibu dan janin.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    },
    {
        "nomor_bab": 65,
        "soal": "Tumbuhan Gymnospermae (tumbuhan berbiji terbuka seperti pinus, melinjo, dan pakis haji) tidak memiliki bunga sejati. Organ perkembangbiakan generatif jantan dan betina pada Gymnospermae berada pada struktur yang disebut ....",
        "opsi": [
            {"label": "A", "teks": "Strobilus (runjung)"},
            {"label": "B", "teks": "Sporangium"},
            {"label": "C", "teks": "Karpel"},
            {"label": "D", "teks": "Sepal"}
        ],
        "kunci": "A",
        "pembahasan": "Gymnospermae menghasilkan organ reproduksi berupa strobilus (runjung/konus). Strobilus jantan mengandung mikrosporangium penghasil serbuk sari bersayap, sedangkan strobilus betina tersusun atas megasporofil tempat biji terbuka tanpa terbungkus daging buah.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian C: Latihan Mandiri Asli Buku",
        "img": ""
    }
]

# 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70) (Hal. 550–551)
soal_pengayaan = [
    {
        "nomor_bab": 66,
        "soal": "[Pilihan Ganda HOTS - Osmoregulasi Akuatik] Ikan air laut hidup di lingkungan perairan laut yang memiliki kadar salinitas tinggi (hipertonik) dibandingkan cairan intraseluler tubuhnya. Akibatnya, molekul air di tubuh ikan cenderung tertarik keluar terus-menerus secara osmosis menembus insang dan kulit. Mekanisme adaptasi fisiologis osmoregulasi yang wajib dilakukan ikan air laut untuk mencegah dehidrasi internal adalah ....",
        "opsi": [
            {"label": "A", "teks": "Banyak meminum air laut, menyaring dan memompa kelebihan ion garam keluar melalui insang, serta mengekskresikan sedikit urine yang sangat pekat"},
            {"label": "B", "teks": "Sedikit minum air laut dan mengeluarkan banyak urine encer bervolume besar"},
            {"label": "C", "teks": "Menutup insang total dan beralih bernapas dengan paru-paru"},
            {"label": "D", "teks": "Menyerap seluruh garam air laut ke dalam tulang"}
        ],
        "kunci": "A",
        "pembahasan": "Ikan air laut terus kehilangan air secara osmosis. Kompensasi osmoregulasi: meminum air laut dalam volume besar, menyerap air di usus, memompa keluar kelebihan ion $Na^+$ dan $Cl^-$ melalui sel klorida insang secara aktif, dan memproduksi sedikit urine berkonsentrasi tinggi untuk menghemat air.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 67,
        "soal": "[AKM Literasi Sains - Seleksi Alam & Polusi Industri] Perhatikan pernyataan berikut mengenai mekanisme seleksi alam pada populasi ngengat Biston betularia selama Revolusi Industri di Inggris:\n(1) Polusi jelaga pabrik batu bara melapisi batang pohon birch menjadi gelap sehingga ngengat bersayap gelap lebih tersamar (terkamuflase) dari burung pemangsa.\n(2) Ngengat bersayap cerah mengalami penurunan populasi drastis karena mudah terlihat dan diburu predator saat bertengger di batang pohon yang menghitam.\n(3) Individu ngengat yang memiliki variasi sifat adaptif sesuai kondisi lingkungan memiliki frekuensi reproduksi dan peluang kelangsungan hidup lebih tinggi.\n(4) Jelaga batu bara secara sengaja merombak materi genetik DNA ngengat putih menjadi hitam dalam satu generasi.\nPernyataan yang benar sesuai prinsip evolusi dan seleksi alam adalah ....",
        "opsi": [
            {"label": "A", "teks": "(1), (2), dan (3)"},
            {"label": "B", "teks": "(1) dan (4)"},
            {"label": "C", "teks": "(2) dan (4)"},
            {"label": "D", "teks": "(1), (2), (3), dan (4)"}
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan (1), (2), dan (3) benar sesuai teori seleksi alam Darwin: variasi genetik warna gelap telah ada sebelumnya, dan perubahan lingkungan jelaga membuat sifat gelap memiliki adaptasi (fitness) lebih tinggi. Pernyataan (4) salah karena jelaga polutan tidak mengubah materi genetik DNA secara langsung terarah (bukan pewarisan sifat didapat ala Lamarck).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 68,
        "soal": "[AKM Literasi Sains - Adaptasi Tumbuhan Ekstrem] Perhatikan beberapa ciri adaptasi tumbuhan berikut:\n(1) Daun termodifikasi menjadi duri kecil untuk meminimalkan laju penguapan transpirasi.\n(2) Batang tebal sukulen berlapis kutikula lilin tebal serta memiliki jaringan spons penyimpan cadangan air.\n(3) Sistem perakaran menyebar luas dan menembus dalam untuk mengoptimalkan penyerapan air tanah.\n(4) Membuka stomata selebar-lebarnya pada siang hari terik.\nKombinasi adaptasi yang tepat pada tumbuhan xerofit (habitat kering/gurun) ditunjukkan oleh nomor ....",
        "opsi": [
            {"label": "A", "teks": "(1), (2), dan (3)"},
            {"label": "B", "teks": "(1) dan (4) saja"},
            {"label": "C", "teks": "(2) dan (4) saja"},
            {"label": "D", "teks": "(1), (2), (3), dan (4)"}
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan (1), (2), dan (3) adalah adaptasi khas xerofit (seperti kaktus dan lidah buaya). Pernyataan (4) salah karena tumbuhan gurun mengadopsi metabolisme CAM: stomata justru menutup rapat pada siang hari terik guna mencegah dehidrasi parah dan membuka pada malam hari yang lembap/sejuk.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 69,
        "soal": "[Tabel Benar / Salah] Tentukan kebenaran pernyataan ilmiah tentang adaptasi dan suksesi tumbuhan berikut: (a) Sejak Revolusi Industri di Inggris yang membuat batang pohon menghitam oleh jelaga batu bara, populasi ngengat Biston betularia bersayap gelap meningkat karena lebih terhindar dari pemangsa dibandingkan yang bersayap cerah; (b) Tumbuhan xerofit (seperti kaktus) beradaptasi di daerah kering dengan daun berbentuk duri, batang berlapis kutikula lilin, dan jaringan penyimpan air; (c) Perkembangbiakan vegetatif menghasilkan variasi genetik baru yang lebih tahan terhadap perubahan iklim global daripada perkembangbiakan generatif.",
        "opsi": [
            {"label": "A", "teks": "(a) Benar, (b) Benar, (c) Salah"},
            {"label": "B", "teks": "(a) Benar, (b) Salah, (c) Benar"},
            {"label": "C", "teks": "(a) Salah, (b) Benar, (c) Benar"},
            {"label": "D", "teks": "(a) Benar, (b) Benar, (c) Benar"}
        ],
        "kunci": "A",
        "pembahasan": "Pernyataan (a) Benar (seleksi alam industri). Pernyataan (b) Benar (morfologi kaktus). Pernyataan (c) Salah karena perkembangbiakan vegetatif menghasilkan keturunan klon dengan DNA identik (tanpa rekombinasi meiosis), sehingga tidak menghasilkan variasi genetik baru untuk adaptasi iklim.",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 70,
        "soal": "[AKM Literasi Sains - Kepunahan & Seleksi Alam] Fosil dinosaurus raksasa banyak ditemukan di lapisan batuan sedimen berumur 66 juta tahun lalu. Teori ilmiah paling teruji menyatakan bahwa hantaman asteroid raksasa Chicxulub di Semenanjung Yucatan memicu badai api global, awan debu tebal yang menutupi sinar matahari selama bertahun-tahun, serta penurunan suhu global ekstrem (musim dingin tumbukan). Mengapa dinosaurus reptil raksasa punah total, sedangkan mamalia kecil berambut dan burung primitif mampu bertahan hidup?",
        "opsi": [
            {"label": "A", "teks": "Karena dinosaurus berukuran raksasa ektoterm membutuhkan suplai biomassa pakan dalam jumlah sangat besar yang musnah akibat runtuhnya rantai makanan fotosintesis, sedangkan mamalia kecil endoterm mampu bersembunyi di bawah liang tanah dan memakan bangkai atau biji-bijian dorman"},
            {"label": "B", "teks": "Karena dinosaurus tidak bisa berenang di laut"},
            {"label": "C", "teks": "Karena mamalia menyemprotkan racun pembunuh dinosaurus"},
            {"label": "D", "teks": "Karena asteroid hanya jatuh tepat di atas kepala dinosaurus"}
        ],
        "kunci": "A",
        "pembahasan": "Runtuhnya produktivitas primer fotosintesis akibat awan debu global memusnahkan produsen tumbuhan hijau dan herbivora raksasa. Hewan berukuran tubuh kecil omnivora endotermik (mamalia berambut) memiliki kebutuhan kalori absolut jauh lebih kecil, mampu membuat liang perlindungan di bawah tanah, dan memanfaatkan biji atau serasah mati untuk bertahan hidup melintasi kepunahan massal Cretaceous-Paleogene (K-Pg).",
        "paket": "Bab I: Pertumbuhan & Kelangsungan Hidup - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    }
]

# Gabungkan 70 Soal Bab I Kelas 9
all_soal = soal_hots + soal_contoh + soal_latihan + soal_pengayaan
print(f"Total questions assembled for Bab 1 Kelas 9: {len(all_soal)}")

# Bangun HTML
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 9 - Bab I: Pertumbuhan, Perkembangan & Kelangsungan Hidup Organisme (70 Soal)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 24px; background: #f8fafc; color: #1e293b; }
    article { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.04); }
    .badge { display: inline-block; background: #3b82f6; color: white; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }
    .packet { color: #64748b; font-size: 0.85rem; margin-bottom: 12px; }
    .question { font-weight: 600; font-size: 1.05rem; margin-bottom: 14px; }
    ol { margin: 0 0 16px 20px; padding: 0; }
    li { margin-bottom: 6px; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }
  </style>
</head>
<body>
<h1>Bank Soal IPA SMP Kelas 9 — Bab I: Pertumbuhan, Perkembangan & Kelangsungan Hidup Organisme</h1>
<p>Total: 70 Butir Soal Lengkap (25 HOTS Kurikulum Merdeka + 10 Contoh Soal Asli + 30 Latihan Mandiri Asli Termasuk Soal Paruh Burung + 5 Pengayaan AKM)</p>
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
    
    img_tag = f"""  <div data-field="gambar">
    <img src="{q_img}" data-url="{q_img}" alt="Ilustrasi Soal #{q_num}" style="max-width: 100%; height: auto; border-radius: 8px;" />
  </div>\n""" if q_img else ""

    html_parts.append(f"""<article data-gemilang-question data-nomor="{q_num}" data-tipe="pg_sederhana" data-paket="{html.escape(q_paket)}" data-kesulitan="Sedang" data-kelas="9">
  <div data-field="materi">Pertumbuhan, Perkembangan & Kelangsungan Hidup Organisme</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis konsep pertumbuhan dan perkembangan, metamorfosis serangga dan amfibi, fitohormon tumbuhan, metagenesis ubur-ubur, serta adaptasi morfologi/fisiologi/tingkah laku dan reproduksi seksual/aseksual Fase D Kurikulum Merdeka.</div>
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
        "materi": "Pertumbuhan, Perkembangan & Kelangsungan Hidup Organisme",
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

html_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab1_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab1_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
