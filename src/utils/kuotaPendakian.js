// src/utils/kuotaPendakian.js
// ============================================================
// UTILITAS KUOTA PENDAKIAN MINGGUAN & POSISI TEMAN SEKELAS
// 1. Menjaga stok Bank Soal agar siswa tidak menghabiskan seluruh
//    unit pendakian dalam satu hari (maksimal 2x pendakian per minggu).
// 2. Menghitung posisi Pos pendakian teman sekelas (aktif & tidak terblokir)
//    untuk ditampilkan sebagai bubble foto motivasi di Peta Gunung.
// ============================================================

import { collection, getDocs, query, where } from 'firebase/firestore';
import { isAkunBelajarAktif } from './statusAkunSiswa';
import { deteksiJenjangUjianAkhir } from './jalurUjianAiConfig';

export const MAKS_PENDAKIAN_PER_MINGGU = 2;

/** Mengembalikan timestamp awal minggu ini (Senin 00:00:00 waktu lokal) dan akhir minggu */
export function rentangMingguIniMs(sekarangMs = Date.now()) {
  const d = new Date(sekarangMs);
  const day = d.getDay(); // 0=Min, 1=Sen, ... 6=Sab
  const diffKeSenin = day === 0 ? -6 : 1 - day;
  const senin = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diffKeSenin, 0, 0, 0, 0);
  const seninDepan = new Date(senin.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sisaHari = Math.max(1, Math.ceil((seninDepan.getTime() - sekarangMs) / (24 * 60 * 60 * 1000)));
  return {
    awalMs: senin.getTime(),
    akhirMs: seninDepan.getTime(),
    sisaHariReset: sisaHari,
    labelReset: sisaHari === 1 ? 'Besok (Senin)' : `${sisaHari} hari lagi (Senin depan)`,
  };
}

function ekstrakWaktuMs(val) {
  if (!val) return null;
  if (typeof val?.toDate === 'function') return val.toDate().getTime();
  if (typeof val === 'number') return val;
  const t = new Date(val).getTime();
  return Number.isNaN(t) ? null : t;
}

/**
 * Menghitung pemakaian kuota pendakian minggu ini (maksimal 2x/minggu).
 */
export function hitungKuotaPendakianMingguIni(sesiList = [], daftarUnit = [], sekarangMs = Date.now()) {
  const { awalMs, akhirMs, sisaHariReset, labelReset } = rentangMingguIniMs(sekarangMs);
  const unitIdSet = new Set((daftarUnit || []).filter((u) => u.tipe !== 'review').map((u) => u.id));

  const sesiMingguIni = new Set();
  (sesiList || []).forEach((s) => {
    if (s.status !== 'selesai') return;
    const isRoadmap = Boolean(s.jalurUjianAi) || unitIdSet.has(s.paketId) || unitIdSet.has(s.unitId) || unitIdSet.has(s.tryoutId);
    if (!isRoadmap) return;

    const wMs = ekstrakWaktuMs(s.waktuSelesai) || ekstrakWaktuMs(s.updatedAt) || ekstrakWaktuMs(s.createdAt);
    if (wMs !== null && wMs >= awalMs && wMs < akhirMs) {
      const key = s.unitId || s.paketId || s.tryoutId || s.id;
      if (key) sesiMingguIni.add(key);
    }
  });

  const terpakai = sesiMingguIni.size;
  const sisa = Math.max(0, MAKS_PENDAKIAN_PER_MINGGU - terpakai);

  return {
    terpakai,
    maksimal: MAKS_PENDAKIAN_PER_MINGGU,
    sisa,
    terkunciMingguIni: terpakai >= MAKS_PENDAKIAN_PER_MINGGU,
    sisaHariReset,
    labelReset,
  };
}

/**
 * Memuat daftar teman sejenjang (9 SMP atau 12 SMA) yang aktif & tidak terblokir,
 * beserta posisi Pos pendakian mereka saat ini (1..totalUnit+1).
 */
