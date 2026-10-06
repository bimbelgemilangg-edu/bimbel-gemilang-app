// src/utils/teksKunciSoal.js
// ============================================================
// Kunci jawaban sebagai TEKS yang bisa disebut lisan / dicetak.
//
// Dipindah ke sini dari halaman GuruPantauTryOut.jsx (2026-10-06) supaya
// mesin cetak paket latihan (src/utils/cetakLatihan.js) memakai SATU
// sumber yang sama: lembar KUNCI-TENTOR dan layar tinjau tentor tidak
// boleh menyebut kunci dengan bahasa yang berbeda.
//
// Menormalkan semua dialek penyimpanan kunci yang memang beraneka di
// repo ini: huruf tunggal, indeks angka, teks jawaban, array untuk
// pg_kompleks, string "AC", dan field jawaban/kunci per baris untuk
// benar_salah -- toleransi yang sama dengan mesin skoring.
// ============================================================

import { cariIndexBenar, kunciBarisBenarSalah } from './skoringSoalKompleks.js';
import { pilihBarisBenarSalah } from './skorSoalTryOut.js';

/**
 * @param {object} soal butir soal bank (kontrak 12 field)
 * @returns {string} kunci dalam bentuk teks yang bisa disebut/dicetak
 */
export function teksKunciSoal(soal) {
  const tipe = soal?.tipe || 'pg_sederhana';
  if (tipe === 'esai' || tipe === 'uraian') return 'penilaian manual guru (0-100)';
  if (tipe === 'pg_sederhana') {
    const idx = cariIndexBenar(soal);
    return idx >= 0 ? String.fromCharCode(65 + idx) : '(kunci tidak tersedia)';
  }
  if (tipe === 'pg_kompleks') {
    const mentah = soal?.kunciJawaban;
    const kunci = Array.isArray(mentah) ? mentah
      : (typeof mentah === 'string' && mentah.trim() ? mentah.replace(/[\s,]+/g, '').split('') : []);
    return kunci.length ? kunci.map((h) => String(h).toUpperCase()).join(', ') : '(kunci tidak tersedia)';
  }
  if (tipe === 'benar_salah' || tipe === 'pg_kategori') {
    const baris = pilihBarisBenarSalah(soal);
    const isi = baris.map((b, i) => `${i + 1}: ${kunciBarisBenarSalah(b) || '?'}`).join(', ');
    return isi || '(kunci tidak tersedia)';
  }
  // isian_singkat / numerik: kunci utama plus jawaban ekuivalen yang diterima
  const utama = String(soal?.kunciJawaban ?? '').trim();
  const ekuivalen = Array.isArray(soal?.jawabanEkuivalen) ? soal.jawabanEkuivalen.filter(Boolean).map(String) : [];
  return [utama, ...ekuivalen].filter(Boolean).join(' / ') || '(kunci tidak tersedia)';
}

export default { teksKunciSoal };
