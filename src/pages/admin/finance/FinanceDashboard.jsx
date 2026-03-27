import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";

const FinanceDashboard = () => {
  // Fitur Privacy: Default TRUE agar saldo tidak langsung terlihat saat buka halaman
  const [privacyMode, setPrivacyMode] = useState(true); 
  
  const [balance, setBalance] = useState({ tunai: 0, bank: 0, total: 0 });
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [debtors, setDebtors] = useState([]);

  useEffect(() => {
    // 1. HITUNG SALDO REALTIME DARI LOG KEUANGAN
    const qLogs = query(collection(db, "finance_logs"));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
        let tunai = 0, bank = 0;
        snap.forEach(doc => {
            const data = doc.data();
            const amt = parseInt(data.amount || 0);
            
            // Logika Arus Kas: Pemasukan menambah, Pengeluaran mengurangi
            if(data.type === 'Pemasukan') {
                if(data.method === 'Tunai') tunai += amt; else bank += amt;
            } else { 
                if(data.method === 'Tunai') tunai -= amt; else bank -= amt;
            }
        });
        setBalance({ tunai, bank, total: tunai + bank });
    });

    // 2. HITUNG TOTAL PIUTANG (TUNGGAKAN SISWA)
    const fetchDebts = async () => {
        try {
            const snap = await getDocs(collection(db, "students"));
            let totalHutang = 0;
            let listNunggak = [];
            
            snap.forEach(doc => {
                const d = doc.data();
                const sisa = (parseInt(d.totalTagihan)||0) - (parseInt(d.totalBayar)||0);
                if(sisa > 0) {
                    totalHutang += sisa;
                    listNunggak.push({ nama: d.nama, sisa: sisa, kelas: d.kelasSekolah || '-' });
                }
            });
            setTotalPiutang(totalHutang);
            // Urutkan dari tunggakan terbesar
            setDebtors(listNunggak.sort((a,b) => b.sisa - a.sisa).slice(0, 5));
        } catch (error) {
            console.error("Error calculating debts:", error);
        }
    };
    fetchDebts();

    return () => unsubLogs();
  }, []);

  // FORMATTER SENSOR: Mengganti angka dengan bintang jika privacyMode aktif
  const rp = (num) => privacyMode ? "Rp *********" : "Rp " + num.toLocaleString('id-ID');

  return (
    <div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
            <h2 style={{margin:0, color:'#2c3e50'}}>📊 Pusat Kontrol Keuangan</h2>
            
            <button 
                onClick={()=>setPrivacyMode(!privacyMode)} 
                style={{
                    padding:'8px 20px', 
                    background: privacyMode ? '#34495e' : 'white', 
                    color: privacyMode ? 'white' : '#34495e',
                    border: '2px solid #34495e', 
                    borderRadius:20, 
                    cursor:'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: '0.3s'
                }}>
                {privacyMode ? "👁️ INTIP SALDO" : "🔒 SEMBUNYIKAN"}
            </button>
        </div>

        {/* KARTU SALDO */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, marginBottom:30}}>
            
            {/* TOTAL ASET */}
            <div style={{background:'linear-gradient(135deg, #2c3e50, #34495e)', color:'white', padding:25, borderRadius:15, boxShadow:'0 5px 15px rgba(0,0,0,0.2)'}}>
                <small style={{opacity:0.8, textTransform:'uppercase', letterSpacing:1}}>Total Aset Likuid</small>
                <h1 style={{margin:'10px 0', fontSize:32, letterSpacing: privacyMode ? 2 : 0}}>{rp(balance.total)}</h1>
                <div style={{fontSize:12, opacity:0.8}}>Status: Kas Berjalan Aktif</div>
            </div>

            {/* TUNAI */}
            <div style={{background:'white', padding:20, borderRadius:15, borderLeft:'6px solid #f39c12', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{color:'#f39c12', fontWeight:'bold', marginBottom:5}}>💵 Kas Tunai (Brankas)</div>
                <h2 style={{margin:0, color:'#333', letterSpacing: privacyMode ? 2 : 0}}>{rp(balance.tunai)}</h2>
                <small style={{color:'#999'}}>Uang fisik di kantor</small>
            </div>

            {/* BANK */}
            <div style={{background:'white', padding:20, borderRadius:15, borderLeft:'6px solid #3498db', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{color:'#3498db', fontWeight:'bold', marginBottom:5}}>💳 Saldo Bank</div>
                <h2 style={{margin:0, color:'#333', letterSpacing: privacyMode ? 2 : 0}}>{rp(balance.bank)}</h2>
                <small style={{color:'#999'}}>Dana di rekening lembaga</small>
            </div>

            {/* PIUTANG */}
            <div style={{background:'white', padding:20, borderRadius:15, borderLeft:'6px solid #e74c3c', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{color:'#e74c3c', fontWeight:'bold', marginBottom:5}}>📉 Total Piutang</div>
                <h2 style={{margin:0, color:'#333', letterSpacing: privacyMode ? 2 : 0}}>{rp(totalPiutang)}</h2>
                <small style={{color:'#999'}}>Dana yang belum tertagih</small>
            </div>
        </div>

        {/* WARNING TUNGGAKAN */}
        <div style={{background:'#fff3cd', border:'1px solid #ffeeba', padding:20, borderRadius:10, boxShadow:'0 2px 8px rgba(0,0,0,0.03)'}}>
            <h3 style={{marginTop:0, color:'#856404'}}>⚠️ Top 5 Tunggakan Siswa</h3>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                {debtors.length === 0 ? <p style={{color:'#856404'}}>Tidak ada tunggakan terdeteksi.</p> : debtors.map((d, i) => (
                    <div key={i} style={{background:'white', padding:'8px 15px', borderRadius:20, fontSize:13, border:'1px solid #ddd', color:'#333', boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                        <b>{d.nama}</b> ({d.kelas}) : <span style={{color:'#c0392b', fontWeight:'bold'}}>{rp(d.sisa)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default FinanceDashboard;