#!/usr/bin/env python3
"""
Compile Publication-Grade Master PDF for Bahasa Inggris SMP Kelas 9
Kurikulum Merdeka (Fase D) - 125 Butir Soal HOTS, 5 Chapter, 15 Unit Pembelajaran.
"""

import os
import json
from PIL import Image as PILImage

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image as RLImage,
    Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

REPO_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
OUT_DIR = os.path.join(REPO_DIR, 'public/ekstraksi-buku')
IMG_DIR = os.path.join(REPO_DIR, 'public/soal/bahasa-inggris')
JSON_PATH = os.path.join(OUT_DIR, 'kelas9_kurikulum_merdeka_125soal_lengkap.json')
PDF_OUT = os.path.join(OUT_DIR, 'Buku_Soal_Bahasa_Inggris_SMP_Kelas9_Kurikulum_Merdeka.pdf')

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            
            # Running Header
            self.setFont('Helvetica-Bold', 8)
            self.setFillColor(colors.HexColor('#0284c7'))
            self.drawString(40, A4[1] - 30, 'BIMBEL GEMILANG')
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawString(130, A4[1] - 30, '— Bahasa Inggris SMP Kelas 9 (Kurikulum Merdeka Fase D)')
            
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 34, A4[0] - 40, A4[1] - 34)

            # Running Footer
            self.line(40, 36, A4[0] - 40, 36)
            self.setFont('Helvetica', 8)
            self.drawString(40, 24, 'Bank Soal Terstandarisasi CP Fase D — 125 Butir Soal HOTS (5 Chapter & 15 Unit)')
            page_text = f'Halaman {self._pageNumber} dari {page_count}'
            self.drawRightString(A4[0] - 40, 24, page_text)
            
            self.restoreState()

def clean_text_for_rl(txt):
    if not txt:
        return ''
    t = str(txt)
    t = t.replace('•', '&bull;').replace('”', '"').replace('“', '"').replace('’', "'").replace('‘', "'")
    t = t.replace('–', '&ndash;').replace('—', '&mdash;')
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    t = t.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
    t = t.replace('&lt;i&gt;', '<i>').replace('&lt;/i&gt;', '</i>')
    t = t.replace('\n', '<br/>')
    return t

def get_scaled_image(img_rel_url, max_w=480, max_h=230):
    if not img_rel_url:
        return None
    fname = os.path.basename(img_rel_url)
    p = os.path.join(IMG_DIR, fname)
    if not os.path.exists(p):
        return None
    try:
        with PILImage.open(p) as pim:
            w, h = pim.size
        ratio = min(max_w / w, max_h / h, 1.0)
        return RLImage(p, width=w * ratio, height=h * ratio)
    except Exception as e:
        print(f"Error loading image {fname}: {e}")
        return None

