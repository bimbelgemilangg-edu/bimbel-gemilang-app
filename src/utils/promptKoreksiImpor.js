// src/utils/promptKoreksiImpor.js
// ============================================================
// Menyusun PROMPT KOREKSI siap tempel ke AI pihak ketiga dari daftar butir
// tertolak. Dipakai BERSAMA oleh halaman impor dan halaman Periksa Berkas
// supaya loop koreksi tidak bergantung pada halaman mana yang dipakai.
// Lahir 2026-10-23 (tombol di halaman impor); dipusatkan 2026-10-28 agar
// Periksa Berkas bisa menutup loop SEBELUM unggah.
// ============================================================

const MAX_BARIS = 10;

/**
 * @param {Array<{nomor?: number, paket?: number|null, errors?: string[]}>} invalid
 * @param {{sumber?: string, siklus?: number, total?: number}} meta
 * @returns {string}
 */
export function bangunPromptKoreksi(invalid, meta = {}) {
  const daftar = Array.isArray(invalid) ? invalid : [];
  if (!daftar.length) return '';
  const bagian = [];
  for (const q of daftar.slice(0, 40)) {
    const label = 'soal #' + (q.nomor ?? '?') + (q.paket ? ' (paket ' + q.paket + ')' : '');
    for (const e of (q.errors || [])) bagian.push('  - ' + label + ': ' + e);
  }
  const lebih = daftar.length > 40 ? daftar.length - 40 : 0;
  return [
    'KOREKSI WAJIB -- KELUARANMU DITOLAK GERBANG BANK SOAL GEMILANG',
    '',
    meta.sumber ? 'Berkas: ' + meta.sumber : '',
    meta.siklus ? 'Siklus koreksi ke-' + meta.siklus + '.' : '',
    'Soal tertolak: ' + daftar.length + (meta.total ? ' dari ' + meta.total : '') + '.',
    '',
    'Perbaiki SEMUA butir di bawah lalu KIRIM ULANG SELURUH DOKUMEN dari awal',
    '(jangan hanya potongan). Kalau keluaranmu memakai template templat baris',
    '(SKEMA: gemilang-baris@1), perbaiki baris yang disebut; pesan menyebut',
    'nomor baris bila tersedia.',
    '',
    'DAFTAR PENOLAKAN:',
    '',
    ...bagian.slice(0, MAX_BARIS * 4),
    ...(lebih ? ['  - ... +' + lebih + ' soal lain'] : []),
    '',
    'Aturan yang paling sering dilanggar: perintah LaTeX WAJIB berhenti pada',
    'batas jelas (spasi/kurung); "tidak sama dengan" pakai \\ne; setiap opsi PG',
    'WAJIB berisi teks atau deklarasi gambar; gambar yang dirujuk teks WAJIB',
    'dideklarasikan GAMBAR: ya beserta placeholder {{GAMBAR_n}}.',
  ].filter((x) => x !== '').join('\n');
}

export default { bangunPromptKoreksi };
