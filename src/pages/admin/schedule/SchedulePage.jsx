import React, { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { db } from '../../../firebase'; 
import { collection, getDocs, deleteDoc, doc, getDoc, writeBatch, updateDoc } from "firebase/firestore";

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  const [dailyCode, setDailyCode] = useState("Loading...");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [editId, setEditId] = useState(null); 

  // DEFINISI STATE FORM DEFAULT
  const defaultForm = {
    start: "14:00", end: "15:30", 
    program: "Reguler", level: "SD",
    title: "", booker: "", selectedStudents: [],
    repeat: "Once"
  };
  const [formData, setFormData] = useState(defaultForm);

  // FILTER SISWA (STATE)
  const [filterJenjang, setFilterJenjang] = useState("Semua"); 
  const [filterKelas, setFilterKelas] = useState(""); 

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // HELPER TANGGAL AMAN
  const getSafeDateString = (dateObj) => {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    try {
        const schedSnap = await getDocs(collection(db, "jadwal_bimbel"));
        setSchedules(schedSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const tSnap = await getDocs(collection(db, "teachers"));
        setAvailableTeachers(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const sSnap = await getDocs(collection(db, "students"));
        setAvailableStudents(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        
        const todayStr = getSafeDateString(new Date());
        const cSnap = await getDoc(doc(db, "settings", `daily_code_${todayStr}`));
        setDailyCode(cSnap.exists() ? cSnap.data().code : "⚠️ Belum Diset");
    } catch (e) { console.error("Error fetching:", e); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  // --- BUKA MODAL (RESET FORM TOTAL) ---
  const handleOpenModal = (planet, isEdit = false, item = null) => {
      setActivePlanet(planet);
      
      // Reset Filter agar semua siswa muncul dulu
      setFilterJenjang("Semua");
      setFilterKelas("");

      if (isEdit && item) {
          setEditId(item.id);
          setFormData({
              start: item.start,
              end: item.end,
              program: item.program || "Reguler",
              level: item.level || "SD",
              title: item.title || "",
              booker: item.booker || "",
              selectedStudents: item.students ? item.students.map(s => s.id) : [],
              repeat: "Once"
          });
      } else {
          // WAJIB: Reset form agar data siswa lama hilang
          setEditId(null);
          setFormData({ ...defaultForm }); 
      }
      setIsModalOpen(true);
  };

  // --- SIMPAN DATA (FIX TANGGAL & SISWA) ---
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru!");
    
    // Ambil detail siswa berdasarkan ID yang terpilih
    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelasSekolah || "-" } : null;
    }).filter(Boolean);

    try {
        if (editId) {
            // UPDATE
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
            // BARU
            const batch = writeBatch(db);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
            
            // Fix Tanggal Mundur: Set jam ke siang
            let tempDate = new Date(selectedDate); 
            tempDate.setHours(12, 0, 0, 0); 

            for (let i = 0; i < loopCount; i++) {
                const curDateStr = getSafeDateString(tempDate); 
                
                // Cek Bentrok
                const isClash = schedules.some(s => 
                    s.planet === activePlanet && 
                    s.dateStr === curDateStr && 
                    (formData.start < s.end && formData.end > s.start)
                );

                if (!isClash || window.confirm(`Tanggal ${curDateStr} bentrok. Tetap simpan?`)) {
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
                        students: studentsFullData, // Data siswa bersih
                        isRecurring: formData.repeat === 'Monthly' 
                    });
                }
                tempDate.setDate(tempDate.getDate() + 7);
            }
            await batch.commit(); 
            alert(`✅ Sukses! Jadwal tersimpan.`);
        }

        setIsModalOpen(false);
        setEditId(null);
        fetchData(); 

    } catch (error) { 
        console.error(error); 
        alert("Gagal menyimpan: " + error.message); 
    }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Yakin hapus jadwal ini?")) { 
        try { await deleteDoc(doc(db, "jadwal_bimbel", id)); fetchData(); } catch (e) { alert("Gagal hapus."); }
    }
  };

  // HELPER UI
  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = getSafeDateString(dateObj);
      const isSelected = getSafeDateString(selectedDate) === dateStr;
      
      days.push(
        <div key={d} onClick={() => setSelectedDate(dateObj)}
          style={{
             padding:8, textAlign:'center', cursor:'pointer', borderRadius:4, fontSize:14,
             background: isSelected ? '#3498db' : 'white',
             color: isSelected ? 'white' : 'black',
             border: '1px solid #eee'
          }}>
          {d}
        </div>
      );
    }
    return days;
  };

  const getFilteredStudents = () => {
    return availableStudents.filter(s => {
        if (filterKelas && !s.nama.toLowerCase().includes(filterKelas.toLowerCase())) return false;
        if (filterJenjang !== "Semua") {
            const info = (s.kelasSekolah || "") + (s.detailProgram || "");
            if (!info.toUpperCase().includes(filterJenjang.toUpperCase())) return false;
        }
        return true;
    });
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.dateHeader}>
            <h2>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
        </div>

        <div style={styles.layoutGrid}>
            <div style={styles.leftCol}>
                <div style={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:10}}>
                        <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>◀</button> 
                        <b>{currentMonth.toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</b>
                        <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>▶</button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:5}}>{renderCalendar()}</div>
                </div>
            </div>

            <div style={styles.rightCol}>
                {PLANETS.map(planet => {
                    const dateStr = getSafeDateString(selectedDate);
                    const items = schedules.filter(s => s.planet === planet && s.dateStr === dateStr);
                    items.sort((a,b) => a.start.localeCompare(b.start));

                    return (
                        <div key={planet} style={styles.planetContainer}>
                            <div style={styles.planetHead}>
                                <b>🪐 {planet}</b>
                                <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Isi</button>
                            </div>
                            <div style={{padding:10}}>
                                {items.length === 0 ? <small style={{color:'#999'}}>Kosong</small> : items.map(item => (
                                    <div key={item.id} style={{background:'#f9f9f9', padding:10, marginBottom:5, borderRadius:5, borderLeft:'4px solid #2ecc71'}}>
                                        <div style={{fontWeight:'bold'}}>{item.start} - {item.end}</div>
                                        <div>{item.title} <small>({item.program})</small></div>
                                        <div style={{color:'#d35400', fontSize:13}}>👨‍🏫 {item.booker}</div>
                                        <div style={{fontSize:12, color:'#7f8c8d'}}>👥 {item.students?.length || 0} Siswa</div>
                                        <div style={{marginTop:5, fontSize:12}}>
                                            <span onClick={()=>handleOpenModal(planet, true, item)} style={{cursor:'pointer', color:'blue', marginRight:10}}>Edit</span>
                                            <span onClick={()=>handleDelete(item.id)} style={{cursor:'pointer', color:'red'}}>Hapus</span>
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
              <h3>{editId ? "✏️ Edit Jadwal" : "➕ Jadwal Baru"}</h3>
              <form onSubmit={handleSave}>
                {/* JAM */}
                <div style={styles.row}>
                   <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} />
                   <span style={{paddingTop:10}}>-</span>
                   <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} />
                </div>
                
                {/* PROGRAM & REPEAT */}
                <div style={styles.row}>
                    <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={styles.select}>
                        <option value="Reguler">Reguler</option><option value="English">English</option>
                    </select>
                    {!editId && (
                         <select value={formData.repeat} onChange={e=>setFormData({...formData, repeat:e.target.value})} style={styles.select}>
                            <option value="Once">Sekali (Hari Ini)</option>
                            <option value="Monthly">1 Bulan (4x)</option>
                        </select>
                    )}
                </div>

                {/* GURU */}
                <label>Guru Pengajar:</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>

                <label>Materi / Judul:</label>
                <input type="text" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />

                {/* PILIH SISWA (DIPERBAIKI: ADA FILTER KELAS) */}
                <div style={{border:'1px solid #ddd', padding:10, borderRadius:5, marginTop:10}}>
                    <div style={{display:'flex', gap:5, marginBottom:5}}>
                        {/* FILTER DROPDOWN JENJANG */}
                        <select value={filterJenjang} onChange={e=>setFilterJenjang(e.target.value)} style={{padding:5, borderRadius:4, border:'1px solid #ccc'}}>
                            <option value="Semua">Semua Jenjang</option>
                            <option value="SD">SD</option>
                            <option value="SMP">SMP</option>
                            <option value="SMA">SMA</option>
                        </select>
                        {/* SEARCH NAMA */}
                        <input type="text" placeholder="Cari Nama..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={{flex:1, padding:5, borderRadius:4, border:'1px solid #ccc'}} />
                    </div>
                    
                    <div style={{height:150, overflowY:'auto', background:'#fdfdfd', border:'1px solid #eee'}}>
                        {getFilteredStudents().length === 0 ? <small style={{padding:5, color:'#999'}}>Tidak ditemukan...</small> : 
                         getFilteredStudents().map(s => (
                            <div key={s.id} style={{padding:5, borderBottom:'1px solid #eee', fontSize:13}}>
                                <input type="checkbox" 
                                    checked={formData.selectedStudents.includes(s.id)} 
                                    onChange={(e) => {
                                        const ids = formData.selectedStudents;
                                        if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                        else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                                    }} 
                                /> 
                                <span style={{marginLeft:5}}>{s.nama}</span>
                                <small style={{color:'grey', marginLeft:5}}>({s.kelasSekolah || '-'})</small>
                            </div>
                        ))}
                    </div>
                    <small style={{display:'block', marginTop:5, color:'blue'}}>Terpilih: {formData.selectedStudents.length} Siswa</small>
                </div>

                <div style={{marginTop:20, display:'flex', gap:10}}>
                    <button type="submit" style={styles.btnSave}>SIMPAN</button>
                    <button type="button" onClick={()=>setIsModalOpen(false)} style={styles.btnCancel}>BATAL</button>
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
  mainContent: { marginLeft: '250px', padding: '20px', width: '100%', background: '#f4f7f6', minHeight: '100vh', fontFamily:'Segoe UI' },
  dateHeader: { background: '#2c3e50', color:'white', padding:15, borderRadius:8, marginBottom:20 },
  layoutGrid: { display:'grid', gridTemplateColumns: '300px 1fr', gap: 20 },
  leftCol: { position:'sticky', top:20 },
  rightCol: { display:'flex', flexDirection:'column', gap:15 },
  card: { background:'white', padding:15, borderRadius:8, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  planetContainer: { background:'white', borderRadius:8, overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  planetHead: { background:'#ecf0f1', padding:'10px 15px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  btnAdd: { background:'#27ae60', color:'white', border:'none', padding:'3px 10px', borderRadius:4, cursor:'pointer' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999 },
  modal: { background:'white', padding:20, borderRadius:8, width:400, maxHeight:'90vh', overflowY:'auto' },
  input: { width:'100%', padding:8, marginBottom:10, border:'1px solid #ccc', borderRadius:4, boxSizing:'border-box' },
  select: { width:'100%', padding:8, marginBottom:10, border:'1px solid #ccc', borderRadius:4 },
  row: { display:'flex', gap:10 },
  btnSave: { flex:1, padding:10, background:'#2980b9', color:'white', border:'none', borderRadius:4, cursor:'pointer' },
  btnCancel: { flex:1, padding:10, background:'#95a5a6', color:'white', border:'none', borderRadius:4, cursor:'pointer' }
};

export default SchedulePage;