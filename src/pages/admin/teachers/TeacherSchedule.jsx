import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase'; // ✅ PATH DIPERBAIKI (3 titik)
import { collection, getDocs, query, where, orderBy, doc, updateDoc, addDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { Calendar, Clock, User, BookOpen, MapPin, Trash2, Edit3, Save, X, Plus, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

const TeacherSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    teacherName: '',
    teacherId: '',
    subject: '',
    class: '',
    room: '',
    startTime: '08:00',
    endTime: '10:00',
    dayOfWeek: ''
  });
  const [teachers, setTeachers] = useState([]);

  const currentMonth = selectedDate.getMonth();
  const currentYear = selectedDate.getFullYear();

  // Daftar hari dalam seminggu
  const weekDays = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

  useEffect(() => {
    fetchTeachers();
    fetchSchedules();
  }, []);

  const fetchTeachers = async () => {
    try {
      const snap = await getDocs(collection(db, "teachers"));
      setTeachers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "jadwal_bimbel"), orderBy("date", "desc"));
      const snap = await getDocs(q);
      setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.teacherName || !formData.subject || !formData.class) {
      alert("Mohon lengkapi data!");
      return;
    }

    try {
      const scheduleData = {
        ...formData,
        date: new Date(selectedDate).toISOString(),
        dateStr: selectedDate.toISOString().split('T')[0],
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, "jadwal_bimbel", editingId), scheduleData);
        alert("✅ Jadwal berhasil diperbarui!");
      } else {
        await addDoc(collection(db, "jadwal_bimbel"), {
          ...scheduleData,
          createdAt: serverTimestamp()
        });
        alert("✅ Jadwal berhasil ditambahkan!");
      }

      resetForm();
      fetchSchedules();
    } catch (error) {
      console.error("Error saving schedule:", error);
      alert("❌ Gagal menyimpan jadwal: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Hapus jadwal ini?")) {
      try {
        await deleteDoc(doc(db, "jadwal_bimbel", id));
        alert("✅ Jadwal dihapus!");
        fetchSchedules();
      } catch (error) {
        alert("❌ Gagal menghapus: " + error.message);
      }
    }
  };

  const handleEdit = (schedule) => {
    setFormData({
      teacherName: schedule.teacherName || '',
      teacherId: schedule.teacherId || '',
      subject: schedule.subject || '',
      class: schedule.class || '',
      room: schedule.room || '',
      startTime: schedule.startTime || '08:00',
      endTime: schedule.endTime || '10:00',
      dayOfWeek: schedule.dayOfWeek || ''
    });
    setEditingId(schedule.id);
    setShowForm(true);
    if (schedule.dateStr) {
      setSelectedDate(new Date(schedule.dateStr));
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      teacherName: '',
      teacherId: '',
      subject: '',
      class: '',
      room: '',
      startTime: '08:00',
      endTime: '10:00',
      dayOfWeek: ''
    });
  };

  const getSchedulesForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(s => s.dateStr === dateStr);
  };

  const formatTime = (time) => {
    if (!time) return '-';
    return time.substring(0, 5);
  };

  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().split('T')[0];
      const daySchedules = schedules.filter(s => s.dateStr === dateStr);
      const hasSchedule = daySchedules.length > 0;

      days.push(
        <div
          key={day}
          style={{
            ...styles.calendarDay,
            background: hasSchedule ? '#eef2ff' : 'white',
            border: hasSchedule ? '1px solid #3b82f6' : '1px solid #e2e8f0',
            cursor: 'pointer'
          }}
          onClick={() => {
            setSelectedDate(date);
            if (hasSchedule) {
              // Scroll to schedule list
              document.getElementById('schedule-list')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          <span style={{ ...styles.calendarDayNumber, fontWeight: hasSchedule ? 'bold' : 'normal', color: hasSchedule ? '#3b82f6' : '#1e293b' }}>
            {day}
          </span>
          {hasSchedule && (
            <div style={styles.calendarDayIndicator}>
              {daySchedules.length} jadwal
            </div>
          )}
        </div>
      );
    }

    return days;
  };

  const selectedDateSchedules = getSchedulesForDate(selectedDate);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>📅 Manajemen Jadwal Guru</h2>
          <p style={styles.subtitle}>Atur jadwal mengajar dan absensi guru</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={styles.btnAdd}>
          <Plus size={18} /> {showForm ? 'Tutup Form' : 'Tambah Jadwal'}
        </button>
      </div>

      {/* Form Tambah/Edit Jadwal */}
      {showForm && (
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <h3 style={styles.formTitle}>
              {editingId ? '✏️ Edit Jadwal' : '📝 Tambah Jadwal Baru'}
            </h3>
            <button onClick={resetForm} style={styles.btnClose}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>👨‍🏫 Nama Guru</label>
                <select
                  value={formData.teacherName}
                  onChange={(e) => {
                    const selectedTeacher = teachers.find(t => t.nama === e.target.value);
                    setFormData({
                      ...formData,
                      teacherName: e.target.value,
                      teacherId: selectedTeacher?.id || ''
                    });
                  }}
                  style={styles.select}
                  required
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.nama}>{t.nama} - {t.mapel || 'Umum'}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📚 Mata Pelajaran</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Contoh: Matematika"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🎓 Kelas/Program</label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  placeholder="Contoh: 6 SD / Reguler"
                  style={styles.input}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>🏠 Ruangan</label>
                <input
                  type="text"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="Contoh: Ruang 1 / Planet A"
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>⏰ Mulai</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>⏰ Selesai</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📅 Hari (Opsional)</label>
                <select
                  value={formData.dayOfWeek}
                  onChange={(e) => setFormData({ ...formData, dayOfWeek: e.target.value })}
                  style={styles.select}
                >
                  <option value="">Pilih Hari (Opsional)</option>
                  {weekDays.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>📆 Tanggal</label>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  style={styles.input}
                />
              </div>
            </div>

            <button type="submit" style={styles.btnSubmit}>
              <Save size={16} /> {editingId ? 'Perbarui Jadwal' : 'Simpan Jadwal'}
            </button>
          </form>
        </div>
      )}

      {/* Calendar Grid */}
      <div style={styles.calendarCard}>
        <div style={styles.calendarHeader}>
          <button
            onClick={() => setSelectedDate(new Date(currentYear, currentMonth - 1, 1))}
            style={styles.calendarNavBtn}
          >
            <ChevronLeft size={20} />
          </button>
          <h3 style={styles.calendarMonth}>
            {new Date(currentYear, currentMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setSelectedDate(new Date(currentYear, currentMonth + 1, 1))}
            style={styles.calendarNavBtn}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div style={styles.calendarWeekdays}>
          {weekDays.map(day => (
            <div key={day} style={styles.weekdayCell}>{day}</div>
          ))}
        </div>

        <div style={styles.calendarDays}>
          {renderCalendar()}
        </div>
      </div>

      {/* Daftar Jadwal untuk Tanggal Terpilih */}
      <div id="schedule-list" style={styles.scheduleListCard}>
        <h3 style={styles.sectionTitle}>
          <Clock size={18} color="#3b82f6" />
          Jadwal {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
        </h3>

        {loading ? (
          <div style={styles.loadingBox}>Memuat jadwal...</div>
        ) : selectedDateSchedules.length === 0 ? (
          <div style={styles.emptyBox}>
            <Calendar size={32} color="#cbd5e1" />
            <p>Tidak ada jadwal untuk tanggal ini</p>
            <button onClick={() => setShowForm(true)} style={styles.btnAddSmall}>
              + Tambah Jadwal
            </button>
          </div>
        ) : (
          <div style={styles.scheduleList}>
            {selectedDateSchedules.map((schedule) => (
              <div key={schedule.id} style={styles.scheduleItem}>
                <div style={styles.scheduleTime}>
                  <span style={styles.scheduleTimeStart}>{formatTime(schedule.startTime)}</span>
                  <span style={styles.scheduleTimeSeparator}>—</span>
                  <span style={styles.scheduleTimeEnd}>{formatTime(schedule.endTime)}</span>
                </div>
                <div style={styles.scheduleInfo}>
                  <div style={styles.scheduleTitle}>{schedule.subject}</div>
                  <div style={styles.scheduleDetails}>
                    <span><User size={12} /> {schedule.teacherName}</span>
                    <span><BookOpen size={12} /> {schedule.class}</span>
                    <span><MapPin size={12} /> {schedule.room || 'Ruangan'}</span>
                  </div>
                </div>
                <div style={styles.scheduleActions}>
                  <button onClick={() => handleEdit(schedule)} style={styles.btnEdit}>
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(schedule.id)} style={styles.btnDelete}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: 1200,
    margin: '0 auto',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b',
    margin: '4px 0 0 0'
  },
  btnAdd: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  btnAddSmall: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '12px'
  },
  formCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  },
  formHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  formTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0
  },
  btnClose: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    outline: 'none'
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '13px',
    background: 'white',
    outline: 'none'
  },
  btnSubmit: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    padding: '12px',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  },
  calendarCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0'
  },
  calendarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  calendarNavBtn: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  calendarMonth: {
    fontSize: '16px',
    fontWeight: '700',
    margin: 0
  },
  calendarWeekdays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px',
    marginBottom: '12px'
  },
  weekdayCell: {
    textAlign: 'center',
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748b',
    padding: '8px'
  },
  calendarDays: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    gap: '8px'
  },
  calendarDay: {
    aspectRatio: '1',
    padding: '8px',
    borderRadius: '10px',
    position: 'relative',
    transition: '0.2s'
  },
  calendarDayEmpty: {
    aspectRatio: '1',
    padding: '8px',
    opacity: 0.3
  },
  calendarDayNumber: {
    fontSize: '13px',
    fontWeight: '500'
  },
  calendarDayIndicator: {
    fontSize: '9px',
    color: '#3b82f6',
    marginTop: '4px',
    textAlign: 'center'
  },
  scheduleListCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid #e2e8f0'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  loadingBox: {
    textAlign: 'center',
    padding: '40px',
    color: '#64748b'
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8'
  },
  scheduleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  scheduleTime: {
    minWidth: '80px',
    textAlign: 'center',
    background: '#eef2ff',
    padding: '8px 12px',
    borderRadius: '8px'
  },
  scheduleTimeStart: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#3b82f6'
  },
  scheduleTimeSeparator: {
    fontSize: '10px',
    color: '#64748b',
    margin: '0 4px'
  },
  scheduleTimeEnd: {
    fontSize: '12px',
    color: '#64748b'
  },
  scheduleInfo: {
    flex: 1
  },
  scheduleTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1e293b'
  },
  scheduleDetails: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: '#64748b',
    marginTop: '4px',
    flexWrap: 'wrap'
  },
  scheduleActions: {
    display: 'flex',
    gap: '8px'
  },
  btnEdit: {
    background: '#f1f5f9',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  btnDelete: {
    background: '#fee2e2',
    border: 'none',
    padding: '6px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#ef4444'
  }
};

export default TeacherSchedule;