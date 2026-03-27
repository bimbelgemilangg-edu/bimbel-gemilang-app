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
  
  // State untuk Daily Code
  const [dailyCode, setDailyCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState("");

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
        
        // AMBIL DAILY CODE BERDASARKAN TANGGAL TERPILIH
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

  // FUNGSI SIMPAN/EDIT DAILY CODE (ADMIN CUSTOM)
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
              level: item.level || "SD",
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
        if (editId) {
            await updateDoc(doc(db, "jadwal_bimbel", editId), {
                start: formData.start, end: formData.end,
                program: formData.program, level: formData.level,
                title: formData.title, booker: formData.booker,
                students: studentsFullData
            });
        } else {
            const batch = writeBatch(db);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
            let tempDate = new Date(selectedDate);
            for (let i = 0; i < loopCount; i++) {
                const curDateStr = getSmartDateString(tempDate);
                const newRef = doc(collection(db, "jadwal_bimbel"));
                batch.set(newRef, {
                    planet: activePlanet,
                    dateStr: curDateStr, 
                    start: formData.start, end: formData.end,
                    program: formData.program,
                    title: formData.title, booker: formData.booker,
                    students: studentsFullData,
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
      <div style={{ marginLeft: '250px', padding: '30px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* HEADER DENGAN EDIT DAILY CODE */}
        <div style={styles.dateHeader}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                    <h2 style={{margin:0}}>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
                    <p style={{margin:0, opacity:0.8, fontSize:14}}>Manajemen Ruang & Waktu Belajar</p>
                </div>
                
                <div style={styles.codeContainer}>
                    <span style={{fontSize:12, fontWeight:'bold', display:'block', marginBottom:4}}>ABSENSI CODE:</span>
                    {isEditingCode ? (
                        <div style={{display:'flex', gap:5}}>
                            <input 
                                value={tempCode} 
                                onChange={e => setTempCode(e.target.value)} 
                                style={styles.inputCodeEdit} 
                                placeholder="Contoh: GEM01"
                            />
                            <button onClick={handleSaveDailyCode} style={styles.btnSaveCode}>OK</button>
                            <button onClick={()=>setIsEditingCode(false)} style={styles.btnCancelCode}>X</button>
                        </div>
                    ) : (
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                            <span style={{fontSize:20, fontWeight:'900', letterSpacing:1}}>{dailyCode}</span>
                            <button onClick={()=>setIsEditingCode(true)} style={styles.btnEditCode}>✏️ Edit Kode</button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div style={styles.layoutGrid}>
            <div style={styles.leftCol}>
                <div style={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:15, alignItems:'center'}}>
                        <button style={styles.btnNav} onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>◀</button> 
                        <b style={{fontSize:15}}>{currentMonth.toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</b>
                        <button style={styles.btnNav} onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>▶</button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6}}>{renderCalendar()}</div>
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
                                    <span style={{fontSize:20}}>🪐</span>
                                    <b style={{fontSize:16, color:'#2c3e50'}}>RUANG {planet}</b>
                                </div>
                                <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Tambah Sesi</button>
                            </div>
                            <div style={{padding:15, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:15}}>
                                {items.length === 0 ? (
                                    <div style={{color:'#bdc3c7', fontSize:13, padding:10, border:'1px dashed #ccc', borderRadius:10, textAlign:'center'}}>Kosong</div>
                                ) : items.map(item => (
                                    <div key={item.id} style={styles.itemCard}>
                                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10}}>
                                            <div style={styles.timeTag}>{item.start} - {item.end}</div>
                                            <span style={{...styles.badge, background: item.program === 'English' ? '#e8f8f5' : '#ebf5fb', color: item.program === 'English' ? '#16a085' : '#2980b9'}}>
                                                {item.program}
                                            </span>
                                        </div>
                                        <div style={{fontWeight:'bold', color:'#2c3e50', marginBottom:5}}>{item.title || "Materi Umum"}</div>
                                        <div style={{fontSize:13, color:'#e67e22', fontWeight:'600'}}>👨‍🏫 Guru: {item.booker}</div>
                                        <div style={{fontSize:12, color:'#7f8c8d', marginTop:8, display:'flex', alignItems:'center', gap:5}}>
                                            <span>👥 {item.students?.length || 0} Siswa</span>
                                            <span style={{color:'#ddd'}}>|</span>
                                            <div style={styles.miniActions}>
                                                <button onClick={()=>handleOpenModal(planet, true, item)} style={{color:'#3498db', border:'none', background:'none', cursor:'pointer', padding:0}}>Edit</button>
                                                <button onClick={()=>handleDelete(item.id)} style={{color:'#e74c3c', border:'none', background:'none', cursor:'pointer', padding:0}}>Hapus</button>
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

        {/* MODAL FORM TETAP SAMA NAMUN DENGAN UI LEBIH CLEAN */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                <h3 style={{margin:0}}>{editId ? "✏️ Perbarui Jadwal" : "➕ Jadwal Baru"}</h3>
                <span style={{fontSize:12, background:'#f0f0f0', padding:'4px 10px', borderRadius:20}}>Ruang {activePlanet}</span>
              </div>
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                   <div style={{flex:1}}>
                       <label style={styles.label}>Jam Mulai:</label>
                       <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} required />
                   </div>
                   <div style={{flex:1}}>
                       <label style={styles.label}>Jam Selesai:</label>
                       <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} required />
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
                                <option value="Once">Hari Ini Saja</option>
                                <option value="Monthly">Rutin 1 Bulan (4x)</option>
                            </select>
                         </div>
                    )}
                </div>
                <label style={styles.label}>Guru Pengajar:</label>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>
                <label style={styles.label}>Judul/Materi:</label>
                <input type="text" placeholder="Contoh: Matematika - Aljabar" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />
                
                <div style={styles.studentBox}>
                    <div style={{display:'flex', gap:5, marginBottom:10}}>
                        <input type="text" placeholder="Cari Siswa..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={styles.filterInput} />
                    </div>
                    <div style={styles.studentList}>
                        {availableStudents.filter(s => s.nama.toLowerCase().includes(filterKelas.toLowerCase())).map(s => (
                            <label key={s.id} style={styles.studentItem}>
                                <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} onChange={(e) => {
                                    const ids = formData.selectedStudents;
                                    if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                    else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                                }} /> 
                                <span style={{marginLeft:8}}>{s.nama} <small>({s.kelasSekolah})</small></span>
                            </label>
                        ))}
                    </div>
                </div>

                <div style={{marginTop:25, display:'flex', gap:10}}>
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
    dateHeader: { background: '#2c3e50', color:'white', padding:'25px', borderRadius:20, marginBottom:25, boxShadow:'0 8px 20px rgba(0,0,0,0.1)' },
    codeContainer: { background:'rgba(255,255,255,0.1)', padding:'10px 20px', borderRadius:15, border:'1px solid rgba(255,255,255,0.2)', textAlign:'center' },
    inputCodeEdit: { padding:8, borderRadius:8, border:'none', width:100, fontWeight:'bold', textAlign:'center' },
    btnSaveCode: { background:'#2ecc71', color:'white', border:'none', borderRadius:8, padding:'0 10px', cursor:'pointer' },
    btnCancelCode: { background:'#e74c3c', color:'white', border:'none', borderRadius:8, padding:'0 10px', cursor:'pointer' },
    btnEditCode: { background:'rgba(255,255,255,0.2)', border:'none', color:'white', fontSize:11, padding:'4px 8px', borderRadius:5, cursor:'pointer', marginLeft:10 },
    layoutGrid: { display:'grid', gridTemplateColumns: '300px 1fr', gap: 25 },
    leftCol: { position:'sticky', top:20, height:'fit-content' },
    rightCol: { display:'flex', flexDirection:'column', gap:25 },
    card: { background:'white', padding:20, borderRadius:20, boxShadow:'0 4px 12px rgba(0,0,0,0.05)' },
    btnNav: { background:'#f8f9fa', border:'none', padding:'8px 15px', borderRadius:10, cursor:'pointer' },
    planetContainer: { background:'white', borderRadius:20, overflow:'hidden', boxShadow:'0 4px 12px rgba(0,0,0,0.05)' },
    planetHead: { background:'#f8f9fa', padding:'15px 25px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee' },
    btnAdd: { background:'#3498db', color:'white', border:'none', padding:'8px 16px', borderRadius:10, cursor:'pointer', fontWeight:'bold', fontSize:12 },
    itemCard: { background:'#fff', padding:15, borderRadius:15, border:'1px solid #f0f0f0', transition:'0.3s' },
    timeTag: { background:'#f1f2f6', color:'#2c3e50', padding:'4px 10px', borderRadius:8, fontSize:12, fontWeight:'bold' },
    badge: { padding:'3px 10px', borderRadius:8, fontSize:11, fontWeight:'bold' },
    miniActions: { display:'flex', gap:10, marginLeft:5 },
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:1000, backdropFilter:'blur(5px)' },
    modal: { background:'white', padding:30, borderRadius:25, width:500, maxHeight:'90vh', overflowY:'auto' },
    label: { display:'block', marginBottom:8, fontSize:13, fontWeight:'bold', color:'#34495e' },
    input: { width:'100%', padding:12, marginBottom:15, border:'1px solid #ecf0f1', borderRadius:12, boxSizing:'border-box', background:'#fbfcfc' },
    select: { width:'100%', padding:12, marginBottom:15, border:'1px solid #ecf0f1', borderRadius:12, background:'#fbfcfc', boxSizing:'border-box' },
    row: { display:'flex', gap:15 },
    studentBox: { background:'#f8f9fa', padding:15, borderRadius:15, marginTop:10 },
    filterInput: { width:'100%', padding:10, borderRadius:10, border:'1px solid #ddd', marginBottom:10 },
    studentList: { height:150, overflowY:'auto', background:'#fff', borderRadius:10, border:'1px solid #eee' },
    studentItem: { display:'flex', alignItems:'center', padding:'8px 12px', borderBottom:'1px solid #f9f9f9', fontSize:13, cursor:'pointer' },
    btnSave: { flex:2, padding:15, background:'#3498db', color:'white', border:'none', borderRadius:12, cursor:'pointer', fontWeight:'bold' },
    btnCancel: { flex:1, padding:15, background:'#f1f2f6', color:'#7f8c8d', border:'none', borderRadius:12, cursor:'pointer', fontWeight:'bold' }
};

export default SchedulePage;