#!/usr/bin/env python3
"""
clean_kelas8_redundant_images.py
================================
Membersihkan gambar banner tematik yang berulang di setiap soal.
Menjaga gambar HANYA pada soal-soal yang secara nyata merujuk ke gambar/diagram/grafik
(seperti organ pencernaan, ruang jantung, nefron ginjal, spirogram, distilasi Liebig, penampang Bumi).
Soal konsep, rumus, dan teori murni dibiarkan bersih tanpa gambar pengganggu.
"""

import os
import json
import re

OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"

def clean_chapter_file(bab_idx):
    html_name = f"kelas8_ipa_bab{bab_idx}_super_lengkap_70soal.html"
    json_name = f"kelas8_ipa_bab{bab_idx}_super_lengkap_70soal.json"
    
    html_path = os.path.join(OUTPUT_DIR, html_name)
    json_path = os.path.join(OUTPUT_DIR, json_name)
    
    with open(html_path, "r", encoding="utf-8") as f:
        html_text = f.read()
    with open(json_path, "r", encoding="utf-8") as f:
        json_data = json.load(f)
        
    articles = re.findall(r"<article\s+data-gemilang-question.*?</article>", html_text, re.DOTALL)
    
    cleaned_articles = []
    cleaned_json = []
    
    for idx, (art, jitem) in enumerate(zip(articles, json_data)):
        m_soal = re.search(r'<div data-field=\"teks_soal\">(.*?)</div>', art, re.DOTALL)
        soal_text = m_soal.group(1) if m_soal else jitem.get("teks_soal", "")
        
        needs_img = bool(re.search(
            r'perhatikan gambar|perhatikan diagram|perhatikan penampang|perhatikan grafik|rangkaian alat|berlabel X|bertanda X|pada gambar',
            soal_text,
            re.I
        ))
        
        if needs_img:
            cleaned_articles.append(art)
            cleaned_json.append(jitem)
        else:
            # Remove <div data-field="gambar">...</div>
            clean_art = re.sub(r'\s*<div data-field=\"gambar\">.*?</div>', '', art, flags=re.DOTALL)
            cleaned_articles.append(clean_art)
            
            # Clean json item
            clean_jitem = dict(jitem)
            clean_jitem["gambar"] = []
            cleaned_json.append(clean_jitem)
            
    # Reassemble HTML file
    header = html_text.split("<article")[0]
    footer = "</body></html>"
    new_html = header + "\n".join(cleaned_articles) + "\n" + footer
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(new_html)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_json, f, indent=2, ensure_ascii=False)
        
    kept = sum(1 for j in cleaned_json if j.get("gambar"))
    print(f"Bab {bab_idx}: Cleaned! Kept {kept} images, removed {70 - kept} redundant images.")

for b in range(1, 8):
    clean_chapter_file(b)

print("All 7 chapters cleaned successfully!")
