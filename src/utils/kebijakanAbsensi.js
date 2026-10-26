// src/utils/kebijakanAbsensi.js
// ============================================================
// KEBIJAKAN OTOMATIS DI BALIK STATUS ABSENSI (keputusan owner 2026-10-26:
// "tentor bisa kasih akses, kasih keterangan siswa untuk izin, alpha,
// secara otomatis"; dan "dari sisi admin harus sama konek").
//
// Status absensi bukan lagi sekadar catatan: ia MEMICU konsekuensi yang
// konsisten di seluruh permukaan --
//   Izin / Sakit : absen termaafkan -> akses susulan try out yang sudah
//                  tertutup dibukakan OTOMATIS (tryout_izin_ulang), tanpa
//                  siswa atau admin berbuat apa-apa;
//   Alpha        : tidak ada akses otomatis (itu makna alpha); keterangan
//                  tercatat dan perlu tindak lanjut manusia;
//   Hadir        : tidak ada konsekuensi tambahan.
//
// Murni & teruji: tidak menyentuh jaringan. Penulisan dokumen ada di
// services/izinAbsensiOtomatis.js; tampilan ada di ClassSession/
// TeacherAttendance (penulis) dan HasilTryOutAdminPage (pembaca admin).
// ============================================================

export const STATUS_ABSENSI = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

/** Urutan siklus saat tentor mengetuk nama siswa di roll-call kelas. */
export const SIKLUS_ABSENSI = ['Hadir', 'Izin', 'Sakit', 'Alpha'];

/** Masa berlaku akses susulan otomatis (hari) sejak diberikan. */
export const GRACE_IZIN_HARI = 7;

/** Status berikutnya dalam siklus; nilai kosong/'Belum' mulai dari Hadir. */
export function statusBerikutnya(statusKini) {
  const i = SIKLUS_ABSENSI.indexOf(String(statusKini ?? ''));
  if (i === -1) return SIKLUS_ABSENSI[0];
  return SIKLUS_ABSENSI[(i + 1) % SIKLUS_ABSENSI.length];
}

/**
 * Konsekuensi otomatis satu status.
 * @returns {{beriIzinUlang: boolean, tindakLanjut: string|null}}
 */
export function kebijakanUntukStatus(status) {
  const s = String(status ?? '');
  return {
    beriIzinUlang: s === 'Izin' || s === 'Sakit',
    tindakLanjut: s === 'Alpha' ? 'alpha' : null,
  };
}

/**
 * Apakah satu paket try out perlu dibukakan akses susulan untuk siswa yang
 * absen termaafkan pada `tanggalAbsenMs`?
 *
 * Aturan (sengaja konservatif, tidak mengarang):
 *  - paket aktif;
 *  - punya waktuTutup, dan tutupnya jatuh PADA/SETELAH hari absen tetapi
 *    SUDAH lewat sekarang (kalau belum tutup, siswa masih punya jalan normal);
 *  - siswa belum punya sesi selesai untuk paket itu (yang sudah selesai
 *    tidak butuh apa-apa).
 *
 * @param {object} paket
 * @param {{tanggalAbsenMs: number, sekarangMs: number, adaSesiSelesai: boolean}} ctx
 */
export function paketPerluIzinUlang(paket, { tanggalAbsenMs, sekarangMs, adaSesiSelesai = false } = {}) {
  if (!paket || paket.status !== 'aktif') return false;
  const tutup = paket.waktuTutup ? new Date(paket.waktuTutup).getTime() : NaN;
  if (!Number.isFinite(tutup)) return false;
  if (adaSesiSelesai) return false;
  if (tutup < tanggalAbsenMs) return false;   // tutup sebelum hari absen: siswa memang sudah tak punya jalan saat itu
  if (tutup > sekarangMs) return false;       // masih terbuka: akses normal masih ada
  return true;
}

/** ISO waktu kedaluwarsa akses susulan: sekarang + GRACE_IZIN_HARI. */
export function waktuBerlakuSampaiIso(sekarangMs = Date.now()) {
  return new Date(sekarangMs + GRACE_IZIN_HARI * 24 * 60 * 60 * 1000).toISOString();
}

export default { STATUS_ABSENSI, SIKLUS_ABSENSI, GRACE_IZIN_HARI, statusBerikutnya, kebijakanUntukStatus, paketPerluIzinUlang, waktuBerlakuSampaiIso };
