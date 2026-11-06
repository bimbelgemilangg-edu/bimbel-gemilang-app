# scripts/compile_kmerdeka_pdf.py
import os
import sys
from html import escape
from PIL import Image as PILImage

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image as RLImage,
    Table, TableStyle, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

repo_dir = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
out_dir = os.path.join(repo_dir, 'public/ekstraksi-buku')
img_dir = os.path.join(repo_dir, 'public/soal/bahasa-inggris')

sys.path.append(os.path.join(repo_dir, 'scripts'))
from kmerdeka_questions_part1 import SOAL_PART1
from kmerdeka_questions_part2 import SOAL_PART2
from kmerdeka_questions_part3 import SOAL_PART3

ALL_SOAL = SOAL_PART1 + SOAL_PART2 + SOAL_PART3

pdf_out_path = os.path.join(out_dir, 'Buku_Soal_Bahasa_Inggris_SMP_Kelas7_Kurikulum_Merdeka.pdf')

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
        # Don't draw on cover page (Page 1)
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
            self.drawString(40, 24, 'Bank Soal Terstandarisasi CP Fase D — 5 Chapter & 15 Unit')
            page_text = f'Halaman {self._pageNumber} dari {page_count}'
            self.drawRightString(A4[0] - 40, 24, page_text)
            
            self.restoreState()

def clean_text_for_rl(txt):
    if not txt:
        return ''
    t = str(txt)
    # Convert special bullets and quotes
    t = t.replace('•', '&bull;').replace('”', '"').replace('“', '"').replace('’', "'").replace('‘', "'")
    t = t.replace('–', '&ndash;').replace('—', '&mdash;')
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    # restore allowed simple tags if we escaped them
    t = t.replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>')
    t = t.replace('&lt;i&gt;', '<i>').replace('&lt;/i&gt;', '</i>')
    t = t.replace('\n', '<br/>')
    return t

def get_scaled_image(filename, max_w=460, max_h=230):
    p = os.path.join(img_dir, filename)
    if not os.path.exists(p):
        return None
    try:
        with PILImage.open(p) as pim:
            w, h = pim.size
        ratio = min(max_w / w, max_h / h, 1.0)
        # for tiny clock images, scale up nicely
        if w < 100 and h < 50:
            return RLImage(p, width=160, height=45)
        return RLImage(p, width=w * ratio, height=h * ratio)
    except Exception as e:
        print(f"Error loading image {filename}: {e}")
        return None

# Setup document
doc = SimpleDocTemplate(
    pdf_out_path,
    pagesize=A4,
    leftMargin=40,
    rightMargin=40,
    topMargin=45,
    bottomMargin=45
)

styles = getSampleStyleSheet()

# Custom styles
title_style = ParagraphStyle(
    'CoverTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=24,
    leading=30,
    textColor=colors.HexColor('#0f172a'),
    alignment=1 # Center
)

subtitle_style = ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=14,
    leading=18,
    textColor=colors.HexColor('#0284c7'),
    alignment=1
)

chapter_banner_style = ParagraphStyle(
    'ChapterBanner',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=13,
    leading=17,
    textColor=colors.white
)

unit_header_style = ParagraphStyle(
    'UnitHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=11,
    leading=15,
    textColor=colors.HexColor('#0f172a')
)

unit_sub_style = ParagraphStyle(
    'UnitSub',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=9,
    leading=12,
    textColor=colors.HexColor('#0284c7')
)

bacaan_style = ParagraphStyle(
    'BacaanText',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor('#1e293b')
)

soal_badge_style = ParagraphStyle(
    'SoalBadge',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=9,
    leading=12,
    textColor=colors.HexColor('#0369a1')
)

soal_text_style = ParagraphStyle(
    'SoalText',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13,
    textColor=colors.HexColor('#0f172a')
)

opsi_style = ParagraphStyle(
    'OpsiText',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12,
    textColor=colors.HexColor('#334155')
)

table_cell_style = ParagraphStyle(
    'TableCell',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8,
    leading=11,
    textColor=colors.HexColor('#1e293b')
)

table_header_style = ParagraphStyle(
    'TableHeader',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=8,
    leading=11,
    textColor=colors.HexColor('#0f172a'),
    alignment=1
)

story = []

# =========================================================================
# COVER PAGE
# =========================================================================
story.append(Spacer(1, 40))

# Top decorative bar
top_bar = Table([['']], colWidths=[515], rowHeights=[6])
top_bar.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0284c7')),
    ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#0284c7')),
]))
story.append(top_bar)
story.append(Spacer(1, 25))

# Publisher / Header
story.append(Paragraph('<b>BIMBEL GEMILANG — OFFICIAL QUESTION BANK</b>', ParagraphStyle('CoverSubTop', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#64748b'), alignment=1)))
story.append(Spacer(1, 15))

# Main Title
story.append(Paragraph('BUKU BANK SOAL &amp; PEMBAHASAN LENGKAP', title_style))
story.append(Spacer(1, 10))
story.append(Paragraph('BAHASA INGGRIS SMP KELAS 7', ParagraphStyle('CoverSubject', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=20, leading=24, textColor=colors.HexColor('#0369a1'), alignment=1)))
story.append(Spacer(1, 12))
story.append(Paragraph('KURIKULUM MERDEKA — CAPAIAN PEMBELAJARAN FASE D', subtitle_style))
story.append(Spacer(1, 30))

# Metadata Card Table
meta_data = [
    [Paragraph('<b>Jenjang &amp; Fase</b>', table_header_style), Paragraph('SMP / Fase D (Kelas 7)', table_cell_style)],
    [Paragraph('<b>Cakupan Materi</b>', table_header_style), Paragraph('Semester 1 (Chapter 1–3) &amp; Semester 2 (Chapter 4–5) — 15 Unit Pembelajaran', table_cell_style)],
    [Paragraph('<b>Fokus Kurikulum</b>', table_header_style), Paragraph('English for Nusantara: About Me, Culinary, Home, School Activities, My School', table_cell_style)],
    [Paragraph('<b>Jumlah Butir Soal</b>', table_header_style), Paragraph('<b>80 Butir Soal Lengkap</b> (Pilihan Ganda, PG Kompleks &amp; Tabel Benar/Salah)', table_cell_style)],
    [Paragraph('<b>Kelengkapan Gambar</b>', table_header_style), Paragraph('<b>45 Butir Soal Bergambar Asli</b> (Jam Digital, Infografik Nutrisi, Pot Swasiram, Ransel, Poster Festival)', table_cell_style)],
    [Paragraph('<b>Kunci &amp; Pembahasan</b>', table_header_style), Paragraph('Disertai Tabel Kunci Jawaban Kilat dan Pembahasan Analisis Gramatika Lengkap', table_cell_style)],
]
meta_table = Table(meta_data, colWidths=[150, 365])
meta_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('TOPPADDING', (0,0), (-1,-1), 8),
    ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ('LEFTPADDING', (0,0), (-1,-1), 10),
    ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#e0f2fe')),
]))
story.append(meta_table)

story.append(Spacer(1, 60))

# Footer note on cover
cover_footer_text = '''<b>Penerbit / Hak Cipta:</b><br/>
Divisi Akademik &amp; Penjaminan Mutu Soal Bimbel Gemilang<br/>
<i>Terintegrasi langsung dengan Mesin Impor Bank Soal Digital Bimbel Gemilang</i>'''
story.append(Paragraph(cover_footer_text, ParagraphStyle('CoverFoot', parent=styles['Normal'], fontName='Helvetica', fontSize=9, leading=14, textColor=colors.HexColor('#64748b'), alignment=1)))

story.append(PageBreak())

