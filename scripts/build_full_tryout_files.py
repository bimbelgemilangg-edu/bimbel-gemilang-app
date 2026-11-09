# /Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/scripts/build_full_tryout_files.py
import json, base64, os, html, re

OUT_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku'
MAT_IMG_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tka_matematika_paket_a'
BIN_IMG_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tpm_bindo_paket_b'

os.makedirs(OUT_DIR, exist_ok=True)

def b64_img(folder, filename):
    path = os.path.join(folder, filename)
    if not os.path.exists(path):
        return ""
    ext = os.path.splitext(filename)[1].lower().replace('.', '')
    mime = 'image/png' if ext == 'png' else 'image/jpeg'
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f"data:{mime};base64,{data}"

def render_html_article(q):
    attrs = [
        'data-gemilang-question',
        f'data-nomor="{q["nomor"]}"',
        f'data-tipe="{q["tipe"]}"',
        f'data-paket="{html.escape(q["paket"])}"',
        f'data-kesulitan="{q["kesulitan"]}"',
        f'data-kelas="{q["kelas"]}"',
        f'data-mapel="{q["mapel"]}"',
    ]
    if q.get('grup'):
        attrs.append(f'data-grup="{q["grup"]}"')

    lines = [f'<article {" ".join(attrs)}>']
    
    # Metadata fields
    if q.get('materi'):
        lines.append(f'  <div data-field="materi">{html.escape(q["materi"])}</div>')
    if q.get('cp'):
        lines.append(f'  <div data-field="capaian_pembelajaran">{html.escape(q["cp"])}</div>')
    
    # Bacaan / Stimulus
    if q.get('bacaan'):
        bacaan_attrs = 'data-field="bacaan"'
        if q.get('grup'):
            bacaan_attrs += f' data-grup="{q["grup"]}"'
        lines.append(f'  <div {bacaan_attrs}>')
        if q.get('bacaan_judul'):
            lines.append(f'    <h3 style="margin-top:0; color:#0369a1;">{html.escape(q["bacaan_judul"])}</h3>')
        if q.get('bacaan_gambar'):
            bg = q['bacaan_gambar']
            mw = bg.get('max_width', 520)
            data_url_attr = f' data-url="{bg["url"]}"' if bg.get('url') else ''
            lines.append(f'    <div style="text-align:center; margin:14px 0;"><img src="{bg["src"]}"{data_url_attr} alt="{html.escape(bg.get("alt", ""))}" style="max-width:{mw}px; width:100%; height:auto; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 2px 6px rgba(0,0,0,0.06); display:inline-block;" /></div>')
        lines.append(f'    {q["bacaan"]}')
        lines.append('  </div>')

    # Ekstraksi Tabel jika ada di dalam teks_soal agar bersih dan terpisah di <div data-field="tabel_soal">
    raw_teks = q["teks_soal"]
    extracted_table = q.get('tabel_soal')
    if not extracted_table and '<table' in raw_teks:
        m_tbl = re.search(r'<table[\s\S]*?</table>', raw_teks, re.IGNORECASE)
        if m_tbl:
            extracted_table = m_tbl.group(0)
            raw_teks = raw_teks.replace(extracted_table, '').strip()
            raw_teks = re.sub(r'^(<br\s*/?>)+|(<br\s*/?>)+$', '', raw_teks).strip()

    # Teks Soal
    lines.append(f'  <div data-field="teks_soal">{raw_teks}</div>')

    # Tabel Soal (Jika ada)
    if extracted_table:
        lines.append(f'  <div data-field="tabel_soal">\n    {extracted_table}\n  </div>')

    # Gambar Soal
    if q.get('gambar'):
        g = q['gambar']
        mw = g.get('max_width', 400)
        data_url_attr = f' data-url="{g["url"]}"' if g.get('url') else ''
        lines.append('  <div data-field="gambar" style="text-align:center; margin:14px 0;">')
        lines.append(f'    <img src="{g["src"]}"{data_url_attr} alt="{html.escape(g.get("alt", ""))}" style="max-width:{mw}px; width:100%; height:auto; border-radius:8px; border:1px solid #cbd5e1; box-shadow:0 2px 6px rgba(0,0,0,0.06); display:inline-block;" />')
        lines.append('  </div>')

    # Opsi Jawaban (untuk pg_sederhana & pg_kompleks)
    if q.get('opsi'):
        lines.append('  <ol data-field="opsi_jawaban">')
        for opt in q['opsi']:
            lines.append(f'    <li data-option="{opt["label"]}">{opt["teks"]}</li>')
        lines.append('  </ol>')

    # Pernyataan (untuk benar_salah)
    if q.get('pernyataan'):
        lines.append('  <table data-field="pernyataan" border="1" cellpadding="6" style="border-collapse:collapse; width:100%; margin:10px 0;">')
        lines.append('    <thead><tr><th>Pernyataan</th><th style="width:100px; text-align:center;">Jawaban</th></tr></thead>')
        lines.append('    <tbody>')
        for p in q['pernyataan']:
            lines.append(f'      <tr><td>{p["teks"]}</td><td style="text-align:center;"><b>{p["jawaban"]}</b></td></tr>')
        lines.append('    </tbody>')
        lines.append('  </table>')

    # Kunci Jawaban
    lines.append(f'  <meta data-field="kunci_jawaban" data-value="{html.escape(str(q["kunci"]))}" />')
    lines.append('  <meta data-field="kunci_terverifikasi" data-value="true" />')

    # Pembahasan
    lines.append(f'  <div data-field="pembahasan">{q["pembahasan"]}</div>')
    lines.append('</article>\n')
    return '\n'.join(lines)

print("Enhanced HTML Article Renderer with Table Separation Ready")
