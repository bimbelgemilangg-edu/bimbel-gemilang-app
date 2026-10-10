// src/utils/sakelarFitur.js
// ============================================================
// Sakelar fitur (feature flag) Gemilang -- supaya fitur BARU bisa hidup di
// produksi tanpa terlihat oleh siswa mana pun sampai owner memutuskannya.
//
// 🔥 KENAPA BERKAS INI ADA (audit 2026-10-10)
// Repo ini tidak punya mekanisme sakelar fitur sama sekali. Yang ada hanya
// `settings/global_config` (kredensial & konfigurasi keuangan) dan
// `admin_izin` (izin absensi staf). Padahal risikonya nyata dan sudah
// tercatat di README: PWA memakai `registerType: 'autoUpdate'`, jadi
// SETIAP merge ke main masuk ke HP siswa tanpa mereka meminta. Satu-satunya
// pengerem yang ada hari ini adalah proses (branch -> PR -> CI), dan itu
// tidak bisa mengerem fitur yang memang harus tayang setengah jadi untuk
// diuji orang tertentu.
//
// Prinsip yang diikuti, semuanya preseden dari repo ini sendiri:
//
//  1. DEFAULT MENOLAK. Konfigurasi tidak ada / rusak / gagal dibaca /
//     mode tak dikenal -> fitur MATI. Sama seperti cocokkanJenjang() di
//     aksesKontenSiswa.js yang `return false` bila jenjang tak dikenali,
//     bukan `return true`. Gagal ke arah aman, bukan ke arah bocor.
//  2. SATU sumber kebenaran. Halaman tidak boleh menulis logika sakelar
//     sendiri -- pola statusTryOutPaket.js & skorSoalTryOut.js.
//  3. BUKAN KEAMANAN. Sakelar ini mengontrol apa yang DITAMPILKAN. Karena
//     Rules Firestore produksi masih terbuka (docs/KEPUTUSAN-RISIKO-FIRESTORE.md),
//     data koleksi apa pun tetap bisa dibaca lewat DevTools. Fitur yang
//     isinya sensitif wajib punya penjagaan di sisi server, bukan di sini.
//     Jangan pernah memakai sakelar ini sebagai pengganti otorisasi.
//  4. Jejak audit. Siapa menyalakan apa untuk siapa tercatat -- mengikuti
//     cara repo memperlakukan perubahan akun admin (utils/auditLog.js).
//
// Bentuk dokumen (settings/global_config, field `fiturPilot`):
//
//   fiturPilot: {
//     <namaFitur>: {
//       aktif: true,                      // master switch; default false
//       mode: 'whitelist',                // whitelist | kelas | semua
//       daftarSiswaUji: ['GEM-UJI-001'],  // untuk mode whitelist
//       daftarKelasUji: ['12 UJI'],       // untuk mode kelas
//       catatan: '...', diperbaruiOleh: 'owner', diperbaruiAt: <timestamp>
//     }
//   }
// ============================================================

export const DOK_SETTINGS = 'global_config';
export const FIELD_PILOT = 'fiturPilot';

export const MODE = {
  /** Hanya studentId yang terdaftar. Ini mode awal yang paling aman. */
  WHITELIST: 'whitelist',
  /** Semua siswa di kelas tertentu (mis. satu kelas 12 sungguhan). */
  KELAS: 'kelas',
  /** Semua orang. Hanya dipakai setelah pengujian selesai. */
  SEMUA: 'semua',
};

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * Keputusan murni -- TIDAK menyentuh Firestore, jadi bisa diuji.
 *
 * @param {object|null|undefined} konfigurasi isi field `fiturPilot`
 * @param {string} namaFitur      kunci fitur, mis. 'rasionalisasiKampus'
 * @param {{studentId?: string, kelasSekolah?: string}} siswa
 * @param {{aktif?: boolean}} [opsi] opsi.aktif=false mematikan paksa tanpa
 *   membaca konfigurasi -- dipakai halaman yang sedang dibangun agar bisa
 *   di-ship dalam keadaan mati total.
 * @returns {{aktif: boolean, alasan: string}} alasan selalu terisi supaya UI
 *   bisa menjelaskan kenapa fitur tidak muncul, bukan diam saja.
 */
