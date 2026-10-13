// src/utils/kodePaket.js
// ============================================================
// KODE PAKET — pegangan manusia untuk LEDGER try out.
//
// KENAPA ADA (arahan owner 2026-10-12): "setiap paket yang telah
// dikeluarkan harus ada record-nya ... contoh kode paket UTBK, kode paket
// gemilang ... tinggal searching pakai try out pada tanggal hari itu ...
// downloadkan berupa PDF rapi ada logo gemilang ... semua track record-nya
// jelas". Id dokumen Firestore tidak bisa disebut siswa di WA ("mbak,
// paket yang 7f3a..."), jadi setiap paket mendapat kode terbaca:
//
//     GM-<JENJANG>-<JENIS>-<YYYYMMDD>-<HHMM>      mis. GM-SMA-TKA-20261017-0800
//
// Unik per menit (dua draf tidak lahir pada menit yang sama dari mesin
// yang sama) dan cukup pendek untuk diketik ulang. Keunikan keras tetap
// dijamin id dokumen; kode hanyalah pegangan manusia & kunci pencarian.
//
// Paket LAMA (terbit sebelum ledger ada) tidak ditulis ulang (tidak ada
// write backfill ke produksi tanpa persetujuan owner): mereka mendapat
// kode TAMPILAN turunan yang stabil dari jenjang+jenis+createdAt+id,
// berprefix GM-ARSIP- supaya jelas bukan kode tercetak asli.
//
// MURNI & TERUJI (tests/kodePaket.test.mjs).
// ============================================================

const TOKEN_JENJANG = [
  ['SD/MI', 'SD'], ['SMP/MTs', 'SMP'], ['SMA/MA', 'SMA'], ['SMK', 'SMK'], ['UTBK/SNBT', 'UTBK'],
];
const TOKEN_JENIS = {
  TKA: 'TKA', 'SNBT/UTBK': 'UTBK', UTBK: 'UTBK', Reguler: 'REG', Lainnya: 'LAIN',
};

function tokenJenjang(j) {
  const s = String(j || '').trim();
  const hit = TOKEN_JENJANG.find(([k]) => s.toUpperCase().startsWith(k.toUpperCase().split('/')[0]));
  return hit ? hit[1] : (s ? s.toUpperCase().slice(0, 3) : 'UMU');
}

function tokenJenis(u) {
  const s = String(u || '').trim();
  return TOKEN_JENIS[s] || (s ? s.toUpperCase().slice(0, 4) : 'UMUM');
}

const dua = (n) => String(n).padStart(2, '0');

/**
 * @param {object} args { jenjang, jenisUjian, tanggal }
 * @returns {string} kode seperti GM-SMA-TKA-20261017-0800
 */
export function buatKodePaket({ jenjang = '', jenisUjian = '', tanggal = null } = {}) {
  const d = tanggal instanceof Date ? tanggal : new Date(tanggal || Date.now());
  const ymd = `${d.getFullYear()}${dua(d.getMonth() + 1)}${dua(d.getDate())}`;
  const hm = `${dua(d.getHours())}${dua(d.getMinutes())}`;
  return `GM-${tokenJenjang(jenjang)}-${tokenJenis(jenisUjian)}-${ymd}-${hm}`;
}

function tanggalDari(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Kode untuk DITAMPILKAN: kode asli bila ada, else kode arsip turunan.
 * @param {object} paket dokumen tryout_paket
 * @returns {string}
 */
export function kodePaketTampil(paket = {}) {
  if (String(paket.kodePaket || '').trim()) return String(paket.kodePaket).trim();
  const d = tanggalDari(paket.createdAt ?? paket.waktuBuka);
  const id = String(paket.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase() || '0000';
  if (!d) return `GM-ARSIP-${tokenJenjang(paket.jenjangTemplate || paket.jenjang)}-${id}`;
  const ymd = `${d.getFullYear()}${dua(d.getMonth() + 1)}${dua(d.getDate())}`;
  return `GM-ARSIP-${tokenJenjang(paket.jenjangTemplate || paket.jenjang)}-${tokenJenis(paket.jenisUjian)}-${ymd}-${id}`;
}

/**
 * Urai kode menjadi bagian-bagiannya untuk pencarian admin.
 * @returns {{jenjang:string, jenis:string, ymd:string, suffix:string}|null}
 */
export function parseKodePaket(kode) {
  const m = /^GM-(ARSIP-)?([A-Z]{2,4})-([A-Z]{2,4})-(\d{8})-(\w{2,4})$/i.exec(String(kode || '').trim());
  if (!m) return null;
  return { arsip: Boolean(m[1]), jenjang: m[2].toUpperCase(), jenis: m[3].toUpperCase(), ymd: m[4], suffix: m[5] };
}

/** True bila kode/dokumen cocok dengan kueri pencarian (kode, ymd, atau jenjang). */
export function cocokPencarianPaket(paket = {}, kueri = '') {
  const q = String(kueri || '').trim().toLowerCase();
  if (!q) return true;
  const kode = kodePaketTampil(paket).toLowerCase();
  if (kode.includes(q)) return true;
  const urai = parseKodePaket(kode);
  if (urai && q.replace(/-/g, '').length === 8 && urai.ymd === q.replace(/-/g, '')) return true;
  return String(paket.judul || '').toLowerCase().includes(q);
}

export default { buatKodePaket, kodePaketTampil, parseKodePaket, cocokPencarianPaket };
