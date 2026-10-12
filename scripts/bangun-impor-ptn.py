#!/usr/bin/env python3
# scripts/bangun-impor-ptn.py
# ============================================================
# Pembangun SEKALI-PAKAI: Excel owner -> IMPOR-PTN-2026.json
#
# KENAPA PYTHON, BUKAN .mjs SEPERTI BUILDER LAIN DI FOLDER INI
# Repo sudah punya builder Node (build-mate-k12-bab1.mjs dkk.) dan dependensi
# `xlsx`/`exceljs` terpasang di package.json. Jalur kanonik untuk importer ini
# adalah scripts/bangun-impor-ptn.mjs yang memakai utils/parsePtnExcel.js --
# logikanya TERUJI (tests/parsePtnExcel.test.mjs, 23 uji).
#
# Berkas Python ini ada karena satu alasan praktis: konversi perdana perlu
# dijalankan sekarang, dan lingkungan pengerjaan tidak punya node_modules
# repo (build produksi proyek ini butuh RAM >= 4 GB). Python + openpyxl
# tersedia. Aturannya yang diikuti PERSIS sama dengan parsePtnExcel.js, dan
# hasilnya harus identik. Kalau suatu hari keduanya berbeda pendapat,
# YANG MENANG adalah versi .mjs -- karena versi itu yang ada testnya.
#
#     python3 scripts/bangun-impor-ptn.py <berkas.xlsx> [keluaran.json]
#
# Yang TIDAK dilakukan skrip ini: menulis ke Firestore, menebak data yang
# hilang, dan menaikkan status data jadi 'terverifikasi'. Lihat kepala
# src/utils/statusDataPtn.js untuk alasannya.
# ============================================================
import json
import re
import sys
from datetime import datetime, timezone
from collections import Counter

import openpyxl

BARIS_HEADER = 4  # baris 1-3 judul, baris 4 header, data mulai baris 5
ID_AGGREGAT = re.compile(r"rata-?rata|total keseluruhan", re.I)

BIDANG_SAH = {"saintek": "Saintek", "soshum": "Soshum"}
JENJANG_SAH = {"s1", "s2", "s3", "d1", "d2", "d3", "d4"}
PESAN_PTKIN = "Jalur masuk PTKIN adalah SPAN-PTKIN & UM-PTKIN, bukan SNBT/UTBK"

SUMBER_BERKAS = "Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026.xlsx"


def norm(v):
    return "" if v is None else str(v).strip()


def angka(v):
    if v is None or v == "":
        return None
    try:
        return float(v)
    except (TypeError, ValueError):
        pass
    n = re.sub(r"[^0-9.,-]", "", str(v))
    try:
        return float(n)
    except ValueError:
        return None


def bulat(v):
    n = angka(v)
    return None if n is None else int(round(n))


def baca_sheet(wb, nama):
    """-> daftar dict {_baris, <kolom>: nilai}. Baris kosong dilewati."""
    ws = wb[nama]
    baris = list(ws.iter_rows(values_only=True))
    kepala = [norm(c) for c in baris[BARIS_HEADER - 1]]
    hasil = []
    for i, r in enumerate(baris[BARIS_HEADER:], BARIS_HEADER + 1):
        if all(c is None or norm(c) == "" for c in r):
            continue
        d = {"_baris": i}
        for j, k in enumerate(kepala):
            if k:
                d[k] = r[j] if j < len(r) else None
        hasil.append(d)
    return hasil


def pisahkan_wilayah_kampus(mentah):
    t = norm(mentah)
    if not t:
        return None, None
    m = re.match(r"^(.*?)\s*\((.*?)\)\s*$", t)
    if m and re.search(r"kampus", m.group(2), re.I):
        return (norm(m.group(1)) or None), norm(m.group(2))
    return t, None


def bungkus_angka(nilai, *, sumber, sumber_url=None, diambil_pada=None,
                  resmi=False, tahun_seleksi=None):
    n = angka(nilai)
    dasar = {
        "sumber": sumber,
        "sumberUrl": sumber_url,
        "diambilPada": diambil_pada,
        "resmi": bool(resmi),
        "tahunSeleksi": tahun_seleksi,
    }
    if n is None:
        return {"nilai": None, "statusData": "belum_tersedia", **dasar}
    terverifikasi = bool(resmi and sumber_url and diambil_pada)
    return {
        "nilai": n,
        "statusData": "terverifikasi" if terverifikasi else "belum_verifikasi",
        **dasar,
    }


