// src/utils/kunciSubtesPtn.js
// ============================================================
// Uraikan kolom `subtesKunci` / `Subtes_Kunci` dari berkas Excel PTN menjadi
// daftar 7 subtes UTBK yang baku + penanda kebutuhan portofolio.
//
// 🔥 KENAPA PERLU DIURAIKAN (audit 2026-10-10)
// Kolom itu teks bebas. Dari 266 prodi hanya ada 16 variasi, dan variasinya
// tidak konsisten untuk hal yang sama:
//
//   108x  "Penalaran Umum & Pengetahuan Kuantitatif"
//    30x  "Penalaran Matematika & Kuantitatif"
//    22x  "Pengetahuan Kuantitatif & Penalaran Matematika"
//    18x  "Penalaran Matematika & Pengetahuan Kuantitatif"
//    11x  "Penalaran Umum & Kuantitatif"
//     1x  "Penalaran Kuantitatif & Umum"      <-- bahkan dibalik
//
// Ditambah entri yang BUKAN subtes sama sekali: "Portofolio Seni &
// Penalaran Umum" (4x), "Portofolio Desain & Penalaran Umum" (2x),
// "Portofolio Olahraga & Penalaran Umum" (2x).
//
// Kalau halaman perbandingan menampilkan teks ini apa adanya, siswa melihat
// "Penalaran Matematika & Kuantitatif" di satu kartu dan "Pengetahuan
// Kuantitatif & Penalaran Matematika" di kartu lain lalu menyimpulkan itu dua
// hal berbeda. Diurai dulu, baru ditampilkan seragam.
//
// ⚠️ JEBAKAN URUTAN: "Penalaran Kuantitatif" (1 baris di sumber) mengandung
// kata "penalaran" dan "kuantitatif" sekaligus. Kalau "penalaran umum" atau
// "kuantitatif" dicocokkan lebih dulu, baris itu akan terurai salah. Maka
// POLA_PENCOCOK di bawah diurutkan dari frasa paling spesifik ke paling umum,
// dan setiap kecocokan DIHAPUS dari sisa teks sebelum pencocokan berikutnya.
//
// Yang TIDAK dilakukan berkas ini: mengarang subtes yang tidak disebut. Sisa
// teks yang tidak dikenali dilaporkan lewat `takDikenali`, bukan ditebak.
// ============================================================

import { KATALOG_MAPEL, MAPEL_UTBK } from './mesinTaksonomiSoal.js';

/** 7 subtes UTBK-SNBT. `id` dipakai sebagai kunci stabil di seluruh fitur. */
export const SUBTES_UTBK = [
  { id: 'PU', nama: 'Penalaran Umum', kelompok: 'TPS' },
  { id: 'PPU', nama: 'Pengetahuan & Pemahaman Umum', kelompok: 'TPS' },
  { id: 'PBM', nama: 'Pemahaman Bacaan & Menulis', kelompok: 'TPS' },
  { id: 'PK', nama: 'Pengetahuan Kuantitatif', kelompok: 'TPS' },
  { id: 'LBI', nama: 'Literasi Bahasa Indonesia', kelompok: 'Literasi' },
  { id: 'LBE', nama: 'Literasi Bahasa Inggris', kelompok: 'Literasi' },
  { id: 'PM', nama: 'Penalaran Matematika', kelompok: 'Literasi' },
];

const NAMA_SUBTES = Object.fromEntries(SUBTES_UTBK.map((s) => [s.id, s.nama]));

/**
 * Urutan PENTING: paling spesifik dulu. Lihat "JEBAKAN URUTAN" di atas.
 */
const POLA_PENCOCOK = [
  { id: 'PM', re: /penalaran\s+matematika|penalaran\s+mat\b/ },
  { id: 'PPU', re: /pengetahuan\s*(?:&|dan)?\s*pemahaman\s+umum|pemahaman\s+umum\b/ },
  { id: 'PBM', re: /pemahaman\s+bacaan(?:\s*(?:&|dan)?\s*menulis)?|bacaan\s*(?:&|dan)?\s*menulis/ },
  { id: 'LBI', re: /literasi\s+b(?:ahasa)?\.?\s*indonesia|literasi\s+indonesia/ },
  { id: 'LBE', re: /literasi\s+b(?:ahasa)?\.?\s*inggris|literasi\s+inggris/ },
  { id: 'PU', re: /penalaran\s+umum\b/ },
  // "Penalaran Kuantitatif" di sumber hampir pasti maksudnya PK; frasa
  // "penalaran"-nya sudah lebih dulu diserap oleh pola PM/PU di atas bila
  // memang begitu maksudnya, jadi sisa "kuantitatif" di sini aman.
  { id: 'PK', re: /pengetahuan\s+kuantitatif|kuantitatif\b/ },
];

