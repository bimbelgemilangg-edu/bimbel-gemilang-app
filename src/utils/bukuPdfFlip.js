// src/utils/bukuPdfFlip.js
// ============================================================
// BUKU PDF GEMILANG (20 Okt 2026, pivot owner): siswa membaca buku
// konvensional berupa PDF yang bisa dibalik; PEMBAHASAN dipisahkan
// untuk guru lewat rentang halaman yang DISAMBUNYIKAN dari mode
// siswa. Util murni & teruji.
// ============================================================

/**
 * Daftar halaman yang boleh dibaca SISWA: semua halaman kecuali
 * rentang pembahasan guru (mis. [69, 81]).
 * @param {number} totalHalaman
 * @param {Array<number>} rangePembahasan [mulai, selesai] inklusif; kosong bila tiada
 */
export function daftarHalamanSiswa(totalHalaman = 0, rangePembahasan = []) {
  const [a, b] = Array.isArray(rangePembahasan) && rangePembahasan.length === 2
    ? [Number(rangePembahasan[0]), Number(rangePembahasan[1])]
    : [null, null];
  const keluar = [];
  for (let h = 1; h <= (Number(totalHalaman) || 0); h += 1) {
    if (a !== null && h >= a && h <= b) continue;
    keluar.push(h);
  }
  return keluar;
}

/** Label mode baca untuk badge UI. */
export function labelModeBaca(mode = 'siswa') {
  return mode === 'guru'
    ? 'MODE GURU — termasuk kunci & pembahasan'
    : 'EDISI SISWA — pembahasan tersimpan untuk guru';
}

export default { daftarHalamanSiswa, labelModeBaca };

/** Slug aman untuk nama berkas storage dari judul buku. */
export function slugBukuPdf(judul = '') {
  return String(judul || 'buku')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'buku';
}

/**
 * Parse input rentang halaman pembahasan milik admin:
 * "69-81" | "69 s/d 81" | "69..81" -> [69, 81]; kosong/'-' -> [].
 * Toleran terhadap spasi &格式 salah (urut naik otomatis).
 */
export function rentangPembahasanDariInput(teks = '') {
  const m = String(teks || '').trim().match(/(\d{1,4})\s*(?:-+|\.+|s\/d|sampai|\u2013|\u2014)\s*(\d{1,4})/i);
  if (!m) return [];
  const a = Number(m[1]); const b = Number(m[2]);
  return [Math.min(a, b), Math.max(a, b)];
}
