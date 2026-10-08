# CETAK BIRU BANK SOAL & MENU TENTOR — urutan bangun yang aman

**Disusun:** 2026-10-08 · **Dasar:** pembacaan kode + audit `docs/AUDIT-IDENTITAS-BANK-SOAL.md`
**Keputusan owner yang jadi acuan:** tentor boleh *baca → pilih → cetak*; menu pilih
dirombak karena membingungkan; tentor boleh membuat try out **tapi perlu approval**.

> Owner: *"aku takut yang dalam berantakan dan rapuh, mau tambah soal pun jadi takut."*
> Dokumen ini menjawab ketakutan itu dengan **bukti**, bukan penenangan: bagian 1
> memisahkan mana fondasi yang sudah kokoh dan mana yang benar-benar rapuh, lalu
> bagian 2 mengurutkan pekerjaan supaya yang rapuh dibereskan **sebelum** ada
> menu baru yang berdiri di atasnya.

---

## 1. Keadaan fondasi: apa yang kokoh, apa yang rapuh

### ✅ Sudah kokoh (jangan diutak-atik)

| Bagian | Bukti |
|---|---|
| Mesin skoring | `skorSoalTryOut.js`, `skoringSoalKompleks.js` — teruji |
| Mesin cetak naskah | `naskahSoal.js` (26 uji), `cetakLatihan.js`, `penempatanGambar.js` — gambar diukur dari rasio piksel asli, tinggi kolom diukur sungguhan |
| Pagar tipe soal | `keranjangTryOut.TIPE_TERDUKUNG` — tipe yang tak bisa dirender **diblokir di pintu**, bukan dibiarkan tampil rusak |
| Logika subtes & timer | `logikaSubtesTryOut.js` (15 uji), `pulihKirimHasilTryOut.js` |
| Gerbang CI | test + penjaga konten + penjaga rute + build; 122 rute terpantau |
| Pemulihan sesi | `resetSesiTryOut.js` + `pemulihanXPTryOut.js` — XP ditarik secukupnya, teruji |

**Artinya:** mesin yang *memakai* soal sudah kuat. Yang rapuh bukan mesinnya —
melainkan **data identitas** dan **pagar pengaman saat data diubah massal**.

### 🔴 Benar-benar rapuh (harus beres sebelum menu baru)

| # | Kerapuhan | Kenapa berbahaya | Berkas |
|---|---|---|---|
| R1 | **Hapus massal tanpa pagar ledakan** | Semua butir "rusak" **otomatis tercentang**; baris 292 menyatakan terus terang *"...dan N lainnya (tetap ikut tercentang & terhapus)"*. Admin melihat 300 baris, menekan Hapus, dan **ribuan butir yang tak pernah ia lihat** ikut terhapus. Kalau detektornya yang keliru, satu klik menyapu seluruh bank. | `BersihkanSoalPage.jsx` |
| R2 | **Detektor rusak hanya membaca `s.soal`** | Butir yang teksnya ada di `teksSoal` dituduh "Teks soal kosong" → masuk daftar auto-centang → ter-soft-delete. Hari ini belum ada jalur tulis yang memproduksi bentuk itu, jadi risikonya **laten**, bukan aktif — tapi jalur baru apa pun bisa memicu bom ini. | `BersihkanSoalPage.jsx` |
| R3 | **Dua kosakata `jenjang` + alias `materi`/`bab`** | Soal lenyap dari hierarki tanpa error. **Sudah diperbaiki di titik tulis** (commit `0963b0b`); data lama masih perlu disapu lewat Audit Identitas → Rencana Perbaikan. | `jenjangBaku.js`, `mesinTaksonomiSoal.js` |
| R4 | **Satu jalur tulis tanpa identitas materi sama sekali** | Butir dari Advanced Question Extractor pasti jatuh ke "(Belum diatur)". `babTaksonomi` di-fetch tapi tak dipakai — "pagar materi" belum selesai dibangun. | `AdvancedQuestionExtractor.jsx` |
| R5 | **Kuota baca Firestore habis (429)** | Halaman yang menyapu koleksi penuh membuat aplikasi mati pelan-pelan, dan kegagalan lama ditelan sebagai "daftar kosong" sehingga terlihat seperti "soalnya hilang". | lihat `POLICY-ERROR-DAN-KUOTA.md` |
| R6 | **Pilihan tentor lenyap saat ganti filter** | Setiap ganti jenjang/mapel/bab memanggil `setTercentang([])`. Tentor yang sudah mencentang 15 soal lalu pindah bab **kehilangan semuanya tanpa peringatan** — dan memang mustahil merakit soal lintas bab. Inilah inti "menu pilih membingungkan". | `CetakPaketLatihan.jsx` |

