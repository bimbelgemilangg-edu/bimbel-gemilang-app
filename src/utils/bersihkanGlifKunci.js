// src/utils/bersihkanGlifKunci.js
// ============================================================
// PELEPAS GLIF PENANDA KUNCI (☑/☐/✓/...) DARI TEKS OPSI
// ============================================================
// KASUS NYATA (tangkapan layar owner 2026-10-09, lembar cetak
// /guru/cetak-latihan build 35f7c0d): soal pg_kompleks nomor 6
// tercetak dengan kotak yang SUDAH TERCENTANG pada A, D, E --
// persis kunci jawabannya. Siswa yang menerima lembar itu berarti
// menerima kunci jawaban secara cuma-cuma.
//
// PENYEBABNYA BUKAN MESIN CETAK: 23 butir aktif di bank produksi
// (ekspor 2026-10-09) menyimpan glif ☑/☐ DI DALAM teks opsinya
// (opsiJawaban[i].teks = "☑ Menggunakan bentuk terikat yang salah").
// Glif itu ikut terbawa dari dokumen sumber saat impor (sumbernya
// menandai kunci dengan kotak tercentang), dan semua renderer
// (cetak, kuis siswa, kartu baca) menampilkan teks opsi apa adanya.
// Dicek satu per satu: pada 23/23 butir, pola centangnya SAMA PERSIS
// dengan field kunciJawaban -- jadi ini kebocoran kunci, bukan hiasan.
//
// ATURAN MAIN FILE INI (sengaja konservatif):
//   1. Glif dilepas HANYA kalau berada di AWAL teks (penanda kunci
//      dari sumber selalu di awal). Glif di tengah kalimat TIDAK
//      disentuh -- ada butir benar_salah sahih yang membahas "tanda
//      centang hijau (✓)" sebagai materi (SxzAjmWxi10CYYm8ttrl).
//   2. Tidak mengubah data di Firestore -- ini lapisan tampil &
//      lapis impor saja. Pembersihan data produksi tetap pekerjaan
//      terpisah yang butuh konfirmasi owner (lihat RUNBOOK).
//   3. Kunci tidak pernah dibaca di sini: melepas glif tidak bisa
//      mengubah penilaian karena field kunciJawaban tetap sumber
//      kebenaran skoring.
// ============================================================

// Semua bentuk kotak/centang yang lazim dipakai penanda kunci di
// dokumen sumber (Word/PDF/HTML): ballot box, check mark, heavy
// check, kotak hitam/putih, kotak-kali, sampai varian emoji.
// Variation selector (U+FE0E/U+FE0F) boleh menempel sesudahnya.
const POLA_GLIF =
  '[\\u2610\\u2611\\u2612\\u25A0\\u25A1\\u22A0\\u2713\\u2714\\u2717\\u2718\\u2705\\u274C\\u274E\\u{1F5F8}\\u{1F5F9}][\\uFE0E\\uFE0F]?';

// Satu atau lebih glif di AWAL teks (boleh didahului spasi), misalnya
// "☑ Teks", "  ☐☐ Teks", "✅ Teks".
export const RE_PENANDA_KUNCI_AWAL = new RegExp(
  `^[\\s\\u00A0]*(?:${POLA_GLIF})+[\\s\\u00A0]*`,
  'u',
);

/**
 * Apakah teks opsi diawali penanda kunci (☑/☐/...)?
 * @param {string} teks
 * @returns {boolean}
 */
export function bawaPenandaKunciOpsi(teks) {
  return typeof teks === 'string' && RE_PENANDA_KUNCI_AWAL.test(teks);
}

/**
 * Lepas penanda kunci di AWAL teks opsi; teks selain itu utuh.
 * Masukan bukan string diakalkan jadi '' supaya renderer aman.
 * @param {string} teks
 * @returns {string}
 */
export function bersihkanTeksOpsi(teks) {
  if (teks == null) return '';
  return String(teks).replace(RE_PENANDA_KUNCI_AWAL, '');
}

/**
 * Salinan daftar opsiJawaban yang AMAN DITAMPILKAN: bentuk string
 * maupun object {teks, gambar, tabel} diterima, glif awal dilepas,
 * struktur lain (gambar dsb.) dibiarkan utuh.
 * @param {object} soal
 * @returns {Array<string|object>}
 */
export function opsiTampilDari(soal) {
  const daftar = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  return daftar.map((o) => {
    if (typeof o === 'string') return bersihkanTeksOpsi(o);
    if (o && typeof o === 'object') return { ...o, teks: bersihkanTeksOpsi(o.teks || '') };
    return bersihkanTeksOpsi(String(o ?? ''));
  });
}

/**
 * Versi string saja (untuk mesin cetak & pembanding): tiap opsi
 * diambil teksnya lalu dilepas penanda kunci.
 * @param {object} soal
 * @returns {string[]}
 */
export function daftarOpsiBersih(soal) {
  const daftar = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  return daftar.map((o) => bersihkanTeksOpsi(typeof o === 'string' ? o : (o?.teks || '')));
}

/**
 * Detektor untuk halaman audit: true bila butir masih menyimpan
 * penanda kunci di teks opsinya (data mentahnya, sebelum dibersihkan
 * lapisan tampil).
 * @param {object} soal
 * @returns {boolean}
 */
export function soalBawaPenandaKunci(soal) {
  const daftar = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  return daftar.some((o) => bawaPenandaKunciOpsi(typeof o === 'string' ? o : (o?.teks || '')));
}
