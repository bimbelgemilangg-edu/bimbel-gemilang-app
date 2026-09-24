# 🎯 SKILL: MENCARI SOAL & GAMBAR PRESISI — SOP Tim Kurikulum Gemilang

> Berlaku permanen untuk semua mapel/bab (pendamping `KAIDAH-PENULISAN-MATERI-GEMILANG.md`).
> Lahir Turn 60 dari permintaan owner: *"tambahkan skill mencari soal dan gambar nya yang
> presisi dan jelas, support jawaban bergambar, atau pembahasan dengan gambar juga."*
> Inti skill ini: **soal harus bersumber jujur & berkunci, gambar harus utuh-terbaca &
> beresolusi, dan gambar boleh (bahkan dianjurkan) menjadi bagian JAWABAN/pembahasan.**

## 1. Mencari SOAL: hierarki sumber & kejujuran label

Urutan wajib saat berburu soal (dari yang paling otoritatif):

1. **Dokumen resmi Pusmendik/Kemendikdasmen** (matriks + contoh soal TKA berkunci).
   Kutip verbatim, label sumber persis: `Contoh Soal Resmi TKA Biologi no. X — Pusmendik
   Kemendikdasmen`. Kunci TIDAK boleh ditebak: ambil dari dokumen resmi.
2. **Soal ujian berlabel tahun** (UN/UTBK/ASPD dsb.) bila salinan lengkap (teks + gambar +
   kunci) terverifikasi dari >=1 sumber; label: `UN SMA Biologi <tahun> no. <n> via <situs>`.
   Bila gambar stimulus tidak terjangkau sandbox → JANGAN dipasang setengah (doktrin Turn 32).
3. **Modul internal tentor** ("Soal Pengantar" per topik) — label
   `Soal Pengantar Modul Tentor Gemilang (internal)`; kunci diverifikasi ulang tim kurikulum.
4. **Gemilang Drill** — latihan orisinal sistem bila sumber asli tak tersedia/tak lengkap.
   Label jujur `Gemilang Drill (...)` WAJIB; dilarang menyamar sebagai soal ujian.

Aturan mutu isi soal:

- Setiap bab 15-20 soal, memuat **6 format TKA** (PG, PGK tabel, PGK-MCMA, menjodohkan,
  isian singkat, uraian) — patokan mutlak Turn 39.
- Soal keterampilan proses/proses sains WAJIB membawa stimulus data (tabel/grafik/skema
  alat) bila konteksnya pengukuran — soal tanpa data untuk topik data = tidak presisi.
- Simpan provenance di field `sumber` tiap soal (tampil hanya untuk admin, tidak ke siswa).

## 2. Mencari GAMBAR: hierarki sumber & larangan hotlink

1. Sumber visual materi HANYA: buku paket/modul/BSE ber-kredit (kredit disimpan di
   `daftarPustaka`, tersembunyi dari siswa). Diagram buatan tim kurikulum = *penunjang*.
2. Alat pencari (`image_search`/`web_search`/`fetch_page`) boleh dipakai untuk FASE
   PENEMUAN: mengetahui gambar apa ada di buku/halaman mana, membandingkan kandidat
   sumber, atau menemukan salinan teks soal resmi. **Aset final TIDAK boleh di-hotlink**
   dari web: selalu dirender ulang dari PDF buku lokal di sandbox.
3. Peta halaman sumber dicatat di dokumen riset (mis. modul tentor: PDF = cetak + 4;
   BSE K12 2022: Gambar 1.3 hal 6, 1.7 & tabel katalase hal 11, 1.8 & tabel 1.4 hal 12,
   1.27 hal 41) supaya crop berikutnya tidak meraba-raba.

## 3. Pipeline presisi crop (render → bbox tinta → verifikasi → rilis)

1. Render halaman sumber **300 dpi** dengan `render-hi.mjs` (pdfjs-dist legacy +
   @napi-rs/canvas): `node render-hi.mjs autocrop <hal> 300 <rx> <ry> <rw> <rh> <margin> <out> --pdf <file>`.
   Koordinat box kasar dalam satuan dpi-150; peroleh dari kontak sheet kecil dulu
   (ingat kurangi offset sel kontak sheet sebelum konversi!).
2. Crop memakai **bbox tinta otomatis** (pixel gelap/jenuh) di dalam box kasar + margin,
   sehingga label kiri/kanan/atas/bawah ikut, sedangkan judul bab, baris "Sumber:",
   garis putus pembatas halaman, dan chip nomor halaman TIDAK ikut.
