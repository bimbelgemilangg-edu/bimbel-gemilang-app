// src/utils/kodeSumberSoal.js
// ============================================================
// SIDIK JARI KODE SUMBER — pendeteksi pembahasan tertukar antar nomor.
//
// KENAPA ADA (sampel nyata owner 2026-10-11, "02 Silogisme", 40 soal):
// berkas keluaran AI pihak ketiga memuat pembahasan yang BERTUKAR
// berputar antar nomor, terlihat dari kode sumbernya:
//     soal 31 [UTBK2024/TPS/PU/GEL.2/63] -> pembahasan menulis GEL.2/69
//     soal 32 [UTBK2024/TPS/PU/GEL.2/65] -> pembahasan menulis GEL.2/63
//     soal 33 [UTBK2024/TPS/PU/GEL.2/69] -> pembahasan menulis GEL.2/65
// Kode sumber ([SNMPTN 2012/TPA/213/24], [UTBK2024/TPS/PU/GEL.1/01], ...)
// adalah sidik jari yang dicetak buku di kepala soal DAN di kepala
// pembahasan, jadi ketidakcocokan keduanya adalah bukti mekanis bahwa
// penjelasan itu bukan milik soal itu. Siswa yang belajar dari
// pembahasan tertukar lebih rugi daripada siswa tanpa pembahasan:
// yang satu bingung, yang lain yakin pada penjelasan yang salah.
//
// Detektor ini SENGAJA hanya menuding, tidak memperbaiki: menukar-balik
// pembahasan otomatis berdasar kemiripan teks adalah tebakan yang bisa
// salah dua arah. Penuduhnya dipasang sebagai sinyal validasi di halaman
// impor (soal jadi tidak lolos sampai manusia memeriksa), dan prompt
// master OCR dilarang menempel pembahasan yang sidik jarinya beda.
//
// MURNI & TERUJI (tests/kodeSumberSoal.test.mjs).
// ============================================================

// Kode sumber baku: nama ujian + tahun + rantai jalur/nomor. Spasi
// diizinkan karena OCR sering menambah/menguranginya ("UTBK 2024" vs
// "UTBK2024"), jadi dinormalkan dengan membuang semua spasi.
const RE_KODE = /\[?(SNMPTN|SBMPTN|UTBK|SIMAK|OSN|TKA|TRY\s?OUT)\s*\d{4}[^\n\]}{]{0,40}/i;

/**
 * Ambil sidik jari kode sumber pertama dari sebuah teks.
 * @param {string} teks
 * @returns {string|null} kode ternormalisasi (tanpa spasi, huruf besar)
 */
export function ekstrakKodeSumber(teks) {
  const m = RE_KODE.exec(String(teks ?? ''));
  if (!m) return null;
  // Kurung siku & spasi dibuang: OCR kadang mencetak "[UTBK 2024/...]",
  // kadang "UTBK2024/..." -- keduanya sidik jari yang sama.
  return m[0].replace(/[\s[\]]+/g, '').toUpperCase();
}

/**
 * Bandingkan sidik jari kode di teks soal dengan kode di pembahasan.
 * @param {object} soal {teks_soal|soal, pembahasan}
 * @returns {{kodeSoal:string|null, kodePembahasan:string|null, cocok:boolean|null}}
 *   cocok = null  bila salah satu sisi tidak memuat kode (tidak bisa dituduh)
 *   cocok = true  bila keduanya sama
 *   cocok = false bila keduanya ada dan BERBEDA -> indikasi tertukar
 */
export function cocokKodePembahasan(soal = {}) {
  const kodeSoal = ekstrakKodeSumber(soal?.teks_soal ?? soal?.soal ?? '');
  const kodePembahasan = ekstrakKodeSumber(soal?.pembahasan ?? '');
  if (!kodeSoal || !kodePembahasan) return { kodeSoal, kodePembahasan, cocok: null };
  return { kodeSoal, kodePembahasan, cocok: kodeSoal === kodePembahasan };
}

/**
 * Pesan tuduhan bila pembahasan terindikasi tertukar, else null.
 * @param {object} soal
 * @returns {string|null}
 */
export function pesanPembahasanTertukar(soal = {}) {
  const { kodeSoal, kodePembahasan, cocok } = cocokKodePembahasan(soal);
  if (cocok !== false) return null;
  return `Pembahasan kemungkinan TERTUKAR: kode sumber teks soal "${kodeSoal}" tetapi pembahasan menulis "${kodePembahasan}". Jangan dipakai mengajar sebelum diperiksa terhadap buku asli -- siswa yang belajar dari penjelasan nomor lain lebih rugi daripada siswa tanpa penjelasan.`;
}

export default { ekstrakKodeSumber, cocokKodePembahasan, pesanPembahasanTertukar };
