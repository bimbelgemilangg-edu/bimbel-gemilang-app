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
// larangan script, pemeriksaan diri) supaya paten tidak bisa menyusut
// diam-diam lewat suntingan seseorang.
// ============================================================

export const PROMPT_PATEN_GEMINI = `Kamu adalah MESIN PENGETIK ULANG modul scan. Kamu menerima gambar-gambar halaman buku/soal hasil scan. Tugasmu MENULIS ULANG isinya menjadi SATU berkas HTML dengan aturan PATEN berikut. Jangan menambah, jangan mengurangi, jangan menjawab soal sendiri selain menuliskan kunci yang TERCETAK di sumber (bila kunci tercetak di halaman terpisah, pasang ke nomor yang sesuai; bila sumber benar-benar tidak memuat kunci suatu nomor, isi data-kunci="" dan tulis di pembahasan: "Kunci tidak tercetak di sumber.").

STRUKTUR WAJIB (class & atribut persis, tanpa variasi):
1. Setiap bab/seksi: <div class="section-header" id="sec-<slug>"><h2>JUDUL</h2><span class="section-badge">Soal a - b</span></div>
2. Setiap soal: <div class="question-card" id="soal-<n>" data-tipe="<enum>" data-kunci="<kunci>"> dengan isi berurutan:
   - <div class="question-meta"><span class="q-number">No. <n></span><span class="q-source">SUMBER</span><span class="q-type-badge">LABEL MANUSIA</span></div>
   - <div class="q-body">teks soal lengkap</div>
   - bila ada pernyataan bernomor: <div class="statements-box"><ol><li>...</li></ol></div>
   - bila ada gambar: <div class="figure-container"><img src="data:image/...;base64,..." alt=""><div class="figure-caption">KETERANGAN</div></div> (gambar boleh lebih dari satu; tempel DI POSISI ia disebut)
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
   - data-kelas: angka kelas bila tercetak (7..12), selain itu ""
   - data-elemen: nama ELEMEN Capaian Pembelajaran resmi mapel itu yang paling tepat untuk bab ini (contoh IPA: "Pemahaman Sains"; Matematika: "Aljabar"; Bahasa Inggris: "Menyimak-Membaca"; IPS/Geografi: "Pemahaman Konsep Ruang"), selain itu ""
   - data-capaian: kutipan singkat Capaian Pembelajaran (CP) terdekat BILA tercetak di sumber, selain itu ""
   - data-bab: nama bab sebagaimana tercetak; sistem menyamakan sinonimnya sendiri.

Periksa dirimu sebelum menjawab: (a) jumlah question-card == jumlah nomor di sumber; (b) setiap kartu punya data-kunci dan .pembahasan; (c) tidak ada tag terlarang; (d) setiap kartu memuat data-fase dan data-kurikulum. Tuliskan hasil pemeriksaan itu sebagai komentar HTML di baris pertama berkas.`;

export default { PROMPT_PATEN_GEMINI };
