import React, { useState } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Wallet, AlertCircle, Eye, EyeOff, Trash2, Printer } from 'lucide-react';

export default function FinanceSummary({ transactions = [], invoices = [], balance = 0, db }) {
  const [showBalance, setShowBalance] = useState(true);

  // Helper Format
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  const safeDate = (val) => val ? val : '-';

  // Hitungan Statistik
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (Number(t.amount)||0), 0);
  const totalExpense = transactions.filter(t => t.type !== 'income').reduce((acc, t) => acc + (Number(t.amount)||0), 0);
  const totalPiutang = invoices.reduce((acc, i) => acc + (Number(i.remainingAmount)||0), 0);

  // Hapus Transaksi (Butuh Password)
  const handleDelete = async (id) => {
    const pwd = prompt("Masukkan Sandi Owner:");
    if(!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = s.exists() ? s.data().password : "2003";
    if(pwd === correct) await deleteDoc(doc(db, "payments", id));
    else alert("Sandi Salah!");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* GRID KARTU */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
          <button onClick={()=>setShowBalance(!showBalance)} className="absolute top-6 right-6 opacity-50 hover:opacity-100">{showBalance?<EyeOff/>:<Eye/>}</button>
          <div className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Total Saldo</div>
          <div className="text-3xl font-black">{showBalance ? formatIDR(balance) : "Rp •••••••"}</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-l-8 border-l-green-500">
           <div className="flex items-center gap-2 mb-2"><TrendingUp size={16} className="text-green-500"/><span className="text-[10px] font-black text-slate-400 uppercase">Pemasukan</span></div>
           <div className="text-2xl font-black text-slate-800">{formatIDR(totalIncome)}</div>
        </div>

        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-l-8 border-l-red-500">
           <div className="flex items-center gap-2 mb-2"><TrendingDown size={16} className="text-red-500"/><span className="text-[10px] font-black text-slate-400 uppercase">Pengeluaran</span></div>
           <div className="text-2xl font-black text-slate-800">{formatIDR(totalExpense)}</div>
        </div>

        <div className="bg-orange-500 text-white p-8 rounded-[2rem] shadow-lg">
           <div className="flex items-center gap-2 mb-2"><AlertCircle size={16}/><span className="text-[10px] font-black opacity-60 uppercase">Piutang Siswa</span></div>
           <div className="text-2xl font-black">{formatIDR(totalPiutang)}</div>
        </div>
      </div>

      {/* TABEL MUTASI */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-xs uppercase text-slate-400 tracking-[0.2em]">Riwayat Mutasi</h3>
          <button onClick={()=>window.print()} className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold flex gap-2"><Printer size={14}/> Cetak</button>
        </div>

        <div className="space-y-3">
          {transactions.slice(0, 50).map((t) => (
            <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
               <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-xl ${t.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                    {t.type==='income'?<TrendingUp size={18}/>:<TrendingDown size={18}/>}
                 </div>
                 <div>
                    <div className="font-black text-slate-800 text-sm uppercase">{t.description}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t.date} • {t.category} • {t.method||'Cash'}</div>
                 </div>
               </div>
               <div className="flex items-center gap-4">
                 <span className={`font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                   {t.type==='income'?'+':'-'} {formatIDR(t.amount)}
                 </span>
                 <button onClick={()=>handleDelete(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
               </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center text-slate-300 font-bold italic py-10">Belum ada data.</p>}
        </div>
      </div>
    </div>
  );
}