import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
// FIREBASE
import { db } from '../../../firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

const FinanceDashboard = () => {
  const [activeTab, setActiveTab] = useState('tagihan'); // Default ke tagihan
  const [transaksi, setTransaksi] = useState([]); // Pemasukan
  const [tagihan, setTagihan] = useState([]); // Piutang/Cicilan

  // --- AMBIL DATA DARI FIREBASE ---
  const fetchData = async () => {
    // 1. Ambil Tagihan (Cicilan)
    const tagihanSnap = await getDocs(collection(db, "finance_tagihan"));
    setTagihan(tagihanSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // 2. Ambil Transaksi (Pemasukan)
    const trxSnap = await getDocs(collection(db, "finance_transaksi"));
    setTransaksi(trxSnap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- LOGIKA BAYAR CICILAN (Smart Logic) ---
  const handleBayarCicilan = async (tagihanData, indexCicilan) => {
    const detail = [...tagihanData.detailCicilan];
    const itemCicilan = detail[indexCicilan];
    
    // Konfirmasi
    if (!window.confirm(`Proses pembayaran Cicilan ke-${itemCicilan.bulanKe} sebesar Rp ${itemCicilan.nominal.toLocaleString()}?`)) return;

    // 1. Update Status Cicilan di Array
    detail[indexCicilan].status = "Lunas";
    detail[indexCicilan].tanggalBayar = new Date().toISOString().split('T')[0];

    // 2. Kurangi Sisa Tagihan Global
    const sisaBaru = tagihanData.sisaTagihan - itemCicilan.nominal;

    // 3. Update Firebase Tagihan
    await updateDoc(doc(db, "finance_tagihan", tagihanData.id), {
      detailCicilan: detail,
      sisaTagihan: sisaBaru
    });

    // 4. CATAT KE PEMASUKAN REAL (Uang Masuk)
    await addDoc(collection(db, "finance_transaksi"), {
      tanggal: new Date().toISOString().split('T')[0],
      ket: `Cicilan ${tagihanData.namaSiswa} (Bulan ${itemCicilan.bulanKe})`,
      tipe: "Masuk",
      metode: "Tunai/Bank",
      nominal: itemCicilan.nominal,
      studentId: tagihanData.studentId
    });

    alert("✅ Pembayaran Cicilan Berhasil & Masuk Laporan Keuangan!");
    fetchData(); // Refresh data
  };

  // HAPUS TAGIHAN (BUTUH KODE OWNER)
  const handleDeleteTagihan = async (id) => {
    const ownerPin = localStorage.getItem("ownerPin") || "2003";
    const input = prompt("🔐 Masukkan PIN Owner untuk menghapus Tagihan:");
    
    if (input === ownerPin) {
      await deleteDoc(doc(db, "finance_tagihan", id));
      alert("Tagihan dihapus.");
      fetchData();
    } else {
      alert("PIN Salah!");
    }
  };

  // KIRIM WA
  const handleWA = (hp, nama, sisa) => {
    const msg = `Halo Bapak/Ibu ortu ${nama}, mohon selesaikan sisa cicilan sebesar Rp ${sisa.toLocaleString()}. Terima kasih.`;
    window.open(`https://wa.me/${hp}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <h2>💰 Keuangan Terintegrasi</h2>
        
        <div style={styles.tabs}>
          <button style={activeTab === 'tagihan' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('tagihan')}>📝 Daftar Cicilan / Tagihan</button>
          <button style={activeTab === 'transaksi' ? styles.tabActive : styles.tab} onClick={() => setActiveTab('transaksi')}>📊 Laporan Pemasukan</button>
        </div>

        {/* TAB 1: DAFTAR CICILAN */}
        {activeTab === 'tagihan' && (
          <div style={styles.card}>
            <h3>Daftar Siswa Cicilan (Piutang)</h3>
            {tagihan.length === 0 && <p>Tidak ada tagihan aktif.</p>}
            
            {tagihan.map(item => (
              <div key={item.id} style={styles.billCard}>
                <div style={{display:'flex', justifyContent:'space-between', borderBottom:'1px solid #eee', paddingBottom:'10px', marginBottom:'10px'}}>
                  <div>
                    <h4 style={{margin:0}}>{item.namaSiswa}</h4>
                    <small>Ortu: {item.namaOrtu} | HP: {item.noHp}</small>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:'12px', color:'#777'}}>Sisa Tagihan</div>
                    <div style={{fontSize:'18px', fontWeight:'bold', color:'red'}}>Rp {item.sisaTagihan.toLocaleString()}</div>
                    <button onClick={() => handleWA(item.noHp, item.namaSiswa, item.sisaTagihan)} style={styles.btnWA}>📲 Ingatkan WA</button>
                    <button onClick={() => handleDeleteTagihan(item.id)} style={styles.btnDel}>Hapus</button>
                  </div>
                </div>

                {/* DETAIL CICILAN */}
                <div style={{display:'flex', gap:'10px', overflowX:'auto'}}>
                  {item.detailCicilan.map((cicil, idx) => (
                    <div key={idx} style={cicil.status === 'Lunas' ? styles.cicilDone : styles.cicilPending}>
                      <div style={{fontWeight:'bold', fontSize:'12px'}}>Bulan {cicil.bulanKe}</div>
                      <div>Rp {cicil.nominal.toLocaleString()}</div>
                      
                      {cicil.status === 'Lunas' ? (
                        <div style={{color:'green', fontSize:'10px', fontWeight:'bold'}}>✅ LUNAS</div>
                      ) : (
                        <button onClick={() => handleBayarCicilan(item, idx)} style={styles.btnPay}>Bayar</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: LAPORAN PEMASUKAN */}
        {activeTab === 'transaksi' && (
          <div style={styles.card}>
            <h3>Riwayat Uang Masuk (Lunas & Cicilan)</h3>
            <table style={{width:'100%', borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'#eee', textAlign:'left'}}>
                  <th style={{padding:10}}>Tanggal</th>
                  <th>Keterangan</th>
                  <th>Nominal</th>
                </tr>
              </thead>
              <tbody>
                {transaksi.map(t => (
                  <tr key={t.id} style={{borderBottom:'1px solid #eee'}}>
                    <td style={{padding:10}}>{t.tanggal}</td>
                    <td>{t.ket}</td>
                    <td style={{fontWeight:'bold', color:'green'}}>+ Rp {t.nominal.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  tabs: { marginBottom: '20px' },
  tab: { padding: '10px 20px', border: 'none', background: '#ddd', cursor: 'pointer', marginRight:'5px', borderRadius:'5px 5px 0 0' },
  tabActive: { padding: '10px 20px', border: 'none', background: 'white', fontWeight:'bold', cursor: 'pointer', marginRight:'5px', borderRadius:'5px 5px 0 0' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  
  billCard: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px', background: '#fff' },
  
  cicilPending: { background: '#fff3cd', padding: '10px', borderRadius: '5px', minWidth: '100px', textAlign: 'center', border: '1px solid #ffeeba' },
  cicilDone: { background: '#d4edda', padding: '10px', borderRadius: '5px', minWidth: '100px', textAlign: 'center', border: '1px solid #c3e6cb', opacity: 0.7 },
  
  btnPay: { marginTop:'5px', background:'#2980b9', color:'white', border:'none', borderRadius:'3px', cursor:'pointer', padding:'3px 8px', fontSize:'11px' },
  btnWA: { background:'#25D366', color:'white', border:'none', borderRadius:'3px', cursor:'pointer', padding:'5px 10px', fontSize:'12px', marginRight:'5px' },
  btnDel: { background:'#c0392b', color:'white', border:'none', borderRadius:'3px', cursor:'pointer', padding:'5px 10px', fontSize:'12px' }
};

export default FinanceDashboard;