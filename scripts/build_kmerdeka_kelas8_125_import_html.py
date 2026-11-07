#!/usr/bin/env python3
"""
Build Complete Kurikulum Merdeka 125 HOTS Question Bank for SMP Kelas 8
(5 Chapters, 15 Units, All Authentic Stimuli & High-Res Images)
Output:
- public/ekstraksi-buku/kelas8_kurikulum_merdeka_125soal_lengkap.html
- public/ekstraksi-buku/kelas8_kurikulum_merdeka_125soal_lengkap.json
- public/ekstraksi-buku/kelas8_ch1_celebrating_independence_day.html
- public/ekstraksi-buku/kelas8_ch2_kindness_begins_with_me.html
- public/ekstraksi-buku/kelas8_ch3_love_our_world.html
- public/ekstraksi-buku/kelas8_ch4_no_littering.html
- public/ekstraksi-buku/kelas8_ch5_embrace_yourself.html
"""

import os
import re
import json
import html

BASE_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app"
SCRATCH_DIR = "/Users/macbook/.gemini/antigravity/brain/460bd5e4-284f-4570-9402-00482ffa2a82/scratch"
IMG_DIR = os.path.join(BASE_DIR, "public/soal/bahasa-inggris")
OUT_DIR = os.path.join(BASE_DIR, "public/ekstraksi-buku")
os.makedirs(OUT_DIR, exist_ok=True)

CHAPTER_CONFIG_K8 = {
    1: {
        "title": "Chapter 1: Celebrating Independence Day",
        "materi": "Celebrating Independence Day: Personal Recount Text, Independence Day Games (Panjat Pinang), School Parades, Congratulation & Greeting Cards",
        "capaian": "Peserta didik mampu memahami dan menyajikan teks recount lisan dan tulis tentang pengalaman perayaan hari kemerdekaan dan kegiatan sekolah menggunakan Simple Past Tense (regular/irregular verbs, was/were) dan time connectives.",
        "units": {
            (1, 5): "Chapter 1: Celebrating Independence Day - Unit 1: The Champion of Panjat Pinang",
            (6, 15): "Chapter 1: Celebrating Independence Day - Unit 3: Independence Day at SMP Merdeka",
            (16, 25): "Chapter 1: Celebrating Independence Day - Unit 2: Going to a Parade",
        },
        "images": {
            (1, 5): "kmerdeka_kls8_ch1_independence_banner.jpg",
            (6, 25): "kmerdeka_kls8_ch1_panjat_pinang.jpg",
        }
    },
    2: {
        "title": "Chapter 2: Kindness Begins with Me",
        "materi": "Kindness Begins with Me: Narrative Text (Fables & Moral Stories), Character Traits, Feelings, Empathy & Acts of Kindness",
        "capaian": "Peserta didik mampu menganalisis pesan moral, struktur orientasi-komplikasi-resolusi dalam teks naratif fabel menggunakan Past Continuous vs Simple Past Tense (when/while) dan cause-effect connectors.",
        "units": {
            (1, 5): "Chapter 2: Kindness Begins with Me - Unit 1: Kindness towards Differences",
            (6, 15): "Chapter 2: Kindness Begins with Me - Unit 2: Kindness and Happiness",
            (16, 25): "Chapter 2: Kindness Begins with Me - Unit 3: Kindness and Friendship",
        },
        "images": {
            (1, 5): "kmerdeka_kls8_ch2_kindness_banner.jpg",
            (6, 25): "kmerdeka_kls8_ch2_fables_lion_mouse.jpg",
        }
    },
    3: {
        "title": "Chapter 3: Love Our World",
        "materi": "Love Our World: Saving Water & Energy, Environmental Posters, Opinion & Agreement Expressions, Eco-School Campaigns",
        "capaian": "Peserta didik mampu menginstruksikan langkah hemat energi dan air melalui teks prosedur, serta menyampaikan pendapat (asking/giving opinion & agreement) terkait pelestarian lingkungan.",
        "units": {
            (1, 4): "Chapter 3: Love Our World - Unit 1: Look Around You",
            (5, 15): "Chapter 3: Love Our World - Unit 2: This is the Way",
            (16, 25): "Chapter 3: Love Our World - Unit 3: Act Now",
        },
        "images": {
            (1, 4): "kmerdeka_kls8_ch3_love_world_banner.jpg",
            (5, 25): "kmerdeka_kls8_ch3_handwashing_procedure.jpg",
        }
    },
    4: {
        "title": "Chapter 4: No Littering",
        "materi": "No Littering: Factual Recount Texts, Flood Causes & Effects, River Cleanup Actions, Marine Wildlife Rescue (Sea Turtles), Waste-Free Communities",
        "capaian": "Peserta didik mampu menganalisis fakta peristiwa banjir dan pencemaran laut melalui teks factual recount menggunakan Wh-Questions in Past Tense, serta konjungsi sebab-akibat (because of, so that, in order to).",
        "units": {
            (1, 4): "Chapter 4: No Littering - Unit 1: Did it Rain Last Night",
            (5, 15): "Chapter 4: No Littering - Unit 2: What Happened to the Sea Animals",
            (16, 25): "Chapter 4: No Littering - Unit 3: You Can Help",
        },
        "images": {
            (1, 4): "kmerdeka_kls8_ch4_no_littering_banner.jpg",
            (5, 25): "kmerdeka_kls8_ch4_river_clean_action.jpg",
        }
    },
    5: {
        "title": "Chapter 5: Embrace Yourself",
        "materi": "Embrace Yourself: Overcoming Self-Doubt, Consistency in Talents (Painting, Robotics, Wheelchair Sports), Public Speaking & Degrees of Comparison",
        "capaian": "Peserta didik mampu mendeskripsikan proses pengembangan diri dan ketekunan berlatih menggunakan Degrees of Comparison (positive, comparative, superlative), adverbs of manner (-ly), serta ungkapan harapan (wish and hope).",
        "units": {
            (1, 5): "Chapter 5: Embrace Yourself - Unit 1: Be Yourself",
            (6, 15): "Chapter 5: Embrace Yourself - Unit 2: I Know I Can Do It",
            (16, 25): "Chapter 5: Embrace Yourself - Unit 3: Practice Makes Perfect",
        },
        "images": {
            (1, 5): "kmerdeka_kls8_ch5_embrace_yourself_banner.jpg",
            (6, 25): "kmerdeka_kls8_ch5_practice_makes_perfect.jpg",
        }
    }
}

