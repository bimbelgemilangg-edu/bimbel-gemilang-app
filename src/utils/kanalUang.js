// src/utils/kanalUang.js
// ============================================================
// 🔥 BARU (modul rekonsiliasi & tagging kanal uang):
// Setiap transaksi wajib jelas "pintu masuk/keluar"-nya:
//   - kasAdmin   : UANG TUNAI fisik di brankas/laci admin kasir.
//   - bankBimbel : REKENING BANK bimbel (transfer masuk/keluar).
//   - kasOwner   : kas pribadi owner (hasil setor kas admin atau
//                  uang yang owner sendiri pegang/input).
//   - tanpaMetode: data lama tanpa metode (tetap dihitung, tampil
//                  terpisah -- aturan lama dipertahankan).
//
// Log lawas tidak punya field `kanal` -- kanal mereka DITURUNKAN dari
// field `method` (Tunai -> kasAdmin, Transfer -> bankBimbel, Cicilan
// -> bukan kas, kosong/aneh -> tanpaMetode). Log BARU selalu ditulis
// dengan field `kanal` eksplisit.
//
// Jenis transaksi khusus: type 'Transfer' = SETOR KAS (uang pindah
// antar kanal, BUKAN pemasukan/pengeluaran -- tidak boleh masuk total
// omzet maupun total belanja). Field pendukung: kanalDari, kanalKe.
// ============================================================

export const KANAL = {
  KAS_ADMIN: 'kasAdmin',
  BANK: 'bankBimbel',
  KAS_OWNER: 'kasOwner',
  TANPA: 'tanpaMetode',
};

export const LABEL_KANAL = {
  kasAdmin: 'Kas Tunai di Admin (brankas kasir)',
  bankBimbel: 'Rekening Bank Bimbel (transfer)',
  kasOwner: 'Kas Owner',
  tanpaMetode: 'Data lama tanpa metode',
};

export const LABEL_KANAL_PENDEK = {
  kasAdmin: '💵 Kas Admin',
  bankBimbel: '🏦 Bank Bimbel',
  kasOwner: '🏠 Kas Owner',
  tanpaMetode: '❔ Tanpa Metode',
};

// Tentukan kanal sebuah log transaksi (bukan setoran).
// `data` = dokumen finance_logs mentah ATAU log ternormalisasi yang
// punya field methodAsli/method/kanal.
export const kanalDariLog = (data) => {
  if (!data) return KANAL.TANPA;
  if (data.kanal) return data.kanal;
  const metode = data.methodAsli !== undefined ? data.methodAsli : (data.method || '');
  if (metode === 'Tunai') return KANAL.KAS_ADMIN;
  if (metode === 'Transfer') return KANAL.BANK;
  if (metode === 'Cicilan') return null; // komitmen, belum ada uang fisik
  return KANAL.TANPA;
};

// Apakah log ini setoran kas antar-kanal (bukan pemasukan/pengeluaran)?
export const isSetorKas = (data) => data?.type === 'Transfer';

export default { KANAL, LABEL_KANAL, LABEL_KANAL_PENDEK, kanalDariLog, isSetorKas };
