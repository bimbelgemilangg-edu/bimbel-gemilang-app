// src/utils/aksesJendelaTryOut.js
// ============================================================
// KEBIJAKAN AKSES JENDELA WAKTU TRY OUT -- satu sumber, murni, teruji.
//
// 🔥 KENAPA ADA (audit 2026-10-24, permintaan owner: "agar kedepannya tetap
// aman ujian apapun"). Sebelumnya keputusan jendela waktu ditulis INLINE di
// TryOutView.jsx tanpa uji, dan artinya tidak pernah dinyatakan:
//
//   1. SEMUA pemeriksaan memakai jam PERANGKAT siswa (`new Date()` di
//      browser). Jam dimundurkan 2 hari = bisa mulai sebelum waktu buka.
//   2. "Deadline" sebenarnya adalah BATAS MULAI: sesi yang sudah berjalan
//      tetap bisa selesai (jalur resume tidak memeriksa jendela). Itu
//      kebijakan yang WAJAR untuk ujian berdurasi, tapi tidak pernah
//      ditulis di UI admin maupun siswa, dan form terbit tidak memperingatkan
//      bila jendela lebih pendek dari durasi.
//
// Berkas ini memaku KEBIJAKANNYA sebagai fungsi murni supaya bisa diuji,
// plus dua alat pengeras:
//   - kalibrasi offset waktu dari header `Date` respons server sendiri
//     (Vercel edge), sehingga jam perangkat yang ngaco tidak lagi menjadi
//     penentu; GAGAL kalibrasi = offset 0 (perilaku lama), tidak pernah
//     menghalangi siswa ujian.
//   - perhitungan durasi rencana paket untuk peringatan di form terbit.
//
// BATAS JUJUR: kalibrasi header Date tetap penegakan sisi klien. Penegakan
// sisi server yang sesungguhnya adalah Firestore Rules yang membandingkan
// `request.time` dengan waktuBuka/waktuTutup paket (rules mendukung get());
// itu tertunda bersama keputusan risk-acceptance rules terbuka owner
// (docs/KEPUTUSAN-RISIKO-FIRESTORE.md) dan DICATAT di docs audit.
//
// Uji: tests/aksesJendelaTryOut.test.mjs
// ============================================================

/**
 * Keputusan akses jendela waktu.
 *
 * KEBIJAKAN (dipaku di sini):
 *  - sesi BERJALAN selalu boleh lanjut walau jendela sudah tertutup --
 *    deadline adalah BATAS MULAI, bukan batas selesai;
 *  - tanpa sesi: lewat deadline butuh `izinBerlaku` (izin ulang khusus admin);
 *  - tanpa sesi: sebelum waktu buka = belum dibuka, tanpa pengecualian;
 *  - waktuBuka/waktuTutup null = tidak membatasi sisi itu.
 *
 * @param {object} a
 * @param {boolean} a.adaSesiBerjalan
 * @param {number} a.sekarangMs   waktu kini (sebaiknya sudah dikalibrasi)
 * @param {number|null} [a.waktuBukaMs]
 * @param {number|null} [a.waktuTutupMs]
 * @param {boolean} [a.izinBerlaku]
 * @returns {{aksi: 'lanjut'|'mulai'|'belum-dibuka'|'lewat-deadline', alasan: string}}
 */
