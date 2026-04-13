import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { AlertCircle, CheckCircle2, ClipboardList, UserCheck, ShieldAlert, Download } from 'lucide-react';

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [history, setHistory] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    adminName: "",
    kbm: {
      siswaHadir: 0,
      siswaAbsenDetil: "",
      levelKelas: "Kelas 10",
      tentorId: "", // Mengambil ID dari koleksi teachers
      statusTentor: "Hadir",
      mapel: "",
      kondisiKelas: ""
    },
    risk: {
      kategori: "Operasional",
      urgensi: "🟢 Info",
      deskripsi: "",
      isResolved: false
    },
    checklist: {
      chatBalas: false,
      areaBersih: false,
      acMati: false,
      lcdMati: false,
      pintuKunci: false,
      kasTercatat: false,
      brankasAman: false
    }
  });

  const isChecklistComplete = Object.values(formData.checklist).every(val => val === true);

  useEffect(() => {
    fetchTeachers();
    fetchHistory();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTeachers = async () => {
    try {
      const snap = await getDocs(collection(db, "teachers"));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Error fetching teachers:", e); }
  };

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!isChecklistComplete) return alert("❌ PROTOKOL GAGAL: Semua checklist closing wajib dicentang!");
    
    setLoading(true);
    try {
      const selectedTeacher = teachers.find(t => t.id === formData.kbm.tentorId);
      await addDoc(collection(db, "admin_daily_logs"), {
        ...formData,
        kbm: { ...formData.kbm, tentorNama: selectedTeacher?.nama || "Tidak Dipilih" },
        createdAt: serverTimestamp()
      });
      alert("✅ Laporan Berhasil Disimpan & Dikunci.");
      fetchHistory();
    } catch (error) { alert("Error: " + error.message); } 
    finally { setLoading(false); }
  };

  const downloadPDF = (log) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("DAILY OPERATIONAL LOG REPORT", 14, 20);
    doc.setFontSize(10);
    doc.text(`ID Laporan: ${log.id} | Tanggal: ${log.date}`, 14, 28);
    
    doc.autoTable({
      startY: 35,
      head: [['Kategori Audit', 'Detail Aktivitas']],
      body: [
        ['Admin On Duty', log.adminName],
        ['Presensi Siswa', `${log.kbm.siswaHadir} Hadir (Absen: ${log.kbm.siswaAbsenDetil || '-'})`],
        ['Data Tentor', `${log.kbm.tentorNama} (${log.kbm.statusTentor})`],
        ['Mata Pelajaran', log.kbm.mapel],
        ['Risk Kategori', log.risk.kategori],
        ['Urgency Level', log.risk.urgensi],
        ['Deskripsi Risk', log.risk.deskripsi],
        ['Status Solusi', log.risk.isResolved ? 'TERATASI' : 'PENDING'],
        ['Protokol Closing', 'LULUS (Semua Poin Terverifikasi)']
      ],
      theme: 'grid',
      headStyles: { fillColor: [44, 62, 80] }
    });
    doc.save(`LOG_${log.date}_${log.adminName}.pdf`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: '100%' }}>
        
        <div style={styles.header}>
          <div>
            <h2 style={{ color: '#1e293b', margin: 0 }}>📋 Daily Integrity Log</h2>
            <p style={{ color: '#64748b', fontSize: 14 }}>Wajib diisi lengkap sebelum admin meninggalkan outlet.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.8fr 1.2fr', gap: '25px' }}>
          <form onSubmit={handleSubmit}>
            {/* 1. KBM & TEACHER INTEGRATION */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><UserCheck size={18} /> 1. Presensi & Aktivitas KBM</h3>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Nama Admin</label>
                  <input style={styles.input} type="text" onChange={e => setFormData({...formData, adminName: e.target.value})} required placeholder="Input nama admin" />
                </div>
                <div>
                  <label style={styles.label}>Pilih Tentor Bertugas</label>
                  <select style={styles.input} required onChange={e => setFormData({...formData, kbm: {...formData.kbm, tentorId: e.target.value}})}>
                    <option value="">-- Pilih Guru --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.nama} ({t.mapel})</option>)}
                  </select>
                </div>
              </div>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Jumlah Siswa Hadir</label>
                  <input style={styles.input} type="number" onChange={e => setFormData({...formData, kbm: {...formData.kbm, siswaHadir: e.target.value}})} />
                </div>
                <div>
                  <label style={styles.label}>Mata Pelajaran</label>
                  <input style={styles.input} type="text" onChange={e => setFormData({...formData, kbm: {...formData.kbm, mapel: e.target.value}})} placeholder="Contoh: Fisika" />
                </div>
              </div>
            </div>

            {/* 2. RISK MANAGEMENT */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><ShieldAlert size={18} /> 2. Manajemen Risiko & Kejadian</h3>
              <div style={styles.grid2}>
                <select style={styles.input} onChange={e => setFormData({...formData, risk: {...formData.risk, kategori: e.target.value}})}>
                  <option>Operasional</option><option>Siswa</option><option>Fasilitas</option><option>Keuangan</option>
                </select>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['🟢 Info', '🟡 Follow Up', '🔴 Urgent'].map(lvl => (
                    <label key={lvl} style={{ fontSize: 11, cursor:'pointer' }}>
                      <input type="radio" name="urgency" value={lvl} onChange={e => setFormData({...formData, risk: {...formData.risk, urgensi: e.target.value}})} /> {lvl}
                    </label>
                  ))}
                </div>
              </div>
              <textarea style={styles.textarea} placeholder="Tuliskan jika ada kendala atau laporan penting..." onChange={e => setFormData({...formData, risk: {...formData.risk, deskripsi: e.target.value}})} />
              <label style={{fontSize: 13, display:'flex', alignItems:'center', gap:8}}>
                <input type="checkbox" onChange={e => setFormData({...formData, risk: {...formData.risk, isResolved: e.target.checked}})} /> Masalah sudah diselesaikan di tempat?
              </label>
            </div>

            {/* 3. CLOSING CHECKLIST */}
            <div style={{...styles.card, border: isChecklistComplete ? '2px solid #22c55e' : '2px solid #ef4444'}}>
              <h3 style={styles.sectionTitle}><CheckCircle2 size={18} /> 3. Zero-Error Closing Protocol</h3>
              <div style={{display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10}}>
                {Object.keys(formData.checklist).map(key => (
                  <label key={key} style={styles.checkItem}>
                    <input type="checkbox" checked={formData.checklist[key]} onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} />
                    <span>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                  </label>
                ))}
              </div>
              <button type="submit" style={{...styles.btnSubmit, background: isChecklistComplete ? '#2c3e50' : '#cbd5e1'}} disabled={!isChecklistComplete || loading}>
                {loading ? 'Mengunci Data...' : 'Submit & Tutup Hari Ini'}
              </button>
              {!isChecklistComplete && <p style={{color:'#ef4444', fontSize:11, textAlign:'center', marginTop:10}}>* Tombol aktif setelah semua checklist tercentang.</p>}
            </div>
          </form>

          {/* HISTORY LOG */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><ClipboardList size={18} /> Audit Trail (Recent Logs)</h3>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {history.map(log => (
                <div key={log.id} style={styles.logItem}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:'bold', fontSize:14}}>{log.date}</div>
                    <div style={{fontSize:12, color:'#64748b'}}>{log.adminName} • {log.risk.urgensi}</div>
                  </div>
                  <button onClick={() => downloadPDF(log)} style={styles.btnPdf}><Download size={14}/></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  header: { marginBottom: 30 },
  card: { background: 'white', padding: 25, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', marginBottom: 20 },
  sectionTitle: { fontSize: 16, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#334155' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' },
  textarea: { width: '100%', height: 80, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, marginBottom: 10, boxSizing: 'border-box' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', padding: 12, borderRadius: 10, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: 15, borderRadius: 12, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: 20, transition: '0.3s' },
  logItem: { display: 'flex', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid #f1f5f9' },
  btnPdf: { padding: 8, background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 8, cursor: 'pointer' }
};

export default AdminDailyLog;