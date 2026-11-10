# scripts/generate_html_master_tka_diy.py
import json
import os

DIR_IMPOR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/data/impor"
DIR_EKSTRAKSI = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"
DIR_PUBLIC = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public"
os.makedirs(DIR_IMPOR, exist_ok=True)
os.makedirs(DIR_EKSTRAKSI, exist_ok=True)

# Helper function to generate clean standard Gemilang HTML
def generate_html_document(title, subtitle, questions):
    cards_html = []
    for q in questions:
        nomor = q["nomor"]
        tipe = q.get("tipe", "pg_sederhana")
        mapel = q.get("mapel", "Bahasa Indonesia")
        materi = q.get("materi", "-")
        kunci = q.get("kunci", "A")
        pembahasan = q.get("pembahasan", "")
        
        # Build article
        art_lines = [
            f'<article data-gemilang-question data-kesulitan="sedang" data-nomor="{nomor}" data-paket="1" data-tipe="{tipe}" data-mapel="{mapel}">'
        ]
        art_lines.append(f'  <div data-field="materi">{materi}</div>')
        
        # Bacaan / Stimulus
        bcn = q.get("bacaan")
        if bcn:
            grup = q.get("grup", f"grup_{nomor}")
            judul_attr = f' data-judul="{bcn.get("judul", "")}"' if bcn.get("judul") else ''
            art_lines.append(f'  <div data-field="bacaan" data-grup="{grup}"{judul_attr}>')
            if bcn.get("judul"):
                art_lines.append(f'    <h3>{bcn["judul"]}</h3>')
            if bcn.get("gambar"):
                for g in bcn["gambar"]:
                    art_lines.append(f'    <div class="stimulus-image"><img src="{g}" alt="Gambar Stimulus" style="max-width:100%; max-height:280px; display:block; margin:8px auto; border-radius:8px;" /></div>')
            if bcn.get("teks"):
                paragraphs = bcn["teks"].strip().split("\n")
                for p in paragraphs:
                    if p.strip():
                        art_lines.append(f'    <p>{p.strip()}</p>')
            if bcn.get("sumber"):
                art_lines.append(f'    <p class="sumber-teks" style="font-size:12px; color:#64748b; font-style:italic;">{bcn["sumber"]}</p>')
            art_lines.append('  </div>')
            
        # Gambar Butir Soal jika ada
        gambar_urls = q.get("gambarUrls", [])
        if gambar_urls:
            art_lines.append('  <div data-field="gambar_urls">')
            for g in gambar_urls:
                art_lines.append(f'    <img src="{g}" alt="Gambar Soal {nomor}" style="max-width:100%; max-height:300px; display:block; margin:8px auto; border-radius:8px;" />')
            art_lines.append('  </div>')
            
        # Teks Soal
        teks_soal = q.get("teks_soal", "")
        art_lines.append('  <div data-field="teks_soal">')
        for p in teks_soal.strip().split("\n"):
            if p.strip():
                art_lines.append(f'    <p>{p.strip()}</p>')
        art_lines.append('  </div>')
        
        # Tabel Soal jika ada
        tabel = q.get("tabel")
        if tabel:
            art_lines.append('  <div data-field="tabel_soal">')
            if tabel.get("gambar_tabel"):
                art_lines.append(f'    <div class="tabel-gambar-preview" style="margin-bottom:8px;"><img src="{tabel["gambar_tabel"]}" alt="Tabel Soal {nomor}" style="max-width:100%; border:1px solid #cbd5e1; border-radius:6px;" /></div>')
            if tabel.get("headers") and tabel.get("rows"):
                tbl_field = ' data-field="tabel_benar_salah"' if tipe in ['benar_salah', 'pg_kategori'] else ''
                art_lines.append(f'    <table{tbl_field} border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse; width:100%; margin:8px 0; font-size:13.5px;">')
                art_lines.append('      <thead><tr style="background:#f1f5f9;">')
                for h in tabel["headers"]:
                    art_lines.append(f'        <th style="border:1px solid #cbd5e1; padding:8px;">{h}</th>')
                art_lines.append('      </tr></thead>')
                art_lines.append('      <tbody>')
                for r in tabel["rows"]:
                    art_lines.append('        <tr>')
                    for cell in r:
                        art_lines.append(f'          <td style="border:1px solid #cbd5e1; padding:8px;">{cell}</td>')
                    art_lines.append('        </tr>')
                art_lines.append('      </tbody>')
                art_lines.append('    </table>')
            art_lines.append('  </div>')
            
        # Opsi Jawaban (PG / PG Kompleks / Benar Salah)
        opsi_list = q.get("opsi", [])
        if opsi_list:
            art_lines.append('  <ol data-field="opsi_jawaban">')
            for o in opsi_list:
                label = o.get("label", "")
                teks_opsi = o.get("teks", "")
                img_opsi = o.get("gambar", "")
                isi = []
                if teks_opsi:
                    isi.append(teks_opsi)
                if img_opsi:
                    isi.append(f'<br/><img src="{img_opsi}" alt="Opsi {label}" style="max-width:100%; max-height:160px; margin-top:6px; border-radius:6px; border:1px solid #e2e8f0;" />')
                art_lines.append(f'    <li data-label="{label}">{" ".join(isi)}</li>')
            art_lines.append('  </ol>')
            
        # Pernyataan jika ada (untuk benar_salah / pg_kategori)
        if q.get("pernyataan"):
            art_lines.append('  <ul data-field="pernyataan">')
            for p in q["pernyataan"]:
                k_val = p.get("kunci", "Benar")
                art_lines.append(f'    <li data-jawaban="{k_val}">{p.get("teks", "")}</li>')
            art_lines.append('  </ul>')
            
        # Kunci Jawaban & Pembahasan
        if isinstance(kunci, list):
            kunci_val = ",".join(str(k) for k in kunci)
        else:
            kunci_val = str(kunci)
        art_lines.append(f'  <meta data-field="kunci_jawaban" data-value="{kunci_val}" />')
        art_lines.append('  <meta data-field="kunci_terverifikasi" data-value="true" />')
        art_lines.append('  <div data-field="pembahasan">')
        art_lines.append(f'    <p>{pembahasan}</p>')
        art_lines.append('  </div>')
        art_lines.append('</article>\n')
        cards_html.append("\n".join(art_lines))

    doc_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
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
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
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
    article:last-of-type {{
      border-bottom: none;
    }}
    [data-field="materi"] {{
      font-size: 12px;
      font-weight: 700;
      color: #2563eb;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
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
      color: #1e3a8a;
    }}
    [data-field="bacaan"] p {{
      margin: 0 0 10px 0;
      font-size: 14px;
      line-height: 1.65;
    }}
    [data-field="teks_soal"] {{
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 14px;
      color: #1e293b;
    }}
    [data-field="opsi_jawaban"] {{
      margin: 12px 0 16px 20px;
      padding: 0;
    }}
    [data-field="opsi_jawaban"] li {{
      margin-bottom: 10px;
      font-size: 14.5px;
      color: #334155;
    }}
    [data-field="pembahasan"] {{
      background: #f1f5f9;
      border-left: 4px solid #3b82f6;
      border-radius: 0 8px 8px 0;
      padding: 12px 16px;
      margin-top: 14px;
      font-size: 13.5px;
      color: #1e293b;
    }}
    table {{
      border-collapse: collapse;
      width: 100%;
      margin: 10px 0;
    }}
    th, td {{
      border: 1px solid #cbd5e1;
      padding: 8px 12px;
      text-align: left;
    }}
    th {{
      background: #f8fafc;
      font-weight: 700;
    }}
    img {{
      max-width: 100%;
      height: auto;
    }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>{title}</h1>
      <div class="subtitle">{subtitle}</div>
    </header>
    {"".join(cards_html)}
  </div>
</body>
</html>"""
    return doc_html

print("Helper generate_html_document initialized.")
