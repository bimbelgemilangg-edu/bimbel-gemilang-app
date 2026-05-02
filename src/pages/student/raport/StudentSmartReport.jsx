// src/pages/student/raport/StudentSmartReport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { RAPORT_COLLECTIONS } from '../../../firebase/raportCollection';
import { getRelativeLeaderboard, generateCharacterNarasi, generateDetailCharacterNarasi } from '../../../services/raportService';
import RelativeLeaderboard from '../../../components/raport/RelativeLeaderboard';
import WeightedScoreCalculator from '../../../components/raport/WeightedScoreCalculator';
import { FileText, TrendingUp, Award, Calendar, Target, ChevronDown, ChevronUp, Brain, Star, ArrowLeft } from 'lucide-react';

const StudentSmartReport = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [currentReport, setCurrentReport] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [characterData, setCharacterData] = useState(null);
  const [characterNarasi, setCharacterNarasi] = useState('');
  const [detailCharacterNarasi, setDetailCharacterNarasi] = useState([]);
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
        
        const lb = await getRelativeLeaderboard(data[0].periode, studentId);
        setLeaderboard(lb);
        
        await fetchCharacterData(data[0].periode);
      }
    } catch (error) {
      console.error("Error fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCharacterData = async (periode) => {
    try {
      const scoresQuery = query(
        collection(db, RAPORT_COLLECTIONS.SCORES),
        where("studentId", "==", studentId),
        where("periode", "==", periode)
      );
      const scoresSnap = await getDocs(scoresQuery);
      const allScores = scoresSnap.docs.map(d => d.data());
      
      const qualData = allScores.find(s => s.qualitative);
      if (qualData && qualData.qualitative) {
        setCharacterData(qualData.qualitative);
        setCharacterNarasi(generateCharacterNarasi(qualData.qualitative));
        setDetailCharacterNarasi(generateDetailCharacterNarasi(qualData.qualitative));
      } else {
        setCharacterData(null);
        setCharacterNarasi('');
        setDetailCharacterNarasi([]);
      }
    } catch (error) {
      console.error("Error fetch character data:", error);
    }
  };
  
  const handlePeriodeChange = async (periode) => {
    setSelectedPeriode(periode);
    const found = reports.find(r => r.periode === periode);
    setCurrentReport(found);
    const lb = await getRelativeLeaderboard(periode, studentId);
    setLeaderboard(lb);
    await fetchCharacterData(periode);
  };
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  const getStarColor = (nilai) => {
    if (nilai >= 4) return '#10b981';
    if (nilai >= 3) return '#f59e0b';
    if (nilai >= 2) return '#f97316';
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
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px' : '0' }}>
        {/* ➕ Tombol Kembali */}
        <button 
          onClick={() => navigate('/siswa/dashboard')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, background: 'white',
            border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b',
            marginBottom: 20
          }}
        >
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </button>
        
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
          <FileText size={48} color="#cbd5e1" />
          <h3 style={{ margin: '12px 0 4px', fontSize: 16, color: '#64748b' }}>Belum Ada Raport</h3>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Belum ada data raport untuk ditampilkan</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px' : '0' }}>
      {/* ➕ Tombol Kembali */}
      <button 
        onClick={() => navigate('/siswa/dashboard')}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, background: 'white',
          border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b',
          marginBottom: 20
        }}
      >
        <ArrowLeft size={14} /> Kembali ke Dashboard
      </button>
      
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 800, color: '#1e293b' }}>📊 Smart Raport</h2>
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
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 6, fontSize: 13 }}
        >
          {reports.map(r => (
            <option key={r.periode} value={r.periode}>{r.periode.replace('-', ' / ')}</option>
          ))}
        </select>
      </div>
      
      {currentReport && (
        <>
          {/* Kartu Nilai Utama */}
          <div style={{ background: 'white', borderRadius: 20, padding: isMobile ? 16 : 24, marginBottom: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Award size={isMobile ? 28 : 32} color={getScoreColor(currentReport.nilai_akhir)} />
            <div style={{ fontSize: isMobile ? 40 : 48, fontWeight: 800, color: getScoreColor(currentReport.nilai_akhir), marginTop: 8 }}>
              {currentReport.nilai_akhir}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>Nilai Akhir</div>
            
            {/* Info komponen yang dipakai */}
            {currentReport.komponen_dipakai && (
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
                {currentReport.komponen_dipakai.map(komp => (
                  <span key={komp} style={{
                    fontSize: 9,
                    background: '#eef2ff',
                    color: '#3b82f6',
                    padding: '2px 8px',
                    borderRadius: 10
                  }}>
                    {komp === 'kuis' ? '📝 Kuis' : 
                     komp === 'catatan' ? '📓 Tugas' : 
                     komp === 'ujian' ? '📖 Ujian' : '⭐ Keaktifan'}
                  </span>
                ))}
              </div>
            )}
            
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
          <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
            <div 
              onClick={() => setShowDetail(!showDetail)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
            >
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📋 Rincian Nilai</h3>
              {showDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
            
            {showDetail && (
              <div style={{ 
                marginTop: 16, 
                display: 'grid', 
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
                gap: 12 
              }}>
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
          
          {/* ➕ SECTION: KARAKTER & SIKAP */}
          {characterData && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div 
                onClick={() => setShowCharacterDetail(!showCharacterDetail)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              >
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Brain size={16} color="#8b5cf6" /> 🧠 Karakter & Sikap
                </h3>
                {showCharacterDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              
              <div style={{ 
                background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 100%)',
                padding: 14,
                borderRadius: 12,
                marginTop: 12,
                border: '1px solid #e9d5ff'
              }}>
                <p style={{ margin: 0, fontSize: 13, color: '#4c1d95', lineHeight: 1.6 }}>{characterNarasi}</p>
              </div>
              
              {showCharacterDetail && detailCharacterNarasi.length > 0 && (
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {detailCharacterNarasi.map((aspek, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 14,
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <div style={{
                        minWidth: 48,
                        height: 48,
                        borderRadius: 12,
                        background: aspek.nilai >= 4 ? '#dcfce7' : aspek.nilai >= 3 ? '#fef3c7' : '#fee2e2',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Star size={16} color={getStarColor(aspek.nilai)} fill={getStarColor(aspek.nilai)} />
                        <span style={{ fontSize: 11, fontWeight: 800, color: getStarColor(aspek.nilai) }}>{aspek.nilai}/5</span>
                      </div>
                      
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                          {aspek.label}
                        </div>
                        <p style={{ fontSize: 11, color: '#475569', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                          {aspek.narasi}
                        </p>
                        <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontStyle: 'italic' }}>
                          💡 {aspek.saran}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {!characterData && (
            <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0', marginBottom: 20, textAlign: 'center' }}>
              <Brain size={32} color="#cbd5e1" />
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Belum ada penilaian karakter untuk periode ini.</p>
              <p style={{ fontSize: 10, color: '#cbd5e1', margin: 0 }}>Guru belum menginput aspek pemahaman, aplikasi, literasi, inisiatif, dan kemandirian.</p>
            </div>
          )}
          
          {/* Target & Rekomendasi */}
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: isMobile ? 16 : 20, color: 'white' }}>
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