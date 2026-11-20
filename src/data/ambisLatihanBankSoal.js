// src/data/ambisLatihanBankSoal.js
// ==============================================================================
// BANK SOAL & SISTEM LATIHAN MULTI-JENJANG AMBIS GEMILANG
// Mendukung:
// 1. TKA SMP (Kelas 9) - 4 Subtes Resmi: MTK, BIN, IPA, BIG
// 2. TKA SD (Kelas 6)  - 2 Subtes Resmi: MTK, BIN
// 3. UTBK SNBT (SMA)   - 7 Subtes Resmi SNPMB: PU, PPU, PBM, PK, LBIN, LBING, PM
//
// Otomatis terintegrasi dengan Bank Soal Firestore (soal inputan guru/admin)
// dan diperkuat oleh Bank Soal Master Preset (TKA DIY & 16 Bab Modul Master).
// ==============================================================================

import { DAFTAR_SUBTES_MODUL } from './ambisModulUtbkData.js';
import { SOAL_PRESET_UTBK } from './utbk2026KatkielData.js';
import {
  MTK_SMP_MODUL,
  BIN_SMP_MODUL,
  IPA_SMP_MODUL,
  BIG_SMP_MODUL,
} from './tkaSmpModulData.js';
import {
  SOAL_TKA_2026_SMP_MTK_PAKET_B,
  SOAL_TKA_2026_SMP_BINDO_PAKET_A,
} from './tka2026DiyData.js';
import {
  SOAL_TKA_2026_SD_MTK,
  SOAL_TKA_2026_SD_BINDO,
} from './tka2026SdData.js';
import { tambahXpMingguan } from '../utils/mingguIni.js';

// ==============================================================================
// 1. KAMUS PEMETAAN KODE & NAMA SUBTES
// ==============================================================================
const PETA_KODE_SUBTES = {
  // UTBK SNBT
  PU: 'PU', 'Penalaran Umum (PU)': 'PU', 'Penalaran Umum': 'PU',
  PPU: 'PPU', 'Pengetahuan & Pemahaman Umum (PPU)': 'PPU', 'Pengetahuan & Pemahaman Umum': 'PPU',
  PBM: 'PBM', 'Pemahaman Bacaan & Menulis (PBM)': 'PBM', 'Pemahaman Bacaan & Menulis': 'PBM',
  PK: 'PK', 'Pengetahuan Kuantitatif (PK)': 'PK', 'Pengetahuan Kuantitatif': 'PK',
  LBIN: 'LBIN', LBI: 'LBIN', 'Literasi Bahasa Indonesia (LBI)': 'LBIN', 'Literasi Bahasa Indonesia': 'LBIN',
  LBING: 'LBING', LBE: 'LBING', 'Literasi Bahasa Inggris (LBE)': 'LBING', 'Literasi Bahasa Inggris': 'LBING',
  PM: 'PM', 'Penalaran Matematika (PM)': 'PM', 'Penalaran Matematika': 'PM',

  // TKA SMP
  MTK: 'MTK', MTK_SMP: 'MTK', Matematika: 'MTK', 'Matematika (Numerasi TKA)': 'MTK', 'Matematika SMP': 'MTK', Numerasi: 'MTK',
  BIN: 'BIN', BIN_SMP: 'BIN', 'Bahasa Indonesia': 'BIN', 'Bahasa Indonesia (Literasi TKA)': 'BIN', 'Bahasa Indonesia SMP': 'BIN', Literasi: 'BIN',
  IPA: 'IPA', IPA_SMP: 'IPA', 'Ilmu Pengetahuan Alam': 'IPA', 'Ilmu Pengetahuan Alam (IPA)': 'IPA', Sains: 'IPA', 'IPA SMP': 'IPA', 'Ilmu Pengetahuan Alam (IPA CP Fase D)': 'IPA',
  BIG: 'BIG', BIG_SMP: 'BIG', 'Bahasa Inggris': 'BIG', 'Bahasa Inggris (English CP Fase D)': 'BIG', 'Bahasa Inggris SMP': 'BIG', English: 'BIG',

  // TKA SD
  MTK_SD: 'MTK', 'Matematika SD': 'MTK', 'Numerasi SD': 'MTK',
  BIN_SD: 'BIN', 'Bahasa Indonesia SD': 'BIN', 'Literasi SD': 'BIN',
};

