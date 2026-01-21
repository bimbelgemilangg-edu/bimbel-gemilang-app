import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, FileSpreadsheet, Printer, Edit, Lock, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react';

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
  const [monthlyStats, setMonthlyStats] = useState([]);

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
    // 1. Ambil Tagihan & Piutang (Hanya yang belum lunas)
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => {
      const all = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(all.filter(inv => inv.status !== 'paid'));
      setTotalPiutang(all.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0));
    });

    // 2. Ambil Mutasi & Hitung Analisis
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

  // --- DOWNLOAD EXCEL (FORMAT INDONESIA: TITIK KOMA) ---
  const downloadExcel = () => {
    let csvContent = "\uFEFF"; // Agar simbol Rp dan karakter UTF-8 terbaca
    csvContent += "No;Tanggal;Keterangan;Kategori;Metode;Masuk;Keluar;Saldo Bersih\n";
    
    transactions.forEach((t, idx) => {
      const date = t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-';
      const masuk = t.type === 'income' ? t.amount : 0;
      const keluar = t.type === 'expense' ? t.amount : 0;
      const desc = t.description.replace(/;/g, ","); // Cegah pecah kolom karena titik koma
      csvContent += `${idx + 1};${date};${desc};${t.category};${t.method};${masuk};${keluar};${masuk - keluar}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Laporan_Keuangan_Gemilang_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // --- LOGIKA OWNER & FINANCE ---
  const handleOwnerAction = (type, data) => { setPendingAction({ type, data }); setShowVerifyModal(true); };
  const verifyOwner = async (e) => {
    e.preventDefault();
    const snap = await getDoc(doc(db, "settings", "owner_auth"));
    const correctPass = snap.exists() ? snap.data().password : "2003";
    if (ownerInput === correctPass) {
      if (pendingAction.type === 'delete') await deleteDoc(doc(db, "payments", pendingAction.data.id));
      else if (pendingAction.type === 'edit') { setEditForm({ ...pendingAction.data, amountStr: formatRupiah(pendingAction.data.amount) }); setShowEditModal(true); }
      setShowVerifyModal(false); setOwnerInput(""); setPendingAction(null);
    } else { alert("Sandi Owner Salah!"); }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(payAmountStr);
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
      setShowPayModal(false); alert("Lunas & Masuk Mutasi!");
    } catch (err) { alert(err.message); }
  };

  const handleInputTransaction = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'payments'), {
      amount: parseRupiah(newTrans.amountStr), method: newTrans.method, type: inputType, category: newTrans.category,
      description: newTrans.title, date: serverTimestamp(), studentName: '-' 
    });
    setNewTrans({ title: "", amountStr: "", category: "Lainnya", method: "Tunai" });
    alert("Tersimpan!");
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* ==============================================
          AREA PDF LAPORAN (PRINT ONLY)
          ============================================== */}
      <div className="hidden print:block w-full text-black bg-white font-sans">
        <div className="text-center border-b-[6px] border-black pb-8 mb-10">
          <h1 className="text-5xl font-black uppercase tracking-tighter">LAPORAN KEUANGAN & ANALISIS</h1>
          <p className="text-2xl font-bold mt-2">BIMBEL GEMILANG SYSTEM • TAHUN 2026</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-10">
          <div className="border-4 border-black p-6 text-center"><p className="text-xs font-black uppercase mb-1">TOTAL MASUK</p><p className="text-2xl font-black">Rp {formatRupiah(incomeTotal)}</p></div>
          <div className="border-4 border-black p-6 text-center"><p className="text-xs font-black uppercase mb-1">TOTAL KELUAR</p><p className="text-2xl font-black">Rp {formatRupiah(expenseTotal)}</p></div>
          <div className="border-4 border-black p-6 text-center bg-gray-100"><p className="text-xs font-black uppercase mb-1">SALDO BERSIH</p><p className="text-2xl font-black">Rp {formatRupiah(balance.total)}</p></div>
          <div className="border-4 border-black p-6 text-center"><p className="text-xs font-black uppercase mb-1">PIUTANG AKTIF</p><p className="text-2xl font-black text-red-600">Rp {formatRupiah(totalPiutang)}</p></div>
        </div>

        <div className="mb-12 border-4 border-black p-10 rounded-[3rem]">
          <h3 className="font-black uppercase text-xl mb-10 border-b-4 border-black pb-4 flex items-center gap-4"><BarChart3 size={32}/> Analisis Cashflow Bulanan</h3>
          <div className="flex items-end gap-10 h-[300px] border-b-4 border-l-4 border-black p-6">
            {monthlyStats.map((stat, i) => {
              const max = Math.max(...monthlyStats.map(s => Math.max(s.income, s.expense))) || 1;
              return (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-4">
                  <div className="flex gap-2 w-full justify-center items-end h-[240px]">
                    <div className="w-6 bg-black" style={{ height: `${(stat.income / max) * 100}%` }}></div>
                    <div className="w-6 border-4 border-black bg-white" style={{ height: `${(stat.expense / max) * 100}%` }}></div>
                  </div>
                  <span className="text-xs font-black uppercase">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <h3 className="font-black uppercase text-lg mb-4">Jurnal Mutasi Lengkap</h3>
        <table className="w-full text-[11px] text-left border-collapse border-4 border-black">
          <thead>
            <tr className="bg-gray-100 border-b-4 border-black font-black uppercase">
              <th className="p-3 border-r-4 border-black w-12 text-center">No</th>
              <th className="p-3 border-r-4 border-black">Tanggal</th>
              <th className="p-3 border-r-4 border-black">Keterangan</th>
              <th className="p-3 border-r-4 border-black text-right">Masuk (Rp)</th>
              <th className="p-3 text-right">Keluar (Rp)</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr key={t.id} className="border-b-2 border-black">
                <td className="p-3 border-r-4 border-black text-center font-bold">{idx + 1}</td>
                <td className="p-3 border-r-4 border-black">{t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-'}</td>
                <td className="p-3 border-r-4 border-black font-black">{t.description}</td>
                <td className="p-3 border-r-4 border-black text-right font-bold">{t.type==='income' ? formatRupiah(t.amount) : ''}</td>
                <td className="p-3 text-right font-bold">{t.type==='expense' ? formatRupiah(t.amount) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ==============================================
          DASHBOARD UI (ACTIVE SCREEN)
          ============================================== */}
      <div className="print:hidden space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl lg:col-span-2 relative overflow-hidden">
            <p className="opacity-40 uppercase font-black text-[10px] tracking-widest mb-2">Kas Gemilang</p>
            <div className="text-8xl font-black tracking-tighter">Rp {formatRupiah(balance.total)}</div>
            <div className="absolute top-0 right-0 p-10 opacity-10"><DollarSign size={120}/></div>
          </div>
          <div className="bg-orange-50 p-10 rounded-[3.5rem] border border-orange-100 shadow-xl flex flex-col justify-center">
            <div className="text-orange-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><AlertCircle size={20}/> Total Piutang</div>
            <div className="text-5xl font-black text-orange-700">Rp {formatRupiah(totalPiutang)}</div>
          </div>
          <div className="bg-green-50 p-10 rounded-[3.5rem] border border-green-100 shadow-xl flex flex-col justify-center">
            <div className="text-green-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><TrendingUp size={20}/> Laba Bersih</div>
            <div className="text-5xl font-black text-green-700">Rp {formatRupiah(incomeTotal - expenseTotal)}</div>
          </div>
        </div>

        <div className="flex bg-gray-100 p-3 rounded-[3rem] w-fit shadow-inner gap-2">
          {[{id:'summary', l:'Mutasi Kas', i:PieChart}, {id:'invoices', l:'Piutang Siswa', i:Receipt}, {id:'input', l:'Catat Kas', i:Wallet}]
          .map(m => (
            <button key={m.id} onClick={()=>setTab(m.id)} className={`px-12 py-6 rounded-[2.5rem] font-black text-sm flex items-center gap-3 transition-all ${tab===m.id?'bg-white text-blue-600 shadow-2xl scale-105':'text-gray-400 hover:text-gray-600'}`}>
              <m.i size={24}/> {m.l}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-[4.5rem] border shadow-2xl overflow-hidden min-h-[700px]">
          {tab === 'summary' && (
            <div className="animate-in fade-in duration-500">
              <div className="p-12 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="text-4xl font-black text-gray-800 tracking-tighter uppercase">Jurnal Keuangan</h3>
                <div className="flex gap-4">
                   <button onClick={() => window.print()} className="bg-slate-800 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-black"><Printer size={20}/> Cetak Analisis PDF</button>
                   <button onClick={downloadExcel} className="bg-green-600 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 hover:bg-green-700"><FileSpreadsheet size={20}/> Download Excel</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 border-b">
                    <tr><th className="p-10 text-center">No</th><th className="p-10">Waktu</th><th className="p-10">Keterangan</th><th className="p-10 text-center">Metode</th><th className="p-10 text-right">Nominal</th><th className="p-10 text-center">Aksi</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-blue-50/50 transition-colors group">
                        <td className="p-10 text-center font-black text-gray-200">{idx + 1}</td>
                        <td className="p-10 font-bold text-gray-400 text-sm">{t.date?.toDate ? t.date.toDate().toLocaleString('id-ID') : '-'}</td>
                        <td className="p-10"><div className="font-black text-gray-800 uppercase tracking-tight text-xl">{t.description}</div><div className="text-xs font-black text-blue-500 uppercase mt-1 tracking-widest">{t.category}</div></td>
                        <td className="p-10 text-center"><span className="bg-slate-100 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">{t.method}</span></td>
                        <td className={`p-10 text-right font-black text-3xl ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} Rp {formatRupiah(t.amount)}</td>
                        <td className="p-10 text-center">
                          <div className="flex justify-center gap-3">
                            <button onClick={()=>handleOwnerAction('edit', t)} className="p-4 bg-yellow-100 text-yellow-600 rounded-3xl hover:bg-yellow-600 hover:text-white transition-all shadow-sm"><Edit size={24}/></button>
                            <button onClick={()=>handleOwnerAction('delete', t)} className="p-4 bg-red-100 text-red-600 rounded-3xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
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
                <div><h3 className="text-4xl font-black text-gray-800 uppercase tracking-tighter">Daftar Piutang Siswa</h3><p className="text-sm text-gray-400 font-bold uppercase mt-2">Siswa yang sudah lunas akan otomatis berpindah ke jurnal mutasi.</p></div>
                <button onClick={()=>setShowManualInv(true)} className="bg-slate-950 text-white px-12 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl flex gap-4 hover:bg-orange-600 transition-all"><Plus size={24}/> Tambah Tagihan</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {invoices.map(inv => (
                  <div key={inv.id} className="p-12 border-[6px] border-gray-50 rounded-[4rem] bg-white shadow-sm hover:border-orange-200 transition-all">
                    <div className="flex justify-between items-start mb-8">
                      <div><h4 className="font-black text-3xl text-gray-800 uppercase tracking-tighter">{inv.studentName}</h4><p className="text-xs font-bold text-gray-400 uppercase mt-1">{inv.details}</p></div>
                      <span className="px-6 py-2 rounded-full text-xs font-black uppercase bg-red-100 text-red-600">Terhutang</span>
                    </div>
                    <div className="mb-10"><p className="text-xs font-black text-gray-400 uppercase mb-2">Sisa Piutang</p><p className="text-5xl font-black text-red-600 tracking-tighter">Rp {formatRupiah(inv.remainingAmount)}</p></div>
                    <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="w-full bg-blue-600 text-white py-8 rounded-[2.5rem] font-black text-2xl uppercase tracking-widest shadow-2xl hover:bg-blue-700 active:scale-95 transition-all">Lunaskan</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'input' && (
            <div className="p-12 max-w-5xl mx-auto animate-in slide-in-from-right duration-500">
               <div className="bg-slate-50 p-16 rounded-[4rem] border-[6px] border-white shadow-inner">
                  <div className="flex gap-8 mb-16 bg-white p-4 rounded-[3rem] shadow-xl">
                    <button onClick={()=>setInputType('income')} className={`flex-1 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${inputType==='income'?'bg-green-600 text-white shadow-2xl scale-105':'text-gray-400'}`}>Uang Masuk</button>
                    <button onClick={()=>setInputType('expense')} className={`flex-1 py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-widest transition-all ${inputType==='expense'?'bg-red-600 text-white shadow-2xl scale-105':'text-gray-400'}`}>Uang Keluar</button>
                  </div>
                  <form onSubmit={handleInputTransaction} className="space-y-12">
                    <div className="space-y-4"><label className="text-xs font-black text-gray-400 uppercase ml-8 tracking-widest">Keterangan</label><input required className="w-full border-[6px] border-white p-8 rounded-[2.5rem] font-black text-3xl outline-none focus:border-blue-600 shadow-xl" value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/></div>
                    <div className="grid grid-cols-2 gap-12">
                      <div className="space-y-4"><label className="text-xs font-black text-gray-400 uppercase ml-8 tracking-widest">Kategori</label><select className="w-full border-[6px] border-white p-8 rounded-[2.5rem] font-black text-2xl outline-none" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>{inputType==='income'?(<><option>Sponsor</option><option>Hibah</option><option>Lainnya</option></>):(<><option>Gaji Guru</option><option>Operasional</option><option>Listrik/Air</option><option>Lainnya</option></>)}</select></div>
                      <div className="space-y-4"><label className="text-xs font-black text-gray-400 uppercase ml-8 tracking-widest">Akun Kas</label><select className="w-full border-[6px] border-white p-8 rounded-[2.5rem] font-black text-2xl outline-none" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}><option value="Tunai">Tunai (Kas)</option><option value="Transfer">Bank (Transfer)</option></select></div>
                    </div>
                    <div className="space-y-4"><label className="text-xs font-black text-gray-400 uppercase ml-8 tracking-widest">Nominal</label><input required className="w-full border-[6px] border-white p-10 rounded-[3rem] font-black text-7xl text-blue-600 outline-none shadow-2xl" value={newTrans.amountStr} onChange={e => setNewTrans({...newTrans, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
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
            <h3 className="text-4xl font-black uppercase mb-4 tracking-tighter">Otoritas Owner</h3>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-12">Hanya Owner yang dapat merubah Mutasi.</p>
            <form onSubmit={verifyOwner} className="space-y-10">
              <input autoFocus type="password" value={ownerInput} onChange={e=>setOwnerInput(e.target.value)} className="w-full bg-gray-50 border-[6px] border-gray-100 p-8 rounded-[2.5rem] text-center text-7xl font-black tracking-[0.5em] outline-none focus:border-red-500" placeholder="••••"/>
              <div className="flex gap-4"><button type="button" onClick={()=>setShowVerifyModal(false)} className="flex-1 py-8 rounded-[2rem] font-black text-gray-400 uppercase tracking-widest bg-gray-100">Batal</button><button type="submit" className="flex-1 bg-red-600 text-white py-8 rounded-[2rem] font-black uppercase tracking-widest shadow-2xl shadow-red-200">Verifikasi</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL (OWNER ONLY) --- */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] p-16 shadow-2xl">
            <h3 className="text-4xl font-black uppercase mb-12 text-blue-600 tracking-tighter">Koreksi Data</h3>
            <form onSubmit={saveEditMutasi} className="space-y-8">
              <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Deskripsi</label><input className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Nominal</label><input className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={editForm.amountStr} onChange={e=>setEditForm({...editForm, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Metode</label><select className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={editForm.method} onChange={e=>setEditForm({...editForm, method: e.target.value})}><option>Tunai</option><option>Transfer</option></select></div>
              </div>
              <div className="flex gap-6 pt-10"><button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-8 rounded-[2rem] font-black text-gray-400 uppercase bg-gray-100">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white py-8 rounded-[2rem] font-black uppercase shadow-2xl">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* --- PAYMENT MODAL --- */}
      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl rounded-[4rem] p-16 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-12"><h3 className="text-4xl font-black uppercase tracking-tighter">Pelunasan Piutang</h3><button onClick={()=>setShowPayModal(false)}><X size={48}/></button></div>
             <form onSubmit={handleProcessPayment} className="space-y-10">
               <div className="bg-blue-50 p-12 rounded-[3.5rem] text-center border-[6px] border-blue-100"><p className="text-xs font-black text-blue-400 uppercase mb-4 tracking-widest">Sisa Hutang Siswa</p><p className="text-7xl font-black text-blue-800 tracking-tighter">Rp {formatRupiah(selectedInvoice.remainingAmount)}</p></div>
               <div className="grid grid-cols-2 gap-10">
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Metode</label><select className="w-full border-4 border-gray-100 p-8 rounded-[2.5rem] font-black text-2xl" value={payMethod} onChange={e=>setPayMethod(e.target.value)}><option value="Tunai">Tunai</option><option value="Transfer">Bank</option></select></div>
                 <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-6">Nominal Diterima</label><input required className="w-full border-4 border-gray-100 p-8 rounded-[2.5rem] font-black text-3xl shadow-inner" value={payAmountStr} onChange={e=>setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/></div>
               </div>
               <button className="w-full bg-blue-600 text-white py-10 rounded-[3rem] font-black text-3xl shadow-2xl hover:bg-blue-700 uppercase tracking-widest">Terima Pembayaran</button>
             </form>
          </div>
        </div>
      )}

      {/* --- MANUAL INVOICE MODAL --- */}
      {showManualInv && (
        <div className="fixed inset-0 bg-slate-950/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[4rem] p-16 shadow-2xl">
            <div className="flex justify-between items-center mb-12"><h3 className="text-4xl font-black uppercase tracking-tighter">Tagihan Manual</h3><button onClick={()=>setShowManualInv(false)}><X size={48}/></button></div>
            <form onSubmit={handleCreateManualInvoice} className="space-y-8">
              <select required className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={newInv.studentId} onChange={e=>setNewInv({...newInv, studentId:e.target.value})}><option value="">Pilih Murid</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input required className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-3xl" placeholder="Nominal Rp" value={newInv.totalAmountStr} onChange={e=>setNewInv({...newInv, totalAmountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/>
              <input className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" placeholder="Alasan (Buku/Lainnya)" value={newInv.details} onChange={e=>setNewInv({...newInv, details:e.target.value})}/>
              <input type="date" required className="w-full border-4 border-gray-100 p-8 rounded-[2rem] font-black text-2xl" value={newInv.dueDate} onChange={e=>setNewInv({...newInv, dueDate:e.target.value})}/>
              <button className="w-full bg-slate-950 text-white py-10 rounded-[3rem] font-black text-3xl uppercase tracking-widest shadow-2xl">Terbitkan</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}