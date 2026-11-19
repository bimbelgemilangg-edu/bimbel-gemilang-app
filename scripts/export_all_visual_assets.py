import fitz
import os
import re

BASE_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app"
PDF_DIR = os.path.join(BASE_DIR, "public/modul-pdf")
ASSETS_DIR = os.path.join(BASE_DIR, "public/modul-assets")

PAGES_DIR = os.path.join(ASSETS_DIR, "pages")
ILLUST_DIR = os.path.join(ASSETS_DIR, "illustrations")
CHEAT_DIR = os.path.join(ASSETS_DIR, "cheatsheet")
TRYOUT_DIR = os.path.join(ASSETS_DIR, "tryout")

for d in [PAGES_DIR, ILLUST_DIR, CHEAT_DIR, TRYOUT_DIR]:
    os.makedirs(d, exist_ok=True)

CONFIGS = [
    ("mtk", "Modul_Master_TKA_SMP_Matematika_2027.pdf"),
    ("bin", "Modul_Master_TKA_SMP_Bahasa_Indonesia_2027.pdf"),
    ("ipa", "Modul_Master_TKA_SMP_IPA_2027.pdf"),
    ("big", "Modul_Master_TKA_SMP_Bahasa_Inggris_2027.pdf"),
]

def run():
    for code, pdf_name in CONFIGS:
        pdf_path = os.path.join(PDF_DIR, pdf_name)
        print(f"\nRendering & extracting visuals for {code.upper()} from {pdf_name}...")
        doc = fitz.open(pdf_path)
        
        # 1. Cheat Sheet (Page 43, 0-indexed 42)
        p43 = doc[42]
        pix43 = p43.get_pixmap(dpi=140)
        c_path = os.path.join(CHEAT_DIR, f"cheatsheet_{code}.png")
        pix43.save(c_path)
        print(f"  -> Saved Cheat Sheet: {c_path} ({pix43.width}x{pix43.height})")
        
        # 2. Tryout & Peta Belajar (Page 51 & 52, 0-indexed 50 & 51)
        p51 = doc[50]
        pix51 = p51.get_pixmap(dpi=140)
        t51_path = os.path.join(TRYOUT_DIR, f"tryout_{code}_p51.png")
        pix51.save(t51_path)
        
        p52 = doc[51]
        pix52 = p52.get_pixmap(dpi=140)
        t52_path = os.path.join(TRYOUT_DIR, f"tryout_{code}_p52.png")
        pix52.save(t52_path)
        print(f"  -> Saved Tryout & Peta: {t51_path}, {t52_path}")
        
        # 3. Unit Slide Pages (Pages 4-13, 16-25, 28-40, 44-49)
        unit_pages = list(range(4, 14)) + list(range(16, 26)) + list(range(28, 41)) + list(range(44, 50))
        for p_no in unit_pages:
            p_idx = p_no - 1
            page = doc[p_idx]
            pix = page.get_pixmap(dpi=120)
            page_path = os.path.join(PAGES_DIR, f"{code}_p{p_no}.png")
            pix.save(page_path)
            
            # Check for embedded content images
            for img in page.get_images(full=True):
                xref = img[0]
                base_img = doc.extract_image(xref)
                w, h = base_img["width"], base_img["height"]
                ext = base_img["ext"]
                if (w == 293 and h == 140) or (w < 80 or h < 80):
                    continue
                ill_path = os.path.join(ILLUST_DIR, f"{code}_p{p_no}.{ext}")
                with open(ill_path, "wb") as f:
                    f.write(base_img["image"])

        print(f"  -> Rendered {len(unit_pages)} unit slides for {code.upper()}")

if __name__ == "__main__":
    run()
