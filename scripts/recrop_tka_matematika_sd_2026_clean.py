# scripts/recrop_tka_matematika_sd_2026_clean.py
# Script pemotong gambar murni (tight-crop) untuk seluruh ilustrasi Soal TKA Matematika SD 2026
# Menghilangkan seluruh teks bocor, border kartu ungu, dan ruang kosong berlebih.

import os
import io
import fitz
import numpy as np
from PIL import Image

PDF_PATH = "/Users/macbook/.gemini/antigravity/brain/460bd5e4-284f-4570-9402-00482ffa2a82/.user_uploaded/media_1794377977357_904aa742.pdf"
OUT_DIR = "/Users/macbook/.gemini/antigravity/scratch/bimbel-gemilang-app/public/soal/tka-matematika-sd-2026"
os.makedirs(OUT_DIR, exist_ok=True)

doc = fitz.open(PDF_PATH)

def get_xref_image(xref):
    img_dict = doc.extract_image(xref)
    return Image.open(io.BytesIO(img_dict["image"])).convert("RGB")

print("Memulai pemotongan ulang seluruh gambar TKA Matematika SD 2026...")

# -------------------------------------------------------------
# SOAL 1: Potongan 1/6 dan 3 Susunan Objek Utuh (A, B, C)
# -------------------------------------------------------------
# 1.1 Potongan 1/6
img12 = get_xref_image(12)
arr12 = np.array(img12)
orange12 = (arr12[:, :, 0] > 200) & (arr12[:, :, 1] > 100) & (arr12[:, :, 1] < 180) & (arr12[:, :, 2] < 60)
y_idx, x_idx = np.where(orange12)
min_x, max_x = min(x_idx), max(x_idx)
min_y, max_y = min(y_idx), max(y_idx)
# Label 1/6 di bawah potongan
below = arr12[max_y:min(max_y+150, arr12.shape[0]), max(0, min_x-50):min(arr12.shape[1], max_x+50)]
mask_below = ~((below[:, :, 0] > 240) & (below[:, :, 1] > 240) & (below[:, :, 2] > 240))
by, bx = np.where(mask_below)
label_bottom = max_y + max(by)
crop_s1 = img12.crop((min_x - 15, min_y - 10, max_x + 15, label_bottom + 10))
crop_s1.save(os.path.join(OUT_DIR, "soal_01_potongan_seperenam.png"))
print(f"Soal 01 Potongan 1/6: {crop_s1.size}")

# 1.2 Susunan A (Grid 2x3 identik)
img14 = get_xref_image(14)
arr14 = np.array(img14)
o14 = (arr14[:, :, 0] > 200) & (arr14[:, :, 1] > 100) & (arr14[:, :, 1] < 180) & (arr14[:, :, 2] < 60)
y14, x14 = np.where(o14)
crop_a = img14.crop((min(x14) - 10, min(y14) - 10, max(x14) + 10, max(y14) + 10))
crop_a.save(os.path.join(OUT_DIR, "soal_01_blok_1.png"))
print(f"Soal 01 Susunan A: {crop_a.size}")

# 1.3 Susunan B (Grid 3x2)
img16 = get_xref_image(16)
arr16 = np.array(img16)
o16 = (arr16[:, :, 0] > 200) & (arr16[:, :, 1] > 100) & (arr16[:, :, 1] < 180) & (arr16[:, :, 2] < 60)
y16, x16 = np.where(o16)
crop_b = img16.crop((min(x16) - 10, min(y16) - 10, max(x16) + 10, max(y16) + 10))
crop_b.save(os.path.join(OUT_DIR, "soal_01_blok_2.png"))
print(f"Soal 01 Susunan B: {crop_b.size}")

# 1.4 Susunan C (Bertingkat 6 blok)
img18 = get_xref_image(18)
arr18 = np.array(img18)
o18 = (arr18[:, :, 0] > 200) & (arr18[:, :, 1] > 100) & (arr18[:, :, 1] < 180) & (arr18[:, :, 2] < 60)
y18, x18 = np.where(o18)
crop_c = img18.crop((min(x18) - 10, min(y18) - 10, max(x18) + 10, max(y18) + 10))
crop_c.save(os.path.join(OUT_DIR, "soal_01_blok_3.png"))
print(f"Soal 01 Susunan C: {crop_c.size}")

