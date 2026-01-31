import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  const [dailyCode, setDailyCode] = useState("Loading...");

  // STATE FORM SIMPLE
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [formData, setFormData] = useState({
    start: "14:00", end: "15:30", 
    program: "Reguler", // Cuma Reguler / English
    level: "SD", // SD/SMP/SMA atau Kids/Junior/Pro
    title: "", booker: "", selectedStudents: []
  });

  const fetchData = async () => {
    const schedSnap = await getDocs(collection(db, "jadwal_bimbel"));
    setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const tSnap = await getDocs(collection(db, "teachers"));
    setAvailableTeachers(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    const sSnap = await getDocs(collection(db, "students"));
    setAvailableStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    
    const today = new Date().toISOString().split('T')[0];
    const cSnap = await getDoc(doc(db, "settings", `daily_code_${today}`));
    setDailyCode(cSnap.exists() ? cSnap.data().code : "⚠️ Belum Diset");
  };

  useEffect(() => { fetchData(); }, [selectedDate]); 

  // --- LOGIKA SIMPAN JADWAL (WADAH) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru Penanggung Jawab!");
    
    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelas } : null;
    }).filter(Boolean); 

    const newSchedule = {
      planet: activePlanet,
      dateStr: selectedDate.toISOString().split('T')[0],
      start: formData.start,
      end: formData.end,
      // INI KUNCINYA: Admin cuma set Kategori Program & Level Dasar
      program: formData.program, // "Reguler" atau "English"
      level: formData.level,     // "SD/SMP" atau "Kids/Junior"
      title: formData.title,     // Mapel default (bisa diedit guru)
      booker: formData.booker,   // Guru Default
      code: `R-${Math.floor(Math.random()*1000)}`, 
      students: studentsFullData 
    };

    await addDoc(collection(db, "jadwal_bimbel"), newSchedule);
    alert("✅ Jadwal Pararel Disimpan!");
    setIsModalOpen(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if(confirm("Hapus jadwal ini?")) { await deleteDoc(doc(db, "jadwal_bimbel", id)); fetchData(); }
  };

  // RENDER KALENDER (Sama seperti sebelumnya, disingkat biar muat)
  const changeMonth = (v) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + v, 1));
  const renderCalendar = () => { /* Logika Kalender Tetap Sama */ };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.infoBar}>
            <span>🔑 Kode Guru Hari Ini: <b>{dailyCode}</b></span>
        </div>
        
        {/* HEADER & KALENDER UI (SAMA SEPERTI SEBELUMNYA) */}
        <div style={styles.header}>
            <h2>📅 Setting Jadwal (Admin)</h2>
            <div>
                <button onClick={()=>changeMonth(-1)}>◀</button> 
                <span style={{margin:'0 10px'}}>{currentMonth.toLocaleDateString('id-ID', {month:'long'})}</span>
                <button onClick={()=>changeMonth(1)}>▶</button>
            </div>
        </div>

        {/* LIST JADWAL PER PLANET */}
        <div style={styles.layout}>
            <div style={{background:'white', padding:10, borderRadius:8}}>
                {["MERKURIUS", "VENUS", "BUMI"].map(planet => (
                    <div key={planet} style={{border:'1px solid #eee', margin:10, padding:10, borderRadius:5}}>
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <b>{planet}</b>
                            <button onClick={() => { setActivePlanet(planet); setIsModalOpen(true); }}>+ Jadwal</button>
                        </div>
                        {/* MAPPING JADWAL */}
                        {schedules.filter(s => s.planet === planet && s.dateStr === selectedDate.toISOString().split('T')[0]).map(item => (
                            <div key={item.id} style={{background: item.program==='English'?'#fff3cd':'#d4edda', padding:5, marginTop:5, fontSize:12}}>
                                <b>{item.start}-{item.end}</b> ({item.program} - {item.level}) <br/>
                                {item.title} (Guru: {item.booker})
                                <div style={{textAlign:'right', marginTop:5}}>
                                    <button onClick={()=>handleDelete(item.id)} style={{color:'red', border:'none', background:'none', cursor:'pointer'}}>Hapus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>

        {/* MODAL INPUT JADWAL (SIMPEL) */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Booking {activePlanet}</h3>
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                   <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} />
                   <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} />
                </div>
                
                {/* PILIH PROGRAM (Wadah Gaji) */}
                <label style={{fontWeight:'bold'}}>Kategori Program</label>
                <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value, level: e.target.value === 'English' ? 'Kids' : 'SD'})} style={styles.select}>
                    <option value="Reguler">📚 Reguler (Gaji per Jam)</option>
                    <option value="English">🇬🇧 English (Gaji Flat/Paket)</option>
                </select>

                {/* PILIH LEVEL (Menentukan Tarif Dasar) */}
                <label style={{fontWeight:'bold'}}>Level / Jenjang</label>
                {formData.program === 'Reguler' ? (
                    <select value={formData.level} onChange={e=>setFormData({...formData, level:e.target.value})} style={styles.select}>
                        <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
                    </select>
                ) : (
                    <select value={formData.level} onChange={e=>setFormData({...formData, level:e.target.value})} style={styles.select}>
                        <option value="Kids">Kids</option><option value="Junior">Junior</option><option value="Pro">Professional</option>
                    </select>
                )}

                <label>Guru Default</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>

                <input type="text" placeholder="Mapel (Matematika/Fisika)" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />

                <div style={{border:'1px solid #ddd', padding:5, height:100, overflowY:'auto'}}>
                    {availableStudents.map(s => (
                        <div key={s.id}>
                            <input type="checkbox" onChange={(e) => {
                                const ids = formData.selectedStudents;
                                if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                            }} /> {s.nama} ({s.kelas})
                        </div>
                    ))}
                </div>

                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSave}>SIMPAN</button>
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

// Styles (Disingkat)
const styles = {
  mainContent: { marginLeft: '250px', padding: '20px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'sans-serif' },
  infoBar: { background: '#2c3e50', color: 'white', padding: '10px', borderRadius: '5px', marginBottom: '10px' },
  header: { display:'flex', justifyContent:'space-between', background:'white', padding:15, borderRadius:8, marginBottom:10 },
  layout: { display:'grid', gridTemplateColumns:'1fr', gap:10 },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999 },
  modal: { background:'white', padding:20, borderRadius:10, width:400 },
  input: { width:'100%', padding:8, marginBottom:10, border:'1px solid #ccc', borderRadius:4, boxSizing:'border-box' },
  select: { width:'100%', padding:8, marginBottom:10, border:'1px solid #ccc', borderRadius:4, background:'white' },
  row: { display:'flex', gap:10 },
  btnRow: { display:'flex', gap:10, marginTop:10 },
  btnSave: { flex:1, padding:10, background:'#27ae60', color:'white', border:'none', borderRadius:4, cursor:'pointer' },
  btnCancel: { flex:1, padding:10, background:'#ccc', border:'none', borderRadius:4, cursor:'pointer' }
};

export default SchedulePage;