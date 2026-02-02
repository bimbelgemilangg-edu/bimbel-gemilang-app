import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

const StudentList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // LOAD DATA SISWA
  const fetchStudents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "students"));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // DELETE SISWA
  const handleDelete = async (id) => {
    if(window.confirm("Yakin hapus siswa ini? Data keuangan & absen akan hilang!")) {
      await deleteDoc(doc(db, "students", id));
      fetchStudents();
    }
  };

  // FILTER PENCARIAN (FIXED: Menggunakan kelasSekolah)
  const filteredStudents = students.filter(s => 
    (s.nama || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.kelasSekolah || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.detailProgram || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
            <h2 style={{margin:0}}>👨‍🎓 Data Siswa</h2>
            <button onClick={() => navigate('/admin/students/add')} style={styles.btnAdd}>+ Siswa Baru</button>
        </div>

        <input 
            type="text" 
            placeholder="Cari Nama / Kelas..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchBar}
        />

        <div style={styles.grid}>
          {filteredStudents.map((siswa) => (
            <div key={siswa.id} style={styles.card}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'start'}}>
                <div>
                    <h3 style={{margin:0, color:'#2c3e50'}}>{siswa.nama}</h3>
                    {/* Tampilkan Program & Kelas dengan aman */}
                    <div style={styles.badge}>
                        {siswa.detailProgram} • {siswa.kelasSekolah}
                    </div>
                </div>
                <div style={{textAlign:'right'}}>
                   <small style={{display:'block', color:'#7f8c8d'}}>{siswa.status || 'Aktif'}</small>
                </div>
              </div>
              
              <div style={styles.infoRow}>
                <small>Ortu: {siswa.ortu?.ayah || '-'}</small><br/>
                <small>HP: {siswa.ortu?.hp || '-'}</small>
              </div>

              {/* ACTION ROW DENGAN TOMBOL EDIT */}
              <div style={styles.actionRow}>
                <button onClick={() => navigate(`/admin/students/edit/${siswa.id}`)} style={styles.btnEdit} title="Edit Data">
                    ✏️ Edit
                </button>
                <button onClick={() => navigate(`/admin/students/attendance/${siswa.id}`)} style={styles.btnAction} title="Lihat Absen">
                    📅 Absen
                </button>
                <button onClick={() => navigate(`/admin/students/finance/${siswa.id}`)} style={styles.btnAction} title="Keuangan">
                    💰 Bayar
                </button>
                <button onClick={() => handleDelete(siswa.id)} style={styles.btnDel} title="Hapus">
                    🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'Segoe UI, sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  btnAdd: { padding:'10px 20px', background:'#27ae60', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' },
  searchBar: { width:'100%', padding:12, borderRadius:5, border:'1px solid #ddd', marginBottom:20, boxSizing:'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  badge: { display:'inline-block', background:'#e1f5fe', color:'#0277bd', fontSize:11, padding:'2px 6px', borderRadius:4, marginTop:5, fontWeight:'bold' },
  infoRow: { marginTop:10, marginBottom:15, color:'#555', fontSize:13, borderTop:'1px solid #eee', paddingTop:10 },
  
  actionRow: { display:'flex', gap:5 },
  btnEdit: { flex:1, padding:'8px', background:'#f39c12', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:'bold' },
  btnAction: { flex:1, padding:'8px', background:'#3498db', color:'white', border:'none', borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:'bold' },
  btnDel: { width:35, padding:'8px', background:'white', color:'#c0392b', border:'1px solid #c0392b', borderRadius:4, cursor:'pointer', fontSize:12 }
};

export default StudentList;