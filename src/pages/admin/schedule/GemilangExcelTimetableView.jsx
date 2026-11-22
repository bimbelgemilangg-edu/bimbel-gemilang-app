// src/pages/admin/schedule/GemilangExcelTimetableView.jsx
import React, { useState } from 'react';
import { 
  Users, Clock, MapPin, Shuffle, Edit3, Eye, Plus, 
  CheckCircle2, Sparkles, BookOpen, AlertCircle, UserCheck
} from 'lucide-react';

const DAYS_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function GemilangExcelTimetableView({
  schedules = [],
  availableTeachers = [],
  weekDates = [],
  isDarkMode = false,
  onOpenModal,
  onOpenDetailModal,
  onOpenPindahRuang,
  onDeleteSchedule
}) {
  const [subView, setSubView] = useState('per_kelas'); // 'per_kelas' | 'per_tentor'

  // Helper foto tentor
  const getTeacherPhoto = (item) => {
    if (item.teacherFotoUrl) return item.teacherFotoUrl;
    const t = availableTeachers.find(tch =>
      (item.teacherId && (tch.id === item.teacherId || tch.guruId === item.teacherId)) ||
      (item.teacherName && tch.nama && tch.nama.toLowerCase() === item.teacherName.toLowerCase())
    );
    return t?.fotoUrl || null;
  };

  // Deteksi kategori kelas sesuai struktur Excel Bimbel Gemilang
  const detectClassCategory = (item) => {
    const text = `${item.title || ''} ${item.mapelName || ''} ${item.level || ''} ${(item.students || []).map(s => s.kelasSekolah || '').join(' ')}`.toUpperCase();

    if (item.program === 'English Course' || text.includes('ENGLISH COURSE') || text.includes('ENGLISH')) {
      return 'ENGLISH_COURSE';
    }
    if (text.includes('3 SD') || text.includes('KELAS 3') || text.includes('K3')) return 'SD_3';
    if (text.includes('4 SD') || text.includes('KELAS 4') || text.includes('K4')) return 'SD_4';
    if (text.includes('5 SD') || text.includes('KELAS 5') || text.includes('K5')) return 'SD_5';
    if (text.includes('6 SD') || text.includes('KELAS 6') || text.includes('K6')) return 'SD_6';

    if (text.includes('7 SMP') || text.includes('KELAS 7') || text.includes('K7')) return 'SMP_7';
    if (text.includes('8 SMP') || text.includes('KELAS 8') || text.includes('K8')) return 'SMP_8';
    if (text.includes('9 SMP') || text.includes('KELAS 9') || text.includes('9A') || text.includes('9B') || text.includes('K9')) return 'SMP_9';

    if (text.includes('SMA') || item.level === 'SMA') return 'SMA_ALL';
    if (item.level === 'SD') return 'SD_3'; // fallback
    if (item.level === 'SMP') return 'SMP_7'; // fallback
    return 'LAINNYA';
  };

  // Filter jadwal yang masuk dalam minggu terpilih
  const weekSchedules = schedules.filter(s => weekDates.includes(s.dateStr) && s.status !== 'cancelled');

  // Kelompokkan sesi per kategori kelas
  const groupSchedulesByClass = (targetCat) => {
    return weekSchedules.filter(s => detectClassCategory(s) === targetCat);
  };

  // Struktur Konfigurasi Kelas sesuai Gambar 2 (Excel)
  const SD_CONFIGS = [
    { key: 'SD_3', title: 'KELAS 3 SD (60 MENIT)', headerBg: '#ea580c', defaultRoom: 'BUMI', level: 'SD' },
    { key: 'SD_4', title: 'KELAS 4 SD (60 MENIT)', headerBg: '#ea580c', defaultRoom: 'MARS', level: 'SD' },
    { key: 'SD_5', title: 'KELAS 5 SD (60 MENIT)', headerBg: '#ea580c', defaultRoom: 'JUPITER', level: 'SD' },
    { key: 'SD_6', title: 'KELAS 6 SD (90 MENIT)', headerBg: '#0284c7', defaultRoom: 'MERKURIUS', level: 'SD' },
  ];

  const SMP_CONFIGS = [
    { key: 'SMP_7', title: 'KELAS 7 SMP (90 MENIT)', headerBg: '#2563eb', defaultRoom: 'MERKURIUS', level: 'SMP' },
    { key: 'SMP_8', title: 'KELAS 8 SMP (90 MENIT)', headerBg: '#2563eb', defaultRoom: 'VENUS', level: 'SMP' },
    { key: 'SMP_9', title: 'KELAS 9 SMP (90 MENIT)', headerBg: '#2563eb', defaultRoom: 'BUMI', level: 'SMP' },
  ];

  const SMA_EC_CONFIGS = [
    { key: 'SMA_ALL', title: 'KELAS 10, 11, 12 SMA (90 MENIT)', headerBg: '#7c3aed', defaultRoom: 'BUMI', level: 'SMA' },
    { key: 'ENGLISH_COURSE', title: 'ENGLISH COURSE (KIDS & TEENS)', headerBg: '#0891b2', defaultRoom: 'VENUS', level: 'Umum' },
  ];

  // Helper render tabel untuk 1 kelas
  const renderClassTable = (conf) => {
    const classItems = groupSchedulesByClass(conf.key);

    return (
      <div 
        key={conf.key}
        style={{
          ...styles.classCard,
          background: isDarkMode ? '#1e293b' : '#ffffff',
          borderColor: isDarkMode ? '#334155' : '#e2e8f0'
        }}
      >
        {/* Header Kelas */}
        <div style={{...styles.classHeader, background: conf.headerBg}}>
          <h4 style={styles.classTitle}>{conf.title}</h4>
          <span style={styles.classSesiCount}>{classItems.length} Sesi Terjadwal</span>
        </div>

        {/* Tabel Hari & Sesi */}
        <table style={styles.table}>
          <thead>
            <tr style={{ background: isDarkMode ? '#0f172a' : '#f8fafc' }}>
              <th style={{...styles.th, width: '65px', color: isDarkMode ? '#94a3b8' : '#64748b'}}>Hari</th>
              <th style={{...styles.th, width: '85px', color: isDarkMode ? '#94a3b8' : '#64748b'}}>Jam</th>
              <th style={{...styles.th, color: isDarkMode ? '#94a3b8' : '#64748b'}}>Mapel & Tentor</th>
              <th style={{...styles.th, width: '90px', color: isDarkMode ? '#94a3b8' : '#64748b'}}>Ruang</th>
              <th style={{...styles.th, width: '70px', textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#64748b'}}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {DAYS_ORDER.map(dayName => {
              // Cari tanggal di minggu ini yang cocok dengan nama hari
              const targetDateStr = weekDates.find(dStr => {
                const d = new Date(dStr);
                return DAYS_ID[d.getDay()] === dayName;
              });

              const dayItems = classItems.filter(s => s.dateStr === targetDateStr);

              if (dayItems.length === 0) {
                // Hari tanpa sesi (tampilan kosong seperti Excel)
                return (
                  <tr 
                    key={dayName}
                    style={{
                      borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9'
                    }}
                  >
                    <td style={{...styles.tdDay, color: isDarkMode ? '#cbd5e1' : '#334155'}}>
                      {dayName}
                    </td>
                    <td style={styles.tdEmpty} colSpan="3">
                      <span style={{ fontSize: 10.5, color: '#94a3b8', fontStyle: 'italic' }}>
                        — Kosong —
                      </span>
                    </td>
                    <td style={{...styles.tdActions, textAlign: 'center'}}>
                      <button
                        type="button"
                        onClick={() => onOpenModal && onOpenModal(conf.defaultRoom, false, null)}
                        style={styles.btnTableAdd}
                        title={`Tambah kelas ${conf.title} di hari ${dayName}`}
                      >
                        <Plus size={11} />
                      </button>
                    </td>
                  </tr>
                );
              }

              // Jika ada sesi di hari ini
              return dayItems.map((s, idx) => {
                const photo = getTeacherPhoto(s);
                return (
                  <tr 
                    key={s.id || idx}
                    style={{
                      borderBottom: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9',
                      background: isDarkMode ? (idx % 2 === 0 ? '#1e293b' : '#172033') : (idx % 2 === 0 ? '#ffffff' : '#fcfdfe')
                    }}
                  >
                    {idx === 0 ? (
                      <td 
                        rowSpan={dayItems.length}
                        style={{
                          ...styles.tdDay,
                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                          fontWeight: 800,
                          background: isDarkMode ? '#131d31' : '#f8fafc'
                        }}
                      >
                        {dayName}
                      </td>
                    ) : null}

                    <td style={styles.tdTime}>
                      <span style={{
                        ...styles.timeTag,
                        background: isDarkMode ? '#0f172a' : '#f1f5f9',
                        color: isDarkMode ? '#60a5fa' : '#2563eb'
                      }}>
                        {s.start} - {s.end}
                      </span>
                    </td>

                    <td style={styles.tdMapel}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        {photo ? (
                          <img src={photo} alt={s.teacherName} style={styles.teacherImgTable} />
                        ) : (
                          <div style={styles.teacherAvatarTable}>
                            {s.teacherName?.charAt(0) || 'G'}
                          </div>
                        )}
                        <div style={{ lineHeight: 1.25 }}>
                          <div style={{
                            fontSize: 11.5,
                            fontWeight: 800,
                            color: isDarkMode ? '#f8fafc' : '#0f172a'
                          }}>
                            {s.title || s.mapelName || 'Sesi Belajar'}
                          </div>
                          <div style={{ fontSize: 10, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                            👨‍🏫 <b>{s.teacherName || s.booker || '-'}</b> · {s.students?.length || 0} murid
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={styles.tdPlanet}>
                      <span style={{
                        ...styles.planetTag,
                        background: isDarkMode ? '#0f172a' : '#eff6ff',
                        color: isDarkMode ? '#93c5fd' : '#1d4ed8'
                      }}>
                        🪐 {s.planet}
                      </span>
                    </td>

                    <td style={styles.tdActions}>
                      <div style={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => onOpenPindahRuang && onOpenPindahRuang(s)}
                          style={styles.btnActionIcon}
                          title="Pindah Ruangan Cepat"
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenDetailModal && onOpenDetailModal(s)}
                          style={styles.btnActionIcon}
                          title="Lihat Detail"
                        >
                          👁️
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSchedule && onDeleteSchedule(s)}
                          style={{ ...styles.btnActionIcon, color: '#ef4444' }}
                          title="Hapus Jadwal"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper render per tentor (Jadwal Mengajar Personal)
  const renderPerTentorView = () => {
    // Kelompokkan sesi per tentor
    const byTeacher = {};
    weekSchedules.forEach(s => {
      const key = s.teacherId || s.teacherName || 'Tanpa Guru';
      if (!byTeacher[key]) {
        byTeacher[key] = {
          teacherName: s.teacherName || s.booker || 'Tentor',
          teacherId: s.teacherId || '-',
          items: []
        };
      }
      byTeacher[key].items.push(s);
    });

    const teacherKeys = Object.keys(byTeacher);

    if (teacherKeys.length === 0) {
      return (
        <div style={styles.emptyBox}>
          Tidak ada jadwal mengajar tentor pada minggu yang dipilih.
        </div>
      );
    }

    return (
      <div style={styles.teacherGrid}>
        {teacherKeys.map(key => {
          const tData = byTeacher[key];
          const photo = getTeacherPhoto(tData.items[0] || { teacherName: tData.teacherName, teacherId: tData.teacherId });

          // Urutkan jadwal tentor: Hari -> Jam Mulai
          const sortedItems = [...tData.items].sort((a, b) => {
            const dA = new Date(a.dateStr);
            const dB = new Date(b.dateStr);
            const dayA = DAYS_ORDER.indexOf(DAYS_ID[dA.getDay()]);
            const dayB = DAYS_ORDER.indexOf(DAYS_ID[dB.getDay()]);
            if (dayA !== dayB) return dayA - dayB;
            return a.start.localeCompare(b.start);
          });

          return (
            <div
              key={key}
              style={{
                ...styles.teacherCard,
                background: isDarkMode ? '#1e293b' : '#ffffff',
                borderColor: isDarkMode ? '#334155' : '#e2e8f0'
              }}
            >
              {/* Header Tentor */}
              <div style={styles.teacherCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {photo ? (
                    <img src={photo} alt={tData.teacherName} style={styles.teacherImgLarge} />
                  ) : (
                    <div style={styles.teacherAvatarLarge}>
                      {tData.teacherName?.charAt(0) || 'G'}
                    </div>
                  )}
                  <div>
                    <h4 style={{
                      margin: 0,
                      fontSize: 14,
                      fontWeight: 800,
                      color: isDarkMode ? '#f8fafc' : '#0f172a'
                    }}>
                      {tData.teacherName}
                    </h4>
                    <span style={{ fontSize: 10.5, color: '#94a3b8' }}>
                      {tData.teacherId !== '-' ? `ID: ${tData.teacherId} · ` : ''}
                      {sortedItems.length} Jam Sesi Minggu Ini
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Jadwal Mengajar Tentor */}
              <div style={{ padding: 10 }}>
                {sortedItems.map(s => {
                  const d = new Date(s.dateStr);
                  const hari = DAYS_ID[d.getDay()];

                  return (
                    <div
                      key={s.id}
                      style={{
                        ...styles.teacherSessionRow,
                        background: isDarkMode ? '#0f172a' : '#f8fafc',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0'
                      }}
                    >
                      <div style={styles.teacherSessionLeft}>
                        <span style={styles.teacherDayBadge}>{hari}</span>
                        <span style={styles.teacherTimeText}>{s.start} - {s.end}</span>
                      </div>

                      <div style={styles.teacherSessionCenter}>
                        <div style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          color: isDarkMode ? '#f8fafc' : '#0f172a'
                        }}>
                          {s.title || s.mapelName}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8' }}>
                          📚 {s.level || s.program} · 👥 {s.students?.length || 0} siswa
                        </div>
                      </div>

                      <div style={styles.teacherSessionRight}>
                        <span style={styles.roomBadgeSmall}>🪐 {s.planet}</span>
                        <button
                          type="button"
                          onClick={() => onOpenPindahRuang && onOpenPindahRuang(s)}
                          style={styles.btnActionIcon}
                          title="Pindah Ruangan"
                        >
                          🔄
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteSchedule && onDeleteSchedule(s)}
                          style={{ ...styles.btnActionIcon, color: '#ef4444' }}
                          title="Hapus Jadwal"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Sub-View Switcher: Format Per Kelas vs Format Per Tentor */}
      <div style={{
        ...styles.subViewBar,
        background: isDarkMode ? '#1e293b' : '#ffffff',
        borderColor: isDarkMode ? '#334155' : '#e2e8f0'
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSubView('per_kelas')}
            style={{
              ...styles.btnSubView,
              background: subView === 'per_kelas' ? '#dc2626' : 'transparent',
              color: subView === 'per_kelas' ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
              fontWeight: subView === 'per_kelas' ? 800 : 600
            }}
          >
            📊 Format Matriks Per Kelas (Resmi Excel Gemilang)
          </button>

          <button
            type="button"
            onClick={() => setSubView('per_tentor')}
            style={{
              ...styles.btnSubView,
              background: subView === 'per_tentor' ? '#4f46e5' : 'transparent',
              color: subView === 'per_tentor' ? '#ffffff' : (isDarkMode ? '#cbd5e1' : '#475569'),
              fontWeight: subView === 'per_tentor' ? 800 : 600
            }}
          >
            👨‍🏫 Format Matriks Per Tentor (Jadwal Mengajar)
          </button>
        </div>

        <span style={{ fontSize: 11, color: '#94a3b8' }}>
          Tampilan mudah dibaca · Bebas bentrok antarguru & siswa
        </span>
      </div>

      {subView === 'per_tentor' ? (
        renderPerTentorView()
      ) : (
        /* FORMAT PER KELAS (EXACT EXCEL GEMILANG) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* SECTION 1: JADWAL SD KELAS 3, 4, 5, 6 */}
          <div>
            <div style={styles.sectionBannerRed}>
              🔴 JADWAL PELAJARAN SD (KELAS 3, 4, 5, 6)
            </div>
            <div style={styles.classGridSD}>
              {SD_CONFIGS.map(conf => renderClassTable(conf))}
            </div>
          </div>

          {/* SECTION 2: JADWAL SMP KELAS 7, 8, 9 */}
          <div>
            <div style={styles.sectionBannerRed}>
              🔴 JADWAL PELAJARAN SMP (KELAS 7, 8, 9)
            </div>
            <div style={styles.classGridSMP}>
              {SMP_CONFIGS.map(conf => renderClassTable(conf))}
            </div>
          </div>

          {/* SECTION 3: JADWAL SMA & ENGLISH COURSE */}
          <div>
            <div style={styles.sectionBannerRed}>
              🔴 JADWAL SMA & ENGLISH COURSE
            </div>
            <div style={styles.classGridSMA}>
              {SMA_EC_CONFIGS.map(conf => renderClassTable(conf))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16
  },
  subViewBar: {
    padding: '8px 14px',
    borderRadius: 14,
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10
  },
  btnSubView: {
    padding: '7px 14px',
    borderRadius: 8,
    border: 'none',
    fontSize: 11.5,
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  sectionBannerRed: {
    padding: '9px 16px',
    borderRadius: 10,
    background: '#dc2626',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: '0.4px',
    marginBottom: 12,
    boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
  },
  classGridSD: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 14
  },
  classGridSMP: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 14
  },
  classGridSMA: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: 14
  },
  classCard: {
    borderRadius: 14,
    border: '1px solid',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column'
  },
  classHeader: {
    padding: '10px 14px',
    color: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  classTitle: {
    margin: 0,
    fontSize: 12.5,
    fontWeight: 900,
    letterSpacing: '0.3px'
  },
  classSesiCount: {
    fontSize: 10,
    fontWeight: 700,
    background: 'rgba(255,255,255,0.25)',
    padding: '2px 7px',
    borderRadius: 6
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 11
  },
  th: {
    padding: '7px 8px',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 800,
    borderBottom: '1px solid rgba(0,0,0,0.06)'
  },
  tdDay: {
    padding: '6px 8px',
    fontSize: 10.5,
    verticalAlign: 'middle',
    borderRight: '1px solid rgba(0,0,0,0.04)'
  },
  tdTime: {
    padding: '6px 8px',
    verticalAlign: 'middle'
  },
  timeTag: {
    fontSize: 9.5,
    fontWeight: 800,
    padding: '2px 5px',
    borderRadius: 5,
    display: 'inline-block',
    whiteSpace: 'nowrap'
  },
  tdMapel: {
    padding: '6px 8px',
    verticalAlign: 'middle'
  },
  teacherImgTable: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1.5px solid #818cf8',
    flexShrink: 0
  },
  teacherAvatarTable: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: '#6366f1',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 800,
    flexShrink: 0
  },
  tdPlanet: {
    padding: '6px 8px',
    verticalAlign: 'middle'
  },
  planetTag: {
    fontSize: 9.5,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 5,
    whiteSpace: 'nowrap'
  },
  tdActions: {
    padding: '6px 4px',
    verticalAlign: 'middle'
  },
  btnActionIcon: {
    padding: '3px 5px',
    borderRadius: 5,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
    fontSize: 10
  },
  tdEmpty: {
    padding: '6px 8px',
    verticalAlign: 'middle'
  },
  btnTableAdd: {
    padding: '3px 6px',
    borderRadius: 5,
    background: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: 10,
    fontWeight: 700
  },
  teacherGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 14
  },
  teacherCard: {
    borderRadius: 14,
    border: '1px solid',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
  },
  teacherCardHeader: {
    padding: '12px 14px',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    background: 'rgba(99, 102, 241, 0.05)'
  },
  teacherImgLarge: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #818cf8',
    flexShrink: 0
  },
  teacherAvatarLarge: {
    width: 38,
    height: 38,
    borderRadius: '50%',
    background: '#4f46e5',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 800,
    flexShrink: 0
  },
  teacherSessionRow: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid',
    marginBottom: 6,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8
  },
  teacherSessionLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    minWidth: 70
  },
  teacherDayBadge: {
    fontSize: 10.5,
    fontWeight: 800,
    color: '#dc2626'
  },
  teacherTimeText: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: 600
  },
  teacherSessionCenter: {
    flex: 1,
    minWidth: 0
  },
  teacherSessionRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 6
  },
  roomBadgeSmall: {
    fontSize: 9.5,
    fontWeight: 700,
    color: '#4338ca',
    padding: '2px 5px',
    borderRadius: 4,
    background: '#e0e7ff'
  },
  emptyBox: {
    padding: 30,
    textAlign: 'center',
    background: '#f8fafc',
    borderRadius: 12,
    border: '1px dashed #cbd5e1',
    color: '#64748b',
    fontSize: 12
  }
};
