// src/utils/perbaikanLatexMassal.js
// ============================================================
// RENCANA PERBAIKAN KURUNG HIMPUNAN LATEX UNTUK DATA LAMA — murni, teruji.
// ============================================================
//
// KENAPA BERKAS INI ADA
// Owner 2026-10-09, setelah seluruh bank (2.900 butir) dibaca: 51 butir
// aktif masih memuat kurung himpunan LaTeX yang TIDAK di-escape — insiden
// lama "A = 2, 3" yang belum mati di data warisan.
//
// Mesin perbaikannya SUDAH ADA dan sudah teruji: `perbaikiKurungHimpunanLatex`
// di kurungLatex.js, idempoten, dan sejak 2026-10-05 dipasang di jalur impor
// (bankSoalSanitizer + ImportHasilScan). Maka 51 butir ini adalah data yang
// masuk SEBELUM pagar itu ada. Berkas ini tidak menulis regex baru — ia
// hanya menjalankan mesin lama itu ke seluruh field teks butir lama, dan
// menyusun RENCANA (dry-run) supaya manusia melihat sebelum & sesudahnya.
//
// ATURAN MAIN
//   - Tidak menulis apa-apa. Halaman yang menulis, atas perintah owner.
//   - Nilai lama disertakan di `sebelum` supaya perubahan bisa dibatalkan
//     atau diperiksa ulang kapan pun.
//   - Idempoten: dijalankan kedua kali pada hasil yang sama = nol perubahan.
//     Itu juga uji utamanya.
// ============================================================

import { perbaikiKurungHimpunanLatex } from './kurungLatex.js';

const perbaiki = (v) => perbaikiKurungHimpunanLatex(String(v ?? ''));

function perbaikanOpsi(opsi) {
  if (!Array.isArray(opsi)) return null;
  let berubah = false;
  const hasil = opsi.map((o) => {
    if (typeof o === 'string') {
      const b = perbaiki(o);
      if (b !== o) berubah = true;
      return b;
    }
    if (o && typeof o === 'object' && typeof o.teks === 'string') {
      const b = perbaiki(o.teks);
      if (b !== o.teks) berubah = true;
      return { ...o, teks: b };
    }
    return o;
  });
  return berubah ? hasil : null;
}

/**
 * Susun rencana perbaikan LaTeX untuk sekumpulan dokumen bank soal.
 * @param {Array<{id:string, data:object}>} daftar
 * @returns {Array<{id:string, perubahan:object, sebelum:object, alasan:string[]}>}
 */
export function rencanaPerbaikanLatex(daftar) {
  const rencana = [];
  for (const butir of Array.isArray(daftar) ? daftar : []) {
    const id = butir?.id;
    const d = butir?.data || butir || {};
    if (!id) continue;

    const perubahan = {};
    const sebelum = {};
    const alasan = [];

    // teks soal: hormati alias yang benar-benar ada di dokumen
    for (const field of ['soal', 'teksSoal']) {
      if (typeof d[field] === 'string' && d[field] !== '') {
        const b = perbaiki(d[field]);
        if (b !== d[field]) {
          perubahan[field] = b;
          sebelum[field] = d[field];
          alasan.push(`teks soal (${field})`);
        }
      }
    }

    const opsi = perbaikanOpsi(d.opsiJawaban);
    if (opsi) {
      perubahan.opsiJawaban = opsi;
      sebelum.opsiJawaban = d.opsiJawaban;
      alasan.push('opsi jawaban');
    }

    if (Array.isArray(d.pernyataan)) {
      const b = d.pernyataan.map((x) => (typeof x === 'string' ? perbaiki(x) : x));
      if (JSON.stringify(b) !== JSON.stringify(d.pernyataan)) {
        perubahan.pernyataan = b;
        sebelum.pernyataan = d.pernyataan;
        alasan.push('pernyataan');
      }
    }

    if (Array.isArray(d.tabelBenarSalah)) {
      const b = d.tabelBenarSalah.map((r) => (r && typeof r.pernyataan === 'string' ? { ...r, pernyataan: perbaiki(r.pernyataan) } : r));
      if (JSON.stringify(b) !== JSON.stringify(d.tabelBenarSalah)) {
        perubahan.tabelBenarSalah = b;
        sebelum.tabelBenarSalah = d.tabelBenarSalah;
        alasan.push('tabel benar/salah');
      }
    }

    if (Array.isArray(d.pasangan)) {
      const b = d.pasangan.map((r) => (r ? { ...r, kiri: perbaiki(r.kiri), kanan: perbaiki(r.kanan) } : r));
      if (JSON.stringify(b) !== JSON.stringify(d.pasangan)) {
        perubahan.pasangan = b;
        sebelum.pasangan = d.pasangan;
        alasan.push('pasangan menjodohkan');
      }
    }

    if (typeof d.pembahasan === 'string' && d.pembahasan !== '') {
      const b = perbaiki(d.pembahasan);
      if (b !== d.pembahasan) {
        perubahan.pembahasan = b;
        sebelum.pembahasan = d.pembahasan;
        alasan.push('pembahasan');
      }
    }

    if (alasan.length) rencana.push({ id, perubahan, sebelum, alasan });
  }
  return rencana;
}

/** Jumlah field yang akan berubah — untuk kalimat konfirmasi yang jujur. */
export function hitungFieldBerubah(rencana) {
  return (Array.isArray(rencana) ? rencana : []).reduce((a, r) => a + Object.keys(r.perubahan || {}).length, 0);
}

export default { rencanaPerbaikanLatex, hitungFieldBerubah };
