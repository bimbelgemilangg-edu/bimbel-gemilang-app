import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc, updateDoc, getDoc, where } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, Download, FileSpreadsheet, Printer, Edit, Lock } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); 
  
  // Data State
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // Otoritas Owner State
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null); 
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Finance Modals State
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmountStr, setPayAmountStr] = useState("");
  const [payMethod, setPayMethod] = useState('Tunai'); 
  const [inputType, setInputType] = useState('expense'); 
  const [newTrans, setNewTrans] = useState({ title: "", amountStr: "", category: "Lainnya", method: "Tunai" });
  const [showManualInv, setShowManualInv] = useState(false);
  const [newInv, setNewInv] = useState({ studentId: '', totalAmountStr: "", dueDate: '', details: 'Tagihan Tambahan' });

  useEffect(() => {
    // 1. Ambil Tagihan - FILTER: Hanya yang belum lunas (status !== 'paid')
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), s => {
      const allInvoices = s.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter di frontend agar real-time saat status berubah
      setInvoices(allInvoices.filter(inv => inv.status !== 'paid'));
    });

    // 2. Ambil Mutasi Keuangan
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), s => {
      const trans = s.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(trans);
      let cash = 0, bank = 0, inc = 0, exp = 0;
      trans.forEach(t => {
        const amt = t.amount || 0;
        if (t.type === 'expense') { exp += amt; if(t.method === 'Tunai') cash -= amt; else bank -= amt; }
        else { inc += amt; if(t.method === 'Tunai') cash += amt; else bank += amt; }
      });
      setBalance({ cash, bank, total: cash + bank }); setIncomeTotal(inc); setExpenseTotal(exp);
    });

    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- FUNGSI OTORITAS OWNER ---
  const handleOwnerAction = (type, data) => {
    setPendingAction({ type, data });
    setShowVerifyModal(true);
  };

  const verifyOwner = async (e) => {
    e.preventDefault();
    const snap = await getDoc(doc(db, "settings", "owner_auth"));
    const correctPass = snap.exists() ? snap.data().password : "2003";

    if (ownerInput === correctPass) {
      if (pendingAction.type === 'delete') {
        if(confirm("Hapus mutasi ini secara permanen?")) await deleteDoc(doc(db, "payments", pendingAction.data.id));
      } else if (pendingAction.type === 'edit') {
        setEditForm({ ...pendingAction.data, amountStr: formatRupiah(pendingAction.data.amount) });
        setShowEditModal(true);
      }
      setShowVerifyModal(false); setOwnerInput(""); setPendingAction(null);
    } else { alert("Sandi Owner Salah!"); }
  };

  const saveEditMutasi = async (e) => {
    e.preventDefault();
    await updateDoc(doc(db, "payments", editForm.id), {
      description: editForm.description,
      amount: parseRupiah(editForm.amountStr),
      category: editForm.category,
      method: editForm.method
    });
    setShowEditModal(false); alert("Update Berhasil!");
  };

  // --- FUNGSI TRANSAKSI STANDAR ---
  const handleProcessPayment = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(payAmountStr);
    if (amount <= 0 || amount > selectedInvoice.remainingAmount) return alert("Nominal Salah!");
    try {
      await runTransaction(db, async (t) => {
        const ref = doc(db, 'invoices', selectedInvoice.id);
        const rem = selectedInvoice.remainingAmount - amount;
        
        // Update Invoice: Jika sisa <= 0, status jadi 'paid' (akan hilang dari list piutang)
        t.update(ref, { remainingAmount: rem, status: rem <= 0 ? 'paid' : 'partial' });
        
        // Catat ke Mutasi Keuangan (Pindah ke Mutasi)
        t.set(doc(collection(db, 'payments')), { 
          invoiceId: selectedInvoice.id, studentName: selectedInvoice.studentName, 
          amount, method: payMethod, type: 'income', category: 'SPP/Tagihan',
          description: `Pembayaran ${selectedInvoice.studentName}`, date: serverTimestamp() 
        });
      });
      setShowPayModal(false); setPayAmountStr(""); alert("Pembayaran Berhasil Dicatat!");
    } catch (err) { alert(err.message); }
  };

  const handleInputTransaction = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(newTrans.amountStr);
    if (amount <= 0) return alert("Isi Nominal!");
    try {
      await addDoc(collection(db, 'payments'), {
        amount, method: newTrans.method, type: inputType, category: newTrans.category,
        description: newTrans.title, date: serverTimestamp(), studentName: '-' 
      });
      setNewTrans({ title: "", amountStr: "", category: "Lainnya", method: "Tunai" });
      alert("Tersimpan!");
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
    alert("Tagihan Diterbitkan!");
  };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* 1. STATS (ULTRA WIDE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl lg:col-span-2">
          <p className="opacity-40 uppercase font-black text-[10px] tracking-widest mb-2">Total Saldo Kas</p>
          <div className="text-7xl font-black tracking-tighter">Rp {formatRupiah(balance.total)}</div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border shadow-xl"><p className="text-green-600 font-black uppercase text-[10px] tracking-widest mb-2">Pemasukan</p><div className="text-4xl font-black">Rp {formatRupiah(incomeTotal)}</div></div>
        <div className="bg-white p-10 rounded-[3rem] border shadow-xl"><p className="text-red-600 font-black uppercase text-[10px] tracking-widest mb-2">Pengeluaran</p><div className="text-4xl font-black">Rp {formatRupiah(expenseTotal)}</div></div>
      </div>

      {/* 2. TABS */}
      <div className="flex bg-gray-100 p-2 rounded-[2.5rem] w-fit shadow-inner">
        {[{id:'summary', l:'Mutasi Kas', i:PieChart}, {id:'invoices', l:'Piutang Siswa', i:Receipt}, {id:'input', l:'Catat Transaksi', i:Wallet}]
        .map(m => (
          <button key={m.id} onClick={()=>setTab(m.id)} className={`px-10 py-5 rounded-[2rem] font-black text-sm flex items-center gap-3 transition-all ${tab===m.id?'bg-white text-blue-600 shadow-lg scale-105':'text-gray-400'}`}>
            <m.i size={20}/> {m.l}
          </button>
        ))}
      </div>

      {/* 3. CONTENT CONTAINER */}
      <div className="bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden min-h-[600px]">
        
        {/* TAB: MUTASI (LAPORAN KEUANGAN) */}
        {tab === 'summary' && (
          <div className="animate-in fade-in duration-500">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Laporan Jurnal Keuangan</h3>
              <div className="flex gap-4">
                 <button onClick={() => window.print()} className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest"><Printer size={16} className="inline mr-2"/> PDF</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 border-b">
                  <tr><th className="p-8">Waktu</th><th className="p-8">Keterangan</th><th className="p-8">Metode</th><th className="p-8 text-right">Nominal</th><th className="p-8 text-center">Owner Action</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-8 font-bold text-gray-400 text-xs">{t.date?.toDate ? t.date.toDate().toLocaleString('id-ID') : '-'}</td>
                      <td className="p-8"><div className="font-black text-gray-800 uppercase tracking-tight">{t.description}</div><div className="text-[10px] font-bold text-blue-500 uppercase">{t.category}</div></td>
                      <td className="p-8"><span className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{t.method}</span></td>
                      <td className={`p-8 text-right font-black text-xl ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} Rp {formatRupiah(t.amount)}</td>
                      <td className="p-8 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={()=>handleOwnerAction('edit', t)} className="p-2 bg-yellow-50 text-yellow-600 rounded-xl hover:bg-yellow-600 hover:text-white transition-all"><Edit size={18}/></button>
                          <button onClick={()=>handleOwnerAction('delete', t)} className="p-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={18}/></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PIUTANG (HANYA YANG BELUM LUNAS) */}
        {tab === 'invoices' && (
          <div className="p-10 animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-gray-800 tracking-tighter">Daftar Piutang Siswa Aktif</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Tagihan yang sudah lunas otomatis pindah ke mutasi</p>
              </div>
              <button onClick={()=>setShowManualInv(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex gap-3 hover:bg-blue-600 transition-all"><Plus size={18}/> Tambah Tagihan Manual</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {invoices.map(inv => (
                <div key={inv.id} className="p-8 border-4 border-gray-50 rounded-[3rem] bg-white shadow-sm hover:border-blue-200 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div><h4 className="font-black text-2xl text-gray-800 uppercase tracking-tighter">{inv.studentName}</h4><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{inv.details}</p></div>
                    <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">TERTUNGGAK</span>
                  </div>
                  <div className="mb-8">
                    <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Sisa Piutang</p>
                    <p className="text-4xl font-black text-red-600">Rp {formatRupiah(inv.remainingAmount)}</p>
                  </div>
                  <button onClick={()=>{setSelectedInvoice(inv); setPayAmountStr(formatRupiah(inv.remainingAmount)); setShowPayModal(true)}} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100">Proses Pembayaran</button>
                </div>
              ))}
              {invoices.length === 0 && (
                <div className="col-span-full py-20 text-center bg-gray-50 rounded-[3rem] border-4 border-dashed">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-4"/>
                  <h4 className="text-xl font-black text-gray-800 uppercase">Tidak Ada Piutang</h4>
                  <p className="text-xs text-gray-400 font-bold">Semua tagihan siswa saat ini sudah lunas.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: INPUT TRANSAKSI */}
        {tab === 'input' && (
          <div className="p-10 animate-in slide-in-from-right duration-500">
            <div className="max-w-4xl mx-auto bg-gray-50 p-12 rounded-[3rem]">
              <div className="flex gap-4 mb-10 bg-white p-2 rounded-[2rem] shadow-inner">
                <button onClick={()=>setInputType('income')} className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${inputType==='income'?'bg-green-600 text-white shadow-xl':'text-gray-400'}`}>Pemasukan Kas</button>
                <button onClick={()=>setInputType('expense')} className={`flex-1 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${inputType==='expense'?'bg-red-600 text-white shadow-xl':'text-gray-400'}`}>Pengeluaran Kas</button>
              </div>
              <form onSubmit={handleInputTransaction} className="space-y-8">
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Keterangan</label><input required className="w-full border-4 border-white p-6 rounded-2xl font-black text-2xl outline-none focus:border-blue-500 shadow-sm" value={newTrans.title} onChange={e=>setNewTrans({...newTrans, title:e.target.value})}/></div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Kategori</label><select className="w-full border-4 border-white p-6 rounded-2xl font-black text-lg outline-none" value={newTrans.category} onChange={e=>setNewTrans({...newTrans, category:e.target.value})}>{inputType==='income'?(<><option>Sponsor</option><option>Hibah</option><option>Lainnya</option></>):(<><option>Operasional</option><option>Gaji Guru</option><option>Sewa/Listrik</option><option>Lainnya</option></>)}</select></div>
                  <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Metode</label><select className="w-full border-4 border-white p-6 rounded-2xl font-black text-lg outline-none" value={newTrans.method} onChange={e=>setNewTrans({...newTrans, method:e.target.value})}><option value="Tunai">Tunai</option><option value="Transfer">Bank</option></select></div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 uppercase ml-4">Nominal Rp</label><input required className="w-full border-4 border-white p-8 rounded-2xl font-black text-5xl text-blue-600 outline-none" value={newTrans.amountStr} onChange={e => setNewTrans({...newTrans, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <button className={`w-full py-8 rounded-[2rem] font-black text-2xl uppercase tracking-widest shadow-2xl transition-all ${inputType==='income'?'bg-green-600 hover:bg-green-700':'bg-red-600 hover:bg-red-700'} text-white`}>SIMPAN TRANSAKSI</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* --- MODALS (AUTHORITY & EDIT) --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-12 text-center shadow-2xl">
            <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={48}/></div>
            <h3 className="text-3xl font-black uppercase mb-2 tracking-tighter">Otoritas Owner</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-10">Keamanan Mutasi Terkunci.</p>
            <form onSubmit={verifyOwner} className="space-y-8">
              <input autoFocus type="password" value={ownerInput} onChange={e=>setOwnerInput(e.target.value)} className="w-full bg-gray-50 border-4 border-gray-100 p-6 rounded-3xl text-center text-5xl font-black tracking-[0.5em] outline-none focus:border-red-500" placeholder="••••"/>
              <div className="flex gap-4"><button type="button" onClick={()=>{setShowVerifyModal(false); setOwnerInput("");}} className="flex-1 py-6 rounded-2xl font-black text-gray-400 uppercase">Batal</button><button type="submit" className="flex-1 bg-red-600 text-white py-6 rounded-2xl font-black uppercase shadow-xl">Verifikasi</button></div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl">
            <h3 className="text-3xl font-black uppercase mb-10 text-blue-600 tracking-tighter">Koreksi Data Keuangan</h3>
            <form onSubmit={saveEditMutasi} className="space-y-6">
              <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-4">Deskripsi</label><input className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-4">Nominal</label><input className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" value={editForm.amountStr} onChange={e=>setEditForm({...editForm, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-4">Metode</label><select className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" value={editForm.method} onChange={e=>setEditForm({...editForm, method: e.target.value})}><option>Tunai</option><option>Transfer</option></select></div>
              </div>
              <div className="flex gap-4 pt-6"><button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-6 rounded-2xl font-black text-gray-400 uppercase">Batal</button><button type="submit" className="flex-1 bg-blue-600 text-white py-6 rounded-2xl font-black uppercase shadow-xl">Simpan Perubahan</button></div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && selectedInvoice && (
        <div className="fixed inset-0 bg-slate-950/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl animate-in zoom-in duration-300">
             <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black uppercase tracking-tighter">Pelunasan Siswa</h3><button onClick={()=>setShowPayModal(false)}><X size={40}/></button></div>
             <form onSubmit={handleProcessPayment} className="space-y-8">
               <div className="bg-blue-50 p-10 rounded-[2.5rem] text-center border-4 border-blue-100"><p className="text-xs font-black text-blue-400 uppercase mb-2">Piutang Tersisa</p><p className="text-6xl font-black text-blue-800 tracking-tighter">Rp {formatRupiah(selectedInvoice.remainingAmount)}</p></div>
               <div className="grid grid-cols-2 gap-8">
                 <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-4">Akun Masuk</label><select className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" value={payMethod} onChange={e=>setPayMethod(e.target.value)}><option value="Tunai">Tunai</option><option value="Transfer">Bank</option></select></div>
                 <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block ml-4">Nominal Bayar</label><input required className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-2xl shadow-inner" value={payAmountStr} onChange={e=>setPayAmountStr(formatRupiah(e.target.value.replace(/\D/g,"")))}/></div>
               </div>
               <button className="w-full bg-blue-600 text-white py-8 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-blue-700">TERIMA & PINDAHKAN KE MUTASI</button>
             </form>
          </div>
        </div>
      )}

      {showManualInv && (
        <div className="fixed inset-0 bg-slate-950/80 z-[300] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl">
            <div className="flex justify-between items-center mb-10"><h3 className="text-3xl font-black uppercase tracking-tighter">Buat Tagihan Manual</h3><button onClick={()=>setShowManualInv(false)}><X size={40}/></button></div>
            <form onSubmit={handleCreateManualInvoice} className="space-y-6">
              <select required className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" value={newInv.studentId} onChange={e=>setNewInv({...newInv, studentId:e.target.value})}><option value="">Pilih Murid</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input required className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-2xl shadow-inner" placeholder="Nominal Rp" value={newInv.totalAmountStr} onChange={e=>setNewInv({...newInv, totalAmountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/>
              <input className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" placeholder="Alasan Tagihan (Buku/Lainnya)" value={newInv.details} onChange={e=>setNewInv({...newInv, details:e.target.value})}/>
              <input type="date" required className="w-full border-4 border-gray-100 p-6 rounded-3xl font-black text-xl" value={newInv.dueDate} onChange={e=>setNewInv({...newInv, dueDate:e.target.value})}/>
              <button className="w-full bg-slate-900 text-white py-8 rounded-[2rem] font-black text-2xl uppercase tracking-widest shadow-xl">Terbitkan Invoice</button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}