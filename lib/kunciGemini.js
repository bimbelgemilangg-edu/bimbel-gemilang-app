// api/kunciGemini.js
// ============================================================
// SATU PINTU pemilihan kunci Gemini, sesuai skema pemisahan beban yang
// ditetapkan owner 2026-10-06:
//
//   GEMINI_SOAL    : kunci KHUSUS beban soal (ekstraksi bank soal dari
//                    PDF, parse quiz, pembuat quiz). Bila kosong, jatuh
//                    ke GEMINI_API_KEY supaya sistem tetap jalan di
//                    deploy yang belum memisahkan kunci.
//   GEMINI_UTBK    : kunci KHUSUS try out UTBK (generasi & penskoran
//                    subtes), keputusan owner 2026-10-10: kunci ini berasal dari
//                    AKUN GOOGLE PRIBADI yang berbeda dari akun Gemilang,
//                    supaya beban tryout tidak pernah antre di kuota yang
//                    sama dengan pembuatan kuis harian tentor. Rantai
//                    jatuh-baliknya GEMINI_UTBK -> GEMINI_SOAL ->
//                    GEMINI_API_KEY, dan setiap jatuh balik WAJIB bersuara
//                    lewat peringatanIsolasi() supaya isolasi yang rusak
//                    terlihat di log, bukan diam-diam.
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
 * @param {'soal'|'umum'|'utbk'} kelompok
 * @returns {string} kunci yang dipakai, atau '' bila belum ada
 */
export function kunciGeminiUntuk(env = {}, kelompok = 'umum') {
  const umum = String(env.GEMINI_API_KEY || '').trim();
  if (kelompok === 'utbk') {
    return String(env.GEMINI_UTBK || '').trim()
      || String(env.GEMINI_SOAL || '').trim()
      || umum;
  }
  if (kelompok === 'soal') {
    return String(env.GEMINI_SOAL || '').trim() || umum;
  }
  return umum;
}

const norm = (s) => String(s ?? '').toLowerCase().trim();

/**
 * True bila nama/kode mapel termasuk keluarga 7 subtes UTBK.
 * Daftar subtes diambil dari MAPEL_UTBK (satu sumber dengan dropdown
 * scan & alias mesin try out), supaya routing kunci tidak punya
 * taksonomi tandingan yang bisa berpencar.
 */
export function apakahMapelUtbk(namaMapel, daftarSubtes = []) {
  const n = norm(namaMapel);
  if (!n) return false;
  if (n.includes('utbk') || n.includes('snbt')) return true;
  return daftarSubtes.some((m) => n === norm(m.nama) || n === m.kode || n.includes(norm(m.nama)));
}

/**
 * Pilih kelompok kunci berdasar mapel permintaan: subtes UTBK -> 'utbk',
 * selain itu beban soal -> 'soal'.
 */
export function kelompokUntukMapel(namaMapel, daftarSubtes = []) {
  return apakahMapelUtbk(namaMapel, daftarSubtes) ? 'utbk' : 'soal';
}

/**
 * Peringatan isolasi kuota: bunyi hanya bila permintaan UTBK harus jatuh
 * balik karena GEMINI_UTBK belum disetel. Null bila isolasi sehat atau
 * permintaan bukan UTBK.
 */
export function peringatanIsolasi(env = {}, kelompok = 'umum') {
  if (kelompok !== 'utbk') return null;
  if (String(env.GEMINI_UTBK || '').trim()) return null;
  const cadangan = String(env.GEMINI_SOAL || '').trim() || String(env.GEMINI_API_KEY || '').trim();
  if (!cadangan) return null;
  return 'GEMINI_UTBK belum disetel; beban UTBK memakai kunci kelompok lain — isolasi kuota TIDAK aktif.';
}

/** Pesan ramah untuk log/error bila kunci kelompok itu belum diisi. */
export function pesanKunciBelumAda(kelompok = 'umum') {
  return kelompok === 'soal'
    ? 'Kunci AI soal belum ada: isi GEMINI_SOAL (khusus beban soal) atau GEMINI_API_KEY di Vercel -> Settings -> Environment Variables. Keduanya gratis tanpa kartu kredit di https://aistudio.google.com/apikey'
    : 'GEMINI_API_KEY belum dikonfigurasi di Vercel -> Settings -> Environment Variables. Ambil kunci gratis tanpa kartu kredit di https://aistudio.google.com/apikey';
}

export default {
  kunciGeminiUntuk, pesanKunciBelumAda, apakahMapelUtbk,
  kelompokUntukMapel, peringatanIsolasi,
};
