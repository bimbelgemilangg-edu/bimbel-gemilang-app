// src/services/kelasService.js
// Pencatatan jawaban siswa per soal + rekap untuk guru (Mode Bahas).
// Dipakai oleh RendererHtmlBab (mode siswa) dan BahasBabPage (mode guru).
import { collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase'; // bila config firebase-mu berada di src/lib/firebase, ganti menjadi '../lib/firebase'

export async function catatJawaban({ bukuId, babId, soalNo, tipe, benar, jawaban, siswaId, nama }) {
  if (!babId || !siswaId || !soalNo) return;
  const id = `${babId}__${soalNo}__${siswaId}`;
  try {
    await setDoc(doc(db, 'jawaban_soal', id), {
      bukuId: bukuId || '',
      babId,
      soalNo: Number(soalNo),
      tipe: tipe || '',
      benar: !!benar,
      jawaban: String(jawaban || '').slice(0, 200),
      siswaId,
      nama: nama || '',
      ts: serverTimestamp(),
    }, { merge: true });
  } catch (e) {
    console.error('Gagal catat jawaban:', e);
  }
}

export async function ambilRekapBab(babId) {
  const rekap = { siswa: new Set(), total: 0, benar: 0, perSoal: {} };
  try {
    const q = query(collection(db, 'jawaban_soal'), where('babId', '==', babId));
    const snap = await getDocs(q);
    snap.forEach((d) => {
      const v = d.data();
      rekap.siswa.add(v.siswaId);
      rekap.total += 1;
      if (v.benar) rekap.benar += 1;
      const p = rekap.perSoal[v.soalNo] || { n: 0, benar: 0 };
      p.n += 1;
      if (v.benar) p.benar += 1;
      rekap.perSoal[v.soalNo] = p;
    });
  } catch (e) {
    console.error('Gagal ambil rekap:', e);
  }
  return {
    jumlahSiswa: rekap.siswa.size,
    total: rekap.total,
    benar: rekap.benar,
    perSoal: rekap.perSoal,
  };
}

export function soalPalingSalah(perSoal, limitN = 5) {
  return Object.entries(perSoal || {})
    .map(([no, p]) => ({
      soalNo: Number(no),
      n: p.n,
      benar: p.benar,
      salah: p.n - p.benar,
      tingkatSalah: p.n ? (p.n - p.benar) / p.n : 0,
    }))
    .sort((a, b) => b.tingkatSalah - a.tingkatSalah || b.salah - a.salah)
    .slice(0, limitN);
}