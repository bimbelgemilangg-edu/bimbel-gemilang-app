// src/pages/student/raport/StudentLeaderboard.jsx
import React, { useState, useEffect } from 'react';
import { getRelativeLeaderboard } from '../../../services/raportService';
import RelativeLeaderboard from '../../../components/raport/RelativeLeaderboard';
import { Trophy, Calendar } from 'lucide-react';

const StudentLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  const studentId = localStorage.getItem('studentId');
  const studentName = localStorage.getItem('studentName');
  
  useEffect(() => {
    fetchLeaderboard();
  }, [selectedPeriode]);
  
  const fetchLeaderboard = async () => {
    setLoading(true);
    const data = await getRelativeLeaderboard(selectedPeriode, studentId);
    setLeaderboard(data);
    setLoading(false);
  };
  
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={24} color="#f59e0b" /> Papan Peringkat
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>Lihat posisi kamu di antara teman-teman</p>
      </div>
      
      <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 20, border: '1px solid #e2e8f0' }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Calendar size={12} /> Periode
        </label>
        <input 
          type="month" 
          value={selectedPeriode}
          onChange={(e) => setSelectedPeriode(e.target.value)}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 6 }}
        />
      </div>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ width: 30, height: 30, border: '3px solid #e2e8f0', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: 12, color: '#94a3b8' }}>Memuat leaderboard...</p>
        </div>
      ) : (
        <RelativeLeaderboard 
          leaderboardData={leaderboard} 
          studentId={studentId} 
          studentName={studentName} 
        />
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default StudentLeaderboard;