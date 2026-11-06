#!/usr/bin/env python3
"""
Build Complete Kurikulum Merdeka 125 HOTS Question Bank for SMP Kelas 7
(5 Chapters, 15 Units, All Authentic Stimuli & High-Res Images)
Output:
- public/ekstraksi-buku/kelas7_kurikulum_merdeka_125soal_lengkap.html
- public/ekstraksi-buku/kelas7_kurikulum_merdeka_125soal_lengkap.json
- public/ekstraksi-buku/kelas7_ch1_about_me.html
- public/ekstraksi-buku/kelas7_ch2_culinary_and_me.html
- public/ekstraksi-buku/kelas7_ch3_home_sweet_home.html
- public/ekstraksi-buku/kelas7_ch4_my_school_activities.html
- public/ekstraksi-buku/kelas7_ch5_this_is_my_school.html
"""

import os
import re
import json
import base64
import html

BASE_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app"
SCRATCH_DIR = "/Users/macbook/.gemini/antigravity/brain/460bd5e4-284f-4570-9402-00482ffa2a82/scratch"
IMG_DIR = os.path.join(BASE_DIR, "public/soal/bahasa-inggris")
OUT_DIR = os.path.join(BASE_DIR, "public/ekstraksi-buku")
os.makedirs(OUT_DIR, exist_ok=True)

# Cache images in base64
IMAGE_CACHE = {}

def get_image_data(filename):
    if filename in IMAGE_CACHE:
        return IMAGE_CACHE[filename]
    path = os.path.join(IMG_DIR, filename)
    if not os.path.exists(path):
        print(f"WARNING: Image not found {path}")
        return "", ""
    mime = "image/png" if filename.lower().endswith(".png") else "image/jpeg"
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("utf-8")
    data_uri = f"data:{mime};base64,{b64}"
    url_path = f"/soal/bahasa-inggris/{filename}"
    IMAGE_CACHE[filename] = (data_uri, url_path)
    return data_uri, url_path