export async function muatPosisiTemanPendakian(db, {
  jenjangTarget = 'SMP',
  myStudentId = '',
  myStudentDocId = '',
  daftarUnit = [],
}) {
  const totalPos = (daftarUnit || []).filter((u) => u.tipe !== 'review').length || 8;
  const unitIdKeNomor = new Map();
  (daftarUnit || []).forEach((u) => {
    if (u.tipe !== 'review' && u.unitNomor) {
      unitIdKeNomor.set(u.id, Number(u.unitNomor));
      if (u.paketIdAsli) unitIdKeNomor.set(u.paketIdAsli, Number(u.unitNomor));
    }
  });

  const [snapSiswa, snapSesi] = await Promise.all([
    getDocs(collection(db, 'students')),
    getDocs(query(collection(db, 'tryout_sesi'), where('status', '==', 'selesai'))),
  ]);

  // Peta unit tertinggi yang sudah diselesaikan per studentId / docId
  const maxUnitPerSiswa = new Map();
  const skorTerakhirPerSiswa = new Map();
  snapSesi.forEach((d) => {
    const s = d.data();
    const nomor =
      (s.unitNomor != null && s.jalurUjianAi ? Number(s.unitNomor) : null) ||
      unitIdKeNomor.get(s.unitId) ||
      unitIdKeNomor.get(s.paketId) ||
      unitIdKeNomor.get(s.tryoutId) ||
      null;
    if (!nomor) return;

    const keys = [s.studentId, s.studentDocId, s.uid].filter(Boolean);
    keys.forEach((k) => {
      const prev = maxUnitPerSiswa.get(k) || 0;
      if (nomor > prev) {
        maxUnitPerSiswa.set(k, nomor);
        skorTerakhirPerSiswa.set(k, s.totalSkorPersen ?? null);
      }
    });
  });

  const temanList = [];
  snapSiswa.forEach((d) => {
    const dt = { id: d.id, ...d.data() };
    // Pastikan siswa aktif & tidak terblokir / habis masa paket
    if (!isAkunBelajarAktif(dt)) return;
    // Kecualikan diri sendiri
    if ((myStudentDocId && d.id === myStudentDocId) || (myStudentId && dt.studentId === myStudentId)) return;

    // Cocokkan jenjang ujian akhir (9 SMP atau 12 SMA)
    const targetTeman = deteksiJenjangUjianAkhir(dt);
    if (!targetTeman || targetTeman.jenjang !== jenjangTarget) return;

    const unitSelesai = Math.max(
      maxUnitPerSiswa.get(d.id) || 0,
      maxUnitPerSiswa.get(dt.studentId) || 0,
    );
    // Hanya tampilkan bubble avatar teman jika sudah pernah mengerjakan minimal 1 latihan/pendakian
    if (unitSelesai <= 0) return;
    const posSekarang = Math.min(totalPos + 1, unitSelesai);

    temanList.push({
      id: d.id,
      studentId: dt.studentId || d.id,
      nama: dt.nama || 'Siswa Gemilang',
      fotoUrl: dt.fotoUrl || dt.photoUrl || dt.foto || dt.avatarUrl || '',
      kelas: dt.kelasSekolah || dt.kelas || '',
      unitSelesai,
      posSekarang,
      skorTerakhir: skorTerakhirPerSiswa.get(dt.studentId) ?? skorTerakhirPerSiswa.get(d.id) ?? null,
    });
  });

  // Kelompokkan per posSekarang, urutkan yang paling tinggi duluan
  const perPos = new Map();
  temanList.forEach((t) => {
    if (!perPos.has(t.posSekarang)) perPos.set(t.posSekarang, []);
    perPos.get(t.posSekarang).push(t);
  });

  return { temanList, perPos };
}

export default {
  MAKS_PENDAKIAN_PER_MINGGU,
  rentangMingguIniMs,
  hitungKuotaPendakianMingguIni,
  muatPosisiTemanPendakian,
};
