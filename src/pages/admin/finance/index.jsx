import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, AlertCircle, PlusCircle, Receipt, FileText, LayoutDashboard, Save, Send } from 'lucide-react';

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  // --- 1. AMBIL DATA ---
  useEffect(() => {
    if (!db) return;
    const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), (s) => {
      setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const u2 = onSnapshot(collection(db, "invoices"), (s) => {
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => { u1(); u2(); };
  }, [db]);

  // --- 2. PENERJEMAH TANGGAL (OBAT ERROR #31) ---
  const renderDate = (dateVal) => {
    if (!dateVal) return "-";
    // Jika formatnya Firebase Timestamp {seconds, nanoseconds}
    if (typeof dateVal === 'object' && dateVal.seconds) {
      return new Date(dateVal.seconds * 1000).toLocaleDateString('id-ID');
    }
    // Jika formatnya sudah String
    return dateVal.toString();
  };

  // --- 3. HITUNG SALDO ---
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const piutang = invoices.reduce((acc, inv) => acc + (Number(inv.remainingAmount) || 0), 0);
  const balance = income - expense;

  const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* HEADER MENU */}
      <div className="bg-white p-5 border-b flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Wallet size={20}/></div>
          <h1 className="font-black text-xl tracking-tighter uppercase">Keuangan</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {[{id:'summary', l:'Beranda', i:LayoutDashboard}, {id:'input', l:'Catat Kas', i:PlusCircle}, {id:'invoices', l:'Piutang', i:Receipt}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase flex items-center gap-2 transition-all ${activeTab===t.id?'bg-white text-blue-600 shadow-sm':'text-slate-400'}`}>
              <t.i size={14}/> {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* VIEW: RINGKASAN */}
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                <p className="text-[10px] font-black opacity-50 uppercase mb-1 tracking-widest">Saldo Kas</p>
                <p className="text-2xl font-black">{formatIDR(balance)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-green-500 uppercase mb-1 tracking-widest">Pemasukan</p>
                <p className="text-xl font-black text-slate-800">{formatIDR(income)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-red-500 uppercase mb-1 tracking-widest">Pengeluaran</p>
                <p className="text-xl font-black text-slate-800">{formatIDR(expense)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-orange-500 uppercase mb-1 tracking-widest">Piutang</p>
                <p className="text-xl font-black text-slate-800">{formatIDR(piutang)}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200">
              <h3 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-widest flex items-center gap-2"><FileText size={16}/> Riwayat Transaksi</h3>
              <div className="space-y-3">
                {transactions.length === 0 ? <p className="text-center py-10 text-slate-300 italic font-bold">Belum ada transaksi</p> : 
                  transactions.slice(0, 15).map((t, i) => (
                    <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{t.description || 'Tanpa Keterangan'}</p>
                        {/* DISINI OBATNYA: renderDate(t.date) */}
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{renderDate(t.date)} • {t.category || 'Umum'}</p>
                      </div>
                      <p className={`font-black text-sm ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                        {t.type==='income'?'+':'-'} {formatIDR(t.amount)}
                      </p>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* VIEW: INPUT */}
        {activeTab === 'input' && (
          <div className="max-w-xl mx-auto">
             <FinanceFormInput db={db} />
          </div>
        )}

        {/* VIEW: PIUTANG */}
        {activeTab === 'invoices' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="font-black text-slate-800 text-xl mb-4 tracking-tighter">DAFTAR PIUTANG</h2>
            {invoices.filter(inv => inv.remainingAmount > 0).map((inv, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div><p className="font-black text-slate-800 uppercase tracking-tight">{inv.studentName}</p><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Jatuh Tempo: {renderDate(inv.dueDate)}</p></div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">Sisa Tagihan</p>
                  <p className="text-xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
                </div>
                {inv.waPhone && (
                  <a href={`https://wa.me/${inv.waPhone}`} target="_blank" className="bg-green-500 text-white p-4 rounded-2xl hover:bg-green-600 transition-all shadow-lg"><Send size={20}/></a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- KOMPONEN INPUT ---
function FinanceFormInput({ db }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Isi nominal & keterangan!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, 
        amount: Number(amount), 
        description: desc, 
        category: 'Kas Umum', 
        date: new Date().toISOString().split('T')[0], // Simpan sebagai string YYYY-MM-DD
        createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Berhasil disimpan!");
    } catch (e) { alert("Error saat menyimpan!"); }
    setLoading(false);
  };

  return (
    <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
      <form onSubmit={save} className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button type="button" onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${type==='income'?'bg-green-500 text-white shadow-lg':'text-slate-400'}`}>Pemasukan</button>
          <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${type==='expense'?'bg-red-500 text-white shadow-lg':'text-slate-400'}`}>Pengeluaran</button>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Nominal (Rp)</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-black text-2xl outline-none focus:border-blue-600 text-center" placeholder="0" required />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Keterangan</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl font-bold outline-none focus:border-blue-600" placeholder="Misal: Bayar Listrik, SPP Budi, dll" rows="3" required></textarea>
        </div>
        <button disabled={loading} className={`w-full py-5 rounded-3xl font-black text-lg uppercase tracking-widest transition-all shadow-xl text-white ${loading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-black active:scale-95'}`}>
          {loading ? 'MENYIMPAN...' : 'SIMPAN TRANSAKSI'}
        </button>
      </form>
    </div>
  );
}