// ==============================================================================
// 2. METADATA SUBTES RESMI PER JENJANG
// ==============================================================================

// 🎓 UTBK SNBT (SMA / 7 Subtes Resmi SNPMB)
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

// 🏫 TKA SMP (Kelas 9 / Fase D)
export const DAFTAR_SUBTES_LATIHAN_SMP = [
  {
    kode: 'MTK',
    nama: 'Matematika (Numerasi TKA)',
    singkatan: 'MTK',
    rumpun: 'Numerasi',
    badgeWarna: '#ea580c',
    warnaHover: '#c2410c',
    bgLight: '#fff7ed',
    borderWarna: '#fed7aa',
    emoji: '📐',
    deskripsi: 'Bilangan & eksponen aljabar, persamaan kuadrat, phytagoras, geometri ruang, serta diagram data & peluang.',
    kisiKisi: ['Operasi Bilangan & Notasi Ilmiah', 'Aljabar & Sistem Persamaan Linear', 'Geometri, Pythagoras & Bangun Ruang', 'Statistika & Peluang Teoretik'],
  },
  {
    kode: 'BIN',
    nama: 'Bahasa Indonesia (Literasi TKA)',
    singkatan: 'BIN',
    rumpun: 'Literasi',
    badgeWarna: '#0284c7',
    warnaHover: '#0369a1',
    bgLight: '#f0f9ff',
    borderWarna: '#bae6fd',
    emoji: '📖',
    deskripsi: 'Pemahaman teks informasi tersurat-tersirat, istilah teknis, analisis gagasan pokok wacana, teks fiksi cerpen & majas.',
    kisiKisi: ['Makna Istilah Teknis & Tata Bahasa', 'Ide Pokok & Hubungan Kausalitas', 'Teks Fiksi, Karakter Tokoh & Majas', 'Evaluasi Kritis Argumen & Infografik'],
  },
  {
    kode: 'IPA',
    nama: 'Ilmu Pengetahuan Alam (IPA CP Fase D)',
    singkatan: 'IPA',
    rumpun: 'Sains',
    badgeWarna: '#059669',
    warnaHover: '#047857',
    bgLight: '#ecfdf5',
    borderWarna: '#a7f3d0',
    emoji: '🔬',
    deskripsi: 'Metode ilmiah, pengukuran kalor wujud zat, mekanika gerak & optik, sistem organ manusia & persilangan genetika.',
    kisiKisi: ['Pengukuran, Suhu & Kalor Wujud Zat', 'Mekanika Newton, Tekanan & Optik', 'Organel Sel, Organ Tubuh & Genetika', 'Lingkungan, Ekosistem & Tata Surya'],
  },
  {
    kode: 'BIG',
    nama: 'Bahasa Inggris (English CP Fase D)',
    singkatan: 'BIG',
    rumpun: 'Literasi',
    badgeWarna: '#7c3aed',
    warnaHover: '#6d28d9',
    bgLight: '#f5f3ff',
    borderWarna: '#ddd6fe',
    emoji: '🇬🇧',
    deskripsi: 'Functional dialogues, signs & notices, 6 essential tenses, and 5 reading comprehension genres (Report, Recount, etc.).',
    kisiKisi: ['Conversations & Functional Texts', 'Core Grammar, Tenses & Passive Voice', 'Reading Genres (Report, Recount, Narrative)', 'Multimodal English & Vocabulary'],
  },
];

