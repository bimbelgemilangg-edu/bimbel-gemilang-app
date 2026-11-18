// src/data/ambisModulUtbkData.js
// ==============================================================================
// MODUL BELAJAR UTBK-SNBT 2027 BIMBEL GEMILANG
// Mengadopsi kurikulum lengkap standar AmbisPTN (7 Subtes, 46 Bab)
// 100% UNLOCKED & GRATIS untuk seluruh siswa Bimbel Gemilang
// ==============================================================================

import { PU_MODUL } from './modul/puModul.js';
import { PPU_MODUL } from './modul/ppuModul.js';
import { PBM_MODUL } from './modul/pbmModul.js';
import { PK_MODUL } from './modul/pkModul.js';
import { LBIN_MODUL } from './modul/lbinModul.js';
import { LBING_MODUL } from './modul/lbingModul.js';
import { PM_MODUL } from './modul/pmModul.js';

export const DAFTAR_SUBTES_MODUL = [
  {
    kode: 'PU',
    nama: 'Penalaran Umum',
    singkatan: 'PU',
    badgeWarna: '#0d9488',
    bgLight: '#f0fdfa',
    borderWarna: '#99f6e4',
    emoji: '🧠',
    deskripsi: 'Logika deduktif, induktif, silogisme, pola barisan angka/huruf, dan penalaran analitik urutan.',
    totalBab: PU_MODUL.length,
    babList: PU_MODUL,
  },
  {
    kode: 'PPU',
    nama: 'Pengetahuan & Pemahaman Umum',
    singkatan: 'PPU',
    badgeWarna: '#2563eb',
    bgLight: '#eff6ff',
    borderWarna: '#bfdbfe',
    emoji: '📖',
    deskripsi: 'Makna kata kontekstual, kaidah afiksasi KTSP, hubungan semantik, dan nada penulis.',
    totalBab: PPU_MODUL.length,
    babList: PPU_MODUL,
  },
  {
    kode: 'PBM',
    nama: 'Pemahaman Bacaan & Menulis',
    singkatan: 'PBM',
    badgeWarna: '#7c3aed',
    bgLight: '#f5f3ff',
    borderWarna: '#ddd6fe',
    emoji: '✍️',
    deskripsi: 'Pedoman EYD V, kalimat efektif, fungsi sintaksis SPOK-Pel, serta kohesi-koherensi naskah.',
    totalBab: PBM_MODUL.length,
    babList: PBM_MODUL,
  },
  {
    kode: 'PK',
    nama: 'Pengetahuan Kuantitatif',
    singkatan: 'PK',
    badgeWarna: '#ea580c',
    bgLight: '#fff7ed',
    borderWarna: '#fed7aa',
    emoji: '🔢',
    deskripsi: 'Aljabar, fungsi, geometri bidang/ruang, statistika, kaidah pencacahan, dan trik soal P vs Q.',
    totalBab: PK_MODUL.length,
    babList: PK_MODUL,
  },
  {
    kode: 'LBIN',
    nama: 'Literasi Bahasa Indonesia',
    singkatan: 'LBIN',
    badgeWarna: '#059669',
    bgLight: '#ecfdf5',
    borderWarna: '#a7f3d0',
    emoji: '🇮🇩',
    deskripsi: 'Analisis argumen teks kompleks, inferensi tersirat, membaca infografik, dan sintesis dua teks.',
    totalBab: LBIN_MODUL.length,
    babList: LBIN_MODUL,
  },
  {
    kode: 'LBING',
    nama: 'Literasi Bahasa Inggris',
    singkatan: 'LBING',
    badgeWarna: '#4f46e5',
    bgLight: '#eef2ff',
    borderWarna: '#c7d2fe',
    emoji: '🇬🇧',
    deskripsi: 'Main idea, vocabulary in context, cohesive devices, tone analysis, and comparative synthesis.',
    totalBab: LBING_MODUL.length,
    babList: LBING_MODUL,
  },
  {
    kode: 'PM',
    nama: 'Penalaran Matematika',
    singkatan: 'PM',
    badgeWarna: '#d97706',
    bgLight: '#fffbeb',
    borderWarna: '#fde68a',
    emoji: '📐',
    deskripsi: 'Aritmetika sosial terapan, laju kerja, debit, grafik pasar, optimasi geometri, dan risiko.',
    totalBab: PM_MODUL.length,
    babList: PM_MODUL,
  },
];

// Flat array seluruh 46 bab
export const SEMUA_BAB_MODUL = DAFTAR_SUBTES_MODUL.flatMap((sub) =>
  sub.babList.map((bab) => ({
    ...bab,
    subtestNama: sub.nama,
    subtestSingkatan: sub.singkatan,
    subtestWarna: sub.badgeWarna,
    subtestBgLight: sub.bgLight,
    subtestEmoji: sub.emoji,
  }))
);

// Helper mencari subtes berdasarkan kode (case-insensitive)
export function getSubtestByKode(kode) {
  if (!kode) return null;
  const k = String(kode).toUpperCase().trim();
  return DAFTAR_SUBTES_MODUL.find((s) => s.kode === k) || null;
}

