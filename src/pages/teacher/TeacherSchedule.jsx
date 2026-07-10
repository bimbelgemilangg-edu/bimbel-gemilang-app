// src/pages/teacher/TeacherSchedule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, query, where, getDocs, doc, getDoc, onSnapshot 
} from "firebase/firestore";
import TeacherLayout from './TeacherLayout';
import { 
  Calendar, ChevronLeft, ChevronRight, Clock, MapPin, 
  Users, BookOpen, Flag, AlertCircle, CheckCircle, XCircle,
  Eye, FileText, Award, Home, Layers, Hash, Tag,
  Sparkles, Coffee, Sun, Moon, GraduationCap, Plus
} from 'lucide-react';

// ============================================================
// DATA HARI LIBUR NASIONAL INDONESIA (LENGKAP)
// ============================================================
const INDONESIAN_HOLIDAYS = {
  // 2025
  '2025-01-01': { name: 'Tahun Baru 2025 Masehi', color: '#ef4444' },
  '2025-01-27': { name: 'Isra Mikraj Nabi Muhammad SAW', color: '#ef4444' },
  '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili', color: '#ef4444' },
  '2025-03-29': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', color: '#ef4444' },
  '2025-03-31': { name: 'Idul Fitri 1446 Hijriah', color: '#ef4444' },
  '2025-04-01': { name: 'Idul Fitri 1446 Hijriah (Hari 2)', color: '#ef4444' },
  '2025-04-18': { name: 'Wafat Yesus Kristus', color: '#ef4444' },
  '2025-05-01': { name: 'Hari Buruh Internasional', color: '#ef4444' },
  '2025-05-12': { name: 'Hari Raya Waisak 2569 BE', color: '#ef4444' },
  '2025-05-29': { name: 'Kenaikan Yesus Kristus', color: '#ef4444' },
  '2025-06-01': { name: 'Hari Lahir Pancasila', color: '#ef4444' },
  '2025-06-07': { name: 'Idul Adha 1446 Hijriah', color: '#ef4444' },
  '2025-06-27': { name: 'Tahun Baru Islam 1447 Hijriah', color: '#ef4444' },
  '2025-08-17': { name: 'Hari Kemerdekaan RI', color: '#ef4444' },
  '2025-09-05': { name: 'Maulid Nabi Muhammad SAW', color: '#ef4444' },
  '2025-12-25': { name: 'Hari Raya Natal', color: '#ef4444' },
  // 2026
  '2026-01-01': { name: 'Tahun Baru 2026 Masehi', color: '#ef4444' },
  '2026-01-19': { name: 'Tahun Baru Imlek 2577 Kongzili', color: '#ef4444' },
  '2026-03-19': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', color: '#ef4444' },
  '2026-04-03': { name: 'Wafat Yesus Kristus', color: '#ef4444' },
  '2026-05-01': { name: 'Hari Buruh Internasional', color: '#ef4444' },
  '2026-05-14': { name: 'Kenaikan Yesus Kristus', color: '#ef4444' },
  '2026-06-01': { name: 'Hari Lahir Pancasila', color: '#ef4444' },
  '2026-08-17': { name: 'Hari Kemerdekaan RI', color: '#ef4444' },
  '2026-12-25': { name: 'Hari Raya Natal', color: '#ef4444' },
};

// ============================================================
// DATA MINGGU AKADEMIK (Contoh - bisa diisi admin nanti)
// ============================================================
const DEFAULT_ACADEMIC_EVENTS = [
  // { date: '2026-07-15', label: 'Rapat Guru', color: '#f59e0b', description: 'Rapat koordinasi' },
  // { date: '2026-07-20', label: 'Ujian Tengah Semester', color: '#3b82f6', description: 'UTS Ganjil' },
];

// ============================================================
// MAIN COMPONENT
// ============================================================
const TeacherSchedule = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState([]);
  const [customEvents, setCustomEvents] = useState(DEFAULT_ACADEMIC_EVENTS);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState('monthly');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [teacherData, setTeacherData] = useState(null);
  const [dailyCode, setDailyCode] = useState("");
  const [teacherStats, setTeacherStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    todayClasses: 0
  });

  const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Ambil data guru dari localStorage
  useEffect(() => {
    const stored = localStorage.getItem('teacherData');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setTeacherData(data);
      } catch (e) {
        console.error("Error parsing teacher data:", e);
      }
    }
  }, []);

  // Fetch data jadwal & custom events
  useEffect(() => {
    // 1. Ambil custom events dari admin (jika ada)
    const fetchCustomEvents = async () => {
      try {
        const docRef = doc(db, "settings", "calendar_events");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const events = docSnap.data().events || [];
          setCustomEvents([...DEFAULT_ACADEMIC_EVENTS, ...events]);
        } else {
          setCustomEvents(DEFAULT_ACADEMIC_EVENTS);
        }
      } catch (e) {
        console.error("Error fetching custom events:", e);
        setCustomEvents(DEFAULT_ACADEMIC_EVENTS);
      }
    };
    fetchCustomEvents();

    // 2. Ambil daily code
    const fetchDailyCode = async () => {
      try {
        const today = getDateStr(new Date());
        const docRef = doc(db, "settings", `daily_code_${today}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDailyCode(docSnap.data().code || "");
        }
      } catch (e) {
        console.error("Error fetching daily code:", e);
      }
    };
    fetchDailyCode();

    // 3. Ambil jadwal (jika ada data guru)
    if (!teacherData?.nama) {
      setLoading(false);
      return;
    }

    const teacherName = teacherData.nama;
    
    // Coba query dengan teacherName
    const q1 = query(
      collection(db, "jadwal_bimbel"),
      where("teacherName", "==", teacherName)
    );

    // Coba query dengan booker (fallback)
    const q2 = query(
      collection(db, "jadwal_bimbel"),
      where("booker", "==", teacherName)
    );

    const fetchSchedules = async () => {
      try {
        const [snap1, snap2] = await Promise.all([
          getDocs(q1),
          getDocs(q2)
        ]);

        const data1 = snap1.docs.map(d => ({ id: d.id, ...d.data() }));
        const data2 = snap2.docs.map(d => ({ id: d.id, ...d.data() }));

        // Gabungkan dan hindari duplikat
        const merged = [...data1];
        data2.forEach(item => {
          if (!merged.find(d => d.id === item.id)) {
            merged.push(item);
          }
        });

        setSchedules(merged);
        
        // Hitung statistik
        const today = getDateStr(new Date());
        const todayClasses = merged.filter(s => s.dateStr === today).length;
        const totalStudents = new Set();
        merged.forEach(s => {
          if (s.students) {
            s.students.forEach(st => totalStudents.add(st.studentId || st.id));
          }
        });
        
        setTeacherStats({
          totalStudents: totalStudents.size,
          totalClasses: merged.length,
          todayClasses: todayClasses
        });
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching schedules:", error);
        setLoading(false);
      }
    };

    fetchSchedules();

  }, [teacherData]);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  const getDateStr = (dateObj) => {
    if (!dateObj) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isHoliday = (dateStr) => INDONESIAN_HOLIDAYS[dateStr] || null;
  const isSunday = (dateObj) => dateObj.getDay() === 0;

  const getCustomEvent = (dateStr) => {
    return customEvents.find(e => e.date === dateStr);
  };

  const getDaySchedules = (dateStr) => {
    return schedules.filter(s => s.dateStr === dateStr);
  };

  const getWeekDates = (currDate) => {
    const dates = [];
    const current = new Date(currDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(current.setDate(diff));
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(startOfWeek);
      nextDate.setDate(startOfWeek.getDate() + i);
      dates.push(getDateStr(nextDate));
    }
    return dates;
  };

  const getMonthDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  // ============================================================
  // RENDER: Kalender Bulanan
  // ============================================================
  const renderMonthlyView = () => {
    const days = getMonthDays();
    const today = new Date();
    const todayStr = getDateStr(today);
    const selectedStr = getDateStr(selectedDate);

    return (
      <div style={styles.monthGrid}>
        {DAYS_ID.map((d, i) => (
          <div key={i} style={styles.monthDayHeader(i === 0)}>
            {d}
          </div>
        ))}

        {days.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} style={styles.monthDayEmpty}></div>;
          }

          const dateStr = getDateStr(day);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedStr;
          const holiday = isHoliday(dateStr);
          const customEvent = getCustomEvent(dateStr);
          const daySchedules = getDaySchedules(dateStr);
          const isRed = holiday || isSunday(day);
          const isWeekend = isSunday(day);

          let bgColor = 'white';
          let borderColor = 'transparent';
          let textColor = '#1e293b';

          if (isSelected) {
            bgColor = '#3b82f6';
            textColor = 'white';
            borderColor = '#3b82f6';
          } else if (customEvent) {
            bgColor = customEvent.color + '20' || '#fef3c7';
            textColor = '#1e293b';
            borderColor = customEvent.color || '#f59e0b';
          } else if (holiday || isWeekend) {
            bgColor = '#fee2e2';
            textColor = '#ef4444';
            borderColor = '#fecaca';
          } else if (isToday) {
            bgColor = '#eff6ff';
            textColor = '#3b82f6';
            borderColor = '#3b82f6';
          }

          return (
            <div
              key={idx}
              onClick={() => {
                setSelectedDate(day);
                setViewMode('daily');
              }}
              style={styles.monthDay(isSelected, bgColor, borderColor, textColor)}
            >
              <div style={styles.monthDayTop}>
                <span style={styles.monthDayNumber(isSelected, textColor)}>
                  {day.getDate()}
                </span>
                {customEvent && !isSelected && (
                  <div style={{...styles.eventIndicator, background: customEvent.color || '#f59e0b'}} 
                       title={customEvent.label} />
                )}
                {holiday && !isSelected && (
                  <Flag size={10} color="#ef4444" style={{marginLeft: 'auto'}} />
                )}
              </div>

              {daySchedules.length > 0 && (
                <div style={styles.monthDaySchedules}>
                  {daySchedules.slice(0, 2).map((s, i) => (
                    <div key={i} style={styles.monthDaySchedule}>
                      <span style={styles.monthDayTime}>{s.start}</span>
                      <span style={styles.monthDayTitle}>
                        {s.title || s.mapelName || 'Materi'}
                      </span>
                    </div>
                  ))}
                  {daySchedules.length > 2 && (
                    <div style={styles.monthDayMore}>+{daySchedules.length - 2} lagi</div>
                  )}
                </div>
              )}

              {customEvent && (
                <div style={styles.customEventLabel(customEvent.color || '#f59e0b')}>
                  {customEvent.label}
                </div>
              )}

              {/* Tampilkan "Kosong" jika tidak ada jadwal dan bukan weekend */}
              {!daySchedules.length && !isWeekend && !holiday && !customEvent && (
                <div style={styles.emptyDaySlot}>
                  <span style={styles.emptyDayText}>-</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER: Tampilan Harian
  // ============================================================
  const renderDailyView = () => {
    const dateStr = getDateStr(selectedDate);
    const daySchedules = getDaySchedules(dateStr);
    const holiday = isHoliday(dateStr);
    const customEvent = getCustomEvent(dateStr);
    const isWeekend = isSunday(selectedDate);

    return (
      <div style={styles.dailyView}>
        <div style={styles.dailyHeader}>
          <div style={styles.dailyHeaderLeft}>
            <button onClick={() => {
              const prev = new Date(selectedDate);
              prev.setDate(prev.getDate() - 1);
              setSelectedDate(prev);
            }} style={styles.dailyNavBtn}>
              <ChevronLeft size={16} />
            </button>
            <div style={styles.dailyDateInfo}>
              <span style={styles.dailyDayName}>
                {selectedDate.toLocaleDateString('id-ID', { weekday: 'long' })}
              </span>
              <span style={styles.dailyDate}>
                {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </span>
            </div>
            <button onClick={() => {
              const next = new Date(selectedDate);
              next.setDate(next.getDate() + 1);
              setSelectedDate(next);
            }} style={styles.dailyNavBtn}>
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setSelectedDate(new Date())} style={styles.dailyTodayBtn}>
              Hari Ini
            </button>
          </div>
          <button onClick={() => setViewMode('monthly')} style={styles.dailyBackBtn}>
            <Calendar size={14} /> Bulanan
          </button>
        </div>

        {/* Status Hari */}
        <div style={styles.dailyStatus}>
          {holiday && (
            <div style={styles.dailyStatusItem}>
              <Flag size={14} color="#ef4444" />
              <span style={styles.dailyStatusText}>Libur Nasional: {holiday.name}</span>
            </div>
          )}
          {customEvent && (
            <div style={{...styles.dailyStatusItem, background: customEvent.color + '20', borderColor: customEvent.color}}>
              <div style={{...styles.dailyStatusDot, background: customEvent.color || '#f59e0b'}} />
              <span style={styles.dailyStatusText}>{customEvent.label}</span>
              {customEvent.description && (
                <span style={styles.dailyStatusDesc}>{customEvent.description}</span>
              )}
            </div>
          )}
          {isWeekend && !holiday && !customEvent && (
            <div style={{...styles.dailyStatusItem, background: '#fef3c7', borderColor: '#f59e0b'}}>
              <AlertCircle size={14} color="#f59e0b" />
              <span style={styles.dailyStatusText}>Hari Minggu / Libur</span>
            </div>
          )}
          {!holiday && !customEvent && !isWeekend && daySchedules.length === 0 && (
            <div style={{...styles.dailyStatusItem, background: '#eff6ff', borderColor: '#3b82f6'}}>
              <BookOpen size={14} color="#3b82f6" />
              <span style={styles.dailyStatusText}>Belum ada jadwal pada hari ini</span>
              <span style={styles.dailyStatusDesc}>Jadwal akan muncul setelah admin menjadwalkan</span>
            </div>
          )}
        </div>

        {/* Kode Absensi */}
        {dailyCode && (
          <div style={styles.dailyCodeBox}>
            <span style={styles.dailyCodeLabel}>📋 Kode Absensi:</span>
            <span style={styles.dailyCodeValue}>{dailyCode}</span>
          </div>
        )}

        {/* Daftar Jadwal */}
        {daySchedules.length === 0 ? (
          <div style={styles.dailyEmpty}>
            <Calendar size={48} color="#cbd5e1" />
            <h3 style={styles.dailyEmptyTitle}>Tidak Ada Jadwal</h3>
            <p style={styles.dailyEmptyText}>
              {isWeekend || holiday ? 'Hari libur, selamat beristirahat! 🎉' : 'Belum ada jadwal yang dijadwalkan untuk hari ini'}
            </p>
            <p style={styles.dailyEmptySub}>
              {!isWeekend && !holiday && 'Silakan cek kembali nanti atau hubungi admin untuk penjadwalan'}
            </p>
          </div>
        ) : (
          <div style={styles.dailySchedules}>
            {daySchedules.map((s) => (
              <div key={s.id} style={styles.dailyScheduleCard}>
                <div style={styles.dailyScheduleHeader}>
                  <div style={styles.dailyScheduleTime}>
                    <Clock size={14} color="#3b82f6" />
                    <span>{s.start} - {s.end}</span>
                  </div>
                  <div style={styles.dailySchedulePlanet}>
                    <MapPin size={12} color="#64748b" />
                    <span>{s.planet || 'Ruang'}</span>
                  </div>
                </div>

                <div style={styles.dailyScheduleBody}>
                  <h4 style={styles.dailyScheduleTitle}>
                    {s.title || s.mapelName || 'Materi Umum'}
                  </h4>
                  <div style={styles.dailyScheduleMeta}>
                    <span style={styles.dailyScheduleProgram(s.program)}>
                      {s.program || 'Reguler'}
                    </span>
                    <span style={styles.dailyScheduleLevel}>{s.level || 'SD'}</span>
                    {s.teacherId && (
                      <span style={styles.dailyScheduleTeacherId}>
                        <Hash size={10} /> {s.teacherId}
                      </span>
                    )}
                  </div>
                </div>

                <div style={styles.dailyScheduleFooter}>
                  <div style={styles.dailyScheduleStudents}>
                    <Users size={12} color="#64748b" />
                    <span>{s.students?.length || 0} siswa</span>
                  </div>
                  <button 
                    onClick={() => setSelectedSchedule(s)} 
                    style={styles.dailyScheduleDetailBtn}
                  >
                    <Eye size={12} /> Detail
                  </button>
                </div>

                {s.students && s.students.length > 0 && (
                  <div style={styles.dailyStudentPreview}>
                    {s.students.slice(0, 3).map((student, i) => (
                      <span key={i} style={styles.dailyStudentChip}>
                        {student.nama || student}
                      </span>
                    ))}
                    {s.students.length > 3 && (
                      <span style={styles.dailyStudentMore}>
                        +{s.students.length - 3} lainnya
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER: Detail Jadwal Modal
  // ============================================================
  const renderDetailModal = () => {
    if (!selectedSchedule) return null;

    return (
      <div style={styles.detailOverlay} onClick={() => setSelectedSchedule(null)}>
        <div style={styles.detailModal} onClick={e => e.stopPropagation()}>
          <div style={styles.detailHeader}>
            <h3 style={styles.detailTitle}>📋 Detail Jadwal</h3>
            <button onClick={() => setSelectedSchedule(null)} style={styles.detailCloseBtn}>
              <XCircle size={20} />
            </button>
          </div>

          <div style={styles.detailContent}>
            <div style={styles.detailRow}>
              <span>🪐 Ruang</span>
              <strong>{selectedSchedule.planet || '-'}</strong>
            </div>
            <div style={styles.detailRow}>
              <span>⏰ Waktu</span>
              <strong>{selectedSchedule.start} - {selectedSchedule.end}</strong>
            </div>
            <div style={styles.detailRow}>
              <span>📅 Tanggal</span>
              <strong>{selectedSchedule.dateStr}</strong>
            </div>
            <div style={styles.detailRow}>
              <span>📚 Program</span>
              <strong>{selectedSchedule.program} / {selectedSchedule.level}</strong>
            </div>
            <div style={styles.detailRow}>
              <span>👨‍🏫 Guru</span>
              <strong>
                {selectedSchedule.teacherName || selectedSchedule.booker}
                {selectedSchedule.teacherId && (
                  <span style={styles.detailTeacherId}>#{selectedSchedule.teacherId}</span>
                )}
              </strong>
            </div>
            <div style={styles.detailRow}>
              <span>📘 Mapel</span>
              <strong>
                {selectedSchedule.mapelName || selectedSchedule.mapel || '-'}
                {selectedSchedule.mapelId && (
                  <span style={styles.detailMapelId}>#{selectedSchedule.mapelId}</span>
                )}
              </strong>
            </div>
            <div style={styles.detailRow}>
              <span>📝 Materi</span>
              <strong>{selectedSchedule.title || '-'}</strong>
            </div>

            <div style={styles.detailDivider} />

            <h4 style={styles.detailStudentTitle}>
              👥 Daftar Siswa ({selectedSchedule.students?.length || 0})
            </h4>
            {selectedSchedule.students && selectedSchedule.students.length > 0 ? (
              <div style={styles.detailStudentList}>
                {selectedSchedule.students.map((s, i) => (
                  <div key={i} style={styles.detailStudentItem}>
                    <span style={styles.detailStudentNum}>{i + 1}.</span>
                    <span style={styles.detailStudentName}>{s.nama || s}</span>
                    {s.studentId && (
                      <span style={styles.detailStudentId}>#{s.studentId}</span>
                    )}
                    <span style={styles.detailStudentKelas}>
                      {s.kelas || s.kelasSekolah || '-'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.detailEmptyStudents}>Belum ada siswa terdaftar</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  return (
    <TeacherLayout>
      <div style={styles.container}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <h2 style={styles.pageTitle}>
              <Calendar size={22} color="#3b82f6" /> Kalender Akademik
            </h2>
            <p style={styles.headerSub}>
              {teacherData?.nama ? `Halo, ${teacherData.nama} 👋` : 'Selamat datang di Kalender Akademik'}
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.monthNav}>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                style={styles.navBtn}
              >
                <ChevronLeft size={18} />
              </button>
              <span style={styles.monthLabel}>
                {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button 
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                style={styles.navBtn}
              >
                <ChevronRight size={18} />
              </button>
            </div>
            <button onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
              setViewMode('daily');
            }} style={styles.todayBtn}>
              Hari Ini
            </button>
          </div>
        </div>

        {/* STATS - hanya tampil jika ada data guru */}
        {teacherData?.nama && (
          <div style={styles.statsRow}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><BookOpen size={18} color="#3b82f6" /></div>
              <div>
                <div style={styles.statValue}>{teacherStats.totalClasses}</div>
                <div style={styles.statLabel}>Total Kelas</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><Users size={18} color="#8b5cf6" /></div>
              <div>
                <div style={styles.statValue}>{teacherStats.totalStudents}</div>
                <div style={styles.statLabel}>Total Siswa</div>
              </div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}><Clock size={18} color="#f59e0b" /></div>
              <div>
                <div style={styles.statValue}>{teacherStats.todayClasses}</div>
                <div style={styles.statLabel}>Hari Ini</div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW TOGGLE */}
        <div style={styles.viewToggle}>
          <button 
            onClick={() => setViewMode('monthly')} 
            style={styles.viewToggleBtn(viewMode === 'monthly')}
          >
            <Layers size={14} /> Bulanan
          </button>
          <button 
            onClick={() => setViewMode('daily')} 
            style={styles.viewToggleBtn(viewMode === 'daily')}
          >
            <Calendar size={14} /> Harian
          </button>
        </div>

        {/* MAIN CONTENT */}
        <div style={styles.content}>
          {viewMode === 'monthly' ? renderMonthlyView() : renderDailyView()}
        </div>

        {/* LEGEND */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{...styles.legendDot, background: '#3b82f6'}}></div>
            <span>Hari Ini</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendDot, background: '#f59e0b'}}></div>
            <span>Event Akademik</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendDot, background: '#ef4444'}}></div>
            <span>Libur / Minggu</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{...styles.legendDot, background: '#22c55e'}}></div>
            <span>Ada Jadwal</span>
          </div>
        </div>

        {/* DETAIL MODAL */}
        {renderDetailModal()}

      </div>
    </TeacherLayout>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: { 
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },

  header: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20, 
    flexWrap: 'wrap', 
    gap: 12 
  },
  headerLeft: {},
  pageTitle: { 
    margin: 0, 
    fontSize: 22, 
    fontWeight: 800, 
    color: '#1e293b', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8 
  },
  headerSub: { margin: '4px 0 0', color: '#64748b', fontSize: 13 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  monthNav: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    background: 'white', 
    padding: '6px 12px', 
    borderRadius: 10, 
    border: '1px solid #e2e8f0' 
  },
  navBtn: { 
    background: 'none', 
    border: 'none', 
    padding: '4px 6px', 
    cursor: 'pointer', 
    color: '#64748b', 
    borderRadius: 6,
    transition: '0.2s'
  },
  monthLabel: { 
    fontWeight: 'bold', 
    fontSize: 14, 
    color: '#1e293b', 
    minWidth: 100, 
    textAlign: 'center' 
  },
  todayBtn: { 
    padding: '8px 16px', 
    background: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    borderRadius: 8, 
    cursor: 'pointer', 
    fontWeight: 'bold', 
    fontSize: 12,
    transition: '0.2s'
  },

  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: 12,
    marginBottom: 20
  },
  statCard: {
    background: 'white',
    padding: '16px 20px',
    borderRadius: 12,
    border: '1px solid #f1f5f9',
    display: 'flex',
    alignItems: 'center',
    gap: 12
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8'
  },

  viewToggle: { 
    display: 'flex', 
    gap: 8, 
    marginBottom: 16 
  },
  viewToggleBtn: (active) => ({ 
    padding: '8px 16px', 
    borderRadius: 8, 
    border: 'none', 
    fontWeight: 'bold', 
    fontSize: 12, 
    cursor: 'pointer',
    background: active ? '#3b82f6' : '#e2e8f0', 
    color: active ? 'white' : '#64748b',
    display: 'flex', 
    alignItems: 'center', 
    gap: 6,
    transition: '0.2s'
  }),

  content: { 
    background: 'white', 
    borderRadius: 16, 
    padding: 20, 
    border: '1px solid #f1f5f9' 
  },

  monthGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(7, 1fr)', 
    gap: 4 
  },
  monthDayHeader: (isSunday) => ({ 
    textAlign: 'center', 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: isSunday ? '#ef4444' : '#94a3b8',
    padding: '8px 0' 
  }),
  monthDayEmpty: { aspectRatio: '1', minHeight: 80 },
  monthDay: (selected, bg, border, color) => ({ 
    aspectRatio: '1', minHeight: 80,
    background: bg, 
    border: selected ? '2px solid #3b82f6' : `1px solid ${border}`,
    borderRadius: 8, 
    padding: 6, 
    cursor: 'pointer',
    display: 'flex', 
    flexDirection: 'column',
    transition: '0.2s', 
    position: 'relative',
    color: color
  }),
  monthDayTop: { display: 'flex', alignItems: 'center', gap: 4 },
  monthDayNumber: (selected, color) => ({ 
    fontSize: 13, 
    fontWeight: selected ? 'bold' : '500', 
    color: color 
  }),
  eventIndicator: { 
    width: 6, 
    height: 6, 
    borderRadius: '50%', 
    flexShrink: 0, 
    marginLeft: 'auto' 
  },
  monthDaySchedules: { 
    marginTop: 4, 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 2, 
    flex: 1, 
    overflow: 'hidden' 
  },
  monthDaySchedule: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 4, 
    fontSize: 8, 
    background: 'rgba(59,130,246,0.08)', 
    padding: '2px 4px', 
    borderRadius: 4,
    whiteSpace: 'nowrap', 
    overflow: 'hidden'
  },
  monthDayTime: { fontWeight: 'bold', color: '#3b82f6', fontSize: 7 },
  monthDayTitle: { fontSize: 7, color: '#1e293b', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' },
  monthDayMore: { fontSize: 7, color: '#94a3b8', fontStyle: 'italic', paddingLeft: 4 },
  customEventLabel: (color) => ({ 
    fontSize: 7, 
    fontWeight: 'bold', 
    background: color, 
    color: 'white',
    padding: '1px 6px', 
    borderRadius: 4,
    marginTop: 'auto', 
    textAlign: 'center',
    overflow: 'hidden', 
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  }),
  emptyDaySlot: { 
    marginTop: 'auto', 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: '4px 0'
  },
  emptyDayText: { 
    fontSize: 8, 
    color: '#d1d5db',
    fontStyle: 'italic'
  },

  // Daily View
  dailyView: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 16 
  },
  dailyHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    flexWrap: 'wrap', 
    gap: 10 
  },
  dailyHeaderLeft: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8 
  },
  dailyNavBtn: { 
    background: '#f1f5f9', 
    border: 'none', 
    padding: '6px 10px', 
    borderRadius: 6, 
    cursor: 'pointer',
    transition: '0.2s'
  },
  dailyDateInfo: { textAlign: 'center' },
  dailyDayName: { 
    display: 'block', 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  dailyDate: { 
    fontSize: 12, 
    color: '#64748b' 
  },
  dailyTodayBtn: { 
    padding: '6px 12px', 
    background: '#3b82f6', 
    color: 'white', 
    border: 'none', 
    borderRadius: 6, 
    cursor: 'pointer', 
    fontSize: 11, 
    fontWeight: 'bold',
    transition: '0.2s'
  },
  dailyBackBtn: { 
    padding: '6px 12px', 
    background: '#f1f5f9', 
    border: 'none', 
    borderRadius: 6, 
    cursor: 'pointer', 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: '#64748b',
    display: 'flex', 
    alignItems: 'center', 
    gap: 4,
    transition: '0.2s'
  },

  dailyStatus: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 6 
  },
  dailyStatusItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8, 
    padding: '8px 12px', 
    borderRadius: 8, 
    background: '#fef2f2', 
    border: '1px solid #fecaca' 
  },
  dailyStatusDot: { width: 8, height: 8, borderRadius: '50%' },
  dailyStatusText: { fontSize: 13, fontWeight: '500' },
  dailyStatusDesc: { fontSize: 11, color: '#64748b', marginLeft: 'auto' },

  dailyCodeBox: { 
    background: '#f0fdf4', 
    border: '1px solid #bbf7d0', 
    padding: '12px 16px', 
    borderRadius: 10,
    display: 'flex', 
    alignItems: 'center', 
    gap: 12 
  },
  dailyCodeLabel: { fontSize: 12, fontWeight: 'bold', color: '#166534' },
  dailyCodeValue: { 
    fontSize: 20, 
    fontWeight: '900', 
    color: '#166534',
    fontFamily: 'monospace', 
    letterSpacing: 4 
  },

  dailyEmpty: { 
    textAlign: 'center', 
    padding: 60, 
    color: '#94a3b8', 
    fontSize: 14,
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    gap: 8 
  },
  dailyEmptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#64748b', margin: 0 },
  dailyEmptyText: { fontSize: 14, color: '#94a3b8' },
  dailyEmptySub: { fontSize: 12, color: '#cbd5e1' },

  dailySchedules: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 12 
  },
  dailyScheduleCard: { 
    background: '#f8fafc', 
    padding: 16, 
    borderRadius: 12, 
    border: '1px solid #e2e8f0',
    transition: '0.2s'
  },
  dailyScheduleHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  dailyScheduleTime: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6,
    fontSize: 12, 
    fontWeight: 'bold', 
    color: '#3b82f6' 
  },
  dailySchedulePlanet: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 4,
    fontSize: 11, 
    color: '#64748b' 
  },
  dailyScheduleBody: { marginBottom: 10 },
  dailyScheduleTitle: { 
    margin: '0 0 4px', 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: '#1e293b' 
  },
  dailyScheduleMeta: { 
    display: 'flex', 
    gap: 8, 
    flexWrap: 'wrap' 
  },
  dailyScheduleProgram: (p) => ({ 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: p === 'English' ? '#ef4444' : '#10b981',
    background: p === 'English' ? '#fef2f2' : '#f0fdf4',
    padding: '2px 8px', 
    borderRadius: 10 
  }),
  dailyScheduleLevel: { 
    fontSize: 10, 
    color: '#64748b',
    background: '#f1f5f9', 
    padding: '2px 8px', 
    borderRadius: 10 
  },
  dailyScheduleTeacherId: { 
    fontSize: 9, 
    color: '#3b82f6',
    background: '#eef2ff', 
    padding: '2px 6px', 
    borderRadius: 10,
    fontFamily: 'monospace', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 2 
  },
  dailyScheduleFooter: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingTop: 10,
    borderTop: '1px solid #e2e8f0' 
  },
  dailyScheduleStudents: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6,
    fontSize: 12, 
    color: '#64748b' 
  },
  dailyScheduleDetailBtn: { 
    padding: '6px 12px', 
    background: '#e0e7ff', 
    color: '#3730a3', 
    border: 'none', 
    borderRadius: 6,
    cursor: 'pointer', 
    fontSize: 11, 
    fontWeight: 'bold',
    display: 'flex', 
    alignItems: 'center', 
    gap: 4,
    transition: '0.2s'
  },
  dailyStudentPreview: { 
    display: 'flex', 
    gap: 4, 
    flexWrap: 'wrap', 
    marginTop: 10, 
    paddingTop: 10,
    borderTop: '1px solid #e2e8f0' 
  },
  dailyStudentChip: { 
    background: '#e0e7ff', 
    color: '#3730a3',
    padding: '2px 8px', 
    borderRadius: 10,
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  dailyStudentMore: { 
    fontSize: 10, 
    color: '#94a3b8', 
    fontStyle: 'italic' 
  },

  // Detail Modal
  detailOverlay: { 
    position: 'fixed', 
    top: 0, 
    left: 0, 
    width: '100%', 
    height: '100%', 
    background: 'rgba(0,0,0,0.6)',
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    zIndex: 2000,
    backdropFilter: 'blur(2px)' 
  },
  detailModal: { 
    background: 'white', 
    padding: 30, 
    borderRadius: 20, 
    width: '90%', 
    maxWidth: 500,
    maxHeight: '80vh', 
    overflowY: 'auto',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease' 
  },
  detailHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 16,
    paddingBottom: 12, 
    borderBottom: '1px solid #f1f5f9' 
  },
  detailTitle: { margin: 0, fontSize: 18, color: '#1e293b' },
  detailCloseBtn: { 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    color: '#94a3b8',
    transition: '0.2s'
  },
  detailContent: { display: 'flex', flexDirection: 'column', gap: 8 },
  detailRow: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '6px 0', 
    borderBottom: '1px solid #f1f5f9',
    fontSize: 13 
  },
  detailTeacherId: { 
    marginLeft: 8, 
    fontSize: 10, 
    color: '#3b82f6',
    background: '#eef2ff', 
    padding: '2px 6px', 
    borderRadius: 4,
    fontFamily: 'monospace' 
  },
  detailMapelId: {
    marginLeft: 8,
    fontSize: 10,
    color: '#8b5cf6',
    background: '#ede9fe',
    padding: '2px 6px',
    borderRadius: 4,
    fontFamily: 'monospace'
  },
  detailDivider: { height: 1, background: '#e2e8f0', margin: '10px 0' },
  detailStudentTitle: { fontSize: 14, margin: '0 0 8px', color: '#1e293b' },
  detailStudentList: { display: 'flex', flexDirection: 'column', gap: 4 },
  detailStudentItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 8,
    padding: '6px 8px', 
    background: '#f8fafc', 
    borderRadius: 6,
    fontSize: 12 
  },
  detailStudentNum: { color: '#94a3b8', minWidth: 24 },
  detailStudentName: { fontWeight: '500', flex: 1 },
  detailStudentId: { fontSize: 9, color: '#94a3b8', fontFamily: 'monospace' },
  detailStudentKelas: { 
    fontSize: 9, 
    background: '#eef2ff', 
    color: '#3b82f6',
    padding: '1px 6px', 
    borderRadius: 4 
  },
  detailEmptyStudents: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },

  // Legend
  legend: { 
    display: 'flex', 
    gap: 16, 
    marginTop: 16,
    padding: '12px 16px', 
    background: 'white',
    borderRadius: 10, 
    border: '1px solid #f1f5f9',
    flexWrap: 'wrap' 
  },
  legendItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 6, 
    fontSize: 11, 
    color: '#64748b' 
  },
  legendDot: { width: 10, height: 10, borderRadius: '50%' },
};

// Tambahkan keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleSheet);

export default TeacherSchedule;