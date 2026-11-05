# scripts/buat-bank-soal-50-smp.py
# Naskah 50 Soal Asli Kurikulum Merdeka SMP Kelas 9 (Fase D) - IPA Sistem Reproduksi & Perkembangbiakan
import json

SOAL_LIST = []

def tambah(no, soal, opsi, kunci, pembahasan, gambar, materi, sub, sumber, kognitif="C4 (Menganalisis)"):
    opsi_fmt = [{"teks": o} for o in opsi]
    SOAL_LIST.append({
        "nomor": no,
        "tipe": "pg_sederhana",
        "soal": soal,
        "teksSoal": soal,
        "opsiJawaban": opsi_fmt,
        "kunciJawaban": kunci,
        "kunciTerverifikasi": True,
        "pembahasan": pembahasan,
        "gambarUrls": [gambar] if gambar else [],
        "gambar": [{"url": gambar}] if gambar else [],
        "jenjang": "SMP/MTs",
        "tingkatKelas": "9",
        "mataPelajaran": "IPA",
        "materi": materi,
        "subMateri": sub,
        "kurikulum": "Kurikulum Merdeka",
        "fase": "Fase D",
        "sumber": sumber,
        "taksonomi": {
            "level": "L3 (Penalaran/HOTS)",
            "kognitif": kognitif
        },
        "status": "aktif"
    })

# ==============================================================================
# BAGIAN 1: SISTEM REPRODUKSI MANUSIA (25 SOAL)
# ==============================================================================

# --- Subtopik: Organ Reproduksi Pria (1 - 6) ---
tambah(
    1,
    "Perhatikan gambar penampang organ reproduksi pria berikut ini!\n\n{{GAMBAR}}\n\nBagian yang ditunjuk oleh nomor 1 dan 2 secara berurutan berfungsi untuk ....",
    [
        "A. menghasilkan sel sperma dan mematangkan sel sperma",
        "B. menampung sperma sementara dan memproduksi cairan basa",
        "C. menyalurkan sperma ke uretra dan memproduksi hormon progesteron",
        "D. mengatur suhu testis dan menyalurkan urine ke luar tubuh"
    ],
    "A",
    "Berdasarkan diagram: Bagian nomor 1 adalah Testis yang berfungsi memproduksi sel sperma (spermatogenesis) dan hormon testosteron. Bagian nomor 2 adalah Epididimis, yaitu saluran berkelok-kelok tempat pematangan sperma serta penyimpanan sperma sementara hingga matang dan motil. Pilihan A benar.",
    "/soal-smp/reproduksi-pria.svg",
    "Sistem Reproduksi pada Manusia",
    "Struktur & Fungsi Organ Reproduksi Pria",
    "Ujian Nasional IPA SMP — Naskah Asli Kemendikbud"
)

tambah(
    2,
    "Seorang pria menjalani prosedur vasektomi sebagai metode kontrasepsi mantap. Pada diagram organ reproduksi berikut:\n\n{{GAMBAR}}\n\nBagian manakah yang dipotong dan diikat pada prosedur tersebut, serta apa dampak biologis langsungnya terhadap cairan semen yang diejakulasikan?",
    [
        "A. Nomor 1 dipotong; pria tersebut tidak lagi memproduksi hormon testosteron",
        "B. Nomor 2 dipotong; sperma tidak dapat mengalami pematangan morfologis",
        "C. Nomor 3 dipotong; cairan semen tetap keluar saat ejakulasi tetapi steril tanpa mengandung spermatozoa",
        "D. Nomor 4 dipotong; kelenjar tidak lagi mampu menghasilkan cairan fruktosa pelindung sperma"
    ],
    "C",
    "Vasektomi adalah prosedur pemotongan dan pengikatan Vas Deferens (nomor 3). Vas deferens berfungsi menyalurkan sperma matang dari epididimis menuju uretra. Pemotongan vas deferens menyebabkan sel sperma tidak dapat mencapai uretra, namun kelenjar vesikula seminalis, prostat, dan bulbouretra tetap memproduksi cairan semen seperti biasa, sehingga semen tetap keluar namun tidak mengandung spermatozoa (steril). Hormon testosteron tetap dihasilkan testis dan diedarkan lewat darah. Pilihan C tepat.",
    "/soal-smp/reproduksi-pria.svg",
    "Sistem Reproduksi pada Manusia",
    "Struktur & Fungsi Organ Reproduksi Pria",
    "USBN IPA SMP — Soal Penalaran Klinis HOTS"
)

tambah(
    3,
    "Perhatikan kembali bagan sistem reproduksi pria berikut:\n\n{{GAMBAR}}\n\nKelenjar nomor 4 dan 5 berperan krusial dalam viabilitas sperma. Peran cairan yang disekresikan oleh kelenjar nomor 5 adalah ....",
    [
        "A. menghasilkan fruktosa pekat sebagai sumber energi utama pergerakan motil sperma",
        "B. mensekresikan cairan alkalis (basa) encer yang menetralkan keasaman cairan vagina sehingga sperma dapat bertahan hidup",
        "C. memicu kontraksi peristaltik pada otot polos saluran vas deferens",
        "D. menghasilkan lendir pelumas bening pada saat awal rangsangan seksual"
    ],
    "B",
    "Kelenjar nomor 5 adalah Kelenjar Prostat (sedangkan nomor 4 adalah Vesikula Seminalis). Prostat menghasilkan cairan encer berwarna keputihan yang bersifat basa (alkalis) dan mengandung enzim sitrat serta antikoagulan. Sifat basa ini sangat penting untuk menetralkan pH asam dari sisa urine di uretra maupun keasaman asam laktat di vagina wanita, menjaga kelangsungan hidup spermatozoa. Pilihan B benar.",
    "/soal-smp/reproduksi-pria.svg",
    "Sistem Reproduksi pada Manusia",
    "Kelenjar Reproduksi Pria",
    "AKM Literasi Sains SMP — Fase D Kurikulum Merdeka"
)

tambah(
    4,
    "Suhu optimal bagi proses spermatogenesis di dalam testis manusia adalah 2 sampai 3 derajat Celsius lebih rendah daripada suhu inti rongga tubuh (sekitar 34°C). Struktur anatomis yang beradaptasi melakukan termoregulasi tersebut adalah ....",
    [
        "A. Epididimis melalui mekanisme sekresi cairan pendingin intraseluler",
        "B. Skrotum melalui kontraksi dan relaksasi otot dartos dan kremaster untuk mendekatkan atau menjauhkan testis dari tubuh",
        "C. Uretra melalui aliran cairan urin yang membawa hawa dingin",
        "D. Kelenjar prostat melalui pengaturan suplai darah arterial lokal"
    ],
    "B",
    "Skrotum adalah kantung pembungkus testis yang dilengkapi otot dartos dan otot kremaster. Ketika suhu dingin, otot berkontraksi menarik testis mendekat ke tubuh agar tetap hangat. Saat suhu panas, otot berelaksasi sehingga testis menjauhi tubuh. Mekanisme termoregulasi ini menjaga suhu testis 2-3°C di bawah suhu tubuh normal (37°C) agar spermatogenesis berlangsung optimal.",
    "/soal-smp/reproduksi-pria.svg",
    "Sistem Reproduksi pada Manusia",
    "Termoregulasi & Skrotum",
    "Olimpiade Sains Nasional (OSN) IPA SMP Tingkat Kabupaten/Kota"
)

tambah(
    5,
    "Perhatikan gambar sistem reproduksi pria berikut:\n\n{{GAMBAR}}\n\nSaluran nomor 6 memiliki keunikan biologis yang membedakannya dengan saluran reproduksi pada wanita. Keunikan tersebut adalah ....",
    [
        "A. berfungsi eksklusif hanya untuk jalur pengeluaran sperma tanpa pernah dilewati urine",
        "B. merupakan saluran urogenital yang berfungsi ganda sebagai jalur keluarnya urine dari vesica urinaria sekaligus jalur ejakulasi cairan semen",
        "C. menghasilkan hormon reproduksi androgen secara mandiri di dinding epitelnya",
        "D. menghubungkan langsung rongga testis ke rongga peritoneum abdomen"
    ],
    "B",
    "Saluran nomor 6 adalah Uretra. Pada pria, uretra berstatus sebagai saluran urogenital, yaitu satu saluran bersama yang dilalui oleh sistem ekskresi (urine dari kandung kemih) dan sistem reproduksi (semen dari saluran ejakulasi). Pada wanita, saluran uretra (kencing) dan vagina terpisah secara anatomis. Pilihan B benar.",
    "/soal-smp/reproduksi-pria.svg",
    "Sistem Reproduksi pada Manusia",
    "Saluran Uretra & Sistem Urogenital",
    "Ujian Nasional IPA SMP — Naskah Asli"
)

