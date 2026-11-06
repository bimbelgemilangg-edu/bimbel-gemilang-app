# scripts/build_kelas7_kmerdeka_pdf_and_html.py
import os
import sys
import json
import base64
from html import escape

repo_dir = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
out_dir = os.path.join(repo_dir, 'public/ekstraksi-buku')
img_dir = os.path.join(repo_dir, 'public/soal/bahasa-inggris')
os.makedirs(out_dir, exist_ok=True)
os.makedirs(img_dir, exist_ok=True)

sys.path.append(os.path.join(repo_dir, 'scripts'))
from kmerdeka_questions_part1 import SOAL_PART1
from kmerdeka_questions_part2 import SOAL_PART2
from kmerdeka_questions_part3 import SOAL_PART3

ALL_SOAL = SOAL_PART1 + SOAL_PART2 + SOAL_PART3
print(f"Total compiled questions: {len(ALL_SOAL)} butir.")

def to_base64_uri(filename):
    path = os.path.join(img_dir, filename)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        ext = filename.split('.')[-1].lower()
        mime = 'jpeg' if ext in ['jpg', 'jpeg'] else ext
        return f"data:image/{mime};base64,{b64}"
    return f"/soal/bahasa-inggris/{filename}"

# =========================================================================
# 1. GENERATE HTML MASTER FOR IMPORT (/admin/bank-soal/import)
# =========================================================================
html_articles = []

for q in ALL_SOAL:
    num = q['nomor']
    tp = q['tipe']
    ch = q['chapter']
    un = q['unit']
    sem = q['semester']
    paket_name = f"{ch} - {un}"
    kl = q['tingkatKelas']
    jj = q['jenjang']
    fase = q['fase']
    mapel = q['mapel']
    mt = q['materi']
    cp = q['capaian_pembelajaran']
    soal_t = q['teks_soal']
    kj = q['kunci_jawaban']
    pb = q['pembahasan']

    # Bacaan
    bacaan_html = ''
    if q.get('bacaan') and q['bacaan'].get('teks'):
        b_grup = q['bacaan'].get('grup', f"bacaan_{num}")
        b_teks = q['bacaan']['teks'].replace('\n', '<br/>')
        bacaan_html = f'''<div data-field="bacaan" data-grup="{b_grup}">
    <p>{b_teks}</p>
  </div>'''

    # Gambar
    gambar_html = ''
    if q.get('gambar') and len(q['gambar']) > 0:
        imgs = []
        for g_file in q['gambar']:
            uri = to_base64_uri(g_file)
            imgs.append(f'<img src="{uri}" alt="Stimulus Visual Soal {num}" style="max-width: 100%; height: auto; margin: 8px 0;" />')
        gambar_html = f'<div data-field="gambar">{"".join(imgs)}</div>'

    # Opsi
    opsi_html = ''
    if q.get('opsi_jawaban'):
        items = []
        for o in q['opsi_jawaban']:
            lbl = o.get('label', '')
            items.append(f'<li data-option="{lbl}">{o["teks"]}</li>')
        opsi_html = f'<ul data-field="opsi_jawaban">{"".join(items)}</ul>'

    # Pernyataan (Benar/Salah)
    pernyataan_html = ''
    if q.get('pernyataan'):
        tf_rows = []
        ol_items = []
        for i, p in enumerate(q['pernyataan']):
            idx_label = f"({chr(97 + i)})"
            tk = p['teks']
            is_benar = p['jawaban'] in ['B', 'True', 'Benar']
            centang_benar = '✓' if is_benar else ''
            centang_salah = '' if is_benar else '✓'
            jw_word = 'Benar' if is_benar else 'Salah'
            tf_rows.append(f'''      <tr data-jawaban="{jw_word}">
        <td style="text-align: center;">{idx_label}</td>
        <td>{tk}</td>
        <td style="text-align: center;">{centang_benar}</td>
        <td style="text-align: center;">{centang_salah}</td>
      </tr>''')
            ol_items.append(f'      <li data-jawaban="{jw_word}">{tk} ({jw_word})</li>')

        pernyataan_html = f'''  <div data-field="pernyataan">
    <table class="matrix-box" border="1" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th>No.</th>
          <th>Statements (Pernyataan)</th>
          <th>True (Benar)</th>
          <th>False (Salah)</th>
        </tr>
      </thead>
      <tbody>
{chr(10).join(tf_rows)}
      </tbody>
    </table>
    <ol style="margin-top: 8px;">
{chr(10).join(ol_items)}
    </ol>
  </div>
  <div data-field="tabel_benar_salah">
    <table class="matrix-box" border="1" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr>
          <th>No.</th>
          <th>Statements (Pernyataan)</th>
          <th>True (Benar)</th>
          <th>False (Salah)</th>
        </tr>
      </thead>
      <tbody>
{chr(10).join(tf_rows)}
      </tbody>
    </table>
  </div>'''

    art = f'''<article data-gemilang-question data-nomor="{num}" data-tipe="{tp}" data-kelas="{kl}" data-mapel="Bahasa Inggris" data-jenjang="{jj}" data-fase="{fase}" data-paket="{paket_name}" data-kesulitan="sedang" data-kunci="{kj}">
  <div data-field="jenjang">{jj}</div>
  <div data-field="kelas">{kl}</div>
  <div data-field="fase">{fase}</div>
  <div data-field="mata_pelajaran">Bahasa Inggris</div>
  <div data-field="materi">{mt}</div>
  <div data-field="tags">Bahasa Inggris, SMP, Kelas 7, Fase D, {ch}, {un}, Kurikulum Merdeka</div>
  <div data-field="capaian_pembelajaran">{cp}</div>
  {bacaan_html}
  {gambar_html}
  <div data-field="teks_soal">{soal_t}</div>
  {opsi_html}
  {pernyataan_html}
  <div data-field="kunci_jawaban">{kj}</div>
  <div data-field="pembahasan">{pb}</div>
</article>'''
    html_articles.append(art)

