# TATA LETAK STORAGE — bucket `materi-bimbel` (Supabase)

**Dibakukan:** 2026-10-06 · mesin konvensi: `src/utils/jalurStorage.js` (teruji) · titik upload: `src/services/uploadService.js`
**Pemicu:** pertanyaan owner — "simpannya di Supabase kan? gimana uploadnya, di mana guru akses materinya, enak bentuk folder ya?"

---

## Pembagian tugas penyimpanan

| Penyimpan | Isi |
|---|---|
| **Firestore** | struktur & teks: materi/bab, bank soal (kontrak 12 field), metadata, dan **URL/jalur file** |
| **Supabase Storage** (bucket `materi-bimbel`) | file biner: gambar, PDF, foto tugas, foto pengawasan try out, foto kartu siswa, CV pelamar |

URL publik diambil setelah upload (`getPublicUrl`) lalu disimpan di dokumen
Firestore. Maka **jalur file adalah data**: salah membentuk jalur = URL salah
tersimpan permanen di dokumen.

## Alur upload (siapa mengunggah apa)

```
EditorBab / PemotongGambar   -> materi & potongan gambar buku   (kompres OFF utk diagram HD)
StudentDigitalCard           -> foto kartu siswa                -> foto-siswa/
StudentModuleView            -> berkas tugas siswa              -> tugas/
useDeteksiKecuranganTryOut   -> foto pengawasan acak            -> tryout-pengawasan/
PendaftaranTentor            -> CV & foto pelamar               -> cv-pelamar-tentor/, foto-pelamar-tentor/
```
Semua lewat satu pintu `uploadElearningFile()`: kompres gambar otomatis
(1024px, q0.7) kecuali `kompres:false`, sanitasi nama, batas 50 MB.

## Di mana guru & siswa mengakses materi

- Guru: menu **E-Learning/Modul** (`/guru/modul`, `ManageMateri`) dan **Persiapan Buku** (`/guru/buku`); unggah gambar lewat EditorBab/PemotongGambar.
- Siswa: reader materi (`BelajarReader`, `StudentModuleView`) — gambar dimuat dari URL Supabase yang sama.
- Bank soal & mesin cetak (`/guru/cetak-latihan`) merujuk gambar yang sama.

## ⚠️ Warisan skema datar (jangan disapu, jangan ditiru)

`uploadService.js` lama menimpa folder `materi/` menjadi folder BERDASARKAN TIPE:
semua gambar semua mapel/bab masuk **`gambar/`**, PDF ke `pdf/`, sisanya `dokumen/`,
bernama `timestamp_nama`. Konteks mapel/bab hanya hidup di Firestore.

**Keputusan 2026-10-06:**
1. Upload BARU boleh (dan fitur baru wajib) memakai jalur berstruktur lewat
   `opsi.jalur` + pembentuk di `jalurStorage.js`.
2. Objek LAMA **tidak dipindah**. Memindahkan objek memutus setiap dokumen yang
   menyimpan URL lamanya. Migrasi = proyek tersendiri dengan tabel pemetaan.
3. Perkakas pembersih berkas yatim kelak WAJIB mengakui prefix warisan
   (`gambar`, `pdf`, `dokumen`) sebagai dikenal — lihat `PREFIX_DIKENAL`.

## Konvensi jalur baru (upload baru & semua fitur Fase 1/4)

```
materi/<mapel>/<kelas>/<bab>/<jenis>/<ts>_<nama>        gambar|pdf|dokumen per bab
bank-soal/<mapel>/<bab>/<ts>_<nama>                     gambar butir soal
buku-progres/<studentId>/<pertemuan>/<ts>_halaman.jpg   foto buku kliping (Fase 4)
tryout-pengawasan/<paketId>/<sesiId>/<ts>.jpg           foto pengawasan, mudah diaudit
tugas/ · foto-siswa/ · cv-pelamar-tentor/ · foto-pelamar-tentor/   (tetap seperti sekarang)
```

Aturan:
- slug huruf kecil tanpa spasi (`slugify`), nama file disanitasi, ts di depan supaya urut waktu;
- **folder = kemudahan manusia & lifecycle**; sumber kebenaran metadata tetap Firestore (simpan jalur lengkap di field `jalurStorage`);
- jalur dibentuk HANYA lewat `jalurStorage.js` — jangan merangkai string jalur di halaman, supaya konvensinya tidak bercabang;
- akses bucket tetap public-read untuk aset belajar; berkas berdata pribadi (foto siswa, CV, pengawasan) jangan ditaruh di jalur yang bisa ditebak tanpa id dokumen.
