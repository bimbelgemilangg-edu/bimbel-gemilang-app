import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Type, Video, HelpCircle, Save, FilePlus, Trash2, ArrowLeft, Plus } from 'lucide-react';

const ManageMateri = ({ editData, onBack }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [coverUrl, setCoverUrl] = useState(""); 
  const [deadline, setDeadline] = useState("");
  const [contentBlocks, setContentBlocks] = useState([]);
  
  const [availableGrades, setAvailableGrades] = useState([]);
  const [targetType, setTargetType] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('');

  // --- SINKRONISASI DATA SAAT EDIT ---
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

  // --- FUNGSI TAMBAH BLOK (Materi, Media, Tugas, Kuis) ---
  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      title: "",
      content: "",
      dueDate: deadline,
      questions: type === 'quiz' ? [] : undefined // Khusus kuis, siapkan array pertanyaan
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  // --- FUNGSI KHUSUS KUIS (Diambil dari ManageQuiz kamu) ---
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
        alert("Modul & Semua Isinya Berhasil Diperbarui!");
      } else {
        payload.createdAt = serverTimestamp();
        payload.authorName = localStorage.getItem('teacherName') || "Pengajar";
        await addDoc(collection(db, "bimbel_modul"), payload);
        alert("Modul Berhasil Dipublish ke Siswa!");
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
            <label style={styles.label}>🖼️ Sampul Modul (File HP/Komputer):</label>
            <div style={styles.uploadWrapper}>
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{display:'none'}} id="file-upload" />
                <label htmlFor="file-upload" style={styles.customFileUpload}>
                    {coverUrl ? "✅ Gambar Terpilih" : "Pilih Gambar"}
                </label>
                {coverUrl && (
                    <div style={{display:'flex', gap:10, alignItems:'center'}}>
                        <img src={coverUrl} alt="Preview" style={{width:50, height:50, borderRadius:5, objectFit:'cover'}} />
                        <button onClick={() => setCoverUrl("")} style={{background:'#fee2e2', color:'red', border:'none', padding:5, borderRadius:5}}>Hapus</button>
                    </div>
                )}
            </div>
          </div>
          <div>
            <label style={styles.label}>📅 Tenggat Waktu Utama:</label>
            <input type="datetime-local" style={styles.input} value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>

        {/* LIST BLOK MATERI, MEDIA, TUGAS, KUIS */}
        <div style={{ marginTop: '30px' }}>
          {contentBlocks.map((block, index) => (
            <div key={block.id} style={styles.blockItem}>
              <div style={styles.blockHeader}>
                <span>BAGIAN {index + 1}: {block.type.toUpperCase()}</span>
                <button onClick={() => setContentBlocks(contentBlocks.filter(b => b.id !== block.id))} style={styles.btnDel}><Trash2 size={16}/></button>
              </div>
              <input placeholder="Sub Judul Bagian..." style={styles.subInput} value={block.title} onChange={(e) => {
                  const b = [...contentBlocks]; b[index].title = e.target.value; setContentBlocks(b);
              }} />

              {/* RENDER TEKS */}
              {block.type === 'materi' && <textarea style={styles.textArea} placeholder="Ketik materi disini..." value={block.content} onChange={(e) => {
                const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
              }}/>}

              {/* RENDER MEDIA */}
              {block.type === 'media' && <input style={styles.input} placeholder="Link Video YouTube / Google Slide PPT..." value={block.content} onChange={(e) => {
                const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
              }}/>}

              {/* RENDER TUGAS */}
              {block.type === 'assignment' && <textarea style={styles.textArea} placeholder="Ketik Instruksi Tugas... (Siswa akan upload file disini)" value={block.content} onChange={(e) => {
                const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
              }}/>}

              {/* RENDER KUIS (MENGGANTIKAN FILE MANAGEQUIZ LAMA) */}
              {block.type === 'quiz' && (
                <div style={{background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginTop: 10}}>
                  {block.questions.map((q, qIdx) => (
                    <div key={q.id} style={{ background: 'white', padding: '15px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong>Pertanyaan {qIdx + 1}</strong>
                        <button onClick={() => deleteQuestion(block.id, q.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}><Trash2 size={16}/></button>
                      </div>
                      <input style={styles.input} placeholder="Tulis Pertanyaan..." value={q.q} onChange={(e) => updateQuestion(block.id, q.id, 'q', e.target.value)} />
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} style={{ display: 'flex', gap: '10px', marginBottom: '5px', alignItems:'center' }}>
                          <input type="radio" checked={q.correct === optIdx} onChange={() => updateQuestion(block.id, q.id, 'correct', optIdx)} />
                          <input style={{ flex: 1, padding: '8px', borderRadius: 4, border: '1px solid #ccc', fontSize: 13 }} placeholder={`Pilihan ${optIdx + 1}`} value={opt} onChange={(e) => updateQuestion(block.id, q.id, 'options', e.target.value, optIdx)} />
                        </div>
                      ))}
                    </div>
                  ))}
                  <button onClick={() => addQuestionToBlock(block.id)} style={{ width: '100%', padding: '10px', border: '1px dashed #673ab7', color: '#673ab7', background: 'none', cursor: 'pointer', fontWeight:'bold' }}>
                    <Plus size={14}/> Tambah Soal Kuis
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.btnGroup}>
          <button onClick={() => addBlock('materi')} style={styles.btnTool} title="Teks Materi"><Type size={18}/></button>
          <button onClick={() => addBlock('media')} style={styles.btnTool} title="Media/PPT"><Video size={18}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.btnTool} title="Tugas Upload"><FilePlus size={18}/></button>
          <button onClick={() => addBlock('quiz')} style={styles.btnTool} title="Kuis Ganda"><HelpCircle size={18}/></button>
        </div>
        <button onClick={handlePublish} style={styles.btnPublish}>
          <Save size={18}/> {editData ? "SIMPAN PERUBAHAN" : "PUBLISH MODUL"}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto', paddingBottom: '100px' },
  btnBack: { background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontWeight: 'bold', marginBottom: 20 },
  card: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  titleInput: { width: '100%', border: 'none', fontSize: '28px', fontWeight: 'bold', outline: 'none', marginBottom: '10px' },
  descInput: { width: '100%', border: 'none', fontSize: '16px', outline: 'none', color: '#666', resize: 'none', marginBottom: '20px' },
  metaGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #eee', paddingTop: '20px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#888', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', marginBottom: '10px' },
  uploadWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  customFileUpload: { background: '#f1f5f9', padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', border: '1px dashed #cbd5e1' },
  blockItem: { border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '15px', background: '#fff' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' },
  subInput: { width: '100%', border: 'none', borderBottom: '1px solid #eee', marginBottom: '15px', padding: '8px 0', fontSize: '16px', fontWeight: '600', outline: 'none' },
  textArea: { width: '100%', minHeight: '100px', border: '1px solid #eee', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
  btnDel: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  footer: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 20px', borderRadius: '50px', display: 'flex', gap: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', alignItems: 'center', zIndex: 100 },
  btnGroup: { display: 'flex', gap: '15px' },
  btnTool: { border: 'none', background: '#f0f0f0', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPublish: { background: '#27ae60', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
};

export default ManageMateri;