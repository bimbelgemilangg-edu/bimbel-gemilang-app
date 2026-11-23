import json
import os

MTK_PATH = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku/tryout_tka_matematika_paket_b_30soal.json"
BINDO_PATH = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/ekstraksi-buku/tryout_tpm_bindo_paket_a_30soal.json"
OUT_JS = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/src/data/tka2026DiyData.js"

with open(MTK_PATH, "r", encoding="utf-8") as f:
    raw_mtk = json.load(f)

with open(BINDO_PATH, "r", encoding="utf-8") as f:
    raw_indo = json.load(f)

def add_url(urls, val):
    if not val:
        return
    if isinstance(val, list):
        for item in val:
            if isinstance(item, str) and item.strip():
                urls.append(item.strip())
    elif isinstance(val, str) and val.strip():
        urls.append(val.strip())

def normalize_soal(q, prefix):
    nomor = q.get("nomor", 1)
    q_id = f"{prefix}_{str(nomor).zfill(2)}"
    teks = q.get("teks_soal") or q.get("teksSoal") or ""
    materi = q.get("materi") or ""
    mapel = q.get("mapel") or ""
    tipe = q.get("tipe") or "pg_sederhana"
    kunci = q.get("kunci_jawaban") or q.get("kunci") or ""
    pembahasan = q.get("pembahasan") or ""
    
    # Gambar URLs collection
    gambar_urls = []
    add_url(gambar_urls, q.get("gambarUrls"))
    add_url(gambar_urls, q.get("gambar"))
    add_url(gambar_urls, q.get("gambar_soal"))
    if q.get("bacaan") and isinstance(q["bacaan"], dict):
        add_url(gambar_urls, q["bacaan"].get("gambar"))
        add_url(gambar_urls, q["bacaan"].get("gambarUrls"))
    if q.get("tabel") and isinstance(q["tabel"], dict):
        add_url(gambar_urls, q["tabel"].get("gambar_tabel"))
        add_url(gambar_urls, q["tabel"].get("gambar"))

    # Normalisasi Opsi
    raw_opsi = q.get("opsi") or q.get("opsiJawaban") or []
    norm_opsi = []
    huruf_list = ["A", "B", "C", "D", "E"]
    for idx, opt in enumerate(raw_opsi):
        if isinstance(opt, str):
            k = huruf_list[idx] if idx < len(huruf_list) else str(idx+1)
            norm_opsi.append({"key": k, "label": k, "teks": opt, "gambar": None})
        elif isinstance(opt, dict):
            k = str(opt.get("key") or opt.get("label") or (huruf_list[idx] if idx < len(huruf_list) else str(idx+1))).upper()
            norm_opsi.append({
                "key": k,
                "label": k,
                "teks": opt.get("teks") or opt.get("isi") or "",
                "gambar": opt.get("gambar") or None
            })

    # Normalisasi Pernyataan (jika ada)
    raw_pernyataan = q.get("pernyataan") or []
    norm_pernyataan = []
    for idx, p in enumerate(raw_pernyataan):
        if isinstance(p, str):
            norm_pernyataan.append({"id": f"p_{idx+1}", "teks": p, "kunci": ""})
        elif isinstance(p, dict):
            norm_pernyataan.append({
                "id": p.get("id") or f"p_{idx+1}",
                "teks": p.get("teks") or "",
                "kunci": p.get("kunci") or ""
            })

    item = {
        "id": q_id,
        "nomor": nomor,
        "jenjang": "SMP",
        "kelas": "9",
        "tingkatKelas": "9 SMP",
        "mapel": mapel,
        "mataPelajaran": mapel,
        "materi": materi,
        "tipe": tipe,
        "teksSoal": teks,
        "teks_soal": teks,
        "soal": teks,
        "gambar": q.get("gambar") or (gambar_urls[0] if gambar_urls else None),
        "gambarUrls": list(dict.fromkeys(gambar_urls)),
        "tabel": q.get("tabel") or None,
        "tabelSoal": q.get("tabel") or None,
        "opsiJawaban": norm_opsi,
        "opsi": norm_opsi,
        "pernyataan": norm_pernyataan if norm_pernyataan else None,
        "kunciJawaban": kunci,
        "kunci_jawaban": kunci,
        "kunci": kunci,
        "pembahasan": pembahasan
    }
    if q.get("bacaan"):
        item["bacaan"] = q["bacaan"]
        if isinstance(q["bacaan"], dict) and q["bacaan"].get("gambar"):
            b_img = q["bacaan"]["gambar"]
            item["bacaan_gambar"] = b_img[0] if isinstance(b_img, list) and b_img else b_img
    if q.get("grup"):
        item["grup"] = q["grup"]

    return item

