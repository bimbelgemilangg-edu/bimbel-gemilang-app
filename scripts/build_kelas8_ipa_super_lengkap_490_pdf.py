#!/usr/bin/env python3
"""
build_kelas8_ipa_super_lengkap_490_pdf.py
=========================================
Menghasilkan Buku Master PDF Publikasi Resmi IPA SMP Kelas 8 Super Lengkap:
- 7 Bab Buku Teks IPA SMP Kelas 8 Lengkap:
  * Bab I: Struktur & Fungsi Tubuh Makhluk Hidup I (Nutrisi, Pencernaan, Darah, Aditif)
  * Bab II: Struktur & Fungsi Tubuh Makhluk Hidup II (Pernapasan, Ekskresi, Gerak)
  * Bab III: Usaha, Energi, dan Pesawat Sederhana (Tuas, Katrol, Bidang Miring)
  * Bab IV: Getaran, Gelombang, dan Cahaya (Resonansi, Cermin, Lensa, Mata)
  * Bab V: Unsur, Senyawa, dan Campuran (Atom, Ion, Koloid, Tyndall)
  * Bab VI: Pemisahan Campuran di Sekitar Kita (Distilasi, Kromatografi, Filtrasi)
  * Bab VII: Struktur Bumi, Tanah, & Kebencanaan (Lempeng, Gempa, Tsunami, Horizon Tanah)
Total: 490 Butir Soal Lengkap (70 Butir per Bab)
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
IMG_DIR = os.path.join(REPO_DIR, 'public/soal/ipa')
JSON_PATH = os.path.join(OUT_DIR, 'kelas8_ipa_super_lengkap_490soal.json')
PDF_OUT = os.path.join(OUT_DIR, 'Buku_Soal_IPA_SMP_Kelas8_Super_Lengkap_490Soal.pdf')

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
            self.drawString(130, A4[1] - 30, '|  IPA SMP Kelas VIII Super Lengkap (490 Butir Soal)')
            
            self.setStrokeColor(colors.HexColor('#cbd5e1'))
            self.setLineWidth(0.5)
            self.line(40, A4[1] - 34, A4[0] - 40, A4[1] - 34)
            
            # Running Footer
            self.line(40, 40, A4[0] - 40, 40)
            self.setFont('Helvetica-Bold', 8)
            self.setFillColor(colors.HexColor('#0f172a'))
            self.drawString(40, 28, 'BIMBEL GEMILANG — PUSAT BANK SOAL & MODUL DIGITAL')
            
            self.setFont('Helvetica', 8)
            self.setFillColor(colors.HexColor('#64748b'))
            page_text = f'Halaman {self._pageNumber} dari {page_count}'
            self.drawRightString(A4[0] - 40, 28, page_text)
            
            self.restoreState()

def build_pdf():
    print(f"Reading: {JSON_PATH}")
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        questions = json.load(f)
        
    print(f"Loaded {len(questions)} questions")
    
    doc = SimpleDocTemplate(
        PDF_OUT,
        pagesize=A4,
        leftMargin=40,
        rightMargin=40,
        topMargin=46,
        bottomMargin=48
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
        textColor=colors.HexColor('#ffffff'),
        alignment=0
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
    
    opt_style = ParagraphStyle(
        'Opt',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#334155')
    )
    
    pemb_style = ParagraphStyle(
        'Pemb',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor('#475569')
    )

    story = []
    
    # COVER PAGE
    story.append(Spacer(1, 40))
    story.append(Paragraph('BIMBEL GEMILANG', subtitle_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph('BUKU MASTER BANK SOAL LENGKAP<br/>ILMU PENGETAHUAN ALAM (IPA) SMP KELAS VIII', title_style))
    story.append(Spacer(1, 12))
    story.append(Paragraph('KOMPILASI 7 BAB BUKU TEKS & KURIKULUM MERDEKA FASE D<br/>490 BUTIR SOAL LENGKAP (70 SOAL PER BAB)', subtitle_style))
    story.append(Spacer(1, 24))
    
    meta_box = [
        [Paragraph('<b>Jenjang / Fase:</b> SMP / Fase D', opt_style), Paragraph('<b>Mata Pelajaran:</b> IPA Terpadu (Fisika, Kimia, Biologi)', opt_style)],
        [Paragraph('<b>Kelas:</b> VIII (Delapan) SMP/MTs', opt_style), Paragraph('<b>Total Butir Soal:</b> 490 Butir Soal Lengkap', opt_style)],
        [Paragraph('<b>Komposisi Soal:</b>', opt_style), Paragraph('25 Suplemen HOTS + 10 Contoh Soal + 30 Latihan + 5 AKM per Bab', opt_style)],
        [Paragraph('<b>Format Berkas:</b> PDF Resmi & HTML Import', opt_style), Paragraph('<b>Status Validasi:</b> 100% Valid (0 Error)', opt_style)]
    ]
    meta_table = Table(meta_box, colWidths=[240, 275])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 30))
    
    # DAFTAR ISI TABLE
    story.append(Paragraph('<b>DAFTAR BAB & DISTRIBUSI SOAL KELAS VIII SMP:</b>', q_num_style))
    story.append(Spacer(1, 8))
    
    toc_data = [
        ['Bab', 'Topik Pembelajaran', 'Rentang Soal', 'Jumlah'],
        ['Bab I', 'Struktur & Fungsi Tubuh I: Nutrisi, Pencernaan, Peredaran Darah, & Aditif', 'Soal #1 – #70', '70 Soal'],
        ['Bab II', 'Struktur & Fungsi Tubuh II: Pernapasan, Ekskresi, & Sistem Gerak', 'Soal #71 – #140', '70 Soal'],
        ['Bab III', 'Usaha, Daya, Energi, & Pesawat Sederhana (Tuas, Katrol, Bidang Miring)', 'Soal #141 – #210', '70 Soal'],
        ['Bab IV', 'Getaran, Gelombang, & Cahaya (Resonansi, Cermin, Lensa, & Cacat Mata)', 'Soal #211 – #280', '70 Soal'],
        ['Bab V', 'Unsur, Senyawa, Campuran, dan Struktur Atom-Ion-Molekul', 'Soal #281 – #350', '70 Soal'],
        ['Bab VI', 'Pemisahan Campuran di Sekitar Kita (Filtrasi, Distilasi, Kromatografi)', 'Soal #351 – #420', '70 Soal'],
        ['Bab VII', 'Struktur Bumi, Profil Tanah, Kebencanaan, & Mitigasi', 'Soal #421 – #490', '70 Soal'],
        ['Total', 'Kompilasi Seluruh Soal IPA SMP Kelas 8 Lengkap', 'Soal #1 – #490', '490 Soal']
    ]
    toc_table = Table(toc_data, colWidths=[55, 290, 100, 70])
    toc_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 8),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
        ('ALIGN', (2,0), (-1,-1), 'CENTER'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('BACKGROUND', (0,1), (-1,-2), colors.HexColor('#ffffff')),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#e2e8f0')),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(toc_table)
    story.append(PageBreak())
    
    # RENDER QUESTIONS
    current_chapter = None
    
    ch_titles = {
        1: 'BAB I: STRUKTUR & FUNGSI TUBUH MAKHLUK HIDUP I',
        2: 'BAB II: STRUKTUR & FUNGSI TUBUH MAKHLUK HIDUP II',
        3: 'BAB III: USAHA, ENERGI, DAN PESAWAT SEDERHANA',
        4: 'BAB IV: GETARAN, GELOMBANG, DAN CAHAYA',
        5: 'BAB V: UNSUR, SENYAWA, DAN CAMPURAN',
        6: 'BAB VI: PEMISAHAN CAMPURAN DI SEKITAR KITA',
        7: 'BAB VII: STRUKTUR BUMI, TANAH, DAN KEBENCANAAN'
    }
    
    for q in questions:
        ch = q.get('bab_angka', 1)
        if ch != current_chapter:
            current_chapter = ch
            if story and not isinstance(story[-1], PageBreak):
                story.append(PageBreak())
            
            ch_box = [[Paragraph(f'<b>{ch_titles.get(ch, "BAB " + str(ch))}</b>', ch_header_style)]]
            t_ch = Table(ch_box, colWidths=[515])
            t_ch.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#0369a1')),
                ('TOPPADDING', (0,0), (-1,-1), 8),
                ('BOTTOMPADDING', (0,0), (-1,-1), 8),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
            ]))
            story.append(t_ch)
            story.append(Spacer(1, 10))
            
        q_elements = []
        
        # Paket & Nomor Header
        num_str = f"Soal #{q.get('nomor_global', q.get('nomor', ''))}"
        paket_str = q.get('paket', '')
        q_elements.append(Paragraph(f"<b>{num_str}</b> | <font color='#64748b'>{paket_str}</font>", q_num_style))
        story.append(Spacer(1, 2))
        
        # Soal text
        soal_text = q.get('teks_soal') or q.get('soal', '')
        # Escape any rogue & or < characters in text for reportlab paragraph
        safe_soal = html.escape(soal_text).replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>').replace('&lt;i&gt;', '<i>').replace('&lt;/i&gt;', '</i>')
        q_elements.append(Paragraph(safe_soal, q_text_style))
        q_elements.append(Spacer(1, 3))
        
        # Options
        opts = q.get('opsi_jawaban') or q.get('opsi', [])
        if opts:
            opt_rows = []
            if len(opts) == 4:
                opt_rows.append([
                    Paragraph(f"<b>A.</b> {html.escape(opts[0]['teks'])}", opt_style),
                    Paragraph(f"<b>B.</b> {html.escape(opts[1]['teks'])}", opt_style)
                ])
                opt_rows.append([
                    Paragraph(f"<b>C.</b> {html.escape(opts[2]['teks'])}", opt_style),
                    Paragraph(f"<b>D.</b> {html.escape(opts[3]['teks'])}", opt_style)
                ])
                t_opts = Table(opt_rows, colWidths=[255, 260])
                t_opts.setStyle(TableStyle([
                    ('VALIGN', (0,0), (-1,-1), 'TOP'),
                    ('TOPPADDING', (0,0), (-1,-1), 1),
                    ('BOTTOMPADDING', (0,0), (-1,-1), 1),
                    ('LEFTPADDING', (0,0), (-1,-1), 4),
                ]))
                q_elements.append(t_opts)
            else:
                for o in opts:
                    q_elements.append(Paragraph(f"<b>{o['label']}.</b> {html.escape(o['teks'])}", opt_style))
        
        # Kunci & Pembahasan Box
        kunci = q.get('kunci_jawaban') or q.get('kunci', '')
        pemb = q.get('pembahasan', '')
        safe_pemb = html.escape(pemb).replace('&lt;b&gt;', '<b>').replace('&lt;/b&gt;', '</b>').replace('&lt;i&gt;', '<i>').replace('&lt;/i&gt;', '</i>')
        ans_text = f"<b>Kunci: {kunci}</b> | <b>Pembahasan:</b> {safe_pemb}"
        ans_table = Table([[Paragraph(ans_text, pemb_style)]], colWidths=[515])
        ans_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 3),
            ('BOTTOMPADDING', (0,0), (-1,-1), 3),
            ('LEFTPADDING', (0,0), (-1,-1), 6),
        ]))
        q_elements.append(Spacer(1, 3))
        q_elements.append(ans_table)
        q_elements.append(Spacer(1, 6))
        q_elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#e2e8f0'), spaceAfter=6, spaceBefore=0))
        
        story.append(KeepTogether(q_elements))
        
    print("Building PDF...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF Generated successfully: {PDF_OUT}")

if __name__ == '__main__':
    build_pdf()
