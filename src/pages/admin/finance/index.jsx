import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import FinanceSummary from './FinanceSummary';
import FinanceInvoices from './FinanceInvoices';
import FinanceInput from './FinanceInput';
import FinanceReport from './FinanceReport';
import { LayoutDashboard, Receipt, PlusCircle, FileText } from 'lucide-react';

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  
  // DATABASE PUSAT (Single Source of Truth)
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    // 1. Ambil Transaksi (Mutasi)
    const u1 = onSnapshot(query(collection(db, "payments"), orderBy("date", "desc")), s => 
      setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 2. Ambil Tagihan (Piutang)
    const u2 = onSnapshot(query(collection(db, "invoices"), orderBy("createdAt", "desc")), s => 
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    // 3. Ambil Siswa (Untuk Filter)
    const u3 = onSnapshot(query(collection(db, "students"), orderBy("name")), s => 
      setStudents(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    return () => { u1(); u2(); u3(); };
  }, [db]);

  // Hitung Saldo Global
  const balance = transactions.reduce((acc, t) => {
    const amt = t.amount || 0;
    if (t.type === 'income') return acc + amt;
    if (t.type === 'expense') return acc - amt;
    return acc;
  }, 0);

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 overflow-hidden font-sans">
      {/* TOP NAVIGATION BAR */}
      <div className="bg-white px-8 py-4 border-b border-slate-200 flex justify-between items-center shadow-sm z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-3 rounded-xl text-white shadow-lg"><LayoutDashboard size={24}/></div>
          <div>
            <h1 className="text-xl font-black uppercase text-slate-800 tracking-tighter">Pusat Keuangan</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Saldo Aktif: Rp {balance.toLocaleString('id-ID')}</p>
          </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl gap-1">
          {[
            {id:'summary', l:'Dashboard', i:LayoutDashboard},
            {id:'invoices', l:'Piutang Siswa', i:Receipt},
            {id:'input', l:'Catat Kas', i:PlusCircle},
            {id:'report', l:'Laporan & Analisis', i:FileText},
          ].map(m => (
            <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`px-6 py-2.5 rounded-lg font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab===m.id?'bg-white text-blue-600 shadow-sm':'text-slate-400 hover:text-slate-600'}`}>
              <m.i size={16}/> {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        {activeTab === 'summary' && <FinanceSummary db={db} transactions={transactions} invoices={invoices} balance={balance} />}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices} students={students} />}
        {activeTab === 'input' && <FinanceInput db={db} students={students} />}
        {activeTab === 'report' && <FinanceReport transactions={transactions} invoices={invoices} balance={balance} />}
      </div>
    </div>
  );
}