mtk_soal_list = [normalize_soal(q, "tka26_mtk_b") for q in raw_mtk]
indo_soal_list = [normalize_soal(q, "tka26_indo_a") for q in raw_indo]

content = f"""// src/data/tka2026DiyData.js
// ============================================================
// BANK SOAL RESMI TKA SMP/MTS DIY 2025/2026 (MKKS DIY)
// 100% PRESISI BERDASARKAN NASKAH RESMI UJIAN
// - PAKET B: MATEMATIKA (30 Butir Soal, Durasi 75 Menit)
// - PAKET A: BAHASA INDONESIA (30 Butir Soal, Durasi 75 Menit)
// Dilengkapi Crop Gambar Diagram 300 DPI, Tabel Presisi, Diagram Opsi
// ============================================================

export const SOAL_TKA_2026_SMP_MTK_PAKET_B = {json.dumps(mtk_soal_list, ensure_ascii=False, indent=2)};

export const SOAL_TKA_2026_SMP_BINDO_PAKET_A = {json.dumps(indo_soal_list, ensure_ascii=False, indent=2)};

export const PAKET_RESMI_TKA_2026_SMP_MTK_PAKET_B = {{
  id: "paket_tka_2026_smp_mtk_paket_b",
  judul: "TKA 2026: MATEMATIKA WAJIB & NUMERASI (PAKET B MKKS DIY)",
  kategori: "TKA SMP / SMA",
  formatUjian: "TKA_2026_MTK",
  totalSoal: 30,
  durasiMenit: 75,
  jedaTransisiDetik: 60,
  modeTimer: "per-subtes",
  subtes: [
    {{
      id: "subtes_tka_mtk_b",
      kode: "MTK-B",
      nama: "TKA Matematika Paket B (MKKS DIY)",
      durasiMenit: 75,
      targetSoal: 30,
      estimasiDetik: 150,
      soal: SOAL_TKA_2026_SMP_MTK_PAKET_B
    }}
  ],
  daftarSoal: SOAL_TKA_2026_SMP_MTK_PAKET_B
}};

export const PAKET_RESMI_TKA_2026_SMP_BINDO_PAKET_A = {{
  id: "paket_tka_2026_smp_indo_paket_a",
  judul: "TKA 2026: BAHASA INDONESIA & LITERASI (PAKET A MKKS DIY)",
  kategori: "TKA SMP / SMA",
  formatUjian: "TKA_2026_INDO",
  totalSoal: 30,
  durasiMenit: 75,
  jedaTransisiDetik: 60,
  modeTimer: "per-subtes",
  subtes: [
    {{
      id: "subtes_tka_indo_a",
      kode: "BINDO-A",
      nama: "TKA Bahasa Indonesia Paket A (MKKS DIY)",
      durasiMenit: 75,
      targetSoal: 30,
      estimasiDetik: 150,
      soal: SOAL_TKA_2026_SMP_BINDO_PAKET_A
    }}
  ],
  daftarSoal: SOAL_TKA_2026_SMP_BINDO_PAKET_A
}};

export const SESI_RESMI_TKA_2026 = {{
  matematika: {{
    id: "tka_mtk_2026",
    nama: "TKA 2026: Matematika Wajib & Numerasi (Paket B DIY)",
    durasiMenit: 75,
    targetSoal: 30,
    jedaTransisiDetik: 60,
    soal: SOAL_TKA_2026_SMP_MTK_PAKET_B
  }},
  literasi_indo: {{
    id: "tka_indo_2026",
    nama: "TKA 2026: B. Indonesia & Literasi (Paket A DIY)",
    durasiMenit: 75,
    targetSoal: 30,
    jedaTransisiDetik: 60,
    soal: SOAL_TKA_2026_SMP_BINDO_PAKET_A
  }}
}};
"""

with open(OUT_JS, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated {OUT_JS} successfully! File size: {len(content)} bytes")
