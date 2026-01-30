import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
// FIREBASE
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
// LIBRARY EXPORT
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('mutasi'); 
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [mutasi, setMutasi] = useState([]); 
  const [tagihan, setTagihan] = useState([]); 
  const [saldo, setSaldo] = useState({ tunai: 0, bank: 0 });
  const [totalTunggakan, setTotalTunggakan] = useState(0); // State baru untuk total tunggakan
  
  // State untuk Fitur Intip Saldo (Privasi)
  const [showSaldo, setShowSaldo] = useState(false); 

  // --- 1. AMBIL DATA DARI FIREBASE ---
  const fetchData = async () => {
    try {
      // A. AMBIL DATA MUTASI
      const mutasiSnap = await getDocs(collection(db, "finance_mutasi"));
      const allMutasi = mutasiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = allMutasi
        .filter(m => m.tanggal.startsWith(filterBulan))
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      
      setMutasi(filtered);

      // B. HITUNG SALDO GLOBAL & TOTAL ASET
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

      // C. AMBIL DATA TAGIHAN & HITUNG TOTAL TUNGGAKAN
      const tagihanSnap = await getDocs(collection(db, "finance_tagihan"));
      const dataTagihan = tagihanSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setTagihan(dataTagihan);

      // Hitung Total Uang yang belum dibayar siswa
      const hitungTunggakan = dataTagihan.reduce((acc, curr) => acc + (curr.sisaTagihan || 0), 0);
      setTotalTunggakan(hitungTunggakan);

    } catch (error) { 
      console.error("Error fetch data:", error); 
    }
  };

  useEffect(() => { fetchData(); }, [filterBulan]);

  // --- 2. EXPORT PDF ---
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

  // --- 3. EXPORT EXCEL ---
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

  // --- 4. EDIT TANGGAL CICILAN (Fitur Baru) ---
  const handleEditTanggal = async (item, idx) => {
    const detail = [...item.detailCicilan];
    const cicil = detail[idx];
    
    // Tampilkan tanggal saat ini atau minta input baru
    const currentDate = cicil.jatuhTempo || "";
    const newDate = prompt(`Ubah Tanggal Jatuh Tempo untuk cicilan ke-${cicil.bulanKe} (Format: YYYY-MM-DD):`, currentDate);

    if (newDate) {
       detail[idx].jatuhTempo = newDate;
       // Simpan ke Firebase
       await updateDoc(doc(db, "finance_tagihan", item.id), { detailCicilan: detail });
       alert("✅ Tanggal jatuh tempo berhasil diperbarui!");
       fetchData();
    }
  };

  // --- 5. BAYAR CICILAN ---
  const handleBayarCicilan = async (item, idx) => {
    const detail = [...item.detailCicilan];
    const cicil = detail[idx];
    
    // Konfirmasi Metode Bayar
    const metode = prompt(`Pembayaran Rp ${cicil.nominal.toLocaleString()} Masuk kemana?\n1. Tunai (Laci Kasir)\n2. Bank (Transfer Rekening)`, "1");
    if(!metode) return;
    
    const jenis = metode === "1" ? "Tunai" : "Bank";
    const tempat = metode === "1" ? "Laci Kasir" : "Rekening Bank";

    if(!window.confirm(`Konfirmasi pembayaran dari ${item.namaSiswa}?\n\nNominal: Rp ${cicil.nominal.toLocaleString()}\nMasuk ke: ${tempat}`)) return;

    // Update Status Tagihan
    detail[idx].status = "Lunas";
    detail[idx].tanggalBayar = new Date().toISOString().split('T')[0];
    const sisa = item.sisaTagihan - cicil.nominal;

    await updateDoc(doc(db, "finance_tagihan", item.id), { detailCicilan: detail, sisaTagihan: sisa });

    // Catat Mutasi
    await addDoc(collection(db, "finance_mutasi"), {
      tanggal: new Date().toISOString().split('T')[0],
      ket: `Pelunasan Cicilan ${item.namaSiswa} (Ke-${cicil.bulanKe})`,
      tipe: "Masuk",
      metode: jenis,
      nominal: cicil.nominal,
      kategori: "Cicilan"
    });

    alert("✅ Pembayaran Berhasil Disimpan.");
    fetchData();
  };

  // --- 6. HAPUS MUTASI ---
  const handleDeleteMutasi = async (id) => {
    const pin = prompt("🔐 Masukkan PIN Owner:");
    const validPin = localStorage.getItem("ownerPin") || "2003"; // Default PIN
    
    if (pin === validPin) {
      await deleteDoc(doc(db, "finance_mutasi", id));
      alert("Data dihapus.");
      fetchData();
    } else {
      alert("⛔ PIN SALAH!");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0, color: '#2c3e50'}}>📊 Keuangan Bimbel Gemilang</h2>
            <p style={{margin:0, fontSize:12, color:'#555'}}>Kelola arus kas & tagihan siswa</p>
          </div>
          <div style={{textAlign:'right'}}>
             <button onClick={() => setShowSaldo(!showSaldo)} style={styles.btnPrivacy}>
                {showSaldo ? '👁️ Sembunyikan Saldo' : '🔒 Intip Saldo'}
             </button>
             <div style={{marginTop: 5}}>
                <label style={{fontSize:12, color:'#333'}}>Periode: </label>
                <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={styles.inputDate} />
             </div>
          </div>
        </div>

        {/* INFO SALDO (DIPERBARUI) */}
        <div style={styles.saldoGrid}>
            {/* Total Aset */}
            <div style={{...styles.saldoCard, borderLeft: '4px solid #2c3e50'}}>
            <small style={{color:'#333'}}>Total Aset (Cash + Bank)</small>
            <h2 style={showSaldo ? styles.saldoText : styles.saldoBlur}>
                Rp {(saldo.tunai + saldo.bank).toLocaleString('id-ID')}
            </h2>
            <small style={{fontSize:10, color:'#555'}}>Kekayaan bersih saat ini</small>
          </div>

          {/* Rincian Cash & Bank */}
          <div style={{...styles.saldoCard, borderLeft: '4px solid #27ae60'}}>
            <small style={{color:'#333'}}>Saldo Tunai (Laci)</small>
            <h2 style={{... (showSaldo ? styles.saldoText : styles.saldoBlur), color:'#27ae60'}}>
                Rp {saldo.tunai.toLocaleString('id-ID')}
            </h2>
          </div>
          
          <div style={{...styles.saldoCard, borderLeft: '4px solid #2980b9'}}>
            <small style={{color:'#333'}}>Saldo Bank</small>
            <h2 style={{... (showSaldo ? styles.saldoText : styles.saldoBlur), color:'#2980b9'}}>
                Rp {saldo.bank.toLocaleString('id-ID')}
            </h2>
          </div>

          {/* Total Tunggakan (BARU) */}
          <div style={{...styles.saldoCard, borderLeft: '4px solid #c0392b', background: '#fff5f5'}}>
            <small style={{color:'#c0392b', fontWeight:'bold'}}>Total Tunggakan Siswa</small>
            <h2 style={{... (showSaldo ? styles.saldoText : styles.saldoBlur), color:'#c0392b'}}>
                Rp {totalTunggakan.toLocaleString('id-ID')}
            </h2>
            <small style={{fontSize:10, color:'#c0392b'}}>Uang yang belum masuk</small>
          </div>
        </div>

        {/* NAVIGASI TAB */}
        <div style={styles.tabs}>
          <button style={activeTab === 'mutasi' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('mutasi')}>📑 Data Mutasi</button>
          <button style={activeTab === 'tagihan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('tagihan')}>📝 Tagihan Cicilan</button>
        </div>

        {/* TAB MUTASI */}
        {activeTab === 'mutasi' && (
          <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
              <h3 style={{color: '#333'}}>Riwayat Transaksi: {filterBulan}</h3>
              <div style={{display:'flex', gap:10}}>
                <button onClick={exportPDF} style={styles.btnPdf}>📄 PDF</button>
                <button onClick={exportExcel} style={styles.btnExcel}>📗 Excel</button>
              </div>
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr style={{background:'#f1f2f6', textAlign:'left', color:'#333'}}>
                  <th style={{padding:12}}>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Tempat</th>
                  <th>Arus</th>
                  <th>Nominal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign:'center', padding:20, color:'#555'}}>Tidak ada data.</td></tr>
                )}
                {mutasi.map(m => (
                  <tr key={m.id} style={{borderBottom:'1px solid #eee', color: '#333'}}>
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
            <h3 style={{color: '#333', marginBottom: 20}}>Daftar Siswa Cicilan Aktif</h3>
            {tagihan.length === 0 && <p style={{color:'#555', padding:10}}>Tidak ada siswa yang sedang mencicil.</p>}
            
            {tagihan.map(item => (
              <div key={item.id} style={styles.billCard}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:10, borderBottom:'1px solid #eee', paddingBottom:5}}>
                  <div>
                    <b style={{fontSize:16, color:'#333'}}>{item.namaSiswa}</b> 
                    <div style={{fontSize:12, color:'#555'}}>Ortu: {item.namaOrtu || '-'} | HP: {item.noHp || '-'}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12, color:'#555'}}>Sisa Tunggakan</div>
                    <b style={{color:'#c0392b', fontSize:16}}>Rp {item.sisaTagihan.toLocaleString()}</b>
                  </div>
                </div>
                
                {/* DETAIL BULANAN */}
                <div style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:10}}>
                  {item.detailCicilan.map((c, i) => (
                    <div key={i} style={c.status === 'Lunas' ? styles.cDone : styles.cPending}>
                      <div style={{fontSize:12, fontWeight:'bold', color:'#333'}}>Cicilan Ke-{c.bulanKe}</div>
                      
                      {/* TAMPILKAN TANGGAL JATUH TEMPO */}
                      <div style={{fontSize:11, color:'#666', marginBottom: 5}}>
                         {c.jatuhTempo ? `Jatuh Tempo: ${c.jatuhTempo}` : 'Tgl Belum Diatur'}
                      </div>
                      
                      <div style={{margin:'5px 0', fontSize:14, fontWeight:'bold', color:'#333'}}>
                        Rp {c.nominal.toLocaleString()}
                      </div>

                      {c.status === 'Lunas' ? (
                        <div style={{fontSize:11, color:'green', fontWeight:'bold'}}>✅ Lunas</div>
                      ) : (
                        <div style={{display:'flex', gap:5, marginTop:5}}>
                            <button onClick={() => handleEditTanggal(item, i)} style={styles.btnEditDate} title="Edit Tanggal">📅</button>
                            <button onClick={() => handleBayarCicilan(item, i)} style={styles.btnPay}>Bayar</button>
                        </div>
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

// --- STYLING PROFESIONAL (Kontras Diperbaiki) ---
const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  inputDate: { padding:'5px 10px', borderRadius:5, border:'1px solid #ccc', fontWeight:'bold', color: '#333', background:'white' },
  
  btnPrivacy: { background: 'none', border:'none', cursor:'pointer', color:'#2980b9', fontSize:13, fontWeight:'bold' },

  saldoGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:20, marginBottom:25 },
  saldoCard: { background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  saldoText: { margin:'5px 0', fontSize: 22 },
  saldoBlur: { margin:'5px 0', fontSize: 22, filter: 'blur(8px)', userSelect:'none' },

  tabs: { marginBottom:20 },
  tab: { padding:'10px 25px', border:'none', background:'#e0e0e0', marginRight:5, borderRadius:'5px 5px 0 0', cursor:'pointer', color:'#555', fontWeight:'bold' },
  tabActive: { padding:'10px 25px', border:'none', background:'white', marginRight:5, borderRadius:'5px 5px 0 0', fontWeight:'bold', cursor:'pointer', color:'#2c3e50', boxShadow:'0 -2px 5px rgba(0,0,0,0.05)' },
  
  card: { background:'white', padding:25, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', color: '#333' },
  table: { width:'100%', borderCollapse:'collapse', color: '#333' },
  
  tagTunai: { background:'#fff3cd', color:'#856404', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold', border:'1px solid #ffeeba' },
  tagBank: { background:'#d1ecf1', color:'#0c5460', padding:'4px 8px', borderRadius:4, fontSize:11, fontWeight:'bold', border:'1px solid #bee5eb' },
  
  btnPdf: { background:'#e74c3c', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', fontSize:13, fontWeight:'bold' },
  btnExcel: { background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', fontSize:13, fontWeight:'bold' },
  btnDel: { color:'#c0392b', background:'white', border:'1px solid #c0392b', padding:'4px 10px', borderRadius:4, cursor:'pointer', fontSize:11 },
  
  billCard: { border:'1px solid #ddd', padding:15, borderRadius:8, marginBottom:15, background:'#fff' },
  cPending: { background:'#fff', border:'1px solid #ccc', padding:10, borderRadius:5, textAlign:'center', minWidth:120 },
  cDone: { background:'#d4edda', border:'1px solid #c3e6cb', padding:10, borderRadius:5, textAlign:'center', minWidth:120, opacity:0.8 },
  
  btnPay: { background:'#2980b9', color:'white', border:'none', padding:'5px 15px', borderRadius:3, cursor:'pointer', fontSize:12, fontWeight:'bold', flex: 1 },
  btnEditDate: { background:'#f39c12', color:'white', border:'none', padding:'5px', borderRadius:3, cursor:'pointer', fontSize:12 }
};

export default FinanceDashboard;