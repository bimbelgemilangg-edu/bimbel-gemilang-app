# DAFTAR-ROLLOUT.md — ledger perubahan: mana yang berlaku untuk siapa

**Dimulai 14 Okt 2026** sesudah kekhawatiran owner: *"jangan-jangan perbaikan
kita tidak pernah dikerjakan untuk seluruhnya di aplikasi ini"*.
Berkas ini adalah BUKTI dan SOP: setiap perubahan punya baris berisi status
merge, deploy production, cakupan berlaku, dan sisa gerbang. Baris baru
WAJIB ditambah oleh sesi kerja mana pun sebelum menutup pekerjaan.

Cara memverifikasi ulang baris mana pun:
1. `git log origin/main --oneline | grep <sha>` — merge sudah di main?
2. Vercel → Deployments → baris merge tsb ber-badge **Production**?
3. Ada gerbang (sakelar/role/config) yang masih memfilter pengguna? Kolom
   "Sisa gerbang" wajib jujur; "—" berarti berlaku untuk semua tanpa syarat.

---

## Ledger sesi 14 Okt 2026 (PR #204–#217, SEMUA merged ke main)

| PR | Isi | Merge | Production | Cakupan | Sisa gerbang |
|---|---|---|---|---|---|
| #204 | runner uji otomatis (85→86+ berkas), lint mekanis lunas, cetak biru | `744366f` | ✅ | internal dev/CI | — |
| #205 | util dokumenTryOut (per test), tumpukan dokumen di Daftar Try Out, 10 maskot astronot | `3a974bf` | ✅ | semua siswa (tampilan cadangan) | tampil hanya bila rem darurat papanJelajah aktif |
| #206 | rakit tentor: jenjang wajib satu (data siswa), riwayat+perbaiki di depan | `c1c90f4` | ✅ | semua tentor & admin | — |
| #207 | Papan Jelajah Duolingo (streak→kalender geser→misi per test, bola 3D) | `e7d5459` | ✅ | semua siswa | sakelar papanJelajah (default NYALA sejak #217) |
| #208 | bola transparan, tanpa kata "AI" di UI siswa, streak keluar menu Try Out, menu sidebar Try Out & Latihan Harian | `24b4160` | ✅ | semua siswa | — |
| #209 | uji e2e kontrak alur AI→nilai + docs/ALUR-AI-KE-NILAI.md | `9786e60` | ✅ | internal dev/CI | — |
| #210 | dialog Cetak Naskah via portal, kolom Aksi sticky | `707e704` | ✅ | semua admin/tentor pencetak | — |
| #211 | tombol Susulan dihapus; Catat Nilai Susulan PDF di Hasil Try Out | `b04e9cf` | ✅ | semua admin | — |
| #212 | kwitansi setengah A4 potret tegak | `c979a05` | ✅ | semua admin keuangan | — |
| #213 | papanJelajah default NYALA (rollout) | `491c175` | ✅ | niat: semua siswa | ⚠️ sempat tidak efektif (bug kasus huruf) → diperbaiki #217 |
| #214 | analitik siswa akurat (inferensi jenisUjian jalur tentor/manual) | `c7d337f` | ✅ | semua siswa | — |
| #215+#216 | Dashboard Analitik Belajar admin (/admin/analitik-belajar) | `9a54e85`,`c6d4e5b` | ✅ | semua admin/owner | — |
| #217 | BUG ROLLOUT: default-nyala ternormalkan + pilot whitelist lama diabaikan + harness uji exit non-zero | `401a82f` | ✅ | semua siswa (rollout efektif) | rem darurat: fiturPilot.papanJelajah.aktif=false |

**Catatan jujur:** satu-satunya perubahan yang pernah *tidak* berlaku untuk
semua siswa adalah rollout tampilan baru (#213) karena bug perbandingan
huruf + sisa konfigurasi pilot di Firestore — ditemukan owner di produksi,
diperbaiki #217, dan penyebab ikutannya (harness uji yang tidak exit non-zero)
ikut diperbaiki supaya CI tidak bisa lagi meloloskan kegagalan diam-diam.
Selain itu, keterlambatan tampil di perangkat siswa bisa terjadi sesaat karena
PWA auto-update: bundle baru aktif pada reload berikutnya (stempel build di
footer sidebar = cara memastikan).

---

## SOP rollout (wajib mulai sekarang)

1. **Setiap PR menyatakan "Cakupan berlaku" dan "Gerbang"** di badannya:
   untuk siapa perubahan efektif saat merge, dan gerbang apa (sakelar, role,
   konfigurasi) yang masih bisa memfilternya.
2. **Gerbang fitur hanya untuk masa pengembangan.** Saat owner menyatakan
   rollout: pilih (a) hapus gerbang, atau (b) masukkan ke
   `FITUR_DEFAULT_NYALA` + bersihkan/abaikan sisa konfigurasi pilot. Jangan
   pernah meninggalkan whitelist pilot sebagai penentu setelah rollout.
3. **Sesudah merge: verifikasi tiga titik** — sha merge ada di `origin/main`;
   baris deploy-nya ber-badge Production di Vercel; tidak ada config Firestore
   lama yang menimpa (cek `settings/global_config`).
4. **Uji wajib gagal dengan suara keras**: setiap harness uji custom harus
   `process.exit(1)` saat ada kegagalan (sudah dipaksakan di sakelarFitur &
   koreksiNominal; periksa berkas uji baru meniru ini).
5. **Perubahan tampilan lintas-peran** (siswa/admin/tentor) diuji minimal di
   satu akun tiap peran sebelum dinyatakan selesai.
6. Ledger ini diperbarui PADA HARI perubahan merge, bukan belakangan.