// 🎒 TKA SD (Kelas 6 / Fase C)
export const DAFTAR_SUBTES_LATIHAN_SD = [
  {
    kode: 'MTK',
    nama: 'Matematika (Numerasi TKA SD)',
    singkatan: 'MTK',
    rumpun: 'Numerasi',
    badgeWarna: '#ea580c',
    warnaHover: '#c2410c',
    bgLight: '#fff7ed',
    borderWarna: '#fed7aa',
    emoji: '📐',
    deskripsi: 'Operasi hitung bilangan cacah, pecahan senilai & desimal, perbandingan debit, luas bangun datar & kubus.',
    kisiKisi: ['Pecahan Senilai & Desimal', 'Operasi KaBaTaKu Bilangan', 'Geometri Bangun Datar & Ruang', 'Pengolahan Data & Diagram'],
  },
  {
    kode: 'BIN',
    nama: 'Bahasa Indonesia (Literasi TKA SD)',
    singkatan: 'BIN',
    rumpun: 'Literasi',
    badgeWarna: '#0284c7',
    warnaHover: '#0369a1',
    bgLight: '#f0f9ff',
    borderWarna: '#bae6fd',
    emoji: '📖',
    deskripsi: 'Menentukan informasi tersurat 5W+1H, ide pokok paragraf, teks narasi fabel, dan tata kalimat efektif.',
    kisiKisi: ['Informasi Tersurat 5W+1H', 'Ide Pokok Paragraf', 'Apresiasi Teks Fabel', 'Makna Kata Kontekstual'],
  },
];

export function getSubtesLatihanList(jenjang = 'SMA') {
  const j = String(jenjang || '').toUpperCase();
  if (j.includes('SMP')) return DAFTAR_SUBTES_LATIHAN_SMP;
  if (j.includes('SD')) return DAFTAR_SUBTES_LATIHAN_SD;
  return DAFTAR_SUBTES_LATIHAN;
}

