// src/utils/pemulihanXPTryOut.js
// ============================================================
// PENGEMBALIAN XP SAAT SESI TRY OUT DI-RESET (permintaan owner
// 2026-10-08: "gimana cara mengembalikan soal dan poin XP dll anak ke
// semula biar bisa kerjain ulang").
//
// KENAPA butuh util terpisah: waktu siswa menyelesaikan try out, XP
// ditambah di DUA tempat sekaligus -- `xp` (total sepanjang masa) dan
// `xpMingguIni` (leaderboard mingguan, lihat mingguIni.js). Kalau
// admin mereset sesi supaya siswa boleh mengulang, XP hasil pengerjaan
// lama WAJIB ditarik balik dari keduanya -- kalau tidak, siswa untung ganda
// (kerjain 2x, XP 2x) dan leaderboard minggu itu jadi bohong.
//
// Fungsi di sini MURNI (hitung angka saja) -- pengambilan/penghapusan
// dokumen Firestore dilakukan di halaman admin, biar logika angkanya
// bisa di-test node (tests/pemulihanXPTryOut.test.mjs).
// ============================================================

import { kunciMingguIni } from './mingguIni.js';

/**
 * Hitung progres XP siswa SETELAH XP satu sesi try out ditarik balik.
 *
 * Aturan jujur:
 *  - `xp` total dikurangi sebesar XP sesi, TAPI tidak pernah dibawah 0
 *    (kalau angka di database ternyata sudah lebih kecil -- mis. dulu
 *    pernah dikoreksi manual -- kita berhenti di 0, bukan minus).
 *  - `xpMingguIni` cuma ikut dikurangi kalau sesi-nya memang terjadi
 *    di minggu yang SAMA (kuncinya cocok). Kalau minggu itu sudah
 *    lewat, xpMingguIni memang sudah otomatis 0 minggu ini (lihat
 *    tambahXpMingguan) -- jadi gak boleh dikurangi lagi dari angka
 *    minggu baru yang belum apa-apa.
 *  - Kunci minggu disetel ke minggu sekarang, meniru perilaku
 *    tambahXpMingguan supaya bentuk datanya konsisten.
 *
 * @param {object} progres isi dokumen siswa_progress sekarang
 *   ({ xp, xpMingguIni, xpMingguIniKunci }) -- boleh {} kalau dokumen belum ada
 * @param {number} xpDikembalikan XP final sesi yang di-reset (xpFinal, sudah termasuk potongan pelanggaran)
 * @param {string} [kunciMingguSekarang] inject buat test (default minggu ini)
 * @returns {{xp: number, xpMingguIni: number, xpMingguIniKunci: string}}
 */
export function hitungPemulihanXP(progres, xpDikembalikan, kunciMingguSekarang = kunciMingguIni()) {
  const potong = Math.max(0, Number(xpDikembalikan) || 0);
  const xpTotal = Math.max(0, Number(progres?.xp) || 0);
  const kunciLama = progres?.xpMingguIniKunci || null;
  const dasarMingguan = kunciLama === kunciMingguSekarang
    ? (Number(progres?.xpMingguIni) || 0)
    : 0; // minggu baru: angka lama sudah hangus sendiri, jangan dipotong dua kali
  return {
    xp: Math.max(0, xpTotal - potong),
    xpMingguIni: Math.max(0, dasarMingguan - potong),
    xpMingguIniKunci: kunciMingguSekarang,
  };
}

/**
 * Kalimat konfirmasi reset satu sesi -- dipakai halaman admin supaya
 * admin TAHU persis apa yang terjadi sebelum klik (XP berapa yang
 * ditarik, siswa boleh ngulang atau tidak). Dipisah biar gampang
 * di-test dan gak nyampur sama JSX.
 *
 * @param {object} o
 * @param {string} o.namaSiswa
 * @param {number} o.xpFinal XP sesi yang akan ditarik balik
 * @param {string} o.statusSesi 'berjalan' | 'selesai'
 * @param {boolean} o.deadlineLewat apakah paket sudah lewat deadline
 * @returns {string}
 */
export function teksKonfirmasiResetSesi({
  namaSiswa, xpFinal, statusSesi, deadlineLewat,
}) {
  const potong = Math.max(0, Number(xpFinal) || 0);
  const kalimat = [
    `Reset sesi try out "${namaSiswa}" (${statusSesi === 'berjalan' ? 'sedang berjalan' : 'sudah selesai'})?`,
    potong > 0
      ? `XP ${potong} dari pengerjaan lama akan DIKEMBALIKAN (dikurangi lagi dari total & XP mingguan), lalu sesi dihapus supaya siswa bisa kerjain ulang dari soal nomor 1.`
      : 'Sesi akan dihapus supaya siswa bisa kerjain ulang dari soal nomor 1 (sesi ini tidak punya XP).',
  ];
  if (deadlineLewat) {
    kalimat.push('⚠️ Paket ini SUDAH LEWAT DEADLINE -- setelah reset siswa tetap tidak bisa masuk sampai deadline diperpanjang lewat tombol Edit.');
  }
  return kalimat.join('\n\n');
}
