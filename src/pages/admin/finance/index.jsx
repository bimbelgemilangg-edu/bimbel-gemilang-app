import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { 
  LayoutDashboard, Receipt, PlusCircle, FileText, 
  TrendingUp, TrendingDown, Wallet, AlertCircle, 
  MinusCircle, Save, CheckCircle, Search, Send, DollarSign, Download 
} from 'lucide-react';

// ==========================================
// 1. KOMPONEN: RINGKASAN (SUMMARY)
// ==========================================
const FinanceSummary = ({ transactions = [], invoices = [], balance = 0 }) => {
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + (parseInt(t.amount) || 0), 0);
  const totalPiutang = invoices.reduce((acc, inv) => acc + (parseInt(inv.remainingAmount) || 0), 0);
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Wallet size={100}/></div>
          <div className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-2">Saldo Kas</div>
          <div className="text-3xl font-black">{formatIDR(balance)}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-green-500"><TrendingUp size={100}/></div>
          <div className="flex items-center gap-3 mb-2"><div className="bg-green-100 text-green-600 p-2 rounded-full"><TrendingUp size={16}/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pemasukan</div></div>
          <div className="text-2xl font-black text-slate-800">{formatIDR(totalIncome)}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-red-500"><TrendingDown size={100}/></div>
          <div className="flex items-center gap-3 mb-2"><div className="bg-red-100 text-red-600 p-2 rounded-full"><TrendingDown size={16}/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pengeluaran</div></div>
          <div className="text-2xl font-black text-slate-800">{formatIDR(totalExpense)}</div>
        </div>
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 text-orange-500"><AlertCircle size={100}/></div>
          <div className="flex items-center gap-3 mb-2"><div className="bg-orange-100 text-orange-600 p-2 rounded-full"><AlertCircle size={16}/></div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Piutang</div></div>
          <div className="text-2xl font-black text-slate-800">{formatIDR(totalPiutang)}</div>
        </div>
      </div>
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <h3 className="font-black text-lg mb-6 flex items-center gap-3 uppercase tracking-widest text-slate-800"><Wallet className="text-blue-600"/> Riwayat Transaksi Terakhir</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr className="border-b-2 border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="p-4">Tanggal</th><th className="p-4">Keterangan</th><th className="p-4">Kategori</th><th className="p-4 text-right">Nominal</th></tr></thead>
            <tbody className="text-sm font-bold text-slate-600">
              {transactions.length === 0 ? (<tr><td colSpan="4" className="p-8 text-center text-slate-300 italic">Belum ada data.</td></tr>) : (
                transactions.slice(0, 10).map((t, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50"><td className="p-4 text-xs">{t.date}</td><td className="p-4"><div className="text-slate-800">{t.description}</div><div className="text-[10px] text-slate-400">{t.studentName !== '-' ? t.studentName : 'Umum'}</div></td><td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] uppercase ${t.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{t.category}</span></td><td className={`p-4 text-right font-black ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}</td></tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. KOMPONEN: INPUT CATAT KAS
// ==========================================
const FinanceInput = ({ db, students = [] }) => {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('SPP');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Lengkapi data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, amount: parseInt(amount), category, description: desc, studentName: selectedStudent || '-', date, createdAt: serverTimestamp()
      });
      setAmount(''); setDesc(''); setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (err) { alert("Gagal!"); }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
      <div className="flex">
        <button onClick={() => setType('income')} className={`flex-1 py-6 flex items-center justify-center gap-3 transition-all ${type === 'income' ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400'}`}><PlusCircle size={24}/><span className="font-black text-lg uppercase">Pemasukan</span></button>
        <button onClick={() => setType('expense')} className={`flex-1 py-6 flex items-center justify-center gap-3 transition-all ${type === 'expense' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-400'}`}><MinusCircle size={24}/><span className="font-black text-lg uppercase">Pengeluaran</span></button>
      </div>
      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="space-y-2"><label className="text-xs font-black text-slate-400 uppercase ml-4">Nominal (Rp)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={`w-full text-4xl font-black p-6 rounded-3xl border-4 outline-none text-center ${type==='income'?'border-green-100 text-green-600 focus:border-green-500':'border-red-100 text-red-600 focus:border-red-500'}`} placeholder="0" required/></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Tanggal</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none"/></div>
          <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Kategori</label><select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none">{type==='income'?(<> <option value="SPP">SPP</option><option value="Pendaftaran">Pendaftaran</option><option value="Lainnya">Lainnya</option> </>):(<> <option value="Gaji">Gaji</option><option value="Operasional">Operasional</option><option value="Lainnya">Lainnya</option> </>)}</select></div>
        </div>
        {type === 'income' && (<div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Siswa (Opsional)</label><select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none"><option value="">-- Umum --</option>{students.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select></div>)}
        <div className="space-y-2"><label className="text-[10px] font-bold text-slate-400 uppercase ml-4">Keterangan</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows="3" className="w-full font-bold bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none"></textarea></div>
        <button disabled={loading} className={`w-full py-6 rounded-2xl font-black text-white text-xl uppercase shadow-xl transition-all ${loading?'bg-gray-400':type==='income'?'bg-slate-900':'bg-red-600'}`}>{success ? 'BERHASIL!' : 'SIMPAN'}</button>
      </form>
    </div>
  );
};

// ==========================================
// 3. KOMPONEN: TAGIHAN (INVOICES)
// ==========================================
const FinanceInvoices = ({ invoices = [] }) => {
  const [search, setSearch] = useState('');
  const filtered = invoices.filter(inv => inv.studentName?.toLowerCase().includes(search.toLowerCase()));
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 px-4"><Search size={20} className="text-slate-400"/><input type="text" placeholder="Cari nama siswa..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-transparent w-full py-3 font-bold text-slate-700 outline-none"/></div>
      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 ? (<div className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-slate-200"><DollarSign className="mx-auto text-slate-300 mb-4" size={48}/><p className="text-slate-400 font-bold">Tidak ada tagihan.</p></div>) : (
          filtered.map((inv) => (
            <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center gap-6">
              <div><h3 className="font-black text-lg text-slate-800">{inv.studentName}</h3><p className="text-xs font-bold text-slate-400">Jatuh Tempo: {inv.dueDate}</p></div>
              <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase">Sisa</p><p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p></div>
              {inv.waPhone && (<a href={`https://wa.me/${inv.waPhone}?text=Tagihan`} target="_blank" className="bg-green-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2"><Send size={16}/> WA</a>)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ==========================================
// 4. KOMPONEN: LAPORAN (REPORT)
// ==========================================
const FinanceReport = ({ transactions = [], balance = 0 }) => {
  const formatIDR = (num) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex justify-between items-center"><div><h2 className="text-3xl font-black mb-2">LAPORAN KEUANGAN</h2><p className="text-slate-400 font-bold">Rekapitulasi Arus Kas</p></div><button onClick={()=>window.print()} className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center gap-3"><Download size={20}/> Cetak</button></div>
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm"><h3 className="font-black text-lg mb-6 flex items-center gap-3 uppercase text-slate-800"><FileText className="text-blue-600"/> Rincian</h3>
        <table className="w-full text-left border-collapse">
          <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase"><th className="p-4">Tanggal</th><th className="p-4">Keterangan</th><th className="p-4">Tipe</th><th className="p-4 text-right">Nominal</th></tr></thead>
          <tbody className="text-sm font-bold text-slate-600">{transactions.map((t, i) => (<tr key={i} className="border-b border-slate-50"><td className="p-4">{t.date}</td><td className="p-4">{t.description}</td><td className="p-4"><span className={`px-3 py-1 rounded-full text-[10px] uppercase ${t.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{t.type==='income'?'Masuk':'Keluar'}</span></td><td className={`p-4 text-right font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} {formatIDR(t.amount)}</td></tr>))}</tbody>
          <tfoot><tr className="bg-slate-900 text-white"><td colSpan="3" className="p-6 text-right font-bold uppercase">Total Akhir</td><td className="p-6 text-right font-black text-xl">{formatIDR(balance)}</td></tr></tfoot>
        </table>
      </div>
    </div>
  );
};

// ==========================================
// 5. INDUK FINANCE (MAIN)
// ==========================================
export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const qTrans = query(collection(db, "payments"), orderBy("date", "desc"));
    const u1 = onSnapshot(qTrans, s => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const qInv = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const u2 = onSnapshot(qInv, s => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));
    const qStd = query(collection(db, "students"), orderBy("name"));
    const u3 = onSnapshot(qStd, s => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));
    return () => { u1(); u2(); u3(); };
  }, [db]);

  const balance = transactions.reduce((acc, t) => { const amt = t.amount || 0; return t.type === 'income' ? acc + amt : acc - amt; }, 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-4"><div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg"><LayoutDashboard size={24}/></div><div><h1 className="text-xl font-black uppercase text-slate-800 tracking-tighter">KEUANGAN & KAS</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Aktif: Rp {balance.toLocaleString('id-ID')}</p></div></div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
          {[{id:'summary', l:'Dashboard', i:LayoutDashboard}, {id:'invoices', l:'Piutang', i:Receipt}, {id:'input', l:'Catat Kas', i:PlusCircle}, {id:'report', l:'Laporan', i:FileText}].map(m => (
            <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab===m.id?'bg-white text-blue-600 shadow-sm':'text-slate-400 hover:text-slate-600'}`}><m.i size={16}/> {m.l}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'summary' && <FinanceSummary transactions={transactions} invoices={invoices} balance={balance} />}
        {activeTab === 'invoices' && <FinanceInvoices invoices={invoices} students={students} db={db} />}
        {activeTab === 'input' && <FinanceInput db={db} students={students} />}
        {activeTab === 'report' && <FinanceReport transactions={transactions} balance={balance} />}
      </div>
    </div>
  );
}