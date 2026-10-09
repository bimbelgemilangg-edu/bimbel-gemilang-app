# RENCANA — PAKET SOAL SISWA (bukan CBT)

Status: **PR A (mesin + uji) dibuka; sisi layar menunggu review owner.**
Audit: 2026-10-09. Basis: `main` @ `ccd097c` (PR #186 sudah merge).
Arahan owner 2026-10-09 (chat) sudah diserap ke rancangan ini.

---

## 1. Bentuk sistem menurut owner (diringkas dari chat 2026-10-09)

1. **Paket digantung ke bab/materi kelas reguler.** Contoh: dalam Bab 1 ada
   "Paket 1", "Paket 2", dst. **Nomor paket ditentukan SISTEM** (urut per
   jenjang+mapel+bab); **tentor yang mengisi isinya** (soal + rujukan materi
   yang sinkron).
2. **Tiap paket punya kode pendek** — contoh owner: *"paket 1 kode 2W3Q"*.
   Kode ini yang dipakai siswa membuka/mencari paket dan tentor menulis di
   lembar progres.
3. **Siswa melihat soal satu per satu di aplikasi** (read-only, ber-watermark,
   BUKAN CBT — tidak bisa diklik/dijawab di layar), mengerjakan di buku, dan
   **boleh mencetak** — *"siswa bisa cetak terserah yang penting ada watermark"*.
4. **Progres dicatat per nomor**: *"siswa A sudah mengerjakan paket 1 kode 2W3Q
   nomor 1-15, kurang 16-20"* — catatan tentor di form terpisah / lembar progres.
5. **Siswa harus mudah membuka lagi / mencari soal** untuk dipelajari ulang.

## 2. Keputusan yang diambil (bisa dibatalkan owner sebelum PR B)

| Topik | Keputusan | Alasan |
|---|---|---|
| Penerbitan | **Tentor menerbitkan sendiri** (tombol khusus + konfirmasi); admin bisa menutup/mengarsipkan | Ini latihan kelas reguler, bukan ujian; owner tidak meminta approval untuk paket (beda dengan Try Out CBT) |
| Cetak siswa | **Default HIDUP per paket**, tentor bisa mematikan; watermark wajib; pratinjau dulu | *"siswa bisa cetak terserah yang penting ada watermark"* |
| Klaim siswa | Tombol **"Saya sudah mengerjakan di buku"** (klaim jujur, bukan "selesai") + catatan tentor per nomor | *"gimana cara kita konekin"* → antrean periksa tentor; status selesai HANYA dari tentor |
| Kunci jawaban | **Tidak pernah dikirim ke browser siswa** — dipisah koleksi (lihat §4) | Spec: jangan tampilkan kunci sebelum diizinkan |

## 3. Hasil audit — yang SUDAH ada dan dipakai ulang

| Komponen existing | Berkas | Dipakai untuk |
|---|---|---|
| Pemilih soal 2 kolom (filter jenjang→mapel→materi→kelas→tipe, keranjang) | `RakitTryOutGuruPage.jsx`, `utils/keranjangSoalGuru.js` | Pola layar "Isi Paket" tentor (PR B) |
| Mesin cetak (kolom, pita lebar penuh bacaan panjang, watermark, kotak centang kosong, peringatan luapan) | `utils/naskahSoal.js`, `utils/cetakLatihan.js`, `CetakPaketLatihan.jsx` | Cetak siswa & lembar progres (PR C) |
| Kartu baca read-only dengan mode `tanpaKunci` | `components/admin/KartuBacaSoalLengkap.jsx` | Penampil satu-soal-satu-layar siswa (PR C) |
| Watermark logo (layar 0.14 / cetak 0.12) | `WATERMARK` di `utils/fieldButirSoal.js` | Watermark layar + cetak |
| Pembersih glif ☑/☐ (PR #186) | `utils/bersihkanGlifKunci.js` | Dipakai sanitizer paket (sudah) |
| Target per kelas + notifikasi | `students.kelasSekolah`, `utils/notifications.js` | Penugasan paket |
| Gerbang akun siswa & layout | `GateAksesSiswa.jsx`, `SiswaLayout`, `TeacherLayout`, sidebar | Pembungkus halaman baru |
| Rules bertahap | `firebase/rules/tahap-1/tahap-3` | Bagian `paket_soal` DITAMBAHKAN di PR A |

## 4. Arsitektur data — DUA koleksi (keputusan keamanan)

**Fakta audit:** Rules Firestore tidak bisa menyembunyikan *field* per peran,
dan rules produksi hari ini masih terbuka (Tahap 3 menunggu Firebase Auth —
lihat `docs/RUNBOOK-KEAMANAN.md`). Supaya "kunci tidak pernah sampai ke
browser siswa" bisa ditegakkan di DATABASE (bukan cuma di UI), kuncinya
**dipisahkan koleksinya**:

```
paket_soal/{paketId}              dokumen kerja tentor — ADA kunci.
                                  Siswa dilarang baca (rules Tahap 3: staf/guru saja).
paket_soal_siswa/{paketId}        NASKAH SISWA — id sama, isi salinan TANPA
                                  kunci/pembahasan (dibuat saat terbit oleh
                                  bangunNaskahSiswa()). Hanya ini yang dibaca
                                  halaman siswa. Bebas kunci DIKUNCI OLEH TEST.
paket_soal_siswa/{paketId}/progress/{studentId}
                                  klaim siswa + catatan tentor per nomor.
```

### `paket_soal/{id}` (lengkap)
```
judul            usulan sistem: "SMP 8 — Bahasa Inggris — Descriptive Text — Paket 05" (bisa diedit)
status           'draf' → 'siap' → 'terbit' → 'ditutup'   (transisi diuji)
jenjang, mapel, materi, materiId, babKey   (babKey = kunci pengelompokan penomoran)
nomorPaket       OTOMATIS: urut per babKey (nomorPaketBerikutnya)
kodePaket        OTOMATIS: 4 huruf tanpa 0/O/1/I/L (buatKodePaket; unik dicek via query)
petunjuk, targetKelas[], targetSiswa[], tanggalTugas, batasWaktu
izinkanCetakSiswa  (default true)
daftarSoal       soal APA ADANYA (dengan kunci) — pegangan tentor utk pratinjau & cetak kunci
totalSoal, versiKe, indukPaketId, tentorId/Nama, riwayatStatus[], timestamps
```

### `paket_soal_siswa/{id}` (naskah, dibuat saat terbit)
Salinan: judul/kode/nomor/identitas/petunjuk/target/batas waktu/izin cetak +
`daftarSoal` hasil `daftarSoalUntukSiswa()` — **kunci, pembahasan, jawaban
ekuivalen, baris benar/salah `.jawaban/.kunci/.value`, bendera `benar` di opsi,
dan glif ☑/☐ dibuang semua dialek** (15 uji mengunci ini).

### Progres (subkoleksi `progress/{studentId}`)
```
klaimSelesaiPada        siswa (satu-satunya field yang boleh ditulis siswa — rules Tahap 3)
nomorSelesai[]          catatan tentor, mis. [1..15]  → tampil "1-15, kurang 16-20"
statusPeriksa           '' | 'perlu_perbaikan' | 'sudah_diperiksa' | 'selesai'  (HANYA tentor)
catatanTentor, kesalahan, tindakLanjut, diperiksaOleh/Pada
```

## 5. Aturan main (dikunci util murni `src/utils/paketSoal.js` — SUDAH DIBUAT di PR A)

- **Tidak ada terbit diam-diam:** simpan/edit/pratinjau tidak mengubah status;
  terbit hanya lewat `putusanTerbitkanPaket` (menolak tanpa judul/soal/sasaran)
  + tombol konfirmasi.
- **Paket terbit immutable:** perubahan isi = `payloadVersiBaru` (draf versi 2,
  kode & nomor TETAP — siswa mencari dengan kode yang sama; induk tidak disentuh
  sampai versi baru diterbitkan).
- **Materi berubah → pemberitahuan, bukan aksi:** `periksaSelarasMateri`
  melaporkan soal paket yang hilang/nonaktif di bank; tentor memutuskan
  (perbarui = versi baru, atau biarkan).
- **Hak lihat:** `paketBolehDilihatSiswa` — hanya naskah `terbit` yang
  menyasar studentId/kelas siswa (penegakan sesungguhnya di rules Tahap 3).
- **Kejujuran progres:** `statusPeriksaSiswa` — klaim siswa SELALU berlabel
  "menunggu pemeriksaan tentor"; "selesai" hanya dari catatan tentor.

## 6. Layar baru (PR B & C)

**Tentor** — seksi sidebar baru "Paket Soal":
- `/guru/paket-soal` — pilih jenjang→mapel→bab; daftar paket bab itu
  (Paket 01 · 2W3Q, status berwarna) + tombol **Buat Paket** (nomor & kode
  otomatis, judul diusulkan sistem).
- `/guru/paket-soal/:id` — ISI paket: pemilih soal 2 kolom ala Rakit Try Out,
  petunjuk, sasaran (kelas/siswa), tanggal & batas waktu, izin cetak,
  pratinjau, **TERBITKAN** (konfirmasi). Setelah terbit: pemantauan —
  daftar siswa + status klaim + form catatan per nomor ("1-15, kurang 16-20"),
  tombol cetak **Lembar Progres Siswa** (roster kelas untuk dicatat tangan),
  pemberitahuan materi berubah, buat versi baru, tutup paket.

**Siswa** — kelompok BELAJAR di sidebar: "Paket Soal":
- `/siswa/paket` — paketku (terbit, menyasar aku/kelasku): nama, kode besar,
  mapel/bab, tentor, batas waktu, status pemeriksaan; **kotak cari kode**
  (ketik 2W3Q → langsung buka) untuk belajar ulang; paket ditutup masuk
  "Arsipku" (tetap bisa dibaca, tidak bisa dicetak ulang? — tidak, tetap bisa).
- `/siswa/paket/:paketId` — penampil read-only: header paket + petunjuk,
  SATU soal per tampilan (KartuBaca `tanpaKunci`), Sebelumnya/Berikutnya,
  "3 dari 20", watermark logo + teks identitas siswa, kotak tetap
  *"Tulis di Buku Progress: nama paket, mapel, nomor soal"*, tombol klaim,
  tombol Cetak bila `izinkanCetakSiswa` (pratinjau dulu, mesin cetak sama
  dengan Cetak Latihan — kolom/pita/watermark/peringatan luapan).

## 7. Berkas PR A (yang dikirim sekarang)

| Berkas | Isi |
|---|---|
| `src/utils/paketSoal.js` (baru) | Mesin murni: status+transisi, kode, penomoran bab, judul usulan, sanitizer siswa, putusan terbit, payload draf/terbit/versi baru, naskah siswa, hak lihat, selaras materi, progres jujur, rentang nomor |
| `tests/paketSoal.test.mjs` (baru) | 15 uji / ±60 asersi — semua invarian §5 |
| `package.json` | daftarkan uji ke rantai `npm test` |
| `firebase/rules/tahap-3-final.rules` | bagian `paket_soal` + `paket_soal_siswa` + progress (TIDAK di-deploy; siap saat Tahap 3) |
| `docs/RENCANA-PAKET-SOAL-SISWA.md` | dokumen ini |

**Tidak ada layar yang berubah di PR A. Tidak ada tulisan ke Firestore produksi.**

PR B: sisi tentor (2 halaman + route + sidebar). PR C: sisi siswa (2 halaman +
cetak + klaim + route + sidebar). Tiap PR: lint bersih berkas tersentuh,
esbuild JSX, `npm test` penuh; build produksi diverifikasi CI.

## 8. Risiko & mitigasi

| Risiko | Mitigasi |
|---|---|
| Kunci bocor ke siswa | Pisah koleksi (§4) + sanitizer semua dialek + 15 uji + KartuBaca `tanpaKunci` + glif ☑ (#186) |
| Rules produksi masih terbuka | Dikatakan jujur: sampai Tahap 3, orang yang paham DevTools bisa baca apa pun — fitur ini tidak memperluas akses siswa ke bank soal sama sekali; bagian rules paket sudah disiapkan |
| Paket terbit berubah diam-diam | Immutable + versi baru + riwayatStatus |
| Nomor/kode tabrakan | Nomor = max+1 per bab (query); kode dicek `where('kodePaket','==',k)` sebelum simpan, diulang bila tabrakan |
| Kuota Firestore | Siswa membaca 1 naskah + 1 progress per paket; tentor memakai cache `ambilKonten()` yang sudah ada |
| Merusak fitur lama | Tidak ada berkas inti yang diubah perilakunya; route/menu aditif; Try Out CBT tidak disentuh |

## 9. Yang masih terbuka (tidak memblokir PR A)

- Konfirmasi akhir: terbit tanpa approval admin (keputusan §2 baris 1).
- Bentuk "lembar progres siswa" cetak: roster per kelas (usulanku) vs per siswa.
- Apakah paket ditutup tetap tampil di arsip siswa (usulanku: tampil, read-only).
