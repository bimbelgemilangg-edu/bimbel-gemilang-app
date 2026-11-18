// src/services/targetKampusService.js
// ============================================================
// Service Target Kampus Siswa SMA (Berbasis Data AmbisPTN 1:1)
// Mengelola 173 PTN, 4.594 Program Studi, dan Penyimpanan Pilihan 1 & 2
// ============================================================
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getLogoPtn } from '../utils/logoPtnHelper';
import {
  getDaftarPtnAmbis,
  getDaftarProdiAmbis,
  getPtnBySlug,
  hitungGapTarget,
} from '../utils/ambisPtnDataHelper';

export {
  getDaftarPtnAmbis,
  getDaftarProdiAmbis,
  getPtnBySlug,
  hitungGapTarget,
};

/**
 * Mengambil data target kampus siswa dari Firestore / LocalStorage
 */
export async function ambilTargetSiswa(studentId) {
  if (!studentId) return ambilTargetLokal();

  try {
    const snap = await getDoc(doc(db, 'siswa_target_kampus', studentId));
    if (snap.exists()) {
      const data = snap.data();
      simpanTargetLokal(data);
      return data;
    }
  } catch (err) {
    console.warn('[targetKampusService] Gagal ambil Firestore, pakai fallback lokal:', err);
  }

  return ambilTargetLokal();
}

/**
 * Menyimpan pilihan target kampus siswa (Pilihan 1 atau 2)
 */
export async function simpanPilihanTarget(studentId, pilihanKe, majorData) {
  const targetLama = ambilTargetLokal() || {};
  const pilihanKey = `pilihan${pilihanKe}`;

  const passingScore = Number(majorData.passing_score || majorData.passingScore || 700);
  const capacity = Number(majorData.capacity || majorData.dayaTampung?.nilai || 50);
  const selectivity = Number(majorData.selectivity || majorData.keketatan || 0.03);
  const estPeminat = Math.round(capacity / (selectivity || 0.03));

  const logoUrl = getLogoPtn({
    singkatan: majorData.uni_short || majorData.uniShort,
    nama: majorData.uni_name || majorData.uniName,
    slug: majorData.uni_slug || majorData.uniSlug,
    logo_url: majorData.uni_logo || majorData.uniLogo,
  });

  const dataPilihan = {
    majorId: majorData.id || majorData.majorId,
    majorSlug: majorData.slug || majorData.majorSlug,
    majorName: majorData.name || majorData.majorName || majorData.namaProdi,
    uniSlug: majorData.uni_slug || majorData.uniSlug,
    uniName: majorData.uni_name || majorData.uniName || majorData.namaPtn,
    uniShort: majorData.uni_short || majorData.uniShort || '',
    uniLogo: logoUrl,
    degreeType: majorData.degree_type || majorData.degreeType || 'Sarjana',
    rumpun: majorData.rumpun || 'saintek',
    rumpunLabel: majorData.rumpun_label || majorData.rumpunLabel || (majorData.rumpun === 'soshum' ? 'Soshum' : 'Saintek'),
    accreditation: majorData.accreditation || 'Unggul',
    capacity,
    passingScore,
    selectivity,
    peminatCount: estPeminat,

    // Backward compatibility untuk komponen lama
    idProdi: majorData.slug || String(majorData.id),
    idPtn: majorData.uni_slug || String(majorData.uni_short),
    namaProdi: majorData.name || majorData.majorName || majorData.namaProdi,
    namaPtn: majorData.uni_name || majorData.uniName || majorData.namaPtn,
    skorAcuan: passingScore,
    dayaTampung: { nilai: capacity },
    peminat: { nilai: estPeminat },
    keketatan: selectivity,
  };

  const targetBaru = {
    ...targetLama,
    [pilihanKey]: dataPilihan,
    updatedAt: new Date().toISOString(),
  };

  simpanTargetLokal(targetBaru);

  // Trigger reactive update across tabs / components
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TARGET_EVENT, { detail: targetBaru }));
  }

  if (studentId) {
    try {
      await setDoc(doc(db, 'siswa_target_kampus', studentId), targetBaru, { merge: true });
    } catch (err) {
      console.warn('[targetKampusService] Gagal simpan ke Firestore, data tersimpan di lokal:', err);
    }
  }

  return targetBaru;
}

/**
 * Menghapus pilihan target kampus siswa (Pilihan 1 atau 2)
 */
export async function hapusPilihanTarget(studentId, pilihanKe) {
  const targetLama = ambilTargetLokal() || {};
  const pilihanKey = `pilihan${pilihanKe}`;

  delete targetLama[pilihanKey];
  targetLama.updatedAt = new Date().toISOString();

  simpanTargetLokal(targetLama);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TARGET_EVENT, { detail: targetLama }));
  }

  if (studentId) {
    try {
      await setDoc(doc(db, 'siswa_target_kampus', studentId), targetLama);
    } catch (err) {
      console.warn('[targetKampusService] Gagal update hapus Firestore:', err);
    }
  }

  return targetLama;
}

function simpanTargetLokal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function ambilTargetLokal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Hook React untuk memantau target kampus siswa secara real-time
 */
export function useTargetKampusSiswa(studentId) {
  const [target, setTarget] = useState(() => ambilTargetLokal());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let aktif = true;
    async function muat() {
      const data = await ambilTargetSiswa(studentId);
      if (aktif) {
        setTarget(data);
        setLoading(false);
      }
    }
    muat();

    const handleEvent = (e) => {
      if (aktif) setTarget(e.detail || ambilTargetLokal());
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(TARGET_EVENT, handleEvent);
    }

    return () => {
      aktif = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(TARGET_EVENT, handleEvent);
      }
    };
  }, [studentId]);

  return { target, loading, setTarget };
}
