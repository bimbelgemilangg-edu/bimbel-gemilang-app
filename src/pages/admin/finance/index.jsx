import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, PlusCircle, Receipt, LayoutDashboard, Eye, EyeOff, CreditCard, Banknote, Trash2, CheckCircle, ShieldAlert } from 'lucide-react';

// --- 🛡️ JURUS 1: ANTI-BLANK (Penerjemah Tanggal Universal) ---
const safeDate = (d) => {
  if (!d) return "-";
  if (typeof d === 'object' && d.seconds) return new Date(d.seconds * 1000).toLocaleDateString('id-ID');
  return d.toString();
};

const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    if (!db) return;
    const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, "invoices"), s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, [db]);

  // --- 🛡️ JURUS 2: STANDARDISASI LOGIKA (Anti-Terbalik & Anti-Nol) ---
  const checkIsIncome = (t) => {
    const type = String(t.type || '').toLowerCase();
    const cat = String(t.category || '').toLowerCase();
    // Jika tipenya income/pemasukan, ATAU kategori pendaftaran/spp (pastikan bukan pengeluaran)
    if (type === 'income' || type === 'pemasukan') return true;
    if ((cat === 'pendaftaran' || cat === 'spp') && type !== 'expense' && type !== 'pengeluaran') return true;
    return false;
  };

  const incomeTotal = transactions.reduce((acc, t) => checkIsIncome(t) ? acc + (Number(t.amount) || 0) : acc, 0);
  const expenseTotal = transactions.reduce((acc, t) => !checkIsIncome(t) ? acc + (Number(t.amount) || 0) : acc, 0);
  const piutangTotal = invoices.reduce((acc, inv) => acc + (Number(inv.remainingAmount) || 0), 0);

  // Hitung Saldo per Wadah (Cash vs Bank)
  const getBal = (methodType) => {
    return transactions.reduce((acc, t) => {
      const m = String(t.method || '').toLowerCase();
      const target = methodType === 'Cash' ? ['cash', 'tunai'] : ['bank', 'transfer'];
      if (target.includes(m)) {
        return checkIsIncome(t) ? acc + Number(t.amount) : acc - Number(t.amount);
      }
      return acc;
    }, 0);
  };

  const cashBalance = getBal('Cash');
  const bankBalance = getBal('Bank');

  const handleDelete = async (tId) => {
    const pwd = prompt("Sandi Owner:");
    if (!pwd) return;
    const snap = await getDoc(doc(db, "settings", "owner_auth"));
    if (pwd === (snap.exists() ? snap.data().password : "2003")) {
      await deleteDoc(doc(db, "payments", tId));
      alert("Terhapus!");
    } else { alert("Salah!"); }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white p-5 border-b flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl tracking-tighter italic text-slate-800 uppercase">Gemilang Finance <span className="text-blue-600">Final</span></h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {[{id:'summary', l:'Dashboard', i:LayoutDashboard}, {id:'input', l:'Catat Kas', i:PlusCircle}, {id:'invoices', l:'Piutang', i:Receipt}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 transition-all ${activeTab===t.id?'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              <t.i size={14}/> {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* KARTU SALDO GABUNGAN */}
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <button onClick={() => setShowBalance(!showBalance)} className="absolute top-6 right-6 text-slate-500 hover:text-white">
                  {showBalance ? <EyeOff size={20}/> : <Eye size={20}/>}
                </button>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-2">Total Kas</p>
                <p className="text-3xl font-black">{showBalance ? formatIDR(cashBalance + bankBalance) : "Rp ••••••••"}</p>
                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                   <div><p className="text-[9px] font-black opacity-30 uppercase">💵 Tunai</p><p className="font-black text-sm">{showBalance ? formatIDR(cashBalance) : "Rp •••"}</p></div>
                   <div><p className="text-[9px] font-black opacity-30 uppercase">🏦 Bank</p><p className="font-black text-sm text-blue-400">{showBalance ? formatIDR(bankBalance) : "Rp •••"}</p></div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-3xl border-l-8 border-green-500 shadow-sm flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pemasukan</p><p className="text-2xl font-black text-green-600">{formatIDR(incomeTotal)}</p></div>
                  <TrendingUp className="text-green-100" size={40}/>
                </div>
                <div className="bg-white p-6 rounded-3xl border-l-8 border-red-500 shadow-sm flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pengeluaran</p><p className="text-2xl font-black text-red-600">{formatIDR(expenseTotal)}</p></div>
                  <TrendingDown className="text-red-100" size={40}/>
                </div>
              </div>

              <div className="bg-orange-600 text-white p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-center text-center">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Total Piutang</p>
                <p className="text-3xl font-black">{formatIDR(piutangTotal)}</p>
              </div>
            </div>

            {/* DAFTAR MUTASI */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <h3 className="font-black text-[10px] uppercase text-slate-400 mb-8 tracking-[0.4em]">Riwayat Mutasi Real-Time</h3>
              <div className="space-y-4">
                {transactions.map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl shadow-sm ${['bank','transfer'].includes(String(t.method).toLowerCase()) ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {['bank','transfer'].includes(String(t.method).toLowerCase()) ? <CreditCard size={20}/> : <Banknote size={20}/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase">{t.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {safeDate(t.date)} • {t.method} • {t.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <p className={`font-black text-base ${checkIsIncome(t) ? 'text-green-600' : 'text-red-600'}`}>
                        {checkIsIncome(t) ? '+' : '-'} {formatIDR(t.amount)}
                      </p>
                      <button onClick={() => handleDelete(t.id)} className="text-slate-200 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all p-2"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'input' && <FinanceFormInput db={db} />}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices} />}
      </div>
    </div>
  );
}

