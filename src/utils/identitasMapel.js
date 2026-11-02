// src/utils/identitasMapel.js
// ============================================================
// IDENTITAS MAPEL (31 Okt 2026 — keluhan owner: "mapel beranak pinak")
// Registry `mapel` dulu bebas diisi nama apa pun ("GEOGRAFI SMA", "IPA SMP",
// "BAHASA INGGRIS SD") sehingga satu mapel kurikulum punya banyak varian
// dokumen, dan kode varian (MAPEL-XXX) tak cocok dengan kode kurikulum di
// mesin rapor → capaian tentor bisa gagal menempel di PDF tanpa suara.
//
// Modul ini SATU SUMBER KEBENARAN pemetaan nama registry → kode Kurikulum
// Merdeka: pencocokan STRICT (exact alias → exact setelah buang sufiks
// jenjang → includes kunci panjang), tidak pernah menebak jadi kode lain
// (bahaya 'ipa' vs 'ipas'). Nama yang tak resolve = kategori LOKAL/program
// (sah untuk program bimbel seperti TKA/English Course, tapi ditandai).
// ============================================================

import { MAPEL_KURIKULUM } from './kurikulumMerdeka.js';

const SUFIKS = ['smp', 'sd', 'sma', 'smk', 'mts', 'tsanawiyah', 'ma', 'mi', 'minat', 'lanjutan', 'dasar', 'pengganti', 'umum'];

// Token penanda PROGRAM bimbel (bukan mapel sekolah) — selalu kategori lokal
// supaya 'ENGLISH COURSE'/'TKA …' tidak dicaplok jadi mapel kurikulum.
const TOKEN_PROGRAM = [/\btka\b/, /\butbk\b/, /\bsnbt\b/, /\bcourse\b/, /\bkursus\b/, /\bklub\b/, /\bclub\b/, /tes kompetensi/, /kompetensi akademik/];

const norm = (t) => String(t || '').toLowerCase().replace(/[^a-z0-9.+ ]/g, ' ').replace(/\s+/g, ' ').trim();

const semuaAlias = () => MAPEL_KURIKULUM.flatMap((m) => [m.nama, ...(m.alias || [])].map((a) => ({ kode: m.kode, kunci: norm(a) })));

/** v1.5.6: semua bentuk bertahap setelah sufiks jenjang dikelupas satu per
 *  satu, dari yang TERPANJANG (paling spesifik) ke terpendek.
 *  'matematika minat sma' → ['matematika minat', 'matematika'].
 *  Kenapa: versi lama langsung mengelupas SEMUA sufiks sekaligus, sehingga
 *  'Matematika minat SMA' jatuh ke 'matematika' (mtk wajib) — padahal
 *  'matematika minat' adalah alias eksak mtk_tl (Tingkat Lanjut). Kasus
 *  nyata di produksi: 11 jadwal + 3 modul + 5 siswa kelas 12 salah lebur. */
function varianTanpaSufiks(n) {
  const token = n.split(' ');
  const hasil = [];
  while (token.length > 1 && SUFIKS.includes(token[token.length - 1])) {
    token.pop();
    hasil.push(token.join(' '));
  }
  return hasil;
}

/** Kode Kurikulum Merdeka untuk satu nama mapel registry; '' bila tak dikenal.
 *  Murni & deterministik — dipakai guardrail pembuatan mapel, pencocokan
 *  capaian tentor ke PDF, dan penanda varian di layar admin. */
export function kodeKurikulumDariNama(nama) {
  // 0a) exact KODE kurikulum apa adanya — SEBELUM norm(), karena norm()
  //     membuang underscore ('bind_tl' → 'bind tl'). v1.5.5: kode kanonik
  //     pasca-migrasi (bind_tl, mtk_tl, …) harus resolve ke dirinya sendiri.
  const raw = String(nama || '').trim().toLowerCase();
  const byKodeRaw = MAPEL_KURIKULUM.find((m) => m.kode === raw);
  if (byKodeRaw) return byKodeRaw.kode;
  const n = norm(nama);
  if (!n) return '';
  if (TOKEN_PROGRAM.some((re) => re.test(n))) return ''; // program bimbel = lokal
  // 0b) exact KODE kurikulum setelah norm ('bind', 'mtk', 'bing', …) — v1.5.5
  //     FIX: tanpa langkah ini kode pendek 'bind' bisa terserempet aturan
  //     includes ke kunci panjang mapel lain ('bindo tingkat lanjut' → bind_tl!).
  const byKode = MAPEL_KURIKULUM.find((m) => m.kode === n);
  if (byKode) return byKode.kode;
  const alias = semuaAlias();
  // 1) exact alias (paling aman: 'ipas sd' ≠ 'ipa')
  let ketemu = alias.find((a) => a.kunci === n);
  // 2) exact setelah sufiks jenjang dibuang BERTAHAP — coba bentuk paling
  //    spesifik dulu ('geografi sma' → 'geografi'; 'matematika minat sma' →
  //    'matematika minat' = alias mtk_tl, BUKAN langsung 'matematika' = mtk)
  if (!ketemu) {
    for (const kandidat of varianTanpaSufiks(n)) {
      ketemu = alias.find((a) => a.kunci === kandidat);
      if (ketemu) break;
    }
  }
  // 3) includes kunci panjang (>=6 karakter) — hindari jebakan 'ipa'⊂'ipas'.
  //    v1.5.5 FIX: arah kunci⊇input juga wajib input >=6 karakter, supaya
  //    input pendek ('bind') tidak dicaplok kunci panjang ('bindo tingkat
  //    lanjut' → bind_tl). Pencocokan longgar hanya untuk string panjang.
  if (!ketemu) ketemu = alias.find((a) => a.kunci.length >= 6 && (n.includes(a.kunci) || (n.length >= 6 && a.kunci.includes(n))));
  return ketemu ? ketemu.kode : '';
}

/** Kategori registry: 'kurikulum' bila resolve ke peta, selain itu 'lokal'. */
export function kategoriMapelRegistry(nama) {
  return kodeKurikulumDariNama(nama) ? 'kurikulum' : 'lokal';
}

/** Deteksi varian: dua nama registry berbeda resolve ke kode kurikulum sama. */
export function grupVarian(daftarNama = []) {
  const peta = {};
  for (const nama of daftarNama) {
    const kode = kodeKurikulumDariNama(nama);
    if (!kode) continue;
    (peta[kode] = peta[kode] || []).push(nama);
  }
  return Object.fromEntries(Object.entries(peta).filter(([, arr]) => arr.length > 1));
}

/** Nama kanonik kurikulum untuk satu kode (untuk picker & sinkronisasi). */
export function namaKurikulum(kode) {
  const m = MAPEL_KURIKULUM.find((x) => x.kode === kode);
  return m ? m.nama : '';
}

export default { kodeKurikulumDariNama, kategoriMapelRegistry, grupVarian, namaKurikulum };
