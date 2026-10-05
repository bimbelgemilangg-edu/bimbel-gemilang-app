# Bimbel Gemilang — Gemilang Super App

Aplikasi pembelajaran sekaligus sistem operasional Bimbel Gemilang: satu codebase
untuk **Admin/Kasir**, **Guru**, **Siswa**, dan **Owner**. Berjalan sebagai PWA
sehingga bisa dipasang di HP siswa seperti aplikasi biasa.

> README ini ditulis ulang saat audit 2026-10-01. Sebelumnya isinya masih
> template bawaan `create-vite`, sehingga tidak ada cara bagi developer baru
> untuk menjalankan proyek tanpa bertanya-tanya.

---

## Menjalankan Proyek

```bash
npm ci            # pasang dependensi sesuai package-lock.json
npm run dev       # dev server Vite (HMR) di http://localhost:5173
npm run build     # build produksi ke dist/
npm run preview   # pratinjau hasil build
npm run lint      # periksa gaya & bug statis
npm test          # 184 uji: kredensial, keuangan, kwitansi, bank soal, skoring, LaTeX, identitas guru
npm run test:keuangan   # hanya uji logika uang
npm run test:kwitansi   # hanya uji nominal -> teks yang tercetak di kwitansi
npm run test:auth       # hanya uji hash password
```

**Butuh Node 20+.** Build produksi memerlukan **RAM ≥ 4 GB** — proyek ini punya
±2.200 modul dan `vite build` gagal *out of memory* di bawah itu.

Deploy ke **Vercel**. `vercel.json` sudah mengatur SPA rewrite (`/*` → `index.html`,
kecuali `/api/*`) dan `maxDuration: 60` untuk serverless functions.

### Variabel Lingkungan

Lihat **[`.env.example`](.env.example)** untuk daftar lengkap 20 variabel beserta
penjelasan mana yang wajib, mana yang punya nilai default, dan endpoint mana yang
memakainya. Ringkasnya:

| Wajib untuk | Variabel |
|---|---|
| Semua fitur AI (6 endpoint) | `GEMINI_API_KEY` |
| Pembayaran pendaftaran online | `MIDTRANS_SERVER_KEY` |
| Upload gambar bank soal | `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL` |

Semua secret dibaca **hanya di sisi server** (`api/*.js`) lewat `process.env`.
Tidak ada API key AI yang ikut terkirim ke browser.

**Firebase tidak memakai `.env`.** Konfigurasinya tertulis di `src/firebase.js`.
Ini bukan kebocoran — `apiKey` Firebase web adalah identifier publik, bukan
secret. Keamanan Firebase diatur lewat **Security Rules** dan daftar domain yang
diizinkan, bukan lewat kerahasiaan `apiKey`.

---

## Arsitektur

```
├── api/          Vercel Serverless Functions (Node). Semua panggilan AI,
│                 ekstraksi PDF, pembayaran Midtrans, upload gambar.
├── src/
│   ├── App.jsx           Seluruh definisi rute + guard per peran.
│   ├── firebase.js       Inisialisasi Firestore/Auth/Storage + cache persisten.
│   ├── pages/
│   │   ├── admin/        14 sub-modul (keuangan, bank soal, siswa, guru, ...)
│   │   ├── teacher/      modul, nilai, presentasi, live session, absensi
│   │   └── student/      belajar, try out, rapor, latihan harian
│   ├── components/       sidebar per peran, reader, renderer soal
│   ├── services/         akses data Firestore per domain
│   └── utils/            logika murni: auth, skoring, sanitasi, audit
├── scripts/      Pembangun konten materi (Node .mjs & Python). Menghasilkan
│                 file IMPOR-*.json yang diimpor ke Firestore.
├── tests/        Uji logika murni, jalan langsung di Node. `npm test`.
└── docs/         Rencana, SOP, dan draft konten per mata pelajaran/bab.
```

**Data:** Firestore adalah sumber kebenaran. Storage dipakai untuk berkas & gambar.

