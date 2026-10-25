# AUDIT-MENYELURUH-2026-10-21.md

**Diukur:** 2026-10-21 pada `main` @ `eb2f530` + commit `b677e64`
**Cara mengukur ulang:** semua angka di bawah hasil eksekusi perintah, bukan perkiraan.
Perintahnya dicantumkan di tiap bagian.
**Rujukan silang:** `AUDIT-REPO.md` (utang lint), `docs/CETAK-BIRU-SUPER-APP.md`
(roadmap fase), `docs/KEPUTUSAN-RISIKO-FIRESTORE.md` (risk acceptance owner).

---

## Ringkasan satu layar

Aplikasi ini **sehat secara logika dan sangat terdokumentasi** — 110/110 uji
lulus, 47 berkas docs, CI berlapis 5 gerbang, dan owner sudah punya blueprint
5 fase. Masalahnya bukan di kualitas kode harian. Masalahnya ada di **empat
hal struktural** yang semuanya sudah terukur di bawah:

| # | Temuan | Bukti | Dampak |
|---|---|---|---|
| **P0-1** | Password siswa teks polos, dibandingkan di browser | `LoginSiswa.jsx:197,210` | Kebocoran kredensial anak |
| **P0-2** | 12 endpoint `api/` tanpa verifikasi pemanggil | 0 `req.headers` di seluruh `api/` | Kuota AI & pembayaran terbuka |
| **P0-3** | ~~Harga Midtrans dikendalikan klien~~ **TUTUP 2026-10-25: Midtrans DIHAPUS total** (owner ditolak Midtrans); celah harga ikut lenyap bersama endpointnya | `create-payment.js` (dihapus) | - |
| **P1-1** | Tidak ada code-splitting sama sekali | 0 `React.lazy`; 130 impor eager | Siswa unduh 77.492 baris kode admin |
| **P1-2** | 3 critical + 10 high npm advisory | `npm audit --omit=dev` | `xlsx` tak punya perbaikan |
| **P2-1** | 2 berkas >5.700 baris | lihat §5 | Sulit diubah dengan aman |
| **P2-2** | Akar repo 2,4 MB berkas data | 18 JSON + 2 HTML | Clone & CI berat |
| **P3-1** | 144 branch remote | `git ls-remote --heads` | Sulit tahu mana yang hidup |

**Yang sudah BERES dan jangan diulang:** hashing kredensial staf (PBKDF2
210.000 iterasi, `passwordHash.js` + `verifyStaffLogin.js`, teruji),
`no-unused-vars` lint (nol di `main`), runner uji paralel, penjaga rute/konten/
impor/JSX, backup Firestore mingguan via GitHub Actions.

---

## P0-1 · Password siswa teks polos (WAJIB — sudah diputuskan owner)

**Bukti:**
```bash
grep -n "password\|getDocs\|collection(db" src/pages/LoginSiswa.jsx
# 197:      const querySnapshot = await getDocs(collection(db, "students"));
# 210:        if (String(studentData.password) === inputPassword) {
```

**Apa yang sebenarnya terjadi tiap siswa login:**
1. Browser mengunduh **SELURUH koleksi `students`** — bukan satu dokumen.
2. Loop mencari kecocokan NIM.
3. Membandingkan password **teks polos** dengan `===`.

**Kenapa ini P0 dan bukan sekadar "risiko diterima":**
`docs/KEPUTUSAN-RISIKO-FIRESTORE.md` butir 2 menyatakan separipatnya bahwa
password siswa teks polos **TIDAK ikut diterima sebagai risiko**, dan migrasi
hash/verifikasi server (Tahap 2 runbook) **tetap WAJIB dilaksanakan**. Jadi ini
bukan usulan baru dari audit — ini pekerjaan yang sudah owner perintahkan sendiri
dan belum dikerjakan. Alasan owner juga sudah tercatat di doc itu: password
dipakai ulang di layanan lain, dan sebagian pemiliknya anak-anak.

