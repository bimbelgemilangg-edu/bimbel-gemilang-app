import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, CheckCircle, X, Trash2, ArrowUpRight, ArrowDownLeft, Wallet, PieChart, Download, FileSpreadsheet, Printer, Edit, Lock } from 'lucide-react';

const formatRupiah = (val) => val ? val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "0";
const parseRupiah = (val) => val ? parseInt(val.replace(/\./g, '') || '0', 10) : 0;

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('summary'); 
  const [invoices, setInvoices] = useState([]);
  const [transactions, setTransactions] = useState([]); 
  const [students, setStudents] = useState([]);
  const [balance, setBalance] = useState({ cash: 0, bank: 0, total: 0 });
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenseTotal, setExpenseTotal] = useState(0);

  // State Modal Otoritas Owner
  const [ownerVerified, setOwnerVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [ownerInput, setOwnerInput] = useState("");
  const [pendingAction, setPendingAction] = useState(null); // { type: 'edit'|'delete', data: t }

  // State Edit Mutasi
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  // Modal State Lainnya
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
        if (t.type === 'expense') { exp += amt; if(t.method === 'Tunai') cash -= amt; else bank -= amt; }
        else { inc += amt; if(t.method === 'Tunai') cash += amt; else bank += amt; }
      });
      setBalance({ cash, bank, total: cash + bank }); setIncomeTotal(inc); setExpenseTotal(exp);
    });
    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), s => setStudents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // --- LOGIKA OTORITAS OWNER ---
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
        if(confirm("PERINGATAN: Menghapus mutasi akan merubah saldo total. Lanjutkan?")) {
          await deleteDoc(doc(db, "payments", pendingAction.data.id));
        }
      } else if (pendingAction.type === 'edit') {
        setEditForm({ ...pendingAction.data, amountStr: formatRupiah(pendingAction.data.amount) });
        setShowEditModal(true);
      }
      setShowVerifyModal(false); setOwnerInput(""); setPendingAction(null);
    } else {
      alert("Sandi Owner Salah!");
    }
  };

  const saveEditMutasi = async (e) => {
    e.preventDefault();
    const amount = parseRupiah(editForm.amountStr);
    await updateDoc(doc(db, "payments", editForm.id), {
      description: editForm.description,
      amount: amount,
      category: editForm.category,
      method: editForm.method
    });
    setShowEditModal(false); alert("Data Mutasi Diperbarui!");
  };

  // --- FUNGSI STANDAR ---
  const downloadExcel = () => { /* ... Logika excel sama ... */ };
  const handleProcessPayment = async (e) => { /* ... Logika bayar sama ... */ };
  const handleInputTransaction = async (e) => { /* ... Logika input sama ... */ };
  const handleCreateManualInvoice = async (e) => { /* ... Logika manual inv sama ... */ };

  return (
    <div className="space-y-10 w-full max-w-[1600px] mx-auto pb-20">
      
      {/* STATS AREA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl lg:col-span-2">
          <p className="opacity-40 uppercase font-black text-[10px] tracking-widest mb-2">Total Saldo Kas</p>
          <div className="text-6xl font-black tracking-tighter">Rp {formatRupiah(balance.total)}</div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border shadow-xl">
          <p className="text-green-600 font-black uppercase text-[10px] tracking-widest mb-2">Pemasukan</p>
          <div className="text-4xl font-black">Rp {formatRupiah(incomeTotal)}</div>
        </div>
        <div className="bg-white p-10 rounded-[3rem] border shadow-xl">
          <p className="text-red-600 font-black uppercase text-[10px] tracking-widest mb-2">Pengeluaran</p>
          <div className="text-4xl font-black">Rp {formatRupiah(expenseTotal)}</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex bg-gray-100 p-2 rounded-[2.5rem] w-fit shadow-inner">
        {[{id:'summary', l:'Mutasi Kas', i:PieChart}, {id:'invoices', l:'Tagihan Siswa', i:Receipt}, {id:'input', l:'Catat Transaksi', i:Wallet}]
        .map(m => (
          <button key={m.id} onClick={()=>setTab(m.id)} className={`px-10 py-5 rounded-[2rem] font-black text-sm flex items-center gap-3 transition-all ${tab===m.id?'bg-white text-blue-600 shadow-lg scale-105':'text-gray-400'}`}>
            <m.i size={20}/> {m.l}
          </button>
        ))}
      </div>

      {/* MUTASI TABLE */}
      {tab === 'summary' && (
        <div className="bg-white rounded-[3.5rem] border shadow-2xl overflow-hidden animate-in fade-in duration-500">
          <div className="p-10 border-b flex justify-between items-center bg-gray-50/50">
            <h3 className="text-2xl font-black text-gray-800">Riwayat Mutasi Keuangan</h3>
            <div className="flex gap-4"><button onClick={downloadExcel} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-green-700">Excel</button></div>
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
                    <td className="p-8"><span className="bg-gray-100 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">{t.method}</span></td>
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

      {/* LAINNYA (INVOICES & INPUT TETAP) */}
      {/* ... (Sama seperti kode sebelumnya untuk Invoices & Input) ... */}

      {/* --- MODAL VERIFIKASI OWNER (KUNCI KEAMANAN) --- */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-slate-950/90 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6"><Lock size={40}/></div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Otoritas Owner</h3>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Masukkan sandi khusus owner untuk melakukan tindakan ini.</p>
            <form onSubmit={verifyOwner} className="space-y-6">
              <input autoFocus type="password" value={ownerInput} onChange={e=>setOwnerInput(e.target.value)} className="w-full bg-gray-50 border-4 border-gray-100 p-5 rounded-2xl text-center text-4xl font-black tracking-[0.5em] outline-none focus:border-red-500" placeholder="••••"/>
              <div className="flex gap-4">
                <button type="button" onClick={()=>{setShowVerifyModal(false); setOwnerInput("");}} className="flex-1 py-5 rounded-2xl font-black text-gray-400 uppercase">Batal</button>
                <button type="submit" className="flex-1 bg-red-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl shadow-red-200">Verifikasi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT MUTASI (HANYA OWNER) --- */}
      {showEditModal && editForm && (
        <div className="fixed inset-0 bg-slate-950/80 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl p-10 overflow-hidden">
            <h3 className="text-2xl font-black uppercase mb-8 text-blue-600">Edit Data Mutasi</h3>
            <form onSubmit={saveEditMutasi} className="space-y-6">
              <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Keterangan</label><input className="w-full border-4 border-gray-50 p-4 rounded-2xl font-bold" value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-6">
                <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Nominal Rp</label><input className="w-full border-4 border-gray-50 p-4 rounded-2xl font-bold" value={editForm.amountStr} onChange={e=>setEditForm({...editForm, amountStr: formatRupiah(e.target.value.replace(/\D/g,""))})}/></div>
                <div><label className="text-[10px] font-black text-gray-400 uppercase mb-2 block">Metode</label><select className="w-full border-4 border-gray-50 p-4 rounded-2xl font-bold" value={editForm.method} onChange={e=>setEditForm({...editForm, method: e.target.value})}><option>Tunai</option><option>Transfer</option></select></div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={()=>setShowEditModal(false)} className="flex-1 py-5 rounded-2xl font-black text-gray-400 uppercase bg-gray-50">Batal</button>
                <button type="submit" className="flex-1 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase shadow-xl">Simpan Koreksi</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}