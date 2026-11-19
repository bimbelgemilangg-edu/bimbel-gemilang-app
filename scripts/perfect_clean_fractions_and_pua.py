# scripts/perfect_clean_fractions_and_pua.py
# ==============================================================================
# Skrip pembersih PUA ("garis tiga" missing glyph) dan konversi pecahan miring
# menjadi pecahan bertingkat tegak (LaTeX \frac) di seluruh modul SMP.
# ==============================================================================

import os, re, json

BASE_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
DATA_DIR = os.path.join(BASE_DIR, 'src/data/modul-smp')

PETA_PECAHAN = {
    '½': ('1', '2'),
    '⅓': ('1', '3'),
    '⅔': ('2', '3'),
    '¼': ('1', '4'),
    '¾': ('3', '4'),
    '⅕': ('1', '5'),
    '⅖': ('2', '5'),
    '⅗': ('3', '5'),
    '⅘': ('4', '5'),
    '⅙': ('1', '6'),
    '⅚': ('5', '6'),
    '⅛': ('1', '8'),
    '⅜': ('3', '8'),
    '⅝': ('5', '8'),
    '⅞': ('7', '8'),
}

def bersihkan_pua_dan_pecahan(obj):
    if isinstance(obj, str):
        t = obj
        # 1. Bersihkan bullet ligatures Canva PUA
        t = t.replace('\ue072\ue094', '1. ').replace('\ue073\ue094', '2. ')
        t = t.replace('\ue074\ue094', '3. ').replace('\ue075\ue094', '4. ')
        t = t.replace('\ue076\ue094', '5. ').replace('\ue077\ue094', '6. ')
        t = re.sub(r'[\uE000-\uF8FF]', '', t)
        
        # 2. Ganti pecahan vulgar unicode dengan \frac tegak
        for vf, (a, b) in PETA_PECAHAN.items():
            if vf in t:
                # Ganti dengan formula KaTeX tegak
                # Jika sudah di dalam math token $...$, pakai \frac{a}{b}
                # Jika di luar, pakai $\frac{a}{b}$
                parts = t.split('$')
                new_parts = []
                for idx, p in enumerate(parts):
                    if idx % 2 == 1: # inside math
                        new_parts.append(p.replace(vf, f'\\frac{{{a}}}{{{b}}}'))
                    else: # outside math
                        new_parts.append(p.replace(vf, f'$\\frac{{{a}}}{{{b}}}$'))
                t = '$'.join(new_parts)
                
        # 3. Rapikan rumus pecahan miring spesifik yang sering muncul:
        # e.g. "162/360" -> "\frac{162}{360}", "22/7" -> "\frac{22}{7}", "3/6" -> "\frac{3}{6}", "4/6" -> "\frac{4}{6}", "2/6" -> "\frac{2}{6}"
        t = re.sub(r'\(162/360\)\s*[×x]\s*200', r'$\\frac{162}{360} \\times 200$', t)
        t = re.sub(r'\(22/7\)\s*[×x]\s*28', r'$\\frac{22}{7} \\times 28$', t)
        t = re.sub(r'\b3/6\b', r'$\\frac{3}{6}$', t)
        t = re.sub(r'\b4/6\b', r'$\\frac{4}{6}$', t)
        t = re.sub(r'\b2/6\b', r'$\\frac{2}{6}$', t)
        t = re.sub(r'\b1/3\b', r'$\\frac{1}{3}$', t)
        t = re.sub(r'\b49÷7\b', r'$\\frac{49}{7}$', t)
        t = re.sub(r'\b49/7\b', r'$\\frac{49}{7}$', t)
        
        # Rapikan delimiter math yang bersebelahan: misal "$...$$...$" atau "$$$$"
        t = t.replace('$$', '')
        return t
    elif isinstance(obj, list):
        return [bersihkan_pua_dan_pecahan(item) for item in obj]
    elif isinstance(obj, dict):
        return {k: bersihkan_pua_dan_pecahan(v) for k, v in obj.items()}
    return obj

