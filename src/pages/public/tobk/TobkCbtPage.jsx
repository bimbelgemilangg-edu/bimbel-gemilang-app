// src/pages/public/tobk/TobkCbtPage.jsx
// ============================================================
// LEMBAR UJIAN CBT TOBK PUBLIK GEMILANG (E-UJIAN RESMI)
// 100% PERSIS TAMPILAN E-UJIAN + SISTEM PENILAIAN KATKIEL / IRT TERSEMBUNYI
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Settings, User, Monitor, BookOpen, LogOut,
  ChevronLeft, ChevronRight, CheckSquare, Square, Clock,
  ArrowRight, ShieldAlert, CheckCircle2
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

  // Navigasi Subtes & Soal
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

  // Toggle Sidebar Mobile
  const [sidebarBuka, setSidebarBuka] = useState(false);
  const [paletBukaMobile, setPaletBukaMobile] = useState(false);

  // Anti-Cheat & 3 Strike
  const [pelanggaran, setPelanggaran] = useState([]);
  const [modalStrike, setModalStrike] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Webcam Proctor (PIP Discreet)
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Modal Konfirmasi Selesai Subtes / Ujian
  const [showModalKonfirmasi, setShowModalKonfirmasi] = useState(false);

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
          pesan: `Anda telah melakukan ${totalStrike} kali pelanggaran (meninggalkan jendela ujian). Sesuai aturan CBT Gemilang, ujian Anda otomatis dihentikan dan didiskualifikasi!`,
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

  const handleWaktuSubtesHabis = () => {
    if (subtesAktifIndex < subtesList.length - 1) {
      mulaiMasaTransisi();
    } else {
      handleProsesSelesaiAkhir(false);
    }
  };

  const mulaiMasaTransisi = () => {
    setShowModalKonfirmasi(false);
    const durasiJeda = Number(eventData?.jedaTransisiDetik) || 15;
    setSisaDetikTransisi(durasiJeda);
    setTahap('transisi_subtes');
  };

  const handleLanjutKeSubtesBerikutnya = () => {
    if (!bisaLanjutTransisi) return;

    const nextIndex = subtesAktifIndex + 1;
    const durasiNextMenit = Number(subtesList[nextIndex]?.durasiMenit) || 20;

    setSubtesAktifIndex(nextIndex);
    setIndexSoal(0);
    setSisaDetikSubtes(Math.round(durasiNextMenit * 60));
    setTahap('mengerjakan');
  };

  // Format Jam:Menit:Detik
  const formatTimer = (totalDetik) => {
    const jam = Math.floor(totalDetik / 3600);
    const sisa = totalDetik % 3600;
    const menit = Math.floor(sisa / 60);
    const detik = sisa % 60;
    return `${jam.toString().padStart(2, '0')}:${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
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

  // Hitung Skor (Pola Katkiel / IRT Skala 200–800 di Balik Layar)
  const handleProsesSelesaiAkhir = async (isDiskualifikasi = false, customPelanggaran = null) => {
    setSubmitting(true);

    const semuaSoal = subtesList.flatMap((s) => s.soal || []);
    let benar = 0;
    let salah = 0;
    let kosong = 0;
    let totalBobotTerkumpul = 0;
    let totalMaksBobot = 0;

    semuaSoal.forEach((soal) => {
      // Bobot soal berdasarkan subtes / mata pelajaran (Katkiel / UTBK IRT)
      const mapelLow = (soal.mapel || '').toLowerCase();
      let bobotSoal = 1.0;
      if (mapelLow.includes('matematika') || mapelLow.includes('kuantitatif')) {
        bobotSoal = 1.25;
      } else if (mapelLow.includes('penalaran')) {
        bobotSoal = 1.15;
      } else if (mapelLow.includes('inggris')) {
        bobotSoal = 1.1;
      }

      totalMaksBobot += bobotSoal;

      const jawab = jawaban[soal.id];
      if (!jawab) {
        kosong++;
      } else if (jawab === soal.kunciJawaban) {
        benar++;
        totalBobotTerkumpul += bobotSoal;
      } else {
        salah++;
      }
    });

    const totalSoal = semuaSoal.length || 1;
    // Skala Persentase Dasar
    const skorPersen = Math.round((benar / totalSoal) * 100);

    // Skala Resmi UTBK 200–800 (IRT Equivalent)
    const rasioBobot = totalMaksBobot > 0 ? totalBobotTerkumpul / totalMaksBobot : 0;
    const skorSkalaUtbk = Math.round(200 + rasioBobot * 600);

    // Hitung per Subtes untuk Rekap Nilai Admin (PU, PPU, PBM, PK, LBI, LBE, PM / Mapel TKA)
    const skorSubtes = subtesList.map((s) => {
      const soalSub = s.soal || [];
      let sBenar = 0;
      let sSalah = 0;
      let sKosong = 0;
      let sBobotTerkumpul = 0;
      let sMaksBobot = 0;

      soalSub.forEach((soal) => {
        const mapelLow = (soal.mapel || s.nama || '').toLowerCase();
        let bobotSoal = 1.0;
        if (mapelLow.includes('matematika') || mapelLow.includes('kuantitatif')) bobotSoal = 1.25;
        else if (mapelLow.includes('penalaran')) bobotSoal = 1.15;
        else if (mapelLow.includes('inggris')) bobotSoal = 1.1;
        sMaksBobot += bobotSoal;

        const ans = jawaban[soal.id];
        if (!ans) {
          sKosong++;
        } else if (ans === soal.kunciJawaban) {
          sBenar++;
          sBobotTerkumpul += bobotSoal;
        } else {
          sSalah++;
        }
      });

      const rasioSub = sMaksBobot > 0 ? sBobotTerkumpul / sMaksBobot : 0;
      const skorSub = isDiskualifikasi ? 0 : Math.round(200 + rasioSub * 600);

      return {
        id: s.id,
        kode: s.kode || s.id,
        nama: s.nama,
        skor: skorSub,
        benar: sBenar,
        salah: sSalah,
        kosong: sKosong,
        total: soalSub.length,
      };
    });

    const totalPel = (customPelanggaran || pelanggaran).length;

    const hasilPayload = {
      statusUjian: isDiskualifikasi ? 'diskualifikasi' : 'selesai',
      skor: isDiskualifikasi ? 0 : skorSkalaUtbk, // Skala UTBK 200–800
      skorPersen: isDiskualifikasi ? 0 : skorPersen,
      skorSubtes, // Nilai per subtes / mapel
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

  // Subtes & Soal Berjalan
  const subtesAktif = subtesList[subtesAktifIndex] || { nama: 'Subtes', soal: [] };
  const daftarSoalSubtes = subtesAktif.soal || [];
  const soalSekarang = daftarSoalSubtes[indexSoal] || null;

  const sudahDijawab = (id) => jawaban[id] !== undefined && jawaban[id] !== '';
  const isRagu = (id) => !!ragu[id];

  const jumlahRaguDiSubtes = useMemo(() => {
    return daftarSoalSubtes.filter((s) => !!ragu[s.id]).length;
  }, [daftarSoalSubtes, ragu]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Memuat Ujian E-Ujian Gemilang...
      </div>
    );
  }

  // ── LAYAR MASA TRANSISI ANTAR SUBTES (TOMBOL BIRU) ──
  if (tahap === 'transisi_subtes') {
    const subtesBerikutnya = subtesList[subtesAktifIndex + 1];

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', maxWidth: '540px', width: '100%', padding: '36px 28px', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Clock size={32} />
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', color: '#0f172a' }}>
            Masa Transisi Menuju Subtes Berikutnya
          </h2>

          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
            Waktu pengerjaan untuk <strong>{subtesAktif.nama}</strong> telah ditutup. Sesuai regulasi UTBK/TKA, Anda <strong>tidak dapat kembali</strong> ke subtes sebelumnya.
          </p>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Subtes Berikutnya:
            </div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d4ed8', marginBottom: '4px' }}>
              {subtesBerikutnya?.nama}
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              ⏱️ Durasi: <strong>{subtesBerikutnya?.durasiMenit || 20} Menit</strong> · 📝 Jumlah Soal: <strong>{subtesBerikutnya?.soal?.length || subtesBerikutnya?.targetSoal || 20} Butir</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {!bisaLanjutTransisi ? (
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={16} /> Waktu jeda transisi: {sisaDetikTransisi} detik
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} /> Jeda selesai! Silakan klik tombol biru untuk lanjut.
              </div>
            )}

            <button
              onClick={handleLanjutKeSubtesBerikutnya}
              disabled={!bisaLanjutTransisi}
              style={{
                width: '100%',
                maxWidth: '340px',
                padding: '13px 24px',
                borderRadius: '8px',
                border: 'none',
                background: bisaLanjutTransisi ? '#2563eb' : '#94a3b8',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: bisaLanjutTransisi ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: bisaLanjutTransisi ? '0 4px 14px rgba(37,99,235,0.4)' : 'none',
                transition: 'all 0.25s ease',
              }}
            >
              {bisaLanjutTransisi ? (
                <>MULAI SUBTES BERIKUTNYA <ArrowRight size={16} /></>
              ) : (
                <>⏳ Menunggu Jeda ({sisaDetikTransisi}s)</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TAMPILAN PERSIS E-UJIAN ──
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
    >
      {/* ── TOP NAVBAR BIRU (E-UJIAN) ── */}
      <header
        style={{
          background: '#2563eb', // Royal Blue
          height: '52px',
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          color: '#ffffff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '0.5px' }}>
            E-Ujian
          </span>
          <button
            onClick={() => setSidebarBuka(!sidebarBuka)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            <Bell size={18} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '7px',
                height: '7px',
                background: '#ef4444',
                borderRadius: '50%',
              }}
            />
          </div>
          <Settings size={18} style={{ cursor: 'pointer' }} />
        </div>
      </header>

      {/* ── KONTEN UTAMA: 3 KOLOM PERSIS SCREENSHOT ── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* 1. SIDEBAR KIRI (USER & SISWA MENU) */}
        <aside
          style={{
            width: '240px',
            background: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            padding: '24px 16px',
            boxSizing: 'border-box',
            flexShrink: 0,
            overflowY: 'auto',
          }}
          className="eujian-sidebar"
        >
          {/* Profil Avatar & Nama */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f1f5f9',
                border: '2px solid #cbd5e1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                marginBottom: '10px',
              }}
            >
              <User size={36} />
            </div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
              {peserta?.nama || 'Siswa Demo1'}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {peserta?.asalSekolah ? `${peserta.asalSekolah}` : 'Siswa E-Ujian'}
            </div>
          </div>

          {/* Menu Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <Monitor size={16} />
              <span>Dashboard</span>
            </div>

            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '14px 0 4px 12px' }}>
              SISWA MENU
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: '6px',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BookOpen size={16} />
                <span>E-Learning</span>
              </div>
              <ChevronRight size={14} style={{ color: '#94a3b8' }} />
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                color: '#2563eb',
                background: '#eff6ff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <BookOpen size={16} />
              <span>Daftar Ruang Ujian</span>
            </div>

            <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '14px 0 4px 12px' }}>
              USER MENU
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <User size={16} />
              <span>Profil</span>
            </div>

            <div
              onClick={() => {
                if (window.confirm('Yakin ingin keluar dari ruang ujian?')) navigate('/tobk');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                borderRadius: '6px',
                color: '#dc2626',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Keluar</span>
            </div>
          </div>
        </aside>

        {/* 2. KOLOM TENGAH: KOTAK SOAL PERSIS SCREENSHOT */}
        <main
          style={{
            flex: 1,
            padding: '24px 20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {soalSekarang ? (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: '480px',
              }}
            >
              {/* Header Box: SOAL NO. [ 1 ] dan Two-Tone SISA WAKTU */}
              <div
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                {/* SOAL NO. 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', letterSpacing: '0.5px' }}>
                    SOAL NO.
                  </span>
                  <span
                    style={{
                      background: '#2563eb', // Blue badge
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '4px',
                    }}
                  >
                    {indexSoal + 1}
                  </span>
                </div>

                {/* Two-Tone Timer Pill: [ SISA WAKTU ] [ 01:59:56 ] */}
                <div
                  style={{
                    display: 'flex',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    fontSize: '12px',
                    fontWeight: 700,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    style={{
                      background: '#4f46e5', // Dark Violet/Indigo
                      color: '#ffffff',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      letterSpacing: '0.5px',
                    }}
                  >
                    SISA WAKTU
                  </div>
                  <div
                    style={{
                      background: sisaDetikSubtes < 300 ? '#dc2626' : '#0284c7', // Cyan/Blue
                      color: '#ffffff',
                      padding: '6px 12px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {formatTimer(sisaDetikSubtes)}
                  </div>
                </div>
              </div>

              {/* Teks Soal & Garis Bawah Pembatas */}
              <div style={{ padding: '20px 24px 10px', flex: 1 }}>
                <div
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: '#334155',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: '20px',
                    whiteSpace: 'pre-line',
                  }}
                >
                  <RenderMath text={soalSekarang.teksSoal || soalSekarang.soal || ''} />
                </div>

                {/* Pilihan Radio Opsi (arang, kayu, abu, tanah persis screenshot) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {soalSekarang.opsiJawaban && soalSekarang.opsiJawaban.map((opsi) => {
                    const terpilih = jawaban[soalSekarang.id] === opsi.key;

                    return (
                      <label
                        key={opsi.key}
                        onClick={() => handlePilihOpsi(soalSekarang.id, opsi.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          color: '#334155',
                          userSelect: 'none',
                        }}
                      >
                        {/* Radio Circle */}
                        <span
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            border: `2px solid ${terpilih ? '#2563eb' : '#94a3b8'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            background: '#ffffff',
                          }}
                        >
                          {terpilih && (
                            <span
                              style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: '#2563eb',
                              }}
                            />
                          )}
                        </span>

                        <span>
                          <RenderMath text={opsi.teks || ''} />
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Aksi Bawah: < Soal Sebelumnya | ☐ Ragu-Ragu | Soal Selanjutnya > */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #f1f5f9',
                  background: '#fafafa',
                  borderRadius: '0 0 8px 8px',
                  flexWrap: 'wrap',
                  gap: '10px',
                }}
              >
                {/* Tombol Kiri: Soal Sebelumnya */}
                <button
                  onClick={() => setIndexSoal((prev) => Math.max(0, prev - 1))}
                  disabled={indexSoal === 0}
                  style={{
                    background: '#2563eb', // Blue button
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 18px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: indexSoal === 0 ? 'not-allowed' : 'pointer',
                    opacity: indexSoal === 0 ? 0.6 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  &lt; Soal Sebelumnya
                </button>

                {/* Tombol Tengah: Ragu-Ragu (Amber/Golden Orange) */}
                <button
                  onClick={() => handleToggleRagu(soalSekarang?.id)}
                  style={{
                    background: '#f59e0b', // Amber/Yellow
                    color: '#ffffff',
                    border: 'none',
                    padding: '9px 20px',
                    borderRadius: '5px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {isRagu(soalSekarang?.id) ? (
                    <CheckSquare size={16} />
                  ) : (
                    <Square size={16} />
                  )}
                  Ragu-Ragu
                </button>

                {/* Tombol Kanan: Soal Selanjutnya / Selesai Subtes */}
                {indexSoal < daftarSoalSubtes.length - 1 ? (
                  <button
                    onClick={() => setIndexSoal((prev) => Math.min(daftarSoalSubtes.length - 1, prev + 1))}
                    style={{
                      background: '#2563eb', // Blue button
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 18px',
                      borderRadius: '5px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    Soal Selanjutnya &gt;
                  </button>
                ) : (
                  <button
                    onClick={() => setShowModalKonfirmasi(true)}
                    style={{
                      background: subtesAktifIndex < subtesList.length - 1 ? '#2563eb' : '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: '9px 20px',
                      borderRadius: '5px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {subtesAktifIndex < subtesList.length - 1 ? 'Selesai Subtes >' : 'Selesai Ujian >'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Memuat soal...
            </div>
          )}
        </main>

        {/* 3. PANEL KANAN: NOMOR SOAL GRID 3 KOLOM PERSIS SCREENSHOT */}
        <aside
          style={{
            width: '200px',
            background: '#ffffff',
            borderLeft: '1px solid #e2e8f0',
            padding: '20px 16px',
            boxSizing: 'border-box',
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#334155',
              paddingBottom: '10px',
              borderBottom: '2px solid #cbd5e1',
              marginBottom: '16px',
              textAlign: 'center',
              letterSpacing: '0.5px',
            }}
          >
            NOMOR SOAL
          </div>

          {/* Grid 3 Kolom */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {daftarSoalSubtes.map((s, idx) => {
              const terjawab = sudahDijawab(s.id);
              const raguAktif = isRagu(s.id);
              const isCurrent = idx === indexSoal;

              let bg = '#ffffff';
              let fg = '#334155';
              let border = '#cbd5e1';

              if (terjawab) {
                bg = '#22c55e'; // Green answered
                fg = '#ffffff';
                border = '#16a34a';
              }
              if (raguAktif) {
                bg = '#f59e0b'; // Amber ragu
                fg = '#ffffff';
                border = '#d97706';
              }

              return (
                <button
                  key={s.id || idx}
                  onClick={() => setIndexSoal(idx)}
                  style={{
                    height: '38px',
                    borderRadius: '5px',
                    border: `1px solid ${isCurrent ? '#2563eb' : border}`,
                    background: bg,
                    color: fg,
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCurrent ? '0 0 0 2px #93c5fd' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </aside>

        {/* ── WEBCAM AI PROCTOR DISKRIT (Floating PIP) ── */}
        <div
          style={{
            position: 'fixed',
            bottom: '16px',
            right: '216px',
            width: '130px',
            height: '98px',
            background: '#020617',
            borderRadius: '6px',
            border: '2px solid #22c55e',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
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
              background: 'rgba(0,0,0,0.65)',
              color: '#4ade80',
              fontSize: '8px',
              fontWeight: 700,
              padding: '2px',
              textAlign: 'center',
            }}
          >
            ● AI Proctor Aktif
          </div>
        </div>
      </div>

      {/* ── MODAL KONFIRMASI SELESAI DENGAN DETEKSI RAGU-RAGU ── */}
      {showModalKonfirmasi && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              {subtesAktifIndex < subtesList.length - 1
                ? `Kunci Subtes: ${subtesAktif.nama}`
                : 'Selesaikan Ujian CBT'}
            </h3>

            {jumlahRaguDiSubtes > 0 && (
              <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: '8px', padding: '10px 12px', marginBottom: '14px', fontSize: '12px', color: '#92400e' }}>
                ⚠️ <strong>Perhatian:</strong> Masih ada <strong>{jumlahRaguDiSubtes} butir soal</strong> yang Anda tandai Ragu-Ragu.
              </div>
            )}

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px', lineHeight: 1.5 }}>
              {subtesAktifIndex < subtesList.length - 1
                ? `Setelah mengunci subtes ini, Anda tidak dapat kembali ke butir soal ini lagi. Lanjut ke masa transisi?`
                : 'Seluruh butir soal telah selesai dikerjakan. Apakah Anda yakin ingin mengirim lembar jawaban?'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowModalKonfirmasi(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
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
                  color: '#ffffff', border: 'none', padding: '8px 20px', borderRadius: '6px',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {subtesAktifIndex < subtesList.length - 1 ? 'Kunci Subtes >' : 'Kirim Ujian'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3-STRIKE KECURANGAN ── */}
      {modalStrike && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '440px', width: '100%', padding: '24px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: modalStrike.fatal ? '#fee2e2' : '#fef3c7', color: modalStrike.fatal ? '#dc2626' : '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <ShieldAlert size={28} />
            </div>

            <h3 style={{ fontSize: '17px', fontWeight: 800, color: modalStrike.fatal ? '#b91c1c' : '#b45309', margin: '0 0 10px' }}>
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
                style={{ background: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 22px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
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
