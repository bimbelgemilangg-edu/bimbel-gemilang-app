import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // State Responsif
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Ambil data guru dari state navigasi atau localStorage
  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    return stateGuru || (localGuru ? JSON.parse(localGuru) : null);
  });

  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // State Input Nilai
  const [score, setScore] = useState(""); 
  const [topic, setTopic] = useState("");
  const [aspects, setAspects] = useState({
    pemahaman: 3, 
    aplikasi: 3, 
    literasi: 3, 
    inisiatif: 3, 
    mandiri: 3    
  });
  
  const [selectedMapel] = useState(guru?.mapel || "Umum");

  // Effect Listener Window Size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!guru) { 
        alert("Sesi berakhir, silakan login kembali.");
        navigate('/login-guru'); 
        return; 
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            const snapSiswa = await getDocs(collection(db, "students"));
            const dataSiswa = snapSiswa.docs.map(d => ({id: d.id, ...d.data()}));
            
            const currentMonth = new Date().toISOString().slice(0, 7); 
            const qGrades = query(
                collection(db, "grades"), 
                where("teacherId", "==", guru.id),
                where("mapel", "==", selectedMapel)
            );
            const snapGrades = await getDocs(qGrades);
            const existingGrades = snapGrades.docs.map(d => d.data());

            const mergedData = dataSiswa.map(siswa => {
                const hasGrade = existingGrades.find(g => 
                    g.studentId === siswa.id && 
                    g.tanggal && g.tanggal.startsWith(currentMonth)
                );
                return { ...siswa, statusNilai: hasGrade ? 'Sudah' : 'Belum' };
            });

            setStudents(mergedData);
            setFilteredStudents(mergedData);
        } catch (err) {
            console.error("Error fetchData:", err);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [guru, selectedMapel, navigate]);

  useEffect(() => {
    let result = students;
    if(searchTerm) {
        result = result.filter(s => s.nama?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if(filterClass !== "Semua") {
        result = result.filter(s => s.kelasSekolah?.includes(filterClass) || s.program?.includes(filterClass));
    }
    if(filterStatus !== "Semua") {
        result = result.filter(s => s.statusNilai === filterStatus);
    }
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
            createdAt: Timestamp.now(),
            tipe: 'Bulanan'
        });
        
        alert(`✅ Nilai ${selectedStudent.nama} berhasil disimpan!`);
        setSelectedStudent(null);
        setScore("");
        setTopic("");
        window.location.reload(); 
    } catch (err) { 
        alert("Gagal menyimpan: " + err.message); 
    }
  };

  const RenderRating = ({ label, value, field, desc }) => (
    <div style={{marginBottom:15, background:'#f9f9f9', padding:'12px', borderRadius:8, border:'1px solid #eee'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{flex:1}}>
                <label style={{fontWeight:'bold', fontSize:13, color:'#2c3e50'}}>{label}</label>
                <p style={{fontSize:11, color:'#7f8c8d', margin:'2px 0 0 0'}}>{desc}</p>
            </div>
            <span style={{fontWeight:'bold', color:'#3498db', fontSize:16, marginLeft:10}}>{value}/5</span>
        </div>
        <input 
            type="range" min="1" max="5" step="1" 
            value={value}
            onChange={(e) => setAspects({...aspects, [field]: parseInt(e.target.value)})}
            style={{width:'100%', accentColor:'#3498db', marginTop:10, cursor:'pointer'}} 
        />
    </div>
  );

  return (
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh', flexDirection: isMobile ? 'column' : 'row' }}>
      <SidebarGuru />
      <div style={{ 
          marginLeft: isMobile ? '0' : '260px', 
          padding: isMobile ? '15px' : '30px', 
          width: isMobile ? '100%' : 'calc(100% - 260px)',
          boxSizing: 'border-box'
      }}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
            
            {/* Header & Filter Card */}
            <div style={{background:'white', padding: isMobile ? '15px' : '25px', borderRadius:15, boxShadow:'0 4px 15px rgba(0,0,0,0.05)', marginBottom:25}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap: 'wrap', gap: 10}}>
                    <h2 style={{margin:0, color:'#2c3e50', fontSize: isMobile ? 18 : 24}}>📝 Input Nilai & Karakter</h2>
                    <div style={{background:'#f1c40f', padding:'5px 15px', borderRadius:20, fontSize:10, fontWeight:'bold'}}>
                        Rapor Bulanan
                    </div>
                </div>
                
                <div style={{background:'#eaf2f8', padding:12, borderRadius:10, marginTop:15, borderLeft:'5px solid #3498db', display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', gap: 5}}>
                    <p style={{margin:0, fontSize:13, color:'#2980b9'}}>Guru: <b>{guru?.nama}</b></p>
                    <p style={{margin:0, fontSize:13, color:'#2c3e50'}}>Mapel: <b style={{color:'#e67e22'}}>{selectedMapel}</b></p>
                </div>

                {!selectedStudent && (
                    <div style={{marginTop:20, display:'flex', gap:10, flexWrap:'wrap'}}>
                        <input 
                            type="text" 
                            placeholder="🔍 Cari nama siswa..." 
                            value={searchTerm} 
                            onChange={e=>setSearchTerm(e.target.value)} 
                            style={{...styles.inputSearch, flex: isMobile ? '1 1 100%' : 2}} 
                        />
                        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} style={{...styles.select, flex: isMobile ? '1 1 48%' : 1}}>
                            <option value="Semua">Semua Jenjang</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                        </select>
                        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{...styles.select, flex: isMobile ? '1 1 48%' : 1}}>
                            <option value="Semua">Semua Status</option>
                            <option value="Belum">⚠️ Belum</option>
                            <option value="Sudah">✅ Sudah</option>
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{textAlign:'center', padding:50, color:'#7f8c8d'}}>Memuat data siswa...</div>
            ) : selectedStudent ? (
                <div style={styles.cardForm}>
                    <button onClick={()=>setSelectedStudent(null)} style={styles.btnBack}>← Kembali ke Daftar</button>
                    <div style={{borderBottom:'1px solid #eee', margin:'15px 0', paddingBottom:10}}>
                        <h3 style={{margin:0, color:'#2c3e50', fontSize: 18}}>Penilaian: {selectedStudent.nama}</h3>
                        <p style={{margin:0, fontSize:11, color:'#7f8c8d'}}>{selectedStudent.kelasSekolah} | {selectedStudent.detailProgram}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h4 style={styles.sectionH}>A. Capaian Akademik</h4>
                        <div style={{display:'flex', flexDirection: isMobile ? 'column' : 'row', gap:15, marginBottom:20}}>
                            <div style={{flex:2}}>
                                <label style={styles.labelIn}>Topik / Materi Pembahasan</label>
                                <input type="text" required placeholder="Contoh: Aljabar" value={topic} onChange={e=>setTopic(e.target.value)} style={styles.inputField} />
                            </div>
                            <div style={{flex:1}}>
                                <label style={styles.labelIn}>Nilai Angka</label>
                                <input type="number" required placeholder="0-100" value={score} onChange={e=>setScore(e.target.value)} style={{...styles.inputField, border:'2px solid #3498db', textAlign:'center', fontWeight:'bold', fontSize:18}} />
                            </div>
                        </div>

                        <h4 style={{...styles.sectionH, background:'#fff3e0', color:'#d35400'}}>B. Karakter & Sikap</h4>
                        <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:10}}>
                            <RenderRating label="Pemahaman Konsep" desc="Penguasaan teori." value={aspects.pemahaman} field="pemahaman" />
                            <RenderRating label="Logika & Aplikasi" desc="Kemampuan variasi soal." value={aspects.aplikasi} field="aplikasi" />
                            <RenderRating label="Literasi / Fokus" desc="Ketelitian membaca soal." value={aspects.literasi} field="literasi" />
                            <RenderRating label="Inisiatif" desc="Keaktifan bertanya." value={aspects.inisiatif} field="inisiatif" />
                            <RenderRating label="Kemandirian" desc="Mengerjakan tanpa bantuan." value={aspects.mandiri} field="mandiri" />
                        </div>

                        <button type="submit" style={styles.btnSubmit}>💾 SIMPAN KE RAPOR</button>
                    </form>
                </div>
            ) : (
                <div style={{
                    display:'grid', 
                    gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '140px' : '200px'}, 1fr))`, 
                    gap: isMobile ? 10 : 20 
                }}>
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                        <div 
                            key={s.id} 
                            onClick={()=>setSelectedStudent(s)} 
                            style={{
                                ...styles.studentCard, 
                                borderTop: s.statusNilai==='Sudah' ? '4px solid #27ae60' : '4px solid #e74c3c'
                            }}
                        >
                            <div style={{fontWeight:'bold', color:'#2c3e50', marginBottom:5, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{s.nama}</div>
                            <div style={{fontSize:10, color:'#7f8c8d'}}>{s.kelasSekolah || 'N/A'}</div>
                            <div style={{fontSize:9, color:'#95a5a6', marginBottom:10}}>{s.program || s.detailProgram}</div>
                            
                            <div style={{
                                marginTop:'auto',
                                fontSize:9, 
                                fontWeight:'bold',
                                color: s.statusNilai==='Sudah'?'#27ae60':'#e74c3c',
                                background: s.statusNilai==='Sudah'?'#eafaf1':'#fdedec',
                                padding:'4px 2px',
                                borderRadius:4,
                                textAlign:'center'
                            }}>
                                {s.statusNilai === 'Sudah' ? '✅ TERISI' : '⚠️ BELUM'}
                            </div>
                        </div>
                    )) : (
                        <div style={{gridColumn:'1/-1', textAlign:'center', padding:40, color:'#95a5a6'}}>
                            Siswa tidak ditemukan.
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const styles = {
    inputSearch: { padding:'10px 15px', borderRadius:10, border:'1px solid #dfe6e9', outline:'none', fontSize:14, boxSizing: 'border-box' },
    select: { padding:'10px', borderRadius:10, border:'1px solid #dfe6e9', fontSize:13, cursor:'pointer', outline:'none', background:'white' },
    cardForm: { background:'white', padding:'20px', borderRadius:20, boxShadow:'0 10px 25px rgba(0,0,0,0.05)' },
    btnBack: { background:'none', border:'none', color:'#3498db', cursor:'pointer', fontSize:13, fontWeight:'bold', padding:0 },
    sectionH: { background:'#f8f9fa', padding:'10px 15px', borderRadius:8, fontSize:13, marginBottom:15, fontWeight:'bold', color:'#2c3e50' },
    labelIn: { display:'block', fontSize:11, fontWeight:'bold', marginBottom:5, color:'#34495e' },
    inputField: { width:'100%', padding:'12px', borderRadius:8, border:'1px solid #dfe6e9', boxSizing:'border-box', outline:'none', fontSize: 14 },
    btnSubmit: { width:'100%', padding:'15px', background:'#27ae60', color:'white', border:'none', borderRadius:12, fontWeight:'bold', cursor:'pointer', fontSize:15, marginTop:20, transition:'0.3s' },
    studentCard: { 
        background:'white', 
        padding:15, 
        borderRadius:15, 
        cursor:'pointer', 
        boxShadow:'0 4px 10px rgba(0,0,0,0.03)', 
        display:'flex', 
        flexDirection:'column',
        transition:'0.2s transform'
    }
};

export default TeacherInputGrade;