// --- KOMPONEN INPUT ---
function FinanceFormInput({ db }) {
  const [type, setType] = useState('income');
  const [method, setMethod] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('Lainnya');
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, method, amount: Number(amount), description: desc, category: cat,
        date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("✅ Berhasil!");
    } catch (e) { alert("Error!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100">
      <form onSubmit={save} className="space-y-8">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button type="button" onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase ${type==='income'?'bg-green-600 text-white shadow-lg':'text-slate-400'}`}>Uang Masuk</button>
          <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase ${type==='expense'?'bg-red-600 text-white shadow-lg':'text-slate-400'}`}>Uang Keluar</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={()=>setMethod('Cash')} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 ${method==='Cash'?'border-orange-500 bg-orange-500 text-white shadow-md':'border-slate-100 text-slate-400'}`}>💵 Tunai</button>
          <button type="button" onClick={()=>setMethod('Bank')} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 ${method==='Bank'?'border-blue-600 bg-blue-600 text-white shadow-md':'border-slate-100 text-slate-400'}`}>🏦 Bank</button>
        </div>
        <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black text-4xl text-center outline-none" placeholder="0" required />
        <input value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-4 bg-slate-50 border-2 rounded-2xl font-bold" placeholder="Keterangan..." required />
        <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl">{loading ? 'POSTING...' : 'SIMPAN TRANSAKSI'}</button>
      </form>
    </div>
  );
}

// --- KOMPONEN PIUTANG ---
function FinanceInvoices({ db, invoices = [] }) {
  const handlePay = async (inv, amt) => {
    const pay = Number(amt);
    if (isNaN(pay) || pay <= 0) return;
    try {
      const remaining = Math.max(0, inv.remainingAmount - pay);
      await updateDoc(doc(db, "invoices", inv.id), { 
        remainingAmount: remaining, status: remaining <= 0 ? 'paid' : 'unpaid'
      });
      await addDoc(collection(db, "payments"), {
        type: 'income', amount: pay, description: `Pelunasan: ${inv.studentName}`, category: 'SPP', method: 'Cash', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      alert("✅ Pembayaran Berhasil!");
    } catch (e) { alert("Error!"); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {invoices.filter(i => i.remainingAmount > 0).map((inv, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-md">
          <div className="flex-1">
            <p className="font-black text-slate-800 uppercase text-lg">{inv.studentName}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Tempo: {safeDate(inv.dueDate)}</p>
          </div>
          <div className="text-right px-10 border-r mr-10">
            <p className="text-[10px] font-black text-red-400 uppercase">Sisa Tagihan</p>
            <p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
          </div>
          <button onClick={() => {
            const val = prompt(`Bayar cicilan ${inv.studentName}:`, inv.remainingAmount);
            if(val) handlePay(inv, val);
          }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase">BAYAR</button>
        </div>
      ))}
    </div>
  );
}