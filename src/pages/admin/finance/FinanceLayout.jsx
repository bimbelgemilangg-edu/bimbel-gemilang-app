import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';
import FinanceDashboard from './FinanceDashboard';
import IncomeEntry from './IncomeEntry';
import ExpenseEntry from './ExpenseEntry';
import DebtControl from './DebtControl';
import TransactionHistory from './TransactionHistory';

const FinanceLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <FinanceDashboard />;
      case 'income': return <IncomeEntry />;
      case 'expense': return <ExpenseEntry />;
      case 'debt': return <DebtControl />;
      case 'history': return <TransactionHistory />;
      default: return <FinanceDashboard />;
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: 250, padding: 30, width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
        
        {/* HEADER MENU NAVIGASI KEUANGAN */}
        <div style={{background:'white', padding:15, borderRadius:10, marginBottom:20, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', display:'flex', gap:10, flexWrap:'wrap'}}>
            <button onClick={()=>setActiveTab('dashboard')} style={btnStyle(activeTab==='dashboard')}>📊 Dashboard & Saldo</button>
            <button onClick={()=>setActiveTab('income')} style={btnStyle(activeTab==='income', '#27ae60')}>➕ Pemasukan Lain</button>
            <button onClick={()=>setActiveTab('expense')} style={btnStyle(activeTab==='expense', '#c0392b')}>➖ Input Pengeluaran</button>
            <button onClick={()=>setActiveTab('debt')} style={btnStyle(activeTab==='debt', '#e67e22')}>⚠️ Kontrol Piutang</button>
            <button onClick={()=>setActiveTab('history')} style={btnStyle(activeTab==='history', '#2c3e50')}>📜 Buku Mutasi</button>
        </div>

        {/* KONTEN BERUBAH SESUAI TAB */}
        {renderContent()}

      </div>
    </div>
  );
};

const btnStyle = (active, color='#2c3e50') => ({
    padding: '10px 20px',
    background: active ? color : 'white',
    color: active ? 'white' : '#555',
    border: active ? 'none' : '1px solid #ddd',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    transition: '0.3s',
    boxShadow: active ? '0 2px 5px rgba(0,0,0,0.2)' : 'none'
});

export default FinanceLayout;