export function putuskanAksesJendela({
  adaSesiBerjalan = false,
  sekarangMs,
  waktuBukaMs = null,
  waktuTutupMs = null,
  izinBerlaku = false,
}) {
  const kini = Number(sekarangMs);
  if (adaSesiBerjalan) {
    return {
      aksi: 'lanjut',
      alasan: 'sesi sudah berjalan: deadline adalah batas MULAI, sesi berjalan tetap boleh selesai',
    };
  }
  if (waktuTutupMs !== null && waktuTutupMs !== undefined && kini > waktuTutupMs) {
    if (izinBerlaku) {
      return { aksi: 'mulai', alasan: 'lewat deadline tapi ada izin ulang khusus yang masih berlaku' };
    }
    return { aksi: 'lewat-deadline', alasan: 'melewati waktu tutup dan tidak ada izin ulang yang berlaku' };
  }
  if (waktuBukaMs !== null && waktuBukaMs !== undefined && kini < waktuBukaMs) {
    return { aksi: 'belum-dibuka', alasan: 'sebelum waktu buka; tidak ada pengecualian untuk mulai lebih awal' };
  }
  return { aksi: 'mulai', alasan: 'di dalam jendela waktu' };
}

/**
 * Offset (ms) yang harus DITAMBAHKAN ke jam perangkat agar mendekati waktu
 * server, dari header `Date` respons HTTP. Header rusak/absen -> 0
 * (perilaku lama), supaya kalibrasi tidak pernah menghalangi ujian.
 *
 * @param {string|null} dateHeader  nilai header Date, mis. "Thu, 24 Oct 2026 05:00:00 GMT"
 * @param {number} clientMs         Date.now() sesaat setelah respons diterima
 * @returns {number}
 */
export function kalibrasiOffsetWaktuServer(dateHeader, clientMs) {
  const t = Date.parse(String(dateHeader ?? ''));
  if (!Number.isFinite(t)) return 0;
  const klien = Number(clientMs);
  if (!Number.isFinite(klien)) return 0;
  return t - klien;
}

/**
 * Durasi rencana pengerjaan paket dalam ms (yang dijanjikan timer):
 * mode 'total' memakai durasiTotalMenit; mode 'per-subtes' menjumlahkan
 * durasi seluruh subtes. Null bila tidak terbaca.
 * @param {object} paket
 * @returns {number|null}
 */
export function durasiRencanaMs(paket) {
  if (!paket || typeof paket !== 'object') return null;
  if (paket.modeTimer === 'per-subtes') {
    const subtes = Array.isArray(paket.subtes) ? paket.subtes : [];
    if (!subtes.length) return null;
    const menit = subtes.reduce((a, s) => a + (Number(s?.durasiMenit) || 0), 0);
    return menit > 0 ? menit * 60000 : null;
  }
  const menit = Number(paket.durasiTotalMenit);
  return Number.isFinite(menit) && menit > 0 ? menit * 60000 : null;
}

/**
 * Peringatan bila jendela jadwal lebih pendek dari durasi rencana:
 * siswa yang mulai di ujung jendela tetap mendapat durasi penuh, jadi
 * pengumpulan bisa terjadi SETELAH deadline. Mengembalikan string peringatan
 * atau null bila aman/tidak berlaku.
 */
export function peringatanJendelaVsDurasi({ waktuBukaMs, waktuTutupMs, durasiMs }) {
  if (waktuBukaMs == null || waktuTutupMs == null || durasiMs == null) return null;
  const jendela = waktuTutupMs - waktuBukaMs;
  if (jendela <= 0) return 'Waktu tutup sama atau mendahului waktu buka.';
  if (jendela < durasiMs) {
    const menitJendela = Math.round(jendela / 60000);
    const menitDurasi = Math.round(durasiMs / 60000);
    return (
      `Jendela jadwal (${menitJendela} menit) LEBIH PENDEK dari durasi ujian (${menitDurasi} menit). `
      + 'Deadline adalah BATAS MULAI: siswa yang mulai di ujung jendela tetap mendapat durasi penuh, '
      + 'sehingga pengumpulan mereka bisa terjadi setelah deadline. '
      + 'Perlebar jendela atau kurangi durasi bila maksud Anda menutup semua pengerjaan tepat di deadline.'
    );
  }
  return null;
}

export default {
  putuskanAksesJendela, kalibrasiOffsetWaktuServer, durasiRencanaMs, peringatanJendelaVsDurasi,
};
