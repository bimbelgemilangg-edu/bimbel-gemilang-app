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

## Wacana panjang: pita lebar penuh (2026-10-09)

Owner mengirim PDF hasil cetak (`Bimbel Gemilang System test.pdf`) dan meminta:
"perkecil font bacaan dan rapikan agar muat kanan kiri atau khusus bacaan
panjang gausah kanan kiri".

Yang diukur dari PDF itu (A4, margin 10 mm, isi kertas habis ~289 mm):

| halaman | isi | akibat di kertas |
|---|---|---|
| 1 | wacana dialog 184 mm di kolom kanan | kolom kiri hanya berisi kop; tabel Benar/Salah berakhir di y=295 mm (menabrak kaki halaman) |
| 2 | cerpen 272 mm di kolom kiri | opsi (A) dan (B) jatuh di y=285–298 mm → **terpotong tepi kertas** |
| 3 | wacana perundungan dapat satu kolom sendirian | melebar penuh → justru halaman paling rapi |

Aturan baru (semua di `src/utils/naskahSoal.js`):

1. **Ambang panjang** = `AMBANG_BACAAN_PANJANG` × kapasitas kolom (62% ≈ 166 mm
   di A4). Blok bacaan di atas ambang, atau blok apa pun yang lebih tinggi dari
   satu kolom, naik ke **pita lebar penuh** (`div.nsk-band`) di atas halaman.
2. Soal-soal sesudahnya tetap **dua kolom di bawah pita** — urutan alami
   "baca dulu, baru kerjakan", dan tidak ada halaman yang separuhnya kosong.
3. **Kop menumpang pita** bila masih muat, supaya tidak ada halaman yang isinya
   cuma kepala dokumen.
4. Tinggi pita diukur browser pada **lebar isi kertas** (lapisan ukur kedua di
   `CetakPaketLatihan.jsx`). Sebelum pengukuran tiba dipakai taksiran
   `FAKTOR_TINGGI_LEBAR_PENUH` (0,55) yang sengaja melebihkan — arah yang aman.
5. Huruf bacaan di dalam kolom **diperkecil 10,5 pt → 9,5 pt** dan barisnya
   dirapatkan (1,55 → 1,45); di pita dipakai 10 pt karena barisnya panjang.
6. Wacana yang bahkan setelah dilebarkan masih lebih dari satu halaman membuat
   halamannya **mengalir** (`nsk-hal--luapan`, tinggi otomatis) dan guru diberi
   peringatan di layar — teks tidak pernah diam-diam terpotong.

Yang **dicabut**: perilaku lama "butir raksasa diberi satu kolom utuh".
Penggantinya: pita lebar penuh di atas. Alasannya ada di tabel pengukuran di
atas — kolom utuh tetap meluber dan membuang separuh halaman. Uji lamanya
diperbarui di `tests/naskahSoal.test.mjs`, perilaku baru dijaga
`tests/bacaanLebarPenuh.test.mjs` (21 uji).

Biaya yang jujur: paket yang dulu 3 halaman (dengan opsi terpotong) bisa jadi 4
halaman. Yang dikejar adalah tidak ada satu huruf pun yang hilang di kertas.

## Batas jujur fitur ini

- Pratinjau memakai font browser guru; tinggi cetak bisa meleset ±1mm, sudah
  disediakan slack 2mm per kolom (`SLACK_KOLOM_MM`).
- Gambar yang sumbernya mati (URL terhapus) tetap tampil sebagai kotak kosong
  di pratinjau — sistem tidak pernah mengarang gambar pengganti.
- Dialog cetak browser tetap berwewenang terakhir atas kertas/margin; karena
  itu halaman mengingatkan memilih kertas yang sama dengan pilihan di layar.
