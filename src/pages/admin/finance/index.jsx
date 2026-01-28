import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ShieldAlert } from 'lucide-react';

// IMPORT SEMUA FILE ANAK (4 FILE)
import FinanceSummary from './FinanceSummary';
import FinanceInput from './FinanceInput';
import FinanceInvoices from './FinanceInvoices';
import FinanceReport from './FinanceReport'; // <-- TAMBAHAN BARU

export default function AdminFinance({ db }) {
  // Tambahkan tab 'report'
  const [activeTab, setActiveTab] = useState('summary');
  
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (!db) return;

    // 1. Ambil Data Transaksi
    const q1 = query(collection(db, "payments"), orderBy("createdAt", "desc"));
    const unsub1 = onSnapshot(q1, (snap) => {
      setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Ambil Data Tagihan
    const q2 = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const unsub2 = onSnapshot(q2, (snap) => {
      setInvoices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 3. Ambil Data Siswa (Penting untuk Input)
    const q3 = query(collection(db, "students"), orderBy("name", "asc"));
    const unsub3 = onSnapshot(q3, (snap) => {
      setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsub1(); unsub2(); unsub3(); };
  }, [db]);

  // Hitung Total Saldo untuk dikirim ke Summary & Report
  const balance = transactions.reduce((acc, curr) => {
    const amt = Number(curr.amount) || 0;
    return curr.type === 'income' ? acc + amt : acc - amt;
  }, 0);

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* HEADER */}
      <div className="bg-white p-5 border-b flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl italic text-slate-800 uppercase tracking-tighter">KEUANGAN</h1>
        </div>
        
        {/* MENU TAB NAVIGATION */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto">
          {[
            {id: 'summary', label: 'Dashboard'},
            {id: 'input', label: 'Catat'},
            {id: 'invoices', label: 'Piutang'},
            {id: 'report', label: 'Laporan'} // <-- MENU BARU
          ].map(t => (
            <button 
              key={t.id} 
              onClick={()=>setActiveTab(t.id)} 
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase whitespace-nowrap transition-all ${activeTab===t.id ? 'bg-white text-blue-600 shadow-md':'text-slate-400'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeTab === 'summary' && (
          <FinanceSummary transactions={transactions} invoices={invoices} balance={balance} db={db} />
        )}

        {activeTab === 'input' && (
          <FinanceInput db={db} students={students} />
        )}

        {activeTab === 'invoices' && (
          <FinanceInvoices db={db} invoices={invoices} />
        )}

        {/* VIEW BARU: LAPORAN */}
        {activeTab === 'report' && (
          <FinanceReport transactions={transactions} balance={balance} />
        )}
      </div>
    </div>
  );
}