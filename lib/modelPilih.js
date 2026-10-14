// lib/modelPilih.js
// ============================================================
// LOGIKA MURNI mode "pilih-dari-bank" (AI pemilih soal try out otomatis).
//
// LAHIR DARI BUG NYATA (2026-10-13): handler modePilihDariBank versi
// pertama merakit sendiri panggilan AI-nya — model default
// 'gemini-2.5-flash' (sudah DITUTUP Google untuk akun baru → 404),
// URL endpoint hard-code, tanpa rantai cadangan, dan balasan error dari
// provider ditelan diam-diam (handler tetap membalas 200 tanpa field
// "pilihan" maupun "error"). Akibatnya mesin try out jatuh ke fallback
// dengan alasan generik "AI tidak mengembalikan daftar pilihan" dan
// tidak ada cara mengetahui penyebab sebenarnya dari log admin.
//
// Obatnya: mode pilih WAJIB memakai rantai model yang SUDAH TERBUKTI
// di endpoint ini (AI_MODEL → AI_MODEL_FALLBACKS lewat
// callAIWithFallback), dan setiap kegagalan WAJIB pulang membawa teks
// error yang jujur. Berkas ini memuat tiga fungsi murni supaya aturan
// itu bisa diuji tanpa menyentuh jaringan:
//   1. rantaiModelPilih  — susun urutan model dari env + default terbukti.
//   2. uraiBalasanPilihAi — baca JSON balasan AI; gagal = error bernama.
//   3. teksErrorAi       — ringkas exception provider jadi satu baris jujur.
// MURNI & TERUJI (tests/modelPilih.test.mjs).
// ============================================================

/**
 * Urutan model yang dicoba untuk mode pilih-dari-bank.
 * Prioritas: GEMINI_MODEL_PILIH (khusus pemilih) → GEMINI_MODEL →
 * AI_MODEL → modelBawaan (konstanta AI_MODEL milik endpoint, terbukti
 * hidup). Cadangan ditambahkan apa adanya, duplikat dibuang, urutan
 * dipertahankan — callAIWithFallback yang mengeksekusi rantainya.
 *
 * @param {object} env              biasanya process.env
 * @param {string} modelBawaan      default endpoint (AI_MODEL) — jangan dikarang ulang di sini
 * @param {string[]} fallbackBawaan daftar cadangan endpoint (AI_MODEL_FALLBACKS)
 * @returns {string[]} minimal 1 model, tanpa duplikat/kosong
 */
export function rantaiModelPilih(env = {}, modelBawaan = '', fallbackBawaan = []) {
  // Tiap kandidat di-trim DULU baru dipilih yang pertama tidak kosong —
  // nilai env '   ' dianggap belum disetel (semantik sama dengan
  // lib/kunciGemini.js), supaya tidak memblokir kandidat di bawahnya.
  const utama = [env.GEMINI_MODEL_PILIH, env.GEMINI_MODEL, env.AI_MODEL, modelBawaan]
    .map((c) => String(c ?? '').trim())
    .find((c) => c) || '';
  const cadangan = (Array.isArray(fallbackBawaan) ? fallbackBawaan : [])
    .map((m) => String(m ?? '').trim())
    .filter(Boolean);
  const rantai = [utama, ...cadangan].filter(Boolean);
  return [...new Set(rantai)];
}

/**
 * Baca balasan AI mode pilih: cari objek JSON pertama di dalam teks
 * (AI kadang membungkus dengan kalimat/markdown) dan pastikan kontrak
 * field "pilihan" berupa array. Gagal → { parsed: null, error: '<sebab>' }
 * supaya handler bisa meneruskan sebab itu ke mesin, bukan bungkam.
 *
 * @param {string} teks isi choices[0].message.content
 * @returns {{parsed: object|null, error: string|null}}
 */
export function uraiBalasanPilihAi(teks) {
  const t = String(teks || '');
  const m = /\{[\s\S]*\}/.exec(t);
  if (!m) {
    return {
      parsed: null,
      error: t.trim()
        ? `Balasan AI tidak memuat JSON (awal: ${t.trim().slice(0, 80)})`
        : 'Balasan AI kosong',
    };
  }
  let parsed = null;
  try {
    parsed = JSON.parse(m[0]);
  } catch (e) {
    return { parsed: null, error: `JSON AI gagal dibaca: ${String(e?.message || e).slice(0, 120)}` };
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.pilihan)) {
    return { parsed: null, error: 'JSON AI tidak memuat field "pilihan" berupa array' };
  }
  return { parsed, error: null };
}

/**
 * Satu baris jujur dari exception panggilan AI: model yang dicoba,
 * status HTTP provider, dan pesannya — dipotong agar muat di log admin.
 * Dipakai handler saat callAIWithFallback melempar (404 model pensiun,
 * 429 kuota, timeout, dll) supaya alasan fallback di draf tidak lagi
 * generik.
 *
 * @param {unknown} e exception apa pun
 * @returns {string} tidak pernah kosong
 */
export function teksErrorAi(e) {
  const bagian = [];
  if (e?.attemptedModel) bagian.push(`model=${e.attemptedModel}`);
  if (e?.code === 'AI_TIMEOUT') bagian.push('timeout');
  if (e?.providerStatus) bagian.push(`HTTP ${e.providerStatus}`);
  const pesan = String(e?.providerMessage || e?.message || (e == null ? '' : e) || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (pesan) bagian.push(pesan);
  const teks = bagian.join(' | ');
  return (teks || 'AI gagal tanpa pesan').slice(0, 240);
}

export default { rantaiModelPilih, uraiBalasanPilihAi, teksErrorAi };
