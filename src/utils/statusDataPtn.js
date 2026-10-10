// src/utils/statusDataPtn.js
// ============================================================
// Status kepercayaan data PTN & program studi — SATU-SATUNYA sumber
// kebenaran untuk label "angka ini boleh dipercaya sampai mana".
//
// 🔥 KENAPA BERKAS INI ADA
// Blueprint Gemilang (2026-10-10) §3B dan §3C menuntut hal yang tidak
// dilakukan hampir semua aplikasi sejenis:
//
//   - "Data yang belum lengkap harus ditandai sebagai belum tersedia,
//      BUKAN diisi dengan perkiraan yang seolah-olah resmi."
//   - "Target skor pribadi tidak boleh diberi label sebagai passing grade
//      resmi. Hasil tahun sebelumnya atau estimasi dari pihak lain harus
//      diberi label sesuai sumber dan tahun datanya."
//   - "Skor tryout internal Gemilang juga tidak boleh dianggap otomatis
//      setara dengan skor UTBK resmi."
//
// Dan ini bukan sekadar kehati-hatian internal. Panitia SNPMB sudah menegaskan
// TIDAK ADA passing grade resmi yang diumumkan per prodi — yang dirilis
// resmi adalah daya tampung dan jumlah peminat. Jadi setiap angka
// "Skor_UTBK_Minimum" di berkas sumber mana pun PASTI merupakan estimasi
// atau kompilasi pihak ketiga, dan wajib menyandang label itu sampai ada
// sumber resminya.
//
// Konsekuensinya di kode: angka tidak pernah disimpan polos. Ia selalu
// dibungkus { nilai, sumber, diambilPada, resmi, statusData } dan UI wajib
// menampilkan pembungkusnya, bukan cuma nilainya.
// ============================================================

/** Status kepercayaan sebuah datum. Urutan dari paling lemah ke paling kuat. */
export const STATUS_DATA = {
  /** Angka ada di berkas sumber, tapi tidak ada sumber/tanggal yang menyertainya. */
  BELUM_VERIFIKASI: 'belum_verifikasi',
  /** Sudah dicek silang ke tautan resmi, oleh manusia, pada tanggal tertentu. */
  TERVERIFIKASI: 'terverifikasi',
  /** Pernah diverifikasi, tapi tahun seleksinya sudah lewat / datanya basi. */
  KEDALUWARSA: 'kedaluwarsa',
  /** Ada tanda bahwa data perlu diperbarui (mis. tahun seleksi baru dibuka). */
  PERLU_DIPERBARUI: 'perlu_diperbarui',
  /** Tidak ada datanya sama sekali. TAMPILKAN "belum tersedia", JANGAN 0. */
  BELUM_TERSEDIA: 'belum_tersedia',
};

export const LABEL_STATUS = {
  belum_verifikasi: 'Belum diverifikasi — estimasi, bukan angka resmi',
  terverifikasi: 'Terverifikasi terhadap sumber resmi',
  kedaluwarsa: 'Kedaluwarsa — data tahun seleksi sebelumnya',
  perlu_diperbarui: 'Perlu diperbarui',
  belum_tersedia: 'Belum tersedia',
};

/**
 * Apakah sebuah datum cukup kuat untuk ditampilkan sebagai ANGKA.
 * Yang belum verifikasi TETAP boleh ditampilkan (kalau disembunyikan,
 * database jadi kosong dan tidak berguna) — tapi wajib membawa labelnya.
 * Yang tidak pernah boleh adalah menampilkannya TANPA label.
 */
export function bolehTampilTanpaPeringatan(status) {
  return status === STATUS_DATA.TERVERIFIKASI;
}

/**
 * Bungkus sebuah nilai numerik beserta pelacakan sumbernya.
 *
 * @param {number|null} nilai null/NaN -> status jadi BELUM_TERSEDIA
 * @param {object} o
 * @param {string} o.sumber        nama berkas/portal asal angka ini
 * @param {string|null} o.sumberUrl tautan yang bisa diklik untuk mengecek
 * @param {string|null} o.diambilPada tanggal angka ini diambil (ISO 'YYYY-MM-DD')
 * @param {boolean} o.resmi         true HANYA bila berasal dari portal resmi
 * @param {number|null} o.tahunSeleksi
 * @returns {object} bentuk yang disimpan ke Firestore
 */
export function bungkusAngka(nilai, o = {}) {
  const n = Number(nilai);
  const sah = nilai !== null && nilai !== undefined && nilai !== '' && Number.isFinite(n);
  if (!sah) {
    return {
      nilai: null,
      statusData: STATUS_DATA.BELUM_TERSEDIA,
      resmi: false,
      sumber: o.sumber || null,
      sumberUrl: o.sumberUrl || null,
      diambilPada: o.diambilPada || null,
      tahunSeleksi: o.tahunSeleksi ?? null,
    };
  }
  return {
    nilai: n,
    // Tanpa sumberUrl + tanggal, tidak ada dasar untuk mengklaim 'terverifikasi'.
    // Ini yang membuat berkas Excel tanpa kolom sumber otomatis mendarat di
    // 'belum_verifikasi' dan tidak bisa menyamar jadi data resmi.
    statusData: o.resmi && o.sumberUrl && o.diambilPada
      ? STATUS_DATA.TERVERIFIKASI
      : STATUS_DATA.BELUM_VERIFIKASI,
    resmi: o.resmi === true,
    sumber: o.sumber || null,
    sumberUrl: o.sumberUrl || null,
    diambilPada: o.diambilPada || null,
    tahunSeleksi: o.tahunSeleksi ?? null,
  };
}

