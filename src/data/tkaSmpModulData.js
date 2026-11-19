// src/data/tkaSmpModulData.js
// ==============================================================================
// BANK MODUL & KUIS BELAJAR TKA SMP KELAS 9 - KURIKULUM RESMI 2027
// 4 MAPEL MASTER (52 HALAMAN PER BUKU):
// 1. Matematika (MTK_SMP) - Numerasi Wajib (4 Bab, 39 Unit)
// 2. Bahasa Indonesia (BIN_SMP) - Literasi Wajib (4 Bab, 39 Unit)
// 3. Ilmu Pengetahuan Alam (IPA_SMP) - CP Fase D (4 Bab, 39 Unit)
// 4. Bahasa Inggris (BIG_SMP) - CP Fase D (4 Bab, 39 Unit)
// TOTAL: 16 BAB & 156 UNIT DILENGKAPI KUIS INTERAKTIF, CHEAT SHEET & PDF MASTER
// ==============================================================================

import { MTK_SMP_MODUL } from './modul-smp/matematikaSmpData.js';
import { BIN_SMP_MODUL } from './modul-smp/bahasaIndonesiaSmpData.js';
import { IPA_SMP_MODUL } from './modul-smp/ipaSmpData.js';
import { BIG_SMP_MODUL } from './modul-smp/bahasaInggrisSmpData.js';

export { MTK_SMP_MODUL, BIN_SMP_MODUL, IPA_SMP_MODUL, BIG_SMP_MODUL };

export const DAFTAR_SUBTES_SMP = [
  {
    kode: 'MTK_SMP',
    nama: 'Matematika (Numerasi TKA)',
    singkatan: 'MTK',
    badgeWarna: '#ea580c',
    bgLight: '#fff7ed',
    borderWarna: '#fed7aa',
    emoji: '📐',
    isUtama: true,
    deskripsi: 'Operasi bilangan, notasi ilmiah, aljabar persamaan kuadrat, geometri transformasi, bangun ruang, dan analisis data & peluang.',
    totalBab: 4,
    babList: MTK_SMP_MODUL,
  },
  {
    kode: 'BIN_SMP',
    nama: 'Bahasa Indonesia (Literasi TKA)',
    singkatan: 'BIN',
    badgeWarna: '#0284c7',
    bgLight: '#f0f9ff',
    borderWarna: '#bae6fd',
    emoji: '📖',
    isUtama: true,
    deskripsi: 'Pemahaman tekstual, istilah teknis, informasi tersurat-tersirat, analisis ide pokok, apresiasi sastra, dan evaluasi kritis teks bacaan.',
    totalBab: 4,
    babList: BIN_SMP_MODUL,
  },
  {
    kode: 'IPA_SMP',
    nama: 'Ilmu Pengetahuan Alam (IPA CP Fase D)',
    singkatan: 'IPA',
    badgeWarna: '#059669',
    bgLight: '#ecfdf5',
    borderWarna: '#a7f3d0',
    emoji: '🔬',
    isUtama: false,
    deskripsi: 'Metode ilmiah, zat & wujud, kalor pemuaian, mekanika gerak & gaya, optik kelistrikan, biologi sel organ, genetika, ekosistem bumi tata surya.',
    totalBab: 4,
    babList: IPA_SMP_MODUL,
  },
  {
    kode: 'BIG_SMP',
    nama: 'Bahasa Inggris (English CP Fase D)',
    singkatan: 'BIG',
    badgeWarna: '#7c3aed',
    bgLight: '#f5f3ff',
    borderWarna: '#ddd6fe',
    emoji: '🇬🇧',
    isUtama: false,
    deskripsi: 'Daily expressions, notice & caution, functional labels, essential tenses, passive voice, 5 core reading genres (Recount, Narrative, Procedure, Report).',
    totalBab: 4,
    babList: BIG_SMP_MODUL,
  },
];

export const SEMUA_BAB_SMP = [
  ...MTK_SMP_MODUL,
  ...BIN_SMP_MODUL,
  ...IPA_SMP_MODUL,
  ...BIG_SMP_MODUL,
];