# -------------------------------------------------------------
# SOAL 2: Pembangkit Listrik (xrefs 31 + 33)
# -------------------------------------------------------------
img31 = get_xref_image(31)
img33 = get_xref_image(33)
stitched2 = Image.new("RGB", (max(img31.width, img33.width), img31.height + img33.height), (255, 255, 255))
stitched2.paste(img31, (0, 0))
stitched2.paste(img33, (0, img31.height))
arr2 = np.array(stitched2)
sub2 = arr2[50:580, 30:1050]
mask2 = ~((sub2[:, :, 0] > 245) & (sub2[:, :, 1] > 245) & (sub2[:, :, 2] > 245))
ys2, xs2 = np.where(mask2)
crop2 = stitched2.crop((min(xs2) + 20, min(ys2) + 40, max(xs2) + 40, max(ys2) + 60))
crop2.save(os.path.join(OUT_DIR, "soal_02_pembangkit_listrik.png"))
print(f"Soal 02 Pembangkit Listrik: {crop2.size}")

# -------------------------------------------------------------
# SOAL 3 & 4: Karung Beras Jenis A dan B (xref 47)
# -------------------------------------------------------------
img47 = get_xref_image(47)
arr47 = np.array(img47)
sub47 = arr47[50:350, 30:1050]
mask47 = ~((sub47[:, :, 0] > 245) & (sub47[:, :, 1] > 245) & (sub47[:, :, 2] > 245))
ys47, xs47 = np.where(mask47)
crop47 = img47.crop((min(xs47) + 20, min(ys47) + 40, max(xs47) + 40, max(ys47) + 60))
crop47.save(os.path.join(OUT_DIR, "soal_03_karung_beras.png"))
crop47.save(os.path.join(OUT_DIR, "soal_04_karung_beras.png"))
print(f"Soal 03/04 Karung Beras: {crop47.size}")

# -------------------------------------------------------------
# SOAL 5: Karung Kentang 100 kg (xref 61)
# -------------------------------------------------------------
img61 = get_xref_image(61)
arr61 = np.array(img61)
sub61 = arr61[20:255, 30:1050]
mask61 = ~((sub61[:, :, 0] > 245) & (sub61[:, :, 1] > 245) & (sub61[:, :, 2] > 245))
ys61, xs61 = np.where(mask61)
crop61 = img61.crop((min(xs61) + 20, min(ys61) + 10, max(xs61) + 40, max(ys61) + 30))
crop61.save(os.path.join(OUT_DIR, "soal_05_karung_kentang.png"))
print(f"Soal 05 Karung Kentang: {crop61.size}")

# -------------------------------------------------------------
# SOAL 7: Diagram Alir Operasi Hitung (xref 77)
# -------------------------------------------------------------
img77 = get_xref_image(77)
arr77 = np.array(img77)
sub77 = arr77[:, 30:1050]
mask77 = ~((sub77[:, :, 0] > 245) & (sub77[:, :, 1] > 245) & (sub77[:, :, 2] > 245))
ys77, xs77 = np.where(mask77)
min_x77, max_x77 = min(xs77) + 30, max(xs77) + 30
min_y77, max_y77 = min(ys77), max(ys77)
crop77 = img77.crop((min_x77, min_y77, max_x77 + 5, max_y77))
crop77.save(os.path.join(OUT_DIR, "soal_07_diagram_alir.png"))
print(f"Soal 07 Diagram Alir: {crop77.size}")