# =========================================================================
# TABLE OF CONTENTS / DAFTAR ISI
# =========================================================================
story.append(Paragraph('<b>DAFTAR ISI &amp; PEMETAAN MATERI KELAS 7</b>', ParagraphStyle('TOCTitle', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=16, leading=20, textColor=colors.HexColor('#0f172a'))))
story.append(Paragraph('<i>Sesuai Struktur 5 Chapter Utama Kurikulum Merdeka (English for Nusantara)</i>', ParagraphStyle('TOCSub', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=9, leading=13, textColor=colors.HexColor('#64748b'))))
story.append(Spacer(1, 15))

toc_rows = [
    [Paragraph('<b>Materi / Chapter / Unit</b>', table_header_style), Paragraph('<b>Fokus Gramatika &amp; Teks</b>', table_header_style), Paragraph('<b>Nomor Soal</b>', table_header_style)],
    
    # Semester 1
    [Paragraph('<b>SEMESTER 1</b>', ParagraphStyle('TOCSem', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#0369a1'))), Paragraph('<b>3 Chapter Utama (45 Butir Soal)</b>', table_cell_style), Paragraph('<b>Soal 1 – 45</b>', table_cell_style)],
    
    [Paragraph('<b>Chapter 1: About Me</b><br/>&bull; Unit 1: Galang from Kalimantan<br/>&bull; Unit 2: I Love Fishing<br/>&bull; Unit 3: My Friends and I', table_cell_style),
     Paragraph('&bull; Greetings &amp; Introducing Oneself<br/>&bull; To Be (am, is, are) &amp; Pronouns<br/>&bull; Simple Present Tense (Hobbies)<br/>&bull; Possessive Adjectives (my, his, her)', table_cell_style),
     Paragraph('Soal 1 – 5<br/>Soal 6 – 10<br/>Soal 11 – 15', table_cell_style)],

    [Paragraph('<b>Chapter 2: Culinary and Me</b><br/>&bull; Unit 1: My Favorite Food<br/>&bull; Unit 2: My Favorite Snack<br/>&bull; Unit 3: A Secret Recipe', table_cell_style),
     Paragraph('&bull; Sensory Adjectives (taste/texture)<br/>&bull; Nutrition Facts Labels (Oat Milk)<br/>&bull; Procedure Text &amp; Imperatives<br/>&bull; Sequence Connectors (first, then)', table_cell_style),
     Paragraph('Soal 16 – 20<br/>Soal 21 – 25<br/>Soal 26 – 30', table_cell_style)],

    [Paragraph('<b>Chapter 3: Home Sweet Home</b><br/>&bull; Unit 1: My House<br/>&bull; Unit 2: My House Chores<br/>&bull; Unit 3: Let’s Clean Up!', table_cell_style),
     Paragraph('&bull; Rooms in house &amp; Prepositions<br/>&bull; Degrees of Comparison (Backpacks)<br/>&bull; Daily Routines &amp; Family Teamwork<br/>&bull; Upcycling DIY (Self-Watering Pot)', table_cell_style),
     Paragraph('Soal 31 – 35<br/>Soal 36 – 40<br/>Soal 41 – 45', table_cell_style)],

    # Semester 2
    [Paragraph('<b>SEMESTER 2</b>', ParagraphStyle('TOCSem', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#0d9488'))), Paragraph('<b>2 Chapter Utama (35 Butir Soal)</b>', table_cell_style), Paragraph('<b>Soal 46 – 80</b>', table_cell_style)],

    [Paragraph('<b>Chapter 4: My School Activities</b><br/>&bull; Unit 1: My Class Schedule<br/>&bull; Unit 2: My Online Class<br/>&bull; Unit 3: My Study Habits', table_cell_style),
     Paragraph('&bull; School Timetables (7A vs 7B)<br/>&bull; Prepositions of Time (at, on, in)<br/>&bull; Telling Time (10 Gambar Jam Digital)<br/>&bull; Adverbs of Frequency &amp; Survey', table_cell_style),
     Paragraph('Soal 46 – 50<br/>Soal 51 – 60<br/>Soal 61 – 65', table_cell_style)],

    [Paragraph('<b>Chapter 5: This is My School</b><br/>&bull; Unit 1: School Buildings<br/>&bull; Unit 2: Extracurricular Activities<br/>&bull; Unit 3: School Festival', table_cell_style),
     Paragraph('&bull; Descriptive Text (School facilities)<br/>&bull; Extracurricular Comparison Table<br/>&bull; Event Posters (Science Fair vs Storytelling)<br/>&bull; Congratulating Expressions', table_cell_style),
     Paragraph('Soal 66 – 70<br/>Soal 71 – 75<br/>Soal 76 – 80', table_cell_style)],

    # Kunci & Pembahasan
    [Paragraph('<b>KUNCI JAWABAN &amp; PEMBAHASAN</b>', ParagraphStyle('TOCKunci', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=9, textColor=colors.HexColor('#b91c1c'))),
     Paragraph('Matriks Kunci Cepat 1–80 &amp; Pembahasan Analisis Gramatika Lengkap', table_cell_style),
     Paragraph('Halaman Belakang', table_cell_style)]
]

toc_table = Table(toc_rows, colWidths=[175, 240, 100])
toc_table.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
    ('TEXTCOLOR', (0,0), (-1,0), colors.white),
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ('TOPPADDING', (0,0), (-1,-1), 6),
    ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ('LEFTPADDING', (0,0), (-1,-1), 8),
    ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ('BACKGROUND', (0,1), (-1,1), colors.HexColor('#e0f2fe')),
    ('BACKGROUND', (0,5), (-1,5), colors.HexColor('#ccfbf1')),
    ('BACKGROUND', (0,8), (-1,8), colors.HexColor('#fee2e2')),
]))
story.append(toc_table)

story.append(PageBreak())

# =========================================================================
# SOAL SECTION: CHAPTER 1 S.D. CHAPTER 5
# =========================================================================
current_chapter = None
current_unit = None

for q in ALL_SOAL:
    num = q['nomor']
    ch = q['chapter']
    un = q['unit']
    sem = q['semester']
    tp = q['tipe']
    mt = q['materi']
    soal_t = q['teks_soal']
    
    # Check if new Chapter
    if ch != current_chapter:
        current_chapter = ch
        current_unit = None
        # Add Chapter Banner
        banner_color = colors.HexColor('#0284c7') if 'Semester 1' in sem else colors.HexColor('#0d9488')
        banner_table = Table([[
            Paragraph(f"<b>{clean_text_for_rl(sem.upper())} &mdash; {clean_text_for_rl(ch.upper())}</b>", chapter_banner_style)
        ]], colWidths=[515], rowHeights=[26])
        banner_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), banner_color),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LEFTPADDING', (0,0), (-1,-1), 12),
        ]))
        story.append(Spacer(1, 10))
        story.append(banner_table)
        story.append(Spacer(1, 10))

    # Check if new Unit
    if un != current_unit:
        current_unit = un
        story.append(Spacer(1, 6))
        unit_table = Table([[
            Paragraph(f"<b>{clean_text_for_rl(un)}</b>", unit_header_style),
            Paragraph(f"<i>Fokus: {clean_text_for_rl(mt)}</i>", unit_sub_style)
        ]], colWidths=[315, 200])
        unit_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
            ('LINELEFT', (0,0), (0,-1), 3, colors.HexColor('#0284c7')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(unit_table)
        story.append(Spacer(1, 8))

    # Check for reading passage
    if q.get('bacaan') and q['bacaan'].get('teks'):
        # Only print bacaan if it's the start of that reading group
        b_teks = q['bacaan']['teks']
        b_box = Table([[
            Paragraph(f"<b>STIMULUS BACAAN / DATA:</b><br/>{clean_text_for_rl(b_teks)}", bacaan_style)
        ]], colWidths=[515])
        b_box.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('LINELEFT', (0,0), (0,-1), 3, colors.HexColor('#64748b')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(b_box)
        story.append(Spacer(1, 8))

    # Check for visual images
    if q.get('gambar') and len(q['gambar']) > 0:
        for g_file in q['gambar']:
            rl_img = get_scaled_image(g_file)
            if rl_img:
                # Wrap image in centered table
                img_table = Table([[rl_img]], colWidths=[515])
                img_table.setStyle(TableStyle([
                    ('ALIGN', (0,0), (-1,-1), 'CENTER'),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                    ('TOPPADDING', (0,0), (-1,-1), 2),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 4),
                ]))
                story.append(img_table)
                story.append(Paragraph(f"<i>Gambar Stimulus Soal {num}: {clean_text_for_rl(g_file.replace('_', ' ').replace('.png', '').replace('.jpg', ''))}</i>", ParagraphStyle('ImgCap', parent=styles['Normal'], fontName='Helvetica-Oblique', fontSize=7.5, leading=10, textColor=colors.HexColor('#64748b'), alignment=1)))
                story.append(Spacer(1, 6))

    # Build Question Box
    badge_label = 'PILIHAN GANDA'
    if tp == 'pg_kompleks':
        badge_label = 'PILIHAN GANDA KOMPLEKS (PILIH 2 JAWABAN)'
    elif tp == 'benar_salah':
        badge_label = 'TABEL BENAR / SALAH (TRUE / FALSE)'

    badge_html = f"<b>Soal #{num}</b> &nbsp;&bull;&nbsp; <font color='#0284c7'><b>{badge_label}</b></font> &nbsp;&bull;&nbsp; <i>Topik: {clean_text_for_rl(mt)}</i>"
    story.append(Paragraph(badge_html, soal_badge_style))
    story.append(Spacer(1, 3))
    story.append(Paragraph(clean_text_for_rl(soal_t), soal_text_style))
    story.append(Spacer(1, 5))

    # Render Options if PG
    if q.get('opsi_jawaban'):
        opsi_items = []
        for o in q['opsi_jawaban']:
            lbl = o['label']
            tk = o['teks']
            opsi_items.append([
                Paragraph(f"<b>{lbl}.</b>", ParagraphStyle('OptLbl', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=8.5, leading=11, textColor=colors.HexColor('#0284c7'), alignment=2)),
                Paragraph(clean_text_for_rl(tk), opsi_style)
            ])
        opt_table = Table(opsi_items, colWidths=[24, 491])
        opt_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('LEFTPADDING', (0,0), (-1,-1), 2),
            ('RIGHTPADDING', (0,0), (-1,-1), 2),
        ]))
        story.append(opt_table)

    # Render True/False Table if benar_salah
    if q.get('pernyataan'):
        tf_header = [
            Paragraph('<b>No.</b>', table_header_style),
            Paragraph('<b>Pernyataan (Statements)</b>', table_header_style),
            Paragraph('<b>Benar (True)</b>', table_header_style),
            Paragraph('<b>Salah (False)</b>', table_header_style)
        ]
        tf_rows = [tf_header]
        for i, p in enumerate(q['pernyataan']):
            idx_lbl = f"({chr(97 + i)})"
            tk = p['teks']
            is_b = p['jawaban'] in ['B', 'True', 'Benar']
            cb = '✓' if is_b else ''
            cs = '' if is_b else '✓'
            tf_rows.append([
                Paragraph(idx_lbl, table_cell_style),
                Paragraph(clean_text_for_rl(tk), table_cell_style),
                Paragraph(f"<b>{cb}</b>", ParagraphStyle('TickB', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#059669'), alignment=1)),
                Paragraph(f"<b>{cs}</b>", ParagraphStyle('TickS', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, textColor=colors.HexColor('#dc2626'), alignment=1))
            ])
        tf_matrix_table = Table(tf_rows, colWidths=[30, 365, 60, 60])
        tf_matrix_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 4),
            ('RIGHTPADDING', (0,0), (-1,-1), 4),
        ]))
        story.append(tf_matrix_table)

    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=10))

