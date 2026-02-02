import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";

const Dashboard = () => {
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({ siswa: 0, guru: 0, tagihan: 0 });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]); // State untuk Log Guru

  // TO-DO LIST (Local Storage)
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('adminTodos');
    return saved ? JSON.parse(saved) : [
        { id: 1, text: "Cek stok spidol", done: false },
        { id: 2, text: "Konfirmasi guru pengganti", done: true }
    ];
  });
  const [newTodo, setNewTodo] = useState("");

  // 1. JAM & TANGGAL
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. LOAD DATA (TERMASUK LOG GURU)
  useEffect(() => {
    const fetchData = async () => {
        try {
            // A. DATA STATISTIK
            const snapSiswa = await getDocs(collection(db, "students"));
            const snapGuru = await getDocs(collection(db, "teachers"));
            
            // B. LOG AKTIVITAS GURU (TERBARU) - Ini solusi agar muncul di dashboard
            const qLogs = query(
                collection(db, "teacher_logs"), 
                orderBy("tanggal", "desc"),
                limit(5) // Ambil 5 data terakhir saja agar ringan
            );
            const snapLogs = await getDocs(qLogs);
            const logsData = snapLogs.docs.map(d => ({id: d.id, ...d.data()}));
            // Sortir lagi by waktu untuk akurasi jam di hari yang sama
            logsData.sort((a,b) => new Date(b.tanggal + ' ' + b.waktu) - new Date(a.tanggal + ' ' + a.waktu));
            setRecentLogs(logsData);

            // C. JADWAL HARI INI
            const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
            const todayName = days[new Date().getDay()];
            
            const qJadwal = query(collection(db, "jadwal_bimbel"), where("day", "==", todayName));
            const snapJadwal = await getDocs(qJadwal);
            const jadwalList = snapJadwal.docs.map(d => ({id: d.id, ...d.data()}));
            jadwalList.sort((a,b) => a.start.localeCompare(b.start));
            setTodaySchedules(jadwalList);

            // D. TAGIHAN
            const tagihanList = [];
            snapSiswa.forEach(doc => {
                const s = doc.data();
                const sisa = (parseInt(s.totalTagihan)||0) - (parseInt(s.totalBayar)||0);
                if(sisa > 0) {
                    tagihanList.push({
                        id: doc.id,
                        nama: s.nama,
                        hp: s.ortu?.hp || "",
                        sisa: sisa,
                        program: s.detailProgram
                    });
                }
            });
            setDuePayments(tagihanList.slice(0, 5));

            setStats({
                siswa: snapSiswa.size,
                guru: snapGuru.size,
                tagihan: tagihanList.length
            });

        } catch (err) {
            console.error("Gagal load dashboard", err);
        }
    };
    fetchData();
  }, []);

  // FUNGSI BEL SEKOLAH
  const handleRingBell = () => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(error => alert("Klik interaksi dokumen dulu!"));
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  // LOGIC TODO LIST
  const addTodo = (e) => {
    e.preventDefault();
    if(!newTodo) return;
    const newList = [...todos, { id: Date.now(), text: newTodo, done: false }];
    setTodos(newList);
    localStorage.setItem('adminTodos', JSON.stringify(newList));
    setNewTodo("");
  };

  const toggleTodo = (id) => {
    const newList = todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    setTodos(newList);
    localStorage.setItem('adminTodos', JSON.stringify(newList));
  };

  const deleteTodo = (id) => {
    const newList = todos.filter(t => t.id !== id);
    setTodos(newList);
    localStorage.setItem('adminTodos', JSON.stringify(newList));
  };

  const sendWA = (p) => {
    const text = `Halo Wali Murid ${p.nama}, mengingatkan tagihan bimbel tersisa Rp ${p.sisa.toLocaleString()}. Mohon segera diselesaikan. Terima kasih.`;
    window.open(`https://wa.me/${p.hp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={styles.mainContent}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0, color:'#2c3e50', fontSize:24}}>Dashboard Admin</h2>
            <p style={{margin:'5px 0 0 0', color:'#7f8c8d', fontSize:14}}>
                {time.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}
            </p>
          </div>
          
          <div style={{display:'flex', alignItems:'center', gap:15}}>
            <button onClick={handleRingBell} style={styles.btnBell} title="Bunyikan Bel">🔔 BEL MASUK</button>
            <div style={styles.clockBox}>
                🕒 {time.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* 1. KARTU STATISTIK */}
        <div style={styles.gridStats}>
          <div style={styles.cardStat}>
            <div style={styles.iconBox}>👨‍🎓</div>
            <div><h3 style={styles.statNumber}>{stats.siswa}</h3><small style={styles.statLabel}>Total Siswa</small></div>
          </div>
          <div style={styles.cardStat}>
            <div style={{...styles.iconBox, background:'#e8f6f3', color:'#1abc9c'}}>👨‍🏫</div>
            <div><h3 style={styles.statNumber}>{stats.guru}</h3><small style={styles.statLabel}>Guru Aktif</small></div>
          </div>
          <div style={styles.cardStat}>
            <div style={{...styles.iconBox, background:'#fef5e7', color:'#f39c12'}}>⚠️</div>
            <div><h3 style={{...styles.statNumber, color:'#e67e22'}}>{stats.tagihan}</h3><small style={styles.statLabel}>Tunggakan</small></div>
          </div>
        </div>

        {/* 2. LIVE MONITORING GURU (FITUR YANG DIMINTA) */}
        <div style={{...styles.cardContent, marginBottom: 20}}>
            <div style={styles.sectionHeader}>
                <h3 style={{margin:0, color:'#2c3e50', display:'flex', alignItems:'center', gap:10}}>
                   📡 Live Aktivitas Mengajar <span style={{fontSize:12, fontWeight:'normal', color:'#777'}}>(Realtime Update)</span>
                </h3>
            </div>
            {recentLogs.length === 0 ? (
                <p style={{color:'#999', fontStyle:'italic'}}>Belum ada aktivitas guru hari ini.</p>
            ) : (
                <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                    <thead>
                        <tr style={{background:'#f8f9fa', textAlign:'left', color:'#666'}}>
                            <th style={{padding:10}}>Waktu</th>
                            <th style={{padding:10}}>Guru</th>
                            <th style={{padding:10}}>Program</th>
                            <th style={{padding:10}}>Materi</th>
                            <th style={{padding:10}}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentLogs.map(log => (
                            <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:10}}>{log.tanggal} <br/><span style={{color:'#888'}}>{log.waktu}</span></td>
                                <td style={{padding:10, fontWeight:'bold'}}>{log.namaGuru || "Guru"}</td>
                                <td style={{padding:10}}>{log.program}</td>
                                <td style={{padding:10}}>{log.detail}</td>
                                <td style={{padding:10}}>
                                    <span style={{
                                        padding:'3px 8px', borderRadius:10, fontSize:11,
                                        background: log.status === 'Selesai' ? '#d4edda' : '#fff3cd',
                                        color: log.status === 'Selesai' ? '#155724' : '#856404'
                                    }}>
                                        {log.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            )}
        </div>

        {/* 3. GRID BAWAH: JADWAL & TAGIHAN */}
        <div style={styles.contentGrid}>
            {/* KIRI: JADWAL */}
            <div style={{flex: 2}}>
                <div style={{...styles.cardContent, minHeight: 400}}>
                    <div style={styles.sectionHeader}>
                        <h3 style={{margin:0, color:'#2c3e50'}}>📅 Jadwal Kelas Hari Ini</h3>
                    </div>
                    {todaySchedules.length === 0 ? (
                        <div style={{textAlign:'center', padding:40, color:'#999'}}>Tidak ada kelas aktif hari ini.</div>
                    ) : (
                        todaySchedules.map(sc => (
                            <div key={sc.id} style={styles.scheduleItem}>
                                <div style={{minWidth:80, fontWeight:'bold', color:'#3498db'}}>{sc.start} - {sc.end}</div>
                                <div style={{flex:1}}>
                                    <div style={{fontWeight:'bold', color:'#2c3e50'}}>{sc.title}</div>
                                    <div style={{fontSize:12, color:'#7f8c8d'}}>{sc.program} • {sc.planet}</div>
                                </div>
                                <div style={{textAlign:'right'}}>
                                    <span style={{fontSize:12, background:'#f4f4f4', padding:'4px 8px', borderRadius:5}}>{sc.booker}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* KANAN: TAGIHAN & TO-DO */}
            <div style={{flex: 1, display:'flex', flexDirection:'column', gap:20}}>
                {/* TAGIHAN WA */}
                <div style={styles.cardWarning}>
                    <h4 style={{marginTop:0, color:'#c0392b'}}>⚠️ Tagihan Prioritas</h4>
                    <div style={{maxHeight:200, overflowY:'auto'}}>
                        {duePayments.map((p, i) => (
                            <div key={i} style={styles.billItem}>
                                <div>
                                    <div style={{fontWeight:'bold', fontSize:13}}>{p.nama}</div>
                                    <div style={{fontSize:11, color:'#e74c3c'}}>Rp {p.sisa.toLocaleString()}</div>
                                </div>
                                <button onClick={() => sendWA(p)} style={styles.btnWa}>💬 WA</button>
                            </div>
                        ))}
                        {duePayments.length === 0 && <small>Aman.</small>}
                    </div>
                </div>

                {/* TO-DO LIST */}
                <div style={styles.cardTodo}>
                    <h4 style={{marginTop:0, color:'#2c3e50'}}>📝 Catatan Admin</h4>
                    <form onSubmit={addTodo} style={{display:'flex', gap:5, marginBottom:10}}>
                        <input type="text" placeholder="Tulis tugas..." value={newTodo} onChange={e=>setNewTodo(e.target.value)} style={styles.inputTodo}/>
                        <button type="submit" style={styles.btnAdd}>+</button>
                    </form>
                    <div style={{maxHeight:150, overflowY:'auto'}}>
                        {todos.map(t => (
                            <div key={t.id} style={styles.todoItem}>
                                <div onClick={()=>toggleTodo(t.id)} style={{flex:1, cursor:'pointer', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#999' : '#333'}}>
                                    {t.done ? '✅' : '⬜'} {t.text}
                                </div>
                                <button onClick={()=>deleteTodo(t.id)} style={{border:'none', background:'transparent', color:'#ccc'}}>x</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// STYLES
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', fontFamily:'Segoe UI, sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  clockBox: { background:'white', padding:'10px 20px', borderRadius:20, fontWeight:'bold', color:'#3498db', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  btnBell: { background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(231, 76, 60, 0.3)', display: 'flex', alignItems: 'center', gap: '5px' },
  
  gridStats: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '30px' },
  cardStat: { background: 'white', padding: '20px', borderRadius: '12px', display:'flex', alignItems:'center', gap:15, boxShadow:'0 2px 5px rgba(0,0,0,0.03)' },
  iconBox: { width:50, height:50, borderRadius:'50%', background:'#eaf2f8', color:'#3498db', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 },
  statNumber: { margin:0, fontSize:24, color:'#2c3e50' },
  statLabel: { color:'#7f8c8d', fontSize:12 },

  contentGrid: { display: 'flex', gap: '20px', flexDirection: 'row', alignItems: 'flex-start' },
  sectionHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15, paddingBottom:10, borderBottom:'1px solid #f0f0f0' },
  cardContent: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow:'0 2px 5px rgba(0,0,0,0.03)' },
  scheduleItem: { display:'flex', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f4f6f7' },

  cardWarning: { background: '#fff5f5', padding: '20px', borderRadius: '12px', border:'1px solid #fadbd8' },
  billItem: { display:'flex', justifyContent:'space-between', alignItems:'center', background:'white', padding:10, borderRadius:8, marginBottom:8, boxShadow:'0 1px 2px rgba(0,0,0,0.05)' },
  btnWa: { background:'#27ae60', color:'white', border:'none', borderRadius:5, padding:'5px 10px', cursor:'pointer', fontWeight:'bold', fontSize:11 },

  cardTodo: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow:'0 2px 5px rgba(0,0,0,0.03)' },
  inputTodo: { flex:1, padding:8, borderRadius:5, border:'1px solid #ddd' },
  btnAdd: { padding:'8px 15px', background:'#2c3e50', color:'white', border:'none', borderRadius:5, cursor:'pointer' },
  todoItem: { display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px dashed #eee', fontSize:13 }
};

export default Dashboard;