3. **Iterasi sampai bersih**: bila hasil masih memotong label atau menyeret teks tetangga,
   perkecil/perbesar box kasar lalu render ulang. Bila elemen pengganggu tetap masuk bbox
   (mis. garis putus berwarna jenuh), potong manual pasca-crop dengan canvas.
4. **Verifikasi visual WAJIB** setiap crop: susun kontak sheet berlabel lalu LIHAT
   (read_file). Checklist: semua label utuh terbaca; tidak ada caption/paragraf tetangga;
   tidak ada figur/garis halaman lain; resolusi cukup (lebar >= ±1000 px untuk proyeksi).
5. Unggah ke Supabase bucket `materi-bimbel` dengan skrip upload (header publishable key +
   `x-upsert`), lalu **verifikasi HEAD 200 + content-length** untuk tiap URL publik.
6. Nama objek ber-versi (`-v2`, `-v3`, atau prefix bab) agar cache pembaca tidak menyajikan
   file lama; file lama tidak dihapus (bukan wewenang AI).

## 4. Gambar stimulus soal & pembahasan beranotasi (jawaban bergambar)

Untuk soal orisinal (Gemilang Drill) yang butuh data, TIM KURIKULUM menggambar sendiri
stimulusnya dengan @napi-rs/canvas (font Liberation Sans dari pdfjs-dist/standard_fonts):

- **Lapis stimulus (bersih)**: grafik/tabel/skema tanpa anotasi jawaban — sumbu berlabel +
  satuan, legenda, grid tipis; lebar >= 1900 px; palet konsisten (biru #1E9BF0 keluarga,
  hijau #16A34A, amber #D97706, merah #DC2626 khusus anotasi).
- **Lapis pembahasan (beranotasi)**: salinan stimulus + penanda cara membaca: bingkai/
  lingkaran merah pada titik kunci, panah penunjuk, kotak keterangan satu kalimat
  ("tarik garis mendatar dari puncak bar ke sumbu y -> 19"). Inilah wujud fitur
  **pembahasan bergambar**.
- Verifikasi visual keduanya sama wajibnya dengan crop (kontak sheet + lihat).

Skema field soal (didukung sistem sejak Turn 60):

| Field | Isi | Tampil di |
|---|---|---|
| `soalGambar` | URL stimulus (grafik/tabel/skema) | reader siswa, panggung guru, editor admin |
| `pembahasan` | teks penjelasan | semua cabang umpan balik |
| `pembahasanGambar` | URL gambar beranotasi | reader (benar/sebagian/salah/referensi uraian) + panggung saat kunci tampil |
| `pembahasanGambarKet` | keterangan cara membaca gambar (1 kalimat, gaya "🔍") | di bawah gambar pembahasan |

Aturan pedagogis pembahasan bergambar: gambar pembahasan harus **menunjukkan CARA
membaca/menunjuk bukti**, bukan mengulang stimulus; keterangannya memakai kata kerja
membaca (tarik, lingkari, bandingkan) dan menyebut angka konkret.

## 5. Gerbang kualitas rilis (per bab, sebelum PR/impor)

- [ ] Semua soal berlabel sumber jujur; kunci diverifikasi (bukan tebakan).
- [ ] 6 format TKA lengkap; soal topik data membawa stimulus data.
- [ ] Tiap gambar materi lulus anatomi KAIDAH §2 (pengantar -> gambar -> poin membaca -> kaitan).
- [ ] Tiap crop lulus verifikasi visual + HEAD 200; kredit hanya di `daftarPustaka`.
- [ ] Minimal satu soal per bab memakai `pembahasanGambar` + keterangan (pemodelan fitur).
- [ ] `node scripts/validasi-draft.mjs <file>` hijau; file IMPOR root identik draft repo.

## 6. Peralatan & lokasi

| Alat | Fungsi |
|---|---|
| `/home/user/render-hi.mjs` | render 300 dpi + autocrop bbox tinta (`--pdf` bebas) |
| `/home/user/teks-pdf.mjs` | dump teks halaman PDF untuk memeta letak gambar/tabel |
| `/home/user/bagan5.mjs` | contoh generator bagan/grafik penunjang + lapis anotasi |
| `/home/user/up-b5.mjs` | contoh skrip upload batch + verifikasi HEAD |
| `scripts/validasi-draft.mjs` (repo) | gerbang skema draft |

Riwayat penerapan: bab 4 (Turn 59, crop modul 300 dpi), bab 5 (Turn 60: 6 crop BSE K12 +
6 gambar penunjang/stimulus + 4 lapis anotasi pembahasan; dukungan `pembahasanGambarKet`
di reader/panggung/editor; renderer tabelinfo kini N-kolom).
