// src/utils/fieldButirSoal.js
// ============================================================
// PEMBACA FIELD BUTIR SOAL — satu sumber kebenaran, sadar-alias.
// ============================================================
//
// KENAPA BERKAS INI ADA
// Satu butir bank soal bisa menyimpan makna yang sama di beberapa nama
// field, karena lima jalur tulis di repo ini tidak sepakat:
//
//   teks soal : `soal` (Import Hasil Scan, Advanced Extractor)
//               `teksSoal` + `soal` (Mesin Bank Soal, Impor HTML Gemini)
//               `teks_soal` (draf lama)
//   mapel     : `mataPelajaran` / `mapel`
//   kelas     : `tingkatKelas` / `kelas`
//   bab       : `materi` / `bab` / `topik`
//   bacaan    : `bacaan` / `stimulus` / `wacana` (string ATAU objek)
//
// Setiap pembaca yang hanya mengenal SATU nama akan diam-diam kehilangan
// isi. Yang sudah terbukti terjadi:
//   - mesin cetak membaca `soal || teks_soal` saja, jadi butir dari Mesin
//     Bank Soal bisa tercetak tanpa teks;
//   - Bersihkan Soal menuduh "Teks soal kosong" dari `s.soal` saja, lalu
//     SOFT-DELETE berdasarkan tuduhan itu;
//   - dan yang paling mahal: KEDUA mesin cetak TIDAK merender `bacaan`
//     sama sekali, sehingga soal literasi (Bahasa Indonesia/Inggris, TKA)
//     tercetak TANPA teks bacaannya — siswa disuruh menjawab pertanyaan
//     tentang wacana yang tidak ada di lembar.
//
// Maka pembaca field dipusatkan di sini: mesin cetak, kartu baca tentor,
// mesin audit, dan halaman pembersih memakai pengertian yang SAMA.
// ============================================================

import { normalisasiBacaan } from './mesinIdentitasSoal.js';

// ------------------------------------------------------------
// Watermark logo Gemilang
// ------------------------------------------------------------
// Owner 2026-10-08: "watermark besarkan lagi gapapa, opasitasnya agak
// dijelaskin". Angka-angkanya dipatok DI SINI supaya layar dan hasil
// cetak tidak punya dua identitas, dan supaya test bisa memaku bahwa
// nilainya memang terlihat (bukan nyaris tak kelihatan seperti 0.07).
//
// Logonya berkas yang sama dengan kwitansi (src/utils/kwitansi.js).
// Repo ini sudah punya TIGA rujukan buntu ke /logo-gemilang.png.png yang
// tidak ada di public/ — jangan menambah yang keempat.
export const WATERMARK = {
  logo: '/pwa-192x192.png',
  /** 0..1 — kartu baca di layar. Cukup jelas tanpa menutupi teks. */
  opacityLayar: 0.14,
  /** 0..1 — hasil cetak. Lebih rendah sedikit: tinta di kertas lebih pekat. */
  opacityCetak: 0.12,
  /** px — ukuran di kartu layar. Logo aslinya 192px; 240px masih tajam. */
  ukuranPx: 240,
  /** mm — ukuran di lembar cetak (±45% lebar A4, di tengah halaman). */
  ukuranMm: 95,
};

/**
 * Teks soal, sadar-alias.
 * @returns {string} teks terpangkas, '' bila benar-benar tidak ada
 */
export function teksSoalDari(soal) {
  // 🔥 Perbaikan 2026-10-08: `a || b` TIDAK CUKUP. Nilai berupa spasi saja
  // ('   ') itu truthy, jadi alias berikutnya tidak pernah dicoba dan butir
  // yang teksnya ada di `teksSoal` tetap terbaca kosong. Yang dipilih adalah
  // alias pertama yang benar-benar punya isi setelah dipangkas.
  const kandidat = [soal?.soal, soal?.teksSoal, soal?.teks_soal, soal?.pertanyaan];
  for (const nilai of kandidat) {
    const teks = String(nilai ?? '').trim();
    if (teks) return teks;
  }
  return '';
}

/**
 * Bacaan/wacana/stimulus bersama (untuk soal literasi dan nomor 11-15).
 * Menumpang `normalisasiBacaan` dari mesinIdentitasSoal supaya bentuk
 * {teks, gambar, grup, jenis, tabel, rentang} seragam di seluruh aplikasi.
 * @returns {{teks:string, gambar:Array, grup:*, jenis:string}|null}
 */
export function bacaanDari(soal) {
  const mentah = soal?.bacaan ?? soal?.stimulus ?? soal?.wacana;
  const hasil = normalisasiBacaan(mentah);
  if (!hasil) return null;
  if (!String(hasil.teks || '').trim() && !(hasil.gambar || []).length) return null;
  return hasil;
}

/** Identitas butir, sadar-alias. */
export function identitasDari(soal) {
  return {
    mapel: String(soal?.mataPelajaran || soal?.mapel || '').trim() || '(tanpa mapel)',
    jenjang: String(soal?.jenjang || '').trim() || '(tanpa jenjang)',
    materi: String(soal?.materi || soal?.bab || soal?.topik || '').trim() || '(tanpa materi)',
    kelas: String(soal?.tingkatKelas || soal?.kelas || '').trim(),
  };
}

export default { WATERMARK, teksSoalDari, bacaanDari, identitasDari };