// ==============================================================================
// 3. NORMALISASI FORMAT BUTIR SOAL SECARA UNIVERSAL
// ==============================================================================
export function normalisasiButir(item, fallbackSubtes = 'PU', fallbackTopik = 'Umum', idx = 1) {
  if (!item) return null;
  const subtesKasar = item.subtesKode || item.mataPelajaran || item.mapel || item.subtes || fallbackSubtes;
  const kodeSubtes = PETA_KODE_SUBTES[subtesKasar] || fallbackSubtes;
  const topik = item.bab || item.materi || item.subkategori || item.topik || fallbackTopik || 'Latihan Subtes';

  // Normalisasi opsi jawaban ke format [{ label: 'A', text: '...' }, ...]
  let opsiArray = [];
  if (Array.isArray(item.opsiJawaban) && item.opsiJawaban.length > 0) {
    opsiArray = item.opsiJawaban.map((o, oIdx) => ({
      label: String(o.key || o.label || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
      text: String(o.teks || o.text || ''),
    }));
  } else if (Array.isArray(item.pilihan) && item.pilihan.length > 0) {
    opsiArray = item.pilihan.map((o, oIdx) => {
      if (typeof o === 'string') {
        const huruf = ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A';
        return { label: huruf, text: o };
      }
      return {
        label: String(o.key || o.label || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
        text: String(o.teks || o.text || ''),
      };
    });
  } else if (item.opsi && typeof item.opsi === 'object' && !Array.isArray(item.opsi)) {
    // Format object dictionary: { A: "...", B: "...", C: "...", D: "..." }
    opsiArray = Object.entries(item.opsi).map(([k, v]) => ({
      label: String(k).toUpperCase(),
      text: String(v || ''),
    })).sort((a, b) => a.label.localeCompare(b.label));
  } else if (Array.isArray(item.opsi) && item.opsi.length > 0) {
    opsiArray = item.opsi.map((o, oIdx) => ({
      label: String(o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
      text: String(o.text || o.teks || ''),
    }));
  }

  // Saring teks opsi placeholder dummy yang tidak valid
  opsiArray = opsiArray.filter((o) => !o.text.startsWith('Pernyataan / Opsi ('));

  const rawKunci = String(item.kunciJawaban || item.kunci_jawaban || item.kunci || item.jawabanBenar || 'A').trim().toUpperCase();
  const cleanKunci = (['A', 'B', 'C', 'D', 'E'].find((h) => rawKunci.startsWith(h))) || 'A';
  const teksPertanyaan = item.teksSoal || item.teks_soal || item.soal || item.pertanyaan || '';
  const pembahasan = item.pembahasan || 'Pembahasan terperinci mengacu pada kaidah dan konsep inti materi.';

  // Ekstraksi gambar soal jika ada
  const gambarList = [];
  if (Array.isArray(item.gambarUrls)) {
    item.gambarUrls.forEach((g) => {
      if (typeof g === 'string' && g.trim()) gambarList.push(g.trim());
      else if (g?.url || g?.uploadedUrl) gambarList.push(String(g.url || g.uploadedUrl).trim());
    });
  }
  if (Array.isArray(item.gambar)) {
    item.gambar.forEach((g) => {
      if (typeof g === 'string' && g.trim()) gambarList.push(g.trim());
      else if (g?.url || g?.uploadedUrl) gambarList.push(String(g.url || g.uploadedUrl).trim());
    });
  }
  if (typeof item.gambarUrl === 'string' && item.gambarUrl.trim()) gambarList.push(item.gambarUrl.trim());
  if (typeof item.mediaUrl === 'string' && item.mediaUrl.trim()) gambarList.push(item.mediaUrl.trim());

  return {
    id: String(item.id || `latihan_${kodeSubtes.toLowerCase()}_${idx}`),
    subtesKode: kodeSubtes,
    topik,
    soal: teksPertanyaan,
    wacana: item.wacana || item.stimulus || null,
    opsi: opsiArray,
    kunci: cleanKunci,
    pembahasan,
    gambar: gambarList,
    tingkatKesulitan: item.tingkatKesulitan || (idx % 3 === 0 ? 'sulit' : idx % 2 === 0 ? 'sedang' : 'mudah'),
  };
}

// ==============================================================================
// 4. PEMBANGUN BANK SOAL LATIHAN PER JENJANG
// ==============================================================================

// A. SMP Bank Soal Builder (Menghubungkan Firestore + DIY Master + Modul 16 Bab)
export function susunBankSoalLatihanSmp(bankSoalFirestore = []) {
  const bank = [];
  let counter = 1;
  const idsSudahAda = new Set();

  const tambahSoalUnik = (item, fallbackSubtes, fallbackTopik) => {
    const b = normalisasiButir(item, fallbackSubtes, fallbackTopik, counter++);
    if (b && b.soal && b.opsi.length >= 2 && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Prioritaskan butir soal dari Firestore bank_soal (inputan pengguna/tentor)
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      const sk = String(s.kelas || s.kelasSekolah || s.tingkatKelas || '');
      const sm = String(s.mataPelajaran || s.mapel || s.subtes || '').toLowerCase();
      const subtesRaw = String(s.subtes || s.subtesKode || s.kodeSubtes || '').toUpperCase();

      const isSmp = sj.includes('SMP') || sk.includes('7') || sk.includes('8') || sk.includes('9')
        || sm.includes('smp') || String(s.materi || '').toLowerCase().includes('smp')
        || (!sj && !sk); // Bila metadata jenjang kosong saat input

      if (isSmp) {
        let subtes = 'MTK';
        if (subtesRaw === 'MTK' || subtesRaw === 'BIN' || subtesRaw === 'IPA' || subtesRaw === 'BIG') {
          subtes = subtesRaw;
        } else if (sm.includes('indonesia') || sm.includes('literasi') || sm.includes('lbin')) {
          subtes = 'BIN';
        } else if (sm.includes('inggris') || sm.includes('english') || sm.includes('lbing')) {
          subtes = 'BIG';
        } else if (sm.includes('ipa') || sm.includes('alam') || sm.includes('sains') || sm.includes('fisika') || sm.includes('biologi')) {
          subtes = 'IPA';
        } else if (sm.includes('matematika') || sm.includes('numerasi') || sm.includes('hitung') || sm.includes('aljabar') || sm.includes('pk') || sm.includes('pm')) {
          subtes = 'MTK';
        }
        tambahSoalUnik(s, subtes, s.bab || s.materi || 'Bank Soal Gemilang');
      }
    });
  }

  // 2. Tambahkan Master Bank Soal TKA SMP DIY 2026 (60 Soal Resmi Berkualitas Tinggi)
  if (Array.isArray(SOAL_TKA_2026_SMP_MTK_PAKET_B)) {
    SOAL_TKA_2026_SMP_MTK_PAKET_B.forEach((s) => {
      tambahSoalUnik(s, 'MTK', s.materi || 'TKA SMP DIY Paket B');
    });
  }
  if (Array.isArray(SOAL_TKA_2026_SMP_BINDO_PAKET_A)) {
    SOAL_TKA_2026_SMP_BINDO_PAKET_A.forEach((s) => {
      tambahSoalUnik(s, 'BIN', s.materi || 'TKA SMP DIY Paket A');
    });
  }

  // 3. Tambahkan 86 Kuis Pemahaman Master dari 16 Bab Modul SMP 2027
  const mapelSmpList = [
    { kode: 'MTK', data: MTK_SMP_MODUL },
    { kode: 'BIN', data: BIN_SMP_MODUL },
    { kode: 'IPA', data: IPA_SMP_MODUL },
    { kode: 'BIG', data: BIG_SMP_MODUL },
  ];
  mapelSmpList.forEach(({ kode, data }) => {
    (data || []).forEach((bab) => {
      const judulBab = bab.judul || 'Materi Modul';
      (bab.kuisPemahaman || []).forEach((k) => {
        tambahSoalUnik({ ...k, subtesKode: kode, topik: judulBab }, kode, judulBab);
      });
    });
  });

  return bank;
}

// B. SD Bank Soal Builder
export function susunBankSoalLatihanSd(bankSoalFirestore = []) {
  const bank = [];
  let counter = 1;
  const idsSudahAda = new Set();

  const tambahSoalUnik = (item, fallbackSubtes, fallbackTopik) => {
    const b = normalisasiButir(item, fallbackSubtes, fallbackTopik, counter++);
    if (b && b.soal && b.opsi.length >= 2 && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Soal Firestore SD
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      const sk = String(s.kelas || s.kelasSekolah || '');
      const isSd = sj.includes('SD') || sk.includes('4') || sk.includes('5') || sk.includes('6');
      if (isSd) {
        const sm = String(s.mataPelajaran || s.mapel || s.subtes || '').toLowerCase();
        let subtes = 'MTK';
        if (sm.includes('indonesia') || sm.includes('literasi')) subtes = 'BIN';
        else if (sm.includes('matematika') || sm.includes('numerasi')) subtes = 'MTK';
        tambahSoalUnik(s, subtes, s.bab || s.materi || 'Bank Soal Gemilang SD');
      }
    });
  }

  // 2. Master Dataset TKA SD 2026
  if (Array.isArray(SOAL_TKA_2026_SD_MTK)) {
    SOAL_TKA_2026_SD_MTK.forEach((s) => {
      tambahSoalUnik(s, 'MTK', s.materi || 'TKA SD Matematika');
    });
  }
  if (Array.isArray(SOAL_TKA_2026_SD_BINDO)) {
    SOAL_TKA_2026_SD_BINDO.forEach((s) => {
      tambahSoalUnik(s, 'BIN', s.materi || 'TKA SD Bahasa Indonesia');
    });
  }

  return bank;
}

// C. UTBK Bank Soal Builder (7 Subtes SNPMB)
export function susunBankSoalLatihanUtbk(bankSoalFirestore = []) {
  const bank = [];
  let counter = 1;
  const idsSudahAda = new Set();

  const tambahSoalUnik = (item, fallbackSubtes, fallbackTopik) => {
    const b = normalisasiButir(item, fallbackSubtes, fallbackTopik, counter++);
    if (b && b.soal && b.opsi.length >= 2 && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Firestore SMA / UTBK
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      const sk = String(s.kelas || s.kelasSekolah || '');
      const isSma = sj.includes('SMA') || sj.includes('SMK') || sk.includes('10') || sk.includes('11') || sk.includes('12') || sk.includes('UTBK');
      if (isSma) {
        const sm = String(s.subtesKode || s.mataPelajaran || s.mapel || s.subtes || 'PU').toUpperCase();
        const kode = PETA_KODE_SUBTES[sm] || 'PU';
        tambahSoalUnik(s, kode, s.bab || s.materi || 'Bank Soal Gemilang UTBK');
      }
    });
  }

  // 2. Preset Katkiel 160 Soal
  if (Array.isArray(SOAL_PRESET_UTBK)) {
    SOAL_PRESET_UTBK.forEach((s) => {
      tambahSoalUnik(s, 'PU', s.subkategori || 'Preset UTBK Katkiel');
    });
  }

  // 3. Modul UTBK 46 Bab
  if (Array.isArray(DAFTAR_SUBTES_MODUL)) {
    DAFTAR_SUBTES_MODUL.forEach((st) => {
      const kode = st.kode;
      (st.babList || []).forEach((bab) => {
        const judulBab = bab.judul || 'Materi Modul';
        (bab.kuisPemahaman || []).forEach((k) => {
          tambahSoalUnik({ ...k, subtesKode: kode, topik: judulBab }, kode, judulBab);
        });
      });
    });
  }

  return bank;
}