def build_pdf_k9():
    print("Loading Kelas 9 questions from JSON...")
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        questions = json.load(f)

    print(f"Total questions loaded: {len(questions)}")

    doc = SimpleDocTemplate(
        PDF_OUT,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=45,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'CoverTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=24, leading=30,
        textColor=colors.HexColor('#0f172a'), alignment=1
    )
    subtitle_style = ParagraphStyle(
        'CoverSubtitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=13, leading=17,
        textColor=colors.HexColor('#0284c7'), alignment=1
    )
    chapter_banner_style = ParagraphStyle(
        'ChapterBanner', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=13, leading=17,
        textColor=colors.white
    )
    unit_header_style = ParagraphStyle(
        'UnitHeader', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=10.5, leading=14,
        textColor=colors.HexColor('#0f172a')
    )
    stimulus_title_style = ParagraphStyle(
        'StimulusTitle', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=13,
        textColor=colors.HexColor('#0369a1')
    )
    stimulus_body_style = ParagraphStyle(
        'StimulusBody', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#334155')
    )
    q_num_style = ParagraphStyle(
        'QNum', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=9.5, leading=13,
        textColor=colors.HexColor('#0284c7')
    )
    q_text_style = ParagraphStyle(
        'QText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=9, leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    opt_style = ParagraphStyle(
        'QOpt', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#334155'), leftIndent=12
    )
    key_style = ParagraphStyle(
        'QKey', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#166534')
    )
    pembahasan_style = ParagraphStyle(
        'QPembahasan', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#14532d')
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 40))
    story.append(Paragraph("<b>BIMBEL GEMILANG</b>", ParagraphStyle('InstName', parent=subtitle_style, fontSize=16, leading=20, textColor=colors.HexColor('#b45309'))))
    story.append(Spacer(1, 15))
    story.append(Paragraph("BUKU BANK SOAL BAHASA INGGRIS SMP KELAS 9", title_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Kurikulum Merdeka (Capaian Pembelajaran Fase D)<br/>Edisi Lengkap 5 Chapter &amp; 15 Unit Pembelajaran", subtitle_style))
    story.append(Spacer(1, 15))

    banner_img = get_scaled_image('/soal/bahasa-inggris/kmerdeka_kls9_ch1_fauna_banner.jpg', max_w=480, max_h=200)
    if banner_img:
        story.append(banner_img)
        story.append(Spacer(1, 15))

    meta_table_data = [
        [Paragraph("<b>Mata Pelajaran</b>", opt_style), Paragraph(": Bahasa Inggris", opt_style)],
        [Paragraph("<b>Jenjang / Kelas</b>", opt_style), Paragraph(": SMP / Kelas 9 (Fase D)", opt_style)],
        [Paragraph("<b>Kurikulum</b>", opt_style), Paragraph(": Kurikulum Merdeka (English for Nusantara)", opt_style)],
        [Paragraph("<b>Cakupan</b>", opt_style), Paragraph(": 5 Chapter Utama (Semester 1 &amp; 2) — 15 Unit Pembelajaran", opt_style)],
        [Paragraph("<b>Total Butir Soal</b>", opt_style), Paragraph(": 125 Soal HOTS (PG Sederhana, PG Kompleks, Benar/Salah)", opt_style)],
        [Paragraph("<b>Kelengkapan</b>", opt_style), Paragraph(": 10 Stimulus Visual Asli (1376x768) + Kunci &amp; Pembahasan Lengkap", opt_style)],
    ]
    t_meta = Table(meta_table_data, colWidths=[130, 360])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 25))

    story.append(Paragraph("<b>DAFTAR ISI &amp; PEMETAAN 5 CHAPTER UTAMA</b>", unit_header_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=8))

    toc_data = [
        [Paragraph("<b>Semester / Chapter</b>", opt_style), Paragraph("<b>Fokus Materi &amp; Teks</b>", opt_style), Paragraph("<b>Nomor</b>", opt_style)],
        [Paragraph("<b>Sem 1 &bull; Ch 1</b>", opt_style), Paragraph("Exploring Fauna of Indonesia (Bekantan, Orangutan, Indonesian Birds) &bull; Report Text &amp; Passive Voice", opt_style), Paragraph("Soal 1–25", opt_style)],
        [Paragraph("<b>Sem 1 &bull; Ch 2</b>", opt_style), Paragraph("Taking Trips (National Park, Snorkeling) &bull; Recount Text, Past Continuous vs Simple Past, Present Perfect", opt_style), Paragraph("Soal 26–50", opt_style)],
        [Paragraph("<b>Sem 2 &bull; Ch 3</b>", opt_style), Paragraph("Journeys to the Fantasy Worlds (Multiverse Timun Mas, Sangkuriang, 90s) &bull; Narrative &amp; Indirect Speech", opt_style), Paragraph("Soal 51–75", opt_style)],
        [Paragraph("<b>Sem 2 &bull; Ch 4</b>", opt_style), Paragraph("Upcycling Used Materials (Denim Crafts, Charity Sale &amp; Donation) &bull; Procedure, OSASCOMP &amp; Passive", opt_style), Paragraph("Soal 76–100", opt_style)],
        [Paragraph("<b>Sem 2 &bull; Ch 5</b>", opt_style), Paragraph("Digital Life (Infographics, Fact-Checking &amp; Cyber Safety) &bull; Multimodal, Imperatives &amp; Analytical", opt_style), Paragraph("Soal 101–125", opt_style)],
    ]
    t_toc = Table(toc_data, colWidths=[95, 335, 65])
    t_toc.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0284c7')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_toc)
    story.append(PageBreak())

    # ================= QUESTIONS =================
    current_chapter = None
    current_paket = None
    current_stimulus = None

    chapter_info = {
        1: ("CHAPTER 1: EXPLORING FAUNA OF INDONESIA", "Report Text (Bekantan, Orangutan, Indonesian Birds) & Passive Voice in Present Tense"),
        2: ("CHAPTER 2: TAKING TRIPS", "Personal Recount & Travel Emails, Past Continuous vs Simple Past, Present Perfect Tense"),
        3: ("CHAPTER 3: JOURNEYS TO THE FANTASY WORLDS", "Fantasy Narrative & Multiverse Legends, Direct/Indirect Speech, Past Perfect & Used to"),
        4: ("CHAPTER 4: UPCYCLING USED MATERIALS", "Upcycling Procedure Text, Charity Shop Ads, OSASCOMP Adjective Order & Passive Process"),
        5: ("CHAPTER 5: DIGITAL LIFE", "Multimodal Texts & Infographics, Online Safety & Fact-Checking, Analytical Connectors"),
    }

    for idx, q in enumerate(questions):
        q_num = q["nomor"]
        ch_num = (q_num - 1) // 25 + 1

        # PageBreak & Chapter Banner
        if ch_num != current_chapter:
            if current_chapter is not None:
                story.append(PageBreak())
            current_chapter = ch_num
            current_paket = None
            current_stimulus = None

            ch_title, ch_sub = chapter_info.get(ch_num, (f"CHAPTER {ch_num}", ""))

            banner_table = Table(
                [[Paragraph(f"<b>{ch_title}</b><br/><font size=9>{ch_sub}</font>", chapter_banner_style)]],
                colWidths=[515]
            )
            banner_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0284c7')),
                ('PADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(banner_table)
            story.append(Spacer(1, 10))

        # Render Unit Header if changed
        paket_name = q.get("paket", "")
        if paket_name and paket_name != current_paket:
            current_paket = paket_name
            unit_sub = paket_name.split(' - ')[1] if ' - ' in paket_name else paket_name
            story.append(Paragraph(f"<b>&bull; {clean_text_for_rl(unit_sub)}</b>", unit_header_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=10))

        # Render Reading Stimulus if changed
        stim_text = q.get("stimulus_bacaan", "")
        if stim_text and stim_text != current_stimulus:
            current_stimulus = stim_text
            story.append(Spacer(1, 4))
            story.append(Paragraph("<b>AUTHENTIC READING STIMULUS (REPORT / RECOUNT / NARRATIVE / PROCEDURE / INFOGRAPHIC):</b>", stimulus_title_style))
            story.append(Spacer(1, 3))
            for para in stim_text.split("\n"):
                p_clean = para.strip()
                if p_clean:
                    story.append(Paragraph(clean_text_for_rl(p_clean), stimulus_body_style))
            story.append(Spacer(1, 8))

            if q.get("gambar") and len(q["gambar"]) > 0:
                img_obj = get_scaled_image(q["gambar"][0].get("url", ""), max_w=480, max_h=180)
                if img_obj:
                    story.append(img_obj)
                    story.append(Spacer(1, 10))

        # Render Question Block
        q_elements = []
        q_elements.append(Paragraph(f"<b>Soal #{q['nomor']} [{q['tipe'].replace('_', ' ').upper()}]</b>", q_num_style))
        q_elements.append(Paragraph(clean_text_for_rl(q["teks_soal"]), q_text_style))
        q_elements.append(Spacer(1, 4))

        if q["tipe"] in ["pg_sederhana", "pg_kompleks"]:
            for opt in q.get("opsi_jawaban", []):
                q_elements.append(Paragraph(f"<b>{opt['label']}.</b> {clean_text_for_rl(opt['teks'])}", opt_style))
        elif q["tipe"] == "benar_salah":
            rows = [[
                Paragraph('<b>Pernyataan (Statement)</b>', opt_style),
                Paragraph('<b>Kunci</b>', ParagraphStyle('C', parent=opt_style, alignment=1))
            ]]
            for p in q.get("pernyataan", []):
                ans_str = p.get("jawaban", "Benar")
                col_c = colors.HexColor('#16a34a') if ans_str == 'Benar' else colors.HexColor('#dc2626')
                rows.append([
                    Paragraph(f"<b>{p['label']}</b> {clean_text_for_rl(p['teks'])}", opt_style),
                    Paragraph(f"<b>{ans_str.upper()}</b>", ParagraphStyle('AC', parent=opt_style, alignment=1, textColor=col_c))
                ])
            tf_t = Table(rows, colWidths=[420, 75])
            tf_t.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('PADDING', (0,0), (-1,-1), 4),
            ]))
            q_elements.append(tf_t)

        q_elements.append(Spacer(1, 4))
        key_box = [
            [
                Paragraph(f"<b>Kunci: {clean_text_for_rl(q['kunci_jawaban'])}</b>", key_style),
                Paragraph(f"<b>Pembahasan Gemilang:</b> {clean_text_for_rl(q['pembahasan'])}", pembahasan_style)
            ]
        ]
        kt = Table(key_box, colWidths=[95, 400])
        kt.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0fdf4')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#86efac')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        q_elements.append(kt)
        q_elements.append(Spacer(1, 10))

        story.append(KeepTogether(q_elements))

    print(f"Building Kelas 9 document to {PDF_OUT}...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f">>> KELAS 9 PDF COMPILED SUCCESSFULLY! Size: {os.path.getsize(PDF_OUT)} bytes")

if __name__ == '__main__':
    build_pdf_k9()
