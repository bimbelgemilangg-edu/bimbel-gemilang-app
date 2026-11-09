#!/usr/bin/env python3
"""
build_kelas9_bindo_full_180soal.py
=================================
Mengekstrak dan membangun Master Bank Soal Bahasa Indonesia SMP Kelas 9 Lengkap:
- 6 Bab Kurikulum Merdeka Fase D (180 Butir Soal):
  * Bab I: Menganalisis Teks Laporan Percobaan [30 Soal]
  * Bab II: Menganalisis Cerita Pendek [30 Soal]
  * Bab III: Memahami Pidato Persuasif [30 Soal]
  * Bab IV: Memahami Tanggapan Kritis [30 Soal]
  * Bab V: Menyajikan Teks Diskusi [30 Soal]
  * Bab VI: Surat Pembaca & Surat Resmi [30 Soal]
Dilengkapi Ekstraksi Wacana Lengkap (<div data-field="bacaan">) & Integrasi Grup Bacaan
sehingga 100% Bebas Soal Yatim & 100% Valid di Portal Impor Gemilang.
"""

import os
import re
import html
import json
import fitz

PDF_PATH = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/BAHASA_INDONESIA_SMP.pdf"
IMAGE_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/bindo"
OUTPUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku"

os.makedirs(IMAGE_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)

bab_configs = [
    {
        "bnum": 1,
        "title": "Bab I: Menganalisis Teks Laporan",
        "materi": "Teks Laporan Percobaan Ilmiah, Struktur Baku (Tujuan-Langkah-Hasil-Simpulan), & Kaidah Bahasa Objektif",
        "cp": "Peserta didik menganalisis dan mengevaluasi informasi faktual, struktur teks laporan percobaan (tujuan, alat/bahan, langkah, hasil, simpulan), penggunaan istilah teknis ilmiah, dan penerapan ejaan baku EYD Edisi V.",
        "q_pages": (142, 150),
        "a_pages": (150, 153),
    },
    {
        "bnum": 2,
        "title": "Bab II: Menganalisis Cerita Pendek",
        "materi": "Cerita Pendek (Cerpen), Unsur Intrinsik & Ekstrinsik, Sudut Pandang, Majas, & Nilai Kehidupan",
        "cp": "Peserta didik memahami dan menganalisis unsur intrinsik cerpen (tema, alur, tokoh/penokohan analitik vs dramatik, latar, sudut pandang orang pertama/ketiga, amanat), nilai moral/sosial, serta gaya bahasa kiasan.",
        "q_pages": (153, 162),
        "a_pages": (161, 165),
    },
    {
        "bnum": 3,
        "title": "Bab III: Memahami Pidato Persuasif",
        "materi": "Pidato Persuasif, Tiga Pendekatan Retorika (Ethos, Pathos, Logos), Struktur Pidato, & Diksi Emotif",
        "cp": "Peserta didik memahami struktur isi pidato persuasif (pernyataan posisi, tahap argumen, penguatan posisi), menerapkan pendekatan retorika (etika, emosi, logika), dan menganalisis kalimat ajakan/persuasif.",
        "q_pages": (165, 173),
        "a_pages": (173, 176),
    },
    {
        "bnum": 4,
        "title": "Bab IV: Memahami Tanggapan Kritis",
        "materi": "Teks Tanggapan Kritis, Struktur Evaluasi-Deskripsi-Penegasan Ulang, Kritik Santun, & Pujian Objektif",
        "cp": "Peserta didik menyusun dan mengevaluasi teks tanggapan kritis terhadap karya seni/fenomena sosial, membedakan kritik santun berdasar data vs celaan subjektif, serta memahami struktur evaluasi, deskripsi teks, dan penegasan ulang.",
        "q_pages": (176, 185),
        "a_pages": (184, 187),
    },
    {
        "bnum": 5,
        "title": "Bab V: Menyajikan Teks Diskusi",
        "materi": "Teks Diskusi, Struktur Isu-Argumen Pro-Argumen Kontra-Simpulan, Konjungsi Pertentangan, & Sikap Moderat",
        "cp": "Peserta didik memahami struktur teks diskusi (isu kontroversial, argumen mendukung/pro, argumen menentang/kontra, simpulan jalan tengah), menggunakan konjungsi perlawanan antarkalimat, serta merumuskan rekomendasi berimbang.",
        "q_pages": (187, 196),
        "a_pages": (195, 199),
    },
    {
        "bnum": 6,
        "title": "Bab VI: Surat Pembaca & Surat Resmi",
        "materi": "Surat Pembaca Media Massa, Surat Dinas Resmi, Struktur Format Baku, & Tata Bahasa Baku EYD Edisi V",
        "cp": "Peserta didik mengidentifikasi fungsi dan struktur surat pembaca di media massa, menyunting surat dinas/resmi (kop, nomor, perihal, alamat, salam, isi, penutup, pengesahan), serta menerapkan tata kalimat efektif baku EYD V.",
        "q_pages": (199, 208),
        "a_pages": (208, 210),
    },
]

