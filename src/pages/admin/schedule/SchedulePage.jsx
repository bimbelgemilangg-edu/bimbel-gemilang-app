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
  const [loading, setLoading] = useState(true);
  
  const [dailyCode, setDailyCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activePlanet, setActivePlanet] = useState("");
  const [editId, setEditId] = useState(null); 

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewMode, setViewMode] = useState('daily');

  const [searchTerm, setSearchTerm] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");

  const defaultForm = {
    start: "14:00", end: "15:30", 
    program: "Reguler", 
    level: "SD",
    title: "", 
    mapel: "", // ➕ FIELD MAPEL
    booker: "", 
    teacherId: "", // ➕ FIELD TEACHER ID
    selectedStudents: [],
    repeat: "Once"
  };
  const [formData, setFormData] = useState(defaultForm);

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const LIST_KELAS = ["Semua", "1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD", "7 SMP", "8 SMP", "9 SMP", "10 SMA", "11 SMA", "12 SMA", "Alumni", "Umum"];
  const LEVELS = ["SD", "SMP", "SMA", "Umum"];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getSmartDateString = (dateObj) => {
    if (!(dateObj instanceof Date)) return "";
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getWeekDates = (currDate) => {
    const dates = [];
    const current = new Date(currDate);
    const first = current.getDate() - current.getDay() + 1; 
    const startOfWeek = new Date(current.setDate(first));
    for (let i = 0; i < 7; i++) {
        const nextDate = new Date(startOfWeek);
        nextDate.setDate(startOfWeek.getDate() + i);
        dates.push(getSmartDateString(nextDate));
    }
    return dates;
  };

  const fetchData = async () => {
    setLoading(true);
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
    } catch (e) { console.error("Firebase Fetch Error:", e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

  // ➕ Saat pilih guru, auto-set mapel
  const handleTeacherChange = (teacherName) => {
    const teacher = availableTeachers.find(t => t.nama === teacherName);
    setFormData({
      ...formData, 
      booker: teacherName,
      teacherId: teacher?.id || "", // ➕ Simpan teacherId
      mapel: teacher?.mapel || ""   // ➕ Auto-set mapel dari guru
    });
  };

  const handleOpenModal = (planet, isEdit = false, item = null) => {
      setActivePlanet(planet);
      setSearchTerm("");
      setFilterKelas("Semua");
      if (isEdit && item) {
          setEditId(item.id);
          setFormData({
              start: item.start || "14:00", 
              end: item.end || "15:30",
              program: item.program || "Reguler",
              level: item.level || "SD",
              title: item.title || "",
              mapel: item.mapel || "", // ➕ Load mapel
              booker: item.booker || "", 
              teacherId: item.teacherId || "", // ➕ Load teacherId
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
    if (!formData.booker) return alert("❌ Pilih guru terlebih dahulu!");
    
    try {
        const studentsFullData = formData.selectedStudents.map(id => {
            const s = availableStudents.find(stud => stud.id === id);
            return s ? { 
              id: s.id, 
              nama: s.nama, 
              kelas: s.kelasSekolah || "-",
              program: s.detailProgram || formData.program || "Reguler",
              kelasSekolah: s.kelasSekolah || "-"
            } : null;
        }).filter(Boolean);

        const scheduleData = {
            ...formData,
            level: formData.level,
            mapel: formData.mapel, // ➕ SIMPAN MAPEL
            teacherId: formData.teacherId, // ➕ SIMPAN TEACHER ID
            students: studentsFullData,
            updatedAt: new Date()
        };

        if (editId) {
            await updateDoc(doc(db, "jadwal_bimbel", editId), scheduleData);
        } else {
            const batch = writeBatch(db);
            let tempDate = new Date(selectedDate);
            const loopCount = formData.repeat === 'Monthly' ? 4 : 1;
            
            for (let i = 0; i < loopCount; i++) {
                const newRef = doc(collection(db, "jadwal_bimbel"));
                batch.set(newRef, {
                    ...scheduleData,
                    planet: activePlanet,
                    dateStr: getSmartDateString(tempDate),
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
    } catch (error) { alert("Gagal menyimpan: " + error.message); }
  };

  const handleUpdateCode = async () => {
    try {
        const todayStr = getSmartDateString(selectedDate);
        await setDoc(doc(db, "settings", `daily_code_${todayStr}`), {
            code: tempCode,
            updatedAt: new Date()
        });
        setDailyCode(tempCode);
        setIsEditingCode(false);
    } catch (error) { alert("Gagal update kode: " + error.message); }
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
             padding:10, textAlign:'center', cursor:'pointer', borderRadius:8, fontSize:isMobile ? 14 : 12,
             background: isSelected ? '#3498db' : 'white', color: isSelected ? 'white' : '#333',
             border: isSelected ? 'none' : '1px solid #eee', fontWeight: isSelected ? 'bold' : 'normal'
          }}>{d}</div>
      );
    }
    return days;
  };

  const renderDailyView = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {PLANETS.map(planet => {
                const dateStr = getSmartDateString(selectedDate);
                const items = schedules.filter(s => s.planet === planet && s.dateStr === dateStr);
                return (
                    <div key={planet} style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #eee' }}>
                        <div style={{ background: '#f8f9fa', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
                            <b style={{ color: '#2c3e50', fontSize: isMobile ? 14 : 16 }}>🪐 RUANG {planet}</b>
                            <button onClick={() => handleOpenModal(planet)} style={styles.btnAdd}>+ Tambah Sesi</button>
                        </div>
                        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15 }}>
                            {items.length === 0 ? <small style={{ color: '#aaa', fontStyle: 'italic' }}>Tidak ada jadwal</small> : items.map(item => (
                                <div key={item.id} style={styles.scheduleCard}>
                                    <div style={styles.scheduleTop}>
                                        <span style={styles.timeBadge}>⏰ {item.start} - {item.end}</span>
                                        <span style={{...styles.programBadge, color: item.program === 'English' ? '#e74c3c' : '#2ecc71'}}>{item.program}</span>
                                    </div>
                                    <div style={styles.scheduleTitle}>{item.title || "Materi Umum"}</div>
                                    {/* ➕ TAMPILKAN MAPEL */}
                                    {item.mapel && <div style={{fontSize:11, color:'#4f46e5', fontWeight:600, marginBottom:4}}>📘 {item.mapel}</div>}
                                    <div style={styles.scheduleInfo}>
                                        <div>👨‍🏫 <b>{item.booker}</b></div>
                                        <div>📚 {item.level || "SD"} | 👥 {item.students ? item.students.length : 0} Siswa</div>
                                    </div>
                                    <div style={styles.scheduleActions}>
                                        <button onClick={()=>handleOpenModal(planet, true, item)} style={styles.btnEdit}>✏️ EDIT</button>
                                        <button onClick={async () => { if(window.confirm("Hapus jadwal ini?")) { await deleteDoc(doc(db, "jadwal_bimbel", item.id)); fetchData(); } }} style={styles.btnDelete}>🗑️ HAPUS</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
  };

  const renderWeeklyView = () => {
    const weekDates = getWeekDates(selectedDate);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {weekDates.map(dateStr => {
            const dateObj = new Date(dateStr);
            const dayName = DAYS_ID[dateObj.getDay()];
            const items = schedules.filter(s => s.dateStr === dateStr);
            return (
                <div key={dateStr} style={{ background: 'white', borderRadius: 12, padding: 15, border: '1px solid #ddd' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: 5, display:'inline-block' }}>{dayName}, {dateStr}</h4>
                    {items.length === 0 ? <div style={{ fontSize: 13, color: '#999' }}>Tidak ada jadwal</div> : (
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
                            {items.map(item => (
                                <div key={item.id} style={{ background: '#f8f9fa', padding: 12, borderRadius: 8, borderLeft: `4px solid ${item.program === 'English' ? '#e74c3c' : '#2ecc71'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'bold', fontSize: 13 }}>{item.start} - {item.end}</span>
                                        <span style={{ fontSize: 11, background: '#e1e8ed', padding: '2px 8px', borderRadius: 10 }}>🪐 {item.planet}</span>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: '600' }}>{item.title || "Materi Umum"}</div>
                                    {item.mapel && <div style={{fontSize:11, color:'#4f46e5', fontWeight:600}}>📘 {item.mapel}</div>}
                                    <div style={{ fontSize: 12, color: '#e67e22' }}>👨‍🏫 {item.booker} | 📚 {item.level || "SD"}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarAdmin />
      <div style={{ marginLeft: isMobile ? '0' : '250px', padding: isMobile ? '15px' : '30px', width: isMobile ? '100%' : 'calc(100% - 250px)', boxSizing: 'border-box' }}>
        
        <div style={{ background: '#2c3e50', padding: 20, borderRadius: 15, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
                <div>
                    <h2 style={{ margin: 0, color: 'white' }}>📅 {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                    <p style={{ margin: '5px 0 0', color: '#bdc3c7', fontSize: 13 }}>Manajemen Jadwal & Booking Harian</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>KODE ABSENSI:</span>
                    {isEditingCode ? (
                        <div style={{ display: 'flex', gap: 5 }}>
                            <input value={tempCode} onChange={e=>setTempCode(e.target.value)} style={{ width: 80, padding: '6px', borderRadius: 4, textAlign: 'center' }} />
                            <button onClick={handleUpdateCode} style={{ background: '#2ecc71', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 5 }}>OK</button>
                        </div>
                    ) : (
                        <>
                            <span style={{ fontSize: 20, fontWeight: '900', color: '#f1c40f' }}>{dailyCode}</span>
                            <button onClick={()=>setIsEditingCode(true)} style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 5, fontSize: 12 }}>Edit</button>
                        </>
                    )}
                </div>
            </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setViewMode('daily')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', fontWeight: 'bold', background: viewMode === 'daily' ? '#3498db' : '#e0e6ed', color: viewMode === 'daily' ? 'white' : '#7f8c8d' }}>📝 Jadwal Hari Ini</button>
            <button onClick={() => setViewMode('weekly')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', fontWeight: 'bold', background: viewMode === 'weekly' ? '#3498db' : '#e0e6ed', color: viewMode === 'weekly' ? 'white' : '#7f8c8d' }}>🗓️ Rekap Sepekan</button>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20 }}>
            <div style={{ width: isMobile ? '100%' : '300px', flexShrink: 0 }}>
                <div style={{ background: 'white', padding: 20, borderRadius: 15, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                        <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} style={{ background: 'none', border: 'none' }}>◀</button>
                        <b style={{ fontSize: 15 }}>{currentMonth.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</b>
                        <button onClick={()=>setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} style={{ background: 'none', border: 'none' }}>▶</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>{renderCalendar()}</div>
                </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                {viewMode === 'daily' ? renderDailyView() : renderWeeklyView()}
            </div>
        </div>

        {/* MODAL */}
        {isModalOpen && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent(isMobile)}>
              <div style={styles.modalHeader}>
                  <h3 style={{ margin: 0 }}>{editId ? "✏️ Edit Sesi" : "✨ Sesi Baru"} - Ruang {activePlanet}</h3>
                  <button onClick={()=>setIsModalOpen(false)} style={styles.modalClose}>&times;</button>
              </div>
              
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.labelSm}>Jam Mulai</label>
                        <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={styles.inputSm} required />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.labelSm}>Jam Selesai</label>
                        <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={styles.inputSm} required />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ flex: 1 }}>
                        <label style={styles.labelSm}>Program</label>
                        <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={styles.inputSm}>
                            <option value="Reguler">📚 Reguler</option>
                            <option value="English">🗣️ English</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={styles.labelSm}>Jenjang</label>
                        <select value={formData.level} onChange={e=>setFormData({...formData, level:e.target.value})} style={styles.inputSm}>
                            {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                {/* ➕ PILIH GURU → AUTO MAPEL */}
                <div>
                    <label style={styles.labelSm}>Guru</label>
                    <select required value={formData.booker} onChange={e => handleTeacherChange(e.target.value)} style={styles.inputSm}>
                        <option value="">-- Pilih Guru --</option>
                        {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama} {t.mapel ? `(${t.mapel})` : ''}</option>)}
                    </select>
                    {/* ➕ TAMPILKAN MAPEL AUTO */}
                    {formData.mapel && (
                      <div style={{marginTop:4, fontSize:10, color:'#4f46e5', fontWeight:600}}>
                        📘 Mapel: {formData.mapel}
                      </div>
                    )}
                </div>

                <div>
                    <label style={styles.labelSm}>Materi / Deskripsi</label>
                    <input type="text" placeholder="Contoh: Matematika Pecahan Kelas 4" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={styles.inputSm} />
                </div>
                
                <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 12, border: '1px solid #eee' }}>
                    <label style={styles.labelSm}>👥 Assign Siswa ({formData.selectedStudents.length} Dipilih)</label>
                    {/* ➕ INFO: Hanya siswa yang sesuai jenjang */}
                    <p style={{fontSize:9, color:'#94a3b8', marginTop:2}}>
                      Menampilkan siswa {formData.level !== 'Umum' ? `jenjang ${formData.level}` : 'semua jenjang'}
                      {formData.mapel ? ` yang mengikuti mapel ${formData.mapel}` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10, marginTop: 8 }}>
                        <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }}>
                            {LIST_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <input type="text" placeholder="Cari nama..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ flex: 2, padding: '8px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }} />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '5px', borderRadius: 8, border: '1px solid #eee' }}>
                        {availableStudents
                          .filter(s => {
                            // ➕ Filter by jenjang
                            if (formData.level !== 'Umum') {
                              const siswaJenjang = s.kelasSekolah?.includes(formData.level) || 
                                                   s.jenjang === formData.level;
                              if (!siswaJenjang) return false;
                            }
                            // ➕ Filter by mapel (jika siswa punya field mapel)
                            if (formData.mapel && s.mapel?.length > 0) {
                              if (!s.mapel.includes(formData.mapel)) return false;
                            }
                            const matchNama = s.nama.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchKelas = filterKelas === "Semua" || s.kelasSekolah === filterKelas;
                            return matchNama && matchKelas;
                          })
                          .map(s => (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f8f9fa', cursor: 'pointer', gap: 12 }}>
                                <input type="checkbox" checked={formData.selectedStudents.includes(s.id)} onChange={(e) => {
                                    const ids = formData.selectedStudents;
                                    setFormData({...formData, selectedStudents: e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id)});
                                }} style={{ width: 18, height: 18, cursor: 'pointer' }} /> 
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <div>
                                      <span style={{ fontSize: 13, fontWeight: '500' }}>{s.nama}</span>
                                      {/* ➕ Tampilkan mapel siswa */}
                                      {s.mapel?.length > 0 && (
                                        <div style={{fontSize:8, color:'#4f46e5'}}>
                                          {s.mapel.slice(0,3).join(', ')}
                                          {s.mapel.length > 3 ? '...' : ''}
                                        </div>
                                      )}
                                    </div>
                                    <span style={{ fontSize: 10, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 10, fontWeight: 'bold' }}>{s.kelasSekolah || "-"}</span>
                                </div>
                            </label>
                        ))}
                        {availableStudents.filter(s => {
                          if (formData.level !== 'Umum') {
                            const siswaJenjang = s.kelasSekolah?.includes(formData.level) || s.jenjang === formData.level;
                            if (!siswaJenjang) return false;
                          }
                          if (formData.mapel && s.mapel?.length > 0) {
                            if (!s.mapel.includes(formData.mapel)) return false;
                          }
                          return true;
                        }).length === 0 && (
                          <div style={{textAlign:'center', padding:20, color:'#94a3b8', fontSize:12}}>
                            Tidak ada siswa ditemukan untuk filter ini
                          </div>
                        )}
                    </div>
                </div>

                {!editId && (
                    <div>
                        <label style={styles.labelSm}>Pengulangan</label>
                        <select value={formData.repeat} onChange={e=>setFormData({...formData, repeat:e.target.value})} style={styles.inputSm}>
                            <option value="Once">1x Pertemuan Saja</option>
                            <option value="Monthly">Otomatis 4 Pekan (1 Bulan)</option>
                        </select>
                    </div>
                )}

                <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
                    <button type="button" onClick={()=>setIsModalOpen(false)} style={{ flex: 1, padding: 14, background: '#f1f5f9', border: 'none', borderRadius: 10, fontWeight: 'bold' }}>BATAL</button>
                    <button type="submit" style={{ flex: 2, padding: 14, background: '#2c3e50', color: 'white', border: 'none', borderRadius: 10, fontWeight: 'bold' }}>💾 SIMPAN JADWAL</button>
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
  btnAdd: { background: '#3498db', color: 'white', border: 'none', padding: '6px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' },
  scheduleCard: { background: '#fff', padding: 15, borderRadius: 10, border: '1px solid #e1e8ed', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  scheduleTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 },
  timeBadge: { fontSize: 13, fontWeight: '900', color: '#2c3e50', background: '#ecf0f1', padding: '3px 8px', borderRadius: 6 },
  programBadge: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  scheduleTitle: { fontSize: 15, fontWeight: 'bold', margin: '8px 0', color: '#34495e' },
  scheduleInfo: { display: 'flex', gap: 5, flexDirection: 'column', fontSize: 13, color: '#7f8c8d' },
  scheduleActions: { marginTop: 15, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #eee', paddingTop: 10 },
  btnEdit: { flex: 1, fontSize: 12, color: '#3498db', border: 'none', background: '#ebf5fb', padding: '8px', borderRadius: '6px 0 0 6px', cursor: 'pointer', fontWeight: 'bold' },
  btnDelete: { flex: 1, fontSize: 12, color: '#e74c3c', border: 'none', background: '#fdedec', padding: '8px', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', zIndex: 9999 },
  modalContent: (m) => ({ background: 'white', padding: 25, borderRadius: m ? '20px 20px 0 0' : '20px', width: '100%', maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }),
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 },
  modalClose: { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#e74c3c' },
  labelSm: { fontSize: 12, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5, display: 'block' },
  inputSm: { width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 14, boxSizing: 'border-box' },
};

export default SchedulePage;