// src/utils/tingkatSiswa.js
// ============================================================
// LOGIKA PEMBAGIAN JENJANG & KELAS SISWA (HAK AKSES KELAS 12 SMA)
//
// Aturan Hak Akses:
// 1. KELAS 12 SMA (Paten):
//    - Full akses ke fitur UTBK/SNBT: Modul 7 Subtes, Roadmap UTBK,
//      Tryout UTBK 2x sebulan, Target PTN & Katalog 173 PTN, Countdown UTBK.
// 2. KELAS 10 & 11 SMA:
//    - Boleh eksplorasi Target PTN & Katalog PTN.
//    - Fitur intensif UTBK (Modul 7 Subtes & Tryout UTBK Marathon) dikunci
//      dengan pesan edukatif "Khusus untuk kelas 12 SMA".
// 3. SMP, SD, & ENGLISH COURSE / UMUM:
//    - SAMA SEKALI TIDAK MELIHAT fitur UTBK maupun PTN/Kampus.
//    - Roadmap & Tryout mengikuti jenjang masing-masing (TKA SMP / TKA SD).
// ============================================================

/**
 * Mendeteksi tingkat & jenjang siswa secara presisi dari objek profil siswa atau string kelas.
 */
export function deteksiTingkatSiswa(profil = {}) {
  let p = profil;
  if (typeof p === 'string') {
    p = { kelas: p, kelasSekolah: p };
  }
  const kSekolah = String(p?.kelasSekolah || '').trim();
  const kKelas = String(p?.kelas || '').trim();
  const jJenjang = String(p?.jenjang || '').trim();
  const pProgram = String(p?.program || p?.kategori || '').trim();

  const gabungan = `${kSekolah} ${kKelas} ${jJenjang} ${pProgram}`.toUpperCase();

  // 1. Deteksi Kelas 12 SMA / Gap Year / Alumni UTBK
  const isKelas12 =
    /\b(12|XII)\b/i.test(gabungan) ||
    /\b(GAP\s*YEAR|ALUMNI|UTBK|SNBT)\b/i.test(gabungan) ||
    (kKelas === '12 SMA' || kSekolah === '12 SMA');

  // 2. Deteksi Kelas 10 & 11 SMA
  const isSmaBawah =
    (/\b(10|11|X|XI)\b/i.test(gabungan) || /\b(SMA|SMK|MA)\b/i.test(gabungan)) &&
    !isKelas12 &&
    !/\b(SMP|MTS|SD|MI)\b/i.test(gabungan);

  // 3. Deteksi SMA secara umum (10, 11, 12)
  const isSma = isKelas12 || isSmaBawah || (/\b(SMA|SMK|MA)\b/i.test(gabungan) && !/\b(SMP|MTS|SD|MI)\b/i.test(gabungan));

  // 4. Deteksi SMP (Kelas 7, 8, 9)
  const isSmp =
    (/\b(7|8|9|VII|VIII|IX)\b/i.test(gabungan) || /\b(SMP|MTS)\b/i.test(gabungan)) &&
    !isSma;

  // 5. Deteksi SD (Kelas 1-6)
  const isSd =
    (/\b(1|2|3|4|5|6|I|II|III|IV|V|VI)\b/i.test(gabungan) || /\b(SD|MI)\b/i.test(gabungan)) &&
    !isSma &&
    !isSmp;

  // 6. Program Lain (English Course, Kursus, Umum)
  const isEnglishCourse = /\b(ENGLISH|TOEFL|IELTS|KURSUS)\b/i.test(gabungan);
  const isUmum = !isSma && !isSmp && !isSd;

  let jenjangBaku = 'SMA';
  if (isSmp) jenjangBaku = 'SMP';
  else if (isSd) jenjangBaku = 'SD';
  else if (isEnglishCourse) jenjangBaku = 'ENGLISH';
  else if (isUmum) jenjangBaku = 'UMUM';

  return {
    isKelas12,
    isSmaBawah,
    isSma,
    isSmp,
    isSd,
    isEnglishCourse,
    isUmum,
    jenjangBaku,
    bisaAksesTargetKampus: isSma, // SMA (10, 11, 12) bisa eksplorasi kampus
    bisaAksesFiturUtbk: isKelas12, // HANYA Kelas 12 yang paten akses penuh UTBK
  };
}

export default deteksiTingkatSiswa;
