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
- **Fase 4** — varian dinonaktifkan; semua picker (guru, siswa, jadwal) otomatis menyembunyikan entri `dinonaktifkan`.

## 4. Setelah migrasi

- Entri registry = maksimal 32 kanonik + lokal tak terpeta yang dipertahankan.
- Tambah mapel baru: guardrail v1.5.4 menolak duplikat katalog dan otomatis memakai **kode kanonik** sebagai `kodeMapel` (bukan `MAPEL-XXX`); nama di luar katalog tetap wajib centang "sadar lokal".
- Mesin raport (`identitasMapel`, `raportCetak`) sudah toleran-varian sejak v1.5.3 dan mengenali kode kanonik langsung — PDF siswa jadi bersih tanpa rekap varian.

## 5. Jaminan keamanan data

- Dry-run murni (fungsi teruji, 6/6 subtest) — rencana dapat dihitung ulang kapan pun.
- Tidak ada `deleteDoc`: varian hanya dinonaktifkan (bisa dipulihkan manual di Firestore dengan menghapus flag).
- Tak terpeta = dibiarkan (prinsip "jangan pernah menebak" dari v1.5).
- Batch di-commit per ≤300 op; gagal di tengah = batch yang sudah commit tetap konsisten, jalankan ulang aman (idempoten).
- Audit lengkap: jumlah disemai/dibuat/guru/siswa/varian tercatat di `mapel.migrasi-v2`.
