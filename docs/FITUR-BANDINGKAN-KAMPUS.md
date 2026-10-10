# FITUR BANDINGKAN KAMPUS & FORMASI PILIHAN 1–2

**Tanggal:** 2026-10-10 · branch `fitur/infrastruktur-pilot`
**Permintaan owner:** *"semua sih, nanti siswa bisa bandingkan bahkan bisa
membuat 2 pilihan univ 1 dan 2 dengan passing grade berbeda"*
**Status:** **mesin logika selesai & teruji (58 uji). UI dan penyimpanan ke
Firestore BELUM dibangun.**

---

## 1. Soal istilah: "passing grade"

Owner menyebut *passing grade*. Fiturnya persis seperti yang dimaksud — tapi
**istilah itu tidak boleh muncul di layar siswa**, dan ini bukan soal selera.

**Faktanya:** panitia SNPMB **tidak mengumumkan** nilai minimum kelulusan per
program studi. Yang dirilis resmi hanya **daya tampung** dan **jumlah peminat**
([snpmb.id/utbk-snbt/daya-tampung-snbt](https://snpmb.id/utbk-snbt/daya-tampung-snbt)).
Angka `Skor_UTBK_Minimum` di berkas Excel owner — 266 prodi × 3 = 798 angka —
adalah **estimasi/kompilasi pihak ketiga**, dan berkasnya sendiri tidak
mencantumkan sumber maupun tanggal pengambilan per baris.

**Blueprint owner sendiri melarangnya** (§3C):

> *"Target skor pribadi tidak boleh diberi label sebagai passing grade resmi.
> Hasil tahun sebelumnya atau estimasi dari pihak lain harus diberi label
> sesuai sumber dan tahun datanya. Skor tryout internal Gemilang juga tidak
> boleh dianggap otomatis setara dengan skor UTBK resmi."*

**Jadi yang dipakai di kode dan UI:**

| ❌ Jangan | ✅ Pakai |
|---|---|
| "Passing Grade" | **"Skor acuan (estimasi)"** + status datanya |
| "Peluang diterima 68%" | **"Zona Kuning — perlu drill"**, dengan dasar perhitungannya |
| "Skor UTBK kamu 685" | **"Skor TO Gemilang kamu 685"** |

`utils/statusDataPtn.js` menyediakan `sanggahanSkor()` yang wajib ditampilkan di
setiap layar yang memuat angka skor. `utils/zonaKesiapan.js` secara struktural
**tidak punya** fungsi yang mengembalikan persentase — jadi bukan mengandalkan disiplin
developer, memang tidak ada jalurnya.

---

## 2. Yang sudah dibangun

| Berkas | Baris | Isi | Uji |
|---|---|---|---|
| `src/utils/kunciSubtesPtn.js` | 168 | Urai `subtesKunci` teks bebas → 7 subtes UTBK + penanda portofolio | 12 |
| `src/utils/zonaKesiapan.js` | 232 | Matriks 4 zona, pembanding skor, penilai formasi, tren | 21 |
| `src/utils/targetKampus.js` | 236 | Target 2 pilihan, versi + riwayat, penyusun perbandingan | 25 |

Semuanya **logika murni** — tidak menyentuh Firestore, tidak membaca berkas.
Itu sebabnya bisa diuji, dan itu sebabnya 6 bug ketemu sebelum ada UI.

### 2.1 Matriks zona — disalin dari SOP owner, bukan dikarang

Dari sheet `SOP_GEMBLENGAN_TRYOUT`:

| Zona | Selisih skor vs acuan minimum | Risiko | Frekuensi drill | Tindakan |
|---|---|---|---|---|
| 🟢 Hijau (Sangat Aman) | **≥ +25** | Sangat Rendah | 1× TO / 2 minggu | Pertahankan konsistensi, stamina mental 195 menit |
| 🟢 Hijau (Kompetitif) | **0 … +24** | Rendah–Sedang | 1× TO / minggu | Perkuat subtes pendukung, hindari blunder |
| 🟡 Kuning (Perlu Drill) | **−1 … −25** | Sedang–Tinggi | 2× drill / minggu | Review 2 subtes terlemah |
| 🔴 Merah (Gemblengan Total) | **< −25** | Sangat Tinggi | 3–4× drill / minggu | Bedah konsep dasar, privat 1-on-1 |

Setiap zona **membawa tindakannya**, bukan cuma warnanya — itu yang membuat
blueprint §6 terpenuhi ("hasil evaluasi memengaruhi pembelajaran berikutnya").

Test mengunci dua sifat: rentangnya **menutup semua bilangan** dan **tidak
tumpang tindih** (diperiksa pada setiap nilai −200…200).

### 2.2 Aturan formasi Pilihan 1 & 2

Dari panduan konsultan di sheet `SIMULATOR_EVALUASI_SISWA` baris 5:

> *"Target Pilihan 1 boleh menantang (GAP −25 s/d 0), tetapi Pilihan 2 **WAJIB**
> surplus (GAP ≥ 0 thd Min)."*

Diterjemahkan jadi `nilaiFormasi()`:

```
aman = Pilihan1.gap >= -25  DAN  Pilihan2.gap >= 0
```

**Fungsi ini tidak melarang.** Blueprint §3D: *"Pilihan kampus tetap merupakan
keputusan siswa bersama orang tua atau wali dan pembimbing akademik."* Yang
dilakukannya menjelaskan konsekuensi, misalnya:

> *"Pilihan 2 belum surplus (selisih −8). SOP mensyaratkan Pilihan 2 berada di
> Zona Hijau sebagai cadangan aman. Formasi ini tidak punya jaring pengaman."*

Diverifikasi terhadap contoh nyata di berkas owner: siswa skor 685, Pilihan 1
UNAIR Kedokteran (min 708 → **−23**, Kuning), Pilihan 2 UNEJ Kedokteran
(min 672 → **+13**, Hijau Kompetitif) → formasi **memenuhi syarat**. Angka yang
dihasilkan kode identik dengan yang dihitung spreadsheet owner.

### 2.3 Tiga larangan yang dijaga secara struktural

| Larangan | Cara dijaga | Test |
|---|---|---|
| Data hilang → zona palsu | `gap: null` menghasilkan `TANPA_DATA`, **bukan** merah/hijau | *"prodi tanpa skor acuan → zona TANPA_DATA"* |
| Persentase peluang | Tidak ada fungsi yang mengembalikannya; field bernama `peluang`/`persen` ditolak test | *"tidak ada zona yang mengembalikan persentase peluang"* |
| Tren dari 1 try out | `nilaiTren()` **menolak** menyimpulkan dari < 3 titik, dan mengatakannya | *"satu hasil try out TIDAK boleh disimpulkan sebagai tren"* |

Yang ketiga ini dari blueprint §3E: *"Perubahan status target tidak boleh
dilakukan hanya berdasarkan satu hasil tryout yang belum tentu mewakili
kemampuan siswa secara konsisten."*

### 2.4 Riwayat versi target

Blueprint §1: *"Sistem harus menyimpan riwayat perubahan agar target lama tidak
tercampur dengan target baru."*

`buatVersiBaru()` menyimpan **snapshot versi lama** ke entri riwayat, dan
**menolak perubahan tanpa alasan**. Tanpa alasan, riwayat hanya menyimpan angka
lama tanpa menjelaskan kenapa berpindah — tidak berguna saat konsultasi.

Ini penting secara praktis: kalau target ditimpa terus, grafik "selisih skor
terhadap target" berubah karena **dua sebab berbeda** — skornya yang naik, atau
targetnya yang diganti. Tanpa riwayat, keduanya tidak bisa dibedakan dan tentor
akan menyimpulkan hal yang salah.

---

## 3. ⚠️ Batas yang harus diketahui sebelum UI dibangun

### 3.1 7 subtes UTBK ≠ taksonomi mapel Bank Soal Gemilang

`kunciSubtesPtn.js` memetakan subtes UTBK ke `KATALOG_MAPEL` (22 mapel
kurikulum) yang dipakai bank soal kita. **Pemetaan itu tumpang tindih, bukan
sama:**

- **PK** (Pengetahuan Kuantitatif) dan **PM** (Penalaran Matematika) dua-duanya
  jatuh ke `mtk`, padahal di UTBK keduanya subtes terpisah dengan karakter
  soal berbeda.
- **PU** (Penalaran Umum) **tidak punya padanan** sama sekali di taksonomi
  kita — `PEMETAAN_SUBTES_KE_MAPEL.PU = []`, dan itu disengaja.
- **LBI/LBE** mendekati `bind`/`bing`, tapi UTBK menguji literasi teks
  akademik, bukan tata bahasa kurikulum.

**Konsekuensi untuk UI:** pemetaan ini **sah** untuk menunjukkan *arah belajar*
("prodi ini menekankan kuantitatif → perkuat latihan matematika"). **Tidak
sah** untuk mengubah skor try out internal menjadi perkiraan skor subtes UTBK.

Kalau mau serius soal per-subtes, yang dibutuhkan adalah **melabeli bank soal
dengan 7 subtes UTBK** — pekerjaan konten, bukan kode.

### 3.2 Kolom `subtesKunci` di sumber itu teks bebas

266 prodi, **16 variasi penulisan** untuk 7 subtes yang sama:

```
108x  "Penalaran Umum & Pengetahuan Kuantitatif"
 30x  "Penalaran Matematika & Kuantitatif"
 22x  "Pengetahuan Kuantitatif & Penalaran Matematika"   ← sama, dibalik
 18x  "Penalaran Matematika & Pengetahuan Kuantitatif"   ← sama, dibalik
  4x  "Portofolio Seni & Penalaran Umum"                 ← portofolio bukan subtes
  1x  "Penalaran Kuantitatif & Umum"                     ← bahkan bukan nama subtes
```

Kalau ditampilkan apa adanya, siswa melihat dua kartu dengan teks berbeda untuk
hal yang sama. `uraikanKunciSubtes()` menormalkannya, memisahkan portofolio, dan
**melaporkan sisa teks yang tidak dikenali** — supaya variasi baru di masa depan
tertangkap oleh test, bukan oleh siswa.

Satu keputusan yang dicatat terbuka: `"Penalaran Kuantitatif & Umum"` (1 baris)
diperlakukan sebagai **PU + PK**, karena "Penalaran Kuantitatif" bukan nama
subtes dan sisa "& Umum" hanya masuk akal sebagai PU yang kata depannya
tertinggal. Ini **satu-satunya** penulisan yang ditafsirkan; daftarnya ada di
`BENTUK_DIPERBAIKI` dan sengaja dibiarkan sedikit.

### 3.3 Cakupan database: 266 prodi dari 32 PTN

Sudah dijelaskan di `docs/RANCANGAN-DATABASE-PTN.md` §2.4. Untuk fitur
perbandingan artinya konkret: **125 PTN tidak bisa dibandingkan sama sekali**,
dan 95% prodi yang ada berada di Jawa.

`susunPerbandingan()` menangani ini secara eksplisit — prodi yang tidak ada
menghasilkan `tersedia: false` **beserta penjelasannya**:

> *"Program studi ini belum ada di database Gemilang. Database saat ini memuat
> 266 prodi dari 32 PTN, terdalam untuk Jawa Timur & UNEJ."*

Bukan kartu kosong, bukan error, dan bukan angka karangan.

---

## 4. Rancangan UI (belum dibangun)

### 4.1 Layar siswa: "Target Kampusku"

```
┌─ Target Kampusku ─────────── versi 3 · SNBT 2027 ─┐
│ Skor TO Gemilang terakhir     685   ▲ +25 dari TO sebelumnya │
│ Target skor pribadi           700   (selisih −15)             │
│ Tren: butuh 3+ hasil. Sekarang 2 → "belum cukup data"         │
│ ⚠ Skor TO internal tidak otomatis setara skor UTBK.           │
├───────────────────────────────────────────────────────────────┤
│  PILIHAN 1 · "impian"           PILIHAN 2 · "cadangan"        │
│  Universitas Indonesia          Universitas Jember            │
│  Pendidikan Dokter · S1         Pendidikan Dokter · S1        │
│  🟡 Kuning  −23                 🟢 Kompetitif  +13            │
│  Skor acuan (estimasi) 708      Skor acuan (estimasi) 672     │
│  Tampung 75 · Peminat 3.750     Tampung 60 · Peminat 2.980    │
│  Keketatan 1 : 50               Keketatan 1 : 50              │
│  ⚠ Wajib Bebas Buta Warna       ⚠ Wajib Bebas Buta Warna      │
│  Arah: PK, PM                   Arah: PU, PK                  │
├───────────────────────────────────────────────────────────────┤
│  FORMASI: memenuhi syarat                                     │
│  Pilihan 1 menantang (−23), masih dalam batas SOP.            │
│  Pilihan 2 surplus (+13) → ada jaring pengaman.               │
│  [Bandingkan prodi lain]  [Ubah target]                       │
└───────────────────────────────────────────────────────────────┘
```

**Aturan tampilan yang tidak bisa ditawar:**

1. Setiap angka skor **wajib** ditempel label status (`Skor acuan (estimasi)` +
   `belum_verifikasi` / `terverifikasi` / `kedaluwarsa`).
2. `sanggahanSkor()` tampil di layar ini, bukan cuma di halaman bantuan.
3. Zona `TANPA_DATA` tampil sebagai **"belum tersedia"** — tanpa warna, tanpa
   angka. Bukan abu-abu yang terlihat seperti "netral".
4. **Tidak ada** persentase di mana pun.
5. Syarat khusus (buta warna, tinggi badan, portofolio) tampil **di kartu**,
   bukan di halaman detail. Sheet owner menyebut *"verifikasi syarat portofolio
   & tes buta warna sejak dini"* — syarat yang baru kelihatan di akhir tidak
   berguna.

### 4.2 Yang perlu dibangun

| # | Pekerjaan | Perkiraan |
|---|---|---|
| 1 | Koleksi `target_kampus_siswa` + `target_kampus_riwayat` (bentuk di `docs/RANCANGAN-DATABASE-PTN.md` §4.4) | ½ hari |
| 2 | ~~Panel admin impor PTN~~ **SELESAI 2026-10-10**: `/admin/ptn/impor` (rute + menu terkunci Owner/Manajer), pratinjau + daftar `masalah[]` + konfirmasi ganda + tulis batch + jejak audit. Lihat §4.3 | — |
| 3 | **Panel admin target siswa** — pilih PTN/prodi untuk siswa kelas 12, wajib `alasanPerubahan`, catat ke `audit_logs` | 1 hari |
| 4 | **Halaman verifikasi data** — antrean prodi `belum_verifikasi`; admin buka portal SNPMB, isi `sumberUrl` + `diambilPada` + `resmi`. **Ini yang mengubah §2.1 dokumen audit dari masalah jadi proses** | 1 hari |
| 5 | **Layar siswa "Target Kampusku"** (§4.1) | 2 hari |
| 6 | **Pembanding prodi** — pilih 2 dari database, lihat berdampingan | 1 hari |
| 7 | Semua di atas **di belakang `sakelarFitur`** (`docs/MODE-UJI-COBA-FITUR.md` §2) | — |

**Syarat sebelum layar siswa dibuat:** butir 2 harus DIJALANKAN dulu terhadap
database dev (layar siswa membaca dari Firestore; sampai impor dijalankan,
`IMPOR-PTN-2026.json` masih berupa berkas di repo). Lihat §4.3 untuk cara
menjalankannya dengan aman.

### 4.3 Halaman `/admin/ptn/impor` — cara pakai yang aman

Halaman ini sudah ada di branch `fitur/infrastruktur-pilot` dan lolos kedua
penjaga CI sungguhan. Empat pengamannya (rinci di kepala berkas halamannya):

1. **Peran.** Hanya Owner & Manajer. Kasir yang membuka URL-nya melihat layar
   "Akses Ditolak" berisi penjelasan — tidak dilempar diam-diam.
2. **Pita lingkungan.** Bila aplikasi menunjuk Firestore **produksi**, pita
   MERAH tampil tepat di atas tombol tulis. Bila dev, pita biru.
3. **Konfirmasi ganda.** Centang "seluruh skor berstatus estimasi" wajib;
   centang kedua wajib bila berkas membawa catatan error. Tanpa centang,
   tombol tulis tidak aktif.
4. **Jejak audit.** Impor yang berhasil tercatat di `audit_logs`
   (`ptn.impor`) bersama nama akun, jumlah dokumen, nama berkas, dan
   lingkungannya.

Urutan menjalankan yang disarankan:

```
1. npm run dev dengan .env.local menunjuk proyek Firebase dev
2. buka /admin/ptn/impor, unggah IMPOR-PTN-2026.json, periksa pratinjau
3. tulis -> periksa isi Firestore dev di Console
4. ulangi impor yang sama sekali lagi -> jumlah dokumen harus TETAP
   (idempoten: ID dokumen berasal dari ID berkas, impor ulang menimpa)
5. baru setelah itu jalankan terhadap produksi, dengan kesadaran penuh
```

Impor **tidak menghapus** prodi yang tidak ada di berkas. Menjadikan database
"persis seperti berkas" termasuk membuang data verifikasi manusia adalah
tindakan terpisah yang belum dibangun — sengaja.

**`api/` tidak boleh disentuh** — repo sudah di **12/12** function Vercel;
function ke-13 membuat **semua deploy gagal**. Panel impor harus berjalan di
sisi klien atau lewat `lib/`.

---

## 5. Bug yang ketemu saat membangun ini

Semuanya tertangkap oleh test, bukan oleh pengguna. Layak dicatat karena
pola-nya sama: **JavaScript memaksa nilai kosong jadi angka.**

| # | Bug | Akibat kalau lolos |
|---|---|---|
| 1 | `Number('') === 0` di `zonaDariGap()` | Siswa yang **belum pernah try out** mendapat gap "positif" terhadap prodi mana pun → tampil **Zona Hijau Kompetitif**. Harapan palsu, persis yang dilarang blueprint |
| 2 | `Number(null) === 0` di filter riwayat | Titik data kosong ikut terhitung sebagai **skor 0** → tren terlihat "meningkat" padahal tidak ada data |
| 3 | `Number('') === 0` di `skorSiswa` perbandingan | Sama seperti #1, lewat jalur berbeda |
| 4 | `bentukTarget()` memotong pilihan ke-3 diam-diam | Admin mengisi 3 pilihan, yang tersimpan 2, **tanpa pesan** |
| 5 | `bentukTarget()` mengubah `'7OO'` (salah ketik) jadi `null` | Target skor hilang senyap; validator tidak pernah melihat nilai aslinya |
| 6 | Formasi yang bagus tidak diberi catatan | Blueprint §3D mewajibkan kategori **menjelaskan dasarnya**; vonis tanpa dasar tidak bisa diperiksa saat konsultasi |

Perbaikan #1–#3 dipusatkan di satu fungsi `angkaSah()` yang dipakai ketiga
tempat — bukan tiga tambalan terpisah yang suatu hari bisa berbeda sendiri.

---

## 6. Verifikasi

**Dijalankan sungguhan:**

```
node tests/kunciSubtesPtn.test.mjs    12 LULUS
node tests/zonaKesiapan.test.mjs      21 LULUS
node tests/targetKampus.test.mjs      25 LULUS
                                     ─────────
                                      58 uji (fitur ini)

Seluruh suite baru di branch ini:    117 LULUS, 0 GAGAL
  cocokkanTargetPaket 14 · sakelarFitur 19 · parsePtnExcel 26
  kunciSubtesPtn 12 · zonaKesiapan 21 · targetKampus 25

ESLint (konfigurasi disamakan dgn repo) : 0 error pada 9 berkas
Penjaga gerbang (replikasi)             : 0 temuan · 12/12 function Vercel
npm test                                : 42 → 48 suite terdaftar
```

**Belum dijalankan** (tidak diklaim sebaliknya):

- ❌ `npm test` penuh — butuh `npm ci` di repo
- ❌ `npm run build` — butuh RAM ≥ 4 GB
- ❌ Penjaga CI sungguhan (`ci-penjaga-konten.mjs`, `ci-penjaga-rute.mjs`) —
  yang dijalankan di sini **replikasi Python** dari aturannya, bukan berkas aslinya
- ❌ Perilaku di browser — **belum ada UI**
- ❌ Penulisan ke Firestore — memang belum
