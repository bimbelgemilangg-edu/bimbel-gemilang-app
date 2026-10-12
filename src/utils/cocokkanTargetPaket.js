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
// 🔥 BARU (2026-10-12, insiden "try out tentor tidak muncul di siswa"):
// pencocokan kelas dulu membandingkan STRING PERSIS, sehingga target
// "9 SMP" / "SMP 9" / "kelas 9" tidak pernah sama dengan "9" milik siswa --
// paket TERBIT tetapi tak cocok ke siapa pun, dan penolakannya SENYAP.
// Kini kelas dibandingkan secara toleran: angka kelas + jenjang bila disebut.
function angkaKelas(v) {
  const m = /(\d{1,2})/.exec(String(v ?? ''));
  return m ? Number(m[1]) : null;
}
function jenjangKelas(v) {
  const t = norm(v);
  if (/(\b|[^a-z])smk([^a-z]|$)/.test(t)) return 'smk';
  if (t.includes('smp') || t.includes('mts')) return 'smp';
  if (t.includes('sma') || /(^|[^a-z])ma([^a-z]|$)/.test(t)) return 'sma';
  if (t.includes(' sd') || t.startsWith('sd') || t.includes('mi')) return 'sd';
  return null;
}
function cocokKelasToleran(nilaiTarget, siswa) {
  if (targetUntukSemua(nilaiTarget)) return true;
  const kelasSiswa = angkaKelas(siswa?.kelasSekolah);
  // jenjang dibaca dari teks; bila siswa hanya menyimpan angka kelas,
  // jenjang disimpulkan dari rentang umum (1-6 SD, 7-9 SMP, 10-12 SMA/SMK).
  const jenjangDariAngka = (n) => (n == null ? null : n <= 6 ? 'sd' : n <= 9 ? 'smp' : 'sma');
  const jenjangSiswa = jenjangKelas(siswa?.kelasSekolah) || jenjangKelas(siswa?.jenjang) || jenjangDariAngka(kelasSiswa);
  if (kelasSiswa == null && !jenjangSiswa) return false;
  return daftarTarget(nilaiTarget).some((t) => {
    if (t === norm(siswa?.kelasSekolah)) return true;
    const a = angkaKelas(t);
    const j = jenjangKelas(t);
    const angkaCocok = a == null || a === kelasSiswa;
    const jenjangCocok = j == null || j === jenjangSiswa || (jenjangSiswa === 'sma' && j === 'smk') || (jenjangSiswa === 'smk' && j === 'sma');
    return (a != null && angkaCocok && jenjangCocok) || (a == null && j != null && jenjangCocok);
  });
}

/** Berapa banyak siswa yang cocok dengan paket ini (0 = paket tak terlihat oleh siapa pun). */
export function hitungSiswaCocok(paket, daftarSiswa = []) {
  return (Array.isArray(daftarSiswa) ? daftarSiswa : []).filter((s) => cocokkanTargetPaket(paket, s).cocok).length;
}

// Kosakata yang MEMANG bermakna program/audiens siswa.
const KOSAKATA_AUDIENS = new Set(['reguler', 'intensif', 'online', 'offline', 'kelas', 'privat', 'bimbel', 'semua']);
// Token yang menandakan nilai itu sebenarnya label ISI (mapel/jenjang/ujian).
const TOKEN_ISI = /(ipa|ips|sains|matematika|mat|bahasa|inggris|indonesia|sosiologi|geografi|fisika|kimia|biologi|ekonomi|sejarah|tka|utbk|snbt|smp|sma|sd|smk)/;

/** True bila nilai targetKategori bermakna audiens (harus dicocokkan). */
export function kategoriMembatasiAudiens(nilai) {
  const d = daftarTarget(nilai);
  if (d.length === 0) return false;
  return d.every((t) => KOSAKATA_AUDIENS.has(t) || (!TOKEN_ISI.test(t) && t.length <= 12));
}

export function cocokkanTargetPaket(paket, siswa) {
  if (!cocokKelasToleran(paket?.targetKelas, siswa)) {
    return {
      cocok: false,
      alasan: `Target kelas paket ("${paket?.targetKelas ?? '(kosong)'}") tidak mencakup kelas siswa ("${siswa?.kelasSekolah || '(kosong)'}")`,
    };
  }
  // 🔥 BARU (2026-10-12, insiden paket tentor tak terlihat): field
  // targetKategori sering DIISALAHKAN sebagai label ISI paket ("IPA",
  // "Matematika") padahal maknanya PROGRAM/AUDIENS siswa ("Reguler",
  // "Intensif"). Membandingkan label isi dengan program siswa membuat
  // paket terbit tak cocok ke siapa pun. Label isi TIDAK membatasi
  // audiens: ia dilewati dalam pencocokan siswa (tetap tampil sebagai
  // label bagi admin).
  if (kategoriMembatasiAudiens(paket?.targetKategori)
    && !cocokkanTarget(paket?.targetKategori, siswa?.kategori)) {
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

/** Label sasaran terbaca manusia untuk form tentor & konfirmasi admin. */
export function labelSasaran(paket = {}) {
  const k = daftarTarget(paket.targetKelas);
  const kelas = (k.length === 0 || k.includes('semua')) ? 'Semua kelas' : k.join(', ').toUpperCase();
  const kat = daftarTarget(paket.targetKategori);
  const prog = (kategoriMembatasiAudiens(paket.targetKategori) && kat.length) ? kat.join(', ').toUpperCase() : 'Semua program';
  return `${kelas} · ${prog}`;
}

export default { hitungSiswaCocok,
  daftarTarget,
  targetUntukSemua,
  cocokkanTarget,
  cocokkanTargetPaket,
  bentukKanonikTarget,
};