def parse_ptn_master(baris):
    daftar, masalah = [], []
    website = {}
    for b in baris:
        id_ = norm(b.get("ID_PTN"))
        if not id_:
            masalah.append({"baris": b["_baris"], "tingkat": "error",
                            "pesan": "ID_PTN kosong"})
            continue
        if ID_AGGREGAT.search(id_):
            continue

        bentuk = norm(b.get("Bentuk_PTN"))
        catatan_jalur = []
        if bentuk == "PTKIN":
            catatan_jalur.append(PESAN_PTKIN)
            masalah.append({"baris": b["_baris"], "tingkat": "peringatan",
                            "id": id_, "pesan": f"PTKIN: {PESAN_PTKIN}"})

        web = norm(b.get("Website_Resmi"))
        if web:
            if web in website:
                masalah.append({
                    "baris": b["_baris"], "tingkat": "peringatan", "id": id_,
                    "pesan": (f'Website_Resmi "{web}" dipakai juga oleh '
                              f"{website[web]} — periksa apakah salah tempel"),
                })
            else:
                website[web] = id_

        daftar.append({
            "id": id_,
            "nama": norm(b.get("Nama_PTN")) or None,
            "singkatan": norm(b.get("Singkatan")) or None,
            "provinsi": norm(b.get("Provinsi")) or None,
            "wilayahBesar": norm(b.get("Wilayah_Besar")) or None,
            "bentukPtn": bentuk or None,
            # Disimpan apa adanya. Sheet master punya 7 nilai klaster, sheet
            # dashboard memakai 4 dengan anggota berbeda. Meratakan salah
            # satunya berarti mengarang taksonomi.
            "klasterKeketatanSumber": norm(b.get("Klaster_Keketatan")) or None,
            "websiteResmi": web or None,
            # Seluruh 157 baris diisi URL portal yang SAMA. Itu rujukan
            # umum, bukan bukti verifikasi per institusi.
            "portalDayaTampung": norm(b.get("URL_SNPMB")) or None,
            "jalurSeleksi": "di_luar_snbt" if catatan_jalur else "snbt",
            "catatanJalur": catatan_jalur,
            "statusData": "belum_verifikasi",
            "asalData": SUMBER_BERKAS,
        })
    return daftar, masalah


