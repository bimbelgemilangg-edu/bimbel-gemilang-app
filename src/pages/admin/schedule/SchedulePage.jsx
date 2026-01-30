import React, { useState } from 'react';
import Sidebar from '../../../components/Sidebar';

const SchedulePage = () => {
  // --- 1. STATE & NAVIGASI WAKTU ---
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Navigasi Bulan
  const [selectedDate, setSelectedDate] = useState(new Date()); // Tanggal yang diklik

  // --- 2. DATA UTAMA ---
  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  
  // Data Jadwal Dummy (Format Tanggal: YYYY-MM-DD)
  const [schedules, setSchedules] = useState([
    { 
      id: 1, 
      planet: "MERKURIUS", 
      dateStr: "2026-01-30", 
      start: "14:00", 
      end: "15:30", 
      type: "Pararel", 
      title: "Matematika Dasar", 
      booker: "Pak Budi" 
    },
    { 
      id: 2, 
      planet: "BUMI", 
      dateStr: "2026-01-30", 
      start: "16:00", 
      end: "18:00", 
      type: "Booking", 
      title: "Rapat Guru", 
      booker: "Bu Siti" 
    },
  ]);

  // --- 3. STATE MODAL (FORM) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  
  // Form State
  const [formData, setFormData] = useState({
    id: null,
    start: "",
    end: "",
    type: "Booking",
    title: "",
    booker: ""
  });

  // --- 4. LOGIKA HELPER ---

  // Navigasi Bulan (Maju/Mundur)
  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    setCurrentMonth(newMonth);
  };

  // Format Tanggal YYYY-MM-DD
  const formatDateStr = (date) => date.toISOString().split('T')[0];

  // Cek Bentrok Jadwal (CRITICAL FEATURE)
  const checkConflict = (newStart, newEnd, planet, excludeId = null) => {
    const targetDate = formatDateStr(selectedDate);
    
    // Filter jadwal di hari & planet yang sama
    const existing = schedules.filter(s => 
      s.planet === planet && 
      s.dateStr === targetDate && 
      s.id !== excludeId // Jangan cek diri sendiri saat edit
    );

    // Cek tabrakan waktu
    for (let item of existing) {
      if (
        (newStart >= item.start && newStart < item.end) || // Mulai di tengah jadwal lain
        (newEnd > item.start && newEnd <= item.end) ||     // Selesai di tengah jadwal lain
        (newStart <= item.start && newEnd >= item.end)     // Menutup jadwal lain sepenuhnya
      ) {
        return true; // BENTROK!
      }
    }
    return false; // AMAN
  };

  // --- 5. HANDLERS ---

  const handleDayClick = (day) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(newDate);
  };

  // Buka Modal Tambah
  const openAddModal = (planet) => {
    setActivePlanet(planet);
    setIsEditMode(false);
    setFormData({ id: Date.now(), start: "08:00", end: "09:30", type: "Booking", title: "", booker: "" });
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const openEditModal = (item) => {
    setActivePlanet(item.planet);
    setIsEditMode(true);
    setFormData(item); // Load data lama
    setIsModalOpen(true);
  };

  // Simpan Data
  const handleSave = (e) => {
    e.preventDefault();

    // 1. Validasi Waktu
    if (formData.start >= formData.end) {
      alert("⚠️ Error: Jam Selesai harus lebih besar dari Jam Mulai!");
      return;
    }

    // 2. Cek Bentrok
    const isConflict = checkConflict(formData.start, formData.end, activePlanet, isEditMode ? formData.id : null);
    if (isConflict) {
      alert(`⚠️ PERINGATAN KERAS:\nJadwal BENTROK dengan jadwal yang sudah ada di ${activePlanet} pada jam tersebut!\nSilakan ganti jam.`);
      return;
    }

    const payload = {
      ...formData,
      planet: activePlanet,
      dateStr: formatDateStr(selectedDate)
    };

    if (isEditMode) {
      // Update
      setSchedules(schedules.map(s => s.id === formData.id ? payload : s));
    } else {
      // Create New
      setSchedules([...schedules, payload]);
    }
    
    setIsModalOpen(false);
  };

  // Hapus Data
  const handleDelete = () => {
    if (window.confirm("Yakin hapus jadwal ini?")) {
      setSchedules(schedules.filter(s => s.id !== formData.id));
      setIsModalOpen(false);
    }
  };

  // --- RENDER KALENDER ---
  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Minggu
    
    const days = [];
    // Spacer kosong
    for (let i = 0; i < startDay; i++) days.push(<div key={`empty-${i}`} />);
    
    // Hari
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
      const count = schedules.filter(s => s.dateStr === dateStr).length;
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === currentMonth.getMonth();

      days.push(
        <div 
          key={d} 
          onClick={() => handleDayClick(d)}
          style={isSelected ? styles.dayActive : styles.day}
        >
          {d}
          {count > 0 && <span style={styles.dotEvent}></span>}
        </div>
      );
    }
    return days;
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        
        {/* HEADER */}
        <div style={styles.header}>
          <h2 style={{margin:0}}>📅 Manajemen Jadwal</h2>
          <div style={styles.monthNav}>
            <button onClick={() => changeMonth(-1)} style={styles.navBtn}>◀ Bulan Lalu</button>
            <span style={{fontWeight:'bold', fontSize:'18px', width:'200px', textAlign:'center'}}>
              {currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={() => changeMonth(1)} style={styles.navBtn}>Bulan Depan ▶</button>
          </div>
        </div>

        <div style={styles.layout}>
          {/* KOLOM KIRI: KALENDER */}
          <div style={styles.card}>
            <h3 style={styles.subTitle}>Pilih Tanggal</h3>
            <div style={styles.calendarGrid}>
              {['Min','Sen','Sel','Rab','Kam','Jum','Sab'].map(d => <div key={d} style={styles.dayName}>{d}</div>)}
              {renderCalendar()}
            </div>
            <div style={styles.legend}>
              <span style={{color:'red'}}>● Merah: Jadwal Tetap</span>
              <span style={{color:'green'}}>● Hijau: Booking</span>
              <span style={{color:'blue'}}>● Biru: Kosong</span>
            </div>
          </div>

          {/* KOLOM KANAN: LIST PLANET */}
          <div style={styles.card}>
            <h3 style={styles.subTitle}>
              Jadwal: {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h3>

            <div style={styles.planetList}>
              {PLANETS.map(planet => {
                const dateKey = formatDateStr(selectedDate);
                const items = schedules.filter(s => s.planet === planet && s.dateStr === dateKey).sort((a,b) => a.start.localeCompare(b.start));

                return (
                  <div key={planet} style={styles.planetCard}>
                    <div style={styles.planetHeader}>
                      <b>🪐 {planet}</b>
                      {/* TOMBOL BIRU: KOSONG / ADD */}
                      <button style={styles.btnAdd} onClick={() => openAddModal(planet)}>+ Kosong (Isi)</button>
                    </div>

                    <div style={styles.slotContainer}>
                      {items.length === 0 ? (
                        <div style={styles.emptyText}>Belum ada jadwal.</div>
                      ) : (
                        items.map(item => (
                          <div 
                            key={item.id} 
                            onClick={() => openEditModal(item)}
                            style={item.type === 'Pararel' ? styles.slotRed : styles.slotGreen}
                          >
                            <div style={styles.slotTime}>{item.start} - {item.end}</div>
                            <div style={styles.slotTitle}>{item.title}</div>
                            <div style={styles.slotBooker}>👤 {item.booker}</div>
                            <div style={styles.editHint}>Klik untuk edit</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL FORM */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>{isEditMode ? `Edit Jadwal: ${activePlanet}` : `Buat Jadwal Baru: ${activePlanet}`}</h3>
              <p>Tanggal: {selectedDate.toLocaleDateString('id-ID')}</p>
              
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                  <div style={styles.group}>
                    <label>Mulai</label>
                    <input type="time" required value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={styles.input} />
                  </div>
                  <div style={styles.group}>
                    <label>Selesai</label>
                    <input type="time" required value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={styles.input} />
                  </div>
                </div>

                <div style={styles.group}>
                  <label>Jenis Jadwal</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={styles.input}>
                    <option value="Pararel">Pararel (Tetap/Rutin) - MERAH</option>
                    <option value="Booking">Booking (Sekali) - HIJAU</option>
                  </select>
                </div>

                <div style={styles.group}>
                  <label>Nama Kegiatan / Mapel</label>
                  <input type="text" placeholder="Contoh: Matematika SD / Rapat" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.input} />
                </div>

                <div style={styles.group}>
                  <label>Penanggung Jawab / Guru</label>
                  <input type="text" placeholder="Nama Guru atau Pembooking" required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.input} />
                </div>

                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSave}>Simpan</button>
                  {isEditMode && (
                    <button type="button" onClick={handleDelete} style={styles.btnDelete}>Hapus</button>
                  )}
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

// --- STYLING (WARNA SESUAI REQUEST) ---
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', background:'white', padding:'20px', borderRadius:'10px' },
  monthNav: { display: 'flex', alignItems: 'center', gap:'10px' },
  navBtn: { padding: '8px 15px', cursor: 'pointer', background: '#ecf0f1', border: 'none', borderRadius: '5px' },
  
  layout: { display: 'grid', gridTemplateColumns: '1fr 1.8fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  subTitle: { marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#2c3e50' },

  // Kalender
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' },
  dayName: { textAlign: 'center', fontWeight: 'bold', fontSize: '12px', color: '#7f8c8d' },
  day: { aspectRatio: '1/1', border: '1px solid #eee', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '5px' },
  dayActive: { aspectRatio: '1/1', background: '#3498db', color: 'white', display: 'flex', flexDirection:'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: '5px', fontWeight: 'bold' },
  dotEvent: { width: '6px', height: '6px', background: '#e74c3c', borderRadius: '50%', marginTop: '2px' },
  legend: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '12px', fontWeight: 'bold' },

  // List Planet
  planetList: { display: 'flex', flexDirection: 'column', gap: '15px' },
  planetCard: { border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' },
  planetHeader: { background: '#34495e', color: 'white', padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  
  // WARNA BIRU SESUAI REQUEST (TOMBOL ADD)
  btnAdd: { background: '#3498db', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' },

  slotContainer: { padding: '10px', background: '#fdfdfd', minHeight: '50px' },
  emptyText: { fontSize: '12px', color: '#bdc3c7', fontStyle: 'italic', textAlign: 'center' },
  
  // WARNA SLOT (MERAH & HIJAU)
  slotRed: { background: '#fadbd8', borderLeft: '5px solid #c0392b', padding: '8px', marginBottom: '8px', borderRadius: '4px', cursor: 'pointer', transition: '0.2s' },
  slotGreen: { background: '#d4edda', borderLeft: '5px solid #27ae60', padding: '8px', marginBottom: '8px', borderRadius: '4px', cursor: 'pointer', transition: '0.2s' },
  
  slotTime: { fontWeight: 'bold', fontSize: '14px' },
  slotTitle: { fontSize: '13px', margin: '2px 0' },
  slotBooker: { fontSize: '12px', color: '#555', fontStyle: 'italic' },
  editHint: { fontSize: '10px', textAlign: 'right', color: '#999', marginTop: '5px' },

  // Modal
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modal: { background: 'white', padding: '25px', borderRadius: '10px', width: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  row: { display: 'flex', gap: '15px' },
  group: { marginBottom: '15px', flex: 1 },
  input: { width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', marginTop: '5px' },
  
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  btnSave: { flex: 2, padding: '10px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  btnDelete: { flex: 1, padding: '10px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  btnCancel: { flex: 1, padding: '10px', background: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default SchedulePage;