import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Type, Video, HelpCircle, Save, FilePlus, Trash2, ArrowLeft, Plus, Eye, Globe } from 'lucide-react';

const ManageMateri = ({ editData, onBack }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [coverUrl, setCoverUrl] = useState(""); 
  const [deadline, setDeadline] = useState("");
  const [contentBlocks, setContentBlocks] = useState([]);
  
  const [availableGrades, setAvailableGrades] = useState([]);
  const [targetType, setTargetType] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('');

  // --- SINKRONISASI DATA SAAT EDIT (Murni, Tidak Diotak-atik) ---
  useEffect(() => {
    if (editData) {
      setTitle(editData.title || "");
      setDesc(editData.desc || "");
      setCoverUrl(editData.coverUrl || "");
      setDeadline(editData.deadline || "");
      setContentBlocks(editData.contentBlocks || []);
      setTargetType(editData.target?.type || 'all');
      setSelectedGrade(editData.target?.grade || "");
    }
  }, [editData]);

  useEffect(() => {
    const fetchGrades = async () => {
      const snap = await getDocs(collection(db, "students"));
      const grades = [...new Set(snap.docs.map(s => s.data().kelasSekolah))].filter(Boolean).sort();
      setAvailableGrades(grades);
    };
    fetchGrades();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- FUNGSI TAMBAH BLOK ---
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      title: "",
      content: "",
      dueDate: deadline,
      questions: type === 'quiz' ? [] : undefined 
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  // --- FUNGSI KUIS (Tetap Utuh & Diperkuat) ---
  const addQuestionToBlock = (blockId) => {
    setContentBlocks(contentBlocks.map(b => {
      if (b.id === blockId) {
        return { ...b, questions: [...b.questions, { id: Date.now(), q: '', options: ['', '', '', ''], correct: 0 }] };
      }
      return b;
    }));
  };

  const updateQuestion = (blockId, qId, field, value, optIdx = null) => {
    setContentBlocks(contentBlocks.map(b => {
      if (b.id === blockId) {
        const updatedQuestions = b.questions.map(q => {
          if (q.id === qId) {
            if (field === 'q') return { ...q, q: value };
            if (field === 'correct') return { ...q, correct: value };
            if (field === 'options') {
              const newOpts = [...q.options];
              newOpts[optIdx] = value;
              return { ...q, options: newOpts };
            }
          }
          return q;
        });
        return { ...b, questions: updatedQuestions };
      }
      return b;
    }));
  };

  const deleteQuestion = (blockId, qId) => {
    setContentBlocks(contentBlocks.map(b => {
      if (b.id === blockId) return { ...b, questions: b.questions.filter(q => q.id !== qId) };
      return b;
    }));
  };

  const handlePublish = async () => {
    if (!title || contentBlocks.length === 0) return alert("Isi judul dan minimal satu materi/tugas!");
    
    const payload = {
      title, desc, coverUrl, deadline, contentBlocks,
      target: { type: targetType, grade: targetType === 'grade' ? selectedGrade : null },
      updatedAt: serverTimestamp(),
    };

    try {
      if (editData?.id) {
        await updateDoc(doc(db, "bimbel_modul", editData.id), payload);
        alert("Modul Berhasil Diupdate!");
      } else {
        payload.createdAt = serverTimestamp();
        payload.authorName = localStorage.getItem('teacherName') || "Pengajar";
        await addDoc(collection(db, "bimbel_modul"), payload);
        alert("Modul Berhasil Dipublish!");
      }
      onBack(); 
    } catch (e) { alert("Gagal: " + e.message); }
  };

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.btnBack}><ArrowLeft size={18}/> Kembali ke Daftar</button>
      
      <div style={styles.card}>
        <input placeholder="Judul Pembelajaran..." style={styles.titleInput} value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea placeholder="Deskripsi singkat..." style={styles.descInput} value={desc} onChange={(e) => setDesc(e.target.value)} />

        <div style={styles.metaGrid}>
          <div>
            <label style={styles.label}>🖼️ Sampul Modul:</label>
            <div style={styles.uploadWrapper}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} id="file-upload" />
                <label htmlFor="file-upload" style={styles.customFileUpload}>
                    {coverUrl ? "✅ Sampul Terpasang" : "Klik Pilih Gambar Sampul"}
                </label>
                {coverUrl && <img src={coverUrl} alt="Preview" style={{width:60, height:40, borderRadius:5, marginTop:5, objectFit:'cover'}} />}
            </div>
          </div>
          <div>
            <label style={styles.label}>📅 Tenggat Waktu Utama:</label>
            <input type="datetime-local" style={styles.input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        {/* --- LIST BLOK KONTEN --- */}
        <div style={{ marginTop: '30px' }}>
          {contentBlocks.map((block, index) => (
            <div key={block.id} style={styles.blockItem}>
              <div style={styles.blockHeader}>
                <span>BAGIAN {index + 1}: {block.type.toUpperCase()}</span>
                <button onClick={() => setContentBlocks(contentBlocks.filter(b => b.id !== block.id))} style={styles.btnDel}><Trash2 size={16}/></button>
              </div>
              
              <input placeholder="Sub Judul (Contoh: Materi Inti / Latihan 1)" style={styles.subInput} value={block.title} onChange={(e) => {
                  const b = [...contentBlocks]; b[index].title = e.target.value; setContentBlocks(b);
              }} />

              {/* RENDER TEKS */}
              {block.type === 'materi' && (
                <textarea style={styles.textArea} placeholder="Tuliskan materi pembelajaran lengkap di sini..." value={block.content} onChange={(e) => {
                  const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
                }}/>
              )}

              {/* RENDER MEDIA + SMART PREVIEW */}
              {block.type === 'media' && (
                <div>
                  <div style={styles.inputIconGroup}>
                    <Globe size={16} color="#64748b"/>
                    <input style={{...styles.input, border:'none', marginBottom:0}} placeholder="Paste link Video YouTube atau Google Drive PPT..." value={block.content} onChange={(e) => {
                      const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
                    }}/>
                  </div>
                  {block.content && (
                    <div style={styles.smartPreviewBox}>
                      <p style={{fontSize:11, color:'#673ab7', marginBottom:5, fontWeight:'bold'}}><Eye size={12}/> Tampilan di Siswa:</p>
                      <iframe 
                        src={block.content.includes('docs.google') ? `https://docs.google.com/viewer?url=${encodeURIComponent(block.content)}&embedded=true` : block.content}
                        style={{width:'100%', height:'200px', borderRadius:8, border:'1px solid #ddd'}}
                        title="Preview"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* RENDER TUGAS (ASSIGNMENT) */}
              {block.type === 'assignment' && (
                <div style={styles.assignArea}>
                   <p style={{fontSize:12, color:'#f39c12', fontWeight:'bold'}}>Siswa akan diminta mengunggah file jawaban.</p>
                   <textarea style={styles.textArea} placeholder="Berikan instruksi tugas secara detail..." value={block.content} onChange={(e) => {
                     const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
                   }}/>
                </div>
              )}

              {/* RENDER KUIS (Murni Sesuai Keinginanmu) */}
              {block.type === 'quiz' && (
                <div style={styles.quizWrapper}>
                  {block.questions.map((q, qIdx) => (
                    <div key={q.id} style={styles.quizCard}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={styles.qNum}>SOAL NO. {qIdx + 1}</span>
                        <button onClick={() => deleteQuestion(block.id, q.id)} style={styles.btnTrash}><Trash2 size={14}/></button>
                      </div>
                      <input style={styles.input} placeholder="Pertanyaan..." value={q.q} onChange={(e) => updateQuestion(block.id, q.id, 'q', e.target.value)} />
                      <div style={styles.optGrid}>
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} style={q.correct === optIdx ? styles.optActive : styles.optNormal}>
                            <input type="radio" checked={q.correct === optIdx} onChange={() => updateQuestion(block.id, q.id, 'correct', optIdx)} />
                            <input style={styles.optInput} placeholder={`Pilihan ${optIdx + 1}`} value={opt} onChange={(e) => updateQuestion(block.id, q.id, 'options', e.target.value, optIdx)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={() => addQuestionToBlock(block.id)} style={styles.btnAddQ}>
                    <Plus size={14}/> Tambah Pertanyaan Baru
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.btnGroup}>
          <button onClick={() => addBlock('materi')} style={styles.btnTool} title="Tambah Teks"><Type size={18}/></button>
          <button onClick={() => addBlock('media')} style={styles.btnTool} title="Tambah Media/PPT"><Video size={18}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.btnTool} title="Tambah Tugas"><FilePlus size={18}/></button>
          <button onClick={() => addBlock('quiz')} style={styles.btnTool} title="Tambah Kuis"><HelpCircle size={18}/></button>
        </div>
        <button onClick={handlePublish} style={styles.btnPublish}>
          <Save size={18}/> {editData ? "SIMPAN PERUBAHAN" : "PUBLISH MODUL"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto', paddingBottom: '120px' },
  btnBack: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontWeight: 'bold', marginBottom: 20 },
  card: { background: 'white', padding: '30px', borderRadius: '20px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
  titleInput: { width: '100%', border: 'none', fontSize: '32px', fontWeight: 'bold', outline: 'none', marginBottom: '10px', color: '#1e293b' },
  descInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', color: '#64748b', resize: 'none', marginBottom: '20px' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  label: { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' },
  input: { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '10px', outlineColor: '#673ab7' },
  uploadWrapper: { display: 'flex', flexDirection: 'column' },
  customFileUpload: { background: '#f8fafc', padding: '12px', borderRadius: '10px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', border: '1px dashed #cbd5e1', fontWeight:'500' },
  blockItem: { border: '1px solid #e2e8f0', padding: '25px', borderRadius: '16px', marginBottom: '20px', background: '#fff', position: 'relative' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', fontSize: '10px', fontWeight: '800', color: '#673ab7', letterSpacing: 1 },
  subInput: { width: '100%', border: 'none', borderBottom: '2px solid #f1f5f9', marginBottom: '20px', padding: '10px 0', fontSize: '18px', fontWeight: '700', outline: 'none', color: '#334155' },
  textArea: { width: '100%', minHeight: '120px', border: '1px solid #e2e8f0', padding: '15px', borderRadius: '12px', outline: 'none', fontSize: '15px', lineHeight: 1.6, fontFamily: 'inherit' },
  btnDel: { background: '#fff1f2', border: 'none', color: '#e11d48', padding: '8px', borderRadius: '8px', cursor: 'pointer' },
  inputIconGroup: { display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e2e8f0', padding: '0 15px', borderRadius: '10px', marginBottom: 15 },
  smartPreviewBox: { background: '#f8fafc', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0' },
  quizWrapper: { background: '#f8fafc', padding: '15px', borderRadius: '12px', marginTop: 10 },
  quizCard: { background: 'white', padding: '20px', marginBottom: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  qNum: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  btnTrash: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' },
  optGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 15 },
  optNormal: { display: 'flex', gap: 10, alignItems: 'center', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px' },
  optActive: { display: 'flex', gap: 10, alignItems: 'center', padding: '10px', border: '1px solid #673ab7', background: '#f5f3ff', borderRadius: '10px' },
  optInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: 13, flex: 1 },
  btnAddQ: { width: '100%', padding: '12px', border: '2px dashed #cbd5e1', color: '#64748b', background: 'none', cursor: 'pointer', borderRadius: '12px', fontWeight: 'bold', fontSize: 13 },
  footer: { position: 'fixed', bottom: '25px', left: '50%', transform: 'translateX(-50%)', background: '#1e293b', padding: '12px 25px', borderRadius: '40px', display: 'flex', gap: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', alignItems: 'center', zIndex: 100 },
  btnGroup: { display: 'flex', gap: '15px' },
  btnTool: { border: 'none', background: 'rgba(255,255,255,0.1)', color: 'white', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: '0.2s' },
  btnPublish: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(103, 58, 183, 0.4)' },
};

export default ManageMateri;