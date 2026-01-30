import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
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
  const [totalTunggakan, setTotalTunggakan] = useState(0);
  const [showSaldo, setShowSaldo] = useState(false);

  const fetchData = async () => {
    try {
      // AMBIL MUTASI
      const mutasiSnap = await getDocs(collection(db, "finance_mutasi"));
      const allMutasi = mutasiSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const filtered = allMutasi
        .filter(m => m.tanggal.startsWith(filterBulan))
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setMutasi(filtered);

      // HITUNG SALDO GLOBAL
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

      // AMBIL TAGIHAN
      const tagihanSnap = await getDocs(collection(db, "finance_tagihan"));
      const dataTagihan = tagihanSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTagihan(dataTagihan);
      const hitungTunggakan = dataTagihan.reduce((acc, curr) => acc + (curr.sisaTagihan || 0), 0);
      setTotalTunggakan(hitungTunggakan);

    } catch (error) { console.error("Error:", error); }
  };

  useEffect(() => { fetchData(); }, [filterBulan]);

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text(`Laporan Keuangan Bimbel Gemilang - Periode ${filterBulan}`, 14, 15);
      doc.autoTable({
        head: [['Tanggal', 'Keterangan', 'Metode', 'Arus', 'Nominal']],
        body: mutasi.map(m => [
          m.tanggal, m.ket, m.metode, m.tipe, `Rp ${parseInt(m.nominal).toLocaleString('id-ID')}`
        ]),
        startY: 20
      });
      doc.save(`Laporan_Keuangan_${filterBulan}.pdf`);
    } catch (error) { alert("Gagal download PDF."); }
  };

  const exportExcel = () => {
    try {
      const dataToExport = mutasi.map(m => ({
        Tanggal: m.tanggal, Keterangan: m.ket, Metode: m.metode, Tipe: m.tipe, Nominal: parseInt(m.nominal)
      }));
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([excelBuffer]), `Laporan_Keuangan_${filterBulan}.xlsx`);
    } catch (error) { alert("Gagal download Excel."); }
  };

  const handleEditTanggal = async (item, idx) => {
    const detail = [...item.detailCicilan];
    const cicil = detail[idx];
    const newDate = prompt(`Ubah Tanggal Jatuh Tempo (Format: YYYY-MM-DD):`, cicil.jatuhTempo || "");

    if (newDate) {
       detail[idx].jatuhTempo = newDate;
       await updateDoc(doc(db, "finance_tagihan", item.id), { detailCicilan: detail });
       alert("✅ Tanggal diperbarui!");
       fetchData();
    }
  };

  const handleBayarCicilan = async (item, idx) => {
    const detail = [...item.detailCicilan];
    const cicil = detail[idx];
    const metode = prompt(`Pembayaran Rp ${cicil.nominal.toLocaleString()} Masuk kemana?\n1. Tunai (Laci Kasir)\n2. Bank (Transfer Rekening)`, "1");
    if(!metode) return;
    const jenis = metode === "1" ? "Tunai" : "Bank";

    if(!window.confirm(`Terima pembayaran dari ${item.namaSiswa}?`)) return;

    detail[idx].status = "Lunas";
    detail[idx].tanggalBayar = new Date().toISOString().split('T')[0];
    const sisa = item.sisaTagihan - cicil.nominal;

    await updateDoc(doc(db, "finance_tagihan", item.id), { detailCicilan: detail, sisaTagihan: sisa });
    await addDoc(collection(db, "finance_mutasi"), {
      tanggal: new Date().toISOString().split('T')[0], ket: `Pelunasan Cicilan ${item.namaSiswa} (Ke-${cicil.bulanKe})`,
      tipe: "Masuk", metode: jenis, nominal: cicil.nominal, kategori: "Cicilan"
    });
    alert("✅ Pembayaran Berhasil Disimpan.");
    fetchData();
  };

  // --- SMART SECURITY: HAPUS MUTASI DENGAN CEK SERVER ---
  const handleDeleteMutasi = async (id) => {
    const pin = prompt("🔐 Masukkan PIN Owner:");
    
    try {
        // Ambil PIN Asli dari Firebase (Cloud), bukan LocalStorage!
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);
        
        let validPin = "2003"; // Default
        if (docSnap.exists() && docSnap.data().ownerPin) {
            validPin = docSnap.data().ownerPin;
        }

        if (pin === validPin) {
            await deleteDoc(doc(db, "finance_mutasi", id));
            alert("Data dihapus.");
            fetchData();
        } else {
            alert("⛔ PIN SALAH! Akses Ditolak Server.");
        }
    } catch (error) {
        console.error("Error cek PIN:", error);
        alert("Gagal verifikasi PIN ke server.");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0, color:'#333'}}>📊 Keuangan & Laporan</h2>
            <p style={{margin:0, fontSize:12, color:'#555'}}>Data Aman (Cloud Sync)</p>
          </div>
          <div>
             <label style={{fontSize:12, color:'#333', display:'block'}}>Periode Laporan:</label>
             <input type="month" value={filterBulan} onChange={e => setFilterBulan(e.target.value)} style={styles.inputDate} />
          </div>
        </div>

        <div style={styles.saldoGrid}>
            <div style={{...styles.saldoCard, borderLeft: '5px solid #2c3e50'}}>
              <div style={styles.cardHeader}>
                <small style={{color:'#333', fontWeight:'bold'}}>TOTAL ASET</small>
                <button onClick={() => setShowSaldo(!showSaldo)} style={styles.btnEye}>{showSaldo ? '👁️' : '🙈'}</button>
              </div>
              <h2 style={{...styles.moneyText, color: '#2c3e50'}}>{showSaldo ? `Rp ${(saldo.tunai + saldo.bank).toLocaleString('id-ID')}` : 'Rp **********'}</h2>
            </div>
            <div style={{...styles.saldoCard, borderLeft: '5px solid #27ae60'}}>
              <small style={{color:'#333'}}>Saldo Tunai</small>
              <h2 style={{...styles.moneyText, color: '#27ae60'}}>{showSaldo ? `Rp ${saldo.tunai.toLocaleString('id-ID')}` : 'Rp *******'}</h2>
            </div>
            <div style={{...styles.saldoCard, borderLeft: '5px solid #2980b9'}}>
              <small style={{color:'#333'}}>Saldo Bank</small>
              <h2 style={{...styles.moneyText, color: '#2980b9'}}>{showSaldo ? `Rp ${saldo.bank.toLocaleString('id-ID')}` : 'Rp *******'}</h2>
            </div>
            <div style={{...styles.saldoCard, borderLeft: '5px solid #c0392b', background: '#fff5f5'}}>
              <small style={{color:'#c0392b', fontWeight:'bold'}}>Total Tunggakan</small>
              <h2 style={{...styles.moneyText, color: '#c0392b'}}>Rp {totalTunggakan.toLocaleString('id-ID')}</h2>
            </div>
        </div>

        <div style={styles.tabs}>
          <button style={activeTab === 'mutasi' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('mutasi')}>📑 Data Mutasi</button>
          <button style={activeTab === 'tagihan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('tagihan')}>📝 Tagihan Cicilan</button>
        </div>

        {activeTab === 'mutasi' && (
          <div style={styles.card}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
              <h3 style={{color: '#000', margin:0}}>Mutasi Bulan Ini</h3>
              <div style={{display:'flex', gap:10}}>
                <button onClick={exportPDF} style={styles.btnPdf}>📄 PDF</button>
                <button onClick={exportExcel} style={styles.btnExcel}>📗 Excel</button>
              </div>
            </div>
            <table style={styles.table}>
              <thead>
                <tr style={{background:'#f1f2f6', color:'#000'}}>
                  <th style={{padding:12}}>Tanggal</th><th>Keterangan</th><th>Tempat</th><th>Arus</th><th>Nominal</th><th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {mutasi.map(m => (
                  <tr key={m.id} style={{borderBottom:'1px solid #eee', color:'#000'}}>
                    <td style={{padding:12}}>{m.tanggal}</td>
                    <td>{m.ket}</td>
                    <td><span style={styles.badge}>{m.metode}</span></td>
                    <td style={{fontWeight:'bold', color: m.tipe === 'Masuk' ? 'green' : 'red'}}>{m.tipe === 'Masuk' ? '+ Masuk' : '- Keluar'}</td>
                    <td style={{fontWeight:'bold'}}>Rp {parseInt(m.nominal).toLocaleString('id-ID')}</td>
                    <td><button onClick={() => handleDeleteMutasi(m.id)} style={styles.btnDel}>Hapus</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tagihan' && (
          <div style={styles.card}>
            <h3 style={{color: '#000', marginBottom: 20}}>Daftar Siswa Cicilan Aktif</h3>
            {tagihan.map(item => (
              <div key={item.id} style={styles.billCard}>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:10, marginBottom:10}}>
                  <div>
                    <b style={{fontSize:16, color:'#000'}}>{item.namaSiswa}</b> 
                    <div style={{fontSize:13, color:'#555'}}>HP: {item.noHp}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:12, color:'#555'}}>Sisa Tunggakan</div>
                    <b style={{color:'#c0392b', fontSize:18}}>Rp {item.sisaTagihan.toLocaleString()}</b>
                  </div>
                </div>
                <div style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:5}}>
                  {item.detailCicilan.map((c, i) => (
                    <div key={i} style={c.status === 'Lunas' ? styles.cDone : styles.cPending}>
                      <div style={{fontSize:12, fontWeight:'bold', color:'#000'}}>Cicilan {c.bulanKe}</div>
                      <div style={{fontSize:11, color:'#555', marginBottom:5}}>{c.jatuhTempo || '-'}</div>
                      <div style={{fontSize:14, fontWeight:'bold', color:'#000', marginBottom:5}}>Rp {c.nominal.toLocaleString()}</div>
                      {c.status === 'Lunas' ? <div style={{color:'green', fontSize:12}}>✅ Lunas</div> : 
                        <div style={{display:'flex', gap:5}}>
                            <button onClick={() => handleEditTanggal(item, i)} style={styles.btnEdit}>📅</button>
                            <button onClick={() => handleBayarCicilan(item, i)} style={styles.btnPay}>Bayar</button>
                        </div>}
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

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  inputDate: { padding:'8px', borderRadius:5, border:'1px solid #ccc', fontWeight:'bold', color:'#000', background:'white' },
  saldoGrid: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, marginBottom:25 },
  saldoCard: { background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', color: '#000' },
  cardHeader: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  moneyText: { fontSize: 24, margin: '10px 0', fontWeight: 'bold' },
  btnEye: { background:'none', border:'none', fontSize:20, cursor:'pointer', padding:0 },
  tabs: { marginBottom:20 },
  tab: { padding:'10px 25px', border:'none', background:'#e0e0e0', marginRight:5, borderRadius:'5px 5px 0 0', cursor:'pointer', color:'#555', fontWeight:'bold' },
  tabActive: { padding:'10px 25px', border:'none', background:'white', marginRight:5, borderRadius:'5px 5px 0 0', fontWeight:'bold', cursor:'pointer', color:'#000', boxShadow:'0 -2px 5px rgba(0,0,0,0.1)' },
  card: { background:'white', padding:25, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', color:'#000' },
  table: { width:'100%', borderCollapse:'collapse', color:'#000' },
  badge: { background:'#e1f5fe', padding:'3px 8px', borderRadius:4, fontSize:12, color:'#0277bd', fontWeight:'bold' },
  btnPdf: { background:'#e74c3c', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', fontSize:14, boxShadow:'0 2px 4px rgba(0,0,0,0.2)' },
  btnExcel: { background:'#27ae60', color:'white', border:'none', padding:'10px 20px', borderRadius:5, cursor:'pointer', fontWeight:'bold', fontSize:14, boxShadow:'0 2px 4px rgba(0,0,0,0.2)' },
  btnDel: { color:'red', background:'white', border:'1px solid red', padding:'4px 10px', borderRadius:4, cursor:'pointer' },
  billCard: { border:'1px solid #ddd', padding:20, borderRadius:8, marginBottom:20, background:'white', color:'#000' },
  cPending: { background:'white', border:'1px solid #bbb', padding:10, borderRadius:5, minWidth:130, color:'#000' },
  cDone: { background:'#e8f5e9', border:'1px solid #c8e6c9', padding:10, borderRadius:5, minWidth:130, opacity:0.8, color:'#000' },
  btnPay: { background:'#2980b9', color:'white', border:'none', padding:'5px', borderRadius:4, cursor:'pointer', flex:1, fontWeight:'bold' },
  btnEdit: { background:'#f39c12', color:'white', border:'none', padding:'5px', borderRadius:4, cursor:'pointer' }
};

export default FinanceDashboard;