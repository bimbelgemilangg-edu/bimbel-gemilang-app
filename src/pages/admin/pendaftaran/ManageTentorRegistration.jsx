// src/pages/admin/pendaftaran/ManageTentorRegistration.jsx
//
// ============================================================
// KELOLA LAMARAN TENTOR/STAFF -- BIMBEL GEMILANG
// ============================================================
// 🔥 BARU: file BARU, TERPISAH dari ManageOnlineRegistration.jsx
// (kelola pendaftaran SISWA). Sengaja dipisah biar dua alur data yang
// beda konteks (siswa vs pelamar kerja) gak tercampur di satu tabel/
// koleksi, dan gak perlu ubah apa pun di halaman pendaftaran siswa.
//
// Baca dari koleksi Firestore "tutor_applications" (ditulis oleh
// PendaftaranTentor.jsx).
// ============================================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, deleteDoc
} from "firebase/firestore";
import {
  Briefcase, Trash2, ArrowLeft, Home, ChevronRight,
  Eye, X, MessageCircle, FileText, Image as ImageIcon, Download
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'baru', label: '🟡 Baru', bg: '#fff7ed', color: '#c2410c' },
  { value: 'diproses', label: '🔵 Diproses', bg: '#eff6ff', color: '#1d4ed8' },
  { value: 'wawancara', label: '🟣 Wawancara', bg: '#f5f3ff', color: '#6d28d9' },
  { value: 'diterima', label: '✅ Diterima', bg: '#dcfce7', color: '#166534' },
  { value: 'ditolak', label: '❌ Ditolak', bg: '#fee2e2', color: '#b91c1c' },
];

const getStatusInfo = (value) => STATUS_OPTIONS.find(s => s.value === value) || STATUS_OPTIONS[0];

