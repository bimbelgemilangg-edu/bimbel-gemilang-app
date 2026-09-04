// src/pages/student/tryout/useDeteksiKecuranganTryOut.js
// ============================================================
// DETEKSI KECURANGAN buat Try Out -- 2 bagian:
//
// 1. PORTING dari StudentQuizView.jsx (kuis guru, SUDAH JALAN &
//    terbukti): deteksi pindah tab/aplikasi, keluar jendela, keluar
//    fullscreen. Logikanya disamakan PERSIS, cuma dibungkus jadi hook
//    biar bisa dipakai di TryOutView.jsx tanpa duplikat kode dari nol.
//
// 2. BARU: kamera aktif selama try out, ambil foto SECARA ACAK
//    (jeda waktu antar-foto tidak tetap -- sengaja, biar polanya gak
//    bisa ditebak/dihindari siswa). Foto diupload ke Supabase (folder
//    "tryout-pengawasan"), bukan disimpan sebagai kecurangan otomatis
//    -- ini BUKTI VISUAL buat admin/wali kelas tinjau manual, BUKAN
//    diverifikasi otomatis pakai AI pengenalan wajah (itu butuh
//    infrastruktur deteksi wajah terpisah yang belum dibangun -- kalau
//    dipaksa sekarang & akurasinya meleset, siswa jujur bisa
//    dirugikan gara-gara pencahayaan jelek/kamera burik. Ini sengaja
//    ditunda ke tahap berikutnya, bukan kelupaan).
//
// KEJUJURAN SOAL BATASNYA (sama seperti anti-cheat kuis guru): ini
// mempersulit & mencatat jejak, BUKAN jaminan 100% anti-nyontek. Siswa
// tetap bisa pakai HP kedua di luar jangkauan kamera, misalnya. Jangan
// dijual ke orang tua sebagai "dijamin gak bisa nyontek sama sekali".
// ============================================================

import { useEffect, useRef, useState, useCallback } from 'react';
import { uploadElearningFile } from '../../../services/uploadService';

const JEDA_MIN_MS = 45 * 1000; // 45 detik
const JEDA_MAKS_MS = 4 * 60 * 1000; // 4 menit

function jedaAcak() {
  return JEDA_MIN_MS + Math.random() * (JEDA_MAKS_MS - JEDA_MIN_MS);
}

/**
 * @param {object} opsi
 *   - aktif: boolean -- true kalau try out sedang berjalan (belum submit)
 *   - wajibKamera: boolean -- kalau true, kamera WAJIB nyala; gagal/ditolak = 1 pelanggaran
 *   - onFotoTersimpan: (url:string) => void -- opsional, dipanggil tiap foto berhasil upload
 *     (biar caller bisa langsung nyimpen url-nya ke Firestore, hook ini gak nyimpen sendiri)
 */
export function useDeteksiKecuranganTryOut({ aktif, wajibKamera = true, onFotoTersimpan }) {
  const [pelanggaran, setPelanggaran] = useState([]); // [{type, at}]
  const [showPeringatan, setShowPeringatan] = useState(false);
  const [statusKamera, setStatusKamera] = useState('memuat'); // 'memuat' | 'aktif' | 'ditolak' | 'gagal'
  const [jumlahFotoTersimpan, setJumlahFotoTersimpan] = useState(0);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const sudahLaporKameraGagal = useRef(false);

  const catatPelanggaran = useCallback((type) => {
    setPelanggaran((prev) => [...prev, { type, at: new Date().toISOString() }]);
    setShowPeringatan(true);
  }, []);

  const tutupPeringatan = useCallback(() => setShowPeringatan(false), []);

  // ---------------- 1. PORTING: tab/jendela/fullscreen ----------------
  // Logika PERSIS SAMA dengan StudentQuizView.jsx -- lihat file itu
  // kalau perlu bandingkan/sinkronkan di kemudian hari.
  useEffect(() => {
    if (!aktif) return;

    const onVisibilityChange = () => {
      if (document.hidden) catatPelanggaran('pindah_tab_atau_aplikasi');
    };
    const onBlur = () => catatPelanggaran('keluar_dari_jendela');
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) catatPelanggaran('keluar_fullscreen');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, [aktif, catatPelanggaran]);

  // ---------------- 2. BARU: nyalakan kamera ----------------
  useEffect(() => {
    if (!aktif || !wajibKamera) return;
    let batal = false;

    navigator.mediaDevices?.getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((stream) => {
        if (batal) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatusKamera('aktif');
      })
      .catch((err) => {
        console.error('Gagal mengaktifkan kamera try out:', err);
        setStatusKamera('ditolak');
        if (!sudahLaporKameraGagal.current) {
          sudahLaporKameraGagal.current = true;
          catatPelanggaran('kamera_tidak_aktif');
        }
      });

    return () => {
      batal = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [aktif, wajibKamera, catatPelanggaran]);

  // ---------------- 2b. BARU: ambil foto di jeda ACAK ----------------
  useEffect(() => {
    if (!aktif || !wajibKamera || statusKamera !== 'aktif') return;
    let timer;

    const ambilFoto = () => {
      const video = videoRef.current;
      if (video && video.videoWidth > 0) {
        const canvas = document.createElement('canvas');
        // Ukuran kecil sengaja -- ini cuma buat bukti visual, bukan
        // butuh resolusi tinggi, biar upload cepat & hemat storage.
        canvas.width = 320;
        canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            const file = new File([blob], `pengawasan_${Date.now()}.jpg`, { type: 'image/jpeg' });
            const hasil = await uploadElearningFile(file, 'tryout-pengawasan');
            if (hasil.success) {
              setJumlahFotoTersimpan((n) => n + 1);
              onFotoTersimpan?.(hasil.downloadURL);
            } else {
              console.error('Gagal upload foto pengawasan:', hasil.error);
            }
          } catch (e) {
            console.error('Gagal ambil/upload foto pengawasan:', e);
          }
        }, 'image/jpeg', 0.6);
      }
      // Jadwalkan foto berikutnya di jeda acak lagi -- BUKAN interval
      // tetap, biar siswa gak bisa "nebak" kapan aman buat nyontek.
      timer = setTimeout(ambilFoto, jedaAcak());
    };

    timer = setTimeout(ambilFoto, jedaAcak());
    return () => clearTimeout(timer);
  }, [aktif, wajibKamera, statusKamera, onFotoTersimpan]);

  return {
    pelanggaran,
    showPeringatan,
    tutupPeringatan,
    statusKamera,
    jumlahFotoTersimpan,
    videoRef, // caller WAJIB render <video ref={videoRef} autoPlay muted playsInline style={{display:'none'}} />
  };
}