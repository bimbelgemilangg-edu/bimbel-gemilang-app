// src/pages/public/tobk/TobkCbtPage.jsx
// ============================================================
// LEMBAR UJIAN CBT TOBK PUBLIK GEMILANG (E-UJIAN RESMI)
// 100% PERSIS TAMPILAN E-UJIAN + SISTEM PENILAIAN KATKIEL / IRT TERSEMBUNYI
// BEBAS BLANK SCREEN LOGOUT, 160 SOAL RESMI KATKIEL, WEBCAM CROSS-DEVICE,
// DAN TAMPILAN PERPINDAHAN SUBTES INSTITUSIONAL RESMI (TANPA TULISAN MASA TRANSISI)
// ============================================================

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Settings, User, LogOut,
  ChevronRight, CheckSquare, Square, Clock,
  ArrowRight, ShieldAlert, CheckCircle2, Lock,
  Camera, AlertCircle, LayoutGrid, X, Type
} from 'lucide-react';
import {
  ambilSesiPesertaAktif, ambilEventTobkById, ambilEventTobkAktifPublik,
  simpanJawabanPeserta, selesaikanUjianTobk, dengarEventTobk,
  SUBTES_RESMI_UTBK_2026, SOAL_PRESET_UTBK
} from '../../../services/tobkPublikService';
import RenderMath from '../../../components/RenderMath';
import RenderTable from '../../../components/RenderTable';
import TeksSoalBergambar from '../../../components/TeksSoalBergambar';
import { bacaanDari, gambarButirDari } from '../../../utils/fieldButirSoal';
import { db } from '../../../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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

  // Timer Jeda Antar-Subtes (Tombol Biru)
  const [sisaDetikTransisi, setSisaDetikTransisi] = useState(15);
  const [bisaLanjutTransisi, setBisaLanjutTransisi] = useState(false);

  // Toggle Sidebar & Deteksi Mobile
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 860 : false);
  const [sidebarBuka, setSidebarBuka] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 860 : true);
  const [panelNomorBuka, setPanelNomorBuka] = useState(false);
  const [showModalSettings, setShowModalSettings] = useState(false);

  // Pengaturan Ukuran Font: 'kecil' | 'sedang' | 'besar'
  const [ukuranFont, setUkuranFont] = useState(() => {
    try {
      return localStorage.getItem('gemilang_cbt_font') || 'sedang';
    } catch {
      return 'sedang';
    }
  });

  const handleUbahFont = (ukuran) => {
    setUkuranFont(ukuran);
    try {
      localStorage.setItem('gemilang_cbt_font', ukuran);
    } catch {
      /* ignore */
    }
  };

  const skalaFont = useMemo(() => {
    switch (ukuranFont) {
      case 'kecil':
        return { bacaan: '13.5px', soal: '14px', opsi: '13.5px', lineHeight: 1.6 };
      case 'besar':
        return { bacaan: '17px', soal: '17.5px', opsi: '17px', lineHeight: 1.8 };
      case 'sedang':
      default:
        return { bacaan: '15px', soal: '15.5px', opsi: '15px', lineHeight: 1.7 };
    }
  }, [ukuranFont]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 860;
      setIsMobile(mobile);
      if (!mobile) {
        setPanelNomorBuka(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Anti-Cheat & 3 Strike
  const [pelanggaran, setPelanggaran] = useState([]);
  const [modalStrike, setModalStrike] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Webcam Proctor (PIP Discreet)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [kameraStatus, setKameraStatus] = useState('memuat'); // 'memuat' | 'aktif' | 'gagal'
  const [kameraMinimized, setKameraMinimized] = useState(false);
  const [fotoProfil, setFotoProfil] = useState(() => {
    const sesi = ambilSesiPesertaAktif();
    return sesi?.fotoProfil || (sesi?.pesertaId ? localStorage.getItem(`tobk_foto_profil_${sesi.pesertaId}`) : null) || null;
  });

  // Modal Dialogs
  const [showModalKonfirmasi, setShowModalKonfirmasi] = useState(false);
  const [showModalKeluar, setShowModalKeluar] = useState(false);

  // 1. Inisialisasi Ujian
  useEffect(() => {
    async function init() {
      const sesi = ambilSesiPesertaAktif();
      if (!sesi || !sesi.nama) {
        navigate('/tobk');
        return;
      }
      setPeserta(sesi);
      if (sesi.fotoProfil) {
        setFotoProfil(sesi.fotoProfil);
      }

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

      // Pastikan ujian UTBK selalu memuat 160 butir soal lengkap resmi Katkiel Project (7 Subtes)
      // bukan soal dummy/placeholder 1-7 butir dari event lama
      const totalSoalAda = sList.flatMap((s) => s.soal || []).length;
      const isTka = (ev?.formatUjian || '').startsWith('TKA') || (ev?.kategori || '').startsWith('TKA');
      if (!isTka && (totalSoalAda < 50 || !ev || ev.formatUjian === 'UTBK_2026' || ev.sumberSoal === 'preset_utbk_2026')) {
        sList = SUBTES_RESMI_UTBK_2026;
      }

      // Pastikan setiap butir soal memiliki id unik
      sList = sList.map((sub, sIdx) => ({
        ...sub,
        soal: (sub.soal || []).map((q, qIdx) => ({
          ...q,
          id: q.id || `q_${sub.id || sIdx + 1}_${q.nomor || qIdx + 1}`,
        })),
      }));

      setSubtesList(sList);

      // Timer Subtes Pertama
      const durasiPertamaMenit = Number(sList[0]?.durasiMenit) || 30;
      let detikAwal = Math.round(durasiPertamaMenit * 60);

      // Ambil Backup Jawaban & Sisa Waktu (Local + Cloud Firestore Recovery)
      try {
        let loadedJawabanLocal = false;
        const rawJawab = localStorage.getItem(`tobk_jawaban_${sesi.pesertaId}`);
        if (rawJawab) {
          const parsed = JSON.parse(rawJawab);
          if (parsed.jawaban && Object.keys(parsed.jawaban).length > 0) {
            setJawaban(parsed.jawaban);
            loadedJawabanLocal = true;
          }
          if (parsed.ragu) setRagu(parsed.ragu);
          if (parsed.pelanggaran) setPelanggaran(parsed.pelanggaran);
          if (parsed.subtesAktifIndex !== undefined && Number(parsed.subtesAktifIndex) < sList.length) {
            setSubtesAktifIndex(Number(parsed.subtesAktifIndex));
          }
          if (parsed.indexSoal !== undefined) {
            setIndexSoal(Number(parsed.indexSoal));
          }
        }

        // Jika localStorage kosong (misal siswa pindah laptop/komputer lain), pulihkan jawaban dari Cloud Firestore
        if (!loadedJawabanLocal && sesi.pesertaId) {
          try {
            const snapCloud = await getDoc(doc(db, 'tobk_event_jawaban', sesi.pesertaId));
            if (snapCloud.exists()) {
              const dataCloud = snapCloud.data();
              if (dataCloud.jawaban) setJawaban(dataCloud.jawaban);
              if (dataCloud.ragu) setRagu(dataCloud.ragu);
              if (dataCloud.pelanggaran) setPelanggaran(dataCloud.pelanggaran);
              if (dataCloud.subtesAktifIndex !== undefined && Number(dataCloud.subtesAktifIndex) < sList.length) {
                setSubtesAktifIndex(Number(dataCloud.subtesAktifIndex));
              }
              if (dataCloud.indexSoal !== undefined) {
                setIndexSoal(Number(dataCloud.indexSoal));
              }
            }
          } catch (errCloud) {
            console.warn('[TOBK] Gagal sync jawaban dari cloud:', errCloud);
          }
        }

        const savedDetik = localStorage.getItem(`tobk_sisa_detik_${sesi.pesertaId}`);
        if (savedDetik && Number(savedDetik) > 5) {
          detikAwal = Number(savedDetik);
        }

        // Tandai status aktif "mengerjakan" di database Firestore
        try {
          await updateDoc(doc(db, 'tobk_event_leads', sesi.pesertaId), {
            statusUjian: 'mengerjakan',
            waktuMulai: new Date().toISOString(),
          });
        } catch (errStatus) {}
      } catch (e) {}

      setSisaDetikSubtes(detikAwal);
      setLoading(false);
      masukFullscreen();
    }
    init();
  }, [navigate]);

  // Live Sync status event TOBK (Live Jeda Ujian, Token, Status)
  useEffect(() => {
    const eId = peserta?.eventId || eventData?.id;
    if (!eId) return;

    // 1. Real-time Firestore listener
    const unsub = dengarEventTobk(eId, (updatedEv) => {
      if (updatedEv) {
        setEventData((prev) => ({ ...prev, ...updatedEv }));
      }
    });

    // 2. Fallback polling setiap 3 detik
    const pollInterval = setInterval(async () => {
      try {
        const evBaru = await ambilEventTobkById(eId);
        if (evBaru) {
          setEventData((prev) => ({ ...prev, ...evBaru }));
        }
      } catch (err) {}
    }, 3000);

    return () => {
      unsub();
      clearInterval(pollInterval);
    };
  }, [peserta?.eventId, eventData?.id]);

  // Simpan sisa detik ke local backup
  useEffect(() => {
    if (peserta?.pesertaId && sisaDetikSubtes > 0) {
      try {
        localStorage.setItem(`tobk_sisa_detik_${peserta.pesertaId}`, String(sisaDetikSubtes));
      } catch (e) {}
    }
  }, [sisaDetikSubtes, peserta?.pesertaId]);

  // 2. Hubungkan Kamera Pengawas (Cross-Device Sequential Fallback)
  const hubungkanKamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Browser tidak mendukung getUserMedia');
      setKameraStatus('gagal');
      return;
    }

    setKameraStatus('memuat');

    // Multi-level fallback: Dari ideal 640x480 -> generic user facing -> generic video true
    const daftarConstraints = [
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false },
      { video: { facingMode: 'user' }, audio: false },
      { video: true, audio: false },
    ];

    let mediaStream = null;
    for (const c of daftarConstraints) {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia(c);
        if (mediaStream) break;
      } catch (err) {
        // Coba constraint berikutnya
      }
    }

    if (!mediaStream) {
      setKameraStatus('gagal');
      return;
    }

    streamRef.current = mediaStream;
    if (videoRef.current) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          setKameraStatus('aktif');
        }).catch(() => {
          setKameraStatus('aktif');
        });
      };
      videoRef.current.play().then(() => {
        setKameraStatus('aktif');
      }).catch(() => {});
    } else {
      setKameraStatus('aktif');
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      hubungkanKamera();
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [loading, hubungkanKamera]);

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
    // Abaikan jika ujian sedang dijeda (sholat/istirahat), submitting, atau modal keluar aktif
    if (submitting || showModalKeluar || showModalKonfirmasi || eventData?.isPaused) return;

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

      simpanJawabanPeserta(peserta?.pesertaId, jawaban, ragu, baru, {
        sisaDetikSubtes,
        subtesAktifIndex,
        indexSoal
      });
      return baru;
    });
  }, [submitting, showModalKeluar, showModalKonfirmasi, eventData, peserta, jawaban, ragu, sisaDetikSubtes, subtesAktifIndex, indexSoal]);

  useEffect(() => {
    if (loading || submitting) return;

    const handleVisibilityChange = () => {
      if (eventData?.isPaused) return;
      if (document.hidden && !showModalKeluar && !showModalKonfirmasi && !submitting) {
        catatPelanggaran('pindah_tab');
      }
    };
    const handleWindowBlur = () => {
      if (eventData?.isPaused) return;
      if (!showModalKeluar && !showModalKonfirmasi && !submitting) {
        catatPelanggaran('pindah_tab');
      }
    };
    const handleFullscreenChange = () => {
      if (eventData?.isPaused) return;
      const fs = !!(document.fullscreenElement || document.webkitFullscreenElement);
      if (!fs && !submitting && !showModalKeluar && !showModalKonfirmasi) {
        catatPelanggaran('keluar_fullscreen');
      }
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
  }, [loading, submitting, showModalKeluar, showModalKonfirmasi, catatPelanggaran, eventData?.isPaused]);

  // 4. Timer Blok Waktu Subtes (Block Time) -- Berhenti Total Saat Ujian Dijeda (Zero Lost Time)
  useEffect(() => {
    if (loading || submitting || tahap !== 'mengerjakan' || eventData?.isPaused) return;

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
  }, [loading, submitting, tahap, subtesAktifIndex, eventData?.isPaused]);

  // 5. Timer Jeda Antar-Subtes (Tombol Biru) -- Juga Dijeda Jika Ujian Sedang Dijeda
  useEffect(() => {
    if (tahap !== 'transisi_subtes' || eventData?.isPaused) return;

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
  }, [tahap, eventData?.isPaused]);

  const handleWaktuSubtesHabis = () => {
    if (subtesAktifIndex < subtesList.length - 1) {
      mulaiLayarPerpindahanSubtes();
    } else {
      handleProsesSelesaiAkhir(false);
    }
  };

  const mulaiLayarPerpindahanSubtes = () => {
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

  // Pilih Jawaban Opsi Tunggal
  const handlePilihOpsi = (soalId, opsiKey) => {
    const baru = { ...jawaban, [soalId]: opsiKey };
    setJawaban(baru);
    simpanJawabanPeserta(peserta?.pesertaId, baru, ragu, pelanggaran);
  };

  // Pilih Jawaban Pernyataan Majemuk (Benar/Salah atau Sesuai/Tidak Sesuai)
  const handlePilihPernyataan = (soalId, pKey, pilihanVal) => {
    const prev = (typeof jawaban[soalId] === 'object' && jawaban[soalId] !== null) ? jawaban[soalId] : {};
    const baru = {
      ...jawaban,
      [soalId]: {
        ...prev,
        [pKey]: pilihanVal,
      },
    };
    setJawaban(baru);
    simpanJawabanPeserta(peserta?.pesertaId, baru, ragu, pelanggaran);
  };

  // Toggle Ragu
  const handleToggleRagu = (soalId) => {
    if (!soalId) return;
    const baru = { ...ragu, [soalId]: !ragu[soalId] };
    setRagu(baru);
    simpanJawabanPeserta(peserta?.pesertaId, jawaban, baru, pelanggaran);
  };

  // Selesaikan Ujian & Bersihkan Layar (Bebas Gray Blank Screen)
  const handleProsesSelesaiAkhir = async (isDiskualifikasi = false, customPelanggaran = null) => {
    setSubmitting(true);

    const semuaSoal = subtesList.flatMap((s) => s.soal || []);
    let benar = 0;
    let salah = 0;
    let kosong = 0;
    let totalBobotTerkumpul = 0;
    let totalMaksBobot = 0;

    semuaSoal.forEach((soal) => {
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
      const kunci = soal.kunciJawaban || soal.kunci;
      if (!jawab || (typeof jawab === 'object' && Object.keys(jawab).length === 0)) {
        kosong++;
      } else if (typeof kunci === 'object' && kunci !== null && typeof jawab === 'object') {
        const keys = Object.keys(kunci);
        const cocok = keys.filter((k) => String(jawab[k] || '').toLowerCase() === String(kunci[k] || '').toLowerCase()).length;
        if (cocok === keys.length) {
          benar++;
          totalBobotTerkumpul += bobotSoal;
        } else if (cocok > 0) {
          totalBobotTerkumpul += bobotSoal * (cocok / keys.length);
          salah++;
        } else {
          salah++;
        }
      } else if (String(jawab).trim().toUpperCase() === String(kunci).trim().toUpperCase()) {
        benar++;
        totalBobotTerkumpul += bobotSoal;
      } else {
        salah++;
      }
    });

    const totalSoal = semuaSoal.length || 1;
    const skorPersen = Math.round((benar / totalSoal) * 100);

    const rasioBobot = totalMaksBobot > 0 ? totalBobotTerkumpul / totalMaksBobot : 0;
    const skorSkalaUtbk = Math.round(200 + rasioBobot * 600);

    // Hitung per Subtes
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
        const kunci = soal.kunciJawaban || soal.kunci;
        if (!ans || (typeof ans === 'object' && Object.keys(ans).length === 0)) {
          sKosong++;
        } else if (typeof kunci === 'object' && kunci !== null && typeof ans === 'object') {
          const keys = Object.keys(kunci);
          const cocok = keys.filter((k) => String(ans[k] || '').toLowerCase() === String(kunci[k] || '').toLowerCase()).length;
          if (cocok === keys.length) {
            sBenar++;
            sBobotTerkumpul += bobotSoal;
          } else if (cocok > 0) {
            sBobotTerkumpul += bobotSoal * (cocok / keys.length);
            sSalah++;
          } else {
            sSalah++;
          }
        } else if (String(ans).trim().toUpperCase() === String(kunci).trim().toUpperCase()) {
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
      skor: isDiskualifikasi ? 0 : skorSkalaUtbk,
      skorPersen: isDiskualifikasi ? 0 : skorPersen,
      skorSubtes,
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

    // Hentikan Stream Kamera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    // Keluar Fullscreen Bersih
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (e) {}
    }

    navigate('/tobk/selesai', { state: { hasil: hasilPayload, peserta, eventData } });
  };

  // Tangani Keluar Secara Bersih dari Modal Konfirmasi
  const handleKeluarBersih = async () => {
    setSubmitting(true);
    setShowModalKeluar(false);
    await handleProsesSelesaiAkhir(false);
  };

  // Subtes & Soal Berjalan
  const subtesAktif = subtesList[subtesAktifIndex] || { nama: 'Subtes', soal: [] };
  const daftarSoalSubtes = subtesAktif.soal || [];
  const soalSekarang = daftarSoalSubtes[indexSoal] || null;

  const sudahDijawab = (id) => {
    const v = jawaban[id];
    if (v === undefined || v === null || v === '') return false;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return true;
  };
  const isRagu = (id) => !!ragu[id];

  const jumlahRaguDiSubtes = useMemo(() => {
    return daftarSoalSubtes.filter((s) => Boolean(ragu[s.id])).length;
  }, [daftarSoalSubtes, ragu]);

  // Daftar opsi yang ternormalisasi (mendukung teks, gambar, key 'A'..'E')
  const daftarOpsi = useMemo(() => {
    if (!soalSekarang) return [];
    const raw = soalSekarang.opsiJawaban || soalSekarang.opsi || soalSekarang.pilihan || [];
    if (!Array.isArray(raw)) return [];
    const HURUF = ['A', 'B', 'C', 'D', 'E', 'F'];
    return raw.map((item, idx) => {
      if (typeof item === 'string') {
        return { key: HURUF[idx] || String(idx + 1), teks: item, gambar: null };
      }
      if (typeof item === 'object' && item !== null) {
        return {
          key: String(item.key || item.label || HURUF[idx] || '').toUpperCase(),
          teks: item.teks || item.text || item.isi || '',
          gambar: item.gambar || item.gambarUrl || item.url || null,
          tabel: item.tabel || item.table || null,
          headerTabel: item.headerTabel || null,
        };
      }
      return { key: HURUF[idx] || String(idx + 1), teks: String(item || ''), gambar: null };
    });
  }, [soalSekarang]);

  // ── RENDER HELPER: ISI SIDEBAR KIRI (PROFIL & PROGRES SUBTES) ──
  const renderSidebarKiri = () => (
    <>
      {/* Profil Avatar & Nama */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '18px' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: '#eff6ff',
            border: '2px solid #93c5fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563eb',
            marginBottom: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(37,99,235,0.15)',
          }}
        >
          {fotoProfil ? (
            <img src={fotoProfil} alt="Foto Profil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <User size={34} />
          )}
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
          {peserta?.nama || 'Peserta Ujian'}
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
          {peserta?.asalSekolah || 'Siswa CBT Gemilang'}
        </div>
        {(peserta?.targetPtn || peserta?.targetJurusan) && (
          <div style={{ marginTop: '6px', fontSize: '10px', fontWeight: 600, color: '#2563eb', background: '#eff6ff', padding: '3px 8px', borderRadius: '4px' }}>
            🎯 {peserta.targetPtn} · {peserta.targetJurusan}
          </div>
        )}
      </div>

      {/* Status Server CBT */}
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#16a34a', fontWeight: 700, marginBottom: '3px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
          Server CBT Terhubung
        </div>
        <div style={{ color: '#64748b' }}>
          💾 Jawaban tersimpan otomatis secara berkala.
        </div>
      </div>

      {/* Ringkasan Subtes Ujian */}
      <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
        PROGRES SUBTES ({subtesAktifIndex + 1}/{subtesList.length})
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '18px', flex: 1, overflowY: 'auto' }}>
        {subtesList.map((s, idx) => {
          const isCurrent = idx === subtesAktifIndex;
          const isPassed = idx < subtesAktifIndex;

          let badgeBg = '#f1f5f9';
          let badgeColor = '#64748b';
          let statusText = 'Menunggu';

          if (isCurrent) {
            badgeBg = '#eff6ff';
            badgeColor = '#2563eb';
            statusText = 'Aktif';
          } else if (isPassed) {
            badgeBg = '#f0fdf4';
            badgeColor = '#16a34a';
            statusText = 'Terkunci';
          }

          return (
            <div
              key={s.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                background: isCurrent ? '#f0f7ff' : '#ffffff',
                border: `1px solid ${isCurrent ? '#bfdbfe' : '#f1f5f9'}`,
                fontSize: '11px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                {isPassed ? (
                  <CheckCircle2 size={14} color="#16a34a" />
                ) : isCurrent ? (
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb' }} />
                ) : (
                  <Lock size={12} color="#94a3b8" />
                )}
                <span style={{ fontWeight: isCurrent ? 700 : 500, color: isCurrent ? '#1e3a8a' : '#475569', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {(() => {
                    const m = (s.nama || '').match(/\(([^)]+)\)/);
                    if (m) {
                      const acronym = m[1].toUpperCase();
                      const clean = s.nama.replace(/\([^)]+\)/, '').replace(/Literasi Bahasa/i, 'B.').trim();
                      return `${acronym} · ${clean}`;
                    }
                    return s.nama;
                  })()}
                </span>
              </div>

              <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                {statusText}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tombol Akhiri Ujian */}
      <button
        onClick={() => setShowModalKeluar(true)}
        style={{
          marginTop: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '11px 14px',
          borderRadius: '8px',
          color: '#dc2626',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          fontWeight: 700,
          fontSize: '12px',
          cursor: 'pointer',
          width: '100%',
          transition: 'all 0.2s ease',
        }}
      >
        <LogOut size={16} />
        <span>Akhiri Sesi Ujian</span>
      </button>
    </>
  );

  // ── RENDER HELPER: ISI PANEL NOMOR SOAL ──
  const renderPanelNomorContent = (onSelectNumber) => (
    <>
      <div
        style={{
          fontSize: '13px',
          fontWeight: 800,
          color: '#334155',
          paddingBottom: '10px',
          borderBottom: '2px solid #cbd5e1',
          marginBottom: '14px',
          textAlign: 'center',
          letterSpacing: '0.5px',
        }}
      >
        NOMOR SOAL
      </div>

      {/* Grid Nomor Soal */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(4, 1fr)' : 'repeat(3, 1fr)',
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
            bg = '#22c55e';
            fg = '#ffffff';
            border = '#16a34a';
          }
          if (raguAktif) {
            bg = '#f59e0b';
            fg = '#ffffff';
            border = '#d97706';
          }

          return (
            <button
              key={s.id || idx}
              onClick={() => {
                setIndexSoal(idx);
                if (onSelectNumber) onSelectNumber();
              }}
              style={{
                height: isMobile ? '42px' : '38px',
                borderRadius: '6px',
                border: `2px solid ${isCurrent ? '#2563eb' : border}`,
                background: bg,
                color: fg,
                fontWeight: 800,
                fontSize: isMobile ? '13px' : '12px',
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
    </>
  );

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        Memuat Ujian E-Ujian Gemilang...
      </div>
    );
  }

  // ── LAYAR PERPINDAHAN SUBTES RESMI (BEBAS KATA "MASA TRANSISI") ──
  if (tahap === 'transisi_subtes') {
    const subtesBerikutnya = subtesList[subtesAktifIndex + 1];

    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div style={{ background: '#ffffff', color: '#0f172a', borderRadius: '16px', maxWidth: '560px', width: '100%', padding: '36px 32px', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '16px', border: '1px solid #bfdbfe' }}>
            <Clock size={15} /> SISTEM UJIAN CBT RESMI GEMILANG
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
            KONFIRMASI PERPINDAHAN SUBTES
          </h2>

          <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
            Waktu pengerjaan untuk <strong>{subtesAktif.nama}</strong> telah selesai. Seluruh jawaban Anda telah tersimpan secara aman di server pengawas ujian.
          </p>

          {/* Kartu Subtes Selesai */}
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'left' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#22c55e', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 700, textTransform: 'uppercase' }}>Subtes Selesai (Terkunci)</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>{subtesAktif.nama}</div>
            </div>
          </div>

          {/* Kartu Subtes Berikutnya */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ fontSize: '11px', color: '#2563eb', textTransform: 'uppercase', fontWeight: 800, marginBottom: '4px', letterSpacing: '0.5px' }}>
              SUBTES BERIKUTNYA
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              {subtesBerikutnya?.nama}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: '#475569', background: '#ffffff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
              <div>⏱️ Alokasi Waktu: <strong style={{ color: '#0f172a' }}>{subtesBerikutnya?.durasiMenit || 20} Menit</strong></div>
              <div>📝 Jumlah Soal: <strong style={{ color: '#0f172a' }}>{subtesBerikutnya?.soal?.length || subtesBerikutnya?.targetSoal || 20} Butir</strong></div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px', fontStyle: 'italic' }}>
              *Sistem Block Time: Waktu akan langsung berkurang otomatis begitu Anda membuka subtes ini. Anda tidak dapat kembali ke subtes sebelumnya.
            </div>
          </div>

          {/* Status Server & Tombol Lanjut */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {!bisaLanjutTransisi ? (
              <div style={{ fontSize: '13px', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} /> Menyiapkan Lembar Soal... Tombol terbuka dalam {sisaDetikTransisi} detik
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} /> Server Siap! Silakan tekan tombol di bawah untuk memulai.
              </div>
            )}

            <button
              onClick={handleLanjutKeSubtesBerikutnya}
              disabled={!bisaLanjutTransisi}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: '8px',
                border: 'none',
                background: bisaLanjutTransisi ? '#2563eb' : '#cbd5e1',
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
                <>MASUK KE SUBTES BERIKUTNYA <ArrowRight size={17} /></>
              ) : (
                <>⏳ Menyiapkan Subtes ({sisaDetikTransisi}s)</>
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
        position: 'relative',
      }}
    >
      {/* ── PEMBUNGKUS KONTEN UJIAN (BLUR SAAT DIJEDA, HP TETAP STAY) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          filter: eventData?.isPaused ? 'blur(8px)' : 'none',
          pointerEvents: eventData?.isPaused ? 'none' : 'auto',
          userSelect: eventData?.isPaused ? 'none' : 'auto',
          transition: 'filter 0.3s ease',
        }}
      >
        {/* ── TOP NAVBAR BIRU (E-UJIAN) ── */}
      <header
        style={{
          background: '#2563eb',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
          <span style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 800, letterSpacing: '0.5px' }}>
            E-Ujian
          </span>
          <button
            onClick={() => setSidebarBuka(!sidebarBuka)}
            title="Sembunyikan/Tampilkan Profil & Subtes"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '4px',
            }}
          >
            <Menu size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '14px' }}>
          {/* PENGATUR UKURAN FONT INTERAKTIF (A- | A | A+) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255, 255, 255, 0.16)',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
            }}
            title="Atur Ukuran Teks Soal"
          >
            <button
              onClick={() => handleUbahFont('kecil')}
              title="Font Kecil (13.5px)"
              style={{
                background: ukuranFont === 'kecil' ? '#ffffff' : 'transparent',
                color: ukuranFont === 'kecil' ? '#1d4ed8' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 7px',
                fontSize: '11px',
                fontWeight: 800,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              A-
            </button>
            <button
              onClick={() => handleUbahFont('sedang')}
              title="Font Sedang / Normal (15.5px)"
              style={{
                background: ukuranFont === 'sedang' ? '#ffffff' : 'transparent',
                color: ukuranFont === 'sedang' ? '#1d4ed8' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              A
            </button>
            <button
              onClick={() => handleUbahFont('besar')}
              title="Font Besar (17.5px)"
              style={{
                background: ukuranFont === 'besar' ? '#ffffff' : 'transparent',
                color: ukuranFont === 'besar' ? '#1d4ed8' : '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 7px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                lineHeight: 1,
              }}
            >
              A+
            </button>
          </div>

          {/* TOMBOL DAFTAR SOAL KHUSUS MOBILE (Buka Drawer Nomor Soal) */}
          {isMobile && (
            <button
              onClick={() => setPanelNomorBuka(true)}
              title="Buka Daftar Nomor Soal"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: '#ffffff',
                color: '#1d4ed8',
                border: 'none',
                borderRadius: '6px',
                padding: '5px 9px',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }}
            >
              <LayoutGrid size={14} />
              <span>{indexSoal + 1}/{daftarSoalSubtes.length}</span>
            </button>
          )}

          {/* Ikon Notifikasi / Bell */}
          <div style={{ position: 'relative', display: isMobile ? 'none' : 'block' }}>
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

          {/* Ikon Pengaturan / Settings Modal */}
          <button
            onClick={() => setShowModalSettings(true)}
            title="Buka Pengaturan Tampilan"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '6px',
              borderRadius: '4px',
            }}
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* ── KONTEN UTAMA: 3 KOLOM PERSIS SCREENSHOT ── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        {/* 1. SIDEBAR KIRI (IDENTITAS PESERTA & STATUS UJIAN RESMI) */}
        {!isMobile && sidebarBuka && (
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
            {renderSidebarKiri()}
          </aside>
        )}

        {/* DRAWER SIDEBAR KIRI DI MOBILE */}
        {isMobile && sidebarBuka && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
            }}
            onClick={() => setSidebarBuka(false)}
          >
            <aside
              style={{
                width: '280px',
                maxWidth: '85vw',
                height: '100%',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 16px',
                boxSizing: 'border-box',
                overflowY: 'auto',
                boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>PROFIL & SUBTES</span>
                <button
                  onClick={() => setSidebarBuka(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  <X size={18} />
                </button>
              </div>
              {renderSidebarKiri()}
            </aside>
          </div>
        )}

        {/* 2. KOLOM TENGAH: KOTAK SOAL PERSIS SCREENSHOT */}
        <main
          style={{
            flex: 1,
            padding: isMobile ? '12px 10px' : '24px 20px',
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
                  padding: isMobile ? '12px 14px' : '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #f1f5f9',
                  gap: '8px',
                }}
              >
                {/* SOAL NO. 1 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155', letterSpacing: '0.5px' }}>
                    SOAL NO.
                  </span>
                  <span
                    style={{
                      background: '#2563eb',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '3px 9px',
                      borderRadius: '4px',
                    }}
                  >
                    {indexSoal + 1}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '6px' }}>
                    dari {daftarSoalSubtes.length} butir
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
                      background: '#4f46e5',
                      color: '#ffffff',
                      padding: isMobile ? '5px 8px' : '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      letterSpacing: '0.5px',
                      fontSize: isMobile ? '11px' : '12px',
                    }}
                  >
                    SISA WAKTU
                  </div>
                  <div
                    style={{
                      background: sisaDetikSubtes < 300 ? '#dc2626' : '#0284c7',
                      color: '#ffffff',
                      padding: isMobile ? '5px 8px' : '6px 12px',
                      fontFamily: 'monospace',
                      fontSize: isMobile ? '12px' : '13px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {formatTimer(sisaDetikSubtes)}
                  </div>
                </div>
              </div>

              {/* Teks Soal & Wacana */}
              <div style={{ padding: isMobile ? '14px 12px 10px' : '20px 24px 10px', flex: 1 }}>
                {/* Wacana / Teks Stimulus jika ada */}
                {(() => {
                  const bcn = bacaanDari(soalSekarang);
                  if (!bcn) return null;
                  return (
                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        marginBottom: '18px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 800,
                          color: '#1e3a8a',
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <span>📖</span>
                        <span>{bcn.judul || 'Wacana / Teks Stimulus'}</span>
                        {bcn.rentang && (
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            (untuk soal no {bcn.rentang.dari}–{bcn.rentang.sampai})
                          </span>
                        )}
                      </div>
                      {bcn.gambar && bcn.gambar.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '12px', justifyContent: 'center' }}>
                          {bcn.gambar.map((g, gi) => {
                            const url = typeof g === 'string' ? g : g?.url || g?.uploadedUrl;
                            if (!url) return null;
                            return (
                              <img
                                key={gi}
                                src={url}
                                alt={`Gambar Wacana ${gi + 1}`}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: isMobile ? '200px' : '280px',
                                  borderRadius: '8px',
                                  border: '1px solid #cbd5e1',
                                  display: 'block',
                                  objectFit: 'contain',
                                }}
                              />
                            );
                          })}
                        </div>
                      )}
                      {bcn.teks && (
                        <div style={{ fontSize: skalaFont.bacaan, lineHeight: skalaFont.lineHeight, color: '#1e293b', whiteSpace: 'pre-line' }}>
                          <RenderMath text={bcn.teks} />
                        </div>
                      )}
                      {bcn.tabel && <RenderTable table={bcn.tabel} />}
                    </div>
                  );
                })()}

                {/* Badan Soal & Gambar Menggunakan TeksSoalBergambar */}
                <div
                  style={{
                    paddingBottom: '16px',
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: '20px',
                  }}
                >
                  <TeksSoalBergambar
                    teks={soalSekarang.teksSoal || soalSekarang.soal || soalSekarang.teks_soal || ''}
                    soal={soalSekarang}
                    gambarUrls={gambarButirDari(soalSekarang).filter(url => {
                      const bcn = bacaanDari(soalSekarang);
                      const bcnUrls = (bcn?.gambar || []).map(g => (typeof g === 'string' ? g : g?.url || g?.uploadedUrl));
                      return !bcnUrls.includes(url);
                    })}
                    gayaTeks={{
                      fontSize: skalaFont.soal,
                      lineHeight: skalaFont.lineHeight,
                      color: '#0f172a',
                      whiteSpace: 'pre-line',
                    }}
                    gayaGambar={{
                      maxWidth: '100%',
                      maxHeight: isMobile ? '220px' : '320px',
                      borderRadius: '8px',
                      margin: '12px auto',
                    }}
                  />
                  {(soalSekarang.tabelSoal || soalSekarang.tabel_soal || soalSekarang.tabel) && (
                    <RenderTable table={soalSekarang.tabelSoal || soalSekarang.tabel_soal || soalSekarang.tabel} />
                  )}
                </div>

                {/* Pilihan Opsi Tunggal ATAU Pernyataan Majemuk (TKA / AKM / UTBK) */}
                {daftarOpsi.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '10px' : '14px' }}>
                    {daftarOpsi.map((opsi) => {
                      const terpilih = String(jawaban[soalSekarang.id] || '').toUpperCase() === String(opsi.key).toUpperCase();

                      return (
                        <label
                          key={opsi.key}
                          onClick={() => handlePilihOpsi(soalSekarang.id, opsi.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '12px',
                            cursor: 'pointer',
                            fontSize: skalaFont.opsi,
                            lineHeight: 1.6,
                            color: '#1e293b',
                            userSelect: 'none',
                            padding: isMobile ? '10px 12px' : '10px 14px',
                            background: terpilih ? '#eff6ff' : '#ffffff',
                            borderRadius: '8px',
                            border: `1.5px solid ${terpilih ? '#2563eb' : '#e2e8f0'}`,
                            boxShadow: terpilih ? '0 1px 3px rgba(37,99,235,0.15)' : 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {/* Radio Circle */}
                          <span
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              border: `2px solid ${terpilih ? '#2563eb' : '#94a3b8'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              marginTop: '3px',
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

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontWeight: 800, marginRight: '6px', color: terpilih ? '#1d4ed8' : '#334155' }}>
                              {opsi.key}.
                            </span>
                            {opsi.teks && <RenderMath text={opsi.teks} />}
                            {opsi.gambar && (
                              <img
                                src={opsi.gambar}
                                alt={`Opsi ${opsi.key}`}
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: isMobile ? '130px' : '160px',
                                  borderRadius: '6px',
                                  marginTop: '6px',
                                  display: 'block',
                                  border: '1px solid #e2e8f0',
                                }}
                              />
                            )}
                            {opsi.tabel && Array.isArray(opsi.tabel) && opsi.tabel.length > 0 && (
                              <div style={{ marginTop: '8px', maxWidth: '300px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                  {opsi.headerTabel && opsi.headerTabel.length > 0 && (
                                    <thead>
                                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }}>
                                        {opsi.headerTabel.map((h, hi) => (
                                          <th key={hi} style={{ padding: '4px 8px', textAlign: hi === 0 ? 'left' : 'center', fontWeight: 700, color: '#334155' }}>{h}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                  )}
                                  <tbody>
                                    {opsi.tabel.map((row, rIdx) => (
                                      <tr key={rIdx} style={{ borderTop: rIdx > 0 || opsi.headerTabel ? '1px solid #e2e8f0' : 'none' }}>
                                        <td style={{ padding: '4px 8px', fontWeight: 600, color: '#475569', background: '#f8fafc', borderRight: '1px solid #e2e8f0' }}>{row.kolom}</td>
                                        <td style={{ padding: '4px 8px', textAlign: 'center', color: '#1e293b' }}>{row.isi}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ) : (soalSekarang.pernyataan && Array.isArray(soalSekarang.pernyataan) && soalSekarang.pernyataan.length > 0) ? (
                  <div style={{ marginTop: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: isMobile ? '12px' : '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>
                      📋 Tentukan Kesesuaian Tiap Pernyataan:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(() => {
                        const kunciStr = JSON.stringify(soalSekarang.kunci || soalSekarang.kunciJawaban || '').toLowerCase();
                        const teksSoalStr = String(soalSekarang.teks || soalSekarang.soal || soalSekarang.teks_soal || '').toLowerCase();
                        const isTepat = kunciStr.includes('tepat') || teksSoalStr.includes('tepat');
                        const isSesuai = kunciStr.includes('sesuai') || teksSoalStr.includes('sesuai');
                        const pilihan1 = isTepat ? 'Tepat' : isSesuai ? 'Sesuai' : 'Benar';
                        const pilihan2 = isTepat ? 'Tidak Tepat' : isSesuai ? 'Tidak Sesuai' : 'Salah';
                        const jawabMap = (typeof jawaban[soalSekarang.id] === 'object' && jawaban[soalSekarang.id] !== null) ? jawaban[soalSekarang.id] : {};

                        return soalSekarang.pernyataan.map((p, pIdx) => {
                          const pKey = String.fromCharCode(65 + pIdx); // 'A', 'B', 'C'
                          const altKey = String(pIdx + 1); // '1', '2', '3'
                          const currentPilih = jawabMap[pKey] || jawabMap[altKey] || jawabMap[p.id] || '';
                          const teksP = typeof p === 'string' ? p : (p.teks || p.pernyataan || '');

                          return (
                            <div key={pIdx} style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px', padding: isMobile ? '10px' : '12px 14px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                              <div style={{ flex: '1 1 260px', fontSize: skalaFont.opsi, color: '#1e293b', lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 700, marginRight: '6px', color: '#2563eb' }}>{pKey}.</span>
                                {teksP && <RenderMath text={teksP} />}
                                {(p.gambar && Array.isArray(p.gambar) ? p.gambar : []).map((g, gIdx) => {
                                  const src = typeof g === 'string' ? g : (g?.url || g?.dataUrl || g?.uploadedUrl);
                                  if (!src) return null;
                                  return (
                                    <img
                                      key={gIdx}
                                      src={src}
                                      alt={g?.deskripsi || `Gambar Pernyataan ${pKey}`}
                                      style={{ maxWidth: '100%', maxHeight: 150, display: 'block', margin: teksP ? '6px 0 2px 0' : '2px 0', borderRadius: 6, border: '1px solid #e2e8f0', objectFit: 'contain' }}
                                    />
                                  );
                                })}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', flexShrink: 0, width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'initial' }}>
                                <button
                                  type="button"
                                  onClick={() => handlePilihPernyataan(soalSekarang.id, pKey, pilihan1)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: currentPilih.toLowerCase() === pilihan1.toLowerCase() ? '2px solid #2563eb' : '1px solid #cbd5e1',
                                    background: currentPilih.toLowerCase() === pilihan1.toLowerCase() ? '#eff6ff' : '#ffffff',
                                    color: currentPilih.toLowerCase() === pilihan1.toLowerCase() ? '#1d4ed8' : '#64748b',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  ✓ {pilihan1}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePilihPernyataan(soalSekarang.id, pKey, pilihan2)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: currentPilih.toLowerCase() === pilihan2.toLowerCase() ? '2px solid #ef4444' : '1px solid #cbd5e1',
                                    background: currentPilih.toLowerCase() === pilihan2.toLowerCase() ? '#fef2f2' : '#ffffff',
                                    color: currentPilih.toLowerCase() === pilihan2.toLowerCase() ? '#b91c1c' : '#64748b',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  ✗ {pilihan2}
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Tombol Aksi Bawah: < Soal Sebelumnya | ☐ Ragu-Ragu | Soal Selanjutnya > */}
              <div
                style={{
                  padding: isMobile ? '10px 12px' : '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #f1f5f9',
                  background: '#fafafa',
                  borderRadius: '0 0 8px 8px',
                  gap: isMobile ? '6px' : '10px',
                }}
              >
                {/* Tombol Kiri: Soal Sebelumnya */}
                <button
                  onClick={() => setIndexSoal((prev) => Math.max(0, prev - 1))}
                  disabled={indexSoal === 0}
                  style={{
                    background: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    padding: isMobile ? '9px 10px' : '9px 18px',
                    borderRadius: '6px',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 600,
                    cursor: indexSoal === 0 ? 'not-allowed' : 'pointer',
                    opacity: indexSoal === 0 ? 0.5 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    flex: isMobile ? 1 : 'initial',
                    whiteSpace: 'nowrap',
                  }}
                >
                  &lt; {isMobile ? 'Kembali' : 'Soal Sebelumnya'}
                </button>

                {/* Tombol Tengah: Ragu-Ragu */}
                <button
                  onClick={() => handleToggleRagu(soalSekarang?.id)}
                  style={{
                    background: isRagu(soalSekarang?.id) ? '#d97706' : '#f59e0b',
                    color: '#ffffff',
                    border: 'none',
                    padding: isMobile ? '9px 10px' : '9px 20px',
                    borderRadius: '6px',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    flex: isMobile ? 1 : 'initial',
                    boxShadow: isRagu(soalSekarang?.id) ? '0 0 0 2px #fde68a' : 'none',
                    whiteSpace: 'nowrap',
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
                      background: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      padding: isMobile ? '9px 10px' : '9px 18px',
                      borderRadius: '6px',
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      flex: isMobile ? 1 : 'initial',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {isMobile ? 'Lanjut' : 'Soal Selanjutnya'} &gt;
                  </button>
                ) : (
                  <button
                    onClick={() => setShowModalKonfirmasi(true)}
                    style={{
                      background: subtesAktifIndex < subtesList.length - 1 ? '#2563eb' : '#059669',
                      color: '#ffffff',
                      border: 'none',
                      padding: isMobile ? '9px 12px' : '9px 20px',
                      borderRadius: '6px',
                      fontSize: isMobile ? '12px' : '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      flex: isMobile ? 1 : 'initial',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {subtesAktifIndex < subtesList.length - 1 ? (isMobile ? 'Subtes >' : 'Selesai Subtes >') : (isMobile ? 'Selesai' : 'Selesai Ujian >')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Memuat butir soal...
            </div>
          )}
        </main>

        {/* 3. PANEL KANAN: NOMOR SOAL GRID (DESKTOP INLINE & MOBILE OVERLAY) */}
        {!isMobile && (
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
            {renderPanelNomorContent()}
          </aside>
        )}

        {/* DRAWER NOMOR SOAL DI MOBILE */}
        {isMobile && panelNomorBuka && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1200,
              background: 'rgba(15, 23, 42, 0.6)',
              display: 'flex',
              justifyContent: 'flex-end',
            }}
            onClick={() => setPanelNomorBuka(false)}
          >
            <aside
              style={{
                width: '300px',
                maxWidth: '88vw',
                height: '100%',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 16px',
                boxSizing: 'border-box',
                overflowY: 'auto',
                boxShadow: '-4px 0 24px rgba(0,0,0,0.25)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '2px solid #cbd5e1', marginBottom: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
                  NOMOR SOAL ({subtesAktif.nama})
                </div>
                <button
                  onClick={() => setPanelNomorBuka(false)}
                  style={{
                    background: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px',
                    cursor: 'pointer',
                    color: '#64748b',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Legend Singkat */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', fontSize: '11px', color: '#64748b' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#22c55e' }} /> Selesai
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#f59e0b' }} /> Ragu
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ffffff', border: '1px solid #cbd5e1' }} /> Belum
                </span>
              </div>

              {renderPanelNomorContent(() => setPanelNomorBuka(false))}
            </aside>
          </div>
        )}

        {/* ── WEBCAM AI PROCTOR DISKRIT (Non-Intrusive, Bebas Halangi Tombol) ── */}
        <div
          style={{
            position: 'fixed',
            top: isMobile ? '56px' : '62px',
            right: isMobile ? '12px' : '226px',
            width: kameraMinimized ? 'auto' : (isMobile ? '92px' : '128px'),
            height: kameraMinimized ? 'auto' : (isMobile ? '68px' : '96px'),
            background: '#020617',
            borderRadius: kameraMinimized ? '20px' : '8px',
            border: `2px solid ${kameraStatus === 'aktif' ? '#22c55e' : '#f59e0b'}`,
            overflow: 'hidden',
            boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            zIndex: 40,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: kameraMinimized ? '4px 10px' : '0',
            cursor: kameraMinimized ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
          onClick={kameraMinimized ? () => setKameraMinimized(false) : undefined}
          title={kameraMinimized ? 'Klik untuk memperbesar kamera proctor' : undefined}
        >
          {/* Video selalu mounted agar stream getUserMedia tidak terputus */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)',
              display: (!kameraMinimized && kameraStatus === 'aktif') ? 'block' : 'none',
            }}
          />

          {kameraMinimized ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: kameraStatus === 'aktif' ? '#22c55e' : '#f59e0b' }} />
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4ade80' }}>Proctor Aktif ▾</span>
            </div>
          ) : (
            <>
              {/* Tombol Minimize */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setKameraMinimized(true);
                }}
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '3px',
                  zIndex: 2,
                  background: 'rgba(0,0,0,0.6)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  lineHeight: '1',
                  padding: '2px 5px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
                title="Sembunyikan / Perkecil kamera"
              >
                −
              </button>

              {kameraStatus === 'memuat' && (
                <div style={{ color: '#94a3b8', fontSize: '9px', textAlign: 'center', padding: '6px' }}>
                  Menghubungkan kamera...
                </div>
              )}

              {kameraStatus === 'gagal' && (
                <button
                  onClick={hubungkanKamera}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '9px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  📷 Sambungkan
                </button>
              )}

              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'rgba(0,0,0,0.7)',
                  color: kameraStatus === 'aktif' ? '#4ade80' : '#fbbf24',
                  fontSize: '8px',
                  fontWeight: 700,
                  padding: '2px 4px',
                  textAlign: 'center',
                }}
              >
                {kameraStatus === 'aktif' ? '● Proctor Aktif' : '● Kamera Nonaktif'}
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* ── MODAL KONFIRMASI KELUAR / AKHIRI UJIAN (BEBAS BLANK SCREEN) ── */}
      {showModalKeluar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '14px', maxWidth: '440px', width: '100%', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <LogOut size={28} />
            </div>

            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Konfirmasi Selesai & Keluar dari Ujian?
            </h3>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 20px', textAlign: 'left' }}>
              Apakah Anda yakin ingin mengakhiri sesi ujian sekarang?
              <br /><br />
              • Seluruh butir soal yang telah Anda jawab akan <strong>tersimpan aman di server</strong> dan dinilai sebagai hasil akhir Anda.
              <br />
              • Anda <strong>tidak dapat masuk kembali</strong> ke ruang ujian ini setelah konfirmasi.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowModalKeluar(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Batal & Lanjut Mengerjakan
              </button>

              <button
                type="button"
                onClick={handleKeluarBersih}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <LogOut size={15} /> Ya, Akhiri Ujian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL KONFIRMASI SELESAI SUBTES / KIRIM LEMBAR JAWABAN ── */}
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
                ? `Setelah mengunci subtes ini, Anda tidak dapat kembali ke butir soal ini lagi. Lanjut ke subtes berikutnya?`
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
                    mulaiLayarPerpindahanSubtes();
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

      {/* ── OVERLAY JEDA UJIAN RESMI (SHOLAT & ISTIRAHAT) -- LAYAR BLUR, HP TETAP STAY ── */}
      {eventData?.isPaused && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '560px',
            width: '100%',
            padding: '34px 28px',
            textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Mosque Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              margin: '0 auto 16px',
              boxShadow: '0 10px 20px rgba(217, 119, 6, 0.18)'
            }}>
              🕌
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#ecfdf5',
              color: '#059669',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginBottom: '12px'
            }}>
              <CheckCircle2 size={14} /> SISA WAKTU {formatTimer(sisaDetikSubtes)} DIBEKUKAN • JAWABAN AMAN
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
              UJIAN SEDANG DIJEDA
            </h2>

            <div style={{
              fontSize: '14.5px',
              fontWeight: 700,
              color: '#d97706',
              background: '#fffbeb',
              padding: '10px 18px',
              borderRadius: '12px',
              marginBottom: '16px',
              border: '1px dashed #fcd34d'
            }}>
              {eventData.pauseAlasan || 'Waktu Sholat & Istirahat'}
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, margin: '0 0 18px' }}>
              Ujian sedang dijeda oleh Pengawas / Admin. Seluruh jawaban Anda telah tersimpan otomatis,
              <strong> timer pengerjaan dibekukan</strong>, dan <strong>pengawasan anti-cheat ditangguhkan sementara</strong>.
            </p>

            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '12.5px',
              color: '#334155',
              lineHeight: 1.7,
              marginBottom: '22px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>📱</span>
                <span><strong>Layar HP Anda tetap stay di halaman ini (tidak akan keluar / hilang).</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                <span><strong>Silakan menunaikan ibadah Sholat / Istirahat sejenak.</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                <span>Sisa waktu pengerjaan ({formatTimer(sisaDetikSubtes)}) aman dan tidak berkurang sama sekali.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                <span>Anda tidak akan dikenakan sanksi saat meninggalkan layar HP / kamera.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0284c7', fontWeight: 800 }}>⏳</span>
                <span>Begitu Admin melanjutkan, layar akan otomatis aktif kembali tanpa reload.</span>
              </div>
            </div>

            {/* Waiting Pulse */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 18px',
              borderRadius: '30px',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0284c7',
              fontSize: '12.5px',
              fontWeight: 600
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: '#0284c7',
                display: 'inline-block',
                boxShadow: '0 0 0 4px rgba(2, 132, 199, 0.2)'
              }} />
              Standby • Menunggu instruksi pengawas untuk melanjutkan...
            </div>
          </div>
        </div>
      )}
      {/* ── MODAL PENGATURAN TAMPILAN & UKURAN FONT ── */}
      {showModalSettings && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1300,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowModalSettings(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', paddingBottom: '12px', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                <Settings size={20} color="#2563eb" />
                <span>Pengaturan Tampilan Ujian</span>
              </div>
              <button
                onClick={() => setShowModalSettings(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px',
                  cursor: 'pointer',
                  color: '#64748b',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Pilihan Ukuran Font */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Type size={16} color="#2563eb" />
                <span>Ukuran Huruf / Font Naskah Soal:</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { key: 'kecil', label: 'A- (Kecil)', desc: '13.5px' },
                  { key: 'sedang', label: 'A (Normal)', desc: '15.5px' },
                  { key: 'besar', label: 'A+ (Besar)', desc: '17.5px' },
                ].map((item) => {
                  const aktif = ukuranFont === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleUbahFont(item.key)}
                      style={{
                        padding: '10px 6px',
                        borderRadius: '8px',
                        border: `2px solid ${aktif ? '#2563eb' : '#cbd5e1'}`,
                        background: aktif ? '#eff6ff' : '#ffffff',
                        color: aktif ? '#1d4ed8' : '#334155',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontWeight: 700,
                        fontSize: '13px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>{item.label}</div>
                      <div style={{ fontSize: '11px', color: aktif ? '#2563eb' : '#64748b', marginTop: '3px', fontWeight: 500 }}>
                        {item.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Preview Naskah */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.3px' }}>
                Contoh Pratinjau Teks:
              </div>
              <p style={{ margin: 0, fontSize: skalaFont.soal, lineHeight: skalaFont.lineHeight, color: '#0f172a' }}>
                Ini adalah contoh keterbacaan teks soal dan pilihan jawaban dengan ukuran font yang dipilih.
              </p>
            </div>

            {/* Panduan Warna CBT */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px 14px', marginBottom: '20px', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Status Warna Nomor Soal:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', color: '#475569' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#22c55e', display: 'inline-block' }} />
                  <span><strong>Hijau:</strong> Soal sudah dijawab</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#f59e0b', display: 'inline-block' }} />
                  <span><strong>Kuning:</strong> Soal ditandai ragu-ragu</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: '#ffffff', border: '1px solid #cbd5e1', display: 'inline-block' }} />
                  <span><strong>Putih:</strong> Soal belum dijawab</span>
                </div>
              </div>
            </div>

            {/* Tombol Simpan / Tutup */}
            <button
              type="button"
              onClick={() => setShowModalSettings(false)}
              style={{
                width: '100%',
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '11px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Simpan & Lanjutkan Mengerjakan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
