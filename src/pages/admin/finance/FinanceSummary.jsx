import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff, CreditCard, Banknote, Trash2, Printer, Download, FileText } from 'lucide-react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';

// HELPER
const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);
const safeDate = (val) => {
  if (!val) return "-";
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('id-ID');
  return val.toString();
};

export default function FinanceSummary({ db, transactions = [], invoices = [], balance = 0, incomeTotal, expenseTotal, piutangTotal, cashBal, bankBal }) {
  const [showBalance, setShowBalance] = useState(true);

  // LOGIKA HAPUS DENGAN SANDI OWNER
  const handleDelete = async (id) => {
    const pwd = prompt("Masukkan Sandi Owner:");
    if (!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = s.exists() ? s.data().password : "2003";
    if (pwd === correct) { await deleteDoc(doc(db, "payments", id)); alert("Terhapus!"); } 
    else alert("Sandi Salah!");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* GRID SALDO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
          <button onClick={()=>setShowBalance(!showBalance)} className="absolute top-6 right-6 opacity-50 hover:opacity-100">{showBalance?<EyeOff size={20}/>:<Eye size={20}/>}</button>
          <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-2">Total Kas</p>
          <p className="text-4xl font-black">{showBalance ? formatIDR(balance) : "Rp ••••••••"}</p>
          <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
              <div><p className="text-[9px] font-black opacity-30 uppercase">💵 Tunai</p><p className="font-bold">{showBalance ? formatIDR(cashBal) : "..."}</p></div>
              <div><p className="text-[9px] font-black opacity-30 uppercase">🏦 Bank</p><p className="font-bold text-blue-400">{showBalance ? formatIDR(bankBal) : "..."}</p></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-6 rounded-3xl border-l-8 border-green-500 shadow-sm flex justify-between items-center">
            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pemasukan</p><p className="text-2xl font-black text-green-600">{formatIDR(incomeTotal)}</p></div>
            <TrendingUp className="text-green-100" size={32}/>
          </div>
          <div className="bg-white p-6 rounded-3xl border-l-8 border-red-500 shadow-sm flex justify-between items-center">
            <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pengeluaran</p><p className="text-2xl font-black text-red-600">{formatIDR(expenseTotal)}</p></div>
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
          <button onClick={()=>window.print()} className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 flex gap-2"><Printer size={14}/> Cetak PDF</button>
        </div>
        <div className="space-y-3">
          {transactions.slice(0, 50).map((t, i) => {
             // Logic Warna
             const isInc = t.type === 'income' || t.type === 'pemasukan' || t.category === 'Pendaftaran' || t.category === 'SPP';
             return (
              <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white transition-all">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${String(t.method).toLowerCase().includes('bank') ? 'bg-blue-600 text-white' : 'bg-orange-500 text-white'}`}>
                    {String(t.method).toLowerCase().includes('bank') ? <CreditCard size={18}/> : <Banknote size={18}/>}
                  </div>
                  <div>
                    <p className="font-bold text-slate-800 text-sm uppercase">{t.description}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{safeDate(t.date)} • {t.method} • {t.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className={`font-black text-base ${isInc ? 'text-green-600' : 'text-red-600'}`}>{isInc ? '+' : '-'} {formatIDR(t.amount)}</p>
                  <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                </div>
              </div>
             )
          })}
        </div>
      </div>
    </div>
  );
}