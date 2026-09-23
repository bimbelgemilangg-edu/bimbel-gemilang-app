#  POLA SOAL SERING KELUAR & SELEKSI SOAL ASLI — BIOLOGI TKA 2026

> Dokumen kerja tim kurikulum Bimbel Gemilang (peran **guru penulis soal**).
> Isi: SOP memilih soal dari berbagai sumber berdasarkan pola yang berulang di
> internet/ujian resmi, bukti keterulangan, pemetaan ke draft bab, serta audit
> gambar soal. Pendamping: `RISET-BIOLOGI-TKA.md` (matriks Pusmendik) dan
> `PETA-KESELARASAN-MODUL-TKA.md` (modul tentor).
> Terakhir diperbarui: **Turn 55** (23 Sep 2026).

---

## 1. SOP GURU PENULIS SOAL (6 langkah)

1. **Deteksi pola berulang.** Cari soal yang sama/mirip di ≥2 sumber independen
   (pembahasan UN per tahun: kakajaz.blogspot, pak.pandani.web.id; bank soal:
   kejarcita, roboguru.ruangguru; dokumen resmi Pusmendik; paket UTBK/SBMPTN).
   Soal yang muncul lintas tahun & lintas sumber = pola kuat → wajib masuk bab.
2. **Verifikasi kunci resmi.** Kunci WAJIB diambil dari pembahasan sumber
   (bukan dikarang). Bila dua sumber bertentangan → hitung ulang dari konsep,
   catat putusan di `pembahasan` soal.
3. **Verbatim atau adaptasi jujur.** Soal asli dipertahankan verbatim berlabel
   `sumber`; adaptasi (tabel→teks, perbaikan pengecoh, redenominasi) WAJIB
   dicantumkan di field `sumber` agar tidak menyesatkan siswa/admin.
4. **Gambar berkredit, tidak hotlink.** Gambar soal asli diunduh lalu diarsip
   ke Supabase `materi-bimbel/materi-v2/soal-gambar/` (URL publik sendiri);
   kredit sumber masuk `daftarPustaka` (admin-only, tersembunyi dari siswa).
   Bila gambar asli tak tersedia → skema ORISINAL tim kurikulum atau soal
   dibuat mandiri-teks (semua data stimulus ada di teks).
5. **Bobot sesuai sub-bab.** `pembahasan` harus menerangkan konsep sub-bab yang
   diuji (fungsi organ, mekanisme, arah proses), bukan sekadar menyebut huruf
   kunci; setiap soal dipetakan ke fokus matriks TKA (lihat §2).
6. **Validasi berlapis.** `scripts/validasi-draft.mjs` + audit URL gambar
   (HEAD harus 200) + cek 6 format soal per bab + cek satu-kunci-benar untuk
   tipe `pg` (semua pengecoh harus salah secara definitif).

---

## 2. BUKTI POLA BERULANG → PEMETAAN KE DRAFT

Keterangan level: C2=pahaman, C3=aplikasi, C4=analisis(HOTS), C5=evaluasi(HOTS).
Nomor soal = urutan tampil di reader (indeks+1).

