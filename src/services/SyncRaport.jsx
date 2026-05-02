// src/services/SyncRaport.jsx
// Komponen reusable untuk generate raport bulanan
// Dipakai oleh: GenerateRaport.jsx (guru) & AdminBulkRaport.jsx (admin)

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { syncAllScoresToRaport, exportToRaportScores } from './raportService';
import { RAPORT_COLLECTIONS } from '../firebase/raportCollection';
import { 
  ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, 
  Database, FileText, Send, Users 
} from 'lucide-react';

const SyncRaport = ({ role = 'guru' }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingExports, setPendingExports] = useState([]);
  const [stats, setStats] = useState({ totalStudents: 0, hasData: 0, noData: 0 });
  const [selectedPeriode, setSelectedPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Ambil data guru dari localStorage (hanya untuk role guru)
  const teacherData = role === 'guru' 
    ? JSON.parse(localStorage.getItem('teacherData') || '{}')
    : null;
  
  const isAdmin = role === 'admin';
  const backPath = isAdmin ? '/admin/grades' : '/guru/grades/manage';
  
  useEffect(() => {
    fetchPendingExports();
    fetchStats();
  }, [selectedPeriode]);
  
  // Ambil nilai dari tugas/kuis yang belum diekspor ke raport_scores
  const fetchPendingExports = async () => {
    try {
      // Tugas yang sudah dinilai tapi belum diekspor
      let tugasQuery = query(
        collection(db, "jawaban_tugas"),
        where("score", "!=", null)
      );
      // Untuk guru, filter by teacherId jika ada
      if (!isAdmin && teacherData?.id) {
        tugasQuery = query(
          collection(db, "jawaban_tugas"),
          where("score", "!=", null),
          where("teacherId", "==", teacherData.id)
        );
      }
      
      const tugasSnap = await getDocs(tugasQuery);
      const belumEkspor = tugasSnap.docs
        .map(d => ({ id: d.id, ...d.data(), source: 'tugas' }))
        .filter(t => !t.exportedToRaport)
        .slice(0, 20);
      
      // Kuis yang sudah auto-score tapi belum diekspor
      let quizQuery = query(
        collection(db, "jawaban_kuis"),
        where("score", "!=", null)
      );
      
      const quizSnap = await getDocs(quizQuery);
      const belumEksporQuiz = quizSnap.docs
        .map(d => ({ id: d.id, ...d.data(), source: 'kuis' }))
        .filter(q => !q.exportedToRaport)
        .slice(0, 20);
      
      setPendingExports([...belumEkspor, ...belumEksporQuiz]);
    } catch (error) {
      console.error("Error fetching pending exports:", error);
    }
  };
  
  // Statistik siswa yang sudah/belum punya raport
  const fetchStats = async () => {
    try {
      let studentsQuery = collection(db, "students");
      
      // Untuk guru, hanya tampilkan statistik siswa yang dia ajar
      // (Kita tetap hitung semua dulu, nanti di syncAllScoresToRaport juga semua)
      const studentsSnap = await getDocs(studentsQuery);
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
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  
  // Ekspor satu nilai dari tugas/kuis ke raport_scores
  const handleExportSingle = async (item) => {
    setLoading(true);
    try {
      const result = await exportToRaportScores({
        studentId: item.studentId || item.userId,
        studentName: item.studentName || item.userName,
        mapel: item.modulTitle?.split(' ')[0] || item.mapel || "Umum",
        topik: item.modulTitle || item.quizTitle || item.topik,
        nilai: item.score,
        komponen: item.source === 'kuis' ? 'kuis' : 'catatan',
        teacherId: teacherData?.id || item.teacherId || '',
        teacherName: teacherData?.nama || item.teacherName || ''
      });
      
      if (result.success) {
        alert(`✅ Nilai ${item.studentName || item.userName} berhasil diekspor ke raport_scores!`);
        fetchPendingExports();
        fetchStats();
      } else {
        alert(`❌ Gagal: ${result.error}`);
      }
    } catch (error) {
      alert("❌ Gagal: " + error.message);
    }
    setLoading(false);
  };
  
  // Generate raport untuk semua siswa
  const handleSyncAll = async () => {
    const confirmMsg = isAdmin
      ? `Generate raport untuk SEMUA SISWA periode ${selectedPeriode}?\n\nMinimal 2 komponen nilai harus tersedia per siswa.\nSiswa dengan data kurang akan dilewati.`
      : `Generate raport untuk periode ${selectedPeriode}?\n\nPastikan nilai komponen (kuis, catatan, ujian, keaktifan) sudah diinput.\nMinimal 2 komponen diperlukan.`;
    
    if (!window.confirm(confirmMsg)) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const syncResult = await syncAllScoresToRaport(
        selectedPeriode, 
        !isAdmin ? teacherData?.id : null
      );
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
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* TOMBOL KEMBALI */}
      <button 
        onClick={() => navigate(backPath)} 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'white',
          border: '1px solid #e2e8f0',
          padding: '8px 16px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '600',
          color: '#64748b',
          marginBottom: '20px'
        }}
      >
        <ArrowLeft size={14} /> Kembali
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={24} color="#3b82f6" /> 
          {isAdmin ? 'Bulk Generate Raport' : 'Generate Raport Bulanan'}
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          {isAdmin 
            ? 'Generate raport untuk SEMUA siswa sekaligus. Minimal 2 komponen nilai harus tersedia.' 
            : 'Sinkronkan semua nilai kuis, catatan, ujian, dan keaktifan ke raport. Minimal 2 komponen diperlukan.'}
        </p>
        {!isAdmin && teacherData?.nama && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={14} color="#64748b" />
            <span style={{ fontSize: 11, color: '#64748b' }}>Guru: <b>{teacherData.nama}</b></span>
            {teacherData.mapel && (
              <span style={{ fontSize: 10, background: '#eef2ff', color: '#3b82f6', padding: '2px 8px', borderRadius: 10 }}>{teacherData.mapel}</span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* PENDING EXPORTS - Nilai dari tugas/kuis yang siap diimpor */}
        {pendingExports.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={16} color="#f59e0b" /> Nilai Siap Diekspor ke Raport ({pendingExports.length})
            </h3>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>
              Nilai dari tugas & kuis yang sudah discore tapi belum masuk ke sistem raport. Klik "Ekspor" untuk memasukkannya.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 250, overflowY: 'auto' }}>
              {pendingExports.map(item => (
                <div key={item.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: 12, 
                  background: '#f8fafc', 
                  borderRadius: 10,
                  flexWrap: 'wrap',
                  gap: 8
                }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {item.studentName || item.userName}
                      <span style={{ 
                        fontSize: 9, 
                        marginLeft: 6, 
                        background: item.source === 'kuis' ? '#ede9fe' : '#dcfce7', 
                        color: item.source === 'kuis' ? '#7c3aed' : '#166534',
                        padding: '2px 6px', 
                        borderRadius: 6 
                      }}>
                        {item.source === 'kuis' ? 'Kuis' : 'Tugas'}
                      </span>
                    </div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>
                      {item.modulTitle || item.quizTitle || item.topik} • Nilai: <b>{item.score}</b>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleExportSingle(item)}
                    disabled={loading}
                    style={{ 
                      background: '#f59e0b', 
                      color: 'white', 
                      border: 'none', 
                      padding: '8px 14px', 
                      borderRadius: 8, 
                      fontSize: 11, 
                      fontWeight: 'bold',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    📥 Ekspor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Statistik */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} color="#3b82f6" /> Statistik Periode {selectedPeriode}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 100, background: '#f8fafc', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#1e293b' }}>{stats.totalStudents}</div>
              <div style={{ fontSize: 10, color: '#64748b' }}>Total Siswa</div>
            </div>
            <div style={{ flex: 1, minWidth: 100, background: '#dcfce7', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{stats.hasData}</div>
              <div style={{ fontSize: 10, color: '#166534' }}>Sudah Punya Raport</div>
            </div>
            <div style={{ flex: 1, minWidth: 100, background: '#fef3c7', padding: 16, borderRadius: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309' }}>{stats.noData}</div>
              <div style={{ fontSize: 10, color: '#b45309' }}>Belum Punya Raport</div>
            </div>
          </div>
        </div>

        {/* Form Generate */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} color="#3b82f6" /> Pengaturan Generate
          </h3>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>
              Periode Raport
            </label>
            <input 
              type="month" 
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 12px', 
                borderRadius: 8, 
                border: '1px solid #e2e8f0', 
                fontSize: 13,
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: 9, color: '#94a3b8', marginTop: 4 }}>
              Pilih bulan yang ingin digenerate raportnya
            </p>
          </div>
          
          <div style={{ 
            background: '#f8fafc', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
              ⚠️ <b>Ketentuan Generate Raport:</b><br/>
              • Minimal <b>2 komponen nilai</b> harus tersedia (kuis, catatan, ujian, atau keaktifan)<br/>
              • Bobot dihitung <b>otomatis proporsional</b> berdasarkan komponen yang ada<br/>
              • Siswa dengan data kurang dari 2 komponen akan <b>dilewati</b> dan ditampilkan di hasil
            </p>
          </div>
          
          <button 
            onClick={handleSyncAll} 
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#cbd5e1' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            {loading 
              ? 'Memproses...' 
              : isAdmin 
                ? '🚀 Generate Raport SEMUA SISWA' 
                : '🚀 Generate Raport Sekarang'}
          </button>
        </div>

        {/* Hasil Sinkronisasi */}
        {result && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>📊 Hasil Sinkronisasi</h4>
            
            {result.error ? (
              <div style={{ background: '#fee2e2', padding: 16, borderRadius: 12, color: '#ef4444', fontSize: 13 }}>
                ❌ Error: {result.error}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 120, background: '#dcfce7', padding: 16, borderRadius: 10, textAlign: 'center' }}>
                    <CheckCircle size={24} color="#10b981" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#166534' }}>{result.processed}</div>
                    <div style={{ fontSize: 10, color: '#166534' }}>Siswa Berhasil</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 120, background: '#fef3c7', padding: 16, borderRadius: 10, textAlign: 'center' }}>
                    <AlertTriangle size={24} color="#f59e0b" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#b45309' }}>{result.incomplete?.length || 0}</div>
                    <div style={{ fontSize: 10, color: '#b45309' }}>Data Kurang</div>
                  </div>
                </div>
                
                {/* Daftar siswa yang berhasil */}
                {result.results?.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>
                      ✅ Siswa yang berhasil digenerate:
                    </p>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {result.results.map((s, i) => (
                        <div key={s.studentId} style={{ 
                          fontSize: 10, 
                          color: '#166534', 
                          marginBottom: 3,
                          display: 'flex',
                          justifyContent: 'space-between',
                          background: i % 2 === 0 ? '#f8fafc' : 'white',
                          padding: '4px 8px',
                          borderRadius: 4
                        }}>
                          <span>{s.name}</span>
                          <span style={{ fontWeight: 'bold' }}>
                            Nilai: {s.nilai} 
                            {s.komponenDipake && (
                              <span style={{ fontSize: 8, color: '#64748b', marginLeft: 4 }}>
                                ({s.komponenDipake.length} komp)
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Daftar siswa yang datanya tidak lengkap */}
                {result.incomplete?.length > 0 && (
                  <div style={{ background: '#fffbeb', padding: 12, borderRadius: 10, maxHeight: 250, overflowY: 'auto' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', margin: '0 0 8px' }}>
                      ⚠️ Siswa dengan data kurang (minimal 2 komponen):
                    </p>
                    {result.incomplete.slice(0, 20).map(s => (
                      <div key={s.id} style={{ 
                        fontSize: 10, 
                        color: '#92400e', 
                        marginBottom: 6, 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 4,
                        padding: '6px 8px',
                        background: 'white',
                        borderRadius: 6,
                        border: '1px solid #fde68a'
                      }}>
                        <span style={{ fontWeight: 'bold' }}>{s.name}</span>
                        <span style={{ fontSize: 9, color: '#d97706' }}>
                          Ada: {s.totalKomponen || 0}/4 komponen
                          {s.missing && (
                            <span style={{ marginLeft: 4 }}>
                              {s.missing.kuis && '❌Kuis '} 
                              {s.missing.catatan && '❌Catatan '} 
                              {s.missing.ujian && '❌Ujian '} 
                              {s.missing.keaktifan && '❌Keaktifan'}
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                    {result.incomplete.length > 20 && (
                      <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>
                        ...dan {result.incomplete.length - 20} lainnya
                      </div>
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

export default SyncRaport;