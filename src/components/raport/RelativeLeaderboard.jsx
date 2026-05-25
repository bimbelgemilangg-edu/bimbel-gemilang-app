// src/components/raport/RelativeLeaderboard.jsx
import React from 'react';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, BookOpen } from 'lucide-react';

const RelativeLeaderboard = ({ leaderboardData, studentId, studentName }) => {
  if (!leaderboardData) {
    return (
      <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0' }}>
        <Trophy size={32} color="#cbd5e1" />
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Belum ada data leaderboard</p>
        <p style={{ fontSize: 10, color: '#cbd5e1', margin: 0 }}>Leaderboard akan muncul setelah guru meng-generate raport.</p>
      </div>
    );
  }
  
  const { totalStudents, studentRank, studentScore, nearbyStudents, topStudent, mapel } = leaderboardData;
  
  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown size={16} color="#fbbf24" />;
    if (rank === 2) return <Medal size={16} color="#c0c0c0" />;
    if (rank === 3) return <Medal size={16} color="#cd7f32" />;
    return <span style={{ width: 16, textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#64748b' }}>{rank}</span>;
  };
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: 16, color: 'white', textAlign: 'center' }}>
        <Trophy size={24} style={{ marginBottom: 4 }} />
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>🏆 Papan Peringkat</h3>
        {mapel && mapel !== 'Semua' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 4 }}>
            <BookOpen size={12} />
            <span style={{ fontSize: 10, opacity: 0.9 }}>{mapel}</span>
          </div>
        )}
        <p style={{ margin: '4px 0 0', fontSize: 10, opacity: 0.9 }}>{totalStudents} Siswa</p>
      </div>
      
      {/* Posisi Siswa */}
      <div style={{ padding: 16, borderBottom: '1px solid #e2e8f0', textAlign: 'center', background: '#fef3c7' }}>
        <p style={{ margin: 0, fontSize: 10, color: '#b45309' }}>📌 Posisi Kamu</p>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#f59e0b' }}>Peringkat #{studentRank}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
          Nilai: <span style={{ color: getScoreColor(studentScore) }}>{studentScore}</span>
        </div>
        <div style={{ marginTop: 4, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden', maxWidth: 200, margin: '8px auto 0' }}>
          <div style={{ 
            height: '100%', 
            width: `${Math.max(5, ((totalStudents - studentRank + 1) / totalStudents) * 100)}%`, 
            background: '#f59e0b', 
            borderRadius: 2,
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ fontSize: 8, color: '#94a3b8', marginTop: 4 }}>
          Mengungguli {totalStudents - studentRank} dari {totalStudents} siswa
        </div>
      </div>
      
      {/* Daftar Peringkat Terdekat */}
      <div style={{ padding: 16 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', margin: '0 0 12px' }}>
          📋 Peringkat di Sekitarmu
        </p>
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
                border: isMe ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ width: 28, textAlign: 'center' }}>
                {getRankIcon(student.rank)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 12, 
                  fontWeight: 700, 
                  color: isMe ? '#3b82f6' : '#1e293b',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {student.studentName} {isMe && '(Kamu)'}
                </div>
                <div style={{ fontSize: 9, color: '#64748b' }}>{student.studentKelas || '-'}</div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 40 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: getScoreColor(student.nilai_akhir) }}>
                  {student.nilai_akhir}
                </div>
                {student.rank < studentRank && (
                  <TrendingUp size={10} color="#10b981" style={{ display: 'inline' }} />
                )}
                {student.rank > studentRank && (
                  <TrendingDown size={10} color="#ef4444" style={{ display: 'inline' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Top 3 Summary */}
      {nearbyStudents && nearbyStudents.length > 0 && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {nearbyStudents.filter(s => s.rank <= 3).slice(0, 3).map((s, i) => (
              <div key={i} style={{
                flex: 1,
                textAlign: 'center',
                padding: 10,
                background: s.rank === 1 ? '#fef3c7' : s.rank === 2 ? '#f1f5f9' : '#fef2f2',
                borderRadius: 8,
                border: `1px solid ${s.rank === 1 ? '#fbbf24' : s.rank === 2 ? '#94a3b8' : '#cd7f32'}`
              }}>
                <div style={{ fontSize: 18 }}>{getRankIcon(s.rank)}</div>
                <div style={{ fontSize: 9, fontWeight: 700, marginTop: 4, color: '#1e293b' }}>{s.studentName?.split(' ')[0]}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: getScoreColor(s.nilai_akhir) }}>{s.nilai_akhir}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Inspirasi */}
      {topStudent && topStudent.studentId !== studentId && (
        <div style={{ background: '#dcfce7', padding: 12, margin: '0 16px 16px 16px', borderRadius: 10 }}>
          <p style={{ margin: 0, fontSize: 10, color: '#166534', lineHeight: 1.4 }}>
            💡 <strong>{topStudent.studentName}</strong> adalah peringkat 1 dengan nilai {topStudent.nilai_akhir}.
            {studentRank > 10 && ' Yuk, kejar terus! Kamu pasti bisa!'}
            {studentRank <= 10 && studentRank > 3 && ' Kamu sudah dekat dengan 3 besar, semangat!'}
            {studentRank <= 3 && ' Kamu sudah di 3 besar, pertahankan!'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RelativeLeaderboard;