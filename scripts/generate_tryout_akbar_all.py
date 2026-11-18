import json, base64, os, html

OUT_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku'
MAT_IMG_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tka_matematika_paket_a'
BIN_IMG_DIR = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tryout_tpm_bindo_paket_b'

os.makedirs(OUT_DIR, exist_ok=True)

def b64_img(folder, filename):
    path = os.path.join(folder, filename)
    if not os.path.exists(path):
        return ""
    ext = os.path.splitext(filename)[1].lower().replace('.', '')
    mime = 'image/png' if ext == 'png' else 'image/jpeg'
    with open(path, 'rb') as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f"data:{mime};base64,{data}"

print("Helper ready")
