// lib/promptUtbk.js
// ============================================================
// Blok prompt khusus 7 subtes UTBK-SNBT untuk generator soal.
//
// Karakter soal, jebakan khas, trik, dan kecepatan rata-rata DISALIN dari
// sheet KOMPONEN_7_SUBTES_UTBK pada berkas riset owner (angka yang sama
// yang dipakai template Try Out Sabtu), bukan dikarang: PU 60 dtk/soal,
// PPU 45, PBM 75, PK 60, LBI 108, LBE 90, PM 90.
//
// Hidup di lib/ (bukan api/) karena penjaga CI melarang kode bersama di
// api/: setiap berkas di api/ dihitung Vercel sebagai serverless function
// dan repo sudah mentok 12/12.
// ============================================================

export const KARAKTER_SUBTES = {
  'TPS/Penalaran Umum': {
    detik: 60,
    karakter: 'Teks panjang dengan data persentase dan silogisme; opsi pengecoh mirip teks tapi salah korelasi.',
    trik: 'Cek kesesuaian premis; jangan menyimpulkan hal di luar teks.',
  },
  'TPS/Pengetahuan & Pemahaman Umum': {
    detik: 45,
    karakter: 'Sinonim dalam konteks, perumpamaan kalimat, fungsi kohesi teks.',
    trik: 'Baca kalimat yang ditanyakan langsung, pahami konteks sekitarnya.',
  },
  'TPS/Pemahaman Bacaan & Menulis': {
    detik: 75,
    karakter: 'Konjungsi antarkalimat, kata bentukan tidak baku, kalimat tidak logis/tidak efektif.',
    trik: 'Kuasai fungsi tanda baca (titik dua, koma) dan subjek-predikat.',
  },
  'TPS/Pengetahuan Kuantitatif': {
    detik: 60,
    karakter: 'Tipe soal (1)/(2) cukup-tidak-cukup; perbandingan kuantitas P dan Q.',
    trik: 'Uji nilai ekstrem (0, 1, negatif, pecahan) untuk memastikan kecukupan.',
  },
  'Literasi/Bahasa Indonesia': {
    detik: 108,
    karakter: 'Stimulus teks esai sosial, ekonomi, budaya; evaluasi tujuan penulisan dan argumen.',
    trik: 'Skim paragraf pertama dan terakhir sebelum membaca detail.',
  },
  'Literasi/Bahasa Inggris': {
    detik: 90,
    karakter: 'Teks sains populer berbahasa Inggris; author attitude, text tone, implied meaning.',
    trik: 'Identifikasi kata kunci pertanyaan, cari parafrase di teks.',
  },
  'Literasi/Penalaran Matematika': {
    detik: 90,
    karakter: 'Soal cerita multikonsep (bunga pinjaman, diskon bertingkat, optimasi fungsi).',
    trik: 'Ubah cerita jadi diagram/tabel variabel; pakai persamaan linear cepat.',
  },
};

/**
 * Blok prompt untuk satu mapel; string kosong bila bukan subtes UTBK.
 * @param {string} namaMapel
 * @returns {string}
 */
export function blokPromptUtbk(namaMapel) {
  const k = KARAKTER_SUBTES[String(namaMapel ?? '').trim()];
  if (!k) return '';
  return [
    '=== MODE SUBTES UTBK-SNBT ===',
    `Subtes ini: ${namaMapel}. Kecepatan rata-rata siswa nasional: ${k.detik} detik/soal -- tulis soal yang wajar diselesaikan secepat itu tanpa kalkulator (kecuali subtes memang mengizinkan).`,
    `Karakter & jebakan khas: ${k.karakter}`,
    `Trik pengerjaan yang harus bisa dilatih dari soal ini: ${k.trik}`,
    'UTBK menguji LITERASI & PENALARAN lintas konteks, BUKAN hafalan materi kurikulum per bab: setiap butir wajib punya stimulus (teks/tabel/grafik/konteks nyata) kecuali subtes memang bertipe perbandingan kuantitatif murni.',
    'Jangan menyebut soal ini "soal UTBK resmi" atau mengklaim mirip soal tahun tertentu; ini latihan bergaya UTBK buatan Bimbel Gemilang.',
    '=== AKHIR MODE SUBTES UTBK ===',
  ].join('\n');
}

export default { blokPromptUtbk, KARAKTER_SUBTES };