# CHAPTER METADATA
CHAPTER_CONFIG = {
    1: {
        "title": "Chapter 1: About Me",
        "materi": "About Me: Greetings, Introducing Oneself & Others, Daily Hobbies & Descriptive Profile",
        "capaian": "Peserta didik mampu memahami dan memproduksi teks interpersonal dan deskriptif lisan/tulis sederhana tentang perkenalan diri, hobi, dan deskripsi teman sebaya menggunakan to be, pronoun, possessive adjectives, dan Simple Present Tense.",
        "units": {
            (1, 4): "Chapter 1: About Me - Unit 1: Galang from Kalimantan",
            (5, 8): "Chapter 1: About Me - Unit 2: I Love Fishing & Unit 3: My Friends and I",
            (9, 14): "Chapter 1: About Me - Unit 1: Galang from Kalimantan & Unit 2: I Love Fishing",
            (15, 25): "Chapter 1: About Me - Unit 3: My Friends and I",
        },
        "images": {
            (1, 4): "kmerdeka_ch1_about_me_banner.jpg",
            (5, 8): "monita_andre_profile.png",
            (9, 14): "kmerdeka_ch1_fishing_hobby.jpg",
            (15, 25): "kmerdeka_ch1_about_me_banner.jpg",
        }
    },
    2: {
        "title": "Chapter 2: Culinary and Me",
        "materi": "Culinary and Me: Indonesian Traditional Foods, Snacks, Shopping Lists, Nutrition Labels & Cooking Procedures",
        "capaian": "Peserta didik mampu mengidentifikasi dan memproduksi teks deskriptif serta prosedur mengenai makanan, minuman, resep, dan alat dapur menggunakan countable/uncountable nouns, quantifiers, dan imperative verbs.",
        "units": {
            (1, 4): "Chapter 2: Culinary and Me - Unit 1: My Favorite Food",
            (5, 8): "Chapter 2: Culinary and Me - Unit 3: A Secret Recipe",
            (9, 16): "Chapter 2: Culinary and Me - Unit 2: My Favorite Snack",
            (17, 25): "Chapter 2: Culinary and Me - Unit 3: A Secret Recipe",
        },
        "images": {
            (1, 4): "kmerdeka_ch2_culinary_banner.jpg",
            (5, 8): "kmerdeka_ch2_culinary_banner.jpg",
            (9, 16): "eval4_nutrition_facts_highres.jpg",
            (17, 25): "kmerdeka_ch2_culinary_banner.jpg",
        }
    },
    3: {
        "title": "Chapter 3: Home Sweet Home",
        "materi": "Home Sweet Home: Rooms in the House, Household Objects, Family Chores & Waste Sorting Procedures",
        "capaian": "Peserta didik mampu mendeskripsikan ruangan di rumah, denah arsitektur, tugas kebersihan sehari-hari, dan prosedur pemilahan sampah menggunakan there is/are, prepositions of place, dan imperative commands.",
        "units": {
            (1, 4): "Chapter 3: Home Sweet Home - Unit 1: My House",
            (5, 8): "Chapter 3: Home Sweet Home - Unit 2: My House Chores",
            (9, 16): "Chapter 3: Home Sweet Home - Unit 1: My House & Unit 2: My House Chores",
            (17, 25): "Chapter 3: Home Sweet Home - Unit 3: Let’s Clean Up!",
        },
        "images": {
            (1, 4): "kmerdeka_ch3_house_architecture.jpg",
            (5, 8): "kmerdeka_ch3_home_sweet_home.jpg",
            (9, 16): "kmerdeka_ch3_home_sweet_home.jpg",
            (17, 25): "bab19_procedure_self_watering_pot.jpg",
        }
    },
    4: {
        "title": "Chapter 4: My School Activities",
        "materi": "My School Activities: School Timetables, Online Classes, Study Habits, Modals & Telling Time",
        "capaian": "Peserta didik mampu menyatakan jadwal pelajaran, waktu/jam, interaksi kelas tatap muka & daring, serta kebiasaan belajar menggunakan telling the time, adverbs of frequency, dan modal auxiliaries.",
        "units": {
            (1, 4): "Chapter 4: My School Activities - Unit 1: My Class Schedule",
            (5, 8): "Chapter 4: My School Activities - Unit 3: My Study Habits",
            (9, 16): "Chapter 4: My School Activities - Unit 2: My Online Class",
            (17, 25): "Chapter 4: My School Activities - Unit 3: My Study Habits",
        },
        "images": {
            (1, 4): "bab5_jadwal_7a_7b.png",
            (5, 8): "kmerdeka_ch4_school_activities.jpg",
            (9, 16): "bab5_jadwal_7a_7b.png",
            (17, 25): "kmerdeka_ch4_school_activities.jpg",
        }
    },
    5: {
        "title": "Chapter 5: This is My School",
        "materi": "This is My School: School Buildings, Directions, Extracurricular Activities & School Festivals",
        "capaian": "Peserta didik mampu menunjukkan arah dan lokasi fasilitas sekolah pada peta isometrik, memahami pengumuman/poster kegiatan ekstrakurikuler, dan teks deskripsi pentas seni sekolah.",
        "units": {
            (1, 4): "Chapter 5: This is My School - Unit 2: Extracurricular Activities",
            (5, 8): "Chapter 5: This is My School - Unit 3: School Festival",
            (9, 16): "Chapter 5: This is My School - Unit 1: School Buildings",
            (17, 25): "Chapter 5: This is My School - Unit 2: Extracurricular Activities & Unit 3: School Festival",
        },
        "images": {
            (1, 4): "eval4_ekskul_table.png",
            (5, 8): "bab21_school_festival_posters.jpg",
            (9, 16): "kmerdeka_ch5_campus_isometric_map.jpg",
            (17, 25): "kmerdeka_ch5_my_school.jpg",
        }
    }
}

