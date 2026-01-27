import React, { useState } from 'react';
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';

const formatRupiah = (val) => val ? val.toLocaleString('id-ID') : "0";

export default function FinanceSummary({ db, transactions, balance }) {
  const [showSaldo, setShowSaldo] = useState(false); // Default sembunyi

  // Hitung Pemasukan/Pengeluaran Bulan Ini
  const thisMonth = new Date().getMonth();
  const monthlyStats = transactions.reduce((acc, t) => {
    const tDate = t.date?.toDate ? t.date.toDate() : new Date();
    if (tDate.getMonth() === thisMonth) {
      if (t.type === 'income') acc.inc += t.amount;
      else acc.exp += t.amount;
    }
    return acc;
  }, { inc: 0, exp: 0 });

  const handleDelete = async (id) => {
    // Fitur hapus ini sebaiknya dikunci password owner di masa depan
    if (confirm("Hapus transaksi ini? Saldo akan berubah.")) await deleteDoc(doc(db, "payments", id));
  };

  return (
    <div className="space-y-8 animate-in fade-in max-w-7xl mx-auto">
      
      {/* 1. KARTU SALDO UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col justify-between h-64">
          <div className="flex justify-between items-start z-10">
            <div className="p-3 bg-white/10 rounded-2xl"><TrendingUp size={24}/></div>
            <button onClick={()=>setShowSaldo(!showSaldo)} className="p-2 hover:bg-white/10 rounded-full transition-all">
              {showSaldo ? <EyeOff size={20}/> : <Eye size={20}/>}
            </button>
          </div>
          <div className="z-10">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Saldo Kas</p>
            <h2 className="text-5xl font-black tracking-tighter">
              {showSaldo ? `Rp ${formatRupiah(balance)}` : 'Rp ••••••••'}
            </h2>
          </div>
          {/* Hiasan Background */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-600 rounded-full blur-[80px] opacity-50"></div>
        </div>

        <div className="md:col-span-2 grid grid-cols-2 gap-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 text-green-600">
              <div className="p-2 bg-green-50 rounded-lg"><ArrowDownLeft size={20}/></div>
              <span className="text-xs font-black uppercase tracking-widest">Masuk Bulan Ini</span>
            </div>
            <p className="text-4xl font-black text-slate-800">Rp {formatRupiah(monthlyStats.inc)}</p>
          </div>
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-2 bg-red-50 rounded-lg"><ArrowUpRight size={20}/></div>
              <span className="text-xs font-black uppercase tracking-widest">Keluar Bulan Ini</span>
            </div>
            <p className="text-4xl font-black text-slate-800">Rp {formatRupiah(monthlyStats.exp)}</p>
          </div>
        </div>
      </div>

      {/* 2. TABEL MUTASI TERAKHIR */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-black text-lg uppercase tracking-tight text-slate-800">Mutasi Terakhir</h3>
          <span className="text-xs font-bold bg-slate-100 px-3 py-1 rounded-lg text-slate-500">10 Transaksi Terbaru</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 font-black">
              <tr>
                <th className="px-8 py-4">Tanggal</th>
                <th className="px-8 py-4">Keterangan</th>
                <th className="px-8 py-4">Kategori</th>
                <th className="px-8 py-4 text-right">Nominal</th>
                <th className="px-8 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {transactions.slice(0, 10).map((t) => (
                <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-4 font-bold text-slate-500">{t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-8 py-4 font-bold text-slate-800 uppercase">{t.description}</td>
                  <td className="px-8 py-4"><span className="bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-slate-500">{t.category}</span></td>
                  <td className={`px-8 py-4 text-right font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                    {t.type==='income' ? '+' : '-'} Rp {formatRupiah(t.amount)}
                  </td>
                  <td className="px-8 py-4 text-center">
                    <button onClick={()=>handleDelete(t.id)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}