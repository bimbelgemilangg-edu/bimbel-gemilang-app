import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';

const SchedulePage = () => {
  // --- STATE ---
  const [date, setDate] = useState(new Date()); // Tanggal Kalender yang dilihat
  const [selectedDate, setSelectedDate] = useState(new Date()); // Tanggal yang diklik user
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");

  // NAMA KELAS (PLANET)
  const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // DATA JADWAL (DUMMY)
  const [schedules, setSchedules] = useState([
    { id: 1, date: '2026-01-30', room: 'MERKURIUS', time: '14:00', type: 'Pararel', code: 'A-992' },
    { id: 2, date: '2026-01-30', room: 'BUMI', time: '16:00', type: 'Booking', code: 'B-112' },
  ]);

  // STATE FORM INPUT
  const [formData, setFormData] = useState({
    time: "14:00",
    type: "Booking", // Booking / Pararel
    code: ""
  });

  // --- LOGIKA KALENDER ---
  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const handleNextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));

  // --- LOGIKA ADD JADWAL ---
  const openAddModal = (room) => {
    setSelectedRoom(room);
    setFormData({ ...formData, code: generateCode() }); // Auto generate code saat buka
    setModalOpen(true);
  };

  const generateCode = () => {
    // Membuat kode acak 4 digit (Misal: X-2391) untuk Absensi
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${randomChar}-${randomNum}`;
  };

  const handleSave = () => {
    const newSchedule = {
      id: Date.now(),
      date: selectedDate.toISOString().split('T')[0], // Format YYYY-MM-DD
      room: selectedRoom,
      time: formData.time,
      type: formData.type,
      code: formData.code
    };
    setSchedules([...schedules, newSchedule]);
    setModalOpen(false);
    alert(`Jadwal di ${selectedRoom} berhasil dibuat! Kode Absen: ${newSchedule.code}`);
  };

  // --- RENDER KALENDER ---
  const renderCalendar = () => {
    const totalDays = daysInMonth(date.getMonth(), date.getFullYear());
    const startDay = firstDayOfMonth(date.getMonth(), date.getFullYear());
    const daysArray = [];

    // Kotak kosong sebelum tanggal 1
    for (let i = 0; i < startDay; i++) {
      daysArray.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
    }

    // Kotak Tanggal
    for (let d = 1; d <= totalDays; d++) {
      const currentDateString = new Date(date.getFullYear(), date.getMonth(), d).toISOString().split('T')[0];
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === date.getMonth();
      
      // Cek ada berapa jadwal di tanggal ini
      const count = schedules.filter(s => s.date === currentDateString).length;

      daysArray.push(
        <div 
          key={d} 
          style={isSelected ? styles.calendarDaySelected : styles.calendarDay}
          onClick={() => setSelectedDate(new Date(date.getFullYear(), date.getMonth(), d))}
        >
          <span style={styles.dateNumber}>{d}</span>
          {count > 0 && <span style={styles.dotEvent}>{count} Kls</span>}
        </div>
      );
    }
    return daysArray;
  };

  // Filter jadwal berdasarkan tanggal yang dipilih
  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const activeSchedules = schedules.filter(s => s.date === selectedDateString);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h2>📅 Jadwal & Booking Kelas</h2>
          <div style={styles.monthNav}>
            <button style={styles.navBtn} onClick={handlePrevMonth}>◀</button>
            <h3 style={{margin: '0 20px'}}>{date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
            <button style={styles.navBtn} onClick={handleNextMonth}>▶</button>
          </div>
        </div>

        <div style={styles.layoutGrid}>
          {/* KOLOM KIRI: KALENDER */}
          <div style={styles.leftPanel}>
            <div style={styles.calendarGrid}>
              <div style={styles.dayName}>Ming</div>
              <div style={styles.dayName}>Sen</div>
              <div style={styles.dayName}>Sel</div>
              <div style={styles.dayName}>Rab</div>
              <div style={styles.dayName}>Kam</div>
              <div style={styles.dayName}>Jum</div>
              <div style={styles.dayName}>Sab</div>
              {renderCalendar()}
            </div>
            <div style={{marginTop: '20px', fontSize: '14px', color: '#7f8c8d'}}>
              *Klik tanggal untuk melihat atau menambah jadwal per ruangan.
            </div>
          </div>

          {/* KOLOM KANAN: DETAIL RUANGAN (5 PLANET) */}
          <div style={styles.rightPanel}>
            <h3 style={styles.sectionTitle}>
              Jadwal: {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            
            <div style={styles.roomList}>
              {ROOMS.map((room) => (
                <div key={room} style={styles.roomCard}>
                  <div style={styles.roomHeader}>
                    <span style={styles.roomName}>{room}</span>
                    <button style={styles.btnAdd} onClick={() => openAddModal(room)}>+ Isi Jadwal</button>
                  </div>
                  
                  {/* List Jadwal di Ruangan Ini */}
                  <div style={styles.scheduleContainer}>
                    {activeSchedules.filter(s => s.room === room).length === 0 ? (
                      <p style={styles.emptyText}>Kosong</p>
                    ) : (
                      activeSchedules.filter(s => s.room === room).map(s => (
                        <div key={s.id} style={s.type === 'Pararel' ? styles.itemPararel : styles.itemBooking}>
                          <div style={{display:'flex', justifyContent:'space-between'}}>
                            <strong>⏰ {s.time}</strong>
                            <span style={styles.codeBadge}>Kode: {s.code}</span>
                          </div>
                          <div style={{fontSize: '12px', marginTop: '5px'}}>
                             Tipe: {s.type}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL TAMBAH JADWAL */}
        {modalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3>Booking Kelas: {selectedRoom}</h3>
              <p style={{marginBottom: '20px'}}>Tanggal: {selectedDateString}</p>
              
              <div style={styles.formGroup}>
                <label>Jam Mulai</label>
                <input 
                  type="time" 
                  style={styles.input} 
                  value={formData.time}
                  onChange={e => setFormData({...formData, time: e.target.value})}
                />
              </div>

              <div style={styles.formGroup}>
                <label>Tipe Jadwal</label>
                <select 
                  style={styles.input} 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="Booking">Booking (Sekali)</option>
                  <option value="Pararel">Pararel (Permanen)</option>
                </select>
                <small style={{color: '#7f8c8d'}}>*Pararel akan terus muncul tiap minggu (Logika Backend).</small>
              </div>

              <div style={styles.formGroup}>
                <label>Kode Absensi (Auto)</label>
                <div style={{display: 'flex', gap: '10px'}}>
                  <input type="text" readOnly value={formData.code} style={{...styles.input, background: '#eee'}} />
                  <button onClick={() => setFormData({...formData, code: generateCode()})} style={styles.btnSmall}>Regenerate</button>
                </div>
              </div>

              <div style={styles.modalActions}>
                <button style={styles.btnCancel} onClick={() => setModalOpen(false)}>Batal</button>
                <button style={styles.btnSave} onClick={handleSave}>Simpan Jadwal</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// --- CSS STYLING ---
const styles = {
  content: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  monthNav: { display: 'flex', alignItems: 'center', background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' },
  navBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#2c3e50' },

  layoutGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' },
  
  // Kalender Kiri
  leftPanel: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', height: 'fit-content' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' },
  dayName: { textAlign: 'center', fontWeight: 'bold', color: '#7f8c8d', padding: '10px 0' },
  calendarDay: { aspectRatio: '1/1', border: '1px solid #eee', borderRadius: '5px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  calendarDaySelected: { aspectRatio: '1/1', border: '2px solid #3498db', background: '#ebf5fb', borderRadius: '5px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  calendarDayEmpty: { aspectRatio: '1/1' },
  dateNumber: { fontSize: '16px', fontWeight: 'bold' },
  dotEvent: { fontSize: '10px', background: '#e74c3c', color: 'white', padding: '2px 6px', borderRadius: '10px', marginTop: '5px' },

  // Panel Kanan (Ruangan)
  rightPanel: { display: 'flex', flexDirection: 'column', gap: '15px' },
  sectionTitle: { margin: '0 0 15px 0', color: '#2c3e50' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  roomCard: { background: 'white', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', overflow: 'hidden' },
  roomHeader: { background: '#2c3e50', color: 'white', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  roomName: { fontWeight: 'bold', fontSize: '16px' },
  btnAdd: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },
  
  scheduleContainer: { padding: '15px', minHeight: '50px' },
  emptyText: { color: '#bdc3c7', fontStyle: 'italic', textAlign: 'center' },
  
  itemPararel: { background: '#d6eaf8', borderLeft: '4px solid #3498db', padding: '10px', marginBottom: '10px', borderRadius: '4px' },
  itemBooking: { background: '#fadbd8', borderLeft: '4px solid #e74c3c', padding: '10px', marginBottom: '10px', borderRadius: '4px' },
  codeBadge: { background: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', border: '1px solid #ccc' },

  // Modal
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { background: 'white', padding: '30px', borderRadius: '10px', width: '400px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' },
  btnSmall: { padding: '5px 10px', cursor: 'pointer' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '20px' },
  btnCancel: { flex: 1, padding: '10px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnSave: { flex: 2, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
};

export default SchedulePage;