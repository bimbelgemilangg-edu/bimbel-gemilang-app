import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";

const TeacherGradeManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const guru = location.state?.teacher;

  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ nilai: 0, topik: "" });

  // 1. LOAD DATA NILAI GURU INI
  const fetchGrades = async () => {
    if (!guru) return;
    setLoading(true);
    try {
        const q = query(collection(db, "grades"), where("teacherId", "==", guru.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        
        // Urutkan dari yang terbaru
        data.sort((a,b) => new Date(b.tanggal) - new Date(a.tanggal));
        setGrades(data);
    } catch (err) {
        alert("Gagal ambil data: " + err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!guru) { navigate('/'); return; }
    fetchGrades();
  }, [guru]);

  // 2. FUNGSI HAPUS
  const handleDelete = async (id, namaSiswa) => {
    if(window.confirm(`Yakin hapus nilai ${namaSiswa}?`)) {
        await deleteDoc(doc(db, "grades", id));
        fetchGrades(); // Refresh
    }
  };

  // 3. FUNGSI EDIT
  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ nilai: item.nilai, topik: item.topik });
  };

  const saveEdit = async (id) => {
    try {
        await updateDoc(doc(db, "grades", id), {
            nilai: parseInt(editForm.nilai),
            topik: editForm.topik
        });
        setEditingId(null);
        fetchGrades(); // Refresh
        alert("✅ Nilai berhasil diupdate!");
    } catch (err) {
        alert("Gagal update: " + err.message);
    }
  };

  return (
    <div style={{padding:20, maxWidth:900, margin:'0 auto', fontFamily:'sans-serif'}}>
      <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div>
            <h2 style={{margin:0, color:'#2c3e50'}}>🛠️ Kelola Data Nilai</h2>
            <p style={{margin:0, color:'#7f8c8d', fontSize:14}}>Guru: {guru?.nama}</p>
        </div>
        <button onClick={() => navigate('/guru/grades/input', { state: { teacher: guru } })} style={{padding:'10px 20px', background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>
            ➕ Input Baru
        </button>
      </div>

      <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
        {loading ? <p>Loading data...</p> : (
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:14}}>
                <thead>
                    <tr style={{background:'#ecf0f1', color:'#2c3e50', textAlign:'left'}}>
                        <th style={{padding:10}}>Tanggal</th>
                        <th style={{padding:10}}>Siswa</th>
                        <th style={{padding:10}}>Mapel</th>
                        <th style={{padding:10}}>Topik</th>
                        <th style={{padding:10}}>Nilai</th>
                        <th style={{padding:10}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.length === 0 ? <tr><td colSpan="6" style={{padding:20, textAlign:'center'}}>Belum ada data nilai.</td></tr> :
                    grades.map(item => (
                        <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:10, fontSize:12, color:'#666'}}>
                                {new Date(item.tanggal).toLocaleDateString('id-ID')}
                            </td>
                            <td style={{padding:10, fontWeight:'bold'}}>{item.studentName}</td>
                            <td style={{padding:10}}>{item.mapel}</td>
                            
                            {/* KOLOM EDITABLE */}
                            {editingId === item.id ? (
                                <>
                                    <td style={{padding:10}}>
                                        <input type="text" value={editForm.topik} onChange={e=>setEditForm({...editForm, topik:e.target.value})} style={{width:'100%', padding:5}} />
                                    </td>
                                    <td style={{padding:10}}>
                                        <input type="number" value={editForm.nilai} onChange={e=>setEditForm({...editForm, nilai:e.target.value})} style={{width:50, padding:5}} />
                                    </td>
                                    <td style={{padding:10}}>
                                        <button onClick={()=>saveEdit(item.id)} style={{marginRight:5, background:'#27ae60', color:'white', border:'none', padding:'5px 10px', borderRadius:3, cursor:'pointer'}}>💾</button>
                                        <button onClick={()=>setEditingId(null)} style={{background:'#95a5a6', color:'white', border:'none', padding:'5px 10px', borderRadius:3, cursor:'pointer'}}>❌</button>
                                    </td>
                                </>
                            ) : (
                                <>
                                    <td style={{padding:10}}>{item.topik}</td>
                                    <td style={{padding:10, fontWeight:'bold', color: item.nilai<70?'red':'green'}}>{item.nilai}</td>
                                    <td style={{padding:10}}>
                                        <button onClick={()=>startEdit(item)} style={{marginRight:5, background:'#f39c12', color:'white', border:'none', padding:'5px 10px', borderRadius:3, cursor:'pointer'}}>✏️</button>
                                        <button onClick={()=>handleDelete(item.id, item.studentName)} style={{background:'#e74c3c', color:'white', border:'none', padding:'5px 10px', borderRadius:3, cursor:'pointer'}}>🗑️</button>
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
  );
};

export default TeacherGradeManager;