import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc } from "firebase/firestore";

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);

  // Toggle Absen (Merah/Hijau)
  const toggleStudent = (studentId) => {
    setAttendanceMap(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleFinishClass = async () => {
    if (!window.confirm("Selesai kelas? Gaji akan dihitung otomatis sesuai aturan.")) return;
    
    setLoading(true);
    try {
      // 1. HITUNG JUMLAH SISWA HADIR
      const siswaHadirList = schedule.students.filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;

      // 2. HITUNG DURASI (Berdasarkan Jadwal Admin)
      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const startDate = new Date(0, 0, 0, startParts[0], startParts[1], 0);
      const endDate = new Date(0, 0, 0, endParts[0], endParts[1], 0);
      const diffHours = (endDate - startDate) / 1000 / 60 / 60; // Contoh: 1.5 Jam

      // 3. AMBIL SETTING GAJI TERBARU
      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      let rules = { 
          honorSD: 35000, honorSMP: 40000, honorSMA: 50000, bonusInggris: 10000, 
          ujianSoal: 10000, ujianJaga: 10000, ujianPaket: 15000 
      };
      
      if (settingsSnap.exists()) {
        rules = { ...rules, ...settingsSnap.data().salaryRules };
      }

      let nominal = 0;
      // Ambil Aktivitas NYATA yang dipilih Guru di Popup Dashboard tadi
      // Jika tidak ada (fallback), ambil default "Mengajar"
      const realActivity = schedule.actualActivity || "Mengajar"; 
      
      let detailTxt = `${schedule.program} - ${schedule.title} (${realActivity})`;
      let statusGaji = "Menunggu Validasi";

      // --- SMART LOGIC V3 (SINKRON DENGAN POPUP) ---

      // SKENARIO 1: ENGLISH (SELALU FLAT/RATE KHUSUS)
      if (schedule.program === "English") {
          const base = parseInt(rules.honorSD) + parseInt(rules.bonusInggris);
          nominal = base * diffHours; // Atau Flat Paket, tergantung kebijakan
          detailTxt += " [English Rate]";
      }
      
      // SKENARIO 2: UJIAN (Berdasarkan Pilihan Guru di Popup)
      else if (realActivity === "Ujian" || realActivity === "Buat Soal") {
          // Cek judul juga untuk deteksi "Paket"
          const titleLower = schedule.title.toLowerCase();
          
          if (realActivity === "Ujian" && titleLower.includes("paket")) {
             nominal = parseInt(rules.ujianPaket || 15000);
             detailTxt += " [Bundling Paket]";
          } 
          else if (realActivity === "Buat Soal") {
             nominal = parseInt(rules.ujianSoal || 10000);
             detailTxt += " [Hanya Buat Soal]";
          } 
          else {
             nominal = parseInt(rules.ujianJaga || 10000);
             detailTxt += " [Hanya Jaga]";
          }
      }

      // SKENARIO 3: MENGAJAR REGULER (Rate x Jam)
      else {
          // A. Tentukan Rate Dasar
          let baseRate = parseInt(rules.honorSD); // Default
          
          // Deteksi Jenjang dari Judul/Level Jadwal
          const levelInfo = (schedule.level || "") + " " + (schedule.title || "");
          if (levelInfo.toLowerCase().includes("smp") || levelInfo.toLowerCase().includes("9")) {
              baseRate = parseInt(rules.honorSMP);
          } else if (levelInfo.toLowerCase().includes("sma") || levelInfo.toLowerCase().includes("10")) {
              baseRate = parseInt(rules.honorSMA);
          }

          // B. Cek Kehadiran (Logika Kompensasi)
          if (jumlahHadir === 0) {
            // SISWA KOSONG = KOMPENSASI 50%
            const gajiFull = baseRate * diffHours;
            nominal = gajiFull * 0.5; 
            
            detailTxt += " [0 Siswa - Kompensasi 50%]";
            statusGaji = "Kompensasi";
          } else {
            // NORMAL (ADA SISWA) -> Full Rate x Jam
            nominal = baseRate * diffHours;
          }
      }

      // 4. SIMPAN KE FIREBASE
      // Cek apakah ini Guru Pengganti?
      const finalTeacherName = schedule.actualTeacher || teacher.nama;

      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id,
        namaGuru: finalTeacherName, // Nama Guru yang Mengerjakan
        tanggal: new Date().toISOString().split('T')[0],
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id,
        program: schedule.program,
        kegiatan: realActivity, // Simpan aktivitas aslinya
        detail: detailTxt,
        siswaHadir: jumlahHadir,
        siswaAbsenList: schedule.students.filter(s => !attendanceMap[s.id]),
        durasiJam: diffHours,
        nominal: Math.round(nominal), 
        status: statusGaji
      });

      alert(`✅ Kelas Selesai! Gaji terhitung: Rp ${Math.round(nominal).toLocaleString('id-ID')}`);
      onBack();

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
        
        {/* HEADER */}
        <div style={{borderBottom:'1px solid #eee', paddingBottom:15, marginBottom:15}}>
          <h2 style={{margin:0, color:'#2c3e50'}}>Sedang Mengajar 👨‍🏫</h2>
          <p style={{margin:'5px 0', color:'#7f8c8d'}}>{schedule.start} - {schedule.end}</p>
          
          {/* LABEL AKTIVITAS */}
          <div style={{background:'#e1f5fe', color:'#0277bd', padding:10, borderRadius:5, marginTop:10, fontSize:13}}>
            <strong>Mode:</strong> {schedule.actualActivity || "Mengajar"} <br/>
            <strong>Materi:</strong> {schedule.title}
          </div>
        </div>

        {/* ABSENSI */}
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
                  background: isPresent ? '#27ae60' : '#e74c3c',
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

        <button 
          onClick={handleFinishClass} 
          disabled={loading}
          style={{width:'100%', padding:15, background:'#2c3e50', color:'white', border:'none', borderRadius:5, fontWeight:'bold', fontSize:16, cursor:'pointer'}}
        >
          {loading ? "Menghitung Gaji..." : "SELESAI KELAS & SIMPAN"}
        </button>
        
        <button onClick={onBack} style={{width:'100%', marginTop:10, padding:10, background:'transparent', border:'none', cursor:'pointer', color:'#888'}}>Batal</button>
      </div>
    </div>
  );
};

export default ClassSession;