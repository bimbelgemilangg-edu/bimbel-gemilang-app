import React, { useState } from 'react';
import { Search, DollarSign, Send, CheckCircle } from 'lucide-react';

export default function FinanceInvoices({ db, invoices = [], students = [] }) {
  const [search, setSearch] = useState('');

  // Filter Tagihan
  const filteredInvoices = invoices.filter(inv => 
    inv.studentName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">TAGIHAN SISWA</h2>
          <p className="text-slate-400 font-bold text-sm">Monitor pembayaran SPP & Daftar Ulang</p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 px-4">
        <Search size={20} className="text-slate-400"/>
        <input 
          type="text" 
          placeholder="Cari nama siswa..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent w-full py-3 font-bold text-slate-700 outline-none placeholder:text-slate-300"
        />
      </div>

      {/* LIST TAGIHAN */}
      <div className="grid grid-cols-1 gap-4">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <DollarSign className="mx-auto text-slate-300 mb-4" size={48}/>
            <p className="text-slate-400 font-bold">Tidak ada data tagihan.</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-6">
              
              {/* Info Siswa */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-black text-lg text-slate-800">{inv.studentName}</h3>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${inv.status === 'Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {inv.status || 'Belum Lunas'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-400">Jatuh Tempo: {inv.dueDate}</p>
              </div>

              {/* Info Nominal */}
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Tagihan</p>
                <p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
              </div>

              {/* Action Button */}
              <div>
                 {inv.waPhone && (
                  <a 
                    href={`https://wa.me/${inv.waPhone}?text=Halo, kami dari Bimbel Gemilang ingin mengingatkan tagihan atas nama ${inv.studentName} sebesar ${formatIDR(inv.remainingAmount)}.`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:shadow-green-200 transition-all"
                  >
                    <Send size={16}/> Ingatkan WA
                  </a>
                 )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}