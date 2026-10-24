// src/utils/skorSkalaTka.js
// ============================================================
// SKALA KEBIASAAN GAYA TKA (Tes Kompetensi Akademik) + DETEKSI JENIS UJIAN.
//
// 🔥 KENAPA ADA (riset + keputusan owner 2026-10-24): TKA dan UTBK-SNBT
// memakai skala resmi yang BERBEDA, jadi satu skala tidak bisa melayani
// keduanya tanpa menyesatkan:
//
//   UTBK-SNBT 2025 : 100-1000 per komponen, bobot TPS 50 / LitBI 20 /
//                    LitIng 15 / PenMat 15, dihitung IRT  (skorSkalaUtbk.js)
//   TKA 2025       : 0-100, pembulatan 2 desimal, plus kategori capaian
//   TKA 2026 SMA/SMK : 200-800, pembulatan 2 desimal, per Kepmendikdasmen
//                    No. 56 Tahun 2026; predikat ISTIMEWA untuk skor
//                    >= 725,00 per mata uji (kategori Baik/Memadai/Kurang
//                    TIDAK ditampilkan: batas resminya tidak diterbitkan
//                    terbuka, dan mengarang batas = berbohong rapi)
//   TKA 2026 SD/SMP  : tetap 0-100
//
// Sama seperti saudara UTBK-nya, berkas ini TIDAK menyetarakan: pemetaan
// linear dari persen benar untuk membiasakan membaca skala yang akan siswa
// temui, dengan label jujur yang tidak bisa dimatikan.
// ============================================================

export const SKALA_TKA_MIN = 200;
export const SKALA_TKA_MAKS = 800;
/** Predikat Istimewa TKA SMA 2026: skor >= 725,00 per mata uji. */
export const BATAS_ISTIMEWA_TKA = 725;

/** Mapel TKA SMA/SMK (wajib + pilihan yang umum diterbitkan). */
const TKA_MAPEL_SMA = new Set([
  'matematika', 'bahasa indonesia', 'bahasa inggris',
  'fisika', 'kimia', 'biologi', 'ekonomi', 'geografi', 'sosiologi',
  'pendidikan pancasila', 'ppkn', 'sejarah',
]);
/** Mapel TKA SD/SMP (2026 tetap berskala 0-100). */
const TKA_MAPEL_SD_SMP = new Set([
  'matematika', 'bahasa indonesia', 'bahasa inggris',
  'ipa', 'ilmu pengetahuan alam', 'ips', 'ilmu pengetahuan sosial',
]);

export const LABEL_SKALA_TKA =
  'Skala internal Gemilang 200-800 per mata uji (SMA/SMK) atau 0-100 (SD/SMP) '
  + 'yang menyerupai cara hasil TKA dilaporkan (Kepmendikdasmen No. 56 Tahun '
  + '2026 untuk SMA/SMK), dipetakan linear dari persen benar untuk '
  + 'membiasakan pembacaan angka. BUKAN skor TKA resmi: tidak dihitung dengan '
  + 'penskoran panitia dan tidak dapat dipakai memprediksi hasil TKA '
  + 'sebenarnya tanpa penjelasan pembimbing.';

const norm = (s) => String(s ?? '').toLowerCase().trim();
const round2 = (n) => Math.round(n * 100) / 100;

/** persen 0-100 -> skala TKA SMA/SMK 200-800, pembulatan 2 desimal. */
export function persenKeSkalaTka(persen) {
  const p = Number(persen);
  if (!Number.isFinite(p)) return null;
  const tertahan = Math.min(100, Math.max(0, p));
  return round2(SKALA_TKA_MIN + ((SKALA_TKA_MAKS - SKALA_TKA_MIN) * tertahan) / 100);
}

/** Predikat resmi yang DIPUBLIKASIKAN terbuka: Istimewa (>= 725,00). */
export function predikatTka(skala) {
  const s = Number(skala);
  if (!Number.isFinite(s)) return null;
  return s >= BATAS_ISTIMEWA_TKA ? 'Istimewa' : null;
}

/**
 * Jenjang paket: field jenjang eksplisit > teks targetKelas > mayoritas
 * field kelas/jenjang soal. Mengembalikan 'SD' | 'SMP' | 'SMA' | 'SMK' | null.
 */
export function jenjangPaket(paket) {
  const dariField = norm(paket?.jenjang);
  const teks = `${dariField} ${norm(paket?.targetKelas)}`;
  const m = /\b(sd|smp|smk|sma|ma)\b/.exec(teks);
  if (m) return m[1] === 'ma' ? 'SMA' : m[1].toUpperCase();
  const suara = {};
  for (const s of paket?.daftarSoal || []) {
    const t = `${norm(s?.jenjang)} ${norm(s?.kelas)}`;
    const mm = /\b(sd|smp|smk|sma|ma)\b/.exec(t);
    if (mm) { const k = mm[1] === 'ma' ? 'SMA' : mm[1].toUpperCase(); suara[k] = (suara[k] || 0) + 1; }
  }
  const urut = Object.entries(suara).sort((a, b) => b[1] - a[1]);
  return urut.length ? urut[0][0] : null;
}

const adalahSma = (j) => j === 'SMA' || j === 'SMK';
const adalahSdSmp = (j) => j === 'SD' || j === 'SMP';

/**
 * Tebak jenis ujian dari ISI paket bila admin tidak memilih eksplisit.
 * @returns {'utbk'|'tka'|'kurikulum'}
 */
export function tebakJenisUjian(paket, cekUtbk = () => false) {
  const soal = Array.isArray(paket?.daftarSoal) ? paket.daftarSoal : [];
  if (soal.some((s) => cekUtbk(s?.mapel || s?.mataPelajaran || ''))) return 'utbk';
  const jenjang = jenjangPaket(paket);
  const mapelAda = soal.map((s) => norm(s?.mapel || s?.mataPelajaran));
  if (adalahSma(jenjang) && mapelAda.some((m) => TKA_MAPEL_SMA.has(m))) return 'tka';
  if (adalahSdSmp(jenjang) && mapelAda.some((m) => TKA_MAPEL_SD_SMP.has(m))) return 'tka';
  return 'kurikulum';
}

/**
 * Jenis ujian sebuah paket: pilihan eksplisit admin saat menerbitkan
 * (`paket.jenisUjian`) menang; bila kosong/'otomatis' ditebak dari isi.
 * @returns {'utbk'|'tka'|'kurikulum'}
 */
export function jenisUjianPaket(paket, cekUtbk = () => false) {
  const eksplisit = norm(paket?.jenisUjian);
  if (eksplisit === 'utbk' || eksplisit === 'tka' || eksplisit === 'kurikulum') return eksplisit;
  return tebakJenisUjian(paket, cekUtbk);
}

/** Apakah jenjang paket memakai skala TKA 200-800 (SMA/SMK) atau 0-100? */
export function modeSkalaTka(paket) {
  return adalahSma(jenjangPaket(paket)) ? 'tka-sma' : 'tka-dasmen';
}

export default {
  SKALA_TKA_MIN, SKALA_TKA_MAKS, BATAS_ISTIMEWA_TKA, LABEL_SKALA_TKA,
  persenKeSkalaTka, predikatTka, jenjangPaket, tebakJenisUjian, jenisUjianPaket, modeSkalaTka,
};