**Konten materi** disimpan sebagai JSON (`IMPOR-*.json` di root, draft di
`docs/drafts/`) lalu diimpor ke Firestore. Skrip pembangunnya ada di `scripts/`.

**PWA:** `registerType: 'autoUpdate'` — begitu ada deploy baru, perangkat siswa
memperbarui diri otomatis. **Konsekuensinya: deploy ke produksi langsung sampai
ke HP siswa tanpa mereka meminta.** Periksa di perangkat sungguhan sebelum merge.

---

## Empat Portal, Empat Jalur Login

| Portal | Rute | Kredensial | Penyimpanan |
|---|---|---|---|
| **Siswa** | `/login-siswa` | akun siswa | `isSiswaLoggedIn` |
| **Guru** | `/login-guru` | Firebase Auth (email + password) | `isGuruLoggedIn`, `teacherData` |
| **Admin** | `/login-admin` | **username + password per staf** | `adminSession`, `isLoggedIn`, `role=admin` |
| **Owner** | `/login-owner` | PIN | `isOwnerLoggedIn`, `role=owner` |

`/login-owner` sengaja **tidak ditautkan** dari halaman mana pun — hanya bisa
dibuka oleh yang tahu alamatnya.

### Hirarki Hak Akses Admin

```
Owner (PIN)            hak tertinggi; portal keuangan owner + seluruh area admin
  └─ Manajer           area admin + kelola akun admin + baca jejak audit
       └─ Kasir        operasional harian saja
```

**Kasir tidak bisa** melihat gaji/honor guru, pengaturan global, portal owner,
pengguna admin, maupun jejak audit. Menu sidebar disembunyikan *dan* rutenya
dikunci — keduanya, bukan salah satu.

Sesi admin dan owner **saling meniadakan**: login admin menghapus flag owner dan
sebaliknya, supaya di komputer bersama kasir tidak mewarisi hak owner.

### Kredensial Admin

Dikelola di **Pengaturan → Pengguna Admin** (`/admin/pengguna`, khusus Owner &
Manajer). Password di-hash **PBKDF2-HMAC-SHA256, 210.000 iterasi, salt acak
16 byte per akun** lewat Web Crypto API. Password asli tidak pernah disimpan —
tidak di Firestore, tidak di localStorage. Logikanya ada di
`src/utils/passwordHash.js` dan **diuji** oleh `tests/passwordHash.test.mjs`
(termasuk uji silang terhadap vektor PBKDF2 standar).

Setiap percobaan login, perubahan akun, dan reset password tercatat ke koleksi
Firestore `audit_logs` bersama nama akun, peran, waktu, dan perangkat — lihat
**Jejak Aktivitas** (`/admin/audit`). Password dan PIN otomatis disaring dan
tidak pernah masuk log.

> **Jalur warisan.** Sebelumnya semua staf masuk memakai **satu password
> bersama** tanpa username, sehingga tidak mungkin diketahui siapa yang
> mengubah suatu data. Password itu masih diterima selama Owner belum
> mematikannya, supaya tidak ada staf yang terkunci saat pembaruan dipasang.
> Login lewat jalur ini tercatat mencolok sebagai `admin-legacy` /
> "akun bersama". Matikan di **Pengaturan** begitu semua staf punya akun —
> sistem menolak mematikan kalau belum ada satu pun akun aktif.

---

## Keamanan — BACA INI

Hasil pengujian 2026-10-01: **Firestore produksi proyek ini terbuka untuk
publik** — baca, tulis, dan hapus tanpa login. `ownerPin` dan `adminPassword`
tersimpan sebagai teks polos dan bisa dibaca siapa pun lewat DevTools, begitu
juga seluruh data siswa dan catatan keuangan.

- Bukti, dampak, dan urutan perbaikan: **`docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md`**
- Langkah eksekusi di Firebase Console & Vercel: **`docs/RUNBOOK-KEAMANAN.md`**
- Aturan siap pakai (bertahap): `firebase/rules/`

