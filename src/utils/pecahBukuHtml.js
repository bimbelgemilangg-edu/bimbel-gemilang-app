// src/utils/pecahBukuHtml.js
// ============================================================
// Util MURNI untuk fitur IMPOR BUKU HTML (owner 14 Okt 2026):
// buku Gemilang dikonversi owner jadi HTML (pdf2html: satu <img> per
// halaman, tanpa lapisan teks). Util ini membongkar berkas itu tanpa
// browser: inventaris, urutan gambar halaman, dan pengelompokan
// halaman per panggilan AI (endpoint membatasi 14, kita pakai 10
// sesuai desain hemat kuota konversiModulScan: 1 bab = 1 panggilan).
// ============================================================

/** Ambang ukuran dokumen Firestore (1MB) — HTML buku tidak disimpan utuh. */
export const BATAS_UKURAN_FIRESTORE = 900_000;
/** Batas halaman per panggilan AI (endpoint menolak >14; desain 10). */
export const BATAS_HALAMAN_PER_PANGGILAN = 10;

/**
 * Ambil semua gambar halaman (data-URI) sesuai urutan dokumen.
 * pdf2html menulis `<img class="im" src="data:image/...;base64,...">`.
 * @param {string} html
 * @returns {string[]} data-URI urut
 */
export function ekstrakGambarHalamanDariHtml(html = '') {
  const out = [];
  const re = /<img[^>]*\ssrc="(data:image\/[a-zA-Z0-9.+-]+;base64,[^"]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

/** Buang prefix data-URI -> base64 polos (format body endpoint). */
export function dataUriKeBase64(dataUri = '') {
  return String(dataUri).replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
}

/** Deteksi apakah HTML punya lapisan teks (bukan murni gambar halaman). */
export function adaTeksLayer(html = '') {
  if (/<span[^>]*class="[^"]*\bt[^"]*"[^>]*>[^<]{2,}<\/span>/.test(html)) return true;
  const tanpaTag = String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return tanpaTag.length > 2000;
}

/**
 * Inventaris berkas buku HTML: cukup info untuk keputusan operator
 * (layak disimpan utuh? perlu pecah bab? murni gambar?).
 */
export function inventarisBukuHtml(html = '') {
  const gambar = ekstrakGambarHalamanDariHtml(html);
  const ukuranByte = typeof TextEncoder !== 'undefined'
    ? new TextEncoder().encode(String(html)).length
    : String(html).length;
  const teks = adaTeksLayer(html);
  return {
    jumlahGambarHalaman: gambar.length,
    adaTeksLayer: teks,
    ukuranByte,
    layakSimpanUtuhDiFirestore: ukuranByte <= BATAS_UKURAN_FIRESTORE,
    saran: gambar.length === 0 && !teks
      ? 'Berkas tidak punya gambar halaman maupun teks — bukan buku HTML yang didukung.'
      : ukuranByte > BATAS_UKURAN_FIRESTORE
        ? 'Terlalu besar untuk satu dokumen Firestore: JANGAN simpan utuh; ekstrak per bab lewat fitur Impor Buku HTML.'
        : 'OK',
  };
}

/**
 * Kelompokkan data-URI halaman jadi batch <= BATAS_HALAMAN_PER_PANGGILAN.
 * @returns {Array<{urutan:number, halamanMulai:number, halamanSelesai:number, images:string[]}>}
 */
export function kelompokkanHalamanUntukAi(dataUris = [], batas = BATAS_HALAMAN_PER_PANGGILAN) {
  const arr = Array.isArray(dataUris) ? dataUris : [];
  const n = Math.max(1, Math.min(Number(batas) || 10, 14));
  const out = [];
  for (let i = 0; i < arr.length; i += n) {
    const slice = arr.slice(i, i + n);
    out.push({
      urutan: out.length + 1,
      halamanMulai: i + 1,
      halamanSelesai: i + slice.length,
      images: slice.map(dataUriKeBase64),
    });
  }
  return out;
}

export default {
  ekstrakGambarHalamanDariHtml,
  dataUriKeBase64,
  adaTeksLayer,
  inventarisBukuHtml,
  kelompokkanHalamanUntukAi,
  BATAS_UKURAN_FIRESTORE,
  BATAS_HALAMAN_PER_PANGGILAN,
};

/**
 * Petakan satu soal ujiPemahaman (skema konversiModulScan) jadi butir
 * bank_soal. HANYA tipe pg yang dipetakan otomatis (paling umum & aman);
 * multi/bs dikembalikan null supaya operator memasukkan manual lewat
 * editor bank soal (jujur, tidak menebak skema kunci kompleks).
 * createdAt/createdBy diisi halaman (butuh serverTimestamp).
 */
export function butirBankDariUjiPemahaman(item, identitas = {}, halamanSumber = null) {
  if (!item || item.tipe !== 'pg') return null;
  if (!Array.isArray(item.pilihan) || item.pilihan.length < 2) return null;
  const idx = Number(item.benar);
  if (!Number.isInteger(idx) || idx < 0 || idx >= item.pilihan.length) return null;
  const teks = String(item.soal || '').trim();
  if (!teks) return null;
  return {
    tipe: 'pg_sederhana',
    soal: teks,
    opsiJawaban: item.pilihan.map((x) => String(x)),
    kunciJawaban: String.fromCharCode(65 + idx),
    kunciTerverifikasi: false,
    pembahasan: String(item.pembahasan || ''),
    gambarUrls: [],
    mataPelajaran: identitas.mapel || '',
    materi: identitas.materi || '',
    tingkatKelas: identitas.kelas || '',
    jenjang: identitas.jenjang || 'SMA/MA',
    kategori: 'Buku',
    tags: ['buku', identitas.materi || ''].filter(Boolean),
    tingkatKesulitan: item.level || 'sedang',
    sumberFile: identitas.sumber || '',
    sumberHalaman: halamanSumber,
    status: 'aktif',
  };
}