/**
 * Penulisan di sumber yang bentuknya terbalik sehingga tidak bisa dicocokkan
 * apa adanya, dan maksudnya TIDAK AMBIGU di antara 7 subtes yang ada.
 *
 * Baru satu entri, dan sengaja dibiarkan sedikit: menambah entri di sini
 * berarti memutuskan makna data atas nama penyusun berkas. Kalau ragu,
 * JANGAN ditambah — biarkan tersisa di `takDikenali` supaya manusia melihatnya.
 *
 * Kasus yang ada: "Penalaran Kuantitatif & Umum" (1 dari 266 baris).
 * "Penalaran Kuantitatif" bukan nama subtes. Yang ada "Penalaran Umum" (PU)
 * dan "Pengetahuan Kuantitatif" (PK), dan sisa "& Umum" hanya masuk akal
 * sebagai PU yang kata depannya tertinggal. Ditulis ulang jadi bentuk baku,
 * bukan ditebak diam-diam di dalam pencocok.
 */
const BENTUK_DIPERBAIKI = [
  { dari: /penalaran\s+kuantitatif\s*(?:&|dan)\s*umum\b/, jadi: 'penalaran umum & pengetahuan kuantitatif' },
];

const POLA_PORTOFOLIO = [
  { jenis: 'seni', re: /portofolio\s+seni|seni\s+rupa|televisi\s*(?:&|dan)?\s*film|fsrd/ },
  { jenis: 'desain', re: /portofolio\s+desain|desain\b/ },
  { jenis: 'olahraga', re: /portofolio\s+olahraga|olahraga\b/ },
];

/**
 * Pemetaan subtes UTBK -> mapel Bank Soal Gemilang.
 *
 * 🔥 BERUBAH 2026-10-10 (permintaan owner: "tambahkan mapel utbk untuk aku
 * scan soal utbk html"). Sejak tujuh subtes UTBK punya mapel sendiri di bank
 * soal (MAPEL_UTBK di mesinTaksonomiSoal), pemetaan ini tidak lagi menulis
 * tangan kode: bagian UTBK-nya DIAMBIL dari field `subtes` di MAPEL_UTBK,
 * supaya kode bank soal dan id subtes tidak bisa berbeda sendiri.
 *
 * Bagian KURIKULUM tetap ada sebagai padanan kedua, dan tetap dengan
 * peringatan lamanya: bank soal kurikulum memakai taksonomi mapel per bab,
 * sedangkan UTBK menguji literasi & penalaran lintas materi. PK dan PM
 * dua-duanya masih jatuh ke `mtk` di sisi kurikulum. Jadi urutan hasilnya
 * selalu: [mapel UTBK yang sepadan] lalu [padanan kurikulum], dan UI boleh
 * memakai yang pertama untuk "latih soal UTBK-nya" dan yang kedua untuk
 * "perkuat materi dasarnya".
 *
 * ⚠️ Tetap berlaku: pemetaan ini sah untuk ARAH BELAJAR, tidak sah untuk
 * mengubah skor try out internal menjadi perkiraan skor subtes UTBK
 * (blueprint §3C).
 */
const PADANAN_KURIKULUM = {
  PM: ['mtk', 'mtk_tl'],
  PK: ['mtk'],
  PU: [],                       // tidak ada padanan kurikulum untuk penalaran umum
  PPU: ['bind'],
  PBM: ['bind'],
  LBI: ['bind'],
  LBE: ['bing'],
};

/** Kode mapel UTBK untuk satu subtes; [] bila memang tidak ada. */
export function kodeUtbkUntuk(idSubtes) {
  return MAPEL_UTBK.filter((m) => m.subtes === idSubtes).map((m) => m.kode);
}

