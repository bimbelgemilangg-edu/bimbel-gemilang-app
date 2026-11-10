// src/pages/public/tobk/TobkCbtPage.jsx
// ============================================================
// LEMBAR UJIAN CBT TOBK PUBLIK GEMILANG (100% STANDAR RESMI)
// SISTEM BLOCK TIME UTBK-SNBT 2026 (7 Subtes) & TKA 2026 (75 Menit, Jeda 1m)
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ShieldAlert, AlertTriangle, CheckCircle, ChevronLeft,
  ChevronRight, Bookmark, Camera, Menu, X, Type, Send, LogOut,
  Maximize2, ArrowRight, Play, Sparkles, AlertCircle
} from 'lucide-react';
import {
  ambilSesiPesertaAktif, ambilEventTobkById, ambilEventTobkAktifPublik,
  simpanJawabanPeserta, selesaikanUjianTobk,
  SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK
} from '../../../services/tobkPublikService';
import RenderMath from '../../../components/RenderMath';

export default function TobkCbtPage() {
  const navigate = useNavigate();

  // Sesi & Event
  const [peserta, setPeserta] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [subtesList, setSubtesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tahap Ujian: 'mengerjakan' | 'transisi_subtes'
  const [tahap, setTahap] = useState('mengerjakan');

  // Navigasi Subtes (Block Time)
  const [subtesAktifIndex, setSubtesAktifIndex] = useState(0);
  const [indexSoal, setIndexSoal] = useState(0);

  // Jawaban & Ragu
  const [jawaban, setJawaban] = useState({});
  const [ragu, setRagu] = useState({});

  // Timer Blok Subtes
  const [sisaDetikSubtes, setSisaDetikSubtes] = useState(30 * 60);

  // Timer Jeda Transisi (Tombol Biru)
  const [sisaDetikTransisi, setSisaDetikTransisi] = useState(15);
  const [bisaLanjutTransisi, setBisaLanjutTransisi] = useState(false);

  // Ukuran Font
  const [fontSizeLevel, setFontSizeLevel] = useState('normal');

  // Palet Soal Drawer
  const [showPalet, setShowPalet] = useState(false);

  // Anti-Cheat 3 Strike
  const [pelanggaran, setPelanggaran] = useState([]);
  const [modalStrike, setModalStrike] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Webcam Proctor
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Modal Konfirmasi Selesai Subtes / Ujian
  const [showModalKonfirmasi, setShowModalKonfirmasi] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. Inisialisasi Ujian
  useEffect(() => {
    async function init() {
      const sesi = ambilSesiPesertaAktif();
      if (!sesi || !sesi.nama) {
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

      // Siapkan Daftar Subtes
      let sList = [];
      if (ev && Array.isArray(ev.subtes) && ev.subtes.length > 0) {
        sList = ev.subtes;
      } else if (ev && Array.isArray(ev.daftarSoal) && ev.daftarSoal.length > 0) {
        sList = [{ id: 'subtes_utama', nama: ev.judul || 'Subtes Utama', durasiMenit: ev.durasiMenit || 90, soal: ev.daftarSoal }];
      } else {
        sList = SUBTES_RESMI_UTBK_2026;
      }
      setSubtesList(sList);

      // Timer Subtes Pertama
      const durasiPertamaMenit = Number(sList[0]?.durasiMenit) || 30;
      setSisaDetikSubtes(Math.round(durasiPertamaMenit * 60));

      // Ambil Backup Jawaban
      try {
        const rawJawab = localStorage.getItem(`tobk_jawaban_${sesi.pesertaId}`);
        if (rawJawab) {
          const parsed = JSON.parse(rawJawab);
          if (parsed.jawaban) setJawaban(parsed.jawaban);
          if (parsed.ragu) setRagu(parsed.ragu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
        }
      } catch (e) {}

      setLoading(false);
      masukFullscreen();
    }
    init();
  }, [navigate]);

  // 2. Hubungkan Kamera Pengawas
  useEffect(() => {
    if (loading) return;

    let stream = null;
    navigator.mediaDevices?.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
      audio: false,
    })
    .then((s) => {
      stream = s;
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    })
    .catch((err) => {
      console.warn('Webcam proctor tidak aktif:', err);
    });

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [loading]);

  const masukFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  };

  // 3. Deteksi Pelanggaran (Kiosk Anti-Curang)
  const catatPelanggaran = useCallback((tipe) => {
    if (submitting) return;

    setPelanggaran((prev) => {
      const baru = [...prev, { tipe, time: new Date().toISOString() }];
      const totalStrike = baru.length;
      const maks = eventData?.maksimalPelanggaran || 3;

      if (totalStrike >= maks) {
        setModalStrike({
          strike: totalStrike,
          judul: '⛔ DISKUALIFIKASI OTOMATIS',
          pesan: `Anda telah melakukan ${totalStrike} kali pelanggaran (meninggalkan layar ujian). Sesuai aturan CBT Gemilang, ujian Anda otomatis dihentikan dan didiskualifikasi!`,
          fatal: true,
        });
        handleProsesSelesaiAkhir(true, baru);
      } else {
        setModalStrike({
          strike: totalStrike,
          judul: `⚠️ PERINGATAN PELANGGARAN (${totalStrike}/${maks})`,
          pesan: `Anda terdeteksi ${tipe === 'pindah_tab' ? 'berpindah tab / jendela lain' : 'keluar dari mode layar penuh'}. Harap tetap fokus pada lembar soal. Pelanggaran ke-${maks} akan mengakibatkan diskualifikasi otomatis!`,
          fatal: false,
        });
      }

      simpanJawabanPeserta(peserta?.pesertaId, jawaban, ragu, baru);
      return baru;
    });
  }, [submitting, eventData, peserta, jawaban, ragu]);

  useEffect(() => {
    if (loading || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) catatPelanggaran('pindah_tab');
    };
    const handleWindowBlur = () => catatPelanggaran('pindah_tab');
    const handleFullscreenChange = () => {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      if (!fs && !submitting) catatPelanggaran('keluar_fullscreen');
    };
    const handleContextMenu = (e) => { e.preventDefault(); return false; };
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && ['c', 'v', 'u', 'a', 'p', 's'].includes(e.key.toLowerCase())) e.preventDefault();
      if (e.key === 'F12' || e.key === 'PrintScreen') e.preventDefault();
    };
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Ujian sedang berlangsung! Yakin ingin keluar?';
      return e.returnValue;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loading, submitting, catatPelanggaran]);

  // 4. Timer Blok Waktu Subtes (Block Time)
  useEffect(() => {
    if (loading || submitting || tahap !== 'mengerjakan') return;

    const timerInterval = setInterval(() => {
      setSisaDetikSubtes((prev) => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          handleWaktuSubtesHabis();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [loading, submitting, tahap, subtesAktifIndex]);

  // 5. Timer Masa Transisi Antar-Subtes (Tombol Biru)
  useEffect(() => {
    if (tahap !== 'transisi_subtes') return;

    setBisaLanjutTransisi(false);
    const intervalTransisi = setInterval(() => {
      setSisaDetikTransisi((prev) => {
        if (prev <= 1) {
          clearInterval(intervalTransisi);
          setBisaLanjutTransisi(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalTransisi);
  }, [tahap]);

  // Aksi Saat Waktu Subtes Habis
  const handleWaktuSubtesHabis = () => {
    if (subtesAktifIndex < subtesList.length - 1) {
      // Masuk Masa Transisi
      mulaiMasaTransisi();
    } else {
      // Seluruh Subtes Selesai
      handleProsesSelesaiAkhir(false);
    }
  };

  // Mulai Masa Transisi Menuju Subtes Berikutnya
  const mulaiMasaTransisi = () => {
    setShowModalKonfirmasi(false);
    setShowPalet(false);

    const durasiJeda = Number(eventData?.jedaTransisiDetik) || 15;
    setSisaDetikTransisi(durasiJeda);
    setTahap('transisi_subtes');
  };

  // Masuk ke Subtes Berikutnya (Tombol Biru Diklik)
  const handleLanjutKeSubtesBerikutnya = () => {
    if (!bisaLanjutTransisi) return;

    const nextIndex = subtesAktifIndex + 1;
    const durasiNextMenit = Number(subtesList[nextIndex]?.durasiMenit) || 20;

    setSubtesAktifIndex(nextIndex);
    setIndexSoal(0);
    setSisaDetikSubtes(Math.round(durasiNextMenit * 60));
    setTahap('mengerjakan');
  };

  // Format Timer Jam:Menit:Detik
  const formatTimer = (totalDetik) => {
    const jam = Math.floor(totalDetik / 3600);
    const sisa = totalDetik % 3600;
    const menit = Math.floor(sisa / 60);
    const detik = sisa % 60;
    if (jam > 0) {
      return `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
    }
    return `${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
  };

  // Pilih Jawaban
  const handlePilihOpsi = (soalId, opsiKey) => {
    const baru = { ...jawaban, [soalId]: opsiKey };
    setJawaban(baru);
    simpanJawabanPeserta(peserta?.pesertaId, baru, ragu, pelanggaran);
  };

  // Toggle Ragu
  const handleToggleRagu = (soalId) => {
    const statusSekarang = !!ragu[soalId];
    const baru = { ...ragu, [soalId]: !statusSekarang };
    setRagu(baru);
    simpanJawabanPeserta(peserta?.pesertaId, jawaban, baru, pelanggaran);
  };

  // Hitung Skor & Selesaikan Ujian Keseluruhan
  const handleProsesSelesaiAkhir = async (isDiskualifikasi = false, customPelanggaran = null) => {
    setSubmitting(true);

    const semuaSoal = subtesList.flatMap((s) => s.soal || []);
    let benar = 0;
    let salah = 0;
    let kosong = 0;

    semuaSoal.forEach((soal) => {
      const jawab = jawaban[soal.id];
      if (!jawab) {
        kosong++;
      } else if (jawab === soal.kunciJawaban) {
        benar++;
      } else {
        salah++;
      }
    });

    const totalSoal = semuaSoal.length || 1;
    const skorPersen = Math.round((benar / totalSoal) * 100);
    const totalPel = (customPelanggaran || pelanggaran).length;

    const hasilPayload = {
      statusUjian: isDiskualifikasi ? 'diskualifikasi' : 'selesai',
      skor: isDiskualifikasi ? 0 : skorPersen,
      totalBenar: isDiskualifikasi ? 0 : benar,
      totalSalah: isDiskualifikasi ? totalSoal : salah,
      totalKosong: kosong,
      totalPelanggaran: totalPel,
      totalSoal,
      waktuSelesai: new Date().toISOString(),
    };

    try {
      await selesaikanUjianTobk(peserta?.pesertaId, hasilPayload);
    } catch (e) {
      console.warn('Gagal selesaikan TOBK:', e);
    }

    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    navigate('/tobk/selesai', { state: { hasil: hasilPayload, peserta, eventData } });
  };

  // Subtes & Soal Aktif
  const subtesAktif = subtesList[subtesAktifIndex] || { nama: 'Subtes', soal: [] };
  const daftarSoalSubtes = subtesAktif.soal || [];
  const soalSekarang = daftarSoalSubtes[indexSoal] || null;

  const sudahDijawab = (id) => jawaban[id] !== undefined && jawaban[id] !== '';
  const isRagu = (id) => !!ragu[id];

  // Hitung Soal Ragu di Subtes Berjalan
  const jumlahRaguDiSubtes = useMemo(() => {
    return daftarSoalSubtes.filter((s) => !!ragu[s.id]).length;
  }, [daftarSoalSubtes, ragu]);

  // Ukuran Font Dinamis
  const fontStyles = useMemo(() => {
    if (fontSizeLevel === 'small') return { soal: '14px', opsi: '13px', line: 1.5 };
    if (fontSizeLevel === 'large') return { soal: '19px', opsi: '17px', line: 1.7 };
    return { soal: '16px', opsi: '15px', line: 1.6 };
  }, [fontSizeLevel]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Mempersiapkan Lembar Soal CBT...
      </div>
    );
  }

  // ── LAYAR MASA TRANSISI ANTAR SUBTES (TOMBOL BIRU) ──
  if (tahap === 'transisi_subtes') {
    const subtesBerikutnya = subtesList[subtesAktifIndex + 1];

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '20px', maxWidth: '580px', width: '100%', padding: '36px 28px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Clock size={32} />
          </div>

          <div style={{ display: 'inline-flex', background: '#eff6ff', color: '#1d4ed8', padding: '4px 12px', borderRadius: '16px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            Regulasi UTBK / TKA · Point of No Return
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#0f172a' }}>
            Masa Transisi Menuju Subtes Berikutnya
          </h2>

          <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
            Waktu pengerjaan untuk <strong>{subtesAktif.nama}</strong> telah ditutup. Sesuai regulasi nasional, Anda <strong>tidak dapat kembali</strong> ke subtes sebelumnya.
          </p>

          {/* Info Subtes Berikutnya */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Subtes Berikutnya:
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1e3a8a', marginBottom: '4px' }}>
              {subtesBerikutnya?.nama}
            </div>
            <div style={{ fontSize: '12px', color: '#475569', display: 'flex', gap: '16px' }}>
              <span>⏱️ Durasi: <strong>{subtesBerikutnya?.durasiMenit || 20} Menit</strong></span>
              <span>📝 Jumlah Soal: <strong>{subtesBerikutnya?.soal?.length || subtesBerikutnya?.targetSoal || 20} Butir</strong></span>
            </div>
          </div>

          {/* Hitung Mundur Jeda & Tombol Biru */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {!bisaLanjutTransisi ? (
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Menunggu waktu transisi: {sisaDetikTransisi} detik
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={16} /> Waktu jeda selesai! Anda dapat melanjutkan ujian.
              </div>
            )}

            <button
              onClick={handleLanjutKeSubtesBerikutnya}
              disabled={!bisaLanjutTransisi}
              style={{
                width: '100%',
                maxWidth: '360px',
                padding: '14px 24px',
                borderRadius: '12px',
                border: 'none',
                background: bisaLanjutTransisi ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                fontSize: '15px',
                fontWeight: 800,
                cursor: bisaLanjutTransisi ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: bisaLanjutTransisi ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {bisaLanjutTransisi ? (
                <>MULAI SUBTES BERIKUTNYA <ArrowRight size={18} /></>
              ) : (
                <>⏳ Menunggu Jeda Transisi ({sisaDetikTransisi}s)</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LAYAR CBT PENGERJAAN NORMAL (BLOCK TIME) ──
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        color: '#0f172a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* ── TOP BAR CBT STANDAR NASIONAL ── */}
      <header
        style={{
          background: '#0f172a',
          color: '#ffffff',
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          zIndex: 50,
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        {/* Identitas Subtes Berjalan */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/pwa-192x192.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#3b82f6', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' }}>
                SUBTES {subtesAktifIndex + 1}/{subtesList.length}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
                {subtesAktif.nama}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {peserta?.nama} · {peserta?.asalSekolah || 'Peserta'}
            </div>
          </div>
        </div>

        {/* Indikator Block Time Countdown */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: sisaDetikSubtes < 300 ? '#dc2626' : '#1e293b',
            border: `1px solid ${sisaDetikSubtes < 300 ? '#ef4444' : '#334155'}`,
            padding: '6px 14px',
            borderRadius: '8px',
            animation: sisaDetikSubtes < 300 ? 'pulse 1s infinite' : 'none',
          }}
        >
          <Clock size={16} style={{ color: sisaDetikSubtes < 300 ? '#ffffff' : '#38bdf8' }} />
          <div>
            <div style={{ fontSize: '9px', color: sisaDetikSubtes < 300 ? '#fecaca' : '#94a3b8', textTransform: 'uppercase' }}>
              Sisa Waktu Subtes
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, letterSpacing: '1px' }}>
              {formatTimer(sisaDetikSubtes)}
            </div>
          </div>
        </div>

        {/* Kontrol CBT (Font Size, Palet Soal, Selesai Subtes) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#1e293b', borderRadius: '6px', border: '1px solid #334155', overflow: 'hidden' }}>
            <button
              onClick={() => setFontSizeLevel('small')}
              style={{ background: fontSizeLevel === 'small' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', padding: '5px 8px', fontSize: '11px', cursor: 'pointer' }}
              title="Font Kecil"
            >
              A-
            </button>
            <button
              onClick={() => setFontSizeLevel('normal')}
              style={{ background: fontSizeLevel === 'normal' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', padding: '5px 8px', fontSize: '11px', cursor: 'pointer' }}
              title="Font Normal"
            >
              A
            </button>
            <button
              onClick={() => setFontSizeLevel('large')}
              style={{ background: fontSizeLevel === 'large' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', padding: '5px 8px', fontSize: '11px', cursor: 'pointer' }}
              title="Font Besar"
            >
              A+
            </button>
          </div>

          <button
            onClick={() => setShowPalet(!showPalet)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#334155', color: '#fff', border: 'none',
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Menu size={14} /> Daftar Soal ({indexSoal + 1}/{daftarSoalSubtes.length})
          </button>

          {subtesAktifIndex < subtesList.length - 1 ? (
            <button
              onClick={() => setShowModalKonfirmasi(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#2563eb', color: '#fff', border: 'none',
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Selesai Subtes <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => setShowModalKonfirmasi(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: '#059669', color: '#fff', border: 'none',
                padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Send size={13} /> Selesai Ujian
            </button>
          )}
        </div>
      </header>

      {/* ── AREA LEMBAR SOAL ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        <main style={{ flex: 1, padding: '24px 20px 80px', overflowY: 'auto', maxWidth: '850px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {soalSekarang ? (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Header Butir Soal */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                  {subtesAktif.nama}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  Soal Nomor {indexSoal + 1} dari {daftarSoalSubtes.length}
                </span>
              </div>

              {/* Teks Soal */}
              <div style={{ fontSize: fontStyles.soal, lineHeight: fontStyles.line, color: '#1e293b', marginBottom: '24px', whiteSpace: 'pre-line' }}>
                <RenderMath text={soalSekarang.teksSoal || soalSekarang.soal || ''} />
              </div>

              {/* Pilihan Jawaban */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {soalSekarang.opsiJawaban && soalSekarang.opsiJawaban.map((opsi) => {
                  const terpilih = jawaban[soalSekarang.id] === opsi.key;

                  return (
                    <div
                      key={opsi.key}
                      onClick={() => handlePilihOpsi(soalSekarang.id, opsi.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '10px',
                        border: `2px solid ${terpilih ? '#2563eb' : '#e2e8f0'}`,
                        background: terpilih ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: terpilih ? '#2563eb' : '#f1f5f9',
                          color: terpilih ? '#ffffff' : '#475569',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '13px',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        {opsi.key}
                      </div>

                      <div style={{ fontSize: fontStyles.opsi, color: terpilih ? '#1e3a8a' : '#334155', lineHeight: 1.5 }}>
                        <RenderMath text={opsi.teks || ''} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Memuat butir soal subtes...
            </div>
          )}
        </main>

        {/* ── FLOATING WEBCAM PIP (Picture-In-Picture Pengawas AI) ── */}
        <div
          style={{
            position: 'fixed',
            bottom: '76px',
            right: '20px',
            width: '150px',
            height: '112px',
            background: '#020617',
            borderRadius: '10px',
            border: '2px solid #22c55e',
            overflow: 'hidden',
            boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'rgba(0,0,0,0.7)',
              color: '#4ade80',
              fontSize: '9px',
              fontWeight: 700,
              padding: '2px 4px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
            AI Proctor Aktif
          </div>
        </div>

        {/* ── DRAWER PALET SOAL (Daftar Nomor Subtes Berjalan) ── */}
        {showPalet && (
          <aside
            style={{
              position: 'fixed',
              top: '52px',
              right: 0,
              bottom: '64px',
              width: '320px',
              background: '#ffffff',
              borderLeft: '1px solid #cbd5e1',
              boxShadow: '-4px 0 12px rgba(0,0,0,0.1)',
              zIndex: 45,
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Palet Nomor ({subtesAktif.nama})</span>
              <button onClick={() => setShowPalet(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '11px', color: '#475569', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: '#22c55e', borderRadius: '3px' }} />
                <span>Terjawab</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: '#eab308', borderRadius: '3px' }} />
                <span>Ragu-ragu</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '3px' }} />
                <span>Belum</span>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', alignContent: 'start' }}>
              {daftarSoalSubtes.map((s, idx) => {
                const terjawab = sudahDijawab(s.id);
                const raguAktif = isRagu(s.id);
                const isCurrent = idx === indexSoal;

                let bg = '#ffffff';
                let fg = '#0f172a';
                let border = '#cbd5e1';

                if (terjawab) {
                  bg = '#22c55e';
                  fg = '#ffffff';
                  border = '#16a34a';
                }
                if (raguAktif) {
                  bg = '#eab308';
                  fg = '#ffffff';
                  border = '#ca8a04';
                }

                return (
                  <button
                    key={s.id || idx}
                    onClick={() => {
                      setIndexSoal(idx);
                      setShowPalet(false);
                    }}
                    style={{
                      height: '42px',
                      borderRadius: '8px',
                      border: `2px solid ${isCurrent ? '#2563eb' : border}`,
                      background: bg,
                      color: fg,
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: isCurrent ? '0 0 0 2px #93c5fd' : 'none',
                    }}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </aside>
        )}
      </div>

      {/* ── BOTTOM NAV BAR ── */}
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#ffffff',
          borderTop: '1px solid #cbd5e1',
          padding: '10px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 40,
        }}
      >
        <button
          onClick={() => setIndexSoal((prev) => Math.max(0, prev - 1))}
          disabled={indexSoal === 0}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: indexSoal === 0 ? '#f1f5f9' : '#2563eb',
            color: indexSoal === 0 ? '#94a3b8' : '#ffffff',
            border: 'none', padding: '9px 18px', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, cursor: indexSoal === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <ChevronLeft size={16} /> Sebelumnya
        </button>

        <button
          onClick={() => handleToggleRagu(soalSekarang?.id)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: isRagu(soalSekarang?.id) ? '#fef9c3' : '#f8fafc',
            border: `1px solid ${isRagu(soalSekarang?.id) ? '#ca8a04' : '#cbd5e1'}`,
            color: isRagu(soalSekarang?.id) ? '#854d0e' : '#475569',
            padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          <Bookmark size={15} fill={isRagu(soalSekarang?.id) ? '#ca8a04' : 'none'} />
          Ragu-ragu
        </button>

        {indexSoal < daftarSoalSubtes.length - 1 ? (
          <button
            onClick={() => setIndexSoal((prev) => Math.min(daftarSoalSubtes.length - 1, prev + 1))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#2563eb', color: '#ffffff',
              border: 'none', padding: '9px 18px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Berikutnya <ChevronRight size={16} />
          </button>
        ) : subtesAktifIndex < subtesList.length - 1 ? (
          <button
            onClick={() => setShowModalKonfirmasi(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#2563eb', color: '#ffffff',
              border: 'none', padding: '9px 20px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
            }}
          >
            Selesai Subtes <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => setShowModalKonfirmasi(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#059669', color: '#ffffff',
              border: 'none', padding: '9px 20px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(5,150,105,0.3)'
            }}
          >
            <Send size={15} /> Selesai & Kirim
          </button>
        )}
      </footer>

      {/* ── MODAL KONFIRMASI SELESAI SUBTES / UJIAN (DENGAN CEK RAGU-RAGU) ── */}
      {showModalKonfirmasi && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {subtesAktifIndex < subtesList.length - 1
                ? `Konfirmasi Selesai: ${subtesAktif.nama}`
                : 'Konfirmasi Selesai Seluruh Ujian'}
            </h3>

            {/* Peringatan Ragu-ragu (Regulasi TKA & UTBK) */}
            {jumlahRaguDiSubtes > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px', marginBottom: '14px', display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#92400e', fontSize: '12px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Perhatian Ragu-ragu:</strong> Masih ada <strong>{jumlahRaguDiSubtes} butir soal</strong> yang Anda tandai ragu-ragu di subtes ini. Pastikan jawaban sudah mantap sebelum mengunci.
                </div>
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              {subtesAktifIndex < subtesList.length - 1
                ? `Setelah Anda mengunci subtes ini, Anda TIDAK DAPAT KEMBALI ke butir soal ${subtesAktif.nama}. Apakah Anda yakin ingin melanjutkan ke masa transisi?`
                : 'Seluruh subtes telah selesai. Apakah Anda yakin ingin mengirim lembar jawaban sekarang?'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowModalKonfirmasi(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Periksa Lagi
              </button>

              <button
                type="button"
                onClick={() => {
                  if (subtesAktifIndex < subtesList.length - 1) {
                    mulaiMasaTransisi();
                  } else {
                    handleProsesSelesaiAkhir(false);
                  }
                }}
                style={{
                  background: subtesAktifIndex < subtesList.length - 1 ? '#2563eb' : '#059669',
                  color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 800, cursor: 'pointer'
                }}
              >
                {subtesAktifIndex < subtesList.length - 1 ? 'Kunci & Lanjut Transisi ▶' : 'Kirim Ujian Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3-STRIKE KECURANGAN ── */}
      {modalStrike && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '460px', width: '100%', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: modalStrike.fatal ? '#fee2e2' : '#fef3c7', color: modalStrike.fatal ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <ShieldAlert size={32} />
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: 800, color: modalStrike.fatal ? '#b91c1c' : '#b45309', margin: '0 0 10px' }}>
              {modalStrike.judul}
            </h3>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px' }}>
              {modalStrike.pesan}
            </p>

            {!modalStrike.fatal && (
              <button
                onClick={() => {
                  setModalStrike(null);
                  masukFullscreen();
                }}
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                Saya Mengerti & Kembali ke Soal
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