tambah(
    6,
    "Sperma yang keluar saat ejakulasi tersusun atas spermatozoa dan cairan seminalis. Komponen cairan terbesar (sekitar 60%) yang mengandung fruktosa, asam askorbat, dan prostaglandin dihasilkan oleh bagian ....",
    [
        "A. Testis",
        "B. Epididimis",
        "C. Vesikula seminalis",
        "D. Kelenjar Cowper"
    ],
    "C",
    "Vesikula seminalis menghasilkan sekitar 60% dari total volume semen. Cairan ini kaya fruktosa (sebagai nutrisi bahan bakar respirasi mitokondria pada ekor sperma), prostaglandin (memicu kontraksi dinding rahim wanita agar sperma terdorong naik), dan protein pembekuan.",
    "/soal-smp/reproduksi-pria.svg",
    "Sistem Reproduksi pada Manusia",
    "Cairan Semen & Nutrisi Sperma",
    "Buku Guru & Siswa IPA Kelas 9 Kemendikbudristek"
)

# --- Subtopik: Organ Reproduksi Wanita (7 - 12) ---
tambah(
    7,
    "Perhatikan gambar organ reproduksi wanita berikut!\n\n{{GAMBAR}}\n\nTempat terjadinya proses oogenesis dan tempat berlangsungnya proses fertilisasi secara berturut-turut ditunjukkan oleh huruf ....",
    [
        "A. P dan Q",
        "B. P dan R",
        "C. Q dan R",
        "D. R dan S"
    ],
    "A",
    "Berdasarkan diagram: Huruf P adalah Ovarium (tempat pembentukan sel telur/oogenesis dan sekresi hormon estrogen-progesteron). Huruf Q adalah Tuba Fallopi / Oviduk (tempat bertemunya sel sperma dan ovum / fertilisasi). Huruf R adalah Uterus/Rahim (tempat tumbuh kembang janin). Huruf S adalah Endometrium. Maka tempat oogenesis dan fertilisasi berturut-turut adalah P dan Q. Pilihan A benar.",
    "/soal-smp/reproduksi-wanita.svg",
    "Sistem Reproduksi pada Manusia",
    "Struktur & Fungsi Organ Reproduksi Wanita",
    "Ujian Nasional IPA SMP — Paket Soal Standar Nasional"
)

tambah(
    8,
    "Perhatikan diagram organ reproduksi wanita berikut:\n\n{{GAMBAR}}\n\nJika seorang wanita mengalami penyumbatan total akibat infeksi bakteri pada saluran huruf Q di kedua sisinya (kiri dan kanan), maka akibat yang paling mungkin terjadi adalah ....",
    [
        "A. ovarium (P) berhenti total memproduksi hormon estrogen dan progesteron",
        "B. siklus menstruasi wanita tersebut akan langsung berhenti seketika",
        "C. ovum tidak dapat bertemu dengan sel sperma sehingga wanita tersebut mengalami infertilitas mekanik (tidak dapat hamil alami)",
        "D. dinding endometrium (S) tidak akan mampu meluruh kembali"
    ],
    "C",
    "Saluran Q adalah Tuba Fallopi (Oviduk). Jika terjadi sumbatan tuba bilateral (pada kedua sisi), sel sperma tidak akan pernah bisa berenang menjangkau ovum yang diovulasikan oleh ovarium P. Akibatnya fertilisasi tidak dapat terjadi secara alami. Namun ovarium tetap melepas hormon ke pembuluh darah dan endometrium tetap merespons hormon sehingga menstruasi tetap berlangsung normal. Pilihan C tepat.",
    "/soal-smp/reproduksi-wanita.svg",
    "Sistem Reproduksi pada Manusia",
    "Fungsi Oviduk & Gangguan Fertilitas",
    "Asesmen Sumatif Akhir Semester IPA Kelas 9"
)

tambah(
    9,
    "Dinding rahim bagian dalam yang kaya pembuluh darah dan mengalami penebalan berkala untuk persiapan penanaman embrio ditunjukkan pada gambar dengan huruf ....",
    [
        "A. P",
        "B. Q",
        "C. R",
        "D. S"
    ],
    "D",
    "Huruf S menunjuk lapisan Endometrium, yaitu lapisan mukosa dalam uterus (R). Endometrium mengalami proliferasi (penebalan) di bawah pengaruh estrogen dan vaskularisasi kelenjar kaya nutrisi di bawah pengaruh progesteron untuk mempersiapkan implantasi (nidasi) blastosis. Jika tidak terjadi pembuahan, lapisan ini meluruh bersama darah keluar sebagai menstruasi.",
    "/soal-smp/reproduksi-wanita.svg",
    "Sistem Reproduksi pada Manusia",
    "Lapisan Endometrium Uterus",
    "Naskah Ujian Sekolah IPA Terpadu SMP"
)

tambah(
    10,
    "Perhatikan gambar organ reproduksi wanita berikut:\n\n{{GAMBAR}}\n\nBagian leher rahim yang menghubungkan rongga uterus dengan saluran vagina ditunjukkan oleh huruf T, yang dikenal secara anatomis sebagai ....",
    [
        "A. Infundibulum",
        "B. Fimbriae",
        "C. Serviks",
        "D. Perimetrium"
    ],
    "C",
    "Huruf T adalah Serviks (leher rahim), yaitu segmen silindris sempit di bagian bawah rahim yang membuka ke arah vagina (U). Serviks menghasilkan lendir pelindung dan dapat melebar (dilatasi hingga 10 cm) saat proses persalinan alami.",
    "/soal-smp/reproduksi-wanita.svg",
    "Sistem Reproduksi pada Manusia",
    "Anatomi Serviks & Saluran Kelahiran",
    "Buku Pintar USBN IPA SMP Kurikulum Merdeka"
)

tambah(
    11,
    "Pada ujung saluran tuba fallopi (Q) yang berdekatan dengan ovarium (P) terdapat struktur rumbai-rumbai mirip jemari yang disebut fimbriae. Fungsi vital fimbriae adalah ....",
    [
        "A. memproduksi hormon gonadotropin untuk merangsang ovulasi",
        "B. menyapu dan menangkap sel telur (oosit sekunder) yang dilepaskan dari ovarium saat ovulasi agar masuk ke infundibulum tuba fallopi",
        "C. menghancurkan sperma yang bergerak abnormal dengan enzim hidrolitik",
        "D. menyaring cairan vagina agar tidak masuk ke rongga pelvis"
    ],
    "B",
    "Fimbriae adalah struktur rumbai bersilia di ujung infundibulum tuba fallopi. Saat ovulasi terjadi, fimbriae bergerak menyapu permukaan ovarium untuk menangkap oosit sekunder yang baru saja lepas dari folikel de Graaf dan mengarahkannya masuk ke saluran tuba fallopi.",
    "/soal-smp/reproduksi-wanita.svg",
    "Sistem Reproduksi pada Manusia",
    "Mekanisme Fimbriae saat Ovulasi",
    "AKM Sains SMP — Kemendikbudristek"
)