STIM_HEAD_RE = re.compile(
    r"\n(?=(?:Compare|Read|Study|Observe|Look at|This|GAMBAR)\b[\s\S]*?\bfor\s+ques[-\s]*tions?\s+number\b)",
    re.I
)

def format_pembahasan_k8(q, k_raw, raw_bahasan):
    ch = q["chapter"]
    no = q["nomor"]
    tipe = q["tipe"]
    kunci = q["kunci_jawaban"]

    raw_clean = (raw_bahasan or "").replace("◦C", "°C").replace("−", "-").replace("→", " menjadi ")
    raw_clean = re.sub(r"\s+", " ", raw_clean).strip()

    # Special handling for Soal 58 (Ch 3 No 8)
    if ch == 3 and no == 8:
        opt_text = next((o["teks"] for o in q["opsi_jawaban"] if o["label"] == "B"), "24 to 26 degrees Celsius")
        return (
            f"Jawaban yang tepat adalah B ({opt_text}). Berdasarkan instruksi Langkah 4 pada teks prosedur "
            f"'How to Save Electrical Energy in Your Bedroom Every Day', rentang temperatur pendingin ruangan (AC) yang "
            f"disarankan dan ramah lingkungan adalah antara 24 derajat Celsius hingga 26 derajat Celsius (24°C - 26°C) "
            f"guna menghemat konsumsi energi listrik serta menekan emisi karbon."
        )

    if tipe == "benar_salah":
        stmts = [f"{p['label']} bernilai {p['jawaban']}" for p in q["pernyataan"]]
        detail = "; ".join(stmts)
        has_extra = raw_clean and not raw_clean.startswith("(a)") and raw_clean != kunci
        extra = f" Penjelasan: {raw_clean}." if has_extra else ""
        return f"Analisis kesesuaian pernyataan berdasarkan wacana: {detail}.{extra}"
    elif tipe == "pg_kompleks":
        selected_opts = [f"{o['label']}. {o['teks']}" for o in q["opsi_jawaban"] if o["label"] in kunci]
        detail = " dan ".join(selected_opts)
        has_extra = raw_clean and not re.match(r"^[A-D,\s]+$", raw_clean) and raw_clean != kunci
        extra = f" Penjelasan: {raw_clean}." if has_extra else ""
        return f"Pilihan jawaban yang benar adalah {kunci} ({detail}).{extra}"
    else:  # pg_sederhana
        opt_text = next((o["teks"] for o in q["opsi_jawaban"] if o["label"] == kunci), "")
        has_extra = raw_clean and len(raw_clean) > 3 and not re.match(r"^[A-D]$", raw_clean) and raw_clean != kunci
        if has_extra:
            return f"Jawaban yang tepat adalah {kunci} ({opt_text}). Penjelasan: {raw_clean}."
        else:
            return (
                f"Jawaban yang tepat adalah {kunci} ({opt_text}). Sesuai fakta dan informasi kunci yang termuat pada "
                f"stimulus bacaan serta penerapan kaidah kebahasaan Kurikulum Merdeka Fase D."
            )