// Helper mencari bab berdasarkan subtes dan slug
export function getBabBySlug(subtestKode, babSlug) {
  if (!subtestKode || !babSlug) return null;
  const k = String(subtestKode).toUpperCase().trim();
  const sub = getSubtestByKode(k);
  if (!sub) return null;
  return sub.babList.find((b) => b.slug === babSlug || b.id === babSlug) || null;
}

// Helper mencari bab berdasarkan ID unik
export function getBabById(babId) {
  if (!babId) return null;
  return SEMUA_BAB_MODUL.find((b) => b.id === babId) || null;
}

// Helper mencari bab sebelumnya dan bab selanjutnya dalam subtes yang sama
export function getBabTetangga(subtestKode, babSlug) {
  const sub = getSubtestByKode(subtestKode);
  if (!sub || !sub.babList.length) return { prevBab: null, nextBab: null };
  const idx = sub.babList.findIndex((b) => b.slug === babSlug || b.id === babSlug);
  if (idx === -1) return { prevBab: null, nextBab: null };
  return {
    prevBab: idx > 0 ? sub.babList[idx - 1] : null,
    nextBab: idx < sub.babList.length - 1 ? sub.babList[idx + 1] : null,
  };
}

// ==============================================================================
// LOCAL STORAGE PROGRESS TRACKING PER SISWA
// ==============================================================================

function getEffectiveStudentId(siswaId) {
  if (siswaId && String(siswaId).trim()) return String(siswaId).trim();
  try {
    return (
      localStorage.getItem('studentId') ||
      localStorage.getItem('studentNim') ||
      localStorage.getItem('studentDocId') ||
      'siswa_gemilang_default'
    );
  } catch {
    return 'siswa_gemilang_default';
  }
}

export function getDaftarBabSelesai(siswaId) {
  const sid = getEffectiveStudentId(siswaId);
  try {
    const raw = localStorage.getItem(`gemilang:modul_selesai:${sid}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function tandaiBabSelesai(siswaId, babId) {
  if (!babId) return [];
  const sid = getEffectiveStudentId(siswaId);
  try {
    const current = getDaftarBabSelesai(sid);
    if (!current.includes(babId)) {
      const updated = [...current, babId];
      localStorage.setItem(`gemilang:modul_selesai:${sid}`, JSON.stringify(updated));
      return updated;
    }
    return current;
  } catch {
    return [];
  }
}

export function simpanSkorKuisBab(siswaId, babId, skorBenar, totalSoal = 5) {
  if (!babId) return null;
  const sid = getEffectiveStudentId(siswaId);
  try {
    const data = {
      skorBenar: Number(skorBenar) || 0,
      totalSoal: Number(totalSoal) || 5,
      persen: Math.round(((Number(skorBenar) || 0) / (Number(totalSoal) || 5)) * 100),
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`gemilang:modul_kuis:${sid}:${babId}`, JSON.stringify(data));
    // Jika benar minimal 3 soal (≥60%), otomatis tandai bab selesai
    if (data.skorBenar >= 3) {
      tandaiBabSelesai(sid, babId);
    }
    return data;
  } catch {
    return null;
  }
}

export function getSkorKuisBab(siswaId, babId) {
  if (!babId) return null;
  const sid = getEffectiveStudentId(siswaId);
  try {
    const raw = localStorage.getItem(`gemilang:modul_kuis:${sid}:${babId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function simpanTerakhirDibaca(siswaId, info) {
  const sid = getEffectiveStudentId(siswaId);
  try {
    const payload = {
      ...info,
      waktu: new Date().toISOString(),
    };
    localStorage.setItem(`gemilang:modul_terakhir:${sid}`, JSON.stringify(payload));
  } catch {
    // no-op
  }
}

export function getTerakhirDibaca(siswaId) {
  const sid = getEffectiveStudentId(siswaId);
  try {
    const raw = localStorage.getItem(`gemilang:modul_terakhir:${sid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function hitungStatistikModulSiswa(siswaId) {
  const sid = getEffectiveStudentId(siswaId);
  const babSelesai = getDaftarBabSelesai(sid);
  const totalBab = SEMUA_BAB_MODUL.length;
  const totalSelesai = babSelesai.length;
  const persenTotal = totalBab > 0 ? Math.round((totalSelesai / totalBab) * 100) : 0;

  const perSubtes = {};
  DAFTAR_SUBTES_MODUL.forEach((sub) => {
    const selesaiSub = sub.babList.filter((b) => babSelesai.includes(b.id)).length;
    perSubtes[sub.kode] = {
      nama: sub.nama,
      kode: sub.kode,
      warna: sub.badgeWarna,
      total: sub.totalBab,
      selesai: selesaiSub,
      persen: Math.round((selesaiSub / sub.totalBab) * 100),
    };
  });

  return {
    totalBab,
    totalSelesai,
    persenTotal,
    perSubtes,
    babSelesaiIds: babSelesai,
  };
}
