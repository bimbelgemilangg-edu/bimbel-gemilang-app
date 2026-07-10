// src/pages/teacher/TeacherAttendance.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { 
  collection, query, where, getDocs, doc, getDoc, addDoc, 
  onSnapshot, updateDoc, serverTimestamp 
} from "firebase/firestore";
import { 
  Calendar, Clock, MapPin, Users, BookOpen, 
  CheckCircle, XCircle, AlertCircle, Search,
  User, FileText, ChevronLeft, ChevronRight
} from 'lucide-react';

const TeacherAttendance = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // Data guru
  const [guru, setGuru] = useState(null);
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceLogs, setAttendanceLogs] = useState({});
  const [todayCode, setTodayCode] = useState("");
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [attendanceList, setAttendanceList] = useState([]);

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
        setGuru(data);
      } catch (e) {
        console.error("Error parsing teacher data:", e);
      }
    }
  }, []);

  // Fetch jadwal hari ini
  useEffect(() => {
    if (!guru?.nama) return;

    const dateStr = getDateStr(selectedDate);
    setLoading(true);

    const q = query(
      collection(db, "jadwal_bimbel"),
      where("teacherName", "==", guru.nama),
      where("dateStr", "==", dateStr)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setSchedules(data);
      
      // Load attendance untuk setiap jadwal
      data.forEach(s => {
        loadAttendance(s.id);
      });
      
      setLoading(false);
    }, (error) => {
      console.error("Error fetching schedules:", error);
      setLoading(false);
    });

    // Fetch daily code
    fetchDailyCode(dateStr);

    return () => unsubscribe();
  }, [guru, selectedDate]);

  const fetchDailyCode = async (dateStr) => {
    try {
      const docRef = doc(db, "settings", `daily_code_${dateStr}`);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setTodayCode(docSnap.data().code || "");
      } else {
        setTodayCode("");
      }
    } catch (e) {
      console.error("Error fetching daily code:", e);
    }
  };

  const loadAttendance = async (scheduleId) => {
    try {
      const docRef = doc(db, "jadwal_bimbel", scheduleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAttendanceLogs(prev => ({
          ...prev,
          [scheduleId]: data.attendance_list || []
        }));
      }
    } catch (e) {
      console.error("Error loading attendance:", e);
    }
  };

  const getDateStr = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleOpenAttendance = (schedule) => {
    setSelectedSchedule(schedule);
    const students = schedule.students || [];
    const attendance = attendanceLogs[schedule.id] || [];
    
    // Merge student data with attendance status
    const merged = students.map(student => {
      const existing = attendance.find(a => 
        a.studentId === student.studentId || a.id === student.id
      );
      return {
        ...student,
        status: existing?.status || 'Belum',
        checkInTime: existing?.checkInTime || null,
        note: existing?.note || ''
      };
    });
    
    setAttendanceList(merged);
    setShowModal(true);
  };

  const handleUpdateAttendance = async (studentId, status) => {
    if (!selectedSchedule) return;
    
    // Update local state
    const updated = attendanceList.map(s => {
      if (s.studentId === studentId || s.id === studentId) {
        return {
          ...s,
          status: status,
          checkInTime: status === 'Hadir' ? new Date().toLocaleTimeString() : null
        };
      }
      return s;
    });
    setAttendanceList(updated);
  };

  const handleSaveAttendance = async () => {
    if (!selectedSchedule) return;
    
    try {
      // Filter hanya yang sudah diisi
      const attendanceData = attendanceList
        .filter(s => s.status !== 'Belum')
        .map(s => ({
          studentId: s.studentId || s.id,
          nama: s.nama,
          status: s.status,
          checkInTime: s.checkInTime || null,
          note: s.note || ''
        }));

      await updateDoc(doc(db, "jadwal_bimbel", selectedSchedule.id), {
        attendance_list: attendanceData,
        updatedAt: serverTimestamp()
      });

      // Update local state
      setAttendanceLogs(prev => ({
        ...prev,
        [selectedSchedule.id]: attendanceData
      }));

      alert("✅ Absensi berhasil disimpan!");
      setShowModal(false);
    } catch (e) {
      console.error("Error saving attendance:", e);
      alert("❌ Gagal menyimpan absensi: " + e.message);
    }
  };

  const handleDateChange = (days) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Hadir': return '#22c55e';
      case 'Sakit': return '#f59e0b';
      case 'Izin': return '#3b82f6';
      case 'Alpha': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Hadir': return <CheckCircle size={14} color="#22c55e" />;
      case 'Sakit': return <AlertCircle size={14} color="#f59e0b" />;
      case 'Izin': return <FileText size={14} color="#3b82f6" />;
      case 'Alpha': return <XCircle size={14} color="#ef4444" />;
      default: return <Clock size={14} color="#94a3b8" />;
    }
  };

  // Tampilan Loading
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p>Memuat jadwal...</p>
      </div>
    );
  }

  // Tampilan Utama
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            <Users size={24} color="#3b82f6" /> Absensi Siswa
          </h2>
          <p style={styles.subtitle}>
            Kelola kehadiran siswa untuk jadwal mengajar Anda
          </p>
        </div>
        {todayCode && (
          <div style={styles.codeBox}>
            <span style={styles.codeLabel}>📋 Kode Absensi:</span>
            <span style={styles.codeValue}>{todayCode}</span>
          </div>
        )}
      </div>

      {/* Date Navigator */}
      <div style={styles.dateNav}>
        <button 
          onClick={() => handleDateChange(-1)} 
          style={styles.dateNavBtn}
        >
          <ChevronLeft size={18} />
        </button>
        <div style={styles.dateDisplay}>
          <span style={styles.dateDay}>
            {selectedDate.toLocaleDateString('id-ID', { weekday: 'long' })}
          </span>
          <span style={styles.dateFull}>
            {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>
        <button 
          onClick={() => handleDateChange(1)} 
          style={styles.dateNavBtn}
        >
          <ChevronRight size={18} />
        </button>
        <button 
          onClick={() => setSelectedDate(new Date())} 
          style={styles.todayBtn}
        >
          Hari Ini
        </button>
      </div>

      {/* Schedule List */}
      {schedules.length === 0 ? (
        <div style={styles.emptyState}>
          <Calendar size={48} color="#cbd5e1" />
          <h3>Tidak ada jadwal</h3>
          <p>Tidak ada jadwal mengajar pada tanggal ini</p>
        </div>
      ) : (
        <div style={styles.scheduleList}>
          {schedules.map((schedule) => {
            const attendance = attendanceLogs[schedule.id] || [];
            const totalStudents = schedule.students?.length || 0;
            const present = attendance.filter(a => a.status === 'Hadir').length;
            
            return (
              <div key={schedule.id} style={styles.scheduleCard}>
                <div style={styles.scheduleHeader}>
                  <div style={styles.scheduleInfo}>
                    <span style={styles.scheduleTime}>
                      <Clock size={14} /> {schedule.start} - {schedule.end}
                    </span>
                    <span style={styles.schedulePlanet}>
                      <MapPin size={14} /> {schedule.planet || 'Ruang'}
                    </span>
                  </div>
                  <span style={styles.scheduleProgram(schedule.program)}>
                    {schedule.program || 'Reguler'}
                  </span>
                </div>

                <div style={styles.scheduleBody}>
                  <h4 style={styles.scheduleTitle}>
                    {schedule.title || schedule.mapelName || 'Materi Umum'}
                  </h4>
                  <div style={styles.scheduleMeta}>
                    <span>📚 {schedule.level || 'SD'}</span>
                    <span>👨‍🏫 {schedule.teacherName || schedule.booker}</span>
                  </div>
                </div>

                <div style={styles.scheduleFooter}>
                  <div style={styles.attendanceStats}>
                    <span style={styles.statItem}>
                      <Users size={14} /> {totalStudents} siswa
                    </span>
                    <span style={styles.statItem}>
                      <CheckCircle size={14} color="#22c55e" /> {present} hadir
                    </span>
                    <span style={styles.statItem}>
                      <Clock size={14} color="#94a3b8" /> {totalStudents - present} belum
                    </span>
                  </div>
                  <button 
                    onClick={() => handleOpenAttendance(schedule)} 
                    style={styles.absensiBtn}
                  >
                    <CheckCircle size={16} /> Absensi
                  </button>
                </div>

                {/* Preview attendance status */}
                {attendance.length > 0 && (
                  <div style={styles.attendancePreview}>
                    {attendance.slice(0, 5).map((a, i) => (
                      <span key={i} style={{...styles.attendanceChip, background: getStatusColor(a.status)}}>
                        {a.nama?.split(' ')[0]}
                      </span>
                    ))}
                    {attendance.length > 5 && (
                      <span style={styles.attendanceMore}>+{attendance.length - 5}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Absensi */}
      {showModal && selectedSchedule && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>📋 Absensi Siswa</h3>
                <p style={styles.modalSubtitle}>
                  {selectedSchedule.title || selectedSchedule.mapelName || 'Materi'} - 
                  {selectedSchedule.start} {selectedSchedule.end}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={styles.modalClose}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              {attendanceList.length === 0 ? (
                <div style={styles.modalEmpty}>
                  <Users size={32} color="#cbd5e1" />
                  <p>Belum ada siswa terdaftar</p>
                </div>
              ) : (
                <div style={styles.studentList}>
                  {attendanceList.map((student, index) => (
                    <div key={student.studentId || student.id || index} style={styles.studentItem}>
                      <div style={styles.studentInfo}>
                        <span style={styles.studentName}>{student.nama || 'Siswa'}</span>
                        {student.studentId && (
                          <span style={styles.studentId}>#{student.studentId}</span>
                        )}
                        <span style={styles.studentKelas}>{student.kelas || student.kelasSekolah || '-'}</span>
                      </div>
                      <div style={styles.statusButtons}>
                        {['Hadir', 'Sakit', 'Izin', 'Alpha'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleUpdateAttendance(student.studentId || student.id, status)}
                            style={styles.statusBtn(
                              student.status === status,
                              getStatusColor(status)
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowModal(false)} style={styles.btnCancel}>
                Batal
              </button>
              <button onClick={handleSaveAttendance} style={styles.btnSave}>
                <CheckCircle size={16} /> Simpan Absensi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    width: '100%'
  },
  
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px',
    color: '#94a3b8'
  },
  
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    marginBottom: '24px'
  },
  
  title: {
    margin: 0,
    fontSize: '22px',
    fontWeight: '800',
    color: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  
  subtitle: {
    margin: '4px 0 0',
    color: '#64748b',
    fontSize: '13px'
  },
  
  codeBox: {
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '10px 16px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  
  codeLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#166534'
  },
  
  codeValue: {
    fontSize: '20px',
    fontWeight: '900',
    color: '#166534',
    fontFamily: 'monospace',
    letterSpacing: '4px'
  },
  
  dateNav: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'white',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
    flexWrap: 'wrap'
  },
  
  dateNavBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: '0.2s'
  },
  
  dateDisplay: {
    flex: 1,
    textAlign: 'center'
  },
  
  dateDay: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  
  dateFull: {
    display: 'block',
    fontSize: '12px',
    color: '#64748b'
  },
  
  todayBtn: {
    padding: '6px 14px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    transition: '0.2s'
  },
  
  emptyState: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '12px',
    border: '2px dashed #e2e8f0',
    color: '#94a3b8'
  },
  
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  
  scheduleCard: {
    background: 'white',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: '0.2s'
  },
  
  scheduleHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
    flexWrap: 'wrap',
    gap: '8px'
  },
  
  scheduleInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '12px',
    color: '#64748b'
  },
  
  scheduleTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: 'bold',
    color: '#3b82f6'
  },
  
  schedulePlanet: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  
  scheduleProgram: (program) => ({
    fontSize: '10px',
    fontWeight: 'bold',
    color: program === 'English' ? '#ef4444' : '#10b981',
    background: program === 'English' ? '#fef2f2' : '#f0fdf4',
    padding: '4px 10px',
    borderRadius: '10px'
  }),
  
  scheduleBody: {
    marginBottom: '12px'
  },
  
  scheduleTitle: {
    margin: '0 0 4px',
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  
  scheduleMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#94a3b8'
  },
  
  scheduleFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9'
  },
  
  attendanceStats: {
    display: 'flex',
    gap: '12px',
    fontSize: '12px',
    color: '#64748b'
  },
  
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  
  absensiBtn: {
    padding: '8px 16px',
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: '0.2s'
  },
  
  attendancePreview: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginTop: '10px',
    paddingTop: '10px',
    borderTop: '1px solid #f1f5f9'
  },
  
  attendanceChip: {
    padding: '2px 8px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold'
  },
  
  attendanceMore: {
    fontSize: '10px',
    color: '#94a3b8',
    padding: '2px 4px'
  },
  
  // Modal
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(2px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
    animation: 'slideUp 0.3s ease'
  },
  
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '16px'
  },
  
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  
  modalSubtitle: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  
  modalClose: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#94a3b8',
    padding: '4px',
    transition: '0.2s'
  },
  
  modalBody: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '16px'
  },
  
  modalEmpty: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8'
  },
  
  studentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  
  studentItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
    flexWrap: 'wrap',
    gap: '8px'
  },
  
  studentInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexWrap: 'wrap'
  },
  
  studentName: {
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#1e293b'
  },
  
  studentId: {
    fontSize: '10px',
    color: '#94a3b8',
    fontFamily: 'monospace'
  },
  
  studentKelas: {
    fontSize: '10px',
    color: '#3b82f6',
    background: '#eef2ff',
    padding: '2px 8px',
    borderRadius: '10px'
  },
  
  statusButtons: {
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap'
  },
  
  statusBtn: (active, color) => ({
    padding: '4px 10px',
    borderRadius: '6px',
    border: active ? `2px solid ${color}` : '1px solid #e2e8f0',
    background: active ? color : 'white',
    color: active ? 'white' : '#64748b',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: active ? 'bold' : 'normal',
    transition: '0.2s'
  }),
  
  modalFooter: {
    display: 'flex',
    gap: '10px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
    justifyContent: 'flex-end'
  },
  
  btnCancel: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    color: '#64748b'
  },
  
  btnSave: {
    padding: '10px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#22c55e',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  }
};

// Tambahkan keyframes
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(styleSheet);

export default TeacherAttendance;