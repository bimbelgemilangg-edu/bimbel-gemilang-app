// src/services/sesiService.js
// Lapisan service untuk SESI KELAS (collection: sesi_live) — struktur yang
// SUDAH dipakai LiveSessionTeacher.jsx & LiveSessionStudent.jsx, ditambah:
//  - sumber sesi dari bab buku digital (bukuId/babId, sumber:'buku')
//  - absensi guru (absensiGuru.mulaiAt/selesaiAt) & absensi siswa (statusHadir)
//  - kontrol lockstep (tayangkanSoal / bukaPembahasan / lanjutSoal / akhiri)
//  - helper rekap jawaban & rekap absensi untuk layar pembahasan guru.
// Tidak ada collection baru, tidak ada struktur baru yang memutus kode lama.
import {
  collection, doc, setDoc, updateDoc, addDoc,
  query, where, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// ---------------- PEMBUATAN SESI ----------------
// sumber: 'bank_soal' (alur lama) | 'buku' (bab buku digital, daftarSoal
// diisi hasil parse bab.html yang sudah dinormalisasi lewat soalBukuKeFormatSesi)
export async function mulaiSesi({
  guruId, kelasSekolah, mataPelajaran, materiJudul,
  daftarSoal, sumber, bukuId, babId,
}) {
  const ref = await addDoc(collection(db, 'sesi_live'), {
    guruId: guruId || '',
    kelasSekolah: kelasSekolah || '',
    mataPelajaran: mataPelajaran || '',
    materiJudul: materiJudul || '',
    daftarSoal: daftarSoal || [],
    sumber: sumber || 'bank_soal',
    bukuId: bukuId || '',
    babId: babId || '',
    indexSekarang: 0,
    tahap: 'soal', // 'soal' | 'pembahasan'
    status: 'aktif',
    absensiGuru: { mulaiAt: serverTimestamp(), selesaiAt: null },
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

// Normalisasi soal hasil parse bab.html agar BENTUKNYA sama dengan soal
// bank_soal yang sudah dipahami LiveSessionStudent:
// { soal, opsiJawaban, kunciJawaban, pembahasan, tipe, pernyataan? }
export function soalBukuKeFormatSesi(s) {
  const langkah = (s.langkah || []).join(' ');
  if (s.tipe === 'bs') {
    return {
      tipe: 'benar_salah',
      soal: s.teks || '',
      pernyataan: s.pernyataan || [],
      kunciJawaban: s.kunci && Array.isArray(s.kunci.bs) ? s.kunci.bs : [],
      pembahasan: langkah,
    };
  }
  if (s.tipe === 'multi') {
    return {
      tipe: 'pg_kompleks',
      soal: s.teks || '',
      opsiJawaban: s.pilihan || [],
      kunciJawaban: s.kunci && Array.isArray(s.kunci.multi) ? s.kunci.multi : [],
      pembahasan: langkah,
    };
  }
  return {
    tipe: 'pg_sederhana',
    soal: s.teks || '',
    opsiJawaban: s.pilihan || [],
    kunciJawaban: s.kunci && typeof s.kunci.pg === 'number' ? s.kunci.pg : 0,
    pembahasan: langkah,
  };
}

// ---------------- LISTENER REAL-TIME ----------------
export const dengarSesiAktifKelas = (kelasSekolah, cb) =>
  onSnapshot(
    query(
      collection(db, 'sesi_live'),
      where('kelasSekolah', '==', kelasSekolah),
      where('status', '==', 'aktif')
    ),
    (snap) => cb(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
  );

export const dengarSesi = (sesiId, cb) =>
  onSnapshot(doc(db, 'sesi_live', sesiId), (snap) =>
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  );

export const dengarPeserta = (sesiId, cb) =>
  onSnapshot(collection(db, 'sesi_live', sesiId, 'peserta'), (snap) => {
    const map = {};
    snap.forEach((d) => { map[d.id] = { id: d.id, ...d.data() }; });
    cb(map);
  });

// ---------------- ABSENSI ----------------
// Siswa join = tercatat hadir (bisa diubah guru jadi izin/absen).
export async function gabungSesi(sesiId, studentId, nama, statusHadir = 'hadir') {
  await setDoc(
    doc(db, 'sesi_live', sesiId, 'peserta', studentId),
    { nama: nama || '', statusHadir, waktuHadir: serverTimestamp() },
    { merge: true }
  );
}

export async function setHadirSiswa(sesiId, studentId, statusHadir) {
  await setDoc(
    doc(db, 'sesi_live', sesiId, 'peserta', studentId),
    { statusHadir, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function tutupAbsensiGuru(sesiId) {
  await updateDoc(doc(db, 'sesi_live', sesiId), {
    'absensiGuru.selesaiAt': serverTimestamp(),
  });
}

export function rekapAbsensi(pesertaMap) {
  const daftar = Object.values(pesertaMap || {});
  const hitung = { hadir: 0, izin: 0, absen: 0, belum: 0, total: daftar.length };
  daftar.forEach((p) => {
    if (p.statusHadir === 'hadir') hitung.hadir++;
    else if (p.statusHadir === 'izin') hitung.izin++;
    else if (p.statusHadir === 'absen') hitung.absen++;
    else hitung.belum++;
  });
  return hitung;
}

// ---------------- KONTROL LOCKSTEP GURU ----------------
export const tayangkanSoal = (sesiId, index) =>
  updateDoc(doc(db, 'sesi_live', sesiId), { indexSekarang: Number(index), tahap: 'soal' });

export const bukaPembahasan = (sesiId) =>
  updateDoc(doc(db, 'sesi_live', sesiId), { tahap: 'pembahasan' });

export const lanjutSoal = (sesiId, index) =>
  updateDoc(doc(db, 'sesi_live', sesiId), { indexSekarang: Number(index), tahap: 'soal' });

export async function akhiriSesi(sesiId) {
  await updateDoc(doc(db, 'sesi_live', sesiId), {
    status: 'selesai',
    'absensiGuru.selesaiAt': serverTimestamp(),
    selesaiAt: serverTimestamp(),
  });
}

// ---------------- JAWABAN SISWA ----------------
// Menulis ke field jawabanPerSoal.{index} di dokumen peserta — format yang
// SUDAH dibaca LiveSessionTeacher (ringkasan sudahJawab/benar real-time).
export async function kirimJawaban(sesiId, studentId, nama, indexSoal, pilihan, benar) {
  await setDoc(
    doc(db, 'sesi_live', sesiId, 'peserta', studentId),
    {
      nama: nama || '',
      [`jawabanPerSoal.${indexSoal}`]: { pilihan, benar: !!benar, waktu: serverTimestamp() },
    },
    { merge: true }
  );
}

// ---------------- REKAP UNTUK LAYAR PEMBAHASAN ----------------
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