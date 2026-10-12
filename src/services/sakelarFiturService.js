// src/services/sakelarFiturService.js
// ============================================================
// Pembaca sakelar fitur dari Firestore. Logika keputusannya ada di
// utils/sakelarFitur.js (murni, teruji); berkas ini hanya mengurus
// pengambilan dokumen + cache.
//
// 🔥 KENAPA PAKAI CACHE (bukan getDocs tiap kali dipanggil)
// Proyek ini pernah menjawab bacaan Firestore dengan 429 RESOURCE_EXHAUSTED
// karena halaman menyapu koleksi penuh setiap mount DAN setiap
// focus/visibilitychange -- lihat kepala utils/keputusanMuat.js. Sakelar
// fitur akan dibaca oleh BANYAK halaman sekaligus (sidebar, rute, dashboard),
// jadi ia wajib dibaca SEKALI per masa berlaku, bukan sekali per komponen.
// Dokumen yang dibaca cuma satu dan kecil: settings/global_config.
//
// Kebijakan gagal mengikuti kebijakanGagalMuat(): konfigurasi lama yang masih
// ada lebih berharga daripada "kosong". TAPI perhatikan bedanya dengan data
// biasa -- di sini kosong berarti fitur MATI, jadi kegagalan baca tidak akan
// pernah menyalakan fitur yang seharusnya mati. Gagal tetap ke arah aman.
// ============================================================

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DOK_SETTINGS, FIELD_PILOT, putuskanAksesFitur } from '../utils/sakelarFitur';
import { perluSegar, kebijakanGagalMuat } from '../utils/keputusanMuat';

/** 5 menit. Cukup lama agar 10 halaman tidak menembak server berbarengan,
 *  cukup pendek agar admin tidak menunggu lama setelah menyalakan fitur. */
const TTL_MS = 5 * 60 * 1000;

let konfigurasiCache = null;
let waktuCacheMs = 0;
let sedangMengambil = null;

/**
 * Ambil konfigurasi fiturPilot. Aman dipanggil berkali-kali dari banyak
 * komponen sekaligus -- panggilan yang berbarengan berbagi satu janji.
 *
 * @param {{paksa?: boolean}} [opsi] paksa=true untuk tombol "muat ulang"
 * @returns {Promise<object|null>} null bila belum pernah ada / gagal total
 */
export async function muatKonfigurasiPilot(opsi = {}) {
  const boleh = perluSegar({ waktuCacheMs, ttlMs: TTL_MS, paksa: !!opsi.paksa });
  if (!boleh) return konfigurasiCache;
  if (sedangMengambil) return sedangMengambil;

  sedangMengambil = (async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', DOK_SETTINGS));
      const data = snap.exists() ? snap.data() : {};
      konfigurasiCache = data[FIELD_PILOT] && typeof data[FIELD_PILOT] === 'object'
        ? data[FIELD_PILOT]
        : null;
      waktuCacheMs = Date.now();
      return konfigurasiCache;
    } catch (e) {
      // Data lama dipertahankan; pesan mengikuti kebijakan repo supaya UI
      // tidak menyimpulkan "fiturnya hilang" padahal kuotanya yang reda.
      const kebijakan = kebijakanGagalMuat(!!konfigurasiCache, e?.message || '');
      console.warn('[sakelarFitur]', kebijakan.pesan);
      return konfigurasiCache;
    } finally {
      sedangMengambil = null;
    }
  })();

  return sedangMengambil;
}

/**
 * Pintu yang dipakai halaman/komponen: "bolehkah siswa ini melihat fitur X?"
 *
 * @param {string} namaFitur kunci di fiturPilot, mis. 'rasionalisasiKampus'
 * @param {{studentId?: string, kelasSekolah?: string}} siswa
 * @param {{paksa?: boolean, aktif?: boolean}} [opsi]
 * @returns {Promise<{aktif: boolean, alasan: string}>}
 */
export async function fiturAktifUntuk(namaFitur, siswa = {}, opsi = {}) {
  const konfigurasi = await muatKonfigurasiPilot({ paksa: !!opsi.paksa });
  return putuskanAksesFitur(konfigurasi, namaFitur, siswa, opsi);
}

/** Buang cache -- dipanggil setelah admin menyimpan konfigurasi baru. */
export function segarkanKonfigurasiPilot() {
  waktuCacheMs = 0;
  konfigurasiCache = null;
  sedangMengambil = null;
}

export default { muatKonfigurasiPilot, fiturAktifUntuk, segarkanKonfigurasiPilot };