# -------------------------------------------------------------
# SOAL 8: Magnet dan Klip Kertas (xref 85)
# -------------------------------------------------------------
img85 = get_xref_image(85)
arr85 = np.array(img85)
sub85 = arr85[64:405, :]
mask85 = ~((sub85[:, :, 0] > 245) & (sub85[:, :, 1] > 245) & (sub85[:, :, 2] > 245))
mask85[:, :25] = False
mask85[:, 1100:] = False
ys85, xs85 = np.where(mask85)
crop85 = img85.crop((min(xs85) - 10, 60, max(xs85) + 10, 405))
crop85.save(os.path.join(OUT_DIR, "soal_08_magnet_feromagnetik.png"))
print(f"Soal 08 Magnet: {crop85.size}")

# -------------------------------------------------------------
# SOAL 9: Kincir Air (xref 95)
# -------------------------------------------------------------
img95 = get_xref_image(95)
arr95 = np.array(img95)
sub95 = arr95[:, 25:1040]
mask95 = np.std(sub95, axis=2) > 20
ys95, xs95 = np.where(mask95)
crop95 = img95.crop((min(xs95) + 25, min(ys95), max(xs95) + 25, max(ys95)))
crop95.save(os.path.join(OUT_DIR, "soal_09_kincir_air.png"))
print(f"Soal 09 Kincir Air: {crop95.size}")

# -------------------------------------------------------------
# SOAL 10: Manfaat Ikan Salmon (xref 105)
# -------------------------------------------------------------
img105 = get_xref_image(105)
arr105 = np.array(img105)
sub105 = arr105[:, 25:1040]
mask105 = np.std(sub105, axis=2) > 20
ys105, xs105 = np.where(mask105)
crop105 = img105.crop((min(xs105) + 20, min(ys105) + 20, max(xs105) + 30, max(ys105) + 25))
crop105.save(os.path.join(OUT_DIR, "soal_10_manfaat_ikan_salmon.png"))
print(f"Soal 10 Ikan Salmon: {crop105.size}")

# -------------------------------------------------------------
# SOAL 11: Proses Pembuatan Keju (xref 115)
# -------------------------------------------------------------
img115 = get_xref_image(115)
arr115 = np.array(img115)
sub115 = arr115[:, 25:1040]
mask115 = np.std(sub115, axis=2) > 20
ys115, xs115 = np.where(mask115)
crop115 = img115.crop((min(xs115) + 20, min(ys115) + 20, max(xs115) + 30, max(ys115) + 25))
crop115.save(os.path.join(OUT_DIR, "soal_11_bahan_proses_keju.png"))
print(f"Soal 11 Proses Keju: {crop115.size}")

# -------------------------------------------------------------
# SOAL 12: Laundry Koin & Kalender (xrefs 128 + 130)
# -------------------------------------------------------------
img128 = get_xref_image(128)
img130 = get_xref_image(130)
stitched12 = Image.new("RGB", (max(img128.width, img130.width), img128.height + img130.height), (255, 255, 255))
stitched12.paste(img128, (0, 0))
stitched12.paste(img130, (0, img128.height))
arr128 = np.array(stitched12)
sub128 = arr128[:, 25:1040]
mask128 = np.std(sub128, axis=2) > 20
ys128, xs128 = np.where(mask128)
crop128 = stitched12.crop((min(xs128) + 20, min(ys128) + 20, max(xs128) + 30, max(ys128) + 30))
crop128.save(os.path.join(OUT_DIR, "soal_12_laundry_koin_kalender.png"))
print(f"Soal 12 Laundry Kalender: {crop128.size}")

# -------------------------------------------------------------
# SOAL 13: Huruf E Kayu (xref 138)
# -------------------------------------------------------------
img138 = get_xref_image(138)
arr138 = np.array(img138)
sub138 = arr138[:, 25:1040]
mask138 = ~((sub138[:, :, 0] > 245) & (sub138[:, :, 1] > 245) & (sub138[:, :, 2] > 245))
ys138, xs138 = np.where(mask138)
crop138 = img138.crop((min(xs138) + 20, min(ys138) + 5, max(xs138) + 30, max(ys138) + 10))
crop138.save(os.path.join(OUT_DIR, "soal_13_hiasan_huruf_e.png"))
print(f"Soal 13 Huruf E: {crop138.size}")

