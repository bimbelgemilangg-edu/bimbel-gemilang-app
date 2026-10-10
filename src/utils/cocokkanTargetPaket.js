// src/utils/cocokkanTargetPaket.js
// ============================================================
// "Bolehkah paket/modul ini dilihat oleh siswa ini?" -- SATU-SATUNYA
// sumber kebenaran untuk mencocokkan targetKelas & targetKategori.
//
// 🔥 KENAPA BERKAS INI ADA (audit 2026-10-10)
// Field yang SAMA ditulis dalam DUA BENTUK BERBEDA oleh dua penulis:
//
//   mesinTryOutOtomatis.js:354   targetKelas: ['Semua']     <-- ARRAY
//   rakitTryOutTentor.js:236     targetKelas: 'SMA'         <-- STRING
//   TerbitkanTryOutPage.jsx      targetKelas: 'Semua'       <-- STRING
//
// sementara pembacanya membandingkan dengan === terhadap string:
//
//   DaftarTryOutPage.jsx  p.targetKelas === 'Semua' || p.targetKelas === siswa.kelasSekolah
//   StudentElearning.jsx  targetKelas === 'Semua' || targetKelas === kelas
//   StudentModuleView.jsx targetKelas === 'Semua' || targetKelas === kelas
//   ModulManager.jsx      targetKelas === filterKelas || targetKelas === "Semua"
//
// ['Semua'] === 'Semua' bernilai FALSE. Artinya paket yang dibuat lewat
// Jadwal Try Out Otomatis berisiko TIDAK PERNAH terlihat oleh siswa mana
// pun, tanpa error dan tanpa jejak -- persis "kelas D: identitas tidak
// seragam" yang sudah dipetakan docs/PETA-SINKRONISASI-ADMIN-SISWA.md.
//
// Polanya mengikuti preseden repo ini sendiri: aksesKontenSiswa.js,
// statusTryOutPaket.js, dan skorSoalTryOut.js semuanya memusatkan satu
// aturan yang sebelumnya tersebar, supaya satu halaman yang lupa tidak
// bisa membuat perilaku berbeda diam-diam.
//
// ⚠️ ATURAN KOMPATIBILITAS (janji #1 SOP-KESELAMATAN-PERUBAHAN):
// target yang KOSONG dianggap "Semua", BUKAN ditolak. Alasannya berbeda
// dari aksesKontenSiswa.js (yang menolak jenjang kosong): di sana yang
// dijaga adalah soal yang nyasar ke jenjang lain, sedangkan di sini yang
// dijaga adalah paket warisan yang dibuat SEBELUM field target ada.
// Menolak yang kosong akan menghilangkan paket lama dari daftar siswa --
// regresi yang terlihat seperti "try out-nya hilang".
// ============================================================

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * Ubah nilai target (string | array | null) menjadi daftar string ternormalkan.
 * Diekspor supaya halaman admin bisa memakainya untuk normalisasi saat simpan.
 *
 * @param {string|string[]|null|undefined} nilai
 * @returns {string[]} contoh: ['semua'], ['12', '11'], []
 */
export function daftarTarget(nilai) {
  if (Array.isArray(nilai)) {
    return nilai.map(norm).filter(Boolean);
  }
  // String boleh berisi beberapa kelas dipisah koma ("12, 11") -- bentuk ini
  // tidak dipakai penulis mana pun hari ini, tapi murah untuk didukung dan
  // mencegah orang "memperbaiki" array jadi string berkoma lalu memecah pembaca.
  const t = norm(nilai);
  if (!t) return [];
  return t.split(',').map((x) => x.trim()).filter(Boolean);
}

/** true bila nilai target memuat 'semua' (atau memang kosong = untuk semua). */
export function targetUntukSemua(nilai) {
  const d = daftarTarget(nilai);
  return d.length === 0 || d.includes('semua');
}

/**
 * Cocokkan SATU field target terhadap SATU nilai milik siswa.
 *
 * @param {string|string[]|null} nilaiTarget dari paket/modul
 * @param {string|null} nilaiSiswa           mis. siswa.kelasSekolah
 * @returns {boolean}
 */
export function cocokkanTarget(nilaiTarget, nilaiSiswa) {
  if (targetUntukSemua(nilaiTarget)) return true;
  const punya = norm(nilaiSiswa);
  if (!punya) return false; // targetnya spesifik tapi data siswa kosong -> tolak
  return daftarTarget(nilaiTarget).includes(punya);
}

/**
 * Gabungan kelas + kategori, keduanya harus lolos.
 * Dipakai halaman siswa; halaman admin yang cuma menyaring satu dimensi
 * boleh memanggil cocokkanTarget() langsung.
 *
 * @param {{targetKelas?: any, targetKategori?: any}} paket
 * @param {{kelasSekolah?: string, kategori?: string}} siswa
 * @returns {{cocok: boolean, alasan: string}} alasan kosong bila cocok --
 *   mengikuti bentuk auditKecocokanSoal() di aksesKontenSiswa.js supaya
 *   halaman bisa menjelaskan KENAPA, bukan cuma true/false polos.
 */
export function cocokkanTargetPaket(paket, siswa) {
  if (!cocokkanTarget(paket?.targetKelas, siswa?.kelasSekolah)) {
    return {
      cocok: false,
      alasan: `Target kelas paket ("${paket?.targetKelas ?? '(kosong)'}") tidak mencakup kelas siswa ("${siswa?.kelasSekolah || '(kosong)'}")`,
    };
  }
  if (!cocokkanTarget(paket?.targetKategori, siswa?.kategori)) {
    return {
      cocok: false,
      alasan: `Target kategori paket ("${paket?.targetKategori ?? '(kosong)'}") tidak mencakup program siswa ("${siswa?.kategori || '(kosong)'}")`,
    };
  }
  return { cocok: true, alasan: '' };
}

/**
 * Bentuk kanonik untuk DITULIS ke Firestore: string tunggal, atau array
 * hanya bila memang lebih dari satu. Memakai ini di semua penulis membuat
 * dokumen baru konsisten, sementara pembaca di atas tetap toleran terhadap
 * dokumen lama yang sudah terlanjur berbentuk array.
 *
 * @param {string|string[]|null} nilai
 * @returns {string|string[]} 'Semua' bila kosong
 */
export function bentukKanonikTarget(nilai) {
  const d = daftarTarget(nilai);
  if (d.length === 0 || d.includes('semua')) return 'Semua';
  if (d.length === 1) {
    // Kembalikan kapitalisasi asli bila ada (mis. '12 SMP'), karena nilai ini
    // ikut tercetak di kop naskah (naskahSoal.js) dan di kartu daftar.
    const asli = Array.isArray(nilai) ? nilai[0] : nilai;
    return String(asli).trim();
  }
  return Array.isArray(nilai) ? nilai.map((x) => String(x).trim()).filter(Boolean) : d;
}

export default {
  daftarTarget,
  targetUntukSemua,
  cocokkanTarget,
  cocokkanTargetPaket,
  bentukKanonikTarget,
};
