// src/utils/jalurStorage.js
// ============================================================
// KONVENSI JALUR (folder) Supabase Storage bucket `materi-bimbel`.
//
// KENAPA ADA (pertanyaan owner 2026-10-06: "simpannya di supabase kan?
// gimana uploadnya, dimana guru akses materinya, enak bentuk folder ya?"):
// skema lama menumpuk SEMUA gambar materi semua mapel/bab di satu folder
// `gambar/` bernama `timestamp_nama` (lihat uploadService.js:141-149).
// Konteks "ini gambar bab 1 matematika" hanya hidup di Firestore. Saat
// Fase 1 & 4 skema buku-kliping menambah ribuan aset (potongan gambar per
// bab, foto buku progres per siswa per pertemuan), folder datar itu tidak
// tertelusuri dan tidak bisa dibersihkan.
//
// ATURAN MAIN:
//   1. Folder = kemudahan MANUSIA & lifecycle (sapu berkas yatim, cari
//      per bab). SUMBER KEBENARAN metadata tetap dokumen Firestore yang
//      menyimpan jalur lengkapnya di field `jalurStorage`.
//   2. Konvensi ini berlaku untuk UPLOAD BARU. URL lama TIDAK dipindah --
//      memindahkan objek akan memutus setiap dokumen yang menyimpan URL
//      lamanya. Migrasi (kalau kelak diinginkan) adalah proyek tersendiri
//      dengan tabel pemetaan.
//   3. Slug selalu huruf kecil tanpa spasi, sehingga jalur aman dijadikan
//      prefix query Supabase (`list(path)`) dan tahan dibaca manusia.
// ============================================================

/** slug aman untuk folder: huruf kecil, angka, tanda hubung. */
export function slugify(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')  // buang aksen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'tanpa-nama';
}

const bersih = (s) => String(s ?? '').replace(/[^\w.-]+/g, '_').slice(0, 60);

/**
 * Jalur aset materi/buku per bab.
 * contoh: materi/matematika/kelas-8/bab-01/gambar/1728..._diagram.png
 */
export function jalurMateri({ mapel, kelas, bab, jenis = 'gambar', nama = 'aset', ts = Date.now() } = {}) {
  return ['materi', slugify(mapel), slugify(kelas), slugify(bab), slugify(jenis), `${ts}_${bersih(nama)}`]
    .filter(Boolean)
    .join('/');
}

/** Jalur gambar butir soal bank: bank-soal/<mapel>/<bab>/... */
export function jalurBankSoal({ mapel, bab, nama = 'gambar', ts = Date.now() } = {}) {
  return ['bank-soal', slugify(mapel), slugify(bab), `${ts}_${bersih(nama)}`].filter(Boolean).join('/');
}

/** Jalur foto halaman buku progres (Fase 4): per siswa per pertemuan. */
export function jalurBukuProgres({ studentId, pertemuan, nama = 'halaman', ts = Date.now() } = {}) {
  return ['buku-progres', bersih(studentId), slugify(pertemuan), `${ts}_${bersih(nama)}.jpg`].filter(Boolean).join('/');
}

/** Jalur foto pengawasan try out: per paket per sesi, supaya mudah diaudit. */
export function jalurPengawasan({ paketId, sesiId, ts = Date.now() } = {}) {
  return ['tryout-pengawasan', bersih(paketId), bersih(sesiId), `${ts}.jpg`].filter(Boolean).join('/');
}

/**
 * Baca kembali struktur sebuah jalur (untuk perkakas pembersihan kelak).
 * @returns {{bucketPrefix: string, segmen: string[]}}
 */
export function parseJalur(jalur = '') {
  const segmen = String(jalur).split('/').filter(Boolean);
  return { bucketPrefix: segmen[0] || '', segmen };
}

/** Semua prefix tingkat-1 yang diakui konvensi ini. */
export const PREFIX_DIKENAL = new Set([
  'materi', 'bank-soal', 'buku-progres', 'tryout-pengawasan',
  'tugas', 'foto-siswa', 'cv-pelamar-tentor', 'foto-pelamar-tentor',
  // prefix warisan skema datar -- tetap diakui supaya perkakas pembersih
  // tidak menganggap berkas lama sebagai sampah:
  'gambar', 'pdf', 'dokumen',
]);

export default {
  slugify,
  jalurMateri,
  jalurBankSoal,
  jalurBukuProgres,
  jalurPengawasan,
  parseJalur,
  PREFIX_DIKENAL,
};
