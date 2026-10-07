# ALUR POTONG PRESISI — menyelesaikan gambar soal dari berkas asli

> Ditambahkan 2026-10-07 setelah keluhan owner: *"hasil soalnya bagus, tapi
> gambar soalnya tidak presisi — itu gambar buatan AI."*

## Masalahnya, jujur

Alur HTML Master (Gemini Canvas → `/admin/bank-soal/import` atau Impor HTML
Gemini) menghasilkan teks soal yang bagus, tetapi **model AI tidak bisa
memotong gambar dari scan**. Yang ia kirim adalah gambar *gambar ulang*
(re-render) — mirip, tapi garis, angka, dan detailnya bisa meleset.

Kami sudah menguji apakah komputer bisa mencari sendiri posisi crop AI di
halaman scan asli (pencocokan pola tinta, kajian `bank_soal_gemilang_kimia.html`
vs `11 Bonus @my99dreams.pdf`): skor kemiripan hanya **0.26–0.38** — tidak
andal. Kesimpulan: **jangan menebak, tunjuk**. Manusia yang menandai figur di
halaman asli; alat yang merapikan dan memasangnya.

## Alatnya

**✂️ Potong Presisi** — `/admin/bank-soal/potong-presisi`
(entri sidebar "Potong Presisi Gambar" + kartu di hub `/admin/perkakas`).

1. **Pilih soal** dari antrean otomatis:
   - ✂️ *menunggu potongan* → `potonganTertunda` (petunjuk `{{GAMBAR: …}}`
     dari prompt paten; siswa belum melihat gambarnya), atau
   - ⚠️ *gambar dicurigai* → `gambarMeta.asal` = `base64-tanpa-asal` /
     `tak-dikenal` (terindikasi buatan model).
   Ada juga kotak **cari manual** untuk memperbaiki gambar soal apa pun.
2. **Pilih target**: tombol ✂️ pada thumbnail gambar (mode *ganti*) atau pada
   petunjuk tertunda (mode *tambah* + pilih region badan/opsi/pembahasan).
3. **Buka berkas asli**: JPG/PNG langsung; PDF dirender di browser (pdf.js,
   skala 2×) dengan navigasi halaman — petunjuk potongan biasanya menyebut
   halamannya.
4. **Seret kotak** di atas figur (mouse atau sentuhan) → **🧲 Rapikan ke
   tinta**: kotak dikunci ke bounding-box piksel gelap di sekitarnya + margin
   (`snapKeTinta` di `src/utils/potongPresisi.js`). Bila tak ada tinta, alat
   MELAPOR — tidak pernah diam-diam memakai kotak lama.
5. **💾 Simpan & pasang**: potongan PNG (tanpa kompres) diunggah ke Supabase
   bucket `materi-bimbel` mengikuti konvensi `jalurBankSoal()`
   (`bank-soal/<mapel>/<bab>/<ts>_potongan-presisi_<id>_<n>.png`), lalu
   dokumen `bank_soal` di-`updateDoc`.

## Yang berubah di dokumen (kontrak)

Logika murni & teruji: `src/utils/potongPresisi.js` → `terapkanPotongan()`
(23 uji di `tests/potongPresisi.test.mjs`).

- **Mode ganti**: `gambarUrls[i]` diganti URL baru; `gambarMeta[i]` dicap
  `{ asal: "potongan-asli", sumber: "<berkas asli> (hal N)",
  dipotongPresisi: { alat: "potong-presisi", ts } }`; `opsiJawaban[].gambar[]`
  dan field `gambar` lama yang menunjuk URL lama ikut diselaraskan.
- **Mode tambah**: URL ditambahkan di akhir `gambarUrls` + meta ber-`region`
  (penempatanGambar menaruh gambar sisa di akhir teks region-nya — tanpa
  mengubah teks soal); entri `potonganTertunda` dibuang.
- **Invarian**: `gambarMeta` selalu sejajar indeks `gambarUrls` (slot bolong
  dibantal `{}`); **base64 ditolak** masuk dokumen (batas 1 MB Firestore) —
  hanya `https://` hasil upload.
- `potongan-asli` adalah nilai yang SUDAH diakui sah oleh validator
  (`SUMBER_GAMBAR_SAHIH` di `ekstrakHtmlGemini.js`), jadi soal yang gambarnya
  sudah dipotong presisi tidak lagi berflag pada impor/audit berikutnya.

## Batas jujur

- Alat ini **tidak menebak** posisi gambar dan **tidak mengubah teks soal**
  sama sekali — hanya gambar.
- Kualitas hasil = ketelitian penunjukan manusia + kualitas scan aslinya.
- Gambar yang sudah terpasang tetap bisa diganti lagi kapan pun (mode ganti
  bekerja pada gambar mana pun, termasuk `url-asli`).
- Tidak ada serverless function baru (slot Vercel tetap 12/12); upload
  langsung Supabase via `uploadService`, pola sama dengan Impor HTML Gemini.
