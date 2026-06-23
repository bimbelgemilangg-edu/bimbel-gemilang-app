import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { 
  collection, query, orderBy, onSnapshot, doc, deleteDoc, updateDoc, getDoc 
} from "firebase/firestore";
import { 
  Download, Filter, Search, Edit3, Trash2, X, Save, RefreshCw, Calendar, Lock
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);

  // === FILTER ===
  const [filterType, setFilterType] = useState('Semua');
  const [filterMethod, setFilterMethod] = useState('Semua');
  const [filterMode, setFilterMode] = useState('bulan'); // 'bulan' | 'range' | 'semua'
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');

  // === EDIT ===
  const [showEdit, setShowEdit] = useState(false);
  const [editData, setEditData] = useState(null);

  // === PIN (dari Settings) ===
  const [ownerPin, setOwnerPin] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    // Ambil PIN dari settings
    getDoc(doc(db, "settings", "global_config")).then(snap => {
      if (snap.exists()) setOwnerPin(snap.data().ownerPin || '2003');
    });

    // Real-time listener
    const q = query(collection(db, "finance_logs"), orderBy("date", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // === FILTER LOGIC ===
  useEffect(() => {
    let result = [...transactions];

    // Filter tipe
    if (filterType !== 'Semua') result = result.filter(t => t.type === filterType);
    
    // Filter metode
    if (filterMethod !== 'Semua') result = result.filter(t => t.method === filterMethod);

    // Filter tanggal
    if (filterMode === 'bulan' && filterMonth) {
      result = result.filter(t => (t.date || '').startsWith(filterMonth));
    } else if (filterMode === 'range') {
      result = result.filter(t => {
        if (!t.date) return false;
        return t.date >= dateRange.start && t.date <= dateRange.end;
      });
    }
    // 'semua' = no filter

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        (t.note || '').toLowerCase().includes(term) ||
        (t.category || '').toLowerCase().includes(term) ||
        (t.namaSiswa || '').toLowerCase().includes(term) ||
        String(t.amount || '').includes(term)
      );
    }

    setFiltered(result);
  }, [transactions, filterType, filterMethod, filterMode, filterMonth, dateRange, searchTerm]);

  // === TOTALS ===
  const totalMasuk = filtered.filter(t => t.type === 'Pemasukan').reduce((s, t) => s + (parseInt(t.amount) || 0), 0);
  const totalKeluar = filtered.filter(t => t.type === 'Pengeluaran').reduce((s, t) => s + (parseInt(t.amount) || 0), 0);
  const saldoTunai = filtered.reduce((s, t) => {
    if (t.method !== 'Tunai') return s;
    return t.type === 'Pemasukan' ? s + (parseInt(t.amount) || 0) : s - (parseInt(t.amount) || 0);
  }, 0);
  const saldoBank = filtered.reduce((s, t) => {
    if (t.method !== 'Transfer') return s;
    return t.type === 'Pemasukan' ? s + (parseInt(t.amount) || 0) : s - (parseInt(t.amount) || 0);
  }, 0);

  // === DELETE (dengan PIN) ===
  const confirmDelete = (id) => {
    setDeleteTarget(id);
    setPinInput('');
    setShowPinModal(true);
  };

  const handleDelete = async () => {
    if (pinInput !== ownerPin) {
      alert('⛔ PIN SALAH! Transaksi tidak bisa dihapus.');
      return;
    }
    if (!deleteTarget) return;
    
    try {
      await deleteDoc(doc(db, "finance_logs", deleteTarget));
      setShowPinModal(false);
      setDeleteTarget(null);
      alert('✅ Transaksi berhasil dihapus!');
    } catch (e) {
      alert('❌ Gagal menghapus: ' + e.message);
    }
  };

  // === EDIT ===
  const openEdit = (item) => {
    setPinInput('');
    setEditData({...item});
    setShowEdit(true);
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    if (pinInput !== ownerPin) {
      alert('⛔ PIN SALAH! Tidak bisa mengedit transaksi.');
      return;
    }
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
      alert('✅ Transaksi berhasil diupdate!');
    } catch (err) {
      alert('❌ Gagal: ' + err.message);
    }
  };

  // === EXPORT ===
  const exportPDF = () => {
    if (filtered.length === 0) return alert('⚠️ Data kosong!');
    const doc = new jsPDF();
    doc.setFontSize(13);
    doc.text('BIMBEL GEMILANG - LAPORAN KEUANGAN', 14, 15);
    doc.setFontSize(9);
    doc.text(`Periode: ${filterMode === 'range' ? `${dateRange.start} s/d ${dateRange.end}` : filterMode === 'bulan' ? filterMonth : 'Semua'}`, 14, 21);
    doc.text(`Total Masuk: Rp ${totalMasuk.toLocaleString()} | Keluar: Rp ${totalKeluar.toLocaleString()} | Saldo: Rp ${(totalMasuk - totalKeluar).toLocaleString()}`, 14, 27);

    const body = filtered.map(t => [
      t.date, t.type, t.method, t.category, (t.note || '-').substring(0, 25),
      t.type === 'Pemasukan' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-',
      t.type === 'Pengeluaran' ? `Rp ${parseInt(t.amount).toLocaleString()}` : '-'
    ]);

    autoTable(doc, {
      head: [['Tgl', 'Tipe', 'Metode', 'Kategori', 'Ket', 'Masuk', 'Keluar']],
      body, startY: 32,
      headStyles: { fillColor: [30, 41, 59], fontSize: 8 },
      columnStyles: {
        5: { halign: 'right', textColor: [16, 185, 129] },
        6: { halign: 'right', textColor: [239, 68, 68] }
      },
      styles: { fontSize: 7 }
    });
    doc.save(`Keuangan_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportExcel = () => {
    if (filtered.length === 0) return alert('⚠️ Data kosong!');
    const data = filtered.map((t, i) => ({
      'No': i + 1,
      'Tanggal': t.date,
      'Tipe': t.type,
      'Metode': t.method,
      'Kategori': t.category,
      'Keterangan': t.note || '',
      'Masuk (Rp)': t.type === 'Pemasukan' ? parseInt(t.amount) : 0,
      'Keluar (Rp)': t.type === 'Pengeluaran' ? parseInt(t.amount) : 0
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch:5},{wch:12},{wch:12},{wch:10},{wch:20},{wch:25},{wch:15},{wch:15}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
    XLSX.writeFile(wb, `Keuangan_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) return <div style={{textAlign: 'center', padding: 50, color: '#94a3b8'}}>Memuat data transaksi...</div>;

  return (
    <div>
      {/* === FILTER BAR === */}
      <div style={styles.filterBar}>
        {/* Mode Filter */}
        <div style={styles.filterGroup}>
          <select value={filterMode} onChange={e => setFilterMode(e.target.value)} style={styles.filterSelect}>
            <option value="bulan">📅 Per Bulan</option>
            <option value="range">📆 Rentang Tanggal</option>
            <option value="semua">📂 Semua Data</option>
          </select>
        </div>

        {/* Input sesuai mode */}
        {filterMode === 'bulan' && (
          <div style={styles.filterGroup}>
            <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={styles.filterSelect} />
          </div>
        )}
        {filterMode === 'range' && (
          <>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Dari</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(prev => ({...prev, start: e.target.value}))} style={styles.filterSelect} />
            </div>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sampai</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(prev => ({...prev, end: e.target.value}))} style={styles.filterSelect} />
            </div>
          </>
        )}

        {/* Filter Tipe */}
        <div style={styles.filterGroup}>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">Semua Tipe</option>
            <option value="Pemasukan">💰 Pemasukan</option>
            <option value="Pengeluaran">📤 Pengeluaran</option>
          </select>
        </div>

        {/* Filter Metode */}
        <div style={styles.filterGroup}>
          <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)} style={styles.filterSelect}>
            <option value="Semua">Semua Metode</option>
            <option value="Tunai">💵 Tunai</option>
            <option value="Transfer">💳 Transfer</option>
          </select>
        </div>

        {/* Search */}
        <div style={{...styles.filterGroup, flex: 2}}>
          <div style={styles.searchBox}>
            <Search size={14} color="#94a3b8" />
            <input type="text" placeholder="Cari keterangan, kategori, nominal..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.searchInput} />
            {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearBtn}>✕</button>}
          </div>
        </div>

        {/* Export */}
        <button onClick={exportPDF} style={styles.btnExport('#ef4444')}>📄 PDF</button>
        <button onClick={exportExcel} style={styles.btnExport('#10b981')}>📊 Excel</button>
      </div>

      {/* === SUMMARY === */}
      <div style={styles.summaryRow}>
        <div style={styles.summaryCard('#f0fdf4', '#10b981')}>
          <span>Total Masuk</span>
          <strong>Rp {totalMasuk.toLocaleString()}</strong>
        </div>
        <div style={styles.summaryCard('#fef2f2', '#ef4444')}>
          <span>Total Keluar</span>
          <strong>Rp {totalKeluar.toLocaleString()}</strong>
        </div>
        <div style={styles.summaryCard('#fff7ed', '#f97316')}>
          <span>💵 Saldo Tunai</span>
          <strong>Rp {saldoTunai.toLocaleString()}</strong>
        </div>
        <div style={styles.summaryCard('#e0e7ff', '#3b82f6')}>
          <span>💳 Saldo Bank</span>
          <strong>Rp {saldoBank.toLocaleString()}</strong>
        </div>
      </div>

      {/* === TABLE === */}
      <div style={styles.tableCard}>
        <div style={{overflowX: 'auto'}}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thr}>
                <th style={styles.th}>Tgl</th>
                <th style={styles.th}>Tipe</th>
                <th style={styles.th}>Metode</th>
                <th style={styles.th}>Kategori</th>
                <th style={styles.th}>Keterangan</th>
                <th style={{...styles.th, textAlign: 'right'}}>Nominal</th>
                <th style={{...styles.th, textAlign: 'center'}}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{textAlign: 'center', padding: 40, color: '#94a3b8'}}>
                    Tidak ada data untuk filter ini
                  </td>
                </tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} style={styles.tr}>
                    <td style={styles.td}>{t.date}</td>
                    <td style={styles.td}>
                      <span style={styles.typeBadge(t.type)}>
                        {t.type === 'Pemasukan' ? '💰 Masuk' : '📤 Keluar'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.methodBadge(t.method)}>
                        {t.method === 'Tunai' ? '💵' : '💳'} {t.method}
                      </span>
                    </td>
                    <td style={styles.td}>{t.category}</td>
                    <td style={{...styles.td, fontSize: 11, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                      {t.note || '-'}
                    </td>
                    <td style={{
                      ...styles.td, textAlign: 'right', fontWeight: 'bold',
                      color: t.type === 'Pemasukan' ? '#10b981' : '#ef4444'
                    }}>
                      {t.type === 'Pengeluaran' ? '- ' : '+ '}Rp {parseInt(t.amount).toLocaleString()}
                    </td>
                    <td style={{...styles.td, textAlign: 'center'}}>
                      <div style={{display: 'flex', gap: 4, justifyContent: 'center'}}>
                        <button onClick={() => openEdit(t)} style={styles.btnIcon('#f59e0b')} title="Edit">
                          <Edit3 size={13} />
                        </button>
                        <button onClick={() => confirmDelete(t.id)} style={styles.btnIcon('#ef4444')} title="Hapus">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* === MODAL EDIT === */}
      {showEdit && editData && (
        <div style={styles.modalOverlay} onClick={() => setShowEdit(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0}}>✏️ Edit Transaksi</h3>
              <button onClick={() => setShowEdit(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <form onSubmit={handleEdit} style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              <input type="date" value={editData.date} onChange={e => setEditData(p => ({...p, date: e.target.value}))} style={styles.modalInput} />
              <select value={editData.type} onChange={e => setEditData(p => ({...p, type: e.target.value}))} style={styles.modalInput}>
                <option value="Pemasukan">💰 Pemasukan</option>
                <option value="Pengeluaran">📤 Pengeluaran</option>
              </select>
              <select value={editData.method} onChange={e => setEditData(p => ({...p, method: e.target.value}))} style={styles.modalInput}>
                <option value="Tunai">💵 Tunai</option>
                <option value="Transfer">💳 Transfer</option>
              </select>
              <input type="text" value={editData.category} onChange={e => setEditData(p => ({...p, category: e.target.value}))} style={styles.modalInput} placeholder="Kategori" />
              <input type="number" value={editData.amount} onChange={e => setEditData(p => ({...p, amount: e.target.value}))} style={styles.modalInput} placeholder="Nominal" />
              <input type="text" value={editData.note} onChange={e => setEditData(p => ({...p, note: e.target.value}))} style={styles.modalInput} placeholder="Keterangan" />
              
              <div style={{background: '#fef3c7', padding: 10, borderRadius: 8, border: '1px solid #fde68a'}}>
                <label style={{fontSize: 11, fontWeight: 'bold', color: '#b45309', display: 'flex', alignItems: 'center', gap: 6}}>
                  <Lock size={12} /> PIN Owner
                </label>
                <input type="password" value={pinInput} onChange={e => setPinInput(e.target.value)} style={styles.modalInput} placeholder="Masukkan PIN" required maxLength={6} />
              </div>

              <div style={{display: 'flex', gap: 8}}>
                <button type="button" onClick={() => setShowEdit(false)} style={{flex:1, padding:12, borderRadius:10, border:'1px solid #e2e8f0', background:'white', fontWeight:'bold'}}>Batal</button>
                <button type="submit" style={{flex:2, padding:12, borderRadius:10, border:'none', background:'#f59e0b', color:'white', fontWeight:'bold'}}><Save size={14} /> Update</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* === MODAL PIN UNTUK HAPUS === */}
      {showPinModal && (
        <div style={styles.modalOverlay} onClick={() => setShowPinModal(false)}>
          <div style={{...styles.modalContent, maxWidth: 350}} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 8}}>
                <Lock size={18} color="#ef4444" /> Konfirmasi Hapus
              </h3>
              <button onClick={() => setShowPinModal(false)} style={styles.closeBtn}><X size={18} /></button>
            </div>
            <p style={{fontSize: 13, color: '#64748b', marginBottom: 15}}>
              Masukkan PIN Owner untuk menghapus transaksi ini. <br/>
              <strong style={{color: '#ef4444'}}>⚠️ Tindakan ini tidak bisa dibatalkan!</strong>
            </p>
            <input 
              type="password" 
              value={pinInput} 
              onChange={e => setPinInput(e.target.value)} 
              style={styles.modalInput} 
              placeholder="******" 
              maxLength={6} 
              autoFocus 
            />
            <div style={{display: 'flex', gap: 8, marginTop: 10}}>
              <button onClick={() => setShowPinModal(false)} style={{flex:1, padding:12, borderRadius:10, border:'1px solid #e2e8f0', background:'white', fontWeight:'bold'}}>Batal</button>
              <button onClick={handleDelete} style={{flex:1, padding:12, borderRadius:10, border:'none', background:'#ef4444', color:'white', fontWeight:'bold'}}>
                <Trash2 size={14} /> Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// === STYLES ===
const styles = {
  filterBar: { display: 'flex', gap: 8, marginBottom: 15, flexWrap: 'wrap', alignItems: 'flex-end' },
  filterGroup: { flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 3 },
  filterLabel: { fontSize: 9, fontWeight: 'bold', color: '#94a3b8' },
  filterSelect: { padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12, background: 'white', width: '100%', boxSizing: 'border-box' },
  searchBox: { display: 'flex', alignItems: 'center', gap: 6, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white' },
  searchInput: { border: 'none', outline: 'none', width: '100%', fontSize: 12, background: 'transparent' },
  clearBtn: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 },
  btnExport: (color) => ({ padding: '10px 14px', borderRadius: 8, background: color, color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 11, whiteSpace: 'nowrap', alignSelf: 'flex-end' }),
  
  summaryRow: { display: 'flex', gap: 10, marginBottom: 15, flexWrap: 'wrap' },
  summaryCard: (bg, color) => ({ flex: 1, minWidth: 150, background: bg, padding: 14, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${color}30`, fontSize: 13 }),
  
  tableCard: { background: 'white', borderRadius: 14, padding: 15, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 700 },
  thr: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '10px 12px', fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', borderBottom: '2px solid #f1f5f9' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '10px 12px', fontSize: 12, verticalAlign: 'middle' },
  typeBadge: (type) => ({ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: type === 'Pemasukan' ? '#dcfce7' : '#fee2e2', color: type === 'Pemasukan' ? '#166534' : '#991b1b' }),
  methodBadge: (method) => ({ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 'bold', background: method === 'Tunai' ? '#fef3c7' : '#e0e7ff', color: method === 'Tunai' ? '#b45309' : '#3730a3' }),
  btnIcon: (color) => ({ background: `${color}15`, color, border: 'none', padding: '7px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' }),
  
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20, backdropFilter: 'blur(2px)' },
  modalContent: { background: 'white', borderRadius: 14, padding: 24, width: '100%', maxWidth: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  modalInput: { width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' },
  closeBtn: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }
};

export default TransactionHistory;