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

function buangSufiks(n) {
  const token = n.split(' ');
  while (token.length > 1 && SUFIKS.includes(token[token.length - 1])) token.pop();
  return token.join(' ');
}

/** Kode Kurikulum Merdeka untuk satu nama mapel registry; '' bila tak dikenal.
 *  Murni & deterministik — dipakai guardrail pembuatan mapel, pencocokan
 *  capaian tentor ke PDF, dan penanda varian di layar admin. */
export function kodeKurikulumDariNama(nama) {
  const n = norm(nama);
  if (!n) return '';
  if (TOKEN_PROGRAM.some((re) => re.test(n))) return ''; // program bimbel = lokal
  const alias = semuaAlias();
  // 1) exact alias (paling aman: 'ipas sd' ≠ 'ipa')
  let ketemu = alias.find((a) => a.kunci === n);
  // 2) exact setelah sufiks jenjang dibuang ('geografi sma' → 'geografi')
  if (!ketemu) {
    const tanpaSufiks = buangSufiks(n);
    if (tanpaSufiks !== n) ketemu = alias.find((a) => a.kunci === tanpaSufiks);
  }
  // 3) includes kunci panjang (>=6 karakter) — hindari jebakan 'ipa'⊂'ipas'
  if (!ketemu) ketemu = alias.find((a) => a.kunci.length >= 6 && (n.includes(a.kunci) || a.kunci.includes(n)));
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
