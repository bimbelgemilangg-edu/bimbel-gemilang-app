// src/utils/kisiKisiTkaUtbk.js
// ============================================================
// KISI-KISI / CP yang disodorkan ke AI pemilih soal.
// Riset 2026-10-13: Pusmendik Kemendikdasmen (kerangka asesmen TKA,
// https://pusmendik.kemendikdasmen.go.id/tka/ , file-175 & file-178)
// + struktur SNBT yang terkunci di mesinTaksonomiSoal.MAPEL_UTBK.
//
// PENTING & JUJUR: daftar MAPEL per jenjang di bawah adalah fakta resmi
// (SD/SMP hanya Matematika & Bahasa Indonesia; SMA 3 wajib + 7 pilihan;
// UTBK 7 subtes). RANAH per mapel adalah HEURISTIK PEMETAAN BUTIR
// (domain kurikulum umum), BUKAN kutipan verbatim CP -- bila owner
// menempelkan kutipan resmi dari PDF kerangka asesmen, ganti isi RANAH
// di sini dan versi kisi-kisi naik otomatis.
// ============================================================

// Revisi .2 (2026-10-13, keputusan owner "rombak"): kepala TKA TIDAK lagi
// menyebut rentang kelas ("materi kelas 7-9"). AI cukup diberitahu: kolamnya
// BANK SOAL JENJANG SELURUHNYA, pilih sesuai CP TKA & mapelnya. Penyebutan
// rentang kelas terbukti bikin admin & AI sama-sama menebak-nebak kelas.
export const VERSI_KISI = '2026-10-13.2';
export const SUMBER_KISI = [
  'https://pusmendik.kemendikdasmen.go.id/tka/',
  'https://pusmendik.kemendikdasmen.go.id/pdf/file-175',
  'https://pusmendik.kemendikdasmen.go.id/pdf/file-178',
];

export const MAPEL_TKA_RESMI = {
  SD: ['Matematika', 'Bahasa Indonesia'],
  SMP: ['Matematika', 'Bahasa Indonesia'],
  SMA: {
    wajib: ['Matematika', 'Bahasa Indonesia', 'Bahasa Inggris'],
    pilihan: ['Fisika', 'Kimia', 'Biologi', 'Ekonomi', 'Sosiologi', 'Geografi', 'Sejarah'],
  },
};

export const SUBTES_UTBK = [
  'TPS/Penalaran Umum', 'TPS/Pengetahuan & Pemahaman Umum', 'TPS/Pemahaman Bacaan & Menulis',
  'TPS/Pengetahuan Kuantitatif', 'Literasi/Bahasa Indonesia', 'Literasi/Bahasa Inggris',
  'Literasi/Penalaran Matematika',
];

const RANAH = {
  Matematika: 'bilangan & operasi; aljabar (persamaan, fungsi); geometri & pengukuran; data, peluang, dan penalaran proporsional',
  'Bahasa Indonesia': 'informasi tersurat & tersirat; ide pokok & struktur teks; kosakata konteks; kalimat efektif; evaluasi & refleksi isi teks',
  'Bahasa Inggris': 'reading comprehension (main idea, detail, inference); vocabulary in context; grammar in use; teks fungsional & naratif',
  Fisika: 'mekanika; listrik-magnet; gelombang-optik; termodinamika; pembacaan grafik & tabel percobaan',
  Kimia: 'struktur atom & periodik; stoikiometri; ikatan; asam-basa; laju-kesetimbangan; kimia organik dasar',
  Biologi: 'sel & jaringan; genetika; ekosistem; fisiologi manusia/tumbuhan; pembacaan diagram percobaan',
  Ekonomi: 'kelangkaan & biaya peluang; permintaan-penawaran; pendapatan nasional; pembangunan-pertumbuhan; pelaku ekonomi',
  Sosiologi: 'interaksi & lembaga sosial; stratifikasi; perubahan sosial; penelitian sosial dasar',
  Geografi: 'peta & SIG; litosfer-atmosfer-hidrosfer; kependudukan; pembangunan wilayah',
  Sejarah: 'kronologi & sumber; kerajaan Nusantara; kolonialisme; pergerakan nasional; Indonesia kontemporer',
  'TPS/Penalaran Umum': 'silogisme & modus ponens/tollens; pasti benar/salah; mungkin benar/salah; kecukupan informasi; analogi & pola',
  'TPS/Pengetahuan Kuantitatif': 'aritmetika cepat; perbandingan & proporsi; pola barisan; geometri dasar; statistika deskriptif',
  'TPS/Pemahaman Bacaan & Menulis': 'gagasan utama; kohesi-kalimat efektif; perbaikan diksi; kesimpulan paragraf',
  'TPS/Pengetahuan & Pemahaman Umum': 'kosakata kontekstual; idiom; pemahaman teks umum',
  'Literasi/Bahasa Indonesia': 'lokasi & evaluasi informasi; integrasi antar-teks; refleksi isi',
  'Literasi/Bahasa Inggris': 'locate-integrate-reflect pada teks Inggris; tone & purpose',
  'Literasi/Penalaran Matematika': 'model matematika dari konteks; interpretasi grafik/tabel; penalaran proporsional & optimasi sederhana',
};

/**
 * Teks kisi-kisi untuk prompt AI pemilih soal.
 * @param {string} jenjang mis. 'SMP/MTs'
 * @param {string} jenisUjian 'TKA' | 'SNBT/UTBK' | 'Reguler'
 * @param {string} mapel
 */
export function kisiKisiUntuk(jenjang = '', jenisUjian = '', mapel = '') {
  const j = String(jenjang).toUpperCase();
  const kepala = jenisUjian === 'SNBT/UTBK' || j.includes('UTBK')
    ? 'UTBK/SNBT (literasi & penalaran, lintas materi SMA)'
    : `TKA jenjang ${jenjang || '(tidak disebut)'} — KAMU MEMILIH DARI BANK SOAL ${jenjang || 'JENJANG'} SELURUHNYA (tanpa menyaring per kelas); pilih butir yang sesuai CP TKA resmi untuk mapel ini`;
  const ranah = RANAH[mapel] || 'pemahaman konsep dasar, penerapan, dan penalaran sesuai tingkat jenjang';
  return `KISI-KISI ${kepala}, mapel ${mapel || '(umum)'} (versi ${VERSI_KISI}). Ranah yang diukur: ${ranah}. Pilih butir yang PALING mewakili ranah itu dengan kesulitan beragam (mudah-sedang-sulit), utamakan butir ber-kode sumber resmi (SNMPTN/SBMPTN/UTBK/TKA) bila tersedia.`;
}

export default { VERSI_KISI, SUMBER_KISI, MAPEL_TKA_RESMI, SUBTES_UTBK, kisiKisiUntuk };
