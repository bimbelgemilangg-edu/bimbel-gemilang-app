// src/utils/notifications.js
// ============================================================
// 🔥 UTILITY NOTIFIKASI — dipakai bersama oleh semua fitur yang perlu
// ngasih tau siswa/guru ("materi baru", "kuis baru", "survei baru",
// "tagihan baru", "hasil kuis keluar", dll).
//
// Kenapa 1 dokumen PER PENERIMA (bukan 1 dokumen broadcast dibaca semua
// orang): supaya tiap siswa bisa tandai "sudah dibaca" atau menghapus
// notifikasinya sendiri tanpa mempengaruhi siswa lain.
// ============================================================
import { db } from '../firebase';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';

/**
 * Kirim notifikasi ke siswa.
 * @param {object} opts
 * @param {string} [opts.targetKelas] - 'Semua' atau nama kelas spesifik
 * @param {string} [opts.targetKategori] - 'Semua', 'Reguler', atau 'English'
 * @param {string[]} [opts.specificStudentIds] - kalau diisi, HANYA siswa ini yang dikirimi (mengabaikan targetKelas/targetKategori)
 * @param {string} opts.type - materi | kuis | tugas | survei | tagihan | hasil_kuis | pengumuman
 * @param {string} opts.title
 * @param {string} opts.message
 * @param {string} [opts.link] - route in-app, misal /siswa/modul/xxx
 * @param {string} [opts.fileUrl] - lampiran (opsional)
 * @param {string} [opts.fileName]
 */
export async function notifyStudents({
  targetKelas = 'Semua',
  targetKategori = 'Semua',
  specificStudentIds = [],
  type,
  title,
  message,
  link = '',
  fileUrl = '',
  fileName = '',
}) {
  try {
    let recipientIds = [];

    if (specificStudentIds.length > 0) {
      recipientIds = specificStudentIds;
    } else {
      const snap = await getDocs(collection(db, 'students'));
      recipientIds = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        // 🔥 FIX BUG: sebelumnya di sini CUMA dicek targetKelas — field
        // program/kategori (Reguler vs English Course) TIDAK PERNAH dicek
        // sama sekali. Akibatnya kalau guru targetin "English Course" doang,
        // semua siswa di kelas itu (termasuk yang Reguler) tetap kebagian
        // notifikasi. Sekarang dua-duanya harus cocok.
        .filter(s =>
          (targetKelas === 'Semua' || s.kelasSekolah === targetKelas) &&
          (targetKategori === 'Semua' || s.kategori === targetKategori)
        )
        .map(s => s.studentId || s.id);
    }

    // Dedup, jaga-jaga ada ID yang kebawa dobel
    recipientIds = [...new Set(recipientIds.filter(Boolean))];

    await Promise.all(recipientIds.map(rid => addDoc(collection(db, 'notifications'), {
      recipientId: rid,
      recipientType: 'siswa',
      type, title, message, link, fileUrl, fileName,
      isRead: false,
      createdAt: serverTimestamp(),
    })));
  } catch (e) {
    // Notifikasi gagal terkirim TIDAK BOLEH menggagalkan aksi utama (publish
    // modul/kuis/survei tetap harus sukses walau notifikasinya gagal).
    console.error('Gagal kirim notifikasi ke siswa:', e);
  }
}

/**
 * Kirim notifikasi ke guru/tentor.
 */
export async function notifyTeachers({
  specificGuruIds = [],
  type,
  title,
  message,
  link = '',
  fileUrl = '',
  fileName = '',
}) {
  try {
    let recipientIds = specificGuruIds.filter(Boolean);
    if (recipientIds.length === 0) {
      const snap = await getDocs(collection(db, 'teachers'));
      recipientIds = snap.docs.map(d => d.data().guruId || d.id).filter(Boolean);
    }
    recipientIds = [...new Set(recipientIds)];

    await Promise.all(recipientIds.map(rid => addDoc(collection(db, 'notifications'), {
      recipientId: rid,
      recipientType: 'guru',
      type, title, message, link, fileUrl, fileName,
      isRead: false,
      createdAt: serverTimestamp(),
    })));
  } catch (e) {
    console.error('Gagal kirim notifikasi ke guru:', e);
  }
}

/**
 * Kirim ke SATU siswa tertentu saja (dipakai misal saat guru kirim hasil
 * kuis perorangan).
 */
export async function notifyOneStudent(studentId, { type, title, message, link = '', fileUrl = '', fileName = '' }) {
  return notifyStudents({ specificStudentIds: [studentId], type, title, message, link, fileUrl, fileName });
}