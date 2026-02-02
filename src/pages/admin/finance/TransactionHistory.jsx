import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// LIBRARY DOWNLOAD
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 
import * as XLSX from 'xlsx';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filterMode, setFilterMode] = useState("bulan");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7));
  const [ownerPin, setOwnerPin] = useState("");
  
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

  // --- LOGIKA HITUNGAN BARU (DIPISAH TUNAI & BANK) ---
  let saldoTunai = 0;
  let saldoBank = 0;
  let totalMasuk = 0;
  let totalKeluar = 0;

  filteredData.forEach(t => {
      const amt = parseInt(t.amount || 0);
      
      // Hitung Total Umum
      if (t.type === 'Pemasukan') totalMasuk += amt;
      else totalKeluar += amt;

      // Hitung Pisah (Tunai vs Bank)
      if (t.method === 'Tunai') {
          if (t.type === 'Pemasukan') saldoTunai += amt;
          else saldoTunai -= amt;
      } else { // Transfer / Bank
          if (t.type === 'Pemasukan') saldoBank += amt;
          else saldoBank -= amt;
      }
  });

  const totalAset = saldoTunai + saldoBank;

  // --- DOWNLOAD PDF (DENGAN RINCIAN SALDO) ---
  const downloadPDF = () => {
    if (filteredData.length === 0) return alert("⚠️ Data Kosong!");
    try {
        const doc = new jsPDF();
        
        doc.setFontSize(14);
        doc.text("BIMBEL GEMILANG - LAPORAN KEUANGAN", 14, 15);
        doc.setFontSize(10);
        doc.text(`Periode: ${filterMode==='bulan' ? filterDate : 'SEMUA DATA'}`, 14, 22);
        
        // Rincian Saldo di PDF
        doc.text(`Saldo Tunai (Cash): Rp ${saldoTunai.toLocaleString()}`, 14, 30);
        doc.text(`Saldo Bank (Rekening): Rp ${saldoBank.toLocaleString()}`, 14, 35);
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL ASET: Rp ${totalAset.toLocaleString()}`, 14, 42);
        doc.setFont(undefined, 'normal');

        const tableBody = filteredData.map(t => [
            t.date,
            t.type,
            `${t.category} (${t.method})`, // Method digabung ke kategori biar hemat kolom
            t.note || "-",
            t.type === 'Pemasukan' ? parseInt(t.amount).toLocaleString('id-ID') : "-",
            t.type === 'Pengeluaran' ? parseInt(t.amount).toLocaleString('id-ID') : "-"
        ]);

        autoTable(doc, {
            head: [["Tanggal", "Tipe", "Kategori", "Ket", "Masuk", "Keluar"]],
            body: tableBody,
            startY: 50,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] },
            columnStyles: {
                4: { halign: 'right', textColor: [39, 174, 96] },
                5: { halign: 'right', textColor: [192, 57, 43] }
            }
        });
        doc.save(`Laporan_Keuangan_${filterDate}.pdf`);
    } catch (error) {
        alert("Gagal PDF: " + error.message);
    }
  };

  const downloadExcel = () => {
    if (filteredData.length === 0) return alert("⚠️ Data Kosong!");
    try {
        const cleanData = filteredData.map((t, index) => ({
            "No": index + 1,
            "Tanggal": t.date,
            "Tipe": t.type,
            "Metode": t.method, // Kolom Metode Penting
            "Kategori": t.category,
            "Keterangan": t.note,
            "Pemasukan": t.type === 'Pemasukan' ? parseInt(t.amount) : 0,
            "Pengeluaran": t.type === 'Pengeluaran' ? parseInt(t.amount) : 0
        }));

        const ws = XLSX.utils.json_to_sheet(cleanData);
        ws['!cols'] = [{wch:5}, {wch:12}, {wch:15}, {wch:15}, {wch:20}, {wch:30}, {wch:15}, {wch:15}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Keuangan");
        XLSX.writeFile(wb, `Laporan_${filterDate}.xlsx`);
    } catch (error) {
        alert("Gagal Excel: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (prompt("🔒 PIN Owner:") !== ownerPin) return alert("⛔ PIN SALAH!");
    if(window.confirm("Yakin hapus data ini?")) await deleteDoc(doc(db, "finance_logs", id));
  };

  const handleEditClick = (item) => {
    if (prompt("🔒 PIN Owner:") !== ownerPin) return alert("⛔ PIN SALAH!");
    setEditData(item);
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    const nominal = parseInt(editData.amount);

    // --- VALIDASI ANTI MINUS ---
    if(nominal < 0) {
        return alert("⛔ Nominal tidak boleh minus! Masukkan angka positif.");
    }
    if(!nominal || nominal === 0) {
        return alert("⛔ Nominal tidak boleh nol.");
    }

    try {
        await updateDoc(doc(db, "finance_logs", editData.id), {
            date: editData.date,
            amount: nominal,
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
            <h2 style={{marginTop:0, color:'#2c3e50'}}>📊 Laporan Keuangan Terpadu</h2>
            
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20}}>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ddd'}}>
                        <option value="bulan">📅 Filter Per Bulan</option>
                        <option value="semua">📂 Semua Data</option>
                    </select>
                    {filterMode === 'bulan' && <input type="month" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{padding:8, borderRadius:5, border:'1px solid #ddd'}} />}
                </div>
                <div style={{display:'flex', gap:10}}>
                    <button onClick={downloadPDF} style={{background:'#e74c3c', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>📄 PDF</button>
                    <button onClick={downloadExcel} style={{background:'#27ae60', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>📊 EXCEL</button>
                </div>
            </div>

            {/* --- PANEL RINGKASAN BARU (DIPISAH) --- */}
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:15, marginTop:20, borderTop:'1px solid #eee', paddingTop:20}}>
                
                {/* 1. SALDO TUNAI */}
                <div style={{background:'#fff3cd', padding:15, borderRadius:8, borderLeft:'5px solid #ffc107'}}>
                    <small style={{color:'#856404', fontWeight:'bold'}}>💵 SALDO TUNAI (LACI)</small>
                    <h3 style={{margin:'5px 0 0 0', color:'#856404'}}>Rp {saldoTunai.toLocaleString()}</h3>
                </div>

                {/* 2. SALDO BANK */}
                <div style={{background:'#d1ecf1', padding:15, borderRadius:8, borderLeft:'5px solid #17a2b8'}}>
                    <small style={{color:'#0c5460', fontWeight:'bold'}}>💳 SALDO BANK (REKENING)</small>
                    <h3 style={{margin:'5px 0 0 0', color:'#0c5460'}}>Rp {saldoBank.toLocaleString()}</h3>
                </div>

                {/* 3. TOTAL ASET */}
                <div style={{background:'#d4edda', padding:15, borderRadius:8, borderLeft:'5px solid #28a745'}}>
                    <small style={{color:'#155724', fontWeight:'bold'}}>💰 TOTAL SEMUA ASET</small>
                    <h3 style={{margin:'5px 0 0 0', color:'#155724'}}>Rp {totalAset.toLocaleString()}</h3>
                </div>
            </div>
        </div>

        {/* TABEL DATA (DIGABUNG BIAR RAPI) */}
        <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead>
                    <tr style={{background:'#34495e', color:'white', textAlign:'left'}}>
                        <th style={{padding:12}}>Tanggal</th>
                        <th style={{padding:12}}>Metode</th>
                        <th style={{padding:12}}>Ket</th>
                        <th style={{padding:12, textAlign:'right'}}>Masuk (+)</th>
                        <th style={{padding:12, textAlign:'right'}}>Keluar (-)</th>
                        <th style={{padding:12, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.map((t, idx) => (
                        <tr key={t.id} style={{borderBottom:'1px solid #eee', background: idx%2===0 ? 'white' : '#f9f9f9'}}>
                            <td style={{padding:12}}>{t.date}</td>
                            <td style={{padding:12}}>
                                {/* Badge Metode */}
                                <span style={{
                                    background: t.method === 'Tunai' ? '#fff3cd' : '#d1ecf1',
                                    color: t.method === 'Tunai' ? '#856404' : '#0c5460',
                                    padding:'3px 8px', borderRadius:4, fontSize:11, fontWeight:'bold'
                                }}>
                                    {t.method}
                                </span>
                            </td>
                            <td style={{padding:12}}><b>{t.category}</b><br/><small>{t.note}</small></td>
                            
                            {/* KOLOM MASUK */}
                            <td style={{padding:12, textAlign:'right', color:'#27ae60', fontWeight:'bold'}}>
                                {t.type==='Pemasukan' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-'}
                            </td>
                            
                            {/* KOLOM KELUAR */}
                            <td style={{padding:12, textAlign:'right', color:'#c0392b', fontWeight:'bold'}}>
                                {t.type==='Pengeluaran' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-'}
                            </td>

                            <td style={{padding:12, textAlign:'center'}}>
                                <button onClick={()=>handleEditClick(t)} style={{marginRight:5, border:'none', background:'transparent', cursor:'pointer'}}>✏️</button>
                                <button onClick={()=>handleDelete(t.id)} style={{border:'none', background:'transparent', cursor:'pointer'}}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {filteredData.length === 0 && <p style={{textAlign:'center', color:'#999', padding:20}}>Data Kosong</p>}
        </div>

        {/* MODAL EDIT (DENGAN VALIDASI MINUS) */}
        {isEditing && editData && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', padding:25, borderRadius:10, width:300}}>
                    <h3>Edit Data</h3>
                    <form onSubmit={handleSaveEdit}>
                        <label style={{fontSize:12}}>Tanggal</label>
                        <input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} style={{width:'100%', marginBottom:10, padding:8}} />
                        
                        <label style={{fontSize:12}}>Nominal (Rp)</label>
                        <input 
                            type="number" 
                            min="0" // HTML Validation: Mencegah input minus di UI
                            value={editData.amount} 
                            onChange={e=>setEditData({...editData, amount:e.target.value})} 
                            style={{width:'100%', marginBottom:10, padding:8}} 
                        />
                        
                        <label style={{fontSize:12}}>Metode</label>
                        <select value={editData.method} onChange={e=>setEditData({...editData, method:e.target.value})} style={{width:'100%', marginBottom:10, padding:8}}>
                            <option value="Tunai">Tunai</option>
                            <option value="Transfer">Transfer</option>
                        </select>

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