Karena rules Firestore terbuka (keputusan sadar, tidak diperdebatkan ulang di
sini), **siapa pun yang pernah membuka aplikasi bisa membaca password plaintext
setiap siswa.** Kombinasi rules terbuka + password plaintext adalah yang
membuat ini keluar dari pagar bimbel.

**Dampak sampingan yang gratis diperbaiki:** mengunduh seluruh koleksi per login
itu boros kuota dan lambat di HP siswa — makin lama makin parah seiring jumlah
siswa bertambah.

**Usulan (pola sudah ada di repo, tinggal dipakai untuk siswa):**
Kredensial staf sudah lewat `api/verifyStaffLogin.js` dengan PBKDF2 + salt +
perbandingan waktu-seragam. Siswa perlu jalur setara:
- `api/verifyStudentLogin.js` — **tapi lihat kendala 12 function di §P0-2.**
  Alternatif: perluas `verifyStaffLogin.js` jadi satu pintu `verifyLogin` dengan
  parameter `peran`, supaya tidak menambah function ke-13.
- Kolom `passwordHash` + `passwordSalt` di dokumen siswa; field `password`
  plaintext dihapus setelah migrasi.
- Masa transisi: terima plaintext sekali, langsung hash & timpa (migrasi malas),
  supaya tidak perlu reset password massal ke anak-anak.
- `LoginSiswa.jsx` berhenti `getDocs(collection(db,"students"))` — cukup satu
  `getDoc` per NIM, atau lebih baik seluruhnya lewat endpoint.

**Usaha:** sedang–besar. **Risiko:** tinggi kalau tanpa masa transisi — siswa
bisa terkunci. Wajib ada jalur fallback dan diuji di akun nyata dulu.

---

## P0-2 · Tidak ada satu pun endpoint `api/` yang memverifikasi pemanggil

**Bukti:**
```bash
grep -rn "req.headers" api/ | head      # → KOSONG
```
Nol hasil. Semua 5 rujukan `Authorization` di `api/` adalah panggilan
**keluar** ke penyedia AI (`Bearer ${apiKey}`), bukan pemeriksaan **masuk**.

Artinya ke-12 endpoint ini bisa dipanggil siapa saja dari internet:

| Endpoint | Baris | Biaya kalau disalahgunakan |
|---|---|---|
| `generateQuizFromTopic.js` | 5.949 | Kuota Gemini berbayar |
| `generateMateriSection.js` | 691 | Kuota Gemini berbayar |
| `smartParseQuiz.js` | 492 | Kuota AI |
| `extractPdfBankSoal.js` | 351 | Kuota AI + CPU |
| `konversiModulScan.js` | 255 | Kuota AI |
| `generateGuruLearningAid.js` | 200 | Kuota AI |
| `generateStudentNarrative.js` | 170 | Kuota AI |
| `create-payment.js` | 95 | Lihat P0-3 |
| `searchImage.js` | 108 | Proksi terbuka (gratis, risiko rendah) |
| `uploadBankSoalImages.js` | 126 | Tulis ke Supabase Storage |
| `detectBookChapters.js` | 152 | CPU |
| `verifyStaffLogin.js` | 300 | Brute-force PIN/password staf |

`verifyStaffLogin.js` tanpa rate-limit adalah yang paling mengkhawatirkan:
hashing-nya sudah benar, tapi penyerang bisa menebak tanpa batas.

**Kendala yang sudah diketahui tim** (dari `KEPUTUSAN-RISIKO-FIRESTORE.md`):
> build Vercel proyek ini mentok di 12 function (function ke-13 membuat semua
> deploy gagal, terbukti lewat branch probe)

Jadi **tidak boleh menambah endpoint baru.** Solusinya harus berupa satu lapisan
auth bersama yang dipakai endpoint yang sudah ada, bukan endpoint tambahan.

**Usulan:**
1. Satu modul `lib/apiAuth.js` (folder `lib/` sudah ada, 4 berkas) berisi
   verifikasi token staf via Firebase Admin — **bukan** function baru, jadi tidak
   menyentuh batas 12.
2. Panggil di baris pertama tiap handler. Mulai dari 3 yang paling mahal:
   `generateQuizFromTopic`, `generateMateriSection`, `smartParseQuiz`.
3. `verifyStaffLogin.js`: rate-limit per IP (in-memory cukup untuk skala ini,
   atau header `x-forwarded-for` + ambang sederhana).
4. `uploadBankSoalImages.js` wajib ikut — ini menulis ke storage.

**Usaha:** kecil–sedang per endpoint, mekanis. **Risiko:** sedang — kalau token
salah diteruskan, admin/guru kehilangan fitur AI. Harus diuji di lingkungan nyata
sebelum `main`.

---

## P0-3 · Harga pembayaran ditentukan oleh klien

**Bukti:** `api/create-payment.js`
```js
const { orderId, grossAmount, customerName, customerPhone, paketNama, paketId } = req.body;
if (!orderId || !grossAmount) { return res.status(400).json({...}); }
...
transaction_details: {
  order_id: orderId,
  gross_amount: Number(grossAmount)   // 🔥 HARGA TERKUNCI!   ← komentar ini tidak benar
}
```

`grossAmount` diterima apa adanya dari body request dan diteruskan ke Midtrans.
Komentarnya menulis "HARGA TERKUNCI", tapi tidak ada satu baris pun yang
menguncinya — tidak ada pembacaan harga paket dari Firestore, tidak ada
pembandingan dengan nilai yang diharapkan.

**Eksploitasi:** `POST /api/create-payment` dengan
`{"orderId":"apa-saja","grossAmount":1}` → dapat `redirect_url` Midtrans yang
sah untuk **Rp 1**. Endpoint ini tanpa auth (P0-2), jadi siapa pun bisa.

**Temuan ikutan:** URL-nya masih **sandbox** —
`https://app.sandbox.midtrans.com/snap/v1/transactions`. Kalau ini memang
sengaja (belum go-live), abaikan. Kalau sudah dipakai menerima uang sungguhan,
transaksinya tidak pernah masuk ke akun produksi. **Perlu konfirmasi owner.**

**Usulan:** harga diambil di server dari dokumen paket (`paketId`) di Firestore,
`grossAmount` dari klien diabaikan sepenuhnya — atau dipakai hanya untuk
pembandingan dan ditolak kalau tidak cocok. Ditambah auth dari P0-2.

**Usaha:** kecil (±30 baris). **Risiko:** rendah, tapi harus diuji alur daftar
nyata supaya pendaftaran online tidak macet.

---

## P1-1 · Tidak ada code-splitting — siswa mengunduh modul admin

**Bukti:**
```bash
grep -rn "React.lazy\|lazy(" src/        # → KOSONG
grep -c "^import" src/App.jsx            # → 130
grep -c "<Route" src/App.jsx             # → 145
wc -l src/App.jsx                        # → 1050
```

**Distribusi kode per peran:**

| Direktori | Baris |
|---|---|
| `src/pages/admin` | **52.434** |
| `src/pages/teacher` | **25.058** |
| `src/pages/student` | 18.843 |
| `src/pages/*` (root, campuran) | 4.423 |
| `src/components/belajar` | 2.115 |
| `src/components/buku` | 2.152 |
| `src/components/admin` | 1.574 |
| `src/components/guru` + `student` + `raport` | 733 |

**Siswa di HP mengunduh ±77.492 baris kode admin+guru yang tidak akan pernah
ia jalankan**, sementara kode yang benar-benar ia pakai hanya ±18.843 baris.
Ini persis Fase 2 butir 1 di `CETAK-BIRU-SUPER-APP.md`, dan dampaknya paling
terasa bagi pengguna: siswa buka app di HP dengan kuota terbatas.

**Kenapa belum dikerjakan (dan kenapa harus hati-hati):**
`vite.config.js` punya catatan insiden nyata — percobaan memisahkan
`react`/`react-dom` ke chunk sendiri pernah menyebabkan
`Uncaught TypeError: Cannot read properties of undefined, reading 'forwardRef'`
yang gejalanya beda antar browser. Aturan yang sudah ditemukan tim:
> JANGAN pisahkan react/react-dom dari library apa pun yang "React library".
> Yang boleh dipisah HANYA library besar & berdiri sendiri.

`manualChunks` sekarang sudah memisah `vendor-pdf`, `vendor-mammoth`,
`vendor-excel`, `vendor-pdfmaker`, `vendor-firebase`. Yang **belum** disentuh
adalah pemecahan **per rute/peran** — dan itu justru yang paling besar
dampaknya, karena tidak menyentuh urutan muat React sama sekali.

**Usulan (aman, tidak mengulang insiden forwardRef):**
Bungkus 145 `<Route>` dengan `React.lazy` **per halaman**, kelompokkan per peran:
```jsx
const ManajerBuku = lazy(() => import('./pages/admin/buku/ManajerBuku'));
```
`vendor-*` chunk **tidak diubah sama sekali**. Yang dipecah hanya kode `src/`.
Tambahkan satu `<Suspense fallback>` di akar router.

**Validasi:** build produksi **tidak bisa dijalankan di lingkungan audit ini**
(lihat lampiran) — jadi angka penghematan harus diukur di CI GitHub
(`Ringkasan ukuran bundle` sudah ada di `.github/workflows/ci.yml`).

**Usaha:** sedang, tapi sangat mekanis dan bisa dicicil per direktori peran.
**Risiko:** sedang — `ci-penjaga-rute.mjs` (141 rute terdaftar, 125 komponen
diimpor) harus tetap hijau; kemungkinan script itu perlu diajari mengenali
bentuk `lazy(() => import(...))`.

---

## P1-2 · Dependensi: 3 critical, 10 high

**Bukti:**
```bash
npm audit --omit=dev
# {info:0, low:2, moderate:17, high:10, critical:3, total:32}
```

| Paket | Tingkat | Perbaikan |
|---|---|---|
| `swiper` | **critical** | major → 14.3.0 |
| `tar` | **critical** | lewat `pdfjs-dist` |
| `websocket-driver` | **critical** | tersedia |
| `pdfjs-dist` (+ `canvas`, `@mapbox/node-pre-gyp`) | high | major → 5.6.205 |
| `xlsx` | high | **`fixAvailable: false`** |
| `@grpc/grpc-js`, `@xmldom/xmldom`, `brace-expansion`, `minimatch`, `tmp`, `ws` | high | tersedia |

**`xlsx` adalah kasus khusus dan perlu keputusan.** Versi npm-nya (`0.18.5`)
sudah tidak dipelihara — SheetJS pindah distribusi ke situs sendiri, jadi
`npm audit` tidak akan pernah menawarkan perbaikan. Dan repo ini punya
**dua** library Excel sekaligus:

```bash
grep -rln "from 'xlsx'"    src/   # → 7 berkas
grep -rln "from 'exceljs'" src/   # → 1 berkas (AdminDailyLog.jsx)
```

`exceljs` dipakai di satu tempat, `xlsx` di tujuh. Konsolidasi ke satu library
menghapus satu dependensi besar dari bundle **dan** menyelesaikan advisory yang
tidak bisa diperbaiki itu. Arah yang lebih murah: migrasikan 1 berkas `exceljs`
ke `xlsx`, bukan sebaliknya — tapi itu mempertahankan paket tak terpelihara.
Arah yang lebih benar: pindah semuanya ke `exceljs` (7 berkas) dan buang `xlsx`.
**Perlu keputusan owner** karena menyentuh fitur ekspor laporan keuangan.

Sisanya (`websocket-driver`, `brace-expansion`, `minimatch`, `tmp`, `ws`,
`@xmldom/xmldom`, `@grpc/grpc-js`) punya perbaikan non-major → aman dikerjakan
lebih dulu sebagai kemenangan cepat.

**Usaha:** kecil (non-major) sampai sedang (`swiper` 11→14, `pdfjs-dist` 3→5,
konsolidasi Excel). **Risiko:** `swiper` dan `pdfjs-dist` dipakai di fitur siswa
(flipbook buku, reader PDF) — wajib diuji manual di HP.

---

## P2-1 · Dua berkas raksasa

```
5.949 baris  api/generateQuizFromTopic.js
5.799 baris  src/pages/admin/bank-soal/ImportHasilScanPage.jsx
3.411 baris  src/pages/teacher/modul/ManageQuiz.jsx
2.778 baris  src/pages/student/StudentQuizView.jsx
2.727 baris  src/pages/teacher/modul/AIGenerateQuiz.jsx
2.300 baris  src/pages/teacher/modul/ManageMateri.jsx
2.273 baris  src/pages/student/belajar/BelajarReader.jsx
```

Total 173.200 baris (`src` 137.434 · `scripts` 9.519 · `api` 8.889 ·
`tests` 16.577 · `lib` 781).

Sudah tercatat sebagai Fase 1 butir 3. Yang membuat ini P2 dan bukan P1: berkas
besar tidak merusak pengguna secara langsung, tapi **membuat setiap perubahan
di sekitarnya berisiko** — dan `ImportHasilScanPage.jsx` ada tepat di alur impor
buku yang sedang jadi fokus owner.

**Usulan:** pecah `ImportHasilScanPage.jsx` per langkah impor lebih dulu (paling
sering disentuh), lalu `generateQuizFromTopic.js` jadi modul prompt/parse/validasi.

---

## P2-2 · Akar repo penuh berkas data

18 `IMPOR-*.json` + 2 fixture HTML ≈ **2,4 MB** di akar repo.
`IMPOR-PTN-2026.json` sendiri **749 KB**.

**Sudah diverifikasi aman dipindah:**
```bash
grep -rn "IMPOR-PTN\|IMPOR-BAHASA\|IMPOR-KIMIA" src/ api/
# → hanya muncul di TEKS UI & komentar docs, tidak ada satu pun `import ... from '*.json'`
grep -rn "from '.*\.json'" src/    # → KOSONG
```
Berkas-berkas itu **tidak ikut terbundel** — hanya dibaca `scripts/` dan diunggah
manual lewat UI. Jadi memindahkannya ke `data/impor/` cukup dengan memperbaiki
path di `scripts/build-*.mjs`.

Ini Fase 1 butir 2, dan merupakan perbaikan paling murah dengan rasio
manfaat/risiko terbaik di seluruh daftar ini.

---

## P3-1 · 144 branch remote

```bash
git ls-remote --heads origin | wc -l   # → 144
```
Sulit membedakan branch hidup dari sisa eksperimen. Perlu keputusan owner:
hapus yang sudah merged, atau tandai dengan konvensi penamaan.

---

## Yang TIDAK perlu diperbaiki (sudah benar)

Supaya sesi berikutnya tidak mengerjakan ulang:

- **Uji logika:** 110 berkas / 510 subtest TAP, runner paralel otomatis
  (`scripts/run-tests.mjs`), 12 detik. Sangat baik untuk basis kode sebesar ini.
- **Lint `no-unused-vars`:** **nol** di `main` setelah `b677e64`.
  Tahap 1 `AUDIT-REPO.md` tuntas. Sisa 18 error semuanya kelas perilaku
  (`immutability` 8, `set-state-in-effect` 7, `purity` 1, `refs` 1,
  `only-export-components` 1) dan **wajib satu berkas per PR**.
