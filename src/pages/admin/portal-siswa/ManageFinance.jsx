import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase'; 
import { collection, getDocs, doc, updateDoc, query } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Search, User, ArrowRight, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ManageFinance = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // VALIDASI LOGIN ADMIN (Sesuai App.js kamu)
  useEffect(() => {
    const isAuth = localStorage.getItem('isLoggedIn') === 'true';
    const role = localStorage.getItem('role');
    if (!isAuth || role !== 'admin') {
      navigate('/'); // Jika bukan admin, tendang ke login utama
    }
  }, [navigate]);

  const fetchStudents = async () => {
    try {
      const snap = await getDocs(query(collection(db, "students")));
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetch:", err);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const toggleBlock = async (id, currentStatus) => {
    const action = currentStatus ? "Buka Akses" : "Blokir Akses";
    if (!window.confirm(`Yakin ingin ${action} portal siswa ini?`)) return;
    try {
      await updateDoc(doc(db, "students", id), { isBlocked: !currentStatus });
      fetchStudents();
    } catch (err) { alert("Error mengubah status akses"); }
  };

  const filtered = students.filter(s => s.nama?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div style={admStyles.container}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '25px'}}>
        <h2 style={admStyles.title}>🛡️ Kontrol Akses & Keuangan</h2>
        <div style={admStyles.badgeStatus}>{students.length} Total Siswa</div>
      </div>

      <div style={admStyles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <input placeholder="Cari nama siswa..." style={admStyles.input} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div style={admStyles.list}>
        {filtered.map(s => (
          <div key={s.id} style={{...admStyles.row, borderLeft: s.isBlocked ? '5px solid #ef4444' : '5px solid #10b981'}}>
            <div style={admStyles.studentInfo}>
               <div style={{...admStyles.userIcon, background: s.isBlocked ? '#fee2e2' : '#f1f5f9'}}>
                 <User size={20} color={s.isBlocked ? "#ef4444" : "#64748b"} />
               </div>
               <div>
                 <div style={admStyles.name}>{s.nama} {s.isBlocked && <span style={admStyles.blockedLabel}>TERBLOKIR</span>}</div>
                 <div style={admStyles.sub}>{s.detailProgram} • Rp {s.totalBayar?.toLocaleString() || 0} Terbayar</div>
               </div>
            </div>
            
            <div style={admStyles.actions}>
                <button 
                  onClick={() => toggleBlock(s.id, s.isBlocked)} 
                  style={s.isBlocked ? admStyles.btnUnlock : admStyles.btnBlock}
                >
                  {s.isBlocked ? <ShieldCheck size={14}/> : <ShieldAlert size={14}/>}
                  {s.isBlocked ? "Buka Blokir" : "Blokir Akses"}
                </button>
                {/* Arahkan ke rute finance admin yang sudah ada di App.js */}
                <button onClick={() => navigate(`/admin/students/finance/${s.id}`)} style={admStyles.btnDetail}>
                   <Wallet size={14}/> Kelola Pembayaran
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const admStyles = {
  container: { padding: '30px', background: '#f8fafc', minHeight: '100vh', marginLeft: '250px' }, // Tambah margin left jika ada sidebar
  title: { color: '#1e293b', margin: 0, fontWeight: '800' },
  badgeStatus: { background: '#e2e8f0', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' },
  searchBox: { background: 'white', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' },
  input: { border: 'none', outline: 'none', width: '100%', fontWeight: '500' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  row: { background: 'white', padding: '18px', borderRadius: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  studentInfo: { display: 'flex', alignItems: 'center', gap: '15px' },
  userIcon: { width: '45px', height: '45px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: 'bold', fontSize: '15px', color: '#334155' },
  sub: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  blockedLabel: { background: '#ef4444', color: 'white', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', marginLeft: '8px' },
  actions: { display: 'flex', gap: '10px' },
  btnBlock: { background: '#fee2e2', color: '#b91c1c', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700' },
  btnUnlock: { background: '#dcfce7', color: '#15803d', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '700' },
  btnDetail: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600' }
};

export default ManageFinance;