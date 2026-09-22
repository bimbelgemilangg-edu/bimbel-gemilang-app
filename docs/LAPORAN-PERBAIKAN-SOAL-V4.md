# 🔧 LAPORAN PERBAIKAN SOAL — v4 (22 September 2026)

> Picu: laporan owner saat uji O3 (screenshot 22.35): *"soal menyebut
> 'histogram berikut' tapi gambarnya tidak ada"* + arahan: **"wajib cari
> soal asli; jika ada soal gambar juga ambil soal itu langsung lengkap;
> jangan mengarang sendiri."**

---

## 1. AKAR MASALAH (dua, berbeda)

### 1.1 Bug kode — gambar soal tidak tampil di Latihan mandiri
`soalGambar` & chip `sumber` hanya dirender di **LiveKuis** (sesi live guru)
dan **panggung proyektor**. Komponen latihan mandiri (`PanelKuis`) tidak
merendernya → soal no. 9 (histogram) tampil tanpa histogram padahal
field-nya ADA di Firestore dan URL gambarnya hidup (HTTP 200).
**Fix:** `fix(reader): gambar soal + chip sumber tampil di Latihan mandiri`
(commit di branch `feat/soal-asli-gambar-lengkap`) — `PanelKuis` kini
merender chip sumber + `img soalGambar` persis seperti LiveKuis.

### 1.2 Konten — ada soal karangan & soal buku tanpa gambar
Draft yang live memuat 6 soal berlabel **"Gemilang Drill"** (karangan AI,
jujur berlabel) — owner melarang mengarang. Selain itu soal buku yang
membutuhkan gambar wajib dibawa lengkap dengan gambarnya.

## 2. YANG DILAKUKAN

| Aksi | Detail |
|---|---|
| ❌ Buang 6 soal karangan | bab 1: 4 soal, bab 2: 2 soal (semua berlabel "Gemilang Drill") |
| ✅ Tambah 6 soal **verbatim** dari buku scan owner (Latihan 5.3) | bab 1: no. 1, 2 • bab 2: no. 3, 6, 7, 9 — teks & opsi persis cetakan buku (typo scan ringan dirapikan), kunci **dihitung ulang** + pembahasan langkah demi langkah |
| 🖼 Soal no. 9 dibawa **lengkap dengan fotonya** | foto 5 kursi di-crop dari halaman 23 buku (resolusi asli) → Supabase `materi-v2/soal-gambar/buku-statistika-soal9-kursi.jpg` (publik, 18 KB) → field `soalGambar` |
| 🏷 Label sumber jujur | "Buku Sukses TKA SMA-Saintek — Latihan 5.3 no. X (scan milik owner…)" • soal ujian asli lain tetap berlabel (mathcyber1997, AKM Kemdikbud, UN 2015) |
| ✅ Soal berlabel sumber asli DIPERTAHANKAN | 9 soal bab 1 + 6 soal bab 2 (termasuk 2 soal histogram yang gambarnya sudah benar — akan tampil setelah fix 1.1 deploy) |
| ⚖️ Hasil | bab 1: 13 → **11 soal** • bab 2: 8 → **10 soal** • total 21 • draft `docs/drafts/draft-materi-statistika-peluang-v4.json` **lolos validasi** |

## 3. SOAL BUKU YANG SENGAJA TIDAK DIMASUKKAN (prinsip contoh emas: jangan dipaksa)

| No | Alasan |
|---|---|
| 4 | Opsi terpotong antar-halaman scan; risiko salah transkripsi |
| 5 | Nilai jalur pada gambar panah tidak terbaca pasti → kunci tak bisa diverifikasi |
| 8 | Angka batang histogram buram → persentase tak bisa dihitung yakin |
| 10+ | Soal bersambung ke halaman berikutnya dengan bacaan panjang; butuh transkripsi multi-halaman ( candidati buku #2 ) |

## 4. LANGKAH OWNER (setelah merge PR branch ini)

1. **Admin → Materi v2 → 📥 Impor JSON** → muat berkas `draft-v4-untuk-impor.json`
   (atau tempel isinya) → materi baru masuk ber-status **draft**.
2. Buka materinya → periksa cepat (soal no. 9 bab 2 harus memperlihatkan foto kursi) → **status aktif**.
3. Login siswa → cek tab Latihan Soal: chip 🎓 sumber + gambar muncul.
4. Bila sudah yakin → **Hapus** materi lama (tombol Hapus di Manajer) supaya tidak dobel.
5. Lanjut uji O3 sisa (guru panggung + sesi live) → vonis O4.

## 5. ATKINSON — aturan konten baru (masuk SOP & doktrin)

1. **Dilarang mengarang soal.** Soal = verbatim dari sumber (buku owner /
   ujian asli berlabel). Butuh latihan tambahan? Boleh, WAJIB berlabel
   "Gemilang Drill" DAN tidak boleh merujuk gambar/tabel yang tidak ada.
2. **Soal bergambar wajib dibawa lengkap**: crop gambar dari sumber,
   unggah ke Supabase, pasang di `soalGambar`. Soal yang menyebut
   "gambar/histogram/bagan berikut" tanpa gambar = **bug konten**, buang/perbaiki.
3. Kunci wajib terverifikasi (dihitung ulang independen); soal ambigu
   (gambar buram, opsi terpotong) **dibuang**, jangan ditebak.
4. Renderer baru (latihan mandiri, kuis live, proyektor) wajib merender
   `soalGambar` + chip `sumber` — cek tiga tempat itu saat menambah UI kuis.
