import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MinusCircle, Save } from 'lucide-react';

export default function FinanceInput({ db, students = [] }) {
  const [form, setForm] = useState({ type:'income', amount:'', cat:'SPP', desc:'', stud:'' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!form.amount || !form.desc) return alert("Isi Data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type: form.type,
        amount: parseInt(form.amount),
        category: form.cat,
        description: form.desc,
        studentName: form.stud || '-',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp()
      });
      alert("Disimpan!"); setForm({...form, amount:'', desc:''});
    } catch(e) { alert("Error"); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in zoom-in">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-6">
        <button onClick={()=>setForm({...form, type:'income'})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${form.type==='income'?'bg-green-600 text-white shadow':'text-slate-400'}`}>Pemasukan</button>
        <button onClick={()=>setForm({...form, type:'expense'})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${form.type==='expense'?'bg-red-600 text-white shadow':'text-slate-400'}`}>Pengeluaran</button>
      </div>
      <form onSubmit={save} className="space-y-6">
        <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="w-full text-3xl font-black p-5 rounded-[2rem] border-4 border-slate-100 text-center outline-none focus:border-blue-500" placeholder="0"/>
        <div className="grid grid-cols-2 gap-4">
          <select value={form.cat} onChange={e=>setForm({...form, cat:e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100">
            {form.type==='income' ? <><option>SPP</option><option>Pendaftaran</option><option>Lainnya</option></> : <><option>Gaji</option><option>Operasional</option><option>Lainnya</option></>}
          </select>
          {form.type==='income' && (
            <select value={form.stud} onChange={e=>setForm({...form, stud:e.target.value})} className="p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100">
              <option value="">-- Umum --</option>
              {students.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          )}
        </div>
        <textarea value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100" placeholder="Keterangan..." required></textarea>
        <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg">{loading?'...':'SIMPAN'}</button>
      </form>
    </div>
  );
}