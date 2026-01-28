import React, { useState } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { TrendingUp, TrendingDown, Eye, EyeOff, Trash2, Printer, AlertCircle } from 'lucide-react';

export default function FinanceSummary({ transactions = [], invoices = [], balance = 0, db }) {
  const [show, setShow] = useState(true);
  const fmt = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const inc = transactions.filter(t=>t.type==='income').reduce((a,b)=>a+(parseInt(b.amount)||0),0);
  const exp = transactions.filter(t=>t.type!=='income').reduce((a,b)=>a+(parseInt(b.amount)||0),0);
  const debt = invoices.reduce((a,b)=>a+(parseInt(b.remainingAmount)||0),0);

  const del = async (id) => {
    const pwd = prompt("Sandi Owner:");
    if(!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    if(pwd === (s.exists() ? s.data().password : "2003")) await deleteDoc(doc(db, "payments", id));
    else alert("Sandi Salah");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <button onClick={()=>setShow(!show)} className="absolute top-6 right-6 opacity-50"><Eye size={20}/></button>
          <div className="text-[10px] uppercase opacity-50 mb-1">Saldo Kas</div>
          <div className="text-3xl font-black">{show ? fmt(balance) : 'Rp •••'}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-l-8 border-green-500 shadow-sm">
          <div className="flex gap-2 mb-1 text-green-600"><TrendingUp size={16}/><span className="text-[10px] font-black uppercase">Masuk</span></div>
          <div className="text-2xl font-black">{fmt(inc)}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-l-8 border-red-500 shadow-sm">
          <div className="flex gap-2 mb-1 text-red-600"><TrendingDown size={16}/><span className="text-[10px] font-black uppercase">Keluar</span></div>
          <div className="text-2xl font-black">{fmt(exp)}</div>
        </div>
        <div className="bg-orange-500 text-white p-6 rounded-[2rem] shadow-lg">
          <div className="flex gap-2 mb-1 text-white/80"><AlertCircle size={16}/><span className="text-[10px] font-black uppercase">Piutang</span></div>
          <div className="text-2xl font-black">{fmt(debt)}</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <h3 className="font-black text-xs uppercase text-slate-400 mb-6">Mutasi Terakhir</h3>
        <div className="space-y-2">
          {transactions.slice(0, 50).map(t => (
            <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group hover:bg-white border hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${t.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                  {t.type==='income'?<TrendingUp size={16}/>:<TrendingDown size={16}/>}
                </div>
                <div>
                  <div className="font-black text-sm uppercase">{t.description}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{t.date} • {t.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} {fmt(t.amount)}</span>
                <button onClick={()=>del(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}