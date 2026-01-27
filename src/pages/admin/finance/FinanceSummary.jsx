import React from 'react';
import { TrendingUp, TrendingDown, Wallet, AlertCircle } from 'lucide-react';

export default function FinanceSummary({ transactions = [], invoices = [], balance = 0 }) {
  
  // 1. HITUNG PEMASUKAN (Type: 'income')
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);

  // 2. HITUNG PENGELUARAN (Type: 'expense')
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);

  // 3. HITUNG PIUTANG (Total Tagihan Belum Lunas)
  const totalPiutang = invoices
    .reduce((acc, inv) => acc + (parseInt(inv.remainingAmount) || 0), 0);

  // Format Rupiah
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* KARTU ATAS: RINGKASAN UTAMA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* SALDO AKTIF */}
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform"><Wallet size={100}/></div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Saldo Kas</div>
          <div className="text-3xl font-black">{formatIDR(balance)}</div>
        </div>

        {/* PEMASUKAN */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-green-500 group-hover:scale-110 transition-transform"><TrendingUp size={100}/></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 text-green-600 p-2 rounded-full"><TrendingUp size={16}/></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pemasukan</div>
          </div>
          <div className="text-2xl font-black text-slate-800">{formatIDR(totalIncome)}</div>
        </div>

        {/* PENGELUARAN */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500 group-hover:scale-110 transition-transform"><TrendingDown size={100}/></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 text-red-600 p-2 rounded-full"><TrendingDown size={16}/></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Pengeluaran</div>
          </div>
          <div className="text-2xl font-black text-slate-800">{formatIDR(totalExpense)}</div>
        </div>

        {/* PIUTANG (UANG YANG BELUM DIBAYAR SISWA) */}
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-orange-500 group-hover:scale-110 transition-transform"><AlertCircle size={100}/></div>
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-full"><AlertCircle size={16}/></div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Piutang</div>
          </div>
          <div className="text-2xl font-black text-slate-800">{formatIDR(totalPiutang)}</div>
          <div className="text-[10px] text-orange-500 font-bold mt-1">Uang belum masuk</div>
        </div>

      </div>

      {/* TABEL TRANSAKSI TERAKHIR */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <h3 className="font-black text-lg mb-6 flex items-center gap-3 uppercase tracking-widest text-slate-800">
          <Wallet className="text-blue-600"/> Riwayat Transaksi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-600">
              {transactions.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-slate-300 italic">Belum ada data transaksi.</td></tr>
              ) : (
                transactions.slice(0, 10).map((t, i) => (
                  <tr key={t.id || i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-xs">{t.date}</td>
                    <td className="p-4">
                      <div className="text-slate-800">{t.description}</div>
                      <div className="text-[10px] text-slate-400">{t.studentName !== '-' ? t.studentName : 'Umum'}</div>
                    </td>
                    <td className="p-4"><span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] uppercase tracking-wide">{t.category}</span></td>
                    <td className={`p-4 text-right font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}