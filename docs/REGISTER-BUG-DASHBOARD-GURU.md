# REGISTER BUG — DASHBOARD GURU (`/guru/dashboard`)

**Disusun:** Selasa 3 November 2026, 08.20 WIB · **Diperbarui:** 3 November 2026
(v1.6.5 — 24 dari 26 temuan sudah diperbaiki, lihat bab 11) · **Item master list:** B3
**Pemicu:** owner lapor "dashboard guru banyak bug" + kuota baca Firestore masih
`429` sehingga item A1 (sapu masa aktif) belum bisa dijalankan → sesuai protokol,
kuota jebol dipakai untuk kerja yang **tidak butuh baca data**: audit kode.

**Berkas yang diaudit:** `src/pages/teacher/TeacherDashboard.jsx` (1.715 baris)
dibaca penuh, lalu disilang dengan penulis/pembaca datanya:
`ClassSession.jsx`, `TeacherAttendance.jsx`, `TeacherHistory.jsx`,
`LoginGuru.jsx`, `admin/schedule/SchedulePage.jsx`, `admin/portal-siswa/ManagePoster.jsx`,
`src/utils/notifications.js`, `src/utils/identitasGuru.js`, `src/utils/keputusanMuat.js`.

> **Sifat dokumen ini:** daftar + bukti + usulan. **Belum ada satu baris kode pun
> yang diubah.** Setiap perbaikan menunggu "mulai" dari owner per item, sesuai
> alur kerja yang sudah disepakati.

---

## 0. Cara membaca register ini

**Tingkat keparahan**

| Kode | Arti | Contoh gejala yang dilihat guru |
|---|---|---|
| **S1** | Fungsi mati total / buntu | Halaman muter terus, tombol tidak melakukan apa-apa |
| **S2** | Angka atau daftar **salah/menyesatkan** (tampak normal!) | Kehadiran 0%, total siswa kegedean, pengumuman hilang |
| **S3** | Boros kuota baca / bocor langganan | Kuota harian habis padahal guru cuma buka dasbor |
| **S4** | Aksesibilitas & wajah (masuk gerbang desain B1/E2) | Tulisan 9 px, kontras gagal, tombol tak bisa pakai keyboard |

**Status**

- `MENUNGGU KEPUTUSAN` — perlu jawaban owner dulu (lihat Register Lubang, bab 6).
- `SIAP EKSEKUSI` — perbaikannya satu jalan, tidak ada cabang keputusan.
- `PERLU CEK CONSOLE` — kebenarannya bergantung isi Firestore/indeks yang tidak
  bisa dibaca dari sandbox (kuota 429). Cara ceknya ada di bab 7.

---

## 1. Ringkasan (26 temuan)

| ID | Sev | Gejala singkat (bahasa sehari-hari) | Status v1.6.5 |
|---|---|---|---|
| B-01 | S1 | Dasbor muter selamanya ("Memuat dashboard...") kalau data guru tak punya nama | ✅ **SELESAI** |
| B-02 | S1 | Lonceng notifikasi mati total — selamanya "Tidak ada notifikasi" | 🟡 **SEBAGIAN** (kueri & field dibetulkan; pengirimnya masih keputusan D1) |
| B-03 | S1 | Tombol "Tandai semua" tidak melakukan apa-apa (tombol mati) | ✅ **SELESAI** |
| B-04 | S1 | Satu query gagal → semua kartu jadi 0 dan pengumuman lenyap, tanpa pesan | ✅ **SELESAI** |
| B-05 | S1 | Kehadiran % selalu 0 karena log dicari pakai ID yang berbeda dengan yang ditulis | ✅ **SELESAI** (jalur cepat butuh deploy indeks) |
| B-06 | S1 | Buntu kode absen: guru dituduh "token salah" padahal kode belum disetel | ✅ **SELESAI** |
| B-07 | S2 | "Total Siswa" = semua siswa yang pernah terjadwal, diberi label "Aktif" | ✅ **SELESAI** (jadi "Siswa Terjadwal" + periodenya) |
| B-08 | S2 | "Total Kelas" = semua jadwal sepanjang masa | ✅ **SELESAI** (jadi "Sesi 7 Hari Terakhir") |
| B-09 | S2 | Badge "+N" di kartu "Sesi Hari Ini" sebenarnya sesi 7 hari ke belakang | ✅ **SELESAI** |
| B-10 | S2 | Persen kehadiran dibagi roster hari ini, bukan roster saat kelas berlangsung | ✅ **SELESAI** (log baru menyimpan penyebutnya) |
| B-11 | S2 | Pengumuman guru hilang kalau 5 pengumuman terbaru kebetulan untuk siswa | ✅ **SELESAI** |
| B-12 | S2 | Aplikasi terbuka lewat tengah malam → "Hari Ini" masih menampilkan kemarin | ✅ **SELESAI** |
| B-13 | S2 | Jadwal muncul di halaman Absensi tapi hilang di Dasbor (dua kunci pencarian) | ✅ **SELESAI** (satu aturan bersama) |
| B-14 | S3 | Setiap buka dasbor menarik seluruh riwayat jadwal guru | ✅ **SELESAI** (jendela 15 hari, biaya datar) |
| B-15 | S3 | Bocor: pindah halaman cepat → pendengar realtime hidup selamanya | ✅ **SELESAI** |
| B-16 | S3 | Bocor kedua di halaman Absensi: pendengar cadangan tak pernah dimatikan | ✅ **SELESAI** |
| B-17 | S3 | Riwayat guru menyapu `teacher_logs` tanpa `limit` (2 query) | ✅ **SELESAI** |
| B-18 | S4 | Avatar profil = `<div onClick>` → tak bisa diakses keyboard | ✅ **SELESAI** |
| B-19 | S4 | Sasaran sentuh ≈34 px (aturan: ≥44 px) | ⏳ **DITABUNG ke E2** (perubahan ukuran menggeser tata letak header) |
| B-20 | S4 | Kontras `#94a3b8` = 2,56:1 (syarat 4,5:1) | ✅ **SELESAI** (29 tempat → `#4B5563` 7,5:1) |
| B-21 | S4 | Teks 8–10 px (aturan: tidak boleh di bawah 11 px) | ✅ **SELESAI** (40 tempat → 11 px) |
| B-22 | S4 | Kegagalan ditelan `console.error` → melanggar policy error & kuota | ✅ **SELESAI** |
| B-23 | S4 | Salam dihitung sekali saat buka | ✅ **SELESAI** |
| B-24 | S4 | Tiga nomor versi berbeda (v2.0 / Versi 2.0 / 3.0.0) | ✅ **SELESAI** (label versi dicabut dari UI) |
| **B-25** | **S1** | **Logout guru tidak menutup sesi: `/guru/*` tetap terbuka sesudah keluar** | ✅ **SELESAI** (baru, lihat bab 5A) |
| **B-26** | **S1** | **Angka gaji guru bocor ke browser guru (`stripNominal` salah nama field)** | ✅ **SELESAI** (baru, lihat bab 5A) |