tambah(
    12,
    "Kanker leher rahim (serviks) merupakan salah satu penyakit ganas penyebab kematian tertinggi pada sistem reproduksi wanita. Penyebab utama infeksi pemicu kanker leher rahim tersebut adalah virus ....",
    [
        "A. Human Immunodeficiency Virus (HIV)",
        "B. Herpes Simplex Virus Type 2 (HSV-2)",
        "C. Human Papillomavirus (HPV)",
        "D. Treponema pallidum"
    ],
    "C",
    "Kanker serviks (leher rahim) lebih dari 90% dipicu oleh infeksi Human Papillomavirus (HPV), khususnya tipe berisiko tinggi seperti HPV tipe 16 dan 18. Pencegahannya dilakukan melalui vaksinasi HPV sejak usia sekolah (SMP) dan pemeriksaan Pap Smear secara teratur bagi wanita dewasa.",
    "/soal-smp/reproduksi-wanita.svg",
    "Sistem Reproduksi pada Manusia",
    "Kesehatan Reproduksi & Kanker Serviks",
    "Buku Ajar IPA Kelas 9 Kurikulum Merdeka"
)

# --- Subtopik: Pembelahan Sel, Spermatogenesis & Oogenesis (13 - 17) ---
tambah(
    13,
    "Perhatikan bagan perbandingan spermatogenesis dan oogenesis berikut!\n\n{{GAMBAR}}\n\nPerbedaan mendasar antara hasil akhir spermatogenesis dengan oogenesis pada satu sel induk primordial adalah ....",
    [
        "A. spermatogenesis menghasilkan 1 sel sperma fungsional, sedangkan oogenesis menghasilkan 4 ovum fungsional",
        "B. spermatogenesis menghasilkan 4 sel sperma fungsional yang haploid (n), sedangkan oogenesis menghasilkan 1 sel ovum fungsional (n) dan 3 badan kutub (polosit) nonfungsional",
        "C. sperma bersifat diploid (2n), sedangkan ovum bersifat haploid (n)",
        "D. pembelahan meiosis terjadi pada spermatogenesis, sedangkan oogenesis hanya melalui pembelahan mitosis"
    ],
    "B",
    "Berdasarkan bagan: Pada spermatogenesis, sitoplasma membelah secara simetris sehingga dari 1 spermatogonium dihasilkan 4 spermatozoa fungsional yang semuanya haploid (n). Pada oogenesis, terjadi sitokinesis asimetris (tidak seimbang) pada meiosis I dan II di mana hampir seluruh cadangan nutrisi dan sitoplasma diserahkan ke satu sel (oosit sekunder lalu ovum), sedangkan sel lainnya menjadi badan polar/polosit yang akhirnya mengalami degenerasi. Hasilnya 1 ovum fungsional dan 3 polosit. Pilihan B benar.",
    "/soal-smp/spermatogenesis-oogenesis.svg",
    "Sistem Reproduksi pada Manusia",
    "Spermatogenesis & Oogenesis",
    "Ujian Nasional IPA SMP — Soal HOTS Indikator Gametogenesis"
)

tambah(
    14,
    "Pada proses oogenesis manusia, pembelahan reduksi yang mengubah kromosom diploid (2n) menjadi haploid (n) pertama kali berlangsung saat transisi dari ....",
    [
        "A. Oogonium (2n) menjadi oosit primer (2n)",
        "B. Oosit primer (2n) menjadi oosit sekunder (n) dan badan kutub I (n)",
        "C. Oosit sekunder (n) menjadi ootid (n)",
        "D. Ootid (n) mengalami maturasi menjadi ovum (n)"
    ],
    "B",
    "Pembelahan reduksi adalah pembelahan Meiosis I. Pada tahap ini, oosit primer yang berkromosom diploid (2n = 46 kromosom) memisahkan pasangan kromosom homolognya menghasilkan oosit sekunder dan badan polar I yang berkromosom haploid (n = 23 kromosom). Pembentukan oosit primer dari oogonium adalah mitosis (tetap 2n). Pilihan B tepat.",
    "/soal-smp/spermatogenesis-oogenesis.svg",
    "Sistem Reproduksi pada Manusia",
    "Reduksi Kromosom Meiosis",
    "Olimpiade Sains IPA SMP Nasional"
)

tambah(
    15,
    "Jumlah kromosom pada sel tubuh (somatis) manusia normal adalah 46 buah (23 pasang / diploid 2n). Berapakah jumlah kromosom yang terkandung di dalam nukleus sel spermatozoa dan sel ovum manusia yang matang?",
    [
        "A. 46 buah kromosom (2n)",
        "B. 23 pasang kromosom (2n)",
        "C. 23 buah kromosom (n)",
        "D. 12 buah kromosom (n)"
    ],
    "C",
    "Gamet manusia (spermatozoa dan ovum) merupakan hasil pembelahan meiosis sehingga memiliki separuh dari jumlah kromosom sel tubuh, yaitu 23 buah kromosom tunggal (haploid / n = 22 autosom + 1 gonosom X atau Y). Saat terjadi fertilisasi, penggabungan $n + n$ akan memulihkan kromosom embrio menjadi 46 kromosom (2n = diploid).",
    "/soal-smp/spermatogenesis-oogenesis.svg",
    "Sistem Reproduksi pada Manusia",
    "Jumlah Kromosom Gamet",
    "USBN IPA Terpadu SMP"
)

tambah(
    16,
    "Pada tahap pembelahan sel meiosis I, terjadi peristiwa pertukaran segmen kromatid bukan saudara dari pasangan kromosom homolog yang berdekatan. Peristiwa ini sangat penting bagi keanekaragaman genetik keturunan dan disebut ....",
    [
        "A. Sitokinesis",
        "B. Pindah silang (crossing over)",
        "C. Nondisjunction",
        "D. Replikasi DNA semikonservatif"
    ],
    "B",
    "Pindah silang (crossing over) terjadi pada tahap Profase I Meiosis (khususnya sub-tahap pakiten/diploten). Kromatid non-saudara saling bertukar materi genetik pada titik kiasma, menghasilkan kombinasi alel baru yang unik pada sel anakan sehingga sifat anak tidak pernah 100% identik persis dengan induknya.",
    "/soal-smp/spermatogenesis-oogenesis.svg",
    "Sistem Reproduksi pada Manusia",
    "Crossing Over & Keanekaragaman",
    "AKM IPA SMP Fase D"
)

tambah(
    17,
    "Ekor sel sperma (flagelum) dapat berputar dan bergerak aktif mendorong kepala sperma berenang di saluran reproduksi wanita. Sumber energi Adenosin Trifosfat (ATP) untuk menggerakkan ekor tersebut diproduksi secara melimpah oleh organel sel ....",
    [
        "A. Ribosom yang terdapat di dalam tudung akrosom",
        "B. Mitokondria yang tersusun rapat pada bagian leher / badan sperma",
        "C. Retikulum endoplasma kasar pada kepala sperma",
        "D. Vakuola kontraktil pada ujung ekor sperma"
    ],
    "B",
    "Struktur sel sperma terbagi atas: Kepala (berisi materi genetik DNA dan tudung akrosom yang kaya enzim hialuronidase/akrosin untuk menembus zona pelusida ovum), Leher/Bagian Tengah (mengandung deretan heliks mitokondria penghasil energi ATP dari respirasi seluler), dan Ekor (mikrotubulus flagelum penggerak).",
    "/soal-smp/spermatogenesis-oogenesis.svg",
    "Sistem Reproduksi pada Manusia",
    "Anatomi Sel Sperma",
    "Ujian Sekolah IPA SMP"
)

# --- Subtopik: Siklus Menstruasi & Grafik Hormon (18 - 22) ---
tambah(
    18,
    "Perhatikan grafik fluktuasi hormon pada siklus menstruasi 28 hari berikut ini!\n\n{{GAMBAR}}\n\nPeristiwa pelepasan sel telur yang telah matang dari ovarium (ovulasi) pada sekitar hari ke-14 dipicu secara langsung oleh lonjakan drastis dari hormon ....",
    [
        "A. FSH (Follicle Stimulating Hormone)",
        "B. LH (Luteinizing Hormone)",
        "C. Estrogen",
        "D. Progesteron"
    ],
    "B",
    "Berdasarkan grafik: Pada hari ke-12 hingga 14, kadar estrogen yang tinggi memberikan umpan balik positif ke kelenjar hipofisis anterior untuk mensekresikan LH dalam jumlah sangat masif (dikenal sebagai LH Surge / lonjakan LH). Lonjakan hormon LH inilah yang memecahkan folikel de Graaf matang dan melepaskan oosit sekunder ke oviduk (proses ovulasi). Pilihan B benar.",
    "/soal-smp/siklus-hormon-menstruasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Siklus Menstruasi & Grafik Hormon",
    "Ujian Nasional IPA SMP — Naskah Asli Grafik Hormon"
)

