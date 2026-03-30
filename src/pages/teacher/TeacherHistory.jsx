import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru';
import { Calendar, Clock, Users, Printer, Search } from 'lucide-react';

const TeacherHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

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
  // Default ke bulan berjalan format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!guru) { navigate('/login-guru'); return; }
    fetchLogs();
  }, [guru, selectedMonth]); // Re-fetch otomatis saat bulan diubah

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "teacher_logs"), where("teacherId", "==", guru.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Filter berdasarkan bulan (YYYY-MM)
      const filtered = data.filter(item => {
          if (!item.tanggal) return false;
          // Memastikan format tanggal cocok dengan pilihan (YYYY-MM)
          return item.tanggal.startsWith(selectedMonth);
      });

      // Urutkan terbaru
      filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      
      setLogs(filtered);
    } catch (err) { 
      console.error("Error fetching logs:", err); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePrint = () => window.print();
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

  if (!guru) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <div className="no-print"><SidebarGuru /></div>
      
      <div className="main-content-wrapper">
        <style>{`
            @media print {
                .no-print { display: none !important; }
                .main-content-wrapper { margin-left: 0 !important; width: 100% !important; background: white !important; padding: 0 !important; }
                .report-card { box-shadow: none !important; width: 100% !important; border: none !important; padding: 0 !important; }
                .signature-section { display: flex !important; margin-top: 50px; justify-content: space-between; }
                .desktop-table { display: table !important; width: 100% !important; }
                .mobile-cards { display: none !important; }
            }
            @media (max-width: 1024px) {
                .desktop-table { display: none; }
                .mobile-cards { display: block; }
            }
            @media (min-width: 1025px) {
                .desktop-table { display: table; width: 100%; border-collapse: collapse; }
                .mobile-cards { display: none; }
            }
            .signature-section { display: none; }
        `}</style>

        {/* TOOLBAR */}
        <div className="no-print" style={st.toolbar}>
            <div>
                <h3 style={{margin:0, fontSize: isMobile ? 18 : 22}}>Riwayat Sesi Mengajar</h3>
                <p style={{margin:0, fontSize:12, opacity:0.7}}>Data berdasarkan bulan yang dipilih.</p>
            </div>
            <div style={st.actionGroup}>
                <div style={st.inputWrapper}>
                    <Calendar size={16} color="#64748b"/>
                    <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={e => setSelectedMonth(e.target.value)} 
                        style={st.dateInput}
                    />
                </div>
                <button onClick={handlePrint} style={st.btnPrint}>
                    <Printer size={16}/> <span className="hide-on-mobile">Cetak Laporan</span>
                </button>
            </div>
        </div>

        <div className="teacher-container-padding" style={{maxWidth: 1100, margin: '0 auto', width: '100%'}}>
            <div className="report-card teacher-card">
                
                {/* Header Laporan */}
                <div style={st.reportHeader}>
                    <h2 style={{margin:0, color:'#1e293b', fontSize: isMobile ? 18 : 24}}>LAPORAN AKTIVITAS PENGAJAR</h2>
                    <div style={st.periodBadge}>{formattedPeriod}</div>
                </div>

                {/* Info Bar */}
                <div style={st.infoBar}>
                    <div>
                        <small style={{color:'#64748b'}}>Nama Pengajar</small>
                        <div style={{fontWeight:'bold', fontSize:16}}>{guru.nama}</div>
                    </div>
                    <div style={{textAlign: isMobile ? 'left' : 'right'}}>
                        <small style={{color:'#64748b'}}>Total Kontribusi</small>
                        <div style={{fontWeight:'bold', fontSize:16, color:'#2563eb'}}>{totalJam.toFixed(1)} Jam</div>
                    </div>
                </div>

                {/* TABLE VIEW (DESKTOP) */}
                <table className="desktop-table">
                    <thead>
                        <tr style={st.thRow}>
                            <th style={st.th}>Tanggal</th>
                            <th style={st.th}>Kegiatan</th>
                            <th style={st.th}>Detail</th>
                            <th style={st.th}>Siswa</th>
                            <th style={st.th}>Durasi</th>
                            <th style={st.th}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" style={{padding:40, textAlign:'center'}}>Menghubungkan ke server...</td></tr>
                        ) : logs.length === 0 ? (
                            <tr><td colSpan="6" style={{padding:40, textAlign:'center', color:'#94a3b8'}}>Tidak ada data sesi pada bulan ini.</td></tr>
                        ) : logs.map(log => (
                            <tr key={log.id} style={st.tr}>
                                <td style={st.td}>{log.tanggal}</td>
                                <td style={{...st.td, fontWeight:'bold'}}>{log.kegiatan}</td>
                                <td style={{...st.td, fontSize:12, color:'#64748b'}}>{log.detail}</td>
                                <td style={st.td}>{log.siswaHadir} Siswa</td>
                                <td style={st.td}>{log.durasiJam} Jam</td>
                                <td style={st.td}>
                                    <span style={{...st.badge, 
                                        backgroundColor: log.status === 'Disetujui' ? '#dcfce7' : '#fef3c7',
                                        color: log.status === 'Disetujui' ? '#16a34a' : '#d97706'
                                    }}>
                                        {log.status || "Proses"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* CARD VIEW (MOBILE) */}
                <div className="mobile-cards no-print">
                    {logs.map(log => (
                        <div key={log.id} style={st.mCard}>
                            <div style={st.mCardHeader}>
                                <strong>{log.tanggal}</strong>
                                <span style={{...st.badge, fontSize:10}}>{log.status || "Proses"}</span>
                            </div>
                            <div style={{margin:'10px 0', fontWeight:'bold', color:'#1e293b'}}>{log.kegiatan}</div>
                            <div style={{fontSize:12, color:'#64748b', marginBottom:12}}>{log.detail}</div>
                            <div style={st.mCardFooter}>
                                <span><Users size={12}/> {log.siswaHadir} Siswa</span>
                                <span><Clock size={12}/> {log.durasiJam} Jam</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Signature (Print Only) */}
                <div className="signature-section">
                    <div style={{textAlign:'center'}}>
                        <p>Mengetahui,</p>
                        <div style={{marginTop:70, borderTop:'1px solid #000', width:150}}>Koordinator</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                        <p>Pengajar,</p>
                        <div style={{marginTop:70, borderTop:'1px solid #000', width:150}}>{guru.nama}</div>
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

const st = {
  toolbar: { 
      background: '#1e293b', padding: '20px', color: 'white', 
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexWrap: 'wrap', gap: 15
  },
  actionGroup: { display: 'flex', gap: 10, alignItems: 'center', width: 'auto' },
  inputWrapper: { 
      background: 'white', display: 'flex', alignItems: 'center', 
      padding: '0 12px', borderRadius: '10px', gap: 8 
  },
  dateInput: { border: 'none', padding: '10px 0', outline: 'none', fontSize: 14, fontWeight: 'bold' },
  btnPrint: { 
      background: '#10b981', color: 'white', border: 'none', 
      padding: '10px 18px', borderRadius: '10px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold'
  },
  reportHeader: { 
      textAlign: 'center', borderBottom: '2px solid #f1f5f9', 
      paddingBottom: 20, marginBottom: 25 
  },
  periodBadge: { 
      display: 'inline-block', background: '#e0e7ff', color: '#4338ca', 
      padding: '4px 12px', borderRadius: '20px', fontSize: 12, fontWeight: 'bold', marginTop: 8 
  },
  infoBar: { 
      display: 'flex', justifyContent: 'space-between', 
      marginBottom: 30, padding: '15px', background: '#f8fafc', borderRadius: '12px' 
  },
  thRow: { background: '#f1f5f9' },
  th: { padding: '15px', textAlign: 'left', fontSize: 13, color: '#475569' },
  td: { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: 14 },
  badge: { padding: '4px 10px', borderRadius: '20px', fontSize: 11, fontWeight: 'bold' },
  
  // Mobile Card Styles
  mCard: { 
      background: 'white', border: '1px solid #e2e8f0', 
      borderRadius: '15px', padding: '15px', marginBottom: 12 
  },
  mCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  mCardFooter: { 
      display: 'flex', gap: 15, borderTop: '1px solid #f1f5f9', 
      paddingTop: 10, fontSize: 12, color: '#64748b' 
  }
};

export default TeacherHistory;