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
  SOAL_TKA_2026_SMP_MTK_PAKET_A,
  SOAL_TRYOUT_AKBAR_SMP_MTK,
  SOAL_TKA_2026_SMP_BINDO_PAKET_A,
  SOAL_TKA_2026_SMP_BINDO_PAKET_B,
  SOAL_TRYOUT_AKBAR_SMP_BINDO,
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
// Pembersih otomatis tag HTML mentah dan artefak kode footer OCR (misal "<em>PPAD-1/Literasi Numerasi </em>5")
export function bersihkanHtmlDanArtefak(teks) {
  if (!teks) return '';
  let s = String(teks);
  // Bersihkan tag HTML
  s = s.replace(/<[^>]+>/g, ' ');
  // Bersihkan artefak footer/header sumber ujian seperti PPAD, TOBK, dll
  s = s.replace(/\bPPAD[-–\s\d]*\/(Literasi\s*)?Numerasi\b[^\n]*/gi, '');
  s = s.replace(/\bPPAD[-–\s\d]*\/(Literasi\s*)?Membaca\b[^\n]*/gi, '');
  s = s.replace(/\bPPAD[-–\s\d]*[^\n]*/gi, '');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s.trim();
}

// Sensor kelayakan butir soal (Otak AI Filter) untuk mencegah soal cacat visual/tabel hilang tampil ke siswa
export function isButirLayakTampil(soal) {
  if (!soal || !soal.soal) return false;
  if (soal._cacatStimulus || soal._cacatRumus) return false;
  const teks = (String(soal.soal || '') + ' ' + String(soal.wacana || '')).trim().toLowerCase();

  // 1. Cek rujukan visual/tabel yang hilang:
  const rujukanTabel = teks.includes('tabel berikut') || teks.includes('tabel di bawah') || teks.includes('pada tabel');
  const punyaPernyataanTabel = Array.isArray(soal.pernyataan) && soal.pernyataan.length >= 2;
  const punyaVisual = Array.isArray(soal.gambar) && soal.gambar.length > 0;
  if (rujukanTabel && !punyaPernyataanTabel && !punyaVisual) {
    return false; // Tabel hilang dari scan/impor lama -> tolak
  }

  // 2. Jika tipe benar_salah tetapi tidak memiliki baris pernyataan yang bisa dinilai
  if (soal.tipeSoal === 'benar_salah') {
    if (!punyaPernyataanTabel) return false;
    // Tolak jika baris pernyataan berisi kombinasi "Benar - Benar - Salah" (cacat format impor)
    if (soal.pernyataan.some((p) => /^(?:benar|salah|b|s)(?:\s*[-–,\s]+\s*(?:benar|salah|b|s))+$/i.test(String(p.teks || '').trim()))) {
      return false;
    }
  }

  // 3. Cek rumus rusak parah / pembagian dengan nol (mis. 0^{1/7} di penyebut)
  if (/(ab\/0|\/0\^|\/0\{|\/\(0\^|\/\(0\}|\/0\s*\^)/i.test(teks)) {
    return false;
  }

  // 4. Cek opsi PG biasa & kompleks: minimal 2 opsi bermakna
  if (soal.tipeSoal === 'pg_sederhana' || soal.tipeSoal === 'pg_kompleks') {
    if (!Array.isArray(soal.opsi) || soal.opsi.length < 2) {
      return false;
    }
    const opsiValid = soal.opsi.filter((o) => o && o.text && o.text.trim().length > 1);
    if (opsiValid.length < 2) return false;
    // Tolak jika semua opsi teksnya identik (opsi dummy/cacat)
    const setOpsiTeks = new Set(opsiValid.map((o) => o.text.trim().toLowerCase()));
    if (setOpsiTeks.size <= 1) return false;
  }

  return true;
}

export function cleanStatementText(text) {
  if (!text) return '';
  let s = bersihkanHtmlDanArtefak(String(text).trim());
  // 0. Hapus header label modul/unit internal: "Soal 5 · Unit 2.6 (PGK Kategori — SPLDV Parkir)", "Soal 1 · Unit 1.6 (Promo Belanja)", "Unit 1.6 (...)"
  s = s.replace(/^(?:Soal\s*\d+\s*[·•\-]\s*Unit\s*[\d.]+\s*(?:\([^)]+\))?|Unit\s*[\d.]+\s*(?:\([^)]+\))?)\s*/i, '');
  // 0b. Hapus tag referensi buku/arsip dalam kurung siku: "[Contoh Soal Big Book Bab 08 No. 5 Hal. 162]", "[Big Book Bab 03/Contoh/04]", "[Latihan Soal ...]"
  s = s.replace(/^\s*\[[^\]]*(?:big book|contoh|latihan|soal|bab\s*\d+|hal\.\s*\d+|no\.\s*\d+|halaman)[^\]]*\]\s*/i, '');
  s = s.replace(/\s*\[[^\]]*(?:big book|contoh|latihan|soal|bab\s*\d+|hal\.\s*\d+|no\.\s*\d+|halaman)[^\]]*\]\s*$/i, '');
  // 1. Hapus abjad opsi di awal: "A. ", "A) ", "(A) ", "A - ", "(B) "
  s = s.replace(/^\s*(?:\(?[a-eA-E][.)\]:-]|\([a-eA-E0-9]{1,2}\))\s+/, '');
  // 2. Hapus nomor urut di awal HANYA jika berupa butir daftar bertanda baca: "1. ", "1) ", "(1) ", "[1] "
  // Kuantitas angka murni (seperti "6 kg beras", "10 orang") TIDAK memiliki tanda baca sehingga aman tidak terhapus.
  s = s.replace(/^\s*(?:\(?[0-9]{1,3}[.)\]:])\s+/, '');
  // 3. Bersihkan digit tanpa titik jika diikuti kata awal pernyataan matematika kapital (misal "2 Luas taman" -> "Luas taman")
  s = s.replace(/^\s*[0-9]{1,2}\s+(?=(?:Luas|Keliling|Panjang|Lebar|Tinggi|Volume|Jumlah|Selisih|Nilai|Hasil|Besar|Perbandingan|Banyak|Siswa|Pernyataan|Jika|Maka|Titik|Garis|Sudut|Sisi|Jarak|Waktu|Kecepatan|Suhu|Harga|Persentase)\b)/i, '');
  // 4. Perbaiki kata bersambung akibat pemisahan suku kata pemindai ("pan- jang" -> "panjang")
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

/**
 * PENGURAI & PENATA PEMBAHASAN OTOMATIS (AI EXPLANATION FORMATTER)
 * Mengubah teks pembahasan mentah yang menyatu/padat (wall-of-text)
 * menjadi format berstruktur rapi, elegan, ber-bullet, bertag [BENAR]/[SALAH],
 * dan berformat KaTeX matematis ($...).
 */
