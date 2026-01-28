import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MinusCircle, Save, CheckCircle } from 'lucide-react';

export default function FinanceInput({ db, students = [] }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('SPP');
  const [desc, setDesc] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Mohon lengkapi data!");

    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, 
        amount: parseInt(amount),
        category,
        description: desc,
        studentName: selectedStudent || '-',
        date: new Date().toISOString().split('T')[0],
        method: 'Cash', // Default
        createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); alert("Berhasil Disimpan!");
    } catch (error) {
      alert("Gagal: " + error.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in zoom-in">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-8">
        <button type="button" onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase flex justify-center gap-2 ${type==='income'?'bg-green-600 text-white shadow-lg':'text-slate-400'}`}><PlusCircle size={16}/> Pemasukan</button>
        <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-xs uppercase flex justify-center gap-2 ${type==='expense'?'bg-red-600 text-white shadow-lg':'text-slate-400'}`}><MinusCircle size={16}/> Pengeluaran</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
           <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nominal (Rp)</label>
           <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full text-4xl font-black p-6 rounded-[2rem] border-4 border-slate-100 text-center outline-none focus:border-blue-500" placeholder="0" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Kategori</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none">
              {type === 'income' ? <><option>SPP</option><option>Pendaftaran</option><option>Lainnya</option></> : <><option>Gaji</option><option>Operasional</option><option>Perlengkapan</option><option>Lainnya</option></>}
            </select>
          </div>
          
          {type === 'income' && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Siswa (Opsional)</label>
              <select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none">
                <option value="">-- Bukan Siswa / Umum --</option>
                {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Keterangan</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none" placeholder="Keterangan transaksi..." required></textarea>
        </div>

        <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">
          {loading ? '...' : 'SIMPAN'}
        </button>
      </form>
    </div>
  );
}