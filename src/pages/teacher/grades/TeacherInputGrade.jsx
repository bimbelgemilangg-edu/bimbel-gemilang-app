import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import Sidebar from '../../../components/Sidebar';

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // HANYA MENGGUNAKAN STATE BAWAAN (TANPA LOCALSTORAGE)
  const [guru] = useState(location.state?.teacher);

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [score, setScore] = useState(""); 
  const [topic, setTopic] = useState("");
  const [aspects, setAspects] = useState({
    pemahaman: 3, aplikasi: 3, literasi: 3, inisiatif: 3, mandiri: 3    
  });
  const [selectedMapel, setSelectedMapel] = useState(guru?.mapel || "Umum");

  useEffect(() => {
    // Jika tidak ada data guru, langsung lempar ke login
    if (!guru) { navigate('/login-guru'); return; }

    const fetchData = async () => {
        const snapSiswa = await getDocs(collection(db, "students"));
        const dataSiswa = snapSiswa.docs.map(d => ({id: d.id, ...d.data()}));
        const currentMonth = new Date().toISOString().slice(0, 7); 
        const qGrades = query(collection(db, "grades"), where("teacherId", "==", guru.id));
        const snapGrades = await getDocs(qGrades);
        const existingGrades = snapGrades.docs.map(d => d.data());

        const mergedData = dataSiswa.map(siswa => {
            const hasGrade = existingGrades.find(g => 
                g.studentId === siswa.id && 
                g.tanggal.startsWith(currentMonth) && 
                g.mapel === selectedMapel
            );
            return { ...siswa, statusNilai: hasGrade ? 'Sudah' : 'Belum' };
        });
        setStudents(mergedData);
        setFilteredStudents(mergedData);
    };
    fetchData();
  }, [guru, selectedMapel, navigate]);

  useEffect(() => {
    let result = students;
    if(searchTerm) result = result.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    if(filterClass !== "Semua") result = result.filter(s => s.kelasSekolah?.includes(filterClass));
    if(filterStatus !== "Semua") result = result.filter(s => s.statusNilai === filterStatus);
    setFilteredStudents(result);
  }, [searchTerm, filterClass, filterStatus, students]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!score || !topic) { alert("Mohon lengkapi nilai dan topik!"); return; }
    try {
        await addDoc(collection(db, "grades"), {
            studentId: selectedStudent.id,
            studentName: selectedStudent.nama,
            teacherId: guru.id,
            teacherName: guru.nama,
            mapel: selectedMapel,
            topik: topic,
            nilai: parseInt(score), 
            qualitative: aspects,   
            tanggal: new Date().toISOString(),
            tipe: 'Bulanan'
        });
        alert(`✅ Nilai ${selectedStudent.nama} berhasil disimpan!`);
        setSelectedStudent(null);
        window.location.reload(); 
    } catch (err) { alert("Gagal menyimpan: " + err.message); }
  };

  const RenderRating = ({ label, value, field, desc }) => (
    <div style={{marginBottom:15, background:'#f9f9f9', padding:10, borderRadius:5}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
            <label style={{fontWeight:'bold', fontSize:13}}>{label}</label>
            <span style={{fontWeight:'bold', color:'#3498db'}}>{value}/5</span>
        </div>
        <p style={{fontSize:11, color:'#666', margin:'2px 0 8px 0'}}>{desc}</p>
        <input type="range" min="1" max="5" step="1" value={value}
            onChange={(e) => setAspects({...aspects, [field]: parseInt(e.target.value)})}
            style={{width:'100%', accentColor:'#3498db'}} />
    </div>
  );

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: '250px', padding: '30px', width: '100%' }}>
        <div style={{maxWidth:800, margin:'0 auto'}}>
            <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', marginBottom:20}}>
                <h2 style={{margin:0, color:'#2c3e50'}}>📝 Input Nilai & Karakter</h2>
                <div style={{background:'#eaf2f8', padding:10, borderRadius:5, marginTop:10, borderLeft:'4px solid #3498db'}}>
                    <p style={{margin:0, fontSize:14}}>Guru: <b>{guru?.nama}</b> | Mapel: <b style={{color:'#d35400'}}>{selectedMapel}</b></p>
                </div>
                {!selectedStudent && (
                    <div style={{marginTop:15, display:'flex', gap:10, flexWrap:'wrap'}}>
                        <input type="text" placeholder="🔍 Cari nama siswa..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={styles.inputSearch} />
                        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} style={styles.select}>
                            <option value="Semua">Semua Kelas</option>
                            <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
                        </select>
                        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={styles.select}>
                            <option value="Semua">Semua Status</option>
                            <option value="Belum">⚠️ Belum Dinilai</option>
                            <option value="Sudah">✅ Sudah Dinilai</option>
                        </select>
                    </div>
                )}
            </div>

            {selectedStudent ? (
                <div style={styles.cardForm}>
                    <button onClick={()=>setSelectedStudent(null)} style={styles.btnBack}>← Kembali ke Daftar</button>
                    <h3 style={{margin:'10px 0 20px 0'}}>Penilaian: {selectedStudent.nama}</h3>
                    <form onSubmit={handleSubmit}>
                        <h4 style={styles.sectionH}>A. Capaian Akademik</h4>
                        <div style={{display:'flex', gap:15, marginBottom:15}}>
                            <input type="text" required placeholder="Topik Materi" value={topic} onChange={e=>setTopic(e.target.value)} style={{flex:2, padding:10, borderRadius:5, border:'1px solid #ddd'}} />
                            <input type="number" required placeholder="Nilai (0-100)" value={score} onChange={e=>setScore(e.target.value)} style={{flex:1, padding:10, borderRadius:5, border:'2px solid #3498db', textAlign:'center', fontWeight:'bold'}} />
                        </div>
                        <h4 style={{...styles.sectionH, background:'#fff3e0', color:'#d35400'}}>B. Karakter (1-5)</h4>
                        <RenderRating label="1. Pemahaman Konsep" desc="Pemahaman dasar teori." value={aspects.pemahaman} field="pemahaman" />
                        <RenderRating label="2. Logika & Aplikasi" desc="Penerapan pada soal." value={aspects.aplikasi} field="aplikasi" />
                        <RenderRating label="5. Kemandirian" desc="Mengerjakan tugas sendiri." value={aspects.mandiri} field="mandiri" />
                        <button type="submit" style={styles.btnSubmit}>💾 SIMPAN DATA RAPOR</button>
                    </form>
                </div>
            ) : (
                <div style={styles.studentGrid}>
                    {filteredStudents.map(s => (
                        <div key={s.id} onClick={()=>setSelectedStudent(s)} style={{...styles.studentCard, borderLeft: s.statusNilai==='Sudah' ? '5px solid #27ae60' : '5px solid #e74c3c'}}>
                            <div style={{fontWeight:'bold'}}>{s.nama}</div>
                            <div style={{fontSize:11, color:'#7f8c8d'}}>{s.kelasSekolah} | {s.detailProgram}</div>
                            <div style={{marginTop:8, fontSize:10, color: s.statusNilai==='Sudah'?'#27ae60':'#e74c3c'}}>{s.statusNilai === 'Sudah' ? '✅ Sudah' : '⚠️ Belum'}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const styles = {
    inputSearch: { padding:8, borderRadius:5, border:'1px solid #ddd', flex:1 },
    select: { padding:8, borderRadius:5, border:'1px solid #ddd' },
    cardForm: { background:'white', padding:25, borderRadius:10, boxShadow:'0 5px 15px rgba(0,0,0,0.1)' },
    btnBack: { background:'none', border:'none', color:'#3498db', cursor:'pointer' },
    sectionH: { background:'#eef2f3', padding:8, borderRadius:5, fontSize:14, marginBottom:15 },
    btnSubmit: { width:'100%', padding:15, background:'#27ae60', color:'white', border:'none', borderRadius:8, fontWeight:'bold', cursor:'pointer' },
    studentGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:15 },
    studentCard: { background:'white', padding:15, borderRadius:8, cursor:'pointer', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' }
};

export default TeacherInputGrade;