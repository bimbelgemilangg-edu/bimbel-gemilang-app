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

  // ---------------- 2b. DIROMBAK TOTAL: ambil foto dipicu AKSI SISWA ----------------
  // 🔥 BUG SERIUS yang KEMARIN kejadian: versi lama pakai setTimeout di
  // dalam useEffect dengan jeda 45detik-4menit. Masalahnya, TryOutView
  // re-render TIAP DETIK (gara-gara timer hitung mundur), dan setiap
  // re-render bikin useEffect ini jalan ulang (cleanup + jadwal baru)
  // -- jadwal fotonya KETERUSAN DIRESET SEBELUM SEMPAT KESAMPAIAN.
  // Foto TIDAK PERNAH kejepret sama sekali walau kamera nyala terus.
  //
  // SEKARANG: gak ada timer/interval/useEffect sama sekali buat bagian
  // ini. Sebagai gantinya, caller (TryOutView.jsx) MANGGIL fungsi
  // `cobaAmbilFoto()` di titik-titik AKSI SISWA (pas jawab soal, pas
  // pindah ke soal berikutnya). Fungsi ini pakai `useRef` (BUKAN
  // useState) buat nyimpen "kapan terakhir foto diambil" dan "berapa
  // lama jeda berikutnya" -- ref TIDAK memicu re-render dan TIDAK
  // pernah "direset" oleh render, jadi kapanpun & sesering apapun
  // TryOutView re-render, jadwal foto TETAP UTUH, gak akan pernah
  // ke-cancel di tengah jalan.
  //
  // Ini juga JAUH lebih aman dari resiko "tiba-tiba error/blank putih"
  // -- gak ada lagi useEffect dengan cleanup yang bisa kepicu di waktu
  // gak terduga; ini murni pemanggilan fungsi biasa, dibungkus try/catch
  // sendiri, dan KALAU GAGAL cuma di-log ke console -- TIDAK PERNAH
  // melempar error yang bisa mengganggu alur ngerjain soal siswa.
  const waktuTerakhirFotoRef = useRef(0);
  const jedaBerikutnyaRef = useRef(jedaAcak());

  const ambilSatuFoto = useCallback(() => {
    try {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0) return;
      const canvas = document.createElement('canvas');
      // Ukuran kecil sengaja -- ini cuma buat bukti visual, bukan
      // butuh resolusi tinggi, biar upload cepat & hemat storage.
      canvas.width = 320;
      canvas.height = Math.round(320 * (video.videoHeight / video.videoWidth));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `pengawasan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        const cobaUpload = async (percobaanKe = 1) => {
          try {
            const hasil = await uploadElearningFile(file, 'tryout-pengawasan');
            if (hasil.success) {
              setJumlahFotoTersimpan((n) => n + 1);
              onFotoTersimpan?.(hasil.downloadURL);
            } else if (percobaanKe < 2) {
              setTimeout(() => cobaUpload(percobaanKe + 1), 2000);
            } else {
              console.error('Gagal upload foto pengawasan (2x percobaan):', hasil.error);
            }
          } catch (e) {
            if (percobaanKe < 2) setTimeout(() => cobaUpload(percobaanKe + 1), 2000);
            else console.error('Gagal ambil/upload foto pengawasan (2x percobaan):', e);
          }
        };
        cobaUpload();
      }, 'image/jpeg', 0.6);
    } catch (e) {
      // 🔒 PENTING: gagal ambil foto TIDAK BOLEH PERNAH mengganggu
      // siswa yang lagi ngerjain soal -- cukup dicatat, jangan sampai
      // melempar error yang bisa bikin layar nge-blank/nge-freeze.
      console.error('Gagal ambil foto pengawasan (diabaikan, gak ganggu try out):', e);
    }
  }, [onFotoTersimpan]);

  // Dipanggil caller di titik AKSI SISWA (jawab soal / pindah soal).
  // Aman dipanggil sesering apapun -- kalau belum waktunya (masih
  // dalam jeda acak), fungsi ini cuma diam, gak ngapa-ngapain.
  const cobaAmbilFoto = useCallback(() => {
    if (!aktif || !wajibKamera || statusKamera !== 'aktif') return;
    const sekarang = Date.now();
    if (sekarang - waktuTerakhirFotoRef.current < jedaBerikutnyaRef.current) return;
    waktuTerakhirFotoRef.current = sekarang;
    jedaBerikutnyaRef.current = jedaAcak(); // acak ulang buat jeda berikutnya
    ambilSatuFoto();
  }, [aktif, wajibKamera, statusKamera, ambilSatuFoto]);

  return {
    pelanggaran,
    showPeringatan,
    tutupPeringatan,
    statusKamera,
    jumlahFotoTersimpan,
    videoRef, // caller WAJIB render <video ref={videoRef} autoPlay muted playsInline style={{display:'none'}} />
    cobaAmbilFoto, // 🔥 BARU: panggil ini di titik aksi siswa (jawab/pindah soal)
  };
}