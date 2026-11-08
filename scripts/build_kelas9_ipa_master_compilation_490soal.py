#!/usr/bin/env python3
"""
build_kelas9_ipa_master_compilation_490soal.py
=============================================
Menggabungkan seluruh 7 Bab Soal Lengkap IPA SMP Kelas 9 menjadi Master Berkas:
- kelas9_ipa_super_lengkap_490soal.html (Format Impor Bank Soal 100% Valid)
- kelas9_ipa_super_lengkap_490soal.json (Dataset Terstruktur)
Total: 7 Bab x 70 Butir = 490 Butir Soal Lengkap
"""

import os
import json
import re

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"

chapter_files = [
    ("kelas9_ipa_bab1_super_lengkap_70soal.html", "Bab I: Pertumbuhan & Kelangsungan Hidup Organisme"),
    ("kelas9_ipa_bab2_super_lengkap_70soal.html", "Bab II: Sistem Koordinasi, Reproduksi, & Homeostasis"),
    ("kelas9_ipa_bab3_super_lengkap_70soal.html", "Bab III: Tekanan Zat Padat, Cair, dan Gas"),
    ("kelas9_ipa_bab4_super_lengkap_70soal.html", "Bab IV: Listrik, Magnet, & Energi Alternatif"),
    ("kelas9_ipa_bab5_super_lengkap_70soal.html", "Bab V: Reaksi-Reaksi Kimia dan Dinamikanya"),
    ("kelas9_ipa_bab6_super_lengkap_70soal.html", "Bab VI: Pewarisan Sifat dan Bioteknologi"),
    ("kelas9_ipa_bab7_super_lengkap_70soal.html", "Bab VII: Isu-Isu Lingkungan & Keberlanjutan"),
]

all_articles = []
all_json_records = []
global_q_num = 1

for ch_idx, (fname, bab_title) in enumerate(chapter_files):
    fpath = os.path.join(OUTPUT_DIR, fname)
    with open(fpath, "r", encoding="utf-8") as f:
        html_text = f.read()
    
    jpath = fpath.replace(".html", ".json")
    with open(jpath, "r", encoding="utf-8") as f:
        jdata = json.load(f)
    
    raw_articles = re.findall(r"<article\s+data-gemilang-question.*?</article>", html_text, re.DOTALL)
    print(f"Bab {ch_idx + 1} ({fname}): Loaded {len(raw_articles)} articles")
    
    if len(raw_articles) != 70:
        raise ValueError(f"Expected 70 articles in {fname}, got {len(raw_articles)}")

    for idx, art in enumerate(raw_articles):
        # Update data-nomor to global_q_num
        updated_art = re.sub(r'data-nomor="\d+"', f'data-nomor="{global_q_num}"', art, count=1)
        # Update Alt text or any Soal # badge if present
        updated_art = re.sub(r'Soal #\d+', f'Soal #{global_q_num}', updated_art)
        all_articles.append(updated_art)
        
        # Update json record
        rec = dict(jdata[idx])
        rec["nomor_global"] = global_q_num
        rec["bab_angka"] = ch_idx + 1
        rec["bab_nama"] = bab_title
        all_json_records.append(rec)
        
        global_q_num += 1

print(f"Total compiled articles: {len(all_articles)} (Global Q# 1 to {global_q_num - 1})")

articles_combined = "\n\n".join(all_articles)
master_html = f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kompilasi Master Bank Soal IPA SMP Kelas 9 Super Lengkap (490 Butir Soal)</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; line-height: 1.6; }}
    article {{ background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .badge {{ display: inline-block; background: #0284c7; color: white; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }}
    .packet {{ color: #64748b; font-size: 0.85rem; margin-bottom: 12px; }}
    .question {{ font-weight: 600; font-size: 1.05rem; margin-bottom: 14px; }}
    ol {{ margin: 0 0 16px 20px; padding: 0; }}
    li {{ margin-bottom: 6px; }}
    img {{ max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
<header style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
  <h1 style="color: #0369a1; font-size: 28px; margin-bottom: 8px;">Kompilasi Master Bank Soal IPA SMP Kelas 9 Super Lengkap</h1>
  <p style="color: #64748b; font-size: 15px;">Mencakup 7 Bab Buku Teks IPA SMP Kelas 9: Pertumbuhan & Kelangsungan Hidup, Sistem Koordinasi & Reproduksi, Tekanan Zat, Listrik & Magnet, Reaksi Kimia, Pewarisan Sifat & Bioteknologi, Isu Lingkungan (490 Soal)</p>
</header>
{articles_combined}
</body>
</html>'''

out_master_html = os.path.join(OUTPUT_DIR, "kelas9_ipa_super_lengkap_490soal.html")
with open(out_master_html, "w", encoding="utf-8") as f:
    f.write(master_html)

out_master_json = os.path.join(OUTPUT_DIR, "kelas9_ipa_super_lengkap_490soal.json")
with open(out_master_json, "w", encoding="utf-8") as f:
    json.dump(all_json_records, f, ensure_ascii=False, indent=2)

print(f"Saved: {out_master_html} ({len(master_html)} bytes)")
print(f"Saved: {out_master_json} ({len(all_json_records)} records)")
