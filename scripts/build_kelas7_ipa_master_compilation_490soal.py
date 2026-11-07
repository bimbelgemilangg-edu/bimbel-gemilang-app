#!/usr/bin/env python3
"""
build_kelas7_ipa_master_compilation_490soal.py
=============================================
Menggabungkan seluruh 7 Bab Soal Lengkap IPA SMP Kelas 7 menjadi Master Berkas:
- kelas7_ipa_super_lengkap_490soal.html (Format Impor Bank Soal 100% Valid)
- kelas7_ipa_super_lengkap_490soal.json (Dataset Terstruktur)
"""

import os
import json
import re

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"

chapter_files = [
    "kelas7_ipa_bab1_super_lengkap_70soal.html",
    "kelas7_ipa_bab2_super_lengkap_70soal.html",
    "kelas7_ipa_bab3_super_lengkap_70soal.html",
    "kelas7_ipa_bab4_super_lengkap_70soal.html",
    "kelas7_ipa_bab5_super_lengkap_70soal.html",
    "kelas7_ipa_bab6_super_lengkap_70soal.html",
    "kelas7_ipa_bab7_super_lengkap_70soal.html",
]

all_articles = []
all_json_records = []
global_q_num = 1

for ch_idx, fname in enumerate(chapter_files):
    fpath = os.path.join(OUTPUT_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        html_text = f.read()
    
    # Load corresponding json
    jpath = fpath.replace(".html", ".json")
    with open(jpath, "r", encoding="utf-8") as f:
        jdata = json.load(f)
    
    # Extract articles
    raw_articles = re.findall(r"<article\s+data-gemilang-question.*?</article>", html_text, re.DOTALL)
    print(f"Loaded {len(raw_articles)} articles from {fname}")

    for idx, art in enumerate(raw_articles):
        # Update data-nomor to global_q_num
        updated_art = re.sub(r'data-nomor="\d+"', f'data-nomor="{global_q_num}"', art)
        updated_art = re.sub(r'Soal #\d+:', f'Soal #{global_q_num}:', updated_art)
        all_articles.append(updated_art)
        
        # Update json record
        rec = dict(jdata[idx])
        rec["nomor_global"] = global_q_num
        rec["bab_angka"] = ch_idx + 1
        all_json_records.append(rec)
        
        global_q_num += 1

print(f"Total compiled articles: {len(all_articles)} (Global Q# 1 to {global_q_num - 1})")

# Save master HTML
articles_combined = "\n\n".join(all_articles)
master_html = f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kompilasi Master Bank Soal IPA SMP Kelas 7 Super Lengkap (490 Butir Soal)</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; }}
    article {{ background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
<header style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
  <h1 style="color: #0369a1; font-size: 28px; margin-bottom: 8px;">Kompilasi Master Bank Soal IPA SMP Kelas 7 Super Lengkap</h1>
  <p style="color: #64748b; font-size: 15px;">Mencakup 7 Bab Buku Teks IPA SMP: Hakikat Sains, Zat, Suhu & Kalor, Gerak & Gaya, Klasifikasi, Ekologi, Bumi & Tata Surya (490 Soal)</p>
</header>
{articles_combined}
</body>
</html>'''

out_master_html = os.path.join(OUTPUT_DIR, "kelas7_ipa_super_lengkap_490soal.html")
with open(out_master_html, "w", encoding="utf-8") as f:
    f.write(master_html)

out_master_json = os.path.join(OUTPUT_DIR, "kelas7_ipa_super_lengkap_490soal.json")
with open(out_master_json, "w", encoding="utf-8") as f:
    json.dump(all_json_records, f, ensure_ascii=False, indent=2)

print(f"Saved: {out_master_html} ({len(master_html)} bytes)")
print(f"Saved: {out_master_json} ({len(all_json_records)} records)")
