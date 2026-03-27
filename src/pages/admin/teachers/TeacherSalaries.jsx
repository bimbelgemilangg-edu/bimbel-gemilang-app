import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin'; 
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, writeBatch, deleteDoc, getDoc, updateDoc } from "firebase/firestore";

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  
  // FILTER TANGGAL
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01"); 
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); 
  
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null); 
  const [salaryRules, setSalaryRules] = useState({});

  const [editingLog, setEditingLog] = useState(null);
  const [editForm, setEditForm] = useState({ program: '', detail: '', nominal: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingSnap = await getDoc(doc(db, "settings", "global_config"));
      const rules = settingSnap.exists() ? settingSnap.data().salaryRules : {
          honorSD: 35000, honorSMP: 45000, honorEnglishKids: 40000, honorEnglishJunior: 50000, honorEnglishPro: 60000, honorKelas6: 40000
      };
      setSalaryRules(rules);

      const q = query(collection(db, "teacher_logs"));
      const snap = await getDocs(q);
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // PERBAIKAN: Normalisasi string tanggal untuk perbandingan
      const filtered = allLogs.filter(log => {
          if (!log.tanggal) return false;
          const cleanDate = log.tanggal.split(' ')[0]; // Ambil YYYY-MM-DD saja
          return cleanDate >= startDate && cleanDate <= endDate;
      });

      const guruMap = {};
      filtered.forEach(log => {
        let honor = 0;
        
        if (log.program === 'English' || (log.program || "").toLowerCase().includes('english')) {
            const detailLower = (log.detail || "").toLowerCase();
            const levelLower = (log.level || "").toLowerCase();

            if (detailLower.includes('junior') || levelLower.includes('junior') || levelLower.includes('smp')) {
                honor = parseInt(rules.honorEnglishJunior || 0);
            } else if (detailLower.includes('pro') || levelLower.includes('pro') || levelLower.includes('sma')) {
                honor = parseInt(rules.honorEnglishPro || 0);
            } else {
                honor = parseInt(rules.honorEnglishKids || 0);
            }
        } 
        else {
            if (log.level === 'SMP') {
                honor = parseInt(rules.honorSMP || 0);
            } else {
                const detailLower = (log.detail || "").toLowerCase();
                if(detailLower.includes('kelas 6') || detailLower.includes('kls 6')) {
                    honor = parseInt(rules.honorKelas6 || 0);
                } else {
                    honor = parseInt(rules.honorSD || 0);
                }
            }
        }

        const finalNominal = log.nominal > 0 ? log.nominal : honor;

        if (!guruMap[log.teacherId]) {
            guruMap[log.teacherId] = {
                id: log.teacherId,
                nama: log.namaGuru,
                totalSesi: 0,
                totalJam: 0,
                gajiMengajar: 0,
                statusPending: 0,
                rincian: []
            };
        }
        guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].totalJam += (log.durasiJam || 0);
        guruMap[log.teacherId].gajiMengajar += finalNominal;
        
        if (log.status === 'Menunggu Validasi') guruMap[log.teacherId].statusPending += 1;
        guruMap[log.teacherId].rincian.push({ ...log, nominal: finalNominal });
      });

      Object.values(guruMap).forEach(guru => {
          guru.rincian.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));
      });

      const result = Object.values(guruMap);
      setRekap(result);

      if (viewDetail) {
          const updatedGuru = result.find(g => g.id === viewDetail.id);
          if (updatedGuru) setViewDetail(updatedGuru);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  const handleValidasi = async (guruData) => {
    if(!window.confirm(`Validasi semua laporan ${guruData.nama}?`)) return;
    const batch = writeBatch(db);
    guruData.rincian.forEach(log => {
        if(log.status === 'Menunggu Validasi') {
            const ref = doc(db, "teacher_logs", log.id);
            batch.update(ref, { 
                status: "Valid / Sudah Direkap",
                nominal: log.nominal 
            });
        }
    });
    await batch.commit();
    fetchData(); 
    alert("✅ Data Valid!");
  };

  const handleDeleteLog = async (logId) => {
    if(!window.confirm("Yakin hapus jam mengajar ini?")) return;
    await deleteDoc(doc(db, "teacher_logs", logId));
    fetchData(); 
  };

  const handleEditClick = (item) => {
      setEditingLog(item);
      setEditForm({
          program: item.program,
          detail: item.detail,
          nominal: item.nominal
      });
  };

  const handleSaveEdit = async () => {
      if(!editingLog) return;
      try {
          await updateDoc(doc(db, "teacher_logs", editingLog.id), {
              program: editForm.program,
              detail: editForm.detail,
              nominal: parseInt(editForm.nominal)
          });
          setEditingLog(null); 
          fetchData(); 
      } catch (e) {
          alert("Gagal update");
      }
  };

  const handlePrint = () => window.print();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: 250, padding: 30, width: 'calc(100% - 250px)', boxSizing: 'border-box' }}>
        <style>{`
            @media print { 
                @page { size: A4; margin: 10mm; }
                body { background: white !important; -webkit-print-color-adjust: exact; }
                .no-print, nav, aside { display: none !important; }
                #slip-gaji-area { position: absolute; left: 0; top: 0; width: 100%; visibility: visible !important; border: none !important; padding: 0 !important; }
                .print-area { width: 100% !important; margin: 0 !important; box-shadow: none !important; visibility: visible !important;}
                div { margin-left: 0 !important; }
            }
        `}</style>

        <div className="no-print" style={{background:'white', padding:20, borderRadius:12, marginBottom:20, boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                <h3 style={{marginTop:0, color:'#2c3e50'}}>💰 Rekap Gaji Guru</h3>
                <button onClick={handlePrint} style={{padding:'10px 22px', background:'#2c3e50', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}>🖨️ Cetak Rekap</button>
            </div>
            <div style={{display:'flex', gap:20, alignItems:'center'}}>
                <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:6}} />
                <span style={{fontWeight:'bold', color:'#95a5a6'}}>s/d</span>
                <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{padding:'8px 12px', border:'1px solid #ddd', borderRadius:6}} />
            </div>
        </div>

        <div className="print-area" style={{background:'white', padding:25, borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
             <h3 style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:15, color:'#2c3e50'}}>LAPORAN REKAP GAJI GURU<br/><small style={{fontSize:14, color:'#7f8c8d'}}>{startDate} sampai {endDate}</small></h3>
             <table style={{width:'100%', borderCollapse:'collapse', marginTop:20}}>
                <thead>
                    <tr style={{background:'#f8f9fa', textAlign:'left', borderBottom:'2px solid #eee'}}>
                        <th style={{padding:15}}>Nama Guru</th>
                        <th style={{padding:15, textAlign:'center'}}>Sesi</th>
                        <th style={{padding:15, textAlign:'center'}}>Jam</th>
                        <th style={{padding:15, textAlign:'right'}}>Total Honor</th>
                        <th style={{padding:15, textAlign:'center'}}>Status</th>
                        <th className="no-print" style={{padding:15, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rekap.length === 0 ? <tr><td colSpan="6" style={{padding:30, textAlign:'center', color:'#999'}}>Tidak ada data log mengajar pada periode ini.</td></tr> :
                    rekap.map(g => (
                        <tr key={g.id} style={{borderBottom:'1px solid #f1f1f1'}}>
                            <td style={{padding:15, fontWeight:'bold', color:'#2c3e50'}}>{g.nama}</td>
                            <td style={{padding:15, textAlign:'center'}}>{g.totalSesi}</td>
                            <td style={{padding:15, textAlign:'center'}}>{g.totalJam.toFixed(1)}</td>
                            <td style={{padding:15, textAlign:'right', fontWeight:'bold', color:'#27ae60'}}>Rp {g.gajiMengajar.toLocaleString('id-ID')}</td>
                            <td style={{padding:15, textAlign:'center'}}>
                                {g.statusPending > 0 ? <span style={{color:'#e67e22', fontWeight:'bold'}}>⚠️ Pending</span> : <span style={{color:'#27ae60', fontWeight:'bold'}}>✅ Valid</span>}
                            </td>
                            <td className="no-print" style={{padding:15, textAlign:'center'}}>
                                <button onClick={() => setViewDetail(g)} style={{marginRight:8, background:'#3498db', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:'bold'}}>📄 Slip</button>
                                <button onClick={()=>handleValidasi(g)} disabled={g.statusPending===0} style={{background: g.statusPending>0?'#27ae60':'#ccc', color:'white', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:'bold'}}>✓ Valid</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>

        {/* MODAL SLIP GAJI */}
        {viewDetail && (
            <div className="no-print-overlay" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000, backdropFilter:'blur(4px)'}}>
                <div style={{background:'white', width:'210mm', height:'90vh', overflowY:'auto', padding:'25px', borderRadius:15, position:'relative'}}>
                    <div className="no-print" style={{display:'flex', justifyContent:'flex-end', gap:10, marginBottom:20, borderBottom:'1px solid #eee', paddingBottom:15}}>
                         <button onClick={handlePrint} style={{padding:'10px 20px', background:'#2c3e50', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}>🖨️ CETAK SLIP</button>
                         <button onClick={()=>setViewDetail(null)} style={{padding:'10px 20px', background:'#e74c3c', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}>TUTUP</button>
                    </div>
                    <div id="slip-gaji-area" style={{padding:'20px 40px', border:'1px solid #eee', minHeight:'280mm', background:'white'}}>
                        <div style={{textAlign:'center', borderBottom:'4px double #000', paddingBottom:15, marginBottom:25}}>
                            <h2 style={{margin:0, fontSize:'22pt', fontWeight:'bold'}}>BIMBEL GEMILANG</h2>
                            <p style={{margin:'5px 0 0 0', fontSize:'13pt'}}>SLIP HONOR MENGAJAR GURU</p>
                        </div>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:25, fontSize:'11pt'}}>
                            <div>
                                <table cellPadding="3">
                                    <tbody>
                                        <tr><td><b>Nama Guru</b></td><td>: {viewDetail.nama}</td></tr>
                                        <tr><td><b>Periode</b></td><td>: {startDate} s/d {endDate}</td></tr>
                                    </tbody>
                                </table>
                            </div>
                            <div style={{textAlign:'right'}}>
                                <table cellPadding="3" align="right">
                                    <tbody>
                                        <tr><td><b>Total Sesi</b></td><td>: {viewDetail.totalSesi}</td></tr>
                                        <tr><td><b>Total Jam</b></td><td>: {viewDetail.totalJam.toFixed(1)} Jam</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:'10.5pt', marginBottom:20}}>
                            <thead>
                                <tr style={{borderBottom:'2px solid #000', borderTop:'2px solid #000'}}>
                                    <th style={{textAlign:'left', padding:10}}>Tanggal</th>
                                    <th style={{textAlign:'left', padding:10}}>Program & Detail Mengajar</th>
                                    <th style={{textAlign:'right', padding:10}}>Honor (Rp)</th>
                                    <th className="no-print" style={{textAlign:'center', padding:10, width:60}}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewDetail.rincian.map(item => (
                                    <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:10, verticalAlign:'top', width:'15%'}}>{new Date(item.tanggal).toLocaleDateString('id-ID', {day:'2-digit', month:'short'})}</td>
                                        <td style={{padding:10, verticalAlign:'top'}}><b style={{fontSize:'11pt'}}>{item.program}</b> - {item.level} <br/><span style={{color:'#444', fontStyle:'italic'}}>{item.detail}</span></td>
                                        <td style={{padding:10, textAlign:'right', verticalAlign:'top', fontWeight:'bold'}}>{item.nominal.toLocaleString('id-ID')}</td>
                                        <td className="no-print" style={{textAlign:'center', verticalAlign:'top'}}>
                                            <div style={{display:'flex', gap:4}}>
                                                <button onClick={()=>handleEditClick(item)} style={{background:'#f39c12', color:'white', border:'none', borderRadius:4, padding:'4px 6px', cursor:'pointer'}}>✏️</button>
                                                <button onClick={()=>handleDeleteLog(item.id)} style={{background:'#e74c3c', color:'white', border:'none', borderRadius:4, padding:'4px 6px', cursor:'pointer'}}>X</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr style={{borderTop:'2px solid #000', fontWeight:'bold', background:'#f9f9f9'}}>
                                    <td colSpan="2" style={{padding:15, textAlign:'right', fontSize:'12pt'}}>TOTAL HONOR DITERIMA:</td>
                                    <td style={{padding:15, textAlign:'right', fontSize:'13pt', color:'#27ae60'}}>Rp {viewDetail.gajiMengajar.toLocaleString('id-ID')}</td>
                                    <td className="no-print"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL EDIT DATA */}
        {editingLog && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1100}}>
                <div style={{background:'white', padding:25, borderRadius:15, width:320}}>
                    <h4 style={{marginTop:0, textAlign:'center'}}>Edit Detail Honor</h4>
                    <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Program:</label>
                    <input type="text" value={editForm.program} onChange={e=>setEditForm({...editForm, program: e.target.value})} style={{width:'100%', padding:10, marginBottom:15, border:'1px solid #ddd', borderRadius:8, boxSizing:'border-box'}} />
                    <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Keterangan:</label>
                    <textarea value={editForm.detail} onChange={e=>setEditForm({...editForm, detail: e.target.value})} style={{width:'100%', padding:10, marginBottom:15, border:'1px solid #ddd', borderRadius:8, height:60, boxSizing:'border-box'}} />
                    <label style={{display:'block', fontSize:12, fontWeight:'bold', marginBottom:5}}>Nominal (Rp):</label>
                    <input type="number" value={editForm.nominal} onChange={e=>setEditForm({...editForm, nominal: e.target.value})} style={{width:'100%', padding:10, marginBottom:20, border:'1px solid #ddd', borderRadius:8, boxSizing:'border-box'}} />
                    <div style={{display:'flex', gap:10}}>
                        <button onClick={()=>setEditingLog(null)} style={{flex:1, padding:10, background:'#eee', border:'none', borderRadius:8, cursor:'pointer'}}>Batal</button>
                        <button onClick={handleSaveEdit} style={{flex:1, padding:10, background:'#27ae60', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold'}}>Update</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TeacherSalaries;