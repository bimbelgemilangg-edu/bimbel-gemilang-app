import React, { useState, useMemo } from 'react';
import { Search, Filter, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { doc, runTransaction, collection, serverTimestamp } from 'firebase/firestore';

const formatRupiah = (val) => val ? val.toLocaleString('id-ID') : "0";

export default function FinanceInvoices({ db, invoices, students }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("unpaid"); // unpaid | paid
  const [selectedInv, setSelectedInv] = useState(null); // Untuk modal bayar
  const [payAmount, setPayAmount] = useState("");

  // Filter Cerdas
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchName = inv.studentName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "ALL" || inv.status === filterStatus;
      return matchName && matchStatus;
    });
  }, [invoices, search, filterStatus]);

  // Proses Bayar (Cicilan/Lunas)
  const handlePay = async (e) => {
    e.preventDefault();
    if (!selectedInv) return;
    
    // Hilangkan titik/koma dari input rupiah
    const amount = parseInt(payAmount.replace(/\D/g, '')); 
    if (amount <= 0 || amount > selectedInv.remainingAmount) return alert("Nominal tidak valid!");

    try {
      await runTransaction(db, async (t) => {
        const invRef = doc(db, "invoices", selectedInv.id);
        const newRem = selectedInv.remainingAmount - amount;
        
        // Update Invoice
        t.update(invRef, { 
          remainingAmount: newRem, 
          status: newRem <= 0 ? 'paid' : 'partial' 
        });

        // Catat di Mutasi Kas
        t.set(doc(collection(db, "payments")), {
          invoiceId: selectedInv.id,
          studentName: selectedInv.studentName,
          amount: amount,
          type: 'income',
          category: 'SPP/Tagihan',
          method: 'Tunai', // Default Tunai (bisa dikembangkan)
          description: `Pembayaran Tagihan: ${selectedInv.details} (${selectedInv.studentName})`,
          date: serverTimestamp()
        });
      });
      alert("Pembayaran Berhasil!");
      setSelectedInv(null); setPayAmount("");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
      
      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2 w-full md:w-auto bg-slate-50 px-4 py-3 rounded-xl border border-slate-200">
          <Search size={18} className="text-slate-400"/>
          <input className="bg-transparent outline-none font-bold text-sm w-full" placeholder="Cari Nama Siswa..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {['unpaid', 'paid', 'ALL'].map(s => (
            <button key={s} onClick={()=>setFilterStatus(s)} className={`flex-1 px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${filterStatus===s ? 'bg-slate-800 text-white' : 'bg-white border hover:bg-slate-50'}`}>
              {s === 'unpaid' ? 'Belum Lunas' : s === 'paid' ? 'Lunas' : 'Semua'}
            </button>
          ))}
        </div>
      </div>

      {/* GRID TAGIHAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(inv => (
          <div key={inv.id} className={`bg-white p-6 rounded-[2rem] border-2 transition-all hover:shadow-lg ${inv.status==='paid'?'border-green-100 opacity-70':'border-red-50 hover:border-red-200'}`}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="font-black text-lg text-slate-800 uppercase truncate w-40">{inv.studentName}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{inv.details}</p>
              </div>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${inv.status==='paid'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{inv.status}</span>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Total Tagihan</span>
                <span className="font-black">Rp {formatRupiah(inv.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-slate-400">Sisa Hutang</span>
                <span className="font-black text-red-500">Rp {formatRupiah(inv.remainingAmount)}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 bg-slate-50 p-2 rounded-lg mt-2">
                <Calendar size={14}/> Jatuh Tempo: {inv.dueDate || '-'}
              </div>
            </div>

            {inv.status !== 'paid' && (
              <button onClick={()=>{setSelectedInv(inv); setPayAmount("")}} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase hover:bg-blue-700 transition-all shadow-lg flex justify-center items-center gap-2">
                <CreditCard size={16}/> Bayar / Cicil
              </button>
            )}
          </div>
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center py-20 text-slate-400 font-bold">Data tidak ditemukan.</div>}
      </div>

      {/* MODAL BAYAR */}
      {selectedInv && (
        <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 animate-in zoom-in shadow-2xl">
            <h3 className="text-xl font-black uppercase mb-1">Pembayaran Tagihan</h3>
            <p className="text-sm font-bold text-slate-400 mb-6">{selectedInv.studentName} - {selectedInv.details}</p>
            
            <div className="bg-blue-50 p-6 rounded-2xl mb-6 text-center border-2 border-blue-100">
              <p className="text-xs font-bold text-blue-400 uppercase mb-1">Sisa Yang Harus Dibayar</p>
              <p className="text-3xl font-black text-blue-700">Rp {formatRupiah(selectedInv.remainingAmount)}</p>
            </div>

            <form onSubmit={handlePay} className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nominal Bayar (Rp)</label>
                <input autoFocus className="w-full p-4 border-2 border-slate-200 rounded-xl font-black text-xl outline-none focus:border-blue-500" placeholder="0" value={payAmount} onChange={e=>setPayAmount(formatRupiah(e.target.value.replace(/\D/g,'')))}/>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={()=>setSelectedInv(null)} className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase hover:bg-slate-200">Batal</button>
                <button className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase hover:bg-blue-700 shadow-lg">Proses Bayar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}