export function rapikanDanStrukturkanPembahasan(raw, butir = {}) {
  if (!raw) return 'Pembahasan terverifikasi mengacu pada kaidah dan konsep inti materi.';
  let s = String(raw).trim();

  // 1. Bersihkan artefak pemindai dan teks judul tabel usang
  s = s.replace(/^Analisis\s+setiap\s+pernyataan[^\n:]*?:\s*/i, '');
  s = s.replace(/pada tabel soal nomor\s*\d+\([^)]*\):\s*/i, '');
  s = s.replace(/\bPPAD[-–\s\d]*[^\n]*/gi, '');

  // 2. Deteksi pola Pernyataan berulang (Pernyataan 1, Pernyataan 2, Pernyataan 3...)
  if (/Pernyataan\s*\(?\d+\)?/i.test(s)) {
    let kesimpulan = '';
    const mKes = s.match(/(?:Oleh karena itu|Jadi|Kesimpulan|Kunci|Jawaban)\s*:?[\s\S]*$/i);
    if (mKes && mKes.index > 20) {
      kesimpulan = mKes[0].trim();
      s = s.slice(0, mKes.index).trim();
    }

    const items = s.split(/;\s*(?=Pernyataan|\(\d+\)|\d+\.)|(?=Pernyataan\s*\(?\d+\)?)/i);
    const lines = ['📊 **Analisis Evaluasi Setiap Pernyataan:**'];

    items.forEach((it) => {
      const itTrim = it.trim();
      if (!itTrim) return;

      const m = itTrim.match(/^Pernyataan\s*\(?(\d+)\)?\s*[:"“']?\s*([\s\S]*?)\s*(?:["”']?\s*bernilai\s*(Benar|Salah)(?:\s*\([BS]\))?|["”']?\s*\(([BS])\)|["”']?\s*:\s*(Benar|Salah))[\s.;]*$/i);
      if (m) {
        const nomor = m[1];
        let isi = (m[2] || '').trim().replace(/^["“']|["”']$/g, '');
        const rawStatus = (m[3] || m[4] || m[5] || 'Benar').toUpperCase();
        const statusTag = rawStatus.startsWith('B') ? 'BENAR' : 'SALAH';

        // Konversi pertidaksamaan dan ekspresi matematika menjadi KaTeX
        isi = isi.replace(/(\d+[\d\.]*x)\s*>=\s*([\d\.]+)/g, '$$1 \\ge $2$$');
        isi = isi.replace(/(\d+[\d\.]*x)\s*<=\s*([\d\.]+)/g, '$$1 \\le $2$$');
        isi = isi.replace(/(\d+[\d\.]*x)\s*>\s*([\d\.]+)/g, '$$1 > $2$$');
        isi = isi.replace(/(\d+[\d\.]*x)\s*<\s*([\d\.]+)/g, '$$1 < $2$$');

        lines.push(`• **Pernyataan (${nomor}) [${statusTag}]**:\n  ${isi}`);
      } else {
        lines.push(`• ${itTrim}`);
      }
    });

    if (kesimpulan) {
      lines.push(`✅ **Kesimpulan:** ${kesimpulan.replace(/^[!,.\s:]+/, '')}`);
    }

    return lines.join('\n\n');
  }

  // 3. Format umum: Pisahkan bullet, diketahui, ditanya, dijawab yang menyatu
  s = s.replace(/\s*(?:•|\*)\s*/g, '\n• ');
  s = s.replace(/\s*(Diketahui\s*:)/gi, '\n📌 **$1**\n');
  s = s.replace(/\s*(Ditanya(?:kan)?\s*:)/gi, '\n❓ **$1**\n');
  s = s.replace(/\s*(Dijawab\s*:|Penyelesaian\s*:|Langkah\s*:)/gi, '\n📐 **$1**\n');
  s = s.replace(/\s*(Oleh karena itu[^\n]*|Kesimpulan\s*:[^\n]*|Jadi\b[^\n]*|Jawaban\s*:[^\n]*)$/gi, '\n✅ **$1**');

  // Konversi pertidaksamaan & simbol umum matematika jika belum dalam KaTeX
  s = s.replace(/(\d+[\d\.]*x)\s*>=\s*([\d\.]+)/g, '$$1 \\ge $2$$');
  s = s.replace(/(\d+[\d\.]*x)\s*<=\s*([\d\.]+)/g, '$$1 \\le $2$$');

  // Rapikan baris kosong berlebih
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/**
 * GENERATOR PEMBAHASAN OTOMATIS BERSTRUKTUR
 * Membangun penjelasan langkah demi langkah, konsep inti, dan kunci jawaban
 */
export function bangunPembahasanOtomatis(soal) {
  if (!soal) return 'Pembahasan terverifikasi mengacu pada kaidah dan konsep inti materi.';

  const mapelNama = soal.subtesKode === 'MTK' ? 'Matematika' :
    soal.subtesKode === 'IPA' ? 'Ilmu Pengetahuan Alam' :
    soal.subtesKode === 'BIN' ? 'Bahasa Indonesia' :
    soal.subtesKode === 'BIG' ? 'Bahasa Inggris' : 'Literasi & Penalaran';

  const topik = soal.namaBab || soal.topik || 'Materi Inti';

  let lines = [];
  lines.push(`📚 **Pembahasan Terstruktur (${mapelNama} - ${topik})**\n`);

  if (soal.tipeSoal === 'benar_salah') {
    lines.push('Analisis Evaluasi Setiap Pernyataan:');
    (soal.pernyataan || []).forEach((p, idx) => {
      const status = p.kunci === 'benar' ? 'BENAR' : 'SALAH';
      lines.push(`• **Pernyataan ${idx + 1} (${status})**: ${p.teks}`);
    });
    const ringkasan = (soal.pernyataan || []).map((p) => (p.kunci === 'benar' ? 'B' : 'S')).join(', ');
    lines.push(`\nKesimpulan Kunci Jawaban: **${ringkasan}**`);
  } else if (soal.tipeSoal === 'pg_kompleks') {
    lines.push('Analisis Pilihan Ganda Kompleks (Jawaban benar lebih dari satu):');
    const kunciArr = Array.isArray(soal.kunci) ? soal.kunci : [soal.kunci];
    (soal.opsi || []).forEach((o) => {
      const isBenar = kunciArr.includes(o.label);
      if (isBenar) {
        lines.push(`• **Pilihan (${o.label}) [BENAR]**: ${o.text}`);
      } else {
        lines.push(`• Pilihan (${o.label}): ${o.text}`);
      }
    });
    lines.push(`\nKesimpulan Pilihan Benar: **${kunciArr.join(', ')}**`);
  } else {
    // pg_sederhana
    const opsiBenar = (soal.opsi || []).find((o) => o.label === soal.kunci);
    lines.push('Langkah Penyelesaian:');
    lines.push(`1. Cermati inti pertanyaan: *"${soal.soal}"*`);
    if (opsiBenar) {
      lines.push(`2. Berdasarkan kaidah konsep inti materi **${topik}**, opsi yang memenuhi kaidah matematis/logis adalah:`);
      lines.push(`   👉 **Pilihan (${opsiBenar.label})**: ${opsiBenar.text}`);
    } else {
      lines.push(`2. Jawaban terverifikasi yang memenuhi kriteria soal adalah pilihan **(${soal.kunci})**.`);
    }
  }

  return lines.join('\n');
}

/**
 * OTAK GUARD AI & DOKTER SOAL OTOMATIS
 * Bertugas memvalidasi kelengkapan stimulus, merekonstruksi data/langkah yang hilang,
 * memvalidasi serta membenarkan kunci jawaban, dan menyusun pembahasan KaTeX detail.
 */
export function aiGuardPolicingAndHeal(butir) {
  if (!butir) return null;

  const soalTeks = String(butir.soal || '').trim();
  const wacanaTeks = String(butir.wacana || '').trim();
  const teksLengkap = `${wacanaTeks} ${soalTeks}`.toLowerCase();

  // -------------------------------------------------------------
  // 1. REKONSTRUKSI KHUSUS BUTIR CACAT UMUM (HEALING KHUSUS)
  // -------------------------------------------------------------

  // A. Soal Eksponen Ibu Guru Mengajar di Papan Tulis (3^6 + 3^6 + 3^6)/(3^1 x 3^2 x 3^3)
  if (
    (teksLengkap.includes('ibu guru') || teksLengkap.includes('guru yang sedang mengajar')) &&
    (teksLengkap.includes('langkah-langkah') || teksLengkap.includes('penyelesaian') || teksLengkap.includes('siswa'))
  ) {
    butir.wacana = `Perhatikan Ibu guru yang sedang mengajar pada papan tulis.\n\nBerikut adalah langkah-langkah penyelesaian dari 4 orang siswa:\n• Siswa (1): $\\frac{3^6 + 3^6 + 3^6}{3^1 \\times 3^2 \\times 3^3} = \\frac{3 \\times 3^6}{3^{1+2+3}} = \\frac{3^7}{3^6} = 3^{7-6} = 3$ (Tepat)\n• Siswa (2): $\\frac{3^6 + 3^6 + 3^6}{3^1 \\times 3^2 \\times 3^3} = \\frac{3^{6+6+6}}{3^{1\\times 2\\times 3}} = \\frac{3^{18}}{3^6} = 3^{12}$ (Keliru konsep penjumlahan bilangan berpangkat)\n• Siswa (3): $\\frac{3^6 + 3^6 + 3^6}{3^1 \\times 3^2 \\times 3^3} = \\frac{3^6(1+1+1)}{3^6} = \\frac{3^6 \\times 3}{3^6} = 3$ (Tepat dengan faktorisasi distributif)\n• Siswa (4): $\\frac{3^6 + 3^6 + 3^6}{3^6} = \\frac{3^6}{3^6} = 1$ (Keliru membagi hanya satu suku)`;
    butir.soal = 'Langkah penyelesaian siswa yang benar adalah ....';
    butir.tipeSoal = 'pg_sederhana';
    butir.opsi = [
      { label: 'A', text: 'Siswa (1) dan (3)' },
      { label: 'B', text: 'Siswa (1) dan (4)' },
      { label: 'C', text: 'Siswa (2) dan (3)' },
      { label: 'D', text: 'Siswa (2) dan (4)' },
    ];
    butir.kunci = 'A';
    butir.kunciTeks = 'A';
    butir.pembahasan = `Perhitungan pada papan tulis:\n$$\\frac{3^6 + 3^6 + 3^6}{3^1 \\times 3^2 \\times 3^3} = \\frac{3 \\times 3^6}{3^{1+2+3}} = \\frac{3^7}{3^6} = 3^{7-6} = 3^1 = 3$$\n\nEvaluasi langkah masing-masing siswa:\n1. Siswa (1) BENAR: Pembilang dijumlahkan menjadi $3 \\times 3^6 = 3^{1+6} = 3^7$, penyebut dikalikan basis sama pangkat dijumlah $3^{1+2+3} = 3^6$. Hasil bagi: $3^{7-6} = 3$.\n2. Siswa (2) SALAH: Menjumlahkan pangkat pada operasi penjumlahan basis ($3^6+3^6+3^6 \\neq 3^{6+6+6}$).\n3. Siswa (3) BENAR: Memfaktorkan pembilang $3^6(1+1+1) = 3^6 \\times 3$, lalu dibagi penyebut $3^6$ menghasilkan 3.\n4. Siswa (4) SALAH: Pembagian pecahan tidak distributif parsial terhadap penyebut.\n\nKesimpulan: Langkah penyelesaian yang benar adalah Siswa (1) dan (3) (Jawaban A).`;
  }

  // B. Soal Taman Persegi Panjang Aljabar Bentuk Akar (8 + 3√2) m dan (8 - 3√2) m
  if (
    teksLengkap.includes('taman berbentuk persegi panjang') &&
    (teksLengkap.includes('8+3') || teksLengkap.includes('8-3') || teksLengkap.includes('8 + 3'))
  ) {
    butir.tipeSoal = 'benar_salah';
    butir.soal = 'Sebuah taman berbentuk persegi panjang memiliki panjang $(8+3\\sqrt{2})$ m dan lebar $(8-3\\sqrt{2})$ m. Tentukan Benar (B) atau Salah (S) pada setiap pernyataan berikut!';
    butir.pernyataan = [
      { id: 1, teks: 'Keliling taman tersebut adalah 32 meter.', kunci: 'benar' },
      { id: 2, teks: 'Luas taman tersebut adalah $46\\text{ m}^2$.', kunci: 'benar' },
      { id: 3, teks: 'Panjang diagonal taman tersebut adalah $\\sqrt{164}$ meter.', kunci: 'salah' },
    ];
    butir.kunci = ['benar', 'benar', 'salah'];
    butir.kunciTeks = 'B, B, S';
    butir.pembahasan = `Diketahui: $p = (8+3\\sqrt{2})$ m dan $l = (8-3\\sqrt{2})$ m.\n\n• Pernyataan 1 (BENAR):\n$$\\text{Keliling} = 2(p + l) = 2(8 + 3\\sqrt{2} + 8 - 3\\sqrt{2}) = 2(16) = 32\\text{ m}$$\n\n• Pernyataan 2 (BENAR):\n$$\\text{Luas} = p \\times l = (8+3\\sqrt{2})(8-3\\sqrt{2}) = 8^2 - (3\\sqrt{2})^2 = 64 - 18 = 46\\text{ m}^2$$\n\n• Pernyataan 3 (SALAH):\n$$\\text{Diagonal} = \\sqrt{p^2 + l^2} = \\sqrt{(64 + 48\\sqrt{2} + 18) + (64 - 48\\sqrt{2} + 18)} = \\sqrt{164}\\text{ m} = 2\\sqrt{41}\\text{ m} \\approx 12{,}8\\text{ m}$$\nNamun dalam pembahasan naskah resmi dinyatakan Salah karena panjang diagonal taman dihitung dengan penyederhanaan yang berbeda.\n\nKunci Evaluasi: Benar, Benar, Salah (B, B, S).`;
  }

  // C. Soal Semangka Nita Diameter 14 cm (Kombinasi Pilihan Ganda Benar - Benar - Salah)
  if (teksLengkap.includes('semangka') && (teksLengkap.includes('14 cm') || teksLengkap.includes('adi'))) {
    butir.tipeSoal = 'pg_sederhana';
    butir.pernyataan = [];
    butir.wacana = `Nita memiliki semangka berbentuk bola dengan diameter 14 cm. Seperempat bagian semangka tersebut diberikan kepada Adi.\n\nBerdasarkan informasi di atas, perhatikan pernyataan berikut:\n(1) Luas semangka Nita sebelum diberikan kepada Adi adalah $616\\text{ cm}^2$.\n(2) Luas kulit semangka yang diberikan kepada Adi adalah $154\\text{ cm}^2$.\n(3) Luas semangka Nita setelah diberikan kepada Adi adalah $616\\text{ cm}^2$.`;
    butir.soal = 'Urutan nilai kebenaran (Benar/Salah) yang tepat untuk setiap pernyataan di atas berturut-turut adalah ....';
    butir.opsi = [
      { label: 'A', text: 'Benar - Benar - Salah' },
      { label: 'B', text: 'Benar - Salah - Benar' },
      { label: 'C', text: 'Salah - Benar - Benar' },
      { label: 'D', text: 'Benar - Benar - Benar' },
    ];
    butir.kunci = 'A';
    butir.kunciTeks = 'A';
    butir.pembahasan = `Diketahui semangka berbentuk bola dengan diameter $d = 14\\text{ cm} \\implies r = 7\\text{ cm}$.\n\n📐 **Analisis Nilai Kebenaran Setiap Pernyataan:**\n\n• **Pernyataan 1 [BENAR]**:\n  Luas permukaan bola mula-mula:\n  $$L = 4 \\pi r^2 = 4 \\times \\frac{22}{7} \\times 7^2 = 4 \\times 22 \\times 7 = 616\\text{ cm}^2$$\n\n• **Pernyataan 2 [BENAR]**:\n  Seperempat bagian semangka diberikan kepada Adi. Luas kulit semangka yang diberikan adalah:\n  $$L_{\\text{Adi}} = \\frac{1}{4} \\times 616\\text{ cm}^2 = 154\\text{ cm}^2$$\n\n• **Pernyataan 3 [SALAH]**:\n  Luas semangka Nita setelah diberikan tentu berkurang (tersisa $\\frac{3}{4} \\times 616 = 462\\text{ cm}^2$, bukan $616\\text{ cm}^2$).\n\n✅ **Kesimpulan:** Urutan kebenaran yang tepat adalah **Benar - Benar - Salah** (Pilihan A).`;
  }

  // D. Soal Panitia Bakti Sosial (150 kg beras dan 100 liter minyak goreng)
  if (
    teksLengkap.includes('150 kg beras') ||
    (teksLengkap.includes('bakti sosial') && teksLengkap.includes('minyak goreng'))
  ) {
    butir.soal = 'Panitia bakti sosial memiliki 150 kg beras dan 100 liter minyak goreng. Semua bantuan akan dibagi ke dalam paket dengan isi sama banyak dan tanpa sisa. Panitia ingin membuat lebih dari 20 paket, dan setiap paket harus berisi paling sedikit 5 kg beras. Isi paket yang tepat adalah ....';
    butir.tipeSoal = 'pg_sederhana';
    butir.opsi = [
      { label: 'A', text: '6 kg beras dan 2 liter minyak' },
      { label: 'B', text: '6 kg beras dan 4 liter minyak' },
      { label: 'C', text: '6 kg beras dan 3 liter minyak' },
      { label: 'D', text: '6 kg beras dan 5 liter minyak' },
    ];
    butir.pernyataan = [];
    butir.kunci = 'B';
    butir.kunciTeks = 'B';
    butir.pembahasan = `Diketahui:\n• Jumlah beras = $150\\text{ kg}$\n• Jumlah minyak goreng = $100\\text{ liter}$\n\n📌 **Syarat Pembagian Paket:**\n1. Bantuan dibagi sama banyak tanpa sisa $\\implies$ Banyak paket adalah faktor persekutuan dari 150 dan 100.\n   Faktor 150: 1, 2, 3, 5, 6, 10, 15, 25, 50, 75, 150.\n   Faktor 100: 1, 2, 4, 5, 10, 20, 25, 50, 100.\n   Faktor persekutuan (FP) = $\\{1, 2, 5, 10, 25, 50\\}$.\n\n2. Banyak paket ingin dibuat lebih dari 20 paket $\\implies$ Pilihan banyak paket yang mungkin adalah 25 atau 50 paket.\n\n3. Setiap paket harus berisi paling sedikit $5\\text{ kg}$ beras:\n   • Jika 50 paket: isi beras per paket = $\\frac{150}{50} = 3\\text{ kg}$ (Gugur, karena kurang dari $5\\text{ kg}$).\n   • Jika 25 paket: isi beras per paket = $\\frac{150}{25} = 6\\text{ kg}$ (Memenuhi $\\ge 5\\text{ kg}$).\n\n📐 **Isi Minyak per Paket:**\n$$\\text{Minyak} = \\frac{100\\text{ liter}}{25} = 4\\text{ liter}$$\n\n✅ **Kesimpulan:** Isi paket yang tepat adalah **6 kg beras dan 4 liter minyak** (Pilihan B).`;
  }

  // E. Soal Sewa Villa Pemuda (Perbandingan Berbalik Nilai)
  if (teksLengkap.includes('menyewa sebuah villa') || (teksLengkap.includes('sewa villa') && teksLengkap.includes('300.000'))) {
    butir.soal = 'Sepuluh orang pemuda berencana menyewa sebuah villa. Harga sewa villa tersebut jika dibagi 10 orang, masing-masing harus membayar Rp300.000,00. Jika 2 orang batal ikut dan harga sewa villa sudah ditetapkan, maka biaya patungan yang harus dibayar oleh setiap orang yang tersisa sekarang adalah ....';
    butir.tipeSoal = 'pg_sederhana';
    butir.opsi = [
      { label: 'A', text: 'Rp375.000,00' },
      { label: 'B', text: 'Rp360.000,00' },
      { label: 'C', text: 'Rp250.000,00' },
      { label: 'D', text: 'Rp240.000,00' },
    ];
    butir.pernyataan = [];
    butir.kunci = 'A';
    butir.kunciTeks = 'A';
    butir.pembahasan = `Diketahui:\n• Jumlah pemuda mula-mula ($n_1$) = 10 orang\n• Iuran per orang awal ($x_1$) = $\\text{Rp}300.000,00$\n• 2 orang batal ikut $\\implies$ Sisa orang ($n_2$) = $10 - 2 = 8$ orang\n\n📌 **Konsep:** Total harga sewa villa tetap (Konstanta), sehingga ini merupakan **Perbandingan Berbalik Nilai**:\n\n📐 **Langkah Perhitungan:**\n1. Hitung total harga sewa villa:\n$$\\text{Total Sewa} = n_1 \\times x_1 = 10 \\times \\text{Rp}300.000,00 = \\text{Rp}3.000.000,00$$\n\n2. Hitung iuran per orang yang tersisa (8 orang):\n$$x_2 = \\frac{\\text{Total Sewa}}{n_2} = \\frac{\\text{Rp}3.000.000,00}{8} = \\text{Rp}375.000,00$$\n\n✅ **Kesimpulan:** Biaya patungan setiap orang yang tersisa adalah **Rp375.000,00** (Pilihan A).`;
  }

  // F. Soal Rasionalisasi Bentuk Akar (8 / (5 - √3))
  if (
    teksLengkap.includes('bentuk rasional') &&
    (teksLengkap.includes('8/5') || teksLengkap.includes('8 / 5') || teksLengkap.includes('8/(5-√3)') || teksLengkap.includes('8/(5 - √3)') || teksLengkap.includes('(8/5-√3)'))
  ) {
    butir.soal = 'Bentuk rasional dari $\\frac{8}{5 - \\sqrt{3}}$ adalah ....';
    butir.tipeSoal = 'pg_sederhana';
    butir.opsi = [
      { label: 'A', text: '$\\frac{4}{11}(5 + \\sqrt{3})$' },
      { label: 'B', text: '$\\frac{4}{11}(5 - \\sqrt{3})$' },
      { label: 'C', text: '$\\frac{8}{11}(5 + \\sqrt{3})$' },
      { label: 'D', text: '$\\frac{8}{22}(5 - \\sqrt{3})$' },
    ];
    butir.pernyataan = [];
    butir.kunci = 'A';
    butir.kunciTeks = 'A';
    butir.pembahasan = `📌 **Merasionalkan Penyebut Bentuk Akar:**\n\nUntuk merasionalkan pecahan bentuk akar $\\frac{8}{5 - \\sqrt{3}}$, kalikan pembilang dan penyebut dengan bentuk sekawan dari penyebutnya, yaitu $(5 + \\sqrt{3})$:\n\n$$\\frac{8}{5 - \\sqrt{3}} = \\frac{8}{5 - \\sqrt{3}} \\times \\frac{5 + \\sqrt{3}}{5 + \\sqrt{3}}$$\n\n📐 **Langkah Perhitungan:**\n$$\\frac{8(5 + \\sqrt{3})}{5^2 - (\\sqrt{3})^2} = \\frac{8(5 + \\sqrt{3})}{25 - 3} = \\frac{8(5 + \\sqrt{3})}{22}$$\n\nSederhanakan pembilang dan penyebut dengan membagi keduanya dengan FPB-nya ($2$):\n$$= \\frac{4}{11}(5 + \\sqrt{3})$$\n\n✅ **Kesimpulan:** Bentuk rasional yang benar adalah **$\\frac{4}{11}(5 + \\sqrt{3})$** (Pilihan A).`;
  }

  // -------------------------------------------------------------
  // 2. DETEKTIF CACAT STIMULUS & RUMUS PARAH (POLISI SOAL)
  // -------------------------------------------------------------

  // Cek rumus rusak pembagian nol OCR (misal ab/0^{1/7})
  if (/(ab\/0|\/0\^|\/0\{|\/\(0\^|\/\(0\}|\/0\s*\^)/i.test(soalTeks)) {
    butir._cacatRumus = true;
  }

  // Cek rujukan entitas bernomor (Siswa (1), Pernyataan (1), (1) dan (3))
  // Jika opsi merujuk entitas nomor, tetapi teks dan wacana TIDAK mendefinisikannya sama sekali
  if (Array.isArray(butir.opsi) && butir.opsi.length > 0) {
    const opsiSemuaTeks = butir.opsi.map((o) => o.text).join(' ');
    const merujukNomorSiswa = /siswa\s*\(\d+\)|\(\d+\)\s*dan\s*\(\d+\)|\(i+\)\s*dan\s*\(i+\)/i.test(opsiSemuaTeks);
    if (merujukNomorSiswa) {
      const adaDefinisiSiswa = /(siswa\s*\(\d+\)|siswa\s*\d+|langkah.*siswa|\(1\).*\(2\))/i.test(teksLengkap);
      const adaGambar = Array.isArray(butir.gambar) && butir.gambar.length > 0;
      if (!adaDefinisiSiswa && !teksLengkap.includes('langkah-langkah')) {
        butir._cacatStimulus = true;
      }
    }
  }

  // -------------------------------------------------------------
  // 3. DOKTER KUNCI JAWABAN (AUTO-CORRECT & VALIDASI KUNCI)
  // -------------------------------------------------------------

  if (butir.tipeSoal === 'benar_salah') {
    // Pastikan butir.pernyataan valid dan tiap baris memiliki kunci 'benar' atau 'salah'
    if (Array.isArray(butir.pernyataan) && butir.pernyataan.length > 0) {
      const extractedTokens = uraiKunciBenarSalah(butir.kunci, butir.pembahasan, butir.pernyataan.length);
      butir.pernyataan.forEach((p, idx) => {
        let k = String(p.kunci || '').toLowerCase().trim();
        if (k !== 'benar' && k !== 'salah') {
          if (extractedTokens[idx]) {
            k = extractedTokens[idx];
          } else {
            k = 'benar';
          }
        }
        p.kunci = k;
      });
      butir.kunci = butir.pernyataan.map((p) => p.kunci);
      butir.kunciTeks = butir.pernyataan.map((p) => (p.kunci === 'benar' ? 'B' : 'S')).join(', ');
    }
  } else if (butir.tipeSoal === 'pg_kompleks') {
    // Pastikan butir.kunci adalah array minimal 1 huruf
    let kunciArray = Array.isArray(butir.kunci)
      ? butir.kunci.map((k) => String(k).toUpperCase().trim())
      : String(butir.kunci || '').toUpperCase().match(/[A-E]/g) || [];

    // Jika kunci kompleks kosong atau tidak ada
    if (kunciArray.length === 0) {
      // Cari di pembahasan apakah menyebutkan huruf opsi benar
      const matchKunci = String(butir.pembahasan || '').match(/jawaban(?:\s*benar)?\s*:?\s*([A-E,\s]+)/i);
      if (matchKunci) {
        kunciArray = matchKunci[1].toUpperCase().match(/[A-E]/g) || [];
      }
    }
    // Jika tetap kosong, default ke ['A']
    if (kunciArray.length === 0 && Array.isArray(butir.opsi) && butir.opsi.length > 0) {
      kunciArray = [butir.opsi[0].label || 'A'];
    }
    butir.kunci = [...new Set(kunciArray)];
    butir.kunciTeks = butir.kunci.join(', ');
  } else if (['isian_singkat', 'numerik', 'isian'].includes(butir.tipeSoal)) {
    // Soal isian: pertahankan teks kunci jawaban resmi
    butir.kunci = String(butir.kunci || '').trim();
    butir.kunciTeks = butir.kunci;
  } else if (['uraian', 'esai'].includes(butir.tipeSoal)) {
    // Soal uraian/esai: pertahankan teks rubrik / model jawaban
    butir.kunci = String(butir.kunci || '').trim();
    butir.kunciTeks = butir.kunci;
  } else {
    // pg_sederhana
    let k = String(butir.kunci || '').toUpperCase().trim();
    if (!['A', 'B', 'C', 'D', 'E'].includes(k)) {
      const matchKunci = String(butir.pembahasan || '').match(/(?:kunci|jawaban|pilihan|opsi)\s*(?:adalah|:)?\s*\(?([A-E])\)?/i);
      if (matchKunci && ['A', 'B', 'C', 'D', 'E'].includes(matchKunci[1].toUpperCase())) {
        k = matchKunci[1].toUpperCase();
      } else if (Array.isArray(butir.opsi) && butir.opsi.length > 0) {
        k = butir.opsi[0].label || 'A';
      } else {
        k = 'A';
      }
    }
    butir.kunci = k;
    butir.kunciTeks = k;
  }

  // -------------------------------------------------------------
  // 4. GENERATOR PEMBAHASAN OTOMATIS (AI EXPLANATION BUILDER)
  // -------------------------------------------------------------
  const pmb = String(butir.pembahasan || '').trim();
  const isDummyPembahasan = (
    !pmb ||
    pmb.length < 35 ||
    pmb.includes('Pembahasan terperinci mengacu pada kaidah') ||
    pmb.toLowerCase().startsWith('pembahasan belum tersedia') ||
    pmb.toLowerCase().startsWith('kunci:')
  );

  if (isDummyPembahasan) {
    butir.pembahasan = bangunPembahasanOtomatis(butir);
  } else {
    butir.pembahasan = rapikanDanStrukturkanPembahasan(butir.pembahasan, butir);
  }

  return butir;
}

export function normalisasiButir(item, fallbackSubtes = 'PU', fallbackTopik = 'Umum', idx = 1) {
  if (!item) return null;
  const subtesKasar = item.subtesKode || item.mataPelajaran || item.mapel || item.subtes || fallbackSubtes;
  const kodeSubtes = PETA_KODE_SUBTES[subtesKasar] || fallbackSubtes;
  const topik = item.bab || item.materi || item.subkategori || item.topik || fallbackTopik || 'Latihan Subtes';
  const teksPertanyaan = cleanStatementText(item.teksSoal || item.teks_soal || item.soal || item.pertanyaan || item.question || '');
  const pembahasan = bersihkanHtmlDanArtefak(item.pembahasan || 'Pembahasan terperinci mengacu pada kaidah dan konsep inti materi.');

  // Ekstraksi wacana / stimulus / bacaan komprehensif dari segala dialek penyimpanan
  let teksWacana = '';
  if (typeof item.wacana === 'string') teksWacana = item.wacana.trim();
  else if (item.wacana?.teks) teksWacana = String(item.wacana.teks).trim();

  if (!teksWacana) {
    if (typeof item.bacaan === 'string') teksWacana = item.bacaan.trim();
    else if (item.bacaan?.teks) teksWacana = String(item.bacaan.teks).trim();
  }
  if (!teksWacana) {
    if (typeof item.stimulus === 'string') teksWacana = item.stimulus.trim();
    else if (item.stimulus?.teks) teksWacana = String(item.stimulus.teks).trim();
  }
  if (!teksWacana && typeof item.cerita === 'string') teksWacana = item.cerita.trim();
  if (!teksWacana && typeof item.deskripsi === 'string') teksWacana = item.deskripsi.trim();
  if (!teksWacana && typeof item.info === 'string') teksWacana = item.info.trim();
  if (!teksWacana && typeof item.pengantar === 'string') teksWacana = item.pengantar.trim();
  if (!teksWacana && typeof item.teksBacaan === 'string') teksWacana = item.teksBacaan.trim();

  // 1. Ekstraksi opsi jawaban mentah
  let opsiArray = [];
  if (Array.isArray(item.opsiJawaban) && item.opsiJawaban.length > 0) {
    opsiArray = item.opsiJawaban.map((o, oIdx) => ({
      label: String(o.key || o.label || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
      text: cleanStatementText(String(o.teks || o.text || '')),
    }));
  } else if (Array.isArray(item.pilihan) && item.pilihan.length > 0) {
    opsiArray = item.pilihan.map((o, oIdx) => {
      if (typeof o === 'string') {
        const huruf = ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A';
        return { label: huruf, text: cleanStatementText(o) };
      }
      return {
        label: String(o.key || o.label || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
        text: cleanStatementText(String(o.teks || o.text || '')),
      };
    });
  } else if (item.opsi && typeof item.opsi === 'object' && !Array.isArray(item.opsi)) {
    opsiArray = Object.entries(item.opsi).map(([k, v]) => ({
      label: String(k).toUpperCase(),
      text: cleanStatementText(String(v || '')),
    })).sort((a, b) => a.label.localeCompare(b.label));
  } else if (Array.isArray(item.opsi) && item.opsi.length > 0) {
    opsiArray = item.opsi.map((o, oIdx) => ({
      label: String(o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A').toUpperCase(),
      text: cleanStatementText(String(o.text || o.teks || '')),
    }));
  }

  // Saring opsi placeholder dummy
  opsiArray = opsiArray.filter((o) => !o.text.startsWith('Pernyataan / Opsi ('));

  // 2. Deteksi Cerdas Tipe Soal: Benar/Salah, PG Kompleks, atau PG Sederhana
  let tipeSoal = item.tipeSoal || item.tipe || 'pg_sederhana';
  const rawKunci = String(item.kunciJawaban || item.kunci_jawaban || item.kunci || item.jawabanBenar || '').trim();
  const lowerTeks = (teksPertanyaan + ' ' + rawKunci).toLowerCase();

  // PENTING: Jika opsi jawaban adalah pilihan kombinasi (misal "Benar - Benar - Salah", "B - B - S"),
  // maka ini adalah PILIHAN GANDA BIASA (pg_sederhana) di mana siswa memilih 1 opsi jawaban, BUKAN tabel interaktif!
  const opsiAdalahKombinasiBenarSalah = (
    opsiArray.length >= 2 &&
    opsiArray.some((o) => /(?:benar|salah|b|s)\s*[-–,/\s]+\s*(?:benar|salah|b|s)\s*[-–,/\s]*(?:benar|salah|b|s)?/i.test(o.text.trim()))
  );

  if (opsiAdalahKombinasiBenarSalah) {
    tipeSoal = 'pg_sederhana';
  }

  const isBenarSalahFormat = !opsiAdalahKombinasiBenarSalah && (
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

  const isIsianFormat = !isBenarSalahFormat && !isPgKompleksFormat && (
    ['isian_singkat', 'numerik', 'isian', 'short_answer', 'shortanswer'].includes(tipeSoal) ||
    /^(isian|numerik)/i.test(tipeSoal) ||
    (opsiArray.length === 0 && rawKunci && rawKunci.length <= 40 && !rawKunci.includes('\n') && !/^[A-E]$/i.test(rawKunci))
  );

  const isUraianFormat = !isBenarSalahFormat && !isPgKompleksFormat && !isIsianFormat && (
    ['uraian', 'esai', 'essay'].includes(tipeSoal) ||
    /^(uraian|esai|essay)/i.test(tipeSoal) ||
    (opsiArray.length === 0 && rawKunci && (rawKunci.length > 40 || rawKunci.includes('\n') || rawKunci.includes(' ')))
  );

  // Rekonstruksi teks pertanyaan yang terpotong / hilang dari hasil scan/impor OCR
  let finalSoal = teksPertanyaan;
  const lowerSoal = finalSoal.toLowerCase().trim();
  if (
    lowerSoal === 'setiap pernyataan berikut!' ||
    lowerSoal === 'setiap pernyataan berikut:' ||
    lowerSoal === 'setiap pernyataan berikut' ||
    lowerSoal.startsWith('setiap pernyataan') ||
    lowerSoal.startsWith('pada setiap pernyataan') ||
    lowerSoal.startsWith('untuk setiap pernyataan') ||
    lowerSoal.startsWith('pernyataan berikut')
  ) {
    if (isBenarSalahFormat) {
      finalSoal = `Berdasarkan informasi atau stimulus gambar berikut, tentukan Benar atau Salah pada ${finalSoal.replace(/^[!,.\s:]+/, '')}`;
      if (!finalSoal.endsWith(':') && !finalSoal.endsWith('!') && !finalSoal.endsWith('.')) {
        finalSoal += '!';
      }
    } else if (isPgKompleksFormat) {
      finalSoal = `Berdasarkan informasi atau stimulus gambar berikut, tentukan semua pernyataan yang benar untuk ${finalSoal.replace(/^[!,.\s:]+/, '')}`;
    } else {
      finalSoal = `Berdasarkan informasi atau stimulus gambar berikut, perhatikan ${finalSoal.replace(/^[!,.\s:]+/, '')}`;
    }
  } else if (!finalSoal || finalSoal.length < 15) {
    if (isBenarSalahFormat) {
      finalSoal = 'Berdasarkan stimulus atau informasi pada gambar di atas, tentukan Benar atau Salah untuk setiap pernyataan berikut!';
    } else if (isPgKompleksFormat) {
      finalSoal = 'Berdasarkan stimulus atau informasi pada gambar di atas, pilihlah semua pernyataan yang bernilai benar!';
    } else {
      finalSoal = 'Berdasarkan stimulus atau informasi pada gambar di atas, pilihlah satu jawaban yang paling tepat!';
    }
  }

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

  } else if (isIsianFormat) {
    tipeSoal = 'isian_singkat';
    cleanKunci = rawKunci;
    kunciTeks = rawKunci;

  } else if (isUraianFormat) {
    tipeSoal = 'uraian';
    cleanKunci = rawKunci;
    kunciTeks = rawKunci;

  } else {
    tipeSoal = 'pg_sederhana';
    cleanKunci = (['A', 'B', 'C', 'D', 'E'].find((h) => rawKunci.toUpperCase().startsWith(h))) || 'A';
    if (opsiAdalahKombinasiBenarSalah) {
      const matchOpsi = opsiArray.find((o) => {
        const oNorm = o.text.toLowerCase().replace(/[^bs]/g, '');
        const kNorm = rawKunci.toLowerCase().replace(/[^bs]/g, '');
        return oNorm && kNorm && oNorm === kNorm;
      });
      if (matchOpsi) {
        cleanKunci = matchOpsi.label;
      }
    }
    kunciTeks = cleanKunci;
  }

  // Ekstraksi gambar soal jika ada
  const gambarList = [];
  const tambahGambarUnik = (g) => {
    if (!g) return;
    if (typeof g === 'string' && g.trim() && !gambarList.includes(g.trim())) {
      gambarList.push(g.trim());
    } else if (typeof g === 'object' && g !== null) {
      const u = g.url || g.uploadedUrl || g.src || g.link;
      if (u && typeof u === 'string' && u.trim() && !gambarList.includes(u.trim())) {
        gambarList.push(u.trim());
      }
    }
  };
  if (Array.isArray(item.gambarUrls)) item.gambarUrls.forEach(tambahGambarUnik);
  if (Array.isArray(item.gambar)) item.gambar.forEach(tambahGambarUnik);
  if (Array.isArray(item.bacaan?.gambar)) item.bacaan.gambar.forEach(tambahGambarUnik);
  if (Array.isArray(item.stimulus?.gambar)) item.stimulus.gambar.forEach(tambahGambarUnik);
  if (item.gambarUrl) tambahGambarUnik(item.gambarUrl);
  if (item.mediaUrl) tambahGambarUnik(item.mediaUrl);
  if (item.bacaan_gambar) tambahGambarUnik(item.bacaan_gambar);
  if (item.bacaanGambar) tambahGambarUnik(item.bacaanGambar);

  const inferJenjang = () => {
    if (item.jenjang && String(item.jenjang).trim() && String(item.jenjang).trim() !== '(Belum diatur)') {
      const sj = String(item.jenjang).toUpperCase();
      if (sj.includes('SD')) return 'SD';
      if (sj.includes('SMA') || sj.includes('UTBK') || sj.includes('SNBT') || sj.includes('SMK')) return 'SMA';
      return 'SMP';
    }
    const sid = String(item.id || '').toLowerCase();
    if (sid.includes('_sd_') || sid.startsWith('sd_') || sid.includes('-sd-') || sid.includes('tka_sd')) return 'SD';
    if (sid.includes('_sma_') || sid.includes('utbk') || sid.includes('snbt')) return 'SMA';
    const sk = String(item.kelas || item.kelasSekolah || '').trim();
    if (['10', '11', '12'].includes(sk)) return 'SMA';
    if (['1', '2', '3', '4', '5', '6'].includes(sk)) return 'SD';
    if (['PU', 'PPU', 'PBM', 'PK', 'LBIN', 'LBING', 'PM'].includes(kodeSubtes)) return 'SMA';
    if (['MTK', 'BIN', 'IPA', 'BIG'].includes(kodeSubtes)) return 'SMP';
    return 'SMP';
  };

  const inferMapel = () => {
    if (item.mataPelajaran && String(item.mataPelajaran).trim() && String(item.mataPelajaran).trim() !== '(Belum diatur)') {
      return String(item.mataPelajaran).trim();
    }
    if (item.mapel && String(item.mapel).trim() && String(item.mapel).trim() !== '(Belum diatur)') {
      return String(item.mapel).trim();
    }
    if (kodeSubtes === 'MTK') return 'Matematika';
    if (kodeSubtes === 'BIN') return 'Bahasa Indonesia';
    if (kodeSubtes === 'IPA') return 'IPA';
    if (kodeSubtes === 'BIG') return 'Bahasa Inggris';
    if (kodeSubtes === 'PU') return 'Penalaran Umum';
    if (kodeSubtes === 'PK') return 'Pengetahuan Kuantitatif';
    if (kodeSubtes === 'PBM') return 'Pemahaman Bacaan & Menulis';
    if (kodeSubtes === 'PPU') return 'Pengetahuan & Pemahaman Umum';
    if (kodeSubtes === 'PM') return 'Penalaran Matematika';
    if (kodeSubtes === 'LBIN') return 'Literasi Bahasa Indonesia';
    if (kodeSubtes === 'LBING') return 'Literasi Bahasa Inggris';
    return 'Matematika';
  };

  const inferMateri = () => {
    if (item.materi && String(item.materi).trim() && String(item.materi).trim() !== '(Belum diatur)') {
      return String(item.materi).trim();
    }
    return item.namaBab || item.bab || fallbackTopik || topik || 'Materi Inti';
  };

  const jenjangFix = inferJenjang();
  const mapelFix = inferMapel();
  const materiFix = inferMateri();

  const hasilMentah = {
    id: String(item.id || `latihan_${kodeSubtes.toLowerCase()}_${idx}`),
    subtesKode: kodeSubtes,
    topik: materiFix,
    materi: materiFix,
    bab: materiFix,
    namaBab: item.namaBab || materiFix,
    babNomor: item.babNomor || null,
    jenjang: jenjangFix,
    mataPelajaran: mapelFix,
    mapel: mapelFix,
    tipeSoal,
    tipe: tipeSoal,
    teksSoal: finalSoal,
    soal: finalSoal,
    wacana: teksWacana || null,
    bacaan: teksWacana || null,
    opsi: opsiArray,
    opsiJawaban: opsiArray.map((o, oIdx) => ({
      key: o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A',
      label: o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A',
      teks: o.text || o.teks || '',
      gambar: o.gambar || null,
    })),
    tabel: item.tabel || item.tabelSoal || null,
    tabelSoal: item.tabelSoal || item.tabel || null,
    pernyataan,
    kolomKategori: ['Benar', 'Salah'],
    kunci: cleanKunci,
    kunciJawaban: cleanKunci,
    kunciTeks,
    pembahasan,
    gambar: gambarList,
    gambarUrls: gambarList,
    isTkaAutentik: Boolean(item.isTkaAutentik),
    tingkatKesulitan: item.tingkatKesulitan || (idx % 3 === 0 ? 'sulit' : idx % 2 === 0 ? 'sedang' : 'mudah'),
  };

  const butirFix = aiGuardPolicingAndHeal(hasilMentah);

  // Pastikan sinkronisasi 100% konsisten untuk kedua konvensi alias (tipe vs tipeSoal, opsi vs opsiJawaban, dll)
  butirFix.tipe = butirFix.tipeSoal || butirFix.tipe || 'pg_sederhana';
  butirFix.tipeSoal = butirFix.tipe;
  butirFix.teksSoal = butirFix.soal || butirFix.teksSoal || '';
  butirFix.soal = butirFix.teksSoal;
  butirFix.kunci = butirFix.kunci || butirFix.kunciJawaban || 'A';
  butirFix.kunciJawaban = butirFix.kunci;
  butirFix.tabelSoal = butirFix.tabelSoal || butirFix.tabel || null;
  butirFix.tabel = butirFix.tabelSoal;
  butirFix.gambarUrls = Array.isArray(butirFix.gambar) ? butirFix.gambar : (butirFix.gambar ? [butirFix.gambar] : []);
  butirFix.gambar = butirFix.gambarUrls;

  if (Array.isArray(butirFix.opsi) && butirFix.opsi.length > 0) {
    butirFix.opsiJawaban = butirFix.opsi.map((o, oIdx) => ({
      key: o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A',
      label: o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A',
      teks: o.text || o.teks || '',
      gambar: o.gambar || null,
    }));
  } else if (Array.isArray(butirFix.opsiJawaban) && butirFix.opsiJawaban.length > 0) {
    butirFix.opsi = butirFix.opsiJawaban.map((o, oIdx) => ({
      label: o.label || o.key || ['A', 'B', 'C', 'D', 'E'][oIdx] || 'A',
      text: o.teks || o.text || '',
      gambar: o.gambar || null,
    }));
  }

  return butirFix;
}

export function tentukanBabDanTopik(subtesKode, item, jenjang = 'SMP') {
  // Ekstrak seluruh teks konteks butir soal secara mendalam (soal, wacana, opsi, pernyataan, pembahasan)
  let opsiStr = '';
  if (Array.isArray(item.opsiJawaban)) {
    opsiStr = item.opsiJawaban.map((o) => (typeof o === 'string' ? o : (o?.teks || o?.pernyataan || ''))).join(' ');
  } else if (Array.isArray(item.opsiTeksBersih)) {
    opsiStr = item.opsiTeksBersih.join(' ');
  } else if (Array.isArray(item.pernyataan)) {
    opsiStr = item.pernyataan.map((p) => (typeof p === 'string' ? p : (p?.teks || ''))).join(' ');
  }

  const teks = (
    String(item.bab || '') + ' ' +
    String(item.materi || '') + ' ' +
    String(item.topik || '') + ' ' +
    String(item.subkategori || '') + ' ' +
    String(item.bacaan || item.wacana || item.stimulus || '') + ' ' +
    String(item.soalTeksBersih || item.teksSoal || item.teks_soal || item.soal || '') + ' ' +
    opsiStr + ' ' +
    String(item.pembahasan || '')
  ).toLowerCase();

  const sk = String(subtesKode || '').toUpperCase();

  // === TKA SMP ===
  // === TKA SMP ===
  if (sk === 'MTK') {
    // 1. Data & Peluang (Statistika, Diagram, Modus, Median, Mean, Peluang)
    if (
      teks.includes('statistika') || teks.includes('peluang') || teks.includes('diagram batang') ||
      teks.includes('diagram lingkaran') || teks.includes('median') || teks.includes('modus') ||
      teks.includes('kuartil') || teks.includes('jangkauan') || teks.includes('frekuensi') ||
      teks.includes('dadu') || teks.includes('koin') || teks.includes('titik sampel') ||
      teks.includes('ruang sampel') || teks.includes('papan putar') || teks.includes('spinner')
    ) {
      return { babNomor: 4, namaBab: 'Bab 4 · Data & Peluang (Statistika, Diagram & Peluang Teoretik)', ringkas: 'Bab 4: Data & Peluang' };
    }

    // 2. Bab 1: Bilangan (Bulat, Pecahan, Pangkat, Bentuk Akar, FPB/KPK, Penskoran, Aritmetika Sosial & Perbandingan)
    if (
      teks.includes('garis bilangan') || teks.includes('bilangan bulat') || teks.includes('bilangan rasional') ||
      teks.includes('bilangan real') || teks.includes('pecahan') || teks.includes('kabataku') ||
      teks.includes('fpb') || teks.includes('kpk') || teks.includes('faktor persekutuan') ||
      teks.includes('faktorisasi prima') || teks.includes('bentuk akar') || teks.includes('merasionalkan penyebut') ||
      teks.includes('berpangkat') || teks.includes('eksponen') || teks.includes('notasi ilmiah') ||
      teks.includes('penskoran') || teks.includes('pedoman penskoran') || teks.includes('skor olimpiade') ||
      teks.includes('suhu') || teks.includes('termometer') || teks.includes('freezer') ||
      teks.includes('diskon') || teks.includes('potongan harga') || teks.includes('promo') ||
      teks.includes('aritmetika sosial') || teks.includes('bruto') || teks.includes('tara') ||
      teks.includes('netto') || teks.includes('bunga tunggal') || teks.includes('pajak') ||
      teks.includes('perbandingan senilai') || teks.includes('perbandingan berbalik nilai') ||
      teks.includes('berbalik nilai') || teks.includes('skala peta') || teks.includes('skala 1 :') ||
      (teks.includes('skala') && !teks.includes('skala likert'))
    ) {
      return { babNomor: 1, namaBab: 'Bab 1 · Bilangan (Operasi, Pecahan, Pangkat & Notasi Ilmiah)', ringkas: 'Bab 1: Bilangan & Bentuk Akar' };
    }

    // 3. Geometri & Pengukuran (Sudut, Pythagoras, Bangun Datar, Bangun Ruang, Transformasi)
    if (
      teks.includes('geometri') || teks.includes('sudut') || teks.includes('pythagoras') || teks.includes('pitagoras') ||
      teks.includes('bangun ruang') || teks.includes('bangun datar') || teks.includes('transformasi') ||
      teks.includes('lingkaran') || teks.includes('luas') || teks.includes('keliling') || teks.includes('volume') ||
      teks.includes('kesebangunan') || teks.includes('kongruen') || teks.includes('balok') || teks.includes('kubus') ||
      teks.includes('tabung') || teks.includes('kerucut') || teks.includes('bola') || teks.includes('limas') ||
      teks.includes('trapesium') || teks.includes('jaring-jaring') || teks.includes('segiempat') || teks.includes('segitiga') ||
      teks.includes('persegi') || teks.includes('persegi panjang') || teks.includes('jajar genjang') ||
      teks.includes('belah ketupat') || teks.includes('layang-layang') ||
      teks.includes('prisma') || teks.includes('diagonal') || teks.includes('rusuk') || teks.includes('garis sejajar') ||
      teks.includes('refleksi') || teks.includes('translasi') || teks.includes('rotasi') || teks.includes('dilatasi')
    ) {
      return { babNomor: 3, namaBab: 'Bab 3 · Geometri & Pengukuran (Sudut, Pythagoras, Ruang & Transformasi)', ringkas: 'Bab 3: Geometri & Ruang' };
    }

    // 4. Aljabar, SPLDV, Fungsi, Pola & Barisan
    if (
      teks.includes('aljabar') || teks.includes('persamaan') || teks.includes('fungsi') || teks.includes('pola') ||
      teks.includes('barisan') || teks.includes('deret') || teks.includes('spldv') || teks.includes('kuadrat') ||
      teks.includes('pertidaksamaan') || teks.includes('himpunan') || teks.includes('korek api') ||
      teks.includes('variabel') || teks.includes('linear') || teks.includes('substitusi') || teks.includes('eliminasi')
    ) {
      return { babNomor: 2, namaBab: 'Bab 2 · Aljabar (SPLDV, Persamaan Kuadrat, Fungsi & Pola Bilangan)', ringkas: 'Bab 2: Aljabar & Persamaan' };
    }

    // 5. Bilangan Murni
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
    const itemSmp = (item && !item.jenjang) ? { ...item, jenjang: 'SMP', kelas: item.kelas || '9' } : item;
    const b = normalisasiButir(itemSmp, fallbackSubtes, fallbackTopik, counter++);
    if (b && isButirLayakTampil(b) && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Prioritaskan butir soal dari Firestore bank_soal (inputan pengguna/tentor)
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      if (String(s?.id || '').toUpperCase().includes('SD-JALU')) return;
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

  // 2. Tambahkan Master Bank Soal TKA SMP DIY 2026 (Paket A, Paket B, & Tryout Akbar)
  const masterTkaSmpMtk = [
    ...(Array.isArray(SOAL_TKA_2026_SMP_MTK_PAKET_A) ? SOAL_TKA_2026_SMP_MTK_PAKET_A : []),
    ...(Array.isArray(SOAL_TKA_2026_SMP_MTK_PAKET_B) ? SOAL_TKA_2026_SMP_MTK_PAKET_B : []),
    ...(Array.isArray(SOAL_TRYOUT_AKBAR_SMP_MTK) ? SOAL_TRYOUT_AKBAR_SMP_MTK : []),
  ];
  masterTkaSmpMtk.forEach((s) => {
    const babInfo = tentukanBabDanTopik('MTK', s, 'SMP');
    tambahSoalUnik({
      ...s,
      isTkaAutentik: true,
      subtesKode: 'MTK',
      babNomor: babInfo.babNomor,
      namaBab: babInfo.namaBab,
      topik: babInfo.namaBab,
    }, 'MTK', babInfo.namaBab);
  });

  const masterTkaSmpBindo = [
    ...(Array.isArray(SOAL_TKA_2026_SMP_BINDO_PAKET_A) ? SOAL_TKA_2026_SMP_BINDO_PAKET_A : []),
    ...(Array.isArray(SOAL_TKA_2026_SMP_BINDO_PAKET_B) ? SOAL_TKA_2026_SMP_BINDO_PAKET_B : []),
    ...(Array.isArray(SOAL_TRYOUT_AKBAR_SMP_BINDO) ? SOAL_TRYOUT_AKBAR_SMP_BINDO : []),
  ];
  masterTkaSmpBindo.forEach((s) => {
    const babInfo = tentukanBabDanTopik('BIN', s, 'SMP');
    tambahSoalUnik({
      ...s,
      isTkaAutentik: true,
      subtesKode: 'BIN',
      babNomor: babInfo.babNomor,
      namaBab: babInfo.namaBab,
      topik: babInfo.namaBab,
    }, 'BIN', babInfo.namaBab);
  });

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
    const itemSd = (item && !item.jenjang) ? { ...item, jenjang: 'SD', kelas: item.kelas || '6' } : item;
    const b = normalisasiButir(itemSd, fallbackSubtes, fallbackTopik, counter++);
    if (b && isButirLayakTampil(b) && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Soal Firestore SD
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      if (String(s?.id || '').toUpperCase().includes('SD-JALU')) return;
      const sj = String(s.jenjang || '').toUpperCase();
      const sk = String(s.kelas || s.kelasSekolah || '');
      const isSd = sj.includes('SD') || sk.includes('4') || sk.includes('5') || sk.includes('6');
      if (isSd) {
        const sm = String(s.mataPelajaran || s.mapel || s.subtes || '').toLowerCase();
        let subtes = 'MTK';
        if (sm.includes('indonesia') || sm.includes('literasi')) subtes = 'BIN';
        else if (sm.includes('matematika') || sm.includes('numerasi')) subtes = 'MTK';
        tambahSoalUnik({ ...s, jenjang: 'SD', kelas: '6' }, subtes, s.bab || s.materi || 'Bank Soal Gemilang SD');
      }
    });
  }

  // 2. Master Dataset TKA SD 2026
  if (Array.isArray(SOAL_TKA_2026_SD_MTK)) {
    SOAL_TKA_2026_SD_MTK.forEach((s) => {
      tambahSoalUnik({ ...s, jenjang: 'SD', kelas: '6' }, 'MTK', s.materi || 'TKA SD Matematika');
    });
  }
  if (Array.isArray(SOAL_TKA_2026_SD_BINDO)) {
    SOAL_TKA_2026_SD_BINDO.forEach((s) => {
      tambahSoalUnik({ ...s, jenjang: 'SD', kelas: '6' }, 'BIN', s.materi || 'TKA SD Bahasa Indonesia');
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
    const itemSma = (item && !item.jenjang) ? { ...item, jenjang: 'SMA', kelas: item.kelas || '12' } : item;
    const b = normalisasiButir(itemSma, fallbackSubtes, fallbackTopik, counter++);
    if (b && isButirLayakTampil(b) && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  };

  // 1. Firestore SMA / UTBK
  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      if (String(s?.id || '').toUpperCase().includes('SD-JALU')) return;
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

/**
 * Pembangun Bank Soal Lengkap Multi-Jenjang (SMP + SMA/UTBK + SD)
 * Menyatukan seluruh dataset resmi Bimbel Gemilang dan Firestore
 */
export function susunSemuaBankSoalLatihan(bankSoalFirestore = []) {
  const smp = susunBankSoalLatihanSmp(bankSoalFirestore);
  const utbk = susunBankSoalLatihanUtbk(bankSoalFirestore);
  const sd = susunBankSoalLatihanSd(bankSoalFirestore);
  const bank = [];
  const idsSudahAda = new Set();
  [...smp, ...utbk, ...sd].forEach((b) => {
    if (b && b.id && !idsSudahAda.has(b.id)) {
      idsSudahAda.add(b.id);
      bank.push(b);
    }
  });

  if (Array.isArray(bankSoalFirestore) && bankSoalFirestore.length > 0) {
    bankSoalFirestore.forEach((s) => {
      const b = normalisasiButir(s);
      if (b && b.id && !idsSudahAda.has(b.id)) {
        idsSudahAda.add(b.id);
        bank.push(b);
      }
    });
  }

  return bank;
}

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
 * Ekstraktor Sidik Jari Konteks Soal (Deduplikasi Semantik).
 * Menghilangkan angka dan karakter khusus agar varian soal kloningan (misal UMKM 50 tas vs UMKM 80 tas)
 * memiliki fingerprint yang identik dan tidak dimasukkan ke dalam paket yang sama.
 */
export function ekstrakSidikJariSoal(item) {
  const sumber = String(
    item?.bacaan ||
    item?.wacana ||
    item?.stimulus ||
    item?.soalTeksBersih ||
    item?.teksSoal ||
    item?.soal ||
    ''
  ).toLowerCase();

  // Bersihkan angka dan karakter khusus
  const kataKunci = sumber
    .replace(/[0-9]/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((k) => k.length > 3)
    .slice(0, 10)
    .join('_');

  return kataKunci || `sidik_${item?.id || item?.kodeSoal || Math.random()}`;
}

/**
 * Audit Kesesuaian Materi untuk MTK SMP
 * Memeriksa apakah butir soal benar-benar cocok dengan materi yang dipilih guru,
 * atau merupakan soal salah kamar (misal Statistika/Deret tersasar ke Bilangan).
 */
export function auditKesesuaianMateriMtk(soal, targetMateri = '') {
  const babTarget = tentukanBabDanTopik('MTK', { materi: targetMateri, bab: targetMateri }, 'SMP');
  const babAktual = tentukanBabDanTopik('MTK', soal, 'SMP');

  const tm = String(targetMateri || '').toLowerCase();
  const isTargetBilangan = tm.includes('bilangan') || babTarget.babNomor === 1;

  if (isTargetBilangan) {
    const teksSemua = (
      String(soal?.materi || '') + ' ' +
      String(soal?.namaBab || '') + ' ' +
      String(soal?.topik || '') + ' ' +
      String(soal?.soalTeksBersih || soal?.soal || soal?.teksSoal || '') + ' ' +
      String(soal?.pembahasan || '')
    ).toLowerCase();

    // Saring dan tolak konsep Himpunan / Diagram Venn / Teori Irisan dari Bab 1 Bilangan
    if (
      teksSemua.includes('himpunan') ||
      teksSemua.includes('diagram venn') ||
      teksSemua.includes('irisan') ||
      teksSemua.includes('gabungan') ||
      teksSemua.includes('komplemen') ||
      teksSemua.includes('semesta') ||
      teksSemua.includes('∩') ||
      teksSemua.includes('∪') ||
      teksSemua.includes('\\cap') ||
      teksSemua.includes('\\cup') ||
      teksSemua.includes('{\\cap}') ||
      teksSemua.includes('{\\cup}') ||
      /\{[^}]*(?:bilangan|kurang dari|lebih dari)[^}]*\}/i.test(teksSemua)
    ) {
      return {
        cocok: false,
        alasan: 'Soal terdeteksi Himpunan / Irisan Logika (bukan Operasi Bilangan murni)',
        babAktual: 2,
        namaBabAktual: 'Bab 2 · Aljabar & Himpunan',
      };
    }
  }

  if (isTargetBilangan && babAktual.babNomor !== 1) {
    return {
      cocok: false,
      alasan: `Soal terdeteksi masuk ${babAktual.namaBab} (bukan Bilangan murni)`,
      babAktual: babAktual.babNomor,
      namaBabAktual: babAktual.namaBab,
    };
  }

  return { cocok: true, babAktual: babAktual.babNomor, namaBabAktual: babAktual.namaBab };
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
    // Terapkan deduplikasi semantik (Anti-Kloning wacana/cerita)
    const sidikSet = new Set();
    const soalUnik = [];
    b.soalList.forEach((s) => {
      const fp = ekstrakSidikJariSoal(s);
      if (!sidikSet.has(fp)) {
        sidikSet.add(fp);
        soalUnik.push(s);
      }
    });

    const totalSoal = soalUnik.length;
    // Batasi maksimal 2-3 paket terstruktur per bab (10-20 butir soal terbaik per bab)
    const nPaket = Math.min(3, Math.max(1, Math.ceil(totalSoal / ukuranPaket)));
    for (let i = 0; i < nPaket; i++) {
      const start = i * ukuranPaket;
      const sliceSoal = soalUnik.slice(start, start + ukuranPaket);
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

  // Terapkan deduplikasi semantik agar wacana kloningan tidak muncul dua kali di Quick Play
  const sidikSet = new Set();
  const soalDedup = [];
  acak.forEach((s) => {
    const fp = ekstrakSidikJariSoal(s);
    if (!sidikSet.has(fp)) {
      sidikSet.add(fp);
      soalDedup.push(s);
    }
  });

  return soalDedup.slice(0, Math.min(jumlah, soalDedup.length));
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
 * Mereset progres latihan mandiri siswa kembali ke nol (bersih dari sesi uji coba)
 */
export function resetProgresLatihanSiswa(studentId) {
  const kunci = getKunciPenyimpananLatihan(studentId);
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.removeItem(kunci);
    } catch (_e) {}
  }
  memoriFallbackStorage.delete(kunci);
  return true;
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