# -------------------------------------------------------------
# SOAL 14: Segi Banyak pada Grid (xref 146)
# -------------------------------------------------------------
img146 = get_xref_image(146)
arr146 = np.array(img146)
sub146 = arr146[:, 25:1040]
mask146 = ~((sub146[:, :, 0] > 245) & (sub146[:, :, 1] > 245) & (sub146[:, :, 2] > 245))
ys146, xs146 = np.where(mask146)
crop146 = img146.crop((min(xs146) + 20, min(ys146) + 5, max(xs146) + 30, max(ys146) + 10))
crop146.save(os.path.join(OUT_DIR, "soal_14_segi_banyak_grid.png"))
print(f"Soal 14 Segi Banyak Grid: {crop146.size}")

# -------------------------------------------------------------
# SOAL 15: Susunan Kubus 3D (xref 154)
# -------------------------------------------------------------
img154 = get_xref_image(154)
arr154 = np.array(img154)
sub154 = arr154[100:470, 30:1050]
mask154 = (sub154[:, :, 0] < 150) & (sub154[:, :, 1] < 150) & (sub154[:, :, 2] < 150)
ys154, xs154 = np.where(mask154)
crop154 = img154.crop((min(xs154) + 20, min(ys154) + 90, max(xs154) + 40, max(ys154) + 110))
crop154.save(os.path.join(OUT_DIR, "soal_15_susunan_kubus.png"))
print(f"Soal 15 Susunan Kubus: {crop154.size}")

# -------------------------------------------------------------
# SOAL 17: Botol Warna-Warni (xrefs 168 + 170)
# -------------------------------------------------------------
img168 = get_xref_image(168)
img170 = get_xref_image(170)
stitched17 = Image.new("RGB", (max(img168.width, img170.width), img168.height + img170.height), (255, 255, 255))
stitched17.paste(img168, (0, 0))
stitched17.paste(img170, (0, img168.height))
arr17 = np.array(stitched17)
sub17 = arr17[:, 35:1020]
mask17 = np.std(sub17, axis=2) > 20
ys17, xs17 = np.where(mask17)
crop17 = stitched17.crop((min(xs17) + 30, min(ys17) + 30, max(xs17) + 40, max(ys17) + 40))
crop17.save(os.path.join(OUT_DIR, "soal_17_botol_warna_warni.png"))
print(f"Soal 17 Botol: {crop17.size}")

# -------------------------------------------------------------
# SOAL 18: Bahan Cireng (xref 174)
# -------------------------------------------------------------
img174 = get_xref_image(174)
arr174 = np.array(img174)
sub174 = arr174[:, 35:1020]
mask174 = np.std(sub174, axis=2) > 20
ys174, xs174 = np.where(mask174)
crop174 = img174.crop((min(xs174) + 30, min(ys174) + 30, max(xs174) + 40, max(ys174) + 40))
crop174.save(os.path.join(OUT_DIR, "soal_18_bahan_cireng.png"))
print(f"Soal 18 Bahan Cireng: {crop174.size}")

# -------------------------------------------------------------
# SOAL 19: Jam Analog Memasak (xref 186)
# -------------------------------------------------------------
img186 = get_xref_image(186)
arr186 = np.array(img186)
sub186 = arr186[:, 35:1020]
mask186 = np.std(sub186, axis=2) > 20
ys186, xs186 = np.where(mask186)
crop186 = img186.crop((min(xs186) + 30, min(ys186) + 30, max(xs186) + 40, max(ys186) + 40))
crop186.save(os.path.join(OUT_DIR, "soal_19_jam_analog_memasak.png"))
print(f"Soal 19 Jam Analog: {crop186.size}")

# -------------------------------------------------------------
# SOAL 20: Sketsa Bangun Datar (xref 194)
# -------------------------------------------------------------
img194 = get_xref_image(194)
arr194 = np.array(img194)
sub194 = arr194[:, 35:1020]
mask194 = ~((sub194[:, :, 0] > 245) & (sub194[:, :, 1] > 245) & (sub194[:, :, 2] > 245))
ys194, xs194 = np.where(mask194)
crop194 = img194.crop((min(xs194) + 30, min(ys194) + 5, max(xs194) + 40, max(ys194) + 15))
crop194.save(os.path.join(OUT_DIR, "soal_20_sketsa_bangun_datar.png"))
print(f"Soal 20 Sketsa Bangun Datar: {crop194.size}")

