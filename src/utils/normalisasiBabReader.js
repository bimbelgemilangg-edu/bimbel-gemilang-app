// src/utils/normalisasiBabReader.js
// ============================================================
// KONTRAK BACA BAB DIGITAL (pembedahan 15 Okt 2026, docs/BEDAH-ALUR-
// IMPOR-KE-PAKAI.md): reader siswa (BukuBacaPage.renderBlok & quiz)
// hanya mengenal:
//   • block  : { tipe: 'p'|'list'|'math'|'contoh'|'tips'|'gambar'|widget, ... }
//   • seksi  : wajib punya `id` (navigasi antar-seksi & progres baca)
//   • soal   : wajib punya `id` (kunci jawaban quiz), tipe 'pg' memakai
//              `pilihan` + `benar` (indeks), gambar tunggal `gambar.src`
// Produsen lama yang diaudit melanggar kontrak:
//   • parseTeksBuku menulis block sebagai `jenis` (reader merender null
//     => bab kosong di sisi siswa);
//   • impor tidak menulis id seksi/soal => navigasi & jawaban quiz bocor
//     antar-soal (kunci jawaban[undefined]);
//   • figur soal disimpan hanya sebagai `gambarUrls` (kontrak bank soal),
//     padahal reader membaca `gambar` tunggal.
// Util ini adalah JARING PENGAMAN saat SIMPAN: bab dari sumber mana pun
// (teks OCR, vision AI, modul) dinormalkan dulu sebelum masuk Firestore.
// ============================================================

/** Tipe block yang dikenal reader (dokumen kontrak; alias jenis->tipe). */
export const TIPE_BLOK_READER = ['p', 'list', 'math', 'contoh', 'tips', 'gambar'];

/**
 * Normalkan satu bab payload ke kontrak reader. Murni & teruji:
 * tidak membuang field apa pun (bank soal & editor tetap utuh).
 * @param {object} bab {judul, sections, ujiPemahaman, ...}
 * @param {string} prefiksId penstabil id antar-simpan (mis. slug judul)
 */
export function normalkanBabUntukReader(bab = {}, prefiksId = '') {
  const slug = String(prefiksId || '').replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'bab';
  const sections = (Array.isArray(bab.sections) ? bab.sections : []).map((sek, si) => ({
    ...sek,
    id: sek?.id || `${slug}-s${si + 1}`,
    blocks: (Array.isArray(sek?.blocks) ? sek.blocks : []).map((bl) => (
      bl && !bl.tipe && bl.jenis ? { ...bl, tipe: bl.jenis } : bl
    )),
  }));
  const ujiPemahaman = (Array.isArray(bab.ujiPemahaman) ? bab.ujiPemahaman : []).map((q, qi) => {
    const gambar = q?.gambar || (Array.isArray(q?.gambarUrls) && q.gambarUrls[0]
      ? { src: q.gambarUrls[0], alt: 'gambar soal', caption: '' }
      : undefined);
    return { ...q, id: q?.id || `${slug}-q${qi + 1}`, ...(gambar ? { gambar } : {}) };
  });
  return { ...bab, sections, ujiPemahaman };
}

export default { normalkanBabUntukReader, TIPE_BLOK_READER };
