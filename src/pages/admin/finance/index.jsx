import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  LayoutDashboard, Receipt, PlusCircle, FileText, 
  TrendingUp, TrendingDown, Wallet, AlertCircle, 
  MinusCircle, Save, CheckCircle, Search, Send, DollarSign, Download 
} from 'lucide-react';

// ==========================================
// 1. KOMPONEN: RINGKASAN (SUMMARY)
// ==========================================
const FinanceSummary = ({ transactions = [], invoices = [], balance = 0 }) => {
  // Pengaman: Pastikan data array
  const safeTrans = Array.isArray(transactions) ? transactions : [];
  const safeInv = Array.isArray(invoices) ? invoices : [];

  const totalIncome = safeTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
  const totalExpense = safeTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
  const totalPiutang = safeInv.reduce((acc, inv) => acc + (parseInt(inv.remainingAmount) || 0), 0);
  
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* KARTU ATAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
            <div className="flex items-center gap-3 mb-2"><Wallet className="opacity-50"/><span className="text-xs font-bold uppercase tracking-widest opacity-50">Saldo Kas</span></div>
            <div className="text-3xl font-black">{formatIDR(balance)}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2"><TrendingUp className="text-green-500"/><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pemasukan</span></div>
            <div className="text-2xl font-black text-slate-800">{formatIDR(totalIncome)}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2"><TrendingDown className="text-red-500"/><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Pengeluaran</span></div>
            <div className="text-2xl font-black text-slate-800">{formatIDR(totalExpense)}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2"><AlertCircle className="text-orange-500"/><span className="text-xs font-bold uppercase tracking-widest text-slate-400">Piutang</span></div>
            <div className="text-2xl font-black text-slate-800">{formatIDR(totalPiutang)}</div>
        </div>
      </div>

      {/* TABEL TRANSAKSI */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <h3 className="font-black text-lg mb-6 uppercase tracking-widest text-slate-800">Riwayat Transaksi</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase"><th className="p-4">Info</th><th className="p-4 text-right">Nominal</th></tr></thead>
            <tbody className="text-sm font-bold text-slate-600">
              {safeTrans.length === 0 ? (<tr><td colSpan="2" className="p-6 text-center text-slate-300">Kosong</td></tr>) : (
                safeTrans.slice(0, 5).map((t, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="p-4">
                        <div className="text-slate-800">{t.description}</div>
                        <div className="text-[10px] text-slate-400">{t.date} • {t.category}</div>
                    </td>
                    <td className={`p-4 text-right font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. KOMPONEN: INPUT
// ==========================================
const FinanceInput = ({ db, students = [] }) => {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Isi nominal & keterangan!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, amount: parseInt(amount), description: desc, category: 'Umum', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Berhasil!");
    } catch (err) { alert("Gagal simpan!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setType('income')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type==='income'?'bg-green-500 text-white':'bg-slate-100'}`}>Pemasukan</button>
        <button onClick={() => setType('expense')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type==='expense'?'bg-red-500 text-white':'bg-slate-100'}`}>Pengeluaran</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-xs font-bold text-slate-400 ml-3">Nominal (Rp)</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full text-2xl font-black p-4 rounded-xl border-2 outline-none text-center" placeholder="0" required/></div>
        <div><label className="text-xs font-bold text-slate-400 ml-3">Keterangan</label><textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-4 rounded-xl border-2 outline-none font-bold" rows="2" placeholder="Contoh: Bayar Listrik" required></textarea></div>
        <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-black transition-all">{loading ? 'Menyimpan...' : 'SIMPAN DATA'}</button>
      </form>
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: PIUTANG (INVOICES)
// ==========================================
const FinanceInvoices = ({ invoices = [] }) => {
  const safeInv = Array.isArray(invoices) ? invoices : [];
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);
  
  return (
    <div className="space-y-4">
        {safeInv.length === 0 ? <div className="text-center p-10 text-slate-400">Tidak ada tagihan.</div> : safeInv.map((inv, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border flex justify-between items-center">
                <div><h3 className="font-bold text-slate-800">{inv.studentName}</h3><p className="text-xs text-slate-400">{inv.dueDate}</p></div>
                <div className="text-right"><p className="text-xs text-slate-400">Sisa</p><p className="font-black text-red-600">{formatIDR(inv.remainingAmount)}</p></div>
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
  
  useEffect(() => {
    if(!db) return; // Pengaman jika db belum siap
    
    // Ambil Data Simpel Dulu
    const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(query(collection(db, "invoices")), s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    
    return () => { u1(); u2(); };
  }, [db]);

  // Hitung Saldo
  const balance = transactions.reduce((acc, t) => { 
      const amt = parseInt(t.amount) || 0; 
      return t.type === 'income' ? acc + amt : acc - amt; 
  }, 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50">
      {/* HEADER TAB */}
      <div className="bg-white px-6 py-4 border-b flex items-center justify-between shrink-0">
        <h1 className="font-black text-xl text-blue-600">KEUANGAN</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
            {['summary', 'input', 'invoices'].map(tab => (
                <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-2 rounded-md text-xs font-bold uppercase ${activeTab===tab ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>
                    {tab === 'summary' ? 'Dashboard' : tab === 'input' ? 'Catat' : 'Piutang'}
                </button>
            ))}
        </div>
      </div>

      {/* ISI KONTEN */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && <FinanceSummary transactions={transactions} invoices={invoices} balance={balance} />}
        {activeTab === 'input' && <FinanceInput db={db} />}
        {activeTab === 'invoices' && <FinanceInvoices invoices={invoices} />}
      </div>
    </div>
  );
}