// src/pages/admin/schedule/CalmendarTimetableView.jsx
import React, { useState } from 'react';
import { 
  Clock, MapPin, Users, Plus, Edit3, Trash2, Eye, 
  ChevronLeft, ChevronRight, Calendar, Shuffle, CheckCircle2,
  Sparkles, Coffee, ExternalLink, X
} from 'lucide-react';
import { timeToMinutes } from './jadwalConflictUtils';

const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00", 
  "13:00", "14:00", "15:00", "16:00", "17:00", 
  "18:00", "19:00", "20:00"
];

const PLANET_META = {
  MERKURIUS: { icon: '🪐', color: '#6366f1', label: 'Ruang Merkurius', subtitle: 'Lab & Kelas Utama' },
  VENUS:     { icon: '🪐', color: '#06b6d4', label: 'Ruang Venus',     subtitle: 'English & Multimedia' },
  BUMI:      { icon: '🪐', color: '#10b981', label: 'Ruang Bumi',      subtitle: 'Kelas Reguler 1' },
  MARS:      { icon: '🪐', color: '#f43f5e', label: 'Ruang Mars',      subtitle: 'Kelas Reguler 2' },
  JUPITER:   { icon: '🪐', color: '#f59e0b', label: 'Ruang Jupiter',   subtitle: 'Auditorium / Sesi Besar' },
};

