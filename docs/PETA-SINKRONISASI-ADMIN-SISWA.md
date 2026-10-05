# PETA SINKRONISASI ADMIN → SISWA

**Diukur:** 2026-10-05 · pemicu: keluhan owner "admin udah ganti status absensi, di siswa tetap … jangan-jangan semua ini ada bug yang tidak langsung konek"
**Jawaban singkat:** **ya, sistemik.** Bukan satu bug acak. Dokumen ini memetakan pola, mengukur seberapa luas, mencatat yang sudah diperbaiki, dan memberi urutan pemberesan.

---

## Polanya: empat kelas "tidak langsung konek"

Aplikasi ini **tidak punya lapisan sinkronisasi**. Setiap halaman memilih sendiri cara membaca data, dan hasilnya empat kelas perilaku yang berbeda-beda:

| Kelas | Perilaku | Akibat bagi pengguna |
|---|---|---|
| **A. Live** (`onSnapshot`) | perubahan admin muncul sendiri | terasa "konek" ✅ |
| **B. Ambil-sekali** (`getDocs` saat mount) | data hanya diambil saat halaman dibuka | perubahan admin baru kelihatan setelah **pindah halaman / reload**; di PWA yang hidup di latar belakang terasa seperti data macet |
| **C. Salinan localStorage** | nilai disalin sekali saat login, dibaca selamanya | perubahan admin **tidak pernah** kelihatan sampai logout-login |
| **D. Identitas tidak seragam** | penulis & pembaca memakai field kunci berbeda | data ada tapi **tidak ketemu** — terlihat seperti "tidak berubah" atau "hilang" |

Keluhan owner selama dua hari terakhir adalah **C** (nama siswa), lalu **B+D** (absensi).

---

## Pengukuran (hasil `grep` terhitung, bukan perkiraan)

### Halaman siswa: 1 live, 15 ambil-sekali, 4 hanya localStorage

**Kelas A — live (1):**
```
pages/student/StudentFinance.jsx        onSnapshot: 3
```

**Kelas B — ambil-sekali (15):**
```
LeaderboardPage.jsx        getDocs: 3    StudentSchedule.jsx      getDocs: 1
LiveSessionStudent.jsx     getDocs: 2    StudentSurveyView.jsx    getDocs: 2
StudentAttendance.jsx      getDocs: 1    BukuBacaPage.jsx         getDocs: 4
StudentDashboard.jsx       getDocs:19    BukuInteraktifPage.jsx   getDocs: 5
StudentElearning.jsx       getDocs:10    LatihanHarianPage.jsx    getDocs: 6
StudentModuleView.jsx      getDocs: 3    StudentSmartReport.jsx   getDocs: 1
StudentQuizView.jsx        getDocs: 3    DaftarTryOutPage.jsx     getDocs: 4
                                           TryOutView.jsx           getDocs: 5
```

**Kelas C — hanya localStorage (4):**
```
belajar/BelajarDaftarIsi.jsx   belajar/BelajarHome.jsx
belajar/BelajarReader.jsx      raport/StudentLeaderboard.jsx
```

> Catatan: `StudentAttendance.jsx` dan profil siswa **sudah dipindah** ke
> "B + segarkan saat terlihat" oleh perbaikan di bawah — mereka tetap
> terdaftar di tabel ini sebagai pengingat bahwa kelas B adalah bawaan repo.

### Kelas D — identitas tidak seragam di koleksi `attendance`

Tiga penulis, field kunci berbeda-beda:

| Penulis | `studentId` berisi | field nama |
|---|---|---|
| `admin/students/AdminAttendanceManage.jsx` | kode studentId **atau** docId | `namaSiswa` |
| `admin/students/StudentAttendance.jsx` | `student?.studentId \|\| id` | `namaSiswa` |
| `teacher/TeacherAttendance.jsx` | **docId** | `studentName` (field berbeda!) |

Pembaca (halaman siswa) dulu menebak dengan 3 query inline, dua di antaranya
berbasis **nama dari localStorage** — jadi begitu nama dibenarkan admin,
catatan lama tidak cocok lagi.

