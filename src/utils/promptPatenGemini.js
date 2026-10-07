// src/utils/promptPatenGemini.js
// ============================================================
// SUMBER TUNGGAL prompt paten scan -> HTML.
//
// KENAPA BERKAS INI ADA: owner bertanya "dimana menemukan prompt untuk
// Gemini?" -- sebelumnya prompt hanya hidup di dokumen markdown, sehingga
// harus dicari, disalin dari blockquote (rawan ikut menyalin tanda ">"),
// dan bisa tertinggal versi lama saat paten diperbarui. Sekarang prompt
// hidup di kode, ditampilkan di halaman Impor HTML Gemini dengan tombol
// "Salin Prompt", dan docs/PROMPT-PATEN-SCAN-GEMINI.md menunjuk ke sini
// sebagai sumber kebenaran.
//
// Tests/promptPaten.test.mjs mengunci penanda-penanda wajib di dalam
// prompt (enum tipe, data-kunci, .pembahasan, data-asal-pembahasan,
// larangan script, TANGGA GAMBAR ASLI, pemeriksaan diri) supaya paten
// tidak bisa menyusut diam-diam lewat suntingan seseorang.
//
// 🔥 2026-10-07 — ATURAN GAMBAR (permintaan owner): soal-soal ini berasal
// dari sumber beredar, maka gambarnya WAJIB gambar ASLI yang beredar juga:
// (1) cari dulu gambar asli persis di internet (identik + HD, sumber
// dicatat di data-gambar-asal), (2) bila tidak ada -> petunjuk potongan
// presisi supaya tim memotong dari berkas scan ASLI milik owner,
// (3) DILARANG MEMBUAT gambar (base64/SVG bikinan model = pemalsuan).
// Alasan teknis yang jujur: model bahasa tidak bisa memproduksi ulang
// byte gambar asli — base64 yang ia "tempel" hampir pasti gambar
// bikinan. Karena itu prompt lama yang menyuruh <img src="data:image/
// ...;base64,..."> DIGANTI tangga di atas, dan ekstraktor menandai
// base64 tanpa pengakuan asal sebagai "terindikasi buatan".
// ============================================================