def parse_prodi(baris, *, nama_sheet, kolom_id, kolom_nama,
                tahun_seleksi=None, wilayah_default=None):
    daftar, masalah = [], []
    agregat = None
    terlihat = {}

    for b in baris:
        id_ = norm(b.get(kolom_id))
        if not id_:
            masalah.append({"baris": b["_baris"], "sheet": nama_sheet,
                            "tingkat": "error", "pesan": f"{kolom_id} kosong"})
            continue

        if ID_AGGREGAT.search(id_):
            t, p = bulat(b.get("Daya_Tampung_SNBT")), bulat(b.get("Peminat_SNBT"))
            k = angka(b.get("Keketatan_Persen"))
            agregat = {
                "sheet": nama_sheet, "label": id_,
                "totalDayaTampung": t, "totalPeminat": p,
                "keketatanRataRata": k,
                "skorMinimumRataRata": angka(b.get("Skor_UTBK_Minimum")),
                "catatan": ("Baris agregat dari berkas sumber, BUKAN program "
                            "studi. Disimpan terpisah."),
            }
            if t and p and k is not None and abs(k - t / p) > 0.0005:
                masalah.append({
                    "baris": b["_baris"], "sheet": nama_sheet, "tingkat": "peringatan",
                    "id": id_,
                    "pesan": (f"Keketatan agregat {k:.4f} != tampung/peminat "
                              f"{t / p:.4f} — berkas sumber memakai rata-rata "
                              "rasio, bukan rasio total"),
                })
            continue

        if id_ in terlihat:
            masalah.append({
                "baris": b["_baris"], "sheet": nama_sheet, "tingkat": "error",
                "id": id_,
                "pesan": f"ID kembar dengan baris {terlihat[id_]} — baris ini dilewati",
            })
            continue
        terlihat[id_] = b["_baris"]

        nama_prodi = norm(b.get(kolom_nama)) or None
        if not nama_prodi:
            masalah.append({
                "baris": b["_baris"], "sheet": nama_sheet, "tingkat": "error",
                "id": id_, "pesan": "Nama program studi kosong — baris dilewati",
            })
            continue

        jenjang = norm(b.get("Jenjang")) or None
        if jenjang and jenjang.lower() not in JENJANG_SAH:
            masalah.append({"baris": b["_baris"], "sheet": nama_sheet,
                            "tingkat": "peringatan", "id": id_,
                            "pesan": f'Jenjang tak dikenal: "{jenjang}"'})

        bidang_mentah = norm(b.get("Bidang") or b.get("Kelompok")) or None
        bidang = None
        if bidang_mentah:
            if bidang_mentah.lower() in BIDANG_SAH:
                bidang = BIDANG_SAH[bidang_mentah.lower()]
            else:
                # JANGAN ditebak. Kasus nyata baris 209-210: kolom Bidang
                # berisi 'S1'. Hampir pasti maksudnya 'Saintek', tapi
                # "hampir pasti" bukan dasar untuk menulis data.
                masalah.append({
                    "baris": b["_baris"], "sheet": nama_sheet, "tingkat": "error",
                    "id": id_,
                    "pesan": (f'Bidang "{bidang_mentah}" bukan Saintek/Soshum '
                              "(kemungkinan salah kolom) — disimpan sebagai "
                              "null, perlu perbaikan di sumber"),
                })

        wilayah_pecahan, kampus_pecahan = pisahkan_wilayah_kampus(b.get("Wilayah"))
        wilayah = wilayah_pecahan or (None if norm(b.get("Wilayah")) else wilayah_default)
        kampus = norm(b.get("Kampus")) or kampus_pecahan or None

        tampung, peminat = bulat(b.get("Daya_Tampung_SNBT")), bulat(b.get("Peminat_SNBT"))
        k_berkas = angka(b.get("Keketatan_Persen"))
        k_hitung = (tampung / peminat) if (tampung and peminat) else None
        if k_berkas is not None and k_hitung is not None and abs(k_berkas - k_hitung) > 0.0005:
            masalah.append({
                "baris": b["_baris"], "sheet": nama_sheet, "tingkat": "peringatan",
                "id": id_,
                "pesan": (f"Keketatan {k_berkas:.4f} tidak sama dengan "
                          f"tampung/peminat {k_hitung:.4f} — dipakai hasil "
                          "hitung ulang"),
            })

        mn = angka(b.get("Skor_UTBK_Minimum"))
        rt = angka(b.get("Skor_UTBK_Rata_Rata"))
        mx = angka(b.get("Skor_UTBK_Maksimum"))
        if None not in (mn, rt, mx) and not (mn <= rt <= mx):
            masalah.append({
                "baris": b["_baris"], "sheet": nama_sheet, "tingkat": "error",
                "id": id_,
                "pesan": f"Skor tidak berurutan: min {mn} / rata2 {rt} / maks {mx}",
            })

        asal = f"{SUMBER_BERKAS} · {nama_sheet}"
        daftar.append({
            "id": id_,
            "idPtn": norm(b.get("Kode_PTN")) or None,
            "namaPtn": norm(b.get("Nama_PTN")) or None,
            "namaProdi": nama_prodi,
            "jenjang": jenjang,
            "bidang": bidang,
            "wilayah": wilayah,
            "kampus": kampus,
            "fakultas": norm(b.get("Fakultas")) or None,
            "dayaTampung": bungkus_angka(tampung, sumber=asal, tahun_seleksi=tahun_seleksi),
            "peminat": bungkus_angka(peminat, sumber=asal, tahun_seleksi=tahun_seleksi),
            "keketatan": k_hitung if k_hitung is not None else k_berkas,
            "skorReferensi": {
                "minimum": bungkus_angka(mn, sumber=f"{asal} · kolom Skor_UTBK_Minimum",
                                         tahun_seleksi=tahun_seleksi),
                "rataRata": bungkus_angka(rt, sumber=f"{asal} · kolom Skor_UTBK_Rata_Rata",
                                          tahun_seleksi=tahun_seleksi),
                "maksimum": bungkus_angka(mx, sumber=f"{asal} · kolom Skor_UTBK_Maksimum",
                                          tahun_seleksi=tahun_seleksi),
            },
            "syaratKhusus": norm(b.get("Syarat_Khusus")) or None,
            "subtesKunci": norm(b.get("Subtes_Kunci")) or None,
            # Kolom ini berisi 24 label editorial bebas ("Pilihan 2 Sangat
            # Kuat", "Cadangan Aman Banyuwangi", ...). Itu opini penyusun
            # berkas, bukan data -- dipisah supaya tidak pernah tampil
            # sebagai fakta.
            "catatanPenyusun": norm(b.get("Rekomendasi_Strategi") or b.get("Karakter_Pilihan")) or None,
            "statusData": "belum_verifikasi",
            "asalData": {"sheet": nama_sheet, "barisExcel": b["_baris"],
                         "berkas": SUMBER_BERKAS},
        })
    return daftar, masalah, agregat