Pola yang sama (identitas ganda kode/docId) sudah pernah menyebabkan insiden
try out tentor (`docs/` commit #124) dan sudah punya preseden solusinya:
`src/utils/identitasGuru.js` — satu sumber pencocokan yang toleran.

---

## Yang sudah diperbaiki (2026-10-05)

| PR | Kelas | Isi |
|---|---|---|
| #128 | C | Profil siswa (nama & kelas) disegarkan dari Firestore lewat `src/utils/profilSiswa.js`; sidebar + avatar reaktif; throttle 60 dtk; gagal jaringan = pakai cache |
| PR ini | B | `StudentAttendance.jsx` mengambil ulang setiap aplikasi kembali terlihat (`focus` / `visibilitychange` saat `visible`) |
| PR ini | D | `src/utils/identitasAbsensi.js`: daftar pencarian absensi jadi eksplisit & teruji — `studentId` (kode), `studentId` (docId), `namaSiswa`, `studentName`; nilai kosong dibuang; hasil query tumpang tindih digabung unik supaya statistik Hadir/Izin/Sakit/Alpha tidak ganda |

Prinsip yang dipakai (dan harus dipertahankan):
1. **Jangan me-remount halaman** untuk menyegarkan — remount menghancurkan
   jawaban siswa yang sedang mengerjakan try out.
2. **Gagal jaringan = pakai cache**, jangan memutus sesi.
3. **Logika keputusan dipisah jadi fungsi murni + test**, karena kelas D
   hanya bisa dibereskan kalau aturan pencocokannya bisa diuji di Node.

---

## Urutan pemberesan sisa

### Tahap 1 — segarkan saat terlihat, untuk halaman B yang menampilkan data hasil edit admin
Murah, risiko rendah, tidak mengubah schema. Urutan prioritas berdasarkan
seberapa sering admin mengubah datanya:
1. `StudentSchedule.jsx` (jadwal diubah admin rutin) — **lint bersih, aman disentuh**
2. `StudentSurveyView.jsx` + `DaftarTryOutPage.jsx` (survei/try out diterbitkan admin)
3. `StudentDashboard.jsx` (19 getDocs!) — **ranjau CI: 13 error lint warisan**;
   sentuh hanya bersamaan dengan pembersihan lint-nya (Tahap 1 di `AUDIT-REPO.md`)
4. sisanya sesuai kebutuhan nyata yang dilaporkan pengguna

Polanya sama persis dengan yang dipasang di `StudentAttendance.jsx`:
`focus` + `visibilitychange` (hanya saat `visible`) memanggil ulang fungsi muat.

### Tahap 2 — seragamkan identitas `attendance` (kelas D, sisi penulis)
- Semua penulis menambah `studentDocId` + menulis **kedua** field nama
  (`namaSiswa` dan `studentName`) selama masa transisi.
- Skrip backfill satu kali untuk dokumen lama — **ini penulisan ke produksi,
  jadi keputusan owner**, sesuai SOP janji #5. Siapkan skripnya di `scripts/`
  dengan mode `--dry-run`.
- Setelah backfill: pembaca boleh berhenti menelek lewat nama.

### Tahap 3 — pindahkan halaman panas ke `onSnapshot` (kelas A)
`StudentDashboard.jsx` dan `DaftarTryOutPage.jsx` adalah yang paling terasa
"hidup" kalau live. Lakukan setelah Tahap 1 supaya manfaatnya sudah terasa
lebih dulu walau migrasi live belum selesai.

### Tahap 4 — hapus salinan localStorage (kelas C)
±17 tempat membaca `studentName`/`studentKelas` langsung. Ganti bertahap ke
`useProfilSiswa()` mulai dari chrome (sudah) lalu halaman C di atas.
Jangan menghapus kunci localStorage-nya dulu: ia tetap jadi cache offline
dan fallback saat jaringan gagal.

---

## Yang TIDAK boleh dilakukan sebagai "jalan cepat"

- **Menambah `window.location.reload()` saat mendeteksi perubahan.**
  Memutus siswa yang sedang mengerjakan ujian; persis daya rusak yang
  sudah pernah terjadi lewat bug lain di repo ini.
- **Menyamakan semua query ke nama saja.** Nama adalah data yang bisa
  diedit; identitas harus yang tidak berubah (docId / kode).
- **Menghapus field nama dari `attendance` sekarang.** Dokumen lama masih
  bergantung padanya sampai backfill Tahap 2 jalan.
