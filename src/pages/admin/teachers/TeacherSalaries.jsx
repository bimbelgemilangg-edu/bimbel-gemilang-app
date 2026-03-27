import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, writeBatch, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rekap, setRekap] = useState([]);
  const [allLogs, setAllLogs] = useState([]);
  const [viewDetail, setViewDetail] = useState(null);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teacher_logs"));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllLogs(logs);

      // Filter berdasarkan range tanggal
      const filtered = logs.filter(log => {
        if (!log.tanggal) return false;
        const cleanDate = log.tanggal.split(' ')[0];
        return cleanDate >= startDate && cleanDate <= endDate;
      });

      const guruMap = {};
      let grandTotal = 0;

      filtered.forEach(log => {
        const nominal = parseInt(log.nominal || 0);
        grandTotal += nominal;

        if (!guruMap[log.teacherId]) {
          guruMap[log.teacherId] = { 
            id: log.teacherId, 
            nama: log.namaGuru || "Tanpa Nama", 
            totalGaji: 0, 
            totalSesi: 0, 
            rincian: [] 
          };
        }
        guruMap[log.teacherId].totalGaji += nominal;
        guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].rincian.push(log);
      });

      setTotalPengeluaran(grandTotal);
      setRekap(Object.values(guruMap));
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  // Update Nominal Per Hari (Admin Edit)
  const handleUpdateNominal = async (logId, newNominal) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { nominal: parseInt(newNominal) });
      fetchData(); // Refresh data
    } catch (e) { alert("Gagal update nominal"); }
  };

  // Hapus Laporan (Admin Batalkan)
  const handleDeleteLog = async (logId) => {
    if (window.confirm("Hapus laporan mengajar ini?")) {
      await deleteDoc(doc(db, "teacher_logs", logId));
      fetchData();
    }
  };

  // Approve Per Hari
  const handleApproveLog = async (logId) => {
    await updateDoc(doc(db, "teacher_logs", logId), { status: "Valid / Approved" });
    fetchData();
  };

  // Download PDF / Print per Guru
  const handleDownload = (guru) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Slip Gaji - ${guru.nama}</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2>Slip Gaji Guru: ${guru.nama}</h2>
          <p>Periode: ${startDate} s/d ${endDate}</p>
          <table border="1" style="width:100%; border-collapse: collapse; text-align: left;">
            <thead>
              <tr style="background: #eee;">
                <th style="padding: 8px;">Tanggal</th>
                <th style="padding: 8px;">Keterangan</th>
                <th style="padding: 8px;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${guru.rincian.map(r => `
                <tr>
                  <td style="padding: 8px;">${r.tanggal}</td>
                  <td style="padding: 8px;">${r.program} - ${r.level}</td>
                  <td style="padding: 8px;">Rp ${parseInt(r.nominal).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold;">
                <td colspan="2" style="padding: 8px; text-align: right;">TOTAL TERIMA:</td>
                <td style="padding: 8px;">Rp ${guru.totalGaji.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
          <p style="margin-top: 30px;">Dicetak pada: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: 250, padding: 30, width: 'calc(100% - 250px)' }}>
        
        {/* HEADER & SUMMARY */}
        <div style={styles.headerCard}>
          <div>
            <h2 style={{margin:0}}>💰 Rekapitulasi Gaji & Pengeluaran</h2>
            <p style={{color:'#666'}}>Kelola, Edit, dan Approve honor mengajar guru</p>
          </div>
          <div style={styles.totalBox}>
            <small>TOTAL PENGELUARAN PERIODE INI:</small>
            <h2 style={{color:'#e67e22', margin:0}}>Rp {totalPengeluaran.toLocaleString()}</h2>
          </div>
        </div>

        {/* FILTER BAR */}
        <div style={styles.filterBar}>
          <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.inputDate} />
          <span style={{alignSelf:'center'}}>s/d</span>
          <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.inputDate} />
          <button onClick={fetchData} style={styles.btnRefresh}>🔄 Segarkan Data</button>
        </div>

        {/* TABLE REKAP PER GURU */}
        <div style={styles.cardTable}>
          <table style={styles.table}>
            <thead style={{background:'#2c3e50', color:'white'}}>
              <tr>
                <th style={styles.th}>Nama Guru</th>
                <th style={styles.th}>Sesi</th>
                <th style={styles.th}>Total Honor</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rekap.map(g => (
                <tr key={g.id} style={styles.tr}>
                  <td style={styles.td}><b>{g.nama}</b></td>
                  <td style={styles.td}>{g.totalSesi} Pertemuan</td>
                  <td style={styles.td}><b>Rp {g.totalGaji.toLocaleString()}</b></td>
                  <td style={styles.td}>
                    <button onClick={() => setViewDetail(g)} style={styles.btnDetail}>Rincian / Edit</button>
                    <button onClick={() => handleDownload(g)} style={styles.btnPrint}>🖨️ Cetak Gaji</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL RINCIAN PER HARI (FITUR EDIT & DELETE) */}
        {viewDetail && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3>Rincian Mengajar: {viewDetail.nama}</h3>
                <button onClick={()=>setViewDetail(null)} style={styles.btnClose}>&times;</button>
              </div>
              
              <div style={{maxHeight:'450px', overflowY:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead>
                    <tr style={{background:'#f8f9fa', textAlign:'left'}}>
                      <th style={styles.thSmall}>Tanggal</th>
                      <th style={styles.thSmall}>Materi</th>
                      <th style={styles.thSmall}>Nominal (Edit)</th>
                      <th style={styles.thSmall}>Status</th>
                      <th style={styles.thSmall}>Opsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.rincian.map((log) => (
                      <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                        <td style={styles.tdSmall}>{log.tanggal}</td>
                        <td style={styles.tdSmall}>{log.program} - {log.detail}</td>
                        <td style={styles.tdSmall}>
                          <input 
                            type="number" 
                            defaultValue={log.nominal} 
                            onBlur={(e) => handleUpdateNominal(log.id, e.target.value)}
                            style={styles.inputNominal}
                          />
                        </td>
                        <td style={styles.tdSmall}>
                          <span style={{color: log.status.includes('Valid') ? 'green' : 'orange'}}>
                            {log.status}
                          </span>
                        </td>
                        <td style={styles.tdSmall}>
                          {log.status !== "Valid / Approved" && (
                            <button onClick={()=>handleApproveLog(log.id)} style={styles.btnMiniApprove}>Approve</button>
                          )}
                          <button onClick={()=>handleDeleteLog(log.id)} style={styles.btnMiniDelete}>Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  headerCard: { background:'white', padding:20, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  totalBox: { textAlign:'right', background:'#fdf2e9', padding:'10px 20px', borderRadius:12, border:'1px solid #e67e22' },
  filterBar: { display:'flex', gap:10, marginBottom:20 },
  inputDate: { padding:10, borderRadius:8, border:'1px solid #ddd' },
  btnRefresh: { background:'#3498db', color:'white', border:'none', padding:'10px 20px', borderRadius:8, cursor:'pointer' },
  cardTable: { background:'white', borderRadius:15, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:15, textAlign:'left' },
  td: { padding:15, borderBottom:'1px solid #eee' },
  btnDetail: { background:'#3498db', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', marginRight:5 },
  btnPrint: { background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 },
  modal: { background:'white', padding:25, borderRadius:15, width:'850px', maxWidth:'95%' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:20 },
  btnClose: { background:'none', border:'none', fontSize:24, cursor:'pointer' },
  thSmall: { padding:10, fontSize:12 },
  tdSmall: { padding:10, fontSize:12 },
  inputNominal: { width:'100px', padding:5, borderRadius:5, border:'1px solid #ddd' },
  btnMiniApprove: { background:'#2ecc71', color:'white', border:'none', padding:'4px 8px', borderRadius:4, fontSize:10, marginRight:3, cursor:'pointer' },
  btnMiniDelete: { background:'#e74c3c', color:'white', border:'none', padding:'4px 8px', borderRadius:4, fontSize:10, cursor:'pointer' }
};

export default TeacherSalaries;