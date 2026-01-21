import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc, where } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, History, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PieChart } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); // summary | invoices | expenses | history
  
  // Data dari Database
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); // Gabungan Income & Expense
  const [students, setStudents] = useState([]);
  
  // State Keuangan Realtime
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // State Modal & Form
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payMethod, setPayMethod] = useState('Tunai'); // Tunai / Transfer

  const [showAddInvoice, setShowAddInvoice] = useState(false); // Form Tagihan Manual
  const [showAddExpense, setShowAddExpense] = useState(false); // Form Pengeluaran
  
  // Form Data
  const [newInvoice, setNewInvoice] = useState({ studentId: '', totalAmountStr: "", dueDate: '' });
  const [newExpense, setNewExpense] = useState({ title: "", amountStr: "", category: "Operasional", method: "Tunai", date: "" });

  useEffect(() => {
    // 1. Ambil Tagihan
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // 2. Ambil Transaksi (Uang Masuk & Keluar) dari collection 'payments' (kita pakai collection ini untuk semua arus kas)
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), s => {
      const trans = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      
      // HITUNG CASHFLOW & SALDO
      let cash = 0, bank = 0, inc = 0, exp = 0;
      trans.forEach(t => {
        const amt = t.amount || 0;
        // Jika type tidak ada, asumsikan pemasukan (data lama). Jika 'expense', pengeluaran.
        if (t.type === 'expense') {
          exp += amt;
          if(t.method === 'Tunai') cash -= amt; else bank -= amt;
        } else {
          // Pemasukan (SPP/Pendaftaran)
          inc += amt;
          if(t.method === 'Tunai') cash += amt; else bank += amt;
        }
      });
      setBalance({ cash, bank, total: cash + bank });
      setIncomeTotal(inc);
      setExpenseTotal(exp);
    });

    // 3. Ambil Siswa (Untuk dropdown)
    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- 1. PROSES BAYAR TAGIHAN SISWA (PEMASUKAN) ---
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(payAmountStr);
    if (amount <= 0 || amount > selectedInvoice.remainingAmount) return alert("Nominal Salah!");
    
    try {
      await runTransaction(db, async (t) => {
        // Update Invoice
        const ref = doc(db, 'invoices', selectedInvoice.id);
        const rem = selectedInvoice.remainingAmount - amount;
        t.update(ref, { remainingAmount: rem, status: rem <= 0 ? 'paid' : 'partial' });
        
        // Catat Transaksi Masuk
        t.set(doc(collection(db, 'payments')), { 
          invoiceId: selectedInvoice.id, 
          studentName: selectedInvoice.studentName, 
          amount, 
          method: payMethod, // Tunai/Transfer 
          type: 'income', // Penanda Pemasukan
          category: 'SPP/Tagihan',
          description: `Bayar Tagihan ${selectedInvoice.studentName}`,
          date: serverTimestamp() 
        });
      });
      setShowPayModal(false); setPayAmountStr(""); alert("Pembayaran Diterima!");
    } catch (err) { alert(err.message); }
  };

  // --- 2. CATAT PENGELUARAN (GAJI/LISTRIK/DLL) ---
  const handleAddExpense = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newExpense.amountStr);
    if (amount <= 0) return alert("Nominal 0?");
    
    // Cek Saldo Cukup Gak?
    if (newExpense.method === 'Tunai' && amount > balance.cash) return alert("Saldo TUNAI tidak cukup!");
    if (newExpense.method === 'Transfer' && amount > balance.bank) return alert("Saldo BANK tidak cukup!");

    try {
      await addDoc(collection(db, 'payments'), {
        amount,
        method: newExpense.method,
        type: 'expense', // Penanda Pengeluaran
        category: newExpense.category,
        description: newExpense.title,
        date: newExpense.date ? new Date(newExpense.date) : serverTimestamp(),
        studentName: '-' // Bukan dari siswa
      });
      setShowAddExpense(false); setNewExpense({ title: "", amountStr: "", category: "Operasional", method: "Tunai", date: "" });
      alert("Pengeluaran Dicatat!");
    } catch (err) { alert(err.message); }
  };

  // --- 3. HAPUS TRANSAKSI (Hanya Admin) ---
  const handleDeleteTransaction = async (t) => {
    if(confirm("Batalkan transaksi ini? Saldo akan dikembalikan.")) {
      await deleteDoc(doc(db, "payments", t.id));
      // Note: Idealnya rollback invoice juga kalau ini pembayaran SPP, tapi untuk simpel hapus record kas dulu.
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER RINGKASAN KEUANGAN */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* KARTU SALDO TOTAL (LABA BERSIH) */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-5 rounded-xl shadow-lg md:col-span-2">
          <div className="flex items-center gap-2 mb-2 opacity-80"><DollarSign size={18}/><span className="text-sm font-bold uppercase tracking-widest">Saldo Bersih (Net)</span></div>
          <div className="text-3xl font-black mb-4">Rp {formatRupiah(balance.total)}</div>
          <div className="flex gap-4 text-xs font-medium bg-white/10 p-2 rounded-lg">
            <div className="flex items-center gap-1"><Wallet size={12}/> Tunai: Rp {formatRupiah(balance.cash)}</div>
            <div className="flex items-center gap-1 border-l pl-4 border-white/30"><CreditCard size={12}/> Bank: Rp {formatRupiah(balance.bank)}</div>
          </div>
        </div>

        {/* KARTU PEMASUKAN */}
        <div className="bg-white p-5 rounded-xl border border-green-100 shadow-sm">
          <div className="flex items-center gap-2 text-green-600 mb-1"><ArrowDownLeft size={18}/> <span className="text-xs font-bold uppercase">Pemasukan</span></div>
          <div className="text-xl font-black text-gray-800">Rp {formatRupiah(incomeTotal)}</div>
          <p className="text-[10px] text-gray-400 mt-1">Total SPP & Pendaftaran masuk</p>
        </div>

        {/* KARTU PENGELUARAN */}
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center gap-2 text-red-600 mb-1"><ArrowUpRight size={18}/> <span className="text-xs font-bold uppercase">Pengeluaran</span></div>
          <div className="text-xl font-black text-gray-800">Rp {formatRupiah(expenseTotal)}</div>
          <p className="text-[10px] text-gray-400 mt-1">Gaji, Operasional, dll</p>
        </div>
      </div>

      {/* NAVIGASI TAB */}
      <div className="flex border-b overflow-x-auto">
        <button onClick={()=>setTab('summary')} className={`px-5 py-3 font-bold text-sm flex gap-2 ${tab==='summary'?'text-blue-600 border-b-2 border-blue-600':'text-gray-500'}`}><PieChart size={16}/> Mutasi / Cashflow</button>
        <button onClick={()=>setTab('invoices')} className={`px-5 py-3 font-bold text-sm flex gap-2 ${tab==='invoices'?'text-blue-600 border-b-2 border-blue-600':'text-gray-500'}`}><Receipt size={16}/> Tagihan Siswa</button>
        <button onClick={()=>setTab('expenses')} className={`px-5 py-3 font-bold text-sm flex gap-2 ${tab==='expenses'?'text-red-600 border-b-2 border-red-600':'text-gray-500'}`}><ArrowUpRight size={16}/> Input Pengeluaran</button>
      </div>

      {/* --- CONTENT 1: CASHFLOW (MUTASI) --- */}
      {tab === 'summary' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Riwayat Mutasi Dana</h3>
            <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">100 Transaksi Terakhir</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold"><tr><th className="p-3">Tanggal</th><th className="p-3">Keterangan</th><th className="p-3">Kategori</th><th className="p-3">Akun</th><th className="p-3 text-right">Nominal</th><th className="p-3 text-center">Aksi</th></tr></thead>
              <tbody className="divide-y">
                {transactions.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 text-gray-500 text-xs">{t.date?.toDate ? t.date.toDate().toLocaleDateString() : '-'}</td>
                    <td className="p-3 font-medium">{t.description}</td>
                    <td className="p-3"><span className="text-[10px] bg-gray-100 px-2 py-1 rounded border">{t.category}</span></td>
                    <td className="p-3 text-xs">{t.method}</td>
                    <td className={`p-3 text-right font-bold ${t.type==='expense'?'text-red-600':'text-green-600'}`}>
                      {t.type==='expense' ? '-' : '+'} Rp {formatRupiah(t.amount)}
                    </td>
                    <td className="p-3 text-center"><button onClick={()=>handleDeleteTransaction(t)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT 2: INVOICES (TAGIHAN) --- */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 flex justify-between items-center bg-gray-50 border-b">
            <h3 className="font-bold text-gray-700">Daftar Tagihan Siswa</h3>
            <div className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">{invoices.filter(i=>i.remainingAmount>0).length} Belum Lunas</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100"><tr><th className="p-3">Nama Siswa</th><th className="p-3">Sisa Hutang</th><th className="p-3">Jatuh Tempo</th><th className="p-3 text-center">Aksi</th></tr></thead>
              <tbody className="divide-y">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="p-3"><div className="font-bold">{inv.studentName}</div><div className="text-[10px] text-gray-500">{inv.details}</div></td>
                    <td className="p-3 font-black text-red-600">Rp {formatRupiah(inv.remainingAmount)}</td>
                    <td className="p-3 text-xs text-gray-500">{inv.dueDate}</td>
                    <td className="p-3 text-center">
                      {inv.remainingAmount > 0 ? 
                        <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">Bayar</button> 
                        : <span className="text-green-600 font-bold text-xs flex items-center justify-center gap-1"><CheckCircle size={12}/> Lunas</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CONTENT 3: EXPENSES (INPUT PENGELUARAN) --- */}
      {tab === 'expenses' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="font-bold text-red-600 text-lg mb-4 flex items-center gap-2"><ArrowUpRight/> Catat Pengeluaran Baru</h3>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Keperluan / Keterangan</label>
                <input required className="w-full border p-2 rounded mt-1" placeholder="Contoh: Beli Spidol, Gaji Guru..." value={newExpense.title} onChange={e=>setNewExpense({...newExpense, title:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                  <select className="w-full border p-2 rounded mt-1 bg-white" value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category:e.target.value})}>
                    <option>Operasional</option><option>Gaji Guru</option><option>Listrik/Air</option><option>Sewa Tempat</option><option>Lainnya</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                  <input type="date" className="w-full border p-2 rounded mt-1" value={newExpense.date} onChange={e=>setNewExpense({...newExpense, date:e.target.value})}/>
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded border border-red-100">
                <label className="text-xs font-bold text-red-700 uppercase">Nominal & Sumber Dana</label>
                <div className="flex gap-2 mt-1">
                  <select className="border p-2 rounded font-bold text-sm w-1/3" value={newExpense.method} onChange={e=>setNewExpense({...newExpense, method:e.target.value})}>
                    <option value="Tunai">Tunai (Kas)</option>
                    <option value="Transfer">Bank</option>
                  </select>
                  <input required className="border p-2 rounded font-bold text-lg w-2/3 outline-red-500" placeholder="Rp 0" value={newExpense.amountStr} onChange={e=>setNewExpense({...newExpense, amountStr:formatRupiah(e.target.value.replace(/\D/g,""))})}/>
                </div>
                <div className="text-[10px] text-red-600 mt-2 text-right">
                  Saldo {newExpense.method}: Rp {formatRupiah(newExpense.method==='Tunai'?balance.cash:balance.bank)}
                </div>
              </div>
              <button className="w-full bg-red-600 text-white py-3 rounded-lg font-bold hover:bg-red-700 shadow-lg">SIMPAN PENGELUARAN</button>
            </form>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border">
            <h3 className="font-bold text-gray-600 mb-4">Tips Keuangan Bimbel</h3>
            <ul className="text-sm text-gray-500 space-y-2 list-disc pl-4">
              <li>Pastikan saldo <b>Tunai (Brankas)</b> cukup sebelum mencatat pengeluaran tunai.</li>
              <li>Pisahkan kategori <b>Gaji Guru</b> agar mudah dihitung totalnya akhir bulan.</li>
              <li>Pemasukan dari SPP akan otomatis menambah saldo Tunai/Bank sesuai metode bayar siswa.</li>
              <li>Gunakan tab <b>Mutasi</b> untuk melihat detail pergerakan uang harian.</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL BAYAR INVOICE */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold">Terima Pembayaran</h3><button onClick={()=>setShowPayModal(false)}><X/></button></div>
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded">
                <div className="text-xs text-gray-500">Sisa Tagihan Siswa:</div>
                <div className="text-xl font-black text-blue-800">Rp {formatRupiah(selectedInvoice.remainingAmount)}</div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Masuk ke Akun Mana?</label>
                <div className="flex gap-2 mt-1">
                  {['Tunai', 'Transfer'].map(m => (<button key={m} type="button" onClick={() => setPayMethod(m)} className={`flex-1 py-2 rounded text-xs font-bold border ${payMethod===m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500'}`}>{m}</button>))}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Nominal Diterima</label>
                <input autoFocus className="w-full text-2xl font-bold border-b-2 border-blue-600 p-2 outline-none" value={payAmountStr} onChange={e => setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/>
              </div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">PROSES</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}