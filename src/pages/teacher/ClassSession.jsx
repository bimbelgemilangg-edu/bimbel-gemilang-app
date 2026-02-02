import React, { useState } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  
  // STATE BARU: Untuk Mengontrol Tahapan
  const [step, setStep] = useState(1); // 1 = Absensi, 2 = Input Materi
  const [materiAktual, setMateriAktual] = useState(schedule.title || ""); // Default isi materi sesuai jadwal

  // --- LOGIKA ABSEN REAL-TIME (PENTING JANGAN DIHAPUS) ---
  const toggleStudent = async (student) => {
    const isCurrentlyPresent = !!attendanceMap[student.id];
    const willBePresent = !isCurrentlyPresent;

    setAttendanceMap(prev => ({ ...prev, [student.id]: willBePresent }));

    const today = new Date().toISOString().split('T')[0];
    const absenId = `${student.id}_${today}`;
    const absenRef = doc(db, "attendance", absenId);

    try {
      if (willBePresent) {
        await setDoc(absenRef, {
          studentId: student.id,
          studentName: student.nama,
          program: student.program || schedule.program || "Reguler",
          teacherId: teacher.id,
          teacherName: teacher.nama,
          date: today,
          timestamp: serverTimestamp(),
          status: "Hadir",
          keterangan: "Input via Kelas Guru"
        });
      } else {
        await deleteDoc(absenRef);
      }
    } catch (error) {
      console.error("Gagal sinkron absen:", error);
      setAttendanceMap(prev => ({ ...prev, [student.id]: isCurrentlyPresent }));
    }
  };

  // --- TAHAP 1: SELESAI ABSENSI, LANJUT KE MATERI ---
  const handleLanjutInputMateri = () => {
    // Validasi opsional: Cek apakah ada siswa yang hadir?
    // if (Object.values(attendanceMap).filter(v => v).length === 0) {
    //    if(!confirm("Tidak ada siswa hadir? Lanjut?")) return;
    // }
    setStep(2); // Pindah ke layar input materi
  };

  // --- TAHAP 2: HITUNG GAJI & SIMPAN FINAL ---
  const handleFinalizeClass = async () => {
    if (!materiAktual) return alert("Mohon isi materi yang diajarkan!");
    if (!window.confirm("Yakin akhiri kelas? Data akan disimpan permanen.")) return;
    
    setLoading(true);
    try {
      // 1. DATA HITUNGAN
      const siswaHadirList = schedule.students.filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;

      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const diffHours = (new Date(0, 0, 0, endParts[0], endParts[1]) - new Date(0, 0, 0, startParts[0], startParts[1])) / 36e5;

      // 2. AMBIL RULES GAJI
      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      let rules = { honorSD: 35000, honorSMP: 40000, honorSMA: 50000, bonusInggris: 10000 };
      if (settingsSnap.exists()) rules = { ...rules, ...settingsSnap.data().salaryRules };

      let nominal = 0;
      const realActivity = schedule.actualActivity || "Mengajar"; 
      // GUNAKAN MATERI AKTUAL DARI INPUT GURU
      let detailTxt = `${schedule.program} - ${materiAktual} (${realActivity})`; 
      let statusGaji = "Menunggu Validasi";

      // 3. LOGIKA GAJI (Sama seperti sebelumnya)
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
          let baseRate = parseInt(rules.honorSD);
          if ((schedule.level + schedule.title).toLowerCase().includes("smp")) baseRate = parseInt(rules.honorSMP);
          
          if (jumlahHadir === 0) {
            const gajiFull = baseRate * diffHours;
            nominal = gajiFull * 0.5; 
            detailTxt += " [Kompensasi 50%]";
            statusGaji = "Kompensasi";
          } else {
            nominal = baseRate * diffHours;
          }
      }

      // 4. SIMPAN KE DATABASE
      await addDoc(collection(db, "teacher_logs"), {
        teacherId: teacher.id,
        namaGuru: schedule.actualTeacher || teacher.nama,
        tanggal: new Date().toISOString().split('T')[0],
        waktu: new Date().toLocaleTimeString(),
        jadwalId: schedule.id,
        program: schedule.program,
        kegiatan: realActivity,
        detail: detailTxt, // <-- Ini sekarang berisi materi yang diketik guru
        siswaHadir: jumlahHadir,
        durasiJam: diffHours,
        nominal: Math.round(nominal), 
        status: statusGaji
      });

      alert(`✅ Kelas Berhasil Disimpan!\nH Honor: Rp ${Math.round(nominal).toLocaleString('id-ID')}`);
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
      
      {/* HEADER KELAS */}
      <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: 20}}>
        <div style={{borderBottom:'1px solid #eee', paddingBottom:15}}>
          <h2 style={{margin:0, color:'#2c3e50'}}>Sedang Mengajar 👨‍🏫</h2>
          <p style={{margin:'5px 0', color:'#7f8c8d'}}>{schedule.start} - {schedule.end}</p>
        </div>
      </div>

      {/* --- TAMPILAN LANGKAH 1: ABSENSI --- */}
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
                        {isPresent ? "🟢 HADIR" : "🔴 TIDAK"}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={handleLanjutInputMateri} style={styles.btnPrimary}>
              ✅ Selesai Absen & Lanjut
            </button>
            <button onClick={onBack} style={styles.btnSecondary}>Batal</button>
        </div>
      )}

      {/* --- TAMPILAN LANGKAH 2: INPUT MATERI --- */}
      {step === 2 && (
        <div style={{background: 'white', padding: 20, borderRadius: 10, boxShadow: '0 2px 5px rgba(0,0,0,0.1)'}}>
            <h4 style={{marginTop:0, marginBottom:15, color:'#e67e22'}}>Langkah 2: Laporan Materi</h4>
            
            <div style={{marginBottom:20}}>
                <label style={{display:'block', marginBottom:5, fontWeight:'bold', fontSize:14}}>Materi yang diajarkan hari ini:</label>
                <textarea 
                    rows={4}
                    value={materiAktual}
                    onChange={(e) => setMateriAktual(e.target.value)}
                    placeholder="Contoh: Pembahasan Soal Try Out Paket 2..."
                    style={{width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd', fontFamily:'sans-serif'}}
                />
                <small style={{color:'#7f8c8d'}}>*Sesuaikan jika materi berbeda dengan jadwal.</small>
            </div>

            <div style={{display:'flex', gap:10}}>
                <button onClick={() => setStep(1)} style={{...styles.btnSecondary, flex:1}}>
                    ⬅ Kembali Absen
                </button>
                <button onClick={handleFinalizeClass} disabled={loading} style={{...styles.btnPrimary, flex:2, background: loading ? '#95a5a6' : '#2c3e50'}}>
                    {loading ? "Menyimpan..." : "💾 Akhiri Kelas"}
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

// Styles Sederhana agar rapi
const styles = {
    btnPrimary: {
        width: '100%', padding: 15, background: '#2980b9', color: 'white', 
        border: 'none', borderRadius: 5, fontWeight: 'bold', cursor: 'pointer', fontSize: 14
    },
    btnSecondary: {
        width: '100%', marginTop: 10, padding: 10, background: '#ecf0f1', color: '#2c3e50', 
        border: 'none', borderRadius: 5, cursor: 'pointer', fontWeight: 'bold'
    }
};

export default ClassSession;