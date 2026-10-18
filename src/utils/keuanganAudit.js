// src/utils/keuanganAudit.js
// ============================================================
// AUDIT KEUANGAN OWNER (18 Okt 2026): jawaban atas masalah nyata yang
// diceritakan owner — uang campur (prive orang tua, gaji, talangan
// ChatGPT/pasir) yang dulu ditulis samar ("sewa gedung") membuat admin
// bingung dan owner sungkan. Prinsip desain (evaluasi alur):
//   • SATU buku besar (finance_logs) — TIDAK double ledger; peran hanya
//     mengubah VIEW & hak catat, sehingga tidak ada rekonsiliasi ganda;
//   • kategori JUJUR kelas satu: Prive Owner & Gaji Owner (rincian
//     sensitif masuk memoOwner yang hanya tampil di area owner);
//   • talangan owner = kanal kasOwner (uang pribadi owner dipakai untuk
//     bimbel) — bukan pengeluaran kas admin/bank;
//   • serah tunai akhir bulan = TRANSFER kasAdmin -> kasOwner (uang
//     pindah kantong, BUKAN pengeluaran) sehingga kas admin reset 0
//     tiap tanggal 1 tanpa mencemari analisis;
//   • dicatatOleh ('admin'|'owner') biar admin tahu entri mana milik
//     owner dan tidak bingung ("ChatGPT ini apa?").
// Semua fungsi MURNI & teruji; tampilan hidup di PanelAudit.jsx.
// ============================================================
import { KANAL } from './kanalUang.js';

export const KATEGORI_PRIVE = 'Prive Owner (pengambilan pribadi)';
export const KATEGORI_GAJI = 'Gaji Owner';
export const KATEGORI_SERAH = 'Serah tunai akhir bulan ke owner';

export const KATEGORI_OWNER_BARU = [
  KATEGORI_PRIVE,
  KATEGORI_GAJI,
  KATEGORI_SERAH,
  'Tools & Analitik (ChatGPT, software)',
  'Investasi Pembangunan (material, pasir, dll)',
];

export const isPrive = (t = {}) => t.category === KATEGORI_PRIVE || t.category === KATEGORI_GAJI;
export const isTalanganOwner = (t = {}) => (t.kanal === KANAL.KAS_OWNER);

/** Baris audit ternormalisasi dari satu log finance_logs. */
export function barisAudit(t = {}) {
  return {
    tanggal: t.date || '',
    keterangan: t.note || '',
    kategori: t.category || '',
    kantong: t.kanal || KANAL.TANPA,
    kantongDari: t.kanalDari || '',
    kantongKe: t.kanalKe || '',
    tipe: t.type || '',
    nominal: Number(t.amount || 0),
    dicatatOleh: t.dicatatOleh || 'admin',
    memo: t.memoOwner || '',
  };
}

/**
 * Ringkasan audit: masuk/keluar/transfer + prive/gaji + saldo akhir per
 * kantong. Transfer antar-kantong TIDAK dihitung masuk/keluar (uang
 * pindah, bukan bertambah/hilang) — kunci agar analisis tidak bohong.
 */
export function ringkasanAudit(logs = []) {
  const r = {
    masuk: 0, keluar: 0, transfer: 0, prive: 0, gaji: 0, talangan: 0,
    perKantong: {
      [KANAL.KAS_ADMIN]: { masuk: 0, keluar: 0, saldo: 0 },
      [KANAL.BANK]: { masuk: 0, keluar: 0, saldo: 0 },
      [KANAL.KAS_OWNER]: { masuk: 0, keluar: 0, saldo: 0 },
    },
  };
  for (const t of logs) {
    const b = barisAudit(t);
    if (b.tipe === 'Transfer' && b.kantongDari && b.kantongKe) {
      r.transfer += b.nominal;
      if (r.perKantong[b.kantongDari]) { r.perKantong[b.kantongDari].keluar += b.nominal; r.perKantong[b.kantongDari].saldo -= b.nominal; }
      if (r.perKantong[b.kantongKe]) { r.perKantong[b.kantongKe].masuk += b.nominal; r.perKantong[b.kantongKe].saldo += b.nominal; }
      continue;
    }
    if (b.tipe === 'Pemasukan') {
      r.masuk += b.nominal;
      if (r.perKantong[b.kantong]) { r.perKantong[b.kantong].masuk += b.nominal; r.perKantong[b.kantong].saldo += b.nominal; }
    } else if (b.tipe === 'Pengeluaran') {
      r.keluar += b.nominal;
      if (r.perKantong[b.kantong]) { r.perKantong[b.kantong].keluar += b.nominal; r.perKantong[b.kantong].saldo -= b.nominal; }
      if (t.category === KATEGORI_PRIVE) r.prive += b.nominal;
      if (t.category === KATEGORI_GAJI) r.gaji += b.nominal;
      if (isTalanganOwner(t)) r.talangan += b.nominal;
    }
  }
  return r;
}

