#!/usr/bin/env python3
import os

with open('scripts/data_tka_matematika.py', 'r', encoding='utf-8') as f:
    mat_code = f.read()

mat_replacements = [
    ('q5_denah_rumah.jpeg', 'q5_denah_rumah.png', 520),
    ('q8_kaos_diskon.jpeg', 'q8_kaos_diskon.png', 260),
    ('q12_segitiga_pqr.png', 'q12_segitiga_pqr.png', 320),
    ('q13_diagram_panah.png', 'q13_diagram_panah.png', 280),
    ('q16_garis_sudut.png', 'q16_garis_sudut.png', 360),
    ('q17_tank_pesawat.jpeg', 'q17_tank_pesawat.png', 460),
    ('q18_segitiga_kongruen.jpeg', 'q18_segitiga_kongruen.png', 480),
    ('q19_kebun_kolam.jpeg', 'q19_kebun_kolam.png', 420),
    ('q20_koordinat_trapesium.png', 'q20_koordinat_trapesium.png', 460),
    ('q21_kolam_renang.jpeg', 'q21_kolam_renang.png', 480),
    ('q22_highres.png', 'q22_trapesium_juring.png', 400),
    ('q23_jaring_jaring.png', 'q23_jaring_jaring.png', 480),
    ('q24_atap_rumah.jpeg', 'q24_atap_rumah.png', 440),
    ('q25_kubus_limas.png', 'q25_kubus_limas.png', 300),
    ('q26_tempat_minum.jpeg', 'q26_tempat_minum.png', 320),
    ('q27_diagram_hp.png', 'q27_diagram_hp.png', 540),
    ('q29_spinner.jpeg', 'q29_spinner.png', 320)
]

for old, new, mw in mat_replacements:
    target = f'get_b64("{old}")'
    assert target in mat_code, f'Missing {target}'
    replacement = f'get_b64("{new}"), "url": "/soal/tryout_tka_matematika_paket_a/{new}", "max_width": {mw}'
    mat_code = mat_code.replace(target, replacement)

with open('scripts/data_tka_matematika.py', 'w', encoding='utf-8') as f:
    f.write(mat_code)
print('Updated data_tka_matematika.py successfully')

with open('scripts/data_tpm_bahasa_indonesia.py', 'r', encoding='utf-8') as f:
    bin_code = f.read()

bin_replacements = [
    ('teks1_baluran.jpeg', 'teks1_baluran.png', 480),
    ('teks5_superman.jpeg', 'teks5_superman.png', 260),
    ('teks6_infografis_lingkungan.jpeg', 'teks6_infografis_lingkungan.png', 560),
    ('teks7_puisi_elegi_hujan.jpeg', 'teks7_puisi_elegi_hujan.png', 560),
    ('teks10_kerajinan_3r.jpeg', 'teks10_kerajinan_3r.png', 460),
]

for old, new, mw in bin_replacements:
    target = f'get_b64("{old}")'
    assert target in bin_code, f'Missing {target}'
    replacement = f'get_b64("{new}"), "url": "/soal/tryout_tpm_bindo_paket_b/{new}", "max_width": {mw}'
    bin_code = bin_code.replace(target, replacement)

with open('scripts/data_tpm_bahasa_indonesia.py', 'w', encoding='utf-8') as f:
    f.write(bin_code)
print('Updated data_tpm_bahasa_indonesia.py successfully')
