import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Save, Clock, UserCheck, ShieldAlert, CreditCard, 
  MessageSquare, FileText, List, Bold, Italic, Download, Table, AlertTriangle
} from 'lucide-react';

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    adminName: "",
    jamMasuk: "", 
    jamPulang: "", 
    siswa: {
      jumlahHadir: 0,
      namaTidakHadir: "",
      alasanAbsen: ""
    },
    tentor: {
      id: "",
      nama: "",
      status: "Hadir"
    },
    operasional: {
      pembayaranMasuk: "", 
      detailKomplain: "",
    },
    canvasNarasi: "", 
    riskLevel: "🟢 Aman",
    customRisk: "", // Untuk menambah risiko sendiri
    checklist: { areaBersih: false, acMati: false, pintuKunci: false, kasTersimpan: false }
  });

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
    } catch (e) { console.error("Gagal ambil data guru", e); }
  };

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const applyFormat = (tag) => {
    const textarea = document.getElementById('canvasNarasi');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let replacement = tag === 'B' ? `**${selectedText}**` : tag === 'I' ? `*${selectedText}*` : `\n- ${selectedText}`;
    setFormData({ ...formData, canvasNarasi: text.substring(0, start) + replacement + text.substring(end) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedT = teachers.find(t => t.id === formData.tentor.id);
      await addDoc(collection(db, "admin_daily_logs"), {
        ...formData,
        tentor: { ...formData.tentor, nama: selectedT?.nama || "Manual/Luar" },
        createdAt: serverTimestamp()
      });
      alert("Audit Terkunci & Tersimpan!");
      fetchHistory();
    } catch (error) { alert(error.message); } 
    finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? '0' : '260px', padding: isMobile ? '15px' : '30px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden' }}>
        
        <div style={styles.header}>
          <h2 style={{ margin: 0, color: '#1e293b' }}>Daily Audit Intelligence</h2>
          <input type="date" style={styles.dateInput} value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1.2fr', gap: '25px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* 1. INFORMASI DASAR & GURU */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><Clock size={18} /> Shift & Guru Bertugas</h3>
              <div style={styles.grid2}>
                <input style={styles.input} placeholder="Nama Admin" onChange={e => setFormData({...formData, adminName: e.target.value})} required />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input style={styles.input} placeholder="Jam Masuk" onChange={e => setFormData({...formData, jamMasuk: e.target.value})} required />
                  <input style={styles.input} placeholder="Jam Pulang" onChange={e => setFormData({...formData, jamPulang: e.target.value})} required />
                </div>
              </div>
              <div style={{ marginTop: 15 }}>
                <label style={styles.label}>Pilih Guru/Tentor yang Hadir</label>
                <select style={styles.input} onChange={e => setFormData({...formData, tentor: {...formData.tentor, id: e.target.value}})}>
                  <option value="">-- Klik untuk Pilih Guru --</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.nama} ({t.mapel})</option>)}
                </select>
              </div>
            </div>

            {/* 2. AUDIT SISWA */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><UserCheck size={18} /> Audit Kehadiran Siswa</h3>
              <div style={styles.grid2}>
                <div>
                  <label style={styles.label}>Jumlah Siswa Hadir</label>
                  <input type="number" style={styles.input} onChange={e => setFormData({...formData, siswa: {...formData.siswa, jumlahHadir: e.target.value}})} />
                </div>
                <div>
                  <label style={styles.label}>Nama Siswa Tidak Hadir</label>
                  <input style={styles.input} placeholder="Sebutkan nama-nama" onChange={e => setFormData({...formData, siswa: {...formData.siswa, namaTidakHadir: e.target.value}})} />
                </div>
              </div>
              <label style={styles.label}>Alasan Tidak Hadir (Analisis Churn/Masalah)</label>
              <textarea style={styles.textareaSmall} placeholder="Jelaskan alasan siswa tidak hadir..." onChange={e => setFormData({...formData, siswa: {...formData.siswa, alasanAbsen: e.target.value}})} />
            </div>

            {/* 3. TRANSAKSI & NARASI */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><CreditCard size={18} /> Log Transaksi & Narasi</h3>
              <textarea style={styles.textareaSmall} placeholder="Log Pembayaran (Nama - Nominal - Via)" onChange={e => setFormData({...formData, operasional: {...formData.operasional, pembayaranMasuk: e.target.value}})} />
              
              <div style={{ marginTop: 20 }}>
                <div style={styles.toolbarRow}>
                  <label style={styles.label}>Narasi Aktivitas Hari Ini</label>
                  <div style={styles.toolbar}>
                    <button type="button" onClick={() => applyFormat('B')} style={styles.toolBtn}><Bold size={14}/></button>
                    <button type="button" onClick={() => applyFormat('I')} style={styles.toolBtn}><Italic size={14}/></button>
                    <button type="button" onClick={() => applyFormat('L')} style={styles.toolBtn}><List size={14}/></button>
                  </div>
                </div>
                <textarea id="canvasNarasi" style={styles.canvas} value={formData.canvasNarasi} onChange={e => setFormData({...formData, canvasNarasi: e.target.value})} placeholder="Tuliskan semua detail kegiatan..." />
              </div>
            </div>
          </div>

          {/* SIDEBAR: RISK MANAGEMENT & SUBMIT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><AlertTriangle size={18} /> Risk Management</h3>
              <select style={styles.input} value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value})}>
                <option>🟢 Aman</option>
                <option>🟡 Ada Masalah (Follow Up)</option>
                <option>🔴 Urgent (Lapor Owner)</option>
              </select>
              <label style={styles.label}>Tambah Risiko Sendiri / Detail Masalah</label>
              <textarea style={styles.textareaSmall} placeholder="Input masalah spesifik/risiko baru di sini..." onChange={e => setFormData({...formData, customRisk: e.target.value})} />
              
              <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 15 }}>
                <h4 style={{ fontSize: 12, marginBottom: 10 }}>Closing Checklist</h4>
                {Object.keys(formData.checklist).map(key => (
                  <label key={key} style={styles.checkItem}>
                    <input type="checkbox" onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} />
                    <span>{key.toUpperCase()} OK</span>
                  </label>
                ))}
              </div>

              <button type="submit" style={styles.btnSubmit} disabled={loading}>
                {loading ? 'Processing...' : 'Simpan & Kunci Laporan'}
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><Table size={18} /> Audit Trail</h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.map(log => (
                  <div key={log.id} style={styles.historyRow}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13, truncate: 'true' }}>{log.tanggal}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{log.adminName} ({log.jamMasuk}-{log.jamPulang})</div>
                    </div>
                    <button type="button" onClick={() => alert("PDF Generating...")} style={styles.btnPdf}><FileText size={14}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

const styles = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, flexWrap: 'wrap', gap: 10 },
  card: { background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' },
  sectionTitle: { fontSize: 14, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a', fontWeight: 'bold' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  label: { display: 'block', fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 5, marginTop: 10 },
  input: { width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' },
  textareaSmall: { width: '100%', height: 70, padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', marginTop: 5 },
  canvas: { width: '100%', height: 200, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#fcfcfc', lineHeight: '1.5' },
  toolbarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 },
  toolbar: { display: 'flex', gap: 4, background: '#f1f5f9', padding: '4px', borderRadius: '8px' },
  toolBtn: { padding: '4px 8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', fontSize: 12 },
  btnSubmit: { width: '100%', padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: 15 },
  historyRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  btnPdf: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer' },
  dateInput: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: 13 }
};

export default AdminDailyLog;