- **Hashing kredensial staf:** PBKDF2-HMAC-SHA256 210.000 iterasi, salt 16 byte,
  perbandingan waktu-seragam, dan **teruji** (`tests/passwordHash.test.mjs`).
  Implementasi browser dan server sengaja diduplikasi agar identik — itu benar.
- **Gerbang CI:** 5 penjaga (uji, konten, rute, impor, komponen JSX) plus lint
  berkas-tersentuh. Penjaga JSX lahir dari insiden produksi nyata dan menangkap
  kelas bug yang tidak terlihat ESLint. Jangan dilemahkan.
- **Backup Firestore:** GitHub Actions, Sabtu 20.00 UTC. (Catatan: baru benar-benar
  jalan setelah `FIREBASE_SERVICE_ACCOUNT` diisi — perlu dipastikan sudah.)
- **Tidak ada `console.log` yang membocorkan** password/token/secret/apiKey/PIN
  di `src/` maupun `api/`. Hanya 11 TODO/FIXME di seluruh basis kode.
- **`searchImage.js`** punya penyaring kata kunci tidak pantas berlapis untuk
  konten anak. Sudah dipikirkan dengan baik.

---

## Urutan pengerjaan yang disarankan

Disusun berdasarkan **risiko ke pengguna ÷ usaha**, bukan berdasarkan urutan
fase di blueprint:

| Urut | Pekerjaan | Fase blueprint | Usaha | Risiko |
|---|---|---|---|---|
| 1 | Pindah `IMPOR-*.json` → `data/impor/` | 1.2 | kecil | sangat rendah |
| 2 | `npm audit fix` non-major (7 paket) | — | kecil | rendah |
| 3 | Auth lapisan `lib/apiAuth.js` di 3 endpoint AI termahal | — | sedang | sedang |
| 4 | Rate-limit `verifyStaffLogin.js` | — | kecil | rendah |
| 5 | **P0-3 kunci harga Midtrans di server** | — | kecil | sedang |
| 6 | **P0-1 hash password siswa (migrasi malas)** | Tahap 2 runbook | besar | tinggi |
| 7 | Code-splitting `React.lazy` per peran | 2.1 | sedang | sedang |
| 8 | Pecah `ImportHasilScanPage.jsx` | 1.3 | besar | sedang |
| 9 | Konsolidasi `xlsx` → `exceljs` | — | sedang | sedang |
| 10 | Sisa 18 error lint perilaku, 1 berkas/PR | 1.1 | sedang | sedang |

Butir 1–4 bisa dikerjakan tanpa menyentuh perilaku yang terlihat pengguna, jadi
aman walau owner memutuskan push langsung ke `main`. Butir 5–6 menyentuh uang
dan login — **sangat disarankan lewat PR + uji di akun nyata** meski preferensi
owner adalah push langsung.

---

## Lampiran · kendala lingkungan audit

Audit ini dijalankan di sandbox dengan **RAM 1 GB / 2 CPU**. Konsekuensinya:

```bash
npm run build                                        # → FATAL ERROR: heap OOM (~510 MB)
NODE_OPTIONS=--max-old-space-size=768 npm run build   # → Killed (cgroup 1 GB)
```

**Build produksi tidak bisa dijalankan di sini.** Ini batas sandbox, bukan bug
kode — CI GitHub dan Vercel punya RAM lebih besar dan build-nya lolos.

Karena itu seluruh audit ini divalidasi lewat 5 gerbang CI yang ringan, dan
**angka penghematan bundle (P1-1) sengaja tidak diklaim** — harus diukur di CI
GitHub lewat langkah `Ringkasan ukuran bundle` yang sudah ada.

---

## Pembaruan 2026-10-24 — audit ulang + status roadmap

Diaudit ulang atas permintaan owner ("audit kembali, coba kerjakan").
Angka di bawah hasil eksekusi ulang, bukan proyeksi.

