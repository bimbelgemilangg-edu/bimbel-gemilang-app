# scripts/bangun_paket_kelas7_lengkap.py
import json
import os
import sys
import base64

repo_dir = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
out_dir = os.path.join(repo_dir, 'public/ekstraksi-buku')
img_dir = os.path.join(repo_dir, 'public/soal/bahasa-inggris')
os.makedirs(out_dir, exist_ok=True)
os.makedirs(img_dir, exist_ok=True)

sys.path.append(os.path.join(repo_dir, 'scripts'))

from ekstrak_bab1_gemilang import soal_list as soal_list_bab1
from data_bab2 import soal_list_bab2
from data_bab5 import soal_list_bab5
from data_eval4 import soal_list_eval4
from data_bab8_16_19 import DATA_BAB8, DATA_BAB16, DATA_BAB19

def to_base64_uri(filename):
    path = os.path.join(img_dir, filename)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        ext = filename.split('.')[-1]
        mime = 'jpeg' if ext in ['jpg', 'jpeg'] else ext
        return f"data:image/{mime};base64,{b64}"
    return f"/soal/bahasa-inggris/{filename}"

# URIs
monita_andre_uri = to_base64_uri('monita_andre_profile.png')
bab5_jadwal_uri = to_base64_uri('bab5_jadwal_7a_7b.png')
bab8_backpacks_uri = to_base64_uri('bab8_backpacks_table.png')
bab19_procedure_uri = to_base64_uri('bab19_procedure_self_watering_pot.jpg')
eval4_nutrition_uri = to_base64_uri('eval4_nutrition_facts_highres.jpg')
eval4_bekantan_uri = to_base64_uri('eval4_bekantan_orangutan.jpg')
eval4_ekskul_uri = to_base64_uri('eval4_ekskul_table.png')

# 10 clock pictures for Bab 5 Soal 1-10
clock_uris = {}
for i in range(1, 11):
    clock_uris[i] = to_base64_uri(f'bab5_clock_soal{i}.png')

# Attach visual stimuli to Bab 1
for s in soal_list_bab1:
    if 20 <= s['nomor'] <= 24:
        s['gambar'] = [monita_andre_uri]
        if s.get('bacaan'):
            s['bacaan']['gambar'] = [monita_andre_uri]
            s['bacaan']['custom_html'] = f'''<p>Compare the two student profile cards below for questions number 20 to 24!</p>
<div class="figure-container"><img src="{monita_andre_uri}" alt="Profile Cards of Monita and Andre" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>
<table border="1" style="border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 0.9em;">
  <thead>
    <tr style="background-color: #2b3a4a; color: white;">
      <th style="padding: 6px 10px;">Profile</th>
      <th style="padding: 6px 10px;">STUDENT 1: MONITA</th>
      <th style="padding: 6px 10px;">STUDENT 2: ANDRE</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 6px 10px; font-weight: bold;">Origin / Age</td>
      <td style="padding: 6px 10px;">Pontianak / 13 years old</td>
      <td style="padding: 6px 10px;">Surabaya / 13 years old</td>
    </tr>
    <tr>
      <td style="padding: 6px 10px; font-weight: bold;">Hobbies</td>
      <td style="padding: 6px 10px;">Reading digital comics &amp; swimming</td>
      <td style="padding: 6px 10px;">Playing badminton &amp; coding games</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 6px 10px; font-weight: bold;">Siblings</td>
      <td style="padding: 6px 10px;">1 older sister</td>
      <td style="padding: 6px 10px;">Only child (no brothers or sisters)</td>
    </tr>
  </tbody>
</table>'''

