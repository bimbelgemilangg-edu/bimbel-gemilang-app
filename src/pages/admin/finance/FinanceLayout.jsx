import React, { useState } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import FinanceDashboard from './FinanceDashboard';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import { LayoutDashboard, PlusCircle, List } from 'lucide-react';

const FinanceLayout = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { key: 'add', label: 'Input Transaksi', icon: <PlusCircle size={16} /> },
    { key: 'history', label: 'Riwayat', icon: <List size={16} /> }
  ];

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        {/* Tab Navigation */}
        <div style={styles.tabBar(isMobile)}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={styles.tabBtn(tab.key === activeTab, isMobile)}
            >
              {tab.icon}
              {!isMobile && <span>{tab.label}</span>}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{marginTop: 20}}>
          {activeTab === 'dashboard' && <FinanceDashboard />}
          {activeTab === 'add' && <TransactionForm />}
          {activeTab === 'history' && <TransactionHistory />}
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box',
    transition: '0.3s'
  }),
  tabBar: (m) => ({ 
    display: 'flex', gap: 8, 
    background: 'white', padding: 6, 
    borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9'
  }),
  tabBtn: (active, m) => ({ 
    flex: 1, padding: m ? '10px 8px' : '12px 20px', 
    borderRadius: 10, border: 'none',
    background: active ? '#1e293b' : 'transparent',
    color: active ? 'white' : '#64748b',
    fontWeight: active ? 'bold' : '500',
    fontSize: m ? 11 : 13,
    cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: '0.2s'
  })
};

export default FinanceLayout;