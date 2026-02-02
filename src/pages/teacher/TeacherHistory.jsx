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
        const filtered = data.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
        
        // Sortir tanggal terbaru diatas
        filtered.sort((a, b) => new Date(b.tanggal + ' ' + b.waktu) - new Date(a.tanggal + ' ' + a.waktu));
        setLogs(filtered);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchLogs();
  }, [guru, selectedMonth]);

  const handlePrint = () => window.print();
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

  if (!guru) return null;

  return (
    <div className="main-container">
      <style>{`
        .main-container { min-height: 100vh; background: #f4f7f6; font-family: sans-serif; padding-bottom: 50px; }
        .no-print { display: flex; }
        /* PRINT STYLES */
        @media print {
            @page { margin: 1.5cm; size: A4; }
            body { background: white; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .report-card { box-shadow: none !important; padding: 0 !important; }
            .signature-section { display: flex !important; margin-top: 50px; justify-content: space-between; }
        }
        .signature-section { display: none; } /* Sembunyikan saat mode web biasa */
      `}</style>

      {/* Header & Navigasi (Hanya Web) */}
      <div className="no-print" style={{background:'#2c3e50', padding:'15px 20px', color:'white', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <button onClick={() => navigate('/guru/dashboard', {state:{teacher:guru}})} style={{background:'transparent', border:'1px solid white', color:'white', borderRadius:5, padding:'5px 10px', cursor:'pointer'}}>⬅ Dashboard</button>
            <h3 style={{margin:0}}>Riwayat Mengajar</h3>
        </div>
        <div style={{display:'flex', gap:10}}>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{padding:5, borderRadius:4}} />
            <button onClick={handlePrint} style={{background:'#27ae60', border:'none', padding:'5px 15px', color:'white', borderRadius:4, cursor:'pointer', fontWeight:'bold'}}>🖨️ Cetak</button>
        </div>
      </div>

      {/* Area Laporan */}
      <div className="print-area" style={{padding:20, maxWidth:800, margin:'0 auto'}}>
        <div className="report-card" style={{background:'white', padding:40, borderRadius:8, boxShadow:'0 2px 10px rgba(0,0,0,0.1)'}}>
            
            {/* Kop Laporan */}
            <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:20, marginBottom:20}}>
                <h2 style={{margin:0, textTransform:'uppercase', color:'#2c3e50'}}>Laporan Aktivitas Pengajar</h2>
                <p style={{margin:'5px 0 0', color:'#666'}}>Periode: {formattedPeriod}</p>
            </div>

            {/* Info Guru */}
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:20, fontSize:14}}>
                <div><strong>Nama Pengajar:</strong> {guru.nama} <br/> <strong>Email:</strong> {guru.email}</div>
                <div style={{textAlign:'right'}}><strong>Total Sesi:</strong> {logs.length} <br/> <strong>Total Jam:</strong> {totalJam.toFixed(1)} Jam</div>
            </div>

            {/* Tabel Data */}
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead>
                    <tr style={{background:'#f0f0f0', borderBottom:'2px solid #000'}}>
                        <th style={{padding:10, textAlign:'left'}}>Tanggal</th>
                        <th style={{padding:10, textAlign:'left'}}>Materi / Kegiatan</th>
                        <th style={{padding:10, textAlign:'center'}}>Siswa</th>
                        <th style={{padding:10, textAlign:'center'}}>Durasi</th>
                        <th style={{padding:10, textAlign:'center'}}>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.id} style={{borderBottom:'1px solid #ddd'}}>
                            <td style={{padding:10}}>{new Date(log.tanggal).toLocaleDateString('id-ID')} <br/> <small>{log.waktu}</small></td>
                            <td style={{padding:10}}><strong>{log.program}</strong><br/>{log.detail}</td>
                            <td style={{padding:10, textAlign:'center'}}>{log.siswaHadir}</td>
                            <td style={{padding:10, textAlign:'center'}}>{log.durasiJam} Jam</td>
                            <td style={{padding:10, textAlign:'center'}}>{log.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Kolom Tanda Tangan (Khusus Bimbel) */}
            <div className="signature-section" style={{padding:'0 30px'}}>
                <div style={{textAlign:'center', width:'40%'}}>
                    <p>Mengetahui,<br/><strong>Pimpinan / Koordinator</strong></p>
                    <br/><br/><br/><br/>
                    <p style={{borderTop:'1px solid #000', paddingTop:5}}>( .................................... )</p>
                </div>
                <div style={{textAlign:'center', width:'40%'}}>
                    <p>Dibuat oleh,<br/><strong>Tentor / Pengajar</strong></p>
                    <br/><br/><br/><br/>
                    <p style={{borderTop:'1px solid #000', paddingTop:5}}>({guru.nama})</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;