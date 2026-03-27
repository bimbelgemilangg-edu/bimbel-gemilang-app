import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; // <--- FIXED: Menggunakan ../../../
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru'; // <--- FIXED: Menggunakan ../../../

const TeacherGradeManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [guru] = useState(location.state?.teacher || JSON.parse(localStorage.getItem('teacherData')));
  
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGrades = async () => {
    if (!guru) return;
    setLoading(true);
    try {
      const q = query(collection(db, "grades"), where("teacherId", "==", guru.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Urutkan berdasarkan tanggal terbaru
      data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setGrades(data);
    } catch (err) {
      console.error(err);
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
      alert("Nilai berhasil dihapus");
      fetchGrades();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <SidebarGuru />
      <div style={{ marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0, color: '#2c3e50' }}>📊 Kelola Nilai Siswa</h2>
            <button 
              onClick={() => navigate('/guru/grades/input', { state: { teacher: guru } })}
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
                  <th style={styles.th}>Materi</th>
                  <th style={styles.th}>Nilai</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Memuat data...</td></tr>
                ) : grades.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 20 }}>Belum ada data nilai.</td></tr>
                ) : (
                  grades.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={styles.td}>{new Date(g.tanggal).toLocaleDateString('id-ID')}</td>
                      <td style={styles.td}><strong>{g.studentName}</strong></td>
                      <td style={styles.td}>{g.topik}</td>
                      <td style={styles.td}>
                         <span style={{ 
                           background: g.nilai >= 75 ? '#e8f5e9' : '#ffebee', 
                           color: g.nilai >= 75 ? '#2e7d32' : '#c62828',
                           padding: '4px 8px', borderRadius: 4, fontWeight: 'bold'
                         }}>
                           {g.nilai}
                         </span>
                      </td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => handleDelete(g.id)}
                          style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: 12 }}
                        >
                          🗑️ Hapus
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  btnAdd: { background: '#3498db', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' },
  tableCard: { background: 'white', borderRadius: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.05)', overflow: 'hidden' },
  th: { padding: 15, textAlign: 'left', fontSize: 14, color: '#7f8c8d' },
  td: { padding: 15, fontSize: 14 }
};

export default TeacherGradeManager;