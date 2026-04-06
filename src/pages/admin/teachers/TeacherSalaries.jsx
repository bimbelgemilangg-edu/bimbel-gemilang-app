import React, { useState, useEffect } from 'react';
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
        if (!log.tanggal) return false;
        // Pastikan format tanggal murni YYYY-MM-DD untuk perbandingan
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
        if (log.program !== "BONUS/TAMBAHAN") guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].rincian.push(log);
      });

      setTotalPengeluaran(grandTotal);
      setRekap(Object.values(guruMap));
      
      // Auto-update modal jika sedang terbuka
      if (viewDetail) {
        const updated = Object.values(guruMap).find(g => g.id === viewDetail.id);
        if (updated) setViewDetail(updated);
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
    } catch (e) { alert("Gagal menambahkan bonus"); }
  };

  const handleUpdateNominal = async (logId, newNominal) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { nominal: parseInt(newNominal) });
      fetchData();
    } catch (e) { alert("Gagal update nominal"); }
  };

  const handleApproveLog = async (logId) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { status: "Valid / Sudah Terekap" });
      fetchData();
    } catch (e) { alert("Gagal validasi"); }
  };

  const handleDownload = (guru) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Slip Gaji - ${guru.nama}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background: #f4f4f4; }
            .header { text-align: center; margin-bottom: 30px; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>REKAP HONOR PENGAJAR</h2>
            <p>Periode: ${startDate} s/d ${endDate}</p>
          </div>
          <p><b>Nama Guru:</b> ${guru.nama}</p>
          <table>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Program & Detail Materi</th>
                <th>Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${guru.rincian.sort((a,b) => a.tanggal.localeCompare(b.tanggal)).map(r => `
                <tr>
                  <td>${r.tanggal}</td>
                  <td><b>${r.subLevel || r.program}</b><br/>${r.detail}</td>
                  <td style="text-align: right;">Rp ${parseInt(r.nominal).toLocaleString('id-ID')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">Total Diterima: Rp ${guru.totalGaji.toLocaleString('id-ID')}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: 250, padding: 30, width: 'calc(100% - 250px)' }}>
        
        <div style={styles.headerCard}>
          <div>
            <h2 style={{margin:0}}>💰 Rekap Gaji & Validasi</h2>
            <p style={{color:'#666', marginTop:5}}>Manajemen honorarium pengajar berdasarkan sesi kelas.</p>
          </div>
          <div style={styles.totalBox}>
            <small style={{fontWeight:'bold', color:'#27ae60'}}>TOTAL PENGELUARAN PERIODE INI:</small>
            <h2 style={{color:'#27ae60', margin:0}}>Rp {totalPengeluaran.toLocaleString('id-ID')}</h2>
          </div>
        </div>

        <div style={{marginBottom:20, display:'flex', gap:10, alignItems:'center', background:'white', padding:'15px', borderRadius:'12px', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <span style={{fontSize:14, fontWeight:'bold'}}>Filter Periode:</span>
            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.inputDate} />
            <span style={{fontSize:14}}>s/d</span>
            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.inputDate} />
            <button onClick={fetchData} style={styles.btnRefresh}>🔄 Segarkan Data</button>
        </div>

        <div style={styles.cardTable}>
          <table style={styles.table}>
            <thead style={{background:'#2c3e50', color:'white'}}>
              <tr>
                <th style={styles.th}>Nama Guru</th>
                <th style={styles.th}>Total Sesi</th>
                <th style={styles.th}>Total Honor</th>
                <th style={styles.th}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rekap.length > 0 ? rekap.map(g => (
                <tr key={g.id}>
                  <td style={styles.td}><b>{g.nama}</b></td>
                  <td style={styles.td}>{g.totalSesi} Sesi Terdaftar</td>
                  <td style={styles.td}><b>Rp {g.totalGaji.toLocaleString('id-ID')}</b></td>
                  <td style={styles.td}>
                    <button onClick={() => setViewDetail(g)} style={styles.btnDetail}>Rincian Log</button>
                    <button onClick={() => handleDownload(g)} style={styles.btnDownload}>Cetak Slip</button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="4" style={{textAlign:'center', padding:20, color:'#999'}}>Tidak ada data log pada periode ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {viewDetail && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>Rincian Aktivitas: {viewDetail.nama}</h3>
                <button onClick={()=>setViewDetail(null)} style={styles.btnClose}>&times;</button>
              </div>

              <div style={{maxHeight:'500px', overflowY:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead style={{background:'#f8f9fa', position:'sticky', top:0, zIndex:1}}>
                    <tr>
                      <th style={styles.thSmall}>Tanggal</th>
                      <th style={styles.thSmall}>Program & Materi</th>
                      <th style={styles.thSmall}>Nominal (Rp)</th>
                      <th style={styles.thSmall}>Tindakan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.rincian.sort((a,b) => b.tanggal.localeCompare(a.tanggal)).map((log) => {
                      const isValid = log.status === "Valid / Sudah Terekap";
                      return (
                        <React.Fragment key={log.id}>
                        <tr style={{borderBottom:'1px solid #eee', background: isValid ? '#fafffa' : 'white'}}>
                          <td style={styles.tdSmall}>{log.tanggal}</td>
                          <td style={styles.tdSmall}>
                            <span style={{color: log.program === 'BONUS/TAMBAHAN' ? '#e67e22' : '#2980b9', fontWeight:'bold'}}>
                                {log.subLevel || log.program}
                            </span><br/>
                            <small style={{color:'#666'}}>{log.detail}</small>
                          </td>
                          <td style={styles.tdSmall}>
                            <input 
                              type="number" 
                              disabled={isValid}
                              defaultValue={log.nominal} 
                              onBlur={(e) => handleUpdateNominal(log.id, e.target.value)}
                              style={{...styles.inputNominal, borderColor: isValid ? '#2ecc71' : '#3498db'}}
                            />
                          </td>
                          <td style={styles.tdSmall}>
                            {isValid ? (
                              <div style={styles.badgeSuccess}>✅ Valid</div>
                            ) : (
                              <div style={{display:'flex', gap:5}}>
                                <button onClick={()=>handleApproveLog(log.id)} style={styles.btnApprove}>Approve</button>
                                <button onClick={()=>setActiveBonusId(log.id)} style={styles.btnBonus}>+ Bonus</button>
                                <button onClick={()=> { if(window.confirm("Hapus log ini?")) deleteDoc(doc(db,"teacher_logs",log.id)).then(()=>fetchData()) }} style={styles.btnDelete}>Hapus</button>
                              </div>
                            )}
                          </td>
                        </tr>
                        
                        {activeBonusId === log.id && (
                          <tr style={{background:'#fff9e6'}}>
                            <td colSpan="4" style={{padding:15, borderBottom:'2px solid #f39c12'}}>
                                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                                    <b style={{fontSize:11}}>TAMBAH BONUS PADA TANGGAL INI:</b>
                                    <input placeholder="Ket. Bonus..." onChange={e=>setBonusData({...bonusData, keterangan:e.target.value})} style={styles.miniInput}/>
                                    <input type="number" placeholder="Nominal" onChange={e=>setBonusData({...bonusData, nominal:e.target.value})} style={styles.miniInput}/>
                                    <button onClick={()=>handleAddBonusAtDate(log)} style={styles.btnSaveBonus}>Simpan Bonus</button>
                                    <button onClick={()=>setActiveBonusId(null)} style={{border:'none', background:'none', cursor:'pointer', color:'red', fontSize:12}}>Batal</button>
                                </div>
                            </td>
                          </tr>
                        )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <p style={{fontSize:12, color:'#666'}}>* Klik nominal untuk mengubah angka manual (auto-save saat klik di luar box).</p>
                  <h3 style={{margin:0}}>Total Honor: Rp {viewDetail.totalGaji.toLocaleString('id-ID')}</h3>
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
  totalBox: { textAlign:'right', background:'#eafaf1', padding:'10px 20px', borderRadius:12, border:'1px solid #27ae60' },
  inputDate: { padding:8, borderRadius:8, border:'1px solid #ddd', fontSize:14 },
  btnRefresh: { background:'#2c3e50', color:'white', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight:'bold' },
  cardTable: { background:'white', borderRadius:15, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:15, textAlign:'left', fontSize:14 },
  td: { padding:15, borderBottom:'1px solid #eee', fontSize:14 },
  btnDetail: { background:'#3498db', color:'white', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer', fontWeight:'bold', marginRight:5 },
  btnDownload: { background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:8, cursor:'pointer', fontWeight:'bold' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 },
  modal: { background:'white', padding:25, borderRadius:20, width:'950px', maxWidth:'95%' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:20, borderBottom:'1px solid #eee', paddingBottom:15 },
  btnClose: { background:'none', border:'none', fontSize:28, cursor:'pointer', color:'#999' },
  thSmall: { padding:12, fontSize:12, textAlign:'left', color:'#7f8c8d', background:'#f8f9fa' },
  tdSmall: { padding:12, fontSize:13 },
  inputNominal: { width:'110px', padding:6, borderRadius:6, border:'2px solid', fontWeight:'bold', textAlign:'right', fontSize:13 },
  badgeSuccess: { color:'#27ae60', fontWeight:'bold', fontSize:11, background:'#eafaf1', padding:'5px 12px', borderRadius:20, border:'1px solid #2ecc71', textAlign:'center' },
  btnApprove: { background:'#2ecc71', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnBonus: { background:'#f39c12', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:'bold' },
  btnDelete: { background:'#e74c3c', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:11 },
  miniInput: { padding:8, borderRadius:6, border:'1px solid #ddd', fontSize:12, width:'160px' },
  btnSaveBonus: { background:'#2c3e50', color:'white', border:'none', padding:'8px 15px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:'bold' },
};

export default TeacherSalaries;