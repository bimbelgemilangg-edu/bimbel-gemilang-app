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
import {
  bakuKategoriBenarSalah,
  kunciBarisBenarSalah,
  safeArray,
} from '../utils/skoringSoalKompleks.js';

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
// Bersihkan teks pernyataan dan hapus penomoran berlebih dari OCR/importer (mis. "2 Luas..." -> "Luas...")
export function cleanStatementText(text) {
  if (!text) return '';
  let s = String(text).trim();
  s = s.replace(/^\s*([0-9]+|[a-eA-E])[.)\s-]+\s*/, '');
  s = s.replace(/(\b[a-zA-Z]+)-\s+([a-zA-Z]+\b)/g, '$1$2');
  return s.trim();
}

// Urai kunci benar salah dari berbagai format penyimpanan (array, "B, B, S", "B-B-S", atau dari teks pembahasan)
export function uraiKunciBenarSalah(rawKunci, pembahasan, jumlahBaris = 0) {
  let tokens = [];
  const found = String(rawKunci || '').match(/\b(benar|salah|b|s)\b/gi);
  if (found && jumlahBaris > 0 && found.length >= jumlahBaris) {
    tokens = found.slice(0, jumlahBaris).map((x) => (x.toLowerCase().startsWith('b') ? 'benar' : 'salah'));
  }

  if (tokens.length < jumlahBaris && pembahasan) {
    const m = String(pembahasan).match(/\b(benar|salah)\s*[-,\s]+\s*(benar|salah)\s*[-,\s]+\s*(benar|salah)\b/i);
    if (m) {
      tokens = [m[1].toLowerCase(), m[2].toLowerCase(), m[3].toLowerCase()];
    } else {
      const m2 = String(pembahasan).match(/Jawaban:\s*([BS])\s*,\s*([BS])\s*,\s*([BS])/i);
      if (m2) {
        tokens = [
          m2[1].toUpperCase() === 'B' ? 'benar' : 'salah',
          m2[2].toUpperCase() === 'B' ? 'benar' : 'salah',
          m2[3].toUpperCase() === 'B' ? 'benar' : 'salah',
        ];
      }
    }
  }
  return tokens;
}
export function normalisasiButir(item, fallbackSubtes = 'PU', fallbackTopik = 'Umum', idx = 1) {
  if (!item) return null;
  const subtesKasar = item.subtesKode || item.mataPelajaran || item.mapel || item.subtes || fallbackSubtes;
  const kodeSubtes = PETA_KODE_SUBTES[subtesKasar] || fallbackSubtes;
  const topik = item.bab || item.materi || item.subkategori || item.topik || fallbackTopik || 'Latihan Subtes';
  const teksPertanyaan = cleanStatementText(item.teksSoal || item.teks_soal || item.soal || item.pertanyaan || '');
  const pembahasan = item.pembahasan || 'Pembahasan terperinci mengacu pada kaidah dan konsep inti materi.';

  // 1. Ekstraksi opsi jawaban mentah
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

  // Saring opsi placeholder dummy
  opsiArray = opsiArray.filter((o) => !o.text.startsWith('Pernyataan / Opsi ('));

  // 2. Deteksi Cerdas Tipe Soal: Benar/Salah, PG Kompleks, atau PG Sederhana
  let tipeSoal = item.tipeSoal || item.tipe || 'pg_sederhana';
  const rawKunci = String(item.kunciJawaban || item.kunci_jawaban || item.kunci || item.jawabanBenar || '').trim();
  const lowerTeks = (teksPertanyaan + ' ' + rawKunci).toLowerCase();

  const isBenarSalahFormat = (
    tipeSoal === 'benar_salah' ||
    tipeSoal === 'pg_kategori' ||
    (Array.isArray(item.tabel_benar_salah) && item.tabel_benar_salah.length > 0) ||
    (Array.isArray(item.tabelBenarSalah) && item.tabelBenarSalah.length > 0) ||
    lowerTeks.includes('tentukan benar (b) atau salah (s)') ||
    lowerTeks.includes('benar (b) atau salah (s)') ||
    lowerTeks.includes('benar atau salah') ||
    lowerTeks.includes('benar/salah') ||
    /^(b|s)(\s*[,-\s]+\s*(b|s))+$/i.test(rawKunci) ||
    /^(benar|salah)(\s*[,-\s]+\s*(benar|salah))+$/i.test(rawKunci)
  );

  const isPgKompleksFormat = !isBenarSalahFormat && (
    tipeSoal === 'pg_kompleks' ||
    lowerTeks.includes('jawaban benar lebih dari satu') ||
    lowerTeks.includes('lebih dari satu') ||
    lowerTeks.includes('pilihlah pernyataan dengan jawaban yang benar') ||
    lowerTeks.includes('pilih semua pernyataan yang benar') ||
    (Array.isArray(item.kunciJawaban) && item.kunciJawaban.length > 1) ||
    /^[A-E]\s*[,;\s]\s*[A-E]/i.test(rawKunci)
  );

  let pernyataan = [];
  let cleanKunci = 'A';
  let kunciTeks = '';

  if (isBenarSalahFormat) {
    tipeSoal = 'benar_salah';
    let barisMentah = [];
    if (Array.isArray(item.tabel_benar_salah) && item.tabel_benar_salah.length > 0) {
      barisMentah = item.tabel_benar_salah;
    } else if (Array.isArray(item.tabelBenarSalah) && item.tabelBenarSalah.length > 0) {
      barisMentah = item.tabelBenarSalah;
    } else if (Array.isArray(item.pernyataan) && item.pernyataan.length > 0) {
      barisMentah = item.pernyataan;
    } else if (opsiArray.length > 0) {
      barisMentah = opsiArray.map((o) => ({ pernyataan: o.text }));
    }

    const extractedTokens = uraiKunciBenarSalah(rawKunci, pembahasan, barisMentah.length);

    pernyataan = barisMentah.map((b, bIdx) => {
      const teks = cleanStatementText(typeof b === 'object' ? (b.pernyataan || b.teks || b.statement || '') : String(b));
      let k = (typeof b === 'object' ? (b.jawaban || b.kunci || b.value) : '') || '';
      k = bakuKategoriBenarSalah(k);
      if (!k && extractedTokens[bIdx]) k = extractedTokens[bIdx];
      if (!k) k = 'benar';
      return { id: bIdx + 1, teks, kunci: k };
    });

    cleanKunci = pernyataan.map((p) => p.kunci);
    kunciTeks = pernyataan.map((p) => (p.kunci === 'benar' ? 'B' : 'S')).join(', ');

  } else if (isPgKompleksFormat) {
    tipeSoal = 'pg_kompleks';
    const keysFound = (rawKunci.match(/[A-E]/gi) || []).map((h) => h.toUpperCase());
    cleanKunci = [...new Set(keysFound)];
    if (cleanKunci.length === 0) cleanKunci = ['A'];
    kunciTeks = cleanKunci.join(', ');

  } else {
    tipeSoal = 'pg_sederhana';
    cleanKunci = (['A', 'B', 'C', 'D', 'E'].find((h) => rawKunci.toUpperCase().startsWith(h))) || 'A';
    kunciTeks = cleanKunci;
  }

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
    babNomor: item.babNomor || null,
    namaBab: item.namaBab || item.bab || fallbackTopik,
    tipeSoal,
    soal: teksPertanyaan,
    wacana: item.wacana || item.stimulus || null,
    opsi: opsiArray,
    pernyataan,
    kolomKategori: ['Benar', 'Salah'],
    kunci: cleanKunci,
    kunciTeks,
    pembahasan,
    gambar: gambarList,
    tingkatKesulitan: item.tingkatKesulitan || (idx % 3 === 0 ? 'sulit' : idx % 2 === 0 ? 'sedang' : 'mudah'),
  };
}