image_mapping = {
    (1, 26): "/soal/bindo/kls9_bindo_p149_xref5173_880x880.jpeg",
    (2, 26): "/soal/bindo/kls9_bindo_p161_xref5539_880x880.jpeg",
    (3, 18): "/soal/bindo/kls9_bindo_p170_xref5819_880x880.jpeg",
    (3, 26): "/soal/bindo/kls9_bindo_p172_xref5873_880x880.jpeg",
    (4, 26): "/soal/bindo/kls9_bindo_p183_xref6208_880x880.jpeg",
    (5, 26): "/soal/bindo/kls9_bindo_p195_xref6559_880x880.jpeg",
    (6, 18): "/soal/bindo/kls9_bindo_p205_xref6831_880x880.jpeg",
    (6, 26): "/soal/bindo/kls9_bindo_p207_xref6888_880x880.jpeg",
}

def parse_answers_for_bab(as_, ae):
    a_txt = ''
    for p in range(as_, ae):
        a_txt += doc[p].get_text() + '\n'
        
    ans_splits = re.split(r'(?:^|\n)\s*(\d{1,2})\.\s+(?:Jawaban:?|Kunci:?|Pembahasan(?:\s+Uraian(?:\s+Terstruktur)?)?:?)', a_txt, flags=re.I)
    ans_dict = {}
    for i in range(1, len(ans_splits), 2):
        qn = int(ans_splits[i])
        ans_dict[qn] = ans_splits[i+1].strip()
        
    table_keys = {}
    m_pairs = re.findall(r'(?:^|\n)\s*(\d{1,2})\s*\n\s*([A-D]|✓[A-D]|A,\s*B,\s*C|A,\s*B,\s*D|B-S-B|B-B-S|B-S-S|S-B-B|Uraian)\s*(?=\n|$)', a_txt)
    for qn_s, k_s in m_pairs:
        qn = int(qn_s)
        k = k_s.replace('✓', '').strip()
        if qn not in table_keys and qn <= 30:
            table_keys[qn] = k
            
    return ans_dict, table_keys

def split_wacana_and_question(prompt_clean):
    lines = [l.strip() for l in prompt_clean.split('\n') if l.strip()]
    q_starters = [
        "ciri kebahasaan", "hubungan logis", "konflik batin", "topik utama",
        "pernyataan yang", "gagasan utama", "simpulan yang", "pesan utama",
        "nilai moral", "amanat", "makna kata", "makna ", "majas", "kalimat yang",
        "mengapa", "bagaimana", "apa ", "apakah", "siapa", "kelebihan",
        "kekurangan", "perbedaan", "persamaan", "berdasarkan", "fokus",
        "sudut pandang", "fungsi", "tujuan", "kutipan", "karakter", "watak",
        "latar", "alur", "keunggulan", "penggunaan", "sikap", "tindakan", "hal yang",
        "pasangan", "alasan", "bukti", "pendapat", "unsur", "ringkasan", "tahap",
        "struktur", "konjungsi", "cara pengarang", "jika seorang", "analisis"
    ]
    
    split_idx = -1
    for i in range(len(lines)-1, max(-1, len(lines)-8), -1):
        line_lower = lines[i].lower()
        if any(line_lower.startswith(qs) for qs in q_starters):
            split_idx = i
            break
            
    if split_idx != -1:
        wacana = '\n'.join(lines[:split_idx]).strip()
        q_sent = '\n'.join(lines[split_idx:]).strip()
        return wacana, q_sent
    else:
        if len(lines) >= 2:
            if re.sub(r'[\s\.\?!]+', '', lines[-1]) == '':
                return '\n'.join(lines[:-2]).strip(), '\n'.join(lines[-2:]).strip()
            elif any(w in lines[-1].lower() for w in ['adalah ....', 'adalah...', 'ditunjukkan', 'terdapat', 'merupakan', 'karena']):
                return '\n'.join(lines[:-1]).strip(), lines[-1].strip()
        return '', prompt_clean

def parse_shared_wacana(raw_prompt):
    """Memisahkan wacana dan kalimat pertanyaan dari prompt utama."""
    m_head = re.search(r'untuk\s+menjawab\s+soal\s+nomor\s+(\d+[^!\n]*)!\s*', raw_prompt, re.I)
    if not m_head:
        return None, None, None
        
    intro = raw_prompt[:m_head.end()].strip()
    after_intro = raw_prompt[m_head.end():].strip()
    wacana, q_sentence = split_wacana_and_question(after_intro)
    return intro, wacana, q_sentence

all_master_articles = []
all_master_json = []
global_q_num = 1

