import React from 'react';
import { FileText, Download } from 'lucide-react';
// import jsPDF from 'jspdf'; // Kita matikan dulu biar aman
// import 'jspdf-autotable';

export default function FinanceReport({ transactions = [], balance = 0 }) {
  
  // Dummy Download Function (Biar tombol ada fungsinya dikit)
  const handlePrint = () => {
    window.print();
  };

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tighter mb-2">LAPORAN KEUANGAN</h2>
          <p className="text-slate-400 font-bold">Rekapitulasi Arus Kas Bimbel Gemilang</p>
        </div>
        <button onClick={handlePrint} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase hover:bg-blue-50 transition-all flex items-center gap-3">
          <Download size={20}/> Cetak / PDF
        </button>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="font-black text-lg mb-6 flex items-center gap-3 uppercase tracking-widest text-slate-800">
          <FileText className="text-blue-600"/> Rincian Transaksi
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-4 rounded-l-xl">Tanggal</th>
                <th className="p-4">Keterangan</th>
                <th className="p-4">Tipe</th>
                <th className="p-4 text-right rounded-r-xl">Nominal</th>
              </tr>
            </thead>
            <tbody className="text-sm font-bold text-slate-600">
              {transactions.map((t, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-blue-50 transition-colors">
                  <td className="p-4">{t.date}</td>
                  <td className="p-4">{t.description}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] uppercase ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                    </span>
                  </td>
                  <td className={`p-4 text-right font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white">
                <td colSpan="3" className="p-6 text-right font-bold uppercase tracking-widest rounded-l-2xl">Total Saldo Akhir</td>
                <td className="p-6 text-right font-black text-xl rounded-r-2xl">{formatIDR(balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}