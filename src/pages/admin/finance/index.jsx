import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ShieldAlert } from 'lucide-react';

// IMPORT ANAK-ANAKNYA
import FinanceSummary from './FinanceSummary';
import FinanceInput from './FinanceInput';
import FinanceInvoices from './FinanceInvoices';
import FinanceReport from './FinanceReport';

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!db) return;

    // Load Data Realtime
    const unsub1 = onSnapshot(query(collection(db, "payments"), orderBy("createdAt", "desc")), (s) => 
      setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    const unsub2 = onSnapshot(query(collection(db, "invoices"), orderBy("createdAt", "desc")), (s) => 
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
    );
    const unsub3 = onSnapshot(query(collection(db, "students"), orderBy("name", "asc")), (s) => 
      setStudents(s.docs.map(d => ({id: d.id, ...d.data()})))
    );

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [db]);

  // Hitung Saldo
  const balance = transactions.reduce((acc, t) => {
    const amt = parseInt(t.amount) || 0;
    return t.type === 'income' ? acc + amt : acc - amt;
  }, 0);

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER */}
      <div className="bg-white p-5 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl italic text-slate-800 uppercase tracking-tighter">KEUANGAN</h1>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto">
          {[
            {id:'summary', l:'Dashboard'},
            {id:'input', l:'Catat'},
            {id:'invoices', l:'Piutang'},
            {id:'report', l:'Laporan'}
          ].map(m => (
            <button key={m.id} onClick={()=>setActiveTab(m.id)} className={`px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all ${activeTab===m.id?'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              {m.l}
            </button>
          ))}
        </div>
      </div>

      {/* BODY - PANGGIL FILE ANAK DISINI */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'summary' && <FinanceSummary db={db} transactions={transactions} invoices={invoices} balance={balance} />}
        {activeTab === 'input' && <FinanceInput db={db} students={students} />}
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices} />}
        {activeTab === 'report' && <FinanceReport transactions={transactions} balance={balance} />}
      </div>
    </div>
  );
}