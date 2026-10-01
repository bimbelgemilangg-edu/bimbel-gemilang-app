// src/pages/admin/finance/FinanceLayout.jsx
// 🔥 UPGRADE (permintaan owner: kasir butuh kwitansi bernomor + fitur
// serah uang): tab bertambah dari 3 jadi 5, dan tab awal bisa dipilih
// lewat query ?tab= (dipakai link sidebar "Kwitansi" & tab serah uang).
// Urutan tab = alur kerja kasir sehari-hari:
//   Dashboard -> Input -> Riwayat -> Kwitansi -> Serah Uang ke Owner
// 🔥 DIUBAH 2026-10-01: tab terakhir dulu bernama "Tutup Kasir" (upacara
// kunci penerimaan akhir giliran + antrean verifikasi owner). Atas keputusan
// owner ("pilihan 1") ia menjadi catatan serah uang ada-hoc tanpa upacara;
// lihat kepala berkas SerahUangKeOwner.jsx.
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SidebarAdmin from '../../../components/SidebarAdmin';
import FinanceDashboard from './FinanceDashboard';
import TransactionForm from './TransactionForm';
import TransactionHistory from './TransactionHistory';
import RiwayatKwitansi from './RiwayatKwitansi';
import SerahUangKeOwner from './SerahUangKeOwner';
import { LayoutDashboard, PlusCircle, List, Receipt, HandCoins } from 'lucide-react';

const TAB_SAH = ['dashboard', 'add', 'history', 'kwitansi', 'kasir'];

const FinanceLayout = () => {
  const [searchParams] = useSearchParams();
  const tabAwal = TAB_SAH.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'dashboard';
  const [activeTab, setActiveTab] = useState(tabAwal);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kalau link sidebar berubah (?tab=...), ikuti.
  React.useEffect(() => {
    const t = searchParams.get('tab');
    if (TAB_SAH.includes(t)) setActiveTab(t);
  }, [searchParams]);

  const tabs = [
    { key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    { key: 'add', label: 'Input Transaksi', icon: <PlusCircle size={16} /> },
    { key: 'history', label: 'Riwayat', icon: <List size={16} /> },
    { key: 'kwitansi', label: 'Kwitansi', icon: <Receipt size={16} /> },
    { key: 'kasir', label: 'Serah Uang ke Owner', icon: <HandCoins size={16} /> },
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
          {activeTab === 'kwitansi' && <RiwayatKwitansi />}
          {activeTab === 'kasir' && <SerahUangKeOwner />}
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
  tabBar: () => ({ 
    display: 'flex', gap: 8, 
    background: 'white', padding: 6, 
    borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
    flexWrap: 'wrap'
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
    transition: '0.2s',
    minWidth: 'fit-content'
  })
};

export default FinanceLayout;
