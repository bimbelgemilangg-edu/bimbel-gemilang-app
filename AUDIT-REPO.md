# AUDIT-REPO.md — peta utang kualitas & roadmap pembersihan

**Diukur:** 2026-10-05 pada branch `fix/rute-pantau-tryout-guru` (basis `main` `4e86d2f`)
**Cara mengukur ulang:** `npx eslint . -f json -o lint.json` lalu hitung per `ruleId` dan per berkas.

Berkas ini dirujuk oleh `.github/workflows/ci.yml` pada langkah *"Laporan lint
menyeluruh"* — sebelum hari ini rujukannya buntu, berkasnya tidak pernah ada.
Semua angka di bawah hasil eksekusi, bukan perkiraan.

---

## Kenapa berkas ini ada

CI repo ini punya aturan yang keras dan sengaja:

```yaml
# Lint berkas yang berubah (wajib bersih)
echo "$FILES" | xargs npx eslint        # exit != 0 → CI merah → PR ditolak
```

Utang lint lama **tidak** menggagalkan CI secara menyeluruh (itu akan
melumpuhkan perbaikan darurat), tapi **berkas yang disentuh wajib bersih**.
Konsekuensinya: sebuah berkas yang punya error warisan menjadi *ranjau* —
siapa pun yang menyentuhnya untuk memperbaiki bug apa pun harus membayar
utang orang lain dulu, atau PR-nya merah.

Maka jumlah "berkas kotor" adalah metrik yang lebih berguna daripada jumlah
error: ia mengukur **berapa bagian basis kode yang bisa disentuh dengan aman**.

---

## Angka saat ini

```
Berkas JS/JSX/MJS dilint      : 262
BERSIH  (aman disentuh)       : 188   (72%)
KOTOR   (CI merah bila disentuh): 74   (28%)

Error   : 259
Warning : 103
```

### Rincian ERROR (yang menggagalkan CI)

| Jumlah | Rule | Sifat perbaikan |
|---|---|---|
| **214** | `no-unused-vars` | **mekanis** — impor/variabel mati, nol perubahan perilaku |
| **10** | `no-empty` | **mekanis** — blok `catch {}` kosong; isi komentar atau tangani |
| **2** | `no-case-declarations` | **mekanis** — bungkus badan `case` dengan `{}` |
| 15 | `react-hooks/set-state-in-effect` | butuh pertimbangan perilaku |
| 12 | `react-hooks/immutability` | butuh pertimbangan perilaku |
| 2 | `no-control-regex` | perlu dipahami maksudnya dulu |
| 1 | `react-refresh/only-export-components` | butuh pertimbangan perilaku |
| 1 | `react-hooks/refs` | butuh pertimbangan perilaku |
| 1 | `react-hooks/purity` | butuh pertimbangan perilaku |
| 1 | `no-useless-escape` | murah, tapi di `src/` tingkatnya `error` |

### Rincian WARNING (tidak menggagalkan CI)

| Jumlah | Rule |
|---|---|
| 67 | `react-hooks/exhaustive-deps` |
| 18 | *unused eslint-disable directive* |
| 18 | `no-useless-escape` (di `api/` & `scripts/` sengaja diturunkan jadi warning) |

> **Catatan tentang 18 "unused eslint-disable directive".** Ini `severity 1`,
> jadi **tidak** menggagalkan CI. Ia muncul karena arahan `no-await-in-loop`
> di beberapa berkas sudah tidak diperlukan lagi — `eslint.config.js` mematikan
> rule itu untuk `api/` dan `scripts/` (baris 78 & 104), sehingga arahan
> `// eslint-disable-next-line no-await-in-loop` di dalamnya jadi mubazir.
> Aman dihapus, tapi tidak mendesak.

---

## Roadmap pembersihan

### Tahap 1 — tiga rule mekanis (dampak terbesar, risiko terkecil)

Bereskan **226 error** dari `no-unused-vars` (214), `no-empty` (10), dan
`no-case-declarations` (2). Ketiganya tidak mengubah perilaku runtime: yang
dihapus adalah kode yang memang tidak pernah dieksekusi.

**Hasil yang terukur** (dihitung dari data lint di atas, bukan ditebak):

```
Berkas kotor : 74  →  24
Berkas bersih: 188 → 238   (72% → 91%)
```

Artinya **50 ranjau CI hilang** dalam satu tahap. Ini pekerjaan bernilai
tertinggi di daftar ini karena ia *membuka* pekerjaan lain: setelahnya,
menyentuh hampir semua halaman tidak lagi berarti membayar utang lama.

**Cara kerja yang aman:**
1. Kerjakan per-berkas, satu commit per kelompok berkas.
2. Untuk `no-unused-vars`: hapus impornya. **Jangan** menambah
   `// eslint-disable` — itu cuma memindahkan utang.
3. **Hati-hati pada `no-unused-vars` yang ternyata penanda bug.** Sebuah
   variabel yang "tidak dipakai" kadang berarti penulisnya *berniat* memakainya
   dan lupa. Contoh nyata di repo ini: `AdvancedQuestionExtractor.jsx`
   me-fetch `babTaksonomi` lalu tidak pernah memakainya — itu fitur "pagar
   materi" yang belum selesai, bukan sampah. **Sebelum menghapus, tanyakan
   "ini sampah, atau niat yang belum terlaksana?"** Kalau yang kedua, tandai
   `TODO`, jangan dihapus.
4. Untuk `no-empty`: jangan isi dengan komentar kosong. Tulis MENGAPA
   exception-nya ditelan, atau tangani sungguh-sungguh.
5. Jalankan `npm test` + kedua penjaga + `eslint` per berkas sebelum commit.

### Tahap 2 — sisa 33 error yang butuh pertimbangan

`react-hooks/*` (30 berkas-terkena) tidak boleh dibereskan massal. Setiap
satu adalah pertanyaan tentang perilaku: apakah `setState` di effect itu
memang perlu, apakah objek itu memang boleh dimutasi. Kerjakan **saat
berkasnya memang perlu disentuh** untuk alasan lain, sesuai prinsip CI repo
ini. Sisanya (`no-control-regex`, `react-refresh/only-export-components`)
diperiksa satu per satu — jumlahnya kecil.

### Tahap 3 — warning

67 `react-hooks/exhaustive-deps` adalah yang paling berisiko kalau dikerjakan
asal-asalan: menambahkan dependensi yang "benar" ke sebuah effect bisa
memicu loop render. Jangan disentuh tanpa memahami effect-nya.

---

## ⚠️ Jebakan: ESLint di setup ini TIDAK menghitung pemakaian JSX

`eslint.config.js` baris 50 memakai:

```js
'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
```

**Ini bukan kelalaian — ini workaround wajib.** Terverifikasi lewat probe
(2026-10-05): komponen yang **benar-benar dipakai di JSX** tetap dilaporkan
`'X' is defined but never used`. Mencabut pola itu menghasilkan **±2.000
error palsu** dan membuat lint tidak bisa dipakai sama sekali.

**Efek sampingnya serius:** setiap nama berawalan huruf besar — yaitu setiap
komponen React — kebal terhadap `no-unused-vars`. Jadi **impor komponen yang
nganggur tidak terlihat oleh lint.** Itulah sebabnya PR #106 bisa merge dengan
CI hijau padahal `<Route>` untuk `GuruPantauTryOut` tidak pernah didaftarkan
dan fiturnya mati total di produksi. Rinciannya di kepala
`scripts/ci-penjaga-rute.mjs`.

**Konsekuensi untuk Tahap 1:** dari 214 `no-unused-vars`, **tidak satu pun**
berupa komponen React. Membersihkan angka itu **tidak** akan menangkap impor
komponen yang mati. Yang menangkap adalah `scripts/ci-penjaga-rute.mjs`
(gerbang ke-3 di CI), dan cakupannya baru `App.jsx`. Kalau nanti ada berkas
lain yang mengimpor komponen lalu lupa memakainya, penjaga itu yang harus
diperluas — bukan `varsIgnorePattern` yang dicabut.

Kalau ingin penyelesaian yang benar-benar tuntas: pasang
`eslint-plugin-react` (aturan `react/jsx-uses-vars` menandai komponen yang
dipakai di JSX), lalu cabut `varsIgnorePattern`. Itu pekerjaan tersendiri dan
harus diuji dulu berapa error yang benar-benar tersisa setelahnya.

---

## Utang lain yang terukur

### Tidak ada code-splitting

`src/App.jsx` = 881 baris, **109 impor statik**, **nol** `React.lazy`. Seluruh
panel admin — 14 sub-modul, termasuk `ImportHasilScanPage.jsx` **5.410 baris** —
ikut terunduh ke HP siswa. Ini juga akar kenapa:

- build produksi butuh **RAM ≥ 4 GB** (README), dan
- `vite.config.js` harus memelihara `manualChunks` manual plus menaikkan
  `maximumFileSizeToCacheInBytes` ke 6 MB.

⚠️ Perbaikan ini **tidak bisa diverifikasi di mesin development kecil** —
`vite build` mati OOM di bawah 4 GB. Hanya bisa dipastikan lewat gerbang build
di CI. Karena itu pengerjaannya wajib lewat PR, tidak boleh push langsung.

### Dua library Excel

`xlsx` **dan** `exceljs` dua-duanya terpasang, fungsi tumpang tindih,
dua-duanya besar. `keuanganOwnerUtils.js` mengimpor `XLSX`. Buang salah satu
setelah memetakan semua pemanggilnya.

### Berkas raksasa

| Baris | Berkas |
|---|---|
| 5.410 | `src/pages/admin/bank-soal/ImportHasilScanPage.jsx` |
| 3.412 | `src/pages/teacher/modul/ManageQuiz.jsx` |
| 2.778 | `src/pages/student/StudentQuizView.jsx` |
| 2.727 | `src/pages/teacher/modul/AIGenerateQuiz.jsx` |
| 2.299 | `src/pages/teacher/modul/ManageMateri.jsx` |
| 2.273 | `src/pages/student/belajar/BelajarReader.jsx` |

`api/generateQuizFromTopic.js` 146 KB dalam satu berkas.

### Konten tercampur kode

21 berkas `IMPOR-*.json` (±1,3 MB) di root repo. Sebaiknya pindah ke folder
`konten/` — tapi **cek dulu** `scripts/ci-penjaga-konten.mjs` dan panel admin
impor, keduanya merujuk path root.

### `README.md` mulai basi

- Masih menulis "**Tidak ada CI.** Belum ada `.github/workflows/`" sebagai
  utang, padahal CI sudah ada dan hijau.
- Menyebut "**291 error ESLint** tersisa"; angka terukur hari ini **259**.
- Menyebut "91 uji"; `npm test` sekarang **184 uji** (7 suite).

Perbaiki saat menyentuh README untuk alasan lain, atau sekalian di Tahap 1.

### Tiga PR menganggur sejak September

#16 (docs, +132), #47 (`feat/ui-jodoh-samping`, +1168/−14), #59
(`feat/bing-bab1-2`, +1406). Semuanya **predates CI** — hanya punya check
Vercel, tidak pernah melewati gerbang baru. Perlu keputusan owner:
lanjutkan, rebase, atau tutup.

---

## Keamanan

Bukan wilayah berkas ini. Lihat:

- `docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md` — temuan teknis
- `docs/KEPUTUSAN-RISIKO-FIRESTORE.md` — risk acceptance sadar oleh owner + 3 pengawal
- `docs/RUNBOOK-KEAMANAN.md` — langkah eksekusi bertahap

Dua pengawal yang **belum tuntas** dan layak dicek lebih dulu daripada
pembersihan lint mana pun:

1. **Backup.** Per `KEPUTUSAN-RISIKO-FIRESTORE.md`, backup mingguan di GitHub
   Actions baru benar-benar jalan setelah `FIREBASE_SERVICE_ACCOUNT` diisi;
   sampai saat itu workflow **hijau tapi melewati backup dengan peringatan**.
   Karena Firestore terbuka untuk tulis/hapus, backup adalah satu-satunya yang
   membuat risk acceptance itu bukan taruhan eksistensial. Hijau yang
   sebenarnya kosong lebih berbahaya daripada merah.
2. **Hash password siswa.** Pengawal #2 menyatakan ini **WAJIB** dan di luar
   pagar risk acceptance, karena dampaknya keluar dari bimbel (password dipakai
   ulang di layanan lain) dan sebagian pemiliknya anak-anak.
