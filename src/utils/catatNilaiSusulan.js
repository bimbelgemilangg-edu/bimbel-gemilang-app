// src/utils/catatNilaiSusulan.js
// ============================================================
// NILAI SUSULAN OFFLINE (keputusan owner 14 Okt 2026 sore):
// tombol "Susulan" di Riwayat Paket DIHAPUS karena menggandakan paket
// (owner tidak sengaja menekan dan try out jadi dua). Penggantinya sesuai
// maksud owner: siswa tertinggal menerima NASKAH PDF (tombol PDF yang
// sudah ada), lalu admin MENCATAT NILAI/XP-nya MANUAL di halaman Hasil
// Try Out supaya angka itu tetap masuk riwayat, analitik, dan XP siswa.
//
// Aturan yang dipaku di sini (murni & teruji):
//   - skor wajib 0..100 dan paket punya soal;
//   - siswa yang SUDAH punya sesi untuk paket itu DITOLAK (jalan resminya
//     Hitung Ulang / Izin Ulang, bukan menumpuk sesi);
//   - XP memakai rumus YANG SAMA dengan pengerjaan online
//     (XP_PER_SOAL = 10, tanpa potongan karena tanpa pelanggaran), supaya
//     tidak ada kelas warga yang bisa farm XP lewat jalur manual;
//   - waktuMulai/createdAt sengaja NULL: analitik tempo membaca createdAt,
//     dan sesi offline jujur tidak punya tempo pengerjaan online
//     (hitungAnalitik menyembunyikan kartu tempo bila createdAt null).
// ============================================================
import { terapkanPotonganXP } from './potonganXPTryOut.js';

/** Sama dengan XP_PER_SOAL di TryOutView & XP_PER_BENAR Latihan Harian. */
export const XP_PER_SOAL_SUSULAN = 10;

/** Penanda sumber nilai supaya layar admin/siswa jujur membedakannya. */
export const SUMBER_NILAI_SUSULAN = 'susulan_pdf_offline';

export function validasiNilaiSusulan({ skorPersen, sudahAdaSesi, jumlahSoal } = {}) {
  const alasan = [];
  if (skorPersen === null || skorPersen === undefined || String(skorPersen).trim() === '') {
    alasan.push('Nilai wajib diisi (persen skor naskah PDF).');
    return { boleh: false, alasan };
  }
  const skor = Number(skorPersen);
  if (!Number.isFinite(skor) || skor < 0 || skor > 100) {
    alasan.push('Nilai wajib angka 0-100 (persen skor naskah PDF).');
  }
  if (!(Number(jumlahSoal) > 0)) {
    alasan.push('Paket ini tidak punya soal yang bisa dinilai.');
  }
  if (sudahAdaSesi) {
    alasan.push('Siswa ini sudah punya sesi untuk paket ini — pakai Hitung Ulang atau Izin Ulang, jangan menumpuk nilai.');
  }
  return { boleh: alasan.length === 0, alasan };
}

/**
 * Dokumen tryout_sesi untuk nilai susulan offline.
 * @returns {object} bentuk siap addDoc ke koleksi tryout_sesi
 */
export function bangunSesiSusulan({
  paketId, studentId, skorPersen, jumlahSoal, catatan = '', dicatatOleh = '', padaMs = Date.now(),
} = {}) {
  const skor = Number(skorPersen) || 0;
  const n = Number(jumlahSoal) || 0;
  const totalSkor = Math.round((skor / 100) * n);
  const xpMentah = Math.round(totalSkor * XP_PER_SOAL_SUSULAN);
  const { xpFinal } = terapkanPotonganXP(xpMentah, []);
  return {
    paketId,
    studentId,
    status: 'selesai',
    jawaban: {},
    subtesAktifIndex: 0,
    totalSkor,
    totalSkorPersen: skor,
    xpMentah,
    xpFinal,
    pelanggaran: [],
    fotoPengawasan: [],
    sumberNilai: SUMBER_NILAI_SUSULAN,
    catatanSusulan: String(catatan || ''),
    dicatatOleh: String(dicatatOleh || ''),
    waktuMulai: null,
    createdAt: null,
    waktuSelesai: padaMs,
    waktuSelesaiMs: padaMs,
  };
}

export default { validasiNilaiSusulan, bangunSesiSusulan, XP_PER_SOAL_SUSULAN, SUMBER_NILAI_SUSULAN };
