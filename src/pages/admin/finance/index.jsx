import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  Wallet, TrendingUp, TrendingDown, AlertCircle, PlusCircle, 
  Receipt, LayoutDashboard, Send, Eye, EyeOff, CreditCard, 
  Banknote, Trash2, CheckCircle 
} from 'lucide-react';

// --- HELPER 1: OBAT ANTI-BLANK (Penerjemah Tanggal) ---
const renderSafeDate = (dateVal) => {
  if (!dateVal) return "-";
  if (typeof dateVal === 'object' && dateVal.seconds) {
    return new Date(dateVal.seconds * 1000).toLocaleDateString('id-ID');
  }
  return dateVal.toString();
};

// --- HELPER 2: FORMAT RUPIAH ---
const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

// ==========================================
// 1. KOMPONEN: DASHBOARD (SUMMARY)
// ==========================================
const FinanceSummary = ({ transactions = [], invoices = [], balance = 0, showBalance, setShowBalance }) => {
  const safeTrans = Array.isArray(transactions) ? transactions : [];
  const safeInv = Array.isArray(invoices) ? invoices : [];

  const income = safeTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const expense = safeTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const piutang = safeInv.reduce((acc, inv) => acc + (Number(inv.remainingAmount) || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
          <button onClick={() => setShowBalance(!showBalance)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
            {showBalance ? <EyeOff size={18}/> : <Eye size={18}/>}
          </button>
          <p className="text-[10px] font-black opacity-50 uppercase mb-1 tracking-widest">Saldo Kas Total</p>
          <p className="text-3xl font-black">{showBalance ? formatIDR(balance) : "Rp ••••••••"}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-green-500 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Pemasukan</p>
          <p className="text-xl font-black text-green-600">{formatIDR(income)}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-red-500 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Pengeluaran</p>
          <p className="text-xl font-black text-red-600">{formatIDR(expense)}</p>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-b-4 border-orange-500 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Piutang Siswa</p>
          <p className="text-xl font-black text-orange-600">{formatIDR(piutang)}</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h3 className="font-black text-[10px] uppercase text-slate-400 mb-6 flex items-center gap-2 tracking-[0.2em]">Arus Kas Terakhir</h3>
        <div className="space-y-4">
          {safeTrans.slice(0, 10).map((t, i) => (
            <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${t.method === 'Bank' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                  {t.method === 'Bank' ? <CreditCard size={18}/> : <Banknote size={18}/>}
                </div>
                <div>
                  <p className="font-black text-slate-800 text-sm uppercase">{t.description}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {renderSafeDate(t.date)} • {t.method || 'Cash'} • {t.category}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className={`font-black text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. KOMPONEN: INPUT KAS
// ==========================================
const FinanceFormInput = ({ db }) => {
  const [type, setType] = useState('income');
  const [method, setMethod] = useState('Cash');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Isi data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, method, amount: Number(amount), description: desc, category: 'Kas Umum',
        date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Tersimpan!");
    } catch (e) { alert("Gagal!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100">
      <form onSubmit={save} className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button type="button" onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${type==='income'?'bg-green-500 text-white shadow-lg':'text-slate-400'}`}>Pemasukan</button>
          <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${type==='expense'?'bg-red-500 text-white shadow-lg':'text-slate-400'}`}>Pengeluaran</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={()=>setMethod('Cash')} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${method==='Cash'?'border-slate-900 bg-slate-900 text-white':'border-slate-100 text-slate-400'}`}>💵 Cash</button>
          <button type="button" onClick={()=>setMethod('Bank')} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${method==='Bank'?'border-blue-600 bg-blue-600 text-white':'border-slate-100 text-slate-400'}`}>🏦 Bank</button>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nominal</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-3xl outline-none text-center" placeholder="0" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Keterangan</label>
          <input value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none" placeholder="Misal: Bayar Listrik" required />
        </div>
        <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest">
          {loading ? 'PROSES...' : 'SIMPAN TRANSAKSI'}
        </button>
      </form>
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: PIUTANG & PELUNASAN
// ==========================================
const FinanceInvoices = ({ db, invoices = [] }) => {
  const safeInv = Array.isArray(invoices) ? invoices : [];

  const handlePay = async (inv, amt) => {
    const pay = Number(amt);
    if (isNaN(pay) || pay <= 0) return;
    try {
      await updateDoc(doc(db, "invoices", inv.id), { 
        remainingAmount: Math.max(0, inv.remainingAmount - pay),
        status: (inv.remainingAmount - pay) <= 0 ? 'Lunas' : 'Cicilan'
      });
      await addDoc(collection(db, "payments"), {
        type: 'income', amount: pay, description: `Pelunasan: ${inv.studentName}`, category: 'SPP', method: 'Cash', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      alert("Pembayaran Berhasil!");
    } catch (e) { alert("Gagal!"); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {safeInv.filter(i => i.remainingAmount > 0).map((inv, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
          <div>
            <p className="font-black text-slate-800 uppercase tracking-tight">{inv.studentName}</p>
            <p className="text-[10px] text-slate-400 font-bold">TEMPO: {renderSafeDate(inv.dueDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-red-400 uppercase">Sisa Tagihan</p>
            <p className="text-xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
          </div>
          <button onClick={() => {
            const val = prompt(`Bayar untuk ${inv.studentName}:`, inv.remainingAmount);
            if(val) handlePay(inv, val);
          }} className="bg-slate-900 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">
            BAYAR
          </button>
        </div>
      ))}
    </div>
  );
};

// ==========================================
// 4. MAIN COMPONENT (INDUK)
// ==========================================
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

  const balance = transactions.reduce((acc, t) => {
    const amt = Number(t.amount) || 0;
    return t.type === 'income' ? acc + amt : acc - amt;
  }, 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <div className="bg-white p-5 border-b flex justify-between items-center shrink-0">
        <h1 className="font-black text-xl tracking-tighter italic text-blue-600">GEMILANG FINANCE</h1>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[{id:'summary', l:'Dashboard', i:LayoutDashboard}, {id:'input', l:'Catat Kas', i:PlusCircle}, {id:'invoices', l:'Piutang', i:Receipt}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase flex items-center gap-2 transition-all ${activeTab===t.id?'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              <t.i size={14}/> {t.l}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && <FinanceSummary transactions={transactions} invoices={invoices} balance={balance} showBalance={showBalance} setShowBalance={setShowBalance} />}
        {activeTab === 'input' && <FinanceFormInput db={db} />}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices} />}
      </div>
    </div>
  );
}