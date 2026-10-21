// src/utils/sasaranTugas.js
// ============================================================
// Penentu seberapa luas jangkauan sebuah tugas/modul yang guru terbitkan.
//
// KENAPA BERKAS INI ADA
// Sebelum dipisah, ekspresi `targetKelas === 'Semua' || targetKategori ===
// 'Semua'` ditulis ULANG di empat tempat dalam ManageTugas.jsx: pemicu
// banner peringatan, syarat merender banner, pemilihan pesan konfirmasi
// saat submit, dan warna indikator sasaran. Empat salinan literal 'Semua'
// yang harus selalu sepakat.
//
// Risiko nyatanya spesifik: pemicu banner dan syarat render-nya dihitung
// terpisah. Kalau suatu hari salah satunya diubah, hasilnya `warningShown`
// true tapi banner tidak pernah dirender (atau sebaliknya) — bug yang tidak
// terlihat oleh lint, tidak terlihat oleh build, dan baru ketahuan saat
// guru mengeluh peringatannya tidak muncul.
//
// Karena itu logikanya ditarik ke sini: satu sumber kebenaran, murni, tanpa
// React dan tanpa Firebase supaya bisa diuji langsung di Node — pola yang
// sama dengan `src/utils/passwordHash.js` dan `src/utils/bannerTargetSiswa.js`.
//
// Uji: tests/sasaranTugas.test.mjs
// ============================================================

/** Nilai literal yang dipakai kedua dropdown di form tugas. */
export const SEMUA = 'Semua';

/**
 * Klasifikasi jangkauan tugas.
 *
 * Urutan pemeriksaan penting: kasus "keduanya Semua" harus dicek lebih dulu,
 * kalau tidak ia akan tertangkap oleh cabang "semua kelas" dan pesan
 * konfirmasinya jadi salah (menyebut satu program padahal keduanya luas).
 */
export const SASARAN = {
  /** Semua kelas DAN semua program — jangkauan terjauh. */
  SEMUANYA: 'semuanya',
  /** Semua kelas, tapi satu program tertentu. */
  SEMUA_KELAS: 'semua-kelas',
  /** Satu kelas tertentu, tapi semua program. */
  SEMUA_PROGRAM: 'semua-program',
  /** Satu kelas dan satu program — jangkauan tersempit, tidak perlu peringatan. */
  TERBATAS: 'terbatas',
};

/**
 * @param {string} kelas     nilai dropdown "Kelas" (mis. '7 SMP' atau 'Semua')
 * @param {string} kategori  nilai dropdown "Program / Kategori"
 * @returns {string} salah satu nilai SASARAN
 */
export function jenisSasaran(kelas, kategori) {
  const semuaKelas = kelas === SEMUA;
  const semuaProgram = kategori === SEMUA;
  if (semuaKelas && semuaProgram) return SASARAN.SEMUANYA;
  if (semuaKelas) return SASARAN.SEMUA_KELAS;
  if (semuaProgram) return SASARAN.SEMUA_PROGRAM;
  return SASARAN.TERBATAS;
}

/**
 * Apakah tugas ini menjangkau lebih dari satu kelas ATAU lebih dari satu
 * program? Inilah syarat tunggal yang memutuskan boleh-tidaknya banner
 * peringatan muncul — dipakai oleh pemicu DAN oleh render, supaya keduanya
 * tidak mungkin berbeda pendapat.
 *
 * @returns {boolean}
 */
export function apakahSasaranLuas(kelas, kategori) {
  return jenisSasaran(kelas, kategori) !== SASARAN.TERBATAS;
}

export default { SEMUA, SASARAN, jenisSasaran, apakahSasaranLuas };
