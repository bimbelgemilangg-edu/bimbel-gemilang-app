// src/utils/statusTryOutPaket.js
// ============================================================
// SATU SUMBER KEBENARAN status paket try out + mesin transisinya.
// ============================================================
//
// KENAPA BERKAS INI ADA (Fase 2: tentor merakit try out, admin menyetujui)
// Begitu tentor boleh mengusulkan paket, ada keadaan baru di koleksi
// `tryout_paket` yang sebelumnya tidak pernah ada: paket yang BELUM boleh
// dilihat siapa pun kecuali pembuatnya dan admin.
//
// Yang diperiksa sebelum menulis fitur ini:
//
//   Aman   DaftarTryOutPage.jsx (siswa)  where('status','==','aktif')
//   BOCOR  sumberKonten.js               getDocs tanpa saringan -> Perpustakaan
//                                         (dilihat admin DAN guru)
//   BOCOR  TeacherDashboard.jsx          filter `status !== 'nonaktif'` ->
//                                         draf lolos dan masuk banner
//   BOCOR  CetakPaketLatihan.jsx         tanpa saringan -> draf muncul di
//                                         dropdown "Paket Try Out saya"
//   BOCOR  HasilTryOutAdminPage.jsx      tanpa saringan -> draf tanpa hasil
//                                         ikut ter daftar
//
// Jadi status dipusatkan di sini dan semua pemakai menyaring lewat fungsi
// yang sama. Kalau tiap halaman punya daftar status sendiri, satu halaman
// yang lupa = draf bocor.
//
// ⚠️ ATURAN KOMPATIBILITAS (SOP janji #1): paket LAMA bisa tidak punya
// field `status` sama sekali. Menyaring dengan `status === 'aktif'` di sisi
// klien akan MENGHILANGKAN paket warisan itu dari Perpustakaan dan dasbor
// guru — regresi yang terlihat seperti "paketnya hilang". Maka penyaring
// klien memakai daftar HITAM (buang yang jelas belum terbit), bukan daftar
// putih. Query Firestore untuk siswa tetap `== 'aktif'` seperti sebelumnya
// dan tidak diubah di sini.
// ============================================================

export const STATUS_PAKET = {
  /** Baru disimpan tentor, belum dikirim. */
  DRAF: 'draf',
  /** Sudah dikirim tentor, menunggu keputusan admin. */
  MENUNGGU: 'menunggu_approval',
  /** Disetujui admin — ini satu-satunya yang boleh dilihat siswa. */
  AKTIF: 'aktif',
  /** Ditolak admin beserta alasannya; tentor bisa memperbaiki & mengirim ulang. */
  DITOLAK: 'ditolak',
  /** Dimatikan admin (perilaku lama, tetap dihormati). */
  NONAKTIF: 'nonaktif',
};

/** Status yang TIDAK boleh tampil di daftar umum (Perpustakaan, cetak, dasbor). */
const BELUM_TERBIT = new Set([
  STATUS_PAKET.DRAF,
  STATUS_PAKET.MENUNGGU,
  STATUS_PAKET.DITOLAK,
  STATUS_PAKET.NONAKTIF,
  'arsip',
  'dihapus',
]);

const LABEL = {
  draf: 'Draf (belum dikirim)',
  menunggu_approval: 'Menunggu persetujuan admin',
  aktif: 'Terbit',
  ditolak: 'Ditolak admin',
  nonaktif: 'Nonaktif',
};

/**
 * Bolehkah paket ini tampil di daftar umum?
 * `status` kosong/tak dikenal dianggap warisan lama = terbit.
 */
export function bolehTampilUmum(status) {
  const s = String(status ?? '').trim();
  if (!s) return true; // warisan lama tanpa field status
  return !BELUM_TERBIT.has(s);
}

/** Saring daftar paket untuk tampilan umum. */
export function saringPaketTerbit(daftar) {
  return (Array.isArray(daftar) ? daftar : []).filter((p) => bolehTampilUmum(p?.status));
}

