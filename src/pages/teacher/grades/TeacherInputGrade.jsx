import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const TeacherInputGrade = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guru = location.state?.teacher;

  const [students, setStudents] = useState([]);
  const [filterJenjang, setFilterJenjang] = useState("SD");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // FORM DATA NILAI AKADEMIK
  const [formData, setFormData] = useState({
    mapel: "Matematika",
    tipe: "Kuis", // Kuis, UH, Tugas, UTS, UAS
    nilai: "",
    topik: "", // Misal: Pecahan, Aljabar
    tanggal: new Date().toISOString().split('T')[0],
  });

  // FORM SKOR SIKAP (1-5)
  const [scores, setScores] = useState({
    pemahaman: 3,
    keaktifan: 3,
    disiplin: 3,
    tugas: 3,
    mandiri: 3
  });

  // 1. LOAD SISWA
  useEffect(() => {
    if(!guru) return;
    const fetchStudents = async () => {
      const snap = await getDocs(collection(db, "students"));
      setStudents(snap.docs.map(d => ({id: d.id, ...d.data()})));
    };
    fetchStudents();
  }, [guru]);

  // FILTER SISWA SESUAI JENJANG YG DIPILIH GURU
  const filteredStudents = students.filter(s => {
      const info = (s.kelasSekolah || "") + (s.detailProgram || "");
      return info.toUpperCase().includes(filterJenjang);
  });

  // 2. SIMPAN NILAI
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!selectedStudent || !formData.nilai) return alert("Lengkapi data!");

    try {
        await addDoc(collection(db, "grades"), {
            studentId: selectedStudent.id,
            studentName: selectedStudent.nama,
            studentClass: selectedStudent.kelasSekolah,
            teacherId: guru.id,
            teacherName: guru.nama,
            ...formData,
            nilai: parseInt(formData.nilai),
            qualitative: scores, // Menyimpan 5 aspek sikap
            createdAt: new Date().toISOString() // Untuk sorting
        });
        alert("✅ Nilai & Evaluasi Tersimpan!");
        setFormData({...formData, nilai: "", topik: ""}); // Reset nilai saja
    } catch (error) {
        console.error(error);
        alert("Gagal simpan.");
    }
  };

  if(!guru) return <div style={{padding:20}}>Akses ditolak.</div>;

  return (
    <div style={{padding:20, maxWidth:600, margin:'0 auto', fontFamily:'sans-serif'}}>
        <div style={{marginBottom:20, borderBottom:'1px solid #ddd', paddingBottom:10}}>
            <button onClick={()=>navigate('/guru/dashboard', {state:{teacher:guru}})} style={{cursor:'pointer', border:'none', background:'none', fontSize:20}}>⬅</button>
            <span style={{fontSize:18, fontWeight:'bold', marginLeft:10}}>Input Nilai & Evaluasi</span>
        </div>

        {/* LANGKAH 1: PILIH SISWA */}
        <div style={{background:'white', padding:15, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', marginBottom:15}}>
            <div style={{display:'flex', gap:5, marginBottom:10, overflowX:'auto'}}>
                {['SD', 'SMP', 'SMA', 'English'].map(j => (
                    <button key={j} onClick={()=>setFilterJenjang(j)} 
                        style={{padding:'6px 12px', borderRadius:20, border:'1px solid #ccc', background: filterJenjang===j?'#2c3e50':'white', color: filterJenjang===j?'white':'#333', cursor:'pointer', fontSize:12}}>
                        {j}
                    </button>
                ))}
            </div>
            <select 
                value={selectedStudent?.id || ""} 
                onChange={e => setSelectedStudent(students.find(s => s.id === e.target.value))}
                style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #3498db'}}
            >
                <option value="">-- Cari Nama Siswa --</option>
                {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>{s.nama} ({s.kelasSekolah})</option>
                ))}
            </select>
        </div>

        {/* LANGKAH 2: INPUT NILAI */}
        {selectedStudent && (
            <form onSubmit={handleSubmit} style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
                <h4 style={{marginTop:0, color:'#2c3e50'}}>📝 Data Akademik</h4>
                
                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10}}>
                    <div>
                        <label style={{fontSize:12, fontWeight:'bold'}}>Mapel</label>
                        <select value={formData.mapel} onChange={e=>setFormData({...formData, mapel:e.target.value})} style={styles.input}>
                            <option>Matematika</option><option>IPAS</option><option>B. Indonesia</option><option>B. Inggris</option><option>Fisika</option><option>Kimia</option><option>Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <label style={{fontSize:12, fontWeight:'bold'}}>Jenis</label>
                        <select value={formData.tipe} onChange={e=>setFormData({...formData, tipe:e.target.value})} style={styles.input}>
                            <option>Kuis</option><option>Ulangan (UH)</option><option>Tugas</option><option>UTS</option><option>UAS</option>
                        </select>
                    </div>
                </div>

                <div style={{marginBottom:10}}>
                    <label style={{fontSize:12, fontWeight:'bold'}}>Topik / Materi</label>
                    <input type="text" placeholder="Contoh: Pecahan Desimal" value={formData.topik} onChange={e=>setFormData({...formData, topik:e.target.value})} style={styles.input} />
                </div>

                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
                    <div>
                        <label style={{fontSize:12, fontWeight:'bold'}}>Nilai (0-100)</label>
                        <input type="number" min="0" max="100" value={formData.nilai} onChange={e=>setFormData({...formData, nilai:e.target.value})} style={styles.input} placeholder="0" required />
                    </div>
                    <div>
                        <label style={{fontSize:12, fontWeight:'bold'}}>Tanggal</label>
                        <input type="date" value={formData.tanggal} onChange={e=>setFormData({...formData, tanggal:e.target.value})} style={styles.input} />
                    </div>
                </div>

                {/* LANGKAH 3: SKOR SIKAP (1-5) */}
                <h4 style={{marginTop:0, color:'#e67e22', borderTop:'1px dashed #ddd', paddingTop:15}}>⭐ Evaluasi Belajar (1-5)</h4>
                {[
                    {k:'pemahaman', l:'Pemahaman Materi'},
                    {k:'keaktifan', l:'Keaktifan di Kelas'},
                    {k:'disiplin', l:'Kedisiplinan'},
                    {k:'tugas', l:'Penyelesaian Tugas'},
                    {k:'mandiri', l:'Kemandirian'}
                ].map((item) => (
                    <div key={item.k} style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
                        <span style={{fontSize:13}}>{item.l}</span>
                        <div style={{display:'flex', gap:3}}>
                            {[1,2,3,4,5].map(n => (
                                <div key={n} onClick={()=>setScores({...scores, [item.k]: n})}
                                    style={{
                                        width:25, height:25, borderRadius:4, display:'flex', justifyContent:'center', alignItems:'center', cursor:'pointer', fontSize:11, fontWeight:'bold',
                                        background: scores[item.k] === n ? '#e67e22' : '#eee',
                                        color: scores[item.k] === n ? 'white' : '#555'
                                    }}>
                                    {n}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <button type="submit" style={{width:'100%', marginTop:20, padding:12, background:'#27ae60', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer'}}>
                    SIMPAN DATA
                </button>
            </form>
        )}
    </div>
  );
};

const styles = {
    input: { width:'100%', padding:8, borderRadius:5, border:'1px solid #ccc', boxSizing:'border-box', marginTop:3 }
};

export default TeacherInputGrade;