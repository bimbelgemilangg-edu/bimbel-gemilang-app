// src/utils/jalurUjianAiConfig.js
// ============================================================
// KONFIGURASI JALUR UJIAN AI (STAGE MAP EKSPEDISI KOSMIK GEMILANG)
//
// 1. Menu ini HANYA TAMPIL untuk siswa jenjang akhir:
//    - Kelas 6 SD (TKA SD / Asesmen Daerah)
//    - Kelas 9 SMP (TKA SMP / Standarisasi Kelulusan)
//    - Kelas 12 SMA / SMK / Alumni (UTBK-SNBT & TKA SMA)
//    Kelas selain itu (1-5 SD, 7-8 SMP, 10-11 SMA) TIDAK MELIHAT MENU INI.
//
// 2. MEKANISME PROGRESI TANPA DEADLINE:
//    - Tidak ada deadline yang membuat kuis hangus!
//    - Unit 1 (Start) selalu terbuka.
//    - Unit N+1 otomatis terbuka jika Unit N telah diselesaikan (status: 'selesai').
//    - Analisis kemampuan AI langsung terbuka per unit.
//
// 3. UJIAN RESMI & PENGAWASAN ONLINE:
//    - Timer resmi per unit.
//    - Anti-cheat online terintegrasi.
//    - Bank soal selalu terjaga, tidak boleh ada unit terbuka dengan soal kosong.
// ============================================================

import { layakUntukTryOut } from './layakTryOut.js';
import { SOAL_TKA_2026_SMP_MTK_PAKET_B, SOAL_TKA_2026_SMP_BINDO_PAKET_A } from '../data/tka2026DiyData.js';
import { SOAL_PRESET_UTBK } from '../data/utbk2026KatkielData.js';
import { SOAL_TKA_2026_SD_MTK, SOAL_TKA_2026_SD_BINDO } from '../data/tka2026SdData.js';

/**
 * Deteksi apakah siswa berada di jenjang akhir yang wajib ujian seleksi.
 * @param {object|string} siswaAtauKelas objek profil siswa atau string kelas
 * @returns {null|{jenjang:string, kelas:string, kodeTarget:string, namaUjian:string, labelBadge:string, subJudul:string, deskripsi:string}}
 */
export function deteksiJenjangUjianAkhir(siswaAtauKelas) {
  let kelasStr = '';
  let jenjangStr = '';
  if (typeof siswaAtauKelas === 'object' && siswaAtauKelas !== null) {
    kelasStr = String(siswaAtauKelas.kelasSekolah || siswaAtauKelas.kelas || siswaAtauKelas.studentKelas || siswaAtauKelas.grade || '');
    jenjangStr = String(siswaAtauKelas.jenjang || '');
  } else {
    kelasStr = String(siswaAtauKelas || '');
  }
  const k = kelasStr.trim().toLowerCase();
  const j = jenjangStr.trim().toLowerCase();

  // 1. Cek Alumni / UTBK / Gap Year / Kedinasan
  if (k.includes('alumni') || k.includes('gap year') || k.includes('gapyear') || k.includes('utbk') || k.includes('snbt')) {
    return {
      jenjang: 'SMA',
      kelas: '12',
      kodeTarget: '12-SMA',
      namaUjian: 'UTBK-SNBT & TKA SMA',
      labelBadge: 'UTBK / TKA',
      subJudul: 'Ekspedisi Kosmik SNBT & TKA SMA',
      deskripsi: 'Simulasi bertingkat tanpa deadline persiapan lolos PTN & kedinasan impian.',
    };
  }

  // Ekstrak angka kelas bila ada
  const matchAngka = /(\d{1,2})/.exec(k);
  const angka = matchAngka ? parseInt(matchAngka[1], 10) : null;

  // 2. Cek Kelas 6 SD
  const isSd = k.includes('sd') || k.includes('mi') || j.includes('sd') || j.includes('mi');
  if (angka === 6 || (isSd && (angka === 6 || k.includes('vi'))) || k.includes('6 sd') || k.includes('sd 6') || k.includes('kelas 6')) {
    return {
      jenjang: 'SD',
      kelas: '6',
      kodeTarget: '6-SD',
      namaUjian: 'TKA SD (Asesmen Standarisasi)',
      labelBadge: 'TKA SD',
      subJudul: 'Misi Penjelajah TKA SD',
      deskripsi: 'Simulasi bertingkat tanpa deadline untuk pemantapan standarisasi & kelulusan SD.',
    };
  }

  // 3. Cek Kelas 9 SMP
  const isSmp = k.includes('smp') || k.includes('mts') || j.includes('smp') || j.includes('mts');
  if (angka === 9 || (isSmp && (angka === 9 || k.includes('ix'))) || k.includes('9 smp') || k.includes('smp 9') || k.includes('kelas 9')) {
    return {
      jenjang: 'SMP',
      kelas: '9',
      kodeTarget: '9-SMP',
      namaUjian: 'TKA SMP (Pemantapan Kelulusan)',
      labelBadge: 'TKA SMP',
      subJudul: 'Ekspedisi Orbit TKA SMP',
      deskripsi: 'Simulasi bertahap penguasaan TKA Matematika & Bahasa Indonesia menuju SMA favorit.',
    };
  }

  // 4. Cek Kelas 12 SMA / SMK / Alumni / UTBK
  const isSma = k.includes('sma') || k.includes('smk') || k.includes('ma') || j.includes('sma') || j.includes('smk') || j.includes('ma') || k.includes('utbk') || k.includes('alumni') || k.includes('xii');
  if (angka === 12 || k.includes('xii') || (isSma && (angka === 12 || k.includes('xii') || k.includes('utbk') || k.includes('alumni'))) || k.includes('12 sma') || k.includes('sma 12') || k.includes('12 smk') || k.includes('kelas 12')) {
    return {
      jenjang: 'SMA',
      kelas: '12',
      kodeTarget: '12-SMA',
      namaUjian: 'UTBK-SNBT & TKA SMA',
      labelBadge: 'UTBK / TKA',
      subJudul: 'Ekspedisi Kosmik SNBT & TKA SMA',
      deskripsi: 'Simulasi bertingkat tanpa deadline persiapan lolos PTN & kedinasan impian.',
    };
  }

  // Fallback toleran jika siswa hanya mengisi angka murni
  if (angka === 6) {
    return {
      jenjang: 'SD',
      kelas: '6',
      kodeTarget: '6-SD',
      namaUjian: 'TKA SD (Asesmen Standarisasi)',
      labelBadge: 'TKA SD',
      subJudul: 'Misi Penjelajah TKA SD',
      deskripsi: 'Simulasi bertingkat tanpa deadline untuk pemantapan standarisasi & kelulusan SD.',
    };
  }
  if (angka === 9) {
    return {
      jenjang: 'SMP',
      kelas: '9',
      kodeTarget: '9-SMP',
      namaUjian: 'TKA SMP (Pemantapan Kelulusan)',
      labelBadge: 'TKA SMP',
      subJudul: 'Ekspedisi Orbit TKA SMP',
      deskripsi: 'Simulasi bertahap penguasaan TKA Matematika & Bahasa Indonesia menuju SMA favorit.',
    };
  }
  if (angka === 12) {
    return {
      jenjang: 'SMA',
      kelas: '12',
      kodeTarget: '12-SMA',
      namaUjian: 'UTBK-SNBT & TKA SMA',
      labelBadge: 'UTBK / TKA',
      subJudul: 'Ekspedisi Kosmik SNBT & TKA SMA',
      deskripsi: 'Simulasi bertingkat tanpa deadline persiapan lolos PTN & kedinasan impian.',
    };
  }

  return null;
}

