import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';

const TeacherGradeManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    return stateGuru || (localGuru ? JSON.parse(localGuru) : null);
  });
  
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 1024 && window.innerWidth > 768);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMapel, setFilterMapel] = useState("Semua");

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth <= 1024 && window.innerWidth > 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchGrades = async () => {
    if (!guru?.id) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, "grades"), 
        where("teacherId", "==", guru.id),
        orderBy("tanggal", "desc")
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setGrades(data);
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!guru) { navigate('/login-guru'); return; }
    fetchGrades();
  }, [guru, navigate]);

  const handleDelete = async (id) => {
    if (!window.confirm("Hapus nilai ini? Tindakan ini tidak bisa dibatalkan.")) return;
    try {
      await deleteDoc(doc(db, "grades", id));
      alert("✅ Data nilai berhasil dihapus");
      fetchGrades();
    } catch (err) {
      alert("Gagal menghapus data.");
    }
  };

  // Filter data
  const filteredGrades = grades.filter(g => {
    const matchSearch = searchTerm === "" || 
      g.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.mapel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.topik?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchMapel = filterMapel === "Semua" || g.mapel === filterMapel;
    return matchSearch && matchMapel;
  });

  // Ambil daftar mapel unik untuk filter
  const uniqueMapel = ["Semua", ...new Set(grades.map(g => g.mapel).filter(Boolean))];

  const getScoreColor = (nilai) => {
    if (nilai >= 85) return '#10b981';
    if (nilai >= 70) return '#3b82f6';
    if (nilai >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <SidebarGuru />
      <div style={{ 
        marginLeft: isMobile ? '0' : '260px', 
        padding: isMobile ? '15px' : '20px', 
        width: isMobile ? '100%' : 'calc(100% - 260px)',
        boxSizing: 'border-box',
        transition: 'all 0.3s ease'
      }}>
        <div style={{ 
          maxWidth: '100%', 
          margin: '0 auto',
          overflowX: 'hidden'
        }}>
          
          {/* HEADER */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : '0',
            marginBottom: '20px'
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: isMobile ? '18px' : '22px', color: '#2c3e50' }}>📊 Riwayat Input Nilai</h2>
              <p style={{ margin: '5px 0 0', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Kelola dan tinjau kembali nilai rapor yang telah diinput.</p>
            </div>
            <button 
              onClick={() => navigate('/guru/grades/input')}
              style={{
                background: '#2c3e50',
                color: 'white',
                border: 'none',
                padding: isMobile ? '10px 16px' : '12px 20px',
                borderRadius: '10px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: isMobile ? '12px' : '14px',
                whiteSpace: 'nowrap'
              }}
            >
              + Input Nilai Baru
            </button>
          </div>

          {/* FILTER & SEARCH - Responsive */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '12px',
            alignItems: isMobile ? 'stretch' : 'center',
            flexWrap: 'wrap',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ flex: 2, minWidth: isMobile ? '100%' : '200px' }}>
              <input
                type="text"
                placeholder="🔍 Cari siswa, mapel, atau topik..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '150px' }}>
              <select
                value={filterMapel}
                onChange={(e) => setFilterMapel(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                {uniqueMapel.map(m => (
                  <option key={m} value={m}>{m === "Semua" ? "📋 Semua Mapel" : `📚 ${m}`}</option>
                ))}
              </select>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', padding: '0 8px' }}>
              📊 {filteredGrades.length} data ditemukan
            </div>
          </div>

          {/* TABLE CARD - Responsive dengan overflow auto */}
          <div style={{
            background: 'white',
            borderRadius: '15px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              minWidth: isMobile ? '600px' : 'auto'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Tanggal</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Siswa</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Mapel</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Topik</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Nilai</th>
                  <th style={{ padding: '12px 10px', textAlign: 'center', fontSize: isMobile ? '11px' : '13px', color: '#7f8c8d' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                      <div style={{ width: '30px', height: '30px', border: '3px solid #e2e8f0', borderTop: '3px solid #3498db', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }}></div>
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredGrades.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: '#95a5a6' }}>
                      📭 Belum ada data penilaian.
                    </td>
                  </tr>
                ) : (
                  filteredGrades.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #f4f7f6', transition: '0.2s' }}>
                      <td style={{ padding: '10px', fontSize: isMobile ? '11px' : '13px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 'bold' }}>{new Date(g.tanggal).toLocaleDateString('id-ID')}</div>
                        <div style={{ fontSize: '10px', color: '#95a5a6' }}>{new Date(g.tanggal).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td style={{ padding: '10px', fontSize: isMobile ? '12px' : '14px', verticalAlign: 'middle', fontWeight: 'bold', color: '#2c3e50' }}>
                        {g.studentName}
                      </td>
                      <td style={{ padding: '10px', fontSize: isMobile ? '11px' : '13px', verticalAlign: 'middle' }}>
                        <span style={{ background: '#eef2ff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }}>
                          {g.mapel}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: isMobile ? '11px' : '13px', verticalAlign: 'middle', maxWidth: '150px', wordBreak: 'break-word' }}>
                        {g.topik}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ 
                          background: getScoreColor(g.nilai),
                          color: 'white',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          fontWeight: 'bold',
                          display: 'inline-block',
                          minWidth: '40px',
                          textAlign: 'center',
                          fontSize: isMobile ? '12px' : '14px'
                        }}>
                          {g.nilai}
                        </div>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                          <button 
                            onClick={() => setSelectedDetail(g)} 
                            style={{
                              background: '#ebf5fb',
                              border: 'none',
                              color: '#2980b9',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            👁️ Detail
                          </button>
                          <button 
                            onClick={() => handleDelete(g.id)} 
                            style={{
                              background: '#fdedec',
                              border: 'none',
                              color: '#e74c3c',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 'bold'
                            }}
                          >
                            🗑️ Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* INFO RINGKASAN - Responsive */}
          {filteredGrades.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px',
              fontSize: isMobile ? '11px' : '12px',
              color: '#64748b'
            }}>
              <span>📊 Total Data: {filteredGrades.length}</span>
              <span>⭐ Rata-rata Nilai: {Math.round(filteredGrades.reduce((a,b) => a + b.nilai, 0) / filteredGrades.length)}</span>
              <span>📅 Terbaru: {new Date(filteredGrades[0]?.tanggal).toLocaleDateString('id-ID')}</span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETAIL - Responsive */}
      {selectedDetail && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            padding: isMobile ? '20px' : '30px',
            borderRadius: '20px',
            width: isMobile ? '95%' : '450px',
            maxWidth: '500px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 15px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: isMobile ? '16px' : '18px' }}>Detail Penilaian Karakter</h3>
              <button onClick={() => setSelectedDetail(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '20px' }}>✕</button>
            </div>
            
            <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
              <p style={{ margin: '5px 0', fontSize: isMobile ? '13px' : '14px' }}>Siswa: <b>{selectedDetail.studentName}</b></p>
              <p style={{ margin: '5px 0', fontSize: isMobile ? '13px' : '14px' }}>Mapel: <b>{selectedDetail.mapel}</b></p>
              <p style={{ margin: '5px 0', fontSize: isMobile ? '13px' : '14px' }}>Topik: <b>{selectedDetail.topik}</b></p>
              <p style={{ margin: '5px 0', fontSize: isMobile ? '13px' : '14px' }}>Nilai Akademik: <b style={{ color: '#27ae60' }}>{selectedDetail.nilai}</b></p>
            </div>
            
            <h4 style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '10px' }}>Aspek Karakter (1-5):</h4>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px' }}>
              {selectedDetail.qualitative && Object.entries(selectedDetail.qualitative).map(([key, val]) => (
                <div key={key} style={{
                  background: '#f8f9fa',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: isMobile ? '12px' : '13px',
                  border: '1px solid #eee'
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{key}</span>
                  <span style={{ fontWeight: 'bold', color: '#3498db' }}>{val}/5</span>
                </div>
              ))}
            </div>
          </div>
        </div>
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

export default TeacherGradeManager;