def kunci_gabung(p):
    """Kunci pencocokan antar sheet: (idPtn, namaProdi).

    🔥 JANGAN dippersempit jadi namaProdi saja. Sheet nasional memuat 266 prodi
    dari 32 PTN, dan 34 nama prodi muncul lebih dari sekali LINTAS PTN
    ("Pendidikan Dokter" ada di 8 PTN berbeda, "Farmasi" di 13). Pencocokan
    berdasar nama saja membuat prodi UI diperkaya data UNEJ -- fakultas &
    kampus salah institusi, dan 164 "konflik" palsu dilaporkan. Bug ini nyata
    terjadi pada konversi perdana dan ditangkap oleh laporannya sendiri.
    """
    return (str(p.get("idPtn") or "").strip().lower(),
            str(p.get("namaProdi") or "").strip().lower())


def gabungkan_prodi(utama, tambahan):
    """UNEJ ada di dua sheet: nasional (266 prodi) & khusus UNEJ (76 prodi).

    Yang digabungkan HANYA baris yang idPtn-nya sama. Sheet UNEJ tidak punya
    kolom Kode_PTN, jadi idPtn-nya diisi lebih dulu dari sheet nasional lewat
    ID_UNEJ (lihat pemanggil di utama()).
    """
    masalah = []
    indeks = {}
    for t in tambahan:
        k = kunci_gabung(t)
        if not k[0]:
            # Tanpa idPtn tidak ada dasar untuk mencocokkan -- dan menebak
            # berdasarkan nama sudah terbukti merusak data.
            masalah.append({
                "tingkat": "error", "id": t["id"],
                "pesan": ("idPtn kosong, tidak bisa dicocokkan antar sheet -- "
                          "disimpan sebagai prodi terpisah"),
            })
            continue
        if k in indeks:
            masalah.append({
                "tingkat": "error", "id": t["id"],
                "pesan": f"kunci gabung kembar dengan {indeks[k]['id']} dalam sheet tambahan",
            })
            continue
        indeks[k] = t

    hasil = []
    for p in utama:
        k = kunci_gabung(p)
        t = indeks.get(k) if k[0] else None
        kaya = dict(p)
        if t:
            for f in ("fakultas", "kampus", "wilayah"):
                if not kaya.get(f) and t.get(f):
                    kaya[f] = t[f]
            for label, a, bb in [
                ("Skor_UTBK_Minimum", p["skorReferensi"]["minimum"]["nilai"],
                 t["skorReferensi"]["minimum"]["nilai"]),
                ("Daya_Tampung_SNBT", p["dayaTampung"]["nilai"], t["dayaTampung"]["nilai"]),
            ]:
                if a is not None and bb is not None and a != bb:
                    masalah.append({
                        "tingkat": "error", "id": p["id"],
                        "pesan": (f"{label} beda antar sheet: {a} vs {bb} "
                                  f"(dari {t['id']}) — dipakai sheet utama, "
                                  "perlu diputuskan manual"),
                    })
            kaya["asalData"] = dict(p["asalData"], diperkayaDari=t["asalData"]["sheet"])
            # ID sheet khusus disimpan sebagai alias, bukan menimpa id utama --
            # kalau ditimpa, rujukan silang ke sheet nasional putus.
            if t.get("id") and t["id"] != p["id"]:
                kaya["idAlias"] = t["id"]
        hasil.append(kaya)

    kunci_utama = {kunci_gabung(p) for p in utama if kunci_gabung(p)[0]}
    hanya_tambahan = [t for t in tambahan if kunci_gabung(t) not in kunci_utama]
    return hasil + hanya_tambahan, masalah


