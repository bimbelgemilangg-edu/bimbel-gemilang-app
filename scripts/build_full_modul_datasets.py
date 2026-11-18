#!/usr/bin/env python3
"""
build_full_modul_datasets.py
Generates the complete 7 subtest module files (46 chapters total) for Bimbel Gemilang.
"""
import os
import json

MODUL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src', 'data', 'modul')
os.makedirs(MODUL_DIR, exist_ok=True)

def write_js_file(filename, var_name, data):
    filepath = os.path.join(MODUL_DIR, filename)
    code = f"""// src/data/modul/{filename}
// Modul Belajar UTBK-SNBT Bimbel Gemilang (AmbisPTN Micro-learning Standard)
// 100% UNLOCKED & TERINTEGRASI

export const {var_name} = {json.dumps(data, indent=2, ensure_ascii=False)};
"""
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(code)
    print(f"✅ Generated {len(data)} chapters into {filename}")

# Import existing PU from generator or define directly
from generate_modul_datasets import PU_DATA

write_js_file('puModul.js', 'PU_MODUL', PU_DATA)
