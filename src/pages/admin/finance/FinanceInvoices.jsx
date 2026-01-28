import React from 'react';
import { updateDoc, doc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function FinanceInvoices({ db, invoices = [] }) {
  const pay = async (inv) => {
    const v = prompt("Bayar berapa?");
    if(!v) return;
    const p = parseInt(v);
    if(p > inv.remainingAmount) return alert("Kelebihan!");
    
    await updateDoc(doc(db,"invoices",inv.id), { remainingAmount: inv.remainingAmount - p, status: (inv.remainingAmount-p)<=0?'Lunas':'Belum' });
    await addDoc(collection(db,"payments"), { type:'income', amount:p, category:'SPP', description:`Pelunasan: ${inv.studentName}`, date:new Date().toISOString().split('T')[0], createdAt:serverTimestamp() });
    alert("Lunas!");
  };

  return (
    <div className="space-y-4">
      {invoices.filter(i=>i.remainingAmount>0).map(i => (
        <div key={i.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
          <div><h4 className="font-black text-lg">{i.studentName}</h4><p className="text-xs text-slate-400 font-bold uppercase">Tempo: {i.dueDate}</p></div>
          <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400">Sisa</p><p className="text-xl font-black text-red-600">Rp {i.remainingAmount}</p></div>
          <button onClick={()=>pay(i)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Bayar</button>
        </div>
      ))}
      {invoices.filter(i=>i.remainingAmount>0).length===0 && <div className="text-center py-10 text-slate-300 font-bold">Tidak ada tagihan.</div>}
    </div>
  );
}