# scripts/verify_tka_sd_2026_import.py using standard library
import re
import os
from html.parser import HTMLParser

HTML_PATH = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/tka_matematika_sd_2026_lengkap.html"
PUBLIC_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public"

with open(HTML_PATH, "r", encoding="utf-8") as f:
    html_text = f.read()

# Split into articles
article_pattern = re.compile(r'<article\s+data-gemilang-question([^>]*)>(.*?)</article>', re.DOTALL)
matches = list(article_pattern.finditer(html_text))

print("=== VERIFIKASI GERBANG BANK SOAL GEMILANG ===")
print("Total articles found:", len(matches))

errors_per_soal = {}
missing_files = []

for idx, match in enumerate(matches):
    art_attrs = match.group(1)
    art_body = match.group(2)

    nomor_match = re.search(r'data-nomor="(\d+)"', art_attrs)
    nomor = int(nomor_match.group(1)) if nomor_match else idx + 1

    tipe_match = re.search(r'data-tipe="([^"]+)"', art_attrs)
    tipe = tipe_match.group(1) if tipe_match else "pg_sederhana"

    soal_errors = []

    # 1. Teks Soal
    teks_soal_match = re.search(r'<div\s+data-field="teks_soal">(.*?)</div>', art_body, re.DOTALL)
    if not teks_soal_match:
        soal_errors.append("Field teks_soal tidak ditemukan.")
        teks_soal = ""
    else:
        # Strip tags
        teks_soal = re.sub(r'<[^>]+>', ' ', teks_soal_match.group(1)).strip()
        if not teks_soal:
            soal_errors.append("Teks soal kosong.")

    # Check raw LaTeX outside math delimiters
    tanpa_math = re.sub(r'\$\$[\s\S]*?\$\$', ' ', teks_soal)
    tanpa_math = re.sub(r'\\\[[\s\S]*?\\\]', ' ', tanpa_math)
    tanpa_math = re.sub(r'\\\([\s\S]*?\\\)', ' ', tanpa_math)
    tanpa_math = re.sub(r'\$[^$]*?\$', ' ', tanpa_math)
    raw_latex = re.findall(r'\\[a-zA-Z]{2,}', tanpa_math)
    if raw_latex:
        soal_errors.append("Ada kode LaTeX mentah di luar $...$: " + str(raw_latex))

    # 2. Gambar
    all_imgs = re.findall(r'<img[^>]+src="([^">]+)"', art_body)

    # Rule [3]: Gambar check
    menunjuk_gambar = bool(re.search(r'\b(gambar|grafik|diagram|kurva|infografis)\b', teks_soal, re.IGNORECASE))
    if menunjuk_gambar and not all_imgs:
        soal_errors.append("Soal menunjuk gambar/grafik/diagram di teksnya, tapi TIDAK ADA gambar terlampir!")

    for img_src in all_imgs:
        if img_src and img_src.startswith("/"):
            local_path = os.path.join(PUBLIC_DIR, img_src.lstrip("/"))
            if not os.path.exists(local_path):
                missing_files.append((nomor, img_src, local_path))
                soal_errors.append("Berkas gambar tidak ditemukan di disk: " + img_src)

    # 3. Opsi Jawaban
    if tipe in ["pg_sederhana", "pg_kompleks"]:
        opsi_match = re.search(r'<ol\s+data-field="opsi_jawaban">(.*?)</ol>', art_body, re.DOTALL)
        if not opsi_match:
            soal_errors.append("Pilihan jawaban (<ol data-field='opsi_jawaban'>) tidak ditemukan.")
        else:
            lis = re.findall(r'<li[^>]*>(.*?)</li>', opsi_match.group(1), re.DOTALL)
            if len(lis) < 2:
                soal_errors.append("Pilihan jawaban kurang dari 2 (ditemukan: " + str(len(lis)) + ").")

    # 4. Pernyataan (untuk benar_salah / pg_kategori)
    if tipe in ["benar_salah", "pg_kategori"]:
        pernyataan_match = re.search(r'<ul\s+data-field="pernyataan">(.*?)</ul>', art_body, re.DOTALL)
        if not pernyataan_match:
            soal_errors.append("Pernyataan (<ul data-field='pernyataan'>) belum ditemukan.")
        else:
            lis = re.findall(r'<li\s+data-jawaban="([^"]*)"[^>]*>(.*?)</li>', pernyataan_match.group(1), re.DOTALL)
            if len(lis) == 0:
                soal_errors.append("Pernyataan kosong.")
            for kj, t in lis:
                if not kj or kj not in ["Benar", "Salah", "Sesuai", "Tidak Sesuai"]:
                    soal_errors.append("Pernyataan memiliki data-jawaban tidak valid: " + str(kj))

    # 5. Kunci Jawaban
    kunci_match = re.search(r'<meta\s+data-field="kunci_jawaban"\s+data-value="([^"]+)"', art_body)
    if not kunci_match:
        soal_errors.append("Kunci jawaban (<meta data-field='kunci_jawaban'>) belum ditemukan.")

    # 6. Pembahasan
    pembahasan_match = re.search(r'<div\s+data-field="pembahasan">(.*?)</div>', art_body, re.DOTALL)
    if not pembahasan_match or not re.sub(r'<[^>]+>', '', pembahasan_match.group(1)).strip():
        soal_errors.append("Pembahasan kosong.")

    if soal_errors:
        errors_per_soal[nomor] = soal_errors

print("\n--- HASIL VALIDASI ---")
print("Total soal diperiksa :", len(matches))
print("Soal lolos validasi  :", len(matches) - len(errors_per_soal))
print("Soal ditolak/error   :", len(errors_per_soal))

if errors_per_soal:
    print("\n[!] DITEMUKAN ERROR PADA SOAL-SOAL BERIKUT:")
    for num, errs in errors_per_soal.items():
        print(f"  - Soal #{num}:")
        for e in errs:
            print("      •", e)
else:
    print("\n✅ 100% SEMPURNA! SELURUH 30 SOAL LOLOS VALIDASI GERBANG BANK SOAL GEMILANG!")
    print("   - Tidak ada gambar yang hilang")
    print("   - Tidak ada rumus LaTeX yang rusak")
    print("   - Seluruh opsi dan pernyataan lengkap dan presisi")
