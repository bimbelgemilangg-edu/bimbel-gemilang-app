import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// --- LIBRARY DOWNLOAD ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';

const TransactionHistory = () => {
  // --- STATE DATA ---
  const [transactions, setTransactions] = useState([]);
  const [filterMode, setFilterMode] = useState("bulan");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [ownerPin, setOwnerPin] = useState("");
  
  // --- STATE EDIT ---
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // 1. LOAD DATA (REALTIME)
  useEffect(() => {
    // Ambil PIN Owner untuk keamanan Hapus/Edit
    getDoc(doc(db, "settings", "global_config")).then(snap => {
        if(snap.exists()) setOwnerPin(snap.data().ownerPin || "2003");
    });
    
    // Ambil data transaksi dari Firestore
    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // 2. FILTER & HITUNG TOTAL
  const filteredData = filterMode === 'bulan' ? transactions.filter(t => t.date.startsWith(filterDate)) : transactions;

  const totalMasuk = filteredData.filter(t => t.type === 'Pemasukan').reduce((a, b) => a + parseInt(b.amount || 0), 0);
  const totalKeluar = filteredData.filter(t => t.type === 'Pengeluaran').reduce((a, b) => a + parseInt(b.amount || 0), 0);
  const arusKasBersih = totalMasuk - totalKeluar;

  // --- FUNGSI DOWNLOAD PDF (FIXED) ---
  const downloadPDF = () => {
    if (filteredData.length === 0) return alert("⚠️ Data Kosong!");
    try {
        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(14);
        doc.text("BIMBEL GEMILANG - LAPORAN KEUANGAN", 14, 15);
        doc.setFontSize(10);
        doc.text(`Periode: ${filterMode==='bulan' ? filterDate : 'SEMUA DATA'}`, 14, 22);
        
        // Ringkasan
        doc.text(`Total Masuk: Rp ${totalMasuk.toLocaleString()}`, 14, 30);
        doc.text(`Total Keluar: Rp ${totalKeluar.toLocaleString()}`, 14, 35);
        doc.text(`Saldo Bersih: Rp ${arusKasBersih.toLocaleString()}`, 14, 40);

        // Data Tabel
        const tableBody = filteredData.map(t => [
            t.date,
            t.type,
            t.category,
            t.method,
            t.type === 'Pemasukan' ? parseInt(t.amount||0).toLocaleString('id-ID') : "-",
            t.type === 'Pengeluaran' ? parseInt(t.amount||0).toLocaleString('id-ID') : "-"
        ]);

        autoTable(doc, {
            head: [["Tanggal", "Tipe", "Kategori", "Metode", "Masuk", "Keluar"]],
            body: tableBody,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] }
        });
        doc.save(`Laporan_${filterDate}.pdf`);
    } catch (error) {
        alert("Gagal PDF: " + error.message);
    }
  };

  // --- FUNGSI DOWNLOAD EXCEL (FIXED & STERIL) ---
  const downloadExcel = () => {
    if (filteredData.length === 0) return alert("⚠️ Data Kosong!");

    try {
        // STERILISASI DATA: Memastikan format JSON rapi agar Excel tidak corrupt
        const cleanData = filteredData.map((t, index) => {
            const nominal = parseInt(t.amount || 0);
            return {
                "No": index + 1,
                "Tanggal": t.date || "-",
                "Jenis": t.type || "-",
                "Kategori": t.category || "-",
                "Keterangan": t.note || "-",
                "Metode": t.method || "-",
                "Pemasukan": t.type === 'Pemasukan' ? nominal : 0,
                "Pengeluaran": t.type === 'Pengeluaran' ? nominal : 0
            };
        });

        const ws = XLSX.utils.json_to_sheet(cleanData);
        
        // Atur Lebar Kolom
        ws['!cols'] = [
            {wch: 5}, {wch: 12}, {wch: 15}, {wch: 20}, {wch: 30}, {wch: 15}, {wch: 15}, {wch: 15}
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Keuangan");
        XLSX.writeFile(wb, `Laporan_Keuangan_${filterDate}.xlsx`);
        
    } catch (error) {
        console.error("Excel Error:", error);
        alert("Gagal Excel: " + error.message);
    }
  };

  // --- FUNGSI HAPUS DATA ---
  const handleDelete = async (id) => {
    if (prompt("🔒 Masukkan PIN Owner untuk menghapus:") !== ownerPin) return alert("⛔ PIN SALAH!");
    if(window.confirm("Yakin hapus data ini? Saldo akan berubah!")) await deleteDoc(doc(db, "finance_logs", id));
  };

  // --- FUNGSI EDIT DATA ---
  const handleEditClick = (item) => {
    if (prompt("🔒 Masukkan PIN Owner untuk mengedit:") !== ownerPin) return alert("⛔ PIN SALAH!");
    setEditData(item);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
        await updateDoc(doc(db, "finance_logs", editData.id), {
            date: editData.date,
            amount: parseInt(editData.amount),
            method: editData.method,
            category: editData.category,
            note: editData.note
        });
        setIsEditing(false);
        alert("✅ Update Berhasil!");
    } catch (err) {
        alert("Gagal update: " + err.message);
    }
  };

  return (
    <div>
        <div style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <h2 style={{marginTop:0, color:'#2c3e50'}}>📊 Mutasi Keuangan</h2>
            
            {/* FILTER & DOWNLOAD */}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20}}>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ddd'}}>
                        <option value="bulan">📅 Filter Per Bulan</option>
                        <option value="semua">📂 Semua Data</option>
                    </select>
                    {filterMode === 'bulan' && <input type="month" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{padding:8, borderRadius:5, border:'1px solid #ddd'}} />}
                </div>
                
                <div style={{display:'flex', gap:10}}>
                    <button onClick={downloadPDF} style={{background:'#e74c3c', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                        📄 PDF
                    </button>
                    <button onClick={downloadExcel} style={{background:'#27ae60', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                        📊 EXCEL
                    </button>
                </div>
            </div>

            {/* RINGKASAN KARTU */}
            <div style={{display:'flex', gap:20, marginTop:20, borderTop:'1px solid #eee', paddingTop:20}}>
                <div style={{flex:1, background:'#f0fff4', padding:15, borderRadius:8, borderLeft:'5px solid #27ae60'}}>
                    <small>TOTAL MASUK</small>
                    <h3 style={{margin:0, color:'#27ae60'}}>+ Rp {totalMasuk.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#fff5f5', padding:15, borderRadius:8, borderLeft:'5px solid #c0392b'}}>
                    <small>TOTAL KELUAR</small>
                    <h3 style={{margin:0, color:'#c0392b'}}>- Rp {totalKeluar.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#e8f4fc', padding:15, borderRadius:8, borderLeft:'5px solid #2980b9'}}>
                    <small>SISA SALDO</small>
                    <h3 style={{margin:0, color:'#2980b9'}}>Rp {arusKasBersih.toLocaleString()}</h3>
                </div>
            </div>
        </div>

        {/* TABEL DATA */}
        <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead>
                    <tr style={{background:'#34495e', color:'white', textAlign:'left'}}>
                        <th style={{padding:12}}>Tanggal</th>
                        <th style={{padding:12}}>Tipe</th>
                        <th style={{padding:12}}>Kategori / Ket</th>
                        <th style={{padding:12, textAlign:'right'}}>Nominal</th>
                        <th style={{padding:12, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((t, idx) => (
                        <tr key={t.id} style={{borderBottom:'1px solid #eee', background: idx%2===0 ? 'white' : '#f9f9f9'}}>
                            <td style={{padding:12}}>{t.date}</td>
                            <td style={{padding:12}}><span style={{background:t.type==='Pemasukan'?'#d4edda':'#f8d7da', padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:'bold', color:t.type==='Pemasukan'?'green':'red'}}>{t.type}</span></td>
                            <td style={{padding:12}}><b>{t.category}</b><br/><small>{t.note}</small></td>
                            <td style={{padding:12, textAlign:'right', fontWeight:'bold', color: t.type==='Pemasukan'?'green':'red'}}>
                                {t.type==='Pemasukan'?'+':'-'} {parseInt(t.amount).toLocaleString()}
                            </td>
                            <td style={{padding:12, textAlign:'center'}}>
                                <button onClick={()=>handleEditClick(t)} style={{marginRight:5, border:'none', background:'transparent', cursor:'pointer'}} title="Edit">✏️</button>
                                <button onClick={()=>handleDelete(t.id)} style={{border:'none', background:'transparent', cursor:'pointer'}} title="Hapus">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredData.length === 0 && <p style={{textAlign:'center', color:'#999', padding:20}}>Data Kosong</p>}
        </div>

        {/* MODAL POPUP EDIT */}
        {isEditing && editData && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', padding:25, borderRadius:10, width:300}}>
                    <h3>Edit Data</h3>
                    <form onSubmit={handleSaveEdit}>
                        <label style={{fontSize:12}}>Tanggal</label>
                        <input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} style={{width:'100%', marginBottom:10, padding:8}} />
                        
                        <label style={{fontSize:12}}>Nominal (Rp)</label>
                        <input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:e.target.value})} style={{width:'100%', marginBottom:10, padding:8}} />
                        
                        <label style={{fontSize:12}}>Kategori</label>
                        <input type="text" value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})} style={{width:'100%', marginBottom:10, padding:8}} />
                        
                        <label style={{fontSize:12}}>Catatan</label>
                        <textarea value={editData.note} onChange={e=>setEditData({...editData, note:e.target.value})} style={{width:'100%', marginBottom:10, padding:8}} />
                        
                        <div style={{display:'flex', gap:10}}>
                            <button type="button" onClick={()=>setIsEditing(false)} style={{flex:1, padding:10}}>Batal</button>
                            <button type="submit" style={{flex:1, padding:10, background:'#2980b9', color:'white', border:'none'}}>Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default TransactionHistory;