/**
 * Memeriksa apakah sebuah paket merupakan paket try out otomatis yang diterbitkan AI/sistem.
 * Paket otomatis AI dialihkan ke menu "Jalur Ujian AI" (peta langkah kemampuan tanpa deadline).
 * Paket manual (ujian besar dari admin/guru) tetap di menu "Try Out Terjadwal" (dengan tanggal).
 */
export function isPaketOtomatisAi(paket) {
  if (!paket) return false;
  // 🔒 Jika paket berlabel ujian terjadwal, tryout akbar, atau naskah besar (>20 soal atau >35 menit),
  // maka paket tersebut BUKAN modul micro-learning roadmap, melainkan Try Out Terjadwal / Akbar.
  const nSoal = paket.daftarSoal?.length || paket.totalSoal || 0;
  const durasi = Number(paket.durasiMenit) || 0;
  if (nSoal > 20 || durasi > 35) return false;
  if (paket.isAkbar === true || paket.terjadwal === true || paket.eventAkbar === true) return false;

  if (paket.jalurUjianAi === true) return true;
  if (paket.microLearning === true) return true;
  if (paket.sumber === 'mesin-otomatis') return true;
  if (paket.otomatis === true) return true;
  if (Boolean(paket.templateId)) return true;
  return false;
}

/**
 * Memeriksa apakah sebuah paket merupakan paket manual terjadwal.
 */
export function isPaketManual(paket) {
  return !isPaketOtomatisAi(paket);
}

/**
 * Daftar Unit Misi bertingkat berdasarkan jenjang siswa.
 * Format jalur: dari bawah (Start / Unit 1) ke atas (Unit 4 / Review).
 */
