# POLICY ERROR & KUOTA — data gagal dimuat harus terdengar, bukan menghilang

**Ditetapkan:** 2026-10-06 · pemicu: audit baca-saja yang ditolak proyek dengan
`429 RESOURCE_EXHAUSTED (Quota exceeded)` + keluhan owner "bank soal kayanya
ada bug, kurang soalnya".

---

## Temuan yang melahirkan policy ini

1. **Kuota baca Firestore proyek ini pernah habis.** Permintaan baca paling
   sederhana pun ditolak 429. Firestore tier gratis memberi jatah harian;
   ia bukan tak terbatas.
2. **Penyedot terbesarnya adalah pola `getDocs(seluruh koleksi)`** di halaman
   yang membuka daftar panjang (Lemari Soal, daftar absensi admin, Cetak
   Latihan, dashboard). Satu klik = ribuan dokumen ditarik.
3. **Kegagalan baca ditelan senyap.** Banyak halaman memakai
   `catch { setDaftar([]) }` atau `catch(() => ({docs: []}))`. Saat kuota
   terpukul, pengguna melihat **daftar kosong/pendek** dan menyimpulkan
   "datanya hilang / soalnya kurang" — padahal datanya ada, hanya tidak
   sampai ke layar. Kebohongan yang terasa seperti bug data.

## Aturan wajib (berlaku untuk semua kode baru dan setiap berkas yang disentuh)

1. **Tidak ada `catch` senyap untuk pemuatan data.** Tangkapan error wajib
   (a) mempertahankan data lama yang masih benar, dan (b) menampilkan pesan
   jujur + jalan keluar ("Coba lagi"). Pakai `kebijakanGagalMuat()` di
   `src/utils/keputusanMuat.js` supaya bahasanya seragam di seluruh aplikasi.
2. **Penyegaran boleh, menyapu berulang tidak.** Halaman yang menyegarkan
   diri saat aplikasi kembali terlihat WAJIB memakai cache ber-TTL untuk
   koleksi besar: `perluSegar({waktuCacheMs, ttlMs, paksa})` di berkas yang
   sama. Tombol "Muat ulang"/"Coba lagi" = `paksa: true`.
3. **Tombol "Coba lagi" wajib ada** di setiap banner error pemuatan, supaya
   pengguna tidak perlu reload seluruh aplikasi (reload = semua halaman
   menembak server bersamaan = lonjakan kuota).
4. **Koleksi besar tidak disapu per kunjungan.** Bila sebuah halaman
   membutuhkan agregat (jumlah per mapel/bab), hitung sekali dan simpan;
   atau batasi dengan query ber-`where`/`limit`. Menyapu untuk menghitung
   adalah pemborosan yang tidak terlihat di kode review.
5. **429 adalah kondisi normal, bukan exception aneh.** Pesan kepada pengguna
   harus manusiawi: "server sedang sibuk/kuota harian habis, coba lagi
   sebentar lagi" — bukan tumpukan stack trace, bukan daftar kosong.

## Yang sudah menerapkan (contoh rujukan)

- `CetakPaketLatihan.jsx`: cache modul-level TTL 10 menit untuk `bank_soal`
  & `tryout_paket`, banner error + tombol Coba lagi.
- `GuruPantauTryOut.jsx`: gagal muat sesi tidak lagi tampil sebagai
  "belum ada peserta"; pesan jujur ditampilkan, daftar lama dipertahankan.
- `StudentAttendance.jsx` (siswa): gagal muat absensi menampilkan banner,
  bukan minggu kosong.

## Yang masih berutang (daftar kerja, bukan lupa)

- `LemariSoalPage.jsx`, `AdminAttendanceManage.jsx`, `StudentDashboard.jsx`
  dan halaman penyapu lain masih `getDocs` koleksi penuh + sebagian menelan
  error. Sentuh bersamaan dengan pembersihan lint mereka (B2), supaya satu
  berkas tidak dua kali lewat gerbang CI.
- Pertimbangkan dokumen agregat harian (counter per mapel/bab) bila bank
  soal melewati ±5.000 butir: membaca 1 dokumen pengganti membaca 5.000.