export default function CalmendarTimetableView({
  selectedDate = new Date(),
  onSelectDate,
  schedules = [],
  availableTeachers = [],
  isDarkMode = true,
  onOpenAddModal,
  onOpenEditModal,
  onOpenDetailModal,
  onOpenPindahRuang,
  onDeleteSchedule
}) {
  const [hoveredCardId, setHoveredCardId] = useState(null);
  const [activePopupSession, setActivePopupSession] = useState(null);

  // Helper tanggal
  const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
  const selectedDateStr = dateObj.toISOString().split('T')[0];

  const fullDateLabel = dateObj.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const monthYearLabel = dateObj.toLocaleDateString('id-ID', {
    month: 'long',
    year: 'numeric'
  });

  // Navigasi tanggal harian
  const handleShiftDay = (diffDays) => {
    const next = new Date(dateObj);
    next.setDate(next.getDate() + diffDays);
    if (onSelectDate) onSelectDate(next);
  };

  const handleSetToday = () => {
    if (onSelectDate) onSelectDate(new Date());
  };

  // Helper foto guru
  const getTeacherPhoto = (item) => {
    if (item.teacherFotoUrl) return item.teacherFotoUrl;
    const t = availableTeachers.find(tch =>
      (item.teacherId && (tch.id === item.teacherId || tch.guruId === item.teacherId)) ||
      (item.teacherName && tch.nama && tch.nama.toLowerCase() === item.teacherName.toLowerCase())
    );
    return t?.fotoUrl || null;
  };

  // 🔥 WARNA SESUAI JENJANG (Persis Instruksi User: "Setiap jenjang punya warna yang berbeda")
  const getJenjangTheme = (item) => {
    const level = (item.level || '').toUpperCase();
    const prog = (item.program || '').toUpperCase();
    const title = (item.title || item.mapelName || '').toUpperCase();

    // 1. English Course (Cyan / Biru Muda)
    if (prog.includes('ENGLISH') || level.includes('ENGLISH') || title.includes('ENGLISH')) {
      return {
        jenjangLabel: 'English Course',
        bg: isDarkMode ? '#083344' : '#ecfeff',
        cardBorder: isDarkMode ? '#06b6d4' : '#67e8f9',
        borderAccent: '#06b6d4',
        titleColor: isDarkMode ? '#e0f2fe' : '#0e7490',
        textColor: isDarkMode ? '#67e8f9' : '#0e7490',
        badgeBg: isDarkMode ? 'rgba(6, 182, 212, 0.35)' : '#cffafe',
        badgeColor: isDarkMode ? '#a5f3fc' : '#0891b2',
        dotColor: '#06b6d4'
      };
    }

    // 2. SMA (Ungu / Violet)
    if (level.includes('SMA') || title.includes('SMA') || title.includes('10 SMA') || title.includes('11 SMA') || title.includes('12 SMA')) {
      return {
        jenjangLabel: 'SMA',
        bg: isDarkMode ? '#2e1065' : '#f5f3ff',
        cardBorder: isDarkMode ? '#8b5cf6' : '#c4b5fd',
        borderAccent: '#8b5cf6',
        titleColor: isDarkMode ? '#ede9fe' : '#5b21b6',
        textColor: isDarkMode ? '#c4b5fd' : '#6d28d9',
        badgeBg: isDarkMode ? 'rgba(139, 92, 246, 0.35)' : '#ede9fe',
        badgeColor: isDarkMode ? '#ddd6fe' : '#6d28d9',
        dotColor: '#8b5cf6'
      };
    }

    // 3. SMP (Biru Royal / Navy)
    if (level.includes('SMP') || title.includes('SMP') || title.includes('7 SMP') || title.includes('8 SMP') || title.includes('9 SMP') || title.includes('9A')) {
      return {
        jenjangLabel: 'SMP',
        bg: isDarkMode ? '#172554' : '#eff6ff',
        cardBorder: isDarkMode ? '#3b82f6' : '#93c5fd',
        borderAccent: '#3b82f6',
        titleColor: isDarkMode ? '#dbeafe' : '#1e40af',
        textColor: isDarkMode ? '#93c5fd' : '#1d4ed8',
        badgeBg: isDarkMode ? 'rgba(59, 130, 246, 0.35)' : '#dbeafe',
        badgeColor: isDarkMode ? '#bfdbfe' : '#1d4ed8',
        dotColor: '#3b82f6'
      };
    }

    // 4. Privat (Oranye / Amber)
    if (prog.includes('PRIVAT') || title.includes('PRIVATE') || title.includes('PRIVAT')) {
      return {
        jenjangLabel: 'Privat',
        bg: isDarkMode ? '#451a03' : '#fffbeb',
        cardBorder: isDarkMode ? '#f59e0b' : '#fde68a',
        borderAccent: '#f59e0b',
        titleColor: isDarkMode ? '#fef3c7' : '#92400e',
        textColor: isDarkMode ? '#fde68a' : '#b45309',
        badgeBg: isDarkMode ? 'rgba(245, 158, 11, 0.35)' : '#fef3c7',
        badgeColor: isDarkMode ? '#fde68a' : '#b45309',
        dotColor: '#f59e0b'
      };
    }

    // 5. SD (Hijau Emerald / Fresh) - Default
    return {
      jenjangLabel: 'SD',
      bg: isDarkMode ? '#064e3b' : '#f0fdf4',
      cardBorder: isDarkMode ? '#10b981' : '#86efac',
      borderAccent: '#10b981',
      titleColor: isDarkMode ? '#d1fae5' : '#065f46',
      textColor: isDarkMode ? '#6ee7b7' : '#15803d',
      badgeBg: isDarkMode ? 'rgba(16, 185, 129, 0.35)' : '#dcfce7',
      badgeColor: isDarkMode ? '#a7f3d0' : '#15803d',
      dotColor: '#10b981'
    };
  };

  // Filter jadwal aktif pada tanggal yang dipilih
  const daySchedules = schedules.filter(s => s.dateStr === selectedDateStr && s.status !== 'cancelled');

  return (
    <div style={{
      ...styles.calmendarContainer,
      background: isDarkMode ? '#0d131f' : '#ffffff',
      borderColor: isDarkMode ? '#1e293b' : '#e2e8f0',
      color: isDarkMode ? '#f8fafc' : '#0f172a'
    }}>
      
      {/* ============================================================ */}
      {/* TOP HEADER: Tanggal Terpilih & Navigasi Hari (Mirip Calmendar) */}
      {/* ============================================================ */}
      <div style={{
        ...styles.topBar,
        background: isDarkMode ? '#131b2e' : '#f8fafc',
        borderBottomColor: isDarkMode ? '#1e293b' : '#e2e8f0'
      }}>
        {/* Tanggal & Hari Terpilih */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={styles.monthSubtitle}>{monthYearLabel.toUpperCase()}</div>
            <h2 style={{
              ...styles.mainDateTitle,
              color: isDarkMode ? '#f8fafc' : '#0f172a'
            }}>
              {fullDateLabel}
            </h2>
          </div>

          {/* Tombol Geser Hari */}
          <div style={styles.navDayButtons}>
            <button 
              type="button" 
              onClick={() => handleShiftDay(-1)} 
              style={{
                ...styles.btnNavDay,
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#cbd5e1' : '#475569',
                borderColor: isDarkMode ? '#334155' : '#cbd5e1'
              }}
              title="Hari Sebelumnya"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              type="button" 
              onClick={handleSetToday} 
              style={{
                ...styles.btnToday,
                background: isDarkMode ? '#334155' : '#e2e8f0',
                color: isDarkMode ? '#f8fafc' : '#334155'
              }}
            >
              Hari Ini
            </button>
            <button 
              type="button" 
              onClick={() => handleShiftDay(1)} 
              style={{
                ...styles.btnNavDay,
                background: isDarkMode ? '#1e293b' : '#ffffff',
                color: isDarkMode ? '#cbd5e1' : '#475569',
                borderColor: isDarkMode ? '#334155' : '#cbd5e1'
              }}
              title="Hari Berikutnya"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Legend Warna Jenjang (Sesuai Instruksi User) */}
        <div style={styles.jenjangLegendBar}>
          <div style={styles.legendPill}>
            <div style={{...styles.legendCircle, background: '#10b981'}} />
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>SD (Hijau)</span>
          </div>
          <div style={styles.legendPill}>
            <div style={{...styles.legendCircle, background: '#3b82f6'}} />
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>SMP (Biru)</span>
          </div>
          <div style={styles.legendPill}>
            <div style={{...styles.legendCircle, background: '#8b5cf6'}} />
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>SMA (Ungu)</span>
          </div>
          <div style={styles.legendPill}>
            <div style={{...styles.legendCircle, background: '#06b6d4'}} />
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>EC (Cyan)</span>
          </div>
          <div style={styles.legendPill}>
            <div style={{...styles.legendCircle, background: '#f59e0b'}} />
            <span style={{ color: isDarkMode ? '#94a3b8' : '#64748b' }}>Privat</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5 KOLOM RUANGAN (MERKURIUS, VENUS, BUMI, MARS, JUPITER)      */}
      {/* ============================================================ */}
      <div style={{
        ...styles.roomsHeaderRow,
        background: isDarkMode ? '#0f172a' : '#f1f5f9',
        borderBottomColor: isDarkMode ? '#1e293b' : '#cbd5e1'
      }}>
        {/* Kolom Jam di Kiri */}
        <div style={styles.timeHeaderCol}>
          <span style={{ fontSize: 11, fontWeight: 800, color: isDarkMode ? '#64748b' : '#94a3b8' }}>
            JAM WIB
          </span>
        </div>

        {/* 5 Kolom Ruangan Planet */}
        {PLANETS.map(planet => {
          const meta = PLANET_META[planet];
          const roomCount = daySchedules.filter(s => s.planet === planet).length;

          return (
            <div
              key={planet}
              style={{
                ...styles.roomHeaderCol,
                borderLeftColor: isDarkMode ? '#1e293b' : '#e2e8f0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ fontSize: 15 }}>{meta.icon}</span>
                <span style={{
                  ...styles.roomNameText,
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }}>
                  {planet}
                </span>
                <span style={{
                  ...styles.roomSessionBadge,
                  background: isDarkMode ? '#1e293b' : '#ffffff',
                  color: isDarkMode ? '#94a3b8' : '#475569'
                }}>
                  {roomCount} Sesi
                </span>
              </div>
              <div style={styles.roomSubtitleText}>{meta.subtitle}</div>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* GRID TIMETABLE: Jam (Y) x 5 Ruangan Planet (X)               */}
      {/* ============================================================ */}
      <div style={styles.timetableScrollArea}>
        {TIME_SLOTS.map((slotTime) => {
          const slotHour = parseInt(slotTime.split(':')[0], 10);

          return (
            <div
              key={slotTime}
              style={{
                ...styles.timetableHourRow,
                borderBottomColor: isDarkMode ? 'rgba(30, 41, 59, 0.6)' : '#f1f5f9'
              }}
            >
              {/* Kolom Label Jam */}
              <div style={{
                ...styles.hourLabelCell,
                color: isDarkMode ? '#64748b' : '#94a3b8'
              }}>
                <span>{slotTime}</span>
              </div>

              {/* 5 Sel Ruangan untuk Jam Ini */}
              {PLANETS.map(planet => {
                // Cari jadwal yang berada di ruangan ini dan mulai pada jam slot ini
                const matchingSessions = daySchedules.filter(s => {
                  if (s.planet !== planet) return false;
                  if (!s.start) return false;
                  const startHour = parseInt(s.start.split(':')[0], 10);
                  return startHour === slotHour;
                });

                return (
                  <div
                    key={planet}
                    style={{
                      ...styles.roomSlotCell,
                      borderLeftColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : '#f1f5f9'
                    }}
                  >
                    {matchingSessions.length === 0 ? (
                      /* Slot Kosong: Tombol Tambah Sesi Cepat saat di-hover */
                      <div 
                        onClick={() => onOpenAddModal && onOpenAddModal(planet, false, null)}
                        style={styles.emptySlotHover}
                        title={`Klik untuk jadwalkan kelas di Ruang ${planet} jam ${slotTime}`}
                      >
                        <Plus size={13} color={isDarkMode ? '#334155' : '#cbd5e1'} />
                      </div>
                    ) : (
                      matchingSessions.map(item => {
                        const theme = getJenjangTheme(item);
                        const photo = getTeacherPhoto(item);
                        const isHovered = hoveredCardId === item.id;

                        return (
                          <div
                            key={item.id}
                            onMouseEnter={() => setHoveredCardId(item.id)}
                            onMouseLeave={() => setHoveredCardId(null)}
                            onClick={() => setActivePopupSession(item)}
                            style={{
                              ...styles.calmCard,
                              background: theme.bg,
                              borderColor: theme.cardBorder,
                              borderLeft: `4px solid ${theme.borderAccent}`,
                              boxShadow: isHovered 
                                ? '0 8px 24px rgba(0,0,0,0.3)' 
                                : '0 2px 8px rgba(0,0,0,0.08)',
                              transform: isHovered ? 'translateY(-2px)' : 'none'
                            }}
                          >
                            {/* Baris Atas: Jam & Badge Jenjang */}
                            <div style={styles.cardHeaderRow}>
                              <span style={{
                                ...styles.cardTimeTag,
                                background: theme.badgeBg,
                                color: theme.textColor
                              }}>
                                ⏰ {item.start} - {item.end}
                              </span>

                              <span style={{
                                ...styles.cardJenjangBadge,
                                background: theme.badgeBg,
                                color: theme.badgeColor
                              }}>
                                {theme.jenjangLabel}
                              </span>
                            </div>

                            {/* Judul Mapel & Kelas */}
                            <div style={{
                              ...styles.cardMapelTitle,
                              color: theme.titleColor
                            }}>
                              {item.title || item.mapelName || 'Sesi Belajar'}
                            </div>

                            {/* Foto Profil Asli Guru & Nama Guru */}
                            <div style={styles.cardTeacherRow}>
                              {photo ? (
                                <img
                                  src={photo}
                                  alt={item.teacherName}
                                  style={{
                                    ...styles.teacherPhotoCircle,
                                    borderColor: theme.borderAccent
                                  }}
                                />
                              ) : (
                                <div style={{
                                  ...styles.teacherInitialCircle,
                                  background: theme.borderAccent
                                }}>
                                  {(item.teacherName || 'G').charAt(0)}
                                </div>
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{
                                  ...styles.teacherNameText,
                                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                                }}>
                                  {item.teacherName || item.booker || '-'}
                                </div>
                                <div style={{ fontSize: 10, color: theme.textColor }}>
                                  {item.students?.length || 0} Siswa Terdaftar
                                </div>
                              </div>
                            </div>

                            {/* Student Bubble Avatars (Gaya Calmendar) */}
                            {item.students && item.students.length > 0 && (
                              <div style={styles.studentBubbleRow}>
                                {item.students.slice(0, 3).map((st, i) => (
                                  <span key={i} style={styles.studentMiniPill}>
                                    {st.nama?.split(' ')[0] || st}
                                  </span>
                                ))}
                                {item.students.length > 3 && (
                                  <span style={styles.studentMoreCount}>
                                    +{item.students.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Tombol Aksi Cepat saat Hover */}
                            {isHovered && (
                              <div style={styles.cardHoverButtons} onClick={e => e.stopPropagation()}>
                                <button
                                  type="button"
                                  onClick={() => onOpenPindahRuang && onOpenPindahRuang(item)}
                                  style={styles.btnCardAction}
                                  title="Pindah Ruang Cepat"
                                >
                                  🔄 Pindah
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenEditModal && onOpenEditModal(planet, true, item)}
                                  style={styles.btnCardAction}
                                  title="Edit Sesi"
                                >
                                  ✏️ Edit
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* POPUP CARD INTERAKTIF (Persis Desain Popover Calmendar)      */}
      {/* ============================================================ */}
      {activePopupSession && (
        <div style={styles.popupOverlay} onClick={() => setActivePopupSession(null)}>
          <div 
            style={{
              ...styles.calmendarPopupCard,
              background: isDarkMode ? '#1e293b' : '#ffffff',
              color: isDarkMode ? '#f8fafc' : '#0f172a',
              borderColor: isDarkMode ? '#334155' : '#e2e8f0'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header Popup */}
            <div style={styles.popupHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>🪐</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>
                    {activePopupSession.title || activePopupSession.mapelName || 'Sesi Belajar'}
                  </h3>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>
                    Ruang {activePopupSession.planet} · {activePopupSession.program}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setActivePopupSession(null)} 
                style={styles.btnPopupClose}
              >
                <X size={16} />
              </button>
            </div>

            {/* Waktu & Tanggal */}
            <div style={styles.popupRow}>
              <Calendar size={15} color="#6366f1" />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>{fullDateLabel}</span>
            </div>
            <div style={styles.popupRow}>
              <Clock size={15} color="#6366f1" />
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                {activePopupSession.start} - {activePopupSession.end} WIB
              </span>
            </div>

            {/* Tentor */}
            <div style={{
              ...styles.popupTeacherBox,
              background: isDarkMode ? '#0f172a' : '#f8fafc',
              borderColor: isDarkMode ? '#334155' : '#e2e8f0'
            }}>
              {getTeacherPhoto(activePopupSession) ? (
                <img 
                  src={getTeacherPhoto(activePopupSession)} 
                  alt={activePopupSession.teacherName} 
                  style={styles.popupTeacherImg} 
                />
              ) : (
                <div style={styles.popupTeacherFallback}>
                  {(activePopupSession.teacherName || 'G').charAt(0)}
                </div>
              )}
              <div>
                <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>
                  Tentor Pengampu:
                </div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>
                  {activePopupSession.teacherName || activePopupSession.booker || '-'}
                </div>
                <div style={{ fontSize: 10.5, color: '#6366f1', fontWeight: 600 }}>
                  ID: {activePopupSession.teacherId || '-'}
                </div>
              </div>
            </div>

            {/* Murid Terdaftar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', marginBottom: 6 }}>
                👥 Siswa Hadir ({activePopupSession.students?.length || 0}):
              </div>
              <div style={styles.popupStudentGrid}>
                {(activePopupSession.students || []).map((s, i) => (
                  <div key={i} style={{
                    ...styles.popupStudentItem,
                    background: isDarkMode ? '#0f172a' : '#f1f5f9'
                  }}>
                    <span>{s.nama || s}</span>
                    <span style={{ fontSize: 9.5, color: '#94a3b8' }}>
                      {s.kelasSekolah || s.kelas || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Tombol Tindakan Cepat */}
            <div style={styles.popupActionRow}>
              <button
                type="button"
                onClick={() => {
                  onOpenPindahRuang && onOpenPindahRuang(activePopupSession);
                  setActivePopupSession(null);
                }}
                style={styles.btnPopupPindah}
              >
                <Shuffle size={14} /> Pindah Ruangan Cepat
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenEditModal && onOpenEditModal(activePopupSession.planet, true, activePopupSession);
                  setActivePopupSession(null);
                }}
                style={styles.btnPopupEdit}
              >
                <Edit3 size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const styles = {
  calmendarContainer: {
    borderRadius: 20,
    border: '1px solid',
    overflow: 'hidden',
    boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column'
  },
  topBar: {
    padding: '14px 20px',
    borderBottom: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12
  },
  monthSubtitle: {
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: '0.8px',
    color: '#6366f1'
  },
  mainDateTitle: {
    margin: '2px 0 0',
    fontSize: 18,
    fontWeight: 900
  },
  navDayButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  btnNavDay: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: '0.15s ease'
  },
  btnToday: {
    padding: '6px 12px',
    borderRadius: 8,
    border: 'none',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer'
  },
  jenjangLegendBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap'
  },
  legendPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 600
  },
  legendCircle: {
    width: 8,
    height: 8,
    borderRadius: '50%'
  },
  roomsHeaderRow: {
    display: 'grid',
    gridTemplateColumns: '70px repeat(5, 1fr)',
    borderBottom: '2px solid',
    padding: '8px 4px',
    alignItems: 'center'
  },
  timeHeaderCol: {
    textAlign: 'center',
    padding: '6px'
  },
  roomHeaderCol: {
    borderLeft: '1px solid',
    textAlign: 'center',
    padding: '8px 4px'
  },
  roomNameText: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '0.4px'
  },
  roomSessionBadge: {
    fontSize: 9.5,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 6,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
  },
  roomSubtitleText: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2
  },
  timetableScrollArea: {
    maxHeight: '680px',
    overflowY: 'auto'
  },
  timetableHourRow: {
    display: 'grid',
    gridTemplateColumns: '70px repeat(5, 1fr)',
    borderBottom: '1px solid',
    minHeight: '88px'
  },
  hourLabelCell: {
    padding: '12px 6px',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.3px'
  },
  roomSlotCell: {
    borderLeft: '1px solid',
    padding: '6px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative'
  },
  emptySlotHover: {
    height: '100%',
    minHeight: '74px',
    borderRadius: 10,
    border: '1px dashed transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    opacity: 0,
    transition: 'opacity 0.15s ease',
    ':hover': { opacity: 1, border: '1px dashed #6366f1' }
  },
  calmCard: {
    borderRadius: 14,
    border: '1px solid',
    padding: '8px 10px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    position: 'relative'
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4
  },
  cardTimeTag: {
    fontSize: 9.5,
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: 6
  },
  cardJenjangBadge: {
    fontSize: 9,
    fontWeight: 800,
    padding: '1px 6px',
    borderRadius: 5,
    textTransform: 'uppercase'
  },
  cardMapelTitle: {
    fontSize: 12.5,
    fontWeight: 900,
    lineHeight: 1.3,
    marginTop: 2
  },
  cardTeacherRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    marginTop: 2
  },
  teacherPhotoCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid',
    flexShrink: 0
  },
  teacherInitialCircle: {
    width: 24,
    height: 24,
    borderRadius: '50%',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10.5,
    fontWeight: 900,
    flexShrink: 0
  },
  teacherNameText: {
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  studentBubbleRow: {
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 3
  },
  studentMiniPill: {
    fontSize: 9,
    padding: '1px 5px',
    borderRadius: 4,
    background: 'rgba(0,0,0,0.06)',
    fontWeight: 600
  },
  studentMoreCount: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: 700
  },
  cardHoverButtons: {
    display: 'flex',
    gap: 4,
    marginTop: 4,
    paddingTop: 4,
    borderTop: '1px dashed rgba(0,0,0,0.1)'
  },
  btnCardAction: {
    flex: 1,
    padding: '3px 6px',
    borderRadius: 6,
    background: '#ffffff',
    color: '#0f172a',
    border: 'none',
    fontSize: 9.5,
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },

  // POPOVER STYLES
  popupOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: 16
  },
  calmendarPopupCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    border: '1px solid',
    padding: 22,
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10
  },
  popupHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  btnPopupClose: {
    background: '#f1f5f9',
    border: 'none',
    borderRadius: 8,
    width: 28,
    height: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#64748b'
  },
  popupRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#64748b'
  },
  popupTeacherBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    border: '1px solid',
    marginTop: 4
  },
  popupTeacherImg: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #6366f1'
  },
  popupTeacherFallback: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 900
  },
  popupStudentGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    maxHeight: 120,
    overflowY: 'auto'
  },
  popupStudentItem: {
    padding: '4px 8px',
    borderRadius: 6,
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    fontWeight: 600
  },
  popupActionRow: {
    display: 'flex',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1px solid rgba(0,0,0,0.06)'
  },
  btnPopupPindah: {
    flex: 2,
    padding: '9px 12px',
    borderRadius: 10,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  btnPopupEdit: {
    flex: 1,
    padding: '9px 12px',
    borderRadius: 10,
    background: '#f1f5f9',
    color: '#334155',
    border: 'none',
    fontSize: 11.5,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  }
};
