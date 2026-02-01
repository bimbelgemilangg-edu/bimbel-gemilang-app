import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, writeBatch, deleteDoc, getDoc } from "firebase/firestore";

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  
  // FILTER TANGGAL
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 8) + "01"); // Tgl 1 bulan ini
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10)); // Hari ini
  
  const [rekap, setRekap] = useState([]);
  const [viewDetail, setViewDetail] = useState(null); // Jika null = Mode Rekap, Jika ada data = Mode Slip
  const [ownerPin, setOwnerPin] = useState("");

  // 1. AMBIL PIN OWNER
  useEffect(() => {
    const fetchPin = async () => {
        try {
            const docRef = doc(db, "settings", "global_config");
            const snap = await getDoc(docRef);
            if (snap.exists()) setOwnerPin(snap.data().ownerPin || "2003");
        } catch (e) { console.error(e); }
    };
    fetchPin();
  }, []);

  // 2. FETCH DATA & FILTER
  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "teacher_logs"));
      const snap = await getDocs(q);
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter Range Tanggal
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

      // Sortir tanggal
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

  // HAPUS (REJECT) - PAKAI PIN
  const handleDeleteLog = async (logId) => {
    const input = prompt("🔒 SECURITY CHECK\nMasukkan PIN Owner untuk menghapus:");
    if (input !== ownerPin) return alert("⛔ PIN SALAH!");
    
    await deleteDoc(doc(db, "teacher_logs", logId));
    alert("🗑️ Data dihapus.");
    fetchData(); 
    setViewDetail(null); // Tutup modal biar refresh
  };

  // CETAK
  const handlePrint = () => window.print();

  return (
    <div style={{display:'flex'}}>
      <Sidebar />
      <div style={{marginLeft:250, padding:30, width:'100%', fontFamily:'sans-serif'}}>
        
        {/* === LOGIKA CSS DINAMIS (INI KUNCINYA) === */}
        {viewDetail ? (
            // CSS KHUSUS SLIP (Menyembunyikan SEMUA kecuali kertas slip)
            <style>{`
                @media print { 
                    body * { visibility: hidden; }
                    #slip-gaji-area, #slip-gaji-area * { visibility: visible; }
                    #slip-gaji-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
                    .no-print { display: none !important; }
                }
            `}</style>
        ) : (
            // CSS KHUSUS REKAP UTAMA (Hanya sembunyikan sidebar & tombol)
            <style>{`
                @media print {
                    .sidebar, .no-print { display: none !important; }
                    .print-area { width: 100% !important; margin: 0 !important; box-shadow: none !important; }
                    body { background: white !important; }
                }
            `}</style>
        )}

        {/* HEADER & FILTER */}
        <div className="no-print" style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                <h3 style={{marginTop:0}}>⚙️ Filter Periode Gaji</h3>
                {/* Tombol Cetak Rekap Utama */}
                <button onClick={handlePrint} style={{padding:'10px 20px', background:'#2c3e50', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>
                    🖨️ Cetak Rekap Tabel
                </button>
            </div>
            <div style={{display:'flex', gap:20}}>
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

        {/* TABEL DATA UTAMA */}
        <div className="print-area" style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
             <h3 style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:10}}>
                 LAPORAN REKAP GAJI GURU ({startDate} s/d {endDate})
             </h3>
             <table style={{width:'100%', borderCollapse:'collapse', marginTop:20}}>
                <thead>
                    <tr style={{background:'#eee', textAlign:'left'}}>
                        <th style={{padding:10}}>Nama Guru</th>
                        <th style={{padding:10, textAlign:'center'}}>Sesi</th>
                        <th style={{padding:10, textAlign:'center'}}>Jam</th>
                        <th style={{padding:10, textAlign:'right'}}>Total (Rp)</th>
                        <th style={{padding:10, textAlign:'center'}}>Status</th>
                        <th className="no-print" style={{padding:10, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {rekap.length === 0 ? <tr><td colSpan="6" style={{padding:20, textAlign:'center'}}>Tidak ada data.</td></tr> :
                    rekap.map(g => (
                        <tr key={g.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:10, fontWeight:'bold'}}>{g.nama}</td>
                            <td style={{padding:10, textAlign:'center'}}>{g.totalSesi}</td>
                            <td style={{padding:10, textAlign:'center'}}>{g.totalJam.toFixed(1)}</td>
                            <td style={{padding:10, textAlign:'right', fontWeight:'bold'}}>{g.gajiMengajar.toLocaleString('id-ID')}</td>
                            <td style={{padding:10, textAlign:'center'}}>
                                {g.statusPending > 0 ? <span style={{color:'orange'}}>⚠️ Pending</span> : <span style={{color:'green'}}>✅ Valid</span>}
                            </td>
                            <td className="no-print" style={{padding:10, textAlign:'center'}}>
                                <button onClick={() => setViewDetail(g)} style={{marginRight:5, background:'#3498db', color:'white', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer'}}>
                                    📄 Slip / Edit
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

        {/* MODAL SLIP GAJI (HANYA MUNCUL JIKA viewDetail ADA) */}
        {viewDetail && (
            <div className="no-print-overlay" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', width:'700px', maxHeight:'90vh', overflowY:'auto', borderRadius:10, padding:30, position:'relative'}}>
                    
                    {/* TOMBOL KONTROL */}
                    <div className="no-print" style={{textAlign:'right', marginBottom:20, borderBottom:'1px solid #ddd', paddingBottom:10}}>
                         <button onClick={handlePrint} style={{marginRight:10, padding:'8px 15px', background:'#2c3e50', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>🖨️ CETAK SLIP INI</button>
                         <button onClick={()=>setViewDetail(null)} style={{padding:'8px 15px', background:'#c0392b', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>TUTUP X</button>
                    </div>

                    {/* AREA KERTAS SLIP (ID ini penting untuk CSS Print) */}
                    <div id="slip-gaji-area" style={{padding:20, border:'1px solid #ddd'}}>
                        <div style={{textAlign:'center', borderBottom:'2px solid #333', paddingBottom:20, marginBottom:20}}>
                            <h2 style={{margin:0}}>BIMBEL GEMILANG</h2>
                            <p style={{margin:0, fontSize:14}}>SLIP PEMBAYARAN HONOR</p>
                        </div>
                        
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:20, fontSize:14}}>
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
                                    <th style={{textAlign:'left', padding:8}}>Tanggal</th>
                                    <th style={{textAlign:'left', padding:8}}>Aktivitas</th>
                                    <th style={{textAlign:'right', padding:8}}>Nominal (Rp)</th>
                                    <th className="no-print" style={{textAlign:'center', padding:8}}>Hapus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {viewDetail.rincian.map(item => (
                                    <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                                        <td style={{padding:8}}>{new Date(item.tanggal).toLocaleDateString('id-ID')}</td>
                                        <td style={{padding:8}}>{item.detail}</td>
                                        <td style={{padding:8, textAlign:'right'}}>{item.nominal.toLocaleString('id-ID')}</td>
                                        <td className="no-print" style={{textAlign:'center', padding:8}}>
                                            <button onClick={()=>handleDeleteLog(item.id)} style={{background:'red', color:'white', border:'none', borderRadius:3, fontSize:10, padding:'3px 6px', cursor:'pointer'}}>Hapus</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{textAlign:'right', marginTop:20, borderTop:'2px solid #333', paddingTop:10}}>
                            <h3 style={{margin:0}}>TOTAL DITERIMA: Rp {viewDetail.gajiMengajar.toLocaleString('id-ID')}</h3>
                        </div>

                        <div style={{marginTop:50, textAlign:'center', display:'flex', justifyContent:'space-between', fontSize:13}}>
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