# Attach visual stimuli to Bab 5
for s in soal_list_bab5:
    num = s['nomor']
    if 1 <= num <= 10:
        s['gambar'] = [clock_uris[num]]
    elif 31 <= num <= 35:
        s['gambar'] = [bab5_jadwal_uri]
        if s.get('bacaan'):
            s['bacaan']['gambar'] = [bab5_jadwal_uri]
            s['bacaan']['custom_html'] = f'''<p>Compare the Wednesday Morning Schedule of Class 7A and Class 7B below for questions number 31 to 35!</p>
<div class="figure-container"><img src="{bab5_jadwal_uri}" alt="Wednesday Morning Schedule Class 7A and 7B" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>
<table border="1" style="border-collapse: collapse; width: 100%; margin-top: 8px; font-size: 0.9em;">
  <thead>
    <tr style="background-color: #2b3a4a; color: white;">
      <th style="padding: 6px 10px;">Time</th>
      <th style="padding: 6px 10px;">CLASS 7A (WEDNESDAY)</th>
      <th style="padding: 6px 10px;">CLASS 7B (WEDNESDAY)</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 6px 10px; font-weight: bold;">07.15 – 08.35</td>
      <td style="padding: 6px 10px;">English (with Mr. Rahmat)</td>
      <td style="padding: 6px 10px;">Mathematics (with Mrs. Tari)</td>
    </tr>
    <tr>
      <td style="padding: 6px 10px; font-weight: bold;">08.35 – 09.55</td>
      <td style="padding: 6px 10px;">Natural Science (Lab 1)</td>
      <td style="padding: 6px 10px;">English (with Mr. Rahmat)</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <td style="padding: 6px 10px; font-weight: bold;">09.55 – 10.15</td>
      <td style="padding: 6px 10px;"><em>First Break (20 minutes)</em></td>
      <td style="padding: 6px 10px;"><em>First Break (20 minutes)</em></td>
    </tr>
    <tr>
      <td style="padding: 6px 10px; font-weight: bold;">10.15 – 11.35</td>
      <td style="padding: 6px 10px;">Social Studies</td>
      <td style="padding: 6px 10px;">Natural Science (Lab 1)</td>
    </tr>
  </tbody>
</table>'''

# Attach visual stimuli to Bab 8
for s in DATA_BAB8:
    s['gambar'] = [bab8_backpacks_uri]
    if s.get('bacaan'):
        s['bacaan']['gambar'] = [bab8_backpacks_uri]
        s['bacaan']['custom_html'] = f'''<p>Study the comparison table of three student backpacks below and answer questions number 31 to 35!</p>
<div class="figure-container"><img src="{bab8_backpacks_uri}" alt="Comparison Table of Three Backpacks" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>
<table class="matrix-box" border="1" style="border-collapse: collapse; width: 100%; text-align: left;">
  <thead>
    <tr style="background-color: #f1f5f9;">
      <th style="padding: 6px;">Specification</th>
      <th style="padding: 6px;">AERO BAG</th>
      <th style="padding: 6px;">TERRA PACK</th>
      <th style="padding: 6px;">NOVA TOTE</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Price</td>
      <td style="padding: 6px;">Rp185.000</td>
      <td style="padding: 6px;">Rp240.000</td>
      <td style="padding: 6px;">Rp150.000</td>
    </tr>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Weight</td>
      <td style="padding: 6px;">450 grams</td>
      <td style="padding: 6px;">700 grams</td>
      <td style="padding: 6px;">450 grams</td>
    </tr>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Capacity (Books)</td>
      <td style="padding: 6px;">8 thick books</td>
      <td style="padding: 6px;">12 thick books</td>
      <td style="padding: 6px;">5 thick books</td>
    </tr>
    <tr>
      <td style="padding: 6px; font-weight: bold;">Waterproof Rating</td>
      <td style="padding: 6px;">Water-resistant</td>
      <td style="padding: 6px;">100% Waterproof</td>
      <td style="padding: 6px;">Not waterproof</td>
    </tr>
  </tbody>
</table>'''

# Attach visual stimuli to Bab 19
for s in DATA_BAB19:
    s['gambar'] = [bab19_procedure_uri]
    if s.get('bacaan'):
        s['bacaan']['gambar'] = [bab19_procedure_uri]
        s['bacaan']['custom_html'] = f'''<p>Study the 4-step visual procedure guide below and answer questions number 51 to 55!</p>
<div class="figure-container"><img src="{bab19_procedure_uri}" alt="4-Step Visual Procedure Guide: Self-Watering Pot" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>
<p><strong>How to Make a Self-Watering Plant Pot from a Used Plastic Bottle</strong></p>
<p><strong>Materials:</strong> A 1.5-liter used plastic bottle, a cutter/scissors, a nail, a thick cotton string (20 cm), water, soil, and a small plant seedling.</p>
<p><strong>Steps:</strong><br/>
1. <strong>Step 1:</strong> Cut the plastic bottle in half using a cutter and scissors so you have a bottom part and a top part.<br/>
2. <strong>Step 2:</strong> Make a small hole in the bottle cap using a nail, then thread the cotton string through the hole.<br/>
3. <strong>Step 3:</strong> Fill the bottom half of the bottle with water, then place the top half upside down (inverted) into the bottom half so the cotton string touches the water.<br/>
4. <strong>Step 4:</strong> Put fertile soil into the inverted top half using a small trowel and plant your seedling. The cotton string will absorb water up into the soil automatically!</p>'''

