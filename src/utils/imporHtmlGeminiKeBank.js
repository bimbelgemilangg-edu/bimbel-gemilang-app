// src/utils/imporHtmlGeminiKeBank.js
// ============================================================
// Jembatan antara keluaran ekstraktor HTML Gemini
// (src/utils/ekstrakHtmlGemini.js) dan bentuk dokumen koleksi
// `bank_soal` yang sudah dikenali seluruh sistem (mesin skoring, mesin
// cetak, Perpustakaan, Lemari Soal).
//
// KENAPA DIPISAH DARI HALAMAN: pemetaan field adalah logika yang bisa
// salah tanpa kelihatan (salah satu field = soal tak terbaca di satu
// halaman), jadi ia wajib murni & teruji. Halaman hanya urusan klik.
//
// Menumpang mesin taksonomi yang SAMA dengan jalur impor JSON lama
// (deteksiTaksonomiSoal + terapkanTaksonomi), sehingga soal dari HTML
// Gemini dan soal dari JSON admin mendapat perlakuan pengelompokan yang
// identik -- tidak ada dua kasta warga di bank soal.
// ============================================================

import { deteksiTaksonomiSoal, terapkanTaksonomi } from './mesinTaksonomiSoal.js';

/**
 * @param {object} butir   keluaran ekstrakHtmlGemini (kontrak 12 field + materi/pembahasan)
 * @param {object} konteks { fileName, mapel, jenjang, kelas, sumber }
 * @returns {object} dokumen siap writeBatch ke koleksi bank_soal
 */
export function dokumenDariButir(butir = {}, konteks = {}) {
  const norm = {
    nomor: butir.nomor ?? null,
    tipe: butir.tipe || 'pg_sederhana',
    teksSoal: butir.soal || '',
    soal: butir.soal || '',
    opsiJawaban: butir.opsiJawaban || [],
    pernyataan: butir.pernyataan || [],
    tabelBenarSalah: butir.tabel_benar_salah || [],
    pasangan: butir.pasangan || [],
    kunciJawaban: butir.kunciJawaban ?? '',
    gambar: [],
    gambarUrls: butir.gambarUrls || [],
    bacaan: butir.bacaan || null,
    pembahasan: butir.pembahasan || '',
    pembahasanAsal: butir.pembahasanAsal || 'tercetak',
    sumber: butir.sumber || '',
    status: 'aktif',
    sumberFile: konteks.fileName || 'impor-html-gemini',
    asalImpor: 'html-gemini',
  };

  const tak = deteksiTaksonomiSoal(norm, {
    ...konteks,
    bab: butir.materi || konteks.bab || '',
  });
  const dok = terapkanTaksonomi(norm, tak, { force: true });

  // Lemari Soal & Perpustakaan & Cetak Latihan membaca `materi`;
  // taksonomi menulis `bab`. Samakan keduanya supaya tidak ada halaman
  // yang melihat bab kosong.
  dok.materi = dok.bab || butir.materi || '';
  return dok;
}

/** Ringkasan prakirim untuk layar pratinjau: jumlah per bab + bendera. */
export function ringkasanImpor(soal = []) {
  const perBab = new Map();
  let penalaran = 0;
  let tanpaKunci = 0;
  for (const s of soal) {
    const bab = s.materi || '(tanpa bab)';
    perBab.set(bab, (perBab.get(bab) || 0) + 1);
    if (s.pembahasanAsal === 'penalaran') penalaran += 1;
    const k = s.kunciJawaban;
    const kosong = k === '' || k === null || undefined === k
      || (Array.isArray(k) && k.length === 0);
    if (kosong && s.tipe !== 'esai') tanpaKunci += 1;
  }
  return {
    jumlah: soal.length,
    perBab: [...perBab.entries()].sort((a, b) => a[0].localeCompare(b[0], 'id')),
    penalaran,
    tanpaKunci,
  };
}

export default { dokumenDariButir, ringkasanImpor };
