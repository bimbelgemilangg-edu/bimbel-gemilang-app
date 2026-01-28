import React, { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, deleteDoc, getDoc, getDocs } from 'firebase/firestore';
import { 
  Wallet, TrendingUp, TrendingDown, PlusCircle, MinusCircle, 
  Save, CheckCircle, Search, DollarSign, Send, ShieldAlert, 
  Eye, EyeOff, Trash2, Printer, AlertCircle 
} from 'lucide-react';

// --- FUNGSI BANTUAN (HELPER) ---
const formatIDR = (n) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);
};

const safeRender = (val) => {
  if (val === null || val === undefined) return "-";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val;
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('id-ID');
  return String(val);
};

// ==========================================
// KOMPONEN UTAMA (INDUK)
// ==========================================
export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [showBalance, setShowBalance] = useState(true);

  // LOAD DATA
  useEffect(() => {
    if (!db) return;
    try {
      // Load Payments
      const u1 = onSnapshot(query(collection(db, "payments"), orderBy("createdAt", "desc")), (s) => 
        setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      // Load Invoices
      const u2 = onSnapshot(query(collection(db, "invoices"), orderBy("createdAt", "desc")), (s) => 
        setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      // Load Students (untuk dropdown)
      const u3 = onSnapshot(collection(db, "students"), (s) => 
        setStudents(s.docs.map(d => ({id: d.id, ...d.data()})))
      );
      return () => { u1(); u2(); u3(); };
    } catch (err) { console.error("Firebase Error:", err); }
  }, [db]);

  // HITUNG SALDO
  const stats = (() => {
    let inc = 0, exp = 0, cash = 0, bank = 0;
    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const type = t.type || 'expense';
      const method = String(t.method || 'Cash').toLowerCase();
      
      if (type === 'income') {
        inc += amt;
        if(method.includes('bank')) bank += amt; else cash += amt;
      } else {
        exp += amt;
        if(method.includes('bank')) bank -= amt; else cash -= amt;
      }
    });
    return { inc, exp, cash, bank, total: inc - exp };
  })();

  const handleDelete = async (id) => {
    const pwd = prompt("Masukkan Sandi Owner (Default: 2003):");
    if (!pwd) return;
    
    // Cek password ke setting atau default
    const snap = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = snap.exists() ? snap.data().password : "2003";

    if (pwd === correct) {
      await deleteDoc(doc(db, "payments", id));
      alert("Transaksi dihapus.");
    } else {
      alert("Sandi Salah!");
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER NAVIGASI */}
      <div className="bg-white p-5 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl italic text-slate-800 uppercase tracking-tighter">KEUANGAN</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {['summary','input','invoices'].map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} className={`px-4 md:px-6 py-2 rounded-xl font-bold text-[10px] md:text-xs uppercase transition-all ${activeTab===t ? 'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              {t === 'summary' ? 'Dashboard' : t === 'input' ? 'Catat' : 'Piutang'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        
        {/* === VIEW 1: DASHBOARD SUMMARY === */}
        {activeTab === 'summary' && (
          <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in">
            {/* KARTU SALDO */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* KARTU UTAMA */}
              <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                <button onClick={()=>setShowBalance(!showBalance)} className="absolute top-6 right-6 opacity-50 hover:opacity-100">{showBalance?<EyeOff/>:<Eye/>}</button>
                <p className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] mb-2">Total Kas Bersih</p>
                <p className="text-4xl font-black">{showBalance ? formatIDR(stats.total) : "Rp ••••••••"}</p>
                <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 gap-4">
                   <div><p className="text-[9px] font-black opacity-30 uppercase">💵 Tunai</p><p className="font-bold">{showBalance ? formatIDR(stats.cash) : "..."}</p></div>
                   <div><p className="text-[9px] font-black opacity-30 uppercase">🏦 Bank</p><p className="font-bold text-blue-400">{showBalance ? formatIDR(stats.bank) : "..."}</p></div>
                </div>
              </div>

              {/* STATISTIK MASUK/KELUAR */}
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-white p-6 rounded-3xl border-l-8 border-green-500 shadow-sm flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pemasukan</p><p className="text-2xl font-black text-green-600">{formatIDR(stats.inc)}</p></div>
                  <TrendingUp className="text-green-100" size={32}/>
                </div>
                <div className="bg-white p-6 rounded-3xl border-l-8 border-red-500 shadow-sm flex justify-between items-center">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Pengeluaran</p><p className="text-2xl font-black text-red-600">{formatIDR(stats.exp)}</p></div>
                  <TrendingDown className="text-red-100" size={32}/>
                </div>
              </div>

              {/* PIUTANG TOTAL */}
              <div className="bg-orange-500 text-white p-8 rounded-[2.5rem] shadow-lg flex flex-col justify-center text-center">
                <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mb-1">Total Piutang Siswa</p>
                <p className="text-4xl font-black">
                  {formatIDR(invoices.reduce((acc, inv) => acc + (parseInt(inv.remainingAmount) || 0), 0))}
                </p>
              </div>
            </div>

            {/* TABEL MUTASI */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-xs uppercase text-slate-400 tracking-[0.2em]">Riwayat Mutasi Terakhir</h3>
                <button onClick={()=>window.print()} className="bg-slate-100 px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 flex gap-2"><Printer size={14}/> Cetak</button>
              </div>
              <div className="space-y-3">
                {transactions.length === 0 && <p className="text-center text-slate-300 font-bold italic py-10">Belum ada transaksi.</p>}
                {transactions.slice(0, 50).map((t, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {t.type === 'income' ? <TrendingUp size={18}/> : <TrendingDown size={18}/>}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm uppercase">{safeRender(t.description)}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          {safeRender(t.date)} • {safeRender(t.category)} • {safeRender(t.studentName)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <p className={`font-black text-base ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {t.type === 'income' ? '+' : '-'} {formatIDR(t.amount)}
                      </p>
                      <button onClick={() => handleDelete(t.id)} className="text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === VIEW 2: FORM INPUT === */}
        {activeTab === 'input' && (
          <FinanceInputInternal db={db} students={students} />
        )}

        {/* === VIEW 3: INVOICES === */}
        {activeTab === 'invoices' && (
          <FinanceInvoicesInternal db={db} invoices={invoices} />
        )}

      </div>
    </div>
  );
}

