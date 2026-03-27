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
        
        // AMBIL DAILY CODE
        const todayStr = getSmartDateString(selectedDate);
        const cSnap = await getDoc(doc(db, "settings", `daily_code_${todayStr}`));
        setDailyCode(cSnap.exists() ? cSnap.data().code : "⚠️ Belum Diset");
    } catch (e) { console.error("Error fetching:", e); }
  };

  // FUNGSI BARU: GENERATE DAILY CODE JIKA BELUM ADA
  const handleGenerateCode = async () => {
    const todayStr = getSmartDateString(selectedDate);
    const newCode = `GEM-${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      await setDoc(doc(db, "settings", `daily_code_${todayStr}`), {
        code: newCode,
        date: todayStr
      });
      setDailyCode(newCode);
      alert("✅ Kode Harian Berhasil Dibuat!");
    } catch (e) { alert("Gagal set kode."); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  const handleOpenModal = (planet, isEdit = false, item = null) => {
      setActivePlanet(planet);
      setFilterJenjang("Semua");
      setFilterKelas("");
      if (isEdit && item) {
          setEditId(item.id);
          setFormData({
              start: item.start, end: item.end,
              program: item.program || "Reguler",
              level: item.level || "SD",
              title: item.title || "",
              booker: item.booker?.trim() || "", 
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
    
    const cleanTeacherName = formData.booker.trim();
    const studentsFullData = formData.selectedStudents.map(id => {
        const s = availableStudents.find(stud => stud.id === id);
        return s ? { id: s.id, nama: s.nama, kelas: s.kelasSekolah || "-" } : null;
    }).filter(Boolean);

    try {
        if (editId) {
            await updateDoc(doc(db, "jadwal_bimbel", editId), {
                start: formData.start, end: formData.end,
                program: formData.program, level: formData.level,
                title: formData.title, booker: cleanTeacherName,
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
                    start: formData.start, end: formData.end,
                    program: formData.program, level: formData.level,
                    title: formData.title, booker: cleanTeacherName,
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
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
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
             padding:8, textAlign:'center', cursor:'pointer', borderRadius:4, fontSize:13,
             background: isSelected ? '#3498db' : 'white',
             color: isSelected ? 'white' : 'black',
             border: '1px solid #f0f0f0'
          }}>{d}</div>
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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: '250px', padding: '25px', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={styles.dateHeader}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <h2 style={{margin:0}}>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
                <div style={{display:'flex', alignItems:'center', gap:15}}>
                    <div style={{background:'rgba(255,255,255,0.2)', padding:'8px 18px', borderRadius:20, fontSize:14, fontWeight:'bold', border:'1px solid white'}}>
                        DAILY CODE: {dailyCode}
                    </div>
                    {dailyCode.includes("⚠️") && (
                        <button onClick={handleGenerateCode} style={{padding:'8px 15px', borderRadius:20, border:'none', background:'#f39c12', color:'white', cursor:'pointer', fontWeight:'bold'}}>SET KODE</button>
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
                                <b style={{fontSize:15}}>🪐 RUANG {planet}</b>
                                <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Tambah Jadwal</button>
                            </div>
                            <div style={{padding:12}}>
                                {items.length === 0 ? <small style={{color:'#999'}}>Belum ada sesi belajar</small> : items.map(item => (
                                    <div key={item.id} style={styles.itemCard}>
                                        <div style={{display:'flex', justifyContent:'space-between'}}>
                                            <b style={{color:'#2980b9', fontSize:15}}>{item.start} - {item.end}</b>
                                            <span style={styles.badge}>{item.program}</span>
                                        </div>
                                        <div style={{margin:'6px 0', fontWeight:'700', color:'#2c3e50'}}>{item.title || "Materi Umum"}</div>
                                        <div style={{color:'#d35400', fontSize:13, fontWeight:'600'}}>👨‍🏫 {item.booker}</div>
                                        <div style={{fontSize:12, color:'#7f8c8d', marginTop:3}}>👥 {item.students?.length || 0} Siswa Terdaftar</div>
                                        <div style={styles.actions}>
                                            <span onClick={()=>handleOpenModal(planet, true, item)} style={{color:'#3498db', cursor:'pointer', fontWeight:'bold'}}>✏️ Edit</span>
                                            <span onClick={()=>handleDelete(item.id)} style={{color:'#e74c3c', cursor:'pointer', fontWeight:'bold'}}>🗑️ Hapus</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* MODAL JADWAL */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3 style={{marginTop:0}}>{editId ? "✏️ Perbarui Jadwal" : "➕ Jadwal Baru"}</h3>
              <p style={{fontSize:13, marginBottom:18}}>Ruangan: <b style={{color:'#2980b9'}}>{activePlanet}</b></p>
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
                                <option value="Monthly">Rutin 1 Bulan</option>
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
                <input type="text" placeholder="Contoh: Try Out UN" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />
                <div style={styles.studentBox}>
                    <div style={{display:'flex', gap:5, marginBottom:10}}>
                        <select value={filterJenjang} onChange={e=>setFilterJenjang(e.target.value)} style={styles.filterSelect}>
                            <option value="Semua">Semua</option><option value="SD">SD</option><option value="SMP">SMP</option><option value="SMA">SMA</option>
                        </select>
                        <input type="text" placeholder="Cari nama..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={styles.filterInput} />
                    </div>
                    <div style={styles.studentList}>
                        {getFilteredStudents().map(s => (
                            <label key={s.id} style={styles.studentItem}>
                                <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} onChange={(e) => {
                                    const ids = formData.selectedStudents;
                                    if(e.target.checked) setFormData({...formData, selectedStudents: [...ids, s.id]});
                                    else setFormData({...formData, selectedStudents: ids.filter(x => x !== s.id)});
                                }} /> 
                                <span style={{marginLeft:8}}>{s.nama} <small style={{color:'#999'}}>({s.kelasSekolah || '-'})</small></span>
                            </label>
                        ))}
                    </div>
                    <div style={styles.selectionCount}>Terpilih: {formData.selectedStudents.length} Siswa</div>
                </div>
                <div style={{marginTop:20, display:'flex', gap:10}}>
                    <button type="submit" style={styles.btnSave}>SIMPAN DATA</button>
                    <button type="button" onClick={()=>setIsModalOpen(false)} style={styles.btnCancel}>TUTUP</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ... STYLES TETAP SAMA SEPERTI KODE ANDA ...
const styles = {
    dateHeader: { background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color:'white', padding:'20px 25px', borderRadius:15, marginBottom:25, boxShadow:'0 4px 15px rgba(0,0,0,0.1)' },
    layoutGrid: { display:'grid', gridTemplateColumns: '320px 1fr', gap: 25 },
    leftCol: { position:'sticky', top:20, height:'fit-content' },
    rightCol: { display:'flex', flexDirection:'column', gap:20 },
    card: { background:'white', padding:20, borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,0.05)' },
    btnNav: { background:'#f5f5f5', border:'none', padding:'6px 12px', borderRadius:6, cursor:'pointer' },
    planetContainer: { background:'white', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.05)', border:'1px solid #eee' },
    planetHead: { background:'#fcfcfc', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #eee' },
    btnAdd: { background:'#2ecc71', color:'white', border:'none', padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:'bold', fontSize:12 },
    itemCard: { background:'#fff', padding:16, marginBottom:12, borderRadius:12, border:'1px solid #f0f0f0', borderLeft:'6px solid #3498db' },
    badge: { background:'#e3f2fd', color:'#1976d2', padding:'3px 10px', borderRadius:6, fontSize:11, fontWeight:'bold' },
    actions: { marginTop:12, display:'flex', gap:15, fontSize:12, borderTop:'1px solid #f5f5f5', paddingTop:10 },
    overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:999, backdropFilter:'blur(4px)' },
    modal: { background:'white', padding:30, borderRadius:20, width:480, maxHeight:'90vh', overflowY:'auto' },
    label: { display:'block', marginBottom:6, fontSize:13, fontWeight:'bold', color:'#333' },
    input: { width:'100%', padding:11, marginBottom:16, border:'1px solid #ddd', borderRadius:10, boxSizing:'border-box' },
    select: { width:'100%', padding:11, marginBottom:16, border:'1px solid #ddd', borderRadius:10, background:'#fff', boxSizing:'border-box' },
    row: { display:'flex', gap:15 },
    studentBox: { background:'#f8f9fa', padding:15, borderRadius:12, border:'1px solid #eee' },
    filterSelect: { padding:8, borderRadius:8, border:'1px solid #ddd' },
    filterInput: { flex:1, padding:8, borderRadius:8, border:'1px solid #ddd' },
    studentList: { height:180, overflowY:'auto', background:'#fff', border:'1px solid #ddd', borderRadius:8, marginTop:8 },
    studentItem: { display:'flex', alignItems:'center', padding:'10px 15px', borderBottom:'1px solid #f9f9f9', cursor:'pointer', fontSize:13 },
    selectionCount: { marginTop:10, fontSize:12, color:'#2980b9', fontWeight:'bold' },
    btnSave: { flex:2, padding:14, background:'#2980b9', color:'white', border:'none', borderRadius:10, cursor:'pointer', fontWeight:'bold' },
    btnCancel: { flex:1, padding:14, background:'#f5f5f5', color:'#666', border:'none', borderRadius:10, cursor:'pointer', fontWeight:'bold' }
  };

export default SchedulePage;