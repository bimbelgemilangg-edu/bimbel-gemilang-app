// src/utils/logMengajar.js
// ============================================================
// Logika murni untuk `teacher_logs` (log mengajar guru). Pengambilan datanya ada
// di services/logMengajarService.js; berkas ini hanya aturan yang bisa diuji.
//
// KENAPA BERKAS INI ADA (register bug B-26, ditemukan 3 Nov 2026):
//   `TeacherHistory.jsx` punya fungsi bernama `stripNominal` dengan komentar
//   panjang bahwa angka gaji TIDAK BOLEH sampai ke browser guru — tetapi isinya
//   `const { _nominal, ...rest } = d.data()`, yaitu membuang field bernama
//   `_nominal` yang TIDAK PERNAH ADA. Field aslinya bernama `nominal`, sehingga
//   gaji guru tetap ikut terkirim dan bisa dibaca siapa pun lewat DevTools.
//   Dasbor guru membuang field yang benar, riwayat tidak → dua kebenaran.
//   Sekarang satu fungsi di sini, dipakai keduanya, dan DIUJI.
// ============================================================

/** Field yang wajib dibuang sebelum log masuk ke state sisi guru. */
export const FIELD_RAHASIA_LOG = ['nominal', '_nominal', 'nominalGaji', 'gaji', 'honor'];

/**
 * Buang field bernilai uang dari satu dokumen log.
 * Mengembalikan objek BARU (tidak memutasi masukan).
 */
export function buangNominal(data) {
  const sumber = data && typeof data === 'object' ? data : {};
  const hasil = { ...sumber };
  FIELD_RAHASIA_LOG.forEach((k) => { delete hasil[k]; });
  return hasil;
}

/** Buang field uang dari banyak dokumen sekaligus. */
export function buangNominalSemua(daftar) {
  return (Array.isArray(daftar) ? daftar : []).map((d) => buangNominal(d));
}

/** Kunci tanggal log: `tanggal` bisa 'YYYY-MM-DD' atau 'YYYY-MM-DD HH:mm'. */
export function tanggalLog(log) {
  return String(log?.tanggal ?? '').trim().split(/\s+/)[0];
}

/** Urutkan terbaru dulu lalu potong — pengganti `orderBy + limit` bila indeks tak ada. */
export function urutLogTerbaru(daftar, batas = 30) {
  const n = Number.isFinite(Number(batas)) && Number(batas) > 0 ? Math.floor(Number(batas)) : 30;
  return (Array.isArray(daftar) ? daftar.slice() : [])
    .sort((a, b) => tanggalLog(b).localeCompare(tanggalLog(a)))
    .slice(0, n);
}

/** Apakah log ini jatuh di bulan `YYYY-MM` yang sedang dipilih? */
export function logDalamBulan(log, bulanPrefix) {
  const t = tanggalLog(log);
  const p = String(bulanPrefix ?? '').trim();
  if (!t || !p) return false;
  return t.startsWith(p);
}

/** Log satu bulan: field uang dibuang, terurut terbaru dulu. */
export function siapkanLogBulan(daftar, bulanPrefix) {
  const bersih = buangNominalSemua(daftar).filter((d) => logDalamBulan(d, bulanPrefix));
  return bersih.sort((a, b) => tanggalLog(b).localeCompare(tanggalLog(a)));
}

export default {
  FIELD_RAHASIA_LOG,
  buangNominal,
  buangNominalSemua,
  tanggalLog,
  urutLogTerbaru,
  logDalamBulan,
  siapkanLogBulan,
};
