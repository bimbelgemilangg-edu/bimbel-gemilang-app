import React, { useState } from 'react';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Search, Send, CheckCircle } from 'lucide-react';

export default function FinanceInvoices({ db, invoices = [] }) {
  const [search, setSearch] = useState('');

  // Format Rupiah
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  // Filter
  const filtered = invoices.filter(inv => inv.studentName?.toLowerCase().includes(search.toLowerCase()));

  // Bayar Tagihan
  const handlePay = async (inv) => {
    const amountStr = prompt(`Sisa Tagihan: ${formatIDR(inv.remainingAmount)}\nMasukkan Pembayaran:`);
    if(!amountStr) return;
    const pay = parseInt(amountStr);
    
    if(isNaN(pay) || pay <= 0) return alert("Nominal tidak valid");
    if(pay > inv.remainingAmount) return alert("Pembayaran melebihi sisa tagihan!");

    const rem = inv.remainingAmount - pay;
    
    // 1. Update Invoice
    await updateDoc(doc(db, "invoices", inv.id), {
      remainingAmount: rem,
      status: rem <= 0 ? 'Lunas' : 'Belum Lunas'
    });

    // 2. Catat Pemasukan
    await addDoc(collection(db, "payments"), {
      type: 'income',
      amount: pay,
      category: 'SPP',
      description: `Pelunasan: ${inv.studentName}`,
      studentName: inv.studentName,
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
      createdAt: serverTimestamp()
    });

    alert("Pembayaran Berhasil!");
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
        <Search className="text-slate-400"/>
        <input type="text" placeholder="Cari nama siswa..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full font-bold outline-none text-slate-700"/>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 && <div className="text-center py-10 text-slate-300 font-bold">Tidak ada tagihan.</div>}
        
        {filtered.map((inv) => (
          <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-lg text-slate-800">{inv.studentName}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${inv.status==='Lunas' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {inv.status || 'Belum Lunas'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400">Jatuh Tempo: {inv.dueDate || '-'}</p>
            </div>
            
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Tagihan</p>
              <p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
            </div>

            {inv.remainingAmount > 0 ? (
              <button onClick={()=>handlePay(inv)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-green-600 transition-all shadow-lg">
                Bayar
              </button>
            ) : (
              <button disabled className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl font-black text-xs uppercase flex gap-2">
                <CheckCircle size={14}/> Lunas
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}