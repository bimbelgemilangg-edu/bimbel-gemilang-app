// src/services/sesiService.js — SESI KELAS (2 mode: materi interaktif & bank soal)
import {
  collection, doc, setDoc, updateDoc, getDocs, query, where,
  onSnapshot, serverTimestamp, deleteDoc,
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
    tahapKelas: 'menjelaskan', timerStatus: 'idle', timerDurasiDetik: 300, timerSisaDetik: 300,
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
  onSnapshot(doc(db, 'sesi_kelas', sesiId), { includeMetadataChanges: true }, (s) => cb(s.exists()
    ? { id: s.id, ...s.data(), _fromCache: s.metadata.fromCache, _hasPendingWrites: s.metadata.hasPendingWrites }
    : null));

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

// ============================================================
// MODE UJIAN (Turn 91 — arahan owner): guru menekan "Mulai Ujian",
// siswa LANGSUNG mengerjakan SEMUA soal dengan timer mundur.
// Nilai terlihat di layar guru; siswa melihat nilainya hanya setelah
// benar-benar mengumpulkan (manual semua terjawab atau auto saat habis).
// ============================================================
export async function mulaiUjian(sesiId, { daftarSoal, durasiMenit }) {
  await updateDoc(doc(db, 'sesi_kelas', sesiId), {
    mode: 'ujian',
    daftarSoal: daftarSoal || [],
    durasiMenit: Number(durasiMenit) || 30,
    ujianMulaiAt: Date.now(),
    ujianSelesaiAt: null,
    soalAktif: null, kunciTerbuka: false,
    updatedAt: serverTimestamp(),
  });
}

export async function akhiriUjian(sesiId) {
  await updateDoc(doc(db, 'sesi_kelas', sesiId), {
    ujianSelesaiAt: Date.now(), updatedAt: serverTimestamp(),
  });
}

export async function kumpulkanUjian(sesiId, { siswaId, nama, skor, benar, total, terjawab }) {
  await setDoc(doc(db, 'sesi_kelas', sesiId, 'ujian', siswaId), {
    siswaId, nama: nama || '', skor: Number(skor) || 0, benar: Number(benar) || 0,
    total: Number(total) || 0, terjawab: Number(terjawab) || 0,
    selesaiAt: serverTimestamp(), ts: Date.now(),
  }, { merge: true });
}

export const dengarUjian = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'ujian'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))));

// Turn 93: riwayat sesi guru + rekap nilai untuk dilihat KEMBALI
// kapan pun (sesi aktif maupun yang sudah diakhiri). Data nilai
// permanen di subcollection ujian/ & jawaban/ per sesi.
export async function listSesiGuru(guruId, batas = 40) {
  const q = query(collection(db, 'sesi_kelas'), where('guruId', '==', guruId || ''));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.dibuatAt?.seconds || 0) - (a.dibuatAt?.seconds || 0))
    .slice(0, batas);
}

export async function muatRekapSesi(sesiId) {
  const [uj, pes] = await Promise.all([
    getDocs(collection(db, 'sesi_kelas', sesiId, 'ujian')),
    getDocs(collection(db, 'sesi_kelas', sesiId, 'peserta')),
  ]);
  return {
    ujian: uj.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.skor || 0) - (a.skor || 0)),
    peserta: pes.docs.map((d) => ({ id: d.id, ...d.data() })),
  };
}

export async function kirimTanya(sesiId, { siswaId, nama, teks, eventId }) {
  const safeId = String(eventId || `${siswaId || 'siswa'}_${Date.now()}`)
    .replace(/[^a-zA-Z0-9_-]/g, '_');
  await setDoc(doc(db, 'sesi_kelas', sesiId, 'tanya', safeId),
    { siswaId, nama: nama || '', teks, eventId: safeId, ts: serverTimestamp() }, { merge: true });
}

export const dengarTanya = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'tanya'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.ts?.seconds || 0) - (b.ts?.seconds || 0))));

export const hapusTanya = (sesiId, tanyaId) =>
  deleteDoc(doc(db, 'sesi_kelas', sesiId, 'tanya', tanyaId));

export async function ajukanMaju(sesiId, { siswaId, nama }) {
  const ref = doc(db, 'sesi_kelas', sesiId, 'relawan', siswaId);
  await setDoc(ref, {
    siswaId, nama: nama || 'Siswa', status: 'menunggu', diajukanAt: serverTimestamp(),
  }, { merge: true });
}

export const dengarRelawan = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_kelas', sesiId, 'relawan'),
    (sn) => cb(sn.docs.map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (a.diajukanAt?.seconds || 0) - (b.diajukanAt?.seconds || 0))));

export const dengarRelawanSiswa = (sesiId, siswaId, cb) =>
  onSnapshot(doc(db, 'sesi_kelas', sesiId, 'relawan', siswaId),
    (snap) => cb(snap.exists() ? { id: snap.id, ...snap.data() } : null));

export async function pilihRelawan(sesiId, relawan) {
  await Promise.all([
    ubahSesi(sesiId, {
      relawanAktif: { siswaId: relawan.siswaId, nama: relawan.nama || 'Siswa' },
      relawanAktifSejak: serverTimestamp(),
    }),
    updateDoc(doc(db, 'sesi_kelas', sesiId, 'relawan', relawan.siswaId), {
      status: 'dipilih', dipilihAt: serverTimestamp(),
    }),
  ]);
}

export async function selesaikanMaju(sesiId, siswaId) {
  await Promise.all([
    ubahSesi(sesiId, { relawanAktif: null, relawanTerakhir: siswaId }),
    updateDoc(doc(db, 'sesi_kelas', sesiId, 'relawan', siswaId), {
      status: 'selesai', selesaiAt: serverTimestamp(),
    }),
  ]);
}

export const mulaiTimerSesi = (sesiId, detik) =>
  ubahSesi(sesiId, { timerStatus: 'running', timerDurasiDetik: Number(detik) || 300, timerSisaDetik: Number(detik) || 300, timerMulaiAt: serverTimestamp() });

export const jedaTimerSesi = (sesiId, sisaDetik) =>
  ubahSesi(sesiId, { timerStatus: 'paused', timerSisaDetik: Math.max(0, Number(sisaDetik) || 0) });

export const resetTimerSesi = (sesiId, detik) =>
  ubahSesi(sesiId, { timerStatus: 'idle', timerDurasiDetik: Number(detik) || 300, timerSisaDetik: Number(detik) || 300 });
