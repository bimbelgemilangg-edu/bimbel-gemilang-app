# Rancangan v1.5 — Model Bukti Bertingkat (" DATA BELUM CUKUP" jadi profesional)

Status: **DISETUJUI OWNER & DIIMPLEMENTASI (2026-10-31)** — rilis v1.5.
Catatan implementasi: (1) baris T3 diisi dari `enrolledSubjects` siswa (kode
'semua' diurai lewat `daftarMapelUntuk` peta kurikulum) sehingga mapel terdaftar
tanpa asesmen benar-benar tampil sebagai baris rencana; jaring `mapelSahUntukSiswa`
tetap berlaku sehingga mapel luar jenjang tak pernah muncul. (2) Badge di layar
guru diwujudkan sebagai baris info universal ("capaian Anda = isi utama PDF orang
tua") — benar untuk semua siswa sesuai desain v1.4, sekaligus menutup niat badge
per-tier tanpa membebani halaman guru dengan muatan log penuh. (3) Field lama
(`layakTerbit`, `statusData`) DIPERTAHANKAN untuk kompatibilitas cron/api/test.
Tanggal: 2026-10-31. Mesin terkait: `src/utils/raportOtomatis.js` (VERSI_MESIN v1.3),
`src/utils/raportCetak.js`, `src/utils/laporanBelajar.js`, halaman admin & guru.

---

## 1. Masalah yang diselesaikan

Aturan hari ini: mapel `layak` bila **≥2 komponen asesmen & ≥3 titik nilai**; siswa berstatus
`DATA BELUM CUKUP` (merah, tabel admin) bila **nol mapel layak**. Pada praktiknya di Bimbel
Gemilang, penyebab utamanya **bukan siswa malas** melainkan **asesmen belum dijadwalkan
tutor pada periode itu** — celah operasional lembaga, bukan kekurangan anak. Menampilkannya
sebagai "status siswa" (apalagi merah) tidak profesional dan menyesatkan; menyembunyikannya
dari ops juga salah karena justru itu daftar kerja yang harus dibereskan.

## 2. Temuan riset (prinsip yang dipakai)

1. **Jangan mengarang angka, jangan menghukum.** Kompetensi berbasis bukti: bila bukti
   belum cukup, sekolah profesional memakai kode resmi netral — "Insufficient Evidence (IE) /
   Not Yet Assessed (NYA) — No Score" — bukan nilai nol atau nilai merah
   (Three Rivers School Handbook 2023-24; SD48 "Insufficient Evidence (IE)"; Parent Guide
   to Standards-Based Grading: "the zero is replaced with an IE").
2. **Kode IE adalah alat komunikasi + rencana, bukan vonis.** Kebijakan K-12: IE hanya
   pantas bila ada jalur & minat untuk menunjukkan bukti lanjutan — artinya wajib dipasang
   bersama langkah berikutnya ("K-12 Student Reporting Policy").
3. **Kebijakan resmi Ontario (Growing Success):** bila bukti tidak cukup untuk menentukan
   huruf/persen, laporan WAJIB menandai hal itu secara eksplisit (tidak ditutup-tutupi),
   dan penilaian memakai bukti yang paling konsisten dari berbagai sumber.
4. **Angka tanpa narasi tidak bermakna** — prinsip rapor Kurikulum Merdeka / Permendikbud:
   deskripsi naratif wajib menyertai angka (umpan balik untuk orang tua).
5. **Report card = titik awal action plan** (Mathnasium, riset v1.3): setiap sinyal lemah
   harus punya rencana tindak lanjut yang tertulis.

Kesimpulan desain: **pertahankan kejujuran bukti, ubah bingkainya** — dari "status kekurangan"
menjadi "profil bukti + rencana", dengan bahasa yang berbeda untuk tiga audiens:
orang tua (narasi positif-lengkap), guru (konteks penugasan), ops/admin (antrean aksi).

## 3. Desain: tiga tingkat bukti per mapel (tier)

| Tier | Kondisi (data otomatis) | Tampil di PDF orang tua | Tampil di admin (internal) |
|---|---|---|---|
| **T1 Terukur penuh** | aturan sekarang: ≥2 komponen & ≥3 titik | nilai + predikat + narasi (seperti kini) | chip hijau `T1` |
| **T2 Gambaran awal** | ada komponen tapi di bawah ambang | blok "Gambaran awal": fakta terukur + narasi proses, **tanpa predikat resmi** (sudah ada wording v1.2 "gambaran awal … capaian dimatangkan otomatis oleh asesmen berikutnya") | chip kuning `T2` + hitungan titik |
| **T3 Dalam penjadwalan** | 0 komponen asesmen periode ini | blok "Fokus pendampingan & rencana asesmen": apa yang akan diukur periode depan + fokus tutor — **tanpa kata kekurangan** | chip abu `T3` + alasan ops (mapel belum dijadwalkan kuis/TO) |

Aturan lintas tier:
- **Overlay tentor (v1.4) adalah sumber utama**: bila `laporan_belajar` terisi untuk suatu
  mapel, blok kualitatif tentor tampil sebagai isi utama **apa pun tier-nya**; tier hanya
  mengatur apakah angka otomatis ikut tampil (T1/T2) atau diganti rencana (T3).
- Siswa dengan T1=0 tetapi tentor mengisi → PDF tetap kaya (capaian tentor + bahan otomatis).
  Kasus "PDF kosong melompong" praktis hilang tanpa menurunkan standar bukti angka.
- Siswa T1=0 DAN tentor belum mengisi → PDF tetap terbit SATU, berisi fakta proses yang ada
  (kehadiran, keaktifan sesi, latihan) + rencana; admin melihat peringatan "perlu input tentor
  sebelum cetak" pada siswa tsb (bukan larangan, tapi penanda prioritas).
- `kelayakan.layakTerbit` DIPERTAHANKAN sebagai field kompatibilitas (cron/api/test lama),
  tetapi makna operasional baru = `profilBukti`: { t1, t2, t3, adaCapaianGuru }.

## 4. Perubahan tampilan admin (menggantikan "DATA BELUM CUKUP")

- Kolom Status → **chip profil bukti**: `2 T1 · 1 T2 · 1 T3` + ikon ✍️ bila capaian tentor
  sudah ada untuk ≥1 mapel; warna netral (hijau/kuning/abu), bukan merah menuduh.
- Baris ringkasan: "10 siswa · 6 profil bukti lengkap · 4 perlu rencana/inputs tentor"
  (angka jujur, bahasa kerja).
- Kartu baru **Antrean Aksi Bukti** (di bawah pratinjau): daftar siswa T1=0 beserta penyebab
  terdeteksi otomatis: (a) mapel belum menjadwalkan kuis/TO periode ini → aksi ops: jadwalkan;
  (b) tentor belum mengisi capaian → aksi: ingatkan guru (tautan ke progres pengisian);
  (c) siswa memang tidak hadir sama sekali → aksi: konfirmasi kehadiran ke orang tua.
  Kartu ini mengubah status buntu menjadi **daftar kerja ber-pemilik** — inti profesionalisme.
- Rincian per siswa tetap memuat diagnosa lengkap (titik data per komponen) untuk owner.

## 5. Wording bank (kunci: nol frasa defisit di PDF orang tua)

- T2: "Gambaran awal — berdasarkan N asesmen yang sudah berjalan; capaian dimatangkan
  otomatis oleh asesmen berikutnya." (sudah ada, dipertahankan)
- T3: "Asesmen terjadwal untuk [mapel] berlangsung pada periode berikutnya; laporan periode
  ini memfokuskan pada pendampingan: [fokus tutor/rencana]." + baris rencana konkret.
- Siswa tanpa capaian tentor & T1=0: "Laporan pendampingan — kehadiran X%, keaktifan sesi …,
  latihan …; rencana periode depan: …" (semua fakta yang ADA disebutkan; tidak menyebut
  ketiadaan sebagai kekurangan).
