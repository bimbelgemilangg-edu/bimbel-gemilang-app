import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Save, Plus, Type, Video, FileText, HelpCircle, ArrowLeft, Clock } from 'lucide-react';
import ManageQuiz from './ManageQuiz';

const ManageMateri = ({ onBack }) => {
  const [header, setHeader] = useState({ title: '', desc: '' });
  const [blocks, setBlocks] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [targetClass, setTargetClass] = useState('Semua Kelas');

  const addBlock = (type) => {
    const newBlock = { 
      id: Date.now().toString(), 
      type, 
      title: '', 
      content: '', 
      quizData: type === 'quiz' ? [] : null 
    };
    setBlocks([...blocks, newBlock]);
  };

  const handlePublish = async () => {
    if (!header.title || !deadline) return alert("Isi Judul dan Tenggat Waktu!");
    
    try {
      const teacherData = JSON.parse(localStorage.getItem('teacherData'));
      await addDoc(collection(db, "bimbel_modul"), {
        ...header,
        contentBlocks: blocks,
        deadline: deadline,
        targetClass: targetClass,
        authorId: teacherData.uid || 'unknown',
        authorName: teacherData.nama,
        createdAt: serverTimestamp()
      });
      alert("Modul Berhasil Dipublikasikan!");
      onBack();
    } catch (e) {
      console.error(e);
      alert("Error saat menyimpan ke Firebase");
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', border: 'none', background: 'none', cursor: 'pointer', marginBottom: '20px' }}>
        <ArrowLeft size={18}/> Kembali
      </button>

      {/* HEADER SECTION */}
      <div style={{ background: 'white', padding: '30px', borderRadius: '12px', borderTop: '10px solid #673ab7', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <input 
          style={{ width: '100%', fontSize: '28px', border: 'none', borderBottom: '1px solid #eee', marginBottom: '15px', outline: 'none', fontWeight: 'bold' }} 
          placeholder="Judul Modul..."
          onChange={e => setHeader({...header, title: e.target.value})}
        />
        <textarea 
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'none', color: '#666' }} 
          placeholder="Deskripsi..."
          onChange={e => setHeader({...header, desc: e.target.value})}
        />
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
          <div>
            <label style={{ fontSize: '12px', display: 'block' }}><Clock size={12}/> Tenggat Waktu:</label>
            <input type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', display: 'block' }}>Target Siswa:</label>
            <select value={targetClass} onChange={e => setTargetClass(e.target.value)} style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>Semua Kelas</option>
              <option>Kelas 7</option>
              <option>Kelas 8</option>
              <option>Kelas 9</option>
            </select>
          </div>
        </div>
      </div>

      {/* DYNAMIC BLOCKS */}
      <div style={{ marginTop: '20px' }}>
        {blocks.map((block, idx) => (
          <div key={block.id} style={{ background: 'white', padding: '20px', borderRadius: '10px', marginBottom: '15px', borderLeft: '5px solid #4285f4' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#4285f4' }}>Bagian {idx + 1}: {block.type.toUpperCase()}</h4>
            
            {block.type !== 'quiz' && (
              <input 
                placeholder="Sub Judul..." 
                style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '5px', border: '1px solid #eee' }}
                onChange={e => {
                  const newBlocks = [...blocks];
                  newBlocks[idx].title = e.target.value;
                  setBlocks(newBlocks);
                }}
              />
            )}

            {block.type === 'materi' && (
              <textarea 
                placeholder="Isi materi teks..." 
                style={{ width: '100%', height: '100px', padding: '10px', border: '1px solid #eee' }}
                onChange={e => {
                  const newBlocks = [...blocks];
                  newBlocks[idx].content = e.target.value;
                  setBlocks(newBlocks);
                }}
              />
            )}

            {block.type === 'quiz' && (
              <ManageQuiz 
                questions={block.quizData} 
                setQuestions={(data) => {
                  const newBlocks = [...blocks];
                  newBlocks[idx].quizData = data;
                  setBlocks(newBlocks);
                }}
              />
            )}

            {block.type === 'media' && <input placeholder="Link Video/Embed..." style={{ width: '100%', padding: '10px' }} onChange={e => { const nb = [...blocks]; nb[idx].content = e.target.value; setBlocks(nb); }}/>}
          </div>
        ))}
      </div>

      {/* TOOLBAR */}
      <div style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px 25px', borderRadius: '50px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', gap: '20px' }}>
        <button onClick={() => addBlock('materi')} style={s.toolBtn}><Type size={20}/> Teks</button>
        <button onClick={() => addBlock('media')} style={s.toolBtn}><Video size={20}/> Video</button>
        <button onClick={() => addBlock('assignment')} style={s.toolBtn}><FileText size={20}/> Tugas</button>
        <button onClick={() => addBlock('quiz')} style={s.toolBtn}><HelpCircle size={20}/> Kuis</button>
        <div style={{ width: '1px', background: '#eee' }}></div>
        <button onClick={handlePublish} style={{ ...s.toolBtn, color: 'green', fontWeight: 'bold' }}><Save size={20}/> PUBLISH</button>
      </div>
    </div>
  );
};

const s = {
  toolBtn: { border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '10px', gap: '5px', color: '#555' }
};

export default ManageMateri;