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
 * Rute "sedang mengerjakan" yang harus TAMPIL PENUH tanpa navigasi
 * bawah (21 Okt 2026, foto owner dari ponsel: "harusnya full tampilan
 * soal ... tombol kirim submit ... bahkan soal tertutupi" -- bar navigasi
 * zIndex 1200 menutupi opsi jawaban, tombol Kirim try out, dan bahkan
 * bar submit kuis yang zIndex-nya cuma 100).
 *
 * Disembunyikan di:
 *  - /siswa/tryout/<paketId>  -> sesi ujian layar penuh (BUKAN daftar
 *    /siswa/tryout yang tetap butuh nav); TryOutView punya tombol
 *    "Kembali" sendiri di setiap tahap.
 *  - /siswa/kuis/<id>         -> kuis ber-timer dengan bar submit fixed
 *    sendiri di bawah (StudentQuizView).
 *  - /siswa/latihan-harian    -> gaya app mobile dengan tombol kembali
 *    sendiri di tiap tahap.
 * Halaman konten/belajar lain (modul, buku, materi, survei) TETAP
 * menampilkan nav supaya siswa tidak kehilangan orientasi.
 */
export function navBawahSembunyiDiRute(pathname = '') {
  const p = String(pathname || '');
  if (/^\/siswa\/tryout\/[^/?#]+/.test(p)) return true;
  if (/^\/siswa\/kuis\/[^/?#]+/.test(p)) return true;
  if (/^\/siswa\/latihan-harian(\/|$|\?|#)/.test(p)) return true;
  return false;
}

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

export default { DAFTAR_MENU_BAWAH, menuAktifBawah, navBawahSembunyiDiRute };
