# ALUR CETAK NASKAH GURU (naskah model ujian, dua kolom rapi)

Lahir 2026-10-08 dari arahan owner sambil mengirim tangkapan layar naskah TKA
dua kolom: *"pastikan guru bisa membaca dulu lengkap memilih soal dan sistem
menata layout print seperti ini, rapi dengan gambar disesuaikan tidak terlalu
kecil dan besar, sistem menata secara otomatis, tentor tinggal pilih ukuran
kertas lalu print."*

Halaman: **/guru/cetak-latihan** (`CetakPaketLatihan.jsx`) — mesin tata letak:
`src/utils/naskahSoal.js` (murni, diuji `tests/naskahSoal.test.mjs`).

## Empat langkah guru

1. **Baca dulu.** Daftar butir ditampilkan LENGKAP (teks utuh + rumus KaTeX +
   gambar + pilihan A–E), bukan potongan 110 huruf. Guru mencentang dengan
   tahu isi soal, bukan menebak.
2. **Pilih gaya & kertas.** Gaya lembar: *naskah model ujian* (kolom rapi,
   bawaan) atau *kotak siap gunting* (perilaku lama untuk buku progres).
   Ukuran kertas: A4, F4/Folio, Letter, A5.
3. **Lihat pratinjau.** Iframe menampilkan dokumen yang PERSIS sama dengan
   yang dikirim ke dialog cetak, lengkap dengan nomor halaman.
   Tab terpisah untuk lembar siswa dan kunci pegangan guru.
4. **Cetak.** Tombol cetak membuka dialog browser; pilih kertas yang sama
   dengan pilihan di layar dan biarkan margin “Default”.

## Keputusan sistem (bukan tebakan mata)

- **Jumlah kolom otomatis**: dua kolom hanya bila lebar kolom ≥ 70mm
  (`kolomOtomatis`); A5 jatuh ke satu kolom. Guru tetap bisa memaksa 1/2 kolom.
- **Ukuran gambar** (`ukuranGambarNaskah`) dihitung dari rasio piksel asli:
  - rasio ≥ 2,2 (grafik melebar): blok sepenuh kolom (95% lebar kolom);
  - rasio 0,8–2,2 (gambar “kotak”): mendampingi teks seperti naskah TKA asli,
    lebar 40% kolom (lantai 30mm, plafon 55mm), tinggi ≤ 48mm;
  - rasio < 0,8 (gambar menjulang): blok di tengah, tinggi ≤ 58mm, lebar
    minimal 26mm supaya detail bertahan di cetak hitam-putih.
  Rasio piksel dibaca dari gambar asli saat dimuat; sebelum itu dipakai rasio
  bawaan 1,3 supaya susunan awal tidak lompat.
- **Pilihan ganda**: pilihan pendek disusun dua kolom, pilihan berupa
  persamaan panjang tetap satu kolom (`kolomPilihanNaskah`).
- **Susunan halaman** (`susunKeKolom`): tinggi tiap butir DIUKUR dari DOM
  lapisan ukur tersembunyi (lebar kolom sesungguhnya), lalu butir dipak ke
  kolom tanpa pernah dibelah; butir yang lebih tinggi dari satu kolom diberi
  kolom utuh sendiri dan diperingatkan ke guru. CSS multi-column sengaja
  TIDAK dipakai karena membelah butir dan menyeimbangkan kolom seenaknya.
- **Nomor halaman** otomatis di kaki tiap halaman; kepala dokumen (judul,
  mapel, identitas Nama/Kelas/No) hanya di halaman pertama lembar siswa;
  lembar kunci selalu berkepala “PEGANGAN GURU — JANGAN DICETAK UNTUK SISWA”.

## Penjaga kualitas

- `tests/naskahSoal.test.mjs` (26 uji): pagar ukuran gambar, kolom tidak
  melebihi kapasitas, urutan butir tidak diacak, kunci tidak bocor ke lembar
  siswa, `@page` mengikuti kertas pilihan.
- `tests/cetakLatihan.test.mjs` tetap menjaga dokumen kotak lama; ketiga
  builder kotak kini menerima `{ kertas }` dengan default A4 (perilaku lama
  tidak berubah).
- Tidak ada fungsi Vercel baru; semua berjalan di browser guru.

## Batas jujur fitur ini

- Pratinjau memakai font browser guru; tinggi cetak bisa meleset ±1mm, sudah
  disediakan slack 2mm per kolom (`SLACK_KOLOM_MM`).
- Gambar yang sumbernya mati (URL terhapus) tetap tampil sebagai kotak kosong
  di pratinjau — sistem tidak pernah mengarang gambar pengganti.
- Dialog cetak browser tetap berwewenang terakhir atas kertas/margin; karena
  itu halaman mengingatkan memilih kertas yang sama dengan pilihan di layar.