### Bab 3 — Sistem Tubuh Manusia (19 soal)
| Pola sering keluar | Bukti keterulangan | Soal draft | Format | Level |
|---|---|---|---|---|
| Hubungan gambar-struktur-fungsi sel darah | UN 2018 no.14 (kakajaz, pandani) | #1 | jodoh | C2 |
| Siklus jantung & jalur sirkulasi pulmonal/sistemik | UN lintas tahun; modul tentor hal. sirkulasi | #2, #3 | tabel, pg | C2-C3 |
| Ciri struktur arteri/vena/varises | UN 2016-2019; bank soal kejarcita | #4, #7 | pg | C3 |
| **Fungsi organ ekskresi-sirkulasi (hati=glikogen; paru=ikat O2)** | **UN 2018 no.15** (kakajaz + pandani + ruangguru) | **#5** | pg+gambar | C3 |
| Pembekuan darah/hemofilia | UN 2015-2018 | #6 | pg | C3 |
| Asma & mekanisme pernapasan dada/perut | UN hampir tiap tahun | #8, #9 | pg, tabel | C3-C4 |
| **Hitung kapasitas paru (tidal+cadangan)** | UN hampir tiap tahun (paket berbeda angka) | #10, #11 | pg, isian | C4 |
| Transport CO2 sebagai bikarbonat | UTBK 2019-2022; modul tentor | #12 | pg | C4 |
| Emfisema/rokok & uji urine (glukosa/protein) | UN 2017 no.19 (protein-glomerulus, kakajaz); UN lintas tahun | #13, #16 | pg | C4 |
| Organ ekskresi & produknya | UN lintas tahun | #14 | jodoh | C2 |
| Urutan filtrasi-reabsorbsi-augmentasi | UN hampir tiap tahun | #15 | pg | C3 |
| Kelainan-mekanisme (asma, emfisema, nefritis) | UN/UTBK | #17 | jodoh | C4 |
| Integrasi antarsistem (lari → wajah memerah) | UTBK HOTS; pola "keterkaitan antarsistem" matriks Pusmendik | #18 | pgMulti | C4 |
| Esai regulasi frekuensi napas | Gemilang Drill (pola esai TKA) | #19 | uraian | C5 |

### Bab 4 — Imun, Koordinasi & Reproduksi (20 soal)
| Pola sering keluar | Bukti keterulangan | Soal draft | Format | Level |
|---|---|---|---|---|
| ASI/kolostrum & imunitas bawaan | UN 2016-2019 | #1 | pg | C2 |
| Garis pertahanan non-spesifik | UN lintas tahun | #2 | pg | C2 |
| Antigen-antibodi, aglutinasi | UN/UTBK | #3, #4 | pg | C3 |
| Imunitas sekunder/memory cell | UN 2018-2021 | #5 | pg | C4 |
| **Hubungan nomor-bagian-fungsi mata** | **UN 2017 no.17** (kakajaz + pandani + kejarcita + roboguru = 4 sumber) | **#6** | pg+gambar | C2-C3 |
| Macam imunitas (aktif/pasif, alami/buatan) | UN lintas tahun | #7 | jodoh | C3 |
| Mekanisme respons imun & autoimun | UTBK 2020-2023 | #8, #9 | tabel, pgMulti | C4 |
| **Urutan busur refleks** | **UN 2017 no.16** (kakajaz); UN lintas tahun | #10 | pg | C3 |
| Saraf autonom simpatik/parasimpatik | UN hampir tiap tahun | #11 | pg | C3 |
| Kelenjar endokrin & hormon utama | UN hampir tiap tahun | #12 | jodoh | C2 |
| ADH/poliuri & regulasi air | UN 2018-2022 | #13 | pg | C4 |
| **Fase siklus menstruasi** | **UN 2017 no.18** (kakajaz); UN lintas tahun | #14 | tabel | C4 |
| Spermatogenesis vs oogenesis | UN hampir tiap tahun | #15 | pg | C3 |
| Kontrasepsi & penyakit menular seksual | UN 2017-2019 | #16, #17 | pg, pgMulti | C3 |
| Regulasi gula darah insulin-glukagon | UTBK sering; modul tentor | #18 | pg | C4 |
| Esai lintasan saraf terputus | Gemilang Drill (pola esai TKA) | #19 | uraian | C5 |
| Perbandingan saraf vs hormon | UN lintas tahun | #20 | pg | C3 |

### Bab 1 & 2 (ringkas; bukti lengkap di `RISET-BIOLOGI-TKA.md`)
Pola kuat yang sudah masuk: taksonomi & binomial (UN tiap tahun), ciri kelompok
hewan/arthropoda bergambar (UN 2018), peran bakteri bergambar tabel (UN 2019),
jaring-jaring makanan & dampak gangguan (UN/TKA Zenius), ekosistem-bioma,
daur nitrogen/sulfur; enzim lock-and-key & denaturasi (UN), hasil bersih
glikolisis (UTBK), tahapan respirasi-tempat (UN), fermentasi (UN), produk
reaksi terang & siklus Calvin (UN/UTBK), grafik laju fotosintesis (UTBK HOTS).

