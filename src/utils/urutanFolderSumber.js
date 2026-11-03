// src/utils/urutanFolderSumber.js
// ============================================================
// Urutan tampilan FOLDER SUMBER (koleksi `sumber_soal`) di halaman
// penerbitan (Terbitkan Try Out & Terbitkan Kuis).
//
// 🔥 BARU (2026-11-03, permintaan owner saat mau menerbitkan tryout TKA
// besok pagi): daftar folder dulu ditampilkan sesuai urutan dokumen
// Firestore (praktis acak menurut id), jadi folder yang BARU saja diimpor
// bisa terlempar ke bawah layar dan admin ragu menerbitkan soal yang
// benar. Aturan baru: YANG TERBARU MASUK SELALU PALING ATAS (createdAt
// menurun), seri diurutkan judul supaya stabil antar-render.
// ============================================================

/**
 * Ambil waktu buat folder dalam detik epoch, toleran terhadap bentuk
 * penyimpanan: Timestamp Firestore (objek {seconds} atau instance kelas
 * dengan toDate), angka milidetik/detik, atau kosong (folder lama).
 * @param {object} folder
 * @returns {number} detik epoch; 0 bila tak terbaca
 */
export function waktuFolder(folder) {
  const c = folder?.createdAt;
  if (!c) return 0;
  if (typeof c === 'number') return c > 1e12 ? Math.floor(c / 1000) : c;
  if (typeof c?.seconds === 'number') return c.seconds;
  if (typeof c?.toDate === 'function') {
    const t = c.toDate().getTime();
    return Number.isFinite(t) ? Math.floor(t / 1000) : 0;
  }
  return 0;
}

/**
 * Salinan terurut: folder terbaru (createdAt terbesar) lebih dulu.
 * Folder tanpa createdAt (data lama) jatuh ke bawah, di antara mereka
 * diurutkan judul agar urutan tidak berubah-ubah tiap render.
 * @param {Array<object>} daftar
 * @returns {Array<object>}
 */
export function urutkanFolderTerbaruDulu(daftar) {
  const arr = Array.isArray(daftar) ? daftar : [];
  return [...arr].sort((a, b) => {
    const selisih = waktuFolder(b) - waktuFolder(a);
    if (selisih !== 0) return selisih;
    const ja = String(a?.judul || a?.nama || '');
    const jb = String(b?.judul || b?.nama || '');
    return ja.localeCompare(jb);
  });
}

export default { waktuFolder, urutkanFolderTerbaruDulu };
