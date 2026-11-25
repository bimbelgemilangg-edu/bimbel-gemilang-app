// src/utils/statusAkunSiswa.js
// Status akun siswa untuk gerbang akses menyeluruh & penyaringan daftar nama.
// Sumber kebenaran: dokumen Firestore collection "students"
//   - isBlocked: true/'true' → admin/sistem memblokir (biasanya pembayaran/tunggakan)
//   - status: "Nonaktif" | "Blokir" | "Expired" | dll
//   - tanggalSelesai: YYYY-MM-DD → masa aktif paket berakhir (hari tsb masih aktif; besoknya habis)
//   - trialExpiresAt: ISO string → batas masa Trial Class 3 hari
//
// Bila tidak aktif / diblokir / masa paket habis:
//   - Siswa TIDAK BISA mengakses fitur apapun di portal siswa.
//   - Namanya TIDAK MUNCUL di roster guru, absensi guru, leaderboard, ranking, atau daftar tryout/kuis.

import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_TERBLOKIR = new Set([
  'nonaktif',
  'tidak aktif',
  'blokir',
  'diblokir',
  'blocked',
  'suspend',
  'suspended',
  'expired',
  'habis',
  'tamat',
  'berakhir',
  'keluar',
  'cuti',
]);

function parseTanggalMs(val) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (val instanceof Date) return val.getTime();
  const str = String(val).trim();
  if (!str) return null;
  // Jika format YYYY-MM-DD, interpretasikan sebagai awal hari lokal/WIB
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    const t = new Date(`${str}T00:00:00`).getTime();
    return Number.isNaN(t) ? null : t;
  }
  const t = new Date(str).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Mengembalikan alasan akun tidak aktif ('diblokir' | 'trial_habis' | 'masa_aktif_habis' | 'nonaktif')
 * atau null jika akun aktif & boleh mengakses aplikasi.
 */
export function alasanAkunTidakAktif(student, sekarangMs = Date.now()) {
  if (!student) return 'nonaktif';
  if (student.isBlocked === true || student.isBlocked === 'true') return 'diblokir';

  const st = String(student.status || '').trim().toLowerCase();
  if (st && STATUS_TERBLOKIR.has(st)) {
    if (st === 'expired' || st === 'habis' || st === 'tamat' || st === 'berakhir') {
      return 'masa_aktif_habis';
    }
    if (st === 'blokir' || st === 'diblokir' || st === 'blocked' || st === 'suspend' || st === 'suspended') {
      return 'diblokir';
    }
    return 'nonaktif';
  }

  // Cek batas waktu Trial Class
  if (student.isTrial === true || st === 'trial') {
    const trialExp = parseTanggalMs(student.trialExpiresAt);
    if (trialExp !== null && sekarangMs > trialExp) {
      return 'trial_habis';
    }
  }

  // Cek tanggalSelesai paket belajar (tanggalSelesai sendiri masih aktif s/d 23:59:59)
  const selesaiMs = parseTanggalMs(student.tanggalSelesai);
  if (selesaiMs !== null && selesaiMs + 86400000 <= sekarangMs) {
    return student.isTrial ? 'trial_habis' : 'masa_aktif_habis';
  }

  return null;
}

export function isAkunBelajarAktif(student, sekarangMs = Date.now()) {
  return alasanAkunTidakAktif(student, sekarangMs) === null;
}

export function pesanBlokir(student) {
  const alasan = alasanAkunTidakAktif(student);
  if (alasan === 'diblokir') {
    return {
      judul: 'Akun Diblokir Sementara',
      isi: 'Akunmu saat ini diblokir oleh sistem karena administrasi/pembayaran belum diselesaikan. Semua fitur belajar dan daftar kelas dinonaktifkan sementara hingga administrasi aktif kembali.',
      alasan: 'pembayaran / administrasi',
    };
  }
  if (alasan === 'trial_habis') {
    return {
      judul: 'Masa Trial Class (3 Hari) Berakhir',
      isi: 'Masa uji coba Trial Class 3 Hari kamu telah berakhir. Silakan hubungi admin untuk pendaftaran paket resmi agar akun dan seluruh fitur belajarmu aktif kembali.',
      alasan: 'masa trial berakhir',
    };
  }
  if (alasan === 'masa_aktif_habis') {
    return {
      judul: 'Masa Paket Belajar Telah Habis',
      isi: 'Masa aktif paket belajarmu sudah berakhir dan belum ada perpanjangan pembayaran. Sistem otomatis menonaktifkan akses hingga paket diperpanjang melalui admin.',
      alasan: 'masa paket habis',
    };
  }
  return {
    judul: 'Akun Tidak Aktif',
    isi: 'Status akunmu saat ini tidak aktif. Seluruh akses portal siswa dikunci sampai admin mengaktifkan kembali akunmu.',
    alasan: 'status akun nonaktif',
  };
}

/** Ambil dokumen siswa dari localStorage studentDocId / studentId / studentNim */
export async function muatStatusSiswa() {
  const studentDocId = localStorage.getItem('studentDocId') || '';
  const studentId =
    localStorage.getItem('studentId') ||
    localStorage.getItem('studentNim') ||
    '';
  if (!studentId && !studentDocId) return { studentId: '', student: null, aktif: false };

  // 1. Coba docId langsung (paling akurat karena merujuk ke dokumen yang diedit admin)
  if (studentDocId) {
    try {
      const langsungDoc = await getDoc(doc(db, 'students', studentDocId));
      if (langsungDoc.exists()) {
        const student = { id: langsungDoc.id, ...langsungDoc.data() };
        return { studentId: studentId || langsungDoc.id, student, aktif: isAkunBelajarAktif(student) };
      }
    } catch { /* lanjut query */ }
  }

  // 2. Coba studentId sebagai doc id
  if (studentId) {
    try {
      const langsung = await getDoc(doc(db, 'students', studentId));
      if (langsung.exists()) {
        const student = { id: langsung.id, ...langsung.data() };
        return { studentId, student, aktif: isAkunBelajarAktif(student) };
      }
    } catch { /* lanjut query */ }

    // 3. Query field studentId
    try {
      const snap = await getDocs(query(collection(db, 'students'), where('studentId', '==', studentId)));
      if (!snap.empty) {
        const d = snap.docs[0];
        const student = { id: d.id, ...d.data() };
        return { studentId, student, aktif: isAkunBelajarAktif(student) };
      }
    } catch { /* ignore */ }

    // 4. Query field nim
    try {
      const snap = await getDocs(query(collection(db, 'students'), where('nim', '==', studentId)));
      if (!snap.empty) {
        const d = snap.docs[0];
        const student = { id: d.id, ...d.data() };
        return { studentId, student, aktif: isAkunBelajarAktif(student) };
      }
    } catch { /* ignore */ }
  }

  return { studentId, student: null, aktif: false };
}

/** Filter daftar siswa: buang yang diblokir / nonaktif / masa aktif habis */
export function filterSiswaLeaderboard(daftarSiswa) {
  return (daftarSiswa || []).filter((s) => isAkunBelajarAktif(s));
}

export default {
  alasanAkunTidakAktif,
  isAkunBelajarAktif,
  pesanBlokir,
  muatStatusSiswa,
  filterSiswaLeaderboard,
};
