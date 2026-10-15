# RUNBOOK-BUKU-SCAN-KE-SISTEM.md — buku Gemilang (scan) → bank soal & buku interaktif → ujian

**Dibuat 14 Okt 2026** untuk pertanyaan owner: *"buku bimbel gemilang ingin
dimasukkan ke sistem, dan kedepannya bisa masuk bank soal agar bisa dibuat
ujian — gimana?"* Contoh konkret berkas: `01_Bab_1_Persamaan_Kuadrat.pdf`
(22 halaman, **scan gambar tanpa lapisan teks** — kasus yang pipanya sudah
dirancang untuknya).

Jawaban singkat: **pipanya SUDAH ADA dan sudah bergerbang sanitizer**; yang
baru adalah runbook ini + lembar identitas per buku supaya operator tidak
menebak-nebak. Tidak ada kode baru yang dibutuhkan untuk langkah inti.

---

## FASE A — Scan → BANK SOAL (siap dijadikan ujian)

1. **Admin → Bank Soal → "Import Buku & Soal (AI)"** (`/admin/bank-soal/import`,
   komponen `AdvancedQuestionExtractor`).
2. Unggah PDF scan. Endpoint `api/detectBookChapters.js` memetakan batas bab
   (untuk buku multi-bab), lalu `api/konversiModulScan.js` /
   `api/extractPdfBankSoal.js` memakai Gemini **vision** untuk membaca halaman
   gambar: teks materi, butir soal, opsi, kunci, pembahasan, dan placeholder
   gambar soal.
3. **Layar review**: tiap butir lewat pagar `bankSoalSanitizer` sebelum boleh
   simpan — tipe harus yang renderer ujian dukung (pg_sederhana, pg_kompleks,
   benar_salah, isian_singkat, numerik; menjodohkan/esai ditolak atau ditandai),
   kunci wajib memetakan ke opsi (`soalBisaDinilai`), pembahasan distruktur.
   Butir cacat TIDAK masuk bank secara diam-diam: ia tampil di laporan impor.
4. **Isi lembar identitas** (wajib, supaya tidak nyasar & bisa dijaring mesin):
   - mapel: `Matematika` · jenjang: `SMA` · kelas/materi: `10` / `Persamaan Kuadrat`
   - sumber: `Buku Gemilang Vol.1 Bab 1` · status awal: `draft` lalu tinjau → `aktif`.
   - Gambar soal: potong/pasang lewat manajer gambar (`uploadBankSoalImages`,
     `PemotongGambar`) supaya placeholder terpenuhi.
5. Simpan → butir masuk koleksi `bank_soal` dengan identitas lengkap
   (mapel/jenjang/materi) — **sejak detik ini bisa dipakai ujian**:
   - **Mesin Try Out Otomatis**: buat template ber-jenjang SMA dengan komposisi
     `Matematika · Persamaan Kuadrat`; AI pemilih soal (ber-kisi CP) akan
     menganggap butir baru ini sebagai stok sah (`Kesiapan Stok` ikut naik).
   - **Rakit Try Out Tentor**: filter jenjang→mapel→materi kini menampilkan bab ini.
   - **Kuis & Cetak Latihan**: langsung tersedia.

## FASE B — Scan → BUKU INTERAKTIF (materi dibaca siswa)

1. **Admin → Buku** (`/admin/buku`, `ManajerBuku` v4.2).
2. Dua jalur isi:
   - **Paste/impor JSON** berformat `IMPOR-CONTOH-MATERI-INTERAKTIF.json`:
     blok `materi` (judul, mapel, jenjang, warna, emoji, deskripsi, status)
     + array `bab` (judul, ringkasan, estimasiMenit, sections: judul/kilat/
     paragraf/rumus/tabel + widget interaktif jodohMini, isianRumpang,
     flashcard, urutan, benarSalah).
   - **Impor HTML interaktif** (bab bertipe `html`) dari hasil Impor HTML Gemini.
   - Untuk buku scan: teks materi diambil dari hasil ekstraksi Fase A (salin ke
     JSON) atau pakai `konversiModulKeBab` (klien AI) di ManajerBuku.
