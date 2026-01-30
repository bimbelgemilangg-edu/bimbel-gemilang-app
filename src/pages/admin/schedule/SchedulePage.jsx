import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
// IMPORT FIREBASE
import { db } from '../../../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // --- STATE DATA ---
  const [availableTeachers, setAvailableTeachers] = useState([]); // (Nanti di-onlinekan juga)
  const [schedules, setSchedules] = useState([]); // DATA JADWAL DARI CLOUD
  
  // Load Guru Lokal (Sementara, nanti bisa di-onlinekan juga)
  useEffect(() => {
    const savedTeachers = localStorage.getItem("DB_TEACHERS");
    if (savedTeachers) setAvailableTeachers(JSON.parse(savedTeachers));
    else setAvailableTeachers([{ id: 1, nama: "Pak Budi", mapel: "Umum" }]);
  }, []);

  // --- 1. AMBIL DATA DARI FIREBASE (REALTIME) ---
  const fetchSchedules = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "jadwal_bimbel"));
      const dataList = querySnapshot.docs.map(doc => ({
        id: doc.id, // ID Unik dari Firebase
        ...doc.data()
      }));
      setSchedules(dataList);
    } catch (error) {
      console.error("Error ambil data:", error);
    }
  };

  useEffect(() => {
    fetchSchedules(); // Ambil data saat halaman dibuka
  }, []);

  // --- DATA STATIS ---
  const allStudents = [
    { id: 101, nama: "Adit Sopo", kelas: "4 SD" },
    { id: 102, nama: "Jarwo Kuat", kelas: "4 SD" },
    { id: 106, nama: "Roro Jonggrang", kelas: "9 SMP" },
  ];
  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // --- MODAL STATE ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [formData, setFormData] = useState({
    start: "", end: "", type: "Pararel", title: "", booker: "", selectedStudents: []
  });

  // HELPER
  const changeMonth = (offset) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  const formatDateStr = (date) => date.toISOString().split('T')[0];
  const generateCode = (planet) => {
    const prefix = planet.substring(0, 3).toUpperCase();
    const num = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${num}`;
  };

  const openAddModal = (planet) => {
    setActivePlanet(planet);
    setGeneratedCode(generateCode(planet));
    setFormData({ start: "14:00", end: "15:30", type: "Pararel", title: "", booker: "", selectedStudents: [] });
    setIsModalOpen(true);
  };

  // --- 2. SIMPAN KE FIREBASE ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru!");
    if (formData.selectedStudents.length === 0) return alert("Pilih Siswa!");

    try {
      const newSchedule = {
        planet: activePlanet,
        dateStr: formatDateStr(selectedDate),
        ...formData,
        code: generatedCode,
        // Simpan object siswa lengkap agar mudah dibaca guru
        students: formData.selectedStudents.map(id => allStudents.find(s => s.id === id))
      };

      // KIRIM KE CLOUD
      await addDoc(collection(db, "jadwal_bimbel"), newSchedule);
      
      alert("✅ Tersimpan di Cloud! Guru bisa melihat di HP mereka.");
      setIsModalOpen(false);
      fetchSchedules(); // Refresh data
    } catch (error) {
      console.error("Gagal simpan:", error);
      alert("Gagal menyimpan ke database online.");
    }
  };

  // --- 3. HAPUS DARI FIREBASE ---
  const handleDelete = async (id) => {
    if(window.confirm("Hapus jadwal ini permanen dari server?")) {
      try {
        await deleteDoc(doc(db, "jadwal_bimbel", id));
        fetchSchedules(); // Refresh
      } catch (error) {
        console.error("Gagal hapus:", error);
      }
    }
  };

  // Render Logic
  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
      const hasEvent = schedules.some(s => s.dateStr === dateStr);
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === currentMonth.getMonth();
      days.push(
        <div key={d} onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
          style={isSelected ? styles.dayActive : styles.day}>
          {d} {hasEvent && <span style={styles.dot}></span>}
        </div>
      );
    }
    return days;
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.header}>
          <h2 style={{margin:0}}>📅 Jadwal Online (Firebase)</h2>
          <div style={styles.nav}>
            <button onClick={() => changeMonth(-1)}>◀</button>
            <span style={{fontWeight:'bold'}}>{currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
            <button onClick={() => changeMonth(1)}>▶</button>
          </div>
        </div>

        <div style={styles.layout}>
          <div style={styles.card}>
            <h3>Pilih Tanggal</h3>
            <div style={styles.calendarGrid}>{renderCalendar()}</div>
          </div>

          <div style={styles.card}>
            <h3>Jadwal: {selectedDate.toLocaleDateString('id-ID')}</h3>
            <div style={styles.planetList}>
              {PLANETS.map(planet => {
                const items = schedules.filter(s => s.planet === planet && s.dateStr === formatDateStr(selectedDate));
                return (
                  <div key={planet} style={styles.planetCard}>
                    <div style={styles.planetHeader}>
                      <b>{planet}</b>
                      <button style={styles.btnAdd} onClick={() => openAddModal(planet)}>+ Jadwal</button>
                    </div>
                    {items.map(item => (
                      <div key={item.id} style={item.type === 'Pararel' ? styles.tagRed : styles.tagGreen}>
                        <div>
                          <b>{item.start}-{item.end}</b> <br/>
                          {item.title} (Guru: {item.booker})
                        </div>
                        <div style={{textAlign:'right'}}>
                          <div style={styles.codeBadge}>{item.code}</div>
                          <button onClick={() => handleDelete(item.id)} style={styles.btnDel}>Hapus</button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* MODAL (Sama seperti sebelumnya) */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Set Jadwal: {activePlanet}</h3>
              <p style={styles.codeDisplay}>{generatedCode}</p>
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                  <input type="time" required value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={styles.input} />
                  <input type="time" required value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={styles.input} />
                </div>
                <div style={styles.group}>
                  <label>Guru</label>
                  <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                  </select>
                </div>
                <input type="text" placeholder="Mapel" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.input} />
                
                <div style={styles.studentSection}>
                  <label>Pilih Siswa:</label>
                  <div style={styles.studentList}>
                    {allStudents.map(s => (
                      <label key={s.id} style={styles.checkboxLabel}>
                        <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} onChange={() => {
                          if(formData.selectedStudents.includes(s.id)) setFormData({...formData, selectedStudents: formData.selectedStudents.filter(id => id !== s.id)});
                          else setFormData({...formData, selectedStudents: [...formData.selectedStudents, s.id]});
                        }} /> {s.nama} ({s.kelas})
                      </label>
                    ))}
                  </div>
                </div>
                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSave}>Simpan Cloud</button>
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

// CSS (Pakai yang lama)
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  header: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px', background:'white', padding:'20px', borderRadius:'10px' },
  nav: { display: 'flex', gap: '10px' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' },
  card: { background: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', marginTop:'10px' },
  day: { padding: '10px', textAlign: 'center', border: '1px solid #eee', cursor: 'pointer' },
  dayActive: { padding: '10px', textAlign: 'center', background: '#3498db', color: 'white', fontWeight:'bold' },
  dot: { display:'inline-block', width:'6px', height:'6px', background:'red', borderRadius:'50%', marginLeft:'2px' },
  planetList: { display: 'flex', flexDirection: 'column', gap: '10px' },
  planetCard: { border: '1px solid #eee', padding: '10px', borderRadius: '8px' },
  planetHeader: { display:'flex', justifyContent:'space-between', marginBottom:'5px' },
  btnAdd: { background: '#27ae60', color:'white', border:'none', borderRadius:'4px', cursor:'pointer' },
  tagRed: { background: '#fadbd8', borderLeft: '4px solid #c0392b', padding: '8px', marginTop:'5px', borderRadius:'4px', display:'flex', justifyContent:'space-between', fontSize:'13px' },
  tagGreen: { background: '#d4edda', borderLeft: '4px solid #27ae60', padding: '8px', marginTop:'5px', borderRadius:'4px', display:'flex', justifyContent:'space-between', fontSize:'13px' },
  codeBadge: { background:'white', padding:'2px 5px', fontWeight:'bold', border:'1px dashed #333', fontSize:'11px', height:'fit-content' },
  btnDel: { fontSize:'10px', color:'red', background:'none', border:'none', cursor:'pointer', marginTop:'5px', textDecoration:'underline' },
  overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  modal: { background: 'white', padding: '25px', borderRadius: '10px', width: '400px', maxHeight:'90vh', overflowY:'auto' },
  row: { display: 'flex', gap: '10px' },
  group: { marginBottom: '10px' },
  input: { width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', border:'1px solid #ccc', borderRadius:'4px' },
  select: { width: '100%', padding: '10px', marginBottom: '10px', boxSizing: 'border-box', border:'1px solid #ccc', borderRadius:'4px', background:'white' },
  codeDisplay: { background: '#eee', padding: '10px', textAlign: 'center', fontWeight: 'bold', letterSpacing: '2px', marginBottom: '10px' },
  studentSection: { borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' },
  studentList: { maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee', padding: '5px', marginTop: '5px' },
  checkboxLabel: { display: 'block', padding: '5px', cursor: 'pointer', fontSize:'14px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  btnSave: { flex: 1, padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  btnCancel: { flex: 1, padding: '12px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default SchedulePage;