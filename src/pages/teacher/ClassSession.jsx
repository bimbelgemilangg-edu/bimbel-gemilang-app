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
        // Gabungkan default dengan setting dari database (jaga-jaga admin belum update setting baru)
        rules = { ...rules, ...settingsSnap.data().salaryRules };
      }

      let nominal = 0;
      let detailTxt = `${schedule.type} - ${schedule.title}`;
      let statusGaji = "Menunggu Validasi";

      // --- SMART LOGIC V2: EXAM BUNDLING & COMPENSATION ---

      // SKENARIO 1: UJIAN (Fixed Rate / Flat)
      if (schedule.type === "Ujian" || schedule.title.toLowerCase().includes("ujian")) {
          const titleLower = schedule.title.toLowerCase();
          
          // Logika Deteksi Paket Ujian
          if (titleLower.includes("paket") || (titleLower.includes("soal") && titleLower.includes("jaga"))) {
              // Paket Lengkap (Buat + Jaga)
              nominal = parseInt(rules.ujianPaket || 15000);
              detailTxt += " (Bundling: Soal + Jaga)";
          } else if (titleLower.includes("soal")) {
              // Cuma Buat Soal
              nominal = parseInt(rules.ujianSoal || 10000);
              detailTxt += " (Hanya Buat Soal)";
          } else {
              // Default: Anggap Jaga Ujian saja
              nominal = parseInt(rules.ujianJaga || 10000);
              detailTxt += " (Hanya Jaga Ujian)";
          }
          // Note: Ujian biasanya flat, tidak dikali jam. Tapi kalau mau dikali jam, ubah logika di sini.

      } 
      // SKENARIO 2: KELAS MENGAJAR (Variable Rate x Jam)
      else {
          // A. Tentukan Rate Dasar
          let baseRate = 0;
          if (schedule.type === "English") {
             baseRate = parseInt(rules.honorSD) + parseInt(rules.bonusInggris);
          } else {
             if (schedule.title.toLowerCase().includes("smp") || schedule.title.toLowerCase().includes("9")) {
                baseRate = parseInt(rules.honorSMP);
             } else if (schedule.title.toLowerCase().includes("sma") || schedule.title.toLowerCase().includes("10")) {
                baseRate = parseInt(rules.honorSMA);
             } else {
                baseRate = parseInt(rules.honorSD);
             }
          }

          // B. Cek Kehadiran (Logika Kompensasi)
          if (jumlahHadir === 0) {
            // SISWA KOSONG = KOMPENSASI 50%
            // Rumus: (Rate x Jam) * 50%
            // Tidak ada uang transport tambahan (sesuai request)
            const gajiFull = baseRate * diffHours;
            nominal = gajiFull * 0.5; 
            
            detailTxt += " (0 Siswa - Kompensasi 50%)";
            statusGaji = "Kompensasi";
          } else {
            // NORMAL (ADA SISWA)
            // Rumus: (Rate x Jam)
            // Murni honor mengajar, tanpa tambahan transport
            nominal = baseRate * diffHours;
          }
      }

      // 4. SIMPAN KE FIREBASE
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id,
        namaGuru: teacher.nama,
        tanggal: new Date().toISOString().split('T')[0],
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id,
        program: schedule.type,
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
          <div style={{background:'#e1f5fe', color:'#0277bd', padding:10, borderRadius:5, marginTop:10, fontSize:13}}>
            <strong>Info:</strong> Materi: {schedule.title}. <br/>
            Sistem Gaji: <strong>{schedule.type === 'Ujian' ? 'Flat Rate (Bundling)' : 'Per Jam (Sesuai Durasi)'}</strong>
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