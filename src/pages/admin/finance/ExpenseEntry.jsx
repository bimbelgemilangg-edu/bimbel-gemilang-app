import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc } from "firebase/firestore";

const ExpenseEntry = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Operasional',
    amount: '',
    method: 'Tunai',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) return alert("Nominal harus diisi!");

    // (Opsional) Disini bisa ditambahkan logika cek saldo dulu jika mau lebih canggih
    
    setLoading(true);
    try {
      await addDoc(collection(db, "finance_logs"), {
        type: 'Pengeluaran', // INI KUNCINYA (Supaya mengurangi saldo)
        date: form.date,
        category: form.category,
        amount: parseInt(form.amount),
        method: form.method,
        note: form.note,
        createdAt: new Date().toISOString()
      });

      alert("✅ Pengeluaran Berhasil Dicatat!");
      setForm({ ...form, amount: '', note: '' }); 
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:600, background:'white', padding:30, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginTop:0, color:'#c0392b'}}>➖ Input Pengeluaran</h3>
        <p style={{fontSize:13, color:'#666'}}>Catat semua uang keluar untuk operasional bimbel agar saldo aset tetap akurat.</p>
        
        <form onSubmit={handleSubmit}>
            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Tanggal</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} style={styles.input} />
            </div>

            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Kategori</label>
                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={styles.input}>
                    <option>Gaji Guru/Staf</option>
                    <option>Listrik & Air</option>
                    <option>Sewa Tempat</option>
                    <option>ATK & Perlengkapan</option>
                    <option>Internet/WiFi</option>
                    <option>Marketing/Iklan</option>
                    <option>Konsumsi</option>
                    <option>Maintenance/Service</option>
                    <option>Lainnya</option>
                </select>
            </div>

            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Nominal (Rp)</label>
                <input type="number" placeholder="Contoh: 150000" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} style={styles.input} />
            </div>

            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Sumber Dana (Metode)</label>
                <select value={form.method} onChange={e=>setForm({...form, method:e.target.value})} style={styles.input}>
                    <option value="Tunai">💵 Tunai (Ambil dari Brankas)</option>
                    <option value="Transfer">💳 Transfer (Ambil dari Rekening)</option>
                </select>
            </div>

            <div style={{marginBottom:20}}>
                <label style={{fontWeight:'bold', display:'block'}}>Keterangan</label>
                <textarea placeholder="Contoh: Bayar listrik bulan Februari" value={form.note} onChange={e=>setForm({...form, note:e.target.value})} style={{...styles.input, height:80}} />
            </div>

            <button type="submit" disabled={loading} style={styles.btnSave}>
                {loading ? "Menyimpan..." : "SIMPAN PENGELUARAN"}
            </button>
        </form>
    </div>
  );
};

const styles = {
    input: { width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd', marginTop:5, boxSizing:'border-box' },
    btnSave: { width:'100%', padding:15, background:'#c0392b', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold', fontSize:16 }
};

export default ExpenseEntry;