**Kesimpulan guru:** 100% soal bab 3 & bab 4 terpeta ke pola yang pernah muncul
di UN/UTBK atau drill HOTS berlabel jujur; tidak ada soal "asal karang" tanpa
pola. Soal bergambar kini semua punya arsip gambar sendiri di Supabase.

---

## 3. AUDIT GAMBAR SOAL (Turn 55)

Audit HEAD ke-16 URL gambar yang dipakai draft bab 1-4:
- **15 URL = 200 OK** (9 gambar-sumber BSE/alodokter/spada + 5 soal-gambar UN/Zenius).
- **1 URL = 400 (file TIDAK ADA di bucket):** `soal-gambar/un2018-organ-ekskresi-sirkulasi.jpg`
  (dipakai bab 3 #5) → inilah "gambar rusak" di reader live.
- **1 soal menyebut gambar tapi field `soalGambar` tidak ada:** bab 4 #6 (mata).

Perbaikan (unggah upsert + verifikasi HEAD 200):
| File baru di Supabase | Asal | Dipakai |
|---|---|---|
| `materi-v2/soal-gambar/un2018-empat-organ.jpg` (373×133) | foto soal asli UN 2018 no.15 via kakajaz.blogspot.com | bab 3 #5 |
| `materi-v2/soal-gambar/un2017-penampang-mata.jpg` (203×215) | foto soal asli UN 2017 no.17 via kakajaz.blogspot.com | bab 4 #6 |

Kredit lengkap ada di `daftarPustaka` masing-masing bab (admin-only).

---

## 4. PERBAIKAN SOAL OLEH GURU (Turn 55)

1. **Bab 3 #5 (UN 2018 no.15).** Gambar dipulihkan; penomoran gambar diverifikasi
   dari pembahasan asli (1 paru-paru, 2 kulit, 3 hati, 4 ginjal — cocok dengan
   stem); kunci D dikonfirmasi 2 sumber; pembahasan diperkaya fungsi keempat
   organ (bobot sub-bab ekskresi+sirkulasi).
2. **Bab 4 #6 (UN 2017 no.17).** Versi lama CACAT sebagai pg tunggal: tiga opsi
   (sklera=pelindung, iris=warna+cahaya, koroid=pembuluh darah) sama-sama benar
   secara konsep → lebih dari satu kunci. Dipulihkan ke baris opsi resmi UN 2017
   (tabel asli → teks): tiap baris = nomor+bagian+fungsi, hanya baris 3
   (pupil = mengatur cahaya masuk) yang benar penuh → kunci C sesuai kunci
   resmi. Gambar penampang mata asli dipasang; pembahasan memuat kelima
   hubungan resmi sebagai materi belajar.
3. **Catatan owner:** bab 3 & bab 4 LIVE masih versi lama → setelah merge PR,
   hapus bab lama lalu Impor `IMPOR-BIOLOGI-BAB3/4-TERBARU.json` (mode tambah
   bab) atau edit 2 soal itu lewat Editor Bab v2.

---

## 5. CATATAN GURU UNTUK PENGAJARAN

- Pola **mata**, **kapasitas paru**, **urutan urine**, **siklus menstruasi**,
  **hormon**, dan **busur refleks** muncul hampir setiap tahun → jadikan materi
  wajib tampil di kelas dengan gambar/proyektor (semua sudah punya gambar).
- Soal hitungan (kapasitas paru) dan analisis grafik (fotosintesis) adalah
  pembeda nilai TKA → latih dengan timer.
- Bila owner menambah soal dari modul tentor, jalankan SOP §1 langkah 1-6 dulu;
  modul tentor ≈85% selaras matriks (lihat PETA-KESELARASAN-MODUL-TKA.md).