def parse_chapter(ch_num):
    filepath = os.path.join(SCRATCH_DIR, f"chapter_{ch_num}_raw.txt")
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    idx = text.find("Direction: Choose the best answer")
    content = text[idx:] if idx != -1 else text
    parts = re.split(r"KUNCI JAWABAN & PEMBAHASAN.*?:", content)
    main_text = parts[0]
    kunci_text = parts[1] if len(parts) > 1 else ""

    # Parse answer keys
    keys_dict = {}
    for m in re.finditer(r"(?:^|[•\n])\s*(\d+)\.\s+([^•\n]+)", kunci_text):
        num = int(m.group(1))
        keys_dict[num] = m.group(2).strip()

    lines = main_text.split("\n")

    # Find line where question numbers 1..25 appear
    q_indices = []
    for i, line in enumerate(lines):
        m = re.match(r"^(\d+)\.\s+", line)
        if m:
            num = int(m.group(1))
            if 1 <= num <= 25:
                next_text = "\n".join(lines[i+1:i+30])
                if re.search(r"\n(?:[A-D]\.|\□\s*[A-D]\.|\(a\)\s+)", next_text):
                    q_indices.append((num, i))

    seq = []
    expected = 1
    for num, i in q_indices:
        if num == expected:
            seq.append((num, i))
            expected += 1
            if expected > 25:
                break

    # Determine Stimulus Blocks:
    # Pre-Q1 stimulus (from beginning to Q1 line)
    stim1 = "\n".join(lines[:seq[0][1]]).strip()
    stim1 = re.sub(r"^Direction: Choose the best answer[^\n]*\n", "", stim1, flags=re.I).strip()

    # Stimuli between questions:
    # We will slice chunks between seq[k] and seq[k+1]
    parsed_questions = []

    # Map stimuli per question range
    stimulus_map = {
        (1, 4): stim1,
        (5, 8): "",
        (9, 16): "",
        (17, 25): "",
    }

    # Extract stimuli after Q4, Q8, Q16
    for k in range(len(seq)):
        num, start_idx = seq[k]
        end_idx = seq[k+1][1] if k + 1 < len(seq) else len(lines)
        chunk = "\n".join(lines[start_idx:end_idx]).strip()

        # Check if this chunk contains a stimulus for the subsequent question
        stim_match = re.search(r"\n(?=(?:Compare|Read|Study|Observe|Look at|This dialogue)\b.*?\bfor questions? number\b)", chunk, re.I)
        if stim_match:
            stim_body = chunk[stim_match.start():].strip()
            # Clean page markers
            stim_body = re.sub(r"--- Page \d+ ---", "", stim_body).strip()
            if num == 4:
                stimulus_map[(5, 8)] = stim_body
            elif num == 8 or (ch_num == 1 and num == 8):
                stimulus_map[(9, 16)] = stim_body
            elif num == 16 or (ch_num == 1 and num == 14):
                stimulus_map[(17, 25)] = stim_body

    # Fallback if stimulus not caught by regex for specific chapter
    if ch_num == 1 and not stimulus_map[(17, 25)]:
        # In Ch1, stimulus is between Q14 and Q15
        i14 = [s[1] for s in seq if s[0] == 14][0]
        i15 = [s[1] for s in seq if s[0] == 15][0]
        chunk14 = "\n".join(lines[i14:i15])
        sm = re.search(r"\n(?=Read the Descriptive Text and Interpersonal Dialogue)", chunk14)
        if sm:
            stimulus_map[(15, 25)] = chunk14[sm.start():].strip()
            stimulus_map[(17, 25)] = stimulus_map[(15, 25)]

    # Now parse each of the 25 questions
    for k in range(len(seq)):
        num, start_idx = seq[k]
        end_idx = seq[k+1][1] if k + 1 < len(seq) else len(lines)
        chunk = "\n".join(lines[start_idx:end_idx]).strip()

        # Remove trailing stimulus if present
        stim_match = re.search(r"\n(?=(?:Compare|Read|Study|Observe|Look at|This dialogue)\b.*?\bfor questions? number\b)", chunk, re.I)
        if stim_match:
            chunk = chunk[:stim_match.start()].strip()

        if ch_num == 1 and num == 14:
            sm = re.search(r"\n(?=Read the Descriptive Text and Interpersonal Dialogue)", chunk)
            if sm:
                chunk = chunk[:sm.start()].strip()

        chunk = re.sub(r"--- Page \d+ ---", "", chunk).strip()

        k_raw = keys_dict.get(num, "")

        is_tf = ("benar / salah" in chunk.lower() or "true or false" in chunk.lower() or 
                 (bool(re.search(r"\([a-c]\)\s+", chunk)) and ("(a) true" in k_raw.lower() or "(a) false" in k_raw.lower())))
        is_complex = bool(re.search(r"Pilihan Ganda Kompleks|Pilih DUA|□\s*[A-D]\.", chunk, re.I))

        tipe = "benar_salah" if is_tf else ("pg_kompleks" if is_complex else "pg_sederhana")

        opsi = []
        pernyataan = []
        key_val = ""
        pembahasan = ""

        if tipe == "benar_salah":
            # True/False statement extraction
            stmt_matches = re.findall(r"\(([a-c])\)\s+(.*?)(?=\n\(([a-c])\)|\n□|\Z)", chunk, re.DOTALL)
            tf_dict = {}
            for sm in re.finditer(r"\(([a-c])\)\s*([A-Za-z]+)", k_raw):
                tf_dict[sm.group(1)] = "Benar" if "true" in sm.group(2).lower() else "Salah"

            for ltr, stmt_t, _ in stmt_matches:
                st = re.sub(r"[\n\r]+", " ", stmt_t).strip()
                st = re.sub(r"[□✓\s]+$", "", st).strip()
                ans_code = tf_dict.get(ltr, "Benar")
                pernyataan.append({"label": f"({ltr})", "teks": st, "jawaban": ans_code})

            key_val = ", ".join(p["jawaban"] for p in pernyataan)
            pembahasan = k_raw

            prompt_m = re.search(r"^\d+\.\s+(.*?)(?=\nNo\.|\nStatements|\n\([a-c]\))", chunk, re.DOTALL)
            soal_text = prompt_m.group(1).strip() if prompt_m else chunk.split("\n")[0]
        else:
            # Multiple Choice (Simple or Complex)
            opt_matches = re.findall(r"(?:□\s*|\b)([A-D])\.\s+(.*?)(?=\n(?:□\s*|\b)[A-D]\.|\Z)", chunk, re.DOTALL)
            for lbl, opt_t in opt_matches:
                ot = re.sub(r"[\n\r]+", " ", opt_t).strip()
                opsi.append({"label": lbl, "teks": ot})

            km = re.match(r"^([A-D](?:,\s*[A-D])?)(?:\s*\((.*?)\))?", k_raw)
            if km:
                key_val = km.group(1).strip()
                pembahasan = km.group(2).strip() if km.group(2) else k_raw
            else:
                key_val = k_raw[:5].strip()
                pembahasan = k_raw

            prompt_m = re.search(r"^\d+\.\s+(.*?)(?=\n(?:□\s*|\b)[A-D]\.)", chunk, re.DOTALL)
            soal_text = prompt_m.group(1).strip() if prompt_m else chunk.split("\n")[0]

        soal_text = re.sub(r"[\n\r]+", " ", soal_text).strip()
        # Clean question prompt tags like "[HOTS]" or "[Tata Bahasa ...]"
        # Preserve them as part of prompt or clean tag
        soal_text = re.sub(r"\s+", " ", soal_text).strip()

        # Find matching unit and image for this question number
        cfg = CHAPTER_CONFIG[ch_num]
        q_unit = ""
        q_img_file = ""
        for (q_start, q_end), u_name in cfg["units"].items():
            if q_start <= num <= q_end:
                q_unit = u_name
                break
        for (q_start, q_end), img_name in cfg["images"].items():
            if q_start <= num <= q_end:
                q_img_file = img_name
                break

        # Find corresponding stimulus text
        stim_text = ""
        for (q_start, q_end), s_text in stimulus_map.items():
            if q_start <= num <= q_end and s_text:
                stim_text = s_text
                break
        if not stim_text:
            # Fallback to stim1
            stim_text = stimulus_map.get((1, 4), "")

        parsed_questions.append({
            "nomor": num,
            "chapter": ch_num,
            "paket": q_unit,
            "tipe": tipe,
            "materi": cfg["materi"],
            "capaian": cfg["capaian"],
            "stimulus": stim_text,
            "gambar_file": q_img_file,
            "teks_soal": soal_text,
            "opsi_jawaban": opsi,
            "pernyataan": pernyataan,
            "kunci_jawaban": key_val,
            "pembahasan": pembahasan
        })

    return parsed_questions

def generate_article_html(q, global_num):
    data_uri, url_path = get_image_data(q["gambar_file"])
    
    # Escape texts
    teks_soal_esc = html.escape(q["teks_soal"])
    materi_esc = html.escape(q["materi"])
    capaian_esc = html.escape(q["capaian"])
    pembahasan_esc = html.escape(q["pembahasan"])
    kunci_esc = html.escape(q["kunci_jawaban"])
    paket_esc = html.escape(q["paket"])
    stimulus_esc = html.escape(q["stimulus"]).replace("\n", "<br/>\n")

    lines = [
        f'<article data-gemilang-question',
        f'  data-nomor="{global_num}"',
        f'  data-tipe="{q["tipe"]}"',
        f'  data-kelas="7"',
        f'  data-mapel="Bahasa Inggris"',
        f'  data-jenjang="SMP"',
        f'  data-fase="D"',
        f'  data-paket="{paket_esc}"',
        f'  data-kualitas="Sangat Baik">',
        f'  <div data-field="materi">{materi_esc}</div>',
        f'  <div data-field="capaian_pembelajaran">{capaian_esc}</div>',
        f'  <div data-field="tags">hots, kurikulum-merdeka, fase-d, kelas-7, bahasa-inggris</div>',
        f'  <div data-field="bacaan">',
        f'    <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13.5px; border-left: 4px solid #0284c7; margin-bottom: 12px;">',
        f'      <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Authentic Stimulus (Reading Text / Dialogue / Table):</strong>',
        f'      {stimulus_esc}',
        f'    </div>',
        f'  </div>',
        f'  <div data-field="gambar">',
        f'    <img src="{data_uri}" data-url="{url_path}" alt="Visual Stimulus {q["gambar_file"]}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; border: 1px solid #cbd5e1;" />',
        f'  </div>',
        f'  <div data-field="teks_soal">',
        f'    <p><strong>Soal #{global_num} ({q["tipe"].replace("_", " ").upper()}):</strong> {teks_soal_esc}</p>',
        f'  </div>'
    ]

    if q["tipe"] in ["pg_sederhana", "pg_kompleks"]:
        lines.append('  <ul data-field="opsi_jawaban">')
        for opt in q["opsi_jawaban"]:
            lines.append(f'    <li data-option="{opt["label"]}">{html.escape(opt["teks"])}</li>')
        lines.append('  </ul>')
    elif q["tipe"] == "benar_salah":
        # Matrix table and statement list
        lines.append('  <div data-field="pernyataan">')
        lines.append('    <table class="matrix-box">')
        lines.append('      <thead>')
        lines.append('        <tr>')
        lines.append('          <th style="text-align: left;">Pernyataan</th>')
        lines.append('          <th style="width: 80px; text-align: center;">Benar</th>')
        lines.append('          <th style="width: 80px; text-align: center;">Salah</th>')
        lines.append('        </tr>')
        lines.append('      </thead>')
        lines.append('      <tbody>')
        for p in q["pernyataan"]:
            b_mark = "✓" if p["jawaban"] == "Benar" else ""
            s_mark = "✓" if p["jawaban"] == "Salah" else ""
            lines.append(f'        <tr data-jawaban="{p["jawaban"]}">')
            lines.append(f'          <td>{html.escape(p["label"])} {html.escape(p["teks"])}</td>')
            lines.append(f'          <td style="text-align: center; font-weight: bold; color: #16a34a;">{b_mark}</td>')
            lines.append(f'          <td style="text-align: center; font-weight: bold; color: #dc2626;">{s_mark}</td>')
            lines.append('        </tr>')
        lines.append('      </tbody>')
        lines.append('    </table>')
        lines.append('    <ol style="margin-top: 8px;">')
        for p in q["pernyataan"]:
            lines.append(f'      <li data-jawaban="{p["jawaban"]}">{html.escape(p["label"])} {html.escape(p["teks"])}</li>')
        lines.append('    </ol>')
        lines.append('  </div>')

        # Compatibility tabel_benar_salah
        lines.append('  <div data-field="tabel_benar_salah">')
        lines.append('    <table class="matrix-box">')
        lines.append('      <thead><tr><th>Pernyataan</th><th style="width: 80px; text-align: center;">Benar</th><th style="width: 80px; text-align: center;">Salah</th></tr></thead>')
        lines.append('      <tbody>')
        for p in q["pernyataan"]:
            b_mark = "✓" if p["jawaban"] == "Benar" else ""
            s_mark = "✓" if p["jawaban"] == "Salah" else ""
            lines.append(f'        <tr data-jawaban="{p["jawaban"]}"><td>{html.escape(p["label"])} {html.escape(p["teks"])}</td><td style="text-align: center;">{b_mark}</td><td style="text-align: center;">{s_mark}</td></tr>')
        lines.append('      </tbody>')
        lines.append('    </table>')
        lines.append('  </div>')

    lines.append(f'  <div data-field="kunci_jawaban">{kunci_esc}</div>')
    lines.append(f'  <div data-field="pembahasan"><p><strong>Pembahasan:</strong> {pembahasan_esc}</p></div>')
    lines.append('</article>')

    return "\n".join(lines)

