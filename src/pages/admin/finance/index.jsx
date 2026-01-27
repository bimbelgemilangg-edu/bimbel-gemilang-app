import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, writeBatch, getDocs } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, LayoutDashboard, PlusCircle, Receipt, Eye, EyeOff, CreditCard, Banknote, Trash2, ShieldAlert, Wrench } from 'lucide-react';

// --- HELPER ANTI-CRASH (JANGAN DIUBAH) ---
const safeDate = (val) => {
  try {
    if (!val) return "-";
    if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('id-ID'); // Handle Timestamp
    if (typeof val === 'string') return val; // Handle String
    return "Date Error";
  } catch (e) { return "-"; }
};

const formatIDR = (n) => {
  try { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0); } 
  catch (e) { return "Rp 0"; }
};

// ==========================================
// 1. KOMPONEN UTAMA (INDUK)
// ==========================================
export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    if (!db) return;
    try {
      // Ambil data tanpa filter aneh-aneh biar gak crash
      const q1 = query(collection(db, "payments"), orderBy("date", "desc"));
      const u1 = onSnapshot(q1, (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));

      const q2 = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
      const u2 = onSnapshot(q2, (s) => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));

      return () => { u1(); u2(); };
    } catch (err) { console.error("Error:", err); }
  }, [db]);

  // --- 🔥 JURUS MANIPULASI VISUAL (THE LOGIC SWAP) ---
  // Fungsi ini menentukan apakah sebuah transaksi itu UANG MASUK atau KELUAR
  // berdasarkan KATEGORI-nya, bukan berdasarkan label database yang mungkin salah.
  const getTransactionType = (t) => {
    const cat = (t.category || '').toLowerCase();
    const type = (t.type || '').toLowerCase();
    const desc = (t.description || '').toLowerCase();

    // DAFTAR KATA KUNCI PEMASUKAN
    // Jika mengandung kata-kata ini, PAKSA jadi Income (Hijau)
    if (cat === 'pendaftaran' || cat === 'spp' || cat === 'uang masuk' || cat === 'daftar ulang' || desc.includes('pembayaran awal')) {
      return 'income';
    }
    
    // DAFTAR KATA KUNCI PENGELUARAN
    // Jika mengandung kata-kata ini, PAKSA jadi Expense (Merah)
    if (cat === 'gaji' || cat === 'operasional' || cat === 'listrik' || cat === 'sewa' || cat === 'belanja') {
      return 'expense';
    }

    // Jika tidak ada di daftar di atas, baru percaya data asli database
    return type === 'income' ? 'income' : 'expense';
  };

  // --- HITUNG ULANG TOTAL BERDASARKAN LOGIKA BARU ---
  const incomeTotal = transactions.reduce((acc, t) => getTransactionType(t) === 'income' ? acc + (Number(t.amount)||0) : acc, 0);
  const expenseTotal = transactions.reduce((acc, t) => getTransactionType(t) === 'expense' ? acc + (Number(t.amount)||0) : acc, 0);
  const balanceTotal = incomeTotal - expenseTotal;

  // Hitung Saldo Tunai vs Bank
  const cashBal = transactions.reduce((acc, t) => {
    const m = String(t.method || '').toLowerCase();
    const isCash = m === 'cash' || m === 'tunai';
    if (isCash) {
      return getTransactionType(t) === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    }
    return acc;
  }, 0);

  const bankBal = transactions.reduce((acc, t) => {
    const m = String(t.method || '').toLowerCase();
    const isBank = m === 'bank' || m === 'transfer';
    if (isBank) {
      return getTransactionType(t) === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    }
    return acc;
  }, 0);


  // --- ACTIONS ---
  const handleDelete = async (id) => {
    const pwd = prompt("Sandi Owner:");
    if (!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = s.exists() ? s.data().password : "2003";
    
    if (pwd === correct) { 
      await deleteDoc(doc(db, "payments", id)); 
      alert("Terhapus."); 
    } else { 
      alert("Sandi Salah."); 
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      {/* HEADER */}
      <div className="bg-white p-5 border-b flex justify-between items-center shrink-0">
        <h1 className="font-black text-xl italic text-slate-800 uppercase flex gap-2"><ShieldAlert className="text-blue-600"/> Keuangan Terpadu</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* NAVIGASI */}
        <div className="flex bg-white p-2 rounded-2xl shadow-sm border mb-6 w-fit">
           {['summary','input','invoices'].map(t => (
             <button key={t} onClick={()=>setActiveTab(t)} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase ${activeTab===t ? 'bg-slate-900 text-white':'text-slate-400'}`}>
               {t==='summary'?'Dashboard':t==='input'?'Catat Kas':t}
             </button>
           ))}
        </div>

        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* SALDO CARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative">
                <button onClick={()=>setShowBalance(!showBalance)} className="absolute top-6 right-6 text-slate-500 hover:text-white">{showBalance?<EyeOff size={20}/>:<Eye size={20}/>}</button>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-2">Total Kas</p>
                <p className="text-3xl font-black">{showBalance ? formatIDR(balanceTotal) : "Rp ••••••••"}</p>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-xs">
                   <span>💵 Tunai: {showBalance ? formatIDR(cashBal) : "..."}</span>
                   <span>🏦 Bank: {showBalance ? formatIDR(bankBal) : "..."}</span>
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-8 border-green-500 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pemasukan</p>
                <p className="text-2xl font-black text-green-600">{formatIDR(incomeTotal)}</p>
              </div>
              <div className="bg-white p-6 rounded-3xl border-l-8 border-red-500 shadow-sm">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pengeluaran</p>
                <p className="text-2xl font-black text-red-600">{formatIDR(expenseTotal)}</p>
              </div>
            </div>

            {/* TABEL MUTASI (DENGAN KACAMATA PINTAR) */}
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
               <h3 className="font-black text-xs uppercase text-slate-400 mb-4 tracking-[0.2em]">Riwayat Mutasi</h3>
               <div className="space-y-2">
                 {transactions.map((t,i) => {
                   const type = getTransactionType(t); // Tentukan tipe berdasarkan kategori
                   const isInc = type === 'income';

                   return (
                     <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="flex items-center gap-4">
                         <div className={`p-2 rounded-lg ${String(t.method||'').toLowerCase()==='bank'?'bg-blue-100 text-blue-600':'bg-orange-100 text-orange-600'}`}>
                           {String(t.method||'').toLowerCase()==='bank'?<CreditCard size={16}/>:<Banknote size={16}/>}
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 text-sm uppercase">{t.description || 'Tanpa Keterangan'}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">{safeDate(t.date)} • {t.method || '-'} • {t.category || '-'}</p>
                         </div>
                       </div>
                       <div className="flex items-center gap-4">
                          {/* WARNA DAN TANDA (+/-) DIPAKSA BENAR */}
                          <p className={`font-black text-sm ${isInc ? 'text-green-600' : 'text-red-600'}`}>
                            {isInc ? '+' : '-'} {formatIDR(t.amount)}
                          </p>
                          <button onClick={()=>handleDelete(t.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={16}/></button>
                       </div>
                     </div>
                   )
                 })}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'input' && <FinanceFormInput db={db}/>}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices}/>}
      </div>
    </div>
  );
}

// --- SUB KOMPONEN INPUT ---
function FinanceFormInput({db}) {
  const [f, setF] = useState({type:'income', method:'Cash', amount:'', desc:'', cat:'Lainnya'});
  
  const save = async(e)=>{ 
    e.preventDefault(); 
    if(!f.amount || !f.desc) return alert("Isi Data!");
    try {
      await addDoc(collection(db,"payments"), {
        ...f, amount:Number(f.amount), 
        date: new Date().toISOString().split('T')[0], // PASTI STRING
        createdAt:serverTimestamp()
      }); 
      alert("Ok!"); setF({...f, amount:'', desc:''}); 
    } catch(e) { alert("Error!"); }
  };
  
  return (
    <form onSubmit={save} className="max-w-xl mx-auto bg-white p-8 rounded-[2rem] shadow-xl space-y-4">
      <div className="flex bg-slate-100 p-1 rounded-xl"><button type="button" onClick={()=>setF({...f,type:'income'})} className={`flex-1 py-2 rounded-lg font-black text-xs uppercase ${f.type==='income'?'bg-green-600 text-white':'text-slate-400'}`}>Masuk</button><button type="button" onClick={()=>setF({...f,type:'expense'})} className={`flex-1 py-2 rounded-lg font-black text-xs uppercase ${f.type==='expense'?'bg-red-600 text-white':'text-slate-400'}`}>Keluar</button></div>
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setF({...f,method:'Cash'})} className={`py-2 border-2 rounded-lg font-bold text-xs uppercase ${f.method==='Cash'?'border-orange-500 bg-orange-500 text-white':'border-slate-100'}`}>Tunai</button><button type="button" onClick={()=>setF({...f,method:'Bank'})} className={`py-2 border-2 rounded-lg font-bold text-xs uppercase ${f.method==='Bank'?'border-blue-600 bg-blue-600 text-white':'border-slate-100'}`}>Bank</button></div>
      <input type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} className="w-full text-center text-3xl font-black p-4 border-b-4 outline-none" placeholder="0"/>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={f.cat} onChange={e=>setF({...f,cat:e.target.value})} className="p-3 border-2 rounded-xl font-bold bg-slate-50">
          <option value="SPP">SPP</option>
          <option value="Pendaftaran">Pendaftaran</option>
          <option value="Gaji">Gaji Guru</option>
          <option value="Operasional">Operasional</option>
          <option value="Lainnya">Lain-lain</option>
        </select>
        <input value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} className="w-full p-3 border-2 rounded-xl font-bold" placeholder="Ket..." required/>
      </div>

      <button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase">Simpan</button>
    </form>
  )
}

// --- SUB KOMPONEN PIUTANG ---
function FinanceInvoices({db, invoices}){
  const pay = async(inv, amt)=>{ 
    const rem = Math.max(0, inv.remainingAmount-amt); 
    await updateDoc(doc(db,"invoices",inv.id),{remainingAmount:rem, status:rem<=0?'paid':'unpaid'}); 
    await addDoc(collection(db,"payments"),{
      type:'income', amount:Number(amt), description:`Pelunasan ${inv.studentName}`, method:'Cash', category:'SPP', 
      date:new Date().toISOString().split('T')[0], createdAt:serverTimestamp()
    }); 
    alert("Lunas!"); 
  };
  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {invoices.filter(i=>i.remainingAmount>0).map((inv,i)=>(
        <div key={i} className="bg-white p-6 rounded-3xl border flex justify-between items-center shadow-sm">
          <div><div className="font-black uppercase">{inv.studentName}</div><div className="text-xs text-slate-400 font-bold">Sisa: {formatIDR(inv.remainingAmount)}</div></div>
          <button onClick={()=>{const v=prompt("Bayar:"); if(v) pay(inv,v)}} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs">BAYAR</button>
        </div>
      ))}
      {invoices.filter(i=>i.remainingAmount>0).length === 0 && <p className="text-center text-slate-400">Tidak ada piutang.</p>}
    </div>
  )
}