const ManageTentorRegistration = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('semua');
  const [filterPosisi, setFilterPosisi] = useState('semua');

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "tutor_applications"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setApplications(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, (err) => { console.error(err); setLoading(false); });
    return () => unsub();
  }, []);

  const formatDate = (ts) => {
    if (!ts) return '-';
    try { return (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
    catch { return '-'; }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateDoc(doc(db, "tutor_applications", id), { status: newStatus });
      // 🔥 supaya modal detail (kalau lagi kebuka) ikut update tampilannya
      setSelectedApp(prev => prev && prev.id === id ? { ...prev, status: newStatus } : prev);
    } catch (e) {
      alert('❌ Gagal mengubah status: ' + e.message);
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Hapus lamaran ${nama}? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteDoc(doc(db, "tutor_applications", id));
      setShowDetailModal(false);
    } catch (e) {
      alert('❌ Gagal menghapus: ' + e.message);
    }
  };

  const handleKirimWA = (app) => {
    const waMsg = encodeURIComponent(`Halo ${app.namaLengkap}, terima kasih telah melamar posisi ${app.posisiDilamar} di Bimbel Gemilang. `);
    window.open(`https://wa.me/${app.whatsappAktif}?text=${waMsg}`, '_blank');
  };

  const openDetail = (app) => {
    setSelectedApp(app);
    setShowDetailModal(true);
  };

  // 🔥 daftar posisi unik yang beneran ada di data -- buat filter dropdown,
  // biar gak hardcode padahal datanya bisa macam-macam ("Lainnya" bebas ketik)
  const posisiList = [...new Set(applications.map(a => a.posisiDilamar).filter(Boolean))];

  const filtered = applications.filter(a => {
    if (filterStatus !== 'semua' && (a.status || 'baru') !== filterStatus) return false;
    if (filterPosisi !== 'semua' && a.posisiDilamar !== filterPosisi) return false;
    return true;
  });

  return (
    <div style={s.wrap}>
      <SidebarAdmin />
      <div style={s.main(isMobile)}>

        <div style={s.bread}>
          <button onClick={() => navigate('/admin/portal')} style={s.btnBack}><ArrowLeft size={14} /> Portal</button>
          <div style={s.breadR}><Home size={12} color="#94a3b8" /><ChevronRight size={12} color="#94a3b8" /><span style={{ fontWeight: 'bold', color: '#652D90' }}>Lamaran Tentor & Staff</span></div>
        </div>

        <div style={s.header}>
          <div>
            <h2 style={s.title}><Briefcase size={22} color="#652D90" /> Lamaran Tentor & Staff</h2>
            <span style={s.count}>{applications.length} pelamar</span>
          </div>
        </div>

        {/* FILTER */}
        <div style={s.filterRow}>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={s.filterSelect}>
            <option value="semua">Semua Status</option>
            {STATUS_OPTIONS.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
          </select>
          <select value={filterPosisi} onChange={e => setFilterPosisi(e.target.value)} style={s.filterSelect}>
            <option value="semua">Semua Posisi</option>
            {posisiList.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={s.center}><div style={s.spin}></div><p>Memuat...</p></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}><Briefcase size={48} /><p>{applications.length === 0 ? 'Belum ada lamaran masuk.' : 'Tidak ada lamaran yang cocok dengan filter.'}</p></div>
        ) : (
          <div style={s.card}>
            <div style={{ overflowX: 'auto' }}>
              <table style={s.tbl}>
                <thead>
                  <tr style={s.thr}>
                    <th style={s.th}>Tgl Lamar</th>
                    <th style={s.th}>Nama</th>
                    <th style={s.th}>WA</th>
                    <th style={s.th}>Posisi</th>
                    <th style={s.th}>Bidang</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => {
                    const st = getStatusInfo(app.status || 'baru');
                    return (
                      <tr key={app.id} style={s.tr}>
                        <td style={s.td}>{formatDate(app.createdAt)}</td>
                        <td style={{ ...s.td, fontWeight: 600 }}>
                          <button onClick={() => openDetail(app)} style={s.nameBtn}>{app.namaLengkap}</button>
                        </td>
                        <td style={s.td}>
                          <a href={`https://wa.me/${app.whatsappAktif}`} target="_blank" rel="noreferrer" style={s.wa}>{app.whatsappAktif}</a>
                        </td>
                        <td style={s.td}><span style={s.badge2}>{app.posisiDilamar || '-'}</span></td>
                        <td style={s.td}><span style={{ fontSize: 11, color: '#475569' }}>{app.bidangDiminati || '-'}</span></td>
                        <td style={s.td}>
                          <select
                            value={app.status || 'baru'}
                            onChange={(e) => handleStatusChange(app.id, e.target.value)}
                            style={{ ...s.statusSelect, background: st.bg, color: st.color }}
                          >
                            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </td>
                        <td style={{ ...s.td, textAlign: 'center' }}>
                          <div style={s.acts}>
                            <button onClick={() => openDetail(app)} style={s.btn('detail')} title="Lihat Detail"><Eye size={12} /></button>
                            <button onClick={() => handleKirimWA(app)} style={s.btn('wa')} title="WhatsApp"><MessageCircle size={12} /></button>
                            <button onClick={() => handleDelete(app.id, app.namaLengkap)} style={s.btn('hapus')} title="Hapus"><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL DETAIL */}
      {showDetailModal && selectedApp && (
        <div style={s.ov} onClick={() => setShowDetailModal(false)}>
          <div style={{ ...s.mod(isMobile), maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={s.mh}>
              <h3><Eye size={18} /> Detail Pelamar</h3>
              <button onClick={() => setShowDetailModal(false)} style={s.xb}><X size={18} /></button>
            </div>
            <div style={s.mb}>

              {/* Foto + info ringkas */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 16, alignItems: 'center' }}>
                {selectedApp.fotoUrl ? (
                  <img src={selectedApp.fotoUrl} alt="Foto pelamar" style={s.fotoModal} />
                ) : (
                  <div style={{ ...s.fotoModal, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8' }}>
                    <ImageIcon size={24} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{selectedApp.namaLengkap}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedApp.posisiDilamar}{selectedApp.bidangDiminati ? ` · ${selectedApp.bidangDiminati}` : ''}</div>
                  <select
                    value={selectedApp.status || 'baru'}
                    onChange={(e) => handleStatusChange(selectedApp.id, e.target.value)}
                    style={{ ...s.statusSelect, marginTop: 6, ...(() => { const st = getStatusInfo(selectedApp.status || 'baru'); return { background: st.bg, color: st.color }; })() }}
                  >
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
              </div>

              <div style={s.dr}><span>WhatsApp</span><strong>{selectedApp.whatsappAktif}</strong></div>
              {selectedApp.email && <div style={s.dr}><span>Email</span><strong>{selectedApp.email}</strong></div>}
              <div style={s.dr}><span>Alamat Domisili</span><strong>{selectedApp.alamatDomisili}</strong></div>
              <div style={s.dr}><span>Tanggal Lamar</span><strong>{formatDate(selectedApp.createdAt)}</strong></div>

              {/* CV */}
              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>📄 CV / Curriculum Vitae</span>
                {selectedApp.cvUrl ? (
                  <a href={selectedApp.cvUrl} target="_blank" rel="noopener noreferrer" style={s.cvLink}>
                    <FileText size={14} /> {selectedApp.cvFileName || 'Lihat/Unduh CV'} <Download size={12} />
                  </a>
                ) : (
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Tidak ada CV terlampir.</p>
                )}
              </div>

              {/* Surat Lamaran */}
              <div style={{ marginTop: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>✉️ Surat Lamaran</span>
                <div style={s.suratBox}>
                  {selectedApp.suratLamaran || <span style={{ color: '#94a3b8' }}>Tidak ada surat lamaran.</span>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f1f5f9' }}>
                <button onClick={() => handleKirimWA(selectedApp)} style={{ ...s.btnFull, background: '#25D366' }}>
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button onClick={() => handleDelete(selectedApp.id, selectedApp.namaLengkap)} style={{ ...s.btnFull, background: '#fee2e2', color: '#ef4444' }}>
                  <Trash2 size={14} /> Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

// ============================================================
// STYLES (konsisten dengan ManageOnlineRegistration.jsx)
// ============================================================
const s = {
  wrap: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  main: (m) => ({ marginLeft: m ? 0 : 250, padding: m ? 15 : 30, width: '100%', boxSizing: 'border-box', transition: '0.3s' }),

  bread: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  btnBack: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadR: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },

  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 },
  title: { margin: 0, fontSize: 22, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 },
  count: { background: '#f5f3ff', color: '#6d28d9', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginLeft: 8 },

  filterRow: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  filterSelect: { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#475569', background: 'white', cursor: 'pointer' },

  card: { background: 'white', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden' },
  center: { textAlign: 'center', padding: 60, color: '#94a3b8' },
  spin: { width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #652D90', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' },
  empty: { textAlign: 'center', padding: 60, background: 'white', borderRadius: 14, border: '2px dashed #e2e8f0', color: '#94a3b8' },

  tbl: { width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 800 },
  thr: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 12px', textAlign: 'left', color: '#64748b', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', color: '#334155', verticalAlign: 'middle' },
  nameBtn: { background: 'none', border: 'none', color: '#1e293b', cursor: 'pointer', fontWeight: 600, fontSize: 12, padding: 0, textDecoration: 'underline', textAlign: 'left' },
  wa: { color: '#25D366', textDecoration: 'none', fontWeight: 600 },
  badge2: { padding: '2px 8px', borderRadius: 10, background: '#f5f3ff', color: '#6d28d9', fontSize: 10, fontWeight: 600 },
  statusSelect: { padding: '4px 8px', borderRadius: 8, border: 'none', fontSize: 10, fontWeight: 700, cursor: 'pointer' },

  acts: { display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' },
  btn: (type) => ({
    border: 'none', padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10, fontWeight: 600,
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: type === 'detail' ? '#eef2ff' : type === 'wa' ? '#25D366' : '#fee2e2',
    color: type === 'detail' ? '#4338ca' : type === 'wa' ? 'white' : '#ef4444',
  }),

  ov: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  mod: (m) => ({ background: 'white', borderRadius: 16, padding: 24, width: m ? '95%' : '450px', maxHeight: '90vh', overflowY: 'auto', animation: 'slideUp 0.3s ease', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }),
  mh: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' },
  xb: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  mb: {},
  dr: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 },

  fotoModal: { width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0', flexShrink: 0 },
  cvLink: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, padding: '8px 12px', borderRadius: 8, background: '#eff6ff', color: '#1d4ed8', textDecoration: 'none', fontSize: 12, fontWeight: 600, width: 'fit-content' },
  suratBox: { marginTop: 6, padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, lineHeight: 1.6, color: '#334155', whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto' },
  btnFull: { flex: 1, padding: '10px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'white' },
};

export default ManageTentorRegistration;