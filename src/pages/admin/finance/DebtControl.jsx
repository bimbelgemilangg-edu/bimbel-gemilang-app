import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, addDoc } from "firebase/firestore";

const DebtControl = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // MODAL BAYAR
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Tunai");

  // 1. CARI SISWA YANG PUNYA HUTANG
  const fetchDebts = async () => {
    setLoading(true);
    try {
        const snap = await getDocs(collection(db, "students"));
        const debts = [];
        
        snap.forEach(doc => {
            const d = doc.data();
            const total = parseInt(d.totalTagihan || 0);
            const paid = parseInt(d.totalBayar || 0);
            const sisa = total - paid;
            
            if(sisa > 0) {
                debts.push({ id: doc.id, ...d, sisa, paid });
            }
        });
        setStudents(debts);
    } catch (error) {
        console.error("Error fetching debts:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, []);

  // 2. PROSES BAYAR CICILAN
  const handlePay = async (e) => {
    e.preventDefault();
    if(!selectedStudent) return;
    const nominal = parseInt(payAmount);
    
    if(nominal > selectedStudent.sisa) return alert("Nominal melebihi sisa hutang!");

    try {
        // A. UPDATE DATA SISWA (Tambah Total Bayar)
        const studentRef = doc(db, "students", selectedStudent.id);
        await updateDoc(studentRef, {
            totalBayar: (selectedStudent.paid || 0) + nominal
        });

        // B. CATAT DI FINANCE LOGS (Agar Masuk Dashboard Keuangan)
        // PERBAIKAN: Memastikan format date standar YYYY-MM-DD agar terbaca Dashboard
        const today = new Date().toISOString().split('T')[0];
        
        await addDoc(collection(db, "finance_logs"), {
            type: "Pemasukan",
            category: "SPP / Cicilan Piutang",
            amount: nominal,
            method: payMethod, 
            note: `Cicilan Pelunasan: ${selectedStudent.nama}`,
            date: today,
            createdAt: new Date().toISOString()
        });

        alert("✅ Pembayaran Berhasil! Data Keuangan & Siswa Terupdate.");
        setSelectedStudent(null);
        setPayAmount("");
        fetchDebts(); // Refresh data
    } catch (err) {
        console.error(err);
        alert("Gagal memproses pembayaran");
    }
  };

  if (loading) return <div style={{padding:20}}>Memuat data piutang...</div>;

  return (
    <div>
        <h3 style={{color:'#e67e22', marginTop:0}}>⚠️ Monitoring Piutang Siswa</h3>
        <p style={{fontSize:13, color:'#666'}}>Daftar siswa yang belum lunas. Klik tombol bayar untuk mencatat cicilan masuk.</p>
        
        <div style={{overflowX:'auto'}}>
            <table style={{width:'100%', borderCollapse:'collapse', background:'white', marginTop:15, borderRadius:8, overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,0.05)'}}>
                <thead>
                    <tr style={{background:'#e67e22', color:'white', textAlign:'left'}}>
                        <th style={{padding:15}}>Nama Siswa</th>
                        <th style={{padding:15}}>Ortu / WA</th>
                        <th style={{padding:15, textAlign:'right'}}>Total Tagihan</th>
                        <th style={{padding:15, textAlign:'right'}}>Sudah Bayar</th>
                        <th style={{padding:15, textAlign:'right'}}>SISA (Tunggakan)</th>
                        <th style={{padding:15, textAlign:'center'}}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {students.length === 0 ? <tr><td colSpan="6" style={{padding:20, textAlign:'center'}}>Tidak ada siswa menunggak.</td></tr> : 
                    students.map(s => (
                        <tr key={s.id} style={{borderBottom:'1px solid #eee'}}>
                            <td style={{padding:15}}><b>{s.nama}</b><br/><small>{s.kelasSekolah}</small></td>
                            <td style={{padding:15}}>{s.ortu?.ayah || s.ortu?.ibu || '-'}<br/>{s.ortu?.hp}</td>
                            <td style={{padding:15, textAlign:'right'}}>Rp {s.totalTagihan?.toLocaleString()}</td>
                            <td style={{padding:15, textAlign:'right'}}>Rp {s.paid?.toLocaleString()}</td>
                            <td style={{padding:15, textAlign:'right', fontWeight:'bold', color:'#c0392b'}}>Rp {s.sisa.toLocaleString()}</td>
                            <td style={{padding:15, textAlign:'center'}}>
                                <button 
                                    onClick={() => setSelectedStudent(s)}
                                    style={{background:'#27ae60', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', fontWeight:'bold'}}
                                >
                                    💸 Bayar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* MODAL POPUP BAYAR */}
        {selectedStudent && (
            <div style={{position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000}}>
                <div style={{background:'white', padding:30, borderRadius:10, width:400, boxShadow:'0 5px 15px rgba(0,0,0,0.2)'}}>
                    <h3 style={{marginTop:0}}>Pembayaran Cicilan: {selectedStudent.nama}</h3>
                    <p>Sisa Tunggakan: <b>Rp {selectedStudent.sisa.toLocaleString()}</b></p>
                    
                    <form onSubmit={handlePay}>
                        <div style={{marginBottom:15}}>
                            <label style={{display:'block', fontWeight:'bold'}}>Nominal Bayar (Rp)</label>
                            <input type="number" required value={payAmount} onChange={e=>setPayAmount(e.target.value)} style={{width:'100%', padding:10, marginTop:5, border:'1px solid #ccc', borderRadius:5, boxSizing:'border-box'}} autoFocus />
                        </div>
                        
                        <div style={{marginBottom:15}}>
                            <label style={{display:'block', fontWeight:'bold'}}>Masuk Ke Saldo Mana?</label>
                            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={{width:'100%', padding:10, marginTop:5, border:'1px solid #ccc', borderRadius:5}}>
                                <option value="Tunai">💵 Tunai (Kasir/Brankas)</option>
                                <option value="Bank">💳 Transfer Bank (Rekening)</option>
                            </select>
                        </div>

                        <div style={{display:'flex', gap:10, marginTop:20}}>
                            <button type="submit" style={{flex:1, background:'#27ae60', color:'white', border:'none', padding:12, borderRadius:5, cursor:'pointer', fontWeight:'bold'}}>PROSES BAYAR</button>
                            <button type="button" onClick={()=>setSelectedStudent(null)} style={{flex:1, background:'#ccc', border:'none', padding:12, borderRadius:5, cursor:'pointer'}}>BATAL</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default DebtControl;