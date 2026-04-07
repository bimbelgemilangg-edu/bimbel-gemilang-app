import React, { useState, useEffect, Fragment } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { collection, getDocs, doc, addDoc, deleteDoc, updateDoc } from "firebase/firestore";

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);

  const [activeBonusId, setActiveBonusId] = useState(null);
  const [bonusData, setBonusData] = useState({ keterangan: '', nominal: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teacher_logs"));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = logs.filter(log => {
        if (!log || !log.tanggal) return false;
        const parts = log.tanggal.split(' ');
        if (parts.length === 0) return false;
        const cleanDate = parts[0];
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
    } catch (error) { 
      console.error("Fetch Error:", error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const handleAddBonusAtDate = async (originalLog) => {
    if (!bonusData.keterangan || !bonusData.nominal) return alert("Isi data bonus!");
    try {
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: viewDetail.id,
        namaGuru: viewDetail.nama,
        tanggal: originalLog.tanggal,
        program: "BONUS/TAMBAHAN",
        detail: bonusData.keterangan,
        nominal: parseInt(bonusData.nominal),
        status: "Valid / Sudah Terekap",
        createdAt: new Date()
      });
      setBonusData({ keterangan: '', nominal: '' });
      setActiveBonusId(null);
      fetchData();
    } catch (e) { alert("Gagal"); }
  };

  const handleUpdateNominal = async (logId, newNominal) => {
    if(!newNominal) return;
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { nominal: parseInt(newNominal) });
      fetchData();
    } catch (e) { alert("Gagal update"); }
  };

  const handleApproveLog = async (logId) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { status: "Valid / Sudah Terekap" });
      fetchData();
    } catch (e) { alert("Gagal approve"); }
  };

  const handleUnapproveLog = async (logId) => {
    if (!window.confirm("Batalkan validasi untuk merevisi data ini?")) return;
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { status: "Menunggu Validasi" });
      fetchData();
    } catch (e) { alert("Gagal membatalkan validasi"); }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Yakin ingin menghapus baris riwayat ini secara permanen?")) return;
    try {
      await deleteDoc(doc(db, "teacher_logs", logId));
      fetchData();
    } catch (e) { alert("Gagal menghapus"); }
  };

  const handleDownload = (guru) => {
    const printWindow = window.open('', '_blank');
    if(!printWindow) return alert("Pop-up diblokir browser!");
    printWindow.document.write(`
      <html>
        <head><title>Slip Gaji - ${guru.nama}</title></head>
        <body style="font-family: sans-serif; padding: 20px;">
          <h2 style="text-align:center;">REKAP GAJI GURU</h2>
          <hr/>
          <p><b>Nama:</b> ${guru.nama}</p>
          <p><b>Periode:</b> ${startDate} s/d ${endDate}</p>
          <table border="1" style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background: #eee;">
                <th style="padding: 8px;">Tanggal</th>
                <th style="padding: 8px;">Jenjang/Program</th>
                <th style="padding: 8px;">Informasi Sesi</th>
                <th style="padding: 8px;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${guru.rincian.sort((a,b) => (b.tanggal || '').localeCompare(a.tanggal || '')).map(r => `
                <tr>
                  <td style="padding: 8px;">${r.tanggal} ${r.waktu ? `<br/><small>${r.waktu}</small>` : ''}</td>
                  <td style="padding: 8px; text-align: center;">
                    <b>${r.level || '-'}</b><br/>
                    <small>${r.program}</small>
                  </td>
                  <td style="padding: 8px;">
                    <small>
                      ${r.durasiJam ? `Durasi: ${r.durasiJam} Jam | ` : ''}
                      ${r.siswaHadir !== undefined ? `Kehadiran: ${r.siswaHadir} Siswa<br/>` : ''}
                      ${r.detail}
                    </small>
                  </td>
                  <td style="padding: 8px; text-align: right;">Rp ${parseInt(r.nominal || 0).toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold;">
                <td colspan="3" style="padding: 8px; text-align: right;">TOTAL TERIMA:</td>
                <td style="padding: 8px; text-align: right;">Rp ${guru.totalGaji.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>
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
        
        <div style={styles.headerCard}>
          <div>
            <h2 style={{margin:0}}>💰 Rekap Gaji & Validasi Harian</h2>
            <p style={{color:'#666', marginTop:5}}>Kelola honor berdasarkan jenjang dan durasi mengajar.</p>
          </div>
          <div style={styles.totalBox}>
            <small style={{fontWeight:'bold'}}>TOTAL PENGELUARAN:</small>
            <h2 style={{color:'#27ae60', margin:0}}>Rp {totalPengeluaran.toLocaleString()}</h2>
          </div>
        </div>

        <div style={{marginBottom:20, display:'flex', gap:10, alignItems:'center'}}>
            <span style={{fontSize:14, fontWeight:'bold'}}>Periode:</span>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.inputDate} />
            <span style={{fontSize:14}}>s/d</span>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.inputDate} />
            <button onClick={fetchData} style={styles.btnRefresh}>Segarkan</button>
        </div>

        <div style={styles.cardTable}>
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
                    <button onClick={() => setViewDetail(g)} style={styles.btnDetail}>Rincian & Tindakan</button>
                    <button onClick={() => handleDownload(g)} style={styles.btnDownload}>Download Slip</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {viewDetail && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>Laporan Sesi: {viewDetail.nama}</h3>
                <button onClick={()=>setViewDetail(null)} style={styles.btnClose}>&times;</button>
              </div>

              <div style={{maxHeight:'500px', overflowY:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead style={{background:'#f8f9fa', position:'sticky', top:0, zIndex:1}}>
                    <tr>
                      <th style={styles.thSmall}>Tanggal/Waktu</th>
                      <th style={styles.thSmall}>Jenjang</th>
                      <th style={styles.thSmall}>Informasi Sesi</th>
                      <th style={styles.thSmall}>Nominal (Rp)</th>
                      <th style={styles.thSmall}>Status / Tindakan</th>
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
                            <span style={{fontSize: 11, color: '#7f8c8d'}}>{log.waktu || '-'}</span>
                          </td>
                          <td style={styles.tdSmall}>
                            <div style={styles.badgeLevel}>{log.level || 'N/A'}</div>
                          </td>
                          <td style={styles.tdSmall}>
                            <span style={{color: log.program === 'BONUS/TAMBAHAN' ? '#e67e22' : '#2980b9', fontWeight:'bold'}}>
                                {log.program || 'Kegiatan'}
                            </span>
                            <div style={{fontSize: 11, color: '#34495e', margin: '4px 0', display: 'flex', gap: 10}}>
                              {log.durasiJam !== undefined && <span>⏳ {log.durasiJam} Jam</span>}
                              {log.siswaHadir !== undefined && <span>👥 {log.siswaHadir} Hadir</span>}
                            </div>
                            <small style={{display: 'block', color: '#7f8c8d'}}>{log.detail}</small>
                          </td>
                          <td style={styles.tdSmall}>
                            <input 
                              type="number" 
                              disabled={isValid}
                              defaultValue={log.nominal} 
                              onBlur={(e) => handleUpdateNominal(log.id, e.target.value)}
                              style={{...styles.inputNominal, borderColor: isValid ? '#2ecc71' : '#3498db'}}
                              title={isValid ? "Batalkan validasi untuk mengedit" : "Edit nominal langsung"}
                            />
                          </td>
                          <td style={styles.tdSmall}>
                            {isValid ? (
                              <div style={{display:'flex', flexDirection:'column', gap:5, alignItems:'flex-start'}}>
                                <div style={styles.badgeSuccess}>✅ Valid & Terekap</div>
                                <button onClick={()=>handleUnapproveLog(log.id)} style={styles.btnRevise}>Batal & Revisi</button>
                              </div>
                            ) : (
                              <div style={{display:'flex', gap:5, flexWrap:'wrap'}}>
                                <button onClick={()=>handleApproveLog(log.id)} style={styles.btnApprove}>Approve</button>
                                <button onClick={()=>setActiveBonusId(log.id)} style={styles.btnBonus}>+ Bonus</button>
                                <button onClick={()=>handleDeleteLog(log.id)} style={styles.btnDelete}>Hapus</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        
                        {activeBonusId === log.id && (
                          <tr style={{background:'#fff9e6'}}>
                            <td colSpan="5" style={{padding:15, borderBottom:'2px solid #f39c12'}}>
                                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                    <b style={{fontSize:11}}>TAMBAH BONUS UNTUK TGL INI:</b>
                                    <input placeholder="Keterangan..." onChange={e=>setBonusData({...bonusData, keterangan:e.target.value})} style={styles.miniInput}/>
                                    <input type="number" placeholder="Nominal" onChange={e=>setBonusData({...bonusData, nominal:e.target.value})} style={styles.miniInput}/>
                                    <button onClick={()=>handleAddBonusAtDate(log)} style={styles.btnSaveBonus}>Simpan</button>
                                    <button onClick={()=>setActiveBonusId(null)} style={{border:'none', background:'none', cursor:'pointer', color:'red'}}>Batal</button>
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
              <div style={{marginTop:20, textAlign:'right', borderTop:'2px solid #eee', paddingTop:15}}>
                  <h3 style={{margin:0, color:'#2c3e50'}}>Total Keseluruhan Periode: <span style={{color:'#27ae60'}}>Rp {viewDetail.totalGaji.toLocaleString()}</span></h3>
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
  totalBox: { textAlign:'right', background:'#e8f8f5', padding:'10px 20px', borderRadius:12, border:'1px solid #27ae60' },
  inputDate: { padding:8, borderRadius:8, border:'1px solid #ddd' },
  btnRefresh: { background:'#95a5a6', color:'white', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer' },
  cardTable: { background:'white', borderRadius:15, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:15, textAlign:'left' },
  td: { padding:15, borderBottom:'1px solid #eee' },
  btnDetail: { background:'#3498db', color:'white', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer', fontWeight:'bold', marginRight:5 },
  btnDownload: { background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer', fontWeight:'bold' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 },
  modal: { background:'white', padding:25, borderRadius:20, width:'1100px', maxWidth:'95%' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:20 },
  btnClose: { background:'none', border:'none', fontSize:24, cursor:'pointer' },
  thSmall: { padding:12, fontSize:12, textAlign:'left', color:'#7f8c8d' },
  tdSmall: { padding:12, fontSize:13 },
  badgeLevel: { background:'#f1f5f9', color:'#475569', padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:'bold', textAlign:'center', border:'1px solid #e2e8f0', display:'inline-block' },
  inputNominal: { width:'110px', padding:8, borderRadius:6, border:'2px solid', fontWeight:'bold', textAlign:'right' },
  badgeSuccess: { color:'#27ae60', fontWeight:'bold', fontSize:11, background:'#eafaf1', padding:'5px 12px', borderRadius:20, border:'1px solid #2ecc71' },
  btnApprove: { background:'#2ecc71', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnBonus: { background:'#f39c12', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnDelete: { background:'#e74c3c', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnRevise: { background:'#f1f5f9', color:'#e74c3c', border:'1px solid #e2e8f0', padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:'bold', marginTop:4 },
  miniInput: { padding:8, borderRadius:6, border:'1px solid #ddd', fontSize:12, width:'140px' },
  btnSaveBonus: { background:'#2c3e50', color:'white', border:'none', padding:'8px 15px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:'bold' },
};

export default TeacherSalaries;