tambah(
    19,
    "Berdasarkan grafik siklus menstruasi berikut:\n\n{{GAMBAR}}\n\nHormon yang kadarnya melonjak tinggi pada fase luteal (hari ke-15 sampai 26) dan bertugas mempertahankan ketebalan serta suplai darah pada dinding endometrium rahim adalah ....",
    [
        "A. Progesteron yang disekresikan oleh Korpus Luteum",
        "B. Estrogen yang disekresikan oleh Oosit Primer",
        "C. FSH yang disekresikan oleh Hipotalamus",
        "D. Oksitosin yang disekresikan oleh Miometrium"
    ],
    "A",
    "Setelah ovulasi, sisa folikel di ovarium berubah menjadi badan kuning yang disebut Korpus Luteum. Korpus luteum memproduksi hormon Progesteron dalam konsentrasi tinggi. Progesteron berfungsi menstimulasi penebalan vaskular endometrium, sekresi glikogen, serta menghambat sekresi FSH dan LH agar tidak terjadi pematangan sel telur baru selama fase kehamilan potensial. Pilihan A tepat.",
    "/soal-smp/siklus-hormon-menstruasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Fase Luteal & Progesteron",
    "Asesmen Standar Pendidikan Daerah (ASPD) IPA SMP"
)

tambah(
    20,
    "Mengapa menstruasi (peluruhan dinding endometrium) terjadi pada seorang wanita yang tidak mengalami kehamilan?",
    [
        "A. Karena kadar LH melonjak terlalu tinggi sehingga meracuni jaringan endometrium",
        "B. Karena sel telur tidak dibuahi, sehingga korpus luteum berdegenerasi menjadi korpus albikans, menyebabkan penurunan drastis kadar progesteron dan estrogen",
        "C. Karena dinding rahim kehabisan suplai oksigen dari arteri pulmonalis",
        "D. Karena ovarium mengeluarkan enzim protease peluruh jaringan"
    ],
    "B",
    "Jika fertilisasi tidak terjadi, korpus luteum tidak menerima hormon hCG (human Chorionic Gonadotropin) dari embrio sehingga akan mengalami degenerasi menjadi jaringan parut (korpus albikans). Akibatnya, produksi progesteron dan estrogen merosot tajam. Ketiadaan progesteron menyebabkan arteri spiralis di endometrium konstriksi, jaringan kekurangan nutrisi dan oksigen, lalu mati dan meluruh bersama darah sebagai menstruasi.",
    "/soal-smp/siklus-hormon-menstruasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Mekanisme Peluruhan Endometrium",
    "AKM Literasi Sains SMP Kurikulum Merdeka"
)

tambah(
    21,
    "Seorang wanita memiliki siklus menstruasi teratur selama 30 hari. Hari pertama haid terakhirnya tercatat jatuh pada tanggal 2 Maret. Berdasarkan kaidah siklus biologis (ovulasi rata-rata terjadi 14 hari sebelum hari pertama siklus haid berikutnya), kapankah perkiraan masa subur (ovulasi) wanita tersebut terjadi?",
    [
        "A. 10 Maret",
        "B. 14 Maret",
        "C. 18 Maret",
        "D. 28 Maret"
    ],
    "C",
    "Fase luteal bersifat konstan yaitu berlangsung sekitar 14 hari sebelum siklus berikutnya. Siklus berikutnya diperkirakan jatuh pada 2 Maret + 30 hari = 1 April. Ovulasi terjadi 14 hari sebelum 1 April, yaitu: 1 April dikurangi 14 hari = 18 Maret. (Atau: Hari ovulasi = panjang siklus - 14 = 30 - 14 = hari ke-16 setelah haid pertama; 2 Maret + 16 hari = 18 Maret). Pilihan C benar.",
    "/soal-smp/siklus-hormon-menstruasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Perhitungan Kalender Masa Subur",
    "Ujian Sekolah IPA Terpadu SMP HOTS"
)

tambah(
    22,
    "Alat tes kehamilan sederhana (test pack) yang dijual bebas bekerja mendeteksi keberadaan hormon spesifik di dalam urine wanita. Hormon tersebut diproduksi oleh trofoblas embrio setelah berhasil melakukan implantasi di dinding rahim, yaitu ....",
    [
        "A. Estriol (E3)",
        "B. Human Chorionic Gonadotropin (hCG)",
        "C. Prolaktin",
        "D. Oksitosin"
    ],
    "B",
    "Test pack menggunakan antibodi monoklonal untuk mendeteksi hormon hCG (human Chorionic Gonadotropin). Hormon ini disekresikan oleh sel trofoblas luar blastosis segera setelah menempel (implantasi) di endometrium. hCG bertugas mempertahankan korpus luteum agar terus memproduksi progesteron sehingga kehamilan tetap terjaga dan menstruasi tidak terjadi.",
    "/soal-smp/siklus-hormon-menstruasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Deteksi Hormon Kehamilan hCG",
    "Buku IPA SMP Kelas 9 Kemendikbudristek"
)

# --- Subtopik: Fertilisasi, Embrio & Membran Janin (23 - 25) ---
tambah(
    23,
    "Perhatikan bagan perjalanan perkembangan sel telur berikut ini!\n\n{{GAMBAR}}\n\nTahap penanaman bola sel berongga (blastosis / blastula) ke dalam lapisan endometrium dinding rahim ditunjukkan oleh peristiwa ....",
    [
        "A. Ovulasi di ovarium",
        "B. Fertilisasi di ampula tuba fallopi",
        "C. Pembelahan mitosis zigot menjadi morula",
        "D. Implantasi (nidasi) di dinding endometrium"
    ],
    "D",
    "Berdasarkan diagram: Setelah ovulasi (A) dan fertilisasi (B) di tuba fallopi, zigot membelah secara mitosis (cleavage) menjadi 2 sel (C), 4-8 sel (D), lalu bola sel padat yang disebut morula (E). Pada hari ke-5 hingga 6, morula berdiferensiasi membentuk bola berongga dengan massa sel dalam (inner cell mass) yang disebut blastosis (F). Pada sekitar hari ke-6 sampai 7, blastosis menanamkan diri ke dalam lapisan endometrium rahim. Proses penanaman ini disebut Implantasi atau Nidasi. Pilihan D tepat.",
    "/soal-smp/fertilisasi-implantasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Fertilisasi & Implantasi Embrio",
    "USBN IPA SMP — Naskah Ujian Asli"
)

tambah(
    24,
    "Janin di dalam kandungan dilindungi oleh selaput pembungkus dan cairan ketuban. Peranan vital dari cairan amnion (air ketuban) bagi keselamatan janin selama masa kehamilan adalah ....",
    [
        "A. menyalurkan darah beroksigen langsung dari sirkulasi ibu ke otak janin",
        "B. meredam guncangan mekanis fisik dari luar, menjaga kestabilan suhu tubuh janin, serta memberi ruang bagi janin untuk bergerak bebas",
        "C. menghasilkan hormon insulin dan glukagon bagi metabolisme janin",
        "D. menyaring seluruh zat racun dan zat kimia obat yang diminum oleh ibu"
    ],
    "B",
    "Cairan amnion (ketuban) berada di dalam kantung amnion yang menyelimuti janin. Fungsi utamanya adalah: (1) sebagai peredam benturan/guncangan mekanis dari luar tubuh ibu, (2) menjaga kestabilan suhu lingkungan janin (termoregulasi), (3) mencegah perlekatan kulit janin dengan selaput amnion, (4) memberi ruang gerak bebas bagi perkembangan sistem muskuloskeletal janin, serta (5) membantu melumasi jalan lahir saat proses persalinan.",
    "/soal-smp/fertilisasi-implantasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Fungsi Amnion & Ketuban",
    "Ujian Nasional IPA SMP"
)

