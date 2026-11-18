// src/data/ambisLatihanBankSoal.js
// ==============================================================================
// BANK SOAL & SISTEM LATIHAN AMBIS PTN 1:1 UNTUK UTBK-SNBT 2027
// Mengadopsi struktur resmi AmbisPTN Practice (https://ambisptn.com/practice)
//
// 1. 7 Subtes Resmi SNPMB Murni (TIDAK DICAMPUR ANTARA MTK DAN BAHASA):
//    - PU   : Penalaran Umum
//    - PPU  : Pengetahuan & Pemahaman Umum
//    - PBM  : Pemahaman Bacaan & Menulis
//    - PK   : Pengetahuan Kuantitatif
//    - LBIN : Literasi Bahasa Indonesia
//    - LBING: Literasi Bahasa Inggris
//    - PM   : Penalaran Matematika
//
// 2. Format Pengerjaan:
//    - Active Recall (Soal salah diulang di akhir sesi hingga tuntas)
//    - Basic (Simulasi standar, pembahasan instan)
//    - Ukuran paket adaptif: 10 butir soal per sesi (micro-learning 15-20 menit)
// ==============================================================================

import { DAFTAR_SUBTES_MODUL, SEMUA_BAB_MODUL } from './ambisModulUtbkData.js';
import { SOAL_PRESET_UTBK } from './utbk2026KatkielData.js';
import { tambahXpMingguan } from '../utils/mingguIni.js';

// Normalisasi subtes dari kode modul / preset
const PETA_KODE_SUBTES = {
  PU: 'PU',
  'Penalaran Umum (PU)': 'PU',
  'Penalaran Umum': 'PU',
  PPU: 'PPU',
  'Pengetahuan & Pemahaman Umum (PPU)': 'PPU',
  'Pengetahuan & Pemahaman Umum': 'PPU',
  PBM: 'PBM',
  'Pemahaman Bacaan & Menulis (PBM)': 'PBM',
  'Pemahaman Bacaan & Menulis': 'PBM',
  PK: 'PK',
  'Pengetahuan Kuantitatif (PK)': 'PK',
  'Pengetahuan Kuantitatif': 'PK',
  LBIN: 'LBIN',
  LBI: 'LBIN',
  'Literasi Bahasa Indonesia (LBI)': 'LBIN',
  'Literasi Bahasa Indonesia': 'LBIN',
  LBING: 'LBING',
  LBE: 'LBING',
  'Literasi Bahasa Inggris (LBE)': 'LBING',
  'Literasi Bahasa Inggris': 'LBING',
  PM: 'PM',
  'Penalaran Matematika (PM)': 'PM',
  'Penalaran Matematika': 'PM',
};

