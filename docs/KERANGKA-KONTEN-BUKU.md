# KERANGKA KONTEN BUKU — template, cetak kertas bekas, dan pembagian kerja

**Status:** konsep disepakati owner 2026-10-06 · rujukan bersama admin & tentor
**Visi yang dilayani:** bimbel tidak mencetak buku; **siswa membuat bukunya sendiri**
(gaya kliping). Minggu 1 tentor menjelaskan bab dan siswa membaca materi di HP;
minggu 2 tentor **memilih soal dari bank** dan mencetaknya; siswa menggunting,
menempel di *buku progres* yang disediakan, dan menulis catatan pengerjaan di
sampingnya. Bank soal terus diisi admin sehingga yang tercetak selalu mutakhir.

Dokumen ini membakukan empat hal: **kerangka paket konten**, **spesifikasi aset**,
**aturan cetak ramah kertas bekas**, dan **pembagian kerja luar-vs-dalam aplikasi**.

---

## 1. Kerangka paket konten (per bab)

Satu bab = satu paket konten dengan empat kantong yang WAJIB terpisah:

```
paket-konten/
├── identitas   : mapel, jenjang, kelas/fase, kode bab, judul bab, urutan,
│                 target minggu/pertemuan (skema mingguan)
├── materi      : sections bacaan untuk reader di HP  -> kontrak draft materi
├── latihan     : butir soal                             -> KONTRAK-JSON-BANK-SOAL.md
└── kunci       : jawaban per nomor + pembahasan         -> TIDAK PERNAH ikut cetak siswa
```

- **`latihan` memakai kontrak yang SUDAH ADA dan dijaga validator**
  (`docs/KONTRAK-JSON-BANK-SOAL.md`, 12 field, 5 tipe soal termasuk PG kompleks,
  menjodohkan, isian singkat). Jangan membuat standar kedua.
- **`materi` memakai kontrak draft yang SUDAH ADA** (`scripts/validasi-draft.mjs`).
- Setiap butir menyimpan `sumberHalaman` (halaman PDF aslinya) supaya sengketa
  "soal ini dari mana?" bisa dicek dalam 10 detik.
- **Kunci adalah kantong terpisah**, bukan field yang ikut tercetak. Di PDF model
  (Big Bank B.Inggris Kelas 10) kunci terkumpul di halaman 218 — pemilah harus
  mempertahankannya terpisah, bukan menyebarkannya ke tiap bab.

**Dua jalur masuk, satu muara.** Template adalah bahasa internal, bukan syarat
untuk boleh masuk:
1. **Jalur rapi** — konten sudah sesuai template → lolos validator otomatis,
   hampir tanpa sentuhan.
2. **Jalur mentah** — buku scan/berantakan (seperti PDF proofing 219 halaman) →
   mesin AI (`extractPdfBankSoal.js`, `detectBookChapters.js`, `smartParseQuiz.js`)
   mengonversinya MENJADI template, lalu admin menyetujui per bab di layar
   pratinjau. Jalur ini yang membuat stok PDF lama tetap bernilai.

Kedua jalur bertemu di kontrak yang sama, jadi cetak, reader, dan skoring tidak
pernah peduli dari mana kontennya datang.

---

## 2. Spesifikasi aset (yang dibereskan DI LUAR aplikasi)

Gambar/diagram adalah satu-satunya bagian yang tidak bisa diselamatkan mesin
bila sumbernya buruk. Aturan untuk pekerjaan di luar:

| Aturan | Ambang | Alasan |
|---|---|---|
| Resolusi gambar yang akan DICETAK | sisi terpanjang ≥ 1000 px | di bawah itu garis putus-putus & label kecil jadi bubur saat dipotong-tempel |
| Hasil scan | ≥ 200 dpi, tidak miring > 2° | miring = susah digunting lurus oleh siswa |
| Teks di dalam gambar | tinggi huruf ≥ 20 px | label diagram harus terbaca tanpa kaca pembesar |
| Format | PNG (diagram/garis) atau JPG (foto) | PNG menjaga garis tetap tajam |
| Penamaan | `BAB01-GBR01.png`, `BAB01-SOAL03-A.png` | praflight bisa menautkan gambar ke butir soal tanpa menebak |
| Tanpa watermark pihak ketiga | wajib | buku siswa tidak boleh membawa merek penerbit lain |

**Yang TIDAK perlu dikerjakan di luar** (aplikasi yang melakukannya): memotong
gambar soal dari halaman scan (`PemotongGambar`), kompresi untuk penyimpanan,
konversi warna, penempatan ke butir soal.

Praflight saat upload wajib menolak dengan pesan berbahasa manusia, contoh:
`"BAB03-GBR02.png: 480x360 px, di bawah ambang 1000 px untuk cetak. Ganti sumber
atau tandai butir ini sebagai 'materi HP saja' (tidak ikut cetak)."`
Jalan tengah itu penting: gambar buram yang tetap berharga sebagai bacaan di HP
tidak boleh membuang seluruh bab.

---

## 3. Aturan cetak ramah kertas bekas

Kertas bekas hanya bermanfaat kalau layout-nya mengakui bahwa sisi belakangnya
berisi noise. Aturan wajib untuk mesin cetak (Fase 3):

1. **Satu muka saja.** Tidak ada duplex. Sisi belakang diasumsikan ramai.
2. **Setiap butir = satu kotak berborder tegas** (≥ 1,5 pt) dengan **nomor besar**
   di sudut kiri-atas. Batas kotak harus thắng melawan tulisan lama di belakangnya.
