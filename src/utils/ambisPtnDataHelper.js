// src/utils/ambisPtnDataHelper.js
// ============================================================
// Helper Data Resmi 173 PTN & 4.594 Prodi AmbisPTN 1:1
// Universal Module: Berjalan mulus di Vite Bundler dan Node.js
// ============================================================
import ambisPtnData from '../data/ambisPtnData.js';

// Cache map universitas untuk pencarian cepat O(1)
const ptnMap = new Map();
(ambisPtnData.universities || []).forEach((u) => {
  ptnMap.set(u.slug, u);
  if (u.id) ptnMap.set(String(u.id), u);
});

// Cache array prodi terhidrasi (dengan nama & logo universitas)
let cachedHydratedMajors = null;
let cachedHydratedUniversities = null;

/**
 * Mengambil dataset resmi AmbisPTN: 173 PTN
 * Setiap PTN secara dinamis dilengkapi daftar prodi miliknya
 */
export function getDaftarPtnAmbis() {
  if (cachedHydratedUniversities) return cachedHydratedUniversities;

  const prodiByUni = new Map();
  (ambisPtnData.majors || []).forEach((m) => {
    if (!prodiByUni.has(m.uni_slug)) {
      prodiByUni.set(m.uni_slug, []);
    }
    prodiByUni.get(m.uni_slug).push(m);
  });

  cachedHydratedUniversities = (ambisPtnData.universities || []).map((u) => {
    const listMajor = prodiByUni.get(u.slug) || [];
    return {
      ...u,
      major_count: listMajor.length || u.major_count || 0,
      majors: listMajor,
    };
  });

  return cachedHydratedUniversities;
}

/**
 * Mengambil dataset prodi nasional AmbisPTN: 4.594 prodi
 * Setiap prodi dilengkapi uni_name, uni_short, uni_logo
 */
export function getDaftarProdiAmbis() {
  if (cachedHydratedMajors) return cachedHydratedMajors;

  cachedHydratedMajors = (ambisPtnData.majors || []).map((m) => {
    const uni = ptnMap.get(m.uni_slug);
    return {
      ...m,
      uni_name: uni?.name || m.uni_slug,
      uni_short: uni?.short_name || '',
      uni_logo: uni?.logo_url || null,
    };
  });

  return cachedHydratedMajors;
}

/**
 * Mengambil PTN berdasarkan slug, ID, singkatan, atau nama
 */
export function getPtnBySlug(query) {
  if (!query) return null;
  const q = String(query).toLowerCase().trim();
  const qNorm = q.replace(/[-_]/g, ' ');
  const list = getDaftarPtnAmbis();

  // 1. Prioritas 1: Cocok persis slug, id, singkatan, atau nama
  const exact = list.find((p) => {
    return (
      p.slug === q ||
      String(p.id) === q ||
      (p.short_name && p.short_name.toLowerCase() === q) ||
      (p.name && p.name.toLowerCase() === q) ||
      (p.name && p.name.toLowerCase() === qNorm)
    );
  });
  if (exact) return exact;

  // 2. Prioritas 2: Cocok substring nama atau singkatan
  return list.find((p) => {
    return (
      (p.name && p.name.toLowerCase().includes(qNorm)) ||
      (p.slug && p.slug.includes(q))
    );
  }) || null;
}

/**
 * Menghitung GAP dan Zona Kesiapan terhadap Passing Grade UTBK
 */
export function hitungGapTarget(passingScore, skorSiswa) {
  const target = Number(passingScore) || 700;
  if (skorSiswa == null || isNaN(Number(skorSiswa))) {
    return {
      gap: null,
      zona: 'TANPA_DATA',
      label: 'Belum Ada Skor Tryout',
      warna: '#64748b',
      bg: '#f1f5f9',
    };
  }

  const s = Number(skorSiswa);
  const gap = s - target;

  if (gap >= 20) {
    return {
      gap,
      zona: 'HIJAU_AMAN',
      label: `Zona Aman (+${gap} poin)`,
      warna: '#16a34a',
      bg: '#dcfce7',
    };
  }
  if (gap >= 0) {
    return {
      gap,
      zona: 'HIJAU_KOMPETITIF',
      label: `Zona Kompetitif (+${gap} poin)`,
      warna: '#0d9488',
      bg: '#ccfbf1',
    };
  }
  if (gap >= -40) {
    return {
      gap,
      zona: 'KUNING',
      label: `Zona Pemantapan (${gap} poin)`,
      warna: '#d97706',
      bg: '#fef3c7',
    };
  }
  return {
    gap,
    zona: 'MERAH',
    label: `Zona Perjuangan (${gap} poin)`,
    warna: '#dc2626',
    bg: '#fee2e2',
  };
}
