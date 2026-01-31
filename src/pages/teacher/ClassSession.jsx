import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

const ClassSession = ({ schedule, teacher, onBack }) => {
  // Default: Semua siswa statusnya FALSE (Merah/Tidak Hadir)
  // Kita ambil daftar siswa dari jadwal yang dibuat Admin
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);

  // Fungsi Toggle: Klik Merah jadi Hijau, Klik Hijau jadi Merah
  const toggleStudent = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId] // Balik status
    }));
  };

  const handleFinishClass = async () => {
    if (!window.confirm("Selesai kelas? Data akan dikirim ke Admin.")) return;
    
    setLoading(true);
    try {
      // 1. HITUNG SISWA HADIR
      // Kita hitung berapa id yang nilainya true
      const siswaHadirList = schedule.students.filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;

      // 2. HITUNG GAJI (SMART LOGIC: FIXED SCHEDULE)
      // Kita ambil durasi dari JADWAL ADMIN, bukan jam sekarang.
      // Format jam admin biasanya "14:00" dan "15:30". Kita hitung selisihnya.
      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const startDate = new Date(0, 0, 0, startParts[0], startParts[1], 0);
      const endDate = new Date(0, 0, 0, endParts[0], endParts[1], 0);
      const diffHours = (endDate - startDate) / 1000 / 60 / 60; // Durasi dalam Jam (Desimal)

      // 3. AMBIL SETTING GAJI TERBARU
      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      const rules = settingsSnap.data().salaryRules;

      let nominal = 0;
      let detailTxt = `${schedule.type} - ${schedule.title}`;

      // LOGIKA GAJI (Sama seperti sebelumnya, tapi durasi TERKUNCI dari jadwal)
      if (jumlahHadir === 0) {
        nominal = parseInt(rules.transport);
        detailTxt += " (0 Siswa - Transport Only)";
      } else {
         // Cek Tipe Kelas dari Jadwal Admin
         if (schedule.type === "English") {
            // Asumsi English Flat Rate atau hitungan khusus
            const base = parseInt(rules.honorSD) + parseInt(rules.bonusInggris); // Contoh logika
            nominal = base * diffHours; 
         } else {
            // Reguler
            // Asumsi SD/SMP ambil dari data siswa atau jadwal. Kita default SD dulu atau ambil dr jadwal
            let rate = parseInt(rules.honorSD); // Default
            if (schedule.title.toLowerCase().includes("smp")) rate = parseInt(rules.honorSMP);
            if (schedule.title.toLowerCase().includes("sma")) rate = parseInt(rules.honorSMA);
            
            nominal = (rate * diffHours) + parseInt(rules.transport);
         }
      }

      // 4. SIMPAN LAPORAN KE SERVER
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id,
        namaGuru: teacher.nama,
        tanggal: new Date().toISOString().split('T')[0],
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id, // Referensi ke jadwal asli
        program: schedule.type, // Reguler / English
        detail: detailTxt,
        siswaHadir: jumlahHadir,
        siswaAbsenList: schedule.students.filter(s => !attendanceMap[s.id]), // Kirim data siapa yang GA MASUK ke Admin
        durasiJam: diffHours, // DURASI INI SESUAI JADWAL ADMIN
        nominal: nominal,
        status: "Menunggu Validasi"
      });

      alert("✅ Kelas Selesai! Data terkirim ke Admin.");
      onBack(); // Kembali ke dashboard jadwal

    } catch (error) {
      console.error(error);
      alert("Gagal menyimpan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{padding: 20, maxWidth: 600, margin: '0 auto'}}>
      <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        
        {/* HEADER KELAS */}
        <div style={{borderBottom:'1px solid #eee', paddingBottom:15, marginBottom:15}}>
          <h2 style={{margin:0, color:'#2c3e50'}}>Sedang Mengajar 👨‍🏫</h2>
          <p style={{margin:'5px 0', color:'#7f8c8d'}}>{schedule.planet} | {schedule.start} - {schedule.end}</p>
          <div style={{background:'#e1f5fe', color:'#0277bd', padding:10, borderRadius:5, marginTop:10, fontSize:13}}>
            <strong>Info:</strong> Materi: {schedule.title}. <br/>
            Durasi Gaji terhitung otomatis: <strong>{schedule.start} - {schedule.end}</strong>.
          </div>
        </div>

        {/* ABSENSI SISWA (MERAH / HIJAU) */}
        <h4 style={{marginBottom:10}}>Absensi Siswa:</h4>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
          {schedule.students.map(siswa => {
            const isPresent = attendanceMap[siswa.id];
            return (
              <div 
                key={siswa.id} 
                onClick={() => toggleStudent(siswa.id)}
                style={{
                  padding: 15, 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: 'white',
                  transition: '0.2s',
                  background: isPresent ? '#27ae60' : '#e74c3c', // HIJAU atau MERAH
                  border: isPresent ? '2px solid #2ecc71' : '2px solid #c0392b'
                }}
              >
                {siswa.nama}
                <div style={{fontSize:11, fontWeight:'normal', marginTop:5}}>
                  {isPresent ? "🟢 HADIR" : "🔴 TIDAK"}
                </div>
              </div>
            );
          })}
        </div>
        
        <small style={{display:'block', marginBottom:20, color:'#999', textAlign:'center'}}>
          *Klik nama siswa untuk mengubah status hadir/tidak.
        </small>

        {/* TOMBOL AKSI */}
        <button 
          onClick={handleFinishClass} 
          disabled={loading}
          style={{width:'100%', padding:15, background:'#2c3e50', color:'white', border:'none', borderRadius:5, fontWeight:'bold', fontSize:16, cursor:'pointer'}}
        >
          {loading ? "Menyimpan..." : "SELESAI KELAS & SIMPAN"}
        </button>
        
        <button 
          onClick={onBack}
          style={{width:'100%', marginTop:10, padding:10, background:'transparent', color:'#7f8c8d', border:'none', cursor:'pointer'}}
        >
          Batal / Kembali
        </button>

      </div>
    </div>
  );
};

export default ClassSession;