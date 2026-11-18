#!/usr/bin/env python3
"""
generate_all_modul_parts.py
Generates the remaining 6 subtest files:
- ppuModul.js (5 bab)
- pbmModul.js (6 bab)
- pkModul.js (10 bab)
- lbinModul.js (5 bab)
- lbingModul.js (5 bab)
- pmModul.js (9 bab)
"""
import os
import json

MODUL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'modul')
os.makedirs(MODUL_DIR, exist_ok=True)

def write_js(filename, var_name, data):
    filepath = os.path.join(MODUL_DIR, filename)
    code = f"""// src/data/modul/{filename}
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Standard)
// 100% UNLOCKED UNTUK SELURUH SISWA GEMILANG

export const {var_name} = {json.dumps(data, indent=2, ensure_ascii=False)};
"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"✅ Generated {filename} with {len(data)} bab.")

# ==============================================================================
# 2. PPU (Pengetahuan & Pemahaman Umum) - 5 Bab
# ==============================================================================
PPU_DATA = [
    {
        "id": "ppu-makna-kata-dan-konteks",
        "babNumber": 1,
        "slug": "ppu-makna-kata-dan-konteks",
        "subtestKode": "PPU",
        "judul": "Makna Kata: Leksikal, Gramatikal & Kontekstual",
        "durasiBacaMenit": 12,
        "ringkasanSingkat": "Membedakan makna denotatif (harfiah/leksikal) dan konotatif (asosiatif/kontekstual) serta cara menentukan arti kata/istilah khusus dalam wacana UTBK.",
        "learningObjectives": [
            "Membedakan makna leksikal (arti kamus dasar) dengan makna gramatikal akibat afiksasi/konteks kalimat.",
            "Mengidentifikasi pergeseran makna konotatif positif (ameliorasi) dan negatif (peyorasi).",
            "Menebak arti istilah teknis ilmiah berdasarkan petunjuk kalimat pendahulu dan penjelas.",
            "Menghindari jebakan makna harfiah pada kata yang digunakan secara metaforis."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Taksonomi Makna Kata",
                "isi": "Makna kata dalam bahasa Indonesia dapat dipilah menjadi: Makna Leksikal (makna dasar kata sesuai KBBI tanpa konteks kalimat), Makna Gramatikal (makna yang lahir setelah mengalami proses morfologis seperti pengimbuhan, pengulangan, atau penempatan dalam struktur kalimat), dan Makna Kontekstual (makna yang ditentukan oleh situasi tuturan atau bidang keilmuan teks).",
                "poinPenting": [
                    "Leksikal: 'meja' = perabot rumah bertiang untuk menaruh barang.",
                    "Gramatikal: 'meja hijau' = pengadilan; 'mempermejakan' = memberhentikan sementara pegawai.",
                    "Kontekstual: 'panas' dalam 'suhu ruangan' (termal) berbeda dengan 'suasana politik panas' (tegang)."
                ]
            },
            {
                "subjudul": "2. Denotasi vs Konotasi",
                "isi": "Denotasi adalah makna lugas dan objektif. Konotasi adalah makna tambahan berupa nilai rasa emosional (positif, negatif, atau asosiatif). Di UTBK, pertanyaan sering menanyakan: 'Kata X dalam paragraf tersebut berasosiasi dengan...'",
                "poinPenting": [
                    "Konotasi Halus (Ameliorasi): 'tunanetra' (buta), 'pramusaji' (pelayan).",
                    "Konotasi Kasar/Turun (Peyorasi): 'bunting' (hamil untuk manusia)."
                ]
            }
        ],
        "trikCepat": "Gunakan Teknik Substitusi (Ganti Kata): Saat diminta mencari sinonim kontekstual kata X, gantikan kata X di dalam kalimat dengan masing-masing opsi A sampai E. Pilih opsi yang membuat kalimat tetap mengalir logis tanpa merusak makna paragraf!",
        "jebakanUmum": "Memilih arti kata yang paling umum di kamus, padahal di dalam paragraf kata tersebut dipakai dalam konteks metaforis atau spesialisasi bidang tertentu.",
        "contohSoal": [
            {
                "soal": "Perhatikan kutipan teks:\n'Kebijakan moneter bank sentral yang agresif berhasil *menjinakkan* laju inflasi tahunan hingga berada di kisaran target 2,5%.'\nMakna kata *menjinakkan* pada kalimat tersebut paling dekat dengan...",
                "opsi": {
                    "A": "Memelihara agar patuh",
                    "B": "Mengendalikan atau meredam",
                    "C": "Menyembuhkan dari penyakit",
                    "D": "Memusnahkan sama sekali",
                    "E": "Mencegah agar tidak terjadi"
                },
                "kunci": "B",
                "pembahasanLangkah": [
                    "Makna harfiah 'menjinakkan' berkaitan dengan membuat hewan liar menjadi patuh.",
                    "Dalam konteks kalimat ekonomi, subjeknya adalah laju inflasi. Inflasi adalah variabel yang berfluktuasi naik-turun.",
                    "Kata 'menjinakkan' digunakan secara kiasan yang berarti mengendalikan, meredam, atau menstabilkan lonjakan inflasi.",
                    "Maka padanan yang paling tepat adalah 'Mengendalikan atau meredam' (B)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "ppu-1-q1",
                "soal": "Kata 'menyaring' yang bermakna gramatikal sama dengan 'menyaring pelamar kerja berprestasi' terdapat pada kalimat...",
                "opsi": [
                    {"label": "A", "text": "Ibu menyaring santan kelapa untuk membuat opor."},
                    {"label": "B", "text": "Laboratorium itu menyaring sampel air limbah industri."},
                    {"label": "C", "text": "Tim seleksi menyaring kandidat penerima beasiswa unggulan."},
                    {"label": "D", "text": "Alat ini berfungsi menyaring partikel debu halus di udara."},
                    {"label": "E", "text": "Kain kasa digunakan untuk menyaring endapan kimia."}
                ],
                "kunci": "C",
                "pembahasan": "Pada 'menyaring pelamar kerja', kata 'menyaring' bermakna menyeleksi atau memilah secara kualitatif. Hal ini semakna dengan 'menyaring kandidat beasiswa' pada opsi C. Opsi A, B, D, dan E bermakna menyaring secara fisik menggunakan saringan."
            },
            {
                "id": "ppu-1-q2",
                "soal": "Kata 'musim semi' dalam kalimat 'Setelah dua tahun vakum, industri perfilman tanah air kini menyambut musim semi baru' berkonotasi...",
                "opsi": [
                    {"label": "A", "text": "Perubahan iklim subtropis"},
                    {"label": "B", "text": "Masa kebangkitan dan pertumbuhan yang menggembirakan"},
                    {"label": "C", "text": "Waktu panen komoditas pertanian"},
                    {"label": "D", "text": "Kondisi penuh ketidakpastian"},
                    {"label": "E", "text": "Akhir dari sebuah dekade perfilman"}
                ],
                "kunci": "B",
                "pembahasan": "Dalam bahasa sastra/metaforis, 'musim semi' melambangkan kebangkitan kembali setelah musim dingin (kemandekan), kesuburan, dan tumbuhnya harapan baru (B)."
            },
            {
                "id": "ppu-1-q3",
                "soal": "Kalimat yang memuat kata bermakna peyorasi (mengalami penurunan nilai rasa) adalah...",
                "opsi": [
                    {"label": "A", "text": "Ia dimasukkan ke lembaga pemasyarakatan karena tersangkut kasus korupsi."},
                    {"label": "B", "text": "Wanita tunawisma itu dirawat di panti sosial."},
                    {"label": "C", "text": "Gerombolan pencuri itu berhasil dibekuk oleh warga setempat."},
                    {"label": "D", "text": "Pramuniaga tersebut melayani pelanggan dengan sangat ramah."},
                    {"label": "E", "text": "Para narapidana mengikuti pelatihan keterampilan mebel."}
                ],
                "kunci": "C",
                "pembahasan": "Kata 'gerombolan' mengalami peyorasi (nilai rasa negatif/hina, diasosiasikan dengan kelompok pengacau/kejahatan) dibanding kata 'kelompok' atau 'rombongan'. Opsi C tepat."
            },
            {
                "id": "ppu-1-q4",
                "soal": "Konteks: 'Peneliti menguji *resistensi* bakteri terhadap antibiotik lini ketiga.' Arti kata *resistensi* dalam kalimat tersebut adalah...",
                "opsi": [
                    {"label": "A", "text": "Daya tahan atau kekebalan"},
                    {"label": "B", "text": "Kecenderungan untuk bermutasi"},
                    {"label": "C", "text": "Kemampuan berkembang biak"},
                    {"label": "D", "text": "Kerentanan terhadap zat kimia"},
                    {"label": "E", "text": "Ketergantungan nutrisi"}
                ],
                "kunci": "A",
                "pembahasan": "Resistensi dalam biologi/medis berarti kemampuan suatu organisme bertahan terhadap pengaruh obat yang sebelumnya efektif (daya tahan / kekebalan). Opsi A tepat."
            },
            {
                "id": "ppu-1-q5",
                "soal": "Makna denotatif dari kata 'kursi' terdapat pada kalimat...",
                "opsi": [
                    {"label": "A", "text": "Para calon anggota legislatif memperebutkan 50 kursi parlemen."},
                    {"label": "B", "text": "Gubernur itu enggan melepaskan kursi jabatannya."},
                    {"label": "C", "text": "Ia duduk di kursi rotan sambil membaca koran pagi."},
                    {"label": "D", "text": "Perebutan kursi rektor berlangsung sengit."},
                    {"label": "E", "text": "Kursi empuk di kementerian menjadi incaran partai koalisi."}
                ],
                "kunci": "C",
                "pembahasan": "Makna denotatif adalah makna lugas tempat duduk bertiang. Pada opsi C, 'kursi rotan' adalah benda fisik tempat duduk. Pada opsi A, B, D, dan E, 'kursi' bermakna jabatan/posisi politis (konotatif)."
            }
        ],
        "keyTakeaways": [
            "Makna kata ditentukan oleh tempat dan fungsinya dalam kalimat (kontekstual).",
            "Gunakan teknik substitusi opsi untuk menguji kecocokan sinonim kontekstual.",
            "Bedakan denotasi (arti harfiah) dengan konotasi (nilai rasa/asosiasi).",
            "Waspadai istilah ilmiah serapan yang memiliki arti spesifik di disiplin ilmunya."
        ],
        "rekomendasiLatihan": "Latih ketajaman kosakata di Latihan Harian PPU dan tes padanan kata."
    },
    {
        "id": "ppu-bentukan-kata-dan-imbuhan",
        "babNumber": 2,
        "slug": "ppu-bentukan-kata-dan-imbuhan",
        "subtestKode": "PPU",
        "judul": "Bentukan Kata, Afiksasi (Imbuhan) & Reduplikasi",
        "durasiBacaMenit": 13,
        "ringkasanSingkat": "Kaidah pembentukan kata berimbuhan: proses peluluhan fonem KTSP pada prefiks meN- dan peN-, makna gramatikal afiks, serta reduplikasi bentuk dasar.",
        "learningObjectives": [
            "Menerapkan hukum peluluhan fonem K, T, S, P pada imbuhan meN- dan peN- secara tepat.",
            "Mengidentifikasi pengecualian peluluhan (konsonan ganda / gugus konsonan seperti pr, tr, st, kl).",
            "Menganalisis perbedaan makna imbuhan me-kan (kausatif vs benefaktif) dan ber-an.",
            "Menentukan bentukan kata ulang (reduplikasi) dan makna gramatikalnya."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Kaidah Sakti Peluluhan K-T-S-P",
                "isi": "Huruf awal K, T, S, P pada kata dasar AKAN LULUH jika diberi awalan meN- atau peN- dengan syarat: kata dasar diawali SATU huruf konsonan K/T/S/P yang diikuti oleh SATU huruf VOKAL.",
                "poinPenting": [
                    "LULUH: meN- + kritik → mengritik (karena K diikuti vokal r? Bukan! kr konsonan ganda maka TIDAK luluh: MENGKRITIK).",
                    "LULUH: meN- + pengaruh → memengaruhi (bukan mempengaruhi!).",
                    "LULUH: meN- + taat → menaati (bukan mentaati!).",
                    "LULUH: meN- + sapu → menyapu.",
                    "LULUH: meN- + konsumsi → mengonsumsi (bukan mengkonsumsi!).",
                    "TIDAK LULUH jika gugus konsonan: meN- + proses → memproses, meN- + transfer → mentransfer, meN- + syarat → mensyaratkan."
                ]
            },
            {
                "subjudul": "2. Makna Gramatikal Akhiran -kan dan -i",
                "isi": "-kan sering menyatakan kausatif (membuat jadi: 'mempercepat') atau benefaktif (melakukan untuk orang lain: 'membelikan adik buku'). Akhiran -i sering menyatakan lokatif (tempat: 'mendatangi') atau intensitas perbuatan berulang.",
                "poinPenting": [
                    "Kausatif: melebarkan jalan = membuat jalan menjadi lebih lebar.",
                    "Benefaktif: membuatkan teh = membuat teh untuk orang lain."
                ]
            }
        ],
        "trikCepat": "Hafalkan aturan 'K-T-S-P + VOKAL = LULUH'. Jika konsonan K/T/S/P diikuti vokal (a, i, u, e, o), wajib lebur menjadi ng, n, ny, m! Contoh: memopulerkan (bukan mempopulerkan), mengubah (bukan merubah!).",
        "jebakanUmum": "Kata 'merubah' sering dipakai sehari-hari, padahal kata dasarnya adalah 'ubah', sehingga bentukan baku yang benar adalah 'MENGUBAH'. Kata 'merubah' berarti menjadi rubah (hewan serigala)!",
        "contohSoal": [
            {
                "soal": "Penulisan kata berimbuhan meN- yang TIDAK TEPAT menurut kaidah bahasa Indonesia baku adalah...",
                "opsi": {
                    "A": "Pemerintah berupaya memfasilitasi kebutuhan modal kerja pelaku UMKM.",
                    "B": "Kebijakan baru tersebut memengaruhi stabilitas harga kebutuhan pokok.",
                    "C": "Manajer operasional memprakarsai pembentukan divisi riset terapan.",
                    "D": "Kita harus mentaati seluruh peraturan keselamatan di area konstruksi.",
                    "E": "Perusahaan mulai mengomersialkan produk baterai ramah lingkungan."
                },
                "kunci": "D",
                "pembahasanLangkah": [
                    "Periksa kata dasar pada opsi D: 'taat'. Diawali konsonan T dan diikuti vokal a.",
                    "Menurut kaidah KTSP, konsonan T wajib luluh menjadi n: meN- + taat + -i → MENAATI.",
                    "Bentuk 'mentaati' melanggar kaidah peluluhan, sehingga penulisan ini SALAH.",
                    "Opsi B 'memengaruhi' sudah benar (P luluh). Opsi C 'memprakarsai' benar karena pr adalah gugus konsonan (tidak luluh). Opsi E 'mengomersialkan' benar (K luluh).",
                    "Jadi opsi yang tidak tepat adalah D."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "ppu-2-q1",
                "soal": "Bentukan kata dengan awalan meN- yang benar dari kata dasar 'kelola' adalah...",
                "opsi": [
                    {"label": "A", "text": "Mengkelola"},
                    {"label": "B", "text": "Mengelola"},
                    {"label": "C", "text": "Menkelola"},
                    {"label": "D", "text": "Memkelola"},
                    {"label": "E", "text": "Mengkelolakan"}
                ],
                "kunci": "B",
                "pembahasan": "Kata dasar 'kelola' diawali huruf K diikuti vokal e. Berdasarkan kaidah KTSP, K luluh menjadi ng: meN- + kelola → MENGELOLA (B)."
            },
            {
                "id": "ppu-2-q2",
                "soal": "Kalimat yang menggunakan bentukan kata berimbuhan secara TIDAK BAKU adalah...",
                "opsi": [
                    {"label": "A", "text": "Teknologi digital mempermudah transaksi antarnegara."},
                    {"label": "B", "text": "Presenter itu mempopulerkan tarian tradisional ke generasi muda."},
                    {"label": "C", "text": "Para ilmuwan mencoba mengklasifikasikan spesies baru tersebut."},
                    {"label": "D", "text": "Penulis mengonsolidasikan draf naskah sebelum dicetak."},
                    {"label": "E", "text": "Petugas mensosialisasikan tata tertib ujian nasional."}
                ],
                "kunci": "E",
                "pembahasan": "Kata dasar 'sosialisasi' diawali S diikuti vokal o. Huruf S wajib luluh menjadi ny: meN- + sosialisasi + -kan → MENYOSIALISASIKAN. Bentuk 'mensosialisasikan' tidak baku (E). Catatan: Opsi B 'mempopulerkan' juga sering dianggap tidak baku (seharusnya 'memopulerkan'), namun bentuk 'mensosialisasikan' paling mutlak keliru."
            },
            {
                "id": "ppu-2-q3",
                "soal": "Makna sufiks -kan yang bermakna 'kausatif' (menyebabkan/membuat jadi) terdapat pada kalimat...",
                "opsi": [
                    {"label": "A", "text": "Paman membelikan keponakannya sepeda baru."},
                    {"label": "B", "text": "Ayah mengambilkan kakek segelas air putih."},
                    {"label": "C", "text": "Perusahaan itu meninggikan tanggul penahan banjir."},
                    {"label": "D", "text": "Kakak membuatkan ibu baju rajut hangat."},
                    {"label": "E", "text": "Rani membacakan adik dongeng fabel sebelum tidur."}
                ],
                "kunci": "C",
                "pembahasan": "'Meninggikan tanggul' bermakna membuat tanggul menjadi lebih tinggi (kausatif). Sedangkan opsi A, B, D, dan E bermakna benefaktif (melakukan pekerjaan untuk orang lain)."
            },
            {
                "id": "ppu-2-q4",
                "soal": "Bentuk reduplikasi yang bermakna 'banyak dan bermacam-macam' terdapat pada kalimat...",
                "opsi": [
                    {"label": "A", "text": "Kedua anak itu bersalam-salaman di teras."},
                    {"label": "B", "text": "Ibu membeli sayur-mayur segar di pasar tradisional."},
                    {"label": "C", "text": "Mereka berjalan-jalan santai di tepi pantai."},
                    {"label": "D", "text": "Ia tertidur pulas sehingga matanya kemerah-merahan."},
                    {"label": "E", "text": "Adik bermain mobil-mobilan kayu di ruang tengah."}
                ],
                "kunci": "B",
                "pembahasan": "'Sayur-mayur' adalah kata ulang berubah bunyi yang menyatakan makna keanekaragaman (bermacam-macam jenis sayuran). Bersalam-salaman (resiprokal/saling), kemerah-merahan (menyerupai/agak), mobil-mobilan (tiruan)."
            },
            {
                "id": "ppu-2-q5",
                "soal": "Kata dasar yang tepat dari kata bentukan 'pemberantasan' adalah...",
                "opsi": [
                    {"label": "A", "text": "Beras"},
                    {"label": "B", "text": "Brantas"},
                    {"label": "C", "text": "Bantas"},
                    {"label": "D", "text": "Bantah"},
                    {"label": "E", "text": "Banter"}
                ],
                "kunci": "B",
                "pembahasan": "Kata dasar dari 'pemberantasan' adalah 'berantas' dengan konfiks peN-...-an: peN- + berantas + -an = pemberantasan (B)."
            }
        ],
        "keyTakeaways": [
            "Aturan KTSP: huruf K, T, S, P luluh jika diikuti vokal.",
            "Gugus konsonan (dua konsonan berurutan seperti pr, tr, st, kl) TIDAK luluh.",
            "Bedakan kausatif (membuat jadi) dan benefaktif (untuk orang lain).",
            "Kata dasar 'ubah' berimbuhan meN- menjadi 'mengubah', bukan 'merubah'."
        ],
        "rekomendasiLatihan": "Perkuat pemahaman afiksasi di bank soal PBM & PPU Gemilang."
    },
    {
        "id": "ppu-hubungan-makna-kata",
        "babNumber": 3,
        "slug": "ppu-hubungan-makna-kata",
        "subtestKode": "PPU",
        "judul": "Hubungan Makna: Sinonim, Antonim & Hiponim",
        "durasiBacaMenit": 11,
        "ringkasanSingkat": "Menganalisis relasi semantik antar kata: sinonimi, antonimi (mutlak, gradien, relasional), hipernim-hiponim (superordinat), serta polisemi dan homonim.",
        "learningObjectives": [
            "Mengidentifikasi sinonim sepadan sesuai laras bahasa formal akademis.",
            "Membedakan jenis antonim: kutub/mutlak (hidup-mati), bertingkat/gradien (dingin-panas), dan relasional (guru-murid).",
            "Menentukan relasi hierarkis hiponim (spesifik) dan hipernim (umum).",
            "Membedakan polisemi (satu kata beda makna tapi berakar sama) dengan homonim (kebetulan bunyi/tulisan sama tapi beda akar)."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Hierarki Hipernim dan Hiponim",
                "isi": "Hipernim adalah kata umum (superordinat) yang memayungi kata-kata lain. Hiponim adalah kata khusus (subordinat) yang tercakup di dalamnya.",
                "poinPenting": [
                    "Hipernim: Unggas. Hiponim: Ayam, Bebek, Angsa, Burung Puyuh.",
                    "Hipernim: Kendaraan listrik. Hiponim: Mobil listrik, Sepeda motor listrik, Skuter listrik.",
                    "Di UTBK, sering ditanyakan: 'Kata yang berkedudukan sebagai hipernim dari kata X pada bacaan adalah...'"
                ]
            },
            {
                "subjudul": "2. Homonim, Homofon, Homograf & Polisemi",
                "isi": "- Homonim: ejaan dan lafal sama, makna beda mutlak (bisa = racun ular vs bisa = dapat).\n- Homofon: lafal sama, ejaan beda (bank = lembaga keuangan vs bang = panggilan abang).\n- Homograf: ejaan sama, lafal beda (apel = buah vs apel = upacara pagi).\n- Polisemi: satu kata memiliki banyak makna yang masih berkerabat (akar = bagian tanaman di bawah tanah vs akar = penyebab pokok masalah).",
                "poinPenting": [
                    "Kunci polisemi adalah adanya keterkaitan asosiasi makna inti (misal: 'kepala keluarga', 'kepala surat', 'kepala sekolah')."
                ]
            }
        ],
        "trikCepat": "Untuk membedakan polisemi dan homonim: Tanyakan apakah ada kemiripan sifat atau fungsi dasar? Jika ada (seperti posisi di pucuk/paling atas pada 'kepala'), itu POLISEMI. Jika asal-usul artinya putus sama sekali (seperti 'bisa ular' dan 'bisa terbang'), itu HOMONIM!",
        "jebakanUmum": "Memilih sinonim yang maknanya benar secara leksikal tapi laras bahasanya tidak pas (misal: memasukkan kata percakapan gaul ke dalam teks ilmiah resmi).",
        "contohSoal": [
            {
                "soal": "Perhatikan pasangan kata berikut:\n'Ikan tuna, tongkol, cakalang, dan salmon'.\nKata superordinat (hipernim) yang paling tepat memayungi keempat kata tersebut dalam konteks keilmuan adalah...",
                "opsi": {
                    "A": "Biota laut",
                    "B": "Hewan peliharaan",
                    "C": "Ikan pelagis",
                    "D": "Mamalia air",
                    "E": "Tumbuhan bahari"
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Tuna, tongkol, cakalang, dan salmon adalah jenis-jenis ikan perenang bebas di kolom perairan terbuka (ikan pelagis).",
                    "Biota laut (A) terlalu luas karena mencakup karang, rumput laut, kepiting, dsb.",
                    "Maka hipernim spesifik yang paling presisi adalah 'Ikan pelagis' (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "ppu-3-q1",
                "soal": "Pasangan kata yang memiliki relasi 'antonim relasional' (hubungan timbal balik ketergantungan) adalah...",
                "opsi": [
                    {"label": "A", "text": "Hidup - Mati"},
                    {"label": "B", "text": "Panas - Dingin"},
                    {"label": "C", "text": "Penjual - Pembeli"},
                    {"label": "D", "text": "Tinggi - Rendah"},
                    {"label": "E", "text": "Kaya - Miskin"}
                ],
                "kunci": "C",
                "pembahasan": "Antonim relasional adalah kebalikan yang saling meniscayakan kehadiran pihak lain. Tidak ada 'penjual' tanpa ada 'pembeli'. Contoh lain: suami-istri, dokter-pasien (C)."
            },
            {
                "id": "ppu-3-q2",
                "soal": "Kata 'mata' yang digunakan secara polisemi terdapat pada pasangan kalimat...",
                "opsi": [
                    {"label": "A", "text": "Matahari terbit di timur. / Ibu membeli beras satu karung."},
                    {"label": "B", "text": "Matanya kelilipan debu. / Dia adalah mata-mata musuh."},
                    {"label": "C", "text": "Dokter memeriksa mata pasien. / Jarum ini memiliki mata yang sangat kecil."},
                    {"label": "D", "text": "Mata uang rupiah stabil. / Air itu mengalir deras."},
                    {"label": "E", "text": "Mata pisau ini tajam. / Anak itu tertidur lelap."}
                ],
                "kunci": "C",
                "pembahasan": "'Mata pasien' (indra penglihat berbentuk bulatan berlubang) dan 'mata jarum' (lubang kecil pada jarum tempat benang masuk) berakar dari kemiripan bentuk anatomis dasar (lubang/pusat fokus). Ini contoh polisemi (C)."
            },
            {
                "id": "ppu-3-q3",
                "soal": "Kata 'buku' pada kalimat (1) 'Ia membaca buku sejarah' dan kalimat (2) 'Tebu ini memiliki banyak buku di batangnya' berelasi sebagai...",
                "opsi": [
                    {"label": "A", "text": "Sinonim"},
                    {"label": "B", "text": "Polisemi"},
                    {"label": "C", "text": "Homonim"},
                    {"label": "D", "text": "Hiponim"},
                    {"label": "E", "text": "Antonim"}
                ],
                "kunci": "C",
                "pembahasan": "Kata 'buku' (lembaran kertas bacaan) dan 'buku' (ruas tulang atau ruas tebu) memiliki ejaan dan pelafalan sama, namun makna dan asal-usul etimologinya sama sekali berbeda tanpa kaitan konsep. Ini adalah relasi homonim (C)."
            },
            {
                "id": "ppu-3-q4",
                "soal": "Sinonim kata 'prerogatif' dalam klausa 'hak prerogatif presiden dalam mengangkat menteri' adalah...",
                "opsi": [
                    {"label": "A", "text": "Hak istimewa mutlak"},
                    {"label": "B", "text": "Kewajiban konstitusional"},
                    {"label": "C", "text": "Tuntutan publik"},
                    {"label": "D", "text": "Kebiasaan adat"},
                    {"label": "E", "text": "Kewenangan bersama"}
                ],
                "kunci": "A",
                "pembahasan": "Hak prerogatif adalah hak istimewa yang dimiliki oleh kepala negara atau lembaga tertentu tanpa perlu persetujuan lembaga lain (hak istimewa mutlak) (A)."
            },
            {
                "id": "ppu-3-q5",
                "soal": "Manakah kelompok kata yang semuanya merupakan hiponim dari kata 'alat musik melodis'?",
                "opsi": [
                    {"label": "A", "text": "Gendang, drum, rebana"},
                    {"label": "B", "text": "Biola, seruling, piano"},
                    {"label": "C", "text": "Gong, simbal, marakas"},
                    {"label": "D", "text": "Piringan hitam, mikrofon, kabel"},
                    {"label": "E", "text": "Amplifier, speaker, subwoofer"}
                ],
                "kunci": "B",
                "pembahasan": "Alat musik melodis adalah alat musik yang bernada (bisa memainkan tangga nada melodi seperti do, re, mi): biola, seruling, piano (B). Opsi A dan C adalah alat musik ritmis (tidak bernada ritmis pukulan)."
            }
        ],
        "keyTakeaways": [
            "Hipernim adalah kata induk umum; hiponim adalah kata cabang khusus.",
            "Polisemi memiliki benang merah makna inti (contoh: kepala kereta, kepala surat).",
            "Homonim maknanya putus total kendati ejaan dan bunyinya sama.",
            "Pilih sinonim yang sesuai dengan register dan laras bahasa teks."
        ],
        "rekomendasiLatihan": "Latih perbendaharaan kata ilmiah di latihan modul Bahasa Indonesia Gemilang."
    },
    {
        "id": "ppu-ide-pokok-dan-simpulan-paragraf",
        "babNumber": 4,
        "slug": "ppu-ide-pokok-dan-simpulan-paragraf",
        "subtestKode": "PPU",
        "judul": "Ide Pokok, Gagasan Utama & Simpulan Paragraf",
        "durasiBacaMenit": 14,
        "ringkasanSingkat": "Menemukan letak kalimat utama (deduktif di awal, induktif di akhir, campuran) dan merumuskan gagasan utama serta simpulan wacana.",
        "learningObjectives": [
            "Menentukan posisi kalimat utama melalui ciri konjungsi penyimpul (oleh karena itu, dengan demikian) atau repetisi topik.",
            "Membedakan topik (payung besar), ide pokok (pesan inti yang disampaikan), dan judul teks.",
            "Merumuskan simpulan paragraf yang mencakup seluruh poin premis penting.",
            "Mengeliminasi opsi jawaban yang 'terlalu sempit' (hanya mencakup satu kalimat penjelas) atau 'terlalu luas'."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Posisi Kalimat Utama dalam Paragraf",
                "isi": "- Deduktif: Kalimat utama di awal paragraf (Kalimat 1). Kalimat 2 dst berisi rincian, data statistik, atau contoh.\n- Induktif: Kalimat utama di akhir paragraf. Biasanya ditandai konjungsi kesimpulan seperti: 'Oleh karena itu', 'Dengan demikian', 'Maka dari itu', 'Dapat disimpulkan bahwa'.\n- Campuran: Ditegaskan di awal dan diulangi kembali di akhir paragraf dengan redaksi variatif.",
                "poinPenting": [
                    "Cek Kalimat 2: Jika kalimat 2 memuat kata rujukan ('hal ini', 'tersebut', 'kebijakan ini') atau pengulangan kata kunci kalimat 1, maka 95% paragraf tersebut adalah DEDUKTIF!"
                ]
            },
            {
                "subjudul": "2. Anatomi Ide Pokok vs Gagasan Penjelas",
                "isi": "Ide pokok adalah intisari dari kalimat utama. Gagasan penjelas adalah uraian bukti, analogi, atau angka persentase pendukung.",
                "poinPenting": [
                    "Jangan pernah memilih ide pokok yang memuat angka persentase kecil atau contoh kasuistik.",
                    "Opsi yang benar harus mampu memayungi seluruh kalimat penjelas di bawahnya."
                ]
            }
        ],
        "trikCepat": "Gunakan 'Uji Kalimat 2': Baca kalimat pertama, lalu baca kalimat kedua. Jika kalimat kedua diawali kata: 'Hal ini...', 'Fenomena tersebut...', atau menyebut kata ganti orang/benda dari kalimat pertama, KUNCI KALIMAT UTAMA ADA DI KALIMAT 1 (Deduktif)! Ide pokoknya tinggal ringkas kalimat 1 tersebut.",
        "jebakanUmum": "Memilih kalimat penjelas yang faktanya sangat menarik dan mengejutkan sebagai ide pokok. Ingat: ide pokok adalah gagasan pengontrol, bukan detail menarik!",
        "contohSoal": [
            {
                "soal": "Bacalah paragraf berikut:\n'(1) Pemanfaatan hidrogen hijau sebagai sumber energi primer mulai menjadi pilar utama dalam peta jalan transisi energi global. (2) Karakteristiknya yang bebas emisi karbon saat dibakar menjadikannya alternatif ideal pengganti batu bara di sektor industri berat. (3) Berbagai negara maju di Eropa dan Asia Pasifik telah mengalokasikan miliaran dolar untuk membangun fasilitas elektrolisis skala gigawatt. (4) Di samping itu, efisiensi rantai pasok distribusi hidrogen terus meningkat seiring penemuan katalis berbasis material baru.'\nGagasan utama paragraf tersebut adalah...",
                "opsi": {
                    "A": "Fasilitas elektrolisis skala gigawatt telah dibangun di negara-negara Eropa.",
                    "B": "Penemuan katalis baru meningkatkan efisiensi distribusi energi fosil.",
                    "C": "Hidrogen hijau menjadi pilar utama transisi energi global menuju bebas emisi.",
                    "D": "Batu bara masih menjadi sumber energi primer yang tak tergantikan.",
                    "E": "Alokasi anggaran miliaran dolar untuk riset sektor industri berat."
                },
                "kunci": "C",
                "pembahasanLangkah": [
                    "Periksa kalimat (1): 'Pemanfaatan hidrogen hijau... mulai menjadi pilar utama dalam peta jalan transisi energi global.'",
                    "Periksa kalimat (2): 'Karakteristiknya yang bebas emisi...' (ada kata ganti '-nya' yang merujuk pada hidrogen hijau di kalimat 1).",
                    "Kalimat (3) dan (4) memberikan bukti konkret berupa pendanaan fasilitas dan katalis pendukung.",
                    "Maka kalimat (1) adalah kalimat utama. Gagasan utamanya adalah hidrogen hijau menjadi pilar utama transisi energi global (C)."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "ppu-4-q1",
                "soal": "Ciri khas kalimat utama pada paragraf induktif adalah...",
                "opsi": [
                    {"label": "A", "text": "Terletak di awal dan langsung mendefinisikan istilah"},
                    {"label": "B", "text": "Berada di akhir paragraf dan sering diawali konjungsi antarkalimat penegas simpulan"},
                    {"label": "C", "text": "Memuat banyak data angka persentase sejak kata pertama"},
                    {"label": "D", "text": "Tidak memiliki hubungan makna dengan kalimat sebelumnya"},
                    {"label": "E", "text": "Selalu diapit oleh tanda petik ganda"}
                ],
                "kunci": "B",
                "pembahasan": "Paragraf induktif menyajikan premis-premis khusus terlebih dahulu, kemudian diakhiri oleh kalimat utama di akhir yang umumnya ditandai konjungsi penanda kesimpulan seperti 'Oleh karena itu', 'Dengan demikian', 'Jadi' (B)."
            },
            {
                "id": "ppu-4-q2",
                "soal": "Perhatikan teks: 'Tingkat stres kronis dapat menekan produksi sel darah putih. Akibatnya, antibodi tubuh melemah sehingga bakteri patogen lebih mudah menginfeksi jaringan. Tidak heran bila individu yang bekerja di bawah tekanan tinggi rentan mengalami sakit flu berulang.' Simpulan yang paling tepat adalah...",
                "opsi": [
                    {"label": "A", "text": "Stres kronis dapat menurunkan imunitas tubuh sehingga memicu kerentanan terhadap penyakit."},
                    {"label": "B", "text": "Semua pekerja di bawah tekanan tinggi pasti terkena flu setiap minggu."},
                    {"label": "C", "text": "Bakteri patogen hanya berkembang biak saat seseorang mengalami stres."},
                    {"label": "D", "text": "Antibodi tubuh tidak berhubungan dengan produksi sel darah putih."},
                    {"label": "E", "text": "Tekanan kerja dapat diatasi dengan mengonsumsi antibiotik dosis tinggi."}
                ],
                "kunci": "A",
                "pembahasan": "Simpulan merangkum rantai logis paragraf: stres kronis → menekan sel darah putih / melemahkan antibodi (imunitas turun) → rentan sakit (A)."
            },
            {
                "id": "ppu-4-q3",
                "soal": "Mengapa opsi yang memuat fakta 'Perusahaan X memperoleh laba 10 miliar' sering kali SALAH saat dipilih sebagai ide pokok?",
                "opsi": [
                    {"label": "A", "text": "Karena angka 10 miliar adalah angka rekayasa."},
                    {"label": "B", "text": "Karena kalimat yang memuat angka konkret biasanya berfungsi sebagai kalimat penjelas (data pendukung), bukan gagasan utama yang memayungi."},
                    {"label": "C", "text": "Karena teks ekonomi tidak boleh memuat angka."},
                    {"label": "D", "text": "Karena ide pokok wajib berupa pertanyaan retoris."},
                    {"label": "E", "text": "Karena kalimat penjelas selalu diletakkan di akhir teks."}
                ],
                "kunci": "B",
                "pembahasan": "Ide pokok bersifat abstrak dan umum. Kalimat dengan angka/data statistik terperinci bertindak sebagai bukti pendukung (gagasan penjelas) untuk memperkuat gagasan utama, sehingga bukan ide pokoknya (B)."
            },
            {
                "id": "ppu-4-q4",
                "soal": "Judul yang baik untuk teks yang membahas perbandingan dampak positif dan negatif kecerdasan buatan di dunia pendidikan adalah...",
                "opsi": [
                    {"label": "A", "text": "Kecerdasan Buatan Pasti Menghancurkan Mutu Pendidikan"},
                    {"label": "B", "text": "Dilema dan Peluang Pemanfaatan AI dalam Ekosistem Pendidikan"},
                    {"label": "C", "text": "Mengapa Siswa Malas Menulis Skripsi Sendiri"},
                    {"label": "D", "text": "Biaya Pembelian Akun AI untuk Guru Sekolah Dasar"},
                    {"label": "E", "text": "Masa Depan Guru yang Tergantikan oleh Robot Komputer"}
                ],
                "kunci": "B",
                "pembahasan": "Judul teks harus objektif, mencakup kedua sisi tema (dampak positif/peluang dan tantangan/dilema), serta ringkas dan representatif (B)."
            },
            {
                "id": "ppu-4-q5",
                "soal": "Jika sebuah paragraf terdiri atas 5 kalimat dan kalimat (1) sampai (4) menjelaskan berbagai kendala distribusi pupuk subsidi, sedangkan kalimat (5) menyimpulkan: 'Oleh sebab itu, perbaikan tata kelola data penerima subsidi pupuk menjadi langkah darurat yang mendesak.' Paragraf tersebut berjenis...",
                "opsi": [
                    {"label": "A", "text": "Deduktif"},
                    {"label": "B", "text": "Induktif"},
                    {"label": "C", "text": "Naratif murni"},
                    {"label": "D", "text": "Deskriptif ruang"},
                    {"label": "E", "text": "Ineratif"}
                ],
                "kunci": "B",
                "pembahasan": "Paragraf yang kalimat utamanya terletak di akhir dengan didahului konjungsi penyimpul ('Oleh sebab itu') adalah paragraf Induktif (B)."
            }
        ],
        "keyTakeaways": [
            "Periksa kalimat ke-2: kata rujukan menunjukkan paragraf deduktif.",
            "Konjungsi 'Oleh karena itu' di akhir menunjukkan paragraf induktif.",
            "Ide pokok harus memayungi seluruh isi paragraf, tidak boleh terlalu sempit.",
            "Hindari memilih detail data/angka konkret sebagai ide pokok."
        ],
        "rekomendasiLatihan": "Latih kemampuan identifikasi ide pokok di subtes Literasi Bahasa Indonesia."
    },
    {
        "id": "ppu-sikap-dan-nada-penulis",
        "babNumber": 5,
        "slug": "ppu-sikap-dan-nada-penulis",
        "subtestKode": "PPU",
        "judul": "Sikap, Sudut Pandang & Nada Penulis (Tone Analysis)",
        "durasiBacaMenit": 12,
        "ringkasanSingkat": "Mendeteksi nada emosional teks: nada kritis (skeptis), objektif (netral/informatif), optimis, cemas/khawatir, sinis (sarkastis), atau persuasif.",
        "learningObjectives": [
            "Mengidentifikasi pilihan kata bermuatan emosional (diction) yang mencerminkan bias penulis.",
            "Membedakan tulisan objektif bebas nilai dengan tulisan subjektif argumentatif.",
            "Menentukan nada teks: kritis, apresiatif, pesimis, optimis, prihatin, atau sinis.",
            "Menyimpulkan keberpihakan dan tujuan komunikatif penulis terhadap isu bacaan."
        ],
        "konsepTeori": [
            {
                "subjudul": "1. Ragam Nada Penulis (Author's Tone)",
                "isi": "Nada tulisan mencerminkan sikap batin penulis terhadap masalah yang dibahasnya:\n- Kritis/Skeptis: mempertanyakan klaim, menyoroti kelemahan dan risiko.\n- Objektif/Netral: menyajikan fakta dua sisi tanpa memihak dengan data empiris.\n- Optimis: percaya diri dan memandang masa depan isu dengan positif.\n- Prihatin/Cemas: menaruh kekhawatiran mendalam atas bahaya suatu fenomena.\n- Sinis/Sarkastis: menyindir dengan nada meremehkan atau mencemooh.",
                "poinPenting": [
                    "Cermati kata sifat dan kata keterangan: 'Sayangnya', 'Ironisnya', 'Sangat disayangkan' menunjukkan nada PRIHATIN/KRITIS.",
                    "'Terbukti secara meyakinkan', 'Pencapaian gemilang' menunjukkan nada APRESIATIF/OPTIMIS."
                ]
            },
            {
                "subjudul": "2. Sudut Pandang dan Keberpihakan",
                "isi": "Penulis artikel opini biasanya memihak kelompok rentan (konsumen, masyarakat adat, lingkungan hidup) dan mendesak pemangku kebijakan untuk bertindak.",
                "poinPenting": [
                    "Tujuan penulis sering diungkapkan pada paragraf terakhir berupa saran rekomendasi."
                ]
            }
        ],
        "trikCepat": "Cari kata-kata emosional bermakna penilaian (evaluative words). Jika menemukan kata seperti: 'ironis', 'keliru', 'gegabah', 'bencana', nadanya pasti KRITIS atau PRIHATIN. Jika hanya berisi angka, data riset, dan kata netral 'menurut studi...', nadanya OBJEKTIF / INFORMATIF!",
        "jebakanUmum": "Menilai nada teks berdasarkan emosi pribadi pembaca sendiri, bukan dari pilihan kata (diksi) yang dipilih oleh sang penulis teks.",
        "contohSoal": [
            {
                "soal": "Kutipan teks:\n'Sangat menggelikan ketika pejabat publik mengklaim bahwa deforestasi telah berhenti total, sementara citra satelit independen dengan gamblang memperlihatkan ratusan hektare tutupan hutan lindung terus menyusut setiap minggunya demi perkebunan monokultur.'\nNada yang tersirat dari sikap penulis kutipan di atas adalah...",
                "opsi": {
                    "A": "Sinis dan mengejek",
                    "B": "Objektif dan netral",
                    "C": "Optimis dan percaya diri",
                    "D": "Apatis dan tidak acuh",
                    "E": "Penuh pujian dan apresiasi"
                },
                "kunci": "A",
                "pembahasanLangkah": [
                    "Perhatikan diksi pembuka yang digunakan penulis: 'Sangat menggelikan...'.",
                    "Kata ini secara eksplisit menunjukkan ejekan atau sindiran tajam atas klaim pejabat yang berlawanan dengan fakta satelit.",
                    "Nada seperti ini dalam analisis wacana diklasifikasikan sebagai SINIS / SARKASTIS.",
                    "Maka opsi yang tepat adalah A."
                ]
            }
        ],
        "kuisPemahaman": [
            {
                "id": "ppu-5-q1",
                "soal": "Penulis yang memaparkan data statistik pertumbuhan ekspor, neraca perdagangan, dan suku bunga acuan tanpa memberikan opini pribadi menulis dengan nada...",
                "opsi": [
                    {"label": "A", "text": "Romantis"},
                    {"label": "B", "text": "Objektif dan informatif"},
                    {"label": "C", "text": "Sarkastis"},
                    {"label": "D", "text": "Melankolis"},
                    {"label": "E", "text": "Gusar dan menghakimi"}
                ],
                "kunci": "B",
                "pembahasan": "Penyajian fakta berbasis data tanpa prasangka atau bias opini subjektif adalah ciri khas tulisan bernada objektif dan informatif (B)."
            },
            {
                "id": "ppu-5-q2",
                "soal": "Teks: 'Kendati tantangan geopolitik global membayangi rantai pasok semikonduktor, kolaborasi strategis antara universitas nasional dan konsorsium industri microchip diyakini mampu melahirkan prototipe prosesor mandiri pertama kita sebelum akhir dekade ini.' Sikap penulis adalah...",
                "opsi": [
                    {"label": "A", "text": "Pesimis dan menyerah"},
                    {"label": "B", "text": "Optimis dan penuh harapan"},
                    {"label": "C", "text": "Meragukan kapasitas riset universitas"},
                    {"label": "D", "text": "Marah terhadap geopolitik global"},
                    {"label": "E", "text": "Netral tanpa pandangan ke depan"}
                ],
                "kunci": "B",
                "pembahasan": "Frasa 'diyakini mampu melahirkan prototipe prosesor mandiri pertama kita sebelum akhir dekade ini' memancarkan keyakinan positif dan harapan besar terhadap masa depan riset semikonduktor (Optimis, B)."
            },
            {
                "id": "ppu-5-q3",
                "soal": "Kata kunci manakah yang paling kuat mengindikasikan bahwa penulis memiliki sikap PRIHATIN terhadap suatu isu?",
                "opsi": [
                    {"label": "A", "text": "'Sungguh disayangkan dan sangat mencemaskan'"},
                    {"label": "B", "text": "'Berdasarkan tabel nomor 3'"},
                    {"label": "C", "text": "'Dengan demikian dapat disimpulkan'"},
                    {"label": "D", "text": "'Kecepatan reaksi meningkat dua kali lipat'"},
                    {"label": "E", "text": "'Secara umum terbagi atas tiga kategori'"}
                ],
                "kunci": "A",
                "pembahasan": "Ungkapan 'sungguh disayangkan dan sangat mencemaskan' merupakan ekspresi verbal langsung dari keprihatinan dan kekhawatiran batin penulis (A)."
            },
            {
                "id": "ppu-5-q4",
                "soal": "Tujuan komunikatif penulis dalam esai yang mengupas bahaya kecanduan judi daring bagi remaja adalah...",
                "opsi": [
                    {"label": "A", "text": "Mempromosikan platform judi daring yang berizin resmi"},
                    {"label": "B", "text": "Menghibur pembaca dengan cerita jenaka para pemain judi"},
                    {"label": "C", "text": "Mengedukasi masyarakat dan mendesak penegakan hukum yang tegas terhadap operator judi"},
                    {"label": "D", "text": "Menjelaskan cara memenangkan taruhan daring"},
                    {"label": "E", "text": "Menguji kemampuan algoritma situs perjudian"}
                ],
                "kunci": "C",
                "pembahasan": "Esai analitis mengenai bahaya sosial bertujuan untuk memberikan edukasi/peringatan kepada publik serta mendorong tindakan konkret pemangku kepentingan (C)."
            },
            {
                "id": "ppu-5-q5",
                "soal": "Manakah pernyataan yang PALING TEPAT mengenai perbedaan antara nada kritis dan nada sinis?",
                "opsi": [
                    {"label": "A", "text": "Nada kritis menyerang pribadi tanpa data, sedangkan sinis memakai angka."},
                    {"label": "B", "text": "Nada kritis mengevaluasi berdasarkan argumen logis dan bukti, sedangkan nada sinis cenderung bernuansa mengejek atau memandang rendah."},
                    {"label": "C", "text": "Kritis selalu bernilai positif, sedangkan sinis selalu bernilai benar."},
                    {"label": "D", "text": "Tidak ada perbedaan antara keduanya."},
                    {"label": "E", "text": "Nada sinis hanya muncul dalam naskah ilmiah kedokteran."}
                ],
                "kunci": "B",
                "pembahasan": "Kritis (critical) berakar pada analisis rasional untuk menguji validitas argumen, sedangkan sinis (cynical/sarcastic) memuat muatan emosional berupa keraguan mencemooh atau ejekan (B)."
            }
        ],
        "keyTakeaways": [
            "Analisis nada penulis bersumber dari pemilihan diksi emosional (evaluative words).",
            "Objektif = menyajikan fakta dua sisi tanpa memihak.",
            "Kritis = mengevaluasi kelemahan secara logis.",
            "Sinis/Sarkastis = menyindir atau mengejek.",
            "Optimis = memandang prospek positif di masa depan."
        ],
        "rekomendasiLatihan": "Terapkan analisis tone ini saat membaca wacana Literasi Bahasa Indonesia dan Bahasa Inggris."
    }
]

write_js('ppuModul.js', 'PPU_MODUL', PPU_DATA)
