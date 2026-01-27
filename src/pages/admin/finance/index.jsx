import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { DollarSign, Plus, Minus, FileText, Search, CreditCard, Wallet, TrendingUp, TrendingDown } from 'lucide-react';

// ==========================================
// 1. KOMPONEN: RINGKASAN
// ==========================================
const FinanceSummary = ({ transactions = [], invoices = [], balance = 0 }) => {
  // Pengaman Data (Biar Gak Blank)
  const safeTrans = Array.isArray(transactions) ? transactions : [];
  const safeInv = Array.isArray(invoices) ? invoices : [];

  const totalIncome = safeTrans.filter(t => t.type === 'income').reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
  const totalExpense = safeTrans.filter(t => t.type === 'expense').reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
  const totalPiutang = safeInv.reduce((acc, inv) => acc + (parseInt(inv.remainingAmount) || 0), 0);
  
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* KARTU STATISTIK */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 text-white p-6 rounded-2xl">
          <div className="flex items-center gap-2 opacity-70 mb-2"><Wallet size={16}/><span className="text-xs font-bold uppercase">Saldo Kas</span></div>
          <div className="text-2xl font-black">{formatIDR(balance)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-green-600 mb-2"><TrendingUp size={16}/><span className="text-xs font-bold uppercase text-slate-400">Pemasukan</span></div>
          <div className="text-xl font-black text-slate-800">{formatIDR(totalIncome)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-red-600 mb-2"><TrendingDown size={16}/><span className="text-xs font-bold uppercase text-slate-400">Pengeluaran</span></div>
          <div className="text-xl font-black text-slate-800">{formatIDR(totalExpense)}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200">
          <div className="flex items-center gap-2 text-orange-600 mb-2"><CreditCard size={16}/><span className="text-xs font-bold uppercase text-slate-400">Piutang</span></div>
          <div className="text-xl font-black text-slate-800">{formatIDR(totalPiutang)}</div>
        </div>
      </div>

      {/* TABEL SIMPEL */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200">
        <h3 className="font-bold text-slate-700 mb-4 uppercase text-sm">Transaksi Terakhir</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-slate-400 uppercase text-xs border-b">
              <tr><th className="py-2">Tanggal</th><th className="py-2">Ket</th><th className="py-2 text-right">Nominal</th></tr>
            </thead>
            <tbody>
              {safeTrans.slice(0, 5).map((t, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-3 font-medium">{t.date}</td>
                  <td className="py-3">
                    <div className="font-bold text-slate-700">{t.description}</div>
                    <div className="text-xs text-slate-400">{t.category}</div>
                  </td>
                  <td className={`py-3 text-right font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                    {t.type==='income' ? '+' : '-'} {formatIDR(t.amount)}
                  </td>
                </tr>
              ))}
              {safeTrans.length === 0 && <tr><td colSpan="3" className="py-4 text-center text-slate-400">Belum ada data</td></tr>}
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
const FinanceInput = ({ db }) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('income');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return;
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, amount: parseInt(amount), description: desc, category: 'Umum', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Tersimpan!");
    } catch (e) { alert("Gagal!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
      <div className="flex gap-2 mb-6">
        <button onClick={()=>setType('income')} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase ${type==='income'?'bg-green-600 text-white':'bg-slate-100'}`}>Pemasukan</button>
        <button onClick={()=>setType('expense')} className={`flex-1 py-3 rounded-lg font-bold text-sm uppercase ${type==='expense'?'bg-red-600 text-white':'bg-slate-100'}`}>Pengeluaran</button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="text-xs font-bold text-slate-400">Nominal</label><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-3 border rounded-lg font-bold" required /></div>
        <div><label className="text-xs font-bold text-slate-400">Keterangan</label><input type="text" value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-3 border rounded-lg font-bold" required /></div>
        <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-lg font-black uppercase hover:bg-black">{loading?'Menyimpan...':'SIMPAN'}</button>
      </form>
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: PIUTANG
// ==========================================
const FinanceInvoices = ({ invoices = [] }) => {
  const safeInv = Array.isArray(invoices) ? invoices : [];
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="space-y-4">
      {safeInv.length === 0 ? <div className="text-center p-10 text-slate-400 font-bold border rounded-2xl">Tidak ada tagihan aktif.</div> : safeInv.map((inv, i) => (
        <div key={i} className="bg-white p-4 rounded-xl border flex justify-between items-center">
          <div><h4 className="font-bold text-slate-800">{inv.studentName}</h4><p className="text-xs text-slate-400">Jatuh Tempo: {inv.dueDate}</p></div>
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
  
  // PENGAMAN DATABASE
  useEffect(() => {
    if (!db) return; // Kalau db belum siap, jangan jalan dulu (Biar gak blank)

    try {
      const q1 = query(collection(db, "payments"), orderBy("date", "desc"));
      const u1 = onSnapshot(q1, s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))), err => console.log("Err Trans:", err));

      const q2 = query(collection(db, "invoices"));
      const u2 = onSnapshot(q2, s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))), err => console.log("Err Inv:", err));

      return () => { u1(); u2(); };
    } catch (error) {
      console.error("Error loading finance:", error);
    }
  }, [db]);

  const balance = transactions.reduce((acc, t) => { 
    const amt = parseInt(t.amount) || 0; 
    return t.type === 'income' ? acc + amt : acc - amt; 
  }, 0);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 font-sans">
      {/* HEADER */}
      <div className="bg-white px-6 py-4 border-b flex justify-between items-center shrink-0">
        <h1 className="font-black text-xl text-slate-800 tracking-tighter">KEUANGAN</h1>
        <div className="flex bg-slate-100 p-1 rounded-lg">
          {['summary', 'input', 'invoices'].map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-md text-xs font-bold uppercase ${activeTab===t?'bg-white shadow text-blue-600':'text-slate-400'}`}>
              {t==='summary'?'Home':t==='input'?'Catat':'Piutang'}
            </button>
          ))}
        </div>
      </div>

      {/* KONTEN */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && <FinanceSummary transactions={transactions} invoices={invoices} balance={balance} />}
        {activeTab === 'input' && <FinanceInput db={db} />}
        {activeTab === 'invoices' && <FinanceInvoices invoices={invoices} />}
      </div>
    </div>
  );
}