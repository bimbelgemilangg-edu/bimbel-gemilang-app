import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// LIBRARY DOWNLOAD
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterMode, setFilterMode] = useState("bulan");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [ownerPin, setOwnerPin] = useState("");
  
  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  useEffect(() => {
    getDoc(doc(db, "settings", "global_config")).then(snap => {
        if(snap.exists()) setOwnerPin(snap.data().ownerPin || "2003");
    });
    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const filteredData = filterMode === 'bulan' ? transactions.filter(t => t.date.startsWith(filterDate)) : transactions;

  const totalMasuk = filteredData.filter(t => t.type === 'Pemasukan').reduce((a, b) => a + parseInt(b.amount), 0);
  const totalKeluar = filteredData.filter(t => t.type === 'Pengeluaran').reduce((a, b) => a + parseInt(b.amount), 0);
  const arusKasBersih = totalMasuk - totalKeluar;

  // --- PERBAIKAN LOGIKA PDF ---
  const downloadPDF = () => {
    try {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text("BIMBEL GEMILANG", 105, 15, null, null, "center");
        doc.setFontSize(10);
        doc.text(`Laporan Periode: ${filterMode === 'bulan' ? filterDate : "SEMUA DATA"}`, 105, 25, null, null, "center");
        
        // Summary
        doc.setFontSize(11);
        doc.text(`Pemasukan: Rp ${totalMasuk.toLocaleString('id-ID')}`, 14, 40);
        doc.text(`Pengeluaran: Rp ${totalKeluar.toLocaleString('id-ID')}`, 14, 46);
        doc.text(`Net Cash: Rp ${arusKasBersih.toLocaleString('id-ID')}`, 14, 52);

        // Table
        const tableColumn = ["Tanggal", "Tipe", "Ket", "Metode", "Masuk", "Keluar"];
        const tableRows = [];

        filteredData.forEach(t => {
            tableRows.push([
                t.date,
                t.type,
                t.category + " - " + t.note.substring(0, 20),
                t.method,
                t.type === 'Pemasukan' ? parseInt(t.amount).toLocaleString('id-ID') : "-",
                t.type === 'Pengeluaran' ? parseInt(t.amount).toLocaleString('id-ID') : "-"
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 60,
        });

        doc.save(`Laporan_Keuangan_${filterDate}.pdf`);
    } catch (error) {
        console.error(error);
        alert("Gagal Download PDF! Pastikan server sudah direstart (npm run dev) setelah install library.");
    }
  };

  const downloadExcel = () => {
    try {
        const dataExcel = filteredData.map(t => ({
            "Tanggal": t.date,
            "Tipe": t.type,
            "Kategori": t.category,
            "Ket": t.note,
            "Metode": t.method,
            "Masuk": t.type === 'Pemasukan' ? parseInt(t.amount) : 0,
            "Keluar": t.type === 'Pengeluaran' ? parseInt(t.amount) : 0,
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataExcel);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan");
        XLSX.writeFile(workbook, `Laporan_${filterDate}.xlsx`);
    } catch (error) {
        alert("Gagal Download Excel: " + error.message);
    }
  };

  // FUNGSI EDIT & DELETE (TETAP SAMA)
  const handleDelete = async (id) => {
    if (prompt("🔒 PIN Owner:") !== ownerPin) return alert("⛔ PIN SALAH!");
    if(window.confirm("Hapus data?")) await deleteDoc(doc(db, "finance_logs", id));
  };

  const handleEditClick = (item) => {
    if (prompt("🔒 PIN Owner:") !== ownerPin) return alert("⛔ PIN SALAH!");
    setEditData(item);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "finance_logs", editData.id), {
        date: editData.date,
        amount: parseInt(editData.amount),
        method: editData.method,
        category: editData.category,
        note: editData.note
    });
    setIsEditing(false);
    alert("Data diupdate!");
  };

  return (
    <div>
        <div style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20}}>
                <div style={{display:'flex', gap:10}}>
                    <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ddd'}}>
                        <option value="bulan">📅 Filter Per Bulan</option>
                        <option value="semua">📂 Semua Data</option>
                    </select>
                    {filterMode === 'bulan' && <input type="month" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{padding:8, borderRadius:5, border:'1px solid #ddd'}} />}
                </div>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={downloadPDF} style={{background:'#e74c3c', color:'white', border:'none', padding:'10px 15px', borderRadius:5, cursor:'pointer'}}>📄 PDF</button>
                    <button onClick={downloadExcel} style={{background:'#27ae60', color:'white', border:'none', padding:'10px 15px', borderRadius:5, cursor:'pointer'}}>📊 Excel</button>
                </div>
            </div>

            {/* RINGKASAN ARUS KAS */}
            <div style={{display:'flex', gap:20, marginTop:20, borderTop:'1px solid #eee', paddingTop:20}}>
                <div style={{flex:1, background:'#f0fff4', padding:15, borderRadius:8, borderLeft:'5px solid #27ae60'}}>
                    <small>TOTAL MASUK</small><h3 style={{margin:0, color:'#27ae60'}}>+ {totalMasuk.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#fff5f5', padding:15, borderRadius:8, borderLeft:'5px solid #c0392b'}}>
                    <small>TOTAL KELUAR</small><h3 style={{margin:0, color:'#c0392b'}}>- {totalKeluar.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#e8f4fc', padding:15, borderRadius:8, borderLeft:'5px solid #2980b9'}}>
                    <small>NET CASH</small><h3 style={{margin:0, color:'#2980b9'}}>{arusKasBersih.toLocaleString()}</h3>
                </div>
            </div>
        </div>

        {/* TABEL DATA */}
        <div style={{background:'white', padding:20, borderRadius:10}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead>
                    <tr style={{background:'#2c3e50', color:'white', textAlign:'left'}}>
                        <th style={{padding:10}}>Tanggal</th>
                        <th style={{padding:10}}>Tipe</th>
                        <th style={{padding:10}}>Ket</th>
                        <th style={{padding:10}}>Metode</th>
                        <th style={{padding:10, textAlign:'right'}}>Nominal</th>
                        <th style={{padding:10, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map(t => (
                        <tr key={t.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:10}}>{t.date}</td>
                            <td style={{padding:10}}>{t.type}</td>
                            <td style={{padding:10}}>{t.category}<br/><small style={{color:'#666'}}>{t.note}</small></td>
                            <td style={{padding:10}}>{t.method}</td>
                            <td style={{padding:10, textAlign:'right', color: t.type === 'Pemasukan' ? 'green' : 'red', fontWeight:'bold'}}>
                                {t.type === 'Pemasukan' ? '+' : '-'} {parseInt(t.amount).toLocaleString()}
                            </td>
                            <td style={{padding:10, textAlign:'center'}}>
                                <button onClick={()=>handleEditClick(t)} style={{marginRight:5}}>✏️</button>
                                <button onClick={()=>handleDelete(t.id)}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL EDIT */}
        {isEditing && editData && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center'}}>
                <div style={{background:'white', padding:20, borderRadius:10, width:300}}>
                    <h3>Edit Data</h3>
                    <form onSubmit={handleSaveEdit}>
                        <input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} style={{width:'100%', marginBottom:10}} />
                        <input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:e.target.value})} style={{width:'100%', marginBottom:10}} />
                        <button type="submit">Simpan</button> <button type="button" onClick={()=>setIsEditing(false)}>Batal</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default TransactionHistory;