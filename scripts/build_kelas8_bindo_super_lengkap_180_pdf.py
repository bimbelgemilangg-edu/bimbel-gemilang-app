#!/usr/bin/env python3
"""
build_kelas8_bindo_super_lengkap_180_pdf.py
===========================================
Menghasilkan Buku Master PDF Publikasi Resmi Bahasa Indonesia SMP Kelas 8 Super Lengkap:
- 6 Bab Buku Teks Bahasa Indonesia SMP Kelas 8 Lengkap:
  * Bab I: Menulis Teks LHO (Sifat Objektif, Struktur LHO, Kalimat Fakta, & Kaidah Bahasa EYD V)
  * Bab II: Menulis Iklan, Slogan, Poster (Komersial vs ILM, Kalimat Persuasif & Imperatif)
  * Bab III: Menulis Artikel Ilmiah Populer (Pemilahan Fakta vs Opini, Perbandingan, & Triangulasi)
  * Bab IV: Mengulas Karya Fiksi (Unsur Intrinsik Cerpen/Novel/Film, & Makna Denotasi vs Konotasi)
  * Bab V: Menciptakan Puisi (Puisi Modern, Puisi Diafan vs Prismatis, Diksi, Citraan, & Majas)
  * Bab VI: Menulis Teks Pidato (Tiga Struktur Pidato, Metode Berpidato, & Kata Sapaan Baku)
Total: 180 Butir Soal Lengkap (30 Butir per Bab).
Disertai Ilustrasi & Diagram Asli Naskah Ujian TKA / ASPD.
"""

import os
import json
import html
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
JSON_PATH = os.path.join(OUT_DIR, 'kelas8_bindo_super_lengkap_180soal.json')
PDF_OUT = os.path.join(OUT_DIR, 'Buku_Soal_Bahasa_Indonesia_SMP_Kelas8_Super_Lengkap_180Soal.pdf')

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
            self.drawString(130, A4[1] - 30, '|  Master Bank Soal Super Lengkap Bahasa Indonesia SMP Kelas 8 (180 Soal)')
            
            self.setStrokeColor(colors.HexColor('#e2e8f0'))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 35, A4[0] - 40, A4[1] - 35)
            
            # Running Footer
            self.line(40, 35, A4[0] - 40, 35)
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            self.drawString(40, 24, 'Kurikulum Merdeka Fase D • Edisi Super Lengkap Wacana Literasi & Pembahasan')
            page_text = f"Halaman {self._pageNumber} dari {page_count}"
            self.drawRightString(A4[0] - 40, 24, page_text)
            
            self.restoreState()