// ==========================================
// SUB-KOMPONEN INTERNAL (AGAR TIDAK PERLU FILE PISAH)
// ==========================================

function FinanceInputInternal({ db, students }) {
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('SPP');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!amount || !desc) return alert("Lengkapi data!");
    setLoading(true);
    try {
      await addDoc(collection(db, "payments"), {
        type, amount: parseInt(amount), category, description: desc,
        studentName: selectedStudent || '-',
        date: new Date().toISOString().split('T')[0],
        createdAt: serverTimestamp(),
        method: 'Cash' // Default Cash
      });
      alert("Tersimpan!");
      setAmount(''); setDesc('');
    } catch(e){ alert("Error: "+e.message); }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-slate-100 animate-in zoom-in">
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 mb-8">
        <button onClick={()=>setType('income')} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 ${type==='income'?'bg-green-600 text-white shadow-lg':'text-slate-400'}`}><PlusCircle size={18}/> Pemasukan</button>
        <button onClick={()=>setType('expense')} className={`flex-1 py-4 rounded-xl font-black text-sm uppercase flex items-center justify-center gap-2 ${type==='expense'?'bg-red-600 text-white shadow-lg':'text-slate-400'}`}><MinusCircle size={18}/> Pengeluaran</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Nominal (Rp)</label>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full text-4xl font-black p-6 rounded-[2rem] border-4 border-slate-100 text-center outline-none focus:border-blue-500" placeholder="0" required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Kategori</label>
            <select value={category} onChange={e=>setCategory(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none">
              {type === 'income' ? (
                <><option>SPP</option><option>Pendaftaran</option><option>Lainnya</option></>
              ) : (
                <><option>Gaji</option><option>Operasional</option><option>Perlengkapan</option><option>Lainnya</option></>
              )}
            </select>
          </div>
          
          {type === 'income' && (
             <div>
               <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Dari Siswa</label>
               <select value={selectedStudent} onChange={e=>setSelectedStudent(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none">
                 <option value="">-- Umum / Bukan Siswa --</option>
                 {students.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
             </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Keterangan</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none" rows="3" placeholder="Contoh: Bayar Listrik / SPP Januari..." required></textarea>
        </div>

        <button disabled={loading} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:bg-blue-600 transition-all">
          {loading ? 'Menyimpan...' : 'SIMPAN TRANSAKSI'}
        </button>
      </form>
    </div>
  );
}

function FinanceInvoicesInternal({ db, invoices }) {
  const [search, setSearch] = useState('');
  const filtered = invoices.filter(i => i.studentName?.toLowerCase().includes(search.toLowerCase()));

  const handlePay = async (inv) => {
    const amtStr = prompt(`Sisa Tagihan: ${formatIDR(inv.remainingAmount)}\nMasukkan jumlah pembayaran:`);
    if(!amtStr) return;
    const pay = parseInt(amtStr);
    if(isNaN(pay) || pay <= 0) return alert("Nominal salah!");

    const rem = Math.max(0, inv.remainingAmount - pay);
    
    // 1. Update Invoice
    await updateDoc(doc(db,"invoices",inv.id), { 
      remainingAmount: rem, 
      status: rem <= 0 ? 'Lunas' : 'Belum Lunas' 
    });

    // 2. Catat di Kas
    await addDoc(collection(db,"payments"), {
      type: 'income', amount: pay, category: 'SPP',
      description: `Pelunasan: ${inv.studentName}`,
      studentName: inv.studentName,
      date: new Date().toISOString().split('T')[0],
      createdAt: serverTimestamp(),
      method: 'Cash'
    });

    alert("Pembayaran Berhasil Dicatat!");
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right">
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
        <Search className="text-slate-400"/>
        <input type="text" placeholder="Cari tagihan siswa..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full font-bold outline-none text-slate-700"/>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.length === 0 && <div className="text-center py-10 text-slate-300 font-bold">Tidak ada tagihan ditemukan.</div>}
        {filtered.map(inv => (
          <div key={inv.id} className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-all flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-lg text-slate-800">{inv.studentName}</h3>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${inv.status==='Lunas'?'bg-green-100 text-green-600':'bg-red-100 text-red-600'}`}>{inv.status || 'Belum Lunas'}</span>
              </div>
              <p className="text-xs font-bold text-slate-400">Jatuh Tempo: {safeRender(inv.dueDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sisa Tagihan</p>
              <p className="text-2xl font-black text-red-600">{formatIDR(inv.remainingAmount)}</p>
            </div>
            {inv.remainingAmount > 0 && (
              <button onClick={()=>handlePay(inv)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-green-600 transition-all shadow-lg">
                Bayar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}