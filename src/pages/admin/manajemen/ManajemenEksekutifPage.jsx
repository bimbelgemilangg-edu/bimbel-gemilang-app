// src/pages/admin/manajemen/ManajemenEksekutifPage.jsx
// ============================================================
// PUSAT KOMANDO MANAJEMEN EKSEKUTIF BIMBEL GEMILANG
// (Pengganti Portal Owner: Terbuka untuk Akun Manajemen/Admin,
// Audit Profit Riil Tanpa Angka Mengarang, Sinkronisasi Gaji Tentor 2 Bulan,
// Decision Engine Simulasi Pecah Kelas Crowded, & Laporan Besar AI-Ready)
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, doc, onSnapshot, writeBatch, serverTimestamp, getDocs,
} from 'firebase/firestore';
import {
  Crown, BarChart3, Users, DollarSign, Download, Copy, CheckCircle2,
  AlertTriangle, RefreshCw, Layers, ArrowRight, ShieldCheck, Scale,
  BookOpen, Calendar, ChevronRight, FileSpreadsheet, Sparkles, AlertCircle,
  HelpCircle, ExternalLink, Settings, Wallet
} from 'lucide-react';

import {
  rp,
  hitungKapasitasSemuaKelas,
  simulasiPecahKelas,
  deteksiGajiTentorBelumDibukukan,
  hitungFinansialRiil,
  unduhLaporanBesarExcel,
  buatPromptKonsultasiAi,
} from './manajemenUtils';

import {
  normalisasiLog, normalisasiStudent, normalisasiTeacherLog,
} from '../owner/keuanganOwnerUtils';

// Import panel keuangan komprehensif
import PanelPosisi from '../owner/PanelPosisi';
import PanelTransaksi from '../owner/PanelTransaksi';
import PanelInputHonor from '../owner/PanelInputHonor';
import PanelNeraca from '../owner/PanelNeraca';

