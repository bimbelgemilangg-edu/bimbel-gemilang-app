import React, { useState } from 'react';
// PERBAIKAN JALUR IMPORT:
import Sidebar from '../../components/Sidebar'; 

const SchedulePage = () => {
  const [date, setDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState("");

  const ROOMS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  const [schedules, setSchedules] = useState([
    { id: 1, date: '2026-01-30', room: 'MERKURIUS', time: '14:00', type: 'Pararel', code: 'A-992' },
  ]);

  const [formData, setFormData] = useState({
    time: "14:00",
    type: "Booking",
    code: ""
  });

  const daysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() - 1, 1));
  const handleNextMonth = () => setDate(new Date(date.getFullYear(), date.getMonth() + 1, 1));

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomChar = chars.charAt(Math.floor(Math.random() * chars.length));
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${randomChar}-${randomNum}`;
  };

  const openAddModal = (room) => {
    setSelectedRoom(room);
    setFormData({ ...formData, code: generateCode() });
    setModalOpen(true);
  };

  const handleSave = () => {
    const newSchedule = {
      id: Date.now(),
      date: selectedDate.toISOString().split('T')[0],
      room: selectedRoom,
      time: formData.time,
      type: formData.type,
      code: formData.code
    };
    setSchedules([...schedules, newSchedule]);
    setModalOpen(false);
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(date.getMonth(), date.getFullYear());
    const startDay = firstDayOfMonth(date.getMonth(), date.getFullYear());
    const daysArray = [];

    for (let i = 0; i < startDay; i++) {
      daysArray.push(<div key={`empty-${i}`} style={styles.calendarDayEmpty}></div>);
    }

    for (let d = 1; d <= totalDays; d++) {
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === date.getMonth();
      daysArray.push(
        <div 
          key={d} 
          style={isSelected ? styles.calendarDaySelected : styles.calendarDay}
          onClick={() => setSelectedDate(new Date(date.getFullYear(), date.getMonth(), d))}
        >
          <span style={styles.dateNumber}>{d}</span>
        </div>
      );
    }
    return daysArray;
  };

  const selectedDateString = selectedDate.toISOString().split('T')[0];
  const activeSchedules = schedules.filter(s => s.date === selectedDateString);

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.content}>
        <div style={styles.header}>
          <h2>📅 Jadwal & Booking Kelas</h2>
          <div style={styles.monthNav}>
            <button style={styles.navBtn} onClick={handlePrevMonth}>◀</button>
            <h3 style={{margin: '0 20px'}}>{date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</h3>
            <button style={styles.navBtn} onClick={handleNextMonth}>▶</button>
          </div>
        </div>

        <div style={styles.layoutGrid}>
          <div style={styles.leftPanel}>
            <div style={styles.calendarGrid}>
              {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(d => <div key={d} style={styles.dayName}>{d}</div>)}
              {renderCalendar()}
            </div>
          </div>

          <div style={styles.rightPanel}>
            <h3 style={styles.sectionTitle}>Jadwal: {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
            <div style={styles.roomList}>
              {ROOMS.map((room) => (
                <div key={room} style={styles.roomCard}>
                  <div style={styles.roomHeader}>
                    <span>{room}</span>
                    <button style={styles.btnAdd} onClick={() => openAddModal(room)}>+ Jadwal</button>
                  </div>
                  <div style={styles.scheduleContainer}>
                    {activeSchedules.filter(s => s.room === room).length === 0 ? <p style={styles.emptyText}>Kosong</p> : 
                      activeSchedules.filter(s => s.room === room).map(s => (
                        <div key={s.id} style={s.type === 'Pararel' ? styles.itemPararel : styles.itemBooking}>
                          <b>{s.time}</b> - {s.type} (Code: {s.code})
                        </div>
                      ))
                    }
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {modalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalBox}>
              <h3>Add: {selectedRoom}</h3>
              <div style={styles.formGroup}>
                <label>Jam</label>
                <input type="time" style={styles.input} value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
              <div style={styles.formGroup}>
                <label>Tipe</label>
                <select style={styles.input} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option value="Booking">Booking</option>
                  <option value="Pararel">Pararel</option>
                </select>
              </div>
              <div style={styles.modalActions}>
                <button style={styles.btnCancel} onClick={() => setModalOpen(false)}>Batal</button>
                <button style={styles.btnSave} onClick={handleSave}>Simpan</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  content: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', background: '#f4f6f8', minHeight: '100vh', fontFamily: 'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  monthNav: { display: 'flex', alignItems: 'center', background: 'white', padding: '10px', borderRadius: '8px' },
  navBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' },
  layoutGrid: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' },
  leftPanel: { background: 'white', padding: '15px', borderRadius: '10px' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' },
  dayName: { textAlign: 'center', fontWeight: 'bold', color: '#7f8c8d' },
  calendarDay: { aspectRatio: '1/1', border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  calendarDaySelected: { aspectRatio: '1/1', border: '2px solid #3498db', background: '#ebf5fb', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  calendarDayEmpty: { aspectRatio: '1/1' },
  dateNumber: { fontWeight: 'bold' },
  rightPanel: { display: 'flex', flexDirection: 'column', gap: '10px' },
  roomCard: { background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  roomHeader: { background: '#2c3e50', color: 'white', padding: '8px 12px', display: 'flex', justifyContent: 'space-between' },
  btnAdd: { background: '#27ae60', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' },
  scheduleContainer: { padding: '10px' },
  emptyText: { color: '#ccc', fontSize: '12px' },
  itemPararel: { background: '#d6eaf8', padding: '5px', marginBottom: '5px', borderRadius: '4px', fontSize: '13px' },
  itemBooking: { background: '#fadbd8', padding: '5px', marginBottom: '5px', borderRadius: '4px', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalBox: { background: 'white', padding: '20px', borderRadius: '8px', width: '300px' },
  formGroup: { marginBottom: '10px' },
  input: { width: '100%', padding: '8px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', gap: '10px', marginTop: '15px' },
  btnCancel: { flex: 1, padding: '8px' },
  btnSave: { flex: 1, padding: '8px', background: '#2c3e50', color: 'white' }
};

export default SchedulePage;