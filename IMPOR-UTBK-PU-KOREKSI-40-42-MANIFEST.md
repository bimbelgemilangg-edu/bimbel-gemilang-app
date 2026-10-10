# MANIFEST KOREKSI — IMPOR-UTBK-PU-KOREKSI-40-42.html

**Tanggal:** 2026-10-10
**Sumber:** berkas HTML Master 50 soal UTBK TPS-PU yang ditempel owner di chat
(article 40, 41, 42). Berkas koreksi ini berisi HANYA tiga article itu,
siap diimpor menyusul impor berkas utama.
**Prinsip:** setiap penyimpangan dari sumber dicatat di sini. Yang tidak
bisa dipastikan tidak ditebak — dibiarkan hilang dan ditandai.

---

## Soal 40 (SBMPTN 2019/UTBK I/TPS/PU/01 — pernikahan dini)

| # | Perubahan | Alasan |
|---|---|---|
| 1 | **Opsi E dipotong** setelah kalimat "…mengalami kekerasan dalam rumah tangga." | Sisa opsi E di sumber adalah bacaan batik yang salah kamar (bocor dari kolom sebelah saat OCR). Teks batik itu dikembalikan ke tempat seharusnya: bacaan bersama soal 41–42. |
| 2 | **Tabel 1 dipindah** dari dalam `teks_soal` ke `<div data-field="tabel_soal">` | Di sumber tabel berada di dalam teks sehingga terparsing jadi teks rusak ("Daerah Tempat Tin; ] Tahua [ eoisan…"). Parser HTML Master merender `tabel_soal` sebagai tabel sungguhan. |
| 3 | Perbaikan karakter OCR yang pasti: `SDK!` → `SDKI`, `\|7 persen` → `17 persen` | Salah-baca satu karakter yang tidak ambigu konteksnya. Dicatat, bukan disembunyikan. |
| 4 | **Pembahasan disusun ulang** menjadi 3 kalimat dari fragmen yang masih terbaca | Pembahasan sumber hancur oleh OCR ("&lt;{_", "Premis 1: *Semua perem juan ya menich ¢ di", "ifn cet iai Re"). Menyambung fragmen secara harfiah akan menghasilkan teks setengah rusak; menyusun ulang membuatnya terbaca. **Wajib dicek tentor terhadap buku asli sebelum soal ini dipakai try out bernilai.** |

Teks soal (2 paragraf), opsi A–D, dan kunci **B** tidak diubah.

## Soal 41 & 42 (SBMPTN 2019/UTBK I/TPS/PU/08 & /11 — batik)

| # | Perubahan | Alasan |
|---|---|---|
| 5 | **Bacaan ditambah** sebagai `<div data-field="bacaan" data-grup="batik_1">` dengan isi SAMA PERSIS di kedua article | Sumber tidak punya bacaan sama sekali (validator menangkapnya: kedua soal menyebut "paragraf 1/2" tanpa wacana). |
| 6 | Isi bacaan = **paragraf 1** diambil dari fragmen di opsi E soal 40 (versi terlengkap dan terbaca bersih), **paragraf 2** diambil dari pembahasan soal 41 (versi terlengkap) | Dua sumber itu memuat paragraf yang sama dalam keadaan lebih utuh daripada tempat lain di berkas. |
| 7 | **Paragraf 3 TIDAK disertakan** | Di sumber paragraf 3 terpotong ("…ikut memengaruhi" + baris racak). Soal 41 & 42 hanya merujuk paragraf 1 dan 2, jadi keduanya tetap jawab-lengkap tanpa paragraf 3. Menambahkan paragraf 3 berarti mengarang kelanjutannya. |
| 8 | Pembahasan 41 dirapikan (struktur argumen dipertahankan, sampah baris dibuang); pembahasan 42 dipertahankan hampir utuh | Sama seperti #4: rapihkan bentuk, jangan ubah substansi. **Cek tentor berlaku sama.** |

Opsi A–E kedua soal, kunci (**B** dan **C**), materi, dan tingkat kesulitan tidak diubah.

## Yang TIDAK dilakukan (sengaja)

- Tidak menyambung kata terpotong OCR di mana pun.
- Tidak mengubah kunci jawaban sumber (`kunci_terverifikasi=true` dipertahankan
  karena kunci memang tercetak di sumber).
- Tidak menambah soal, tidak mengubah nomor/paket.
- Tidak "membersihkan" gaya bahasa sumber.

## Cara pakai (urutan impor)

1. Impor berkas utama 50 soal di preview → **simpan yang valid**, dengan
   catatan soal 40 akan ikut tersimpan dalam keadaan opsi E bocor BILA preview
   tidak punya tombol buang/per-soal. Itu OK untuk langkah ini.
2. Impor berkas koreksi ini (petunjuk kolom sama: mapel `TPS/Penalaran Umum`,
   jenjang `UTBK/SNBT`, kelas 12) → 3 soal masuk dalam keadaan bersih.
3. Buka Lemari/Bank Soal, cari soal 40 versi lama (ciri: opsi E ±1.500 karakter
   dan field `catatanOcr` berisi catatan kebocoran), **hapus yang lama**.
   Soal 41–42 lama tidak tersimpan (tidak valid), jadi tidak ada duplikatnya.
4. Selesai: bank `utbk_pu` berisi 50 soal bersih; template Sabtu
   (30 PU) kini punya bahan cukup.
