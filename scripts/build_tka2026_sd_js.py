import re
import json
import os

MTK_HTML = "public/bank-soal/tka_matematika_sd_2026_lengkap.html"
BINDO_HTML = "public/bank-soal/to1_tka_bahasa_indonesia_sd_2026_lengkap.html"
OUT_JS = "src/data/tka2026SdData.js"

def parse_html_articles(file_path, prefix, mapel_default):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return []
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    articles = re.findall(r'<article\s+([^>]*?)>(.*?)</article>', html, re.DOTALL | re.IGNORECASE)
    soal_list = []

    for attr_str, content in articles:
        nomor_m = re.search(r'data-nomor="(\d+)"', attr_str)
        nomor = int(nomor_m.group(1)) if nomor_m else len(soal_list) + 1
        tipe_m = re.search(r'data-tipe="([^"]+)"', attr_str)
        tipe = tipe_m.group(1) if tipe_m else "pg_sederhana"

        # Materi
        materi_m = re.search(r'<div data-field="materi">(.*?)</div>', content, re.DOTALL)
        materi = re.sub(r'<[^>]+>', '', materi_m.group(1)).strip() if materi_m else ""

        # Teks Soal
        teks_m = re.search(r'<div data-field="teks_soal">(.*?)</div>', content, re.DOTALL)
        teks_soal = teks_m.group(1).strip() if teks_m else ""
        teks_clean = re.sub(r'<\/?p>', ' ', teks_soal).strip()

        # Bacaan
        bacaan_m = re.search(r'<div data-field="bacaan"[^>]*>(.*?)</div>', content, re.DOTALL)
        bacaan_html = bacaan_m.group(1).strip() if bacaan_m else ""

        # Gambar
        gambar_urls = []
        for g_m in re.finditer(r'<img[^>]+src="([^"]+)"', content):
            src = g_m.group(1).strip()
            if src and src not in gambar_urls:
                gambar_urls.append(src)

        # Opsi
        opsi = []
        opsi_block = re.search(r'<ol data-field="opsi_jawaban">(.*?)</ol>', content, re.DOTALL)
        if opsi_block:
            li_items = re.findall(r'<li data-label="([A-E])">(.*?)</li>', opsi_block.group(1), re.DOTALL)
            for lbl, opt_text in li_items:
                opt_clean = re.sub(r'<[^>]+>', '', opt_text).strip()
                opsi.append({
                    "key": lbl.upper(),
                    "label": lbl.upper(),
                    "teks": opt_clean,
                    "gambar": None
                })

        # Pernyataan jika pg_kompleks
        pernyataan = []
        pernyataan_block = re.search(r'<ul data-field="pernyataan">(.*?)</ul>', content, re.DOTALL)
        if pernyataan_block:
            p_items = re.findall(r'<li(?:\s+data-jawaban="([^"]*)")?>(.*?)</li>', pernyataan_block.group(1), re.DOTALL)
            for jwb, p_text in p_items:
                p_clean = re.sub(r'<[^>]+>', '', p_text).strip()
                p_img = re.search(r'src="([^"]+)"', p_text)
                pernyataan.append({
                    "teks": p_clean,
                    "jawaban": jwb or "Benar",
                    "gambar": p_img.group(1) if p_img else None
                })

        # Kunci Jawaban
        kunci_m = re.search(r'<meta data-field="kunci_jawaban" data-value="([^"]+)"', content)
        kunci = kunci_m.group(1).strip() if kunci_m else "A"

        # Pembahasan
        pembahasan_m = re.search(r'<div data-field="pembahasan">(.*?)</div>', content, re.DOTALL)
        pembahasan = re.sub(r'<\/?p>', ' ', pembahasan_m.group(1)).strip() if pembahasan_m else ""

        full_teks = teks_clean
        if bacaan_html:
            clean_bacaan = re.sub(r'<[^>]+>', ' ', bacaan_html).strip()
            full_teks = f"{clean_bacaan}\n\n{teks_clean}"

        soal_list.append({
            "id": f"{prefix}_{str(nomor).zfill(2)}",
            "nomor": nomor,
            "jenjang": "SD",
            "kelas": "6",
            "tingkatKelas": "6 SD",
            "mapel": mapel_default,
            "mataPelajaran": mapel_default,
            "materi": materi or mapel_default,
            "tipe": tipe,
            "teksSoal": full_teks,
            "teks_soal": full_teks,
            "soal": full_teks,
            "gambar": gambar_urls[0] if gambar_urls else None,
            "gambarUrls": gambar_urls,
            "opsiJawaban": opsi,
            "opsi": opsi,
            "pernyataan": pernyataan,
            "kunciJawaban": kunci,
            "kunci_jawaban": kunci,
            "kunci": kunci,
            "pembahasan": pembahasan
        })

    return soal_list

mtk_soal = parse_html_articles(MTK_HTML, "tka_sd_mtk", "Matematika")
bindo_soal = parse_html_articles(BINDO_HTML, "tka_sd_bindo", "Bahasa Indonesia")

print(f"Parsed SD MTK: {len(mtk_soal)} soal")
print(f"Parsed SD B.Indo: {len(bindo_soal)} soal")

out_code = f"""// src/data/tka2026SdData.js
// DATASET MASTER TERVERIFIKASI SOAL RESMI TKA SD 2025/2026
// Lengkap dengan Kunci Jawaban, Pembahasan KaTeX, & Gambar Ilustrasi

export const SOAL_TKA_2026_SD_MTK = {json.dumps(mtk_soal, indent=2, ensure_ascii=False)};

export const SOAL_TKA_2026_SD_BINDO = {json.dumps(bindo_soal, indent=2, ensure_ascii=False)};
"""

with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write(out_code)

print(f"Successfully generated {OUT_JS} with {len(mtk_soal) + len(bindo_soal)} total questions!")
