# ALUR-AI-KE-NILAI.md — dari soal buatan mesin/AI sampai nilai di meja admin

**Ditulis 14 Okt 2026** atas permintaan owner: *"tes untuk soal di sistem dari
AI menyediakan soal sampai siswa mengumpulkan, dan masuk kemana nilai siswa
mengumpulkan kalau di sisi admin?"*
Jawaban pendek: **tiga alur**, semuanya bermuara ke koleksi Firestore yang
dibaca halaman admin berbeda; angka skor selalu dihitung ULANG oleh util yang
sama (`skorSoalTryOut.hitungTotalSkor`) di sisi siswa maupun admin, jadi tidak
ada titik yang bisa mengubah angka di tengah jalan. Kontrak antar-mata-rantai
 dipaku oleh `tests/alurAiKeNilai.test.mjs` (6 uji, rantai `npm test`).

---

## Alur 1 — Try Out Otomatis (AI memilih soal sesuai CP)

| # | Langkah | Berkas / koleksi |
|---|---|---|
| 1 | Admin membuat *template rules* (jenis TKA/UTBK, komposisi mapel, hari & jam) | `tryout_template_otomatis` · halaman **Admin → Try Out Otomatis** |
| 2 | "Siapkan draf": mesin mengisi soal dari bank; **AI memilih butir per mapel** lewat rantai model terbukti (fallback jujur bila kuota/model mati) | `utils/mesinTryOutOtomatis.js` + `lib/modelPilih.js` → `tryout_paket` status `draf` (tersembunyi dari siswa) |
| 3 | Admin "Terbitkan" → status `aktif` + jadwal buka/tutup | `terbitkanDraf()` · siswa hanya pernah melihat `aktif` |
| 4 | Siswa melihat misi per test di Papan Jelajah (kalender tanggal), mengerjakan di TryOutView (anti-cheat, timer per subtes, progres tersimpan tiap jawaban) | `tryout_sesi` status `berjalan` |
| 5 | Siswa mengumpulkan: sesi jadi `selesai` + `totalSkorPersen` + XP; bila jaringan putus, hasil diamankan dulu lalu dikirim ulang otomatis | `tryout_sesi`, cadangan `tryout_hasil_tertahan` |
| 6 | **NILAI DI SISI ADMIN:** tabel per siswa + rincian per subtes + tombol **Hitung Ulang** (menghitung ulang dari jawaban mentah, bukan percaya angka tersimpan) | **Admin → Bank Soal → Hasil Try Out** (`HasilTryOutAdminPage`); hasil tertahan ikut tampil · angka masuk juga ke Dashboard Analisis & Papan Analitik siswa · tentor: **Pantau Try Out** per paket |

## Alur 2 — Kuis buatan tentor (termasuk yang dihasilkan AI)

| # | Langkah | Berkas / koleksi |
|---|---|---|
| 1 | Tentor membuka modal **AI Generate** di Manage Quiz; endpoint merangkai soal + kunci, respons AI divalidasi sebelum dipakai | `api/generateQuizFromTopic.js` · `pages/teacher/modul/AIGenerateQuiz.jsx` |
| 2 | Tentor menyimpan kuis (hasil AI atau manual) | `kuis` · `ManageQuiz.jsx` |
| 3 | Siswa mengerjakan & mengumpulkan | `/siswa/kuis/:id` (`StudentQuizView`) → `jawaban_kuis` |
| 4 | **NILAI DI SISI ADMIN:** daftar pengumpulan + skor per siswa | **Admin → Bank Soal → Hasil Kuis** (`HasilKuisAdminPage`) · tentor: **Cek Tugas Siswa** & Manage Quiz · nilai bisa ditarik ke **Raport** (`GenerateRaport`, `TeacherInputGrade`) |

## Alur 3 — Latihan Harian (misi harian siswa)

| # | Langkah | Berkas / koleksi |
|---|---|---|
| 1 | Sistem memilih soal dari bank sesuai skenario materi lemah/kuat/belum tersentuh + jenjang siswa; jatah harian dibatasi | `pages/student/gemilang/LatihanHarianPage.jsx` membaca `bank_soal` |
| 2 | Siswa menjawab; progres disimpan **langsung per soal** (tahan refresh), XP & streak naik bila target harian tercapai | `siswa_soal_progress`, `students` |
| 3 | **NILAI/AKTIVITAS DI SISI ADMIN:** rekap aktivitas per siswa (butir terjawab per mapel, streak, stok bank menipis) | **Admin → Bank Soal → Latihan Aktivitas** (`LatihanAktivitasPage`) |

> **Celah yang jujur dicatat:** Latihan Harian menyimpan progres per soal,
> bukan "skor per sesi", sehingga admin melihat *aktivitas*, bukan rapor
> skor. Bila owner menginginkan rekap skor Latihan Harian per siswa
> (persen benar per mapel per pekan), itu tambahan kecil di
> `LatihanAktivitasPage` — menunggu keputusan owner.

---

## Kenapa angka tidak bisa berbeda antara siswa & admin

- Satu sumber skor: `utils/skorSoalTryOut.js` (`hitungTotalSkor`,
  `skorSatuSoal`, `soalBisaDinilai`) dipakai TryOutView (siswa),
  HasilTryOutAdminPage (admin, termasuk tombol Hitung Ulang), dan
  Papan Jelajah (analitik per subtes).
- Soal rusak (kunci ganda warisan impor dll.) dikeluarkan dari penyebut oleh
  `soalBisaDinilai` + dilaporkan jujur lewat `jumlahSoalRusak`, bukan diam-diam.
- `tests/alurAiKeNilai.test.mjs` mensimulasikan satu paket mesin dari draf
  sampai analitik dan MEMAKAIKAN: draf tak terlihat siswa; terbit hanya lewat
  admin; target kanonik sampai ke kelas yang benar; dokumen per test & kunci
  urutan; skor test vs skor paket; **angka hitung-ulang admin === angka sesi
  siswa**; tren analitik tidak kosong.
- Uji penopang per mata rantai: `modelPilih`, `pilihSoalAi`,
  `pagarTryOutOtomatis`, `layakTryOut`, `logikaSubtesTryOut`,
  `pulihKirimHasilTryOut`, `pemulihanXPTryOut`, `skorSoalTryOut`,
  `kunciGemini`/`ekstrakHtmlGemini` (parse respons AI), `papanJelajah`.

## Catatan perbaikan kecil hasil penelusuran ini

- `ringkasSoalUntukAdmin` dipindah dari `mesinTryOutOtomatis.js` ke util murni
  `utils/ringkasSoalAdmin.js` (modul mesin mengimpor instansi Firestore sehingga
  tak bisa dimuat Node polos — preseden sama seperti `aliasMapel.js`).
