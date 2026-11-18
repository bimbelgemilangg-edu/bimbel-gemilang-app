#!/usr/bin/env python3
"""
scripts/fetch_ambis_ptn.py
Mengambil seluruh data 173 PTN dan jurusannya dari API AmbisPTN,
lalu menyusunnya menjadi format JSON bersih untuk Bimbel Gemilang.
"""

import urllib.request
import json
import time
import os
import sys

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*'
}

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def main():
    print("Mulai mengambil data 173 PTN dari AmbisPTN...")
    all_universities = []
    
    # Ambil page 1 dan 2 (total 173 PTN)
    for page in [1, 2]:
        url = f"https://ambisptn.com/api/v1/universities/?page={page}&page_size=100"
        print(f"Fetching: {url}")
        try:
            data = fetch_json(url)
            results = data.get('results', [])
            all_universities.extend(results)
            print(f"  Dapat {len(results)} PTN (Total sejauh ini: {len(all_universities)})")
        except Exception as e:
            print(f"  Error pada page {page}: {e}")
        time.sleep(0.5)

    print(f"\nBerhasil mengambil {len(all_universities)} PTN.")
    
    # Ambil detail masing-masing PTN (lengkap dengan array jurusannya)
    ptn_full_list = []
    all_majors_flattened = []
    
    print("\nMulai mengambil daftar jurusan untuk setiap PTN...")
    for idx, uni in enumerate(all_universities, 1):
        slug = uni.get('slug')
        if not slug:
            continue
        url = f"https://ambisptn.com/api/v1/universities/{slug}/"
        try:
            detail = fetch_json(url)
            majors = detail.get('majors', [])
            
            # Format logo resmi CDN
            logo_url = uni.get('logo_url') or f"https://pub-2e9177a2ddc44249bf5d7ec937bdae0a.r2.dev/universities/logos/{slug}.png"
            
            uni_formatted = {
                'id': uni.get('id'),
                'slug': slug,
                'name': uni.get('name'),
                'short_name': uni.get('short_name') or slug.upper(),
                'city': uni.get('city'),
                'province': uni.get('province') or 'Indonesia',
                'accreditation': uni.get('accreditation') or 'A',
                'logo_url': logo_url,
                'website': uni.get('website'),
                'major_count': len(majors) or uni.get('major_count', 0),
                'majors': []
            }
            
            for m in majors:
                m_slug = m.get('slug') or f"{slug}-{m.get('id')}"
                major_item = {
                    'id': m.get('id'),
                    'slug': m_slug,
                    'name': m.get('name'),
                    'uni_slug': slug,
                    'uni_name': uni.get('name'),
                    'uni_short': uni.get('short_name') or slug.upper(),
                    'uni_logo': logo_url,
                    'degree_type': m.get('degree_type') or 'Sarjana',
                    'rumpun': m.get('rumpun') or 'saintek',
                    'rumpun_label': m.get('rumpun_label') or (m.get('rumpun') or '').capitalize(),
                    'accreditation': m.get('accreditation') or 'Unggul',
                    'capacity': m.get('capacity') or 50,
                    'passing_score': m.get('passing_score') or 700.0,
                    'selectivity': m.get('selectivity') or 0.03,
                    'stat_year': m.get('stat_year') or 2026
                }
                uni_formatted['majors'].append(major_item)
                all_majors_flattened.append(major_item)
                
            ptn_full_list.append(uni_formatted)
            print(f"[{idx}/{len(all_universities)}] {uni.get('name')} -> {len(majors)} prodi")
        except Exception as e:
            print(f"[{idx}/{len(all_universities)}] Gagal fetch {slug}: {e}")
            # Fallback jika gagal fetch detail: masukkan PTN tanpa prodi
            ptn_full_list.append(uni)
        time.sleep(0.15)
        
    output_data = {
        'total_ptn': len(ptn_full_list),
        'total_majors': len(all_majors_flattened),
        'universities': ptn_full_list,
        'majors': all_majors_flattened,
        'generated_at': time.strftime('%Y-%m-%dT%H:%M:%S+07:00')
    }
    
    out_path = 'src/data/ambisPtnData.json'
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)
        
    print(f"\nSELESAI! Tersimpan di {out_path} ({len(ptn_full_list)} PTN, {len(all_majors_flattened)} prodi).")

if __name__ == '__main__':
    main()