export default function ManajemenEksekutifPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Tab Navigasi Manajemen
  const [tabAktif, setTabAktif] = useState(() => {
    const p = new URLSearchParams(window.location.search).get('tab');
    if (['ringkasan', 'kapasitas', 'laporan', 'honor', 'keuangan'].includes(p)) return p;
    return 'ringkasan';
  });

  const [loading, setLoading] = useState(true);
  const [submittingHonor, setSubmittingHonor] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Raw Database States
  const [financeLogsRaw, setFinanceLogsRaw] = useState([]);
  const [teacherLogsRaw, setTeacherLogsRaw] = useState([]);
  const [studentsRaw, setStudentsRaw] = useState([]);
  const [teachersRaw, setTeachersRaw] = useState([]);

  // Simulasi Kapasitas Kelas State
  const [kelasTerpilihKey, setKelasTerpilihKey] = useState('Kelas 7 SMP');
  const [simulasiConfig, setSimulasiConfig] = useState({
    sppPerBulan: 350000,
    honorPerSesi: 65000,
    sesiPerMinggu: 3,
  });

  // Real-time Firestore Listeners
  useEffect(() => {
    let unsubs = [];

    // 1. Finance Logs
    unsubs.push(
      onSnapshot(collection(db, 'finance_logs'), (snap) => {
        setFinanceLogsRaw(snap.docs.map(normalisasiLog));
      })
    );

    // 2. Teacher Logs
    unsubs.push(
      onSnapshot(collection(db, 'teacher_logs'), (snap) => {
        setTeacherLogsRaw(snap.docs.map(normalisasiTeacherLog));
      })
    );

    // 3. Students
    unsubs.push(
      onSnapshot(collection(db, 'students'), (snap) => {
        setStudentsRaw(snap.docs.map(normalisasiStudent));
      })
    );

    // 4. Teachers
    unsubs.push(
      onSnapshot(collection(db, 'teachers'), (snap) => {
        setTeachersRaw(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      })
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Perhitungan Finansial Riil
  const finansialRiil = useMemo(() => {
    return hitungFinansialRiil(financeLogsRaw, teacherLogsRaw);
  }, [financeLogsRaw, teacherLogsRaw]);

  // Perhitungan Kapasitas Kelas
  const kapasitasKelasList = useMemo(() => {
    return hitungKapasitasSemuaKelas(studentsRaw, 11);
  }, [studentsRaw]);

  // Kelas Target untuk Simulasi
  const kelasTargetSimulasi = useMemo(() => {
    return (
      kapasitasKelasList.find((k) => k.namaKelas === kelasTerpilihKey) ||
      kapasitasKelasList.find((k) => k.namaKelas.includes('7')) ||
      kapasitasKelasList[0] ||
      null
    );
  }, [kapasitasKelasList, kelasTerpilihKey]);

  // Hasil Simulasi Pecah Kelas
  const hasilSimulasi = useMemo(() => {
    if (!kelasTargetSimulasi) return null;
    return simulasiPecahKelas(kelasTargetSimulasi, simulasiConfig);
  }, [kelasTargetSimulasi, simulasiConfig]);

  // Update SPP default saat kelas dipilih
  useEffect(() => {
    if (kelasTargetSimulasi?.rataSpp) {
      setSimulasiConfig((prev) => ({
        ...prev,
        sppPerBulan: kelasTargetSimulasi.rataSpp || 350000,
      }));
    }
  }, [kelasTargetSimulasi]);

  // 1-Klik: Sinkronkan dan Bukukan Gaji Tentor 2 Bulan ke Pengeluaran
  const handleBukukanHonorMassal = async () => {
    const audit = finansialRiil.auditHonor;
    if (!audit.adaKebocoranPengeluaran) {
      alert('Semua honor tentor sudah tercatat lunas di sistem!');
      return;
    }

    const konfirmasi = window.confirm(
      `⚠️ KONFIRMASI PEMBUKUAN GAJI TENTOR ⚠️\n\n` +
      `Sistem mendeteksi ${audit.totalSesiBelumDibayar} sesi mengajar tentor dengan total ${rp(audit.totalHutangHonor)} ` +
      `yang belum pernah dimasukkan ke pengeluaran finance_logs.\n\n` +
      `Tindakan ini akan:\n` +
      `1. Membuat entri pengeluaran kas resmi "Gaji Guru/Staf" di finance_logs.\n` +
      `2. Mengubah status ${audit.totalSesiBelumDibayar} sesi tentor menjadi "Lunas".\n` +
      `3. Memperbaiki angka Net Profit menjadi akurat dan tidak mengarang lagi.\n\n` +
      `Lanjutkan pembukuan sekarang?`
    );

    if (!konfirmasi) return;

    setSubmittingHonor(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const batch = writeBatch(db);

      // Buat pengeluaran per guru yang belum dibayar
      audit.daftarPerGuru.forEach((g) => {
        if (g.totalNominal <= 0) return;
        const logRef = doc(collection(db, 'finance_logs'));
        batch.set(logRef, {
          type: 'Pengeluaran',
          date: today,
          category: 'Gaji Guru/Staf',
          amount: g.totalNominal,
          method: 'Transfer',
          note: `Pembukuan Honor Tentor: ${g.namaGuru} (${g.totalSesi} sesi - ${g.daftarBulan.join(', ')})`,
          kanalKe: 'kasOwner',
          statusRekonsiliasi: 'lunas_manajemen',
          createdAt: serverTimestamp(),
        });
      });

      // Tandai seluruh sesi teacher_logs menjadi Lunas
      audit.daftarBelumDibayar.forEach((t) => {
        if (!t.id) return;
        batch.update(doc(db, 'teacher_logs', t.id), {
          statusDibayar: 'Lunas',
          tanggalDibayar: today,
        });
      });

      await batch.commit();
      alert(`✅ BERHASIL! Seluruh honor tentor sebesar ${rp(audit.totalHutangHonor)} telah resmi dibukukan ke pengeluaran finance_logs.`);
    } catch (err) {
      console.error('Gagal bukukan honor:', err);
      alert('Gagal membukukan honor: ' + err.message);
    } finally {
      setSubmittingHonor(false);
    }
  };

  // Unduh Laporan Besar Excel
  const handleUnduhExcel = () => {
    unduhLaporanBesarExcel({
      finansialRiil,
      kapasitasKelas: kapasitasKelasList,
      guruList: teachersRaw,
      teacherLogs: teacherLogsRaw,
      students: studentsRaw,
    });
  };

  // Salin Prompt AI
  const handleSalinPromptAi = () => {
    const teks = buatPromptKonsultasiAi({
      finansialRiil,
      kapasitasKelas: kapasitasKelasList,
      kelasTargetCrowded: kelasTerpilihKey,
    });
    navigator.clipboard.writeText(teks);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <SidebarAdmin />

      <main style={{ flex: 1, padding: '24px', maxWidth: '1360px', margin: '0 auto', width: '100%' }}>
        {/* Top Header Manajemen */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1d4ed8', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <Crown size={14} /> PORTAL MANAJEMEN EKSEKUTIF
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Pusat Komando Manajemen Bimbel
            </h1>
            <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
              Audit Finansial Riil, Decision Engine Simulasi Pecah Kelas Crowded, & Laporan Besar Strategis
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleUnduhExcel}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#059669', color: '#ffffff', border: 'none',
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 4px rgba(5,150,105,0.2)',
              }}
            >
              <FileSpreadsheet size={16} />
              <span>Download Laporan Besar (.xlsx)</span>
            </button>

            <button
              type="button"
              onClick={handleSalinPromptAi}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: copySuccess ? '#16a34a' : '#4f46e5', color: '#ffffff', border: 'none',
                padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                cursor: 'pointer', boxShadow: '0 2px 4px rgba(79,70,229,0.2)',
              }}
            >
              {copySuccess ? <CheckCircle2 size={16} /> : <Sparkles size={16} />}
              <span>{copySuccess ? 'Briefing AI Tersalin!' : 'Salin Briefing untuk AI (ChatGPT/Gemini)'}</span>
            </button>
          </div>
        </div>

        {/* Banner Darurat: Kebocoran Pengeluaran Gaji Tentor 2 Bulan */}
        {finansialRiil.honorBelumDibukukan > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)',
            border: '2px solid #f87171',
            borderRadius: 16,
            padding: '20px',
            marginBottom: 24,
            boxShadow: '0 4px 12px rgba(239,68,68,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ background: '#ef4444', color: '#ffffff', padding: 10, borderRadius: 12, display: 'flex' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#991b1b', margin: '0 0 6px' }}>
                    ⚠️ KEWIBANGAN GAJI TENTOR BELUM DIBUKUKAN: {rp(finansialRiil.honorBelumDibukukan)} ({finansialRiil.sesiHonorBelumDibukukan} Sesi)
                  </h3>
                  <p style={{ color: '#7f1d1d', fontSize: 13.5, lineHeight: 1.5, margin: '0 0 10px', maxWidth: 820 }}>
                    Selama 2 bulan ini, honor mengajar tentor belum dimasukkan ke pengeluaran <code>finance_logs</code>. Akibatnya,
                    angka laba di dashboard kasir selama ini tampak tinggi secara semu (mengarang).
                    Klik tombol di sebelah kanan untuk membukukan seluruh honor ini secara resmi ke pengeluaran kas dalam 1 klik!
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: '#991b1b', fontWeight: 600 }}>
                    {finansialRiil.auditHonor.daftarPerGuru.slice(0, 4).map((g) => (
                      <span key={g.namaGuru} style={{ background: 'rgba(255,255,255,0.6)', padding: '3px 8px', borderRadius: 6 }}>
                        • {g.namaGuru}: {rp(g.totalNominal)} ({g.totalSesi} sesi)
                      </span>
                    ))}
                    {finansialRiil.auditHonor.daftarPerGuru.length > 4 && (
                      <span>+{finansialRiil.auditHonor.daftarPerGuru.length - 4} tentor lainnya</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={submittingHonor}
                onClick={handleBukukanHonorMassal}
                style={{
                  background: '#dc2626', color: '#ffffff', border: 'none',
                  padding: '12px 20px', borderRadius: 10, fontSize: 13.5, fontWeight: 800,
                  cursor: submittingHonor ? 'wait' : 'pointer', display: 'inline-flex',
                  alignItems: 'center', gap: 8, boxShadow: '0 4px 10px rgba(220,38,38,0.3)',
                }}
              >
                <RefreshCw size={16} className={submittingHonor ? 'animate-spin' : ''} />
                <span>{submittingHonor ? 'Memproses...' : '⚡ 1-Klik: Bukukan ke Pengeluaran'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigasi Tab Manajemen */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 24, overflowX: 'auto' }}>
          {[
            { id: 'ringkasan', label: '📊 Ringkasan Finansial Riil', icon: BarChart3 },
            { id: 'kapasitas', label: '⚖️ Simulasi Pecah Kelas Crowded', icon: Scale },
            { id: 'laporan', label: '📋 Laporan Besar & Rekap Guru', icon: Users },
            { id: 'honor', label: '👩‍🏫 Bayar & Kelola Honor Tentor', icon: Wallet },
            { id: 'keuangan', label: '🏦 Buku Kas & Neraca Lengkap', icon: DollarSign },
          ].map((t) => {
            const Icon = t.icon;
            const aktif = tabAktif === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTabAktif(t.id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: aktif ? '#0f172a' : '#ffffff',
                  color: aktif ? '#ffffff' : '#475569',
                  border: `1px solid ${aktif ? '#0f172a' : '#cbd5e1'}`,
                  padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* ============================================================ */}
        {/* TAB 1: RINGKASAN FINANSIAL RIIL (TANPA ANGKA MENGARANG)       */}
        {/* ============================================================ */}
        {tabAktif === 'ringkasan' && (
          <div>
            {/* 4 Kartu Metrik Utama */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: '#ffffff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                  Total Pemasukan Kas Riil
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
                  {rp(finansialRiil.kasMasuk)}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>Dari pendaftaran siswa, SPP, dan modul</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 14, padding: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                  Pengeluaran Terbuku Kasir
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
                  {rp(finansialRiil.kasKeluarTerbuku)}
                </div>
                <div style={{ fontSize: 11.5, color: '#64748b' }}>Termasuk honor guru yang sudah tercatat kasir</div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 14, padding: 20, border: `1px solid ${finansialRiil.honorBelumDibukukan > 0 ? '#fca5a5' : '#e2e8f0'}`, background: finansialRiil.honorBelumDibukukan > 0 ? '#fff1f2' : '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: finansialRiil.honorBelumDibukukan > 0 ? '#e11d48' : '#64748b', textTransform: 'uppercase' }}>
                  Honor Guru Belum Dibukukan
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: finansialRiil.honorBelumDibukukan > 0 ? '#be123c' : '#0f172a', margin: '6px 0 2px' }}>
                  {rp(finansialRiil.honorBelumDibukukan)}
                </div>
                <div style={{ fontSize: 11.5, color: finansialRiil.honorBelumDibukukan > 0 ? '#9f1239' : '#64748b' }}>
                  {finansialRiil.sesiHonorBelumDibukukan} sesi valid menunggu pembukuan
                </div>
              </div>

              <div style={{ background: '#ffffff', borderRadius: 14, padding: 20, border: '2px solid #3b82f6', boxShadow: '0 4px 10px rgba(59,130,246,0.1)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>
                  Net Profit Bersih Sebenarnya
                </div>
                <div style={{ fontSize: 26, fontWeight: 900, color: finansialRiil.netProfitRiil >= 0 ? '#15803d' : '#b91c1c', margin: '6px 0 2px' }}>
                  {rp(finansialRiil.netProfitRiil)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1e40af' }}>
                  Margin Bersih Riil: {finansialRiil.netProfitMargin}%
                </div>
              </div>
            </div>

            {/* Kotak Transparansi Audit Finansial */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                🔍 Rumus Realistis: Mengapa Profit Sebelumnya Terasa "Mengarang"?
              </h3>
              <p style={{ color: '#475569', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 16px' }}>
                Pada sistem akuntansi sebelumnya, profit dihitung dari selisih kas masuk dikurangi pengeluaran di kasir.
                Karena gaji guru selama 2 bulan belum dibukukan ke kasir, biaya operasional terbesar bimbel tidak ikut mengurangi laba kas,
                sehingga angka laba terlihat sangat besar namun uang fisiknya tidak ada.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>1. Pemasukan Riil Bimbel</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>Total uang masuk: <strong>{rp(finansialRiil.kasMasuk)}</strong></div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Berasal dari pembayaran sah siswa yang sudah disetor ke kasir/bank bimbel.</div>
                </div>

                <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>2. Total Beban Operasional Riil</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>
                    {rp(finansialRiil.kasKeluarTerbuku)} (operasional) + {rp(finansialRiil.honorBelumDibukukan)} (honor guru terhutang) = <strong>{rp(finansialRiil.pengeluaranRiilKomprehensif)}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Mencerminkan seluruh kewajiban biaya mengajar guru secara jujur.</div>
                </div>

                <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 12, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#166534', marginBottom: 6 }}>3. Dana Bersih Riil (Aman Diambil)</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#15803d' }}>
                    {rp(finansialRiil.netProfitRiil)}
                  </div>
                  <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}>
                    Sisa dana setelah seluruh hak honor mengajar tentor diselesaikan secara utuh.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: DECISION ENGINE SIMULASI KAPASITAS & PECAH KELAS       */}
        {/* ============================================================ */}
        {tabAktif === 'kapasitas' && (
          <div>
            {/* Overview Status Seluruh Kelas */}
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Monitor Kapasitas Kelas (Standar Ideal: 11 Siswa / Ruang)
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                    Sistem otomatis mendeteksi kelas yang sudah terlalu padat (crowded) agar kenyamanan belajar tetap terjaga.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fee2e2', color: '#991b1b', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    🔴 Crowded (&gt;11)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    🟡 Mendekati (10-11)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                    🟢 Optimal (&lt;10)
                  </span>
                </div>
              </div>

              {/* Grid Kartu Kelas */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
                {kapasitasKelasList.map((k) => {
                  const terpilih = k.namaKelas === kelasTerpilihKey;
                  const bgBadge = k.status === 'crowded' ? '#fee2e2' : k.status === 'mendekati' ? '#fef3c7' : '#dcfce7';
                  const colorBadge = k.status === 'crowded' ? '#b91c1c' : k.status === 'mendekati' ? '#92400e' : '#15803d';

                  return (
                    <div
                      key={k.namaKelas}
                      onClick={() => setKelasTerpilihKey(k.namaKelas)}
                      style={{
                        background: terpilih ? '#eff6ff' : '#ffffff',
                        border: `2px solid ${terpilih ? '#2563eb' : '#e2e8f0'}`,
                        borderRadius: 14,
                        padding: 16,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{k.namaKelas}</span>
                        <span style={{ background: bgBadge, color: colorBadge, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                          {k.totalSiswa} Siswa
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        Ideal: 11 anak {k.kelebihan > 0 && <strong style={{ color: '#dc2626' }}>(+{k.kelebihan} anak)</strong>}
                      </div>
                      <div style={{ fontSize: 11.5, color: '#0284c7', fontWeight: 600, marginTop: 6 }}>
                        Klik untuk simulasi pecah ▾
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Panel Simulasi Interaktif Pecah Kelas */}
            {hasilSimulasi && (
              <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '2px solid #2563eb', boxShadow: '0 8px 24px rgba(37,99,235,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, borderBottom: '1px solid #e2e8f0', paddingBottom: 16, marginBottom: 20 }}>
                  <div>
                    <span style={{ background: '#dbeafe', color: '#1e40af', padding: '3px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 800 }}>
                      DECISION SUPPORT ENGINE
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: '#0f172a', margin: '6px 0 2px' }}>
                      Simulasi Keputusan: {hasilSimulasi.namaKelas} ({hasilSimulasi.totalSiswa} Siswa)
                    </h3>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                      Pertimbangan biaya guru mengajar vs penurunan profit jika dipecah menjadi Kelas A & Kelas B
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const teks =
                        `📊 *ANALISIS PECAH KELAS - ${hasilSimulasi.namaKelas}*\n\n` +
                        `• Siswa saat ini: ${hasilSimulasi.totalSiswa} anak\n` +
                        `• Jika tetap 1 Kelas: Profit ${rp(hasilSimulasi.profit1Kelas)}/bln (Margin ${hasilSimulasi.margin1Kelas}%)\n` +
                        `• Jika Dipecah A/B: Biaya guru naik +${rp(hasilSimulasi.tambahanBiayaGuru)}/bln, Profit menjadi ${rp(hasilSimulasi.profit2Kelas)}/bln (Margin ${hasilSimulasi.margin2Kelas}%)\n` +
                        `• Titik Impas (BEP): Butuh minimal ${hasilSimulasi.bepSiswaBaru} murid tambahan (Total ${hasilSimulasi.targetTotalSiswaAman} murid)\n\n` +
                        `💡 *Rekomendasi Manajemen:*\n${hasilSimulasi.rekomendasi}`;
                      navigator.clipboard.writeText(teks);
                      alert('Analisis pecah kelas telah disalin ke clipboard! Siap dikirim ke WhatsApp / AI.');
                    }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '8px 14px',
                      borderRadius: 8, fontSize: 12.5, fontWeight: 700, color: '#334155', cursor: 'pointer',
                    }}
                  >
                    <Copy size={15} /> Salin Teks Analisis
                  </button>
                </div>

                {/* Input Parameter Simulasi */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Rata-Rata SPP per Siswa:
                    </label>
                    <input
                      type="number"
                      step={25000}
                      value={simulasiConfig.sppPerBulan}
                      onChange={(e) => setSimulasiConfig({ ...simulasiConfig, sppPerBulan: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Tarif Honor Guru per Sesi:
                    </label>
                    <input
                      type="number"
                      step={5000}
                      value={simulasiConfig.honorPerSesi}
                      onChange={(e) => setSimulasiConfig({ ...simulasiConfig, honorPerSesi: Number(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                      Frekuensi Pertemuan per Minggu:
                    </label>
                    <select
                      value={simulasiConfig.sesiPerMinggu}
                      onChange={(e) => setSimulasiConfig({ ...simulasiConfig, sesiPerMinggu: Number(e.target.value) || 3 })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 700 }}
                    >
                      <option value={2}>2 Sesi / Minggu (8 sesi/bln)</option>
                      <option value={3}>3 Sesi / Minggu (12 sesi/bln)</option>
                      <option value={4}>4 Sesi / Minggu (16 sesi/bln)</option>
                      <option value={5}>5 Sesi / Minggu (20 sesi/bln)</option>
                    </select>
                  </div>
                </div>

                {/* Perbandingan Head-to-Head */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 24 }}>
                  {/* Opsi 1: Tetap 1 Kelas */}
                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                      OPSI A: TETAP 1 KELAS (SAAT INI)
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', margin: '6px 0 12px' }}>
                      1 Kelas ({hasilSimulasi.totalSiswa} Siswa)
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Pendapatan SPP:</span>
                        <strong>{rp(hasilSimulasi.pendapatanBulanan)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Biaya Honor Guru:</span>
                        <strong style={{ color: '#dc2626' }}>-{rp(hasilSimulasi.biayaGuru1Kelas)}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ fontWeight: 700 }}>Profit Kelas:</span>
                        <strong style={{ color: '#16a34a', fontSize: 16 }}>{rp(hasilSimulasi.profit1Kelas)}</strong>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#16a34a', fontWeight: 700 }}>
                        Margin Profit: {hasilSimulasi.margin1Kelas}%
                      </div>
                    </div>
                  </div>

                  {/* Opsi 2: Dipecah 2 Kelas */}
                  <div style={{ background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>
                      OPSI B: PECAH 2 KELAS (A & B)
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#1e3a8a', margin: '6px 0 12px' }}>
                      Kelas A ({hasilSimulasi.siswaKelasA}) & Kelas B ({hasilSimulasi.siswaKelasB})
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Pendapatan SPP:</span>
                        <strong>{rp(hasilSimulasi.pendapatanBulanan)}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Biaya Honor Guru (2x lipat):</span>
                        <strong style={{ color: '#dc2626' }}>-{rp(hasilSimulasi.biayaGuru2Kelas)}</strong>
                      </div>
                      <div style={{ borderTop: '1px solid #bfdbfe', paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                        <span style={{ fontWeight: 700 }}>Profit Kelas:</span>
                        <strong style={{ color: hasilSimulasi.profit2Kelas > 0 ? '#1d4ed8' : '#dc2626', fontSize: 16 }}>
                          {rp(hasilSimulasi.profit2Kelas)}
                        </strong>
                      </div>
                      <div style={{ fontSize: 11.5, color: '#1d4ed8', fontWeight: 700 }}>
                        Margin Profit: {hasilSimulasi.margin2Kelas}% (Turun {hasilSimulasi.margin1Kelas - hasilSimulasi.margin2Kelas}%)
                      </div>
                    </div>
                  </div>

                  {/* Dampak & Titik Impas (BEP) */}
                  <div style={{ background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 14, padding: 18 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#b45309', textTransform: 'uppercase' }}>
                      TITIK IMPAS (BREAK-EVEN POINT)
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#78350f', margin: '6px 0 12px' }}>
                      Butuh Minimal: +{hasilSimulasi.bepSiswaBaru} Siswa Baru
                    </div>

                    <div style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5 }}>
                      Penambahan 1 kelas membebani kas bimbel sebesar <strong>{rp(hasilSimulasi.tambahanBiayaGuru)}/bulan</strong>.
                      <div style={{ marginTop: 8, padding: 8, background: 'rgba(255,255,255,0.7)', borderRadius: 8 }}>
                        🎯 <strong>Target Murid Aman:</strong> {hasilSimulasi.targetTotalSiswaAman} Siswa
                        (yaitu {Math.ceil(hasilSimulasi.targetTotalSiswaAman / 2)} anak di Kelas A & {Math.floor(hasilSimulasi.targetTotalSiswaAman / 2)} anak di Kelas B)
                        agar profit bimbel kembali utuh.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Box Rekomendasi AI & Panduan Eksekutif */}
                <div style={{ background: '#f8fafc', borderLeft: '4px solid #4f46e5', padding: '16px 20px', borderRadius: '0 12px 12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 800, color: '#312e81', marginBottom: 4 }}>
                    <Sparkles size={18} color="#4f46e5" />
                    <span>Rekomendasi Manajemen & Strategi Kelas:</span>
                  </div>
                  <p style={{ color: '#1e1b4b', fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>
                    {hasilSimulasi.rekomendasi}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: LAPORAN BESAR EKSEKUTIF & REKAP GURU                   */}
        {/* ============================================================ */}
        {tabAktif === 'laporan' && (
          <div>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '24px', border: '1px solid #e2e8f0', marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Rekapitulasi Kinerja & Honor Mengajar Seluruh Guru
                  </h3>
                  <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
                    Menampilkan total sesi mengajar per minggu, akumulasi bulanan, dan status pencairan honor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleUnduhExcel}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#059669', color: '#fff', border: 'none', padding: '8px 16px',
                    borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  <Download size={15} /> Unduh Format Excel (.xlsx)
                </button>
              </div>

              {/* Tabel Guru */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 14px' }}>Nama Guru</th>
                      <th style={{ padding: '12px 14px' }}>Status</th>
                      <th style={{ padding: '12px 14px' }}>Total Sesi Mengajar</th>
                      <th style={{ padding: '12px 14px' }}>Rata-Rata Sesi/Minggu</th>
                      <th style={{ padding: '12px 14px' }}>Total Honor Mengajar</th>
                      <th style={{ padding: '12px 14px' }}>Status Honor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachersRaw.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                          Belum ada data guru terdaftar.
                        </td>
                      </tr>
                    ) : (
                      teachersRaw.map((guru) => {
                        const logsGuru = teacherLogsRaw.filter(
                          (l) => l.teacherId === guru.id || (l.namaGuru || '').toLowerCase() === (guru.nama || '').toLowerCase()
                        );
                        const totalSesi = logsGuru.length;
                        const totalNominal = logsGuru.reduce((acc, curr) => acc + (parseInt(curr.nominal || 0, 10) || 0), 0);
                        const pendingNominal = logsGuru
                          .filter((l) => String(l.statusDibayar || '').toLowerCase() !== 'lunas')
                          .reduce((acc, curr) => acc + (parseInt(curr.nominal || 0, 10) || 0), 0);

                        return (
                          <tr key={guru.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a' }}>
                              {guru.nama || 'Guru'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                {guru.status || 'Aktif'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 600 }}>{totalSesi} Sesi</td>
                            <td style={{ padding: '12px 14px', color: '#64748b' }}>
                              {(totalSesi / 4).toFixed(1)} sesi/mgg
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>
                              {rp(totalNominal)}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              {pendingNominal > 0 ? (
                                <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 800 }}>
                                  ⚠️ Belum Dibukukan: {rp(pendingNominal)}
                                </span>
                              ) : (
                                <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                                  ✓ Lunas Terbuku
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: BAYAR & KELOLA HONOR TENTOR                           */}
        {/* ============================================================ */}
        {tabAktif === 'honor' && (
          <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0' }}>
            <PanelInputHonor teacherLogs={teacherLogsRaw} rp={rp} isMobile={false} />
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: BUKU KAS & NERACA LENGKAP                              */}
        {/* ============================================================ */}
        {tabAktif === 'keuangan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                Posisi Kas & Bank Real-Time
              </h3>
              <PanelPosisi logs={financeLogsRaw} tagihanList={[]} teacherLogs={teacherLogsRaw} students={studentsRaw} rp={rp} isMobile={false} />
            </div>

            <div style={{ background: '#ffffff', borderRadius: 16, padding: '20px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px' }}>
                Buku Seluruh Transaksi Kasir & Manajemen
              </h3>
              <PanelTransaksi logs={financeLogsRaw} rp={rp} isMobile={false} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