export function tentukanBabDanTopik(subtesKode, item, jenjang = 'SMP') {
  const teks = (
    String(item.bab || '') + ' ' +
    String(item.materi || '') + ' ' +
    String(item.topik || '') + ' ' +
    String(item.subkategori || '') + ' ' +
    String(item.teksSoal || item.teks_soal || item.soal || '')
  ).toLowerCase();

  const sk = String(subtesKode || '').toUpperCase();

  // === TKA SMP ===
  if (sk === 'MTK') {
    if (teks.includes('peluang') || teks.includes('statistika') || teks.includes('diagram') || teks.includes('rata-rata') || teks.includes('median') || teks.includes('modus') || teks.includes('frekuensi') || teks.includes('kejadian') || teks.includes('dadu') || teks.includes('koin')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Data & Peluang (Statistika, Diagram & Peluang Teoretik)', ringkas: 'Bab 4: Data & Peluang' };
    }
    if (teks.includes('geometri') || teks.includes('sudut') || teks.includes('pythagoras') || teks.includes('bangun ruang') || teks.includes('bangun datar') || teks.includes('transformasi') || teks.includes('lingkaran') || teks.includes('luas') || teks.includes('keliling') || teks.includes('volume') || teks.includes('kesebangunan') || teks.includes('kongruen') || teks.includes('balok') || teks.includes('kubus') || teks.includes('tabung') || teks.includes('kerucut') || teks.includes('bola') || teks.includes('limas') || teks.includes('trapesium') || teks.includes('jaring')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Geometri & Pengukuran (Sudut, Pythagoras, Ruang & Transformasi)', ringkas: 'Bab 3: Geometri & Ruang' };
    }
    if (teks.includes('aljabar') || teks.includes('persamaan') || teks.includes('fungsi') || teks.includes('pola') || teks.includes('barisan') || teks.includes('deret') || teks.includes('spldv') || teks.includes('kuadrat') || teks.includes('aritmetika sosial') || teks.includes('diskon') || teks.includes('bruto') || teks.includes('tara') || teks.includes('netto') || teks.includes('pertidaksamaan') || teks.includes('skala') || teks.includes('perbandingan')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)', ringkas: 'Bab 2: Aljabar & Persamaan' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)', ringkas: 'Bab 1: Bilangan & Bentuk Akar' };
  }

  if (sk === 'BIN') {
    if (teks.includes('evaluasi') || teks.includes('argumen') || teks.includes('opini') || teks.includes('apresiasi') || teks.includes('sikap penulis') || teks.includes('akurasi') || teks.includes('fakta vs opini')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Evaluasi & Apresiasi (Akurasi Argumen, Relevansi Teks & Sikap Penulis)', ringkas: 'Bab 4: Evaluasi & Apresiasi' };
    }
    if (teks.includes('fiksi') || teks.includes('cerpen') || teks.includes('puisi') || teks.includes('tokoh') || teks.includes('majas') || teks.includes('alur') || teks.includes('moral') || teks.includes('latar') || teks.includes('watak')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Teks Fiksi & Puisi (Tokoh, Alur, Majas & Nilai Moral)', ringkas: 'Bab 3: Teks Fiksi & Puisi' };
    }
    if (teks.includes('inferensial') || teks.includes('ide pokok') || teks.includes('simpulan') || teks.includes('gagasan') || teks.includes('sebab') || teks.includes('akibat') || teks.includes('paragraf') || teks.includes('kalimat utama')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Pemahaman Inferensial (Ide Pokok, Simpulan & Hubungan Sebab-Akibat)', ringkas: 'Bab 2: Pemahaman Inferensial' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Pemahaman Tekstual (Istilah Teknis, Informasi Tersurat & Tata Bahasa)', ringkas: 'Bab 1: Pemahaman Tekstual' };
  }

  if (sk === 'IPA') {
    if (teks.includes('lingkungan') || teks.includes('bumi') || teks.includes('tata surya') || teks.includes('ekosistem') || teks.includes('pencemaran') || teks.includes('litosfer') || teks.includes('hidrosfer') || teks.includes('atmosfer') || teks.includes('rotasi') || teks.includes('revolusi')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Lingkungan, Bumi–Tata Surya & Ekosistem', ringkas: 'Bab 4: Lingkungan & Bumi' };
    }
    if (teks.includes('sel') || teks.includes('organ') || teks.includes('pewarisan') || teks.includes('genetika') || teks.includes('makhluk hidup') || teks.includes('sistem pencernaan') || teks.includes('sistem peredaran') || teks.includes('respirasi') || teks.includes('mitokondria') || teks.includes('enzim') || teks.includes('fotosintesis')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Makhluk Hidup, Sel, Sistem Organ & Pewarisan Sifat', ringkas: 'Bab 3: Sel & Sistem Organ' };
    }
    if (teks.includes('mekanika') || teks.includes('gelombang') || teks.includes('optik') || teks.includes('listrik') || teks.includes('magnet') || teks.includes('gaya') || teks.includes('gerak') || teks.includes('tekanan') || teks.includes('hukum newton') || teks.includes('cermin') || teks.includes('lensa') || teks.includes('bunyi')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Mekanika, Gelombang, Optik, Listrik & Magnet', ringkas: 'Bab 2: Mekanika & Optik' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Pengukuran, Zat, Suhu, Kalor & Energi', ringkas: 'Bab 1: Pengukuran & Kalor' };
  }

  if (sk === 'BIG') {
    if (teks.includes('multimodal') || teks.includes('dialogue') || teks.includes('conversation') || teks.includes('poster') || teks.includes('sign') || teks.includes('announcement') || teks.includes('notice')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Multimodal Literacy, Dialogues & Functional Text', ringkas: 'Bab 4: Multimodal & Dialogues' };
    }
    if (teks.includes('genre') || teks.includes('narrative') || teks.includes('recount') || teks.includes('report') || teks.includes('procedure') || teks.includes('descriptive') || teks.includes('passage') || teks.includes('main idea')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Mastering 5 Core Reading Genres', ringkas: 'Bab 3: 5 Reading Genres' };
    }
    if (teks.includes('tenses') || teks.includes('passive') || teks.includes('grammar') || teks.includes('connector') || teks.includes('past') || teks.includes('present') || teks.includes('future') || teks.includes('conjunction')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Essential Tenses, Passive Voice & Connectors', ringkas: 'Bab 2: Tenses & Grammar' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Expressions, Functional Texts & Core Grammar', ringkas: 'Bab 1: Expressions & Basics' };
  }

  // === UTBK SNBT ===
  if (sk === 'PU') {
    if (teks.includes('pola') || teks.includes('barisan') || teks.includes('deret') || teks.includes('angka') || teks.includes('huruf')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Pola Barisan Angka & Huruf', ringkas: 'Bab 3: Pola Angka/Huruf' };
    }
    if (teks.includes('posisi') || teks.includes('analitik') || teks.includes('urutan') || teks.includes('spasial')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Penalaran Analitik Spasial & Posisi', ringkas: 'Bab 4: Penalaran Spasial' };
    }
    if (teks.includes('sebab') || teks.includes('akibat') || teks.includes('kausal')) {
      return { babNomor: 5, namaBab: 'Bab 5 · Hubungan Sebab-Akibat & Kesimpulan Logis', ringkas: 'Bab 5: Sebab-Akibat' };
    }
    if (teks.includes('induktif') || teks.includes('generalisasi')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Logika Induktif & Generalisasi', ringkas: 'Bab 2: Logika Induktif' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Logika Deduktif & Silogisme', ringkas: 'Bab 1: Silogisme' };
  }

  if (sk === 'PPU') {
    if (teks.includes('sikap') || teks.includes('nada') || teks.includes('bias') || teks.includes('penulis')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Sikap, Nada & Bias Penulis', ringkas: 'Bab 4: Nada Penulis' };
    }
    if (teks.includes('hubungan') || teks.includes('antarparagraf') || teks.includes('koherensi')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Hubungan Antarparagraf & Koherensi', ringkas: 'Bab 3: Antarparagraf' };
    }
    if (teks.includes('afiks') || teks.includes('imbuhan') || teks.includes('bentukan kata')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Kaidah Afiksasi & Bentuk Terikat', ringkas: 'Bab 2: Afiksasi' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Makna Kontekstual Kata & Frasa', ringkas: 'Bab 1: Makna Kata' };
  }

  if (sk === 'PBM') {
    if (teks.includes('tanda baca') || teks.includes('titik') || teks.includes('koma') || teks.includes('rancu')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Tanda Baca & Bentuk Rancu', ringkas: 'Bab 4: Tanda Baca' };
    }
    if (teks.includes('konjungsi') || teks.includes('hubung') || teks.includes('padu')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Konjungsi & Paragraf Padu', ringkas: 'Bab 3: Konjungsi' };
    }
    if (teks.includes('kalimat efektif') || teks.includes('spok') || teks.includes('sintaksis')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Kalimat Efektif & Struktur Sintaksis', ringkas: 'Bab 2: Kalimat Efektif' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Pedoman EYD V & Huruf Kapital', ringkas: 'Bab 1: EYD V' };
  }

  if (sk === 'PK') {
    if (teks.includes('kecukupan data') || teks.includes('(1) dan (2)') || teks.includes('pernyataan (1)')) {
      return { babNomor: 5, namaBab: 'Bab 5 · Kecukupan Data Pernyataan (1) & (2)', ringkas: 'Bab 5: Kecukupan Data' };
    }
    if (teks.includes('p vs q') || teks.includes('hubungan p dan q') || teks.includes('kuantitas p')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Relasi Nilai P vs Nilai Q', ringkas: 'Bab 4: Nilai P vs Q' };
    }
    if (teks.includes('geometri') || teks.includes('sudut') || teks.includes('segitiga') || teks.includes('lingkaran') || teks.includes('ruang') || teks.includes('garis')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Geometri Bidang Datar & Ruang', ringkas: 'Bab 3: Geometri' };
    }
    if (teks.includes('persamaan') || teks.includes('pertidaksamaan') || teks.includes('sistem') || teks.includes('kuadrat')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Persamaan, Pertidaksamaan & Sistem Linier', ringkas: 'Bab 2: Persamaan Kuadrat' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Aljabar Fungsi & Operasi Bilangan', ringkas: 'Bab 1: Aljabar & Fungsi' };
  }

  if (sk === 'LBIN') {
    if (teks.includes('grafik') || teks.includes('tabel') || teks.includes('infografik') || teks.includes('data')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Membaca Grafik, Tabel & Infografik', ringkas: 'Bab 4: Grafik & Data' };
    }
    if (teks.includes('evaluasi') || teks.includes('argumen') || teks.includes('fakta') || teks.includes('opini')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Evaluasi Argumen & Fakta vs Opini', ringkas: 'Bab 3: Evaluasi Argumen' };
    }
    if (teks.includes('opini') || teks.includes('esai') || teks.includes('editorial')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Analisis Teks Opini & Editorial', ringkas: 'Bab 2: Opini & Editorial' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Membedah Teks Eksplanasi Ilmiah', ringkas: 'Bab 1: Teks Eksplanasi' };
  }

  if (sk === 'LBING') {
    if (teks.includes('critical') || teks.includes('inference') || teks.includes('conclude') || teks.includes('implied')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Critical Reading & Inferred Conclusions', ringkas: 'Bab 4: Critical Reading' };
    }
    if (teks.includes('tone') || teks.includes('attitude') || teks.includes('perspective')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Tone, Attitude & Author Perspective', ringkas: 'Bab 3: Tone & Attitude' };
    }
    if (teks.includes('vocabulary') || teks.includes('meaning') || teks.includes('contextual')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Vocabulary in Academic Context', ringkas: 'Bab 2: Vocabulary' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Main Idea & Author Primary Purpose', ringkas: 'Bab 1: Main Idea' };
  }

  if (sk === 'PM') {
    if (teks.includes('peluang') || teks.includes('probabilitas') || teks.includes('risiko') || teks.includes('kombinasi')) {
      return { babNomor: 4, namaBab: 'Bab 4 · Peluang & Analisis Risiko Kasus', ringkas: 'Bab 4: Peluang & Risiko' };
    }
    if (teks.includes('pemodelan') || teks.includes('fungsi') || teks.includes('optimasi') || teks.includes('maksimum') || teks.includes('minimum')) {
      return { babNomor: 3, namaBab: 'Bab 3 · Pemodelan Fungsi Realistis & Optimasi', ringkas: 'Bab 3: Pemodelan Fungsi' };
    }
    if (teks.includes('laju') || teks.includes('kecepatan') || teks.includes('debit') || teks.includes('waktu') || teks.includes('jarak')) {
      return { babNomor: 2, namaBab: 'Bab 2 · Laju Perpindahan, Kecepatan & Debit', ringkas: 'Bab 2: Laju & Debit' };
    }
    return { babNomor: 1, namaBab: 'Bab 1 · Aritmetika Sosial, Bunga & Finansial', ringkas: 'Bab 1: Aritmetika Sosial' };
  }

  return { babNomor: 1, namaBab: `${sk} · Paket Latihan Terstruktur`, ringkas: `${sk} Latihan` };
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
    if (b && b.soal && (b.opsi.length >= 2 || (b.pernyataan && b.pernyataan.length >= 2)) && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Prioritaskan butir soal dari Firestore bank_soal (inputan pengguna/tentor)
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      const sj = String(s.jenjang || '').toUpperCase();
      const sk = String(s.kelas || s.kelasSekolah || s.tingkatKelas || '').trim();
      const sm = String(s.mataPelajaran || s.mapel || s.subtes || '').toLowerCase();
      const subtesRaw = String(s.subtes || s.subtesKode || s.kodeSubtes || '').toUpperCase();

      // Filter ketat: Buang soal SMA/SMK atau SD
      if (sj.includes('SMA') || sj.includes('SMK') || sj.includes('SD')) return;
      if (['10', '11', '12', '1', '2', '3', '4', '5', '6'].includes(sk)) return;

      // Filter ketat mapel non-TKA SMP (IPS, Geografi, Sejarah, PPKN, Agama, dll)
      const teksNonTka = (sm + ' ' + String(s.materi || '') + ' ' + String(s.bab || '') + ' ' + String(s.teksSoal || s.soal || '')).toLowerCase();
      if (
        teksNonTka.includes('ips') || teksNonTka.includes('geografi') || teksNonTka.includes('ekonomi') ||
        teksNonTka.includes('sosiologi') || teksNonTka.includes('sejarah') || teksNonTka.includes('kimia') ||
        teksNonTka.includes('ppkn') || teksNonTka.includes('pancasila') || teksNonTka.includes('agama') ||
        teksNonTka.includes('keragaman alam indonesia') || teksNonTka.includes('garis khayal bio-geografi') ||
        teksNonTka.includes('garis wallace') || teksNonTka.includes('fauna indonesia')
      ) {
        return;
      }

      // Pastikan hanya memasukkan soal dari folder TKA / bertanda TKA jika ada sumberSoalId
      const isTaggedTka = (
        String(s.jenisUjian || '').toUpperCase() === 'TKA' ||
        String(s.folderNama || s.sumberSoalNama || s.folderJudul || '').toLowerCase().includes('tka') ||
        String(s.folderNama || s.sumberSoalNama || s.folderJudul || '').toLowerCase().includes('pendampingan') ||
        (Array.isArray(s.tags) && s.tags.some((t) => String(t).toUpperCase().includes('TKA')))
      );

      // Jika soal memiliki sumberSoalId tetapi BUKAN folder TKA, lewati
      if (s.sumberSoalId && !isTaggedTka) {
        return;
      }

      // Jangan izinkan soal orphan tak bertuan tanpa identitas TKA
      if (!s.sumberSoalId && !isTaggedTka && !sj.includes('SMP')) {
        return;
      }

      let subtes = null;
      if (subtesRaw === 'MTK' || subtesRaw === 'BIN' || subtesRaw === 'IPA' || subtesRaw === 'BIG') {
        subtes = subtesRaw;
      } else if (sm.includes('indonesia') || sm.includes('literasi') || sm.includes('lbin')) {
        subtes = 'BIN';
      } else if (sm.includes('inggris') || sm.includes('english') || sm.includes('lbing')) {
        subtes = 'BIG';
      } else if (sm.includes('ipa') || sm.includes('sains') || sm.includes('fisika') || sm.includes('biologi')) {
        subtes = 'IPA';
      } else if (sm.includes('matematika') || sm.includes('numerasi') || sm.includes('hitung') || sm.includes('aljabar')) {
        subtes = 'MTK';
      }

      // Jika mapel tidak cocok dengan 4 subtes resmi TKA SMP, JANGAN MASUKKAN
      if (!subtes) return;

      // Filter kewarasan untuk MTK: Soal MTK harus memuat angka, rumus, bangun, atau kata numerik
      if (subtes === 'MTK') {
        const teksSoalLengkap = (String(s.teksSoal || s.soal || '') + ' ' + String(s.materi || '')).toLowerCase();
        const adaKarakterMatematika = /[\d\+\-\*\/=\^√%]|luas|keliling|volume|panjang|lebar|tinggi|alas|sudut|akar|pangkat|himpunan|fungsi|aljabar|persamaan|bilangan|pecahan|skala|peluang|median|modus|rata-rata|koordinat/i.test(teksSoalLengkap);
        if (!adaKarakterMatematika) {
          return; // Buang wacana teks non-numerik yang salah masuk mapel MTK
        }
      }

      const babInfo = tentukanBabDanTopik(subtes, s, 'SMP');
      tambahSoalUnik({
        ...s,
        subtesKode: subtes,
        babNomor: babInfo.babNomor,
        namaBab: babInfo.namaBab,
        topik: babInfo.namaBab,
      }, subtes, babInfo.namaBab);
    });
  }

  // 2. Tambahkan Master Bank Soal TKA SMP DIY 2026 (Dipetakan ke Bab Kurikulum Resmi)
  if (Array.isArray(SOAL_TKA_2026_SMP_MTK_PAKET_B)) {
    SOAL_TKA_2026_SMP_MTK_PAKET_B.forEach((s) => {
      const babInfo = tentukanBabDanTopik('MTK', s, 'SMP');
      tambahSoalUnik({
        ...s,
        subtesKode: 'MTK',
        babNomor: babInfo.babNomor,
        namaBab: babInfo.namaBab,
        topik: babInfo.namaBab,
      }, 'MTK', babInfo.namaBab);
    });
  }
  if (Array.isArray(SOAL_TKA_2026_SMP_BINDO_PAKET_A)) {
    SOAL_TKA_2026_SMP_BINDO_PAKET_A.forEach((s) => {
      const babInfo = tentukanBabDanTopik('BIN', s, 'SMP');
      tambahSoalUnik({
        ...s,
        subtesKode: 'BIN',
        babNomor: babInfo.babNomor,
        namaBab: babInfo.namaBab,
        topik: babInfo.namaBab,
      }, 'BIN', babInfo.namaBab);
    });
  }

  // 3. Tambahkan Kuis Pemahaman Master dari 16 Bab Modul SMP 2027
  const mapelSmpList = [
    { kode: 'MTK', data: MTK_SMP_MODUL },
    { kode: 'BIN', data: BIN_SMP_MODUL },
    { kode: 'IPA', data: IPA_SMP_MODUL },
    { kode: 'BIG', data: BIG_SMP_MODUL },
  ];
  mapelSmpList.forEach(({ kode, data }) => {
    (data || []).forEach((babItem, bIdx) => {
      const judulBab = babItem.judul || `Bab ${bIdx + 1}`;
      const babNomor = babItem.babNumber || (bIdx + 1);
      (babItem.kuisPemahaman || []).forEach((k) => {
        tambahSoalUnik({
          ...k,
          subtesKode: kode,
          topik: judulBab,
          babNomor,
          namaBab: judulBab,
        }, kode, judulBab);
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
      const kode = PETA_KODE_SUBTES[s.subtesKode || s.kode || s.mapel] || 'PU';
      const babInfo = tentukanBabDanTopik(kode, s, 'SMA');
      tambahSoalUnik({
        ...s,
        subtesKode: kode,
        babNomor: babInfo.babNomor,
        namaBab: babInfo.namaBab,
      }, kode, babInfo.namaBab);
    });
  }

  // 3. Modul UTBK 46 Bab
  if (Array.isArray(DAFTAR_SUBTES_MODUL)) {
    DAFTAR_SUBTES_MODUL.forEach((st) => {
      const kode = st.kode;
      (st.babList || []).forEach((bab, bIdx) => {
        const judulBab = bab.judul || `Bab ${bIdx + 1}`;
        const babNomor = bab.babNumber || (bIdx + 1);
        (bab.kuisPemahaman || []).forEach((k) => {
          tambahSoalUnik({
            ...k,
            subtesKode: kode,
            topik: judulBab,
            babNomor,
            namaBab: judulBab,
          }, kode, judulBab);
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
  if (soalSubtes.length === 0) return [];

  // Kelompokkan butir soal per Bab / Silabus Kurikulum
  const mapBab = new Map();

  soalSubtes.forEach((s) => {
    let babInfo;
    if (s.babNomor && s.namaBab) {
      babInfo = { babNomor: s.babNomor, namaBab: s.namaBab, ringkas: `Bab ${s.babNomor}` };
    } else {
      babInfo = tentukanBabDanTopik(subtesKode, s, jenjang);
    }

    const kunci = `bab_${babInfo.babNomor}`;
    if (!mapBab.has(kunci)) {
      mapBab.set(kunci, {
        babNomor: babInfo.babNomor,
        namaBab: babInfo.namaBab,
        ringkas: babInfo.ringkas || `Bab ${babInfo.babNomor}`,
        soalList: [],
      });
    }
    mapBab.get(kunci).soalList.push(s);
  });

  const paketList = [];
  const babSorted = Array.from(mapBab.values()).sort((a, b) => a.babNomor - b.babNomor);

  babSorted.forEach((b) => {
    const totalSoal = b.soalList.length;
    // Batasi maksimal 2-3 paket terstruktur per bab (10-20 butir soal terbaik per bab)
    const nPaket = Math.min(3, Math.max(1, Math.ceil(totalSoal / ukuranPaket)));
    for (let i = 0; i < nPaket; i++) {
      const start = i * ukuranPaket;
      const sliceSoal = b.soalList.slice(start, start + ukuranPaket);
      if (sliceSoal.length > 0) {
        paketList.push({
          id: `paket_${String(jenjang).toLowerCase()}_${String(subtesKode).toLowerCase()}_bab_${b.babNomor}_p${i + 1}`,
          babNomor: b.babNomor,
          namaBab: b.namaBab,
          ringkasBab: b.ringkas,
          paketNomor: i + 1,
          judul: `${b.ringkas} · Paket ${i + 1}`,
          subjudul: `${sliceSoal.length} Butir Soal Terstruktur • Bab ${b.babNomor}`,
          subtesKode,
          jenjang,
          jumlahSoal: sliceSoal.length,
          durasiMenit: Math.max(10, Math.round(sliceSoal.length * 1.5)),
          soalList: sliceSoal,
        });
      }
    }
  });

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
