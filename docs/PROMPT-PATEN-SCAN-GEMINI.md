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
>    - bila ada gambar: `<div class="figure-container" data-gambar-sumber="url-asli" data-gambar-asal="ALAMAT-HALAMAN-SUMBER"><img src="URL-GAMBAR-ASLI" alt=""><div class="figure-caption">KETERANGAN — Sumber: NAMA-SITUS</div></div>` atau, bila gambar asli tidak ditemukan: `<div class="figure-container" data-gambar-sumber="petunjuk-potongan"><div class="figure-caption">{{GAMBAR: petunjuk potongan presisi}}</div></div>` — gambar boleh lebih dari satu; tempel DI POSISI ia disebut (DI DALAM `.q-body` bila milik badan soal, DI DALAM `<li>` pilihan bila milik suatu pilihan, DI DALAM `.pembahasan` bila milik penjelasan); WAJIB menaati TANGGA GAMBAR ASLI di aturan 10; atribut `src` WAJIB ditulis POLOS (dilarang membungkus alamat dengan kurung siku/bundar gaya tautan markdown seperti `[alamat](alamat)` — sistem sejak 2026-10-07 otomatis melepas bungkus itu, tapi alamat polos tetap paling aman)
>    - pilihan ganda: `<div class="options-list">` berisi `<label class="option-item"><input type="radio" name="q<n>" value="A"><span class="option-text">A) teks</span></label>` untuk tiap opsi; BILA SUATU PILIHAN BERUPA GAMBAR/GRAFIK (modus umum modul TKA), letakkan figure-container milik pilihan itu DI DALAM `<li>`/label pilihan tersebut — sistem mengikat gambar ke pilihannya, jadi jangan menaruhnya di badan soal
>    - tabel benar/salah atau menjodohkan: `<table class="matrix-box">` dengan baris `<tr><td>pernyataan</td></tr>`
>    - **WAJIB:** `<div class="pembahasan">PENJELASAN LENGKAP mengapa kunci itu benar, termasuk pembahasan gambar/diagram bila sumber menjelaskannya — figure-container pembahasan diletakkan DI POSISI ia disebut di dalam .pembahasan, bukan di badan soal</div>`
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
> 9. TAKSONOMI KURIKULUM MERDEKA (WAJIB per kartu): `data-kurikulum`
>    ("merdeka"/"legacy"), `data-fase` (A–F), `data-kelas` (WAJIB per
>    kartu untuk kompilasi lintas kelas — JANGAN memisahkan berkas per
>    kelas), `data-elemen`, `data-capaian`, `data-bab`.
> 10. **TANGGA GAMBAR ASLI** (WAJIB — gambar adalah bagian yang paling
>    sering dipalsukan model, jadi aturan ini keras):
>    **DILARANG MEMBUAT GAMBAR.** Tidak boleh menggambar, melukis ulang,
>    merender, membuat tiruan SVG, maupun memasang
>    `<img src="data:image/...;base64,...">` hasil bikinan sendiri —
>    sistem menandai base64 tanpa pengakuan asal sebagai TERINDIKASI
>    PEMALSUAN. Untuk SETIAP gambar/diagram/grafik/ilustrasi yang tercetak
>    pada soal, ikuti tangga berikut BERURUTAN, dan **MAKSIMALKAN anak
>    tangga (1) — cari sungguh-sungguh dulu — sebelum turun ke (2):**
>    1. **CARI GAMBAR ASLI YANG BEREDAR.** Soal-soal ini umumnya berasal
>       dari sumber beredar luas (UN/UTBK/SNBT/TKA/OSN/buku cetak/situs
>       edukasi), sehingga gambar aslinya sering masih beredar di
>       internet. Boleh dipakai HANYA bila **PERSIS SAMA** dengan yang
>       tercetak di scan (bentuk, label, angka, orientasi identik —
>       "mirip" atau versi gambar-ulang situs lain TIDAK sah) DAN
>       berkualitas **HD**. Pasang dengan
>       `data-gambar-sumber="url-asli"` + `data-gambar-asal="alamat
>       halaman tempat gambar ditemukan"` + caption menyebut sumbernya.
>       JANGAN mengarang URL. Bila ragu tidak persis/kurang HD — turun
>       ke (2).
>    2. **PETUNJUK POTONGAN PRESISI** dari berkas ASLI:
>       `<div class="figure-container" data-gambar-sumber="petunjuk-potongan"><div class="figure-caption">{{GAMBAR: halaman <n>, posisi <...>, isi: <deskripsi lengkap figur — semua label/angka yang tercetak>}}</div></div>`
>       — tim yang memotong gambar asli dari berkas scan pemilik.
>    3. Figur buram/tak terbaca: tetap buat petunjuk-potongan berisi
>       "figur tidak terbaca di scan" dan tulis di pembahasan:
>       `[gambar tidak terbaca]`. Jangan pernah membuat pengganti.
>
> 11. BILA HALAMAN BERDUA KOLOM: baca kolom kiri dari atas ke bawah, lalu
> kolom kanan dari atas ke bawah; JANGAN membaca selang-seling antar
> kolom. Urutan akhir kartu mengikuti NOMOR soal, bukan posisi visual.
> 12. Bila sumber mencetak kode asal soal (mis. "TKA 2020/39", "SIMULASI
> TKA 2025/FISIKA/01", "TKA 1992/Rayon B"), salin PERSIS ke
> `<span class="q-source">` supaya bank soal menyimpan asal-usul tiap
> butir; bila tidak tercetak, isi dengan nama berkas scan.
> 13. Soal berketerangan "jawaban benar lebih dari satu" atau berdaftar
> kotak centang (checklist) adalah pg_kompleks: data-kunci memuat SEMUA
> huruf/nilai benar dipisah koma (mis. A,D), dan tabel centang kondisi
> ditulis sebagai matrix-box bila bentuknya baris benar/salah.
>
> Periksa dirimu sebelum menjawab: (a) jumlah `question-card` == jumlah
> nomor di sumber; (b) setiap kartu punya `data-kunci` dan `.pembahasan`;
> (c) tidak ada tag terlarang; (d) setiap kartu memuat `data-fase` dan
> `data-kurikulum`; (e) TIDAK ADA satu pun gambar bikinanmu (data:image
> base64) — setiap `figure-container` memakai url-asli +
> `data-gambar-asal`, atau petunjuk-potongan; (f) setiap figure-container
> berada di region yang benar sesuai posisi tercetaknya (badan soal / di
> dalam pilihan / di dalam pembahasan). Tuliskan hasil pemeriksaan itu
> sebagai komentar HTML di baris pertama berkas.

## 2. Kenapa patennya berbentuk begini

| Keputusan paten | Alasan |
|---|---|
| kunci & pembahasan sebagai **atribut/class mesin-baca** (`data-kunci`, `.pembahasan`) | hasil scan Gemini sebelumnya (kumpulan_soal_tka_biologi.html, 81 kartu) indah dibaca manusia tapi **nol kunci & nol pembahasan** → tidak bisa masuk bank soal. Atribut tidak mengganggu keindahan tampilan |
| enum `data-tipe` tertutup | enum ini = enum mesin skoring (`skorSoalTryOut.js`); tipe bebas = soal yang tidak bisa dinilai |
| **tangga gambar asli**: cari URL gambar beredar yang PERSIS SAMA & HD → bila tidak ada, petunjuk potongan presisi `{{GAMBAR: ...}}`; model DILARANG membuat gambar | permintaan owner 2026-10-07: "gambar asli persis di soal asli atau gambar asli di internet, wajib sama dan HD, tapi dilarang membuat; kalau tidak ada baru crop presisi dari fileku — maksimalkan cari dulu". Alasan teknis: model bahasa tidak bisa memproduksi byte gambar asli; base64 "tempelan" model hampir pasti gambar bikinan. Base64 SAH hanya yang mengaku `warisan`/`potongan-asli` (potongan manusia), dan tetap diunggah ekstraktor ke Supabase (`jalurBankSoal`) supaya dokumen Firestore tidak jebol batas 1 MB |
| math `$...$` dipertahankan | reader & lembar cetak merender KaTeX; mengonversi ke kata = merusak rumus |
| larangan script/on*/iframe | HTML dari AI adalah masukan tak dipercaya; ekstraktor juga membuang semuanya lagi (pertahanan ganda) |
| komentar pemeriksaan diri di baris pertama | memaksa model menghitung ulang jumlahnya; mengurangi soal yang diam-diam tercecer |

## 3. Yang dilakukan Sistem Gemilang sebagai ekstraktor

`ekstrakHtmlGemini.js` (murni, teruji di Node):
1. membuang script/style/atribut berbahaya;
2. memotong per `question-card`, membaca `data-tipe`, `data-kunci`, meta, body, statements, figure, options, matrix, pembahasan;
   🔥 2026-10-07: ekstraksi **SADAR-REGION** — tiap figure-container diganti
   token `{{GAMBAR_n}}` PERSIS di posisi fisiknya, dan region-nya dicatat:
   badan soal (token masuk `teksSoal`), opsi (gambar diikat ke pilihan menjadi
   opsi kaya `{teks, gambar[]}`), pembahasan (token masuk `pembahasan`).
   Caption/petunjuk potongan TIDAK lagi bocor menjadi teks bacaan siswa;
   satu `<li>` = satu pilihan sehingga soal berpilihan grafik tidak menyusut;
3. menolak kartu yang melanggar paten dengan **pesan bernomor kartu**
   ("kartu soal-7: data-kunci kosong untuk tipe pg_sederhana");
4. memetakan ke **KONTRAK-JSON-BANK-SOAL** (12 field) sehingga hasilnya
   langsung bisa dinilai mesin skoring & dicetak mesin cetak;
5. memisahkan gambar base64 ke daftar tersendiri untuk diunggah ke
   Supabase oleh lapisan UI (tidak pernah disimpan inline di Firestore);
6. menagih **ASAL-USUL GAMBAR** (aturan 10): `data-gambar-sumber="url-asli"`
   (+ `data-gambar-asal`) disimpan apa adanya beserta meta-nya
   (`gambarMeta` di dokumen bank soal); `petunjuk-potongan`
   `{{GAMBAR: ...}}` masuk antrean `potongan` dan TIDAK PERNAH bocor ke
   teks soal siswa (teruji), disimpan di dokumen sebagai
   `potonganTertunda`; base64 tanpa pengakuan asal diberi peringatan
   **"TERINDIKASI DIBUAT MODEL"** (bukan penolakan — berkas era sebelum
   aturan ini bisa memuat potongan asli tanpa atribut).

## 4. Alur kerja owner malam ini

1. Buka Gemini, tempel prompt paten di atas + unggah halaman scan (per bab,
   ≤ 10 halaman per putaran agar kuota gratis aman). **Bila tersedia,
   aktifkan fitur pencarian Google (grounding) di Gemini** — tanpa itu
   tangga (1) "cari gambar asli yang beredar" tidak bisa jalan dan Gemini
   akan langsung menulis petunjuk potongan.
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

### d0) Modul scan dua kolom berpilihan grafik (kajian PDF Kinematika, 2026-10-07)
Kajian `docs/KAJIAN-PASAR-MODUL-SCAN.md`: modul TKA nyata memakai halaman dua
kolom tanpa lapisan teks, pilihan berupa 5 grafik, tabel centang benar/salah,
kotak rumus, diagram di dalam pembahasan, dan kode asal soal (TKA 2020/39).
Patennya kini menyebut semua pola itu (aturan 2 region gambar, 5 kotak rumus
= LaTeX, 11 dua kolom, 12 q-source, 13 multi-centang), dan ekstraktor +
renderer + mesin cetak sudah mengonsumsi opsi kaya serta token pembahasan.

### d) Gambar buram / tabel rusak di sumber
Kartu tetap dibuat; pembahasan wajib menulis `[gambar tidak terbaca]`
atau `[tabel tidak terbaca]` alih-alih mengarang isi gambar. Ekstraktor
tidak menolak kartu semacam ini (menolak = membuang soal yang masih
bisa dipakai teksnya), tetapi peringatan "penalaran" akan menandainya
bila Gemini memilih mengisi dengan terkaan.

---

## 6. Aturan gambar asli (2026-10-07) — tangga, penandaan, dan batas jujurnya

**Permintaan owner (verbatim):** "gambar asli persis di soal asli atau gambar
asli di internet wajib sama dan HD untuk sistem, tapi dilarang membuat; kalau
gak ada baru crop presisi; kalau gak ada baru ambil presisi di fileku — tapi
maksimalkan untuk cari dulu."

### Tangga yang dipatenkan (aturan 10 prompt)

| Anak tangga | Bentuk keluaran Gemini | Yang dilakukan sistem |
|---|---|---|
| **(1) Gambar asli yang beredar** — dicari dulu, sungguh-sungguh; syarat: PERSIS SAMA (bukan mirip) & HD | `<img src="URL">` + `data-gambar-sumber="url-asli"` + `data-gambar-asal="alamat halaman sumber"` | URL disimpan apa adanya di `gambarUrls`, asal-usulnya di `gambarMeta`; admin melihat jumlah "gambar URL asli" di pratinjau |
| **(2) Petunjuk potongan presisi** — bila (1) tidak ada / tidak persis / tidak HD | `{{GAMBAR: halaman n, posisi ..., isi: semua label/angka}}` + `data-gambar-sumber="petunjuk-potongan"` | masuk antrean `potongan` di pratinjau ✂️ + tersimpan di dokumen (`potonganTertunda`); tim memotong gambar ASLI dari berkas scan owner (alat: `potongGambar.js`/EditorBab) |
| **(3) Figur tak terbaca** | petunjuk-potongan "tidak terbaca" + `[gambar tidak terbaca]` di pembahasan | tidak ada gambar pengganti; kartu tetap masuk bank |
| **DILARANG: membuat gambar** | base64/SVG bikinan model | base64 TANPA pengakuan asal → peringatan ⚠️ **"TERINDIKASI DIBUAT MODEL"** per kartu di pratinjau; base64 yang mengaku `warisan`/`potongan-asli` diterima (potongan manusia yang sah) |

### Batas jujur yang harus diketahui owner

1. **Gemini tidak bisa mengunduh gambar ke dalam berkas HTML.** Yang bisa ia
   serahkan hanyalah URL gambar asli hasil pencarian (tangga 1). Sistem
   menampilkan gambar lewat URL itu.
2. **URL luar bisa mati / menolak hotlink / berhak cipta.** Karena itu
   `data-gambar-asal` wajib (sumber tercatat), dan untuk soal yang akan
   dipakai massal (try out, cetak) gambar penting sebaiknya DICERMINKAN:
   diunduh ulang lalu diunggah ke Supabase kita. Hari ini pencerminkan
   dilakukan admin secara manual; otomasinya adalah kandidat fitur
   berikutnya (menumpang fungsi `uploadBankSoalImages.js` yang sudah ada —
   tanpa menambah fungsi Vercel ke-13).
3. **Gemini tidak bisa memotong gambar.** Maka tangga (2) berbentuk
   PETUNJUK presisi (halaman + posisi + isi), dan yang memotong adalah tim
   dari berkas asli owner — hasilnya potongan 100% asli & HD, bukan tiruan.
4. **Kenapa peringatan, bukan penolakan?** Berkas lama (sebelum aturan ini)
   bisa memuat base64 potongan asli yang belum beratribut; menolak seluruh
   berkas = membuang soal yang sah. Gambar mencurigakan ditandai per kartu
   di pratinjau, admin yang memutuskan. Bila owner menginginkan gerbang
   keras (base64 tanpa asal = berkas ditolak), itu perubahan satu baris di
   ekstraktor — katakan saja.
5. **Siswa tidak pernah melihat petunjuk potongan** (token `{{GAMBAR: ...}}`
   tidak bocor ke teks soal — dikunci test). Soal yang gambarnya masih
   menunggu potongan tampil tanpa gambar sampai tim melengkapi; daftar
   tunggakannya terlihat saat impor dan tersimpan di dokumen soal.
