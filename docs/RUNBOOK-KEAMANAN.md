# Runbook Perbaikan Keamanan Firestore

**Untuk:** Owner / siapa pun yang punya akses Firebase Console & dashboard Vercel
**Dibuat:** 2026-10-01
**Latar belakang:** baca dulu `docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md`

Dokumen ini berisi langkah yang **hanya bisa Anda kerjakan** — saya tidak punya
akses ke Firebase Console maupun dashboard Vercel. Bagian kode sudah selesai dan
sudah ada di repo.

**Urutannya penting. Jangan melompat.** Setiap tahap ditulis supaya aplikasi tetap
hidup, kecuali Tahap 4 yang memang menuntut Firebase Auth sudah terpasang lebih
dulu.

---

## Ringkasan: apa yang sudah siap dan apa yang menunggu Anda

| | Sudah di repo | Butuh aksi Anda |
|---|---|---|
| Endpoint verifikasi server | ✅ `api/verifyStaffLogin.js` | isi `FIREBASE_SERVICE_ACCOUNT` di Vercel |
| Klien coba server dulu, fallback aman | ✅ `adminAuth.js`, `LoginOwner.jsx` | — |
| Rules tahap 1 (kunci kredensial) | ✅ `firebase/rules/tahap-1-kredensial.rules` | tempel & Publish di Console |
| Rules keadaan akhir | ✅ `firebase/rules/tahap-3-final.rules` | **jangan dipasang dulu** |
| Firebase Auth untuk admin/owner/siswa | ❌ belum | keputusan + pekerjaan berikutnya |

---

## Tahap 0 — Buat service account (±15 menit, tanpa downtime)

Ini yang membuat `api/verifyStaffLogin.js` bisa membaca Firestore dari server,
tanpa perlu membukanya ke browser.

1. Buka <https://console.firebase.google.com/project/gemilangsystem>
2. Menu kiri → **⚙️ Project settings** → tab **Service accounts**
3. Klik **Generate new private key** → **Generate key**
4. Sebuah file `.json` terunduh. **Simpan baik-baik, jangan di-commit.**
   Isinya setara kunci master seluruh database Anda.
5. Buka <https://vercel.com> → proyek `bimbel-gemilang-app` → **Settings** →
   **Environment Variables**
6. Tambahkan dua variabel, untuk **Production**, **Preview**, dan **Development**:

   | Key | Value |
   |---|---|
   | `FIREBASE_SERVICE_ACCOUNT` | seluruh isi file `.json` tadi, disalin apa adanya |
   | `FIREBASE_PROJECT_ID` | `gemilangsystem` |

   > Kalau Vercel menolak karena ada newline, centang opsi *multiline* /
   > *sensitive*, atau ganti newline dengan `\n` literal — kodenya sudah
   > menangani keduanya.

7. **Redeploy** (Environment Variables tidak berlaku untuk deploy yang sudah ada):
   tab **Deployments** → deployment terbaru → **⋯** → **Redeploy**.

### Buktikan endpoint-nya hidup

Ganti URL di bawah dengan URL produksi Anda, lalu buka di terminal:

```bash
curl -i -X POST https://bimbel-gemilang-app.vercel.app/api/verifyStaffLogin \
  -H 'Content-Type: application/json' \
  -d '{"jalur":"owner","password":"salah-sengaja"}'
```

| Jawaban | Artinya |
|---|---|
| `501` + `"belumDikonfigurasi": true` | ❌ variabel belum terbaca. Ulangi langkah 6–7. |
| `503` | ❌ JSON service account rusak/terpotong saat disalin. Ulangi langkah 6. |
| `401` + `"PIN Owner salah."` | ✅ **BERHASIL.** Endpoint hidup dan bisa membaca Firestore. |

Jangan lanjut ke Tahap 1 sebelum melihat `401`. Kalau endpoint belum hidup lalu
rules dipasang, **Owner akan terkunci di luar**.

---

## Tahap 1 — Kunci kredensial (±10 menit, tanpa downtime)

Ini menutup vektor paling berbahaya: `ownerPin` dan `adminPassword` teks polos
berhenti bisa dibaca publik, dan orang asing tidak bisa lagi menyisipkan akun
`admin_users` bikinan sendiri.

1. Firebase Console → **Build → Firestore Database → tab Rules**
2. **Salin dulu rules yang sekarang ada** ke file lokal. Ini satu-satunya cara
   kembali kalau ada masalah — dan selama ini rules tidak pernah tersimpan di
   repo, jadi tidak ada salinan lain.
3. Hapus isinya, tempel bagian `RULES` dari
   **`firebase/rules/tahap-1-kredensial.rules`** (mulai `rules_version = '2';`
   sampai kurung kurawal penutup terakhir).
4. Klik **Publish**. Berlaku dalam hitungan detik.

### Buktikan berhasil

Buka aplikasi di **browser mode penyamaran**, buka DevTools → Console:

```js
// 1. Kredensial harus SUDAH tertutup:
firebase.firestore().doc('settings/global_config').get()
  .then(() => console.log('❌ MASIH TERBUKA'))
  .catch(e => console.log('✅ tertutup:', e.code));
// -> harus mencetak "permission-denied"
```

Lalu uji lewat UI, semuanya harus **tetap berhasil**:

- [ ] Login Owner dengan PIN
- [ ] Login Admin dengan password lama (kolom username dikosongkan)
- [ ] Login Admin dengan akun baru di `/login-admin`
- [ ] Login Guru
- [ ] Login Siswa
- [ ] Halaman publik `/aktivitas` dan `/pendaftaran`

### Kalau ada yang terkunci

Kembalikan blok ini di rules jadi terbuka, lalu **Publish**:

```
match /settings/{document=**} { allow read, write: if true; }
```

Itu memulihkan keadaan sekarang. Lalu periksa lagi kenapa
`verifyStaffLogin` tidak dipakai — kemungkinan besar masih menjawab `501`.

### Apa yang BELUM tertutup setelah Tahap 1

**Jujur: masih banyak.** `students` (termasuk password siswa teks polos),
`teachers`, `finance_logs`, dan ±35 koleksi lain **masih terbuka** untuk dibaca
siapa pun. Tahap 1 adalah pengurangan risiko yang berarti, bukan penyelesaian.

---

## Tahap 2 — Hentikan unduhan massal data siswa (paling mendesak setelah Tahap 1)

Saat login, `src/pages/LoginSiswa.jsx` menjalankan:

```js
const querySnapshot = await getDocs(collection(db, "students"));
```

**Seluruh koleksi siswa diunduh ke browser siapa pun yang membuka halaman login
siswa**, lalu dicocokkan dengan `String(studentData.password) === inputPassword`.
Jadi bukan hanya soal rules terbuka — password siswa memang **tersimpan sebagai
teks polos** dan memang **dirancang untuk diunduh publik**.

Ini menyangkut data pribadi anak di bawah umur. Perlu diperbaiki secepatnya
setelah Tahap 1, dengan cara yang sama seperti admin: pindahkan verifikasi ke
Vercel Function, dan hash password siswa.

Karena jumlah siswa bisa banyak, migrasinya perlu skrip satu kali yang
meng-hash password yang sudah ada — **password asli tidak bisa dipulihkan dari
hash**, jadi skrip itu harus dijalankan selagi datanya masih terbaca.

> Saya bisa mengerjakan ini. Butuh keputusan Anda soal apakah siswa dipindah ke
> Firebase Auth penuh (lebih aman, lebih banyak kerja) atau cukup verifikasi
> lewat server seperti admin (lebih cepat, lebih sedikit perubahan).

---

## Tahap 3 — Pasang Firebase Auth untuk admin, owner, dan siswa

Ini prasyarat untuk rules yang sesungguhnya. Selama status login hanya ada di
`localStorage`, Firestore **tidak punya cara** membedakan staf sah dari orang
asing — apa pun yang ditulis di sisi klien bisa dilewati lewat DevTools.

Yang dikerjakan (ini **Jalan A** yang Anda pilih):

1. Aktifkan **Authentication → Sign-in method → Email/password**.
2. Buat akun Firebase Auth untuk tiap admin/owner. Username admin dipetakan ke
   email internal, mis. `siti@staff.gemilang.internal` (domain fiktif, tidak
   perlu bisa menerima email).
3. Set **custom claims** lewat Vercel Function dengan service account:
   ```js
   getAuth().setCustomUserClaims(uid, { peran: 'manajer' });
   ```
