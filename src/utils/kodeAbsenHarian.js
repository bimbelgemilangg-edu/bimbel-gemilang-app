// src/utils/kodeAbsenHarian.js
// ============================================================
// Kejujuran kode absensi harian (keputusan owner D2 = opsi c, 3 Nov 2026:
// "manual tetap, tapi dasbor jujur bilang kode belum dibuat admin + tombol
// Coba lagi").
//
// KENAPA BERKAS INI ADA (register bug B-06):
//   Dasbor guru dulu punya SATU pembanding:
//       inputToken.trim().toUpperCase() !== dailyCode.trim().toUpperCase()
//   dan `dailyCode` diisi `''` untuk TIGA keadaan yang sama sekali berbeda:
//     1. admin memang belum membuat kode hari itu (dokumen tidak ada),
//     2. dokumen ada tapi field `code` kosong,
//     3. pembacaan GAGAL (kuota 429 / jaringan) — `catch { setDailyCode('') }`.
//   Ketiganya berakhir di pesan yang sama: "Token absensi salah! Silakan
//   periksa kembali atau hubungi admin." → guru dituduh salah ketik selamanya,
//   kelas tidak bisa dibuka, dan tidak ada jalan keluar selain reload.
//   Ini persis pelanggaran `docs/POLICY-ERROR-DAN-KUOTA.md` aturan 1: kegagalan
//   baca tidak boleh menyamar menjadi "datanya salah".
//
// ATURAN BARU: "tidak tahu" tidak pernah boleh dilaporkan sebagai "salah".
//   Setiap keadaan punya status, pesan, dan tindakan sendiri. Kebijakan siapa
//   yang boleh membuka kelas TIDAK diubah (tetap butuh kode dari admin) — yang
//   diubah hanya kejujuran pesannya + adanya tombol coba lagi yang membaca SATU
//   dokumen (murah), bukan memuat ulang seluruh dasbor (mahal).
// ============================================================

/** Status keadaan kode absensi harian. */
export const STATUS_KODE = {
  SIAP: 'siap',
  BELUM_DIBUAT: 'belum-dibuat',
  KOSONG: 'kosong',
  GAGAL_BACA: 'gagal-baca',
  MEMUAT: 'memuat',
};

/** Normalkan kode: buang spasi, huruf besar (kode disimpan admin sudah upper). */
export function normKode(x) {
  return String(x ?? '').trim().toUpperCase();
}

/**
 * Tentukan status kode dari hasil pembacaan dokumen `settings/daily_code_*`.
 * @param {object} o
 * @param {boolean} [o.gagalMuat]   pembacaan melempar error (kuota/jaringan)
 * @param {boolean} [o.adaDokumen]  dokumen ditemukan
 * @param {string}  [o.kode]        isi field `code`
 * @param {boolean} [o.memuat]      masih menunggu hasil baca
 */
export function statusKodeHarian({ gagalMuat = false, adaDokumen = false, kode = '', memuat = false } = {}) {
  if (memuat) return STATUS_KODE.MEMUAT;
  if (gagalMuat) return STATUS_KODE.GAGAL_BACA;
  if (!adaDokumen) return STATUS_KODE.BELUM_DIBUAT;
  return normKode(kode) ? STATUS_KODE.SIAP : STATUS_KODE.KOSONG;
}

/**
 * Bahan tampilan untuk satu status: judul, penjelasan bahasa manusia, saran
 * tindakan, dan boleh/tidaknya tombol VERIFIKASI ditekan.
 * `nada` dipakai UI untuk memilih warna token (info/peringatan/bahaya).
 */
export function keteranganStatusKode(status) {
  switch (status) {
    case STATUS_KODE.SIAP:
      return {
        nada: 'info',
        judul: 'Kode absensi hari ini siap',
        pesan: 'Masukkan kode dari admin untuk membuka sesi kelas.',
        saran: '',
        bolehVerifikasi: true,
      };
    case STATUS_KODE.BELUM_DIBUAT:
      return {
        nada: 'peringatan',
        judul: 'Kode absensi hari ini belum dibuat admin',
        pesan:
          'Bukan salah Anda: dokumen kode untuk tanggal ini belum ada. '
          + 'Hubungi admin untuk membuatnya, lalu tekan "Coba lagi" — tidak perlu memuat ulang seluruh dasbor.',
        saran: 'Coba lagi',
        bolehVerifikasi: false,
      };
    case STATUS_KODE.KOSONG:
      return {
        nada: 'peringatan',
        judul: 'Kode absensi hari ini masih kosong',
        pesan: 'Admin sudah membuat dokumen kode tetapi isinya kosong. Minta admin mengisi kodenya, lalu tekan "Coba lagi".',
        saran: 'Coba lagi',
        bolehVerifikasi: false,
      };
    case STATUS_KODE.GAGAL_BACA:
      return {
        nada: 'bahaya',
        judul: 'Kode absensi gagal dibaca',
        pesan:
          'Aplikasi tidak berhasil membaca kode hari ini (kuota baca atau jaringan). '
          + 'Datanya kemungkinan besar ADA — tekan "Coba lagi" sebentar lagi.',
        saran: 'Coba lagi',
        bolehVerifikasi: false,
      };
    default:
      return {
        nada: 'info',
        judul: 'Memeriksa kode absensi…',
        pesan: 'Sedang membaca kode hari ini.',
        saran: '',
        bolehVerifikasi: false,
      };
  }
}

/**
 * Verifikasi kode yang diketik guru terhadap keadaan kode hari ini.
 * @returns {{lulus: boolean, pesan: string}}
 */
export function verifikasiKodeAbsen({ input = '', kode = '', status = STATUS_KODE.MEMUAT } = {}) {
  const masukan = normKode(input);
  if (!masukan) {
    return { lulus: false, pesan: 'Masukkan kode absensi terlebih dahulu.' };
  }
  if (status !== STATUS_KODE.SIAP) {
    // "Tidak tahu" ≠ "salah": kembalikan penjelasan keadaan, jangan menuduh guru.
    const ket = keteranganStatusKode(status);
    return { lulus: false, pesan: `${ket.judul}. ${ket.pesan}` };
  }
  if (masukan !== normKode(kode)) {
    return { lulus: false, pesan: 'Kode belum cocok. Periksa kembali kode hari ini dari admin.' };
  }
  return { lulus: true, pesan: '' };
}

export default { STATUS_KODE, normKode, statusKodeHarian, keteranganStatusKode, verifikasiKodeAbsen };
