// src/utils/kenaliDialekImpor.js
// ============================================================
// PENGENAL DIALEK BERKAS IMPOR — supaya pintu yang salah tidak lagi
// menyambut dengan error yang menyesatkan.
//
// KENAPA ADA (kebingungan owner 2026-10-11: "loh emang ada di mana aja
// sih import ini, aku yang salah jangan jangan?"): repo ini punya DUA
// pintu impor HTML bank soal yang namanya hampir kembar dan menerima
// DIALEK YANG SALING TIDAK KOMPATIBEL:
//
//   /admin/bank-soal/import            ("Import Buku & Soal (AI)" di
//                                       Perkakas; TIDAK ada di sidebar)
//        menerima  <article data-gemilang-question data-field="...">
//                  plus JSON / CSV / TeX / PDF
//   /admin/bank-soal/impor-html-gemini ("Impor HTML Gemini" di sidebar)
//        menerima  keluaran PROMPT PATEN: .question-card + .options-list
//                  + .pembahasan + data-kunci
//
// Berkas dialek A yang ditempel ke pintu B terbaca NOL kartu dan dibalas
// "bukan keluaran prompt paten" -- benar secara harfiah, useless secara
// praktis. Sebaliknya berkas dialek B di pintu A dibalas "Tidak ditemukan
// soal. Setiap soal harus memakai <article data-gemilang-question>."
// Keduanya membuat owner merasa SALAH, padahal berkasnya sah -- hanya
// salah pintu. Maka dialeknya dikenali DULU dan pesannya menunjuk pintu
// yang benar.
//
// MURNI & TERUJI (tests/kenaliDialekImpor.test.mjs).
// ============================================================

export const URL_PINTU_SCAN = '/admin/bank-soal/import';
export const URL_PINTU_PATEN = '/admin/bank-soal/impor-html-gemini';

/**
 * @param {string} mentah isi berkas (html/json/teks)
 * @returns {{dialek:string, pintuSaran:string, namaPintu:string, alasan:string}}
 */
export function kenaliDialekImpor(mentah) {
  const s = String(mentah ?? '');
  const potong = s.slice(0, 200000);

  if (/\{\s*"(materi|soal|questions|bank_soal)"\s*:/i.test(potong) || /^\s*[{[]/.test(potong.trim()) && /"(teks_soal|opsi_jawaban|kunci_jawaban)"/.test(potong)) {
    return {
      dialek: 'json',
      pintuSaran: URL_PINTU_SCAN,
      namaPintu: 'Import Buku & Soal (AI)',
      alasan: 'berkas terlihat sebagai JSON bank soal',
    };
  }
  if (/data-gemilang-question|data-field="teks_soal"|data-field="opsi_jawaban"/i.test(potong)) {
    return {
      dialek: 'scan',
      pintuSaran: URL_PINTU_SCAN,
      namaPintu: 'Import Buku & Soal (AI)',
      alasan: 'memakai <article data-gemilang-question> + data-field',
    };
  }
  if (/question-card|options-list|data-kunci=|class="[^"]*pembahasan[^"]*"/i.test(potong)) {
    return {
      dialek: 'paten',
      pintuSaran: URL_PINTU_PATEN,
      namaPintu: 'Impor HTML Gemini',
      alasan: 'memakai struktur prompt paten (.question-card/.options-list/.pembahasan)',
    };
  }
  if (/\\begin\{(question|choices|solution)\}|\\soal\b/i.test(potong)) {
    return {
      dialek: 'tex',
      pintuSaran: URL_PINTU_SCAN,
      namaPintu: 'Import Buku & Soal (AI)',
      alasan: 'berkas LaTeX/TeX soal',
    };
  }
  return {
    dialek: 'tak-dikenal',
    pintuSaran: URL_PINTU_SCAN,
    namaPintu: 'Import Buku & Soal (AI)',
    alasan: 'dialek tidak dikenali; pintu ini menerima paling banyak format',
  };
}

/**
 * Pesan ramah bila berkas menempel di pintu yang salah.
 * @returns {string|null} null bila berkas memang milik pintu ini
 */
export function pesanSalahPintu(mentah, pintuSekarang) {
  const k = kenaliDialekImpor(mentah);
  if (k.dialek === 'tak-dikenal') return null;
  if (k.pintuSaran === pintuSekarang) return null;
  return `Berkas ini sepertinya BUKAN untuk pintu ini: ${k.alasan}. `
    + `Coba pintu "${k.namaPintu}" di ${k.pintuSaran} — berkas yang sama seharusnya terbaca di sana. `
    + `(Bukan berkasnya yang salah, hanya pintunya yang berbeda.)`;
}

export default { kenaliDialekImpor, pesanSalahPintu, URL_PINTU_SCAN, URL_PINTU_PATEN };
