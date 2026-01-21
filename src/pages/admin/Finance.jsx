import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, Download, Printer, Edit, Lock, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); 
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState([]); // Untuk Grafik PDF

  // Otoritas Owner State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // UI Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payMethod, setPayMethod] = useState('Tunai'); 
  const [inputType, setInputType] = useState('expense'); 
  const [newTrans, setNewTrans] = useState({ title: "", amountStr: "", category: "Lainnya", method: "Tunai" });
  const [showManualInv, setShowManualInv] = useState(false);
  const [newInv, setNewInv] = useState({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });

  useEffect(() => {
    // 1. Ambil Tagihan & Hitung Total Piutang
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => {
      const all = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(all.filter(inv => inv.status !== 'paid'));
      const piutang = all.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);
      setTotalPiutang(piutang);
    });

    // 2. Ambil Mutasi & Hitung Grafik Cashflow
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), s => {
      const trans = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      
      let cash = 0, bank = 0, inc = 0, exp = 0;
      const statsObj = {};

      trans.forEach(t => {
        const amt = t.amount || 0;
        if (t.type === 'expense') {
          exp += amt;
          if(t.method === 'Tunai') cash -= amt; else bank -= amt;
        } else {
          inc += amt;
          if(t.method === 'Tunai') cash += amt; else bank += amt;
        }

        // Data Grafik Bulanan
        if (t.date?.toDate) {
          const d = t.date.toDate();
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          const label = d.toLocaleString('id-ID', { month: 'short' });
          if (!statsObj[key]) statsObj[key] = { label, income: 0, expense: 0 };
          if (t.type === 'expense') statsObj[key].expense += amt;
          else statsObj[key].income += amt;
        }
      });

      setMonthlyStats(Object.keys(statsObj).sort().map(k => statsObj[k]));
      setBalance({ cash, bank, total: cash + bank }); 
      setIncomeTotal(inc); 
      setExpenseTotal(exp);
    });

    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- LOGIKA OWNER ---
  const handleOwnerAction = (type, data) => { setPendingAction({ type, data }); setShowVerifyModal(true); };
  const verifyOwner = async (e) => {
    e.preventDefault();
    const snap = await getDoc(doc(db, "settings", "owner_auth"));
    const correctPass = snap.exists() ? snap.data().password : "2003";
    if (ownerInput === correctPass) {
      if (pendingAction.type === 'delete') await deleteDoc(doc(db, "payments", pendingAction.data.id));
      else if (pendingAction.type === 'edit') { setEditForm({ ...pendingAction.data, amountStr: formatRupiah(pendingAction.data.amount) }); setShowEditModal(true); }
      setShowVerifyModal(false); setOwnerInput(""); setPendingAction(null);
    } else { alert("Sandi Salah!"); }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(payAmountStr);
    if (amount <= 0 || amount > selectedInvoice.remainingAmount) return alert("Nominal Salah!");
    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'invoices', selectedInvoice.id);
        const rem = selectedInvoice.remainingAmount - amount;
        t.update(ref, { remainingAmount: rem, status: rem <= 0 ? 'paid' : 'partial' });
        t.set(doc(collection(db, 'payments')), { 
          invoiceId: selectedInvoice.id, studentName: selectedInvoice.studentName, 
          amount, method: payMethod, type: 'income', category: 'SPP/Tagihan',
          description: `Pembayaran ${selectedInvoice.studentName}`, date: serverTimestamp() 
        });
      });
      setShowPayModal(false); setPayAmountStr(""); alert("Lunas & Masuk Mutasi!");
    } catch (err) { alert(err.message); }
  };

  const handleInputTransaction = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newTrans.amountStr);
    if (amount <= 0) return alert("Isi Nominal!");
    await addDoc(collection(db, 'payments'), {
      amount, method: newTrans.method, type: inputType, category: newTrans.category,
      description: newTrans.title, date: serverTimestamp(), studentName: '-' 
    });
    setNewTrans({ title: "", amountStr: "", category: "Lainnya", method: "Tunai" });
    alert("Tersimpan!");
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* ==============================================
          1. AREA PDF/PRINT (HIDDEN DI LAYAR)
          ============================================== */}
      <div className="hidden print:block w-full text-black p-10 bg-white">
        <div className="text-center border-b-4 border-black pb-6 mb-10">
          <h1 className="text-4xl font-black uppercase tracking-widest">LAPORAN ANALISIS KEUANGAN</h1>
          <p className="text-xl font-bold mt-2">BIMBEL GEMILANG SYSTEM • 2026</p>
          <p className="text-xs text-gray-500 mt-2 italic">Laporan ini bersifat rahasia dan hanya untuk keperluan internal manajemen.</p>
        </div>

        {/* RINGKASAN KAS */}
        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="border-2 border-black p-4 text-center">
            <p className="text-[10px] font-black uppercase mb-1">Pemasukan (Income)</p>
            <p className="text-xl font-black">Rp {formatRupiah(incomeTotal)}</p>
          </div>
          <div className="border-2 border-black p-4 text-center">
            <p className="text-[10px] font-black uppercase mb-1">Pengeluaran (Expense)</p>
            <p className="text-xl font-black">Rp {formatRupiah(expenseTotal)}</p>
          </div>
          <div className="border-2 border-black p-4 text-center bg-gray-100">
            <p className="text-[10px] font-black uppercase mb-1">Saldo Bersih (Net)</p>
            <p className="text-xl font-black">Rp {formatRupiah(balance.total)}</p>
          </div>
          <div className="border-2 border-black p-4 text-center">
            <p className="text-[10px] font-black uppercase mb-1">Total Piutang</p>
            <p className="text-xl font-black text-red-600">Rp {formatRupiah(totalPiutang)}</p>
          </div>
        </div>

        {/* GRAFIK CASHFLOW BULANAN (PDF) */}
        <div className="mb-10 border-2 border-black p-8 rounded-3xl">
          <h3 className="font-black uppercase text-sm mb-8 border-b-2 border-black pb-2 flex gap-2"><BarChart3 size={18}/> Tren Cashflow Bulanan</h3>
          <div className="flex items-end gap-6 h-[250px] border-b-2 border-l-2 border-black p-4">
            {monthlyStats.map((stat, i) => {
              const max = Math.max(...monthlyStats.map(s => Math.max(s.income, s.expense))) || 1;
              const hInc = (stat.income / max) * 100;
              const hExp = (stat.expense / max) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2">
                  <div className="flex gap-1 w-full justify-center items-end h-[200px]">
                    <div className="w-4 bg-black" style={{ height: `${hInc}%` }}></div>
                    <div className="w-4 border-2 border-black bg-white" style={{ height: `${hExp}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black">{stat.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-10 mt-6 text-xs font-black">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-black"></div> Pemasukan</div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-black"></div> Pengeluaran</div>
          </div>
        </div>

        {/* TABEL RINCIAN MUTASI (PDF) */}
        <h3 className="font-black uppercase text-sm mb-4">Rincian Transaksi Terakhir</h3>
        <table className="w-full text-[10px] text-left border-collapse border-2 border-black">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-black">
              <th className="p-2 border-r border-black w-10">No</th>
              <th className="p-2 border-r border-black">Tanggal</th>
              <th className="p-2 border-r border-black">Keterangan</th>
              <th className="p-2 border-r border-black text-right">Masuk</th>
              <th className="p-2 text-right">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr key={t.id} className="border-b border-black">
                <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                <td className="p-2 border-r border-black">{t.date?.toDate ? t.date.toDate().toLocaleDateString() : '-'}</td>
                <td className="p-2 border-r border-black font-bold">{t.description}</td>
                <td className="p-2 border-r border-black text-right">{t.type==='income' ? formatRupiah(t.amount) : ''}</td>
                <td className="p-2 text-right">{t.type==='expense' ? formatRupiah(t.amount) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==============================================
          2. DASHBOARD UI (ACTIVE SCREEN)
          ============================================== */}
      <div className="print:hidden space-y-10">
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl lg:col-span-2 relative overflow-hidden">
            <p className="opacity-40 uppercase font-black text-[10px] tracking-widest mb-2">Kas Gemilang</p>
            <div className="text-7xl font-black tracking-tighter">Rp {formatRupiah(balance.total)}</div>
            <div className="absolute top-0 right-0 p-10 opacity-10"><DollarSign size={100}/></div>
          </div>
          <div className="bg-orange-50 p-10 rounded-[3rem] border border-orange-100 shadow-xl flex flex-col justify-center">
            <div className="text-orange-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><AlertCircle size={20}/> Total Piutang</div>
            <div className="text-4xl font-black text-orange-700">Rp {formatRupiah(totalPiutang)}</div>
          </div>
          <div className="bg-green-50 p-10 rounded-[3rem] border border-green-100 shadow-xl flex flex-col justify-center">
            <div className="text-green-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><TrendingUp size={20}/> Laba Bersih</div>
            <div className="text-4xl font-black text-green-700">Rp {formatRupiah(incomeTotal - expenseTotal)}</div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-gray-100 p-2 rounded-[2.5rem] w-fit shadow-inner">
          {[{id:'summary', l:'Mutasi Kas', i:PieChart}, {id:'invoices', l:'Piutang Siswa', i:Receipt}, {id:'input', l:'Catat Kas', i:Wallet}]
          .map(m => (
            <button key={m.id} onClick={()=>setTab(m.id)} className={`px-12 py-5 rounded-[2rem] font-black text-sm flex items-center gap-3 transition-all ${tab===m.id?'bg-white text-blue-600 shadow-xl scale-105':'text-gray-400 hover:text-gray-500'}`}>
              <m.i size={20}/> {m.l}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-[4rem] border shadow-2xl overflow-hidden min-h-[600px]">
          
          {tab === 'summary' && (
            <div className="animate-in fade-in duration-500">
              <div className="p-12 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Laporan Mutasi Keuangan</h3>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-blue-600 transition-all"><Printer size={18}/> Download Analisis PDF</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                    <tr><th className="p-8 text-center">No</th><th className="p-8">Waktu</th><th className="p-8">Keterangan</th><th className="p-8">Metode</th><th className="p-8 text-right">Nominal</th><th className="p-8 text-center">Otoritas</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="p-8 text-center font-black text-gray-200">{idx + 1}</td>
                        <td className="p-8 font-bold text-gray-400 text-xs">{t.date?.toDate ? t.date.toDate().toLocaleString('id-ID') : '-'}</td>
                        <td className="p-8"><div className="font-black text-gray-800 uppercase tracking-tight text-lg">{t.description}</div><div className="text-[10px] font-bold text-blue-500 uppercase mt-1">{t.category}</div></td>
                        <td className="p-8 text-center"><span className="bg-gray-100 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{t.method}</span></td>
                        <td className={`p-8 text-right font-black text-2xl ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} Rp {formatRupiah(t.amount)}</td>
                        <td className="p-8 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={()=>handleOwnerAction('edit', t)} className="p-3 bg-yellow-50 text-yellow-600 rounded-2xl hover:bg-yellow-600 hover:text-white transition-all shadow-sm"><Edit size={18}/></button>
                            <button onClick={()=>handleOwnerAction('delete', t)} className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={18}/></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'invoices' && (
            <div className="p-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-12">
                <div>
                  <h3 className="text-3xl font-black text-gray-800 tracking-tighter uppercase">Piutang & Tagihan</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 italic">Siswa yang sudah lunas akan otomatis hilang dari daftar ini.</p>
                </div>
                <button onClick={()=>setShowManualInv(true)} className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex gap-3 hover:bg-orange-500 transition-all"><Plus size={18}/> Manual Invoice</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-10 border-4 border-gray-50 rounded-[3.5rem] bg-white shadow-sm hover:border-orange-200 transition-all group">
                    <div className="flex justify-between items-start mb-8">
                      <div><h4 className="font-black text-2xl text-gray-800 uppercase tracking-tighter group-hover:text-orange-600 transition-colors">{inv.studentName}</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.details}</p></div>
                      <span className="px-5 py-2 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-600 shadow-sm">Piutang</span>
                    </div>
                    <div className="mb-10">
                      <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Sisa</p>
                      <p className="text-5xl font-black text-red-600 tracking-tighter">Rp {formatRupiah(inv.remainingAmount)}</p>
                    </div>
                    <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">LUNASKAN SEKARANG</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'input' && (
            <div className="p-12 max-w-4xl mx-auto animate-in slide-in-from-right duration-500">
               <div className="bg-gray-50 p-12 rounded-[4rem] border-4 border-gray-100">
                  <div className="flex gap-6 mb-12 bg-white p-3 rounded-[2.5rem] shadow-inner">
                    <button onClick={()=>setInputType('income')} className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${inputType==='income'?'bg-green-600 text-white shadow-2xl scale-105':'text-gray-400'}`}>Uang Masuk</button>
                    <button onClick={()=>setInputType('expense')} className={`flex-1 py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${inputType==='expense'?'bg-red-600 text-white shadow-2xl scale-105':'text-gray-400'}`}>Uang Keluar</button>
                  </div>
                  <form onSubmit={handleInputTransaction} className="space-y-10">
                    <div className="space-y-3"><label className="lbl ml-6">Keterangan Transaksi</label><input required className="w-full border-4 border-white p-6 rounded-3xl font-black text-2xl outline-none focus:border-blue-600 shadow-md" value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-10">
                      <div className="space-y-3"><label className="lbl ml-6">Kategori</label><select className="w-full border-4 border-white p-6 rounded-3xl font-black text-xl outline-none" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>{inputType==='income'?(<><option>Sponsor</option><option>Hibah</option><option>Penjualan</option><option>Lainnya</option></>):(<><option>Gaji Guru</option><option>Operasional</option><option>Listrik/Air</option><option>Sewa</option><option>Lainnya</option></>)}</select></div>
                      <div className="space-y-3"><label className="lbl ml-6">Akun Kas</label><select className="w-full border-4 border-white p-6 rounded-3xl font-black text-xl outline-none" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}><option value="Tunai">Tunai (Kas)</option><option value="Transfer">Bank (Transfer)</option></select></div>
                    </div>
                    <div className="space-y-3"><label className="lbl ml-6">Nominal (Rp)</label><input required className="w-full border-4 border-white p-8 rounded-3xl font-black text-6xl text-blue-600 outline-none shadow-md" value={newTrans.amountStr} onChange={e => setNewTrans({...newTrans, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                    <button className={`w-full py-8 rounded-[2.5rem] font-black text-3xl uppercase tracking-widest shadow-2xl transition-all active:scale-95 ${inputType==='income'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'} text-white`}>SIMPAN DATA</button>
                  </form>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- OWNER SECURITY MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white w-full max-w-md rounded-[4rem] p-16 text-center shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
            <div className="w-28 h-28 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-50 shadow-inner"><Lock size={56}/></div>
            <h3 className="text-3xl font-black uppercase mb-2 tracking-tighter">Otoritas Owner</h3>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-12">Masukkan sandi khusus untuk mutasi.</p>
            <form onSubmit={verifyOwner} className="space-y-10">
              <input autoFocus type="password" value={ownerInput} onChange={e=>setOwnerInput(e.target.value)} className="w-full bg-gray-50 border-4 border-gray-100 p-8 rounded-[2rem] text-center text-6xl font-black tracking-[0.5em] outline-none focus:border-red-500" placeholder="••••"/>
              <div className="flex gap-4"><button type="button" onClick={()=>setShowVerifyModal(false)} className="flex-1 py-6 rounded-2xl font-black text-gray-400 uppercase tracking-widest">Batal</button><button type="submit" className="flex-1 bg-red-600 text-white py-6 rounded-2xl font-black uppercase tracking-widest shadow-2xl">Buka</button></div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .lbl { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.2em; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}