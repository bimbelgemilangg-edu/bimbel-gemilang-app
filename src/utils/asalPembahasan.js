// src/utils/asalPembahasan.js
// ============================================================
// ASAL PEMBAHASAN — membaca pengakuan "tercetak atau penalaran AI" pada
// pintu impor HTML Master, supaya pintu ini punya kejujuran yang sama
// dengan pintu prompt paten.
//
// KENAPA ADA (permintaan owner 2026-10-11 tentang produksi pembahasan):
// tidak semua soal punya pembahasan tercetak. Pintu prompt paten sudah
// lama mewajibkan pengakuan data-asal-pembahasan="tercetak|penalaran"
// dan menampilkan bendera "hasil penalaran AI — periksa dulu" di semua
// layar. Pintu master (yang dipakai produksi sehari-hari) BELUM:
// pembahasan hasil karangan AI masuk bank tanpa pembeda, lalu terbaca
// guru sebagai penjelasan buku. Util ini membaca dua sumber kebenaran:
//   1. atribut/meta eksplisit asal_pembahasan bila AI mengisinya;
//   2. penanda teks "PEMBAHASAN PENALARAN AI:" yang diwajibkan aturan 36
//      prompt master OCR sebagai baris pertama pembahasan.
// Penanda itu alat komunikasi mesin, jadi ia DIBUANG dari teks yang
// dibaca manusia setelah asal terbaca -- siswa dan guru melihat
// pembahasan bersih, benderanya hidup dari field pembahasanAsal.
//
// MURNI & TERUJI (tests/asalPembahasan.test.mjs).
// ============================================================

export const PENANDA_PENALARAN = 'PEMBAHASAN PENALARAN AI:';

/**
 * @param {object} args { pembahasan, asalEksplisit }
 * @returns {{asal:'tercetak'|'penalaran', teksBersih:string, adaPenanda:boolean}}
 */
export function deteksiAsalPembahasan({ pembahasan = '', asalEksplisit = '' } = {}) {
  const teks = String(pembahasan ?? '');
  const adaPenanda = teks.includes(PENANDA_PENALARAN);
  const eks = String(asalEksplisit ?? '').trim().toLowerCase();

  // Penanda teks MENANG atas meta eksplisit: bila keduanya bertentangan
  // (meta mengaku tercetak tapi penanda ada), sisi yang lebih berhati-hati
  // yang dipakai -- sama seperti filosofi tangga gambar asli.
  let asal;
  if (adaPenanda) asal = 'penalaran';
  else if (eks === 'penalaran' || eks === 'tercetak') asal = eks;
  else asal = 'tercetak';

  const teksBersih = adaPenanda
    ? teks.split(PENANDA_PENALARAN).join('').trim()
    : teks;
  return { asal, teksBersih, adaPenanda };
}

export default { PENANDA_PENALARAN, deteksiAsalPembahasan };
