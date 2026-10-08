// src/services/resetSesiTryOut.js
// ============================================================
// SATU JALUR RESMI buat mereset sesi try out siswa (permintaan owner
// 2026-10-08: "mengembalikan soal dan poin XP dll anak ke semula biar
// bisa kerjain ulang").
//
// KENAPA dibikin layanan terpisah: sebelumnya urutan kritis ini cuma
// ada DI DALAM HasilTryOutAdminPage.jsx (tombol "Izinkan Ulang"):
//   1. tarik balik XP total & XP mingguan secukupnya,
//   2. hapus dokumen sesi PERMANEN,
//   3. beri "izin ulang khusus" yang nembus deadline paket.
// Begitu owner minta tombol reset JUGA di halaman Terbitkan Try Out
// (tempat dia berdiri waktu kejadian), menyalin urutan itu ke dua
// halaman = mengundang dua versi yang pelan-pelan berbeda. Maka
// urutannya tinggal DI SINI, dua halaman tinggal memanggil.
//
// File ini sengaja TIDAK di-test node (butuh Firestore beneran) --
// bagian yang murni (hitungan XP) hidup di utils/pemulihanXPTryOut.js
// dan di-test di tests/pemulihanXPTryOut.test.mjs.
// ============================================================

import { db } from '../firebase';
import {
  doc, getDoc, updateDoc, deleteDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { hitungPemulihanXP } from '../utils/pemulihanXPTryOut.js';

/**
 * Reset satu sesi try out supaya siswa bisa mengerjakan ulang dari nol.
 *
 * Urutan SENGAJA begini (XP dulu, sesi kemudian): kalau penghapusan
 * sesi gagal di tengah jalan, XP paling buruk sudah tertarik dan admin
 * tinggal mengulang -- sebaliknya kalau sesi dihapus dulu lalu XP gagal
 * ditarik, siswa untung ganda dan gak ada jejak buat koreksi.
 *
 * @param {object} o
 * @param {string} o.paketId id dokumen tryout_paket
 * @param {string} o.sesiId id dokumen tryout_sesi yang mau direset
 * @param {string} o.studentId studentId pemilik sesi
 * @param {number} o.xpFinal XP hasil pengerjaan lama (yang ditarik balik)
 * @param {boolean} [o.beriIzinUlang] true = sekalian beri izin nembus deadline (default true)
 * @param {number} [o.durasiIzinJam] masa berlaku izin ulang dalam jam (default 3)
 * @returns {Promise<{xpDikembalikan: number, pemulihan: object|null, izinSampai: string|null}>}
 */
export async function resetSesiTryOut({
  paketId, sesiId, studentId, xpFinal, beriIzinUlang = true, durasiIzinJam = 3,
}) {
  const xp = Math.max(0, Number(xpFinal) || 0);
  let pemulihan = null;

  // 1. Tarik balik XP secukupnya (total + mingguan) -- bukan reset ke
  //    0, biar aktivitas lain siswa gak ikut kesenggol.
  if (studentId && xp > 0) {
    const progRef = doc(db, 'siswa_progress', studentId);
    const snapProg = await getDoc(progRef);
    if (snapProg.exists()) {
      pemulihan = hitungPemulihanXP(snapProg.data(), xp);
      await updateDoc(progRef, { ...pemulihan, updatedAt: serverTimestamp() });
    }
  }

  // 2. Hapus sesi lama PERMANEN -- tanpa ini TryOutView akan menganggap
  //    siswa sudah selesai/berjalan dan menolak mulai lagi.
  await deleteDoc(doc(db, 'tryout_sesi', sesiId));

  // 3. Izin ulang khusus yang NEMBUS deadline paket -- cuma buat siswa
  //    ini, siswa lain tidak ikut dibukakan deadline-nya.
  let izinSampai = null;
  if (beriIzinUlang && studentId) {
    izinSampai = new Date(Date.now() + durasiIzinJam * 60 * 60 * 1000).toISOString();
    await setDoc(doc(db, 'tryout_izin_ulang', `${paketId}_${studentId}`), {
      paketId,
      studentId,
      waktuBerlakuSampai: izinSampai,
      diberikanOleh: 'admin',
      createdAt: serverTimestamp(),
    });
  }

  return { xpDikembalikan: xp, pemulihan, izinSampai };
}
