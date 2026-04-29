// src/components/raport/RelativeLeaderboard.jsx
import React from 'react';
import { Trophy, Medal, Crown, User, TrendingUp, TrendingDown } from 'lucide-react';

const RelativeLeaderboard = ({ leaderboardData, studentId, studentName }) => {
  if (!leaderboardData) {
    return (
      <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <Trophy size={32} color="#cbd5e1" />
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Belum ada data leaderboard</p>
      </div>
    );
  }
  
  const { totalStudents, studentRank, studentScore, nearbyStudents, topStudent } = leaderboardData;
  
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={16} color="#fbbf24" />;
    if (rank === 2) return <Medal size={16} color="#94a3b8" />;
    if (rank === 3) return <Medal size={16} color="#cd7f32" />;
    return <span style={{ width: 16, textAlign: 'center', fontSize: 11, fontWeight: 600 }}>{rank}</span>;
  };
  
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16, color: 'white', textAlign: 'center' }}>
        <Trophy size={24} style={{ marginBottom: 4 }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>🏆 Kelas Inspirasi</h3>
        <p style={{ margin: '4px 0 0', fontSize: 10, opacity: 0.9 }}>{totalStudents} Siswa</p>
      </div>
      
      {/* Posisi Siswa */}
      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', textAlign: 'center', background: '#fef3c7' }}>
        <p style={{ margin: 0, fontSize: 10, color: '#b45309' }}>📌 Posisi Kamu</p>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>Peringkat #{studentRank}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>Nilai: {studentScore}</div>
      </div>
      
      {/* Daftar Peringkat Terdekat */}
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>📋 Peringkat di Sekitarmu</p>
        {nearbyStudents.map((student, idx) => {
          const isMe = student.studentId === studentId;
          return (
            <div 
              key={student.id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                marginBottom: 6,
                borderRadius: 10,
                background: isMe ? '#eef2ff' : '#f8fafc',
                border: isMe ? '1px solid #3b82f6' : '1px solid #e2e8f0'
              }}
            >
              <div style={{ width: 28, textAlign: 'center' }}>{getRankIcon(student.rank)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: isMe ? '#3b82f6' : '#1e293b' }}>
                  {student.studentName} {isMe && '(Kamu)'}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{student.studentKelas || '-'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{student.nilai_akhir}</div>
                {student.rank < studentRank && <TrendingUp size={10} color="#10b981" />}
                {student.rank > studentRank && <TrendingDown size={10} color="#ef4444" />}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Inspirasi */}
      {topStudent && topStudent.studentId !== studentId && (
        <div style={{ background: '#dcfce7', padding: 12, margin: '0 16px 16px 16px', borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534' }}>
            💡 <strong>{topStudent.studentName}</strong> adalah peringkat 1 dengan nilai {topStudent.nilai_akhir}.
            {studentRank > 10 && ' Yuk, kejar terus! Kamu pasti bisa!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RelativeLeaderboard;