# Attach visual stimuli to Evaluasi 4
for s in soal_list_eval4:
    num = s['nomor']
    if 1 <= num <= 6:
        s['gambar'] = [eval4_nutrition_uri]
        if s.get('bacaan'):
            s['bacaan']['gambar'] = [eval4_nutrition_uri]
            s['bacaan']['custom_html'] = f'''<p>Observe and compare the two Nutrition Facts labels below for questions number 1 to 6!</p>
<div class="figure-container"><img src="{eval4_nutrition_uri}" alt="Nutrition Facts Comparison: Fresh Oat Milk vs Choco Malt" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>'''
    elif 7 <= num <= 13:
        s['gambar'] = [eval4_bekantan_uri]
        if s.get('bacaan'):
            s['bacaan']['gambar'] = [eval4_bekantan_uri]
            s['bacaan']['custom_html'] = f'''<p>Compare the two Report Texts and wildlife illustration below for questions number 7 to 13!</p>
<div class="figure-container"><img src="{eval4_bekantan_uri}" alt="Bekantan in Mangrove vs Orangutan in Rainforest" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>'''
    elif 14 <= num <= 19:
        s['gambar'] = [eval4_ekskul_uri]
        if s.get('bacaan'):
            s['bacaan']['gambar'] = [eval4_ekskul_uri]
            s['bacaan']['custom_html'] = f'''<p>Study the School Extracurricular Comparison Table and Student Chat below for questions number 14 to 19!</p>
<div class="figure-container"><img src="{eval4_ekskul_uri}" alt="School Extracurricular Comparison Table" style="max-width:100%; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.12); margin:8px 0;"/></div>'''

def normalize_soal_dict(s, paket_nama, cp_default):
    num = s['nomor']
    tp = s.get('tipe', 'pg_sederhana')
    jj = s.get('jenjang', 'SMP')
    kl = s.get('kelas') or s.get('tingkatKelas', '7')
    mt = s.get('materi', 'Bahasa Inggris')
    soal_t = s.get('teks_soal') or s.get('soal', '')
    kj = s.get('kunci_jawaban') or s.get('kunci', '')
    pb = s.get('pembahasan', '')
    cp = s.get('capaian_pembelajaran', cp_default)
    opsi_raw = s.get('opsi_jawaban') or s.get('opsi', [])
    opsi_jawaban = [{'label': o.get('label', ''), 'teks': o.get('teks', '')} for o in opsi_raw]
    
    return {
        'nomor': num,
        'tipe': tp,
        'kelas': kl,
        'tingkatKelas': kl,
        'jenjang': jj,
        'fase': 'D',
        'mapel': 'Bahasa Inggris',
        'paket': paket_nama,
        'materi': mt,
        'kesulitan': s.get('kesulitan', 'sedang'),
        'kunci_jawaban': kj,
        'kunci': kj,
        'teks_soal': soal_t,
        'soal': soal_t,
        'opsi_jawaban': opsi_jawaban,
        'opsi': opsi_jawaban,
        'pernyataan': s.get('pernyataan', []),
        'pembahasan': pb,
        'capaian_pembelajaran': cp,
        'bacaan': s.get('bacaan'),
        'gambar': s.get('gambar', [])
    }

def generate_article(s, paket_nama, cp_default):
    norm = normalize_soal_dict(s, paket_nama, cp_default)
    num = norm['nomor']
    tp = norm['tipe']
    jj = norm['jenjang']
    kl = norm['kelas']
    mt = norm['materi']
    soal_t = norm['teks_soal']
    kj = norm['kunci_jawaban']
    pb = norm['pembahasan']
    cp = norm['capaian_pembelajaran']

    bacaan_html = ''
    if norm.get('bacaan'):
        grp = norm['bacaan'].get('grup', '')
        if norm['bacaan'].get('custom_html'):
            bacaan_html = f'<div data-field="bacaan" data-grup="{grp}">{norm["bacaan"]["custom_html"]}</div>'
        else:
            b_txt = norm['bacaan'].get('teks', '')
            if b_txt.startswith('<p') or b_txt.startswith('<table') or '<div' in b_txt:
                bacaan_html = f'<div data-field="bacaan" data-grup="{grp}">{b_txt}</div>'
            else:
                paragraphs = b_txt.split('\n\n')
                p_html = ''.join([f'<p>{p.replace(chr(10), "<br/>")}</p>' for p in paragraphs if p.strip()])
                bacaan_html = f'<div data-field="bacaan" data-grup="{grp}">{p_html}</div>'

    # ALWAYS output data-field="gambar" if image exists so parser populates q.gambar
    gambar_html = ''
    if norm.get('gambar'):
        imgs = ''.join([f'<img src="{g}" alt="Gambar Stimulus Soal {num}" />' for g in norm['gambar']])
        gambar_html = f'<div data-field="gambar">{imgs}</div>'

    opsi_html = ''
    if norm.get('opsi_jawaban'):
        items = []
        for o in norm['opsi_jawaban']:
            lbl = o.get('label', '')
            items.append(f'<li data-option="{lbl}">{o["teks"]}</li>')
        opsi_html = f'<ul data-field="opsi_jawaban">{"".join(items)}</ul>'

    pernyataan_html = ''
    if norm.get('pernyataan'):
        tf_rows = []
        ol_items = []
        for i, p in enumerate(norm['pernyataan']):
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

    return f'''<article data-gemilang-question data-nomor="{num}" data-tipe="{tp}" data-kelas="{kl}" data-mapel="Bahasa Inggris" data-jenjang="{jj}" data-fase="D" data-paket="{paket_nama}" data-kesulitan="sedang" data-kunci="{kj}">
  <div data-field="jenjang">{jj}</div>
  <div data-field="kelas">{kl}</div>
  <div data-field="fase">D</div>
  <div data-field="mata_pelajaran">Bahasa Inggris</div>
  <div data-field="materi">{mt}</div>
  <div data-field="tags">Bahasa Inggris, SMP, Kelas 7, Fase D, {mt}, Kurikulum Merdeka</div>
  <div data-field="capaian_pembelajaran">{cp}</div>
  {bacaan_html}
  {gambar_html}
  <div data-field="teks_soal">{soal_t}</div>
  {opsi_html}
  {pernyataan_html}
  <div data-field="kunci_jawaban">{kj}</div>
  <div data-field="pembahasan">{pb}</div>
</article>'''

def build_package(raw_soal_list, filename_prefix, title, paket_nama, cp):
    normalized_list = [normalize_soal_dict(s, paket_nama, cp) for s in raw_soal_list]
    articles = [generate_article(s, paket_nama, cp) for s in normalized_list]
    full_html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{title}</title>
