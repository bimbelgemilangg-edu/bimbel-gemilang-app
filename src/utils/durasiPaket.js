// src/utils/durasiPaket.js
// ============================================================
// DURASI PAKET BEBAS + PROMO BONUS BULAN (21 Okt 2026, keluhan owner):
// "untuk paket itu ada paket lebih bisa 2 bulan 4 dll sesuai kadang
// promonya gimana?" — kenyataannya durasi paket TIDAK selalu 1/3/6/12:
// ada paket 2 bulan, 4 bulan, durasi custom sesuai kesepakatan, plus
// promo bonus bulan ("bayar 2 dapat 3"). Sebelumnya:
//   1. dropdown durasi terpaku 1/3/6/12(/24) — paket 2 atau 4 bulan
//      tidak bisa dipilih saat pendaftaran maupun perpanjangan;
//   2. total selalu harga × bulan TANPA jalur promo — bonus bulan tidak
//      punya tempat, tanggal selesai tidak ikut memanjang;
//   3. penyesuaian kesepakatan (#263) hanya mengubah NOMINAL — durasi &
//      tanggal selesai paket tidak bisa disesuaikan bareng harganya.
// Util ini satu sumber kebenaran hitungan durasi/promo: murni, teruji
// (tests/durasiPaket.test.mjs), dipakai AddStudent / EditStudent /
// StudentFinance (perpanjangan + penyesuaian kesepakatan).
// ============================================================

/** Preset durasi yang paling sering dipakai admin (urut naik). */
export const PRESET_DURASI = [1, 2, 3, 4, 6, 12, 24];

/** Label manusiawi per preset (dipakai dropdown bersama). */
export const LABEL_DURASI = {
  1: '1 Bulan',
  2: '2 Bulan',
  3: '3 Bulan (1 Term)',
  4: '4 Bulan',
  6: '6 Bulan (1 Semester)',
  12: '12 Bulan (1 Tahun)',
  24: '24 Bulan (2 Tahun)',
};

/** Batas atas durasi custom — di atas ini hampir pasti salah ketik. */
export const DURASI_MAX = 60;
/** Batas atas bonus bulan promo — dijaga kecil agar tak jadi salah kaprah. */
export const BONUS_MAX = 24;

/**
 * Durasi (bulan bayar) yang sah: bulat, 1..maks. Apa pun di luar itu
 * (0, negatif, NaN, teks, > maks) dianggap TIDAK VALID → 0, supaya
 * guard pemanggil bisa menolak eksplisit — bukan diam-diam menagih
 * nominal aneh (pelajaran bug "default 3 bulan kepencet", Okt 2026).
 */
export function normalisasiDurasi(nilai, maks = DURASI_MAX) {
  const n = Math.floor(Number(nilai));
  if (!Number.isFinite(n) || n < 1 || n > maks) return 0;
  return n;
}

/**
 * Bonus bulan promo yang sah: bulat, 0..maks (0 = tanpa bonus).
 * Negatif/NaN/kelewat besar → 0 (bonus tidak pernah "minus").
 */
export function normalisasiBonus(nilai, maks = BONUS_MAX) {
  const n = Math.floor(Number(nilai));
  if (!Number.isFinite(n) || n < 0 || n > maks) return 0;
  return n;
}

/**
 * Tambah/kurangi bulan pada tanggal 'YYYY-MM-DD' secara murni (tanpa
 * bergantung zona waktu runtime) dengan CLAMP akhir bulan:
 *   31 Jan + 1 bulan = 28 Feb (29 di tahun kabisat) — BUKAN 3 Mar.
 * Perilaku lama `d.setMonth(getMonth()+n)` meluber (overflow) sehingga
 * siswa yang mulai tanggal 29/30/31 dapat tanggal selesai meleset.
 * Input tidak valid → '' (pemanggil wajib punya fallback jujur).
 * Jumlah bulan negatif didukung (dipakai logika pembalikan/reversal).
 */
