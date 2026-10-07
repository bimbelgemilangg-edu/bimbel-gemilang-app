# KAJIAN PASAR MODUL SCAN — PDF "02 Kinematika @my99dreams"

> Dibuat 2026-10-07 atas permintaan owner: *"ini pdf yang aku upload di
> gemini, kamu pelajari dulu, pastikan struktur soal kita suport dengan
> gambar, posisi gambar, dan jawaban. Ibaratnya kamu harus pelajari
> pasarnya sebelum jualan."*
>
> Status: **PASAR SUDAH DIAUDIT, TOKO SUDAH DIRENOVASI** — semua pola yang
> ditemukan di PDF ini kini didukung jalur impor Gemini (PR cabang
> `fitur/gambar-posisi-penuh`). Yang masih pekerjaan MANUAL ditulis jujur
> di bagian 4.

## 0. Cara kajian dilakukan (jujur, bisa diulang)

- Berkas: `uploads/02 Kinematika @my99dreams.pdf` (10,6 MB).
- PDF dibedah dengan PyMuPDF: 19 halaman, **0 karakter teks** — setiap
  halaman adalah satu gambar scan penuh (1412×2036) plus dua strip
  watermark. Producer: Quartz PDFContext iOS (diekspor dari iPhone).
  Footer menyebut "Page X of 154" → yang diunggah hanya **cuplikan 19
  dari 154 halaman** ebook.
- Karena tidak ada lapisan teks, satu-satunya pembaca berkas ini adalah
  model vision (Gemini) — persis jalur yang sudah kita patenkan.
- Halaman 1, 2, 3, 10, 18, 19 dirender dan dibaca manusia+model untuk
  memetakan pola; render tersimpan di `kinematika-kajian/` (workspace).
- Perilaku pipeline dibuktikan dengan simulasi: keluaran Gemini untuk 3
  pola soal PDF ini dimimitkan (`kajian-kinematika/fixtures-html-gemini.html`)
  dan dijalankan lewat ekstraktor + pemeta bank soal **sebelum** dan
  **sesudah** renovasi (`hasil-sebelum.json` vs `hasil-sesudah.json`).

## 1. Enam pola pasar yang ditemukan di PDF ini

| # | Pola | Contoh di PDF | Dulu (sebelum PR ini) | Sekarang |
|---|---|---|---|---|
| 1 | Halaman **dua kolom**, materi+soal campur, tanpa lapisan teks | hal. 1–19 | bergantung kebaikan hati model | prompt aturan 11: baca kiri lalu kanan, urutan akhir = nomor soal |
| 2 | **Gambar di tengah kalimat soal** ("Perhatikan gambar berikut!") | hal. 10 soal 39/41 | token `{{GAMBAR_n}}` ditempel di AKHIR teks; caption ikut bocor jadi bacaan siswa | token persis di posisi sebut; caption tidak bocor (ekstraktor sadar-region) |
| 3 | **Pilihan berupa gambar** (5 grafik sebagai A–E) | hal. 10 soal 42 | opsi terbaca 1 buah → kartu DITOLAK atau kunci bergeser; grafik menumpuk di akhir soal | satu `<li>` = satu pilihan; gambar diikat ke pilihannya (opsi kaya `{teks, gambar[]}`) — renderer siswa & cetak sudah siap sejak lama |
| 4 | **Diagram di dalam pembahasan** (penjelasan bertahap) | hal. 18 pembahasan 41–42 | gambar pembahasan pindah ke akhir badan soal, caption duplikat | token bernomor masuk `pembahasan`; layar tinjau siswa/guru/admin + lembar kunci tentor merender gambar di posisinya |
| 5 | **Kotak rumus** sebagai gambar (persamaan bervektor, pecahan) | hal. 3, 18, 19 | berisiko diminta "dipotong" seperti diagram → antrean potongan penuh sampah | prompt aturan 5: kotak rumus = TEKS LaTeX `$...$`, bukan gambar |
| 6 | **Tipe soal selain PG biasa**: tabel centang benar/salah per baris, "jawaban benar lebih dari satu", checklist nilai | hal. 10 soal 41/42, hal. 19 soal 51 | enum tipe sudah ada (`benar_salah`, `pg_kompleks`) tapi kunci ganda & tabel centang tidak dipatenkan promptnya | prompt aturan 13 + `data-kunci` koma ("A,D"); tabel centang = matrix-box |

Dua pola pendukung yang ikut dipatenkan:

- **Kode asal soal** tercetak ("TKA 2020/39", "SIMULASI TKA 2025/FISIKA/01",
  "TKA 1992/Rayon B") → prompt aturan 12 wajib menyalinnya ke `q-source`,
  sehingga bank soal menyimpan asal-usul tiap butir (berguna saat owner
  membuktikan soal memang dari ujian resmi).