**Yang paling mahal:** B-26 (gaji bocor ke perangkat guru), B-25 (sesi tidak
tertutup sesudah keluar), B-04 + B-05 (guru melihat angka 0 dan menyimpulkan
"datanya hilang"), B-06 (kelas tidak bisa dibuka), B-14 (kuota).

---

## 2. Detail S1 — fungsi mati / buntu

### B-01 · Dasbor muter selamanya bila data guru tak punya `nama`
> **Status v1.6.5:** ✅ SELESAI — keluar dini kini menurunkan `loading`/`refreshing`; ada panel "Data profil Anda belum lengkap" + tombol Muat ulang / Keluar-masuk lagi.

- **Gejala:** layar berhenti di spinner "Memuat dashboard..." — tidak pernah
  selesai, tidak ada pesan error. Tombol refresh juga berputar terus.
- **Penyebab:** `TeacherDashboard.jsx:267` — `if (!teacher?.nama) return;`
  keluar **sebelum** `setLoading(true)`/`finally { setLoading(false) }`.
  State `loading` lahir `true`, jadi tidak ada yang pernah menurunkannya.
  Data guru diambil dari `localStorage.teacherData` bila query `teachers`
  gagal (`:246-257`); cache lama tanpa field `nama` = spinner abadi.
  Varian kedua: `handleRefresh` (`:438-441`) menyetel `refreshing = true`
  lalu berhenti bila `teacher` null → ikon refresh berputar selamanya.