### Baseline terukur ulang

```
uji logika        : 116 berkas LULUS (510 subtest TAP)   [naik dari 110: +6 berkas uji baru]
lint              : 17 error · 97 warning · 49 berkas kotor
                    (set-state-in-effect 7 · immutability 8 · refs 1 ·
                     only-export-components 1 · no-unused-vars 0 · purity 0)
npm audit --omit=dev : 29 (3 critical · 11 high · 13 moderate · 2 low)
function Vercel   : 12/12  (batas maksimum; Midtrans masih ada karena
                    penghapusan menunggu keputusan owner — lihat pratinjau
                    PRATINJAU-HAPUS-MIDTRANS)
```

### Status roadmap §"Urutan pengerjaan yang disarankan"

| # | Pekerjaan | Status 2026-10-24 |
|---|---|---|
| 1 | Pindah `IMPOR-*.json` + fixture → `data/impor/` | **SELESAI hari ini**: 23 berkas pindah; 14 baris penulis di `scripts/build-*.mjs`, default `bangun-impor-ptn.py`, dan 2 pembaca di `tests/rencanaImporPtn.test.mjs` diperbarui; nol rujukan akar tersisa |
| 2 | `npm audit fix` non-major | belum — sengaja: sandbox tak bisa menjalankan build produksi, jadi bump dependensi harus diverifikasi job CI (lakukan di branch) |
| 3 | Lapisan auth `lib/apiAuth.js` di endpoint AI | belum |
| 4 | Rate-limit `verifyStaffLogin.js` | **TERNYATA SUDAH ADA** (audit 2026-10-21 ketinggalan): peta in-memory 8 percobaan/10 menit per kunci, dengan komentar jujur bahwa Vercel stateless membuat ini perlambatan, bukan pertahanan; pertahanan sebenarnya disebut di Rules + Firebase Auth |
| 5 | Kunci harga Midtrans / hapus Midtrans | menunggu keputusan owner (pratinjau penghapusan sudah dibuat) |
| 6 | Hash password siswa | belum (P0 tertua yang masih terbuka) |
| 7 | Code-splitting `React.lazy` | belum (`React.lazy` masih nol) |
| 8 | Pecah `ImportHasilScanPage.jsx` | belum (malah bertambah: gerbang LaTeX, prompt koreksi) |
| 9 | Konsolidasi `xlsx` → `exceljs` | belum |
| 10 | 18 error lint perilaku, 1 berkas/PR | 1 berkas lunas (`ManageTugas.jsx`, commit `07c23f6`); sisa 17 |

### Pekerjaan incident-driven di luar roadmap (2026-10-21 s/d 24)

`838da53` opsi angka polos · `8812875`+`5364778` pemulihan LaTeX lalu REVERT
(prinsip kontrak) · `c2de2aa` gerbang LaTeX + prompt 4b · `915527c` tombol
prompt koreksi · `6ce53e1` paritas render 4 permukaan · `5c210c1` skala
100–1000 + bobot resmi · `35c8a2d` dua bug konsistensi nilai · `ca53aff`
jenis ujian + skala TKA · `a696805` standar TKA 2026 bersumber.

### Temuan audit-ulang pada kode baru (diperbaiki hari ini)

1. `modeSkalaTka()` jatuh ke skala SD/SMP bila jenjang tak terbaca = menebak.
   Kini mengembalikan null dan `hitungSkalaSesi` meminta admin melengkapi
   jenjang paket dengan alasan jujur.
2. Total gabungan TKA dibulatkan integer padahal laporan resmi 2 desimal.
   Kini round2.
3. Layar hasil menampilkan kode mata uji lowercase untuk mode TKA.
   Kini memakai nama mapel asli.
   Ketiganya dikunci 2 uji baru di `tests/skorSkalaTka.test.mjs` (18 uji).
