// src/pages/admin/tobk/KelolaTobkPublikPage.jsx
// ============================================================
// MANAJEMEN TOBK GEMILANG & EVENT PUBLIK (Admin Control Center)
// STANDAR RESMI UTBK-SNBT 2026 (195m, 7 Subtes) & TKA 2026 (75m, Jeda 1m)
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Users, Key, Clock, ShieldCheck, Download, Trash2,
  PlusCircle, RefreshCw, ExternalLink, CheckCircle, AlertTriangle,
  Search, Filter, PlayCircle, StopCircle, ArrowRight, Share2, Sparkles,
  Layers, Check, HelpCircle, Printer, FileSpreadsheet, FileText, X
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  ambilSemuaEventTobk, simpanEventTobk, toggleTokenEventTobk,
  ambilSemuaLeadsTobk, eksporLeadsCsv, eksporRekapNilaiExcel, bersihkanDataEventTobk,
  SUBTES_RESMI_UTBK_2026, SESI_RESMI_TKA_2026, SOAL_PRESET_UTBK
} from '../../../services/tobkPublikService';

export default function KelolaTobkPublikPage() {
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [leads, setLeads] = useState([]);
  const [paketBimbelList, setPaketBimbelList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cari, setCari] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

  // Modal Buat Event Baru
  const [showModalBuat, setShowModalBuat] = useState(false);
  const [formatPilihan, setFormatPilihan] = useState('UTBK_2026'); // 'UTBK_2026' | 'TKA_2026_MTK' | 'TKA_2026_INDO' | 'KUSTOM'

  const [formEvent, setFormEvent] = useState({
    judul: 'TOBK FUNDAMENTAL SNBT 2026',
    kategori: 'Try Out Akbar UTBK',
    formatUjian: 'UTBK_2026',
    modeTimer: 'per-subtes',
    durasiMenit: 195,
    jedaTransisiDetik: 15,
    token: 'GEMILANG2026',
    tokenAktif: true,
    maksimalPelanggaran: 3,
    wajibKamera: true,
    sumberSoal: 'preset_utbk_2026',
    paketBimbelId: '',
    keterangan: 'Simulasi Resmi UTBK-SNBT 2026 (7 Subtes Block Time, 195 Menit)',
  });

  // Modal Konfirmasi Bersihkan Data
  const [showModalPurge, setShowModalPurge] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

  // Modal Cetak / Preview PDF Rekap Nilai
  const [showModalCetakPdf, setShowModalCetakPdf] = useState(false);

  // Muat data awal
  const muatData = async () => {
    setLoading(true);
    try {
      const [listEvents, snapPaket] = await Promise.all([
        ambilSemuaEventTobk(),
        getDocs(collection(db, 'tryout_paket')).catch(() => ({ docs: [] })),
      ]);

      setEvents(listEvents);
      if (listEvents.length > 0 && !selectedEventId) {
        setSelectedEventId(listEvents[0].id);
      }

      const pList = snapPaket.docs?.map((d) => ({ id: d.id, ...d.data() })) || [];
      setPaketBimbelList(pList);

      const activeId = selectedEventId || listEvents[0]?.id;
      if (activeId) {
        const leadData = await ambilSemuaLeadsTobk(activeId);
        setLeads(leadData);
      }
    } catch (err) {
      console.error('Gagal muat data TOBK Admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    muatData();
  }, []);

  const handlePilihEvent = async (eId) => {
    setSelectedEventId(eId);
    setRefreshing(true);
    try {
      const leadData = await ambilSemuaLeadsTobk(eId);
      setLeads(leadData);
    } finally {
      setRefreshing(false);
    }
  };

  const currentEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  const handleToggleToken = async () => {
    if (!currentEvent) return;
    const statusBaru = !currentEvent.tokenAktif;
    await toggleTokenEventTobk(currentEvent.id, statusBaru);
    setEvents((prev) =>
      prev.map((e) => (e.id === currentEvent.id ? { ...e, tokenAktif: statusBaru } : e))
    );
  };

  const generateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'TOBK-';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormEvent((prev) => ({ ...prev, token: res }));
  };

  // Ubah Format Ujian (UTBK 2026 / TKA 2026 / Kustom)
  const handlePilihFormat = (fmt) => {
    setFormatPilihan(fmt);

    if (fmt === 'UTBK_2026') {
      setFormEvent((prev) => ({
        ...prev,
        judul: prev.judul || 'TOBK FUNDAMENTAL UTBK-SNBT 2026',
        kategori: 'Try Out Akbar UTBK',
        formatUjian: 'UTBK_2026',
        modeTimer: 'per-subtes',
        durasiMenit: 195,
        jedaTransisiDetik: 15,
        sumberSoal: 'preset_utbk_2026',
        keterangan: 'Simulasi Resmi UTBK-SNBT 2026 (7 Subtes Block Time, 195 Menit)',
      }));
    } else if (fmt === 'TKA_2026_MTK') {
      setFormEvent((prev) => ({
        ...prev,
        judul: 'TKA 2026: MATEMATIKA WAJIB & NUMERASI',
        kategori: 'TKA SMP / SMA',
        formatUjian: 'TKA_2026_MTK',
        modeTimer: 'per-subtes',
        durasiMenit: 75,
        jedaTransisiDetik: 60,
        sumberSoal: 'preset_tka_mtk',
        keterangan: 'TKA 2026 Matematika Wajib (25 Soal, 75 Menit, Rata-rata 3 mnt/soal)',
      }));
    } else if (fmt === 'TKA_2026_INDO') {
      setFormEvent((prev) => ({
        ...prev,
        judul: 'TKA 2026: B. INDONESIA & LITERASI',
        kategori: 'TKA SMP / SMA',
        formatUjian: 'TKA_2026_INDO',
        modeTimer: 'per-subtes',
        durasiMenit: 75,
        jedaTransisiDetik: 60,
        sumberSoal: 'preset_tka_indo',
        keterangan: 'TKA 2026 B. Indonesia & Literasi (30 Soal, 75 Menit)',
      }));
    } else {
      setFormEvent((prev) => ({
        ...prev,
        formatUjian: 'KUSTOM',
        modeTimer: 'total',
        durasiMenit: 90,
        jedaTransisiDetik: 10,
        sumberSoal: 'preset_utbk_2026',
      }));
    }
  };

  // Simpan Event Baru
  const handleSimpanEventBaru = async (e) => {
    e.preventDefault();
    if (!formEvent.judul.trim()) {
      alert('Judul Event wajib diisi!');
      return;
    }

    let subtesList = [];
    let daftarSoalFlat = [];

    if (formEvent.sumberSoal === 'preset_utbk_2026') {
      subtesList = SUBTES_RESMI_UTBK_2026;
      daftarSoalFlat = SUBTES_RESMI_UTBK_2026.flatMap((s) => s.soal);
    } else if (formEvent.sumberSoal === 'preset_tka_mtk') {
      const dataMtk = SESI_RESMI_TKA_2026.matematika;
      subtesList = [{ id: dataMtk.id, nama: dataMtk.nama, durasiMenit: dataMtk.durasiMenit, soal: dataMtk.soal }];
      daftarSoalFlat = dataMtk.soal;
    } else if (formEvent.sumberSoal === 'preset_tka_indo') {
      const dataIndo = SESI_RESMI_TKA_2026.literasi_indo;
      subtesList = [{ id: dataIndo.id, nama: dataIndo.nama, durasiMenit: dataIndo.durasiMenit, soal: dataIndo.soal }];
      daftarSoalFlat = dataIndo.soal;
    } else if (formEvent.sumberSoal === 'paket_bimbel' && formEvent.paketBimbelId) {
      const p = paketBimbelList.find((item) => item.id === formEvent.paketBimbelId);
      if (p) {
        daftarSoalFlat = p.daftarSoal || [];
        subtesList = p.subtes || [{ id: 'subtes_1', nama: p.judul, durasiMenit: p.durasiTotalMenit || formEvent.durasiMenit, soal: daftarSoalFlat }];
      }
    } else {
      subtesList = SUBTES_RESMI_UTBK_2026;
      daftarSoalFlat = SOAL_PRESET_UTBK;
    }

    const payload = {
      ...formEvent,
      subtes: subtesList,
      daftarSoal: daftarSoalFlat,
      totalSoal: daftarSoalFlat.length,
      createdAt: new Date().toISOString(),
    };

    const saved = await simpanEventTobk(payload);
    setEvents((prev) => [saved, ...prev]);
    setSelectedEventId(saved.id);
    setShowModalBuat(false);
    alert(`Event TOBK "${saved.judul}" berhasil dibuat! Token: ${saved.token}`);
    handlePilihEvent(saved.id);
  };

  const handleEksporExcel = () => {
    if (!currentEvent) return;
    eksporRekapNilaiExcel(leads, currentEvent);
  };

  const daftarSubtesHeader = useMemo(() => {
    if (currentEvent?.subtes && Array.isArray(currentEvent.subtes) && currentEvent.subtes.length > 0) {
      return currentEvent.subtes.map((s) => ({
        id: s.id || s.kode,
        kode: s.kode || s.id,
        nama: s.nama || s.judul || 'Subtes',
      }));
    }
    if ((currentEvent?.formatUjian || '').startsWith('TKA')) {
      return [
        { id: 'subtes_tka_1', kode: 'TKA 1', nama: 'Mata Pelajaran Utama' },
        { id: 'subtes_tka_2', kode: 'TKA 2', nama: 'Literasi / Skolastik' },
      ];
    }
    return [
      { id: 'subtes_pu', kode: 'PU', nama: 'Penalaran Umum (PU)' },
      { id: 'subtes_ppu', kode: 'PPU', nama: 'Pengetahuan & Pemahaman Umum (PPU)' },
      { id: 'subtes_pbm', kode: 'PBM', nama: 'Pemahaman Bacaan & Menulis (PBM)' },
      { id: 'subtes_pk', kode: 'PK', nama: 'Pengetahuan Kuantitatif (PK)' },
      { id: 'subtes_lbi', kode: 'LBI', nama: 'Literasi Bahasa Indonesia (LBI)' },
      { id: 'subtes_lbe', kode: 'LBE', nama: 'Literasi Bahasa Inggris (LBE)' },
      { id: 'subtes_pm', kode: 'PM', nama: 'Penalaran Matematika (PM)' },
    ];
  }, [currentEvent]);

  const handleKonfirmasiPurge = async (hapusEventSekaligus = false) => {
    if (!currentEvent) return;
    setPurgeLoading(true);
    try {
      const res = await bersihkanDataEventTobk(currentEvent.id, hapusEventSekaligus);
      alert(res.message);
      setShowModalPurge(false);
      muatData();
    } catch (err) {
      alert('Gagal membersihkan data: ' + err.message);
    } finally {
      setPurgeLoading(false);
    }
  };

  const leadsTersaring = useMemo(() => {
    return leads.filter((l) => {
      const q = cari.toLowerCase();
      const matchQuery =
        (l.nama || '').toLowerCase().includes(q) ||
        (l.whatsapp || '').includes(q) ||
        (l.asalSekolah || '').toLowerCase().includes(q) ||
        (l.kota || '').toLowerCase().includes(q) ||
        (l.targetPtn || '').toLowerCase().includes(q);

      if (!matchQuery) return false;
      if (filterStatus === 'semua') return true;
      return l.statusUjian === filterStatus;
    });
  }, [leads, cari, filterStatus]);

  const stats = useMemo(() => {
    const total = leads.length;
    const menunggu = leads.filter((l) => l.statusUjian === 'menunggu_token').length;
    const mengerjakan = leads.filter((l) => l.statusUjian === 'mengerjakan').length;
    const selesai = leads.filter((l) => l.statusUjian === 'selesai').length;
    const diskualifikasi = leads.filter((l) => l.statusUjian === 'diskualifikasi').length;
    return { total, menunggu, mengerjakan, selesai, diskualifikasi };
  }, [leads]);

  return (
    <div style={{ padding: '24px', maxWidth: '1300px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header Utama */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ background: '#3b82f6', color: '#fff', padding: '6px', borderRadius: '10px', display: 'flex' }}>
              <Trophy size={24} />
            </span>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Portal TOBK Akbar & Event Publik
            </h1>
          </div>
          <p style={{ margin: '4px 0 0 40px', color: '#64748b', fontSize: '14px' }}>
            Standar Resmi <strong>UTBK-SNBT 2026 (7 Subtes Block Time)</strong> & <strong>TKA 2026 (75 Menit, Jeda 1m)</strong> · Zero Storage Bloat
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/tobk"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#f8fafc', color: '#334155', border: '1px solid #cbd5e1',
              padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              textDecoration: 'none', cursor: 'pointer'
            }}
          >
            <ExternalLink size={16} /> Buka Laman Peserta (/tobk)
          </a>

          <button
            onClick={() => setShowModalBuat(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: '#2563eb', color: '#fff', border: 'none',
              padding: '9px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600,
              cursor: 'pointer', boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
            }}
          >
            <PlusCircle size={16} /> Buat Event TOBK Baru
          </button>
        </div>
      </div>

      {/* Selector Event Aktif & Banner Kontrol Token */}
      {events.length === 0 ? (
        <div style={{ background: '#eff6ff', border: '1px dashed #93c5fd', borderRadius: '12px', padding: '40px 20px', textAlign: 'center', marginBottom: '24px' }}>
          <Sparkles size={40} style={{ color: '#3b82f6', marginBottom: '12px' }} />
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e3a8a', margin: '0 0 8px' }}>Belum Ada Event TOBK yang Dibuat</h3>
          <p style={{ color: '#475569', fontSize: '14px', maxWidth: '500px', margin: '0 auto 16px' }}>
            Buat event try out akbar UTBK atau TKA pertama Anda. Atur token, durasi per subtes, jeda transisi, dan ekspor data marketing leads.
          </p>
          <button
            onClick={() => setShowModalBuat(true)}
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            + Buat Event Sekarang
          </button>
        </div>
      ) : (
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '20px', marginBottom: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Pilih Event:</label>
              <select
                value={selectedEventId}
                onChange={(e) => handlePilihEvent(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, color: '#0f172a', background: '#f8fafc' }}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    [{ev.kategori || 'UTBK'}] {ev.judul} ({ev.token})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handlePilihEvent(currentEvent?.id)}
                disabled={refreshing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} /> Refresh Data
              </button>

              <button
                onClick={handleEksporExcel}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(5,150,105,0.2)' }}
                title="Download file Excel (.csv) berisi nama, target prodi, skor per kolom subtes, dan total nilai"
              >
                <FileSpreadsheet size={15} /> Download Excel Nilai (.csv)
              </button>

              <button
                onClick={() => setShowModalCetakPdf(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#4f46e5', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 1px 2px rgba(79,70,229,0.2)' }}
                title="Cetak atau Simpan PDF Lembar Rekap Nilai Resmi TOBK"
              >
                <Printer size={15} /> Cetak / PDF Nilai
              </button>

              <button
                onClick={() => setShowModalPurge(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Trash2 size={14} /> Bersihkan Data (Purge)
              </button>
            </div>
          </div>

          {currentEvent && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', alignItems: 'center' }}>
              {/* Box Token Ujian */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
                  Token Ujian Peserta
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '2px', color: '#1e293b', fontFamily: 'monospace' }}>
                    {currentEvent.token || '-'}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentEvent.token);
                      alert(`Token "${currentEvent.token}" berhasil disalin ke clipboard!`);
                    }}
                    style={{ background: '#e2e8f0', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Salin
                  </button>
                </div>
              </div>

              {/* Saklar Live Token */}
              <div style={{ background: currentEvent.tokenAktif ? '#f0fdf4' : '#fef2f2', border: `1px solid ${currentEvent.tokenAktif ? '#86efac' : '#fca5a5'}`, borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: currentEvent.tokenAktif ? '#166534' : '#991b1b', fontWeight: 600, marginBottom: '6px' }}>
                  Status Akses Peserta (Live Gate)
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: currentEvent.tokenAktif ? '#15803d' : '#b91c1c' }}>
                    {currentEvent.tokenAktif ? '🟢 TOKEN DIBUKA (Peserta Bisa Masuk)' : '🔴 TOKEN DITUTUP (Tahan di Ruang Tunggu)'}
                  </span>
                  <button
                    onClick={handleToggleToken}
                    style={{
                      background: currentEvent.tokenAktif ? '#dc2626' : '#16a34a',
                      color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '6px',
                      fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {currentEvent.tokenAktif ? 'Kunci Token' : 'Buka Token Sekarang'}
                  </button>
                </div>
              </div>

              {/* Info Aturan Ujian */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Parameter Sistem Ujian
                </div>
                <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>⏱️ Mode Timer: <strong>{currentEvent.modeTimer === 'per-subtes' ? 'Block Time per Subtes' : 'Timer Tunggal'} ({currentEvent.durasiMenit || 195} Menit)</strong></span>
                  <span>🔄 Jeda Transisi: <strong>{currentEvent.jedaTransisiDetik || 15} Detik (Tombol Biru)</strong></span>
                  <span>🛡️ Toleransi Curang: <strong>Maks {currentEvent.maksimalPelanggaran || 3} Teguran</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Grid Statistik Leads */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#64748b', fontSize: '12px', fontWeight: 600 }}>Total Leads Marketing</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats.total}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#eab308', fontSize: '12px', fontWeight: 600 }}>Di Ruang Tunggu</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#ca8a04', marginTop: '4px' }}>{stats.menunggu}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 600 }}>Sedang Ujian (Live)</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>{stats.mengerjakan}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#22c55e', fontSize: '12px', fontWeight: 600 }}>Selesai Mengerjakan</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>{stats.selesai}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
          <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: 600 }}>Didiskualifikasi</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#dc2626', marginTop: '4px' }}>{stats.diskualifikasi}</div>
        </div>
      </div>

      {/* Tabel Data Peserta & Leads Marketing */}
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Cari nama, WA, asal sekolah, kota..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={14} style={{ color: '#64748b' }} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
            >
              <option value="semua">Semua Status Ujian</option>
              <option value="menunggu_token">Menunggu Token</option>
              <option value="mengerjakan">Sedang Mengerjakan</option>
              <option value="selesai">Selesai</option>
              <option value="diskualifikasi">Didiskualifikasi</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px', width: '40px' }}>No</th>
                <th style={{ padding: '12px 16px' }}>Nama Peserta</th>
                <th style={{ padding: '12px 16px' }}>WhatsApp (Marketing)</th>
                <th style={{ padding: '12px 16px' }}>Asal Sekolah & Kota</th>
                <th style={{ padding: '12px 16px' }}>Target PTN / Jurusan</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Skor</th>
                <th style={{ padding: '12px 16px' }}>Pelanggaran</th>
                <th style={{ padding: '12px 16px' }}>Waktu Daftar</th>
              </tr>
            </thead>
            <tbody>
              {leadsTersaring.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    Belum ada data peserta yang terdaftar untuk filter ini.
                  </td>
                </tr>
              ) : (
                leadsTersaring.map((lead, idx) => {
                  const noWa = (lead.whatsapp || '').replace(/[^0-9]/g, '');
                  const waFormatted = noWa.startsWith('0') ? '62' + noWa.slice(1) : noWa;
                  const waLink = `https://wa.me/${waFormatted}?text=Halo%20${encodeURIComponent(lead.nama || '')}%2C%20terima%20kasih%20telah%20mengikuti%20${encodeURIComponent(currentEvent?.judul || 'Tryout Bimbel Gemilang')}`;

                  return (
                    <tr key={lead.pesertaId || idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{idx + 1}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0f172a' }}>
                        {lead.nama || '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <a
                          href={waLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#059669', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          📲 {lead.whatsapp || '-'}
                        </a>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        <div>{lead.asalSekolah || '-'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{lead.kota || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#334155' }}>
                        <div style={{ fontWeight: 500 }}>{lead.targetPtn || '-'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{lead.targetJurusan || '-'}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {lead.statusUjian === 'selesai' && (
                          <span style={{ background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Selesai
                          </span>
                        )}
                        {lead.statusUjian === 'mengerjakan' && (
                          <span style={{ background: '#dbeafe', color: '#1e40af', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Mengerjakan
                          </span>
                        )}
                        {lead.statusUjian === 'menunggu_token' && (
                          <span style={{ background: '#fef9c3', color: '#854d0e', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Di Ruang Tunggu
                          </span>
                        )}
                        {lead.statusUjian === 'diskualifikasi' && (
                          <span style={{ background: '#fee2e2', color: '#991b1b', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>
                            Diskualifikasi
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {lead.skor !== null && lead.skor !== undefined ? lead.skor : '-'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {lead.totalPelanggaran > 0 ? (
                          <span style={{ color: lead.totalPelanggaran >= 3 ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                            ⚠️ {lead.totalPelanggaran} Strike
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontSize: '12px' }}>✓ Bersih</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '12px' }}>
                        {lead.waktuDaftar ? new Date(lead.waktuDaftar).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL BUAT EVENT BARU (STANDAR UTBK 2026 & TKA 2026) ── */}
      {showModalBuat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '640px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                ✨ Buat Event TOBK Akbar / Lomba Publik
              </h3>
              <button onClick={() => setShowModalBuat(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Pilihan Format Cepat (UTBK 2026 vs TKA 2026) */}
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Pilih Format Regulasi Resmi:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handlePilihFormat('UTBK_2026')}
                  style={{
                    background: formatPilihan === 'UTBK_2026' ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${formatPilihan === 'UTBK_2026' ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: '10px', padding: '10px 8px', textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: formatPilihan === 'UTBK_2026' ? '#1d4ed8' : '#0f172a' }}>
                    UTBK-SNBT 2026
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    7 Subtes · 195 Menit
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePilihFormat('TKA_2026_MTK')}
                  style={{
                    background: formatPilihan === 'TKA_2026_MTK' ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${formatPilihan === 'TKA_2026_MTK' ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: '10px', padding: '10px 8px', textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: formatPilihan === 'TKA_2026_MTK' ? '#1d4ed8' : '#0f172a' }}>
                    TKA Matematika
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    25 Soal · 75 Menit
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePilihFormat('TKA_2026_INDO')}
                  style={{
                    background: formatPilihan === 'TKA_2026_INDO' ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${formatPilihan === 'TKA_2026_INDO' ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: '10px', padding: '10px 8px', textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: formatPilihan === 'TKA_2026_INDO' ? '#1d4ed8' : '#0f172a' }}>
                    TKA Literasi B.Indo
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    30 Soal · 75 Menit
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePilihFormat('KUSTOM')}
                  style={{
                    background: formatPilihan === 'KUSTOM' ? '#eff6ff' : '#f8fafc',
                    border: `2px solid ${formatPilihan === 'KUSTOM' ? '#2563eb' : '#e2e8f0'}`,
                    borderRadius: '10px', padding: '10px 8px', textAlign: 'center', cursor: 'pointer'
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 800, color: formatPilihan === 'KUSTOM' ? '#1d4ed8' : '#0f172a' }}>
                    Lomba / Bebas
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    Timer Tunggal
                  </div>
                </button>
              </div>
            </div>

            {/* Box Regulasi UTBK 2026 */}
            {formatPilihan === 'UTBK_2026' && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#166534' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} /> Aturan Block Time UTBK-SNBT 2026 (Total 195 Menit):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '6px 0' }}>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PU: 30m</span>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PPU: 15m (~45s/soal)</span>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PBM: 25m</span>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PK: 20m</span>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>LBI: 42.5m</span>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>LBE: 20m</span>
                  <span style={{ background: '#dcfce7', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>PM: 42.5m</span>
                </div>
                <div style={{ fontSize: '11px', color: '#15803d' }}>
                  🔒 <em>Setelah waktu subtes habis/lanjut, siswa <strong>tidak dapat kembali</strong> ke subtes sebelumnya. Ada jeda transisi dengan tombol warna biru.</em>
                </div>
              </div>
            )}

            {/* Box Regulasi TKA 2026 */}
            {(formatPilihan === 'TKA_2026_MTK' || formatPilihan === 'TKA_2026_INDO') && (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '12px', color: '#1e40af' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                  ⏱️ Regulasi Resmi TKA 2026 (Kemendikdasmen):
                </div>
                <div>
                  Durasi sesi <strong>75 menit</strong>. Jeda antar subtes <strong>1 menit (60 detik)</strong> dengan tombol MULAI yang berubah menjadi warna <strong>biru</strong> setelah hitung mundur selesai.
                </div>
              </div>
            )}

            <form onSubmit={handleSimpanEventBaru} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Judul Event Ujian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TOBK FUNDAMENTAL SNBT 2026"
                  value={formEvent.judul}
                  onChange={(e) => setFormEvent({ ...formEvent, judul: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Kategori Event
                  </label>
                  <select
                    value={formEvent.kategori}
                    onChange={(e) => setFormEvent({ ...formEvent, kategori: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
                  >
                    <option value="Try Out Akbar UTBK">Try Out Akbar UTBK</option>
                    <option value="TKA SMP / SMA">TKA SMP / SMA</option>
                    <option value="Lomba Prestasi">Lomba Prestasi Akademik</option>
                    <option value="Marketing Leads">Event Lead Marketing</option>
                    <option value="Minat & Bakat">Tes Minat & Bakat</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Durasi Pengerjaan (Menit)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={formEvent.durasiMenit}
                    onChange={(e) => setFormEvent({ ...formEvent, durasiMenit: Number(e.target.value) })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Sumber Paket Soal (Preset Lengkap + Bank Soal Bimbel) */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Sumber Paket Soal
                </label>
                <select
                  value={formEvent.sumberSoal}
                  onChange={(e) => setFormEvent({ ...formEvent, sumberSoal: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc', fontWeight: 600 }}
                >
                  <option value="preset_utbk_2026">⭐ [PRESET RESMI] UTBK-SNBT 2026 (7 Subtes Block Time - 195 Menit)</option>
                  <option value="preset_tka_mtk">📐 [PRESET RESMI] TKA 2026: Matematika Wajib & Numerasi (25 Soal, 75m)</option>
                  <option value="preset_tka_indo">📖 [PRESET RESMI] TKA 2026: B. Indonesia & Literasi (30 Soal, 75m)</option>
                  
                  {/* Paket dari Bank Soal Bimbel jika ada */}
                  {paketBimbelList.length > 0 && (
                    <optgroup label="Paket dari Bank Soal Bimbel Gemilang">
                      {paketBimbelList.map((p) => (
                        <option key={p.id} value={`bimbel_${p.id}`}>
                          📁 {p.judul} ({p.daftarSoal?.length || p.totalSoal || 0} soal)
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Kode Token & Acak */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Kode Token Ujian
                  </label>
                  <input
                    type="text"
                    required
                    value={formEvent.token}
                    onChange={(e) => setFormEvent({ ...formEvent, token: e.target.value.toUpperCase() })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="button"
                  onClick={generateRandomToken}
                  style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '9px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', height: '38px' }}
                >
                  🎲 Acak Token
                </button>
              </div>

              {/* Aturan Anti-Curang & Pengawasan */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Aturan Anti-Curang & Pengawasan</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formEvent.wajibKamera}
                      onChange={(e) => setFormEvent({ ...formEvent, wajibKamera: e.target.checked })}
                    />
                    Wajib Kamera Pengawas Aktif (Webcam AI Proctor)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formEvent.tokenAktif}
                      onChange={(e) => setFormEvent({ ...formEvent, tokenAktif: e.target.checked })}
                    />
                    Langsung Buka Token Sekarang (Bisa dikunci nanti)
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowModalBuat(false)}
                  style={{ background: '#f1f5f9', border: 'none', padding: '9px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  style={{ background: '#2563eb', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  Terbitkan Event TOBK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Purge */}
      {showModalPurge && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '480px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#b91c1c', marginBottom: '12px' }}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>
                Bersihkan Data Sementara (Zero Storage Bloat)
              </h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 16px' }}>
              Hapus data peserta sementara untuk event <strong>"{currentEvent?.judul}"</strong>? Database bimbel akan kembali bersih 100%. Pastikan sudah mengunduh CSV terlebih dahulu.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setShowModalPurge(false)}
                disabled={purgeLoading}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleKonfirmasiPurge(false)}
                disabled={purgeLoading}
                style={{ background: '#dc2626', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
              >
                {purgeLoading ? 'Membersihkan...' : 'Ya, Bersihkan Data Peserta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CETAK / SIMPAN PDF REKAP NILAI RESMI ── */}
      {showModalCetakPdf && (
        <div
          id="modal-cetak-rekap-tobk"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '1150px',
              width: '100%',
              maxHeight: '94vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            {/* Header Modal (Tidak Ikut Tercetak) */}
            <div
              className="no-print"
              style={{
                padding: '16px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#f8fafc',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  🖨️ Lembar Rekapitulasi Nilai Resmi TOBK
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  Format cetak / unduh PDF resmi memuat data lengkap, kolom subtes, target prodi, dan tanda tangan panitia.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => window.print()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Printer size={16} /> Cetak / Simpan sebagai PDF
                </button>
                <button
                  onClick={() => setShowModalCetakPdf(false)}
                  style={{
                    background: '#e2e8f0',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  ✕ Tutup
                </button>
              </div>
            </div>

            {/* Konten Lembar Cetak A4 */}
            <div
              id="area-cetak-rekap-tobk"
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '32px',
                background: '#ffffff',
                fontFamily: 'serif',
                color: '#1e293b',
              }}
            >
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  #area-cetak-rekap-tobk, #area-cetak-rekap-tobk * { visibility: visible !important; }
                  #area-cetak-rekap-tobk {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .no-print { display: none !important; }
                }
              `}</style>

              {/* KOP RESMI */}
              <div
                style={{
                  borderBottom: '3px double #0f172a',
                  paddingBottom: '16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase', color: '#1e3a8a', fontFamily: 'system-ui, sans-serif' }}>
                    BIMBEL GEMILANG · PUSAT ASESMEN & SIMULASI CBT
                  </div>
                  <div style={{ fontSize: '13px', color: '#475569', marginTop: '3px', fontFamily: 'system-ui, sans-serif' }}>
                    Portal Ujian Akbar Publik & Uji Kemampuan Standar UTBK-SNBT / TKA Nasional
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontFamily: 'system-ui, sans-serif' }}>
                  <span style={{ display: 'inline-block', background: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800 }}>
                    KODE TOKEN: {currentEvent?.token || '-'}
                  </span>
                </div>
              </div>

              {/* JUDUL REKAP & METADATA */}
              <div style={{ textAlign: 'center', marginBottom: '24px', fontFamily: 'system-ui, sans-serif' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, textTransform: 'uppercase', color: '#0f172a' }}>
                  LEMBAR REKAPITULASI NILAI PESERTA
                </h2>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#2563eb', marginTop: '4px' }}>
                  {currentEvent?.judul || 'TOBK AKBAR PUBLIK'}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Kategori: <strong>{currentEvent?.kategori || 'UTBK-SNBT 2026'}</strong> | Total Peserta: <strong>{leads.length} Siswa</strong> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              {/* TABEL REKAP NILAI LENGKAP */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  fontFamily: 'system-ui, sans-serif',
                  marginBottom: '32px',
                }}
              >
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#0f172a', borderTop: '1px solid #cbd5e1', borderBottom: '2px solid #94a3b8' }}>
                    <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #cbd5e1', width: '30px' }}>No</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Nama Peserta</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>Asal Sekolah & Kota</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left', border: '1px solid #cbd5e1' }}>
                      {((currentEvent?.formatUjian || '').startsWith('TKA')) ? 'Target Peminatan' : 'Target PTN & Prodi'}
                    </th>
                    {daftarSubtesHeader.map((s) => (
                      <th key={s.id} style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #cbd5e1', background: '#eff6ff' }}>
                        {s.kode || s.nama}
                      </th>
                    ))}
                    <th style={{ padding: '8px 8px', textAlign: 'center', border: '1px solid #cbd5e1', background: '#fef3c7', fontWeight: 800 }}>
                      TOTAL SKOR
                    </th>
                    <th style={{ padding: '8px 6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr>
                      <td colSpan={6 + daftarSubtesHeader.length} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                        Belum ada peserta yang mengikuti event ini.
                      </td>
                    </tr>
                  ) : (
                    leads.map((l, idx) => {
                      const leadSubtesMap = {};
                      if (Array.isArray(l.skorSubtes)) {
                        l.skorSubtes.forEach((item) => {
                          const k = (item.id || item.kode || item.nama || '').toLowerCase();
                          leadSubtesMap[k] = item.skor;
                        });
                      } else if (l.skorSubtes && typeof l.skorSubtes === 'object') {
                        Object.assign(leadSubtesMap, l.skorSubtes);
                      }

                      return (
                        <tr key={l.pesertaId || idx} style={{ borderBottom: '1px solid #e2e8f0', background: idx % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                          <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 8px', fontWeight: 700, border: '1px solid #e2e8f0' }}>{l.nama || '-'}</td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                            <div>{l.asalSekolah || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{l.kota || '-'}</div>
                          </td>
                          <td style={{ padding: '6px 8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontWeight: 600 }}>{l.targetPtn || l.targetPeminatan || '-'}</div>
                            <div style={{ fontSize: '10px', color: '#64748b' }}>{l.targetJurusan || l.targetProdi || '-'}</div>
                          </td>
                          {daftarSubtesHeader.map((s) => {
                            if (l.statusUjian !== 'selesai' && l.statusUjian !== 'diskualifikasi') {
                              return <td key={s.id} style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#94a3b8' }}>-</td>;
                            }
                            if (l.statusUjian === 'diskualifikasi') {
                              return <td key={s.id} style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', color: '#dc2626' }}>0</td>;
                            }
                            const matchKey = (s.id || s.kode || s.nama).toLowerCase();
                            let val = null;
                            for (const [k, v] of Object.entries(leadSubtesMap)) {
                              if (k.includes(matchKey) || matchKey.includes(k)) {
                                val = v;
                                break;
                              }
                            }
                            if (val === null && l.skor !== null && l.skor !== undefined) {
                              val = Math.round(Number(l.skor));
                            }
                            return (
                              <td key={s.id} style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 600 }}>
                                {val !== null ? val : '-'}
                              </td>
                            );
                          })}
                          <td style={{ padding: '6px 8px', textAlign: 'center', border: '1px solid #e2e8f0', fontWeight: 800, background: '#fffbeb', color: '#92400e' }}>
                            {l.statusUjian === 'diskualifikasi' ? '0 (DSQ)' : l.skor !== null && l.skor !== undefined ? Math.round(Number(l.skor)) : '-'}
                          </td>
                          <td style={{ padding: '6px', textAlign: 'center', border: '1px solid #e2e8f0', fontSize: '10px' }}>
                            {l.statusUjian === 'selesai' && <span style={{ color: '#16a34a', fontWeight: 700 }}>SELESAI</span>}
                            {l.statusUjian === 'mengerjakan' && <span style={{ color: '#2563eb', fontWeight: 700 }}>AKTIF</span>}
                            {l.statusUjian === 'menunggu_token' && <span style={{ color: '#d97706' }}>MENUNGGU</span>}
                            {l.statusUjian === 'diskualifikasi' && <span style={{ color: '#dc2626', fontWeight: 800 }}>DSQ</span>}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* TANDA TANGAN RESMI */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '0 40px',
                  marginTop: '40px',
                  fontFamily: 'system-ui, sans-serif',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Mengetahui,</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    Koordinator Asesmen CBT
                  </div>
                  <div style={{ height: '60px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, borderTop: '1px solid #334155', paddingTop: '4px' }}>
                    ( Tim Penjamin Mutu )
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Disahkan di Jakarta,</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    Direktur Pendidikan Bimbel Gemilang
                  </div>
                  <div style={{ height: '60px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, borderTop: '1px solid #334155', paddingTop: '4px' }}>
                    ( Panitia Ujian Gemilang )
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
