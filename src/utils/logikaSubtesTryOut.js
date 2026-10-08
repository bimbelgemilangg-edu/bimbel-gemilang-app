// src/utils/logikaSubtesTryOut.js
// ============================================================
// LOGIKA NAVIGASI SUBTES TRY OUT -- dipindah KELUAR dari TryOutView.jsx
// biar bisa diuji otomatis pakai node (tests/logikaSubtesTryOut.test.mjs).
//
// KENAPA file ini ada (2026-10-08, keluhan owner: "siswa kerjain soal 4
// tiba-tiba selesai", "ada soal yang gak keluar"): waktu owner memakai
// mode timer "per soal individual" (tiap soal = 1 subtes berdurasi X
// menit), tombol hijau besar di layar siswa BERLABEL "Selesai Subtes
// Ini" tapi ISI-nya memanggil selesaikanTryOut() -- artinya SELURUH
// try out langsung dikumpulkan detik itu juga. Siswa yang cuma mau
// lanjut ke soal berikutnya malah finish di soal 4. Logika "tombol ini
// sebenernya harus ngapain" sekarang diputuskan SATU FUNGSI MURNI di
// sini, dipakai TryOutView.jsx, dan di-test supaya gak bisa regression
// diam-diam lagi.
//
// Semua fungsi di file ini MURNI: gak nyentuh Firestore, gak nyentuh
// React, input-output biasa -- jadi aman di-test di CI.
// ============================================================

/**
 * Putuskan aksi tombol hijau utama di layar pengerjaan try out.
 *
 * ATURAN (hasil bedah bug 2026-10-08):
 *  - Masih ada soal di bawah/subtes berjalan -> 'soal-berikutnya'.
 *  - Soal terakhir DI SUBTES INI tapi masih ada subtes berikutnya ->
 *    'subtes-berikutnya' (tutup subtes ini, buka subtes berikutnya --
 *    BUKAN mengakhiri try out!). Ini persis titik bug lamanya.
 *  - Soal terakhir di subtes TERAKHIR -> 'selesai' (kumpulkan semua).
 *
 * @param {object} o
 * @param {string} o.modeTimer 'total' | 'per-subtes'
 * @param {number} o.indexSoalAktif indeks soal yang sedang ditampilkan (0-based)
 * @param {number} o.jumlahSoalAktif jumlah soal yang boleh dikerjakan sekarang
 * @param {number} o.subtesAktifIndex indeks subtes berjalan (0-based)
 * @param {number} o.jumlahSubtes total subtes paket ini
 * @returns {{aksi: 'soal-berikutnya'|'subtes-berikutnya'|'selesai', label: string}}
 */
export function putusanTombolLanjut({
  modeTimer, indexSoalAktif, jumlahSoalAktif, subtesAktifIndex, jumlahSubtes,
}) {
  const idxSoal = Number(indexSoalAktif) || 0;
  const nSoal = Number(jumlahSoalAktif) || 0;
  const idxSubtes = Number(subtesAktifIndex) || 0;
  const nSubtes = Number(jumlahSubtes) || 0;

  if (idxSoal < nSoal - 1) return { aksi: 'soal-berikutnya', label: 'Selanjutnya' };
  if (modeTimer === 'per-subtes' && idxSubtes < nSubtes - 1) {
    return { aksi: 'subtes-berikutnya', label: 'Selesai Subtes Ini' };
  }
  return { aksi: 'selesai', label: 'Kumpulkan Try Out' };
}

/**
 * Putuskan aksi saat WAKTU subtes habis sendiri (bukan klik tombol).
 * Sama seperti tombol: kalau masih ada subtes berikutnya ya pindah,
 * kalau tidak ya try out dikumpulkan.
 * @returns {{aksi: 'subtes-berikutnya'|'selesai'}}
 */
export function putusanWaktuHabis({ subtesAktifIndex, jumlahSubtes }) {
  const idxSubtes = Number(subtesAktifIndex) || 0;
  const nSubtes = Number(jumlahSubtes) || 0;
  return idxSubtes < nSubtes - 1 ? { aksi: 'subtes-berikutnya' } : { aksi: 'selesai' };
}

