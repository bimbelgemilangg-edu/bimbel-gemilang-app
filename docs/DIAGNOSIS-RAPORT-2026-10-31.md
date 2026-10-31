# DIAGNOSIS FITUR RAPORT OTOMATIS — 31 Okt 2026

Status: **fitur BENAR & tertutup audit; 3 bug diperbaiki di v1.1 (commit ini);
"DATA BELUM CUKUP" di produksi BUKAN bug mesin melainkan aturan kelayakan +
data tipis + peringatan orphan yang dulu salah tuduh.**

Diperiksa pada build ter-deploy `e1dfa37` (= HEAD main sebelum commit ini).
Semua klaim di bawah punya bukti: baris kode, uji (`npm test` 128/128 berkas),
dan harness `deliverables/harness-raport.mjs` (di workspace asisten) yang
menjalankan MESIN ASLI atas data sintetis berbentuk sama dengan produksi.

## 1. Apakah fiturnya benar?
Ya. Alur sesuai blueprint ANALISIS-RAPORT-OTOMATIS §9 dan berjalan:
muat log (kuis, TO, absensi, tugas, latihan, XP) → `hitungRaportSemuaSiswa`
(src/utils/raportOtomatis.js) → pratinjau → TERBITKAN snapshot terkunci ke
`raport_final` (id deterministik = idempoten) → cetak PDF tunggal/massal
(src/utils/raportCetak.js) → cron bulanan (api/raport-bulanan.js).

## 2. Tertutup audit? YA.
| Aksi | Label audit | Lokasi |
|---|---|---|
| Terbitkan snapshot | `raport.terbitkan` | RaportOtomatisPage.jsx:269 |
| Terbit ulang paksa (+alasan wajib ≥5 karakter) | `raport.terbitkan-ulang` | RaportOtomatisPage.jsx:269 |
| Backfill Agu–Okt | `raport.backfill` | RaportOtomatisPage.jsx:310 |
| Cetak PDF tunggal / massal | `raport.cetak` | RaportOtomatisPage.jsx:359, 393 |
| Cron bulanan (peran `sistem`) | `raport.terbitkan-otomatis` | api/raport-bulanan.js:201 |
Pratinjau TIDAK diaudit (sengaja: baca murni, tidak menulis apa pun).

## 3. Jaring laba-laba (radar)? SUDAH diterapkan (Fase 3, e1dfa37).
- `poinRadar/svgRadar/seriRadarDariModel` di src/utils/raportCetak.js:244-370;
  dipakai `bagianPerkembangan` → ikut di **cetak tunggal DAN massal**
  (htmlRaportMassal memakai `bagianSiswa` yang sama).
- Layar siswa: komponen `RadarDimensi` (SVG JSX) di RapotOtomatisSiswa.jsx.
- Aturan jujur: dimensi `null` TIDAK digambar di 0 (sumbu "belum terukur").
- Bukti harness: `radarAda: true` pada HTML tunggal & 11 blok radar pada massal.

## 4. Bug yang DITEMUKAN & DIPERBAIKI (v1.1)
### B1 — Jendela periode pakai kalender UTC, bisnisnya WIB (PARAH, senyap)
`rentangPeriode` lama: `Date.UTC(y, m-1, 1)` → aktivitas 1 Okt 00.00–06.59 WIB
masuk raport September; label tanggal dini hari WIB terbaca "hari kemarin".
Cron Fase 3 sudah berpikir WIB untuk jadwalnya — isi dan jadwalnya berpisah.
Fix: jendela = tengah malam WIB (`- SELISIH_WIB_MS`), `tanggalWib()` untuk
label epoch, `waktuMs('YYYY-MM-DD')` = tengah malam WIB. SATU SUMBER konstanta
WIB kini di raportOtomatis.js (raportCron.js ekspor ulang). Uji baru dipatok.

### B2 — Pratinjau BASI saat filter diganti (bius kebingungan screenshot)
Ganti jenjang/kelas/bulan tidak menghitung ulang → tabel tetap isi hitungan
lama (select "9 SMP" tapi baris "7 SMP" — dikira filter rusak). Fix: `useEffect`
menghitung ulang otomatis setiap filter/periode berubah (data sudah di memori).

### B3 — Peringatan "orphan" salah tuduh siswa di luar filter (menyesatkan)
Halaman dulu MEMFILTER siswa SEBELUM mesin → log siswa kelas lain dihitung
"log tak dikenal (identitas berubah/hapus)". Angka menakutkan di screenshot
(kuis 65, sesi 135, absensi 796, latihan 713) campur aduk: siswa luar filter +
orphan sungguhan. Fix: mesin melihat SEMUA siswa; sasaran hanya melabeli
`logLuarSaringan` (info biru), `logTakDikenal` kini orphan SUNGGUHAN saja;
ringkasan subset disusun `buatRingkasan()` (diekspor, teruji).

## 5. Akar "DATA BELUM CUKUP" di produksi — BUKAN bug mesin
Aturan kelayakan (raportOtomatis.js, KALIBRASI_V1): per mapel **≥2 komponen
(kuis/tugas/ujian) DAN ≥3 titik data** dalam periode. Oktober 2026 (bulan
berjalan) di produksi tipis: per mapel umumnya baru 1 komponen → mesin JUJUR
menolak mengarang angka (janji owner #2). Bukti harness:
- Skenario 1 (bulan tipis): 9 siswa · 0 layak · 9 belum cukup — PERSIS screenshot.
- Skenario 2 (Agu–Okt, mapel berisi 2 komponen): nilai KELUAR — MTK 87.1 (A),
  IPA 87 (A), rata-rata 87.1 (A), status SEBAGIAN, radar + ttd tercetak.
Jadi jalan pintas di produksi: pakai mode **Rentang Agu–Okt** atau tombol
**BACKFILL** (laporan besar 3 bulan), pastikan tiap mapel punya ≥2 sumber
nilai per periode. Sisa orphan SUNGGUHAN (identitas terhapus/berubah) tetap
perlu dirapikan — opsi tool reparasi menunggu keputusan owner (§7).

## 6. Efek v1.1 ke snapshot terkunci
Kunci dokumen (`studentId__mapel__periode`) tidak berubah; snapshot lama TETAP
terkunci. Angka periode lama bisa bergeser hanya bila diterbitkan ULANG
(paksa + alasan tertulis → audit). Versi mesin tercatat di dokumen: v1.1.

## 7. Menunggu keputusan owner (diagnosa dulu, baru rembukan)
- A. Pertahankan aturan ≥2 komponen & ≥3 titik (rekomendasi asisten: jujur).
- B. Relaksasi KALIBRASI (layak 1 komponen + label "satu komponen") — risiko:
  rapor bulan tipis terlihat resmi padahal bukti minim.
- C. Tool reparasi identitas (petakan log yatim ke siswa benar, lalu hitung
  ulang) — dibutuhkan berapapun pilihan A/B untuk menyelamatkan 796 absensi dll.