# -------------------------------------------------------------
# SOAL 21: Segi Banyak Bintang (xref 202)
# -------------------------------------------------------------
img202 = get_xref_image(202)
arr202 = np.array(img202)
sub202 = arr202[180:480, 25:680]
mask202 = (sub202[:, :, 0] < 160) & (sub202[:, :, 1] < 160) & (sub202[:, :, 2] < 160)
ys202, xs202 = np.where(mask202)
crop202 = img202.crop((min(xs202) + 15, min(ys202) + 170, max(xs202) + 35, max(ys202) + 190))
crop202.save(os.path.join(OUT_DIR, "soal_21_segi_banyak_bintang.png"))
print(f"Soal 21 Segi Banyak Bintang: {crop202.size}")

# -------------------------------------------------------------
# SOAL 22: Pameran Lukisan (xref 210)
# -------------------------------------------------------------
img210 = get_xref_image(210)
arr210 = np.array(img210)
sub210 = arr210[:, 35:1020]
mask210 = ~((sub210[:, :, 0] > 245) & (sub210[:, :, 1] > 245) & (sub210[:, :, 2] > 245))
ys210, xs210 = np.where(mask210)
crop210 = img210.crop((min(xs210) + 30, min(ys210) + 5, max(xs210) + 40, max(ys210) + 15))
crop210.save(os.path.join(OUT_DIR, "soal_22_pameran_lukisan.png"))
print(f"Soal 22 Pameran Lukisan: {crop210.size}")

# -------------------------------------------------------------
# SOAL 23 & 24: Keset Kain Perca (xref 218)
# -------------------------------------------------------------
img218 = get_xref_image(218)
arr218 = np.array(img218)
sub218 = arr218[:, 80:1070]
mask218 = ~((sub218[:, :, 0] > 245) & (sub218[:, :, 1] > 245) & (sub218[:, :, 2] > 245))
ys218, xs218 = np.where(mask218)
crop218 = img218.crop((min(xs218) + 75, min(ys218), max(xs218) + 85, max(ys218)))
crop218.save(os.path.join(OUT_DIR, "soal_23_keset_kain_perca.png"))
crop218.save(os.path.join(OUT_DIR, "soal_24_keset_kain_perca.png"))
print(f"Soal 23/24 Keset Kain Perca: {crop218.size}")

# -------------------------------------------------------------
# SOAL 25: Sudut Gunting (xref 233)
# -------------------------------------------------------------
img233 = get_xref_image(233)
arr233 = np.array(img233)
sub233 = arr233[:, :680]
mask233 = (sub233[:, :, 0] < 150) & (sub233[:, :, 1] < 150) & (sub233[:, :, 2] < 150)
ys233, xs233 = np.where(mask233)
crop233 = img233.crop((min(xs233) - 10, min(ys233) - 10, max(xs233) + 10, max(ys233) + 10))
crop233.save(os.path.join(OUT_DIR, "soal_25_sudut_gunting.png"))
print(f"Soal 25 Sudut Gunting: {crop233.size}")

# -------------------------------------------------------------
# SOAL 26: Diagram Batang Produksi Roti + 4 Opsi (xref 241 + Opsi)
# -------------------------------------------------------------
img241 = get_xref_image(241)
arr241 = np.array(img241)
sub241 = arr241[:, 80:680]
mask241 = ~((sub241[:, :, 0] > 245) & (sub241[:, :, 1] > 245) & (sub241[:, :, 2] > 245))
ys241, xs241 = np.where(mask241)
crop241 = img241.crop((min(xs241) + 75, min(ys241) + 5, max(xs241) + 85, max(ys241) + 5))
crop241.save(os.path.join(OUT_DIR, "soal_26_produksi_roti_jakarta_tangerang.png"))
print(f"Soal 26 Produksi Roti: {crop241.size}")

