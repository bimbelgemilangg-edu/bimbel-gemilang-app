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
  collection, doc, getDoc, getDocs, query, setDoc, where, limit,
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

// ============================================================
// ANTREAN MAJU ("courage queue" v2) -- siswa sukarela maju,
// tentor memanggil & memberi reward XP manual.
//   sesi_presentasi/{sid}/antrean/{studentId}
//     nama, pada, status: 'menunggu'|'dipanggil'|'diberi'|'selesai',
//     xpDiberi (opsional)
// ============================================================

/** Siswa menekan tombol "Coba Maju". */
export async function antreMaju(sessionId) {
  const studentId = localStorage.getItem('studentId') || '';
  if (!studentId) return;
  const nama = localStorage.getItem('studentName') || 'Siswa';
  await setDoc(doc(db, KOL_SESI, sessionId, 'antrean', studentId), {
    nama, pada: serverTimestamp(), status: 'menunggu',
  }, { merge: true });
}

/** Siswa batal antre. */
export async function batalAntre(sessionId) {
  const studentId = localStorage.getItem('studentId') || '';
  if (!studentId) return;
  await setDoc(doc(db, KOL_SESI, sessionId, 'antrean', studentId), {
    status: 'selesai',
  }, { merge: true });
}

/** Langganan antrean saya sendiri (siswa). Return unsubscribe. */
export function pantauAntreanSaya(sessionId, studentId, cb) {
  return onSnapshot(doc(db, KOL_SESI, sessionId, 'antrean', studentId), (sn) => {
    cb(sn.exists() ? sn.data() : null);
  }, (e) => console.warn('pantau antrean saya gagal:', e));
}

/** Langganan seluruh antrean (guru). Return unsubscribe. */
export function pantauAntrean(sessionId, cb) {
  return onSnapshot(collection(db, KOL_SESI, sessionId, 'antrean'), (sn) => {
    cb(sn.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (e) => console.warn('pantau antrean gagal:', e));
}

/** Guru mengubah status antrean (+ catatan XP bila diberi). */
export async function setStatusAntrean(sessionId, studentId, status, xpDiberi = 0) {
  await setDoc(doc(db, KOL_SESI, sessionId, 'antrean', studentId), {
    status, ...(xpDiberi ? { xpDiberi } : {}),
  }, { merge: true });
}

/**
 * Guru memberi XP manual -> masuk ke toko XP RESMI aplikasi
 * (`siswa_progress/{studentId}.xp`, dibaca Dashboard & leaderboard),
 * pola baca-lalu-merge sama seperti tambahXp di BukuBacaPage.
 */
export async function beriXpGuru(studentId, xp) {
  if (!studentId || xp <= 0) return;
  const ref = doc(db, 'siswa_progress', studentId);
  const snap = await getDoc(ref);
  const ex = snap.exists() ? snap.data() : { xp: 0 };
  await setDoc(ref, {
    xp: (Number(ex.xp) || 0) + xp,
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