def build_pdf():
    print(f"Reading JSON data from {JSON_PATH}...")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        questions = json.load(f)
        
    print(f"Loaded {len(questions)} questions.")

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
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=30,
        textColor=colors.HexColor('#0f172a'),
        alignment=1
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0369a1'),
        alignment=1
    )
    
    ch_header_style = ParagraphStyle(
        'ChHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=17,
        textColor=colors.HexColor('#0f172a')
    )
    
    ch_sub_style = ParagraphStyle(
        'ChSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#475569')
    )

    q_num_style = ParagraphStyle(
        'QNum',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0284c7')
    )

    q_text_style = ParagraphStyle(
        'QText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b')
    )
    
    bacaan_style = ParagraphStyle(
        'Bacaan',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    opt_style = ParagraphStyle(
        'OptText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )

    ans_box_style = ParagraphStyle(
        'AnsBox',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#065f46')
    )

    exp_style = ParagraphStyle(
        'ExpText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#047857')
    )

    elements = []

    # ================= COVER PAGE =================
    elements.append(Spacer(1, 40))
    elements.append(Paragraph("BIMBEL GEMILANG EDUKASI", subtitle_style))
    elements.append(Spacer(1, 15))
    elements.append(Paragraph("MASTER BANK SOAL SUPER LENGKAP<br/>BAHASA INDONESIA SMP KELAS 8", title_style))
    elements.append(Spacer(1, 12))
    elements.append(Paragraph("KURIKULUM MERDEKA FASE D • LENGKAP 6 BAB • 180 BUTIR SOAL", subtitle_style))
    elements.append(Spacer(1, 20))
    
    # Overview Table
    overview_data = [
        [Paragraph("<b>Bab & Ruang Lingkup Materi</b>", styles['Normal']), Paragraph("<b>Capaian Literasi & Fokus HOTS</b>", styles['Normal']), Paragraph("<b>Jumlah Soal</b>", styles['Normal'])],
        [Paragraph("<b>Bab I: Menulis Teks LHO</b><br/>Hakikat & Struktur LHO, Kalimat Fakta/Opini, Kaidah EYD V", styles['Normal']), Paragraph("Definisi umum, deskripsi bagian, simpulan, akurasi data objektif, & konjungsi intrakalimat", styles['Normal']), Paragraph("30 Soal", styles['Normal'])],
        [Paragraph("<b>Bab II: Menulis Iklan, Slogan, Poster</b><br/>Iklan Komersial vs ILM, Kalimat Persuasif & Imperatif", styles['Normal']), Paragraph("Struktur iklan, diksi persuasif, analisis pesan ganda, daya tarik visual & tipografi", styles['Normal']), Paragraph("30 Soal", styles['Normal'])],
        [Paragraph("<b>Bab III: Menulis Artikel Ilmiah Populer</b><br/>Fakta vs Opini, Kalimat Perbandingan, Analogi, & Triangulasi", styles['Normal']), Paragraph("Metode survei kuesioner, wawancara mendalam, sintesis data, & bahasa komunikatif", styles['Normal']), Paragraph("30 Soal", styles['Normal'])],
        [Paragraph("<b>Bab IV: Mengulas Karya Fiksi</b><br/>Unsur Intrinsik Cerpen/Novel/Film, & Makna Denotasi vs Konotasi", styles['Normal']), Paragraph("Identitas, orientasi, sinopsis, analisis tokoh/alur, evaluasi kelebihan/kekurangan", styles['Normal']), Paragraph("30 Soal", styles['Normal'])],
        [Paragraph("<b>Bab V: Menciptakan Puisi</b><br/>Puisi Modern, Diafan vs Prismatis, Diksi, Citraan, & Majas", styles['Normal']), Paragraph("Apresiasi makna batin/fisik, majas personifikasi/metafora, rima, & metode 3M", styles['Normal']), Paragraph("30 Soal", styles['Normal'])],
        [Paragraph("<b>Bab VI: Menulis Teks Pidato</b><br/>Struktur Pidato Persuasif, Empat Metode, & Sapaan Baku", styles['Normal']), Paragraph("Pendahuluan, isi berargumen data, penutup persuasif, & sapaan kehormatan EYD V", styles['Normal']), Paragraph("30 Soal", styles['Normal'])],
        [Paragraph("<b>TOTAL BANK SOAL MASTER</b>", styles['Normal']), Paragraph("<b>Standar Literasi Membaca Asesmen Akademik & TKA/ASPD SMP</b>", styles['Normal']), Paragraph("<b>180 Soal</b>", styles['Normal'])],
    ]
    t_over = Table(overview_data, colWidths=[200, 240, 75])
    t_over.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#f1f5f9')),
    ]))
    elements.append(t_over)
    elements.append(Spacer(1, 30))
    elements.append(PageBreak())

    # ================= QUESTIONS =================
    curr_paket = ""
    for idx, q in enumerate(questions):
        paket = q.get('paket', '')
        if paket != curr_paket:
            curr_paket = paket
            if idx > 0:
                elements.append(PageBreak())
                
            header_table = Table([
                [
                    Paragraph(f"<b>{paket.upper()}</b>", ch_header_style),
                ],
                [
                    Paragraph(f"<b>Materi Pokok:</b> {q.get('materi', '')}<br/><b>Capaian Pembelajaran:</b> {q.get('capaian_pembelajaran', '')}", ch_sub_style)
                ]
            ], colWidths=[515])
            header_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#0284c7')),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('RIGHTPADDING', (0,0), (-1,-1), 12),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
            ]))
            elements.append(header_table)
            elements.append(Spacer(1, 14))

        q_flow = []
        # Question Number & Text
        q_num = q.get('nomor', idx + 1)
        q_flow.append(Paragraph(f"Soal Nomor {q_num} • {q.get('paket', '')}", q_num_style))
        q_flow.append(Spacer(1, 3))

        # Wacana
        bacaan = q.get('bacaan')
        if bacaan and bacaan.get('teks'):
            b_text = html.escape(bacaan.get('teks')).replace('\n', '<br/>')
            b_table = Table([[Paragraph(f"<b>WACANA / BACAAN STIMULUS:</b><br/>{b_text}", bacaan_style)]], colWidths=[515])
            b_table.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
                ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
                ('LEFTPADDING', (0,0), (-1,-1), 8),
                ('RIGHTPADDING', (0,0), (-1,-1), 8),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ]))
            q_flow.append(b_table)
            q_flow.append(Spacer(1, 5))

        # Images
        imgs = q.get('gambar', [])
        for img_rel in imgs:
            img_full = os.path.join(REPO_DIR, 'public', img_rel.lstrip('/'))
            if os.path.exists(img_full):
                try:
                    rl_img = RLImage(img_full, width=220, height=140)
                    q_flow.append(rl_img)
                    q_flow.append(Spacer(1, 4))
                except Exception as e:
                    print(f"Error loading image {img_full}: {e}")

        # Teks Soal
        t_soal = html.escape(q.get('teks_soal', '')).replace('\n', '<br/>')
        q_flow.append(Paragraph(t_soal, q_text_style))
        q_flow.append(Spacer(1, 5))

        # Options
        for opt in q.get('opsi_jawaban', []):
            lbl = opt.get('label', '')
            txt = html.escape(opt.get('teks', ''))
            q_flow.append(Paragraph(f"<b>{lbl}.</b> {txt}", opt_style))
            q_flow.append(Spacer(1, 2))

        # Answer & Explanation Box
        kunci = q.get('kunci_jawaban', '')
        pemb = html.escape(q.get('pembahasan', '')).replace('\n', '<br/>')
        exp_table = Table([
            [Paragraph(f"<b>Kunci Jawaban: {kunci}</b>", ans_box_style)],
            [Paragraph(f"<b>Pembahasan:</b> {pemb}", exp_style)]
        ], colWidths=[515])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#a7f3d0')),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        q_flow.append(Spacer(1, 4))
        q_flow.append(exp_table)
        q_flow.append(Spacer(1, 10))
        q_flow.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=8))

        elements.append(KeepTogether(q_flow))

    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"PDF Generated successfully: {PDF_OUT}")

if __name__ == '__main__':
    build_pdf()
