// src/utils/mingguIni.js
// ============================================================
// "Kunci minggu ini" -- dipakai buat XP mingguan (dasar leaderboard).
// Minggu dimulai hari SENIN (bukan Minggu), biar cocok sama kebiasaan
// sekolah Indonesia (Senin = awal minggu kerja/belajar). Kuncinya
// berupa tanggal Senin di minggu itu (mis. "2026-08-31") -- dua
// tanggal di minggu yang sama akan selalu punya kunci yang SAMA
// PERSIS, dua tanggal beda minggu akan selalu beda.
// ============================================================

export function kunciMingguIni(tanggal = new Date()) {
    const d = new Date(tanggal);
    const hari = d.getDay(); // 0 = Minggu, 1 = Senin, ... 6 = Sabtu
    const jarakKeSenin = hari === 0 ? 6 : hari - 1;
    const senin = new Date(d);
    senin.setDate(d.getDate() - jarakKeSenin);
    return senin.toISOString().slice(0, 10);
  }
  
  /**
   * Tambahkan XP ke progres mingguan siswa -- OTOMATIS reset ke 0 dulu
   * kalau ternyata minggu sebelumnya udah lewat (bukan ditambah terus ke
   * angka minggu lalu).
   * @param {number} xpMingguIniSebelumnya
   * @param {string} kunciMingguSebelumnya
   * @param {number} xpBaru - XP yang baru didapat (mau ditambahkan)
   * @returns {{ xpMingguIni: number, xpMingguIniKunci: string }}
   */
  export function tambahXpMingguan(xpMingguIniSebelumnya, kunciMingguSebelumnya, xpBaru) {
    const kunciSekarang = kunciMingguIni();
    const sudahMingguBaru = kunciMingguSebelumnya !== kunciSekarang;
    return {
      xpMingguIni: (sudahMingguBaru ? 0 : (xpMingguIniSebelumnya || 0)) + xpBaru,
      xpMingguIniKunci: kunciSekarang,
    };
  }