# =========================================================================
# KUNCI JAWABAN & PEMBAHASAN SECTION
# =========================================================================
story.append(PageBreak())

kunci_banner = Table([[
    Paragraph('<b>KUNCI JAWABAN RESMI &amp; PEMBAHASAN MENDALAM (SOAL 1 &ndash; 80)</b>', chapter_banner_style)
]], colWidths=[515], rowHeights=[26])
kunci_banner.setStyle(TableStyle([
    ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#b91c1c')),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('LEFTPADDING', (0,0), (-1,-1), 12),
]))
story.append(kunci_banner)
story.append(Spacer(1, 12))

story.append(Paragraph('<b>TABEL MATRIKS KUNCI JAWABAN KILAT (1 &ndash; 80):</b>', ParagraphStyle('MatHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#0f172a'))))
story.append(Spacer(1, 6))

# Build quick answer matrix 10 items per row
matrix_rows = []
for row_idx in range(0, 80, 10):
    row_headers = []
    row_answers = []
    for col_idx in range(10):
        q_idx = row_idx + col_idx
        if q_idx < len(ALL_SOAL):
            q_obj = ALL_SOAL[q_idx]
            row_headers.append(Paragraph(f"<b>#{q_obj['nomor']}</b>", table_header_style))
            # Format answer nicely
            ans_str = q_obj['kunci_jawaban']
            if len(ans_str) > 6:
                ans_str = ans_str.replace(' ', '')
            row_answers.append(Paragraph(f"<b>{clean_text_for_rl(ans_str)}</b>", ParagraphStyle('AnsKey', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=7.5, leading=10, textColor=colors.HexColor('#b91c1c'), alignment=1)))
        else:
            row_headers.append(Paragraph('', table_header_style))
            row_answers.append(Paragraph('', table_header_style))
    matrix_rows.append(row_headers)
    matrix_rows.append(row_answers)

