// src/services/sesiService.js
// Service SESI LIVE (collection: sesi_live) -- dipakai ClassSession (guru)
// dan LiveSessionStudent (siswa). Struktur dokumen SAMA dengan yang sudah
// dipakai LiveSessionTeacher lama, jadi tidak ada migrasi data.
import {
  collection, doc, setDoc, updateDoc, addDoc,
  query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ---------- BUAT & LISTEN SESI ----------
export async function buatSesiLive({ jadwalId, guruId, kelasSekolah, mataPelajaran, materiJudul, bukuId, babId, daftarSoal }) {
  const ref = await addDoc(collection(db, 'sesi_live'), {
    jadwalId: jadwalId || '', guruId: guruId || '', kelasSekolah: kelasSekolah || '',
    mataPelajaran: mataPelajaran || '', materiJudul: materiJudul || '',
    sumber: 'buku', bukuId: bukuId || '', babId: babId || '',
    daftarSoal: daftarSoal || [], indexSekarang: null, tahap: 'materi', status: 'aktif',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}
export const dengarSesiByJadwal = (jadwalId, cb) =>
  onSnapshot(
    query(collection(db, 'sesi_live'), where('jadwalId', '==', jadwalId), where('status', '==', 'aktif')),
    (sn) => cb(sn.empty ? null : { id: sn.docs[0].id, ...sn.docs[0].data() })
  );
export const dengarSesiAktifKelas = (kelasSekolah, cb) =>
  onSnapshot(
    query(collection(db, 'sesi_live'), where('kelasSekolah', '==', kelasSekolah), where('status', '==', 'aktif')),
    (sn) => cb(sn.empty ? null : { id: sn.docs[0].id, ...sn.docs[0].data() })
  );
export const dengarSesi = (sesiId, cb) =>
  onSnapshot(doc(db, 'sesi_live', sesiId), (sn) => cb(sn.exists() ? { id: sn.id, ...sn.data() } : null));
export const dengarPeserta = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_live', sesiId, 'peserta'), (sn) => {
    const m = {};
    sn.forEach((d) => { m[d.id] = { id: d.id, ...d.data() }; });
    cb(m);
  });

// ---------- KONTROL GURU ----------
export const ubahSesi = (sesiId, patch) => updateDoc(doc(db, 'sesi_live', sesiId), { ...patch, updatedAt: serverTimestamp() });
export const tayangkanMateri = (sesiId) => ubahSesi(sesiId, { tahap: 'materi' });
export const tayangkanSoal = (sesiId, index) => ubahSesi(sesiId, { indexSekarang: Number(index), tahap: 'soal' });
export const bukaPembahasan = (sesiId) => ubahSesi(sesiId, { tahap: 'pembahasan' });
export const akhiriSesiLive = (sesiId) => ubahSesi(sesiId, { status: 'selesai' });

// ---------- SISWA ----------
export async function gabungSesiLive(sesiId, studentId, nama) {
  await setDoc(doc(db, 'sesi_live', sesiId, 'peserta', studentId),
    { nama: nama || '', joinAt: serverTimestamp() }, { merge: true });
}
export async function kirimJawabanLive(sesiId, studentId, nama, indexSoal, pilihan, benar) {
  await setDoc(doc(db, 'sesi_live', sesiId, 'peserta', studentId), {
    nama: nama || '',
    [`jawabanPerSoal.${indexSoal}`]: { pilihan, benar: !!benar, waktu: serverTimestamp() },
  }, { merge: true });
}

// ---------- REKAP ----------
export function hitungRekap(pesertaMap, indexSoal) {
  const daftar = Object.values(pesertaMap || {});
  let sudahJawab = 0, benar = 0;
  const distribusi = {};
  daftar.forEach((p) => {
    const j = p.jawabanPerSoal ? p.jawabanPerSoal[indexSoal] : undefined;
    if (j !== undefined) {
      sudahJawab++;
      if (j.benar) benar++;
      const k = JSON.stringify(j.pilihan);
      distribusi[k] = (distribusi[k] || 0) + 1;
    }
  });
  return { totalSiswa: daftar.length, sudahJawab, benar, distribusi };
}
export function soalPalingSalah(pesertaMap, jumlahSoal) {
  const hasil = [];
  for (let i = 0; i < jumlahSoal; i++) {
    const r = hitungRekap(pesertaMap, i);
    hasil.push({ index: i, ...r, salah: r.sudahJawab - r.benar });
  }
  return hasil.sort((a, b) => b.salah - a.salah || b.sudahJawab - a.sudahJawab);
}