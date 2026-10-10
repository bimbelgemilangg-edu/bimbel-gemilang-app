# RANCANGAN DATABASE PTN + HASIL AUDIT BERKAS EXCEL

**Tanggal:** 2026-10-10 · branch `fitur/infrastruktur-pilot`
**Berkas sumber:** `Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026 (1).xlsx` (8 sheet)
**Hasil konversi:** `IMPOR-PTN-2026.json` (di root repo, mengikuti konvensi `IMPOR-*.json`)
**Status:** rancangan + data terkirim. **Belum ada penulisan ke Firestore.**

Dokumen ini melaksanakan blueprint §7 langkah 3 (*"Periksa struktur Excel
database PTN dan identifikasi data kosong"*) dan langkah 4 (*"Buat rancangan
database dan alur integrasi tanpa mengubah kode"*).

---

## 1. ISI BERKAS EXCEL

| Sheet | Isi | Baris data |
|---|---|---|
| `PTN_MASTER_NASIONAL` | Direktori PTN: ID, nama, singkatan, provinsi, wilayah, bentuk, klaster, website | **157** |
| `TARGET_SKOR_PRODI_NASIONAL` | Prodi + daya tampung + peminat + skor min/rata2/maks + syarat khusus | **266** |
| `UNEJ_76_PRODI_LENGKAP` | 76 prodi UNEJ dengan kolom Fakultas & Kampus tambahan | **76** (semuanya sudah tercakup di sheet nasional) |
| `KOMPONEN_7_SUBTES_UTBK` | 7 subtes: jumlah soal, waktu, karakter, trik, prioritas prodi | **7** |
| `SUMBER_REGULASI_RESMI` | 7 portal resmi (SNPMB, Kemdiktisaintek, UNEJ, BKN) | **7** |
| `SOP_GEMBLENGAN_TRYOUT` | Matriks 4 zona kesiapan + tindakan remedial per subtes | referensi proses |
| `SIMULATOR_EVALUASI_SISWA` | **Contoh** berisi data siswa fiktif (Ahmad Fauzi, SMAN 1 Glagah) | contoh, bukan data |
| `DASHBOARD_SISTEM` | Angka ringkasan + SOP 5 tahap konsultasi | **hardcoded, lihat §2.6** |

Cakupan sebenarnya setelah dikonversi:

```
PTN                             157
Prodi                           266   (32 PTN)
PTN TANPA satu pun prodi        125   (79% institusi)
Subtes UTBK                       7
Portal sumber resmi               7
```

---

## 2. TEMUAN AUDIT DATA

Semuanya terukur dari berkas, bukan perkiraan. Setiap temuan sudah dijaga oleh
test di `tests/parsePtnExcel.test.mjs` (26 uji).

### 2.1 ⚠️ TIDAK ADA kolom sumber, tanggal, atau status verifikasi — di sheet data mana pun

Ini temuan paling menentukan. Blueprint §3B menuntut setiap datum punya
*"tautan sumber data, tanggal pengambilan dan validasi, status data"*.
Berkas sumber **tidak punya satu pun** dari ketiganya di level baris:

| Sheet | Kolom pelacakan sumber |
|---|---|
| `TARGET_SKOR_PRODI_NASIONAL` | ❌ tidak ada |
| `UNEJ_76_PRODI_LENGKAP` | ❌ tidak ada |
| `PTN_MASTER_NASIONAL` | ⚠️ hanya `URL_SNPMB` — dan **157 baris diisi URL yang sama persis** |

**Konsekuensi yang diterapkan di kode:** seluruh 266 prodi diimpor dengan
`statusData: "belum_verifikasi"` dan `resmi: false`. Tidak ada satu pun yang
bisa menyandang status `terverifikasi`, karena `statusDataPtn.js` mensyaratkan
`sumberUrl` **dan** `diambilPada` **dan** `resmi: true` — dan berkas ini tidak
menyediakan ketiganya. Ini dijaga oleh test
*"INVARIAN: skor tanpa sumber/tanggal tidak pernah menyandang status terverifikasi"*.

### 2.2 🔴 `Skor_UTBK_Minimum / Rata_Rata / Maksimum` bukan data resmi

Kolomnya bernama seolah-olah resmi. Faktanya **panitia SNPMB tidak
mengumumkan passing grade per program studi** — yang dipublikasikan resmi
adalah daya tampung dan jumlah peminat. Portal SNPMB sendiri
([snpmb.id/utbk-snbt/daya-tampung-snbt](https://snpmb.id/utbk-snbt/daya-tampung-snbt))
menyediakan kuota per prodi, bukan nilai minimum kelulusan.

Jadi 266 × 3 = **798 angka skor** di berkas ini adalah estimasi/kompilasi pihak
ketiga. Blueprint §3C sudah melarang ini diberi label resmi:

> *"Target skor pribadi tidak boleh diberi label sebagai passing grade resmi."*

**Yang dilakukan:** angka tetap disimpan (menyembunyikannya tidak membantu siapa
pun), tapi selalu dibungkus `{ nilai, sumber, sumberUrl, diambilPada, resmi,
statusData }` dan `sanggahanSkor()` menyediakan teks peringatan wajib:

> *"Angka skor di sini adalah ESTIMASI/kompilasi, bukan passing grade resmi.
> Panitia SNPMB tidak mengumumkan nilai minimum kelulusan per program studi.
> Yang resmi dipublikasikan adalah daya tampung dan jumlah peminat. Skor try out
> internal Gemilang juga TIDAK otomatis setara dengan skor UTBK."*

**Aturan UI yang tidak bisa ditawar:** tidak ada halaman yang boleh mencetak
`skorReferensi.minimum.nilai` tanpa `labelUntukTampilan()` di sampingnya.

### 2.3 🔴 31 PTKIN berada di jalur seleksi yang salah

`PTN_MASTER_NASIONAL` memuat **31 PTKIN** (UIN/IAIN/STAIN) dengan
`URL_SNPMB` menunjuk portal daya tampung SNBT. PTKIN diseleksi lewat
**SPAN-PTKIN** (rapor) dan **UM-PTKIN** (SSE), **bukan SNBT/UTBK**.

Kabar baiknya: **tidak ada satu pun dari 31 PTKIN itu yang punya baris prodi**
di sheet skor — jadi tidak ada angka skor UTBK palsu untuk PTKIN. Tapi
ke-31 barisnya tetap ditandai `jalurSeleksi: "di_luar_snbt"` + `catatanJalur`,
supaya kalau nanti ada yang menambah prodi PTKIN, sistem sudah tahu bahwa
membandingkannya dengan skor UTBK tidak berarti apa-apa.

### 2.4 ⚠️ 125 dari 157 PTN tidak punya data prodi sama sekali

Dan yang punya pun **sangat timpang secara geografis**:

```
Jawa Timur         142 prodi   (53%)   ← 76 di antaranya UNEJ sendiri
Jawa Barat          34
DI Yogyakarta       28
DKI Jakarta         25
Jawa Tengah         24
Sumatera Utara       3          Bali        3
Sulawesi Selatan     3          Sumatera Barat  2     Sumatera Selatan  2
────────────────────────────────────────────────────────
Total              266 prodi di 10 provinsi dari 37 provinsi di master
```

**Artinya untuk produk:** siswa yang menargetkan kampus di Kalimantan,
Maluku, Papua, NTB, NTT, Lampung, atau sebagian besar Sumatera akan melihat
**"belum tersedia"** — dan itu **jawaban yang benar**, bukan kegagalan sistem.
Blueprint §3B: *"Data yang belum lengkap harus ditandai sebagai belum tersedia,
bukan diisi dengan perkiraan."*

Sebaliknya, untuk bimbel di Banyuwangi, kedalaman data UNEJ (76 prodi,
4 kampus, lengkap dengan fakultas) justru sangat berguna. **Rekomendasi:
jujur soal cakupan di UI** — tampilkan "database ini memuat 266 prodi di 32 PTN,
terdalam untuk UNEJ", jangan biarkan siswa menyimpulkan ini database nasional
lengkap.

### 2.5 ❌ 2 baris rusak: kolom `Bidang` berisi jenjang

| ID | Prodi | `Bidang` | Seharusnya |
|---|---|---|---|
| `UNEJ-15` | Teknik Sipil | `S1` | hampir pasti `Saintek` |
| `UNEJ-16` | Teknik Kimia | `S1` | hampir pasti `Saintek` |

Muncul dua kali dalam laporan (4 error) karena kedua sheet memuat baris yang
sama. **Parser menolak menebak** dan menyimpan `bidang: null` + mencatat nomor
baris Excel-nya. Ini disengaja dan dikunci oleh test
*"INVARIAN: nilai di luar enum ditolak jadi null + dicatat, BUKAN ditebak"*.

**Perbaikan yang benar:** betulkan di berkas Excel sumber (baris 209 & 210
sheet `TARGET_SKOR_PRODI_NASIONAL`, dan baris padanannya di sheet UNEJ), lalu
jalankan ulang buildernya. Bukan menambalnya di kode.

### 2.6 🔴 Sheet `DASHBOARD_SISTEM` tidak cocok dengan data di sheet lain

Angka ringkasannya **ditulis tangan, bukan dihitung**, dan sudah tidak sesuai:

| Klaim dashboard | Aktual dari data |
|---|---|
| Prodi Klaster 1 = **65** | **140** |
| Prodi Klaster 2 = **115** | **110** |
| Prodi Klaster 3 = **50** | **0** — tidak ada prodi dari PTN Klaster 3 |
| Prodi Vokasi Unggulan = **36** | **13** (+3 Vokasi/Seni) |
| Rentang skor minimum **460 – 715** | **515 – 715** |
| **38** provinsi | **37** provinsi di master, dan prodi hanya di **10** provinsi |

**Konsekuensi untuk desain:** jangan pernah menampilkan angka ringkasan yang
dihardcode. Semua agregat **dihitung dari data**, atau tidak ditampilkan.
Sheet dashboard ini berguna sebagai **desain tampilan** (apa yang mau dilihat
owner), bukan sebagai **sumber angka**.

### 2.7 ⚠️ Taksonomi klaster ganda yang saling bertentangan

- `PTN_MASTER_NASIONAL` memakai **7** nilai: Klaster 1, 2, 3, Vokasi,
  Vokasi/Seni, Keagamaan, Terbuka
- `DASHBOARD_SISTEM` memakai **4**: Klaster 1, 2, 3, Vokasi Unggulan — dengan
  **anggota yang berbeda**. Contoh: USU & UNAND ber-`Klaster 1` di master,
  padahal dashboard mendefinisikan Klaster 1 sebagai "Top 10 PTN: UI, ITB,
  UGM, UNAIR, ITS"

**Yang dilakukan:** nilai master disimpan apa adanya di
`klasterKeketatanSumber`, dan parser **tidak** membuat field klaster hasil
bikinan sendiri. Meratakan keduanya berarti mengarang taksonomi. Dijaga oleh
test *"INVARIAN: klaster dari sumber disimpan apa adanya, tidak diratakan"*.

**Butuh keputusan owner:** taksonomi mana yang mau dipakai produk? Kalau
klaster dipakai untuk menampilkan "tingkat keketatan", definisinya harus satu.

### 2.8 ⚠️ 8 `Website_Resmi` dipakai dua institusi berbeda

157 baris hanya punya **149** URL unik. Yang kembar: `polman-babel.ac.id`,
`polsub.ac.id`, `polindra.ac.id`, `politap.ac.id`, `politanikoe.ac.id`,
`politala.ac.id`, `pnn.ac.id`, `uingusdur.ac.id`.

Bisa jadi memang benar (satu domain menaungi dua nama), bisa jadi salah tempel.
Parser **menandai** keduanya, tidak memutuskan.

### 2.9 ✅ Yang ternyata BERES

Penting juga mencatat yang tidak bermasalah, supaya perhatian tidak salah arah:

- **Tidak ada ID duplikat** di ketiga sheet data
- **`min ≤ rata2 ≤ maks`** terpenuhi di **seluruh 266** baris
- **Keketatan = tampung ÷ peminat** konsisten di semua baris prodi
  (hanya baris agregat yang berbeda — dan itu karena berkas sumber memakai
  *rata-rata rasio*, bukan *rasio total*; keduanya beda arti, dicatat)
- **76 prodi UNEJ di dua sheet 100% cocok** — tidak ada satu pun perbedaan skor
  atau daya tampung
- Seluruh 32 `Kode_PTN` di sheet prodi **ada** di sheet master (tidak ada yatim)
- `Syarat_Khusus` rapi: hanya 12 nilai unik, dan 151 baris eksplisit menulis
  "Tidak Ada Syarat Khusus" (bukan kosong)

---

## 3. 🔴 BUG YANG DITEMUKAN SAAT KONVERSI PERDANA (dan sudah diperbaiki)

Layak dicatat terpisah karena ini contoh nyata kenapa parser butuh test.

Konversi pertama melaporkan **168 error**, sebagian besar berbunyi
*"Skor_UTBK_Minimum beda antar sheet"* dan *"Daya_Tampung_SNBT beda antar sheet"*.
Setelah dilacak: **konfliknya palsu, bug-nya di kode penggabungan.**

Penyebabnya: pencocokan dua sheet memakai **nama prodi saja**. Padahal sheet
nasional memuat 266 prodi dari 32 PTN dan **34 nama prodi muncul lebih dari
sekali lintas PTN**:

```
'Pendidikan Dokter'  →  8 PTN berbeda
'Farmasi'            → 13 PTN berbeda
'Sistem Informasi'   →  7 PTN berbeda
```

Akibatnya Kedokteran **UI** diperkaya dengan `Fakultas Kedokteran` dan
`Kampus Jember` milik **UNEJ** — data salah institusi, dan 164 laporan konflik
yang tidak berarti apa-apa.

**Perbaikan:** kunci pencocokan jadi `(idPtn, namaProdi)`. Baris tanpa `idPtn`
**tidak dicocokkan sama sekali** — disimpan terpisah dan dilaporkan, karena
menebak berdasar nama sudah terbukti merusak.

**Hasil setelah perbaikan:**

```
sebelum : 168 error, 41 peringatan   + UI-01.kampus = "Kampus Jember"  ❌
sesudah :   4 error, 41 peringatan   + UI-01.kampus = null             ✅
                                     + UNEJ-01.fakultas terisi (76 prodi)
```

4 error yang tersisa adalah **2 baris `Bidang: 'S1'` yang memang rusak**
(§2.5), dilaporkan dua kali karena muncul di dua sheet.

Dua test mengunci regresi ini:
*"REGRESI: prodi bernama sama di PTN berbeda TIDAK saling mencemari"* dan
*"REGRESI: baris tambahan tanpa idPtn tidak dicocokkan dengan menebak"*.

Bug kedua yang lebih kecil: laporan masalah memotong pesan **sebelum**
dikelompokkan, sehingga `Bidang "S1"` tercetak sebagai `Bidang "S"`. Sudah
diperbaiki — laporan yang menyesatkan tentang data yang sedang dilaporkan
adalah jenis kesalahan yang berbahaya.

---

## 4. SKEMA DATABASE (hasil akhir konversi)

### 4.1 `ptn/{ID_PTN}` — mis. `ptn/PTN-077`

```jsonc
{
  "id": "PTN-077",                      // = ID Excel, jadi document ID (impor idempoten)
  "nama": "Universitas Jember",
  "singkatan": "UNEJ",
  "provinsi": "Jawa Timur",
  "wilayahBesar": "Jawa",
  "bentukPtn": "Universitas",           // Universitas|Institut|Politeknik|ISBI|PTKIN
  "klasterKeketatanSumber": "Klaster 2", // APA ADANYA, lihat §2.7
  "websiteResmi": "https://unej.ac.id",
  "portalDayaTampung": "https://www.snpmb.id/utbk-snbt/daya-tampung-snbt",
  "jalurSeleksi": "snbt",               // 'snbt' | 'di_luar_snbt'
  "catatanJalur": [],                   // terisi untuk PTKIN
  "statusData": "belum_verifikasi",
  "asalData": "Database_Riset_Lengkap_PTN_Konsultasi_SMA_2026.xlsx"
}
```

### 4.2 `ptn/{id}/prodi/{ID_PRODI}` — subkoleksi

```jsonc
{
  "id": "UNEJ-01",
  "idPtn": "PTN-077",
  "namaPtn": "Universitas Jember",       // denormalisasi: hemat 1 baca per kartu
  "namaProdi": "Pendidikan Dokter",
  "jenjang": "S1",
  "bidang": "Saintek",                   // null bila sumbernya rusak (§2.5)
  "wilayah": "Jawa Timur",
  "kampus": "Kampus Jember",
  "fakultas": "Fakultas Kedokteran",

  "dayaTampung": {                       // ← SELALU dibungkus, tidak pernah polos
    "nilai": 60,
    "statusData": "belum_verifikasi",
    "resmi": false,
    "sumber": "Database_Riset_...xlsx · TARGET_SKOR_PRODI_NASIONAL",
    "sumberUrl": null,
    "diambilPada": null,
    "tahunSeleksi": 2027
  },
  "peminat":   { /* bentuk sama */ },
  "keketatan": 0.02013,                  // dihitung ulang dari tampung/peminat

  "skorReferensi": {
    "minimum":  { "nilai": 672, "statusData": "belum_verifikasi", "resmi": false, ... },
    "rataRata": { "nilai": 696, ... },
    "maksimum": { "nilai": 740, ... }
  },

  "syaratKhusus": "Wajib Bebas Buta Warna Total",
  "subtesKunci": "Penalaran Umum & Pengetahuan Kuantitatif",
  "catatanPenyusun": "Pilihan 1 Prioritas Utama",  // opini penyusun Excel, BUKAN fakta
  "statusData": "belum_verifikasi",
  "asalData": { "sheet": "...", "barisExcel": 5, "berkas": "...", "diperkayaDari": "UNEJ_76_PRODI_LENGKAP" }
}
```

**Tiga keputusan desain yang perlu diperhatikan:**

1. **`catatanPenyusun`, bukan `rekomendasi`.** Kolom `Rekomendasi_Strategi`
   berisi 24 label editorial bebas ("Pilihan 2 Sangat Kuat", "Cadangan Aman
   Banyuwangi"). Itu opini penyusun berkas. Namanya sengaja dibuat jelas supaya
   tidak pernah ditampilkan sebagai rekomendasi sistem — apalagi sebagai
   "peluang diterima", yang dilarang blueprint §3D.
2. **Subkoleksi, bukan koleksi datar.** `prodi` hidup di bawah `ptn`.
   Konsekuensinya: tidak bisa query lintas PTN dengan satu `getDocs`. Untuk
   halaman "cari prodi di semua kampus" perlu strategi lain (lihat §6).
3. **Semua angka dibungkus.** Tidak ada `skorMinimum: 672` polos di mana pun.
   Bentuk bungkusnya yang membuat label sumber otomatis ikut tampil.

### 4.3 `subtes_utbk/{id}` dan `sumber_referensi/{id}`

7 subtes (PU, PPU, PBM, PK, LBI, LBE, PM) dengan jumlah soal, waktu, karakter,
trik, prioritas prodi. 7 portal resmi dengan `resmi: true`.

### 4.4 `target_kampus_siswa/{studentId}` + riwayat

**Belum dibangun.** Bentuk yang diusulkan di `AUDIT-GEMILANG-2026-10-10.md`
§4.3 tetap berlaku: dokumen aktif + koleksi riwayat, dihubungkan lewat
`studentId`, **tidak** menambah field ke koleksi `students` (dirujuk 54 kali,
dan `AddStudent`/`EditStudent` menulis dokumen utuh).

---

## 5. CARA MENJALANKAN ULANG

```bash
# jalur Python (yang dipakai untuk konversi perdana — sudah dijalankan)
python3 scripts/bangun-impor-ptn.py <berkas.xlsx> IMPOR-PTN-2026.json

# logikanya yang teruji ada di sini
node tests/parsePtnExcel.test.mjs          # 26 uji
```

Kepala `scripts/bangun-impor-ptn.py` menjelaskan kenapa Python dan bukan `.mjs`
seperti builder lain di folder itu: konversi perdana perlu dijalankan sekarang
dan lingkungan pengerjaan tidak punya `node_modules` repo. **Aturannya identik**
dengan `src/utils/parsePtnExcel.js`, dan kalau suatu hari keduanya berbeda
pendapat, **yang menang versi `.js`** — karena versi itu yang ada testnya.

**Utang:** `scripts/bangun-impor-ptn.mjs` (jalur Node kanonik, memakai
`xlsx`/`exceljs` yang sudah terpasang + `utils/parsePtnExcel.js`) **belum
dibuat**. Sampai itu ada, verifikasi aturan mengandalkan test unit terhadap
contoh baris, bukan terhadap berkas Excel utuh.

---

## 5b. SUDAH DIBANGUN SETELAH DOKUMEN INI: mesin perbandingan

Logika untuk fitur "siswa membandingkan kampus & memasang Pilihan 1–2" sudah
dibangun dan teruji (58 uji): matriks 4 zona dari `SOP_GEMBLENGAN_TRYOUT`,
aturan formasi dari sheet `SIMULATOR_EVALUASI_SISWA`, penguraian kolom
`subtesKunci`, dan target berversi + riwayat.

Rancangan, batas yang harus diketahui, dan sisa pekerjaannya:
**`docs/FITUR-BANDINGKAN-KAMPUS.md`**.

Yang TETAP belum dibangun dan masih jadi prasyarat: butir 1 & 2 di bawah
(koleksi target + panel impor), karena tanpa itu data di dokumen ini masih
berupa berkas JSON di repo, bukan isi Firestore.

---

## 6. YANG BELUM DIBANGUN

| # | Pekerjaan | Catatan |
|---|---|---|
| 1 | **Panel admin impor PTN** | Mengikuti pola `MesinBankSoalPage.jsx`: upload `.json` → pratinjau + **tampilkan `masalah[]`** → konfirmasi → tulis Firestore. Jangan menulis tanpa pratinjau |
| 2 | **Halaman admin verifikasi data** | Antrean prodi berstatus `belum_verifikasi`; admin membuka portal SNPMB, mengisi `sumberUrl` + `diambilPada` + `resmi`, status naik jadi `terverifikasi`. **Ini yang mengubah §2.1 dari masalah jadi proses** |
| 3 | **Strategi pencarian lintas PTN** | Subkoleksi tidak bisa di-query lintas induk. Pilihan: (a) koleksi datar `prodi` dengan `idPtn` sebagai field, (b) dokumen ringkas per PTN berisi daftar prodi, (c) index di sisi klien setelah satu kali muat. **Belum diputuskan** — tergantung volume yang benar-benar dibutuhkan |
| 4 | **`target_kampus_siswa` + riwayat** | §4.4 |
| 5 | **Pemetaan 7 subtes UTBK ↔ hasil try out Gemilang** | `subtesKunci` di tiap prodi sudah menyebut subtes. Tapi blueprint §3C melarang menyamakan skor TO internal dengan skor UTBK — jadi pemetaan ini boleh untuk **arah belajar** ("prodi ini menekankan PK & PM, perkuat itu"), **tidak** untuk meramal skor |
| 6 | **Perbaikan di sumber** | Betulkan `Bidang` baris 209–210 (§2.5), putuskan taksonomi klaster (§2.7), cek 8 website kembar (§2.8) — lalu jalankan ulang builder |

---

## 7. VERIFIKASI

**Dijalankan sungguhan:**

```
node tests/parsePtnExcel.test.mjs        26 LULUS, 0 GAGAL
node tests/sakelarFitur.test.mjs         19 LULUS, 0 GAGAL
node tests/cocokkanTargetPaket.test.mjs  14 LULUS, 0 GAGAL
                                         ─────────────────
                                          59 uji
python3 scripts/bangun-impor-ptn.py …    → 157 PTN, 266 prodi, 7 subtes,
                                           7 sumber, 4 error + 41 peringatan
ESLint (konfigurasi disamakan dengan repo) → 0 error pada 11 berkas yang
                                           disentuh/dibuat
```

**Belum dijalankan** (dan tidak diklaim sebaliknya):

- ❌ `npm test` penuh (45 suite) — butuh `npm ci` di repo
- ❌ `npm run build` — butuh RAM ≥ 4 GB
- ❌ Kedua penjaga CI (`ci-penjaga-konten`, `ci-penjaga-rute`). Berkas baru
  sudah diperiksa manual terhadap pola secret dan aksara CJK, tapi itu **bukan**
  pengganti menjalankan penjaganya
- ❌ Penulisan ke Firestore — **memang belum**, sesuai blueprint §7 langkah 4
  ("tanpa mengubah kode") dan SOP janji #5 (tidak menulis ke database produksi
  tanpa alasan)
