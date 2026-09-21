import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { tambahXpMingguan } from '../utils/mingguIni';

export const XP_KEBERANIAN_MAJU = 25;

/**
 * Beri XP satu kali untuk aksi maju pada satu sesi tertentu.
 * Award idempotent: refresh, klik ganda, atau dua tab tidak menggandakan XP.
 */
export async function beriXpKeberanian({ sesiId, siswaId, nama, nilai = XP_KEBERANIAN_MAJU }) {
  if (!sesiId || !siswaId) throw new Error('Sesi dan siswa wajib diisi.');
  const progressRef = doc(db, 'siswa_progress', siswaId);
  const awardRef = doc(db, 'sesi_kelas', sesiId, 'xp_awards', siswaId);
  const xp = Math.max(0, Number(nilai) || 0);

  return runTransaction(db, async (tx) => {
    const [awardSnap, progressSnap] = await Promise.all([tx.get(awardRef), tx.get(progressRef)]);
    if (awardSnap.exists()) return { awarded: false, xp: 0 };

    const existing = progressSnap.exists() ? progressSnap.data() : {};
    const mingguan = tambahXpMingguan(existing.xpMingguIni, existing.xpMingguIniKunci, xp);
    tx.set(progressRef, {
      xp: (Number(existing.xp) || 0) + xp,
      xpKeberanian: (Number(existing.xpKeberanian) || 0) + xp,
      xpMingguIni: mingguan.xpMingguIni,
      xpMingguIniKunci: mingguan.xpMingguIniKunci,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    tx.set(awardRef, {
      siswaId, nama: nama || 'Siswa', xp, alasan: 'berani maju ke papan', diberikanAt: serverTimestamp(),
    });
    return { awarded: true, xp };
  });
}
