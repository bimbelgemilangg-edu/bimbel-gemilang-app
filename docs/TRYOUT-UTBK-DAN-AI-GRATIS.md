# TRY OUT UTBK OTOMATIS & AI GRATIS — apakah mampu, dan bagaimana dipakainya

**Tanggal:** 2026-10-10 · branch `fitur/infrastruktur-pilot`
**Pertanyaan owner:** *"harus ditanamkan AI untuk menyiapkan soalnya? aku punya
API Google gratisan, apakah mampu?"*
**Jawaban singkat:** **Mampu.** Bahkan repo ini sudah dibangun untuk key gratis
itulah. Rinciannya di bawah, termasuk batasnya dan cara kerja yang tidak
melanggar aturan main blueprint.

---

## 1. AI sudah "tertanam" — tidak ada yang perlu ditanam ulang

Repo ini **sudah** punya pipa AI lengkap, dan semuanya memakai
`GEMINI_API_KEY` yang komentarnya sendiri berbunyi:

```
// GEMINI_API_KEY=... (buat GRATIS di https://aistudio.google.com/apikey
```

Yang sudah ada dan berjalan:

| Komponen | Berkas | Peran |
|---|---|---|
| Generator soal dari topik | `api/generateQuizFromTopic.js` | draf soal + pembahasan, **rantai model fallback** (gemini-3.6-flash → 3.5-flash-lite → …) dan penanganan kuota PER MODEL |
| Kontrak bentuk soal | `docs/KONTRAK-JSON-BANK-SOAL.md` + `utils/bankSoalSanitizer.js` | validator otomatis: tipe, kunci, opsi, LaTeX, gambar |
| Alur persetujuan | blueprint §4 + `ApprovalTryOutPage.jsx` | draf AI **tidak pernah** terlihat siswa sebelum lolos pemeriksa + manusia |
| Prompt paten | `utils/promptPatenGemini.js`, `docs/PROMPT-PATEN-SCAN-GEMINI.md` | prompt yang sudah ditempa insiden, bukan prompt pertama-coba |

Jadi pekerjaan UTBK bukan "menanam AI", tapi **mengarahkan pipa yang sudah ada**
ke 7 subtes (mapel `utbk_*` yang minggu lalu ditambahkan) dan memberi penskoran
berskala sendiri.

## 2. Apakah tier gratis mampu? Hitungannya

Beban nyata fitur ini kecil, karena try out UTBK Gemilang adalah **paket
mingguan**, bukan generator bebas tanpa rem:

```
1 paket Sabtu   = 155 soal (persis sheet KOMPONEN owner: 155 soal / 195 menit)
1 panggilan AI  = 10-20 soal  ->  ±8-16 panggilan per paket
+ ulang/revisi  = anggap 3x   ->  ±50 panggilan per paket
4 Sabtu/bulan   = ±200 panggilan/bulan
```

Tier gratis Gemini (angka berubah sewaktu-waktu; cek halaman kuota AI Studio
saat menerapkan) memberi **ribuan permintaan per hari per model** dan batas
per-menit belasan. ±50 panggilan per pekan berada **dua orde magnitudo di
bawah** jatah harian. Repo juga sudah mengantisipasi pola gagal tier gratis:
rantai fallback antar-model, dan `docs/POLICY-ERROR-DAN-KUOTA.md` yang
mewajibkan pesan manusiawi saat 429, bukan daftar kosong.

**Dua batas tier gratis yang harus dihormati, bukan dikeluhkan:**

1. **Privasi.** Pada tier gratis, Google dapat memakai prompt untuk
   memperbaiki modelnya. Maka **jangan pernah** mengirim data siswa ke AI:
   tidak nama, tidak NIM, tidak jawaban anak. Yang dikirim hanya spesifikasi
   topik ("subtes PK, kelas 12, level sedang, konteks grafik keuangan").
   Pipa yang ada sudah begitu — pertahankan.
2. **Kunci tetap di server.** `GEMINI_API_KEY` dibaca hanya di `api/*.js`.
   Jangan pernah memindahkannya ke `VITE_*` supaya tidak ikut terbundel ke
   browser siswa. Tempel key gratis owner di **Vercel → Environment
   Variables** (environment Production & Preview), bukan di kode.

## 3. Arsitektur: tidak ada function Vercel baru

