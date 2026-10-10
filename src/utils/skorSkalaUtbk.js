// src/utils/skorSkalaUtbk.js
// ============================================================
// Konversi hasil try out internal menjadi SKALA yang menyerupai rentang
// skor UTBK (300-800), supaya angka di kartu target & surat tidak lagi
// harus diinput manual lewat konsultasi.
//
// 🔥 KEJUJURAN ADALAH FITUR UTAMA BERKAS INI
// Skor UTBK resmi dihitung panitia dengan IRT (Item Response Theory) atas
// soal yang kalibrasinya rahasia. TIDAK ADA cara yang sah bagi aplikasi ini
// untuk menirunya. Maka yang dibangun di sini bukan "penyetaraan", melainkan
// KEBIASAAN MEMBACA ANGKA: persen benar per subtes dipetakan linear ke
// rentang 300-800 agar siswa terlatih membaca skala yang akan mereka temui,
// dengan label yang tidak bisa dimatikan:
//
//   - setiap hasil membawa LABEL_SKALA,
//   - fungsi ini menolak menyebut dirinya skor UTBK,
//   - test memaku kedua sifat itu.
//
// Blueprint §3C: "Skor tryout internal Gemilang tidak boleh dianggap otomatis
// setara dengan skor UTBK resmi."
// ============================================================

export const SKALA_MIN = 300;
export const SKALA_MAKS = 800;

export const LABEL_SKALA =
  'Skala internal Gemilang 300-800 yang menyerupai rentang skor UTBK untuk '
  + 'membiasakan pembacaan angka. BUKAN skor UTBK resmi: tidak dihitung dengan '
  + 'IRT panitia dan tidak dapat dibandingkan langsung dengan skor acuan prodi '
  + 'tanpa penjelasan pembimbing.';

const normPersen = (v) => {
  // Number(null) === 0 dan Number('') === 0 -- pola yang sama yang sudah
  // dua kali menjebak fitur ini (zona & banner). Kosong berarti TIDAK ADA
  // data, bukan nol persen.
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
};

/** persen 0-100 -> skala 300-800 (linear, monoton). */
export function persenKeSkala(persen) {
  const p = normPersen(persen);
  if (p === null) return null;
  return Math.round(SKALA_MIN + ((SKALA_MAKS - SKALA_MIN) * p) / 100);
}

/**
 * Hitung skala per subtes + total tertimbang jumlah soal.
 *
 * @param {Array<{kode?: string, nama?: string, benar: number, total: number}>} subtes
 * @returns {{total: number|null, perSubtes: Array, alasan?: string}}
 */
export function hitungSkalaUtbk(subtes = []) {
  const daftar = (Array.isArray(subtes) ? subtes : []).filter(
    (s) => s && Number.isFinite(Number(s.total)) && Number(s.total) > 0,
  );
  if (daftar.length === 0) {
    return { total: null, perSubtes: [], alasan: 'belum ada subtes yang bisa dinilai' };
  }
  const perSubtes = daftar.map((s) => {
    const benar = Math.min(Number(s.total), Math.max(0, Number(s.benar) || 0));
    const persen = (benar / Number(s.total)) * 100;
    return {
      kode: s.kode || null,
      nama: s.nama || s.kode || null,
      benar,
      total: Number(s.total),
      persen: Number(persen.toFixed(1)),
      skala: persenKeSkala(persen),
    };
  });
  const sumBenar = perSubtes.reduce((a, b) => a + b.benar, 0);
  const sumTotal = perSubtes.reduce((a, b) => a + b.total, 0);
  return {
    total: persenKeSkala((sumBenar / sumTotal) * 100),
    perSubtes,
    label: LABEL_SKALA,
  };
}

export default { SKALA_MIN, SKALA_MAKS, LABEL_SKALA, persenKeSkala, hitungSkalaUtbk };
