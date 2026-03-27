import React, { useState } from 'react';
import ManageMateri from './ManageMateri';
import ManageTugas from './ManageTugas';
import ManageQuiz from './ManageQuiz';
import CekTugasSiswa from './CekTugasSiswa';
import { BookOpen, FileText, HelpCircle, Users, Layout } from 'lucide-react';

const ModulManager = () => {
  const [activeTab, setActiveTab] = useState('materi');

  const tabs = [
    { id: 'materi', label: 'Materi', icon: <BookOpen size={18} />, color: '#3498db' },
    { id: 'tugas', label: 'Tugas', icon: <FileText size={18} />, color: '#e67e22' },
    { id: 'quiz', label: 'Kuis', icon: <HelpCircle size={18} />, color: '#9b59b6' },
    { id: 'cek', label: 'Cek Tugas', icon: <Users size={18} />, color: '#27ae60' },
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerTitle}>
          <Layout size={24} color="#2c3e50" />
          <h2 style={{ margin: 0 }}>Manajemen E-Learning</h2>
        </div>
        <p style={styles.subtitle}>
          Rencanakan materi, tugas, dan kuis dalam satu tempat untuk satu bulan ke depan.
        </p>
      </div>

      {/* TAB NAVIGATION */}
      <div style={styles.tabBar}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              ...styles.tabButton,
              borderBottom: activeTab === tab.id ? `3px solid ${tab.color}` : '3px solid transparent',
              color: activeTab === tab.id ? tab.color : '#95a5a6',
              background: activeTab === tab.id ? `${tab.color}10` : 'transparent',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <div style={styles.contentBox}>
        {activeTab === 'materi' && <ManageMateri />}
        {activeTab === 'tugas' && <ManageTugas />}
        {activeTab === 'quiz' && <ManageQuiz />}
        {activeTab === 'cek' && <CekTugasSiswa />}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    animation: 'fadeIn 0.5s ease-in-out',
  },
  header: {
    marginBottom: '25px',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '5px',
  },
  subtitle: {
    margin: 0,
    color: '#7f8c8d',
    fontSize: '14px',
  },
  tabBar: {
    display: 'flex',
    gap: '5px',
    background: 'white',
    padding: '10px 10px 0 10px',
    borderRadius: '12px 12px 0 0',
    borderBottom: '1px solid #eee',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
    transition: '0.3s',
  },
  contentBox: {
    background: 'white',
    padding: '25px',
    borderRadius: '0 0 12px 12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
    minHeight: '400px',
  },
};

export default ModulManager;