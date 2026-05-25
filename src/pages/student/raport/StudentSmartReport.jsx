// src/pages/student/raport/StudentSmartReport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { RAPORT_COLLECTIONS, DIMENSI_CONFIG, DIMENSI_KEYS } from '../../../firebase/raportCollection';
import { getRelativeLeaderboard, getRankingGabungan } from '../../../services/raportService';
import RelativeLeaderboard from '../../../components/raport/RelativeLeaderboard';
import { 
  FileText, Award, Calendar, Target, ChevronDown, ChevronUp, 
  Brain, Lightbulb, Clock, Zap, Trophy, ArrowLeft, Star, MessageSquare 
} from 'lucide-react';

const StudentSmartReport = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState(null);
  const [selectedMapel, setSelectedMapel] = useState('Semua');
  const [availableMapel, setAvailableMapel] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);
  const [allMapelReports, setAllMapelReports] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [rankingGabungan, setRankingGabungan] = useState(null);
  const [showDimensiDetail, setShowDimensiDetail] = useState(false);
  const [showAllMapel, setShowAllMapel] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  
  // Ikon untuk tiap dimensi
  const dimensiIcons = {
    pemahaman: <Brain size={16} />,
    analisis: <Lightbulb size={16} />,
    ketelitian: <Target size={16} />,
    waktu: <Clock size={16} />,
    dayaTangkap: <Zap size={16} />
  };
  
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
      
      // Ambil daftar mapel unik
      const mapelList = [...new Set(data.map(r => r.mapel).filter(Boolean))];
      setAvailableMapel(mapelList);
      
      if (data.length > 0) {
        // Ambil periode terbaru
        const latestPeriode = data[0].periode;
        setSelectedPeriode(latestPeriode);
        setSelectedMapel('Semua');
        
        // Ambil semua mapel untuk periode terbaru
        const latestReports = data.filter(r => r.periode === latestPeriode);
        setAllMapelReports(latestReports);
        
        // Hitung rata-rata gabungan
        if (latestReports.length > 0) {
          const avgNilai = Math.round(
            latestReports.reduce((sum, r) => sum + (r.nilai_akhir || 0), 0) / latestReports.length * 10
          ) / 10;
          
          setCurrentReport({
            periode: latestPeriode,
            nilai_akhir: avgNilai,
            mode_perhitungan: `Gabungan ${latestReports.length} Mapel`,
            mapelCount: latestReports.length,
            allReports: latestReports
          });
        }
        
        // Ambil ranking gabungan
        const ranking = await getRankingGabungan(latestPeriode);
        setRankingGabungan(ranking);
        
        // Ambil leaderboard
        const lb = await getRelativeLeaderboard(latestPeriode, studentId);
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
    
    const periodeReports = reports.filter(r => r.periode === periode);
    setAllMapelReports(periodeReports);
    
    if (periodeReports.length > 0) {
      const avgNilai = Math.round(
        periodeReports.reduce((sum, r) => sum + (r.nilai_akhir || 0), 0) / periodeReports.length * 10
      ) / 10;
      
      setCurrentReport({
        periode: periode,
        nilai_akhir: avgNilai,
        mode_perhitungan: `Gabungan ${periodeReports.length} Mapel`,
        mapelCount: periodeReports.length,
        allReports: periodeReports
      });
    }
    
    const ranking = await getRankingGabungan(periode);
    setRankingGabungan(ranking);
    
    const lb = await getRelativeLeaderboard(periode, studentId);
    setLeaderboard(lb);
  };
  
  const handleMapelChange = async (mapel) => {
    setSelectedMapel(mapel);
    
    if (mapel === 'Semua') {
      const periodeReports = reports.filter(r => r.periode === selectedPeriode);
      const avgNilai = periodeReports.length > 0 
        ? Math.round(periodeReports.reduce((sum, r) => sum + (r.nilai_akhir || 0), 0) / periodeReports.length * 10) / 10
        : 0;
      
      setCurrentReport({
        periode: selectedPeriode,
        nilai_akhir: avgNilai,
        mode_perhitungan: `Gabungan ${periodeReports.length} Mapel`,
        mapelCount: periodeReports.length,
        allReports: periodeReports
      });
      
      const ranking = await getRankingGabungan(selectedPeriode);
      setRankingGabungan(ranking);
    } else {
      const mapelReport = reports.find(r => r.periode === selectedPeriode && r.mapel === mapel);
      setCurrentReport(mapelReport || null);
      
      const lb = await getRelativeLeaderboard(selectedPeriode, studentId, mapel);
      setLeaderboard(lb);
    }
  };
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  const getDimensiColor = (nilai) => {
    if (nilai >= 85) return '#10b981';
    if (nilai >= 70) return '#3b82f6';
    if (nilai >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  // Cari ranking siswa
  const studentRank = rankingGabungan?.find(r => r.studentId === studentId);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: 13, color: '#64748b' }}>Memuat laporan...</p>
        </div>
      </div>
    );
  }
  
  if (reports.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px' : '0' }}>
        <button onClick={() => navigate('/siswa/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white',
            border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8,
            cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Kembali ke Dashboard
        </button>
        
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 16 }}>
          <FileText size={48} color="#cbd5e1" />
          <h3 style={{ margin: '12px 0 4px', fontSize: 16, color: '#64748b' }}>Belum Ada Raport</h3>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Raport akan muncul setelah guru menginput nilai dan melakukan generate.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px' : '0' }}>
      {/* Tombol Kembali */}
      <button onClick={() => navigate('/siswa/dashboard')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'white',
          border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8,
          cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 20 }}>
        <ArrowLeft size={14} /> Kembali ke Dashboard
      </button>
      
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: isMobile ? 18 : 20, fontWeight: 800, color: '#1e293b' }}>📊 Raport 5 Dimensi</h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          Laporan penilaian berdasarkan Pemahaman, Analisis, Ketelitian, Waktu, & Daya Tangkap
        </p>
      </div>
      
      {/* Pilih Periode & Mapel */}
      <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', gap: 12, flexDirection: isMobile ? 'column' : 'row' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Calendar size={12} /> Periode
            </label>
            <select 
              value={selectedPeriode || ''}
              onChange={(e) => handlePeriodeChange(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 6, fontSize: 13 }}>
              {reports.map(r => (
                <option key={r.periode} value={r.periode}>{r.periode.replace('-', ' / ')}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
              📚 Mapel
            </label>
            <select 
              value={selectedMapel}
              onChange={(e) => handleMapelChange(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 6, fontSize: 13 }}>
              <option value="Semua">📊 Semua Mapel (Gabungan)</option>
              {availableMapel.map(m => (
                <option key={m} value={m}>📖 {m}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {currentReport && (
        <>
          {/* Kartu Nilai Utama */}
          <div style={{ background: 'white', borderRadius: 20, padding: isMobile ? 16 : 24, marginBottom: 20, border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <Award size={isMobile ? 28 : 32} color={getScoreColor(currentReport.nilai_akhir)} />
            <div style={{ fontSize: isMobile ? 40 : 48, fontWeight: 800, color: getScoreColor(currentReport.nilai_akhir), marginTop: 8 }}>
              {currentReport.nilai_akhir}
            </div>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Nilai {selectedMapel === 'Semua' ? `Gabungan (${currentReport.mapelCount || allMapelReports.length} Mapel)` : selectedMapel}
            </div>
            
            {/* Mode Perhitungan */}
            {currentReport.mode_perhitungan && (
              <div style={{ marginTop: 6, fontSize: 10, color: '#94a3b8' }}>
                Mode: {currentReport.mode_perhitungan}
              </div>
            )}
            
            {/* Narasi */}
            {currentReport.narasi && (
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, marginTop: 16 }}>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5 }}>{currentReport.narasi}</p>
              </div>
            )}
          </div>
          
          {/* RANKING */}
          {studentRank && (
            <div style={{ background: 'white', borderRadius: 16, padding: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Trophy size={24} color="#f59e0b" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>
                    Peringkat #{studentRank.rank} dari {rankingGabungan.length} Siswa
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    Rata-rata {studentRank.mapelCount} mapel: {studentRank.totalNilai}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* DAFTAR NILAI PER MAPEL */}
          {selectedMapel === 'Semua' && allMapelReports.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div onClick={() => setShowAllMapel(!showAllMapel)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>📚 Nilai Per Mapel ({allMapelReports.length})</h3>
                {showAllMapel ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              
              {showAllMapel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {allMapelReports.map(r => (
                    <div key={r.id || r.mapel} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{r.mapel}</div>
                        <div style={{ fontSize: 9, color: '#64748b' }}>{r.mode_perhitungan || 'N/A'}</div>
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: getScoreColor(r.nilai_akhir) }}>
                        {r.nilai_akhir}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* 5 DIMENSI (hanya jika pilih mapel spesifik) */}
          {selectedMapel !== 'Semua' && currentReport?.detail_dimensi && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div onClick={() => setShowDimensiDetail(!showDimensiDetail)}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>🧠 5 Dimensi Penilaian</h3>
                {showDimensiDetail ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
              
              {showDimensiDetail && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                  {DIMENSI_KEYS.map(key => {
                    const nilai = currentReport.detail_dimensi?.[key] || 0;
                    const config = DIMENSI_CONFIG[key];
                    return (
                      <div key={key} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: 12, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0'
                      }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 10,
                          background: nilai >= 70 ? '#dcfce7' : nilai >= 50 ? '#fef3c7' : '#fee2e2',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: getDimensiColor(nilai)
                        }}>
                          {dimensiIcons[key]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b' }}>{config.label}</div>
                          <div style={{ fontSize: 9, color: '#64748b' }}>{config.indikator}</div>
                          {/* Progress bar */}
                          <div style={{ 
                            height: 6, borderRadius: 3, background: '#e2e8f0', marginTop: 6,
                            overflow: 'hidden'
                          }}>
                            <div style={{ 
                              height: '100%', width: `${nilai}%`, borderRadius: 3,
                              background: getDimensiColor(nilai),
                              transition: 'width 0.5s ease'
                            }} />
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 16, color: getDimensiColor(nilai), minWidth: 35, textAlign: 'center' }}>
                          {nilai}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* NARASI PER DIMENSI (hanya jika pilih mapel spesifik) */}
          {selectedMapel !== 'Semua' && currentReport?.dimensi_narasi && currentReport.dimensi_narasi.length > 0 && (
            <div style={{ background: 'white', borderRadius: 16, padding: isMobile ? 14 : 20, border: '1px solid #e2e8f0', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700 }}>📝 Analisis Per Dimensi</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {currentReport.dimensi_narasi.map((item, idx) => (
                  <div key={idx} style={{
                    padding: 14, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: '#1e293b' }}>{item.label}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color: getDimensiColor(item.nilai) }}>{item.nilai}</span>
                    </div>
                    <p style={{ fontSize: 11, color: '#475569', margin: '0 0 4px 0', lineHeight: 1.4 }}>{item.narasiSingkat}</p>
                    <p style={{ fontSize: 10, color: '#64748b', margin: 0, fontStyle: 'italic' }}>💡 {item.saran}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* CATATAN GURU */}
          {selectedMapel !== 'Semua' && currentReport?.catatan_guru && (
            <div style={{ background: '#fffbeb', borderRadius: 16, padding: 16, border: '1px solid #fde68a', marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#b45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MessageSquare size={16} /> Catatan Guru
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: '#92400e', lineHeight: 1.5, fontStyle: 'italic' }}>
                "{currentReport.catatan_guru}"
              </p>
            </div>
          )}
          
          {/* Leaderboard */}
          {leaderboard && selectedMapel !== 'Semua' && (
            <div style={{ marginBottom: 20 }}>
              <RelativeLeaderboard 
                leaderboardData={leaderboard} 
                studentId={studentId} 
                studentName={studentName} 
              />
            </div>
          )}
          
          {/* Target Bulan Depan */}
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: 16, padding: isMobile ? 16 : 20, color: 'white' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Target size={20} />
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>Target & Rekomendasi</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, opacity: 0.95 }}>
              {currentReport.nilai_akhir < 50 
                ? `Fokus tingkatkan pemahaman konsep dasar. Ikuti bimbingan tambahan dan perbanyak latihan soal. Target: naik ke ${Math.min(100, currentReport.nilai_akhir + 15)}!` 
                : currentReport.nilai_akhir < 70
                ? `Tingkatkan latihan soal variatif dan manajemen waktu. Target bulan depan: mencapai nilai ${Math.min(100, currentReport.nilai_akhir + 10)}.`
                : currentReport.nilai_akhir < 85
                ? `Pertahankan konsistensi! Coba soal-soal HOTS untuk tantangan. Target: ${Math.min(100, currentReport.nilai_akhir + 5)}.`
                : `🌟 Luar biasa! Pertahankan prestasi dan bantu teman yang kesulitan. Kamu bisa jadi tutor sebaya!`}
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