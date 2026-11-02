// src/utils/sesiNganggur.js
// ============================================================
// v1.6.0 (permintaan owner 3 Nov 2026): sesi admin/owner TIDAK BOLEH
// hidup selamanya. Sebelumnya login hanya menulis flag localStorage
// tanpa kedaluwarsa — komputer admin yang tertinggal terbuka berarti
// dashboard (berisi keuangan!) tetap terbaca siapa pun yang lewat,
// dan tab nganggur tetap memegang listener baca Firestore.
//
// KEBIJAKAN: 30 menit tanpa aktivitas manusia = sesi ditutup paksa
// (owner: "admin wajib masuk ulang gapapa"). Aktivitas = klik/ketik/
// scroll/sentuh/gerak mouse — BUKAN poll jaringan, jadi tab yang
// ditinggal tetap keluar walau halamannya hidup.
//
// MURNI & TERUJI: inti hitungan menerima storage & waktu injeksi supaya
// bisa diuji di Node polos (tests/sesiNganggur.test.mjs).
// ============================================================

import { useEffect } from 'react';

/** Menit maksimum nganggur sebelum sesi ditutup (keputusan owner). */
export const MENIT_NGANGGUR_MAKS = 30;

/** Kunci localStorage penanda aktivitas terakhir (epoch ms). */
export const KUNCI_STEMPEL = 'gemilangAktivitasTerakhir';

const ls = () => (typeof window !== 'undefined' && window.localStorage ? window.localStorage : null);

/** Catat bahwa manusia baru saja beraktivitas. */
export function stempelAktivitas(storage = ls()) {
  if (!storage) return;
  storage.setItem(KUNCI_STEMPEL, String(Date.now()));
}

/** Baca stempel aktivitas terakhir (number|null). */
export function bacaStempel(storage = ls()) {
  if (!storage) return null;
  const v = Number(storage.getItem(KUNCI_STEMPEL));
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** MURNI: lama nganggur (ms) given waktu sekarang & stempel. */
export function umurNganggurMs(sekarangMs, stempelMs) {
  if (!stempelMs) return 0; // tanpa stempel = dianggap baru aktif (jangan menghukum sesi lama)
  return Math.max(0, sekarangMs - stempelMs);
}

/** MURNI: apakah sesi sudah lewat batas nganggur? */
export function sesiLewatBatas(sekarangMs, stempelMs, menit = MENIT_NGANGGUR_MAKS) {
  return umurNganggurMs(sekarangMs, stempelMs) >= menit * 60 * 1000;
}

/** Buang semua kunci sesi admin/owner + stempel aktivitas. */
export function keluarkanSesiAdmin(storage = ls()) {
  if (!storage) return;
  storage.removeItem('isLoggedIn');
  storage.removeItem('role');
  storage.removeItem('isOwnerLoggedIn');
  storage.removeItem(KUNCI_STEMPEL);
}

/**
 * Hook pengawal: pasang di guard route (AdminRoute/OwnerRoute).
 * Menutup sesi + melempar ke halaman login bila nganggur terlalu lama.
 * `window.location.assign` (reload penuh) dipakai sengaja: SPA state,
 * listener onSnapshot, dan poller ikut MATI — tab terkunci benar-benar
 * berhenti menyentuh Firestore.
 */
export function usePengawalSesiNganggur({ menit = MENIT_NGANGGUR_MAKS, aktif = true } = {}) {
  useEffect(() => {
    if (!aktif || typeof window === 'undefined') return undefined;
    if (!bacaStempel()) stempelAktivitas(); // sesi lama pra-fitur: mulai hitungan sekarang
    let tulisTerakhir = 0;
    const sentuh = () => {
      const n = Date.now();
      if (n - tulisTerakhir > 5000) { // hemat: tulis stempel maks 5 detik sekali
        tulisTerakhir = n;
        stempelAktivitas();
      }
    };
    const evs = ['click', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    evs.forEach((e) => window.addEventListener(e, sentuh, { passive: true }));
    const iv = setInterval(() => {
      const st = bacaStempel();
      if (!st) { stempelAktivitas(); return; }
      if (sesiLewatBatas(Date.now(), st, menit)) {
        keluarkanSesiAdmin();
        window.location.assign('/login-admin?sesi=nganggur');
      }
    }, 30000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, sentuh));
      clearInterval(iv);
    };
  }, [aktif, menit]);
}

export default {
  MENIT_NGANGGUR_MAKS, KUNCI_STEMPEL, stempelAktivitas, bacaStempel,
  umurNganggurMs, sesiLewatBatas, keluarkanSesiAdmin, usePengawalSesiNganggur,
};