4. `LoginAdmin.jsx` & `LoginOwner.jsx` dipindah ke `signInWithEmailAndPassword`.
5. Siswa ikut dipindah (menggantikan Tahap 2 secara tuntas).

Kode sudah dipersiapkan untuk ini: **semua logika sesi admin terpusat di
`src/utils/adminAuth.js`**, jadi yang berubah satu berkas, bukan puluhan
komponen. `passwordHash.js` nantinya tidak diperlukan lagi (Firebase yang
menyimpan hash), tapi tetap berguna selama masa peralihan.

---

## Tahap 4 — Kunci seluruh database

Setelah Tahap 3 selesai dan diuji di **proyek staging**:

1. Sesuaikan `firebase/rules/tahap-3-final.rules` dengan data nyata.
   Berkas itu mencantumkan **5 hal yang wajib diverifikasi** di bagian bawahnya —
   terutama nama field `uid` di dokumen siswa/guru, dan nama koleksi
   `teacher_salaries` yang saya tebak dan mungkin tidak ada.
2. Daftarkan **composite index** yang diminta. Setelah rules dipasang, buka
   aplikasi; Console Firestore akan menampilkan tautan pembuatan index di tiap
   error query.
3. Baru pasang di produksi.
4. Commit `firestore.rules` + `firebase.json` ke root repo supaya rules
   ter-version dan bisa di-deploy dengan `firebase deploy --only firestore:rules`.
   **Jangan lakukan ini sebelum Tahap 3** — tooling bisa menerapkannya otomatis
   dan mematikan aplikasi.

---

## Tahap 5 — Periksa apakah sudah disalahgunakan

Selama database terbuka, tidak ada yang mencegah orang sudah mengambil isinya.

1. <https://console.cloud.google.com> → pilih proyek `gemilangsystem`
2. **Firestore → Usage**: lihat grafik pembacaan dokumen. Lonjakan yang tidak
   cocok dengan jam operasional bimbel adalah tanda ada yang menyedot data.
3. **Logging → Logs Explorer**, saring `resource.type="cloud_firestore_database"`.
   Cari operasi `Get`/`List` dalam volume tinggi.
4. Kalau ada indikasi data pribadi siswa sudah diambil pihak luar, pertimbangkan
   kewajiban pemberitahuan. **UU No. 27/2022 tentang Pelindungan Data Pribadi**
   mengatur data pribadi anak dan kewajiban pemberitahuan kebocoran kepada subjek
   data dan lembaga pengawas. Ini ranah hukum, bukan teknis — sebaiknya
   dikonsultasikan, bukan diputuskan sendiri.

---

## Yang TIDAK boleh dilakukan

| Jangan | Kenapa |
|---|---|
| Pasang `tahap-3-final.rules` sekarang | Aplikasi mati total. Butuh Tahap 3 dulu. |
| Commit file service account ke repo | Setara membagikan kunci master database. `.gitignore` sudah menolak `.env*`, tapi file `.json` hasil unduhan tidak — simpan di luar folder repo. |
| Deploy Tahap 1 sebelum endpoint menjawab `401` | Owner terkunci di luar. |
| Anggap pemisahan akun admin = sudah aman | Selama rules terbuka, `admin_users` bisa dibaca **dan ditulis** publik. Lihat bagian bawah `docs/INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md`. |
| Ganti `ownerPin` / `adminPassword` lalu merasa beres | Selama `settings` masih terbaca publik, nilai baru sama terbaca-nya dengan yang lama. Tahap 1 yang menyelesaikannya, bukan rotasi. |

---

## Urutan yang saya sarankan

```
HARI INI     Tahap 0  ->  buktikan 401  ->  Tahap 1  ->  centang semua uji login
MINGGU INI   Tahap 2 (password siswa) — data anak, paling mendesak
2-3 MINGGU   Tahap 3 (Firebase Auth admin/owner/siswa)
SETELAHNYA   Tahap 4 (kunci penuh) + Tahap 5 (forensik)
```

Tahap 0 dan 1 bisa selesai dalam satu duduk dan langsung menghilangkan risiko
pengambilalihan akun owner/admin. Sisanya pekerjaan nyata yang butuh waktu.