def parse_subtes(baris):
    daftar, masalah = [], []
    for b in baris:
        nama = norm(b.get("Nama Subtes"))
        if not nama or re.search(r"total|lengkap", nama, re.I):
            continue
        jumlah, menit = bulat(b.get("Jumlah Soal")), bulat(b.get("Waktu (Menit)"))
        detik = angka(b.get("Kecepatan Rata2 (Detik/Soal)"))
        if jumlah and menit and detik is not None and abs(detik - menit * 60 / jumlah) > 1:
            masalah.append({
                "baris": b["_baris"], "tingkat": "peringatan", "id": nama,
                "pesan": (f"Kecepatan {detik:.1f} dtk/soal != "
                          f"{menit * 60 / jumlah:.1f} dari jumlah & waktu"),
            })
        daftar.append({
            "id": norm(b.get("No")) or re.sub(r"[^a-z0-9]+", "-", nama.lower()),
            "kelompok": norm(b.get("Kelompok Tes")) or None,
            "nama": nama,
            "jumlahSoal": jumlah,
            "waktuMenit": menit,
            "detikPerSoal": detik,
            "karakterSoal": norm(b.get("Karakter Soal & Jebakan")) or None,
            "trik": norm(b.get("Trik Pengerjaan Cepat")) or None,
            "prioritasProdi": norm(b.get("Prioritas Relevansi Prodi")) or None,
            "statusData": "belum_verifikasi",
            "asalData": SUMBER_BERKAS,
        })
    return daftar, masalah


def parse_sumber(baris):
    daftar = []
    for b in baris:
        id_ = norm(b.get("ID_SUMBER"))
        if not id_:
            continue
        daftar.append({
            "id": id_,
            "nama": norm(b.get("Nama Portal / Dokumen Resmi")) or None,
            "instansi": norm(b.get("Instansi Penyelenggara")) or None,
            "url": norm(b.get("Tautan Resmi (URL)")) or None,
            "fungsi": norm(b.get("Fungsi Acuan Konsultasi")) or None,
            "keteranganValidasi": norm(b.get("Keterangan Validasi")) or None,
            "resmi": True,
        })
    return daftar, []