export function tambahBulanKeTanggal(tanggalISO, jumlahBulan) {
  const iso = String(tanggalISO || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return '';
  const n = Math.floor(Number(jumlahBulan));
  if (!Number.isFinite(n)) return '';
  const [y, m, d] = iso.split('-').map(Number);
  if (m < 1 || m > 12 || d < 1 || d > 31) return '';
  const totalBulan = y * 12 + (m - 1) + n;
  const thn = Math.floor(totalBulan / 12);
  const bln = ((totalBulan % 12) + 12) % 12; // 0-11, aman untuk bulan negatif
  const hariTerakhir = new Date(Date.UTC(thn, bln + 1, 0)).getUTCDate();
  const hari = Math.min(d, hariTerakhir);
  return `${String(thn).padStart(4, '0')}-${String(bln + 1).padStart(2, '0')}-${String(hari).padStart(2, '0')}`;
}

/**
 * Rencana perpanjangan paket (boleh membawa promo bonus bulan):
 * uang hanya dihitung dari BULAN BAYAR; bulan bonus gratis tapi ikut
 * memanjangkan tanggal selesai & durasi paket. `omzetPerBulan` = dasar
 * pengakuan omzet amortisasi (total ÷ bulan TOTAL, bukan ÷ bulan bayar —
 * promo membuat omzet diakui lebih landai, dan itu memang benar).
 * `bulanBayar` tidak valid → null (pemanggil wajib menolak).
 */
export function rencanaPaketPromo({
  hargaPerBulan = 0,
  bulanBayar = 0,
  bulanBonus = 0,
  tanggalSelesaiLama = '',
  tanggalAcuan = '',
} = {}) {
  const bayar = normalisasiDurasi(bulanBayar);
  if (!bayar) return null;
  const bonus = normalisasiBonus(bulanBonus);
  const bulanTotal = bayar + bonus;
  const harga = Math.max(0, Math.round(Number(hargaPerBulan) || 0));
  const totalTagihan = harga * bayar;
  const dasar = String(tanggalSelesaiLama || tanggalAcuan || '').slice(0, 10);
  const tanggalSelesaiBaru = tambahBulanKeTanggal(dasar, bulanTotal);
  return {
    bulanBayar: bayar,
    bulanBonus: bonus,
    bulanTotal,
    totalTagihan,
    omzetPerBulan: bulanTotal > 0 ? Math.round(totalTagihan / bulanTotal) : totalTagihan,
    tanggalSelesaiBaru,
  };
}

/**
 * Rencana durasi kesepakatan (dipakai Penyesuaian Harga #263 yang
 * diperluas 21 Okt): paket promo 2/4/x bulan — nominal kesepakatan dan
 * LAMA paket disesuaikan bareng. Tanggal selesai = tanggal mulai +
 * durasi kesepakatan. Tanpa tanggal mulai yang sah, durasi tetap
 * disimpan tapi tanggal TIDAK dikarang-karang — kembalikan peringatan
 * jujur supaya admin melanjutkan lewat Koreksi Data Paket.
 * durasiKesepakatan 0/tak valid → null (= durasi tidak diubah; perilaku
 * lama penyesuaian tetap utuh, backward-compatible).
 */
export function rencanaDurasiKesepakatan({ tanggalMulai = '', durasiKesepakatan = 0 } = {}) {
  const d = normalisasiDurasi(durasiKesepakatan);
  if (!d) return null;
  const mulai = String(tanggalMulai || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mulai)) {
    return {
      durasiBulan: d,
      tanggalSelesai: '',
      peringatan: `Durasi kesepakatan ${d} bulan disimpan, TAPI tanggal mulai siswa tidak ditemukan — tanggal selesai tidak diubah otomatis. Betulkan lewat Koreksi Data Paket.`,
    };
  }
  return { durasiBulan: d, tanggalSelesai: tambahBulanKeTanggal(mulai, d), peringatan: '' };
}

export default {
  PRESET_DURASI,
  LABEL_DURASI,
  DURASI_MAX,
  BONUS_MAX,
  normalisasiDurasi,
  normalisasiBonus,
  tambahBulanKeTanggal,
  rencanaPaketPromo,
  rencanaDurasiKesepakatan,
};