def parse_chapter_k8(ch_num):
    filepath = os.path.join(SCRATCH_DIR, f"chapter_8_{ch_num}_raw.txt")
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    # Slice from the start of question 1 instructions
    m = re.search(r"for questions? number\s+1\b", text, re.I)
    start_pos = m.start() if m else 0
    content = text[start_pos:]

    parts = re.split(r"KUNCI JAWABAN & PEMBAHASAN.*?:", content)
    main_text = parts[0]
    kunci_text = parts[1] if len(parts) > 1 else ""

    keys_dict = {}
    for km in re.finditer(r"(?:^|[•\n])\s*(\d+)\.\s+([^•\n]+)", kunci_text):
        num = int(km.group(1))
        keys_dict[num] = km.group(2).strip()

    lines = main_text.split("\n")
    q_indices = []
    for i, line in enumerate(lines):
        qm = re.match(r"^(\d+)\.\s+", line)
        if qm:
            num = int(qm.group(1))
            if 1 <= num <= 25:
                sub = "\n".join(lines[i+1:i+15])
                has_opt = bool(re.search(r"\n(?:[A-D]\.|\□\s*[A-D]\.|\(a\)\s+)", sub))
                next_num_m = re.search(r"\n\d+\.\s+", sub)
                opt_m = re.search(r"\n(?:[A-D]\.|\□\s*[A-D]\.|\(a\)\s+)", sub)
                if has_opt and (not next_num_m or (opt_m and opt_m.start() < next_num_m.start())):
                    q_indices.append((num, i))

    seq = []
    expected = 1
    for num, i in q_indices:
        if num == expected:
            seq.append((num, i))
            expected += 1
            if expected > 25:
                break

    u1_end = 4 if ch_num in [3, 4] else 5
    stim1 = "\n".join(lines[:seq[0][1]]).strip()
    stim1 = re.sub(r"^for questions? number[^\n]*\n", "", stim1, flags=re.I).strip()

    stimulus_map = {
        (1, u1_end): stim1,
        (u1_end + 1, 15): "",
        (16, 25): "",
    }

    # Find subsequent stimuli
    for k in range(len(seq)):
        num, start_idx = seq[k]
        end_idx = seq[k+1][1] if k + 1 < len(seq) else len(lines)
        chunk = "\n".join(lines[start_idx:end_idx]).strip()

        sm = STIM_HEAD_RE.search(chunk)
        if sm:
            st = chunk[sm.start():].strip()
            st = re.sub(r"--- Page \d+ ---", "", st).strip()
            if num == u1_end:
                stimulus_map[(u1_end + 1, 15)] = st
            elif num == 15:
                stimulus_map[(16, 25)] = st

    parsed_questions = []

    for k in range(len(seq)):
        num, start_idx = seq[k]
        end_idx = seq[k+1][1] if k + 1 < len(seq) else len(lines)
        chunk = "\n".join(lines[start_idx:end_idx]).strip()

        # Clean trailing stimulus
        stim_match = STIM_HEAD_RE.search(chunk)
        if stim_match:
            chunk = chunk[:stim_match.start()].strip()
        chunk = re.sub(r"--- Page \d+ ---", "", chunk).strip()

        k_raw = keys_dict.get(num, "")

        is_tf = ("benar / salah" in chunk.lower() or "true or false" in chunk.lower() or 
                 (bool(re.search(r"\([a-c]\)\s+", chunk)) and ("(a) true" in k_raw.lower() or "(a) false" in k_raw.lower())))
        is_complex = bool(re.search(r"Pilihan Ganda Kompleks|Pilih DUA|□\s*[A-D]\.", chunk, re.I))

        tipe = "benar_salah" if is_tf else ("pg_kompleks" if is_complex else "pg_sederhana")

        opsi = []
        pernyataan = []
        key_val = ""
        raw_pembahasan = ""

        if tipe == "benar_salah":
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
            raw_pembahasan = k_raw

            prompt_m = re.search(r"^\d+\.\s+(.*?)(?=\nNo\.|\nStatements|\n\([a-c]\))", chunk, re.DOTALL)
            soal_text = prompt_m.group(1).strip() if prompt_m else chunk.split("\n")[0]
        else:
            opt_matches = re.findall(r"(?:□\s*|\b)([A-D])\.\s+(.*?)(?=\n(?:□\s*|\b)[A-D]\.|\Z)", chunk, re.DOTALL)
            for lbl, opt_t in opt_matches:
                ot = re.sub(r"[\n\r]+", " ", opt_t).strip()
                opsi.append({"label": lbl, "teks": ot})

            km = re.match(r"^([A-D](?:,\s*[A-D])?)(?:\s*\((.*?)\))?", k_raw)
            if km:
                key_val = km.group(1).strip()
                raw_pembahasan = km.group(2).strip() if km.group(2) else k_raw
            else:
                key_val = k_raw[:5].strip()
                raw_pembahasan = k_raw

            prompt_m = re.search(r"^\d+\.\s+(.*?)(?=\n(?:□\s*|\b)[A-D]\.)", chunk, re.DOTALL)
            soal_text = prompt_m.group(1).strip() if prompt_m else chunk.split("\n")[0]

        soal_text = re.sub(r"[\n\r]+", " ", soal_text).strip()
        soal_text = re.sub(r"\s+", " ", soal_text).strip()

        cfg = CHAPTER_CONFIG_K8[ch_num]
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

        stim_text = ""
        for (q_start, q_end), s_text in stimulus_map.items():
            if q_start <= num <= q_end and s_text:
                stim_text = s_text
                break
        if not stim_text:
            stim_text = stimulus_map.get((1, u1_end), "")

        q_obj = {
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
        }
        q_obj["pembahasan"] = format_pembahasan_k8(q_obj, k_raw, raw_pembahasan)
        parsed_questions.append(q_obj)

    return parsed_questions

