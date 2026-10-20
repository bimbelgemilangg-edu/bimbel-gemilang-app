// src/utils/kodeSoalSiswa.js
// ============================================================
// KODE SOAL PENDEK UNTUK SISWA (20 Okt 2026, permintaan owner):
// siswa mengerjakan di sistem TETAPI mencoret proses di buku tulis;
// supaya sinkron, tiap soal memakai kode pendek yang MUDAH DITULIS
// di buku dan MUDAH DICARI kembali di aplikasi, mis. "MTK-1017-07".
//
// Sifat kode:
//   • STABIL per butir: nomor = posisi soal di paket (bukan urutan
//     tampil yang diacak anti-nyontek) -> kode teman sebelah tidak
//     pernah sama untuk soal berbeda, dan kode tak berubah saat
//     siswa membuka ulang;
//   • terbaca manusia: token mapel + tanggal terbit paket (MMDD) +
//     nomor urut dua digit;
//   • sidik jari kode sumber buku ([UTBK2024/...]) tetap ditampilkan
//     sebagai pelengkap bila ada, karena itu rujukan cetakannya.
// MURNI & TERUJI.
// ============================================================

const TOKEN_MAPEL = {
  matematika: 'MTK',
  'bahasa indonesia': 'BIND',
  'bahasa inggris': 'BING',
  fisika: 'FIS',
  kimia: 'KIM',
  biologi: 'BIO',
  geografi: 'GEO',
  sosiologi: 'SOS',
  ekonomi: 'EKO',
  'tps/penalaran umum': 'TPU',
  'tps/pengetahuan kuantitatif': 'TKU',
  literasi: 'LIT',
};

/** Token mapel 3-4 huruf; fallback tiga huruf pertama tanpa spasi. */
export function tokenMapel(mapel = '') {
  const m = String(mapel || '').trim().toLowerCase();
  if (TOKEN_MAPEL[m]) return TOKEN_MAPEL[m];
  const bersih = m.replace(/[^a-z]/g, '');
  return (bersih.slice(0, 4) || 'UMUM').toUpperCase();
}

/** Tanggal kunci paket 'YYYYMMDD' dari kodePaket (GM-..-20261017-..) atau createdAt. */
export function tanggalKeyPaket(paket = {}) {
  const kode = String(paket.kodePaket || '');
  const m = kode.match(/(\d{8})/);
  if (m) return m[1];
  const d = typeof paket.createdAt?.toDate === 'function' ? paket.createdAt.toDate() : new Date(paket.createdAt || paket.waktuBuka || 0);
  if (!Number.isNaN(d.getTime()) && d.getFullYear() > 2000) {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }
  return '00000000';
}

/**
 * Kode pendek satu soal untuk ditulis siswa di buku tulis.
 * @param {object} args { mapel, paket, nomor }
 * @returns {string} mis. "MTK-1017-07"
 */
export function kodeSoalSiswa({ mapel = '', paket = {}, nomor = 0 } = {}) {
  const key = tanggalKeyPaket(paket);
  const mmdd = key === '00000000' ? '0000' : key.slice(4);
  return `${tokenMapel(mapel)}-${mmdd}-${String(Number(nomor) || 0).padStart(2, '0')}`;
}

/** Cocokkan kueri pencarian siswa terhadap kode/nomor (toleran spasi/huruf kecil). */
export function cocokCariKode(kode = '', kueri = '') {
  const k = String(kode).toLowerCase().replace(/[\s-]+/g, '');
  const q = String(kueri || '').toLowerCase().replace(/[\s-]+/g, '');
  if (!q) return true;
  return k.includes(q);
}

export default { tokenMapel, tanggalKeyPaket, kodeSoalSiswa, cocokCariKode };
