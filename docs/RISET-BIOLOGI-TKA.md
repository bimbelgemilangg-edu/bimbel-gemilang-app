# 🔬 RISET MATERI — TKA BIOLOGI SMA KELAS 12 (TKA 2026)

> Dasar penyusunan `docs/drafts/draft-biologi-tka-b12-v1.json` /
> `draft-biologi-tka-k12-v1.json` (Turn 28). Doktrin: konten orisinal sesuai
> kerangka resmi, soal asli berlabel sumber, kotak **Cara Gemilang** per bab.

## 1. Sumber riset (23 Sep 2026)

| Sumber | Isi yang dipakai |
|---|---|
| **Pusmendik Kemendikdasmen — Kerangka Asesmen TKA Biologi SMA** (`pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-pilihan/sma/biologi`) | MUATAN resmi: (1) Keanekaragaman hayati = klasifikasi & keanekaragaman (konteks Indonesia), bakteri (Gram +/−, peran, resistensi), ekosistem (komponen, interaksi, pelestarian); (2) Sel = metabolisme (katabolisme, anabolisme, sifat & cara kerja enzim); (3) Proses pada makhluk hidup = sirkulasi/respirasi/ekskresi + keterkaitan antarsistem, sistem imun, sistem koordinasi (saraf & hormon), reproduksi pria/wanita; (4) Keterampilan proses = mempertanyakan & memprediksi, merencanakan penyelidikan, mengolah data & menyimpulkan. TIGA level kognitif: pemahaman, penerapan, penalaran. + 10 contoh soal resmi berkunci (PG, PGK-MCMA, PGK Kategori) |
| **Zenius — Kisi-kisi & Contoh Soal TKA Biologi SMA 2026** (`zenius.net/blog/kisi-kisi-dan-contoh-soal-tka-biologi`) | Konfirmasi penekanan kisi-kisi per elemen + contoh soal PGK-MCMA (RE kasar/halus; jaring makanan laut) berkunci |
| guru.kemendikdasmen.go.id — CP Biologi Fase F | Payung kurikulum: elemen pemahaman & keterampilan proses Fase F |

**Temuan penting:** cakupan TKA Biologi ≠ silabus kelas 12 semata (genetika/
evolusi TIDAK masuk matriks). Karena itu bab materi mengikuti **matriks
resmi**, bukan urutan buku kelas 12 — ini yang membuat materi "sesuai TKA 2026".

## 2. Pemetaan bab → elemen resmi

| Bab | Elemen/Sub-elemen resmi | Cara Gemilang di bab |
|---|---|---|
| 1 Keanekaragaman Hayati | klasifikasi & keanekaragaman; bakteri; ekosistem | 3 pertanyaan klasifikasi; 3 langkah kasus resistensi; arah rambatan jaring makanan |
| 2 Sel & Metabolisme | metabolisme sel; peran enzim | gejala→organel 3 langkah; "enzim dalam 4 kata" |
| 3 Sirkulasi/Respirasi/Ekskresi | transport & pertukaran zat; keterkaitan antarsistem | 3 langkah baca tabel lab; trio cepat darah (Hb/Ht, leukosit, trombosit) |
| 4 Imun, Koordinasi, Reproduksi | imun; koordinasi; reproduksi | pasangan hormon cepat; jebakan opsi IUD |
| 5 Keterampilan Proses | matriks keterampilan proses + strategi 3 level kognitif | jebakan "langsung tindakan"; aturan "didukung data" |

## 3. Inventaris soal (14) & provenance