export const PROMPT_PATEN_GEMINI = `Kamu adalah MESIN PENGETIK ULANG modul scan. Kamu menerima gambar-gambar halaman buku/soal hasil scan. Tugasmu MENULIS ULANG isinya menjadi SATU berkas HTML dengan aturan PATEN berikut. Jangan menambah, jangan mengurangi, jangan menjawab soal sendiri selain menuliskan kunci yang TERCETAK di sumber (bila kunci tercetak di halaman terpisah, pasang ke nomor yang sesuai; bila sumber benar-benar tidak memuat kunci suatu nomor, isi data-kunci="" dan tulis di pembahasan: "Kunci tidak tercetak di sumber.").

STRUKTUR WAJIB (class & atribut persis, tanpa variasi):
1. Setiap bab/seksi: <div class="section-header" id="sec-<slug>"><h2>JUDUL</h2><span class="section-badge">Soal a - b</span></div>
2. Setiap soal: <div class="question-card" id="soal-<n>" data-tipe="<enum>" data-kunci="<kunci>"> dengan isi berurutan:
   - <div class="question-meta"><span class="q-number">No. <n></span><span class="q-source">SUMBER</span><span class="q-type-badge">LABEL MANUSIA</span></div>
   - <div class="q-body">teks soal lengkap</div>
   - bila ada pernyataan bernomor: <div class="statements-box"><ol><li>...</li></ol></div>
   - bila ada gambar: <div class="figure-container" data-gambar-sumber="url-asli" data-gambar-asal="ALAMAT-HALAMAN-SUMBER"><img src="URL-GAMBAR-ASLI" alt=""><div class="figure-caption">KETERANGAN — Sumber: NAMA-SITUS</div></div> atau, bila gambar asli tidak ditemukan: <div class="figure-container" data-gambar-sumber="petunjuk-potongan"><div class="figure-caption">{{GAMBAR: petunjuk potongan presisi}}</div></div> — gambar boleh lebih dari satu; tempel DI POSISI ia disebut; WAJIB menaati TANGGA GAMBAR ASLI di aturan 10
   - pilihan ganda: <div class="options-list"> berisi <label class="option-item"><input type="radio" name="q<n>" value="A"><span class="option-text">A) teks</span></label> untuk tiap opsi
   - tabel benar/salah atau menjodohkan: <table class="matrix-box"> dengan baris <tr><td>pernyataan</td></tr>
   - WAJIB: <div class="pembahasan">PENJELASAN LENGKAP mengapa kunci itu benar, termasuk pembahasan gambar/diagram bila sumber menjelaskannya</div>
3. Nilai data-tipe HANYA boleh salah satu enum ini: pg_sederhana | pg_kompleks | benar_salah | menjodohkan | isian_singkat | esai
4. Nilai data-kunci:
   - pg_sederhana: satu huruf, mis. B
   - pg_kompleks: huruf dipisah koma, mis. A,C
   - benar_salah / menjodohkan (per baris, urut): mis. B,S,B atau 1-A,2-C
   - isian_singkat: teks jawaban, alternatif dipisah " / "
   - esai: kosong "" (rubrik masuk pembahasan)
4b. WAJIB tambahan: setiap kartu memuat atribut data-asal-pembahasan="tercetak" bila pembahasan memang tercetak di sumber, atau data-asal-pembahasan="penalaran" bila sumber TIDAK memuat pembahasan dan kamu MENALAR-nya sendiri dari soal + kunci + gambar. Jangan pernah menyembunyikan perbedaan ini: guru harus tahu mana penjelasan buku dan mana penjelasan model.
4c. Bila sumber memuat beberapa bab (ebook kompilasi), setiap pergantian bab WAJIB ditandai section-header sebelum kartu pertama bab itu; boleh juga menambah data-bab="NAMA BAB" per kartu sebagai penguat. Sistem mengelompokkan bank soal berdasar penanda ini, bukan berdasar nama berkas.
5. Matematika ditulis $...$ untuk inline dan $$...$$ untuk blok, persis seperti tercetak (jangan dikonversi jadi kata).
6. DILARANG: tag <script>, <iframe>, atribut on* (onclick dll.), javascript: pada href, tombol navigasi, dan CSS position:fixed. CSS untuk kerapian tampilan DIPERSILAKAN.
7. Jangan pernah membuang soal: jika satu halaman memuat 10 nomor, keluaran memuat 10 question-card. Jika gambar buram tak terbaca, tetap buat kartunya dan tulis di pembahasan: [gambar tidak terbaca].
8. Bahasa keluaran: Indonesia untuk pembahasan; teks soal mengikuti sumber sebagaimana adanya.

9. TAKSONOMI KURIKULUM MERDEKA (WAJIB per kartu, supaya sistem menerima berkas yang SUDAH terklasifikasi dan tidak perlu menebak):
   - data-kurikulum="merdeka" bila sumber mengikuti Kurikulum Merdeka, atau "legacy" bila KTSP/K13 (tetap diterima; penanda untuk pemetaan).
   - data-fase: Fase A/B/C (SD), D (SMP kelas 7-9), E/F (SMA/SMK kelas 10-12) -- turunkan dari kelas yang tercetak; bila sumber hanya menulis jenjang, pakai fase tengah jenjang itu dan akui di pembahasan bila ragu.
   - data-kelas: WAJIB per kartu bila sumber mencampur beberapa kelas (kompilasi TKA 10-12): isi angka kelas yang paling tepat menurut capaian/fase/isinya; bila sungguh tak bisa ditentukan, "" dan guru yang memilih lewat saringan kelas di sistem. JANGAN memisahkan berkas per kelas -- biarkan per kartu.
   - data-elemen: nama ELEMEN Capaian Pembelajaran resmi mapel itu yang paling tepat untuk bab ini (contoh IPA: "Pemahaman Sains"; Matematika: "Aljabar"; Bahasa Inggris: "Menyimak-Membaca"; IPS/Geografi: "Pemahaman Konsep Ruang"), selain itu ""
   - data-capaian: kutipan singkat Capaian Pembelajaran (CP) terdekat BILA tercetak di sumber, selain itu ""
   - data-bab: nama bab sebagaimana tercetak; sistem menyamakan sinonimnya sendiri.

10. TANGGA GAMBAR ASLI (WAJIB — gambar adalah bagian yang paling sering dipalsukan model, jadi aturan ini keras):
   DILARANG MEMBUAT GAMBAR. Kamu tidak boleh menggambar, melukis ulang, merender, membuat tiruan SVG, maupun memasang <img src="data:image/...;base64,..."> hasil bikinan sendiri — sistem menandai base64 tanpa pengakuan asal sebagai TERINDIKASI PEMALSUAN, dan gambar palsu di bank soal berarti siswa belajar dari diagram yang tidak pernah ada di soal aslinya. Untuk SETIAP gambar/diagram/grafik/ilustrasi yang tercetak pada soal, ikuti tangga berikut BERURUTAN, dan MAKSIMALKAN anak tangga (1) — cari sungguh-sungguh dulu — sebelum turun ke (2):
   (1) CARI GAMBAR ASLI YANG BEREDAR. Soal-soal ini umumnya berasal dari sumber yang beredar luas (UN/UTBK/SNBT/TKA/OSN/buku cetak/situs edukasi), sehingga gambar aslinya sering masih beredar di internet. Carilah, dan boleh dipakai HANYA bila: PERSIS SAMA dengan yang tercetak di scan (bentuk, label, angka, dan orientasi identik — gambar "mirip" atau versi gambar-ulang dari situs lain TIDAK sah) DAN berkualitas HD (tajam, tidak pecah). Pasang sebagai: <div class="figure-container" data-gambar-sumber="url-asli" data-gambar-asal="alamat halaman tempat gambar ditemukan"><img src="URL-LANGSUNG-ke-berkas-gambarnya" alt="deskripsi singkat"><div class="figure-caption">KETERANGAN — Sumber: nama situs</div></div>. JANGAN mengarang URL: hanya URL yang benar-benar kamu peroleh dari hasil pencarian. Bila ragu gambarnya tidak persis sama atau kurang HD — JANGAN dipakai; turun ke (2).
   (2) PETUNJUK POTONGAN PRESISI dari berkas ASLI. Bila (1) tidak menghasilkan gambar yang persis sama dan HD, jangan mengarang pengganti — tugaskan tim memotong gambar ASLI dari berkas scan yang kamu terima: <div class="figure-container" data-gambar-sumber="petunjuk-potongan"><div class="figure-caption">{{GAMBAR: halaman <nomor halaman scan>, posisi <atas/tengah/bawah + kiri/kanan; patokan: di dekat teks "...">, isi: <deskripsi lengkap figur — jenis gambar, SEMUA label/angka yang tercetak, orientasi, perkiraan proporsi>}}</div></div>. Petunjuk wajib cukup presisi agar orang lain dapat memotongnya tanpa membaca ulang seluruh halaman.
   (3) Bila figur di scan buram/tak terbaca: tetap buat figure-container petunjuk-potongan dengan isi "figur tidak terbaca di scan", dan tulis di pembahasan: [gambar tidak terbaca]. Jangan pernah membuat gambar pengganti.

Periksa dirimu sebelum menjawab: (a) jumlah question-card == jumlah nomor di sumber; (b) setiap kartu punya data-kunci dan .pembahasan; (c) tidak ada tag terlarang; (d) setiap kartu memuat data-fase dan data-kurikulum; (e) TIDAK ADA satu pun gambar bikinanmu (data:image base64) — setiap figure-container memakai url-asli + data-gambar-asal, atau petunjuk-potongan. Tuliskan hasil pemeriksaan itu sebagai komentar HTML di baris pertama berkas.`;

