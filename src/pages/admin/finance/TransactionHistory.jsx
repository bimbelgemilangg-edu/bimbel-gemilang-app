import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc } from "firebase/firestore";
import { Download, Filter, Search, Edit3, Trash2, X, Save, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter
  const [filterType, setFilterType] = useState('Semua');
  const [filterMethod, setFilterMethod] = useState('Semua');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);
  const [ownerPin, setOwnerPin] = useState('2003');
  const [pinInput, setPinInput] = useState('');

  useEffect(() => {
    getDoc(doc(db, "settings", "global_config")).then(snap => {
      if (snap.exists()) setOwnerPin(snap.data().ownerPin || '2003');
    });

    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Filter
  useEffect(() => {
    let result = [...transactions];
    if (filterType !== 'Semua') result = result.filter(t => t.type === filterType);
    if (filterMethod !== 'Semua') result = result.filter(t => t.method === filterMethod);
    if (filterMonth) result = result.filter(t => (t.date || '').startsWith(filterMonth));
    if (searchTerm) result = result.filter(t => 
      (t.note || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.namaSiswa || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFiltered(result);
  }, [transactions, filterType, filterMethod, filterMonth, searchTerm]);

  // Totals
  const totalMasuk = filtered.filter(t => t.type === 'Pemasukan').reduce((s, t) => s + (parseInt(t.amount) || 0), 0);
  const totalKeluar = filtered.filter(t => t.type === 'Pengeluaran').reduce((s, t) => s + (parseInt(t.amount) || 0), 0);

  // Delete
  const handleDelete = async (id) => {
    const pin = prompt('🔒 Masukkan PIN Owner:');
    if (pin !== ownerPin) return alert('⛔ PIN SALAH!');
    if (!window.confirm('Yakin hapus transaksi ini?')) return;
    try {
      await deleteDoc(doc(db, "finance_logs", id));
    } catch (e) { alert('Gagal: ' + e.message); }
  };

  // Edit
  const openEdit = (item) => {
    setPinInput('');
    setEditData({...item});
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (pinInput !== ownerPin) return alert('⛔ PIN SALAH!');
    try {
      await updateDoc(doc(db, "finance_logs", editData.id), {
        date: editData.date,
        type: editData.type,
        category: editData.category,
        amount: parseInt(editData.amount),
        method: editData.method,
        note: editData.note
      });
      setShowEdit(false);
      alert('✅ Berhasil diupdate!');
    } catch (err) { alert('Gagal: ' + err.message); }
  };

  // Export
  const exportPDF = () => {
    if (filtered.length === 0) return alert('Data kosong!');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text('BIMBEL GEMILANG - LAPORAN KEUANGAN', 14, 15);
    doc.setFontSize(10);
    doc.text(`Total Masuk: Rp ${totalMasuk.toLocaleString()} | Total Keluar: Rp ${totalKeluar.toLocaleString()}`, 14, 22);
    
    const body = filtered.map(t => [
      t.date, t.type, t.method, t.category, t.note || '-',
      t.type === 'Pemasukan' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-',
      t.type === 'Pengeluaran' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-'
    ]);
    
    autoTable(doc, {
      head: [['Tgl', 'Tipe', 'Metode', 'Kategori', 'Ket', 'Masuk', 'Keluar']],
      body, startY: 28,
      headStyles: { fillColor: [30, 41, 59] },
      columnStyles: { 5: { halign: 'right', textColor: [16, 185, 129] }, 6: { halign: 'right', textColor: [239, 68, 68] } }
    });
    doc.save(`Keuangan_${filterMonth || 'All'}.pdf`);
  };

  const exportExcel = () => {
    if (filtered.length === 0) return alert('Data kosong!');
    const data = filtered.map((t, i) => ({
      'No': i + 1, 'Tanggal': t.date, 'Tipe': t.type, 'Metode': t.method,
      'Kategori': t.category, 'Keterangan': t.note || '',
      'Masuk': t.type === 'Pemasukan' ? parseInt(t.amount) : 0,
      'Keluar': t.type === 'Pengeluaran' ? parseInt(t.amount) : 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `Keuangan_${filterMonth || 'All'}.xlsx`);
  };

  if (loading) return <div style={{textAlign: 'center', padding: 50}}>Memuat data...</div>;

  return (
    <div>
      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={styles.filterGroup}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.filterInput}>
            <option value="Semua">Semua Tipe</option>
            <option value="Pemasukan">💰 Pemasukan</option>
            <option value="Pengeluaran">📤 Pengeluaran</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={styles.filterInput}>
            <option value="Semua">Semua Metode</option>
            <option value="Tunai">💵 Tunai</option>
            <option value="Transfer">💳 Transfer</option>
          </select>
        </div>
        <div style={styles.filterGroup}>
          <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={styles.filterInput} />
        </div>
        <div style={{...styles.filterGroup, flex: 2}}>
          <input type="text" placeholder="Cari..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.filterInput} />
        </div>
        <button onClick={exportPDF} style={styles.btnExport('#ef4444')}>📄 PDF</button>
        <button onClick={exportExcel} style={styles.btnExport('#10b981')}>📊 Excel</button>
      </div>

      {/* Summary */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryBox('#f0fdf4', '#10b981')}>
          <span>Total Masuk</span>
          <strong>Rp {totalMasuk.toLocaleString()}</strong>
        </div>
        <div style={styles.summaryBox('#fef2f2', '#ef4444')}>
          <span>Total Keluar</span>
          <strong>Rp {totalKeluar.toLocaleString()}</strong>
        </div>
        <div style={styles.summaryBox('#f8fafc', '#1e293b')}>
          <span>Selisih</span>
          <strong style={{color: totalMasuk - totalKeluar >= 0 ? '#10b981' : '#ef4444'}}>
            Rp {(totalMasuk - totalKeluar).toLocaleString()}
          </strong>
        </div>
      </div>

      {/* Table */}
      <div style={styles.tableCard}>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Tgl</th>
                <th style={styles.th}>Tipe</th>
                <th style={styles.th}>Metode</th>
                <th style={styles.th}>Kategori</th>
                <th style={styles.th}>Ket</th>
                <th style={{...styles.th, textAlign: 'right'}}>Nominal</th>
                <th style={{...styles.th, textAlign: 'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={styles.tr}>
                  <td style={styles.td}>{t.date}</td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge(t.type)}>{t.type}</span>
                  </td>
                  <td style={styles.td}>{t.method === 'Tunai' ? '💵' : '💳'} {t.method}</td>
                  <td style={styles.td}>{t.category}</td>
                  <td style={{...styles.td, fontSize: 11}}>{t.note || '-'}</td>
                  <td style={{...styles.td, textAlign: 'right', fontWeight: 'bold', color: t.type === 'Pemasukan' ? '#10b981' : '#ef4444'}}>
                    {t.type === 'Pengeluaran' ? '-' : ''}Rp {parseInt(t.amount).toLocaleString()}
                  </td>
                  <td style={{...styles.td, textAlign: 'center'}}>
                    <button onClick={() => openEdit(t)} style={styles.btnIcon('#f59e0b')}><Edit3 size={12} /></button>
                    <button onClick={() => handleDelete(t.id)} style={styles.btnIcon('#ef4444')}><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p style={{textAlign: 'center', padding: 30, color: '#94a3b8'}}>Data kosong</p>}
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && editData && (
        <div style={styles.modalOverlay} onClick={() => setShowEdit(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3>Edit Transaksi</h3>
              <button onClick={() => setShowEdit(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit}>
              <input type="date" value={editData.date} onChange={e => setEditData(p => ({...p, date: e.target.value}))} style={styles.modalInput} />
              <select value={editData.type} onChange={e => setEditData(p => ({...p, type: e.target.value}))} style={styles.modalInput}>
                <option value="Pemasukan">Pemasukan</option>
                <option value="Pengeluaran">Pengeluaran</option>
              </select>
              <select value={editData.method} onChange={e => setEditData(p => ({...p, method: e.target.value}))} style={styles.modalInput}>
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer</option>
              </select>
              <input type="text" value={editData.category} onChange={e => setEditData(p => ({...p, category: e.target.value}))} style={styles.modalInput} />
              <input type="number" value={editData.amount} onChange={e => setEditData(p => ({...p, amount: e.target.value}))} style={styles.modalInput} />
              <input type="text" value={editData.note} onChange={e => setEditData(p => ({...p, note: e.target.value}))} style={styles.modalInput} placeholder="Keterangan" />
              <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} style={styles.modalInput} placeholder="PIN Owner" required />
              <div style={{display: 'flex', gap: 8}}>
                <button type="button" onClick={() => setShowEdit(false)} style={{flex:1, padding:12, borderRadius:8, border:'1px solid #e2e8f0', background:'white'}}>Batal</button>
                <button type="submit" style={{flex:2, padding:12, borderRadius:8, border:'none', background:'#3b82f6', color:'white', fontWeight:'bold'}}><Save size={14} /> Update</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  filterBar: { display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap', alignItems: 'center' },
  filterGroup: { flex: 1, minWidth: 130 },
  filterInput: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white', boxSizing: 'border-box' },
  btnExport: (color) => ({ padding: '10px 16px', borderRadius: 8, background: color, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 12, whiteSpace: 'nowrap' }),
  summaryRow: { display: 'flex', gap: 12, marginBottom: 15, flexWrap: 'wrap' },
  summaryBox: (bg, color) => ({ flex: 1, minWidth: 150, background: bg, padding: 14, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${color}30` }),
  tableCard: { background: 'white', borderRadius: 14, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '10px 12px', fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', fontSize: 12, verticalAlign: 'middle' },
  typeBadge: (type) => ({ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: type === 'Pemasukan' ? '#dcfce7' : '#fee2e2', color: type === 'Pemasukan' ? '#166534' : '#991b1b' }),
  btnIcon: (color) => ({ background: `${color}20`, color, border: 'none', padding: '6px', borderRadius: 6, cursor: 'pointer', marginRight: 4 }),
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modalContent: { background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 400 },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalInput: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 10, fontSize: 13, boxSizing: 'border-box' },
  closeBtn: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }
};

export default TransactionHistory;