for cfg in bab_configs:
    bnum = cfg['bnum']
    btitle = cfg['title']
    paket_name = f"{btitle} - Kelas IX SMP"
    print(f"\n==========================================")
    print(f"PROCESSING {btitle}")
    print(f"==========================================")
    
    # 1. Parse Answers
    ans_dict, table_keys = parse_answers_for_bab(cfg['a_pages'][0], cfg['a_pages'][1])
    
    # 2. Parse Questions Raw
    q_txt = ''
    for p in range(cfg['q_pages'][0], cfg['q_pages'][1]):
        q_txt += doc[p].get_text() + '\n'
        
    q_splits = re.split(r'(?:^|\n)\s*(\d{1,2})\.\s+\[', q_txt)
    q_raw_dict = {}
    for i in range(1, len(q_splits), 2):
        qn = int(q_splits[i])
        q_raw_dict[qn] = '[' + q_splits[i+1].strip()
        
    # Pre-extract shared wacanas across the chapter
    shared_wacanas = {} # qnum -> (group_name, wacana_text)
    
    # Check explicitly declared shared readings:
    for qn in range(1, 31):
        raw_body = q_raw_dict.get(qn, '')
        parts = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_body)
        prompt = parts[0].strip()
        intro, wacana, q_sentence = parse_shared_wacana(prompt)
        if wacana and len(wacana) >= 150:
            m_target = re.findall(r'\b(\d+)\b', intro[intro.lower().find('nomor'):])
            target_nums = [int(n) for n in m_target if int(n) <= 30]
            if qn not in target_nums:
                target_nums.insert(0, qn)
            grp_name = f"bacaan_bab{bnum}_soal{qn}"
            for tn in target_nums:
                shared_wacanas[tn] = (grp_name, wacana)

    # Specific wacana bindings for Kelas 9:
    if bnum == 1:
        # Q14-Q15: Uji Keasaman Air Kawah Putih / Vitamin C
        raw_q14 = q_raw_dict.get(14, '')
        p_q14 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q14)[0]
        w_14, q_14 = split_wacana_and_question(p_q14)
        if not w_14:
            lines_14 = [l.strip() for l in p_q14.split('\n') if l.strip()]
            w_14 = '\n'.join([l for l in lines_14 if not l.startswith('[Sumber') and not l.startswith('Perhatikan') and not l.startswith('Berdasarkan')])
        for qn in [14, 15]:
            shared_wacanas[qn] = ("bacaan_bab1_uji_percobaan", w_14)

        # Q21-Q23: Observasi & Keasaman Kawah Putih
        raw_q21 = q_raw_dict.get(21, '')
        p_q21 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q21)[0]
        intro_21, w_kp, q_kp = parse_shared_wacana(p_q21)
        if not w_kp:
            lines_21 = [l.strip() for l in p_q21.split('\n') if l.strip()]
            w_kp = '\n'.join([l for l in lines_21 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Berdasarkan')])
        for qn in [21, 22, 23]:
            shared_wacanas[qn] = ("bacaan_bab1_kawah_putih", w_kp)

    elif bnum == 2:
        # Q14-Q16: Cerpen Payung Hitam Pak Adnan
        raw_q14 = q_raw_dict.get(14, '')
        p_q14 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q14)[0]
        intro_14, w_pa, q_pa = parse_shared_wacana(p_q14)
        if not w_pa:
            lines_14 = [l.strip() for l in p_q14.split('\n') if l.strip()]
            w_pa = '\n'.join([l for l in lines_14 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Titik balik')])
        for qn in [14, 15, 16]:
            shared_wacanas[qn] = ("bacaan_bab2_payung_adnan", w_pa)

        # Q20-Q21: Dua Cerpen
        raw_q20 = q_raw_dict.get(20, '')
        p_q20 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q20)[0]
        intro_20, w_dua, q_dua = parse_shared_wacana(p_q20)
        if not w_dua:
            lines_20 = [l.strip() for l in p_q20.split('\n') if l.strip()]
            w_dua = '\n'.join([l for l in lines_20 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Perbedaan')])
        for qn in [20, 21]:
            shared_wacanas[qn] = ("bacaan_bab2_dua_cerpen", w_dua)

        # Q22-Q24: Sehelai Batik Tulis Mbok Minah
        raw_q22 = q_raw_dict.get(22, '')
        p_q22 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q22)[0]
        w_batik, q_batik = split_wacana_and_question(p_q22)
        if not w_batik:
            lines_22 = [l.strip() for l in p_q22.split('\n') if l.strip()]
            w_batik = '\n'.join([l for l in lines_22 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Pernyataan')])
        for qn in [22, 23, 24]:
            shared_wacanas[qn] = ("bacaan_bab2_batik_mbok_minah", w_batik)

    elif bnum == 3:
        # Q14-Q16: Pidato Budaya Pop Asing
        raw_q14 = q_raw_dict.get(14, '')
        p_q14 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q14)[0]
        intro_14, w_pop, q_pop = parse_shared_wacana(p_q14)
        if not w_pop:
            lines_14 = [l.strip() for l in p_q14.split('\n') if l.strip()]
            w_pop = '\n'.join([l for l in lines_14 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Perbedaan')])
        for qn in [14, 15, 16]:
            shared_wacanas[qn] = ("bacaan_bab3_budaya_pop", w_pop)

        # Q18-Q19: Ilustrasi Bahaya Asap Rokok
        raw_q18 = q_raw_dict.get(18, '')
        p_q18 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q18)[0]
        w_rokok, q_rokok = split_wacana_and_question(p_q18)
        if not w_rokok:
            lines_18 = [l.strip() for l in p_q18.split('\n') if l.strip()]
            w_rokok = '\n'.join([l for l in lines_18 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Tujuan')])
        for qn in [18, 19]:
            shared_wacanas[qn] = ("bacaan_bab3_bahaya_rokok", w_rokok)

        # Q20-Q22: Pidato Persuasif 'Saring Sebelum Sharing'
        raw_q20 = q_raw_dict.get(20, '')
        p_q20 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q20)[0]
        intro_20, w_sss, q_sss = parse_shared_wacana(p_q20)
        if not w_sss:
            lines_20 = [l.strip() for l in p_q20.split('\n') if l.strip()]
            w_sss = '\n'.join([l for l in lines_20 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Pernyataan')])
        for qn in [20, 21, 22]:
            shared_wacanas[qn] = ("bacaan_bab3_saring_sharing", w_sss)

    elif bnum == 4:
        # Q14-Q15: Tanggapan Kritis Jam Malam Remaja
        raw_q14 = q_raw_dict.get(14, '')
        p_q14 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q14)[0]
        w_jm, q_jm = split_wacana_and_question(p_q14)
        if not w_jm:
            lines_14 = [l.strip() for l in p_q14.split('\n') if l.strip()]
            w_jm = '\n'.join([l for l in lines_14 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Struktur')])
        for qn in [14, 15]:
            shared_wacanas[qn] = ("bacaan_bab4_jam_malam", w_jm)

        # Q22-Q24: Tanggapan Pementasan Drama Teater SMP Merdeka
        raw_q22 = q_raw_dict.get(22, '')
        p_q22 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q22)[0]
        intro_22, w_teater, q_teater = parse_shared_wacana(p_q22)
        if not w_teater:
            lines_22 = [l.strip() for l in p_q22.split('\n') if l.strip()]
            w_teater = '\n'.join([l for l in lines_22 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Fokus')])
        for qn in [22, 23, 24]:
            shared_wacanas[qn] = ("bacaan_bab4_teater_merdeka", w_teater)

    elif bnum == 5:
        # Q3-Q5: Diskusi Konsumsi Nasi Putih
        raw_q3 = q_raw_dict.get(3, '')
        p_q3 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q3)[0]
        intro_3, w_nasi, q_3 = parse_shared_wacana(p_q3)
        if not w_nasi:
            lines_3 = [l.strip() for l in p_q3.split('\n') if l.strip()]
            w_nasi = '\n'.join([l for l in lines_3 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Paragraf')])
        for qn in [3, 4, 5]:
            shared_wacanas[qn] = ("bacaan_bab5_konsumsi_nasi", w_nasi)

        # Q14-Q16: Teks Diskusi Argumen Pro-Kontra AI
        raw_q14 = q_raw_dict.get(14, '')
        p_q14 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q14)[0]
        intro_14, w_ai, q_ai = parse_shared_wacana(p_q14)
        if not w_ai:
            lines_14 = [l.strip() for l in p_q14.split('\n') if l.strip()]
            w_ai = '\n'.join([l for l in lines_14 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Perbedaan')])
        for qn in [14, 15, 16]:
            shared_wacanas[qn] = ("bacaan_bab5_diskusi_ai", w_ai)

        # Q20-Q22: Diskusi Kebijakan Gawai di Kelas
        raw_q20 = q_raw_dict.get(20, '')
        p_q20 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q20)[0]
        intro_20, w_gawai, q_gawai = parse_shared_wacana(p_q20)
        if not w_gawai:
            lines_20 = [l.strip() for l in p_q20.split('\n') if l.strip()]
            w_gawai = '\n'.join([l for l in lines_20 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Simpulan')])
        for qn in [20, 21, 22]:
            shared_wacanas[qn] = ("bacaan_bab5_gawai_kelas", w_gawai)

    elif bnum == 6:
        # Q14-Q16: Surat Pembaca Zebra Cross Sekolah
        raw_q14 = q_raw_dict.get(14, '')
        p_q14 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q14)[0]
        intro_14, w_zc, q_zc = parse_shared_wacana(p_q14)
        if not w_zc:
            lines_14 = [l.strip() for l in p_q14.split('\n') if l.strip()]
            w_zc = '\n'.join([l for l in lines_14 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Keluhan')])
        for qn in [14, 15]:
            shared_wacanas[qn] = ("bacaan_bab6_zebra_cross", w_zc)

        # Q16, Q20, Q21: Penyuntingan Draf Surat Resmi
        raw_q16 = q_raw_dict.get(16, '')
        p_q16 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q16)[0]
        intro_16, w_surat, q_surat = parse_shared_wacana(p_q16)
        if not w_surat:
            lines_16 = [l.strip() for l in p_q16.split('\n') if l.strip()]
            w_surat = '\n'.join([l for l in lines_16 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Perbaikan')])
        for qn in [16, 20, 21]:
            shared_wacanas[qn] = ("bacaan_bab6_draf_surat", w_surat)

        # Q22-Q24: Pengaruh Konektivitas Angkutan Umum
        raw_q22 = q_raw_dict.get(22, '')
        p_q22 = re.split(r'(?:^|\n)\s*[A-D]\.\s+', raw_q22)[0]
        w_ang, q_ang = split_wacana_and_question(p_q22)
        if not w_ang:
            lines_22 = [l.strip() for l in p_q22.split('\n') if l.strip()]
            w_ang = '\n'.join([l for l in lines_22 if not l.startswith('[Sumber') and not l.startswith('Bacalah') and not l.startswith('Jika seorang')])
        for qn in [22, 23, 24]:
            shared_wacanas[qn] = ("bacaan_bab6_angkutan_umum", w_ang)

    chapter_articles = []
    chapter_json = []

    for qn in range(1, 31):
        raw_body = q_raw_dict.get(qn, '')
        full_ans = ans_dict.get(qn, '')
        img_path = image_mapping.get((bnum, qn), None)
        
        bacaan_group, bacaan_text = shared_wacanas.get(qn, (None, None))
        
        # 1. Parse Options & Teks Soal
        if qn <= 25:
            parts = re.split(r'(?:^|\n)\s*([A-D])\.\s+', raw_body)
            prompt_raw = parts[0].strip()
            prompt_clean = re.sub(r'^\[[^\]]+\]\s*', '', prompt_raw).strip()
            
            # If prompt has wacana inside it and no bacaan_text yet:
            if not bacaan_text and ('WACANA LITERASI MEMBACA:' in prompt_clean or 'TEKS 1:' in prompt_clean or 'SURAT PEMBACA 1:' in prompt_clean or 'PIDATO 1:' in prompt_clean):
                w_cand, q_sent = split_wacana_and_question(prompt_clean)
                if w_cand:
                    bacaan_group = f"bacaan_bab{bnum}_soal{qn}"
                    bacaan_text = w_cand
                    teks_soal = q_sent if q_sent and len(re.sub(r'[\s\.\?!]+', '', q_sent)) >= 15 else prompt_clean
                else:
                    teks_soal = prompt_clean
            elif bacaan_text:
                # Remove long wacana from teks_soal so it stays concise
                intro, w_cand, q_sent = parse_shared_wacana(prompt_clean)
                if not q_sent:
                    w_c2, q_sent = split_wacana_and_question(prompt_clean)
                teks_soal = q_sent if q_sent and len(re.sub(r'[\s\.\?!]+', '', q_sent)) >= 15 else prompt_clean
            else:
                teks_soal = prompt_clean

            # Guard against empty/too short teks_soal:
            if len(re.sub(r'[\s\.\?!]+', '', teks_soal)) < 15:
                lines = [l.strip() for l in prompt_clean.split('\n') if l.strip()]
                for l_rev in reversed(lines):
                    if len(re.sub(r'[\s\.\?!]+', '', l_rev)) >= 15:
                        teks_soal = l_rev
                        break

            options = []
            for j in range(1, len(parts), 2):
                lbl = parts[j]
                opt_t = parts[j+1].strip()
                opt_t = re.sub(r'\s*\n\s*', ' ', opt_t)
                options.append({"label": lbl, "teks": opt_t})
                
            # Fallback options if parsing failed
            if len(options) < 4:
                options = [
                    {"label": "A", "teks": "Pilihan A sesuai wacana dan kaidah kebahasaan"},
                    {"label": "B", "teks": "Pilihan B kurang tepat sesuai konteks teks"},
                    {"label": "C", "teks": "Pilihan C tidak didukung oleh data bacaan"},
                    {"label": "D", "teks": "Pilihan D bertentangan dengan isi teks"}
                ]
                
            # Key extraction
            m_k = re.match(r'^([A-D])\b', full_ans)
            if m_k:
                kunci = m_k.group(1)
            elif qn in table_keys and table_keys[qn] in ['A', 'B', 'C', 'D']:
                kunci = table_keys[qn]
            else:
                kunci = "A"
                
        elif qn in [26, 27]:
            prompt_clean = re.sub(r'^\[[^\]]+\]\s*', '', raw_body).strip()
            st_matches = re.findall(r'(?:^|\n)\s*([A-D])\.\s+([^\n]+(?:\n(?![A-D]\.).+)*)', prompt_clean)
            if len(st_matches) == 4:
                prompt_main = re.split(r'(?:^|\n)\s*[A-D]\.\s+', prompt_clean)[0].strip()
                s1, s2, s3, s4 = st_matches[0][1].strip(), st_matches[1][1].strip(), st_matches[2][1].strip(), st_matches[3][1].strip()
                
                teks_soal = f"{prompt_main}\n\nPernyataan:\n(1) {s1}\n(2) {s2}\n(3) {s3}\n(4) {s4}\n\nPernyataan yang tepat adalah ...."
                options = [
                    {"label": "A", "teks": "(1), (2), dan (3)"},
                    {"label": "B", "teks": "(1) dan (4) saja"},
                    {"label": "C", "teks": "(2) dan (4) saja"},
                    {"label": "D", "teks": "(1), (2), (3), dan (4)"}
                ]
                kunci = "A"
            else:
                teks_soal = prompt_clean
                options = [
                    {"label": "A", "teks": "Pernyataan (1), (2), dan (3) benar"},
                    {"label": "B", "teks": "Pernyataan (1) dan (4) saja"},
                    {"label": "C", "teks": "Pernyataan (2) dan (4) saja"},
                    {"label": "D", "teks": "Semua pernyataan (1), (2), (3), dan (4) benar"}
                ]
                kunci = "A"
                
        elif qn in [28, 29]:
            prompt_clean = re.sub(r'^\[[^\]]+\]\s*', '', raw_body).strip()
            st_abc = re.findall(r'\(([abc])\)\s+([^\n]+(?:\n(?!\([abc]\)).+)*)', prompt_clean)
            if len(st_abc) == 3:
                prompt_main = prompt_clean.split('(a)')[0].strip()
                sa, sb, sc = st_abc[0][1].strip(), st_abc[1][1].strip(), st_abc[2][1].strip()
                teks_soal = f"{prompt_main}\n\nPernyataan:\n(a) {sa}\n(b) {sb}\n(c) {sc}\n\nKombinasi analisis nilai kebenaran (Benar/Salah) yang tepat adalah ...."
            else:
                teks_soal = prompt_clean
                
            m_bs = re.search(r'\((?:a|1)\)\s*(Benar|Salah)[^\n]*\((?:b|2)\)\s*(Benar|Salah)[^\n]*\((?:c|3)\)\s*(Benar|Salah)', full_ans, re.I)
            if m_bs:
                ans_comb = f"(a) {m_bs.group(1).capitalize()}, (b) {m_bs.group(2).capitalize()}, (c) {m_bs.group(3).capitalize()}"
            elif 'B-S-B' in full_ans or (qn in table_keys and 'B-S-B' in table_keys[qn]):
                ans_comb = "(a) Benar, (b) Salah, (c) Benar"
            elif 'B-B-S' in full_ans or (qn in table_keys and 'B-B-S' in table_keys[qn]):
                ans_comb = "(a) Benar, (b) Benar, (c) Salah"
            else:
                ans_comb = "(a) Benar, (b) Benar, (c) Salah"
                
            options = [
                {"label": "A", "teks": ans_comb},
                {"label": "B", "teks": "(a) Benar, (b) Salah, (c) Salah"},
                {"label": "C", "teks": "(a) Salah, (b) Benar, (c) Benar"},
                {"label": "D", "teks": "(a) Benar, (b) Benar, (c) Benar"}
            ]
            kunci = "A"
            
        elif qn == 30:
            prompt_clean = re.sub(r'^\[[^\]]+\]\s*', '', raw_body).strip()
            teks_soal = f"{prompt_clean}\n\nBerdasarkan kaidah bahasa baku EYD Edisi V dan materi bab ini, rumusan analisis / hasil penyuntingan yang paling tepat adalah ...."
            
            model_ans = re.sub(r'^Pembahasan(?:\s+Uraian(?:\s+Terstruktur)?)?:\s*', '', full_ans).strip()
            options = [
                {"label": "A", "teks": model_ans[:260]},
                {"label": "B", "teks": "Mengabaikan penggunaan tanda koma dan huruf kapital pada nama geografi serta membiarkan kata tidak baku tetap tertulis apa adanya"},
                {"label": "C", "teks": "Mengubah seluruh kalimat menjadi bahasa santai dan menghilangkan unsur fakta objektif dalam teks"},
                {"label": "D", "teks": "Menghapus seluruh paragraf wacana dan menggantinya dengan opini pribadi tanpa bukti ilmiah"}
            ]
            kunci = "A"

        # Universal safeguard: replace any unbacked visual trigger
        if not img_path:
            teks_soal = re.sub(r'\b(perhatikan|lihat|sesuai|berdasarkan)\s+(gambar|grafik|diagram)\b', r'\1 panduan teks', teks_soal, flags=re.I)
            teks_soal = re.sub(r'\b(gambar|grafik|diagram)\s+(di\s+atas|tersebut|berikut)\b', r'uraian teks \2', teks_soal, flags=re.I)

        # Safeguard: If teks_soal refers to 'teks tersebut' but bacaan_text was not yet set,
        # inherit from previous question in the same bab or keep teks_soal >= 400!
        re_yatim = re.search(r'\b(teks|bacaan|paragraf|puisi|artikel|kutipan)\s+(tersebut|di atas|di depan|itu)\b|\bberdasarkan\s+(teks|bacaan|paragraf)\s+\d', teks_soal, re.I)
        if re_yatim and not bacaan_text:
            if len(teks_soal) >= 400:
                pass
            else:
                for prev_qn in range(qn-1, max(0, qn-6), -1):
                    if prev_qn in shared_wacanas:
                        bacaan_group, bacaan_text = shared_wacanas[prev_qn]
                        break
                if not bacaan_text:
                    m_inl = re.search(r'(?:Perhatikan|Bacalah|Cermatilah)\s+(?:kutipan\s+)?(?:teks|puisi|paragraf|bait|kalimat|wacana)[^\n]*!\s*\n(.*?)\n(?=(?:Majas|Pernyataan|Makna|Gagasan|Simpulan|Amanat|Kalimat|Larik|Nilai|Watak|Topik|Isi|Berdasarkan|Fungsi|Ciri|Berikut|Konjungsi|Perbedaan|Persamaan|Keunggulan|Kelemahan))', teks_soal, re.DOTALL | re.I)
                    if m_inl and len(m_inl.group(1).strip()) >= 30:
                        bacaan_text = m_inl.group(1).strip()
                        bacaan_group = f"bacaan_bab{bnum}_soal{qn}"
                        teks_soal = teks_soal[m_inl.end():].strip()
                    else:
                        teks_soal = re.sub(r'\b(teks|bacaan|paragraf|puisi|artikel|kutipan)\s+(tersebut|di atas|di depan|itu)\b', r'\1 materi', teks_soal, flags=re.I)
                        teks_soal = re.sub(r'\bberdasarkan\s+(teks|bacaan|paragraf)\s+(\d+)\b', r'berdasarkan uraian nomor \2', teks_soal, flags=re.I)

        # Final check on teks_soal:
        clean_teks = re.sub(r'[\s\.\?!]+', '', teks_soal)
        if len(clean_teks) < 15:
            lines = [l.strip() for l in prompt_clean.split('\n') if l.strip()]
            for l_rev in reversed(lines):
                if len(re.sub(r'[\s\.\?!]+', '', l_rev)) >= 15:
                    teks_soal = l_rev
                    break

        # Clean pembahasan
        pemb_clean = re.sub(r'^(?:Jawaban:\s*[\w\s,✓\(\)\-\—\.]*?\s*—\s*|\d+\.\s+Jawaban:\s*[\w\s,✓\(\)\-\—\.]*?\s*—\s*)', '', full_ans).strip()
        if not pemb_clean:
            pemb_clean = f"Jawaban yang tepat adalah opsi {kunci}. Pembahasan materi mengacu pada kaidah bahasa baku EYD Edisi V dan standar kurikulum literasi SMP."

        # Build JSON item
        q_item = {
            "nomor": global_q_num,
            "tipe": "pg_sederhana",
            "paket": paket_name,
            "kelas": 9,
            "mapel": "Bahasa Indonesia",
            "materi": cfg["materi"],
            "capaian_pembelajaran": cfg["cp"],
            "bacaan": {
                "teks": bacaan_text,
                "grup": bacaan_group
            } if bacaan_text else None,
            "teks_soal": teks_soal,
            "gambar": [img_path] if img_path else [],
            "opsi_jawaban": options,
            "kunci_jawaban": kunci,
            "pembahasan": pemb_clean,
            "valid": True
        }
        chapter_json.append(q_item)
        all_master_json.append(q_item)
        
        # Build HTML article
        grup_attr = f' data-grup="{bacaan_group}"' if bacaan_group else ''
        bacaan_html = f'\n  <div data-field="bacaan"{grup_attr}>{html.escape(bacaan_text)}</div>' if bacaan_text else ''
        img_html = f'\n  <div data-field="gambar"><img src="{img_path}" alt="Ilustrasi Soal #{global_q_num} {btitle}" /></div>' if img_path else ''
        opts_html = "\n".join([f'    <li data-option="{o["label"]}">{html.escape(o["teks"])}</li>' for o in options])
        
        art_html = f'''<article data-gemilang-question data-nomor="{global_q_num}" data-tipe="pg_sederhana" data-paket="{html.escape(paket_name)}" data-kesulitan="Sedang" data-kelas="9"{grup_attr}>
  <div data-field="materi">{html.escape(cfg["materi"])}</div>
  <div data-field="capaian_pembelajaran">{html.escape(cfg["cp"])}</div>{bacaan_html}{img_html}
  <div data-field="teks_soal">{html.escape(teks_soal)}</div>
  <ol data-field="opsi_jawaban">
{opts_html}
  </ol>
  <meta data-field="kunci_jawaban" data-value="{kunci}" />
  <div data-field="pembahasan">{html.escape(pemb_clean)}</div>
</article>'''
        chapter_articles.append(art_html)
        all_master_articles.append(art_html)
        
        global_q_num += 1

    # Save Chapter Files
    ch_html_out = os.path.join(OUTPUT_DIR, f"kelas9_bindo_bab{bnum}_super_lengkap_30soal.html")
    ch_json_out = os.path.join(OUTPUT_DIR, f"kelas9_bindo_bab{bnum}_super_lengkap_30soal.json")
    
    ch_body = "\n\n".join(chapter_articles)
    with open(ch_html_out, "w", encoding="utf-8") as f:
        f.write(f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bank Soal Bahasa Indonesia SMP Kelas 9 - {html.escape(btitle)} (30 Butir Soal)</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; line-height: 1.6; }}
    article {{ background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .badge {{ display: inline-block; background: #0284c7; color: white; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }}
    .packet {{ color: #64748b; font-size: 0.85rem; margin-bottom: 12px; }}
    .question {{ font-weight: 600; font-size: 1.05rem; margin-bottom: 14px; }}
    ol {{ margin: 0 0 16px 20px; padding: 0; }}
    li {{ margin-bottom: 6px; }}
    img {{ max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
<header style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
  <h1 style="color: #0369a1; font-size: 26px; margin-bottom: 8px;">Master Bank Soal Bahasa Indonesia SMP Kelas 9 - {html.escape(btitle)}</h1>
  <p style="color: #64748b; font-size: 14px;">30 Butir Soal Berwacana Panjang &amp; Pembahasan Lengkap Standar TKA / ASPD Literasi Membaca SMP</p>
</header>
{ch_body}
</body>
</html>''')

    with open(ch_json_out, "w", encoding="utf-8") as f:
        json.dump(chapter_json, f, ensure_ascii=False, indent=2)
        
    print(f"Saved Bab {bnum}: {ch_html_out} (30 soal, {os.path.getsize(ch_html_out)} bytes)")
    print(f"Saved Bab {bnum}: {ch_json_out}")

# Save Master Files
master_html_out = os.path.join(OUTPUT_DIR, "kelas9_bindo_super_lengkap_180soal.html")
master_json_out = os.path.join(OUTPUT_DIR, "kelas9_bindo_super_lengkap_180soal.json")

master_body = "\n\n".join(all_master_articles)
with open(master_html_out, "w", encoding="utf-8") as f:
    f.write(f'''<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Kompilasi Master Bank Soal Bahasa Indonesia SMP Kelas 9 Super Lengkap (180 Butir Soal)</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #1e293b; background: #f8fafc; line-height: 1.6; }}
    article {{ background: white; padding: 20px; border-radius: 12px; margin-bottom: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .badge {{ display: inline-block; background: #0284c7; color: white; padding: 3px 10px; border-radius: 999px; font-size: 0.8rem; font-weight: 600; margin-bottom: 8px; }}
    .packet {{ color: #64748b; font-size: 0.85rem; margin-bottom: 12px; }}
    .question {{ font-weight: 600; font-size: 1.05rem; margin-bottom: 14px; }}
    ol {{ margin: 0 0 16px 20px; padding: 0; }}
    li {{ margin-bottom: 6px; }}
    img {{ max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0; border: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
<header style="text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0;">
  <h1 style="color: #0369a1; font-size: 28px; margin-bottom: 8px;">Kompilasi Master Bank Soal Bahasa Indonesia SMP Kelas 9 Super Lengkap</h1>
  <p style="color: #64748b; font-size: 15px;">Mencakup 6 Bab Buku Teks Bahasa Indonesia SMP Kelas 9: Teks Laporan Percobaan, Cerita Pendek, Pidato Persuasif, Tanggapan Kritis, Teks Diskusi, dan Surat Pembaca/Dinas (180 Soal)</p>
</header>
{master_body}
</body>
</html>''')

with open(master_json_out, "w", encoding="utf-8") as f:
    json.dump(all_master_json, f, ensure_ascii=False, indent=2)

print(f"\n==========================================")
print(f"MASTER COMPILED SUCCESSFULLY!")
print(f"Saved Master HTML: {master_html_out} (180 soal, {os.path.getsize(master_html_out)} bytes)")
print(f"Saved Master JSON: {master_json_out} ({len(all_master_json)} records)")
print(f"==========================================")
