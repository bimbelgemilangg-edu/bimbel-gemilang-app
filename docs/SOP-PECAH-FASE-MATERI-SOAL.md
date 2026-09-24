# 🧩 SOP PECAH FASE: MATERI DULU, SOAL KEMUDIAN (Turn 68)

> Lahir dari evaluasi owner Turn 68: *"kamu masih asal nempel... aku mau kamu
> ahli pendidikan profesional, educator bimbel... soal ujian harus sesuai dengan
> pdf itu... selama ini soal masih ngarang gambar, gak ada di soal membuat
> missed information, terkesan memaksakan... kalau kesusahan ya pecah aja
> workflow-mu: habis buat materi, baru buat soal."*
> Berlaku permanen untuk semua mapel/bab, menggantikan pola lama
> "satu turn langsung materi+soal".

## 0. Prinsip pendidik (bukan penempel)

1. **Materi = cerita beruntut**: tiap subbab mengalir
   analogi sehari-hari -> konsep -> visual ASLI/HD -> cara membaca visual ->
   tabel/rumus -> CONTOH terpecah langkah -> kaitan ke subbab lain.
   Tidak boleh ada lompatan: siswa tidak pernah diminta memakai alat yang
   belum diperkenalkan.
2. **Soal = alat ukur, bukan hiasan**: setiap soal menguji keterampilan yang
   MEMANG diajarkan di materi, dan sebaliknya setiap keterampilan inti punya
   minimal satu soal.
3. **Swasembada informasi**: soal wajib bisa dijawab HANYA dari teks soal +
   gambar yang TERLAMPIR di soal. Dilarang merujuk "gambar berikut/ilustrasi
   berikut" tanpa field `soalGambar` yang benar-benar tampil. Dilarang
   merujuk gambar yang hanya ada di bagian materi.
4. **Sumber soal berjenjang & jujur** (melanjutkan SKILL §1):
   (1) bank soal owner (PDF "Gercep TKA 26 Kimia" @my99dreams: FR, Simulasi
   1-2, Prediksi + kunci jawabnya) dan dokumen resmi Pusmendik — ditranskrip
   VERBATIM berlabel; (2) soal buku/modul berlabel; (3) Gemilang Drill hanya
   untuk menutup celah format, selalu berlabel jujur.
5. **Gambar soal = bagian dari soal**: bila PDF sumber memuat gambar/grafik/
   tabel untuk soal itu, gambar WAJIB ikut: crop 300 dpi bbox tinta dari PDF
   sumber -> unggah Supabase ber-kredit -> pasang sebagai `soalGambar`
   (stimulus) dan/atau `pembahasanGambar` (lapis beranotasi). Bila sumber
   tanpa gambar tetapi soal butuh data, TIM menggambar stimulus sendiri
   (canvas, palet SKILL) — dan keterangan stimulus ditulis di teks soal.

## 1. FASE A — MATERI (turn terpisah)

1. Riset sumber: buku/PDF materi + matriks TKA; petakan halaman.
2. Tulis sections VERSI DALAM mengikuti KAIDAH (anatomi visual lengkap).
3. Visual: hierarki buku sumber -> Commons HD ber-kredit -> canvas penunjang
   (WAJIB berlabel penunjang di daftarPustaka).
4. Gerbang FASE A: validator hijau + cek "alur baca" satu subbab dari kaca mata
   siswa SMP-SMA: adakah kalimat yang memakai istilah sebelum dijelaskan?
   Adakah visual tanpa pengantar/poin membaca? Perbaiki dulu.
5. Commit branch konten-<bab>-materi. STOP. Jangan sentuh soal.

## 2. FASE B — SOAL (turn terpisah, setelah FASE A direview)

1. Inventaris bank soal owner per bab: nomor, bentuk, kunci, halaman gambar.
2. Transkrip verbatim (teks + gambar crop + kunci dari file kunci jawaban).
   Kunci TIDAK boleh ditebak; bila kunci tidak ada di sumber, soal TIDAK dipakai.
3. Petetakan tiap soal ke fokus subbab FASE A; tandai keterampilan yang diuji.
4. Lengkapi 6 format TKA; drill penutup celah ditulis LAST, berlabel jujur,
   dan stimulusnya digambar tim bila perlu.
5. Gerbang FASE B (wajib lulus semua sebelum commit):
   - [ ] setiap menyebut gambar/grafik/tabel => `soalGambar` terisi URL HEAD 200;
   - [ ] setiap `soalGambar` dibuka & diverifikasi visual: semua label terbaca,
         tidak terpotong, resolusi cukup (lebar >= 1000 px);
   - [ ] kunci dicocokkan ulang dengan file kunci sumber (bukan memori);
   - [ ] pembahasan menyebut LANGKAH, bukan hanya jawaban;
   - [ ] audit otomatis: skrip cek "soal menyebut gambar tanpa soalGambar" = 0.
6. Commit branch konten-<bab>-soal (terpisah dari branch materi).

## 3. FASE C — UJI BACA & UX (turn kecil, opsional terpisah)

1. Impor staging, baca ulang bab sebagai siswa di HP & proyektor.
2. Cek UX reader: gambar tidak raksasa/pecah, caption terbaca, kotak contoh
   dan callout konsisten; catatan UI masuk branch sistem terpisah.

## 4. Peta sumber bank soal owner (unduh Turn 68, folder Drive
   `1Kbe7_3suEOAsvltlTznEfa2XCB7qp7ba`, "Gercep TKA 26 Kimia @my99dreams")

| File | Isi | Pakai untuk |
|---|---|---|
| 01 Ringkasan Materi | ringkasan konsep | cross-check FASE A |
| 02 FR + 03 Pembahasan FR | fokus review + kunci | FASE B (soal per topik) |
| 04 Simulasi 1 + 05 Pembahasan | paket simulasi + kunci | FASE B (paket ujian) |
| 06 Simulasi 2 + 07 Pembahasan | paket simulasi + kunci | FASE B |
| 08 Prediksi + 09 KJ Prediksi | prediksi + kunci jawaban | FASE B |
| 10 Daftar Pustaka | rujukan penulis bank | kredit daftarPustaka |
| 11-14 Bonus (Prediksi US, Simulasi US 1-2, Simulasi) | tambahan | cadangan bab 6 |

Label pemakaian: `Bank Soal Gercep TKA 26 Kimia (@my99dreams) — <file> no. <n>`
(izin pemilik diberikan owner Gemilang via folder Drive bersama).