3. **Garis potong putus-putus di tepi kotak**, margin luar ≥ 10 mm supaya gunting
   tidak memakan nomor soal.
4. **Tanpa background berwarna/abu-abu dan tanpa blok hitam pekat.** Hemat toner,
   dan tetap terbaca di atas kertas yang sudah bertinta.
5. **Tiga keluaran per paket, selalu terpisah:**
   - `PAKET-SISWA.pdf` — kotak soal siap gunting, TANPA kunci
   - `KUNCI-TENTOR.pdf` — berkepala "PEGANGAN TENTOR — JANGAN DICETAK UNTUK SISWA"
   - `LEMBAR-CATATAN.pdf` — kolom tanggal / langkah pikir / kesimpulan, untuk
     ditempel bersebelahan dengan soal (ini yang mengubah kliping menjadi belajar)
6. Ukuran kotak dirancang agar muat dipotong dari A4 bekas mana pun: maksimal
   setengah halaman per butir untuk soal ringan, satu halaman untuk soal
   berbacaan panjang.

### ⚠️ Kertas bekas mana yang BOLEH

| Boleh | TIDAK boleh |
|---|---|
| jadwal lama tanpa nama, draft internal, surat/kontrak tanpa identitas, kertas uji printer | **absensi berisi nama siswa**, kwitansi/finance, berkas pendaftaran, apa pun yang memuat data pribadi atau angka uang |

Alasannya bukan estetika: lembar soal menempel di buku yang **dibawa pulang dan
diperlihatkan ke orang tua**. Sisi belakang yang memuat nama teman sekelas atau
angka keuangan berarti menyebarkan data pribadi lewat buku pelajaran. Kertas
berdata pribadi masuk shredder, bukan mesin print. (Ini sejalan dengan sikap
repo terhadap data siswa di `docs/KEPUTUSAN-RISIKO-FIRESTORE.md`: risiko boleh
dipilih sadar, tapi tidak boleh bocor diam-diam lewat saluran yang tidak dilihat.)

---

## 4. Pembagian kerja luar vs dalam aplikasi

| Pekerjaan | Di mana | Kenapa |
|---|---|---|
| Memilih bab & urutan pertemuan | luar (keputusan pedagogis) | mesin tidak tahu kapan kelas ini siap |
| Mengganti gambar sumber yang buram | luar | mesin tidak bisa menciptakan detail yang tidak ada |
| Menulis/memeriksa pembahasan | luar | isi akademik adalah tanggung jawab tentor |
| Memotong gambar soal dari halaman scan | dalam (`PemotongGambar`) | presisi piksel, membosankan bagi manusia |
| Kompresi & konversi format | dalam | konsisten otomatis |
| Validasi kontrak JSON & praflight aset | dalam (validator + pesan manusia) | gerbang mutu yang tidak bisa lelah |
| Konversi PDF mentah → template | dalam (mesin AI) + approve admin per bab | kecepatan mesin, kendali manusia |
| Menyusun & mencetak paket per tentor | dalam (Fase 3) | tiap tentor butuh campuran berbeda |
| Mencatat & memotret buku progres | dalam (Fase 4, kamera #130) | monitoring tanpa menambah kertas |

Prinsipnya satu kalimat: **manusia memutuskan isi, mesin mengerjakan mekanika.**

---

## 5. Alur mingguan yang dilayani kerangka ini

```
MINGGU 1  tentor menjelaskan bab N
          siswa membaca materi bab N di HP (reader, fidelity 100%)
MINGGU 2  tentor membuka Bank Soal -> saring bab N + minggu 2 -> pilih n butir
          cetak PAKET-SISWA (kertas bekas yang BOLEH) + simpan KUNCI-TENTOR
          siswa gunting -> tempel di buku progres -> tulis di LEMBAR-CATATAN
AKHIR     tentor memotret halaman buku progres (kamera #130) -> ceklist mutu:
          "catatan ada", "pembahasan ditulis ulang", bukan sekadar tempel
          admin melihat rekap per siswa per pertemuan
```

Buku progres yang selesai satu semester adalah **artefak kemajuan** yang bisa
diperlihatkan ke orang tua — sesuatu yang tidak pernah bisa diberikan buku cetak
bekas pakai, dan tidak bisa diberikan aplikasi murni digital.

---

## 6. Checklist praflight admin (sebelum upload paket konten)

1. Identitas lengkap: mapel, kelas/fase, kode bab, target minggu.
2. `latihan` lolos `KONTRAK-JSON-BANK-SOAL.md` (validator akan menegaskan).
3. Setiap butir punya kunci; butir bertipe esai ditandai untuk penilaian manual.
4. Kunci TIDAK menempel di berkas siswa mana pun.
5. Semua gambar cetak ≥ 1000 px; yang buram ditandai "HP saja" atau diganti.
6. Penamaan gambar mengikuti pola `BABxx-...` dan tertaut ke butirnya.
7. `sumberHalaman` terisi untuk setiap butir yang berasal dari PDF.
8. Tidak ada watermark/merek penerbit lain di aset.
9. Jumlah butir wajar per pertemuan (20–30) supaya paket muat 4–8 halaman A4.
10. Satu orang kedua membaca acak 3 butir + pembahasannya sebelum paket dirilis.
