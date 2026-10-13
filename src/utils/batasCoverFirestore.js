// src/utils/batasCoverFirestore.js
// ============================================================
// PAGAR UKURAN COVER FOLDER — supaya gambar opsional tidak bisa lagi
// membunuh operasi utama.
//
// KENAPA ADA (bug nyata tertangkap owner 2026-10-11 di preview e158f26):
// membuat folder sumber soal gagal dengan
//   "The value of property \"coverUrl\" is longer than 1048487 bytes."
// setelah tombol menekan lama. Rantainya: unggah cover -> FileReader
// menyimpan base64 MENTAH ke state -> pembuatan folder menulisnya apa
// adanya ke field Firestore `coverUrl`. Satu field OPSIONAL ("Upload
// Cover (opsional)") menggagalkan SELURUH pembuatan folder, dan pemilik
// menunggu lama dulu sebelum tahu.
//
// Firestore membatasi satu field string/document ~1.048.487 byte. Base64
// membengkakkan berkas ~4/3x, jadi foto cover 1 MB sudah pasti lewat.
// Pagar ini dipakai DUA tempat:
//   1. sebelum menyimpan: putusan apakah data-URI aman masuk field;
//   2. saat membuat folder: cover yang tidak aman DIBUANG dan folder
//      tetap dibuat, lalu admin diberitahu -- field opsional tidak boleh
//      lagi menyandera operasi utama.
// Angka ambang sengaja di bawah batas Firestore (900.000 < 1.048.487)
// supaya ada ruang untuk header data-URI dan pembulatan.
//
// MURNI & TERUJI (tests/batasCoverFirestore.test.mjs).
// ============================================================

/** Batas keras satu field Firestore (byte), sesuai pesan error aslinya. */
export const BATAS_FIELD_FIRESTORE = 1048487;

/** Ambang aman yang dipakai aplikasi: menyisakan ruang untuk header data-URI & pembulatan. */
export const AMBAN_AMAN_COVER = 900000;

/**
 * Perkiraan ukuran DECODE (byte) sebuah data-URI base64.
 * Base64 memakai 4 karakter per 3 byte, dikurangi padding '='.
 * @param {string} dataUrl
 * @returns {number}
 */
export function ukuranByteDataUrl(dataUrl) {
  const s = String(dataUrl ?? '');
  const koma = s.indexOf(',');
  if (koma < 0) return s.length;
  const badan = s.slice(koma + 1);
  const padding = badan.endsWith('==') ? 2 : badan.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((badan.length * 3) / 4) - padding);
}

/**
 * Putuskan apakah cover berupa data-URI aman disimpan ke field Firestore.
 * @param {string} dataUrl
 * @param {number} [ambang]
 * @returns {{aman:boolean, byte:number, ambang:number, alasan:string}}
 */
export function putuskanCover(dataUrl, ambang = AMBAN_AMAN_COVER) {
  const byte = ukuranByteDataUrl(dataUrl);
  if (!String(dataUrl ?? '').trim()) {
    return { aman: true, byte: 0, ambang, alasan: 'tanpa cover' };
  }
  if (byte > ambang) {
    return {
      aman: false,
      byte,
      ambang,
      alasan: `cover ${byte.toLocaleString('id-ID')} byte melebihi ambang aman ${ambang.toLocaleString('id-ID')} byte (batas field Firestore ${BATAS_FIELD_FIRESTORE.toLocaleString('id-ID')} byte)`,
    };
  }
  return { aman: true, byte, ambang, alasan: 'cover dalam batas aman' };
}

export default { BATAS_FIELD_FIRESTORE, AMBAN_AMAN_COVER, ukuranByteDataUrl, putuskanCover };
