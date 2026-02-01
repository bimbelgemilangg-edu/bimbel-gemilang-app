import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, query, getDocs, doc, writeBatch, deleteDoc } from "firebase/firestore";

// --- KONFIGURASI KODE OWNER ---
const OWNER_CODE = "GEMILANG2026"; // Ganti kode rahasia ini sesuai keinginan Bos

const TeacherSalaries = () => {
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [rekap, setRekap] = useState([]);
  
  // STATE UNTUK MODAL DETAIL & EDIT
  const [viewDetail, setViewDetail] = useState(null); // Data guru yang sedang dilihat detailnya

  // 1. HITUNG GAJI & GROUPING
  const fetchData = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "teacher_logs"));
      const snap = await getDocs(q);
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter Bulan
      const filtered = allLogs.filter(log => log.tanggal.startsWith(selectedMonth));

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
                rincian: [] // Menyimpan daftar log individu
            };
        }
        guruMap[log.teacherId].totalSesi += 1;
        guruMap[log.teacherId].totalJam += (log.durasiJam || 0);
        guruMap[log.teacherId].gajiMengajar += (log.nominal || 0);
        if (log.status === 'Menunggu Validasi') guruMap[log.teacherId].statusPending += 1;
        
        guruMap[log.teacherId].rincian.push(log);
      });

      // Sortir rincian per tanggal (biar rapi)
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

  useEffect(() => { fetchData(); }, [selectedMonth]);

  // 2. FUNGSI VALIDASI (APPROVAL)
  const handleValidasi = async (guruData) => {
    if(!window.confirm(`Validasi semua laporan ${guruData.nama}? Status di HP guru akan berubah jadi 'Valid'.`)) return;
    
    const batch = writeBatch(db);
    guruData.rincian.forEach(log => {
        if(log.status === 'Menunggu Validasi') {
            const ref = doc(db, "teacher_logs", log.id);
            batch.update(ref, { status: "Valid / Sudah Direkap" });
        }
    });

    await batch.commit();
    fetchData(); 
    if (viewDetail) setViewDetail(null); // Tutup modal jika sedang buka
    alert("✅ Data berhasil divalidasi!");
  };

  // 3. FUNGSI HAPUS (PROTEKSI OWNER)
  const handleDeleteLog = async (logId) => {
    // Minta Kode Owner
    const input = prompt("🔒 FITUR BERBAHAYA!\nMasukkan Kode Owner untuk menghapus data ini:");
    
    if (input !== OWNER_CODE) {
        alert("⛔ Kode Salah! Akses ditolak.");
        return;
    }

    if(!window.confirm("Yakin hapus data ini? Data yang dihapus tidak bisa dikembalikan.")) return;

    try {
        await deleteDoc(doc(db, "teacher_logs", logId));
        alert("🗑️ Data berhasil dihapus.");
        fetchData(); // Refresh data
        setViewDetail(null); // Tutup modal biar data refresh
    } catch (error) {
        alert("Gagal hapus: " + error.message);
    }
  };

  // Print Halaman
  const handlePrint = () => window.print();

  return (
    <div style={{display:'flex'}}>
      <Sidebar />
      <div style={{marginLeft:250, padding:30, width:'100%', fontFamily:'sans-serif'}}>
        
        {/* CSS KHUSUS PRINT (Supaya Rapi & Bersih) */}
        <style>{`
            @media print { 
                .no-print { display: none !important; } 
                .sidebar { display: none !important; } 
                .print-area { margin: 0 !important; width: 100% !important; border:none !important; box-shadow:none !important; }
                body { background: white !important; font-size: 12px; }
                /* Sembunyikan tombol aksi saat print */
                .action-col { display: none !important; }
            }
        `}</style>

        {/* HEADER (Hilang saat Print) */}
        <div className="no-print" style={{marginBottom:20, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div>
                <h2 style={{margin:0}}>💰 Rekap Gaji Guru</h2>
                <p style={{margin:0, color:'#666'}}>Periode: {selectedMonth}</p>
            </div>
            <div style={{display:'flex', gap:10}}>
                <input type="month" value={selectedMonth} onChange={e=>setSelectedMonth(e.target.value)} style={{padding:10}} />
                <button onClick={handlePrint} style={{padding:'10px 20px', background:'#2c3e50', color:'white', border:'none', cursor:'pointer'}}>🖨️ Cetak PDF</button>
            </div>
        </div>

        {/* TABEL UTAMA (REKAP) */}
        <div className="print-area" style={{background:'white', padding:20, boxShadow:'0 2px 5px rgba(0,0,0,0.1)'}}>
            <h3 style={{marginTop:0, borderBottom:'2px solid #333', paddingBottom:10, textAlign:'center'}}>
                LAPORAN GAJI PENGAJAR - {new Date(selectedMonth).toLocaleDateString('id-ID', {month:'long', year:'numeric'}).toUpperCase()}
            </h3>

            <table style={{width:'100%', borderCollapse:'collapse', marginTop:20}}>
                <thead>
                    <tr style={{background:'#f0f0f0', borderBottom:'2px solid #000'}}>
                        <th style={{padding:10, textAlign:'left'}}>NAMA PENGAJAR</th>
                        <th style={{padding:10, textAlign:'center'}}>JML SESI</th>
                        <th style={{padding:10, textAlign:'center'}}>TOTAL JAM</th>
                        <th style={{padding:10, textAlign:'right'}}>TOTAL HONOR (RP)</th>
                        <th className="no-print" style={{padding:10, textAlign:'center'}}>STATUS</th>
                        <th className="no-print" style={{padding:10, textAlign:'center'}}>AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    {rekap.length === 0 ? (
                        <tr><td colSpan="6" style={{textAlign:'center', padding:20}}>Belum ada data bulan ini.</td></tr> 
                    ) : (
                        rekap.map(g => (
                            <tr key={g.id} style={{borderBottom:'1px solid #ddd'}}>
                                <td style={{padding:'12px 10px', fontWeight:'bold'}}>{g.nama}</td>
                                <td style={{padding:'12px 10px', textAlign:'center'}}>{g.totalSesi}</td>
                                <td style={{padding:'12px 10px', textAlign:'center'}}>{g.totalJam.toFixed(1)}</td>
                                <td style={{padding:'12px 10px', textAlign:'right', fontWeight:'bold'}}>
                                    {g.gajiMengajar.toLocaleString('id-ID')}
                                </td>
                                <td className="no-print" style={{padding:'12px 10px', textAlign:'center'}}>
                                    {g.statusPending > 0 ? 
                                        <span style={{background:'#fff3cd', color:'#856404', padding:'4px 8px', borderRadius:5, fontSize:11, fontWeight:'bold'}}>⚠️ {g.statusPending} Pending</span> : 
                                        <span style={{background:'#d4edda', color:'#155724', padding:'4px 8px', borderRadius:5, fontSize:11, fontWeight:'bold'}}>✅ Valid</span>
                                    }
                                </td>
                                <td className="no-print" style={{padding:'12px 10px', textAlign:'center'}}>
                                    <button 
                                        onClick={() => setViewDetail(g)}
                                        style={{marginRight:5, background:'#3498db', color:'white', border:'none', padding:'5px 10px', borderRadius:4, cursor:'pointer'}}
                                    >
                                        🔍 Detail / Edit
                                    </button>
                                    
                                    <button 
                                        onClick={()=>handleValidasi(g)}
                                        disabled={g.statusPending === 0}
                                        style={{
                                            cursor: g.statusPending > 0 ? 'pointer' : 'default',
                                            background: g.statusPending > 0 ? '#27ae60' : '#ccc',
                                            color:'white', border:'none', padding:'5px 10px', borderRadius:4
                                        }}
                                    >
                                        ✓ Validasi
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                <tfoot>
                    <tr style={{background:'#f8f9fa', fontWeight:'bold', borderTop:'2px solid #000'}}>
                        <td style={{padding:15}}>TOTAL KESELURUHAN</td>
                        <td style={{padding:15, textAlign:'center'}}>{rekap.reduce((a,b)=>a+b.totalSesi, 0)}</td>
                        <td style={{padding:15, textAlign:'center'}}>{rekap.reduce((a,b)=>a+b.totalJam, 0).toFixed(1)}</td>
                        <td style={{padding:15, textAlign:'right'}}>Rp {rekap.reduce((a,b)=>a+b.gajiMengajar, 0).toLocaleString('id-ID')}</td>
                        <td className="no-print" colSpan="2"></td>
                    </tr>
                </tfoot>
            </table>
            
            <div className="print-area" style={{marginTop:50, display:'flex', justifyContent:'flex-end'}}>
                <div style={{textAlign:'center', width:200}}>
                    <p style={{marginBottom:60}}>Mengetahui,</p>
                    <p style={{borderTop:'1px solid #000', paddingTop:5, fontWeight:'bold'}}>Admin Keuangan</p>
                </div>
            </div>
        </div>

        {/* MODAL DETAIL (POPUP UNTUK EDIT/HAPUS) */}
        {viewDetail && (
            <div className="no-print" style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', padding:20, borderRadius:10, width:'600px', maxHeight:'80vh', overflowY:'auto'}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ddd', paddingBottom:10, marginBottom:10}}>
                        <h3 style={{margin:0}}>Rincian: {viewDetail.nama}</h3>
                        <button onClick={()=>setViewDetail(null)} style={{background:'red', color:'white', border:'none', padding:'5px 10px', cursor:'pointer', borderRadius:5}}>Tutup X</button>
                    </div>

                    <p style={{fontSize:12, color:'#666'}}>*Klik tombol hapus jika ada kesalahan input. Membutuhkan Kode Owner.</p>

                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                        <thead>
                            <tr style={{background:'#eee', textAlign:'left'}}>
                                <th style={{padding:8}}>Tanggal</th>
                                <th style={{padding:8}}>Kegiatan</th>
                                <th style={{padding:8}}>Durasi</th>
                                <th style={{padding:8, textAlign:'right'}}>Nominal</th>
                                <th style={{padding:8, textAlign:'center'}}>Hapus</th>
                            </tr>
                        </thead>
                        <tbody>
                            {viewDetail.rincian.map(item => (
                                <tr key={item.id} style={{borderBottom:'1px solid #eee'}}>
                                    <td style={{padding:8}}>{new Date(item.tanggal).toLocaleDateString('id-ID')} <br/> <small>{item.waktu}</small></td>
                                    <td style={{padding:8}}>
                                        <b>{item.program}</b> <br/>
                                        {item.detail}
                                    </td>
                                    <td style={{padding:8}}>{item.durasiJam} jam</td>
                                    <td style={{padding:8, textAlign:'right'}}>Rp {item.nominal.toLocaleString('id-ID')}</td>
                                    <td style={{padding:8, textAlign:'center'}}>
                                        <button 
                                            onClick={() => handleDeleteLog(item.id)}
                                            style={{background:'#c0392b', color:'white', border:'none', padding:'5px 8px', borderRadius:3, cursor:'pointer', fontSize:11}}
                                        >
                                            🗑️ Hapus
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default TeacherSalaries;