// 1. Metadata 7 Subtes Resmi SNPMB (Gaya AmbisPTN)
export const DAFTAR_SUBTES_LATIHAN = [
  {
    kode: 'PU',
    nama: 'Penalaran Umum',
    singkatan: 'PU',
    rumpun: 'TPS',
    badgeWarna: '#0d9488',
    warnaHover: '#0f766e',
    bgLight: '#f0fdfa',
    borderWarna: '#99f6e4',
    emoji: '🧠',
    deskripsi: 'Logika silogisme, penalaran induktif-deduktif, barisan pola angka/huruf, dan analisis posisi urutan.',
    kisiKisi: ['Logika Deduktif & Silogisme', 'Pola Barisan Angka & Huruf', 'Penalaran Analitis Posisi', 'Sebab-Akibat & Kesimpulan Wacana'],
  },
  {
    kode: 'PPU',
    nama: 'Pengetahuan & Pemahaman Umum',
    singkatan: 'PPU',
    rumpun: 'TPS',
    badgeWarna: '#2563eb',
    warnaHover: '#1d4ed8',
    bgLight: '#eff6ff',
    borderWarna: '#bfdbfe',
    emoji: '📖',
    deskripsi: 'Makna kata kontekstual, sinonim antonim akademis, kaidah afiksasi, dan inferensi koherensi wacana.',
    kisiKisi: ['Makna Kontekstual Kata', 'Kaidah Afiksasi (KTSP)', 'Hubungan Antarparagraf', 'Sikap & Nada Penulis'],
  },
  {
    kode: 'PBM',
    nama: 'Pemahaman Bacaan & Menulis',
    singkatan: 'PBM',
    rumpun: 'TPS',
    badgeWarna: '#7c3aed',
    warnaHover: '#6d28d9',
    bgLight: '#f5f3ff',
    borderWarna: '#ddd6fe',
    emoji: '✍️',
    deskripsi: 'Pedoman EYD V, kalimat efektif & kehematan kata, fungsi sintaksis SPOK-Pel, dan tanda baca presisi.',
    kisiKisi: ['Ejaan EYD V & Huruf Kapital', 'Kalimat Efektif & SPOK', 'Konjungsi Intrakalimat & Antarkalimat', 'Paragraf Kohesif & Bentuk Rancu'],
  },
  {
    kode: 'PK',
    nama: 'Pengetahuan Kuantitatif',
    singkatan: 'PK',
    rumpun: 'TPS',
    badgeWarna: '#ea580c',
    warnaHover: '#c2410c',
    bgLight: '#fff7ed',
    borderWarna: '#fed7aa',
    emoji: '🔢',
    deskripsi: 'Aljabar fungsi, sistem persamaan, geometri bidang datar, relasi nilai P vs Q, dan kecukupan data (1)(2).',
    kisiKisi: ['Aljabar & Fungsi Kuadrat', 'Geometri Bidang Datar & Ruang', 'Relasi Nilai P vs Q', 'Kecukupan Data Pernyataan (1) & (2)'],
  },
  {
    kode: 'LBIN',
    nama: 'Literasi Bahasa Indonesia',
    singkatan: 'LBIN',
    rumpun: 'Literasi',
    badgeWarna: '#059669',
    warnaHover: '#047857',
    bgLight: '#ecfdf5',
    borderWarna: '#a7f3d0',
    emoji: '🇮🇩',
    deskripsi: 'Membedah teks eksplanasi ilmiah & opini, mengevaluasi argumen, serta membaca grafik/infografik kompleks.',
    kisiKisi: ['Wacana Analitis Panjang', 'Mengevaluasi Opini & Bias Penulis', 'Inferensi Data Grafik / Infografik', 'Rekonstruksi Gagasan Utama'],
  },
  {
    kode: 'LBING',
    nama: 'Literasi Bahasa Inggris',
    singkatan: 'LBING',
    rumpun: 'Literasi',
    badgeWarna: '#0891b2',
    warnaHover: '#0e7490',
    bgLight: '#ecfeff',
    borderWarna: '#a5f3fc',
    emoji: '🇬🇧',
    deskripsi: 'Main ideas, author tone, specific factual details, contextual vocabulary, and inferred conclusions.',
    kisiKisi: ['Main Idea & Primary Purpose', 'Vocabulary in Academic Context', 'Tone & Author Attitude', 'Critical Reading Inference'],
  },
  {
    kode: 'PM',
    nama: 'Penalaran Matematika',
    singkatan: 'PM',
    rumpun: 'Literasi',
    badgeWarna: '#e11d48',
    warnaHover: '#be123c',
    bgLight: '#fff1f2',
    borderWarna: '#fecdd3',
    emoji: '📐',
    deskripsi: 'Aritmetika sosial finansial, laju kecepatan & debit, pemodelan sistem optimasi, dan probabilitas risiko.',
    kisiKisi: ['Aritmetika Sosial & Bunga Majemuk', 'Laju Perpindahan Jarak & Debit', 'Pemodelan Fungsi Realistis', 'Peluang & Analisis Risiko Kasus'],
  },
];