def utama(berkas_xlsx, keluaran, tahun_seleksi=2027):
    wb = openpyxl.load_workbook(berkas_xlsx, data_only=True, read_only=True)

    ptn, m_ptn = parse_ptn_master(baca_sheet(wb, "PTN_MASTER_NASIONAL"))

    nasional, m_nas, agr_nas = parse_prodi(
        baca_sheet(wb, "TARGET_SKOR_PRODI_NASIONAL"),
        nama_sheet="TARGET_SKOR_PRODI_NASIONAL", kolom_id="ID_PRODI",
        kolom_nama="Nama_Prodi", tahun_seleksi=tahun_seleksi)

    unej, m_unej, agr_unej = parse_prodi(
        baca_sheet(wb, "UNEJ_76_PRODI_LENGKAP"),
        nama_sheet="UNEJ_76_PRODI_LENGKAP", kolom_id="ID_UNEJ",
        kolom_nama="Nama_Program_Studi", tahun_seleksi=tahun_seleksi,
        wilayah_default="Jawa Timur")

    # Sheet UNEJ tidak punya kolom Kode_PTN. Alih-alih menghardcode 'PTN-077',
    # idPtn-nya diambil dari sheet nasional lewat ID_UNEJ yang sama -- jadi
    # kalau UNEJ suatu hari pindah kode di sumber, hasilnya ikut benar.
    ptn_per_id = {p["id"]: p["idPtn"] for p in nasional if p.get("idPtn")}
    tanpa_induk = []
    for p in unej:
        if not p.get("idPtn"):
            induk = ptn_per_id.get(p["id"])
            if induk:
                p["idPtn"] = induk
            else:
                tanpa_induk.append(p["id"])
    if tanpa_induk:
        m_unej.extend({
            "tingkat": "error", "id": i,
            "pesan": ("tidak ditemukan di sheet nasional, idPtn tidak diketahui "
                      "-- tidak bisa digabungkan secara aman")
        } for i in tanpa_induk)

    prodi, m_gabung = gabungkan_prodi(nasional, unej)

    subtes, m_sub = parse_subtes(baca_sheet(wb, "KOMPONEN_7_SUBTES_UTBK"))
    sumber, _ = parse_sumber(baca_sheet(wb, "SUMBER_REGULASI_RESMI"))

    semua_masalah = m_ptn + m_nas + m_unej + m_gabung + m_sub

    # Prodi di luar SNBT: PTN induknya sudah ditandai, prodinya ikut ditandai
    # supaya tidak ada yang membandingkan skor UTBK dengan prodi PTKIN.
    jalur = {p["id"]: p["jalurSeleksi"] for p in ptn}
    for p in prodi:
        if p.get("idPtn") and jalur.get(p["idPtn"]) == "di_luar_snbt":
            p["jalurSeleksi"] = "di_luar_snbt"

    keluaran_json = {
        "_meta": {
            "dibangunDari": berkas_xlsx.split("/")[-1],
            # Stempel waktu pembangunan. Penting karena seluruh data di
            # berkas ini berstatus belum_verifikasi: tanpa tanggal, tidak
            # ada cara mengetahui seberapa basi isinya nanti.
            "dibangunPada": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tahunSeleksi": tahun_seleksi,
            "tahunData": "2026/2027 (sebagaimana tertulis di berkas sumber)",
            "statusDataSeluruhnya": "belum_verifikasi",
            "peringatan": [
                "SELURUH angka skor di berkas ini berstatus 'belum_verifikasi'. "
                "Berkas sumber TIDAK punya kolom sumber/tanggal per baris, dan "
                "panitia SNPMB tidak mengumumkan passing grade per prodi.",
                "Daya tampung & peminat MEMANG dipublikasikan resmi oleh SNPMB, "
                "tapi tahun seleksinya tidak disebut per baris -- perlu "
                "dicek ulang ke portal sebelum dipakai mengambil keputusan.",
                "JANGAN menampilkan angka mana pun tanpa label statusnya. "
                "Lihat src/utils/statusDataPtn.js -> sanggahanSkor().",
            ],
            "jumlah": {
                "ptn": len(ptn),
                "prodi": len(prodi),
                "prodiDariSheetNasional": len(nasional),
                "prodiDariSheetUnej": len(unej),
                "subtes": len(subtes),
                "sumber": len(sumber),
                "masalahError": sum(1 for m in semua_masalah if m["tingkat"] == "error"),
                "masalahPeringatan": sum(1 for m in semua_masalah if m["tingkat"] == "peringatan"),
            },
            "agregatDariBerkasSumber": {"nasional": agr_nas, "unej": agr_unej},
        },
        "ptn": ptn,
        "prodi": prodi,
        "subtes_utbk": subtes,
        "sumber_referensi": sumber,
        "masalah": semua_masalah,
    }

    with open(keluaran, "w", encoding="utf-8") as f:
        json.dump(keluaran_json, f, ensure_ascii=False, indent=2)

    print(f"PTN              : {len(ptn)}")
    print(f"Prodi (gabungan) : {len(prodi)}  (nasional {len(nasional)} + UNEJ {len(unej)}, "
          f"tumpang tindih {len(nasional) + len(unej) - len(prodi)})")
    print(f"Subtes UTBK      : {len(subtes)}")
    print(f"Sumber resmi     : {len(sumber)}")
    print(f"Masalah          : {sum(1 for m in semua_masalah if m['tingkat'] == 'error')} error, "
          f"{sum(1 for m in semua_masalah if m['tingkat'] == 'peringatan')} peringatan")
    print(f"Ditulis ke       : {keluaran}")
    print("\nRincian masalah per jenis:")
    # Angka disamar jadi <angka> AGAR bisa dikelompokkan -- tapi pemotongan
    # dilakukan saat mencetak, bukan sebelum pengelompokan. (Versi pertama
    # memotong lebih dulu, dan "Bidang 'S1'" tercetak sebagai "Bidang 'S'"
    # -- laporan yang menyesatkan tentang data yang sedang dilaporkan.)
    kelompok = Counter(re.sub(r"[0-9]+(?:\.[0-9]+)?", "<angka>", m["pesan"])
                       for m in semua_masalah)
    for pesan, n in kelompok.most_common():
        print(f"  {n:3}x  {pesan[:95]}")
    return keluaran_json


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    utama(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else "IMPOR-PTN-2026.json")
