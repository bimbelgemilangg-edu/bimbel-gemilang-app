// src/utils/tingkatSiswa.js
// ============================================================
// LOGIKA PEMBAGIAN JENJANG & KELAS SISWA (HAK AKSES KELAS 9 SMP & 12 SMA)
//
// Aturan Hak Akses Sesuai Arahan Owner:
// 1. KELAS 9 SMP:
//    - Hak akses khusus menu TKA SMP KELAS 9 (Kelas Pendampingan TKA,
//      Modul Belajar TKA SMP, Countdown Asesmen TKA SMP).
// 2. KELAS 12 SMA / ALUMNI / GAP YEAR:
//    - Hak akses khusus menu UTBK SMA KELAS 12 (Kelas Pendampingan UTBK,
//      Modul Belajar 7 Subtes UTBK, Target PTN & Katalog 173 PTN, Countdown UTBK-SNBT).
// 3. TKA SD & TKA SMA:
//    - Status: BELUM DI BUAT (Sesuai arahan owner). Tidak ada menu TKA SD atau TKA SMA.
// 4. KELAS SELAIN ITU (SD 1-6, SMP 7-8, SMA 10-11, ENGLISH / UMUM):
//    - SAMA SEKALI TIDAK MELIHAT MENU TERKAIT UTBK/SNBT MAUPUN TKA!
//    - Fokus pada materi harian, E-Learning, kuis interaktif, dan latihan harian reguler.
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
  const kKelas = String(p?.kelas || p?.studentKelas || p?.grade || '').trim();
  const jJenjang = String(p?.jenjang || '').trim();
  const pProgram = String(p?.program || p?.kategori || '').trim();

  const gabungan = `${kSekolah} ${kKelas} ${jJenjang} ${pProgram}`.toUpperCase();

  // 1. Deteksi Alumni / UTBK / Gap Year / SNBT
  const isAlumniUtbk =
    /\b(GAP\s*YEAR|GAPYEAR|ALUMNI|UTBK|SNBT)\b/i.test(gabungan) ||
    kKelas === '12 SMA' || kSekolah === '12 SMA';

  // 2. Flag Jenjang Utama (Word Boundary ketat agar SMPN 6 tidak tertukar dengan SD 6)
  const hasSmp = /\b(SMP|SMPN|MTS|MTSN)\b/i.test(gabungan);
  const hasSma = /\b(SMA|SMAN|SMK|SMKN|MA|MAN)\b/i.test(gabungan) || isAlumniUtbk;
  const hasSd = /\b(SD|SDN|MI|MIN)\b/i.test(gabungan);

  // 3. Cek Nomor Kelas secara presisi
  const isKelas9Spesifik =
    /\b(9|IX)\b/i.test(gabungan) &&
    (hasSmp || /\b(9\s*SMP|SMP\s*9|KELAS\s*9|IX\s*SMP)\b/i.test(gabungan) || (!hasSma && !hasSd));

  const isKelas12Spesifik =
    isAlumniUtbk ||
    (/\b(12|XII)\b/i.test(gabungan) &&
      (hasSma || /\b(12\s*SMA|SMA\s*12|KELAS\s*12|XII\s*SMA|12\s*SMK)\b/i.test(gabungan) || (!hasSmp && !hasSd)));

  // Deteksi Kelas 10 & 11 SMA
  const isSmaBawah =
    (hasSma || /\b(10|11|X|XI)\b/i.test(gabungan)) &&
    !isKelas12Spesifik &&
    !hasSmp &&
    !hasSd;

  // Deteksi SMA secara umum
  const isSma = isKelas12Spesifik || isSmaBawah || (hasSma && !hasSmp && !hasSd);

  // Deteksi Kelas 7 & 8 SMP
  const isSmpBawah =
    hasSmp &&
    !isKelas9Spesifik &&
    !isSma &&
    !hasSd;

  // Deteksi SMP secara umum
  const isSmp = (hasSmp || isKelas9Spesifik || isSmpBawah) && !isSma;

  // Deteksi SD secara umum
  const isSd = (hasSd || (/\b(1|2|3|4|5|6|I|II|III|IV|V|VI)\b/i.test(gabungan) && !hasSmp && !hasSma)) && !isSmp && !isSma;

  // Deteksi Kelas 6 SD spesifik
  const isKelas6 = isSd && (
    /\b(6|VI)\b/i.test(gabungan) ||
    /\b(6\s*SD|SD\s*6|KELAS\s*6|VI\s*SD)\b/i.test(gabungan)
  );
  const isSdBawah = isSd && !isKelas6;

  // Program Lain (English Course, Kursus, Umum)
  const isEnglishCourse = /\b(ENGLISH|TOEFL|IELTS|KURSUS)\b/i.test(gabungan);
  const isUmum = !isSma && !isSmp && !isSd;

  let jenjangBaku = 'SMA';
  if (isSmp) jenjangBaku = 'SMP';
  else if (isSd) jenjangBaku = 'SD';
  else if (isEnglishCourse) jenjangBaku = 'ENGLISH';
  else if (isUmum) jenjangBaku = 'UMUM';

  // Hak Akses Presisi Sesuai Permintaan Owner:
  // - HANYA Kelas 9 SMP yang boleh mengakses TKA SMP
  // - HANYA Kelas 12 SMA / Alumni yang boleh mengakses UTBK SMA
  // - TKA SD & TKA SMA status: BELUM DI BUAT (false)
  // - Selain itu GABISA menampilkan menu terkait UTBK/SNBT dan TKA
  const bisaAksesTkaSmp = Boolean(isSmp && isKelas9Spesifik);
  const bisaAksesUtbk = Boolean(isSma && isKelas12Spesifik);
  const bisaAksesTkaSd = false; // BELUM DI BUAT
  const bisaAksesTkaSma = false; // BELUM DI BUAT

  return {
    isKelas12: bisaAksesUtbk,
    isSmaBawah,
    isSma,
    isKelas9: bisaAksesTkaSmp,
    isSmpBawah,
    isSmp,
    isKelas6,
    isSdBawah,
    isSd,
    isEnglishCourse,
    isUmum,
    jenjangBaku,
    bisaAksesTkaSmp,
    bisaAksesUtbk,
    bisaAksesTkaSd,
    bisaAksesTkaSma,
    bisaAksesTargetKampus: bisaAksesUtbk, // HANYA Kelas 12 SMA (target UTBK SNBT)
    bisaAksesFiturUtbk: bisaAksesUtbk,     // HANYA Kelas 12 SMA (UTBK penuh)
    bisaAksesModulUjian: bisaAksesTkaSmp || bisaAksesUtbk, // HANYA 9 SMP & 12 SMA
  };
}

export default deteksiTingkatSiswa;
