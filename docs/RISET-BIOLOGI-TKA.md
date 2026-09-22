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
