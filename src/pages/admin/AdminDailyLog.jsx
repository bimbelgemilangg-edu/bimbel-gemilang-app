import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  AlertCircle, CheckCircle2, ClipboardList, UserCheck, 
  ShieldAlert, Download, Clock, FileText, Table 
} from 'lucide-react';

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [history, setHistory] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('id-ID'),
    adminName: "",
    jamMasuk: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    kbm: {
      siswaHadir: 0,
      levelKelas: "Kelas 10",
      tentorId: "",
      mapel: "",
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
      kasTercatat: false
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
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!isChecklistComplete) return alert("❌ PROTOKOL GAGAL: Checklist closing wajib lengkap!");
    
    setLoading(true);
    try {
      const jamTutup = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const selectedTeacher = teachers.find(t => t.id === formData.kbm.tentorId);
      
      await addDoc(collection(db, "admin_daily_logs"), {
        ...formData,
        jamTutup,
        tentorNama: selectedTeacher?.nama || "N/A",
        createdAt: serverTimestamp()
      });
      alert("✅ Laporan Terkunci & Tersimpan.");
      fetchHistory();
    } catch (error) { alert(error.message); } 
    finally { setLoading(false); }
  };

  // --- EXPORT PDF ---
  const exportPDF = (log) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DAILY AUDIT REPORT - GEMILANG SYSTEM", 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${log.date} | Admin: ${log.adminName}`, 14, 28);
    doc.text(`Waktu: ${log.jamMasuk} s/d ${log.jamTutup}`, 14, 33);
    
    doc.autoTable({
      startY: 40,
      head: [['Field Audit', 'Data']],
      body: [
        ['Tentor Bertugas', log.tentorNama],
        ['Siswa Hadir', log.kbm.siswaHadir],
        ['Mata Pelajaran', log.kbm.mapel],
        ['Kategori Risiko', log.risk.kategori],
        ['Level Urgensi', log.risk.urgensi],
        ['Status Masalah', log.risk.isResolved ? 'Selesai' : 'Pending'],
        ['Protokol Closing', 'Verified']
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94] }
    });
    doc.save(`Laporan_${log.date}.pdf`);
  };

  // --- EXPORT EXCEL ---
  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('DailyLogs');
    
    worksheet.columns = [
      { header: 'Tanggal', key: 'date', width: 15 },
      { header: 'Admin', key: 'adminName', width: 20 },
      { header: 'Jam Masuk', key: 'jamMasuk', width: 12 },
      { header: 'Jam Tutup', key: 'jamTutup', width: 12 },
      { header: 'Tentor', key: 'tentorNama', width: 20 },
      { header: 'Risk Urgency', key: 'urgensi', width: 15 },
      { header: 'Risk Deskripsi', key: 'deskripsi', width: 30 },
    ];

    history.forEach(item => {
      worksheet.addRow({
        date: item.date,
        adminName: item.adminName,
        jamMasuk: item.jamMasuk,
        jamTutup: item.jamTutup,
        tentorNama: item.tentorNama,
        urgensi: item.risk.urgensi,
        deskripsi: item.risk.deskripsi
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `Rekap_Log_Admin.xlsx`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      <SidebarAdmin />
      <div style={{ 
        marginLeft: isMobile ? '0' : '260px', 
        padding: isMobile ? '15px' : '30px', 
        width: '100%',
        boxSizing: 'border-box'
      }}>
        
        {/* HEADER SECTION */}
        <div style={styles.header}>
          <div>
            <h2 style={{ color: '#1e293b', margin: 0 }}>Daily Integrity Log</h2>
            <p style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={14}/> {formData.date} | Shift Start: {formData.jamMasuk}
            </p>
          </div>
          <button onClick={exportExcel} style={styles.btnExcel} title="Download Rekap Excel">
            <Table size={18} /> {!isMobile && "Export Rekap"}
          </button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1.8fr 1.2fr', 
          gap: '20px',
          alignItems: 'start'
        }}>
          
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            {/* 1. KBM SECTION */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><UserCheck size={18} /> KBM Audit</h3>
              <div style={styles.gridResponsive}>
                <div style={{width: '100%'}}>
                  <label style={styles.label}>Admin Nama</label>
                  <input style={styles.input} type="text" onChange={e => setFormData({...formData, adminName: e.target.value})} required />
                </div>
                <div style={{width: '100%'}}>
                  <label style={styles.label}>Tentor Bertugas</label>
                  <select style={styles.input} required onChange={e => setFormData({...formData, kbm: {...formData.kbm, tentorId: e.target.value}})}>
                    <option value="">-- Pilih Guru --</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. RISK SECTION */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><ShieldAlert size={18} /> Risk Management</h3>
              <textarea 
                style={styles.textarea} 
                placeholder="Laporkan kendala harian jika ada..." 
                onChange={e => setFormData({...formData, risk: {...formData.risk, deskripsi: e.target.value}})} 
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {['🟢 Info', '🟡 Perlu Follow Up', '🔴 Urgent'].map(lvl => (
                  <label key={lvl} style={styles.radioLabel}>
                    <input type="radio" name="urg" value={lvl} onChange={e => setFormData({...formData, risk: {...formData.risk, urgensi: e.target.value}})} /> {lvl}
                  </label>
                ))}
              </div>
            </div>

            {/* 3. CLOSING CHECKLIST */}
            <div style={{...styles.card, borderLeft: '6px solid #ef4444'}}>
              <h3 style={styles.sectionTitle}><CheckCircle2 size={18} /> Zero-Error Protocol</h3>
              <div style={styles.checklistGrid}>
                {Object.keys(formData.checklist).map(key => (
                  <label key={key} style={styles.checkItem}>
                    <input type="checkbox" onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} />
                    <span style={{fontSize: 11}}>{key.toUpperCase()}</span>
                  </label>
                ))}
              </div>
              <button 
                type="submit" 
                style={{...styles.btnSubmit, background: isChecklistComplete ? '#2c3e50' : '#cbd5e1'}}
                disabled={!isChecklistComplete || loading}
              >
                {loading ? 'Processing...' : 'Kunci Laporan & Logout'}
              </button>
            </div>
          </form>

          {/* HISTORY LOGS */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}><ClipboardList size={18} /> Audit History</h3>
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {history.map(log => (
                <div key={log.id} style={styles.historyRow}>
                  <div style={{flex: 1, minWidth: 0}}>
                    <div style={{fontWeight: 'bold', fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>
                      {log.date}
                    </div>
                    <div style={{fontSize: 11, color: '#64748b'}}>{log.adminName} ({log.jamMasuk}-{log.jamTutup})</div>
                  </div>
                  <button onClick={() => exportPDF(log)} style={styles.btnMiniPdf}><FileText size={14}/></button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  card: { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: 15, boxSizing: 'border-box' },
  sectionTitle: { fontSize: 15, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 8, color: '#334155' },
  gridResponsive: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 10 },
  label: { display: 'block', fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
  input: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' },
  textarea: { width: '100%', height: 70, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, marginBottom: 10, boxSizing: 'border-box' },
  checklistGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 },
  checkItem: { display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: 10, borderRadius: 8, cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: 14, borderRadius: 10, border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', marginTop: 15 },
  btnExcel: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 15px', background: '#107c41', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' },
  historyRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  btnMiniPdf: { padding: 8, background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer' },
  radioLabel: { fontSize: 12, background: '#fff', border: '1px solid #e2e8f0', padding: '5px 10px', borderRadius: 6, cursor: 'pointer' }
};

export default AdminDailyLog;