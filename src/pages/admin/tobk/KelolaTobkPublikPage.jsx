// src/pages/admin/tobk/KelolaTobkPublikPage.jsx
// ============================================================
// MANAJEMEN TOBK GEMILANG & EVENT PUBLIK (Admin Control Center)
// Try Out Akbar, Lomba, Marketing Leads, & Tes Minat Bakat
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Users, Key, Clock, ShieldCheck, Download, Trash2,
  PlusCircle, RefreshCw, ExternalLink, CheckCircle, AlertTriangle,
  Search, Filter, PlayCircle, StopCircle, ArrowRight, Share2, Sparkles
} from 'lucide-react';
import { db } from '../../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import {
  ambilSemuaEventTobk, simpanEventTobk, toggleTokenEventTobk,
  ambilSemuaLeadsTobk, eksporLeadsCsv, bersihkanDataEventTobk,
  SOAL_PRESET_UTBK
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
  const [formEvent, setFormEvent] = useState({
    judul: '',
    kategori: 'UTBK',
    durasiMenit: 90,
    token: 'GEMILANG2026',
    tokenAktif: true,
    maksimalPelanggaran: 3,
    wajibKamera: true,
    sumberSoal: 'preset_utbk', // 'preset_utbk' | 'paket_bimbel'
    paketBimbelId: '',
    keterangan: 'Try Out Akbar Nasional Bimbel Gemilang',
  });

  // Modal Konfirmasi Bersihkan Data
  const [showModalPurge, setShowModalPurge] = useState(false);
  const [purgeLoading, setPurgeLoading] = useState(false);

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

      // Muat leads untuk event aktif
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

  // Ganti event terpilih
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

  // Toggle status token
  const handleToggleToken = async () => {
    if (!currentEvent) return;
    const statusBaru = !currentEvent.tokenAktif;
    await toggleTokenEventTobk(currentEvent.id, statusBaru);
    setEvents((prev) =>
      prev.map((e) => (e.id === currentEvent.id ? { ...e, tokenAktif: statusBaru } : e))
    );
  };

  // Acak Token
  const generateRandomToken = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'TOBK-';
    for (let i = 0; i < 4; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormEvent((prev) => ({ ...prev, token: res }));
  };

  // Simpan Event Baru
  const handleSimpanEventBaru = async (e) => {
    e.preventDefault();
    if (!formEvent.judul.trim()) {
      alert('Judul Event wajib diisi!');
      return;
    }

    let soalList = SOAL_PRESET_UTBK;
    if (formEvent.sumberSoal === 'paket_bimbel' && formEvent.paketBimbelId) {
      const paketDipilih = paketBimbelList.find((p) => p.id === formEvent.paketBimbelId);
      if (paketDipilih && Array.isArray(paketDipilih.daftarSoal) && paketDipilih.daftarSoal.length > 0) {
        soalList = paketDipilih.daftarSoal;
      }
    }

    const payload = {
      ...formEvent,
      daftarSoal: soalList,
      totalSoal: soalList.length,
      createdAt: new Date().toISOString(),
    };

    const saved = await simpanEventTobk(payload);
    setEvents((prev) => [saved, ...prev]);
    setSelectedEventId(saved.id);
    setShowModalBuat(false);
    alert(`Event TOBK "${saved.judul}" berhasil dibuat! Token: ${saved.token}`);
    handlePilihEvent(saved.id);
  };

  // Ekspor CSV Leads
  const handleEksporCsv = () => {
    if (!currentEvent) return;
    eksporLeadsCsv(leads, currentEvent.judul || 'TOBK_Gemilang');
  };

  // Purge / Bersihkan Data Event
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

  // Filter Leads
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

  // Statistik Ringkas
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
            Kendali Ujian Skala Besar (Lomba, Marketing Leads, Tryout UTBK/TKA, Tes Minat Bakat) · <strong>Zero Storage Bloat</strong>
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
            Buat event try out akbar atau lomba pertama Anda. Anda dapat menentukan token, timer, aturan anti-cheat, serta mengunduh data marketing leads.
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
                onClick={handleEksporCsv}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#059669', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                <Download size={14} /> Ekspor Leads Marketing (CSV)
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
                  Parameter Ujian
                </div>
                <div style={{ fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>⏱️ Durasi: <strong>{currentEvent.durasiMenit || 90} Menit</strong></span>
                  <span>🛡️ Toleransi Curang: <strong>Maks {currentEvent.maksimalPelanggaran || 3} Teguran</strong></span>
                  <span>📷 Pengawasan: <strong>{currentEvent.wajibKamera ? 'Wajib Kamera AI' : 'Tanpa Kamera'}</strong></span>
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
        {/* Toolbar Pencarian & Filter */}
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

        {/* Tabel */}
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

      {/* MODAL: Buat Event Baru */}
      {showModalBuat && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
          <div style={{ background: '#ffffff', borderRadius: '16px', maxWidth: '580px', width: '100%', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              ✨ Buat Event TOBK Akbar / Lomba Publik
            </h3>

            <form onSubmit={handleSimpanEventBaru} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Judul Event Ujian
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: TRY OUT AKBAR UTBK-SNBT NASIONAL 2026"
                  value={formEvent.judul}
                  onChange={(e) => setFormEvent({ ...formEvent, judul: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Kategori Event
                  </label>
                  <select
                    value={formEvent.kategori}
                    onChange={(e) => setFormEvent({ ...formEvent, kategori: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
                  >
                    <option value="UTBK">Try Out Akbar UTBK</option>
                    <option value="TKA">Try Out TKA SMP / SMA</option>
                    <option value="Lomba">Lomba Prestasi Akademik</option>
                    <option value="Marketing">Event Lead Marketing</option>
                    <option value="MinatBakat">Tes Minat & Bakat</option>
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

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                  Sumber Paket Soal
                </label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sumberSoal"
                      value="preset_utbk"
                      checked={formEvent.sumberSoal === 'preset_utbk'}
                      onChange={() => setFormEvent({ ...formEvent, sumberSoal: 'preset_utbk' })}
                    />
                    Preset Standar UTBK Gemilang (5 Soal Penalaran)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="sumberSoal"
                      value="paket_bimbel"
                      checked={formEvent.sumberSoal === 'paket_bimbel'}
                      onChange={() => setFormEvent({ ...formEvent, sumberSoal: 'paket_bimbel' })}
                    />
                    Pilih Paket dari Bank Soal Bimbel
                  </label>
                </div>

                {formEvent.sumberSoal === 'paket_bimbel' && (
                  <select
                    value={formEvent.paketBimbelId}
                    onChange={(e) => setFormEvent({ ...formEvent, paketBimbelId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', background: '#f8fafc' }}
                  >
                    <option value="">-- Pilih Paket Bank Soal --</option>
                    {paketBimbelList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.judul} ({p.daftarSoal?.length || p.totalSoal || 0} soal)
                      </option>
                    ))}
                  </select>
                )}
              </div>

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

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>Aturan Anti-Curang & Pengawasan</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formEvent.wajibKamera}
                      onChange={(e) => setFormEvent({ ...formEvent, wajibKamera: e.target.checked })}
                    />
                    Wajib Kamera Pengawas Aktif (Webcam Proctor)
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
                  style={{ background: '#2563eb', border: 'none', padding: '9px 20px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, color: '#fff', cursor: 'pointer' }}
                >
                  Terbitkan Event TOBK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Purge / Bersihkan Data */}
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
              Apakah Anda yakin ingin menghapus data leads dan riwayat pengerjaan peserta event <strong>"{currentEvent?.judul}"</strong>?
              <br /><br />
              <span style={{ color: '#059669', fontWeight: 600 }}>Tips:</span> Pastikan Anda sudah mengunduh data leads via tombol <strong>Ekspor Leads (CSV)</strong> sebelum membersihkan. Tindakan ini akan mengosongkan database event agar kuota bimbel tetap 100% bebas biaya tambahan.
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
    </div>
  );
}