export function getSubtestSmpByKode(kode) {
  if (!kode) return null;
  const k = String(kode).toUpperCase().trim();
  return DAFTAR_SUBTES_SMP.find((s) => s.kode === k) || null;
}

export function getBabSmpBySlug(subtestKode, babSlug) {
  if (!subtestKode || !babSlug) return null;
  const k = String(subtestKode).toUpperCase().trim();
  const sub = DAFTAR_SUBTES_SMP.find((s) => s.kode === k);
  if (!sub) return null;
  return sub.babList.find((b) => b.slug === babSlug) || null;
}

export function getBabSmpTetangga(subtestKode, babSlug) {
  const sub = getSubtestSmpByKode(subtestKode);
  if (!sub) return { prevBab: null, nextBab: null };
  const list = sub.babList;
  const idx = list.findIndex((b) => b.slug === babSlug);
  if (idx === -1) return { prevBab: null, nextBab: null };
  return {
    prevBab: idx > 0 ? list[idx - 1] : null,
    nextBab: idx < list.length - 1 ? list[idx + 1] : null,
  };
}

export function hitungStatistikModulSmpSiswa(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKeySelesai = `gemilang_modul_smp_selesai_${sid}`;
  let babSelesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKeySelesai);
    if (raw) babSelesaiArr = JSON.parse(raw);
  } catch {
    babSelesaiArr = [];
  }

  const totalBab = SEMUA_BAB_SMP.length;
  const selesaiCount = babSelesaiArr.length;
  const persen = totalBab > 0 ? Math.round((selesaiCount / totalBab) * 100) : 0;

  const perSubtest = {};
  DAFTAR_SUBTES_SMP.forEach((sub) => {
    const subBabIds = sub.babList.map((b) => b.id);
    const subSelesai = subBabIds.filter((id) => babSelesaiArr.includes(id)).length;
    perSubtest[sub.kode] = {
      selesai: subSelesai,
      total: sub.babList.length,
      persen: Math.round((subSelesai / sub.babList.length) * 100),
    };
  });

  return {
    totalBab,
    totalSelesai: selesaiCount,
    selesaiCount,
    persenTotal: persen,
    persen,
    perSubtes: perSubtest,
    perSubtest,
    babSelesaiIds: babSelesaiArr,
  };
}

export function getDaftarBabSmpSelesai(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_selesai_${sid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function tandaiBabSmpSelesai(studentId, babId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_selesai_${sid}`;
  let selesaiArr = [];
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) selesaiArr = JSON.parse(raw);
  } catch {
    selesaiArr = [];
  }
  if (!selesaiArr.includes(babId)) {
    selesaiArr.push(babId);
    try {
      localStorage.setItem(storageKey, JSON.stringify(selesaiArr));
    } catch {
      // ignore
    }
  }
}

export function simpanTerakhirDibacaSmp(studentId, babData) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_last_${sid}`;
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        ...babData,
        timestamp: Date.now(),
      })
    );
  } catch {
    // ignore
  }
}

export function getTerakhirDibacaSmp(studentId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_last_${sid}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function simpanSkorKuisSmpBab(studentId, babId, skorBenar, totalSoal) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_kuis_${sid}_${babId}`;
  const nilai100 = totalSoal > 0 ? Math.round((skorBenar / totalSoal) * 100) : 0;
  const xpReward = skorBenar * 25;

  const data = {
    babId,
    skorBenar,
    totalSoal,
    nilai100,
    xpReward,
    lulus: skorBenar >= Math.ceil(totalSoal * 0.6),
    waktu: Date.now(),
  };

  try {
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore
  }

  if (data.lulus) {
    tandaiBabSmpSelesai(sid, babId);
  }

  return data;
}

export function getSkorKuisSmpBab(studentId, babId) {
  const sid = studentId || 'siswa_smp_default';
  const storageKey = `gemilang_modul_smp_kuis_${sid}_${babId}`;
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