export function putuskanAksesFitur(konfigurasi, namaFitur, siswa = {}, opsi = {}) {
  if (opsi && opsi.aktif === false) {
    return { aktif: false, alasan: 'fitur dimatikan paksa oleh pemanggil' };
  }
  const nama = norm(namaFitur);
  if (!nama) return { aktif: false, alasan: 'nama fitur kosong' };

  const peta = konfigurasi && typeof konfigurasi === 'object' ? konfigurasi : null;
  if (!peta) return { aktif: false, alasan: 'konfigurasi fiturPilot belum ada' };

  // Kunci fitur boleh ditulis dengan kapitalisasi apa pun oleh admin; dicari
  // tanpa peduli huruf besar/kecil supaya tidak gagal cuma karena 'RasionalisasiKampus'.
  const kunciAsli = Object.keys(peta).find((k) => norm(k) === nama);
  const cfg = kunciAsli ? peta[kunciAsli] : null;
  if (!cfg || typeof cfg !== 'object') {
    return { aktif: false, alasan: `fitur "${namaFitur}" belum terdaftar di fiturPilot` };
  }
  if (cfg.aktif !== true) {
    return { aktif: false, alasan: `fitur "${namaFitur}" dalam keadaan nonaktif` };
  }

  const mode = norm(cfg.mode) || MODE.WHITELIST; // mode kosong -> paling ketat

  if (mode === MODE.SEMUA) return { aktif: true, alasan: 'mode: semua pengguna' };

  if (mode === MODE.KELAS) {
    const daftar = Array.isArray(cfg.daftarKelasUji) ? cfg.daftarKelasUji.map(norm) : [];
    if (daftar.length === 0) return { aktif: false, alasan: 'mode kelas tapi daftarKelasUji kosong' };
    const kelasSiswa = norm(siswa?.kelasSekolah);
    if (!kelasSiswa) return { aktif: false, alasan: 'kelas siswa tidak diketahui' };
    return daftar.includes(kelasSiswa)
      ? { aktif: true, alasan: `mode: kelas ${siswa.kelasSekolah}` }
      : { aktif: false, alasan: `kelas "${siswa.kelasSekolah}" tidak termasuk daftar uji` };
  }

  if (mode === MODE.WHITELIST) {
    const daftar = Array.isArray(cfg.daftarSiswaUji) ? cfg.daftarSiswaUji.map(norm) : [];
    if (daftar.length === 0) return { aktif: false, alasan: 'mode whitelist tapi daftarSiswaUji kosong' };
    const id = norm(siswa?.studentId);
    if (!id) return { aktif: false, alasan: 'studentId tidak diketahui' };
    return daftar.includes(id)
      ? { aktif: true, alasan: 'mode: whitelist siswa uji' }
      : { aktif: false, alasan: 'siswa ini tidak termasuk daftar uji' };
  }

  // Mode tak dikenal -> MATI. Jangan menebak maksud admin.
  return { aktif: false, alasan: `mode "${cfg.mode}" tidak dikenali` };
}

/**
 * Bangun patch untuk disimpan admin. Dipisah supaya bentuk dokumen hanya
 * didefinisikan di satu tempat (panel admin dan skrip pemeliharaan memakai
 * fungsi yang sama).
 */
export function bentukKonfigurasiFitur({
  aktif = false,
  mode = MODE.WHITELIST,
  daftarSiswaUji = [],
  daftarKelasUji = [],
  catatan = '',
  diperbaruiOleh = '',
}) {
  // String(x) pada null menghasilkan 'null' -- string yang terlihat sah dan
  // tidak akan pernah cocok dengan studentId mana pun, jadi daftar itu akan
  // diam-diam "berisi" entri mati. Disaring eksplisit sebelum diubah string.
  const bersihkanDaftar = (d) => (Array.isArray(d)
    ? d
      .filter((x) => x !== null && x !== undefined && String(x).trim() !== '')
      .map((x) => String(x).trim())
    : []);

  const m = norm(mode);
  return {
    aktif: aktif === true,
    // Tidak peka huruf besar/kecil, konsisten dengan sisi pembaca: admin yang
    // menulis 'WHITELIST' di panel tidak boleh dapat perilaku berbeda dari
    // yang menulis 'whitelist'.
    mode: [MODE.WHITELIST, MODE.KELAS, MODE.SEMUA].includes(m) ? m : MODE.WHITELIST,
    daftarSiswaUji: bersihkanDaftar(daftarSiswaUji),
    daftarKelasUji: bersihkanDaftar(daftarKelasUji),
    catatan: String(catatan || ''),
    diperbaruiOleh: String(diperbaruiOleh || ''),
  };
}

export default { putuskanAksesFitur, bentukKonfigurasiFitur, MODE, DOK_SETTINGS, FIELD_PILOT };
