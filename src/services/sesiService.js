// src/services/sesiService.js — SESI KELAS (2 mode: materi interaktif & bank soal)
import {
  collection, doc, setDoc, updateDoc, getDocs, query, where,
  onSnapshot, serverTimestamp, addDoc, deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase';

const ABJ = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const kodeAcak = () => Array.from({ length: 6 }, () => ABJ[Math.floor(Math.random() * ABJ.length)]).join('');

export async function buatSesi({ bukuId, babId, guruId, catatan, soalPrioritas, mode, sumber, daftarSoal }) {
  const ref = doc(collection(db, 'sesi_kelas'));
  const kode = kodeAcak();
  await setDoc(ref, {
    bukuId: bukuId || '', babId: babId || '', guruId: guruId || '', kode,
    mode: mode || 'bank',          // 'materi' | 'bank'
    sumber: sumber || 'bank',      // 'buku'  | 'bank'
    status: 'aktif',
    slideAktif: 0,                 // untuk mode materi (index slide)
    soalAktif: null,               // untuk mode bank (index soal)
    kunciTerbuka: false, langkahTerbuka: 0,
    catatan: catatan || '', soalPrioritas: soalPrioritas || [],
    daftarSoal: daftarSoal || [],
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

export async function gabungSesi(sesiId, siswaId, nama) {
  await setDoc(doc(db, 'sesi_kelas', sesiId, 'peserta', siswaId),
    { siswaId, nama: nama || '', gabungAt: serverTimestamp() }, { merge: true });
}

export const dengarPeserta = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'peserta'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))));

export async function kirimJawaban(sesiId, { siswaId, nama, soalIdx, jawaban, benar }) {
  await setDoc(doc(db, 'sesi_kelas', sesiId, 'jawaban', `${siswaId}__${soalIdx}`),
    { siswaId, nama: nama || '', soalIdx: Number(soalIdx), jawaban, benar: !!benar, ts: serverTimestamp() },
    { merge: true });
}

export const dengarJawaban = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'jawaban'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))));

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