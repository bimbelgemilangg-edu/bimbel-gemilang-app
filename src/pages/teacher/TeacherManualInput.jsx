import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";

const TeacherManualInput = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const guru = location.state?.teacher;

  const [date, setDate] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  // CARI JADWAL PADA TANGGAL YANG DIPILIH
  const handleSearch = async () => {
    if (!date) return alert("Pilih tanggal dulu!");
    setLoading(true);
    try {
        // Cari jadwal guru ini di tanggal tersebut
        const q = query(collection(db, "jadwal_bimbel"), 
            where("dateStr", "==", date),
            where("booker", "==", guru.nama)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({id: d.id, ...d.data()}));
        setSchedules(data);
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // KLAIM / SUBMIT REVISI
  const handleSubmit = async (sched, activityType) => {
    if(!window.confirm(`Yakin input data susulan untuk: ${activityType}?`)) return;

    // AMBIL DATA GAJI
    const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
    let rules = settingsSnap.exists() ? settingsSnap.data().salaryRules : {};

    // HITUNG DURASI
    const startParts = sched.start.split(':');
    const endParts = sched.end.split(':');
    const diffHours = (new Date(0,0,0,endParts[0],endParts[1]) - new Date(0,0,0,startParts[0],startParts[1])) / 36e5;

    let nominal = 0;
    
    // HITUNG NOMINAL SESUAI TIPE
    if(sched.program === 'English') {
        nominal = (parseInt(rules.honorSD || 35000) + parseInt(rules.bonusInggris || 10000)) * diffHours;
    } else if (activityType === 'Ujian') {
        nominal = parseInt(rules.ujianPaket || 15000);
    } else if (activityType === 'Buat Soal') {
        nominal = parseInt(rules.ujianSoal || 10000);
    } else {
        // Mengajar Reguler
        let base = parseInt(rules.honorSD || 35000);
        if((sched.title + sched.level).toLowerCase().includes('smp')) base = parseInt(rules.honorSMP || 40000);
        if((sched.title + sched.level).toLowerCase().includes('sma')) base = parseInt(rules.honorSMA || 50000);
        nominal = base * diffHours;
    }

    // SIMPAN LOG
    await addDoc(collection(db, "teacher_logs"), {
        teacherId: guru.id,
        namaGuru: guru.nama,
        tanggal: date, // Pakai tanggal yang dipilih (masa lalu)
        waktu: new Date().toLocaleTimeString(),
        jadwalId: sched.id,
        program: sched.program,
        kegiatan: activityType,
        detail: `${sched.program} - ${sched.title} (SUSULAN/REVISI)`,
        siswaHadir: 1, // Default dianggap hadir karena susulan
        durasiJam: diffHours,
        nominal: nominal,
        status: "Menunggu Validasi"
    });

    alert("✅ Data Susulan Berhasil Disimpan! Silakan lapor Admin.");
    navigate('/guru/dashboard', {state:{teacher:guru}});
  };

  return (
    <div style={{padding:20, maxWidth:500, margin:'0 auto', fontFamily:'sans-serif'}}>
        <h2 style={{color:'#c0392b'}}>📝 Absen Susulan / Revisi</h2>
        <p style={{fontSize:13, color:'#555'}}>Gunakan fitur ini JIKA data Anda dihapus Admin karena salah input, atau lupa absen.</p>
        
        <div style={{marginBottom:20}}>
            <label>Pilih Tanggal yang Terlewat:</label>
            <div style={{display:'flex', gap:10, marginTop:5}}>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{flex:1, padding:10, border:'1px solid #ccc'}} />
                <button onClick={handleSearch} style={{padding:'10px 20px', background:'#2c3e50', color:'white', border:'none', borderRadius:5}}>Cari Jadwal</button>
            </div>
        </div>

        {loading && <p>Mencari...</p>}

        {schedules.map(item => (
            <div key={item.id} style={{background:'white', padding:15, borderRadius:8, boxShadow:'0 2px 5px rgba(0,0,0,0.1)', marginBottom:15}}>
                <div style={{fontWeight:'bold'}}>{item.start} - {item.end}</div>
                <div>{item.title} ({item.program})</div>
                
                <div style={{marginTop:10, display:'flex', flexDirection:'column', gap:5}}>
                    <button onClick={()=>handleSubmit(item, 'Mengajar')} style={{padding:8, background:'#27ae60', color:'white', border:'none', borderRadius:4}}>
                        Klaim sbg Mengajar
                    </button>
                    <button onClick={()=>handleSubmit(item, 'Ujian')} style={{padding:8, background:'#f39c12', color:'white', border:'none', borderRadius:4}}>
                        Klaim sbg Ujian/Paket
                    </button>
                </div>
            </div>
        ))}

        {date && schedules.length === 0 && !loading && <p style={{color:'#999', textAlign:'center'}}>Tidak ada jadwal Anda di tanggal ini.</p>}

        <button onClick={()=>navigate('/guru/dashboard', {state:{teacher:guru}})} style={{marginTop:20, width:'100%', padding:10, background:'transparent', border:'1px solid #ccc'}}>Kembali</button>
    </div>
  );
};

export default TeacherManualInput;