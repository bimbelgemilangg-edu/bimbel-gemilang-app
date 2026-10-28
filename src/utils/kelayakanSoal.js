// src/utils/kelayakanSoal.js
// ============================================================
// GERBANG KELAYAKAN BUTIR: menolak soal yang "tidak layak tampil" SEBELUM
// tersimpan ke bank, dengan alasan yang bisa diteruskan apa adanya ke pihak
// ketiga (prompt koreksi).
//
// 🔥 KENAPA ADA (insiden 2026-10-28, owner + tentor): naskah keluaran Gemini
// untuk TKA Matematika Lanjut disimpan walau cacat berat -- opsi berupa
// gambar grafik hilang sehingga opsi kosong (soal 15 sumber), gambar yang
// dirujuk teks tidak ikut (soal 17 & 21), fungsi sepenggal rusak. Di kertas
// dan di layar siswa butir seperti itu membingungkan atau tak bisa dijawab.
// Sebelumnya pemeriksaan tersebar dan sebagian hanya PERINGATAN; berkas ini
// memusatkan syarat KELAYAKAN minimal satu butir sebagai fungsi murni.
//
// PRINSIP: hanya menolak yang OBJEKTIF cacatnya (kosong, kurang, tak
// menunjuk, LaTeX tak terrender, opsi kembar identik). Kerusakan SEMANTIK
// (angka salah tulis oleh AI) tidak bisa dideteksi mesin dan tetap urusan
// review manusia -- dikatakan jujur, tidak dipura-purakan bisa.
//
// Uji: tests/kelayakanSoal.test.mjs
// ============================================================

import katex from 'katex';

const RE_MENUNJUK_VISUAL = /\b(perhatikan|lihat|sesuai|berdasarkan|grafik|gambar|diagram)\b[^.\n]{0,40}\b(berikut|tersebut|di atas|ini)\b/i;

function latexSahih(teks) {
  const sumber = String(teks ?? '');
  for (const m of sumber.matchAll(/\$\$([\s\S]+?)\$\$|\\\[[\s\S]+?\\\]|\$(?!\s)[^\n$]+?\$|\\\([^\n]*?\\\)/g)) {
    const token = m[0];
    const isi = (token.startsWith('$$') || token.startsWith('\\[') || token.startsWith('\\('))
      ? token.slice(2, -2)
      : token.slice(1, -1);
    try {
      katex.renderToString(isi.trim(), { throwOnError: true, strict: 'ignore' });
    } catch (_e) {
      return false;
    }
  }
  return true;
}

function opsiBermakna(o) {
  const teks = String(typeof o === 'string' ? o : (o?.teks ?? '')).trim();
  const gambar = Array.isArray(o?.gambar) ? o.gambar.filter((g) => g && (g.url || g.uploadedUrl)) : [];
  const tabel = Array.isArray(o?.tabel) ? o.tabel : [];
  return Boolean(teks) || gambar.length > 0 || tabel.length > 0;
}

/**
 * Daftar alasan sebuah butir TIDAK layak tampil; array kosong = layak.
 * @param {object} soal butir skema bank soal
 * @returns {string[]}
 */
export function alasanKelayakan(soal) {
  const alasan = [];
  if (!soal || typeof soal !== 'object') return ['butir bukan object'];
  const teks = String(soal.teks_soal ?? soal.teksSoal ?? '').trim();
  if (!teks) alasan.push('teks soal kosong');
  if (teks && !latexSahih(teks)) alasan.push('teks soal memuat LaTeX yang tidak bisa dirender');

  const tipe = String(soal.tipe || 'pg_sederhana');
  const opsi = Array.isArray(soal.opsi_jawaban) ? soal.opsi_jawaban : [];
  const bermakna = opsi.filter(opsiBermakna);
  if (['pg_sederhana', 'pg_kompleks'].includes(tipe)) {
    if (bermakna.length < 2) {
      alasan.push(`opsi bermakna hanya ${bermakna.length} (minimal 2) -- kemungkinan opsi berupa gambar/grafik yang tidak ikut terbawa impor`);
    } else if (new Set(bermakna.map((o) => String(typeof o === 'string' ? o : o.teks).trim())).size === 1 && bermakna.every((o) => typeof o === 'string' || !((o.gambar || []).length))) {
      alasan.push('seluruh opsi identik -- butir tidak membedakan jawaban');
    }
    if (opsi.length > 0 && bermakna.length < opsi.length) {
      alasan.push(`${opsi.length - bermakna.length} opsi kosong setelah pembersihan`);
    }
  }

  const kunci = soal.kunci_jawaban;
  if (['pg_sederhana'].includes(tipe) && bermakna.length >= 2) {
    const huruf = Array.isArray(kunci) ? kunci[0] : kunci;
    const idx = typeof huruf === 'number' ? huruf : String(huruf ?? '').toUpperCase().charCodeAt(0) - 65;
    if (!Number.isFinite(idx) || idx < 0 || idx >= bermakna.length) alasan.push('kunci tidak menunjuk opsi yang ada');
  }

  if (teks && RE_MENUNJUK_VISUAL.test(teks)) {
    const punyaGambar = (Array.isArray(soal.gambar) && soal.gambar.some((g) => g && (g.url || g.uploadedUrl)))
      || bermakna.some((o) => (typeof o === 'object' && (o.gambar || []).length));
    const punyaTabel = (Array.isArray(soal.tabel_soal) && soal.tabel_soal.length)
      || bermakna.some((o) => (typeof o === 'object' && (o.tabel || []).length));
    if (!punyaGambar && !punyaTabel) alasan.push('teks menunjuk gambar/grafik/tabel tetapi tidak ada visual yang terbawa');
  }

  const bahas = String(soal.pembahasan ?? '').trim();
  if (!bahas) alasan.push('pembahasan kosong');
  else if (!latexSahih(bahas)) alasan.push('pembahasan memuat LaTeX yang tidak bisa dirender');
  return alasan;
}

/** true bila butir memenuhi syarat kelayakan minimal untuk tampil & dicetak. */
export function layakSoal(soal) {
  return alasanKelayakan(soal).length === 0;
}

export default { alasanKelayakan, layakSoal };