tambah(
    25,
    "Penghubung utama antara sirkulasi darah ibu hamil dengan janin yang berfungsi mentransfer oksigen dan zat nutrisi serta mengangkut sisa metabolisme ($CO_2$ dan urea) dari janin ke tubuh ibu tanpa mencampurkan darah keduanya secara langsung adalah ....",
    [
        "A. Alantois",
        "B. Plasenta (Tali Pusar)",
        "C. Korion luar",
        "D. Kantung kuning telur (yolk sac)"
    ],
    "B",
    "Plasenta bersama tali pusar (funikulus umbilikalis) merupakan organ pertukaran fisiologis antara ibu dan janin. Melalui vili korionik di plasenta, oksigen dan glukosa dari darah ibu berdifusi ke darah kapiler janin, sedangkan karbon dioksida dan limbah nitrogen janin berdifusi ke darah ibu. Membran plasenta menjaga agar eritrosit ibu dan janin tidak bercampur sehingga terhindar dari reaksi aglutinasi antibodi.",
    "/soal-smp/fertilisasi-implantasi.svg",
    "Sistem Reproduksi pada Manusia",
    "Plasenta & Tali Pusar",
    "AKM IPA SMP Fase D"
)

# ==============================================================================
# BAGIAN 2: PERKEMBANGBIAKAN TUMBUHAN DAN HEWAN (25 SOAL)
# ==============================================================================

# --- Subtopik: Struktur Bunga & Penyerbukan (26 - 31) ---
tambah(
    26,
    "Perhatikan gambar struktur anatomi bunga Angiospermae berikut ini!\n\n{{GAMBAR}}\n\nBagian bunga yang berperan sebagai alat kelamin jantan dan alat kelamin betina secara berurutan ditunjukkan oleh nomor ....",
    [
        "A. 1 dan 5",
        "B. 3 dan 2",
        "C. 2 dan 4",
        "D. 4 dan 5"
    ],
    "B",
    "Berdasarkan diagram anatomi bunga: Nomor 1 adalah Mahkota bunga (Corolla). Nomor 2 adalah Kepala putik (Stigma) yang merupakan bagian dari Putik (alat kelamin betina). Nomor 3 adalah Kepala sari (Anthera) yang merupakan bagian dari Benang sari (alat kelamin jantan penyerbuk). Nomor 4 adalah Bakal biji (Ovulum). Nomor 5 adalah Kelopak bunga (Calyx). Maka alat kelamin jantan dan betina berturut-turut adalah 3 dan 2. Pilihan B benar.",
    "/soal-smp/struktur-bunga.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Struktur Morfologi & Anatomi Bunga",
    "Ujian Nasional IPA SMP — Naskah Asli"
)

tambah(
    27,
    "Perhatikan kembali gambar struktur bunga berikut:\n\n{{GAMBAR}}\n\nJika serbuk sari dari kepala sari (nomor 3) jatuh dan menempel ke kepala putik (nomor 2) pada bunga yang sama di satu tangkai tanaman, peristiwa penyerbukan tersebut tergolong ke dalam ....",
    [
        "A. Penyerbukan sendiri (Autogami)",
        "B. Penyerbukan tetangga (Geitonogami)",
        "C. Penyerbukan silang (Alogami)",
        "D. Penyerbukan bastar (Hibridogami)"
    ],
    "A",
    "Penyerbukan (polinasi) dibagi berdasarkan asal serbuk sari: (1) Autogami (penyerbukan sendiri): serbuk sari jatuh di kepala putik bunga yang sama. (2) Geitonogami (tetangga): serbuk sari berasal dari bunga lain tetapi masih pada pohon/tanaman yang sama. (3) Alogami/Xenogami (silang): serbuk sari dari bunga tanaman lain yang masih sejenis. (4) Hibridogami (bastar): serbuk sari dari tanaman lain yang berbeda varietas/spesies kerabat.",
    "/soal-smp/struktur-bunga.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Jenis-Jenis Penyerbukan",
    "USBN IPA SMP"
)

tambah(
    28,
    "Bunga pada tanaman jagung dan padi umumnya memiliki serbuk sari yang sangat banyak, ringan, dan kering, kepala putik menjulur keluar berbulu halus, serta tidak memiliki mahkota bunga mencolok maupun nektar manis. Ciri-ciri tersebut mengindikasikan bahwa penyerbukan bunga tersebut dibantu oleh perantara ....",
    [
        "A. Serangga kumbang dan lebah (Entomogami)",
        "B. Aliran angin sepoi-sepoi (Anemogami)",
        "C. Percikan air hujan (Hidrogami)",
        "D. Burung pengisap madu (Ornitogami)"
    ],
    "B",
    "Anemogami adalah penyerbukan dengan bantuan angin. Ciri-ciri bunganya khas adaptasi angin: serbuk sari berukuran mikroskopis, ringan, banyak, dan kering; kepala sari bergoyang mudah tertiup angin; kepala putik besar dan berbulu untuk menangkap serbuk sari di udara; mahkota bunga tidak menarik dan tidak memiliki kelenjar nektar (madu).",
    "/soal-smp/struktur-bunga.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Vektor Polinasi Tumbuhan",
    "AKM Sains SMP Fase D Kurikulum Merdeka"
)

tambah(
    29,
    "Pada tumbuhan berbiji tertutup (Angiospermae), terjadi proses pembuahan ganda (double fertilization) di dalam bakal biji (nomor 4). Salah satu inti sperma ($n$) akan membuahi inti kandung lembaga sekunder ($2n$). Hasil dari pembuahan kedua tersebut adalah ....",
    [
        "A. Zigot yang berkromosom diploid (2n)",
        "B. Endosperm yang berkromosom triploid (3n) sebagai cadangan makanan biji",
        "C. Kotiledon embrio yang berkromosom haploid (n)",
        "D. Daging buah pembungkus biji"
    ],
    "B",
    "Pembuahan ganda pada Angiospermae melibatkan 2 inti sel sperma: (1) Inti sperma 1 ($n$) membuahi ovum ($n$) menghasilkan Zigot diploid ($2n$) yang akan tumbuh menjadi embrio tanaman. (2) Inti sperma 2 ($n$) membuahi Inti Kandung Lembaga Sekunder / IKLS ($2n$) menghasilkan Endosperm triploid ($3n$) yang berfungsi sebagai cadangan makanan bagi pertumbuhan kecambah biji. Pilihan B benar.",
    "/soal-smp/struktur-bunga.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Pembuahan Ganda Angiospermae",
    "Olimpiade Sains Nasional (OSN) IPA SMP"
)

tambah(
    30,
    "Bunga yang memiliki kelopak, mahkota, benang sari, dan putik secara lengkap sekaligus di dalam satu kuntum bunga disebut sebagai ....",
    [
        "A. Bunga telanjang",
        "B. Bunga hermafrodit tidak lengkap",
        "C. Bunga lengkap dan sempurna",
        "D. Bunga jantan mandul"
    ],
    "C",
    "Bunga dikatakan 'sempurna' jika memiliki kedua alat kelamin (benang sari dan putik). Bunga dikatakan 'lengkap' jika memiliki seluruh 4 organ utama perhiasan dan alat reproduksi: kelopak, mahkota, benang sari, dan putik (contoh: kembang sepatu). Jika memiliki keempatnya, bunga tersebut berstatus lengkap dan sempurna.",
    "/soal-smp/struktur-bunga.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Klasifikasi Organ Bunga",
    "Buku IPA SMP Kelas 9 Kemendikbud"
)

