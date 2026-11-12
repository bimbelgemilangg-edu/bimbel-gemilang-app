# scripts/verify_to1_tka_sd_2026.py
# Comprehensive Bank Soal Gemilang Gate Validation for TO 1 TKA SD 2025/2026
import re
import os
import sys

PUBLIC_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public"

def verify_file(html_path, expected_count):
    print(f"\n=======================================================")
    print(f"VERIFIKASI: {os.path.basename(html_path)}")
    print(f"=======================================================")

    if not os.path.exists(html_path):
        print(f"ERROR: Berkas tidak ditemukan: {html_path}")
        return False

    with open(html_path, "r", encoding="utf-8") as f:
        html_text = f.read()

    article_pattern = re.compile(r'<article\s+data-gemilang-question([^>]*)>(.*?)</article>', re.DOTALL)
    matches = list(article_pattern.finditer(html_text))

    print(f"Total articles found: {len(matches)} (diharapkan: {expected_count})")
    if len(matches) != expected_count:
        print(f"ERROR: Jumlah soal tidak sesuai! Ditemukan: {len(matches)}, Target: {expected_count}")
        return False

    errors_per_soal = {}
    missing_files = []
    soal_with_img = 0

    for idx, match in enumerate(matches):
        art_attrs = match.group(1)
        art_body = match.group(2)

        nomor_match = re.search(r'data-nomor="(\d+)"', art_attrs)
        nomor = int(nomor_match.group(1)) if nomor_match else idx + 1

        paket_match = re.search(r'data-paket="([^"]+)"', art_attrs)
        paket = paket_match.group(1) if paket_match else "1"

        tipe_match = re.search(r'data-tipe="([^"]+)"', art_attrs)
        tipe = tipe_match.group(1) if tipe_match else "pg_sederhana"

        mapel_match = re.search(r'data-mapel="([^"]+)"', art_attrs)
        mapel = mapel_match.group(1) if mapel_match else ""

        soal_errors = []

        # 1. Teks Soal
        teks_soal_match = re.search(r'<div\s+data-field="teks_soal">(.*?)</div>', art_body, re.DOTALL)
        if not teks_soal_match:
            soal_errors.append("Field teks_soal tidak ditemukan.")
            teks_soal = ""
        else:
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
            soal_errors.append(f"Ada kode LaTeX mentah di luar $...$: {raw_latex}")

        # 2. Gambar
        all_imgs = re.findall(r'<img[^>]+src="([^">]+)"', art_body)
        if all_imgs:
            soal_with_img += 1
            for img_src in all_imgs:
                if img_src.startswith("/"):
                    local_path = os.path.join(PUBLIC_DIR, img_src.lstrip("/"))
                    if not os.path.exists(local_path):
                        missing_files.append((nomor, img_src, local_path))
                        soal_errors.append(f"Berkas gambar tidak ditemukan di disk: {img_src}")
                    else:
                        if os.path.getsize(local_path) == 0:
                            soal_errors.append(f"Berkas gambar berukuran 0 byte: {img_src}")

        # Gate Rule [3]: Check if question text mentions image but no image attached
        menunjuk_gambar = bool(re.search(r'\b(perhatikan|lihat|sesuai|berdasarkan)\s+(gambar|grafik|diagram|infografis)\b', teks_soal, re.IGNORECASE) or
                               re.search(r'\b(gambar|grafik|diagram|bagan|denah|sketsa|infografis)\s+(berikut|di\s+bawah|di\s+atas|tersebut|ini)\b', teks_soal, re.IGNORECASE))
        if menunjuk_gambar and not all_imgs:
            soal_errors.append("Soal menunjuk gambar/grafik/diagram/infografis di teksnya, tapi TIDAK ADA gambar terlampir!")

        # 3. Opsi Jawaban
        if tipe in ["pg_sederhana", "pg_kompleks"]:
            opsi_match = re.search(r'<ol\s+data-field="opsi_jawaban">(.*?)</ol>', art_body, re.DOTALL)
            if not opsi_match:
                soal_errors.append("Pilihan jawaban (<ol data-field='opsi_jawaban'>) tidak ditemukan.")
            else:
                lis = re.findall(r'<li[^>]*>(.*?)</li>', opsi_match.group(1), re.DOTALL)
                if len(lis) < 2:
                    soal_errors.append(f"Pilihan jawaban kurang dari 2 (ditemukan: {len(lis)}).")

        # 4. Pernyataan (untuk benar_salah / pg_kategori)
        if tipe in ["benar_salah", "pg_kategori"]:
            pernyataan_match = re.search(r'<ul[^>]*data-field="pernyataan"[^>]*>(.*?)</ul>', art_body, re.DOTALL)
            table_match = re.search(r'<table[^>]*data-field="pernyataan"[^>]*>(.*?)</table>', art_body, re.DOTALL)
            if not pernyataan_match and not table_match:
                soal_errors.append("Pernyataan (<ul data-field='pernyataan'> atau <table data-field='pernyataan'>) belum ditemukan.")
            elif pernyataan_match:
                lis = re.findall(r'<li\s+data-jawaban="([^"]*)"[^>]*>(.*?)</li>', pernyataan_match.group(1), re.DOTALL)
                if len(lis) == 0:
                    soal_errors.append("Pernyataan kosong.")
                for kj, t in lis:
                    if not kj:
                        soal_errors.append("Pernyataan memiliki data-jawaban kosong.")
            elif table_match:
                # Cek apakah tabel memiliki baris di tbody
                trs = re.findall(r'<tr[^>]*>(.*?)</tr>', table_match.group(1), re.DOTALL)
                if len(trs) <= 1:
                    soal_errors.append("Pernyataan tabel kosong.")

        # 5. Kunci Jawaban
        kunci_match = re.search(r'<meta\s+data-field="kunci_jawaban"\s+data-value="([^"]+)"', art_body)
        if not kunci_match:
            soal_errors.append("Kunci jawaban (<meta data-field='kunci_jawaban'>) belum ditemukan.")

        # 6. Pembahasan
        pembahasan_match = re.search(r'<div\s+data-field="pembahasan">(.*?)</div>', art_body, re.DOTALL)
        if not pembahasan_match or not re.sub(r'<[^>]+>', '', pembahasan_match.group(1)).strip():
            soal_errors.append("Pembahasan kosong.")

        if soal_errors:
            errors_per_soal[f"P{paket}-Soal{nomor} ({mapel})"] = soal_errors

    print(f"Hasil Validasi: {len(matches) - len(errors_per_soal)}/{len(matches)} lolos ({soal_with_img} soal bergambar)")
    if errors_per_soal:
        print("[!] DITEMUKAN KESALAHAN:")
        for k, errs in errors_per_soal.items():
            print(f"  - {k}:")
            for e in errs:
                print(f"      • {e}")
        return False
    else:
        print("✅ 100% LOLOS VERIFIKASI GERBANG BANK SOAL GEMILANG!")
        return True

if __name__ == "__main__":
    b1 = verify_file("/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_bahasa_indonesia_sd_2026_lengkap.html", 30)
    b2 = verify_file("/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_matematika_sd_2026_lengkap.html", 30)
    b3 = verify_file("/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_gabungan_sd_2026_lengkap.html", 60)

    if b1 and b2 and b3:
        print("\n🎉 SEMUA 3 BERKAS MASTER HTML LENGKAP & VALID 100%!")
        sys.exit(0)
    else:
        print("\n❌ ADA VALIDASI YANG GAGAL!")
        sys.exit(1)
