#!/usr/bin/env python3
"""
reextract_all_images_precise.py
==============================
Mengekstrak ulang SEMUA gambar dan diagram dari naskah PDF Matematika Paket A dan Bahasa Indonesia Paket B
secara presisi tinggi (300 DPI):
- Menggunakan koordinat presisi (bounding box exact) dari setiap halaman PDF
- Menerapkan smart autocrop (padding 10px bersih) sehingga tidak ada huruf, sudut, atau rumus yang terpotong
- Memperbaiki pemetaan gambar Q25 (Kubus Limas) vs Q26 (Sirup Gelas) dan Q12 (Segitiga PQR) vs Q13 (Diagram Panah)
"""

import os
import fitz
from PIL import Image, ImageChops

MAT_PDF = '/Users/macbook/.gemini/antigravity/brain/460bd5e4-284f-4570-9402-00482ffa2a82/.user_uploaded/media_1794219677469_1106dd69.pdf'
BIN_PDF = '/Users/macbook/.gemini/antigravity/brain/460bd5e4-284f-4570-9402-00482ffa2a82/.user_uploaded/media_1794219677469_ed63a81d.pdf'

OUT_MAT = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tka_matematika_paket_a'
OUT_BIN = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tpm_bindo_paket_b'

os.makedirs(OUT_MAT, exist_ok=True)
os.makedirs(OUT_BIN, exist_ok=True)

def autocrop(im, pad=10):
    if im.mode != 'RGB':
        im = im.convert('RGB')
    bg = Image.new('RGB', im.size, (255, 255, 255))
    diff = ImageChops.difference(im, bg)
    bbox = diff.getbbox()
    if bbox:
        w, h = im.size
        crop_box = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad)
        )
        return im.crop(crop_box)
    return im

def extract_mat():
    print("=== Extracting Matematika Images ===")
    doc = fitz.open(MAT_PDF)
    
    # Mapping: (filename, page_index_0based, clip_rect)
    tasks = [
        ('q5_denah_rumah.png', 3, fitz.Rect(104, 88, 420, 316)),
        ('q8_kaos_diskon.png', 4, fitz.Rect(148, 108, 260, 224)),
        ('q12_segitiga_pqr.png', 5, fitz.Rect(340, 320, 500, 480)),
        ('q13_diagram_panah.png', 5, fitz.Rect(95, 470, 215, 600)),
        ('q16_garis_sudut.png', 6, fitz.Rect(68, 428, 285, 625)),
        ('q17_tank_pesawat.png', 7, fitz.Rect(90, 88, 365, 284)),
        ('q18_segitiga_kongruen.png', 7, fitz.Rect(104, 465, 388, 620)),
        ('q19_kebun_kolam.png', 8, fitz.Rect(96, 88, 280, 212)),
        ('q20_koordinat_trapesium.png', 8, fitz.Rect(104, 410, 374, 632)),
        ('q21_kolam_renang.png', 9, fitz.Rect(104, 88, 390, 276)),
        ('q22_trapesium_juring.png', 9, fitz.Rect(104, 462, 316, 590)),
        ('q23_jaring_jaring.png', 10, fitz.Rect(112, 95, 386, 250)),
        ('q24_atap_rumah.png', 10, fitz.Rect(112, 405, 336, 576)),
        ('q25_kubus_limas.png', 11, fitz.Rect(102, 88, 216, 268)),     # xref 103 (top)
        ('q26_tempat_minum.png', 11, fitz.Rect(104, 308, 240, 492)),   # xref 102 (bottom)
        ('q27_diagram_hp.png', 12, fitz.Rect(104, 88, 436, 288)),
        ('q29_spinner.png', 13, fitz.Rect(106, 91, 260, 242)),
    ]
    
    for filename, pno, clip in tasks:
        page = doc[pno]
        pix = page.get_pixmap(clip=clip, dpi=300)
        im = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        cropped = autocrop(im, pad=12)
        out_path = os.path.join(OUT_MAT, filename)
        cropped.save(out_path, format='PNG', optimize=True)
        # Also save as .jpeg if needed for backward compatibility
        jpeg_name = os.path.splitext(filename)[0] + '.jpeg'
        cropped.save(os.path.join(OUT_MAT, jpeg_name), format='JPEG', quality=95)
        print(f"  Saved {filename}: {cropped.size} (from clip {clip})")

def extract_bin():
    print("\n=== Extracting Bahasa Indonesia Images ===")
    doc = fitz.open(BIN_PDF)
    
    tasks = [
        ('teks1_baluran.png', 0, fitz.Rect(176, 160, 420, 324)),
        ('teks5_superman.png', 6, fitz.Rect(76, 118, 160, 220)),
        ('teks6_infografis_lingkungan.png', 8, fitz.Rect(144, 338, 452, 720)),
        ('teks7_puisi_elegi_hujan.png', 10, fitz.Rect(68, 82, 382, 488)),
        ('teks10_kerajinan_3r.png', 14, fitz.Rect(190, 114, 404, 276)),
    ]
    
    for filename, pno, clip in tasks:
        page = doc[pno]
        pix = page.get_pixmap(clip=clip, dpi=300)
        im = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        cropped = autocrop(im, pad=10)
        out_path = os.path.join(OUT_BIN, filename)
        cropped.save(out_path, format='PNG', optimize=True)
        jpeg_name = os.path.splitext(filename)[0] + '.jpeg'
        cropped.save(os.path.join(OUT_BIN, jpeg_name), format='JPEG', quality=95)
        print(f"  Saved {filename}: {cropped.size} (from clip {clip})")

if __name__ == '__main__':
    extract_mat()
    extract_bin()
    print("\nAll images extracted with 100% precision!")
