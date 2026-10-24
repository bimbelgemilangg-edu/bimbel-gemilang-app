// src/utils/skorSkalaUtbk.js
// ============================================================
// Konversi hasil try out internal menjadi SKALA yang menyerupai cara skor
// UTBK-SNBT ditulis: angka ratusan pada rentang 100-1000 per komponen, dengan
// total berbobot seperti pembobotan resmi SNBT 2025 (acuan BPPP
// Kemendikbudristek): TPS 50%, Literasi Bahasa Indonesia 20%, Literasi Bahasa
// Inggris 15%, Penalaran Matematika 15%.
//
// 🔥 KEJUJURAN ADALAH FITUR UTAMA BERKAS INI
// Skor UTBK resmi dihitung panitia dengan IRT (Item Response Theory) atas
// soal yang kalibrasinya rahasia; jumlah benar yang sama bisa menghasilkan
// skor berbeda. TIDAK ADA cara yang sah bagi aplikasi ini untuk menirunya.
// Maka yang dibangun di sini bukan "penyetaraan", melainkan KEBIASAAN MEMBACA
// ANGKA: persen benar per subtes dipetakan LINEAR ke rentang 100-1000 dan
// totalnya dirakit dengan bobot resmi (dinormalisasi ulang bila paket tidak
// memuat semua komponen), supaya siswa terlatih membaca skala yang akan mereka
// temui di sertifikat -- dengan label yang tidak bisa dimatikan:
//
//   - setiap hasil membawa LABEL_SKALA,
//   - fungsi ini menolak menyebut dirinya skor UTBK,
//   - test memaku kedua sifat itu.
//
// Blueprint §3C: "Skor tryout internal Gemilang tidak boleh dianggap otomatis
// setara dengan skor UTBK resmi."
//
// RIWAYAT RENTANG: 2026-10-24 diubah dari 300-800 ke 100-1000 atas keputusan
// owner setelah riset: skala resmi per komponen adalah 100-1000 (SNBT 2025),
// dan laporan lapangan 2026 konsisten berada di ratusan dengan langit-langit
// praktis ~700-750. Skala dihitung di SISI BACA dari jawaban mentah (tidak
// disimpan sebagai angka skala), jadi perubahan rentang tidak merusak
// riwayat sesi lama.
// ============================================================

export const SKALA_MIN = 100;
export const SKALA_MAKS = 1000;

/**
 * Pembobotan resmi SNBT 2025 per KOMPONEN (persen).
 * Sumber: BPPP Kemendikbudristek via publikasi 25-04-2025.
 */
export const BOBOT_KOMPONEN = { TPS: 50, LBI: 20, LBE: 15, PM: 15 };

/** Subtes UTBK (kode di mesinTaksonomiSoal) -> komponen berbobot. */
const SUBTES_KE_KOMPONEN = {
  PU: 'TPS', PPU: 'TPS', PBM: 'TPS', PK: 'TPS',
  LBI: 'LBI',
  LBE: 'LBE',
  PM: 'PM',
};

/**
 * Komponen berbobot untuk satu kode subtes/komponen. Menerima kedua bentuk
 * kode yang beredar di sistem ('PU' maupun 'utbk_pu'), plus kode komponen
 * langsung ('TPS'). Kode tak dikenal -> null (tidak ikut total berbobot).
 * @param {string} kode
 * @returns {string|null}
 */
export function komponenDariKode(kode) {
  const k = String(kode ?? '').toUpperCase().trim();
  if (!k) return null;
  const inti = k.replace(/^UTBK_/, '');
  if (SUBTES_KE_KOMPONEN[inti]) return SUBTES_KE_KOMPONEN[inti];
  return BOBOT_KOMPONEN[k] !== undefined ? k : null;
}

export const LABEL_SKALA =
  'Skala internal Gemilang 100-1000 per komponen dengan total berbobot resmi '
  + 'SNBT 2025 (TPS 50%, Literasi Bahasa Indonesia 20%, Literasi Bahasa '
  + 'Inggris 15%, Penalaran Matematika 15%), dipetakan linear dari persen '
  + 'benar untuk membiasakan pembacaan angka. BUKAN skor UTBK resmi: tidak '
  + 'dihitung dengan IRT panitia dan tidak dapat dibandingkan langsung dengan '
  + 'skor acuan prodi tanpa penjelasan pembimbing.';

