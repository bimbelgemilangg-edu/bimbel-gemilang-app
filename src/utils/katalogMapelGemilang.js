// src/utils/katalogMapelGemilang.js
// ============================================================
// KATALOG KANONIK MAPEL BIMBEL GEMILANG (v2 — 31 Okt 2026)
// Perombakan pondasi atas perintah owner: registry mapel lama beranak pinak
// (varian per jenjang + program campur aduk) sehingga sistem "bingung":
// rekap tentor berisik, kode varian tak menempel di PDF, form pendaftaran
// menyesatkan. Katalog ini SATU daftar kebenaran:
//
//   1. MAPEL SEKOLAH  = kode Kurikulum Merdeka (satu entri per kode; jenjang
//      diatur otomatis lewat fase, BUKAN lewat nama ber-sufiks).
//      SD/MI inti: Bahasa Indonesia, Bahasa Inggris, Matematika, IPAS.
//      SMP/MTs inti: Bahasa Indonesia, Bahasa Inggris, Matematika, IPA, IPS.
//      SMA/SMK: wajib + peminatan (Fisika/Kimia/Biologi/Ekonomi/Sosiologi/
//      Geografi/Sejarah/dll. sesuai fase E-F).
//   2. PROGRAM UTBK/SNBT = kode mesin yang SUDAH dipakai engine taksonomi
//      (utbk_pu, utbk_ppu, utbk_pbm, utbk_pk, utbk_lbi, …) — riset SNPMB:
//      TPS 4 subtes (Penalaran Umum, Pengetahuan & Pemahaman Umum/"PU",
//      Pemahaman Bacaan & Menulis, Pengetahuan Kuantitatif) + Literasi
//      Bahasa Indonesia + Literasi Bahasa Inggris + Penalaran Matematika.
//   3. PROGRAM LOKAL SAH = kode tetap untuk penawaran non-kurikulum yang
//      memang dijual bimbel (English Course, TKA umum) — ditandai 'program'.
//
// Fungsi migrasi di bawah MURNI (dapat diuji): rencana dari dokumen lama,
// lalu transformasi dokumen guru/siswa ke kode baru. Eksekusi Firestore
// hidup di halaman admin dengan dry-run + konfirmasi + audit.
// ============================================================

import { MAPEL_KURIKULUM } from './kurikulumMerdeka.js';
import { MAPEL_UTBK } from './mesinTaksonomiSoal.js';
import { kodeMapel as kodeAlias } from './aliasMapel.js';
import { kodeKurikulumDariNama } from './identitasMapel.js';

/** Program lokal sah (kode tetap, di luar peta sekolah & UTBK). */
export const MAPEL_PROGRAM_LOKAL = [
  { kode: 'prog_engc', nama: 'English Course', kelompok: 'program' },
  { kode: 'prog_tka', nama: 'TKA — Tes Kompetensi Akademik', kelompok: 'program' },
];

/** Katalog kanonik lengkap: sekolah + UTBK/SNBT + program lokal. */
export function katalogMapelGemilang() {
  const sekolah = MAPEL_KURIKULUM.map((m) => ({
    kode: m.kode, nama: m.nama, kelompok: m.kelompok === 'wajib' ? 'sekolah-wajib' : 'sekolah-peminatan',
    fase: [...(m.fase || [])], sumber: 'kurikulum-merdeka',
  }));
  const utbk = MAPEL_UTBK.map((m) => ({
    kode: m.kode, nama: m.nama, kelompok: 'program-utbk', subtes: m.subtes || '', fase: [], sumber: 'snpmb-utbk',
  }));
  const lokal = MAPEL_PROGRAM_LOKAL.map((m) => ({ ...m, fase: [], sumber: 'program-gemilang' }));
  return [...sekolah, ...utbk, ...lokal];
}

const norm = (t) => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();

/** Kode kanonik untuk SATU nama registry lama; '' bila tak terpeta
 *  (berarti entri lokal tak dikenal → dibiarkan aktif apa adanya). */
export function kodeKanonikDariNamaLama(nama) {
  const n = norm(nama);
  if (!n) return '';
  // 1) mapel sekolah via resolver identitas (strict, anti 'ipa'⊂'ipas')
  const kur = kodeKurikulumDariNama(n);
  if (kur) return kur;
  // 2) program lokal sah persis (jangan dicaplok alias 'english' → bing)
  if (n === 'english course' || n === 'course bahasa inggris') return 'prog_engc';
  if (n === 'tes kompetensi akademik' || n === 'tka' || n === 'tka umum') return 'prog_tka';
  // 3) konteks program di depan nama mapel ('TKA BAHASA INGGRIS SMA' → bing)
  const tanpaPrefiks = n.replace(/^(tka|tes|utbk|snbt)\s+/, '');
  if (tanpaPrefiks !== n) {
    const kur2 = kodeKurikulumDariNama(tanpaPrefiks);
    if (kur2) return kur2;
  }
  // 4) subtes UTBK/SNBT via alias mesin (sudah dipakai bank soal)
  const alias = kodeAlias(n);
  if (String(alias).startsWith('utbk_')) return alias;
  return '';
}

/** Rencana migrasi dari dokumen registry lama. Murni & deterministik.
 *  @param {Array} docsLama dokumen koleksi mapel ({id, namaMapel, kodeMapel, …})
 *  @param {{guruPerKode?:Object, siswaPerKode?:Object}} pemakaian jumlah
 *  referensi per kodeMapel lama (untuk memilih entri induk bila ada varian).
 *  @returns {{target:Array, petaKode:Object, petaNama:Object, nonaktif:Array, takTerpeta:Array}} */
