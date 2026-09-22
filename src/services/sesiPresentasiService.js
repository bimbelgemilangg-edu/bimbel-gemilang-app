// src/services/sesiPresentasiService.js
// ============================================================
// SESI PRESENTASI v2 (Fase 3) -- sinkron guru <-> siswa realtime.
// Lihat docs/RENCANA-ROMBAK-MATERI.md §3.3.
//
// Model data (Firestore, dokumen kecil = hemat kuota Spark):
//   sesi_presentasi/{sessionId}
//     materiId, babId,
//     posisi: { jenis: 'section'|'kuis', index },
//     mode: 'mengikuti'|'bebas',
//     status: 'aktif'|'selesai',
//     guruId, guruNama, dibukaPada, diupdatePada
//   sesi_presentasi/{sessionId}/peserta/{studentId}
//     nama, pada
//   sesi_presentasi/{sessionId}/jawaban/{studentId}
//     soalIndex, pilihan, nama, pada   (1 dok per siswa = tulis murah)
//
// Hemat kuota: listener onSnapshot HANYA saat sesi aktif & hanya
// pada dokumen kecil di atas; posisi guru ditulis per klik navigasi
// (bukan per scroll).
// ============================================================
import { db } from '../firebase';
import {
  collection, doc, getDocs, query, setDoc, where, limit,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';

export const KOL_SESI = 'sesi_presentasi';

const bacaGuru = () => {
  try {
    const d = JSON.parse(localStorage.getItem('teacherData') || '{}');
    return {
      guruId: d.guruId || d.id || d.nama || 'guru',
      guruNama: d.nama || d.teacherName || 'Guru Gemilang',
    };
  } catch {
    return { guruId: 'guru', guruNama: 'Guru Gemilang' };
  }
};

/** Cari satu sesi aktif (terbaru). Return null bila tidak ada. */
export async function cariSesiAktif() {
  try {
    const snap = await getDocs(
      query(collection(db, KOL_SESI), where('status', '==', 'aktif'), limit(1))
    );
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (e) {
    console.warn('Gagal cari sesi aktif:', e);
    return null;
  }
}

/** Matikan sesi aktif milik guru ini (mis. buka sesi baru). */
export async function tutupSesiAktifGuruLain() {
  try {
    const snap = await getDocs(
      query(collection(db, KOL_SESI), where('status', '==', 'aktif'), limit(5))
    );
    const janji = [];
    snap.docs.forEach((d) => {
      janji.push(setDoc(doc(db, KOL_SESI, d.id),
        { status: 'selesai', diupdatePada: serverTimestamp() }, { merge: true }));
    });
    await Promise.all(janji);
  } catch (e) {
    console.warn('Gagal tutup sesi lama:', e);
  }
}

/** Mulai sesi baru di satu bab. Return sessionId. */
export async function mulaiSesi(materiId, babId) {
  await tutupSesiAktifGuruLain();
  const { guruId, guruNama } = bacaGuru();
  const id = `${guruId}_${Date.now()}`;
  await setDoc(doc(db, KOL_SESI, id), {
    materiId, babId,
    posisi: { jenis: 'section', index: 0 },
    mode: 'mengikuti',
    status: 'aktif',
    guruId, guruNama,
    dibukaPada: serverTimestamp(),
    diupdatePada: serverTimestamp(),
  });
  return id;
}

/** Akhiri sesi (status selesai). */
export async function akhiriSesi(sessionId) {
  await setDoc(doc(db, KOL_SESI, sessionId),
    { status: 'selesai', diupdatePada: serverTimestamp() }, { merge: true });
}

/** Ganti posisi tayang guru (section / kuis). */
export async function setPosisiSesi(sessionId, posisi) {
  await setDoc(doc(db, KOL_SESI, sessionId),
    { posisi, diupdatePada: serverTimestamp() }, { merge: true });
}

/** Ganti mode: 'mengikuti' (siswa ikut layar guru) | 'bebas'. */
export async function setModeSesi(sessionId, mode) {
  await setDoc(doc(db, KOL_SESI, sessionId),
    { mode, diupdatePada: serverTimestamp() }, { merge: true });
}

/** Langganan realtime dokumen sesi. Return unsubscribe. */
export function pantauSesi(sessionId, cb) {
  return onSnapshot(doc(db, KOL_SESI, sessionId), (sn) => {
    cb(sn.exists() ? { id: sn.id, ...sn.data() } : null);
  }, (e) => console.warn(' pantau sesi gagal:', e));
}

/** Siswa menandai ikut sesi (dok peserta, tulis sekali). */
export async function tandaiPeserta(sessionId) {
  const studentId = localStorage.getItem('studentId') || '';
  if (!studentId) return;
  const nama = localStorage.getItem('studentName') || 'Siswa';
  await setDoc(doc(db, KOL_SESI, sessionId, 'peserta', studentId),
    { nama, pada: serverTimestamp() }, { merge: true });
}

/** Langganan daftar peserta. Return unsubscribe. */
export function pantauPeserta(sessionId, cb) {
  return onSnapshot(collection(db, KOL_SESI, sessionId, 'peserta'), (sn) => {
    const list = sn.docs.map((d) => ({ id: d.id, ...d.data() }));
    cb(list);
  }, (e) => console.warn('pantau peserta gagal:', e));
}

/** Siswa kirim jawaban latihan bersama (1 dok per siswa, merge). */
export async function kirimJawabanLive(sessionId, soalIndex, pilihan) {
  const studentId = localStorage.getItem('studentId') || '';
  if (!studentId) return;
  const nama = localStorage.getItem('studentName') || 'Siswa';
  await setDoc(doc(db, KOL_SESI, sessionId, 'jawaban', studentId),
    { soalIndex, pilihan, nama, pada: serverTimestamp() }, { merge: true });
}

/** Langganan jawaban live (guru). Return unsubscribe. */
export function pantauJawaban(sessionId, cb) {
  return onSnapshot(collection(db, KOL_SESI, sessionId, 'jawaban'), (sn) => {
    cb(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (e) => console.warn('pantau jawaban gagal:', e));
}
