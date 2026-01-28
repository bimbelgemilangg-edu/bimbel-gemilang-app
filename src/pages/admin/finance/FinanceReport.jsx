import React from 'react';
import { Download } from 'lucide-react';

export default function FinanceReport({ transactions = [], balance = 0 }) {
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex justify-between items-center shadow-xl">
        <div><h2 className="text-2xl font-black">LAPORAN</h2><p className="text-slate-400 font-bold text-sm">Rekap Arus Kas</p></div>
        <button onClick={()=>window.print()} className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase flex gap-2"><Download size={16}/> Cetak</button>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-[10px] font-black uppercase text-slate-400"><th className="p-4">Tanggal</th><th className="p-4">Ket</th><th className="p-4 text-right">Nominal</th></tr></thead>
          <tbody>
            {transactions.map((t,i)=>(
              <tr key={i} className="border-b">
                <td className="p-4">{t.date}</td>
                <td className="p-4"><div className="font-bold">{t.description}</div><div className="text-[10px] uppercase text-slate-400">{t.type}</div></td>
                <td className={`p-4 text-right font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} {fmt(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}