/** Hanya admin & pembuatnya yang boleh melihat status ini. */
export function perluAntreanApproval(status) {
  return String(status ?? '').trim() === STATUS_PAKET.MENUNGGU;
}

/** Label manusiawi untuk pill/badge. */
export function labelStatus(status) {
  const s = String(status ?? '').trim();
  return LABEL[s] || (s ? s : 'Terbit (data lama)');
}

/** Warna pill status — seragam di halaman tentor maupun admin. */
export function warnaStatus(status) {
  switch (String(status ?? '').trim()) {
    case STATUS_PAKET.AKTIF: return { latar: '#dcfce7', teks: '#166534' };
    case STATUS_PAKET.MENUNGGU: return { latar: '#fef3c7', teks: '#92400e' };
    case STATUS_PAKET.DITOLAK: return { latar: '#fee2e2', teks: '#991b1b' };
    case STATUS_PAKET.DRAF: return { latar: '#e2e8f0', teks: '#334155' };
    default: return { latar: '#f1f5f9', teks: '#475569' };
  }
}

// Transisi yang diizinkan. Apa pun di luar peta ini DITOLAK — termasuk
// tentor yang mencoba menerbitkan paketnya sendiri melewati admin.
const TRANSISI = {
  draf: ['menunggu_approval', 'draf'],
  menunggu_approval: ['aktif', 'ditolak', 'draf'],
  ditolak: ['menunggu_approval', 'draf'],
  aktif: ['nonaktif', 'aktif'],
  nonaktif: ['aktif', 'nonaktif'],
  // Warisan lama tanpa status: dianggap sudah terbit.
  '': ['nonaktif', 'menunggu_approval', 'aktif', ''],
};

/**
 * Apakah perpindahan status ini diizinkan, dan siapa yang boleh?
 * @returns {{boleh:boolean, alasan:string, butuhPeran:string|null}}
 */
export function transisiStatus(dari, ke, peran = 'admin') {
  const asal = String(dari ?? '').trim();
  const tujuan = String(ke ?? '').trim();
  if (asal === tujuan) return { boleh: true, alasan: '', butuhPeran: null };

  const diizinkan = TRANSISI[asal] || [];
  if (!diizinkan.includes(tujuan)) {
    return { boleh: false, alasan: `Status "${asal || '(kosong)'}" tidak bisa langsung jadi "${tujuan}".`, butuhPeran: null };
  }

  // Menerbitkan (-> aktif) dan menonaktifkan adalah hak ADMIN/OWNER saja.
  if (tujuan === STATUS_PAKET.AKTIF || tujuan === STATUS_PAKET.NONAKTIF) {
    if (peran !== 'admin' && peran !== 'owner') {
      return { boleh: false, alasan: 'Hanya admin atau owner yang bisa menerbitkan/menonaktifkan paket. Tentor hanya bisa mengusulkan.', butuhPeran: 'admin' };
    }
  }
  // Mengirim/menarik usulan adalah hak TENTOR (atau admin yang membantu).
  if (tujuan === STATUS_PAKET.MENUNGGU || tujuan === STATUS_PAKET.DITOLAK) {
    if (peran !== 'tentor' && peran !== 'admin' && peran !== 'owner') {
      return { boleh: false, alasan: 'Peran ini tidak boleh mengubah status usulan.', butuhPeran: 'tentor' };
    }
  }
  if (tujuan === STATUS_PAKET.DITOLAK && peran !== 'admin' && peran !== 'owner') {
    return { boleh: false, alasan: 'Menolak usulan adalah keputusan admin.', butuhPeran: 'admin' };
  }

  return { boleh: true, alasan: '', butuhPeran: null };
}

export default {
  STATUS_PAKET,
  bolehTampilUmum,
  saringPaketTerbit,
  perluAntreanApproval,
  labelStatus,
  warnaStatus,
  transisiStatus,
};
