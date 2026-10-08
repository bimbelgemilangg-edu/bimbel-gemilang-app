# AUDIT IDENTITAS BANK SOAL — prasyarat fitur "tentor bisa akses bank soal"

**Dibuat:** 2026-10-08 · **Pemicu:** permintaan owner — *"kedepannya kan kita buka
fitur tentor bisa akses bank soal, maka nanti tentor pilih mapel, jenjang, materi,
soal. Kita harus cek apakah semua soal udah punya identitas, apakah ada soal rusak."*

**Mesin:** `src/utils/auditIdentitasSoal.js` (42 uji) + `src/utils/jenjangBaku.js`
**Halaman:** Admin → Bank Soal & Perkakas → **Audit Identitas Soal** (`/admin/bank-soal/audit-identitas`)
**Sifat:** BACA dulu, tulis hanya atas perintah owner (SOP janji #5)

---

## Jawaban jujur atas pertanyaan owner

**Angka pastinya belum bisa dilaporkan dari dokumen ini**, dan itu bukan
kelalaian yang disembunyikan: saat audit dikerjakan, Firestore produksi
menjawab **`429 RESOURCE_EXHAUSTED (Quota exceeded)`** untuk permintaan baca
paling sederhana pun (diuji pada `bank_soal` dan `mapel`). Proyek ini memang
pernah kehabisan kuota baca harian karena penyapuan koleksi penuh — lihat
`docs/POLICY-ERROR-DAN-KUOTA.md`. Menyapu ulang dari luar hanya memperpanjang
mati-nya aplikasi yang sedang dipakai siswa, jadi **tidak dilakukan**.

Yang dilaporkan di sini adalah **hasil pembacaan kode**: cacat identitas apa
saja yang *pasti* ada di data, berapa pun jumlah butirnya. Angka nyatanya
dihasilkan dengan menekan **Jalankan Audit** di halaman itu — sekali baca,
biayanya dinyatakan jujur di layar.

---

## Temuan 1 — DUA kosakata `jenjang` hidup berdampingan

Bank soal diisi lima jalur tulis, dan mereka tidak sepakat soal penulisan jenjang:

| Jalur tulis | Berkas | `jenjang` yang ditulis |
|---|---|---|
| Mesin Bank Soal (JSON) | `MesinBankSoalPage.jsx` | `SMA` / `SMP` / `SD` / `SMK` |
| Impor HTML Gemini | `imporHtmlGeminiKeBank.js` | `SMA` / `SMP` / `SD` / `SMK` |
| Import Buku & Soal (scan/AI) | `ImportHasilScanPage.jsx` | `SD/MI` / `SMP/MTs` / `SMA/MA` / `SMK` / `UTBK/SNBT` |
| Advanced Question Extractor | `AdvancedQuestionExtractor.jsx` | `SD/MI` / `SMP/MTs` / `SMA/MA` / … |

Sementara **semua penyaring membandingkan string persis**:

```js
// LemariSoalPage.jsx
semuaSoal.filter((s) => (s.jenjang || '(Belum diatur)') === jenjangAktif)
// CetakPaketLatihan.jsx
if (((s.jenjang || '').trim() || BELUM) !== jenjangAktif) continue;
```

`URUTAN_JENJANG` di Lemari Soal = `['SD/MI','SMP/MTs','SMA/MA']`.

**Akibatnya:** soal ber-`jenjang: 'SMA'` **tidak pernah muncul** saat tentor
memilih `'SMA/MA'`. Ia tidak rusak, tidak error, tidak terlihat aneh di daftar
admin — ia hanya **lenyap dari hierarki**. Ini persis kelas bug yang paling
mahal: diam, dan terasanya seperti "soalnya kurang".

## Temuan 2 — penyaring membaca `materi`, mesin taksonomi menulis `bab`

`terapkanTaksonomi()` mengisi `bab`, `topik`, `subBab`, `subtopik` — tetapi
**tidak** `materi`. Padahal hierarki jenjang → mapel → **materi** membaca field
`materi`.

Jalur Impor HTML Gemini sudah menyadari ini dan menambalnya manual:

```js
// imporHtmlGeminiKeBank.js
// "Lemari Soal & Perpustakaan & Cetak Latihan membaca `materi`;
//  taksonomi menulis `bab`. Samakan keduanya..."
dok.materi = dok.bab || butir.materi || '';
```

**Jalur impor JSON tidak punya tambalan itu.** Jadi soal yang masuk lewat
Mesin Bank Soal ber-`bab` lengkap tapi `materi` kosong → tampil sebagai
kelompok **"(Belum diatur)"** di Lemari Soal dan Cetak Latihan.

## Temuan 3 — satu jalur tulis tidak menulis identitas materi sama sekali

`AdvancedQuestionExtractor.jsx` → `buildBankSoalDoc()` menulis `mataPelajaran`,
`tingkatKelas`, `jenjang`, `kategori`, `tags` — **tanpa `materi` dan tanpa `bab`**.
Butir dari jalur ini pasti jatuh ke "(Belum diatur)".

Ini cocok dengan catatan `AUDIT-REPO.md`: berkas itu meng-`fetch` `babTaksonomi`
lalu tidak pernah memakainya — "pagar materi" yang **belum selesai dibangun**,
bukan sampah. Jangan dihapus; itu utang fitur.

## Temuan 4 — dua nama untuk field yang sama

| Makna | Nama yang beredar |
|---|---|
| teks soal | `soal`, `teksSoal`, `teks_soal` |
| mata pelajaran | `mataPelajaran`, `mapel` |
| kelas | `tingkatKelas`, `kelas` |
| bab | `materi`, `bab`, `topik` |

Mesin cetak membaca `soal?.soal || soal?.teks_soal` — perhatikan `teks_soal`
(snake_case) yang **tidak ditulis jalur mana pun**; fallback itu mati.
`BersihkanSoalPage.deteksiRusak()` membaca `s.soal` saja, sehingga butir yang
hanya punya `teksSoal` akan dituduh "Teks soal kosong" — dan halaman itu
**soft-delete** berdasarkan tuduhan tersebut.

---

## Yang diperbaiki sekarang

### A. Titik tulis diseragamkan (`src/utils/jenjangBaku.js` + `terapkanTaksonomi`)

Satu sumber kebenaran kosakata jenjang, dipakai bersama oleh mesin taksonomi
(yang menulis) dan mesin audit (yang mengukur). Dua daftar di dua tempat adalah
bug yang menunggu terjadi lagi.

`terapkanTaksonomi()` kini:

1. **mengkanonisasi `jenjang`** → `SMA` menjadi `SMA/MA`, dan menyimpan nilai
   lama di `jenjangSebelumBaku` (tidak ada informasi yang hilang);
2. **mengisi alias `materi`** dari `bab`/`topik` bila kosong — `set()` hanya
   mengisi yang kosong, jadi `materi` pilihan admin tidak pernah ditimpa;
3. **tidak pernah mengarang**: jenjang yang tidak dikenali ditulis apa adanya
   supaya halaman audit bisa melaporkannya.

Kanonisasi sengaja ditaruh di **titik tulis**, bukan di `deteksiJenjangKelas`,
karena fungsi deteksi itu dipakai `petaKonten.js` (teruji) dan inferensi kelas
di dalamnya membandingkan `jenjang === 'SMA'`. Ada uji penjaga kompatibilitas
untuk ini di `tests/taksonomiIdentitas.test.mjs`.

> ⚠️ **Satu uji lama diperbarui:** `imporHtmlGeminiKeBank.test.mjs` memaku
> `jenjang === 'SMA'`. Itu memaku perilaku yang justru sedang diperbaiki.
> Diperbarui menjadi `'SMA/MA'` dengan komentar yang menjelaskan mengapa.

### B. Alur "Rapikan" yang sudah ada tidak lagi melewati soal bermasalah

`rapikanYangAda()` di Mesin Bank Soal dulu menganggap "sudah lengkap" bila
`jenjang && (mapel||mataPelajaran) && (bab||topik) && kelompok` — sehingga soal
ber-`jenjang: 'SMA'` **dilewati dan tak pernah sembuh**. Syaratnya diperketat:
jenjang harus baku **dan** `materi` harus terisi. Deteksi "berubah" ikut
menghitung `materi`.

Sekalian diakui jujur: sapuan itu dibatasi `limit(2000)`. Bila bank lebih besar,
sisa butir **tidak ikut dirapikan** — sekarang dinyatakan di pesan hasil, bukan
didiamkan.

### C. Alat ukur + halaman audit

`auditBankSoal()` membedakan **dua hal yang sering disangka sama**:

| | Artinya |
|---|---|
| `identitasLengkap` | informasinya **ADA** (walau tersimpan di alias/kosakata yang tak dibaca halaman mana pun) |
| `terjangkau` | hierarki tentor **BENAR-BENAR** bisa menemukannya |

Butir yang lengkap tapi tidak terjangkau (`tersembunyi`) adalah kasus paling
berbahaya: tidak terlihat rusak di mata admin, tapi lenyap dari layar tentor.
Halaman audit menampilkannya sebagai pill **TERSEMBUNYI** (kuning) terpisah dari
**TANPA IDENTITAS** (merah).

Deteksi butir rusak mencakup: kunci di luar rentang opsi, `pg_kompleks` tanpa
kunci (skor selalu 0), baris benar/salah tanpa kunci sah, pasangan menjodohkan
bolong, placeholder `{{GAMBAR_n}}` yatim, tipe tak dikenal, tipe warisan draft
lama (`pg`, `pgMulti`, `tabel`, `jodoh`, `isian`, `uraian`), aksara CJK, aksara
kontrol (jejak LaTeX termakan escape), kurung himpunan tak di-`escape`, opsi
identik, dan tag HTML mentah.

**Esai tanpa rubrik sengaja TIDAK dituduh rusak** — ia dinilai manusia; itu
masuk "perlu dicek". Ada uji invariannya.

Halaman ini **tidak menyapu otomatis saat dibuka**. Satu audit = satu pembacaan
seluruh koleksi (1 read per dokumen dari jatah 50.000/hari), dan biaya itu
ditulis di layar sesudahnya. Gagal muat tidak ditelan: kuota habis tampil
sebagai pesan manusiawi + tombol **Coba lagi**, dan data lama dipertahankan.

---

## Cara memakai (untuk owner)

1. **Admin → Bank Soal & Perkakas → Audit Identitas Soal.**
2. Tekan **Jalankan Audit**. Tunggu — satu sapuan, jangan diulang-ulang.
3. Baca **putusan kesiapan** di tab Ringkasan: hijau = siap dibuka untuk tentor;
   merah = daftar penghalang yang konkret.
4. Tab **Tanpa Identitas** → pilah yang merah (benar-benar kosong) dari yang
   kuning (tersembunyi). Yang kuning biasanya sembuh lewat tab Rencana Perbaikan.
5. Tab **Butir Rusak** → unduh CSV, perbaiki lewat Mesin Bank Soal, atau
   nonaktifkan lewat **Bersihkan Soal**.
6. Tab **Rencana Perbaikan** → **dry-run**. Baca dulu apa yang berubah dari nilai
   apa ke nilai apa, baru centang persetujuan dan terapkan.
7. Jalankan **audit ulang** untuk membuktikan angkanya turun.

Yang **tidak** bisa diperbaiki otomatis: identitas yang benar-benar tidak pernah
ada (mapel/materi yang tak terdeteksi dari teks soal mana pun). Itu keputusan
kurikulum — pakai **Mesin Bank Soal → Rapikan**, **Petakan Mapel**, atau
**Petakan Matematika**.

---

## Sisa utang sebelum fitur tentor benar-benar aman dibuka

- [ ] Jalankan audit pada data produksi (setelah kuota reda) dan simpan CSV-nya
      sebagai garis dasar.
- [ ] Eksekusi Rencana Perbaikan untuk butir `tersembunyi`, lalu audit ulang.
- [ ] `AdvancedQuestionExtractor.jsx`: selesaikan "pagar materi" (`babTaksonomi`
      yang sudah di-fetch tapi tak dipakai) supaya jalur itu menulis `materi`.
- [ ] `BersihkanSoalPage.deteksiRusak()`: baca `soal || teksSoal` sebelum menuduh
      "Teks soal kosong" — halaman itu soft-delete berdasarkan tuduhan tersebut.
- [ ] `naskahSoal.js` / `cetakLatihan.js`: fallback `teks_soal` tidak pernah
      tertulis oleh jalur mana pun — ganti `teksSoal` atau hapus.
- [ ] Putuskan: `UTBK/SNBT` ikut hierarki tentor atau tidak? Ia ada di
      `DAFTAR_JENJANG` jalur scan, tapi tidak di `URUTAN_JENJANG` Lemari Soal.
- [ ] Pertimbangkan dokumen agregat harian (counter per jenjang/mapel/materi)
      bila bank melewati ±5.000 butir — lihat `POLICY-ERROR-DAN-KUOTA.md`.
      Fitur tentor yang menyapu koleksi penuh per kunjungan akan memukul kuota
      setiap kali tentor membuka halamannya.
