// src/services/dataTargetKampus.js
// ============================================================
// Pengambil data target kampus untuk sisi siswa + cache per sesi.
// Terintegrasi penuh dengan targetKampusService (AmbisPTN 1:1)
// ============================================================
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { fiturAktifUntuk } from './sakelarFiturService';
import { susunPerbandingan } from '../utils/targetKampus';
import { layakTampilTarget } from '../utils/bannerTargetSiswa';
import { ambilTargetSiswa, ambilTargetLokal } from './targetKampusService';

const cacheData = new Map();

/**
 * Muat dokumen target + prodi pilihannya. Di-cache supaya chip dan kartu di
 * halaman yang sama tidak menembak Firestore dua kali.
 */
export async function muatDataTargetKampus(studentId) {
  if (!studentId) return null;
  if (cacheData.has(studentId)) return cacheData.get(studentId);

  const janji = (async () => {
    try {
      // 1. Coba ambil dari koleksi baru AmbisPTN siswa_target_kampus
      const ambisData = await ambilTargetSiswa(studentId);
      if (ambisData && (ambisData.pilihan1 || ambisData.pilihan2)) {
        const pilihanArr = [];
        const prodiMap = {};

        if (ambisData.pilihan1) {
          const p1 = ambisData.pilihan1;
          const key1 = `${p1.idPtn || p1.uniSlug}|${p1.idProdi || p1.majorSlug}`;
          pilihanArr.push({ urutan: 1, idPtn: p1.idPtn || p1.uniSlug, idProdi: p1.idProdi || p1.majorSlug, labelPribadi: 'impian' });
          prodiMap[key1] = {
            id: p1.idProdi || p1.majorSlug,
            idPtn: p1.idPtn || p1.uniSlug,
            namaPtn: p1.namaPtn || p1.uniName,
            namaProdi: p1.namaProdi || p1.majorName,
            dayaTampung: { nilai: p1.capacity || p1.dayaTampung?.nilai || 50 },
            peminat: { nilai: p1.peminatCount || p1.peminat?.nilai || 1500 },
            keketatan: p1.selectivity || 0.03,
            skorReferensi: {
              minimum: { nilai: p1.passingScore || p1.skorAcuan || 700, statusData: 'resmi' },
              rataRata: { nilai: (p1.passingScore || 700) + 15, statusData: 'resmi' },
              maksimum: { nilai: (p1.passingScore || 700) + 40, statusData: 'resmi' },
            },
            syaratKhusus: 'Tidak Ada Syarat Khusus',
            subtesKunci: 'Penalaran Umum & Pengetahuan Kuantitatif',
            logoUrl: p1.uniLogo,
          };
        }

        if (ambisData.pilihan2) {
          const p2 = ambisData.pilihan2;
          const key2 = `${p2.idPtn || p2.uniSlug}|${p2.idProdi || p2.majorSlug}`;
          pilihanArr.push({ urutan: 2, idPtn: p2.idPtn || p2.uniSlug, idProdi: p2.idProdi || p2.majorSlug, labelPribadi: 'cadangan' });
          prodiMap[key2] = {
            id: p2.idProdi || p2.majorSlug,
            idPtn: p2.idPtn || p2.uniSlug,
            namaPtn: p2.namaPtn || p2.uniName,
            namaProdi: p2.namaProdi || p2.majorName,
            dayaTampung: { nilai: p2.capacity || p2.dayaTampung?.nilai || 50 },
            peminat: { nilai: p2.peminatCount || p2.peminat?.nilai || 1500 },
            keketatan: p2.selectivity || 0.03,
            skorReferensi: {
              minimum: { nilai: p2.passingScore || p2.skorAcuan || 650, statusData: 'resmi' },
              rataRata: { nilai: (p2.passingScore || 650) + 15, statusData: 'resmi' },
              maksimum: { nilai: (p2.passingScore || 650) + 35, statusData: 'resmi' },
            },
            syaratKhusus: 'Tidak Ada Syarat Khusus',
            subtesKunci: 'Penalaran Matematika & Literasi Bahasa',
            logoUrl: p2.uniLogo,
          };
        }

        const target = {
          id: studentId,
          studentId,
          tahunSeleksi: 2027,
          pilihan: pilihanArr,
          skorTerakhirUtbk: ambisData.skorTerakhirUtbk || null,
        };
        return { target, prodi: prodiMap, rawAmbis: ambisData };
      }

      // 2. Fallback ke dokumen target_kampus_siswa lama jika ada
      const snapTarget = await getDoc(doc(db, 'target_kampus_siswa', studentId));
      if (snapTarget.exists()) {
        const target = { id: snapTarget.id, ...snapTarget.data() };
        const prodi = {};
        for (const p of target.pilihan || []) {
          if (!p?.idPtn || !p?.idProdi) continue;
          const snapProdi = await getDoc(doc(db, 'ptn', p.idPtn, 'prodi', p.idProdi));
          if (snapProdi.exists()) prodi[`${p.idPtn}|${p.idProdi}`] = { id: snapProdi.id, ...snapProdi.data() };
        }
        return { target, prodi };
      }

      return null;
    } catch (e) {
      console.warn('[dataTargetKampus] gagal memuat target:', e?.message || e);
      return null;
    }
  })();

  cacheData.set(studentId, janji);
  return janji;
}

