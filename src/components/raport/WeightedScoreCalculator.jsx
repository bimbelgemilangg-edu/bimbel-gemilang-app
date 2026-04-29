// src/components/raport/WeightedScoreCalculator.jsx
import React, { useState } from 'react';
import { Calculator, TrendingUp, Award, Target } from 'lucide-react';

const WeightedScoreCalculator = ({ scores, weights, onCalculate }) => {
  const [showDetail, setShowDetail] = useState(false);
  
  const calculateAverage = (arr) => {
    if (!arr || arr.length === 0) return 0;
    return Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  };
  
  const averages = {
    kuis: calculateAverage(scores?.kuis),
    catatan: calculateAverage(scores?.catatan),
    ujian: calculateAverage(scores?.ujian),
    keaktifan: calculateAverage(scores?.keaktifan)
  };
  
  const finalScore = (averages.kuis * (weights?.kuis || 0.25)) +
                     (averages.catatan * (weights?.catatan || 0.25)) +
                     (averages.ujian * (weights?.ujian || 0.35)) +
                     (averages.keaktifan * (weights?.keaktifan || 0.15));
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };
  
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
      <div 
        onClick={() => setShowDetail(!showDetail)} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={20} color="#3b82f6" />
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Kalkulator Nilai Akhir</h3>
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>{showDetail ? '▲' : '▼'}</span>
      </div>
      
      {showDetail && (
        <div style={{ marginTop: 16 }}>
          {/* Bobot */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>🎯 Bobot Penilaian</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ background: '#eef2ff', padding: '4px 10px', borderRadius: 20, fontSize: 10 }}>Kuis: {(weights?.kuis || 0.25) * 100}%</span>
              <span style={{ background: '#dcfce7', padding: '4px 10px', borderRadius: 20, fontSize: 10 }}>Catatan: {(weights?.catatan || 0.25) * 100}%</span>
              <span style={{ background: '#fef3c7', padding: '4px 10px', borderRadius: 20, fontSize: 10 }}>Ujian: {(weights?.ujian || 0.35) * 100}%</span>
              <span style={{ background: '#f3e8ff', padding: '4px 10px', borderRadius: 20, fontSize: 10 }}>Keaktifan: {(weights?.keaktifan || 0.15) * 100}%</span>
            </div>
          </div>
          
          {/* Rata-rata per komponen */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>📊 Rata-rata Nilai</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>Kuis</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(averages.kuis) }}>{averages.kuis}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>Catatan</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(averages.catatan) }}>{averages.catatan}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>Ujian</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(averages.ujian) }}>{averages.ujian}</div>
              </div>
              <div style={{ background: '#f8fafc', padding: 8, borderRadius: 8 }}>
                <span style={{ fontSize: 10, color: '#64748b' }}>Keaktifan</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(averages.keaktifan) }}>{averages.keaktifan}</div>
              </div>
            </div>
          </div>
          
          {/* Hasil Akhir */}
          <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 10, textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#166534' }}>Nilai Akhir (Bobot)</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: getScoreColor(Math.round(finalScore)) }}>
              {Math.round(finalScore)}
            </div>
            {onCalculate && (
              <button 
                onClick={() => onCalculate(Math.round(finalScore))}
                style={{ marginTop: 8, background: '#10b981', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}
              >
                Gunakan Nilai Ini
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightedScoreCalculator;