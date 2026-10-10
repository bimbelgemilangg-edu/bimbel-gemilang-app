# MODE UJI COBA (PILOT) — cara membangun fitur baru tanpa sampai ke siswa

**Dibuat:** 2026-10-10 · branch `fitur/infrastruktur-pilot` · basis `main` @ `ccd097c`
**Status:** **belum di-push, belum di-merge, belum di-deploy.** Mode coba dulu,
sesuai permintaan owner: *"kita masih akan mode coba dulu, bisa jadi belum push
vercel ready tapi kita coba, sampai menurutku final."*

---

## 0. Masalah yang dipecahkan dokumen ini

Dua fakta di repo ini yang membuat "coba dulu" tidak bisa dianggap remeh:

1. **PWA memakai `registerType: 'autoUpdate'`** (README, bagian PWA). Setiap
   merge ke `main` masuk ke HP siswa **tanpa mereka meminta**, dan tidak ada
   tombol "tarik kembali".
2. **Sebelum hari ini repo tidak punya sakelar fitur sama sekali.** Satu-satunya
   pengerem adalah proses (branch → PR → CI). Itu tidak bisa mengerem fitur yang
   memang perlu tayang setengah jadi untuk diuji orang tertentu.

Jadi yang dibangun di sini adalah **lantai**, bukan fitur: supaya fitur apa pun
yang datang sesudahnya bisa diuji tanpa mempertaruhkan HP siswa.

---

## 1. Yang dibangun di branch ini

| Berkas | Jenis | Isi |
|---|---|---|
| `src/utils/sakelarFitur.js` | **baru** | Logika keputusan murni: siapa boleh melihat fitur apa. **Default MENOLAK.** 19 test |
| `src/services/sakelarFiturService.js` | **baru** | Pembaca dari Firestore + cache TTL 5 menit (wajib, lihat §6) |
| `src/utils/cocokkanTargetPaket.js` | **baru** | Pencocokan `targetKelas`/`targetKategori` yang toleran terhadap array & string. 14 test |
| `src/firebase.js` | **diubah** | Konfigurasi boleh ditimpa `VITE_FIREBASE_*`, **fallback ke nilai sekarang** |
| `src/utils/mesinTryOutOtomatis.js` | **diubah** | Normalisasi bentuk target + 3 error lint warisan dibereskan |
| `src/pages/admin/bank-soal/JadwalTryOutOtomatisPage.jsx` | **diubah** | Normalisasi bentuk target saat menyimpan template |
| `src/pages/student/tryout/DaftarTryOutPage.jsx` | **diubah** | Pakai util bersama (perbaikan bug nyata, lihat §5) |
| `tests/cocokkanTargetPaket.test.mjs` | **baru** | 14 uji, terdaftar di `npm test` |
| `tests/sakelarFitur.test.mjs` | **baru** | 19 uji, terdaftar di `npm test` |
| `package.json` | **diubah** | 42 → **44 suite** di `npm test` |

Tidak ada rute baru, tidak ada komponen baru, tidak ada perubahan pada
`App.jsx`. **`scripts/ci-penjaga-rute.mjs` tidak terpengaruh.**

---

## 2. Cara menyalakan fitur untuk siswa uji

Konfigurasi hidup di Firestore: **`settings/global_config`**, field `fiturPilot`.

```js
fiturPilot: {
  rasionalisasiKampus: {
    aktif: true,
    mode: 'whitelist',                 // whitelist | kelas | semua
    daftarSiswaUji: ['GEM-UJI-001'],
    daftarKelasUji: [],
    catatan: 'Uji internal owner',
    diperbaruiOleh: 'owner',
    diperbaruiAt: <timestamp>,
  },
}
```

⚠️ **Belum ada panel admin untuk ini.** Hari ini field itu ditulis lewat
Firebase Console, atau lewat `bentukKonfigurasiFitur()` dari kode/skrip.
Panelnya adalah pekerjaan lanjutan (§8 butir 1) — sengaja tidak dibangun
sekarang supaya branch pertama ini kecil dan mudah diperiksa.

### Tiga mode, dari paling ketat

| Mode | Siapa yang melihat | Kapan dipakai |
|---|---|---|
| `whitelist` | Hanya `studentId` yang terdaftar | **Selalu mulai dari sini** |
| `kelas` | Semua siswa di `kelasSekolah` tertentu | Setelah whitelist lolos, mau uji di satu kelas sungguhan |
| `semua` | Semua orang | Hanya setelah owner memutuskan rilis |

### Aturan yang dijaga oleh test (jangan dilemahkan)

`tests/sakelarFitur.test.mjs` mengunci sifat-sifat ini. Kalau suatu hari ada
yang mengubah kode sampai salah satu test ini gagal, **itu berarti ada jalan
bagi fitur yang belum selesai untuk muncul di HP siswa sungguhan**:

- konfigurasi tidak ada / rusak / bukan objek → **MATI**
- `aktif` bukan `true` persis (termasuk `'true'`, `1`, `'ya'`) → **MATI**
- `mode` tak dikenal (`'persen'`, `'all'`, `1`, `{}`) → **MATI**, tidak menebak
- `mode` kosong → jatuh ke `whitelist` (paling ketat), **bukan** ke `semua`
- daftar uji **kosong** → **MATI** walau `aktif: true`. ← jebakan paling mungkin:
  admin menyalakan fitur lalu lupa mengisi daftar. Kalau ini lolos, fitur tayang
  ke semua siswa.
- `studentId`/`kelasSekolah` siswa tidak diketahui → **MATI**
- siswa sungguhan tidak pernah lolos selama mode masih uji

### Cara memanggil dari halaman

```jsx
import { fiturAktifUntuk } from '../../services/sakelarFiturService';

const [boleh, setBoleh] = useState(false);
useEffect(() => {
  let hidup = true;
  (async () => {
    const r = await fiturAktifUntuk('rasionalisasiKampus', {
      studentId: localStorage.getItem('studentId'),
      kelasSekolah: profil?.kelasSekolah,
    });
    if (hidup) setBoleh(r.aktif);   // r.alasan tersedia untuk layar "terkunci"
  })();
  return () => { hidup = false; };
}, [profil?.kelasSekolah]);
```

**Dua kewajiban saat memasang di halaman baru** (mengikuti prinsip README
tentang hak akses kasir: *"menu sidebar disembunyikan DAN rutenya dikunci —
keduanya, bukan salah satu"*):

1. Sembunyikan menunya di `SidebarSiswa.jsx` bila `boleh === false`.
2. **Kunci juga rutenya** — jangan cuma menyembunyikan tombol. Insiden
   `GuruPantauTryOut` (2026-10-05) adalah kebalikannya: rute lupa didaftarkan
   sehingga fitur mati total. Di sini risikonya fitur hidup tanpa seharusnya.

---

## 3. Cara membuat akun siswa uji

Lewat **Admin → Siswa → Tambah Siswa**. Yang penting:

| Field | Isi | Kenapa |
|---|---|---|
| Nama | `UJI COBA — JANGAN DINILAI` | supaya tidak nyasar ke leaderboard, ranking, rapor, atau rekap honor |
| `kelasSekolah` | **`12 UJI`** | kelas yang tidak dipakai siswa asli → jadi penanda mode `kelas` |
| `kategori` | `Reguler` | **jangan bikin nilai baru** — lihat peringatan di bawah |
| `jenjang` | `SMA` | |
| `status` | `Aktif`, `isBlocked` = tidak | kalau tidak, `GateAksesSiswa.jsx` mengunci semua fitur belajar |
| `enrolledSubjects` | `semua` | `cocokkanAksesMapel()` **memblokir semua** bila daftar ini kosong |

⚠️ **Jangan pakai `kategori` sebagai penanda pilot.** `kategori` hanya bernilai
`Reguler` / `English` dan dipakai di banyak tempat yang tidak berhubungan:
`StudentFinance.jsx`, `StudentAttendance.jsx`, `StudentList.jsx` (badge &
ekspor), `AddStudent.jsx`/`EditStudent.jsx` (menghitung `jenjang` dan paket
harga). Mengganti `kategori` siswa uji jadi `Pilot` akan memecah logika
keuangan dan absensi. **`kelasSekolah` adalah penanda yang aman.**

Buat **3 akun**: satu untuk whitelist, satu untuk memastikan siswa biasa
*tidak* melihat fitur, dan satu cadangan kalau yang pertama rusak.

---

## 4. Sandbox data: proyek Firebase kedua

`src/firebase.js` sekarang membaca `VITE_FIREBASE_*` dengan **fallback ke nilai
produksi yang sekarang**. Artinya:

- **Tidak ada env diisi → perilaku persis seperti sebelumnya.** Build produksi
  hari ini tidak berubah sama sekali. Ini yang membuat perubahan ini aman
  di-merge duluan.
- **Env diisi → aplikasi menunjuk proyek lain.**

`.env.example` sudah lama menyarankan persis ini:

> *"Kalau nanti perlu lingkungan terpisah (development / staging / production),
> pindahkan blok firebaseConfig di src/firebase.js ke variabel VITE_FIREBASE_*
> dan daftarkan di sini."*

### Langkah membuat sandbox

1. Firebase Console → tambah project, mis. `gemilangsystem-dev`.
2. Aktifkan Firestore + Storage + Authentication (email/password).
3. Ambil konfigurasi web-nya, isi ke `.env.local` (sudah di-`.gitignore`):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=gemilangsystem-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gemilangsystem-dev
VITE_FIREBASE_STORAGE_BUCKET=gemilangsystem-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

4. `npm run dev` → periksa **baris pertama console browser**. Sekarang ada
   penanda yang dicetak:

```
[Gemilang] Firebase projectId: gemilangsystem-dev — lingkungan: dev/staging (BUKAN produksi)
```

   Kalau yang tercetak `produksi`, berarti env tidak kebaca — **berhenti dan
   perbaiki dulu**, jangan lanjut menguji fitur yang menulis data.
5. Isi konten dari `IMPOR-*.json` yang sudah ada di root repo (21 berkas).
   Data siswa: bikin palsu, jangan salin dari produksi.

### ⚠️ Preview Vercel BUKAN sandbox

Preview URL dari sebuah branch **tetap menunjuk Firestore produksi** selama
`VITE_FIREBASE_*` tidak diisi di environment preview Vercel. Jadi:

| Mau menguji | Cukup |
|---|---|
| Tampilan / alur, **tidak menulis** data | branch + preview Vercel |
| Fitur yang **menulis** ke koleksi baru/berubah bentuk | **wajib** proyek Firebase dev |

---

## 5. ⚠️ Bug nyata yang ikut terperbaiki — BACA SEBELUM MERGE

Ini **bukan** bagian dari fitur pilot. Ini bug produksi yang ketemu saat audit,
dan kebetulan berada tepat di jalur yang dipakai mekanisme pilot.

**Gejalanya:** paket try out yang dibuat lewat **Admin → Bank Soal → Jadwal Try
Out Otomatis** berisiko **tidak pernah muncul** di daftar try out siswa — tanpa
error, tanpa jejak.

**Sebabnya:** field yang sama ditulis dalam dua bentuk berbeda.

```js
// penulis A — mesinTryOutOtomatis.js (jadwal otomatis): ARRAY
targetKelas: template.targetKelas || ['Semua'],

// penulis B — rakitTryOutTentor.js & TerbitkanTryOutPage.jsx: STRING
targetKelas: String(targetKelas || '').trim() || ...

// pembaca — DaftarTryOutPage.jsx: perbandingan === terhadap STRING
const cocokKelas = p.targetKelas === 'Semua' || p.targetKelas === siswa?.kelasSekolah;
```

`['Semua'] === 'Semua'` → **false**. Ini persis **"kelas D: identitas tidak
seragam"** yang sudah dipetakan repo sendiri di
`docs/PETA-SINKRONISASI-ADMIN-SISWA.md`.

**Yang dilakukan:**

1. Pembaca dipindah ke `cocokkanTargetPaket()` yang toleran terhadap **kedua**
   bentuk, jadi dokumen lama di Firestore tetap terbaca tanpa migrasi.
2. Penulis dinormalkan lewat `bentukKanonikTarget()` → dokumen baru selalu
   berbentuk string (atau array hanya bila memang multi-nilai).
3. 14 test invarian, termasuk: *"bentuk data tidak mengubah keputusan"* dan
   *"normalisasi tidak mengubah siapa yang boleh melihat"*.

**Konsekuensi yang perlu keputusan owner sebelum merge:**

> Setelah perbaikan ini, paket otomatis yang **sudah terlanjur berstatus
> `aktif`** dengan `targetKelas: ['Semua']` akan **MULAI TERLIHAT** oleh siswa —
> sebelumnya tidak. Kalau ada paket seperti itu yang memang sengaja tidak
> dipakai, **nonaktifkan dulu** sebelum merge.

Cara memeriksanya di Firebase Console → koleksi `tryout_paket` → cari dokumen
dengan `status == "aktif"` dan `targetKelas` bertipe **array**.

**Yang BELUM disentuh** (pola bug yang sama, tapi di koleksi `bimbel_modul` dan
penulisnya belum diverifikasi — jangan diperbaiki tanpa memeriksa penulisnya
dulu):

- `src/pages/student/StudentElearning.jsx:413`
- `src/pages/student/StudentModuleView.jsx:956`
- `src/pages/teacher/modul/ModulManager.jsx:420`

---

## 6. Aturan yang tidak boleh dilanggar fitur apa pun di atas lantai ini

Semuanya bekas luka yang sudah tercatat di repo, bukan nasihat umum:

1. **Jangan `getDocs` koleksi penuh di mount.** Proyek ini pernah kena
   **429 RESOURCE_EXHAUSTED** karena itu — lihat kepala `utils/keputusanMuat.js`.
   Lewat `perluSegar()` dengan TTL, atau `onSnapshot` bila memang perlu live.
   `sakelarFiturService.js` sudah mengikuti ini (TTL 5 menit + berbagi janji
   untuk panggilan berbarengan).
2. **Jangan bikin daftar status sendiri.** Pakai `utils/statusTryOutPaket.js`.
   Berkas itu mencatat **4 tempat yang pernah bocor** karena halaman punya
   saringan status masing-masing.
3. **Jangan definisikan ulang aturan akses.** Pakai `utils/aksesKontenSiswa.js`
   (jenjang/kelas/mapel), `utils/cocokkanTargetPaket.js` (target paket),
   `utils/skorSoalTryOut.js` (skor). Pola repo: satu berkas = satu-satunya
   sumber kebenaran, dipakai bareng oleh halaman siswa **dan** halaman audit admin.
4. **Gagal muat ≠ data kosong.** `kebijakanGagalMuat()` mempertahankan data lama
   + menampilkan pesan. Daftar kosong membuat pengguna menyimpulkan "datanya
   hilang" — itu kebohongan.
5. **Berkas yang disentuh wajib lint-bersih.** CI menegakkan ini. Sebelum
   menyentuh sebuah berkas, jalankan lint dulu; kalau sudah kotor, itu
   "ranjau CI" — bersihkan dulu atau hindari (lihat `AUDIT-REPO.md`).
6. **Sakelar fitur bukan keamanan.** Karena Rules Firestore produksi masih
   terbuka (`docs/KEPUTUSAN-RISIKO-FIRESTORE.md` — risk acceptance sadar owner),
   siswa yang iseng tetap bisa membaca koleksi apa pun lewat DevTools.
   Blueprint menuntut *"pemeriksaan izin di backend, bukan hanya menyembunyikan
   tombol"* — **itu belum terpenuhi di aplikasi ini**, dan tidak dipenuhi oleh
   sakelar ini. Jangan pernah memakainya sebagai pengganti otorisasi.

---

## 7. Yang sudah diverifikasi, dan yang BELUM

**Sudah dijalankan sungguhan di workspace ini:**

```
node tests/cocokkanTargetPaket.test.mjs   →  14 LULUS, 0 GAGAL
node tests/sakelarFitur.test.mjs          →  19 LULUS, 0 GAGAL
```

**Lint.** `node_modules` repo tidak terpasang di workspace ini (butuh RAM ≥ 4 GB
untuk build), jadi verifikasi memakai ESLint 9 yang dipasang terpisah dengan
konfigurasi **disamakan persis** dengan `eslint.config.js` repo untuk rule
`no-unused-vars` (`varsIgnorePattern: '^[A-Z_]'`, `argsIgnorePattern: '^_'`,
`caughtErrorsIgnorePattern: '^_'`). Hasil untuk 9 berkas yang disentuh/dibuat:

```
0 error
4 warning — semuanya `unused eslint-disable directive` yang SUDAH ADA di
            mesinTryOutOtomatis.js sebelum perubahan (dikonfirmasi dengan
            me-lint salinan berkas dari main)
```

Berkas yang **paling berisiko jadi ranjau CI** justru membaik:

| Berkas | Sebelum | Sesudah |
|---|---|---|
| `src/utils/mesinTryOutOtomatis.js` | **3 error** (ranjau CI) | **0 error** |
| `src/firebase.js` | 0 error | 0 error |
| `DaftarTryOutPage.jsx` | 0 error | 0 error |
| `JadwalTryOutOtomatisPage.jsx` | 0 error | 0 error |

**Bonus:** 3 error warisan itu dibereskan mengikuti pedoman `AUDIT-REPO.md`
Tahap 1 langkah 3 (*"sebelum menghapus, tanyakan: ini sampah, atau niat yang
belum terlaksana?"*):

- `catch (e)` tak dipakai → diganti `_e` + komentar **kenapa** exception ditelan
  (query pertama butuh index gabungan; fallback tanpa saringan lebih berguna
  daripada gagal total).
- `durasiMenit` di `hitungSlotMingguIni` → **NIAT YANG BELUM TERLAKSANA**, tidak
  dihapus. Ditandai `_durasiMenit` + `TODO` yang menjelaskan bahwa `waktuTutup`
  selalu dihardcode 23:59 berapa pun durasinya. Mengubahnya = **perubahan
  perilaku pada try out yang sudah berjalan** = keputusan owner.
- `kekurangan` dihitung lalu dibuang → sekarang **dikembalikan** di hasil
  `siapkanDrafDariTemplate`. Field tambahan tidak mengubah perilaku pemanggil
  yang ada (mereka membaca `ok`/`id`/`judul`/`totalSoal`), tapi membuat admin
  bisa tahu "30 soal diminta, 22 didapat". `TODO`: tampilkan di log hasil.

**BELUM diverifikasi — dan aku tidak akan mengklaim sebaliknya:**

- ❌ `npm test` penuh (44 suite). Hanya 2 suite baru yang dijalankan; sisanya
  butuh `npm ci` di repo. **Wajib dijalankan sebelum merge.**
- ❌ `npm run build`. Butuh RAM ≥ 4 GB. Hanya bisa dipastikan lewat gerbang
  build di CI.
- ❌ `node scripts/ci-penjaga-konten.mjs` dan `ci-penjaga-rute.mjs`. Tidak
  dijalankan (butuh dependensi). Penjaga rute seharusnya tidak terpengaruh
  karena `App.jsx` tidak disentuh dan tidak ada tujuan navigasi baru — tapi
  **itu penalaran, bukan hasil eksekusi.**
- ❌ Perilaku nyata di browser. Tidak ada aplikasi yang dijalankan.
- ❌ Isi Firestore produksi. **Aku tidak punya akses baca** — semua pernyataan
  tentang bentuk data di atas berasal dari membaca kode penulis/pembacanya.

---

## 8. Sisa pekerjaan Tahap 1 (belum dikerjakan)

1. **Panel admin sakelar fitur** di `Pengaturan` — supaya owner tidak perlu
   membuka Firebase Console. Wajib: hanya Owner & Manajer (mengikuti pola
   `AdminUsers.jsx`), pakai `bentukKonfigurasiFitur()`, panggil
   `segarkanKonfigurasiPilot()` setelah menyimpan, dan **catat ke `audit_logs`**
   lewat `catatAudit()` (siapa menyalakan fitur apa untuk siapa).
2. **Pita peringatan lingkungan.** `LINGKUNGAN_FIREBASE` sudah diekspor dari
   `src/firebase.js` tapi belum dipakai UI. Tampilkan pita merah di sidebar
   bila nilainya bukan `produksi` — supaya tidak ada yang mengira sedang
   mengedit data sungguhan.
3. **Skrip seed** untuk proyek dev: isi `bank_soal` dari `IMPOR-*.json` +
   bikin akun siswa uji otomatis.
4. **Daftarkan `VITE_FIREBASE_*` di `.env.example`** (bagian catatannya sudah
   ada, variabelnya belum didaftarkan).
5. Tiga halaman di §5 yang masih memakai `===` terhadap `targetKelas`
   (`bimbel_modul`) — **periksa dulu penulisnya** sebelum disamakan.

---

## 9. Checklist sebelum branch ini di-push

```
[ ] PAT GitHub yang bocor di chat SUDAH DICABUT
[ ] npm ci && npm test          → 44 suite hijau
[ ] npm run lint                → berkas yang disentuh bersih
[ ] node scripts/ci-penjaga-konten.mjs
[ ] node scripts/ci-penjaga-rute.mjs
[ ] npm run build               → sukses (atau andalkan gerbang build CI)
[ ] Firebase Console: cek tryout_paket status 'aktif' dengan targetKelas ARRAY
    → nonaktifkan dulu yang tidak seharusnya terlihat siswa (§5)
[ ] Backup mingguan SUDAH benar-benar jalan (FIREBASE_SERVICE_ACCOUNT terisi)
    → tanpa ini, risk acceptance Firestore terbuka tidak punya jaring
[ ] Dibuka sebagai PR, BUKAN push langsung ke main
[ ] Diuji di preview URL / lokal dengan akun siswa uji SEBELUM merge
```

---

## 10. Tentang kredensial

Owner meminta token GitHub disimpan. **Tidak dilakukan, dan sebaiknya memang
tidak.** Alasannya:

- `scripts/ci-penjaga-konten.mjs` baris 114 punya pola penolak
  `/github_pat_[A-Za-z0-9_]{10,}/`. Menulis token itu ke berkas mana pun di
  repo membuat **CI merah dan PR ditolak** — penjaga itu ada karena insiden
  serupa pernah nyaris ter-commit (lihat komentarnya).
- `docs/SOP-KESELAMATAN-PERUBAHAN.md` janji #6: *"Secret tidak pernah masuk
  commit, termasuk 'sekadar untuk test'."*
- Repo ini **publik**: untuk membaca, token tidak diperlukan sama sekali.
  Audit ini berhasil clone tanpa token.
- Token yang sudah pernah ditempel di chat harus dianggap bocor, di mana pun
  "disimpan"-nya.

Yang tetap bisa dikerjakan tanpa token: semua kode, test, dokumen, commit, dan
branch di workspace ini. Yang butuh kredensial **hanya `git push`** — dan itu
bisa dilakukan owner dari mesin sendiri, atau lewat patch yang disiapkan di
sini.
