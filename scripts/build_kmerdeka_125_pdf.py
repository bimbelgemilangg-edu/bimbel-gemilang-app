#!/usr/bin/env python3
"""
Compile Publication-Grade Master PDF for Bahasa Inggris SMP Kelas 7
Kurikulum Merdeka (Fase D) - 125 Butir Soal HOTS, 5 Chapter, 15 Unit Pembelajaran.
"""

import os
import sys
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
JSON_PATH = os.path.join(OUT_DIR, 'kelas7_kurikulum_merdeka_125soal_lengkap.json')
PDF_OUT = os.path.join(OUT_DIR, 'Buku_Soal_Bahasa_Inggris_SMP_Kelas7_Kurikulum_Merdeka.pdf')

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
            self.drawString(130, A4[1] - 30, '— Bahasa Inggris SMP Kelas 7 (Kurikulum Merdeka Fase D)')
            
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

def build_pdf():
    print("Loading questions from JSON...")
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
        textColor=colors.HexColor('#0f172a')
    )
    opt_style = ParagraphStyle(
        'OptText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#1e293b')
    )
    key_style = ParagraphStyle(
        'KeyText', parent=styles['Normal'],
        fontName='Helvetica-Bold', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#15803d')
    )
    pembahasan_style = ParagraphStyle(
        'PembahasanText', parent=styles['Normal'],
        fontName='Helvetica', fontSize=8.5, leading=12,
        textColor=colors.HexColor('#475569')
    )

    story = []

    # ==================== COVER PAGE ====================
    story.append(Spacer(1, 40))
    story.append(Paragraph("BIMBEL GEMILANG", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph("BUKU BANK SOAL STANDAR<br/>KURIKULUM MERDEKA", title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph("BAHASA INGGRIS SMP KELAS 7 (FASE D)", subtitle_style))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Semester 1 &amp; Semester 2 — 5 Chapter Utama &amp; 15 Unit Pembelajaran", ParagraphStyle('SubSub', parent=subtitle_style, fontSize=10, textColor=colors.HexColor('#475569'))))
    story.append(Spacer(1, 24))

    # Cover Illustration
    cover_img = get_scaled_image('/soal/bahasa-inggris/kmerdeka_ch1_about_me_banner.jpg', max_w=480, max_h=220)
    if cover_img:
        story.append(cover_img)
        story.append(Spacer(1, 20))

    meta_table_data = [
        [Paragraph('<b>Jenjang / Fase:</b>', q_text_style), Paragraph('SMP / Fase D (Kelas 7)', q_text_style)],
        [Paragraph('<b>Mata Pelajaran:</b>', q_text_style), Paragraph('Bahasa Inggris (English for Nusantara)', q_text_style)],
        [Paragraph('<b>Total Soal:</b>', q_text_style), Paragraph('125 Butir Soal HOTS (25 Soal per Chapter)', q_text_style)],
        [Paragraph('<b>Bentuk Soal:</b>', q_text_style), Paragraph('Pilihan Ganda Sederhana, PG Kompleks, Tabel Benar/Salah', q_text_style)],
        [Paragraph('<b>Fitur Standar:</b>', q_text_style), Paragraph('Visual Autentik Asli, Kunci Jawaban Resmi, dan Pembahasan Tuntas', q_text_style)],
    ]
    meta_table = Table(meta_table_data, colWidths=[130, 350])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(meta_table)

    story.append(PageBreak())

    # ==================== CHAPTER CONTENT ====================
    current_chapter = None
    current_paket = None
    current_stimulus = None

    for q in questions:
        ch_num = (q["nomor"] - 1) // 25 + 1
        paket_name = q["paket"]

        # New Chapter Header
        if ch_num != current_chapter:
            current_chapter = ch_num
            current_paket = None
            current_stimulus = None
            if q["nomor"] > 1:
                story.append(PageBreak())

            ch_title = f"CHAPTER {ch_num}: {paket_name.split(' - ')[0].replace(f'Chapter {ch_num}: ', '')}"
            banner_data = [[Paragraph(f"<b>{ch_title.upper()}</b>", chapter_banner_style)]]
            banner_table = Table(banner_data, colWidths=[515])
            banner_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0284c7')),
                ('PADDING', (0,0), (-1,-1), 10),
                ('ALIGN', (0,0), (-1,-1), 'CENTER'),
            ]))
            story.append(banner_table)
            story.append(Spacer(1, 8))

            # Materi & Capaian box
            cp_data = [
                [Paragraph(f"<b>Fokus Materi:</b> {clean_text_for_rl(q['materi'])}", stimulus_body_style)],
                [Paragraph(f"<b>Capaian Pembelajaran (CP):</b> {clean_text_for_rl(q['capaian_pembelajaran'])}", stimulus_body_style)],
            ]
            cp_table = Table(cp_data, colWidths=[515])
            cp_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            story.append(cp_table)
            story.append(Spacer(1, 14))

        # New Unit Subheading
        if paket_name != current_paket:
            current_paket = paket_name
            unit_sub = paket_name.split(' - ')[1] if ' - ' in paket_name else paket_name
            story.append(Paragraph(f"<b>&bull; {clean_text_for_rl(unit_sub)}</b>", unit_header_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=10))

        # Render Reading Stimulus if changed
        stim_text = q.get("stimulus_bacaan", "")
        if stim_text and stim_text != current_stimulus:
            current_stimulus = stim_text
            story.append(Spacer(1, 4))
            story.append(Paragraph("<b>AUTHENTIC READING STIMULUS / DIALOGUE / TIMETABLE:</b>", stimulus_title_style))
            story.append(Spacer(1, 3))
            for para in stim_text.split("\n"):
                p_clean = para.strip()
                if p_clean:
                    story.append(Paragraph(clean_text_for_rl(p_clean), stimulus_body_style))
            story.append(Spacer(1, 8))

            # Attach visual illustration
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
        # Answer key and explanation box
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

    print(f"Building document to {PDF_OUT}...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f">>> PDF COMPILED SUCCESSFULLY! Size: {os.path.getsize(PDF_OUT)} bytes")

if __name__ == '__main__':
    build_pdf()