const normPersen = (v) => {
  // Number(null) === 0 dan Number('') === 0 -- pola yang sama yang sudah
  // dua kali menjebak fitur ini (zona & banner). Kosong berarti TIDAK ADA
  // data, bukan nol persen.
  if (v === null || v === undefined) return null;
  if (typeof v === 'string' && v.trim() === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n));
};

/** persen 0-100 -> skala 100-1000 (linear, monoton). */
export function persenKeSkala(persen) {
  const p = normPersen(persen);
  if (p === null) return null;
  return Math.round(SKALA_MIN + ((SKALA_MAKS - SKALA_MIN) * p) / 100);
}

/**
 * Hitung skala per subtes, per komponen berbobot, dan total berbobot resmi.
 *
 * @param {Array<{kode?: string, nama?: string, benar: number, total: number}>} subtes
 * @returns {{total: number|null, perSubtes: Array, perKomponen: Array, alasan?: string, catatan?: string, label: string}}
 */
export function hitungSkalaUtbk(subtes = []) {
  const daftar = (Array.isArray(subtes) ? subtes : []).filter(
    (s) => s && Number.isFinite(Number(s.total)) && Number(s.total) > 0,
  );
  if (daftar.length === 0) {
    return { total: null, perSubtes: [], perKomponen: [], alasan: 'belum ada subtes yang bisa dinilai', label: LABEL_SKALA };
  }
  const perSubtes = daftar.map((s) => {
    const benar = Math.min(Number(s.total), Math.max(0, Number(s.benar) || 0));
    const persen = (benar / Number(s.total)) * 100;
    return {
      kode: s.kode || null,
      nama: s.nama || s.kode || null,
      komponen: komponenDariKode(s.kode),
      benar,
      total: Number(s.total),
      persen: Number(persen.toFixed(1)),
      skala: persenKeSkala(persen),
    };
  });

  // Kelompokkan ke komponen berbobot; persen komponen = gabungan benar/total
  // subtes-subtesnya (bukan rata-rata skala, supaya jumlah soal tetap berarti).
  const agg = new Map();
  for (const s of perSubtes) {
    if (!s.komponen) continue;
    const a = agg.get(s.komponen) || { benar: 0, total: 0 };
    a.benar += s.benar;
    a.total += s.total;
    agg.set(s.komponen, a);
  }
  const perKomponen = [...agg.entries()].map(([komponen, a]) => {
    const persen = (a.benar / a.total) * 100;
    return {
      komponen,
      bobot: BOBOT_KOMPONEN[komponen],
      benar: a.benar,
      total: a.total,
      persen: Number(persen.toFixed(1)),
      skala: persenKeSkala(persen),
    };
  });

  const berbobot = perKomponen.filter((k) => Number(k.bobot) > 0);
  let total = null;
  let catatan;
  if (berbobot.length > 0) {
    const sumBobot = berbobot.reduce((x, k) => x + k.bobot, 0);
    total = Math.round(berbobot.reduce((x, k) => x + k.bobot * k.skala, 0) / sumBobot);
    if (berbobot.length < Object.keys(BOBOT_KOMPONEN).length) {
      catatan =
        'paket tidak memuat semua komponen UTBK; bobot resmi dinormalisasi '
        + `ulang atas komponen yang ada (${berbobot.map((k) => `${k.komponen} ${k.bobot}%`).join(', ')}).`;
    }
  } else {
    // Kode subtes tidak dikenal bobot resmi: jatuh ke tertimbang jumlah soal
    // (perilaku lama) supaya angka tetap ada, dengan catatan jujur.
    const sumBenar = perSubtes.reduce((x, s) => x + s.benar, 0);
    const sumTotal = perSubtes.reduce((x, s) => x + s.total, 0);
    total = persenKeSkala((sumBenar / sumTotal) * 100);
    catatan = 'kode subtes tidak dikenal bobot resmi; total memakai tertimbang jumlah soal.';
  }

  return { total, perSubtes, perKomponen, catatan, label: LABEL_SKALA };
}

export default { SKALA_MIN, SKALA_MAKS, BOBOT_KOMPONEN, komponenDariKode, LABEL_SKALA, persenKeSkala, hitungSkalaUtbk };
