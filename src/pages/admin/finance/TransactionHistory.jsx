import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

// LIBRARY DOWNLOAD
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // <--- Wajib install ini
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
    // Ambil PIN Owner
    getDoc(doc(db, "settings", "global_config")).then(snap => {
        if(snap.exists()) setOwnerPin(snap.data().ownerPin || "2003");
    });
    
    // Ambil Data Transaksi Realtime
    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTransactions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  // FILTER DATA
  const filteredData = filterMode === 'bulan' ? transactions.filter(t => t.date.startsWith(filterDate)) : transactions;

  // HITUNG TOTAL
  const totalMasuk = filteredData.filter(t => t.type === 'Pemasukan').reduce((a, b) => a + parseInt(b.amount || 0), 0);
  const totalKeluar = filteredData.filter(t => t.type === 'Pengeluaran').reduce((a, b) => a + parseInt(b.amount || 0), 0);
  const arusKasBersih = totalMasuk - totalKeluar;

  // --- FUNGSI DOWNLOAD PDF ---
  const downloadPDF = () => {
    if (filteredData.length === 0) return alert("⚠️ Data Kosong! Tidak ada yang bisa didownload.");

    try {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text("BIMBEL GEMILANG", 105, 15, null, null, "center");
        doc.setFontSize(10);
        doc.text(`Laporan Mutasi Keuangan: ${filterMode === 'bulan' ? filterDate : "SEMUA DATA"}`, 105, 22, null, null, "center");
        doc.line(10, 25, 200, 25); // Garis pemisah

        // Summary Box
        doc.setFontSize(10);
        doc.text(`Total Pemasukan : Rp ${totalMasuk.toLocaleString('id-ID')}`, 14, 35);
        doc.text(`Total Pengeluaran : Rp ${totalKeluar.toLocaleString('id-ID')}`, 14, 41);
        doc.setFont(undefined, 'bold');
        doc.text(`Sisa Kas Bersih : Rp ${arusKasBersih.toLocaleString('id-ID')}`, 14, 47);
        doc.setFont(undefined, 'normal');

        // Table Content
        const tableColumn = ["Tanggal", "Tipe", "Kategori & Ket", "Metode", "Masuk", "Keluar"];
        const tableRows = [];

        filteredData.forEach(t => {
            const amount = parseInt(t.amount || 0);
            tableRows.push([
                t.date,
                t.type,
                `${t.category}\n(${t.note || '-'})`, // Gabung Kategori & Note biar hemat kolom
                t.method,
                t.type === 'Pemasukan' ? amount.toLocaleString('id-ID') : "-",
                t.type === 'Pengeluaran' ? amount.toLocaleString('id-ID') : "-"
            ]);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 55,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80] }, // Warna Gelap
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { cellWidth: 25 }, // Tanggal
                1: { cellWidth: 20 }, // Tipe
                4: { halign: 'right', fontStyle: 'bold', textColor: [39, 174, 96] }, // Masuk (Hijau)
                5: { halign: 'right', fontStyle: 'bold', textColor: [192, 57, 43] }  // Keluar (Merah)
            }
        });

        doc.save(`Laporan_Keuangan_${filterDate}.pdf`);
    } catch (error) {
        console.error(error);
        alert("Gagal Download PDF! Pastikan sudah install: npm install jspdf jspdf-autotable");
    }
  };

  // --- FUNGSI DOWNLOAD EXCEL (FIXED) ---
  const downloadExcel = () => {
    if (filteredData.length === 0) return alert("⚠️ Data Kosong! Tidak ada yang bisa didownload.");

    try {
        const dataExcel = filteredData.map((t, index) => ({
            "No": index + 1,
            "Tanggal": t.date,
            "Tipe Transaksi": t.type,
            "Kategori": t.category,
            "Keterangan": t.note,
            "Metode Bayar": t.method,
            // Pastikan ini Angka (Integer) supaya bisa disum di Excel
            "Pemasukan (Rp)": t.type === 'Pemasukan' ? parseInt(t.amount || 0) : 0,
            "Pengeluaran (Rp)": t.type === 'Pengeluaran' ? parseInt(t.amount || 0) : 0,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataExcel);
        
        // Atur Lebar Kolom Biar Rapi
        const wscols = [
            {wch: 5},  // No
            {wch: 12}, // Tanggal
            {wch: 15}, // Tipe
            {wch: 20}, // Kategori
            {wch: 30}, // Keterangan
            {wch: 15}, // Metode
            {wch: 15}, // Masuk
            {wch: 15}  // Keluar
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");
        
        XLSX.writeFile(workbook, `Laporan_Keuangan_${filterDate}.xlsx`);
    } catch (error) {
        alert("Gagal Download Excel: " + error.message);
    }
  };

  // FUNGSI EDIT & DELETE
  const handleDelete = async (id) => {
    if (prompt("🔒 PIN Owner:") !== ownerPin) return alert("⛔ PIN SALAH!");
    if(window.confirm("Yakin hapus data ini? Saldo akan berubah!")) await deleteDoc(doc(db, "finance_logs", id));
  };

  const handleEditClick = (item) => {
    if (prompt("🔒 PIN Owner:") !== ownerPin) return alert("⛔ PIN SALAH!");
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
        alert("✅ Data berhasil diupdate!");
    } catch (err) {
        alert("Gagal update: " + err.message);
    }
  };

  return (
    <div>
        <div style={{background:'white', padding:20, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <h2 style={{marginTop:0, color:'#2c3e50'}}>📊 Mutasi & Riwayat Transaksi</h2>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:20}}>
                <div style={{display:'flex', gap:10, alignItems:'center'}}>
                    <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={{padding:10, borderRadius:5, border:'1px solid #ddd'}}>
                        <option value="bulan">📅 Filter Per Bulan</option>
                        <option value="semua">📂 Semua Data (Hati-hati banyak)</option>
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

            {/* RINGKASAN ARUS KAS */}
            <div style={{display:'flex', gap:20, marginTop:20, borderTop:'1px solid #eee', paddingTop:20}}>
                <div style={{flex:1, background:'#f0fff4', padding:15, borderRadius:8, borderLeft:'5px solid #27ae60'}}>
                    <small style={{color:'#666', fontWeight:'bold'}}>TOTAL PEMASUKAN</small>
                    <h3 style={{margin:'5px 0 0 0', color:'#27ae60', fontSize:20}}>+ Rp {totalMasuk.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#fff5f5', padding:15, borderRadius:8, borderLeft:'5px solid #c0392b'}}>
                    <small style={{color:'#666', fontWeight:'bold'}}>TOTAL PENGELUARAN</small>
                    <h3 style={{margin:'5px 0 0 0', color:'#c0392b', fontSize:20}}>- Rp {totalKeluar.toLocaleString()}</h3>
                </div>
                <div style={{flex:1, background:'#e8f4fc', padding:15, borderRadius:8, borderLeft:'5px solid #2980b9'}}>
                    <small style={{color:'#666', fontWeight:'bold'}}>NET CASH / SALDO</small>
                    <h3 style={{margin:'5px 0 0 0', color:'#2980b9', fontSize:20}}>Rp {arusKasBersih.toLocaleString()}</h3>
                </div>
            </div>
        </div>

        {/* TABEL DATA */}
        <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            {filteredData.length === 0 ? (
                <div style={{textAlign:'center', padding:40, color:'#999'}}>
                    <p>📂 Tidak ada data transaksi untuk periode ini.</p>
                </div>
            ) : (
                <div style={{overflowX:'auto'}}>
                    <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                        <thead>
                            <tr style={{background:'#34495e', color:'white', textAlign:'left'}}>
                                <th style={{padding:12, borderRadius:'5px 0 0 0'}}>Tanggal</th>
                                <th style={{padding:12}}>Tipe</th>
                                <th style={{padding:12}}>Keterangan</th>
                                <th style={{padding:12}}>Metode</th>
                                <th style={{padding:12, textAlign:'right'}}>Nominal</th>
                                <th style={{padding:12, textAlign:'center', borderRadius:'0 5px 0 0'}}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((t, idx) => (
                                <tr key={t.id} style={{borderBottom:'1px solid #eee', background: idx%2===0 ? 'white' : '#f9f9f9'}}>
                                    <td style={{padding:12}}>{t.date}</td>
                                    <td style={{padding:12}}>
                                        <span style={{
                                            background: t.type === 'Pemasukan' ? '#d4edda' : '#f8d7da',
                                            color: t.type === 'Pemasukan' ? '#155724' : '#721c24',
                                            padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 'bold'
                                        }}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td style={{padding:12}}>
                                        <div style={{fontWeight:'bold', color:'#2c3e50'}}>{t.category}</div>
                                        <div style={{fontSize:12, color:'#7f8c8d'}}>{t.note}</div>
                                    </td>
                                    <td style={{padding:12}}>{t.method}</td>
                                    <td style={{padding:12, textAlign:'right', fontWeight:'bold', color: t.type==='Pemasukan'?'#27ae60':'#c0392b'}}>
                                        {t.type === 'Pemasukan' ? '+' : '-'} {parseInt(t.amount).toLocaleString()}
                                    </td>
                                    <td style={{padding:12, textAlign:'center'}}>
                                        <button onClick={()=>handleEditClick(t)} style={{marginRight:8, border:'none', background:'transparent', cursor:'pointer', fontSize:16}} title="Edit">✏️</button>
                                        <button onClick={()=>handleDelete(t.id)} style={{border:'none', background:'transparent', cursor:'pointer', fontSize:16}} title="Hapus">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* MODAL EDIT */}
        {isEditing && editData && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', padding:25, borderRadius:10, width:350, boxShadow:'0 5px 15px rgba(0,0,0,0.3)'}}>
                    <h3 style={{marginTop:0}}>Edit Transaksi</h3>
                    <form onSubmit={handleSaveEdit}>
                        <div style={{marginBottom:10}}>
                            <label style={{display:'block', fontSize:12, marginBottom:5}}>Tanggal</label>
                            <input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc', boxSizing:'border-box'}} />
                        </div>
                        <div style={{marginBottom:10}}>
                            <label style={{display:'block', fontSize:12, marginBottom:5}}>Nominal (Rp)</label>
                            <input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:e.target.value})} style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc', boxSizing:'border-box'}} />
                        </div>
                        <div style={{marginBottom:10}}>
                            <label style={{display:'block', fontSize:12, marginBottom:5}}>Kategori</label>
                            <input type="text" value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})} style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc', boxSizing:'border-box'}} />
                        </div>
                        <div style={{marginBottom:20}}>
                            <label style={{display:'block', fontSize:12, marginBottom:5}}>Catatan</label>
                            <textarea value={editData.note} onChange={e=>setEditData({...editData, note:e.target.value})} style={{width:'100%', padding:8, borderRadius:4, border:'1px solid #ccc', boxSizing:'border-box', minHeight:60}} />
                        </div>
                        <div style={{display:'flex', gap:10}}>
                            <button type="button" onClick={()=>setIsEditing(false)} style={{flex:1, padding:10, background:'#ddd', border:'none', borderRadius:5, cursor:'pointer'}}>Batal</button>
                            <button type="submit" style={{flex:1, padding:10, background:'#2980b9', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>Simpan Perubahan</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default TransactionHistory;