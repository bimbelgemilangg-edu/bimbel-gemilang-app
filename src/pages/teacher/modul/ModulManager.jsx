import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { Plus, Book, Calendar, Trash2, Edit, ClipboardList, Search } from 'lucide-react';
import ManageMateri from './ManageMateri'; // File input materi kamu
import CekTugasSiswa from './CekTugasSiswa'; // File cek tugas yang kita buat tadi

const ModulManager = () => {
  const [view, setView] = useState('list'); // 'list', 'create', 'edit', 'check'
  const [moduls, setModuls] = useState([]);
  const [selectedModul, setSelectedModul] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchModuls();
  }, [view]);

  const fetchModuls = async () => {
    const q = query(collection(db, "bimbel_modul"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setModuls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus modul ini secara permanen?")) {
      await deleteDoc(doc(db, "bimbel_modul", id));
      fetchModuls();
    }
  };

  // --- TAMPILAN LIST MODUL (SEPERTI DI SCREENSHOT KAMU) ---
  if (view === 'list') {
    return (
      <div style={st.container}>
        <div style={st.header}>
          <div>
            <h2 style={{margin:0}}>E-Learning Builder</h2>
            <p style={{color:'#64748b', fontSize:14}}>Susun materi pembelajaran modular untuk siswa.</p>
          </div>
          <button onClick={() => setView('create')} style={st.btnCreate}>
            <Plus size={18}/> Buat Modul Baru
          </button>
        </div>

        <div style={st.searchRow}>
          <div style={st.searchBar}>
            <Search size={18} color="#94a3b8"/>
            <input 
              placeholder="Cari judul modul..." 
              style={st.searchInput}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={st.grid}>
          {moduls.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase())).map(m => (
            <div key={m.id} style={st.card}>
              <div style={st.cardTop}>
                <div style={st.iconBox}><Book size={20} color="#673ab7"/></div>
                <span style={st.badge}>{m.target?.type === 'all' ? 'Umum' : m.target?.grade || 'Privat'}</span>
              </div>
              
              <h3 style={st.cardTitle}>{m.title}</h3>
              <p style={st.cardDesc}>{m.desc?.substring(0, 60)}...</p>
              
              <div style={st.cardDate}>
                <Calendar size={14}/> {m.deadline ? new Date(m.deadline).toLocaleDateString() : 'Tanpa Tgl'}
              </div>

              <div style={st.actionRow}>
                {/* TOMBOL CEK TUGAS */}
                <button 
                  onClick={() => { setSelectedModul(m); setView('check'); }} 
                  style={st.btnActionCheck}
                  title="Cek Pengumpulan Siswa"
                >
                  <ClipboardList size={16}/> Cek Tugas
                </button>
                
                {/* TOMBOL EDIT */}
                <button 
                  onClick={() => { setSelectedModul(m); setView('edit'); }} 
                  style={st.btnActionEdit}
                >
                  <Edit size={16}/> Edit
                </button>

                <button onClick={() => handleDelete(m.id)} style={st.btnDel}>
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- NAVIGASI KE VIEW LAIN ---
  if (view === 'create') return <ManageMateri onBack={() => setView('list')} />;
  if (view === 'edit') return <ManageMateri editData={selectedModul} onBack={() => setView('list')} />;
  if (view === 'check') return (
    <div>
      <button onClick={() => setView('list')} style={st.btnBackList}><ArrowLeft size={18}/> Kembali ke Daftar</button>
      <CekTugasSiswa filterModulId={selectedModul.id} />
    </div>
  );
};

const st = {
  container: { padding: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  btnCreate: { background: '#673ab7', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  searchRow: { marginBottom: '25px' },
  searchBar: { background: 'white', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px' },
  card: { background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #f1f5f9', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
  cardTop: { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' },
  iconBox: { width: '40px', height: '40px', background: '#f3e8ff', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  badge: { background: '#f1f5f9', color: '#64748b', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
  cardTitle: { margin: '0 0 10px 0', fontSize: '18px', color: '#1e293b' },
  cardDesc: { fontSize: '13px', color: '#94a3b8', margin: '0 0 15px 0', lineHeight: 1.5 },
  cardDate: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '12px', color: '#94a3b8', marginBottom: '20px' },
  actionRow: { display: 'flex', gap: '10px', borderTop: '1px solid #f1f5f9', paddingTop: '15px' },
  btnActionCheck: { flex: 2, background: '#f0f7ff', color: '#007bff', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '12px', fontWeight: 'bold' },
  btnActionEdit: { flex: 1, background: '#f8fafc', color: '#64748b', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: '12px' },
  btnDel: { background: '#fff1f2', color: '#e11d48', border: 'none', width: '35px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  btnBackList: { background: 'none', border: 'none', marginBottom: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', color: '#64748b' }
};

export default ModulManager;