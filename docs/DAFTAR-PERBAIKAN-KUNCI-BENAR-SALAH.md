# PERBAIKAN KUNCI BENAR/SALAH — LAPORAN SELESAI (2026-10-06)

## Status akhir
- 194 soal teridentifikasi kehilangan kunci per-baris saat impor.
- **193 soal (272 baris) sudah diisi kunci oleh tim IT (AI)**: diturunkan dari
  pembahasan impor + verifikasi hitung independen pada soal matematika/kimia.
  Field `kunciTerverifikasi` SENGAJA dibiarkan false dan tiap dokumen diberi
  `catatanAdmin` penanda -- guru mapel tetap disarankan memeriksa ulang,
  prioritas: soal ber-flag di bawah.
- **1 soal TIDAK bisa diturunkan**: `8LMwO20rq8qATUQKtOXn` (Bahasa Indonesia)
  -- pembahasan sumber menyatakan grafiknya tidak memuat negara yang ditanya.
  Baris tanpa kunci otomatis KELUAR dari penilaian (aturan keadilan), jadi
  siswa tidak dirugikan; guru perlu memutuskan nasib soal ini sendiri.
- 3 soal punya baris kosong SENGAJA: header tabel kategori
  (`IETGps4M9nijIW3KdBJL`, `nV190ev4fX3G5WXhw4p0`) dan baris
  "tidak dicentang kolom mana pun" (`OCrROwxXC8jhsE7Cz22K`).

## Prioritas verifikasi ulang oleh guru (keyakinan sedang)
- `KEqrm4u6QU4wz6O2ieRQ` baris 3 — pembahasan sumber terpotong;
  diisi Benar berdasarkan pola teks AI-di-pendidikan (risiko disebut di teks).
- `gJBE2C85duBUrUzFfGrg` baris 5 — pembahasan sumber terpotong;
  diisi Benar (pernyataan moral umum sesuai genre teks).
- `oVholm6QLIMU75F3uURP` baris 3 — pembahasan sumber terpotong;
  diisi Benar (detail latihan usia tujuh tahun lazim di teks Fahombo).
- Seluruh soal Kimia/Sosiologi/B.Inggris multi-baris: kunci diturunkan dari
  pembahasan impor yang menyebut urutan putusan; cek cepat dianjurkan.

## Cara memeriksa
Admin → Bank Soal & Perkakas → Mesin Bank Soal → cari ID atau teks soal.
Catatan audit 2026-10-05 di tiap dokumen menjelaskan isi yang dulu hilang;
hapus catatan itu setelah guru selesai memverifikasi.

### TIDAK TERSELESAIKAN — 8LMwO20rq8qATUQKtOXn (Bahasa Indonesia)
Soal: Bacalah pernyataan-pernyataan berikut tentang rasio utang beberapa negara terhadap PDB-nya berdasarkan grafik. Berilah tanda centang (✓) pada kolom Benar atau Salah!
  - [0] Selisih rasio utang antara Jepang dan Amerika Serikat lebih dari 120%.  -> kunci KOSONG (dibiarkan)
  - [1] Perbedaan rasio utang antara Yunani dan Prancis lebih kecil dibandingkan selisih Italia dan Kanada.  -> kunci KOSONG (dibiarkan)
  - [2] Korea Selatan memiliki selisih rasio utang lebih dari 100% jika dibandingkan Jepang.  -> kunci KOSONG (dibiarkan)
  - [3] Rasio utang Jerman hampir dua kali lipat lebih kecil dari Italia.  -> kunci KOSONG (dibiarkan)
  - [4] Kanada memiliki rasio utang yang lebih tinggi dari Korea Selatan dan Jerman jika digabungkan.  -> kunci KOSONG (dibiarkan)
