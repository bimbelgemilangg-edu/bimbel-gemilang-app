// src/utils/sumberKonten.js
// ============================================================
// SATU PINTU pengambilan tiga koleksi konten (bank_soal, buku_digital,
// tryout_paket) dengan CACHE BER-TTL bersama lintas halaman.
//
// KENAPA ADA: sebelum ini tiap halaman menyapu ketiga koleksi sendiri-
// sendiri setiap mount & setiap focus -- perpindahan tab antara
// Perpustakaan, Cetak Latihan, dan Lemari Soal berarti penyapuan ganda.
// docs/POLICY-ERROR-DAN-KUOTA.md melarang itu sejak audit 429.
// Cache modul-level membuat satu tab membaca server paling banyak
// sekali per TTL, dan TAB/PAGE lain memakai hasil yang sama.
//
// Gagal baca mengikuti policy yang sama: data lama dipertahankan +
// pesan jujur lewat kebijakanGagalMuat(), bukan daftar kosong.
// ============================================================

import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { perluSegar, kebijakanGagalMuat } from './keputusanMuat.js';
// 🔥 2026-10-08 (Fase 2): begitu tentor boleh MENGUSULKAN paket try out,
// koleksi tryout_paket punya status yang belum boleh dilihat umum
// (draf / menunggu_approval / ditolak). Berkas ini memasok Perpustakaan
// untuk admin DAN guru, jadi penyaringannya ditaruh di sini — satu titik
// sempit, bukan diserahkan ke tiap halaman. Paket warisan tanpa field
// status TETAP lolos (lihat bolehTampilUmum), supaya tidak ada paket lama
// yang hilang dari Perpustakaan.
import { saringPaketTerbit } from './statusTryOutPaket.js';

const TTL_MS = 10 * 60 * 1000;
let cache = null;
let waktuCache = 0;
let janjiBerjalan = null;

const peta = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

/**
 * @param {{paksa?: boolean}} [opsi] paksa = tombol "Coba lagi"/"Muat ulang"
 * @returns {Promise<{soal: object[], buku: object[], paket: object[], dariCache: boolean, pesan: string}>}
 */
export async function ambilKonten({ paksa = false } = {}) {
  if (!paksa && cache && !perluSegar({ waktuCacheMs: waktuCache, ttlMs: TTL_MS })) {
    return { ...cache, dariCache: true, pesan: '' };
  }
  if (janjiBerjalan) return janjiBerjalan;

  janjiBerjalan = (async () => {
    try {
      const [s, b, p] = await Promise.all([
        getDocs(collection(db, 'bank_soal')),
        getDocs(collection(db, 'buku_digital')),
        getDocs(collection(db, 'tryout_paket')),
      ]);
      cache = { soal: peta(s), buku: peta(b), paket: saringPaketTerbit(peta(p)) };
      waktuCache = Date.now();
      return { ...cache, dariCache: false, pesan: '' };
    } catch (e) {
      const k = kebijakanGagalMuat(!!cache, e?.code || e?.message || '');
      if (cache) return { ...cache, dariCache: true, pesan: k.pesan };
      return { soal: [], buku: [], paket: [], dariCache: false, pesan: k.pesan };
    } finally {
      janjiBerjalan = null;
    }
  })();

  return janjiBerjalan;
}

export default { ambilKonten };
