import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  Plus, Trash2, Video, FileText, HelpCircle, Save, 
  ArrowLeft, Type, Link as LinkIcon, Image as ImageIcon, Settings, Users, Calendar
} from 'lucide-react';

const ManageMateri = ({ onBack }) => {
  const [header, setHeader] = useState({ title: '', desc: '' });
  const [blocks, setBlocks] = useState([]);
  const [config, setConfig] = useState({ target: 'Semua Kelas', releaseDate: '', dueDate: '' });

  const addBlock = (type) => {
    setBlocks([...blocks, { 
      id: Date.now().toString(), 
      type, 
      content: '', 
      title: '', 
      description: '', 
      isRequired: false 
    }]);
  };

  const updateBlock = (id, field, val) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: val } : b));
  };

  const handlePublish = async () => {
    if (!header.title) return alert("Mohon isi Judul Modul utama!");
    try {
      await addDoc(collection(db, "bimbel_modul"), {
        ...header,
        contentBlocks: blocks,
        settings: config,
        createdAt: serverTimestamp(),
        author: JSON.parse(localStorage.getItem('teacherData'))?.nama || "Guru Gemilang"
      });
      alert("Modul Berhasil Dipublikasikan ke Siswa! ✨");
      onBack();
    } catch (e) { 
      console.error(e);
      alert("Gagal mempublikasikan modul.");
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '20px 20px 100px 20px' }}>
      <button onClick={onBack} style={s.backBtn}>
        <ArrowLeft size={18}/> Kembali ke Daftar
      </button>

      {/* HEADER: JUDUL & DESKRIPSI */}
      <div style={s.headerCard}>
        <input 
          style={s.titleInput} 
          placeholder="Judul Pembelajaran (Contoh: Matematika Dasar - Aljabar)"
          onChange={e => setHeader({...header, title: e.target.value})}
        />
        <textarea 
          style={s.descInput} 
          placeholder="Tambahkan deskripsi modul atau instruksi umum di sini..."
          onChange={e => setHeader({...header, desc: e.target.value})}
        />
        
        <div style={s.configRow}>
           <div style={s.configItem}>
              <label><Users size={14}/> Target Kelas</label>
              <select onChange={e => setConfig({...config, target: e.target.value})} style={s.select}>
                 <option>Semua Kelas</option>
                 <option>Kelas 7</option>
                 <option>Kelas 8</option>
                 <option>Kelas 9</option>
              </select>
           </div>
           <div style={s.configItem}>
              <label><Calendar size={14}/> Tanggal Rilis</label>
              <input type="date" onChange={e => setConfig({...config, releaseDate: e.target.value})} style={s.select} />
           </div>
        </div>
      </div>

      {/* RENDER MODULAR BLOCKS */}
      {blocks.map((block, index) => (
        <div key={block.id} style={s.blockCard}>
          <div style={s.blockHeader}>
            <span style={s.blockBadge}>BAGIAN {index + 1}: {block.type.toUpperCase()}</span>
            <button onClick={() => setBlocks(blocks.filter(b => b.id !== block.id))} style={s.delBlock}><Trash2 size={16}/></button>
          </div>
          
          <input 
            placeholder={block.type === 'materi' ? "Sub-Judul Materi" : "Nama Tugas / Judul Video"}
            style={s.blockTitleInput}
            onChange={e => updateBlock(block.id, 'title', e.target.value)}
          />

          <textarea 
            placeholder={block.type === 'media' ? "Tempel Link URL (YouTube/Drive/PDF)" : "Tulis isi materi atau instruksi di sini..."}
            style={s.blockTextArea}
            onChange={e => updateBlock(block.id, 'content', e.target.value)}
          />
          
          {block.type === 'assignment' && (
            <div style={s.assignmentOpt}>
              <label><input type="checkbox" onChange={e => updateBlock(block.id, 'isRequired', e.target.checked)}/> Wajib diupload oleh siswa</label>
            </div>
          )}
        </div>
      ))}

      {/* FLOATING ACTION TOOLBAR */}
      <div style={s.floatingToolbar}>
        <p style={s.toolLabel}>TAMBAH BAGIAN</p>
        <button onClick={() => addBlock('materi')} style={s.toolBtn} title="Teks Materi"><Type/></button>
        <button onClick={() => addBlock('media')} style={s.toolBtn} title="Video/Link"><Video/></button>
        <button onClick={() => addBlock('assignment')} style={s.toolBtn} title="Slot Tugas"><FileText/></button>
        <button onClick={() => addBlock('quiz')} style={s.toolBtn} title="Kuis"><HelpCircle/></button>
      </div>

      <button onClick={handlePublish} style={s.publishBtn}>
        <Save size={20}/> TERBITKAN PEMBELAJARAN
      </button>
    </div>
  );
};

const s = {
  backBtn: { display: 'flex', alignItems: 'center', gap: 5, border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', marginBottom: 20, fontWeight: '500' },
  headerCard: { background: 'white', padding: '35px', borderRadius: '15px', borderTop: '10px solid #673ab7', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' },
  titleInput: { width: '100%', fontSize: '30px', fontWeight: 'bold', border: 'none', borderBottom: '2px solid #f1f5f9', marginBottom: '15px', outline: 'none', color: '#1e293b' },
  descInput: { width: '100%', border: 'none', outline: 'none', fontSize: '16px', color: '#64748b', resize: 'none', minHeight: '60px' },
  configRow: { display: 'flex', gap: '20px', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '20px' },
  configItem: { flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' },
  select: { padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
  blockCard: { background: 'white', padding: '25px', borderRadius: '12px', marginBottom: '20px', borderLeft: '6px solid #3b82f6', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', position: 'relative' },
  blockHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  blockBadge: { fontSize: '11px', fontWeight: 'bold', color: '#3b82f6', background: '#eff6ff', padding: '4px 10px', borderRadius: '5px' },
  blockTitleInput: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', fontWeight: '600', outline: 'none', background: '#f8fafc' },
  blockTextArea: { width: '100%', minHeight: '120px', padding: '12px', borderRadius: '8px', border: '1px solid #f1f5f9', outline: 'none', resize: 'vertical' },
  delBlock: { background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' },
  floatingToolbar: { position: 'fixed', right: '40px', top: '50%', transform: 'translateY(-50%)', background: 'white', padding: '15px', borderRadius: '40px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center', border: '1px solid #f1f5f9' },
  toolBtn: { border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '5px', transition: '0.2s' },
  toolLabel: { fontSize: '9px', fontWeight: 'bold', writingMode: 'vertical-rl', color: '#94a3b8', margin: '0 0 10px 0' },
  publishBtn: { width: '100%', padding: '18px', background: '#10b981', color: 'white', border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontSize: '16px', boxShadow: '0 10px 15px rgba(16, 185, 129, 0.2)' }
};

export default ManageMateri;