import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, FileSpreadsheet, Printer, Edit, Lock, Eye, EyeOff, Calendar } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); 
  const [showBalance, setShowBalance] = useState(true); // Fitur Intip Saldo

  // Data State
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [totalPiutang, setTotalPiutang] = useState(0);
  const [monthlyStats, setMonthlyStats] = useState([]);

  // Modal State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);
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
      setTotalPiutang(all.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0));
    });

    // 2. Ambil Mutasi & Hitung Saldo (Tunai vs Bank)
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), s => {
      const trans = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      
      let cash = 0, bank = 0, inc = 0, exp = 0;
      const statsObj = {};

      trans.forEach(t => {
        const amt = t.amount || 0;
        if (t.type === 'expense') {
          exp += amt;
          if (t.method === 'Tunai') cash -= amt; else bank -= amt;
        } else {
          inc += amt;
          if (t.method === 'Tunai') cash += amt; else bank += amt;
        }

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
      setIncomeTotal(inc); setExpenseTotal(exp);
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
    if (amount <= 0) return alert("Nominal tidak boleh 0");
    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'invoices', selectedInvoice.id);
        const rem = selectedInvoice.remainingAmount - amount;
        t.update(ref, { remainingAmount: rem, status: rem <= 0 ? 'paid' : 'partial' });
        t.set(doc(collection(db, 'payments')), { 
          invoiceId: selectedInvoice.id, studentName: selectedInvoice.studentName, 
          amount, method: payMethod, type: 'income', category: 'SPP/Tagihan',
          description: `Bayar: ${selectedInvoice.studentName}`, date: serverTimestamp() 
        });
      });
      setShowPayModal(false); setPayAmountStr(""); alert("Pembayaran Berhasil!");
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

  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();
    if (!newInv.studentId) return alert("Pilih Siswa!");
    const amount = parseRupiah(newInv.totalAmountStr);
    const student = students.find(s => s.id === newInv.studentId);
    await addDoc(collection(db, 'invoices'), {
      studentId: newInv.studentId, studentName: student.name,
      totalAmount: amount, remainingAmount: amount, status: 'unpaid',
      dueDate: newInv.dueDate, details: newInv.details, type: 'manual', createdAt: serverTimestamp()
    });
    setShowManualInv(false); setNewInv({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });
    alert("Tagihan Diterbitkan!");
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* 1. PDF PRINT TEMPLATE (FIXED TABLE) */}
      <div className="hidden print:block w-full bg-white text-black p-4">
        <div className="text-center border-b-4 border-black pb-4 mb-8">
          <h1 className="text-3xl font-black uppercase">Laporan Keuangan Bimbel Gemilang</h1>
          <p className="font-bold uppercase tracking-widest text-sm">Periode: 2026</p>
        </div>
        
        <table className="w-full mb-8 border-collapse">
          <tbody>
            <tr>
              <td className="border-2 border-black p-3 text-center"><b>Total Masuk:</b><br/>Rp {formatRupiah(incomeTotal)}</td>
              <td className="border-2 border-black p-3 text-center"><b>Total Keluar:</b><br/>Rp {formatRupiah(expenseTotal)}</td>
              <td className="border-2 border-black p-3 text-center bg-gray-100"><b>Saldo Bersih:</b><br/>Rp {formatRupiah(balance.total)}</td>
              <td className="border-2 border-black p-3 text-center"><b>Piutang Siswa:</b><br/>Rp {formatRupiah(totalPiutang)}</td>
            </tr>
          </tbody>
        </table>

        <h3 className="font-black mb-2 uppercase text-sm">Mutasi Kas Terbaru</h3>
        <table className="w-full text-[10px] border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 w-8">No</th>
              <th className="border border-black p-1">Tanggal</th>
              <th className="border border-black p-1">Keterangan</th>
              <th className="border border-black p-1 text-right">Masuk</th>
              <th className="border border-black p-1 text-right">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={i}>
                <td className="border border-black p-1 text-center">{i+1}</td>
                <td className="border border-black p-1">{t.date?.toDate ? t.date.toDate().toLocaleDateString() : '-'}</td>
                <td className="border border-black p-1 font-bold">{t.description}</td>
                <td className="border border-black p-1 text-right">{t.type==='income' ? formatRupiah(t.amount) : ''}</td>
                <td className="border border-black p-1 text-right">{t.type==='expense' ? formatRupiah(t.amount) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 2. DASHBOARD UI (ACTIVE SCREEN) */}
      <div className="print:hidden space-y-10">
        
        {/* STATS CARDS DENGAN SALDO TUNAI/BANK & INTIP SALDO */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl lg:col-span-2 relative overflow-hidden">
            <div className="flex justify-between items-center mb-2">
              <p className="opacity-40 uppercase font-black text-[10px] tracking-widest">Saldo Kumulatif</p>
              <button onClick={() => setShowBalance(!showBalance)} className="opacity-40 hover:opacity-100 transition-all">
                {showBalance ? <Eye size={20}/> : <EyeOff size={20}/>}
              </button>
            </div>
            <div className="text-8xl font-black tracking-tighter mb-6">
              {showBalance ? `Rp ${formatRupiah(balance.total)}` : 'Rp ••••••••'}
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
               <div><p className="text-[10px] font-black opacity-30 uppercase mb-1">Kas Tunai</p><p className="text-2xl font-black text-green-400">Rp {formatRupiah(balance.cash)}</p></div>
               <div><p className="text-[10px] font-black opacity-30 uppercase mb-1">Transfer/Bank</p><p className="text-2xl font-black text-blue-400">Rp {formatRupiah(balance.bank)}</p></div>
            </div>
          </div>
          <div className="bg-orange-50 p-10 rounded-[3.5rem] border border-orange-100 shadow-xl flex flex-col justify-center">
            <div className="text-orange-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><Receipt size={20}/> Total Piutang</div>
            <div className="text-5xl font-black text-orange-700">Rp {formatRupiah(totalPiutang)}</div>
          </div>
          <div className="bg-green-50 p-10 rounded-[3.5rem] border border-green-100 shadow-xl flex flex-col justify-center">
            <div className="text-green-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><TrendingUp size={20}/> Laba Bersih</div>
            <div className="text-5xl font-black text-green-700">Rp {formatRupiah(incomeTotal - expenseTotal)}</div>
          </div>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex bg-gray-100 p-3 rounded-[3rem] w-fit shadow-inner gap-2">
          {[{id:'summary', l:'Mutasi Kas', i:PieChart}, {id:'invoices', l:'Piutang Siswa', i:Receipt}, {id:'input', l:'Catat Kas', i:Wallet}]
          .map(m => (
            <button key={m.id} onClick={()=>setTab(m.id)} className={`px-12 py-6 rounded-[2.5rem] font-black text-sm flex items-center gap-3 transition-all ${tab===m.id?'bg-white text-blue-600 shadow-2xl scale-105':'text-gray-400 hover:text-gray-600'}`}>
              <m.i size={24}/> {m.l}
            </button>
          ))}
        </div>

        {/* CONTENT AREA */}
        <div className="bg-white rounded-[4.5rem] border shadow-2xl overflow-hidden min-h-[700px]">
          
          {/* TAB 1: MUTASI */}
          {tab === 'summary' && (
            <div className="animate-in fade-in duration-500">
              <div className="p-12 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="text-4xl font-black text-gray-800 uppercase tracking-tighter">Riwayat Transaksi</h3>
                <button onClick={() => window.print()} className="bg-slate-800 text-white px-12 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-black transition-all">
                  <Printer size={24}/> Cetak PDF / Laporan
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b">
                    <tr><th className="p-10 text-center">No</th><th className="p-10">Waktu</th><th className="p-10">Keterangan</th><th className="p-10 text-center">Metode</th><th className="p-10 text-right">Nominal</th><th className="p-10 text-center">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="p-10 text-center font-black text-gray-200">{idx + 1}</td>
                        <td className="p-10 font-bold text-gray-400 text-sm">{t.date?.toDate ? t.date.toDate().toLocaleString('id-ID') : '-'}</td>
                        <td className="p-10"><div className="font-black text-gray-800 uppercase text-xl">{t.description}</div><div className="text-xs font-black text-blue-500 uppercase mt-1">{t.category}</div></td>
                        <td className="p-10 text-center"><span className="bg-slate-100 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">{t.method}</span></td>
                        <td className={`p-10 text-right font-black text-3xl ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} Rp {formatRupiah(t.amount)}</td>
                        <td className="p-10 text-center flex justify-center gap-2">
                           <button onClick={()=>handleOwnerAction('edit', t)} className="p-4 bg-yellow-100 text-yellow-600 rounded-3xl hover:bg-yellow-600 hover:text-white transition-all"><Edit size={20}/></button>
                           <button onClick={()=>handleOwnerAction('delete', t)} className="p-4 bg-red-100 text-red-600 rounded-3xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={20}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PIUTANG (FIXED DATE VISIBILITY) */}
          {tab === 'invoices' && (
            <div className="p-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-12">
                <div><h3 className="text-4xl font-black text-gray-800 uppercase tracking-tighter">Daftar Tagihan Belum Lunas</h3><p className="text-sm text-gray-400 font-bold uppercase mt-2">Daftar hutang siswa yang belum terselesaikan.</p></div>
                <button onClick={()=>setShowManualInv(true)} className="bg-slate-950 text-white px-12 py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl flex gap-4 hover:bg-orange-600 transition-all"><Plus size={24}/> Buat Tagihan Baru</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-12 border-[6px] border-gray-50 rounded-[4rem] bg-white shadow-sm hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start mb-8">
                      <div><h4 className="font-black text-3xl text-gray-800 uppercase tracking-tighter">{inv.studentName}</h4><p className="text-xs font-bold text-gray-400 uppercase mt-1">{inv.details}</p></div>
                      <span className="px-6 py-2 rounded-full text-[10px] font-black uppercase bg-red-50 text-red-500 border border-red-100 tracking-tighter">Tertunggak</span>
                    </div>
                    <div className="space-y-4 mb-10">
                      <div><p className="text-[10px] font-black text-gray-400 uppercase mb-1">Sisa Piutang</p><p className="text-5xl font-black text-red-600 tracking-tighter">Rp {formatRupiah(inv.remainingAmount)}</p></div>
                      <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <Calendar size={14}/> Jatuh Tempo: {inv.dueDate || '-'}
                      </div>
                    </div>
                    <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">Terima Cicilan</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: INPUT TRANSAKSI */}
          {tab === 'input' && (
            <div className="p-12 max-w-5xl mx-auto animate-in slide-in-from-right duration-500">
               <div className="bg-slate-50 p-16 rounded-[4rem] border-[6px] border-white shadow-inner">
                  <div className="flex gap-8 mb-16 bg-white p-4 rounded-[3rem] shadow-xl">
                    <button onClick={()=>setInputType('income')} className={`flex-1 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${inputType==='income'?'bg-green-600 text-white shadow-2xl scale-105':'text-gray-400'}`}>Uang Masuk</button>
                    <button onClick={()=>setInputType('expense')} className={`flex-1 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${inputType==='expense'?'bg-red-600 text-white shadow-2xl scale-105':'text-gray-400'}`}>Uang Keluar</button>
                  </div>
                  <form onSubmit={handleInputTransaction} className="space-y-12">
                    <div className="space-y-4"><label className="lbl ml-8">Keterangan Transaksi</label><input required className="w-full border-[6px] border-white p-8 rounded-[2.5rem] font-black text-3xl outline-none focus:border-blue-600 shadow-xl" value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-4"><label className="lbl ml-8">Kategori</label><select className="w-full border-[6px] border-white p-8 rounded-[2.5rem] font-black text-2xl outline-none" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>{inputType==='income'?(<><option>Sponsor</option><option>Hibah</option><option>Lainnya</option></>):(<><option>Gaji Guru</option><option>Operasional</option><option>Listrik/Air</option><option>Sewa</option><option>Lainnya</option></>)}</select></div>
                      <div className="space-y-4"><label className="lbl ml-8">Metode</label><select className="w-full border-[6px] border-white p-8 rounded-[2.5rem] font-black text-2xl outline-none" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}><option value="Tunai">Tunai</option><option value="Transfer">Bank</option></select></div>
                    </div>
                    <div className="space-y-4"><label className="lbl ml-8">Nominal Rp</label><input required className="w-full border-[6px] border-white p-10 rounded-[3rem] font-black text-7xl text-blue-600 outline-none shadow-2xl" value={newTrans.amountStr} onChange={e => setNewTrans({...newTrans, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                    <button className={`w-full py-10 rounded-[3rem] font-black text-4xl uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${inputType==='income'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'} text-white`}>SIMPAN DATA</button>
                  </form>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* --- OWNER SECURITY MODAL --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 backdrop-blur-xl">
          <div className="bg-white w-full max-w-lg rounded-[4rem] p-16 text-center shadow-2xl">
            <div className="w-32 h-32 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-10 border-[6px] border-red-50"><Lock size={64}/></div>
            <h3 className="text-4xl font-black uppercase mb-4">Otoritas Owner</h3>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-12">Masukkan sandi khusus owner.</p>
            <form onSubmit={verifyOwner} className="space-y-10">
              <input autoFocus type="password" value={ownerInput} onChange={e=>setOwnerInput(e.target.value)} className="w-full bg-gray-50 border-[6px] border-gray-100 p-8 rounded-[2.5rem] text-center text-7xl font-black tracking-[0.5em] outline-none focus:border-red-500" placeholder="••••"/>
              <div className="flex gap-4"><button type="button" onClick={()=>setShowVerifyModal(false)} className="flex-1 py-8 rounded-2xl font-black text-gray-400 uppercase tracking-widest bg-gray-100">Batal</button><button type="submit" className="flex-1 bg-red-600 text-white py-8 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-red-200">Buka</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- ADD MANUAL INVOICE MODAL (FIXED ERROR PUTIH) --- */}
      {showManualInv && (
        <div className="fixed inset-0 bg-slate-950/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-12 shadow-2xl animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black uppercase tracking-tighter">Tambah Tagihan</h3><button onClick={()=>setShowManualInv(false)}><X size={48}/></button></div>
            <form onSubmit={handleCreateManualInvoice} className="space-y-8">
              <select required className="w-full border-4 border-gray-100 p-6 rounded-[2rem] font-black text-xl bg-gray-50 outline-none" value={newInv.studentId} onChange={e=>setNewInv({...newInv, studentId:e.target.value})}>
                <option value="">-- Pilih Siswa --</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input required className="w-full border-4 border-gray-100 p-6 rounded-[2rem] font-black text-2xl shadow-inner" placeholder="Nominal Rp" value={newInv.totalAmountStr} onChange={e=>setNewInv({...newInv, totalAmountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/>
              <input className="w-full border-4 border-gray-100 p-6 rounded-[2rem] font-black text-xl" placeholder="Keterangan (Buku/Lainnya)" value={newInv.details} onChange={e=>setNewInv({...newInv, details:e.target.value})}/>
              <div><label className="text-[10px] font-black text-gray-400 uppercase ml-6 mb-2 block">Jatuh Tempo</label><input type="date" required className="w-full border-4 border-gray-100 p-6 rounded-[2rem] font-black text-xl" value={newInv.dueDate} onChange={e=>setNewInv({...newInv, dueDate:e.target.value})}/></div>
              <button className="w-full bg-slate-950 text-white py-10 rounded-[3rem] font-black text-3xl shadow-2xl">TERBITKAN INVOICE</button>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] p-16 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-12"><h3 className="text-4xl font-black uppercase tracking-tighter">Pelunasan Piutang</h3><button onClick={()=>setShowPayModal(false)}><X size={48}/></button></div>
             <form onSubmit={handleProcessPayment} className="space-y-10">
               <div className="bg-blue-50 p-12 rounded-[3.5rem] text-center border-[6px] border-blue-100"><p className="text-xs font-black text-blue-400 uppercase mb-4 tracking-widest">Hutang Siswa</p><p className="text-7xl font-black text-blue-800 tracking-tighter">Rp {formatRupiah(selectedInvoice.remainingAmount)}</p></div>
               <div className="grid grid-cols-2 gap-10">
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Akun Masuk</label><select className="w-full border-4 border-gray-100 p-8 rounded-[2.5rem] font-black text-2xl" value={payMethod} onChange={e=>setPayMethod(e.target.value)}><option value="Tunai">Tunai (Kas)</option><option value="Transfer">Bank (Transfer)</option></select></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Nominal Bayar</label><input required className="w-full border-4 border-gray-100 p-8 rounded-[2.5rem] font-black text-3xl shadow-inner" value={payAmountStr} onChange={e=>setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/></div>
               </div>
               <button className="w-full bg-blue-600 text-white py-10 rounded-[3rem] font-black text-3xl shadow-2xl hover:bg-blue-700 uppercase tracking-widest">TERIMA PEMBAYARAN</button>
             </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL (OWNER ONLY) --- */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] p-16 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-4xl font-black uppercase mb-12 text-blue-600 tracking-tighter">Koreksi Transaksi</h3>
            <form onSubmit={saveEditMutasi} className="space-y-8">
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Keterangan</label><input className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Nominal</label><input className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={editForm.amountStr} onChange={e=>setEditForm({...editForm, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Metode</label><select className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={editForm.method} onChange={e=>setEditForm({...editForm, method: e.target.value})}><option>Tunai</option><option>Transfer</option></select></div>
              </div>
              <div className="flex gap-6 pt-10"><button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-8 rounded-[2rem] font-black text-gray-400 uppercase bg-gray-50 border-2">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white py-8 rounded-[2rem] font-black uppercase shadow-2xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .lbl { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.2em; display: block; margin-bottom: 8px; }
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}