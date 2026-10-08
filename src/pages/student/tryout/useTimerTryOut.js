// src/pages/student/tryout/useTimerTryOut.js
// ============================================================
// Timer Try Out -- 2 MODE:
//   - 'total': 1 timer buat semua soal.
//   - 'per-subtes': tiap subtes py durasi sendiri, begitu habis
//     OTOMATIS pindah ke subtes berikutnya (gak bisa balik).
//
// KUNCI PENTING: waktu diikat ke `waktuMulai` yang SUDAH TERSIMPAN di
// Firestore (Timestamp asli, bukan hitungan lokal HP siswa) -- jadi
// kalau siswa TUTUP APP di tengah jalan, begitu dibuka lagi sisa
// waktunya sudah kepotong beneran (dihitung ulang dari selisih waktu
// sekarang - waktuMulai), PERSIS ujian beneran. Ini sudah dites
// terpisah (lihat riwayat build) buat 4 skenario termasuk "tutup app
// lama" dan "waktu sudah lewat, jangan sampai minus".
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';

function hitungSisaMs(waktuMulaiMs, durasiMenit, sekarangMs) {
  const totalMs = durasiMenit * 60 * 1000;
  const terpakaiMs = sekarangMs - waktuMulaiMs;
  return Math.max(0, totalMs - terpakaiMs);
}

/**
 * @param {object} opsi
 *   - aktif: boolean -- timer jalan cuma kalau ini true
 *   - modeTimer: 'total' | 'per-subtes'
 *   - waktuMulaiMs: kapan try out ini dimulai (dari Firestore Timestamp.toMillis())
 *   - durasiTotalMenit: dipakai kalau modeTimer 'total'
 *   - subtes: array [{nama, durasiMenit}] -- dipakai kalau modeTimer 'per-subtes'
 *   - subtesAktifIndex: indeks subtes yang sedang berjalan
 *   - waktuMulaiSubtesMs: kapan SUBTES INI (bukan try out keseluruhan) dimulai
 *   - onHabis: () => void -- dipanggil PERSIS SEKALI begitu waktu habis
 */
export function useTimerTryOut({
  aktif,
  modeTimer,
  waktuMulaiMs,
  durasiTotalMenit,
  subtes,
  subtesAktifIndex,
  waktuMulaiSubtesMs,
  onHabis,
}) {
  const [sisaMs, setSisaMs] = useState(0);
  const sudahLaporHabis = useRef(false);
  // 🔥 BARU (bug kehilangan jawaban ditemukan 2026-10-08): callback
  // `onHabis` DIPANGGIL LEWAT REF, bukan lewat closure interval. Kalau
  // dipakai langsung, interval (yang cuma dibuat ulang saat `aktif`
  // atau `hitungUlang` berubah) memegang onHabis VERSI LAMA -- dan
  // onHabis try out menutup `jawaban` di dalamnya. Akibatnya waktu
  // habis di saat siswa sudah menjawab, Firestore DITIMPA lagi pakai
  // peta jawaban lama yang belum memuat jawaban terakhir itu (siswa:
  // "aku udah jawab kok hasilnya hilang"). Lewat ref, yang dipanggil
  // selalu versi TERBARU tanpa perlu membuat ulang interval tiap ketik.
  const onHabisRef = useRef(onHabis);
  useEffect(() => { onHabisRef.current = onHabis; });

  const hitungUlang = useCallback(() => {
    const sekarang = Date.now();
    if (modeTimer === 'per-subtes') {
      const durasi = subtes?.[subtesAktifIndex]?.durasiMenit || 0;
      return hitungSisaMs(waktuMulaiSubtesMs || sekarang, durasi, sekarang);
    }
    return hitungSisaMs(waktuMulaiMs || sekarang, durasiTotalMenit || 0, sekarang);
  }, [modeTimer, waktuMulaiMs, durasiTotalMenit, subtes, subtesAktifIndex, waktuMulaiSubtesMs]);

  useEffect(() => {
    if (!aktif) return;
    sudahLaporHabis.current = false;
    // SENGAJA: tanpa set awal ini, timer menampilkan "00:00" selama 1
    // detik pertama tiap pindah subtes (interval pertama baru menandai
    // 1 detik kemudian) -- siswa panik mengira waktunya habis.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSisaMs(hitungUlang());

    const interval = setInterval(() => {
      const sisa = hitungUlang();
      setSisaMs(sisa);
      if (sisa <= 0 && !sudahLaporHabis.current) {
        sudahLaporHabis.current = true;
        onHabisRef.current?.();
      }
    }, 1000);

    return () => clearInterval(interval);
    // onHabis DIPANGGIL LEWAT REF (lihat atas) jadi sengaja TIDAK masuk
    // deps: interval gak perlu dibuat ulang tiap jawaban berubah.
  }, [aktif, hitungUlang]);

  const menit = Math.floor(sisaMs / 60000);
  const detik = Math.floor((sisaMs % 60000) / 1000);
  const teksWaktu = `${String(menit).padStart(2, '0')}:${String(detik).padStart(2, '0')}`;

  return { sisaMs, teksWaktu, hampirHabis: sisaMs > 0 && sisaMs <= 5 * 60 * 1000 };
}