full_html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Buku Bank Soal Bahasa Inggris SMP Kelas 7 - Kurikulum Merdeka (Fase D)</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; padding: 24px; color: #1e293b; background: #f8fafc; }}
    article {{ background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
    table.matrix-box {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
    table.matrix-box th, table.matrix-box td {{ border: 1px solid #cbd5e1; padding: 8px 12px; font-size: 13px; }}
    table.matrix-box th {{ background: #f1f5f9; font-weight: 600; color: #334155; }}
    ul[data-field="opsi_jawaban"] {{ list-style-type: none; padding-left: 0; }}
    ul[data-field="opsi_jawaban"] li {{ padding: 6px 12px; margin-bottom: 6px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }}
    ul[data-field="opsi_jawaban"] li::before {{ content: attr(data-option) ". "; font-weight: 700; color: #0284c7; margin-right: 6px; }}
  </style>
</head>
<body>
  <header style="margin-bottom: 32px; border-bottom: 2px solid #0284c7; padding-bottom: 16px;">
    <h1 style="color: #0f172a; margin: 0 0 8px 0;">Buku Bank Soal Bahasa Inggris SMP Kelas 7</h1>
    <h3 style="color: #0284c7; margin: 0 0 12px 0;">Kurikulum Merdeka — Fase D (Semester 1 & Semester 2)</h3>
    <p style="color: #64748b; font-size: 14px; margin: 0;">Total 80 Butir Soal Terstandarisasi CP Fase D mencakup 5 Chapter Utama, 15 Unit Pembelajaran, Pilihan Ganda Sederhana, PG Kompleks, dan Tabel Benar/Salah lengkap dengan Gambar Stimulus Visual Asli.</p>
  </header>
{''.join(html_articles)}
</body>
</html>'''

html_out_path = os.path.join(out_dir, 'kelas7_kurikulum_merdeka_lengkap.html')
json_out_path = os.path.join(out_dir, 'kelas7_kurikulum_merdeka_lengkap.json')

with open(html_out_path, 'w', encoding='utf-8') as f:
    f.write(full_html)
print(f"Saved HTML Master: {html_out_path}")

with open(json_out_path, 'w', encoding='utf-8') as f:
    json.dump(ALL_SOAL, f, indent=2, ensure_ascii=False)
print(f"Saved JSON Master: {json_out_path}")

