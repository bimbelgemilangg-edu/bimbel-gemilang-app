# 👑 CETAK BIRU GEMILANG PREMIUM — Hasil Riset Turn 81, struktur wadah Turn 82

> Perintah owner Turn 81: *"ulangi dari materi awal; riset dulu tampilan belajar
> menarik, sumber materi, buku, aset soal asli, gambar HD, pola materi & soal —
> seperti Zenius, Ruangguru, atau cara cepat Gemilang seperti 'The King' Ganesha
> Operations — baru eksekusi nanti."*
> Dokumen ini = kontrak kualitas. Tidak ada materi baru yang masuk sebelum
> pilot bab lolos cetak biru ini.

## 1. BENCHMARK: apa yang membuat terasa premium, dan padanan Gemilang

| Aplikasi | Pola unggulan (riset) | Adopsi Gemilang |
|---|---|---|
| **Ruangguru (ruangbelajar)** | Video beranimasi interaktif; **Konsep Kilat** (video konsep super pendek); **Adapto/AdaptoX** (jalur adaptif); **Zona Berlatih**; **Playlist Rangkuman**; bank soal + jadwal | "Kartu Konsep Kilat" 60 detik di pembuka tiap subbab; **Zona Berlatih** = kuis 3 soal per subbab sebelum uji bab; **Playlist King Sheet** = tab Ringkasan berisi kumpulan kartu KING per bab |
| **Zenius** | Fondasi *fundamental skills* dulu; pemahaman konsep besar, bukan hafalan; video "big picture" | Tiap bab dibuka section **"Peta Besar"** (paragraf + bagan 1 layar: kenapa topik ini ada & ke mana menyambung); contoh selalu menurunkan rumus, bukan menyebut |
| **Duolingo** | *Daily habit loop* & streak; pelajaran *bite-sized*; mastery review; feedback instan merayakan progres | Bite-sized: 1 subbab = 6-9 kartu baca (max ±4 layar HP); streak/XP sudah ada → tambah **target harian 3 kartu** + perayaan kecil tiap subbab tuntas |
| **Ganesha Operation "THE KING"** | Konsep/rumus terkode untuk jawab **cepat-tepat-akurat**; buku KODING (konsep dasar + The King); kebiasaan siswa: menuliskan rumus The King & rangkuman sendiri | **Sistem GEMILANG THE KING** (§3): kartu rumus terkode per subbab + King Sheet per bab + kartu tantangan "tulis KING-mu" |

## 2. POLA MATERI PER SUBBAB (template wajib, mobile-first)

Urutan kartu (semua kartu = komponen reader yang sudah ada, distyling premium):
1. **🎯 Konsep Kilat** (callout info, ≤3 kalimat): janji subbab + kata kunci.
2. **🗺 Peta Besar** (paragraf + bagan kecil bila perlu): posisi konsep dalam bab/TKA.
3. **📖 Konsep 1 & 2** (2 paragraf beranalogi sehari-hari → definisi → contoh mikro).
4. **🖼 Visual ber-anatomi KAIDAH** (asli/HD ber-kredit; pengantar → gambar → poin 🔍 → kaitan).
5. **📊 Tabel/bagan berisi** (pembanding/ringkasan; N-kolom render penuh).
6. **✍️ Contoh terpecah langkah** (Langkah 1..n meniru pola soal bank; tutup dengan jawaban).
7. **👑 Kartu Cara Gemilang** (jenis `caraGemilang`, frame ungu-emas bermaskot): KODE CG + rumus/cara cepat + kapan dipakai + contoh 10 detik.
8. **⚠️ Jebakan** (callout peringatan): 1-2 kesalahan paling umum + cara menghindarinya.
9. **🎮 Zona Berlatih** (jenis `zona`: 3 soal mini 1 mudah-1 sedang-1 HOTS; koreksi instan lokal; kunci terbuka per soal setelah tombol Cek).
10. **🔁 Ringkas Sendiri** (callout guru/contoh): prompt siswa menuliskan KING versi sendiri (kebiasaan GO).

Aturan lintas kartu: paragraf ≤4 kalimat/kartu di HP; istilah baru langsung dijelaskan;
setiap klitik visual wajib punya kalimat pemakai; **kolaborasi buku wajib** (rujuk
halaman bank owner / buku paket / BSE di teks atau daftarPustaka).

## 3. SISTEM "CARA GEMILANG" (cara cepat khas kita — BUKAN The King;
> The King GO hanya POLA ACUAN. Nama & merek kita: **CARA GEMILANG —
> Sistem Langkah Gemilang**, maskot astronot mahkota ungu-emas.)