export const BANK_SOAL_LATIHAN_UTBK = susunBankSoalLatihanUtbk();

// ==============================================================================
// 5. QUERY DAN GENERATOR PAKET LATIHAN ADAPTIF
// ==============================================================================

/**
 * Mengambil bank soal khusus 1 subtes sesuai jenjang siswa (SMP / SD / SMA)
 */
export function getBankSoalPerSubtes(subtesKode, jenjang = 'SMA', bankSoalFirestore = []) {
  const k = String(subtesKode || '').toUpperCase();
  const kodeBersih = PETA_KODE_SUBTES[k] || k;
  const j = String(jenjang || '').toUpperCase();

  let pool = [];
  if (j.includes('SMP')) {
    pool = susunBankSoalLatihanSmp(bankSoalFirestore);
  } else if (j.includes('SD')) {
    pool = susunBankSoalLatihanSd(bankSoalFirestore);
  } else {
    pool = susunBankSoalLatihanUtbk(bankSoalFirestore);
  }

  return pool.filter((s) => s.subtesKode === kodeBersih);
}

/**
 * Membagi Bank Soal menjadi Paket Micro-Learning (10 butir per paket)
 */
export function getPaketLatihanPerSubtes(subtesKode, ukuranPaket = 10, jenjang = 'SMA', bankSoalFirestore = []) {
  const soalSubtes = getBankSoalPerSubtes(subtesKode, jenjang, bankSoalFirestore);
  const paketList = [];
  const total = soalSubtes.length;
  const nPaket = Math.max(1, Math.ceil(total / ukuranPaket));

  for (let i = 0; i < nPaket; i++) {
    const start = i * ukuranPaket;
    const sliceSoal = soalSubtes.slice(start, start + ukuranPaket);
    if (sliceSoal.length > 0) {
      paketList.push({
        id: `paket_${String(jenjang).toLowerCase()}_${String(subtesKode).toLowerCase()}_bag_${i + 1}`,
        paketNomor: i + 1,
        judul: `Paket Latihan Bagian ${i + 1}`,
        subjudul: `${sliceSoal.length} Butir Soal Terstruktur`,
        subtesKode,
        jenjang,
        jumlahSoal: sliceSoal.length,
        durasiMenit: Math.max(10, Math.round(sliceSoal.length * 1.5)),
        soalList: sliceSoal,
      });
    }
  }

  return paketList;
}