// ============================================================
// VARIAN: KONVERSI ULANG HTML LAMA -> HTML PATEN (jalan hemat kuota).
// Dipakai bila owner sudah punya keluaran Gemini format lama dan tidak
// ingin memindai ulang scan-nya. Aturan anti-karang dijaga ketat:
// konverter boleh merapikan STRUKTUR, tidak boleh menciptakan ISI.
// ============================================================
export const PROMPT_KONVERSI_ULANG = `Kamu adalah KONVERTOR FORMAT, bukan penulis materi. Kamu menerima berkas HTML soal keluaran versi lama dan harus mengembalikannya sebagai HTML paten berikut. ATURAN KERAS:
1. Jangan mengarang kunci jawaban atau pembahasan yang TIDAK ada di masukan. Bila masukan tanpa pembahasan, isi .pembahasan dengan teks: "Kunci tidak tercetak di sumber." dan set data-asal-pembahasan="penalaran" HANYA bila kamu menambahkan penjelasan dari penalaranmu sendiri -- dan itu pun hanya boleh bila kunci tersedia di masukan.
2. Bawa SELURUH gambar yang ADA di masukan (base64 maupun URL) apa adanya ke figure-container pada posisi semula, dan tandai wadahnya data-gambar-sumber="warisan" (bila masukan sudah memuat data-gambar-sumber/data-gambar-asal, pertahankan nilai aslinya). DILARANG membuat gambar baru dalam bentuk apa pun — termasuk base64 atau SVG bikinanmu; base64 tanpa pengakuan asal akan ditandai sistem sebagai TERINDIKASI PEMALSUAN. Bila teks soal jelas merujuk gambar yang TIDAK ada berkasnya di masukan, jangan menggambar pengganti: buat figure-container data-gambar-sumber="petunjuk-potongan" berisi {{GAMBAR: deskripsi lengkap figur yang harus dipotong dari sumber asli}}.
3. Pertahankan nomor soal, sumber, dan urutan sebagaimana masukan; jangan menggabungkan atau membuang kartu.
4. Lengkapi atribut paten: data-tipe (enum: pg_sederhana | pg_kompleks | benar_salah | menjodohkan | isian_singkat | esai), data-kunci, data-asal-pembahasan, data-kurikulum, data-fase, data-kelas, data-elemen, data-bab bila dapat ditentukan dari isi; selain itu "".
5. Struktur keluaran persis paten: section-header per bab, question-card per soal, question-meta, q-body, statements-box bila ada, figure-container bila ada, options-list, dan .pembahasan.
6. DILARANG: script, iframe, atribut on*, javascript:, position:fixed.
7. Akhiri dengan komentar pemeriksaan: jumlah kartu masukan == jumlah kartu keluaran.`;

export default { PROMPT_PATEN_GEMINI, PROMPT_KONVERSI_ULANG };
