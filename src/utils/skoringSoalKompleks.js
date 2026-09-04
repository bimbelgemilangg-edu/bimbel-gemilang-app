// src/utils/skoringSoalKompleks.js
// ============================================================
// Skoring PROPORSIONAL buat 2 tipe soal TKA yang bukan pilihan ganda
// biasa. Kenapa proporsional (bukan semua-atau-tidak):
// - Kemendikdasmen sendiri BELUM publikasi rubrik resmi buat 2 tipe
//   ini (per riset saat fitur ini dibangun) -- jadi ini pilihan
//   desain, bukan aturan baku yang tinggal dicontek.
// - Proporsional kasih data evaluasi belajar yang lebih tajam ("siswa
//   ini paham 3 dari 4 konsep", bukan cuma "gagal total") -- sesuai
//   prinsip bimbel: fokus ke data buat evaluasi belajar.
// - Konsisten sama prinsip "jangan bikin siswa kapok" yang sudah
//   dipakai di Latihan Harian (XP gak pernah minus).
// ============================================================

// 🔥 BARU (bug freeze/blank putih ditemukan): sebelumnya kode ini
// nganggep `kunciJawaban` PASTI array (`kunciJawaban || []` cuma
// nangkep kalau nilainya falsy/kosong, BUKAN kalau nilainya string
// biasa). Kalau ada 1 soal pg_kompleks yang kunciJawaban-nya
// ke-simpen sebagai teks polos (mis. "AC" bukan ["A","C"]), .map()
// dipanggil ke string dan React CRASH TOTAL (blank putih, harus
// reload) -- bukan cuma soal itu doang yang gagal, SELURUH try out
// ikut mati. safeArray() mastiin kita SELALU dapat array beneran,
// apapun bentuk data aslinya.
function safeArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) return v.split('').map((c) => c.trim()).filter(Boolean); // "AC" -> ["A","C"]
  return [];
}

/**
 * Skor buat tipe "pg_kompleks" (checkbox, jawaban benar > 1).
 * Centang yang BENAR nambah skor, centang yang SALAH mengurangi --
 * jadi asal centang semua opsi TIDAK bisa dapat skor penuh.
 *
 * @param {string[]} kunciJawaban - huruf yang benar, mis. ['A','C','D']
 * @param {string[]} jawabanSiswa - huruf yang dicentang siswa, mis. ['A','C']
 * @returns {number} skor 0..1
 */
export function hitungSkorPgKompleks(kunciJawaban, jawabanSiswa) {
  const kunci = new Set(safeArray(kunciJawaban).map((h) => String(h).toUpperCase().trim()));
  const dipilih = new Set(safeArray(jawabanSiswa).map((h) => String(h).toUpperCase().trim()));
  if (kunci.size === 0) return 0;

  let benarDicentang = 0;
  let salahDicentang = 0;
  dipilih.forEach((huruf) => {
    if (kunci.has(huruf)) benarDicentang += 1;
    else salahDicentang += 1;
  });

  const skor = (benarDicentang - salahDicentang) / kunci.size;
  return Math.max(0, Math.min(1, skor));
}

/**
 * Skor buat tipe "benar_salah" / "pg_kategori" (tabel per-baris).
 * Tiap baris/pernyataan dinilai SENDIRI-SENDIRI dan berbobot sama.
 *
 * @param {Array<{jawaban:string}>} baris - baris asli dari Bank Soal (field `jawaban` = kunci)
 * @param {string[]} jawabanSiswaPerBaris - jawaban siswa per baris, indeks sejajar dengan `baris`
 * @returns {number} skor 0..1
 */
export function hitungSkorBenarSalah(baris, jawabanSiswaPerBaris) {
  const daftar = safeArray(baris);
  if (daftar.length === 0) return 0;

  let jumlahBenar = 0;
  daftar.forEach((b, i) => {
    const kunci = String(b?.jawaban || '').toLowerCase().trim();
    const jawabanSiswa = String(safeArray(jawabanSiswaPerBaris)[i] || '').toLowerCase().trim();
    if (kunci && jawabanSiswa && kunci === jawabanSiswa) jumlahBenar += 1;
  });

  return jumlahBenar / daftar.length;
}

// 🔥 BARU (BUG SERIUS DITEMUKAN): sebelumnya kode di 2 tempat beda
// (TryOutView.jsx & RendererPgSederhana.jsx) masing-masing nganggep
// kunciJawaban PASTI 1 huruf tunggal (mis. "B") -- kalau ternyata
// ke-simpen dalam format lain (angka index, atau teks jawaban
// langsung), hasil `charCodeAt(0) - 65` jadi angka aneh yang GAK AKAN
// PERNAH cocok index opsi manapun. Akibatnya siswa yang jawabannya
// BENAR tetap disalahkan sistem terus-terusan -- kalau kejadian di
// banyak soal, skor try out bisa 0% walau siswa jawab benar semua.
// SEKARANG dipindah jadi 1 fungsi bersama (dipakai TryOutView.jsx
// buat menghitung skor & RendererPgSederhana.jsx buat highlight
// hijau/merah), toleran ke 3 kemungkinan format kunci jawaban.
export function cariIndexBenar(soal) {
  const kunci = String(soal.kunciJawaban ?? '').trim();
  if (!kunci) return -1;
  const opsi = soal.opsiJawaban || [];
  // Format 1: huruf tunggal A-Z (paling umum & yang seharusnya dipakai)
  if (/^[A-Za-z]$/.test(kunci)) return kunci.toUpperCase().charCodeAt(0) - 65;
  // Format 2: angka index -- coba 0-based dulu, fallback ke 1-based
  if (/^\d+$/.test(kunci)) {
    const n = parseInt(kunci, 10);
    if (n >= 0 && n < opsi.length) return n;
    if (n - 1 >= 0 && n - 1 < opsi.length) return n - 1;
  }
  // Format 3: kunci berisi TEKS JAWABAN langsung (bukan huruf/angka) --
  // cocokkan ke isi opsi jawabannya.
  const idxTeks = opsi.findIndex((o) => {
    const teks = typeof o === 'string' ? o : (o?.teks || '');
    return teks.trim().toLowerCase() === kunci.toLowerCase();
  });
  return idxTeks >= 0 ? idxTeks : -1;
}