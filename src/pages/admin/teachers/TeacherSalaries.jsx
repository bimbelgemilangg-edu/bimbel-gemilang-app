import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, writeBatch, deleteDoc } from "firebase/firestore";

const OWNER_CODE = "GEMILANG2026"; // Kode hapus data

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  
  // FILTER TANGGAL FLEKSIBEL (Bukan cuma bulan)
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01"); // Tgl 1 bulan ini
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // Hari ini
  
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null); // Data guru yang sedang dilihat

  // 1. FETCH DATA & FILTER RANGE
  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "teacher_logs"));
      const snap = await getDocs(q);
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter berdasarkan Range Tanggal
      const filtered = allLogs.filter(log => {
          return log.tanggal >= startDate && log.tanggal <= endDate;
      });

      // Grouping per Guru
      const guruMap = {};
      filtered.forEach(log => {
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
        guruMap[log.teacherId].gajiMengajar += (log.nominal || 0);
        if (log.status === 'Menunggu Validasi') guruMap[log.teacherId].statusPending += 1;
        guruMap[log.teacherId].rincian.push(log);
      });

      // Sortir rincian per tanggal
      Object.values(guruMap).forEach(guru => {
          guru.rincian.sort((a,b) => new Date(a.tanggal) - new Date(b.tanggal));
      });

      setRekap(Object.values(guruMap));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [startDate, endDate]);

  // VALIDASI
  const handleValidasi = async (guruData) => {
    if(!window.confirm(`Validasi semua laporan ${guruData.nama}?`)) return;
    const batch = writeBatch(db);
    guruData.rincian.forEach(log => {
        if(log.status === 'Menunggu Validasi') {
            const ref = doc(db, "teacher_logs", log.id);
            batch.update(ref, { status: "Valid / Sudah Direkap" });
        }
    });
    await batch.commit();
    fetchData(); 
    alert("✅ Data Valid!");
  };

  // HAPUS (REJECT)
  const handleDeleteLog = async (logId) => {
    const input = prompt("Masukkan Kode Owner untuk menghapus (REJECT):");
    if (input !== OWNER_CODE) return alert("⛔ Kode Salah!");
    
    await deleteDoc(doc(db, "teacher_logs", logId));
    alert("🗑️ Data dihapus. Guru harus input ulang melalui menu 'Absen Susulan'.");
    fetchData(); 
    setViewDetail(null); 
  };

  // CETAK SLIP (HANYA BAGIAN SLIP)
  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div style={{display:'flex'}}>
      <Sidebar />
      <div style={{marginLeft:250, padding:30, width:'100%', fontFamily:'sans-serif'}}>
        
        {/* CSS KHUSUS PRINT: Hanya Menampilkan Slip Gaji */}
        <style>{`
            @media print { 
                body * { visibility: hidden; }
                #slip-gaji-area, #slip-gaji-area * { visibility: visible; }
                #slip-gaji-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
                .no-print { display: none !important; } 
            }
        `}</style>

        {/* CONTROL PANEL */}
        <div className="no-print" style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
            <h3 style={{marginTop:0}}>⚙️ Filter Periode Gaji</h3>
            <div style={{display:'flex', gap:20, alignItems:'center'}}>
                <div>
                    <label style={{display:'block', fontSize:12, fontWeight:'bold'}}>Dari Tanggal:</label>
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} style={{padding:8, border:'1px solid #ddd'}} />
                </div>
                <div>
                    <label style={{display:'block', fontSize:12, fontWeight:'bold'}}>Sampai Tanggal:</label>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} style={{padding:8, border:'1px solid #ddd'}} />
                </div>
            </div>
        </div>

        {/* TABEL DATA */}
        <div className="no-print" style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
             <h3>📊 Rekap Gaji ({startDate} s/d {endDate})</h3>
             <table style={{width:'100%', borderCollapse:'collapse'}}>
                <thead>
                    <tr style={{background:'#eee', textAlign:'left'}}>
                        <th style={{padding:10}}>Nama Guru</th>
                        <th style={{padding:10, textAlign:'center'}}>Sesi</th>
                        <th style={{padding:10, textAlign:'center'}}>Jam</th>
                        <th style={{padding:10, textAlign:'right'}}>Total (Rp)</th>
                        <th style={{padding:10, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rekap.map(g => (
                        <tr key={g.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:10, fontWeight:'bold'}}>{g.nama}</td>
                            <td style={{padding:10, textAlign:'center'}}>{g.totalSesi}</td>
                            <td style={{padding:10, textAlign:'center'}}>{g.totalJam.toFixed(1)}</td>
                            <td style={{padding:10, textAlign:'right'}}>{g.gajiMengajar.toLocaleString('id-ID')}</td>
                            <td style={{padding:10, textAlign:'center'}}>
                                <button onClick={() => setViewDetail(g)} style={{marginRight:5, background:'#3498db', color:'white', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer'}}>
                                    📄 Buka Slip & Detail
                                </button>
                                <button onClick={()=>handleValidasi(g)} disabled={g.statusPending===0} style={{background: g.statusPending>0?'#27ae60':'#ccc', color:'white', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer'}}>
                                    ✓ Validasi
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
             </table>
        </div>

        {/* MODAL SLIP GAJI (INI YANG AKAN DI-PRINT) */}
        {viewDetail && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', width:'700px', maxHeight:'90vh', overflowY:'auto', borderRadius:10, padding:30, position:'relative'}}>
                    
                    {/* TOMBOL TUTUP & PRINT */}
                    <div className="no-print" style={{textAlign:'right', marginBottom:20, borderBottom:'1px solid #ddd', paddingBottom:10}}>
                         <button onClick={handlePrintSlip} style={{marginRight:10, padding:'8px 15px', background:'#2c3e50', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>🖨️ CETAK SLIP</button>
                         <button onClick={()=>setViewDetail(null)} style={{padding:'8px 15px', background:'#c0392b', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>TUTUP</button>
                    </div>

                    {/* AREA KERTAS SLIP GAJI */}
                    <div id="slip-gaji-area" style={{padding:20, border:'1px solid #ddd'}}>
                        <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:20, marginBottom:20}}>
                            <h2 style={{margin:0}}>BIMBEL GEMILANG</h2>
                            <p style={{margin:0, fontSize:14}}>SLIP GAJI PENGAJAR</p>
                        </div>
                        
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20}}>
                            <div>
                                <strong>Nama:</strong> {viewDetail.nama} <br/>
                                <strong>Periode:</strong> {startDate} s/d {endDate}
                            </div>
                            <div style={{textAlign:'right'}}>
                                <strong>Total Sesi:</strong> {viewDetail.totalSesi} <br/>
                                <strong>Total Jam:</strong> {viewDetail.totalJam.toFixed(1)}
                            </div>
                        </div>

                        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, marginBottom:20}}>
                            <thead>
                                <tr style={{borderBottom:'1px solid #000'}}>
                                    <th style={{textAlign:'left', padding:5}}>Tanggal</th>
                                    <th style={{textAlign:'left', padding:5}}>Aktivitas</th>
                                    <th style={{textAlign:'right', padding:5}}>Nominal</th>
                                    <th className="no-print" style={{textAlign:'center', padding:5}}>Hapus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewDetail.rincian.map(item => (
                                    <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:5}}>{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                        <td style={{padding:5}}>{item.detail}</td>
                                        <td style={{padding:5, textAlign:'right'}}>{item.nominal.toLocaleString('id-ID')}</td>
                                        <td className="no-print" style={{textAlign:'center', padding:5}}>
                                            <button onClick={()=>handleDeleteLog(item.id)} style={{background:'red', color:'white', border:'none', borderRadius:3, fontSize:10, padding:'2px 5px', cursor:'pointer'}}>Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{textAlign:'right', marginTop:20}}>
                            <h3>TOTAL DITERIMA: Rp {viewDetail.gajiMengajar.toLocaleString('id-ID')}</h3>
                        </div>

                        <div style={{marginTop:40, textAlign:'center', display:'flex', justifyContent:'space-between'}}>
                            <div style={{width:200}}>
                                <p>Penerima,</p>
                                <br/><br/><br/>
                                <p style={{borderTop:'1px solid #333'}}>({viewDetail.nama})</p>
                            </div>
                            <div style={{width:200}}>
                                <p>Admin Keuangan,</p>
                                <br/><br/><br/>
                                <p style={{borderTop:'1px solid #333'}}>(...................)</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default TeacherSalaries;