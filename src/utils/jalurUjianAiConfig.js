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

import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { layakUntukTryOut } from './layakTryOut.js';

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

  // 4. Cek Kelas 12 SMA / SMK
  const isSma = k.includes('sma') || k.includes('smk') || k.includes('ma') || j.includes('sma') || j.includes('smk') || j.includes('ma');
  if (angka === 12 || (isSma && (angka === 12 || k.includes('xii'))) || k.includes('12 sma') || k.includes('sma 12') || k.includes('12 smk') || k.includes('kelas 12')) {
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
  if (paket.jalurUjianAi === true) return true;
  if (paket.otomatis === true) return true;
  if (paket.sumber === 'mesin-otomatis') return true;
  if (Boolean(paket.templateId)) return true;
  const judul = String(paket.judul || '').toUpperCase();
  if (judul.includes('PEMAHAMAN TKA') || judul.includes('TRY OUT OTOMATIS')) return true;
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
  // 🎒 1. JALUR UJIAN TKA SD (KELAS 6 / FASE C) — 12-15 SOAL (15-20 MNT)
  // ------------------------------------------------------------
  if (j === 'SD') {
    return [
      {
        id: 'jalur-ai-sd-u1',
        unitNomor: 1,
        judul: 'Unit 1: Pola Pecahan & Bacaan Sastra Fabel',
        subjudul: 'Pecahan Senilai, Rasio & Amanat Cerita',
        tipe: 'start',
        mapel: 'Matematika Dasar & Teks Fiksi SD',
        polaFokus: 'Bilangan Rasional & Sastra Anak',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 60,
        xpReward: 100,
        icon: 'Rocket',
        posisiAlign: 'center',
        deskripsi: 'Misi kilat 20 menit: kuasai pola hitung pecahan senilai dan temukan amanat tersirat teks fabel anak.',
      },
      {
        id: 'jalur-ai-sd-u2',
        unitNomor: 2,
        judul: 'Unit 2: Pola Keliling, Luas & Fakta Wacana Tersurat',
        subjudul: 'Geometri Datar Gabungan & Teks Informasi',
        tipe: 'unit',
        mapel: 'Geometri Pengukuran & Wacana Informasi',
        polaFokus: 'Geometri Bidang & Fakta Tersurat',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 65,
        xpReward: 120,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: bedah rumus luas/keliling bangun datar gabungan dan tandai fakta tersurat.',
      },
      {
        id: 'jalur-ai-sd-u3',
        unitNomor: 3,
        judul: 'Unit 3: Pola Kecepatan, Debit & Ringkasan Ide Pokok',
        subjudul: 'Pengukuran Terapan & Gagasan Utama Paragraf',
        tipe: 'unit',
        mapel: 'Matematika Terapan & Ringkasan Bacaan',
        polaFokus: 'Pengukuran Debit/Kecepatan & Ide Pokok',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 140,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: taklukkan soal cerita debit/kecepatan dan simpulkan ide pokok paragraf dengan tepat.',
      },
      {
        id: 'jalur-ai-sd-u4',
        unitNomor: 4,
        judul: 'Unit 4: Pola Pengolahan Data & Makna Tersirat',
        subjudul: 'Diagram Batang, Piktogram & Kesimpulan Cerita',
        tipe: 'unit',
        mapel: 'Data Sederhana & Literasi Inferensial',
        polaFokus: 'Statistika Diagram & Makna Tersirat',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 75,
        xpReward: 160,
        icon: 'Award',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: baca data tabel/diagram dan tarik kesimpulan tersirat dari bacaan tanpa ragu.',
      },
      {
        id: 'jalur-ai-sd-u5',
        unitNomor: 5,
        judul: 'Unit 5: Pengayaan Penalaran HOTS Standarisasi SD',
        subjudul: 'Kombinasi Pola Problem Solving Menuju SMP Favorit',
        tipe: 'unit',
        mapel: 'TKA SD HOTS Matematika & Literasi',
        polaFokus: 'HOTS Problem Solving Standar Asesmen Daerah',
        durasiMenit: 25,
        jumlahSoal: 15,
        passingGrade: 80,
        xpReward: 200,
        icon: 'Trophy',
        posisiAlign: 'right',
        deskripsi: 'Tantangan pemantapan 25 menit: asah reflek menghadapi soal penalaran tingkat tinggi standar masuk SMP.',
      },
      {
        id: 'jalur-ai-sd-review',
        unitNomor: 6,
        judul: 'Review & Analisis Kelulusan SD',
        subjudul: 'Radar Penguasaan Materi & Rekomendasi Belajar',
        tipe: 'review',
        posisiAlign: 'center',
        deskripsi: 'Analisis komprehensif performamu dari seluruh unit. Temukan kekuatanmu dan materi yang perlu ditingkatkan!',
      },
    ];
  }

  // ------------------------------------------------------------
  // 🎓 2. JALUR UJIAN UTBK-SNBT SMA (KELAS 12 / FASE F) — 12-15 SOAL (18-20 MNT)
  // ------------------------------------------------------------
  if (j === 'SMA' || j === 'SMK') {
    return [
      {
        id: 'jalur-ai-sma-u1',
        unitNomor: 1,
        judul: 'Unit 1: Pola Aljabar Kuantitatif & Wacana Kritis',
        subjudul: 'Persamaan Linear, Fungsi Kuadrat & Ide Pokok Wacana',
        tipe: 'start',
        mapel: 'Pengetahuan Kuantitatif (PK) & Literasi B. Indonesia',
        polaFokus: 'Aljabar Fungsi & Wacana Kritis',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 60,
        xpReward: 120,
        icon: 'Rocket',
        posisiAlign: 'center',
        deskripsi: 'Misi kilat 20 menit: kuasai fungsi aljabar kuantitatif dan temukan argumen utama wacana analitis.',
      },
      {
        id: 'jalur-ai-sma-u2',
        unitNomor: 2,
        judul: 'Unit 2: Trik Kecukupan Data (1) & (2) + Silogisme PU',
        subjudul: 'Data Sufficiency Kuantitatif & Logika Deduktif',
        tipe: 'unit',
        mapel: 'Pengetahuan Kuantitatif & Penalaran Umum (PU)',
        polaFokus: 'Kecukupan Data & Penalaran Deduktif',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 65,
        xpReward: 140,
        icon: 'BookOpen',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: kuasai format khas UTBK "apakah pernyataan cukup?" dengan trik cepat tanpa hitung panjang.',
      },
      {
        id: 'jalur-ai-sma-u3',
        unitNomor: 3,
        judul: 'Unit 3: Pola Soal Cerita PM & Struktur Baku PBM',
        subjudul: 'Penalaran Matematika Kontekstual & Ejaan Bahasa',
        tipe: 'unit',
        mapel: 'Penalaran Matematika (PM) & PBM',
        polaFokus: 'Matematika Kontekstual & Kaidah Baku PBM',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 160,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: modelkan kasus perbandingan bertingkat dan bedah kalimat rancu standar PBM.',
      },
      {
        id: 'jalur-ai-sma-u4',
        unitNomor: 4,
        judul: 'Unit 4: Barisan, Deret & Literasi Bahasa Inggris',
        subjudul: 'Pola Aritmetika Lanjutan & Main Idea Teks Akademis',
        tipe: 'unit',
        mapel: 'Penalaran Kuantitatif & Literasi B. Inggris',
        polaFokus: 'Deret Angka & Skimming Teks Inggris',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 70,
        xpReward: 180,
        icon: 'Award',
        posisiAlign: 'left',
        deskripsi: 'Misi kilat 20 menit: temukan pola suku ke-n deret dan kuasai strategi skimming wacana bahasa Inggris.',
      },
      {
        id: 'jalur-ai-sma-u5',
        unitNomor: 5,
        judul: 'Unit 5: Kuantitas P vs Q & Analitis HOTS',
        subjudul: 'Membandingkan Nilai P & Q serta Penarikan Kesimpulan',
        tipe: 'unit',
        mapel: 'Pengetahuan Kuantitatif & Penalaran Analitis',
        polaFokus: 'Relasi Kuantitas P vs Q & Logika Analitis',
        durasiMenit: 20,
        jumlahSoal: 12,
        passingGrade: 75,
        xpReward: 200,
        icon: 'Sparkles',
        posisiAlign: 'right',
        deskripsi: 'Misi kilat 20 menit: tentukan hubungan kuantitas P dan Q dengan teknik substitusi eliminasi kilat.',
      },
      {
        id: 'jalur-ai-sma-u6',
        unitNomor: 6,
        judul: 'Unit 6: Pengayaan Terpadu 7 Subtes Skolastik SNBT',
        subjudul: 'Kombinasi Pola HOTS TPS & Tes Literasi Lengkap',
        tipe: 'unit',
        mapel: 'Simulasi Terpadu 7 Subtes UTBK',
        polaFokus: 'HOTS Terintegrasi Standar SNPMB',
        durasiMenit: 25,
        jumlahSoal: 15,
        passingGrade: 80,
        xpReward: 250,
        icon: 'Trophy',
        posisiAlign: 'left',
        deskripsi: 'Tantangan puncak 25 menit: rangkum seluruh spektrum 7 subtes UTBK-SNBT menuju kampus impian!',
      },
      {
        id: 'jalur-ai-sma-review',
        unitNomor: 7,
        judul: 'Review & Analisis SNBT Kampus',
        subjudul: 'Peluang Lolos Jurusan Impian & Rekomendasi Materi',
        tipe: 'review',
        posisiAlign: 'center',
        deskripsi: 'Analisis komprehensif seluruh subtes untuk memaksimalkan peluang lolos SNBT.',
      },
    ];
  }

  // ------------------------------------------------------------
  // 🏫 3. JALUR UJIAN TKA SMP (KELAS 9 / FASE D) — 12-15 SOAL (20 MNT)
  // ------------------------------------------------------------
  return [
    {
      id: 'jalur-ai-smp-u1',
      unitNomor: 1,
      judul: 'Unit 1: Pola Aritmetika, Akar & Wacana Tersurat',
      subjudul: 'Bilangan Real, Bentuk Akar & Fakta Teks Laporan',
      tipe: 'start',
      mapel: 'Matematika Bilangan & Teks Informasi',
      polaFokus: 'Bilangan Real & Fakta Tersurat',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 60,
      xpReward: 100,
      icon: 'Rocket',
      posisiAlign: 'center',
      deskripsi: 'Misi kilat 20 menit: taklukkan operasi akar/pangkat dan amankan fakta langsung pada wacana laporan tanpa ragu.',
    },
    {
      id: 'jalur-ai-smp-u2',
      unitNomor: 2,
      judul: 'Unit 2: Kunci Aljabar & Trik Distraktor Negasi',
      subjudul: 'PLSV, Pemfaktoran & Kalimat Bertolak Belakang',
      tipe: 'unit',
      mapel: 'Aljabar Dasar & Wacana Analitis',
      polaFokus: 'Aljabar & Distraktor Kata Negasi',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 65,
      xpReward: 120,
      icon: 'BookOpen',
      posisiAlign: 'left',
      deskripsi: 'Misi kilat 20 menit: bongkar aljabar dasar dan latih ketelitian membedakan opsi jebakan "kecuali/bukan".',
    },
    {
      id: 'jalur-ai-smp-u3',
      unitNomor: 3,
      judul: 'Unit 3: Pola Geometri Pythagoras & Makna Tersirat',
      subjudul: 'Segitiga, Sudut & Menarik Kesimpulan Paragraf',
      tipe: 'unit',
      mapel: 'Geometri Pengukuran & Literasi Tersirat',
      polaFokus: 'Pythagoras Sudut & Informasi Tersirat',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 70,
      xpReward: 140,
      icon: 'Sparkles',
      posisiAlign: 'right',
      deskripsi: 'Misi kilat 20 menit: kuasai tripel Pythagoras dan simpulkan maksud tersembunyi penulis teks dengan jeli.',
    },
    {
      id: 'jalur-ai-smp-u4',
      unitNomor: 4,
      judul: 'Unit 4: Pola Soal Cerita SPLDV & Menilai Opini',
      subjudul: 'Sistem Persamaan Dua Variabel & Evaluasi Gagasan',
      tipe: 'unit',
      mapel: 'Aljabar Terapan & Evaluasi Teks',
      polaFokus: 'SPLDV Kontekstual & Fakta vs Opini',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 70,
      xpReward: 160,
      icon: 'Award',
      posisiAlign: 'left',
      deskripsi: 'Misi kilat 20 menit: modelkan cerita toko/tarif menjadi SPLDV dan pisahkan fakta dari opini penulis.',
    },
    {
      id: 'jalur-ai-smp-u5',
      unitNomor: 5,
      judul: 'Unit 5: Analisis Data, Peluang & Refleksi Bahasa',
      subjudul: 'Mean, Median, Diagram & Menanggapi Isi Teks',
      tipe: 'unit',
      mapel: 'Statistika Peluang & Tanggapan Kritis',
      polaFokus: 'Data Peluang & Refleksi Teks',
      durasiMenit: 20,
      jumlahSoal: 12,
      passingGrade: 75,
      xpReward: 180,
      icon: 'Sparkles',
      posisiAlign: 'right',
      deskripsi: 'Misi kilat 20 menit: analisis ukuran data statistik dan tanggapi sudut pandang bacaan secara kritis.',
    },
    {
      id: 'jalur-ai-smp-u6',
      unitNomor: 6,
      judul: 'Unit 6: Pengayaan Variasi Naskah Asli TKA SMP',
      subjudul: 'Kombinasi Pola HOTS ASPD/TKA Matematika & B. Indo',
      tipe: 'unit',
      mapel: 'TKA SMP Naskah Asli Terpadu',
      polaFokus: 'Kombinasi Soal Ujian Asli Standar Daerah',
      durasiMenit: 25,
      jumlahSoal: 15,
      passingGrade: 80,
      xpReward: 220,
      icon: 'Trophy',
      posisiAlign: 'left',
      deskripsi: 'Tantangan pemantapan 25 menit: uji reflek menghadapi soal kombinasi standar Asesmen TKA daerah.',
    },
    {
      id: 'jalur-ai-smp-review',
      unitNomor: 7,
      judul: 'Review & Analisis Kelulusan SMP',
      subjudul: 'Pemetaan Daya Saing Masuk SMA/SMK Favorit',
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
  // Map dari id paket atau unitId ke sesi yang selesai
  const sesiSelesaiMap = new Map();
  sesiList.forEach((s) => {
    if (s.status === 'selesai') {
      if (s.paketId) sesiSelesaiMap.set(s.paketId, s);
      if (s.tryoutId) sesiSelesaiMap.set(s.tryoutId, s);
      if (s.unitId) sesiSelesaiMap.set(s.unitId, s);
    }
  });

  let ditemukanAktif = false;
  let unitSelesaiCount = 0;

  const unitWithStatus = daftarUnit.map((unit, idx) => {
    // Cek apakah unit ini sudah selesai
    const sesi = sesiSelesaiMap.get(unit.id) || (unit.paketIdAsli ? sesiSelesaiMap.get(unit.paketIdAsli) : null);
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
 * Memastikan dokumen paket di tryout_paket ada dan valid sebelum siswa mulai mengerjakan.
 * Mencegah problem "bank soal kosong saat kuis dibuka".
 */
export async function pastikanPaketUnitTersedia(db, unit, jenjang = 'SMP') {
  if (!db || !unit || unit.tipe === 'review') return null;

  try {
    const paketRef = doc(db, 'tryout_paket', unit.id);
    const { getDoc } = await import('firebase/firestore');
    const snap = await getDoc(paketRef);

    if (snap.exists() && snap.data().daftarSoal?.length > 0) {
      return { id: snap.id, ...snap.data() };
    }

    // Jika paket belum ada, kita ambil dari bank_soal sesuai jenjang
    const snapBank = await getDocs(
      query(collection(db, 'bank_soal'), where('status', '==', 'aktif'))
    );

    const bankSoal = snapBank.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((s) => layakUntukTryOut(s));

    // Saring soal sesuai jenjang
    const jenjangCocok = bankSoal.filter((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      return sj.includes(jenjang.toUpperCase());
    });

    // Ambil sejumlah soal unit (misal 30 soal)
    const soalTerpilih = (jenjangCocok.length >= unit.jumlahSoal ? jenjangCocok : bankSoal)
      .slice(0, unit.jumlahSoal);

    const dataPaket = {
      nama: unit.judul,
      deskripsi: unit.deskripsi,
      jenjang: jenjang.toUpperCase(),
      targetKelas: jenjang.toUpperCase() === 'SD' ? '6 SD' : jenjang.toUpperCase() === 'SMP' ? '9 SMP' : '12 SMA',
      targetKategori: 'Semua',
      durasiMenit: unit.durasiMenit || 60,
      status: 'aktif',
      otomatis: false,
      jalurUjianAi: true,
      unitId: unit.id,
      unitNomor: unit.unitNomor,
      soalAcak: true,
      tampilkanPembahasan: true,
      antiCheatAktif: true,
      wajibKamera: false,
      daftarSoal: soalTerpilih,
      totalSoal: soalTerpilih.length,
      subtes: [
        {
          nama: unit.mapel || 'Subtes Utama',
          durasiMenit: unit.durasiMenit || 60,
          jumlahSoal: soalTerpilih.length,
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
