// src/pages/student/raport/StudentSmartReport.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { RAPORT_COLLECTIONS } from '../../../firebase/raportCollection';
import { getRelativeLeaderboard } from '../../../services/raportService';
import RelativeLeaderboard from '../../../components/raport/RelativeLeaderboard';
import WeightedScoreCalculator from '../../../components/raport/WeightedScoreCalculator';
import { FileText, TrendingUp, Award, Calendar, Target, ChevronDown, ChevronUp } from 'lucide-react';

const StudentSmartReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  
  useEffect(() => {
    fetchReports();
  }, []);
  
  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, RAPORT_COLLECTIONS.FINAL),
        where("studentId", "==", studentId),
        orderBy("periode", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(data);
      
      if (data.length > 0) {
        setSelectedPeriode(data[0].periode);
        setCurrentReport(data[0]);
        
        // Ambil leaderboard untuk periode ini
        const lb = await getRelativeLeaderboard(data[0].periode, studentId);
        setLeaderboard(lb);
      }
    } catch (error) {
      console.error("Error fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePeriodeChange = async (periode) => {
    setSelectedPeriode(periode);
    const found = reports.find(r => r.periode === periode);
    setCurrentReport(found);
    const lb = await getRelativeLeaderboard(periode, studentId);
    setLeaderboard(lb);
  };
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: 13, color: '#64748b' }}>Memuat laporan pintar...</p>
        </div>
      </div>
    );
  }
  
  if (reports.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
        <FileText size={48} color="#cbd5e1" />
        <h3 style={{ margin: '12px 0 4px', fontSize: 16, color: '#64748b' }}>Belum Ada Raport</h3>
        <p style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada data raport untuk ditampilkan</p>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b' }}>📊 Smart Raport</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Laporan cerdas dengan analisis dan rekomendasi</p>
      </div>
      
      {/* Pilih Periode */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} /> Pilih Periode
        </label>
        <select 
          value={selectedPeriode}
          onChange={(e) => handlePeriodeChange(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 6 }}
        >
          {reports.map(r => (
            <option key={r.periode} value={r.periode}>{r.periode.replace('-', ' / ')}</option>
          ))}
        </select>
      </div>
      
      {currentReport && (
        <>
          {/* Kartu Nilai Utama */}
          <div style={{ background: 'white', borderRadius: 20, padding: 24, marginBottom: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Award size={32} color={getScoreColor(currentReport.nilai_akhir)} />
            <div style={{ fontSize: 48, fontWeight: 800, color: getScoreColor(currentReport.nilai_akhir), marginTop: 8 }}>
              {currentReport.nilai_akhir}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Nilai Akhir</div>
            
            {/* Narasi */}
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 16 }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{currentReport.narasi}</p>
            </div>
          </div>
          
          {/* Leaderboard */}
          {leaderboard && (
            <div style={{ marginBottom: 20 }}>
              <RelativeLeaderboard 
                leaderboardData={leaderboard} 
                studentId={studentId} 
                studentName={studentName} 
              />
            </div>
          )}
          
          {/* Detail Nilai per Komponen */}
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div 
              onClick={() => setShowDetail(!showDetail)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📋 Rincian Nilai</h3>
              {showDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {showDetail && (
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>📝 Kuis</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(currentReport.nilai_kuis) }}>{currentReport.nilai_kuis}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>📓 Catatan</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(currentReport.nilai_catatan) }}>{currentReport.nilai_catatan}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>📖 Ujian</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(currentReport.nilai_ujian) }}>{currentReport.nilai_ujian}</div>
                </div>
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 10 }}>
                  <div style={{ fontSize: 10, color: '#64748b' }}>⭐ Keaktifan</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: getScoreColor(currentReport.nilai_keaktifan) }}>{currentReport.nilai_keaktifan}</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Target & Rekomendasi */}
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: 20, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={20} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Target Bulan Depan</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, opacity: 0.95 }}>
              {currentReport.nilai_akhir < 75 
                ? `Fokus tingkatkan nilai dengan rutin mengerjakan kuis dan tugas catatan. Target: naik ke ${Math.min(100, currentReport.nilai_akhir + 10)}!` 
                : currentReport.nilai_akhir < 85
                ? `Pertahankan konsistensimu! Target bulan depan: mencapai nilai ${Math.min(100, currentReport.nilai_akhir + 5)}.`
                : `Luar biasa! Target kamu: pertahankan prestasi dan bantu teman yang kesulitan.`}
            </p>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentSmartReport;