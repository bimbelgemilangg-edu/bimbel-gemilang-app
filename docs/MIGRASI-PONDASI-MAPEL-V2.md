# Migrasi Pondasi Mapel v2 — Katalog Kanonik (v1.5.4, 31 Okt 2026)

> Perintah owner: *"ganti semua dan daftarin ulang … ini akar atau pondasi …
> kamu audit dan kamu rombak."* Dokumen ini = hasil audit + cara menjalankan
> perombakan + isi katalog baru.

## 1. Audit: kenapa registry lama bermasalah

| Temuan | Akibat nyata |
|---|---|
| Satu mapel punya banyak varian per jenjang (`GEOGRAFI SMA`, `Geografi SMP`, …) dengan kode `MAPEL-XXX` acak | Mesin raport/taksonomi tidak mengenali kode; PDF siswa SMP "tidak efisien" (rekap berisik, badge varian tak menempel) |
| Program (TKA, English Course) campur aduk dengan mapel sekolah | Guru/siswa terdaftar di entri yang salah konteks |
| Subtes UTBK/SNBT tidak terdaftar rapi padahal bank soal sudah pakai kode `utbk_*` | Nilai try-out tak terhubung ke registry |
| Kode `MAPEL-XXX` tidak bermakna | Setiap fitur harus mencocokkan lewat nama (rawan salah, kasus `Sosiologi@SMP`) |

## 2. Katalog kanonik baru (32 entri — satu daftar kebenaran)

Sumber: `src/utils/katalogMapelGemilang.js` (murni, teruji `tests/katalogMapelGemilang.test.mjs`).

**Mapel sekolah = kode Kurikulum Merdeka** (jenjang diatur lewat *fase*, BUKAN sufiks nama):

| Kode | Mapel | Fase | Kelompok |
|---|---|---|---|
| `bind` | Bahasa Indonesia | A–F | wajib |
| `mtk` | Matematika | A–F | wajib |
| `bing` | Bahasa Inggris | B–F | wajib |
| `pancasila` | Pendidikan Pancasila | A–F | wajib |
| `pjok` | PJOK | A–F | wajib |
| `seni` | Seni dan Budaya | A–F | wajib |
| `pai` | Pendidikan Agama | A–F | wajib |
| `lit` | Literasi | A–F | wajib |
| `ipas` | IPAS | B–C (SD/SMP) | wajib |
| `ipa` | IPA | D (SMP) | wajib |
| `ips` | IPS | D (SMP) | wajib |
| `sej` | Sejarah | E–F | wajib |
| `tik` | Informatika | D–F | wajib |
| `fis` `kim` `bio` `sos` `eko` `geo` `ant` | Fisika/Kimia/Biologi/Sosiologi/Ekonomi/Geografi/Antropologi | E–F | peminatan |
| `mtk_tl` `bind_tl` `bing_tl` | …Tingkat Lanjut | F | peminatan |

→ Inti SD/MI owner (`bind`,`bing`,`mtk`,`ipas`) dan SMP/MTs (`bind`,`ips`,`bing`,`mtk`,`ipa`) termuat persis; SMA/SMK wajib+peminatan lengkap.

**Program UTBK/SNBT** (riset SNPMB 2026 — TPS 4 subtes + 3 literasi; kode = kode mesin taksonomi yang SUDAH dipakai bank soal):

| Kode | Subtes |
|---|---|
| `utbk_pu` | TPS/Penalaran Umum (**PU**) |
| `utbk_ppu` | TPS/Pengetahuan & Pemahaman Umum (PPU) |
| `utbk_pbm` | TPS/Pemahaman Bacaan & Menulis (PBM) |
| `utbk_pk` | TPS/Pengetahuan Kuantitatif (PK) |
| `utbk_lbi` | Literasi/Bahasa Indonesia (LBI) |
| `utbk_lbe` | Literasi/Bahasa Inggris (LBE) |
| `utbk_pm` | Literasi/Penalaran Matematika (PM) |

**Program lokal sah:** `prog_engc` (English Course), `prog_tka` (TKA — Tes Kompetensi Akademik).

## 3. Cara menjalankan migrasi (admin/owner)

1. Buka **Admin → Data Guru → kelola Mapel** (modal registry).
2. Paling bawah: panel **"Pondasi Mapel v2"** → klik **Hitung Rencana Migrasi (dry-run)**. Tidak ada data yang berubah pada tahap ini.
3. Tinjau tabel: entri kanonik hasil lebur, entri katalog baru yang disemai, varian yang akan dinonaktifkan, entri tak terpeta yang **dibiarkan apa adanya** (tidak pernah ditebak/dihapus).
4. Ketik **MIGRASI** pada kotak konfirmasi → **Jalankan Migrasi Sekarang**.
5. Selesai: notifikasi ringkasan + log audit `mapel.migrasi-v2`.

Yang dilakukan eksekutor (batch Firestore, aman diulang/idempoten):

- **Fase 0** — semai entri katalog yang belum terdaftar (mis. semua subtes UTBK).
- **Fase 1** — induk varian teramai dipakai ulang jadi dokumen kanonik (nama & `kodeMapel` diganti ke kanonik); varian lain ditandai `dinonaktifkan: true` + `digantikanKode` (TIDAK dihapus — jejak terjaga).
- **Fase 2** — **daftarin ulang semua guru**: `mapelDetails`/`mapelIds`/`mapel`/`kodeMapel`/`mapelId` ditulis ulang ke kode kanonik; varian per guru dilebur jadi satu entri; id dokumen di-remap ke induk kanonik; mapel lokal guru yang tak dikenali **dipertahankan**.
- **Fase 3** — `enrolledSubjects` siswa dipetakan ke kode kanonik (dedupe; `semua` dihormati; yang tak terpeta dibiarkan).
- **Fase 3b/3c/3d (v1.5.5)** — kode mapel lama yang menempel di `bimbel_modul` (materi/kuis/tugas — dibaca pagar akses siswa), `jadwal_bimbel` (mapelId+mapelName), dan `laporan_belajar` (capaian guru) ikut dipetakan ke kanonik.
- **Fase 4** — varian dinonaktifkan; semua picker (guru, siswa, jadwal) otomatis menyembunyikan entri `dinonaktifkan`.

## 4. Setelah migrasi

- Entri registry = maksimal 32 kanonik + lokal tak terpeta yang dipertahankan.
- Tambah mapel baru: guardrail v1.5.4 menolak duplikat katalog dan otomatis memakai **kode kanonik** sebagai `kodeMapel` (bukan `MAPEL-XXX`); nama di luar katalog tetap wajib centang "sadar lokal".
- Mesin raport (`identitasMapel`, `raportCetak`) sudah toleran-varian sejak v1.5.3 dan mengenali kode kanonik langsung — PDF siswa jadi bersih tanpa rekap varian.

## 5. Jaminan keamanan data

- Dry-run murni (fungsi teruji) — rencana dapat dihitung ulang kapan pun.
- Tidak ada `deleteDoc`: varian hanya dinonaktifkan (bisa dipulihkan manual di Firestore dengan menghapus flag).
- Tak terpeta = dibiarkan (prinsip "jangan pernah menebak" dari v1.5).
- Batch di-commit per ≤300 op; gagal di tengah = batch yang sudah commit tetap konsisten, jalankan ulang aman (idempoten).
- Audit lengkap: jumlah disemai/dibuat/guru/siswa/modul/jadwal/laporan/varian tercatat di `mapel.migrasi-v2`.

## 6. Audit "akar rambut terkecil" pra-klik (v1.5.5, 31 Okt 2026)

Owner: *"cek dari akar rambut terkecil, jangan sampai ada siswa atau guru terblokir karena salah sistem atau bug"*. Hasil telusur SEMUA jalur yang menyentuh kode mapel — 3 celah ditemukan dan ditutup SEBELUM migrasi boleh diklik:

| # | Celah | Akibat bila dibiarkan | Fix v1.5.5 |
|---|---|---|---|
| 1 | Kode mapel lama juga menempel di `bimbel_modul` (materi/kuis/tugas), `jadwal_bimbel`, `laporan_belajar` — migrasi awal cuma menulis guru+siswa | **Siswa terkunci dari modulnya sendiri** (enrolled `geo` vs modul `MAPEL-019`); capaian guru "menghilang" dari menu Laporan Belajar; referensi jadwal menggantung ke dokumen nonaktif | Eksekutor menambah Fase 3b/3c/3d: rewrite `kodeMapel` modul, `mapelId`+`mapelName` jadwal, `kodeMapel`+`namaMapel` laporan guru (id dokumen tak disentuh — history aman). Dry-run menampilkan hitungannya. |
| 2 | Bug resolver sejak v1.5.3: kode `'bind'` terserempet aturan includes ke `'bindo tingkat lanjut'` → resolve salah ke `bind_tl` | Salah caplok mapel di PDF/guardrail/pagar akses | `kodeKurikulumDariNama`: exact-KODE dicek dulu (sebelum & sesudah norm, underscore aman), arah substring wajib ≥6 karakter dua sisi. Regression test ditambahkan. |
| 3 | Pagar akses modul ada 4 salinan identik (`hasSubjectAccess` di 4 halaman siswa), pencocokan eksak saja | Satu dokumen modul yang lolos rewrite = siswa terkunci diam-diam | Satu sumber `cocokkanAksesModul()` di `aksesKontenSiswa.js`: semantik lama persis + fallback kode kanonik STRICT (anti jebakan `ipa`⊂`ipas`, `bind`⊂`bind_tl`); 4 halaman kini impor dari satu file. Latihan Harian ikut dinormalisasi dua sisi (aman di era pra- maupun pasca-migrasi). |

**Bukti otomatis** (bukan janji): `tests/simulasiMigrasiV2.test.mjs` membangun dunia mock berantakan (varian ganda, guru legacy field-tunggal, program lokal, subtes UTBK, mapel tak dikenal, siswa `semua`/kosong, modul tanpa kode) lalu menjalankan seluruh rantai migrasi dan memverifikasi 7 invarian keras — yang terpenting: **setiap pasangan (siswa × modul) yang lolos pagar akses SEBELUM migrasi PASTI tetap lolos SESUDAH migrasi** (diuji berpasangan, bukan sampling), tidak ada `undefined` di payload mana pun (Firestore menolaknya), guru tak kehilangan mapel sah, capaian guru tetap tercocokkan eksak, jadwal tak menggantung, dan aturan owner "enrolledSubjects kosong = BLOKIR" tetap keras. Semua hijau (7/7; total 134 berkas uji lulus).

Yang **TIDAK** disentuh migrasi (sengaja): status blokir/aktif siswa, kredensial login guru, dokumen history (notifikasi lama, submission, progres soal) — tidak ada jalur migrasi yang bisa memblokir akun siapa pun.

## 7. Catatan operasional

- Jalankan saat aplikasi sedang sepi (di luar jam kelas): eksekusi batch hanya beberapa detik, tetapi selama itu ada jendela singkat di mana sebagian data sudah kanonik dan sebagian belum (pagar akses v1.5.5 sudah toleran dua arah, jadi tidak ada yang terkunci — hanya daftar guru/siswa bisa tampak belum lengkap sejenak).
- Setelah migrasi selesai: guru & admin yang sedang login sebaiknya **memuat ulang halaman** (state lama mereka masih memegang kode pra-migrasi).


## 8. Audit pasca-klik produksi + v1.5.6 (2 Nov 2026)

Owner mengklik MIGRASI di produksi. Audit menyeluruh via Firestore REST (bukan janji — baca data nyata):

