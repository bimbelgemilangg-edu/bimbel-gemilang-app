# BEDAH ALUR — Impor Buku Digital → Simpan → Dipakai (Siswa / Guru / PDF)

**Diaudit:** 2026-10-15 · basis `main` `06f16a6` + commit perbaikan kontrak ini
**Metode:** telusur KONTRAK DATA antar-tahap (apa yang DITULIS produsen vs apa
yang DIBACA konsumen), baca kode baris-per-baris, reproduksi buku owner asli
(392 hal) secara lokal. Setiap simpulan menyebut berkas:bukti. Bukan tebakan.

---

## Peta hop

```
[1] berkas (PDF-OCR / txt / html / folder) ─ parse ─> pratinjau
[2] pratinjau ─ SIMPAN ─> Firestore: buku_digital, buku_digital/<id>/bab, bank_soal
[3] buku_digital.status draft ─ (manual Admin→Buku) ─> status aktif
[4] bab ─ reader siswa (/siswa/buku/:id/:bab) ─> materi + quiz "Uji Pemahaman"
[5] bank_soal ─ siswa: Latihan Harian, Try Out (RendererPgSederhana)
[6] bank_soal ─ guru: Rakit Try Out, Kesiapan Stok, keranjang
[7] bank_soal ─ PDF: Cetak Paket Latihan / naskah (jspdf)
```

## Per-hop: verdict & bukti

### [1] Berkas → parse → pratinjau — ✅ OK (setelah #231)
- Dialek buku scan (daftar isi & kepala kunci) diperbaiki di `parseTeksBuku.js`
  + uji `tests/parseTeksBukuDaftarIsi.test.mjs`.
- Bukti lapangan: reproduksi lokal `Buku_Matematika_Fase_E_Kelas_10` (392 hal):
  8 bab sesuai daftar isi, 95 soal berkunci mentah → 57 lolos filter bank
  (angka sama dengan pratinjau produksi).