export function rencanaMigrasiMapel(docsLama = [], pemakaian = {}) {
  const grup = {};
  const takTerpeta = [];
  for (const d of docsLama) {
    const kode = kodeKanonikDariNamaLama(d.namaMapel);
    if (!kode) { takTerpeta.push({ id: d.id || '', kodeLama: d.kodeMapel || '', nama: d.namaMapel || '' }); continue; }
    (grup[kode] = grup[kode] || []).push(d);
  }
  const katalog = Object.fromEntries(katalogMapelGemilang().map((k) => [k.kode, k]));
  const target = [];
  const petaKode = {};
  const petaNama = {};
  const nonaktif = [];
  for (const [kode, daftar] of Object.entries(grup)) {
    const urut = [...daftar].sort((a, b) => (
      (pemakaian.guruPerKode?.[b.kodeMapel] || 0) + (pemakaian.siswaPerKode?.[b.kodeMapel] || 0)
    ) - (
      (pemakaian.guruPerKode?.[a.kodeMapel] || 0) + (pemakaian.siswaPerKode?.[a.kodeMapel] || 0)
    ));
    const induk = urut[0];
    const kanonik = katalog[kode] || { kode, nama: induk.namaMapel, kelompok: 'lokal' };
    target.push({
      kode, nama: kanonik.nama, kelompok: kanonik.kelompok || 'lokal',
      indukId: induk.id || '', indukKodeLama: induk.kodeMapel || '',
      namaIndukLama: induk.namaMapel || '',
      butuhUbahNama: norm(induk.namaMapel) !== norm(kanonik.nama),
      varianDinonaktifkan: urut.slice(1).map((d) => ({ id: d.id || '', kodeLama: d.kodeMapel || '', nama: d.namaMapel || '' })),
    });
    for (const d of daftar) {
      petaKode[d.kodeMapel || ''] = kode;
      petaNama[d.kodeMapel || ''] = kanonik.nama;
    }
    nonaktif.push(...urut.slice(1).map((d) => ({ id: d.id || '', kodeLama: d.kodeMapel || '', nama: d.namaMapel || '', keKode: kode })));
  }
  return { target, petaKode, petaNama, nonaktif, takTerpeta };
}

/** Transformasi dokumen GURU ke kode kanonik (dedupe per kode, nama disamakan). */
export function transformGuruKeKodeKanonik(guru = {}, petaKode = {}, petaNama = {}) {
  const details = Array.isArray(guru.mapelDetails) && guru.mapelDetails.length
    ? guru.mapelDetails
    : (guru.mapel ? [{ id: guru.mapelId || '', namaMapel: guru.mapel, kodeMapel: guru.kodeMapel || '' }] : []);
  const pakai = new Map();
  for (const md of details) {
    const kodeBaru = petaKode[md.kodeMapel || ''] || petaKode[md.namaMapel || ''];
    if (!kodeBaru) {
      // Entri di luar rencana migrasi (lokal/tak terpeta — tetap aktif di
      // registry): PERTAHANKAN apa adanya. Migrasi tidak boleh menghapus
      // mapel guru yang tidak dikenali; hanya varian yang dilebur.
      const kunciTetap = `__tetap:${md.id || md.namaMapel || md.kodeMapel}`;
      if (!pakai.has(kunciTetap)) {
        pakai.set(kunciTetap, { id: md.id || '', namaMapel: md.namaMapel || '', kodeMapel: md.kodeMapel || '' });
      }
      continue;
    }
    if (!pakai.has(kodeBaru)) {
      pakai.set(kodeBaru, { id: md.id || '', namaMapel: petaNama[md.kodeMapel || ''] || md.namaMapel || '', kodeMapel: kodeBaru });
    }
  }
  const mapelDetails = [...pakai.values()];
  return {
    mapelDetails,
    mapelIds: mapelDetails.map((m) => m.id).filter(Boolean),
    mapel: mapelDetails.map((m) => m.namaMapel).join(', '),
    kodeMapel: mapelDetails.map((m) => m.kodeMapel).join(', '),
    mapelId: mapelDetails[0]?.id || '',
  };
}

/** Transformasi enrolledSubjects SISWA ke kode kanonik (dedupe). */
export function transformSiswaKeKodeKanonik(siswa = {}, petaKode = {}) {
  if (!Array.isArray(siswa.enrolledSubjects)) return { enrolledSubjects: siswa.enrolledSubjects };
  const keluar = [];
  for (const e of siswa.enrolledSubjects) {
    const s = String(e || '');
    if (s.toLowerCase() === 'semua') { if (!keluar.includes('semua')) keluar.push('semua'); continue; }
    const kodeBaru = petaKode[s] || (petaKode[s.toLowerCase()] || '');
    if (kodeBaru && !keluar.includes(kodeBaru)) keluar.push(kodeBaru);
    if (!kodeBaru && !keluar.includes(s)) keluar.push(s); // tak terpeta = dibiarkan
  }
  return { enrolledSubjects: keluar };
}

export default {
  katalogMapelGemilang, kodeKanonikDariNamaLama, rencanaMigrasiMapel,
  transformGuruKeKodeKanonik, transformSiswaKeKodeKanonik, MAPEL_PROGRAM_LOKAL,
};
