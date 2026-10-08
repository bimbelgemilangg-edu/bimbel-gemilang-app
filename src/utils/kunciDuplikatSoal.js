// src/utils/kunciDuplikatSoal.js
// ============================================================
// SIDIK JARI DUPILIKAT YANG SADAR GAMBAR.
// ============================================================
//
// KENAPA BERKAS INI ADA
// Owner 2026-10-08, menunjukkan halaman Bersihkan Soal: "kadang sama itu
// pada perintah banyak soal sama pada perintah — pastikan dia gak deteksi
// hanya pada kata kunci perintah. Contoh soal infografis yang berbeda-beda
// gambarnya tapi kan pertanyaan sama."
//
// Tangkapan layarnya memperlihatkan akibatnya: grup "2 soal identik" berisi
// dua butir dengan perintah YANG MEMANG SAMA PERSIS —
//   "Berdasarkan gambar poster di atas, tentukan apakah setiap pernyataan
//    berikut Benar atau Salah!"
// — tetapi POSTER-nya berbeda. Keduanya bukan duplikat: gambar itulah
// soalnya. Detektor lama membangun kunci dari TEKS SAJA (`normalisasiTeks`
// membuang tag HTML dan semua karakter non-kata, gambar tidak ikut), jadi
// pasangan seperti ini otomatis tercentang untuk di-soft-delete. Halaman
// itu bahkan menulis "37 soal ditandai dihapus" sebelum bug ini dipahami.
//
// Prinsip berkas ini: DUA BUTIR HANYA DUPILIKAT BILA ISI YANG DILIHAT SISWA
// SAMA — perintah, gambar, pilihan/pernyataan/pasangan. Bukan karena
// kalimat perintahnya kebetulan kalimat yang populer.
//
// Arah perubahan sengaja dibuat LEBIH KETAT (lebih sedikit yang dituduh
// duplikat). Untuk operasi yang menghapus data, luput mendeteksi beberapa
// duplikat jauh lebih murah daripada menghapus soal yang sebenarnya beda.
// ============================================================

import { teksSoalDari } from './fieldButirSoal.js';

/** Panjang minimum teks sebelum sebuah butir ikut diperiksa duplikat. */
export const MIN_TEKS_DUPLIKAT = 15;

function normTeks(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Kumpulkan SEMUA url gambar yang dilihat siswa dari sebuah butir:
 * gambar di badan soal (`gambarUrls`, `gambar[].url`) DAN gambar di dalam
 * pilihan jawaban (`opsiJawaban[].gambar[].url`). Diurutkan supaya dua
 * dokumen dengan urutan penyimpanan berbeda tetap menghasilkan sidik jari
 * yang sama.
 * @returns {string} sidik jari gabungan, '' bila tidak ada gambar
 */
export function sidikJariGambar(soal) {
  const url = [];
  const dorong = (v) => {
    const s = String(v || '').trim();
    if (s) url.push(s);
  };
  (Array.isArray(soal?.gambarUrls) ? soal.gambarUrls : []).forEach(dorong);
  (Array.isArray(soal?.gambar) ? soal.gambar : []).forEach((g) => {
    if (typeof g === 'string') dorong(g);
    else dorong(g?.url || g?.uploadedUrl);
  });
  (Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : []).forEach((o) => {
    if (o && typeof o === 'object' && Array.isArray(o.gambar)) {
      o.gambar.forEach((g) => dorong(typeof g === 'string' ? g : g?.url || g?.uploadedUrl));
    }
  });
  return [...new Set(url)].sort().join(' ');
}

/**
 * Isi butir per tipe, dinormalkan — supaya dua butir yang perintahnya sama
// tetapi pernyataan/pilihan/pasangannya beda TIDAK dianggap kembar.
 */
function sidikJariIsi(soal) {
  const bagian = [];
  const opsi = Array.isArray(soal?.opsiJawaban) ? soal.opsiJawaban : [];
  if (opsi.length) bagian.push(opsi.map((o) => normTeks(typeof o === 'string' ? o : o?.teks)).join(' | '));
  const pernyataan = Array.isArray(soal?.pernyataan) ? soal.pernyataan : [];
  if (pernyataan.length) bagian.push(pernyataan.map((p) => normTeks(typeof p === 'string' ? p : p?.teks)).join(' | '));
  const tabel = Array.isArray(soal?.tabelBenarSalah) ? soal.tabelBenarSalah : [];
  if (tabel.length) bagian.push(tabel.map((b) => `${normTeks(b?.pernyataan)}=${normTeks(b?.kunci)}`).join(' | '));
  const pasangan = Array.isArray(soal?.pasangan) ? soal.pasangan : [];
  if (pasangan.length) bagian.push(pasangan.map((p) => `${normTeks(p?.kiri)}>${normTeks(p?.kanan)}`).join(' | '));
  return bagian.join(' # ');
}

/**
 * Kunci pengelompokan duplikat.
 * @returns {string|null} null berarti butir ini TIDAK ikut diperiksa
 *   (teks terlalu pendek — menuduh berdasarkan 14 karakter terlalu berisiko)
 */
export function kunciDuplikat(soal) {
  const teks = normTeks(teksSoalDari(soal));
  if (teks.length < MIN_TEKS_DUPLIKAT) return null;
  return [
    String(soal?.mataPelajaran || soal?.mapel || '').trim(),
    String(soal?.jenjang || '').trim(),
    String(soal?.tingkatKelas || soal?.kelas || '').trim(),
    teks,
    sidikJariGambar(soal),
    sidikJariIsi(soal),
  ].join('|||');
}

/**
 * Penjelasan manusiawi kenapa dua butir masuk grup yang sama — ditampilkan
 * di halaman supaya admin tidak diminta mempercayai mesin begitu saja.
 */
export function alasanDuplikat(soal) {
  const gambar = sidikJariGambar(soal);
  return gambar
    ? `teks sama DAN ${gambar.split(' ').length} gambar sama`
    : 'teks sama dan tidak ada gambar di keduanya';
}

export default { MIN_TEKS_DUPLIKAT, sidikJariGambar, sidikJariIsi, kunciDuplikat, alasanDuplikat };
