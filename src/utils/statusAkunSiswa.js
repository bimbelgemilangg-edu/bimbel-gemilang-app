// src/utils/statusAkunSiswa.js
// Status akun siswa untuk gerbang akses fitur belajar.
// Sumber kebenaran: dokumen Firestore collection "students"
//   - isBlocked: true  → admin blokir (biasanya karena pembayaran)
//   - status: "Aktif" | "Nonaktif" | dll (opsional, jika ada)
//
// Fitur yang HARUS diblokir saat tidak aktif:
//   buku digital, try out, latihan harian, leaderboard (nama tidak muncul),
//   e-learning/kuis yang menambah XP.
// Fitur yang TETAP boleh:
//   dashboard ringkas, keuangan/administrasi, hubungi admin.

import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function isAkunBelajarAktif(student) {
  if (!student) return false;
  if (student.isBlocked === true) return false;
  const st = String(student.status || '').trim().toLowerCase();
  if (st === 'nonaktif' || st === 'blokir' || st === 'blocked' || st === 'suspend') return false;
  return true;
}

export function pesanBlokir(student) {
  if (student?.isBlocked) {
    return {
      judul: 'Akses Belajar Ditangguhkan',
      isi: 'Akunmu sementara tidak bisa memakai Buku Digital, Try Out, Latihan Harian, dan Papan Peringkat karena administrasi/pembayaran belum aktif. Setelah pembayaran dinyatakan aktif oleh admin, XP dan ranking akan berjalan normal.',
      alasan: 'pembayaran / administrasi',
    };
  }
  return {
    judul: 'Akun Belum Aktif',
    isi: 'Status akunmu belum aktif. Fitur belajar (buku, try out, latihan, leaderboard) terkunci sampai admin mengaktifkan akun.',
    alasan: 'status akun',
  };
}

/** Ambil dokumen siswa dari localStorage studentId / studentNim */
export async function muatStatusSiswa() {
  const studentId =
    localStorage.getItem('studentId') ||
    localStorage.getItem('studentNim') ||
    '';
  if (!studentId) return { studentId: '', student: null, aktif: false };

  // Coba doc id langsung
  try {
    const langsung = await getDoc(doc(db, 'students', studentId));
    if (langsung.exists()) {
      const student = { id: langsung.id, ...langsung.data() };
      return { studentId, student, aktif: isAkunBelajarAktif(student) };
    }
  } catch (_) { /* lanjut query */ }

  // Query field studentId
  try {
    const snap = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
    if (!snap.empty) {
      const d = snap.docs[0];
      const student = { id: d.id, ...d.data() };
      return { studentId, student, aktif: isAkunBelajarAktif(student) };
    }
  } catch (_) { /* ignore */ }

  // Query field nim
  try {
    const snap = await getDocs(query(collection(db, 'students'), where('nim', '==', studentId)));
    if (!snap.empty) {
      const d = snap.docs[0];
      const student = { id: d.id, ...d.data() };
      return { studentId, student, aktif: isAkunBelajarAktif(student) };
    }
  } catch (_) { /* ignore */ }

  return { studentId, student: null, aktif: false };
}

/** Filter daftar siswa untuk leaderboard: buang yang isBlocked */
export function filterSiswaLeaderboard(daftarSiswa) {
  return (daftarSiswa || []).filter((s) => isAkunBelajarAktif(s));
}

export default {
  isAkunBelajarAktif,
  pesanBlokir,
  muatStatusSiswa,
  filterSiswaLeaderboard,
};