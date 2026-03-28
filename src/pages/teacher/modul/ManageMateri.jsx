import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Type, Video, HelpCircle, Save, FilePlus, Trash2, ArrowLeft, Image as ImageIcon } from 'lucide-react';

const ManageMateri = ({ editData, onBack }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [coverUrl, setCoverUrl] = useState(""); // Bisa berisi URL teks atau Base64
  const [deadline, setDeadline] = useState("");
  const [contentBlocks, setContentBlocks] = useState([]);
  
  const [availableGrades, setAvailableGrades] = useState([]);
  const [targetType, setTargetType] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('');

  // --- LOGIKA DETEKSI EDIT (Mempertahankan Fungsi Edit) ---
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

  // --- FUNGSI SMART UPLOAD (Mengubah gambar ke teks Base64) ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverUrl(reader.result); // Mengubah file menjadi string teks panjang
      };
      reader.readAsDataURL(file);
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: Date.now(),
      type: type,
      title: "",
      content: "",
      openDate: "",
      dueDate: deadline // Otomatis sinkron dengan deadline utama
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  const handlePublish = async () => {
    if (!title || contentBlocks.length === 0) return alert("Isi judul dan minimal satu materi!");
    
    const payload = {
      title,
      desc,
      coverUrl, // Menyimpan teks gambar
      deadline,
      contentBlocks,
      target: {
        type: targetType,
        grade: targetType === 'grade' ? selectedGrade : null,
      },
      updatedAt: serverTimestamp(),
    };

    try {
      if (editData?.id) {
        // JIKA SEDANG EDIT: Update otomatis merubah data di dashboard siswa
        await updateDoc(doc(db, "bimbel_modul", editData.id), payload);
        alert("Modul Berhasil Diperbarui & Sinkron ke Siswa!");
      } else {
        // JIKA BARU
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
        <input 
          placeholder="Judul Modul..." 
          style={styles.titleInput} 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
        />
        <textarea 
          placeholder="Deskripsi singkat materi..." 
          style={styles.descInput} 
          value={desc} 
          onChange={(e) => setDesc(e.target.value)} 
        />

        <div style={styles.metaGrid}>
          {/* BAGIAN UPLOAD GAMBAR MODIFIKASI */}
          <div>
            <label style={styles.label}>🖼️ Sampul Modul (File HP/Komputer):</label>
            <div style={styles.uploadWrapper}>
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={styles.fileInput}
                  id="file-upload"
                />
                <label htmlFor="file-upload" style={styles.customFileUpload}>
                    {coverUrl ? "✅ Gambar Terpilih" : "Pilih Gambar Dari Perangkat"}
                </label>
                {coverUrl && (
                    <div style={styles.previewContainer}>
                        <img src={coverUrl} alt="Preview" style={styles.miniPreview} />
                        <button onClick={() => setCoverUrl("")} style={styles.btnRemoveImg}>Hapus</button>
                    </div>
                )}
            </div>
          </div>
          <div>
            <label style={styles.label}>📅 Tenggat Waktu (Due Date):</label>
            <input 
              type="datetime-local" 
              style={styles.input} 
              value={deadline} 
              onChange={(e) => setDeadline(e.target.value)} 
            />
          </div>
        </div>

        <div style={{marginTop: 15}}>
            <label style={styles.label}>👥 Target Siswa:</label>
            <div style={styles.tagContainer}>
              <button 
                onClick={() => setTargetType('all')} 
                style={targetType === 'all' ? styles.tagActive : styles.tag}
              >Semua Kelas</button>
              {availableGrades.map(grade => (
                <button 
                  key={grade} 
                  onClick={() => {setTargetType('grade'); setSelectedGrade(grade);}} 
                  style={(targetType === 'grade' && selectedGrade === grade) ? styles.tagActive : styles.tag}
                >{grade}</button>
              ))}
            </div>
        </div>

        {/* LIST BLOK MATERI (Mempertahankan Fungsi Asli) */}
        <div style={{ marginTop: '30px' }}>
          {contentBlocks.map((block, index) => (
            <div key={block.id} style={styles.blockItem}>
              <div style={styles.blockHeader}>
                <span>BAGIAN {index + 1}: {block.type.toUpperCase()}</span>
                <button onClick={() => setContentBlocks(contentBlocks.filter(b => b.id !== block.id))} style={styles.btnDel}><Trash2 size={16}/></button>
              </div>
              <input 
                placeholder="Sub Judul..." 
                style={styles.subInput} 
                value={block.title} 
                onChange={(e) => {
                  const newBlocks = [...contentBlocks];
                  newBlocks[index].title = e.target.value;
                  setContentBlocks(newBlocks);
                }}
              />
              {block.type === 'materi' && <textarea style={styles.textArea} value={block.content} onChange={(e) => {
                const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
              }}/>}
              {block.type === 'media' && (
                <input 
                    style={styles.input} 
                    placeholder="Link Video/PPT..." 
                    value={block.content} 
                    onChange={(e) => {
                        const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
                    }}
                />
              )}
              {block.type === 'assignment' && (
                <textarea 
                    style={styles.textArea} 
                    placeholder="Instruksi Tugas..." 
                    value={block.content} 
                    onChange={(e) => {
                        const b = [...contentBlocks]; b[index].content = e.target.value; setContentBlocks(b);
                    }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.btnGroup}>
          <button onClick={() => addBlock('materi')} style={styles.btnTool} title="Teks"><Type size={18}/></button>
          <button onClick={() => addBlock('media')} style={styles.btnTool} title="Media/PPT"><Video size={18}/></button>
          <button onClick={() => addBlock('assignment')} style={styles.btnTool} title="Tugas"><FilePlus size={18}/></button>
          <button onClick={() => addBlock('quiz')} style={styles.btnTool} title="Kuis"><HelpCircle size={18}/></button>
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
  
  // Gaya baru untuk Upload
  uploadWrapper: { display: 'flex', flexDirection: 'column', gap: '10px' },
  fileInput: { display: 'none' },
  customFileUpload: { background: '#f1f5f9', padding: '10px', borderRadius: '8px', textAlign: 'center', cursor: 'pointer', fontSize: '13px', border: '1px dashed #cbd5e1' },
  previewContainer: { display: 'flex', alignItems: 'center', gap: '10px' },
  miniPreview: { width: '50px', height: '50px', borderRadius: '5px', objectFit: 'cover' },
  btnRemoveImg: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: '4px 8px', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' },

  blockItem: { border: '1px solid #e2e8f0', padding: '20px', borderRadius: '12px', marginBottom: '15px', background: '#fff' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '11px', fontWeight: 'bold', color: '#64748b' },
  subInput: { width: '100%', border: 'none', borderBottom: '1px solid #eee', marginBottom: '15px', padding: '8px 0', fontSize: '16px', fontWeight: '600', outline: 'none' },
  textArea: { width: '100%', minHeight: '100px', border: '1px solid #eee', padding: '10px', borderRadius: '8px', outline: 'none', fontSize: '14px' },
  btnDel: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  tagContainer: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' },
  tag: { padding: '6px 15px', borderRadius: '20px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', fontSize: '12px' },
  tagActive: { padding: '6px 15px', borderRadius: '20px', background: '#673ab7', color: 'white', border: '1px solid #673ab7', cursor: 'pointer', fontSize: '12px' },
  footer: { position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 20px', borderRadius: '50px', display: 'flex', gap: '30px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', alignItems: 'center', zIndex: 100 },
  btnGroup: { display: 'flex', gap: '15px' },
  btnTool: { border: 'none', background: '#f0f0f0', width: '45px', height: '45px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnPublish: { background: '#27ae60', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' },
};

export default ManageMateri;