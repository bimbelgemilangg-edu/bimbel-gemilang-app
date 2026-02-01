import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc } from "firebase/firestore";

const IncomeEntry = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category: 'Lainnya',
    amount: '',
    method: 'Tunai',
    note: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) return alert("Nominal harus diisi!");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "finance_logs"), {
        type: 'Pemasukan', // INI KUNCINYA (Supaya nambah saldo)
        date: form.date,
        category: form.category,
        amount: parseInt(form.form),
        method: form.method,
        note: form.note,
        createdAt: new Date().toISOString()
      });

      alert("✅ Pemasukan Berhasil Dicatat!");
      setForm({ ...form, amount: '', note: '' }); // Reset form
    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth:600, background:'white', padding:30, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
        <h3 style={{marginTop:0, color:'#27ae60'}}>➕ Input Pemasukan Lain-lain</h3>
        <p style={{fontSize:13, color:'#666'}}>Gunakan form ini untuk mencatat pemasukan <b>SELAIN SPP/Pendaftaran Siswa</b> (Contoh: Jual Seragam, Hibah, Kantin, dll).</p>
        
        <form onSubmit={handleSubmit}>
            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Tanggal</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} style={styles.input} />
            </div>

            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Kategori</label>
                <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} style={styles.input}>
                    <option>Penjualan Modul/Buku</option>
                    <option>Penjualan Seragam</option>
                    <option>Kantin/Snack</option>
                    <option>Hibah/Donasi</option>
                    <option>Lainnya</option>
                </select>
            </div>

            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Nominal (Rp)</label>
                <input type="number" placeholder="Contoh: 50000" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} style={styles.input} />
            </div>

            <div style={{marginBottom:15}}>
                <label style={{fontWeight:'bold', display:'block'}}>Masuk Ke (Metode)</label>
                <select value={form.method} onChange={e=>setForm({...form, method:e.target.value})} style={styles.input}>
                    <option value="Tunai">💵 Tunai (Masuk Brankas)</option>
                    <option value="Transfer">💳 Transfer (Masuk Rekening)</option>
                </select>
            </div>

            <div style={{marginBottom:20}}>
                <label style={{fontWeight:'bold', display:'block'}}>Keterangan</label>
                <textarea placeholder="Contoh: Terjual 5 buku paket matematika" value={form.note} onChange={e=>setForm({...form, note:e.target.value})} style={{...styles.input, height:80}} />
            </div>

            <button type="submit" disabled={loading} style={styles.btnSave}>
                {loading ? "Menyimpan..." : "SIMPAN PEMASUKAN"}
            </button>
        </form>
    </div>
  );
};

const styles = {
    input: { width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd', marginTop:5, boxSizing:'border-box' },
    btnSave: { width:'100%', padding:15, background:'#27ae60', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold', fontSize:16 }
};

export default IncomeEntry;