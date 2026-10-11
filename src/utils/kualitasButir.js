// src/utils/kualitasButir.js
// ============================================================
// LAPORAN KUALITAS DARI AI -> PENYORTIRAN OTOMATIS DI IMPOR.
//
// KENAPA ADA (arahan owner 2026-10-11: "aku mau otomatis dan hasil soal
// berkualitas ... kita harus punya alur produksi soal canggih"):
// otomatisasi yang aman bukan berarti menerima semua keluaran AI,
// melainkan membuat AI WAJIB melaporkan kualitas tiap butir lewat
// atribut data-kualitas, lalu sistem yang menyortir: yang mengaku baik
// masuk jalur simpan, yang mengaku buram/terpotong otomatis masuk
// antrean review tanpa admin membaca satu per satu.
//
// Kontraknya (aturan 42 prompt master OCR):
//   ok               -> semua terbaca utuh
//   buram            -> ada angka/teks penting buram tak terbaca
//   terpotong        -> ada bagian putus yang tidak bisa dipulihkan
//   tanpa-pembahasan -> sumber tanpa pembahasan; memakai tangga 36.(3)
// Nilai lain/skosong -> null (diabaikan, tidak menuduh).
//
// MURNI & TERUJI (tests/kualitasButir.test.mjs).
// ============================================================

export const LEVEL_KUALITAS = ['ok', 'buram', 'terpotong', 'tanpa-pembahasan'];

const ALIAS = {
  ok: 'ok', baik: 'ok', bagus: 'ok', clean: 'ok',
  buram: 'buram', blur: 'buram', kabur: 'buram', unreadable: 'buram',
  terpotong: 'terpotong', putus: 'terpotong', truncated: 'terpotong',
  'tanpa-pembahasan': 'tanpa-pembahasan', 'tanpa-pembahasan-': 'tanpa-pembahasan',
  penalaran: 'tanpa-pembahasan',
};

/**
 * Normalisasi nilai data-kualitas dari keluaran AI.
 * @param {string} nilai
 * @returns {string|null} salah satu LEVEL_KUALITAS, atau null bila tak dikenal
 */
export function bacaKualitas(nilai) {
  const v = String(nilai ?? '').trim().toLowerCase();
  if (!v) return null;
  return ALIAS[v] || null;
}

/**
 * Pesan validasi untuk level kualitas, atau null bila ok/tak dikenal.
 * buram & terpotong = HARD ERROR (soal tidak lolos simpan, masuk review);
 * tanpa-pembahasan = peringatan lunak (sudah punya jalur antrean sendiri).
 * @param {string} level
 * @returns {{teks:string, keras:boolean}|null}
 */
export function pesanKualitas(level) {
  if (level === 'buram') {
    return {
      teks: 'AI melaporkan butir ini BURAM: ada angka/teks penting yang tidak terbaca di sumber. Jangan disimpan dulu -- verifikasi ke buku asli atau buang butir ini.',
      keras: true,
    };
  }
  if (level === 'terpotong') {
    return {
      teks: 'AI melaporkan butir ini TERPOTONG: ada bagian yang putus dan tidak bisa dipulihkan dari sumber. Jangan disimpan dulu -- lengkapi dari buku asli atau buang.',
      keras: true,
    };
  }
  if (level === 'tanpa-pembahasan') {
    return {
      teks: 'Sumber tidak memuat pembahasan untuk butir ini; penjelasan (bila ada) adalah penalaran AI dan masuk antrean review tentor.',
      keras: false,
    };
  }
  return null;
}

export default { LEVEL_KUALITAS, bacaKualitas, pesanKualitas };
