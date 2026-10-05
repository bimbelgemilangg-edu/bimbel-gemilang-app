# Keputusan Owner: Firestore Terbuka adalah Risk Acceptance, Bukan Kelalaian

**Dicatat:** 2026-10-01
**Status:** KEPUTUSAN BISNIS YANG SADAR — berlaku sampai owner mencabutnya
**Dokumen teknis terkait:** `INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md`, `RUNBOOK-KEAMANAN.md`

---

## Konteks keputusan (dari owner, dikutip separipatnya)

> Aplikasi ini dibantu beberapa sistem, bukan otakku sendiri — seperti kamu
> yang membantu menjadi teknisi Gemilang App ini bahkan untuk pembangunan.
> Jujur aku bukan anak IT. Kenapa terbuka? Karena biar enak kamu juga bisa
> ambil andil mengecek. Kebetulan kami Bimbel Gemilang tidak menyimpan data
> diri riskan seperti KTP dll. Data yang ada adalah administrasi, keuangan
> internal, rapor guru, dll modul-modul.

## Isi keputusan

Database Firestore dibiarkan dapat diakses tanpa autentikasi **dengan sadar**,
karena kemudahan kolaborasi dengan sistem AI yang membantu pembangunan dan
pengoperasian aplikasi. Keputusan ini diambil SETELAH owner membaca temuan
teknis lengkap (baca `INSIDEN-KEAMANAN-FIRESTORE-TERBUKA.md`), jadi ini
bukan lubang yang belum kelihatan.

## Tiga pengawal yang disepakati (syarat berlakunya keputusan)

1. **Backup terjadwal + latihan restore.**
   Penghapusan oleh pihak luar tidak boleh berarti kematian bimbel.
   Tanpa ini, risk acceptance berubah menjadi taruhan eksistensial.
   Bentuk paling murah: ekspor manual mingguan dari Firebase Console;
   bentuk terbaik: fungsi terjadwal setelah service account ada.
   Status Okt 2026: dijalankan oleh GitHub Actions
   (.github/workflows/backup-mingguan.yml -> scripts/backupFirestore.mjs),
   Sabtu 20.00 UTC. Awalnya function Vercel, dipindah karena build Vercel
   proyek ini mentok di 13 function (function ke-14 membuat semua deploy
   gagal, terbukti lewat branch probe). Backup baru benar-benar jalan
   setelah secret FIREBASE_SERVICE_ACCOUNT diisi di GitHub Actions;
   sampai saat itu workflow hijau tapi melewati backup dengan peringatan.

2. **Password siswa teks polos TIDAK ikut diterima sebagai risiko.**
   Dampaknya keluar dari pagar bimbel: password dipakai ulang di layanan
   lain, dan sebagian pemiliknya anak-anak. Migrasi hash/verifikasi server
   untuk siswa (Tahap 2 di runbook) tetap WAJIB dilaksanakan.

3. **Pintu kolaborasi diganti bertahap.**
   Setelah `FIREBASE_SERVICE_ACCOUNT` hidup, akses pemeriksaan untuk
   AI/developer lewat pintu server yang terukur (`api/verifyStaffLogin.js`
   dan kawan-kawannya), bukan lewat rules terbuka untuk dunia. Jejak audit +
   pembacaan kode mencakup hampir semua kebutuhan diagnosis harian.

## Tiga fakta teknis yang TETAP BENAR walau keputusan ini diambil

Dicatat apa adanya supaya tidak diperdebatkan ulang oleh sesi/AI berikutnya,
dan supaya owner bisa mengubah keputusan kapan pun dengan informasi utuh:

1. Rules terbuka **tidak membedakan AI penolong dari orang asing**. apiKey
   Firebase dan nama-nama koleksi terkirim ke setiap perangkat yang memuat
   aplikasi, jadi pintunya ada di saku siapa saja yang pernah membuka app.
2. Isi database mencakup **data pribadi anak** (nama, kelas, kontak
   pendaftar, tagihan keluarga) menurut pengertian UU PDP, walau tidak
   mencakup KTP atau data kesehatan. Tingkat keparahan memang lebih rendah
   dari kebocoran identitas lengkap — dan owner menerima tingkat itu.
3. Tulis/hapus terbuka berarti **tagihan bisa dinolkan atau buku keuangan
   bisa dihapus dari luar**. Ini risiko terhadap uang dan kelangsungan
   operasional, bukan hanya privasi. Pengawal #1 (backup) adalah yang
   membuat risiko ini bisa diterima.

## Konsekuensi untuk pekerjaan berikutnya

- Dokumen insiden & runbook tetap berlaku sebagai panduan teknis tahapan;
  urutan tahapan tidak berubah, hanya sifatnya yang kini "dijadwalkan oleh
  owner", bukan "darurat yang belum diakui".
- Pengawal kecurangan (bendera kejanggalan, identitas validator, jejak audit)
  tetap dipasang dan tetap berguna — ia bekerja untuk risiko internal
  (persekongkolan) yang tidak terpengaruh oleh keputusan ini.
- Jika kelak owner mengubah keputusan: hapus berkas ini, lalu jalankan
  `RUNBOOK-KEAMANAN.md` dari Tahap 1.