export function getDaftarUnitJalurUjian(jenjang = 'SMP') {
  const j = String(jenjang).toUpperCase();

  // ------------------------------------------------------------
  // 🎒 1. JALUR UJIAN TKA SD (KELAS 6 / FASE C) — SUBTES MURNI 12-14 SOAL (20 MNT)
  // Dipisah tegas: Matematika dan Bahasa Indonesia TIDAK DICAMPUR
  // ------------------------------------------------------------
  if (j === 'SD') {
    return [
      {
        id: 'jalur-ai-sd-u1',
        unitNomor: 1,
        judul: 'Unit 1: TKA Matematika — Pecahan & Bilangan Rasional',
        subjudul: 'Pecahan Senilai, Bentuk Desimal & Operasi Hitung',
        tipe: 'start',
        mapel: 'TKA Matematika',
        subtesKode: 'MTK',
        kategoriSubtes: 'Matematika',
        polaFokus: 'Pecahan Senilai & Perbandingan Rasio',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 60,
        xpReward: 100,
        icon: 'Rocket',
        posisiAlign: 'center',
        deskripsi: 'Misi kilat 20 menit: taklukkan operasi hitung pecahan senilai dan perbandingan rasio bilangan.',
      },
      {
        id: 'jalur-ai-sd-u2',
        unitNomor: 2,
        judul: 'Unit 2: TKA Bahasa Indonesia — Fakta Wacana Tersurat',
        subjudul: 'Menemukan Fakta Kunci & Ide Tersurat dalam Teks Informasi',
        tipe: 'unit',
        mapel: 'TKA Bahasa Indonesia',
        subtesKode: 'BINDO',
        kategoriSubtes: 'Bahasa Indonesia',
        polaFokus: 'Teks Informasi & Fakta Tersurat',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 65,
        xpReward: 120,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: bedah wacana informasi dan temukan fakta kunci tanpa terkecoh opsi mirip.',
      },
      {
        id: 'jalur-ai-sd-u3',
        unitNomor: 3,
        judul: 'Unit 3: TKA Matematika — Geometri Keliling & Luas',
        subjudul: 'Bangun Datar Gabungan & Pemecahan Masalah Luas',
        tipe: 'unit',
        mapel: 'TKA Matematika',
        subtesKode: 'MTK',
        kategoriSubtes: 'Matematika',
        polaFokus: 'Geometri Keliling & Luas Bangun Datar',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 140,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: kuasai rumus luas/keliling bangun gabungan dengan pemotongan bidang cerdas.',
      },
      {
        id: 'jalur-ai-sd-u4',
        unitNomor: 4,
        judul: 'Unit 4: TKA Bahasa Indonesia — Sastra Fabel & Makna Tersirat',
        subjudul: 'Amanat Cerita, Watak Tokoh & Pesan Moral Fabel',
        tipe: 'unit',
        mapel: 'TKA Bahasa Indonesia',
        subtesKode: 'BINDO',
        kategoriSubtes: 'Bahasa Indonesia',
        polaFokus: 'Sastra Anak & Amanat Tersirat',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 160,
        icon: 'Award',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: temukan amanat tersembunyi dan watak tokoh fabel dengan jeli.',
      },
      {
        id: 'jalur-ai-sd-u5',
        unitNomor: 5,
        judul: 'Unit 5: TKA Matematika — Pengukuran Kecepatan & Debit',
        subjudul: 'Soal Cerita Jarak Waktu Kecepatan serta Debit Volume',
        tipe: 'unit',
        mapel: 'TKA Matematika',
        subtesKode: 'MTK',
        kategoriSubtes: 'Matematika',
        polaFokus: 'Satuan Kecepatan & Debit Aliran',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 75,
        xpReward: 180,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: modelkan kasus aliran debit dan susul-menyusul kecepatan tanpa bingung satuan.',
      },
      {
        id: 'jalur-ai-sd-u6',
        unitNomor: 6,
        judul: 'Unit 6: TKA Bahasa Indonesia — Ide Pokok & Simpulan Teks',
        subjudul: 'Menentukan Gagasan Utama Paragraf & Simpulan Akhir',
        tipe: 'unit',
        mapel: 'TKA Bahasa Indonesia',
        subtesKode: 'BINDO',
        kategoriSubtes: 'Bahasa Indonesia',
        polaFokus: 'Gagasan Utama & Simpulan Paragraf',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 75,
        xpReward: 200,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: kuasai teknik skimming untuk menyimpulkan ide pokok paragraf secara presisi.',
      },
      {
        id: 'jalur-ai-sd-u7',
        unitNomor: 7,
        judul: 'Unit 7: TKA Matematika — Pengolahan Data & Diagram',
        subjudul: 'Membaca Tabel, Diagram Batang, Garis & Rata-rata Nilai',
        tipe: 'unit',
        mapel: 'TKA Matematika',
        subtesKode: 'MTK',
        kategoriSubtes: 'Matematika',
        polaFokus: 'Statistika Tabel Diagram & Rata-rata',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 80,
        xpReward: 220,
        icon: 'Award',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: ekstrak informasi dari tabel/diagram dan hitung nilai mean secara kilat.',
      },
      {
        id: 'jalur-ai-sd-u8',
        unitNomor: 8,
        judul: 'Unit 8: Simulasi Terpadu Asesmen Standarisasi SD',
        subjudul: 'Simulasi Lengkap Matematika & Bahasa Indonesia Menuju SMP',
        tipe: 'unit',
        mapel: 'Simulasi Terpadu TKA SD',
        subtesKode: 'TERPADU',
        kategoriSubtes: 'Simulasi',
        polaFokus: 'Simulasi Terpadu Standarisasi SD',
        durasiMenit: 25,
        jumlahSoal: 14,
        passingGrade: 80,
        xpReward: 250,
        icon: 'Trophy',
        posisiAlign: 'left',
        deskripsi: 'Tantangan puncak 25 menit: simulasi gabungan standar Asesmen TKA SD untuk membuktikan kesiapan masuk SMP impian!',
      },
      {
        id: 'jalur-ai-sd-review',
        unitNomor: 9,
        judul: 'Radar Diagnosa TKA SD & Analisis Kelulusan',
        subjudul: 'Breakdown Penguasaan Matematika vs Bahasa Indonesia',
        tipe: 'review',
        posisiAlign: 'center',
        deskripsi: 'Analisis komprehensif performamu dari seluruh unit. Temukan kekuatanmu dan materi yang perlu ditingkatkan!',
      },
    ];
  }

  // ------------------------------------------------------------
  // 🎓 2. JALUR UJIAN UTBK-SNBT SMA (KELAS 12 / FASE F) — 7 SUBTES RESMI SNPMB
  // 100% PURE SUBTES: PU, PK, PBM, PPU, LBI, LBE, PM + SIMULASI TERPADU
  // ------------------------------------------------------------
  if (j === 'SMA' || j === 'SMK') {
    return [
      {
        id: 'jalur-ai-sma-u1',
        unitNomor: 1,
        judul: 'Unit 1: Penalaran Umum (PU)',
        subjudul: 'Penalaran Induktif, Deduktif & Logika Silogisme',
        tipe: 'start',
        mapel: 'Penalaran Umum (PU)',
        subtesKode: 'PU',
        kategoriSubtes: 'TPS',
        polaFokus: 'Logika Silogisme & Penalaran Analitis',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 60,
        xpReward: 120,
        icon: 'Rocket',
        posisiAlign: 'center',
        deskripsi: 'Misi kilat 20 menit: taklukkan logika deduktif, modus tollens, silogisme, dan pola deret analitis khas UTBK.',
      },
      {
        id: 'jalur-ai-sma-u2',
        unitNomor: 2,
        judul: 'Unit 2: Pengetahuan Kuantitatif (PK)',
        subjudul: 'Aljabar, Kuantitas P vs Q & Kecukupan Data (1) (2)',
        tipe: 'unit',
        mapel: 'Pengetahuan Kuantitatif (PK)',
        subtesKode: 'PK',
        kategoriSubtes: 'TPS',
        polaFokus: 'Aljabar & Kecukupan Data (1) (2)',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 65,
        xpReward: 140,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: kuasai format khas UTBK "apakah pernyataan cukup?" dan relasi nilai P vs Q.',
      },
      {
        id: 'jalur-ai-sma-u3',
        unitNomor: 3,
        judul: 'Unit 3: Pemahaman Bacaan & Menulis (PBM)',
        subjudul: 'Kaidah Ejaan Baku, Kalimat Efektif & Bentuk Rancu',
        tipe: 'unit',
        mapel: 'Pemahaman Bacaan & Menulis (PBM)',
        subtesKode: 'PBM',
        kategoriSubtes: 'TPS',
        polaFokus: 'Ejaan PUEBI & Kalimat Efektif',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 160,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: deteksi kesalahan penulisan kata, tanda baca, konjungsi intrakalimat, dan kalimat mubazir.',
      },
      {
        id: 'jalur-ai-sma-u4',
        unitNomor: 4,
        judul: 'Unit 4: Pengetahuan & Pemahaman Umum (PPU)',
        subjudul: 'Makna Kontekstual Kata, Sinonim, Antonim & Logika Kalimat',
        tipe: 'unit',
        mapel: 'Pengetahuan & Pemahaman Umum (PPU)',
        subtesKode: 'PPU',
        kategoriSubtes: 'TPS',
        polaFokus: 'Kosakata Kontekstual & Hubungan Paragraf',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 180,
        icon: 'Award',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: bongkar makna tersirat kata khusus, perumpamaan bahasa, dan koherensi antarparagraf.',
      },
      {
        id: 'jalur-ai-sma-u5',
        unitNomor: 5,
        judul: 'Unit 5: Literasi Bahasa Indonesia (LBI)',
        subjudul: 'Wacana Naratif, Argumentatif & Rekonstruksi Gagasan',
        tipe: 'unit',
        mapel: 'Literasi Bahasa Indonesia',
        subtesKode: 'LBI',
        kategoriSubtes: 'Literasi',
        polaFokus: 'Wacana Kritis & Rekonstruksi Gagasan',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 75,
        xpReward: 200,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: asah reading stamina pada teks panjang saintifik dan tarik inferensi akurat.',
      },
      {
        id: 'jalur-ai-sma-u6',
        unitNomor: 6,
        judul: 'Unit 6: Literasi Bahasa Inggris (LBE)',
        subjudul: 'Main Idea, Author Tone & Inferred Meaning',
        tipe: 'unit',
        mapel: 'Literasi Bahasa Inggris',
        subtesKode: 'LBE',
        kategoriSubtes: 'Literasi',
        polaFokus: 'Skimming Teks Akademis & Inferensi Bahasa Inggris',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 75,
        xpReward: 220,
        icon: 'Award',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: temukan ide pokok teks akademis berbahasa Inggris dan tebak maksud penulis secara cepat.',
      },
      {
        id: 'jalur-ai-sma-u7',
        unitNomor: 7,
        judul: 'Unit 7: Penalaran Matematika (PM)',
        subjudul: 'Pemodelan Kasus Cerita, Aritmetika Sosial & Data Realistis',
        tipe: 'unit',
        mapel: 'Penalaran Matematika (PM)',
        subtesKode: 'PM',
        kategoriSubtes: 'Literasi',
        polaFokus: 'Pemodelan Matematika Realistis & Soal Cerita',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 80,
        xpReward: 240,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: konversikan studi kasus kehidupan nyata menjadi model persamaan matematika solutif.',
      },
      {
        id: 'jalur-ai-sma-u8',
        unitNomor: 8,
        judul: 'Unit 8: Simulasi Terpadu 7 Subtes UTBK-SNBT',
        subjudul: 'Simulasi Mini Komprehensif Lengkap TPS & Tes Literasi',
        tipe: 'unit',
        mapel: 'Simulasi Terpadu 7 Subtes',
        subtesKode: 'TERPADU',
        kategoriSubtes: 'Simulasi',
        polaFokus: 'Simulasi Terpadu 7 Subtes Resmi SNPMB',
        durasiMenit: 25,
        jumlahSoal: 14,
        passingGrade: 80,
        xpReward: 300,
        icon: 'Trophy',
        posisiAlign: 'left',
        deskripsi: 'Tantangan puncak 25 menit: rangkum seluruh 7 subtes resmi SNPMB (2 soal per subtes) menuju kampus impian!',
      },
      {
        id: 'jalur-ai-sma-review',
        unitNomor: 9,
        judul: 'Radar Diagnosa 7 Subtes & Peluang Kampus',
        subjudul: 'Breakdown Skor PU, PK, PBM, PPU, LBI, LBE, PM',
        tipe: 'review',
        posisiAlign: 'center',
        deskripsi: 'Analisis komprehensif penguasaan 7 subtes UTBK-SNBT untuk mengukur peluang lolos PTN impian.',
      },
    ];
  }

  // ------------------------------------------------------------
  // 🏫 3. JALUR UJIAN TKA SMP (KELAS 9 / FASE D) — SUBTES MURNI 12-14 SOAL (20 MNT)
  // Dipisah tegas: Matematika dan Bahasa Indonesia TIDAK DICAMPUR
  // ------------------------------------------------------------
  return [
    {
      id: 'jalur-ai-smp-u1',
      unitNomor: 1,
      judul: 'Unit 1: TKA Matematika — Pola Bilangan & Aritmetika',
      subjudul: 'Bilangan Real, Pangkat, Bentuk Akar & Deret Aritmetika',
      tipe: 'start',
      mapel: 'TKA Matematika',
      subtesKode: 'MTK',
      kategoriSubtes: 'Matematika',
      polaFokus: 'Bilangan Real, Pangkat & Bentuk Akar',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 60,
      xpReward: 100,
      icon: 'Rocket',
      posisiAlign: 'center',
      deskripsi: 'Misi kilat 20 menit: taklukkan operasi akar, pangkat, dan pola bilangan real tanpa kesalahan hitung dasar.',
    },
    {
      id: 'jalur-ai-smp-u2',
      unitNomor: 2,
      judul: 'Unit 2: TKA Bahasa Indonesia — Membaca Fakta Tersurat',
      subjudul: 'Menemukan Informasi Pokok & Fakta Akurat pada Teks Laporan',
      tipe: 'unit',
      mapel: 'TKA Bahasa Indonesia',
      subtesKode: 'BINDO',
      kategoriSubtes: 'Bahasa Indonesia',
      polaFokus: 'Wacana Informasi & Fakta Tersurat',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 65,
      xpReward: 120,
      icon: 'BookOpen',
      posisiAlign: 'left',
      deskripsi: 'Misi kilat 20 menit: amankan fakta eksplisit pada bacaan laporan dan wacana analitis tanpa terkecoh opsi serupa.',
    },
    {
      id: 'jalur-ai-smp-u3',
      unitNomor: 3,
      judul: 'Unit 3: TKA Matematika — Kunci Aljabar & Relasi Fungsi',
      subjudul: 'PLSV, Pemfaktoran Aljabar & Perhitungan Nilai Fungsi',
      tipe: 'unit',
      mapel: 'TKA Matematika',
      subtesKode: 'MTK',
      kategoriSubtes: 'Matematika',
      polaFokus: 'Bentuk Aljabar, PLSV & Relasi Fungsi',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 70,
      xpReward: 140,
      icon: 'Sparkles',
      posisiAlign: 'right',
      deskripsi: 'Misi kilat 20 menit: bongkar aljabar linear, substitusi variabel, dan formula fungsi dengan langkah taktis.',
    },
    {
      id: 'jalur-ai-smp-u4',
      unitNomor: 4,
      judul: 'Unit 4: TKA Bahasa Indonesia — Teks Sastra & Makna Tersirat',
      subjudul: 'Amanat Fiksi, Unsur Intrinsik Cerpen & Makna Simbolik',
      tipe: 'unit',
      mapel: 'TKA Bahasa Indonesia',
      subtesKode: 'BINDO',
      kategoriSubtes: 'Bahasa Indonesia',
      polaFokus: 'Teks Sastra & Simpulan Tersirat',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 70,
      xpReward: 160,
      icon: 'Award',
      posisiAlign: 'left',
      deskripsi: 'Misi kilat 20 menit: simpulkan pesan tersembunyi pengarang dan bedah konflik batin tokoh dalam cerita.',
    },
    {
      id: 'jalur-ai-smp-u5',
      unitNomor: 5,
      judul: 'Unit 5: TKA Matematika — Geometri & Teorema Pythagoras',
      subjudul: 'Segitiga Siku-siku, Tripel Pythagoras & Sudut Garis',
      tipe: 'unit',
      mapel: 'TKA Matematika',
      subtesKode: 'MTK',
      kategoriSubtes: 'Matematika',
      polaFokus: 'Geometri Pengukuran & Tripel Pythagoras',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 75,
      xpReward: 180,
      icon: 'Sparkles',
      posisiAlign: 'right',
      deskripsi: 'Misi kilat 20 menit: kuasai tripel Pythagoras dan perhitungan sudut/sisi bangun geometri tanpa berbelit-belit.',
    },
    {
      id: 'jalur-ai-smp-u6',
      unitNomor: 6,
      judul: 'Unit 6: TKA Bahasa Indonesia — Fakta vs Opini & Resensi Kritis',
      subjudul: 'Membedakan Pernyataan Fakta, Opini Penulis & Resensi Buku',
      tipe: 'unit',
      mapel: 'TKA Bahasa Indonesia',
      subtesKode: 'BINDO',
      kategoriSubtes: 'Bahasa Indonesia',
      polaFokus: 'Fakta vs Opini & Resensi Kritis',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 75,
      xpReward: 200,
      icon: 'BookOpen',
      posisiAlign: 'left',
      deskripsi: 'Misi kilat 20 menit: evaluasi objektivitas teks dan bedakan kalimat fakta dari kalimat opini subjektif.',
    },
    {
      id: 'jalur-ai-smp-u7',
      unitNomor: 7,
      judul: 'Unit 7: TKA Matematika — Analisis Data Statistika & Peluang',
      subjudul: 'Ukuran Pemusatan Data, Diagram Batang & Titik Sampel',
      tipe: 'unit',
      mapel: 'TKA Matematika',
      subtesKode: 'MTK',
      kategoriSubtes: 'Matematika',
      polaFokus: 'Statistika Mean/Median & Peluang Kejadian',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 80,
      xpReward: 220,
      icon: 'Award',
      posisiAlign: 'right',
      deskripsi: 'Misi kilat 20 menit: analisis ukuran data statistik (mean, median) dan hitung peluang kejadian secara cepat.',
    },
    {
      id: 'jalur-ai-smp-u8',
      unitNomor: 8,
      judul: 'Unit 8: Simulasi Terpadu Prediksi TKA SMP 2026',
      subjudul: 'Kombinasi Pola HOTS ASPD/TKA Matematika & Bahasa Indonesia',
      tipe: 'unit',
      mapel: 'Simulasi Prediksi TKA SMP',
      subtesKode: 'TERPADU',
      kategoriSubtes: 'Simulasi',
      polaFokus: 'Simulasi Terpadu Matematika & Bahasa Indonesia',
      durasiMenit: 25,
      jumlahSoal: 14,
      passingGrade: 80,
      xpReward: 260,
      icon: 'Trophy',
      posisiAlign: 'left',
      deskripsi: 'Tantangan puncak 25 menit: uji reflek menghadapi simulasi kombinasi standar Asesmen TKA daerah menuju SMA unggulan!',
    },
    {
      id: 'jalur-ai-smp-review',
      unitNomor: 9,
      judul: 'Radar Diagnosa TKA SMP & Evaluasi Kelulusan',
      subjudul: 'Breakdown Penguasaan Matematika vs Bahasa Indonesia',
      tipe: 'review',
      posisiAlign: 'center',
      deskripsi: 'Analisis komprehensif kemampuan belajar dan panduan fokus materi menuju kelulusan cemerlang.',
    },
  ];
}

