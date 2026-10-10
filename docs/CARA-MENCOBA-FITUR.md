# CARA MENCOBA FITUR BARU — dari nol sampai terlihat di HP

**Tanggal:** 2026-10-10 · branch `fitur/infrastruktur-pilot` (17 commit)
**Untuk:** owner Bimbel Gemilang
**Janji dokumen ini:** setelah mengikuti langkah di bawah, kamu bisa klik
seluruh rantai fitur baru **tanpa menyentuh data siswa sungguhan**.

---

## 0. Kenapa hari ini fitur itu belum bisa diklik di mana pun

Tiga hal yang harus ada dulu, dan tidak satu pun yang bisa kulakukan sendiri
dari workspace ini:

| # | Yang belum ada | Siapa yang bisa |
|---|---|---|
| 1 | Kode ada di **workspace ini**, belum di GitHub/Vercel. Push butuh kredensial GitHub — aku tidak menyimpan tokenmu | **kamu** (satu perintah, lihat §2) |
| 2 | **Proyek Firebase dev** sebagai sandbox. Preview Vercel tanpa ini tetap menunjuk produksi | **kamu** (Firebase Console, ±5 menit) |
| 3 | **Isi database dev**: database PTN + akun uji + sakelar fitur | skrip yang sudah kubuat (§4–§6) |

---

## 1. Akun uji (sudah disiapkan, tinggal seed)

| Peran | Username | Password | Untuk mencoba |
|---|---|---|---|
| Siswa kelas 12 | `uji12` | `uji12345` | chip goal di depan nama & NIM, kartu target, menu Target Kampusku |
| Siswa kelas 10 | `uji10` | `uji12345` | **membuktikan** kelas 10 tidak tersentuh |
| Siswa SMP | `ujismp` | `uji12345` | **membuktikan** SMP tidak tersentuh |
| Admin Manajer | `ujimanajer` | `uji12345` | `/admin/ptn/impor` dan `/admin/ptn/target` |
| Guru | `guru.uji@gemilang.test` | `uji12345` | portal guru (fitur baru tidak mengubahnya) |
| Owner | — | PIN Anda | tidak di-seed; PIN tidak boleh ada di skrip |

Nama akun siswa sengaja mencolok (`UJI COBA — … JANGAN DINILAI`) supaya tidak
nyasar ke leaderboard/rapor sungguhan kalau suatu hari ter-seed ke produksi.

---

## 2. Jalankan kode branch ini (pilih salah satu)

### Jalur A — laptop kamu sendiri (paling cepat, nol deploy)

```bash
# sekali saja
git clone https://github.com/bimbelgemilangg-edu/bimbel-gemilang-app.git
cd bimbel-gemilang-app

# terapkan 17 commit dari workspace Qwen (file bundle/patch sudah disiapkan)
git pull /path/ke/BRANCH-fitur-infrastruktur-pilot.bundle   # atau:
# git am /path/ke/PATCH/*.patch

npm ci
```

### Jalur B — push ke GitHub, pakai preview Vercel

```bash
# dari mesin yang punya kredensial GitHub kamu:
git push origin fitur/infrastruktur-pilot   # setelah pull bundle di atas
```

Vercel otomatis membuat **preview URL** untuk branch itu (bukan URL produksi
yang terpasang di HP siswa). Lihat di dashboard Vercel → Deployments → branch
`fitur/infrastruktur-pilot`.

⚠️ Untuk Jalur B, set dulu di Vercel → Project → Settings → Environment
Variables (pilih **Preview**): `VITE_FIREBASE_PROJECT_ID` dll. diarahkan ke proyek dev.
Tanpa itu preview tetap menunjuk produksi.

---

## 3. Buat proyek Firebase dev (±5 menit, gratis)

1. https://console.firebase.google.com → **Add project** → nama
   `gemilangsystem-dev`.
2. Build → Firestore → **Create database** (mode produksi boleh; rules terbuka
   bukan masalah untuk sandbox kosong).
3. Project settings → umum → **Your apps** → ikon `</>` → daftarkan web app →
   salin `firebaseConfig`.
