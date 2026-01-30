import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

const Dashboard = () => {
  // --- 1. LOGIKA WAKTU ---
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // --- 2. LOGIKA JADWAL & BOOKING ---
  const rooms = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const [showBooking, setShowBooking] = useState(false);
  const [activeRoom, setActiveRoom] = useState("");
  
  // Data Jadwal Terpusat
  const [allSchedules, setAllSchedules] = useState([
    { id: 1, room: "MERKURIUS", time: "14:00", type: "Pararel", date: new Date().getDate() },
    { id: 2, room: "BUMI", time: "16:00", type: "Booking", date: new Date().getDate() },
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
    alert("Jadwal Berhasil Disimpan!");
  };

  return (
    <div style={{ display: 'flex', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <Sidebar />
      
      <div style={styles.mainContent}>
        {/* HEADER DASHBOARD */}
        <div style={styles.header}>
          <div>
            <h2 style={{margin:0}}>Selamat Datang, Admin!</h2>
            <p style={{color:'#7f8c8d', margin: '5px 0 0 0'}}>
              {time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={styles.clock}>
            {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
          </div>
        </div>

        <div style={styles.gridContainer}>
          
          {/* KOLOM KIRI: KALENDER INTERAKTIF */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>📅 Pilih Tanggal</h3>
            <div style={styles.calendarGrid}>
              {[...Array(31)].map((_, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedDate(i + 1)}
                  style={selectedDate === i + 1 ? styles.dayActive : styles.day}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <p style={{fontSize: '12px', color: '#95a5a6', marginTop: '15px'}}>
              *Menampilkan jadwal untuk tanggal <b>{selectedDate} Januari 2026</b>
            </p>
          </div>

          {/* KOLOM KANAN: MANAJEMEN KELAS PLANET */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>🚀 Plotting Kelas (Planet)</h3>
            <div style={styles.roomList}>
              {rooms.map(r => (
                <div key={r} style={styles.roomItem}>
                  <div style={styles.roomInfo}>
                    <span style={styles.roomLabel}>{r}</span>
                    <div style={styles.scheduleTags}>
                      {allSchedules.filter(s => s.room === r && s.date === selectedDate).map(s => (
                        <span key={s.id} style={s.type === 'Pararel' ? styles.tagBlue : styles.tagRed}>
                          {s.time} ({s.type})
                        </span>
                      ))}
                      {allSchedules.filter(s => s.room === r && s.date === selectedDate).length === 0 && 
                        <span style={{color:'#ccc', fontSize:'12px'}}>Kosong</span>
                      }
                    </div>
                  </div>
                  <button 
                    style={styles.btnPlus}
                    onClick={() => { setActiveRoom(r); setShowBooking(true); }}
                  >
                    + Set
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* MODAL BOOKING (POP UP) */}
        {showBooking && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3 style={{marginTop:0}}>Set Jadwal: {activeRoom}</h3>
              <p>Tanggal: {selectedDate} Januari 2026</p>
              <form onSubmit={handleSaveJadwal}>
                <div style={styles.formGroup}>
                  <label>Jam Mengajar</label>
                  <input name="jam" type="time" required style={styles.input} />
                </div>
                <div style={styles.formGroup}>
                  <label>Tipe Kelas</label>
                  <select name="tipe" style={styles.input}>
                    <option value="Pararel">Pararel (Rutin)</option>
                    <option value="Booking">Booking (Sekali)</option>
                  </select>
                </div>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSubmit}>Simpan Jadwal</button>
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

// --- STYLING (SUDAH DIUJI) ---
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', boxSizing: 'border-box' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' },
  clock: { fontSize: '32px', fontWeight: 'bold', color: '#2c3e50' },
  
  gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '25px' },
  card: { backgroundColor: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardTitle: { marginTop: 0, borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', fontSize: '18px', color: '#2c3e50' },
  
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '15px' },
  day: { padding: '10px 5px', textAlign: 'center', border: '1px solid #eee', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' },
  dayActive: { padding: '10px 5px', textAlign: 'center', backgroundColor: '#3498db', color: 'white', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' },

  roomList: { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '15px' },
  roomItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', border: '1px solid #f1f2f6', borderRadius: '8px' },
  roomInfo: { display: 'flex', flexDirection: 'column', gap: '5px' },
  roomLabel: { fontWeight: 'bold', color: '#34495e' },
  scheduleTags: { display: 'flex', gap: '5px', flexWrap: 'wrap' },
  tagBlue: { backgroundColor: '#e1f5fe', color: '#0288d1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  tagRed: { backgroundColor: '#ffebee', color: '#d32f2f', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
  btnPlus: { backgroundColor: '#27ae60', color: 'white', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { backgroundColor: 'white', padding: '30px', borderRadius: '12px', width: '350px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box', marginTop: '5px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  btnSubmit: { flex: 2, padding: '12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  btnCancel: { flex: 1, padding: '12px', backgroundColor: '#bdc3c7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
};

export default Dashboard;