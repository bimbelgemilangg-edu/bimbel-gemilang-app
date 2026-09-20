# Gemilang Reader Experience

Dokumen ini mencatat checkpoint pertama pengembangan buku digital Gemilang pada branch `feat/reader-experience-v1`. Tujuannya bukan mengganti sistem buku yang sudah ada, melainkan menambahkan pengalaman membaca di atas fondasi yang sudah berjalan.

## Temuan audit

Repository saat ini sudah memiliki rak buku siswa, daftar bab dari Firestore, reader PDF berbasis `pdfjs-dist`, renderer HTML interaktif berbasis Shadow DOM, MathText/KaTeX, progress bacaan, quiz pemantapan, penyimpanan XP, dan mode presentasi guru pada materi HTML. Model data utama menggunakan `buku_digital/{bukuId}/bab/{babId}` serta progress siswa pada `siswa_buku_progress/{studentId}_{babId}`.

Masalah pengalaman yang paling terasa bukan ketiadaan fitur, tetapi pemisahan alur yang belum cukup kuat. Reader masih terasa seperti halaman aplikasi dengan tombol, belum seperti ruang baca. Siswa juga belum memiliki kontrol baca yang konsisten, posisi baca terakhir yang mudah ditemukan, serta transisi yang jelas dari membaca menuju pemahaman dan latihan.

## Perubahan checkpoint v1

Perubahan pertama bersifat aditif dan tidak mengubah route atau schema Firebase.

1. Reader memiliki tema **Kertas**, **Sepia**, dan **Malam**.
2. Preferensi tema dan ukuran teks disimpan secara lokal pada perangkat.
3. Materi terstruktur dapat dibaca dalam mode gulir atau mode halaman.
4. Daftar isi bab dapat dibuka dari toolbar reader.
5. Siswa dapat menandai posisi bacaan dan melanjutkan dari rak buku.
6. Reader PDF menyimpan indeks halaman terakhir dan mendukung tombol panah kiri/kanan pada keyboard.
7. Perpindahan halaman PDF memiliki transisi singkat agar terasa seperti membalik halaman.
8. Rak buku memiliki pencarian judul, mata pelajaran, dan deskripsi.
9. Smoke test halaman login lama tetap berhasil. Build production Vite berhasil. Lint pada file yang diubah berhasil.

## Batas kompatibilitas

Mode lama tetap dipertahankan. Bab `pdf`, bab `html`, dan bab terstruktur tetap memilih renderer yang sama seperti sebelumnya. Kuis, progress Firestore, XP, mode guru, dan route `/siswa/buku` tidak dihapus. Penyimpanan posisi baca yang baru bersifat lokal dan tidak memengaruhi data akademik atau nilai siswa.

## Arah berikutnya

Checkpoint berikutnya sebaiknya membuat satu bab contoh sebagai **vertical slice** lengkap. Bab tersebut perlu memiliki teks sumber, penjelasan Gemilang, istilah yang dapat diketuk, langkah cepat, uji rumus, latihan singkat, catatan guru, dan aktivitas offline. Setelah satu bab terasa benar di ponsel, tablet, dan desktop, pola tersebut baru diterapkan ke seluruh materi.

CBT sebaiknya dibangun sebagai lapisan berikutnya setelah pengalaman membaca stabil. Renderer HTML saat ini sudah memiliki fondasi pilihan ganda, multi-jawaban, benar/salah, pembahasan terkunci, pencatatan jawaban, dan mode presentasi guru. Fondasi itu dapat diarahkan ke bank soal CBT tanpa memasukkan logika ujian ke dalam isi buku utama.

## Perintah verifikasi

```bash
npm run build
npx eslint src/pages/student/gemilang/BukuBacaPage.jsx \
  src/pages/student/gemilang/BukuInteraktifPage.jsx \
  src/components/buku/ReaderControls.jsx
```

`npm run lint` seluruh repository masih melaporkan utang teknis lama pada banyak file di luar fitur buku. Karena itu, validasi checkpoint ini menggunakan lint terarah pada file yang diubah dan build production penuh.
