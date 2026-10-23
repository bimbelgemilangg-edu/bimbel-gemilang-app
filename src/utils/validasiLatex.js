// src/utils/validasiLatex.js
// ============================================================
// GERBANG STANDAR SINTAKS LATEX UNTUK IMPOR.
//
// 🔥 KENAPA ADA (keputusan owner 2026-10-23): prompt impor adalah KONTRAK /
// template yang wajib dipatuhi pihak ketiga (AI pembangkit). Sebelumnya
// keluaran yang melanggar standar LaTeX ("\rightarrowa", "152̸=180" dengan
// U+0338) hanya dirender KaTeX sebagai potongan merah -- tidak ada sinyal
// apa pun di importer, jadi pelanggaran bisa lolos tersimpan dan sampai ke
// layar siswa sebagai rumus rusak.
//
// PRINSIP (ditetapkan owner, berlaku untuk semua sesi):
//   Sistem Gemilang TIDAK menambal markup pihak ketiga. Ketidakpatuhan
//   terhadap template prompt harus TERDETEKSI dan DITOLAK, supaya yang
//   memperbaiki adalah sumbernya -- bukan sistem yang melunak.
//   Karena itu util ini hanya MEMERIKSA dan MELAPOR; tidak ada transformasi.
//
// Cara kerja: setiap segmen math ($...$, $$...$$, \(...\), \[...\]) dirender
// ke KaTeX dengan throwOnError:true. Macro tak dikenal dan ParseError
// melempar exception -> dicatat sebagai temuan lengkap dengan segmen dan
// pesan KaTeX-nya, supaya pihak ketiga tahu persis baris mana yang harus
// mereka perbaiki di keluaran mereka.
//
// Uji: tests/validasiLatex.test.mjs
// ============================================================

import katex from 'katex';

const RE_MATH = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$(?!\s)[^$\n]+?\$)/g;

function isiSegmen(token) {
  if (token.startsWith('$$')) return token.slice(2, -2);
  if (token.startsWith('\\[')) return token.slice(2, -2);
  if (token.startsWith('\\(')) return token.slice(2, -2);
  return token.slice(1, -1);
}

/**
 * Periksa semua segmen math dalam satu string teks.
 * @param {string} teks
 * @returns {{segmen: string, pesan: string}[]} daftar segmen yang tidak sahih
 */
export function periksaLatex(teks) {
  const temuan = [];
  const sumber = String(teks ?? '');
  if (!sumber.includes('$') && !sumber.includes('\\(') && !sumber.includes('\\[')) return temuan;
  for (const m of sumber.matchAll(RE_MATH)) {
    const raw = isiSegmen(m[0]).trim();
    if (!raw) continue;
    try {
      katex.renderToString(raw, { throwOnError: true, strict: 'ignore', output: 'html' });
    } catch (e) {
      temuan.push({
        segmen: raw.length > 90 ? raw.slice(0, 90) + '…' : raw,
        pesan: String(e && e.message ? e.message : e).replace(/^KaTeX parse error:\s*/i, '').slice(0, 120),
      });
    }
  }
  return temuan;
}

const HURUF_OPSI = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

function teksOpsi(o) {
  if (typeof o === 'string') return o;
  if (o && typeof o === 'object') return o.teks ?? '';
  return '';
}

/**
 * Periksa seluruh field math sebuah butir yang sudah dinormalisasi.
 * @param {{teks_soal?: string, opsi_jawaban?: Array, pembahasan?: string, bacaan?: string}} butir
 * @returns {{field: string, segmen: string, pesan: string}[]}
 */
export function periksaLatexSoal(butir = {}) {
  const keluar = [];
  const dorong = (field, teks) => {
    for (const t of periksaLatex(teks)) keluar.push({ field, ...t });
  };
  dorong('teks soal', butir.teks_soal);
  (Array.isArray(butir.opsi_jawaban) ? butir.opsi_jawaban : []).forEach((o, i) => {
    dorong(`opsi ${HURUF_OPSI[i] ?? i + 1}`, teksOpsi(o));
  });
  dorong('pembahasan', butir.pembahasan);
  dorong('bacaan', butir.bacaan);
  return keluar;
}

export default { periksaLatex, periksaLatexSoal };
