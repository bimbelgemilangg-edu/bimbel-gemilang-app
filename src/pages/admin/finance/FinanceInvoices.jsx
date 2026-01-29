import React from 'react';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);

export default function FinanceInvoices({ db, invoices = [] }) {
  const handlePay = async (inv, amt) => {
    const pay = Number(amt);
    if(isNaN(pay) || pay <= 0) return;
    try {
      const remaining = Math.max(0, inv.remainingAmount - pay);
      await updateDoc(doc(db,"invoices",inv.id), { remainingAmount: remaining, status: remaining<=0?'paid':'unpaid' });
      await addDoc(collection(db,"payments"), {
        type: 'income', amount: pay, description: `Pelunasan: ${inv.studentName}`, 
        category: 'SPP', method: 'Cash', date: new Date().toISOString().split('T')[0], createdAt: serverTimestamp()
      });
      alert("Lunas!");
    } catch (e) { alert("Error!"); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in slide-in-from-right">
      <h2 className="font-black text-slate-800 text-xl mb-4 uppercase italic">Piutang Aktif</h2>
      {invoices.filter(i=>i.remainingAmount>0).map((inv, i) => (
        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-md">
          <div className="flex-1"><p className="font-black text-slate-800 uppercase text-lg">{inv.studentName}</p><p className="text-[10px] text-slate-400 font-bold uppercase">Tempo: {inv.dueDate}</p></div>
          <div className="text-right px-10"><p className="text-[10px] font-black text-red-400 uppercase">Sisa</p><p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p></div>
          <button onClick={()=>{const v=prompt("Bayar:"); if(v) handlePay(inv,v)}} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase">BAYAR</button>
        </div>
      ))}
      {invoices.filter(i=>i.remainingAmount>0).length === 0 && <div className="text-center py-10 text-slate-300 font-bold">Tidak ada piutang.</div>}
    </div>
  );
}