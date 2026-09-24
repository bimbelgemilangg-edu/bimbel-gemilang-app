# 🎓 KAIDAH PENULISAN MATERI GEMILANG — Standar Tim Kurikulum (Pakar Pendidikan)

> Berlaku permanen untuk SELURUH materi materi-v2 (semua mapel/bab).
> Lahir dari evaluasi owner Turn 59: *"kamu gak hanya asal tempel — harus ada
> penjelasan sesuai materi; fungsi bimbel membuat anak MEMAHAMI; penulisan
> materi harus rapi."*
> Pendamping: `WORKFLOW MATERI DALAM` (Turn 36) & `PATOKAN 6 FORMAT SOAL` (Turn 39).

## 1. Prinsip dasar: memahami, bukan menempel

1. **Setiap visual adalah alat berpikir**, bukan hiasan. Gambar ditempel HANYA
   jika ada kalimat yang memakainya: pengantar sebelum, pembacaan sesudah.
2. **Beban kognitif dijaga**: satu paragraf satu gagasan; satu poin satu fakta;
   tabel maksimal ±7 baris sebelum dipecah.
3. **Bahasa siswa**: kalimat aktif, istilah teknis langsung dijelaskan pada
   kemunculan pertama, singkatan ditulis penuh dulu (mis. *adenosin trifosfat
   (ATP)*).
4. **Jembatan konsep**: setiap sub-bab ditutup kaitan ke sub-bab lain atau ke
   konteks kehidupan/ujian ("Kaitan konsep"), supaya pengetahuan berbentuk
   jaringan, bukan daftar.
5. **Rapi & konsisten**: penomoran sub-bab (A., B.1, B.2 …), ejaan istilah
   konsisten seluruh bab (mis. *tuba fallopi*, bukan campur "oviduk/tuba"
   tanpa penjelasan), tanda panah pakai `->` seragam di teks alur.

## 2. Anatomi wajib setiap visual (gambar/bagan)

Urutan section di draft, TANPA pengecualian:

