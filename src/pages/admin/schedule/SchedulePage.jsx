import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar'; 

const SchedulePage = () => {
  // --- STATE ---
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");

  // Data Jadwal Dummy
  const [schedules, setSchedules] = useState([
    { id: 1, planet: "MERKURIUS", date: new Date().getDate(), time: "14:00", type: "Pararel" },
    { id: 2, planet: "BUMI", date: new Date().getDate(), time: "16:30", type: "Booking" },
  ]);

  // Buka Modal Input
  const openModal = (planet) => {
    setActivePlanet(planet);
    setIsModalOpen(true);
  };

  // Simpan Jadwal (Tanpa Kode)
  const handleSave = (e) => {
    e.preventDefault();
    const newSchedule = {
      id: Date.now(),
      planet: activePlanet,
      date: selectedDate,
      time: e.target.jam.value,
      type: e.target.tipe.value
    };
    setSchedules([...schedules, newSchedule]);
    setIsModalOpen(false);
  };

  // Hapus Jadwal
  const handleDelete = (id) => {
    if(window.confirm("Hapus jadwal ini?")) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        
        <div style={styles.header}>
          <h2 style={{margin:0}}>📅 Manajemen Jadwal & Kelas</h2>
          <p style={{margin:'5px 0 0 0', color:'#7f8c8d'}}>Atur jadwal pengajaran di 5 ruang kelas planet.</p>
        </div>

        <div style={styles.layout}>
          {/* KIRI: KALENDER */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Pilih Tanggal (Januari 2026)</h3>
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
            <p style={{marginTop:'15px', fontSize:'14px'}}>
              Jadwal untuk tanggal: <b>{selectedDate} Januari</b>
            </p>
          </div>

          {/* KANAN: 5 PLANET */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Plotting Ruang Kelas</h3>
            <div style={styles.planetList}>
              {PLANETS.map(planet => (
                <div key={planet} style={styles.planetItem}>
                  <div style={styles.planetHeader}>
                    <b>{planet}</b>
                    <button style={styles.btnAdd} onClick={() => openModal(planet)}>+ Jadwal</button>
                  </div>
                  
                  {/* List Jadwal per Planet */}
                  <div style={styles.scheduleList}>
                    {schedules.filter(s => s.date === selectedDate && s.planet === planet).length === 0 ? (
                      <span style={{fontSize:'12px', color:'#ccc'}}>Kosong</span>
                    ) : (
                      schedules.filter(s => s.date === selectedDate && s.planet === planet).map(item => (
                        <div key={item.id} style={item.type === 'Pararel' ? styles.tagBlue : styles.tagRed}>
                          <span>{item.time} - {item.type}</span>
                          <span style={styles.deleteIcon} onClick={() => handleDelete(item.id)}>×</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL INPUT SEDERHANA */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Set Jadwal: {activePlanet}</h3>
              <form onSubmit={handleSave}>
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
                <div style={styles.btnGroup}>
                  <button type="submit" style={styles.btnSave}>Simpan</button>
                  <button type="button" onClick={() => setIsModalOpen(false)} style={styles.btnCancel}>Batal</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// CSS
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { marginBottom: '20px', background:'white', padding:'20px', borderRadius:'10px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  sectionTitle: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', fontSize:'16px', color:'#2c3e50' },
  
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' },
  day: { padding: '10px', textAlign: 'center', border: '1px solid #eee', borderRadius: '5px', cursor: 'pointer' },
  dayActive: { padding: '10px', textAlign: 'center', background: '#3498db', color: 'white', borderRadius: '5px', fontWeight:'bold', cursor: 'pointer' },

  planetList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  planetItem: { border: '1px solid #eee', borderRadius: '8px', padding: '10px' },
  planetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  btnAdd: { background: '#27ae60', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize:'12px' },
  
  scheduleList: { display: 'flex', flexWrap: 'wrap', gap: '5px' },
  tagBlue: { background: '#d6eaf8', color: '#2980b9', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold' },
  tagRed: { background: '#fadbd8', color: '#c0392b', padding: '5px 10px', borderRadius: '15px', fontSize: '12px', display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold' },
  deleteIcon: { cursor: 'pointer', fontWeight:'bold', fontSize:'14px' },

  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' },
  modal: { background: 'white', padding: '25px', borderRadius: '10px', width: '300px' },
  formGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '8px', boxSizing: 'border-box', marginTop:'5px' },
  btnGroup: { display: 'flex', gap: '10px' },
  btnSave: { flex: 1, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '10px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default SchedulePage;