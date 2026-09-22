# 🎨 RENCANA ROMBAK MATERI v2 — Bimbel Gemilang

> Status: **FASE 1-3 SELESAI DI KODE** (commit `a643a20`, `8c4f933`, `34b79a1`, `9705634` di branch `feat/materi-v2`; push OK Turn 11 — menunggu merge PR).
> Keputusan user (Turn 4): cakupan **siswa dulu (Fase 1-2)**; gaya visual **mengikuti foto desain yang akan dikirim owner** (styling sekarang placeholder); data model **diserahkan ke AI → dipilih yang paling hemat kuota gratis**: Firestore untuk teks (cache-first + debounce write), Supabase Storage untuk file besar, tanpa listener realtime sampai Fase 3.
> Dibuat: 22 September 2026 oleh AI (Qwen) bersama owner Bimbel Gemilang.
> Konteks: Owner akan **menghapus buku lama di Firestore dan mulai dari 0**. Kode dirombak secara **aditif** (halaman lama tetap hidup sampai versi baru siap, lalu switch).

## 1. Tujuan

1. **Siswa**: pengalaman melihat & membaca materi yang indah, nyaman, cepat — terasa seperti app belajar modern, bukan "halaman web dengan tombol".
2. **Guru**: materi yang sama menjadi **bahan presentasi kelas** yang sinkron realtime dengan layar siswa (guru menjelaskan → siswa mengikuti posisi yang sama).
3. **Admin/Guru**: pengelolaan materi dari nol yang mudah (buat baru, impor, atur bab).
4. Mendukung model bisnis: **gratis untuk semua + fitur premium** (gate per materi/fitur).

## 2. Kondisi Lama (hasil audit)

- Koleksi: `buku_digital/{bukuId}` (judul, mapel, kelas, jenjang, warna, emoji, urutan, status) + subkol `bab/{babId}` (tipe: `pdf` | `html` | terstruktur-`sections[]`, `ujiPemahaman[]`, halamanMulai/Selesai).
- Progress: `siswa_buku_progress/{studentId}_{babId}` (selesaiSections, quizTerbaik, halamanTerbaca, selesaiModul).
- Sinkronisasi live: koleksi `sesi_kelas` (status aktif, babId) — dipakai LiveSessionTeacher/Student & PanelSesiLiveSiswa.
- UI lama: tema gradasi ungu + maskot astronot, inline styles, mobile-first 480px. Reader v7: tema paper/sepia/night, mode gulir/halaman, mode presentasi guru (guide/student view).
- Masalah: alur terasa terpisah-pisah, gaya visual belum konsisten, sinkronisasi guru-siswa ada tapi belum menjadi satu pengalaman utuh.

## 3. Desain Baru (usulan)

### 3.1 Data model — koleksi BARU `materi_v2`
Alasan: mulai dari 0, skema bersih, tidak menabrak fitur lama selama transisi.

```
materi_v2/{materiId}
  judul, mapel, kelas, jenjang, deskripsi, warna, emoji/ikon,
  urutan, status: 'draft'|'aktif'|'arsip',
  premium: bool,           ← gate fitur premium
  tipeKontenDominan, dibuatOleh, dibuatPada, diupdatePada

materi_v2/{materiId}/bab/{babId}
  judul, urutan, ringkasan, estimasiMenit,
  tipe: 'teks'|'html'|'pdf'|'video'|'campuran',
  sections: [{ jenis: 'paragraf'|'gambar'|'rumus'|'video'|'callout'|'contoh', ... }],
  pdfUrl / videoUrl / html (file besar → Supabase Storage),
  ujiPemahaman: [{ soal, tipe, opsi, jawaban, pembahasan }]

sesi_presentasi/{sessionId}          ← sinkron guru↔siswa realtime
  materiId, babId, posisi (sectionIndex/halaman), mode: 'mengikuti'|'bebas',
  guruId, guruNama, status: 'aktif'|'selesai', dibukaPada, diupdatePada
  peserta: [{ studentId, nama, ikutSejak }]

progres_materi_v2/{studentId}_{babId}
  selesaiSections[], quizTerbaik, halamanTerbaca, selesaiBab, xp, terakhirDibaca
```

