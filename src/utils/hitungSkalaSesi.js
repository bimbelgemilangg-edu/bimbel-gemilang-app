// src/utils/hitungSkalaSesi.js
// ============================================================
// Menghitung skala 300-800 (utils/skorSkalaUtbk.js) LANGSUNG dari dokumen
// sesi try out + paketnya, tanpa input manual admin.
//
// 🔥 KENAPA TIDAK DIHITUNG SAAT SISWA SUBMIT
// Tempat alami menulisnya adalah TryOutView.jsx saat submit. Berkas itu
// (2.778 baris, alur ujian yang sedang dipakai siswa) punya 4 error lint
// warisan per 2026-10-10 -- menyentuhnya di minggu deadline berarti
// membersihkan ranjau CI sekaligus mengambil risiko pada alur ujian.
// Keputusan: hitung di SISI BACA (halaman target admin, satu klik untuk
// memakai angkanya), bayar utang TryOutView di commit terpisah yang tenang.
//
// Murni & teruji: menerima objek sesi & paket apa pun (dari Firestore atau
// fixture), tidak menyentuh jaringan.
// ============================================================

import { skorSatuSoal, soalBisaDinilai, isSoalEsai } from './skorSoalTryOut.js';
import { hitungSkalaUtbk } from './skorSkalaUtbk.js';
import { MAPEL_UTBK } from './mesinTaksonomiSoal.js';
import { apakahMapelUtbk } from '../../lib/kunciGemini.js';

const norm = (s) => String(s ?? '').toLowerCase().trim();

function subtesDariMapel(namaMapel) {
  const n = norm(namaMapel);
  const m = MAPEL_UTBK.find((x) => norm(x.nama) === n || x.kode === n);
  return m ? m.subtes : null;
}

/**
 * @param {object} sesi  dokumen tryout_sesi (field jawaban, status)
 * @param {object} paket dokumen tryout_paket (field daftarSoal)
 * @returns {{total: number|null, perSubtes: Array, alasan?: string}}
 */
export function hitungSkalaSesi(sesi, paket) {
  if (!sesi || sesi.status !== 'selesai') {
    return { total: null, perSubtes: [], alasan: 'sesi belum selesai' };
  }
  const daftar = paket?.daftarSoal || [];
  const jawaban = sesi.jawaban || {};
  const perSubtesAgg = new Map();
  for (const soal of daftar) {
    const mapel = soal?.mapel || soal?.mataPelajaran || '';
    if (!apakahMapelUtbk(mapel, MAPEL_UTBK)) continue;   // paket campuran: hanya subtes UTBK yang masuk skala
    if (isSoalEsai(soal) || !soalBisaDinilai(soal)) continue; // esai dinilai manusia, tidak ikut skala
    const subtes = subtesDariMapel(mapel);
    if (!subtes) continue;
    const agg = perSubtesAgg.get(subtes) || { benar: 0, total: 0 };
    agg.total += 1;
    const s = skorSatuSoal(soal, jawaban[soal.id]);
    if (s !== null && s >= 0.999) agg.benar += 1;
    perSubtesAgg.set(subtes, agg);
  }
  if (perSubtesAgg.size === 0) {
    return { total: null, perSubtes: [], alasan: 'paket ini bukan try out subtes UTBK' };
  }
  const subtes = [...perSubtesAgg.entries()].map(([kode, v]) => ({ kode, ...v }));
  return hitungSkalaUtbk(subtes);
}

/** Ambil sesi selesai terbaru dari daftar sesi (urut waktuMulaiMs menurun). */
export function sesiTerbaru(sesiList = []) {
  return [...sesiList]
    .filter((s) => s && s.status === 'selesai')
    .sort((a, b) => (Number(b.waktuMulaiMs) || 0) - (Number(a.waktuMulaiMs) || 0))[0] || null;
}

export default { hitungSkalaSesi, sesiTerbaru };