R1 dan R2 adalah alasan ketakutanmu **benar**. R6 adalah alasan keluhan
"membingungkan" itu **nyata**, bukan soal selera.

---

## 2. Urutan bangun

Prinsip: **satu fase boleh gagal sendirian tanpa merusak fase sebelumnya.**
Tidak ada fase yang menulis ke data produksi tanpa pagar.

### FASE 0 — Bikin "menambah soal" jadi tidak menakutkan
*Target: owner berani impor 500 soal besok pagi.*

- [ ] **0.1 Pagar ledakan di Bersihkan Soal** (R1). Bila yang ditandai rusak
      melampaui ambang (mis. >15% bank atau >200 butir), **hentikan auto-centang**
      dan tampilkan: *"Kemungkinan besar detektornya yang keliru, bukan datanya.
      Tidak ada yang dicentang."* Hanya butir yang **benar-benar tampil di layar**
      yang boleh tercentang — yang di luar batas tayang tidak boleh diam-diam ikut.
- [ ] **0.2 Detektor sadar-alias** (R2): baca `soal || teksSoal` sebelum menuduh.
- [ ] **0.3 Jalankan Audit Identitas di produksi** → simpan CSV sebagai garis dasar
      → eksekusi Rencana Perbaikan → audit ulang sampai angka "tersembunyi" nol.
- [ ] **0.4 Selesaikan "pagar materi"** di Advanced Question Extractor (R4) supaya
      jalur itu menulis `materi` dari `taksonomi_materi` (bab baku), bukan kosong.
- [ ] **0.5 Kunci hasil dengan test**: satu test yang mensimulasikan "detektor
      menuduh 90% bank rusak" dan memastikan **nol** dokumen terhapus.

**Selesai bila:** menjalankan Bersihkan Soal pada bank yang sehat tidak menghapus
apa pun, dan audit identitas melaporkan 0 butir tersembunyi.

### FASE 1 — Rombak menu pilih tentor (R6)
*Target: tentor bisa merakit 40 soal dari 3 bab berbeda tanpa kehilangan pilihan.*

- [ ] **1.1 Keranjang yang bertahan**: ganti `tercentang` (array yang dihapus tiap
      ganti filter) dengan **keranjang Map `id → soal`** yang hidup lintas
      jenjang/mapel/bab. Pakai ulang `hitungRincianMasukKeranjang` +
      `teksRincianKeranjang` dari `keranjangTryOut.js` (sudah teruji) supaya
      bahasanya sama dengan halaman admin — satu sumber kebenaran.
- [ ] **1.2 Bilah keranjang selalu terlihat**: "🧺 23 soal terpilih · 4 bab ·
      2 mapel" + tombol buka/ninjau/hapus satu-satu/kosongkan. Tentor selalu tahu
      apa yang sudah ia kumpulkan.
- [ ] **1.3 Pagar tipe di pintu**: butir yang tipenya tak bisa dirender
      (`tipeDidukung` = false) **tidak bisa dicentang**, dengan alasan terlihat —
      bukan bisa dipilih lalu tampil rusak.
- [ ] **1.4 Bendera mutu saat memilih**: butir dengan `kunciTerverifikasi === false`,
      pembahasan `penalaran`, atau `potonganTertunda` diberi tanda kuning. Ini
      menghubungkan Fase 0 ke layar tentor: mutu bank terlihat **saat** memilih.
- [ ] **1.5 Urutan & nomor**: naik/turun/hapus per butir di dalam keranjang, dan
      nomor urut mengikuti keranjang (bukan nomor asli bank).

**Selesai bila:** tentor memilih dari 3 bab berbeda, pindah-pindah filter, dan
keranjangnya utuh; cetak naskah memuat persis isi keranjang.

### FASE 2 — Tentor merakit try out, admin menyetujui
*Target: wewenang baru tanpa risiko baru.*

- [ ] **2.1 Simpan keranjang jadi draf paket** (`tryout_paket` dengan
      `status: 'menunggu_approval'`, `dibuatOleh: <uid guru>`, `daftarSoal`).
      Draf **tidak pernah** terlihat siswa.
- [ ] **2.2 Antrean approval di admin**: daftar draf → pratinjau naskah →
      **Setujui** (status `aktif`, terbit) / **Tolak dengan alasan** (kembali ke
      tentor, tidak hilang). Jejak audit siapa menyetujui apa.
- [ ] **2.3 Pakai ulang pagar yang sudah ada**: `TIPE_TERDUKUNG`, granularitas
      & jadwal dari `TerbitkanTryOutPage`, dan `mesinTryOutOtomatis` — jangan
      membangun mesin terbit kedua.
