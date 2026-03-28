import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Type, Video, HelpCircle, Save, Search, FilePlus, Trash2, Clock } from 'lucide-react';

const ManageMateri = () => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [deadline, setDeadline] = useState(""); // Tenggat Global
  const [contentBlocks, setContentBlocks] = useState([]); // Daftar blok konten
  
  const [allStudents, setAllStudents] = useState([]);
  const [availableGrades, setAvailableGrades] = useState([]);
  const [targetType, setTargetType] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const snap = await getDocs(collection(db, "students"));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAllStudents(data);
        const grades = [...new Set(data.map(s => s.kelasSekolah))].filter(Boolean).sort();
        setAvailableGrades(grades);
      } catch (e) { console.error("Error fetching students:", e); }
    };
    fetchStudents();
  }, []);

  // --- FUNGSI UNTUK MENAMBAH BLOK (TEKS, MEDIA, KUIS, TUGAS) ---
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      title: "",
      content: "",
      quizData: type === 'quiz' ? [{ q: "", options: ["", "", "", ""], correct: 0 }] : null,
      openDate: "", // Untuk Tugas/Kuis
      dueDate: deadline // Default mengikuti deadline global
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const removeBlock = (id) => {
    setContentBlocks(contentBlocks.filter(b => b.id !== id));
  };

  const updateBlock = (id, field, value) => {
    setContentBlocks(contentBlocks.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handlePublish = async () => {
    if (!title || contentBlocks.length === 0) return alert("Isi judul dan minimal satu materi!");
    
    try {
      const payload = {
        title,
        desc,
        deadline,
        contentBlocks,
        target: {
          type: targetType,
          grade: targetType === 'grade' ? selectedGrade : null,
          studentIds: targetType === 'individual' ? selectedStudents : []
        },
        author: localStorage.getItem('teacherName') || "Pengajar",
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "bimbel_modul"), payload);
      alert("Modul Berhasil Dipublish!");
      window.location.reload();
    } catch (e) { alert("Gagal: " + e.message); }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <input placeholder="Judul Modul..." style={styles.titleInput} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Deskripsi singkat materi..." style={styles.descInput} onChange={(e) => setDesc(e.target.value)} />

        <div style={styles.metaGrid}>
          <div>
            <label style={styles.label}>📅 Tenggat Global (Muncul di Dashboard):</label>
            <input type="datetime-local" style={styles.input} onChange={(e) => setDeadline(e.target.value)} />
          </div>
          <div>
            <label style={styles.label}>👥 Target Siswa:</label>
            <select style={styles.input} value={targetType} onChange={(e) => setTargetType(e.target.value)}>
              <option value="all">Semua Siswa</option>
              <option value="grade">Berdasarkan Jenjang Kelas</option>
              <option value="individual">Pilih Siswa Spesifik</option>
            </select>
          </div>
        </div>

        {/* Filter Target Siswa (Sesuai kode sebelumnya) */}
        {targetType === 'grade' && (
          <div style={styles.filterBox}>
             <div style={styles.tagContainer}>
              {availableGrades.map(grade => (
                <button key={grade} onClick={() => setSelectedGrade(grade)} style={selectedGrade === grade ? styles.tagActive : styles.tag}>{grade}</button>
              ))}
            </div>
          </div>
        )}

        {/* DAFTAR BLOK MATERI YANG DITAMBAHKAN */}
        <div style={{ marginTop: '30px' }}>
          {contentBlocks.map((block, index) => (
            <div key={block.id} style={styles.blockItem}>
              <div style={styles.blockHeader}>
                <span>Bagian {index + 1}: {block.type.toUpperCase()}</span>
                <button onClick={() => removeBlock(block.id)} style={styles.btnDel}><Trash2 size={16}/></button>
              </div>
              
              <input 
                placeholder="Sub Judul Bagian..." 
                style={styles.subInput} 
                value={block.title} 
                onChange={(e) => updateBlock(block.id, 'title', e.target.value)}
              />

              {block.type === 'materi' && (
                <textarea 
                  placeholder="Isi materi teks..." 
                  style={styles.textArea} 
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                />
              )}

              {block.type === 'media' && (
                <input 
                  placeholder="Paste Link Video/Drive/Youtube..." 
                  style={styles.input} 
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                />
              )}

              {(block.type === 'quiz' || block.type === 'assignment') && (
                <div style={styles.timeSetting}>
                  <div>
                    <label style={styles.labelSmall}>Buka Pada:</label>
                    <input type="datetime-local" style={styles.inputSmall} onChange={(e) => updateBlock(block.id, 'openDate', e.target.value)} />
                  </div>
                  <div>
                    <label style={styles.labelSmall}>Tenggat (Due Date):</label>
                    <input type="datetime-local" style={styles.inputSmall} defaultValue={deadline} onChange={(e) => updateBlock(block.id, 'dueDate', e.target.value)} />
                  </div>
                </div>
              )}

              {block.type === 'assignment' && (
                <textarea 
                  placeholder="Instruksi Tugas (Siswa akan melihat tombol Upload)..." 
                  style={styles.textArea} 
                  onChange={(e) => updateBlock(block.id, 'content', e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER ACTION: Sekarang Tombol Bisa Ditekan */}
      <div style={styles.footer}>
        <div style={styles.btnGroup}>
          <button onClick={() => addBlock('materi')} style={styles.btnTool} title="Tambah Teks"><Type size={18}/></button>
          <button onClick={() => addBlock('media')} style={styles.btnTool} title="Tambah Media"><Video size={18}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.btnTool} title="Tambah Tugas"><FilePlus size={18}/></button>
          <button onClick={() => addBlock('quiz')} style={styles.btnTool} title="Tambah Kuis"><HelpCircle size={18}/></button>
        </div>
        <button onClick={handlePublish} style={styles.btnPublish}>
          <Save size={18}/> PUBLISH MODUL
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' },
  card: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  titleInput: { width: '100%', border: 'none', fontSize: '28px', fontWeight: 'bold', outline: 'none', marginBottom: '10px' },
  descInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', color: '#666', resize: 'none', marginBottom: '20px' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #eee', paddingTop: '20px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '10px' },
  blockItem: { border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '15px', background: '#fff' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' },
  subInput: { width: '100%', border: 'none', borderBottom: '1px solid #eee', marginBottom: '15px', padding: '8px 0', fontSize: '16px', fontWeight: '600', outline: 'none' },
  textArea: { width: '100%', minHeight: '100px', border: '1px solid #eee', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
  btnDel: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  timeSetting: { display: 'flex', gap: '15px', marginTop: '10px', padding: '10px', background: '#f8fafc', borderRadius: '8px' },
  labelSmall: { fontSize: '10px', fontWeight: 'bold', display: 'block', color: '#64748b' },
  inputSmall: { border: '1px solid #ddd', fontSize: '12px', padding: '5px', borderRadius: '5px' },
  footer: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 20px', borderRadius: '50px', display: 'flex', gap: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', alignItems: 'center', zIndex: 100 },
  btnGroup: { display: 'flex', gap: '15px' },
  btnTool: { border: 'none', background: '#f0f0f0', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  btnPublish: { background: '#27ae60', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
  tag: { padding: '6px 15px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '12px' },
  tagActive: { padding: '6px 15px', borderRadius: '20px', background: '#673ab7', color: 'white', border: '1px solid #673ab7', cursor: 'pointer', fontSize: '12px' }
};

export default ManageMateri;