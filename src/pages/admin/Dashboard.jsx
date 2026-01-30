import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const Dashboard = () => {
  // 1. WAKTU
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // 2. LOGIKA JADWAL
  const rooms = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [showBooking, setShowBooking] = useState(false);
  const [activeRoom, setActiveRoom] = useState("");
  
  const [allSchedules, setAllSchedules] = useState([
    { id: 1, room: "MERKURIUS", time: "14:00", type: "Pararel", date: new Date().getDate() },
  ]);

  const handleSaveJadwal = (e) => {
    e.preventDefault();
    const newJadwal = {
      id: Date.now(),
      room: activeRoom,
      time: e.target.jam.value,
      type: e.target.tipe.value,
      date: selectedDate
    };
    setAllSchedules([...allSchedules, newJadwal]);
    setShowBooking(false);
    alert("Jadwal Tersimpan!");
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <h2>Selamat Datang, Admin!</h2>
          <div style={styles.clock}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </div>
        </div>

        {/* --- FITUR JADWAL LANGSUNG DISINI --- */}
        <div style={styles.gridContainer}>
          
          {/* Kalender */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📅 Pilih Tanggal (Januari 2026)</h3>
            <div style={styles.calendarGrid}>
              {[...Array(31)].map((_, i) => (
                <div key={i} onClick={() => setSelectedDate(i + 1)}
                  style={selectedDate === i + 1 ? styles.dayActive : styles.day}>
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* List Kelas Planet */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🚀 Jadwal Kelas (Tgl {selectedDate})</h3>
            <div style={styles.roomList}>
              {rooms.map(r => (
                <div key={r} style={styles.roomItem}>
                  <div>
                    <span style={styles.roomLabel}>{r}</span>
                    <div style={styles.scheduleTags}>
                      {allSchedules.filter(s => s.room === r && s.date === selectedDate).map(s => (
                        <span key={s.id} style={s.type === 'Pararel' ? styles.tagBlue : styles.tagRed}>{s.time}</span>
                      ))}
                    </div>
                  </div>
                  <button style={styles.btnPlus} onClick={() => { setActiveRoom(r); setShowBooking(true); }}>+ Set</button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Booking */}
        {showBooking && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Set Jadwal: {activeRoom}</h3>
              <form onSubmit={handleSaveJadwal}>
                <div style={styles.formGroup}>
                  <label>Jam</label>
                  <input name="jam" type="time" required style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                  <label>Tipe</label>
                  <select name="tipe" style={styles.input}>
                    <option value="Pararel">Pararel</option>
                    <option value="Booking">Booking</option>
                  </select>
                </div>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSubmit}>Simpan</button>
                  <button type="button" onClick={() => setShowBooking(false)} style={styles.btnCancel}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '20px' },
  clock: { fontSize: '24px', fontWeight: 'bold' },
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '25px' },
  card: { background: 'white', padding: '20px', borderRadius: '12px' },
  cardTitle: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' },
  day: { padding: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer', borderRadius: '5px' },
  dayActive: { padding: '10px', textAlign: 'center', background: '#3498db', color: 'white', fontWeight: 'bold', borderRadius: '5px' },
  roomList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  roomItem: { display: 'flex', justifyContent: 'space-between', padding: '10px', border: '1px solid #eee', borderRadius: '5px' },
  roomLabel: { fontWeight: 'bold', display: 'block' },
  scheduleTags: { display: 'flex', gap: '5px', marginTop: '5px' },
  tagBlue: { background: '#e1f5fe', color: '#0288d1', padding: '2px 5px', borderRadius: '3px', fontSize: '11px' },
  tagRed: { background: '#ffebee', color: '#d32f2f', padding: '2px 5px', borderRadius: '3px', fontSize: '11px' },
  btnPlus: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal: { background: 'white', padding: '20px', borderRadius: '10px', width: '300px' },
  formGroup: { marginBottom: '10px' },
  input: { width: '100%', padding: '8px', boxSizing: 'border-box' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '15px' },
  btnSubmit: { flex: 1, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default Dashboard;