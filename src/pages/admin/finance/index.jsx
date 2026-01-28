import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, LayoutDashboard, PlusCircle, Receipt, Eye, EyeOff, CreditCard, Banknote, Trash2, ShieldAlert, Wrench, Download, Printer, FileText } from 'lucide-react';

// --- 🛡️ FILTER ANTI-CRASH (JANTUNG PERBAIKAN) ---
// Fungsi ini memaksa semua data jadi Teks agar tidak BLANK PUTIH
const safeRender = (val) => {
  try {
    if (val === null || val === undefined) return "-";
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return val;
    // Jika Timestamp Firebase (Penyebab Utama Error #31)
    if (typeof val === 'object' && val.seconds) {
      return new Date(val.seconds * 1000).toLocaleDateString('id-ID');
    }
    // Jika Objek lain
    return JSON.stringify(val); 
  } catch (e) {
    return "Error Data";
  }
};

const formatIDR = (n) => {
  try {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);
  } catch (e) { return "Rp 0"; }
};

// --- LOGIKA INTELIJEN: MENENTUKAN TIPE TRANSAKSI ---
const analyzeTransaction = (t) => {
  const type = String(t.type || '').toLowerCase();
  const cat = String(t.category || '').toLowerCase();
  const desc = String(t.description || '').toLowerCase();
  
  // Deteksi Pemasukan (Prioritas Tinggi)
  if (
    type === 'income' || type === 'pemasukan' || 
    cat === 'pendaftaran' || cat === 'spp' || cat === 'daftar ulang' || 
    desc.includes('pembayaran') || desc.includes('pelunasan')
  ) {
    return 'income'; // Hijau
  }
  return 'expense'; // Merah
};

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showBalance, setShowBalance] = useState(true);

  // LOAD DATA AMAN
  useEffect(() => {
    if (!db) return;
    try {
      const q1 = query(collection(db, "payments"), orderBy("date", "desc"));
      const u1 = onSnapshot(q1, (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));

      const q2 = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const u2 = onSnapshot(q2, (s) => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));

      return () => { u1(); u2(); };
    } catch (err) { console.error(err); }
  }, [db]);

  // HITUNG SALDO (DENGAN SAFEGUARD)
  const calculateBalance = () => {
    let inc = 0, exp = 0, cash = 0, bank = 0;

    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const realType = analyzeTransaction(t);
      const method = String(t.method || '').toLowerCase();

      if (realType === 'income') {
        inc += amt;
        if(method.includes('bank') || method.includes('transfer')) bank += amt;
        else cash += amt; // Default ke cash
      } else {
        exp += amt;
        if(method.includes('bank') || method.includes('transfer')) bank -= amt;
        else cash -= amt;
      }
    });

    return { inc, exp, cash, bank, total: inc - exp };
  };

  const stats = calculateBalance();
  const piutangTotal = invoices.reduce((acc, inv) => acc + (Number(inv.remainingAmount)||0), 0);

  // ACTIONS
  const handleDelete = async (id) => {
    const pwd = prompt("Masukkan Sandi Owner:");
    if(!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = s.exists() ? s.data().password : "2003";
    if(pwd === correct) await deleteDoc(doc(db, "payments", id));
    else alert("Sandi Salah!");
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white p-5 border-b flex justify-between items-center shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl italic text-slate-800 uppercase tracking-tighter">KEUANGAN & KAS</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {['summary','input','invoices'].map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase transition-all ${activeTab===t ? 'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              {t === 'summary' ? 'Dashboard' : t === 'input' ? 'Catat' : 'Piutang'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        
        {/* VIEW 1: DASHBOARD RINGKASAN */}
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
            {/* GRID SALDO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <button onClick={()=>setShowBalance(!showBalance)} className="absolute top-6 right-6 opacity-50 hover:opacity-100">{showBalance?<EyeOff/>:<Eye/>}</button>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-2">Total Kas</p>
                <p className="text-4xl font-black">{showBalance ? formatIDR(stats.total) : "Rp ••••••••"}</p>
                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                   <div><p className="text-[9px] font-black opacity-30 uppercase">💵 Tunai</p><p className="font-bold">{showBalance ? formatIDR(stats.cash) : "..."}</p></div>
                   <div><p className="text-[9px] font-black opacity-30 uppercase">🏦 Bank</p><p className="font-bold text-blue-400">{showBalance ? formatIDR(stats.bank) : "..."}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-3xl border-l-8 border-green-500 shadow-sm flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pemasukan</p><p className="text-2xl font-black text-green-600">{formatIDR(stats.inc)}</p></div>
                  <TrendingUp className="text-green-100" size={32}/>
                </div>
                <div className="bg-white p-6 rounded-3xl border-l-8 border-red-500 shadow-sm flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pengeluaran</p><p className="text-2xl font-black text-red-600">{formatIDR(stats.exp)}</p></div>
                  <TrendingDown className="text-red-100" size={32}/>
                </div>
              </div>
              <div className="bg-orange-500 text-white p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-center text-center">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Total Piutang</p>
                <p className="text-4xl font-black">{formatIDR(piutangTotal)}</p>
              </div>
            </div>

            {/* TABEL MUTASI */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase text-slate-400 tracking-[0.2em]">Riwayat Mutasi</h3>
                <button onClick={()=>window.print()} className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 flex gap-2"><Printer size={14}/> Cetak</button>
              </div>
              <div className="space-y-3">
                {transactions.slice(0, 50).map((t, i) => {
                  const type = analyzeTransaction(t);
                  return (
                    <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${String(t.method).toLowerCase().includes('bank') ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                          {String(t.method).toLowerCase().includes('bank') ? <CreditCard size={18}/> : <Banknote size={18}/>}
                        </div>
                        <div>
                          {/* 🛡️ PENGGUNAAN safeRender DI SINI */}
                          <p className="font-black text-slate-800 text-sm uppercase">{safeRender(t.description)}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {safeRender(t.date)} • {safeRender(t.method)} • {safeRender(t.category)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <p className={`font-black text-base ${type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                        </p>
                        <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: INPUT KAS */}
        {activeTab === 'input' && <FinanceFormInput db={db} />}

        {/* VIEW 3: PIUTANG */}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices} />}
        
      </div>

      {/* CSS PRINT */}
      <style>{`@media print { body * { visibility: hidden; } .bg-white, .bg-white * { visibility: visible; } .bg-white { position: absolute; left: 0; top: 0; width: 100%; } button { display: none !important; } }`}</style>
    </div>
  );
}

// --- SUB COMPONENTS (LANGSUNG DIDALAM SINI AGAR TIDAK HILANG) ---

function FinanceFormInput({ db }) {
  const [f, setF] = useState({ type: 'income', method: 'Cash', amount: '', desc: '', cat: 'Lainnya' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!f.amount || !f.desc) return alert("Isi Data!");
    setLoading(true);
    try {
      await addDoc(collection(db,"payments"), {
        ...f, amount: Number(f.amount), 
        date: new Date().toISOString().split('T')[0], // PASTI STRING
        createdAt: serverTimestamp()
      });
      alert("Tersimpan!"); setF({...f, amount:'', desc:''});
    } catch(e){ alert("Error"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in zoom-in">
      <form onSubmit={save} className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button type="button" onClick={()=>setF({...f, type:'income'})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase ${f.type==='income'?'bg-green-600 text-white shadow-lg':'text-slate-400'}`}>Uang Masuk</button>
          <button type="button" onClick={()=>setF({...f, type:'expense'})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase ${f.type==='expense'?'bg-red-600 text-white shadow-lg':'text-slate-400'}`}>Uang Keluar</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={()=>setF({...f, method:'Cash'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 ${f.method==='Cash'?'border-orange-500 bg-orange-500 text-white shadow-md':'border-slate-100 text-slate-400'}`}>💵 Tunai</button>
          <button type="button" onClick={()=>setF({...f, method:'Bank'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 ${f.method==='Bank'?'border-blue-600 bg-blue-600 text-white shadow-md':'border-slate-100 text-slate-400'}`}>🏦 Bank</button>
        </div>
        <input type="number" value={f.amount} onChange={e=>setF({...f, amount:e.target.value})} className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black text-4xl text-center outline-none" placeholder="0" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <select value={f.cat} onChange={e=>setF({...f, cat:e.target.value})} className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none"><option>SPP</option><option>Pendaftaran</option><option>Gaji</option><option>Operasional</option><option>Lainnya</option></select>
           <input value={f.desc} onChange={e=>setF({...f, desc:e.target.value})} className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none" placeholder="Keterangan..." required />
        </div>
        <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">{loading ? '...' : 'SIMPAN'}</button>
      </form>
    </div>
  );
}

function FinanceInvoices({ db, invoices = [] }) {
  const handlePay = async (inv, amt) => {
    const pay = Number(amt);
    if(isNaN(pay) || pay <= 0) return;
    const rem = Math.max(0, inv.remainingAmount - pay);
    await updateDoc(doc(db,"invoices",inv.id), { remainingAmount: rem, status: rem<=0?'paid':'unpaid' });
    await addDoc(collection(db,"payments"), {
      type: 'income', amount: pay, description: `Pelunasan: ${inv.studentName}`, 
      category: 'SPP', method: 'Cash', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
    });
    alert("Lunas!");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-right">
      <h2 className="font-black text-slate-800 text-xl mb-4 uppercase italic">Piutang Aktif</h2>
      {invoices.filter(i=>i.remainingAmount>0).map((inv, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-md">
          <div className="flex-1"><p className="font-black text-slate-800 uppercase text-lg">{safeRender(inv.studentName)}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Tempo: {safeDate(inv.dueDate)}</p></div>
          <div className="text-right px-10"><p className="text-[10px] font-black text-red-400 uppercase">Sisa</p><p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p></div>
          <button onClick={()=>{const v=prompt("Bayar:"); if(v) handlePay(inv,v)}} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">BAYAR</button>
        </div>
      ))}
      {invoices.filter(i=>i.remainingAmount>0).length === 0 && <div className="text-center py-10 text-slate-300 font-bold">Tidak ada piutang.</div>}
    </div>
  );
}