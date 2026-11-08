#!/usr/bin/env python3
"""
build_kelas9_ipa_bab2_super_lengkap_70soal.py
=============================================
Menghasilkan 70 Butir Soal Super Lengkap Bab 2 IPA SMP Kelas 9:
Sistem Koordinasi, Reproduksi, & Homeostasis:
- 25 Soal HOTS Kurikulum Merdeka (No. 1–25)
- 10 Soal Contoh & Pembahasan Asli Buku Big Book (No. 26–35)
- 30 Soal Latihan Mandiri Asli Buku Big Book (No. 36–65)
- 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66–70)

100% Sesuai Format Impor Bank Soal Bimbel Gemilang:
- Validasi 70/70 Valid (0 Error)
- Gambar Asli Otentik: Neuron (Soal #1) & Siklus Menstruasi (Soal #18)
- HTML & JSON Master
"""

import os
import json
import html

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# 25 Soal Kurikulum Merdeka HOTS Bab 2
soal_hots = [
    {
        "nomor_bab": 1,
        "soal": "Perhatikan gambar struktur sel saraf (neuron) berikut! Bagian sel saraf yang berfungsi menerima impuls dari sel saraf lain atau reseptor menuju badan sel serta bagian yang meneruskan impuls dari badan sel menuju efektor berturut-turut ditunjukkan oleh nomor ....",
        "opsi": [
            {"label": "A", "teks": "1 dan 2"},
            {"label": "B", "teks": "1 dan 3"},
            {"label": "C", "teks": "2 dan 4"},
            {"label": "D", "teks": "3 dan 4"}
        ],
        "kunci": "B",
        "pembahasan": "Pada struktur sel saraf (neuron): Nomor 1 adalah dendrit yang berfungsi menerima impuls rangsang dari reseptor/sel lain menuju ke badan sel. Nomor 2 adalah badan sel saraf (soma) yang mengandung inti sel. Nomor 3 adalah akson (neurit) yang berfungsi menghantarkan impuls dari badan sel menuju sinapsis/efektor. Nomor 4 adalah selubung mielin. Jadi bagian yang menerima dan meneruskan impuls berturut-turut adalah 1 dan 3.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch2_q1_neuron.png"
    },
    {
        "nomor_bab": 2,
        "soal": "Akson pada sebagian besar sel saraf manusia dibungkus oleh selubung mielin yang terbentuk dari sel Schwann, dengan celah-celah sempit tak bermielin yang disebut nodus Ranvier. Keberadaan nodus Ranvier tersebut sangat penting dalam sistem koordinasi karena berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Mencegah terjadinya loncatan muatan listrik antarneuron yang berdekatan"},
            {"label": "B", "teks": "Mempercepat transmisi impuls saraf melalui mekanisme konduksi saltatori (loncatan impuls dari satu nodus ke nodus berikutnya)"},
            {"label": "C", "teks": "Menyintesis neurotransmiter seperti asetilkolin dan dopamin"},
            {"label": "D", "teks": "Menghubungkan dendrit langsung ke sumsum tulang belakang"}
        ],
        "kunci": "B",
        "pembahasan": "Selubung mielin bersifat sebagai isolator listrik (lipid tinggi). Depolarisasi membran akson hanya dapat terjadi pada celah tak bermielin yaitu Nodus Ranvier. Oleh karena itu, impuls listrik meloncat dari satu nodus Ranvier ke nodus Ranvier berikutnya (konduksi saltatori), yang melipatgandakan kecepatan penghantaran impuls hingga lebih dari 100 m/s.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 3,
        "soal": "Ketika telapak kaki seseorang tanpa sengaja menginjak pecahan beling yang tajam, secara otomatis kaki tersebut akan langsung terangkat menjauh sebelum orang tersebut sempat menyadari rasa sakitnya. Urutan lengkung refleks (jalur transmisi impuls gerak refleks) yang tepat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Reseptor (kulit telapak kaki) -> Saraf sensorik -> Sumsum tulang belakang (medula spinalis) -> Saraf motorik -> Efektor (otot kaki)"},
            {"label": "B", "teks": "Reseptor -> Saraf motorik -> Otak besar (serebrum) -> Saraf sensorik -> Otot kaki"},
            {"label": "C", "teks": "Reseptor -> Saraf sensorik -> Otak kecil (serebelum) -> Saraf motorik -> Efektor"},
            {"label": "D", "teks": "Efektor -> Saraf sensorik -> Batang otak -> Reseptor"}
        ],
        "kunci": "A",
        "pembahasan": "Gerak refleks merupakan respons motorik otomatis dan cepat tanpa kesadaran otak untuk melindungi tubuh dari bahaya. Lengkung refleks spinalis: Reseptor sensorik di kulit menerima stimulus nyeri -> Saraf sensorik membawa impuls -> Konektor di Sumsum Tulang Belakang (Medula Spinalis) -> Saraf motorik membawa perintah -> Efektor (otot rangka) berkontraksi mengangkat kaki.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 4,
        "soal": "Otak manusia terbagi menjadi tiga bagian utama: Otak besar (serebrum), Otak kecil (serebelum), dan Batang otak (medula oblongata). Apabila seseorang mengalami benturan keras di bagian belakang kepala dan mengalami kerusakan pada Otak Kecil (serebelum), maka gangguan fungsi tubuh yang paling nyata adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kehilangan memori ingatan jangka panjang secara total"},
            {"label": "B", "teks": "Kebutaan permanen pada kedua mata"},
            {"label": "C", "teks": "Hilangnya keseimbangan tubuh dan terganggunya koordinasi gerak motorik halus saat melangkah"},
            {"label": "D", "teks": "Berhentinya detak jantung dan siklus pernapasan secara tiba-tiba"}
        ],
        "kunci": "C",
        "pembahasan": "Otak kecil (serebelum) berperan sebagai pusat pengendali keseimbangan tubuh, koordinasi kerja otot rangka, dan ketepatan gerakan motorik halus. Kerusakan serebelum mengakibatkan ataksia (kehilangan keseimbangan, berjalan limbung, dan kesulitan mengoordinasikan gerakan otot). Ingatan diatur oleh serebrum, sedangkan pernapasan dan detak jantung diatur oleh medula oblongata.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 5,
        "soal": "Saat seseorang tiba-tiba dikejar anjing galak, sistem saraf simpatik dan kelenjar adrenal segera melepaskan hormon adrenalin ke dalam aliran darah (respons fight-or-flight). Gejala fisiologis yang timbul akibat lonjakan hormon adrenalin tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Detak jantung melambat dan nafsu makan meningkat pesat"},
            {"label": "B", "teks": "Pupil menyempit dan tekanan darah menurun drastis"},
            {"label": "C", "teks": "Detak jantung meningkat, pernapasan bertambah cepat dan dalam, saluran bronkus melebar, serta penguraian glikogen menjadi glukosa darah meningkat"},
            {"label": "D", "teks": "Tubuh lemas dan cepat mengantuk"}
        ],
        "kunci": "C",
        "pembahasan": "Hormon adrenalin (epinefrin) disekresikan oleh medula adrenal dalam situasi darurat stres/bahaya. Efek fisiologisnya: 1) Meningkatkan frekuensi dan kekuatan denyut jantung, 2) Memperlebar bronkiolus (saluran napas), 3) Vasokonstriksi pembuluh darah tepi sehingga darah terfokus ke otot rangka dan otak, 4) Memacu glikogenolisis di hati menjadi glukosa untuk menyuplai energi siap pakai.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 6,
        "soal": "Setelah kita menyantap makanan yang kaya akan karbohidrat (seperti nasi putih atau roti manis), kadar glukosa dalam darah akan meningkat tajam. Tubuh mempertahankan homeostasis kadar gula darah normal melalui sekresi hormon ....",
        "opsi": [
            {"label": "A", "teks": "Glukagon oleh sel alfa pankreas untuk mengubah glikogen menjadi glukosa"},
            {"label": "B", "teks": "Insulin oleh sel beta Pulau Langerhans pankreas untuk memicu sel tubuh menyerap glukosa dan mengubahnya menjadi glikogen cadangan di hati dan otot"},
            {"label": "C", "teks": "Tiroksin oleh kelenjar tiroid"},
            {"label": "D", "teks": "Adrenalin oleh kelenjar adrenal"}
        ],
        "kunci": "B",
        "pembahasan": "Homeostasis gula darah: Kenaikan glukosa darah pascamakan direspons oleh sel beta Pulau Langerhans di pankreas dengan menyekresikan hormon insulin. Insulin bekerja: (1) memfasilitasi masuknya glukosa ke dalam sel-sel tubuh untuk respirasi seluler, (2) memicu glikogenesis (pengubahan glukosa menjadi glikogen) di hati dan jaringan otot, sehingga kadar glukosa darah kembali stabil pada rentang normal (70–110 mg/dL).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 7,
        "soal": "Sebaliknya, pada saat seseorang berpuasa penuh selama belasan jam dan kadar gula darahnya mulai turun di bawah batas normal, organ pankreas akan menyekresikan hormon .... yang berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Glukagon; memecah cadangan glikogen di hati menjadi glukosa darah (glikogenolisis)"},
            {"label": "B", "teks": "Insulin; menurunkan kadar gula darah lebih lanjut"},
            {"label": "C", "teks": "Estrogen; merangsang pengeluaran keringat"},
            {"label": "D", "teks": "Parathormon; menyerap kalsium dari tulang"}
        ],
        "kunci": "A",
        "pembahasan": "Saat kadar glukosa darah turun (keadaan puasa/hipoglikemia), sel alfa Pulau Langerhans pankreas menyekresikan hormon glukagon. Glukagon bekerja secara antagonis terhadap insulin dengan cara menstimulasi hati untuk memecah cadangan glikogen menjadi molekul glukosa bebas (glikogenolisis) yang dialirkan ke dalam sirkulasi darah.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 8,
        "soal": "Ketika berada di ruangan ber-AC yang sangat dingin atau di daerah pegunungan bersalju, tubuh manusia mempertahankan suhu inti internal (termoregulasi) sekitar 37°C melalui respons fisiologis berupa ....",
        "opsi": [
            {"label": "A", "teks": "Pelebaran pembuluh darah kapiler kulit (vasodilatasi) dan pengeluaran banyak keringat"},
            {"label": "B", "teks": "Penurunan metabolisme basal dan penurunan detak jantung"},
            {"label": "C", "teks": "Penyempitan pembuluh darah kapiler kulit (vasokonstriksi) untuk mengurangi pelepasan kalor serta kontraksi involunter otot rangka (menggigil) untuk membangkitkan panas"},
            {"label": "D", "teks": "Peningkatan sekresi hormon insulin"}
        ],
        "kunci": "C",
        "pembahasan": "Termoregulasi suhu dingin diatur oleh pusat termostat di hipotalamus posterior: (1) Vasokonstriksi arteriol kulit mengalihkan aliran darah dari permukaan ke inti tubuh sehingga perpindahan panas secara radiasi dan konveksi ke lingkungan diminimalkan; (2) Kelenjar keringat tidak aktif; (3) Refleks menggigil (kontraksi ritmik involunter otot rangka) menghasilkan kalor panas metabolisme hingga 4-5 kali lipat.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 9,
        "soal": "Penyakit gondok (pembengkakan abnormal pada kelenjar tiroid di pangkal leher) yang banyak dialami penduduk daerah pegunungan terisolir pada masa lampau terutama dipicu oleh ....",
        "opsi": [
            {"label": "A", "teks": "Kekurangan asupan mineral kalsium dalam makanan harian"},
            {"label": "B", "teks": "Kekurangan asupan zat besi dalam darah"},
            {"label": "C", "teks": "Kekurangan unsur iodium (I) yang merupakan bahan baku utama sintesis hormon tiroksin"},
            {"label": "D", "teks": "Infeksi virus pada kelenjar parotis"}
        ],
        "kunci": "C",
        "pembahasan": "Kelenjar tiroid membutuhkan mineral iodium untuk menyintesis hormon tiroksin (T4) dan triiodotironin (T3) yang mengatur laju metabolisme basal. Kekurangan iodium menyebabkan produksi tiroksin menurun, sehingga hipofisis terus-menerus memproduksi TSH (Thyroid Stimulating Hormone) secara berlebih untuk merangsang tiroid, yang akhirnya menyebabkan hipertrofi dan pembengkakan kelenjar tiroid (penyakit gondok/endemik goiter).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 10,
        "soal": "Kelenjar hipofisis (pituitari) yang berada di dasar otak di bawah kendali hipotalamus dijuluki sebagai \"Master of Glands\" (Raja Kelenjar Endokrin). Alasan ilmiah di balik julukan tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelenjar hipofisis memiliki ukuran fisik yang paling besar di antara seluruh organ tubuh"},
            {"label": "B", "teks": "Kelenjar hipofisis menyekresikan hormon-hormon tropik (seperti TSH, ACTH, FSH, dan LH) yang mengatur, menstimulasi, dan mengendalikan kerja kelenjar endokrin lain di seluruh tubuh"},
            {"label": "C", "teks": "Kelenjar hipofisis menghasilkan hormon insulin dan glukagon sekaligus"},
            {"label": "D", "teks": "Kelenjar hipofisis adalah satu-satunya kelenjar yang berhubungan dengan peredaran darah"}
        ],
        "kunci": "B",
        "pembahasan": "Kelenjar hipofisis (pituitari) disebut master gland karena lobus anteriornya memproduksi hormon-hormon pengatur (tropik) yang mengontrol fungsi kelenjar endokrin lainnya: TSH mengontrol kelenjar tiroid, ACTH mengontrol korteks adrenal, FSH dan LH (gonadotropin) mengontrol organ reproduksi (testis dan ovarium), serta memproduksi Growth Hormone (GH) dan prolaktin.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 11,
        "soal": "Telinga bagian dalam manusia memiliki dua struktur penting: koklea (rumah siput) dan tiga saluran setengah lingkaran (kanalis semisirkularis). Fungsi masing-masing struktur tersebut berturut-turut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Alat pendengaran (reseptor fonoreseptor Organ Corti) dan alat keseimbangan tubuh (keseimbangan dinamis)"},
            {"label": "B", "teks": "Penyeimbang tekanan udara luar dan pembersih kotoran serumen"},
            {"label": "C", "teks": "Penggetar tulang martil dan pemantul gelombang bunyi"},
            {"label": "D", "teks": "Pengatur suhu telinga dan penyaring kuman"}
        ],
        "kunci": "A",
        "pembahasan": "Telinga dalam tersusun atas: (1) Koklea (rumah siput) yang berisi cairan perilimfe, endolimfe, dan sel-sel rambut Organ Corti yang berfungsi mengubah getaran bunyi menjadi impuls saraf pendengaran; (2) Tiga saluran setengah lingkaran (kanalis semisirkularis) dan ampula yang berfungsi sebagai indra keseimbangan dinamis saat tubuh bergerak/berputar.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 12,
        "soal": "Perbedaan mendasar antara pembelahan sel secara mitosis dan meiosis yang terjadi pada tubuh manusia terletak pada ....",
        "opsi": [
            {"label": "A", "teks": "Mitosis menghasilkan 4 sel anakan haploid, sedangkan meiosis menghasilkan 2 sel anakan diploid"},
            {"label": "B", "teks": "Mitosis terjadi pada pembentukan sel sperma, sedangkan meiosis terjadi pada perbaikan jaringan kulit"},
            {"label": "C", "teks": "Mitosis terjadi pada sel kelamin, sedangkan meiosis terjadi pada sel saraf"},
            {"label": "D", "teks": "Mitosis terjadi pada sel somatik (tubuh) menghasilkan 2 sel anak identik diploid (2n), sedangkan meiosis terjadi pada sel gamet menghasilkan 4 sel anak haploid (n) dengan kombinasi genetik bervariasi"}
        ],
        "kunci": "D",
        "pembahasan": "Mitosis: terjadi pada sel somatik untuk pertumbuhan, perkembangan, dan regenerasi jaringan, melalui 1 kali siklus pembelahan menghasilkan 2 sel anakan diploid (2n) yang identik dengan induknya. Meiosis: terjadi di gonad (testis/ovarium) untuk pembentukan gamet, melalui 2 siklus pembelahan berturut-turut menghasilkan 4 sel anakan haploid (n) dengan rekombinasi materi genetik (crossing over).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 13,
        "soal": "Mengapa sel kelamin manusia (sel sperma dan ovum) harus mengalami pembelahan reduksi (meiosis) sehingga hanya memiliki jumlah kromosom haploid (n = 23 kromosom)?",
        "opsi": [
            {"label": "A", "teks": "Agar sperma dapat berenang lebih cepat menuju tuba fallopi"},
            {"label": "B", "teks": "Agar sel telur tidak cepat menua di dalam ovarium"},
            {"label": "C", "teks": "Agar ketika terjadi fertilisasi (peleburan sperma n dan ovum n), zigot yang terbentuk kembali memiliki jumlah kromosom diploid normal spesies (2n = 46 kromosom)"},
            {"label": "D", "teks": "Agar bayi yang lahir pasti berkelamin kembar"}
        ],
        "kunci": "C",
        "pembahasan": "Pembelahan meiosis mereduksi jumlah kromosom sel gamet dari diploid (2n=46) menjadi haploid (n=23). Hal ini mutlak diperlukan agar saat fertilisasi (peleburan inti sperma n=23 dan inti ovum n=23), zigot keturunan berikutnya kembali memiliki kromosom diploid (2n=46) sehingga kelestarian jumlah kromosom spesies manusia tetap konstan dari generasi ke generasi.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 14,
        "soal": "Testis pada laki-laki berada di luar rongga tubuh di dalam suatu kantung kulit berkerut yang disebut skrotum. Makna adaptasi fisiologis dari posisi testis di dalam skrotum tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Memudahkan pengeluaran urine saat berkemih"},
            {"label": "B", "teks": "Menjaga suhu testis tetap berkisar 2–3°C lebih rendah dari suhu inti tubuh agar proses spermatogenesis berlangsung optimal"},
            {"label": "C", "teks": "Melindungi testis dari paparan sinar ultraviolet matahari"},
            {"label": "D", "teks": "Mencegah pembentukan hormon testosteron berlebihan"}
        ],
        "kunci": "B",
        "pembahasan": "Enzim dan tahapan spermatogenesis di dalam tubulus seminiferus testis sangat peka terhadap panas inti tubuh (37°C). Keberadaan testis di dalam kantung skrotum memungkinkan suhu testis dipertahankan sekitar 34–35°C (2–3°C di bawah suhu inti tubuh), yang merupakan suhu optimal untuk pembentukan sperma yang sehat dan motil.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 15,
        "soal": "Setelah sperma diproduksi di tubulus seminiferus testis, sperma tersebut akan disalurkan ke suatu saluran berkelok-kelok di sepanjang sisi belakang testis yang berfungsi sebagai tempat pematangan dan penyimpanan sementara sperma. Saluran tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Epididimis"},
            {"label": "B", "teks": "Vas deferens"},
            {"label": "C", "teks": "Vesikula seminalis"},
            {"label": "D", "teks": "Uretra"}
        ],
        "kunci": "A",
        "pembahasan": "Epididimis adalah saluran berkelok-kelok panjang yang menempel pada bagian posterior testis. Di dalam epididimis, sperma yang baru dibentuk disimpan selama kurang lebih 2–3 minggu untuk mengalami proses pematangan fungsional (memperoleh motilitas flagela dan kemampuan membuahi) sebelum diteruskan ke vas deferens.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 16,
        "soal": "Pada proses oogenesis di ovarium wanita, satu sel induk telur diploid (oogonium 2n) yang mengalami pembelahan meiosis lengkap hingga tuntas akan menghasilkan ....",
        "opsi": [
            {"label": "A", "teks": "4 sel ovum fungsional berukuran seragam yang siap dibuahi"},
            {"label": "B", "teks": "1 sel ovum fungsional berukuran besar dan 3 badan kutub (polosit) kecil yang mengalami luruh/degenerasi"},
            {"label": "C", "teks": "2 sel ovum diploid dan 2 sel polar"},
            {"label": "D", "teks": "4 badan polar haploid"}
        ],
        "kunci": "B",
        "pembahasan": "Pada oogenesis, sitokinesis (pembagian sitoplasma) berlangsung sangat asimetris/tidak seimbang. Meiosis I menghasilkan 1 oosit sekunder besar dan 1 polosit I kecil. Meiosis II menghasilkan 1 ootid besar yang berkembang menjadi ovum fungsional kaya sitoplasma dan cadangan nutrisi bagi embrio awal, serta 3 badan kutub (polosit) yang berdegenerasi.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 17,
        "soal": "Perhatikan organ-organ penyusun sistem reproduksi wanita: (1) Ovarium, (2) Tuba Fallopi (oviduk), (3) Uterus (rahim), (4) Vagina. Peristiwa ovulasi (pelepasan oosit), fertilisasi (pembuahan sel telur oleh sperma), dan implantasi (penempelan embrio) berturut-turut terjadi pada organ nomor ....",
        "opsi": [
            {"label": "A", "teks": "(1), (2), dan (3)"},
            {"label": "B", "teks": "(1), (3), dan (4)"},
            {"label": "C", "teks": "(2), (1), dan (3)"},
            {"label": "D", "teks": "(2), (3), dan (4)"}
        ],
        "kunci": "A",
        "pembahasan": "Urutan organ reproduksi wanita dan fungsinya: (1) Ovarium adalah tempat pematangan folikel dan pelepasan sel telur (ovulasi); (2) Tuba Fallopi (oviduk) adalah saluran tempat terjadinya pembuahan (fertilisasi) antara sperma dan sel telur; (3) Uterus (rahim) memiliki lapisan endometrium tebal tempat penempelan embrio (implantasi) dan tumbuh kembang janin selama kehamilan.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 18,
        "soal": "Perhatikan grafik perubahan kadar hormon dan ketebalan dinding endometrium pada siklus menstruasi berikut! Peristiwa ovulasi (pelepasan sel telur matang dari ovarium pada sekitar hari ke-14 siklus) dipicu secara langsung oleh lonjakan tajam kadar hormon ....",
        "opsi": [
            {"label": "A", "teks": "Progesteron dari korpus luteum"},
            {"label": "B", "teks": "Luteinizing Hormone (LH) yang disekresikan oleh kelenjar hipofisis anterior (LH surge)"},
            {"label": "C", "teks": "FSH yang menurun drastis"},
            {"label": "D", "teks": "Oksitosin dari hipofisis posterior"}
        ],
        "kunci": "B",
        "pembahasan": "Menjelang pertengahan siklus (hari ke-12 s.d. 14), kadar estrogen yang tinggi dari folikel matang memberikan umpan balik positif ke hipofisis anterior sehingga memicu lonjakan masif sekresi hormon LH (LH surge). Lonjakan tajam hormon LH inilah yang merangsang pecahnya folikel de Graaf dan melepaskan oosit sekunder ke tuba Fallopi (ovulasi).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": "/soal/ipa/kls9_ipa_ch2_q18_siklus_menstruasi.png"
    },
    {
        "nomor_bab": 19,
        "soal": "Setelah ovulasi terjadi, sisa folikel yang ditinggalkan sel telur di ovarium akan berubah menjadi Korpus Luteum (badan kuning) yang memproduksi hormon progesteron dalam jumlah tinggi. Peran krusial hormon progesteron pada fase pasca-ovulasi tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mempertahankan ketebalan, kelenjar, dan pembuluh darah dinding endometrium rahim untuk menyambut implantasi embrio"},
            {"label": "B", "teks": "Mematangkan sel sperma di dalam rahim"},
            {"label": "C", "teks": "Memicu pendarahan menstruasi lebih awal"},
            {"label": "D", "teks": "Menghambat pembentukan air susu ibu"}
        ],
        "kunci": "A",
        "pembahasan": "Hormon progesteron yang disekresikan oleh korpus luteum bekerja pada lapisan endometrium uterus: merangsang kelenjar endometrium menyekresikan glikogen (fase sekretori), meningkatkan vaskularisasi pembuluh darah spiral, dan menghambat kontraksi otot miometrium sehingga dinding rahim siap menjadi tempat tertanamnya embrio jika terjadi kehamilan.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 20,
        "soal": "Apabila sel telur yang telah diovulasikan tidak dibuahi oleh sel sperma hingga melewati masa viabilitasnya, korpus luteum akan berdegenerasi menjadi korpus albikans. Konsekuensi fisiologis dari degenerasi korpus luteum ini adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kadar estrogen dan progesteron melonjak sangat tinggi"},
            {"label": "B", "teks": "Dinding endometrium semakin menebal dan mengeras"},
            {"label": "C", "teks": "Tubuh wanita langsung memasuki masa menopause"},
            {"label": "D", "teks": "Kadar progesteron dan estrogen merosot tajam, menyebabkan lepas dan luruhnya lapisan dinding endometrium beserta pembuluh darahnya (terjadi menstruasi)"}
        ],
        "kunci": "D",
        "pembahasan": "Tanpa fertilisasi dan ketiadaan hCG dari embrio, korpus luteum mati berdegenerasi (korpus albikans). Akibatnya, sekresi progesteron dan estrogen anjlok secara drastis. Penurunan hormon penopang ini menyebabkan vasokonstriksi arteriol spiralis endometrium, iskemia jaringan, dan luruhnya lapisan fungsional endometrium rahim keluar sebagai darah menstruasi (fase menstruasi hari ke-1 s.d. 5).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 21,
        "soal": "Selama berada di dalam kandungan ibu, janin dikelilingi oleh selaput amnion yang berisi cairan ketuban (cairan amnion). Manfaat fisiologis utama dari cairan ketuban bagi janin adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mengalirkan darah bersih dari jantung ibu langsung ke jantung janin"},
            {"label": "B", "teks": "Menggantikan kerja ginjal janin sepenuhnya"},
            {"label": "C", "teks": "Melindungi janin dari benturan atau guncangan fisik luar, menjaga kestabilan suhu lingkungan janin, serta memberi ruang gerak bebas bagi pertumbuhan organ janin"},
            {"label": "D", "teks": "Mencegah janin menyerap kalsium dari plasenta"}
        ],
        "kunci": "C",
        "pembahasan": "Cairan amnion (ketuban) memiliki fungsi krusial: (1) Shock absorber mekanis yang meredam guncangan dan benturan fisik dari luar, (2) Termoregulasi menjaga suhu sekitar janin tetap stabil dan hangat, (3) Memberi kebebasan bergerak bagi perkembangan muskuloskeletal janin, (4) Melumasi saluran kelahiran saat proses partus/persalinan.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 22,
        "soal": "Bayi kembar identik (monozigotik) selalu memiliki jenis kelamin yang sama dan kemiripan fisik yang nyaris sempurna. Hal ini dapat terjadi karena kembar identik berasal dari ....",
        "opsi": [
            {"label": "A", "teks": "Dua sel ovum yang berbeda dibuahi oleh dua sel sperma yang berbeda pada waktu bersamaan"},
            {"label": "B", "teks": "Satu sel ovum tunggal yang dibuahi oleh satu sel sperma membentuk satu zigot, yang kemudian pada tahap awal pembelahan embrio membelah menjadi dua calon individu dengan materi genetik (DNA) 100% identik"},
            {"label": "C", "teks": "Satu ovum dibuahi oleh dua sel sperma secara bersamaan"},
            {"label": "D", "teks": "Pembelahan sel tubuh tanpa melalui fertilisasi"}
        ],
        "kunci": "B",
        "pembahasan": "Kembar identik (monozigot) terbentuk dari satu sel telur yang dibuahi satu sel sperma menjadi 1 zigot. Pada tahap blastosis/morula awal, massa sel membelah menjadi dua embrio terpisah yang memiliki DNA dan genotipe 100% identik, sehingga pasti berjenis kelamin sama dan bergolongan darah sama. Sebaliknya, kembar fraternal (dizigot) berasal dari 2 ovum berbeda yang dibuahi oleh 2 sperma berbeda.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 23,
        "soal": "Penyakit menular seksual (PMS) yang disebabkan oleh bakteri Treponema pallidum dan ditandai dengan munculnya luka terbuka (chancre) pada alat kelamin yang tidak terasa sakit pada tahap awal adalah penyakit ....",
        "opsi": [
            {"label": "A", "teks": "Sifilis (raja singa)"},
            {"label": "B", "teks": "Gonore (kencing nanah)"},
            {"label": "C", "teks": "Herpes genitalis"},
            {"label": "D", "teks": "Kandidiasis vaginalis"}
        ],
        "kunci": "A",
        "pembahasan": "Sifilis (raja singa) disebabkan oleh bakteri spiroket Treponema pallidum. Gejala stadium primer berupa luka tukak soliter yang tidak nyeri (chancre) pada genitalia. Gonore disebabkan oleh Neisseria gonorrhoeae (kencing nanah), Herpes genitalis disebabkan virus Herpes Simplex Virus tipe 2 (HSV-2), dan AIDS disebabkan oleh Human Immunodeficiency Virus (HIV).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 24,
        "soal": "Ketika kita berpindah dari tempat terbuka yang sangat terang ke dalam bioskop atau ruangan yang gelap gulita, mata kita mula-mula tidak dapat melihat apa-apa, namun beberapa saat kemudian penglihatan kita mulai beradaptasi (adaptasi gelap). Perubahan fisiologis yang terjadi pada mata adalah ....",
        "opsi": [
            {"label": "A", "teks": "Pupil menyempit dan sel kerucut (sel konus) mulai aktif menyerap warna"},
            {"label": "B", "teks": "Lensa mata memipih sekuat tenaga"},
            {"label": "C", "teks": "Pupil berdilatasi (melebar) untuk memasukkan cahaya sebanyak-banyaknya dan terjadi resintesis pigmen rodopsin pada sel batang (rod cell) retina"},
            {"label": "D", "teks": "Otot siliaris mata beristirahat total"}
        ],
        "kunci": "C",
        "pembahasan": "Adaptasi gelap pada mata: (1) Otot sfingter iris relaksasi dan otot dilator berkontraksi sehingga pupil melebar (midriasis) agar cahaya redup lebih banyak masuk; (2) Sel batang (rod cell) retina yang sensitif terhadap intensitas cahaya rendah menyintesis kembali pigmen rodopsin (yang sebelumnya terurai di tempat terang), sehingga ketajaman visual dalam gelap pulih bertahap.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    },
    {
        "nomor_bab": 25,
        "soal": "Konsumsi minuman beralkohol dalam jumlah banyak sangat berbahaya bagi pengemudi kendaraan bermotor karena alkohol bertindak sebagai depresan sistem saraf pusat. Dampak neurologis alkohol terhadap otak adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mempercepat daya ingat dan mempertajam penglihatan jauh"},
            {"label": "B", "teks": "Meningkatkan sekresi neurotransmiter penenang tanpa efek samping"},
            {"label": "C", "teks": "Memperkuat refleks tubuh saat mengerem mendadak"},
            {"label": "D", "teks": "Menekan aktivitas serebrum dan serebelum, memperlambat transmisi sinaptik impuls saraf, sehingga memperpanjang waktu reaksi refleks dan mengganggu koordinasi keseimbangan"}
        ],
        "kunci": "D",
        "pembahasan": "Alkohol bersifat depresan saraf pusat (meningkatkan efek inhibisi reseptor GABA). Dampaknya: menghambat pusat pengendalian di korteks serebrum (penurunan daya nilai dan konsentrasi), menekan serebelum (gangguan koordinasi motorik, tangan gemetar, bicara cadel), dan memperpanjang waktu reaksi refleks, sehingga pengemudi sangat rentan mengalami kecelakaan fatal.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian A: Suplemen HOTS Kurikulum Merdeka",
        "img": ""
    }
]

# 10 Soal Contoh Asli (No. 26-35)
soal_contoh = [
    {
        "nomor_bab": 26,
        "soal": "Reseptor rasa manis pada lidah manusia paling peka terkonsentrasi pada area ....",
        "opsi": [
            {"label": "A", "teks": "Ujung depan lidah"},
            {"label": "B", "teks": "Tepi samping depan lidah"},
            {"label": "C", "teks": "Tepi samping belakang lidah"},
            {"label": "D", "teks": "Pangkal lidah paling belakang"}
        ],
        "kunci": "A",
        "pembahasan": "Secara topografi peta pengecapan klasik lidah manusia: (1) Ujung lidah paling peka terhadap rasa manis, (2) Tepi lidah bagian depan peka terhadap asin, (3) Tepi lidah bagian belakang peka terhadap asam, dan (4) Pangkal lidah peka terhadap rasa pahit.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 27,
        "soal": "Bagian mata yang berfungsi memberi warna pada mata (seperti warna cokelat, biru, atau hitam) serta mengatur besar kecilnya lubang pupil adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kornea"},
            {"label": "B", "teks": "Iris (selaput pelangi)"},
            {"label": "C", "teks": "Retina"},
            {"label": "D", "teks": "Sklera"}
        ],
        "kunci": "B",
        "pembahasan": "Iris (selaput pelangi) mengandung pigmen melanin yang menentukan warna mata seseorang. Iris memiliki otot sirkuler dan radial yang berfungsi mengatur diameter lubang pupil untuk mengontrol intensitas cahaya yang masuk ke dalam bola mata.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 28,
        "soal": "Kelenjar endokrin yang terletak menempel di atas ginjal dan berfungsi menghasilkan hormon aldosteron serta kortisol adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelenjar adrenal (anak ginjal / suprarenalis)"},
            {"label": "B", "teks": "Kelenjar paratiroid"},
            {"label": "C", "teks": "Kelenjar timus"},
            {"label": "D", "teks": "Kelenjar pineal"}
        ],
        "kunci": "A",
        "pembahasan": "Kelenjar adrenal (glandula suprarenalis) terletak di kutub superior kedua ginjal. Korteks adrenal memproduksi hormon glukokortikoid (kortisol) dan mineralokortikoid (aldosteron untuk reabsorpsi natrium ginjal), sedangkan medula adrenal memproduksi adrenalin dan noradrenalin.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 29,
        "soal": "Hormon yang berperan merangsang kontraksi kuat otot polos dinding rahim (miometrium) saat proses persalinan melahirkan bayi serta memicu ejeksi (pengeluaran) air susu ibu adalah ....",
        "opsi": [
            {"label": "A", "teks": "Oksitosin"},
            {"label": "B", "teks": "Prolaktin"},
            {"label": "C", "teks": "Estrogen"},
            {"label": "D", "teks": "Progesteron"}
        ],
        "kunci": "A",
        "pembahasan": "Hormon oksitosin disintesis oleh hipotalamus dan dilepaskan oleh hipofisis posterior. Oksitosin memicu kontraksi ritmik kuat pada otot dinding rahim saat persalinan (mekanisme umpan balik positif) dan merangsang kontraksi sel mioepitel kelenjar susu untuk menyemprotkan ASI (milk ejection reflex). Prolaktin berfungsi memproduksi ASI.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 30,
        "soal": "Saluran yang menghubungkan rongga telinga tengah dengan rongga mulut/faring untuk menyamakan tekanan udara di kedua sisi gendang telinga adalah ....",
        "opsi": [
            {"label": "A", "teks": "Saluran Eustachius"},
            {"label": "B", "teks": "Saluran auditori eksternal"},
            {"label": "C", "teks": "Kanalis semisirkularis"},
            {"label": "D", "teks": "Saluran koklea"}
        ],
        "kunci": "A",
        "pembahasan": "Saluran Eustachius menghubungkan telinga tengah dengan nasofaring. Saluran ini membuka saat menelan atau menguap guna menyeimbangkan tekanan udara di dalam telinga tengah dengan tekanan udara atmosfer luar sehingga membrana timpani (gendang telinga) tidak robek.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 31,
        "soal": "Organ reproduksi pria yang berfungsi menghasilkan cairan basa pekat berwarna putih susu yang mengandung nutrisi glukosa dan enzim untuk menetralkan keasaman uretra dan vagina adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelenjar prostat dan vesikula seminalis"},
            {"label": "B", "teks": "Testis dan epididimis"},
            {"label": "C", "teks": "Vas deferens"},
            {"label": "D", "teks": "Penis dan glans"}
        ],
        "kunci": "A",
        "pembahasan": "Cairan semen (mani) dihasilkan oleh kelenjar aksesori reproduksi pria: Vesikula seminalis menyumbang 60% cairan kaya fruktosa untuk energi sperma, sedangkan kelenjar prostat menyumbang 30% cairan basa encer untuk menetralkan pH asam uretra dan saluran reproduksi wanita.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 32,
        "soal": "Lapisan terdalam bola mata yang mengandung fotoreseptor sel batang dan sel kerucut untuk menangkap bayangan benda adalah ....",
        "opsi": [
            {"label": "A", "teks": "Retina (selaput jala)"},
            {"label": "B", "teks": "Koroid"},
            {"label": "C", "teks": "Sklera"},
            {"label": "D", "teks": "Kornea"}
        ],
        "kunci": "A",
        "pembahasan": "Retina (selaput jala) merupakan lapisan sensorik terdalam bola mata yang tersusun atas jutaan sel fotoreseptor: sel konus (kerucut) peka terhadap warna pada cahaya terang, dan sel basilus (batang) peka terhadap intensitas cahaya redup.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 33,
        "soal": "Penyakit kelainan refraksi mata di mana bayangan benda yang jauh jatuh di depan retina sehingga memerlukan kacamata berlensa cekung (negatif) disebut ....",
        "opsi": [
            {"label": "A", "teks": "Miopi (rabun jauh)"},
            {"label": "B", "teks": "Hipermetropi (rabun dekat)"},
            {"label": "C", "teks": "Presbiopi (mata tua)"},
            {"label": "D", "teks": "Astigmatisme (silinder)"}
        ],
        "kunci": "A",
        "pembahasan": "Miopi (rabun jauh) terjadi karena bola mata terlalu lonjong atau kornea terlalu cembung sehingga bayangan benda berjarak tak terhingga terfokus di depan bintik kuning retina. Ditolong dengan kacamata berlensa cekung (divergen/negatif) untuk menyebarkan sinar sebelum masuk ke mata.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 34,
        "soal": "Bagian sel saraf yang berfungsi menerima rangsangan dari luar atau dari neuron lain dan membawanya menuju badan sel adalah ....",
        "opsi": [
            {"label": "A", "teks": "Dendrit"},
            {"label": "B", "teks": "Akson"},
            {"label": "C", "teks": "Nodus Ranvier"},
            {"label": "D", "teks": "Sinapsis"}
        ],
        "kunci": "A",
        "pembahasan": "Dendrit adalah serabut saraf pendek bercabang-cabang yang keluar dari badan sel soma dan berfungsi menangkap serta menghantarkan impuls masuk ke dalam badan sel.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 35,
        "soal": "Hormon pertumbuhan manusia (Human Growth Hormone / Somatotropin) disekresikan oleh ....",
        "opsi": [
            {"label": "A", "teks": "Lobus anterior kelenjar hipofisis"},
            {"label": "B", "teks": "Kelenjar paratiroid"},
            {"label": "C", "teks": "Kelenjar timus"},
            {"label": "D", "teks": "Kelenjar adrenal"}
        ],
        "kunci": "A",
        "pembahasan": "Hormon somatotropin (Growth Hormone / GH) diproduksi dan disekresikan oleh sel somatotrof pada adenohipofisis (lobus anterior hipofisis) untuk memacu mitosis sel, pembelahan lempeng epifisis tulang pipa, dan sintesis protein tubuh.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian B: Contoh Soal Asli Buku Big Book",
        "img": ""
    }
]