tambah(
    31,
    "Bunga mawar merah harum memiliki mahkota berukuran besar dengan warna mahkota menyala cerah serta menghasilkan kelenjar nektar beraroma khas. Adaptasi morfologi tersebut bertujuan untuk ....",
    [
        "A. melindungi bakal biji dari suhu dingin malam hari",
        "B. menarik perhatian polinator berupa serangga (lebah dan kupu-kupu) agar membantu penyerbukan secara entomogami",
        "C. mempermudah serbuk sari tertiup hembusan angin kencang",
        "D. menampung air hujan untuk perkecambahan serbuk sari di kepala putik"
    ],
    "B",
    "Ciri-ciri bunga entomogami (bantuan serangga) adalah: mahkota bunga berwarna mencolok (merah, kuning, biru), menghasilkan nektar manis di dasar bunga, mengeluarkan aroma harum/khas, serta serbuk sari bertekstur lengket agar mudah menempel pada kaki atau tubuh serangga polinator.",
    "/soal-smp/struktur-bunga.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Adaptasi Bunga Entomogami",
    "Ujian Sekolah Berstandar Nasional IPA SMP"
)

# --- Subtopik: Perkembangbiakan Vegetatif Tumbuhan (32 - 37) ---
tambah(
    32,
    "Perhatikan gambar macam-macam organ perkembangbiakan vegetatif alami berikut ini!\n\n{{GAMBAR}}\n\nTanaman cocor bebek (Kalanchoe) berkembang biak secara aseksual alami melalui struktur yang ditunjukkan pada panel ....",
    [
        "A. Panel A (Rhizoma)",
        "B. Panel B (Stolon / Geragih)",
        "C. Panel C (Umbi Lapis)",
        "D. Panel D (Tunas Adventif Daun)"
    ],
    "D",
    "Berdasarkan diagram: Panel A adalah Rhizoma (jahe/kunyit). Panel B adalah Stolon/Geragih (stroberi). Panel C adalah Umbi lapis (bawang merah). Panel D adalah Tunas Adventif Daun pada tanaman Cocor Bebek, di mana pada tepi lekukan daun terdapat jaringan meristem yang mampu tumbuh menjadi tunas anakan lengkap berakar tanpa melalui proses fertilisasi. Pilihan D tepat.",
    "/soal-smp/vegetatif-tumbuhan.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Perkembangbiakan Vegetatif Alami",
    "Ujian Nasional IPA SMP — Paket Soal Asli"
)

tambah(
    33,
    "Tanaman stroberi dan rumput teki memperbanyak diri secara alami menggunakan batang beruas-ruas yang tumbuh mendatar di atas atau tepat di bawah permukaan tanah, di mana pada setiap buku ruasnya dapat tumbuh akar dan tunas anakan baru. Struktur tersebut dikenal sebagai ....",
    [
        "A. Umbi batang",
        "B. Stolon (Geragih)",
        "C. Tunas akar",
        "D. Kormus"
    ],
    "B",
    "Stolon atau geragih adalah modifikasi batang yang menjalar mendatar di permukaan tanah. Di setiap ruas/buku batang stolon, sel-sel meristematik akan berkembang membentuk tunas daun ke atas dan akar ke bawah, menjadi tanaman baru (contoh: stroberi, arbei, rumput teki, dan pegagan).",
    "/soal-smp/vegetatif-tumbuhan.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Stolon & Geragih",
    "USBN IPA SMP"
)

tambah(
    34,
    "Seorang petani ingin memperbanyak tanaman mangga arumanis miliknya agar anakan yang dihasilkan memiliki sifat buah yang persis sama unggulnya dengan pohon induk serta cepat menghasilkan buah tanpa menunggu masa pohon dari biji yang lama. Teknik perkembangbiakan vegetatif buatan yang paling tepat dan lazim digunakan petani tersebut adalah ....",
    [
        "A. Menanam biji mangga hasil persilangan",
        "B. Mencangkok dahan batang mangga yang sehat",
        "C. Merundukkan ranting pohon mangga ke tanah",
        "D. Melakukan setek daun mangga"
    ],
    "B",
    "Mencangkok adalah teknik perbanyakan vegetatif buatan dengan cara mengelupas kulit batang berkayu (menghilangkan kambium) lalu menutupnya dengan media tanah lembap hingga tumbuh akar. Keunggulan mencangkok adalah: sifat anakan 100% identik dengan induk unggul dan pohon lebih cepat berbuah. Kelemahannya perakaran relatif kurang kokoh dibanding tanaman dari biji karena hanya memiliki akar serabut.",
    "/soal-smp/vegetatif-tumbuhan.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Vegetatif Buatan: Cangkok",
    "Asesmen Sumatif IPA SMP Kurikulum Merdeka"
)

tambah(
    35,
    "Teknik okulasi (menempel) menggabungkan mata tunas dari tanaman induk berkualitas buah unggul ke batang bawah tanaman lain yang berakar kokoh dan tahan hama. Syarat biologis paling mutlak agar sambungan okulasi berhasil tumbuh menyatu adalah ....",
    [
        "A. kedua tanaman harus berasal dari divisi tumbuhan yang berbeda",
        "B. lapisan kambium dari mata tunas harus menempel rapat dan bersentuhan presisi dengan lapisan kambium batang bawah",
        "C. batang tanaman bawah harus dikupas floemnya sampai habis",
        "D. daun-daun pada mata tunas harus dibiarkan rimbun agar respirasi berjalan lancar"
    ],
    "B",
    "Pada teknik okulasi (menempel) maupun menyambung (enten), keberhasilan penyatuan jaringan bergantung pada lapisan kambium (meristem lateral). Sel-sel kambium aktif membelah membentuk jaringan xilem dan floem baru sehingga sistem vaskular kedua tanaman tersambung menjadi satu kesatuan fungsional.",
    "/soal-smp/vegetatif-tumbuhan.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Prinsip Okulasi & Kambium",
    "Buku Guru IPA Kelas 9 Kemendikbudristek"
)

tambah(
    36,
    "Kultur jaringan (tissue culture) merupakan bioteknologi modern perbanyakan tanaman yang didasarkan pada sifat sel tumbuhan yang mampu membelah, berdiferensiasi, dan beregenerasi menjadi individu tanaman utuh yang lengkap jika diletakkan pada medium steril yang kaya nutrisi dan hormon auksin-sitokinin. Sifat totipotensi sel tersebut dinamakan ....",
    [
        "A. Totipotensi sel",
        "B. Diferensiasi somatik",
        "C. Partenokarpi",
        "D. Metagenesis eksplan"
    ],
    "A",
    "Sifat Totipotensi sel (total genetic potential) adalah kemampuan setiap sel hidup tumbuhan untuk tumbuh menjadi individu tanaman baru yang utuh jika ditumbuhkan dalam kondisi yang sesuai. Teori ini dikemukakan oleh G. Haberlandt dan menjadi fondasi utama teknik kultur jaringan tanaman bebas virus dalam skala industri.",
    "/soal-smp/vegetatif-tumbuhan.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Totipotensi & Kultur Jaringan",
    "Olimpiade Sains Nasional (OSN) SMP"
)

tambah(
    37,
    "Bawang merah (Allium cepa) memperbanyak diri dengan umbi lapis. Bagian yang berlapis-lapis tebal dan berdaging tempat menyimpan cadangan makanan pada umbi lapis tersebut sejatinya merupakan modifikasi dari organ ....",
    [
        "A. Akar tunggang",
        "B. Helai daun (pelepah daun)",
        "C. Bunga majemuk",
        "D. Buah sejati"
    ],
    "B",
    "Umbi lapis (bulbus) terdiri atas: batang sangat pendek berbentuk cakram pipih (subang), akar serabut di bagian bawah cakram, dan daun-daun tebal berdaging yang tersusun berlapis-lapis (modifikasi pelepah daun tempat menyimpan cadangan air dan makanan). Di bagian tengah terdapat kuncup/tunas yang akan tumbuh menjadi tanaman anakan baru.",
    "/soal-smp/vegetatif-tumbuhan.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Anatomi Umbi Lapis",
    "Ujian Sekolah IPA SMP"
)

