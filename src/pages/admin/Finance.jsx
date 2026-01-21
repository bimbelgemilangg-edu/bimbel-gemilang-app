import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, History, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PieChart, Download, FileSpreadsheet } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); // summary | invoices | input
  
  // Data
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  
  // Saldo
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payMethod, setPayMethod] = useState('Tunai'); 

  // Form State
  const [inputType, setInputType] = useState('expense'); // 'income' (Sponsor) | 'expense' (Belanja)
  const [newTrans, setNewTrans] = useState({ title: "", amountStr: "", category: "Lainnya", method: "Tunai", date: "" });
  
  // Tagihan Manual State
  const [showManualInv, setShowManualInv] = useState(false);
  const [newInv, setNewInv] = useState({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });

  useEffect(() => {
    // 1. Tagihan
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => setInvoices(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    // 2. Transaksi (Payments)
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
          // Income (SPP, Sponsor, dll)
          inc += amt;
          if(t.method === 'Tunai') cash += amt; else bank += amt;
        }
      });
      setBalance({ cash, bank, total: cash + bank });
      setIncomeTotal(inc);
      setExpenseTotal(exp);
    });

    // 3. Siswa
    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- DOWNLOAD EXCEL/CSV ---
  const downloadReport = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "No,Tanggal,Keterangan,Kategori,Tipe,Metode,Nominal\n"; // Header
    
    transactions.forEach((t, index) => {
      const date = t.date?.toDate ? t.date.toDate().toLocaleDateString() : '-';
      const type = t.type === 'expense' ? 'Keluar' : 'Masuk';
      const row = `${index+1},${date},"${t.description}",${t.category},${type},${t.method},${t.amount}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_Gemilang_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // --- 1. PROSES BAYAR TAGIHAN ---
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
      setShowPayModal(false); setPayAmountStr(""); alert("Lunas!");
    } catch (err) { alert(err.message); }
  };

  // --- 2. INPUT TRANSAKSI (UMUM / EXPENSE) ---
  const handleInputTransaction = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newTrans.amountStr);
    if (amount <= 0) return alert("Nominal 0?");
    
    // Cek Saldo kalau Pengeluaran
    if (inputType === 'expense') {
      if (newTrans.method === 'Tunai' && amount > balance.cash) return alert("Saldo TUNAI Kurang!");
      if (newTrans.method === 'Transfer' && amount > balance.bank) return alert("Saldo BANK Kurang!");
    }

    try {
      await addDoc(collection(db, 'payments'), {
        amount, method: newTrans.method, type: inputType, // 'income' or 'expense'
        category: newTrans.category, description: newTrans.title,
        date: newTrans.date ? new Date(newTrans.date) : serverTimestamp(),
        studentName: '-' 
      });
      setNewTrans({ title: "", amountStr: "", category: "Lainnya", method: "Tunai", date: "" });
      alert("Transaksi Tercatat!");
    } catch (err) { alert(err.message); }
  };

  // --- 3. BUAT TAGIHAN MANUAL (RESTORED) ---
  const handleCreateManualInvoice = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newInv.totalAmountStr);
    const student = students.find(s => s.id === newInv.studentId);
    if(!student) return alert("Pilih Siswa!");

    await addDoc(collection(db, 'invoices'), {
      studentId: newInv.studentId, studentName: student.name,
      totalAmount: amount, remainingAmount: amount, status: 'unpaid',
      dueDate: newInv.dueDate, details: newInv.details, type: 'manual',
      createdAt: serverTimestamp()
    });
    setShowManualInv(false); setNewInv({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });
    alert("Tagihan Manual Dibuat!");
  };

  // --- 4. HAPUS TRANSAKSI ---
  const handleDeleteTransaction = async (t) => {
    if(confirm("Hapus data ini? Saldo akan dikembalikan.")) await deleteDoc(doc(db, "payments", t.id));
  };

  return (
    <div className="space-y-6">
      {/* HEADER CARD */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 rounded-xl shadow-lg md:col-span-2">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 opacity-80 mb-1"><DollarSign size={16}/><span className="text-xs font-bold uppercase">Saldo Kas</span></div>
              <div className="text-3xl font-black">Rp {formatRupiah(balance.total)}</div>
            </div>
            <div className="text-right text-[10px] space-y-1">
              <div className="bg-white/20 px-2 py-1 rounded">Tunai: Rp {formatRupiah(balance.cash)}</div>
              <div className="bg-white/20 px-2 py-1 rounded">Bank: Rp {formatRupiah(balance.bank)}</div>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-5 rounded-xl border border-green-200">
          <div className="text-green-700 text-xs font-bold uppercase mb-1 flex items-center gap-1"><ArrowDownLeft size={14}/> Total Masuk</div>
          <div className="text-xl font-black text-green-800">Rp {formatRupiah(incomeTotal)}</div>
        </div>
        <div className="bg-red-50 p-5 rounded-xl border border-red-200">
          <div className="text-red-700 text-xs font-bold uppercase mb-1 flex items-center gap-1"><ArrowUpRight size={14}/> Total Keluar</div>
          <div className="text-xl font-black text-red-800">Rp {formatRupiah(expenseTotal)}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b overflow-x-auto bg-white rounded-t-xl">
        <button onClick={()=>setTab('summary')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${tab==='summary'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><PieChart size={16}/> Laporan Mutasi</button>
        <button onClick={()=>setTab('invoices')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${tab==='invoices'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><Receipt size={16}/> Data Tagihan</button>
        <button onClick={()=>setTab('input')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${tab==='input'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><Wallet size={16}/> Input Transaksi</button>
      </div>

      {/* TAB 1: MUTASI / LAPORAN */}
      {tab === 'summary' && (
        <div className="bg-white rounded-b-xl border border-t-0 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="font-bold text-gray-700">Jurnal Keuangan</h3>
            <button onClick={downloadReport} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-green-700">
              <Download size={14}/> Download Excel
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-600 font-bold">
                <tr><th className="p-3 w-10 text-center">No</th><th className="p-3">Tanggal</th><th className="p-3">Keterangan</th><th className="p-3">Tipe</th><th className="p-3 text-right">Nominal</th><th className="p-3 text-center">Hapus</th></tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map((t, idx) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="p-3 text-center text-gray-400 text-xs">{idx + 1}</td>
                    <td className="p-3 text-gray-500 text-xs">{t.date?.toDate ? t.date.toDate().toLocaleDateString() : '-'}</td>
                    <td className="p-3">
                      <div className="font-medium">{t.description}</div>
                      <div className="text-[10px] text-gray-400 bg-gray-100 inline-block px-1 rounded mt-1">{t.category} • {t.method}</div>
                    </td>
                    <td className="p-3">
                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${t.type==='income'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                        {t.type==='income'?'Masuk':'Keluar'}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-bold ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                      {t.type==='income' ? '+' : '-'} Rp {formatRupiah(t.amount)}
                    </td>
                    <td className="p-3 text-center"><button onClick={()=>handleDeleteTransaction(t)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: TAGIHAN (INVOICES) */}
      {tab === 'invoices' && (
        <div className="bg-white rounded-b-xl border border-t-0 overflow-hidden">
          <div className="p-4 flex justify-between items-center bg-gray-50 border-b">
            <h3 className="font-bold text-gray-700">Daftar Tagihan Siswa</h3>
            <button onClick={()=>setShowManualInv(true)} className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold flex gap-2"><Plus size={14}/> Tagihan Manual</button>
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

      {/* TAB 3: INPUT TRANSAKSI (INCOME/EXPENSE) */}
      {tab === 'input' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-b-xl border border-t-0 shadow-sm">
            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button onClick={()=>setInputType('income')} className={`flex-1 py-2 text-xs font-bold rounded ${inputType==='income'?'bg-white shadow text-green-600':'text-gray-500'}`}>Pemasukan (Sponsor/Lain)</button>
              <button onClick={()=>setInputType('expense')} className={`flex-1 py-2 text-xs font-bold rounded ${inputType==='expense'?'bg-white shadow text-red-600':'text-gray-500'}`}>Pengeluaran (Belanja/Gaji)</button>
            </div>

            <form onSubmit={handleInputTransaction} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Keterangan</label>
                <input required className="w-full border p-2 rounded mt-1" placeholder={inputType==='income'?"Contoh: Dana Hibah, Jual Buku Bekas":"Contoh: Beli Spidol, Bayar Listrik"} value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Kategori</label>
                  <select className="w-full border p-2 rounded mt-1 bg-white" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>
                    {inputType==='income' ? (
                      <><option>Sponsor</option><option>Hibah</option><option>Penjualan</option><option>Lainnya</option></>
                    ):(
                      <><option>Operasional</option><option>Gaji Guru</option><option>Listrik/Air</option><option>Sewa</option><option>Lainnya</option></>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">Tanggal</label>
                  <input type="date" className="w-full border p-2 rounded mt-1" value={newTrans.date} onChange={e=>setNewTrans({...newTrans, date:e.target.value})}/>
                </div>
              </div>
              <div className={`p-4 rounded border ${inputType==='income'?'bg-green-50 border-green-100':'bg-red-50 border-red-100'}`}>
                <label className={`text-xs font-bold uppercase ${inputType==='income'?'text-green-700':'text-red-700'}`}>Nominal & Akun</label>
                <div className="flex gap-2 mt-1">
                  <select className="border p-2 rounded font-bold text-sm w-1/3" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}>
                    <option value="Tunai">Tunai</option><option value="Transfer">Bank</option>
                  </select>
                  <input required className="border p-2 rounded font-bold text-lg w-2/3" placeholder="Rp 0" value={newTrans.amountStr} onChange={e=>setNewTrans({...newTrans, amountStr:formatRupiah(e.target.value.replace(/\D/g,""))})}/>
                </div>
              </div>
              <button className={`w-full text-white py-3 rounded-lg font-bold shadow-lg ${inputType==='income'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'}`}>
                SIMPAN TRANSAKSI
              </button>
            </form>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h3 className="font-bold text-blue-800 mb-2">Panduan Input Kas</h3>
            <ul className="text-sm text-blue-600 space-y-2 list-disc pl-4">
              <li>Menu ini untuk mencatat uang masuk/keluar <b>DI LUAR SPP SISWA</b>.</li>
              <li>Jika ada siswa bayar SPP, gunakan menu <b>Data Tagihan</b> agar status siswanya terupdate.</li>
              <li>Pemasukan di sini (Sponsor/Jualan) akan menambah saldo Kas/Bank.</li>
              <li>Pengeluaran akan mengurangi saldo.</li>
            </ul>
          </div>
        </div>
      )}

      {/* MODAL BAYAR INVOICE */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex justify-between mb-4"><h3 className="font-bold">Terima Pembayaran Siswa</h3><button onClick={()=>setShowPayModal(false)}><X/></button></div>
            <form onSubmit={handleProcessPayment} className="space-y-4">
              <div className="bg-blue-50 p-3 rounded text-center">
                <div className="text-xs text-gray-500">Sisa Tagihan</div>
                <div className="text-xl font-black text-blue-800">Rp {formatRupiah(selectedInvoice.remainingAmount)}</div>
              </div>
              <div><label className="text-xs font-bold text-gray-500">Masuk ke Akun</label><select className="w-full border p-2 rounded mt-1" value={payMethod} onChange={e=>setPayMethod(e.target.value)}><option value="Tunai">Tunai (Kas)</option><option value="Transfer">Bank</option></select></div>
              <div><label className="text-xs font-bold text-gray-500">Nominal Diterima</label><input autoFocus className="w-full text-2xl font-bold border-b-2 border-blue-600 p-2 outline-none" value={payAmountStr} onChange={e => setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/></div>
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">PROSES</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAGIHAN MANUAL */}
      {showManualInv && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex justify-between mb-4"><h3 className="font-bold">Buat Tagihan Manual</h3><button onClick={()=>setShowManualInv(false)}><X/></button></div>
            <form onSubmit={handleCreateManualInvoice} className="space-y-3">
              <select required className="w-full border p-2 rounded" value={newInv.studentId} onChange={e=>setNewInv({...newInv, studentId:e.target.value})}><option value="">Pilih Siswa</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input type="text" required placeholder="Nominal (Rp)" className="w-full border p-2 rounded font-bold" value={newInv.totalAmountStr} onChange={e=>setNewInv({...newInv, totalAmountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/>
              <input type="text" placeholder="Keterangan (Cth: Denda Buku)" className="w-full border p-2 rounded" value={newInv.details} onChange={e=>setNewInv({...newInv, details:e.target.value})}/>
              <input type="date" required className="w-full border p-2 rounded" value={newInv.dueDate} onChange={e=>setNewInv({...newInv, dueDate:e.target.value})}/>
              <button className="w-full bg-gray-800 text-white py-2 rounded font-bold">SIMPAN TAGIHAN</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}