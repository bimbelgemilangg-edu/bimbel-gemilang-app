# STANDAR-TKA-2026.md — acuan resmi try out TKA Gemilang

**Ditulis:** 2026-10-24, atas perintah owner: *"sesuai standar nasional terbaru
secara objektif dan sesuai dan tidak mengarang"*.
**Kode:** `src/utils/standarTka2026.js` (struktur), `src/utils/skorSkalaTka.js`
(skala), `src/utils/hitungSkalaSesi.js` (mode), form terbit
(`TerbitkanTryOutPage.jsx`, pemilih "Jenis ujian" + panel standar).
**Uji:** `tests/standarTka2026.test.mjs`, `tests/skorSkalaTka.test.mjs`.

---

## 1. Apa yang RESMI dan dipakai

| Butir standar | Nilai | Sumber |
|---|---|---|
| Mata uji SD/MI & SMP/MTs | Bahasa Indonesia, Matematika | Pusmendik (pusmendik.kemendikdasmen.go.id/tka/) |
| Mata uji wajib SMA/MA/SMK/MAK | Matematika, Bahasa Indonesia, Bahasa Inggris | Pusmendik |
| Mapel pilihan SMA | murid mengambil **2** mapel pilihan | Rumah Pendidikan (Kemendikdasmen) |
| Bentuk soal resmi | PG dan **PGK-MCMA** (jawaban benar lebih dari satu) | Pusmendik, contoh soal kerangka asesmen |
| Skala SMA/SMK 2026 | **200–800**, pembulatan 2 desimal | Kepmendikdasmen No. 56 Tahun 2026 |
| Skala SD/SMP 2026 | **0–100** | Kepmendikdasmen No. 56 Tahun 2026 |
| Predikat Istimewa | skor **≥ 725,00** per mata uji | Kepmendikdasmen No. 56 Tahun 2026 |
| Durasi mapel wajib SMA | **75 menit** (diperpanjang dari 60) | Kepmendikdasmen 56/2026 + Kompas Skola 07-09-2026 |
| Butir mapel wajib SMA | **25 butir** | Pernyataan Kepala Pusat Asesmen Pendidikan (2026): "75 menit … 25 butir" |
| Durasi & butir mapel pilihan SMA | 60 menit, 25 soal | Kompas Skola 07-09-2026 |
| Durasi & butir per mata uji SD/SMP | 75 menit, 30 soal (sebagian soal pusat & daerah) | Pedoman TKA 2026 SD/SMP |
| Survei karakter SD/SMP | 20 menit (di luar mata uji) | Pedoman TKA 2026 SD/SMP |

**Konflik sumber yang DICATAT, bukan disembunyikan:** pedoman awal menyebut
mapel wajib SMA 30 butir; pernyataan Kepala Pusat Asesmen Pendidikan 2026
menyebut 25 butir untuk alokasi 75 menit. Yang dipakai **25** (paling baru &
paling otoritatif), dan keduanya tertulis di field `sumber` konstanta
`SESI_TKA.SMA.wajib`. Bila kelak terbit ralat resmi, cukup satu konstanta
yang diubah.

## 2. Apa yang SENGAJA TIDAK di-encode (karena tidak diterbitkan terbuka)

- **Batas kategori Baik / Memadai / Kurang.** Yang dipublikasikan terbuka hanya
  predikat Istimewa (≥ 725,00). Maka aplikasi hanya menampilkan Istimewa;
  tiga kategori lain TIDAK ditampilkan dan TIDAK ditebak batasnya.
- **Kalibrasi IRT / penyetaraan skor.** Skor resmi TKA maupun UTBK dihasilkan
  penskoran panitia atas butir berkalibrasi rahasia. Semua skala di aplikasi
  ini adalah *skala kebiasaan* hasil pemetaan linear dari persen benar, dan
  setiap hasil membawa `LABEL_SKALA` yang mengatakan persis itu.
- **Jumlah soal try out Gemilang.** Panel standar di form terbit hanya
  MEMBANDINGKAN keranjang admin dengan struktur resmi (mis. "Matematika
  18/30 butir ⚠️") dan menampilkan sumbernya. Ia **tidak** mengoreksi,
  menolak, atau melengkapi isi keranjang otomatis: keputusan isi tetap manusia.

## 3. Istilah yang wajib dipakai di semua permukaan (keputusan owner 2026-10-25)

- **AKURASI** = persentase jawaban benar/proposional (0-100%). Contoh UI:
  "Akurasi jawaban: 64%", chip "akurasi 64%", lencana "Akurasi 64%".
- **SKOR** = angka pada rentang resmi (UTBK-SNBT 100-1000; TKA SMA/SMK
  200-800; TKA SD/SMP 0-100). Contoh UI: "Skor TKA: 586,93".
- Kata "skala" hanya boleh muncul sebagai nama MEKANISME pemetaan di kode
  dan dokumen teknis, TIDAK sebagai label angka di permukaan pengguna.
- Persen TIDAK boleh disebut "skor" di UI mana pun; skor TIDAK boleh
  ditampilkan dengan tanda %.

## 4. Perilaku sistem per jenis ujian

| `jenisUjian` paket | Skala yang ditampilkan | Catatan |
|---|---|---|
| `utbk` | 100–1000 per komponen, total berbobot TPS 50 / LitBI 20 / LitIng 15 / PenMat 15 | lihat `AUDIT` §4i |
| `tka` + jenjang SMA/SMK | 200–800 per mata uji (2 desimal) + predikat Istimewa ≥ 725 | total gabungan = rata-rata skala, berlabel catatan bahwa TKA resmi melaporkan per mata uji |
| `tka` + jenjang SD/SMP | 0–100 (2 desimal) per mata uji | sesuai Kepmendikdasmen 56/2026 |
| `kurikulum` | tidak ada skala; persen saja | alasan jujur ditampilkan |
| kosong / `otomatis` | ditebak dari isi paket (subtes UTBK → utbk; mapel TKA + jenjang → tka; sonst kurikulum) | badge kartu paket menandai "(otomatis)" |

## 5. Cara mengukur ulang standar ini

Semua angka resmi di atas mempunyai tautan sumber pada §1. Bila peraturan
berubah (mis. Kepmendikdasmen baru), perbarui **hanya** konstanta di
`standarTka2026.js` / `skorSkalaTka.js` beserta field `sumber`-nya; uji
`tests/standarTka2026.test.mjs` memaku invariant bahwa setiap baris struktur
wajib membawa sumber tidak kosong, sehingga angka tanpa tuan tidak bisa
masuk kode tanpa terlihat.
