// src/utils/identitasJadwal.js
// ============================================================
// SATU aturan "jadwal ini punya guru siapa?" — dipakai dasbor guru, halaman
// absensi guru, dan halaman mana pun yang menampilkan jadwal milik guru.
//
// KENAPA BERKAS INI ADA (register bug B-13, 3 Nov 2026):
//   Dokumen `jadwal_bimbel` menyimpan DUA penanda pengajar sekaligus:
//     • `teacherId`   = `guruId || docId` (ditulis SchedulePage:435)
//     • `teacherName` = `teacher.nama`    (SchedulePage:436), dan untuk data
//                       warisan bisa berupa `booker` (SchedulePage:481) dengan
//                       `teacherId` kosong.
//   Dasbor guru dulu mencari HANYA dengan `teacherName` (persis, hasil trim),
//   sementara halaman absensi mencari HANYA dengan `teacherId` lalu fallback
//   nama. Akibatnya satu spasi berbeda / typo / nama yang pernah diperbaiki
//   admin membuat kelas MUNCUL di satu halaman dan HILANG di halaman lain.
//
// ATURAN PENCOCOKAN (urutan menang, sengaja tidak setara):
//   1. Bila dokumen punya `teacherId` TIDAK KOSONG → hanya ID yang dipercaya.
//      Nama di dokumen itu DIABAIKAN, supaya dua guru bernama sama tidak
//      saling melihat kelas (lubang yang diperingatkan identitasGuru.js).
//   2. Bila `teacherId` kosong (data warisan / jalur `booker`) → nama dipakai,
//      dinormalkan (huruf kecil + spasi dirapikan) agar beda spasi/kapitalisasi
//      tidak lagi memecah tampilan.
//
// KENAPA PENCOCOKAN DI KLIEN, BUKAN KUERI GANDA:
//   Pencocokan dua kunci lewat kueri berarti dua putaran jaringan beruntun
//   (kueri ID → kalau kosong → kueri nama) = loading terasa "nyasar"/lama dan
//   menggandakan bacaan. Sebagai gantinya jadwal ditarik SATU kali dengan
//   jendela tanggal (lihat rentangTanggalJadwal) lalu disaring di sini — nol
//   biaya baca tambahan, nol indeks komposit, dan data warisan ikut tertangkap.
//
// CAKUPAN BERKAS INI: identitas + jendela tanggal SAJA. Pengelompokan per layar
// (hari ini / agenda / riwayat) dan penghitungan angka kartu ada di
// `statistikGuru.js` supaya tidak ada dua sumber kebenaran.
// ============================================================
import { daftarIdGuru } from './identitasGuru.js';
import { geserHariLokal } from './waktuLokal.js';

/** Normalkan teks untuk perbandingan longgar: huruf kecil + spasi dirapikan. */
export function normTeks(x) {
  return String(x ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Normalkan identitas (ID TIDAK dilonggarkan kapitalisasinya, hanya spasi). */
export function normId(x) {
  return String(x ?? '').trim();
}

/**
 * Identitas pencari jadwal untuk satu objek guru.
 * @returns {{ids: string[], nama: string, namaNorm: string}}
 */
export function identitasPencariJadwal(guru) {
  const g = guru && typeof guru === 'object' ? guru : {};
  const nama = String(g.nama || g.teacherName || '').trim();
  return {
    ids: daftarIdGuru(g).map(normId).filter(Boolean),
    nama,
    namaNorm: normTeks(nama),
  };
}

/**
 * Apakah dokumen jadwal ini milik guru pemilik `identitas`?
 * Menerima jadwal hasil Firestore (fields apa adanya) maupun objek polos.
 */
export function jadwalMilikGuru(jadwal, identitas) {
  if (!jadwal || typeof jadwal !== 'object' || !identitas) return false;
  const idDok = normId(jadwal.teacherId);
  if (idDok) {
    // Ada ID → ID yang menang (aturan 1). Nama sengaja tidak ikut dicocokkan.
    return (identitas.ids || []).includes(idDok);
  }
  // Warisan tanpa ID → nama (aturan 2), longgar soal spasi/kapitalisasi.
  const nama = identitas.namaNorm;
  if (!nama) return false;
  return normTeks(jadwal.teacherName) === nama || normTeks(jadwal.booker) === nama;
}

/**
 * Ubah `YYYY-MM-DD` menjadi Date ber-zona LOKAL perangkat.
 * `new Date('2026-11-03')` di JavaScript berarti tengah malam UTC, yang di zona
 * negatif (mis. Amerika) jatuh ke tanggal 2 — persis kelas bug yang diperbaiki
 * v1.6.3/v1.6.4. Maka string tanggal bisnis selalu diurai per komponen.
 */
function keTanggalLokal(str, cadangan) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str ?? '').trim());
  if (!m) return cadangan instanceof Date && !Number.isNaN(cadangan.getTime()) ? cadangan : new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Jendela tanggal bisnis yang boleh ditarik halaman guru.
 *
 * KENAPA JENDELA, BUKAN SELURUH RIWAYAT (register bug B-14):
 *   Dasbor dulu menarik SEMUA `jadwal_bimbel` milik satu guru tanpa batas
 *   tanggal — biaya bacanya naik selamanya seiring umur bimbel, padahal yang
 *   dipakai layar hanya: 7 hari ke belakang (statistik), hari ini (daftar +
 *   tombol Mulai Kelas), dan 7 hari ke depan (agenda). Jendela membuat biaya
 *   bacanya DATAR: tidak peduli sudah 3 tahun berjalan, yang ditarik tetap
 *   ±15 hari.
 *
 * Tanggal dihitung LOKAL (bukan UTC) lewat waktuLokal.js — lihat B-12/v1.6.3.
 *
 * @returns {{dari: string, sampai: string, hariIni: string}}
 */
export function rentangTanggalJadwal({ hariIniStr = '', mundurHari = 7, majuHari = 7, sekarang = new Date() } = {}) {
  const acuan = keTanggalLokal(hariIniStr, sekarang);
  const hariIni = hariIniStr && /^\d{4}-\d{2}-\d{2}$/.test(hariIniStr) ? hariIniStr : geserHariLokal(acuan, 0);
  return {
    hariIni,
    dari: geserHariLokal(acuan, -Math.abs(Number(mundurHari) || 0)),
    sampai: geserHariLokal(acuan, Math.abs(Number(majuHari) || 0)),
  };
}

export default {
  normTeks,
  normId,
  identitasPencariJadwal,
  jadwalMilikGuru,
  rentangTanggalJadwal,
};
