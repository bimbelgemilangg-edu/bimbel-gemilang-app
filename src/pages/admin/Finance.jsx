import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp } from 'firebase/firestore';
import { DollarSign, Plus, Receipt, History, CheckCircle, X } from 'lucide-react';

const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

export default function AdminFinance({ db }) {
  const [tab, setTab] = useState('invoices'); 
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('Cash');
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [newInvoice, setNewInvoice] = useState({ studentId: '', totalAmount: 0, dueDate: '' });

  useEffect(() => {
    const u1 = onSnapshot(query(collection(db, 'invoices'), orderBy('createdAt', 'desc')), (snap) => setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u2 = onSnapshot(query(collection(db, 'payments'), orderBy('date', 'desc')), (snap) => setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const u3 = onSnapshot(query(collection(db, 'students'), orderBy('name')), (snap) => setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (payAmount <= 0) return alert("Nominal tidak valid");
    if (payAmount > selectedInvoice.remainingAmount) return alert("Pembayaran melebihi sisa tagihan!");
    try {
      await runTransaction(db, async (transaction) => {
        const invoiceRef = doc(db, 'invoices', selectedInvoice.id);
        const invSnap = await transaction.get(invoiceRef);
        if (!invSnap.exists()) throw "Invoice tidak ditemukan!";
        const currentRemaining = invSnap.data().remainingAmount;
        const newRemaining = currentRemaining - payAmount;
        let newStatus = newRemaining <= 0 ? 'paid' : 'partial';
        transaction.update(invoiceRef, { remainingAmount: newRemaining, status: newStatus, updatedAt: serverTimestamp() });
        transaction.set(doc(collection(db, 'payments')), {
          invoiceId: selectedInvoice.id, studentName: selectedInvoice.studentName,
          amount: payAmount, method: payMethod, date: serverTimestamp(),
          description: `Pembayaran tagihan ${selectedInvoice.id.substring(0,5)}`
        });
      });
      alert("Pembayaran Berhasil!"); setShowPayModal(false); setPayAmount(0);
    } catch (err) { console.error(err); alert("Gagal: " + err); }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    const student = students.find(s => s.id === newInvoice.studentId);
    await addDoc(collection(db, 'invoices'), { ...newInvoice, studentName: student.name, remainingAmount: Number(newInvoice.totalAmount), totalAmount: Number(newInvoice.totalAmount), status: 'unpaid', createdAt: serverTimestamp() });
    setShowAddInvoice(false);
  };

  const totalIncome = payments.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-600 text-white p-6 rounded-xl shadow-md"><div className="text-sm opacity-80 uppercase font-bold">Total Kas Masuk</div><div className="text-3xl font-black mt-1">{formatIDR(totalIncome)}</div></div>
        <div className="bg-white p-6 rounded-xl border flex flex-col justify-center"><div className="text-xs text-gray-400 font-bold uppercase">Tagihan Aktif</div><div className="text-2xl font-bold text-gray-800">{invoices.filter(i => i.remainingAmount > 0).length} Invoice</div></div>
        <div className="flex items-center justify-end"><button onClick={() => setShowAddInvoice(true)} className="bg-gray-900 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 hover:bg-gray-800 transition-all"><Plus size={20} /> Buat Tagihan</button></div>
      </div>
      <div className="flex border-b border-gray-200"><button onClick={() => setTab('invoices')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${tab === 'invoices' ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50' : 'text-gray-500'}`}><Receipt size={18} /> Tagihan</button><button onClick={() => setTab('history')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${tab === 'history' ? 'border-b-2 border-green-600 text-green-600 bg-green-50' : 'text-gray-500'}`}><History size={18} /> Riwayat</button></div>
      {tab === 'invoices' && ( <div className="bg-white rounded-xl border overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-gray-500 font-bold border-b"><tr><th className="p-4">Siswa</th><th className="p-4">Sisa Hutang</th><th className="p-4">Status</th><th className="p-4 text-center">Aksi</th></tr></thead><tbody className="divide-y divide-gray-100">{invoices.map(inv => (<tr key={inv.id} className="hover:bg-gray-50"><td className="p-4 font-bold">{inv.studentName}</td><td className="p-4 font-black text-red-600">{formatIDR(inv.remainingAmount)}</td><td className="p-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${inv.status==='paid'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{inv.status}</span></td><td className="p-4 text-center">{inv.remainingAmount > 0 ? (<button onClick={() => { setSelectedInvoice(inv); setPayAmount(inv.remainingAmount); setShowPayModal(true); }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs font-bold">BAYAR</button>) : (<span className="text-green-500 font-bold text-xs"><CheckCircle size={14}/> Lunas</span>)}</td></tr>))}</tbody></table></div> )}
      {tab === 'history' && ( <div className="bg-white rounded-xl border overflow-hidden"><table className="w-full text-left text-sm"><thead className="bg-green-50 text-green-700 font-bold border-b"><tr><th className="p-4">Tanggal</th><th className="p-4">Siswa</th><th className="p-4">Nominal</th><th className="p-4">Metode</th></tr></thead><tbody className="divide-y divide-gray-100">{payments.map(pay => (<tr key={pay.id}><td className="p-4 text-gray-500">{pay.date?.toDate ? pay.date.toDate().toLocaleDateString('id-ID') : '-'}</td><td className="p-4 font-bold">{pay.studentName}</td><td className="p-4 font-black text-green-600">{formatIDR(pay.amount)}</td><td className="p-4 text-xs">{pay.method}</td></tr>))}</tbody></table></div> )}
      {showPayModal && selectedInvoice && ( <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"><div className="flex justify-between mb-4"><h3 className="font-bold">Input Pembayaran</h3><button onClick={()=>setShowPayModal(false)}><X/></button></div><form onSubmit={handleProcessPayment} className="space-y-4"><div><label className="text-xs font-bold text-gray-400">Sisa Hutang</label><div className="text-2xl font-black text-red-600">{formatIDR(selectedInvoice.remainingAmount)}</div></div><input type="number" className="w-full text-xl font-bold border-b-2 border-blue-600 p-2" value={payAmount} onChange={e => setPayAmount(Number(e.target.value))} autoFocus /><div className="flex gap-2">{['Cash', 'Transfer'].map(m => (<button key={m} type="button" onClick={() => setPayMethod(m)} className={`flex-1 py-2 rounded-lg text-xs font-bold border ${payMethod===m ? 'bg-blue-600 text-white' : 'bg-white'}`}>{m}</button>))}</div><button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">PROSES PEMBAYARAN</button></form></div></div> )}
      {showAddInvoice && ( <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-xl w-full max-w-sm p-6 shadow-2xl"><h3 className="font-bold mb-4">Buat Tagihan</h3><form onSubmit={handleCreateInvoice} className="space-y-3"><select required className="w-full border p-2 rounded" value={newInvoice.studentId} onChange={e=>setNewInvoice({...newInvoice, studentId:e.target.value})}><option value="">Pilih Siswa</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><input type="number" required placeholder="Nominal" className="w-full border p-2 rounded" value={newInvoice.totalAmount} onChange={e=>setNewInvoice({...newInvoice, totalAmount:e.target.value})}/><input type="date" required className="w-full border p-2 rounded" value={newInvoice.dueDate} onChange={e=>setNewInvoice({...newInvoice, dueDate:e.target.value})}/><button className="w-full bg-blue-600 text-white py-2 rounded font-bold">Terbitkan</button><button type="button" onClick={()=>setShowAddInvoice(false)} className="w-full text-gray-500 text-xs mt-2">Batal</button></form></div></div> )}
    </div>
  );
}