key_matrix_table = Table(matrix_rows, colWidths=[51.5]*10)
key_matrix_table.setStyle(TableStyle([
    ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,2), (-1,2), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,4), (-1,4), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,6), (-1,6), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,8), (-1,8), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,10), (-1,10), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,12), (-1,12), colors.HexColor('#f1f5f9')),
    ('BACKGROUND', (0,14), (-1,14), colors.HexColor('#f1f5f9')),
    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ('TOPPADDING', (0,0), (-1,-1), 3),
    ('BOTTOMPADDING', (0,0), (-1,-1), 3),
]))
story.append(key_matrix_table)
story.append(Spacer(1, 16))

story.append(Paragraph('<b>PEMBAHASAN ANALISIS GRAMATIKA &amp; PENJELASAN KONTEKS:</b>', ParagraphStyle('PembHeader', parent=styles['Normal'], fontName='Helvetica-Bold', fontSize=10, leading=14, textColor=colors.HexColor('#0f172a'))))
story.append(Spacer(1, 8))

for q in ALL_SOAL:
    num = q['nomor']
    kj = q['kunci_jawaban']
    pb = q['pembahasan']
    mt = q['materi']
    ch = q['chapter']
    un = q['unit']
    
    pemb_text = f"<b>Soal #{num} (Kunci: {clean_text_for_rl(kj)})</b> &mdash; <i>{clean_text_for_rl(ch)} / {clean_text_for_rl(un)}:</i><br/>{clean_text_for_rl(pb)}"
    story.append(Paragraph(pemb_text, ParagraphStyle('PembItem', parent=styles['Normal'], fontName='Helvetica', fontSize=8, leading=11, textColor=colors.HexColor('#1e293b'))))
    story.append(Spacer(1, 4))

print("Building PDF document via ReportLab with NumberedCanvas...")
doc.build(story, canvasmaker=NumberedCanvas)
print(f"PDF Build COMPLETE: {pdf_out_path}")
print(f"File size: {os.path.getsize(pdf_out_path):,} bytes.")
