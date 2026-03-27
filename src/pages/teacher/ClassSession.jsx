import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [materiAktual, setMateriAktual] = useState(schedule.title || ""); 

  const toggleStudent = async (student) => {
    const isCurrentlyPresent = !!attendanceMap[student.id];
    const willBePresent = !isCurrentlyPresent;
    setAttendanceMap(prev => ({ ...prev, [student.id]: willBePresent }));

    const today = new Date().toISOString().split('T')[0];
    const absenId = `${student.id}_${today}`;
    const absenRef = doc(db, "attendance", absenId);

    try {
      await setDoc(absenRef, {
        studentId: student.id,
        studentName: student.nama,
        program: student.program || schedule.program || "Reguler",
        teacherId: teacher.id,
        teacherName: teacher.nama,
        date: today,
        tanggal: today,
        timestamp: serverTimestamp(),
        status: willBePresent ? "Hadir" : "Alpha",
        keterangan: willBePresent ? "Input via Kelas Guru" : "Siswa tidak hadir",
        mapel: schedule.title || "Umum"
      });
    } catch (error) {
      console.error("Gagal sinkron absen:", error);
      setAttendanceMap(prev => ({ ...prev, [student.id]: isCurrentlyPresent }));
    }
  };

  const handleFinalizeClass = async () => {
    if (!materiAktual) return alert("Mohon isi materi yang diajarkan!");
    if (!window.confirm("Yakin akhiri kelas? Data siswa yang tidak hadir akan dicatat sebagai Alpha.")) return;
    
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const batchAbsensi = schedule.students.map(async (siswa) => {
        const isPresent = !!attendanceMap[siswa.id];
        const absenId = `${siswa.id}_${today}`;
        const absenRef = doc(db, "attendance", absenId);
        return setDoc(absenRef, {
            studentId: siswa.id,
            studentName: siswa.nama,
            program: siswa.program || schedule.program || "Reguler",
            teacherId: teacher.id,
            teacherName: teacher.nama,
            date: today,
            tanggal: today,
            timestamp: serverTimestamp(),
            status: isPresent ? "Hadir" : "Alpha",
            keterangan: isPresent ? "Input via Kelas Guru" : "Siswa tidak hadir (Otomatis Alpha)",
            mapel: schedule.title || "Umum"
        }, { merge: true });
      });
      
      await Promise.all(batchAbsensi);

      const siswaHadirList = schedule.students.filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;
      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const diffHours = (new Date(0, 0, 0, endParts[0], endParts[1]) - new Date(0, 0, 0, startParts[0], startParts[1])) / 36e5;

      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      let rules = { honorSD: 35000, honorSMP: 40000, honorSMA: 50000, bonusInggris: 10000 };
      if (settingsSnap.exists()) rules = { ...rules, ...settingsSnap.data().salaryRules };

      let nominal = 0;
      const realActivity = schedule.actualActivity || "Mengajar"; 
      let detailTxt = `${schedule.program} - ${materiAktual} (${realActivity})`; 
      let statusGaji = "Menunggu Validasi";

      if (schedule.program === "English") {
          nominal = (parseInt(rules.honorSD) + parseInt(rules.bonusInggris)) * diffHours;
          detailTxt += " [English Rate]";
      } else {
          let baseRate = parseInt(rules.honorSD);
          if ((schedule.level + schedule.title).toLowerCase().includes("smp")) baseRate = parseInt(rules.honorSMP);
          if (jumlahHadir === 0) {
            nominal = (baseRate * diffHours) * 0.5; 
            detailTxt += " [Kompensasi 50%]";
            statusGaji = "Kompensasi";
          } else {
            nominal = baseRate * diffHours;
          }
      }

      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id,
        namaGuru: schedule.actualTeacher || teacher.nama,
        tanggal: today,
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id,
        program: schedule.program,
        kegiatan: realActivity,
        detail: detailTxt,
        siswaHadir: jumlahHadir,
        durasiJam: diffHours,
        nominal: Math.round(nominal), 
        status: statusGaji
      });

      alert(`✅ Kelas Berhasil Disimpan!\nHonor: Rp ${Math.round(nominal).toLocaleString('id-ID')}`);
      onBack();
    } catch (error) { 
        alert("Gagal menyimpan: " + error.message); 
    } finally { setLoading(false); }
  };

  return (
    <div style={{padding: 20, maxWidth: 600, margin: '0 auto'}}>
      <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20}}>
        <div style={{borderBottom:'1px solid #eee', paddingBottom:15}}>
          <h2 style={{margin:0, color:'#2c3e50'}}>Sedang Mengajar 👨‍🏫</h2>
          <p style={{margin:'5px 0', color:'#7f8c8d'}}>{schedule.start} - {schedule.end}</p>
        </div>
      </div>

      {step === 1 && (
        <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
            <h4 style={{marginTop:0, marginBottom:15, color:'#3498db'}}>Langkah 1: Absensi Siswa</h4>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
              {schedule.students.map(siswa => {
                const isPresent = attendanceMap[siswa.id];
                return (
                  <div key={siswa.id} onClick={() => toggleStudent(siswa)}
                    style={{
                      padding: 15, borderRadius: 8, cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: 'white',
                      background: isPresent ? '#27ae60' : '#e74c3c', border: isPresent ? '2px solid #2ecc71' : '2px solid #c0392b',
                      transition: '0.2s'
                    }}>
                    {siswa.nama}
                    <div style={{fontSize:11, fontWeight:'normal', marginTop:5}}>
                        {isPresent ? "🟢 HADIR" : "🔴 ALPHA"}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setStep(2)} style={styles.btnPrimary}>✅ Selesai Absen & Lanjut</button>
            <button onClick={onBack} style={styles.btnSecondary}>Batal</button>
        </div>
      )}

      {step === 2 && (
        <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
            <h4 style={{marginTop:0, marginBottom:15, color:'#e67e22'}}>Langkah 2: Laporan Materi</h4>
            <div style={{marginBottom:20}}>
                <label style={{display:'block', marginBottom:5, fontWeight:'bold', fontSize:14}}>Materi yang diajarkan hari ini:</label>
                <textarea 
                    rows={4} value={materiAktual} onChange={(e) => setMateriAktual(e.target.value)}
                    placeholder="Contoh: Pembahasan Soal Try Out Paket 2..."
                    style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd'}}
                />
            </div>
            <div style={{display:'flex', gap:10}}>
                <button onClick={() => setStep(1)} style={{...styles.btnSecondary, flex:1}}>⬅ Kembali Absen</button>
                <button onClick={handleFinalizeClass} disabled={loading} style={{...styles.btnPrimary, flex:2, background: loading ? '#95a5a6' : '#2c3e50'}}>
                    {loading ? "Menyimpan..." : "💾 Akhiri Kelas"}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    btnPrimary: { width: '100%', padding: 15, background: '#2980b9', color: 'white', border: 'none', borderRadius: 5, fontWeight: 'bold', cursor: 'pointer' },
    btnSecondary: { width: '100%', marginTop: 10, padding: 10, background: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: 5, fontWeight: 'bold', cursor: 'pointer' }
};

export default ClassSession;