- Admin boleh tetap teknis ("T3 — 0 komponen; kuis belum dijadwalkan") karena audiens internal.

## 6. Peta integrasi (file & fungsi yang disentuh bila disetujui)

1. `raportOtomatis.js`: `tierBuktiMapel(m)` murni (T1/T2/T3 dari jumlahKomponen/titikData);
   `profilBuktiSiswa(h)`; field baru di `kelayakan` (tanpa menghapus field lama);
   `alasanT3` (mapel tanpa asesmen vs siswa tanpa kehadiran).
2. `raportCetak.js`: renderer per tier (blok T2/T3), overlay tentor tetap primer;
   penjaga frasa terlarang diperluas ke wording tier baru.
3. `RaportOtomatisPage.jsx`: chip profil bukti, ringkasan bahasa kerja, kartu Antrean Aksi
   Bukti (data dari profilBukti + sakelar laporan_belajar).
4. `LaporanBelajarPage.jsx` (guru): badge "bukti otomatis tipis — penilaian Anda sumber utama"
   pada siswa T2/T3 milik guru tsb (mendorong pengisian tepat pada yang paling butuh).
5. Tests: tier murni (≥8 kasus), cetak (0 frasa terlarang lintas tier), kompat field lama,
   antrean aksi (3 penyebab). Harness: scenario PDF siswa T3+capaian guru & siswa T3 polos.

## 7. Opsi keputusan untuk owner

- **Opsi 1 (rekomendasi asisten): v1.5 penuh** — tier + overlay + chip + antrean aksi sekaligus
  (±1 commit besar, test lengkap). Standar bukti angka TIDAK diturunkan (T1 tetap ≥2/&≥3).
- **Opsi 2: bertahap** — tahap a: wording PDF + chip admin (aman segera); tahap b: antrean aksi.
- **Opsi 3: tunda** — pertahankan status quo internal; PDF orang tua sudah aman sejak v1.3.

Catatan: opsi A/B lama di DIAGNOSIS §7 terserap ke sini — ambang T1 tetap (jujur), relaksasi
tidak perlu karena tier T2/T3 + overlay tentor menyelesaikan keluhan "rapor tipis/kosong"
tanpa memalsukan angka. Tool reparasi identitas (opsi C lama) tetap terpisah & masih disarankan.

## 8. Sumber riset

- Ontario MoE, *Growing Success* (2010): penandaan eksplisit bila bukti tak cukup untuk nilai.
  https://www.edu.gov.on.ca/eng/policyfunding/growsuccess.pdf
- SD48 (Maple Ridge–Pitt Meadows): simbol IE untuk alert orang tua + jalur bukti lanjutan.
  https://www.sd48staff.org/apps/pages/index.jsp?uREC_ID=1117960&type=d&pREC_ID=1388350
- Three Rivers School Handbook 2023-24: "Insufficient Evidence … No Score. NYA. Not Yet Assessed."
- K-12 Student Reporting Policy: IE hanya pantas bila ada minat/jalur menunjukkan bukti lanjutan.
- Parent Guide to Standards-Based Grading: nol diganti IE, bukan nilai hukuman.
- Mathnasium report-card-as-action-plan (risit v1.3): sinyal lemah wajib punya rencana tertulis.
- Permendikbud 104/2014 & bahan pelaporan Kurikulum Merdeka: narasi deskriptif wajib mendampingi angka.