- **Usulan:** jalur keluar dini tetap menurunkan `loading`/`refreshing` dan
  menampilkan keadaan jujur ("Data profil belum lengkap — muat ulang / hubungi
  admin") lewat `kebijakanGagalMuat()`.
- **Lubang:** tidak ada. Perilaku ini jelas salah di semua tafsir.

### B-02 · Lonceng notifikasi mati total (tiga lapis penyebab)
> **Status v1.6.5:** 🟡 SEBAGIAN — sisi pembaca dibetulkan (satu kueri `recipientId in identitas`, `recipientType` guru/teacher, bendera `isRead`); pengirim `notifyTeachers()` masih nol pemanggil → menunggu keputusan D1.

- **Gejala:** panel notifikasi selalu "Tidak ada notifikasi". Titik merah
  tidak pernah muncul, apa pun yang admin lakukan.
- **Bukti, lapis demi lapis:**
  1. **Tidak ada pengirim.** `notifyTeachers()` didefinisikan di
     `src/utils/notifications.js:130` — **nol pemanggil** di seluruh repo
     (grep: hanya definisinya). Bandingkan: notifikasi siswa dipakai di ±10 tempat.
     Artinya memang tidak pernah ada notifikasi guru yang dibuat.
  2. **Kalaupun ada, kueri salah nama field.** Dasbor mencari
     `userType == 'teacher'` dan `recipientType == 'teacher'`
     (`TeacherDashboard.jsx:372-385`), sedangkan penulis menyimpan
     `recipientType: 'guru'` (`notifications.js:149`) dan **tidak pernah**
     menulis `userId`/`userType` sama sekali.
  3. **Bendera baca salah nama.** Dasbor menghitung belum-dibaca dari
     `n.read` (`:581-582`), penulis menyimpan `isRead` (`notifications.js:151`)
     → semua dianggap belum dibaca, badge tak pernah bisa bersih.
- **Usulan:** (a) putuskan dulu apakah notifikasi guru mau dihidupkan (D1);
  bila ya, satu sumber kebenaran field di `notifications.js` + kueri mengikuti
  field itu, dan panggil `notifyTeachers()` dari peristiwa nyata
  (periode laporan belajar dibuka, try out ditugaskan, jadwal berubah).
- **Lubang:** menghidupkan notifikasi = menulis dokumen baru per peristiwa
  (kuota tulis). Perlu diputuskan peristiwa mana yang boleh mengirim.

### B-03 · Tombol "Tandai semua" adalah tombol mati
> **Status v1.6.5:** ✅ SELESAI — tombol benar-benar menulis `isRead` lewat batch write, menampilkan jumlahnya, dan nonaktif bila tak ada yang belum dibaca.

- **Gejala:** diklik, tidak terjadi apa-apa. Tidak ada error.
- **Bukti:** `TeacherDashboard.jsx:589` — `<button style={styles.notifMarkAll}>`
  tanpa `onClick`.
- **Usulan:** bila B-02 dihidupkan → tandai `isRead: true` (batch write,
  dibatasi jumlah dokumen). Bila B-02 tidak dihidupkan → **hapus tombolnya**
  (aturan owner: jangan ada tombol/menu yang tidak berfungsi).

### B-04 · Satu query gagal → seluruh dasbor jadi 0, diam-diam
> **Status v1.6.5:** ✅ SELESAI — `try` dipecah per blok data; kegagalan satu blok tidak menular; banner jujur per blok + tombol "Coba lagi"; indeks `teacher_logs` dideklarasikan.

- **Gejala:** semua kartu statistik 0 (sesi hari ini 0, siswa 0, kehadiran 0%),
  blok Pengumuman hilang, lonceng kosong — padahal jadwalnya ada. Guru/admin
  menyimpulkan "datanya hilang".
- **Penyebab:** seluruh `fetchData` dibungkus **satu** `try` besar
  (`:270-398`) dengan `catch` yang cuma `console.error`. Urutan di dalamnya:
  jadwal → kode harian → **`teacher_logs` (`:324`)** → `setStats` (`:352`) →
  pengumuman (`:361`) → notifikasi (`:372`). Kegagalan di `teacher_logs`
  membuat **semua yang di bawahnya tidak pernah jalan**.
- **Kenapa `teacher_logs` bisa gagal:** query-nya
  `where('teacherId','==',X) + orderBy('tanggal','desc') + limit(30)` —
  kombinasi "sama dengan" + "urut field lain" **wajib punya indeks komposit**
  di Firestore. Repo ini punya `firebase/firestore.indexes.json` (6 indeks:
  tryout_sesi, jawaban_kuis, attendance ×2, siswa_soal_progress, raport_final)
  tetapi **tidak ada satu pun untuk `teacher_logs`** — jadi indeksnya hanya ada
  bila dulu seseorang mengklik link di error console. Kalau belum pernah →
  query ini selalu gagal → gejala di atas.
  *(Koreksi 3 Nov 2026: draf pertama dokumen ini menulis "repo tidak punya
  firestore.indexes.json" — salah, berkasnya ada di folder `firebase/`.)*
- **Usulan:** (1) pecah `try` per blok data agar kegagalan satu blok tidak
  menular; (2) tampilkan banner jujur + tombol "Coba lagi" sesuai
  `docs/POLICY-ERROR-DAN-KUOTA.md` (dasbor ini **belum** mengimpor
  `src/utils/keputusanMuat.js`, padahal 11 berkas lain sudah);
  (3) deklarasikan indeks di `firestore.indexes.json` supaya bisa dipasang
  ulang dari repo, tidak bergantung klik manual.
- **Lubang:** menambah `firestore.indexes.json` = perubahan infra (deploy
  `firebase deploy --only firestore:indexes`). Perlu izin owner.

### B-05 · Kehadiran % kemungkinan selalu 0 (identitas guru ganda)
> **Status v1.6.5:** ✅ SELESAI — log dicari dengan SEMUA identitas guru (`where teacherId in [...]` lewat `daftarIdGuru`), nama tidak lagi jadi kunci.

- **Gejala:** kartu "Kehadiran" dan progress bar di banner tetap 0% walau guru
  rajin menyimpan kelas.
- **Penyebab:** dasbor mencari log dengan
  `teacherId = teacher.guruId || teacher.id || nama` (`:278`), yaitu
  **kode manusia** `GURU-005` bila field itu ada. Padahal yang **menulis** log
  memakai `teacherId: teacher.id` = **docId Firestore**
  (`ClassSession.jsx:244`), dan `LoginGuru.jsx:27` menyimpan
  `{ id: doc.id, ...data }`. Dua identitas berbeda → 0 baris ketemu →
  `attendanceRate = 0`.
- **Pembanding yang menguatkan:** `TeacherHistory.jsx:70-89` sudah menyiapkan
  **fallback** pencarian kedua berdasarkan `namaGuru` — tanda gejala ini pernah
  terasa dan ditambal di satu halaman saja, tidak di dasbor. (Fallback nama itu
  sendiri lubang: dua guru bernama sama akan saling melihat riwayat — persis
  yang diperingatkan `src/utils/identitasGuru.js`.)
- **Usulan:** pakai `daftarIdGuru()` (sudah ada, sudah teruji) → query
  `where('teacherId','in', semuaId)`; **stop** memakai nama sebagai identitas.
  Data lama yang terlanjur ditulis dengan docId tetap terbaca karena docId ikut
  dalam daftar.
- **Lubang:** bila sebagian log lama ditulis dengan identitas ketiga, tetap ada
  sisa yang tak terbaca → itu pekerjaan A2/reparasi, bukan tambal dasbor.
  **Perlu cek Console** (bab 7) untuk memastikan berapa ragam `teacherId`
  yang benar-benar ada di `teacher_logs`.

### B-06 · Buntu kode absen: guru dituduh "token salah" padahal kode belum disetel
> **Status v1.6.5:** ✅ SELESAI — empat keadaan kode (siap / belum dibuat admin / kosong / gagal dibaca) + "Coba lagi" yang membaca satu dokumen; pesan tidak pernah menuduh guru atas kegagalan sistem.

- **Gejala:** klik "Mulai Kelas" → isi kode apa pun → "⚠️ Token absensi salah!
  Silakan periksa kembali atau hubungi admin." Berulang, tanpa jalan keluar.
  Kelas hari itu tidak bisa dibuka dari dasbor.
- **Penyebab:** `dailyCode` diisi dari `settings/daily_code_<tanggal lokal>`
  (`:314`); bila dokumen belum dibuat admin, `dailyCode = ''`. Pembandingnya
  `inputToken.trim().toUpperCase() !== dailyCode.trim().toUpperCase()` (`:461`)
  → selalu tidak sama, dan pesannya menyalahkan guru. Kegagalan baca (mis. 429)
  juga berakhir di `''` (`:320-321`) → **kuota habis tampak seperti "kode salah"**.
  Kode hanya bisa dibuat manual oleh admin (`SchedulePage.jsx:740-756`); tidak
  ada pembangkit otomatis.
- **Usulan:** bedakan tiga keadaan dengan pesan berbeda —
  (a) kode belum disetel admin → "Kode hari ini belum dibuat admin" + tombol
  "Coba lagi"; (b) gagal baca → pesan kuota sesuai policy; (c) kode salah →
  pesan sekarang. Jangan pernah menyamakan "tidak tahu" dengan "salah".
- **Lubang (D2):** apakah mau ada **kode cadangan otomatis** (mis. dibuat sistem
  tiap pagi) atau tetap manual 100%? Ini keputusan kebijakan, bukan teknis.

---

## 3. Detail S2 — angka & daftar yang menyesatkan

### B-07 · "Total Siswa" bukan siswa aktif
> **Status v1.6.5:** ✅ SELESAI — kartu jadi "Siswa Terjadwal" dari jendela 15 hari, dengan rentang tanggalnya ditulis di kartu.

`allStudents` dikumpulkan dari **seluruh** jadwal milik guru (`:303-310`),
termasuk kelas setahun lalu dan kelas yang sudah selesai, lalu ditampilkan
dengan badge "Aktif" (`:686-688`). Siswa yang sudah berhenti tetap terhitung.
→ Perlu definisi (D3).

### B-08 · "Total Kelas" = semua jadwal sepanjang masa
> **Status v1.6.5:** ✅ SELESAI — kartu jadi "Sesi 7 Hari Terakhir" + sub-angka "N selesai".

`totalClasses: allSchedules.length` (`:357`) dan
`completedClasses: status === 'completed'` (`:358`). Angka ini hanya naik,
tidak pernah menggambarkan beban sekarang. → Perlu definisi (D3).

### B-09 · Badge "+N" di kartu "Sesi Hari Ini" bukan tren
> **Status v1.6.5:** ✅ SELESAI — badge "+N" diganti jumlah agenda 7 hari ke depan pada kartu yang tepat.

Yang ditampilkan adalah `stats.weekSessions` = jumlah sesi **7 hari ke
belakang termasuk hari ini** (`:299-301`, ditampilkan `:675`) dengan ikon panah
naik dan tanda "+". Guru membacanya sebagai "hari ini bertambah N".
→ Usulan: ganti jadi "N sesi 7 hari terakhir" tanpa tanda "+", atau hapus.

### B-10 · Persen kehadiran dibagi roster hari ini, bukan roster saat itu
> **Status v1.6.5:** ✅ SELESAI — log baru menyimpan `siswaTotal`; log lama tanpa penyebut ditandai `perkiraan`; tanpa bukti → tidak dihitung dan persen jadi "—".

Pembilang = `l.siswaHadir` dari log historis; penyebut = `s.students.length`
dari dokumen jadwal **versi sekarang** (`:339-349`). Bila roster sebuah jadwal
ditambah siswa setelah kelas berlangsung, persen turun walau tidak ada yang
bolos. (Sudah tercatat sebagai "belum diperbaiki" di v1.6.3; kini diberi ID.)
→ Usulan: simpan `siswaTotal` **di dalam log** saat kelas ditutup, lalu
`Σ siswaHadir / Σ siswaTotal` dari log saja. Perlu keputusan apakah log lama
turut direparasi (D4).

### B-11 · Pengumuman guru hilang karena disaring **setelah** dibatasi 5
> **Status v1.6.5:** ✅ SELESAI — 20 dokumen terbaru ditarik, baru disaring portal → 3 ditampilkan (tanpa indeks komposit).

Query mengambil 5 dokumen terbaru dari `student_contents` **tanpa** filter
portal (`:361-367`), baru disaring di klien untuk `Guru`/`Semua`/kosong
(`:369`). Bila lima kiriman terakhir admin ditujukan ke portal Siswa,
guru melihat **nol** pengumuman walau ada pengumuman guru di urutan 6-10.
→ Usulan: filter portal di query (`where('targetPortal','in',['Guru','Semua'])`)
lalu `limit(5)`.
**Lubang kecil:** dokumen lama tanpa field `targetPortal` tidak akan ikut
tertangkap `in` → perlu diputuskan: migrasi field, atau terima bahwa kiriman
lama tanpa portal tidak tampil di dasbor guru (tetap tampil di tempat lain).

### B-12 · "Hari Ini" membeku pada tanggal saat halaman dibuka
> **Status v1.6.5:** ✅ SELESAI — tanggal bisnis & jendela dihitung ulang saat `visibilitychange`/`focus`; tanpa polling.

`todayStr` dihitung sekali di `init()` (`:412`) lalu dipakai sebagai filter
pendengar realtime (`:413-418`). Aplikasi yang dibiarkan terbuka melewati
tengah malam WIB tetap menampilkan jadwal **kemarin** sampai guru memuat ulang.
→ Usulan: hitung ulang tanggal saat pendengar dipasang ulang (mis. penanda
tanggal berubah / app kembali terlihat), tetap dengan `tanggalLokalStr()`.

### B-13 · Otak terbelah: dasbor mencari jadwal pakai **nama**, halaman absensi pakai **ID**
> **Status v1.6.5:** ✅ SELESAI — dasbor dan halaman absensi memakai aturan identitas yang sama dari `utils/identitasJadwal` (ID menang; nama hanya untuk data warisan).

- Dasbor: `where('teacherName','==', teacher.nama.trim())` (`:280-283`).
- Absensi: `where('teacherId','==', guruId||id)` lalu fallback
  `where('teacherName','==', guru.nama)` (`TeacherAttendance.jsx:101-137`).
- Penulis jadwal menyimpan keduanya: `teacherId: teacher.guruId || teacher.id`
  dan `teacherName: teacher.nama` (`SchedulePage.jsx:435-436`), tetapi ada jalur
  warisan `teacherName: item.teacherName || item.booker || ""` (`:481`) yang
  bisa menghasilkan `teacherId` kosong.
- **Akibat nyata:** satu spasi beda, typo, nama yang pernah diperbaiki admin,
  atau jadwal warisan `booker` → kelas **muncul di Absensi tapi hilang di
  Dasbor** (atau sebaliknya). Ini kandidat kuat di balik keluhan "jadwal saya
  tidak muncul".
→ Usulan: satu fungsi identitas bersama (`daftarIdGuru()`), jadwal dicari
dengan `teacherId in [docId, guruId]` **atau** nama sebagai cadangan terakhir —
dan kedua halaman memakai fungsi yang **sama**. (D5)

---

## 4. Detail S3 — kuota & kebocoran

### B-14 · Setiap buka dasbor menarik seluruh riwayat jadwal guru
> **Status v1.6.5:** ✅ SELESAI — satu langganan jendela −7..+7 hari menggantikan sapuan seluruh riwayat + langganan harian terpisah; biaya jadi datar.

`qJadwal` hanya memfilter `teacherName`, **tanpa rentang tanggal dan tanpa
`limit`** (`:280-284`). Semua yang dibutuhkan layar sebenarnya cuma: hari ini,
7 hari ke depan, 7 hari ke belakang. Untuk guru setahun mengajar, satu kali buka
dasbor = ratusan dokumen; dikali jumlah guru, dikali setiap refresh, dikali
pendengar realtime. Inilah **pembakar kuota terbesar yang tersisa di sisi guru**
setelah `laporan_belajar` dipadamkan di v1.6.2 — dan terkait langsung dengan
item A4 (verifikasi penurunan burn).
→ Usulan: `where('teacherName','==',X) + where('dateStr','>=',−7 hari) +
where('dateStr','<=',+7 hari)` (butuh indeks komposit → bab 7), atau lebih baik
lagi setelah B-13: filter berbasis `teacherId`.
**Lubang:** kartu "Total Kelas"/"Total Siswa" (B-07/B-08) selama ini mendapat
angka dari sapuan penuh itu. Bila sapuan dipersempit, definisi kedua kartu
**wajib** diputuskan lebih dulu (D3) — kalau tidak, angkanya berubah diam-diam.

### B-15 · Pendengar realtime bocor bila guru pindah halaman cepat
> **Status v1.6.5:** ✅ SELESAI — effect mengembalikan fungsi `unsubscribe` secara langsung — tidak ada lagi variabel yang diisi async.

`let unsubscribe = null` (`:403`) diisi **di dalam** `init()` yang async
(`:419`). Cleanup effect hanya `if (unsubscribe) unsubscribe()` (`:431-434`).
Bila komponen dilepas sebelum `init()` selesai (guru langsung klik menu lain,
atau jaringan lambat), cleanup melihat `null` → **langganan tetap hidup**
selamanya, terus mengirim snapshot & membaca dokumen.
→ Usulan: simpan langganan lewat `useRef` dan bersihkan di cleanup, atau
batalkan `init` dengan token + tutup langganan bila sudah `cancelled`.

### B-16 · Kebocoran kedua di halaman Absensi guru
> **Status v1.6.5:** ✅ SELESAI — kueri cadangan berdasarkan nama dihapus; satu langganan dengan cleanup yang benar.

Di dalam callback `onSnapshot` ada `return () => unsubFallback()`
(`TeacherAttendance.jsx:137`) — nilai kembalian dari callback **pendengar**
tidak dipakai React; hanya kembalian dari callback **effect** yang dipakai.
Jadi saat jalur cadangan (berdasarkan nama) aktif, langganan cadangan itu
**tidak pernah dimatikan**, dan tiap ganti tanggal bertambah satu lagi.
→ Usulan: simpan kedua `unsub` di ref, bersihkan keduanya di cleanup effect.

### B-17 · Riwayat guru menyapu `teacher_logs` tanpa batas
> **Status v1.6.5:** ✅ SELESAI — log riwayat dibatasi (maks 200) dan dibaca lewat service bersama; fallback nama hanya bila identitas menghasilkan nol.

`TeacherHistory.jsx:70-89` dan `:103-110`: query `orderBy('tanggal','desc')`
**tanpa `limit`**, dan bila kosong diulang lagi dengan fallback nama → dua
sapuan penuh koleksi log. Semakin lama bimbel berjalan, semakin mahal halaman
ini. → Usulan: `limit` + paginasi "muat lebih lama", dan identitas tunggal
(tidak perlu fallback nama) setelah B-05 dibereskan.

---

## 5. Detail S4 — aksesibilitas & wajah (masuk gerbang desain B1 / rombak E2)

Semua acuan aturan: `docs/SISTEM-DESAIN-GEMILANG.md`.

| ID | Temuan | Bukti | Aturan yang dilanggar |
|---|---|---|---|
| B-18 | Avatar profil berupa `<div onClick>` — tidak bisa difokus, tidak ada `role`/`aria-label` | `:614` | "Fokus keyboard terlihat"; kontrol wajib elemen interaktif |
| B-19 | Tombol lonceng 34×34 px, refresh 34×34 px, logout ≈32×28 px (padding 6-8 px + ikon 16-18 px) | `styles.notifBtn :1135-1146`, `refreshBtn :1210-1216`, `logoutBtn :1236-1242` | Sasaran sentuh ≥44×44 px |
| B-20 | `#94a3b8` di atas putih = **2,56:1** — dipakai di `statLabel`, `loadingText`, `notifEmpty`, `notifTime`, `emptyState`, `scheduleTimeEnd`, `studentMore`, dll. (12 tempat; di atas `#f1f5f9` seperti `headerVersion` malah 2,31:1) | `:1111, 1127, 1185, 1209, 1241, 1326, 1330, 1388, 1407, 1465, 1479` | Kontras teks ≥4,5:1 (token sudah menyediakan `teks.sekunder #4B5563` = 7,5:1) |
| B-21 | Ukuran huruf 8-10 px (`headerVersion` 8 px, `notifTime` 9 px, `studentMore` 9 px, `statLabel` 10 px, `scheduleTimeEnd` 10 px) | `:1125, 1209, 1326, 1407, 1465` | "Tidak ada teks di bawah 11 px" |
| B-22 | Kegagalan muat ditelan (`catch { /* tampilkan kosong */ }`, `catch(() => ({docs:[]}))`, `catch { setDailyCode('') }`) tanpa banner & tanpa "Coba lagi" | `:106, 321, 378, 384, 393` | `docs/POLICY-ERROR-DAN-KUOTA.md` aturan 1 & 3 |
| B-23 | Salam dihitung sekali saat mount | `:150-156` | Kejujuran tampilan (minor) |
| B-24 | Header "v2.0" (`:571`) & footer "Versi 2.0" (`:992`) vs `package.json` `3.0.0` — tiga nomor berbeda, semuanya ditulis tangan | — | Satu sumber kebenaran |

**Catatan wajah:** seluruh warna di halaman ini hardcoded (`#3b82f6`,
`#10b981`, `#f59e0b`, `#8b5cf6`, `#e11d48`, `#dc2626`, `#652D90`, latar
`#f8fafc`), sedangkan token resmi memakai latar krem `#FAF6F0`. Artinya dasbor
guru **belum satu bahasa** dengan prototipe fase 0 (`prototipe/guru-dasbor.html`).
Perbaikannya bukan tambal per warna, melainkan bagian dari rombak **E2**.

---

## 5A. Dua temuan baru saat eksekusi (3 Nov 2026, v1.6.5)

Keduanya ditemukan **ketika perbaikan sedang dikerjakan**, bukan dari audit awal
— bukti bahwa register ini harus diperbarui tiap batch, bukan sekali jadi.

### B-25 · S1 · Logout guru tidak menutup sesi (akses tetap terbuka)
> **Status v1.6.5:** ✅ SELESAI — `utils/sesiLoginGuru.js` dipakai penjaga rute DAN kedua tombol Keluar; dikunci 8 uji termasuk reproduksi bug lama.
- **Gejala:** guru menekan "Keluar", diarahkan ke halaman login — tetapi bila ia
  (atau orang lain di komputer bersama) mengetik `/guru/laporan-belajar` atau
  `/guru/history`, halaman **tetap terbuka**.
- **Penyebab:** `LoginGuru.jsx:30-33` menulis `isGuruLoggedIn='true'`, `role='guru'`,
  `teacherData`, `guruInfo`. Penjaga rute `GuruRoute` (`App.jsx:276-285`) memeriksa
  `isGuruLoggedIn` **atau** `teacherData`, **dan** `role`. Tetapi tombol Keluar di
  dasbor hanya menghapus `teacherData`, `isLoggedIn`, `userRole` — dua yang terakhir
  bahkan tidak pernah ditulis proses login guru. Jadi `isGuruLoggedIn` dan `role`
  tetap ada → penjaga tetap meluluskan.
- **Pembanding:** `SidebarGuru.jsx:236-239` memakai `localStorage.clear()` — menutup
  lubangnya, tetapi ikut membuang sesi admin/siswa dan preferensi non-sesi di
  peramban yang sama.
- **Perbaikan v1.6.5:** satu sumber kebenaran `src/utils/sesiLoginGuru.js`
  (`hapusSesiGuru()` + `masihDianggapMasuk()`); penjaga rute dan KEDUA tombol Keluar
  memakainya, jadi apa yang dihapus pasti sama dengan apa yang diperiksa. `role`
  hanya dibuang bila nilainya `guru`/`teacher` (sesi admin di perangkat yang sama
  tidak ikut keluar). Dikunci `tests/sesiLoginGuru.test.mjs` (8 uji), termasuk uji
  yang **mereproduksi bug lama** supaya tidak bisa kembali diam-diam.

### B-26 · S1 · Angka gaji guru bocor ke browser guru
> **Status v1.6.5:** ✅ SELESAI — `utils/logMengajar.buangNominal()` membuang semua field uang, dipakai dasbor & riwayat lewat service bersama; dikunci 9 uji termasuk reproduksi pola lama.
- **Gejala:** tidak terlihat di layar — itulah masalahnya. Buka DevTools → Network
  → dokumen `teacher_logs` di halaman Riwayat, dan field `nominal` (rupiah per sesi)
  ikut terkirim.
- **Penyebab:** `TeacherHistory.jsx` punya fungsi bernama `stripNominal` dengan
  komentar panjang "gaji TIDAK BOLEH sampai ke sisi guru dalam bentuk apapun",
  tetapi isinya `const { _nominal, ...rest } = d.data()` — yang dibuang adalah field
  bernama **`_nominal` yang tidak pernah ada**. Field aslinya `nominal`, jadi lolos
  utuh. Dasbor guru membuang field yang benar (`{ nominal: _nominal, ...rest }`),
  halaman Riwayat tidak → dua kebenaran untuk satu aturan.
- **Perbaikan v1.6.5:** `src/utils/logMengajar.js` → `buangNominal()` membuang
  SEMUA field bernilai uang (`nominal`, `_nominal`, `nominalGaji`, `gaji`, `honor`),
  dipakai dasbor **dan** riwayat lewat `services/logMengajarService.js`.
  Dikunci `tests/logMengajar.test.mjs` (9 uji) termasuk uji regresi yang meniru pola
  lama dan membuktikan pola itu meloloskan gaji.

---

## 6. Register lubang — keputusan owner (D2/D3/D5 sudah dijawab 3 Nov 2026)

| # | Pertanyaan | Pilihan | Usulan default (bila owner setuju) |
|---|---|---|---|
| **D1** | Notifikasi guru dihidupkan atau dicabut? | (a) hidupkan penuh + tentukan peristiwa pengirim, (b) hidupkan tapi hanya 1 peristiwa dulu (periode laporan belajar dibuka), (c) cabut: hapus panel lonceng dari dasbor guru | **(b)** — satu peristiwa nyata lebih jujur daripada panel kosong; biaya tulis kecil |
| **D2** | Kode absen harian | (a) tetap manual (admin setel tiap hari), (b) sistem membangkitkan otomatis tiap pagi + admin bisa menimpa, (c) manual tapi dasbor menampilkan "kode belum dibuat admin" | **(c) sekarang, (b) nanti** — (c) memperbaiki kebingungan tanpa mengubah kebijakan; (b) keputusan terpisah |
| **D3** | Arti "Total Siswa" & "Total Kelas" | (a) hitung dari jadwal 30 hari terakhir, (b) hitung dari roster aktif (siswa dengan masa aktif berlaku), (c) hapus kedua kartu, ganti "Sesi minggu ini" | **(c)** — dua kartu itu tidak bisa dipercaya dari data jadwal; (b) paling benar tapi butuh data kelayakan (kuota) |
| **D4** | Penyebut persen kehadiran | (a) mulai simpan `siswaTotal` di log baru saja (log lama apa adanya), (b) juga reparasi log lama dari `daftarSiswaHadir`+roster, (c) ganti metrik jadi "N sesi tersimpan minggu ini" | **(a)** — jujur ke depan tanpa menyentuh data lama; (b) masuk antrean A2 |
| **D5** | Kunci pencarian jadwal guru | (a) `teacherId` utama + nama cadangan (sama di semua halaman), (b) nama saja di semua halaman, (c) `teacherId` saja (data lama tanpa `teacherId` harus direparasi dulu) | **(a)** — aman untuk data warisan, satu fungsi bersama, nama tidak lagi jadi identitas |
| **D6** | Jendela jadwal yang boleh ditarik dasbor | (a) −7..+7 hari, (b) −30..+30 hari, (c) hari ini + 7 hari (riwayat diambil dari halaman Riwayat) | **(a)** — cukup untuk semua kartu yang ada, paling hemat |
| **D7** | Nomor versi yang ditampilkan ke pengguna | (a) ambil dari `package.json` saat build, (b) hapus label versi dari UI, (c) biarkan | **(b)** — nomor versi di UI tidak dipakai siapa pun untuk mengambil keputusan, dan selalu basi |
| **D8** | Indeks komposit dideklarasikan di repo (`firestore.indexes.json`)? | (a) ya, deploy lewat CLI, (b) tidak, tetap klik manual di Console | **(a)** — tanpa ini B-04/B-14 bisa kambuh diam-diam setiap proyek dipasang ulang |
| **D9** | Perbaikan S4 (B-18..B-21) dikerjakan sekarang atau ditabung ke E2? | (a) sekarang (tambal token di file lama), (b) tabung ke rombak E2, (c) hanya yang kontras (B-20) sekarang | **(c)** — kontras adalah masalah keterbacaan hari ini; sisanya lebih murah dikerjakan sekali di E2 |
| **D10** | Bug mana yang diperbaiki lebih dulu? | (a) urutan S1 → S3 → S2 → S4, (b) kelompokkan per berkas sekali jalan, (c) owner menunjuk sendiri | **(a)** — S1 = guru buntu, S3 = kuota (sedang kritis), S2 = angka salah, S4 = wajah |


### Keputusan yang SUDAH diambil owner (3 Nov 2026)

- **D2 = opsi (c)**, dengan pesan owner: *"sesuai usulanmu tapi atur se-efisien
  mungkin dan efektif."* → kode absen tetap dibuat admin; dasbor membedakan
  empat keadaan (siap / belum dibuat admin / dokumen kosong / gagal dibaca karena
  kuota) dan menyediakan "Coba lagi" yang membaca **satu dokumen** saja, bukan
  memuat ulang seluruh dasbor. Tombol VERIFIKASI dinonaktifkan selama kode belum
  siap, supaya guru tidak menghafal pesan tuduhan.
- **D5 = opsi (a)**, dengan pesan owner: *"ya tapi atur agar loading tidak nyasar
  atau lama karena pencocokan."* → satu aturan identitas bersama
  (`utils/identitasJadwal`), dan **tanpa kueri beruntun**: jadwal ditarik SATU
  kali berdasarkan jendela tanggal, pencocokan ID/nama dilakukan di klien. Nol
  putaran jaringan tambahan, nol ketergantungan indeks, data warisan tetap
  tertangkap. Aturan menangnya: **ID mutlak bila ada** (menutup lubang dua guru
  bernama sama), nama hanya untuk dokumen tanpa `teacherId`.
- **D3 = diserahkan ke asisten** (*"atur yang se-efisien se-efektif mungkin,
  kalau perlu riset kamu putuskan saja"*). Keputusan yang diambil: kartu lama
  "Total Siswa"/"Total Kelas" diganti **angka berjendela** yang bisa dihitung
  dari data yang memang ditarik — "Sesi Hari Ini" (+ jumlah agenda),
  "Sesi 7 Hari Terakhir" (+ jumlah selesai), "Siswa Terjadwal" (unik, dengan
  rentang tanggalnya ditulis di kartu), "Kehadiran" (persen **atau** "—" bila
  belum ada bukti, plus jumlah sesi yang jadi bahan hitungan). Alasan: kartu
  yang jujur lebih berguna daripada kartu besar yang salah, dan semua angka ini
  gratis karena berasal dari jendela yang sudah dibaca.

### Keputusan yang diambil asisten sebagai turunan langsung (dilaporkan, boleh dibatalkan)

- **D4 = (a)** — log mengajar baru menyimpan `siswaTotal` (penyebut kehadiran);
  log lama yang belum punya penyebut ditandai `perkiraan` di UI, dan log tanpa
  penyebut sama sekali **tidak dihitung** (bukan dihitung 0).
- **D6 = (a)** — jendela jadwal −7..+7 hari (15 hari) untuk dasbor.
- **D7 = (b)** — label versi ("v2.0"/"Versi 2.0") dicabut dari UI; sumber nomor
  versi tetap `package.json`.
- **D8 = (a)** — indeks `teacher_logs (teacherId ASC, tanggal DESC)` dideklarasikan
  di `firebase/firestore.indexes.json`; **perlu di-deploy owner** (bab 7).

### Masih menunggu owner

- **D1** (notifikasi guru: hidupkan penuh / satu peristiwa dulu / cabut panelnya).
  V1.6.5 sudah membetulkan sisi pembaca (nama field & kueri), tetapi
  `notifyTeachers()` **masih nol pemanggil** — jadi panel tetap kosong sampai
  owner memutuskan peristiwanya.
- **D9** (sisa wajah: B-19 sasaran sentuh + penyatuan token warna → dikerjakan di E2).
- **D10** tidak diperlukan lagi: urutan pengerjaan sudah dijalankan (bab 11).

---

## 7. Yang **tidak** bisa dipastikan dari sandbox (kuota 429) + cara owner cek ±2 menit

Semua temuan di atas berbasis **baca kode**, bukan baca data. Dua hal ini
menentukan apakah B-04/B-05/B-14 sudah benar-benar terjadi di produksi:

1. **Indeks komposit `teacher_logs (teacherId ASC, tanggal DESC)` ada atau tidak.**
   - Cek: Firebase Console → Firestore Database → **Indexes** → cari
     `teacher_logs`. Bila tidak ada → B-04 aktif setiap hari.
   - Alternatif: buka dasbor guru di browser → F12 → Console → cari tulisan
     `FAILED_PRECONDITION` + link `https://console.firebase.google.com/...indexes...`.
   - Dari sandbox tidak bisa: API metadata indeks menolak API key
     (`401 API keys are not supported by this API`) — butuh OAuth.
   - **v1.6.5:** indeks `teacher_logs (teacherId ASC, tanggal DESC)` sudah
     DIDEKLARASIKAN di `firebase/firestore.indexes.json`. Agar berlaku di
     produksi perlu satu perintah: `firebase deploy --only firestore:indexes`
     (tidak menyentuh rules — lihat komentar di `firebase.json`). Selama belum
     di-deploy, kode otomatis memakai jalur cadangan tanpa `orderBy` + catatan
     di localStorage, jadi dasbor tetap jalan (hanya lebih boros sedikit).
2. **Ragam nilai `teacherId` di dalam `teacher_logs`.**
   - Cek: Console → Firestore → `teacher_logs` → lihat 5-10 dokumen → apakah
     `teacherId` berbentuk `GURU-0xx` atau docId acak (mis. `epmtJ3g3EMvq...`).
     Bila campur → B-05 nyata dan sebagian log tak akan pernah terbaca dasbor.
   - Perintah siap pakai begitu kuota pulih: `node scratchpad/laporan-absensi-terbelah.mjs`
     (baca-saja) sudah disiapkan untuk absensi; untuk `teacher_logs` akan saya
     buatkan skrip baca-saja serupa **bila owner minta** (belum dibuat, supaya
     tidak menambah pembacaan saat kuota kritis).

**Status kuota saat dokumen ini ditulis:** 3 Nov 2026 08.11 WIB —
`LIST students` masih `429 RESOURCE_EXHAUSTED` (dicoba dua skrip baca-saja:
`laporan-absensi-terbelah.mjs` dan `sapu-masa-aktif.mjs` mode REPORT; keduanya
gagal di panggilan pertama, **nol** dokumen tertulis). Tidak ada retry
berulang — sesuai catatan bahwa spam retry memperpanjang masa jebol.

---

## 8. Urutan pengerjaan — batch 1-4 SUDAH dikerjakan (v1.6.5)

| Batch | Isi | Berkas yang disentuh | Butuh keputusan | Butuh kuota baca? |
|---|---|---|---|---|
| **1 — anti-buntu** ✅ | B-01, B-04 (pecah try + banner jujur + "Coba lagi"), B-06, B-22 | `TeacherDashboard.jsx` + `utils/kodeAbsenHarian.js` + `utils/keputusanMuat.js` | D2 ✅ | Tidak |
| **2 — identitas tunggal** ✅ | B-05, B-13 (+ B-25, B-26 yang ketemu di jalan) | `TeacherDashboard.jsx`, `TeacherAttendance.jsx`, `TeacherHistory.jsx`, `ClassSession.jsx`, `App.jsx`, `SidebarGuru.jsx` + `utils/identitasJadwal.js`, `utils/logMengajar.js`, `utils/sesiLoginGuru.js`, `services/logMengajarService.js` | D5 ✅ | Tidak (verifikasi butuh kuota) |
| **3 — kuota** ✅ | B-14, B-15, B-16, B-17 (+ deklarasi indeks) | 3 berkas guru + `firebase/firestore.indexes.json` | D6 ✅, D8 ✅ | Tidak |
| **4 — angka jujur** ✅ | B-07..B-12 | `TeacherDashboard.jsx`, `ClassSession.jsx` + `utils/statistikGuru.js` | D3 ✅, D4 ✅ | Tidak |
| **5 — wajah** 🟡 | B-18, B-20, B-21, B-23, B-24 ✅ dikerjakan sekarang; B-19 + penyatuan token warna ditabung ke **E2** | `TeacherDashboard.jsx`, `TeacherHistory.jsx` | D7 ✅, D9 🟡 | Tidak |
| **6 — notifikasi** 🟡 | B-03 ✅ (tombol hidup); B-02 menunggu keputusan pengirim | `notifications.js` (belum disentuh), `TeacherDashboard.jsx` | D1 ⏳ | Tidak |

Setiap batch wajib lolos gerbang yang sama: `npm run lint` **0 error 0 warning**
pada berkas yang disentuh, `npm test` hijau (138 berkas), dan untuk batch 5
ditambah gerbang tinjauan desain (tangkapan layar 360 px + desktop, daftar token,
pernyataan biaya baca).

---

## 9. Slot untuk daftar bug versi owner

Owner pernah menyampaikan "dashboard guru banyak bug" dan berutang daftar
gejala yang **beliau lihat sendiri** (tangkapan layar lebih bagus). Register di
atas adalah temuan dari sisi kode; gejala di lapangan bisa menunjuk bug yang
sama dari arah berbeda, atau bug yang tidak terlihat dari kode.

| # | Gejala yang owner lihat (bahasa sendiri) | Di halaman/jam berapa | Sudah terpetakan ke ID |
|---|---|---|---|
| 1 | *(kosong — menunggu)* | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

---

## 10. Riwayat dokumen

- **3 Nov 2026 08.20 WIB** — versi pertama (item B3). Audit baca-kode penuh
  `TeacherDashboard.jsx` + 8 berkas terkait; 24 temuan (6×S1, 7×S2, 4×S3, 7×S4);
  10 lubang keputusan (D1-D10); 6 batch pengerjaan diusulkan. **Nol perubahan kode.**
- **3 Nov 2026 (v1.6.5)** — owner menjawab D2 (opsi c), D5 (opsi a), dan
  menyerahkan D3; batch 1-4 + sebagian batch 5/6 dieksekusi. Dua temuan baru
  (B-25 logout tidak menutup sesi, B-26 gaji bocor ke browser guru) → total 26
  temuan, 24 selesai, 1 sebagian (B-02), 1 ditabung ke E2 (B-19). Koreksi:
  berkas indeks repo ada di `firebase/firestore.indexes.json`, bukan tidak ada.
  Rincian di bab 11.

---

## 11. Status eksekusi v1.6.5 — apa yang berubah, dan cara membuktikannya

### 11.1 Berkas baru (util murni + service + pengawal uji)

| Berkas | Isi | Uji |
|---|---|---|
| `src/utils/identitasJadwal.js` | SATU aturan "jadwal ini punya guru siapa" (ID menang; nama hanya untuk data warisan) + jendela tanggal −7..+7 yang anti-drift zona | `tests/identitasJadwal.test.mjs` (13) |
| `src/utils/statistikGuru.js` | Definisi baru angka kartu + kehadiran dengan penyebut dari log (`siswaTotal`), `perkiraan`, `tanpaBukti`, persen `null` bila tanpa bukti | `tests/statistikGuru.test.mjs` (11) |
| `src/utils/kodeAbsenHarian.js` | Empat keadaan kode absensi + verifikasi yang tidak pernah menuduh guru atas kegagalan sistem | `tests/kodeAbsenHarian.test.mjs` (15) |
| `src/utils/sesiLoginGuru.js` | Kunci sesi guru: `hapusSesiGuru()` + `masihDianggapMasuk()` (cermin syarat penjaga rute) | `tests/sesiLoginGuru.test.mjs` (8) |
| `src/utils/logMengajar.js` | Buang SEMUA field uang dari log, urut terbaru, saring bulan | `tests/logMengajar.test.mjs` (9) |
| `src/services/logMengajarService.js` | Pembaca `teacher_logs` bersama (identitas `in`, jalur cepat ber-`orderBy` + cadangan bila indeks belum di-deploy, batas dokumen) | lewat uji util di atas |

### 11.2 Berkas yang diubah

- `src/pages/teacher/TeacherDashboard.jsx` — lapisan data ditulis ulang: jendela
  tanggal + identitas tunggal + kegagalan per blok + banner jujur; 4 kartu statistik
  baru; modal kode absen ber-status; tombol "Tandai semua" hidup; avatar jadi tombol;
  tanggal & salam disegarkan saat aplikasi terlihat lagi; label versi dicabut;
  29 warna gagal kontras → token, 40 ukuran huruf <11 px → 11 px.
- `src/pages/teacher/TeacherAttendance.jsx` — satu kueri tanggal (tanpa kueri
  beruntun ID→nama), identitas bersama dengan dasbor, kebocoran langganan ditutup,
  tanggal lokal dari satu util.
- `src/pages/teacher/TeacherHistory.jsx` — identitas `in` (semua identitas guru),
  batas dokumen, bulan pilihan memakai tanggal LOKAL (bukan UTC), gaji benar-benar
  dibuang, banner gagal + tombol "Muat ulang", warning `exhaustive-deps` warisan ditutup.
- `src/pages/teacher/ClassSession.jsx` — log mengajar kini menyimpan `siswaTotal`
  (penyebut kehadiran yang tidak bisa berubah retroaktif).
- `src/App.jsx` — `GuruRoute` memakai `masihDianggapMasuk()`.
- `src/components/SidebarGuru.jsx` — tombol Keluar memakai `hapusSesiGuru()`
  (bukan `localStorage.clear()`).
- `firebase/firestore.indexes.json` — tambah indeks `teacher_logs (teacherId ASC,
  tanggal DESC)`.

### 11.3 Biaya baca per buka dasbor (inti keluhan kuota)

| | Sebelum | Sesudah |
|---|---|---|
| Jadwal | SELURUH riwayat jadwal guru (tumbuh selamanya) **+** langganan terpisah untuk hari ini (baca ganda) | SATU langganan jendela 15 hari (biaya **datar**, tak peduli umur bimbel) |
| Log mengajar | ≤30 bila indeks ada; bila tidak → error yang mematikan seluruh layar | ≤30 (jalur cepat) atau seluruh log guru itu sekali (cadangan, dicatat di localStorage agar tidak diulang) |
| Pengumuman | 5 dokumen, disaring portal sesudahnya (bisa nol) | 20 dokumen, disaring portal → 3 ditampilkan |
| Notifikasi | 2 kueri × 10 (field yang tak pernah ada) | 1 kueri, dibatasi 100 |
| Kode harian | 1 dokumen | 1 dokumen (dibaca ulang hanya bila diminta "Coba lagi") |

Langkah hemat berikutnya (belum dikerjakan, butuh keputusan): menambah indeks
`jadwal_bimbel (teacherId, dateStr)` agar jendela bisa disempitkan ke jadwal guru
itu saja (±90% lebih sedikit dokumen). Hambatannya: jadwal warisan tanpa
`teacherId` akan lolos dari kueri berbasis ID, jadi perlu aturan gabungannya
diputuskan dulu — dicatat sebagai lanjutan A4.

### 11.4 Gerbang yang sudah dilewati

- `npm test`: **143/143 berkas lulus** (sebelumnya 138; +5 berkas uji baru, 56 uji).
- `npx eslint` pada SEMUA berkas yang disentuh: **0 error, 0 warning**
  (termasuk menutup 1 warning `exhaustive-deps` warisan di `TeacherHistory.jsx`).
- `esbuild --bundle` per berkas yang disentuh: lolos (pengganti `vite build`
  yang OOM di sandbox — build produksi tetap dijalankan CI).
- `npm run lint` penuh / `vite build` tidak dijalankan di sandbox: keduanya mati
  karena kehabisan memori (terbukti environmental, terjadi juga di HEAD tanpa
  perubahan). CI yang menentukan.

### 11.5 Yang perlu owner lakukan (2 hal)

1. **Deploy indeks** (sekali, ±2 menit): `firebase deploy --only firestore:indexes`
   Perintah ini TIDAK menyentuh rules (lihat komentar `firebase.json`). Selama
   belum dijalankan, dasbor tetap hidup lewat jalur cadangan — hanya lebih boros.
2. **Cek setelah satu kelas disimpan:** kartu Kehadiran seharusnya menampilkan
   persen + tulisan "N sesi", bukan "—". Bila masih "—", artinya belum ada log
   baru yang menyimpan `siswaTotal` (log lama tanpa penyebut dihitung sebagai
   `perkiraan` hanya bila jadwalnya masih di dalam jendela 15 hari).

### 11.6 Yang masih terbuka

- **B-02 (notifikasi guru)** — sisi pembaca sudah benar; pengirim
  (`notifyTeachers`) masih nol pemanggil. Menunggu keputusan **D1**.
- **B-19 (sasaran sentuh ≥44 px)** dan penyatuan seluruh warna ke token —
  ditabung ke **E2** (rombak dasbor guru) karena mengubah tata letak header.
- **Verifikasi produksi** B-04/B-05 (indeks & ragam `teacherId` di log) masih
  butuh kuota baca — lihat bab 7.
