import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase'; 
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const TeacherInputGrade = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const guru = location.state?.teacher; // Data guru yang login

  // STATE DATA
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  
  // STATE FILTER
  const [searchTerm, setSearchTerm] = useState("");
  const [filterClass, setFilterClass] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua"); // Semua, Sudah, Belum

  // STATE FORM INPUT
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [score, setScore] = useState(""); // Nilai Akademik (0-100)
  const [topic, setTopic] = useState("");
  
  // 5 ASPEK BIMBEL GEMILANG (Skala 1-5)
  const [aspects, setAspects] = useState({
    pemahaman: 3, 
    aplikasi: 3,  
    literasi: 3,  
    inisiatif: 3, 
    mandiri: 3    
  });

  // --- PERBAIKAN LOGIKA MAPEL DI SINI ---
  // Kita ambil langsung dari properti 'mapel' milik guru.
  // Jika kosong, baru fallback ke 'Umum'.
  const [selectedMapel, setSelectedMapel] = useState(guru?.mapel || "Umum");

  // 1. LOAD SISWA & CEK STATUS NILAI BULAN INI
  useEffect(() => {
    if (!guru) { navigate('/'); return; }
    
    // Update Mapel jika guru punya mapel spesifik
    if(guru.mapel) {
        setSelectedMapel(guru.mapel);
    }

    const fetchData = async () => {
        // Ambil Siswa
        const snapSiswa = await getDocs(collection(db, "students"));
        const dataSiswa = snapSiswa.docs.map(d => ({id: d.id, ...d.data()}));

        // Ambil Nilai Bulan Ini (untuk cek status sudah nilai/belum)
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        
        // Query nilai hanya yang dibuat oleh guru ini
        const qGrades = query(collection(db, "grades"), where("teacherId", "==", guru.id));
        const snapGrades = await getDocs(qGrades);
        const existingGrades = snapGrades.docs.map(d => d.data());

        // Gabungkan Data
        const mergedData = dataSiswa.map(siswa => {
            const hasGrade = existingGrades.find(g => 
                g.studentId === siswa.id && 
                g.tanggal.startsWith(currentMonth) && 
                g.mapel === (guru.mapel || selectedMapel) // Cek mapel yang sama
            );
            return { ...siswa, statusNilai: hasGrade ? 'Sudah' : 'Belum' };
        });

        setStudents(mergedData);
        setFilteredStudents(mergedData);
    };
    fetchData();
  }, [guru, selectedMapel]);

  // 2. LOGIKA FILTER PINTAR
  useEffect(() => {
    let result = students;

    // Filter Nama
    if(searchTerm) {
        result = result.filter(s => s.nama.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    // Filter Kelas
    if(filterClass !== "Semua") {
        result = result.filter(s => s.kelasSekolah?.includes(filterClass));
    }
    // Filter Status
    if(filterStatus !== "Semua") {
        result = result.filter(s => s.statusNilai === filterStatus);
    }

    setFilteredStudents(result);
  }, [searchTerm, filterClass, filterStatus, students]);

  // 3. SIMPAN NILAI
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!score || !topic) { alert("Mohon lengkapi nilai dan topik!"); return; }

    try {
        await addDoc(collection(db, "grades"), {
            studentId: selectedStudent.id,
            studentName: selectedStudent.nama,
            teacherId: guru.id,
            teacherName: guru.nama,
            mapel: selectedMapel, // Mapel otomatis sesuai guru
            topik: topic,
            nilai: parseInt(score), 
            qualitative: aspects,   
            tanggal: new Date().toISOString(),
            tipe: 'Bulanan'
        });
        alert(`✅ Nilai ${selectedStudent.nama} berhasil disimpan!`);
        setSelectedStudent(null);
        setScore("");
        setTopic("");
        setAspects({ pemahaman:3, aplikasi:3, literasi:3, inisiatif:3, mandiri:3 });
        window.location.reload(); 
    } catch (err) {
        alert("Gagal menyimpan: " + err.message);
    }
  };

  const RenderRating = ({ label, value, field, desc }) => (
    <div style={{marginBottom:15, background:'#f9f9f9', padding:10, borderRadius:5}}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
            <label style={{fontWeight:'bold', fontSize:13}}>{label}</label>
            <span style={{fontWeight:'bold', color:'#3498db'}}>{value}/5</span>
        </div>
        <p style={{fontSize:11, color:'#666', margin:'2px 0 8px 0'}}>{desc}</p>
        <input 
            type="range" min="1" max="5" step="1"
            value={value}
            onChange={(e) => setAspects({...aspects, [field]: parseInt(e.target.value)})}
            style={{width:'100%', accentColor:'#3498db'}}
        />
        <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'#999'}}>
            <span>Perlu Bimbingan</span>
            <span>Sangat Mahir</span>
        </div>
    </div>
  );

  return (
    <div style={{padding:20, maxWidth:800, margin:'0 auto', fontFamily:'sans-serif'}}>
      {/* HEADER */}
      <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', marginBottom:20}}>
        <h2 style={{margin:0, color:'#2c3e50'}}>📝 Input Nilai & Karakter</h2>
        
        {/* INFO GURU & MAPEL OTOMATIS */}
        <div style={{background:'#eaf2f8', padding:10, borderRadius:5, marginTop:10, borderLeft:'4px solid #3498db'}}>
            <p style={{margin:0, fontSize:14, color:'#2c3e50'}}>
                Guru: <b>{guru?.nama}</b> <br/> 
                Mapel Aktif: <b style={{color:'#d35400', fontSize:16}}>{selectedMapel}</b>
            </p>
            {/* Opsi Ganti Mapel Manual (Hanya jika darurat salah input) */}
            <div style={{marginTop:5}}>
                <small style={{color:'#7f8c8d'}}>Salah Mapel? </small>
                <input 
                    type="text" 
                    value={selectedMapel} 
                    onChange={e=>setSelectedMapel(e.target.value)} 
                    style={{border:'none', background:'transparent', borderBottom:'1px dashed #999', width:150, fontSize:12}}
                />
            </div>
        </div>
        
        {/* FILTER BAR */}
        <div style={{marginTop:15, display:'flex', gap:10, flexWrap:'wrap'}}>
            <input 
                type="text" placeholder="🔍 Cari nama siswa..." 
                value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                style={{padding:8, borderRadius:5, border:'1px solid #ddd', flex:1}}
            />
            <select value={filterClass} onChange={e=>setFilterClass(e.target.value)} style={{padding:8, borderRadius:5, border:'1px solid #ddd'}}>
                <option value="Semua">Semua Kelas</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{padding:8, borderRadius:5, border:'1px solid #ddd'}}>
                <option value="Semua">Semua Status</option>
                <option value="Belum">⚠️ Belum Dinilai</option>
                <option value="Sudah">✅ Sudah Dinilai</option>
            </select>
        </div>
      </div>

      {/* LIST SISWA */}
      {selectedStudent ? (
        <div style={{background:'white', padding:25, borderRadius:10, boxShadow:'0 5px 15px rgba(0,0,0,0.1)'}}>
            <button onClick={()=>setSelectedStudent(null)} style={{background:'transparent', border:'none', color:'#999', cursor:'pointer', marginBottom:10}}>← Kembali</button>
            <h3 style={{margin:'0 0 20px 0', borderBottom:'1px solid #eee', paddingBottom:10}}>Penilaian: {selectedStudent.nama}</h3>
            
            <form onSubmit={handleSubmit}>
                <h4 style={{background:'#eef2f3', padding:8, borderRadius:5}}>A. Capaian Akademik ({selectedMapel})</h4>
                <div style={{display:'flex', gap:15, marginBottom:15}}>
                    <div style={{flex:2}}>
                        <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Topik / Materi Pembelajaran</label>
                        <input type="text" required placeholder="Contoh: Aljabar Dasar / Tenses" value={topic} onChange={e=>setTopic(e.target.value)} style={{width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5}} />
                    </div>
                    <div style={{flex:1}}>
                        <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Skor (0-100)</label>
                        <input type="number" required min="0" max="100" value={score} onChange={e=>setScore(e.target.value)} style={{width:'100%', padding:10, border:'2px solid #3498db', borderRadius:5, fontWeight:'bold', textAlign:'center'}} />
                    </div>
                </div>

                <h4 style={{background:'#fff3e0', padding:8, borderRadius:5, color:'#d35400'}}>B. Aspek Karakter & Kompetensi (1-5)</h4>
                <RenderRating label="1. Pemahaman Konsep (Cognitive)" desc="Sejauh mana siswa memahami dasar teori pelajaran." value={aspects.pemahaman} field="pemahaman" />
                <RenderRating label="2. Logika & Aplikasi (Problem Solving)" desc="Kemampuan menerapkan konsep pada soal cerita/kasus." value={aspects.aplikasi} field="aplikasi" />
                <RenderRating label="3. Literasi & Analisis (Critical Thinking)" desc="Kemampuan membaca dan menganalisis informasi soal." value={aspects.literasi} field="literasi" />
                <RenderRating label="4. Inisiatif Belajar (Active Learning)" desc="Keaktifan bertanya dan antusiasme di kelas." value={aspects.inisiatif} field="inisiatif" />
                <RenderRating label="5. Kemandirian (Self-Regulated)" desc="Mampu mengerjakan tugas tanpa perlu diarahkan terus." value={aspects.mandiri} field="mandiri" />

                <button type="submit" style={{width:'100%', padding:15, background:'#27ae60', color:'white', border:'none', borderRadius:8, fontWeight:'bold', fontSize:16, cursor:'pointer', marginTop:10}}>
                    💾 SIMPAN DATA RAPOR
                </button>
            </form>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:15}}>
            {filteredStudents.map(s => (
                <div key={s.id} onClick={()=>setSelectedStudent(s)} style={{background:'white', padding:15, borderRadius:8, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', cursor:'pointer', borderLeft: s.statusNilai==='Sudah' ? '4px solid #27ae60' : '4px solid #e74c3c', transition:'0.2s'}}>
                    <div style={{fontWeight:'bold', color:'#2c3e50'}}>{s.nama}</div>
                    <div style={{fontSize:12, color:'#7f8c8d', margin:'5px 0'}}>{s.kelasSekolah} | {s.detailProgram}</div>
                    <div style={{marginTop:10, fontSize:11, fontWeight:'bold', color: s.statusNilai==='Sudah'?'#27ae60':'#e74c3c', background: s.statusNilai==='Sudah'?'#eafaf1':'#fdedec', padding:'3px 8px', borderRadius:10, display:'inline-block'}}>
                        {s.statusNilai === 'Sudah' ? '✅ Sudah Dinilai' : '⚠️ Belum Dinilai'}
                    </div>
                </div>
            ))}
            {filteredStudents.length === 0 && <p style={{gridColumn:'1/-1', textAlign:'center', color:'#999', padding:20}}>Tidak ada siswa yang cocok dengan filter.</p>}
        </div>
      )}
    </div>
  );
};

export default TeacherInputGrade;