import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, Download, FileSpreadsheet, Printer } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); 
  
  // Data
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  
  // Saldo & Statistik
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // Modal & Form State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payMethod, setPayMethod] = useState('Tunai'); 

  const [inputType, setInputType] = useState('expense'); 
  const [newTrans, setNewTrans] = useState({ title: "", amountStr: "", category: "Lainnya", method: "Tunai", date: "" });
  
  const [showManualInv, setShowManualInv] = useState(false);
  const [newInv, setNewInv] = useState({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), s => {
      const trans = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      let cash = 0, bank = 0, inc = 0, exp = 0;
      trans.forEach(t => {
        const amt = t.amount || 0;
        if (t.type === 'expense') {
          exp += amt;
          if(t.method === 'Tunai') cash -= amt; else bank -= amt;
        } else {
          inc += amt;
          if(t.method === 'Tunai') cash += amt; else bank += amt;
        }
      });
      setBalance({ cash, bank, total: cash + bank });
      setIncomeTotal(inc); setExpenseTotal(exp);
    });
    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- ACTIONS ---
  const downloadExcel = () => {
    let csvContent = "\uFEFFNo;Tanggal;Keterangan;Kategori;Tipe;Metode;Nominal\n";
    transactions.forEach((t, idx) => {
      const date = t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-';
      csvContent += `${idx+1};${date};${t.description};${t.category};${t.type==='income'?'Masuk':'Keluar'};${t.method};${t.amount}\n`;
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.download = `Laporan_Keuangan.csv`; link.click();
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(payAmountStr);
    if (amount <= 0 || amount > selectedInvoice.remainingAmount) return alert("Nominal Salah!");
    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'invoices', selectedInvoice.id);
        const rem = selectedInvoice.remainingAmount - amount;
        t.update(ref, { remainingAmount: rem, status: rem <= 0 ? 'paid' : 'partial' });
        t.set(doc(collection(db, 'payments')), { 
          invoiceId: selectedInvoice.id, studentName: selectedInvoice.studentName, 
          amount, method: payMethod, type: 'income', category: 'SPP/Tagihan',
          description: `Pelunasan ${selectedInvoice.studentName}`, date: serverTimestamp() 
        });
      });
      setShowPayModal(false); setPayAmountStr(""); alert("Pembayaran Berhasil!");
    } catch (err) { alert(err.message); }
  };

  const handleInputTransaction = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newTrans.amountStr);
    if (amount <= 0) return alert("Nominal 0?");
    try {
      await addDoc(collection(db, 'payments'), {
        amount, method: newTrans.method, type: inputType, category: newTrans.category,
        description: newTrans.title, date: newTrans.date ? new Date(newTrans.date) : serverTimestamp(), studentName: '-' 
      });
      setNewTrans({ title: "", amountStr: "", category: "Lainnya", method: "Tunai", date: "" });
      alert("Transaksi Disimpan!");
    } catch (err) { alert(err.message); }
  };

  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newInv.totalAmountStr);
    const student = students.find(s => s.id === newInv.studentId);
    if(!student) return alert("Pilih Siswa!");
    await addDoc(collection(db, 'invoices'), {
      studentId: newInv.studentId, studentName: student.name,
      totalAmount: amount, remainingAmount: amount, status: 'unpaid',
      dueDate: newInv.dueDate, details: newInv.details, type: 'manual', createdAt: serverTimestamp()
    });
    setShowManualInv(false); setNewInv({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });
    alert("Tagihan Dibuat!");
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* 1. TOP STATS (BESAR & LEBAR) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl lg:col-span-2 flex flex-col justify-center">
          <div className="flex items-center gap-4 opacity-50 mb-2 uppercase tracking-widest text-xs font-black"><DollarSign size={20}/> Saldo Total</div>
          <div className="text-6xl font-black tracking-tighter">Rp {formatRupiah(balance.total)}</div>
          <div className="flex gap-6 mt-8 border-t border-white/10 pt-6">
            <div><p className="text-[10px] opacity-40 font-bold uppercase">Kas Tunai</p><p className="font-black text-xl text-green-400">Rp {formatRupiah(balance.cash)}</p></div>
            <div><p className="text-[10px] opacity-40 font-bold uppercase">Bank / Transfer</p><p className="font-black text-xl text-blue-400">Rp {formatRupiah(balance.bank)}</p></div>
          </div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col justify-center">
          <div className="text-green-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><ArrowDownLeft size={20}/> Pemasukan</div>
          <div className="text-4xl font-black text-green-700">Rp {formatRupiah(incomeTotal)}</div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl flex flex-col justify-center">
          <div className="text-red-600 mb-2 flex items-center gap-2 font-black uppercase text-xs tracking-widest"><ArrowUpRight size={20}/> Pengeluaran</div>
          <div className="text-4xl font-black text-red-700">Rp {formatRupiah(expenseTotal)}</div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS (BESAR) */}
      <div className="flex bg-gray-100 p-2 rounded-[2.5rem] w-fit shadow-inner">
        {[
          {id:'summary', l:'Mutasi Kas', i:PieChart},
          {id:'invoices', l:'Tagihan Siswa', i:Receipt},
          {id:'input', l:'Catat Transaksi', i:Wallet}
        ].map(m => (
          <button key={m.id} onClick={()=>setTab(m.id)} className={`px-10 py-5 rounded-[2rem] font-black text-sm flex items-center gap-3 transition-all ${tab===m.id?'bg-white text-blue-600 shadow-lg scale-105':'text-gray-400 hover:text-gray-600'}`}>
            <m.i size={20}/> {m.l}
          </button>
        ))}
      </div>

      {/* 3. CONTENT AREA */}
      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* TAB 1: MUTASI */}
        {tab === 'summary' && (
          <div className="animate-in fade-in duration-500">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800">Jurnal Mutasi Keuangan</h3>
              <div className="flex gap-4">
                <button onClick={()=>window.print()} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-900"><Printer size={16}/> Cetak PDF</button>
                <button onClick={downloadExcel} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-green-700"><FileSpreadsheet size={16}/> Excel</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                  <tr><th className="p-8 text-center">No</th><th className="p-8">Waktu</th><th className="p-8">Keterangan</th><th className="p-8">Metode</th><th className="p-8 text-right">Nominal</th><th className="p-8 text-center">Aksi</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t, i) => (
                    <tr key={t.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-8 text-center font-black text-gray-200">{i + 1}</td>
                      <td className="p-8 font-bold text-gray-400 text-xs">{t.date?.toDate ? t.date.toDate().toLocaleString('id-ID') : '-'}</td>
                      <td className="p-8"><div className="font-black text-gray-800 uppercase tracking-tight">{t.description}</div><div className="text-[10px] font-bold text-blue-500 uppercase mt-1">{t.category}</div></td>
                      <td className="p-8"><span className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{t.method}</span></td>
                      <td className={`p-8 text-right font-black text-xl ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} Rp {formatRupiah(t.amount)}</td>
                      <td className="p-8 text-center"><button onClick={()=>deleteDoc(doc(db,"payments",t.id))} className="text-gray-200 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"><Trash2 size={20}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: INVOICES */}
        {tab === 'invoices' && (
          <div className="p-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">Piutang & Tagihan Siswa</h3>
              <button onClick={()=>setShowManualInv(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex gap-3 hover:bg-blue-600 transition-all"><Plus size={18}/> Tambah Tagihan Manual</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {invoices.map(inv => (
                <div key={inv.id} className="p-8 border-4 border-gray-50 rounded-[2.5rem] bg-white hover:border-blue-100 transition-all shadow-sm">
                  <div className="flex justify-between items-start mb-6">
                    <div><h4 className="font-black text-xl text-gray-800 uppercase tracking-tighter">{inv.studentName}</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.details}</p></div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${inv.status==='paid'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{inv.status}</span>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Sisa Hutang</p>
                    <p className="text-3xl font-black text-red-600">Rp {formatRupiah(inv.remainingAmount)}</p>
                  </div>
                  {inv.remainingAmount > 0 ? (
                    <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-200">Terima Bayar</button>
                  ) : (
                    <div className="w-full bg-green-50 text-green-600 py-4 rounded-2xl font-black uppercase tracking-widest text-center flex items-center justify-center gap-2"><CheckCircle size={18}/> Lunas</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INPUT */}
        {tab === 'input' && (
          <div className="p-10 flex gap-10 animate-in slide-in-from-right duration-500">
            <div className="flex-1 bg-gray-50 p-12 rounded-[3rem]">
              <div className="flex gap-4 mb-10 bg-white p-2 rounded-[2rem] shadow-inner">
                <button onClick={()=>setInputType('income')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${inputType==='income'?'bg-green-600 text-white shadow-xl':'text-gray-400'}`}>Pemasukan Umum</button>
                <button onClick={()=>setInputType('expense')} className={`flex-1 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${inputType==='expense'?'bg-red-600 text-white shadow-xl':'text-gray-400'}`}>Pengeluaran Kas</button>
              </div>
              <form onSubmit={handleInputTransaction} className="space-y-8">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Keterangan Transaksi</label><input required className="w-full border-4 border-white p-5 rounded-2xl font-black text-xl outline-none focus:border-blue-500" value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Kategori</label><select className="w-full border-4 border-white p-5 rounded-2xl font-black text-lg outline-none" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>{inputType==='income'?(<><option>Sponsor</option><option>Hibah</option><option>Lainnya</option></>):(<><option>Operasional</option><option>Gaji Guru</option><option>Sewa/Listrik</option><option>Lainnya</option></>)}</select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Akun Pembayaran</label><select className="w-full border-4 border-white p-5 rounded-2xl font-black text-lg outline-none" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}><option value="Tunai">Tunai (Kas)</option><option value="Transfer">Bank / Transfer</option></select></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nominal (Rp)</label><input required className="w-full border-4 border-white p-6 rounded-2xl font-black text-4xl text-blue-600 outline-none" value={newTrans.amountStr} onChange={e => setNewTrans({...newTrans, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <button className={`w-full py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-2xl transition-all ${inputType==='income'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'} text-white`}>SIMPAN TRANSAKSI</button>
              </form>
            </div>
            <div className="w-[400px] p-10 bg-slate-900 rounded-[3rem] text-white flex flex-col justify-center">
              <h4 className="text-2xl font-black mb-6 uppercase italic tracking-tighter text-blue-400">Security Note:</h4>
              <p className="opacity-60 text-sm leading-relaxed mb-6 font-medium">Pastikan setiap pengeluaran disertai dengan bukti nota fisik. Pengeluaran di atas Rp 500.000 wajib melalui akun Bank untuk kemudahan audit bulanan.</p>
              <div className="border-t border-white/10 pt-6"><p className="text-[10px] font-black uppercase opacity-30 mb-2">Pencatat</p><p className="font-black text-lg">SISTEM ADMINISTRATOR</p></div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS (STILL SAME LOGIC, BUT BIGGER) --- */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black tracking-tighter uppercase">Pelunasan Siswa</h3><button onClick={()=>setShowPayModal(false)}><X size={32}/></button></div>
            <form onSubmit={handleProcessPayment} className="space-y-8">
              <div className="bg-blue-50 p-8 rounded-[2rem] text-center border-2 border-blue-100"><p className="text-xs font-black text-blue-400 uppercase mb-2">Total Tagihan Sisa</p><p className="text-5xl font-black text-blue-800 tracking-tighter">Rp {formatRupiah(selectedInvoice.remainingAmount)}</p></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block mb-2">Masuk Ke</label><select className="w-full border-4 border-gray-50 p-4 rounded-2xl font-black" value={payMethod} onChange={e=>setPayMethod(e.target.value)}><option value="Tunai">Tunai (Kas)</option><option value="Transfer">Bank</option></select></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 block mb-2">Nominal Bayar</label><input required className="w-full border-4 border-gray-50 p-4 rounded-2xl font-black text-xl" value={payAmountStr} onChange={e=>setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/></div>
              </div>
              <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl">PROSES PEMBAYARAN</button>
            </form>
          </div>
        </div>
      )}

      {showManualInv && (
        <div className="fixed inset-0 bg-slate-900/80 z-[100] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black tracking-tighter uppercase">Tagihan Khusus</h3><button onClick={()=>setShowManualInv(false)}><X size={32}/></button></div>
            <form onSubmit={handleCreateManualInvoice} className="space-y-6">
              <select required className="w-full border-4 border-gray-50 p-5 rounded-2xl font-black text-lg" value={newInv.studentId} onChange={e=>setNewInv({...newInv, studentId:e.target.value})}><option value="">Pilih Siswa</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input required className="w-full border-4 border-gray-50 p-5 rounded-2xl font-black text-xl" placeholder="Nominal Rp" value={newInv.totalAmountStr} onChange={e=>setNewInv({...newInv, totalAmountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/>
              <input className="w-full border-4 border-gray-50 p-5 rounded-2xl font-black" placeholder="Alasan (Cth: Denda/Buku)" value={newInv.details} onChange={e=>setNewInv({...newInv, details:e.target.value})}/>
              <input type="date" required className="w-full border-4 border-gray-50 p-5 rounded-2xl font-black" value={newInv.dueDate} onChange={e=>setNewInv({...newInv, dueDate:e.target.value})}/>
              <button className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl uppercase tracking-widest shadow-xl">TERBITKAN TAGIHAN</button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .animate-in, .animate-in * { visibility: visible; }
          .animate-in { position: absolute; left: 0; top: 0; width: 100%; border: none !important; }
          button, .shadow-2xl, .bg-slate-900 { display: none !important; }
        }
      `}</style>
    </div>
  );
}