Repo sudah **12/12 function Vercel** — function ke-13 membuat SEMUA deploy
gagal (penjaga ke-4 `ci-penjaga-konten.mjs`). Maka mode UTBK harus masuk ke
endpoint yang SUDAH ADA (`generateQuizFromTopic` dengan parameter mode/subtes),
bukan endpoint baru. Logika barunya (prompt subtes, pemetaan jebakan khas per
subtes dari sheet KOMPONEN) hidup di `lib/` atau `src/utils/` dan dipanggil
endpoint lama — mengikuti perintah penjaga itu sendiri: *"kode bersama hidup
di lib/ atau src/utils/, BUKAN di api/"*.

## 4. Sumber soal: AI adalah sumber KEDUA, bukan pertama

Urutan yang benar untuk try out UTBK, sesuai blueprint §4:

1. **Bank scan owner dulu.** Soal verbatim bank/official yang sudah di-scan
   lewat halaman Impor HTML (kini bertag `utbk_*`) adalah materi terbaik:
   asli, berlabel sumber, dan karakternya memang UTBK.
2. **AI menutup lubang.** Subtes yang bank scannya tipis (mis. PPU & PBM yang
   jarang ada di bank owner) diisi draf AI, lalu lolos validator + pemeriksaan
   tentor sebelum terbit. Statusnya tetap `draf` sampai manusia menyetujui.
3. **Tidak pernah sebaliknya.** AI tidak boleh mengisi daya tampung, skor
   acuan, kunci jawaban yang tidak dapat dipertanggungjawabkan, atau klaim
   "sering keluar". Bila tidak tersedia, sistem berkata belum tersedia.

## 5. Penskoran: skala menyerupai, bukan menyetarakan

`utils/skorSkalaUtbk.js` (8 uji) memetakan persen benar per subtes ke rentang
**300-800** secara linear dan monoton, total tertimbang jumlah soal. Setiap
hasil **wajib** membawa `LABEL_SKALA`:

> *"Skala internal Gemilang 300-800 yang menyerupai rentang skor UTBK …
> BUKAN skor UTBK resmi: tidak dihitung dengan IRT panitia…"*

Skor UTBK resmi memakai IRT atas soal berkalibrasi rahasia; meniru angkanya
tanpa mengaku adalah kebohongan yang rapi. Angka skala ini yang nantinya
**otomatis** mengisi kolom "skor try out skala UTBK" di halaman target —
menggantikan input manual admin, dengan keterangan sumber
`tryout-otomatis <tanggal>`.

## 6. Jadwal Sabtu: otomatis mesinnya, tombolnya masih manusia

`utils/templateTryoutUtbk.js` (uji menyertakan) menyimpan template persis
sheet KOMPONEN: 7 subtes, 155 soal, 195 menit, `hariDalamMinggu: [6]`,
timer per subtes, anti-cheat aktif. Mesin `mesinTryOutOtomatis.js` sudah bisa
menyiapkan draf slot minggu ini dan **wajib diterbitkan admin** sebelum
terlihat siswa.

**Otomasi penuh (cron Sabtu dini hari) SENGAJA belum dipasang.** Alasannya
teknis dan jujur: `mesinTryOutOtomatis.js` mengimpor `db` dari `src/firebase.js`
yang di Node polos jatuh ke konfigurasi **produksi** — skrip cron yang
memakainya akan menulis draf ke database produksi tanpa pagar. Memasang cron
dengan aman butuh refactor kecil (injeksi `db`), dan itu pekerjaan tersendiri
yang layak satu commit khusus. Sampai saat itu: **satu klik admin tiap pekan**
("Siapkan draf minggu ini" → periksa → terbitkan) adalah otomasi yang benar.

## 7. Urutan pengerjaan yang disarankan

1. Owner menempel `GEMINI_API_KEY` gratisnya di Vercel (Production + Preview).
2. Commit refactor injeksi `db` ke mesin try out (membuka jalan cron nanti).
3. Mode UTBK di `generateQuizFromTopic` (prompt 7 subtes, pakai jebakan khas
   dari sheet KOMPONEN yang sudah dipetakan `kunciSubtesPtn.js`).
4. Penskoran sesi try out menulis `skalaUtbk` lewat `skorSkalaUtbk.js`, dan
   halaman target membaca itu bila ada (input manual jadi cadangan).
5. Uji端到端 dengan akun uji: paket Sabtu draf → terbitkan → kerjakan sebagai
   `uji12` → skor skala muncul di kartu target Kaka tanpa diketik siapa pun.
