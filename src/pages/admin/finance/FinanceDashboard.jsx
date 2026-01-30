import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
// FIREBASE
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
// LIBRARY EXPORT (Wajib install: npm install jspdf jspdf-autotable xlsx file-saver)
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('mutasi'); 
  // Default filter: Bulan Ini (Format YYYY-MM)
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [mutasi, setMutasi] = useState([]); // Data Transaksi Real
  const [tagihan, setTagihan] = useState([]); // Data Piutang
  const [saldo, setSaldo] = useState({ tunai: 0, bank: 0 });

  // --- 1. AMBIL DATA DARI FIREBASE (SMART LOGIC) ---
  const fetchData = async () => {
    try {
      // A. AMBIL DATA MUTASI (Dari folder khusus 'finance_mutasi')
      const mutasiSnap = await getDocs(collection(db, "finance_mutasi"));
      const allMutasi = mutasiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter Sesuai Bulan Yang Dipilih & Urutkan Tanggal Terbaru
      const filtered = allMutasi
        .filter(m => m.tanggal.startsWith(filterBulan))
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      
      setMutasi(filtered);

      // B. HITUNG SALDO GLOBAL (Dari SEMUA data, bukan cuma yang difilter)
      let kasTunai = 0, kasBank = 0;
      allMutasi.forEach(m => {
        const nom = parseInt(m.nominal);
        if(m.tipe === 'Masuk') {
          m.metode === 'Tunai' ? kasTunai += nom : kasBank += nom;
        } else {
          m.metode === 'Tunai' ? kasTunai -= nom : kasBank -= nom;
        }
      });
      setSaldo({ tunai: kasTunai, bank: kasBank });

      // C. AMBIL DATA TAGIHAN
      const tagihanSnap = await getDocs(collection(db, "finance_tagihan"));
      setTagihan(tagihanSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) { 
      console.error("Error fetch data:", error); 
    }
  };

  useEffect(() => { fetchData(); }, [filterBulan]);

  // --- 2. FITUR EXPORT PDF (Rapi & Resmi) ---
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Laporan Keuangan Bimbel Gemilang - Periode ${filterBulan}`, 14, 15);
    doc.autoTable({
      head: [['Tanggal', 'Keterangan', 'Metode', 'Arus', 'Nominal']],
      body: mutasi.map(m => [
        m.tanggal, 
        m.ket, 
        m.metode, 
        m.tipe, 
        `Rp ${parseInt(m.nominal).toLocaleString('id-ID')}`
      ]),
      startY: 20
    });
    doc.save(`Laporan_Keuangan_${filterBulan}.pdf`);
  };

  // --- 3. FITUR EXPORT EXCEL (Bisa diedit) ---
  const exportExcel = () => {
    const dataToExport = mutasi.map(m => ({
      Tanggal: m.tanggal,
      Keterangan: m.ket,
      Metode_Bayar: m.metode,
      Tipe_Transaksi: m.tipe,
      Nominal: parseInt(m.nominal)
    }));
    
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([excelBuffer]), `Laporan_Keuangan_${filterBulan}.xlsx`);
  };

  // --- 4. BAYAR CICILAN ---
  const handleBayarCicilan = async (item, idx) => {
    const detail = [...item.detailCicilan];
    const cicil = detail[idx];
    
    // Konfirmasi Metode Bayar
    const metode = prompt(`Pembayaran Cicilan Bulan ke-${cicil.bulanKe} via apa?\n1. Tunai (Masuk Brankas)\n2. Bank (Transfer)`, "1");
    if(!metode) return;
    const jenis = metode === "1" ? "Tunai" : "Bank";

    if(!window.confirm(`Konfirmasi terima pembayaran Rp ${cicil.nominal.toLocaleString()} via ${jenis}?`)) return;

    // Update Status Tagihan di Firebase
    detail[idx].status = "Lunas";
    detail[idx].tanggalBayar = new Date().toISOString().split('T')[0];
    const sisa = item.sisaTagihan - cicil.nominal;

    await updateDoc(doc(db, "finance_tagihan", item.id), { detailCicilan: detail, sisaTagihan: sisa });

    // PENTING: Catat ke Mutasi agar masuk Laporan & Saldo
    await addDoc(collection(db, "finance_mutasi"), {
      tanggal: new Date().toISOString().split('T')[0],
      ket: `Pelunasan Cicilan ${item.namaSiswa} (Bulan ${cicil.bulanKe})`,
      tipe: "Masuk",
      metode: jenis,
      nominal: cicil.nominal,
      kategori: "Cicilan"
    });

    alert("✅ Pembayaran Berhasil & Masuk Laporan Mutasi.");
    fetchData();
  };

  // --- 5. HAPUS MUTASI (Proteksi PIN Owner) ---
  const handleDeleteMutasi = async (id) => {
    const pin = prompt("🔐 Masukkan PIN Owner untuk menghapus data permanen:");
    // Ambil PIN dari LocalStorage (diset di menu Setting), default 2003
    const validPin = localStorage.getItem("ownerPin") || "2003";
    
    if (pin === validPin) {
      await deleteDoc(doc(db, "finance_mutasi", id));
      alert("Data berhasil dihapus.");
      fetchData();
    } else {
      alert("⛔ PIN SALAH! Akses ditolak.");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0}}>📊 Laporan Keuangan & Mutasi</h2>
            <p style={{margin:0, fontSize:12, color:'#777'}}>Data tersimpan aman di Database Cloud</p>
          </div>
          {/* Filter Bulan */}
          <div>
            <label style={{fontSize:12, display:'block'}}>Periode Laporan:</label>
            <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={styles.inputDate} />
          </div>
        </div>

        {/* INFO SALDO (Pemisahan Jelas) */}
        <div style={styles.saldoGrid}>
          <div style={styles.saldoCard}>
            <small>Saldo Tunai (Brankas)</small>
            <h2 style={{color:'#27ae60', margin:'5px 0'}}>Rp {saldo.tunai.toLocaleString('id-ID')}</h2>
            <small style={{fontSize:10, color:'#777'}}>Uang Fisik</small>
          </div>
          <div style={styles.saldoCard}>
            <small>Saldo Bank (Transfer)</small>
            <h2 style={{color:'#2980b9', margin:'5px 0'}}>Rp {saldo.bank.toLocaleString('id-ID')}</h2>
            <small style={{fontSize:10, color:'#777'}}>Rekening</small>
          </div>
        </div>

        <div style={styles.tabs}>
          <button style={activeTab === 'mutasi' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('mutasi')}>📑 Data Mutasi</button>
          <button style={activeTab === 'tagihan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('tagihan')}>📝 Tagihan Cicilan</button>
        </div>

        {/* TAB MUTASI */}
        {activeTab === 'mutasi' && (
          <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
              <h3>Mutasi: {filterBulan}</h3>
              <div style={{display:'flex', gap:10}}>
                <button onClick={exportPDF} style={styles.btnPdf}>📄 Download PDF</button>
                <button onClick={exportExcel} style={styles.btnExcel}>📗 Download Excel</button>
              </div>
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr style={{background:'#f8f9fa', textAlign:'left', color:'#555'}}>
                  <th style={{padding:12}}>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Metode</th>
                  <th>Arus</th>
                  <th>Nominal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center', padding:20, color:'#999'}}>Tidak ada data di bulan ini.</td></tr>
                )}
                {mutasi.map(m => (
                  <tr key={m.id} style={{borderBottom:'1px solid #f0f0f0'}}>
                    <td style={{padding:12}}>{m.tanggal}</td>
                    <td>{m.ket}</td>
                    <td>
                      <span style={m.metode === 'Tunai' ? styles.tagTunai : styles.tagBank}>
                        {m.metode}
                      </span>
                    </td>
                    <td style={{fontWeight:'bold', color: m.tipe === 'Masuk' ? '#27ae60' : '#c0392b'}}>
                      {m.tipe === 'Masuk' ? '↗ Masuk' : '↘ Keluar'}
                    </td>
                    <td style={{fontWeight:'bold'}}>Rp {parseInt(m.nominal).toLocaleString('id-ID')}</td>
                    <td>
                      <button onClick={() => handleDeleteMutasi(m.id)} style={styles.btnDel}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB TAGIHAN */}
        {activeTab === 'tagihan' && (
          <div style={styles.card}>
            <h3>Daftar Piutang Siswa (Cicilan Aktif)</h3>
            {tagihan.length === 0 && <p style={{color:'#999', padding:10}}>Tidak ada siswa yang sedang mencicil.</p>}
            
            {tagihan.map(item => (
              <div key={item.id} style={styles.billCard}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:10, borderBottom:'1px solid #eee', paddingBottom:5}}>
                  <div>
                    <b style={{fontSize:16}}>{item.namaSiswa}</b> 
                    <div style={{fontSize:12, color:'#666'}}>Ortu: {item.namaOrtu} | HP: {item.noHp}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12, color:'#666'}}>Sisa Tagihan</div>
                    <b style={{color:'#c0392b', fontSize:16}}>Rp {item.sisaTagihan.toLocaleString()}</b>
                  </div>
                </div>
                
                {/* DETAIL BULANAN */}
                <div style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:5}}>
                  {item.detailCicilan.map((c, i) => (
                    <div key={i} style={c.status === 'Lunas' ? styles.cDone : styles.cPending}>
                      <div style={{fontSize:11, fontWeight:'bold'}}>Bulan {c.bulanKe}</div>
                      <div style={{margin:'5px 0'}}>Rp {c.nominal.toLocaleString()}</div>
                      {c.status === 'Lunas' ? (
                        <div style={{fontSize:10, color:'green'}}>✅ Lunas</div>
                      ) : (
                        <button onClick={() => handleBayarCicilan(item, i)} style={styles.btnPay}>Bayar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

// --- STYLING PROFESIONAL ---
const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  inputDate: { padding:'8px 12px', borderRadius:5, border:'1px solid #ccc', fontWeight:'bold' },
  
  saldoGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:25 },
  saldoCard: { background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', borderLeft:'4px solid #ddd' },
  
  tabs: { marginBottom:20 },
  tab: { padding:'10px 25px', border:'none', background:'#e0e0e0', marginRight:5, borderRadius:'5px 5px 0 0', cursor:'pointer', color:'#555' },
  tabActive: { padding:'10px 25px', border:'none', background:'white', marginRight:5, borderRadius:'5px 5px 0 0', fontWeight:'bold', cursor:'pointer', color:'#2c3e50', boxShadow:'0 -2px 5px rgba(0,0,0,0.05)' },
  
  card: { background:'white', padding:25, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  table: { width:'100%', borderCollapse:'collapse' },
  
  tagTunai: { background:'#fff3cd', color:'#856404', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold', border:'1px solid #ffeeba' },
  tagBank: { background:'#d1ecf1', color:'#0c5460', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold', border:'1px solid #bee5eb' },
  
  btnPdf: { background:'#e74c3c', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', fontSize:13, fontWeight:'bold' },
  btnExcel: { background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', fontSize:13, fontWeight:'bold' },
  
  btnDel: { color:'#c0392b', background:'white', border:'1px solid #c0392b', padding:'4px 10px', borderRadius:4, cursor:'pointer', fontSize:11 },
  
  billCard: { border:'1px solid #eee', padding:15, borderRadius:8, marginBottom:15, background:'#fafafa' },
  cPending: { background:'white', border:'1px solid #ddd', padding:10, borderRadius:5, textAlign:'center', minWidth:80 },
  cDone: { background:'#d4edda', border:'1px solid #c3e6cb', padding:10, borderRadius:5, textAlign:'center', minWidth:80, opacity:0.8 },
  btnPay: { background:'#2980b9', color:'white', border:'none', padding:'4px 10px', borderRadius:3, cursor:'pointer', fontSize:11, marginTop:5 }
};

export default FinanceDashboard;