/**
 * Teks yang WAJIB muncul di samping angka apa pun dari database ini.
 * Dipisah ke sini supaya tidak ada halaman yang menulis versinya sendiri
 * lalu tanpa sadar melunakkan bunyinya.
 */
export function sanggahanSkor() {
  return 'Angka skor di sini adalah ESTIMASI/kompilasi, bukan passing grade resmi. '
    + 'Panitia SNPMB tidak mengumumkan nilai minimum kelulusan per program studi. '
    + 'Yang resmi dipublikasikan adalah daya tampung dan jumlah peminat. '
    + 'Skor try out internal Gemilang juga TIDAK otomatis setara dengan skor UTBK.';
}

export function labelUntukTampilan(bungkus) {
  if (!bungkus || bungkus.nilai === null || bungkus.nilai === undefined) {
    return { teks: 'Belum tersedia', peringatan: true };
  }
  return {
    teks: String(bungkus.nilai),
    peringatan: !bolehTampilTanpaPeringatan(bungkus.statusData),
    keterangan: LABEL_STATUS[bungkus.statusData] || bungkus.statusData,
  };
}

/**
 * Bungkus skor hasil EDIT ADMIN di halaman target.
 *
 * Bedanya dari bungkusAngka() saat impor: di sini admin bisa mengisi sumber
 * resmi + tanggal pengecekan, sehingga statusnya BOLEH naik jadi
 * 'terverifikasi'. Naik hanya bila ketiganya ada (resmi + sumberUrl +
 * diambilPada) -- setengah verifikasi tetap 'belum_verifikasi', karena
 * "saya yakin angka ini benar" bukan sumber.
 */
export function bungkusSkorHasilEdit({ nilai, sumberUrl = null, diambilPada = null, tahunSeleksi = null, resmi = false }) {
  const n = Number(nilai);
  const sah = nilai !== null && nilai !== undefined && nilai !== '' && Number.isFinite(n);
  const lengkap = resmi === true && !!sumberUrl && !!diambilPada;
  return {
    nilai: sah ? n : null,
    statusData: !sah
      ? STATUS_DATA.BELUM_TERSEDIA
      : (lengkap ? STATUS_DATA.TERVERIFIKASI : STATUS_DATA.BELUM_VERIFIKASI),
    resmi: resmi === true,
    sumber: 'edit admin',
    sumberUrl: sumberUrl || null,
    diambilPada: diambilPada || null,
    tahunSeleksi: tahunSeleksi ?? null,
  };
}

/**
 * Periksa isian form edit prodi sebelum ditulis.
 * @returns {string[]} daftar masalah; kosong berarti sah
 */
export function validasiEditProdi({ skorMinimum = null, skorRataRata = null, skorMaksimum = null, sumberUrl = null, diambilPada = null, tahunSeleksi = null } = {}) {
  const masalah = [];
  const angkaSkor = [skorMinimum, skorRataRata, skorMaksimum];
  for (const [i, v] of angkaSkor.entries()) {
    if (v === null || v === undefined || v === '') continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 1000) {
      masalah.push(`skor ke-${i + 1} "${v}" di luar rentang wajar 0-1000`);
    }
  }
  const [mn, rt, mx] = angkaSkor.map((v) => (v === null || v === undefined || v === '' ? null : Number(v)));
  if (mn !== null && rt !== null && mx !== null && !(mn <= rt && rt <= mx)) {
    masalah.push('urutan skor harus minimum <= rata-rata <= maksimum');
  }
  if (sumberUrl && !/^https?:\/\//.test(String(sumberUrl))) {
    masalah.push('sumberUrl harus diawali http:// atau https://');
  }
  if (diambilPada && !/^\d{4}-\d{2}-\d{2}$/.test(String(diambilPada))) {
    masalah.push('diambilPada harus berformat YYYY-MM-DD');
  }
  if (tahunSeleksi !== null && tahunSeleksi !== undefined && tahunSeleksi !== '') {
    const t = Number(tahunSeleksi);
    if (!Number.isInteger(t) || t < 2020 || t > 2040) masalah.push('tahunSeleksi tidak wajar');
  }
  return masalah;
}

export default {
  STATUS_DATA, LABEL_STATUS, bolehTampilTanpaPeringatan,
  bungkusAngka, sanggahanSkor, labelUntukTampilan,
  bungkusSkorHasilEdit, validasiEditProdi,
};