/**
 * Menghitung status progresi siswa di Jalur Ujian AI:
 * - Unit 1 selalu terbuka ('current' jika belum selesai, 'completed' jika sudah).
 * - Unit N terbuka jika Unit N-1 sudah berstatus 'selesai'.
 * - Siswa tidak akan pernah terhalang deadline tanggal; progres tersimpan permanen.
 */
export function hitungProgresiJalur(daftarUnit = [], sesiList = []) {
  // Map dari id paket atau unitId atau unitNomor ke sesi yang selesai
  const sesiSelesaiMap = new Map();
  sesiList.forEach((s) => {
    if (s.status === 'selesai') {
      if (s.paketId) sesiSelesaiMap.set(s.paketId, s);
      if (s.tryoutId) sesiSelesaiMap.set(s.tryoutId, s);
      if (s.unitId) sesiSelesaiMap.set(s.unitId, s);
      if (s.id) sesiSelesaiMap.set(s.id, s);
      // Hanya petakan unitNomor jika sesi memang eksplisit berasal dari Jalur Ujian AI / Roadmap
      if (s.jalurUjianAi && s.unitNomor != null) {
        sesiSelesaiMap.set(`unitNomor_${s.unitNomor}`, s);
      }
    }
  });

  let ditemukanAktif = false;
  let unitSelesaiCount = 0;

  const unitWithStatus = daftarUnit.map((unit) => {
    // Cek apakah unit ini sudah selesai
    const sesi = sesiSelesaiMap.get(unit.id)
      || (unit.paketIdAsli ? sesiSelesaiMap.get(unit.paketIdAsli) : null)
      || (unit.unitNomor ? sesiSelesaiMap.get(`unitNomor_${unit.unitNomor}`) : null);
    const sudahSelesai = Boolean(sesi);

    if (sudahSelesai) {
      unitSelesaiCount += 1;
      return {
        ...unit,
        status: 'completed',
        skor: sesi.totalSkorPersen ?? 0,
        xpDapat: sesi.xpFinal ?? 0,
        waktuSelesai: sesi.waktuSelesai || null,
        sesiId: sesi.id || null,
      };
    }

    // Jika belum ada yang aktif dan ini unit pertama yang belum selesai
    if (!ditemukanAktif) {
      ditemukanAktif = true;
      return {
        ...unit,
        status: 'current',
        skor: null,
      };
    }

    // Sisanya terkunci
    return {
      ...unit,
      status: 'locked',
      skor: null,
    };
  });

  return {
    unitList: unitWithStatus,
    totalUnit: daftarUnit.filter((u) => u.tipe !== 'review').length,
    selesaiCount: unitSelesaiCount,
    persentaseSelesai: Math.round((unitSelesaiCount / Math.max(1, daftarUnit.filter((u) => u.tipe !== 'review').length)) * 100),
  };
}

