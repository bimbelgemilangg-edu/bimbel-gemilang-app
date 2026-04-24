import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs } from "firebase/firestore";
import { Calendar, Clock, Users, Printer } from 'lucide-react';

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
    fetchLogs();
  }, [guru, selectedMonth]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "teacher_logs"), where("teacherId", "==", guru.id));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = data.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
      filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setLogs(filtered);
    } catch (err) { console.error("Error:", err); } 
    finally { setLoading(false); }
  };

  const handlePrint = () => window.print();
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });

  if (!guru) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* TOOLBAR */}
      <div style={{
        background: '#1e293b', padding: isMobile ? 15 : 20, color: 'white',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, borderRadius: 14, marginBottom: 20
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20 }}>Riwayat Sesi Mengajar</h3>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>Data berdasarkan bulan yang dipilih.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ background: 'white', display: 'flex', alignItems: 'center', padding: '0 10px', borderRadius: 8, gap: 6 }}>
            <Calendar size={14} color="#64748b" />
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ border: 'none', padding: '8px 0', outline: 'none', fontSize: 13, fontWeight: 'bold' }} />
          </div>
          <button onClick={handlePrint} style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 'bold', fontSize: 12 }}>
            <Printer size={14} /> {!isMobile && 'Cetak'}
          </button>
        </div>
      </div>

      {/* KARTU LAPORAN */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #f1f5f9', padding: isMobile ? 15 : 25, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
        
        <div style={{ textAlign: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: 15, marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: isMobile ? 16 : 22 }}>LAPORAN AKTIVITAS PENGAJAR</h2>
          <span style={{ display: 'inline-block', background: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', marginTop: 6 }}>{formattedPeriod}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: 12, background: '#f8fafc', borderRadius: 10 }}>
          <div>
            <small style={{ color: '#64748b', fontSize: 10 }}>Nama Pengajar</small>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{guru.nama}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: '#64748b', fontSize: 10 }}>Total Kontribusi</small>
            <div style={{ fontWeight: 'bold', fontSize: 15, color: '#2563eb' }}>{totalJam.toFixed(1)} Jam</div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        {!isMobile && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>Tanggal</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>Kegiatan</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>Detail</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>Siswa</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>Durasi</th>
                <th style={{ padding: 12, textAlign: 'left', fontSize: 12, color: '#475569' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center' }}>Memuat...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Tidak ada data.</td></tr>
              ) : logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: 12, fontSize: 13 }}>{log.tanggal}</td>
                  <td style={{ padding: 12, fontWeight: 'bold', fontSize: 13 }}>{log.kegiatan}</td>
                  <td style={{ padding: 12, fontSize: 11, color: '#64748b' }}>{log.detail}</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{log.siswaHadir} Siswa</td>
                  <td style={{ padding: 12, fontSize: 13 }}>{log.durasiJam} Jam</td>
                  <td style={{ padding: 12 }}>
                    <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 'bold', background: log.status === 'Disetujui' ? '#dcfce7' : '#fef3c7', color: log.status === 'Disetujui' ? '#16a34a' : '#d97706' }}>
                      {log.status || "Proses"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* MOBILE CARDS */}
        {isMobile && logs.map(log => (
          <div key={log.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 12, padding: 12, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong>{log.tanggal}</strong>
              <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 10, fontWeight: 'bold', background: '#fef3c7', color: '#d97706' }}>{log.status || "Proses"}</span>
            </div>
            <div style={{ margin: '8px 0', fontWeight: 'bold' }}>{log.kegiatan}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>{log.detail}</div>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
              <span><Users size={10}/> {log.siswaHadir} Siswa</span>
              <span><Clock size={10}/> {log.durasiJam} Jam</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeacherHistory;