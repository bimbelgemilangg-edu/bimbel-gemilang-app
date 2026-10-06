// src/components/KameraBelakang.jsx
// ============================================================
// KAMERA BELAKANG DI DALAM HALAMAN untuk memfoto jawaban tulisan
// tangan siswa saat try out.
//
// KENAPA ADA (keluhan owner 2026-10-05):
//   "mau jawab pertanyaan pakai esai atau foto, jawaban siswa terkena
//    pelanggaran karena keluar. harusnya kan langsung buka kamera
//    belakang untuk memfoto jawaban di try out."
//
// Akar masalahnya terverifikasi di kode: RendererEsai memakai
// <input type="file" capture="environment">. Di HP, itu MENYERAHKAN
// KENDALI KE APLIKASI KAMERA OS -- halaman menjadi hidden / kehilangan
// focus, dan useDeteksiKecuranganTryOut.js memang mencatat keduanya
// sebagai pelanggaran:
//   document.hidden  -> 'pindah_tab_atau_aplikasi'
//   window blur      -> 'keluar_dari_jendela'
// Jadi siswa yang jujur justru dihukum karena memakai fitur yang
// disediakan aplikasi sendiri.
//
// Solusinya: getUserMedia() di DALAM halaman. Tidak ada momen halaman
// menjadi hidden atau blur, jadi tidak ada pelanggaran yang tercipta.
// Overlay ini juga tidak menyentuh fullscreenElement, sehingga
// 'keluar_fullscreen' tidak terpicu.
//
// SOAL KAMERA PENGAWASAN (depan): hook anti-curang menjalankan stream
// depannya sendiri. Overlay ini TIDAK menghentikan stream itu -- hook
// tidak memantau track.ended, jadi tidak ada pelanggaran "kamera mati";
// dan menghentikan stream pengawasan demi kamera jawaban justru
// melemahkan pengawasan. Bila perangkat tidak sanggup menjalankan dua
// kamera sekaligus, getUserMedia belakang akan GAGAL dengan rapi dan
// overlay menawarkan jalur fallback (pemilih berkas) dengan peringatan
// jujur bahwa keluar halaman dapat tercatat sebagai pelanggaran.
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react';
import { ukuranFoto } from '../utils/ukuranFoto';

const MAKS_SISI = 1600;   // cukup tajam untuk membaca tulisan tangan
const KUALITAS_JPEG = 0.82;

export default function KameraBelakang({ onHasil, onClose, judul = 'Foto jawaban tulisan tangan' }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('memuat'); // memuat | aktif | gagal
  const [pesanGagal, setPesanGagal] = useState('');
  const [pratinjau, setPratinjau] = useState(null); // dataURL hasil jepretan
  const [busy, setBusy] = useState(false);

  // Nyalakan kamera belakang saat overlay dibuka; matikan saat ditutup.
  useEffect(() => {
    let batal = false;
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('gagal');
      setPesanGagal('Perangkat atau browser ini tidak mendukung kamera di dalam halaman.');
      return undefined;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
      .then((stream) => {
        if (batal) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play?.().catch(() => {});
        }
        setStatus('aktif');
      })
      .catch((err) => {
        if (batal) return;
        setStatus('gagal');
        setPesanGagal(`Kamera belakang tidak bisa dibuka: ${err?.message || err}. Kamu masih bisa memakai jalur berkas/galeri di bawah.`);
      });

    return () => {
      batal = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  const jepret = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    try {
      const { lebar, tinggi } = ukuranFoto(video.videoWidth, video.videoHeight, MAKS_SISI);
      const canvas = document.createElement('canvas');
      canvas.width = lebar;
      canvas.height = tinggi;
      canvas.getContext('2d').drawImage(video, 0, 0, lebar, tinggi);
      setPratinjau(canvas.toDataURL('image/jpeg', KUALITAS_JPEG));
    } catch (e) {
      setPesanGagal(`Gagal menjepret: ${e?.message || e}`);
    }
  }, []);

  const pakaiPratinjau = useCallback(() => {
    if (!pratinjau) return;
    setBusy(true);
    try {
      // dataURL -> Blob -> File, supaya melewati jalur pemrosesan yang
      // SAMA dengan foto dari pemilih berkas (kompresi + batas ukuran
      // di RendererEsai.ambilFoto). Tidak ada jalur upload kedua.
      const [meta, isi] = pratinjau.split(',');
      const mime = /data:(.*?);/.exec(meta)?.[1] || 'image/jpeg';
      const bin = atob(isi);
      const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
      const file = new File([arr], `jawaban-esai-${Date.now()}.jpg`, { type: mime });
      onHasil?.(file);
    } catch (e) {
      setPesanGagal(`Gagal menyiapkan foto: ${e?.message || e}`);
    } finally {
      setBusy(false);
    }
  }, [pratinjau, onHasil]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={judul}
      style={{
        position: 'fixed', inset: 0, zIndex: 4000, background: 'rgba(2, 6, 23, 0.94)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 14,
      }}
    >
      <div style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 800, textAlign: 'center' }}>
        📷 {judul}
        <div style={{ fontSize: 10.5, fontWeight: 400, opacity: 0.75, marginTop: 2 }}>
          Kamera terbuka di dalam halaman — tidak tercatat sebagai pelanggaran.
        </div>
      </div>

      {status !== 'gagal' && (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          style={{
            width: 'min(92vw, 560px)', maxHeight: '58vh', borderRadius: 12,
            background: '#000', objectFit: 'cover', display: pratinjau ? 'none' : 'block',
          }}
        />
      )}
      {pratinjau && (
        <img src={pratinjau} alt="Pratinjau foto jawaban" style={{ width: 'min(92vw, 560px)', maxHeight: '58vh', borderRadius: 12, background: '#fff', objectFit: 'contain' }} />
      )}

      {status === 'memuat' && <div style={{ color: '#94a3b8', fontSize: 12 }}>Menyalakan kamera belakang… izinkan akses kamera bila diminta.</div>}
      {status === 'gagal' && (
        <div style={{ color: '#fecaca', background: '#7f1d1d', border: '1px solid #b91c1c', borderRadius: 10, padding: 10, fontSize: 12, maxWidth: 480, textAlign: 'center' }}>
          {pesanGagal}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
        {status === 'aktif' && !pratinjau && (
          <button onClick={jepret} style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: '#2563eb', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
            📸 Jepret
          </button>
        )}
        {pratinjau && (
          <>
            <button onClick={pakaiPratinjau} disabled={busy} style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: '#16a34a', color: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>
              {busy ? 'Menyiapkan…' : '✅ Pakai foto ini'}
            </button>
            <button onClick={() => setPratinjau(null)} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              🔁 Ulangi
            </button>
          </>
        )}
        <button onClick={onClose} style={{ padding: '11px 18px', borderRadius: 12, border: '1px solid #475569', background: '#0f172a', color: '#e2e8f0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          ✕ Tutup
        </button>
      </div>
    </div>
  );
}
