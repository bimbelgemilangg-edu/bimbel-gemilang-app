import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase';
import { collection, getDocs, doc, updateDoc, addDoc, query, orderBy } from "firebase/firestore";
import { ShieldAlert, ShieldCheck, Calendar, Clock, Wallet, CheckCircle, AlertCircle } from 'lucide-react';

const DebtControl = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // MODAL BAYAR
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("Tunai");

  const fetchDebts = async () => {
    setLoading(true);
    try {
        const snap = await getDocs(collection(db, "students"));
        const debts = [];
        const today = new Date();
        
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const total = parseInt(d.totalTagihan || 0);
            const paid = parseInt(d.totalBayar || 0);
            const sisaHutang = total - paid;

            // LOGIKA HITUNG SISA BULAN PAKET
            // Asumsi field: tanggalMulai (String YYYY-MM-DD) dan durasiBulan (Number)
            let sisaBulan = 0;
            let statusPaket = "Habis";
            
            if (d.tanggalMulai && d.durasiBulan) {
                const startDate = new Date(d.tanggalMulai);
                const endDate = new Date(startDate.setMonth(startDate.getMonth() + parseInt(d.durasiBulan)));
                
                const diffTime = endDate - today;
                sisaBulan = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); // Konversi ke bulan
                if (diffTime > 0) statusPaket = `${sisaBulan} Bulan Lagi`;
            }

            // Filter: Tampilkan yang belum lunas ATAU yang paketnya hampir habis
            if (sisaHutang > 0 || sisaBulan <= 1) {
                debts.push({ 
                    id: docSnap.id, 
                    ...d, 
                    sisaHutang, 
                    paid, 
                    sisaBulan: sisaBulan > 0 ? sisaBulan : 0,
                    statusPaket 
                });
            }
        });
        setStudents(debts);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchDebts(); }, []);

  const handlePay = async (e) => {
    e.preventDefault();
    if(!selectedStudent) return;
    const nominal = parseInt(payAmount);
    
    if(nominal > selectedStudent.sisaHutang) {
        alert("Peringatan: Nominal melebihi sisa hutang (Akan dianggap deposit/kelebihan bayar)");
    }

    try {
        const studentRef = doc(db, "students", selectedStudent.id);
        await updateDoc(studentRef, {
            totalBayar: (selectedStudent.paid || 0) + nominal
        });

        const todayStr = new Date().toISOString().split('T')[0];
        await addDoc(collection(db, "finance_logs"), {
            type: "Pemasukan",
            category: "SPP / Cicilan Piutang",
            amount: nominal,
            method: payMethod, 
            note: `Pelunasan: ${selectedStudent.nama}`,
            date: todayStr,
            createdAt: new Date().toISOString()
        });

        alert("✅ Pembayaran Berhasil Disinkronkan!");
        setSelectedStudent(null);
        setPayAmount("");
        fetchDebts();
    } catch (err) {
        alert("Gagal memproses data");
    }
  };

  if (loading) return <div style={{padding:30, textAlign:'center'}}>Menghitung Piutang & Masa Aktif...</div>;

  return (
    <div style={{fontFamily: 'Inter, sans-serif'}}>
        <div style={st.headerBanner}>
            <h3 style={{margin:0, color:'#e67e22'}}>📊 Monitoring Piutang & Masa Aktif</h3>
            <p style={{fontSize:13, color:'#7f8c8d', margin:'5px 0 0 0'}}>Pantau tunggakan biaya dan durasi paket belajar siswa secara real-time.</p>
        </div>
        
        <div style={st.tableWrapper}>
            <table style={st.table}>
                <thead>
                    <tr style={st.thRow}>
                        <th style={st.th}>Siswa & Status</th>
                        <th style={st.th}>Masa Paket</th>
                        <th style={st.th}>Total Tagihan</th>
                        <th style={st.th}>Sudah Bayar</th>
                        <th style={st.th}>Sisa Hutang</th>
                        <th style={st.th}>Aksi</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(s => (
                        <tr key={s.id} style={st.tr}>
                            <td style={st.td}>
                                <div style={{display:'flex', alignItems:'center', gap:10}}>
                                    {s.isBlocked ? <ShieldAlert size={18} color="#ef4444"/> : <ShieldCheck size={18} color="#10b981"/>}
                                    <div>
                                        <div style={{fontWeight:'bold', color:'#2c3e50'}}>{s.nama}</div>
                                        <div style={{fontSize:11, color: s.isBlocked ? '#ef4444' : '#10b981', fontWeight:'600'}}>
                                            {s.isBlocked ? "AKSES DIBLOKIR" : "AKSES AKTIF"}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style={st.td}>
                                <div style={{display:'flex', alignItems:'center', gap:5, fontSize:13}}>
                                    <Clock size={14} color="#64748b"/>
                                    <span style={{fontWeight:'600', color: s.sisaBulan <= 1 ? '#e67e22' : '#2c3e50'}}>
                                        {s.statusPaket}
                                    </span>
                                </div>
                                <small style={{color:'#94a3b8'}}>Dari {s.durasiBulan || 0} bln</small>
                            </td>
                            <td style={st.td}>Rp {s.totalTagihan?.toLocaleString()}</td>
                            <td style={st.td}><span style={{color:'#10b981'}}>Rp {s.paid?.toLocaleString()}</span></td>
                            <td style={{...st.td, fontWeight:'bold', color:'#c0392b'}}>Rp {s.sisaHutang.toLocaleString()}</td>
                            <td style={st.td}>
                                <button onClick={() => setSelectedStudent(s)} style={st.btnPay}>💸 Bayar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {selectedStudent && (
            <div style={st.modalOverlay}>
                <div style={st.modalContent}>
                    <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:15}}>Penerimaan Dana: {selectedStudent.nama}</h3>
                    <div style={st.infoBox}>
                        <div>Sisa Piutang: <b>Rp {selectedStudent.sisaHutang.toLocaleString()}</b></div>
                        <div>Masa Paket: <b>{selectedStudent.statusPaket}</b></div>
                    </div>
                    
                    <form onSubmit={handlePay}>
                        <div style={{marginBottom:15}}>
                            <label style={st.label}>Jumlah Bayar (Rp)</label>
                            <input type="number" required value={payAmount} onChange={e=>setPayAmount(e.target.value)} style={st.input} placeholder="Contoh: 500000" autoFocus />
                        </div>
                        
                        <div style={{marginBottom:20}}>
                            <label style={st.label}>Metode Pembayaran</label>
                            <select value={payMethod} onChange={e=>setPayMethod(e.target.value)} style={st.input}>
                                <option value="Tunai">💵 Kasir (Tunai)</option>
                                <option value="Bank">💳 Transfer Bank</option>
                            </select>
                        </div>

                        <div style={{display:'flex', gap:10}}>
                            <button type="submit" style={st.btnSubmit}>SIMPAN PEMBAYARAN</button>
                            <button type="button" onClick={()=>setSelectedStudent(null)} style={st.btnCancel}>BATAL</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

const st = {
  headerBanner: { padding: '20px', background: '#fff', borderRadius: '12px', marginBottom: '20px', border: '1px solid #e2e8f0' },
  tableWrapper: { background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { background: '#f8fafc', textAlign: 'left' },
  th: { padding: '15px', fontSize: '13px', color: '#64748b', fontWeight: '600', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: '0.2s' },
  td: { padding: '15px', fontSize: '14px' },
  btnPay: { background: '#10b981', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(30, 41, 59, 0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  infoBox: { background: '#f0f9ff', padding: '15px', borderRadius: '10px', marginBottom: '20px', fontSize: '13px', color: '#0369a1', display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '13px', color: '#475569' },
  input: { width: '100%', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', boxSizing: 'border-box' },
  btnSubmit: { flex: 2, background: '#10b981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
  btnCancel: { flex: 1, background: '#f1f5f9', color: '#64748b', border: 'none', padding: '12px', borderRadius: '8px', cursor: 'pointer' }
};

export default DebtControl;