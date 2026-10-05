// src/utils/profilSiswa.js
// ============================================================
// SATU PINTU untuk profil siswa yang tampil di aplikasi siswa
// (nama & kelas), sekaligus PENYEGARANNYA dari Firestore.
//
// KENAPA BERKAS INI ADA (keluhan owner 2026-10-05):
//   "data siswa ada nama salah, di admin namanya udah dibenerin,
//    tapi data di hp siswa tidak berubah namanya."
//
// Akar masalahnya BUKAN di admin: EditStudent.jsx menulis ke
// students/<docId> saja (sumber kebenaran yang benar). Masalahnya di
// sisi siswa: LoginSiswa.jsx MENYALIN nama ke localStorage sekali
// saat login (`studentName`, baris 230), dan setelah itu ±17 tempat
// di aplikasi siswa membaca salinan itu dan TIDAK PERNAH membaca
// ulang dari Firestore. Akibatnya nama lama bertahan di HP sampai
// siswa logout lalu login lagi -- bisa berhari-hari.
//
// Berkas ini menyediakan:
//   - bacaProfilSiswa()      : baca sync dari localStorage (kontrak lama)
//   - segarkanProfilSiswa()  : tarik students/<docId>, perbarui localStorage
//                              bila berubah, lalu beri tahu pelanggan
//   - useProfilSiswa()       : hook React yang langganan pembaruan sehingga
//                              tampilan ikut berubah tanpa reload halaman
//
// KEPUTUSAN DESAIN YANG PENTING:
//   1. TIDAK me-remount halaman saat nama berubah. Remount terdengar
//      mudah, tapi akan MENGHANCURKAN jawaban siswa yang sedang
//      mengerjakan try out bila penyegaran terjadi di tengah ujian.
//      Chrome (layout & sidebar) diperbarui reaktif; halaman lain
//      mengambil nilai segar saat berikutnya dirender/dinavigasi.
//   2. Penyegaran DITHROTTLE (minimal 60 detik antar panggilan) karena
//      ia bisa terpanggil saat mount DAN saat focus/visibilitychange.
//      Tanpa throttle, siswa yang sering pindah tab akan menembak
//      Firestore berkali-kali per menit.
//   3. Gagal jaringan / docId tidak ada = diam-diam pakai cache.
//      Lebih baik menampilkan nama lama daripada memutus sesi siswa
//      yang sedang di daerah susah sinyal.
// ============================================================

import { useEffect, useSyncExternalStore } from 'react';
// CATATAN: firebase/firestore dan ../firebase SENGAJA tidak diimpor di baris
// atas. Berkas ini memuat fungsi murni `putuskanPembaruanProfil` yang diuji
// di Node oleh tests/profilSiswa.test.mjs; mengimpor Firestore di top-level
// akan membuat seluruh berkas tidak bisa diimpor di Node (initializeFirestore
// butuh IndexedDB) -- persis jebakan yang dulu membuat kwitansi.js tidak
// bisa diuji. Impor Firestore dilakukan dinamis di dalam segarkanProfilSiswa.

const KUNCI = {
  NAMA: 'studentName',
  KELAS: 'studentKelas',
  DOC: 'studentDocId',
};

const JEDA_SEGARKAN_MS = 60 * 1000;
let segarkanTerakhir = 0;
let janjiBerjalan = null;

const pelanggan = new Set();
let profilSaatIni = null;

function bacaProfilSiswaSync() {
  if (typeof localStorage === 'undefined') {
    return { nama: 'Siswa', kelas: '', docId: null };
  }
  return {
    nama: localStorage.getItem(KUNCI.NAMA) || 'Siswa',
    kelas: localStorage.getItem(KUNCI.KELAS) || '',
    docId: localStorage.getItem(KUNCI.DOC) || null,
  };
}

/** Baca profil tersimpan (sync). Tidak menyentuh jaringan. */
export function bacaProfilSiswa() {
  if (!profilSaatIni) profilSaatIni = bacaProfilSiswaSync();
  return profilSaatIni;
}

function umumkan(profil) {
  profilSaatIni = profil;
  pelanggan.forEach((fn) => fn());
}

function langganan(fn) {
  pelanggan.add(fn);
  return () => pelanggan.delete(fn);
}

