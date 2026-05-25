// src/components/raport/WeightedScoreCalculator.jsx
import React, { useState } from 'react';
import { Calculator, TrendingUp, Award, Target, Brain, Lightbulb, Clock, Zap } from 'lucide-react';
import { DIMENSI_CONFIG, DIMENSI_KEYS, KOMPONEN_BOBOT, KOMPONEN_LABEL } from '../../firebase/raportCollection';

const WeightedScoreCalculator = ({ scores, onCalculate }) => {
  const [showDetail, setShowDetail] = useState(false);
  
  // Ikon untuk tiap dimensi
  const dimensiIcons = {
    pemahaman: <Brain size={14} />,
    analisis: <Lightbulb size={14} />,
    ketelitian: <Target size={14} />,
    waktu: <Clock size={14} />,
    dayaTangkap: <Zap size={14} />
  };
  
  // Hitung rata-rata 5 dimensi dari satu set data
  const calculateDimensiAverage = (arr) => {
    if (!arr || arr.length === 0) return null;
    
    const totals = {};
    DIMENSI_KEYS.forEach(key => { totals[key] = 0; });
    
    arr.forEach(item => {
      if (item.dimensi) {
        DIMENSI_KEYS.forEach(key => {
          totals[key] += (item.dimensi[key] || 0);
        });
      } else if (item.nilai) {
        // Fallback: nilai lama tanpa dimensi
        DIMENSI_KEYS.forEach(key => {
          totals[key] += item.nilai;
        });
      }
    });
    
    const count = arr.length;
    const avg = {};
    DIMENSI_KEYS.forEach(key => {
      avg[key] = Math.round((totals[key] / count) * 10) / 10;
    });
    
    avg.total = Math.round(
      DIMENSI_KEYS.reduce((sum, key) => sum + avg[key], 0) / 5 * 10
    ) / 10;
    
    return avg;
  };
  
  // Hitung rata-rata per komponen
  const kuisAvg = calculateDimensiAverage(scores?.kuis);
  const tugasAvg = calculateDimensiAverage(scores?.tugas);
  const ujianAvg = calculateDimensiAverage(scores?.ujian);
  
  // Hitung nilai akhir sesuai aturan
  const calculateFinalScore = () => {
    const hasKuis = kuisAvg !== null;
    const hasTugas = tugasAvg !== null;
    const hasUjian = ujianAvg !== null;
    
    if (hasUjian) {
      // Ada ujian → pakai ujian
      return { nilai: ujianAvg.total, mode: 'Ujian', komponen: ['ujian'] };
    } else if (hasKuis && hasTugas) {
      // Quiz + Tugas → rata-rata
      const avg = Math.round(((kuisAvg.total + tugasAvg.total) / 2) * 10) / 10;
      return { nilai: avg, mode: 'Quiz + Tugas', komponen: ['kuis', 'tugas'] };
    } else if (hasKuis) {
      return { nilai: kuisAvg.total, mode: 'Quiz', komponen: ['kuis'] };
    } else if (hasTugas) {
      return { nilai: tugasAvg.total, mode: 'Tugas', komponen: ['tugas'] };
    } else {
      return { nilai: 0, mode: 'Belum ada nilai', komponen: [] };
    }
  };
  
  // Jika lengkap → bobot
  const calculateWeightedScore = () => {
    const hasKuis = kuisAvg !== null;
    const hasTugas = tugasAvg !== null;
    const hasUjian = ujianAvg !== null;
    
    if (hasKuis && hasTugas && hasUjian) {
      const nilai = Math.round(
        (kuisAvg.total * KOMPONEN_BOBOT.kuis) +
        (tugasAvg.total * KOMPONEN_BOBOT.tugas) +
        (ujianAvg.total * KOMPONEN_BOBOT.ujian)
      );
      return { 
        nilai, 
        mode: 'Lengkap (Quiz+Tugas+Ujian)', 
        komponen: ['kuis', 'tugas', 'ujian'],
        isWeighted: true 
      };
    }
    return null;
  };
  
  const basicResult = calculateFinalScore();
  const weightedResult = calculateWeightedScore();
  const finalResult = weightedResult || basicResult;
  
  const getScoreColor = (score) => {
    if (score >= 85) return '#10b981';
    if (score >= 70) return '#3b82f6';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  const getDimensiColor = (nilai) => {
    if (nilai >= 85) return '#10b981';
    if (nilai >= 70) return '#3b82f6';
    if (nilai >= 50) return '#f59e0b';
    return '#ef4444';
  };
  
  const getScoreLabel = (score) => {
    if (score >= 85) return '🌟 Sangat Baik';
    if (score >= 70) return '👍 Baik';
    if (score >= 50) return '📘 Cukup';
    if (score >= 30) return '⚠️ Perlu Perhatian';
    return '🔴 Perlu Bimbingan';
  };
  
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: 20, border: '1px solid #e2e8f0' }}>
      <div 
        onClick={() => setShowDetail(!showDetail)} 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calculator size={20} color="#3b82f6" />
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>📊 Analisis Nilai 5 Dimensi</h3>
            <p style={{ margin: '2px 0 0', fontSize: 10, color: '#64748b' }}>
              {finalResult.mode} • Nilai: {finalResult.nilai}
            </p>
          </div>
        </div>
        <span style={{ fontSize: 11, color: '#64748b' }}>{showDetail ? '▲ Sembunyikan' : '▼ Lihat Detail'}</span>
      </div>
      
      {showDetail && (
        <div style={{ marginTop: 16 }}>
          {/* Aturan Penilaian */}
          <div style={{ 
            background: '#f0f9ff', 
            padding: 10, 
            borderRadius: 8, 
            marginBottom: 16,
            border: '1px solid #bae6fd',
            fontSize: 10,
            color: '#0369a1'
          }}>
            <b>📐 Aturan:</b> Ujian → Quiz+Tugas → Lengkap (Quiz 30% + Tugas 30% + Ujian 40%)
          </div>
          
          {/* Ringkasan per Komponen */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>📋 Rata-rata 5 Dimensi per Komponen</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {/* Kuis */}
              <div style={{ 
                background: kuisAvg ? '#eef2ff' : '#f1f5f9', 
                padding: 10, 
                borderRadius: 8,
                border: kuisAvg ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 18 }}>📝</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>Kuis (30%)</div>
                {kuisAvg ? (
                  <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(kuisAvg.total) }}>
                    {kuisAvg.total}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Belum ada</div>
                )}
              </div>
              
              {/* Tugas */}
              <div style={{ 
                background: tugasAvg ? '#dcfce7' : '#f1f5f9', 
                padding: 10, 
                borderRadius: 8,
                border: tugasAvg ? '2px solid #10b981' : '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 18 }}>📓</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>Tugas (30%)</div>
                {tugasAvg ? (
                  <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(tugasAvg.total) }}>
                    {tugasAvg.total}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Belum ada</div>
                )}
              </div>
              
              {/* Ujian */}
              <div style={{ 
                background: ujianAvg ? '#fef3c7' : '#f1f5f9', 
                padding: 10, 
                borderRadius: 8,
                border: ujianAvg ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 18 }}>📖</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b' }}>Ujian (40%)</div>
                {ujianAvg ? (
                  <div style={{ fontSize: 18, fontWeight: 800, color: getScoreColor(ujianAvg.total) }}>
                    {ujianAvg.total}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: '#94a3b8' }}>Belum ada</div>
                )}
              </div>
            </div>
          </div>
          
          {/* Detail 5 Dimensi (jika ada komponen yang terisi) */}
          {(kuisAvg || tugasAvg || ujianAvg) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 8 }}>🧠 Detail 5 Dimensi</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {DIMENSI_KEYS.map(key => {
                  // Ambil rata-rata dari komponen yang ada
                  let total = 0;
                  let count = 0;
                  if (kuisAvg) { total += kuisAvg[key]; count++; }
                  if (tugasAvg) { total += tugasAvg[key]; count++; }
                  if (ujianAvg) { total += ujianAvg[key]; count++; }
                  
                  const avgNilai = count > 0 ? Math.round((total / count) * 10) / 10 : 0;
                  const config = DIMENSI_CONFIG[key];
                  
                  return (
                    <div key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: 8, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0'
                    }}>
                      <span style={{ color: getDimensiColor(avgNilai) }}>{dimensiIcons[key]}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 600, color: '#1e293b' }}>{config.label}</div>
                        <div style={{ 
                          height: 4, borderRadius: 2, background: '#e2e8f0', marginTop: 4,
                          overflow: 'hidden'
                        }}>
                          <div style={{ 
                            height: '100%', width: `${avgNilai}%`, borderRadius: 2,
                            background: getDimensiColor(avgNilai),
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 13, color: getDimensiColor(avgNilai), minWidth: 30, textAlign: 'center' }}>
                        {avgNilai}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Hasil Akhir */}
          <div style={{ 
            background: '#f0fdf4', 
            padding: 16, 
            borderRadius: 12, 
            textAlign: 'center',
            border: `2px solid ${getScoreColor(finalResult.nilai)}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Award size={20} color={getScoreColor(finalResult.nilai)} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                {finalResult.mode}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: getScoreColor(finalResult.nilai), marginBottom: 4 }}>
              {finalResult.nilai}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(finalResult.nilai) }}>
              {getScoreLabel(finalResult.nilai)}
            </div>
            
            {/* Info komponen yang dipakai */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {finalResult.komponen.map(komp => (
                <span key={komp} style={{
                  fontSize: 9,
                  background: '#eef2ff',
                  color: '#3b82f6',
                  padding: '2px 8px',
                  borderRadius: 10
                }}>
                  {KOMPONEN_LABEL[komp]}
                </span>
              ))}
            </div>
            
            {weightedResult && (
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>
                *Lengkap: Quiz 30% + Tugas 30% + Ujian 40%
              </div>
            )}
            
            {onCalculate && (
              <button 
                onClick={() => onCalculate(finalResult.nilai)}
                style={{ 
                  marginTop: 12, 
                  background: '#10b981', 
                  color: 'white', 
                  border: 'none', 
                  padding: '8px 16px', 
                  borderRadius: 8, 
                  fontSize: 12, 
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  margin: '12px auto 0'
                }}
              >
                <TrendingUp size={14} /> Gunakan Nilai Ini
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightedScoreCalculator;