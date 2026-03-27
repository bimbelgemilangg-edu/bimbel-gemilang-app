import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru';

const TeacherHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    if (stateGuru) {
      localStorage.setItem('teacherData', JSON.stringify(stateGuru));
      return stateGuru;
    }
    return localGuru ? JSON.parse(localGuru) : null;
  });
  
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
        const filtered = data.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
        filtered.sort((a, b) => new Date(b.tanggal + ' ' + b.waktu) - new Date(a.tanggal + ' ' + a.waktu));
        setLogs(filtered);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [guru, selectedMonth, navigate]);

  const handlePrint = () => window.print();
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

  if (!guru) return null;

  return (
    <div style={{ display: 'flex' }}>
      <div className="no-print"><SidebarGuru /></div>
      <div className="main-container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', background: '#f4f7f6', minHeight: '100vh' }}>
        <style>{`
            @media print {
                .no-print { display: none !important; }
                .main-container { margin-left: 0 !important; width: 100% !important; background: white !important; }
                .report-card { box-shadow: none !important; width: 100% !important; }
                .signature-section { display: flex !important; margin-top: 50px; justify-content: space-between; }
            }
            .signature-section { display: none; }
        `}</style>

        <div className="no-print" style={{background:'#2c3e50', padding:'15px 40px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <h3 style={{margin:0}}>Riwayat Mengajar</h3>
            <div style={{display:'flex', gap:10}}>
                <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{padding:5, borderRadius:4}} />
                <button onClick={handlePrint} style={{background:'#27ae60', border:'none', padding:'8px 15px', color:'white', borderRadius:4, cursor:'pointer'}}>🖨️ Cetak</button>
            </div>
        </div>

        <div style={{padding:40, maxWidth:900, margin:'0 auto'}}>
            <div className="report-card" style={{background:'white', padding:40, borderRadius:8, boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}>
                <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:20, marginBottom:20}}>
                    <h2 style={{margin:0}}>LAPORAN AKTIVITAS PENGAJAR</h2>
                    <p style={{margin:5, color:'#666'}}>Bimbel Gemilang - Periode {formattedPeriod}</p>
                </div>

                <div style={{display:'flex', justifyContent:'space-between', marginBottom:20, fontSize:14}}>
                    <div><strong>Nama:</strong> {guru.nama}</div>
                    <div style={{textAlign:'right'}}><strong>Total Jam:</strong> {totalJam.toFixed(1)} Jam</div>
                </div>

                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                    <thead>
                        <tr style={{background:'#f0f0f0'}}>
                            <th style={{padding:10, border:'1px solid #ddd', textAlign:'left'}}>Tanggal</th>
                            <th style={{padding:10, border:'1px solid #ddd', textAlign:'left'}}>Materi / Detail</th>
                            <th style={{padding:10, border:'1px solid #ddd'}}>Siswa</th>
                            <th style={{padding:10, border:'1px solid #ddd'}}>Durasi</th>
                            <th style={{padding:10, border:'1px solid #ddd'}}>Honor Est.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="5" style={{textAlign:'center', padding:20}}>Memuat...</td></tr> : 
                        logs.map(log => (
                            <tr key={log.id}>
                                <td style={{padding:10, border:'1px solid #ddd'}}>{log.tanggal}</td>
                                <td style={{padding:10, border:'1px solid #ddd'}}>{log.detail}</td>
                                <td style={{padding:10, border:'1px solid #ddd', textAlign:'center'}}>{log.siswaHadir}</td>
                                <td style={{padding:10, border:'1px solid #ddd', textAlign:'center'}}>{log.durasiJam}h</td>
                                <td style={{padding:10, border:'1px solid #ddd', textAlign:'right'}}>Rp{log.nominal?.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="signature-section">
                    <div style={{textAlign:'center', width:'40%'}}><p>Mengetahui,</p><br/><br/><br/><p>( Koordinator )</p></div>
                    <div style={{textAlign:'center', width:'40%'}}><p>Pengajar,</p><br/><br/><br/><p>( {guru.nama} )</p></div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;