### [2] Pratinjau → SIMPAN — ⚠️→✅ 3 bug kontrak DITEMUKAN & DIPERBAIKI commit ini
Bug yang membuat "materi tersimpan tapi mati di hilir":
1. **Block materi ditulis `{jenis}` padahal reader hanya baca `{tipe}`**
   (`BukuBacaPage.jsx` `renderBlok`: cabang `blok.tipe === 'p'|'contoh'|…`).
   Akibat: semua block return null → **bab kosong di sisi siswa**.
   Skema kanonik `tipe` dikonfirmasi produsen lain: prompt
   `api/konversiModulScan.js` ("Tipe block yang DIIZINKAN: p/list/math/
   contoh/tips/gambar"), `konversiPdfBuku.js`, `EditorBab.jsx`.
   Fix: `parseTeksBuku` menulis `tipe`; jaring `normalisasiBabReader.js`
   meng-alias `jenis→tipe` saat SIMPAN untuk bab dari sumber mana pun.
2. **Seksi & soal tanpa `id`** → navigasi antar-seksi (`findIndex(sec.id)`)
   dan kunci jawaban quiz (`jawaban[q.id]`) bocor/pecah. Fix: id deterministik
   (`s{n}`, `q{n}`) di parser + jaring normalisasi.
3. **Figur soal hanya `gambarUrls`** (kontrak bank) padahal reader membaca
   `gambar` tunggal (`q.gambar.src`). Fix: isi keduanya saat simpan.
Sudah aman lebih dulu (#231): crash simpan mode teks (`halamanSumber[0]`),
idempotensi klik-ganda, reuse job impor.

### [3] Draft → publish — ✅ konsisten, hop MANUAL (bukan bug)
- Impor menulis `status:'draft'`; rak siswa `where('status','==','aktif')`
  (`BukuInteraktifPage.jsx:84`); Manajer Buku punya select
  `aktif (terlihat siswa) / draft (tersembunyi)` (`ManajerBuku.jsx:444-447`).
- Wajib masuk checklist operasional (lihat bawah).

### [4] Bab → reader siswa — ✅ setelah fix kontrak hop [2]
- `renderBlok`: `tipe` p/list/math/contoh/tips/gambar + widget interaktif;
  `MathText` merender latex materi.
- Quiz "Uji Pemahaman": `q.tipe==='pg'` + `q.pilihan` + `q.benar` (indeks) +
  `q.id` — payload impor memang memakai bentuk ini (parseTeksBuku), kini
  lengkap dengan id & gambar.

### [5] bank_soal → siswa (latihan/try out) — ✅ konsisten
- Kontrak butir: `opsiJawaban`, `kunciJawaban` (huruf), `gambarUrls`,
  `tingkatKelas`, `tipe:'pg_sederhana'` (`pecahBukuHtml.js`
  `butirBankDariUjiPemahaman`).
- Konsumen cocok: `LatihanHarianPage.jsx:486,532-533` (filter tipe +
  opsiJawaban), `TryOutView.jsx` + `RendererPgSederhana.jsx`,
  `aksesKontenSiswa.js:54-55` (tingkatKelas).

### [6] bank_soal → guru — ✅ konsisten
- `RakitTryOutGuruPage.jsx:64,219` (filter tipe), `kesiapanStok.js`,
  `KartuKeranjangSoal.jsx`, `LemariSoalPage.jsx` — semua membaca kontrak sama.

### [7] bank_soal → PDF — ✅ konsisten
- `CetakPaketLatihan.jsx` membaca `opsiJawaban`, `gambarUrls`, default tipe
  `pg_sederhana` (baris 119) → soal impor tercetak utuh bergambar.

### Live session — N/A
- `LiveSessionTeacher/Student` memakai objek soal sesi live (`soal.pilihan`,
  `soal.kunci.tipe`) yang BUKAN dokumen bank_soal; tidak terdampak impor.

## Celah diketahui (dicatat, bukan disembunyikan)
1. **Bab draft ikut terbaca siswa bila bukunya diaktifkan** — reader memuat
   seluruh subkolersi `bab` tanpa filter `status` (`BukuInteraktifPage:97`).
   Keputusan produk pending: filter di reader atau biarkan (badge DRAFT hanya
   di admin). Sementara: pastikan bab sudah final sebelum buku diaktifkan.
2. `kunciTerverifikasi:false` pada butir impor → wajib QC sampel lewat
   BersihkanSoal/Audit sebelum dipakai try out resmi (sudah diingatkan di log
   simpan).
3. Dobel lintas-pipeline (kunci duplikat memakai `sumberFile`): simpan
   pipeline kedua sebagai buku terpisah / matikan centang bank (aturan
   operasional, tercatat di CATATAN-PROYEK.md).
4. Teks OCR kotor (watak PDF24) → QC materi; jalur vision AI memberi teks
   lebih bersih bila kuota tersedia.

## Checklist E2E manual (owner, ±5 menit)
1. `/admin/buku/impor-html` · stempel halaman = commit terbaru main.
2. Mode 📑 PDF berteks → pilih PDF → `✓ PDF … halaman terbaca`.
3. Pratinjau → 8 bab + Tinjau 57 soal → Simpan draf buku + bank soal →
   log: 8× `✓ Bab … tersimpan sebagai draf`, `✓ 57 soal masuk bank_soal`, `SELESAI…`
4. Admin → Buku → edit buku draf → status **aktif** → Simpan Buku.
5. Login siswa → menu Buku Digital → buku muncul → buka bab 1 → paragraf &
   contoh TERRENDER (tidak kosong) → seksi bisa dinavigasi → quiz Uji
   Pemahaman menjawab & skor tersimpan.
6. Guru → Rakit Try Out / Kesiapan Stok: stok materi buku baru terlihat.
7. Cetak Paket Latihan pakai materi/stok itu → PDF terbuka, soal + opsi +
   gambar utuh.
Bila langkah mana pun menyimpang: salin log/teks layar ke asisten — setiap
hop di dokumen ini punya penunjuk berkas untuk meluncur ke penyebabnya.
