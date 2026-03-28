import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Html5QrcodeScanner } from "html5-qrcode";

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [materiAktual, setMateriAktual] = useState(schedule.title || ""); 
  const [isScannerActive, setIsScannerActive] = useState(false);

  // Fungsi Toggle Manual (Fitur Lama yang Dipertahankan)
  const toggleStudent = async (student) => {
    const isCurrentlyPresent = !!attendanceMap[student.id];
    const willBePresent = !isCurrentlyPresent;
    markAsPresent(student, willBePresent);
  };

  // Fungsi Inti untuk Mencatat Kehadiran (Dipakai QR & Manual)
  const markAsPresent = async (student, willBePresent) => {
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
        keterangan: willBePresent ? "Scan QR / Manual Guru" : "Siswa tidak hadir",
        mapel: schedule.title || "Umum"
      }, { merge: true });
    } catch (error) {
      console.error("Gagal sinkron absen:", error);
      setAttendanceMap(prev => ({ ...prev, [student.id]: !willBePresent }));
    }
  };

  // Setup QR Scanner
  useEffect(() => {
    let scanner = null;
    if (isScannerActive && step === 1) {
      scanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: { width: 250, height: 250 } 
      }, false);

      scanner.render((decodedText) => {
        // decodedText diasumsikan adalah ID Siswa
        const student = schedule.students.find(s => s.id === decodedText);
        if (student) {
          if (!attendanceMap[student.id]) {
            markAsPresent(student, true);
            // Memberikan feedback suara singkat jika perlu atau alert
            alert(`✅ ${student.nama} Berhasil Absen!`);
          }
        } else {
          console.warn("Siswa tidak terdaftar di jadwal ini");
        }
      }, (error) => {
        // Ignore error scan
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [isScannerActive, step, attendanceMap]);

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
            keterangan: isPresent ? "Sesi Selesai" : "Siswa tidak hadir (Otomatis Alpha)",
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
      const realActivity = "Mengajar"; 
      let detailTxt = `${schedule.program} - ${materiAktual}`; 
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
        namaGuru: teacher.nama,
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
      <div style={{background: 'white', padding: 20, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 20}}>
        <div style={{borderBottom:'1px solid #eee', paddingBottom:15}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
             <h2 style={{margin:0, color:'#2c3e50', fontSize:18}}>Sesi: {schedule.title || "Umum"}</h2>
             <span style={{background:'#e8f8f5', color:'#16a085', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:'bold'}}>{schedule.planet}</span>
          </div>
          <p style={{margin:'5px 0', color:'#7f8c8d', fontSize:14}}>⏰ {schedule.start} - {schedule.end}</p>
        </div>
      </div>

      {step === 1 && (
        <div style={{background: 'white', padding: 20, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:15}}>
                <h4 style={{margin:0, color:'#3498db'}}>Langkah 1: Absensi Siswa</h4>
                <button 
                  onClick={() => setIsScannerActive(!isScannerActive)}
                  style={{...styles.btnScanner, background: isScannerActive ? '#e74c3c' : '#3498db'}}
                >
                  {isScannerActive ? "⏹ Matikan Kamera" : "📷 Gunakan Kamera"}
                </button>
            </div>

            {isScannerActive && (
              <div id="reader" style={{ width: '100%', marginBottom: 20, borderRadius: 10, overflow: 'hidden' }}></div>
            )}

            <p style={{fontSize:12, color:'#95a5a6', marginBottom:10}}>* Klik nama siswa jika tidak membawa HP</p>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20}}>
              {schedule.students.map(siswa => {
                const isPresent = attendanceMap[siswa.id];
                return (
                  <div key={siswa.id} onClick={() => toggleStudent(siswa)}
                    style={{
                      padding: 15, borderRadius: 12, cursor: 'pointer', textAlign: 'center', fontWeight: 'bold', color: 'white',
                      background: isPresent ? '#27ae60' : '#bdc3c7', 
                      boxShadow: isPresent ? '0 4px 10px rgba(39, 174, 96, 0.3)' : 'none',
                      transition: '0.2s', border:'none'
                    }}>
                    <div style={{fontSize:14}}>{siswa.nama}</div>
                    <div style={{fontSize:10, fontWeight:'normal', marginTop:5, opacity:0.8}}>
                        {isPresent ? "🟢 HADIR" : "⚪ BELUM SCAN"}
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => {setStep(2); setIsScannerActive(false);}} style={styles.btnPrimary}>✅ Selesai Absen & Lanjut</button>
            <button onClick={onBack} style={styles.btnSecondary}>Kembali ke Dashboard</button>
        </div>
      )}

      {step === 2 && (
        <div style={{background: 'white', padding: 20, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
            <h4 style={{marginTop:0, marginBottom:15, color:'#e67e22'}}>Langkah 2: Laporan Materi</h4>
            <div style={{marginBottom:20}}>
                <label style={{display:'block', marginBottom:8, fontWeight:'bold', fontSize:14, color:'#34495e'}}>Materi yang diajarkan hari ini:</label>
                <textarea 
                    rows={5} value={materiAktual} onChange={(e) => setMateriAktual(e.target.value)}
                    placeholder="Contoh: Pembahasan Soal Try Out Paket 2..."
                    style={{width:'100%', padding:12, borderRadius:10, border:'1px solid #ddd', boxSizing:'border-box', outline:'none'}}
                />
            </div>
            <div style={{display:'flex', gap:10}}>
                <button onClick={() => setStep(1)} style={{...styles.btnSecondary, flex:1, marginTop:0}}>⬅ Kembali</button>
                <button onClick={handleFinalizeClass} disabled={loading} style={{...styles.btnPrimary, flex:2, background: loading ? '#95a5a6' : '#2c3e50'}}>
                    {loading ? "Menyimpan..." : "💾 Akhiri & Simpan Kelas"}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
    btnPrimary: { width: '100%', padding: '15px', background: '#2980b9', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', fontSize: 15 },
    btnSecondary: { width: '100%', marginTop: 10, padding: '12px', background: '#f8f9fa', color: '#7f8c8d', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer' },
    btnScanner: { padding: '8px 15px', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }
};

export default ClassSession;