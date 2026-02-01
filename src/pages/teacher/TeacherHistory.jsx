import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";

const TeacherHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guru = location.state?.teacher;
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    if (!guru) { navigate('/login-guru'); return; }
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "teacher_logs"), where("teacherId", "==", guru.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const filtered = data.filter(item => item.tanggal.startsWith(selectedMonth));
        filtered.sort((a, b) => new Date(b.tanggal + ' ' + b.waktu) - new Date(a.tanggal + ' ' + a.waktu));
        setLogs(filtered);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [guru, selectedMonth]);

  const handlePrint = () => window.print();
  const totalJam = logs.reduce((acc, curr) => acc + (curr.durasiJam || 0), 0);

  if (!guru) return null;

  return (
    <div style={{minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif', paddingBottom:50}}>
      <style>{`@media print { .no-print { display: none !important; } .print-area { width: 100%; background: white; padding: 0; } body { background: white; } @page { margin: 2cm; } }`}</style>

      <div className="no-print" style={{background:'#2c3e50', padding:'15px 20px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <button onClick={() => navigate('/guru/dashboard', {state:{teacher:guru}})} style={{background:'transparent', border:'1px solid white', color:'white', borderRadius:5, padding:'5px 10px', cursor:'pointer'}}>⬅ Kembali</button>
            <h3 style={{margin:0}}>Riwayat Mengajar</h3>
        </div>
        <div>{guru.nama}</div>
      </div>

      <div className="print-area" style={{padding:20, maxWidth:800, margin:'0 auto'}}>
        <div className="no-print" style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{padding:8, borderRadius:5, border:'1px solid #ddd'}} />
            <button onClick={handlePrint} style={{background:'#27ae60', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>🖨️ Download Laporan</button>
        </div>

        <div style={{background:'white', padding:30, borderRadius:10, boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:20, marginBottom:20}}>
                <h2 style={{margin:0, textTransform:'uppercase', color:'#2c3e50'}}>Laporan Aktivitas Pengajar</h2>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:20, textAlign:'left', fontSize:14}}>
                    <div><strong>Nama Guru:</strong> {guru.nama} <br/><strong>Email:</strong> {guru.email}</div>
                    <div style={{textAlign:'right'}}><strong>Periode:</strong> {selectedMonth} <br/><strong>Total:</strong> {logs.length} Sesi ({totalJam.toFixed(1)} Jam)</div>
                </div>
            </div>

            {loading ? <p>Memuat...</p> : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                    <thead>
                        <tr style={{background:'#f8f9fa', borderBottom:'2px solid #ddd'}}>
                            <th style={{padding:10, textAlign:'left'}}>Tanggal</th>
                            <th style={{padding:10, textAlign:'left'}}>Kegiatan</th>
                            <th style={{padding:10, textAlign:'center'}}>Siswa</th>
                            <th style={{padding:10, textAlign:'center'}}>Durasi</th>
                            <th style={{padding:10, textAlign:'center'}}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:10}}>{new Date(log.tanggal).toLocaleDateString('id-ID')}</td>
                                <td style={{padding:10}}><span style={{fontWeight:'bold'}}>{log.program}</span><br/>{log.detail}</td>
                                <td style={{padding:10, textAlign:'center'}}>{log.siswaHadir}</td>
                                <td style={{padding:10, textAlign:'center'}}>{log.durasiJam} Jam</td>
                                <td style={{padding:10, textAlign:'center'}}>{log.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;