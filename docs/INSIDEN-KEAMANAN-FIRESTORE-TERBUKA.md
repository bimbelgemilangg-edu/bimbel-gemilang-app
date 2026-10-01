# 🔴 INSIDEN KEAMANAN: Firestore Produksi Terbuka Tanpa Autentikasi

**Ditemukan:** 2026-10-01, saat audit untuk pekerjaan pemisahan akun admin
**Tingkat:** **KRITIS — dapat dieksploitasi sekarang juga, tanpa keahlian khusus**
**Status:** BELUM DIPERBAIKI (butuh keputusan Owner + akses Firebase Console)
**Proyek Firebase:** `gemilangsystem`

---

## Apa yang terjadi

Firestore Security Rules proyek ini effectively bernilai:

```
allow read, write: if true;
```

Artinya **siapa pun yang tahu alamat web aplikasi** — tanpa login, tanpa akun,
tanpa alat khusus — bisa membaca, mengubah, dan menghapus seluruh isi database.

`apiKey` Firebase memang terpasang di `src/firebase.js` dan ikut terkirim ke
browser. Itu **normal dan bukan kebocoran**: apiKey Firebase web adalah
identifier publik. Yang menahan akses seharusnya **Security Rules** — dan
rules-nya tidak ada.

## Bukti (diuji read-only, tanpa mencetak nilai secret)

```
Uji akses Firestore TANPA login:
  🔓 TERBUKA  settings/global_config -> 7 field; field sensitif TEREKSPOS: [ownerPin, adminPassword]
  🔓 TERBUKA  admin_users            -> 0 dokumen
  🔓 TERBUKA  audit_logs             -> 0 dokumen
  🔓 TERBUKA  students               -> 1 dokumen terbaca
  🔓 TERBUKA  teachers               -> 1 dokumen terbaca
  🔓 TERBUKA  finance_logs           -> 1 dokumen terbaca

Uji tulis ke koleksi scratch 'zz_probe_keamanan' (bukan data produksi):
  🔓 TULIS DITERIMA  -> siapa pun bisa MENAMBAH/MENGUBAH data tanpa login
  🔓 HAPUS DITERIMA  -> siapa pun bisa MENGHAPUS data tanpa login
  (dokumen probe langsung dibersihkan; tidak ada data produksi yang disentuh)
```

Skrip penguji tidak disimpan ke repo. Ia hanya membaca, dan satu-satunya tulis
dilakukan ke koleksi scratch yang dibuat lalu dihapus lagi.

## Dampak nyata

| Yang bocor / bisa diubah | Akibat |
|---|---|
| `settings/global_config.ownerPin` | **Siapa pun bisa login jadi Owner** — lihat seluruh keuangan, gaji guru, neraca |
| `settings/global_config.adminPassword` | **Siapa pun bisa login jadi Admin** — ubah tagihan siswa, terbitkan kwitansi |
| `students` | Data pribadi siswa: nama, kelas, tagihan, pembayaran. Ini data anak di bawah umur |
| `teachers` | Data pribadi & kontak guru |
| `finance_logs` | Seluruh arus kas, omzet, honor tentor |
| Akses **tulis** | Orang bisa melunasi tagihannya sendiri, menaikkan/menurunkan honor, memalsukan kwitansi |
| Akses **hapus** | Orang bisa menghapus seluruh data keuangan atau data siswa. Tidak ada soft-delete di schema ini |

Karena password admin tersimpan sebagai **teks polos** di `adminPassword`,
penyerang bahkan tidak perlu menebak apa pun — cukup membacanya.

## Cara mengecek sendiri (2 menit)

Buka halaman login aplikasi di browser → DevTools → Console → tempel:

```js
fetch('https://firestore.googleapis.com/v1/projects/gemilangsystem/databases/(default)/documents/settings/global_config',
      { method: 'GET' })
```

Cara yang lebih meyakinkan: buka `https://bimbel-gemilang-app` (atau URL produksi
Anda) di **browser mode penyamaran**, buka DevTools, dan jalankan pembacaan
Firestore. Tidak perlu login sama sekali.

---

## ⚠️ PENTING: fitur "Pemisahan Akun Admin" TIDAK menyelesaikan ini

Pekerjaan pemisahan akun admin yang menyertai temuan ini memberi **manfaat
nyata** — akuntabilitas (siapa melakukan apa tercatat di jejak audit), dan
password tidak lagi disimpan sebagai teks polos. Tapi ia **bukan perbaikan
keamanan** selama rules masih terbuka, karena:

1. `admin_users` ikut terbaca publik → hash password bisa diunduh lalu
   ditebak offline. PBKDF2 210.000 iterasi memperlambat, tidak mencegah.
2. `admin_users` ikut **tertulis** publik → siapa pun bisa menyisipkan dokumen
   `{username: "saya", peran: "manajer", aktif: true, passwordHash: <hash bikinan>}`
   lalu login sebagai Manajer.
3. Semua guard peran di aplikasi berjalan di **browser**. Menyembunyikan menu
   dari kasir adalah kosmetik — DevTools bisa membuka halaman apa pun dan
   Firestore akan tetap melayani permintaannya.

**Keamanan yang sesungguhnya hanya bisa ditegakkan di Firestore Rules**, karena
itu satu-satunya lapisan yang tidak bisa dilewati pengguna.

---

## Akar masalah arsitektur

Aplikasi ini menyimpan status login di **`localStorage`**, bukan di Firebase
Auth:

```js
localStorage.setItem('isLoggedIn', 'true');
localStorage.setItem('role', 'admin');
```

Firestore Rules hanya bisa memverifikasi `request.auth` — yaitu sesi **Firebase
Auth**. Karena admin & owner tidak pernah login ke Firebase Auth, `request.auth`
selalu `null` untuk mereka. Akibatnya **tidak mungkin** menulis rules yang
membedakan "admin sah" dari "orang asing" tanpa mengubah cara admin login.

Guru sudah benar: `LoginGuru.jsx` memakai `signInWithEmailAndPassword`, jadi
sesi guru terlihat oleh rules. Admin, owner, dan siswa tidak.

---

## Usulan perbaikan (urut, jangan dibalik)

### Langkah 1 — SEKARANG JUGA, hari ini (tanpa deploy kode)

Buka Firebase Console → Firestore Database → Rules, dan pasang **mode kunci
penuh** sementara:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

**Konsekuensi: aplikasi akan berhenti berfungsi untuk semua orang.** Ini
sengaja — lebih baik aplikasi mati beberapa jam daripada data siswa dan
keuangan tetap terbuka tanpa batas. Lakukan di jam sepi, dan kabari guru/admin
sebelumnya.

> Kalau aplikasi tidak boleh mati sama sekali, lewati Langkah 1 dan langsung
> kerjakan Langkah 2 secepat mungkin — tapi sadarilah bahwa setiap jam penundaan
> adalah satu jam database terbuka.

### Langkah 2 — Pindahkan PIN & password keluar dari dokumen publik

`ownerPin` dan `adminPassword` **tidak boleh** pernah dibaca browser. Pindahkan
verifikasinya ke Vercel Function (folder `api/` sudah ada), yang membaca
dokumen itu memakai kredensial server. Dengan begitu `settings/global_config`
bisa dikunci dari akses anonim.

### Langkah 3 — Admin & Owner login lewat Firebase Auth

Ini yang membuat rules bisa membedakan peran:

- Buat akun Firebase Auth untuk tiap admin (username → email internal, mis.
  `siti@staff.gemilang.internal`).
- Set **custom claims** (`peran: 'manajer'`) lewat Vercel Function dengan
  service account.
- Rules lalu bisa menulis `request.auth.token.peran == 'manajer'`.

Ini juga yang dimaksud "login seperti guru" — guru sudah memakai jalur ini.

### Langkah 4 — Pasang rules yang sesungguhnya

Setelah Langkah 3, rules bisa berbentuk kira-kira:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function sudahLogin() { return request.auth != null; }
    function peran()      { return request.auth.token.peran; }
    function staff()      { return sudahLogin() && peran() in ['kasir','manajer','owner']; }
    function manajer()    { return sudahLogin() && peran() in ['manajer','owner']; }

    // Default: TOLAK. Ini baris terpenting.
    match /{document=**} { allow read, write: if false; }

    // Halaman publik & pendaftaran online butuh tulis tanpa login.
    match /online_registrations/{id} { allow create: if true; allow read, update, delete: if staff(); }
    match /tutor_applications/{id}   { allow create: if true; allow read, update, delete: if staff(); }
    match /blog_posts/{id}           { allow read: if true; allow write: if staff(); }

    // Kredensial: JANGAN PERNAH bisa dibaca klien.
    match /settings/{id}             { allow read, write: if false; }

    // Akun admin & jejak audit.
    match /admin_users/{id}          { allow read, write: if false; }
    match /audit_logs/{id}           { allow create: if staff(); allow read: if manajer(); allow update, delete: if false; }

    // Data operasional.
    match /students/{id}             { allow read, write: if staff(); }
    match /teachers/{id}             { allow read: if staff() || (sudahLogin() && request.auth.uid == resource.data.uid); }
    match /finance_logs/{id}         { allow read, write: if staff(); }
    // ... koleksi lain menyusul
  }
}
```

⚠️ **Kerangka di atas belum diverifikasi terhadap seluruh koleksi yang dipakai
aplikasi.** Memasangnya apa adanya hampir pasti memutus sebagian fitur. Daftar
lengkap koleksi harus dikumpulkan dulu (bisa dengan menyisir `collection(db, ...)`
di seluruh `src/`), lalu rules diuji bertahap di lingkungan staging.

**Jangan menaruh berkas ini di root sebagai `firestore.rules`** sampai benar-benar
siap di-deploy — tooling bisa otomatis menerapkannya.

### Langkah 5 — Simpan rules di repo

Setelah benar, commit sebagai `firestore.rules` + `firebase.json` supaya
ter-version dan bisa di-deploy lewat `firebase deploy --only firestore:rules`.
Selama ini rules hanya ada di console, jadi tidak ada riwayat perubahan dan
tidak ada yang tahu bentuknya.

### Langkah 6 — Periksa apakah sudah disalahgunakan

Firebase Console → Firestore → **Usage**, dan Logs Explorer di Cloud Logging.
Cari lonjakan pembacaan yang tidak wajar pada periode rules terbuka. Kalau ada
indikasi data sudah diambil orang, pertimbangkan kewajiban pemberitahuan
kebocoran data pribadi (UU PDP No. 27/2022 mengatur data pribadi anak dan
kewajiban pemberitahuan).

---

## Catatan: apa yang tetap berharga dari pekerjaan admin

Meskipun bukan perbaikan keamanan, pemisahan akun admin tetap layak dipasang
karena:

- **Jejak audit** (`audit_logs`) menjawab kebutuhan "jelas siapa akses kalau
  terjadi kesalahan" — ini tidak bergantung pada rules.
- **Akuntabilitas internal**: membedakan staf satu sama lain, mencabut akses
  satu orang tanpa mengganti password semua orang.
- **Strukturnya sudah siap** untuk Langkah 3: `adminAuth.js` memusatkan semua
  logika sesi di satu tempat, jadi mengganti backend-nya ke Firebase Auth cukup
  menyentuh satu berkas, bukan puluhan.
- Password tidak lagi teks polos (meski hash-nya masih terekspos sampai rules
  dibereskan).
