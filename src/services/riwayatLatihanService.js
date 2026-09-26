// src/services/riwayatLatihanService.js
// ============================================================
// RIWAYAT LATIHAN & UJIAN SISWA (Turn 95 — arahan owner: tab
// "Diskusi" diganti "Riwayat Latihan" supaya siswa bisa melihat
// kembali nilai percobaan sebelumnya dan bagian mana yang salah).
// Tersimpan permanen per siswa:
//   siswa_riwayat_latihan/{studentId}/items/{autoId}
// Entri: { jenis:'latihan'|'ujian', materiId, babId, babJudul, kode?,
//          nilai, benar, total, perSoal:[{i, kredit, jaw}], tsMs }
// ============================================================
import {
  collection, addDoc, getDocs, query, where, serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const kol = (studentId) => collection(db, 'siswa_riwayat_latihan', String(studentId || '_'), 'items');

export async function catatRiwayatLatihan(studentId, entry, itemId) {
  if (!studentId) return null;
  try {
    if (itemId) {
      // id deterministik (mis. ujian_<sesiId>) -> idempoten, tidak duplikat
      const ref = doc(db, 'siswa_riwayat_latihan', String(studentId), 'items', String(itemId));
      await setDoc(ref, { ...entry, tsMs: entry.tsMs || Date.now() }, { merge: true });
      return ref.id;
    }
    const ref = await addDoc(kol(studentId), {
      ...entry,
      ts: serverTimestamp(),
      tsMs: Date.now(),
    });
    return ref.id;
  } catch (e) {
    console.error('Gagal catat riwayat latihan:', e);
    return null;
  }
}

export async function muatRiwayatLatihan(studentId, babId) {
  if (!studentId || !babId) return [];
  try {
    const q = query(kol(studentId), where('babId', '==', babId));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.tsMs || 0) - (a.tsMs || 0))
      .slice(0, 30);
  } catch (e) {
    console.error('Gagal muat riwayat latihan:', e);
    return [];
  }
}

// Format jawaban siswa untuk ditampilkan ulang di riwayat.
export function formatJawaban(soal, jaw) {
  const t = String(soal?.tipe || 'pg');
  if (jaw === undefined || jaw === null) return '—';
  if (t === 'pg') {
    return jaw === -1 || jaw === '' ? '—' : String.fromCharCode(65 + Number(jaw));
  }
  if (t === 'pgMulti') {
    return Array.isArray(jaw) && jaw.length
      ? jaw.map((j) => String.fromCharCode(65 + Number(j))).join(', ')
      : '—';
  }
  if (t === 'tabel') {
    const kol2 = soal.kolom || ['Benar', 'Salah'];
    return Array.isArray(jaw)
      ? jaw.map((c, r) => `${r + 1}:${kol2[c] || c}`).join(' ')
      : '—';
  }
  return String(jaw || '—');
}

export function formatKunci(soal) {
  return formatJawaban(soal, soal?.jawaban);
}