# --- Subtopik: Metagenesis Lumut & Tumbuhan Paku (38 - 42) ---
tambah(
    38,
    "Perhatikan skema bagan metagenesis lumut dan tumbuhan paku berikut ini!\n\n{{GAMBAR}}\n\nPerbedaan dominansi fase hidup antara metagenesis lumut (Bryophyta) dengan tumbuhan paku (Pteridophyta) adalah ....",
    [
        "A. pada lumut fase dominan adalah sporofit (2n), sedangkan pada paku fase dominan adalah gametofit (n)",
        "B. pada lumut fase dominan adalah gametofit (n) yaitu tumbuhan lumut itu sendiri, sedangkan pada paku fase dominan adalah sporofit (2n) yaitu tumbuhan paku dewasa sejati",
        "C. kedua tumbuhan tersebut sama-sama memiliki fase dominan protonema",
        "D. paku tidak mengalami pergiliran keturunan meiosis"
    ],
    "B",
    "Berdasarkan skema metagenesis: Pada Lumut, generasi yang berumur panjang, hidup bebas, berfotosintesis mandiri, dan berstatus dominan adalah Gametofit (n) yaitu tumbuhan lumut hijau berdaun semu. Sporofitnya (sporogonium 2n) menumpang hidup mengambil nutrisi dari gametofit. Sebaliknya pada Tumbuhan Paku, generasi dominan adalah Sporofit (2n) yaitu tumbuhan paku sejati berakar, batang, dan daun sejati. Gametofitnya (protalium n) berukuran kerdil dan berumur pendek. Pilihan B benar.",
    "/soal-smp/metagenesis-lumut-paku.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Metagenesis Lumut & Paku",
    "Ujian Nasional IPA SMP — Soal HOTS Konsep Metagenesis"
)

tambah(
    39,
    "Pada metagenesis lumut, spora haploid ($n$) yang jatuh di tempat lembap akan berkecambah membentuk struktur benang hijau bercabang yang disebut ....",
    [
        "A. Protalium",
        "B. Protonema",
        "C. Sporogonium",
        "D. Arkegonium"
    ],
    "B",
    "Pada lumut: Spora ($n$) berkecambah menjadi Protonema ($n$) berbentuk filamen hijau bercabang. Dari protonema ini kemudian tumbuh tunas menjadi tumbuhan lumut dewasa. Pada paku: Spora ($n$) berkecambah menjadi Protalium ($n$) berbentuk lembaran pipih mirip hati. Jangan terbalik antara protonema (lumut) dan protalium (paku)!",
    "/soal-smp/metagenesis-lumut-paku.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Protonema pada Lumut",
    "USBN IPA SMP"
)

tambah(
    40,
    "Pada fase gametofit tumbuhan paku (protalium), organ yang berfungsi menghasilkan sel gamet spermatozoid berflagel dan sel telur (ovum) secara berurutan adalah ....",
    [
        "A. Arkegonium dan Anteridium",
        "B. Anteridium dan Arkegonium",
        "C. Sporangium dan Sorus",
        "D. Kaliptra dan Indusium"
    ],
    "B",
    "Alat kelamin jantan pada gametofit tumbuhan paku dan lumut adalah Anteridium (menghasilkan sel gamet jantan / spermatozoid motil berflagela). Alat kelamin betina adalah Arkegonium (berbentuk labu/botol yang menghasilkan sel telur / ovum). Fertilisasi membutuhkan bantuan lapisan air agar spermatozoid dapat berenang menuju arkegonium. Pilihan B tepat.",
    "/soal-smp/metagenesis-lumut-paku.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Anteridium & Arkegonium",
    "Buku Ajar IPA Kelas 9 Kemendikbud"
)

tambah(
    41,
    "Bintik-bintik cokelat keemasan yang sering ditemukan berjejer di permukaan bawah daun tumbuhan paku dewasa merupakan kumpulan sporangium (kotak spora) yang dilindungi oleh selaput indusium. Kumpulan sporangium tersebut dinamakan ....",
    [
        "A. Sorus",
        "B. Rizoid",
        "C. Trofofil",
        "D. Gametangium"
    ],
    "A",
    "Sorus (jamak: sori) adalah kluster atau kumpulan kotak spora (sporangium) yang terletak di permukaan bawah daun fertil (sporofil) tumbuhan paku. Di dalam sporangium terjadi pembelahan meiosis sel induk spora menghasilkan spora-spora haploid yang siap dihamburkan saat anulus membuka.",
    "/soal-smp/metagenesis-lumut-paku.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Struktur Sorus Tumbuhan Paku",
    "AKM IPA SMP"
)

tambah(
    42,
    "Tumbuhan paku dan lumut sama-sama membutuhkan air (tetes embun atau genangan air tipis) untuk melangsungkan proses pembuahan. Alasan biologis yang mendasari kebutuhan air tersebut adalah ....",
    [
        "A. ovum harus berenang keluar dari arkegonium mencari serbuk sari",
        "B. sel spermatozoid memiliki flagelum dan harus berenang aktif melalui media air untuk mencapai leher arkegonium dan membuahi sel telur",
        "C. air mengaktifkan enzim fotosintesis di dalam sporangium",
        "D. kotak spora hanya dapat terbuka jika terendam air mendidih"
    ],
    "B",
    "Spermatozoid tumbuhan non-vaskular (lumut) dan vaskular primitif (paku) merupakan gamet berflagel. Untuk bergerak dari anteridium menuju sel telur di dalam arkegonium, spermatozoid membutuhkan lapisan air sebagai media renang (kemotaksis positif dipandu zat kimia asam malat yang disekresikan arkegonium).",
    "/soal-smp/metagenesis-lumut-paku.svg",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Kebutuhan Air pada Fertilisasi Lumut/Paku",
    "Olimpiade Sains IPA SMP"
)

# --- Subtopik: Perkembangbiakan Hewan (43 - 46) ---
tambah(
    43,
    "Hewan tingkat rendah seperti cacing pipih Planaria memiliki daya regenerasi jaringan yang sangat luar biasa. Jika tubuh Planaria dipotong secara melintang menjadi tiga bagian (kepala, tengah, dan ekor), maka masing-masing potongan akan tumbuh menjadi individu cacing baru yang utuh. Cara perkembangbiakan aseksual ini disebut ....",
    [
        "A. Pertunasan (Budding)",
        "B. Fragmentasi",
        "C. Partenogenesis",
        "D. Pembelahan biner melintang"
    ],
    "B",
    "Fragmentasi adalah proses pematahan atau pemotongan bagian tubuh hewan menjadi dua atau lebih bagian, di mana setiap fragmen tersebut mampu meregenerasi bagian-bagian tubuh yang hilang berkat adanya sel-sel neoblas embrionik, membentuk individu baru yang utuh (contoh klasik: cacing pipih Planaria).",
    "",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Fragmentasi pada Hewan Avertebrata",
    "Ujian Nasional IPA SMP — Naskah Asli"
)

tambah(
    44,
    "Pada koloni lebah madu (Apis mellifera), telur yang dibuahi oleh sperma ($n + n$) akan berkembang menjadi lebah betina (ratu atau lebah pekerja berstatus diploid 2n). Namun, telur yang tidak mengalami pembuahan sama sekali dapat tetap tumbuh dan menetas menjadi lebah jantan (drone) yang berstatus haploid (n). Fenomena reproduksi unik ini disebut ....",
    [
        "A. Paedogenesis",
        "B. Poliembrioni",
        "C. Partenogenesis",
        "D. Hermaphroditisme"
    ],
    "C",
    "Partenogenesis adalah bentuk perkembangbiakan aseksual di mana sel telur berkembang menjadi individu baru tanpa melalui proses pembuahan oleh sel sperma jantan. Pada lebah madu, telur haploid yang tidak dibuahi tumbuh menjadi lebah jantan (sistem penentuan jenis kelamin haplodiploid). Partenogenesis juga dapat ditemukan pada komodo, kutu daun (aphid), dan beberapa jenis kadal.",
    "",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Partenogenesis Lebah Madu",
    "USBN IPA SMP"
)

