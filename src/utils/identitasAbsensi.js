// src/utils/identitasAbsensi.js
// ============================================================
// SATU SUMBER untuk "dengan identitas apa absensi seorang siswa dicari".
//
// KENAPA BERKAS INI ADA (keluhan owner 2026-10-05: "admin udah ganti
// status absensi, di siswa tetap"):
// koleksi `attendance` punya TIGA penulis dengan field identitas yang
// TIDAK SERAGAM --
//   1. AdminAttendanceManage.jsx : studentId (= kode studentId ATAU docId)
//                                  + namaSiswa
//   2. admin/StudentAttendance   : studentId (= student?.studentId || id)
//                                  + namaSiswa
//   3. teacher/TeacherAttendance : studentId (= DOCID!) + studentName
//                                  (nama field BERBEDA)
// Sementara halaman siswa menebak dengan tiga query terpisah yang
// ditulis inline, termasuk dua query berbasis NAMA dari localStorage --
// jadi setelah nama dibenarkan admin, catatan lama tak lagi cocok.
//
// Berkas ini mengubah tebakan inline itu menjadi daftar yang eksplisit,
// lengkap, dan TERUJI: semua kemungkinan field+nilai dicoba, nilai kosong
// dibuang, dan duplikat dihilangkan. Menambah identitas baru kelak berarti
// menambah satu baris di sini, bukan menyalin query lagi ke tempat lain.
// ============================================================

/**
 * @param {{studentId?: string, docId?: string, nama?: string}} profil
 * @returns {Array<{field: string, nilai: string}>} pasangan field-nilai
 *   untuk query `where(field, '==', nilai)`, sudah dibuang yang kosong
 *   dan didedup.
 */
export function daftarQueryAbsensi(profil = {}) {
  const kandidat = [
    // Identitas stabil dulu: kode studentId yang siswa pakai login.
    { field: 'studentId', nilai: profil.studentId },
    // docId Firestore: TeacherAttendance menulis studentId = docId, dan
    // admin menulis studentId = studentId||id. Dua baris pertama ini
    // mencakup keduanya tanpa perlu menelek mana yang dipakai penulisnya.
    { field: 'studentId', nilai: profil.docId },
    // Nama: dua dialek field yang dipakai para penulis. Dicari memakai
    // nama SEGAR (bukan salinan login) supaya setelah admin membenarkan
    // nama, catatan baru tetap ketemu; catatan lama tetap ketemu lewat
    // identitas stabil di atas.
    { field: 'namaSiswa', nilai: profil.nama },
    { field: 'studentName', nilai: profil.nama },
  ];

  const terlihat = new Set();
  const hasil = [];
  for (const k of kandidat) {
    const nilai = String(k.nilai ?? '').trim();
    if (!nilai) continue; // query '==' '' hanya membuang kuota baca
    const kunci = `${k.field}::${nilai}`;
    if (terlihat.has(kunci)) continue;
    terlihat.add(kunci);
    hasil.push({ field: k.field, nilai });
  }
  return hasil;
}

/**
 * Gabungkan beberapa hasil query menjadi satu daftar tanpa duplikat
 * dokumen. Dipakai halaman siswa karena identitas yang tumpang tindih
 * (kode + docId + nama) bisa mengembalikan dokumen yang sama dua kali,
 * dan duplikat itu akan menggandakan statistik Hadir/Izin/Sakit/Alpha.
 *
 * @param {Array<Array<{id: string}>>} kumpulanSnapDocs array dari
 *   `.docs` milik tiap query (boleh kosong / undefined)
 * @returns {Array<object>} dokumen unik, urutan kemunculan pertama
 */
export function gabungkanDokUnik(kumpulanSnapDocs = []) {
  const peta = new Map();
  for (const docs of kumpulanSnapDocs) {
    if (!Array.isArray(docs)) continue;
    for (const d of docs) {
      if (!d || !d.id || peta.has(d.id)) continue;
      peta.set(d.id, { id: d.id, ...(typeof d.data === 'function' ? d.data() : d) });
    }
  }
  return Array.from(peta.values());
}

export default { daftarQueryAbsensi, gabungkanDokUnik };
