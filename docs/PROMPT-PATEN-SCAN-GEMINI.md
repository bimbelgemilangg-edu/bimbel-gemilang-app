# PROMPT PATEN SCAN → HTML (Gemini sebagai pemindai, Gemilang sebagai ekstraktor)

**Ditetapkan:** 2026-10-06 · mesin pembaca: `src/utils/ekstrakHtmlGemini.js` (teruji)
**Pembagian kerja yang owner pilih:** *Gemini unggul membaca scan, jadi Gemini
jadi PEMINDAI; Sistem Gemilang jadi EKSTRAKTOR yang mematenkan format.*
Artinya: Gemini boleh pintar apa pun, keluarannya wajib lolos cetakan di
bawah ini. Bila tidak lolos, **Sistem menolak dengan pesan**, bukan
berimprovisasi — supaya konten baru tidak pernah lagi memaksa merge/deploy.

---

## 1. Prompt yang WAJIB ditempel ke Gemini (salin utuh)

> Kamu adalah MESIN PENGETIK ULANG modul scan. Kamu menerima gambar-gambar
> halaman buku/soal hasil scan. Tugasmu MENULIS ULANG isinya menjadi SATU
> berkas HTML dengan aturan PATEN berikut. Jangan menambah, jangan
> mengurangi, jangan menjawab soal sendiri selain menuliskan kunci yang
> TERCETAK di sumber (bila kunci tercetak di halaman terpisah, pasang ke
> nomor yang sesuai; bila sumber benar-benar tidak memuat kunci suatu
> nomor, isi data-kunci="" dan tulis di pembahasan: "Kunci tidak tercetak
> di sumber.").
>
> STRUKTUR WAJIB (class & atribut persis, tanpa variasi):
> 1. Setiap bab/seksi: `<div class="section-header" id="sec-<slug>"><h2>JUDUL</h2><span class="section-badge">Soal a - b</span></div>`
> 2. Setiap soal: `<div class="question-card" id="soal-<n>" data-tipe="<enum>" data-kunci="<kunci>">` dengan isi berurutan:
>    - `<div class="question-meta"><span class="q-number">No. <n></span><span class="q-source">SUMBER</span><span class="q-type-badge">LABEL MANUSIA</span></div>`
>    - `<div class="q-body">teks soal lengkap</div>`
>    - bila ada pernyataan bernomor: `<div class="statements-box"><ol><li>...</li></ol></div>`
>    - bila ada gambar: `<div class="figure-container"><img src="data:image/...;base64,..." alt=""><div class="figure-caption">KETERANGAN</div></div>` (gambar boleh lebih dari satu; tempel DI POSISI ia disebut)
>    - pilihan ganda: `<div class="options-list">` berisi `<label class="option-item"><input type="radio" name="q<n>" value="A"><span class="option-text">A) teks</span></label>` untuk tiap opsi
>    - tabel benar/salah atau menjodohkan: `<table class="matrix-box">` dengan baris `<tr><td>pernyataan</td></tr>`
>    - **WAJIB:** `<div class="pembahasan">PENJELASAN LENGKAP mengapa kunci itu benar, termasuk pembahasan gambar/diagram bila sumber menjelaskannya</div>`
> 3. Nilai `data-tipe` HANYA boleh salah satu enum ini:
>    `pg_sederhana` | `pg_kompleks` | `benar_salah` | `menjodohkan` | `isian_singkat` | `esai`
> 4. Nilai `data-kunci`:
>    - pg_sederhana: satu huruf, mis. `B`
>    - pg_kompleks: huruf dipisah koma, mis. `A,C`
>    - benar_salah / menjodohkan (per baris, urut): mis. `B,S,B` atau `1-A,2-C`
>    - isian_singkat: teks jawaban, alternatif dipisah ` / `
>    - esai: kosong `""` (rubrik masuk pembahasan)
> 5. Matematika ditulis `$...$` untuk inline dan `$$...$$` untuk blok,
>    persis seperti tercetak (jangan dikonversi jadi kata).
> 6. DILARANG: tag `<script>`, `<iframe>`, atribut `on*` (onclick dll.),
>    `javascript:` pada href, tombol navigasi, dan CSS `position:fixed`.
>    CSS untuk kerapian tampilan DIPERSILAKAN.
> 7. Jangan pernah membuang soal: jika satu halaman memuat 10 nomor,
>    keluaran memuat 10 `question-card`. Jika gambar buram tak terbaca,
>    tetap buat kartunya dan tulis di pembahasan: `[gambar tidak terbaca]`.
> 8. Bahasa keluaran: Indonesia untuk pembahasan; teks soal mengikuti
>    sumber sebagaimana adanya.
>
> Periksa dirimu sebelum menjawab: (a) jumlah `question-card` == jumlah
> nomor di sumber; (b) setiap kartu punya `data-kunci` dan `.pembahasan`;
> (c) tidak ada tag terlarang. Tuliskan hasil pemeriksaan itu sebagai
> komentar HTML di baris pertama berkas.

## 2. Kenapa patennya berbentuk begini

| Keputusan paten | Alasan |
|---|---|
| kunci & pembahasan sebagai **atribut/class mesin-baca** (`data-kunci`, `.pembahasan`) | hasil scan Gemini sebelumnya (kumpulan_soal_tka_biologi.html, 81 kartu) indah dibaca manusia tapi **nol kunci & nol pembahasan** → tidak bisa masuk bank soal. Atribut tidak mengganggu keindahan tampilan |
| enum `data-tipe` tertutup | enum ini = enum mesin skoring (`skorSoalTryOut.js`); tipe bebas = soal yang tidak bisa dinilai |
| gambar base64 di dalam `figure-container` | ekstraktor Gemilang yang mengunggah ke Supabase & mengganti dengan URL + jalur berstruktur (`jalurBankSoal`), sehingga dokumen Firestore tidak jebol batas 1 MB |
| math `$...$` dipertahankan | reader & lembar cetak merender KaTeX; mengonversi ke kata = merusak rumus |
| larangan script/on*/iframe | HTML dari AI adalah masukan tak dipercaya; ekstraktor juga membuang semuanya lagi (pertahanan ganda) |
| komentar pemeriksaan diri di baris pertama | memaksa model menghitung ulang jumlahnya; mengurangi soal yang diam-diam tercecer |

## 3. Yang dilakukan Sistem Gemilang sebagai ekstraktor

`ekstrakHtmlGemini.js` (murni, teruji di Node):
1. membuang script/style/atribut berbahaya;
2. memotong per `question-card`, membaca `data-tipe`, `data-kunci`, meta, body, statements, figure, options, matrix, pembahasan;
3. menolak kartu yang melanggar paten dengan **pesan bernomor kartu**
   ("kartu soal-7: data-kunci kosong untuk tipe pg_sederhana");
4. memetakan ke **KONTRAK-JSON-BANK-SOAL** (12 field) sehingga hasilnya
   langsung bisa dinilai mesin skoring & dicetak mesin cetak;
5. memisahkan gambar base64 ke daftar tersendiri untuk diunggah ke
   Supabase oleh lapisan UI (tidak pernah disimpan inline di Firestore).

## 4. Alur kerja owner malam ini

1. Buka Gemini, tempel prompt paten di atas + unggah halaman scan (per bab,
   ≤ 10 halaman per putaran agar kuota gratis aman).
2. Simpan keluaran sebagai `.html`.
3. Serahkan ke Sistem: (sekarang) kirim berkasnya ke tim IT untuk dikonversi
   & diimpor; (setelah UI impor HTML Gemini merge) tempel langsung di
   admin → impor → pratinjau jumlah soal/kunci/pembahasan → simpan.
4. Cek ringkasan: jumlah kartu == jumlah nomor sumber; semua kartu punya
   kunci & pembahasan. Bila ada yang ditolak ekstraktor, perbaiki hanya
   kartu yang disebut — tidak perlu mengulang seluruh bab.