for opt in ["a", "b", "c", "d"]:
    opt_path = os.path.join(OUT_DIR, f"soal_26_opsi_{opt}.png")
    if os.path.exists(opt_path):
        opt_img = Image.open(opt_path).convert("RGB")
        opt_arr = np.array(opt_img)
        opt_sub = opt_arr[:, 80:680]
        opt_mask = ~((opt_sub[:, :, 0] > 245) & (opt_sub[:, :, 1] > 245) & (opt_sub[:, :, 2] > 245))
        opt_ys, opt_xs = np.where(opt_mask)
        if len(opt_xs) > 0:
            opt_crop = opt_img.crop((min(opt_xs) + 75, min(opt_ys), max(opt_xs) + 85, max(opt_ys)))
            opt_crop.save(opt_path)
            print(f"Soal 26 Opsi {opt}: {opt_crop.size}")

# -------------------------------------------------------------
# SOAL 27: Screen Time Siska (xref 259)
# -------------------------------------------------------------
img259 = get_xref_image(259)
arr259 = np.array(img259)
sub259 = arr259[:, 80:1050]
mask259 = ~((sub259[:, :, 0] > 245) & (sub259[:, :, 1] > 245) & (sub259[:, :, 2] > 245))
ys259, xs259 = np.where(mask259)
crop259 = img259.crop((min(xs259) + 70, min(ys259), max(xs259) + 90, max(ys259)))
crop259.save(os.path.join(OUT_DIR, "soal_27_screen_time_siska.png"))
print(f"Soal 27 Screen Time Siska: {crop259.size}")

# -------------------------------------------------------------
# SOAL 28: Kantin Pak Fajar (xref 267)
# -------------------------------------------------------------
img267 = get_xref_image(267)
arr267 = np.array(img267)
sub267 = arr267[:, 80:1050]
mask267 = ~((sub267[:, :, 0] > 245) & (sub267[:, :, 1] > 245) & (sub267[:, :, 2] > 245))
ys267, xs267 = np.where(mask267)
crop267 = img267.crop((min(xs267) + 70, min(ys267), max(xs267) + 90, max(ys267)))
crop267.save(os.path.join(OUT_DIR, "soal_28_kantin_pak_fajar.png"))
print(f"Soal 28 Kantin Pak Fajar: {crop267.size}")

# -------------------------------------------------------------
# SOAL 29: Gunung Berapi Aktif (xref 275)
# -------------------------------------------------------------
img275 = get_xref_image(275)
arr275 = np.array(img275)
sub275 = arr275[:, 80:1050]
mask275 = ~((sub275[:, :, 0] > 245) & (sub275[:, :, 1] > 245) & (sub275[:, :, 2] > 245))
ys275, xs275 = np.where(mask275)
crop275 = img275.crop((min(xs275) + 70, min(ys275), max(xs275) + 90, max(ys275)))
crop275.save(os.path.join(OUT_DIR, "soal_29_gunung_berapi_aktif.png"))
print(f"Soal 29 Gunung Berapi: {crop275.size}")

# -------------------------------------------------------------
# SOAL 30: Karya Wisata Siswa (xref 283)
# -------------------------------------------------------------
img283 = get_xref_image(283)
arr283 = np.array(img283)
sub283 = arr283[:, 80:1050]
mask283 = ~((sub283[:, :, 0] > 245) & (sub283[:, :, 1] > 245) & (sub283[:, :, 2] > 245))
ys283, xs283 = np.where(mask283)
crop283 = img283.crop((min(xs283) + 75, min(ys283), max(xs283) + 85, max(ys283)))
crop283.save(os.path.join(OUT_DIR, "soal_30_karya_wisata_siswa.png"))
print(f"Soal 30 Karya Wisata: {crop283.size}")

print("\nSELESAI! Seluruh gambar berhasil di-crop bersih tanpa teks dan tanpa border.")