/**
 * Amankan indeks subtes hasilresume sesi dari Firestore.
 *
 * KENAPA: indeks subtes disimpan di sesi siswa. Kalau komposisi subtes
 * berubah sesudahnya (mis. akses mapel siswa diedit admin sehingga
 * beberapa subtes tersaring habis), indeks lama bisa MENUNJUK KELUAR
 * ARRAY -- efek lamanya layar stuck di "Memuat soal..." selamanya
 * (salah satu keluhan "soalnya gak keluar"). Daripada stuck, indeks
 * DI-CLAMP ke rentang yang ada + ditandai `disesuaikan` supaya UI bisa
 * kasih tahu siswa/admin dengan jujur.
 *
 * @param {number} indexDisimpan nilai dari sesi (boleh undefined/null)
 * @param {number} jumlahSubtes jumlah subtes SETELAH filter
 * @returns {{index: number, disesuaikan: boolean}}
 */
export function indexSubtesAman(indexDisimpan, jumlahSubtes) {
  const jumlah = Math.max(0, Number(jumlahSubtes) || 0);
  const idx = Math.max(0, Number(indexDisimpan) || 0);
  if (jumlah === 0) return { index: 0, disesuaikan: idx !== 0 };
  const clamp = Math.min(idx, jumlah - 1);
  return { index: clamp, disesuaikan: clamp !== idx };
}

/**
 * Saring subtes supaya cuma memuat soal yang benar-benar tersedia buat
 * siswa ini (setelah filter akses mapel). Subtes yang jadi KOSONG
 * dibuang -- kalau tidak, siswa bakal melihat subtes tanpa soal sama
 * sekali ("soalnya gak keluar").
 *
 * @param {Array<object>} subtes [{ nama, durasiMenit, soalIds }]
 * @param {Set<string>|Array<string>} idsTersedia id soal yang lolos filter
 * @returns {Array<object>} subtes baru (tidak memutasi input)
 */
export function filterSubtesMenurutSoalTersedia(subtes, idsTersedia) {
  const set = typeof idsTersedia?.has === 'function' ? idsTersedia : new Set(idsTersedia || []);
  return (subtes || [])
    .map((sub) => ({ ...sub, soalIds: (sub.soalIds || []).filter((id) => set.has(id)) }))
    .filter((sub) => (sub.soalIds || []).length > 0);
}

/**
 * Tebak granularitas subtes sebuah paket terbit ('soal' atau 'mapel')
 * buat keperluan MODE EDIT di halaman Terbitkan Try Out -- supaya
 * radio "Per soal individual" / "Per mata pelajaran" ter-centang sesuai
 * kondisi paket aslinya, bukan menebak default.
 *
 * Ciri granularitas 'soal': SETIAP subtes berisi persis 1 soal dan
 * jumlah subtes == total soal paket.
 *
 * @returns {'soal'|'mapel'|null} null kalau paket bukan mode per-subtes
 */
export function deteksiGranularitasSubtes(paket) {
  if (!paket || paket.modeTimer !== 'per-subtes') return null;
  const subtes = Array.isArray(paket.subtes) ? paket.subtes : [];
  if (subtes.length === 0) return 'mapel';
  const semuaSatuSoal = subtes.every((s) => (s.soalIds || []).length === 1);
  const totalSoal = Number(paket.totalSoal) || subtes.length;
  return semuaSatuSoal && subtes.length === totalSoal ? 'soal' : 'mapel';
}

/**
 * Ubah string ISO (format simpanan waktuBuka/waktuTutup) jadi nilai
 * input `datetime-local` (YYYY-MM-DDTHH:mm) WAKTU LOKAL perangkat.
 * KENAPA: input datetime-local gak mau menerima string ISO berakhiran
 * Z -- kalau dipaksa, kolom jadwal tampak KOSONG saat mode edit padahal
 * paketnya punya jadwal. Balik '' kalau inputnya gak valid supaya UI
 * gak menampilkan tanggal bohong.
 *
 * @param {string|null|undefined} iso
 * @returns {string}
 */
export function isoKeDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
