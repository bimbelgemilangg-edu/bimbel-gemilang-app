import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import Sidebar from '../../../components/Sidebar';

const TeacherGradeManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Tetap menggunakan state bawaan sesuai permintaan
  const [guru] = useState(location.state?.teacher);

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
        
        // Sortir tanggal agar data terbaru di atas
        data.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));

        // LOGIKA TREN: Membandingkan dengan nilai sebelumnya dari siswa yang sama
        const enrichedData = data.map((item, index) => {
            // Cari data lama milik siswa yang sama (indeks lebih besar berarti data lebih lama)
            const previousGrades = data.filter((g, i) => g.studentId === item.studentId && i > index);
            
            let trend = 'new'; 
            if (previousGrades.length > 0) {
                const lastScore = previousGrades[0].nilai;
                if (item.nilai > lastScore) trend = 'up';
                else if (item.nilai < lastScore) trend = 'down';
                else trend = 'stable';
            }
            return { ...item, trend };
        });

        setGrades(enrichedData);
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
    // Pastikan format tanggal untuk input date adalah YYYY-MM-DD
    const dateStr = item.tanggal ? item.tanggal.split('T')[0] : "";
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
                <h2 style={{margin:0}}>📊 Kelola Nilai & Analisis Tren</h2>
                <p style={{margin:0, color:'#7f8c8d'}}>Guru: {guru?.nama}</p>
            </div>
            <button onClick={() => navigate('/guru/grades/input', { state: { teacher: guru } })} style={styles.btnInput}>➕ Input Baru</button>
        </div>

        <div style={styles.tableBox}>
            {loading ? <p>Loading data...</p> : (
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.thr}>
                            <th style={styles.th}>Tanggal</th>
                            <th style={styles.th}>Siswa</th>
                            <th style={styles.th}>Topik Materi</th>
                            <th style={styles.th}>Nilai</th>
                            <th style={styles.th}>Tren</th>
                            <th style={styles.th}>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grades.map(item => (
                            <tr key={item.id} style={styles.tr}>
                                {editingId === item.id ? (
                                    <>
                                        <td><input type="date" value={editForm.tanggal} onChange={e=>setEditForm({...editForm, tanggal:e.target.value})} style={styles.inputEdit} /></td>
                                        <td style={{color:'#999'}}>{item.studentName}</td>
                                        <td><input type="text" value={editForm.topik} onChange={e=>setEditForm({...editForm, topik:e.target.value})} style={{...styles.inputEdit, width:'90%'}} /></td>
                                        <td><input type="number" value={editForm.nilai} onChange={e=>setEditForm({...editForm, nilai:e.target.value})} style={{...styles.inputEdit, width:60}} /></td>
                                        <td>-</td>
                                        <td>
                                            <button onClick={()=>saveEdit(item.id)} style={styles.btnSave}>💾 Simpan</button>
                                            <button onClick={()=>setEditingId(null)} style={styles.btnCancel}>❌</button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td style={{fontSize:12, whiteSpace:'nowrap'}}>
                                            {new Date(item.tanggal).toLocaleDateString('id-ID', {day:'numeric', month:'short', year:'numeric'})}
                                        </td>
                                        <td style={{fontWeight:'bold'}}>{item.studentName}</td>
                                        <td style={{fontSize:13, color:'#555'}}>{item.topik}</td>
                                        <td style={{fontWeight:'bold', fontSize:16, color: item.nilai < 70 ? '#e74c3c' : '#27ae60'}}>
                                            {item.nilai}
                                        </td>
                                        <td>
                                            {item.trend === 'up' && <span style={{color:'#27ae60', fontWeight:'bold'}}>📈 Naik</span>}
                                            {item.trend === 'down' && <span style={{color:'#e74c3c', fontWeight:'bold'}}>📉 Turun</span>}
                                            {item.trend === 'stable' && <span style={{color:'#f39c12'}}>➖ Stabil</span>}
                                            {item.trend === 'new' && <span style={{color:'#3498db', fontSize:11}}>🆕 Data Awal</span>}
                                        </td>
                                        <td style={{whiteSpace:'nowrap'}}>
                                            <button onClick={()=>startEdit(item)} style={styles.btnEdit} title="Edit Nilai">✏️</button>
                                            <button onClick={()=>handleDelete(item.id, item.studentName)} style={styles.btnDel} title="Hapus">🗑️</button>
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
    headerBox: { background:'white', padding:20, borderRadius:10, display:'flex', justifyContent:'space-between', marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
    btnInput: { padding:'10px 20px', background:'#3498db', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer' },
    tableBox: { background:'white', padding:20, borderRadius:10, overflowX:'auto', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
    table: { width:'100%', borderCollapse:'collapse', fontSize:14 },
    th: { padding:'12px 10px', borderBottom:'2px solid #eee' },
    thr: { background:'#f8f9fa', textAlign:'left' },
    tr: { borderBottom:'1px solid #eee' },
    td: { padding:'12px 10px' },
    inputEdit: { padding:'5px', borderRadius:4, border:'1px solid #ddd' },
    btnEdit: { background:'#f39c12', color:'white', border:'none', padding:'6px 10px', borderRadius:5, marginRight:5, cursor:'pointer' },
    btnDel: { background:'#e74c3c', color:'white', border:'none', padding:'6px 10px', borderRadius:5, cursor:'pointer' },
    btnSave: { background:'#27ae60', color:'white', border:'none', padding:'6px 12px', borderRadius:5, marginRight:5, cursor:'pointer', fontWeight:'bold' },
    btnCancel: { background:'#95a5a6', color:'white', border:'none', padding:'6px 10px', borderRadius:5, cursor:'pointer' }
};

export default TeacherGradeManager;