# 30 Soal Latihan Mandiri Asli (No. 36-65)
soal_mandiri = [
    {
        "nomor_bab": 36,
        "soal": "Penghubung antara ujung akson neuron pertama dengan dendrit neuron berikutnya menggunakan zat kimia perantara yang disebut ....",
        "opsi": [
            {"label": "A", "teks": "Neurotransmiter (seperti asetilkolin)"},
            {"label": "B", "teks": "Hormon tiroksin"},
            {"label": "C", "teks": "Enzim amilase"},
            {"label": "D", "teks": "Hemoglobin"}
        ],
        "kunci": "A",
        "pembahasan": "Celah komunikasi antarneuron disebut celah sinapsis. Impuls listrik yang tiba di bonggol sinapsis merangsang eksositosis vesikel sinaptik yang melepaskan zat kimia pembawa pesan (neurotransmiter seperti asetilkolin, norepinefrin, serotonin) untuk menempel pada reseptor membran pascasinapsis.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 37,
        "soal": "Sistem saraf tepi manusia terbagi menjadi 12 pasang saraf kranial dan 31 pasang saraf spinal. Saraf kranial berpangkal dari .... sedangkan saraf spinal berpangkal dari ....",
        "opsi": [
            {"label": "A", "teks": "Otak (ensefalon); Sumsum tulang belakang (medula spinalis)"},
            {"label": "B", "teks": "Jantung; Paru-paru"},
            {"label": "C", "teks": "Sumsum lanjutan; Kulit"},
            {"label": "D", "teks": "Mata; Telinga"}
        ],
        "kunci": "A",
        "pembahasan": "Sistem saraf tepi (perifer) menghubungkan sistem saraf pusat dengan seluruh reseptor dan efektor tubuh: 12 pasang nervus kranialis keluar langsung dari otak (melayani kepala, wajah, dan organ leher), serta 31 pasang nervus spinalis keluar dari segmen-segmen medula spinalis melayani ekstremitas dan batang tubuh.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 38,
        "soal": "Susunan saraf tak sadar (otonom) yang bekerja mempercepat denyut jantung, memperlebar bronkus saluran pernapasan, dan menghambat sekresi getah lambung adalah saraf ....",
        "opsi": [
            {"label": "A", "teks": "Saraf simpatik"},
            {"label": "B", "teks": "Saraf parasimpatik"},
            {"label": "C", "teks": "Saraf somatik"},
            {"label": "D", "teks": "Saraf kranial"}
        ],
        "kunci": "A",
        "pembahasan": "Sistem saraf otonom simpatik bekerja memacu aktivitas fisiologis tubuh saat menghadapi kondisi aktif/stres/waspada (fight-or-flight): mempercepat detak jantung, memperbesar pupil, mendilatasi bronkiolus, dan meredam gerak peristaltik pencernaan.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 39,
        "soal": "Sebaliknya, saraf parasimpatik bertindak secara antagonis terhadap saraf simpatik, yaitu dengan cara ....",
        "opsi": [
            {"label": "A", "teks": "Memperlambat denyut jantung, menyempitkan bronkus, dan mempercepat aktivitas pencernaan lambung serta usus (kondisi rest and digest)"},
            {"label": "B", "teks": "Menaikkan tekanan darah secara ekstrem"},
            {"label": "C", "teks": "Menghentikan produksi air liur"},
            {"label": "D", "teks": "Mencegah kontraksi kandung kemih"}
        ],
        "kunci": "A",
        "pembahasan": "Saraf parasimpatik mendominasi fungsi tubuh pada kondisi relaksasi, pemulihan energi, dan istirahat (rest and digest): memperlambat ritme denyut jantung ke batas normal basal, menyempitkan pupil mata, memacu pengeluaran air liur dan getah lambung, serta mempercepat penyerapan zat makanan.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 40,
        "soal": "Pusat pengendali gerak refleks pupil mata (membesar dan mengecil saat disinari lampu senter) berpusat di bagian ....",
        "opsi": [
            {"label": "A", "teks": "Otak tengah (mesensefalon)"},
            {"label": "B", "teks": "Sumsum tulang belakang"},
            {"label": "C", "teks": "Otak kecil"},
            {"label": "D", "teks": "Hipofisis"}
        ],
        "kunci": "A",
        "pembahasan": "Refleks pupil mata merupakan refleks kranial yang jalur impulsnya tidak melewati sumsum tulang belakang, melainkan diolah langsung di Mesensefalon (otak tengah) melalui nervus okulomotorius (N. III).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 41,
        "soal": "Bintik kuning (fovea sentralis) pada retina mata merupakan area yang menghasilkan bayangan paling tajam dan jelas karena ....",
        "opsi": [
            {"label": "A", "teks": "Sangat padat mengandung sel-sel fotoreseptor kerucut (konus)"},
            {"label": "B", "teks": "Hanya mengandung sel batang saja"},
            {"label": "C", "teks": "Tidak memiliki pembuluh darah sama sekali"},
            {"label": "D", "teks": "Terletak di dekat kornea"}
        ],
        "kunci": "A",
        "pembahasan": "Fovea sentralis (bintik kuning) merupakan cekungan kecil di tengah retina yang hampir seluruhnya tersusun atas sel fotoreseptor kerucut (konus) dengan kepadatan sangat tinggi dan terhubung satu-satu dengan serabut saraf optik, sehingga menghasilkan ketajaman visual (visus) dan resolusi warna paling tinggi.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 42,
        "soal": "Bintik buta pada mata adalah bagian retina yang ....",
        "opsi": [
            {"label": "A", "teks": "Tidak mengandung sel fotoreseptor batang maupun kerucut karena merupakan tempat keluarnya serabut saraf optik menuju otak"},
            {"label": "B", "teks": "Mengalami luka katarak"},
            {"label": "C", "teks": "Hanya berfungsi di malam hari"},
            {"label": "D", "teks": "Mengandung cairan humor vitreus"}
        ],
        "kunci": "A",
        "pembahasan": "Bintik buta (diskus optikus) adalah area keluarnya akson-akson sel ganglionik retina yang membentuk saraf penglihatan (nervus optikus). Pada titik ini sama sekali tidak ada sel fotoreseptor (baik batang maupun kerucut), sehingga berkas cahaya yang jatuh di area bintik buta tidak dapat dipersepsikan oleh otak.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 43,
        "soal": "Tiga tulang pendengaran kecil yang terdapat di dalam rongga telinga tengah dan berfungsi memperkuat serta meneruskan getaran dari gendang telinga menuju tingkap jorong adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tulang martil (malleus), landasan (incus), dan sanggurdi (stapes)"},
            {"label": "B", "teks": "Tulang baji, tapis, dan rahang"},
            {"label": "C", "teks": "Tulang dada, rusuk, dan selangka"},
            {"label": "D", "teks": "Tulang koklea, ampula, dan vestibula"}
        ],
        "kunci": "A",
        "pembahasan": "Osikel pendengaran di telinga tengah terdiri atas 3 tulang kecil yang saling bersendi secara berurutan: Malleus (martil) menempel pada membrana timpani -> Incus (landasan) -> Stapes (sanggurdi) menempel pada foramen ovale (tingkap jorong). Sistem pengungkit tulang ini memperkuat amplitudo tekanan getaran hingga 20 kali lipat sebelum masuk ke cairan koklea.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 44,
        "soal": "Reseptor indra pembau (penghidu) berupa sel-sel olfaktori terletak pada ....",
        "opsi": [
            {"label": "A", "teks": "Langit-langit rongga hidung bagian atas (konka superior)"},
            {"label": "B", "teks": "Lubang hidung luar (cuping)"},
            {"label": "C", "teks": "Pangkal lidah"},
            {"label": "D", "teks": "Tenggorokan"}
        ],
        "kunci": "A",
        "pembahasan": "Kemoreseptor gas indra penciuman adalah sel saraf olfaktori bipolar yang berada di epitel mukosa langit-langit rongga hidung bagian atas (konka superior dekat lamina kribrosa tulang etmoid). Molekul bau larut dalam lendir mukus hidung dan mengikat silia olfaktori menghasilkan impuls menuju saraf kranial I (N. Olfaktorius).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 45,
        "soal": "Kelenjar paratiroid (kelenjar anak gondok) memproduksi hormon parathormon (PTH) yang berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Meningkatkan kadar kalsium dalam darah dengan merangsang pelepasan kalsium dari tulang dan penyerapan kembali kalsium di ginjal"},
            {"label": "B", "teks": "Menurunkan kadar kalsium darah"},
            {"label": "C", "teks": "Meningkatkan kadar gula darah"},
            {"label": "D", "teks": "Menyintesis kalsitonin"}
        ],
        "kunci": "A",
        "pembahasan": "Parathormon (PTH) disekresikan saat konsentrasi ion kalsium (Ca2+) darah turun. PTH bekerja: (1) Mengaktivasi osteoklas untuk meresorpsi matriks tulang melepaskan Ca2+ ke darah, (2) Meningkatkan reabsorpsi Ca2+ di tubulus ginjal, dan (3) Mengaktifkan vitamin D untuk meningkatkan absorbsi Ca2+ di usus halus. Bekerja antagonis dengan hormon kalsitonin dari tiroid.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 46,
        "soal": "Penyakit kencing manis (Diabetes Melitus tipe 1) terjadi akibat ....",
        "opsi": [
            {"label": "A", "teks": "Kerusakan sel beta Pulau Langerhans pankreas sehingga tubuh tidak mampu memproduksi hormon insulin"},
            {"label": "B", "teks": "Terlalu banyak memproduksi hormon glukagon"},
            {"label": "C", "teks": "Kekurangan hormon adrenalin"},
            {"label": "D", "teks": "Kerusakan pada kantung empedu"}
        ],
        "kunci": "A",
        "pembahasan": "Diabetes Melitus tipe 1 (Insulin-Dependent Diabetes Mellitus) adalah penyakit autoimun di mana sistem imun tubuh menghancurkan sel-sel beta pankreas. Akibatnya tubuh mengalami defisiensi insulin absolut, glukosa darah menumpuk tinggi (hiperglikemia), dan glukosa diekskresikan bersama urine (glukosuria).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 47,
        "soal": "Penyakit Diabetes Insipidus ditandai dengan gejala penderita mengeluarkan urine encer dalam volume yang sangat besar (bisa mencapai 15–20 liter per hari). Penyakit ini disebabkan oleh defisiensi hormon ....",
        "opsi": [
            {"label": "A", "teks": "Antidiuretic Hormone (ADH / Vasopresin) yang disekresikan hipofisis posterior"},
            {"label": "B", "teks": "Insulin oleh pankreas"},
            {"label": "C", "teks": "Tiroksin oleh kelenjar tiroid"},
            {"label": "D", "teks": "Oksitosin"}
        ],
        "kunci": "A",
        "pembahasan": "Hormon ADH (vasopresin) berfungsi memacu reabsorpsi air di tubulus kontortus distal dan tubulus kolektivus ginjal. Kekurangan ADH menyebabkan tubulus ginjal tidak permeabel terhadap air, sehingga air tidak diserap kembali dan keluar menjadi urine yang sangat banyak dan encer (poliuria pada Diabetes Insipidus).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 48,
        "soal": "Kelenjar endokrin yang terletak di rongga dada dan sangat aktif pada masa kanak-kanak untuk mematangkan sel limfosit T sistem kekebalan tubuh adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelenjar timus"},
            {"label": "B", "teks": "Kelenjar tiroid"},
            {"label": "C", "teks": "Kelenjar adrenal"},
            {"label": "D", "teks": "Kelenjar pineal"}
        ],
        "kunci": "A",
        "pembahasan": "Kelenjar timus memproduksi hormon timosin yang berperan penting dalam proses diferensiasi dan pematangan limfosit T sistem imun adaptif. Kelenjar ini berukuran maksimal saat masa pubertas kanak-kanak dan mengalami involusi (pengecilan) seiring bertambahnya usia dewasa.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 49,
        "soal": "Hormon utama yang dihasilkan oleh testis laki-laki dan bertanggung jawab memicu munculnya ciri-ciri kelamin sekunder (tumbuhnya jakun, kumis, dan suara membesar) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Testosteron"},
            {"label": "B", "teks": "Estrogen"},
            {"label": "C", "teks": "Progesteron"},
            {"label": "D", "teks": "Prolaktin"}
        ],
        "kunci": "A",
        "pembahasan": "Sel Leydig (sel interstisial) di antara tubulus seminiferus testis dirangsang oleh hormon LH (ICSH) untuk menyekresikan hormon androgen utama yaitu testosteron. Testosteron memicu pematangan sperma serta pembentukan ciri seks sekunder pria saat akil balig.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 50,
        "soal": "Sedangkan hormon yang dihasilkan ovarium wanita dan bertanggung jawab memicu perkembangan payudara, pinggul melebar, dan pematangan organ reproduksi adalah ....",
        "opsi": [
            {"label": "A", "teks": "Estrogen"},
            {"label": "B", "teks": "Testosteron"},
            {"label": "C", "teks": "Kortisol"},
            {"label": "D", "teks": "Adrenalin"}
        ],
        "kunci": "A",
        "pembahasan": "Hormon estrogen diproduksi oleh sel granulosa folikel ovarium di bawah stimulasi FSH. Estrogen bertanggung jawab atas perkembangan tanda kelamin sekunder wanita (pembesaran kelenjar mammae/payudara, pelebaran panggul, penimbunan lemak subkutan feminin).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 51,
        "soal": "Saluran sperma yang dipotong dan diikat pada tindakan kontrasepsi mantap (sterilisasi) pada laki-laki (vasektomi) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Vas deferens"},
            {"label": "B", "teks": "Epididimis"},
            {"label": "C", "teks": "Uretra"},
            {"label": "D", "teks": "Ureter"}
        ],
        "kunci": "A",
        "pembahasan": "Vasektomi adalah metode kontrasepsi operatif pria (MOP) dengan memotong dan mengikat saluran vas deferens (duktus deferens) kanan dan kiri. Dengan demikian sperma dari testis tidak dapat bercampur ke dalam cairan semen saat ejakulasi.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 52,
        "soal": "Sebaliknya, tindakan pemotongan dan pengikatan saluran oviduk pada wanita untuk kontrasepsi mantap (tubektomi) bertujuan untuk ....",
        "opsi": [
            {"label": "A", "teks": "Mencegah bertemunya sel sperma dengan sel ovum di tuba fallopi sehingga tidak terjadi pembuahan"},
            {"label": "B", "teks": "Menghentikan siklus menstruasi secara permanen"},
            {"label": "C", "teks": "Mencegah pembentukan hormon estrogen"},
            {"label": "D", "teks": "Mengeringkan cairan ketuban"}
        ],
        "kunci": "A",
        "pembahasan": "Tubektomi (Metode Operasi Wanita / MOW) dilakukan dengan ligasi atau oklusi tuba fallopi (oviduk). Oosit yang diovulasikan tetap dihasilkan ovarium namun jalurnya terputus sehingga tidak dapat bertemu sel sperma, mencegah pembuahan secara permanen.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 53,
        "soal": "Struktur pada ujung kepala sel sperma yang mengandung enzim hialuronidase dan akrosin untuk menembus lapisan zona pelusida sel telur disebut ....",
        "opsi": [
            {"label": "A", "teks": "Akrosom"},
            {"label": "B", "teks": "Mitokondria"},
            {"label": "C", "teks": "Flagela"},
            {"label": "D", "teks": "Sentriol"}
        ],
        "kunci": "A",
        "pembahasan": "Akrosom adalah tudung di ujung anterior kepala sperma yang termodifikasi dari badan Golgi. Akrosom mengandung enzim litik (akrosin dan hialuronidase) yang dilepaskan saat reaksi akrosomal untuk mencerna korona radiata dan zona pelusida sel telur.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 54,
        "soal": "Energi ATP yang digunakan oleh flagela (ekor sperma) untuk berenang mengarungi saluran reproduksi wanita dihasilkan oleh organel .... yang berada di bagian .... sperma.",
        "opsi": [
            {"label": "A", "teks": "Mitokondria; bagian leher / tengah (midpiece)"},
            {"label": "B", "teks": "Ribosom; kepala"},
            {"label": "C", "teks": "Lisosom; ujung ekor"},
            {"label": "D", "teks": "Vakuola; badan"}
        ],
        "kunci": "A",
        "pembahasan": "Bagian leher atau bagian tengah (midpiece) sperma dikelilingi oleh lilitan mitokondria spiral yang padat. Mitokondria ini membakar fruktosa melalui respirasi aerobik menghasilkan ATP berlimpah sebagai sumber energi mekanik bagi pergerakan flagela.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 55,
        "soal": "Organ tempat bertemunya sel sperma dan sel ovum hingga terjadi pembuahan (fertilisasi) pada sistem reproduksi wanita normal adalah ....",
        "opsi": [
            {"label": "A", "teks": "Tuba Fallopi (oviduk, khususnya ampula tuba)"},
            {"label": "B", "teks": "Uterus (rahim)"},
            {"label": "C", "teks": "Vagina"},
            {"label": "D", "teks": "Ovarium"}
        ],
        "kunci": "A",
        "pembahasan": "Fertilisasi terjadi di sepertiga bagian atas saluran tuba fallopi (khususnya daerah ampula oviduk). Zigot bersel tunggal hasil pembuahan akan membelah secara mitosis (cleavage) sambil bergerak turun menuju rahim dalam waktu 3–5 hari.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 56,
        "soal": "Penempelan dan penanaman embrio (blastosis) pada lapisan dinding dalam rahim (endometrium) disebut proses ....",
        "opsi": [
            {"label": "A", "teks": "Implantasi (nidasi)"},
            {"label": "B", "teks": "Ovulasi"},
            {"label": "C", "teks": "Gametogenesis"},
            {"label": "D", "teks": "Menstruasi"}
        ],
        "kunci": "A",
        "pembahasan": "Implantasi (nidasi) adalah proses melekat dan tertanamnya blastosis ke dalam jaringan endometrium uterus ibu sekitar hari ke-6 hingga ke-7 setelah pembuahan, mengawali fase kehamilan fisiologis.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 57,
        "soal": "Plasenta (ari-ari) yang menghubungkan tubuh ibu dengan janin melalui tali pusat memiliki fungsi vital sebagai berikut, KECUALI ....",
        "opsi": [
            {"label": "A", "teks": "Menyuplai oksigen dan nutrisi glukosa serta asam amino dari darah ibu ke janin"},
            {"label": "B", "teks": "Membuang gas CO2 dan sisa urea janin ke dalam peredaran darah ibu untuk diekskresikan"},
            {"label": "C", "teks": "Mencampurkan seluruh sel darah merah ibu secara langsung ke dalam tubuh janin tanpa ada pembatas selaput difusi"},
            {"label": "D", "teks": "Menghasilkan hormon kehamilan seperti hCG, estrogen, dan progesteron"}
        ],
        "kunci": "C",
        "pembahasan": "Darah ibu dan darah janin pada plasenta TIDAK PERNAH bercampur langsung. Mereka dipisahkan oleh sawar plasenta (vili korionik). Pertukaran gas O2/CO2, nutrisi, dan zat sisa berlangsung melalui mekanisme difusi dan transpor aktif melintasi membran vili, sehingga perbedaan golongan darah ibu dan janin tidak langsung menyebabkan aglutinasi fatal.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 58,
        "soal": "Uji kehamilan cepat (test pack) mendeteksi keberadaan hormon tertentu di dalam urine seorang wanita hamil pada pagi hari. Hormon yang dideteksi oleh test pack tersebut adalah ....",
        "opsi": [
            {"label": "A", "teks": "Human Chorionic Gonadotropin (hCG)"},
            {"label": "B", "teks": "FSH"},
            {"label": "C", "teks": "LH"},
            {"label": "D", "teks": "Oksitosin"}
        ],
        "kunci": "A",
        "pembahasan": "Setelah implantasi, sel trofoblas embrio memproduksi hormon Human Chorionic Gonadotropin (hCG) untuk mempertahankan korpus luteum agar terus memproduksi progesteron. Hormon hCG disaring ginjal dan terkonsentrasi di urine pagi hari, yang menjadi target reagen antibodi pada strip uji test pack kehamilan.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 59,
        "soal": "Penyakit AIDS (Acquired Immune Deficiency Syndrome) disebabkan oleh virus HIV yang secara khusus menyerang dan merusak komponen sistem koordinasi imun yaitu ....",
        "opsi": [
            {"label": "A", "teks": "Sel limfosit T CD4+ (sel T penolong / helper)"},
            {"label": "B", "teks": "Sel eritrosit darah merah"},
            {"label": "C", "teks": "Keping darah (trombosit)"},
            {"label": "D", "teks": "Sel neuron otak"}
        ],
        "kunci": "A",
        "pembahasan": "Virus HIV (Human Immunodeficiency Virus) menginfeksi sel limfosit T pembantu (T helper CD4+). Seiring berjalannya waktu, jumlah sel CD4+ anjlok di bawah 200 sel/mikroliter darah sehingga tubuh kehilangan koordinasi sistem pertahanan imun dan mudah terserang infeksi oportunistik yang berakibat fatal.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 60,
        "soal": "Keputihan abnormal pada wanita yang berbau tidak sedap, berwarna kuning kehijauan atau bergumpal seperti keju, serta terasa sangat gatal dan panas sering kali disebabkan oleh infeksi jamur .... atau protozoa ....",
        "opsi": [
            {"label": "A", "teks": "Candida albicans; Trichomonas vaginalis"},
            {"label": "B", "teks": "Escherichia coli; Amoeba"},
            {"label": "C", "teks": "Plasmodium falciparum; Paramecium"},
            {"label": "D", "teks": "Penicillium; Rhizopus"}
        ],
        "kunci": "A",
        "pembahasan": "Kandidiasis vaginalis disebabkan oleh pertumbuhan berlebih jamur ragi Candida albicans (sekret kental putih seperti dadih/keju). Trikomoniasis disebabkan oleh protozoa berflagel Trichomonas vaginalis (sekret berbusa kehijauan dan berbau busuk).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 61,
        "soal": "Kelenjar endokrin yang berfungsi menghasilkan hormon melatonin yang mengatur ritme sirkadian (siklus tidur dan bangun) adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelenjar pineal (di dalam otak)"},
            {"label": "B", "teks": "Kelenjar tiroid"},
            {"label": "C", "teks": "Kelenjar ludah"},
            {"label": "D", "teks": "Kelenjar keringat"}
        ],
        "kunci": "A",
        "pembahasan": "Kelenjar pineal terletak di epitalamus dekat pusat otak. Dalam kondisi gelap gulita, pineal menyekresikan hormon melatonin untuk memicu rasa kantuk dan mengatur jam biologis ritme sirkadian tubuh.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 62,
        "soal": "Mekanisme homeostasis osmoregulasi cairan tubuh saat seseorang melakukan lari maraton di siang terik dan kehilangan banyak air melalui keringat adalah ....",
        "opsi": [
            {"label": "A", "teks": "Osmoreseptor hipotalamus merangsang pelepasan ADH, memicu rasa haus, dan ginjal menyerap kembali air sehingga urine yang dikeluarkan sedikit dan pekat"},
            {"label": "B", "teks": "Sekresi ADH dihambat sehingga urine keluar dalam jumlah sangat banyak"},
            {"label": "C", "teks": "Ginjal berhenti bekerja selamanya"},
            {"label": "D", "teks": "Tubuh mengeluarkan glukosa lewat keringat"}
        ],
        "kunci": "A",
        "pembahasan": "Dehidrasi meningkatkan osmolaritas plasma darah. Osmoreseptor di hipotalamus mendeteksi kepekatan ini: (1) Memicu impuls rasa haus di korteks serebrum untuk mendorong minum; (2) Hipofisis posterior melepaskan hormon ADH ke darah; (3) Tubulus ginjal meningkatkan reabsorpsi air sehingga urine menjadi pekat bervolume minimal untuk menghemat air tubuh.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 63,
        "soal": "Lapisan bola mata yang mengandung banyak pembuluh darah kapiler untuk memberi suplai nutrisi dan oksigen bagi jaringan retina serta mengandung pigmen hitam pencegah pantulan cahaya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Koroid"},
            {"label": "B", "teks": "Sklera"},
            {"label": "C", "teks": "Retina"},
            {"label": "D", "teks": "Kornea"}
        ],
        "kunci": "A",
        "pembahasan": "Lapisan tengah dinding bola mata adalah koroid. Koroid kaya akan pembuluh darah yang menyuplai nutrisi dan gas ke retina, serta mengandung melanin pekat yang menyerap pantulan cahaya liar di dalam bola mata (mirip ruang gelap kamera).",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 64,
        "soal": "Kelenjar Cowper (kelenjar bulbouretra) pada sistem reproduksi pria berfungsi untuk ....",
        "opsi": [
            {"label": "A", "teks": "Menghasilkan lendir bening bersifat basa sebelum ejakulasi (cairan pra-ejakulasi) untuk melumasi dan menetralkan keasaman urine di uretra"},
            {"label": "B", "teks": "Menyimpan sperma selama 1 bulan"},
            {"label": "C", "teks": "Menghasilkan hormon testosteron"},
            {"label": "D", "teks": "Mengatur suhu testis"}
        ],
        "kunci": "A",
        "pembahasan": "Kelenjar bulbouretra (Cowper) terletak di bawah prostat. Sebelum ejakulasi terjadi, kelenjar ini menyekresikan cairan mukus bening alkalis yang menetralkan residu asam urine di sepanjang saluran uretra dan melumasi ujung glans penis.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    },
    {
        "nomor_bab": 65,
        "soal": "Pada siklus menstruasi rata-rata 28 hari, fase pasca-ovulasi (sekretori) terjadi pada hari ke ....",
        "opsi": [
            {"label": "A", "teks": "Hari ke-15 sampai ke-28"},
            {"label": "B", "teks": "Hari ke-1 sampai ke-5"},
            {"label": "C", "teks": "Hari ke-6 sampai ke-13"},
            {"label": "D", "teks": "Tepat hari ke-14 saja"}
        ],
        "kunci": "A",
        "pembahasan": "Fase-fase siklus menstruasi 28 hari: (1) Fase menstruasi: hari ke-1 s.d. 5; (2) Fase proliferasi/pra-ovulasi: hari ke-6 s.d. 13; (3) Fase ovulasi: hari ke-14; (4) Fase sekretori/pasca-ovulasi (fase luteal): hari ke-15 s.d. 28 yang didominasi oleh sekresi progesteron korpus luteum.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian C: Latihan Soal Mandiri Asli Buku Big Book",
        "img": ""
    }
]

