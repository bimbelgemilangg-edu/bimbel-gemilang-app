import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { QRCodeSVG } from 'qrcode.react';
import { Users, BookOpen, Save, ArrowLeft, QrCode } from 'lucide-react';

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [materiAktual, setMateriAktual] = useState(schedule.title || ""); 

  // REAL-TIME LISTENER: Menangkap absen yang masuk dari scan HP siswa
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, "attendance"), 
      where("date", "==", today),
      where("mapel", "==", schedule.title || "Umum")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMap = { ...attendanceMap };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Cek apakah siswa yang absen ada di daftar jadwal ini
        if (schedule.students.some(s => s.id === data.studentId)) {
          newMap[data.studentId] = (data.status === "Hadir");
        }
      });
      setAttendanceMap(newMap);
    });

    return () => unsubscribe();
  }, [schedule.students, schedule.title]);

  // Fungsi Toggle Manual (Dipertahankan jika siswa tidak bawa HP)
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
        keterangan: willBePresent ? "Input Manual Guru" : "Siswa tidak hadir",
        mapel: schedule.title || "Umum"
      }, { merge: true });
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
      
      // Simpan status akhir (Alpha) untuk yang tidak hadir
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
        kegiatan: "Mengajar",
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
    <div style={{padding: 20, maxWidth: 900, margin: '0 auto'}}>
      <div style={styles.headerCard}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
           <h2 style={{margin:0, color:'#2c3e50', fontSize:20}}>Sesi: {schedule.title || "Umum"}</h2>
           <span style={styles.badgeRuang}>{schedule.planet}</span>
        </div>
        <p style={{margin:'5px 0', color:'#7f8c8d', fontSize:14}}>⏰ {schedule.start} - {schedule.end}</p>
      </div>

      {step === 1 && (
        <div style={styles.mainGrid}>
            {/* KOLOM KIRI: QR CODE GURU */}
            <div style={styles.qrSection}>
                <h4 style={{margin:'0 0 15px', color:'#2c3e50'}}><QrCode size={18} inline /> Scan QR untuk Absen</h4>
                <div style={styles.qrWrapper}>
                    <QRCodeSVG 
                        value={JSON.stringify({
                            type: "ABSENSI_BIMBEL",
                            scheduleId: schedule.id,
                            mapel: schedule.title || "Umum",
                            teacher: teacher.nama,
                            date: new Date().toISOString().split('T')[0]
                        })} 
                        size={220}
                        level="H"
                        includeMargin={true}
                    />
                </div>
                <p style={{fontSize:12, color:'#7f8c8d', marginTop:15}}>Siswa: Buka menu Scan di dashboard HP kalian</p>
            </div>

            {/* KOLOM KANAN: DAFTAR HADIR */}
            <div style={styles.listSection}>
                <h4 style={{margin:'0 0 15px', color:'#3498db'}}>Daftar Siswa ({Object.values(attendanceMap).filter(v=>v).length}/{schedule.students.length})</h4>
                <div style={styles.studentGrid}>
                  {schedule.students.map(siswa => {
                    const isPresent = attendanceMap[siswa.id];
                    return (
                      <div key={siswa.id} onClick={() => toggleStudent(siswa)}
                        style={{
                          ...styles.studentCard,
                          background: isPresent ? '#27ae60' : '#f1f5f9',
                          color: isPresent ? 'white' : '#64748b',
                          border: isPresent ? 'none' : '1px solid #e2e8f0'
                        }}>
                        <div style={{fontSize:13, fontWeight:'bold'}}>{siswa.nama}</div>
                        <div style={{fontSize:9, opacity:0.8}}>{isPresent ? "HADIR" : "BELUM SCAN"}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setStep(2)} style={styles.btnPrimary}>Selesai Absen & Lanjut ⮕</button>
                <button onClick={onBack} style={styles.btnSecondary}>Batal</button>
            </div>
        </div>
      )}

      {step === 2 && (
        <div style={styles.reportSection}>
            <h4 style={{marginTop:0, marginBottom:15, color:'#e67e22'}}>Langkah 2: Laporan Materi</h4>
            <div style={{marginBottom:20}}>
                <label style={{display:'block', marginBottom:8, fontWeight:'bold', fontSize:14}}>Materi yang diajarkan hari ini:</label>
                <textarea 
                    rows={5} value={materiAktual} onChange={(e) => setMateriAktual(e.target.value)}
                    placeholder="Contoh: Pembahasan Soal Try Out Paket 2..."
                    style={styles.textarea}
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
    headerCard: { background: 'white', padding: 20, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: 20 },
    badgeRuang: { background:'#e8f8f5', color:'#16a085', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:'bold' },
    mainGrid: { display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 },
    qrSection: { background: 'white', padding: 25, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center' },
    qrWrapper: { padding: '10px', background: 'white', border: '1px solid #f1f5f9', borderRadius: '15px', display: 'inline-block' },
    listSection: { background: 'white', padding: 20, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    studentGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' },
    studentCard: { padding: '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', transition: '0.2s' },
    reportSection: { background: 'white', padding: 25, borderRadius: 15, boxShadow: '0 4px 15px rgba(0,0,0,0.05)' },
    textarea: { width: '100%', padding: 12, borderRadius: 10, border: '1px solid #ddd', boxSizing: 'border-box', outline: 'none', fontSize: 14 },
    btnPrimary: { width: '100%', padding: '15px', background: '#3498db', color: 'white', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 },
    btnSecondary: { width: '100%', marginTop: 10, padding: '12px', background: '#f8f9fa', color: '#7f8c8d', border: 'none', borderRadius: 12, fontWeight: 'bold', cursor: 'pointer', fontSize: 13 }
};

export default ClassSession;