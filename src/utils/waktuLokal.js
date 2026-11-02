// src/utils/waktuLokal.js
// ============================================================
// TANGGAL BISNIS = TANGGAL LOKAL PERANGKAT, BUKAN UTC.
//
// KENAPA BERKAS INI ADA (bug dashboard guru, 2 Nov 2026): sebagian penulis
// dokumen bertanggal (jadwal_bimbel.dateStr, settings/daily_code_*, kunci
// dokumen attendance) memakai komponen tanggal LOKAL (getFullYear/getMonth/
// getDate — di lapangan berarti WIB), sementara sebagian pembaca memakai
// `new Date().toISOString().split('T')[0]` yang BERZONA UTC. Keduanya beda
// pada rentang 00:00–06:59 WIB: pembaca UTC melihat "hari ini" sebagai
// kemarin, sehingga kelas pagi dan kode harian tampak kosong/salah sampai
// pukul 07:00. Kelas bug ini tidak muncul di test karena sandbox berzona
// UTC — maka pengawalnya memakai proses anak ber-TZ Asia/Jakarta.
//
// Aturan pakai: SEMUA string tanggal bisnis (kunci dokumen, filter harian,
// label kalender) dibuat lewat tanggalLokalStr/geserHariLokal. toISOString
// hanya boleh untuk stempel waktu audit (createdAt dsb.), bukan kunci hari.
// ============================================================

/** String tanggal LOKAL `YYYY-MM-DD` dari perangkat (bukan UTC). */
export function tanggalLokalStr(tanggal = new Date()) {
  // `new Date(null)` SAH di JavaScript (jatuh ke epoch 1970) — maka null/''
  // wajib ditolak lebih dulu, bukan diserahkan ke konstruktor.
  if (tanggal === null || tanggal === undefined || tanggal === '') return '';
  const d = tanggal instanceof Date ? tanggal : new Date(tanggal);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** String tanggal LOKAL hasil pergeseran N hari (aman lintas bulan/tahun). */
export function geserHariLokal(tanggal = new Date(), jumlahHari = 0) {
  if (tanggal === null || tanggal === undefined || tanggal === '') return '';
  const d = tanggal instanceof Date ? new Date(tanggal.getTime()) : new Date(tanggal);
  if (Number.isNaN(d.getTime())) return '';
  d.setDate(d.getDate() + Number(jumlahHari || 0));
  return tanggalLokalStr(d);
}
