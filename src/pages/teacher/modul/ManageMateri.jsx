import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  Plus, 
  Trash2, 
  Type, 
  FileUp, 
  Video, 
  HelpCircle, 
  Save,
  Users,
  Calendar
} from 'lucide-react';

const ManageMateri = () => {
  const [title, setTitle] = useState("");
  const [targetClass, setTargetClass] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  
  // State untuk menyimpan bagian-bagian form secara dinamis
  const [sections, setSections] = useState([
    { id: Date.now(), type: 'text', label: 'Materi Teks', content: '' }
  ]);

  const addSection = (type) => {
    const newSection = {
      id: Date.now(),
      type: type,
      label: type === 'text' ? 'Materi Teks' : type === 'file' ? 'Upload Tugas' : type === 'video' ? 'Link Video' : 'Kuis Link',
      content: '',
      description: '' // Tambahan untuk instruksi tugas
    };
    setSections([...sections, newSection]);
  };

  const removeSection = (id) => {
    setSections(sections.filter(s => s.id !== id));
  };

  const updateSection = (id, field, value) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSaveModul = async () => {
    if (!title || !targetClass || !releaseDate) return alert("Lengkapi info dasar modul!");
    
    try {
      await addDoc(collection(db, "bimbel_modul"), {
        title,
        targetClass,
        releaseDate,
        releaseTimestamp: new Date(releaseDate).getTime(),
        sections, // Menyimpan semua array section ke Firebase
        createdAt: serverTimestamp(),
        isOpen: true,
        author: JSON.parse(localStorage.getItem('teacherData'))?.nama || "Guru"
      });
      alert("Modul Pembelajaran Berhasil Diterbitkan! ✨");
      setTitle(""); setSections([{ id: Date.now(), type: 'text', label: 'Materi Teks', content: '' }]);
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan modul.");
    }
  };

  return (
    <div style={styles.builderContainer}>
      {/* HEADER INFO */}
      <div style={styles.card}>
        <h3 style={styles.sectionTitle}><Type size={20} /> Informasi Pembelajaran</h3>
        <div style={styles.row}>
          <input 
            placeholder="Judul Pembelajaran (Contoh: Aljabar Minggu 1)" 
            value={title} onChange={(e) => setTitle(e.target.value)}
            style={styles.inputMain} 
          />
        </div>
        <div style={styles.row}>
          <div style={{flex:1}}>
            <label style={styles.label}><Users size={14}/> Untuk Kelas:</label>
            <select value={targetClass} onChange={(e)=>setTargetClass(e.target.value)} style={styles.input}>
                <option value="">Pilih Kelas</option>
                <option value="7">Kelas 7</option>
                <option value="8">Kelas 8</option>
                <option value="9">Kelas 9</option>
            </select>
          </div>
          <div style={{flex:1}}>
            <label style={styles.label}><Calendar size={14}/> Tanggal Rilis:</label>
            <input type="date" value={releaseDate} onChange={(e)=>setReleaseDate(e.target.value)} style={styles.input} />
          </div>
        </div>
      </div>

      {/* DYNAMIC SECTIONS (G-FORM STYLE) */}
      {sections.map((section, index) => (
        <div key={section.id} style={styles.sectionCard}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionBadge}>{index + 1}. {section.label}</span>
            <button onClick={() => removeSection(section.id)} style={styles.btnDelete}><Trash2 size={16}/></button>
          </div>

          {section.type === 'text' && (
            <textarea 
              placeholder="Tuliskan isi materi di sini..." 
              value={section.content}
              onChange={(e) => updateSection(section.id, 'content', e.target.value)}
              style={styles.textarea}
            />
          )}

          {(section.type === 'file' || section.type === 'video' || section.type === 'quiz') && (
            <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
              <input 
                placeholder={section.type === 'video' ? "Masukkan Link YouTube" : "Masukkan Link URL (Drive/Form)"} 
                value={section.content}
                onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                style={styles.input}
              />
              <textarea 
                placeholder="Tambahkan keterangan atau instruksi..." 
                value={section.description}
                onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                style={{...styles.textarea, height: '60px'}}
              />
            </div>
          )}
        </div>
      ))}

      {/* ADD SECTION BUTTONS */}
      <div style={styles.toolbox}>
        <p style={{fontSize:'12px', fontWeight:'bold', color:'#64748b', marginBottom:'10px'}}>TAMBAH BAGIAN:</p>
        <div style={styles.btnGroup}>
          <button onClick={() => addSection('text')} style={styles.toolBtn}><Type size={16}/> Teks</button>
          <button onClick={() => addSection('file')} style={styles.toolBtn}><FileUp size={16}/> Tugas</button>
          <button onClick={() => addSection('video')} style={styles.toolBtn}><Video size={16}/> Video</button>
          <button onClick={() => addSection('quiz')} style={styles.toolBtn}><HelpCircle size={16}/> Kuis</button>
        </div>
      </div>

      <button onClick={handleSaveModul} style={styles.btnSave}>
        <Save size={20} /> PUBLIKASIKAN PEMBELAJARAN
      </button>
    </div>
  );
};

const styles = {
  builderContainer: { display: 'flex', flexDirection: 'column', gap: '20px' },
  card: { background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  sectionCard: { background: 'white', padding: '20px', borderRadius: '12px', borderLeft: '5px solid #3b82f6', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  sectionBadge: { fontSize: '12px', fontWeight: 'bold', color: '#3b82f6', background: '#eff6ff', padding: '4px 12px', borderRadius: '20px' },
  sectionTitle: { fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' },
  row: { display: 'flex', gap: '15px', marginBottom: '15px' },
  inputMain: { width: '100%', padding: '12px', fontSize: '18px', fontWeight: 'bold', border: 'none', borderBottom: '2px solid #e2e8f0', outline: 'none' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  label: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: 'bold', color: '#64748b', marginBottom: '5px' },
  textarea: { width: '100%', height: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', resize: 'vertical' },
  toolbox: { background: '#f1f5f9', padding: '15px', borderRadius: '12px', textAlign: 'center' },
  btnGroup: { display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' },
  toolBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 15px', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', fontSize: '13px' },
  btnDelete: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' },
  btnSave: { padding: '15px', background: '#059669', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }
};

export default ManageMateri;