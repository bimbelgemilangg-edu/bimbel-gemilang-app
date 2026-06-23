import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../components/SidebarAdmin';
import { db } from '../../firebase';
import { collection, getDocs, addDoc, query, orderBy, where, serverTimestamp, onSnapshot } from "firebase/firestore";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { 
  Save, Clock, UserCheck, ShieldAlert, CreditCard, 
  FileText, List, Bold, Italic, Download, Table, AlertTriangle,
  Users, RefreshCw, FileSpreadsheet, Calendar, Filter,
  ChevronLeft, ChevronRight, X, CheckCircle, Clock3, FileEdit, Flag
} from 'lucide-react';

// === DATA HARI LIBUR NASIONAL INDONESIA 2025-2026 ===
const INDONESIAN_HOLIDAYS = {
  '2025-01-01': { name: 'Tahun Baru 2025 Masehi', type: 'nasional' },
  '2025-01-27': { name: 'Isra Mikraj Nabi Muhammad SAW', type: 'nasional' },
  '2025-01-29': { name: 'Tahun Baru Imlek 2576 Kongzili', type: 'nasional' },
  '2025-03-29': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', type: 'nasional' },
  '2025-03-31': { name: 'Idul Fitri 1446 Hijriah', type: 'nasional' },
  '2025-04-01': { name: 'Idul Fitri 1446 Hijriah', type: 'nasional' },
  '2025-04-18': { name: 'Wafat Yesus Kristus', type: 'nasional' },
  '2025-05-01': { name: 'Hari Buruh Internasional', type: 'nasional' },
  '2025-05-12': { name: 'Hari Raya Waisak 2569 BE', type: 'nasional' },
  '2025-05-29': { name: 'Kenaikan Yesus Kristus', type: 'nasional' },
  '2025-06-01': { name: 'Hari Lahir Pancasila', type: 'nasional' },
  '2025-06-07': { name: 'Idul Adha 1446 Hijriah', type: 'nasional' },
  '2025-06-27': { name: 'Tahun Baru Islam 1447 Hijriah', type: 'nasional' },
  '2025-08-17': { name: 'Hari Kemerdekaan RI', type: 'nasional' },
  '2025-09-05': { name: 'Maulid Nabi Muhammad SAW', type: 'nasional' },
  '2025-12-25': { name: 'Hari Raya Natal', type: 'nasional' },
  '2026-01-01': { name: 'Tahun Baru 2026 Masehi', type: 'nasional' },
  '2026-02-17': { name: 'Tahun Baru Imlek 2577 Kongzili', type: 'nasional' },
  '2026-03-19': { name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', type: 'nasional' },
  '2026-03-20': { name: 'Idul Fitri 1447 Hijriah (Perkiraan)', type: 'nasional' },
  '2026-03-21': { name: 'Idul Fitri 1447 Hijriah (Perkiraan)', type: 'nasional' },
  '2026-04-03': { name: 'Wafat Yesus Kristus', type: 'nasional' },
  '2026-05-01': { name: 'Hari Buruh Internasional', type: 'nasional' },
  '2026-05-14': { name: 'Kenaikan Yesus Kristus', type: 'nasional' },
  '2026-05-31': { name: 'Hari Raya Waisak 2570 BE', type: 'nasional' },
  '2026-06-01': { name: 'Hari Lahir Pancasila', type: 'nasional' },
  '2026-08-17': { name: 'Hari Kemerdekaan RI', type: 'nasional' },
  '2026-12-25': { name: 'Hari Raya Natal', type: 'nasional' },
};

const isHoliday = (dateStr) => INDONESIAN_HOLIDAYS[dateStr] || null;

const AdminDailyLog = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);

  // === STATE DETEKSI OTOMATIS ===
  const [teacherAttendanceStatus, setTeacherAttendanceStatus] = useState([]);

  // === DOWNLOAD RENTANG TANGGAL ===
  const [showDateRangeModal, setShowDateRangeModal] = useState(false);
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });
  const [isDownloadingRange, setIsDownloadingRange] = useState(false);

  // === VISUAL CALENDAR ===
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [holidaysLoaded, setHolidaysLoaded] = useState(false);

  // === IZIN ===
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [izinForm, setIzinForm] = useState({
    tanggal: '', adminName: '', alasan: '', status: 'Izin'
  });
  const [isSubmittingIzin, setIsSubmittingIzin] = useState(false);

  // === FORM DATA ===
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    adminName: "", jamMasuk: "", jamPulang: "",
    siswa: { jumlahHadir: 0, namaTidakHadir: "", alasanAbsen: "" },
    tentor: { id: "", nama: "", status: "Hadir" },
    operasional: { pembayaranMasuk: "", detailKomplain: "" },
    canvasNarasi: "", riskLevel: "🟢 Aman", customRisk: "",
    checklist: { areaBersih: false, acMati: false, pintuKunci: false, kasTersimpan: false }
  });

  // ============================================================
  // EFFECTS
  // ============================================================
  useEffect(() => {
    fetchTeachers();
    fetchHistory();
    fetchAttendanceSummary();
    fetchTeacherAttendanceStatus();
    fetchCalendarData();
    fetchHolidaysFromAPI();
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { fetchCalendarData(); }, [calendarDate]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "attendance"), where("date", "==", today));
    const unsubscribe = onSnapshot(q, () => {
      fetchAttendanceSummary();
      fetchTeacherAttendanceStatus();
      fetchCalendarData();
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // FETCH FUNCTIONS
  // ============================================================
  const fetchHolidaysFromAPI = async () => {
    try {
      const response = await fetch('https://api-harilibur.vercel.app/api');
      if (response.ok) {
        const data = await response.json();
        data.forEach(holiday => {
          const dateStr = holiday.holiday_date || holiday.tanggal;
          if (dateStr && holiday.is_national_holiday) {
            INDONESIAN_HOLIDAYS[dateStr] = {
              name: holiday.holiday_name || holiday.keterangan, type: 'nasional'
            };
          }
        });
      }
    } catch (err) { console.log('Menggunakan data libur nasional statis'); }
    finally { setHolidaysLoaded(true); }
  };

  const fetchTeachers = async () => {
    try {
      const snap = await getDocs(collection(db, "teachers"));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error("Gagal ambil data guru", e); }
  };

  const fetchHistory = async () => {
    const q = query(collection(db, "admin_daily_logs"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchCalendarData = async () => {
    try {
      const year = calendarDate.getFullYear();
      const month = calendarDate.getMonth();
      const startOfMonth = new Date(year, month, 1);
      const endOfMonth = new Date(year, month + 1, 0);
      const startStr = startOfMonth.toISOString().split('T')[0];
      const endStr = endOfMonth.toISOString().split('T')[0];

      const qLogs = query(collection(db, "admin_daily_logs"),
        where("tanggal", ">=", startStr), where("tanggal", "<=", endStr), orderBy("tanggal", "asc"));
      const snapLogs = await getDocs(qLogs);
      
      const qIzin = query(collection(db, "admin_izin"),
        where("tanggal", ">=", startStr), where("tanggal", "<=", endStr), orderBy("tanggal", "asc"));
      const snapIzin = await getDocs(qIzin);

      const dataMap = {};
      snapLogs.docs.forEach(d => {
        const logData = d.data();
        dataMap[logData.tanggal] = { status: 'active', type: 'log', data: { id: d.id, ...logData } };
      });
      snapIzin.docs.forEach(d => {
        const izinData = d.data();
        dataMap[izinData.tanggal] = { status: 'izin', type: 'izin', data: { id: d.id, ...izinData } };
      });

      for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const holiday = INDONESIAN_HOLIDAYS[dateStr];
        if (holiday && !dataMap[dateStr]) {
          dataMap[dateStr] = { status: 'holiday', type: 'holiday', data: { name: holiday.name, type: holiday.type } };
        }
      }
      setCalendarData(dataMap);
    } catch (err) { console.error("Gagal fetch data kalender:", err); }
  };

  const fetchAttendanceSummary = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", today));
      const snapJadwal = await getDocs(qJadwal);
      const jadwalList = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const qAttendance = query(collection(db, "attendance"), where("date", "==", today));
      const snapAttendance = await getDocs(qAttendance);
      const attendanceData = snapAttendance.docs.map(d => ({ id: d.id, ...d.data() }));

      const summaryArray = [];
      jadwalList.forEach(jadwal => {
        const jadwalAttendance = attendanceData.filter(record =>
          record.scheduleId === jadwal.id || record.mapel === jadwal.title);
        const jadwalStudents = jadwal.students || [];
        const hadirList = [];
        const tidakHadirList = [];
        
        jadwalAttendance.forEach(record => {
          if (record.status === "Hadir" || record.status === "hadir") {
            hadirList.push(record.studentName || record.namaSiswa);
          } else {
            tidakHadirList.push({
              nama: record.studentName || record.namaSiswa,
              status: record.status || "Alpha", keterangan: record.keterangan || "-"
            });
          }
        });
        
        jadwalStudents.forEach(siswa => {
          const namaSiswa = siswa.nama || siswa;
          if (!hadirList.includes(namaSiswa) && !tidakHadirList.some(t => t.nama === namaSiswa)) {
            tidakHadirList.push({ nama: namaSiswa, status: "Alpha", keterangan: "Belum absen" });
          }
        });
        
        summaryArray.push({
          jadwalId: jadwal.id, title: jadwal.title || "Kelas Umum",
          room: jadwal.planet || "Ruang Umum", teacher: jadwal.booker || "Guru",
          start: jadwal.start, end: jadwal.end,
          totalStudents: jadwalStudents.length, totalHadir: hadirList.length,
          totalTidakHadir: tidakHadirList.length, hadir: hadirList, tidakHadir: tidakHadirList
        });
      });
      setAttendanceSummary(summaryArray);
    } catch (err) { console.error("Gagal fetch absensi:", err); }
  };

  // === DETEKSI GURU BELUM ABSEN ===
  const fetchTeacherAttendanceStatus = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const qJadwal = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", today));
      const snapJadwal = await getDocs(qJadwal);
      const jadwalList = snapJadwal.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const qTeacherLogs = query(collection(db, "teacher_logs"),
        where("tanggal", ">=", today), where("tanggal", "<=", today + "T23:59:59"));
      const snapTeacherLogs = await getDocs(qTeacherLogs);
      const teacherLogsToday = snapTeacherLogs.docs.map(d => ({ id: d.id, ...d.data() }));
      
      const statusList = [];
      jadwalList.forEach(jadwal => {
        if (!jadwal.booker || !jadwal.teacherId) return;
        const sudahAbsen = teacherLogsToday.some(log =>
          log.teacherId === jadwal.teacherId || log.namaGuru === jadwal.booker);
        
        const existing = statusList.find(s => s.teacherId === jadwal.teacherId);
        if (!existing) {
          statusList.push({
            teacherId: jadwal.teacherId, nama: jadwal.booker,
            jadwalList: [{ jadwalId: jadwal.id, planet: jadwal.planet, start: jadwal.start, end: jadwal.end, mapel: jadwal.mapel || '-', title: jadwal.title || '-' }],
            sudahAbsen
          });
        } else {
          existing.jadwalList.push({ jadwalId: jadwal.id, planet: jadwal.planet, start: jadwal.start, end: jadwal.end, mapel: jadwal.mapel || '-', title: jadwal.title || '-' });
          if (sudahAbsen) existing.sudahAbsen = true;
        }
      });
      setTeacherAttendanceStatus(statusList);
    } catch (err) { console.error("Gagal deteksi guru:", err); }
  };

  // ============================================================
  // CALENDAR HELPERS
  // ============================================================
  const getDaysInMonth = (date) => {
    const year = date.getFullYear(), month = date.getMonth();
    return { daysInMonth: new Date(year, month + 1, 0).getDate(), firstDayOfMonth: new Date(year, month, 1).getDay() };
  };
  const changeMonth = (delta) => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + delta, 1));
  const goToToday = () => setCalendarDate(new Date());
  const handleDayClick = (day) => {
    const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayData = calendarData[dateStr];
    if (dayData) { setSelectedDayDetail({ date: dateStr, ...dayData }); setShowDayDetail(true); }
  };

  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  // ============================================================
  // IZIN
  // ============================================================
  const openIzinModal = () => {
    setIzinForm({ tanggal: new Date().toISOString().split('T')[0], adminName: '', alasan: '', status: 'Izin' });
    setShowIzinModal(true);
  };
  const handleSubmitIzin = async () => {
    if (!izinForm.tanggal || !izinForm.adminName || !izinForm.alasan) return alert('⚠️ Mohon lengkapi semua field!');
    setIsSubmittingIzin(true);
    try {
      await addDoc(collection(db, "admin_izin"), { ...izinForm, createdAt: serverTimestamp() });
      alert('✅ Izin berhasil dicatat!');
      setShowIzinModal(false);
      fetchCalendarData();
    } catch (err) { alert('❌ Gagal mencatat izin: ' + err.message); }
    finally { setIsSubmittingIzin(false); }
  };

  // ============================================================
  // DOWNLOAD RANGE
  // ============================================================
  const handleDownloadByDateRange = async () => {
    if (!dateRange.startDate || !dateRange.endDate) return alert('⚠️ Silakan pilih tanggal!');
    if (new Date(dateRange.startDate) > new Date(dateRange.endDate)) return alert('⚠️ Tanggal mulai > akhir!');
    setIsDownloadingRange(true);
    try {
      const q = query(collection(db, "admin_daily_logs"),
        where("tanggal", ">=", dateRange.startDate), where("tanggal", "<=", dateRange.endDate), orderBy("tanggal", "asc"));
      const snap = await getDocs(q);
      if (snap.empty) { alert('ℹ️ Tidak ada data.'); setIsDownloadingRange(false); return; }
      const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Bimbel Gemilang';
      
      const summarySheet = workbook.addWorksheet('Ringkasan');
      summarySheet.columns = [
        { header: 'No', key: 'no', width: 5 }, { header: 'Tanggal', key: 'tanggal', width: 12 },
        { header: 'Admin', key: 'adminName', width: 20 }, { header: 'Jam Masuk', key: 'jamMasuk', width: 12 },
        { header: 'Jam Pulang', key: 'jamPulang', width: 12 }, { header: 'Guru', key: 'guru', width: 25 },
        { header: 'Siswa Hadir', key: 'siswaHadir', width: 12 }, { header: 'Risk', key: 'riskLevel', width: 25 },
        { header: 'Custom Risk', key: 'customRisk', width: 30 }
      ];
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
      summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0F172A' } };
      logs.forEach((log, i) => summarySheet.addRow({ no: i+1, tanggal: log.tanggal, adminName: log.adminName, jamMasuk: log.jamMasuk, jamPulang: log.jamPulang, guru: log.tentor?.nama, siswaHadir: log.siswa?.jumlahHadir || 0, riskLevel: log.riskLevel, customRisk: log.customRisk }));
      
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Laporan_Audit_${dateRange.startDate}_${dateRange.endDate}.xlsx`);
      setShowDateRangeModal(false);
      alert(`✅ Berhasil download ${logs.length} laporan!`);
    } catch (err) { alert('❌ Gagal: ' + err.message); }
    finally { setIsDownloadingRange(false); }
  };

  // ============================================================
  // SUBMIT LOG
  // ============================================================
  const applyFormat = (tag) => {
    const textarea = document.getElementById('canvasNarasi');
    if (!textarea) return;
    const start = textarea.selectionStart, end = textarea.selectionEnd, text = textarea.value, selected = text.substring(start, end);
    setFormData({ ...formData, canvasNarasi: text.substring(0, start) + (tag === 'B' ? `**${selected}**` : tag === 'I' ? `*${selected}*` : `\n- ${selected}`) + text.substring(end) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const selectedT = teachers.find(t => t.id === formData.tentor.id);
      await addDoc(collection(db, "admin_daily_logs"), { ...formData, tentor: { ...formData.tentor, nama: selectedT?.nama || "Manual/Luar" }, createdAt: serverTimestamp() });
      alert("✅ Audit Tersimpan!"); fetchHistory(); fetchCalendarData();
    } catch (error) { alert(error.message); }
    finally { setLoading(false); }
  };

  const handleExportPDF = (log) => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16); doc.text("LAPORAN AUDIT HARIAN - BIMBEL GEMILANG", 14, 20);
      doc.setFontSize(11); doc.text(`Tanggal: ${log.tanggal || "-"}`, 14, 30);
      doc.text(`Admin: ${log.adminName}`, 14, 37); doc.text(`Jam: ${log.jamMasuk} - ${log.jamPulang}`, 14, 44);
      doc.text(`Risk: ${log.riskLevel}`, 14, 51); doc.text(`Guru: ${log.tentor?.nama}`, 14, 58);
      if (log.canvasNarasi) { doc.text("Narasi:", 14, 68); doc.text(doc.splitTextToSize(log.canvasNarasi, 180), 14, 75); }
      doc.save(`Audit_${log.tanggal || 'unknown'}.pdf`);
    } catch (err) { alert("Gagal PDF: " + err.message); }
  };

  const handleExportExcel = async (log) => {
    try {
      const workbook = new ExcelJS.Workbook(), worksheet = workbook.addWorksheet('Audit');
      worksheet.columns = [{ header: 'Field', key: 'field', width: 20 }, { header: 'Value', key: 'value', width: 50 }];
      worksheet.addRows([
        { field: 'Tanggal', value: log.tanggal }, { field: 'Admin', value: log.adminName },
        { field: 'Jam', value: `${log.jamMasuk} - ${log.jamPulang}` }, { field: 'Risk', value: log.riskLevel },
        { field: 'Guru', value: log.tentor?.nama }, { field: 'Siswa Hadir', value: log.siswa?.jumlahHadir || 0 },
        { field: 'Narasi', value: log.canvasNarasi }
      ]);
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `Audit_${log.tanggal}.xlsx`);
    } catch (err) { alert("Gagal Excel: " + err.message); }
  };

  // ============================================================
  // RENDER CALENDAR
  // ============================================================
  const renderCalendar = () => {
    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(calendarDate);
    const today = new Date(), todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const year = calendarDate.getFullYear(), month = calendarDate.getMonth();
    const weeks = []; let days = []; let dayCount = 1;
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
    while (dayCount <= daysInMonth) {
      const currentDay = dayCount, dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(currentDay).padStart(2,'0')}`;
      const dayData = calendarData[dateStr], holiday = INDONESIAN_HOLIDAYS[dateStr];
      const isToday = dateStr === todayStr, isSun = new Date(year, month, currentDay).getDay() === 0;
      let dayStyle = { ...styles.calendarDay }, dotStyle = { ...styles.dayDot };
      if (holiday || isSun) { dayStyle = { ...dayStyle, ...styles.calendarDayHoliday }; }
      else if (dayData?.status === 'active') { dayStyle = { ...dayStyle, ...styles.calendarDayActive }; dotStyle = { ...dotStyle, ...styles.dayDotActive }; }
      else if (dayData?.status === 'izin') { dayStyle = { ...dayStyle, ...styles.calendarDayIzin }; dotStyle = { ...dotStyle, ...styles.dayDotIzin }; }
      if (isToday) dayStyle = { ...dayStyle, ...styles.calendarDayToday };
      days.push(
        <div key={currentDay} style={dayStyle} onClick={() => handleDayClick(currentDay)} title={holiday?.name || (dayData ? (dayData.status === 'izin' ? 'Izin' : 'Aktif') : (isSun ? 'Minggu' : ''))}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <span style={styles.dayNumber(isToday, holiday || isSun)}>{currentDay}</span>
            {holiday && <Flag size={8} style={{ color: '#ef4444' }} />}
          </div>
          {holiday && <span style={styles.holidayLabel}>{holiday.name.length > 10 ? holiday.name.substring(0,10)+'...' : holiday.name}</span>}
          {!holiday && dayData && !isSun && <div style={dotStyle}></div>}
          {!holiday && !dayData && isSun && <span style={styles.sundayLabel}>Minggu</span>}
        </div>
      );
      dayCount++;
      if (days.length === 7 || dayCount > daysInMonth) {
        while (days.length < 7) days.push(<div key={`empty-end-${days.length}`} style={styles.calendarDayEmpty}></div>);
        weeks.push(<div key={`week-${weeks.length}`} style={styles.calendarWeek}>{days}</div>);
        days = [];
      }
    }
    return weeks;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div style={styles.wrapper}>
      <SidebarAdmin />
      <div style={styles.mainContent(isMobile)}>
        {/* HEADER */}
        <div style={styles.header(isMobile)}>
          <h2 style={styles.pageTitle(isMobile)}><ShieldAlert size={20} /> Daily Audit Intelligence</h2>
          <div style={styles.headerButtons(isMobile)}>
            <button onClick={() => { setDateRange({ startDate: '', endDate: '' }); setShowDateRangeModal(true); }} style={styles.btnDownloadRange(isMobile)}><Calendar size={14} /> Download Range</button>
            <button onClick={() => { fetchAttendanceSummary(); fetchTeacherAttendanceStatus(); }} style={styles.btnRefresh(isMobile)}><RefreshCw size={14} /> Refresh</button>
            <input type="date" style={styles.dateInput(isMobile)} value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
          </div>
        </div>

        {/* VISUAL CALENDAR */}
        <div style={styles.sectionCard}>
          <div style={styles.calendarHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={styles.sectionTitle(isMobile)}><Calendar size={18} /> Kalender Aktivitas Admin</h3>
              <span style={styles.liveDot}></span>
            </div>
            <div style={styles.calendarNav}>
              <button onClick={goToToday} style={styles.calendarTodayBtn}>Hari Ini</button>
              <button onClick={() => changeMonth(-1)} style={styles.calendarNavBtn}><ChevronLeft size={16} /></button>
              <span style={styles.calendarMonthLabel}>{monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}</span>
              <button onClick={() => changeMonth(1)} style={styles.calendarNavBtn}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div style={styles.calendarLegend}>
            <div style={styles.legendItem}><div style={{ ...styles.legendDot, background: '#27ae60' }}></div><span style={styles.legendText}>Aktif</span></div>
            <div style={styles.legendItem}><div style={{ ...styles.legendDot, background: '#f59e0b' }}></div><span style={styles.legendText}>Izin</span></div>
            <div style={styles.legendItem}><div style={{ ...styles.legendDot, background: '#fee2e2', border: '2px solid #ef4444' }}></div><span style={styles.legendText}>Libur/Merah</span></div>
            <div style={styles.legendItem}><div style={{ ...styles.legendDot, background: '#e2e8f0', border: '1px solid #cbd5e1' }}></div><span style={styles.legendText}>Kosong</span></div>
            <button onClick={openIzinModal} style={styles.btnIzin}><FileEdit size={14} /> Catat Izin</button>
          </div>
          <div style={styles.calendarDayNames}>{dayNames.map(day => <div key={day} style={{...styles.dayName, ...(day==='Min'?{color:'#ef4444'}:{})}}>{day}</div>)}</div>
          <div style={styles.calendarGrid}>{renderCalendar()}</div>
          <div style={styles.upcomingHolidays}>
            <h4 style={styles.upcomingTitle}><Flag size={14} /> Hari Libur Nasional Bulan Ini</h4>
            <div style={styles.holidayList}>
              {Object.entries(INDONESIAN_HOLIDAYS).filter(([date]) => { const hd = new Date(date); return hd.getMonth() === calendarDate.getMonth() && hd.getFullYear() === calendarDate.getFullYear(); }).map(([date, holiday]) => (
                <div key={date} style={styles.holidayItem}><span style={styles.holidayDate}>{new Date(date).getDate()} {monthNames[new Date(date).getMonth()]}</span><span style={styles.holidayName}>{holiday.name}</span></div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL DETAIL HARI */}
        {showDayDetail && selectedDayDetail && (
          <div style={styles.modalOverlay} onClick={() => setShowDayDetail(false)}>
            <div style={styles.modalContent(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}><h3 style={styles.modalTitle}>{selectedDayDetail.status === 'holiday' ? '🔴' : selectedDayDetail.status === 'izin' ? '🟡' : '🟢'} {selectedDayDetail.date}</h3><button onClick={() => setShowDayDetail(false)} style={styles.modalClose}><X size={18} /></button></div>
              <div style={styles.modalBody}>
                {selectedDayDetail.status === 'holiday' ? (
                  <div style={styles.detailCard}><div style={styles.detailBadgeHoliday}><Flag size={16} /> HARI LIBUR NASIONAL</div><div style={styles.detailRow}><span style={styles.detailLabel}>Nama:</span><span style={{...styles.detailValue, fontWeight:'bold', color:'#ef4444'}}>{selectedDayDetail.data.name}</span></div></div>
                ) : selectedDayDetail.status === 'izin' ? (
                  <div style={styles.detailCard}><div style={styles.detailBadgeIzin}><Clock3 size={16} /> IZIN</div><div style={styles.detailRow}><span style={styles.detailLabel}>Admin:</span><span style={styles.detailValue}>{selectedDayDetail.data.adminName}</span></div><div style={styles.detailRow}><span style={styles.detailLabel}>Alasan:</span><span style={styles.detailValue}>{selectedDayDetail.data.alasan}</span></div></div>
                ) : (
                  <div style={styles.detailCard}><div style={styles.detailBadgeActive}><CheckCircle size={16} /> AKTIF</div><div style={styles.detailRow}><span style={styles.detailLabel}>Admin:</span><span style={styles.detailValue}>{selectedDayDetail.data.adminName}</span></div><div style={styles.detailRow}><span style={styles.detailLabel}>Jam:</span><span style={styles.detailValue}>{selectedDayDetail.data.jamMasuk} - {selectedDayDetail.data.jamPulang}</span></div></div>
                )}
              </div>
              <div style={styles.modalFooter}><button onClick={() => setShowDayDetail(false)} style={styles.modalBtnCancel}>Tutup</button></div>
            </div>
          </div>
        )}

        {/* MODAL IZIN */}
        {showIzinModal && (
          <div style={styles.modalOverlay} onClick={() => setShowIzinModal(false)}>
            <div style={styles.modalContent(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}><h3 style={styles.modalTitle}><FileEdit size={20} /> Catat Izin Admin</h3><button onClick={() => setShowIzinModal(false)} style={styles.modalClose}><X size={18} /></button></div>
              <div style={styles.modalBody}>
                <div style={styles.izinField}><label style={styles.dateLabel}><Calendar size={14} /> Tanggal</label><input type="date" style={styles.modalDateInput} value={izinForm.tanggal} onChange={e => setIzinForm({...izinForm, tanggal: e.target.value})} /></div>
                <div style={styles.izinField}><label style={styles.dateLabel}><UserCheck size={14} /> Nama Admin</label><input type="text" style={styles.izinInput} placeholder="Nama admin..." value={izinForm.adminName} onChange={e => setIzinForm({...izinForm, adminName: e.target.value})} /></div>
                <div style={styles.izinField}><label style={styles.dateLabel}><FileText size={14} /> Alasan</label><textarea style={styles.izinTextarea} placeholder="Alasan izin..." value={izinForm.alasan} onChange={e => setIzinForm({...izinForm, alasan: e.target.value})} rows={3} /></div>
              </div>
              <div style={styles.modalFooter}><button onClick={() => setShowIzinModal(false)} style={styles.modalBtnCancel}>Batal</button><button onClick={handleSubmitIzin} style={styles.modalBtnDownload} disabled={isSubmittingIzin}>{isSubmittingIzin ? '⏳' : <><Save size={16} /> Simpan</>}</button></div>
            </div>
          </div>
        )}

        {/* MODAL DOWNLOAD RANGE */}
        {showDateRangeModal && (
          <div style={styles.modalOverlay} onClick={() => setShowDateRangeModal(false)}>
            <div style={styles.modalContent(isMobile)} onClick={e => e.stopPropagation()}>
              <div style={styles.modalHeader}><h3 style={styles.modalTitle}><Filter size={20} /> Download Rentang Tanggal</h3><button onClick={() => setShowDateRangeModal(false)} style={styles.modalClose}><X size={18} /></button></div>
              <div style={styles.modalBody}>
                <div style={styles.dateRangeInputs}>
                  <div style={styles.dateField}><label style={styles.dateLabel}><Calendar size={14} /> Dari</label><input type="date" style={styles.modalDateInput} value={dateRange.startDate} onChange={e => setDateRange({...dateRange, startDate: e.target.value})} /></div>
                  <div style={styles.dateField}><label style={styles.dateLabel}><Calendar size={14} /> Sampai</label><input type="date" style={styles.modalDateInput} value={dateRange.endDate} onChange={e => setDateRange({...dateRange, endDate: e.target.value})} /></div>
                </div>
              </div>
              <div style={styles.modalFooter}><button onClick={() => setShowDateRangeModal(false)} style={styles.modalBtnCancel}>Batal</button><button onClick={handleDownloadByDateRange} style={styles.modalBtnDownload} disabled={isDownloadingRange}>{isDownloadingRange ? '⏳' : <><Download size={16} /> Download</>}</button></div>
            </div>
          </div>
        )}

        {/* AKUMULASI TOTAL SISWA HARI INI */}
        {attendanceSummary.length > 0 && (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle(isMobile)}><Users size={18} /> Akumulasi Kehadiran Siswa Hari Ini</h3>
            <div style={styles.akumulasiGrid(isMobile)}>
              <div style={styles.akumulasiCard('#dcfce7','#166534')}><span style={styles.akumulasiIcon}>✅</span><h2 style={{...styles.akumulasiValue,color:'#166534'}}>{attendanceSummary.reduce((s,k)=>s+k.totalHadir,0)}</h2><span style={styles.akumulasiLabel}>Total Hadir</span></div>
              <div style={styles.akumulasiCard('#fee2e2','#ef4444')}><span style={styles.akumulasiIcon}>❌</span><h2 style={{...styles.akumulasiValue,color:'#ef4444'}}>{attendanceSummary.reduce((s,k)=>s+k.totalTidakHadir,0)}</h2><span style={styles.akumulasiLabel}>Total Tidak Hadir</span></div>
              <div style={styles.akumulasiCard('#f1f5f9','#1e293b')}><span style={styles.akumulasiIcon}>👥</span><h2 style={{...styles.akumulasiValue,color:'#1e293b'}}>{attendanceSummary.reduce((s,k)=>s+k.totalStudents,0)}</h2><span style={styles.akumulasiLabel}>Terdaftar</span></div>
              <div style={styles.akumulasiCard('#eef2ff','#3b82f6')}><span style={styles.akumulasiIcon}>📊</span><h2 style={{...styles.akumulasiValue,color:'#3b82f6'}}>{(()=>{const t=attendanceSummary.reduce((s,k)=>s+k.totalStudents,0),h=attendanceSummary.reduce((s,k)=>s+k.totalHadir,0);return t>0?Math.round((h/t)*100):0})()}%</h2><span style={styles.akumulasiLabel}>Persentase</span></div>
            </div>
          </div>
        )}

        {/* DETEKSI GURU BELUM ABSEN */}
        {teacherAttendanceStatus.length > 0 && (
          <div style={styles.sectionCard}>
            <h3 style={styles.sectionTitle(isMobile)}><Clock3 size={18} /> Status Kehadiran Guru Hari Ini</h3>
            <div style={styles.teacherStatusGrid(isMobile)}>
              {teacherAttendanceStatus.map((guru, idx) => (
                <div key={idx} style={{...styles.teacherStatusCard, borderColor: guru.sudahAbsen ? '#bbf7d0' : '#fecaca', background: guru.sudahAbsen ? '#f0fdf4' : '#fef2f2'}}>
                  <div style={styles.teacherStatusHeader}>
                    <div style={styles.teacherAvatar}>{guru.nama?.charAt(0)||'G'}</div>
                    <div style={{flex:1}}><strong style={styles.teacherName}>{guru.nama}</strong><div style={styles.teacherJadwalCount}>{guru.jadwalList.length} sesi</div></div>
                    <span style={{...styles.teacherAbsenBadge, background: guru.sudahAbsen ? '#dcfce7' : '#fee2e2', color: guru.sudahAbsen ? '#166534' : '#ef4444'}}>{guru.sudahAbsen ? <><CheckCircle size={12} /> Sudah Absen</> : <><AlertTriangle size={12} /> Belum Absen</>}</span>
                  </div>
                  <div style={styles.teacherSesiList}>
                    {guru.jadwalList.map((sesi, sIdx) => (
                      <div key={sIdx} style={styles.teacherSesiItem}><span style={styles.sesiTime}>⏰ {sesi.start}-{sesi.end}</span><span style={styles.sesiPlanet}>🪐 {sesi.planet}</span><span style={styles.sesiMapel}>📘 {sesi.mapel}</span></div>
                    ))}
                  </div>
                  {!guru.sudahAbsen && <div style={styles.teacherWarning}>⚠️ Guru ini memiliki jadwal mengajar hari ini tetapi <b>belum melakukan absensi</b>.</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* REKAP ABSENSI PER KELAS */}
        <div style={styles.sectionCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 15, cursor: 'pointer' }} onClick={() => setSelectedClass(null)}>
            <h3 style={styles.sectionTitle(isMobile)}><Users size={18} /> Rekap Kehadiran Per Kelas</h3>
            <span style={styles.liveDot}></span>
          </div>
          <div style={styles.attendanceGrid(isMobile)}>
            {attendanceSummary.length === 0 ? <div style={styles.emptyState}>Belum ada data absensi hari ini.</div> :
              attendanceSummary.map((kelas, idx) => (
                <div key={kelas.jadwalId || idx} style={styles.attendanceCard(isMobile)} onClick={() => setSelectedClass(selectedClass === idx ? null : idx)}>
                  <div style={styles.classHeader}><h4 style={styles.className(isMobile)}>{kelas.title}</h4><span style={styles.roomBadge(isMobile)}>{kelas.room}</span></div>
                  <div style={styles.classInfo(isMobile)}><span>👨‍🏫 {kelas.teacher}</span><span>⏰ {kelas.start} - {kelas.end}</span></div>
                  <div style={styles.attendanceBar}>
                    <div style={{...styles.barHadir, width: `${kelas.totalStudents>0?(kelas.totalHadir/kelas.totalStudents)*100:0}%`}}>{kelas.totalHadir>0&&`✅ ${kelas.totalHadir}`}</div>
                    <div style={{...styles.barTidakHadir, width: `${kelas.totalStudents>0?(kelas.totalTidakHadir/kelas.totalStudents)*100:0}%`}}>{kelas.totalTidakHadir>0&&`❌ ${kelas.totalTidakHadir}`}</div>
                  </div>
                  <div style={styles.attendanceNumbers}><span>Hadir: {kelas.totalHadir}/{kelas.totalStudents}</span><span>Tidak Hadir: {kelas.totalTidakHadir}</span></div>
                  {selectedClass === idx && (
                    <div style={styles.detailDropdown}>
                      <div style={styles.detailSection}><strong>✅ Hadir:</strong><p>{kelas.hadir.length>0?kelas.hadir.join(', '):'Belum ada'}</p></div>
                      <div style={styles.detailSection}><strong>❌ Tidak Hadir:</strong>{kelas.tidakHadir.length>0?kelas.tidakHadir.map((s,i)=>(<div key={i} style={styles.absentItem}><span>{s.nama}</span><span style={styles.absentStatus(s.status)}>{s.status}</span><span style={styles.absentKet}>{s.keterangan}</span></div>)):<p>Semua hadir 🎉</p>}</div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        </div>

        {/* FORM AUDIT */}
        <form onSubmit={handleSubmit}>
          <div style={styles.formGrid(isMobile)}>
            <div style={styles.formColumn}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><Clock size={18} /> Shift & Guru Bertugas</h3>
                <div style={styles.grid2}>
                  <input style={styles.input} placeholder="Nama Admin" onChange={e => setFormData({...formData, adminName: e.target.value})} required />
                  <div style={{ display: 'flex', gap: 8 }}><input style={styles.input} placeholder="Jam Masuk" onChange={e => setFormData({...formData, jamMasuk: e.target.value})} required /><input style={styles.input} placeholder="Jam Pulang" onChange={e => setFormData({...formData, jamPulang: e.target.value})} required /></div>
                </div>
                <div style={{ marginTop: 15 }}><label style={styles.label}>Guru/Tentor Hadir</label><select style={styles.input} onChange={e => setFormData({...formData, tentor: {...formData.tentor, id: e.target.value}})}><option value="">-- Pilih Guru --</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}</select></div>
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><UserCheck size={18} /> Audit Kehadiran Siswa</h3>
                <div style={styles.grid2}><div><label style={styles.label}>Jumlah Hadir</label><input type="number" style={styles.input} onChange={e => setFormData({...formData, siswa: {...formData.siswa, jumlahHadir: e.target.value}})} /></div><div><label style={styles.label}>Nama Tidak Hadir</label><input style={styles.input} placeholder="Sebutkan nama" onChange={e => setFormData({...formData, siswa: {...formData.siswa, namaTidakHadir: e.target.value}})} /></div></div>
                <label style={styles.label}>Alasan</label><textarea style={styles.textareaSmall} placeholder="Alasan..." onChange={e => setFormData({...formData, siswa: {...formData.siswa, alasanAbsen: e.target.value}})} />
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><CreditCard size={18} /> Log Transaksi & Narasi</h3>
                <textarea style={styles.textareaSmall} placeholder="Log Pembayaran" onChange={e => setFormData({...formData, operasional: {...formData.operasional, pembayaranMasuk: e.target.value}})} />
                <div style={{ marginTop: 20 }}><div style={styles.toolbarRow}><label style={styles.label}>Narasi</label><div style={styles.toolbar}><button type="button" onClick={()=>applyFormat('B')} style={styles.toolBtn}><Bold size={14}/></button><button type="button" onClick={()=>applyFormat('I')} style={styles.toolBtn}><Italic size={14}/></button><button type="button" onClick={()=>applyFormat('L')} style={styles.toolBtn}><List size={14}/></button></div></div><textarea id="canvasNarasi" style={styles.canvas} value={formData.canvasNarasi} onChange={e => setFormData({...formData, canvasNarasi: e.target.value})} placeholder="Tulis detail kegiatan..." /></div>
              </div>
            </div>
            <div style={styles.formColumn}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><AlertTriangle size={18} /> Risk Management</h3>
                <select style={styles.input} value={formData.riskLevel} onChange={e => setFormData({...formData, riskLevel: e.target.value})}><option>🟢 Aman</option><option>🟡 Ada Masalah</option><option>🔴 Urgent</option></select>
                <label style={styles.label}>Custom Risk</label><textarea style={styles.textareaSmall} placeholder="Masalah spesifik..." onChange={e => setFormData({...formData, customRisk: e.target.value})} />
                <div style={{ marginTop: 20, borderTop: '1px solid #eee', paddingTop: 15 }}><h4 style={{ fontSize: 12, marginBottom: 10 }}>Closing Checklist</h4>{Object.keys(formData.checklist).map(key => <label key={key} style={styles.checkItem}><input type="checkbox" onChange={e => setFormData({...formData, checklist: {...formData.checklist, [key]: e.target.checked}})} /><span>{key.replace(/([A-Z])/g,' $1').toUpperCase()} OK</span></label>)}</div>
                <button type="submit" style={styles.btnSubmit} disabled={loading}><Save size={16} /> {loading ? 'Processing...' : 'Simpan & Kunci Laporan'}</button>
              </div>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}><Table size={18} /> Audit Trail</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>{history.map(log => <div key={log.id} style={styles.historyRow}><div style={{ flex: 1, minWidth: 0 }}><div style={{ fontWeight: 'bold', fontSize: 13 }}>{log.tanggal}</div><div style={{ fontSize: 11, color: '#64748b' }}>{log.adminName} ({log.jamMasuk}-{log.jamPulang})</div></div><button onClick={()=>handleExportPDF(log)} style={styles.btnPdf}><FileText size={14} /> PDF</button><button onClick={()=>handleExportExcel(log)} style={styles.btnExcel}><FileSpreadsheet size={14} /> Excel</button></div>)}</div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================
// STYLES
// ============================================================
const styles = {
  wrapper: { display: 'flex', background: '#f8fafc', minHeight: '100vh' },
  mainContent: (m) => ({ marginLeft: m ? '0' : '260px', padding: m ? '15px' : '30px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', transition: '0.3s' }),
  header: (m) => ({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: m ? 15 : 25, flexWrap: 'wrap', gap: 10 }),
  pageTitle: (m) => ({ margin: 0, color: '#1e293b', fontSize: m ? 18 : 22, display: 'flex', alignItems: 'center', gap: 8 }),
  headerButtons: (m) => ({ display: 'flex', alignItems: 'center', gap: m ? 8 : 10, flexWrap: 'wrap' }),
  btnRefresh: (m) => ({ background: 'white', border: '1px solid #e2e8f0', padding: m ? '6px 10px' : '8px 15px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: m ? 11 : 12, fontWeight: 600 }),
  btnDownloadRange: (m) => ({ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', border: 'none', padding: m ? '6px 10px' : '8px 15px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: m ? 11 : 12, fontWeight: 600, boxShadow: '0 2px 4px rgba(15,23,42,0.2)', transition: '0.2s', whiteSpace: 'nowrap' }),
  dateInput: (m) => ({ padding: m ? '6px 10px' : '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: m ? 12 : 13 }),
  calendarHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, flexWrap: 'wrap', gap: 10 },
  calendarNav: { display: 'flex', alignItems: 'center', gap: 8 },
  calendarTodayBtn: { padding: '6px 12px', fontSize: 11, borderRadius: 8, border: '1px solid #0f172a', background: 'white', color: '#0f172a', cursor: 'pointer', fontWeight: 600 },
  calendarNavBtn: { padding: '6px 8px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  calendarMonthLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', minWidth: 150, textAlign: 'center' },
  calendarLegend: { display: 'flex', alignItems: 'center', gap: 15, marginBottom: 15, flexWrap: 'wrap', padding: '10px 15px', background: '#f8fafc', borderRadius: 10 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: '50%' },
  legendText: { fontSize: 11, color: '#475569' },
  btnIzin: { marginLeft: 'auto', padding: '8px 14px', fontSize: 11, borderRadius: 8, border: 'none', background: '#f59e0b', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, boxShadow: '0 2px 4px rgba(245,158,11,0.3)' },
  calendarDayNames: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 4 },
  dayName: { textAlign: 'center', fontSize: 11, fontWeight: 'bold', color: '#64748b', padding: '8px 0' },
  calendarGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  calendarWeek: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 },
  calendarDay: { aspectRatio: '1', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s', position: 'relative', background: 'white', border: '1px solid #f1f5f9', padding: '6px 4px', minHeight: '50px', overflow: 'hidden' },
  calendarDayEmpty: { aspectRatio: '1', borderRadius: 10, background: 'transparent' },
  calendarDayActive: { background: '#dcfce7', border: '1px solid #bbf7d0' },
  calendarDayIzin: { background: '#fff3cd', border: '1px solid #ffe69c' },
  calendarDayHoliday: { background: '#fee2e2', border: '1px solid #fecaca' },
  calendarDayToday: { border: '2px solid #0f172a', boxShadow: '0 0 0 2px rgba(15,23,42,0.1)' },
  dayNumber: (isToday, isRed) => ({ fontSize: 13, fontWeight: isToday ? 'bold' : '500', color: isRed ? '#ef4444' : isToday ? '#0f172a' : '#334155' }),
  dayDot: { width: 6, height: 6, borderRadius: '50%', marginTop: 3 },
  dayDotActive: { background: '#27ae60' },
  dayDotIzin: { background: '#f59e0b' },
  holidayLabel: { fontSize: 7, color: '#ef4444', textAlign: 'center', lineHeight: 1.1, marginTop: 1, fontWeight: 'bold', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sundayLabel: { fontSize: 7, color: '#ef4444', textAlign: 'center', marginTop: 2, opacity: 0.7 },
  upcomingHolidays: { marginTop: 20, paddingTop: 15, borderTop: '1px solid #f1f5f9' },
  upcomingTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 'bold', color: '#0f172a', margin: '0 0 10px 0' },
  holidayList: { display: 'flex', flexDirection: 'column', gap: 6 },
  holidayItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fee2e2' },
  holidayDate: { fontSize: 12, fontWeight: 'bold', color: '#ef4444', minWidth: 50 },
  holidayName: { fontSize: 11, color: '#991b1b' },
  izinField: { marginBottom: 16 },
  izinInput: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc' },
  izinTextarea: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#f8fafc', resize: 'vertical' },
  detailCard: { background: '#f8fafc', padding: 16, borderRadius: 12 },
  detailBadgeActive: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontWeight: 'bold', fontSize: 12, marginBottom: 12 },
  detailBadgeIzin: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#fff3cd', color: '#b45309', fontWeight: 'bold', fontSize: 12, marginBottom: 12 },
  detailBadgeHoliday: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: '#fee2e2', color: '#991b1b', fontWeight: 'bold', fontSize: 12, marginBottom: 12 },
  detailRow: { display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start' },
  detailLabel: { fontSize: 11, fontWeight: 'bold', color: '#64748b', minWidth: 60 },
  detailValue: { fontSize: 12, color: '#0f172a' },
  detailNarasi: { fontSize: 12, color: '#334155', margin: 0, marginTop: 4, lineHeight: 1.5 },
  sectionTitle: (m) => ({ margin: 0, fontSize: m ? 14 : 16, color: '#0f172a', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 8 }),
  sectionCard: { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: 25, width: '100%', boxSizing: 'border-box' },
  liveDot: { width: 10, height: 10, borderRadius: '50%', background: '#27ae60', animation: 'pulse 2s infinite', display: 'inline-block' },
  
  // AKUMULASI
  akumulasiGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }),
  akumulasiCard: (bg, color) => ({ background: bg, padding: 16, borderRadius: 14, textAlign: 'center', border: `1px solid ${color}30` }),
  akumulasiIcon: { fontSize: 24, display: 'block', marginBottom: 4 },
  akumulasiValue: { margin: '4px 0', fontSize: 28, fontWeight: 'bold' },
  akumulasiLabel: { fontSize: 11, color: '#64748b', fontWeight: '600' },
  
  // TEACHER STATUS
  teacherStatusGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }),
  teacherStatusCard: { padding: 16, borderRadius: 14, border: '2px solid', transition: '0.3s' },
  teacherStatusHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  teacherAvatar: { width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16, flexShrink: 0 },
  teacherName: { fontSize: 14, color: '#1e293b' },
  teacherJadwalCount: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  teacherAbsenBadge: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap' },
  teacherSesiList: { display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 },
  teacherSesiItem: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, fontSize: 11, flexWrap: 'wrap' },
  sesiTime: { fontWeight: 'bold', color: '#1e293b', background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 },
  sesiPlanet: { color: '#64748b' },
  sesiMapel: { color: '#3b82f6', fontWeight: '500' },
  teacherWarning: { marginTop: 8, padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 11, color: '#991b1b' },

  // ATTENDANCE
  attendanceGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }),
  attendanceBar: { display: 'flex', height: 22, borderRadius: 11, overflow: 'hidden', marginTop: 8, background: '#f1f5f9' },
  barHadir: { background: '#27ae60', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s', minWidth: 'fit-content', padding: '0 4px' },
  barTidakHadir: { background: '#e74c3c', color: 'white', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', transition: 'width 0.5s', minWidth: 'fit-content', padding: '0 4px' },
  attendanceNumbers: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginTop: 4 },
  attendanceCard: (m) => ({ background: '#f8fafc', padding: m ? 12 : 15, borderRadius: 12, cursor: 'pointer', transition: '0.2s', border: '1px solid #f1f5f9' }),
  classHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  className: (m) => ({ margin: 0, fontSize: m ? 13 : 14, color: '#1e293b' }),
  roomBadge: (m) => ({ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 10, fontSize: m ? 9 : 10, fontWeight: 'bold' }),
  classInfo: (m) => ({ fontSize: m ? 10 : 11, color: '#64748b', display: 'flex', gap: m ? 8 : 12, flexWrap: 'wrap' }),
  detailDropdown: { marginTop: 10, borderTop: '1px solid #f1f5f9', paddingTop: 10 },
  detailSection: { marginBottom: 8 },
  absentItem: { display: 'flex', gap: 8, alignItems: 'center', padding: '3px 0', fontSize: 11, flexWrap: 'wrap' },
  absentStatus: (s) => ({ padding: '1px 6px', borderRadius: 6, fontSize: 9, fontWeight: 'bold', background: s === 'Alpha' || s === 'alpha' ? '#fee2e2' : s === 'Sakit' || s === 'sakit' ? '#fff3cd' : '#e0e7ff', color: s === 'Alpha' || s === 'alpha' ? '#ef4444' : s === 'Sakit' || s === 'sakit' ? '#f59e0b' : '#3730a3' }),
  absentKet: { fontSize: 9, color: '#94a3b8' },
  emptyState: { gridColumn: '1/-1', textAlign: 'center', padding: 30, color: '#94a3b8', fontSize: 13 },
  
  // FORM
  formGrid: (m) => ({ display: 'grid', gridTemplateColumns: m ? '1fr' : '2fr 1.2fr', gap: m ? '15px' : '25px' }),
  formColumn: { display: 'flex', flexDirection: 'column', gap: 20 },
  card: { background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', width: '100%', boxSizing: 'border-box' },
  cardTitle: { fontSize: 14, margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: 10, color: '#0f172a', fontWeight: 'bold' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  label: { display: 'block', fontSize: 11, fontWeight: 'bold', color: '#64748b', marginBottom: 5, marginTop: 10 },
  input: { width: '100%', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box' },
  textareaSmall: { width: '100%', height: 70, padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', marginTop: 5, resize: 'vertical' },
  canvas: { width: '100%', height: 180, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box', background: '#fcfcfc', lineHeight: '1.5', resize: 'vertical' },
  toolbarRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, flexWrap: 'wrap', gap: 5 },
  toolbar: { display: 'flex', gap: 4, background: '#f1f5f9', padding: 4, borderRadius: 8 },
  toolBtn: { padding: '4px 8px', background: 'white', border: '1px solid #cbd5e1', borderRadius: 4, cursor: 'pointer' },
  checkItem: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, cursor: 'pointer', fontSize: 12 },
  btnSubmit: { width: '100%', padding: 14, background: '#0f172a', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', marginTop: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
  historyRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9' },
  btnPdf: { background: '#fee2e2', color: '#ef4444', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginRight: 5 },
  btnExcel: { background: '#e0f2fe', color: '#0284c7', border: 'none', padding: 6, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 },
  
  // MODAL
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px', backdropFilter: 'blur(4px)' },
  modalContent: (m) => ({ background: 'white', borderRadius: 20, width: m ? '95%' : '500px', maxWidth: '550px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' },
  modalTitle: { margin: 0, fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 'bold' },
  modalClose: { background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 'bold', transition: '0.2s' },
  modalBody: { padding: '24px' },
  dateRangeInputs: { display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 },
  dateField: { display: 'flex', flexDirection: 'column', gap: 6 },
  dateLabel: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 'bold', color: '#475569' },
  modalDateInput: { width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box', background: '#f8fafc' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' },
  modalBtnCancel: { padding: '10px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' },
  modalBtnDownload: { padding: '10px 20px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.3)', transition: '0.2s', whiteSpace: 'nowrap' }
};

export default AdminDailyLog;