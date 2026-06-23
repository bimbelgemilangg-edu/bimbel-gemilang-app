import React, { useState } from 'react';
import { db } from '../../../firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Save, ArrowUpCircle, ArrowDownCircle, X } from 'lucide-react';

const TransactionForm = () => {
  const [loading, setLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);
  
  const [form, setForm] = useState({
    type: 'Pemasukan',
    date: new Date().toISOString().split('T')[0],
    category: '',
    amount: '',
    method: 'Tunai',
    note: ''
  });

  const showAlert = (msg, duration = 3000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  const getCategories = (type) => {
    if (type === 'Pemasukan') {
      return ['Penjualan Modul/Buku', 'Penjualan Seragam', 'Kantin/Snack', 'Hibah/Donasi', 'Lainnya'];
    }
    return ['Gaji Guru/Staf', 'Listrik & Air', 'Sewa Tempat', 'ATK & Perlengkapan', 'Internet/WiFi', 'Marketing/Iklan', 'Konsumsi', 'Maintenance/Service', 'Lainnya'];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || parseInt(form.amount) <= 0) return showAlert('⚠️ Nominal harus diisi!');
    if (!form.category) return showAlert('⚠️ Pilih kategori!');

    setLoading(true);
    try {
      await addDoc(collection(db, "finance_logs"), {
        type: form.type,
        date: form.date,
        category: form.category,
        amount: parseInt(form.amount),
        method: form.method,
        note: form.note,
        createdAt: serverTimestamp()
      });

      showAlert(`✅ ${form.type} berhasil dicatat!`);
      setForm(prev => ({
        ...prev,
        amount: '',
        note: '',
        category: ''
      }));
    } catch (error) {
      console.error(error);
      showAlert('❌ Gagal menyimpan: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPemasukan = form.type === 'Pemasukan';
  const categories = getCategories(form.type);

  return (
    <div style={{maxWidth: 600}}>
      {alertMsg && (
        <div style={{
          background: '#1e293b', color: 'white', padding: '12px 20px',
          borderRadius: 10, marginBottom: 15, fontWeight: 'bold', fontSize: 13
        }}>{alertMsg}</div>
      )}

      <div style={styles.card}>
        <h3 style={styles.title}>
          {isPemasukan ? (
            <><ArrowUpCircle size={20} color="#10b981" /> Input Pemasukan</>
          ) : (
            <><ArrowDownCircle size={20} color="#ef4444" /> Input Pengeluaran</>
          )}
        </h3>
        <p style={styles.subtitle}>
          {isPemasukan 
            ? 'Catat pemasukan SELAIN SPP/Pendaftaran (contoh: jual buku, seragam, hibah).'
            : 'Catat semua uang keluar untuk operasional bimbel.'}
        </p>

        {/* Toggle Type */}
        <div style={styles.toggleRow}>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Pemasukan', category: ''}))}
            style={styles.toggleBtn(true, isPemasukan)}
          >
            <ArrowUpCircle size={16} /> Pemasukan
          </button>
          <button 
            type="button"
            onClick={() => setForm(prev => ({...prev, type: 'Pengeluaran', category: ''}))}
            style={styles.toggleBtn(false, !isPemasukan)}
          >
            <ArrowDownCircle size={16} /> Pengeluaran
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Tanggal */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Tanggal</label>
            <input 
              type="date" 
              value={form.date} 
              onChange={e => setForm(prev => ({...prev, date: e.target.value}))} 
              style={styles.input} 
            />
          </div>

          {/* Kategori */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Kategori</label>
            <select 
              value={form.category} 
              onChange={e => setForm(prev => ({...prev, category: e.target.value}))} 
              style={styles.input}
            >
              <option value="">-- Pilih Kategori --</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Nominal */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Nominal (Rp)</label>
            <input 
              type="number" 
              placeholder="Contoh: 150000" 
              value={form.amount} 
              onChange={e => setForm(prev => ({...prev, amount: e.target.value}))} 
              style={{
                ...styles.input, 
                fontSize: 18, 
                fontWeight: 'bold',
                color: isPemasukan ? '#10b981' : '#ef4444',
                borderColor: isPemasukan ? '#10b981' : '#ef4444'
              }} 
              required 
            />
          </div>

          {/* Metode */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Metode</label>
            <select 
              value={form.method} 
              onChange={e => setForm(prev => ({...prev, method: e.target.value}))} 
              style={styles.input}
            >
              <option value="Tunai">💵 Tunai</option>
              <option value="Transfer">💳 Transfer</option>
            </select>
          </div>

          {/* Keterangan */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Keterangan</label>
            <textarea 
              placeholder={isPemasukan ? 'Contoh: Terjual 5 buku paket' : 'Contoh: Bayar listrik bulan ini'} 
              value={form.note} 
              onChange={e => setForm(prev => ({...prev, note: e.target.value}))} 
              style={{...styles.input, height: 80, resize: 'vertical'}} 
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            disabled={loading} 
            style={{
              ...styles.btnSubmit,
              background: isPemasukan ? '#10b981' : '#ef4444'
            }}
          >
            <Save size={16} /> {loading ? 'Menyimpan...' : `Simpan ${form.type}`}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  card: { background: 'white', padding: 24, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  title: { margin: '0 0 4px 0', fontSize: 16, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold' },
  subtitle: { fontSize: 12, color: '#94a3b8', marginBottom: 20 },
  toggleRow: { display: 'flex', gap: 8, marginBottom: 20 },
  toggleBtn: (isIncome, active) => ({
    flex: 1, padding: '10px', borderRadius: 10,
    border: active ? `2px solid ${isIncome ? '#10b981' : '#ef4444'}` : '1px solid #e2e8f0',
    background: active ? (isIncome ? '#f0fdf4' : '#fef2f2') : 'white',
    color: active ? (isIncome ? '#166534' : '#991b1b') : '#64748b',
    fontWeight: active ? 'bold' : '500', fontSize: 13,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: '0.2s'
  }),
  inputGroup: { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 5 },
  input: { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' },
  btnSubmit: { width: '100%', padding: '14px', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold', fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
};

export default TransactionForm;