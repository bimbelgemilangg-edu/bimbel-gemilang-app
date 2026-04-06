import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin'; 
import { db } from '../../../firebase'; 
import { collection, getDocs, deleteDoc, doc, getDoc, writeBatch, updateDoc, setDoc } from "firebase/firestore";

const SchedulePage = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  
  const [dailyCode, setDailyCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [editId, setEditId] = useState(null); 

  const defaultForm = {
    start: "14:00", end: "15:30", 
    program: "Reguler", subLevel: "SD (Kelas 1-5)",
    title: "", booker: "", selectedStudents: [],
    repeat: "Once"
  };
  const [formData, setFormData] = useState(defaultForm);
  const [filterKelas, setFilterKelas] = useState(""); 

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  // Opsi Sub-Level Berdasarkan Program
  const subLevelOptions = {
    "Reguler": ["SD (Kelas 1-5)", "SD (Kelas 6)", "SMP"],
    "English": ["English Kids", "English Junior", "English Professional"]
  };

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
        
        const todayStr = getSmartDateString(selectedDate);
        const cSnap = await getDoc(doc(db, "settings", `daily_code_${todayStr}`));
        if (cSnap.exists()) {
            setDailyCode(cSnap.data().code);
            setTempCode(cSnap.data().code);
        } else {
            setDailyCode("⚠️ Belum Diset");
            setTempCode("");
        }
    } catch (e) { console.error("Error fetching:", e); }
  };

  const handleSaveDailyCode = async () => {
    if (!tempCode) return alert("Masukkan kode!");
    const todayStr = getSmartDateString(selectedDate);
    try {
      await setDoc(doc(db, "settings", `daily_code_${todayStr}`), {
        code: tempCode.toUpperCase(),
        date: todayStr,
        updatedAt: new Date()
      });
      setDailyCode(tempCode.toUpperCase());
      setIsEditingCode(false);
      alert("✅ Kode Harian Berhasil Diperbarui!");
    } catch (e) { alert("Gagal menyimpan kode."); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  const handleOpenModal = (planet, isEdit = false, item = null) => {
      setActivePlanet(planet);
      if (isEdit && item) {
          setEditId(item.id);
          setFormData({
              start: item.start, end: item.end,
              program: item.program || "Reguler",
              subLevel: item.subLevel || (item.program === "English" ? "English Kids" : "SD (Kelas 1-5)"),
              title: item.title || "",
              booker: item.booker || "", 
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
    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelasSekolah || "-" } : null;
    }).filter(Boolean);

    try {
        const payload = {
            start: formData.start, end: formData.end,
            program: formData.program, subLevel: formData.subLevel,
            title: formData.title, booker: formData.booker,
            students: studentsFullData
        };

        if (editId) {
            await updateDoc(doc(db, "jadwal_bimbel", editId), payload);
        } else {
            const batch = writeBatch(db);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
            let tempDate = new Date(selectedDate);
            for (let i = 0; i < loopCount; i++) {
                const curDateStr = getSmartDateString(tempDate);
                const newRef = doc(collection(db, "jadwal_bimbel"));
                batch.set(newRef, {
                    ...payload,
                    planet: activePlanet,
                    dateStr: curDateStr, 
                    status: "scheduled", 
                    attendance_list: [],
                    createdAt: new Date()
                });
                tempDate.setDate(tempDate.getDate() + 7);
            }
            await batch.commit();
        }
        setIsModalOpen(false);
        fetchData();
    } catch (error) { alert("Error: " + error.message); }
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
      const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), d);
      const dateStr = getSmartDateString(dateObj);
      const isSelected = getSmartDateString(selectedDate) === dateStr;
      days.push(
        <div key={d} onClick={() => setSelectedDate(dateObj)}
          style={{
             padding:8, textAlign:'center', cursor:'pointer', borderRadius:8, fontSize:13,
             background: isSelected ? '#3498db' : 'white',
             color: isSelected ? 'white' : 'black',
             border: isSelected ? 'none' : '1px solid #eee',
             fontWeight: isSelected ? 'bold' : 'normal'
          }}>{d}</div>
      );
    }
    return days;
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={styles.mainWrapper}>
        
        <div style={styles.dateHeader}>
            <div style={styles.headerFlex}>
                <div>
                    <h2 style={{margin:0}}>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
                    <p style={{margin:0, opacity:0.8, fontSize:14}}>Manajemen Ruang & Waktu Belajar</p>
                </div>
                
                <div style={styles.codeContainer}>
                    <span style={{fontSize:10, fontWeight:'bold', display:'block', marginBottom:4}}>DAILY CODE:</span>
                    {isEditingCode ? (
                        <div style={{display:'flex', gap:5}}>
                            <input value={tempCode} onChange={e => setTempCode(e.target.value)} style={styles.inputCodeEdit} />
                            <button onClick={handleSaveDailyCode} style={styles.btnSaveCode}>OK</button>
                        </div>
                    ) : (
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                            <span style={styles.codeText}>{dailyCode}</span>
                            <button onClick={()=>setIsEditingCode(true)} style={styles.btnEditCode}>✏️</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div style={styles.layoutGrid}>
            <div style={styles.leftCol}>
                <div style={styles.card}>
                    <div style={styles.calendarNav}>
                        <button style={styles.btnNav} onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>◀</button> 
                        <b style={{fontSize:14}}>{currentMonth.toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</b>
                        <button style={styles.btnNav} onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>▶</button>
                    </div>
                    <div style={styles.calendarGrid}>{renderCalendar()}</div>
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
                                <div style={{display:'flex', alignItems:'center', gap:10}}>
                                    <span style={{fontSize:18}}>🪐</span>
                                    <b style={{fontSize:15, color:'#2c3e50'}}>{planet}</b>
                                </div>
                                <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Sesi</button>
                            </div>
                            <div style={styles.itemGrid}>
                                {items.length === 0 ? (
                                    <div style={styles.emptyText}>Tidak ada jadwal</div>
                                ) : items.map(item => (
                                    <div key={item.id} style={styles.itemCard}>
                                        <div style={styles.itemTop}>
                                            <div style={styles.timeTag}>{item.start} - {item.end}</div>
                                            <span style={{...styles.badge, background: item.program === 'English' ? '#e8f8f5' : '#ebf5fb', color: item.program === 'English' ? '#16a085' : '#2980b9'}}>
                                                {item.subLevel || item.program}
                                            </span>
                                        </div>
                                        <div style={styles.itemTitle}>{item.title || "Materi Umum"}</div>
                                        <div style={styles.itemTeacher}>👨‍🏫 {item.booker}</div>
                                        <div style={styles.itemFooter}>
                                            <span>👥 {item.students?.length || 0} Siswa</span>
                                            <div style={styles.miniActions}>
                                                <button onClick={()=>handleOpenModal(planet, true, item)} style={{color:'#3498db'}}>Edit</button>
                                                <button onClick={()=>handleDelete(item.id)} style={{color:'#e74c3c'}}>Hapus</button>
                                            </div>
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
              <div style={styles.modalHeader}>
                <h3 style={{margin:0}}>{editId ? "✏️ Edit Jadwal" : "➕ Jadwal Baru"}</h3>
                <button onClick={()=>setIsModalOpen(false)} style={styles.btnX}>&times;</button>
              </div>
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                   <div style={{flex:1}}>
                       <label style={styles.label}>Mulai:</label>
                       <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} required />
                   </div>
                   <div style={{flex:1}}>
                       <label style={styles.label}>Selesai:</label>
                       <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} required />
                   </div>
                </div>
                
                <div style={styles.row}>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Program:</label>
                        <select 
                            value={formData.program} 
                            onChange={e=>{
                                const prog = e.target.value;
                                setFormData({...formData, program: prog, subLevel: subLevelOptions[prog][0]});
                            }} 
                            style={styles.select}
                        >
                            <option value="Reguler">Reguler</option>
                            <option value="English">English</option>
                        </select>
                    </div>
                    <div style={{flex:1}}>
                        <label style={styles.label}>Tingkat/Level:</label>
                        <select 
                            value={formData.subLevel} 
                            onChange={e=>setFormData({...formData, subLevel: e.target.value})} 
                            style={styles.select}
                        >
                            {subLevelOptions[formData.program].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {!editId && (
                    <div style={{marginBottom:15}}>
                        <label style={styles.label}>Perulangan:</label>
                        <select value={formData.repeat} onChange={e=>setFormData({...formData, repeat:e.target.value})} style={styles.select}>
                            <option value="Once">Satu Kali Saja</option>
                            <option value="Monthly">Rutin Mingguan (4 Minggu)</option>
                        </select>
                    </div>
                )}

                <label style={styles.label}>Guru Pengajar:</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>

                <label style={styles.label}>Materi / Judul:</label>
                <input type="text" placeholder="Contoh: Matematika - Logaritma" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />
                
                <div style={styles.studentBox}>
                    <div style={styles.studentBoxHeader}>
                        <label style={{...styles.label, marginBottom:0}}>Pilih Siswa:</label>
                        <input type="text" placeholder="Cari nama..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={styles.miniSearch} />
                    </div>
                    <div style={styles.studentList}>
                        {availableStudents
                          .filter(s => s.nama.toLowerCase().includes(filterKelas.toLowerCase()))
                          .map(s => {
                            const isSelected = formData.selectedStudents.includes(s.id);
                            return (
                                <label key={s.id} style={{...styles.studentItem, background: isSelected ? '#ebf5fb' : 'transparent'}}>
                                    <input type="checkbox" checked={isSelected} onChange={(e) => {
                                        const ids = formData.selectedStudents;
                                        if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                        else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                                    }} /> 
                                    <span style={{marginLeft:10, fontWeight: isSelected ? 'bold' : 'normal'}}>
                                        {s.nama} <small style={{color:'#7f8c8d'}}>({s.kelasSekolah || '-'})</small>
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>

                <div style={styles.modalActions}>
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
    mainWrapper: { marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', boxSizing: 'border-box' },
    dateHeader: { background: '#2c3e50', color:'white', padding:'20px 25px', borderRadius:20, marginBottom:25 },
    headerFlex: { display:'flex', justifyContent:'space-between', alignItems:'center' },
    codeContainer: { background:'rgba(255,255,255,0.1)', padding:'8px 15px', borderRadius:12, textAlign:'center', minWidth:120 },
    codeText: { fontSize:18, fontWeight:'bold', letterSpacing:1 },
    inputCodeEdit: { padding:5, borderRadius:5, border:'none', width:60, textAlign:'center', fontWeight:'bold' },
    btnSaveCode: { background:'#2ecc71', border:'none', color:'white', borderRadius:5, marginLeft:5, cursor:'pointer', padding:'2px 8px' },
    btnEditCode: { background:'none', border:'none', cursor:'pointer', fontSize:12 },
    layoutGrid: { display:'grid', gridTemplateColumns: '260px 1fr', gap: 25 },
    leftCol: { position:'sticky', top:20, height:'fit-content' },
    card: { background:'white', padding:15, borderRadius:20, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
    calendarNav: { display:'flex', justifyContent:'space-between', marginBottom:15, alignItems:'center' },
    btnNav: { background:'#f8f9fa', border:'none', padding:'5px 10px', borderRadius:8, cursor:'pointer' },
    calendarGrid: { display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:4 },
    rightCol: { display:'flex', flexDirection:'column', gap:20 },
    planetContainer: { background:'white', borderRadius:20, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
    planetHead: { background:'#f8f9fa', padding:'12px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
    btnAdd: { background:'#3498db', color:'white', border:'none', padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:'bold' },
    itemGrid: { padding:15, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:15 },
    itemCard: { background:'#fff', padding:12, borderRadius:15, border:'1px solid #f0f0f0' },
    itemTop: { display:'flex', justifyContent:'space-between', marginBottom:10 },
    timeTag: { background:'#f1f2f6', padding:'3px 8px', borderRadius:6, fontSize:11, fontWeight:'bold' },
    badge: { padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:'bold' },
    itemTitle: { fontWeight:'bold', fontSize:14, color:'#2c3e50', marginBottom:4 },
    itemTeacher: { fontSize:12, color:'#e67e22', fontWeight:'600' },
    itemFooter: { fontSize:11, color:'#7f8c8d', marginTop:10, display:'flex', justifyContent:'space-between' },
    miniActions: { display:'flex', gap:8 },
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(4px)' },
    modal: { background:'white', padding:25, borderRadius:25, width:'100%', maxWidth:500, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 40px rgba(0,0,0,0.2)' },
    modalHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
    btnX: { background:'none', border:'none', fontSize:24, cursor:'pointer', color:'#95a5a6' },
    label: { display:'block', marginBottom:6, fontSize:12, fontWeight:'bold', color:'#34495e' },
    input: { width:'100%', padding:10, marginBottom:15, border:'1px solid #ddd', borderRadius:10, boxSizing:'border-box' },
    select: { width:'100%', padding:10, marginBottom:15, border:'1px solid #ddd', borderRadius:10, boxSizing:'border-box', background:'#fff' },
    row: { display:'flex', gap:15 },
    studentBox: { background:'#f8f9fa', padding:15, borderRadius:15, border:'1px solid #eee' },
    studentBoxHeader: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
    miniSearch: { padding:'5px 10px', borderRadius:8, border:'1px solid #ddd', fontSize:12 },
    studentList: { height:180, overflowY:'auto', background:'#fff', borderRadius:10, border:'1px solid #eee' },
    studentItem: { display:'flex', alignItems:'center', padding:'10px', borderBottom:'1px solid #f9f9f9', fontSize:13, cursor:'pointer', transition:'0.2s' },
    modalActions: { marginTop:20, display:'flex', gap:10 },
    btnSave: { flex:2, padding:12, background:'#3498db', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:'bold' },
    btnCancel: { flex:1, padding:12, background:'#ecf0f1', color:'#7f8c8d', border:'none', borderRadius:10, cursor:'pointer', fontWeight:'bold' },
    emptyText: { color:'#bdc3c7', fontSize:12, textAlign:'center', padding:20, width:'100%' }
};

export default SchedulePage;