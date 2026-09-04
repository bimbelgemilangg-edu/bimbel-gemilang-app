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
    const kunci = new Set((kunciJawaban || []).map((h) => String(h).toUpperCase().trim()));
    const dipilih = new Set((jawabanSiswa || []).map((h) => String(h).toUpperCase().trim()));
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
    const daftar = baris || [];
    if (daftar.length === 0) return 0;
  
    let jumlahBenar = 0;
    daftar.forEach((b, i) => {
      const kunci = String(b.jawaban || '').toLowerCase().trim();
      const jawabanSiswa = String(jawabanSiswaPerBaris?.[i] || '').toLowerCase().trim();
      if (kunci && jawabanSiswa && kunci === jawabanSiswa) jumlahBenar += 1;
    });
  
    return jumlahBenar / daftar.length;
  }