| Bab | Soal | Format | Kunci | Sumber |
|---|---|---|---|---|
| 1 | Paus vs hiu (klasifikasi) | PG | D | Resmi Pusmendik no. 2 |
| 1 | Jaring makanan laut (ikan kecil turun) | PG + gambar | D | Zenius (1); gambar diunggah ke Supabase `soal-gambar/tka-bio-jaring-makanan-zenius.png` |
| 1 | Malaria kina/DDT (tabel) | PGK kategori | Tidak Tepat, Tepat, Tidak Tepat | Resmi Pusmendik no. 1 |
| 2 | Sel kekurangan mitokondria | PG | A | Resmi Pusmendik no. 8 |
| 2 | Kerusakan RE kasar & halus | PGK-MCMA | 1,2,3,5 | Zenius (2) |
| 2 | Sifat enzim | PG | B | Gemilang Drill (berlabel) |
| 3 | Napas saat olahraga | PG | A | Resmi Pusmendik no. 5 |
| 3 | Tabel lab darah Amir | PGK-MCMA | B | Resmi Pusmendik no. 9 |
| 3 | Organ & zat ekskresi | PGK kategori | B,B,S | Gemilang Drill (berlabel) |
| 4 | Peran tiroksin | PG | A | Resmi Pusmendik no. 6 |
| 4 | Tujuan pemasangan IUD | PGK-MCMA | A,C,E | Resmi Pusmendik no. 3 |
| 4 | Pasangan hormon | PG | A | Gemilang Drill (berlabel) |
| 5 | Langkah pertama metode ilmiah (stunting) | PG | A | Resmi Pusmendik no. 4 |
| 5 | Keterampilan mengolah data | PGK-MCMA | A,B,D | Gemilang Drill (berlabel) |

## 4. Yang DISENGAJA tidak dimasukkan (prinsip: jangan dipaksa)

- **Soal resmi no. 7** (sumbatan saluran reproduksi pria, kunci D): gambar
  stimulus (`pusmendik.../cbt_images/23147_...png`) **tidak terjangkau dari
  sandbox** (fetch gagal) → tidak dipasang setengah-setengah. Kandidat batch
  berikutnya: owner simpan gambar via browser lalu unggah ke Bank Materi.
- **Soal resmi no. 10 (SSJ) & contoh Zenius (3) grafik Covid**: teks opsi
  terpotong saat riset → menunggu salinan lengkap.
- Genetika/evolusi/biotek: tidak masuk matriks TKA Biologi resmi → tidak
  dibuat (hemat kuota & fokus), walau ada di silabus kelas 12.

## 5. Kepatuhan doktrin

- Penjelasan ditulis orisinal (parafrase konsep standar), rumus diketik KaTeX.
- Soal resmi dikutip verbatim + **chip sumber** otomatis; kunci dari dokumen
  resmi/sumber, tidak ditebak.
- Latihan orisinal berlabel jujur "Gemilang Drill".
- Soal bergambar dibawa lengkap dengan gambarnya (1 gambar, di Supabase).
- Format jawaban mengikuti ujian asli: PG, PGK-MCMA (`pgMulti`), PGK kategori
  (`tabel`) — semuanya sudah didukung sistem sejak PR #19.

## 6. SUMBER GAMBAR (doktrin Turn 32: DILARANG gambar buatan AI)

Acuan utama gambar = **buku paket/modul resmi**, acuan pelengkap = blog/situs
berkredit. Sejak Turn 32 seluruh diagram SVG buatan AI DIHAPUS dari draft.
Pengganti bab 2: crop gambar dari **BSE Biologi untuk SMA/MA Kelas XII,
Kemendikdasmen (ISBN 978-602-427-958-5)** yang PDF resminya gratis di SIBI
(buku.kemendikdasmen.go.id): Gambar 1.4 & 1.5 (hal. 7, mekanisme enzim /
lock-and-key; buku mencantumkan sumber aslinya Biology Brain 2022),
Gambar 1.13 (hal. 18, tahapan respirasi aerob), Gambar 1.22 (hal. 33,
reaksi terang-gelap). Semua crop diunggah ke Supabase
`materi-v2/gambar-sumber/bse-k12-*.jpg` dengan kredit buku + halaman.

**Kebutuhan gambar bab 1 (BELUM ada sumber paket gratis):** struktur sel
bakteri, tingkatan takson, jaring-jaring makanan materi -> menunggu PDF
modul biologi Bimbel Gemilang / buku paket yang dipakai owner untuk
di-crop (mohon owner kirim file). Sementara bab 1 berjalan tanpa gambar
materi (gambar soal UN/zenius tetap ada, berkredit).

## 7. SUMBER SOAL YANG DISAHKAN OWNER (Turn 32)

Soal asli boleh diambil dari: **TKA tahun sebelumnya, SIMAK UI, UM UGM
beberapa tahun terakhir**, serta situs gratis lain di internet — selalu
dengan label sumber + kunci terverifikasi pembahasan. Rumus/Cara Gemilang
= jembatan keledai / tips / cara cepat / singkatan kreatif untuk materi
yang sulit, bukan untuk semua hal.

