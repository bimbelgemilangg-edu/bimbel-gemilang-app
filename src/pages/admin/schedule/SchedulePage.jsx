import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, writeBatch } from "firebase/firestore"; // Tambah writeBatch

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  const [dailyCode, setDailyCode] = useState("Loading...");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  
  // FORM DATA (Update: Tambah opsi 'repeat')
  const [formData, setFormData] = useState({
    start: "14:00", end: "15:30", 
    program: "Reguler", level: "SD",
    title: "", booker: "", selectedStudents: [],
    repeat: "Once" // Opsinya: 'Once' (Sekali) atau 'Monthly' (1 Bulan/4x)
  });

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

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

  // --- FITUR 1: DETEKSI TABRAKAN (ANTI-BENTROK) ---
  const checkCollision = (targetDateStr, newStart, newEnd) => {
    // Filter jadwal di Ruangan (Planet) yang sama & Tanggal yang sama
    const existing = schedules.filter(s => 
      s.planet === activePlanet && 
      s.dateStr === targetDateStr
    );

    // Cek irisan waktu
    const isClash = existing.some(s => {
      // Logika Bentrok:
      // (Start Baru < End Lama) DAN (End Baru > Start Lama)
      return (newStart < s.end && newEnd > s.start);
    });

    return isClash;
  };

  // --- LOGIKA SIMPAN CANGGIH (RECURRING + VALIDASI) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru!");
    if (formData.start >= formData.end) return alert("Jam selesai harus lebih akhir dari jam mulai!");

    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelas } : null;
    }).filter(Boolean); 

    // TENTUKAN BERAPA KALI LOOPING
    // Jika 'Once', loop 1x. Jika 'Monthly', loop 4x (4 minggu).
    const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
    
    // Batch Write (Agar aman: semua tersimpan atau gagal semua)
    const batch = writeBatch(db); 
    
    let currentDate = new Date(selectedDate); // Copy tanggal yang dipilih

    for (let i = 0; i < loopCount; i++) {
        const dateString = currentDate.toISOString().split('T')[0];

        // 1. CEK BENTROK DULU!
        if (checkCollision(dateString, formData.start, formData.end)) {
            alert(`⛔ GAGAL! Jadwal Tabrakan di tanggal ${dateString} jam ${formData.start}. Ruangan sudah terisi.`);
            return; // Stop proses
        }

        // Siapkan Data
        const newRef = doc(collection(db, "jadwal_bimbel")); // Generate ID baru
        batch.set(newRef, {
            planet: activePlanet,
            dateStr: dateString,
            start: formData.start,
            end: formData.end,
            program: formData.program,
            level: formData.level,
            title: formData.title,
            booker: formData.booker,
            code: `R-${Math.floor(Math.random()*1000)}`, 
            students: studentsFullData,
            isRecurring: formData.repeat === 'Monthly' // Flag penanda
        });

        // Lompat ke minggu depan (tambah 7 hari)
        currentDate.setDate(currentDate.getDate() + 7);
    }

    try {
        await batch.commit(); // Eksekusi Simpan ke Database
        alert(`✅ Sukses! ${loopCount} Jadwal berhasil dibuat.`);
        setIsModalOpen(false);
        fetchData();
    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan jadwal.");
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Hapus jadwal ini?")) { await deleteDoc(doc(db, "jadwal_bimbel", id)); fetchData(); }
  };

  // HELPER KALENDER
  const changeMonth = (v) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + v, 1));
  const formatDateStr = (date) => date.toISOString().split('T')[0];

  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
      const hasEvent = schedules.some(s => s.dateStr === dateStr);
      const isSelected = selectedDate.getDate() === d && selectedDate.getMonth() === currentMonth.getMonth();
      days.push(
        <div key={d} onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d))}
          style={isSelected ? styles.dayActive : (hasEvent ? styles.dayEvent : styles.day)}>
          {d}
        </div>
      );
    }
    return days;
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        
        <div style={styles.infoBar}>
            <span>🔑 Kode Guru Hari Ini ({new Date().toLocaleDateString('id-ID')}): <b>{dailyCode}</b></span>
        </div>

        <div style={styles.layoutGrid}>
            <div style={styles.leftCol}>
                <div style={styles.card}>
                    <div style={styles.calHeader}>
                        <button onClick={()=>changeMonth(-1)}>◀</button> 
                        <b>{currentMonth.toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</b>
                        <button onClick={()=>changeMonth(1)}>▶</button>
                    </div>
                    <div style={styles.calendarGrid}>{renderCalendar()}</div>
                </div>
            </div>

            <div style={styles.rightCol}>
                <div style={styles.dateHeader}>
                    <h2>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
                    <span style={{color:'#eee'}}>Manajemen Jadwal & Konflik</span>
                </div>

                {PLANETS.map(planet => {
                    const items = schedules.filter(s => s.planet === planet && s.dateStr === formatDateStr(selectedDate));
                    items.sort((a,b) => a.start.localeCompare(b.start));

                    return (
                        <div key={planet} style={styles.planetContainer}>
                            <div style={styles.planetHead}>
                                <h3>🪐 {planet}</h3>
                                <button onClick={() => { setActivePlanet(planet); setIsModalOpen(true); }} style={styles.btnAdd}>+ Isi Jadwal</button>
                            </div>

                            <div style={styles.scheduleList}>
                                {items.length === 0 ? <div style={styles.emptySlot}>⚪ Kosong</div> : items.map(item => (
                                    <div key={item.id} style={item.program === 'English' ? styles.cardYellow : styles.cardGreen}>
                                        <div style={{display:'flex', justifyContent:'space-between'}}>
                                            <span style={{fontWeight:'bold', fontSize:15}}>⏰ {item.start} - {item.end}</span>
                                            <span style={{fontSize:12, fontWeight:'bold', opacity:0.7}}>{item.program}</span>
                                        </div>
                                        <div style={{margin:'5px 0', fontSize:14}}>
                                            <b>{item.title}</b> <br/>
                                            👨‍🏫 {item.booker} ({item.level})
                                            {item.isRecurring && <span style={{marginLeft:5}}>🔄</span>}
                                        </div>
                                        <div style={{textAlign:'right'}}>
                                            <button onClick={()=>handleDelete(item.id)} style={styles.btnLinkRed}>Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* MODAL INPUT */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>Booking {activePlanet}</h3>
              <p style={{fontSize:12, color:'red', marginTop:-10}}>*Otomatis cek bentrok jadwal</p>
              
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                   <div style={{flex:1}}><label>Mulai</label><input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} /></div>
                   <div style={{flex:1}}><label>Selesai</label><input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} /></div>
                </div>

                {/* PILIHAN RECURRING (PARAREL) */}
                <div style={{background:'#e3f2fd', padding:10, borderRadius:5, marginBottom:10}}>
                    <label style={{fontWeight:'bold', color:'#1565c0'}}>Frekuensi Jadwal</label>
                    <div style={{display:'flex', gap:15, marginTop:5}}>
                        <label style={{cursor:'pointer'}}>
                            <input type="radio" name="repeat" checked={formData.repeat === 'Once'} onChange={()=>setFormData({...formData, repeat:'Once'})} /> 
                            Hanya Hari Ini (Booking Sementara)
                        </label>
                        <label style={{cursor:'pointer'}}>
                            <input type="radio" name="repeat" checked={formData.repeat === 'Monthly'} onChange={()=>setFormData({...formData, repeat:'Monthly'})} /> 
                            Ulangi 4 Minggu (Pararel 1 Bulan)
                        </label>
                    </div>
                </div>
                
                <label style={{fontWeight:'bold'}}>Kategori Program</label>
                <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={styles.select}>
                    <option value="Reguler">📚 Reguler</option>
                    <option value="English">🇬🇧 English</option>
                </select>

                <label style={{fontWeight:'bold'}}>Level</label>
                <select value={formData.level} onChange={e=>setFormData({...formData, level:e.target.value})} style={styles.select}>
                    <option value="SD">SD / Kids</option>
                    <option value="SMP">SMP / Junior</option>
                    <option value="SMA">SMA / Pro</option>
                </select>

                <label>Guru Pengajar</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>

                <label>Mapel / Materi</label>
                <input type="text" placeholder="Contoh: Matematika" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />

                <label>Pilih Siswa</label>
                <div style={{border:'1px solid #ddd', padding:5, height:80, overflowY:'auto', borderRadius:4}}>
                    {availableStudents.map(s => (
                        <div key={s.id} style={{fontSize:13, padding:2}}>
                            <input type="checkbox" onChange={(e) => {
                                const ids = formData.selectedStudents;
                                if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                            }} /> {s.nama} ({s.kelas})
                        </div>
                    ))}
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

// CSS STYLING (Sama seperti sebelumnya)
const styles = {
  mainContent: { marginLeft: '250px', padding: '20px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI, sans-serif' },
  infoBar: { background: '#2c3e50', color: 'white', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px', boxShadow:'0 2px 4px rgba(0,0,0,0.1)' },
  layoutGrid: { display:'grid', gridTemplateColumns: '300px 1fr', gap: '20px', alignItems:'start' },
  leftCol: { position:'sticky', top:20 },
  card: { background:'white', padding:15, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  calHeader: { display:'flex', justifyContent:'space-between', marginBottom:15, alignItems:'center' },
  calendarGrid: { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:5 },
  day: { padding:8, textAlign:'center', border:'1px solid #eee', cursor:'pointer', borderRadius:4, fontSize:14 },
  dayEvent: { padding:8, textAlign:'center', border:'1px solid #2ecc71', background:'#e8f8f5', cursor:'pointer', borderRadius:4, fontSize:14, fontWeight:'bold', color:'#27ae60' },
  dayActive: { padding:8, textAlign:'center', background:'#3498db', color:'white', borderRadius:4, fontWeight:'bold', cursor:'pointer', fontSize:14 },
  dateHeader: { background: '#34495e', color:'white', padding:'15px 25px', borderRadius:'10px', marginBottom:20, boxShadow:'0 4px 6px rgba(0,0,0,0.1)' },
  planetContainer: { background:'white', marginBottom:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)', overflow:'hidden' },
  planetHead: { background:'#ecf0f1', padding:'10px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #ddd' },
  btnAdd: { background:'#27ae60', color:'white', border:'none', padding:'5px 15px', borderRadius:4, cursor:'pointer', fontWeight:'bold' },
  scheduleList: { padding:15, display:'flex', flexDirection:'column', gap:10 },
  emptySlot: { padding:15, textAlign:'center', border:'2px dashed #ddd', borderRadius:8, color:'#999', fontSize:14 },
  cardGreen: { background:'#d4edda', borderLeft:'5px solid #27ae60', padding:10, borderRadius:5 },
  cardYellow: { background:'#fff3cd', borderLeft:'5px solid #f1c40f', padding:10, borderRadius:5 },
  btnLinkRed: { color:'#c0392b', background:'none', border:'none', cursor:'pointer', fontSize:12, textDecoration:'underline' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999 },
  modal: { background:'white', padding:25, borderRadius:10, width:450, boxShadow:'0 10px 25px rgba(0,0,0,0.2)', maxHeight:'90vh', overflowY:'auto' },
  input: { width:'100%', padding:10, marginBottom:10, border:'1px solid #ccc', borderRadius:5, boxSizing:'border-box' },
  select: { width:'100%', padding:10, marginBottom:10, border:'1px solid #ccc', borderRadius:5, background:'white' },
  row: { display:'flex', gap:10 },
  btnRow: { display:'flex', gap:10, marginTop:15 },
  btnSave: { flex:1, padding:12, background:'#27ae60', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' },
  btnCancel: { flex:1, padding:12, background:'#bdc3c7', color:'white', border:'none', borderRadius:5, cursor:'pointer' }
};

export default SchedulePage;