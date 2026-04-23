import React, { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { ArrowLeft, RefreshCw, Download, Eye, X, ChevronRight, Home, DollarSign, Users, Clock, FileText } from 'lucide-react';

const TeacherSalaries = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [alertMsg, setAlertMsg] = useState(null);

  const [activeBonusId, setActiveBonusId] = useState(null);
  const [bonusData, setBonusData] = useState({ keterangan: '', nominal: '' });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teacher_logs"));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const filtered = logs.filter(log => {
        if (!log || !log.tanggal) return false;
        const parts = log.tanggal.split(' ');
        const cleanDate = parts[0];
        return cleanDate >= startDate && cleanDate <= endDate;
      });

      const guruMap = {};
      let grandTotal = 0;
      filtered.forEach(log => {
        const nominal = parseInt(log.nominal || 0);
        grandTotal += nominal;
        if (!guruMap[log.teacherId]) {
          guruMap[log.teacherId] = { id: log.teacherId, nama: log.namaGuru || "Tanpa Nama", totalGaji: 0, totalSesi: 0, rincian: [] };
        }
        guruMap[log.teacherId].totalGaji += nominal;
        if (log.program !== "BONUS/TAMBAHAN") guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].rincian.push(log);
      });

      setTotalPengeluaran(grandTotal);
      setRekap(Object.values(guruMap));
      
      if (viewDetail) {
        const updated = Object.values(guruMap).find(g => g.id === viewDetail.id);
        if (updated) setViewDetail(updated);
        else setViewDetail(null);
      }
    } catch (error) { console.error("Fetch Error:", error); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const handleAddBonusAtDate = async (originalLog) => {
    if (!bonusData.keterangan || !bonusData.nominal) return showAlert("⚠️ Isi keterangan dan nominal bonus!");
    try {
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: viewDetail.id, namaGuru: viewDetail.nama,
        tanggal: originalLog.tanggal, program: "BONUS/TAMBAHAN",
        detail: bonusData.keterangan, nominal: parseInt(bonusData.nominal),
        status: "Valid / Sudah Terekap", createdAt: new Date()
      });
      setBonusData({ keterangan: '', nominal: '' });
      setActiveBonusId(null);
      showAlert("✅ Bonus berhasil ditambahkan!");
      fetchData();
    } catch (e) { showAlert("❌ Gagal menambah bonus"); }
  };

  const handleUpdateNominal = async (logId, newNominal) => {
    if(!newNominal) return;
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { nominal: parseInt(newNominal) });
      fetchData();
    } catch (e) { showAlert("❌ Gagal update nominal"); }
  };

  const handleApproveLog = async (logId) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { status: "Valid / Sudah Terekap" });
      showAlert("✅ Log disetujui!");
      fetchData();
    } catch (e) { showAlert("❌ Gagal approve"); }
  };

  const handleUnapproveLog = async (logId) => {
    if (!window.confirm("Batalkan validasi untuk merevisi data ini?")) return;
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { status: "Menunggu Validasi" });
      showAlert("🔓 Validasi dibatalkan");
      fetchData();
    } catch (e) { showAlert("❌ Gagal membatalkan"); }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Yakin ingin menghapus baris riwayat ini secara permanen?")) return;
    try {
      await deleteDoc(doc(db, "teacher_logs", logId));
      showAlert("🗑️ Log dihapus!");
      fetchData();
    } catch (e) { showAlert("❌ Gagal menghapus"); }
  };

  const handleDownload = (guru) => {
    const printWindow = window.open('', '_blank');
    if(!printWindow) return showAlert("⚠️ Pop-up diblokir browser!");
    printWindow.document.write(`
      <html><head><title>Slip Gaji - ${guru.nama}</title></head>
      <body style="font-family: sans-serif; padding: 20px;">
        <h2 style="text-align:center;">REKAP GAJI GURU</h2><hr/>
        <p><b>Nama:</b> ${guru.nama}</p>
        <p><b>Periode:</b> ${startDate} s/d ${endDate}</p>
        <table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">
          <thead><tr style="background: #eee;"><th style="padding: 8px;">Tanggal</th><th style="padding: 8px;">Program</th><th style="padding: 8px;">Detail</th><th style="padding: 8px;">Nominal</th></tr></thead>
          <tbody>${guru.rincian.sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || '')).map(r => `
            <tr><td style="padding: 8px;">${r.tanggal} ${r.waktu ? `<br/><small>${r.waktu}</small>` : ''}</td><td style="padding: 8px;">${r.program}</td><td style="padding: 8px;"><small>${r.detail}</small></td><td style="padding: 8px; text-align: right;">Rp ${parseInt(r.nominal || 0).toLocaleString()}</td></tr>
          `).join('')}</tbody>
          <tfoot><tr style="font-weight: bold;"><td colspan="3" style="padding: 8px; text-align: right;">TOTAL:</td><td style="padding: 8px; text-align: right;">Rp ${guru.totalGaji.toLocaleString()}</td></tr></tfoot>
        </table>
      </body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {/* TOAST */}
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* BREADCRUMB + BACK */}
        <div style={styles.breadcrumb(isMobile)}>
          <button onClick={() => navigate('/admin/teachers')} style={styles.backButton}>
            <ArrowLeft size={16} /> Kembali ke Kelola Guru
          </button>
          <div style={styles.breadcrumbTrail}>
            <Home size={12} color="#94a3b8" />
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#94a3b8'}}>Kelola Guru</span>
            <ChevronRight size={12} color="#94a3b8" />
            <span style={{color: '#3b82f6', fontWeight: 'bold'}}>Gaji Guru</span>
          </div>
        </div>

        {/* HEADER */}
        <div style={styles.headerCard(isMobile)}>
          <div>
            <h2 style={styles.pageTitle(isMobile)}><DollarSign size={22} /> Rekap Gaji & Validasi Harian</h2>
            <p style={styles.subtitle(isMobile)}>Kelola honor berdasarkan jenjang dan durasi mengajar.</p>
          </div>
          <div style={styles.totalBox(isMobile)}>
            <small style={{fontWeight:'bold'}}>TOTAL PENGELUARAN:</small>
            <h2 style={{color:'#27ae60', margin:0, fontSize: isMobile ? 18 : 24}}>Rp {totalPengeluaran.toLocaleString()}</h2>
          </div>
        </div>

        {/* PERIODE FILTER */}
        <div style={styles.filterRow(isMobile)}>
          <span style={styles.filterLabel}>Periode:</span>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.dateInput(isMobile)} />
          <span style={styles.filterLabel}>s/d</span>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.dateInput(isMobile)} />
          <button onClick={fetchData} style={styles.btnRefresh(isMobile)}>
            <RefreshCw size={14} /> Segarkan
          </button>
        </div>

        {/* TABEL UTAMA */}
        <div style={styles.cardTable}>
          {loading ? (
            <div style={styles.emptyState}>Memuat data gaji...</div>
          ) : rekap.length === 0 ? (
            <div style={styles.emptyState}>
              <FileText size={40} color="#94a3b8" />
              <p>Belum ada data gaji untuk periode ini.</p>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead style={{background:'#2c3e50', color:'white'}}>
                  <tr>
                    <th style={styles.th}>Nama Guru</th>
                    <th style={styles.th}>Total Sesi</th>
                    <th style={styles.th}>Total Gaji</th>
                    <th style={styles.th}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map(g => (
                    <tr key={g.id}>
                      <td style={styles.td}><b>{g.nama}</b></td>
                      <td style={styles.td}>{g.totalSesi} Sesi</td>
                      <td style={styles.td}><b>Rp {g.totalGaji.toLocaleString()}</b></td>
                      <td style={styles.td}>
                        <div style={styles.actionButtons(isMobile)}>
                          <button onClick={() => setViewDetail(g)} style={styles.btnDetail}><Eye size={14} /> Rincian</button>
                          <button onClick={() => handleDownload(g)} style={styles.btnDownload}><Download size={14} /> Slip</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL RINCIAN */}
        {viewDetail && (
          <div style={styles.overlay} onClick={() => setViewDetail(null)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0, fontSize: isMobile ? 16 : 18}}>📋 Laporan Sesi: {viewDetail.nama}</h3>
                <button onClick={()=>setViewDetail(null)} style={styles.btnClose}><X size={20} /></button>
              </div>

              <div style={{maxHeight: isMobile ? '50vh' : '500px', overflowY: 'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize: isMobile ? 11 : 13}}>
                  <thead style={{background:'#f8f9fa', position:'sticky', top:0, zIndex:1}}>
                    <tr>
                      <th style={styles.thSmall}>Tanggal</th>
                      <th style={styles.thSmall}>Program</th>
                      <th style={styles.thSmall}>Detail</th>
                      <th style={styles.thSmall}>Nominal</th>
                      <th style={styles.thSmall}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.rincian.sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || '')).map((log) => {
                      const isValid = log.status === "Valid / Sudah Terekap";
                      return (
                        <Fragment key={log.id}>
                        <tr style={{borderBottom:'1px solid #eee', background: isValid ? '#fafffa' : 'white'}}>
                          <td style={styles.tdSmall}>
                            <b>{log.tanggal}</b><br/>
                            <span style={{fontSize: 10, color: '#7f8c8d'}}>{log.waktu || '-'}</span>
                          </td>
                          <td style={styles.tdSmall}>
                            <span style={{color: log.program === 'BONUS/TAMBAHAN' ? '#e67e22' : '#2980b9', fontWeight:'bold', fontSize: isMobile ? 10 : 12}}>
                              {log.program || 'Kegiatan'}
                            </span>
                          </td>
                          <td style={styles.tdSmall}>
                            <small style={{color: '#7f8c8d'}}>{log.detail}</small>
                          </td>
                          <td style={styles.tdSmall}>
                            <input type="number" disabled={isValid} defaultValue={log.nominal} onBlur={(e) => handleUpdateNominal(log.id, e.target.value)}
                              style={{...styles.inputNominal(isMobile), borderColor: isValid ? '#2ecc71' : '#3498db'}} />
                          </td>
                          <td style={styles.tdSmall}>
                            {isValid ? (
                              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                                <span style={styles.badgeSuccess}>✅ Valid</span>
                                <button onClick={()=>handleUnapproveLog(log.id)} style={styles.btnRevise}>Batal</button>
                              </div>
                            ) : (
                              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                                <button onClick={()=>handleApproveLog(log.id)} style={styles.btnApprove}>✓</button>
                                <button onClick={()=>setActiveBonusId(log.id)} style={styles.btnBonus}>+</button>
                                <button onClick={()=>handleDeleteLog(log.id)} style={styles.btnDelete}>✕</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        {activeBonusId === log.id && (
                          <tr style={{background:'#fff9e6'}}>
                            <td colSpan="5" style={{padding:10}}>
                                <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                                    <b style={{fontSize:11}}>TAMBAH BONUS:</b>
                                    <input placeholder="Keterangan..." onChange={e=>setBonusData({...bonusData, keterangan:e.target.value})} style={styles.miniInput} />
                                    <input type="number" placeholder="Nominal" onChange={e=>setBonusData({...bonusData, nominal:e.target.value})} style={styles.miniInput} />
                                    <button onClick={()=>handleAddBonusAtDate(log)} style={styles.btnSaveBonus}>Simpan</button>
                                    <button onClick={()=>setActiveBonusId(null)} style={{border:'none', background:'none', cursor:'pointer', color:'red', fontSize:11}}>Batal</button>
                                </div>
                            </td>
                          </tr>
                        )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:15, textAlign:'right', borderTop:'2px solid #eee', paddingTop:15}}>
                <h3 style={{margin:0, color:'#2c3e50', fontSize: isMobile ? 14 : 18}}>
                  Total: <span style={{color:'#27ae60'}}>Rp {viewDetail.totalGaji.toLocaleString()}</span>
                </h3>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', background: '#f8fafc' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '250px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', transition: '0.3s' }),
  
  // TOAST
  toast: { position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#1e293b', color: 'white', padding: '12px 20px', borderRadius: 12, fontWeight: 'bold', fontSize: 14, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' },
  
  // BREADCRUMB
  breadcrumb: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexDirection: m ? 'column' : 'row', gap: m ? 8 : 0 }),
  backButton: { background: 'white', border: '1px solid #e2e8f0', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, color: '#64748b' },
  breadcrumbTrail: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 },
  
  // HEADER
  headerCard: (m) => ({ background:'white', padding: m ? 15 : 20, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, boxShadow:'0 2px 10px rgba(0,0,0,0.05)', flexDirection: m ? 'column' : 'row', gap: m ? 10 : 0 }),
  pageTitle: (m) => ({ margin:0, fontSize: m ? 16 : 20, display:'flex', alignItems:'center', gap:8 }),
  subtitle: (m) => ({ color:'#666', marginTop:5, fontSize: m ? 11 : 13 }),
  totalBox: (m) => ({ textAlign: m ? 'center' : 'right', background:'#e8f8f5', padding: m ? '10px 15px' : '10px 20px', borderRadius:12, border:'1px solid #27ae60' }),
  
  // FILTER
  filterRow: (m) => ({ marginBottom:20, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }),
  filterLabel: { fontSize:13, fontWeight:'bold' },
  dateInput: (m) => ({ padding: m ? 6 : 8, borderRadius:8, border:'1px solid #ddd', fontSize: m ? 11 : 13 }),
  btnRefresh: (m) => ({ background:'#95a5a6', color:'white', border:'none', padding: m ? '6px 10px' : '8px 15px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize: m ? 11 : 12, fontWeight:'bold' }),
  
  // TABLE
  cardTable: { background:'white', borderRadius:15, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse', minWidth:'600px' },
  th: { padding:15, textAlign:'left', fontSize:12 },
  td: { padding:15, borderBottom:'1px solid #eee', fontSize:13 },
  actionButtons: (m) => ({ display:'flex', gap:5, flexDirection: m ? 'column' : 'row' }),
  btnDetail: { background:'#3498db', color:'white', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontWeight:'bold', fontSize:12, display:'flex', alignItems:'center', gap:4 },
  btnDownload: { background:'#27ae60', color:'white', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontWeight:'bold', fontSize:12, display:'flex', alignItems:'center', gap:4 },
  emptyState: { textAlign:'center', padding:50, color:'#94a3b8' },
  
  // MODAL
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems: isMobile ? 'flex-end' : 'center', zIndex:2000 },
  modal: (m) => ({ background:'white', padding: m ? 15 : 25, borderRadius: m ? '20px 20px 0 0' : 20, width: m ? '100%' : '95%', maxWidth: '1100px', maxHeight: '90vh', overflow: 'hidden', display:'flex', flexDirection:'column' }),
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:15 },
  btnClose: { background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#e74c3c' },
  thSmall: { padding:10, fontSize:11, textAlign:'left', color:'#7f8c8d', borderBottom:'2px solid #eee' },
  tdSmall: { padding:10, fontSize:12, borderBottom:'1px solid #f1f5f9' },
  inputNominal: (m) => ({ width: m ? 80 : 100, padding:6, borderRadius:6, border:'2px solid', fontWeight:'bold', textAlign:'right', fontSize: m ? 11 : 12 }),
  badgeSuccess: { color:'#27ae60', fontWeight:'bold', fontSize:10, background:'#eafaf1', padding:'3px 8px', borderRadius:20 },
  btnApprove: { background:'#2ecc71', color:'white', border:'none', padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnBonus: { background:'#f39c12', color:'white', border:'none', padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnDelete: { background:'#e74c3c', color:'white', border:'none', padding:'5px 10px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnRevise: { background:'#f1f5f9', color:'#e74c3c', border:'1px solid #e2e8f0', padding:'3px 8px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:'bold' },
  miniInput: { padding:6, borderRadius:6, border:'1px solid #ddd', fontSize:11, width:'120px' },
  btnSaveBonus: { background:'#2c3e50', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
};

export default TeacherSalaries;