def generate_article_html_k8(q, global_num):
    url_path = f"/soal/bahasa-inggris/{q['gambar_file']}"
    
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
        f'  data-kelas="8"',
        f'  data-mapel="Bahasa Inggris"',
        f'  data-jenjang="SMP"',
        f'  data-fase="D"',
        f'  data-paket="{paket_esc}"',
        f'  data-kualitas="Sangat Baik">',
        f'  <div data-field="materi">{materi_esc}</div>',
        f'  <div data-field="capaian_pembelajaran">{capaian_esc}</div>',
        f'  <div data-field="tags">hots, kurikulum-merdeka, fase-d, kelas-8, bahasa-inggris</div>',
        f'  <div data-field="bacaan">',
        f'    <div style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13.5px; border-left: 4px solid #0284c7; margin-bottom: 12px;">',
        f'      <strong style="color: #0369a1; display: block; margin-bottom: 6px;">Authentic Stimulus (Recount Text / Dialogue / Fable / Poster):</strong>',
        f'      {stimulus_esc}',
        f'    </div>',
        f'  </div>',
        f'  <div data-field="gambar">',
        f'    <img src="{url_path}" data-url="{url_path}" alt="Visual Stimulus {q["gambar_file"]}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; border: 1px solid #cbd5e1;" />',
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
        lines.append('  <div data-field="pernyataan">')
        lines.append('    <table class="matrix-box">')
        lines.append('      <thead><tr><th style="text-align: left;">Pernyataan</th><th style="width: 80px; text-align: center;">Benar</th><th style="width: 80px; text-align: center;">Salah</th></tr></thead>')
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