1. **Paragraf pengantar** (`paragraf`) — mengundang siswa mengamati dengan
   TUJUAN: apa yang harus dicari/dibandingkan pada gambar ("temukan empat
   komponen ini lebih dulu…").
2. **Gambar** (`gambar`) — `url` visual + `keterangan` DESKRIPTIF (membaca
   isi gambar: struktur & hubungan), TANPA baris kredit (kredit hanya di
   `daftarPustaka`, tersembunyi dari siswa).
3. **Poin "🔍 Membaca gambar — <topik>"** (`poin`) — 4–6 butir, tiap butir
   satu label penting: `Label: fungsi/peran satu kalimat`. Butir mengikuti
   arah baca alami gambar (kiri→kanan / luar→dalam / awal→akhir).
4. **Callout "Kaitan konsep — <pesan>"** (`callout`, tipe `tips`) — satu
   pesan integratif: jebakan ujian, perbandingan antar konsep, atau aplikasi
   kehidupan. Boleh diganti `paragraf` bila pesan bukan tips.

Visual berurutan (mis. spermatogenesis lalu oogenesis) WAJIB diberi kalimat
pembanding pada pengantar visual kedua ("bandingkan dengan … perhatikan
perbedaan hasilnya").

## 3. SOP crop gambar sumber (presisi & beresolusi)

1. Sumber hanya: buku paket/modul/BSE ber-kredit (kredit di `daftarPustaka`);
   diagram buatan tim kurikulum hanya sebagai *penunjang*.
2. Render halaman sumber **minimal 300 dpi** (pdfjs + canvas), jangan upscale
   crop lama.
3. Crop memakai **bbox tinta otomatis** (pixel gelap/jenuh) di dalam box kasar
   yang dipilih manual, plus margin kecil — sehingga SELURUH label (kiri,
   kanan, atas, bawah) ikut, dan teks halaman tetangga (judul bab, baris
   "Sumber:", butir teks) TIDAK ikut.
4. **Verifikasi visual wajib**: setiap crop dibuka/dilihat AI sebelum upload;
   cek (a) semua label utuh terbaca, (b) tidak ada potongan judul/baris sumber,
   (c) tidak ada figur tetangga.
5. Baris kredit bawaan gambar (mis. "Sumber: Campbell…") DIPOTONG dari crop;
   kredit cukup di `daftarPustaka`.
6. Nama objek storage ber-versi (`-v2`, `-v3`) agar cache pembaca tidak
   menyajikan file lama; file lama tidak dihapus (bukan wewenang AI).

## 4. Checklist rilis per bab (sebelum PR/impor)

- [ ] Tiap `gambar`/bagan memenuhi anatomi §2 (pengantar, keterangan deskriptif,
      poin membaca, kaitan).
- [ ] Tiap tabel punya paragraf pemakai (sebelum/sesudah) yang menyebut pesan
      tabel, bukan sekadar "perhatikan tabel".
- [ ] Soal diletakkan SESUDAH materi, dipetakan per fokus, campuran asli
      (berlabel sumber) + drill (label "Gemilang Drill"), 6 format TKA.
- [ ] `daftarPustaka` memuat: sumber materi, sumber gambar + kredit, kontribusi
      modul vs AI per bab; tidak ada kredit bocor ke `keterangan`.
- [ ] Validator draft hijau; tidak ada nested array; tidak ada deklarasi kode
      mendahului pemakaian (review urutan deklarasi wajib).
- [ ] Baca ulang satu sub-bab sebagai siswa: apakah tiap gambar kini "berbicara"
      lewat teks? Jika masih terasa tempelan → tulis ulang pengantar/poinnya.

## 5. Contoh penerapan

Bab 4 Biologi (Turn 59): 10 visual direstrukturisasi penuh mengikuti §2 dan 8
crop modul dirender ulang 300 dpi mengikuti §3 — lihat
`docs/drafts/draft-biologi-k12-v3-bab4.json` sebagai referensi emas.

## 6. STANDAR KEDALAMAN MINIMAL PER SUBBAB (Turn 80 — jawaban atas keluhan
"materi kurang dijabarkan & belum kolaborasi buku")

Keluhan owner Turn 80 diakui benar: kecepatan menambah mapel membuat materi
terlalu ringkas. Mulai turn ini SETIAP subbab WAJIB memuat minimal:
1. **2 paragraf konsep** beruntun (analogi sehari-hari -> definisi -> contoh
   mikro), bukan daftar poin semata;
2. **1 visual ber-anatomi KAIDAH** (asli/HD ber-kredit; penunjang hanya bila
   tak ada padanan);
3. **1 tabel/bagan pembanding** berisi (bukan judul saja);
4. **1 contoh terpecah langkah** (Langkah 1..n) yang MENIRU pola soal bank;
5. **1 kartu "RUMUS THE KING"** (callout tipe `gemilang`): satu rumus/kunci
   cepat + satu kalimat cara pakai, gaya kartu emas premium;
6. **1 peringatan jebakan** (callout `peringatan` atau `tips`) berisi kesalahan
   paling umum siswa;
7. **1 kolaborasi buku**: rujukan silang eksplisit ke buku sumber (halaman/
   bab bank owner ATAU buku paket/BSE bila terjangkau) di teks atau
   daftarPustaka — materi tanpa jejak buku dianggap BELUM SELESAI.

## 7. STANDAR UI PREMIUM (Turn 80)

Tampilan baca wajib terasa seperti aplikasi belajar premium (rujukan owner:
Ruangguru, Zenius, Duolingo): kartu membulat 16-18 px, bayangan halus, spasi
longgar, tabel BERBINGKAI + zebra + gulir horizontal di HP, gambar dalam
kartu ber-padding, paragraf max 72ch, dan kartu rumus emas menonjol.
Setiap patch UI diverifikasi lewat screenshot reader mobile sebelum rilis.
