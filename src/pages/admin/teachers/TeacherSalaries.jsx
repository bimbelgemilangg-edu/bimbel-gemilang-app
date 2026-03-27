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

  // State untuk Tambah Bonus Manual
  const [showBonusField, setShowBonusField] = useState(false);
  const [bonusData, setBonusData] = useState({ keterangan: '', nominal: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "teacher_logs"));
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

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
        if (log.program !== "BONUS/TAMBAHAN") guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].rincian.push(log);
      });

      setTotalPengeluaran(grandTotal);
      setRekap(Object.values(guruMap));
      
      // Update modal detail jika sedang terbuka agar data terbaru muncul
      if (viewDetail) {
        const updatedDetail = Object.values(guruMap).find(g => g.id === viewDetail.id);
        if (updatedDetail) setViewDetail(updatedDetail);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  // FUNGSI BARU: Tambah Bonus/Insentif Manual oleh Admin
  const handleAddBonus = async () => {
    if (!bonusData.keterangan || !bonusData.nominal) return alert("Isi keterangan dan nominal!");
    try {
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: viewDetail.id,
        namaGuru: viewDetail.nama,
        tanggal: new Date().toISOString().split('T')[0],
        program: "BONUS/TAMBAHAN",
        detail: bonusData.keterangan,
        nominal: parseInt(bonusData.nominal),
        status: "Valid / Approved",
        createdAt: new Date()
      });
      setBonusData({ keterangan: '', nominal: '' });
      setShowBonusField(false);
      fetchData();
      alert("✅ Bonus berhasil ditambahkan!");
    } catch (e) { alert("Gagal tambah bonus"); }
  };

  const handleUpdateNominal = async (logId, newNominal) => {
    try {
      await updateDoc(doc(db, "teacher_logs", logId), { nominal: parseInt(newNominal) });
      fetchData();
    } catch (e) { alert("Gagal update"); }
  };

  const handleDeleteLog = async (logId) => {
    if (window.confirm("Hapus item ini?")) {
      await deleteDoc(doc(db, "teacher_logs", logId));
      fetchData();
    }
  };

  const handleApproveLog = async (logId) => {
    await updateDoc(doc(db, "teacher_logs", logId), { status: "Valid / Approved" });
    fetchData();
  };

  const handlePrint = (guru) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Slip Gaji - ${guru.nama}</title></head>
        <body style="font-family: Arial; padding: 40px;">
          <h2 style="text-align:center">SLIP GAJI GURU - GEMILANG</h2>
          <hr/>
          <p><b>Nama:</b> ${guru.nama}</p>
          <p><b>Periode:</b> ${startDate} s/d ${endDate}</p>
          <table border="1" style="width:100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background: #f2f2f2;">
                <th style="padding: 10px;">Tanggal</th>
                <th style="padding: 10px;">Keterangan / Program</th>
                <th style="padding: 10px;">Nominal</th>
              </tr>
            </thead>
            <tbody>
              ${guru.rincian.map(r => `
                <tr>
                  <td style="padding: 10px;">${r.tanggal}</td>
                  <td style="padding: 10px;">${r.program} - ${r.detail}</td>
                  <td style="padding: 10px; text-align: right;">Rp ${parseInt(r.nominal).toLocaleString()}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: bold; background: #eee;">
                <td colspan="2" style="padding: 10px; text-align: right;">TOTAL DITERIMA</td>
                <td style="padding: 10px; text-align: right;">Rp ${guru.totalGaji.toLocaleString()}</td>
              </tr>
            </tbody>
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
            <h2 style={{margin:0}}>💰 Penggajian & Approval</h2>
            <div style={{display:'flex', gap:10, marginTop:10}}>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={styles.inputDate} />
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={styles.inputDate} />
            </div>
          </div>
          <div style={styles.totalBox}>
            <small>ESTIMASI TOTAL PENGELUARAN:</small>
            <h2 style={{color:'#27ae60', margin:0}}>Rp {totalPengeluaran.toLocaleString()}</h2>
          </div>
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
                <tr key={g.id} style={styles.tr}>
                  <td style={styles.td}><b>{g.nama}</b></td>
                  <td style={styles.td}>{g.totalSesi} Sesi Mengajar</td>
                  <td style={styles.td}><b>Rp {g.totalGaji.toLocaleString()}</b></td>
                  <td style={styles.td}>
                    <button onClick={() => setViewDetail(g)} style={styles.btnDetail}>Rincian & Tindakan</button>
                    <button onClick={() => handlePrint(g)} style={styles.btnPrint}>🖨️ Slip</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL RINCIAN + FITUR BONUS */}
        {viewDetail && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>Kelola Gaji: {viewDetail.nama}</h3>
                <button onClick={()=>setViewDetail(null)} style={styles.btnClose}>&times;</button>
              </div>

              {/* Tombol Tambah Bonus */}
              <button 
                onClick={() => setShowBonusField(!showBonusField)} 
                style={styles.btnAddBonus}
              >
                {showBonusField ? "❌ Batalkan" : "➕ Tambah Bonus / Potongan Manual"}
              </button>

              {showBonusField && (
                <div style={styles.bonusForm}>
                    <input 
                      placeholder="Keterangan (Contoh: Bonus Transport)" 
                      value={bonusData.keterangan} 
                      onChange={e=>setBonusData({...bonusData, keterangan: e.target.value})} 
                      style={styles.inputBonus}
                    />
                    <input 
                      type="number" 
                      placeholder="Nominal (Contoh: 50000)" 
                      value={bonusData.nominal} 
                      onChange={e=>setBonusData({...bonusData, nominal: e.target.value})} 
                      style={styles.inputBonus}
                    />
                    <button onClick={handleAddBonus} style={styles.btnSaveBonus}>Simpan</button>
                </div>
              )}
              
              <div style={{maxHeight:'350px', overflowY:'auto', marginTop:15}}>
                <table style={{width:'100%', borderCollapse:'collapse'}}>
                  <thead style={{background:'#f8f9fa', position:'sticky', top:0}}>
                    <tr>
                      <th style={styles.thSmall}>Tanggal</th>
                      <th style={styles.thSmall}>Keterangan</th>
                      <th style={styles.thSmall}>Nominal (Rp)</th>
                      <th style={styles.thSmall}>Opsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewDetail.rincian.sort((a,b) => b.tanggal.localeCompare(a.tanggal)).map((log) => (
                      <tr key={log.id} style={{borderBottom:'1px solid #eee'}}>
                        <td style={styles.tdSmall}>{log.tanggal}</td>
                        <td style={styles.tdSmall}>
                            <small style={{color:'#7f8c8d'}}>{log.program}</small><br/>
                            {log.detail}
                        </td>
                        <td style={styles.tdSmall}>
                          <input 
                            type="number" 
                            defaultValue={log.nominal} 
                            onBlur={(e) => handleUpdateNominal(log.id, e.target.value)}
                            style={styles.inputNominal}
                          />
                        </td>
                        <td style={styles.tdSmall}>
                          <div style={{display:'flex', gap:5}}>
                            {log.status !== "Valid / Approved" && (
                                <button onClick={()=>handleApproveLog(log.id)} style={styles.btnMiniApprove}>Approve</button>
                            )}
                            <button onClick={()=>handleDeleteLog(log.id)} style={styles.btnMiniDelete}>Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{marginTop:20, textAlign:'right', fontSize:18, fontWeight:'bold'}}>
                Total: Rp {viewDetail.totalGaji.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  headerCard: { background:'white', padding:25, borderRadius:15, display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, boxShadow:'0 4px 6px rgba(0,0,0,0.05)' },
  totalBox: { textAlign:'right', background:'#e8f8f5', padding:'10px 20px', borderRadius:12, border:'1px solid #27ae60' },
  inputDate: { padding:10, borderRadius:8, border:'1px solid #ddd' },
  cardTable: { background:'white', borderRadius:15, overflow:'hidden', boxShadow:'0 4px 6px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse' },
  th: { padding:15, textAlign:'left' },
  td: { padding:15, borderBottom:'1px solid #eee' },
  btnDetail: { background:'#3498db', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', marginRight:5, fontWeight:'bold' },
  btnPrint: { background:'#95a5a6', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.7)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000 },
  modal: { background:'white', padding:25, borderRadius:15, width:'850px', maxWidth:'95%' },
  modalHeader: { display:'flex', justifyContent:'space-between', marginBottom:15 },
  btnClose: { background:'none', border:'none', fontSize:24, cursor:'pointer' },
  btnAddBonus: { background:'#f39c12', color:'white', border:'none', padding:'10px 15px', borderRadius:8, cursor:'pointer', fontWeight:'bold', marginBottom:10 },
  bonusForm: { background:'#fef5e7', padding:15, borderRadius:10, display:'flex', gap:10, marginBottom:15, border:'1px dashed #f39c12' },
  inputBonus: { flex:1, padding:8, borderRadius:5, border:'1px solid #ddd' },
  btnSaveBonus: { background:'#27ae60', color:'white', border:'none', padding:'8px 20px', borderRadius:5, cursor:'pointer' },
  thSmall: { padding:10, fontSize:12, color:'#7f8c8d' },
  tdSmall: { padding:10, fontSize:13 },
  inputNominal: { width:'90px', padding:5, borderRadius:5, border:'1px solid #3498db', fontWeight:'bold', textAlign:'right' },
  btnMiniApprove: { background:'#2ecc71', color:'white', border:'none', padding:'5px 10px', borderRadius:4, fontSize:11, cursor:'pointer' },
  btnMiniDelete: { background:'#e74c3c', color:'white', border:'none', padding:'5px 10px', borderRadius:4, fontSize:11, cursor:'pointer' }
};

export default TeacherSalaries;