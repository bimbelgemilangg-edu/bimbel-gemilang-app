import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { PlusCircle, MinusCircle, Save, CheckCircle } from 'lucide-react';

export default function FinanceInput({ db, students = [] }) {
  const [type, setType] = useState('income'); // 'income' or 'expense'
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('SPP');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Mohon lengkapi data!");

    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, // 'income' atau 'expense'
        amount: parseInt(amount),
        category,
        description: desc, // Keterangan transaksi
        studentName: selectedStudent || '-', // Nama siswa (opsional)
        date, // Tanggal transaksi
        createdAt: serverTimestamp()
      });

      // Reset Form
      setAmount('');
      setDesc('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error:", error);
      alert("Gagal menyimpan data!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
        
        {/* HEADER PILIHAN (PEMASUKAN / PENGELUARAN) */}
        <div className="flex">
          <button 
            onClick={() => setType('income')}
            className={`flex-1 py-6 flex items-center justify-center gap-3 transition-all ${type === 'income' ? 'bg-green-500 text-white shadow-inner' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
          >
            <PlusCircle size={24} className={type==='income'?'animate-bounce':''} />
            <span className="font-black text-lg uppercase tracking-widest">Pemasukan</span>
          </button>
          <button 
            onClick={() => setType('expense')}
            className={`flex-1 py-6 flex items-center justify-center gap-3 transition-all ${type === 'expense' ? 'bg-red-500 text-white shadow-inner' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}
          >
            <MinusCircle size={24} className={type==='expense'?'animate-bounce':''} />
            <span className="font-black text-lg uppercase tracking-widest">Pengeluaran</span>
          </button>
        </div>

        {/* FORM INPUT */}
        <div className="p-10">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Input Nominal */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Nominal (Rp)</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={`w-full text-4xl font-black p-6 rounded-3xl border-4 outline-none transition-all text-center ${type==='income'?'border-green-100 focus:border-green-500 text-green-600 placeholder:text-green-100':'border-red-100 focus:border-red-500 text-red-600 placeholder:text-red-100'}`}
                placeholder="0"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Tanggal */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Tanggal Transaksi</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 text-slate-700"
                />
              </div>

              {/* Kategori */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Kategori</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 text-slate-700"
                >
                  {type === 'income' ? (
                    <>
                      <option value="SPP">Pembayaran SPP</option>
                      <option value="Pendaftaran">Uang Pendaftaran</option>
                      <option value="Lainnya">Pemasukan Lain</option>
                    </>
                  ) : (
                    <>
                      <option value="Gaji">Gaji Guru/Staf</option>
                      <option value="Operasional">Listrik/Air/Internet</option>
                      <option value="Perlengkapan">Beli Alat Tulis/Modul</option>
                      <option value="Marketing">Iklan & Promosi</option>
                      <option value="Lainnya">Pengeluaran Lain</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Pilih Siswa (Hanya jika Pemasukan) */}
            {type === 'income' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Terima Dari (Siswa)</label>
                <select 
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 text-slate-700"
                >
                  <option value="">-- Bukan Siswa / Umum --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.name}>{s.name} - {s.schoolLevel}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Keterangan */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-4">Keterangan / Catatan</label>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows="3"
                className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-blue-500 text-slate-700"
                placeholder={type === 'income' ? "Contoh: Bayar SPP Bulan Januari" : "Contoh: Beli Spidol dan Kertas"}
              ></textarea>
            </div>

            {/* Tombol Simpan */}
            <button 
              disabled={loading}
              className={`w-full py-6 rounded-2xl font-black text-white text-xl uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-gray-400' : type==='income'?'bg-slate-900 hover:bg-black':'bg-red-600 hover:bg-red-700'}`}
            >
              {loading ? 'Menyimpan...' : (
                <>{success ? <CheckCircle size={24}/> : <Save size={24}/>} {success ? 'BERHASIL DISIMPAN!' : 'SIMPAN TRANSAKSI'}</>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}