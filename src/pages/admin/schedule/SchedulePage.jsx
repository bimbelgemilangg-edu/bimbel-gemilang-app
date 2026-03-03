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

  const defaultForm = {
    start: "14:00", end: "15:30", 
    program: "Reguler", level: "SD",
    title: "", booker: "", selectedStudents: [],
    repeat: "Once"
  };
  const [formData, setFormData] = useState(defaultForm);

  const [filterJenjang, setFilterJenjang] = useState("Semua"); 
  const [filterKelas, setFilterKelas] = useState(""); 

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // HELPER TANGGAL SMART (Sama dengan Dashboard Guru)
  const getSmartDateString = (dateObj) => {
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
        
        const todayStr = getSmartDateString(new Date());
        const cSnap = await getDoc(doc(db, "settings", `daily_code_${todayStr}`));
        setDailyCode(cSnap.exists() ? cSnap.data().code : "⚠️ Belum Diset");
    } catch (e) { console.error("Error fetching:", e); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  const handleOpenModal = (planet, isEdit = false, item = null) => {
      setActivePlanet(planet);
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
              booker: item.booker?.trim() || "", // Pastikan bersih dari spasi
              selectedStudents: item.students ? item.students.map(s => s.id) : [],
              repeat: "Once"
          });
      } else {
          setEditId(null);
          setFormData({ ...defaultForm }); 
      }
      setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.booker) return alert("Pilih Guru!");
    
    // Bersihkan nama guru dari spasi tak sengaja agar Match dengan Dashboard Guru
    const cleanTeacherName = formData.booker.trim();

    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelasSekolah || "-" } : null;
    }).filter(Boolean);

    try {
        if (editId) {
            await updateDoc(doc(db, "jadwal_bimbel", editId), {
                start: formData.start,
                end: formData.end,
                program: formData.program,
                level: formData.level,
                title: formData.title,
                booker: cleanTeacherName, // Simpan nama bersih
                students: studentsFullData
            });
            alert("✅ Jadwal Berhasil Diupdate!");
        } else {
            const batch = writeBatch(db);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
            
            let tempDate = new Date(selectedDate); 
            tempDate.setHours(12, 0, 0, 0); 

            for (let i = 0; i < loopCount; i++) {
                const curDateStr = getSmartDateString(tempDate); 
                
                const newRef = doc(collection(db, "jadwal_bimbel"));
                batch.set(newRef, {
                    planet: activePlanet,
                    dateStr: curDateStr, 
                    start: formData.start,
                    end: formData.end,
                    program: formData.program,
                    level: formData.level,
                    title: formData.title,
                    booker: cleanTeacherName, // Simpan nama bersih
                    code: `R-${Math.floor(Math.random()*1000)}`, 
                    students: studentsFullData,
                    isRecurring: formData.repeat === 'Monthly' 
                });
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

  const renderCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = getSmartDateString(dateObj);
      const isSelected = getSmartDateString(selectedDate) === dateStr;
      
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
        const matchNama = s.nama.toLowerCase().includes(filterKelas.toLowerCase());
        if (filterJenjang === "Semua") return matchNama;
        
        const infoSiswa = (s.kelasSekolah || "").toUpperCase();
        return matchNama && infoSiswa.includes(filterJenjang.toUpperCase());
    });
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div style={styles.mainContent}>
        <div style={styles.dateHeader}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
                <div style={{background:'rgba(255,255,255,0.2)', padding:'5px 15px', borderRadius:20, fontSize:14}}>
                    Kode Harian: <b>{dailyCode}</b>
                </div>
            </div>
        </div>

        <div style={styles.layoutGrid}>
            <div style={styles.leftCol}>
                <div style={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:10, alignItems:'center'}}>
                        <button style={styles.btnNav} onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>◀</button> 
                        <b style={{fontSize:14}}>{currentMonth.toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</b>
                        <button style={styles.btnNav} onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>▶</button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:5}}>{renderCalendar()}</div>
                </div>
            </div>

            <div style={styles.rightCol}>
                {PLANETS.map(planet => {
                    const dateStr = getSmartDateString(selectedDate);
                    const items = schedules.filter(s => s.planet === planet && s.dateStr === dateStr);
                    items.sort((a,b) => a.start.localeCompare(b.start));

                    return (
                        <div key={planet} style={styles.planetContainer}>
                            <div style={styles.planetHead}>
                                <b>🪐 {planet}</b>
                                <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Isi Jadwal</button>
                            </div>
                            <div style={{padding:10}}>
                                {items.length === 0 ? <small style={{color:'#999'}}>Belum ada jadwal di ruangan ini</small> : items.map(item => (
                                    <div key={item.id} style={styles.itemCard}>
                                        <div style={{display:'flex', justifyContent:'space-between'}}>
                                            <b style={{color:'#2980b9'}}>{item.start} - {item.end}</b>
                                            <span style={styles.badge}>{item.program}</span>
                                        </div>
                                        <div style={{margin:'5px 0', fontWeight:'600'}}>{item.title || "Tanpa Judul"}</div>
                                        <div style={{color:'#d35400', fontSize:13}}>👨‍🏫 {item.booker}</div>
                                        <div style={{fontSize:12, color:'#7f8c8d'}}>👥 {item.students?.length || 0} Siswa Terdaftar</div>
                                        <div style={styles.actions}>
                                            <span onClick={()=>handleOpenModal(planet, true, item)} style={{color:'#3498db', cursor:'pointer'}}>✏️ Edit</span>
                                            <span onClick={()=>handleDelete(item.id)} style={{color:'#e74c3c', cursor:'pointer'}}>🗑️ Hapus</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3 style={{marginTop:0}}>{editId ? "✏️ Edit Jadwal" : "➕ Tambah Jadwal Baru"}</h3>
              <p style={{fontSize:12, color:'#666', marginBottom:15}}>Ruangan: <b>{activePlanet}</b></p>
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                   <div style={{flex:1}}>
                       <label style={styles.label}>Jam Mulai:</label>
                       <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} />
                   </div>
                   <div style={{flex:1}}>
                       <label style={styles.label}>Jam Selesai:</label>
                       <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} />
                   </div>
                </div>
                
                <div style={styles.row}>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Program:</label>
                        <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={styles.select}>
                            <option value="Reguler">Reguler</option><option value="English">English</option>
                        </select>
                    </div>
                    {!editId && (
                         <div style={{flex:1}}>
                            <label style={styles.label}>Perulangan:</label>
                            <select value={formData.repeat} onChange={e=>setFormData({...formData, repeat:e.target.value})} style={styles.select}>
                                <option value="Once">Hanya Hari Ini</option>
                                <option value="Monthly">Rutin (4 Minggu)</option>
                            </select>
                         </div>
                    )}
                </div>

                <label style={styles.label}>Guru Pengajar:</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>

                <label style={styles.label}>Materi / Judul Kelas:</label>
                <input type="text" placeholder="Contoh: Matematika Aljabar" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />

                <div style={styles.studentBox}>
                    <div style={{display:'flex', gap:5, marginBottom:10}}>
                        <select value={filterJenjang} onChange={e=>setFilterJenjang(e.target.value)} style={styles.filterSelect}>
                            <option value="Semua">Semua Jenjang</option>
                            <option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
                        </select>
                        <input type="text" placeholder="Cari nama siswa..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={styles.filterInput} />
                    </div>
                    
                    <div style={styles.studentList}>
                        {getFilteredStudents().length === 0 ? <small style={{padding:10, display:'block', color:'#999'}}>Siswa tidak ditemukan...</small> : 
                         getFilteredStudents().map(s => (
                            <label key={s.id} style={styles.studentItem}>
                                <input type="checkbox" 
                                    checked={formData.selectedStudents.includes(s.id)} 
                                    onChange={(e) => {
                                        const ids = formData.selectedStudents;
                                        if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                        else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                                    }} 
                                /> 
                                <span style={{marginLeft:8}}>{s.nama} <small style={{color:'#999'}}>({s.kelasSekolah || '-'})</small></span>
                            </label>
                        ))}
                    </div>
                    <div style={styles.selectionCount}>Terpilih: {formData.selectedStudents.length} Siswa</div>
                </div>

                <div style={{marginTop:20, display:'flex', gap:10}}>
                    <button type="submit" style={styles.btnSave}>SIMPAN JADWAL</button>
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
  mainContent: { marginLeft: '250px', padding: '20px', width: 'calc(100% - 250px)', background: '#f4f7f6', minHeight: '100vh', fontFamily:'"Segoe UI", Roboto, Helvetica, Arial, sans-serif' },
  dateHeader: { background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)', color:'white', padding:'20px 25px', borderRadius:12, marginBottom:25, boxShadow:'0 4px 12px rgba(0,0,0,0.1)' },
  layoutGrid: { display:'grid', gridTemplateColumns: '320px 1fr', gap: 25 },
  leftCol: { position:'sticky', top:20, height:'fit-content' },
  rightCol: { display:'flex', flexDirection:'column', gap:20 },
  card: { background:'white', padding:20, borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
  btnNav: { background:'#eee', border:'none', padding:'5px 10px', borderRadius:5, cursor:'pointer' },
  planetContainer: { background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #eee' },
  planetHead: { background:'#f8f9fa', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee' },
  btnAdd: { background:'#27ae60', color:'white', border:'none', padding:'6px 15px', borderRadius:6, cursor:'pointer', fontWeight:'600', fontSize:13 },
  itemCard: { background:'#fff', padding:15, marginBottom:10, borderRadius:10, border:'1px solid #f0f0f0', borderLeft:'5px solid #3498db', transition:'0.3s' },
  badge: { background:'#e1f5fe', color:'#0288d1', padding:'2px 8px', borderRadius:4, fontSize:11, fontWeight:'bold' },
  actions: { marginTop:10, display:'flex', gap:15, fontSize:12, borderTop:'1px solid #eee', paddingTop:10 },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999, backdropFilter:'blur(3px)' },
  modal: { background:'white', padding:25, borderRadius:15, width:450, maxHeight:'85vh', overflowY:'auto', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' },
  label: { display:'block', marginBottom:5, fontSize:13, fontWeight:'600', color:'#444' },
  input: { width:'100%', padding:10, marginBottom:15, border:'1px solid #ddd', borderRadius:8, fontSize:14 },
  select: { width:'100%', padding:10, marginBottom:15, border:'1px solid #ddd', borderRadius:8, fontSize:14, background:'#fff' },
  row: { display:'flex', gap:15 },
  studentBox: { background:'#f9f9f9', padding:15, borderRadius:10, border:'1px solid #eee' },
  filterSelect: { padding:8, borderRadius:6, border:'1px solid #ddd', fontSize:12 },
  filterInput: { flex:1, padding:8, borderRadius:6, border:'1px solid #ddd', fontSize:12 },
  studentList: { height:180, overflowY:'auto', background:'#fff', border:'1px solid #ddd', borderRadius:6, marginTop:5 },
  studentItem: { display:'flex', alignItems:'center', padding:'8px 12px', borderBottom:'1px solid #f5f5f5', cursor:'pointer', fontSize:13 },
  selectionCount: { marginTop:8, fontSize:12, color:'#3498db', fontWeight:'bold' },
  btnSave: { flex:2, padding:12, background:'#2980b9', color:'white', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold' },
  btnCancel: { flex:1, padding:12, background:'#ecf0f1', color:'#7f8c8d', border:'none', borderRadius:8, cursor:'pointer', fontWeight:'bold' }
};

export default SchedulePage;