import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru';

const TeacherManualInput = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guru = location.state?.teacher || JSON.parse(localStorage.getItem('teacherData'));

  const [date, setDate] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!date) return alert("Pilih tanggal dulu!");
    setLoading(true);
    try {
        const q = query(collection(db, "jadwal_bimbel"), where("dateStr", "==", date), where("booker", "==", guru.nama));
        const snap = await getDocs(q);
        setSchedules(snap.docs.map(d => ({id: d.id, ...d.data()})));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSubmit = async (sched, activityType) => {
    if(!window.confirm(`Yakin klaim susulan: ${activityType}?`)) return;
    try {
        const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
        let rules = settingsSnap.exists() ? settingsSnap.data().salaryRules : { honorSD: 35000, honorSMP: 40000 };

        const startParts = sched.start.split(':');
        const endParts = sched.end.split(':');
        const diffHours = (new Date(0,0,0,endParts[0],endParts[1]) - new Date(0,0,0,startParts[0],startParts[1])) / 36e5;

        let base = parseInt(rules.honorSD);
        if((sched.title + sched.level).toLowerCase().includes('smp')) base = parseInt(rules.honorSMP);
        
        let nominal = base * diffHours;
        if (activityType === 'Ujian') nominal = 15000;

        await addDoc(collection(db, "teacher_logs"), {
            teacherId: guru.id,
            namaGuru: guru.nama,
            tanggal: date,
            waktu: new Date().toLocaleTimeString(),
            jadwalId: sched.id,
            program: sched.program,
            kegiatan: activityType,
            detail: `${sched.program} - ${sched.title} (SUSULAN)`,
            siswaHadir: 1, 
            durasiJam: diffHours,
            nominal: nominal,
            status: "Menunggu Validasi"
        });

        alert("✅ Berhasil disimpan!");
        navigate('/guru/dashboard');
    } catch (e) { alert("Gagal: " + e.message); }
  };

  return (
    <div style={{ display: 'flex' }}>
      <SidebarGuru />
      <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', padding: '40px', background: '#f4f7f6', minHeight: '100vh' }}>
        <div style={{maxWidth:500, margin:'0 auto', background:'white', padding:30, borderRadius:15, boxShadow:'0 4px 10px rgba(0,0,0,0.05)'}}>
            <h2 style={{color:'#c0392b', marginTop:0}}>📝 Klaim Absen Susulan</h2>
            <p style={{fontSize:13, color:'#7f8c8d'}}>Gunakan ini jika lupa klik "Selesai" pada hari H.</p>
            <div style={{marginBottom:20, display:'flex', gap:10}}>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{flex:1, padding:10, border:'1px solid #ccc', borderRadius:5}} />
                <button onClick={handleSearch} style={{padding:'10px 20px', background:'#2c3e50', color:'white', border:'none', borderRadius:5, cursor:'pointer'}}>Cari Jadwal</button>
            </div>
            {loading && <p>Mencari...</p>}
            {schedules.map(item => (
                <div key={item.id} style={{background:'#f9f9f9', padding:15, borderRadius:8, marginBottom:10, border:'1px solid #eee'}}>
                    <div style={{fontWeight:'bold'}}>{item.start} - {item.end} | {item.title}</div>
                    <div style={{marginTop:10, display:'flex', gap:5}}>
                        <button onClick={()=>handleSubmit(item, 'Mengajar')} style={{flex:1, padding:8, background:'#27ae60', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>Hadir (Mengajar)</button>
                        <button onClick={()=>handleSubmit(item, 'Ujian')} style={{flex:1, padding:8, background:'#f39c12', color:'white', border:'none', borderRadius:4, cursor:'pointer'}}>Hadir (Ujian)</button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default TeacherManualInput;