/**
 * Mengambil paket soal preset master terverifikasi per unit jika stok di Firestore belum mencukupi.
 * Perlindungan Anti-Zonk: Menjamin siswa tidak pernah mengalami try out kosong/error.
 */
export function getSoalPresetUnitRoadmap(jenjang = 'SMP', unitNomor = 1, targetJumlah = 12) {
  const j = String(jenjang).toUpperCase();

  // 1. TKA SD (Kelas 6) — Subtes Murni Matematika vs Bahasa Indonesia
  if (j === 'SD') {
    const mtk = Array.isArray(SOAL_TKA_2026_SD_MTK) ? SOAL_TKA_2026_SD_MTK : [];
    const indo = Array.isArray(SOAL_TKA_2026_SD_BINDO) ? SOAL_TKA_2026_SD_BINDO : [];

    if (unitNomor === 1) return mtk.slice(0, targetJumlah); // MTK Bilangan Pecahan
    if (unitNomor === 2) return indo.slice(0, targetJumlah); // BINDO Fakta Wacana
    if (unitNomor === 3) return mtk.slice(10, 10 + targetJumlah).length >= targetJumlah ? mtk.slice(10, 10 + targetJumlah) : [...mtk.slice(10), ...mtk.slice(0, targetJumlah - (mtk.length - 10))]; // MTK Geometri
    if (unitNomor === 4) return indo.slice(10, 10 + targetJumlah).length >= targetJumlah ? indo.slice(10, 10 + targetJumlah) : [...indo.slice(10), ...indo.slice(0, targetJumlah - (indo.length - 10))]; // BINDO Sastra Fabel
    if (unitNomor === 5) return mtk.slice(18, 18 + targetJumlah).length >= targetJumlah ? mtk.slice(18, 18 + targetJumlah) : [...mtk.slice(18), ...mtk.slice(0, targetJumlah - (mtk.length - 18))]; // MTK Kecepatan & Debit
    if (unitNomor === 6) return indo.slice(18, 18 + targetJumlah).length >= targetJumlah ? indo.slice(18, 18 + targetJumlah) : [...indo.slice(18), ...indo.slice(0, targetJumlah - (indo.length - 18))]; // BINDO Ide Pokok
    if (unitNomor === 7) return mtk.slice(6, 6 + targetJumlah); // MTK Statistika Data
    if (unitNomor === 8) {
      // Simulasi Terpadu Standarisasi SD (14 Soal: 7 MTK + 7 BINDO)
      return [...mtk.slice(0, 7), ...indo.slice(0, 7)].slice(0, targetJumlah);
    }
    return mtk.slice(0, targetJumlah);
  }

  // 2. UTBK-SNBT SMA (Kelas 12) — 7 Subtes Resmi SNPMB Murni
  if (j === 'SMA' || j === 'SMK') {
    const allUtbk = Array.isArray(SOAL_PRESET_UTBK) ? SOAL_PRESET_UTBK : [];
    // Pemetaan indeks 7 subtes UTBK Katkiel (160 butir):
    // PU (0..29), PPU (30..49), PBM (50..69), PK (70..89), LBI (90..119), LBE (120..139), PM (140..159)
    if (unitNomor === 1) return allUtbk.slice(0, targetJumlah); // PU: Penalaran Umum
    if (unitNomor === 2) return allUtbk.slice(70, 70 + targetJumlah); // PK: Pengetahuan Kuantitatif
    if (unitNomor === 3) return allUtbk.slice(50, 50 + targetJumlah); // PBM: Pemahaman Bacaan & Menulis
    if (unitNomor === 4) return allUtbk.slice(30, 30 + targetJumlah); // PPU: Pengetahuan & Pemahaman Umum
    if (unitNomor === 5) return allUtbk.slice(90, 90 + targetJumlah); // LBI: Literasi Bahasa Indonesia
    if (unitNomor === 6) return allUtbk.slice(120, 120 + targetJumlah); // LBE: Literasi Bahasa Inggris
    if (unitNomor === 7) return allUtbk.slice(140, 140 + targetJumlah); // PM: Penalaran Matematika
    if (unitNomor === 8) {
      // 14 Soal Simulasi Terpadu 7 Subtes (2 PU, 2 PK, 2 PBM, 2 PPU, 2 LBI, 2 LBE, 2 PM)
      return [
        ...allUtbk.slice(12, 14), // 2 PU
        ...allUtbk.slice(82, 84), // 2 PK
        ...allUtbk.slice(62, 64), // 2 PBM
        ...allUtbk.slice(42, 44), // 2 PPU
        ...allUtbk.slice(102, 104), // 2 LBI
        ...allUtbk.slice(132, 134), // 2 LBE
        ...allUtbk.slice(152, 154), // 2 PM
      ].slice(0, targetJumlah);
    }
    return allUtbk.slice(0, targetJumlah);
  }

  // 3. TKA SMP (Kelas 9) — Subtes Murni Matematika vs Bahasa Indonesia
  const mtkSmp = Array.isArray(SOAL_TKA_2026_SMP_MTK_PAKET_B) ? SOAL_TKA_2026_SMP_MTK_PAKET_B : [];
  const indoSmp = Array.isArray(SOAL_TKA_2026_SMP_BINDO_PAKET_A) ? SOAL_TKA_2026_SMP_BINDO_PAKET_A : [];

  if (unitNomor === 1) return mtkSmp.slice(0, targetJumlah); // MTK Bilangan Real & Aritmetika
  if (unitNomor === 2) return indoSmp.slice(0, targetJumlah); // BINDO Fakta Wacana Tersurat
  if (unitNomor === 3) return mtkSmp.slice(10, 10 + targetJumlah).length >= targetJumlah ? mtkSmp.slice(10, 10 + targetJumlah) : [...mtkSmp.slice(10), ...mtkSmp.slice(0, targetJumlah - (mtkSmp.length - 10))]; // MTK Aljabar & Fungsi
  if (unitNomor === 4) return indoSmp.slice(10, 10 + targetJumlah).length >= targetJumlah ? indoSmp.slice(10, 10 + targetJumlah) : [...indoSmp.slice(10), ...indoSmp.slice(0, targetJumlah - (indoSmp.length - 10))]; // BINDO Sastra & Makna Tersirat
  if (unitNomor === 5) return mtkSmp.slice(18, 18 + targetJumlah).length >= targetJumlah ? mtkSmp.slice(18, 18 + targetJumlah) : [...mtkSmp.slice(18), ...mtkSmp.slice(0, targetJumlah - (mtkSmp.length - 18))]; // MTK Geometri & Pythagoras
  if (unitNomor === 6) return indoSmp.slice(18, 18 + targetJumlah).length >= targetJumlah ? indoSmp.slice(18, 18 + targetJumlah) : [...indoSmp.slice(18), ...indoSmp.slice(0, targetJumlah - (indoSmp.length - 18))]; // BINDO Fakta vs Opini
  if (unitNomor === 7) return mtkSmp.slice(6, 6 + targetJumlah); // MTK Statistika & Peluang
  if (unitNomor === 8) {
    // Simulasi Terpadu Prediksi TKA SMP (14 Soal: 7 MTK + 7 BINDO)
    return [...mtkSmp.slice(0, 7), ...indoSmp.slice(0, 7)].slice(0, targetJumlah);
  }

  return mtkSmp.slice(0, targetJumlah);
}

