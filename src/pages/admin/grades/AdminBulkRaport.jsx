// src/pages/admin/grades/AdminBulkRaport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { syncAllScoresToRaport } from '../../../services/raportService';
import { RAPORT_COLLECTIONS } from '../../../firebase/raportCollection';
import { ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Database, Users, FileText } from 'lucide-react';

const AdminBulkRaport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [selectedPeriode, setSelectedPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [stats, setStats] = useState({ totalStudents: 0, hasData: 0, noData: 0 });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchStats();
  }, [selectedPeriode]);

  const fetchStats = async () => {
    const studentsSnap = await getDocs(collection(db, "students"));
    const totalStudents = studentsSnap.size;
    
    const raportSnap = await getDocs(query(
      collection(db, RAPORT_COLLECTIONS.FINAL),
      where("periode", "==", selectedPeriode)
    ));
    
    setStats({
      totalStudents,
      hasData: raportSnap.size,
      noData: totalStudents - raportSnap.size
    });
  };

  const handleBulkSync = async () => {
    if (!window.confirm(`Generate raport untuk SEMUA SISWA periode ${selectedPeriode}?\n\n⚠️ ADMIN MODE: Generate untuk SEMUA MAPEL.\nMinimal 2 komponen nilai harus tersedia.\nBobot dihitung otomatis proporsional.\nSiswa dengan data kurang akan dilewati.`)) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      // ➕ null = ADMIN generate semua mapel
      const syncResult = await syncAllScoresToRaport(selectedPeriode, null);
      setResult(syncResult);
      
      if (syncResult.incomplete && syncResult.incomplete.length > 0) {
        alert(`⚠️ ${syncResult.incomplete.length} siswa memiliki data kurang dari 2 komponen. Silakan lengkapi dulu!`);
      } else {
        alert(`✅ Raport periode ${selectedPeriode} berhasil digenerate untuk ${syncResult.processed} siswa!`);
      }
      await fetchStats();
    } catch (error) {
      console.error(error);
      alert("❌ Gagal generate raport: " + error.message);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '0 8px' : '0' }}>
      {/* TOMBOL KEMBALI */}
      <button 
        onClick={() => navigate('/admin/grades')} 
        style={{
          display: 'flex', alignItems: 'center', gap: '6px', background: 'white',
          border: '1px solid #e2e8f0', padding: isMobile ? '8px 12px' : '8px 16px',
          borderRadius: '8px', cursor: 'pointer', fontSize: isMobile ? '11px' : '12px',
          fontWeight: '600', color: '#64748b', marginBottom: isMobile ? '16px' : '20px'
        }}
      >
        <ArrowLeft size={isMobile ? 12 : 14} /> Kembali ke Grade Report
      </button>

      {/* Header */}
      <div style={{ marginBottom: isMobile ? 16 : 24 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 17 : 20, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={isMobile ? 20 : 24} color="#3b82f6" /> Bulk Generate Raport
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: isMobile ? 10 : 12, color: '#64748b' }}>
          Generate raport untuk SEMUA siswa & SEMUA mapel (Admin Only)
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 12 : 20 }}>
        {/* Statistik */}
        <div style={{ background: 'white', borderRadius: isMobile ? 12 : 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? 12 : 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={isMobile ? 14 : 16} color="#3b82f6" /> Statistik Siswa
          </h3>
          <div style={{ display: 'flex', gap: isMobile ? 8 : 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: isMobile ? 70 : 100, background: '#f8fafc', padding: isMobile ? 10 : 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#1e293b' }}>{stats.totalStudents}</div>
              <div style={{ fontSize: isMobile ? 9 : 11, color: '#64748b' }}>Total Siswa</div>
            </div>
            <div style={{ flex: 1, minWidth: isMobile ? 70 : 100, background: '#dcfce7', padding: isMobile ? 10 : 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#166534' }}>{stats.hasData}</div>
              <div style={{ fontSize: isMobile ? 9 : 11, color: '#166534' }}>Sudah Punya</div>
            </div>
            <div style={{ flex: 1, minWidth: isMobile ? 70 : 100, background: '#fef3c7', padding: isMobile ? 10 : 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color: '#b45309' }}>{stats.noData}</div>
              <div style={{ fontSize: isMobile ? 9 : 11, color: '#b45309' }}>Belum Punya</div>
            </div>
          </div>
        </div>

        {/* Form Generate */}
        <div style={{ background: 'white', borderRadius: isMobile ? 12 : 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: isMobile ? 12 : 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={isMobile ? 14 : 16} color="#3b82f6" /> Pengaturan Generate
          </h3>
          
          {/* ➕ BOX ADMIN MODE */}
          <div style={{ 
            background: '#fef3c7', 
            padding: isMobile ? 8 : 12, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid #fde68a',
            fontSize: isMobile ? 10 : 11,
            color: '#b45309',
            lineHeight: 1.5
          }}>
            ⚠️ <b>Admin Mode:</b> Generate untuk <b>SEMUA mapel & SEMUA siswa</b>. Guru hanya bisa generate mapelnya sendiri.
          </div>

          <div style={{ 
            background: '#f0f9ff', 
            padding: isMobile ? 8 : 12, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid #bae6fd',
            fontSize: isMobile ? 10 : 11,
            color: '#0369a1',
            lineHeight: 1.5
          }}>
            ⚠️ <b>Ketentuan:</b> Minimal <b>2 komponen</b> harus tersedia (kuis, catatan, ujian, keaktifan). Bobot dihitung <b>otomatis proporsional</b>. Siswa dengan data kurang akan dilewati.
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>Periode Raport</label>
            <input 
              type="month" 
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              style={{ width: '100%', padding: isMobile ? '8px 10px' : '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: isMobile ? 11 : 13, boxSizing: 'border-box' }}
            />
          </div>
          
          <button 
            onClick={handleBulkSync} 
            disabled={loading}
            style={{
              width: '100%',
              padding: isMobile ? '12px' : '14px',
              background: loading ? '#cbd5e1' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: isMobile ? 13 : 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <RefreshCw size={isMobile ? 16 : 18} className={loading ? 'spin' : ''} />
            {loading ? 'Memproses Semua...' : '🚀 Generate Raport SEMUA SISWA'}
          </button>
        </div>

        {/* Hasil */}
        {result && (
          <div style={{ background: 'white', borderRadius: isMobile ? 12 : 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: isMobile ? 12 : 14, fontWeight: 700 }}>📊 Hasil Sinkronisasi</h4>
            
            {result.error ? (
              <div style={{ background: '#fee2e2', padding: isMobile ? 12 : 16, borderRadius: 12, color: '#ef4444', fontSize: isMobile ? 11 : 13 }}>
                ❌ Error: {result.error}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: isMobile ? 8 : 12, marginBottom: 16, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ flex: 1, minWidth: isMobile ? 80 : 100, background: '#dcfce7', padding: isMobile ? 10 : 12, borderRadius: 10, textAlign: 'center' }}>
                    <CheckCircle size={isMobile ? 16 : 20} color="#10b981" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#166534' }}>{result.processed}</div>
                    <div style={{ fontSize: isMobile ? 8 : 10, color: '#166534' }}>Siswa Tuntas</div>
                  </div>
                  <div style={{ flex: 1, minWidth: isMobile ? 80 : 100, background: '#fef3c7', padding: isMobile ? 10 : 12, borderRadius: 10, textAlign: 'center' }}>
                    <AlertTriangle size={isMobile ? 16 : 20} color="#f59e0b" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: isMobile ? 16 : 20, fontWeight: 800, color: '#b45309' }}>{result.incomplete?.length || 0}</div>
                    <div style={{ fontSize: isMobile ? 8 : 10, color: '#b45309' }}>Data Kurang</div>
                  </div>
                </div>
                
                {result.incomplete?.length > 0 && (
                  <div style={{ background: '#fffbeb', padding: isMobile ? 10 : 12, borderRadius: 10, maxHeight: isMobile ? 150 : 200, overflowY: 'auto' }}>
                    <p style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: '#b45309', margin: '0 0 8px' }}>⚠️ Siswa dengan data kurang:</p>
                    {result.incomplete.slice(0, 10).map(s => (
                      <div key={s.id} style={{ fontSize: isMobile ? 9 : 10, color: '#92400e', marginBottom: 4, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                        <span>{s.name}</span>
                        <span style={{ fontSize: isMobile ? 8 : 9 }}>
                          Ada: {s.totalKomponen || 0}/4 {' '}
                          {s.missing.kuis && '❌Kuis '} {s.missing.catatan && '❌Catatan '} 
                          {s.missing.ujian && '❌Ujian '} {s.missing.keaktifan && '❌Keaktifan'}
                        </span>
                      </div>
                    ))}
                    {result.incomplete.length > 10 && (
                      <div style={{ fontSize: isMobile ? 9 : 10, color: '#92400e', marginTop: 4 }}>...dan {result.incomplete.length - 10} lainnya</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

export default AdminBulkRaport;