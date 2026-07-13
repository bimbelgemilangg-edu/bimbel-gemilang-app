// src/pages/teacher/TeacherHistory.jsx
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
    if (!guru) { 
      navigate('/login-guru'); 
      return; 
    }
    fetchLogs();
  }, [guru, selectedMonth]);

  // 🔥 FETCH LOGS DENGAN FALLBACK
  const fetchLogs = async () => {
    setLoading(true);
    try {
      let data = [];
      
      // 1. Coba query dengan teacherId
      if (guru.id) {
        const q1 = query(collection(db, "teacher_logs"), where("teacherId", "==", guru.id));
        const snap1 = await getDocs(q1);
        data = snap1.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // 2. Jika tidak ada, coba dengan nama (fallback)
      if (data.length === 0 && guru.nama) {
        const q2 = query(collection(db, "teacher_logs"), where("namaGuru", "==", guru.nama));
        const snap2 = await getDocs(q2);
        data = snap2.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
      
      // 3. Filter berdasarkan bulan
      const filtered = data.filter(item => item.tanggal && item.tanggal.startsWith(selectedMonth));
      filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setLogs(filtered);
    } catch (err) { 
      console.error("Error fetching logs:", err); 
    } 
    finally { setLoading(false); }
  };

  const handlePrint = () => window.print();
  
  // 🔥 HITUNG TOTAL JAM
  const totalJam = logs.reduce((acc, curr) => acc + (parseFloat(curr.durasiJam) || 0), 0);
  
  // 🔥 HITUNG TOTAL HONOR
  const totalHonor = logs.reduce((acc, curr) => acc + (parseFloat(curr.nominal) || 0), 0);
  
  // 🔥 HITUNG TOTAL SISWA
  const totalSiswa = logs.reduce((acc, curr) => acc + (parseInt(curr.siswaHadir) || 0), 0);
  
  const formattedPeriod = new Date(selectedMonth + "-01").toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long' 
  });

  if (!guru) return null;

  return (
    <div style={{ width: '100%' }}>
      {/* TOOLBAR */}
      <div style={{
        background: '#1e293b', 
        padding: isMobile ? 15 : 20, 
        color: 'white',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap', 
        gap: 12, 
        borderRadius: 14, 
        marginBottom: 20
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: isMobile ? 16 : 20 }}>
            📊 Riwayat Sesi Mengajar
          </h3>
          <p style={{ margin: 0, fontSize: 11, opacity: 0.7 }}>
            Data berdasarkan bulan yang dipilih.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ 
            background: 'white', 
            display: 'flex', 
            alignItems: 'center', 
            padding: '0 10px', 
            borderRadius: 8, 
            gap: 6 
          }}>
            <Calendar size={14} color="#64748b" />
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              style={{ 
                border: 'none', 
                padding: '8px 0', 
                outline: 'none', 
                fontSize: 13, 
                fontWeight: 'bold' 
              }} 
            />
          </div>
          <button 
            onClick={handlePrint} 
            style={{ 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '8px 14px', 
              borderRadius: 8, 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 6, 
              fontWeight: 'bold', 
              fontSize: 12 
            }}
          >
            <Printer size={14} /> {!isMobile && 'Cetak'}
          </button>
        </div>
      </div>

      {/* 🔥 KARTU RINGKASAN */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 10,
        marginBottom: 16
      }}>
        <div style={{
          background: 'white',
          padding: 14,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#3b82f6' }}>
            {logs.length}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Total Sesi</div>
        </div>
        <div style={{
          background: 'white',
          padding: 14,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#10b981' }}>
            {totalJam.toFixed(1)}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Total Jam</div>
        </div>
        <div style={{
          background: 'white',
          padding: 14,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#8b5cf6' }}>
            {totalSiswa}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Total Siswa</div>
        </div>
        <div style={{
          background: 'white',
          padding: 14,
          borderRadius: 12,
          border: '1px solid #f1f5f9',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#f59e0b' }}>
            Rp {(totalHonor / 1000).toFixed(0)}K
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>Total Honor</div>
        </div>
      </div>

      {/* KARTU LAPORAN */}
      <div style={{ 
        background: 'white', 
        borderRadius: 16, 
        border: '1px solid #f1f5f9', 
        padding: isMobile ? 15 : 25, 
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)' 
      }}>
        
        <div style={{ 
          textAlign: 'center', 
          borderBottom: '2px solid #f1f5f9', 
          paddingBottom: 15, 
          marginBottom: 20 
        }}>
          <h2 style={{ margin: 0, color: '#1e293b', fontSize: isMobile ? 16 : 22 }}>
            LAPORAN AKTIVITAS PENGAJAR
          </h2>
          <span style={{ 
            display: 'inline-block', 
            background: '#e0e7ff', 
            color: '#4338ca', 
            padding: '4px 10px', 
            borderRadius: 20, 
            fontSize: 11, 
            fontWeight: 'bold', 
            marginTop: 6 
          }}>
            {formattedPeriod}
          </span>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: 20, 
          padding: 12, 
          background: '#f8fafc', 
          borderRadius: 10,
          flexWrap: 'wrap',
          gap: 8
        }}>
          <div>
            <small style={{ color: '#64748b', fontSize: 10 }}>Nama Pengajar</small>
            <div style={{ fontWeight: 'bold', fontSize: 15 }}>{guru.nama}</div>
            {guru.guruId && (
              <div style={{ fontSize: 10, color: '#94a3b8' }}>
                ID: {guru.guruId}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right' }}>
            <small style={{ color: '#64748b', fontSize: 10 }}>Total Kontribusi</small>
            <div style={{ fontWeight: 'bold', fontSize: 15, color: '#2563eb' }}>
              {totalJam.toFixed(1)} Jam
            </div>
          </div>
        </div>

        {/* DESKTOP TABLE */}
        {!isMobile && (
          <div style={{ overflowX: 'auto' }}>
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
                  <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Memuat...</td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 30, textAlign: 'center', color: '#94a3b8' }}>Belum ada data riwayat mengajar.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      {log.tanggal}
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>{log.waktu || ''}</div>
                    </td>
                    <td style={{ padding: 12, fontWeight: 'bold', fontSize: 13 }}>
                      {log.kegiatan || 'Mengajar'}
                    </td>
                    <td style={{ padding: 12, fontSize: 11, color: '#64748b' }}>
                      {log.detail || '-'}
                      {log.level && <span style={{ marginLeft: 4, fontSize: 9, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{log.level}</span>}
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      <Users size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {log.siswaHadir || 0} Siswa
                    </td>
                    <td style={{ padding: 12, fontSize: 13 }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                      {log.durasiJam || 0} Jam
                    </td>
                    <td style={{ padding: 12 }}>
                      <span style={{ 
                        padding: '3px 10px', 
                        borderRadius: 20, 
                        fontSize: 10, 
                        fontWeight: 'bold',
                        background: log.status === 'Disetujui' || log.status === 'Kompensasi' ? '#dcfce7' : 
                                  log.status === 'Ditolak' ? '#fee2e2' : '#fef3c7',
                        color: log.status === 'Disetujui' || log.status === 'Kompensasi' ? '#16a34a' : 
                               log.status === 'Ditolak' ? '#dc2626' : '#d97706'
                      }}>
                        {log.status || 'Menunggu Validasi'}
                      </span>
                      {log.nominal > 0 && (
                        <div style={{ fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
                          Rp {log.nominal.toLocaleString()}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MOBILE CARDS */}
        {isMobile && (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Memuat...</div>
            ) : logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Belum ada data riwayat mengajar.</div>
            ) : logs.map(log => (
              <div key={log.id} style={{ 
                background: 'white', 
                border: '1px solid #e2e8f0', 
                borderRadius: 12, 
                padding: 14, 
                marginBottom: 10 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong style={{ fontSize: 13 }}>{log.tanggal}</strong>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{log.waktu || ''}</div>
                  </div>
                  <span style={{ 
                    padding: '2px 10px', 
                    borderRadius: 12, 
                    fontSize: 10, 
                    fontWeight: 'bold',
                    background: log.status === 'Disetujui' || log.status === 'Kompensasi' ? '#dcfce7' : '#fef3c7',
                    color: log.status === 'Disetujui' || log.status === 'Kompensasi' ? '#16a34a' : '#d97706'
                  }}>
                    {log.status || 'Menunggu Validasi'}
                  </span>
                </div>
                <div style={{ margin: '6px 0', fontWeight: 'bold', fontSize: 14 }}>
                  {log.kegiatan || 'Mengajar'}
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>
                  {log.detail || '-'}
                  {log.level && <span style={{ marginLeft: 4, fontSize: 9, background: '#f1f5f9', padding: '1px 6px', borderRadius: 4 }}>{log.level}</span>}
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b', flexWrap: 'wrap' }}>
                  <span><Users size={12} style={{ display: 'inline', marginRight: 4 }} /> {log.siswaHadir || 0} Siswa</span>
                  <span><Clock size={12} style={{ display: 'inline', marginRight: 4 }} /> {log.durasiJam || 0} Jam</span>
                  {log.nominal > 0 && (
                    <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>
                      Rp {log.nominal.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ 
        marginTop: 16, 
        textAlign: 'center', 
        fontSize: 9, 
        color: '#94a3b8',
        borderTop: '1px solid #f1f5f9',
        paddingTop: 12
      }}>
        © {new Date().getFullYear()} Bimbel Gemilang • Laporan Riwayat Mengajar
      </div>
    </div>
  );
};

export default TeacherHistory;