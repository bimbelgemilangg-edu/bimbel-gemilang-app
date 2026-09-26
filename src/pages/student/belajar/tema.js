// src/pages/student/belajar/tema.js
// ============================================================
// TEMA "GEMILANG BIRU" -- token & gaya bersama untuk modul
// Materi v2 (/siswa/belajar). Diambil dari mockup resmi owner:
// docs/desain/mockup-ui-gemilang.png (Turn 5).
//
// Satu sumber kebenaran visual: semua halaman belajar impor
// dari file ini. Ganti warna di sini = ganti semua halaman.
// ============================================================

export const T = {
  // warna utama (dari mockup: biru cerah)
  biru: '#1E9BF0',
  biruGelap: '#0E7AD4',
  biruDalam: '#0A5FC0',
  gradasiSidebar: 'linear-gradient(180deg,#41AFF8 0%,#1176D8 100%)',
  gradasiHero: 'linear-gradient(135deg,#35A8F6 0%,#0E7AD4 55%,#0A5FC0 100%)',
  // latar & permukaan
  latar: '#E9F2FC',
  kartu: '#FFFFFF',
  garis: '#E1ECF8',
  garisLembut: '#EBF3FC',
  kotakBiru: '#EAF4FE',      // kotak rumus / box lembut
  kotakBiruGaris: '#D3E8FB',
  // teks
  judul: '#0F3057',
  teks: '#33506E',
  samar: '#7E93AB',
  // status
  hijau: '#22C55E',
  hijauLatar: '#E9F9EF',
  hijauGaris: '#C2ECD0',
  hijauTeks: '#15803D',
  merah: '#EF4444',
  merahLatar: '#FEF2F2',
  merahGaris: '#FBCACA',
  amberLatar: '#FFF6DE',
  amberGaris: '#F1E1AE',
  amberTeks: '#8A6D1A',
  // bentuk
  radius: 16,
  radiusKecil: 12,
  bayangan: '0 6px 20px rgba(16,84,148,0.07)',
  bayanganKecil: '0 3px 10px rgba(16,84,148,0.06)',
  font: "'Plus Jakarta Sans',ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif",
};

// ---------- potongan gaya pakai ulang ----------

export const kartuDasar = {
  background: T.kartu,
  border: `1px solid ${T.garis}`,
  borderRadius: T.radius,
  boxShadow: T.bayanganKecil,
};

export const chip = (aktif) => ({
  flexShrink: 0,
  border: aktif ? '1px solid transparent' : `1px solid ${T.garis}`,
  background: aktif ? T.biru : '#FFFFFF',
  color: aktif ? '#fff' : T.samar,
  borderRadius: 10,
  padding: '7px 15px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: aktif ? '0 4px 12px rgba(30,155,240,.28)' : 'none',
  transition: 'all .15s ease',
});

export const lingkaranNomor = (varian) => ({
  // varian: 'aktif' | 'biasa' | 'selesai'
  width: 38,
  height: 38,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 13,
  background: varian === 'aktif' ? T.biru
    : varian === 'selesai' ? T.hijauLatar : T.kotakBiru,
  color: varian === 'aktif' ? '#fff'
    : varian === 'selesai' ? T.hijauTeks : T.biruGelap,
  border: varian === 'biasa' ? `1px solid ${T.kotakBiruGaris}` : 'none',
});

export const barLuar = (tinggi = 7) => ({
  height: tinggi,
  borderRadius: 99,
  background: '#DCE9F7',
  overflow: 'hidden',
});

export const barDalam = (persen, warna = T.biru) => ({
  height: '100%',
  width: `${persen}%`,
  borderRadius: 99,
  background: warna,
  transition: 'width .35s ease',
});

export const tombolPill = (varian = 'primer') => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  cursor: 'pointer',
  borderRadius: 12,
  padding: '11px 20px',
  fontSize: 13,
  fontWeight: 800,
  fontFamily: 'inherit',
  background: varian === 'primer' ? T.biru
    : varian === 'hijau' ? T.hijauLatar
    : varian === 'merah' ? T.merahLatar : '#fff',
  color: varian === 'primer' ? '#fff'
    : varian === 'hijau' ? T.hijauTeks
    : varian === 'merah' ? '#B91C1C' : T.biruGelap,
  border: varian === 'hijau' ? `1px solid ${T.hijauGaris}`
    : varian === 'merah' ? `1px solid ${T.merahGaris}`
    : varian === 'putih' ? `1px solid ${T.garis}` : 'none',
  boxShadow: varian === 'primer' ? '0 6px 16px rgba(30,155,240,.3)' : 'none',
});

export const kotakRumus = {
  background: T.kotakBiru,
  border: `1px solid ${T.kotakBiruGaris}`,
  borderRadius: T.radiusKecil,
  padding: '10px 16px',
  margin: '10px 0 14px',
  color: T.biruDalam,
  overflowX: 'auto',
};

export const kotakTips = {
  display: 'flex',
  gap: 9,
  alignItems: 'flex-start',
  background: T.amberLatar,
  border: `1px solid ${T.amberGaris}`,
  borderRadius: T.radiusKecil,
  padding: '11px 13px',
  margin: '12px 0',
  color: T.amberTeks,
  fontSize: 12.5,
  lineHeight: 1.65,
};

export const kotakSukses = {
  display: 'flex',
  gap: 9,
  alignItems: 'flex-start',
  background: T.hijauLatar,
  border: `1px solid ${T.hijauGaris}`,
  borderRadius: T.radiusKecil,
  padding: '11px 13px',
  margin: '12px 0',
  color: T.hijauTeks,
  fontSize: 12.5,
  lineHeight: 1.65,
};

export const judulSeksiKartu = {
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  fontWeight: 800,
  fontSize: 15,
  color: T.judul,
};

export const lencanaSeksi = {
  width: 30,
  height: 30,
  borderRadius: 9,
  background: T.kotakBiru,
  border: `1px solid ${T.kotakBiruGaris}`,
  color: T.biruGelap,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: 11.5,
  flexShrink: 0,
};

export const halamanDasar = {
  minHeight: '100vh',
  background: T.latar,
  fontFamily: T.font,
};
