import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, addDoc, query, orderBy, getDocs, timestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    adminName: "",
    stressLevel: 5,
    issues: { supply: false, complaint: false, technical: false, security: false },
    pendingNotes: "",
    cashBalance: 0
  });

  useEffect(() => {
    fetchHistory();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("date", "desc"));
    const querySnapshot = await getDocs(q);
    const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setHistory(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "admin_daily_logs"), {
        ...formData,
        timestamp: new Date()
      });
      alert("Laporan Berhasil Disimpan!");
      fetchHistory();
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (log) => {
    const doc = new jsPDF();
    doc.text(`LAPORAN HARIAN OPERASIONAL - ${log.date}`, 10, 10);
    doc.autoTable({
      head: [['Kategori', 'Detail']],
      body: [
        ['Admin', log.adminName],
        ['Stress Level', `${log.stressLevel}/10`],
        ['Masalah Pending', log.pendingNotes],
        ['Saldo Fisik', `Rp ${parseInt(log.cashBalance).toLocaleString()}`],
        ['Status Risiko', Object.keys(log.issues).filter(k => log.issues[k]).join(', ') || 'Aman']
      ],
    });
    doc.save(`Laporan_${log.date}.pdf`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? '0' : '250px', padding: '20px', width: '100%' }}>
        <h2 style={{ color: '#2c3e50' }}>📋 Admin Daily Log & Risk Report</h2>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
          {/* FORM INPUT */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Input Laporan Hari Ini</h3>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Nama Admin</label>
              <input style={styles.input} type="text" onChange={(e) => setFormData({...formData, adminName: e.target.value})} required />
              
              <label style={styles.label}>Stress Level Operasional (1-10)</label>
              <input type="range" min="1" max="10" value={formData.stressLevel} style={{width:'100%'}} 
                onChange={(e) => setFormData({...formData, stressLevel: e.target.value})} />
              
              <div style={{margin: '15px 0'}}>
                <label style={styles.label}>Cek Potensi Masalah:</label>
                {Object.keys(formData.issues).map(key => (
                  <label key={key} style={{display:'block', fontSize:'14px', textTransform:'capitalize'}}>
                    <input type="checkbox" onChange={(e) => setFormData({
                      ...formData, issues: {...formData.issues, [key]: e.target.checked}
                    })} /> {key} Issue
                  </label>
                ))}
              </div>

              <label style={styles.label}>Tugas/Masalah Belum Selesai (Pending)</label>
              <textarea style={styles.textarea} placeholder="Contoh: AC kelas 3 bocor, Refund siswa A belum diproses..." 
                onChange={(e) => setFormData({...formData, pendingNotes: e.target.value})}></textarea>

              <button type="submit" style={styles.btnSubmit} disabled={loading}>
                {loading ? 'Menyimpan...' : 'Kunci & Simpan Laporan'}
              </button>
            </form>
          </div>

          {/* HISTORY & DOWNLOAD */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>History Laporan (Owner Download)</h3>
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              {history.map((log) => (
                <div key={log.id} style={styles.historyItem}>
                  <div>
                    <span style={{fontWeight:'bold'}}>{log.date}</span>
                    <p style={{margin:0, fontSize:'12px', color:'#7f8c8d'}}>Admin: {log.adminName}</p>
                  </div>
                  <button onClick={() => downloadPDF(log)} style={styles.btnDownload}>PDF</button>
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
  card: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  cardTitle: { marginTop: 0, borderBottom: '2px solid #f1f1f1', paddingBottom: '10px', fontSize: '18px' },
  label: { display: 'block', marginTop: '15px', fontWeight: 'bold', fontSize: '14px', color: '#34495e' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' },
  textarea: { width: '100%', minHeight: '80px', padding: '10px', marginTop: '5px', borderRadius: '6px', border: '1px solid #ddd' },
  btnSubmit: { width: '100%', padding: '12px', background: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', marginTop: '20px', cursor: 'pointer', fontWeight: 'bold' },
  historyItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee' },
  btnDownload: { background: '#e74c3c', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer' }
};

export default AdminDailyLog;