</head>
<body>
{''.join(articles)}
</body>
</html>'''

    html_file = os.path.join(out_dir, f'{filename_prefix}.html')
    json_file = os.path.join(out_dir, f'{filename_prefix}.json')

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(full_html)
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(normalized_list, f, indent=2, ensure_ascii=False)
    
    img_count = sum(1 for s in normalized_list if len(s.get('gambar', [])) > 0)
    print(f'Package [{paket_nama}]: {len(normalized_list)} soal ({img_count} bergambar) -> {html_file}')
    return articles, normalized_list

# 1. Bab 1
art1, norm1 = build_package(
    soal_list_bab1,
    'kelas7_bab1_greeting_introducing',
    'Gemilang - Bahasa Inggris Kelas 7 Bab 1 Greeting & Introducing',
    'Paket Bab 1 - Greeting & Introducing',
    'Mengidentifikasi dan menggunakan ungkapan sapaan, perkenalan diri, dan berpamitan dalam konteks interaksi sosial resmi dan kasual sesuai CP Fase D.'
)

# Salin juga ke bab1_greeting_introducing.* lama agar backward-compatible
with open(os.path.join(out_dir, 'bab1_greeting_introducing.html'), 'w', encoding='utf-8') as f:
    with open(os.path.join(out_dir, 'kelas7_bab1_greeting_introducing.html'), 'r', encoding='utf-8') as f_src:
        f.write(f_src.read())
with open(os.path.join(out_dir, 'bab1_greeting_introducing.json'), 'w', encoding='utf-8') as f:
    json.dump(norm1, f, indent=2, ensure_ascii=False)

# 2. Bab 2
art2, norm2 = build_package(
    soal_list_bab2,
    'kelas7_bab2_gratitude_apology',
    'Gemilang - Bahasa Inggris Kelas 7 Bab 2 Gratitude, Apologizing, Wish & Hope',
    'Paket Bab 2 - Gratitude & Apology',
    'Menggunakan ungkapan terima kasih, permohonan maaf, serta harapan/doa (wish & hope) dalam interaksi interpersonal sesuai konteks budaya kesantunan berbahasa.'
)

# 3. Bab 5
art5, norm5 = build_package(
    soal_list_bab5,
    'kelas7_bab5_time_days',
    'Gemilang - Bahasa Inggris Kelas 7 Bab 5 Telling the Time and Days',
    'Paket Bab 5 - Telling Time & Days',
    'Menyatakan dan menanyakan waktu (jam), hari, tanggal, bulan, serta jadwal kegiatan sekolah menggunakan preposisi waktu (at, on, in) dan angka ordinal/kardinal.'
)

# 4. Bab 8
art8, norm8 = build_package(
    DATA_BAB8,
    'kelas7_bab8_noun_comparison',
    'Gemilang - Bahasa Inggris Kelas 7 Bab 8 Noun & Degrees of Comparison',
    'Paket Bab 8 - Noun & Comparison',
    'Mengidentifikasi bentuk kata benda jamak beraturan dan tidak beraturan serta membandingkan karakteristik benda (degrees of comparison: comparative, superlative) sesuai konteks.'
)

# 5. Bab 16
art16, norm16 = build_package(
    DATA_BAB16,
    'kelas7_bab16_descriptive_text',
    'Gemilang - Bahasa Inggris Kelas 7 Bab 16 Descriptive Text (Cultural Heritage)',
    'Paket Bab 16 - Descriptive Text',
    'Menganalisis teks deskriptif mengenai bangunan bersejarah dan cagar budaya, mengenali frasa kata benda deskriptif dan struktur identification serta description.'
)

# 6. Bab 19
art19, norm19 = build_package(
    DATA_BAB19,
    'kelas7_bab19_procedure_text',
    'Gemilang - Bahasa Inggris Kelas 7 Bab 19 Procedure Text (Visual & Multimodal)',
    'Paket Bab 19 - Procedure Text',
    'Memahami tujuan komunikatif, bahan, alat, dan langkah-langkah kerja dalam teks petunjuk prosedur multimodal membuat karya daur ulang praktis.'
)

# 7. Evaluasi 4 (Asesmen Nasional AKM CP Terbaru)
art_eval4, norm_eval4 = build_package(
    soal_list_eval4,
    'kelas7_ujian_evaluasi4_akm',
    'Gemilang - Bahasa Inggris Kelas 7 Paket Evaluasi 4 (Asesmen Nasional CP Terbaru)',
    'Paket Ujian Evaluasi 4 - AKM CP Terbaru',
    'Menganalisis teks multimodal, label nutrisi, jadwal ekskul, dan membandingkan dua teks (recount vs procedure, report, narrative) standar asesmen nasional Fase D.'
)

# 8. Combined Master Package (Seluruh Paket Kelas 7 Lengkap)
all_articles = art1 + art2 + art5 + art8 + art16 + art19 + art_eval4
master_html = f'''<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Gemilang - Bank Soal Lengkap Bahasa Inggris SMP Kelas 7 (Fase D)</title>
</head>
<body>
{''.join(all_articles)}
</body>
</html>'''

master_html_file = os.path.join(out_dir, 'kelas7_semua_paket_lengkap.html')
master_json_file = os.path.join(out_dir, 'kelas7_semua_paket_lengkap.json')

with open(master_html_file, 'w', encoding='utf-8') as f:
    f.write(master_html)

all_soal_json = norm1 + norm2 + norm5 + norm8 + norm16 + norm19 + norm_eval4
with open(master_json_file, 'w', encoding='utf-8') as f:
    json.dump(all_soal_json, f, indent=2, ensure_ascii=False)

total_bergambar = sum(1 for s in all_soal_json if len(s.get('gambar', [])) > 0)
print(f'\n=== MASTER PACKAGE COMPILED SUCCESSFULLY ===')
print(f'Total butir soal Kelas 7 terkompilasi: {len(all_soal_json)} butir!')
print(f'Total butir soal dengan gambar visual: {total_bergambar} butir!')
print(f'HTML Master: {master_html_file}')
print(f'JSON Master: {master_json_file}')
