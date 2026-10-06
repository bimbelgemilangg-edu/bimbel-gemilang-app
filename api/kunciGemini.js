// api/kunciGemini.js
// ============================================================
// SATU PINTU pemilihan kunci Gemini, sesuai skema pemisahan beban yang
// ditetapkan owner 2026-10-06:
//
//   GEMINI_SOAL    : kunci KHUSUS beban soal (ekstraksi bank soal dari
//                    PDF, parse quiz, pembuat quiz). Bila kosong, jatuh
//                    ke GEMINI_API_KEY supaya sistem tetap jalan di
//                    deploy yang belum memisahkan kunci.
//   GEMINI_API_KEY : kunci umum (materi, bab, alat bantu guru, narasi
//                    siswa, konversi modul scan).
//
// KEJUJURAN YANG WAJIB DICATAT (permintaan owner: "kalau api 1 dengan
// beban terpisah banyak gak kuat"): kuota gratis Gemini menempel pada
// PROYEK/AKUN Google, BUKAN pada nama kunci. Dua kunci dari akun yang
// sama berbagi SATU kolam kuota -- memisahkannya tidak menambah tenaga.
// Manfaat pemisahan kunci adalah (1) pemakaian per fitur bisa dipantau
// dari dashboard per proyek bila kelak kuncinya memang beda proyek,
// (2) satu kunci yang bocor/dicabut tidak mematikan semua fitur.
// Penambah tenaga gratis yang sungguhan: beda proyek/akun Google, atau
// rantai fallback ke penyedia gratis (groq/openrouter) yang sudah ada
// di extractPdfBankSoal & konversiModulScan.
// ============================================================

/**
 * @param {object} env      biasanya process.env
 * @param {'soal'|'umum'} kelompok
 * @returns {string} kunci yang dipakai, atau '' bila belum ada
 */
export function kunciGeminiUntuk(env = {}, kelompok = 'umum') {
  const umum = String(env.GEMINI_API_KEY || '').trim();
  if (kelompok === 'soal') {
    return String(env.GEMINI_SOAL || '').trim() || umum;
  }
  return umum;
}

/** Pesan ramah untuk log/error bila kunci kelompok itu belum diisi. */
export function pesanKunciBelumAda(kelompok = 'umum') {
  return kelompok === 'soal'
    ? 'Kunci AI soal belum ada: isi GEMINI_SOAL (khusus beban soal) atau GEMINI_API_KEY di Vercel -> Settings -> Environment Variables. Keduanya gratis tanpa kartu kredit di https://aistudio.google.com/apikey'
    : 'GEMINI_API_KEY belum dikonfigurasi di Vercel -> Settings -> Environment Variables. Ambil kunci gratis tanpa kartu kredit di https://aistudio.google.com/apikey';
}

export default { kunciGeminiUntuk, pesanKunciBelumAda };
