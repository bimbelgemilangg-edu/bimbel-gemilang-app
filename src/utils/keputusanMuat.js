// src/utils/keputusanMuat.js
// ============================================================
// Keputusan "bolehkah memuat ulang dari server sekarang?" -- murni,
// teruji, dipakai halaman-halaman yang menyegarkan diri saat aplikasi
// kembali terlihat.
//
// KENAPA ADA (audit 2026-10-06): proyek ini pernah menjawab bacaan
// Firestore dengan 429 RESOURCE_EXHAUSTED (kuota harian habis). Salah
// satu penyedotnya adalah halaman yang menyapu SATU KOLEKSI PENUH
// setiap mount DAN setiap focus/visibilitychange. Penyegaran tetap
// dibutuhkan (itulah perbaikan "data tidak konek"), jadi yang diatur
// adalah FREKUENSINYA: data besar di-cache dengan TTL, dan kegagalan
// baca tidak boleh menghapus data lama yang masih benar.
// ============================================================

/**
 * @param {object} o
 * @param {number} o.waktuCacheMs timestamp ms saat cache terakhir diisi (0 = belum ada)
 * @param {number} o.ttlMs        umur cache yang diizinkan
 * @param {number} [o.sekarangMs] defaults Date.now()
 * @param {boolean} [o.paksa]      true = pengguna menekan "coba lagi"/muat ulang
 * @returns {boolean} true bila boleh menembak server
 */
export function perluSegar({ waktuCacheMs = 0, ttlMs = 0, sekarangMs = null, paksa = false } = {}) {
  if (paksa) return true;
  if (!waktuCacheMs) return true;
  const kini = sekarangMs ?? Date.now();
  return kini - waktuCacheMs >= ttlMs;
}

/**
 * Saat gagal memuat: data lama yang masih ada LEBIH BERHARGA daripada
 * daftar kosong. Daftar kosong membuat pengguna menyimpulkan "datanya
 * hilang"; data lama + pesan error membuat ia tahu jaringan/kuota yang
 * sedang bermasalah dan bisa mencoba lagi.
 *
 * @returns {{pertahankanDataLama: boolean, pesan: string}}
 */
export function kebijakanGagalMuat(dataLamaAda, keterangan = '') {
  return {
    pertahankanDataLama: !!dataLamaAda,
    pesan: keterangan
      ? `Gagal memuat data terbaru (${keterangan}). Data yang terlihat mungkin belum mutakhir — tekan Coba lagi bila sudah reda.`
      : 'Gagal memuat data terbaru. Data yang terlihat mungkin belum mutakhir — tekan Coba lagi bila sudah reda.',
  };
}

export default { perluSegar, kebijakanGagalMuat };
