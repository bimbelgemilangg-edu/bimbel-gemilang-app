// src/services/dataTargetKampus.js
// ============================================================
// Pengambil data target kampus untuk sisi siswa + cache per sesi.
//
// 🔥 DIPISAH DARI components/BannerTargetSiswa.jsx (2026-10-10): rule CI
// react-refresh/only-export-components mewajibkan berkas komponen hanya
// berisi komponen, supaya Fast Refresh tidak rusak saat development.
// Loader + hook hidup di sini; komponen tetap di berkas komponen.
//
// Pembacaan sengaja kecil dan di-cache: 1 dokumen target + 1-2 dokumen prodi
// + 1 dokumen sakelar fitur. BUKAN penyapuan koleksi -- proyek ini pernah
// kena 429 RESOURCE_EXHAUSTED karena pola itu (kepala utils/keputusanMuat.js).
// ============================================================
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fiturAktifUntuk } from './sakelarFiturService';
import { susunPerbandingan } from '../utils/targetKampus';
import { layakTampilTarget } from '../utils/bannerTargetSiswa';

const cacheData = new Map();

/**
 * Muat dokumen target + prodi pilihannya. Di-cache supaya chip dan kartu di
 * halaman yang sama tidak menembak Firestore dua kali.
 */
export function muatDataTargetKampus(studentId) {
  if (!studentId) return Promise.resolve(null);
  if (cacheData.has(studentId)) return cacheData.get(studentId);
  const janji = (async () => {
    try {
      const snapTarget = await getDoc(doc(db, 'target_kampus_siswa', studentId));
      if (!snapTarget.exists()) return null;
      const target = { id: snapTarget.id, ...snapTarget.data() };
      const prodi = {};
      for (const p of target.pilihan || []) {
        if (!p?.idPtn || !p?.idProdi) continue;
        const snapProdi = await getDoc(doc(db, 'ptn', p.idPtn, 'prodi', p.idProdi));
        if (snapProdi.exists()) prodi[`${p.idPtn}|${p.idProdi}`] = { id: snapProdi.id, ...snapProdi.data() };
      }
      return { target, prodi };
    } catch (e) {
      console.warn('[dataTargetKampus] gagal memuat target:', e?.message || e);
      return null;
    }
  })();
  cacheData.set(studentId, janji);
  return janji;
}

/** Buang cache -- dipanggil setelah admin menyimpan target baru. */
export function segarkanDataTargetKampus(studentId) {
  if (studentId) cacheData.delete(studentId);
  else cacheData.clear();
}

/**
 * Hook kelayakan + data target untuk siswa ini. Dipakai banner, kartu, dan
 * sidebar: SEMUA pintu tampilan siswa bertanya ke satu fungsi ini, supaya
 * tidak ada satu pun yang lupa pagarnya.
 */
export function useDataTargetKampus(studentId, profil) {
  const [keadaan, setKeadaan] = useState({ status: 'muat' });
  useEffect(() => {
    let hidup = true;
    (async () => {
      if (!studentId) { setKeadaan({ status: 'nol' }); return; }
      const [data, fitur] = await Promise.all([
        muatDataTargetKampus(studentId),
        fiturAktifUntuk('targetKampus', {
          studentId,
          kelasSekolah: profil?.kelasSekolah || profil?.kelas || '',
        }),
      ]);
      if (!hidup) return;
      if (!data) { setKeadaan({ status: 'nol' }); return; }
      const cek = layakTampilTarget({
        fiturAktif: fitur.aktif,
        jenjang: profil?.jenjang,
        kelasSekolah: profil?.kelasSekolah || profil?.kelas,
        target: data.target,
      });
      if (!cek.layak) { setKeadaan({ status: 'nol', alasan: cek.alasan }); return; }
      const perbandingan = susunPerbandingan(
        data.target, data.prodi, data.target?.skorTerakhirUtbk?.nilai ?? null,
      );
      setKeadaan({ status: 'siap', target: data.target, perbandingan });
    })();
    return () => { hidup = false; };
  }, [studentId, profil?.kelasSekolah, profil?.kelas, profil?.jenjang]);
  return keadaan;
}

export default { muatDataTargetKampus, segarkanDataTargetKampus, useDataTargetKampus };
