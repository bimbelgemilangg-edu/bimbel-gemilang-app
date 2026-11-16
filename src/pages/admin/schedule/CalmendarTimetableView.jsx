// src/pages/admin/schedule/CalmendarTimetableView.jsx
import React, { useState } from 'react';
import { Clock, MapPin, Users, Plus, Edit3, Trash2, Eye, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { timeToMinutes } from './jadwalConflictUtils';

const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_FULL = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00"
];

export default function CalmendarTimetableView({
  weekDates = [],
  selectedDate,
  onSelectDate,
  schedules = [],
  availableTeachers = [],
  isDarkMode = false,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
  onOpenPindahRuang,
  onDeleteSchedule
}) {
  const [hoveredCardId, setHoveredCardId] = useState(null);

  // Helper untuk mendapatkan foto guru
  const getTeacherPhoto = (item) => {
    if (item.teacherFotoUrl) return item.teacherFotoUrl;
    const t = availableTeachers.find(tch =>
      (item.teacherId && (tch.id === item.teacherId || tch.guruId === item.teacherId)) ||
      (item.teacherName && tch.nama && tch.nama.toLowerCase() === item.teacherName.toLowerCase())
    );
    return t?.fotoUrl || null;
  };

  // Helper warna kartu sesuai jenjang / program
  const getCardStyle = (item) => {
    const level = (item.level || '').toUpperCase();
    const prog = (item.program || '').toUpperCase();

    if (prog.includes('ENGLISH') || level.includes('ENGLISH')) {
      return {
        bg: isDarkMode ? 'rgba(6, 182, 212, 0.18)' : '#ecfeff',
        border: isDarkMode ? '#06b6d4' : '#67e8f9',
        text: isDarkMode ? '#67e8f9' : '#0e7490',
        badgeBg: isDarkMode ? 'rgba(6, 182, 212, 0.3)' : '#cffafe'
      };
    }
    if (level.includes('SMA')) {
      return {
        bg: isDarkMode ? 'rgba(139, 92, 246, 0.18)' : '#f5f3ff',
        border: isDarkMode ? '#8b5cf6' : '#c4b5fd',
        text: isDarkMode ? '#c4b5fd' : '#6d28d9',
        badgeBg: isDarkMode ? 'rgba(139, 92, 246, 0.3)' : '#ede9fe'
      };
    }
    if (level.includes('SMP')) {
      return {
        bg: isDarkMode ? 'rgba(59, 130, 246, 0.18)' : '#eff6ff',
        border: isDarkMode ? '#3b82f6' : '#93c5fd',
        text: isDarkMode ? '#93c5fd' : '#1d4ed8',
        badgeBg: isDarkMode ? 'rgba(59, 130, 246, 0.3)' : '#dbeafe'
      };
    }
    // Default SD / Reguler
    return {
      bg: isDarkMode ? 'rgba(16, 185, 129, 0.18)' : '#f0fdf4',
      border: isDarkMode ? '#10b981' : '#86efac',
      text: isDarkMode ? '#6ee7b7' : '#15803d',
      badgeBg: isDarkMode ? 'rgba(16, 185, 129, 0.3)' : '#dcfce7'
    };
  };

  const selectedDateStr = selectedDate ? (
    typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0]
  ) : '';

  return (
    <div style={{
      ...styles.container,
      background: isDarkMode ? '#0f172a' : '#ffffff',
      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
      color: isDarkMode ? '#f8fafc' : '#0f172a'
    }}>
      {/* Header Baris Hari (Senin - Minggu) */}
      <div style={{
        ...styles.daysHeaderRow,
        borderBottomColor: isDarkMode ? '#1e293b' : '#e2e8f0',
        background: isDarkMode ? '#131d31' : '#f8fafc'
      }}>
        {/* Kolom Waktu Kosong */}
        <div style={styles.timeHeaderCell}>
          <span style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#64748b' : '#94a3b8' }}>
            JAM WIB
          </span>
        </div>

        {/* 7 Kolom Hari */}
        {weekDates.map(dateStr => {
          const d = new Date(dateStr);
          const dayName = DAYS_SHORT[d.getDay()];
          const isSelected = dateStr === selectedDateStr;
          const isToday = dateStr === new Date().toISOString().split('T')[0];

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate && onSelectDate(new Date(dateStr))}
              style={{
                ...styles.dayHeaderCell,
                background: isSelected 
                  ? (isDarkMode ? '#ffffff' : '#4f46e5') 
                  : 'transparent',
                color: isSelected 
                  ? (isDarkMode ? '#0f172a' : '#ffffff') 
                  : (isDarkMode ? '#cbd5e1' : '#475569'),
                boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.15)' : 'none'
              }}
            >
              <div style={styles.dayHeaderName}>{dayName}</div>
              <div style={{
                ...styles.dayHeaderNumber,
                fontWeight: isSelected ? 800 : 600
              }}>
                {d.getDate()}
              </div>
              {isToday && !isSelected && (
                <div style={styles.todayDot} />
              )}
            </div>
          );
        })}
      </div>

      {/* Grid Timetable: Baris Jam x Kolom Hari */}
      <div style={styles.timetableScrollBody}>
        {TIME_SLOTS.map((slotTime, slotIdx) => {
          const slotHour = parseInt(slotTime.split(':')[0], 10);

          return (
            <div
              key={slotTime}
              style={{
                ...styles.timetableRow,
                borderBottomColor: isDarkMode ? 'rgba(51, 65, 85, 0.4)' : '#f1f5f9'
              }}
            >
              {/* Kolom Jam di Kiri */}
              <div style={{
                ...styles.timeSlotCell,
                color: isDarkMode ? '#64748b' : '#94a3b8'
              }}>
                <span>{slotTime}</span>
              </div>

              {/* 7 Sel Hari untuk Jam Ini */}
              {weekDates.map(dateStr => {
                // Cari jadwal yang mulai atau berada di rentang jam slot ini
                const matchingSchedules = schedules.filter(s => {
                  if (s.dateStr !== dateStr) return false;
                  if (s.status === 'cancelled') return false;
                  if (!s.start) return false;
                  const startHour = parseInt(s.start.split(':')[0], 10);
                  return startHour === slotHour;
                });

                return (
                  <div
                    key={dateStr}
                    style={{
                      ...styles.daySlotCell,
                      borderLeftColor: isDarkMode ? 'rgba(51, 65, 85, 0.35)' : '#f1f5f9'
                    }}
                  >
                    {matchingSchedules.map(item => {
                      const colorTheme = getCardStyle(item);
                      const photo = getTeacherPhoto(item);
                      const isHovered = hoveredCardId === item.id;

                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredCardId(item.id)}
                          onMouseLeave={() => setHoveredCardId(null)}
                          onClick={() => onOpenDetailModal && onOpenDetailModal(item)}
                          style={{
                            ...styles.sessionCard,
                            background: colorTheme.bg,
                            borderLeft: `4px solid ${colorTheme.border}`,
                            borderColor: colorTheme.border,
                            boxShadow: isHovered 
                              ? '0 6px 16px rgba(0,0,0,0.18)' 
                              : '0 1px 4px rgba(0,0,0,0.04)',
                            transform: isHovered ? 'translateY(-2px)' : 'none'
                          }}
                        >
                          {/* Top: Waktu & Ruangan */}
                          <div style={styles.cardTopRow}>
                            <span style={{
                              ...styles.timeBadge,
                              background: colorTheme.badgeBg,
                              color: colorTheme.text
                            }}>
                              {item.start} - {item.end}
                            </span>
                            <span style={{
                              ...styles.planetBadge,
                              background: isDarkMode ? '#1e293b' : '#ffffff',
                              color: isDarkMode ? '#94a3b8' : '#475569'
                            }}>
                              🪐 {item.planet}
                            </span>
                          </div>

                          {/* Judul Mapel */}
                          <div style={{
                            ...styles.cardTitle,
                            color: isDarkMode ? '#f8fafc' : '#0f172a'
                          }}>
                            {item.title || item.mapelName || 'Sesi Belajar'}
                          </div>

                          {/* Foto Guru & Nama Tentor */}
                          <div style={styles.teacherRow}>
                            {photo ? (
                              <img
                                src={photo}
                                alt={item.teacherName}
                                style={styles.teacherImg}
                              />
                            ) : (
                              <div style={{
                                ...styles.teacherAvatarFallback,
                                background: colorTheme.border
                              }}>
                                {item.teacherName?.charAt(0) || 'G'}
                              </div>
                            )}
                            <span style={{
                              ...styles.teacherName,
                              color: isDarkMode ? '#cbd5e1' : '#475569'
                            }}>
                              {item.teacherName || item.booker || '-'}
                            </span>
                          </div>

                          {/* Peserta Siswa Bubble Stack */}
                          <div style={styles.studentsRow}>
                            <span style={{
                              ...styles.studentCount,
                              color: isDarkMode ? '#94a3b8' : '#64748b'
                            }}>
                              👥 {item.students?.length || 0} murid
                            </span>
                            {item.isDraft && (
                              <span style={styles.draftBadge}>🧪 Draft</span>
                            )}
                          </div>

                          {/* Quick Action saat di-hover */}
                          {isHovered && (
                            <div style={styles.cardHoverActions} onClick={e => e.stopPropagation()}>
                              <button
                                type="button"
                                onClick={() => onOpenPindahRuang && onOpenPindahRuang(item)}
                                title="Pindah Ruangan Cepat"
                                style={styles.btnQuickAction}
                              >
                                🔄 Ruang
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenEditModal && onOpenEditModal(item.planet, true, item)}
                                title="Edit Sesi"
                                style={styles.btnQuickAction}
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  container: {
    borderRadius: 20,
    border: '1px solid',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column'
  },
  daysHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '70px repeat(7, 1fr)',
    borderBottom: '1px solid',
    padding: '10px 6px',
    alignItems: 'center'
  },
  timeHeaderCell: {
    textAlign: 'center',
    padding: '4px'
  },
  dayHeaderCell: {
    textAlign: 'center',
    padding: '8px 4px',
    borderRadius: 14,
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
    margin: '0 3px'
  },
  dayHeaderName: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  dayHeaderNumber: {
    fontSize: 16,
    marginTop: 2
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#10b981',
    margin: '4px auto 0'
  },
  timetableScrollBody: {
    overflowY: 'auto',
    maxHeight: '680px'
  },
  timetableRow: {
    display: 'grid',
    gridTemplateColumns: '70px repeat(7, 1fr)',
    borderBottom: '1px solid',
    minHeight: '85px'
  },
  timeSlotCell: {
    padding: '12px 6px',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.3px'
  },
  daySlotCell: {
    borderLeft: '1px solid',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  sessionCard: {
    borderRadius: 12,
    border: '1px solid',
    padding: '8px 10px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    position: 'relative'
  },
  cardTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4
  },
  timeBadge: {
    fontSize: 9.5,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 6
  },
  planetBadge: {
    fontSize: 9.5,
    fontWeight: 700,
    padding: '1px 5px',
    borderRadius: 5,
    border: '1px solid rgba(0,0,0,0.06)'
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 800,
    lineHeight: 1.3,
    marginTop: 2
  },
  teacherRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 2
  },
  teacherImg: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #818cf8',
    flexShrink: 0
  },
  teacherAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 800,
    flexShrink: 0
  },
  teacherName: {
    fontSize: 10.5,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  studentsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2
  },
  studentCount: {
    fontSize: 10,
    fontWeight: 600
  },
  draftBadge: {
    fontSize: 9,
    fontWeight: 800,
    padding: '1px 5px',
    borderRadius: 4,
    background: '#fef3c7',
    color: '#b45309'
  },
  cardHoverActions: {
    display: 'flex',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTop: '1px dashed rgba(0,0,0,0.1)'
  },
  btnQuickAction: {
    flex: 1,
    padding: '3px 6px',
    borderRadius: 6,
    border: 'none',
    background: '#ffffff',
    color: '#334155',
    fontSize: 9.5,
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }
};
