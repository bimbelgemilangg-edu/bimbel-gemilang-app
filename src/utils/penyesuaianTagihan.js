// src/utils/penyesuaianTagihan.js
// ============================================================
// PENYESUAIAN HARGA BERBASIS KESEPAKATAN (20 Okt 2026, keluhan owner):
// harga katalog tidak lagi memaksa kenyataan lapangan — penawaran,
// diskon, dan paket pecah sah dicatat sebagai KESEPAKATAN per siswa.
// Syarat agar sistem tetap otomatis & kwitansi tidak pernah macet:
//   1. sisaTagihan selalu = kesepakatan − terbayar;
//   2. jadwal cicilan DIPERHITUNGAN ULANG dari sisa (yang sudah dibayar
//      adalah sejarah, tak diubah);
//   3. selisih katalog−kesepakatan tercatat untuk laporan owner;
//   4. kwitansi tetap tercetak dari nominal RIIL yang diterima.
// PERLUASAN 21 Okt (keluhan owner: "paket bisa 2 bulan, 4, dll sesuai
// promonya"): kesepakatan boleh membawa DURASI paket — nominal dan lama
// paket disesuaikan bareng (tanggal selesai = tanggal mulai + durasi).
// Tanpa durasiKesepakatan, perilaku lama 100% utuh (backward-compatible).
// Semua fungsi MURNI & teruji.
// ============================================================

import { rencanaDurasiKesepakatan } from './durasiPaket.js';

const LUNAS = (c = {}) => {
  const st = String(c.status || '').trim();
  // 'Belum Lunas' MENGANDUNG kata 'lunas' — wajib dicek negasi dulu
  // (regresi tertangkap uji 20 Okt).
  return /lunas/i.test(st) && !/belum/i.test(st);
};

/**
 * Hitung ulang nominal cicilan BELUM lunas agar jumlahnya persis
 * sisaBaru. Jatuh tempo & cicilan terbayar tidak disentuh (fakta
 * sejarah). Sisa pembagian (modulus) ditambahkan ke cicilan terakhir.
 * @param {Array} detailCicilan entri finance_tagihan.detailCicilan
 * @param {number} sisaBaru sisa tagihan setelah kesepakatan
 */
export function hitungUlangCicilan(detailCicilan = [], sisaBaru = 0) {
  const list = (Array.isArray(detailCicilan) ? detailCicilan : []).map((c) => ({ ...c }));
  const idxBelum = list.map((c, i) => (LUNAS(c) ? -1 : i)).filter((i) => i >= 0);
  const sisa = Math.max(0, Number(sisaBaru) || 0);
  if (!idxBelum.length) return list;
  const per = Math.floor(sisa / idxBelum.length);
  idxBelum.forEach((i, k) => {
    list[i].nominal = per + (k === idxBelum.length - 1 ? sisa - per * idxBelum.length : 0);
  });
  return list;
}

/** Selisih penawaran: positif = diskon/penawaran di bawah katalog. */
export function hitungSelisihPenawaran(totalKatalog = 0, kesepakatan = 0) {
  return (Number(totalKatalog) || 0) - (Number(kesepakatan) || 0);
}

/**
 * Payload penyesuaian: satu sumber kebenaran untuk students &
 * finance_tagihan supaya tidak lagi sinkron setengah-setengah.
 * `durasiKesepakatan` (opsional, bulan): paket promo 2/4/x bulan —
 * durasi & tanggal selesai siswa ikut disesuaikan (0/kosong = durasi
 * tidak diubah). Tanggal selesai TIDAK PERNAH dikarang: tanpa tanggal
 * mulai yang sah, hanya durasiBulan disimpan + peringatan jujur.
 */
export function bangunPenyesuaianTagihan({ student = {}, tagihan = null, kesepakatan, alasan = '', rincian = '', durasiKesepakatan = 0 } = {}) {
  const totalKatalog = Number(tagihan?.totalKatalog || student.totalKatalog || student.totalTagihan || 0);
  const setuju = Math.max(0, Number(kesepakatan) || 0);
  const totalBayar = Math.min(setuju, Number(student.totalBayar || 0));
  const sisa = Math.max(0, setuju - totalBayar);
  const durasi = rencanaDurasiKesepakatan({ tanggalMulai: student.tanggalMulai, durasiKesepakatan });
  const siswa = {
    totalTagihan: setuju,
    totalKatalog,
    catatanPenawaran: String(alasan || '').trim(),
  };
  if (durasi) {
    siswa.durasiBulan = durasi.durasiBulan;
    if (durasi.tanggalSelesai) siswa.tanggalSelesai = durasi.tanggalSelesai;
  }
  return {
    siswa,
    tagihan: tagihan ? {
      totalTagihan: setuju,
      totalKatalog,
      sisaTagihan: sisa,
      selisihPenawaran: hitungSelisihPenawaran(totalKatalog, setuju),
      catatanPenawaran: String(alasan || '').trim(),
      ...(String(rincian || '').trim() ? { rincianPenawaran: String(rincian).trim() } : {}),
      detailCicilan: hitungUlangCicilan(tagihan.detailCicilan, sisa),
    } : null,
    sisa,
    totalKatalog,
    selisih: hitungSelisihPenawaran(totalKatalog, setuju),
    // null = durasi tidak disentuh (perilaku lama); selain itu rencana
    // durasi { durasiBulan, tanggalSelesai, peringatan } buat UI & log.
    durasi,
  };
}

export default { hitungUlangCicilan, hitungSelisihPenawaran, bangunPenyesuaianTagihan };
