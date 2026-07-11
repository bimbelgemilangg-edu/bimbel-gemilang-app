// src/pages/admin/schedule/SchedulePage.jsx
import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, getDocs, deleteDoc, doc, writeBatch, updateDoc, 
  setDoc, getDoc, addDoc, query, where, orderBy 
} from "firebase/firestore";
import { 
  Search, Plus, Edit3, Trash2, X, Save, Calendar, Clock, MapPin, 
  BookOpen, Users, GraduationCap, Filter, RefreshCw, ChevronLeft, 
  ChevronRight, Home, ChevronRight as ChevronRightIcon, Flag, Eye, EyeOff,
  Copy, CheckCircle, AlertCircle, Hash, Tag, Link as LinkIcon,
  User, UserPlus, Shield, BadgeCheck, Sparkles, Database, Layers,
  Palette, PenTool, CalendarDays
} from 'lucide-react';

// ============================================================
// DATA HARI LIBUR NASIONAL INDONESIA
// ============================================================
const INDONESIAN_HOLIDAYS = {
  '2025-01-01': { name: 'Tahun Baru 2025 Masehi' },
  '2025-01-27': { name: 'Isra Mikraj Nabi Muhammad SAW' },
  '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili' },
  '2025-03-29': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)' },
  '2025-03-31': { name: 'Idul Fitri 1446 Hijriah' },
  '2025-04-01': { name: 'Idul Fitri 1446 Hijriah (Hari 2)' },
  '2025-04-18': { name: 'Wafat Yesus Kristus' },
  '2025-05-01': { name: 'Hari Buruh Internasional' },
  '2025-05-12': { name: 'Hari Raya Waisak 2569 BE' },
  '2025-05-29': { name: 'Kenaikan Yesus Kristus' },
  '2025-06-01': { name: 'Hari Lahir Pancasila' },
  '2025-06-07': { name: 'Idul Adha 1446 Hijriah' },
  '2025-06-27': { name: 'Tahun Baru Islam 1447 Hijriah' },
  '2025-08-17': { name: 'Hari Kemerdekaan RI' },
  '2025-09-05': { name: 'Maulid Nabi Muhammad SAW' },
  '2025-12-25': { name: 'Hari Raya Natal' },
  '2026-01-01': { name: 'Tahun Baru 2026 Masehi' },
};

// ============================================================
// CONSTANTS
// ============================================================
const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const LEVELS = ["SD", "SMP", "SMA", "Umum"];
const KELAS_LIST = ["Semua", "1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD", "7 SMP", "8 SMP", "9 SMP", "10 SMA", "11 SMA", "12 SMA", "Alumni", "Umum"];
const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Warna preset untuk event
const EVENT_COLORS = [
  '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
];

const SchedulePage = () => {
  // ============================================================
  // STATES
  // ============================================================
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState(null);
  
  // Data
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  const [availableMapel, setAvailableMapel] = useState([]);
  
  // Custom Events
  const [customEvents, setCustomEvents] = useState([]);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventIndex, setEditingEventIndex] = useState(null);
  const [eventForm, setEventForm] = useState({ 
    date: '', 
    label: '', 
    color: '#f59e0b',
    description: ''
  });
  
  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('daily');
  
  // Daily Code
  const [dailyCode, setDailyCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState("");
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [editId, setEditId] = useState(null);
  
  // Form
  const defaultForm = {
    start: "14:00", 
    end: "15:30",
    program: "Reguler",
    level: "SD",
    title: "",
    mapelId: "",
    mapelName: "",
    teacherId: "",
    teacherName: "",
    selectedStudents: [],
    repeat: "Once"
  };
  const [formData, setFormData] = useState(defaultForm);
  
  // Student filter in modal
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterKelas, setStudentFilterKelas] = useState("Semua");
  
  // Detail modal
  const [detailSchedule, setDetailSchedule] = useState(null);

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const showAlert = (msg, duration = 3000) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), duration);
  };

  // ============================================================
  // HELPER: Date String
  // ============================================================
  const getSmartDateString = (dateObj) => {
    if (!(dateObj instanceof Date) || isNaN(dateObj)) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
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
      dates.push(getSmartDateString(nextDate));
    }
    return dates;
  };

  const isHoliday = (dateStr) => INDONESIAN_HOLIDAYS[dateStr] || null;
  const isSunday = (dateObj) => dateObj.getDay() === 0;

  const getCustomEvent = (dateStr) => {
    return customEvents.find(e => e.date === dateStr);
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch schedules
      const schedSnap = await getDocs(collection(db, "jadwal_bimbel"));
      setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 2. Fetch teachers
      const tSnap = await getDocs(collection(db, "teachers"));
      const teachers = tSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        guruId: d.data().guruId || 'GURU-' + String(d.id).slice(0, 4)
      }));
      setAvailableTeachers(teachers);

      // 3. Fetch students
      const sSnap = await getDocs(collection(db, "students"));
      const students = sSnap.docs.map(d => {
        const data = d.data();
        const kelasSekolah = data.kelasSekolah || '';
        
        let jenjang = data.jenjang || '';
        if (!jenjang) {
          if (kelasSekolah.includes('SD')) {
            jenjang = 'SD';
          } else if (kelasSekolah.includes('SMP')) {
            jenjang = 'SMP';
          } else if (kelasSekolah.includes('SMA')) {
            jenjang = 'SMA';
          } else {
            jenjang = 'Umum';
          }
        }
        
        return {
          id: d.id,
          ...data,
          studentId: data.studentId || d.id,
          jenjang: jenjang
        };
      });
      setAvailableStudents(students);

      // 4. Fetch mapel
      const mSnap = await getDocs(collection(db, "mapel"));
      const mapelData = mSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        kodeMapel: d.data().kodeMapel || 'MAPEL-' + String(d.id).slice(0, 4)
      }));
      setAvailableMapel(mapelData);

      // 5. Fetch daily code
      const todayStr = getSmartDateString(selectedDate);
      const codeDocId = 'daily_code_' + todayStr;
      const cSnap = await getDoc(doc(db, "settings", codeDocId));
      if (cSnap.exists()) {
        setDailyCode(cSnap.data().code);
        setTempCode(cSnap.data().code);
      } else {
        setDailyCode("⚠️ Belum Diset");
        setTempCode("");
      }

      // 6. Fetch custom events
      const eventDoc = await getDoc(doc(db, "settings", "calendar_events"));
      if (eventDoc.exists()) {
        setCustomEvents(eventDoc.data().events || []);
      } else {
        setCustomEvents([]);
      }
    } catch (e) {
      console.error("Fetch Error:", e);
      showAlert("❌ Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  // ============================================================
  // HANDLERS - CUSTOM EVENTS
  // ============================================================
  const handleOpenEventModal = (dateStr = null) => {
    setEditingEventIndex(null);
    setEventForm({
      date: dateStr || getSmartDateString(selectedDate),
      label: '',
      color: '#f59e0b',
      description: ''
    });
    setIsEventModalOpen(true);
  };

  const handleEditEvent = (index) => {
    const event = customEvents[index];
    setEditingEventIndex(index);
    setEventForm({
      date: event.date,
      label: event.label,
      color: event.color || '#f59e0b',
      description: event.description || ''
    });
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async () => {
    if (!eventForm.date || !eventForm.label) {
      return showAlert("⚠️ Tanggal dan label wajib diisi!");
    }

    try {
      const docRef = doc(db, "settings", "calendar_events");
      let events = [...customEvents];

      if (editingEventIndex !== null) {
        events[editingEventIndex] = { ...eventForm };
      } else {
        const existing = events.findIndex(e => e.date === eventForm.date);
        if (existing >= 0) {
          if (!window.confirm('Tanggal ' + eventForm.date + ' sudah memiliki event. Ganti dengan yang baru?')) {
            return;
          }
          events[existing] = { ...eventForm };
        } else {
          events.push({ ...eventForm });
        }
      }

      await setDoc(docRef, { events }, { merge: true });
      setCustomEvents(events);
      setIsEventModalOpen(false);
      showAlert("✅ Event berhasil disimpan!");
      fetchData();
    } catch (e) {
      showAlert("❌ Gagal menyimpan event: " + e.message);
    }
  };

  const handleDeleteEvent = async (index) => {
    if (!window.confirm('Hapus event "' + customEvents[index].label + '"?')) return;
    
    try {
      const events = customEvents.filter((_, i) => i !== index);
      await setDoc(doc(db, "settings", "calendar_events"), { events }, { merge: true });
      setCustomEvents(events);
      showAlert("🗑️ Event dihapus!");
      fetchData();
    } catch (e) {
      showAlert("❌ Gagal menghapus event: " + e.message);
    }
  };

  // ============================================================
  // HANDLERS - SCHEDULES
  // ============================================================
  const handleTeacherSelect = (teacherId) => {
    const teacher = availableTeachers.find(t => t.id === teacherId || t.guruId === teacherId);
    if (teacher) {
      setFormData({
        ...formData,
        teacherId: teacher.guruId || teacher.id,
        teacherName: teacher.nama,
        mapelId: teacher.kodeMapel || '',
        mapelName: teacher.mapel || ''
      });
    } else {
      setFormData({
        ...formData,
        teacherId: '',
        teacherName: '',
        mapelId: '',
        mapelName: ''
      });
    }
  };

  const handleMapelSelect = (mapelId) => {
    const mapel = availableMapel.find(m => m.id === mapelId || m.kodeMapel === mapelId);
    if (mapel) {
      setFormData({
        ...formData,
        mapelId: mapel.kodeMapel || mapel.id,
        mapelName: mapel.namaMapel
      });
    }
  };

  const handleOpenModal = (planet, isEdit = false, item = null) => {
    setActivePlanet(planet);
    setStudentSearch("");
    setStudentFilterKelas("Semua");
    
    if (isEdit && item) {
      setEditId(item.id);
      setFormData({
        start: item.start || "14:00",
        end: item.end || "15:30",
        program: item.program || "Reguler",
        level: item.level || "SD",
        title: item.title || "",
        mapelId: item.mapelId || item.kodeMapel || "",
        mapelName: item.mapelName || item.mapel || "",
        teacherId: item.teacherId || "",
        teacherName: item.teacherName || item.booker || "",
        selectedStudents: item.students ? item.students.map(s => s.studentId || s.id) : [],
        repeat: "Once"
      });
    } else {
      setEditId(null);
      setFormData({ ...defaultForm });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.teacherId) return showAlert("❌ Pilih guru terlebih dahulu!");
    if (!formData.mapelId) return showAlert("❌ Pilih mata pelajaran!");

    try {
      const studentsFullData = formData.selectedStudents.map(sid => {
        const s = availableStudents.find(stud => 
          stud.id === sid || stud.studentId === sid
        );
        return s ? {
          id: s.id,
          studentId: s.studentId || s.id,
          nama: s.nama,
          kelas: s.kelasSekolah || "-",
          program: s.detailProgram || formData.program || "Reguler",
          kelasSekolah: s.kelasSekolah || "-"
        } : null;
      }).filter(Boolean);

      const scheduleData = {
        planet: activePlanet,
        program: formData.program,
        level: formData.level,
        title: formData.title,
        mapelId: formData.mapelId,
        mapelName: formData.mapelName,
        teacherId: formData.teacherId,
        teacherName: formData.teacherName,
        start: formData.start,
        end: formData.end,
        students: studentsFullData,
        studentIds: studentsFullData.map(s => s.studentId),
        dateStr: getSmartDateString(selectedDate),
        status: "scheduled",
        updatedAt: new Date().toISOString()
      };

      if (editId) {
        await updateDoc(doc(db, "jadwal_bimbel", editId), scheduleData);
        showAlert("✅ Jadwal berhasil diperbarui!");
      } else {
        const batch = writeBatch(db);
        let tempDate = new Date(selectedDate);
        const loopCount = formData.repeat === 'Monthly' ? 4 : 1;

        for (let i = 0; i < loopCount; i++) {
          const newRef = doc(collection(db, "jadwal_bimbel"));
          batch.set(newRef, {
            ...scheduleData,
            dateStr: getSmartDateString(tempDate),
            createdAt: new Date().toISOString(),
            attendance_list: []
          });
          tempDate.setDate(tempDate.getDate() + 7);
        }
        await batch.commit();
        showAlert("✅ " + loopCount + " jadwal berhasil dibuat!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      showAlert("❌ Gagal menyimpan: " + error.message);
    }
  };

  const handleUpdateCode = async () => {
    try {
      const todayStr = getSmartDateString(selectedDate);
      const codeDocId = 'daily_code_' + todayStr;
      await setDoc(doc(db, "settings", codeDocId), {
        code: tempCode,
        updatedAt: new Date().toISOString()
      });
      setDailyCode(tempCode);
      setIsEditingCode(false);
      showAlert("✅ Kode absensi berhasil disimpan!");
    } catch (error) {
      showAlert("❌ Gagal update kode: " + error.message);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Hapus jadwal ini?")) return;
    try {
      await deleteDoc(doc(db, "jadwal_bimbel", scheduleId));
      showAlert("🗑️ Jadwal dihapus!");
      fetchData();
    } catch (error) {
      showAlert("❌ Gagal menghapus: " + error.message);
    }
  };

  // ============================================================
  // 🔥 FILTERED STUDENTS FOR MODAL - PERBAIKAN LENGKAP
  // ============================================================
  const getFilteredStudents = () => {
    return availableStudents.filter(s => {
      const studentId = s.studentId || s.id;
      if (!studentId) return false;
      
      // 🔥 FILTER BERDASARKAN PILIHAN KELAS (studentFilterKelas)
      if (studentFilterKelas !== 'Semua') {
        // Jika filter kelas spesifik, cek apakah kelasSekolah sama persis
        if (s.kelasSekolah !== studentFilterKelas) {
          return false;
        }
      } else {
        // Jika filter kelas "Semua", filter berdasarkan jenjang (formData.level)
        if (formData.level !== 'Umum') {
          const kelas = s.kelasSekolah || '';
          const jenjang = s.jenjang || '';
          
          const matchKelas = kelas.includes(formData.level);
          const matchJenjang = jenjang === formData.level;
          
          if (!matchKelas && !matchJenjang) return false;
        }
      }
      
      // 🔥 SEARCH (nama atau ID)
      const searchLower = studentSearch.toLowerCase();
      const matchNama = (s.nama || '').toLowerCase().includes(searchLower);
      const matchId = (studentId || '').toLowerCase().includes(searchLower);
      
      return matchNama || matchId;
    });
  };

  // ============================================================
  // RENDER: Calendar Mini with Events
  // ============================================================
  const renderMiniCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const today = new Date();
    const todayStr = getSmartDateString(today);
    const selStr = getSmartDateString(selectedDate);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={'empty-' + i} style={styles.miniDayEmpty}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = getSmartDateString(dateObj);
      const isSel = dateStr === selStr;
      const isToday = dateStr === todayStr;
      const holiday = isHoliday(dateStr);
      const isRed = holiday || isSunday(dateObj);
      const hasSchedule = schedules.some(s => s.dateStr === dateStr);
      const customEvent = getCustomEvent(dateStr);

      days.push(
        <div
          key={d}
          onClick={() => setSelectedDate(dateObj)}
          style={styles.miniDay(isSel, isRed, isToday, customEvent)}
          title={customEvent ? '📌 ' + customEvent.label : holiday ? '🔴 ' + holiday.name : hasSchedule ? 'Ada jadwal' : ''}
        >
          <span style={styles.miniDayNum(isSel, isRed, isToday)}>{d}</span>
          {customEvent && !isSel && (
            <div style={{...styles.miniEventDot, background: customEvent.color || '#f59e0b'}} />
          )}
          {hasSchedule && !isSel && !customEvent && <div style={styles.miniDayDot}></div>}
          {holiday && <Flag size={8} style={{color: '#ef4444', position: 'absolute', top: 2, right: 2}} />}
        </div>
      );
    }

    return days;
  };

  // ============================================================
  // RENDER: Daily View
  // ============================================================
  const renderDailyView = () => {
    const dateStr = getSmartDateString(selectedDate);
    const customEvent = getCustomEvent(dateStr);

    return (
      <div style={styles.planetGrid}>
        {customEvent && (
          <div style={{...styles.eventBanner, background: customEvent.color || '#f59e0b'}}>
            <div style={styles.eventBannerContent}>
              <CalendarDays size={18} color="white" />
              <span style={styles.eventBannerLabel}>{customEvent.label}</span>
              {customEvent.description && (
                <span style={styles.eventBannerDesc}>{customEvent.description}</span>
              )}
            </div>
            <button 
              onClick={() => {
                const idx = customEvents.findIndex(e => e.date === customEvent.date);
                handleEditEvent(idx);
              }}
              style={styles.eventBannerEdit}
            >
              <Edit3 size={12} /> Edit
            </button>
          </div>
        )}

        {PLANETS.map(planet => {
          const items = schedules.filter(s => s.planet === planet && s.dateStr === dateStr);
          return (
            <div key={planet} style={styles.planetCard}>
              <div style={styles.planetHeader}>
                <h4 style={styles.planetName}>🪐 {planet}</h4>
                <span style={styles.planetCount}>{items.length} sesi</span>
                <button onClick={() => handleOpenModal(planet)} style={styles.btnAddSmall}>
                  <Plus size={12} /> Tambah
                </button>
              </div>
              <div style={styles.planetBody}>
                {items.length === 0 ? (
                  <div style={styles.emptyPlanet}>Kosong</div>
                ) : (
                  items.map(item => {
                    return (
                      <div key={item.id} style={styles.scheduleItem}>
                        <div style={styles.scheduleTop}>
                          <span style={styles.timeBadge}>⏰ {item.start} - {item.end}</span>
                          <span style={styles.programBadge(item.program)}>{item.program}</span>
                        </div>
                        <div style={styles.scheduleTitle}>{item.title || "Materi Umum"}</div>
                        
                        <div style={styles.scheduleCodes}>
                          {item.teacherId && (
                            <span style={styles.codeBadgeTeacher}>
                              <Hash size={10} /> {item.teacherId}
                            </span>
                          )}
                          {item.mapelId && (
                            <span style={styles.codeBadgeMapel}>
                              <Tag size={10} /> {item.mapelId}
                            </span>
                          )}
                        </div>
                        
                        <div style={styles.scheduleInfo}>
                          <span>👨‍🏫 <b>{item.teacherName || item.booker}</b></span>
                          <span>📚 {item.level || "SD"}</span>
                          <span>👥 {item.students?.length || 0} siswa</span>
                        </div>
                        
                        {item.students && item.students.length > 0 && (
                          <div style={styles.studentPreview}>
                            {item.students.slice(0, 3).map((s, i) => (
                              <span key={i} style={styles.studentChip} title={s.nama + ' (' + (s.studentId || s.id) + ')'}>
                                {s.nama?.split(' ')[0]}
                                <span style={styles.studentIdChip}>#{s.studentId?.slice(-4) || s.id?.slice(-4)}</span>
                              </span>
                            ))}
                            {item.students.length > 3 && <span style={styles.studentMore}>+{item.students.length - 3}</span>}
                          </div>
                        )}
                        
                        <div style={styles.scheduleActions}>
                          <button onClick={() => handleOpenModal(planet, true, item)} style={styles.btnEditSm}>
                            <Edit3 size={12} /> Edit
                          </button>
                          <button onClick={() => setDetailSchedule(item)} style={styles.btnDetailSm}>
                            <Eye size={12} /> Detail
                          </button>
                          <button onClick={() => handleDelete(item.id)} style={styles.btnDeleteSm}>
                            <Trash2 size={12} /> Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER: Weekly View with Events
  // ============================================================
  const renderWeeklyView = () => {
    const weekDates = getWeekDates(selectedDate);
    return (
      <div style={styles.weeklyGrid}>
        {weekDates.map(dateStr => {
          const dateObj = new Date(dateStr);
          const dayName = DAYS_ID[dateObj.getDay()];
          const isToday = dateStr === getSmartDateString(new Date());
          const items = schedules.filter(s => s.dateStr === dateStr);
          const holiday = isHoliday(dateStr);
          const customEvent = getCustomEvent(dateStr);

          return (
            <div key={dateStr} style={styles.weeklyDay(isToday, !!holiday, !!customEvent)}>
              <div style={styles.weeklyHeader}>
                <span style={styles.weeklyDayName(!!holiday || isSunday(dateObj))}>{dayName}</span>
                <span style={styles.weeklyDate}>{dateObj.getDate()}/{dateObj.getMonth() + 1}</span>
                {customEvent && (
                  <div style={{...styles.weeklyEventBadge, background: customEvent.color || '#f59e0b'}}>
                    📌 {customEvent.label}
                  </div>
                )}
                {holiday && <Flag size={10} color="#ef4444" />}
              </div>
              <div style={styles.weeklyBody}>
                {items.length === 0 ? (
                  <span style={styles.weeklyEmpty}>-</span>
                ) : (
                  items.map(item => (
                    <div key={item.id} style={styles.weeklyItem}>
                      <span style={styles.weeklyTime}>{item.start}</span>
                      <span style={styles.weeklyPlanet}>🪐 {item.planet}</span>
                      <span style={styles.weeklyTitle}>{item.title || item.mapelName || 'Materi'}</span>
                      <span style={styles.weeklyTeacher}>👨‍🏫 {item.teacherName || item.booker}</span>
                      {item.teacherId && (
                        <span style={styles.weeklyIdBadge}>{item.teacherId}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER: Detail Modal
  // ============================================================
  const renderDetailModal = () => {
    if (!detailSchedule) return null;
    
    return (
      <div style={styles.overlay} onClick={() => setDetailSchedule(null)}>
        <div style={styles.detailModal(isMobile)} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3>📋 Detail Jadwal</h3>
            <button onClick={() => setDetailSchedule(null)} style={styles.btnClose}><X size={20} /></button>
          </div>
          <div style={styles.detailContent}>
            <div style={styles.detailRow}><span>🪐 Ruang</span><strong>{detailSchedule.planet}</strong></div>
            <div style={styles.detailRow}><span>⏰ Waktu</span><strong>{detailSchedule.start} - {detailSchedule.end}</strong></div>
            <div style={styles.detailRow}><span>📅 Tanggal</span><strong>{detailSchedule.dateStr}</strong></div>
            <div style={styles.detailRow}><span>📚 Program</span><strong>{detailSchedule.program} / {detailSchedule.level}</strong></div>
            
            <div style={styles.detailRow}>
              <span>👨‍🏫 Guru</span>
              <strong>
                {detailSchedule.teacherName || detailSchedule.booker}
                {detailSchedule.teacherId && (
                  <span style={{...styles.codeBadgeTeacher, marginLeft: 8, fontSize: 10}}>
                    <Hash size={10} /> {detailSchedule.teacherId}
                  </span>
                )}
              </strong>
            </div>
            <div style={styles.detailRow}>
              <span>📘 Mapel</span>
              <strong>
                {detailSchedule.mapelName || detailSchedule.mapel || '-'}
                {detailSchedule.mapelId && (
                  <span style={{...styles.codeBadgeMapel, marginLeft: 8, fontSize: 10}}>
                    <Tag size={10} /> {detailSchedule.mapelId}
                  </span>
                )}
              </strong>
            </div>
            
            <div style={styles.detailRow}><span>📝 Materi</span><strong>{detailSchedule.title || '-'}</strong></div>
            <div style={styles.detailDivider} />
            
            <h4 style={{marginBottom: 8, fontSize: 13}}>👥 Daftar Siswa ({detailSchedule.students?.length || 0})</h4>
            {detailSchedule.students && detailSchedule.students.length > 0 ? (
              <div style={styles.detailStudentList}>
                {detailSchedule.students.map((s, i) => (
                  <div key={i} style={styles.detailStudentItem}>
                    <span style={styles.detailStudentNum}>{i + 1}.</span>
                    <span style={styles.detailStudentName}>{s.nama || s}</span>
                    <span style={styles.detailStudentId}>#{s.studentId || s.id || '-'}</span>
                    <span style={styles.detailStudentKelas}>{s.kelas || s.kelasSekolah || '-'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{color: '#94a3b8', fontSize: 12}}>Belum ada siswa</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: Event Modal
  // ============================================================
  const renderEventModal = () => {
    if (!isEventModalOpen) return null;

    return (
      <div style={styles.overlay} onClick={() => setIsEventModalOpen(false)}>
        <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3 style={{margin: 0}}>
              {editingEventIndex !== null ? "✏️ Edit Event" : "📌 Tambah Event Kalender"}
            </h3>
            <button onClick={() => setIsEventModalOpen(false)} style={styles.btnClose}>
              <X size={20} />
            </button>
          </div>

          <div style={styles.modalBody}>
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>📅 Tanggal</label>
              <input 
                type="date" 
                value={eventForm.date} 
                onChange={e => setEventForm({...eventForm, date: e.target.value})}
                style={styles.formInput} 
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>🏷️ Label Event</label>
              <input 
                type="text" 
                value={eventForm.label} 
                onChange={e => setEventForm({...eventForm, label: e.target.value})}
                style={styles.formInput} 
                placeholder="Contoh: Rapat Guru, Ujian Semester, Libur"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>📝 Deskripsi (Opsional)</label>
              <input 
                type="text" 
                value={eventForm.description} 
                onChange={e => setEventForm({...eventForm, description: e.target.value})}
                style={styles.formInput} 
                placeholder="Detail tambahan..."
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.formLabel}>🎨 Warna</label>
              <div style={styles.colorPickerRow}>
                {EVENT_COLORS.map(color => (
                  <div
                    key={color}
                    onClick={() => setEventForm({...eventForm, color})}
                    style={styles.colorOption(eventForm.color === color, color)}
                  />
                ))}
                <input 
                  type="color" 
                  value={eventForm.color} 
                  onChange={e => setEventForm({...eventForm, color: e.target.value})}
                  style={styles.colorInput} 
                />
              </div>
            </div>

            <div style={styles.eventPreviewBox}>
              <strong>Preview:</strong>
              <div style={{...styles.eventPreview, background: eventForm.color || '#f59e0b'}}>
                📌 {eventForm.label || 'Label Event'}
              </div>
            </div>

            <div style={styles.modalFooter}>
              {editingEventIndex !== null && (
                <button 
                  type="button" 
                  onClick={() => handleDeleteEvent(editingEventIndex)} 
                  style={{...styles.btnCancel, color: '#ef4444', borderColor: '#fecaca'}}
                >
                  <Trash2 size={14} /> Hapus
                </button>
              )}
              <button type="button" onClick={() => setIsEventModalOpen(false)} style={styles.btnCancel}>
                Batal
              </button>
              <button onClick={handleSaveEvent} style={styles.btnSave}>
                <Save size={16} /> {editingEventIndex !== null ? 'Update' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // MAIN RENDER
  // ============================================================
  if (loading) {
    return (
      <div style={styles.wrapper}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingBox}><div style={styles.spinner}></div><p>Memuat jadwal...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* HEADER */}
        <div style={styles.headerCard}>
          <div style={styles.headerLeft}>
            <h2 style={styles.pageTitle}>
              <Calendar size={22} /> Manajemen Jadwal
            </h2>
            <p style={styles.headerDate}>
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div style={styles.headerRight}>
            <div style={styles.headerButtons}>
              <button 
                onClick={() => handleOpenEventModal(getSmartDateString(selectedDate))} 
                style={styles.btnEvent}
              >
                <Flag size={14} /> Tambah Event
              </button>
            </div>
            <div style={styles.codeBox}>
              <span style={styles.codeLabel}>KODE ABSEN:</span>
              {isEditingCode ? (
                <div style={{display: 'flex', gap: 4}}>
                  <input value={tempCode} onChange={e => setTempCode(e.target.value)} style={styles.codeInput} autoFocus />
                  <button onClick={handleUpdateCode} style={styles.codeSaveBtn}>OK</button>
                </div>
              ) : (
                <>
                  <span style={styles.codeValue}>{dailyCode}</span>
                  <button onClick={() => setIsEditingCode(true)} style={styles.codeEditBtn}>Edit</button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* VIEW TOGGLE */}
        <div style={styles.viewToggle}>
          <button onClick={() => setViewMode('daily')} style={styles.viewBtn(viewMode === 'daily')}>📝 Harian</button>
          <button onClick={() => setViewMode('weekly')} style={styles.viewBtn(viewMode === 'weekly')}>🗓️ Mingguan</button>
        </div>

        <div style={styles.contentRow(isMobile)}>
          {/* MINI CALENDAR */}
          <div style={styles.miniCalendarCol(isMobile)}>
            <div style={styles.miniCalendarCard}>
              <div style={styles.miniCalHeader}>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={styles.miniCalNav}><ChevronLeft size={14} /></button>
                <span style={styles.miniCalMonth}>{MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={styles.miniCalNav}><ChevronRight size={14} /></button>
              </div>
              <div style={styles.miniCalWeekdays}>
                {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                  <div key={d} style={styles.miniCalWeekday(d)}>{d}</div>
                ))}
              </div>
              <div style={styles.miniCalDays}>
                {renderMiniCalendar()}
              </div>

              {customEvents.filter(e => {
                const d = new Date(e.date);
                return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
              }).length > 0 && (
                <div style={styles.eventList}>
                  <strong style={styles.eventListTitle}>📌 Event Bulan Ini:</strong>
                  {customEvents.filter(e => {
                    const d = new Date(e.date);
                    return d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear();
                  }).sort((a, b) => a.date.localeCompare(b.date)).map((e, idx) => (
                    <div key={idx} style={styles.eventListItem}>
                      <div style={{...styles.eventListDot, background: e.color || '#f59e0b'}} />
                      <span style={styles.eventListDate}>{new Date(e.date).getDate()}</span>
                      <span style={styles.eventListLabel}>{e.label}</span>
                      <div style={styles.eventListActions}>
                        <button onClick={() => handleEditEvent(customEvents.indexOf(e))} style={styles.eventListEdit}>
                          <Edit3 size={10} />
                        </button>
                        <button onClick={() => handleDeleteEvent(customEvents.indexOf(e))} style={styles.eventListDelete}>
                          <X size={10} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={styles.miniCalLegend}>
                <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#3b82f6'}}></div><span>Jadwal</span></div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#ef4444'}}></div><span>Libur</span></div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#f59e0b'}}></div><span>Event</span></div>
                <div style={styles.legendItem}><div style={{...styles.legendDot, background: '#10b981', border: '2px solid #10b981'}}></div><span>Hari Ini</span></div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div style={styles.mainCol}>
            {viewMode === 'daily' ? renderDailyView() : renderWeeklyView()}
          </div>
        </div>

        {/* MODAL TAMBAH/EDIT JADWAL */}
        {isModalOpen && (
          <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin: 0}}>{editId ? "✏️ Edit Sesi" : "✨ Sesi Baru"} - Ruang {activePlanet}</h3>
                <button onClick={() => setIsModalOpen(false)} style={styles.btnClose}><X size={20} /></button>
              </div>

              <form onSubmit={handleSave} style={styles.modalBody}>
                <div style={styles.modalRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>⏰ Mulai</label>
                    <input type="time" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={styles.formInput} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>⏰ Selesai</label>
                    <input type="time" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={styles.formInput} required />
                  </div>
                </div>

                <div style={styles.modalRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Program</label>
                    <select value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} style={styles.formSelect}>
                      <option value="Reguler">📚 Reguler</option>
                      <option value="English">🗣️ English</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Jenjang</label>
                    <select value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})} style={styles.formSelect}>
                      {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>👨‍🏫 Guru</label>
                  <select required value={formData.teacherId} onChange={e => handleTeacherSelect(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.guruId || t.id}>
                        {t.nama} {t.guruId ? '(' + t.guruId + ')' : ''} {t.mapel ? '- ' + t.mapel : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>📘 Mapel</label>
                  <select required value={formData.mapelId} onChange={e => handleMapelSelect(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Pilih Mapel --</option>
                    {availableMapel.map(m => (
                      <option key={m.id} value={m.kodeMapel || m.id}>
                        {m.namaMapel} ({m.kodeMapel})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>📝 Materi / Judul</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.formInput} placeholder="Contoh: Matematika Pecahan" />
                </div>

                {/* ============================================================
                    ASSIGN SISWA - VERSI PERBAIKAN
                ============================================================ */}
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>
                    👥 Assign Siswa ({formData.selectedStudents.length} dipilih)
                  </label>
                  <p style={{fontSize: 9, color: '#94a3b8', marginTop: 2}}>
                    Menampilkan siswa jenjang {formData.level}
                    {studentFilterKelas !== 'Semua' && ' • Filter: ' + studentFilterKelas}
                  </p>

                  <div style={{display: 'flex', gap: 6, marginTop: 6, marginBottom: 8}}>
                    <select value={studentFilterKelas} onChange={e => setStudentFilterKelas(e.target.value)} style={{...styles.formSelect, flex: 1, fontSize: 11, padding: '6px 8px'}}>
                      {KELAS_LIST.map(k => <option key={k} value={k}>{k}</option>)}
                    </select>
                    <input type="text" placeholder="Cari nama/ID..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} style={{...styles.formInput, flex: 2, fontSize: 11, padding: '6px 8px'}} />
                  </div>

                  {/* Student List - PERBAIKAN CHECKBOX */}
                  <div style={styles.studentSelectList}>
                    {getFilteredStudents().length === 0 ? (
                      <div style={{textAlign: 'center', padding: 15, color: '#94a3b8', fontSize: 11}}>
                        Tidak ada siswa ditemukan
                      </div>
                    ) : (
                      getFilteredStudents().slice(0, 50).map(s => {
                        const studentId = s.studentId || s.id;
                        if (!studentId) return null;
                        
                        const isChecked = formData.selectedStudents.some(id => id === studentId);
                        
                        return (
                          <label 
                            key={studentId}
                            style={{
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8, 
                              padding: '8px 10px',
                              borderBottom: '1px solid #f1f5f9',
                              cursor: 'pointer',
                              fontSize: 12,
                              background: isChecked ? '#eef2ff' : 'transparent',
                              borderRadius: '4px',
                              transition: '0.2s'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                e.stopPropagation();
                                
                                let newSelected = [...formData.selectedStudents];
                                
                                if (e.target.checked) {
                                  if (!newSelected.includes(studentId)) {
                                    newSelected.push(studentId);
                                  }
                                } else {
                                  newSelected = newSelected.filter(id => id !== studentId);
                                }
                                
                                setFormData({
                                  ...formData,
                                  selectedStudents: newSelected
                                });
                              }}
                              style={{width: 16, height: 16, cursor: 'pointer', accentColor: '#3b82f6'}}
                            />
                            <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <div>
                                <span style={{fontSize: 12, fontWeight: isChecked ? '600' : '500'}}>
                                  {s.nama}
                                </span>
                                {s.studentId && (
                                  <span style={{fontSize: 9, color: '#94a3b8', marginLeft: 6, fontFamily: 'monospace'}}>
                                    #{s.studentId}
                                  </span>
                                )}
                              </div>
                              <span style={{
                                fontSize: 10,
                                background: '#eef2ff',
                                color: '#3b82f6',
                                padding: '2px 6px',
                                borderRadius: 8,
                                fontWeight: 'bold'
                              }}>
                                {s.kelasSekolah || '-'}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>

                  {/* 🔥 TOMBOL SELECT ALL / DESELECT ALL */}
                  <div style={{display: 'flex', gap: 8, marginTop: 8}}>
                    <button
                      type="button"
                      onClick={() => {
                        const allIds = getFilteredStudents()
                          .slice(0, 50)
                          .map(s => s.studentId || s.id)
                          .filter(id => id);
                        
                        const currentSelected = formData.selectedStudents || [];
                        const newSelected = [...new Set([...currentSelected, ...allIds])];
                        
                        setFormData({
                          ...formData,
                          selectedStudents: newSelected
                        });
                      }}
                      style={{
                        padding: '4px 12px',
                        background: '#e0e7ff',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#3730a3'
                      }}
                    >
                      Pilih Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const visibleIds = getFilteredStudents()
                          .slice(0, 50)
                          .map(s => s.studentId || s.id)
                          .filter(id => id);
                        
                        const newSelected = (formData.selectedStudents || [])
                          .filter(id => !visibleIds.includes(id));
                        
                        setFormData({
                          ...formData,
                          selectedStudents: newSelected
                        });
                      }}
                      style={{
                        padding: '4px 12px',
                        background: '#fee2e2',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: 'bold',
                        color: '#ef4444'
                      }}
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                {!editId && (
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>🔄 Pengulangan</label>
                    <select value={formData.repeat} onChange={e => setFormData({...formData, repeat: e.target.value})} style={styles.formSelect}>
                      <option value="Once">1x Pertemuan Saja</option>
                      <option value="Monthly">Otomatis 4 Pekan (1 Bulan)</option>
                    </select>
                  </div>
                )}

                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnSave}><Save size={16} /> {editId ? 'Update' : 'Simpan'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EVENT MODAL */}
        {renderEventModal()}

        {/* DETAIL MODAL */}
        {renderDetailModal()}

      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes toastIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '250px', 
    padding: m ? '15px' : '30px', 
    width: '100%', 
    boxSizing: 'border-box', 
    transition: '0.3s' 
  }),
  
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    background: '#1e293b', color: 'white', 
    padding: '12px 20px', borderRadius: 12, 
    fontWeight: 'bold', fontSize: 14, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
    animation: 'toastIn 0.3s ease' 
  },
  
  loadingBox: { textAlign: 'center', padding: 80, color: '#94a3b8' },
  spinner: { 
    width: 40, height: 40, 
    border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', 
    borderRadius: '50%', animation: 'spin 1s linear infinite', 
    margin: '0 auto 15px' 
  },

  headerCard: { 
    background: 'linear-gradient(135deg, #1e293b, #334155)', 
    padding: 20, borderRadius: 16, marginBottom: 20, 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', flexWrap: 'wrap', gap: 15, 
    color: 'white' 
  },
  headerLeft: {},
  pageTitle: { margin: 0, fontSize: 20, display: 'flex', alignItems: 'center', gap: 8, color: 'white' },
  headerDate: { margin: '4px 0 0', fontSize: 12, opacity: 0.7 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  headerButtons: { display: 'flex', gap: 8 },
  
  btnEvent: { 
    background: 'rgba(255,255,255,0.15)', 
    color: 'white', border: '1px solid rgba(255,255,255,0.2)',
    padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
    fontWeight: 'bold', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6,
    transition: '0.2s'
  },
  
  codeBox: { 
    background: 'rgba(255,255,255,0.1)', padding: '8px 14px', 
    borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 
  },
  codeLabel: { fontSize: 10, fontWeight: 'bold', opacity: 0.8 },
  codeValue: { fontSize: 18, fontWeight: '900', color: '#fbbf24', fontFamily: 'monospace' },
  codeEditBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 10 },
  codeInput: { width: 60, padding: '4px 8px', borderRadius: 4, textAlign: 'center', border: 'none', fontSize: 14, fontWeight: 'bold' },
  codeSaveBtn: { background: '#10b981', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },

  viewToggle: { display: 'flex', gap: 8, marginBottom: 20 },
  viewBtn: (active) => ({ 
    flex: 1, padding: '10px', borderRadius: 10, border: 'none', 
    fontWeight: 'bold', fontSize: 13, cursor: 'pointer', 
    background: active ? '#3b82f6' : '#e2e8f0', 
    color: active ? 'white' : '#64748b', transition: '0.2s' 
  }),

  contentRow: (m) => ({ display: 'flex', gap: 20, flexDirection: m ? 'column' : 'row' }),
  miniCalendarCol: (m) => ({ width: m ? '100%' : '280px', flexShrink: 0 }),
  mainCol: { flex: 1, minWidth: 0 },

  miniCalendarCard: { background: 'white', padding: 16, borderRadius: 14, boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  miniCalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  miniCalNav: { background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' },
  miniCalMonth: { fontSize: 13, fontWeight: 'bold', color: '#1e293b' },
  miniCalWeekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 },
  miniCalWeekday: (d) => ({ textAlign: 'center', fontSize: 10, fontWeight: 'bold', color: d === 'Min' ? '#ef4444' : '#94a3b8', padding: '4px 0' }),
  miniCalDays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  miniDayEmpty: { aspectRatio: '1' },
  miniDay: (sel, red, today, event) => ({
    aspectRatio: '1', borderRadius: 8, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    position: 'relative', fontSize: 12, fontWeight: sel ? 'bold' : 'normal',
    background: sel ? '#3b82f6' : red ? '#fee2e2' : event ? event.color + '20' : 'white',
    color: sel ? 'white' : red ? '#ef4444' : event ? event.color : today ? '#3b82f6' : '#334155',
    border: today && !sel ? '2px solid #3b82f6' : red && !sel ? '1px solid #fecaca' : event && !sel ? '1px solid ' + event.color : '1px solid transparent',
    transition: '0.2s'
  }),
  miniDayNum: (sel, red, today) => ({ fontSize: 12, fontWeight: sel || today ? 'bold' : 'normal' }),
  miniDayDot: { width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', marginTop: 2 },
  miniEventDot: { width: 8, height: 8, borderRadius: '50%', marginTop: 2, border: '1px solid rgba(255,255,255,0.5)' },
  
  miniCalLegend: { display: 'flex', gap: 12, marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, color: '#64748b' },
  legendDot: { width: 8, height: 8, borderRadius: '50%' },
  
  eventList: { marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' },
  eventListTitle: { fontSize: 10, color: '#1e293b', display: 'block', marginBottom: 6 },
  eventListItem: { 
    display: 'flex', alignItems: 'center', gap: 6, 
    padding: '4px 6px', borderRadius: 4, 
    fontSize: 10, background: '#f8fafc', marginBottom: 2 
  },
  eventListDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  eventListDate: { fontWeight: 'bold', color: '#64748b', minWidth: 20 },
  eventListLabel: { flex: 1, color: '#1e293b' },
  eventListActions: { display: 'flex', gap: 2 },
  eventListEdit: { background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '2px', borderRadius: 4 },
  eventListDelete: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '2px', borderRadius: 4 },

  eventBanner: { 
    padding: '12px 16px', borderRadius: 10, 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', color: 'white', marginBottom: 12 
  },
  eventBannerContent: { display: 'flex', alignItems: 'center', gap: 10 },
  eventBannerLabel: { fontWeight: 'bold', fontSize: 14 },
  eventBannerDesc: { fontSize: 11, opacity: 0.9 },
  eventBannerEdit: { 
    background: 'rgba(255,255,255,0.2)', 
    border: 'none', color: 'white', 
    padding: '6px 12px', borderRadius: 6, 
    cursor: 'pointer', fontSize: 11,
    display: 'flex', alignItems: 'center', gap: 4
  },

  weeklyDay: (today, holiday, event) => ({ 
    background: event ? event + '10' : 'white',
    borderRadius: 12, padding: 14, 
    border: holiday ? '2px solid #fecaca' : 
           event ? '2px solid ' + event :
           today ? '2px solid #3b82f6' : '1px solid #f1f5f9' 
  }),
  weeklyEventBadge: { 
    fontSize: 9, padding: '2px 8px', borderRadius: 10, 
    color: 'white', fontWeight: 'bold' 
  },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 2000, backdropFilter: 'blur(2px)' },
  modal: (m) => ({ background: 'white', padding: m ? 20 : 25, borderRadius: m ? '20px 20px 0 0' : 20, width: m ? '100%' : '90%', maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' }),
  detailModal: (m) => ({ background: 'white', padding: m ? 20 : 25, borderRadius: m ? '20px 20px 0 0' : 20, width: m ? '100%' : '90%', maxWidth: '550px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', animation: 'slideUp 0.3s ease' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #f1f5f9' },
  btnClose: { background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#ef4444' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 12 },
  modalRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  formGroup: { flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 4 },
  formLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b' },
  formInput: { padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', background: '#f8fafc' },
  formSelect: { padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, width: '100%', boxSizing: 'border-box', background: 'white' },
  studentSelectList: { maxHeight: '200px', overflowY: 'auto', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', padding: '6px' },
  modalFooter: { display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9' },
  btnCancel: { flex: 1, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', color: '#64748b' },
  btnSave: { flex: 2, padding: 12, borderRadius: 10, border: 'none', background: '#1e293b', color: 'white', fontWeight: 'bold', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },

  colorPickerRow: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  colorOption: (selected, color) => ({ 
    width: 32, height: 32, borderRadius: '50%', 
    background: color, cursor: 'pointer',
    border: selected ? '3px solid #1e293b' : '2px solid transparent',
    transition: '0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }),
  colorInput: { width: 40, height: 40, padding: 2, borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer' },
  
  eventPreviewBox: { marginTop: 8, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' },
  eventPreview: { padding: '8px 12px', borderRadius: 6, color: 'white', fontWeight: 'bold', fontSize: 13, textAlign: 'center' },

  planetGrid: { display: 'flex', flexDirection: 'column', gap: 15 },
  planetCard: { background: 'white', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9' },
  planetHeader: { background: '#f8fafc', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f1f5f9' },
  planetName: { margin: 0, fontSize: 14, fontWeight: 'bold', color: '#1e293b', flex: 1 },
  planetCount: { fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 10 },
  btnAddSmall: { background: '#3b82f6', color: 'white', border: 'none', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 },
  planetBody: { padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 },
  emptyPlanet: { gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 12, fontStyle: 'italic' },

  scheduleItem: { background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0', transition: '0.2s' },
  scheduleTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  timeBadge: { fontSize: 12, fontWeight: '900', color: '#1e293b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 6 },
  programBadge: (p) => ({ fontSize: 10, fontWeight: 'bold', color: p === 'English' ? '#ef4444' : '#10b981' }),
  scheduleTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4, color: '#1e293b' },
  scheduleCodes: { display: 'flex', gap: 6, marginBottom: 4, flexWrap: 'wrap' },
  codeBadgeTeacher: { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#3b82f6', background: '#eef2ff', padding: '1px 6px', borderRadius: 10, fontWeight: 600 },
  codeBadgeMapel: { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, color: '#8b5cf6', background: '#ede9fe', padding: '1px 6px', borderRadius: 10, fontWeight: 600 },
  scheduleInfo: { display: 'flex', gap: 8, fontSize: 11, color: '#64748b', flexWrap: 'wrap', marginBottom: 6 },
  studentPreview: { display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 },
  studentChip: { background: '#e0e7ff', color: '#3730a3', padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 },
  studentIdChip: { fontSize: 8, color: '#94a3b8', background: 'rgba(255,255,255,0.5)', padding: '0 4px', borderRadius: 4, fontFamily: 'monospace' },
  studentMore: { fontSize: 10, color: '#94a3b8' },
  scheduleActions: { display: 'flex', gap: 6, borderTop: '1px solid #e2e8f0', paddingTop: 8 },
  btnEditSm: { flex: 1, padding: '6px', borderRadius: 6, background: '#fef3c7', color: '#b45309', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnDetailSm: { flex: 1, padding: '6px', borderRadius: 6, background: '#e0e7ff', color: '#3730a3', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnDeleteSm: { flex: 1, padding: '6px', borderRadius: 6, background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },

  weeklyGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  weeklyHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' },
  weeklyDayName: (red) => ({ fontSize: 13, fontWeight: 'bold', color: red ? '#ef4444' : '#1e293b' }),
  weeklyDate: { fontSize: 11, color: '#94a3b8' },
  weeklyBody: { display: 'flex', flexDirection: 'column', gap: 4 },
  weeklyEmpty: { color: '#94a3b8', fontSize: 11, fontStyle: 'italic' },
  weeklyItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#f8fafc', borderRadius: 6, flexWrap: 'wrap' },
  weeklyTime: { fontSize: 11, fontWeight: 'bold', color: '#3b82f6', background: '#eef2ff', padding: '2px 6px', borderRadius: 4 },
  weeklyPlanet: { fontSize: 10, color: '#64748b' },
  weeklyTitle: { fontSize: 11, fontWeight: '500' },
  weeklyTeacher: { fontSize: 10, color: '#94a3b8' },
  weeklyIdBadge: { fontSize: 8, color: '#3b82f6', background: '#eef2ff', padding: '1px 4px', borderRadius: 4, fontFamily: 'monospace' },

  detailContent: { display: 'flex', flexDirection: 'column', gap: 10 },
  detailRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 },
  detailDivider: { height: 1, background: '#e2e8f0', margin: '8px 0' },
  detailStudentList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' },
  detailStudentItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#f8fafc', borderRadius: 6, fontSize: 11 },
  detailStudentNum: { color: '#94a3b8', minWidth: 20 },
  detailStudentName: { fontWeight: 'bold', flex: 1 },
  detailStudentId: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 9 },
  detailStudentKelas: { background: '#eef2ff', color: '#3b82f6', padding: '1px 6px', borderRadius: 6, fontSize: 10 }
};

export default SchedulePage;