3. Validasi ketat ManajerBuku + `sanitasiFirestore` berjalan otomatis; status
   `draft` → tinjau di pratinjau → `publish` → siswa membaca di
   `/siswa/buku` (gerbang fitur Buku Digital).

## FASE C — QC wajib sebelum dinyatakan selesai (checklist operator)

- [ ] Semua butir lulus `soalBisaDinilai` (kunci memetakan opsi; tak ada kunci ganda warisan).
- [ ] Nomor/kunci hasil bacaan scan DICEK MANUSIA minimal 10% sampel per bab
      (OCR/AI bisa salah baca angka — terutama pangkat/akar persamaan kuadrat).
- [ ] Gambar soal terpasang (bukan placeholder putus) lewat manajer gambar.
- [ ] Identitas seragam: ejaan mapel & materi sama dengan taksonomi bank
      (`Geografi=Geografi`, dst.) supaya mesin/rakit tidak gagal menjaring.
- [ ] Duplikat: cek identitas soal terhadap bab lain (anti-duplikat bank).
- [ ] Buku interaktif: pratinjau tiap bab (rumus LaTeX render, widget berfungsi).

## FASE D — Dari bank ke ujian (jawab "kedepannya bisa dibuat ujian")

- Mesin otomatis: template per jenjang+komposisi materi → draf → terbit
  (alur approval & analitik tetap berlaku seperti PR #206/#214/#215).
- Tentor: rakit manual per materi bab ini → approval admin.
- Kuis cepat tentor & cetak latihan naskah/kunci: tersedia langsung.

---

## Aturan pecah berkas (keputusan 14 Okt 2026, sesudah berkas per-jenjang owner)

- **SATU berkas = SATU jenjang = SATU buku.** Identitas (mapel/jenjang/kelas/
  judul) diisi sekali per unggah; berkas campur jenjang akan membuat sebagian
  soal salah sasaran.
- **TIDAK perlu pecah per bab**: nama bab ditulis operator di pratinjau wizard
  (tiap kelompok 10 halaman) dan nama itu menjadi identitas materi butir bank.
- **Ukuran berkas bebas**: HTML mentah tidak pernah disimpan ke Firestore
  (batas 1MB hanya berlaku bila menyimpan utuh); ekstraksi dicicil ≤10 halaman
  per panggilan AI, progres tersimpan, bisa dijeda/dilanjutkan (#224).

## Celah jujur yang TERSISA (belum ada, diusulkan bertahap)

1. **Belum ada tombol satu-klik "scan → draf buku interaktif"**: materi masih
   perlu ditempel/dikonversi di ManajerBuku (Fase B). Usulan fase berikutnya:
   simpan hasil ekstraksi Fase A sebagai *draf materi* yang bisa dibuka
   langsung di ManajerBuku (sekali klik,-edit, publish).
2. **Kuota AI vision**: ekstraksi scan memakan kuota Gemini; pagar kuota sudah
   ada (policy error & kuota), tetapi impor buku besar sebaiknya dipecah
   per-bab (satu PDF per bab, seperti contoh ini) — sudah sesuai praktik kini.
3. **QC sampel manusia** (Fase C) belum dipaksakan sistem — disiplin operator;
   usulan: tambah penanda "bab menunggu QC" di Kesiapan Stok.

## Lembar identitas buku saat ini (tempel saat impor)

```json
{
  "mapel": "Matematika",
  "jenjang": "SMA",
  "kelas": "10",
  "materi": "Persamaan Kuadrat",
  "sumber": "Buku Gemilang Vol.1 Bab 1 (scan 22 halaman)",
  "statusAwal": "draft"
}
```