/**
 * Memastikan dokumen paket di tryout_paket ada dan valid sebelum siswa mulai mengerjakan.
 * Mencegah problem "bank soal kosong saat kuis dibuka".
 * Perlindungan Berlapis: Firestore Bank Soal -> Master Preset -> Normalisasi Urut.
 */
export async function pastikanPaketUnitTersedia(db, unit, jenjang = 'SMP') {
  if (!db || !unit || unit.tipe === 'review') return null;

  try {
    const { doc, getDoc, setDoc, getDocs, collection, query, where, serverTimestamp } = await import('firebase/firestore');
    const paketRef = doc(db, 'tryout_paket', unit.id);
    const snap = await getDoc(paketRef);

    // Jika dokumen sudah ada dan berisi soal sesuai target micro-learning (tepat unit.jumlahSoal)
    if (snap.exists()) {
      const dataAda = snap.data();
      if (Array.isArray(dataAda.daftarSoal) && dataAda.daftarSoal.length === unit.jumlahSoal && dataAda.daftarSoal.length > 0) {
        return { id: snap.id, ...dataAda };
      }
    }

    // Jika belum ada atau jumlah soal lama tidak cocok (misal warisan template 40 butir lama)
    let bankSoal = [];
    try {
      const snapBank = await getDocs(
        query(collection(db, 'bank_soal'), where('status', '==', 'aktif'))
      );
      bankSoal = snapBank.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => layakUntukTryOut(s));
    } catch (e) {
      console.warn('Bank soal Firestore belum dapat dimuat, menggunakan preset master:', e);
    }

    // Saring soal sesuai jenjang
    const jenjangCocok = bankSoal.filter((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      return sj.includes(jenjang.toUpperCase());
    });

    // Ambil cadangan master preset terverifikasi (Anti-Zonk)
    const targetCount = unit.jumlahSoal || 12;
    const presetFallback = getSoalPresetUnitRoadmap(jenjang, unit.unitNomor, targetCount);

    let soalTerpilih = [];
    if (jenjangCocok.length >= targetCount) {
      soalTerpilih = jenjangCocok.slice(0, targetCount);
    } else {
      // Gabungkan bank soal yang ada dengan master preset hingga pas unit.jumlahSoal
      const existingIds = new Set(jenjangCocok.map((s) => s.id));
      const sisaDibutuhkan = targetCount - jenjangCocok.length;
      const pelengkap = presetFallback.filter((p) => !existingIds.has(p.id)).slice(0, sisaDibutuhkan);
      soalTerpilih = [...jenjangCocok, ...pelengkap];
      if (soalTerpilih.length < targetCount) {
        soalTerpilih = presetFallback.slice(0, targetCount);
      }
    }

    // Normalisasi nomor soal urut 1..N
    const soalFinal = soalTerpilih.map((s, idx) => ({
      ...s,
      nomor: idx + 1,
    }));

    const dataPaket = {
      nama: unit.judul,
      deskripsi: unit.deskripsi,
      jenjang: jenjang.toUpperCase(),
      targetKelas: jenjang.toUpperCase() === 'SD' ? '6 SD' : jenjang.toUpperCase() === 'SMP' ? '9 SMP' : '12 SMA',
      targetKategori: 'Semua',
      durasiMenit: unit.durasiMenit || 20,
      status: 'aktif',
      otomatis: false,
      jalurUjianAi: true,
      unitId: unit.id,
      unitNomor: unit.unitNomor,
      polaFokus: unit.polaFokus || '',
      soalAcak: false, // Pertahankan urutan pedagogis pola soal
      tampilkanPembahasan: true,
      antiCheatAktif: true,
      wajibKamera: false,
      daftarSoal: soalFinal,
      totalSoal: soalFinal.length,
      subtes: [
        {
          nama: unit.mapel || 'Subtes Utama',
          durasiMenit: unit.durasiMenit || 20,
          jumlahSoal: soalFinal.length,
        },
      ],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(paketRef, dataPaket, { merge: true });
    return { id: unit.id, ...dataPaket };
  } catch (e) {
    console.error('Gagal memastikan paket unit tersedia:', e);
    return null;
  }
}
