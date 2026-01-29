import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MinusCircle, Save, CheckCircle } from 'lucide-react';

export default function FinanceInput({ db }) {
  const [f, setF] = useState({ type: 'income', method: 'Cash', amount: '', desc: '', cat: 'Lainnya' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!f.amount || !f.desc) return alert("Isi Data!");
    setLoading(true);
    try {
      await addDoc(collection(db,"payments"), {
        ...f, amount: Number(f.amount), 
        date: new Date().toISOString().split('T')[0], // PASTI STRING AMAN
        createdAt: serverTimestamp()
      });
      alert("Tersimpan!"); setF({...f, amount:'', desc:''});
    } catch(e){ alert("Error"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in zoom-in">
      <form onSubmit={save} className="space-y-6">
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2">
          <button type="button" onClick={()=>setF({...f, type:'income'})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase ${f.type==='income'?'bg-green-600 text-white shadow-lg':'text-slate-400'}`}>Uang Masuk</button>
          <button type="button" onClick={()=>setF({...f, type:'expense'})} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase ${f.type==='expense'?'bg-red-600 text-white shadow-lg':'text-slate-400'}`}>Uang Keluar</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" onClick={()=>setF({...f, method:'Cash'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 ${f.method==='Cash'?'border-orange-500 bg-orange-500 text-white shadow-md':'border-slate-100 text-slate-400'}`}>💵 Tunai</button>
          <button type="button" onClick={()=>setF({...f, method:'Bank'})} className={`py-4 rounded-xl font-black text-[10px] uppercase border-2 ${f.method==='Bank'?'border-blue-600 bg-blue-600 text-white shadow-md':'border-slate-100 text-slate-400'}`}>🏦 Bank</button>
        </div>
        <input type="number" value={f.amount} onChange={e=>setF({...f, amount:e.target.value})} className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black text-4xl text-center outline-none" placeholder="0" required />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <select value={f.cat} onChange={e=>setF({...f, cat:e.target.value})} className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none"><option>SPP</option><option>Pendaftaran</option><option>Gaji</option><option>Operasional</option><option>Lainnya</option></select>
           <input value={f.desc} onChange={e=>setF({...f, desc:e.target.value})} className="p-4 bg-slate-50 border-2 rounded-2xl font-bold outline-none" placeholder="Keterangan..." required />
        </div>
        <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">{loading ? '...' : 'SIMPAN'}</button>
      </form>
    </div>
  );
}