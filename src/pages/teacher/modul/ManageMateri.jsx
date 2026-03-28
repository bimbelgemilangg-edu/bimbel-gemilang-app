import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Type, Video, FileText, HelpCircle, Save, Users, Search, Check } from 'lucide-react';

const ManageMateri = () => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState("");
  const [contentBlocks, setContentBlocks] = useState([]);
  
  // STATE UNTUK TARGET SISWA (KONEK DATA ADMIN)
  const [allStudents, setAllStudents] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [targetType, setTargetType] = useState('all'); // 'all', 'grade', 'individual'
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. AMBIL DATA SISWA DARI KOLEKSI ADMIN
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllStudents(data);

        // Ambil daftar kelas unik dari data siswa (misal: "Kelas 7", "12 IPA", dll)
        const grades = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort();
        setAvailableGrades(grades);
      } catch (e) {
        console.error("Gagal mengambil data siswa:", e);
      }
    };
    fetchStudents();
  }, []);

  const handlePublish = async () => {
    if (!title) return alert("Judul wajib diisi!");
    
    try {
      const payload = {
        title,
        desc,
        deadline,
        contentBlocks,
        // LOGIKA TARGETING
        target: {
          type: targetType,
          grade: targetType === 'grade' ? selectedGrade : null,
          studentIds: targetType === 'individual' ? selectedStudents : []
        },
        author: localStorage.getItem('teacherName') || "Pengajar",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "bimbel_modul"), payload);
      alert("Modul Berhasil Dipublish ke Siswa Terpilih!");
      window.location.reload();
    } catch (e) {
      alert("Gagal mempublish: " + e.message);
    }
  };

  // Filter siswa untuk pilihan individu
  const filteredSearch = allStudents.filter(s => 
    s.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.kelasSekolah?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <input 
          placeholder="Judul Modul..." 
          style={styles.titleInput} 
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea 
          placeholder="Deskripsi singkat materi..." 
          style={styles.descInput}
          onChange={(e) => setDesc(e.target.value)}
        />

        <div style={styles.metaGrid}>
          <div>
            <label style={styles.label}>📅 Tenggat Waktu:</label>
            <input type="datetime-local" style={styles.input} onChange={(e) => setDeadline(e.target.value)} />
          </div>

          {/* BAGIAN TARGET SISWA DENGAN DATA ADMIN */}
          <div>
            <label style={styles.label}>👥 Target Siswa:</label>
            <select style={styles.input} value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              <option value="all">Semua Siswa</option>
              <option value="grade">Berdasarkan Jenjang Kelas</option>
              <option value="individual">Pilih Siswa Spesifik</option>
            </select>
          </div>
        </div>

        {/* SUB-FILTER: JENJANG KELAS */}
        {targetType === 'grade' && (
          <div style={styles.filterBox}>
            <p style={{margin: '0 0 10px 0', fontSize: 13}}>Pilih Kelas dari Data Admin:</p>
            <div style={styles.tagContainer}>
              {availableGrades.map(grade => (
                <button 
                  key={grade}
                  onClick={() => setSelectedGrade(grade)}
                  style={selectedGrade === grade ? styles.tagActive : styles.tag}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SUB-FILTER: INDIVIDU */}
        {targetType === 'individual' && (
          <div style={styles.filterBox}>
            <div style={styles.searchWrap}>
              <Search size={14} />
              <input 
                placeholder="Cari nama siswa..." 
                style={styles.cleanInput} 
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={styles.studentScroll}>
              {filteredSearch.map(s => (
                <label key={s.id} style={styles.studentItem}>
                  <input 
                    type="checkbox"
                    checked={selectedStudents.includes(s.id)}
                    onChange={(e) => {
                      if(e.target.checked) setSelectedStudents([...selectedStudents, s.id]);
                      else setSelectedStudents(selectedStudents.filter(id => id !== s.id));
                    }}
                  />
                  <span>{s.nama} <small style={{color:'#999'}}>({s.kelasSekolah})</small></span>
                </label>
              ))}
            </div>
            <p style={{fontSize:11, marginTop:5}}>{selectedStudents.length} Siswa dipilih</p>
          </div>
        )}
      </div>

      {/* FOOTER ACTION */}
      <div style={styles.footer}>
        <div style={styles.btnGroup}>
          <button style={styles.btnTool}><Type size={18}/> Teks</button>
          <button style={styles.btnTool}><Video size={18}/> Media</button>
          <button style={styles.btnTool}><HelpCircle size={18}/> Kuis</button>
        </div>
        <button onClick={handlePublish} style={styles.btnPublish}>
          <Save size={18}/> PUBLISH MODUL
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  card: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  titleInput: { width: '100%', border: 'none', fontSize: '28px', fontWeight: 'bold', outline: 'none', marginBottom: '10px' },
  descInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', color: '#666', resize: 'none', marginBottom: '20px' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #eee', paddingTop: '20px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' },
  filterBox: { marginTop: '15px', padding: '15px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  tag: { padding: '6px 15px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '13px' },
  tagActive: { padding: '6px 15px', borderRadius: '20px', border: '1px solid #673ab7', background: '#673ab7', color: 'white', cursor: 'pointer', fontSize: '13px' },
  searchWrap: { display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '10px' },
  cleanInput: { border: 'none', outline: 'none', width: '100%', fontSize: '13px' },
  studentScroll: { maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px' },
  studentItem: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '5px', borderRadius: '5px' },
  footer: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 20px', borderRadius: '50px', display: 'flex', gap: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', alignItems: 'center', zIndex: 100 },
  btnGroup: { display: 'flex', gap: '10px' },
  btnTool: { border: 'none', background: '#f0f0f0', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPublish: { background: '#27ae60', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }
};

export default ManageMateri;