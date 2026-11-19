import pypdf
import re
import json
import os

BASE_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app"
PDF_DIR = os.path.join(BASE_DIR, "public/modul-pdf")
OUT_DIR = os.path.join(BASE_DIR, "src/data/modul-smp")

os.makedirs(OUT_DIR, exist_ok=True)

CONFIGS = [
    {
        "code": "MTK_SMP",
        "nama": "Matematika (Numerasi TKA)",
        "singkatan": "MTK",
        "badgeWarna": "#ea580c",
        "bgLight": "#fff7ed",
        "borderWarna": "#fed7aa",
        "emoji": "📐",
        "isUtama": True,
        "deskripsi": "Operasi bilangan, notasi ilmiah, aljabar persamaan kuadrat, geometri transformasi, bangun ruang, dan analisis data & peluang.",
        "pdfFile": "Modul_Master_TKA_SMP_Matematika_2027.pdf",
        "outJs": "matematikaSmpData.js",
        "varName": "MTK_SMP_MODUL",
        "chapters": [
            {
                "babNumber": 1,
                "slug": "bilangan-operasi-pecahan-pangkat-notasi",
                "judul": "Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)",
                "durasiBacaMenit": 15,
                "unitPages": list(range(4, 14)),
                "exPages": [14, 15],
                "keyPage": 15,
                "ringkasan": "Kuasai operasi bilangan bulat, pecahan, desimal, sifat-sifat eksponen, rasionalisasi akar, dan konversi notasi ilmiah baku resmi Pusmendik.",
                "objectives": [
                    "Menerapkan prioritas KaBaTaKu dan aturan tanda pada bilangan bulat dan pecahan.",
                    "Menyederhanakan eksponen aljabar dan merasionalkan penyebut bentuk akar sekawan.",
                    "Menuliskan bilangan sangat kecil dan sangat besar ke dalam notasi ilmiah resmi $a \\times 10^n$."
                ]
            },
            {
                "babNumber": 2,
                "slug": "aljabar-spldv-kuadrat-fungsi-pola",
                "judul": "Bab 2 · Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)",
                "durasiBacaMenit": 15,
                "unitPages": list(range(16, 26)),
                "exPages": [26, 27],
                "keyPage": 27,
                "ringkasan": "Sederhanakan bentuk aljabar, pemfaktoran kuadrat, sistem persamaan linear dua variabel (SPLDV), pemetaan relasi fungsi, dan barisan deret.",
                "objectives": [
                    "Memfaktorkan persamaan kuadrat dan menyelesaikan SPLDV dengan eliminasi-substitusi kilat.",
                    "Menentukan daerah hasil (range) fungsi linear dan menyusun model matematika masalah nyata.",
                    "Menemukan rumus suku ke-$n$ ($U_n$) dan jumlah $n$ suku pertama ($S_n$) barisan aritmetika/geometri."
                ]
            },
            {
                "babNumber": 3,
                "slug": "geometri-pengukuran-pythagoras-ruang-transformasi",
                "judul": "Bab 3 · Geometri & Pengukuran (Sudut, Pythagoras, Ruang & Transformasi)",
                "durasiBacaMenit": 18,
                "unitPages": list(range(28, 41)),
                "exPages": [41, 42],
                "keyPage": 42,
                "cheatPage": 43,
                "ringkasan": "Kuasai hubungan sudut, Teorema Pythagoras, keliling/luas bangun datar, volume bangun ruang (prisma, limas, bola), dan 4 transformasi geometri.",
                "objectives": [
                    "Menghitung besar sudut jarum jam dan sudut pada dua garis sejajar yang dipotong transversal.",
                    "Menerapkan triple Pythagoras dan kesebangunan dua segitiga pada soal cerita kontekstual.",
                    "Menentukan bayangan titik pada translasi, refleksi, rotasi $90^\\circ/180^\\circ$, dan dilatasi skala $k$."
                ]
            },
            {
                "babNumber": 4,
                "slug": "data-peluang-statistika-diagram-peluang",
                "judul": "Bab 4 · Data & Peluang (Statistika, Diagram & Peluang Teoretik)",
                "durasiBacaMenit": 14,
                "unitPages": list(range(44, 50)),
                "exPages": [50],
                "keyPage": 50,
                "tryoutPages": [51, 52],
                "ringkasan": "Penyajian data tabel & diagram batang/lingkaran, ukuran pemusatan (mean, median, modus), jangkauan, dan kalkulasi peluang frekuensi harapan.",
                "objectives": [
                    "Membaca dan menafsirkan diagram lingkaran bersudut maupun berpersen secara akurat.",
                    "Menghitung mean gabungan, median data ganjil/genap, dan modus data kelompok.",
                    "Menghitung peluang kejadian tunggal dan frekuensi harapan dalam sejumlah percobaan acak."
                ]
            }
        ]
    },
    {
        "code": "BIN_SMP",
        "nama": "Bahasa Indonesia (Literasi TKA)",
        "singkatan": "BIN",
        "badgeWarna": "#0284c7",
        "bgLight": "#f0f9ff",
        "borderWarna": "#bae6fd",
        "emoji": "📖",
        "isUtama": True,
        "deskripsi": "Pemahaman tekstual, istilah teknis, informasi tersurat-tersirat, analisis ide pokok, apresiasi sastra, dan evaluasi kritis teks bacaan.",
        "pdfFile": "Modul_Master_TKA_SMP_Bahasa_Indonesia_2027.pdf",
        "outJs": "bahasaIndonesiaSmpData.js",
        "varName": "BIN_SMP_MODUL",
        "chapters": [
            {
                "babNumber": 1,
                "slug": "pemahaman-tekstual-istilah-tersurat-tatabahasa",
                "judul": "Bab 1 · Pemahaman Tekstual (Istilah Teknis, Informasi Tersurat & Tata Bahasa)",
                "durasiBacaMenit": 15,
                "unitPages": list(range(4, 14)),
                "exPages": [14, 15],
                "keyPage": 15,
                "ringkasan": "Temukan arti istilah teknis melalui petunjuk konteks, pisahkan informasi tersurat (5W+1H), telaah kalimat efektif SPOK, dan konjungsi kohesif.",
                "objectives": [
                    "Menemukan arti istilah teknis tanpa kamus lewat petunjuk definisi, dampak, dan sinonim sekitar.",
                    "Mengidentifikasi rincian tersurat (siapa, di mana, kapan, bagaimana) dalam teks prosedur & eksposisi.",
                    "Menganalisis kalimat efektif SPOK serta membedakan fungsi alat vs bahan dalam teks petunjuk."
                ]
            },
            {
                "babNumber": 2,
                "slug": "pemahaman-inferensial-ide-pokok-simpulan-sebab-akibat",
                "judul": "Bab 2 · Pemahaman Inferensial (Ide Pokok, Simpulan & Hubungan Sebab-Akibat)",
                "durasiBacaMenit": 15,
                "unitPages": list(range(16, 26)),
                "exPages": [26, 27],
                "keyPage": 27,
                "ringkasan": "Tentukan ide pokok payung paragraf (deduktif/induktif), simpulkan isi teks jamak, telaah hubungan sebab-akibat, dan prediksi logis peristiwa.",
                "objectives": [
                    "Menentukan kalimat utama dan ide pokok paragraf deduktif, induktif, maupun campuran.",
                    "Menyimpulkan persamaan dan perbedaan sudut pandang dari dua teks bacaan jamak.",
                    "Menilai hubungan sebab-akibat yang valid dan tidak terjebak generalisasi berlebihan (lebay)."
                ]
            },
            {
                "babNumber": 3,
                "slug": "teks-fiksi-puisi-tokoh-alur-majas-nilai-moral",
                "judul": "Bab 3 · Teks Fiksi & Puisi (Tokoh, Alur, Majas & Nilai Moral)",
                "durasiBacaMenit": 16,
                "unitPages": list(range(28, 41)),
                "exPages": [41, 42],
                "keyPage": 42,
                "cheatPage": 43,
                "ringkasan": "Analisis karakter tokoh dari dialog/perbuatan, alur cerita, sudut pandang (POV 1 vs 3), majas personifikasi/metafora, dan pesan moral amanat cerpen/puisi.",
                "objectives": [
                    "Mengidentifikasi watak tokoh bulat/dinamis melalui ucapan, tindakan, dan reaksi batinnya.",
                    "Mengenali 5 majas utama (personifikasi, metafora, hiperbola, simile, asosiasi) dalam cerpen & puisi.",
                    "Menemukan amanat moral yang dapat diterapkan dalam kehidupan nyata siswa sehari-hari."
                ]
            },
            {
                "babNumber": 4,
                "slug": "evaluasi-apresiasi-akurasi-argumen-sikap-penulis",
                "judul": "Bab 4 · Evaluasi & Apresiasi (Akurasi Argumen, Relevansi Teks & Sikap Penulis)",
                "durasiBacaMenit": 14,
                "unitPages": list(range(44, 50)),
                "exPages": [50],
                "keyPage": 50,
                "tryoutPages": [51, 52],
                "ringkasan": "Evaluasi fakta vs opini, validitas argumen pendukung, bias atau sikap penulis, serta paduan infografis visual pendamping teks.",
                "objectives": [
                    "Membedakan fakta objektif dengan opini atau klaim subjektif penulis dalam artikel berita.",
                    "Menilai keakuratan dan kelogisan bukti pendukung terhadap gagasan utama artikel.",
                    "Membaca infografis komplementer yang memperjelas informasi penting dalam bacaan."
                ]
            }
        ]
    },
    {
        "code": "IPA_SMP",
        "nama": "Ilmu Pengetahuan Alam (IPA CP Fase D)",
        "singkatan": "IPA",
        "badgeWarna": "#059669",
        "bgLight": "#ecfdf5",
        "borderWarna": "#a7f3d0",
        "emoji": "🔬",
        "isUtama": False,
        "deskripsi": "Metode ilmiah, zat & wujud, kalor pemuaian, mekanika gerak & gaya, optik kelistrikan, biologi sel organ, genetika, ekosistem bumi tata surya.",
        "pdfFile": "Modul_Master_TKA_SMP_IPA_2027.pdf",
        "outJs": "ipaSmpData.js",
        "varName": "IPA_SMP_MODUL",
        "chapters": [
            {
                "babNumber": 1,
                "slug": "pengukuran-zat-suhu-kalor-energi",
                "judul": "Bab 1 · Pengukuran, Zat, Suhu, Kalor & Energi",
                "durasiBacaMenit": 15,
                "unitPages": list(range(4, 14)),
                "exPages": [14, 15],
                "keyPage": 15,
                "ringkasan": "Identifikasi variabel percobaan (bebas, terikat, kontrol), ketelitian alat ukur, massa jenis, skala termometer, rumus kalor $Q = mc\\Delta T$, dan energi.",
                "objectives": [
                    "Menentukan variabel bebas, terikat, dan kontrol pada rancangan percobaan sains.",
                    "Membaca skala jangka sorong dan mikrometer sekrup serta menghitung massa jenis $\\rho = m/V$.",
                    "Menghitung konversi termometer dan kalor perubahan wujud zat $Q = mc\\Delta T$ dan $Q = mL$."
                ]
            },
            {
                "babNumber": 2,
                "slug": "mekanika-gelombang-optik-listrik-magnet",
                "judul": "Bab 2 · Mekanika, Gelombang, Optik, Listrik & Magnet",
                "durasiBacaMenit": 16,
                "unitPages": list(range(16, 26)),
                "exPages": [26, 27],
                "keyPage": 27,
                "ringkasan": "Gerak lurus (GLB & GLBB), 3 Hukum Newton, tekanan zat cair ($P = \\rho gh$), getaran-gelombang ($v = \\lambda f$), cermin-lensa, dan Hukum Ohm ($V = IR$).",
                "objectives": [
                    "Menganalisis grafik gerak $v-t$ dan pola titik ticker timer GLB/GLBB dipercepat-diperlambat.",
                    "Menerapkan Hukum II dan III Newton serta rumus tekanan hidrostatis dan Hukum Pascal.",
                    "Menghitung frekuensi gelombang, pembentukan bayangan cermin/lensa, serta hambatan rangkaian seri-paralel."
                ]
            },
            {
                "babNumber": 3,
                "slug": "makhluk-hidup-sel-sistem-organ-pewarisan-sifat",
                "judul": "Bab 3 · Makhluk Hidup, Sel, Sistem Organ & Pewarisan Sifat",
                "durasiBacaMenit": 16,
                "unitPages": list(range(28, 41)),
                "exPages": [41, 42],
                "keyPage": 42,
                "cheatPage": 43,
                "ringkasan": "Kunci dikotomi 5 kingdom, organel sel hewan vs tumbuhan, sistem pencernaan, peredaran darah, ekskresi, reproduksi, dan persilangan genetika Mendel.",
                "objectives": [
                    "Membaca kunci determinasi dikotomi dan membedakan ciri sel hewan vs sel tumbuhan.",
                    "Menganalisis proses kimiawi pencernaan enzimatis, peredaran darah besar/kecil, dan filtrasi nefron ginjal.",
                    "Menentukan rasio fenotipe dan genotipe persilangan monohibrid dominan penuh/intermediet (3:1 / 1:2:1)."
                ]
            },
            {
                "babNumber": 4,
                "slug": "lingkungan-bumi-tata-surya-ekologi",
                "judul": "Bab 4 · Lingkungan, Bumi–Tata Surya & Simulasi Tryout",
                "durasiBacaMenit": 14,
                "unitPages": list(range(44, 50)),
                "exPages": [50],
                "keyPage": 50,
                "tryoutPages": [51, 52],
                "ringkasan": "Interaksi rantai makanan ekosistem, pencemaran lingkungan (efek rumah kaca & eutrofikasi), struktur lapisan bumi (litosfer/atmosfer), dan rotasi-revolusi bumi.",
                "objectives": [
                    "Memprediksi dampak kepunahan populasi tertentu pada jaring-jaring makanan ekosistem.",
                    "Menjelaskan penyebab dan penanggulangan pemanasan global, penipisan ozon, serta hujan asam.",
                    "Menganalisis fenomena gerhana, pasang surut air laut, dan pergantian musim akibat revolusi bumi."
                ]
            }
        ]
    },
    {
        "code": "BIG_SMP",
        "nama": "Bahasa Inggris (English CP Fase D)",
        "singkatan": "BIG",
        "badgeWarna": "#7c3aed",
        "bgLight": "#f5f3ff",
        "borderWarna": "#ddd6fe",
        "emoji": "🇬🇧",
        "isUtama": False,
        "deskripsi": "Daily expressions, notice & caution, functional labels, essential tenses, passive voice, 5 core reading genres (Recount, Narrative, Procedure, Report).",
        "pdfFile": "Modul_Master_TKA_SMP_Bahasa_Inggris_2027.pdf",
        "outJs": "bahasaInggrisSmpData.js",
        "varName": "BIG_SMP_MODUL",
        "chapters": [
            {
                "babNumber": 1,
                "slug": "expressions-functional-texts-core-grammar",
                "judul": "Bab 1 · Expressions, Functional Texts & Core Grammar",
                "durasiBacaMenit": 15,
                "unitPages": list(range(4, 14)),
                "exPages": [14, 15],
                "keyPage": 15,
                "ringkasan": "Greeting, leave-taking, apologizing, notice/warning, nutrition facts product labels, prepositions of time/place, pronouns, and modals (can/must/should).",
                "objectives": [
                    "Memilih respons sopan yang natural pada dialog harian sesuai situasi formal vs informal.",
                    "Memahami maksud dan target pembaca dari notice, caution, warning, dan label makanan/obat.",
                    "Menerapkan penggunaan preposisi waktu (in, on, at) serta kata ganti (subject, object, possessive)."
                ]
            },
            {
                "babNumber": 2,
                "slug": "essential-tenses-passive-voice-connectors",
                "judul": "Bab 2 · Essential Tenses, Passive Voice & Connectors",
                "durasiBacaMenit": 15,
                "unitPages": list(range(16, 26)),
                "exPages": [26, 27],
                "keyPage": 27,
                "ringkasan": "Simple Present, Present Continuous, Simple Past (V2 & irregular verbs), Past Continuous, Present Perfect, Passive Voice ($be + V3$), dan conjunctions.",
                "objectives": [
                    "Membedakan fungsi dan time signal antara Simple Present, Simple Past, dan Present Continuous.",
                    "Mengubah kalimat aktif menjadi kalimat pasif ($S + be + V_3 + by + O$) dengan tenses yang tepat.",
                    "Menggunakan kata penghubung logis (although, however, so that, because, in order to) dalam kalimat kompleks."
                ]
            },
            {
                "babNumber": 3,
                "slug": "mastering-5-core-reading-genres",
                "judul": "Bab 3 · Mastering 5 Core Reading Genres",
                "durasiBacaMenit": 16,
                "unitPages": list(range(28, 41)),
                "exPages": [41, 42],
                "keyPage": 42,
                "cheatPage": 43,
                "ringkasan": "Kuasai 5 genre bacaan utama: Descriptive (benda/tempat/orang), Recount (pengalaman lampau), Narrative (fabel/legenda), Procedure (resep/manual), dan Report (fakta ilmiah).",
                "objectives": [
                    "Mengidentifikasi communicative purpose / social function dari teks Descriptive, Recount, Narrative, Procedure, Report.",
                    "Menemukan ide pokok paragraf, rujukan kata (reference pronoun), dan sinonim kata dalam konteks bacaan.",
                    "Menentukan pesan moral (moral value) dari cerita fabel atau legenda pada teks Narrative."
                ]
            },
            {
                "babNumber": 4,
                "slug": "multimodal-literacy-dialogues-tickets-schedules",
                "judul": "Bab 4 · Multimodal Literacy, Dialogues & Simulasi Tryout",
                "durasiBacaMenit": 14,
                "unitPages": list(range(44, 50)),
                "exPages": [50],
                "keyPage": 50,
                "tryoutPages": [51, 52],
                "ringkasan": "Membaca jadwal transportasi (schedules & timetables), tiket perjalanan, percakapan transaksional di toko/restoran, dan menyusun jumbled sentences menjadi paragraf koheren.",
                "objectives": [
                    "Menemukan informasi penting dari jadwal kereta/pesawat (departure, arrival, platform, durasi).",
                    "Memahami dialog transaksional memesan makanan atau membeli barang di toko.",
                    "Menyusun kalimat acak (jumbled sentences) menjadi paragraf narasi atau prosedur yang runtut."
                ]
            }
        ]
    }
]

