// src/utils/sesiLoginGuru.js
// ============================================================
// SATU tempat yang tahu kunci localStorage apa saja yang membentuk "sesi guru".
//
// KENAPA BERKAS INI ADA (register bug B-25, ditemukan 3 Nov 2026):
//   Login guru menulis TIGA kunci: `teacherData`, `guruInfo`, `isGuruLoggedIn`
//   (LoginGuru.jsx:30-33) plus `role = 'guru'`. Penjaga rute GuruRoute
//   (App.jsx:276-285) memeriksa `isGuruLoggedIn === 'true'` ATAU adanya
//   `teacherData`, DAN `role` harus 'guru'/'teacher'.
//   Tetapi tombol Keluar di dasbor guru hanya menghapus
//   `teacherData`, `isLoggedIn`, `userRole` — dua yang terakhir bahkan TIDAK
//   PERNAH ditulis proses login guru. Akibatnya setelah logout:
//   `isGuruLoggedIn` masih 'true' dan `role` masih 'guru' → penjaga rute
//   TETAP MELULUSKAN siapa pun yang membuka /guru/* di perangkat itu
//   (komputer bersama = orang berikutnya tinggal mengetik alamatnya).
//
//   Di tempat lain tombol Keluar memakai `localStorage.clear()` (SidebarGuru)
//   yang memang menutup lubangnya, tetapi ikut menghapus sesi admin/siswa dan
//   preferensi non-sesi di peramban yang sama. Keduanya salah arah; berkas ini
//   menyatukan: buang HANYA kunci sesi guru, dan `role` hanya bila milik guru.
// ============================================================

/** Kunci yang pasti milik sesi guru. */
export const KUNCI_SESI_GURU = ['teacherData', 'guruInfo', 'isGuruLoggedIn'];

/** Kunci warisan/berbagi yang hanya boleh dibuang bila memang sesi guru. */
export const KUNCI_WARISAN = ['isLoggedIn', 'userRole'];

/** Nilai `role` yang dianggap sesi guru. */
export const ROLE_GURU = ['guru', 'teacher'];

const bacaAman = (storage, kunci) => {
  try {
    return storage.getItem(kunci);
  } catch {
    return null;
  }
};

const hapusAman = (storage, kunci, dihapus) => {
  try {
    if (storage.getItem(kunci) !== null) {
      storage.removeItem(kunci);
      dihapus.push(kunci);
    }
  } catch {
    /* mode privat / storage penuh: tidak boleh melempar saat logout */
  }
};

/**
 * Apakah isi storage ini masih akan dianggap "guru sudah masuk" oleh GuruRoute?
 * Fungsi murni (dipakai test) — cermin persis syarat di App.jsx:276-285.
 */
export function masihDianggapMasuk(storage) {
  if (!storage) return false;
  const auth = bacaAman(storage, 'isGuruLoggedIn') === 'true' || !!bacaAman(storage, 'teacherData');
  const role = bacaAman(storage, 'role');
  return auth && ROLE_GURU.includes(role);
}

/**
 * Hapus sesi guru. `role` hanya dibuang bila nilainya milik guru, supaya admin
 * yang kebetulan masuk di peramban yang sama tidak ikut dikeluarkan.
 * @returns {string[]} kunci yang benar-benar dihapus (untuk test/log)
 */
export function hapusSesiGuru(storage) {
  const s = storage || (typeof window !== 'undefined' ? window.localStorage : null);
  if (!s) return [];
  const dihapus = [];
  KUNCI_SESI_GURU.forEach((k) => hapusAman(s, k, dihapus));
  if (ROLE_GURU.includes(bacaAman(s, 'role'))) hapusAman(s, 'role', dihapus);
  KUNCI_WARISAN.forEach((k) => hapusAman(s, k, dihapus));
  return dihapus;
}

export default { KUNCI_SESI_GURU, KUNCI_WARISAN, ROLE_GURU, masihDianggapMasuk, hapusSesiGuru };
