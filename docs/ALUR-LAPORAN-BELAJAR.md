# Alur Laporan Belajar — dari Admin sampai PDF di tangan orang tua

Panduan operasional resmi fitur **Laporan Belajar** (v1.4+). Satu periode, satu PDF per siswa.
Isi utama PDF = capaian yang dinilai tentor; bahan otomatis sistem (kehadiran, kuis harian,
tryout) tampil sebagai pendukung dengan kredit "dihitung otomatis oleh Asisten Belajar Gemilang".

---

## TAHAP 1 — ADMIN: membuka periode pengisian

1. Login sebagai **admin** → menu **Raport Otomatis** (`/admin/raport`).
2. Pilih **mode periode** (bulan tunggal / rentang bulan), lalu pilih bulan dan
   **jenjang/kelas sasaran** seperti biasa.
3. Pada kartu **📝 Pengisian Laporan Belajar oleh Guru**, klik
   **🔓 Buka Pengisian Periode Ini**.
   - Muncul badge hijau **AKTIF: <periode>**.
   - Semua aksi tercatat di log audit (`laporan.buka-pengisian` / `laporan.tutup-pengisian`).
4. Selesai tahap admin awal — guru sekarang melihat tugasnya tanpa perlu disuruh manual.

> Catatan: bila periode aktif berbeda dari periode yang sedang dipilih, kartu menampilkan
> peringatan ⚠️ dan tombol Buka akan **memindahkan** pengisian ke periode terpilih.

## TAHAP 2 — GURU/TENTOR: mengisi capaian siswa

1. Login sebagai **guru** → di **Dashboard Guru** muncul kartu tugas
   **"Pengisian Laporan Belajar — <periode>"** lengkap dengan progres **X/Y siswa**.
2. Klik kartu → halaman **`/guru/laporan-belajar`**.
3. Daftar siswa yang muncul **hanya** siswa aktif yang terdaftar di mapel yang diampu guru
   tersebut (siswa nonaktif/diblokir/lulus tidak pernah muncul).
4. Untuk tiap siswa, isi:
   - **4 dimensi capaian**: Pemahaman Materi · Keaktifan & Partisipasi · Sikap & Kerja Sama ·
     Perkembangan & Konsistensi — masing-masing satu **predikat A/B/C/D** plus deskriptor
     pendukung (mis. "aktif bertanya", "berani menyanggah dengan santun").
   - **Catatan tentor** untuk orang tua (bahasa positif, tanpa frasa "belum valid/lengkap").
   - **Rencana pengayaan** periode depan.
   - Tombol **lihat profil siswa** tersedia bila perlu menengok riwayat siswa.
5. **Draft tersimpan otomatis** (±1,2 detik setelah berhenti mengetik) — sinyal putus atau
   aplikasi tertutup tidak menghilangkan isian; status siswa menjadi **selesai** bila keempat
   predikat terisi.
6. Bila **semua siswa selesai**, kartu tugas di dashboard **hilang dengan sendirinya**.

## TAHAP 3 — ADMIN: menutup pengisian & menerbitkan/cetak

1. Kembali ke **Raport Otomatis** (`/admin/raport`), pilih periode yang sama.
2. Klik **🔒 Tutup Pengisian** bila semua guru sudah selesai (opsional tetapi disarankan
   agar tidak ada isian susulan yang masuk setelah PDF dibagi).
3. Cetak PDF (pilih salah satu):
   - **Cetak satu siswa**: dari tabel pratinjau/terbit → tombol cetak pada baris siswa.
   - **Cetak massal**: tombol cetak massal untuk jenjang/kelas sasaran — satu PDF gabungan,
     tetap **satu laporan per siswa** di dalamnya.
4. PDF yang terbuka di browser → **Simpan sebagai PDF** (dialog print → Save as PDF) →
   bagikan ke orang tua/wali.

### Isi PDF yang dihasilkan

- Per mapel: **"Laporan untuk Orang Tua/Wali — capaian dinilai tentor"** berisi narasi empat
  dimensi (predikat + deskriptor), catatan tentor, dan rencana pengayaan.
- Baris pendukung: **"Bahan otomatis sistem Gemilang: kehadiran …; kuis …; tryout …"** —
  dihitung otomatis oleh Asisten Belajar Gemilang.
- Bila guru belum mengisi untuk suatu mapel, sistem memakai narasi otomatis v1.3 yang lengkap
  (tanpa frasa "data belum cukup/lengkap/valid" sama sekali).

---

## Aturan yang dijaga sistem (jangan dilanggar manual)

- Siswa **nonaktif / diblokir / sudah lulus** tidak pernah masuk laporan, pratinjau, cetak,
  maupun cron — apapun yang terjadi.
- Mapel di luar jenjang/kelas siswa (mis. Sosiologi untuk SMP) disaring dari mesin rapor dan
  dicegah sejak form pendaftaran/edit siswa.
- Log aktivitas selalu terkunci pada `studentId` — tidak ada pencampuran data antar siswa.
- Periode pengisian bersifat **satu sakelar global**: satu periode aktif untuk semua guru.
