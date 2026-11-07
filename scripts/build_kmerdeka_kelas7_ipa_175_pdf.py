#!/usr/bin/env python3
"""
Compile Publication-Grade Master PDF for IPA SMP Kelas 7
Kurikulum Merdeka (Fase D) - 175 Butir Soal HOTS, 7 Bab, 21 Unit Pembelajaran Lengkap.
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
IMG_DIR = os.path.join(REPO_DIR, 'public/soal/ipa')
JSON_PATH = os.path.join(OUT_DIR, 'kelas7_ipa_kurikulum_merdeka_175soal_lengkap.json')
PDF_OUT = os.path.join(OUT_DIR, 'Buku_Soal_IPA_SMP_Kelas7_Kurikulum_Merdeka.pdf')

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
            self.drawString(130, A4[1] - 30, '— IPA SMP Kelas 7 (Kurikulum Merdeka Fase D)')
            
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 34, A4[0] - 40, A4[1] - 34)

            # Running Footer
            self.line(40, 36, A4[0] - 40, 36)
            self.setFont('Helvetica-Bold', 8)
            self.setFillColor(colors.HexColor('#0284c7'))
            self.drawString(40, 24, 'PUSAT BANK SOAL & EVALUASI SAINS NASIONAL')
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            page_text = f"Halaman {self._pageNumber} dari {page_count}"
            self.drawRightString(A4[0] - 40, 24, page_text)
            self.restoreState()

def get_scaled_image(rel_path, max_w=480, max_h=200):
    if not rel_path:
        return None
    full_path = os.path.join(REPO_DIR, 'public', rel_path.lstrip('/'))
    if not os.path.exists(full_path):
        return None
    try:
        with PILImage.open(full_path) as im:
            w, h = im.size
            ratio = min(max_w / float(w), max_h / float(h), 1.0)
            return RLImage(full_path, width=w * ratio, height=h * ratio)
    except Exception as e:
        print(f"Error loading image {full_path}: {e}")
        return None

def clean_text_for_rl(txt):
    if not txt:
        return ""
    txt = str(txt)
    txt = txt.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return txt

def build_pdf():
    print("Loading Kelas 7 IPA questions from JSON...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f"Total questions loaded: {len(questions)}")

    doc = SimpleDocTemplate(
        PDF_OUT,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=46
    )

    styles = getSampleStyleSheet()

    cover_title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#0f172a'),
        alignment=1,
        spaceAfter=8
    )

    cover_sub_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0284c7'),
        alignment=1,
        spaceAfter=15
    )

    unit_header_style = ParagraphStyle(
        'UnitHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=12,
        spaceAfter=4
    )

    q_num_style = ParagraphStyle(
        'QNum',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=8,
        spaceAfter=2
    )

    q_text_style = ParagraphStyle(
        'QText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=4
    )

    opt_style = ParagraphStyle(
        'OptStyle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155'),
        leftIndent=15,
        spaceAfter=2
    )

    pemb_header_style = ParagraphStyle(
        'PembHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=14,
        spaceAfter=8
    )

    pemb_text_style = ParagraphStyle(
        'PembText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#334155')
    )

    story = []

    # ================= COVER PAGE =================
    story.append(Spacer(1, 15))
    story.append(Paragraph("<b>BIMBEL GEMILANG EDUKASI</b>", ParagraphStyle('TopLogo', fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#0284c7'), alignment=1, spaceAfter=8)))
    story.append(Paragraph("<b>BUKU MASTER BANK SOAL HOTS<br/>IPA SMP KELAS 7</b>", cover_title_style))
    story.append(Paragraph("<b>KURIKULUM MERDEKA — FASE D (LENGKAP 7 BAB)</b>", cover_sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceAfter=15))

    meta_data = [
        [Paragraph("<b>Mata Pelajaran</b>", opt_style), Paragraph(": Ilmu Pengetahuan Alam (IPA Terpadu)", opt_style)],
        [Paragraph("<b>Jenjang / Fase</b>", opt_style), Paragraph(": Sekolah Menengah Pertama (SMP/MTs) — Fase D (Kelas VII)", opt_style)],
        [Paragraph("<b>Standar Acuan</b>", opt_style), Paragraph(": Capaian Pembelajaran (CP) BSKAP No. 032/H/KR/2024", opt_style)],
        [Paragraph("<b>Cakupan Materi</b>", opt_style), Paragraph(": 7 Bab Utama, 21 Unit Pembelajaran, Literasi Sains & Keterampilan Proses", opt_style)],
        [Paragraph("<b>Total Butir Soal</b>", opt_style), Paragraph(": 175 Butir Soal HOTS Terstandarisasi + Kunci Jawaban & Pembahasan", opt_style)],
    ]
    t_meta = Table(meta_data, colWidths=[120, 375])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#f1f5f9')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 20))

    story.append(Paragraph("<b>DAFTAR ISI &amp; PEMETAAN 7 BAB KURIKULUM MERDEKA KELAS 7</b>", unit_header_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=8))

    toc_data = [
        [Paragraph("<b>Bab</b>", opt_style), Paragraph("<b>Materi &amp; Subbab Kurikulum Merdeka</b>", opt_style), Paragraph("<b>Nomor</b>", opt_style)],
        [Paragraph("<b>Bab I</b>", opt_style), Paragraph("Hakikat Ilmu Sains &amp; Metode Ilmiah &bull; Laboratorium, Neraca, Jangka Sorong, SI", opt_style), Paragraph("Soal 1–25", opt_style)],
        [Paragraph("<b>Bab II</b>", opt_style), Paragraph("Zat dan Perubahannya &bull; Wujud Zat, Partikel, Perubahan Fisika/Kimia, Massa Jenis", opt_style), Paragraph("Soal 26–50", opt_style)],
        [Paragraph("<b>Bab III</b>", opt_style), Paragraph("Suhu, Kalor, dan Pemuaian &bull; Termometer, Asas Black, Grafik Q-t, Bimetal", opt_style), Paragraph("Soal 51–75", opt_style)],
        [Paragraph("<b>Bab IV</b>", opt_style), Paragraph("Gerak dan Gaya &bull; GLB/GLBB, Hukum I, II, III Newton, Gaya Gesek &amp; Berat", opt_style), Paragraph("Soal 76–100", opt_style)],
        [Paragraph("<b>Bab V</b>", opt_style), Paragraph("Klasifikasi Makhluk Hidup &bull; Mikroskop, 5 Kingdom, Kunci Determinasi Dikotomi", opt_style), Paragraph("Soal 101–125", opt_style)],
        [Paragraph("<b>Bab VI</b>", opt_style), Paragraph("Ekologi &amp; Keanekaragaman Hayati &bull; Jaring Makanan, Piramida Energi, Konservasi", opt_style), Paragraph("Soal 126–150", opt_style)],
        [Paragraph("<b>Bab VII</b>", opt_style), Paragraph("Bumi dan Tata Surya &bull; Planet, Rotasi/Revolusi, Gerhana Bulan/Matahari, Lempeng", opt_style), Paragraph("Soal 151–175", opt_style)],
    ]
    t_toc = Table(toc_data, colWidths=[65, 385, 65])
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

    chapter_info = {
        1: ("BAB I: HAKIKAT ILMU SAINS & METODE ILMIAH", "Laboratorium IPA, Alat Ukur Presisi, Konversi Satuan SI & Pelaporan Ilmiah"),
        2: ("BAB II: ZAT DAN PERUBAHANNYA", "Model Partikel Zat, Perubahan Fisika vs Kimia, Kerapatan & Massa Jenis"),
        3: ("BAB III: SUHU, KALOR, DAN PEMUAIAN", "Termometer Lab, Asas Black, Perpindahan Kalor & Pemuaian Keping Bimetal"),
        4: ("BAB IV: GERAK DAN GAYA", "Kinematika Gerak GLB/GLBB, Tiga Hukum Newton, Gaya Gesek & Dinamika"),
        5: ("BAB V: KLASIFIKASI MAKHLUK HIDUP", "Ciri Makhluk Hidup, Mikroskop Cahaya, 5 Kingdom & Kunci Determinasi"),
        6: ("BAB VI: EKOLOGI & KEANEKARAGAMAN HAYATI", "Interaksi Biotik-Abiotik, Jaring Makanan, Piramida Energi & Biodiversitas"),
        7: ("BAB VII: BUMI DAN TATA SURYA", "Karakteristik Planet, Gerak Bumi-Bulan, Gerhana, Pasang Surut & Geologi"),
    }

    for idx, q in enumerate(questions):
        q_num = q["nomor"]
        ch_num = q["chapter"]

        # PageBreak & Chapter Banner
        if ch_num != current_chapter:
            if current_chapter is not None:
                story.append(PageBreak())
            current_chapter = ch_num
            current_paket = None

            ch_title, ch_sub = chapter_info.get(ch_num, (f"BAB {ch_num}", ""))

            banner_table = Table(
                [[Paragraph(f"<b>{ch_title}</b><br/><font size=9>{ch_sub}</font>", ParagraphStyle('BanT', fontName='Helvetica-Bold', fontSize=12, textColor=colors.white, alignment=1))]],
                colWidths=[515]
            )
            banner_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0284c7')),
                ('PADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
            ]))
            story.append(banner_table)
            story.append(Spacer(1, 8))

            # Embed Chapter Banner Image
            banner_img = get_scaled_image(q.get("banner_img", ""), max_w=500, max_h=160)
            if banner_img:
                story.append(banner_img)
                story.append(Spacer(1, 10))

        # Render Unit Header if changed
        paket_name = q.get("paket", "")
        if paket_name and paket_name != current_paket:
            current_paket = paket_name
            unit_sub = paket_name.split(' - ')[1] if ' - ' in paket_name else paket_name
            story.append(Paragraph(f"<b>&bull; {clean_text_for_rl(unit_sub)}</b>", unit_header_style))
            story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#0284c7'), spaceAfter=8))

        # Question Block
        q_elements = []
        q_elements.append(Paragraph(f"<b>Soal #{q['nomor']} (Bab {q['chapter']} No. {q['nomor_bab']})</b>", q_num_style))

        # Diagram image if present
        if q.get("diagram_img"):
            d_img = get_scaled_image(q["diagram_img"], max_w=400, max_h=150)
            if d_img:
                q_elements.append(d_img)
                q_elements.append(Spacer(1, 4))

        q_elements.append(Paragraph(clean_text_for_rl(q["soal"]), q_text_style))
        q_elements.append(Spacer(1, 3))

        for opt in q.get("opsi", []):
            q_elements.append(Paragraph(f"<b>{opt['label']}.</b> {clean_text_for_rl(opt['teks'])}", opt_style))

        q_elements.append(Spacer(1, 6))
        story.append(KeepTogether(q_elements))

    # ================= KUNCI & PEMBAHASAN TABLE =================
    story.append(PageBreak())
    story.append(Paragraph("<b>KUNCI JAWABAN &amp; PEMBAHASAN LENGKAP 175 SOAL HOTS</b>", cover_title_style))
    story.append(Paragraph("<b>Pedoman Penilaian &amp; Analisis Konsep IPA SMP Kelas 7 Kurikulum Merdeka</b>", cover_sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#0284c7'), spaceAfter=14))

    for ch in range(1, 8):
        ch_qs = [q for q in questions if q["chapter"] == ch]
        ch_title, _ = chapter_info.get(ch, (f"BAB {ch}", ""))
        story.append(Paragraph(f"<b>{ch_title} (Soal {ch_qs[0]['nomor']}–{ch_qs[-1]['nomor']})</b>", pemb_header_style))
        story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#cbd5e1'), spaceAfter=6))

        table_rows = [
            [Paragraph("<b>No</b>", opt_style), Paragraph("<b>Kunci</b>", opt_style), Paragraph("<b>Pembahasan Konseptual &amp; Langkah Cepat</b>", opt_style)]
        ]
        for q in ch_qs:
            no_str = f"#{q['nomor']} ({q['nomor_bab']})"
            table_rows.append([
                Paragraph(f"<b>{no_str}</b>", opt_style),
                Paragraph(f"<b>{q['kunci']}</b>", ParagraphStyle('KunciCol', fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#0284c7'))),
                Paragraph(clean_text_for_rl(q["pembahasan"]), pemb_text_style)
            ])

        t_pemb = Table(table_rows, colWidths=[55, 45, 415])
        t_pemb.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0,0), (-1,-1), 4),
            ('TOPPADDING', (0,1), (-1,-1), 3),
            ('BOTTOMPADDING', (0,1), (-1,-1), 3),
        ]))
        story.append(t_pemb)
        story.append(Spacer(1, 14))

    print(f"Building Kelas 7 IPA document to {PDF_OUT}...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f">>> KELAS 7 IPA PDF COMPILED SUCCESSFULLY! Size: {os.path.getsize(PDF_OUT)} bytes")

if __name__ == '__main__':
    build_pdf()
