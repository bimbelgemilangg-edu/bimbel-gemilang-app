import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// PERBAIKAN: Mengarahkan ke SidebarAdmin agar sinkron dengan sistem baru
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc, addDoc } from "firebase/firestore";

const StudentFinance = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [student, setStudent] = useState(null);
  const [tagihan, setTagihan] = useState([]); // Daftar Tagihan Cicilan
  const [loading, setLoading] = useState(true);

  // 1. FETCH DATA SISWA & TAGIHAN
  const fetchFinance = async () => {
    setLoading(true);
    try {
      // A. Ambil Data Siswa
      const studentSnap = await getDoc(doc(db, "students", id));
      if (studentSnap.exists()) {
        setStudent({ id: studentSnap.id, ...studentSnap.data() });
      }

      // B. Ambil Tagihan (Finance Tagihan - Cicilan)
      const q = query(collection(db, "finance_tagihan"), where("studentId", "==", id));
      const querySnapshot = await getDocs(q);
      const billsData = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      
      if (billsData.length > 0) {
        setTagihan(billsData[0]); 
      } else {
        setTagihan(null);
      }

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchFinance(); }, [id]);

  // 2. FUNGSI BAYAR CICILAN
  const handlePayInstallment = async (docId, indexCicilan, nominal) => {
    if (!window.confirm(`Terima pembayaran cicilan Rp ${nominal.toLocaleString()}?`)) return;

    try {
      const newDetails = [...tagihan.detailCicilan];
      newDetails[indexCicilan].status = "Lunas";
      newDetails[indexCicilan].tanggalBayar = new Date().toISOString().split('T')[0];

      const newSisa = tagihan.sisaTagihan - nominal;

      const tagihanRef = doc(db, "finance_tagihan", docId);
      await updateDoc(tagihanRef, {
        detailCicilan: newDetails,
        sisaTagihan: newSisa
      });

      const siswaRef = doc(db, "students", id);
      await updateDoc(siswaRef, {
        totalBayar: (student.totalBayar || 0) + nominal
      });

      await addDoc(collection(db, "finance_logs"), {
        date: new Date().toISOString().split('T')[0],
        type: "Pemasukan",
        category: "SPP / Cicilan",
        amount: nominal,
        method: "Tunai", 
        note: `Cicilan ke-${newDetails[indexCicilan].bulanKe} ${student.nama}`,
        studentId: id
      });

      alert("✅ Pembayaran Berhasil! Masuk ke Laporan Keuangan.");
      fetchFinance(); 

    } catch (e) {
      console.error(e);
      alert("Gagal memproses pembayaran.");
    }
  };

  if(loading) return <div style={{padding:50}}>Loading Data Keuangan...</div>;
  if(!student) return <div style={{padding:50}}>Siswa tidak ditemukan.</div>;

  return (
    <div style={{ display: 'flex' }}>
      {/* PERBAIKAN: Menggunakan SidebarAdmin */}
      <SidebarAdmin />
      <div style={styles.content}>
        <button style={styles.btnBack} onClick={() => navigate('/admin/students')}>← Kembali</button>
        
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0}}>💰 Keuangan Siswa</h2>
            <p style={{margin:0, color:'#666'}}>{student.nama} | {student.detailProgram}</p>
          </div>
          <div style={{textAlign:'right'}}>
             <h3 style={{margin:0, color: tagihan?.sisaTagihan > 0 ? '#c0392b' : '#27ae60'}}>
               Sisa Tagihan: Rp {tagihan?.sisaTagihan?.toLocaleString() || 0}
             </h3>
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={{borderBottom:'2px solid #ddd', paddingBottom:10}}>Rincian Cicilan & Tagihan</h3>
          
          {!tagihan || !tagihan.detailCicilan ? (
            <p style={{padding:20, textAlign:'center', color:'#7f8c8d'}}>Tidak ada data cicilan aktif (Siswa mungkin Lunas/Tunai).</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={{background: '#eee'}}>
                  <th style={styles.th}>Cicilan Ke</th>
                  <th style={styles.th}>Jatuh Tempo</th>
                  <th style={styles.th}>Nominal</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {tagihan.detailCicilan.map((item, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>Bulan ke-{item.bulanKe}</td>
                    <td style={styles.td}>{item.jatuhTempo}</td>
                    <td style={styles.td}>Rp {item.nominal.toLocaleString()}</td>
                    <td style={styles.td}>
                      <span style={item.status === 'Lunas' ? styles.lunas : styles.belum}>
                        {item.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {item.status === 'Belum Lunas' ? (
                        <button 
                            style={styles.btnPay} 
                            onClick={() => handlePayInstallment(tagihan.id, idx, item.nominal)}
                        >
                            Bayar Sekarang
                        </button>
                      ) : (
                        <span style={{color:'#27ae60', fontSize:12}}>✅ Lunas ({item.tanggalBayar})</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  btnBack: { marginBottom: '20px', cursor: 'pointer', padding: '5px 10px' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems:'center' },
  card: { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop:10 },
  th: { padding: '12px', textAlign: 'left', borderBottom: '2px solid #ddd' },
  tr: { borderBottom: '1px solid #eee' },
  td: { padding: '12px' },
  lunas: { background: '#d4edda', color: '#155724', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  belum: { background: '#f8d7da', color: '#721c24', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' },
  btnPay: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }
};

export default StudentFinance;