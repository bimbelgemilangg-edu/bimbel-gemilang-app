// src/utils/ambisPtnDataHelper.js
// ============================================================
// Helper Data Resmi 173 PTN & 4.594 Prodi AmbisPTN 1:1
// Berisi fungsi-fungsi murni tanpa dependensi React / Firebase.
// ============================================================
import rawDataPtn from '../data/ambisPtnData.json' with { type: 'json' };

/**
 * Mengambil dataset resmi AmbisPTN: 173 PTN
 */
export function getDaftarPtnAmbis() {
  return rawDataPtn.universities || [];
}

/**
 * Mengambil dataset prodi nasional AmbisPTN: 4.594 prodi
 */
export function getDaftarProdiAmbis() {
  return rawDataPtn.majors || [];
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