**Yang benar ✅** — 32 dokumen kanonik aktif lengkap: **Matematika (`mtk`, wajib semua fase) dan Matematika Tingkat Lanjut (`mtk_tl`, peminatan fase F) dua-duanya ada dan terpisah dengan benar**; 8 varian lama dinonaktifkan rapi dengan `digantikanKode`; 27 laporan guru semuanya sudah kanonik.

**Dua klaster sisa yang ditemukan & dibereskan** (akar masalahnya data lama pra-migrasi, bukan mesin v2):

| Klaster | Akar masalah | Dampak | Penanganan |
|---|---|---|---|
| A — kode yatim `MAPEL-012` | Dokumen registry "IPS (Pengganti)" pernah **dihapus manual** sebelum migrasi → kodenya tak ada di katalog, migrasi tak bisa memetakannya ("jangan menebak") | 1 guru, 11 siswa (`enrolledSubjects`), 8 modul, 7 jadwal masih memegang kode mati | Data produksi diperbaiki via REST (guru Asril, 8 modul → `ips`, sebagian commit atomik sudah masuk); v1.5.6 menambah **penyelamat kode yatim** (`petakanKodeYatim`) di eksekutor agar kasus serupa di masa depan terdeteksi otomatis dari nama pendampingnya |
| B — resolver sufiks rakus | Bug v1.5.3: `"matematika minat sma"` membuang SEMUA sufiks sekaligus → jatuh ke `matematika` (`mtk`) sebelum alias `"matematika minat"` → `mtk_tl` sempat dicoba | MAPEL-017 (Matematika Minat SMA) salah lebur ke `mtk` wajib; 1 guru kehilangan entri peminatan, 5 siswa kehilangan `mtk_tl`, 3 modul minat berkode `mtk` | Resolver v1.5.6 membuang sufiks **bertahap** dan menguji tiap tahap (`matematika minat sma` → `matematika minat` → `mtk_tl` ✓); `digantikanKode` MAPEL-017 dikoreksi ke `mtk_tl`; guru MIFTAH dipulihkan `[mtk, mtk_tl]` di produksi |

**Perbaikan kode v1.5.6:**
1. `identitasMapel.js` — langkah 2 resolver kini iteratif: setiap tahap pembuangan sufiks diuji terhadap exact-nama & alias (regression test `matematika minat sma` → `mtk_tl`).
2. `katalogMapelGemilang.js` — fungsi murni `petakanKodeYatim(entriBernama, petaKode)`: kode yang tidak dikenal katalog tapi punya nama pendamping yang resolve STRICT ke entri kanonik → dipetakan (bukan ditebak).
3. `TeacherList.jsx` — dry-run DAN eksekusi memakai peta hasil merge kode yatim yang sama (dihitung dari snapshot live: guru `mapelDetails`+legacy split, modul `kodeMapel`+`subject`, laporan `kodeMapel`+`namaMapel`); modal menampilkan chip **"Kode yatim diselamatkan"** + detail `lama → tujuan`; audit `mapel.migrasi-v2` mencatat daftar kodenya.

**Status reparasi data produksi:** commit atomik pertama sudah masuk (HTTP 200): guru Asril, 8 modul `MAPEL-012`→`ips`, MIFTAH `[mtk, mtk_tl]`, plus `digantikanKode` MAPEL-017→`mtk_tl`. Sisanya (11 siswa drop `MAPEL-012`, 7 jadwal `mapelName`→IPS, 5 siswa +`mtk_tl`, 3 modul minat→`mtk_tl`) tertunda **kuota baca harian Firestore habis** (429 RESOURCE_EXHAUSTED, free tier; tulis tidak terpengaruh) — skrip `scratchpad/reparasi-hemat.mjs` (structuredQuery, penjaga jumlah 11/8/3/7/5) siap dijalankan setelah reset kuota (~15:00 WIB). Tidak ada risiko lockout: ke-11 siswa itu sudah memegang `ips`. PENTING: karena sumber nama MAPEL-012 di produksi sudah dibersihkan, menjalankan ulang migrasi UI TIDAK bisa menyembuhkan sendiri sisa klaster A — skrip reparasi wajib dijalankan.
