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

  // State untuk Filter Siswa di Modal
  const [searchTerm, setSearchTerm] = useState("");
  const [filterKelas, setFilterKelas] = useState("Semua");

  const defaultForm = {
    start: "14:00", end: "15:30", 
    program: "Reguler", level: "SD",
    title: "", booker: "", selectedStudents: [],
    repeat: "Once"
  };
  const [formData, setFormData] = useState(defaultForm);

  const PLANETS = ["MERKURIUS", "VENUS", "BUMI", "MARS", "JUPITER"];
  const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const LIST_KELAS = ["Semua", "1 SD", "2 SD", "3 SD", "4 SD", "5 SD", "6 SD", "7 SMP", "8 SMP", "9 SMP", "10 SMA", "11 SMA", "12 SMA", "Alumni", "Umum"];

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
    } catch (e) { 
        console.error("Firebase Fetch Error:", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedDate]);

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
                            <button onClick={() => handleOpenModal(planet)} style={{ background: '#3498db', color: 'white', border: 'none', padding: '6px 15px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>+ Tambah Sesi</button>
                        </div>
                        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 15 }}>
                            {items.length === 0 ? <small style={{ color: '#aaa', fontStyle: 'italic' }}>Tidak ada jadwal di ruangan ini</small> : items.map(item => (
                                <div key={item.id} style={{ background: '#fff', padding: 15, borderRadius: 10, border: '1px solid #e1e8ed', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', paddingBottom: 8, marginBottom: 8 }}>
                                        <span style={{ fontSize: 13, fontWeight: '900', color: '#2c3e50', background: '#ecf0f1', padding: '3px 8px', borderRadius: 6 }}>⏰ {item.start} - {item.end}</span>
                                        <span style={{ fontSize: 10, fontWeight: 'bold', color: item.program === 'English' ? '#e74c3c' : '#2ecc71', textTransform: 'uppercase' }}>{item.program}</span>
                                    </div>
                                    <div style={{ fontSize: 15, fontWeight: 'bold', margin: '8px 0', color: '#34495e' }}>{item.title || "Materi Umum"}</div>
                                    <div style={{ display: 'flex', gap: 5, flexDirection: 'column' }}>
                                        <div style={{ fontSize: 13, color: '#e67e22', display: 'flex', alignItems: 'center', gap: 5 }}>👨‍🏫 <b>{item.booker}</b></div>
                                        <div style={{ fontSize: 12, color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: 5 }}>👥 {item.students ? item.students.length : 0} Siswa Terdaftar</div>
                                    </div>
                                    <div style={{ marginTop: 15, display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #eee', paddingTop: 10 }}>
                                        <button onClick={()=>handleOpenModal(planet, true, item)} style={{ flex: 1, fontSize: 12, color: '#3498db', border: 'none', background: '#ebf5fb', padding: '8px', borderRadius: '6px 0 0 6px', cursor: 'pointer', fontWeight: 'bold' }}>EDIT</button>
                                        <div style={{ width: 1, background: '#eee' }}></div>
                                        <button onClick={async () => { if(window.confirm("Hapus jadwal ini permanen?")) { await deleteDoc(doc(db, "jadwal_bimbel", item.id)); fetchData(); } }} style={{ flex: 1, fontSize: 12, color: '#e74c3c', border: 'none', background: '#fdedec', padding: '8px', borderRadius: '0 6px 6px 0', cursor: 'pointer', fontWeight: 'bold' }}>HAPUS</button>
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
                                    <div style={{ fontSize: 12, color: '#e67e22' }}>👨‍🏫 {item.booker}</div>
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
        
        {/* Header Section */}
        <div style={{ background: '#2c3e50', padding: 20, borderRadius: 15, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
                <div>
                    <h2 style={{ margin: 0, color: 'white' }}>📅 {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
                    <p style={{ margin: '5px 0 0', color: '#bdc3c7', fontSize: 13 }}>Manajemen Jadwal & Booking Harian</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <span style={{ fontSize: 12, color: 'white', fontWeight: 'bold' }}>KODE ABSENSI:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
        </div>

        {/* View Switcher */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <button onClick={() => setViewMode('daily')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', fontWeight: 'bold', background: viewMode === 'daily' ? '#3498db' : '#e0e6ed', color: viewMode === 'daily' ? 'white' : '#7f8c8d' }}>📝 Jadwal Hari Ini</button>
            <button onClick={() => setViewMode('weekly')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', fontWeight: 'bold', background: viewMode === 'weekly' ? '#3498db' : '#e0e6ed', color: viewMode === 'weekly' ? 'white' : '#7f8c8d' }}>🗓️ Rekap Sepekan</button>
        </div>

        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 20 }}>
            {/* Sidebar Calendar */}
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

            {/* Main Content Area */}
            <div style={{ flex: 1, minWidth: 0 }}>
                {viewMode === 'daily' ? renderDailyView() : renderWeeklyView()}
            </div>
        </div>

        {/* --- MODAL TAMBAH/EDIT SESI --- */}
        {isModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: isMobile ? 'flex-end' : 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', padding: 25, borderRadius: isMobile ? '20px 20px 0 0' : '20px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
                  <h3 style={{ margin: 0 }}>{editId ? "✏️ Edit Sesi" : "✨ Sesi Baru"} - Ruang {activePlanet}</h3>
                  <button onClick={()=>setIsModalOpen(false)} style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#e74c3c' }}>&times;</button>
              </div>
              
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                {/* Waktu Sesi */}
                <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Jam Mulai</label>
                        <input type="time" value={formData.start} onChange={e=>setFormData({...formData, start:e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }} required />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Jam Selesai</label>
                        <input type="time" value={formData.end} onChange={e=>setFormData({...formData, end:e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }} required />
                    </div>
                </div>

                {/* Program & Guru */}
                <div style={{ display: 'flex', gap: 15 }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Program</label>
                        <select value={formData.program} onChange={e=>setFormData({...formData, program:e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}>
                            <option value="Reguler">📚 Reguler</option>
                            <option value="English">🗣️ English</option>
                        </select>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Guru</label>
                        <select required value={formData.booker} onChange={e => setFormData({...formData, booker: e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}>
                            <option value="">-- Pilih Guru --</option>
                            {availableTeachers.map(t => <option key={t.id} value={t.nama}>{t.nama}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Materi / Deskripsi</label>
                    <input type="text" placeholder="Contoh: Matematika Pecahan Kelas 4" value={formData.title} onChange={e=>setFormData({...formData, title:e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }} />
                </div>
                
                {/* --- BAGIAN ASSIGN SISWA (REVISED) --- */}
                <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 12, border: '1px solid #eee' }}>
                    <label style={{ fontSize: 12, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10, display: 'block' }}>👥 Assign Siswa ({formData.selectedStudents.length} Dipilih)</label>
                    
                    {/* Filter Section */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                        <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }}>
                            {LIST_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                        <input type="text" placeholder="Cari nama..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} style={{ flex: 2, padding: '8px', borderRadius: 8, border: '1px solid #ddd', fontSize: 12 }} />
                    </div>

                    {/* Vertical List Siswa (Anti-Seret) */}
                    <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '5px', borderRadius: 8, border: '1px solid #eee' }}>
                        {availableStudents
                          .filter(s => {
                            const matchNama = s.nama.toLowerCase().includes(searchTerm.toLowerCase());
                            const matchKelas = filterKelas === "Semua" || s.kelasSekolah === filterKelas;
                            return matchNama && matchKelas;
                          })
                          .map(s => (
                            <label key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f8f9fa', cursor: 'pointer', gap: 12 }}>
                                <input 
                                    type="checkbox" 
                                    checked={formData.selectedStudents.includes(s.id)} 
                                    onChange={(e) => {
                                        const ids = formData.selectedStudents;
                                        setFormData({...formData, selectedStudents: e.target.checked ? [...ids, s.id] : ids.filter(id => id !== s.id)});
                                    }} 
                                    style={{ width: 18, height: 18, cursor: 'pointer' }} 
                                /> 
                                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontSize: 13, fontWeight: '500' }}>{s.nama}</span>
                                    <span style={{ fontSize: 10, color: '#4f46e5', background: '#eef2ff', padding: '2px 8px', borderRadius: 10, fontWeight: 'bold' }}>{s.kelasSekolah || "-"}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {!editId && (
                    <div>
                        <label style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Pengulangan</label>
                        <select value={formData.repeat} onChange={e=>setFormData({...formData, repeat:e.target.value})} style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd' }}>
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

export default SchedulePage;