# ALUR EDIT & RESET TRY OUT YANG SUDAH TERBIT

Dibuat 2026-10-08 menanggapi keluhan owner:
1. *"cara edit tryout yang terbit gimana?"*
2. *"siswa komplain: ada yang soalnya gak keluar, ada yang kerjain soal 4 tiba-tiba selesai"* (mode timer **per soal individual**)
3. *"bagaimana mengembalikan soal dan poin XP anak ke semula biar bisa kerjain ulang?"*

Semua jawaban di dokumen ini SUDAH BERBENTUK FITUR di halaman
**Admin → Bank Soal → Terbitkan Try Out** (`/admin/bank-soal/terbitkan-tryout`).

---

## 1. Mengedit try out yang sudah terbit

Di kartu **"📋 Try Out yang Sudah Diterbitkan"**, tiap baris sekarang punya
tombol **✏️ Edit**.

- Klik **✏️ Edit** → form di bawah terisi otomatis dengan isi paket itu
  (judul, kelas/program, jadwal buka & deadline, mode timer + durasi,
  anti-cheat, acak soal, tentor, sampai susunan soal di keranjang).
  Muncul banner biru **"MODE EDIT"** supaya tidak tertukar dengan
  menerbitkan try out baru.
- Ubah apa yang perlu, lalu klik tombol ungu **"Simpan Perubahan"**.
  Perubahan masuk ke paket YANG SAMA (bukan try out baru), dan tercatat
  di log audit sebagai `tryout.paket.edit`.
- Sebelum menyimpan, aplikasi menyebut jujur konsekuensinya:
  - siswa yang **belum mulai** → melihat susunan & jadwal yang baru;
  - siswa yang **sudah selesai** → hasilnya tetap tersimpan apa adanya,
    TIDAK dihitung ulang;
  - siswa yang **sedang mengerjakan** → jawaban tersimpannya aman; kalau
    susunan subtes berubah, posisi subtesnya disesuaikan otomatis.
- Klik **"Batal edit"** kalau berubah pikiran (keranjang dikosongkan lagi).

Contoh pemakaian nyata: durasi per soal salah isi 4 menit padahal mau 5,
deadline meleset, judul typo — semua bisa dibetulkan tanpa hapus paket.

## 2. Kenapa siswa finish mendadak / soal tidak keluar (sudah diperbaiki)

Tiga akar masalah yang ditemukan di kode pengerjaan siswa (`TryOutView.jsx`):

1. **Tombol hijau berlabel "Selesai Subtes Ini" ternyata mengumpulkan
   SELURUH try out.** Pada mode *per soal individual* (tiap soal = 1 subtes),
   tombol itu yang paling sering dipencet siswa untuk lanjut ke soal
   berikutnya → try out langsung finish di soal itu (keluhan "kerjain soal
   4 tiba-tiba selesai"). Sekarang tombol itu BENAR-BENAR hanya menutup
   subtes/sub-soal sekarang dan membuka berikutnya; keputusan tombol ini
   dihitung fungsi murni `putusanTombolLanjut()` di
   `src/utils/logikaSubtesTryOut.js` yang dikunci 15 uji otomatis.
2. **Perpindahan subtes memakai `alert()` yang memblokir layar.** Jam terus
   berjalan sementara siswa membaca/menutup popup; di HP yang layarnya
   terkunci, rentetan popup bisa membuat beberapa soal tertelan sekaligus
   (keluhan "soalnya gak keluar"). Sekarang perpindahan ditandai **banner
   lembut yang hilang sendiri 7 detik** — tidak memblokir, waktu subtes
   berikutnya mulai berjalan bersamaan dengan siswa melihat soalnya.
3. **Indeks subtes hasil "resume" bisa menunjuk keluar array** kalau susunan
   paket berubah setelah sesi dimulai (mis. akses mapel siswa diperbarui).
   Dulu layarnya macet selamanya di "Memuat soal...". Sekarang indeksnya
   diamankan (`indexSubtesAman()`), dan kalau posisi soal benar-benar tidak
   ada, siswa melihat layar jujur dengan tombol
   **"Kumpulkan Jawaban Tersimpan"** — bukan layar kosong tanpa jalan keluar.

Satu bug senyap lain ikut dibetulkan: waktu subtes habis, penyimpanan
progres kadang memakai peta jawaban VERSI LAMA (jawaban terakhir siswa
tertimpa). Callback timer kini dipanggil lewat ref sehingga selalu memakai
data terbaru (`useTimerTryOut.js`).

## 3. Mengembalikan siswa biar bisa kerjain ulang (+ XP-nya kembali semula)

Di baris paket yang sama, klik tombol **🔄 Kerjain Ulang**.
Muncul panel daftar siswa yang sudah/sedang mengerjakan paket itu.

- **Per siswa:** tombol **"🔄 Reset & izinkan ulang"** →
  1. XP hasil pengerjaan lama ditarik balik secukupnya dari XP total DAN
     XP mingguan (tidak pernah minus, tidak memotong aktivitas lain);
  2. sesi lamanya dihapus sehingga siswa boleh mulai dari soal nomor 1;
  3. siswa diberi izin khusus 3 jam yang **menembus deadline** paket —
     jadi walau deadline sudah lewat, dia tetap bisa masuk tanpa harus
     membuka deadline untuk semua orang.
- **Semua siswa sekaligus:** tombol **"Reset semua sesi (N)"** — untuk kasus
  "banyak siswa kena bug, kembalikan semua anak". Ada konfirmasi berisi
  jumlah sesi + total XP yang akan ditarik balik.
- Semua reset tercatat di log audit (`tryout.sesi.reset` /
  `tryout.sesi.reset.massal`) lengkap dengan angka XP yang dikembalikan.

Catatan jujur: reset membuang JAWABAN lama siswa (itu memang tujuannya).
Kalau hanya mau memberi kesempatan tambahan TANPA membuang hasil lama,
pakai fitur "Izinkan Ulang" di halaman **Hasil Try Out** yang sekarang
memakai jalur layanan yang sama (`src/services/resetSesiTryOut.js`).

## 4. Batas jujur fitur ini

- Edit paket TIDAK menghitung ulang hasil siswa yang sudah selesai
  (nilai mereka milik susunan soal yang mereka kerjakan).
- Reset tidak bisa dibatalkan — jawaban lama benar-benar dibuang.
  Karena itu tiap reset minta konfirmasi berisi nama + angka XP.
- Izin ulang 3 jam per reset; kalau siswa belum sempat mengulang sampai
  izin habis, tinggal reset/izinkan ulang lagi (XP tidak dipotong dua kali
  karena sesi lamanya sudah tidak ada).