/** Bentuk lama yang dipertahankan untuk kompatibilitas: subtes -> daftar kode. */
export const PEMETAAN_SUBTES_KE_MAPEL = Object.fromEntries(
  SUBTES_UTBK.map((s) => [s.id, [...kodeUtbkUntuk(s.id), ...(PADANAN_KURIKULUM[s.id] || [])]]),
);

/**
 * Uraikan teks subtesKunci.
 *
 * @param {string} teks mis. "Penalaran Matematika & Kuantitatif"
 * @returns {{subtes: string[], portofolio: string[], takDikenali: string[]}}
 *   `subtes` berisi ID dalam urutan baku SUBTES_UTBK (bukan urutan teks),
 *   supaya dua penulisan berbeda menghasilkan tampilan yang sama.
 */
export function uraikanKunciSubtes(teks) {
  let sisa = String(teks ?? '').toLowerCase();
  for (const b of BENTUK_DIPERBAIKI) sisa = sisa.replace(b.dari, b.jadi);
  const ketemu = new Set();
  const portofolio = new Set();

  for (const p of POLA_PORTOFOLIO) {
    if (p.re.test(sisa)) {
      portofolio.add(p.jenis);
      sisa = sisa.replace(p.re, ' ');
    }
  }
  for (const p of POLA_PENCOCOK) {
    if (p.re.test(sisa)) {
      ketemu.add(p.id);
      sisa = sisa.replace(p.re, ' ');
    }
  }

  // Bersihkan penghubung & kata sisa yang tidak membawa informasi, lalu
  // periksa apakah masih ada kata berarti yang tidak dikenali. Kalau ada,
  // laporkan -- jangan disembunyikan seolah-olah uraiannya lengkap.
  const sisaBersih = sisa
    .replace(/[\s&/·,+()]+/g, ' ')
    // Kata yang memang sudah terserap pola di atas ikut dibuang, supaya
    // `takDikenali` hanya berisi hal yang BENAR-BENAR asing. Tanpa ini,
    // "Portofolio Seni" melaporkan 'seni' sebagai tak dikenal padahal
    // portofolionya sudah ditangkap -- laporan jadi berisik dan menutupi
    // variasi baru yang sungguhan perlu dilihat manusia.
    .replace(/\b(dan|serta|dengan|untuk|wajib|bacaan|menulis|umum|portofolio|seni|desain|olahraga|rupa)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const takDikenali = sisaBersih ? sisaBersih.split(' ').filter((k) => k.length > 2) : [];

  const urutan = SUBTES_UTBK.map((s) => s.id);
  return {
    subtes: urutan.filter((id) => ketemu.has(id)),
    portofolio: [...portofolio],
    takDikenali,
  };
}

/** Nama lengkap untuk tampilan, mis. 'PK — Pengetahuan Kuantitatif'. */
export function labelSubtes(id) {
  return NAMA_SUBTES[id] ? `${id} — ${NAMA_SUBTES[id]}` : String(id ?? '');
}

/**
 * Mapel Bank Soal Gemilang yang relevan untuk sebuah subtes.
 * Entri UTBK ditandai jenis:'utbk', padanan kurikulum jenis:'kurikulum' --
 * supaya UI bisa membedakan "latih soal UTBK-nya" dari "perkuat dasarnya".
 */
export function mapelGemilangUntuk(idSubtes) {
  const utbk = MAPEL_UTBK
    .filter((m) => m.subtes === idSubtes)
    .map((m) => ({ kode: m.kode, nama: m.nama, jenis: 'utbk' }));
  const kurikulum = (PADANAN_KURIKULUM[idSubtes] || [])
    .map((k) => KATALOG_MAPEL.find((m) => m.kode === k))
    .filter(Boolean)
    .map((m) => ({ kode: m.kode, nama: m.nama, jenis: 'kurikulum' }));
  return [...utbk, ...kurikulum];
}

export default {
  SUBTES_UTBK, PEMETAAN_SUBTES_KE_MAPEL, PADANAN_KURIKULUM,
  uraikanKunciSubtes, labelSubtes, mapelGemilangUntuk, kodeUtbkUntuk,
};