/** Buang cache -- dipanggil setelah simpan target baru. */
export function segarkanDataTargetKampus(studentId) {
  if (studentId) cacheData.delete(studentId);
  else cacheData.clear();
}

/**
 * Hook kelayakan + data target untuk siswa ini.
 */
export function useDataTargetKampus(studentId, profil) {
  const [keadaan, setKeadaan] = useState({ status: 'muat' });

  useEffect(() => {
    let hidup = true;
    (async () => {
      if (!studentId) {
        setKeadaan({ status: 'nol' });
        return;
      }

      const kelasStr = String(profil?.kelasSekolah || profil?.kelas || '').toUpperCase();
      const jenjangStr = String(profil?.jenjang || '').toUpperCase();
      const isSma = jenjangStr.includes('SMA') || kelasStr.includes('10') || kelasStr.includes('11') || kelasStr.includes('12') || kelasStr.includes('UTBK') || kelasStr.includes('ALUMNI');

      const data = await muatDataTargetKampus(studentId);
      if (!hidup) return;

      if (!data) {
        // Siswa SMA yang belum memilih target -> status 'belum_pilih'
        if (isSma) {
          setKeadaan({ status: 'belum_pilih', jenjang: 'SMA' });
        } else {
          setKeadaan({ status: 'nol', jenjang: profil?.jenjang || 'SMP' });
        }
        return;
      }

      const perbandingan = susunPerbandingan(
        data.target,
        data.prodi,
        data.target?.skorTerakhirUtbk?.nilai ?? null,
      );

      setKeadaan({
        status: 'siap',
        target: data.target,
        prodi: data.prodi,
        perbandingan,
        rawAmbis: data.rawAmbis,
      });
    })();

    const handleEvent = () => {
      segarkanDataTargetKampus(studentId);
      // Re-trigger load
      if (hidup) {
        muatDataTargetKampus(studentId).then((data) => {
          if (!hidup) return;
          if (data) {
            const perbandingan = susunPerbandingan(
              data.target,
              data.prodi,
              data.target?.skorTerakhirUtbk?.nilai ?? null,
            );
            setKeadaan({
              status: 'siap',
              target: data.target,
              prodi: data.prodi,
              perbandingan,
              rawAmbis: data.rawAmbis,
            });
          }
        });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('gemilang_target_ptn_changed', handleEvent);
    }

    return () => {
      hidup = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('gemilang_target_ptn_changed', handleEvent);
      }
    };
  }, [studentId, profil?.kelasSekolah, profil?.kelas, profil?.jenjang]);

  return keadaan;
}

export default { muatDataTargetKampus, segarkanDataTargetKampus, useDataTargetKampus };
