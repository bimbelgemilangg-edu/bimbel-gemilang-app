# CETAK-BIRU-SUPER-APP.md — rencana induk Gemilang Super App

**Status:** 2026-10-14, dibuka di branch `rapi/fondasi-super-app-fase1`
**Sifat:** dokumen hidup — tiap fase yang selesai memperbarui bagian Statusnya.
**Rujukan silang:** `AUDIT-REPO.md` (utang kualitas), `README.md` (cara jalan),
`docs/SOP-KESELAMATAN-PERUBAHAN.md` (kaidah merge), `.github/workflows/ci.yml` (gerbang).

---

## 1. Prinsip super app kita

Satu codebase, satu login, satu sumber data, empat peran
(Admin/Kasir, Guru/Tentor, Siswa, Owner). "Super app" berarti:

1. **Fitur baru = modul baru di dalam app ini**, bukan aplikasi/repo baru.
   Modul mendaftar sebagai rute + menu berpagar peran (gerbang CI
   `ci-penjaga-rute.mjs` sudah menjaga rute terdaftar).
2. **Satu pintu kualitas.** Tidak ada kode masuk `main` tanpa lolos CI:
   uji logika, penjaga konten, penjaga rute, build produksi, dan lint bersih
   untuk berkas yang disentuh.
3. **Keputusan owner tercatat** di commit message + docs, bukan di kepala.
4. **Utang dibayar bertahap tanpa membekukan fitur** — gerbang CI hanya
   menolak berkas yang disentuh, sehingga hotfix darurat tetap jalan.

## 2. Kondisi saat ini (fakta terukur 2026-10-14)

| Aspek | Nilai |
|---|---|
| Stack | Vite 7 + React 19 + Tailwind 4; PWA (workbox) |
| Backend | 12 Vercel serverless functions (`api/`), Firestore, Supabase Storage (gambar) |
| Uji logika | 85 berkas / 351 subtest, runner otomatis paralel (`scripts/run-tests.mjs`) |
| Lint error | branch ini 55 (24 perilaku `react-hooks`/`react-refresh` + 31 mekanis yang menumpuk di 9 berkas fase 1); basis `main` 146 |
| Berkas "ranjau" (kotor) | 16 — menyentuhnya wajib bayar utang perilaku dulu |
| Komponen raksasa | `ImportHasilScanPage.jsx` ±5.410 baris; `api/generateQuizFromTopic.js` ±5.848 baris |
| Akar repo | 18 berkas `IMPOR-*.json` + 2 fixture HTML (±2,4 MB) dipakai `scripts/` |

## 3. Peta fase

### Fase 0 — Fondasi kualitas ✅ SELESAI (branch ini)
- Runner uji otomatis: semua `tests/*.test.mjs` terdeteksi & paralel;
  9 berkas uji yang terlupa rantai manual kini ikut terjaga.
- Utang lint mekanis dibayar: `no-unused-vars` 118→31, `no-case-declarations`
  2→0, `no-useless-escape` 1→0, `no-control-regex` diberi disable beralasan.
  Metode codemod kolom-presis, nol perubahan perilaku. Sisa 31 `no-unused-vars`
  menumpuk di 9 berkas berperilaku yang DITANGGUHKAN (gerbang CI: berkas
  tersentuh wajib bersih) — dilunasi bersama utang perilaku di Fase 1.
- Docs sinkron: README + addendum AUDIT-REPO + dokumen ini.

### Fase 1 — Lunasi utang perilaku & rampingkan repo
1. **24 error react-hooks** di 15 berkas (terbanyak: `IsiSections.jsx`,
   `slideMateri.jsx`, `LatihanAktivitasPage.jsx`, `ManageBlog.jsx`,
   `ManageSurvey.jsx`) + 31 `no-unused-vars` yang menumpang di 9 berkas
   berperilaku (`IsiSections.jsx`, `GradeReport.jsx`,
   `ManageOnlineRegistration.jsx`, `StudentElearning.jsx`, `StudentFinance.jsx`,
   `BelajarReader.jsx`, `TeacherAttendance.jsx`, `TeacherSchedule.jsx`,
   `ManageTugas.jsx`). Satu berkas per PR + uji perilaku yang menyentuhnya.
2. **Pindahkan `IMPOR-*.json` & fixture HTML** dari akar repo ke
   `data/impor/` (perbaiki path di `scripts/build-*.mjs`); akar repo bersih,
   clone lebih ringan. Sejarah git tetap menyimpan bobot lama — opsi lanjut:
   `git filter-repo` diputuskan terpisah (berisiko, butuh koordinasi tim).
3. **Pecah komponen raksasa** mulai dari yang paling sering disentuh:
   `ImportHasilScanPage.jsx` → sub-komponen per langkah impor;
   `api/generateQuizFromTopic.js` → modul prompt/parse/validasi.

### Fase 2 — Performa super app (HP siswa & kuota)
1. **Code-splitting per rute/peran** (`React.lazy`): siswa tidak mengunduh
   modul admin/owner; bundle awal target < 300 KB gzip.
2. **Audit PWA/workbox:** precache hanya shell + vendor; materi/gambar
   runtime-cache stale-while-revalidate; tombol "tersedia offline" per materi.
3. **Angka, bukan perasaan:** `vite build --profile` di CI artifact supaya
   regressi ukuran bundle terlihat per PR.

### Fase 3 — Konsolidasi fitur super app (keputusan owner)
Kandidat bernilai tertinggi berdasarkan dokumen yang sudah ada
(`CETAK-BIRU-GEMILANG-PREMIUM.md`, `PETA-SINKRONISASI-ADMIN-SISWA.md`, dll.):
1. Notifikasi terpadu (in-app + WA wali) dari satu modul `notifications`.
2. Pembayaran terpadu: semua transaksi (pendaftaran, paket, try out premium)
   lewat satu pintu Midtrans + rekonsiliasi otomatis di Finance.
3. Dashboard terpadu per peran: satu beranda berisi tugas/try out/jadwal/
   tagihan yang relevan untuk peran tersebut (hari ini tersebar per halaman).
4. Perpustakaan konten siswa lintas jenjang (materi + video + latihan)
   dengan pencarian seragam.

### Fase 4 — Operasional & keamanan
1. Rotasi berkala secret (PAT GitHub, GEMINI_API_KEY, MIDTRANS, SUPABASE) +
   daftar pemilik secret di satu tempat (tidak di chat/email).
2. Monitoring: error tracking frontend + log terstruktur `api/` (hari ini
   console.log), alert kuota AI (insiden lapis-0 sudah punya policy).
3. Uji beban ringan endpoint AI (timeout & fallback sudah ada; ukur p95).

## 4. Kaidah kerja harian (ringkas)

- Branch: `fitur/`, `perbaiki/`, `rapi/`, `hotfix/` + nama-deskriptif; PR ke
  `main`; merge hanya sesudah CI hijau (+ review owner untuk fitur).
- Uji baru: simpan `tests/<nama>.test.mjs` — runner menemukan otomatis.
- Sentuh berkas = tanggung jawab bikin berkas itu lint-bersih.
- Commit message gaya repo ini: `fitur:` / `perbaiki:` / `infra:` / `dokumen:`
  + paragraf alasan & bukti (angka uji).

## 5. Status log

| Tanggal | Fase | Catatan |
|---|---|---|
| 2026-10-14 | 0 | Runner uji + lint mekanis lunas (146→24 error, 35→15 berkas kotor); docs sinkron |
