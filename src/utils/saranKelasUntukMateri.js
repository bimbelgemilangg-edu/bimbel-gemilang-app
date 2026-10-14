// src/utils/saranKelasUntukMateri.js
// ============================================================
// "Aku kan gak tau mana materi kelas 10/11/12 SMA" (owner 14 Okt 2026).
// Sistem yang menjawab: saran kelas untuk sebuah materi diambil dari
// DATA SENDIRI (modus tingkatKelas butir bank_soal bermateri sama) lalu
// jatuh ke fase Kurikulum Merdeka (E=10, F=11-12) bila bank belum punya.
// Murni & teruji — halaman hanya menampilkan, keputusan tetap operator.
// ============================================================
import { FASE_PER_KELAS } from './kurikulumMerdeka.js';

const norm = (s) => String(s ?? '').trim().toLowerCase();

/**
 * @param {{mapel?:string, materi?:string, sampelBank?:Array<object>}} input
 *   sampelBank: butir bank_soal (minimal {materi, tingkatKelas}) secukupnya.
 * @returns {{kelas:string, alasan:string, kandidat:Array<{kelas:string,jumlah:number}>}}
 */
export function saranKelasUntukMateri({ mapel: _mapel = '', materi = '', sampelBank = [] } = {}) {
  const m = norm(materi);
  if (!m) return { kelas: '', alasan: 'Materi belum diisi — sistem tidak bisa menyarankan.', kandidat: [] };
  const hit = (Array.isArray(sampelBank) ? sampelBank : []).filter((s) => {
    const sm = norm(s?.materi);
    return sm && (sm.includes(m) || m.includes(sm));
  });
  const perKelas = new Map();
  hit.forEach((s) => {
    const k = String(s?.tingkatKelas ?? '').trim();
    if (!k) return;
    perKelas.set(k, (perKelas.get(k) || 0) + 1);
  });
  const kandidat = [...perKelas.entries()]
    .map(([kelas, jumlah]) => ({ kelas, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah || Number(a.kelas) - Number(b.kelas));
  if (kandidat.length) {
    const utama = kandidat[0];
    const fase = FASE_PER_KELAS[Number(utama.kelas)] || FASE_PER_KELAS[String(utama.kelas)] || '?';
    return {
      kelas: utama.kelas,
      alasan: `${utama.jumlah} butir bank soal bermateri sama berada di kelas ${utama.kelas} (fase ${fase}).`,
      kandidat,
    };
  }
  return {
    kelas: '',
    alasan: 'Bank soal belum punya materi ini — tentukan manual. Acuannya fase Kurikulum Merdeka: SMA kelas 10 = fase E, kelas 11-12 = fase F.',
    kandidat: [],
  };
}

export default { saranKelasUntukMateri };