- [ ] **2.4 Batas wewenang yang jujur**: tentor hanya melihat paket miliknya
      (`GuruPantauTryOut` sudah punya pola `guruCocokDenganTentor`); admin melihat
      semua.

**Selesai bila:** satu draf tentor bisa disetujui admin dan langsung bisa
dikerjakan siswa, dengan jejak audit lengkap.

### FASE 3 — Menu berkaitan (hasil analisisku, bukan tebakan)

Diurutkan menurut **nilai per risiko**. Tiga teratas yang kurekomendasikan;
sisanya sengaja ditunda dengan alasan.

| Prioritas | Menu | Alasan | Risiko |
|---|---|---|---|
| ⭐ 1 | **Analitik mutu butir** (`/admin/bank-soal/mutu-soal`) | Data jawaban siswa **sudah** terkumpul (`jawaban_soal`, `tryout_sesi`). Dari situ bisa dihitung: tingkat kesulitan nyata, daya beda, dan butir yang **hampir semua siswa salah** = kandidat kunci jawaban keliru. Ini mengubah "takut soal rusak" jadi "tahu soal mana yang rusak" dari bukti, bukan dugaan. | Baca-saja, rendah |
| ⭐ 2 | **Usul soal (antrean kurasi)** (`/guru/usul-soal`) | Tentor yang menemukan soal bagus saat mencetak bisa mengusulkannya; masuk `status: 'usulan'`, admin menyetujui ke bank. Menumbuhkan bank **tanpa** memberi siapa pun hak tulis langsung. | Sedang — butuh antrean approval, pakai pola Fase 2 |
| ⭐ 3 | **Riwayat & pemulihan soft-delete** (`/admin/bank-soal/pulihkan`) | `BersihkanSoalPage` menulis `status:'dihapus'` + `dihapusAlasan` + `dihapusPada`, tapi **tidak ada UI untuk melihat atau memulihkannya** — pemulihan harus lewat Firestore Console. Ini pengawal wajib untuk R1: hapus jadi bisa ditarik kembali oleh manusia, bukan hanya oleh developer. | Rendah |
| 4 | Editor butir mandiri untuk tentor | Berguna, tapi **menunda**: setiap butir buatan tangan butuh validasi kontrak 12 field, dan Fase 0 belum selesai. Bangun setelah antrean usul (⭐2) terbukti. | Tinggi |
| 5 | Ekspor/impor bank antar-cabang | Belum ada kebutuhan nyata yang terucap. | — |
| 6 | Agregat harian per jenjang/mapel/materi | Baru perlu bila bank > ±5.000 butir (R5). Catat sebagai rencana, jangan dibangun sekarang. | — |

---

## 3. Yang sengaja TIDAK dikerjakan (dan alasannya)

- **Migrasi nama field ke satu kosakata** (`soal` → `teksSoal`, dst). Menggoda
  tapi berbahaya: 24 berkas membaca `bank_soal`, dan dokumen lama menyimpan URL
  serta kunci yang tak boleh berubah. Jalur yang dipakai repo ini sudah benar —
  **titik tulis mengisi semua alias**, pembaca tetap sadar-alias.
- **Membuka `Lemari Soal` apa adanya ke tentor.** Halaman itu admin-sentris
  (ada tombol ubah massal `mataPelajaran` → `'IPA'`). Membukanya mentah = memberi
  hak tulis terselubung. Yang dibuka ke tentor adalah **Perpustakaan + Cetak
  Latihan** yang sudah ada, diperbaiki di Fase 1.
- **Menghapus utang lint massal** (175 error). Sudah ada roadmap-nya di
  `AUDIT-REPO.md` Tahap 1; dikerjakan saat berkasnya memang perlu disentuh,
  supaya satu berkas tidak dua kali lewat gerbang CI.

---

## 4. Cara mengukur "fondasi sudah tidak rapuh"

Bukan perasaan — angka yang bisa dijalankan ulang:

| Ukuran | Alat | Target Fase 0 |
|---|---|---|
| Butir tak terjangkau hierarki | Audit Identitas Soal | **0** |
| Butir rusak | Audit Identitas Soal | diketahui & tertangani |
| Dokumen terhapus oleh pembersih saat bank sehat | test baru 0.5 | **0** |
| Butir tanpa `materi` dari jalur extractor | Audit (cakupan field) | **0** |
| Rute terdaftar / komponen | `scripts/ci-penjaga-rute.mjs` | tetap hijau |
| `npm test` | CI | tetap hijau |
