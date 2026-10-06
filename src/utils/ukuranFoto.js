// src/utils/ukuranFoto.js
// ============================================================
// Menghitung ukuran canvas untuk mengecilkan foto kamera sebelum
// disimpan, tanpa mengubah rasio aspek.
//
// KENAPA DIPISAH & DIUJI: foto kamera belakang HP zaman sekarang bisa
// 4000x3000 px (beberapa MB). Jawaban esai disimpan sebagai data-URI di
// dokumen tryout_sesi, dan Firestore membatasi satu dokumen 1 MB (lihat
// komentar batas di RendererEsai.jsx). Mengecilkan di sisi klien adalah
// satu-satunya jalan; dan rumus pengecilannya harus benar -- salah hitung
// berarti foto gepeng atau tetap kebesaran.
// ============================================================

/**
 * @param {number} lebarAsli   lebar sumber (video/frame kamera)
 * @param {number} tinggiAsli  tinggi sumber
 * @param {number} [maksSisi]  sisi terpanjang yang diizinkan, px
 * @returns {{lebar: number, tinggi: number, diskalakan: boolean}}
 *   ukuran tujuan, dibulatkan, minimal 1px, rasio dipertahankan.
 */
export function ukuranFoto(lebarAsli, tinggiAsli, maksSisi = 1600) {
  const w = Number(lebarAsli) || 0;
  const h = Number(tinggiAsli) || 0;
  if (w <= 0 || h <= 0) return { lebar: 1, tinggi: 1, diskalakan: false };

  const sisiTerpanjang = Math.max(w, h);
  if (sisiTerpanjang <= maksSisi) {
    return { lebar: Math.round(w), tinggi: Math.round(h), diskalakan: false };
  }
  const skala = maksSisi / sisiTerpanjang;
  return {
    lebar: Math.max(1, Math.round(w * skala)),
    tinggi: Math.max(1, Math.round(h * skala)),
    diskalakan: true,
  };
}

export default { ukuranFoto };
