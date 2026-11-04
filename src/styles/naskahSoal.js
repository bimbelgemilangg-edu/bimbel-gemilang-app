// src/styles/naskahSoal.js
// ============================================================
// TOKEN TIPOGRAFI NASKAH SOAL -- SATU-SATUNYA SUMBER (keputusan owner
// 2026-11-04: "benahi sistem Gemilang sekelas platform CBT profesional;
// tampilan wajib seperti naskah soal asli yang dikirimkan").
//
// Kenapa file ini ada: sebelumnya tiap permukaan memakai angka
// sendiri-sendiri (teks soal 13px di TeksSoalBergambar, 14px di
// TryOutView, 13.5px di widget latihan, Arial 11px di lembar cetak) --
// soal yang sama tampil beda ukuran/keluarga huruf antar layar. Sekarang
// try out siswa, tinjau guru, hasil admin, bank soal, latihan harian,
// dan lembar cetak semuanya mengimpor token dari sini, sehingga WAJIB
// sama persis (pola yang diminta owner: satu wadah butir, satu tampilan
// dari sisi guru sampai siswa).
//
// Gaya naskah mengikuti kertas ujian profesional (naskah TKA/UTBK):
// serif Times, tubuh teks lebih besar dari UI, baris lega, rata
// kiri-kanan (justify) seperti soal tercetak.
// ============================================================

/** Keluarga huruf naskah soal (layar & cetak) -- serif ala kertas ujian. */
export const FONT_NASKAH = "'Times New Roman', Times, 'Nimbus Roman No9 L', Georgia, serif";

/** Ukuran teks badan soal di layar (px). */
export const UKURAN_SOAL = 16.5;

/** Ukuran bacaan/stimulus bersama di layar (px). */
export const UKURAN_BACAAN = 15.5;

/** Ukuran teks opsi jawaban / pernyataan tabel di layar (px). */
export const UKURAN_OPSI = 16;

/** Tinggi baris naskah (lega, nyaman dibaca berlama-lama). */
export const TINGGI_BARIS_NASKAH = 1.7;

/** Warna teks naskah: kontras 16.9:1 di atas putih (lolos WCAG AAA). */
export const WARNA_NASKAH = '#111827';

/**
 * Gaya dasar badan soal -- tempel apa adanya di style container teks.
 * Boleh ditimpa per-permukaan HANYA untuk layout (margin dsb), bukan
 * untuk keluarga/ukuran huruf.
 */
export const GAYA_TEKS_NASKAH = {
  fontFamily: FONT_NASKAH,
  fontSize: UKURAN_SOAL,
  lineHeight: TINGGI_BARIS_NASKAH,
  color: WARNA_NASKAH,
  textAlign: 'justify',
  hyphens: 'auto',
};

/** Gaya dasar bacaan/stimulus. */
export const GAYA_TEKS_BACAAN = {
  fontFamily: FONT_NASKAH,
  fontSize: UKURAN_BACAAN,
  lineHeight: TINGGI_BARIS_NASKAH,
  color: WARNA_NASKAH,
  textAlign: 'justify',
  hyphens: 'auto',
};

/** Gaya dasar teks opsi/pernyataan. */
export const GAYA_TEKS_OPSI = {
  fontFamily: FONT_NASKAH,
  fontSize: UKURAN_OPSI,
  lineHeight: 1.6,
  color: WARNA_NASKAH,
};
