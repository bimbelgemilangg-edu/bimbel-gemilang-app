import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
// FIREBASE
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('laporan'); // laporan | tagihan | catat
  
  // STATE FILTER WAKTU
  const [filterBulan, setFilterBulan] = useState(new Date().toISOString().slice(0, 7)); // Default: Bulan Ini (YYYY-MM)

  // STATE DATA
  const [transaksi, setTransaksi] = useState([]); // Data Uang Masuk/Keluar
  const [tagihan, setTagihan] = useState([]);     // Data Cicilan Siswa
  
  // STATE SALDO
  const [saldo, setSaldo] = useState({ tunai: 0, bank: 0, total: 0 });

  // --- 1. SMART FETCH DATA (BERDASARKAN BULAN) ---
  const fetchData = async () => {
    try {
      // A. AMBIL TRANSAKSI (Laporan Keuangan)
      // Kita ambil semua dulu lalu filter di client (Firebase free limitasi sorting)
      const trxSnap = await getDocs(collection(db, "finance_transaksi"));
      const allTrx = trxSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Filter Sesuai Bulan Yang Dipilih Admin
      const filteredTrx = allTrx.filter(item => item.tanggal.startsWith(filterBulan));
      
      // Urutkan dari tanggal terbaru
      filteredTrx.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
      setTransaksi(filteredTrx);

      // B. HITUNG SALDO (Tunai vs Bank)
      // Hitung dari SEMUA transaksi (bukan cuma bulan ini) untuk saldo akurat
      let kasTunai = 0;
      let kasBank = 0;
      
      allTrx.forEach(t => {
        const nominal = parseInt(t.nominal);
        if (t.tipe === 'Masuk') {
          if (t.metode === 'Tunai') kasTunai += nominal;
          else kasBank += nominal;
        } else {
          // Pengeluaran
          if (t.metode === 'Tunai') kasTunai -= nominal;
          else kasBank -= nominal;
        }
      });

      setSaldo({ tunai: kasTunai, bank: kasBank, total: kasTunai + kasBank });

      // C. AMBIL TAGIHAN (Cicilan Aktif)
      const tagihanSnap = await getDocs(collection(db, "finance_tagihan"));
      setTagihan(tagihanSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    } catch (error) {
      console.error("Gagal ambil data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterBulan]); // Refresh jika bulan diganti

  // --- 2. FITUR BAYAR CICILAN ---
  const handleBayarCicilan = async (tagihanData, indexCicilan) => {
    const detail = [...tagihanData.detailCicilan];
    const itemCicilan = detail[indexCicilan];
    
    // Konfirmasi Metode Pembayaran
    const metode = prompt("Pembayaran via apa?\nKetik 1 untuk TUNAI (Masuk Brankas)\nKetik 2 untuk BANK (Transfer)", "1");
    if (!metode) return;

    const jenisBayar = metode === "1" ? "Tunai" : "Bank";

    if (!window.confirm(`Terima Rp ${itemCicilan.nominal.toLocaleString()} via ${jenisBayar}?`)) return;

    // Update Status Cicilan
    detail[indexCicilan].status = "Lunas";
    detail[indexCicilan].tanggalBayar = new Date().toISOString().split('T')[0];
    detail[indexCicilan].metodeBayar = jenisBayar;

    const sisaBaru = tagihanData.sisaTagihan - itemCicilan.nominal;

    // Update Tagihan di Firebase
    await updateDoc(doc(db, "finance_tagihan", tagihanData.id), {
      detailCicilan: detail,
      sisaTagihan: sisaBaru
    });

    // CATAT KE LAPORAN KEUANGAN (Penting!)
    await addDoc(collection(db, "finance_transaksi"), {
      tanggal: new Date().toISOString().split('T')[0], // Tanggal Hari Ini (Saat Pelunasan)
      ket: `Pelunasan Cicilan: ${tagihanData.namaSiswa} (Bulan ${itemCicilan.bulanKe})`,
      tipe: "Masuk",
      metode: jenisBayar,
      nominal: itemCicilan.nominal,
      kategori: "SPP"
    });

    alert("✅ Pembayaran Diterima & Masuk Laporan Keuangan!");
    fetchData();
  };

  // --- 3. CATAT PENGELUARAN MANUAL ---
  const [catat, setCatat] = useState({ ket: "", nominal: "", metode: "Tunai", tanggal: new Date().toISOString().split('T')[0] });
  
  const handleSimpanManual = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "finance_transaksi"), {
      tanggal: catat.tanggal, // Admin bisa set tanggal mundur
      ket: catat.ket,
      tipe: "Keluar",
      metode: catat.metode,
      nominal: parseInt(catat.nominal),
      kategori: "Operasional"
    });
    alert("✅ Pengeluaran Tercatat!");
    setCatat({ ket: "", nominal: "", metode: "Tunai", tanggal: new Date().toISOString().split('T')[0] });
    fetchData();
    setActiveTab('laporan');
  };

  // HAPUS DATA (Security Owner)
  const handleDeleteTrx = async (id) => {
    const ownerPin = localStorage.getItem("ownerPin") || "2003";
    const input = prompt("🔐 Masukkan PIN Owner untuk menghapus transaksi:");
    if (input === ownerPin) {
      await deleteDoc(doc(db, "finance_transaksi", id));
      alert("Data dihapus.");
      fetchData();
    } else {
      alert("PIN SALAH!");
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0}}>💰 Keuangan & Kasir</h2>
            <p style={{margin:0, color:'#666'}}>Laporan Realtime Terintegrasi</p>
          </div>
          
          {/* FILTER BULAN */}
          <div style={{textAlign:'right'}}>
            <label style={{fontSize:'12px', display:'block'}}>Pilih Periode Laporan:</label>
            <input 
              type="month" 
              value={filterBulan} 
              onChange={(e) => setFilterBulan(e.target.value)}
              style={styles.inputDate}
            />
          </div>
        </div>

        {/* INFO SALDO (BRANKAS VS BANK) */}
        <div style={styles.saldoGrid}>
          <div style={{...styles.saldoCard, borderLeft:'5px solid #27ae60'}}>
            <small>Total Uang di Brankas (Tunai)</small>
            <h2 style={{color:'#27ae60'}}>Rp {saldo.tunai.toLocaleString()}</h2>
          </div>
          <div style={{...styles.saldoCard, borderLeft:'5px solid #2980b9'}}>
            <small>Total Uang di Bank (Transfer)</small>
            <h2 style={{color:'#2980b9'}}>Rp {saldo.bank.toLocaleString()}</h2>
          </div>
          <div style={{...styles.saldoCard, background:'#2c3e50', color:'white'}}>
            <small style={{color:'#ccc'}}>Total Aset Keuangan</small>
            <h2>Rp {saldo.total.toLocaleString()}</h2>
          </div>
        </div>

        <div style={styles.tabs}>
          <button style={activeTab === 'laporan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('laporan')}>📊 Laporan Rinci</button>
          <button style={activeTab === 'tagihan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('tagihan')}>📝 Tagihan / Cicilan</button>
          <button style={activeTab === 'catat' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('catat')}>➖ Catat Pengeluaran</button>
        </div>

        {/* TAB 1: LAPORAN RINCI */}
        {activeTab === 'laporan' && (
          <div style={styles.card}>
            <h3>Laporan Keuangan: {filterBulan}</h3>
            <table style={styles.table}>
              <thead>
                <tr style={{background:'#eee', textAlign:'left'}}>
                  <th style={{padding:10}}>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Metode</th>
                  <th>Arus Kas</th>
                  <th>Nominal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', padding:20}}>Belum ada data di bulan ini.</td></tr>}
                {transaksi.map(t => (
                  <tr key={t.id} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:10}}>{t.tanggal}</td>
                    <td>{t.ket}</td>
                    <td>
                      {t.metode === 'Tunai' 
                        ? <span style={styles.badgeTunai}>📦 Tunai/Brankas</span> 
                        : <span style={styles.badgeBank}>💳 Bank/Transfer</span>}
                    </td>
                    <td>
                      {t.tipe === 'Masuk' 
                        ? <span style={{color:'green', fontWeight:'bold'}}>Masuk ↘</span> 
                        : <span style={{color:'red', fontWeight:'bold'}}>Keluar ↗</span>}
                    </td>
                    <td style={{fontWeight:'bold'}}>Rp {parseInt(t.nominal).toLocaleString()}</td>
                    <td>
                      <button onClick={() => handleDeleteTrx(t.id)} style={styles.btnDel}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: TAGIHAN CICILAN */}
        {activeTab === 'tagihan' && (
          <div style={styles.card}>
            <h3>Daftar Siswa Cicilan</h3>
            {tagihan.map(item => (
              <div key={item.id} style={styles.billCard}>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                  <div>
                    <b>{item.namaSiswa}</b> <small>({item.noHp})</small>
                    <div style={{fontSize:12}}>Sisa Hutang: <b style={{color:'red'}}>Rp {item.sisaTagihan.toLocaleString()}</b></div>
                  </div>
                </div>
                <div style={{display:'flex', gap:10, overflowX:'auto'}}>
                  {item.detailCicilan.map((c, i) => (
                    <div key={i} style={c.status === 'Lunas' ? styles.cicilDone : styles.cicilPending}>
                      <small>Bulan {c.bulanKe}</small><br/>
                      <b>Rp {c.nominal.toLocaleString()}</b>
                      {c.status === 'Lunas' ? (
                        <div style={{fontSize:10, color:'green', marginTop:5}}>Lunas ({c.metodeBayar})</div>
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

        {/* TAB 3: CATAT PENGELUARAN */}
        {activeTab === 'catat' && (
          <div style={{...styles.card, maxWidth:'500px'}}>
            <h3>Catat Pengeluaran Operasional</h3>
            <form onSubmit={handleSimpanManual}>
              <div style={styles.group}>
                <label>Tanggal Transaksi</label>
                <input type="date" style={styles.input} value={catat.tanggal} onChange={e => setCatat({...catat, tanggal: e.target.value})} />
              </div>
              <div style={styles.group}>
                <label>Keterangan</label>
                <input type="text" placeholder="Beli Spidol, Bayar Listrik..." style={styles.input} value={catat.ket} onChange={e => setCatat({...catat, ket: e.target.value})} required />
              </div>
              <div style={styles.group}>
                <label>Nominal (Rp)</label>
                <input type="number" style={styles.input} value={catat.nominal} onChange={e => setCatat({...catat, nominal: e.target.value})} required />
              </div>
              <div style={styles.group}>
                <label>Sumber Dana</label>
                <select style={styles.select} value={catat.metode} onChange={e => setCatat({...catat, metode: e.target.value})}>
                  <option value="Tunai">Ambil dari Brankas (Tunai)</option>
                  <option value="Bank">Transfer dari Bank</option>
                </select>
              </div>
              <button style={styles.btnSave}>Simpan Pengeluaran</button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  inputDate: { padding: 10, borderRadius: 5, border:'1px solid #ccc' },
  saldoGrid: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:30 },
  saldoCard: { background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  tabs: { marginBottom: 20 },
  tab: { padding: '10px 20px', border: 'none', background: '#ddd', cursor: 'pointer', marginRight:5, borderRadius:'5px 5px 0 0' },
  tabActive: { padding: '10px 20px', border: 'none', background: 'white', fontWeight:'bold', cursor: 'pointer', marginRight:5, borderRadius:'5px 5px 0 0' },
  card: { background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse' },
  badgeTunai: { background:'#fff3cd', padding:'3px 8px', borderRadius:5, fontSize:12, color:'#856404' },
  badgeBank: { background:'#d1ecf1', padding:'3px 8px', borderRadius:5, fontSize:12, color:'#0c5460' },
  btnDel: { fontSize:11, color:'red', background:'none', border:'1px solid red', padding:'2px 5px', borderRadius:3, cursor:'pointer' },
  billCard: { border:'1px solid #eee', padding:15, marginBottom:10, borderRadius:8 },
  cicilPending: { border:'1px solid #ccc', padding:10, borderRadius:5, textAlign:'center', minWidth:80, background:'#f9f9f9' },
  cicilDone: { border:'1px solid green', padding:10, borderRadius:5, textAlign:'center', minWidth:80, background:'#d4edda' },
  btnPay: { marginTop:5, fontSize:11, background:'#2980b9', color:'white', border:'none', padding:'3px 8px', borderRadius:3, cursor:'pointer' },
  group: { marginBottom:15 },
  input: { width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5, boxSizing:'border-box' },
  select: { width:'100%', padding:10, border:'1px solid #ccc', borderRadius:5, boxSizing:'border-box', background:'white' },
  btnSave: { width:'100%', padding:12, background:'#c0392b', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer' }
};

export default FinanceDashboard;