### 3.2 Halaman & route baru (aditif)

**Siswa** (mobile-first):
- `/siswa/belajar` — Beranda Materi: kartu mapel/materi besar, pencarian, filter kelas, "Lanjutkan membaca", badge premium.
- `/siswa/belajar/:materiId` — Daftar isi: progress bar per bab, estimasi waktu, status selesai.
- `/siswa/belajar/:materiId/:babId` — **Reader v2**: tipografi nyaman, tema terang/gelap, mode gulir/halaman, KaTeX, gambar zoom, kuis pemantapan, XP, **banner "Guru sedang menjelaskan — ikuti"** (sinkron `sesi_presentasi`).

**Guru** (desktop/proyektor + HP):
- `/guru/presentasi` — Daftar materi yang bisa dipresentasikan + riwayat sesi.
- `/guru/presentasi/:materiId/:babId` — **Panggung Presentasi**: konten besar untuk proyektor, kontrol pindah bagian (tombol/keyboard/QR), daftar siswa yang mengikuti realtime, tombol "Mulai sesi" → membuat `sesi_presentasi` aktif → layar siswa otomatis sinkron.

**Admin/Guru**:
- `/admin/materi-v2` (+ `/guru/materi-v2`) — Manajer materi baru: CRUD materi/bab, editor sections, upload PDF/gambar ke Supabase, impor (menyusul).

### 3.3 Alur sinkronisasi (inti permintaan user)

1. Guru buka Panggung Presentasi → klik **Mulai Sesi** → dok `sesi_presentasi` status `aktif`.
2. Siswa yang membuka materi/bab yang sama melihat banner → layar siswa **mengikuti posisi guru** (onSnapshot realtime).
3. Guru geser bagian/halaman → semua siswa ikut bergeser (dengan animasi halus).
4. Guru bisa set **mode bebas** (siswa lepas dari sinkron, mis. saat latihan).
5. Guru **Akhiri Sesi** → siswa kembali normal, progress tersimpan.

### 3.4 Prinsip UI/UX

- Mobile-first untuk siswa (mayoritas pakai HP), desktop-first untuk panggung guru.
- Satu bahasa desain: kartu rounded, hierarki tipografi jelas, warna per mapel, ikon lucide.
- Cepat & offline-friendly: cache Firestore persistent (sudah ada), gambar lazy-load.
- Aksesibilitas: ukuran teks dapat diatur, kontras aman, target sentuh ≥44px.
- Animasi halus (transisi halaman, progress) — tanpa berlebihan.
- Gaya visual final: **menunggu pilihan user** (lihat pertanyaan di DOKUMEN-PROYEK.md Turn 3).

## 4. Tahapan Pengerjaan

| Fase | Isi | Output |
|---|---|---|
| **1** | Fondasi: data model + Beranda Materi siswa + Daftar Isi (UI baru) | `/siswa/belajar` jalan dengan konten contoh |
| **2** | Reader v2 siswa (teks/html/pdf, tema, kuis, XP, progress) | pengalaman baca baru lengkap |
| **3** | Panggung Presentasi guru + sinkron realtime `sesi_presentasi` | guru menjelaskan ↔ siswa mengikuti |
| **4** | Manajer materi (admin/guru): CRUD + upload Supabase | konten bisa dibuat dari nol |
| **5** | Poles: premium gate, leaderboard/XP integrasi, switch route lama → baru | rilis |

Setiap fase: uji via dev server (`npx vite`) + eslint file yang diubah → lapor ke user → commit → push (setelah akses GitHub diberikan).

## 5. Batasan & Catatan

- **Jangan hapus data Firestore dari sisi AI** — owner yang menghapus buku lama sendiri.
- Build produksi tidak bisa dijalankan di sandbox AI (RAM 1GB → OOM); verifikasi via dev server. Build final di Vercel/mesin user.
- File besar (PDF/foto) → **Supabase Storage** (pakai `src/services/uploadService.js` yang sudah ada).
- Perubahan bersifat aditif; route & koleksi lama (`buku_digital`, `/siswa/buku`, sesi_kelas) tetap utuh sampai Fase 5.
