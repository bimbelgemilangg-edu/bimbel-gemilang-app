// src/utils/jenjangBaku.js
// ============================================================
// SATU SUMBER KEBENARAN kosakata `jenjang` untuk bank soal.
// ============================================================
//
// MASALAH YANG DIBERESKAN
// Aplikasi ini menyimpan `jenjang` dalam DUA kosakata yang hidup
// berdampingan:
//
//   'SMA' / 'SMP' / 'SD' / 'SMK'        <- keluaran deteksiTaksonomiSoal
//                                          (Mesin Bank Soal, Impor HTML Gemini)
//   'SMA/MA' / 'SMP/MTs' / 'SD/MI' /... <- DAFTAR_JENJANG di ImportHasilScanPage
//                                          & AdvancedQuestionExtractor
//
// Sementara itu SEMUA penyaring hierarki membandingkan string PERSIS:
//   LemariSoalPage    : (s.jenjang || '(Belum diatur)') === jenjangAktif
//   CetakPaketLatihan : ((s.jenjang||'').trim() || BELUM) === jenjangAktif
//   PerpustakaanKonten: pohon jenjang -> mapel -> bab
//
// Akibatnya soal ber-jenjang 'SMA' TIDAK PERNAH muncul saat tentor
// memilih 'SMA/MA'. Ia tidak rusak, tidak error, tidak terlihat aneh di
// daftar admin -- ia hanya lenyap dari hierarki. Itu sebabnya kosakata
// ini dipatok di satu berkas: dua daftar di dua tempat adalah bug yang
// menunggu terjadi lagi.
//
// CATATAN COMPAT (SOP janji #1): `deteksiJenjangKelas` di
// mesinTaksonomiSoal.js SENGAJA tetap mengembalikan kosakata pendek
// ('SMA'), karena ia dipakai petaKonten.js (teruji) dan karena
// inferensi kelas di dalamnya membandingkan `jenjang === 'SMA'`.
// Kanonisasi dilakukan di TITIK TULIS (terapkanTaksonomi), bukan di
// deteksi -- sehingga tidak ada perilaku lama yang berubah.
// ============================================================

/** Kosakata baku — sama dengan DAFTAR_JENJANG di jalur impor scan. */
export const JENJANG_BAKU = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];

/** Urutan tampil di hierarki (Lemari Soal, Perpustakaan, Cetak Latihan). */
export const URUTAN_JENJANG = ['SD/MI', 'SMP/MTs', 'SMA/MA', 'SMK', 'UTBK/SNBT'];

function normKunci(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

// Kunci sudah dinormalkan: huruf kecil, tanpa spasi & tanda baca.
const PETA_JENJANG = {
  sd: 'SD/MI',
  mi: 'SD/MI',
  sdmi: 'SD/MI',
  smp: 'SMP/MTs',
  mts: 'SMP/MTs',
  smpmts: 'SMP/MTs',
  sma: 'SMA/MA',
  ma: 'SMA/MA',
  smama: 'SMA/MA',
  smk: 'SMK',
  smak: 'SMK',
  utbk: 'UTBK/SNBT',
  snbt: 'UTBK/SNBT',
  utbksnbt: 'UTBK/SNBT',
  sbmptn: 'UTBK/SNBT',
};

/**
 * Petakan nilai jenjang apa pun ke kosakata baku.
 * TIDAK PERNAH MENGARANG: nilai yang tidak dikenali dikembalikan dengan
 * `dikenal: false` dan `baku: ''` — lebih baik mengaku tidak tahu
 * daripada menulis tebakan ke dokumen yang dipakai siswa.
 *
 * @param {string} nilai
 * @returns {{asli:string, baku:string, dikenal:boolean, diubah:boolean}}
 */
export function jenjangBaku(nilai) {
  const asli = String(nilai ?? '').trim();
  if (!asli) return { asli: '', baku: '', dikenal: false, diubah: false };
  const baku = PETA_JENJANG[normKunci(asli)] || '';
  if (!baku) return { asli, baku: '', dikenal: false, diubah: false };
  return { asli, baku, dikenal: true, diubah: baku !== asli };
}

/** True bila nilai sudah persis sama dengan salah satu kosakata baku. */
export function sudahBaku(nilai) {
  return JENJANG_BAKU.includes(String(nilai ?? '').trim());
}

export default { JENJANG_BAKU, URUTAN_JENJANG, jenjangBaku, sudahBaku };
