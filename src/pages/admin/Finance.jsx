import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, History, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, CreditCard, PieChart, Download, Printer, AlertCircle } from 'lucide-react';

// --- HELPER: FORMAT RUPIAH ---
const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); 
  
  // Data Database
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  
  // Analisis Keuangan
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);
  const [totalReceivable, setTotalReceivable] = useState(0); 
  const [monthlyStats, setMonthlyStats] = useState([]); 

  // State Modal & Form
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payMethod, setPayMethod] = useState('Tunai'); 

  const [inputType, setInputType] = useState('expense'); 
  const [newTrans, setNewTrans] = useState({ title: "", amountStr: "", category: "Lainnya", method: "Tunai", date: "" });
  
  const [showManualInv, setShowManualInv] = useState(false);
  const [newInv, setNewInv] = useState({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });

  useEffect(() => {
    // 1. Tagihan & Piutang
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => {
      const allInvoices = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setInvoices(allInvoices);
      const piutang = allInvoices.reduce((acc, curr) => acc + (curr.remainingAmount || 0), 0);
      setTotalReceivable(piutang);
    });
    
    // 2. Transaksi & Analisis Cashflow
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), s => {
      const trans = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      
      let cash = 0, bank = 0, inc = 0, exp = 0;
      const statsObj = {}; 

      trans.forEach(t => {
        const amt = t.amount || 0;
        if (t.type === 'expense') {
          exp += amt;
          if(t.method === 'Tunai') cash -= amt; else bank -= amt;
        } else {
          inc += amt;
          if(t.method === 'Tunai') cash += amt; else bank += amt;
        }

        if (t.date?.toDate) {
          const d = t.date.toDate();
          const key = `${d.getFullYear()}-${d.getMonth()}`; 
          const label = d.toLocaleString('id-ID', { month: 'short', year: '2-digit' }); 
          
          if (!statsObj[key]) statsObj[key] = { label, income: 0, expense: 0, net: 0 };
          
          if (t.type === 'expense') {
            statsObj[key].expense += amt;
          } else {
            statsObj[key].income += amt;
          }
          statsObj[key].net = statsObj[key].income - statsObj[key].expense;
        }
      });

      const sortedStats = Object.keys(statsObj).sort().map(k => statsObj[k]);
      
      setMonthlyStats(sortedStats);
      setBalance({ cash, bank, total: cash + bank });
      setIncomeTotal(inc);
      setExpenseTotal(exp);
    });

    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- DOWNLOAD EXCEL ---
  const downloadExcel = () => {
    let csvContent = "\uFEFFNo;Tanggal;Keterangan;Kategori;Tipe;Metode;Nominal Masuk;Nominal Keluar\n";
    transactions.forEach((t, index) => {
      const date = t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-';
      const safeDesc = t.description ? t.description.replace(/;/g, ",").replace(/\n/g, " ") : "-";
      const masuk = t.type === 'income' ? t.amount : 0;
      const keluar = t.type === 'expense' ? t.amount : 0;
      csvContent += `${index+1};${date};${safeDesc};${t.category};${t.type==='income'?'Masuk':'Keluar'};${t.method};${masuk};${keluar}\n`;
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: "text/csv;charset=utf-8;" }));
    link.download = `Laporan_Keuangan_Gemilang.csv`;
    link.click();
  };

  // --- LOGIKA TRANSAKSI ---
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

  const handleInputTransaction = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newTrans.amountStr);
    if (amount <= 0) return alert("Nominal 0?");
    if (inputType === 'expense') {
      if (newTrans.method === 'Tunai' && amount > balance.cash) return alert("Saldo TUNAI Kurang!");
      if (newTrans.method === 'Transfer' && amount > balance.bank) return alert("Saldo BANK Kurang!");
    }
    try {
      await addDoc(collection(db, 'payments'), {
        amount, method: newTrans.method, type: inputType, category: newTrans.category, 
        description: newTrans.title, date: newTrans.date ? new Date(newTrans.date) : serverTimestamp(), studentName: '-' 
      });
      setNewTrans({ title: "", amountStr: "", category: "Lainnya", method: "Tunai", date: "" });
      alert("Tercatat!");
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
    alert("Tagihan Manual Dibuat!");
  };

  const handleDeleteTransaction = async (t) => {
    if(confirm("Hapus data ini? Saldo akan dikembalikan.")) await deleteDoc(doc(db, "payments", t.id));
  };

  return (
    <div className="space-y-6">
      
      {/* ==============================================
          LAYOUT KHUSUS PRINT / PDF (HIDDEN DI LAYAR BIASA)
          ============================================== */}
      <div className="hidden print:block w-full text-black">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-2xl font-black uppercase tracking-wider">LAPORAN KEUANGAN BIMBEL GEMILANG</h1>
          <p className="text-sm">Ringkasan Cashflow, Piutang, dan Mutasi Transaksi</p>
          <p className="text-xs mt-1">Dicetak: {new Date().toLocaleDateString('id-ID', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</p>
        </div>

        {/* 1. RINGKASAN DATA (KOTAK-KOTAK) */}
        <div className="flex justify-between gap-4 mb-8">
          <div className="flex-1 border border-black p-3 text-center">
            <div className="text-[10px] font-bold uppercase">Total Masuk</div>
            <div className="text-lg font-black">Rp {formatRupiah(incomeTotal)}</div>
          </div>
          <div className="flex-1 border border-black p-3 text-center">
            <div className="text-[10px] font-bold uppercase">Total Keluar</div>
            <div className="text-lg font-black">Rp {formatRupiah(expenseTotal)}</div>
          </div>
          <div className="flex-1 border border-black p-3 text-center bg-gray-100 print:bg-gray-100">
            <div className="text-[10px] font-bold uppercase">Saldo Bersih</div>
            <div className="text-lg font-black">Rp {formatRupiah(balance.total)}</div>
          </div>
          <div className="flex-1 border border-black p-3 text-center">
            <div className="text-[10px] font-bold uppercase text-red-900">Total Piutang</div>
            <div className="text-lg font-black">Rp {formatRupiah(totalReceivable)}</div>
          </div>
        </div>

        {/* 2. GRAFIK BATANG (CSS CHART) */}
        <div className="mb-8 break-inside-avoid">
          <h3 className="font-bold border-b border-black mb-4 text-sm">GRAFIK CASHFLOW BULANAN</h3>
          <div className="flex items-end gap-4 h-[200px] border-b border-l border-black p-2">
            {monthlyStats.map((stat, idx) => {
              const maxVal = Math.max(...monthlyStats.map(s => Math.max(s.income, s.expense))) || 1;
              const hInc = Math.round((stat.income / maxVal) * 100);
              const hExp = Math.round((stat.expense / maxVal) * 100);
              return (
                <div key={idx} className="flex-1 flex flex-col justify-end items-center">
                  <div className="flex gap-1 w-full justify-center items-end h-full">
                    {/* Bar Masuk (Hitam) */}
                    <div className="w-3 bg-black print:bg-black" style={{height: `${hInc}%`}}></div>
                    {/* Bar Keluar (Putih Border) */}
                    <div className="w-3 border border-black bg-white print:bg-white" style={{height: `${hExp}%`}}></div>
                  </div>
                  <div className="text-[8px] font-bold mt-1">{stat.label}</div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center gap-4 mt-2 text-[10px]">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-black"></div> Pemasukan</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 border border-black bg-white"></div> Pengeluaran</div>
          </div>
        </div>

        {/* 3. TABEL MUTASI (FULL WIDTH) */}
        <div>
          <h3 className="font-bold border-b border-black mb-2 text-sm">RINCIAN MUTASI TERAKHIR</h3>
          <table className="w-full text-[10px] text-left border-collapse">
            <thead>
              <tr className="border-b border-black">
                <th className="py-1 w-20">Tanggal</th>
                <th className="py-1">Keterangan</th>
                <th className="py-1 w-20">Kategori</th>
                <th className="py-1 w-24 text-right">Masuk</th>
                <th className="py-1 w-24 text-right">Keluar</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 100).map(t => (
                <tr key={t.id} className="border-b border-gray-300">
                  <td className="py-1 align-top">{t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-1 align-top">{t.description}</td>
                  <td className="py-1 align-top">{t.category}</td>
                  <td className="py-1 align-top text-right">{t.type==='income' ? formatRupiah(t.amount) : ''}</td>
                  <td className="py-1 align-top text-right">{t.type==='expense' ? formatRupiah(t.amount) : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* ==============================================
          END PRINT LAYOUT
          ============================================== */}


      {/* === TAMPILAN DASHBOARD ADMIN (SCREEN ONLY) === */}
      <div className="print:hidden space-y-6">
        {/* HEADER CARD UPDATE */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-5 rounded-xl shadow-lg md:col-span-2">
            <div className="flex justify-between items-start">
              <div><div className="flex items-center gap-2 opacity-80 mb-1"><DollarSign size={16}/><span className="text-xs font-bold uppercase">Saldo Kas</span></div><div className="text-3xl font-black">Rp {formatRupiah(balance.total)}</div></div>
              <div className="text-right text-[10px] space-y-1"><div className="bg-white/20 px-2 py-1 rounded">Tunai: Rp {formatRupiah(balance.cash)}</div><div className="bg-white/20 px-2 py-1 rounded">Bank: Rp {formatRupiah(balance.bank)}</div></div>
            </div>
          </div>
          
          {/* CARD PIUTANG */}
          <div className="bg-orange-50 p-5 rounded-xl border border-orange-200">
            <div className="text-orange-700 text-xs font-bold uppercase mb-1 flex items-center gap-1"><AlertCircle size={14}/> Total Piutang</div>
            <div className="text-xl font-black text-orange-800">Rp {formatRupiah(totalReceivable)}</div>
            <p className="text-[10px] text-orange-600 mt-1">Uang belum dibayar siswa</p>
          </div>

          <div className="bg-green-50 p-5 rounded-xl border border-green-200">
            <div className="text-green-700 text-xs font-bold uppercase mb-1 flex items-center gap-1"><ArrowDownLeft size={14}/> Profit/Loss</div>
            <div className={`text-xl font-black ${incomeTotal - expenseTotal >= 0 ? 'text-green-800' : 'text-red-800'}`}>
              Rp {formatRupiah(incomeTotal - expenseTotal)}
            </div>
            <p className="text-[10px] text-green-600 mt-1">Pemasukan - Pengeluaran</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-b overflow-x-auto bg-white rounded-t-xl">
          <button onClick={()=>setTab('summary')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${tab==='summary'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><PieChart size={16}/> Laporan Mutasi</button>
          <button onClick={()=>setTab('invoices')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${tab==='invoices'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><Receipt size={16}/> Data Tagihan</button>
          <button onClick={()=>setTab('input')} className={`px-6 py-4 font-bold text-sm flex gap-2 ${tab==='input'?'text-blue-600 border-b-2 border-blue-600 bg-blue-50':'text-gray-500'}`}><Wallet size={16}/> Input Transaksi</button>
        </div>

        {/* TAB 1: MUTASI */}
        {tab === 'summary' && (
          <div className="bg-white rounded-b-xl border border-t-0 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Jurnal Keuangan</h3>
              <div className="flex gap-2">
                <button onClick={()=>window.print()} className="bg-gray-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-gray-800"><Printer size={14}/> Cetak PDF</button>
                <button onClick={downloadExcel} className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 hover:bg-green-700"><Download size={14}/> Excel</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-600 font-bold"><tr><th className="p-3 w-10 text-center">No</th><th className="p-3">Tanggal</th><th className="p-3">Keterangan</th><th className="p-3">Kategori</th><th className="p-3 text-right">Nominal</th><th className="p-3 text-center">Hapus</th></tr></thead>
                <tbody className="divide-y">
                  {transactions.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="p-3 text-center text-gray-500 text-xs">{idx + 1}</td>
                      <td className="p-3 text-gray-500 text-xs">{t.date?.toDate ? t.date.toDate().toLocaleDateString('id-ID') : '-'}</td>
                      <td className="p-3"><div className="font-medium">{t.description}</div><div className="text-[10px] text-gray-400 bg-gray-100 inline-block px-1 rounded mt-1">{t.type==='income'?'Masuk':'Keluar'} • {t.method}</div></td>
                      <td className="p-3"><span className="text-[10px] bg-gray-100 px-2 py-1 rounded border">{t.category}</span></td>
                      <td className={`p-3 text-right font-bold ${t.type==='expense'?'text-red-600':'text-green-600'}`}>{t.type==='expense' ? '-' : '+'} Rp {formatRupiah(t.amount)}</td>
                      <td className="p-3 text-center"><button onClick={()=>handleDeleteTransaction(t)} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2 & 3: TAGIHAN & INPUT */}
        {tab === 'invoices' && (
          <div className="bg-white rounded-b-xl border border-t-0 overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-gray-50 border-b">
              <h3 className="font-bold text-gray-700">Daftar Tagihan</h3>
              <button onClick={()=>setShowManualInv(true)} className="bg-gray-800 text-white px-3 py-1.5 rounded text-xs font-bold flex gap-2"><Plus size={14}/> Manual</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100"><tr><th className="p-3">Nama Siswa</th><th className="p-3">Sisa Hutang</th><th className="p-3">Jatuh Tempo</th><th className="p-3 text-center">Aksi</th></tr></thead>
                <tbody className="divide-y">{invoices.map(inv => (<tr key={inv.id} className="hover:bg-gray-50"><td className="p-3"><div className="font-bold">{inv.studentName}</div><div className="text-[10px] text-gray-500">{inv.details}</div></td><td className="p-3 font-black text-red-600">Rp {formatRupiah(inv.remainingAmount)}</td><td className="p-3 text-xs text-gray-500">{inv.dueDate}</td><td className="p-3 text-center">{inv.remainingAmount > 0 ? <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-700">Bayar</button> : <span className="text-green-600 font-bold text-xs"><CheckCircle size={12}/> Lunas</span>}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'input' && (
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-b-xl border border-t-0 shadow-sm">
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                <button onClick={()=>setInputType('income')} className={`flex-1 py-2 text-xs font-bold rounded ${inputType==='income'?'bg-white shadow text-green-600':'text-gray-500'}`}>Pemasukan</button>
                <button onClick={()=>setInputType('expense')} className={`flex-1 py-2 text-xs font-bold rounded ${inputType==='expense'?'bg-white shadow text-red-600':'text-gray-500'}`}>Pengeluaran</button>
              </div>
              <form onSubmit={handleInputTransaction} className="space-y-4">
                <input required className="w-full border p-2 rounded" placeholder="Keterangan Transaksi" value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/>
                <div className="grid grid-cols-2 gap-4">
                  <select className="w-full border p-2 rounded bg-white" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>{inputType==='income'?<><option>Sponsor</option><option>Hibah</option><option>Lainnya</option></>:<><option>Operasional</option><option>Gaji Guru</option><option>Listrik/Air</option><option>Sewa</option><option>Lainnya</option></>}</select>
                  <input type="date" className="w-full border p-2 rounded" value={newTrans.date} onChange={e=>setNewTrans({...newTrans, date:e.target.value})}/>
                </div>
                <div className="flex gap-2"><select className="border p-2 rounded w-1/3 text-sm" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}><option value="Tunai">Tunai</option><option value="Transfer">Bank</option></select><input required className="border p-2 rounded font-bold text-lg w-2/3" placeholder="Rp 0" value={newTrans.amountStr} onChange={e=>setNewTrans({...newTrans, amountStr:formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <button className={`w-full text-white py-3 rounded-lg font-bold shadow-lg ${inputType==='income'?'bg-green-600':'bg-red-600'}`}>SIMPAN</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {showPayModal && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"><h3 className="font-bold mb-4">Pembayaran</h3><form onSubmit={handleProcessPayment} className="space-y-4"><input className="w-full text-2xl font-bold border-b-2 border-blue-600 p-2 outline-none" value={payAmountStr} onChange={e => setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g, "")))}/><button className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold">PROSES</button><button type="button" onClick={()=>setShowPayModal(false)} className="w-full text-gray-500 text-xs mt-2">Batal</button></form></div></div>}
      {showManualInv && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-sm p-6"><h3 className="font-bold mb-4">Tagihan Manual</h3><form onSubmit={handleCreateManualInvoice} className="space-y-3"><select required className="w-full border p-2 rounded" value={newInv.studentId} onChange={e=>setNewInv({...newInv, studentId:e.target.value})}><option value="">Pilih Siswa</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><input type="text" className="w-full border p-2 rounded" placeholder="Nominal" value={newInv.totalAmountStr} onChange={e=>setNewInv({...newInv, totalAmountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/><input type="date" required className="w-full border p-2 rounded" value={newInv.dueDate} onChange={e=>setNewInv({...newInv, dueDate:e.target.value})}/><button className="w-full bg-gray-800 text-white py-2 rounded font-bold">SIMPAN</button><button type="button" onClick={()=>setShowManualInv(false)} className="w-full text-gray-500 text-xs mt-2">Batal</button></form></div></div>}

      {/* CSS KHUSUS PRINT */}
      <style>{`
        @media print {
          @page { size: A4; margin: 20mm; }
          body * { visibility: hidden; }
          .print\\:block, .print\\:block * { visibility: visible; }
          .print\\:block { position: static; width: 100%; top: 0; left: 0; }
          .print\\:hidden { display: none !important; }
          .break-inside-avoid { page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}