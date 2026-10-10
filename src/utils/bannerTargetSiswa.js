// src/utils/bannerTargetSiswa.js
// ============================================================
// Penyusun tampilan target kampus di sisi siswa: chip kecil yang dipasang
// DI DEPAN nama & NIM di dashboard, dan kartu rincian di bawahnya.
//
// 🔥 ATURAN TAMPIL (permintaan owner 2026-10-10)
// "admin akan mendaftarkan siswa tersebut di jurusan dan universitas di
// pilihan 1 dan 2 ... tampilan siswa yang didaftarkan akan berubah, akan ada
// di depan nama siswa dan nomor induk bimbel siswa beserta target rasionalisasi
// pilihan 1 agar apa untuk menanamkan goals anak ... smp dan sd gak akan
// tersentuh karena gak didaftarkan."
//
// Diterjemahkan jadi aturan yang bisa diuji:
//   1. Fitur harus AKTIF untuk siswa itu lewat sakelar fitur (mode uji).
//   2. Jenjang SMA dan kelas 12. SD/SMP/SMK-selain-12 TIDAK tersentuh walau
//      ada dokumen target nyasar -- pagar ganda, bukan mengandalkan halaman
//      admin saja.
//   3. Dokumen target ada dan punya minimal Pilihan 1. Siswa yang belum
//      didaftarkan admin melihat dashboard yang SAMA PERSIS seperti sebelumnya.
//
// 🔥 ISI BANNER jujur soal data: skor yang tampil adalah skor try out skala
// UTBK yang DIINPUT ADMIN dari hasil konsultasi (belum ada penskoran otomatis
// skala UTBK di aplikasi), dan skor acuan prodi berstatus estimasi. Keduanya
// dilabeli. Lihat kepala utils/zonaKesiapan.js untuk larangan istilah.
// ============================================================

import { ekstrakAngkaKelas } from './aksesKontenSiswa.js';
import { ZONA } from './zonaKesiapan.js';

export function normJenjangSiswa(jenjang) {
  const t = String(jenjang ?? '').toLowerCase().trim();
  if (t.includes('sma') || t === 'ma') return 'sma';
  if (t.includes('smp') || t === 'mts') return 'smp';
  if (t.includes('sd') || t === 'mi') return 'sd';
  return t;
}

/**
 * Bolehkah target tampil untuk siswa ini?
 *
 * @param {object} o
 * @param {boolean} o.fiturAktif   hasil sakelar fitur untuk siswa ini
 * @param {string} o.jenjang       dari dokumen students
 * @param {string} o.kelasSekolah  mis. '12 SMA'
 * @param {object|null} o.target   dokumen target_kampus_siswa
 * @returns {{layak: boolean, alasan: string}}
 */
export function layakTampilTarget({ fiturAktif, jenjang, kelasSekolah, target }) {
  if (fiturAktif !== true) return { layak: false, alasan: 'fitur target kampus belum aktif untuk siswa ini' };
  if (normJenjangSiswa(jenjang) !== 'sma') return { layak: false, alasan: `jenjang ${jenjang || '(kosong)'} tidak mengikuti rasionalisasi kampus` };
  if (ekstrakAngkaKelas(kelasSekolah) !== '12') return { layak: false, alasan: `kelas ${kelasSekolah || '(kosong)'} bukan kelas 12` };
  if (!target || typeof target !== 'object') return { layak: false, alasan: 'siswa belum didaftarkan konsultasi target kampus' };
  if (!Array.isArray(target.pilihan) || target.pilihan.length < 1) return { layak: false, alasan: 'target belum punya pilihan prodi' };
  return { layak: true, alasan: '' };
}

/**
 * Chip kecil untuk dipasang DI DEPAN nama & NIM.
 * Isinya GOAL, bukan angka: tujuan chip ini menanamkan target, bukan
 * memamerkan skor di tempat yang terlihat sekilas.
 *
 * @returns {string|null} null bila tidak layak tampil
 */
export function teksChipTarget(target, perbandingan) {
  if (!target) return null;
  const p1 = perbandingan?.pilihan?.[0] || null;
  const namaProdi = p1?.namaProdi || target.pilihan?.[0]?.namaProdi || null;
  const namaPtn = p1?.namaPtn || target.pilihan?.[0]?.namaPtn || null;
  if (!namaProdi) return null;
  const kampus = namaPtn ? ` — ${namaPtn}` : '';
  return `🎯 Goal: ${namaProdi}${kampus}`;
}

/**
 * Kartu rincian: dua pilihan, zona, selisih, dan pengingat bahwa pilihan
 * kedua adalah jaring pengaman.
 *
 * @returns {object|null}
 */
export function susunBannerTarget(target, perbandingan, o = {}) {
  if (!target || !perbandingan) return null;
  const [p1, p2] = perbandingan.pilihan || [];
  const skor = perbandingan.skorSiswa;

  // 🔥 2026-10-10 (keputusan owner): label verifikasi & sanggahan TIDAK tampil
  // di dashboard siswa -- penjelasannya disampaikan admin/konselor langsung
  // saat konsultasi. Kartu siswa adalah alat motivasi; kejujuran datanya
  // hidup di sisi admin, di catatan kaki surat PDF, dan di test.
  const baris = [];
  if (skor === null || skor === undefined) {
    baris.push('Skor try out terakhir belum ada — zona kesiapan belum bisa dihitung.');
  } else {
    baris.push(`Skor try out terakhir: ${skor}.`);
  }
  // Urutan cek PENTING: prodi tidak terdata -> skor siswa belum ada -> skor
  // acuan belum ada -> zona. Membaliknya menghasilkan pesan yang menyalahkan
  // data yang sebenarnya tidak bermasalah.
  const barisZona = (label, p) => {
    if (!p) return;
    if (!p.tersedia) { baris.push(p.alasan); return; }
    if (skor === null || skor === undefined) {
      baris.push(`${label}: zona kesiapan menunggu skor try out skala UTBK diinput pembimbing.`);
      return;
    }
    if (p.zona?.id === ZONA.TANPA_DATA) {
      baris.push(`${label}: prodi ini belum punya skor acuan — zona kesiapan belum bisa ditentukan.`);
      return;
    }
    baris.push(`${label}: selisih ${p.gapMinimum >= 0 ? '+' : ''}${p.gapMinimum} terhadap skor acuan minimum → ${p.zona.nama}. ${p.zona.intervensi || ''}`.trim());
  };
  barisZona('Pilihan 1', p1);
  if (p2) barisZona('Pilihan 2 (jaring pengaman)', p2);
  for (const c of perbandingan.formasi?.catatan || []) baris.push(c);

  return {
    chip: teksChipTarget(target, perbandingan),
    judul: `Target SNBT ${target.tahunSeleksi || '—'} · versi ${target.versi || 1}`,
    pilihan: perbandingan.pilihan || [],
    formasi: perbandingan.formasi || null,
    baris,
    penunjuk: 'Detail angka acuan dibahas langsung bersama pembimbing Gemilang. '
      + 'Pilihan final tetap keputusanmu bersama orang tua dan pembimbing.',
    keteranganSkor: o.keteranganSkor || null,
  };
}

export default { normJenjangSiswa, layakTampilTarget, teksChipTarget, susunBannerTarget };
