import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  ShieldAlert, TrendingUp, TrendingDown, Eye, EyeOff, 
  Trash2, Printer, PlusCircle, MinusCircle, Search, 
  CheckCircle, Download, FileText, AlertCircle 
} from 'lucide-react';

// ==========================================
// 1. HELPER FUNCTIONS (Fungsi Bantuan)
// ==========================================
const formatIDR = (n) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);
const safeDate = (val) => val ? val : '-';

// ==========================================
// 2. MAIN COMPONENT (INDUK UTAMA)
// ==========================================
export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary'); // summary | input | invoices | report
  
  // STATE DATA (Pusat Data)
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);

  // LOAD DATA DARI FIREBASE
  useEffect(() => {
    if (!db) return;

    try {
      // Load Payments
      const u1 = onSnapshot(query(collection(db, "payments"), orderBy("createdAt", "desc")), s => 
        setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      // Load Invoices
      const u2 = onSnapshot(query(collection(db, "invoices"), orderBy("createdAt", "desc")), s => 
        setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      // Load Students
      const u3 = onSnapshot(collection(db, "students"), s => 
        setStudents(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      return () => { u1(); u2(); u3(); };
    } catch (err) { console.error("Firebase Error", err); }
  }, [db]);

  // HITUNG SALDO TOTAL
  const balance = transactions.reduce((acc, t) => {
    const amt = parseInt(t.amount) || 0;
    return t.type === 'income' ? acc + amt : acc - amt;
  }, 0);

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER NAVIGASI */}
      <div className="bg-white p-5 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl italic text-slate-800 uppercase tracking-tighter">KEUANGAN</h1>
        </div>
        
        {/* MENU TAB */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto">
          {[
            {id:'summary', label:'Dashboard'},
            {id:'input', label:'Catat Kas'},
            {id:'invoices', label:'Tagihan'},
            {id:'report', label:'Laporan'}
          ].map(menu => (
            <button 
              key={menu.id} 
              onClick={()=>setActiveTab(menu.id)} 
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all ${activeTab===menu.id ? 'bg-white text-blue-600 shadow-md':'text-slate-400'}`}
            >
              {menu.label}
            </button>
          ))}
        </div>
      </div>

      {/* BODY KONTEN (Panggil Komponen Internal di bawah) */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'summary' && <InternalSummary transactions={transactions} invoices={invoices} balance={balance} db={db} />}
        {activeTab === 'input' && <InternalInput db={db} students={students} />}
        {activeTab === 'invoices' && <InternalInvoices db={db} invoices={invoices} />}
        {activeTab === 'report' && <InternalReport transactions={transactions} balance={balance} />}
      </div>
    </div>
  );
}

// ==========================================
// 3. INTERNAL COMPONENTS (KOMPONEN DALAM)
// ==========================================

// --- A. SUMMARY VIEW ---
function InternalSummary({ transactions, invoices, balance, db }) {
  const [show, setShow] = useState(true);
  
  const inc = transactions.filter(t=>t.type==='income').reduce((a,b)=>a+(parseInt(b.amount)||0),0);
  const exp = transactions.filter(t=>t.type!=='income').reduce((a,b)=>a+(parseInt(b.amount)||0),0);
  const debt = invoices.reduce((a,b)=>a+(parseInt(b.remainingAmount)||0),0);

  const del = async (id) => {
    const pwd = prompt("Masukkan Sandi Owner:");
    if(!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = s.exists() ? s.data().password : "2003";
    if(pwd === correct) await deleteDoc(doc(db, "payments", id));
    else alert("Sandi Salah!");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
          <button onClick={()=>setShow(!show)} className="absolute top-6 right-6 opacity-50"><Eye size={20}/></button>
          <div className="text-[10px] uppercase opacity-50 mb-1">Total Saldo Kas</div>
          <div className="text-3xl font-black">{show ? formatIDR(balance) : 'Rp •••'}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-l-8 border-green-500 shadow-sm">
          <div className="flex gap-2 mb-1 text-green-600"><TrendingUp size={16}/><span className="text-[10px] font-black uppercase">Pemasukan</span></div>
          <div className="text-2xl font-black">{formatIDR(inc)}</div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border-l-8 border-red-500 shadow-sm">
          <div className="flex gap-2 mb-1 text-red-600"><TrendingDown size={16}/><span className="text-[10px] font-black uppercase">Pengeluaran</span></div>
          <div className="text-2xl font-black">{formatIDR(exp)}</div>
        </div>
        <div className="bg-orange-500 text-white p-6 rounded-[2rem] shadow-lg">
          <div className="flex gap-2 mb-1 text-white/80"><AlertCircle size={16}/><span className="text-[10px] font-black uppercase">Total Piutang</span></div>
          <div className="text-2xl font-black">{formatIDR(debt)}</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm">
        <h3 className="font-black text-xs uppercase text-slate-400 mb-6 tracking-widest">50 Mutasi Terakhir</h3>
        <div className="space-y-2">
          {transactions.slice(0, 50).map(t => (
            <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl group hover:bg-white border hover:shadow-sm transition-all">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${t.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>
                  {t.type==='income'?<TrendingUp size={16}/>:<TrendingDown size={16}/>}
                </div>
                <div>
                  <div className="font-black text-sm uppercase">{t.description}</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">{t.date} • {t.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>
                  {t.type==='income'?'+':'-'} {formatIDR(t.amount)}
                </span>
                <button onClick={()=>del(t.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
          {transactions.length === 0 && <p className="text-center italic text-slate-400">Belum ada transaksi.</p>}
        </div>
      </div>
    </div>
  );
}

// --- B. INPUT FORM ---
function InternalInput({ db, students }) {
  const [form, setForm] = useState({ type:'income', amount:'', cat:'SPP', desc:'', stud:'' });
  const [loading, setLoading] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if(!form.amount || !form.desc) return alert("Mohon lengkapi data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type: form.type,
        amount: parseInt(form.amount),
        category: form.cat,
        description: form.desc,
        studentName: form.stud || '-',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        method: 'Cash'
      });
      alert("Transaksi Disimpan!"); 
      setForm({...form, amount:'', desc:''});
    } catch(e) { alert("Error: " + e.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 animate-in zoom-in">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-6">
        <button onClick={()=>setForm({...form, type:'income'})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${form.type==='income'?'bg-green-600 text-white shadow':'text-slate-400'}`}><PlusCircle size={16}/> Pemasukan</button>
        <button onClick={()=>setForm({...form, type:'expense'})} className={`flex-1 py-3 rounded-xl font-black text-xs uppercase ${form.type==='expense'?'bg-red-600 text-white shadow':'text-slate-400'}`}><MinusCircle size={16}/> Pengeluaran</button>
      </div>
      <form onSubmit={save} className="space-y-6">
        <div>
           <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nominal</label>
           <input type="number" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} className="w-full text-3xl font-black p-5 rounded-[2rem] border-4 border-slate-100 text-center outline-none focus:border-blue-500" placeholder="0"/>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Kategori</label>
            <select value={form.cat} onChange={e=>setForm({...form, cat:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100">
              {form.type==='income' ? <><option>SPP</option><option>Pendaftaran</option><option>Lainnya</option></> : <><option>Gaji</option><option>Operasional</option><option>Lainnya</option></>}
            </select>
          </div>
          {form.type==='income' && (
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Siswa</label>
              <select value={form.stud} onChange={e=>setForm({...form, stud:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100">
                <option value="">-- Umum --</option>
                {students?.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
        <textarea value={form.desc} onChange={e=>setForm({...form, desc:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-slate-100" placeholder="Keterangan..." required></textarea>
        <button disabled={loading} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-lg">{loading?'Menyimpan...':'SIMPAN'}</button>
      </form>
    </div>
  );
}

// --- C. INVOICES VIEW ---
function InternalInvoices({ db, invoices }) {
  const [search, setSearch] = useState('');
  
  const pay = async (inv) => {
    const v = prompt(`Sisa: ${formatIDR(inv.remainingAmount)}\nBayar berapa?`);
    if(!v) return;
    const p = parseInt(v);
    if(p > inv.remainingAmount) return alert("Kelebihan!");
    
    await updateDoc(doc(db,"invoices",inv.id), { remainingAmount: inv.remainingAmount - p, status: (inv.remainingAmount-p)<=0?'Lunas':'Belum' });
    await addDoc(collection(db,"payments"), { type:'income', amount:p, category:'SPP', description:`Pelunasan: ${inv.studentName}`, date:new Date().toISOString().split('T')[0], createdAt:serverTimestamp() });
    alert("Lunas!");
  };

  const filtered = invoices.filter(i => i.studentName?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4 animate-in slide-in-from-right">
      <div className="bg-white p-4 rounded-2xl border flex items-center gap-3">
        <Search className="text-slate-400"/>
        <input type="text" placeholder="Cari nama siswa..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full font-bold outline-none text-slate-700"/>
      </div>
      {filtered.map(i => (
        <div key={i.id} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
          <div>
             <div className="flex items-center gap-2">
               <h4 className="font-black text-lg">{i.studentName}</h4>
               <span className={`text-[10px] px-2 rounded font-black uppercase ${i.status==='Lunas'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{i.status||'Belum'}</span>
             </div>
             <p className="text-xs text-slate-400 font-bold uppercase">Tempo: {safeDate(i.dueDate)}</p>
          </div>
          <div className="text-right"><p className="text-[10px] font-black uppercase text-slate-400">Sisa</p><p className="text-xl font-black text-red-600">{formatIDR(i.remainingAmount)}</p></div>
          {i.remainingAmount > 0 ? <button onClick={()=>pay(i)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Bayar</button> : <button disabled className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl"><CheckCircle/></button>}
        </div>
      ))}
    </div>
  );
}

// --- D. REPORT VIEW ---
function InternalReport({ transactions, balance }) {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] flex justify-between items-center shadow-xl">
        <div><h2 className="text-2xl font-black">LAPORAN</h2><p className="text-slate-400 font-bold text-sm">Rekap Arus Kas</p></div>
        <button onClick={()=>window.print()} className="bg-white text-black px-6 py-3 rounded-xl font-black text-xs uppercase flex gap-2"><Printer size={16}/> Cetak</button>
      </div>
      <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b text-[10px] font-black uppercase text-slate-400"><th className="p-4">Tanggal</th><th className="p-4">Ket</th><th className="p-4">Tipe</th><th className="p-4 text-right">Nominal</th></tr></thead>
          <tbody>
            {transactions.map((t,i)=>(
              <tr key={i} className="border-b">
                <td className="p-4">{safeDate(t.date)}</td>
                <td className="p-4">{t.description}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] uppercase font-bold ${t.type==='income'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{t.type==='income'?'Masuk':'Keluar'}</span></td>
                <td className={`p-4 text-right font-black ${t.type==='income'?'text-green-600':'text-red-600'}`}>{t.type==='income'?'+':'-'} {formatIDR(t.amount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
             <tr className="bg-slate-900 text-white"><td colSpan="3" className="p-6 text-right font-bold uppercase rounded-l-2xl">Saldo Akhir</td><td className="p-6 text-right font-black text-xl rounded-r-2xl">{formatIDR(balance)}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}