// src/utils/pdfBukuDigital.js
// ============================================================
// PENYUSUN BARIS PDF BUKU DIGITAL (pembedahan 15 Okt 2026): owner
// meminta isi buku draf bisa DIBACA admin & DIUNDUH sebagai PDF —
// sebelumnya reader terkunci login siswa dan ekspor PDF buku tidak ada
// (yang ada hanya cetak paket soal guru).
//
// Util ini MURNI: bab (kontrak reader: sections[].blocks tipe
// p/list/math/contoh/tips/gambar + ujiPemahaman pg) disusun jadi daftar
// baris {tipe, teks?, src?} yang siap dicetak jsPDF oleh halaman
// PratinjauBukuAdmin — sehingga urutan & isi PDF bisa dipaku uji tanpa
// browser.
// ============================================================

const HURUF = ['A', 'B', 'C', 'D', 'E'];

/**
 * @param {object} bab {judul, sections:[{judul,blocks}], ujiPemahaman:[{soal,pilihan,gambar}]}
 * @returns {Array<{tipe:'h1'|'h2'|'p'|'contoh'|'tips'|'gambar'|'soal'|'opsi'|'kunci', teks?:string, src?:string}>}
 */
export function susunBarisPdfBab(bab = {}) {
  const baris = [{ tipe: 'h1', teks: String(bab.judul || 'Bab tanpa judul') }];
  for (const sek of Array.isArray(bab.sections) ? bab.sections : []) {
    if (sek?.judul) baris.push({ tipe: 'h2', teks: String(sek.judul) });
    for (const bl of Array.isArray(sek?.blocks) ? sek.blocks : []) {
      if (!bl) continue;
      if (bl.tipe === 'galeri' && Array.isArray(bl.items)) {
        for (const it of bl.items) baris.push({ tipe: 'gambar', src: it.src, teks: it.caption || '' });
        continue;
      }
      if (bl.tipe === 'gambar' && bl.src) baris.push({ tipe: 'gambar', src: bl.src, teks: bl.caption || bl.alt || '' });
      else if (bl.tipe === 'contoh' && bl.teks) baris.push({ tipe: 'contoh', teks: bl.teks });
      else if (bl.tipe === 'tips' && bl.teks) baris.push({ tipe: 'tips', teks: bl.teks });
      else if (bl.tipe === 'list' && Array.isArray(bl.items)) bl.items.forEach((it) => baris.push({ tipe: 'p', teks: `• ${it}` }));
      else if (bl.teks) baris.push({ tipe: 'p', teks: bl.teks });
    }
  }
  const soalList = Array.isArray(bab.ujiPemahaman) ? bab.ujiPemahaman : [];
  if (soalList.length) {
    baris.push({ tipe: 'h2', teks: 'Uji Pemahaman' });
    const kunci = [];
    soalList.forEach((q, i) => {
      baris.push({ tipe: 'soal', teks: `${i + 1}. ${q?.soal || ''}` });
      if (q?.gambar?.src) baris.push({ tipe: 'gambar', src: q.gambar.src, teks: q.gambar.caption || '' });
      (Array.isArray(q?.pilihan) ? q.pilihan : []).forEach((p, pi) => {
        baris.push({ tipe: 'opsi', teks: `${HURUF[pi] || pi + 1}. ${p}` });
      });
      const idx = Number(q?.benar);
      kunci.push(`${i + 1}-${Number.isInteger(idx) ? HURUF[idx] || '?' : '?'}`);
    });
    baris.push({ tipe: 'kunci', teks: `Kunci: ${kunci.join(', ')}` });
  }
  return baris;
}

/** Nama berkas PDF aman: slug judul + bab. */
export function namaFilePdfBuku(judulBuku = '', judulBab = '') {
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'buku';
  return `${slug(judulBuku)}--${slug(judulBab)}.pdf`;
}

export default { susunBarisPdfBab, namaFilePdfBuku };
