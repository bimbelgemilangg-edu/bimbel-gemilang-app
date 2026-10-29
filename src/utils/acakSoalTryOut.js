// src/utils/acakSoalTryOut.js
// ============================================================
// Acak urutan soal SUPAYA BEDA antar siswa (anti-nyontek nomor
// jawaban dari teman sebelah), TAPI KONSISTEN buat siswa yang sama
// tiap kali dia buka/reload halaman try out (bukan acak ulang tiap
// render, yang bisa bikin bingung/nomor soal loncat-loncat).
//
// Caranya: bikin "seed" (angka) dari gabungan studentId + paketId,
// terus pakai seed itu buat acak yang deterministik -- seed yang sama
// SELALU menghasilkan urutan acak yang SAMA PERSIS.
//
// 🔥 2026-10-29 (kegelisahan owner: "takutnya ada pertanyaan yang
// bacaan atau bagian objek soal itu hilang ... apalagi waktu soal di
// acak di ujian atau tryout, bagaimana aplikasi ujian besar mengatasi
// hal ini?"): pengacakan kini SADAR GRUP. Soal-soal yang berbagi satu
// bacaan/stimulus (kunci sama lewat `kunciStimulus` di fieldButirSoal)
// diacak sebagai SATU UNIT yang selalu bersebelahan -- persis praktik
// ujian besar (UTBK/SNBT, TKA Pusmendik): yang diundi adalah LETAK
// BLOK wacana, tidak pernah memecah wacana dari soal-soalnya.
// Jaminan berlapis: data tiap soal tetap membawa salinan bacaannya
// sendiri (kontrak "dokumen mandiri"), jadi bahkan bila grup terpisah
// (paket lama yang urutannya sudah terlanjur acak), siswa TIDAK PERNAH
// kehilangan teks bacaan.
// ============================================================

import { kunciStimulus } from './fieldButirSoal.js';

function buatSeed(teks) {
  let hash = 0;
  for (let i = 0; i < teks.length; i++) {
    hash = (hash << 5) - hash + teks.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function acakDenganSeed(daftar, seed) {
  const arr = [...daftar];
  let s = seed;
  const random = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Pecah daftar soal menjadi UNIT berurutan: satu unit = run soal-soal
 * BERSEBELAHAN yang berbagi kunci stimulus yang sama (bacaan.grup /
 * stimulusGrup / sidik jari teks bacaan). Soal tanpa bacaan = unit tunggal.
 * Dipakai pengacak (di sini) dan mesin try out otomatis supaya pengertian
 * "satu kesatuan bacaan" tidak punya dua versi.
 * @param {Array} daftarSoal
 * @returns {Array<Array>} daftar unit (urutan dalam unit TIDAK diubah)
 */
export function unitSoalBerurutan(daftarSoal) {
  const daftar = Array.isArray(daftarSoal) ? daftarSoal : [];
  const units = [];
  let i = 0;
  while (i < daftar.length) {
    const k = kunciStimulus(daftar[i]);
    let j = i + 1;
    if (k) {
      while (j < daftar.length && kunciStimulus(daftar[j]) === k) j += 1;
    }
    units.push(daftar.slice(i, j));
    i = j;
  }
  return units;
}

/**
 * @param {Array} daftarSoal - array soal yang mau diacak urutannya
 * @param {string} studentId
 * @param {string} paketId
 * @param {string} garam - opsional, buat bikin urutan acak BEDA di konteks
 *   berbeda walau studentId+paketId sama (mis. per-subtes, biar urutan
 *   subtes A gak "ngikutin pola" yang sama persis satu sama lain buat
 *   siswa yang sama)
 * @param {object} opsi - `{ pisahGrup: true }` untuk mematikan kesadaran
 *   grup (perilaku lama; hampir tidak pernah diinginkan)
 */
export function acakSoalPerSiswa(daftarSoal, studentId, paketId, garam = '', opsi = {}) {
  const seed = buatSeed(`${studentId}_${paketId}_${garam}`);
  const daftar = Array.isArray(daftarSoal) ? daftarSoal : [];
  if (opsi && opsi.pisahGrup === true) return acakDenganSeed(daftar, seed);
  // Daftar tanpa grup (semua unit tunggal) menghasilkan permutasi yang
  // SAMA PERSIS dengan versi lama — seed dan algoritmenya tidak berubah.
  return acakDenganSeed(unitSoalBerurutan(daftar), seed).flat();
}

export default { acakSoalPerSiswa, unitSoalBerurutan };
