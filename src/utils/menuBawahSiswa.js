// src/utils/menuBawahSiswa.js
// ============================================================
// NAVIGASI BAWAH PORTAL SISWA (20 Okt 2026, permintaan owner meniru
// pola app bank): lima slot dengan tombol MELAYANG DI TENGAH =
// "AKSES BELAJAR MUDAH" yang MENCAMPUR e-learning & buku digital
// dalam satu hub. Util murni supaya pemetaan rute->slot aktif bisa
// dipaku uji (termasuk rute-rute anak seperti /siswa/buku/:id/:bab).
// ============================================================

export const DAFTAR_MENU_BAWAH = [
  { id: 'beranda', label: 'Beranda', rute: '/siswa/dashboard', icon: 'Home' },
  { id: 'tryout', label: 'Try Out', rute: '/siswa/tryout', icon: 'Rocket' },
  { id: 'akses', label: 'Akses Belajar', rute: '/siswa/akses-belajar', icon: 'GraduationCap', tengah: true },
  { id: 'jadwal', label: 'Jadwal', rute: '/siswa/jadwal', icon: 'Calendar' },
  { id: 'absensi', label: 'Absensi', rute: '/siswa/absensi', icon: 'UserCheck' },
];

/**
 * Slot mana yang menyala untuk pathname kini. Seluruh rute anak
 * e-learning & buku digital menyalakan slot TENGAH supaya siswa
 * selalu tahu "aku masih di kawasan belajar".
 */
export function menuAktifBawah(pathname = '') {
  const p = String(pathname || '');
  if (p.startsWith('/siswa/akses-belajar')
    || p.startsWith('/siswa/buku')
    || p.startsWith('/siswa/materi')
    || p.startsWith('/siswa/belajar')
    || p.startsWith('/siswa/modul')
    || p.startsWith('/siswa/kuis')) return 'akses';
  if (p.startsWith('/siswa/tryout')) return 'tryout';
  if (p.startsWith('/siswa/jadwal')) return 'jadwal';
  if (p.startsWith('/siswa/absensi') || p.startsWith('/siswa/kehadiran')) return 'absensi';
  if (p.startsWith('/siswa/dashboard')) return 'beranda';
  return '';
}

export default { DAFTAR_MENU_BAWAH, menuAktifBawah };
