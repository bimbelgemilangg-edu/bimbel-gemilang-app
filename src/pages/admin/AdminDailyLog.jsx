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
  MessageSquare, FileText, List, Bold, Italic, Download, Table, XCircle
} from 'lucide-react';

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    adminName: "",
    jamMasuk: "", // Manual Input sesuai permintaan
    jamPulang: "", // Manual Input sesuai permintaan
    // --- 1. AUDIT SISWA DETAIL ---
    siswa: {
      jumlahHadir: 0,
      namaTidakHadir: "",
      alasanAbsen: ""
    },
    // --- 2. KEUANGAN & KOMPLAIN ---
    operasional: {
      pembayaranMasuk: "", // Detail siapa yang bayar & nominal
      detailKomplain: "",
      masalahFasilitas: ""
    },
    // --- 3. NARASI LOG AKTIVITAS (CANVAS) ---
    canvasNarasi: "", 
    riskLevel: "🟢 Aman",
    checklist: { areaBersih: false, acMati: false, pintuKunci: false, kasTersimpan: false }
  });

  useEffect(() => {
    fetchHistory();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // Helper untuk Rich Text di Textarea (Canvas)
  const applyFormat = (tag) => {
    const textarea = document.getElementById('canvasNarasi');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    let replacement = "";

    if (tag === 'B') replacement = `**${selectedText}**`;
    else if (tag === 'I') replacement = `*${selectedText}*`;
    else if (tag === 'L') replacement = `\n- ${selectedText}`;

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setFormData({ ...formData, canvasNarasi: newText });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.adminName || !formData.jamMasuk || !formData.jamPulang) {
      return alert("Jam Masuk, Jam Pulang, dan Nama Admin wajib diisi manual!");
    }
    setLoading(true);
    try {
      await addDoc(collection(db, "admin_daily_logs"), {
        ...formData,
        createdAt: serverTimestamp()
      });
      alert("Laporan Audit Harian Berhasil Dikunci!");
      fetchHistory();
    } catch (error) { alert("Error: " + error.message); } 
    finally { setLoading(false); }
  };

  // --- EXPORT PDF DETAIL ---
  const exportPDF = (log) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("OFFICIAL DAILY AUDIT REPORT", 14, 15);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${log.tanggal} | Admin: ${log.adminName}`, 14, 22);
    doc.text(`Shift: ${log.jamMasuk} s/d ${log.jamPulang}`, 14, 27);

    doc.autoTable({
      startY: 35,
      head: [['Kategori Audit', 'Keterangan Detail']],
      body: [
        ['Siswa Hadir', `${log.siswa.jumlahHadir} Orang`],
        ['Siswa Absen', log.siswa.namaTidakHadir || 'Nihil'],
        ['Alasan Absen', log.siswa.alasanAbsen || '-'],
        ['Log Pembayaran', log.operasional.pembayaranMasuk || 'Tidak ada transaksi'],
        ['Log Komplain', log.operasional.detailKomplain || 'Aman'],
        ['Status Risiko', log.riskLevel],
      ],
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80] }
    });

    const finalY = doc.lastAutoTable.finalY || 100;
    doc.text("NARASI AKTIVITAS & CATATAN ADMIN:", 14, finalY + 10);
    const splitText = doc.splitTextToSize(log.canvasNarasi, 180);
    doc.text(splitText, 14, finalY + 18);
    
    doc.save(`Audit_${log.tanggal}_${log.adminName}.pdf`);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? '0' : '260px', padding: '25px', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, color: '#1e293b' }}>Audit Operasional & Risiko</h2>
            <p style={{ color: '#64748b', fontSize: 13 }}>Input data secara presisi untuk laporan bulanan Owner.</p>
          </div>
          <input type="date" style={styles.dateInput} value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
        </div>

        <form onSubmit={handleSubmit} style={styles.mainGrid}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* SECTION 1: ADMIN & TIME */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><Clock size={18} /> Informasi Shift (Manual)</h3>
              <div style={styles.grid2}>
                <input style={styles.input} placeholder="Nama Admin" onChange={e => setFormData({...formData, adminName: e.target.value})} required />
                <div style={{ display: 'flex', gap: 10 }}>
                  <input style={styles.input} placeholder="Jam Masuk" onChange={e => setFormData({...formData, jamMasuk: e.target.value})} required />
                  <input style={styles.input} placeholder="Jam Pulang" onChange={e => setFormData({...formData, jamPulang: e.target.value})} required />
                </div>
              </div>
            </div>

            {/* SECTION 2: SISWA DETAIL */}
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
              <label style={styles.label}>Alasan Tidak Hadir (Sakit/Izin/Tanpa Ket)</label>
              <input style={styles.input} onChange={e => setFormData({...formData, siswa: {...formData.siswa, alasanAbsen: e.target.value}})} />
            </div>

            {/* SECTION 3: KEUANGAN & KOMPLAIN */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><CreditCard size={18} /> Transaksi & Komplain</h3>
              <label style={styles.label}>Log Pembayaran Masuk (Nama Siswa - Nominal - Metod Bayar)</label>
              <textarea style={styles.textareaSmall} placeholder="Contoh: Budi - SPP Maret - 500rb - Transfer BCA" onChange={e => setFormData({...formData, operasional: {...formData.operasional, pembayaranMasuk: e.target.value}})} />
              
              <label style={styles.label}>Log Komplain / Masalah Fasilitas</label>
              <textarea style={styles.textareaSmall} placeholder="Contoh: Orang tua Ani komplain jadwal bentrok / AC Kelas 2 bunyi" onChange={e => setFormData({...formData, operasional: {...formData.operasional, detailKomplain: e.target.value}})} />
            </div>

            {/* SECTION 4: RICH CANVAS NARASI */}
            <div style={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}><FileText size={18} /> Narasi Aktivitas Harian</h3>
                <div style={styles.toolbar}>
                  <button type="button" onClick={() => applyFormat('B')} style={styles.toolBtn}><Bold size={14}/></button>
                  <button type="button" onClick={() => applyFormat('I')} style={styles.toolBtn}><Italic size={14}/></button>
                  <button type="button" onClick={() => applyFormat('L')} style={styles.toolBtn}><List size={14}/></button>
                </div>
              </div>
              <textarea 
                id="canvasNarasi"
                style={styles.canvas} 
                value={formData.canvasNarasi}
                placeholder="Tuliskan detail apa saja yang dilakukan hari ini (Narasi panjang)..." 
                onChange={e => setFormData({...formData, canvasNarasi: e.target.value})} 
              />
            </div>
          </div>

          {/* SIDEBAR SUBMIT & HISTORY */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><ShieldAlert size={18} /> Risk & Closing</h3>
              <select style={styles.input} onChange={e => setFormData({...formData, riskLevel: e.target.value})}>
                <option>🟢 Aman</option>
                <option>🟡 Ada Masalah (Follow Up)</option>
                <option>🔴 Urgent (Lapor Owner)</option>
              </select>
              
              <div style={{ marginTop: 15 }}>
                {Object.keys(formData.checklist).map(key => (
                  <label key={key} style={styles.checkItem}>
                    <input type="checkbox" onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} />
                    <span style={{ fontSize: 11 }}>{key.replace(/([A-Z])/g, ' $1').toUpperCase()} OK</span>
                  </label>
                ))}
              </div>

              <button type="submit" style={styles.btnSubmit} disabled={loading}>
                {loading ? 'Mengunci...' : 'Simpan & Kunci Laporan'}
              </button>
            </div>

            <div style={styles.card}>
              <h3 style={styles.sectionTitle}><Download size={18} /> History Audit</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {history.map(log => (
                  <div key={log.id} style={styles.historyRow}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 'bold', fontSize: 13 }}>{log.tanggal}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>{log.adminName} ({log.jamMasuk}-{log.jamPulang})</div>
                    </div>
                    <button type="button" onClick={() => exportPDF(log)} style={styles.btnPdf}><FileText size={14}/></button>
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
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  mainGrid: { display: 'grid', gridTemplateColumns: window.innerWidth < 1024 ? '1fr' : '2fr 1fr', gap: 25 },
  card: { background: 'white', padding: 25, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  sectionTitle: { fontSize: 15, margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 },
  label: { display: 'block', fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 5, marginTop: 15 },
  input: { width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' },
  textareaSmall: { width: '100%', height: 60, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' },
  canvas: { width: '100%', height: 250, padding: 15, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, lineHeight: '1.6', boxSizing: 'border-box', background: '#fdfdfd' },
  toolbar: { display: 'flex', gap: 5, background: '#f1f5f9', padding: 5, borderRadius: 8 },
  toolBtn: { padding: '5px 10px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer' },
  btnSubmit: { width: '100%', padding: 15, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', marginTop: 20 },
  historyRow: { display: 'flex', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' },
  btnPdf: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: 8, borderRadius: 8, cursor: 'pointer' },
  dateInput: { padding: '8px 15px', borderRadius: 10, border: '1px solid #cbd5e1' }
};

export default AdminDailyLog;