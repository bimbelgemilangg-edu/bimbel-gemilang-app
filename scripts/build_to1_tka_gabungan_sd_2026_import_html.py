# scripts/build_to1_tka_gabungan_sd_2026_import_html.py
# Generator Berkas Gabungan Paket 1 (B. Indonesia) & Paket 2 (Matematika)
# Try Out I TKA SD 2025/2026 (Total 60 Soal)
import os
import re

BINDO_PATH = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_bahasa_indonesia_sd_2026_lengkap.html"
MAT_PATH = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_matematika_sd_2026_lengkap.html"

with open(BINDO_PATH, "r", encoding="utf-8") as f:
    text_bindo = f.read()

with open(MAT_PATH, "r", encoding="utf-8") as f:
    text_mat = f.read()

# Extract articles
articles_bindo = re.findall(r'<article\s+data-gemilang-question[^>]*>.*?</article>', text_bindo, re.DOTALL)
articles_mat_raw = re.findall(r'<article\s+data-gemilang-question[^>]*>.*?</article>', text_mat, re.DOTALL)

# For Matematika in Paket 2, set data-paket="2"
articles_mat = []
for a in articles_mat_raw:
    a_p2 = re.sub(r'data-paket="1"', 'data-paket="2"', a)
    articles_mat.append(a_p2)

print(f"Loaded {len(articles_bindo)} bindo articles, {len(articles_mat)} mat articles")

combined_articles = articles_bindo + articles_mat

combined_html = f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Try Out I TKA SD/MI 2025/2026 - Paket Gabungan (B. Indonesia &amp; Matematika)</title>
  <style>
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      margin: 0;
      padding: 24px;
    }}
    .container {{
      max-width: 900px;
      margin: 0 auto;
      background: #ffffff;
      padding: 32px 36px;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }}
    header {{
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }}
    h1 {{
      font-size: 22px;
      color: #0f172a;
      margin: 0 0 6px 0;
    }}
    .subtitle {{
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
    }}
    article {{
      border-bottom: 1px solid #e2e8f0;
      padding: 24px 0;
    }}
    [data-field="materi"] {{
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }}
    [data-field="capaian_pembelajaran"] {{
      font-size: 12px;
      color: #64748b;
      margin-bottom: 12px;
    }}
    [data-field="bacaan"] {{
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 16px;
    }}
    [data-field="bacaan"] h3 {{
      margin: 0 0 8px 0;
      font-size: 15px;
      color: #0f172a;
    }}
    [data-field="teks_soal"] {{
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 14px;
    }}
    ol[data-field="opsi_jawaban"] {{
      margin: 0 0 16px 20px;
      padding: 0;
    }}
    ol[data-field="opsi_jawaban"] li {{
      margin-bottom: 8px;
    }}
    ul[data-field="pernyataan"] {{
      list-style-type: none;
      padding: 0;
      margin: 0 0 16px 0;
    }}
    ul[data-field="pernyataan"] li {{
      padding: 8px 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      margin-bottom: 6px;
    }}
    [data-field="pembahasan"] {{
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 12px 16px;
      font-size: 13.5px;
      color: #166534;
      border-radius: 0 8px 8px 0;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>TRY OUT I TES KEMAMPUAN AKADEMIK (TKA) SD/MI</h1>
      <div class="subtitle">Paket Lengkap: Bahasa Indonesia (Paket 1) &amp; Numerisasi/Matematika (Paket 2) | KKG Rejotangan Tulungagung 2025/2026</div>
    </header>
{chr(10).join(combined_articles)}
  </div>
</body>
</html>
"""

paths = [
    "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/bank-soal/to1_tka_gabungan_sd_2026_lengkap.html",
    "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/data/impor/to1_tka_gabungan_sd_2026_lengkap.html"
]

for p in paths:
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(combined_html)
    print(f"Generated ({len(combined_html)} bytes): {p}")
