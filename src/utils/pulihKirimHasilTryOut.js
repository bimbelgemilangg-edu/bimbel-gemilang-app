// src/utils/pulihKirimHasilTryOut.js
// ============================================================
// LOGIKA MURNI pemulihan kirim hasil try out (kejadian 2026-10-08:
// owner lapor banyak siswa melihat layar "Gagal Mengirim Hasil"
// SETELAH owner mereset sesi biar anak-anak bisa kerjain ulang).
//
// AKAR MASALAHNYA: tombol reset (services/resetSesiTryOut.js) memang
// SENGAJA menghapus dokumen tryout_sesi PERMANEN. Tapi layar siswa
// yang MASIH TERBUKA (gak di-refresh) tetap pegang id sesi lama dan
// memakai updateDoc() buat kirim hasil -- updateDoc ke dokumen yang
// sudah tidak ada itu GAGAL SELAMANYA, berapa kali pun dicoba. Jadi
// tombol "Coba Kirim Lagi" jadi putaran setan yang gak pernah menang.
//
// File ini berisi keputusan-keputusan murni (gak nyentuh Firestore)
// supaya perilaku pemulihannya bisa di-test otomatis:
//   1. kodeGagalKirim        -> bedakan "dokumen hilang" vs "jaringan putus",
//   2. putusanPemulihanKirim -> tahan jawaban & tawarkan mulai ulang / lanjut sesi baru,
//   3. pilihSesiUtama        -> kalau ada lebih dari satu dokumen sesi, pilih yang masuk akal,
//   4. peringatanSesiBerjalan-> kalimat jujur buat konfirmasi reset admin.
// ============================================================

/**
 * Klasifikasi error pengiriman hasil try out.
 *
 * KENAPA pakai e.code: FirebaseError dari Firestore selalu mengisi
 * `code` (mis. 'not-found', 'permission-denied', 'unavailable').
 * updateDoc() ke dokumen yang sudah dihapus menghasilkan 'not-found'
 * -- itu BUKAN masalah jaringan, jadi mencobanya ulang sia-sia dan
 * harus masuk jalur pemulihan (tahan jawaban), bukan layar "cek
 * koneksi internetmu".
 *
 * @param {object|Error} e error yang dilempar SDK Firestore
 * @returns {'not-found'|'lain'}
 */
export function kodeGagalKirim(e) {
  return e && e.code === 'not-found' ? 'not-found' : 'lain';
}

/**
 * Putuskan jalur pemulihan setelah kirim hasil gagal karena dokumen
 * sesi tidak ada lagi di server ('not-found').
 *
 * @param {object} o
 * @param {'not-found'|'lain'} o.kode hasil kodeGagalKirim
 * @param {boolean} o.adaSesiLainBerjalan true kalau siswa ini ternyata
 *   sudah punya dokumen sesi BARU yang masih 'berjalan' (mis. dia sudah
 *   mulai ulang dari tab/lainnya setelah reset).
 * @returns {'coba-lagi'|'tahan-mulai-lagi'|'tahan-lanjutkan-lain'}
 *   - 'coba-lagi': gagal biasa (jaringan dll) -- layar lama + tombol coba lagi.
 *   - 'tahan-mulai-lagi': jawaban ditahan aman, siswa ditawari muat ulang dari awal.
 *   - 'tahan-lanjutkan-lain': jawaban ditahan aman, siswa diarahkan lanjut sesi barunya.
 */
export function putusanPemulihanKirim({ kode, adaSesiLainBerjalan = false }) {
  if (kode !== 'not-found') return 'coba-lagi';
  return adaSesiLainBerjalan ? 'tahan-lanjutkan-lain' : 'tahan-mulai-lagi';
}

/**
 * Pilih dokumen sesi yang "utama" kalau query mengembalikan lebih
 * dari satu dokumen untuk siswa+paket yang sama.
 *
 * KENAPA diperlukan: kode lama selalu pakai docs[0] -- urutannya
 * tergantung id dokumen acak, bukan waktu. Kalau suatu saat ada dua
 * dokumen (mis. sesi lama yang selesai + sesi ulang yang masih
 * berjalan), docs[0] bisa menunjuk sesi LAMA dan siswa terkunci di
 * layar hasil padahal dia sedang mengerjakan ulang. Aturan di sini:
 * sesi 'berjalan' menang atas 'selesai'; sesama status, yang mulai
 * paling BARU yang menang.
 *
 * @param {Array<object>} daftarSesi array dokumen sesi ({id, status, waktuMulaiMs, createdAt, ...})
 * @returns {object|null}
 */
export function pilihSesiUtama(daftarSesi) {
  if (!Array.isArray(daftarSesi) || daftarSesi.length === 0) return null;
  const waktuMulai = (s) => {
    const ms = Number(s && s.waktuMulaiMs);
    if (Number.isFinite(ms) && ms > 0) return ms;
    const createdAt = s && s.createdAt;
    if (createdAt && typeof createdAt.toMillis === 'function') return createdAt.toMillis();
    return 0;
  };
  const berjalan = daftarSesi.filter((s) => s && s.status === 'berjalan');
  const selesai = daftarSesi.filter((s) => s && s.status === 'selesai');
  const kolam = berjalan.length > 0 ? berjalan : (selesai.length > 0 ? selesai : daftarSesi);
  return kolam.reduce((terbaik, s) => (waktuMulai(s) > waktuMulai(terbaik) ? s : terbaik), kolam[0]);
}

/**
 * Kalimat peringatan jujur untuk konfirmasi reset admin kalau masih
 * ada sesi berstatus 'berjalan' (anaknya kemungkinan masih di dalam
 * layar try out).
 *
 * KENAPA: sebelumnya konfirmasi reset cuma menyebut status tanpa
 * akibat, jadi owner kaget waktu anak-anak laporan lihat layar error.
 * Dengan kalimat ini owner TAHU sebelum klik: layar yang masih terbuka
 * akan ditawari mulai ulang, dan jawaban akhirnya ditahan (tidak masuk
 * hasil resmi) -- bukan error tanpa penjelasan.
 *
 * @param {number} jumlahBanyakBerjalan banyaknya sesi berstatus 'berjalan' yang akan direset
 * @returns {string} kalimat peringatan, atau '' kalau tidak ada sesi berjalan
 */
export function peringatanSesiBerjalan(jumlahBanyakBerjalan) {
  const n = Math.max(0, Number(jumlahBanyakBerjalan) || 0);
  if (n === 0) return '';
  const sebutan = n === 1 ? '1 anak' : `${n} anak`;
  return `PERHATIAN: ${sebutan} masih berstatus SEDANG MENGERJAKAN kalau layarnya masih terbuka. `
    + 'Setelah reset, layar lama mereka tidak akan bisa menyimpan lagi; sistem akan menawarkan '
    + 'mereka mulai ulang dari awal dan jawaban terakhir mereka DITAHAN AMAN (masuk panel '
    + '"Jawaban Tertahan" di halaman Hasil, tidak masuk ranking resmi).';
}