- **Kunci & pembahasan terpisah di seksi belakang** (hal. 18–19 adalah
  seksi pembahasan untuk soal hal. 10) → sudah dijangkar prompt aturan 1
  sejak lama ("bila kunci tercetak di halaman terpisah, pasang ke nomor
  yang sesuai"); kajian ini mengonfirmasi pola itu memang pola pasar.

## 2. Bukti sebelum/sesudah (simulasi jalur impor)

Sebelum renovasi, simulasi 3 kartu pola PDF ini menghasilkan:

1. badan soal soal benar/salah **tercemar teks pembahasan** (bug pemindai
   kedalaman `blokKelas`: q-body ber-div bersarang tidak pernah "tertutup");
2. teks petunjuk potongan `{{GAMBAR: halaman 10, posisi ...}}` **terbaca
   siswa** di badan soal;
3. soal berpilihan 5 grafik terbaca **1 pilihan** → kesalahan penagihan
   "tipe pg_kompleks tapi opsi terbaca 1";
4. gambar pembahasan **nyasar** ke akhir badan soal.

Sesudah renovasi, simulasi yang sama: 0 kesalahan; 5 pilihan utuh (4
bergambar terikat + 1 penanda jujur menunggu potongan); badan soal bersih;
pembahasan memuat gambarnya sendiri di posisi; antrean potongan berlabel
region ("GAMBAR OPSI PILIHAN") supaya tim tahu gambar itu milik pilihan.

## 3. Yang TIDAK berubah (sengaja)

- Ribuan soal lama tanpa placeholder tetap menaruh gambar di akhir teks.
- Tangga gambar asli (cari dulu → potong presisi → dilarang membuat)
  tidak dilunakkan; justru kini tahu region mana yang meminta potongan.
- Enum tipe, kontrak 12 field inti, dan larangan keamanan tidak berubah.

## 4. Pekerjaan MANUAL yang jujur harus diketahui owner

1. **Antrean potongan**: grafik/diagram yang tidak ditemukan versi
   beredar persis+HD tetap harus dipotong manusia dari berkas scan asli
   (petunjuk presisi sudah tersimpan per soal, kini berlabel region).
2. **PDF ini cuplikan**: 19 dari 154 halaman. Impor penuh butuh berkas
   lengkap — dan lihat poin 4.
3. **Kunci terpisah seksi belakang** berarti Gemini harus menerima soal
   DAN seksi pembahasan sekaligus dalam satu sesi; kalau diunggah
   terpisah, kunci tidak akan tertempel (sistem menolak kartu tanpa
   kunci, jadi tidak akan lolos diam-diam).
4. **Catatan hak cipta (jujur, bukan nasihat hukum)**: berkas ini
   scan ebook berwatermark "scanned by @my99dreams | Personal use only"
   dan dijual lewat nomor WA. Memakainya sebagai bahan latihan internal
   bimbel masih wilayah abu-abu; menjual ulang/modul berbrand bimbel
   dari isi scan ini berisiko. Untuk pola/strukturnya kita belajar (itu
   tujuan kajian ini); untuk isinya, prioritas tetap modul buatan tentor
   sendiri atau soal ujian resmi yang memang beredar publik.
5. **Rumus OCR**: LaTeX hasil ketikan ulang model vision bisa salah
   tipis (indeks/pecahan). Layar pratinjau impor menampilkan rumus
   terender — minta tentor memeriksa sekilas sebelum diterbitkan.

## 5. Renovasi yang lahir dari kajian ini (cabang `fitur/gambar-posisi-penuh`)

- `src/utils/ekstrakHtmlGemini.js`: pemindai kedalaman diperbaiki;
  tokenisasi gambar sadar-region (badan/opsi/pembahasan); satu `<li>` =
  satu pilihan; caption/petunjuk tidak bocor; opsi kaya `{teks, gambarRefs}`.
- `src/utils/imporHtmlGeminiKeBank.js`: `gambarRefs` diselesaikan jadi
  `gambar[{url,...}]` sejajar `gambarUrls` sebelum masuk Firestore.
- `src/utils/penempatanGambar.js`: token bernomor menghormati angkanya
  (pembahasan `{{GAMBAR_3}}` memakai gambar ke-3, bukan gambar pertama);
  gambar sisa hanya menempel di region-nya sendiri bila meta tersedia.
- Renderer: pembahasan bergambar di TryOutView siswa, pantau tentor,
  hasil admin, terbit try out; mesin cetak mencetak gambar pilihan DAN
  gambar pembahasan di lembar kunci tentor.
- Prompt paten: aturan 5 (kotak rumus = LaTeX), 11 (dua kolom), 12
  (q-source), 13 (multi-centang), region gambar di aturan 2, pemeriksaan
  diri poin (f); varian konversi ulang mempertahankan region warisan.
- Tes: +12 kasus baru (ekstraktor 32, penempatan 14, impor 15, prompt 20)
  — seluruh suite hijau.
