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

// ------------------------------------------------------------
// v1.5.5 — TRANSFORMASI KOLEKSI IKUTAN (audit pra-migrasi 31 Okt 2026)
// Kode mapel lama TIDAK cuma hidup di teachers/students/mapel. Ia juga
// menempel di:
//   - bimbel_modul (materi/kuis/tugas): field kodeMapel → dibaca pagar
//     akses siswa hasSubjectAccess() di 4 halaman siswa. Kalau tidak ikut
//     dimigrasi, siswa TERKUNCI dari modulnya sendiri (enrolled 'geo' vs
//     modul 'MAPEL-019').
//   - jadwal_bimbel: mapelId (id dokumen registry) + mapelName → kalau id
//     dibiarkan menunjuk dokumen varian yang dinonaktifkan, referensi
//     jadwal menggantung.
//   - laporan_belajar: kodeMapel + namaMapel → halaman Laporan Belajar
//     guru mencocokkan EKSAK per kode; capaian yang sudah diisi guru bisa
//     "menghilang" dari menu (dan dari PDF) bila tidak ikut dipetakan.
// Semua transformasi di bawah MURNI + JUJUR: yang tidak terpeta dibiarkan.
// ------------------------------------------------------------

/** Rewrite kodeMapel dokumen bimbel_modul. Kode kosong/'Semua'/tak terpeta
 *  dibiarkan persis (jangan pernah mengarang). */
export function transformModulKeKodeKanonik(modul = {}, petaKode = {}) {
  const lama = String(modul.kodeMapel ?? '');
  if (!lama.trim()) return { kodeMapel: modul.kodeMapel };
  // kodeMapel modul bisa gabungan koma (jarang) — petakan per bagian
  const bagian = lama.split(',').map((x) => x.trim()).filter(Boolean);
  const baru = [];
  for (const b of bagian) {
    const k = petaKode[b] || petaKode[b.toLowerCase()] || b;
    if (!baru.some((x) => x.toLowerCase() === k.toLowerCase())) baru.push(k);
  }
  return { kodeMapel: baru.join(', ') };
}

/** Rewrite referensi mapel dokumen jadwal_bimbel (mapelId → dokumen induk
 *  kanonik, mapelName → nama kanonik). Peta disusun eksekutor dari rencana:
 *  petaDocId[idLama]=idKanonik; petaNamaDariDocId[idLama]=nama kanonik;
 *  petaNamaDariNamaLama[nama lama (lowercase)]=nama kanonik (jadwal tanpa id). */
export function transformJadwalKeKodeKanonik(jadwal = {}, petaDocId = {}, petaNamaDariDocId = {}, petaNamaDariNamaLama = {}) {
  const keluar = {};
  const idLama = String(jadwal.mapelId ?? '');
  if (idLama && petaDocId[idLama] && petaDocId[idLama] !== idLama) keluar.mapelId = petaDocId[idLama];
  const namaLamaNorm = String(jadwal.mapelName ?? '').toLowerCase().trim();
  const namaBaru = (idLama && petaNamaDariDocId[idLama]) || petaNamaDariNamaLama[namaLamaNorm] || '';
  if (namaBaru && String(jadwal.mapelName ?? '') !== namaBaru) keluar.mapelName = namaBaru;
  return keluar; // {} = tidak ada yang perlu diubah
}

/** Rewrite kodeMapel+namaMapel dokumen laporan_belajar (capaian guru).
 *  Id dokumen TIDAK diganti (history aman); halaman guru mencocokkan lewat
 *  field, dan simpanan berikutnya idempoten di kunci baru. */
export function transformLaporanKeKodeKanonik(dok = {}, petaKode = {}, petaNama = {}) {
  const lama = String(dok.kodeMapel ?? '');
  if (!lama.trim()) return {};
  const kodeBaru = petaKode[lama] || petaKode[lama.toLowerCase()] || '';
  if (!kodeBaru) return {}; // tak terpeta = dibiarkan (jujur)
  const keluar = { kodeMapel: kodeBaru };
  const namaBaru = petaNama[lama];
  if (namaBaru && String(dok.namaMapel ?? '') !== namaBaru) keluar.namaMapel = namaBaru;
  return keluar;
}

/** Peta referensi turunan dari rencana (MURNI): id dokumen lama → id/nama
 *  kanonik + nama lama (lowercase) → nama kanonik. Dipakai dry-run & eksekusi
 *  untuk jadwal_bimbel. Id induk TIDAK dimasukkan ke petaDocId (induk dipakai
 *  ulang di tempat — id tidak berubah; transformJadwal hanya remap yang beda). */
export function bangunPetaReferensi(rencana = {}) {
  const petaDocId = {};
  const petaNamaDariDocId = {};
  const petaNamaDariNamaLama = {};
  for (const t of rencana.target || []) {
    if (t.indukId) petaNamaDariDocId[t.indukId] = t.nama;
    const nn = String(t.namaIndukLama || '').toLowerCase().trim();
    if (nn) petaNamaDariNamaLama[nn] = t.nama;
    for (const v of t.varianDinonaktifkan || []) {
      if (v.id && t.indukId) { petaDocId[v.id] = t.indukId; petaNamaDariDocId[v.id] = t.nama; }
      const vn = String(v.nama || '').toLowerCase().trim();
      if (vn) petaNamaDariNamaLama[vn] = t.nama;
    }
  }
  return { petaDocId, petaNamaDariDocId, petaNamaDariNamaLama };
}

/** v1.5.6: pemetaan KODE YATIM — kode MAPEL-XXX yang dokumen registry-nya
 *  sudah terlanjur DIHAPUS sebelum migrasi, tapi kodenya masih menempel di
 *  dokumen guru (mapelDetails.namaMapel), modul (subject), atau laporan guru
 *  (namaMapel). Nama pendampingnya di-resolve STRICT ke katalog; hanya yang
 *  resolve yang dipetakan — yang tidak, dibiarkan (jangan pernah menebak).
 *  Kasus nyata produksi: 'IPS (Pengganti)'<MAPEL-012> — 1 guru, 11 siswa,
 *  8 modul nyangkut karena dokumennya dihapus admin sebelum migrasi v2.
 *  @param {Array<{kodeLama:string,nama:string}>} entriBernama
 *  @param {Object} petaKode pemetaan yang sudah ada (tidak akan ditimpa)
 *  @returns {Object} tambahan pemetaan kodeYatim → kode kanonik */
export function petakanKodeYatim(entriBernama = [], petaKode = {}) {
  const kodeKatalog = new Set(katalogMapelGemilang().map((k) => k.kode));
  const tambahan = {};
  for (const e of entriBernama) {
    const kode = String(e?.kodeLama || '').trim();
    if (!kode || petaKode[kode] || tambahan[kode] || kodeKatalog.has(kode)) continue;
    const kanonik = kodeKanonikDariNamaLama(e?.nama);
    if (kanonik) tambahan[kode] = kanonik;
  }
  return tambahan;
}

export default {
  katalogMapelGemilang, kodeKanonikDariNamaLama, rencanaMigrasiMapel,
  transformGuruKeKodeKanonik, transformSiswaKeKodeKanonik, MAPEL_PROGRAM_LOKAL,
  transformModulKeKodeKanonik, transformJadwalKeKodeKanonik, transformLaporanKeKodeKanonik,
  bangunPetaReferensi, petakanKodeYatim,
};
