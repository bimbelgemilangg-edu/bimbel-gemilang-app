import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
// Kita pakai ikon yang paling standar agar tidak error
import { Wallet, TrendingUp, TrendingDown, AlertCircle, PlusCircle, Receipt, FileText, LayoutDashboard, Save, Send } from 'lucide-react';

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. AMBIL DATA DARI DATABASE
  useEffect(() => {
    if (!db) return;
    try {
      const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), 
        (s) => { setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))); setLoading(false); },
        (err) => console.log("FireStore Error:", err)
      );
      const u2 = onSnapshot(collection(db, "invoices"), 
        (s) => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      return () => { u1(); u2(); };
    } catch (e) { console.error("Setup Error:", e); }
  }, [db]);

  // 2. HITUNG TOTAL-TOTALAN
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const piutang = invoices.reduce((acc, inv) => acc + (Number(inv.remainingAmount) || 0), 0);
  const balance = income - expense;

  const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* --- HEADER --- */}
      <div className="bg-white p-5 border-b flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Wallet size={20}/></div>
          <h1 className="font-black text-xl tracking-tighter">KEUANGAN GEMILANG</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[
            {id:'summary', l:'Beranda', i:LayoutDashboard},
            {id:'input', l:'Catat Kas', i:PlusCircle},
            {id:'invoices', l:'Piutang', i:Receipt}
          ].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2 rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab===t.id?'bg-white text-blue-600 shadow-sm':'text-slate-400'}`}>
              <t.i size={14}/> {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* --- ISI KONTEN --- */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {/* TAB 1: RINGKASAN */}
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                <p className="text-[10px] font-bold opacity-50 uppercase mb-1">Total Saldo Kas</p>
                <p className="text-2xl font-black">{formatIDR(balance)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-bold text-green-500 uppercase mb-1">Total Pemasukan</p>
                <p className="text-xl font-black text-slate-800">{formatIDR(income)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-bold text-red-500 uppercase mb-1">Total Pengeluaran</p>
                <p className="text-xl font-black text-slate-800">{formatIDR(expense)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200">
                <p className="text-[10px] font-bold text-orange-500 uppercase mb-1">Total Piutang</p>
                <p className="text-xl font-black text-slate-800">{formatIDR(piutang)}</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
              <h3 className="font-black text-sm uppercase text-slate-400 mb-4 flex items-center gap-2"><FileText size={16}/> 10 Transaksi Terakhir</h3>
              <div className="space-y-3">
                {transactions.slice(0, 10).map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{t.date} • {t.category}</p>
                    </div>
                    <p className={`font-black text-sm ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                      {t.type==='income'?'+':'-'} {formatIDR(t.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATAT KAS */}
        {activeTab === 'input' && (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-2xl border border-slate-100">
             <FinanceFormInput db={db} />
          </div>
        )}

        {/* TAB 3: PIUTANG */}
        {activeTab === 'invoices' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="font-black text-slate-800 text-xl mb-4">TAGIHAN BELUM LUNAS</h2>
            {invoices.filter(inv => inv.remainingAmount > 0).map((inv, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                <div><p className="font-black text-slate-800 uppercase">{inv.studentName}</p><p className="text-xs text-slate-400 font-bold">Tempo: {inv.dueDate}</p></div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-red-400 uppercase">Sisa Tagihan</p>
                  <p className="text-xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
                </div>
                {inv.waPhone && (
                  <a href={`https://wa.me/${inv.waPhone}`} target="_blank" className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 transition-all shadow-lg"><Send size={20}/></a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-KOMPONEN FORM (DITULIS DI SINI BIAR AMAN) ---
function FinanceFormInput({ db }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Mohon isi semua data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, amount: Number(amount), description: desc, category: 'Umum', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Berhasil disimpan!");
    } catch (e) { alert("Gagal!"); }
    setLoading(false);
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
        <button type="button" onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase transition-all ${type==='income'?'bg-green-500 text-white shadow-lg':'text-slate-400'}`}>Pemasukan</button>
        <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase transition-all ${type==='expense'?'bg-red-500 text-white shadow-lg':'text-slate-400'}`}>Pengeluaran</button>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nominal (Rp)</label>
        <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-2xl outline-none focus:border-blue-500" placeholder="0" required />
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Keterangan</label>
        <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-blue-500" placeholder="Contoh: Bayar Listrik" rows="3" required></textarea>
      </div>
      <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black text-lg uppercase tracking-widest hover:bg-black transition-all shadow-xl">
        {loading ? 'MENYIMPAN...' : 'SIMPAN TRANSAKSI'}
      </button>
    </form>
  );
}