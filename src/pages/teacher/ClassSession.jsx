import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);

  // --- UPDATE PENTING: LOGIKA ABSEN REAL-TIME KE ADMIN ---
  const toggleStudent = async (student) => {
    // 1. Tentukan status baru (Kebalikan dari status sekarang)
    const isCurrentlyPresent = !!attendanceMap[student.id];
    const willBePresent = !isCurrentlyPresent;

    // 2. Update UI dulu (Biar tombol langsung berubah warna, tidak lemot)
    setAttendanceMap(prev => ({ ...prev, [student.id]: willBePresent }));

    // 3. KIRIM KE DATABASE (Agar Admin Bisa Lihat)
    const today = new Date().toISOString().split('T')[0]; // Format: 2026-02-02
    const absenId = `${student.id}_${today}`; // ID Unik: idSiswa_tanggal
    const absenRef = doc(db, "attendance", absenId);

    try {
      if (willBePresent) {
        // JIKA HADIR -> SIMPAN KE FIREBASE
        await setDoc(absenRef, {
          studentId: student.id,
          studentName: student.nama,
          program: student.program || schedule.program || "Reguler", // Ambil dari data siswa atau jadwal
          teacherId: teacher.id,
          teacherName: teacher.nama,
          date: today,
          timestamp: serverTimestamp(), // Jam server akurat
          status: "Hadir",
          keterangan: "Input via Kelas Guru"
        });
        console.log(`✅ Absen tersimpan: ${student.nama}`);
      } else {
        // JIKA BATAL -> HAPUS DARI FIREBASE
        await deleteDoc(absenRef);
        console.log(`❌ Absen dibatalkan: ${student.nama}`);
      }
    } catch (error) {
      console.error("Gagal sinkron absen:", error);
      // Jika gagal, kembalikan warna tombol ke semula (Rollback)
      setAttendanceMap(prev => ({ ...prev, [student.id]: isCurrentlyPresent }));
      alert("⚠️ Gagal menyimpan ke server Admin. Cek koneksi internet!");
    }
  };
  // --- BATAS UPDATE PENTING ---

  const handleFinishClass = async () => {
    if (!window.confirm("Selesai kelas? Gaji akan dihitung otomatis sesuai aturan.")) return;
    
    setLoading(true);
    try {
      // 1. DATA PENTING
      const siswaHadirList = schedule.students.filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;

      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const diffHours = (new Date(0, 0, 0, endParts[0], endParts[1]) - new Date(0, 0, 0, startParts[0], startParts[1])) / 36e5;

      // 2. AMBIL RULES DARI SETTINGS
      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      let rules = { honorSD: 35000, honorSMP: 40000, honorSMA: 50000, bonusInggris: 10000 };
      if (settingsSnap.exists()) rules = { ...rules, ...settingsSnap.data().salaryRules };

      let nominal = 0;
      const realActivity = schedule.actualActivity || "Mengajar"; 
      let detailTxt = `${schedule.program} - ${schedule.title} (${realActivity})`;
      let statusGaji = "Menunggu Validasi";

      // --- LOGIKA HITUNG GAJI ---
      if (schedule.program === "English") {
          const base = parseInt(rules.honorSD) + parseInt(rules.bonusInggris);
          nominal = base * diffHours;
          detailTxt += " [English Rate]";
      }
      else if (realActivity === "Ujian" || realActivity === "Buat Soal") {
          if (realActivity === "Ujian" && schedule.title.toLowerCase().includes("paket")) {
             nominal = parseInt(rules.ujianPaket || 15000);
          } else if (realActivity === "Buat Soal") {
             nominal = parseInt(rules.ujianSoal || 10000);
          } else {
             nominal = parseInt(rules.ujianJaga || 10000);
          }
      }
      else {
          // REGULER
          let baseRate = parseInt(rules.honorSD);
          if ((schedule.level + schedule.title).toLowerCase().includes("smp")) baseRate = parseInt(rules.honorSMP);
          
          // KOMPENSASI
          if (jumlahHadir === 0) {
            const gajiFull = baseRate * diffHours;
            nominal = gajiFull * 0.5; // DIKALI 0.5
            detailTxt += " [Kompensasi 50% - Siswa Kosong]";
            statusGaji = "Kompensasi";
          } else {
            nominal = baseRate * diffHours;
          }
      }

      // 3. SIMPAN LOG (SUMMARY UNTUK GAJI)
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id,
        namaGuru: schedule.actualTeacher || teacher.nama,
        tanggal: new Date().toISOString().split('T')[0],
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id,
        program: schedule.program,
        kegiatan: realActivity,
        detail: detailTxt,
        siswaHadir: jumlahHadir,
        siswaAbsenList: schedule.students.filter(s => !attendanceMap[s.id]),
        durasiJam: diffHours,
        nominal: Math.round(nominal), 
        status: statusGaji
      });

      alert(`✅ Kelas Selesai! Rp ${Math.round(nominal).toLocaleString('id-ID')}`);
      onBack();

    } catch (error) { console.error(error); alert("Gagal menyimpan: " + error.message); } finally { setLoading(false); }
  };

  return (
    <div style={{padding: 20, maxWidth: 600, margin: '0 auto'}}>
      <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
        <div style={{borderBottom:'1px solid #eee', paddingBottom:15, marginBottom:15}}>
          <h2 style={{margin:0, color:'#2c3e50'}}>Sedang Mengajar 👨‍🏫</h2>
          <p style={{margin:'5px 0', color:'#7f8c8d'}}>{schedule.start} - {schedule.end}</p>
          <div style={{background:'#e1f5fe', color:'#0277bd', padding:10, borderRadius:5, marginTop:10, fontSize:13}}>
            <strong>Mode:</strong> {schedule.actualActivity} <br/>
            <strong>Materi:</strong> {schedule.title}
          </div>
        </div>

        <h4 style={{marginBottom:10}}>Absensi Siswa:</h4>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
          {schedule.students.map(siswa => {
            const isPresent = attendanceMap[siswa.id];
            return (
              <div key={siswa.id} onClick={() => toggleStudent(siswa)} // KIRIM OBJECT SISWA FULL
                style={{
                  padding: 15, borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: 'white',
                  background: isPresent ? '#27ae60' : '#e74c3c', border: isPresent ? '2px solid #2ecc71' : '2px solid #c0392b',
                  transition: '0.2s'
                }}>
                {siswa.nama}
                <div style={{fontSize:11, fontWeight:'normal', marginTop:5}}>
                    {isPresent ? "🟢 HADIR + LAPOR" : "🔴 TIDAK"}
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={handleFinishClass} disabled={loading} style={{width:'100%', padding:15, background:'#2c3e50', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer'}}>
          {loading ? "Menghitung Gaji..." : "SELESAI KELAS & SIMPAN"}
        </button>
        <button onClick={onBack} style={{width:'100%', marginTop:10, padding:10, background:'transparent', border:'none', cursor:'pointer', color:'#888'}}>Batal</button>
      </div>
    </div>
  );
};

export default ClassSession;