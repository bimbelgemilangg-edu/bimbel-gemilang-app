import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Sidebar from '../../../components/Sidebar';

const TeacherGradeManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [guru] = useState(location.state?.teacher || JSON.parse(localStorage.getItem('teacherData')));

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nilai: 0, topik: "", tanggal: "" });

  const fetchGrades = async () => {
    if (!guru) return;
    setLoading(true);
    try {
        const q = query(collection(db, "grades"), where("teacherId", "==", guru.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        data.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
        setGrades(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => {
    if (!guru) { navigate('/login-guru'); return; }
    fetchGrades();
  }, [guru, navigate]);

  const handleDelete = async (id, namaSiswa) => {
    if(window.confirm(`Yakin hapus nilai ${namaSiswa}?`)) {
        await deleteDoc(doc(db, "grades", id));
        fetchGrades(); 
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    const dateStr = item.tanggal.split('T')[0];
    setEditForm({ nilai: item.nilai, topik: item.topik, tanggal: dateStr });
  };

  const saveEdit = async (id) => {
    try {
        const newDateISO = new Date(editForm.tanggal).toISOString();
        await updateDoc(doc(db, "grades", id), {
            nilai: parseInt(editForm.nilai),
            topik: editForm.topik,
            tanggal: newDateISO 
        });
        setEditingId(null);
        fetchGrades(); 
        alert("✅ Berhasil diupdate!");
    } catch (err) { alert("Gagal update: " + err.message); }
  };

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', padding: '30px', width: '100%' }}>
        <div style={styles.headerBox}>
            <div>
                <h2 style={{margin:0}}>🛠️ Kelola & Edit Nilai</h2>
                <p style={{margin:0, color:'#7f8c8d'}}>Guru: {guru?.nama}</p>
            </div>
            <button onClick={() => navigate('/guru/grades/input')} style={styles.btnInput}>➕ Input Baru</button>
        </div>

        <div style={styles.tableBox}>
            {loading ? <p>Loading data...</p> : (
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thr}>
                            <th>Tanggal</th><th>Siswa</th><th>Topik</th><th>Nilai</th><th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map(item => (
                            <tr key={item.id} style={styles.tr}>
                                {editingId === item.id ? (
                                    <>
                                        <td><input type="date" value={editForm.tanggal} onChange={e=>setEditForm({...editForm, tanggal:e.target.value})} /></td>
                                        <td style={{color:'#999'}}>{item.studentName}</td>
                                        <td><input type="text" value={editForm.topik} onChange={e=>setEditForm({...editForm, topik:e.target.value})} style={{width:'100%'}} /></td>
                                        <td><input type="number" value={editForm.nilai} onChange={e=>setEditForm({...editForm, nilai:e.target.value})} style={{width:50}} /></td>
                                        <td>
                                            <button onClick={()=>saveEdit(item.id)} style={styles.btnSave}>💾</button>
                                            <button onClick={()=>setEditingId(null)} style={styles.btnCancel}>❌</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{fontSize:12}}>{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                        <td style={{fontWeight:'bold'}}>{item.studentName}</td>
                                        <td>{item.topik}</td>
                                        <td style={{fontWeight:'bold', color: item.nilai<70?'#e74c3c':'#27ae60'}}>{item.nilai}</td>
                                        <td>
                                            <button onClick={()=>startEdit(item)} style={styles.btnEdit}>✏️</button>
                                            <button onClick={()=>handleDelete(item.id, item.studentName)} style={styles.btnDel}>🗑️</button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

const styles = {
    headerBox: { background:'white', padding:20, borderRadius:10, display:'flex', justifyContent:'space-between', marginBottom:20 },
    btnInput: { padding:'10px 20px', background:'#3498db', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer' },
    tableBox: { background:'white', padding:20, borderRadius:10, overflowX:'auto' },
    table: { width:'100%', borderCollapse:'collapse', fontSize:14 },
    thr: { background:'#f8f9fa', textAlign:'left' },
    tr: { borderBottom:'1px solid #eee' },
    btnEdit: { background:'#f39c12', color:'white', border:'none', padding:5, borderRadius:3, marginRight:5 },
    btnDel: { background:'#e74c3c', color:'white', border:'none', padding:5, borderRadius:3 },
    btnSave: { background:'#27ae60', color:'white', border:'none', padding:5, borderRadius:3, marginRight:5 },
    btnCancel: { background:'#95a5a6', color:'white', border:'none', padding:5, borderRadius:3 }
};

export default TeacherGradeManager;