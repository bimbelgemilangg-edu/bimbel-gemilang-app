#!/usr/bin/env python3
"""
generate_lbi_modul.py
Generates:
- lbinModul.js (5 bab)
- lbingModul.js (5 bab)
"""
import os
import json

MODUL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'modul')
os.makedirs(MODUL_DIR, exist_ok=True)

# ==============================================================================
# LBIN (Literasi Bahasa Indonesia) - 5 Bab
# ==============================================================================
LBIN_DATA = [
    {
        "id": "lbi-ide-pokok-teks-kompleks",
        "babNumber": 1,
        "slug": "lbi-ide-pokok-teks-kompleks",
        "subtestKode": "LBIN",
        "judul": "Menemukan Inti Bacaan & Argumen Sentral Teks Panjang",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Strategi membaca wacana panjang multidisiplin: memetakan tesis utama penulis, membedakan argumen sentral dari ilustrasi pendukung, dan menyaring informasi esensial.",
        "learningObjectives": [
            "Menemukan kalimat tesis (thesis statement) pada teks eksposisi/argumentasi panjang.",
            "Membedakan klaim utama penulis dengan sanggahan balik (counter-argument).",
            "Menghubungkan gagasan pokok antar-paragraf menjadi satu kesatuan tema utuh.",
            "Mengidentifikasi distractor opsi jawaban yang terlalu sempit atau keluar konteks."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Struktur Makro Teks Akademik",
                "isi": "Teks literasi UTBK biasanya terdiri atas 3-5 paragraf. Paragraf 1 memperkenalkan isu dan tesis utama. Paragraf 2 dan 3 menyajikan bukti data empiris dan analisis. Paragraf penutup menegaskan kembali implikasi dari tesis tersebut.",
                "poinPenting": [
                    "Argumen sentral biasanya berada pada paragraf pengantar atau paragraf penutup.",
                    "Paragraf di tengah hanya berfungsi sebagai pengembang data/ilustrasi teknis."
                ]
            },
            {
                "subjudul": "2. Teknik Membaca Aktif (Active Skimming)",
                "isi": "Jangan membaca setiap kata dengan kecepatan yang sama. Percepat membaca pada kalimat yang berisi contoh kasus, dan perlambat membaca pada kalimat pertama dan terakhir setiap paragraf.",
                "poinPenting": [
                    "Tandai kata transisi kritis: 'Namun demikian', 'Akan tetapi', 'Yang lebih mendasar adalah'."
                ]
            }
        ],
        "trikCepat": "Baca kalimat pertama setiap paragraf untuk membuat 'peta mental' teks dalam 30 detik! Gagasan sentral teks adalah intisari gabungan dari kalimat-kalimat pertama tersebut.",
        "jebakanUmum": "Terpaku membaca rincian contoh kasus berulang-ulang sehingga kehabisan waktu sebelum sempat memahami kesimpulan utama penulis.",
        "contohSoal": [
            {
                "soal": "Inti gagasan yang ingin disampaikan oleh penulis dalam wacana transisi energi hijau yang berkeadilan adalah...",
                "opsi": {
                    "A": "Pembangunan pembangkit listrik tenaga surya membutuhkan biaya investasi awal yang sangat mahal.",
                    "B": "Transisi energi terbarukan harus tetap menjamin perlindungan sosial dan kesejahteraan para pekerja tambang fosil yang terdampak.",
                    "C": "Batu bara adalah sumber energi yang paling murah dan melimpah di negara berkembang.",
                    "D": "Semua tambang batu bara harus ditutup seketika tanpa kompromi.",
                    "E": "Energi hijau hanya cocok diterapkan di negara-negara maju di Eropa."
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Konsep 'transisi energi yang berkeadilan' (just energy transition) selalu menekankan dua sisi: percepatan dekarbonisasi dan proteksi terhadap pekerja sektor fosil.",
                    "Opsi B merangkum tesis sentral ini dengan sangat presisi dan komprehensif.",
                    "Opsi A, C, D, dan E bersifat parsial, terlalu ekstrem, atau menyimpang.",
                    "Maka jawabannya adalah B."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbi-1-q1",
                "soal": "Kalimat tesis (thesis statement) sebuah artikel ilmiah populer paling sering diletakkan pada bagian...",
                "opsi": [
                    {"label": "A", "text": "Paragraf pengantar (pendahuluan) atau kalimat penutup pendahuluan"},
                    {"label": "B", "text": "Tabel data statistik di tengah naskah"},
                    {"label": "C", "text": "Daftar pustaka"},
                    {"label": "D", "text": "Catatan kaki (footnote)"},
                    {"label": "E", "text": "Lampiran kuesioner"}
                ],
                "kunci": "A",
                "pembahasan": "Kalimat tesis dirumuskan oleh penulis pada paragraf pengantar untuk memandu pembaca memahami posisi argumentasi yang akan dipertahankan sepanjang esai (A)."
            },
            {
                "id": "lbi-1-q2",
                "soal": "Jika paragraf 1 membahas kelebihan teknologi kecerdasan buatan, paragraf 2 membahas risiko etisnya, dan paragraf 3 mengusulkan regulasi tata kelola yang seimbang, maka tema utama teks tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "Larangan penggunaan teknologi kecerdasan buatan"},
                    {"label": "B", "text": "Pentingnya regulasi etis untuk menyeimbangkan potensi dan risiko kecerdasan buatan"},
                    {"label": "C", "text": "Daftar algoritma AI terbaik dunia"},
                    {"label": "D", "text": "Kerugian finansial akibat otomatisasi"},
                    {"label": "E", "text": "Masa depan programmer manusia"}
                ],
                "kunci": "B",
                "pembahasan": "Tema utama harus menyintesis ketiga paragraf: kelebihan (potensi) + risiko etis + usulan regulasi → Regulasi etis untuk menyeimbangkan potensi dan risiko (B)."
            },
            {
                "id": "lbi-1-q3",
                "soal": "Peran kalimat 'Sebagai contoh, sebuah studi di Finlandia menunjukkan...' dalam struktur teks argumentasi adalah sebagai...",
                "opsi": [
                    {"label": "A", "text": "Tesis utama"},
                    {"label": "B", "text": "Klaim sentral"},
                    {"label": "C", "text": "Bukti pendukung empiris (evidence)"},
                    {"label": "D", "text": "Simpulan akhir wacana"},
                    {"label": "E", "text": "Sanggahan terhadap penulis"}
                ],
                "kunci": "C",
                "pembahasan": "Frasa 'Sebagai contoh, sebuah studi menunjukkan...' secara gamblang menandakan penyajian bukti pendukung empiris untuk memperkuat argumen sebelumnya (C)."
            },
            {
                "id": "lbi-1-q4",
                "soal": "Manakah kriteria opsi jawaban yang paling tepat dipilih saat menjawab soal gagasan utama teks?",
                "opsi": [
                    {"label": "A", "text": "Memuat angka statistik paling detail"},
                    {"label": "B", "text": "Mampu memayungi seluruh ide paragraf tanpa terlalu sempit dan tanpa terlalu luas"},
                    {"label": "C", "text": "Memuat kalimat opini yang paling provokatif"},
                    {"label": "D", "text": "Hanya merangkum kalimat pertama paragraf ketiga"},
                    {"label": "E", "text": "Menggunakan istilah ilmiah yang paling sulit"}
                ],
                "kunci": "B",
                "pembahasan": "Gagasan utama yang valid harus memiliki daya rangkul komprehensif: memayungi seluruh isi wacana tanpa terdistorsi menjadi terlalu sempit atau hiperbolis (B)."
            },
            {
                "id": "lbi-1-q5",
                "soal": "Kata transisi 'Di sisi lain' atau 'Sebaliknya' pada awal paragraf ketiga menandakan bahwa paragraf tersebut berisi...",
                "opsi": [
                    {"label": "A", "text": "Pengulangan persis dari paragraf sebelumnya"},
                    {"label": "B", "text": "Sudut pandang kontras atau perspektif pembanding terhadap isu"},
                    {"label": "C", "text": "Penutupan naskah"},
                    {"label": "D", "text": "Definisi leksikal kata sulit"},
                    {"label": "E", "text": "Daftar riwayat hidup penulis"}
                ],
                "kunci": "B",
                "pembahasan": "Konjungsi pertentangan antarkalimat/paragraf seperti 'Di sisi lain' berfungsi memunculkan perspektif alternatif atau sudut pandang yang kontras dengan bahasan sebelumnya (B)."
            }
        ],
        "keyTakeaways": [
            "Fokus pada kalimat tesis di paragraf pembuka dan penutup.",
            "Terapkan active skimming: baca cepat pada contoh, baca teliti pada klaim.",
            "Tema utama wajib merangkul benang merah seluruh paragraf.",
            "Jangan terkecoh oleh detail bukti statistik saat mencari ide pokok."
        ],
        "rekomendasiLatihan": "Latih kecepatan membaca wacana panjang di tes simulasi Literasi Indonesia."
    },
    {
        "id": "lbi-menyimpulkan-isi-bacaan",
        "babNumber": 2,
        "slug": "lbi-menyimpulkan-isi-bacaan",
        "subtestKode": "LBIN",
        "judul": "Inferensi & Menarik Simpulan Tersirat dari Bacaan",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Menarik kesimpulan logis dari informasi tersirat (implisit) yang tidak tertulis secara harfiah, namun didukung kuat oleh rangkaian premis fakta dalam wacana.",
        "learningObjectives": [
            "Menarik inferensi logis yang tidak melampaui batas kewajaran teks.",
            "Mendeteksi asumsi tersembunyi (unstated assumption) yang menjadi pijakan argumen.",
            "Menghubungkan dua premis terpisah di paragraf berbeda untuk melahirkan simpulan baru.",
            "Menggugurkan kesimpulan palsu yang mengandung generalisasi terburu-buru (hasty generalization)."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Memahami Hakikat Inferensi",
                "isi": "Inferensi adalah proses penarikan kesimpulan berdasarkan petunjuk tidak langsung. Dalam UTBK, inferensi yang benar BUKAN tebakan bebas, melainkan konsekuensi logis mutlak dari premis-premis teks.",
                "poinPenting": [
                    "Jika teks menyatakan: 'Semua mobil listrik tidak menghasilkan emisi knalpot, dan Kota X hanya mengizinkan kendaraan bebas emisi knalpot melintas di pusat kota.'",
                    "Maka inferensi yang sah: 'Mobil listrik diizinkan melintas di pusat Kota X'."
                ]
            },
            {
                "subjudul": "2. Batas Toleransi Simpulan",
                "isi": "Simpulan yang baik tidak boleh menambahkan informasi spekulatif yang tidak ada buktinya sama sekali dalam teks, walaupun hal itu terdengar masuk akal di dunia nyata.",
                "poinPenting": [
                    "Jangan pernah memilih opsi inferensi yang melompat terlalu jauh ke masa depan tanpa dasar premis teks."
                ]
            }
        ],
        "trikCepat": "Gunakan Kaidah Implikasi: Tanyakan 'Jika teks ini 100% benar, maka konsekuensi logis apa yang PASTI ikut benar?'. Opsi yang lulus uji konsekuensi inilah yang merupakan inferensi sah!",
        "jebakanUmum": "Memilih opsi yang mengulang kalimat teks secara persis kata demi kata (ini namanya parafrase eksplisit, bukan inferensi tersirat!).",
        "contohSoal": [
            {
                "soal": "Kutipan wacana:\n'Studi epidemiologi menemukan bahwa komunitas pesisir tradisional di wilayah A yang mengonsumsi ikan laut segar setiap hari memiliki rata-rata tekanan darah yang normal hingga usia lanjut. Sebaliknya, generasi muda dari komunitas tersebut yang telah bermigrasi ke kota metropolitan dan sering mengonsumsi makanan cepat saji menunjukkan prevalensi hipertensi sebesar 38% sebelum usia 40 tahun.'\nSimpulan logis yang tersirat dari bacaan tersebut adalah...",
                "opsi": {
                    "A": "Faktor genetika merupakan satu-satunya penentu risiko hipertensi pada komunitas wilayah A.",
                    "B": "Perubahan pola makan dan gaya hidup perkotaan berkontribusi terhadap meningkatnya risiko hipertensi pada generasi muda.",
                    "C": "Ikan laut segar merupakan satu-satunya makanan sehat di dunia.",
                    "D": "Semua orang yang tinggal di pesisir dipastikan terbebas dari segala jenis penyakit jantung.",
                    "E": "Tinggal di kota metropolitan pasti merusak tekanan darah setiap orang."
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Teks membandingkan dua kelompok dari komunitas yang sama (faktor genetik serupa): mereka yang tetap makan ikan laut segar di pesisir (tensi normal) vs yang pindah ke kota dan makan cepat saji (38% hipertensi).",
                    "Perbedaan mendasar ada pada pola makan dan lingkungan hidup.",
                    "Maka simpulan logisnya adalah perubahan pola makan dan gaya hidup kota berkontribusi meningkatkan risiko hipertensi.",
                    "Opsi A, C, D, dan E memuat kata mutlak ('satu-satunya', 'dipastikan terbebas', 'pasti merusak') yang salah secara ilmiah dan teks.",
                    "Jadi kesimpulan yang tepat adalah B."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbi-2-q1",
                "soal": "Perbedaan mendasar antara 'fakta eksplisit' dan 'inferensi implisit' adalah...",
                "opsi": [
                    {"label": "A", "text": "Fakta eksplisit bernilai salah, sedangkan inferensi selalu benar."},
                    {"label": "B", "text": "Fakta eksplisit tertulis langsung dalam teks, sedangkan inferensi ditarik secara logis dari hubungan antarfakta."},
                    {"label": "C", "text": "Inferensi tidak membutuhkan bukti teks sama sekali."},
                    {"label": "D", "text": "Fakta eksplisit hanya ada dalam novel fiksi."},
                    {"label": "E", "text": "Tidak ada perbedaan antara keduanya."}
                ],
                "kunci": "B",
                "pembahasan": "Eksplisit tertera langsung di permukaan kata, sedangkan implisit (inferensi) adalah simpulan logis yang tersirat di balik hubungan antarkalimat (B)."
            },
            {
                "id": "lbi-2-q2",
                "soal": "Teks: 'Tanaman kopi arabika hanya dapat berproduksi optimal pada ketinggian di atas 1.000 meter dpl dengan suhu sejuk 16-22°C. Pemanasan global diproyeksikan menaikkan suhu rata-rata dataran tinggi sebesar 2,5°C dalam tiga dekade mendatang.' Inferensi yang paling didukung adalah...",
                "opsi": [
                    {"label": "A", "text": "Produksi kopi arabika akan meningkat drastis di dataran rendah."},
                    {"label": "B", "text": "Luas lahan yang ideal bagi budidaya kopi arabika terancam menyusut di masa depan."},
                    {"label": "C", "text": "Petani kopi akan beralih menanam pohon jati."},
                    {"label": "D", "text": "Harga kopi di kafe akan turun 50%."},
                    {"label": "E", "text": "Pemanasan global tidak memengaruhi tanaman perkebunan."}
                ],
                "kunci": "B",
                "pembahasan": "Kenaikan suhu di dataran tinggi akan membuat wilayah yang suhunya 16-22°C menjadi semakin berkurang, sehingga area ideal budidaya terancam menyusut (B)."
            },
            {
                "id": "lbi-2-q3",
                "soal": "Kriteria kesimpulan yang BURUK dan harus dihindari peserta UTBK adalah...",
                "opsi": [
                    {"label": "A", "text": "Bersifat objektif dan selaras dengan premis teks"},
                    {"label": "B", "text": "Melakukan generalisasi berlebihan yang melampaui data yang disajikan teks"},
                    {"label": "C", "text": "Menggunakan bahasa yang lugas"},
                    {"label": "D", "text": "Merangkum hubungan sebab dan akibat"},
                    {"label": "E", "text": "Menunjukkan implikasi praktis isu"}
                ],
                "kunci": "B",
                "pembahasan": "Generalisasi terburu-buru yang melampaui bukti naskah (overgeneralization) adalah ciri utama opsi jebakan yang keliru (B)."
            },
            {
                "id": "lbi-2-q4",
                "soal": "Jika seorang penulis menyoroti keberhasilan sistem kereta cepat negara X dan membandingkannya dengan kemacetan parah di negara Y, pesan tersirat yang ingin disampaikan adalah...",
                "opsi": [
                    {"label": "A", "text": "Negara Y sebaiknya belajar mengembangkan sistem transportasi publik massal berkecepatan tinggi."},
                    {"label": "B", "text": "Semua penduduk negara Y harus pindah ke negara X."},
                    {"label": "C", "text": "Negara X tidak memiliki masalah sosial sama sekali."},
                    {"label": "D", "text": "Mobil pribadi harus dilarang diproduksi di seluruh dunia."},
                    {"label": "E", "text": "Kemacetan lalu lintas adalah hal yang wajar dan tak perlu diatasi."}
                ],
                "kunci": "A",
                "pembahasan": "Komparasi positif-negatif tersirat bertujuan memberikan rekomendasi kebijakan bagi pihak yang tertinggal (A)."
            },
            {
                "id": "lbi-2-q5",
                "soal": "Teknik terbaik untuk memverifikasi apakah sebuah opsi inferensi benar atau salah adalah...",
                "opsi": [
                    {"label": "A", "text": "Menguji apakah premis teks dapat membuktikan negasi dari opsi tersebut"},
                    {"label": "B", "text": "Menghitung jumlah kata dalam opsi"},
                    {"label": "C", "text": "Memilih opsi yang paling panjang kalimatnya"},
                    {"label": "D", "text": "Memilih opsi A secara otomatis"},
                    {"label": "E", "text": "Mengabaikan teks bacaan"}
                ],
                "kunci": "A",
                "pembahasan": "Uji pembuktian logis (falsifikasi negasi) memastikan bahwa kesimpulan memang mutlak bertumpu pada data premis teks (A)."
            }
        ],
        "keyTakeaways": [
            "Inferensi bertumpu pada konsekuensi logis mutlak dari premis teks.",
            "Waspadai opsi yang melakukan generalisasi terburu-buru.",
            "Inferensi berbeda dengan parafrase harfiah kalimat teks.",
            "Hindari spekulasi pribadi yang tidak berakar pada bacaan."
        ],
        "rekomendasiLatihan": "Latih kemampuan inferensi pada modul penalaran teks bacaan Gemilang."
    },
    {
        "id": "lbi-menganalisis-argumen-dan-opini",
        "babNumber": 3,
        "slug": "lbi-menganalisis-argumen-dan-opini",
        "subtestKode": "LBIN",
        "judul": "Evaluasi Validitas Argumen, Fakta Empiris vs Opini",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Menganalisis kekuatan argumentasi teks: menguji reliabilitas data pendukung, membedakan fakta objektif dengan opini subjektif, serta mengidentifikasi klaim yang memperlemah atau memperkuat argumen.",
        "learningObjectives": [
            "Memisahkan kalimat fakta (dapat diverifikasi secara empiris) dari kalimat opini (penilaian subjektif).",
            "Menentukan argumen yang MEMPERKUAT (strengthen) atau MEMPERLEMAH (weaken) klaim penulis.",
            "Mengenali kesalahan bernalar (fallacy): ad hominem, strawman, dan false dilemma dalam teks.",
            "Menilai kredibilitas sumber rujukan yang dikutip penulis."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Fakta vs Opini",
                "isi": "- FAKTA: Informasi objektif yang dapat dibuktikan kebenarannya secara nyata melalui pengamatan, dokumen, atau data kuantitatif (contoh: 'Indonesia merdeka tahun 1945', 'Suhu air mendidih pada 100°C di tekanan 1 atm').\n- OPINI: Sikap, pandangan, atau penilaian pribadi yang dapat diperdebatkan (contoh: 'Matematika adalah pelajaran paling menyenangkan', 'Kota X adalah kota paling nyaman untuk ditinggali').",
                "poinPenting": [
                    "Kata penanda opini: 'sebaiknya', 'tampaknya', 'sangat indah', 'diyakini', 'menurut hemat saya'."
                ]
            },
            {
                "subjudul": "2. Soal 'Memperlemah' dan 'Memperkuat' Argumen",
                "isi": "Soal meminta peserta menemukan pernyataan baru dari opsi yang:\n- Memperkuat: menambahkan bukti pendukung yang membuat klaim penulis semakin kokoh.\n- Memperlemah: menyajikan fakta alternatif yang membantah premis atau memutus rantai kausalitas klaim penulis.",
                "poinPenting": [
                    "Pernyataan yang memperlemah sering berupa fakta bahwa akibat terjadi walau sebab tidak ada, atau adanya faktor penyebab lain yang lebih dominan."
                ]
            }
        ],
        "trikCepat": "Untuk mencari opsi yang MEMPERLEMAH: Cari opsi yang menunjukkan bahwa hubungan kausalitas penulis adalah SALAH atau KEBETULAN SEMATA, misalnya dengan membuktikan adanya faktor C yang sebenarnya menjadi penyebab utama!",
        "jebakanUmum": "Memilih opsi yang hanya mengulang argumen teks saat diminta mencari pernyataan yang memperkuat argumen (harus berupa bukti atau fakta tambahan yang relevan!).",
        "contohSoal": [
            {
                "soal": "Penulis mengklaim: 'Pemberlakuan jam malam bagi remaja terbukti efektif menurunkan angka kenakalan jalanan di Kota B.' Pernyataan berikut yang PALING MEMPERLEMAH klaim penulis tersebut adalah...",
                "opsi": {
                    "A": "Angka kenakalan remaja jalanan juga menurun di kota-kota tetangga yang tidak menerapkan kebijakan jam malam.",
                    "B": "Banyak orang tua yang mendukung kebijakan jam malam tersebut.",
                    "C": "Petualangan malam hari digemari oleh anak muda.",
                    "D": "Polisi menambah frekuensi patroli saat jam malam berlaku.",
                    "E": "Tingkat kepatuhan remaja terhadap jam malam mencapai 80%."
                },
                "kunci": "A",
                "pembahasanLangkah": [
                    "Penulis mengklaim bahwa penurunan kenakalan jalanan disebabkan oleh 'jam malam'.",
                    "Opsi A membuktikan bahwa di kota-kota lain yang TIDAK ADA jam malam, angka kenakalan JUGA TETAP MENURUN.",
                    "Fakta ini membuktikan bahwa penurunan kenakalan remaja kemungkinan besar dipicu oleh faktor lain (misal musim liburan selesai atau cuaca hujan), bukan karena jam malam.",
                    "Ini secara telak MEMPERLEMAH klaim kausalitas penulis.",
                    "Maka jawabannya adalah A."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbi-3-q1",
                "soal": "Kalimat berikut yang merupakan FAKTA objektif adalah...",
                "opsi": [
                    {"label": "A", "text": "Pemandangan matahari terbit di Pantai Sanur sungguh menakjubkan."},
                    {"label": "B", "text": "Berdasarkan data BPS, inflasi tahun kalender 2025 tercatat sebesar 2,61%."},
                    {"label": "C", "text": "Masakan padang merupakan kuliner paling lezat di nusantara."},
                    {"label": "D", "text": "Pendidikan vokasi tampaknya lebih menjanjikan daripada akademik."},
                    {"label": "E", "text": "Semua orang seharusnya beralih menggunakan kendaraan listrik."}
                ],
                "kunci": "B",
                "pembahasan": "Opsi B memuat data kuantitatif empiris yang dirilis oleh lembaga resmi (BPS) dan dapat diverifikasi langsung. Opsi lainnya memuat kata penilaian subjektif (menakjubkan, paling lezat, tampaknya, seharusnya) (B)."
            },
            {
                "id": "lbi-3-q2",
                "soal": "Pernyataan yang PALING MEMPERKUAT argumen bahwa konsumsi teh hijau dapat meningkatkan metabolisme tubuh adalah...",
                "opsi": [
                    {"label": "A", "text": "Riset laboratorium terakreditasi membuktikan senyawa EGCG dalam teh hijau meningkatkan laju oksidasi lemak hingga 17%."},
                    {"label": "B", "text": "Harga teh hijau di pasaran relatif terjangkau oleh masyarakat umum."},
                    {"label": "C", "text": "Banyak selebritas terkenal menyukai aroma wangi teh hijau."},
                    {"label": "D", "text": "Teh hitam dan teh melati memiliki warna seduhan yang lebih pekat."},
                    {"label": "E", "text": "Pabrik pengolahan teh mempekerjakan ratusan warga sekitar."}
                ],
                "kunci": "A",
                "pembahasan": "Bukti ilmiah laboratorium mengenai mekanisme biokimiawi senyawa EGCG secara langsung memperkuat mekanisme peningkatan metabolisme (A)."
            },
            {
                "id": "lbi-3-q3",
                "soal": "Kekeliruan berpikir (fallacy) yang menyerang kepribadian atau motif lawan bicara alih-alih membantah argumennya disebut...",
                "opsi": [
                    {"label": "A", "text": "Argumentum Ad Hominem"},
                    {"label": "B", "text": "Strawman Fallacy"},
                    {"label": "C", "text": "Red Herring"},
                    {"label": "D", "text": "Appeal to Authority"},
                    {"label": "E", "text": "Circular Reasoning"}
                ],
                "kunci": "A",
                "pembahasan": "Ad Hominem adalah sesat pikir yang menyerang karakter pribadi, latar belakang, atau fisik orang yang menyampaikan argumen (A)."
            },
            {
                "id": "lbi-3-q4",
                "soal": "Klaim: 'Pemberian subsidi pupuk secara langsung kepada petani lewat kartu tani gagal mencapai target.' Bukti yang paling relevan untuk mendukung klaim tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "Banyak petani di pelosok mengeluhkan kendala sinyal mesin gesek dan belum terdaftarnya nama mereka di pangkalan data."},
                    {"label": "B", "text": "Pemerintah merencanakan rapat koordinasi pekan depan."},
                    {"label": "C", "text": "Pupuk organik dapat dibuat sendiri dari kotoran ternak."},
                    {"label": "D", "text": "Harga beras impor di pasar internasional mengalami penurunan."},
                    {"label": "E", "text": "Luas sawah di Pulau Jawa mencapai jutaan hektare."}
                ],
                "kunci": "A",
                "pembahasan": "Fakta bahwa petani pelosok terkendala sinyal dan tidak terdaftar secara langsung membuktikan kegagalan implementasi target kartu tani di lapangan (A)."
            },
            {
                "id": "lbi-3-q5",
                "soal": "Penanda linguistik yang menunjukkan bahwa sebuah kalimat merupakan OPINI adalah...",
                "opsi": [
                    {"label": "A", "text": "Adanya penyebutan tanggal dan lokasi peristiwa"},
                    {"label": "B", "text": "Adanya modalitas subjektif seperti 'seharusnya', 'diyakini', dan 'sangat mungkin'"},
                    {"label": "C", "text": "Penggunaan satuan ukuran meter atau kilogram"},
                    {"label": "D", "text": "Adanya kutipan undang-undang pasal demi pasal"},
                    {"label": "E", "text": "Penyajian nama peneliti dan institusi riset"}
                ],
                "kunci": "B",
                "pembahasan": "Modalitas epistemik dan deontik seperti 'seharusnya', 'diyakini', 'sangat mungkin' mengindikasikan ketidakpastian atau pertimbangan nilai subjektif dari penutur (B)."
            }
        ],
        "keyTakeaways": [
            "Fakta dapat diverifikasi secara objektif; opini memuat nilai rasa subjektif.",
            "Untuk memperlemah argumen, tunjukkan faktor penyebab lain atau bukti kasus tanpa sebab.",
            "Untuk memperkuat argumen, hadirkan data empiris yang mendukung mekanisme klaim.",
            "Waspadai fallacy ad hominem dan strawman dalam penalaran teks."
        ],
        "rekomendasiLatihan": "Latih analisis argumentasi kritis di Latihan Harian Gemilang."
    },
    {
        "id": "lbi-membaca-grafik-tabel-dan-infografik",
        "babNumber": 4,
        "slug": "lbi-membaca-grafik-tabel-dan-infografik",
        "subtestKode": "LBIN",
        "judul": "Interpretasi Infografik, Diagram & Tabel Terintegrasi Teks",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Membaca data multimodal: memadukan narasi wacana dengan visualisasi grafik batang, garis tren waktu, diagram lingkaran, serta tabel data multikolom.",
        "learningObjectives": [
            "Membaca sumbu horizontal (X) dan vertikal (Y) beserta satuan nilainya secara cermat.",
            "Mengidentifikasi tren data: kenaikan eksponensial, penurunan linier, fluktuasi, atau stasioner.",
            "Memverifikasi konsistensi antara klaim paragraf naskah dengan visualisasi data grafik.",
            "Menghitung persentase kenaikan/penurunan sederhana dari tabel data teks."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Langkah Sistematis Membaca Visual Data",
                "isi": "1. Baca Judul Tabel/Grafik untuk mengetahui topik dan rentang tahun pengamatan.\n2. Cermati Satuan Ukuran (misal: 'dalam triliun rupiah', 'dalam ribuan ton', 'dalam persen').\n3. Identifikasi Titik Tertinggi (Puncak), Titik Terendah (Lembah), dan Anomali Data.\n4. Cocokkan dengan pertanyaan soal: apakah menanyakan tren umum atau titik spesifik?",
                "poinPenting": [
                    "Jangan terkecoh oleh skala sumbu yang tidak dimulai dari angka 0 (skala terpotong yang memberi ilusi kenaikan tajam)."
                ]
            },
            {
                "subjudul": "2. Integrasi Narasi Teks dan Visual",
                "isi": "Soal UTBK sering menanyakan: 'Pernyataan pada teks yang TIDAK SESUAI dengan data grafik di atas adalah...'. Siswa wajib mengecek satu per satu angka pada opsi terhadap titik koordinat grafik.",
                "poinPenting": [
                    "Jika grafik menunjukkan kenaikan dari 2021 ke 2023 tetapi turun di 2022, klaim teks 'terus meningkat tanpa henti' adalah SALAH."
                ]
            }
        ],
        "trikCepat": "Cek Kata Ekstrem: Jika teks mengatakan 'selalu naik', 'tertinggi sepanjang sejarah', atau 'paling rendah', langsung arahkan mata ke titik puncak atau lembah grafik! Sering kali distorsi soal terletak pada kata pembatas ini.",
        "jebakanUmum": "Mengabaikan satuan pada judul sumbu Y (misal: angka tertulis 50, padahal satuannya 'dalam ribuan jiwa', artinya 50.000 jiwa).",
        "contohSoal": [
            {
                "soal": "Sebuah tabel memperlihatkan ekspor kopi Indonesia (dalam ribuan ton):\n2021: 380\n2022: 430\n2023: 410\n2024: 490\nPernyataan yang PALING TEPAT mendeskripsikan tren data ekspor tersebut adalah...",
                "opsi": {
                    "A": "Ekspor kopi selalu mengalami peningkatan dari tahun ke tahun.",
                    "B": "Ekspor kopi mengalami penurunan pada tahun 2023 sebelum melonjak mencapai puncaknya pada tahun 2024.",
                    "C": "Volume ekspor tertinggi terjadi pada tahun 2022.",
                    "D": "Ekspor kopi tahun 2024 meningkat lebih dari dua kali lipat dibanding tahun 2021.",
                    "E": "Rata-rata ekspor per tahun berada di bawah 400 ribu ton."
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Analisis tren: 2021 ke 2022 naik (380 → 430). 2022 ke 2023 turun (430 → 410). 2023 ke 2024 naik tajam ke titik puncak (410 → 490).",
                    "Opsi A salah karena tahun 2023 turun (tidak 'selalu').",
                    "Opsi B tepat: mengalami penurunan pada tahun 2023 (dari 430 ke 410) sebelum mencapai puncaknya pada tahun 2024 (490).",
                    "Opsi C salah (tertinggi 2024). Opsi D salah (380 × 2 = 760, bukan 490).",
                    "Maka jawaban yang tepat adalah B."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbi-4-q1",
                "soal": "Langkah pertama yang paling krusial sebelum menganalisis data sebuah grafik adalah...",
                "opsi": [
                    {"label": "A", "text": "Langsung memilih opsi jawaban C"},
                    {"label": "B", "text": "Membaca judul grafik, label sumbu X dan Y, serta satuan ukurannya"},
                    {"label": "C", "text": "Menghitung rata-rata seluruh angka tanpa membaca pertanyaan"},
                    {"label": "D", "text": "Mengabaikan keterangan legenda warna"},
                    {"label": "E", "text": "Menghubungkan titik secara manual"}
                ],
                "kunci": "B",
                "pembahasan": "Memahami judul, label sumbu, dan satuan ukuran adalah fondasi mutlak agar terhindar dari salah tafsir data grafik (B)."
            },
            {
                "id": "lbi-4-q2",
                "soal": "Jika data penjualan meningkat dari 100 unit pada Januari menjadi 150 unit pada Februari, persentase kenaikan penjualan tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "25%"},
                    {"label": "B", "text": "33,3%"},
                    {"label": "C", "text": "50%"},
                    {"label": "D", "text": "75%"},
                    {"label": "E", "text": "150%"}
                ],
                "kunci": "C",
                "pembahasan": "Persentase kenaikan = [(Nilai Baru - Nilai Lama) / Nilai Lama] × 100% = [(150 - 100) / 100] × 100% = 50% (C)."
            },
            {
                "id": "lbi-4-q3",
                "soal": "Kelebihan utama penyajian data menggunakan diagram lingkaran (pie chart) dibanding diagram batang adalah...",
                "opsi": [
                    {"label": "A", "text": "Memperlihatkan perubahan nilai terhadap waktu secara detail"},
                    {"label": "B", "text": "Memperlihatkan proporsi atau persentase pangsa bagian terhadap keseluruhan (100%)"},
                    {"label": "C", "text": "Dapat memuat ribuan kategori sekaligus"},
                    {"label": "D", "text": "Menghilangkan kebutuhan akan angka"},
                    {"label": "E", "text": "Hanya dapat digunakan untuk data cuaca"}
                ],
                "kunci": "B",
                "pembahasan": "Pie chart dirancang khusus untuk memvisualisasikan proporsi relatif tiap kategori terhadap total 100% keseluruhan data (B)."
            },
            {
                "id": "lbi-4-q4",
                "soal": "Sebuah wacana menyebut 'Penjualan produk Z merosot tajam', namun grafik memperlihatkan penjualan naik dari 1.000 ke 1.050. Ketidaksesuaian ini menunjukkan bahwa...",
                "opsi": [
                    {"label": "A", "text": "Teks naskah keliru atau bertentangan dengan data faktual grafik"},
                    {"label": "B", "text": "Grafik tersebut palsu"},
                    {"label": "C", "text": "Angka 1.050 lebih kecil dari 1.000"},
                    {"label": "D", "text": "Merosot tajam berarti naik sedikit"},
                    {"label": "E", "text": "Satuan penjualan pasti negatif"}
                ],
                "kunci": "A",
                "pembahasan": "Klaim narasi 'merosot tajam' berbanding terbalik dengan grafik yang menunjukkan kenaikan. Ini adalah bentuk kontradiksi antara teks dan data grafis (A)."
            },
            {
                "id": "lbi-4-q5",
                "soal": "Grafik garis paling ideal digunakan untuk menyajikan jenis data...",
                "opsi": [
                    {"label": "A", "text": "Komposisi suku bangsa penduduk suatu kota"},
                    {"label": "B", "text": "Perkembangan harga emas dunia dari tahun ke tahun (runtun waktu/time series)"},
                    {"label": "C", "text": "Daftar nama juara lomba cerdas cermat"},
                    {"label": "D", "text": "Warna kesukaan siswa sekolah dasar"},
                    {"label": "E", "text": "Denah ruang gedung perpustakaan"}
                ],
                "kunci": "B",
                "pembahasan": "Grafik garis (line chart) adalah visualisasi terbaik untuk memperlihatkan tren kontinuitas dan dinamika data deret waktu (time series) (B)."
            }
        ],
        "keyTakeaways": [
            "Perhatikan satuan pada judul sumbu grafik sebelum membaca angka.",
            "Waspadai kata pembatas ekstrem (selalu naik, tanpa henti).",
            "Diagram lingkaran menunjukkan proporsi bagian terhadap total 100%.",
            "Cocokkan setiap klaim paragraf dengan titik koordinat visual grafik."
        ],
        "rekomendasiLatihan": "Latih kecermatan infografis di subtes Literasi Bahasa Indonesia Gemilang."
    },
    {
        "id": "lbi-membandingkan-dua-teks",
        "babNumber": 5,
        "slug": "lbi-membandingkan-dua-teks",
        "subtestKode": "LBIN",
        "judul": "Sintesis & Perbandingan Dua Teks Berbeda Sudut Pandang",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Menemukan titik temu (kesamaan tema), titik tolak perdebatan (perbedaan sudut pandang/argumen), dan merumuskan sintesis harmonis dari dua bacaan bertema sejenis.",
        "learningObjectives": [
            "Menentukan persamaan pokok bahasan dari Teks 1 dan Teks 2.",
            "Mengidentifikasi perbedaan fokus pendekatan atau perspektif antardua teks.",
            "Menemukan argumen Teks 1 yang dibantah atau diperbaiki oleh Teks 2.",
            "Merumuskan pernyataan sintesis yang mewakili substansi kedua wacana."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Format Soal Teks Ganda (Dual Passage)",
                "isi": "Soal menyajikan Teks 1 dan Teks 2 yang membahas topik yang sama (misal: kendaraan listrik), tetapi:\n- Teks 1 fokus pada manfaat lingkungan dan dekarbonisasi.\n- Teks 2 fokus pada dampak negatif pertambangan nikel dan pembuangan limbah baterai.",
                "poinPenting": [
                    "Pertanyaan umum 1: 'Persamaan topik yang dibahas kedua teks adalah...'",
                    "Pertanyaan umum 2: 'Perbedaan fokus pembahasan antara Teks 1 dan Teks 2 adalah...'",
                    "Pertanyaan umum 3: 'Sikap penulis Teks 2 terhadap klaim penulis Teks 1 adalah...'"
                ]
            },
            {
                "subjudul": "2. Metode Matriks Perbandingan Cepat",
                "isi": "Buat catatan mini 2 baris:\n- Teks 1: Topik apa? Pro/Kontra? Sudut pandang apa?\n- Teks 2: Topik apa? Pro/Kontra? Sudut pandang apa?",
                "poinPenting": [
                    "Jangan pernah menyamakan 'topik' dengan 'sudut pandang'. Topiknya bisa sama (misal: AI di sekolah), tapi sudut pandangnya bertolak belakang (Teks 1 optimis, Teks 2 cemas)."
                ]
            }
        ],
        "trikCepat": "Gunakan Matriks Kontras: Teks 1 (+) vs Teks 2 (-). Jika Teks 1 menyoroti peluang dan Teks 2 menyoroti ancaman, maka perbedaan utamanya adalah 'keuntungan vs tantangan'! Opsi yang benar akan selalu mencerminkan dualisme ini.",
        "jebakanUmum": "Memilih opsi yang hanya benar untuk Teks 1 saja tetapi sama sekali tidak dibahas di Teks 2 saat menjawab pertanyaan 'Persamaan kedua teks'.",
        "contohSoal": [
            {
                "soal": "Teks 1 mengulas potensi ekonomi digital dalam menciptakan jutaan lapangan kerja baru bagi generasi muda. Teks 2 mengulas risiko otomatisasi kecerdasan buatan yang mengancam kepunahan profesi kerah putih konvensional.\nPerbedaan fokus kedua teks tersebut adalah...",
                "opsi": {
                    "A": "Teks 1 menolak digitalisasi, sedangkan Teks 2 mendukung AI.",
                    "B": "Teks 1 menyoroti peluang penciptaan kerja oleh ekonomi digital, sedangkan Teks 2 menyoroti ancaman disrupsi tenaga kerja oleh otomatisasi.",
                    "C": "Teks 1 dan Teks 2 sama-sama memuji efisiensi teknologi modern.",
                    "D": "Teks 1 membahas sektor pertanian, sedangkan Teks 2 membahas sektor kelautan.",
                    "E": "Teks 1 pesimis terhadap generasi muda, sedangkan Teks 2 optimis."
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Teks 1: Peluang penciptaan lapangan kerja baru (sudut pandang optimis).",
                    "Teks 2: Ancaman kepunahan profesi akibat otomatisasi (sudut pandang kritis/waspada).",
                    "Opsi B secara gamblang dan akurat membedakan fokus kedua teks: 'peluang penciptaan kerja' vs 'ancaman disrupsi tenaga kerja'.",
                    "Maka jawabannya adalah B."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbi-5-q1",
                "soal": "Jika pertanyaan menanyakan 'PERSAMAAN kedua teks', maka kriteria jawaban yang benar adalah...",
                "opsi": [
                    {"label": "A", "text": "Gagasan yang hanya tercantum secara mendalam pada Teks 1"},
                    {"label": "B", "text": "Pokok bahasan yang dibahas dan disetujui bersama oleh kedua teks"},
                    {"label": "C", "text": "Jumlah kata dan paragraf yang identik"},
                    {"label": "D", "text": "Penggunaan tanda baca yang persis sama"},
                    {"label": "E", "text": "Kritik Teks 2 terhadap Teks 1"}
                ],
                "kunci": "B",
                "pembahasan": "Persamaan kedua teks harus berupa payung topik atau premis yang sama-sama dibahas dan diakui oleh kedua belah teks (B)."
            },
            {
                "id": "lbi-5-q2",
                "soal": "Sikap penulis Teks 2 yang menyatakan 'Namun, kalkulasi Teks 1 mengabaikan biaya pemeliharaan infrastruktur jangka panjang' terhadap Teks 1 dapat dikategorikan sebagai...",
                "opsi": [
                    {"label": "A", "text": "Mendukung tanpa syarat"},
                    {"label": "B", "text": "Mengoreksi atau mengkritisi kelengkapan argumen Teks 1"},
                    {"label": "C", "text": "Menjiplak tulisan Teks 1"},
                    {"label": "D", "text": "Mengabaikan topik sepenuhnya"},
                    {"label": "E", "text": "Menghibur pembaca"}
                ],
                "kunci": "B",
                "pembahasan": "Pernyataan tersebut menunjukkan fungsi korektif: mengkritisi kelemahan atau keterbatasan ruang lingkup perhitungan Teks 1 (B)."
            },
            {
                "id": "lbi-5-q3",
                "soal": "Sintesis yang paling tepat dari dua pandangan yang bertentangan mengenai bekerja dari rumah (WFH) adalah...",
                "opsi": [
                    {"label": "A", "text": "WFH harus dihapuskan sama sekali"},
                    {"label": "B", "text": "Semua kantor fisik harus dijual"},
                    {"label": "C", "text": "Penerapan model kerja hibrida (hybrid working) yang menggabungkan fleksibilitas WFH dengan kolaborasi tatap muka di kantor"},
                    {"label": "D", "text": "Pekerja tidak perlu menerima gaji"},
                    {"label": "E", "text": "Perusahaan harus melarang penggunaan internet"}
                ],
                "kunci": "C",
                "pembahasan": "Sintesis adalah jalan tengah solutif yang menyatukan keunggulan kedua opsi: model hybrid memadukan fleksibilitas dan kolaborasi langsung (C)."
            },
            {
                "id": "lbi-5-q4",
                "soal": "Perbedaan sudut pandang antara artikel akademis jurnalistik dan esai opini pribadi umumnya terletak pada...",
                "opsi": [
                    {"label": "A", "text": "Objektivitas penyajian data dan nada tulisan"},
                    {"label": "B", "text": "Kertas yang digunakan untuk mencetak"},
                    {"label": "C", "text": "Bahasa yang digunakan"},
                    {"label": "D", "text": "Tingkat ketebalan buku"},
                    {"label": "E", "text": "Jenis huruf (font)"}
                ],
                "kunci": "A",
                "pembahasan": "Artikel akademis mengutamakan objektivitas bebas bias emosional, sedangkan esai opini menekankan keberpihakan subjektif dan persuasi emosional (A)."
            },
            {
                "id": "lbi-5-q5",
                "soal": "Saat membaca dua teks bertema lingkungan, Teks 1 fokus pada solusi regulasi pemerintah, sedangkan Teks 2 fokus pada aksi kesadaran individu. Perbedaan keduanya ada pada aspek...",
                "opsi": [
                    {"label": "A", "text": "Subjek pelaku dan pendekatan pemecahan masalah"},
                    {"label": "B", "text": "Negara tempat terjadinya polusi"},
                    {"label": "C", "text": "Zaman terjadinya masalah lingkungan"},
                    {"label": "D", "text": "Bahasa pengantar"},
                    {"label": "E", "text": "Format penerbitan"}
                ],
                "kunci": "A",
                "pembahasan": "Teks 1 mengambil pendekatan top-down (regulasi negara), sedangkan Teks 2 mengambil pendekatan bottom-up (kesadaran individu). Perbedaannya ada pada aktor penggerak dan pendekatan solutif (A)."
            }
        ],
        "keyTakeaways": [
            "Petakan topik bersama vs sudut pandang khusus masing-masing teks.",
            "Persamaan harus didukung oleh kedua teks sekaligus.",
            "Perbedaan fokus sering mencerminkan pendekatan peluang vs tantangan.",
            "Sintesis merumuskan titik temu solutif dari kedua perspektif."
        ],
        "rekomendasiLatihan": "Selesaikan latihan teks ganda di modul Literasi Bahasa Indonesia."
    }
]