/** Tren masuk/keluar per bulan (key 'YYYY-MM') untuk grafik audit. */
export function trenBulanan(logs = []) {
  const m = new Map();
  for (const t of logs) {
    const key = String(t.date || '').slice(0, 7);
    if (!key || key.length !== 7) continue;
    if (!m.has(key)) m.set(key, { bulan: key, masuk: 0, keluar: 0 });
    const e = m.get(key);
    if (t.type === 'Pemasukan') e.masuk += Number(t.amount || 0);
    else if (t.type === 'Pengeluaran') e.keluar += Number(t.amount || 0);
  }
  return [...m.values()].sort((a, b) => a.bulan.localeCompare(b.bulan));
}

const kutip = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

/** CSV audit (BOM UTF-8 agar Excel Indonesia membuka aksen dengan benar). */
export function keCsvAudit(logs = []) {
  const kepala = ['Tanggal', 'Keterangan', 'Kategori', 'Kantong', 'Tipe', 'Nominal', 'Dicatat oleh', 'Memo owner'];
  const baris = logs.map((t) => {
    const b = barisAudit(t);
    return [b.tanggal, b.keterangan, b.kategori, b.kantong, b.tipe, b.nominal, b.dicatatOleh, b.memo].map(kutip).join(',');
  });
  return [`\uFEFF${kepala.map(kutip).join(',')}`, ...baris].join('\n');
}

export default { KATEGORI_PRIVE, KATEGORI_GAJI, KATEGORI_SERAH, barisAudit, ringkasanAudit, trenBulanan, keCsvAudit };

// ------------------------------------------------------------
// PLAFON KAS ADMIN & KEBIJAKAN PENCATATAN (18 Okt 2026, keputusan
// owner): admin hanya boleh memegang kas operasional terbatas
// (default 2 jt); kelebihan WAJIB diserah ke owner (mingguan atau
// kapan diminta) via Transfer kasAdmin -> bankBimbel/brankas owner.
// BCA dicatat OWNER saat transaksi terjadi; admin hanya MELIHAT
// baris bulan berjalan (read-only) di laporannya.
// ------------------------------------------------------------
export const PLAFON_DEFAULT = 2000000;

/** Status plafon kas admin: berapa yang wajib segera diserah. */
export function statusPlafon(saldo = 0, plafon = PLAFON_DEFAULT) {
  const melebihi = saldo > plafon;
  return { melebihi, wajibSerah: melebihi ? saldo - plafon : 0, saldo, plafon };
}

/**
 * Kebijakan hak catat: pengeluaran dari rekening BCA BUKAN hak admin
 * (M-banking dipegang owner); admin mencatat tunai & pemasukan transfer
 * (rekonsiliasi pending), owner mencatat semua arus BCA saat terjadi.
 */
export function bolehCatatAdmin(type = '', method = '') {
  if (type === 'Pengeluaran' && method === 'Transfer') {
    return { boleh: false, alasan: 'Pengeluaran dari rekening BCA dicatat OWNER saat transaksi terjadi (panel owner 🔍 Audit). Admin melihat barisnya di laporan bulan berjalan (read-only).' };
  }
  return { boleh: true, alasan: '' };
}

/**
 * Saldo kas brankas admin BERJALAN = saldo awal (hitung fisik saat
// setup/tutup bulan) + arus tunai bulan ini − serah ke owner + transfer
 * masuk ke kas (mis. owner menambah uang operasional).
 */
export function saldoKasAdmin({ saldoAwal = 0, tunaiMasuk = 0, tunaiKeluar = 0, setorKas = 0, transferMasukKas = 0 } = {}) {
  return (Number(saldoAwal) || 0) + (Number(tunaiMasuk) || 0) - (Number(tunaiKeluar) || 0) - (Number(setorKas) || 0) + (Number(transferMasukKas) || 0);
}