Pemisahan akun admin di repo ini memberi **akuntabilitas**, tapi bukan
perbaikan keamanan selama Rules masih terbuka. Penjelasannya ada di dokumen
insiden.

---

## Menambah Konten Materi

Alurnya: skrip pembangun di `scripts/` → `IMPOR-*.json` → diimpor ke Firestore
lewat panel admin. Baca `docs/SOP-PECAH-FASE-MATERI-SOAL.md` dan
`docs/PANDUAN-HAPUS-BAB-ANTIDUPLIKAT.md` sebelum mengubah konten.

**Hati-hati dengan backslash LaTeX.** Di string literal JavaScript, `'\{'`
bernilai `'{'` — backslash-nya ditelan. Untuk menghasilkan kurung himpunan
LaTeX yang benar, tulis `'\\{'`. Kesalahan ini pernah membuat kurung himpunan
hilang dari soal Matematika Bab 7 yang sudah tayang (`$A = \{2,3\}$` ter-render
jadi `A = 2,3`). Kalau ragu, jalankan pemeriksa di `tests/`.

---

## Status Kualitas (audit 2026-10-01, diperbarui 2026-10-05)

**Sudah beres:**
- **CI sekarang ada dan hijau.** `.github/workflows/ci.yml` menjalankan test +
  tiga penjaga + lint berkas berubah + build produksi sungguhan pada setiap PR
  dan setiap push ke `main`. (Sebelum 2026-10-01 repo ini tidak punya CI sama
  sekali; bagian "Masih menjadi utang" di bawah dulu mencantumkan itu.)
- **Rute `/guru/tryout-monitor/:paketId` didaftarkan** (2026-10-05). Fitur
  "Try Out terhubung tentor" dari PR #106 sebelumnya **mati total di produksi**:
  impornya ada, halamannya ada, banner di dashboard guru ada — tapi `<Route>`-nya
  tidak pernah didaftarkan, sehingga klik banner jatuh ke fallback dan dilempar
  balik ke beranda. Penjaga baru `scripts/ci-penjaga-rute.mjs` memastikan kelas
  bug ini tidak bisa terulang diam-diam.
- **Nominal kwitansi diperbaiki** (2026-10-05): tanda minus tidak lagi hilang
  dari `terbilang`, `parseInt` pada notasi eksponen tidak lagi mencetak "Satu"
  untuk 1e21, nominal rusak (`Infinity`/`NaN`) tidak lagi menyamar jadi "Rp 0",
  dan `rp`/`rpFmt` tidak lagi saling bertentangan. Logika murninya dipindah ke
  `utils/uangTeks.js` supaya bisa diuji — 22 uji invarian di
  `tests/kwitansi.test.mjs`.
- **`AUDIT-REPO.md` akhirnya ada.** `ci.yml` merujuknya sejak awal tapi
  berkasnya tidak pernah dibuat, jadi pesan CI menyuruh developer membaca
  roadmap yang tidak eksis.
- 6 bug di logika keuangan ditemukan lewat `tests/keuangan.test.mjs` dan
  diperbaiki (lihat commit `keuangan:`)
- `.gitignore` ditulis ulang (sebelumnya rusak: berisi markdown code-fence dan
  meng-ignore `public/` yang justru folder aset aplikasi)
- Seluruh bug `no-undef` diperbaiki: **46 → 0**. Termasuk tiga bug runtime nyata
  yang gagal senyap (`Settings.jsx`, `AdvancedQuestionExtractor.jsx`,
  `ImportHasilScanPage.jsx`)
- Konfigurasi ESLint dipisah per lingkungan runtime (browser / Node / CommonJS),
  sehingga 38 error palsu hilang dan 30 berkas `.mjs` di `scripts/` yang
  sebelumnya **tidak pernah dilint** sekarang tercakup
- Berkas duplikat bernamakan ber-tab dihapus
- Kurung himpunan LaTeX Bab 7 diperbaiki (skrip sumber + JSON hasilnya)