def clean_lines(text):
    return [l.strip() for l in text.split("\n") if l.strip() and "@bimbel" not in l and "#Bangga" not in l]

def parse_unit(txt, p_no):
    lines = clean_lines(txt)
    u_title = ""
    u_num = ""
    start_idx = 1
    for i in range(1, min(6, len(lines))):
        m = re.match(r"^Unit\s+(\d+\.\d+)\s*[·•\-]\s*(.+)$", lines[i])
        if m:
            u_num = m.group(1)
            u_title = m.group(2).strip()
            start_idx = i + 1
            break
            
    hook = ""
    if start_idx < len(lines) and not lines[start_idx].startswith("Unit "):
        hook = lines[start_idx]
        start_idx += 1
    elif start_idx < len(lines) and lines[start_idx].startswith("Unit "):
        start_idx += 1
        if start_idx < len(lines):
            hook = lines[start_idx]
            start_idx += 1

    teori_lines = []
    jebakan_lines = []
    pondasi_lines = []
    soal_lines = []
    trik_lines = []
    
    current_sec = "teori"
    for l in lines[start_idx:]:
        l_lower = l.lower()
        if l.startswith("Jebakan") or "⚠️ jebakan" in l_lower or "jebakan tka" in l_lower or "jebakan hati-hati" in l_lower:
            current_sec = "jebakan"
            continue
        elif l.startswith("Pondasi ·") or l.startswith("Pondasi:") or l.startswith("Pondasi ") or "rumus 3 petunjuk" in l_lower:
            current_sec = "pondasi"
            pondasi_lines.append(l)
            continue
        elif l.startswith("Yuk Bahas ·") or l.startswith("Yuk Bahas:") or l.startswith("Yuk Bahas ") or l.startswith("Contoh Soal"):
            current_sec = "soal"
            soal_lines.append(l)
            continue
        elif l.startswith("Trik Cepat ·") or l.startswith("Trik Cepat:") or l.startswith("Trik Cepat ") or l.startswith("Trik Praktis"):
            current_sec = "trik"
            trik_lines.append(l)
            continue
            
        if current_sec == "teori":
            teori_lines.append(l)
        elif current_sec == "jebakan":
            jebakan_lines.append(l)
        elif current_sec == "pondasi":
            pondasi_lines.append(l)
        elif current_sec == "soal":
            soal_lines.append(l)
        elif current_sec == "trik":
            trik_lines.append(l)

    # Format soal Yuk Bahas
    contoh_soal_obj = None
    if soal_lines:
        soal_full = " ".join(soal_lines)
        soal_text = soal_full
        opsi_text = ""
        solusi_text = ""
        jawaban_text = ""
        
        m_soal = re.search(r"Soal:\s*(.+?)(?=Opsi:|$)", soal_full)
        if m_soal:
            soal_text = m_soal.group(1).strip()
            
        m_opsi = re.search(r"Opsi:\s*(.+?)(?=\w+[\:\—\–]|Hitung|Jawab|$)", soal_full)
        if m_opsi:
            opsi_text = m_opsi.group(1).strip()
            
        m_jawaban = re.search(r"Jawaban:\s*([A-D][^\.]*|\([^\)]+\)|[A-D]\.\s*[^\.]+)", soal_full)
        if m_jawaban:
            jawaban_text = m_jawaban.group(1).strip()
            
        contoh_soal_obj = {
            "judul": f"Yuk Bahas Unit {u_num}",
            "soal": soal_text,
            "opsiString": opsi_text,
            "jawaban": jawaban_text,
            "solusi": soal_full
        }
            
    return {
        "unitNumber": u_num or f"{p_no}",
        "judul": u_title or f"Unit Pendalaman Halaman {p_no}",
        "hook": hook,
        "teori": " ".join(teori_lines),
        "pondasi": " ".join(pondasi_lines),
        "jebakanTka": " ".join(jebakan_lines),
        "contohSoal": contoh_soal_obj,
        "trikCepat": " ".join(trik_lines),
        "pageNumber": p_no
    }

