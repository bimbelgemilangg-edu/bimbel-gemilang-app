# SOP Keselamatan Perubahan — janji kerja teknisi Gemilang App

**Berlaku untuk:** siapa pun yang mengubah repo ini — manusia, Qwen, atau
sistem AI lain yang diundang owner. Ditulis 2026-10-01 sebagai komitmen yang
mengikat, bukan saran.

Aplikasi ini dipakai harian oleh siswa, guru, kasir, dan owner, dan deploy
ke produksi terjadi OTOMATIS setiap merge ke `main` (PWA `autoUpdate`
memasukkannya ke HP pengguna tanpa mereka minta). Karena itu setiap
perubahan diperlakukan seperti obat yang masuk ke tubuh pasien:
**bawa pengawalnya sendiri, atau jangan masuk.**

---

## Tujuh janji per perubahan

1. **Kompatibel mundur dulu, fitur kemudian.**
   Tidak ada perubahan yang boleh mengunci orang di luar atau memutus alur
   yang sedang dipakai. Pola yang dipakai repo ini: jalur baru ditambah,
   jalur lama dibiarkan hidup dengan fallback, jalur lama dimatikan belakangan
   lewat sakelar yang sadar (contoh: `izinkanLoginAdminLegacy`).

2. **Kode keamanan & kode uang wajib punya test SEBELUM merge.**
   Logika hash/kredensial dan logika keuangan (saldo, kanal, amortisasi,
   skoring) tidak boleh dikirim "percaya saja". Test ditulis sebagai
   invarian ("setor kas tidak boleh mengubah total"), bukan potret output.

3. **Setiap penghapusan gerbang pengamanan wajib menyebut penggantinya.**
   Contoh nyata: gerbang PIN internal halaman gaji dihapus karena kewenangan
   pindah ke admin — penggantinya jejak audit yang menyetempel siapa mengubah
   apa. Menghapus tanpa pengganti = menolak dengan sopan.

4. **Lint-bersih untuk berkas yang disentuh; transform-bersih untuk semua.**
   Menyentuh sebuah berkas berarti bertanggung jawab membersihkannya
   (ditegakkan CI). Semua berkas yang berubah wajib lolos parse/transform
   sebelum commit.

5. **Tidak menulis ke database produksi dari kode atau skrip tanpa alasan.**
   Diagnosis boleh membaca. Probe tulis hanya ke koleksi scratch yang
   langsung dihapus. Perubahan data produksi adalah keputusan owner, bukan
   efek samping deploy.

6. **Secret tidak pernah masuk commit, termasuk "sekadar untuk test".**
   Penjaga gerbang CI menolak pola PAT/kunci/private key. Konfigurasi lewat
   environment variable yang terdaftar di `.env.example`.

7. **Jujur soal yang tidak terverifikasi.**
   Kalau build tidak bisa dijalankan di lingkungan pengerjaan, dikatakan.
   Kalau hipotesis bug ternyata salah, dikatakan dan tidak "diperbaiki".
   Kalau sebuah fitur belum selesai dibangun pendahulu, ditandai TODO, bukan
   dikarang kelanjutannya.

---

## Alur kerja standar (mulai 2026-10-01)

1. Kerja di **branch**, bukan langsung di `main`.
2. Buka **pull request** → CI (`/.github/workflows/ci.yml`) menjalankan
   test + penjaga gerbang + lint berkas berubah + build produksi.
3. Merge hanya ketika semua gerbang **hijau**. Vercel lalu deploy `main`
   otomatis; hijau di CI adalah prediktor terbaik hijau di Vercel karena
   perintah build-nya sama.
4. Push langsung ke `main` tetap membunyikan CI sebagai **alarm** — kalau
   suatu hari ada yang lewat tanpa PR, merahnya terlihat di riwayat commit.

Branch protection (wajib PR + wajib gerbang hijau untuk merge) disarankan
diaktifkan setelah CI terbukti stabil beberapa hari, supaya tidak menjebak
perbaikan darurat saat CI sendiri masih baru.

---

## Yang CI tidak jaga (jadi jangan lengah)

- Bug logika bisnis yang belum punya test — karena itu daftar test
  ditumbuhkan tiap ada insiden baru.
- Keputusan produk yang salah tapi konsisten (mis. tarif salah ketik namun
  konsisten dipakai) — itu wilayah review manusia/owner.
- Kebocoran lewat database yang terbuka — itu wilayah runbook keamanan,
  bukan CI. Lihat `docs/KEPUTUSAN-RISIKO-FIRESTORE.md`.

---

## Kalau sesuatu tetap rusak di produksi

1. Jangan panik-mengutak-atik: `git revert` commit penyebab adalah jalur
   tercepat dan terhormat; riwayat menyimpan semuanya.
2. Tulis insidennya di `docs/` seperti pendahulu repo ini melakukannya —
   komentar "🔥 FIX ..." yang menjelaskan MENGAPA adalah aset, bukan sampah.
3. Tambahkan test yang akan menangkap bug itu selamanya. Bug yang pernah
   terjadi dua kali adalah kegagalan proses, bukan kegagalan orang.
