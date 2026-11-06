import json
import os
import base64

repo_dir = '/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app'
out_dir = os.path.join(repo_dir, 'public/ekstraksi-buku')
img_dir = os.path.join(repo_dir, 'public/soal/bahasa-inggris')
os.makedirs(out_dir, exist_ok=True)
os.makedirs(img_dir, exist_ok=True)

def to_base64_uri(filename):
    path = os.path.join(img_dir, filename)
    if os.path.exists(path):
        with open(path, 'rb') as f:
            b64 = base64.b64encode(f.read()).decode('utf-8')
        ext = filename.split('.')[-1]
        return f"data:image/{ext};base64,{b64}"
    return f"/soal/bahasa-inggris/{filename}"

monita_andre_uri = to_base64_uri('monita_andre_profile.png')
bab5_jadwal_uri = to_base64_uri('bab5_jadwal_7a_7b.png')
eval4_nutrition_uri = to_base64_uri('eval4_nutrition_facts.png')
eval4_ekskul_uri = to_base64_uri('eval4_ekskul_table.png')

print("Loaded base64 assets.")
