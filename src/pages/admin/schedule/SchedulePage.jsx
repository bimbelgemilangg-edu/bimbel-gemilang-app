import React, { useState, useEffect } from 'react';
import SidebarAdmin from '../../../components/SidebarAdmin'; 
import { db } from '../../../firebase'; 
import { collection, getDocs, deleteDoc, doc, getDoc, writeBatch, updateDoc, setDoc } from "firebase/firestore";

const SchedulePage = () => {
  // State Management
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]); 
  const [availableStudents, setAvailableStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
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
  const [filterKelas, setFilterKelas] = useState(""); 

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];

  const getSmartDateString = (dateObj) => {
    if (!(dateObj instanceof Date)) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
        // Gunakan try-catch di setiap fetch untuk mencegah crash total
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
    } catch (e) { 
        console.error("Firebase Fetch Error:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, [selectedDate]);

  // Handler functions tetap dipertahankan sesuai logika fitur sebelumnya
  const handleOpenModal = (planet, isEdit = false, item = null) => {
      setActivePlanet(planet);
      if (isEdit && item) {
          setEditId(item.id);
          setFormData({
              start: item.start || "14:00", 
              end: item.end || "15:30",
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
    try {
        const studentsFullData = formData.selectedStudents.map(id => {
            const s = availableStudents.find(stud => stud.id === id);
            return s ? { id: s.id, nama: s.nama, kelas: s.kelasSekolah || "-" } : null;
        }).filter(Boolean);

        if (editId) {
            await updateDoc(doc(db, "jadwal_bimbel", editId), {
                ...formData,
                students: studentsFullData,
                updatedAt: new Date()
            });
        } else {
            const batch = writeBatch(db);
            let tempDate = new Date(selectedDate);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
            
            for (let i = 0; i < loopCount; i++) {
                const newRef = doc(collection(db, "jadwal_bimbel"));
                batch.set(newRef, {
                    ...formData,
                    planet: activePlanet,
                    dateStr: getSmartDateString(tempDate),
                    students: studentsFullData,
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
    } catch (error) { 
        alert("Gagal menyimpan: " + error.message); 
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
             padding:8, textAlign:'center', cursor:'pointer', borderRadius:8, fontSize:12,
             background: isSelected ? '#3498db' : 'white',
             color: isSelected ? 'white' : 'black',
             border: isSelected ? 'none' : '1px solid #eee'
          }}>{d}</div>
      );
    }
    return days;
  };

  if (loading && schedules.length === 0) {
      return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh'}}>Memuat Data...</div>;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: '250px', padding: '30px', width: 'calc(100% - 250px)', boxSizing: 'border-box' }}>
        
        {/* Header Section */}
        <div style={styles.dateHeader}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:15}}>
                <div>
                    <h2 style={{margin:0, color:'white'}}>📅 {selectedDate.toLocaleDateString('id-ID', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</h2>
                </div>
                <div style={styles.codeContainer}>
                    <span style={{fontSize:11, color:'white', opacity:0.8}}>KODE ABSENSI:</span>
                    <div style={{display:'flex', alignItems:'center', gap:10}}>
                        <span style={{fontSize:18, fontWeight:'bold', color:'white'}}>{dailyCode}</span>
                        <button onClick={()=>setIsEditingCode(true)} style={styles.btnEditCode}>Edit</button>
                    </div>
                </div>
            </div>
        </div>

        <div style={styles.layoutGrid}>
            {/* Sidebar Kalender */}
            <div style={styles.leftCol}>
                <div style={styles.card}>
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:15}}>
                        <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>◀</button>
                        <b style={{fontSize:14}}>{currentMonth.toLocaleDateString('id-ID', {month:'long', year:'numeric'})}</b>
                        <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>▶</button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:5}}>{renderCalendar()}</div>
                </div>
            </div>

            {/* List Ruangan */}
            <div style={styles.rightCol}>
                {PLANETS.map(planet => {
                    const dateStr = getSmartDateString(selectedDate);
                    const items = schedules.filter(s => s.planet === planet && s.dateStr === dateStr);
                    return (
                        <div key={planet} style={styles.planetContainer}>
                            <div style={styles.planetHead}>
                                <b>🪐 RUANG {planet}</b>
                                <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Tambah</button>
                            </div>
                            <div style={{padding:15, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:15}}>
                                {items.length === 0 ? <small style={{color:'#ccc'}}>Tidak ada jadwal</small> : items.map(item => (
                                    <div key={item.id} style={styles.itemCard}>
                                        <div style={{fontSize:12, fontWeight:'bold'}}>{item.start} - {item.end}</div>
                                        <div style={{fontSize:14, margin:'5px 0'}}>{item.title || "Materi Umum"}</div>
                                        <div style={{fontSize:12, color:'#e67e22'}}>Guru: {item.booker}</div>
                                        <div style={{marginTop:10, display:'flex', justifyContent:'space-between'}}>
                                            <button onClick={()=>handleOpenModal(planet, true, item)} style={{fontSize:11, color:'#3498db', border:'none', background:'none', cursor:'pointer'}}>Edit</button>
                                            <button onClick={async () => { if(window.confirm("Hapus?")) { await deleteDoc(doc(db, "jadwal_bimbel", item.id)); fetchData(); } }} style={{fontSize:11, color:'#e74c3c', border:'none', background:'none', cursor:'pointer'}}>Hapus</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Modal dengan perbaikan tampilan laptop */}
        {isModalOpen && (
          <div style={styles.overlay}>
            <div style={styles.modal}>
              <h3 style={{marginTop:0}}>{editId ? "Edit Sesi" : "Sesi Baru"} - Ruang {activePlanet}</h3>
              <form onSubmit={handleSave}>
                <div style={styles.row}>
                    <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.input} required />
                    <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.input} required />
                </div>
                <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={styles.select}>
                    <option value="Reguler">Reguler</option>
                    <option value="English">English</option>
                </select>
                <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={styles.select}>
                    <option value="">-- Pilih Guru --</option>
                    {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                </select>
                <input type="text" placeholder="Materi" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.input} />
                
                <div style={styles.studentBox}>
                    <input type="text" placeholder="Cari siswa..." value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={styles.filterInput} />
                    <div style={styles.studentList}>
                        {availableStudents.filter(s => s.nama.toLowerCase().includes(filterKelas.toLowerCase())).map(s => (
                            <label key={s.id} style={styles.studentItem}>
                                <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} onChange={(e) => {
                                    const ids = formData.selectedStudents;
                                    setFormData({...formData, selectedStudents: e.target.checked ? [...ids, s.id] : ids.filter(x => x !== s.id)});
                                }} /> 
                                <span style={{marginLeft:10}}>{s.nama}</span>
                            </label>
                        ))}
                    </div>
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

// Styles dioptimasi untuk Laptop & Responsivitas
const styles = {
    dateHeader: { background: '#2c3e50', padding: 20, borderRadius: 15, marginBottom: 20 },
    codeContainer: { background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: 10 },
    btnEditCode: { background: '#3498db', color: 'white', border: 'none', padding: '4px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 11 },
    layoutGrid: { display: 'grid', gridTemplateColumns: '250px 1fr', gap: 20 },
    leftCol: { position: 'sticky', top: 20 },
    rightCol: { display: 'flex', flexDirection: 'column', gap: 20 },
    card: { background: 'white', padding: 15, borderRadius: 15, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    planetContainer: { background: 'white', borderRadius: 15, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    planetHead: { background: '#f8f9fa', padding: '10px 15px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee' },
    btnAdd: { background: '#3498db', color: 'white', border: 'none', padding: '5px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 12 },
    itemCard: { background: '#fdfdfd', padding: 12, borderRadius: 10, border: '1px solid #f0f0f0' },
    overlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 3000 },
    modal: { background: 'white', padding: 25, borderRadius: 20, width: '90%', maxWidth: '450px', maxHeight: '90vh', overflowY: 'auto' },
    input: { width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd', boxSizing: 'border-box' },
    select: { width: '100%', padding: 10, marginBottom: 10, borderRadius: 8, border: '1px solid #ddd' },
    row: { display: 'flex', gap: 10 },
    studentBox: { background: '#f8f9fa', padding: 10, borderRadius: 10 },
    filterInput: { width: '100%', padding: 8, marginBottom: 10, borderRadius: 5, border: '1px solid #ddd' },
    studentList: { maxHeight: '150px', overflowY: 'auto', background: 'white', padding: 5, borderRadius: 5 },
    studentItem: { display: 'flex', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #eee', cursor: 'pointer' },
    btnSave: { flex: 2, padding: 12, background: '#2ecc71', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer' },
    btnCancel: { flex: 1, padding: 12, background: '#95a5a6', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer' }
};

export default SchedulePage;