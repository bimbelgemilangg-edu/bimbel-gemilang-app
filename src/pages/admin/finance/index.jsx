import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { 
  Wallet, TrendingUp, TrendingDown, AlertCircle, PlusCircle, 
  Receipt, LayoutDashboard, Send, Eye, EyeOff, CreditCard, 
  Banknote, Edit3, Trash2, CheckCircle 
} from 'lucide-react';

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [showBalance, setShowBalance] = useState(false); // Fitur Intip

  useEffect(() => {
    if (!db) return;
    const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), (s) => {
      setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const u2 = onSnapshot(collection(db, "invoices"), (s) => {
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    const u3 = onSnapshot(collection(db, "students"), (s) => {
      setStudents(s.docs.map(d => ({id: d.id, ...d.data()})));
    });
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- LOGIKA HITUNGAN ---
  const income = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const piutang = invoices.reduce((acc, inv) => acc + (Number(inv.remainingAmount) || 0), 0);
  const balance = income - expense;

  const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white p-5 border-b flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><Wallet size={20}/></div>
          <h1 className="font-black text-xl tracking-tighter italic text-blue-600">GEMILANG FINANCE</h1>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          {[{id:'summary', l:'Dashboard', i:LayoutDashboard}, {id:'input', l:'Catat Kas', i:PlusCircle}, {id:'invoices', l:'Piutang', i:Receipt}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 transition-all ${activeTab===t.id?'bg-white text-blue-600 shadow-md':'text-slate-400 hover:text-slate-600'}`}>
              <t.i size={14}/> {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
        
        {/* TAB 1: DASHBOARD */}
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden group">
                <button onClick={() => setShowBalance(!showBalance)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">
                  {showBalance ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
                <p className="text-[10px] font-black opacity-50 uppercase mb-1 tracking-widest">Saldo Kas Total</p>
                <p className="text-3xl font-black transition-all">
                  {showBalance ? formatIDR(balance) : "Rp ••••••••"}
                </p>
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
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Total Piutang</p>
                <p className="text-xl font-black text-orange-600">{formatIDR(piutang)}</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <h3 className="font-black text-xs uppercase text-slate-400 mb-6 flex items-center gap-2 tracking-[0.2em]">Riwayat Kas Terakhir</h3>
              <div className="space-y-4">
                {transactions.slice(0, 10).map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${t.method === 'Bank' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                        {t.method === 'Bank' ? <CreditCard size={18}/> : <Banknote size={18}/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase">{t.description}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {t.date} • {t.method || 'Cash'} • {t.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className={`font-black text-sm ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                      </p>
                      <button onClick={async() => { if(confirm('Hapus transaksi ini?')) await deleteDoc(doc(db, "payments", t.id)) }} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CATAT KAS */}
        {activeTab === 'input' && (
          <FinanceFormInput db={db} students={students} />
        )}

        {/* TAB 3: PIUTANG & PELUNASAN */}
        {activeTab === 'invoices' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-end mb-4">
              <h2 className="font-black text-slate-800 text-2xl tracking-tighter uppercase italic">Manajemen Piutang</h2>
            </div>
            {invoices.filter(inv => inv.remainingAmount > 0).map((inv, i) => (
              <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-md flex flex-col md:flex-row justify-between items-center gap-6 group hover:border-blue-400 transition-all">
                <div className="flex-1">
                  <p className="text-[10px] font-black text-blue-600 uppercase mb-1 tracking-widest">Nama Siswa</p>
                  <p className="font-black text-xl text-slate-800 uppercase tracking-tight">{inv.studentName}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Jatuh Tempo: {inv.dueDate}</p>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-[10px] font-black text-red-400 uppercase tracking-widest">Sisa Tagihan</p>
                  <p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    const pay = prompt(`Masukkan jumlah pembayaran untuk ${inv.studentName}:`, inv.remainingAmount);
                    if (pay) handlePayment(db, inv, pay);
                  }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
                    <CheckCircle size={14}/> Bayar / Cicil
                  </button>
                  {inv.waPhone && (
                    <a href={`https://wa.me/${inv.waPhone}`} target="_blank" className="bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 shadow-lg transition-all"><Send size={18}/></a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- LOGIKA PELUNASAN ---
async function handlePayment(db, invoice, payAmount) {
  const amount = parseInt(payAmount);
  if (isNaN(amount) || amount <= 0) return alert("Jumlah tidak valid");

  const newRemaining = invoice.remainingAmount - amount;
  const status = newRemaining <= 0 ? 'Lunas' : 'Cicilan';

  try {
    // 1. Update Invoice
    await updateDoc(doc(db, "invoices", invoice.id), {
      remainingAmount: Math.max(0, newRemaining),
      status: status
    });
    // 2. Catat ke Kas sebagai Pemasukan
    await addDoc(collection(db, "payments"), {
      type: 'income',
      amount: amount,
      description: `Cicilan/Pelunasan: ${invoice.studentName}`,
      category: 'SPP',
      method: 'Cash',
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp()
    });
    alert("Pembayaran berhasil dicatat!");
  } catch (e) { alert("Gagal mencatat pembayaran"); }
}

// --- KOMPONEN INPUT KAS (PRO VERSION) ---
function FinanceFormInput({ db, students }) {
  const [type, setType] = useState('income');
  const [method, setMethod] = useState('Cash'); // Cash / Bank
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [cat, setCat] = useState('SPP');
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Lengkapi data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, method, amount: Number(amount), description: desc, category: cat, 
        date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Berhasil disimpan!");
    } catch (e) { alert("Error!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 animate-in zoom-in duration-300">
      <form onSubmit={save} className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button type="button" onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${type==='income'?'bg-green-500 text-white shadow-lg':'text-slate-400'}`}>Pemasukan</button>
          <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${type==='expense'?'bg-red-500 text-white shadow-lg':'text-slate-400'}`}>Pengeluaran</button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={()=>setMethod('Cash')} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${method==='Cash'?'border-slate-900 bg-slate-900 text-white shadow-md':'border-slate-100 text-slate-400'}`}>💵 Cash</button>
          <button type="button" onClick={()=>setMethod('Bank')} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${method==='Bank'?'border-blue-600 bg-blue-600 text-white shadow-md':'border-slate-100 text-slate-400'}`}>🏦 Bank / Transfer</button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest text-center block w-full">Nominal Transaksi</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-3xl outline-none focus:border-blue-500 text-center text-slate-800" placeholder="0" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Kategori</label>
            <select value={cat} onChange={e=>setCat(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500">
              <option value="SPP">Pembayaran SPP</option>
              <option value="Pendaftaran">Pendaftaran</option>
              <option value="Gaji">Gaji Guru</option>
              <option value="Operasional">Operasional</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="space-y-1">
             <label className="text-[9px] font-black text-slate-400 uppercase ml-4">Keterangan Singkat</label>
             <input value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-600" placeholder="Misal: Listrik Jan" required />
          </div>
        </div>

        <button disabled={loading} className={`w-full py-6 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] transition-all shadow-xl text-white ${loading ? 'bg-slate-300' : 'bg-slate-900 hover:bg-blue-600 active:scale-95'}`}>
          {loading ? 'MENYIMPAN...' : 'PROSES TRANSAKSI'}
        </button>
      </form>
    </div>
  );
}