def build_html_document(title, subtitle, articles_html, total_soal):
    return f"""<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>{html.escape(title)}</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; line-height: 1.6; padding: 24px; color: #1e293b; background: #f8fafc; }}
    article {{ background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }}
    table.matrix-box {{ width: 100%; border-collapse: collapse; margin-top: 12px; }}
    table.matrix-box th, table.matrix-box td {{ border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 13.5px; }}
    table.matrix-box th {{ background: #f1f5f9; font-weight: 600; color: #334155; }}
    ul[data-field="opsi_jawaban"] {{ list-style-type: none; padding-left: 0; margin-top: 12px; }}
    ul[data-field="opsi_jawaban"] li {{ padding: 8px 14px; margin-bottom: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; }}
    ul[data-field="opsi_jawaban"] li::before {{ content: attr(data-option) ". "; font-weight: 700; color: #0284c7; margin-right: 6px; }}
  </style>
</head>
<body>
  <header style="margin-bottom: 32px; border-bottom: 2px solid #0284c7; padding-bottom: 16px;">
    <h1 style="color: #0f172a; margin: 0 0 8px 0;">{html.escape(title)}</h1>
    <h3 style="color: #0284c7; margin: 0 0 12px 0;">{html.escape(subtitle)}</h3>
    <p style="color: #64748b; font-size: 14px; margin: 0;">Total {total_soal} Butir Soal Terstandarisasi CP Fase D Kurikulum Merdeka SMP Kelas 7, mencakup PG Sederhana, PG Kompleks, dan Tabel Benar/Salah lengkap dengan Gambar Stimulus Visual Asli &amp; Kunci Jawaban Resmi.</p>
  </header>
{articles_html}
</body>
</html>
"""

