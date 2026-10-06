# PROMPT PATEN SCAN → HTML (Gemini sebagai pemindai, Gemilang sebagai ekstraktor)

**Ditetapkan:** 2026-10-06 · mesin pembaca: `src/utils/ekstrakHtmlGemini.js` (teruji)
**SUMBER TUNGGAL PROMPT:** `src/utils/promptPatenGemini.js` — dan tombol
**"Salin Prompt"** di admin → *Impor HTML Gemini*. Blok prompt di dokumen ini
adalah cerminan untuk dibaca manusia; bila suatu hari berbeda dengan berkas
util, **yang benar adalah berkas util**. Penanda wajib di dalam prompt dikunci
oleh `tests/promptPaten.test.mjs` supaya paten tidak menyusut diam-diam.
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
> 4b. **WAJIB tambahan:** setiap kartu memuat atribut
>    `data-asal-pembahasan="tercetak"` bila pembahasan memang tercetak di
>    sumber, atau `data-asal-pembahasan="penalaran"` bila sumber TIDAK
>    memuat pembahasan dan kamu MENALAR-nya sendiri dari soal + kunci +
>    gambar. Jangan pernah menyembunyikan perbedaan ini: guru harus tahu
>    mana penjelasan buku dan mana penjelasan model.
> 4c. Bila sumber memuat beberapa bab (ebook kompilasi), setiap pergantian
>    bab WAJIB ditandai `section-header` sebelum kartu pertama bab itu;
>    boleh juga menambah `data-bab="NAMA BAB"` per kartu sebagai penguat.
>    Sistem mengelompokkan bank soal berdasar penanda ini, bukan berdasar
>    nama berkas.
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

---

## 4b. Varian prompt: KONVERSI ULANG HTML lama (jalan hemat kuota)

Bila Anda sudah punya keluaran Gemini format lama dan tidak ingin memindai
ulang scan-nya, pakai `PROMPT_KONVERSI_ULANG` (tersedia juga sebagai tombol
salin terpisah di halaman impor). Aturan kerasnya: konverter boleh merapikan
**STRUKTUR**, tidak boleh menciptakan **ISI** — kunci/pembahasan yang tidak
ada di masukan tidak boleh dikarang; gambar dibawa apa adanya; nomor &
urutan dipertahankan; penambahan penjelasan wajib mengaku `penalaran`.
Urutan preferensi tetap: **(1) scan ulang dengan prompt paten** (paling
setia), (2) konversi ulang HTML lama, (3) untuk beberapa nomor yang bolong
saja, kirim nomor + halaman kunci.

## 4c. Kompilasi lintas kelas (TKA 10-12): kelas dipatenkan PER KARTU

Buku kompilasi TKA mencampur materi kelas 10-12 dalam satu berkas. Itu
**aman dan justru diinginkan**: pengelompokan utama tetap BAB, sedangkan
`data-kelas` per kartu menjadi **saringan** bagi guru (cetak semua kelas
atau satu kelas saja, di menu Cetak Latihan; sebarannya tampil di
Perpustakaan per bab). Prompt melarang memisahkan berkas per kelas --
biarkan sistem yang menyaring, bukan manusia yang mengingat.

## 5. Kasus nyata yang sudah dijawab paten ini

### a) Satu berkas berisi banyak bab (ebook kompilasi TKA)
Tidak masalah dan tidak perlu dipecah manual: tiap `section-header`
menjadi pembatas bab, dan ekstraktor menandai setiap kartu dengan bab
terdekat di atasnya (`field materi` di bank soal). Perpustakaan
(#143) kemudian menampilkan jumlahnya per bab tanpa admin mengelompokkan
sendiri.

### b) Satu buku penuh digenerate sekaligus (mis. bank Matematika SMP 7/8/9)
Boleh, dengan dua pagar:
1. **Bagi unggahan ke Gemini per ±10 halaman** supaya kuota gratis tidak
   menolak di tengah jalan; tiap bagian tetap mematuhi paten yang sama.
2. Serahkan SEMUA berkas bagian ke ekstraktor sekaligus
   (`ekstrakBanyakHtml`): ia menggabungkan, membuang duplikat
   (bab+nomor+sumber+isi), dan memberi prefiks nama berkas pada setiap
   pesan kesalahan — jadi bila bagian 3 gagal, yang diulang hanya bagian 3.

### c) Buku yang HANYA mencetak kunci tanpa pembahasan
Gemini DIPERBOLEHKAN menalar pembahasan, termasuk menjelaskan gambar/
diagram yang ia lihat ("pada diagram, bagian B adalah bronkus karena ..."),
dengan syarat jujur: `data-asal-pembahasan="penalaran"`. Ekstraktor
menyimpan pengakuan itu di field `pembahasanAsal` dan mengeluarkan
**peringatan** (bukan kesalahan) per kartu, supaya guru memeriksa sebelum
memakai di kelas. Pembahasan tercetak vs karangan model tidak boleh
bercampur tanpa tanda — itu perbedaan antara mengajar dan menebak.

### d) Gambar buram / tabel rusak di sumber
Kartu tetap dibuat; pembahasan wajib menulis `[gambar tidak terbaca]`
atau `[tabel tidak terbaca]` alih-alih mengarang isi gambar. Ekstraktor
tidak menolak kartu semacam ini (menolak = membuang soal yang masih
bisa dipakai teksnya), tetapi peringatan "penalaran" akan menandainya
bila Gemini memilih mengisi dengan terkaan.
