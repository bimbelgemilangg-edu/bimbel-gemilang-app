import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, query } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Search, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageFinance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchStudents = async () => {
    const snap = await getDocs(query(collection(db, "students")));
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => { fetchStudents(); }, []);

  // FUNGSI SAKTI: Blokir / Buka Akses
  const toggleBlock = async (id, currentStatus) => {
    const action = currentStatus ? "Buka Akses" : "Blokir Akses";
    if (!window.confirm(`Yakin ingin ${action} untuk siswa ini?`)) return;
    
    try {
      await updateDoc(doc(db, "students", id), {
        isBlocked: !currentStatus
      });
      fetchStudents(); // Refresh data
    } catch (err) { alert("Gagal mengubah status akses"); }
  };

  const filtered = students.filter(s => s.nama?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🛡️ Access & Finance Control</h2>
      <div style={styles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <input placeholder="Cari siswa..." style={styles.input} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div style={styles.list}>
        {filtered.map(s => (
          <div key={s.id} style={{...styles.row, borderLeft: s.isBlocked ? '5px solid #ef4444' : '5px solid #10b981'}}>
            <div style={styles.studentInfo}>
               <User size={20} color={s.isBlocked ? "#ef4444" : "#64748b"} />
               <div>
                 <div style={styles.name}>{s.nama} {s.isBlocked && <span style={styles.blockedTag}>DIBLOKIR</span>}</div>
                 <div style={styles.sub}>{s.detailProgram}</div>
               </div>
            </div>
            
            <div style={styles.actions}>
                <button 
                  onClick={() => toggleBlock(s.id, s.isBlocked)} 
                  style={s.isBlocked ? styles.btnUnlock : styles.btnBlock}
                >
                  {s.isBlocked ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                  {s.isBlocked ? "Buka Blokir" : "Blokir Akses"}
                </button>
                <button onClick={() => navigate(`/admin/students/finance/${s.id}`)} style={styles.btnDetail}>
                  Detail Tagihan <ArrowRight size={14}/>
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '30px', background: '#f8fafc', minHeight: '100vh' },
  title: { color: '#1e293b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' },
  searchBox: { background: 'white', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  input: { border: 'none', outline: 'none', width: '100%' },
  row: { background: 'white', padding: '15px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  studentInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  name: { fontWeight: 'bold', fontSize: '15px' },
  sub: { fontSize: '12px', color: '#64748b' },
  blockedTag: { background: '#fee2e2', color: '#b91c1c', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', marginLeft: '10px' },
  actions: { display: 'flex', gap: '10px' },
  btnBlock: { background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' },
  btnUnlock: { background: '#dcfce7', color: '#15803d', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600' },
  btnDetail: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }
};

export default ManageFinance;