## 8. KERANGKA BUKU PAKET YANG SUDAH DIPELAJARI (Turn 33)

Peran tim kurikulum: buku paket = KERANGKA + sumber gambar; dipadukan dengan
sumber lain (soal asli, situs) agar "Gemilang kuat". Daftar pustaka lengkap
disimpan per materi di field `daftarPustaka` (admin-only, Turn 33).

| Buku paket (pdf resmi gratis) | Isi/kerangka yang dipakai |
|---|---|
| BSE Biologi K12 Kurmer (ISBN 978-602-427-958-5, 280 hal) | Bab 1 Enzim & Metabolisme (kerangka bab 2 kita + gambar hal. 7/18/33); Bab 2 Genetika & pewarisan; Bab 3 Evolusi; Bab 4 Bioteknologi (kerangka bab lanjutan/program 12) |
| BSE Biologi K10 K-13 (280 hal, host BSE lama resmi) | Bab 2 keanekaragaman & klasifikasi (Gambar 2.13 lima kingdom hal. 40); Bab 4 monera/bakteri (Gambar 4.1 & 4.2 hal. 78); Bab 9 ekosistem & bioma (foto bioma hal. 236-239) → kerangka + gambar bab 1 kita |
| BSE K11 | BELUM KETEMU pdf resmi gratis (SIBI hanya K12; host lama belum ditemukan) → dicarikan lagi; sementara kerangka sistem tubuh/imun/koordinasi/reproduksi pakai matriks TKA + sumber berkredit |

Catatan hak cipta: semua gambar buku dikutip sebagai kutipan pendidikan
berkredit (judul buku + halaman + sumber asli yang dicantumkan buku);
file pdf disimpan hanya di sandbox kerja, tidak di-upload ke Supabase
(yang di-upload hanya crop gambar berkredit).

## 9. WORKFLOW MEMBACA & MENYUSUN MATERI (WAJIB, Turn 36 — menggantikan cara lama)

Koreksi owner: materi versi lama = kilasan/deskripsi, tidak mencerminkan
materi inti. Cara baru (dipakai untuk SEMUA bab & mapel selanjutnya):

1. **Ambil matriks resmi** (Pusmendik/kerangka asesmen mapel tsb): daftar
   Elemen -> Sub-elemen/Submateri -> Kompetensi -> Batasan.
2. **Pecah lagi tiap Sub-elemen menjadi FOKUS-FOKUS bimbel** (sub-sub
   materi) - inilah "dasar berpikir" yang dimaksud owner; satu fokus =
   satu blok belajar dengan judul level-2 di reader (A.1, A.2, ...).
3. **Uraian tiap fokus HARUS rinci**: pengertian -> mekanisme/langkah ->
   contoh -> kasus/pengecualian -> (bila relevan) nilai klinis/ekologis.
   Dilarang menulis kilasan satu paragraf per sub-elemen.
4. **Sumber buku DICAMPUR**: BSE/buku paket resmi (utama, kerangka +
   gambar berkredit) + buku/blog materi lain yang setara (pelengkap);
   semua masuk daftarPustaka admin. BSE boleh dicari lewat mirror/blog/web
   lain bila situs resmi tidak menyediakan.
5. **Gambar** per fokus dari buku paket berkredit (crop halaman); jangan
   membuat gambar sendiri.
6. **Soal dicari SETELAH materi jadi**, dipetakan per fokus; campuran soal
   asli (UN/TKA/UTBK/SIMAK UI/UM UGM, berlabel) + soal HOTS (analisis
   data, prediksi gangguan, evaluasi solusi) buatan tim berlabel jujur
   "Gemilang HOTS Drill". Minimal 15-20 soal per bab.
7. **Cara Gemilang** = jembatan keledai/singkatan kreatif/cara cepat untuk
   konsep sulit saja; **Catatan Guru** = callout tipe 'guru' (khusus guru).
8. Validasi draft (scripts/validasi-draft.mjs) -> commit -> PR -> owner
   impor (mode tambah-bab / ganti bab lama).

Status penerapan: Bab 1 Biologi SUDAH versi dalam (46 sections, 14 fokus,
18 soal; draft-biologi-k12-v3-bab1.json). Bab 2-5 biologi & mapel lain
MENUNGGU dikonversi ke workflow ini (bab lama v2 tetap terpakai sementara
sampai diganti).