/**
 * Generator Latihan Kilat (Quick Play) 10 Soal Acak
 */
export function getSoalLatihanKilat(subtesKode = 'MTK', jumlah = 10, modeKesulitan = 'campur', jenjang = 'SMA', bankSoalFirestore = []) {
  const soalSubtes = getBankSoalPerSubtes(subtesKode, jenjang, bankSoalFirestore);
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

// ==============================================================================
// 6. PROGRES & STATISTIK SISWA
// ==============================================================================
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
 * Menghitung rekapitulasi progres per subtes dinamis sesuai jenjang siswa
 */
export function hitungStatistikLatihanSiswa(studentId, jenjang = 'SMA', bankSoalFirestore = []) {
  const progres = bacaProgresLatihanSiswa(studentId);
  const hariIniStr = new Date().toISOString().slice(0, 10);
  const daftarSubtes = getSubtesLatihanList(jenjang);

  const rekapSubtes = {};
  let totalSoalDikerjakanSemua = 0;
  let totalBenarSemua = 0;
  let totalSesiTuntas = 0;

  daftarSubtes.forEach((st) => {
    const dataSt = progres[st.kode] || {};
    const bankSubtes = getBankSoalPerSubtes(st.kode, jenjang, bankSoalFirestore);
    const totalBank = Math.max(bankSubtes.length, 10);
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
    const rawKode = String(subtesKode || 'MTK').toUpperCase();
    const kode = PETA_KODE_SUBTES[rawKode] || rawKode;

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