def parse_exercises(reader, q_pages, key_page, subtest_code, bab_num):
    q_text = "\n".join([reader.pages[p - 1].extract_text() for p in q_pages])
    k_text = reader.pages[key_page - 1].extract_text()
    
    q_lines = clean_lines(q_text)
    k_lines = clean_lines(k_text)
    
    # Parse keys
    keys = {}
    for l in k_lines:
        m = re.search(r"(?:Soal|No\.?)\s*(\d+)\s*(?:→|·|\:)\s*(?:Jawaban:?\s*)?([A-D](?:\s*dan\s*[A-D])?|\([^\)]+\)|[A-D]\s*\([^\)]+\)|\w+)[^\:\—\–]*(?:[\:\—\–]|\s*→)\s*(.+)", l)
        if m:
            num = int(m.group(1))
            val = m.group(2).strip()
            letter_m = re.match(r"^([A-D])\b", val)
            if letter_m:
                val = letter_m.group(1)
            elif val.startswith("(") and val.endswith(")"):
                val = val[1:-1]
            exp = m.group(3).strip()
            keys[num] = (val, exp)
            
    # Find question beginnings
    q_starts = []
    for idx, l in enumerate(q_lines):
        m = re.search(r"^(?:Soal|No\.?)\s*(\d+)\b", l)
        if m:
            num = int(m.group(1))
            if num not in [x[0] for x in q_starts] and num <= 6:
                q_starts.append((num, idx))
                
    q_starts.sort(key=lambda x: x[0])
    
    questions = []
    for i, (q_num, start_idx) in enumerate(q_starts):
        end_idx = q_starts[i+1][1] if i + 1 < len(q_starts) else len(q_lines)
        chunk = []
        for l in q_lines[start_idx:end_idx]:
            if "Kunci & Pembahasan" in l:
                break
            chunk.append(l)
            
        full_q_text = " ".join(chunk)
        
        # Options extraction
        opsi = {}
        m_opts = re.findall(r"([A-D])\.\s*([^·A-D]+?)(?=\s*[·•]\s*[B-D]\.|\s+[B-D]\.|$)", full_q_text)
        if len(m_opts) >= 2:
            for opt_k, opt_v in m_opts:
                opsi[opt_k] = opt_v.strip()
                
        # Ensure all A, B, C, D exist
        default_opts = {
            "A": "Pernyataan / Opsi (1) Benar",
            "B": "Pernyataan / Opsi (2) Benar",
            "C": "Pernyataan / Opsi (3) Benar",
            "D": "Pernyataan / Opsi (4) Benar"
        }
        for k in ["A", "B", "C", "D"]:
            if k not in opsi:
                opsi[k] = default_opts[k]
                
        k_val = keys.get(q_num, ("A", "Pembahasan lengkap tersedia di modul master."))[0]
        clean_kunci = "A"
        for letter in ["A", "B", "C", "D"]:
            if letter in k_val:
                clean_kunci = letter
                break
                
        pembahasan = keys.get(q_num, ("", "Lihat modul lengkap untuk langkah pengerjaan detail."))[1]
        
        questions.append({
            "id": f"{subtest_code.lower()}_b{bab_num}_q{q_num}",
            "soal": full_q_text,
            "opsi": opsi,
            "kunci": clean_kunci,
            "pembahasan": pembahasan
        })
        
    return questions

