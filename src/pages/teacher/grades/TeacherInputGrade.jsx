import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where, Timestamp } from "firebase/firestore";
import SidebarGuru from '../../../components/SidebarGuru';

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
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

  useEffect(() => {
    if (!guru) { 
        alert("Sesi berakhir, silakan login kembali.");
        navigate('/login-guru'); 
        return; 
    }

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Ambil Semua Siswa
            const snapSiswa = await getDocs(collection(db, "students"));
            const dataSiswa = snapSiswa.docs.map(d => ({id: d.id, ...d.data()}));
            
            // 2. Cek apakah sudah dinilai bulan ini oleh guru ini
            const currentMonth = new Date().toISOString().slice(0, 7); 
            const qGrades = query(
                collection(db, "grades"), 
                where("teacherId", "==", guru.id),
                where("mapel", "==", selectedMapel)
            );
            const snapGrades = await getDocs(qGrades);
            const existingGrades = snapGrades.docs.map(d => d.data());

            // 3. Gabungkan status
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

  // Logic Filter & Search
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
        // Reload data tanpa refresh halaman penuh
        window.location.reload(); 
    } catch (err) { 
        alert("Gagal menyimpan: " + err.message); 
    }
  };

  const RenderRating = ({ label, value, field, desc }) => (
    <div style={{marginBottom:15, background:'#f9f9f9', padding:'12px', borderRadius:8, border:'1px solid #eee'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
                <label style={{fontWeight:'bold', fontSize:13, color:'#2c3e50'}}>{label}</label>
                <p style={{fontSize:11, color:'#7f8c8d', margin:'2px 0 0 0'}}>{desc}</p>
            </div>
            <span style={{fontWeight:'bold', color:'#3498db', fontSize:16}}>{value}/5</span>
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
    <div style={{ display: 'flex', background: '#f4f7f6', minHeight: '100vh' }}>
      <SidebarGuru />
      <div style={{ marginLeft: '260px', padding: '30px', width: 'calc(100% - 260px)' }}>
        <div style={{maxWidth:900, margin:'0 auto'}}>
            
            {/* Header & Filter Card */}
            <div style={{background:'white', padding:25, borderRadius:15, boxShadow:'0 4px 15px rgba(0,0,0,0.05)', marginBottom:25}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h2 style={{margin:0, color:'#2c3e50'}}>📝 Input Nilai & Karakter</h2>
                    <div style={{background:'#f1c40f', padding:'5px 15px', borderRadius:20, fontSize:12, fontWeight:'bold'}}>
                        Mode: Rapor Bulanan
                    </div>
                </div>
                
                <div style={{background:'#eaf2f8', padding:12, borderRadius:10, marginTop:15, borderLeft:'5px solid #3498db', display:'flex', justifyContent:'space-between'}}>
                    <p style={{margin:0, fontSize:14, color:'#2980b9'}}>Guru: <b>{guru?.nama}</b></p>
                    <p style={{margin:0, fontSize:14, color:'#2c3e50'}}>Mata Pelajaran: <b style={{color:'#e67e22'}}>{selectedMapel}</b></p>
                </div>

                {!selectedStudent && (
                    <div style={{marginTop:20, display:'flex', gap:12, flexWrap:'wrap'}}>
                        <input 
                            type="text" 
                            placeholder="🔍 Cari nama siswa..." 
                            value={searchTerm} 
                            onChange={e=>setSearchTerm(e.target.value)} 
                            style={{...styles.inputSearch, flex:2}} 
                        />
                        <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} style={styles.select}>
                            <option value="Semua">Semua Jenjang</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                        </select>
                        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={styles.select}>
                            <option value="Semua">Semua Status</option>
                            <option value="Belum">⚠️ Belum Dinilai</option>
                            <option value="Sudah">✅ Sudah Dinilai</option>
                        </select>
                    </div>
                )}
            </div>

            {loading ? (
                <div style={{textAlign:'center', padding:50, color:'#7f8c8d'}}>Memuat data siswa...</div>
            ) : selectedStudent ? (
                /* FORM INPUT NILAI */
                <div style={styles.cardForm}>
                    <button onClick={()=>setSelectedStudent(null)} style={styles.btnBack}>← Kembali ke Daftar Siswa</button>
                    <div style={{borderBottom:'1px solid #eee', margin:'15px 0', paddingBottom:10}}>
                        <h3 style={{margin:0, color:'#2c3e50'}}>Penilaian: {selectedStudent.nama}</h3>
                        <p style={{margin:0, fontSize:12, color:'#7f8c8d'}}>{selectedStudent.kelasSekolah} | {selectedStudent.detailProgram}</p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <h4 style={styles.sectionH}>A. Capaian Akademik</h4>
                        <div style={{display:'flex', gap:15, marginBottom:20}}>
                            <div style={{flex:2}}>
                                <label style={styles.labelIn}>Topik / Materi Pembahasan</label>
                                <input type="text" required placeholder="Contoh: Aljabar atau Past Tense" value={topic} onChange={e=>setTopic(e.target.value)} style={styles.inputField} />
                            </div>
                            <div style={{flex:1}}>
                                <label style={styles.labelIn}>Nilai Angka</label>
                                <input type="number" required placeholder="0-100" value={score} onChange={e=>setScore(e.target.value)} style={{...styles.inputField, border:'2px solid #3498db', textAlign:'center', fontWeight:'bold', fontSize:18}} />
                            </div>
                        </div>

                        <h4 style={{...styles.sectionH, background:'#fff3e0', color:'#d35400'}}>B. Karakter & Sikap (Skala 1-5)</h4>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:15}}>
                            <RenderRating label="Pemahaman Konsep" desc="Sejauh mana siswa menguasai teori." value={aspects.pemahaman} field="pemahaman" />
                            <RenderRating label="Logika & Aplikasi" desc="Kemampuan menjawab soal variasi." value={aspects.aplikasi} field="aplikasi" />
                            <RenderRating label="Literasi / Fokus" desc="Ketelitian dalam membaca soal." value={aspects.literasi} field="literasi" />
                            <RenderRating label="Inisiatif" desc="Keaktifan bertanya & menjawab." value={aspects.inisiatif} field="inisiatif" />
                            <RenderRating label="Kemandirian" desc="Mengerjakan tugas tanpa bantuan." value={aspects.mandiri} field="mandiri" />
                        </div>

                        <button type="submit" style={styles.btnSubmit}>💾 SIMPAN DATA KE RAPOR</button>
                    </form>
                </div>
            ) : (
                /* GRID DAFTAR SISWA */
                <div style={styles.studentGrid}>
                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                        <div 
                            key={s.id} 
                            onClick={()=>setSelectedStudent(s)} 
                            style={{
                                ...styles.studentCard, 
                                borderTop: s.statusNilai==='Sudah' ? '4px solid #27ae60' : '4px solid #e74c3c'
                            }}
                        >
                            <div style={{fontWeight:'bold', color:'#2c3e50', marginBottom:5}}>{s.nama}</div>
                            <div style={{fontSize:11, color:'#7f8c8d'}}>{s.kelasSekolah || 'N/A'}</div>
                            <div style={{fontSize:10, color:'#95a5a6', marginBottom:10}}>{s.program || s.detailProgram}</div>
                            
                            <div style={{
                                marginTop:'auto',
                                fontSize:10, 
                                fontWeight:'bold',
                                color: s.statusNilai==='Sudah'?'#27ae60':'#e74c3c',
                                background: s.statusNilai==='Sudah'?'#eafaf1':'#fdedec',
                                padding:'4px 8px',
                                borderRadius:4,
                                textAlign:'center'
                            }}>
                                {s.statusNilai === 'Sudah' ? '✅ SUDAH DINILAI' : '⚠️ BELUM DINILAI'}
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
    inputSearch: { padding:'10px 15px', borderRadius:10, border:'1px solid #dfe6e9', outline:'none', fontSize:14 },
    select: { padding:'10px', borderRadius:10, border:'1px solid #dfe6e9', fontSize:14, cursor:'pointer', outline:'none', background:'white' },
    cardForm: { background:'white', padding:30, borderRadius:20, boxShadow:'0 10px 25px rgba(0,0,0,0.05)' },
    btnBack: { background:'none', border:'none', color:'#3498db', cursor:'pointer', fontSize:14, fontWeight:'bold', padding:0 },
    sectionH: { background:'#f8f9fa', padding:'10px 15px', borderRadius:8, fontSize:14, marginBottom:20, fontWeight:'bold', color:'#2c3e50' },
    labelIn: { display:'block', fontSize:12, fontWeight:'bold', marginBottom:5, color:'#34495e' },
    inputField: { width:'100%', padding:'12px', borderRadius:8, border:'1px solid #dfe6e9', boxSizing:'border-box', outline:'none' },
    btnSubmit: { width:'100%', padding:'18px', background:'#27ae60', color:'white', border:'none', borderRadius:12, fontWeight:'bold', cursor:'pointer', fontSize:16, marginTop:20, transition:'0.3s' },
    studentGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:20 },
    studentCard: { 
        background:'white', 
        padding:20, 
        borderRadius:15, 
        cursor:'pointer', 
        boxShadow:'0 4px 10px rgba(0,0,0,0.03)', 
        display:'flex', 
        flexDirection:'column',
        transition:'0.2s transform',
        ':hover': { transform: 'translateY(-5px)' }
    }
};

export default TeacherInputGrade;