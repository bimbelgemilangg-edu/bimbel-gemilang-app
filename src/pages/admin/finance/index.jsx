import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { Wallet, TrendingUp, TrendingDown, LayoutDashboard, PlusCircle, Receipt, Eye, EyeOff, CreditCard, Banknote, Trash2, ShieldAlert, Wrench } from 'lucide-react';

// --- HELPER FORMATTING ---
const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);

// --- HELPER TANGGAL (ANTI-CRASH) ---
const safeDate = (val) => {
  if (!val) return "-";
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('id-ID'); // Handle Timestamp
  return val; // Handle String
};

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showBalance, setShowBalance] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);

  useEffect(() => {
    if (!db) return;
    const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const u2 = onSnapshot(collection(db, "invoices"), s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { u1(); u2(); };
  }, [db]);

  // --- 🔥 FITUR BASMI AKAR MASALAH (DATABASE REPAIR) ---
  const runDatabaseRepair = async () => {
    if(!confirm("⚠️ PERINGATAN: Ini akan memformat ulang semua data tanggal & metode pembayaran di database agar standar. Lanjutkan?")) return;
    setIsRepairing(true);
    try {
      const batch = writeBatch(db);
      const snap = await getDocs(collection(db, "payments"));
      let count = 0;

      snap.forEach((d) => {
        const data = d.data();
        let update = {};

        // 1. UBAH TANGGAL JADI TEKS (YYYY-MM-DD)
        if (data.date && data.date.seconds) {
          const dateObj = new Date(data.date.seconds * 1000);
          update.date = dateObj.toISOString().split('T')[0];
        }

        // 2. STANDARDISASI METODE (Tunai -> Cash)
        if (data.method === 'Tunai') update.method = 'Cash';
        if (data.method === 'Transfer') update.method = 'Bank';

        // 3. PAKSA PENDAFTARAN JADI INCOME
        if (data.category === 'Pendaftaran' || data.category === 'SPP') {
          if (data.type !== 'income') update.type = 'income';
        }

        if (Object.keys(update).length > 0) {
          batch.update(doc(db, "payments", d.id), update);
          count++;
        }
      });

      await batch.commit();
      alert(`✅ SUKSES! ${count} data berhasil dicuci bersih. Sistem sekarang aman.`);
    } catch (e) {
      alert("Gagal: " + e.message);
    }
    setIsRepairing(false);
  };

  // --- LOGIKA HITUNGAN (Sekarang sudah bersih, jadi simpel) ---
  const incomeTotal = transactions.reduce((acc, t) => t.type === 'income' ? acc + (Number(t.amount)||0) : acc, 0);
  const expenseTotal = transactions.reduce((acc, t) => t.type === 'expense' ? acc + (Number(t.amount)||0) : acc, 0);
  const piutangTotal = invoices.reduce((acc, i) => acc + (Number(i.remainingAmount)||0), 0);
  
  const cashBal = transactions.filter(t => t.method === 'Cash').reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);
  const bankBal = transactions.filter(t => t.method === 'Bank').reduce((acc, t) => t.type === 'income' ? acc + Number(t.amount) : acc - Number(t.amount), 0);

  // --- HAPUS DATA ---
  const handleDelete = async (id) => {
    const pwd = prompt("Sandi Owner:");
    if(!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    if(pwd === (s.exists()?s.data().password:"2003")) { await deleteDoc(doc(db, "payments", id)); alert("Terhapus."); } 
    else alert("Sandi salah.");
  };

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      <div className="bg-white p-5 border-b flex justify-between items-center shrink-0">
        <h1 className="font-black text-xl italic text-slate-800 uppercase flex gap-2"><ShieldAlert className="text-blue-600"/> Gemilang Finance</h1>
        
        {/* TOMBOL DARURAT (HANYA MUNCUL JIKA PERLU) */}
        <button onClick={runDatabaseRepair} disabled={isRepairing} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-black text-xs uppercase flex items-center gap-2 shadow-lg animate-pulse">
          <Wrench size={14}/> {isRepairing ? "SEDANG MEMPERBAIKI..." : "KLIK INI UNTUK PERBAIKI DATABASE"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* GRID SALDO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative">
                <button onClick={()=>setShowBalance(!showBalance)} className="absolute top-6 right-6 text-slate-500 hover:text-white">{showBalance?<EyeOff size={20}/>:<Eye size={20}/>}</button>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-2">Total Kas</p>
                <p className="text-3xl font-black">{showBalance ? formatIDR(cashBal + bankBal) : "Rp ••••••••"}</p>
                <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                   <div><p className="text-[9px] font-black opacity-30 uppercase">💵 Tunai</p><p className="font-black text-sm">{showBalance ? formatIDR(cashBal) : "Rp •••"}</p></div>
                   <div><p className="text-[9px] font-black opacity-30 uppercase">🏦 Bank</p><p className="font-black text-sm text-blue-400">{showBalance ? formatIDR(bankBal) : "Rp •••"}</p></div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-3xl border-l-8 border-green-500 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pemasukan</p>
                  <p className="text-2xl font-black text-green-600">{formatIDR(incomeTotal)}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl border-l-8 border-red-500 shadow-sm">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pengeluaran</p>
                  <p className="text-2xl font-black text-red-600">{formatIDR(expenseTotal)}</p>
                </div>
              </div>
              <div className="bg-orange-600 text-white p-8 rounded-[2.5rem] shadow-lg text-center">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Piutang</p>
                <p className="text-3xl font-black">{formatIDR(piutangTotal)}</p>
              </div>
            </div>

            {/* MUTASI */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="font-black text-[10px] uppercase text-slate-400 tracking-[0.4em]">Riwayat Mutasi</h3>
                 <div className="flex bg-slate-100 p-1 rounded-xl">
                   {['summary','input','invoices'].map(t=><button key={t} onClick={()=>setActiveTab(t)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${activeTab===t?'bg-white shadow text-blue-600':'text-slate-400'}`}>{t==='summary'?'Data':t==='input'?'Catat':'Piutang'}</button>)}
                 </div>
               </div>
               
               <div className="space-y-4">
                 {transactions.map((t,i)=>(
                   <div key={i} className="flex justify-between items-center p-5 bg-slate-50 rounded-2xl border border-slate-100">
                     <div className="flex items-center gap-5">
                       <div className={`p-3 rounded-xl ${t.method==='Bank'?'bg-blue-600 text-white':'bg-orange-500 text-white'}`}>{t.method==='Bank'?<CreditCard size={20}/>:<Banknote size={20}/>}</div>
                       <div>
                         <p className="font-black text-slate-800 text-sm uppercase">{t.description}</p>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{safeDate(t.date)} • {t.method} • {t.category}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <p className={`font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} {formatIDR(t.amount)}</p>
                        <button onClick={()=>handleDelete(t.id)} className="text-slate-300 hover:text-red-600"><Trash2 size={16}/></button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'input' && <FinanceInput db={db}/>}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices}/>}
      </div>
    </div>
  );
}