// Helper normalisasi butir soal
function normalisasiButir(item, fallbackSubtes = 'PU', fallbackTopik = 'Umum', idx = 1) {
  const subtesKasar = item.subtesKode || item.mapel || item.subtes || fallbackSubtes;
  const kodeSubtes = PETA_KODE_SUBTES[subtesKasar] || fallbackSubtes;
  const topik = item.subkategori || item.topik || fallbackTopik || 'Latihan Subtes';

  // Normalisasi opsi jawaban ke format A, B, C, D, E
  let opsiArray = [];
  if (Array.isArray(item.opsiJawaban) && item.opsiJawaban.length > 0) {
    opsiArray = item.opsiJawaban.map((o) => ({
      label: String(o.key || o.label || '').toUpperCase(),
      text: String(o.teks || o.text || ''),
    }));
  } else if (Array.isArray(item.opsi) && item.opsi.length > 0) {
    opsiArray = item.opsi.map((o) => ({
      label: String(o.label || o.key || '').toUpperCase(),
      text: String(o.text || o.teks || ''),
    }));
  } else if (Array.isArray(item.pilihan) && item.pilihan.length > 0) {
    opsiArray = item.pilihan.map((o, oIdx) => {
      if (typeof o === 'string') {
        const huruf = ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A';
        return { label: huruf, text: o };
      }
      return {
        label: String(o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
        text: String(o.text || o.teks || ''),
      };
    });
  }

  const kunci = String(item.kunciJawaban || item.kunci || item.jawabanBenar || 'A').toUpperCase();
  const teksPertanyaan = item.teksSoal || item.soal || item.pertanyaan || '';
  const pembahasan = item.pembahasan || 'Pembahasan terperinci mengacu pada kaidah dan konsep inti materi.';

  return {
    id: item.id || `latihan_${kodeSubtes.toLowerCase()}_${idx}`,
    subtesKode: kodeSubtes,
    topik,
    soal: teksPertanyaan,
    wacana: item.wacana || item.stimulus || null,
    opsi: opsiArray,
    kunci,
    pembahasan,
    tingkatKesulitan: item.tingkatKesulitan || (idx % 3 === 0 ? 'sulit' : idx % 2 === 0 ? 'sedang' : 'mudah'),
  };
}

// 2. Bangun Bank Soal Latihan Mandiri Terpadu
function susunBankSoalLatihan() {
  const bank = [];
  let counter = 1;

  // A. Tambahkan dari SOAL_PRESET_UTBK (160 butir soal)
  if (Array.isArray(SOAL_PRESET_UTBK)) {
    SOAL_PRESET_UTBK.forEach((s) => {
      const b = normalisasiButir(s, 'PU', s.subkategori || 'Preset UTBK Katkiel', counter++);
      bank.push(b);
    });
  }

  // B. Tambahkan dari 46 Bab Modul UTBK (230 butir kuis pemahaman)
  if (Array.isArray(DAFTAR_SUBTES_MODUL)) {
    DAFTAR_SUBTES_MODUL.forEach((st) => {
      const kode = st.kode;
      (st.babList || []).forEach((bab) => {
        const judulBab = bab.judul || 'Materi Modul';
        (bab.kuisPemahaman || []).forEach((k) => {
          const b = normalisasiButir(
            { ...k, subtesKode: kode, topik: judulBab },
            kode,
            judulBab,
            counter++
          );
          bank.push(b);
        });
      });
    });
  }

  return bank;
}

export const BANK_SOAL_LATIHAN_UTBK = susunBankSoalLatihan();

// 3. Ambil Bank Soal Khusus 1 Subtes
export function getBankSoalPerSubtes(subtesKode) {
  const k = String(subtesKode || '').toUpperCase();
  const kodeBersih = PETA_KODE_SUBTES[k] || k;
  return BANK_SOAL_LATIHAN_UTBK.filter((s) => s.subtesKode === kodeBersih);
}

// 4. Bagi Bank Soal menjadi Paket Micro-Learning (10 butir per paket)
export function getPaketLatihanPerSubtes(subtesKode, ukuranPaket = 10) {
  const soalSubtes = getBankSoalPerSubtes(subtesKode);
  const paketList = [];
  const total = soalSubtes.length;
  const nPaket = Math.max(1, Math.ceil(total / ukuranPaket));

  for (let i = 0; i < nPaket; i++) {
    const start = i * ukuranPaket;
    const sliceSoal = soalSubtes.slice(start, start + ukuranPaket);
    if (sliceSoal.length > 0) {
      paketList.push({
        id: `paket_${subtesKode.toLowerCase()}_bagian_${i + 1}`,
        paketNomor: i + 1,
        judul: `Paket Latihan Bagian ${i + 1}`,
        subjudul: `${sliceSoal.length} Butir Soal Terstruktur`,
        subtesKode,
        jumlahSoal: sliceSoal.length,
        durasiMenit: Math.max(10, Math.round(sliceSoal.length * 1.5)),
        soalList: sliceSoal,
      });
    }
  }

  return paketList;
}

// 5. Generator Latihan Kilat (Quick Play) 10 Soal Acak
export function getSoalLatihanKilat(subtesKode = 'PU', jumlah = 10, modeKesulitan = 'campur') {
  const soalSubtes = getBankSoalPerSubtes(subtesKode);
  if (soalSubtes.length === 0) return [];

  let terfilter = [...soalSubtes];
  if (modeKesulitan !== 'campur') {
    const k = terfilter.filter((s) => s.tingkatKesulitan === modeKesulitan);
    if (k.length >= 5) {
      terfilter = k;
    }
  }

  // Acak urutan (Fisher-Yates Shuffle)
  const acak = [...terfilter];
  for (let i = acak.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [acak[i], acak[j]] = [acak[j], acak[i]];
  }

  return acak.slice(0, Math.min(jumlah, acak.length));
}

// 6. Progres & Statistik Latihan Siswa (Isolasi Ketat Per Siswa)
// Fallback in-memory jika di lingkungan non-browser (misal testing di Node atau SSR)
const memoriFallbackStorage = new Map();

export function getKunciPenyimpananLatihan(studentId) {
  const sid = studentId || (typeof localStorage !== 'undefined' ? localStorage.getItem('studentId') || localStorage.getItem('studentNim') || 'tamu' : 'tamu');
  return `gemilang_practice_progress_${sid}`;
}

export function bacaProgresLatihanSiswa(studentId) {
  const kunci = getKunciPenyimpananLatihan(studentId);
  if (typeof localStorage === 'undefined') {
    const raw = memoriFallbackStorage.get(kunci);
    return raw ? JSON.parse(raw) : {};
  }
  try {
    const dataRaw = localStorage.getItem(kunci);
    return dataRaw ? JSON.parse(dataRaw) : {};
  } catch (err) {
    console.warn('Gagal membaca progres latihan siswa:', err);
    return {};
  }
}

/**
 * Menghitung rekapitulasi progres per 7 subtes untuk ditampilkan di kartu latihan AmbisPTN
 */
export function hitungStatistikLatihanSiswa(studentId) {
  const progres = bacaProgresLatihanSiswa(studentId);
  const hariIniStr = new Date().toISOString().slice(0, 10);

  const rekapSubtes = {};
  let totalSoalDikerjakanSemua = 0;
  let totalBenarSemua = 0;
  let totalSesiTuntas = 0;

  DAFTAR_SUBTES_LATIHAN.forEach((st) => {
    const dataSt = progres[st.kode] || {};
    const bankSubtes = getBankSoalPerSubtes(st.kode);
    const totalBank = bankSubtes.length;
    const soalDikerjakanSet = new Set(dataSt.soalDikerjakanIds || []);
    const dikerjakanCount = soalDikerjakanSet.size;
    const benarCount = dataSt.totalBenar || 0;
    const akurasiPersen = dikerjakanCount > 0 ? Math.round((benarCount / dikerjakanCount) * 100) : 0;
    const dilatihHariIni = Boolean(dataSt.terakhirLatihanTanggal === hariIniStr);

    totalSoalDikerjakanSemua += dikerjakanCount;
    totalBenarSemua += benarCount;
    totalSesiTuntas += dataSt.sesiSelesaiCount || 0;

    rekapSubtes[st.kode] = {
      subtesKode: st.kode,
      nama: st.nama,
      singkatan: st.singkatan,
      totalBankSoal: totalBank,
      soalDikerjakan: dikerjakanCount,
      benarCount,
      akurasiPersen,
      dilatihHariIni,
      terakhirLatihanTanggal: dataSt.terakhirLatihanTanggal || null,
      levelPenguasaan: akurasiPersen >= 80 ? 'Tinggi' : akurasiPersen >= 60 ? 'Sedang' : 'Perlu Pemantapan',
    };
  });

  return {
    rekapSubtes,
    totalSoalDikerjakanSemua,
    totalBenarSemua,
    totalSesiTuntas,
    akurasiGlobal: totalSoalDikerjakanSemua > 0 ? Math.round((totalBenarSemua / totalSoalDikerjakanSemua) * 100) : 0,
  };
}

/**
 * Menyimpan hasil sesi latihan yang baru diselesaikan
 */
export function simpanHasilSesiLatihan({
  studentId,
  subtesKode,
  paketId,
  mode = 'Active Recall',
  soalList = [],
  jawabanMap = {},
  benarCount = 0,
  durasiDetik = 0,
}) {
  try {
    const kunci = getKunciPenyimpananLatihan(studentId);
    const progres = bacaProgresLatihanSiswa(studentId);
    const kode = String(subtesKode || 'PU').toUpperCase();
    const stProgres = progres[kode] || {
      soalDikerjakanIds: [],
      totalBenar: 0,
      totalSalah: 0,
      sesiSelesaiCount: 0,
      terakhirLatihanTanggal: null,
      riwayatSesi: [],
    };

    const hariIniStr = new Date().toISOString().slice(0, 10);
    const idSet = new Set(stProgres.soalDikerjakanIds || []);
    soalList.forEach((s) => {
      if (s.id) idSet.add(s.id);
    });

    const xpDapat = benarCount * 10;
    stProgres.soalDikerjakanIds = Array.from(idSet);
    stProgres.totalBenar = (stProgres.totalBenar || 0) + benarCount;
    stProgres.totalSalah = (stProgres.totalSalah || 0) + (soalList.length - benarCount);
    stProgres.sesiSelesaiCount = (stProgres.sesiSelesaiCount || 0) + 1;
    stProgres.terakhirLatihanTanggal = hariIniStr;

    // Catat log sesi
    const logSesi = {
      sesiId: `sesi_${Date.now()}`,
      paketId: paketId || `kilat_${kode}`,
      subtesKode: kode,
      mode,
      totalSoal: soalList.length,
      benarCount,
      skorPersen: Math.round((benarCount / Math.max(1, soalList.length)) * 100),
      durasiDetik,
      xpDapat,
      waktuSelesaiMs: Date.now(),
    };

    stProgres.riwayatSesi = [logSesi, ...(stProgres.riwayatSesi || [])].slice(0, 50);
    progres[kode] = stProgres;

    const dataJson = JSON.stringify(progres);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(kunci, dataJson);
    } else {
      memoriFallbackStorage.set(kunci, dataJson);
    }

    // Tambahkan XP siswa
    if (xpDapat > 0 && typeof tambahXpMingguan === 'function') {
      try {
        tambahXpMingguan(xpDapat);
      } catch (_e) {
        // Abaikan bila modul XP belum termuat
      }
    }

    return { sukses: true, xpDapat, logSesi };
  } catch (err) {
    console.error('Gagal menyimpan hasil sesi latihan:', err);
    return { sukses: false, error: err.message };
  }
}
