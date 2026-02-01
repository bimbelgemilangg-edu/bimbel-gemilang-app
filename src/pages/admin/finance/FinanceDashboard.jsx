import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, query, onSnapshot, getDocs } from "firebase/firestore";

const FinanceDashboard = () => {
  // PERBAIKAN: Default useState jadi TRUE (Tersembunyi)
  const [privacyMode, setPrivacyMode] = useState(true); 
  
  const [balance, setBalance] = useState({ tunai: 0, bank: 0, total: 0 });
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [debtors, setDebtors] = useState([]);

  useEffect(() => {
    // 1. HITUNG SALDO REALTIME
    const qLogs = query(collection(db, "finance_logs"));
    const unsubLogs = onSnapshot(qLogs, (snap) => {
        let tunai = 0, bank = 0;
        snap.forEach(doc => {
            const data = doc.data();
            const amt = parseInt(data.amount || 0);
            if(data.type === 'Pemasukan') {
                if(data.method === 'Tunai') tunai += amt; else bank += amt;
            } else { 
                if(data.method === 'Tunai') tunai -= amt; else bank -= amt;
            }
        });
        setBalance({ tunai, bank, total: tunai + bank });
    });

    // 2. HITUNG PIUTANG
    const fetchDebts = async () => {
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
        setDebtors(listNunggak.sort((a,b) => b.sisa - a.sisa).slice(0, 5));
    };
    fetchDebts();

    return () => unsubLogs();
  }, []);

  // FORMATTER SENSOR
  const rp = (num) => privacyMode ? "Rp *********" : "Rp " + num.toLocaleString('id-ID');

  return (
    <div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
            <h2 style={{margin:0, color:'#2c3e50'}}>Pusat Kontrol Keuangan</h2>
            
            {/* TOMBOL INTIP / SEMBUNYI */}
            <button 
                onClick={()=>setPrivacyMode(!privacyMode)} 
                style={{
                    padding:'8px 20px', 
                    background: privacyMode ? '#34495e' : 'transparent', 
                    color: privacyMode ? 'white' : '#333',
                    border: '1px solid #333', 
                    borderRadius:20, 
                    cursor:'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                }}>
                {privacyMode ? "👁️ INTIP SALDO" : "🔒 SEMBUNYIKAN"}
            </button>
        </div>

        {/* KARTU SALDO (YANG DISENSOR) */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20, marginBottom:30}}>
            
            {/* TOTAL ASET */}
            <div style={{background:'linear-gradient(135deg, #2c3e50, #34495e)', color:'white', padding:25, borderRadius:15, boxShadow:'0 5px 15px rgba(0,0,0,0.2)'}}>
                <small style={{opacity:0.8, textTransform:'uppercase', letterSpacing:1}}>Total Aset Likuid</small>
                <h1 style={{margin:'10px 0', fontSize:32, letterSpacing: privacyMode ? 2 : 0}}>{rp(balance.total)}</h1>
                <div style={{fontSize:12, opacity:0.8}}>Posisi Keuangan Aman</div>
            </div>

            {/* TUNAI */}
            <div style={{background:'white', padding:20, borderRadius:15, borderLeft:'6px solid #f39c12', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{color:'#f39c12', fontWeight:'bold', marginBottom:5}}>💵 Kas Tunai (Brankas)</div>
                <h2 style={{margin:0, color:'#333', letterSpacing: privacyMode ? 2 : 0}}>{rp(balance.tunai)}</h2>
                <small style={{color:'#999'}}>Uang fisik siap pakai</small>
            </div>

            {/* BANK */}
            <div style={{background:'white', padding:20, borderRadius:15, borderLeft:'6px solid #3498db', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{color:'#3498db', fontWeight:'bold', marginBottom:5}}>💳 Saldo Bank</div>
                <h2 style={{margin:0, color:'#333', letterSpacing: privacyMode ? 2 : 0}}>{rp(balance.bank)}</h2>
                <small style={{color:'#999'}}>Transfer & Digital</small>
            </div>

            {/* PIUTANG */}
            <div style={{background:'white', padding:20, borderRadius:15, borderLeft:'6px solid #e74c3c', boxShadow:'0 2px 10px rgba(0,0,0,0.05)'}}>
                <div style={{color:'#e74c3c', fontWeight:'bold', marginBottom:5}}>📉 Total Piutang Siswa</div>
                <h2 style={{margin:0, color:'#333', letterSpacing: privacyMode ? 2 : 0}}>{rp(totalPiutang)}</h2>
                <small style={{color:'#999'}}>Potensi pemasukan tertunda</small>
            </div>
        </div>

        {/* WARNING TUNGGAKAN */}
        <div style={{background:'#fff3cd', border:'1px solid #ffeeba', padding:20, borderRadius:10}}>
            <h3 style={{marginTop:0, color:'#856404'}}>⚠️ Top 5 Tunggakan Siswa</h3>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
                {debtors.length === 0 ? <p>Tidak ada tunggakan. Bagus!</p> : debtors.map((d, i) => (
                    <div key={i} style={{background:'white', padding:'5px 15px', borderRadius:20, fontSize:13, border:'1px solid #ddd', color:'#333'}}>
                        <b>{d.nama}</b> ({d.kelas}) : <span style={{color:'#c0392b'}}>{rp(d.sisa)}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

export default FinanceDashboard;