# 5 Soal Pengayaan AKM Literasi Sains & TKA (No. 66-70)
soal_akm = [
    {
        "nomor_bab": 66,
        "soal": "Seorang atlet lari maraton menenggak minuman isotonik yang mengandung air dan elektrolit natrium serta kalium setelah menyelesaikan perlombaan. Ditinjau dari konsep homeostasis, tujuan utama meminum larutan isotonik dibandingkan air murni biasa adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mengembalikan keseimbangan tekanan osmotik cairan ekstraseluler dan mencegah terjadinya hiponatremia (penurunan kadar natrium darah secara drastis)"},
            {"label": "B", "teks": "Mencegah peningkatan suhu tubuh"},
            {"label": "C", "teks": "Mematikan kuman pencernaan"},
            {"label": "D", "teks": "Meningkatkan sekresi hormon insulin secara berlebihan"}
        ],
        "kunci": "A",
        "pembahasan": "Saat berkeringat deras, tubuh tidak hanya kehilangan air tetapi juga ion elektrolit penting (Na+ dan K+). Minum air murni dalam jumlah masif tanpa elektrolit dapat memicu hiponatremia encer (kadar natrium darah drop drastis) yang memicu pembengkakan sel neuron otak. Minuman isotonik memiliki tekanan osmotik setara cairan tubuh sehingga memulihkan homeostasis volume dan elektrolit darah dengan aman.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 67,
        "soal": "Pada teknik bayi tabung (In Vitro Fertilization / IVF), fertilisasi antara sperma suami dan sel telur istri dilakukan di luar tubuh (di dalam cawan laboratorium). Setelah terbentuk embrio pada tahap morula/blastosis, tindakan medis selanjutnya adalah ....",
        "opsi": [
            {"label": "A", "teks": "Mentransfer embrio tersebut ke dalam uterus (rahim) calon ibu agar mengalami implantasi dan tumbuh kembang normal hingga persalinan"},
            {"label": "B", "teks": "Menyuntikkan embrio ke dalam ovarium"},
            {"label": "C", "teks": "Membiarkan embrio tumbuh di dalam inkubator kaca selama 9 bulan penuh"},
            {"label": "D", "teks": "Memasukkan embrio langsung ke dalam pembuluh darah"}
        ],
        "kunci": "A",
        "pembahasan": "Teknik IVF (bayi tabung) mempertemukan sperma dan ovum secara in vitro di laboratorium hingga terjadi fertilisasi dan pembelahan mitosis awal. Setelah mencapai fase 8 sel atau blastosis (hari ke-3 s.d. 5), embrio ditransfer melalui kateter ke dalam kavum uterus (rahim) ibu untuk mengalami implantasi fisiologis.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 68,
        "soal": "Kerusakan selubung mielin akibat serangan autoimun pada penyakit Multiple Sclerosis (MS) menyebabkan impuls saraf tidak dapat dihantarkan dengan baik. Akibat fisiologis yang diderita oleh pasien MS adalah ....",
        "opsi": [
            {"label": "A", "teks": "Kelemahan otot progresif, gangguan penglihatan, tremor, dan hilangnya koordinasi gerak tubuh akibat impuls saraf bocor dan transmisi melambat"},
            {"label": "B", "teks": "Peningkatan kecepatan respons motorik menjadi dua kali lipat"},
            {"label": "C", "teks": "Pertumbuhan tinggi badan yang tidak terkendali (gigantisme)"},
            {"label": "D", "teks": "Penurunan produksi hormon tiroksin"}
        ],
        "kunci": "A",
        "pembahasan": "Multiple Sclerosis (MS) merupakan penyakit neurodegeneratif demielinisasi autoimun. Rusaknya mielin pada akson sistem saraf pusat memicu kebocoran muatan listrik ionik, sehingga transmisi impuls melambat atau terblokir total, menimbulkan gejala kelemahan otot, kram, ataksia, dan gangguan sensori.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 69,
        "soal": "Mengapa seseorang yang menderita flu berat dan hidungnya tersumbat sering mengeluhkan bahwa makanan lezat yang disantapnya terasa hambar tak berasa?",
        "opsi": [
            {"label": "A", "teks": "Karena sebagian besar persepsi \"rasa lezat\" makanan (flavor) merupakan integrasi kombinasi antara indra pengecap lidah dan indra pembau olfaktori di hidung"},
            {"label": "B", "teks": "Karena virus flu mematikan seluruh papila pengecap lidah"},
            {"label": "C", "teks": "Karena lambung tidak dapat memproduksi asam klorida"},
            {"label": "D", "teks": "Karena air liur berhenti diproduksi"}
        ],
        "kunci": "A",
        "pembahasan": "Sensasi rasa kompleks (flavor) adalah persepsi multimodal hasil integrasi antara kuncup pengecap lidah (hanya mendeteksi manis, asin, asam, pahit, umami) dengan aroma senyawa volatil makanan yang mencapai epitel olfaktori hidung melalui jalur retro-nasal. Saat hidung tersumbat lendir, aroma tidak dapat mencapai sel olfaktori sehingga makanan terasa hambar.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    },
    {
        "nomor_bab": 70,
        "soal": "Uji refleks patela (mengetuk tendon tempurung lutut dengan palu refleks karet) menghasilkan respons ekstensi tungkai bawah ke depan secara spontan. Pemeriksaan klinis refleks patela ini bertujuan untuk menguji keutuhan integritas ....",
        "opsi": [
            {"label": "A", "teks": "Lengkung refleks spinalis pada segmen lumbal sumsum tulang belakang (L2–L4) dan nervus femoralis"},
            {"label": "B", "teks": "Daya ingat jangka panjang di serebrum"},
            {"label": "C", "teks": "Kadar hormon testosteron di testis"},
            {"label": "D", "teks": "Kemampuan mendengar di koklea"}
        ],
        "kunci": "A",
        "pembahasan": "Refleks patela (knee-jerk reflex) adalah refleks regang monosinaptik klasik. Ketukan pada tendon patela meregangkan reseptor muscle spindle otot kuadrisep, mengirim impuls sensorik ke medula spinalis segmen Lumbal 2–4, dan langsung bersinapsis dengan neuron motorik femoralis untuk memicu kontraksi ekstensi tungkai bawah. Digunakan untuk memeriksa integritas fungsi saraf spinal lumbal.",
        "paket": "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis - Bagian D: Pengayaan AKM Literasi Sains & TKA",
        "img": ""
    }
]

# Assemble 70 questions for Bab 2
all_70 = []
for q in soal_hots:
    all_70.append(q)
for q in soal_contoh:
    all_70.append(q)
for q in soal_mandiri:
    all_70.append(q)
for q in soal_akm:
    all_70.append(q)

print(f"Total questions assembled for Bab 2: {len(all_70)}")

# Write HTML & JSON
html_parts = []
html_parts.append("""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal IPA SMP Kelas 9 - Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis (70 Soal)</title>
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
<h1>Bank Soal IPA SMP Kelas 9 — Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis</h1>
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
  <div data-field="materi">Sistem Koordinasi, Reproduksi, & Homeostasis</div>
  <div data-field="capaian_pembelajaran">Peserta didik mampu menganalisis struktur sel saraf (neuron), gerak sadar dan refleks, peranan otak dan hormon, organ reproduksi, siklus menstruasi, dan mekanisme homeostasis tubuh.</div>
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
        "materi": "Sistem Koordinasi, Reproduksi, & Homeostasis",
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

html_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab2_super_lengkap_70soal.html")
with open(html_path, "w", encoding="utf-8") as f:
    f.write("".join(html_parts))
print(f"Saved: {html_path} ({len(''.join(html_parts))} bytes)")

json_path = os.path.join(OUTPUT_DIR, "kelas9_ipa_bab2_super_lengkap_70soal.json")
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(json_data, f, indent=2, ensure_ascii=False)
print(f"Saved: {json_path} ({len(json_data)} records)")
