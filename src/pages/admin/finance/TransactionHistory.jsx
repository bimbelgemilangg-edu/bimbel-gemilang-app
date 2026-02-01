import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 7)); // Filter Bulan (YYYY-MM)
  const [ownerPin, setOwnerPin] = useState("");

  // STATE UNTUK EDIT
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null); // Data yang sedang diedit

  // 1. LOAD DATA & PIN
  useEffect(() => {
    // Ambil PIN Owner
    getDoc(doc(db, "settings", "global_config")).then(snap => {
        if(snap.exists()) setOwnerPin(snap.data().ownerPin || "2003");
    });

    // Ambil Transaksi Realtime
    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(logs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. FILTER BERDASARKAN BULAN
  const filteredData = transactions.filter(t => t.date.startsWith(filterDate));

  // 3. FUNGSI HAPUS (DENGAN PIN)
  const handleDelete = async (id) => {
    const input = prompt("🔒 PROTEKSI OWNER\nMasukkan PIN untuk MENGHAPUS data ini:");
    if (input !== ownerPin) return alert("⛔ PIN SALAH! Akses ditolak.");

    if(window.confirm("Yakin hapus transaksi ini? Saldo akan berubah otomatis.")) {
        try {
            await deleteDoc(doc(db, "finance_logs", id));
            alert("🗑️ Data berhasil dihapus.");
        } catch (error) {
            console.error(error);
            alert("Gagal menghapus.");
        }
    }
  };

  // 4. BUKA MODAL EDIT (DENGAN PIN)
  const handleEditClick = (item) => {
    const input = prompt("🔒 PROTEKSI OWNER\nMasukkan PIN untuk MENGEDIT data ini:");
    if (input !== ownerPin) return alert("⛔ PIN SALAH! Akses ditolak.");

    setEditData(item);
    setIsEditing(true);
  };

  // 5. SIMPAN PERUBAHAN EDIT
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
        const ref = doc(db, "finance_logs", editData.id);
        await updateDoc(ref, {
            date: editData.date,
            amount: parseInt(editData.amount),
            method: editData.method, // Tunai / Transfer
            category: editData.category,
            note: editData.note
        });
        alert("✅ Data Berhasil Diupdate!");
        setIsEditing(false);
        setEditData(null);
    } catch (error) {
        console.error(error);
        alert("Gagal update data.");
    }
  };

  // HITUNG TOTAL
  const totalMasuk = filteredData.filter(t=>t.type==='Pemasukan').reduce((a,b)=>a+parseInt(b.amount),0);
  const totalKeluar = filteredData.filter(t=>t.type==='Pengeluaran').reduce((a,b)=>a+parseInt(b.amount),0);

  return (
    <div>
        {/* CSS PRINT */}
        <style>{`
            @media print {
                .no-print { display: none !important; }
                body { background: white; }
            }
        `}</style>

        {/* HEADER & FILTER */}
        <div className="no-print" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, background:'white', padding:15, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <div>
                <label style={{marginRight:10, fontWeight:'bold'}}>Pilih Bulan:</label>
                <input type="month" value={filterDate} onChange={e=>setFilterDate(e.target.value)} style={{padding:5}} />
            </div>
            <div style={{display:'flex', gap:20}}>
                <div style={{color:'green'}}>Masuk: <b>Rp {totalMasuk.toLocaleString()}</b></div>
                <div style={{color:'red'}}>Keluar: <b>Rp {totalKeluar.toLocaleString()}</b></div>
                <button onClick={()=>window.print()} style={{cursor:'pointer', padding:'5px 15px', background:'#2c3e50', color:'white', border:'none', borderRadius:5}}>🖨️ Cetak</button>
            </div>
        </div>

        {/* TABEL DATA */}
        <div style={{background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
            <h3 style={{marginTop:0, borderBottom:'2px solid #ddd', paddingBottom:10}}>📜 Buku Mutasi ({filterDate})</h3>
            <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
                <thead>
                    <tr style={{background:'#f8f9fa', textAlign:'left'}}>
                        <th style={{padding:10}}>Tanggal</th>
                        <th style={{padding:10}}>Tipe</th>
                        <th style={{padding:10}}>Kategori</th>
                        <th style={{padding:10}}>Keterangan</th>
                        <th style={{padding:10}}>Metode</th>
                        <th style={{padding:10, textAlign:'right'}}>Nominal</th>
                        <th className="no-print" style={{padding:10, textAlign:'center'}}>Aksi Owner</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredData.length === 0 ? <tr><td colSpan="7" style={{padding:20, textAlign:'center'}}>Tidak ada data.</td></tr> :
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
                            <td style={{padding:10, textAlign:'right', fontWeight:'bold', color: t.type==='Pemasukan'?'#27ae60':'#c0392b'}}>
                                {t.type==='Pemasukan'?'+':'-'} Rp {parseInt(t.amount).toLocaleString()}
                            </td>
                            <td className="no-print" style={{padding:10, textAlign:'center'}}>
                                <button onClick={()=>handleEditClick(t)} style={styles.btnEdit}>✏️</button>
                                <button onClick={()=>handleDelete(t.id)} style={styles.btnDel}>🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL EDIT (HANYA MUNCUL JIKA PIN BENAR) */}
        {isEditing && editData && (
            <div style={styles.overlay}>
                <div style={styles.modal}>
                    <h3 style={{marginTop:0}}>✏️ Edit Transaksi</h3>
                    <form onSubmit={handleSaveEdit}>
                        <div style={styles.formGroup}>
                            <label>Tanggal Transaksi</label>
                            <input type="date" value={editData.date} onChange={e=>setEditData({...editData, date:e.target.value})} style={styles.input} />
                        </div>
                        
                        <div style={styles.formGroup}>
                            <label>Nominal (Rp)</label>
                            <input type="number" value={editData.amount} onChange={e=>setEditData({...editData, amount:e.target.value})} style={styles.input} />
                        </div>

                        <div style={styles.formGroup}>
                            <label>Metode Pembayaran (Posisi Uang)</label>
                            <select value={editData.method} onChange={e=>setEditData({...editData, method:e.target.value})} style={styles.input}>
                                <option value="Tunai">💵 Tunai (Brankas)</option>
                                <option value="Transfer">💳 Transfer (Bank)</option>
                            </select>
                            <small style={{color:'red', fontSize:11}}>*Mengubah ini akan memindahkan saldo Tunai/Bank di Dashboard.</small>
                        </div>

                        <div style={styles.formGroup}>
                            <label>Kategori</label>
                            <select value={editData.category} onChange={e=>setEditData({...editData, category:e.target.value})} style={styles.input}>
                                <option>SPP</option><option>Pendaftaran</option><option>Gaji</option><option>Listrik</option><option>Sewa</option><option>ATK</option><option>Lainnya</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label>Keterangan</label>
                            <input type="text" value={editData.note} onChange={e=>setEditData({...editData, note:e.target.value})} style={styles.input} />
                        </div>

                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button type="submit" style={styles.btnSave}>SIMPAN PERUBAHAN</button>
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