// --- SUB COMPONENTS (SIMPLE) ---
function FinanceInput({db}) {
  const [f, setF] = useState({type:'income', method:'Cash', amount:'', desc:'', cat:'Lainnya'});
  const save = async(e)=>{ e.preventDefault(); await addDoc(collection(db,"payments"), {...f, amount:Number(f.amount), date:new Date().toISOString().split('T')[0], createdAt:serverTimestamp()}); alert("Ok!"); setF({...f, amount:'', desc:''}); };
  return <form onSubmit={save} className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl space-y-6"><div className="flex bg-slate-100 p-1 rounded-xl"><button type="button" onClick={()=>setF({...f,type:'income'})} className={`flex-1 py-3 rounded-lg font-black text-xs uppercase ${f.type==='income'?'bg-green-600 text-white':'text-slate-400'}`}>Masuk</button><button type="button" onClick={()=>setF({...f,type:'expense'})} className={`flex-1 py-3 rounded-lg font-black text-xs uppercase ${f.type==='expense'?'bg-red-600 text-white':'text-slate-400'}`}>Keluar</button></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={()=>setF({...f,method:'Cash'})} className={`py-3 border-2 rounded-xl font-black text-xs uppercase ${f.method==='Cash'?'border-orange-500 bg-orange-500 text-white':'border-slate-100'}`}>Tunai</button><button type="button" onClick={()=>setF({...f,method:'Bank'})} className={`py-3 border-2 rounded-xl font-black text-xs uppercase ${f.method==='Bank'?'border-blue-600 bg-blue-600 text-white':'border-slate-100'}`}>Bank</button></div><input type="number" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})} className="w-full text-center text-3xl font-black p-4 border-b-4 outline-none" placeholder="0"/><input value={f.desc} onChange={e=>setF({...f,desc:e.target.value})} className="w-full p-4 border-2 rounded-xl font-bold" placeholder="Ket..."/><button className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase">Simpan</button></form>
}

function FinanceInvoices({db, invoices}){
  const pay = async(inv, amt)=>{ const rem = Math.max(0, inv.remainingAmount-amt); await updateDoc(doc(db,"invoices",inv.id),{remainingAmount:rem, status:rem<=0?'paid':'unpaid'}); await addDoc(collection(db,"payments"),{type:'income', amount:Number(amt), description:`Pelunasan ${inv.studentName}`, method:'Cash', category:'SPP', date:new Date().toISOString().split('T')[0], createdAt:serverTimestamp()}); alert("Lunas!"); };
  return <div className="max-w-4xl mx-auto space-y-4">{invoices.filter(i=>i.remainingAmount>0).map((inv,i)=><div key={i} className="bg-white p-6 rounded-3xl border flex justify-between items-center"><div><div className="font-black uppercase">{inv.studentName}</div><div className="text-xs text-slate-400 font-bold">Sisa: {formatIDR(inv.remainingAmount)}</div></div><button onClick={()=>{const v=prompt("Bayar:"); if(v) pay(inv,v)}} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs">BAYAR</button></div>)}</div>
}