**Masih menjadi utang, disengaja belum disentuh:**
- **Tidak ada code-splitting.** ±111 rute diimpor statik, tanpa `React.lazy`.
  Seluruh panel admin ikut terunduh ke HP siswa. Ini penyebab build boros memori
  dan alasan `vite.config.js` punya `manualChunks` manual serta limit workbox
  yang pernah dinaikkan ke 6 MB.
- **Utang lint membuat 74 dari 262 berkas jadi "ranjau CI".** CI melint berkas
  yang *disentuh* dan mewajibkannya bersih, jadi menyentuh salah satu dari 74
  berkas itu berarti CI merah lebih dulu karena error warisan yang tidak ada
  hubungannya dengan perbaikan kita. Angka terukur, peta per rule, dan roadmap
  pembersihannya (74 → 24 berkas kotor hanya dengan membereskan 226 error
  mekanis): **`AUDIT-REPO.md`**.
- **`varsIgnorePattern: '^[A-Z_]'` membuat impor komponen mati tak terlihat.**
  Pola itu workaround wajib (ESLint di setup ini tidak menghitung pemakaian
  JSX — terverifikasi lewat probe), tapi efek sampingnya nyata: PR #106 merge
  dengan CI hijau padahal `<Route>` untuk `GuruPantauTryOut` tidak pernah
  didaftarkan. Penggantinya `scripts/ci-penjaga-rute.mjs`, gerbang ke-3 di CI.
  Penjelasan di `AUDIT-REPO.md`.
- **259 error ESLint tersisa**, didominasi `no-unused-vars` (214) dan
  `react-hooks/exhaustive-deps` (67 warning) — hampir semuanya warisan, bukan
  dari perubahan ini.
- **Komponen raksasa.** `ImportHasilScanPage.jsx` 5.410 baris,
  `api/generateQuizFromTopic.js` 5.848 baris.
- **Cakupan test masih sempit.** 184 uji sudah menutup `passwordHash.js`,
  `keuanganOwnerUtils.js` (saldo, kanal uang, setor kas, amortisasi, arus kas,
  neraca), `utils/uangTeks.js` (`terbilang` & `rp` yang tercetak di kwitansi
  resmi — 22 uji invarian, ditambah adu 3.035 nilai ke referensi independen),
  `bankSoalSanitizer.js`, `skorSoalTryOut.js`, `kurungLatex.js`, dan
  `identitasGuru.js`. Yang **belum** teruji: `utils/kanalUang.js` dan
  `utils/skoringSoalKompleks.js` (dipakai tidak langsung lewat
  `skorSoalTryOut`, tapi belum punya uji sendiri).
- **`AdvancedQuestionExtractor.jsx`: fitur "pagar materi" belum selesai.**
  `babTaksonomi` di-fetch tapi tidak pernah dipakai; dua fungsi yang disebut di
  komentarnya (`buildMasterPrompt`, `buildMasterHTMLPrompt`) tidak ada di berkas
  itu. Ditandai `TODO` di tempat.
- **`xlsx` dan `exceljs` dua-duanya terpasang** (fungsi tumpang tindih, dua-duanya
  besar). `@supabase/supabase-js` nyaris tak terpakai di frontend.
- **21 berkas `IMPOR-*.json` (±1,3 MB) di root repo**, tercampur dengan kode.

---

## Konvensi

- **Bahasa Indonesia** untuk nama variabel, fungsi, komentar, dan pesan error.
  Konsisten dengan seluruh basis kode; pertahankan.
- **Komentar menjelaskan MENGAPA**, bukan APA. Banyak komentar panjang yang
  merekam insiden masa lalu — itu disengaja dan berharga, jangan diringkas.
- Baris dijaga pendek (±90 karakter) di `App.jsx`; lihat catatan di kepala berkas.
- Commit memakai prefix `feat:`, `fix:`, atau `fitur:`/`perbaikan:` sesuai
  riwayat yang sudah ada.
