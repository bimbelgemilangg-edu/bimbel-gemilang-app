// src/utils/useSegarSaatTerlihat.js
// ============================================================
// Hook kecil: memberi nomor versi yang BERTAMBAH setiap aplikasi
// kembali terlihat (pindah tab kembali / dibuka dari latar belakang).
//
// KENAPA ADA: penyakit "data tidak konek" di repo ini (lihat
// docs/PETA-SINKRONISASI-ADMIN-SISWA.md) adalah halaman yang mengambil
// data SEKALI saat mount. Di PWA yang tetap hidup di latar belakang,
// perubahan admin baru kelihatan setelah reload -- terasa seperti
// aplikasi macet. Pola perbaikannya (sudah dipakai absensi & profil):
// ambil ulang saat aplikasi kembali terlihat. Hook ini membungkus pola
// itu supaya halaman lain cukup dua baris:
//
//   const versiSegar = useSegarSaatTerlihat();
//   useEffect(() => { muatData(); }, [dependensiLain, versiSegar]);
//
// KENAPA BUKAN REMOUNT: me-remount halaman untuk menyegarkan data akan
// MENGHANCURKAN state siswa yang sedang mengerjakan sesuatu (jawaban
// try out, isian survei). Menaikkan versi hanya memicu effect pengambil
// data; state formulir tetap utuh.
//
// Hanya naik saat `visibilityState === 'visible'`, supaya menyembunyikan
// tab (yang juga memicu visibilitychange) tidak menembak Firestore.
// ============================================================

import { useEffect, useState } from 'react';

/** @returns {number} versi penyegaran; bertambah tiap aplikasi kembali terlihat */
export function useSegarSaatTerlihat() {
  const [versi, setVersi] = useState(0);

  useEffect(() => {
    const jalan = () => {
      if (document.visibilityState === 'visible') setVersi((v) => v + 1);
    };
    window.addEventListener('focus', jalan);
    document.addEventListener('visibilitychange', jalan);
    return () => {
      window.removeEventListener('focus', jalan);
      document.removeEventListener('visibilitychange', jalan);
    };
  }, []);

  return versi;
}

export default useSegarSaatTerlihat;