def process_file(filename, export_name, alias_name):
    filepath = os.path.join(DATA_DIR, filename)
    with open(filepath, 'r') as f:
        content = f.read()
        
    m = re.search(r'export const (\w+)\s*=\s*(\[.*\]);', content, re.DOTALL)
    if not m:
        print(f'Gagal regex pada {filename}')
        return
        
    data = json.loads(m.group(2))
    
    # Khusus MTK Bab 4: perbaiki kuis pemahaman yang ter-merge
    if filename == 'matematikaSmpData.js':
        bab4 = next((b for b in data if b['babNumber'] == 4), None)
        if bab4:
            bab4['kuisPemahaman'] = [
                {
                    "id": "mtk_smp_b4_q1",
                    "soal": "[Unit 4.2] Diagram lingkaran 200 siswa: IPA $90^\\circ$, Matematika $108^\\circ$, sisanya Bahasa. Banyak siswa Bahasa adalah …",
                    "opsi": {
                        "A": "80 siswa",
                        "B": "90 siswa",
                        "C": "100 siswa",
                        "D": "110 siswa"
                    },
                    "kunci": "B",
                    "pembahasan": "Sudut Bahasa = $360^\\circ - (90^\\circ + 108^\\circ) = 162^\\circ$.\nBanyak siswa Bahasa = $\\frac{162}{360} \\times 200 = 90$ siswa!"
                },
                {
                    "id": "mtk_smp_b4_q2",
                    "soal": "[Unit 4.3] Data nilai: 6, 8, 7, 9, 7, 5, 7. Tentukan pernyataan yang BENAR:\n(1) Modus = 7\n(2) Median = 7\n(3) Jangkauan = 3\n(4) Mean > 7",
                    "opsi": {
                        "A": "(1) dan (2)",
                        "B": "(1) dan (3)",
                        "C": "(2) dan (4)",
                        "D": "(3) dan (4)"
                    },
                    "kunci": "A",
                    "pembahasan": "Urutkan data: 5, 6, 7, 7, 7, 8, 9.\n• Modus = 7 (muncul paling sering)\n• Median = 7 (nilai tengah ke-4)\n• Jangkauan = $9 - 5 = 4$ (bukan 3)\n• Mean = $\\frac{49}{7} = 7$ (tepat 7, bukan > 7).\nJadi pernyataan yang benar adalah (1) dan (2)."
                },
                {
                    "id": "mtk_smp_b4_q3",
                    "soal": "[Unit 4.4 & 4.5] Sebuah dadu 6 sisi dilempar 1 kali (dan untuk pernyataan C dilempar 90 kali). Manakah pernyataan berikut yang BENAR?",
                    "opsi": {
                        "A": "Peluang muncul mata dadu prima adalah $\\frac{1}{2}$",
                        "B": "Peluang muncul faktor dari 6 adalah $\\frac{2}{3}$",
                        "C": "Dalam 90 lemparan, frekuensi harapan mata dadu > 4 adalah 45 kali",
                        "D": "Pernyataan A dan B benar"
                    },
                    "kunci": "D",
                    "pembahasan": "Analisis butir:\n• Prima {2, 3, 5} $\\rightarrow P = \\frac{3}{6} = \\frac{1}{2}$ (Benar)\n• Faktor dari 6 {1, 2, 3, 6} $\\rightarrow P = \\frac{4}{6} = \\frac{2}{3}$ (Benar)\n• Mata dadu > 4 {5, 6} $\\rightarrow P = \\frac{2}{6} = \\frac{1}{3} \\rightarrow F_h = \\frac{1}{3} \\times 90 = 30$ kali (Salah, bukan 45).\nMaka pernyataan yang benar adalah A dan B."
                }
            ]

    # Khusus BIN Bab 1, 2, 3, 4: rapikan kuis pemahaman yang ter-merge
    if filename == 'bahasaIndonesiaSmpData.js':
        bab1 = next((b for b in data if b['babNumber'] == 1), None)
        if bab1 and len(bab1.get('kuisPemahaman', [])) >= 2:
            bab1['kuisPemahaman'][0] = {
                "id": "bin_smp_b1_q1",
                "soal": "Berdasarkan teks stimulus \"Kompos dari Sampah Dapur\", makna istilah fermentasi sesuai konteks bacaan adalah …",
                "opsi": {
                    "A": "Pembakaran sampah secara bertahap",
                    "B": "Penguraian bahan organik oleh mikroba pengurai",
                    "C": "Penyiraman tanaman pekarangan",
                    "D": "Penjemuran kulit buah di bawah sinar matahari"
                },
                "kunci": "B",
                "pembahasan": "Petunjuk konteks kalimat: 'Proses fermentasi dibantu oleh bakteri pengurai'."
            }
            bab1['kuisPemahaman'][1] = {
                "id": "bin_smp_b1_q2",
                "soal": "Frasa \"Upaya ini\" pada kalimat terakhir teks stimulus merujuk pada …",
                "opsi": {
                    "A": "Membuang sampah ke tempat penampungan akhir",
                    "B": "Membeli pupuk kimia di toko pertanian",
                    "C": "Pengolahan sampah organik rumah tangga menjadi kompos",
                    "D": "Menyiram pekarangan rumah secara teratur"
                },
                "kunci": "C",
                "pembahasan": "Frasa 'Upaya ini' merujuk langsung pada seluruh proses pembuatan kompos dari sampah organik yang dijelaskan pada kalimat sebelumnya."
            }
            
        bab2 = next((b for b in data if b['babNumber'] == 2), None)
        if bab2 and len(bab2.get('kuisPemahaman', [])) >= 2:
            bab2['kuisPemahaman'][0] = {
                "id": "bin_smp_b2_q1",
                "soal": "Berdasarkan perbandingan dua teks, ide pokok Teks A adalah …",
                "opsi": {
                    "A": "Kenaikan harga gawai baru di pasaran",
                    "B": "Layanan peminjaman gawai untuk menunjang belajar siswa",
                    "C": "Keunggulan laptop dibandingkan ponsel pintar",
                    "D": "Larangan membawa gawai pribadi ke sekolah"
                },
                "kunci": "B",
                "pembahasan": "Ide pokok Teks A mengulas program layanan peminjaman gawai sekolah untuk memfasilitasi kebutuhan belajar siswa."
            }
            bab2['kuisPemahaman'][1] = {
                "id": "bin_smp_b2_q2",
                "soal": "Persamaan informasi utama yang disampaikan pada Teks A dan Teks B adalah …",
                "opsi": {
                    "A": "Batas waktu peminjaman gawai maksimal 7 hari",
                    "B": "Membantu siswa yang terkendala fasilitas belajar daring",
                    "C": "Pemberian paket kuota internet bulanan secara gratis",
                    "D": "Lokasi peminjaman gawai terpusat di laboratorium sekolah"
                },
                "kunci": "B",
                "pembahasan": "Kedua teks memuat gagasan yang sama: memberikan solusi nyata bagi siswa yang mengalami kendala sarana belajar digital."
            }

        bab3 = next((b for b in data if b['babNumber'] == 3), None)
        if bab3 and len(bab3.get('kuisPemahaman', [])) >= 2:
            bab3['kuisPemahaman'][0] = {
                "id": "bin_smp_b3_q1",
                "soal": "Berdasarkan kutipan cerpen, sifat tokoh Raka yang paling menonjol adalah …",
                "opsi": {
                    "A": "Manja dan mudah menyerah pada keadaan",
                    "B": "Mandiri dan peduli terhadap kondisi keluarga",
                    "C": "Suka membanggakan diri di depan teman",
                    "D": "Pendiam dan enggan berbicara dengan orang tua"
                },
                "kunci": "B",
                "pembahasan": "Raka tidak ingin merepotkan ibunya yang baru pulih dan bertekad mandiri membantu menjahit pakaian."
            }
            bab3['kuisPemahaman'][1] = {
                "id": "bin_smp_b3_q2",
                "soal": "Sudut pandang (Point of View) yang digunakan pengarang dalam kutipan cerpen tersebut adalah …",
                "opsi": {
                    "A": "Orang pertama tokoh utama (aku-an)",
                    "B": "Orang pertama tokoh sampingan",
                    "C": "Orang ketiga serbatahu (ia/dia-an serbatahu)",
                    "D": "Orang ketiga pengamat"
                },
                "kunci": "C",
                "pembahasan": "Narator menyebut tokoh dengan nama Raka/ia dan mengetahui seluruh isi pikiran serta gejolak batinnya."
            }

        bab4 = next((b for b in data if b['babNumber'] == 4), None)
        if bab4 and len(bab4.get('kuisPemahaman', [])) >= 2:
            bab4['kuisPemahaman'][0] = {
                "id": "bin_smp_b4_q1",
                "soal": "Cerpen tentang siswa yang selalu menunda tugas hingga keteteran paling relevan diajarkan untuk mengatasi masalah …",
                "opsi": {
                    "A": "Rendahnya nilai kebugaran jasmani siswa",
                    "B": "Kebiasaan prokrastinasi (menunda-nunda) tugas belajar",
                    "C": "Kurangnya persediaan buku cerita di perpustakaan",
                    "D": "Konflik antarsiswa saat jam istirahat sekolah"
                },
                "kunci": "B",
                "pembahasan": "Cerita bertema menunda tugas relevan untuk refleksi siswa yang sering melakukan prokrastinasi dalam belajar."
            }
            bab4['kuisPemahaman'][1] = {
                "id": "bin_smp_b4_q2",
                "soal": "Ciri-ciri informasi hoaks di media sosial yang wajib diwaspadai adalah:\n(1) Judul sensasional dan provokatif\n(2) Menggunakan huruf kapital berlebihan\n(3) Tidak mencantumkan sumber dan tanggal jelas\n(4) Memuat nama penulis dan lembaga riset kredibel",
                "opsi": {
                    "A": "(1), (2), dan (3)",
                    "B": "(1) dan (4)",
                    "C": "(2) dan (4)",
                    "D": "Semua nomor benar"
                },
                "kunci": "A",
                "pembahasan": "Ciri hoaks mencakup nomor (1), (2), dan (3). Nomor (4) justru ciri berita faktual dan terpercaya."
            }

    # Bersihkan seluruh dataset dari PUA dan konversi ke pecahan tegak
    cleaned_data = bersihkan_pua_dan_pecahan(data)
    
    # Tulis kembali dengan header asli dan export ganda (uppercase + camelCase) agar kompatibel 100%
    header = f"// src/data/modul-smp/{filename}\n// ==============================================================================\n// MODUL MASTER 52 HALAMAN RESMI TKA SMP 2027 - BIMBEL GEMILANG\n// Bebas karakter PUA, pecahan tegak KaTeX, dan kuis pemahaman terstruktur rapi\n// ==============================================================================\n\nexport const {export_name} = "
    
    formatted_json = json.dumps(cleaned_data, ensure_ascii=False, indent=2)
    footer = f";\n\nexport const {alias_name} = {export_name};\nexport default {export_name};\n"
    new_content = header + formatted_json + footer
    
    with open(filepath, 'w') as f:
        f.write(new_content)
        
    print(f'Selesai memproses {filename} (Export: {export_name}, Alias: {alias_name})')

def run():
    files = [
        ('matematikaSmpData.js', 'MTK_SMP_MODUL', 'matematikaSmpData'),
        ('bahasaIndonesiaSmpData.js', 'BIN_SMP_MODUL', 'bahasaIndonesiaSmpData'),
        ('ipaSmpData.js', 'IPA_SMP_MODUL', 'ipaSmpData'),
        ('bahasaInggrisSmpData.js', 'BIG_SMP_MODUL', 'bahasaInggrisSmpData'),
    ]
    for fn, en, an in files:
        process_file(fn, en, an)

if __name__ == '__main__':
    run()