/**
 * Bandingkan profil tersimpan dengan data server dan putuskan apakah
 * perlu diperbarui. DIPISAH sebagai fungsi murni supaya bisa diuji di
// Node tanpa Firestore (tests/profilSiswa.test.mjs).
 *
 * @returns {{berubah: boolean, nama: string, kelas: string}}
 */
export function putuskanPembaruanProfil(tersimpan, server) {
  const namaCache = tersimpan?.nama || 'Siswa';
  const kelasCache = tersimpan?.kelas || '';

  // Server tidak memberi objek apa pun (dokumen hilang, jaringan putus
  // di tengah jalan, bug): JANGAN anggap itu "kelas jadi kosong".
  // Mengosongkan profil siswa karena kegagalan membaca adalah cara
  // paling cepat membuat HP siswa menampilkan blank.
  if (!server || typeof server !== 'object') {
    return { berubah: false, nama: namaCache, kelas: kelasCache };
  }

  const nama = String(server.nama ?? '').trim() || namaCache;
  const kelas = String(server.kelasSekolah ?? '').trim();
  const berubah = nama !== namaCache || kelas !== kelasCache;
  return { berubah, nama, kelas };
}

/**
 * Tarik profil terbaru dari Firestore dan perbarui localStorage bila
 * berubah. Aman dipanggil berulang: dithrottle dan di-dedupe (panggilan
 * bersamaan memakai janji yang sama).
 *
 * @returns {Promise<object|null>} profil terbaru, atau null bila tidak
 *   bisa/m tidak perlu menyegarkan (cache tetap dipakai).
 */
export async function segarkanProfilSiswa(paksa = false) {
  if (typeof localStorage === 'undefined') return null;

  const sekarang = Date.now();
  if (!paksa && sekarang - segarkanTerakhir < JEDA_SEGARKAN_MS) {
    return bacaProfilSiswa();
  }
  if (janjiBerjalan) return janjiBerjalan;

  segarkanTerakhir = sekarang;
  janjiBerjalan = (async () => {
    try {
      const tersimpan = bacaProfilSiswaSync();
      if (!tersimpan.docId) return tersimpan;             // sesi lama/aneh: lewati
      if (localStorage.getItem('isSiswaLoggedIn') !== 'true') return tersimpan;

      // Impor dinamis: menjaga berkas ini bisa diimpor di Node untuk test
      // (lihat catatan di kepala berkas). Di browser ini gratis karena
      // firebase sudah pasti termuat oleh aplikasi.
      const [{ doc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('../firebase'),
      ]);

      const snap = await getDoc(doc(db, 'students', tersimpan.docId));
      if (!snap.exists()) return tersimpan;

      const { berubah, nama, kelas } = putuskanPembaruanProfil(tersimpan, snap.data());
      if (!berubah) return tersimpan;

      localStorage.setItem(KUNCI.NAMA, nama);
      localStorage.setItem(KUNCI.KELAS, kelas);
      const profil = { ...tersimpan, nama, kelas };
      umumkan(profil);
      return profil;
    } catch (e) {
      // Offline / rules menolak / dokumen hilang: pakai cache, jangan
      // pernah memutus sesi siswa.
      console.warn('[profilSiswa] gagal menyegarkan profil, pakai cache:', e?.message || e);
      return bacaProfilSiswaSync();
    } finally {
      janjiBerjalan = null;
    }
  })();

  return janjiBerjalan;
}

/**
 * Hook React: mengembalikan profil siswa yang SELALU mutakhir.
 * Menyegarkan saat mount dan saat aplikasi kembali terlihat (pindah
 * tab / kembali dari latar belakang) -- momen paling wajar karena di
 * situlah rentang waktu "admin sempat mengganti nama" biasanya jatuh.
 */
export function useProfilSiswa() {
  const profil = useSyncExternalStore(langganan, bacaProfilSiswa, bacaProfilSiswa);

  useEffect(() => {
    let batal = false;
    const jalan = () => {
      if (!batal) segarkanProfilSiswa();
    };
    jalan();
    window.addEventListener('focus', jalan);
    document.addEventListener('visibilitychange', jalan);
    return () => {
      batal = true;
      window.removeEventListener('focus', jalan);
      document.removeEventListener('visibilitychange', jalan);
    };
  }, []);

  return profil;
}

export default {
  bacaProfilSiswa,
  segarkanProfilSiswa,
  putuskanPembaruanProfil,
  useProfilSiswa,
};
