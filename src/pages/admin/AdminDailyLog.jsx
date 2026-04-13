import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, getDocs, serverTimestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Form State Lengkap (Audit-Ready)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    adminName: "",
    // 1. Modul Presensi & KBM
    kbm: {
      siswaHadir: 0,
      siswaAbsenDetil: "",
      levelKelas: "Kelas 10",
      tentorHadir: "",
      statusTentor: "Hadir",
      mapel: "Matematika",
      kondisiKelas: ""
    },
    // 2. Log Kejadian & Risk Matrix
    risk: {
      kategori: "Operasional",
      urgensi: "🟢 Info",
      deskripsi: "",
      isResolved: false
    },
    // 3. Closing Checklist (Zero-Error)
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

  // Validasi: Tombol Submit hanya aktif jika Checklist TERCENTANG SEMUA
  const isChecklistComplete = Object.values(formData.checklist).every(val => val === true);

  useEffect(() => {
    fetchHistory();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    setHistory(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!isChecklistComplete) return alert("Peringatan: Semua prosedur Closing Checklist wajib dipenuhi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "admin_daily_logs"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      alert("Laporan Berhasil Disimpan & Terkunci.");
      fetchHistory();
    } catch (error) { console.error("Error:", error); } 
    finally { setLoading(false); }
  };

  const downloadPDF = (log) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DAILY OPERATIONAL & RISK INTELLIGENCE (DORI)", 14, 15);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${log.date} | Admin: ${log.adminName}`, 14, 22);
    
    doc.autoTable({
      startY: 30,
      head: [['Kategori Audit', 'Data / Hasil']],
      body: [
        ['[KBM] Siswa Hadir', log.kbm?.siswaHadir],
        ['[KBM] Mapel / Level', `${log.kbm?.mapel} - ${log.kbm?.levelKelas}`],
        ['[KBM] Tentor', `${log.kbm?.tentorHadir} (${log.kbm?.statusTentor})`],
        ['[RISK] Kategori & Urgensi', `${log.risk?.kategori} - ${log.risk?.urgensi}`],
        ['[RISK] Deskripsi Kejadian', log.risk?.deskripsi],
        ['[RISK] Status Solusi', log.risk?.isResolved ? '✅ SELESAI' : '❌ BELUM SELESAI'],
        ['[PROTOCOL] Integrity Check', 'ALL CRITICAL CHECKPOINTS PASSED']
      ],
    });
    doc.save(`LOG_${log.date}.pdf`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? '0' : '250px', padding: '30px', width: '100%' }}>
        <header style={{ marginBottom: '20px' }}>
          <h1 style={{ margin: 0, color: '#1a3353', fontSize: '24px' }}>System Risk Intelligence</h1>
          <p style={{ color: '#64748b' }}>Transforming Administration into Bankable Data Assets</p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr', gap: '25px' }}>
          <form onSubmit={handleSubmit}>
            {/* SECTION 1: KBM AUDIT */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>1. Modul Presensi & KBM (Manual Input)</h3>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Admin On Duty</label>
                  <input style={styles.input} type="text" onChange={(e) => setFormData({...formData, adminName: e.target.value})} required />
                </div>
                <div>
                  <label style={styles.label}>Jml Siswa Hadir</label>
                  <input style={styles.input} type="number" onChange={(e) => setFormData({...formData, kbm: {...formData.kbm, siswaHadir: e.target.value}})} />
                </div>
              </div>
              <label style={styles.label}>Tentor & Status</label>
              <div style={styles.grid2}>
                <input style={styles.input} placeholder="Nama Tentor" onChange={(e) => setFormData({...formData, kbm: {...formData.kbm, tentorHadir: e.target.value}})} />
                <select style={styles.input} onChange={(e) => setFormData({...formData, kbm: {...formData.kbm, statusTentor: e.target.value}})}>
                  <option>Hadir</option><option>Izin</option><option>Pengganti</option>
                </select>
              </div>
            </div>

            {/* SECTION 2: RISK MATRIX */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>2. Log Kejadian & Manajemen Risiko</h3>
              <div style={styles.grid2}>
                <select style={styles.input} onChange={(e) => setFormData({...formData, risk: {...formData.risk, kategori: e.target.value}})}>
                  <option>Siswa</option><option>Tentor</option><option>Fasilitas</option><option>Operasional</option><option>Keuangan</option>
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['🟢 Info', '🟡 Follow Up', '🔴 Urgent'].map(lvl => (
                    <label key={lvl} style={{ fontSize: '12px' }}>
                      <input type="radio" name="urgensi" value={lvl} onChange={(e) => setFormData({...formData, risk: {...formData.risk, urgensi: e.target.value}})} /> {lvl}
                    </label>
                  ))}
                </div>
              </div>
              <textarea style={styles.textarea} placeholder="Deskripsi kejadian..." onChange={(e) => setFormData({...formData, risk: {...formData.risk, deskripsi: e.target.value}})} />
              <label><input type="checkbox" onChange={(e) => setFormData({...formData, risk: {...formData.risk, isResolved: e.target.checked}})} /> Masalah sudah selesai?</label>
            </div>

            {/* SECTION 3: CLOSING CHECKLIST */}
            <div style={{ ...styles.card, border: '1px solid #e2e8f0' }}>
              <h3 style={styles.sectionTitle}>3. Zero-Error Protocol (Closing Checklist)</h3>
              {Object.keys(formData.checklist).map(key => (
                <label key={key} style={styles.checkLabel}>
                  <input type="checkbox" checked={formData.checklist[key]} 
                    onChange={(e) => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} />
                  <span style={{ marginLeft: '10px' }}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()}</span>
                </label>
              ))}
              <button type="submit" style={{...styles.btnSubmit, opacity: isChecklistComplete ? 1 : 0.5}} disabled={!isChecklistComplete || loading}>
                {loading ? 'Processing...' : 'Submit & Lock Daily Report'}
              </button>
            </div>
          </form>

          {/* HISTORY */}
          <div>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>History & Bank-Ready Audit</h3>
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {history.map((log) => (
                  <div key={log.id} style={styles.historyItem}>
                    <div>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{log.date}</span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Risk: {log.risk?.urgensi} | Admin: {log.adminName}</p>
                    </div>
                    <button onClick={() => downloadPDF(log)} style={styles.btnDownload}>PDF</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  card: { background: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '20px' },
  sectionTitle: { marginTop: 0, fontSize: '16px', color: '#334155', borderLeft: '4px solid #f39c12', paddingLeft: '12px', marginBottom: '20px' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' },
  textarea: { width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '10px', marginBottom: '10px' },
  checkLabel: { display: 'flex', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '6px', marginBottom: '5px', fontSize: '12px', cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: '15px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderBottom: '1px solid #f1f5f9' },
  btnDownload: { background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }
};

export default AdminDailyLog;