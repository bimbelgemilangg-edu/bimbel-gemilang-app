#!/usr/bin/env python3
"""
compile_tryout_akbar.py
======================
Compiles 30 Soal TKA Matematika Paket A and 30 Soal TPM Bahasa Indonesia Paket B
into standardized HTML & JSON files for Bank Soal Gemilang:
1. tryout_tka_matematika_paket_a_30soal.html / .json
2. tryout_tpm_bindo_paket_b_30soal.html / .json
3. tryout_akbar_smp_tka_mat_bindo_60soal.html / .json (Combined 60 questions)
"""

import os
import sys
import json
import html
import re

sys.path.append(os.path.join(os.path.dirname(__file__)))
from build_full_tryout_files import render_html_article
from data_tka_matematika import SOAL_MATEMATIKA
from data_tpm_bahasa_indonesia import SOAL_BAHASA_INDONESIA

PUBLIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'public', 'ekstraksi-buku'))
os.makedirs(PUBLIC_DIR, exist_ok=True)

def build_html_doc(title, subtitle, articles):
    header = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{html.escape(title)}</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      max-width: 900px;
      margin: 0 auto;
      padding: 30px 20px;
      background-color: #f8fafc;
    }}
    .header {{
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
      color: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }}
    .header h1 {{ margin: 0 0 8px 0; font-size: 24px; font-weight: 700; }}
    .header p {{ margin: 0; opacity: 0.9; font-size: 14px; }}
    article[data-gemilang-question] {{
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }}
    [data-field="bacaan"] {{
      background: #f1f5f9;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      border-radius: 4px 8px 8px 4px;
      margin-bottom: 16px;
      font-size: 0.95rem;
    }}
    [data-field="teks_soal"] {{
      font-weight: 600;
      font-size: 1.05rem;
      margin-bottom: 16px;
    }}
    [data-field="gambar"] {{
      text-align: center;
      margin: 16px 0;
    }}
    [data-field="gambar"] img {{
      max-width: 100%;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
    }}
    ol[data-field="opsi_jawaban"] {{
      padding-left: 20px;
      margin-bottom: 16px;
    }}
    ol[data-field="opsi_jawaban"] li {{
      padding: 6px 0;
    }}
    [data-field="pembahasan"] {{
      background: #f8fafc;
      border-top: 1px dashed #cbd5e1;
      padding-top: 14px;
      margin-top: 16px;
      font-size: 0.9rem;
      color: #334155;
    }}
  </style>
</head>
<body>
  <div class="header">
    <h1>{html.escape(title)}</h1>
    <p>{html.escape(subtitle)}</p>
  </div>
"""
    footer = "\n</body>\n</html>\n"
    return header + "\n\n".join(articles) + footer

def clean_for_json(q):
    # Remove large base64 image data from JSON so file size stays lightweight if desired,
    # or keep url as static path
    q_copy = dict(q)
    if 'bacaan_gambar' in q_copy and q_copy['bacaan_gambar']:
        src = q_copy['bacaan_gambar']['src']
        if src.startswith('data:'):
            # retain only metadata and alt
            q_copy['bacaan_gambar'] = {"alt": q_copy['bacaan_gambar'].get('alt', '')}
    if 'gambar' in q_copy and q_copy['gambar']:
        src = q_copy['gambar']['src']
        if src.startswith('data:'):
            q_copy['gambar'] = {"alt": q_copy['gambar'].get('alt', '')}
    return q_copy

def main():
    print("=== Compiling Tryout Akbar Data ===")
    
    # 1. Matematika Paket A (30 Soal)
    mat_articles = [render_html_article(q) for q in SOAL_MATEMATIKA]
    mat_html = build_html_doc(
        "Tryout Akbar SMP: Matematika - TKA 2 Paket A (Kota Yogyakarta)",
        "30 Butir Soal Lengkap Sesuai Kurikulum Merdeka Fase D dengan Diagram, Grafik, dan Pembahasan Tuntas",
        mat_articles
    )
    mat_html_path = os.path.join(PUBLIC_DIR, "tryout_tka_matematika_paket_a_30soal.html")
    with open(mat_html_path, "w", encoding="utf-8") as f:
        f.write(mat_html)
    print(f"Matematika HTML written: {mat_html_path} ({len(mat_html)} bytes)")

    mat_json_path = os.path.join(PUBLIC_DIR, "tryout_tka_matematika_paket_a_30soal.json")
    with open(mat_json_path, "w", encoding="utf-8") as f:
        json.dump([clean_for_json(q) for q in SOAL_MATEMATIKA], f, ensure_ascii=False, indent=2)
    print(f"Matematika JSON written: {mat_json_path}")

    # 2. Bahasa Indonesia Paket B (30 Soal)
    bin_articles = [render_html_article(q) for q in SOAL_BAHASA_INDONESIA]
    bin_html = build_html_doc(
        "Tryout Akbar SMP: Bahasa Indonesia - TPM 2 Paket B (Kota Yogyakarta)",
        "30 Butir Soal Literasi Membaca Sesuai Kurikulum Merdeka Fase D dengan 10 Wacana Terintegrasi & Bebas Soal Yatim",
        bin_articles
    )
    bin_html_path = os.path.join(PUBLIC_DIR, "tryout_tpm_bindo_paket_b_30soal.html")
    with open(bin_html_path, "w", encoding="utf-8") as f:
        f.write(bin_html)
    print(f"Bahasa Indonesia HTML written: {bin_html_path} ({len(bin_html)} bytes)")

    bin_json_path = os.path.join(PUBLIC_DIR, "tryout_tpm_bindo_paket_b_30soal.json")
    with open(bin_json_path, "w", encoding="utf-8") as f:
        json.dump([clean_for_json(q) for q in SOAL_BAHASA_INDONESIA], f, ensure_ascii=False, indent=2)
    print(f"Bahasa Indonesia JSON written: {bin_json_path}")

    # 3. Combined Tryout Akbar (60 Soal)
    combined_articles = mat_articles + bin_articles
    comb_html = build_html_doc(
        "Tryout Akbar SMP: Paket Gabungan Matematika (Paket A) & Bahasa Indonesia (Paket B)",
        "Total 60 Butir Soal Terstandarisasi Siap Impor ke Bank Soal Gemilang (30 Soal Matematika + 30 Soal Bahasa Indonesia)",
        combined_articles
    )
    comb_html_path = os.path.join(PUBLIC_DIR, "tryout_akbar_smp_tka_mat_bindo_60soal.html")
    with open(comb_html_path, "w", encoding="utf-8") as f:
        f.write(comb_html)
    print(f"Combined 60 Soal HTML written: {comb_html_path} ({len(comb_html)} bytes)")

    comb_json_path = os.path.join(PUBLIC_DIR, "tryout_akbar_smp_tka_mat_bindo_60soal.json")
    with open(comb_json_path, "w", encoding="utf-8") as f:
        json.dump([clean_for_json(q) for q in SOAL_MATEMATIKA] + [clean_for_json(q) for q in SOAL_BAHASA_INDONESIA], f, ensure_ascii=False, indent=2)
    print(f"Combined 60 Soal JSON written: {comb_json_path}")

    print("\nAll 6 files successfully compiled!")

if __name__ == '__main__':
    main()
