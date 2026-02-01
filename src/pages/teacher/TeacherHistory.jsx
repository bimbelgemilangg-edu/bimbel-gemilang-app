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
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // 1. AMBIL DATA RIWAYAT
  useEffect(() => {
    if (!guru) { navigate('/login-guru'); return; }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "teacher_logs"), where("teacherId", "==", guru.id));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter Sesuai Bulan & Sortir Terbaru
        const filtered = data.filter(item => item.tanggal.startsWith(selectedMonth));
        filtered.sort((a, b) => new Date(b.tanggal + ' ' + b.waktu) - new Date(a.tanggal + ' ' + a.waktu));

        setLogs(filtered);
      } catch (err) {
        console.error("Gagal ambil riwayat:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [guru, selectedMonth]);

  // 2. FUNGSI DOWNLOAD (PRINT TO PDF)
  const handlePrint = () => {
    window.print();
  };

  // 3. HITUNG TOTAL DURASI BULAN INI
  const totalJam = logs.reduce((acc, curr) => acc + (curr.durasiJam || 0), 0);
  const totalKehadiran = logs.length;

  if (!guru) return null;

  return (
    <div style={{minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif', paddingBottom:50}}>
      
      {/* CSS KHUSUS UNTUK CETAK/PRINT AGAR RAPI */}
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            .print-area { width: 100%; background: white; padding: 0; }
            body { background: white; }
            @page { margin: 2cm; }
          }
        `}
      </style>

      {/* HEADER (NAVIGASI) - HILANG SAAT DI PRINT */}
      <div className="no-print" style={{background:'#2c3e50', padding:'15px 20px', color:'white', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <button onClick={() => navigate('/guru/dashboard', {state:{teacher:guru}})} style={{background:'transparent', border:'1px solid white', color:'white', borderRadius:5, padding:'5px 10px', cursor:'pointer'}}>
                ⬅ Kembali
            </button>
            <h3 style={{margin:0}}>Riwayat Mengajar</h3>
        </div>
        <div>
            {guru.nama}
        </div>
      </div>

      <div className="print-area" style={{padding:20, maxWidth:800, margin:'0 auto'}}>
        
        {/* KONTROL BULAN & DOWNLOAD (HILANG SAAT PRINT) */}
        <div className="no-print" style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10}}>
            <div>
                <label style={{fontWeight:'bold', marginRight:10}}>Pilih Periode:</label>
                <input 
                    type="month" 
                    value={selectedMonth} 
                    onChange={e => setSelectedMonth(e.target.value)} 
                    style={{padding:8, borderRadius:5, border:'1px solid #ddd'}}
                />
            </div>
            <button onClick={handlePrint} style={{background:'#27ae60', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                🖨️ Download Laporan PDF
            </button>
        </div>

        {/* AREA LAPORAN RESMI */}
        <div style={{background:'white', padding:30, borderRadius:10, boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            
            {/* KOP LAPORAN */}
            <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:20, marginBottom:20}}>
                <h2 style={{margin:0, textTransform:'uppercase', color:'#2c3e50'}}>Laporan Aktivitas Pengajar</h2>
                <p style={{margin:0, fontSize:14, color:'#666'}}>BIMBEL GEMILANG SYSTEM</p>
                <div style={{display:'flex', justifyContent:'space-between', marginTop:20, textAlign:'left', fontSize:14}}>
                    <div>
                        <strong>Nama Guru:</strong> {guru.nama} <br/>
                        <strong>Email:</strong> {guru.email}
                    </div>
                    <div style={{textAlign:'right'}}>
                        <strong>Periode:</strong> {selectedMonth} <br/>
                        <strong>Total Aktivitas:</strong> {totalKehadiran} Sesi ({totalJam.toFixed(1)} Jam)
                    </div>
                </div>
            </div>

            {/* TABEL DATA */}
            {loading ? <p style={{textAlign:'center'}}>Memuat data...</p> : (
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                    <thead>
                        <tr style={{background:'#f8f9fa', color:'#333', borderBottom:'2px solid #ddd'}}>
                            <th style={{padding:10, textAlign:'left'}}>Tanggal</th>
                            <th style={{padding:10, textAlign:'left'}}>Waktu</th>
                            <th style={{padding:10, textAlign:'left'}}>Program/Kegiatan</th>
                            <th style={{padding:10, textAlign:'left'}}>Detail Materi</th>
                            <th style={{padding:10, textAlign:'center'}}>Siswa</th>
                            <th style={{padding:10, textAlign:'center'}}>Durasi</th>
                            <th style={{padding:10, textAlign:'center'}}>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr><td colSpan="7" style={{padding:20, textAlign:'center', color:'#999'}}>Tidak ada data di bulan ini.</td></tr>
                        ) : (
                            logs.map(log => (
                                <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                                    <td style={{padding:10}}>{new Date(log.tanggal).toLocaleDateString('id-ID')}</td>
                                    <td style={{padding:10}}>{log.waktu}</td>
                                    <td style={{padding:10}}>
                                        <span style={{fontWeight:'bold'}}>{log.program}</span><br/>
                                        <span style={{fontSize:11, color:'#666'}}>{log.kegiatan}</span>
                                    </td>
                                    <td style={{padding:10}}>{log.detail}</td>
                                    <td style={{padding:10, textAlign:'center'}}>{log.siswaHadir}</td>
                                    <td style={{padding:10, textAlign:'center'}}>{log.durasiJam} Jam</td>
                                    <td style={{padding:10, textAlign:'center'}}>
                                        <span style={{
                                            background: log.status === 'Menunggu Validasi' ? '#fff3cd' : '#d4edda',
                                            color: log.status === 'Menunggu Validasi' ? '#856404' : '#155724',
                                            padding:'3px 8px', borderRadius:10, fontSize:11, fontWeight:'bold'
                                        }}>
                                            {log.status}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {/* FOOTER TANDA TANGAN */}
            <div style={{marginTop:50, display:'flex', justifyContent:'flex-end'}}>
                <div style={{textAlign:'center', width:200}}>
                    <p style={{marginBottom:60}}>Diserahkan Oleh,</p>
                    <p style={{borderTop:'1px solid #333', paddingTop:5, fontWeight:'bold'}}>{guru.nama}</p>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherHistory;