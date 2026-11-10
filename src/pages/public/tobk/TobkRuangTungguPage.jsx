// src/pages/public/tobk/TobkRuangTungguPage.jsx
// ============================================================
// RUANG TUNGGU TOBK PUBLIK & VERIFIKASI TOKEN
// (Cek Kamera Pengawas, Tata Tertib, & Input Token)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert, Camera, Key, CheckCircle, AlertCircle, Play,
  User, School, Target, ArrowLeft, RefreshCw, Sparkles
} from 'lucide-react';
import {
  ambilSesiPesertaAktif, ambilEventTobkById, ambilEventTobkAktifPublik,
  validasiTokenPeserta
} from '../../../services/tobkPublikService';

export default function TobkRuangTungguPage() {
  const navigate = useNavigate();
  const [peserta, setPeserta] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Status Kamera
  const [statusKamera, setStatusKamera] = useState('meminta'); // 'meminta' | 'aktif' | 'ditolak'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Muat Sesi Peserta
  useEffect(() => {
    async function muat() {
      const sesi = ambilSesiPesertaAktif();
      if (!sesi || !sesi.nama) {
        // Belum daftar, kembali ke portal pendaftaran
        navigate('/tobk');
        return;
      }
      setPeserta(sesi);

      let ev = null;
      if (sesi.eventId) {
        ev = await ambilEventTobkById(sesi.eventId);
      }
      if (!ev) {
        ev = await ambilEventTobkAktifPublik();
      }
      setEventData(ev);
      setLoading(false);
    }
    muat();
  }, [navigate]);

  // Inisialisasi Kamera Pengawas
  const aktifkanKamera = async () => {
    setStatusKamera('meminta');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 480 }, height: { ideal: 360 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatusKamera('aktif');
    } catch (err) {
      console.warn('Gagal akses webcam:', err);
      setStatusKamera('ditolak');
    }
  };

  useEffect(() => {
    aktifkanKamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Submit Token & Masuk CBT
  const handleMulaiUjian = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!tokenInput.trim()) {
      setErrorMsg('Masukkan kode token ujian yang diumumkan Admin!');
      return;
    }

    if (eventData?.wajibKamera && statusKamera !== 'aktif') {
      setErrorMsg('Kamera pengawas wajib diaktifkan sebelum memulai ujian!');
      return;
    }

    setValidating(true);
    try {
      const hasil = await validasiTokenPeserta(eventData?.id, tokenInput);
      if (!hasil.valid) {
        setErrorMsg(hasil.message);
        return;
      }

      // Token cocok & aktif! Lanjut ke CBT
      // Simpan izin kamera & waktu mulai di session
      navigate('/tobk/cbt');
    } catch (err) {
      setErrorMsg('Gagal memvalidasi token: ' + err.message);
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Memuat Ruang Tunggu CBT...
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '24px' }}>
          <div>
            <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
              Ruang Tunggu CBT Resmi
            </span>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '6px 0 0', color: '#ffffff' }}>
              {eventData?.judul || 'TRY OUT AKBAR GEMILANG'}
            </h1>
          </div>

          <button
            onClick={() => navigate('/tobk')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
          >
            <ArrowLeft size={14} /> Ganti Data
          </button>
        </div>

        {/* Identitas Peserta */}
        <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '16px 20px', marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px' }}>
              {peserta?.nama ? peserta.nama.charAt(0).toUpperCase() : 'P'}
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Nama Peserta</div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>{peserta?.nama}</div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Asal Sekolah & Kota</div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{peserta?.asalSekolah} {peserta?.kota ? `(${peserta.kota})` : ''}</div>
          </div>

          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Target Pilihan</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>
              {peserta?.targetPtn || 'PTN Favorit'} {peserta?.targetJurusan ? `· ${peserta.targetJurusan}` : ''}
            </div>
          </div>
        </div>

        {/* Konten Utama: 2 Kolom (Kamera & Tata Tertib) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Box Kiri: Cek Kesiapan Kamera */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '14px', fontWeight: 700 }}>Pemeriksaan Kamera Pengawas</span>
              </div>

              {statusKamera === 'aktif' ? (
                <span style={{ background: 'rgba(34,197,94,0.2)', color: '#4ade80', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                  🟢 Kamera Siap
                </span>
              ) : (
                <span style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px' }}>
                  🔴 Belum Terhubung
                </span>
              )}
            </div>

            {/* Video Preview */}
            <div style={{ position: 'relative', width: '100%', height: '220px', background: '#020617', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #475569' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
              />

              {statusKamera !== 'aktif' && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.85)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', textAlign: 'center' }}>
                  <AlertCircle size={32} style={{ color: '#ef4444', marginBottom: '8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
                    Izin Akses Kamera Diperlukan
                  </div>
                  <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 12px', maxWidth: '280px' }}>
                    Sistem ujian mewajibkan kamera aktif untuk validasi identitas dan integritas pengawasan AI.
                  </p>
                  <button
                    onClick={aktifkanKamera}
                    style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <RefreshCw size={14} /> Izinkan Kamera
                  </button>
                </div>
              )}
            </div>

            <p style={{ fontSize: '11px', color: '#94a3b8', margin: '12px 0 0', lineHeight: 1.5 }}>
              💡 Pastikan wajah Anda terlihat jelas dengan pencahayaan yang cukup di dalam kotak kamera.
            </p>
          </div>

          {/* Box Kanan: Tata Tertib & Ketentuan Ujian */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldAlert size={18} style={{ color: '#fbbf24' }} />
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Tata Tertib & Anti-Kecurangan</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#38bdf8', fontWeight: 700 }}>1.</span>
                <span><strong>Layar Terkunci Penuh (Fullscreen):</strong> Halaman ujian akan otomatis masuk ke mode layar penuh. Dilarang keluar dari mode ini.</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>2.</span>
                <span><strong>Sistem 3 Strike (Pelanggaran):</strong> Dilarang beralih ke tab lain atau aplikasi lain (Alt+Tab / split screen). Terdeteksi 3x pelanggaran akan langsung <strong>didiskualifikasi otomatis</strong>.</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#4ade80', fontWeight: 700 }}>3.</span>
                <span><strong>Kamera Pengawas Wajib:</strong> Wajah Anda akan dipantau selama pengerjaan berlangsung.</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#fbbf24', fontWeight: 700 }}>4.</span>
                <span><strong>Simpan Jawaban Otomatis:</strong> Jawaban tersimpan otomatis secara real-time. Jika waktu habis, jawaban otomatis diserahkan.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Input Token Ujian */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid #3b82f6', borderRadius: '18px', padding: '28px 24px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(59,130,246,0.2)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#60a5fa', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
            <Key size={14} /> Langkah Terakhir: Verifikasi Akses
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 6px', color: '#ffffff' }}>
            Masukkan Token Ujian Resmi
          </h2>

          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 auto 20px', maxWidth: '500px' }}>
            Token ujian diumumkan oleh Panitia Bimbel Gemilang pada hari pelaksanaan. Masukkan kode token untuk membuka lembar soal CBT.
          </p>

          {errorMsg && (
            <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', color: '#991b1b', fontSize: '13px', fontWeight: 600, maxWidth: '480px', margin: '0 auto 16px', textAlign: 'left', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleMulaiUjian} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
            <input
              type="text"
              required
              placeholder="CONTOH: GEMILANG2026"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
              style={{
                width: '100%', maxWidth: '340px', padding: '12px 16px', borderRadius: '10px',
                border: '2px solid #3b82f6', background: '#020617', color: '#ffffff',
                fontSize: '20px', fontWeight: 800, textAlign: 'center', letterSpacing: '3px',
                fontFamily: 'monospace', outline: 'none'
              }}
            />

            <button
              type="submit"
              disabled={validating}
              style={{
                background: '#2563eb', color: '#ffffff', border: 'none',
                padding: '12px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
                display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: validating ? 'wait' : 'pointer',
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)'
              }}
            >
              {validating ? (
                <>Memvalidasi Token...</>
              ) : (
                <>
                  <Play size={16} fill="#fff" /> Masuk Lembar Ujian CBT
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
