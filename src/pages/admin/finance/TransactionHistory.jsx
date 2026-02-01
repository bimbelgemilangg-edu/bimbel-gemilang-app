import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// LIBRARY DOWNLOAD
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // FILTER
  const [filterMode, setFilterMode] = useState("bulan"); // 'bulan' atau 'semua'
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [ownerPin, setOwnerPin] = useState("");

  // EDIT STATE
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);

  // 1. LOAD DATA
  useEffect(() => {
    getDoc(doc(db, "settings", "global_config")).then(snap => {
        if(snap.exists()) setOwnerPin(snap.data().ownerPin || "2003");
    });

    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. LOGIKA FILTER DATA
  const filteredData = filterMode === 'bulan' 
    ? transactions.filter(t => t.date.startsWith(filterDate))
    : transactions; // Tampilkan semua

  // 3. HITUNG ARUS KAS
  const totalMasuk = filteredData.filter(t => t.type === 'Pemasukan').reduce((a, b) => a + parseInt(b.amount), 0);
  const totalKeluar = filteredData.filter(t => t.type === 'Pengeluaran').reduce((a, b) => a + parseInt(b.amount), 0);
  const arusKasBersih = totalMasuk - totalKeluar;

  // 4. DOWNLOAD PDF PROFESIONAL
  const downloadPDF = () => {
    const doc = new jsPDF();

    // Kop Surat
    doc.setFontSize(18);
    doc.text("BIMBEL GEMILANG", 105, 15, null, null, "center");
    doc.setFontSize(12);
    doc.text("Laporan Arus Kas & Mutasi Keuangan", 105, 22, null, null, "center");
    doc.setFontSize(10);
    doc.text(`Periode: ${filterMode === 'bulan' ? filterDate : "SEMUA DATA MUTASI"}`, 105, 27, null, null, "center");
    doc.line(10, 30, 200, 30); // Garis bawah kop

    // Ringkasan Arus Kas
    doc.setFontSize(11);
    doc.text(`Total Pemasukan : Rp ${totalMasuk.toLocaleString('id-ID')}`, 14, 40);
    doc.text(`Total Pengeluaran : Rp ${totalKeluar.toLocaleString('id-ID')}`, 14, 46);
    doc.setFont("helvetica", "bold");
    doc.text(`Surplus/Defisit : Rp ${arusKasBersih.toLocaleString('id-ID')}`, 14, 52);
    doc.setFont("helvetica", "normal");

    // Tabel Data
    const tableColumn = ["Tanggal", "Tipe", "Kategori", "Keterangan", "Metode", "Masuk", "Keluar"];
    const tableRows = [];

    filteredData.forEach(t => {
      const masuk = t.type === 'Pemasukan' ? parseInt(t.amount).toLocaleString('id-ID') : "-";
      const keluar = t.type === 'Pengeluaran' ? parseInt(t.amount).toLocaleString('id-ID') : "-";
      
      const rowData = [
        t.date,
        t.type,
        t.category,
        t.note,
        t.method,
        masuk,
        keluar
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 60,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [44, 62, 80] } // Warna header tabel
    });

    // Footer Tanda Tangan
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.text("Mengetahui,", 150, finalY);
    doc.text("( Owner / Admin )", 150, finalY + 25);

    doc.save(`Laporan_Keuangan_${filterMode}_${filterDate}.pdf`);
  };

  // 5. DOWNLOAD EXCEL INDONESIA
  const downloadExcel = () => {
    // Siapkan Data Format Excel
    const dataExcel = filteredData.map(t => ({
      "Tanggal": t.date,
      "Tipe Transaksi": t.type,
      "Kategori": t.category,
      "Keterangan": t.note,
      "Metode Bayar": t.method,
      "Pemasukan (Rp)": t.type === 'Pemasukan' ? parseInt(t.amount) : 0,
      "Pengeluaran (Rp)": t.type === 'Pengeluaran' ? parseInt(t.amount) : 0,
    }));

    // Tambahkan Baris Total di Bawah
    dataExcel.push({
      "Tanggal": "TOTAL",
      "Tipe Transaksi": "",
      "Kategori": "",
      "Keterangan": `ARUS KAS BERSIH: Rp ${arusKasBersih.toLocaleString()}`,
      "Metode Bayar": "",
      "Pemasukan (Rp)": totalMasuk,
      "Pengeluaran (Rp)": totalKeluar
    });

    const worksheet = XLSX.utils.json_to_sheet(dataExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
    XLSX.writeFile(workbook, `Laporan_Keuangan_${filterMode}_${filterDate}.xlsx`);
  };

  // FUNGSI EDIT & DELETE (TETAP DIPERTAHANKAN)
  const handleDelete = async (id) => {
    const input = prompt("🔒 PROTEKSI OWNER\nMasukkan PIN untuk MENGHAPUS data ini:");
    if (input !== ownerPin) return alert("⛔ PIN SALAH!");
    if(window.confirm("Yakin hapus? Saldo akan berubah.")) {
        await deleteDoc(doc(db, "finance_logs", id));
        alert("Data dihapus.");
    }
  };

  const handleEditClick = (item) => {
    const input = prompt("🔒 PROTEKSI OWNER\nMasukkan PIN untuk EDIT data ini:");
    if (input !== ownerPin) return alert("⛔ PIN SALAH!");
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
        setEditData(null);
        alert("Data diupdate!");
    } catch (error) { alert("Error update"); }
  };

  return (
    <div>
        {/* PANEL FILTER & KONTROL */}
        <div style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20}}>
                
                {/* Bagian Kiri: Filter */}
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <select 
                        value={filterMode} 
                        onChange={e => setFilterMode(e.target.value)} 
                        style={{padding:10, borderRadius:5, border:'1px solid #ddd', background:'#f8f9fa'}}
                    >
                        <option value="bulan">📅 Filter Per Bulan</option>
                        <option value="semua">📂 Semua Data (Full)</option>
                    </select>

                    {filterMode === 'bulan' && (
                        <input 
                            type="month" 
                            value={filterDate} 
                            onChange={e=>setFilterDate(e.target.value)} 
                            style={{padding:8, borderRadius:5, border:'1px solid #ddd'}} 
                        />
                    )}
                </div>

                {/* Bagian Kanan: Tombol Download */}
                <div style={{display:'flex', gap:10}}>
                    <button onClick={downloadPDF} style={{background:'#e74c3c', color:'white', border:'none', padding:'10px 15px', borderRadius:5, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                        📄 PDF
                    </button>
                    <button onClick={downloadExcel} style={{background:'#27ae60', color:'white', border:'none', padding:'10px 15px', borderRadius:5, cursor:'pointer', fontWeight:'bold', display:'flex', alignItems:'center', gap:5}}>
                        📊 Excel
                    </button>
                </div>
            </div>

            {/* RINGKASAN ARUS KAS */}
            <div style={{display:'flex', gap:20, marginTop:20, borderTop:'1px solid #eee', paddingTop:20}}>
                <div style={{flex:1, background:'#f0fff4', padding:15, borderRadius:8, borderLeft:'4px solid #27ae60'}}>
                    <small style={{color:'#27ae60', fontWeight:'bold'}}>TOTAL PEMASUKAN</small>
                    <h3 style={{margin:0, color:'#27ae60'}}>+ Rp {totalMasuk.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#fff5f5', padding:15, borderRadius:8, borderLeft:'4px solid #c0392b'}}>
                    <small style={{color:'#c0392b', fontWeight:'bold'}}>TOTAL PENGELUARAN</small>
                    <h3 style={{margin:0, color:'#c0392b'}}>- Rp {totalKeluar.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#f8f9fa', padding:15, borderRadius:8, borderLeft: arusKasBersih >= 0 ? '4px solid #2980b9' : '4px solid #e67e22'}}>
                    <small style={{color:'#2c3e50', fontWeight:'bold'}}>ARUS KAS BERSIH (NET)</small>
                    <h3 style={{margin:0, color: arusKasBersih >= 0 ? '#2980b9' : '#e67e22'}}>
                        Rp {arusKasBersih.toLocaleString()}
                    </h3>
                </div>
            </div>
        </div>

        {/* TABEL DATA */}
        <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <h3 style={{marginTop:0, borderBottom:'2px solid #ddd', paddingBottom:10}}>
                📜 Rincian Mutasi ({filterMode === 'bulan' ? filterDate : "Semua Data"})
            </h3>
            
            <div style={{overflowX:'auto'}}>
                <table style={{width:'100%', borderCollapse:'collapse', fontSize:13, minWidth:800}}>
                    <thead>
                        <tr style={{background:'#2c3e50', color:'white', textAlign:'left'}}>
                            <th style={{padding:12}}>Tanggal</th>
                            <th style={{padding:12}}>Tipe</th>
                            <th style={{padding:12}}>Kategori</th>
                            <th style={{padding:12}}>Keterangan</th>
                            <th style={{padding:12}}>Metode</th>
                            <th style={{padding:12, textAlign:'right'}}>Masuk (Debet)</th>
                            <th style={{padding:12, textAlign:'right'}}>Keluar (Kredit)</th>
                            <th style={{padding:12, textAlign:'center'}}>Aksi Owner</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? <tr><td colSpan="8" style={{padding:20, textAlign:'center'}}>Tidak ada data.</td></tr> :
                        filteredData.map(t => (
                            <tr key={t.id} style={{borderBottom:'1px solid #eee'}}>
                                <td style={{padding:10}}>{t.date}</td>
                                <td style={{padding:10}}>
                                    <span style={{
                                        background: t.type==='Pemasukan'?'#d4edda':'#f8d7da',
                                        color: t.type==='Pemasukan'?'#155724':'#721c24',
                                        padding:'3px 8px', borderRadius:5, fontSize:11, fontWeight:'bold'
                                    }}>{t.type}</span>
                                </td>
                                <td style={{padding:10}}>{t.category}</td>
                                <td style={{padding:10, color:'#555'}}>{t.note}</td>
                                <td style={{padding:10}}>
                                    {t.method === 'Tunai' ? '💵 Tunai' : '💳 Bank'}
                                </td>
                                <td style={{padding:10, textAlign:'right', color:'#27ae60', fontWeight:'bold'}}>
                                    {t.type === 'Pemasukan' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-'}
                                </td>
                                <td style={{padding:10, textAlign:'right', color:'#c0392b', fontWeight:'bold'}}>
                                    {t.type === 'Pengeluaran' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-'}
                                </td>
                                <td style={{padding:10, textAlign:'center'}}>
                                    <button onClick={()=>handleEditClick(t)} style={styles.btnEdit}>✏️</button>
                                    <button onClick={()=>handleDelete(t.id)} style={styles.btnDel}>🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL EDIT (PIN PROTECTED) */}
        {isEditing && editData && (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h3 style={{marginTop:0}}>✏️ Edit Transaksi</h3>
                    <form onSubmit={handleSaveEdit}>
                        <div style={styles.formGroup}>
                            <label>Tanggal</label>
                            <input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} style={styles.input} />
                        </div>
                        <div style={styles.formGroup}>
                            <label>Nominal (Rp)</label>
                            <input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:e.target.value})} style={styles.input} />
                        </div>
                        <div style={styles.formGroup}>
                            <label>Metode</label>
                            <select value={editData.method} onChange={e=>setEditData({...editData, method:e.target.value})} style={styles.input}>
                                <option value="Tunai">💵 Tunai (Brankas)</option>
                                <option value="Transfer">💳 Bank (Rekening)</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label>Keterangan</label>
                            <input type="text" value={editData.note} onChange={e=>setEditData({...editData, note:e.target.value})} style={styles.input} />
                        </div>
                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button type="submit" style={styles.btnSave}>SIMPAN</button>
                            <button type="button" onClick={()=>setIsEditing(false)} style={styles.btnCancel}>BATAL</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

const styles = {
    btnEdit: { background:'#f39c12', color:'white', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer', marginRight:5 },
    btnDel: { background:'#c0392b', color:'white', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer' },
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000 },
    modal: { background:'white', padding:30, borderRadius:10, width:400, boxShadow:'0 5px 15px rgba(0,0,0,0.3)' },
    formGroup: { marginBottom:15 },
    input: { width:'100%', padding:8, borderRadius:5, border:'1px solid #ccc', marginTop:5, boxSizing:'border-box' },
    btnSave: { flex:1, padding:10, background:'#27ae60', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' },
    btnCancel: { flex:1, padding:10, background:'#ccc', color:'black', border:'none', borderRadius:5, cursor:'pointer' }
};

export default TransactionHistory;