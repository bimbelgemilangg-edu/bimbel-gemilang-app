import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { LayoutDashboard, Receipt, PlusCircle, ShieldAlert } from 'lucide-react';

// IMPORT FILE ANAK DARI FOLDER YANG SAMA
import FinanceSummary from './FinanceSummary';
import FinanceInvoices from './FinanceInvoices';
import FinanceInput from './FinanceInput';

export default function AdminFinance({ db }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    if (!db) return;
    
    // 1. Ambil Data Mutasi (Payments)
    const qTrans = query(collection(db, "payments"), orderBy("date", "desc"));
    const u1 = onSnapshot(qTrans, s => 
      setTransactions(s.docs.map(d => ({id: d.id, ...d.data()})))
    );

    // 2. Ambil Data Tagihan (Invoices)
    const qInv = query(collection(db, "invoices"), orderBy("createdAt", "desc"));
    const u2 = onSnapshot(qInv, s => 
      setInvoices(s.docs.map(d => ({id: d.id, ...d.data()})))
    );

    return () => { u1(); u2(); };
  }, [db]);

  // --- LOGIKA INTELIJEN: PENENTU PEMASUKAN/PENGELUARAN ---
  // Fungsi ini memperbaiki data lama yang mungkin salah label
  const analyze = (t) => {
    const type = String(t.type || '').toLowerCase();
    const cat = String(t.category || '').toLowerCase();
    const desc = String(t.description || '').toLowerCase();

    // PAKSA JADI INCOME JIKA...
    if (
      type === 'income' || type === 'pemasukan' || 
      cat === 'pendaftaran' || cat === 'spp' || cat === 'daftar ulang' || 
      desc.includes('pembayaran') || desc.includes('pelunasan')
    ) {
      return 'income';
    }
    
    // SISANYA EXPENSE
    return 'expense'; 
  };

  // --- HITUNG TOTAL ---
  const incomeTotal = transactions.reduce((acc, t) => analyze(t) === 'income' ? acc + (Number(t.amount)||0) : acc, 0);
  const expenseTotal = transactions.reduce((acc, t) => analyze(t) === 'expense' ? acc + (Number(t.amount)||0) : acc, 0);
  const piutangTotal = invoices.reduce((acc, inv) => acc + (Number(inv.remainingAmount)||0), 0);
  
  // Hitung Saldo Detail (Cash vs Bank)
  const cashBal = transactions.reduce((acc, t) => {
    const m = String(t.method || '').toLowerCase();
    if (m.includes('cash') || m.includes('tunai')) {
      return analyze(t) === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    } return acc;
  }, 0);

  const bankBal = transactions.reduce((acc, t) => {
    const m = String(t.method || '').toLowerCase();
    if (m.includes('bank') || m.includes('transfer')) {
      return analyze(t) === 'income' ? acc + Number(t.amount) : acc - Number(t.amount);
    } return acc;
  }, 0);

  const balance = incomeTotal - expenseTotal;

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans overflow-hidden">
      
      {/* HEADER UTAMA */}
      <div className="bg-white p-5 border-b flex justify-between items-center shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg"><ShieldAlert size={20}/></div>
          <h1 className="font-black text-xl italic text-slate-800 uppercase tracking-tighter">KEUANGAN & KAS</h1>
        </div>
        
        {/* NAVIGASI TAB */}
        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {[
            {id:'summary', l:'Dashboard', i:LayoutDashboard}, 
            {id:'input', l:'Catat Kas', i:PlusCircle}, 
            {id:'invoices', l:'Piutang', i:Receipt}
          ].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} className={`px-6 py-2 rounded-xl font-bold text-xs uppercase flex items-center gap-2 transition-all ${activeTab===t.id ? 'bg-white text-blue-600 shadow-md':'text-slate-400'}`}>
              <t.i size={14}/> {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* ISI KONTEN (MEMANGGIL FILE ANAK) */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {activeTab === 'summary' && (
          <FinanceSummary 
            db={db}
            transactions={transactions} 
            invoices={invoices} 
            balance={balance} 
            incomeTotal={incomeTotal}
            expenseTotal={expenseTotal}
            piutangTotal={piutangTotal}
            cashBal={cashBal}
            bankBal={bankBal}
          />
        )}
        
        {activeTab === 'input' && <FinanceInput db={db} />}
        
        {activeTab === 'invoices' && <FinanceInvoices db={db} invoices={invoices} />}
        
      </div>
    </div>
  );
}