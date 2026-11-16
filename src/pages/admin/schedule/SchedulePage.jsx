// src/pages/admin/schedule/SchedulePage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin';
import { db } from '../../../firebase';
import { 
  collection, getDocs, deleteDoc, doc, writeBatch, updateDoc, 
  setDoc, getDoc, addDoc, query, where, serverTimestamp 
} from "firebase/firestore";
import { 
  Search, Plus, Edit3, Trash2, X, Save, Calendar, Clock, MapPin, 
  BookOpen, Users, GraduationCap, Filter, RefreshCw, ChevronLeft, 
  ChevronRight, Home, ChevronRight as ChevronRightIcon, Flag, Eye, EyeOff,
  Copy, CheckCircle, AlertCircle, Hash, Tag, Link as LinkIcon,
  User, UserPlus, Shield, BadgeCheck, Sparkles, Database, Layers,
  Palette, PenTool, CalendarDays, Download, Moon, Sun, ArrowRight,
  Send, CheckCircle2, AlertTriangle, Coffee, Shuffle, Check
} from 'lucide-react';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { normalisasiKodeMapel, namaMapelLengkap, isJadwalJenjangSD } from '../../../utils/silabusKurikulumMerdeka';
import ModalSiapkanLatihanSesi from '../../../components/guru/ModalSiapkanLatihanSesi';
import { isOwnerSession } from '../../../utils/roleAkses';

// Modular Sub-Components
import GemilangExcelTimetableView from './GemilangExcelTimetableView';
import CalmendarTimetableView from './CalmendarTimetableView';
import ModalPindahRuang from './ModalPindahRuang';
import ModalDownloadJadwalBesar from './ModalDownloadJadwalBesar';
import ModalReviewDraftOwner from './ModalReviewDraftOwner';
import { analyzeScheduleDetails, timeToMinutes, timesOverlap } from './jadwalConflictUtils';

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

const EVENT_COLORS = [
  '#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e'
];

const norm = (s) => String(s || '').trim().toLowerCase();

const isStudentEnrolledInMapel = (enrolledSubjects, targetKode, targetNama) => {
  if (!Array.isArray(enrolledSubjects) || enrolledSubjects.length === 0) return false;
  const targetKodeNorm = norm(targetKode);
  const targetNamaNorm = norm(targetNama);
  const targetKanoniNorm = norm(namaMapelLengkap(targetKode));

  return enrolledSubjects.some(item => {
    const itemNorm = norm(item);
    if (!itemNorm) return false;
    if (targetKodeNorm && itemNorm === targetKodeNorm) return true;
    if (targetNamaNorm && itemNorm === targetNamaNorm) return true;
    if (targetKanoniNorm && itemNorm === targetKanoniNorm) return true;
    const itemKanoniNorm = norm(namaMapelLengkap(item));
    if (itemKanoniNorm && targetKanoniNorm && itemKanoniNorm === targetKanoniNorm) return true;
    return false;
  });
};

const SchedulePage = () => {
  // ============================================================
  // STATES
  // ============================================================
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState(null);
  
  // Theme State (Dark Mode Calmendar vs Normal)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('bimbel_schedule_dark_mode') === 'true';
  });

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('bimbel_schedule_dark_mode', String(next));
      return next;
    });
  };

  // Schedule Mode: 'live' (Jadwal Resmi) | 'draft' (Mode Simulasi / Coretan)
  const [scheduleMode, setScheduleMode] = useState('live');
  const [draftSchedules, setDraftSchedules] = useState([]);
  const [draftNotes, setDraftNotes] = useState('');
  
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
  
  // Calendar & Views
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('calmendar'); // 'calmendar' | 'excel' | 'weekly'
  
  // Daily Code
  const [dailyCode, setDailyCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState("");
  
  // Modal Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("MERKURIUS");
  const [editId, setEditId] = useState(null);
  const [editingSeriesId, setEditingSeriesId] = useState(null);
  const [applyToSeries, setApplyToSeries] = useState(false);
  const [jadwalLatihanSesi, setJadwalLatihanSesi] = useState(null);
  
  // Form State
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
  
  // Filter Siswa di Modal
  const [studentSearch, setStudentSearch] = useState("");
  const [studentFilterKelas, setStudentFilterKelas] = useState("Semua");
  
  // Detail Modal
  const [detailSchedule, setDetailSchedule] = useState(null);

  // New Modals
  const [sessionToPindah, setSessionToPindah] = useState(null);
  const [isMasterDownloadOpen, setIsMasterDownloadOpen] = useState(false);
  const [isOwnerReviewOpen, setIsOwnerReviewOpen] = useState(false);

  // Filter Cepat Sidebar
  const [filterPlanet, setFilterPlanet] = useState('Semua');
  const [filterTeacher, setFilterTeacher] = useState('Semua');

  const isOwner = isOwnerSession();

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

  // Helper untuk foto guru
  const getTeacherPhoto = (item) => {
    if (item.teacherFotoUrl) return item.teacherFotoUrl;
    const t = availableTeachers.find(tch =>
      (item.teacherId && (tch.id === item.teacherId || tch.guruId === item.teacherId)) ||
      (item.teacherName && tch.nama && tch.nama.toLowerCase() === item.teacherName.toLowerCase())
    );
    return t?.fotoUrl || null;
  };

  // ============================================================
  // FETCH DATA
  // ============================================================
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch schedules (Jadwal Resmi)
      const schedSnap = await getDocs(collection(db, "jadwal_bimbel"));
      setSchedules(schedSnap.docs.map(d => ({ id: d.id, isDraft: false, ...d.data() })));

      // 2. Fetch draft schedules (Simulasi)
      try {
        const draftSnap = await getDocs(collection(db, "jadwal_draft"));
        const drafts = draftSnap.docs.map(d => ({ id: d.id, isDraft: true, ...d.data() }));
        setDraftSchedules(drafts);
      } catch (e) {
        console.warn("Draft collection:", e);
      }

      // 3. Fetch teachers
      const tSnap = await getDocs(collection(db, "teachers"));
      const teachers = tSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        guruId: d.data().guruId || 'GURU-' + String(d.id).slice(0, 4)
      }));
      setAvailableTeachers(teachers);

      // 4. Fetch students
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
          jenjang: jenjang,
          nama: data.nama || 'Siswa',
          kelasSekolah: data.kelasSekolah || 'Umum'
        };
      });
      setAvailableStudents(students);

      // 5. Fetch mapel
      const mSnap = await getDocs(collection(db, "mapel"));
      const mapelData = mSnap.docs
        .map(d => ({ 
          id: d.id, 
          ...d.data(),
          kodeMapel: d.data().kodeMapel || 'MAPEL-' + String(d.id).slice(0, 4)
        }))
        .filter(m => !m.dinonaktifkan);
      setAvailableMapel(mapelData);

      // 6. Fetch daily code
      const todayStr = getSmartDateString(selectedDate);
      const codeDocId = 'daily_code_' + todayStr;
      const cSnap = await getDoc(doc(db, "settings", codeDocId));
      if (cSnap.exists()) {
        setDailyCode(cSnap.data().code || '');
        setTempCode(cSnap.data().code || '');
      } else {
        setDailyCode("⚠️ Belum Diset");
        setTempCode("");
      }

      // 7. Fetch custom events
      const evSnap = await getDocs(collection(db, "custom_events"));
      setCustomEvents(evSnap.docs.map(d => d.data()));

    } catch (err) {
      console.error("Gagal load data jadwal:", err);
      showAlert("❌ Gagal memuat data jadwal!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Jadwal aktif saat ini berdasarkan mode
  const currentActiveSchedules = useMemo(() => {
    let list = scheduleMode === 'draft' ? draftSchedules : schedules;
    if (filterPlanet !== 'Semua') {
      list = list.filter(s => s.planet === filterPlanet);
    }
    if (filterTeacher !== 'Semua') {
      list = list.filter(s => s.teacherId === filterTeacher || s.teacherName === filterTeacher);
    }
    return list;
  }, [scheduleMode, draftSchedules, schedules, filterPlanet, filterTeacher]);

  // Analisis real-time bentrok & jeda istirahat di dalam modal tambah/edit
  const liveConflictAnalysis = useMemo(() => {
    if (!isModalOpen || !formData.start || !formData.end) return null;
    const targetDateStr = getSmartDateString(selectedDate);
    const teacherObj = availableTeachers.find(t => (t.guruId || t.id) === formData.teacherId);
    return analyzeScheduleDetails({
      targetDateStr,
      start: formData.start,
      end: formData.end,
      planet: activePlanet,
      teacherId: formData.teacherId,
      teacherName: teacherObj?.nama || formData.teacherName,
      selectedStudentIds: formData.selectedStudents.map(s => s.id),
      schedules: currentActiveSchedules,
      excludeId: editId
    });
  }, [isModalOpen, formData.start, formData.end, formData.teacherId, activePlanet, formData.selectedStudents, currentActiveSchedules, editId, selectedDate, availableTeachers]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleTeacherSelect = (teacherId) => {
    const teacher = availableTeachers.find(t => (t.guruId || t.id) === teacherId);
    if (!teacher) return;
    setFormData(prev => ({
      ...prev,
      teacherId: teacher.guruId || teacher.id,
      teacherName: teacher.nama,
      teacherFotoUrl: teacher.fotoUrl || ''
    }));
  };

  const handleMapelSelect = (mapelKode) => {
    const mapel = availableMapel.find(m => (m.kodeMapel || m.id) === mapelKode);
    if (!mapel) return;
    setFormData(prev => ({
      ...prev,
      mapelId: mapel.kodeMapel || mapel.id,
      mapelName: mapel.namaMapel,
      title: mapel.namaMapel
    }));
  };

  const handleOpenModal = (planet, isEdit = false, item = null) => {
    setActivePlanet(planet || "MERKURIUS");
    setEditId(isEdit && item ? item.id : null);
    setEditingSeriesId(isEdit && item ? (item.seriesId || null) : null);
    setApplyToSeries(false);

    if (isEdit && item) {
      setFormData({
        start: item.start || "14:00",
        end: item.end || "15:30",
        program: item.program || "Reguler",
        level: item.level || "SD",
        title: item.title || "",
        mapelId: item.mapelId || "",
        mapelName: item.mapelName || "",
        teacherId: item.teacherId || "",
        teacherName: item.teacherName || "",
        teacherFotoUrl: item.teacherFotoUrl || "",
        selectedStudents: item.students || [],
        repeat: "Once"
      });
    } else {
      setFormData({
        ...defaultForm,
        start: "14:00",
        end: "15:30",
        program: "Reguler",
        level: "SD"
      });
    }
    setStudentSearch("");
    setStudentFilterKelas("Semua");
    setIsModalOpen(true);
  };

  const handleToggleStudent = (student) => {
    setFormData(prev => {
      const exists = prev.selectedStudents.some(s => s.id === student.id || s.studentId === student.studentId);
      if (exists) {
        return {
          ...prev,
          selectedStudents: prev.selectedStudents.filter(s => s.id !== student.id && s.studentId !== student.studentId)
        };
      } else {
        return {
          ...prev,
          selectedStudents: [...prev.selectedStudents, student]
        };
      }
    });
  };

  // Simpan Jadwal (Live vs Draft)
  const handleSubmitSchedule = async (e) => {
    if (e) e.preventDefault();
    
    if (!formData.teacherId) return showAlert("❌ Pilih guru terlebih dahulu!");
    if (!formData.mapelId) return showAlert("❌ Pilih mata pelajaran!");
    if (formData.selectedStudents.length === 0) return showAlert("❌ Minimal 1 siswa wajib dipilih!");

    try {
      const targetDateStr = getSmartDateString(selectedDate);
      
      const studentsFullData = formData.selectedStudents.map(s => {
        const student = availableStudents.find(st => st.id === s.id || st.studentId === s.id);
        return student ? {
          id: student.id,
          studentId: student.studentId || student.id,
          nama: student.nama || 'Siswa',
          kelasSekolah: student.kelasSekolah || 'Umum',
          jenjang: student.jenjang || '',
          program: student.kategori || formData.program || 'Reguler'
        } : {
          id: s.id,
          studentId: s.studentId || s.id,
          nama: s.nama || 'Siswa',
          kelasSekolah: s.kelasSekolah || 'Umum',
          jenjang: s.jenjang || '',
          program: s.program || formData.program || 'Reguler'
        };
      });

      // Cek bentrok sebelum simpan
      if (liveConflictAnalysis && liveConflictAnalysis.hasConflict) {
        const proceed = window.confirm(
          "⚠️ Terdeteksi kemungkinan BENTROK jadwal:\n\n" +
          liveConflictAnalysis.conflicts.map(c => "• " + c.message).join("\n") +
          "\n\nTetap simpan jadwal ini?"
        );
        if (!proceed) return;
      }

      const namaMapelFinal = formData.mapelName || (formData.mapelId ? namaMapelLengkap(formData.mapelId) : '');
      const judulFinal = (formData.title && formData.title.trim() && formData.title.trim() !== 'Materi Umum')
        ? formData.title.trim()
        : (namaMapelFinal || 'Sesi Belajar');

      const scheduleData = {
        planet: activePlanet,
        program: formData.program,
        level: formData.level,
        title: judulFinal,
        mapelId: formData.mapelId || normalisasiKodeMapel(namaMapelFinal || judulFinal),
        mapelName: namaMapelFinal || judulFinal,
        teacherId: formData.teacherId,
        teacherName: formData.teacherName,
        teacherFotoUrl: formData.teacherFotoUrl || '',
        start: formData.start,
        end: formData.end,
        students: studentsFullData,
        studentIds: studentsFullData.map(s => s.id),
        dateStr: targetDateStr,
        status: scheduleMode === 'draft' ? 'draft' : 'scheduled',
        isDraft: scheduleMode === 'draft',
        updatedAt: serverTimestamp()
      };

      const targetCollection = scheduleMode === 'draft' ? "jadwal_draft" : "jadwal_bimbel";

      if (editId) {
        if (applyToSeries && editingSeriesId) {
          const seriesQuery = query(collection(db, targetCollection), where("seriesId", "==", editingSeriesId));
          const seriesSnap = await getDocs(seriesQuery);
          const { dateStr: _omitDate, ...seriesUpdateData } = scheduleData;
          const batch = writeBatch(db);
          seriesSnap.docs.forEach(d => batch.update(d.ref, seriesUpdateData));
          await batch.commit();
          showAlert(`✅ ${seriesSnap.docs.length} sesi dalam seri berhasil diperbarui!`);
        } else {
          await updateDoc(doc(db, targetCollection, editId), scheduleData);
          showAlert("✅ Jadwal berhasil diperbarui!");
        }
      } else {
        if (formData.repeat === 'Monthly') {
          const seriesId = doc(collection(db, targetCollection)).id;
          const batch = writeBatch(db);
          let tempDate = new Date(selectedDate);
          for (let i = 0; i < 4; i++) {
            const newRef = doc(collection(db, targetCollection));
            batch.set(newRef, {
              ...scheduleData,
              seriesId,
              dateStr: getSmartDateString(tempDate),
              createdAt: serverTimestamp(),
              attendance_list: []
            });
            tempDate.setDate(tempDate.getDate() + 7);
          }
          await batch.commit();
          showAlert("✅ 4 jadwal (1 bulan) berhasil dibuat!");
        } else {
          await addDoc(collection(db, targetCollection), {
            ...scheduleData,
            createdAt: serverTimestamp(),
            attendance_list: []
          });
          showAlert(scheduleMode === 'draft' ? "✅ Sesi draft simulasi tersimpan!" : "✅ Jadwal berhasil disimpan!");
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Gagal simpan jadwal:", err);
      showAlert("❌ Gagal menyimpan jadwal: " + err.message);
    }
  };

  // Hapus Jadwal
  const handleDeleteSchedule = async (scheduleItem) => {
    const isSeries = !!scheduleItem.seriesId;
    let deleteSeries = false;

    if (isSeries) {
      const choice = window.confirm(
        "🔄 Jadwal ini bagian dari seri 4-mingguan.\n\n" +
        "Klik [OK] untuk HAPUS SELURUH SERI (keempat sesi).\n" +
        "Klik [Cancel] untuk HANYA HAPUS SESI TANGGAL INI SAJA."
      );
      if (choice) {
        deleteSeries = true;
      } else {
        const confirmSingle = window.confirm("Hapus sesi tanggal " + scheduleItem.dateStr + " saja?");
        if (!confirmSingle) return;
      }
    } else {
      if (!window.confirm("Hapus jadwal ini?")) return;
    }

    try {
      const targetCol = scheduleMode === 'draft' ? "jadwal_draft" : "jadwal_bimbel";
      if (deleteSeries && scheduleItem.seriesId) {
        const seriesQuery = query(collection(db, targetCol), where("seriesId", "==", scheduleItem.seriesId));
        const seriesSnap = await getDocs(seriesQuery);
        const batch = writeBatch(db);
        seriesSnap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        showAlert(`🗑️ ${seriesSnap.docs.length} sesi dalam seri berhasil dihapus!`);
      } else {
        await deleteDoc(doc(db, targetCol, scheduleItem.id));
        showAlert("🗑️ Jadwal berhasil dihapus!");
      }
      fetchData();
    } catch (err) {
      console.error("Gagal hapus:", err);
      showAlert("❌ Gagal menghapus jadwal!");
    }
  };

  // Salin Jadwal Aktif Minggu Ini ke Draft (Fitur Simulasi)
  const handleCloneLiveWeekToDraft = async () => {
    const week = getWeekDates(selectedDate);
    const weekLive = schedules.filter(s => week.includes(s.dateStr) && s.status !== 'cancelled');
    if (weekLive.length === 0) {
      showAlert("⚠️ Tidak ada jadwal aktif di minggu ini untuk disalin ke draft.");
      return;
    }

    const confirm = window.confirm(
      `Salin ${weekLive.length} sesi jadwal resmi minggu ini ke Mode Draft / Simulasi?\n\n` +
      `Anda dapat bebas mengubah jam, memindah ruangan, atau mengganti tentor tanpa mengganggu jadwal resmi.`
    );
    if (!confirm) return;

    try {
      const batch = writeBatch(db);
      weekLive.forEach(item => {
        const { id, ...data } = item;
        const draftRef = doc(collection(db, "jadwal_draft"));
        batch.set(draftRef, {
          ...data,
          isDraft: true,
          status: 'draft',
          clonedFromId: id,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      });
      await batch.commit();
      showAlert(`✅ Berhasil menyalin ${weekLive.length} sesi ke Mode Draft!`);
      fetchData();
    } catch (err) {
      console.error("Gagal clone ke draft:", err);
      showAlert("❌ Gagal menyalin ke draft: " + err.message);
    }
  };

  // Update Kode Absen Harian
  const handleUpdateCode = async () => {
    if (!tempCode || tempCode.length !== 4) {
      showAlert("❌ Kode absen harus 4 karakter!");
      return;
    }
    try {
      const todayStr = getSmartDateString(selectedDate);
      const codeDocId = 'daily_code_' + todayStr;
      await setDoc(doc(db, "settings", codeDocId), {
        code: tempCode,
        date: todayStr,
        updatedAt: serverTimestamp()
      });
      setDailyCode(tempCode);
      setIsEditingCode(false);
      showAlert("✅ Kode absen berhasil diupdate!");
    } catch (err) {
      console.error(err);
      showAlert("❌ Gagal update kode!");
    }
  };

  // Filter Siswa untuk Modal
  const getFilteredStudents = () => {
    return availableStudents.filter(s => {
      const studentId = s.studentId || s.id;
      if (!studentId) return false;

      if (formData.mapelId) {
        if (!isStudentEnrolledInMapel(s.enrolledSubjects, formData.mapelId, formData.mapelName)) {
          return false;
        }
      }
      
      if (studentFilterKelas !== 'Semua') {
        if (s.kelasSekolah !== studentFilterKelas) return false;
      } else {
        if (formData.level !== 'Umum') {
          const kelas = s.kelasSekolah || '';
          const jenjang = s.jenjang || '';
          const matchKelas = kelas.includes(formData.level);
          const matchJenjang = jenjang === formData.level;
          if (!matchKelas && !matchJenjang) return false;
        }
      }
      
      const searchLower = studentSearch.toLowerCase();
      const matchNama = (s.nama || '').toLowerCase().includes(searchLower);
      const matchId = (studentId || '').toLowerCase().includes(searchLower);
      return matchNama || matchId;
    });
  };

  // ============================================================
  // RENDER: Student Selector UI
  // ============================================================
  const renderStudentSelectorUI = () => {
    const listSiswaTersaring = getFilteredStudents();
    return (
      <div style={{ 
        marginTop: '14px', 
        background: isDarkMode ? '#1e293b' : '#f8fafc', 
        padding: '12px', 
        borderRadius: '10px', 
        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0' 
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginBottom: '8px', 
          fontSize: '13px' 
        }}>
          <span style={{ fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#334155' }}>
            👥 Pilih Peserta Didik ({formData.selectedStudents.length})
          </span>
          <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
            Target: {formData.level}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input 
            type="text"
            placeholder="Cari nama atau ID siswa..."
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
            style={{ 
              flex: 1, 
              padding: '6px 10px', 
              fontSize: '13px', 
              border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1', 
              borderRadius: '6px',
              background: isDarkMode ? '#0f172a' : '#ffffff',
              color: isDarkMode ? '#ffffff' : '#0f172a',
              outline: 'none'
            }}
          />
          <select
            value={studentFilterKelas}
            onChange={(e) => setStudentFilterKelas(e.target.value)}
            style={{ 
              padding: '6px', 
              fontSize: '13px', 
              border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1', 
              borderRadius: '6px', 
              background: isDarkMode ? '#0f172a' : 'white',
              color: isDarkMode ? '#ffffff' : '#0f172a'
            }}
          >
            <option value="Semua">Semua {formData.level}</option>
            {KELAS_LIST.filter(k => 
              k !== "Semua" && 
              (k === "Umum" || k === "Alumni" || k.includes(formData.level))
            ).map(kelas => (
              <option key={kelas} value={kelas}>{kelas}</option>
            ))}
          </select>
        </div>

        <div style={{ 
          maxHeight: '180px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '4px' 
        }}>
          {listSiswaTersaring.length === 0 ? (
            <div style={{ padding: '12px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
              Tidak ada siswa yang cocok atau belum terdaftar mapel ini.
            </div>
          ) : (
            listSiswaTersaring.map(student => {
              const isSelected = formData.selectedStudents.some(s => s.id === student.id || s.studentId === student.studentId);
              return (
                <div 
                  key={student.id}
                  onClick={() => handleToggleStudent(student)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: isSelected 
                      ? (isDarkMode ? '#1e3a8a' : '#eff6ff') 
                      : (isDarkMode ? '#0f172a' : '#ffffff'),
                    border: isSelected 
                      ? '1px solid #3b82f6' 
                      : (isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'),
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 4,
                      border: isSelected ? 'none' : '1.5px solid #94a3b8',
                      background: isSelected ? '#3b82f6' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {isSelected && <Check size={12} color="white" />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                      {student.nama}
                    </span>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                      #{student.studentId?.slice(-4) || student.id?.slice(-4)}
                    </span>
                  </div>
                  <span style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    background: isDarkMode ? '#334155' : '#f1f5f9',
                    color: isDarkMode ? '#cbd5e1' : '#475569'
                  }}>
                    {student.kelasSekolah}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER: Mini Calendar
  // ============================================================
  const renderMiniCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const today = new Date();
    const todayStr = getSmartDateString(today);
    const selStr = getSmartDateString(selectedDate);

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={'empty-' + i} style={styles.miniDayEmpty} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const thisDateStr = getSmartDateString(thisDate);
      const isSel = thisDateStr === selStr;
      const isTod = thisDateStr === todayStr;
      const isSun = thisDate.getDay() === 0;
      const holiday = isHoliday(thisDateStr);
      const event = getCustomEvent(thisDateStr);
      const hasSched = currentActiveSchedules.some(s => s.dateStr === thisDateStr && s.status !== 'cancelled');

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(thisDate)}
          style={{
            ...styles.miniDay(isSel, isSun || !!holiday, isTod, event, isDarkMode),
            background: isSel 
              ? '#3b82f6' 
              : isTod 
                ? (isDarkMode ? '#1e3a8a' : '#dbeafe')
                : (isDarkMode ? '#0f172a' : '#ffffff'),
            color: isSel ? '#ffffff' : (isDarkMode ? '#f8fafc' : '#0f172a')
          }}
        >
          <span style={styles.miniDayNum(isSel, isSun || !!holiday, isTod)}>{d}</span>
          {hasSched && !isSel && <div style={styles.miniDayDot} />}
          {event && !isSel && (
            <div style={{...styles.miniEventDot, background: event.color || '#f59e0b'}} />
          )}
        </div>
      );
    }
    return days;
  };

  // ============================================================
  // RENDER: Daily View (Matriks 5 Planet)
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
          </div>
        )}

        {PLANETS.map(planet => {
          const items = currentActiveSchedules.filter(s => s.planet === planet && s.dateStr === dateStr);
          return (
            <div key={planet} style={{
              ...styles.planetCard,
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderColor: isDarkMode ? '#334155' : '#e2e8f0'
            }}>
              <div style={{
                ...styles.planetHeader,
                background: isDarkMode ? '#0f172a' : '#f8fafc',
                borderBottomColor: isDarkMode ? '#334155' : '#f1f5f9'
              }}>
                <h4 style={{
                  ...styles.planetName,
                  color: isDarkMode ? '#f8fafc' : '#1e293b'
                }}>
                  🪐 Ruang {planet}
                </h4>
                <span style={styles.planetCount}>{items.length} sesi</span>
                <button onClick={() => handleOpenModal(planet)} style={styles.btnAddSmall}>
                  <Plus size={12} /> Tambah Sesi
                </button>
              </div>

              <div style={styles.planetBody}>
                {items.length === 0 ? (
                  <div style={styles.emptyPlanet}>Ruangan kosong hari ini</div>
                ) : (
                  items.map(item => {
                    const photo = getTeacherPhoto(item);
                    return (
                      <div key={item.id} style={{
                        ...styles.scheduleItem,
                        background: isDarkMode ? '#0f172a' : '#f8fafc',
                        borderColor: isDarkMode ? '#334155' : '#e2e8f0'
                      }}>
                        <div style={styles.scheduleTop}>
                          <span style={styles.timeBadge}>⏰ {item.start} - {item.end}</span>
                          <span style={styles.programBadge(item.program)}>{item.program}</span>
                          {item.isDraft && (
                            <span style={styles.draftBadge}>🧪 Draft</span>
                          )}
                          {item.seriesId && (
                            <span style={styles.seriesBadge} title="Bagian dari seri 4 minggu">
                              <RefreshCw size={9} /> 4 Minggu
                            </span>
                          )}
                        </div>

                        <div style={{
                          ...styles.scheduleTitle,
                          color: isDarkMode ? '#f8fafc' : '#1e293b'
                        }}>
                          {item.title || "Materi Umum"}
                        </div>

                        {/* Foto & Identitas Guru */}
                        <div style={styles.teacherInfoRow}>
                          {photo ? (
                            <img src={photo} alt={item.teacherName} style={styles.teacherImgSmall} />
                          ) : (
                            <div style={styles.teacherAvatarSmall}>
                              {item.teacherName?.charAt(0) || 'G'}
                            </div>
                          )}
                          <div style={{ lineHeight: 1.2 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: isDarkMode ? '#cbd5e1' : '#1e293b' }}>
                              👨‍🏫 {item.teacherName || item.booker || '-'}
                            </div>
                            <div style={{ fontSize: 10, color: '#94a3b8' }}>
                              📚 {item.level || "SD"} · 👥 {item.students?.length || 0} siswa
                            </div>
                          </div>
                        </div>

                        {/* Student Chips */}
                        {item.students && item.students.length > 0 && (
                          <div style={styles.studentPreview}>
                            {item.students.slice(0, 3).map((s, i) => (
                              <span key={i} style={styles.studentChip}>
                                {s.nama?.split(' ')[0]}
                              </span>
                            ))}
                            {item.students.length > 3 && (
                              <span style={styles.studentMore}>+{item.students.length - 3}</span>
                            )}
                          </div>
                        )}

                        {/* Tombol Aksi Lengkap + Pindah Ruangan Cepat */}
                        <div style={styles.scheduleActions}>
                          <button 
                            type="button"
                            onClick={() => {
                              setSessionToPindah(item);
                            }}
                            title="Pindah Ruangan Cepat" 
                            style={styles.btnPindahSm}
                          >
                            <Shuffle size={11} /> Pindah Ruang
                          </button>
                          <button onClick={() => handleOpenModal(planet, true, item)} style={styles.btnEditSm}>
                            <Edit3 size={11} /> Edit
                          </button>
                          <button onClick={() => setDetailSchedule(item)} style={styles.btnDetailSm}>
                            <Eye size={11} /> Detail
                          </button>
                          <button onClick={() => handleDeleteSchedule(item)} style={styles.btnDeleteSm}>
                            <Trash2 size={11} /> Hapus
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
  // RENDER: Weekly View
  // ============================================================
  const renderWeeklyView = () => {
    const weekDates = getWeekDates(selectedDate);
    return (
      <div style={styles.weeklyGrid}>
        {weekDates.map(dateStr => {
          const dateObj = new Date(dateStr);
          const dayName = DAYS_ID[dateObj.getDay()];
          const isToday = dateStr === getSmartDateString(new Date());
          const items = currentActiveSchedules.filter(s => s.dateStr === dateStr && s.status !== 'cancelled');
          const holiday = isHoliday(dateStr);
          const customEvent = getCustomEvent(dateStr);

          return (
            <div key={dateStr} style={{
              ...styles.weeklyDay(isToday, !!holiday, !!customEvent),
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderColor: isToday ? '#3b82f6' : (isDarkMode ? '#334155' : '#e2e8f0')
            }}>
              <div style={styles.weeklyHeader}>
                <span style={{
                  ...styles.weeklyDayName(!!holiday || isSunday(dateObj)),
                  color: isDarkMode ? '#f8fafc' : (holiday ? '#ef4444' : '#1e293b')
                }}>
                  {dayName}
                </span>
                <span style={styles.weeklyDate}>{dateObj.getDate()}/{dateObj.getMonth() + 1}</span>
                {customEvent && (
                  <div style={{...styles.weeklyEventBadge, background: customEvent.color || '#f59e0b'}}>
                    📌 {customEvent.label}
                  </div>
                )}
                {holiday && <Flag size={10} color="#ef4444" />}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>
                  {items.length} Sesi
                </span>
              </div>

              <div style={styles.weeklyBody}>
                {items.length === 0 ? (
                  <span style={styles.weeklyEmpty}>Tidak ada jadwal</span>
                ) : (
                  items.map(item => {
                    const photo = getTeacherPhoto(item);
                    return (
                      <div key={item.id} style={{
                        ...styles.weeklyItem,
                        background: isDarkMode ? '#0f172a' : '#f8fafc',
                        border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0'
                      }}>
                        <span style={styles.weeklyTime}>{item.start} - {item.end}</span>
                        <span style={styles.weeklyPlanet}>🪐 {item.planet}</span>
                        <span style={{ fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a' }}>
                          {item.title || item.mapelName}
                        </span>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {photo ? (
                            <img src={photo} alt={item.teacherName} style={styles.teacherImgMicro} />
                          ) : (
                            <div style={styles.teacherAvatarMicro}>
                              {item.teacherName?.charAt(0) || 'G'}
                            </div>
                          )}
                          <span style={{ fontSize: 11, color: isDarkMode ? '#cbd5e1' : '#475569' }}>
                            {item.teacherName || item.booker}
                          </span>
                        </div>

                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
                          <button
                            type="button"
                            onClick={() => setSessionToPindah(item)}
                            style={styles.btnMiniAction}
                            title="Pindah Ruangan"
                          >
                            🔄
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailSchedule(item)}
                            style={styles.btnMiniAction}
                            title="Detail"
                          >
                            👁️
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
  // RENDER: Detail Modal
  // ============================================================
  const renderDetailModal = () => {
    if (!detailSchedule) return null;
    const photo = getTeacherPhoto(detailSchedule);
    
    return (
      <div style={styles.overlay} onClick={() => setDetailSchedule(null)}>
        <div style={styles.detailModal(isMobile)} onClick={e => e.stopPropagation()}>
          <div style={styles.modalHeader}>
            <h3>📋 Detail Jadwal Kelas</h3>
            <button onClick={() => setDetailSchedule(null)} style={styles.btnClose}><X size={20} /></button>
          </div>
          <div style={styles.detailContent}>
            <div style={styles.detailRow}>
              <span>🪐 Ruang Kelas</span>
              <strong>
                {detailSchedule.planet}
                <button
                  type="button"
                  onClick={() => {
                    setSessionToPindah(detailSchedule);
                    setDetailSchedule(null);
                  }}
                  style={styles.btnPindahDetail}
                >
                  <Shuffle size={12} /> Pindah Ruangan
                </button>
              </strong>
            </div>
            <div style={styles.detailRow}><span>⏰ Waktu Sesi</span><strong>{detailSchedule.start} - {detailSchedule.end}</strong></div>
            <div style={styles.detailRow}><span>📅 Tanggal</span><strong>{detailSchedule.dateStr}</strong></div>
            <div style={styles.detailRow}><span>📚 Program</span><strong>{detailSchedule.program} / {detailSchedule.level}</strong></div>
            {detailSchedule.seriesId && (
              <div style={styles.detailRow}><span>🔄 Seri</span><strong>Bagian dari jadwal 4 minggu berulang</strong></div>
            )}
            
            {/* Foto & Guru */}
            <div style={styles.detailRow}>
              <span>👨‍🏫 Tentor / Pengajar</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {photo ? (
                  <img src={photo} alt={detailSchedule.teacherName} style={styles.teacherImgSmall} />
                ) : (
                  <div style={styles.teacherAvatarSmall}>
                    {detailSchedule.teacherName?.charAt(0) || 'G'}
                  </div>
                )}
                <strong>{detailSchedule.teacherName || detailSchedule.booker}</strong>
              </div>
            </div>

            <div style={styles.detailRow}>
              <span>📘 Mata Pelajaran</span>
              <strong>{detailSchedule.mapelName || detailSchedule.title || '-'}</strong>
            </div>
            
            <div style={styles.detailDivider} />
            
            <h4 style={{margin: '8px 0', fontSize: 13}}>👥 Siswa Terdaftar ({detailSchedule.students?.length || 0})</h4>
            {detailSchedule.students && detailSchedule.students.length > 0 ? (
              <div style={styles.detailStudentList}>
                {detailSchedule.students.map((s, i) => (
                  <div key={i} style={styles.detailStudentItem}>
                    <span style={styles.detailStudentNum}>{i + 1}.</span>
                    <span style={styles.detailStudentName}>{s.nama || s}</span>
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
  // MAIN RETURN
  // ============================================================
  if (loading) {
    return (
      <div style={{
        ...styles.wrapper,
        background: isDarkMode ? '#0b1120' : '#f8fafc'
      }}>
        <SidebarAdmin />
        <div style={styles.mainContent(isMobile)}>
          <div style={styles.loadingBox}><div style={styles.spinner}></div><p>Memuat sistem jadwal...</p></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      ...styles.wrapper,
      background: isDarkMode ? '#0b1120' : '#f8fafc'
    }}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        
        {alertMsg && <div style={styles.toast}>{alertMsg}</div>}

        {/* OWNER REVIEW NOTIFICATION BANNER */}
        {isOwner && draftSchedules.length > 0 && (
          <div style={styles.ownerReviewBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={styles.ownerCrownIcon}>👑</div>
              <div>
                <strong style={{ fontSize: 13.5, color: '#6d28d9' }}>
                  Panel Persetujuan Owner: Terdapat {draftSchedules.length} Sesi Draft Menunggu Review
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: 11.5, color: '#4c1d95' }}>
                  Admin telah menyiapkan usulan skema jadwal simulasi. Silakan periksa kesesuaian tentor, jam, dan mood siswa.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOwnerReviewOpen(true)}
              style={styles.btnReviewDraft}
            >
              👑 Review & Setujui Draft
            </button>
          </div>
        )}

        {/* TOP HEADER */}
        <div style={{
          ...styles.headerCard,
          background: isDarkMode ? 'linear-gradient(135deg, #0f172a, #1e293b)' : 'linear-gradient(135deg, #1e293b, #334155)',
          border: isDarkMode ? '1px solid #334155' : 'none'
        }}>
          <div style={styles.headerLeft}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Calendar size={22} color="#818cf8" />
              <h2 style={styles.pageTitle}>Manajemen Jadwal Operasional</h2>
            </div>
            <p style={styles.headerDate}>
              {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div style={styles.headerRight}>
            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              style={{
                ...styles.btnHeaderAction,
                background: isDarkMode ? '#f8fafc' : 'rgba(255,255,255,0.15)',
                color: isDarkMode ? '#0f172a' : '#ffffff'
              }}
              title="Ganti Mode Tampilan (Terang / Gelap)"
            >
              {isDarkMode ? <Sun size={14} color="#f59e0b" /> : <Moon size={14} />}
              {isDarkMode ? 'Mode Terang' : 'Dark Mode'}
            </button>

            {/* Download Jadwal Besar */}
            <button 
              onClick={() => setIsMasterDownloadOpen(true)} 
              style={{
                ...styles.btnHeaderAction,
                background: '#4f46e5',
                color: '#ffffff'
              }}
            >
              <Download size={14} /> Download / Share WA
            </button>

            {/* Kode Absen Harian */}
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

        {/* MODE SWITCHER: JADWAL RESMI VS SIMULASI / DRAFT */}
        <div style={styles.modeSwitchBar}>
          <div style={styles.modeTabs}>
            <button
              type="button"
              onClick={() => setScheduleMode('live')}
              style={{
                ...styles.modeTabBtn,
                background: scheduleMode === 'live' ? '#15803d' : '#f1f5f9',
                color: scheduleMode === 'live' ? '#ffffff' : '#475569',
                fontWeight: scheduleMode === 'live' ? 800 : 600
              }}
            >
              <CheckCircle2 size={15} /> 🟢 Jadwal Resmi (Live)
            </button>

            <button
              type="button"
              onClick={() => setScheduleMode('draft')}
              style={{
                ...styles.modeTabBtn,
                background: scheduleMode === 'draft' ? '#7c3aed' : '#f1f5f9',
                color: scheduleMode === 'draft' ? '#ffffff' : '#475569',
                fontWeight: scheduleMode === 'draft' ? 800 : 600
              }}
            >
              <Sparkles size={15} /> 🧪 Mode Draft & Simulasi (Coretan Kotor)
              {draftSchedules.length > 0 && (
                <span style={styles.draftBadgeCount}>{draftSchedules.length}</span>
              )}
            </button>
          </div>

          {/* Action di mode draft */}
          {scheduleMode === 'draft' && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleCloneLiveWeekToDraft}
                style={styles.btnDraftAction}
              >
                📋 Salin Jadwal Resmi ke Draft
              </button>
              {isOwner ? (
                <button
                  type="button"
                  onClick={() => setIsOwnerReviewOpen(true)}
                  style={styles.btnDraftApprove}
                >
                  👑 Setujui Seluruh Draft
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOwnerReviewOpen(true)}
                  style={styles.btnDraftSubmit}
                >
                  📤 Ajukan ke Owner
                </button>
              )}
            </div>
          )}
        </div>

        {/* BANNER PERINGATAN KETIKA DI MODE DRAFT */}
        {scheduleMode === 'draft' && (
          <div style={styles.draftWarningNotice}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#b45309" />
              <div>
                <strong>Anda berada di Ruang Simulasi & Coretan Skema Jadwal</strong>
                <div style={{ fontSize: 11.5, marginTop: 2 }}>
                  Perubahan, geser jam, atau tambah kelas di sini TIDAK AKAN mengubah jadwal live murid/tentor sampai disetujui Owner.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE TOGGLE (MATRIKS RUANGAN CALMENDAR, EXCEL GEMILANG, RINGKASAN AGENDA) */}
        <div style={styles.viewToggle}>
          <button 
            onClick={() => setViewMode('calmendar')} 
            style={styles.viewBtn(viewMode === 'calmendar', isDarkMode)}
          >
            🪐 Matriks Ruangan (Calmendar)
          </button>
          <button 
            onClick={() => setViewMode('excel')} 
            style={styles.viewBtn(viewMode === 'excel', isDarkMode)}
          >
            📊 Format Excel Gemilang (Per Kelas)
          </button>
          <button 
            onClick={() => setViewMode('weekly')} 
            style={styles.viewBtn(viewMode === 'weekly', isDarkMode)}
          >
            📋 Ringkasan Agenda
          </button>
        </div>

        {/* CONTENT ROW */}
        <div style={styles.contentRow(isMobile)}>
          
          {/* SIDEBAR KIRI: MINI CALENDAR & FILTERS (Gaya Calmendar) */}
          <div style={styles.miniCalendarCol(isMobile)}>
            <div style={{
              ...styles.miniCalendarCard,
              background: isDarkMode ? '#1e293b' : '#ffffff',
              borderColor: isDarkMode ? '#334155' : '#e2e8f0'
            }}>
              <div style={styles.miniCalHeader}>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={styles.miniCalNav}><ChevronLeft size={14} /></button>
                <span style={{
                  ...styles.miniCalMonth,
                  color: isDarkMode ? '#f8fafc' : '#1e293b'
                }}>
                  {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
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

              {/* FILTER RUANGAN & GURU */}
              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9'
              }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 4 }}>
                  🪐 Filter Ruangan:
                </label>
                <select
                  value={filterPlanet}
                  onChange={e => setFilterPlanet(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                    background: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    fontSize: 11.5,
                    marginBottom: 8
                  }}
                >
                  <option value="Semua">Semua Ruangan</option>
                  {PLANETS.map(p => <option key={p} value={p}>Ruang {p}</option>)}
                </select>

                <label style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#94a3b8' : '#64748b', display: 'block', marginBottom: 4 }}>
                  👨‍🏫 Filter Tentor:
                </label>
                <select
                  value={filterTeacher}
                  onChange={e => setFilterTeacher(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: 8,
                    border: isDarkMode ? '1px solid #475569' : '1px solid #cbd5e1',
                    background: isDarkMode ? '#0f172a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#0f172a',
                    fontSize: 11.5
                  }}
                >
                  <option value="Semua">Semua Tentor</option>
                  {availableTeachers.map(t => (
                    <option key={t.id} value={t.guruId || t.id}>
                      {t.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* SESI HARI INI (Upcoming Events Style) */}
              <div style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: isDarkMode ? '1px solid #334155' : '1px solid #f1f5f9'
              }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, color: isDarkMode ? '#f8fafc' : '#1e293b', marginBottom: 8 }}>
                  📌 Sesi Hari Ini ({getSmartDateString(selectedDate)}):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
                  {currentActiveSchedules
                    .filter(s => s.dateStr === getSmartDateString(selectedDate) && s.status !== 'cancelled')
                    .slice(0, 5)
                    .map(item => {
                      const photo = getTeacherPhoto(item);
                      return (
                        <div 
                          key={item.id} 
                          onClick={() => setDetailSchedule(item)}
                          style={{
                            padding: '6px 8px',
                            borderRadius: 8,
                            background: isDarkMode ? '#0f172a' : '#f8fafc',
                            border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer'
                          }}
                        >
                          {photo ? (
                            <img src={photo} alt={item.teacherName} style={styles.teacherImgMicro} />
                          ) : (
                            <div style={styles.teacherAvatarMicro}>
                              {item.teacherName?.charAt(0) || 'G'}
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: isDarkMode ? '#f8fafc' : '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {item.title || item.mapelName}
                            </div>
                            <div style={{ fontSize: 9.5, color: '#94a3b8' }}>
                              {item.start} · 🪐 {item.planet}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div style={styles.mainCol}>
            {viewMode === 'calmendar' && (
              <CalmendarTimetableView
                selectedDate={selectedDate}
                onSelectDate={d => setSelectedDate(d)}
                schedules={currentActiveSchedules}
                availableTeachers={availableTeachers}
                isDarkMode={isDarkMode}
                onOpenAddModal={handleOpenModal}
                onOpenEditModal={handleOpenModal}
                onOpenDetailModal={item => setDetailSchedule(item)}
                onOpenPindahRuang={item => setSessionToPindah(item)}
                onDeleteSchedule={handleDeleteSchedule}
              />
            )}

            {viewMode === 'excel' && (
              <GemilangExcelTimetableView
                schedules={currentActiveSchedules}
                availableTeachers={availableTeachers}
                weekDates={getWeekDates(selectedDate)}
                isDarkMode={isDarkMode}
                onOpenModal={handleOpenModal}
                onOpenDetailModal={item => setDetailSchedule(item)}
                onOpenPindahRuang={item => setSessionToPindah(item)}
              />
            )}

            {viewMode === 'weekly' && renderWeeklyView()}
          </div>
        </div>

        {/* MODAL TAMBAH/EDIT JADWAL */}
        {isModalOpen && (
          <div style={styles.overlay} onClick={() => setIsModalOpen(false)}>
            <div style={styles.modal(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h3 style={{margin: 0}}>
                  {editId ? "✏️ Edit Sesi Kelas" : "✨ Sesi Kelas Baru"} - Ruang {activePlanet}
                  {scheduleMode === 'draft' && <span style={styles.draftBadgeInline}>Mode Simulasi Draft</span>}
                </h3>
                <button onClick={() => setIsModalOpen(false)} style={styles.btnClose}><X size={20} /></button>
              </div>

              <form onSubmit={handleSubmitSchedule} style={styles.modalBody}>
                {editId && editingSeriesId && (
                  <div style={styles.seriesNotice}>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={applyToSeries}
                        onChange={e => setApplyToSeries(e.target.checked)}
                        style={{ marginTop: 2, width: 16, height: 16, flexShrink: 0 }}
                      />
                      <span style={{ fontSize: 12, color: '#78350f' }}>
                        <b>🔄 Jadwal ini bagian dari seri 4 minggu.</b> Terapkan perubahan ke SEMUA sesi di seri ini?
                      </span>
                    </label>
                  </div>
                )}

                <div style={styles.modalRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>⏰ Jam Mulai</label>
                    <input type="time" value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={styles.formInput} required />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>⏰ Jam Selesai</label>
                    <input type="time" value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={styles.formInput} required />
                  </div>
                </div>

                <div style={styles.modalRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Program</label>
                    <select value={formData.program} onChange={e => setFormData({...formData, program: e.target.value})} style={styles.formSelect}>
                      <option value="Reguler">📚 Reguler</option>
                      <option value="English Course">🗣️ English Course</option>
                      <option value="English">🗣️ English</option>
                      <option value="Privat">⭐ Privat (1-on-1)</option>
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
                  <label style={styles.formLabel}>👨‍🏫 Guru / Tentor</label>
                  <select required value={formData.teacherId} onChange={e => handleTeacherSelect(e.target.value)} style={styles.formSelect}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.guruId || t.id}>
                        {t.nama} {t.guruId ? '(' + t.guruId + ')' : ''} {t.mapel ? '- ' + t.mapel : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* INDIKATOR REAL-TIME BENTROK & JEDA WAKTU ISTIRAHAT GURU */}
                {liveConflictAnalysis && (
                  <div style={styles.conflictAnalysisContainer}>
                    {liveConflictAnalysis.hasConflict && (
                      <div style={styles.conflictAlertBox}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, color: '#b91c1c', marginBottom: 4 }}>
                          <AlertTriangle size={15} /> ⛔ BENTROK JADWAL TERDETEKSI:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#991b1b', lineHeight: 1.4 }}>
                          {liveConflictAnalysis.conflicts.map((c, i) => (
                            <li key={i}>{c.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {liveConflictAnalysis.warnings.length > 0 && (
                      <div style={styles.restWarningBox}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#b45309', marginBottom: 4 }}>
                          <Coffee size={15} /> ⚠️ PERINGATAN JEDA ISTIRAHAT:
                        </div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11, color: '#92400e', lineHeight: 1.4 }}>
                          {liveConflictAnalysis.warnings.map((w, i) => (
                            <li key={i}>{w.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {!liveConflictAnalysis.hasConflict && liveConflictAnalysis.warnings.length === 0 && (
                      <div style={styles.safeStatusBox}>
                        <CheckCircle size={15} color="#15803d" />
                        <span style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>
                          Ruangan kosong · Guru siap mengajar · ☕ {liveConflictAnalysis.restInfo?.notes || 'Jadwal aman'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>📘 Mata Pelajaran</label>
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
                  <label style={styles.formLabel}>📝 Materi / Judul Kelas</label>
                  <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.formInput} placeholder="Contoh: Matematika Persamaan Kuadrat" />
                </div>

                {/* ASSIGN SISWA */}
                {renderStudentSelectorUI()}

                {!editId && (
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>🔄 Pengulangan Sesi</label>
                    <select value={formData.repeat} onChange={e => setFormData({...formData, repeat: e.target.value})} style={styles.formSelect}>
                      <option value="Once">1x Pertemuan Saja</option>
                      <option value="Monthly">Otomatis 4 Pekan (1 Bulan)</option>
                    </select>
                  </div>
                )}

                <div style={styles.modalFooter}>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnCancel}>Batal</button>
                  <button type="submit" style={styles.btnSave}>
                    <Save size={16} /> {editId ? 'Perbarui Sesi' : (scheduleMode === 'draft' ? 'Simpan ke Draft' : 'Simpan Jadwal')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL PINDAH RUANGAN CEPAT */}
        {sessionToPindah && (
          <ModalPindahRuang
            schedule={sessionToPindah}
            allSchedules={currentActiveSchedules}
            teacherPhoto={getTeacherPhoto(sessionToPindah)}
            onClose={() => setSessionToPindah(null)}
            onSuccess={(newPlanet, reason) => {
              showAlert(`✅ Berhasil memindahkan kelas ke Ruangan ${newPlanet}!`);
              fetchData();
            }}
          />
        )}

        {/* MODAL DOWNLOAD & SHARE JADWAL BESAR */}
        {isMasterDownloadOpen && (
          <ModalDownloadJadwalBesar
            isOpen={isMasterDownloadOpen}
            onClose={() => setIsMasterDownloadOpen(false)}
            schedules={currentActiveSchedules}
            availableTeachers={availableTeachers}
            selectedDate={selectedDate}
            onShowAlert={showAlert}
          />
        )}

        {/* MODAL REVIEW OWNER FOR DRAFT SIMULATION */}
        {isOwnerReviewOpen && (
          <ModalReviewDraftOwner
            isOpen={isOwnerReviewOpen}
            onClose={() => setIsOwnerReviewOpen(false)}
            draftSchedules={draftSchedules}
            draftNotes={draftNotes}
            onShowAlert={showAlert}
            onSuccess={() => {
              fetchData();
              setScheduleMode('live');
            }}
          />
        )}

        {/* DETAIL MODAL */}
        {renderDetailModal()}

        {/* MODAL SIAPKAN LATIHAN SESI */}
        {jadwalLatihanSesi && (
          <ModalSiapkanLatihanSesi
            schedule={jadwalLatihanSesi}
            teacher={null}
            onClose={() => setJadwalLatihanSesi(null)}
            onSuccess={(updatedLatihan) => {
              setSchedules(prev =>
                prev.map(s => s.id === jadwalLatihanSesi.id ? { ...s, latihanSesi: updatedLatihan } : s)
              );
              setJadwalLatihanSesi(null);
            }}
          />
        )}

      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', transition: 'background 0.3s ease' },
  mainContent: (m) => ({ 
    marginLeft: m ? '0' : '236px', 
    padding: m ? '12px' : '24px', 
    width: m ? '100%' : 'calc(100% - 236px)', 
    boxSizing: 'border-box', 
    transition: '0.3s',
    minWidth: 0
  }),
  
  toast: { 
    position: 'fixed', top: 20, right: 20, zIndex: 9999, 
    background: '#1e293b', color: 'white', 
    padding: '12px 20px', borderRadius: 12, 
    fontWeight: 'bold', fontSize: 13, 
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)' 
  },
  
  loadingBox: { textAlign: 'center', padding: 80, color: '#94a3b8' },
  spinner: { 
    width: 40, height: 40, 
    border: '4px solid #e2e8f0', borderTop: '4px solid #3b82f6', 
    borderRadius: '50%', animation: 'spin 1s linear infinite', 
    margin: '0 auto 15px' 
  },

  ownerReviewBanner: {
    padding: '12px 18px',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    border: '1.5px solid #c4b5fd',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
    boxShadow: '0 4px 14px rgba(124, 58, 237, 0.1)'
  },
  ownerCrownIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    background: '#ddd6fe',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18
  },
  btnReviewDraft: {
    padding: '8px 16px',
    borderRadius: 10,
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
  },

  headerCard: { 
    padding: '18px 22px', borderRadius: 16, marginBottom: 16, 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', flexWrap: 'wrap', gap: 15, 
    color: 'white',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
  },
  headerLeft: {},
  pageTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: 'white' },
  headerDate: { margin: '4px 0 0', fontSize: 12, opacity: 0.8 },
  headerRight: { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  
  btnHeaderAction: { 
    border: 'none',
    padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
    fontWeight: 700, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6,
    transition: '0.2s'
  },
  
  codeBox: { 
    background: 'rgba(255,255,255,0.1)', padding: '6px 12px', 
    borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 
  },
  codeLabel: { fontSize: 10, fontWeight: 800, opacity: 0.85 },
  codeValue: { fontSize: 16, fontWeight: '900', color: '#fbbf24', fontFamily: 'monospace' },
  codeEditBtn: { background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 10 },
  codeInput: { width: 55, padding: '3px 6px', borderRadius: 4, textAlign: 'center', border: 'none', fontSize: 13, fontWeight: 'bold' },
  codeSaveBtn: { background: '#10b981', color: 'white', border: 'none', padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontWeight: 'bold' },

  modeSwitchBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 10
  },
  modeTabs: {
    display: 'flex',
    gap: 8
  },
  modeTabBtn: {
    padding: '8px 14px',
    borderRadius: 10,
    border: 'none',
    fontSize: 12,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: '0.15s ease'
  },
  draftBadgeCount: {
    background: '#ffffff',
    color: '#7c3aed',
    padding: '1px 6px',
    borderRadius: 8,
    fontSize: 10,
    fontWeight: 900
  },
  btnDraftAction: {
    padding: '7px 12px',
    borderRadius: 8,
    background: '#ede9fe',
    border: '1px solid #c4b5fd',
    color: '#6d28d9',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer'
  },
  btnDraftSubmit: {
    padding: '7px 14px',
    borderRadius: 8,
    background: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer'
  },
  btnDraftApprove: {
    padding: '7px 14px',
    borderRadius: 8,
    background: '#15803d',
    color: '#ffffff',
    border: 'none',
    fontSize: 11,
    fontWeight: 800,
    cursor: 'pointer'
  },
  draftWarningNotice: {
    padding: '10px 14px',
    borderRadius: 10,
    background: '#fef3c7',
    border: '1px solid #fde68a',
    color: '#92400e',
    marginBottom: 14,
    fontSize: 12
  },

  viewToggle: { display: 'flex', gap: 8, marginBottom: 16 },
  viewBtn: (active, isDark) => ({ 
    flex: 1, padding: '10px', borderRadius: 10, border: 'none', 
    fontWeight: 800, fontSize: 12, cursor: 'pointer', 
    background: active ? '#4f46e5' : (isDark ? '#1e293b' : '#e2e8f0'), 
    color: active ? '#ffffff' : (isDark ? '#94a3b8' : '#64748b'), 
    transition: '0.2s',
    boxShadow: active ? '0 4px 12px rgba(79, 70, 229, 0.25)' : 'none'
  }),

  contentRow: (m) => ({ display: 'flex', gap: 16, flexDirection: m ? 'column' : 'row' }),
  miniCalendarCol: (m) => ({ width: m ? '100%' : '260px', flexShrink: 0 }),
  mainCol: { flex: 1, minWidth: 0 },

  miniCalendarCard: { padding: 14, borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid' },
  miniCalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  miniCalNav: { background: '#f1f5f9', border: 'none', padding: '4px 8px', borderRadius: 6, cursor: 'pointer' },
  miniCalMonth: { fontSize: 12.5, fontWeight: 800 },
  miniCalWeekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 },
  miniCalWeekday: (d) => ({ textAlign: 'center', fontSize: 9.5, fontWeight: 'bold', color: d === 'Min' ? '#ef4444' : '#94a3b8', padding: '3px 0' }),
  miniCalDays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 },
  miniDayEmpty: { aspectRatio: '1' },
  miniDay: (sel, red, today, event, isDark) => ({
    aspectRatio: '1', borderRadius: 8, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
    position: 'relative', fontSize: 11, fontWeight: sel ? 'bold' : 'normal',
    transition: '0.15s'
  }),
  miniDayNum: (sel, red, today) => ({ fontSize: 11, fontWeight: sel || today ? 'bold' : 'normal' }),
  miniDayDot: { width: 4, height: 4, borderRadius: '50%', background: '#3b82f6', marginTop: 2 },
  miniEventDot: { width: 6, height: 6, borderRadius: '50%', marginTop: 2 },

  eventBanner: { 
    padding: '10px 14px', borderRadius: 10, 
    display: 'flex', justifyContent: 'space-between', 
    alignItems: 'center', color: 'white', marginBottom: 12 
  },
  eventBannerContent: { display: 'flex', alignItems: 'center', gap: 8 },
  eventBannerLabel: { fontWeight: 'bold', fontSize: 13 },
  eventBannerDesc: { fontSize: 11, opacity: 0.9 },

  planetGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  planetCard: { borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', border: '1px solid' },
  planetHeader: { padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid' },
  planetName: { margin: 0, fontSize: 13.5, fontWeight: 800, flex: 1 },
  planetCount: { fontSize: 10, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 8 },
  btnAddSmall: { background: '#4f46e5', color: 'white', border: 'none', padding: '4px 10px', borderRadius: 7, cursor: 'pointer', fontWeight: 700, fontSize: 10.5, display: 'flex', alignItems: 'center', gap: 4 },
  planetBody: { padding: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 },
  emptyPlanet: { gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 11.5, fontStyle: 'italic' },

  scheduleItem: { padding: 12, borderRadius: 12, border: '1px solid', display: 'flex', flexDirection: 'column', gap: 6 },
  scheduleTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  timeBadge: { fontSize: 10.5, fontWeight: 800, color: '#1e293b', background: '#e2e8f0', padding: '2px 7px', borderRadius: 6 },
  programBadge: (p) => ({
    fontSize: 9.5,
    fontWeight: 'bold',
    color: (p === 'English' || p === 'English Course') ? '#7c3aed' : p === 'Privat' ? '#b45309' : '#047857',
    background: (p === 'English' || p === 'English Course') ? '#f5f3ff' : p === 'Privat' ? '#fffbeb' : '#ecfdf5',
    padding: '2px 6px',
    borderRadius: 4,
  }),
  draftBadge: { fontSize: 9, fontWeight: 800, background: '#fef3c7', color: '#b45309', padding: '2px 6px', borderRadius: 4 },
  draftBadgeInline: { marginLeft: 8, fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#6d28d9', padding: '2px 8px', borderRadius: 6 },
  seriesBadge: { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 9, fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '2px 6px', borderRadius: 6 },
  scheduleTitle: { fontSize: 13, fontWeight: 800 },
  
  teacherInfoRow: { display: 'flex', alignItems: 'center', gap: 8, margin: '2px 0' },
  teacherImgSmall: { width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #818cf8', flexShrink: 0 },
  teacherAvatarSmall: { width: 26, height: 26, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 },
  teacherImgMicro: { width: 18, height: 18, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 },
  teacherAvatarMicro: { width: 18, height: 18, borderRadius: '50%', background: '#6366f1', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, flexShrink: 0 },

  studentPreview: { display: 'flex', gap: 4, flexWrap: 'wrap' },
  studentChip: { background: '#e0e7ff', color: '#3730a3', padding: '1px 6px', borderRadius: 4, fontSize: 9.5, fontWeight: 600 },
  studentMore: { fontSize: 9.5, color: '#94a3b8' },
  
  scheduleActions: { display: 'flex', gap: 4, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 6, marginTop: 4 },
  btnPindahSm: { flex: 1.2, padding: '5px', borderRadius: 6, background: '#e0e7ff', color: '#3730a3', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnEditSm: { flex: 1, padding: '5px', borderRadius: 6, background: '#fef3c7', color: '#b45309', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnDetailSm: { flex: 1, padding: '5px', borderRadius: 6, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnDeleteSm: { flex: 1, padding: '5px', borderRadius: 6, background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 9.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 },
  btnMiniAction: { padding: '2px 6px', borderRadius: 4, background: '#ffffff', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: 10 },
  btnPindahDetail: { marginLeft: 10, padding: '3px 8px', borderRadius: 6, background: '#e0e7ff', color: '#4338ca', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 },

  weeklyGrid: { display: 'flex', flexDirection: 'column', gap: 10 },
  weeklyDay: (today, holiday, event) => ({ 
    borderRadius: 12, padding: 12, border: '1px solid'
  }),
  weeklyHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' },
  weeklyDayName: (red) => ({ fontSize: 12.5, fontWeight: 800 }),
  weeklyDate: { fontSize: 11, color: '#94a3b8' },
  weeklyEventBadge: { fontSize: 9, padding: '1px 6px', borderRadius: 8, color: 'white', fontWeight: 'bold' },
  weeklyBody: { display: 'flex', flexDirection: 'column', gap: 4 },
  weeklyEmpty: { color: '#94a3b8', fontSize: 11, fontStyle: 'italic' },
  weeklyItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, flexWrap: 'wrap' },
  weeklyTime: { fontSize: 10.5, fontWeight: 800, color: '#3b82f6' },
  weeklyPlanet: { fontSize: 10, color: '#64748b' },

  conflictAnalysisContainer: {
    margin: '4px 0 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6
  },
  conflictAlertBox: {
    padding: '8px 12px',
    borderRadius: 8,
    background: '#fef2f2',
    border: '1.5px solid #fecaca'
  },
  restWarningBox: {
    padding: '8px 12px',
    borderRadius: 8,
    background: '#fffbeb',
    border: '1.5px solid #fde68a'
  },
  safeStatusBox: {
    padding: '7px 12px',
    borderRadius: 8,
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999, backdropFilter: 'blur(3px)', padding: 16 },
  modal: (m) => ({ background: 'white', padding: m ? 16 : 24, borderRadius: 18, width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }),
  detailModal: (m) => ({ background: 'white', padding: m ? 16 : 24, borderRadius: 18, width: '100%', maxWidth: '540px', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.3)' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' },
  btnClose: { background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' },
  modalBody: { display: 'flex', flexDirection: 'column', gap: 10 },
  modalRow: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  formGroup: { flex: 1, minWidth: 130, display: 'flex', flexDirection: 'column', gap: 4 },
  formLabel: { fontSize: 11, fontWeight: 700, color: '#64748b' },
  formInput: { padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, width: '100%', boxSizing: 'border-box' },
  formSelect: { padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 12.5, width: '100%', boxSizing: 'border-box', background: 'white' },
  modalFooter: { display: 'flex', gap: 10, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f1f5f9' },
  btnCancel: { flex: 1, padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', fontWeight: 700, fontSize: 12, cursor: 'pointer', color: '#64748b' },
  btnSave: { flex: 2, padding: 10, borderRadius: 10, border: 'none', background: '#4f46e5', color: 'white', fontWeight: 800, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 },
  seriesNotice: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: 10 },

  detailContent: { display: 'flex', flexDirection: 'column', gap: 8 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 12 },
  detailDivider: { height: 1, background: '#e2e8f0', margin: '6px 0' },
  detailStudentList: { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' },
  detailStudentItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: '#f8fafc', borderRadius: 6, fontSize: 11 },
  detailStudentNum: { color: '#94a3b8', minWidth: 18 },
  detailStudentName: { fontWeight: 700, flex: 1 },
  detailStudentKelas: { background: '#eef2ff', color: '#3b82f6', padding: '1px 6px', borderRadius: 4, fontSize: 9.5 }
};

export default SchedulePage;
