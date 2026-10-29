// src/utils/deteksiBacaanTertanam.js
// ============================================================
// DETEKTOR "BACAAN TERTANAM" (2026-10-29, audit owner: PDF TO Bahasa
// Inggris 21 halaman — satu wacana tercetak 5× karena sistem tidak tahu
// soal-soal itu satu kesatuan).
//
// Mesin cetak & layar mengelompokkan wacana bersama lewat field `bacaan`
// (kunciStimulus). Tapi pihak ketiga yang TIDAK patuh kontrak kadang
// menyalin wacana panjang ke AWAL `teks_soal` tiap nomor tanpa mengisi
// `bacaan` sama sekali — bagi mesin, tiap butir jadi "mandiri" dan
// wacananya dicetak berulang, tidak bisa digabung.
//
// Util ini MENDETEKSI pola itu tanpa mengubah data apa pun (prinsip
// owner: sistem tidak menambal diam-diam markup pihak ketiga):
// sederetan soal BERURUTAN (≥2) tanpa field bacaan yang teks_soal-nya
// berbagi AWALAN IDENTIK ≥ `minPanjang` karakter hampir pasti satu
// wacana bersama yang tertanam. Temuan dipakai halaman Periksa Berkas
// sebagai PERINGATAN + saran perbaikan (bukan penolakan — rejection
// tidak boleh jadi jalan buntu).
// ============================================================

import { teksSoalDari, bacaanDari } from './fieldButirSoal.js';

/** Awalan bersama minimal (karakter ternormalisasi) agar dianggap wacana. */
export const MIN_AWALAN_BACAAN = 300;

function norm(teks) {
  return String(teks ?? '').replace(/\s+/g, ' ').trim();
}

/** Panjang awalan identik dua string (karakter per karakter). */
export function panjangAwalanSama(a, b) {
  const x = String(a ?? '');
  const y = String(b ?? '');
  const n = Math.min(x.length, y.length);
  let i = 0;
  while (i < n && x[i] === y[i]) i += 1;
  return i;
}

function punyaBacaanNyata(s) {
  const b = bacaanDari(s);
  if (!b) return false;
  return Boolean(String(b.teks || '').trim() || (Array.isArray(b.gambar) ? b.gambar : []).length);
}

/**
 * @param {Array} daftarSoal butir berurutan (hasil normalizeSoal ATAU dokumen bank)
 * @param {object} opsi { minPanjang }
 * @returns {Array<{dariIndeks:number, sampaiIndeks:number, jumlahSoal:number,
 *   panjangAwalan:number, nomor:Array, contohAwalan:string}>}
 *   satu entri per run wacana tertanam; kosong bila data patuh kontrak.
 */
export function deteksiBacaanTertanam(daftarSoal, opsi = {}) {
  const min = Number(opsi.minPanjang) > 0 ? Number(opsi.minPanjang) : MIN_AWALAN_BACAAN;
  const daftar = Array.isArray(daftarSoal) ? daftarSoal : [];
  const temuan = [];
  let i = 0;
  while (i < daftar.length) {
    if (punyaBacaanNyata(daftar[i])) { i += 1; continue; }
    const teksI = norm(teksSoalDari(daftar[i]));
    if (teksI.length < min) { i += 1; continue; }
    let j = i + 1;
    let awalan = teksI.length;
    while (j < daftar.length && !punyaBacaanNyata(daftar[j])) {
      const teksJ = norm(teksSoalDari(daftar[j]));
      const p = panjangAwalanSama(teksI, teksJ);
      if (p < min) break;
      awalan = Math.min(awalan, p);
      j += 1;
    }
    if (j - i >= 2) {
      temuan.push({
        dariIndeks: i,
        sampaiIndeks: j - 1,
        jumlahSoal: j - i,
        panjangAwalan: awalan,
        nomor: daftar.slice(i, j).map((s, k) => Number(s?.nomor) || i + k + 1),
        contohAwalan: `${teksI.slice(0, 120)}…`,
      });
      i = j;
    } else {
      i += 1;
    }
  }
  return temuan;
}

export default { deteksiBacaanTertanam, panjangAwalanSama, MIN_AWALAN_BACAAN };
