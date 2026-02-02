import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc, getDoc, writeBatch, updateDoc } from "firebase/firestore"; // Tambah updateDoc

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  const [dailyCode, setDailyCode] = useState("Loading...");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  
  // STATE BARU: UNTUK MODE EDIT
  const [editId, setEditId] = useState(null); 

  // FORM DATA
  const [formData, setFormData] = useState({
    start: "14:00", end: "15:30", 
    program: "Reguler", level: "SD",
    title: "", booker: "", selectedStudents: [],
    repeat: "Once"
  });

  // FILTER SISWA DI MODAL
  const [filterJenjang, setFilterJenjang] = useState("Semua"); 
  const [filterKelas, setFilterKelas] = useState(""); 

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  const fetchData = async () => {
    try {
        const schedSnap = await getDocs(collection(db, "jadwal_bimbel"));
        setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const tSnap = await getDocs(collection(db, "teachers"));
        setAvailableTeachers(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const sSnap = await getDocs(collection(db, "students"));
        setAvailableStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const today = new Date().toISOString().split('T')[0];
        const cSnap = await getDoc(doc(db, "settings", `daily_code_${today}`));
        setDailyCode(cSnap.exists() ? cSnap.data().code : "⚠️ Belum Diset");
    } catch (e) { console.error("Error fetching:", e); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]); // Refresh saat tanggal ganti juga

  // --- LOGIKA FILTER SISWA ---
  const getFilteredStudents = () => {
    return availableStudents.filter(s => {
        const isEnglishProgram = formData.program === 'English';
        const studentIsEnglish = (s.detailProgram || "").includes("English");

        if (isEnglishProgram && !studentIsEnglish) return false;
        if (!isEnglishProgram && studentIsEnglish) return false;

        if (filterJenjang !== "Semua") {
             const jenjangStr = (s.kelasSekolah || "") + (s.detailProgram || "");
             if (!jenjangStr.toUpperCase().includes(filterJenjang.toUpperCase())) return false;
        }

        if (filterKelas && !s.nama.toLowerCase().includes(filterKelas.toLowerCase())) return false;

        return true;
    });
  };

  const handleSelectAll = () => {
    const filtered = getFilteredStudents();
    const ids = filtered.map(s => s.id);
    setFormData({ ...formData, selectedStudents: ids });
  };

  // --- CEK BENTROK ---
  const checkCollision = (targetDateStr, newStart, newEnd, currentId = null) => {
    // Filter jadwal lain di planet & tanggal yg sama, KECUALI jadwal yg sedang diedit
    const existing = schedules.filter(s => 
        s.planet === activePlanet && 
        s.dateStr === targetDateStr &&
        s.id !== currentId // Abaikan diri sendiri saat edit
    );
    return existing.some(s => (newStart < s.end && newEnd > s.start));
  };

  // --- FITUR EDIT (LOAD DATA KE FORM) ---
  const handleEditClick = (item) => {
      setEditId(item.id); // Tandai sedang edit ID ini
      setActivePlanet(item.planet); // Pastikan planet sesuai
      setFormData({
          start: item.start,
          end: item.end,
          program: item.program || "Reguler",
          level: item.level || "SD",
          title: item.title || "",
          booker: item.booker || "",
          selectedStudents: item.students ? item.students.map(s => s.id) : [],
          repeat: "Once" // Saat edit, default ke Once (edit satu aja)
      });
      setIsModalOpen(true);
  };

  // --- SIMPAN (BISA ADD BARU / UPDATE EDIT) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru!");
    
    // Siapkan Data Siswa Lengkap
    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelasSekolah } : null;
    }).filter(Boolean); 

    let currentDate = new Date(selectedDate); 
    const dateString = currentDate.toISOString().split('T')[0];

    // Cek Tabrakan
    if (checkCollision(dateString, formData.start, formData.end, editId)) {
        alert(`⛔ GAGAL! Jadwal Tabrakan di Jam ${formData.start} - ${formData.end}`);
        return;
    }

    try {
        if (editId) {
            // === LOGIKA UPDATE (EDIT) ===
            await updateDoc(doc(db, "jadwal_bimbel", editId), {
                start: formData.start,
                end: formData.end,
                program: formData.program,
                level: formData.level,
                title: formData.title,
                booker: formData.booker,
                students: studentsFullData
            });
            alert("✅ Jadwal Berhasil Diupdate!");

        } else {
            // === LOGIKA TAMBAH BARU (ADD) ===
            const batch = writeBatch(db);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;

            for (let i = 0; i < loopCount; i++) {
                const curDateStr = currentDate.toISOString().split('T')[0];
                
                // Cek tabrakan di setiap looping tanggal
                if (checkCollision(curDateStr, formData.start, formData.end)) {
                    if(!window.confirm(`⚠️ Tanggal ${curDateStr} bentrok! Lewati tanggal ini dan lanjut sisanya?`)) {
                        return; // Stop jika user pilih cancel
                    }
                } else {
                    const newRef = doc(collection(db, "jadwal_bimbel"));
                    batch.set(newRef, {
                        planet: activePlanet,
                        dateStr: curDateStr,
                        start: formData.start,
                        end: formData.end,
                        program: formData.program,
                        level: formData.level,
                        title: formData.title,
                        booker: formData.booker,
                        code: `R-${Math.floor(Math.random()*1000)}`, 
                        students: studentsFullData,
                        isRecurring: formData.repeat === 'Monthly' 
                    });
                }
                currentDate.setDate(currentDate.getDate() + 7);
            }
            await batch.commit(); 
            alert(`✅ Sukses! Jadwal tersimpan.`);
        }

        setIsModalOpen(false);
        setEditId(null); // Reset mode edit
        fetchData(); // Refresh data agar tampilan update

    } catch (error) { 
        console.error(error); 
        alert("Gagal menyimpan: " + error.message); 
    }
  };

  // --- HAPUS JADWAL ---
  const handleDelete = async (id) => {
    if(window.confirm("Yakin hapus jadwal ini?")) { 
        try {
            await deleteDoc(doc(db, "jadwal_bimbel", id)); 
            alert("🗑️ Jadwal dihapus.");
            fetchData(); // Refresh paksa biar ijonya ilang
        } catch (e) {
            alert("Gagal hapus.");
        }
    }
  };

  // UI HELPERS
  const changeMonth = (v) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + v, 1));
  const formatDateStr = (date) => date.toISOString().split('T')[0];
  
  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d));
      const hasEvent = schedules.some(s => s.dateStr === dateStr); // Cek jadwal
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

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditId(null); // Reset form edit jika di-close
      setFormData({ // Reset form data
        start: "14:00", end: "15:30", program: "Reguler", level: "SD",
        title: "", booker: "", selectedStudents: [], repeat: "Once"
      });
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        
        <div style={styles.infoBar}>
            <span>🔑 Kode Guru Hari Ini: <b>{dailyCode}</b></span>
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
                                {/* Tombol Tambah Baru */}
                                <button onClick={() => { 
                                    setActivePlanet(planet); 
                                    setEditId(null); // Pastikan mode tambah baru
                                    setFormData({ ...formData, repeat: 'Once', title:'', booker:'', selectedStudents:[] }); // Reset form
                                    setIsModalOpen(true); 
                                }} style={styles.btnAdd}>+ Isi Jadwal</button>
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
                                            👨‍🏫 {item.booker} ({item.level}) <br/>
                                            👥 {item.students?.length || 0} Siswa
                                        </div>
                                        <div style={{textAlign:'right', marginTop:5}}>
                                            {/* TOMBOL EDIT */}
                                            <button onClick={()=>handleEditClick(item)} style={styles.btnLinkOrange}>✏️ Edit</button>
                                            <span style={{color:'#ccc'}}> | </span>
                                            {/* TOMBOL HAPUS */}
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

        {/* MODAL INPUT CERDAS (Bisa Edit / Tambah) */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3>{editId ? `✏️ Edit Jadwal ${activePlanet}` : `➕ Booking ${activePlanet}`}</h3>
              
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                   <div style={{flex:1}}><label>Mulai</label><input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} /></div>
                   <div style={{flex:1}}><label>Selesai</label><input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} /></div>
                </div>

                {/* Opsi Ulang Hanya Muncul Jika BUKAN Edit */}
                {!editId && (
                    <div style={{background:'#e3f2fd', padding:10, borderRadius:5, marginBottom:10}}>
                        <label style={{fontWeight:'bold', color:'#1565c0'}}>Frekuensi</label>
                        <div style={{display:'flex', gap:15, marginTop:5}}>
                            <label style={{cursor:'pointer'}}><input type="radio" name="repeat" checked={formData.repeat === 'Once'} onChange={()=>setFormData({...formData, repeat:'Once'})} /> Sekali (Hari Ini)</label>
                            <label style={{cursor:'pointer'}}><input type="radio" name="repeat" checked={formData.repeat === 'Monthly'} onChange={()=>setFormData({...formData, repeat:'Monthly'})} /> Rutin (4 Minggu)</label>
                        </div>
                    </div>
                )}
                
                <div style={styles.row}>
                    <div style={{flex:1}}>
                        <label>Program</label>
                        <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={styles.select}>
                            <option value="Reguler">📚 Reguler</option>
                            <option value="English">🇬🇧 English</option>
                        </select>
                    </div>
                    <div style={{flex:1}}>
                        <label>Level</label>
                        <select value={formData.level} onChange={e=>setFormData({...formData, level:e.target.value})} style={styles.select}>
                            <option value="SD">SD / Kids</option>
                            <option value="SMP">SMP / Junior</option>
                            <option value="SMA">SMA / Pro</option>
                        </select>
                    </div>
                </div>

                <label>Guru Pengajar</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>

                <label>Materi / Mapel</label>
                <input type="text" placeholder="Contoh: Matematika Bab 1" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />

                {/* --- FITUR FILTER SISWA --- */}
                <div style={{border:'1px solid #ccc', borderRadius:5, padding:10, marginTop:10}}>
                    <label style={{fontWeight:'bold', color:'#2c3e50'}}>👥 Pilih Siswa</label>
                    <div style={{display:'flex', gap:5, marginBottom:5}}>
                        <select value={filterJenjang} onChange={e=>setFilterJenjang(e.target.value)} style={{padding:5, fontSize:12, borderRadius:4}}>
                            <option value="Semua">Semua Jenjang</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                        </select>
                        <input type="text" placeholder="Cari Nama..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={{padding:5, fontSize:12, flex:1}} />
                        <button type="button" onClick={handleSelectAll} style={{padding:5, fontSize:11, background:'#3498db', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>Pilih Semua</button>
                    </div>
                    <div style={{border:'1px solid #eee', padding:5, height:100, overflowY:'auto', background:'#fafafa'}}>
                        {getFilteredStudents().length === 0 ? <small style={{color:'red'}}>Tidak ada siswa yg cocok.</small> : 
                        getFilteredStudents().map(s => (
                            <div key={s.id} style={{fontSize:13, padding:3, borderBottom:'1px dashed #eee'}}>
                                <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} onChange={(e) => {
                                    const ids = formData.selectedStudents;
                                    if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                    else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                                }} /> <b>{s.nama}</b> <span style={{color:'#777'}}>({s.kelasSekolah || '-'})</span>
                            </div>
                        ))}
                    </div>
                    <small style={{color:'blue'}}>Terpilih: {formData.selectedStudents.length} Siswa</small>
                </div>

                <div style={styles.btnRow}>
                  <button type="submit" style={styles.btnSave}>{editId ? "UPDATE JADWAL" : "SIMPAN JADWAL"}</button>
                  <button type="button" onClick={handleCloseModal} style={styles.btnCancel}>Batal</button>
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
  btnLinkRed: { color:'#c0392b', background:'none', border:'none', cursor:'pointer', fontSize:12, textDecoration:'underline', fontWeight:'bold' },
  btnLinkOrange: { color:'#e67e22', background:'none', border:'none', cursor:'pointer', fontSize:12, textDecoration:'underline', fontWeight:'bold' },
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