# ==============================================================================
# LBING (Literasi Bahasa Inggris) - 5 Bab
# ==============================================================================
LBING_DATA = [
    {
        "id": "lbe-reading-strategies",
        "babNumber": 1,
        "slug": "lbe-reading-strategies",
        "subtestKode": "LBING",
        "judul": "Reading Comprehension Strategies: Main Idea & Purpose",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Mastering academic reading techniques: identifying primary purpose, main idea formulation, topic sentences, and effective skimming-scanning for speed.",
        "learningObjectives": [
            "Identify the topic sentence and formulated main idea of complex academic passages.",
            "Determine the author's primary communicative purpose (to inform, explain, criticize, persuade).",
            "Apply rapid skimming to understand general architecture in under 45 seconds.",
            "Apply targeted scanning to locate specific factual details, names, and dates."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Common Question Stems in SNBT English",
                "isi": "- 'What is the main idea of the passage?'\n- 'What is the author's primary purpose in writing the text?'\n- 'The passage mainly discusses...'\n- 'Which of the following best summarizes paragraph 2?'",
                "poinPenting": [
                    "Topic = The subject matter (1-3 words, e.g., 'Microplastic pollution').",
                    "Main Idea = What the author says about the topic (complete sentence, e.g., 'Microplastic pollution poses severe cardiovascular risks to marine life and humans')."
                ]
            },
            {
                "subjudul": "2. Primary Purpose Verbs",
                "isi": "Pay attention to the infinitive verbs in the answer choices:\n- 'To describe / To explain' = Neutral exposition of how something works.\n- 'To argue / To advocate' = Persuading the audience to take a stance.\n- 'To refute / To challenge' = Disproving a commonly held misconception.\n- 'To evaluate' = Examining both strengths and weaknesses.",
                "poinPenting": [
                    "Match the tone of the verb with the overall demeanor of the passage."
                ]
            }
        ],
        "trikCepat": "First & Last Strategy: Read the first 2 sentences and the last sentence of the first paragraph, followed by the first sentence of each subsequent paragraph. You will capture 80% of the main idea without reading the whole 400-word text!",
        "jebakanUmum": "Choosing an answer choice that only summarizes a single supporting example mentioned in one sentence rather than the entire passage.",
        "contohSoal": [
            {
                "soal": "Passage snippet: 'Recent satellite telemetry reveals that deep-sea thermal vents host unexpected microbial biodiversity capable of metabolizing sulfur compounds without sunlight. Understanding these extremophiles offers profound implications for astrobiology and the search for extraterrestrial life on icy moons.'\nThe primary purpose of the passage is to...",
                "opsi": {
                    "A": "Criticize deep-sea mining expeditions",
                    "B": "Highlight the significance of hydrothermal vent microbes for space research",
                    "C": "Prove that life cannot exist without solar radiation",
                    "D": "Describe the construction of oceanographic satellites",
                    "E": "Argue against space exploration funding"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "The passage focuses on unexpected deep-sea extremophiles metabolizing sulfur without sunlight.",
                    "The second sentence connects this discovery to astrobiology and the search for extraterrestrial life on icy moons.",
                    "Thus, the author's purpose is to highlight the significance of hydrothermal vent microbes for space research (B).",
                    "Option A, C, D, and E are unsupported or contradict the text."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbe-1-q1",
                "soal": "Which question stem asks for the PRIMARY PURPOSE of a text?",
                "opsi": [
                    {"label": "A", "text": "According to line 5, what happened in 1998?"},
                    {"label": "B", "text": "Why did the author most likely write this passage?"},
                    {"label": "C", "text": "The word 'resilient' in paragraph 2 is closest in meaning to..."},
                    {"label": "D", "text": "Which of the following is NOT mentioned in the text?"},
                    {"label": "E", "text": "What does the pronoun 'they' refer to?"}
                ],
                "kunci": "B",
                "pembahasan": "'Why did the author most likely write this passage?' directly probes the author's primary communicative intent/purpose (B)."
            },
            {
                "id": "lbe-1-q2",
                "soal": "If a passage examines the causes of colony collapse disorder in honeybees and explores three potential scientific remedies, the main idea is best stated as...",
                "opsi": [
                    {"label": "A", "text": "Honey is the most delicious natural sweetener."},
                    {"label": "B", "text": "Colony collapse disorder threatens honeybee populations, but potential remedies offer viable solutions."},
                    {"label": "C", "text": "All insects will become extinct by the next century."},
                    {"label": "D", "text": "Pesticide manufacturers have ceased all chemical production."},
                    {"label": "E", "text": "Beekeeping is an expensive agricultural hobby."}
                ],
                "kunci": "B",
                "pembahasan": "The main idea must cover both the threat (colony collapse disorder) and the potential remedies discussed throughout the text (B)."
            },
            {
                "id": "lbe-1-q3",
                "soal": "What reading technique is best suited for finding a specific statistical percentage in paragraph 3?",
                "opsi": [
                    {"label": "A", "text": "Critical introspection"},
                    {"label": "B", "text": "Scanning for numbers and the '%' symbol"},
                    {"label": "C", "text": "Reading word by word aloud"},
                    {"label": "D", "text": "Translating every sentence into Indonesian first"},
                    {"label": "E", "text": "Memorizing the whole paragraph"}
                ],
                "kunci": "B",
                "pembahasan": "Scanning is the targeted visual search for specific visual cues, such as numerals, capital letters, or special symbols (B)."
            },
            {
                "id": "lbe-1-q4",
                "soal": "An answer choice that states a fact mentioned ONLY in line 12 is usually INCORRECT for a 'Main Idea' question because it is...",
                "opsi": [
                    {"label": "A", "text": "Grammatically incorrect"},
                    {"label": "B", "text": "Too narrow in scope to represent the whole text"},
                    {"label": "C", "text": "Too broad and philosophical"},
                    {"label": "D", "text": "Written in British English"},
                    {"label": "E", "text": "A typographical error"}
                ],
                "kunci": "B",
                "pembahasan": "Details that only describe one single sentence are 'too narrow' (supporting details), hence they cannot serve as the overarching main idea (B)."
            },
            {
                "id": "lbe-1-q5",
                "soal": "The verb 'to refute' in a primary purpose question means...",
                "opsi": [
                    {"label": "A", "text": "To celebrate an anniversary"},
                    {"label": "B", "text": "To prove an argument or theory to be false or erroneous"},
                    {"label": "C", "text": "To tell a bedtime story"},
                    {"label": "D", "text": "To translate a foreign document"},
                    {"label": "E", "text": "To invite attendees to an event"}
                ],
                "kunci": "B",
                "pembahasan": "'To refute' means to disprove a statement or demonstrate that an argument is flawed or false (B)."
            }
        ],
        "keyTakeaways": [
            "Distinguish between Topic (subject) and Main Idea (full assertion).",
            "Scrutinize purpose verbs: explain (neutral) vs advocate (persuasive) vs refute (disprove).",
            "Use the First & Last Sentence strategy for quick comprehension.",
            "Avoid choices that are too narrow or dwell solely on one detail."
        ],
        "rekomendasiLatihan": "Practice reading academic passages in English Literacy Gemilang."
    },
    {
        "id": "lbe-vocabulary-in-context",
        "babNumber": 2,
        "slug": "lbe-vocabulary-in-context",
        "subtestKode": "LBING",
        "judul": "Vocabulary in Context & Idiomatic Clues",
        "durasiBacaMenit": 12,
        "ringkasanSingkat": "Determining the contextual meaning of polysemous words, academic idioms, and advanced terms using surrounding syntax, contrast clues, and structural prefixes.",
        "learningObjectives": [
            "Use context clues (definition, contrast, restatement, example) to deduce unfamiliar vocabulary.",
            "Identify the secondary or figurative meaning of common words (e.g., 'table' a proposal, 'check' growth).",
            "Utilize Latin and Greek prefixes/roots (anti-, hyper-, morph-, bene-) to infer word connotations.",
            "Execute the substitution test to ensure syntactic and semantic congruence."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Four Types of Context Clues",
                "isi": "1. Contrast Clues: Signaled by 'unlike', 'whereas', 'despite', 'in contrast'. (e.g., 'Unlike his gregarious sister, Mark was notoriously taciturn' -> taciturn = quiet/reserved).\n2. Restatement / Apposition: Signaled by commas or dashes. (e.g., 'The panacea—a universal cure for all ailments—was mythical').\n3. Cause and Effect: Signaled by 'as a result', 'consequently'.\n4. Example Clues: Signaled by 'such as', 'for instance'.",
                "poinPenting": [
                    "Never rely on dictionary memory alone; context always overrides default meaning."
                ]
            },
            {
                "subjudul": "2. Secondary Meanings of Everyday Words",
                "isi": "UTBK frequently tests common words used in unfamiliar, specialized senses:\n- 'champion' (verb) = to advocate or support vigorously.\n- 'harbor' (verb) = to hold or maintain a belief/pathogen secretly.\n- 'compromise' (verb) = to endanger or undermine safety/integrity.",
                "poinPenting": [
                    "Example: 'The breach compromised security' means weakened/endangered, not reached mutual agreement!"
                ]
            }
        ],
        "trikCepat": "Plug-In Test: Replace the target word in the original sentence with each candidate option. The correct answer must sound completely natural and maintain identical logical sense without altering the sentence structure!",
        "jebakanUmum": "Selecting the most common colloquial definition of a word (e.g., defining 'novel' as 'a fiction book' when it means 'new and original' in an academic context).",
        "contohSoal": [
            {
                "soal": "Sentence: 'Exposure to excessive UV radiation can *compromise* the cellular integrity of epidermal skin layers, making them susceptible to premature aging.'\nThe word *compromise* in this sentence is closest in meaning to...",
                "opsi": {
                    "A": "Negotiate an agreement",
                    "B": "Weaken or damage",
                    "C": "Strengthen significantly",
                    "D": "Replicate rapidly",
                    "E": "Neutralize completely"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "In everyday speech, 'compromise' means reaching a mutual settlement.",
                    "However, in scientific contexts, 'to compromise integrity' means to impair, weaken, or damage structural stability.",
                    "Substituting 'weaken or damage' makes complete sense: UV radiation weakens cellular integrity.",
                    "Therefore, the correct contextual meaning is B."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbe-2-q1",
                "soal": "'Unlike his meticulous brother, who double-checked every calculation, Kevin was notoriously *slipshod* in his laboratory work.' The word *slipshod* most nearly means...",
                "opsi": [
                    {"label": "A", "text": "Careless and untidy"},
                    {"label": "B", "text": "Extremely punctual"},
                    {"label": "C", "text": "Courteous and polite"},
                    {"label": "D", "text": "Highly accomplished"},
                    {"label": "E", "text": "Wealthy"}
                ],
                "kunci": "A",
                "pembahasan": "The contrast clue 'Unlike his meticulous brother' (who is careful) indicates that 'slipshod' means the opposite: careless, sloppy, or untidy (A)."
            },
            {
                "id": "lbe-2-q2",
                "soal": "In the sentence: 'Dr. Evelyn *championed* the rights of indigenous communities to preserve ancestral forests,' the word *championed* is synonymous with...",
                "opsi": [
                    {"label": "A", "text": "Won first place in"},
                    {"label": "B", "text": "Vigorously supported and advocated for"},
                    {"label": "C", "text": "Completely ignored"},
                    {"label": "D", "text": "Heavily taxed"},
                    {"label": "E", "text": "Photographed"}
                ],
                "kunci": "B",
                "pembahasan": "As a transitive verb, 'to champion' means to vigorously defend, promote, or advocate for a noble cause or right (B)."
            },
            {
                "id": "lbe-2-q3",
                "soal": "The prefix 'bene-' in words like 'beneficial', 'benevolent', and 'benefactor' carries the meaning of...",
                "opsi": [
                    {"label": "A", "text": "Bad or harmful"},
                    {"label": "B", "text": "Good or well"},
                    {"label": "C", "text": "Ancient or historical"},
                    {"label": "D", "text": "Fast or swift"},
                    {"label": "E", "text": "Invisible"}
                ],
                "kunci": "B",
                "pembahasan": "The Latin root 'bene' means good or well (e.g., beneficial = good for health/success) (B)."
            },
            {
                "id": "lbe-2-q4",
                "soal": "'The treaty was intended to *foster* closer trade ties between the two coastal nations.' The word *foster* most closely means...",
                "opsi": [
                    {"label": "A", "text": "Encourage and cultivate"},
                    {"label": "B", "text": "Terminate abruptly"},
                    {"label": "C", "text": "Prohibit legally"},
                    {"label": "D", "text": "Tax heavily"},
                    {"label": "E", "text": "Misinterpret"}
                ],
                "kunci": "A",
                "pembahasan": "'To foster' means to promote the growth or development of something desirable (to cultivate or encourage) (A)."
            },
            {
                "id": "lbe-2-q5",
                "soal": "Which word below represents a 'contrast transition' that signals opposite meaning in context clues?",
                "opsi": [
                    {"label": "A", "text": "Furthermore"},
                    {"label": "B", "text": "Consequently"},
                    {"label": "C", "text": "Nevertheless"},
                    {"label": "D", "text": "Likewise"},
                    {"label": "E", "text": "Similarly"}
                ],
                "kunci": "C",
                "pembahasan": "'Nevertheless' introduces a contrast or concession, functioning as a clear contrast signal (C)."
            }
        ],
        "keyTakeaways": [
            "Use contrast signals (unlike, however, whereas) to deduce antonyms.",
            "Watch out for secondary meanings of common words (champion, harbor, compromise).",
            "Apply the substitution test into the original sentence.",
            "Analyze Latin/Greek roots (bene, mal, chron, bio) for emotional tone."
        ],
        "rekomendasiLatihan": "Build your academic vocabulary bank in the Gemilang Vocabulary Module."
    },
    {
        "id": "lbe-text-structure-and-cohesion",
        "babNumber": 3,
        "slug": "lbe-text-structure-and-cohesion",
        "subtestKode": "LBING",
        "judul": "Text Structure, Flow & Cohesive Devices",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Recognizing organizational patterns: cause-effect, compare-contrast, problem-solution, and chronological ordering, along with discourse markers and pronoun antecedents.",
        "learningObjectives": [
            "Identify the overall organizational structure of academic paragraphs.",
            "Trace pronoun antecedents ('it', 'this', 'they', 'which') back to their correct referents.",
            "Choose the most appropriate transitional word to fill in sentence gaps.",
            "Understand the relationship between consecutive paragraphs (support, elaborate, counter)."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Common Text Structures",
                "isi": "- Cause and Effect: Explains why a phenomenon occurs and its consequences (markers: 'as a consequence', 'attributable to', 'yields').\n- Compare and Contrast: Evaluates similarities and distinctions (markers: 'similarly', 'conversely', 'in stark contrast').\n- Problem and Solution: Identifies an urgent issue and proposes practical interventions.\n- Classification / Exemplification: Categorizes a concept into subsets.",
                "poinPenting": [
                    "UTBK Question: 'How does paragraph 2 relate to paragraph 1?'"
                ]
            },
            {
                "subjudul": "2. Pronoun Referent Tracing",
                "isi": "Pronouns ('this discovery', 'these findings', 'its impact') always point to a noun phrase in the immediately preceding clause. Check singular/plural agreement carefully.",
                "poinPenting": [
                    "A plural pronoun 'they' CANNOT refer to a singular collective noun like 'the government' or 'the committee' in formal American English."
                ]
            }
        ],
        "trikCepat": "Connector Classification: When choosing transition words, classify options into 4 families: Addition (moreover), Contrast (however), Cause/Effect (therefore), or Sequence (subsequently). Eliminate all choices from the wrong family at once!",
        "jebakanUmum": "Assuming 'However' and 'Therefore' are interchangeable. Make sure whether the logic flows in the same direction or reverses direction!",
        "contohSoal": [
            {
                "soal": "Sentence: 'Renewable energy investments reached an all-time peak last year; [ ... ], fossil fuel subsidies continued to distort market prices in several developing economies.'\nThe most suitable transitional word to fill in the blank is...",
                "opsi": {
                    "A": "furthermore",
                    "B": "consequently",
                    "C": "nevertheless",
                    "D": "similarly",
                    "E": "in other words"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "First clause: Positive progress in renewable energy investments.",
                    "Second clause: Persistent negative distortion through fossil fuel subsidies.",
                    "The two clauses present contrasting and tension-filled dynamics.",
                    "The transitional word must express contrast/concession: 'nevertheless' (C).",
                    "Options A and D express addition/similarity; B expresses consequence."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbe-3-q1",
                "soal": "If Paragraph 1 defines antibiotic resistance and Paragraph 2 details the biochemical pathways bacteria use to neutralize drugs, the relationship between Paragraph 2 and Paragraph 1 is that Paragraph 2...",
                "opsi": [
                    {"label": "A", "text": "Contradicts the main premise of paragraph 1"},
                    {"label": "B", "text": "Provides an elaborate explanation of the biological mechanism defined in paragraph 1"},
                    {"label": "C", "text": "Introduces an entirely unrelated historical event"},
                    {"label": "D", "text": "Refutes the existence of antibiotics"},
                    {"label": "E", "text": "Presents a personal diary entry"}
                ],
                "kunci": "B",
                "pembahasan": "Paragraph 2 elaborates upon the specific mechanistic details of the phenomenon defined in Paragraph 1 (B)."
            },
            {
                "id": "lbe-3-q2",
                "soal": "In the sentence: 'Researchers observed that captive elephants exhibited signs of grief when a matriarch died; *they* lingered near the body for hours.' The pronoun *they* refers to...",
                "opsi": [
                    {"label": "A", "text": "Researchers"},
                    {"label": "B", "text": "Signs"},
                    {"label": "C", "text": "Captive elephants"},
                    {"label": "D", "text": "Hours"},
                    {"label": "E", "text": "Bodies"}
                ],
                "kunci": "C",
                "pembahasan": "The entity performing the physical action of lingering near the deceased matriarch is the 'captive elephants' (C)."
            },
            {
                "id": "lbe-3-q3",
                "soal": "Which transitional phrase signals a RESULT or CONSEQUENCE?",
                "opsi": [
                    {"label": "A", "text": "On the other hand"},
                    {"label": "B", "text": "As a result"},
                    {"label": "C", "text": "For instance"},
                    {"label": "D", "text": "In addition"},
                    {"label": "E", "text": "Despite this"}
                ],
                "kunci": "B",
                "pembahasan": "'As a result' explicitly signals cause-and-effect consequence (B)."
            },
            {
                "id": "lbe-3-q4",
                "soal": "A text organized according to chronological order is most likely discussing...",
                "opsi": [
                    {"label": "A", "text": "The geological evolution of the Grand Canyon over millions of years"},
                    {"label": "B", "text": "Why electric cars are superior to gasoline vehicles"},
                    {"label": "C", "text": "The definition of philosophical nihilism"},
                    {"label": "D", "text": "A list of ten random mathematical formulas"},
                    {"label": "E", "text": "The layout of a museum gift shop"}
                ],
                "kunci": "A",
                "pembahasan": "Geological evolution over time represents a sequential, chronological timeline of developmental stages (A)."
            },
            {
                "id": "lbe-3-q5",
                "soal": "Which cohesive device is used when a writer replaces a previously mentioned noun phrase with a synonym to prevent repetitive phrasing?",
                "opsi": [
                    {"label": "A", "text": "Lexical cohesion (synonymy)"},
                    {"label": "B", "text": "Ellipsis"},
                    {"label": "C", "text": "Conjunction error"},
                    {"label": "D", "text": "Phonetic rhyming"},
                    {"label": "E", "text": "Punctuation inversion"}
                ],
                "kunci": "A",
                "pembahasan": "Lexical cohesion via synonymy involves utilizing varied vocabulary terms that carry identical semantic referents across sentences (A)."
            }
        ],
        "keyTakeaways": [
            "Classify transition words by logical family: contrast, addition, cause, or sequence.",
            "Verify pronoun referents for number and gender agreement.",
            "Map inter-paragraph relationships: definition → mechanism → application.",
            "Chronological texts emphasize time markers and sequential progression."
        ],
        "rekomendasiLatihan": "Sharpen reading cohesion skills in English Literacy practice tests."
    },
    {
        "id": "lbe-authors-purpose-and-tone",
        "babNumber": 4,
        "slug": "lbe-authors-purpose-and-tone",
        "subtestKode": "LBING",
        "judul": "Author's Tone, Attitude & Implicit Bias",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Decoding subjective attitudes in academic English: distinguishing between neutral/objective, skeptical, critical, enthusiastic, apprehensive, and satirical tones.",
        "learningObjectives": [
            "Identify the author's tone through evaluative adjectives and adverbs.",
            "Distinguish between unbiased journalistic reporting and opinionated editorial prose.",
            "Detect subtle skepticism or caution in scientific claims ('tentative', 'premature', 'unwarranted').",
            "Infer the author's stance on controversial technological and social debates."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Spectrum of Academic Tones",
                "isi": "- Objective / Detached / Neutral: Presents research findings straightforwardly without emotional coloring.\n- Skeptical / Critical: Questions validity; highlights methodological flaws or exaggerated marketing hype.\n- Apprehensive / Concerned: Expresses profound anxiety regarding environmental or ethical perils.\n- Optimistic / Sanguine: Confident about future breakthroughs and human resilience.\n- Cynical / Sarcastic: Scornful mockery of incompetence or hypocrisy.",
                "poinPenting": [
                    "Academic passages in SNBT are rarely extreme (infuriated or ecstatic); look for measured nuances."
                ]
            },
            {
                "subjudul": "2. Clue Words for Tone Detection",
                "isi": "- Skeptical: 'alleged', 'questionable', 'so-called', 'requires verification'.\n- Apprehensive: 'alarming', 'perilous', 'precarious', 'grave concern'.\n- Commendable: 'remarkable', 'breakthrough', 'laudable', 'pioneering'.",
                "poinPenting": [
                    "Trace the adjective choices in the concluding paragraph."
                ]
            }
        ],
        "trikCepat": "Positive / Negative / Neutral Filter: Label every tone option as (+) Positive, (-) Negative, or (0) Neutral. If the author uses words like 'alarming' and 'dire consequences', eliminate all (+) and (0) options immediately!",
        "jebakanUmum": "Confusing the attitude of a person quoted in the text with the author's own perspective. Always distinguish between quoted speech and the author's narration!",
        "contohSoal": [
            {
                "soal": "Passage excerpt: 'While commercial developers herald generative AI as an unalloyed blessing, educators must cast a wary eye on its propensity to induce cognitive complacency and erode basic analytical writing competencies.'\nThe author's tone toward generative AI in education can best be characterized as...",
                "opsi": {
                    "A": "Unreservedly enthusiastic",
                    "B": "Cautious and skeptical",
                    "C": "Indifferent and bored",
                    "D": "Outraged and vengeful",
                    "E": "Mildly amused"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "The author urges educators to 'cast a wary eye' and points out risks like 'cognitive complacency' and 'erosion of analytical competencies'.",
                    "'Wary' directly denotes caution and guarded skepticism.",
                    "Thus, the author's tone is cautious and skeptical (B).",
                    "Option A is the opposite; C, D, and E do not reflect the academic warning."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbe-4-q1",
                "soal": "An author who states that 'The preliminary trial results are promising, yet further large-scale longitudinal investigations are imperative before clinical adoption' displays a tone of...",
                "opsi": [
                    {"label": "A", "text": "Reckless abandonment"},
                    {"label": "B", "text": "Cautious optimism"},
                    {"label": "C", "text": "Blatant cynicism"},
                    {"label": "D", "text": "Hostile condemnation"},
                    {"label": "E", "text": "Complete despair"}
                ],
                "kunci": "B",
                "pembahasan": "'Promising' reflects optimism, while 'yet further investigations are imperative' demonstrates caution. Together, they form 'cautious optimism' (B)."
            },
            {
                "id": "lbe-4-q2",
                "soal": "Which word below describes an attitude that is fair, impartial, and free from personal bias?",
                "opsi": [
                    {"label": "A", "text": "Biased"},
                    {"label": "B", "text": "Partisan"},
                    {"label": "C", "text": "Objective"},
                    {"label": "D", "text": "Prejudiced"},
                    {"label": "E", "text": "Dogmatic"}
                ],
                "kunci": "C",
                "pembahasan": "'Objective' denotes being impartial, balanced, and evidence-driven without personal prejudice (C)."
            },
            {
                "id": "lbe-4-q3",
                "soal": "The word 'sanguine' when used to describe an author's outlook means...",
                "opsi": [
                    {"label": "A", "text": "Bloody and violent"},
                    {"label": "B", "text": "Optimistic and cheerfully confident"},
                    {"label": "C", "text": "Extremely depressed"},
                    {"label": "D", "text": "Easily frightened"},
                    {"label": "E", "text": "Indifferent"}
                ],
                "kunci": "B",
                "pembahasan": "In formal English, 'sanguine' means optimistic or positive, especially in an apparently bad or difficult situation (B)."
            },
            {
                "id": "lbe-4-q4",
                "soal": "Tone words like 'scornful', 'derisive', and 'mocking' belong to which tone category?",
                "opsi": [
                    {"label": "A", "text": "Nostalgic"},
                    {"label": "B", "text": "Satirical / Cynical"},
                    {"label": "C", "text": "Empathetic"},
                    {"label": "D", "text": "Solemn"},
                    {"label": "E", "text": "Reverent"}
                ],
                "kunci": "B",
                "pembahasan": "Scornful and derisive words indicate biting mockery, contempt, and cynical satire (B)."
            },
            {
                "id": "lbe-4-q5",
                "soal": "To identify whether an author is biased in an opinion piece, a critical reader should evaluate...",
                "opsi": [
                    {"label": "A", "text": "Whether opposing viewpoints are acknowledged and fairly represented with evidence"},
                    {"label": "B", "text": "The font size chosen by the typesetter"},
                    {"label": "C", "text": "The length of the author's biography"},
                    {"label": "D", "text": "Whether the text contains rhyme schemes"},
                    {"label": "E", "text": "The nationality of the printing house"}
                ],
                "kunci": "A",
                "pembahasan": "Fair acknowledgment and empirical evaluation of counterarguments is the primary hallmark of balanced, unbiased writing (A)."
            }
        ],
        "keyTakeaways": [
            "Filter tone choices into Positive (+), Negative (-), or Neutral (0).",
            "Look for evaluative diction in concluding paragraphs.",
            "'Cautious optimism' is very common in scientific passages.",
            "Do not confuse quoted interviewees' emotions with the author's perspective."
        ],
        "rekomendasiLatihan": "Practice tone classification on diverse literary and academic texts."
    },
    {
        "id": "lbe-cross-text-comparison",
        "babNumber": 5,
        "slug": "lbe-cross-text-comparison",
        "subtestKode": "LBING",
        "judul": "Comparative Synthesis & Multi-Passage Evaluation",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Synthesizing paired academic passages: comparing central themes, evaluating points of agreement and divergence, and analyzing how Passage B responds to Passage A.",
        "learningObjectives": [
            "Pinpoint the shared overarching subject matter of paired passages.",
            "Identify key divergences in perspective, methodology, or recommendations.",
            "Analyze how the author of Passage B would respond to an assertion in Passage A.",
            "Synthesize both viewpoints into a unified, balanced conclusion."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Paired Passage Question Architecture",
                "isi": "Typical questions include:\n- 'Both passages are primarily concerned with...'\n- 'The author of Passage B would most likely respond to the claim in Passage A by...'\n- 'Unlike Passage A, Passage B places greater emphasis on...'\n- 'Which statement reflects a belief held by BOTH authors?'",
                "poinPenting": [
                    "Read Passage A and answer Passage A questions first, then read Passage B and answer comparative questions."
                ]
            },
            {
                "subjudul": "2. Types of Multi-Passage Relationships",
                "isi": "- Complementary: Passage B expands or adds practical application to Passage A.\n- Adversarial / Conflicting: Passage B directly disputes the thesis of Passage A.\n- Theoretical vs Empirical: Passage A proposes a hypothesis, Passage B tests it with real-world data.",
                "poinPenting": [
                    "Always look for explicit points of consensus before tackling disputed details."
                ]
            }
        ],
        "trikCepat": "Point-by-Point Matrix: Summarize Passage A in 3 words (e.g., 'EV = Green') and Passage B in 3 words (e.g., 'Batteries = Toxic'). If asked how B views A, the answer is always that A is overly simplistic or ignores battery life cycles!",
        "jebakanUmum": "Selecting an answer that only accurately describes Passage A when the question specifically asks for an opinion shared by BOTH authors.",
        "contohSoal": [
            {
                "soal": "Passage 1 argues that social media platforms democratize public discourse by giving voice to marginalized citizens. Passage 2 contends that algorithmic amplification creates polarizing echo chambers that distort democratic deliberation.\nWhich of the following describes the relationship between the two passages?",
                "opsi": {
                    "A": "Passage 2 presents empirical verification of the claims in Passage 1.",
                    "B": "Passage 2 offers a critical counterpoint to the optimistic perspective in Passage 1.",
                    "C": "Both passages advocate for the complete shutdown of the internet.",
                    "D": "Passage 1 refutes the historical claims made in Passage 2.",
                    "E": "Passage 2 discusses corporate finance while Passage 1 discusses botany."
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Passage 1 presents an optimistic perspective on social media's democratizing power.",
                    "Passage 2 presents a critical counterpoint highlighting algorithmic polarization and echo chambers.",
                    "Therefore, Passage 2 provides a critical counterpoint to the optimistic view in Passage 1 (B)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "lbe-5-q1",
                "soal": "When answering 'Both authors would most likely agree that...', the correct answer choice MUST...",
                "opsi": [
                    {"label": "A", "text": "Be directly supported by evidence in BOTH passages"},
                    {"label": "B", "text": "Be stated only in the title of Passage A"},
                    {"label": "C", "text": "Express an extreme opinion that shocks the reader"},
                    {"label": "D", "text": "Contradict the conclusions of both texts"},
                    {"label": "E", "text": "Be quoted verbatim from Passage B only"}
                ],
                "kunci": "A",
                "pembahasan": "An agreement claim must be firmly substantiated by textual evidence found in both passages simultaneously (A)."
            },
            {
                "id": "lbe-5-q2",
                "soal": "If Passage A is written by an enthusiastic tech entrepreneur and Passage B is written by an environmental regulator, the difference in perspective is primarily driven by...",
                "opsi": [
                    {"label": "A", "text": "Their respective professional roles and underlying priorities (innovation vs safety/compliance)"},
                    {"label": "B", "text": "Different font preferences"},
                    {"label": "C", "text": "One author writing in French"},
                    {"label": "D", "text": "Grammatical errors in Passage B"},
                    {"label": "E", "text": "Accidental printing mistakes"}
                ],
                "kunci": "A",
                "pembahasan": "The contrasting perspectives stem from distinct professional roles and priorities: commercial innovation vs environmental protection and compliance (A)."
            },
            {
                "id": "lbe-5-q3",
                "soal": "How should a test-taker approach paired passages to optimize cognitive efficiency?",
                "opsi": [
                    {"label": "A", "text": "Read Passage A, answer questions specific to Passage A; then read Passage B, answer Passage B questions, and finally answer comparative questions"},
                    {"label": "B", "text": "Read both passages backwards sentence by sentence"},
                    {"label": "C", "text": "Skim only the questions and guess without reading"},
                    {"label": "D", "text": "Spend 25 minutes reading Passage A and skip Passage B"},
                    {"label": "E", "text": "Translate both passages into third languages"}
                ],
                "kunci": "A",
                "pembahasan": "The staged approach (A questions first, then B questions, then comparative synthesis) prevents cognitive overload and memory interference (A)."
            },
            {
                "id": "lbe-5-q4",
                "soal": "A synthesis statement combining Passage A (urban green spaces improve mental health) and Passage B (land scarcity in cities limits park creation) would be...",
                "opsi": [
                    {"label": "A", "text": "Cities must abandon mental healthcare entirely."},
                    {"label": "B", "text": "Innovative micro-gardening and vertical greenery should be adopted to provide psychological benefits despite severe urban land constraints."},
                    {"label": "C", "text": "All city residents must move to rural farms."},
                    {"label": "D", "text": "Trees should be prohibited in metropolitan areas."},
                    {"label": "E", "text": "Parks have zero value for urban dwellers."}
                ],
                "kunci": "B",
                "pembahasan": "A true synthesis marries the psychological benefits of greenery (A) with the realistic constraint of urban land scarcity (B) through creative solutions like vertical gardens (B)."
            },
            {
                "id": "lbe-5-q5",
                "soal": "The phrase 'in stark contrast to' signals that the succeeding passage or paragraph will present...",
                "opsi": [
                    {"label": "A", "text": "A completely identical viewpoint"},
                    {"label": "B", "text": "A diametrically opposed or sharply differing perspective"},
                    {"label": "C", "text": "A list of food recipes"},
                    {"label": "D", "text": "An apology from the author"},
                    {"label": "E", "text": "A statistical index number"}
                ],
                "kunci": "B",
                "pembahasan": "'In stark contrast to' introduces a sharply divergent or opposite stance (B)."
            }
        ],
        "keyTakeaways": [
            "Read Passage A and answer its specific questions before reading Passage B.",
            "Pinpoint the exact point of divergence between the two authors.",
            "Agreement questions require dual substantiation in both texts.",
            "Synthesis combines the core insights of both sides into a balanced model."
        ],
        "rekomendasiLatihan": "Master comparative passages in Gemilang's full-length UTBK simulations."
    }
]

with open(os.path.join(MODUL_DIR, 'lbinModul.js'), 'w', encoding='utf-8') as f:
    f.write(f"""// src/data/modul/lbinModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const LBIN_MODUL = {json.dumps(LBIN_DATA, indent=2, ensure_ascii=False)};
""")
print(f"✅ Generated lbinModul.js with {len(LBIN_DATA)} bab.")

with open(os.path.join(MODUL_DIR, 'lbingModul.js'), 'w', encoding='utf-8') as f:
    f.write(f"""// src/data/modul/lbingModul.js
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const LBING_MODUL = {json.dumps(LBING_DATA, indent=2, ensure_ascii=False)};
""")
print(f"✅ Generated lbingModul.js with {len(LBING_DATA)} bab.")
