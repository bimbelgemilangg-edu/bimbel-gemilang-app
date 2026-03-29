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
  const [selectedDetail, setSelectedDetail] = useState(null); // Untuk modal detail

  const fetchGrades = async () => {
    if (!guru?.id) return;
    setLoading(true);
    try {
      // Menggunakan query terarah
      const q = query(
        collection(db, "grades"), 
        where("teacherId", "==", guru.id)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Sort manual berdasarkan tanggal (descending)
      data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      
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

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <SidebarGuru />
      <div style={{ marginLeft: '260px', padding: '30px', width: 'calc(100% - 250px)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
            <div>
                <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 Riwayat Input Nilai</h2>
                <p style={{ margin: 0, fontSize: 13, color: '#7f8c8d' }}>Kelola dan tinjau kembali nilai rapor yang telah diinput.</p>
            </div>
            <button 
              onClick={() => navigate('/guru/grades/input')}
              style={styles.btnAdd}
            >
              + Input Nilai Baru
            </button>
          </div>

          <div style={styles.tableCard}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                  <th style={styles.th}>Tanggal</th>
                  <th style={styles.th}>Nama Siswa</th>
                  <th style={styles.th}>Topik Materi</th>
                  <th style={styles.th}>Skor</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#95a5a6' }}>Memuat data...</td></tr>
                ) : grades.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#95a5a6' }}>Belum ada riwayat penilaian.</td></tr>
                ) : (
                  grades.map(g => (
                    <tr key={g.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={{fontSize:12, fontWeight:'bold'}}>{new Date(g.tanggal).toLocaleDateString('id-ID')}</div>
                        <div style={{fontSize:10, color:'#95a5a6'}}>{new Date(g.tanggal).toLocaleTimeString('id-ID')}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={{fontWeight:'bold', color:'#2c3e50'}}>{g.studentName}</div>
                        <div style={{fontSize:11, color:'#3498db'}}>{g.mapel}</div>
                      </td>
                      <td style={styles.td}>{g.topik}</td>
                      <td style={styles.td}>
                         <div style={{ 
                           background: g.nilai >= 75 ? '#eafaf1' : '#fdedec', 
                           color: g.nilai >= 75 ? '#27ae60' : '#e74c3c',
                           padding: '6px 10px', borderRadius: 8, fontWeight: 'bold', display: 'inline-block', minWidth: 30, textAlign: 'center'
                         }}>
                           {g.nilai}
                         </div>
                      </td>
                      <td style={styles.td}>
                        <div style={{display:'flex', gap:10}}>
                            <button onClick={() => setSelectedDetail(g)} style={styles.btnDetail}>👁️ Detail</button>
                            <button onClick={() => handleDelete(g.id)} style={styles.btnDelete}>🗑️ Hapus</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DETAIL NILAI & KARAKTER */}
      {selectedDetail && (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                    <h3 style={{margin:0}}>Detail Penilaian Karakter</h3>
                    <button onClick={() => setSelectedDetail(null)} style={{border:'none', background:'none', cursor:'pointer', fontSize:20}}>✕</button>
                </div>
                <div style={{background:'#f8f9fa', padding:15, borderRadius:10, marginBottom:20}}>
                    <p style={{margin:'5px 0'}}>Siswa: <b>{selectedDetail.studentName}</b></p>
                    <p style={{margin:'5px 0'}}>Materi: <b>{selectedDetail.topik}</b></p>
                    <p style={{margin:'5px 0'}}>Nilai Akademik: <b style={{color:'#27ae60'}}>{selectedDetail.nilai}</b></p>
                </div>
                
                <h4 style={{fontSize:14, color:'#7f8c8d'}}>Aspek Karakter (1-5):</h4>
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                    {selectedDetail.qualitative && Object.entries(selectedDetail.qualitative).map(([key, val]) => (
                        <div key={key} style={styles.badge}>
                            <span style={{textTransform:'capitalize'}}>{key}</span>
                            <span style={{fontWeight:'bold', color:'#3498db'}}>{val}/5</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  btnAdd: { background: '#2c3e50', color: 'white', border: 'none', padding: '12px 20px', borderRadius: 10, fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  tableCard: { background: 'white', borderRadius: 15, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' },
  th: { padding: '18px 15px', textAlign: 'left', fontSize: '13px', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '1px' },
  td: { padding: '15px', fontSize: '14px', verticalAlign: 'middle' },
  tr: { borderBottom: '1px solid #f4f7f6', transition: '0.2s' },
  btnDetail: { background: '#ebf5fb', border: 'none', color: '#2980b9', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' },
  btnDelete: { background: '#fdedec', border: 'none', color: '#e74c3c', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { background: 'white', padding: 30, borderRadius: 20, width: '450px', boxShadow: '0 15px 50px rgba(0,0,0,0.2)' },
  badge: { background: '#f8f9fa', padding: '10px 15px', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13, border: '1px solid #eee' }
};

export default TeacherGradeManager;