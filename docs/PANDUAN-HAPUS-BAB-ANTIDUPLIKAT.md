# 🧹 PANDUAN ADMIN — Hapus per Bab, Anti-Salinan & Anti-Hantu

> Dibuat Turn 56 (23 Sep 2026) atas permintaan owner:
> *"masalahnya gak ada tombol hapus per bab-nya; pastikan bersih gak ada
> salinan apapun di Firebase agar gak terjadi file hantu lagi."*

---

## 1. Tombol HAPUS per Bab (baru)

Tempat: **Admin → Materi v2 → "Kelola Bab & File"** pada materi yang dimaksud.

- 🗑 **Di daftar bab (kolom kiri)** — setiap baris bab kini punya tombol
  merah kecil di sampingnya. Klik → konfirmasi (menampilkan jumlah bagian &
  soal) → bab dihapus permanen.
- 🗑 **Di atas editor** — tombol "Hapus Bab" (merah) + "Simpan Bab" (biru)
  kini juga ada di PUCUK kartu editor. Dulu hanya di kaki halaman sehingga
  tak terlihat pada bab panjang (46 bagian).

Yang terjadi saat hapus bab (semua otomatis):

1. Dokumen bab dihapus dari Firestore.
2. **Progres siswa bab itu ikut disapu** (`progres_materi_v2`) — tidak ada
   riwayat/progress yatim yang tertinggal.
3. **Verifikasi server**: aplikasi membaca ulang langsung dari server untuk
   memastikan bab benar-benar hilang (bukan ilusi cache). Bila masih ada,
   muncul pesan error yang jelas.
4. Hitungan "X bab • Y soal" di kartu Manajer disegarkan.

## 2. Re-impor bab = MENGGANTI, bukan menggandakan (baru)

**Impor JSON → mode "Tambah bab ke materi existing"** kini mendeteksi bab
berjudul sama di materi tujuan:

- Muncul konfirmasi berisi daftar bab yang sudah ada.
- **Lanjutkan** = bab lama DIHAPUS dulu, versi impor masuk di urutan yang
  sama → **tidak pernah ada salinan ganda**.
- **Batal** = tidak ada perubahan apa pun.

Jadi alur pembaruan bab (mis. bab 3 & bab 4 biologi) sekarang SATU langkah:
Impor `IMPOR-BIOLOGI-BAB3-TERBARU.json` mode tambah-bab → konfirmasi ganti
→ selesai. Tidak perlu hapus manual dulu.

## 3. Penanda salinan/ hantu (baru)

- **Manajer Materi v2**: kartu materi berjudul kembar mendapat chip amber
  "⚠️ Ada N materi berjudul sama — kemungkinan SALINAN".
- **Editor bab**: bab berjudul kembar mendapat chip "⚠️ judul kembar" +
  banner peringatan di daftar bab.
- Cangkang tanpa judul tetap ditandai 🧟 + tombol "🧹 Bersihkan N dokumen
  sisa" (fitur Turn 51).

## 4. Jalur "kebangkitan hantu" yang ditutup di kode (Turn 56)

| Fungsi | Dulu | Sekarang |
|---|---|---|
| `segarkanHitunganMateri` | `setDoc merge` → menghidupkan materi terhapus | `updateDoc` (Turn 51) |
| `simpanMateri` (edit) | `setDoc merge` → materi terhapus bisa hidup lagi bila disimpan dari tab lama | `updateDoc` — gagal dengan pesan Indonesia bila dokumen sudah tidak ada |
| `simpanBab` (edit) | `setDoc merge` → bab terhapus bisa hidup lagi dari tab editor lama | `updateDoc` — sama |
| `simpanSlideVersiGuru` | `setDoc merge` → bab terhapus bangkit jadi cangkang berisi slide saja | cek keberadaan + `updateDoc` |
| `simpanBab` (data) | array bersarang bikin impor gagal di tengah → cangkang 0 bab | `sanitasiNested()` membungkus `{s:[...]}` sebelum simpan (lapis ke-2; draft resmi sudah `{k,v}`) |
| Baca admin (`muatMateriDanBab`) | cache-first → bisa menampilkan bab terhapus | admin pakai `dariServer:true` (siswa/guru tetap cache-first, hemat kuota) |

## 5. Bila kuota Firestore habis (429 / "Quota exceeded")

Semua operasi (baca/tulis/hapus) ditolak server sampai reset harian
(± **14:00 WIB**). Ini bukan bug aplikasi. Jangan retry berulang-ulang;
tutup tab admin/console yang tidak dipakai, coba lagi setelah reset.

## 6. Audit manual via Firebase Console (darurat)

1. Buka <https://console.firebase.google.com/project/gemilangsystem/firestore/databases/-default-/data/~2Fmateri_v2>
   (PASTIKAN koleksi `materi_v2`, JANGAN `bimbel_modul` — itu sistem lama).
2. Dokumen materi yang sah selalu punya field `judul`. Yang tanpa judul =
   cangkang hantu → aman dihapus.
3. Untuk cek bab dobel: buka dokumen materi → sub-koleksi `bab` → cari
   judul yang muncul dua kali → hapus yang tidak dipakai (biasanya yang
   `diupdatePada`-nya lebih lama).
