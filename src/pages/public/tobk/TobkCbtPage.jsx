// src/pages/public/tobk/TobkCbtPage.jsx
// ============================================================
// LEMBAR UJIAN CBT TOBK PUBLIK GEMILANG (100% Profesional & Kiosk Anti-Curang)
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, ShieldAlert, AlertTriangle, CheckCircle, ChevronLeft,
  ChevronRight, Bookmark, Camera, Menu, X, Type, Send, LogOut,
  Maximize2, VolumeX, EyeOff
} from 'lucide-react';
import {
  ambilSesiPesertaAktif, ambilEventTobkById, ambilEventTobkAktifPublik,
  simpanJawabanPeserta, selesaikanUjianTobk, SOAL_PRESET_UTBK
} from '../../../services/tobkPublikService';
import RenderMath from '../../../components/RenderMath';
import RenderTable from '../../../components/RenderTable';

export default function TobkCbtPage() {
  const navigate = useNavigate();

  // Sesi & Event
  const [peserta, setPeserta] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Navigasi & Jawaban
  const [indexSoal, setIndexSoal] = useState(0);
  const [jawaban, setJawaban] = useState({}); // { [soalId]: key }
  const [ragu, setRagu] = useState({}); // { [soalId]: boolean }

  // Timer
  const [sisaDetik, setSisaDetik] = useState(90 * 60);

  // Ukuran Font Teks Soal
  const [fontSizeLevel, setFontSizeLevel] = useState('normal'); // 'small' | 'normal' | 'large'

  // Palet Soal Mobile/Sidebar
  const [showPalet, setShowPalet] = useState(false);

  // Anti-Cheat & 3-Strike System
  const [pelanggaran, setPelanggaran] = useState([]); // [{ type, time }]
  const [modalStrike, setModalStrike] = useState(null); // { strikeNumber, message }
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Webcam Proctoring
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Modal Konfirmasi Selesai
  const [showModalSubmit, setShowModalSubmit] = useState(false);
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

      // Siapkan Daftar Soal
      let list = SOAL_PRESET_UTBK;
      if (ev && Array.isArray(ev.daftarSoal) && ev.daftarSoal.length > 0) {
        list = ev.daftarSoal;
      }
      setSoalList(list);

      // Hitung Durasi Timer
      const durasiMenit = Number(ev?.durasiMenit) || 90;
      setSisaDetik(durasiMenit * 60);

      // Ambil backup jawaban jika ada
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

      // Minta Fullscreen saat mulai
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

  // 3. Masuk Mode Fullscreen
  const masukFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen();
    }
  };

  // 4. Deteksi Pelanggaran (Tab Switch / Window Blur / Keluar Fullscreen)
  const catatPelanggaran = useCallback((tipe) => {
    if (submitting) return;

    setPelanggaran((prev) => {
      const baru = [...prev, { tipe, time: new Date().toISOString() }];
      const totalStrike = baru.length;
      const maks = eventData?.maksimalPelanggaran || 3;

      if (totalStrike >= maks) {
        // Diskualifikasi Otomatis!
        setModalStrike({
          strike: totalStrike,
          judul: '⛔ DISKUALIFIKASI OTOMATIS',
          pesan: `Anda telah melakukan ${totalStrike} kali pelanggaran (meninggalkan layar ujian). Sesuai aturan CBT Gemilang, ujian Anda otomatis dihentikan dan didiskualifikasi!`,
          fatal: true,
        });
        handleProsesSelesai(true, baru);
      } else {
        setModalStrike({
          strike: totalStrike,
          judul: `⚠️ PERINGATAN PELANGGARAN (${totalStrike}/${maks})`,
          pesan: `Anda terdeteksi ${tipe === 'pindah_tab' ? 'berpindah tab / jendela lain' : 'keluar dari mode layar penuh'}. Harap tetap fokus pada lembar soal. Pelanggaran ke-${maks} akan mengakibatkan diskualifikasi otomatis!`,
          fatal: false,
        });
      }

      // Simpan log pelanggaran
      simpanJawabanPeserta(peserta?.pesertaId, jawaban, ragu, baru);
      return baru;
    });
  }, [submitting, eventData, peserta, jawaban, ragu]);

  // Listener Proteksi Browser Kiosk
  useEffect(() => {
    if (loading || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        catatPelanggaran('pindah_tab');
      }
    };

    const handleWindowBlur = () => {
      catatPelanggaran('pindah_tab');
    };

    const handleFullscreenChange = () => {
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(fs);
      if (!fs && !submitting) {
        catatPelanggaran('keluar_fullscreen');
      }
    };

    const handleContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e) => {
      // Blokir Ctrl+C, Ctrl+V, Ctrl+U, F12, dsb.
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'u', 'a', 'p', 's'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
      }
      if (e.key === 'F12' || e.key === 'PrintScreen') {
        e.preventDefault();
      }
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

  // 5. Timer Mundur Real-time
  useEffect(() => {
    if (loading || submitting) return;

    const interval = setInterval(() => {
      setSisaDetik((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleProsesSelesai(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, submitting]);

  // Format Jam:Menit:Detik
  const formatTimer = (totalDetik) => {
    const jam = Math.floor(totalDetik / 3600);
    const sisa = totalDetik % 3600;
    const menit = Math.floor(sisa / 60);
    const detik = sisa % 60;
    return `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
  };

  // 6. Pemilihan Jawaban
  const handlePilihOpsi = (opsiKey) => {
    const soalAktif = soalList[indexSoal];
    if (!soalAktif) return;

    const baru = { ...jawaban, [soalAktif.id]: opsiKey };
    setJawaban(baru);
    simpanJawabanPeserta(peserta?.pesertaId, baru, ragu, pelanggaran);
  };

  // Toggle Ragu-ragu
  const handleToggleRagu = () => {
    const soalAktif = soalList[indexSoal];
    if (!soalAktif) return;

    const statusSekarang = !!ragu[soalAktif.id];
    const baru = { ...ragu, [soalAktif.id]: !statusSekarang };
    setRagu(baru);
    simpanJawabanPeserta(peserta?.pesertaId, jawaban, baru, pelanggaran);
  };

  // 7. Hitung Skor & Submit Ujian
  const handleProsesSelesai = async (isDiskualifikasi = false, customPelanggaran = null) => {
    setSubmitting(true);

    let benar = 0;
    let salah = 0;
    let kosong = 0;

    soalList.forEach((soal) => {
      const jawab = jawaban[soal.id];
      if (!jawab) {
        kosong++;
      } else if (jawab === soal.kunciJawaban) {
        benar++;
      } else {
        salah++;
      }
    });

    const totalSoal = soalList.length || 1;
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

    // Keluar Fullscreen jika masih aktif
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }

    // Lanjut ke Laman Selesai
    navigate('/tobk/selesai', { state: { hasil: hasilPayload, peserta, eventData } });
  };

  const soalSekarang = soalList[indexSoal] || null;
  const sudahDijawab = (id) => jawaban[id] !== undefined && jawaban[id] !== '';
  const isRagu = (id) => !!ragu[id];

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
        }}
      >
        {/* Identitas Ujian & Siswa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/pwa-192x192.png" alt="Logo" style={{ width: '32px', height: '32px', borderRadius: '6px' }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b' }}>
              GEMILANG CBT · {eventData?.kategori || 'UTBK'}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              {peserta?.nama} ({peserta?.asalSekolah || 'Peserta'})
            </div>
          </div>
        </div>

        {/* Indikator Timer Digital */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: sisaDetik < 300 ? '#dc2626' : '#1e293b',
            border: `1px solid ${sisaDetik < 300 ? '#ef4444' : '#334155'}`,
            padding: '6px 14px',
            borderRadius: '8px',
            animation: sisaDetik < 300 ? 'pulse 1s infinite' : 'none',
          }}
        >
          <Clock size={16} style={{ color: sisaDetik < 300 ? '#ffffff' : '#38bdf8' }} />
          <div style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 800, letterSpacing: '1px' }}>
            {formatTimer(sisaDetik)}
          </div>
        </div>

        {/* Kontrol CBT (Font Size, Palet Soal, Submit) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Font Size Adjuster */}
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

          {/* Tombol Palet Soal */}
          <button
            onClick={() => setShowPalet(!showPalet)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#334155', color: '#fff', border: 'none',
              padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Menu size={14} /> Daftar Soal ({indexSoal + 1}/{soalList.length})
          </button>

          {/* Tombol Selesai */}
          <button
            onClick={() => setShowModalSubmit(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#059669', color: '#fff', border: 'none',
              padding: '6px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Send size={13} /> Selesai
          </button>
        </div>
      </header>

      {/* ── AREA UTAMA SOAL & PENGASUHAN ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Kolom Soal (Kiri / Tengah) */}
        <main style={{ flex: 1, padding: '24px 20px 80px', overflowY: 'auto', maxWidth: '850px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {soalSekarang ? (
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              {/* Info Subtes / Mapel & Nomor */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '18px' }}>
                <span style={{ fontSize: '12px', background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700 }}>
                  {soalSekarang.mapel || 'Subtes Penalaran Umum'}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  Soal Nomor {indexSoal + 1} dari {soalList.length}
                </span>
              </div>

              {/* Teks Soal */}
              <div style={{ fontSize: fontStyles.soal, lineHeight: fontStyles.line, color: '#1e293b', marginBottom: '24px', whiteSpace: 'pre-line' }}>
                <RenderMath text={soalSekarang.teksSoal || soalSekarang.soal || ''} />
              </div>

              {/* Pilihan Jawaban (A, B, C, D, E) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {soalSekarang.opsiJawaban && soalSekarang.opsiJawaban.map((opsi) => {
                  const terpilih = jawaban[soalSekarang.id] === opsi.key;

                  return (
                    <div
                      key={opsi.key}
                      onClick={() => handlePilihOpsi(opsi.key)}
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
              Memuat butir soal...
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

        {/* ── DRAWER PALET SOAL (Daftar Nomor) ── */}
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
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>Palet Nomor Soal</span>
              <button onClick={() => setShowPalet(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <X size={18} />
              </button>
            </div>

            {/* Indikator Warna */}
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

            {/* Grid Nomor */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', alignContent: 'start' }}>
              {soalList.map((s, idx) => {
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

      {/* ── BOTTOM NAV BAR (Tombol Prev, Ragu, Next) ── */}
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

        {/* Checkbox Ragu-ragu */}
        <button
          onClick={handleToggleRagu}
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

        {indexSoal < soalList.length - 1 ? (
          <button
            onClick={() => setIndexSoal((prev) => Math.min(soalList.length - 1, prev + 1))}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#2563eb', color: '#ffffff',
              border: 'none', padding: '9px 18px', borderRadius: '8px',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Berikutnya <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => setShowModalSubmit(true)}
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

      {/* ── MODAL PERINGATAN 3-STRIKE KECURANGAN ── */}
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

      {/* ── MODAL KONFIRMASI SUBMIT SELESAI ── */}
      {showModalSubmit && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Konfirmasi Selesai Ujian
            </h3>

            <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '13px', color: '#334155', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>📊 Terjawab: <strong>{Object.keys(jawaban).length} Soal</strong></div>
              <div>🔖 Ragu-ragu: <strong>{Object.values(ragu).filter(Boolean).length} Soal</strong></div>
              <div>⚪ Belum Dijawab: <strong>{soalList.length - Object.keys(jawaban).length} Soal</strong></div>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              Apakah Anda yakin ingin menyelesaikan ujian ini? Lembar jawaban yang sudah dikirim tidak dapat diubah kembali.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowModalSubmit(false)}
                disabled={submitting}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Lanjut Mengerjakan
              </button>
              <button
                type="button"
                onClick={() => handleProsesSelesai(false)}
                disabled={submitting}
                style={{ background: '#059669', color: '#ffffff', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                {submitting ? 'Mengirim...' : 'Ya, Selesaikan Ujian'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
