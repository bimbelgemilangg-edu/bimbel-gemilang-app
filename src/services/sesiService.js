// src/services/sesiService.js
// Service SESI KELAS (satu file untuk semua operasi sesi live & kelas).
// Menyediakan fungsi untuk buat sesi, join via kode, dengar real-time,
// kirim jawaban, dan rekap.
import {
  collection, doc, setDoc, updateDoc, getDocs, query, where,
  onSnapshot, serverTimestamp, addDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const ABJ = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const kodeAcak = () => Array.from({ length: 6 }, () => ABJ[Math.floor(Math.random() * ABJ.length)]).join('');

// ---------- Sesi ----------
export async function buatSesi({ bukuId, babId, guruId, catatan, soalPrioritas }) {
  const ref = doc(collection(db, 'sesi_kelas'));
  const kode = kodeAcak();
  await setDoc(ref, {
    bukuId, babId, guruId: guruId || '', kode,
    status: 'aktif', fase: 'materi',
    soalAktif: null, kunciTerbuka: false, langkahTerbuka: 0,
    catatan: catatan || '', soalPrioritas: soalPrioritas || [],
    dibuatAt: serverTimestamp(),
  });
  return { id: ref.id, kode };
}

export async function cariSesiByKode(kode) {
  const q = query(collection(db, 'sesi_kelas'),
    where('kode', '==', String(kode || '').toUpperCase().trim()),
    where('status', '==', 'aktif'));
  const snap = await getDocs(q);
  return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export const dengarSesi = (sesiId, cb) =>
  onSnapshot(doc(db, 'sesi_kelas', sesiId), (s) => cb(s.exists() ? { id: s.id, ...s.data() } : null));

export const ubahSesi = (sesiId, patch) =>
  updateDoc(doc(db, 'sesi_kelas', sesiId), { ...patch, updatedAt: serverTimestamp() });

export async function akhiriSesi(sesiId) {
  await updateDoc(doc(db, 'sesi_kelas', sesiId), { status: 'selesai', diakhiriAt: serverTimestamp() });
}

// ---------- Peserta ----------
export async function gabungSesi(sesiId, siswaId, nama) {
  await setDoc(doc(db, 'sesi_kelas', sesiId, 'peserta', siswaId),
    { siswaId, nama: nama || '', gabungAt: serverTimestamp() }, { merge: true });
}

export const dengarPeserta = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'peserta'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))));

// ---------- Jawaban ----------
export async function kirimJawaban(sesiId, { siswaId, nama, soalIdx, jawaban, benar }) {
  await setDoc(doc(db, 'sesi_kelas', sesiId, 'jawaban', `${siswaId}__${soalIdx}`),
    { siswaId, nama: nama || '', soalIdx: Number(soalIdx), jawaban, benar: !!benar, ts: serverTimestamp() },
    { merge: true });
}

export const dengarJawaban = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'jawaban'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))));

// ---------- Tanya ----------
export async function kirimTanya(sesiId, { siswaId, nama, teks }) {
  await addDoc(collection(db, 'sesi_kelas', sesiId, 'tanya'),
    { siswaId, nama: nama || '', teks, ts: serverTimestamp() });
}

export const dengarTanya = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'tanya'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ts?.seconds || 0) - (b.ts?.seconds || 0))));

export const hapusTanya = (sesiId, tanyaId) =>
  deleteDoc(doc(db, 'sesi_kelas', sesiId, 'tanya', tanyaId));