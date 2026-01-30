import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar'; 

const SchedulePage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [room, setRoom] = useState("");

  const rooms = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // Fungsi navigasi bulan
  const changeMonth = (offset) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.main}>
        <div style={styles.header}>
          <h2>📅 Jadwal & Kelas</h2>
          <div style={styles.nav}>
            <button onClick={() => changeMonth(-1)}>◀</button>
            <span style={{fontWeight:'bold', margin:'0 15px'}}>
              {currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)}>▶</button>
          </div>
        </div>

        <div style={styles.grid}>
          {/* Kalender Sederhana */}
          <div style={styles.card}>
            <p>Klik tanggal untuk mengatur jadwal:</p>
            <div style={styles.calendar}>
              {[...Array(31)].map((_, i) => (
                <div 
                  key={i} 
                  style={selectedDate.getDate() === i+1 ? styles.dayActive : styles.day}
                  onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), i+1))}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* List Kelas */}
          <div style={styles.roomContainer}>
            <h3 style={{marginTop:0}}>Kelas Planet - {selectedDate.toLocaleDateString('id-ID')}</h3>
            {rooms.map(r => (
              <div key={r} style={styles.roomItem}>
                <span><b>{r}</b></span>
                <button 
                  style={styles.btnSet} 
                  onClick={() => { setRoom(r); setModalOpen(true); }}
                >
                  + Set Jadwal
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Modal */}
        {modalOpen && (
          <div style={styles.modal}>
            <div style={styles.modalContent}>
              <h3>Set Jadwal {room}</h3>
              <p>Tanggal: {selectedDate.toLocaleDateString('id-ID')}</p>
              <input type="time" style={styles.input} />
              <select style={styles.input}>
                <option>Pararel (Rutin)</option>
                <option>Booking (Sekali)</option>
              </select>
              <div style={{display:'flex', gap:'10px'}}>
                <button style={styles.btnSave} onClick={() => setModalOpen(false)}>Simpan</button>
                <button style={styles.btnCancel} onClick={() => setModalOpen(false)}>Batal</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  main: { marginLeft: '250px', padding: '25px', width: '100%', background: '#f0f2f5', minHeight: '100vh', fontFamily: 'Arial' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  nav: { background: 'white', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px' },
  calendar: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginTop: '10px' },
  day: { padding: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer' },
  dayActive: { padding: '10px', textAlign: 'center', background: '#3498db', color: 'white', fontWeight: 'bold' },
  roomContainer: { display: 'flex', flexDirection: 'column', gap: '10px' },
  roomItem: { background: 'white', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnSet: { background: '#27ae60', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '5px', cursor: 'pointer' },
  modal: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modalContent: { background: 'white', padding: '30px', borderRadius: '10px', width: '300px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box' },
  btnSave: { flex: 1, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default SchedulePage;