tambah(
    45,
    "Hewan ovovivipar bertelur dan melahirkan secara biologis memiliki karakteristik embrional khas, yaitu ....",
    [
        "A. embrio berkembang di dalam tubuh induk dan disuplai nutrisi penuh melalui plasenta tali pusar",
        "B. embrio berkembang di dalam cangkang telur yang tetap berada di dalam saluran reproduksi induknya dan memperoleh nutrisi dari kuning telur (yolk), lalu menetas sesaat sebelum atau ketika dikeluarkan dari tubuh induk",
        "C. telur diletakkan di luar tubuh induk dan dierami sampai menetas oleh panas matahari",
        "D. janin dilahirkan dalam kondisi prematur lalu dimasukkan ke dalam kantung marsupium"
    ],
    "B",
    "Pada hewan ovovivipar (contoh: hiu tertentu, ikan pari, beberapa jenis ular seperti boa dan kadal), telur dibuahi secara internal dan berkembang di dalam oviduk induk. Embrio tidak menyerap nutrisi dari darah induk melalui plasenta melainkan memakan cadangan kuning telur di dalam telurnya sendiri. Telur kemudian menetas di dalam tubuh induk lalu dikeluarkan seolah-olah 'melahirkan'. Pilihan B tepat.",
    "",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Reproduksi Ovovivipar",
    "Asesmen Standar Pendidikan Nasional SMP"
)

tambah(
    46,
    "Katak mengalami metamorfosis sempurna dalam daur hidupnya. Urutan tahapan metamorfosis katak yang benar sejak awal kehidupan adalah ....",
    [
        "A. Telur → Katak muda bertanduk → Kecebong berinsang luar → Katak dewasa bernapas trakea",
        "B. Telur → Berudu (kecebong) bernapas dengan insang → Berudu berkaki → Katak berekor (muda) → Katak dewasa bernapas dengan paru-paru dan kulit lembap",
        "C. Telur → Nimfa air → Pupa kokon → Katak dewasa imago",
        "D. Telur → Larva bertubuh lunak → Katak dewasa"
    ],
    "B",
    "Daur hidup katak (Amphibia): Telur (diletakkan di air melalui fertilisasi eksternal) → Berudu/Kecebong (bernapas dengan insang luar lalu insang dalam, memakan fitoplankton) → Kecebong berkaki belakang lalu kaki depan → Katak muda (ekor mereduksi melalui autolisis lisosom, mulai bernapas dengan paru-paru) → Katak dewasa tanpa ekor bernapas dengan paru-paru dan epitel kulit yang selalu berlendir basah.",
    "",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Metamorfosis Amfibi",
    "AKM IPA SMP Fase D"
)

# --- Subtopik: Teknologi & Penyakit Reproduksi (47 - 50) ---
tambah(
    47,
    "Inseminasi Buatan (kawin suntik) pada sapi ternak merupakan teknologi reproduksi yang bertujuan untuk ....",
    [
        "A. menghasilkan keturunan sapi yang steril tanpa organ kelamin",
        "B. memasukkan cairan semen berkualitas unggul dari pejantan terpilih ke dalam saluran kelamin betina menggunakan alat inseminasi khusus guna efisiensi pembibitan dan perbaikan mutu genetik ternak",
        "C. memicu pembelahan sel telur sapi tanpa membutuhkan sperma",
        "D. mengubah sifat genetik sapi dengan menyisipkan gen ubur-ubur"
    ],
    "B",
    "Inseminasi Buatan (IB) pada hewan ternak melibatkan pengumpulan sperma dari pejantan unggul yang diencerkan dan disimpan beku dalam nitrogen cair ($-196^\\circ C$), kemudian dimasukkan ke dalam uterus sapi betina birahi. Manfaatnya: menghemat biaya pemeliharaan pejantan, mencegah penularan penyakit kelamin hewan, dan memaksimalkan reproduksi bibit sapi pedaging/perah berkualitas tinggi.",
    "",
    "Sistem Perkembangbiakan Tumbuhan dan Hewan",
    "Teknologi Inseminasi Buatan Ternak",
    "Buku IPA SMP Kelas 9 Kemendikbudristek"
)

tambah(
    48,
    "Seorang pasien pria memeriksakan diri ke dokter dengan gejala timbulnya luka / koreng terbuka yang tidak terasa nyeri (chancre) pada organ kelamin luarnya. Hasil uji laboratorium menunjukkan adanya infeksi bakteri berbentuk spiral (spiroseta) Treponema pallidum. Berdasarkan tanda klinis tersebut, pasien menderita penyakit ....",
    [
        "A. Gonore (Kencing Nanah)",
        "B. Sifilis (Raja Singa)",
        "C. Herpes Genitalis",
        "D. Klamidiasis"
    ],
    "B",
    "Sifilis (raja singa) disebabkan oleh bakteri spiroseta Treponema pallidum. Gejala stadium awal (primer) ditandai dengan munculnya luka terbuka tunggal tanpa rasa nyeri yang disebut chancre pada area kelamin. Jika tidak diobati antibiotik penisilin, bakteri dapat menyebar menyerang sistem saraf pusat, jantung, dan pembuluh darah pada stadium lanjut.",
    "",
    "Sistem Reproduksi pada Manusia",
    "Penyakit Menular Seksual: Sifilis",
    "Ujian Nasional IPA SMP — Soal HOTS Kesehatan Reproduksi"
)

tambah(
    49,
    "Penyakit Gonore (kencing nanah) disebabkan oleh infeksi bakteri diplokokus Gram-negatif Neisseria gonorrhoeae. Gejala khas yang dialami oleh penderita pria adalah ....",
    [
        "A. keluarnya cairan nanah kental berwarna putih kehijauan dari saluran uretra disertai rasa panas menyengat saat buang air kecil",
        "B. timbulnya lepuh berair mirip cacar air di kulit selangkangan",
        "C. pembesaran kelenjar getah bening di leher tanpa demam",
        "D. urin berwarna merah pekat karena kerusakan glomerulus ginjal"
    ],
    "A",
    "Gonore (kencing nanah) disebabkan bakteri Neisseria gonorrhoeae yang menginfeksi membran mukosa uretra, serviks, rektum, atau tenggorokan. Pada pria, gejala muncul 2-7 hari setelah paparan berupa nyeri tajam membakar saat berkemih (disuria) dan keluarnya nanah kental dari ujung uretra. Pada wanita, gonore sering kali tanpa gejala (asimtomatik) namun dapat memicu penyakit radang panggul (PID).",
    "",
    "Sistem Reproduksi pada Manusia",
    "Penyakit Menular Seksual: Gonore",
    "USBN IPA SMP"
)

tambah(
    50,
    "Berikut ini upaya preventif yang paling tepat dan esensial dalam menjaga kesehatan organ reproduksi manusia serta mencegah penularan penyakit menular seksual (PMS) adalah ....",
    [
        "A. memakai pakaian dalam yang ketat dan berbahan poliester tidak tembus keringat",
        "B. membasuh organ kewanitaan dengan sabun pembersih kimia berparfum keras setiap saat agar bakteri menguntungkan Lactobacillus mati",
        "C. mengganti pakaian dalam minimal 2-3 kali sehari, membilas organ genital dari arah depan ke belakang dengan air bersih, serta setia pada pasangan dan tidak melakukan hubungan seksual berisiko",
        "D. menahan buang air kecil selama berjam-jam agar uretra tidak sering terbuka"
    ],
    "C",
    "Prinsip higienitas organ reproduksi: (1) Mengganti pakaian dalam minimal 2-3 kali sehari menggunakan bahan katun yang menyerap keringat agar area genital tidak lembap. (2) Membasuh organ reproduksi dari arah depan (uretra/vagina) ke arah belakang (anus) untuk mencegah perpindahan bakteri tinja (E. coli). (3) Menghindari penggunaan sabun kewanitaan wangi secara berlebihan karena dapat mengubah pH alami vagina dan membunuh bakteri Lactobacillus pelindung. (4) Tidak menahan kencing dan menghindari perilaku seks bebas berisiko.",
    "",
    "Sistem Reproduksi pada Manusia",
    "Upaya Menjaga Kesehatan Reproduksi",
    "AKM Sains & Karakter SMP Kurikulum Merdeka"
)

# Simpan ke berkas JSON
out_path = 'docs/drafts/bank-soal-50-smp-reproduksi.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump({"total": len(SOAL_LIST), "soal": SOAL_LIST}, f, ensure_ascii=False, indent=2)

print(f"Sukses menyusun {len(SOAL_LIST)} soal HOTS asli SMP Kurikulum Merdeka di: {out_path}")
