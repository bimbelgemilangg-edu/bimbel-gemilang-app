// src/utils/roleAkses.js
// ============================================================
// 🔥 BARU (pemisahan hak akses Admin Kasir vs Owner):
// Satu sumber kebenaran buat cek "siapa yang lagi login".
//
// Aturan main:
// - Login Admin (password)  -> role 'admin'  = KASIR. Hanya boleh
//   melihat/mengurus kas harian (brankas admin), pendaftaran siswa,
//   petty cash, kwitansi, dan setor kas. TIDAK boleh melihat saldo
//   rekening bank utama, omzet akumulasi, laba bersih, atau rekap
//   honor tentor.
// - Login Owner (PIN)       -> role 'owner'  = SUPER ADMIN. Boleh
//   semua: portal owner (/owner/finance), plus SELURUH halaman admin
//   (termasuk Gaji Guru & Pengaturan).
//
// Sesi sengaja dibuat saling meniadakan: Login Admin menghapus flag
// owner, Login Owner menghapus flag admin (lihat Login.jsx &
// LoginOwner.jsx) -- jadi di komputer bersama, kasir tidak pernah
// "mewarisi" hak owner tanpa memasukkan PIN.
// ============================================================

export const isOwnerSession = () =>
  typeof window !== 'undefined' &&
  window.localStorage.getItem('isOwnerLoggedIn') === 'true' &&
  window.localStorage.getItem('role') === 'owner';

export const isAdminSession = () =>
  typeof window !== 'undefined' &&
  window.localStorage.getItem('isLoggedIn') === 'true' &&
  window.localStorage.getItem('role') === 'admin';

// Boleh masuk area /admin/* ? (admin kasir ATAU owner)
export const bolehMasukAreaAdmin = () => isAdminSession() || isOwnerSession();

// Label peran buat tampilan (footer sidebar, dsb).
export const labelPeran = () => (isOwnerSession() ? 'Owner (Super Admin)' : 'Admin Kasir');

export default {
  isOwnerSession,
  isAdminSession,
  bolehMasukAreaAdmin,
  labelPeran,
};