def run():
    for cfg in CONFIGS:
        pdf_path = os.path.join(PDF_DIR, cfg["pdfFile"])
        print(f"\nProcessing {cfg['code']} from {cfg['pdfFile']}...")
        reader = pypdf.PdfReader(pdf_path)
        
        bab_objects = []
        
        for ch in cfg["chapters"]:
            bab_num = ch["babNumber"]
            print(f"  -> Bab {bab_num}: {ch['judul']}")
            
            # 1. Parse all units
            units = []
            for p in ch["unitPages"]:
                txt = reader.pages[p - 1].extract_text()
                u_obj = parse_unit(txt, p)
                units.append(u_obj)
                
            # 2. Parse exercises
            exercises = parse_exercises(reader, ch["exPages"], ch["keyPage"], cfg["code"], bab_num)
            
            # 3. Cheat sheet if any
            cheat_sheet_text = ""
            if "cheatPage" in ch:
                c_txt = reader.pages[ch["cheatPage"] - 1].extract_text()
                cheat_sheet_text = "\n".join(clean_lines(c_txt))
                
            # 4. Tryout if any
            tryout_text = ""
            if "tryoutPages" in ch:
                t_parts = []
                for tp in ch["tryoutPages"]:
                    t_parts.append(reader.pages[tp - 1].extract_text())
                tryout_text = "\n\n".join(["\n".join(clean_lines(tp)) for tp in t_parts])

            # 5. Build backward-compatible konsepTeori from units
            konsep_teori = []
            for u in units:
                pts = []
                if u["hook"]:
                    pts.append(u["hook"])
                if u["pondasi"]:
                    pts.append(u["pondasi"])
                konsep_teori.append({
                    "subjudul": f"Unit {u['unitNumber']}: {u['judul']}",
                    "isi": u["teori"] or u["hook"],
                    "poinPenting": pts
                })
                
            # 6. Build contohSoal array for backward compatibility
            contoh_soal_arr = []
            for u in units:
                if u["contohSoal"] and u["contohSoal"]["soal"]:
                    cs = u["contohSoal"]
                    contoh_soal_arr.append({
                        "soal": cs["soal"],
                        "opsi": {
                            "A": "Opsi A",
                            "B": "Opsi B",
                            "C": "Opsi C",
                            "D": "Opsi D"
                        },
                        "kunci": "B" if "B" in cs["jawaban"] else ("A" if "A" in cs["jawaban"] else "C"),
                        "pembahasanLangkah": [
                            cs["solusi"]
                        ]
                    })
                    if len(contoh_soal_arr) >= 2:
                        break
                        
            # 7. Collect overall trikCepat & jebakanUmum
            first_trik = next((u["trikCepat"] for u in units if u["trikCepat"]), "Pelajari langkah sistematis KaBaTaKu dan identifikasi kata kunci utama!")
            first_jebakan = next((u["jebakanTka"] for u in units if u["jebakanTka"]), "Hindari menghitung terburu-buru tanpa memeriksa urutan prioritas!")

            bab_obj = {
                "id": f"{cfg['code'].lower()}_bab_{bab_num}",
                "subtestKode": cfg["code"],
                "subtestNama": cfg["nama"],
                "subtestSingkatan": cfg["singkatan"],
                "subtestEmoji": cfg["emoji"],
                "subtestWarna": cfg["badgeWarna"],
                "subtestBgLight": cfg["bgLight"],
                "babNumber": bab_num,
                "slug": ch["slug"],
                "judul": ch["judul"],
                "durasiBacaMenit": ch["durasiBacaMenit"],
                "ringkasanSingkat": ch["ringkasan"],
                "learningObjectives": ch["objectives"],
                "pdfUrl": f"/modul-pdf/{cfg['pdfFile']}",
                "pdfFilename": cfg["pdfFile"],
                "pdfTotalHalaman": 52,
                "isUtama": cfg["isUtama"],
                "units": units,
                "cheatSheet": cheat_sheet_text,
                "miniTryout": tryout_text,
                "konsepTeori": konsep_teori,
                "trikCepat": first_trik,
                "jebakanUmum": first_jebakan,
                "contohSoal": contoh_soal_arr,
                "kuisPemahaman": exercises
            }
            bab_objects.append(bab_obj)
            
        # Write JS file
        js_content = f"""// src/data/modul-smp/{cfg['outJs']}
// ==============================================================================
// MODUL MASTER 52 HALAMAN RESMI TKA SMP 2027 - BIMBEL GEMILANG
// Subtes: {cfg['nama']} ({cfg['code']})
// 4 Bab, {sum(len(b['units']) for b in bab_objects)} Unit Lengkap, Latihan Soal, Kuis Interaktif & PDF Master
// ==============================================================================

export const {cfg['varName']} = {json.dumps(bab_objects, ensure_ascii=False, indent=2)};
"""
        out_file = os.path.join(OUT_DIR, cfg["outJs"])
        with open(out_file, "w", encoding="utf-8") as f:
            f.write(js_content)
        print(f"  -> Generated {out_file} ({len(bab_objects)} bab, {sum(len(b['units']) for b in bab_objects)} units)")

if __name__ == "__main__":
    run()
