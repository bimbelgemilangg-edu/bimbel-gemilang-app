// src/utils/cocokkanJenjang.js
// ============================================================
// Pencocokan jenjang soal<->target, dipindah dari mesinTryOutOtomatis.js
// (15 Okt 2026) supaya TERUJI di Node polos — berkas mesin mengimpor
// instansi Firestore sehingga tak bisa dimuat tanpa Vite (preseden sama:
// ringkasSoalAdmin, aliasMapel).
// ============================================================
const norm = (s) => String(s ?? '').trim().toLowerCase();

export function normJenjang(s) {
  const t = norm(s).replace(/[^a-z0-9]/g, '');
  if (!t) return '';
  if (t.startsWith('sma') || t === 'ma' || t.includes('smama')) return 'sma';
  if (t.startsWith('smp') || t.includes('mts')) return 'smp';
  if (t.startsWith('sd') || t === 'mi' || t.startsWith('sdmi')) return 'sd';
  return t;
}

export function cocokkanJenjang(soalJenjang, targetJenjang) {
  const t = normJenjang(targetJenjang);
  if (!t) return true;
  const s = normJenjang(soalJenjang);
  if (!s) return true;
  return s === t;
}

export default { normJenjang, cocokkanJenjang };
