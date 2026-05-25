// src/pages/teacher/grades/GenerateRaport.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { syncAllScoresToRaport, exportToRaportScores } from '../../../services/raportService';
import { RAPORT_COLLECTIONS, KOMPONEN_LABEL, ATURAN_NILAI } from '../../../firebase/raportCollection';
import { ArrowLeft, RefreshCw, CheckCircle, AlertTriangle, Database, FileText, Send, Info } from 'lucide-react';

const GenerateRaport = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pendingExports, setPendingExports] = useState([]);
  const [selectedPeriode, setSelectedPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const teacherData = JSON.parse(localStorage.getItem('teacherData') || '{}');
  
  useEffect(() => {
    fetchPendingExports();
  }, []);
  
  const fetchPendingExports = async () => {
    try {
      const tugasSnap = await getDocs(query(collection(db, "jawaban_tugas")));
      const belumEksporTugas = tugasSnap.docs
        .map(d => ({ id: d.id, ...d.data(), source: 'tugas' }))
        .filter(t => t.score !== undefined && t.score !== null && !t.exportedToRaport)
        .slice(0, 10);
      
      const kuisSnap = await getDocs(query(collection(db, "jawaban_kuis")));
      const belumEksporKuis = kuisSnap.docs
        .map(d => ({ id: d.id, ...d.data(), source: 'kuis' }))
        .filter(q => q.score !== undefined && q.score !== null && !q.exportedToRaport)
        .slice(0, 10);
      
      setPendingExports([...belumEksporTugas, ...belumEksporKuis]);
    } catch (error) {
      console.error("Error fetch pending:", error);
    }
  };
  
  const handleExportSingle = async (item) => {
    setLoading(true);
    try {
      // Konversi ke 5 dimensi default
      const nilaiScore = item.score || 75;
      const defaultDimensi = {
        pemahaman: nilaiScore,
        analisis: Math.max(0, nilaiScore - 5),
        ketelitian: Math.max(0, nilaiScore - 10),
        waktu: Math.max(0, nilaiScore - 5),
        dayaTangkap: nilaiScore
      };
      
      const avgNilai = Math.round(
        Object.values(defaultDimensi).reduce((a, b) => a + b, 0) / 5 * 10
      ) / 10;
      
      const result = await exportToRaportScores({
        studentId: item.studentId || item.userId,
        studentName: item.studentName || item.userName,
        mapel: teacherData.mapel || "Umum",
        topik: item.modulTitle || item.quizTitle || 'Impor',
        nilai: avgNilai,
        komponen: item.source === 'kuis' ? 'kuis' : 'tugas',
        dimensi: defaultDimensi,
        teacherId: teacherData.id,
        teacherName: teacherData.nama
      });
      
      if (result.success) {
        // Tandai sebagai exported
        const colName = item.source === 'kuis' ? 'jawaban_kuis' : 'jawaban_tugas';
        try { await updateDoc(doc(db, colName, item.id), { exportedToRaport: true }); } catch (e) {}
        
        alert(`✅ Nilai ${item.studentName || item.userName} berhasil diekspor ke ${teacherData.mapel || 'Umum'}!`);
        fetchPendingExports();
      } else {
        alert(`❌ Gagal: ${result.error}`);
      }
    } catch (error) {
      alert("❌ Gagal: " + error.message);
    }
    setLoading(false);
  };
  
  const handleSyncAll = async () => {
    const mapel = teacherData.mapel || null;
    
    if (!window.confirm(
      `🚀 Generate raport untuk periode ${selectedPeriode}?\n\n` +
      `Mapel: ${mapel || 'Semua'}\n` +
      `Aturan Nilai:\n` +
      `• Ada Ujian → pakai nilai ujian\n` +
      `• Quiz + Tugas → rata-rata\n` +
      `• Lengkap → Quiz 30% + Tugas 30% + Ujian 40%\n\n` +
      `Minimal 1 komponen harus tersedia.`
    )) return;
    
    setLoading(true);
    setResult(null);
    
    try {
      const syncResult = await syncAllScoresToRaport(selectedPeriode, mapel);
      setResult(syncResult);
      
      const incompleteCount = syncResult.incomplete?.length || 0;
      
      if (incompleteCount > 0) {
        alert(`⚠️ ${incompleteCount} siswa belum memiliki data nilai untuk mapel ${mapel || 'ini'}.\n\n✅ ${syncResult.processed} siswa berhasil digenerate.`);
      } else {
        alert(`✅ Raport periode ${selectedPeriode} berhasil digenerate untuk ${syncResult.processed} siswa!\nMapel: ${mapel || 'Semua'}`);
      }
    } catch (error) {
      console.error(error);
      alert("❌ Gagal generate raport: " + error.message);
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 16px' }}>
      {/* TOMBOL KEMBALI */}
      <button 
        onClick={() => navigate('/guru/grades/manage')} 
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
        <ArrowLeft size={14} /> Kembali ke Manajemen Nilai
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={24} color="#3b82f6" /> Generate Raport Bulanan
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
          Sinkronkan semua nilai ke raport dengan 5 dimensi penilaian
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* ATURAN NILAI */}
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Info size={18} color="#0369a1" style={{ marginTop: 2 }} />
          <div style={{ fontSize: 12, color: '#0369a1', lineHeight: 1.6 }}>
            <b>📐 Aturan Nilai Akhir:</b><br/>
            ✅ <b>Ada Ujian</b> → Nilai Ujian langsung dipakai<br/>
            ✅ <b>Quiz + Tugas</b> (belum ujian) → Rata-rata (Quiz+Tugas)/2<br/>
            ✅ <b>Lengkap</b> (Quiz+Tugas+Ujian) → Quiz 30% + Tugas 30% + Ujian 40%<br/>
            ✅ <b>Hanya 1 komponen</b> → Tetap digenerate dengan nilai yang ada
          </div>
        </div>

        {/* INFO MAPEL GURU */}
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <Info size={18} color="#b45309" style={{ marginTop: 2 }} />
          <div style={{ fontSize: 12, color: '#b45309', lineHeight: 1.6 }}>
            <b>👨‍🏫 Mapel Anda:</b> {teacherData.mapel || 'Umum'}<br/>
            Raport akan digenerate <b>khusus mapel Anda</b>. Setiap guru generate raport untuk mapelnya masing-masing.
          </div>
        </div>
        
        {/* PENDING EXPORTS */}
        {pendingExports.length > 0 && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Send size={16} color="#f59e0b" /> Nilai Siap Ekspor ({pendingExports.length})
            </h3>
            <p style={{ fontSize: 10, color: '#64748b', marginBottom: 12 }}>
              Nilai dari tugas/kuis yang belum diekspor ke raport. Klik ekspor untuk memasukkannya.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingExports.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 10, background: '#f8fafc', borderRadius: 10 }}>
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
                    <div style={{ fontSize: 10, color: '#64748b' }}>{item.modulTitle || item.quizTitle} • Nilai: {item.score}</div>
                  </div>
                  <button 
                    onClick={() => handleExportSingle(item)}
                    disabled={loading}
                    style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
                  >
                    📊 Ekspor
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Form Generate */}
        <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <FileText size={16} color="#3b82f6" /> Pengaturan Generate
          </h3>
          
          <div style={{ 
            background: '#f0f9ff', 
            padding: 12, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid #bae6fd',
            fontSize: 11,
            color: '#0369a1'
          }}>
            ⚠️ <b>Ketentuan:</b> Nilai dihitung dari <b>5 Dimensi</b> (Pemahaman, Analisis, Ketelitian, Waktu, Daya Tangkap). Siswa tanpa data nilai akan dilewati.
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', display: 'block', marginBottom: 6 }}>Periode Raport</label>
            <input 
              type="month" 
              value={selectedPeriode}
              onChange={(e) => setSelectedPeriode(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
            />
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
            {loading ? 'Memproses...' : `🚀 Generate Raport ${teacherData.mapel || 'Umum'} Sekarang`}
          </button>
        </div>

        {/* Hasil */}
        {result && (
          <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>📊 Hasil Sinkronisasi</h4>
            
            {result.error ? (
              <div style={{ background: '#fee2e2', padding: 16, borderRadius: 12, color: '#ef4444', fontSize: 13 }}>
                ❌ Error: {result.error}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: '#dcfce7', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <CheckCircle size={20} color="#10b981" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#166534' }}>{result.processed}</div>
                    <div style={{ fontSize: 10, color: '#166534' }}>Siswa Tergenerate</div>
                  </div>
                  <div style={{ flex: 1, background: '#fef3c7', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <AlertTriangle size={20} color="#f59e0b" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#b45309' }}>{result.incomplete?.length || 0}</div>
                    <div style={{ fontSize: 10, color: '#b45309' }}>Belum Ada Data</div>
                  </div>
                  <div style={{ flex: 1, background: '#eef2ff', padding: 12, borderRadius: 10, textAlign: 'center' }}>
                    <Database size={20} color="#3b82f6" style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e40af' }}>{result.totalStudents || 0}</div>
                    <div style={{ fontSize: 10, color: '#1e40af' }}>Total Siswa</div>
                  </div>
                </div>
                
                {result.incomplete?.length > 0 && (
                  <div style={{ background: '#fffbeb', padding: 12, borderRadius: 10, maxHeight: 200, overflowY: 'auto' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#b45309', margin: '0 0 8px' }}>
                      ⚠️ Siswa tanpa data nilai (belum ada input sama sekali):
                    </p>
                    {result.incomplete.slice(0, 10).map(s => (
                      <div key={s.id} style={{ fontSize: 10, color: '#92400e', marginBottom: 4, display: 'flex', justifyContent: 'space-between' }}>
                        <span>{s.name}</span>
                        <span style={{ fontSize: 9 }}>
                          {s.missing?.kuis && '❌Kuis '} 
                          {s.missing?.tugas && '❌Tugas '} 
                          {s.missing?.ujian && '❌Ujian '}
                        </span>
                      </div>
                    ))}
                    {result.incomplete.length > 10 && (
                      <div style={{ fontSize: 10, color: '#92400e', marginTop: 4 }}>...dan {result.incomplete.length - 10} lainnya</div>
                    )}
                  </div>
                )}
                
                {result.results?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#166534', margin: '0 0 8px' }}>
                      ✅ Siswa Berhasil Digenerate ({result.results.length}):
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {result.results.slice(0, 15).map(s => (
                        <span key={s.studentId} style={{ 
                          background: '#dcfce7', 
                          padding: '4px 10px', 
                          borderRadius: 12, 
                          fontSize: 10, 
                          color: '#166534',
                          fontWeight: 600
                        }}>
                          {s.name}: {s.nilai} ({s.mode || s.komponenDipake?.join('+')})
                        </span>
                      ))}
                    </div>
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

export default GenerateRaport;