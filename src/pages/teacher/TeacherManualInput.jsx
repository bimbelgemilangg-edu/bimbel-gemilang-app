import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from "firebase/firestore";
import SidebarGuru from '../../components/SidebarGuru';

const TeacherManualInput = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Mengambil data guru dari state atau localStorage
  const [guru] = useState(() => {
    const stateGuru = location.state?.teacher;
    const localGuru = localStorage.getItem('teacherData');
    return stateGuru || (localGuru ? JSON.parse(localGuru) : null);
  });

  const [date, setDate] = useState("");
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!date) return alert("Silakan pilih tanggal terlebih dahulu!");
    if (!guru?.nama) return alert("Data pengajar tidak ditemukan. Silakan login ulang.");
    
    setLoading(true);
    try {
        // Query berdasarkan tanggal dan nama guru (booker) sesuai struktur admin
        const q = query(
            collection(db, "jadwal_bimbel"), 
            where("dateStr", "==", date), 
            where("booker", "==", guru.nama)
        );
        const snap = await getDocs(q);
        setSchedules(snap.docs.map(d => ({id: d.id, ...d.data()})));
        
        if (snap.empty) {
            alert("Tidak ada jadwal ditemukan untuk Anda pada tanggal tersebut.");
        }
    } catch (e) { 
        console.error("Search Error:", e);
        alert("Gagal memuat jadwal.");
    } finally { 
        setLoading(false); 
    }
  };

  const handleSubmit = async (sched, activityType) => {
    if(!window.confirm(`Konfirmasi Klaim Susulan: ${activityType}?\nData ini akan dikirim ke Admin untuk divalidasi.`)) return;
    
    try {
        // 1. Ambil Aturan Gaji dari Global Config
        const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
        const configData = settingsSnap.exists() ? settingsSnap.data() : {};
        const rules = configData.salaryRules || { honorSD: 35000, honorSMP: 40000 };

        // 2. Hitung Durasi Jam
        const startParts = sched.start.split(':');
        const endParts = sched.end.split(':');
        const startTime = new Date(0, 0, 0, startParts[0], startParts[1]);
        const endTime = new Date(0, 0, 0, endParts[0], endParts[1]);
        
        let diffHours = (endTime - startTime) / 36e5;
        if (diffHours < 0) diffHours = 0; // Validasi jika jam salah input

        // 3. Tentukan Nominal (Hanya tersimpan di DB, tidak tampil di UI Guru)
        let base = parseInt(rules.honorSD);
        const identifier = (sched.title + (sched.level || "")).toLowerCase();
        if(identifier.includes('smp')) base = parseInt(rules.honorSMP);
        
        let nominal = base * diffHours;
        if (activityType === 'Ujian') nominal = 15000; // Flat rate ujian jika ada

        // 4. Simpan Log ke Firebase
        await addDoc(collection(db, "teacher_logs"), {
            teacherId: guru.id,
            namaGuru: guru.nama,
            tanggal: date,
            waktu: new Date().toLocaleTimeString('id-ID'),
            jadwalId: sched.id,
            program: sched.program,
            kegiatan: activityType,
            detail: `${sched.program} - ${sched.title || 'Materi Umum'} (KLAIM SUSULAN)`,
            siswaHadir: sched.students?.length || 0, // Mengambil jumlah siswa asli dari jadwal
            durasiJam: diffHours,
            nominal: nominal, // Tetap disimpan untuk keperluan penggajian Admin
            status: "Menunggu Validasi",
            createdAt: new Date()
        });

        alert("✅ Klaim absensi berhasil disimpan. Silakan cek status di menu Riwayat.");
        navigate('/guru/history');
    } catch (e) { 
        console.error("Submit Error:", e);
        alert("Gagal menyimpan klaim: " + e.message); 
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f7f6' }}>
      <SidebarGuru />
      <div style={{ marginLeft: '250px', width: 'calc(100% - 250px)', padding: '40px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', padding: 35, borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
                <span style={{ fontSize: 40 }}>📝</span>
                <h2 style={{ color: '#2c3e50', margin: '10px 0 5px 0' }}>Klaim Absen Susulan</h2>
                <p style={{ fontSize: 13, color: '#7f8c8d', lineHeight: '1.5' }}>
                    Gunakan fitur ini jika Anda terlewat melakukan absensi pada jadwal yang sudah lewat.
                </p>
            </div>

            <div style={{ marginBottom: 25, display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, fontWeight: 'bold', display: 'block', marginBottom: 5, color: '#34495e' }}>Tanggal Jadwal:</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        style={{ width: '100%', padding: '12px', border: '1px solid #dfe6e9', borderRadius: 10, boxSizing: 'border-box', outline: 'none' }} 
                    />
                </div>
                <button 
                    onClick={handleSearch} 
                    style={{ alignSelf: 'flex-end', padding: '12px 25px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', transition: '0.3s' }}
                    onMouseOver={(e) => e.target.style.background = '#34495e'}
                    onMouseOut={(e) => e.target.style.background = '#2c3e50'}
                >
                    {loading ? "Mencari..." : "Cari Jadwal"}
                </button>
            </div>

            <div style={{ borderTop: '1px solid #eee', paddingTop: 20 }}>
                {schedules.length > 0 ? (
                    schedules.map(item => (
                        <div key={item.id} style={{ background: '#f8f9fa', padding: 20, borderRadius: 15, marginBottom: 15, border: '1px solid #f1f2f6' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                <span style={{ background: '#dfe6e9', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 'bold' }}>{item.start} - {item.end}</span>
                                <span style={{ fontSize: 11, color: '#2980b9', fontWeight: 'bold' }}>{item.program}</span>
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, fontSize: 15 }}>{item.title || "Materi Umum"}</div>
                            
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button 
                                    onClick={() => handleSubmit(item, 'Mengajar')} 
                                    style={{ flex: 1, padding: '10px', background: '#27ae60', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
                                >
                                    Hadir (Mengajar)
                                </button>
                                <button 
                                    onClick={() => handleSubmit(item, 'Ujian')} 
                                    style={{ flex: 1, padding: '10px', background: '#f39c12', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 12 }}
                                >
                                    Hadir (Ujian)
                                </button>
                            </div>
                        </div>
                    ))
                ) : !loading && date && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#bdc3c7', fontSize: 14 }}>
                        Belum ada jadwal yang ditampilkan.
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherManualInput;