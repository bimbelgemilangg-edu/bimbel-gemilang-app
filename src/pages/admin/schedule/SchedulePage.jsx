import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // --- STATE DATA DARI CLOUD ---
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  
  // STATE BARU: KODE HARIAN (LOGIN GURU)
  const [dailyCode, setDailyCode] = useState("Belum Diset");

  // --- 1. AMBIL SEMUA DATA (SINKRONISASI) ---
  const fetchData = async () => {
    // A. Ambil Jadwal
    const schedSnap = await getDocs(collection(db, "jadwal_bimbel"));
    setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // B. Ambil Guru
    const teacherSnap = await getDocs(collection(db, "teachers"));
    setAvailableTeachers(teacherSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // C. Ambil Siswa
    const studentSnap = await getDocs(collection(db, "students"));
    setAvailableStudents(studentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

    // D. AMBIL KODE LOGIN GURU HARI INI (Supaya Admin Ingat)
    const today = new Date().toISOString().split('T')[0];
    const codeRef = doc(db, "settings", `daily_code_${today}`);
    const codeSnap = await getDoc(codeRef);
    if (codeSnap.exists()) {
        setDailyCode(codeSnap.data().code);
    } else {
        setDailyCode("⚠️ Belum Diset di Menu Guru");
    }
  };

  useEffect(() => {
    fetchData(); 
  }, [selectedDate]); // Refresh jika ganti tanggal (opsional)

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [formData, setFormData] = useState({
    start: "14:00", end: "15:30", type: "Pararel", title: "", booker: "", selectedStudents: []
  });

  // Helpers
  const changeMonth = (offset) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  const formatDateStr = (date) => date.toISOString().split('T')[0];
  
  // Kode Booking Ruangan (Bukan Kode Login Guru)
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

  const handleSelectClass = (e) => {
    const kelas = e.target.value;
    if (!kelas) return;
    const ids = availableStudents.filter(s => s.kelas === kelas).map(s => s.id);
    setFormData(prev => ({ ...prev, selectedStudents: [...new Set([...prev.selectedStudents, ...ids])] }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru!");
    
    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelas } : null;
    }).filter(Boolean); 

    if (studentsFullData.length === 0) return alert("Pilih minimal 1 siswa!");

    const newSchedule = {
      planet: activePlanet,
      dateStr: formatDateStr(selectedDate),
      start: formData.start,
      end: formData.end,
      type: formData.type,
      title: formData.title,
      booker: formData.booker,
      code: generatedCode, // Ini Kode Booking Ruangan
      students: studentsFullData 
    };

    await addDoc(collection(db, "jadwal_bimbel"), newSchedule);
    alert("✅ Jadwal Tersimpan!");
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus jadwal ini?")) {
      await deleteDoc(doc(db, "jadwal_bimbel", id));
      fetchData();
    }
  };

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
        
        {/* INFO KODE HARIAN (SUPAYA ADMIN TIDAK LUPA) */}
        <div style={styles.infoBar}>
            <span>🔑 Kode Login Guru Hari Ini ({new Date().toLocaleDateString('id-ID')}):</span>
            <strong style={{marginLeft:10, fontSize:18, background:'white', color:'#2c3e50', padding:'2px 8px', borderRadius:4}}>
                {dailyCode}
            </strong>
        </div>

        <div style={styles.header}>
          <h2 style={{margin:0}}>📅 Jadwal & Booking Ruangan</h2>
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
                      <button style={styles.btnAdd} onClick={() => openAddModal(planet)}>+ Booking</button>
                    </div>
                    {items.map(item => (
                      <div key={item.id} style={item.type === 'Pararel' ? styles.tagRed : styles.tagGreen}>
                        <div><b>{item.start}-{item.end}</b> <br/> {item.title} ({item.booker})</div>
                        <div style={{textAlign:'right'}}>
                           <div style={styles.codeBadge}>Room: {item.code}</div>
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

        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Booking {activePlanet}</h3>
              <p style={{fontSize:12, color:'#666'}}>Kode Booking: {generatedCode}</p>
              
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                  <input type="time" required value={formData.start} onChange={e => setFormData({...formData, start: e.target.value})} style={styles.input} />
                  <input type="time" required value={formData.end} onChange={e => setFormData({...formData, end: e.target.value})} style={styles.input} />
                </div>
                
                <div style={styles.group}>
                  <label>Pilih Guru (Dari Database)</label>
                  <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => (
                      <option key={t.id} value={t.nama}>{t.nama} ({t.mapel})</option>
                    ))}
                  </select>
                </div>

                <input type="text" placeholder="Mapel / Kegiatan" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.input} />

                <div style={styles.studentSection}>
                  <label>Pilih Siswa (Dari Database):</label>
                  <select onChange={handleSelectClass} style={styles.select}>
                    <option value="">-- Auto Select per Kelas --</option>
                    <option value="4 SD">Semua Kelas 4 SD</option>
                    <option value="5 SD">Semua Kelas 5 SD</option>
                    <option value="6 SD">Semua Kelas 6 SD</option>
                    <option value="9 SMP">Semua Kelas 9 SMP</option>
                  </select>
                  
                  <div style={styles.studentList}>
                    {availableStudents.length === 0 && <p style={{color:'red', fontSize:12}}>Belum ada data siswa di Database.</p>}
                    {availableStudents.map(s => (
                      <label key={s.id} style={styles.checkboxLabel}>
                        <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} 
                            onChange={() => {
                                if (formData.selectedStudents.includes(s.id)) setFormData({...formData, selectedStudents: formData.selectedStudents.filter(id => id !== s.id)});
                                else setFormData({...formData, selectedStudents: [...formData.selectedStudents, s.id]});
                            }} 
                        /> 
                        {s.nama} ({s.kelas})
                      </label>
                    ))}
                  </div>
                  <p style={{fontSize:11, textAlign:'right', marginTop:5}}>Terpilih: {formData.selectedStudents.length} siswa</p>
                </div>

                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSave}>SIMPAN JADWAL</button>
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

// STYLES
const styles = {
  mainContent: { marginLeft: '250px', padding: '30px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  // INFO BAR BARU
  infoBar: { background: '#2c3e50', color: 'white', padding: '15px', borderRadius: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center' },
  
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
  studentSection: { borderTop: '1px solid #eee', paddingTop: '10px', marginTop: '10px' },
  studentList: { maxHeight: '120px', overflowY: 'auto', border: '1px solid #eee', padding: '5px', marginTop: '5px' },
  checkboxLabel: { display: 'block', padding: '5px', cursor: 'pointer', fontSize:'14px' },
  btnRow: { display: 'flex', gap: '10px', marginTop: '20px' },
  btnSave: { flex: 1, padding: '12px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight:'bold' },
  btnCancel: { flex: 1, padding: '12px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }
};

export default SchedulePage;