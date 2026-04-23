import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, query, where, getDocs, orderBy, limit, onSnapshot } from "firebase/firestore";

const Dashboard = () => {
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({ siswa: 0, guru: 0, tagihan: 0 });
  const [todaySchedules, setTodaySchedules] = useState([]);
  const [duePayments, setDuePayments] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [todos, setTodos] = useState(() => {
    const saved = localStorage.getItem('adminTodos');
    return saved ? JSON.parse(saved) : [
        { id: 1, text: "Cek stok spidol", done: false },
        { id: 2, text: "Konfirmasi guru pengganti", done: true }
    ];
  });
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
        const snapSiswa = await getDocs(collection(db, "students"));
        const snapGuru = await getDocs(collection(db, "teachers"));
        
        const qLogs = query(collection(db, "teacher_logs"), orderBy("tanggal", "desc"), limit(10));
        const snapLogs = await getDocs(qLogs);
        const logsData = snapLogs.docs.map(d => ({id: d.id, ...d.data()}));
        logsData.sort((a,b) => {
            const dateA = new Date(`${a.tanggal}T${a.waktu}`);
            const dateB = new Date(`${b.tanggal}T${b.waktu}`);
            return dateB - dateA;
        });
        setRecentLogs(logsData);

        const nowObj = new Date();
        const year = nowObj.getFullYear();
        const month = String(nowObj.getMonth() + 1).padStart(2, '0');
        const day = String(nowObj.getDate()).padStart(2, '0');
        const todayStr = `${year}-${month}-${day}`;

        const qJadwal = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", todayStr));
        const snapJadwal = await getDocs(qJadwal);
        const jadwalList = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));

        const currentHours = String(nowObj.getHours()).padStart(2, '0');
        const currentMinutes = String(nowObj.getMinutes()).padStart(2, '0');
        const currentTime = `${currentHours}:${currentMinutes}`;
        const activeSchedules = jadwalList.filter(s => s.end > currentTime);
        activeSchedules.sort((a,b) => a.start.localeCompare(b.start));
        setTodaySchedules(activeSchedules);

        // 🔥 PERBAIKAN: Ambil absensi & kelompokkan berdasarkan scheduleId
        const qAttendance = query(collection(db, "attendance"), where("date", "==", todayStr));
        const snapAttendance = await getDocs(qAttendance);
        const attendanceData = snapAttendance.docs.map(d => ({ id: d.id, ...d.data() }));

        const summaryArray = [];
        jadwalList.forEach(jadwal => {
          const jadwalAttendance = attendanceData.filter(record => 
            record.scheduleId === jadwal.id || record.mapel === jadwal.title
          );
          
          const jadwalStudents = jadwal.students || [];
          const hadirList = [];
          const tidakHadirList = [];
          
          jadwalAttendance.forEach(record => {
            if (record.status === "Hadir" || record.status === "hadir") {
              hadirList.push(record.studentName || record.namaSiswa);
            } else {
              tidakHadirList.push({
                nama: record.studentName || record.namaSiswa,
                status: record.status || "Alpha",
                keterangan: record.keterangan || "-"
              });
            }
          });
          
          jadwalStudents.forEach(siswa => {
            const namaSiswa = siswa.nama || siswa;
            const sudahDiHadir = hadirList.includes(namaSiswa);
            const sudahDiTidakHadir = tidakHadirList.some(t => t.nama === namaSiswa);
            if (!sudahDiHadir && !sudahDiTidakHadir) {
              tidakHadirList.push({ nama: namaSiswa, status: "Alpha", keterangan: "Belum absen" });
            }
          });
          
          summaryArray.push({
            jadwalId: jadwal.id,
            title: jadwal.title || "Kelas Umum",
            room: jadwal.planet || "Ruang Umum",
            teacher: jadwal.booker || "Guru",
            program: jadwal.program || "Reguler",
            start: jadwal.start,
            end: jadwal.end,
            totalStudents: jadwalStudents.length,
            totalHadir: hadirList.length,
            totalTidakHadir: tidakHadirList.length,
            hadir: hadirList,
            tidakHadir: tidakHadirList
          });
        });
        setAttendanceSummary(summaryArray);

        const tagihanList = [];
        snapSiswa.forEach(doc => {
            const s = doc.data();
            const sisa = (parseInt(s.totalTagihan)||0) - (parseInt(s.totalBayar)||0);
            if(sisa > 0) tagihanList.push({ id: doc.id, nama: s.nama, hp: s.ortu?.hp || "", sisa: sisa, program: s.detailProgram });
        });
        setDuePayments(tagihanList.slice(0, 5));
        setStats({ siswa: snapSiswa.size, guru: snapGuru.size, tagihan: tagihanList.length });
    } catch (err) { console.error("Gagal load dashboard", err); }
  };

  useEffect(() => {
    fetchData();
    const intervalId = setInterval(fetchData, 60000);
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "attendance"), where("date", "==", today));
    const unsubscribe = onSnapshot(q, () => fetchData());
    return () => { clearInterval(intervalId); unsubscribe(); };
  }, []);

  const handleRingBell = () => {
    const audio = new Audio('https://www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3');
    audio.play().catch(() => alert("⚠️ Browser memblokir suara. Klik layar sekali lalu coba lagi."));
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  };

  const addTodo = (e) => { e.preventDefault(); if(!newTodo) return; const newList = [...todos, { id: Date.now(), text: newTodo, done: false }]; setTodos(newList); localStorage.setItem('adminTodos', JSON.stringify(newList)); setNewTodo(""); };
  const toggleTodo = (id) => { const newList = todos.map(t => t.id === id ? { ...t, done: !t.done } : t); setTodos(newList); localStorage.setItem('adminTodos', JSON.stringify(newList)); };
  const deleteTodo = (id) => { const newList = todos.filter(t => t.id !== id); setTodos(newList); localStorage.setItem('adminTodos', JSON.stringify(newList)); };
  const sendWA = (p) => { const text = `Halo Wali Murid ${p.nama}, mengingatkan tagihan bimbel tersisa Rp ${p.sisa.toLocaleString()}. Mohon segera diselesaikan. Terima kasih.`; window.open(`https://wa.me/${p.hp}?text=${encodeURIComponent(text)}`, '_blank'); };
  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        <div style={styles.header(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}>Dashboard Admin</h2>
            <p style={styles.pageDate(isMobile)}>{time.toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
          </div>
          <div style={styles.headerRight(isMobile)}>
            <button onClick={handleRingBell} style={styles.btnBell(isMobile)}>🔔 BEL</button>
            <div style={styles.clockBox(isMobile)}>🕒 {time.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</div>
          </div>
        </div>

        <div style={styles.sectionTitle}>
          <span>📋</span> Rekap Kehadiran Hari Ini <span style={styles.liveDot}></span> LIVE
        </div>
        <div style={styles.attendanceGrid(isMobile)}>
          {attendanceSummary.length === 0 ? (
            <div style={styles.emptyState}>Belum ada data absensi hari ini.</div>
          ) : (
            attendanceSummary.map((kelas, idx) => (
              <div key={kelas.jadwalId || idx} style={styles.attendanceCard(isMobile)} onClick={() => setSelectedClass(selectedClass === idx ? null : idx)}>
                <div style={styles.classHeader}>
                  <h4 style={styles.className(isMobile)}>{kelas.title}</h4>
                  <span style={styles.roomBadge(isMobile)}>{kelas.room}</span>
                </div>
                <div style={styles.classInfo(isMobile)}>
                  <span>👨‍🏫 {kelas.teacher}</span>
                  <span>⏰ {kelas.start} - {kelas.end}</span>
                  <span style={styles.programBadge}>{kelas.program}</span>
                </div>
                <div style={styles.attendanceBar}>
                  <div style={{...styles.barHadir, width: `${kelas.totalStudents > 0 ? (kelas.totalHadir / kelas.totalStudents) * 100 : 0}%`}}>
                    {kelas.totalHadir > 0 && `✅ ${kelas.totalHadir}`}
                  </div>
                  <div style={{...styles.barTidakHadir, width: `${kelas.totalStudents > 0 ? (kelas.totalTidakHadir / kelas.totalStudents) * 100 : 0}%`}}>
                    {kelas.totalTidakHadir > 0 && `❌ ${kelas.totalTidakHadir}`}
                  </div>
                </div>
                <div style={styles.attendanceNumbers}>
                  <span>Hadir: {kelas.totalHadir}/{kelas.totalStudents}</span>
                  <span>Tidak Hadir: {kelas.totalTidakHadir}</span>
                </div>
                {selectedClass === idx && (
                  <div style={styles.detailDropdown}>
                    <div style={styles.detailSection}><strong>✅ Hadir ({kelas.hadir.length}):</strong><p>{kelas.hadir.length > 0 ? kelas.hadir.join(', ') : 'Belum ada'}</p></div>
                    <div style={styles.detailSection}><strong>❌ Tidak Hadir ({kelas.tidakHadir.length}):</strong>
                      {kelas.tidakHadir.length > 0 ? kelas.tidakHadir.map((s, i) => (
                        <div key={i} style={styles.absentItem}><span>{s.nama}</span><span style={styles.absentStatus(s.status)}>{s.status}</span><span style={styles.absentKet}>{s.keterangan}</span></div>
                      )) : <p>Semua hadir 🎉</p>}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div style={styles.gridStats(isMobile)}>
          <div style={styles.cardStat}><div style={styles.iconBox}>👨‍🎓</div><div><h3 style={styles.statNumber}>{stats.siswa}</h3><small style={styles.statLabel}>Total Siswa</small></div></div>
          <div style={styles.cardStat}><div style={{...styles.iconBox, background:'#e8f6f3', color:'#1abc9c'}}>👨‍🏫</div><div><h3 style={styles.statNumber}>{stats.guru}</h3><small style={styles.statLabel}>Guru Aktif</small></div></div>
          <div style={styles.cardStat}><div style={{...styles.iconBox, background:'#fef5e7', color:'#f39c12'}}>⚠️</div><div><h3 style={{...styles.statNumber, color:'#e67e22'}}>{stats.tagihan}</h3><small style={styles.statLabel}>Tunggakan</small></div></div>
        </div>

        <div style={styles.cardContent}>
            <div style={styles.sectionHeader}><h3 style={{margin:0, color:'#2c3e50'}}>📡 Live Aktivitas Mengajar</h3></div>
            {recentLogs.length === 0 ? <p style={{color:'#999', fontStyle:'italic', padding:10}}>Belum ada aktivitas guru hari ini.</p> : (
                <div style={{overflowX:'auto'}}><table style={styles.table}><thead><tr style={{background:'#f8f9fa', textAlign:'left', color:'#666'}}><th style={{padding:10}}>Waktu</th><th style={{padding:10}}>Guru</th><th style={{padding:10}}>Program</th><th style={{padding:10}}>Materi</th><th style={{padding:10}}>Status</th></tr></thead><tbody>{recentLogs.map(log => (
                    <tr key={log.id} style={{borderBottom:'1px solid #eee'}}><td style={{padding:10}}>{log.tanggal}<br/><span style={{color:'#888'}}>{log.waktu}</span></td><td style={{padding:10, fontWeight:'bold'}}>{log.namaGuru || "Guru"}</td><td style={{padding:10}}>{log.program}</td><td style={{padding:10}}>{log.detail}</td><td style={{padding:10}}><span style={{padding:'3px 8px', borderRadius:10, fontSize:11, background: log.status === 'Selesai' ? '#d4edda' : '#fff3cd', color: log.status === 'Selesai' ? '#155724' : '#856404'}}>{log.status}</span></td></tr>
                ))}</tbody></table></div>
            )}
        </div>

        <div style={styles.contentGrid(isMobile)}>
            <div style={{flex: 2}}>
                <div style={{...styles.cardContent, minHeight: 300}}>
                    <div style={styles.sectionHeader}><h3 style={{margin:0, color:'#2c3e50'}}>📅 Jadwal Kelas (Upcoming)</h3></div>
                    {todaySchedules.length === 0 ? <div style={{textAlign:'center', padding:40, color:'#999'}}>✅ Tidak ada kelas aktif saat ini.</div> : todaySchedules.map(sc => (
                        <div key={sc.id} style={styles.scheduleItem}><div style={{minWidth:80, fontWeight:'bold', color:'#3498db'}}>{sc.start} - {sc.end}</div><div style={{flex:1}}><div style={{fontWeight:'bold', color:'#2c3e50'}}>{sc.title || "Kelas"}</div><div style={{fontSize:12, color:'#7f8c8d'}}>{sc.program} • {sc.planet}</div></div><div><span style={{fontSize:12, background:'#f4f4f4', padding:'4px 8px', borderRadius:5}}>{sc.booker}</span></div></div>
                    ))}
                </div>
            </div>
            <div style={{flex: 1, display:'flex', flexDirection:'column', gap:20}}>
                <div style={styles.cardWarning}><h4 style={{marginTop:0, color:'#c0392b'}}>⚠️ Tagihan Prioritas</h4>{duePayments.map((p, i) => (<div key={i} style={styles.billItem}><div><div style={{fontWeight:'bold', fontSize:13}}>{p.nama}</div><div style={{fontSize:11, color:'#e74c3c'}}>Rp {p.sisa.toLocaleString()}</div></div><button onClick={() => sendWA(p)} style={styles.btnWa}>💬 WA</button></div>))}{duePayments.length === 0 && <small>Aman.</small>}</div>
                <div style={styles.cardTodo}><h4 style={{marginTop:0, color:'#2c3e50'}}>📝 Catatan Admin</h4><form onSubmit={addTodo} style={{display:'flex', gap:5, marginBottom:10}}><input type="text" placeholder="Tulis tugas..." value={newTodo} onChange={e=>setNewTodo(e.target.value)} style={styles.inputTodo}/><button type="submit" style={styles.btnAdd}>+</button></form>{todos.map(t => (<div key={t.id} style={styles.todoItem}><div onClick={()=>toggleTodo(t.id)} style={{flex:1, cursor:'pointer', textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#999' : '#333'}}>{t.done ? '✅' : '⬜'} {t.text}</div><button onClick={()=>deleteTodo(t.id)} style={{border:'none', background:'transparent', color:'#ccc'}}>x</button></div>))}</div>
            </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', backgroundColor: '#f4f7f6', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', fontFamily: 'Inter, system-ui, sans-serif', transition: '0.3s' }),
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: m ? '15px' : '30px', flexDirection: m ? 'column' : 'row', gap: m ? 10 : 0 }),
  headerRight: (m) => ({ display: 'flex', alignItems: 'center', gap: m ? 8 : 15, flexDirection: m ? 'column' : 'row' }),
  pageTitle: (m) => ({ margin: 0, color: '#2c3e50', fontSize: m ? 18 : 24 }),
  pageDate: (m) => ({ margin: '5px 0 0 0', color: '#7f8c8d', fontSize: m ? 12 : 14 }),
  clockBox: (m) => ({ background: 'white', padding: m ? '6px 12px' : '10px 20px', borderRadius: 20, fontWeight: 'bold', color: '#3498db', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', fontSize: m ? 11 : 14 }),
  btnBell: (m) => ({ background: '#e74c3c', color: 'white', border: 'none', padding: m ? '6px 12px' : '10px 20px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 6px rgba(231, 76, 60, 0.3)', fontSize: m ? 11 : 13 }),
  sectionTitle: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, marginTop: 10 },
  liveDot: { width: 10, height: 10, borderRadius: '50%', background: '#27ae60', animation: 'pulse 2s infinite', display: 'inline-block', marginLeft: 5 },
  attendanceGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 15, marginBottom: 25 }),
  attendanceBar: { display: 'flex', height: 24, borderRadius: 12, overflow: 'hidden', marginTop: 10, background: '#f1f5f9' },
  barHadir: { background: '#27ae60', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s' },
  barTidakHadir: { background: '#e74c3c', color: 'white', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s' },
  attendanceNumbers: { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b', marginTop: 5 },
  attendanceCard: (m) => ({ background: 'white', padding: m ? 15 : 20, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'pointer', transition: '0.2s', border: '1px solid #f1f5f9' }),
  classHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  className: (m) => ({ margin: 0, fontSize: m ? 14 : 15, color: '#1e293b', fontWeight: 'bold' }),
  roomBadge: (m) => ({ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: 12, fontSize: m ? 9 : 10, fontWeight: 'bold' }),
  classInfo: (m) => ({ fontSize: m ? 11 : 12, color: '#64748b', display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4 }),
  programBadge: { background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 'bold' },
  detailDropdown: { marginTop: 12, borderTop: '1px solid #f1f5f9', paddingTop: 12 },
  detailSection: { marginBottom: 10 },
  absentItem: { display: 'flex', gap: 10, alignItems: 'center', padding: '4px 0', fontSize: 12, flexWrap: 'wrap' },
  absentStatus: (s) => ({ padding: '2px 6px', borderRadius: 8, fontSize: 10, fontWeight: 'bold', background: s === 'Alpha' || s === 'alpha' ? '#fee2e2' : s === 'Sakit' || s === 'sakit' ? '#fff3cd' : '#e0e7ff', color: s === 'Alpha' || s === 'alpha' ? '#ef4444' : s === 'Sakit' || s === 'sakit' ? '#f59e0b' : '#3730a3' }),
  absentKet: { fontSize: 10, color: '#94a3b8', marginLeft: 4 },
  emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: 40, background: 'white', borderRadius: 14, color: '#94a3b8', fontSize: 14 },
  gridStats: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(3, 1fr)', gap: m ? 10 : 20, marginBottom: m ? 15 : 30 }),
  cardStat: { background: 'white', padding: 20, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 15, boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
  iconBox: { width: 50, height: 50, borderRadius: '50%', background: '#eaf2f8', color: '#3498db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 },
  statNumber: { margin: 0, fontSize: 24, color: '#2c3e50' },
  statLabel: { color: '#7f8c8d', fontSize: 12 },
  cardContent: { background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.03)', marginBottom: 20 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottom: '1px solid #f0f0f0' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  contentGrid: (m) => ({ display: 'flex', gap: 20, flexDirection: m ? 'column' : 'row', alignItems: 'flex-start' }),
  scheduleItem: { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f4f6f7', gap: 10 },
  cardWarning: { background: '#fff5f5', padding: 20, borderRadius: 12, border: '1px solid #fadbd8' },
  billItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: 10, borderRadius: 8, marginBottom: 8, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  btnWa: { background: '#27ae60', color: 'white', border: 'none', borderRadius: 5, padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: 11 },
  cardTodo: { background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 2px 5px rgba(0,0,0,0.03)' },
  inputTodo: { flex: 1, padding: 8, borderRadius: 5, border: '1px solid #ddd' },
  btnAdd: { padding: '8px 15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer' },
  todoItem: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px dashed #eee', fontSize: 13 }
};

export default Dashboard;