import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  ShieldAlert, Eye, EyeOff, CreditCard, Banknote, 
  Trash2, Printer, TrendingUp, TrendingDown 
} from 'lucide-react';

// --- IMPORT FILE TERPISAH YANG SUDAH ANDA KIRIM ---
import FinanceInput from './FinanceInput';
import FinanceInvoices from './FinanceInvoices';
import FinanceSummary from './FinanceSummary';

// --- FILTER ANTI-CRASH ---
const safeRender = (val) => {
  if (val === null || val === undefined) return "-";
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return val;
  if (val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('id-ID');
  return String(val);
};

const formatIDR = (n) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(n) || 0);
};

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);
  const [showBalance, setShowBalance] = useState(true);

  useEffect(() => {
    if (!db) return;
    
    // Load Transaksi
    const q1 = query(collection(db, "payments"), orderBy("createdAt", "desc"));
    const u1 = onSnapshot(q1, (s) => setTransactions(s.docs.map(d => ({id: d.id, ...d.data()}))));

    // Load Piutang
    const q2 = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const u2 = onSnapshot(q2, (s) => setInvoices(s.docs.map(d => ({id: d.id, ...d.data()}))));

    // Load Siswa (untuk dropdown di FinanceInput)
    const u3 = onSnapshot(collection(db, "students"), (s) => setStudents(s.docs.map(d => ({id: d.id, ...d.data()}))));

    return () => { u1(); u2(); u3(); };
  }, [db]);

  // Hitung Saldo Dasar
  const calculateStats = () => {
    let inc = 0, exp = 0, cash = 0, bank = 0;
    transactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      const method = String(t.method || '').toLowerCase();
      if (t.type === 'income') {
        inc += amt;
        if(method.includes('bank')) bank += amt; else cash += amt;
      } else {
        exp += amt;
        if(method.includes('bank')) bank -= amt; else cash -= amt;
      }
    });
    return { inc, exp, cash, bank, total: inc - exp };
  };

  const stats = calculateStats();

  const handleDelete = async (id) => {
    const pwd = prompt("Masukkan Sandi Owner:");
    if(!pwd) return;
    const s = await getDoc(doc(db, "settings", "owner_auth"));
    const correct = s.exists() ? s.data().password : "2003";
    if(pwd === correct) await deleteDoc(doc(db, "payments", id));
    else alert("Sandi Salah!");
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
            <button key={t} onClick={()=>setActiveTab(t)} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase transition-all ${activeTab===t ? 'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              {t === 'summary' ? 'Dashboard' : t === 'input' ? 'Catat' : 'Piutang'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        {/* VIEW 1: SUMMARY */}
        {activeTab === 'summary' && (
          <FinanceSummary transactions={transactions} invoices={invoices} balance={stats.total} />
        )}

        {/* VIEW 2: INPUT */}
        {activeTab === 'input' && (
          <FinanceInput db={db} students={students} />
        )}

        {/* VIEW 3: INVOICES (PIUTANG) */}
        {activeTab === 'invoices' && (
          <FinanceInvoices db={db} invoices={invoices} />
        )}
      </div>
    </div>
  );
}