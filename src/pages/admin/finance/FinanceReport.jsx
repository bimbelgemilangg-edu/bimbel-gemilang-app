import React from 'react';
import { Printer, TrendingUp, TrendingDown } from 'lucide-react';

const formatRupiah = (val) => val ? val.toLocaleString('id-ID') : "0";

export default function FinanceReport({ transactions, invoices, balance }) {
  
  // Analisis Bulanan (Otomatis)
  const monthlyAnalysis = transactions.reduce((acc, t) => {
    const d = t.date?.toDate ? t.date.toDate() : new Date();
    const key = `${d.getFullYear()}-${d.getMonth()}`; // Group by Year-Month
    const monthName = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    
    if (!acc[key]) acc[key] = { name: monthName, inc: 0, exp: 0, count: 0 };
    
    if (t.type === 'income') acc[key].inc += t.amount;
    else acc[key].exp += t.amount;
    acc[key].count++;
    
    return acc;
  }, {});

  const analysisList = Object.values(monthlyAnalysis).sort((a,b) => b.name.localeCompare(a.name)); // Sort terbaru

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
      
      {/* TOMBOL CETAK (Hanya muncul di layar) */}
      <div className="flex justify-end print:hidden">
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase flex items-center gap-2 hover:bg-black shadow-xl transition-all">
          <Printer size={18}/> Cetak Laporan PDF
        </button>
      </div>

      {/* --- AREA KERTAS A4 --- */}
      <div className="bg-white p-10 min-h-screen print:p-0 print:shadow-none shadow-2xl">
        
        {/* HEADER LAPORAN */}
        <div className="text-center border-b-4 border-black pb-6 mb-10">
          <h1 className="text-4xl font-black uppercase tracking-widest mb-2">Laporan Keuangan</h1>
          <p className="text-sm font-bold uppercase tracking-[0.3em]">Bimbel Gemilang • Tahun {new Date().getFullYear()}</p>
        </div>

        {/* RINGKASAN EKSEKUTIF */}
        <div className="grid grid-cols-3 gap-4 mb-10 border-2 border-black p-6 bg-slate-50">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase mb-1">Saldo Akhir</p>
            <p className="text-2xl font-black">Rp {formatRupiah(balance)}</p>
          </div>
          <div className="text-center border-l-2 border-black">
            <p className="text-[10px] font-black uppercase mb-1 text-green-600">Total Pemasukan</p>
            <p className="text-2xl font-black text-green-700">Rp {formatRupiah(transactions.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0))}</p>
          </div>
          <div className="text-center border-l-2 border-black">
            <p className="text-[10px] font-black uppercase mb-1 text-red-600">Total Pengeluaran</p>
            <p className="text-2xl font-black text-red-700">Rp {formatRupiah(transactions.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0))}</p>
          </div>
        </div>

        {/* ANALISIS BULANAN */}
        <h3 className="text-lg font-black uppercase mb-4 border-l-4 border-black pl-3">Analisis Bulanan</h3>
        <div className="space-y-4 mb-12">
          {analysisList.map((m, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-dashed border-gray-300 pb-2 break-inside-avoid">
              <span className="font-black uppercase w-32">{m.name}</span>
              <div className="flex-1 px-4">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden flex">
                  <div style={{width: `${(m.inc / (m.inc+m.exp || 1))*100}%`}} className="bg-green-500 h-full"></div>
                  <div style={{width: `${(m.exp / (m.inc+m.exp || 1))*100}%`}} className="bg-red-500 h-full"></div>
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="text-green-600 font-bold block">+ {formatRupiah(m.inc)}</span>
                <span className="text-red-600 font-bold block">- {formatRupiah(m.exp)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TABEL MUTASI (AUTO PAGE BREAK) */}
        <h3 className="text-lg font-black uppercase mb-4 border-l-4 border-black pl-3 page-break-before">Rincian Mutasi Kas</h3>
        <table className="w-full text-xs border-collapse border border-black">
          <thead className="bg-gray-200">
            <tr>
              <th className="border border-black p-2 text-center w-10">No</th>
              <th className="border border-black p-2 text-left w-24">Tanggal</th>
              <th className="border border-black p-2 text-left">Keterangan</th>
              <th className="border border-black p-2 text-right w-24">Masuk</th>
              <th className="border border-black p-2 text-right w-24">Keluar</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, i) => (
              <tr key={t.id} style={{pageBreakInside: 'avoid'}}>
                <td className="border border-black p-2 text-center">{i+1}</td>
                <td className="border border-black p-2">{t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-'}</td>
                <td className="border border-black p-2 uppercase font-bold text-[10px]">{t.description} <span className="text-gray-500 font-normal">({t.category})</span></td>
                <td className="border border-black p-2 text-right">{t.type==='income' ? formatRupiah(t.amount) : ''}</td>
                <td className="border border-black p-2 text-right">{t.type==='expense' ? formatRupiah(t.amount) : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>

      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 15mm; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .page-break-before { page-break-before: always; }
          tr, .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}