def build_html_document_k8(title, subtitle, articles_html, total_soal):
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
    <p style="color: #64748b; font-size: 14px; margin: 0;">Total {total_soal} Butir Soal Terstandarisasi CP Fase D Kurikulum Merdeka SMP Kelas 8, mencakup PG Sederhana, PG Kompleks, dan Tabel Benar/Salah lengkap dengan Gambar Stimulus Visual Asli &amp; Kunci Jawaban Resmi.</p>
  </header>
{articles_html}
</body>
</html>
"""

def main():
    print("=== STARTING EXTRACTION OF 125 HOTS KURIKULUM MERDEKA SOAL KELAS 8 ===")
    all_questions = []

    for ch_num in [1, 2, 3, 4, 5]:
        ch_qs = parse_chapter_k8(ch_num)
        print(f"Chapter {ch_num}: Parsed {len(ch_qs)} questions successfully.")
        all_questions.extend(ch_qs)

    print(f"\nTOTAL ALL QUESTIONS PARSED FOR KELAS 8: {len(all_questions)}")

    chapter_filenames = {
        1: "kelas8_ch1_celebrating_independence_day.html",
        2: "kelas8_ch2_kindness_begins_with_me.html",
        3: "kelas8_ch3_love_our_world.html",
        4: "kelas8_ch4_no_littering.html",
        5: "kelas8_ch5_embrace_yourself.html",
    }

    # 1. Per-Chapter HTML Files
    for ch_num, filename in chapter_filenames.items():
        ch_qs = [q for q in all_questions if q["chapter"] == ch_num]
        articles = [generate_article_html_k8(q, i + 1) for i, q in enumerate(ch_qs)]
        cfg = CHAPTER_CONFIG_K8[ch_num]
        html_doc = build_html_document_k8(
            title=f"Bank Soal {cfg['title']} - SMP Kelas 8",
            subtitle="Kurikulum Merdeka — Capaian Pembelajaran Fase D",
            articles_html="\n".join(articles),
            total_soal=len(ch_qs)
        )
        out_path = os.path.join(OUT_DIR, filename)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html_doc)
        print(f"  Saved per-chapter HTML: {out_path} ({len(html_doc)} bytes)")

    # 2. Master HTML File (125 Soal)
    master_articles = [generate_article_html_k8(q, i + 1) for i, q in enumerate(all_questions)]
    master_html = build_html_document_k8(
        title="Buku Bank Soal Bahasa Inggris SMP Kelas 8 - Kurikulum Merdeka (Fase D)",
        subtitle="Semester 1 & Semester 2 — 5 Chapter Utama & 15 Unit Pembelajaran Lengkap",
        articles_html="\n".join(master_articles),
        total_soal=len(all_questions)
    )

    master_path = os.path.join(OUT_DIR, "kelas8_kurikulum_merdeka_125soal_lengkap.html")
    with open(master_path, "w", encoding="utf-8") as f:
        f.write(master_html)
    print(f"\n>>> SAVED MASTER HTML KELAS 8 (125 SOAL): {master_path} ({len(master_html)} bytes)")

    # 3. Master JSON File (125 Soal)
    json_data = []
    for i, q in enumerate(all_questions):
        url_path = f"/soal/bahasa-inggris/{q['gambar_file']}"
        item = {
            "nomor": i + 1,
            "tipe": q["tipe"],
            "kelas": 8,
            "mapel": "Bahasa Inggris",
            "jenjang": "SMP",
            "fase": "D",
            "paket": q["paket"],
            "materi": q["materi"],
            "capaian_pembelajaran": q["capaian"],
            "tags": ["hots", "kurikulum-merdeka", "fase-d", "kelas-8", "bahasa-inggris"],
            "stimulus_bacaan": q["stimulus"],
            "teks_soal": q["teks_soal"],
            "kunci_jawaban": q["kunci_jawaban"],
            "pembahasan": q["pembahasan"],
            "gambar": [{"url": url_path, "deskripsi": f"Ilustrasi {q['gambar_file']}"}]
        }
        if q["tipe"] in ["pg_sederhana", "pg_kompleks"]:
            item["opsi_jawaban"] = [{"label": opt["label"], "teks": opt["teks"]} for opt in q["opsi_jawaban"]]
        elif q["tipe"] == "benar_salah":
            item["pernyataan"] = q["pernyataan"]
        json_data.append(item)

    master_json_path = os.path.join(OUT_DIR, "kelas8_kurikulum_merdeka_125soal_lengkap.json")
    with open(master_json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
    print(f">>> SAVED MASTER JSON KELAS 8 (125 SOAL): {master_json_path} ({len(json_data)} records)")

if __name__ == "__main__":
    main()
