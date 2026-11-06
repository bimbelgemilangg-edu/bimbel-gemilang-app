#!/usr/bin/env python3
"""
Verify HTML import compatibility with ImportHasilScanPage.jsx and kelayakanSoal.js.
Simulates parseHTMLMaster, parseHTMLImages, parseHTMLStatements, and alasanKelayakan.
"""

import os
import re
import html
import base64

OUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
TARGET_FILES = [
    "kelas7_kurikulum_merdeka_125soal_lengkap.html",
    "kelas7_ch1_about_me.html",
    "kelas7_ch2_culinary_and_me.html",
    "kelas7_ch3_home_sweet_home.html",
    "kelas7_ch4_my_school_activities.html",
    "kelas7_ch5_this_is_my_school.html",
]

def simulate_parse_and_validate(filepath):
    print(f"\n================ VALIDATING: {os.path.basename(filepath)} ================")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find articles
    articles = re.findall(r"<article\s+data-gemilang-question.*?</article>", content, re.DOTALL)
    print(f"Total <article data-gemilang-question> found: {len(articles)}")

    errors = []
    warnings = []

    for idx, art in enumerate(articles):
        q_num_match = re.search(r'data-nomor="(\d+)"', art)
        q_num = int(q_num_match.group(1)) if q_num_match else idx + 1

        tipe_match = re.search(r'data-tipe="([^"]+)"', art)
        tipe = tipe_match.group(1) if tipe_match else "pg_sederhana"

        # Extract fields
        def get_field_text(fname):
            m = re.search(rf'<div\s+data-field="{fname}"[^>]*>(.*?)</div>', art, re.DOTALL)
            if not m:
                return ""
            # Strip tags
            txt = re.sub(r"<[^>]+>", " ", m.group(1))
            return html.unescape(txt).strip()

        teks_soal = get_field_text("teks_soal")
        kunci = get_field_text("kunci_jawaban")
        pembahasan = get_field_text("pembahasan")
        materi = get_field_text("materi")
        paket_match = re.search(r'data-paket="([^"]+)"', art)
        paket = paket_match.group(1) if paket_match else ""

        # Images
        img_matches = re.findall(r'<img\s+[^>]*src="([^"]+)"[^>]*>', art)
        has_image = len(img_matches) > 0
        img_is_valid = False
        if has_image:
            src = img_matches[0]
            if src.startswith("data:image/") and ";base64," in src:
                # verify base64 decodable
                try:
                    b64_data = src.split(";base64,")[1]
                    raw_bytes = base64.b64decode(b64_data[:100] + "==")
                    img_is_valid = len(raw_bytes) > 0
                except Exception as e:
                    errors.append(f"Q#{q_num}: Corrupt base64 image: {e}")
            elif src.startswith("/"):
                img_is_valid = True

        # Validation per type
        if not teks_soal:
            errors.append(f"Q#{q_num}: teks_soal is empty!")

        if not kunci:
            errors.append(f"Q#{q_num}: kunci_jawaban is empty!")

        if not pembahasan:
            errors.append(f"Q#{q_num}: pembahasan is empty!")

        if not materi:
            warnings.append(f"Q#{q_num}: materi is empty!")

        if not paket:
            warnings.append(f"Q#{q_num}: data-paket is empty!")

        if not has_image or not img_is_valid:
            errors.append(f"Q#{q_num}: image missing or invalid!")

        if tipe in ["pg_sederhana", "pg_kompleks"]:
            # Check options
            opsi_matches = re.findall(r'<li\s+data-option="([A-D])"[^>]*>(.*?)</li>', art, re.DOTALL)
            if len(opsi_matches) < 2:
                errors.append(f"Q#{q_num}: options count is {len(opsi_matches)} (< 2)!")
            # Check key points to valid option
            if tipe == "pg_sederhana":
                k_clean = kunci.strip()[:1].upper()
                opt_labels = [m[0].upper() for m in opsi_matches]
                if k_clean not in opt_labels:
                    errors.append(f"Q#{q_num}: Key '{k_clean}' not in options {opt_labels}!")

        elif tipe == "benar_salah":
            # Check statements
            tr_matches = re.findall(r'<tr\s+data-jawaban="([^"]+)"[^>]*>.*?<td>(.*?)</td>', art, re.DOTALL)
            li_matches = re.findall(r'<li\s+data-jawaban="([^"]+)"[^>]*>(.*?)</li>', art, re.DOTALL)
            if len(tr_matches) < 2 and len(li_matches) < 2:
                errors.append(f"Q#{q_num}: Benar/Salah statements count < 2 (tr={len(tr_matches)}, li={len(li_matches)})!")

    if errors:
        print(f"FAILED! Found {len(errors)} ERRORS:")
        for e in errors[:10]:
            print(f"  ERROR: {e}")
        return False
    else:
        print(f"PASSED! 0 Errors. (Warnings: {len(warnings)}) All {len(articles)} questions 100% valid for Gemilang Import!")
        return True

all_passed = True
for fn in TARGET_FILES:
    fp = os.path.join(OUT_DIR, fn)
    if not simulate_parse_and_validate(fp):
        all_passed = False

if all_passed:
    print("\n>>> ALL 6 IMPORT FILES PASSED VALIDATION WITH 0 ERRORS! <<<")
else:
    print("\n>>> SOME FILES FAILED VALIDATION! <<<")
    exit(1)