def main():
    print("=== STARTING EXTRACTION OF 125 HOTS KURIKULUM MERDEKA SOAL ===")
    all_questions = []

    for ch_num in [1, 2, 3, 4, 5]:
        ch_qs = parse_chapter(ch_num)
        print(f"Chapter {ch_num}: Parsed {len(ch_qs)} questions successfully.")
        all_questions.extend(ch_qs)

    print(f"\nTOTAL ALL QUESTIONS PARSED: {len(all_questions)}")

    # 1. Generate Per-Chapter HTML Files
    chapter_filenames = {
        1: "kelas7_ch1_about_me.html",
        2: "kelas7_ch2_culinary_and_me.html",
        3: "kelas7_ch3_home_sweet_home.html",
        4: "kelas7_ch4_my_school_activities.html",
        5: "kelas7_ch5_this_is_my_school.html",
    }

    for ch_num, filename in chapter_filenames.items():
        ch_qs = [q for q in all_questions if q["chapter"] == ch_num]
        articles = [generate_article_html(q, i + 1) for i, q in enumerate(ch_qs)]
        cfg = CHAPTER_CONFIG[ch_num]
        html_doc = build_html_document(
            title=f"Bank Soal {cfg['title']} - SMP Kelas 7",
            subtitle="Kurikulum Merdeka — Capaian Pembelajaran Fase D",
            articles_html="\n".join(articles),
            total_soal=len(ch_qs)
        )
        out_path = os.path.join(OUT_DIR, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html_doc)
        print(f"  Saved per-chapter HTML: {out_path} ({len(html_doc)} bytes)")

    # 2. Generate Master HTML File (125 Soal)
    master_articles = [generate_article_html(q, i + 1) for i, q in enumerate(all_questions)]
    master_html = build_html_document(
        title="Buku Bank Soal Bahasa Inggris SMP Kelas 7 - Kurikulum Merdeka (Fase D)",
        subtitle="Semester 1 & Semester 2 — 5 Chapter Utama & 15 Unit Pembelajaran Lengkap",
        articles_html="\n".join(master_articles),
        total_soal=len(all_questions)
    )

    master_path = os.path.join(OUT_DIR, "kelas7_kurikulum_merdeka_125soal_lengkap.html")
    with open(master_path, "w", encoding="utf-8") as f:
        f.write(master_html)
    print(f"\n>>> SAVED MASTER HTML (125 SOAL): {master_path} ({len(master_html)} bytes)")

    # 3. Generate Master JSON File (125 Soal) for direct import or programmatic access
    json_data = []
    for i, q in enumerate(all_questions):
        data_uri, url_path = get_image_data(q["gambar_file"])
        item = {
            "nomor": i + 1,
            "tipe": q["tipe"],
            "kelas": 7,
            "mapel": "Bahasa Inggris",
            "jenjang": "SMP",
            "fase": "D",
            "paket": q["paket"],
            "materi": q["materi"],
            "capaian_pembelajaran": q["capaian"],
            "tags": ["hots", "kurikulum-merdeka", "fase-d", "kelas-7", "bahasa-inggris"],
            "stimulus_bacaan": q["stimulus"],
            "teks_soal": q["teks_soal"],
            "kunci_jawaban": q["kunci_jawaban"],
            "pembahasan": q["pembahasan"],
            "gambar": [{"url": url_path, "dataUrl": data_uri, "deskripsi": f"Ilustrasi {q['gambar_file']}"}] if data_uri else []
        }
        if q["tipe"] in ["pg_sederhana", "pg_kompleks"]:
            item["opsi_jawaban"] = [{"label": opt["label"], "teks": opt["teks"]} for opt in q["opsi_jawaban"]]
        elif q["tipe"] == "benar_salah":
            item["pernyataan"] = q["pernyataan"]
        json_data.append(item)

    master_json_path = os.path.join(OUT_DIR, "kelas7_kurikulum_merdeka_125soal_lengkap.json")
    with open(master_json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    print(f">>> SAVED MASTER JSON (125 SOAL): {master_json_path} ({len(json_data)} records)")

if __name__ == "__main__":
    main()
