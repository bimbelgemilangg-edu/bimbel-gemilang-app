import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru';

const TeacherHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Memastikan data guru terambil dari state atau localStorage
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
        // Query tetap mengambil data berdasarkan teacherId
        const q = query(collection(db, "teacher_logs"), where("teacherId", "==", guru.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Filter berdasarkan bulan yang dipilih
        const filtered = data.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
        
        // Sortir: Terbaru di atas
        filtered.sort((a, b) => new Date(b.tanggal + ' ' + b.waktu) - new Date(a.tanggal + ' ' + a.waktu));
        
        setLogs(filtered);
      } catch (err) { 
        console.error("Error fetching logs:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchLogs();
  }, [guru, selectedMonth, navigate]);

  const handlePrint = () => window.print();
  
  // Kalkulasi total jam mengajar
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

  if (!guru) return null;

  return (
    <div style={{ display: 'flex' }}>
      {/* Sidebar disembunyikan saat cetak */}
      <div className="no-print"><SidebarGuru /></div>
      
      <div className="main-container" style={{ marginLeft: '250px', width: 'calc(100% - 250px)', background: '#f4f7f6', minHeight: '100vh' }}>
        <style>{`
            @media print {
                .no-print { display: none !important; }
                .main-container { margin-left: 0 !important; width: 100% !important; background: white !important; }
                .report-card { box-shadow: none !important; width: 100% !important; border: none !important; }
                .signature-section { display: flex !important; margin-top: 50px; justify-content: space-between; }
                body { background: white !important; }
            }
            .signature-section { display: none; }
            .status-badge { padding: 4px 8px; borderRadius: 4px; fontSize: 11px; fontWeight: bold; text-transform: uppercase; }
        `}</style>

        {/* Toolbar Header (No Print) */}
        <div className="no-print" style={{background:'#2c3e50', padding:'15px 40px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
                <h3 style={{margin:0}}>Riwayat Mengajar</h3>
                <p style={{margin:0, fontSize:12, opacity:0.8}}>Pantau kehadiran dan status validasi absen Anda.</p>
            </div>
            <div style={{display:'flex', gap:10}}>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)} 
                    style={{padding:'8px', borderRadius:8, border:'1px solid #34495e', outline:'none'}} 
                />
                <button 
                    onClick={handlePrint} 
                    style={{background:'#27ae60', border:'none', padding:'8px 20px', color:'white', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}
                >
                    🖨️ Cetak Laporan
                </button>
            </div>
        </div>

        <div style={{padding:40, maxWidth:1000, margin:'0 auto'}}>
            <div className="report-card" style={{background:'white', padding:40, borderRadius:15, boxShadow:'0 4px 20px rgba(0,0,0,0.05)'}}>
                {/* Header Laporan */}
                <div style={{textAlign:'center', borderBottom:'2px solid #2c3e50', paddingBottom:20, marginBottom:30}}>
                    <h2 style={{margin:0, color:'#2c3e50', letterSpacing:1}}>LAPORAN AKTIVITAS PENGAJAR</h2>
                    <p style={{margin:5, color:'#7f8c8d', fontWeight:'500'}}>Bimbel Gemilang - Periode {formattedPeriod}</p>
                </div>

                {/* Info Guru */}
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:25, fontSize:15, padding:'0 10px'}}>
                    <div>
                        <span style={{color:'#7f8c8d'}}>Nama Pengajar:</span><br/>
                        <strong style={{fontSize:18}}>{guru.nama}</strong>
                    </div>
                    <div style={{textAlign:'right'}}>
                        <span style={{color:'#7f8c8d'}}>Total Durasi:</span><br/>
                        <strong style={{fontSize:18, color:'#2980b9'}}>{totalJam.toFixed(1)} Jam Mengajar</strong>
                    </div>
                </div>

                {/* Tabel Data - NOMINAL DIHAPUS SESUAI PERMINTAAN */}
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                    <thead>
                        <tr style={{background:'#2c3e50', color:'white'}}>
                            <th style={{padding:12, border:'1px solid #ddd', textAlign:'left'}}>Tanggal</th>
                            <th style={{padding:12, border:'1px solid #ddd', textAlign:'left'}}>Kegiatan / Detail</th>
                            <th style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>Siswa</th>
                            <th style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>Durasi</th>
                            <th style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:30, color:'#95a5a6'}}>Memuat riwayat...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="5" style={{textAlign:'center', padding:30, color:'#95a5a6'}}>Tidak ada data di bulan ini.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                    <td style={{padding:12, border:'1px solid #ddd'}}>{log.tanggal}</td>
                                    <td style={{padding:12, border:'1px solid #ddd'}}>
                                        <div style={{fontWeight:'bold', color:'#2c3e50'}}>{log.kegiatan}</div>
                                        <div style={{fontSize:11, color:'#7f8c8d'}}>{log.detail}</div>
                                    </td>
                                    <td style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>{log.siswaHadir} Siswa</td>
                                    <td style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>{log.durasiJam} Jam</td>
                                    <td style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>
                                        <span style={{
                                            padding:'4px 10px', 
                                            borderRadius:20, 
                                            fontSize:10, 
                                            fontWeight:'800',
                                            backgroundColor: log.status === 'Disetujui' ? '#eafaf1' : '#fef5e7',
                                            color: log.status === 'Disetujui' ? '#27ae60' : '#f39c12',
                                            border: log.status === 'Disetujui' ? '1px solid #27ae60' : '1px solid #f39c12'
                                        }}>
                                            {log.status || "MENUNGGU"}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Footer Signature (Hanya Muncul saat Print) */}
                <div className="signature-section">
                    <div style={{textAlign:'center', width:'40%'}}>
                        <p style={{margin:0}}>Mengetahui,</p>
                        <div style={{marginTop:80, borderTop:'1px solid #333', width:'180px', margin:'80px auto 0 auto'}}>
                            <strong>Koordinator Akademik</strong>
                        </div>
                    </div>
                    <div style={{textAlign:'center', width:'40%'}}>
                        <p style={{margin:0}}>Pengajar,</p>
                        <div style={{marginTop:80, borderTop:'1px solid #333', width:'180px', margin:'80px auto 0 auto'}}>
                            <strong>{guru.nama}</strong>
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="no-print" style={{textAlign:'center', color:'#95a5a6', fontSize:12, marginTop:20}}>
                *Data ini adalah catatan aktivitas mengajar resmi Anda. Silakan cetak jika diperlukan untuk arsip pribadi.
            </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;