- **Format kartu Cara Gemilang:** `👑 CG-<KODE>: <nama jurus>` + isi rumus/langkah maksimal
  2 baris + "pakai saat: ..." + "contoh kilat: ...".
  Contoh: `CG-MOL: n = m/M = V/22,4 = N/NA = M×V — pakai saat soal menukar gram-liter-partikel; contoh kilat: 8 g O2 = 8/32 = 0,25 mol = 5,6 L.`
- **Lembar Cara Gemilang bab:** tab Ringkasan otomatis menampilkan DAFTAR kartu
  Cara Gemilang bab itu (satu layar gulir) = padanan "Playlist Rangkuman"
  Ruangguru & buku KODING GO. SUDAH TERDEPLOY (Turn 82, branch
  feat/struktur-cara-gemilang): jenis section `caraGemilang`, `kilat`, `peta`,
  `zona` + agregasi lembar di tab Ringkasan => **produksi konten berikutnya
  cukup impor JSON, tanpa deploy ulang.**
- **Ujian cepat:** di pembahasan soal, setelah cara panjang wajib ada baris
  **"Jalur KING:"** satu kalimat cara cepat → siswa melihat kedua jalur (paham + cepat).
- Penamaan kode konsisten per mapel: KING-MOL, KING-PEMBATAS, KING-VSEPR,
  KING-REF (reference narrative), KING-IDENT (identification descriptive), dst.

## 4. SUMBER & ASET (inventaris siap pakai)

| Mapel | Bank soal owner (verbatim) | Buku/rujukan materi | Gambar HD |
|---|---|---|---|
| Kimia | Gercep TKA 26 Kimia (01-12) + Pusmendik 20 soal resmi | BS IPA 10 Kurmer (Drive), BSE K-13 Kimia X (mirror penerbitcmedia bila terjangkau), modul tentor hlm 207-233 | crop vektor 300-900 dpi + Commons PD/CC (tokoh, grafik) |
| Sosiologi | Sukses TKA 26 Sosiologi (01-12) | bank 01-07 + buku paket sosiologi Kurmer (SIBI) bila terjangkau | Commons PD/CC + bagan penunjang berlabel |
| B. Inggris | Sukses TKA 26 Bhs Inggris (01-12) | bank 01-07 (teks adaptasi britannica/unesco berlabel) + BSE B. Inggris SMA | foto/infografis Commons CC + bagan struktur |
| Biologi | (bank lama owner) + Pusmendik | BSE K12/K13 biologi (crop 300 dpi sudah ada) | crop BSE + Commons |
| Mapel baru | minta bank owner per mapel SEBELUM eksekusi | SIBI/BSE + modul tentor | pipeline: crop buku → Commons → canvas penunjang |

Pipeline gambar HD tetap: (1) crop buku 300+ dpi bbox tinta → verifikasi visual;
(2) Commons PD/CC ber-kredit; (3) canvas penunjang BERLABEL penunjang; semua
unggah Supabase + HEAD 200; HOTLINK dilarang.

## 5. POLA SOAL (templateverbatim + dua jalur)

1. **Stimulus** (teks/gambar terlampir wajib; gambar = crop PDF bank atau Commons).
2. **Soal verbatim** bank/official berlabel sumber + nomor asli.
3. **Opsisi/kolom** lengkap termasuk pengecoh (validator: opsi > premis untuk jodoh).
4. **Pembahasan dua jalur:** (a) jalur konsep langkah 1..n; (b) **"Jalur Cara Gemilang:"**
   satu kalimat cara cepat; bila gambar: lapisan anotasi 🔍 + keterangan.
5. **Kunci** hanya dari file kunci sumber; tanpa kunci sumber = soal tidak dipakai.
6. Distribusi per bab: 15-20 soal, 6 format TKA, min. 40% verbatim bank/official.

## 6. RENCANA EKSEKUSI (setelah owner setujui dokumen ini)

- **Turn 82 (PILOT):** bangun ulang **Kimia bab 1** full template §2 + §3 (KING
  cards + King Sheet + Zona Berlatih 3 soal/subbab) + kolaborasi buku; owner
  review di HP via preview branch.
- **Turn 83+:** roll-out berurutan: Kimia bab 2 → Inggris bab 1 → Sosiologi bab 1
  → dst.; **freeze mapel/bab baru** sampai pilot & roll-out lolos review owner.
- Gerbang rilis per bab: validator hijau + audit "sebut gambar = terlampir" +
  checklist §2 lengkap + screenshot mobile 3 layar (materi, king sheet, latihan).