4. Di repo, buat `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=gemilangsystem-dev.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=gemilangsystem-dev
VITE_FIREBASE_STORAGE_BUCKET=gemilangsystem-dev.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

5. `npm run dev` → buka http://localhost:5173 → **cek baris pertama console
   browser**: harus tertulis
   `[Gemilang] Firebase projectId: gemilangsystem-dev — lingkungan: dev/staging (BUKAN produksi)`.
   Kalau tertulis `produksi`, BERHENTI — env tidak terbaca.

---

## 4. Seed akun uji + sakelar fitur (satu perintah)

```bash
node scripts/seed-akun-uji.mjs
```

Skrip ini **menolak berjalan** bila konfigurasi menunjuk produksi
(`gemilangsystem`) kecuali dipaksa `--produksi-sadar`. Yang dibuat: 3 siswa,
1 admin manajer, 1 guru (lewat Firebase Auth), dan sakelar
`fiturPilot.targetKampus` mode kelas `['12 UJI']`.

---

## 5. Isi database PTN (satu kali, lewat halaman admin)

1. Login admin: `ujimanajer` / `uji12345` → http://localhost:5173/login-admin
2. Menu **🎯 TARGET KAMPUS → Impor Database PTN** (`/admin/ptn/impor`)
3. Unggah `IMPOR-PTN-2026.json` dari root repo → periksa pratinjau
   (157 PTN, 266 prodi, 4 catatan error yang memang rusak di Excel) → centang
   dua konfirmasi → **Tulis 437 dokumen**.
4. **Ulangi impor sekali lagi** → jumlah dokumen di Firestore harus TETAP
   437 (bukti idempoten: impor ulang menimpa, tidak menduplikasi).

---

## 6. Daftarkan target (alur konsultasi yang kamu jelaskan)

1. Masih sebagai `ujimanajer`: menu **Target Kampus Siswa** (`/admin/ptn/target`)
2. Pilih siswa `UJI COBA — Kelas 12` → cari prodi (mis. ketik `kedokteran`)
   → klik **→ Pilihan 1** pada UNAIR, **→ Pilihan 2** pada UNEJ
3. Kartu prodi langsung menampilkan **min / rata-rata / maks, daya tampung,
   peminat, syarat khusus, zona kesiapan** — sebelum disimpan
4. Isi skor try out skala UTBK + keterangan (mis. `685`, `TO 4 Gemilang 22 Jan`)
5. Simpan → versi 1 tercatat + jejak audit `ptn.target.buat`

---

## 7. Lihat sisi siswa

1. Buka http://localhost:5173/login-siswa → `uji12` / `uji12345`
2. Dashboard: **di depan nama** muncul chip
   `🎯 Goal: Pendidikan Dokter — Universitas Airlangga`, dan di bawah
   nama + NIM muncul **kartu target**: dua pilihan, skor acuan berlabel
   estimasi, zona, selisih, catatan formasi, dan pengingat bahwa keputusan
   final ada di siswa + orang tua.
3. Sidebar: grup baru **TARGET KAMPUS → Target Kampusku**, berisi kartu yang
   sama + tombol ke Try Out dan Papan Peringkat.
4. **Logout, login `uji10` lalu `ujismp`** → dashboard keduanya harus IDENTIK
   dengan sebelum fitur ada: tanpa chip, tanpa kartu, tanpa menu baru.
   Itulah bukti "SD/SMP tidak tersentuh".

---

## 8. Checklist "boleh lanjut produksi"

```
[ ] Token GitHub yang bocor sudah dicabut
[ ] Backup mingguan Firestore produksi benar-benar jalan
      (FIREBASE_SERVICE_ACCOUNT terisi di GitHub Actions)
[ ] Seluruh rantai di §3–§7 lolos di proyek dev
[ ] Firebase Console produksi: cek tryout_paket status 'aktif' dengan
      targetKelas bertipe ARRAY -> nonaktifkan yang tidak seharusnya
      terlihat siswa (bug lama yang sudah diperbaiki di branch ini)
[ ] Review 17 patch / diff branch
[ ] Buka PR -> CI hijau -> merge -> deploy produksi
[ ] Jalankan seed & impor TERHADAP produksi hanya setelah semua di atas
```

---

## Lampiran: apa yang TIDAK berubah

- Login siswa/guru/admin/owner tetap seperti sekarang; tidak ada password
  yang diubah; tidak ada akun sungguhan yang disentuh skrip seed (username
  akun uji dipilih yang tidak bentrok, dan skrip melewatkan yang sudah ada).
- Papan Peringkat, try out, materi, keuangan, absensi: tidak disentuh branch ini.
- SD/SMP: tidak ada satu pun komponen baru yang me-render sesuatu untuk mereka.
