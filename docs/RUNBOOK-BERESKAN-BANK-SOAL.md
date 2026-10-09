# RUNBOOK BERESKAN BANK SOAL — dari 2.357 butir warisan sampai berani menambah lagi

**Disusun:** 2026-10-09 · **Data acuan:** Audit Materi 2026-10-08 (2.357 butir aktif)
**Alat bantu offline:** `handoff/USULAN-PEMETAAN-MATERI.xlsx` (6 sheet, hasil replika
algoritma Petakan Mapel terhadap 779 nilai materi produksi)

> Dokumen ini menjawab pertanyaan owner: *"aku belum berani memasukkan soal baru,
> kita bereskan dulu."* Jawabannya: berani menambah lagi **setelah gerbang di
> bagian 3 terpenuhi**, bukan setelah perasaan tenang. Setiap langkah di bawah
> punya cara verifikasi dan cara batal.

---

## 0. Garis dasar (sekali, sebelum menyentuh apa pun)

Buka **Admin → Bank Soal & Perkakas → Audit Identitas Soal → Jalankan Audit**.
Catat angka kartu *General checkup fondasi*. Dari Excel 2026-10-08, keadaan
awalnya seharusnya kira-kira:

| Ukuran | Nilai awal |
|---|---|
| Butir aktif | 2.357 |
| Terjangkau hierarki (jenjang→mapel→materi) | 2.356 (99,96%) |
| Jenjang tak baku / mapel kosong / materi kosong | 1 / 1 / 1 |
| Nilai materi unik | 779 (rata 2,95 butir per simpul) |
| Simpul materi berisi tepat 1 butir | 606 |
| Butir terhapus (soft-delete) | ±37 + yang sesudahnya |

**Unduh CSV-nya** dan simpan. Ini pembandingmu di langkah 6.

## 1. Pulihkan yang salah hapus — `/admin/bank-soal/pulihkan-soal`

Filter **alasan duplikat**. Lihat **thumbnail gambar** tiap baris: pasangan
ber-perintah sama tetapi ber-poster berbeda adalah korban detektor lama.
Baca penuh bila perlu (tombol di Bersihkan Soal), centang, pulihkan.

- Verifikasi: jumlah baris ber-filter duplikat menyusut; butir pulih muncul lagi
  di Perpustakaan.
- Batal: pemulihan hanya mengubah `status` kembali ke `aktif`; alasan lama
  tersimpan di `riwayatPenghapusan`, jadi tidak ada jejak yang hilang.

## 2. Rencana Perbaikan identitas — tab *Rencana Perbaikan* di halaman audit

Dry-run dulu. Yang akan muncul (sesuai data Excel): kanonisasi jenjang `SMA`→
`SMA/MA` (1 butir), pengisian alias `materi` dari `bab`, dan pemetaan mapel
salah jenjang seperti **Sosiologi@SMP → IPS** (nilai lama disimpan di
`mapelSebelumKurikulum`). Baca daftarnya, centang, terapkan, **audit ulang**.

- Verifikasi: `tersembunyi` = 0 dan `takSelarasKurikulum` = 0.
- Batal: setiap perubahan menyimpan nilai lama (`jenjangSebelumBaku`,
  `mapelSebelumKurikulum`, `materiAsliSebelumRapi`), jadi bisa dikembalikan.

## 3. Taksonomi — `/admin/bank-soal/taksonomi-materi`

Tekan **Isi Otomatis** untuk **Literasi** dan **Bahasa Inggris** (seed baru dari
data produksi). Untuk empat mapel lama (Matematika, Bahasa Indonesia, Sosiologi,
Geografi) pastikan sudah terisi; **koreksi bila ada bab yang tidak sesuai
kebijakan sekolahmu** — tabel seed adalah draf, kamulah pemegang kurikulum.

## 4. Petakan materi — `/admin/bank-soal/petakan-mapel`, per mapel

Kerjakan urutan dampak terbesar dulu: **Matematika (830 butir) → Literasi (664)
→ Bahasa Inggris (212) → Bahasa Indonesia (197) → Sosiologi (173) → Geografi (30)**.

- Sheet `USULAN-PEMETAAN-MATERI.xlsx` adalah **pratinjau keputusan yang akan
  kamu lihat di layar**: kelompok materi, jumlah butir, saran bab baku, skor 0–10.
  Kelompok berskor ≥ 7 akan tersaran otomatis; **yang < 7 sengaja dibiarkan
  untuk matamu**.
- Prediksi bila semua saran skor ≥7 diterima: **630 kelompok materi → ±117 simpul
  bab**. Literasi: 664 butir, 0 perlu review. Matematika: 726 otomatis, 104 review.
- Kelompok skor rendah kebanyakan **salah tag kelas**, bukan salah bab:
  *"Eksponen dan logaritma" ber-kelas 12* (eksponen itu kelas 10), *"Penerapan
  SPLDV" ber-kelas 9* (SPLDV itu kelas 8). Untuk itu pilihannya: petakan ke bab
  yang benar **atau** perbaiki tag kelasnya — jangan dipaksa masuk bab kelas itu.
- Verifikasi: kartu checkup "simpul berisi 1 soal" anjlok dari 606.
- Batal: non-destruktif; nilai asli di `materiAsliSebelumRapi`.

## 5. Bersihkan duplikat — `/admin/bank-soal/bersihkan-soal`

Pindai ulang. Sekarang detektornya sadar gambar+kunci, dan tiap baris bisa
**dibaca penuh** dengan thumbnail serta baris *"vs yang DISIMPAN — sama/beda"*.
Hapus hanya yang benar-benar kembar; pasangan ber-poster berbeda **batalkan
centangnya**. Kelompok *kembar beda kunci* periksa satu-satu: salah satunya
salah kunci.

- Verifikasi: `Rusak` = 0 dan tidak ada grup yang anggotanya ber-gambar berbeda.

## 6. Ukur ulang & buka gerbang

Jalankan audit lagi, bandingkan dengan CSV garis dasar. **Gerbang menambah soal
baru** (semua harus ya):

- [ ] `tersembunyi` = 0 dan `takSelarasKurikulum` = 0
- [ ] `duplikatPersis` = 0 pada checkup
- [ ] simpul berisi 1 butir turun drastis (target: < 15% dari simpul)
- [ ] tidak ada grup duplikat ber-gambar berbeda yang tersisa
- [ ] pemulihan salah-hapus sudah dikerjakan

Bila semua terpenuhi, menambah soal baru **aman** karena pagarnya kini bekerja di
hulu: dropdown mapel mengikuti Kurikulum Merdeka per jenjang, deteksi duplikat
berjenjang berjalan saat scan, dan pagar ledakan menahan penghapusan massal.

## 7. Kebiasaan baru supaya tidak berantakan lagi

1. Impor selalu lewat jalur yang sudah berpagar (scan/JSON/HTML Gemini) —
   jangan tulis langsung ke Firestore.
2. Setelah tiap impor besar, lihat kartu checkup sekali (satu sapuan, murah).
3. Bila checkup menunjuk angka merah, berhenti menambah; bereskan dulu.
   Soal beranak lebih murah dicegah saat masuk daripada diburu sesudah masuk.
4. Dokumen sumber jangan menandai kunci dengan kotak tercentang (☑) di
   depan pilihan. Jalur impor sekarang melepas penanda itu otomatis
   (lihat bagian 8), tapi sumber yang bersih tetap lebih murah.

## 8. Glif penanda kunci di teks opsi (ditemukan 2026-10-09)

Gejala: lembar cetak & kuis siswa pg_kompleks menampilkan kotak yang
SUDAH tercentang pada pilihan yang benar — kunci jawaban bocor ke siswa.
Akar: 23 butir aktif menyimpan glif ☑/☐ DI DALAM teks opsinya warisan
dokumen sumber; dicek satu per satu, pola centangnya sama persis dengan
field kunciJawaban (23/23).

Status setelah PR glif-penanda-kunci:
- Tampilan & cetak AMAN: semua lapisan tampil (mesin cetak, kuis siswa,
  kartu baca tentor, keranjang) melepas glif lewat
  `src/utils/bersihkanGlifKunci.js`; lembar pg_kompleks mendapat kotak
  KOSONG dari mesin cetak supaya format centang siswa tetap jelas.
- Pintu impor AMAN: sanitizer & impor HTML melepas glif sebelum masuk bank.
- Audit menandai: butir yang datanya masih kotor masuk daftar
  "perlu dicek" di halaman audit (bukan "rusak" — tidak ada yang dihapus).

Kerjaan data MENUNGGU KONFIRMASI OWNER (pembersihan field di Firestore,
23 butir, tanpa mengubah kunci/penilaian):
1Eui7w7hCP7Oh1AAm2S3, 5ALQ8vDv265nwImwpC9G, 6PPOOqFH2Ad0THWQoTnj,
AbpRZp1xqFZZWSBEKKgD, FPHNBnAv6yWsXcaKrY4N, GxuD9Wu0aH48JZ2rPPV5,
IfkQJV2GKhqeSQoOQnf5, JzvfkeYHHlvGlitRxddp, KucEyOmbU3ssUWNOUJHW,
LX6HppBhcAaoc2Og78Hb, MUSUq9V33B7dGTGNBtw3, NlGPf0DGmOuCJLlkQQPM,
SRnR0PLRPnPWj3frLOJE, SZTIr7ztWG3efEK0Fxk3, UUu8vsaEfR7GUwV968HU,
UdsRukgXuCJUzO5Vrjnx, ZCEQ4T7VAmGCwIOcEe9N, bM7RKtOdO61H3nycQQuw,
jiBBxnBUShuxrWKML3VX, kDsR478rwJEeove0kbrZ, rvSwcHRhzwbSkkR9jw0m,
wZ1gfgDQJBmvP1VXljdA, zRRXiQ2V50HHag4ldZa1.
