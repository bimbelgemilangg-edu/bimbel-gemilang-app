import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, writeBatch, getDoc } from "firebase/firestore";

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01"); 
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); 
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null); 
  const [salaryRules, setSalaryRules] = useState({});

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Ambil Aturan Gaji dari Firestore atau Default
      const settingSnap = await getDoc(doc(db, "settings", "global_config"));
      const rules = settingSnap.exists() ? settingSnap.data().salaryRules : {
          honorSD: 35000, honorSMP: 45000, honorEnglishKids: 40000, honorEnglishJunior: 50000, honorEnglishPro: 60000, honorKelas6: 40000
      };
      setSalaryRules(rules);

      // 2. Ambil Semua Log dari koleksi teacher_logs
      const snap = await getDocs(collection(db, "teacher_logs"));
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // 3. Filter berdasarkan tanggal yang dipilih
      const filtered = allLogs.filter(log => {
          if (!log.tanggal) return false;
          const cleanDate = log.tanggal.split(' ')[0]; 
          return cleanDate >= startDate && cleanDate <= endDate;
      });

      // 4. Kelompokkan per Guru
      const guruMap = {};
      filtered.forEach(log => {
        let honor = 0;
        const prog = (log.program || "").toLowerCase();
        const level = (log.level || "").toUpperCase();

        // Logika perhitungan honor otomatis jika nominal di log kosong
        if (prog.includes('english')) {
            if (level.includes('PRO') || level.includes('SMA')) honor = parseInt(rules.honorEnglishPro);
            else if (level.includes('JUNIOR') || level.includes('SMP')) honor = parseInt(rules.honorEnglishJunior);
            else honor = parseInt(rules.honorEnglishKids);
        } else {
            if (level === 'SMP') honor = parseInt(rules.honorSMP);
            else if ((log.detail || "").toLowerCase().includes('6')) honor = parseInt(rules.honorKelas6);
            else honor = parseInt(rules.honorSD);
        }

        const finalNominal = log.nominal > 0 ? log.nominal : honor;

        if (!guruMap[log.teacherId]) {
            guruMap[log.teacherId] = { 
                id: log.teacherId, 
                nama: log.namaGuru || "Tanpa Nama", 
                totalSesi: 0, 
                gajiMengajar: 0, 
                statusPending: 0, 
                rincian: [] 
            };
        }
        guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].gajiMengajar += finalNominal;
        if (log.status === 'Menunggu Validasi') guruMap[log.teacherId].statusPending += 1;
        guruMap[log.teacherId].rincian.push({ ...log, nominal: finalNominal });
      });

      setRekap(Object.values(guruMap));
    } catch (error) { 
      console.error("Error Gaji:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const handleValidasi = async (guruData) => {
    if(!window.confirm(`Setujui/Validasi semua laporan ${guruData.nama}?`)) return;
    try {
        const batch = writeBatch(db);
        guruData.rincian.forEach(log => {
            if(log.status === 'Menunggu Validasi') {
                batch.update(doc(db, "teacher_logs", log.id), { 
                    status: "Valid / Sudah Direkap",
                    nominal: log.nominal 
                });
            }
        });
        await batch.commit();
        alert("✅ Gaji Berhasil Disetujui!");
        fetchData();
    } catch (e) { alert("Gagal memproses validasi"); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: 250, padding: 30, width: 'calc(100% - 250px)', boxSizing: 'border-box' }}>
        <div style={styles.card}>
            <h2 style={{margin:0, color:'#2c3e50'}}>💰 Persetujuan Gaji Guru</h2>
            <div style={styles.filterBar}>
                <div>
                    <label style={styles.label}>Dari Tanggal:</label>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.inputDate} />
                </div>
                <div>
                    <label style={styles.label}>Sampai Tanggal:</label>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.inputDate} />
                </div>
                <button onClick={fetchData} style={styles.btnRefresh}>🔄 Update Data</button>
            </div>
        </div>

        <div style={styles.cardTable}>
            <table style={styles.table}>
                <thead>
                    <tr style={styles.trHead}>
                        <th style={styles.th}>Nama Guru</th>
                        <th style={styles.th}>Total Sesi</th>
                        <th style={styles.th}>Total Gaji</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rekap.length === 0 ? (
                        <tr><td colSpan="5" style={{padding:40, textAlign:'center', color:'#999'}}>Tidak ada laporan mengajar ditemukan pada periode ini.</td></tr>
                    ) : rekap.map(g => (
                        <tr key={g.id} style={styles.trBody}>
                            <td style={styles.td}><b>{g.nama}</b></td>
                            <td style={styles.td}>{g.totalSesi} Sesi</td>
                            <td style={styles.td}><b>Rp {g.gajiMengajar.toLocaleString()}</b></td>
                            <td style={styles.td}>
                                {g.statusPending > 0 ? 
                                <span style={styles.tagWarning}>⚠️ {g.statusPending} Perlu Validasi</span> : 
                                <span style={styles.tagSuccess}>✅ Sudah Valid</span>}
                            </td>
                            <td style={styles.td}>
                                <button onClick={() => setViewDetail(g)} style={styles.btnDetail}>Rincian</button>
                                {g.statusPending > 0 && (
                                    <button onClick={() => handleValidasi(g)} style={styles.btnApprove}>Approve</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL DETAIL */}
        {viewDetail && (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                        <h3 style={{margin:0}}>Rincian: {viewDetail.nama}</h3>
                        <button onClick={()=>setViewDetail(null)} style={styles.btnClose}>&times;</button>
                    </div>
                    <div style={{maxHeight:'400px', overflowY:'auto'}}>
                        <table style={{width:'100%', borderCollapse:'collapse'}}>
                            <thead style={{background:'#f8f9fa'}}>
                                <tr>
                                    <th style={styles.thSmall}>Tgl</th>
                                    <th style={styles.thSmall}>Program</th>
                                    <th style={styles.thSmall}>Honor</th>
                                    <th style={styles.thSmall}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewDetail.rincian.map((r, i) => (
                                    <tr key={i} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={styles.tdSmall}>{r.tanggal}</td>
                                        <td style={styles.tdSmall}>{r.program} ({r.level})</td>
                                        <td style={styles.tdSmall}>Rp {r.nominal?.toLocaleString()}</td>
                                        <td style={styles.tdSmall}>{r.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div style={{marginTop:20, textAlign:'right', borderTop:'1px solid #eee', paddingTop:15}}>
                        <h4 style={{margin:0}}>Total: Rp {viewDetail.gajiMengajar.toLocaleString()}</h4>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { background:'white', padding:25, borderRadius:15, marginBottom:20, boxShadow:'0 4px 6px rgba(0,0,0,0.05)' },
  filterBar: { display:'flex', gap:20, marginTop:20, alignItems:'flex-end' },
  label: { display:'block', fontSize:12, color:'#666', marginBottom:5, fontWeight:'bold' },
  inputDate: { padding:10, borderRadius:8, border:'1px solid #ddd', outline:'none' },
  btnRefresh: { padding:'10px 20px', background:'#3498db', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold' },
  cardTable: { background:'white', borderRadius:15, overflow:'hidden', boxShadow:'0 4px 6px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse' },
  trHead: { background:'#2c3e50', color:'white', textAlign:'left' },
  th: { padding:15 },
  td: { padding:15, borderBottom:'1px solid #eee' },
  trBody: { transition:'0.2s', ':hover': { background:'#f9f9f9' } },
  tagWarning: { background:'#fff3cd', color:'#856404', padding:'4px 8px', borderRadius:5, fontSize:12 },
  tagSuccess: { background:'#d4edda', color:'#155724', padding:'4px 8px', borderRadius:5, fontSize:12 },
  btnDetail: { padding:'6px 12px', background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer', marginRight:5 },
  btnApprove: { padding:'6px 12px', background:'#27ae60', color:'white', border:'none', borderRadius:5, cursor:'pointer' },
  overlay: { position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
  modal: { background:'white', padding:30, borderRadius:20, width:'650px', maxWidth:'90%' },
  btnClose: { background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#999' },
  thSmall: { padding:10, fontSize:12, textAlign:'left' },
  tdSmall: { padding:10, fontSize:12 }
};

export default TeacherSalaries;