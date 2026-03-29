import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru';
import { Calendar, Clock, Users, Printer, FileText, ChevronRight } from 'lucide-react';

const TeacherHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      } catch (err) { 
        console.error("Error fetching logs:", err); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchLogs();
  }, [guru, selectedMonth, navigate]);

  const handlePrint = () => window.print();
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

  if (!guru) return null;

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#f4f7f6' }}>
      <div className="no-print"><SidebarGuru /></div>
      
      <div className="main-container" style={{ 
          marginLeft: isMobile ? '0' : '250px', 
          width: isMobile ? '100%' : 'calc(100% - 250px)', 
          boxSizing: 'border-box'
      }}>
        <style>{`
            @media print {
                .no-print { display: none !important; }
                .main-container { margin-left: 0 !important; width: 100% !important; background: white !important; padding: 0 !important; }
                .report-card { box-shadow: none !important; width: 100% !important; border: none !important; padding: 0 !important; }
                .signature-section { display: flex !important; margin-top: 50px; justify-content: space-between; }
                .mobile-card-view { display: none !important; }
                .desktop-table-view { display: table !important; width: 100% !important; }
                body { background: white !important; }
            }
            @media screen and (max-width: 768px) {
                .desktop-table-view { display: none; }
                .mobile-card-view { display: block; }
            }
            @media screen and (min-width: 769px) {
                .desktop-table-view { display: table; width: 100%; border-collapse: collapse; }
                .mobile-card-view { display: none; }
            }
            .signature-section { display: none; }
        `}</style>

        {/* Toolbar Header (No Print) */}
        <div className="no-print" style={{
            background:'#2c3e50', 
            padding: isMobile ? '15px 20px' : '15px 40px', 
            color:'white', 
            display:'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent:'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center',
            gap: 15
        }}>
            <div>
                <h3 style={{margin:0, fontSize: isMobile ? 18 : 22}}>Riwayat Mengajar</h3>
                <p style={{margin:0, fontSize:11, opacity:0.8}}>Pantau kehadiran dan validasi absen.</p>
            </div>
            <div style={{display:'flex', gap:10, width: isMobile ? '100%' : 'auto'}}>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)} 
                    style={{padding:'8px', borderRadius:8, border:'none', outline:'none', flex: 1}} 
                />
                <button 
                    onClick={handlePrint} 
                    style={{background:'#27ae60', border:'none', padding:'8px 15px', color:'white', borderRadius:8, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}
                >
                    <Printer size={16}/> Cetak
                </button>
            </div>
        </div>

        <div style={{padding: isMobile ? 15 : 40, maxWidth:1000, margin:'0 auto'}}>
            <div className="report-card" style={{background:'white', padding: isMobile ? 20 : 40, borderRadius:15, boxShadow:'0 4px 20px rgba(0,0,0,0.05)'}}>
                
                {/* Header Laporan */}
                <div style={{textAlign:'center', borderBottom:'2px solid #2c3e50', paddingBottom:20, marginBottom:30}}>
                    <h2 style={{margin:0, color:'#2c3e50', fontSize: isMobile ? 18 : 24}}>LAPORAN AKTIVITAS PENGAJAR</h2>
                    <p style={{margin:5, color:'#7f8c8d', fontSize: 13}}>Bimbel Gemilang - Periode {formattedPeriod}</p>
                </div>

                {/* Info Guru */}
                <div style={{display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', marginBottom:25, gap: 15}}>
                    <div>
                        <span style={{color:'#7f8c8d', fontSize:12}}>Nama Pengajar:</span><br/>
                        <strong style={{fontSize: isMobile ? 16 : 18}}>{guru.nama}</strong>
                    </div>
                    <div style={{textAlign: isMobile ? 'left' : 'right'}}>
                        <span style={{color:'#7f8c8d', fontSize:12}}>Total Durasi:</span><br/>
                        <strong style={{fontSize: isMobile ? 16 : 18, color:'#2980b9'}}>{totalJam.toFixed(1)} Jam Mengajar</strong>
                    </div>
                </div>

                {/* VIEW DESKTOP: TABLE */}
                <table className="desktop-table-view">
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
                        {!loading && logs.map(log => (
                            <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:12, border:'1px solid #ddd'}}>{log.tanggal}</td>
                                <td style={{padding:12, border:'1px solid #ddd'}}>
                                    <div style={{fontWeight:'bold', color:'#2c3e50'}}>{log.kegiatan}</div>
                                    <div style={{fontSize:11, color:'#7f8c8d'}}>{log.detail}</div>
                                </td>
                                <td style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>{log.siswaHadir} Siswa</td>
                                <td style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>{log.durasiJam} Jam</td>
                                <td style={{padding:12, border:'1px solid #ddd', textAlign:'center'}}>
                                    <span style={{padding:'4px 10px', borderRadius:20, fontSize:10, fontWeight:'800', backgroundColor: log.status === 'Disetujui' ? '#eafaf1' : '#fef5e7', color: log.status === 'Disetujui' ? '#27ae60' : '#f39c12', border: '1px solid currentColor'}}>
                                        {log.status || "MENUNGGU"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* VIEW MOBILE: CARDS */}
                <div className="mobile-card-view no-print">
                    {loading ? <p style={{textAlign:'center', padding:20}}>Memuat...</p> : 
                     logs.length === 0 ? <p style={{textAlign:'center', padding:20}}>Tidak ada data.</p> :
                     logs.map(log => (
                        <div key={log.id} style={{background:'#f8fafc', padding:15, borderRadius:12, marginBottom:12, border:'1px solid #edf2f7'}}>
                            <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                                <div style={{display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:'bold', color:'#2d3748'}}>
                                    <Calendar size={14}/> {log.tanggal}
                                </div>
                                <span style={{fontSize:9, fontWeight:'900', color: log.status === 'Disetujui' ? '#27ae60' : '#f39c12'}}>
                                    {(log.status || "MENUNGGU").toUpperCase()}
                                </span>
                            </div>
                            <div style={{fontWeight:'bold', fontSize:14, color:'#2c3e50'}}>{log.kegiatan}</div>
                            <div style={{fontSize:11, color:'#7f8c8d', marginBottom:10}}>{log.detail}</div>
                            <div style={{display:'flex', gap:15, borderTop:'1px dashed #cbd5e0', paddingTop:8}}>
                                <div style={{display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#4a5568'}}>
                                    <Users size={12}/> {log.siswaHadir} Siswa
                                </div>
                                <div style={{display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#4a5568'}}>
                                    <Clock size={12}/> {log.durasiJam} Jam
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Signature Section (Print Only) */}
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
            
            <p className="no-print" style={{textAlign:'center', color:'#95a5a6', fontSize:11, marginTop:20}}>
                *Data ini adalah catatan aktivitas mengajar resmi Anda.
            </p>
        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;