import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp, onSnapshot, query, where } from "firebase/firestore";
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ArrowLeft } from 'lucide-react';

const ClassSession = ({ schedule, teacher, onBack }) => {
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); 
  const [materiAktual, setMateriAktual] = useState(schedule?.title || "");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!schedule?.id) return;
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
        if (schedule.students && schedule.students.some(s => s.id === data.studentId)) {
          newMap[data.studentId] = (data.status === "Hadir");
        }
      });
      setAttendanceMap(newMap);
    }, (error) => {
      console.error("Listener Error:", error);
    });
    return () => unsubscribe();
  }, [schedule]);

  const toggleStudent = async (student) => {
    const isCurrentlyPresent = !!attendanceMap[student.id];
    const willBePresent = !isCurrentlyPresent;
    setAttendanceMap(prev => ({ ...prev, [student.id]: willBePresent }));
    const today = new Date().toISOString().split('T')[0];
    const absenId = `${student.id}_${today}_${schedule.id}`;
    const absenRef = doc(db, "attendance", absenId);
    try {
      await setDoc(absenRef, {
        studentId: student.id,
        studentName: student.nama,
        program: student.program || schedule.program || "Reguler",
        kelasSekolah: student.kelas || student.kelasSekolah || "-",
        teacherId: teacher.id,
        teacherName: teacher.nama,
        date: today,
        tanggal: today,
        timestamp: serverTimestamp(),
        status: willBePresent ? "Hadir" : "Alpha",
        keterangan: willBePresent ? "Input Manual Guru" : "Siswa tidak hadir",
        mapel: schedule.title || "Umum",
        scheduleId: schedule.id || "",
        planet: schedule.planet || "Ruang Umum"
      }, { merge: true });
    } catch (error) {
      console.error("Update Absen Error:", error);
      setAttendanceMap(prev => ({ ...prev, [student.id]: isCurrentlyPresent }));
    }
  };

  const handleFinalizeClass = async () => {
    if (!materiAktual) return alert("Mohon isi materi yang diajarkan!");
    if (!window.confirm("Yakin akhiri kelas? Data siswa yang tidak hadir akan dicatat sebagai Alpha.")) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const batchPromises = (schedule.students || []).map(async (siswa) => {
        const isPresent = !!attendanceMap[siswa.id];
        const absenId = `${siswa.id}_${today}_${schedule.id}`;
        const absenRef = doc(db, "attendance", absenId);
        return setDoc(absenRef, {
            studentId: siswa.id,
            studentName: siswa.nama,
            program: siswa.program || schedule.program || "Reguler",
            kelasSekolah: siswa.kelas || siswa.kelasSekolah || "-",
            teacherId: teacher.id,
            teacherName: teacher.nama,
            date: today,
            tanggal: today,
            timestamp: serverTimestamp(),
            status: isPresent ? "Hadir" : "Alpha",
            keterangan: isPresent ? "Sesi Selesai" : "Siswa tidak hadir (Otomatis Alpha)",
            mapel: schedule.title || "Umum",
            scheduleId: schedule.id || "",
            planet: schedule.planet || "Ruang Umum"
        }, { merge: true });
      });
      await Promise.all(batchPromises);

      const siswaHadirList = (schedule.students || []).filter(s => attendanceMap[s.id]);
      const jumlahHadir = siswaHadirList.length;
      const startParts = schedule.start.split(':');
      const endParts = schedule.end.split(':');
      const startTime = new Date(0, 0, 0, startParts[0], startParts[1]);
      const endTime = new Date(0, 0, 0, endParts[0], endParts[1]);
      const diffHours = (endTime - startTime) / 36e5;

      const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
      let rules = { honorSD: 35000, honorSMP: 40000, honorSMA: 50000, bonusInggris: 10000 };
      if (settingsSnap.exists() && settingsSnap.data().salaryRules) {
          rules = { ...rules, ...settingsSnap.data().salaryRules };
      }

      let nominal = 0;
      let detailTxt = `${schedule.program} - ${materiAktual}`;
      let statusGaji = "Menunggu Validasi";
      if (schedule.program === "English") {
          nominal = (parseInt(rules.honorSD) + parseInt(rules.bonusInggris)) * diffHours;
          detailTxt += " [English Rate]";
      } else {
          let baseRate = parseInt(rules.honorSD);
          const titleLower = ((schedule.level || "") + (schedule.title || "")).toLowerCase();
          if (titleLower.includes("smp")) baseRate = parseInt(rules.honorSMP);
          else if (titleLower.includes("sma")) baseRate = parseInt(rules.honorSMA);
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
        status: statusGaji,
        createdAt: serverTimestamp()
      });

      const hadirCount = siswaHadirList.length;
      const totalCount = (schedule.students || []).length;
      alert(
        `✅ Kelas Berhasil Disimpan!\n\n` +
        `📚 Materi: ${materiAktual}\n` +
        `⏰ Jam: ${schedule.start} - ${schedule.end}\n` +
        `🏫 Ruang: ${schedule.planet || "Ruang Umum"}\n` +
        `👥 Kehadiran: ${hadirCount}/${totalCount} siswa hadir`
      );
      onBack();
    } catch (error) {
        alert("Gagal menyimpan sesi: " + error.message);
    } finally { setLoading(false); }
  };

  return (
    <div style={styles.container(isMobile)}>
      <button onClick={onBack} style={styles.btnBack(isMobile)}><ArrowLeft size={16}/> Kembali</button>
      
      <div style={styles.headerCard(isMobile)}>
        <div style={styles.headerFlex}>
           <div>
              <h2 style={styles.headerTitle(isMobile)}>{schedule.title || "Umum"}</h2>
              <p style={styles.headerTime(isMobile)}>⏰ {schedule.start} - {schedule.end}</p>
           </div>
           <span style={styles.badge(isMobile)}>{schedule.planet || "Ruang Umum"}</span>
        </div>
      </div>

      {step === 1 && (
        <div style={styles.gridContainer(isMobile)}>
            <div style={styles.card(isMobile)}>
                <h4 style={styles.cardTitle}><QrCode size={18} /> Scan Absensi</h4>
                <div style={styles.qrWrapper}>
                    <QRCodeSVG 
                        value={JSON.stringify({
                            type: "ABSENSI_BIMBEL",
                            scheduleId: schedule.id,
                            mapel: schedule.title || "Umum",
                            teacher: teacher.nama,
                            date: new Date().toISOString().split('T')[0]
                        })} 
                        size={isMobile ? 140 : 180}
                        style={{ width: '100%', height: 'auto', maxWidth: isMobile ? '140px' : '180px' }}
                    />
                </div>
                <p style={styles.qrHint(isMobile)}>Siswa silakan scan melalui aplikasi siswa</p>
            </div>

            <div style={styles.card(isMobile)}>
                <h4 style={{...styles.cardTitle, color:'#3498db'}}>
                  Siswa ({Object.values(attendanceMap).filter(v=>v).length}/{(schedule.students || []).length})
                </h4>
                <div style={styles.studentScrollArea}>
                  {(schedule.students || []).map(siswa => {
                    const isPresent = attendanceMap[siswa.id];
                    return (
                      <div key={siswa.id} onClick={() => toggleStudent(siswa)}
                        style={{
                          ...styles.studentItem(isMobile),
                          background: isPresent ? '#27ae60' : '#f8fafc',
                          color: isPresent ? 'white' : '#64748b',
                          border: isPresent ? 'none' : '1px solid #e2e8f0'
                        }}>
                        <div style={styles.studentName(isMobile)}>{siswa.nama}</div>
                        <div style={styles.studentStatus}>{isPresent ? "HADIR" : "BELUM HADIR"}</div>
                      </div>
                    );
                  })}
                </div>
                <button onClick={() => setStep(2)} style={styles.btnMain(isMobile)}>Selesai & Buat Laporan ⮕</button>
            </div>
        </div>
      )}

      {step === 2 && (
        <div style={styles.card(isMobile)}>
            <h4 style={styles.step2Title(isMobile)}>📝 Laporan Materi</h4>
            <textarea 
                rows={isMobile ? 4 : 5} 
                value={materiAktual} 
                onChange={(e) => setMateriAktual(e.target.value)}
                placeholder="Tuliskan materi yang diajarkan hari ini..."
                style={styles.textarea(isMobile)}
            />
            <div style={styles.footerBtns(isMobile)}>
                <button onClick={() => setStep(1)} style={styles.btnSecondary(isMobile)}>⬅ Kembali</button>
                <button onClick={handleFinalizeClass} disabled={loading} style={styles.btnSave(isMobile, loading)}>
                    {loading ? "Menyimpan..." : "💾 Simpan Sesi"}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: (m) => ({ padding: m ? '10px' : '15px', width: '100%', boxSizing: 'border-box', maxWidth: m ? '100%' : '1200px', margin: '0 auto' }),
  btnBack: (m) => ({ background: 'none', border: 'none', color: '#7f8c8d', cursor: 'pointer', marginBottom: m ? 10 : 15, display: 'flex', alignItems: 'center', gap: 5, fontSize: m ? 12 : 14 }),
  headerCard: (m) => ({ background: 'white', padding: m ? '15px' : '20px', borderRadius: m ? '12px' : '15px', border: '1px solid #eee', marginBottom: m ? '12px' : '20px' }),
  headerFlex: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
  headerTitle: (m) => ({ margin: 0, fontSize: m ? '15px' : '18px', color: '#2c3e50' }),
  headerTime: (m) => ({ margin: 0, color: '#7f8c8d', fontSize: m ? '11px' : '13px' }),
  badge: (m) => ({ background: '#ebf5fb', color: '#3498db', padding: m ? '4px 10px' : '5px 12px', borderRadius: '20px', fontSize: m ? '10px' : '11px', fontWeight: 'bold' }),
  gridContainer: (m) => ({ display: 'flex', flexWrap: 'wrap', gap: m ? '12px' : '20px', width: '100%', flexDirection: m ? 'column' : 'row' }),
  card: (m) => ({ background: 'white', padding: m ? '15px' : '20px', borderRadius: m ? '12px' : '15px', border: '1px solid #eee', flex: m ? '1 1 100%' : '1 1 350px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }),
  cardTitle: { margin: '0 0 15px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 },
  qrWrapper: { textAlign: 'center', padding: 15, border: '1px dashed #ddd', borderRadius: 10, alignSelf: 'center' },
  qrHint: (m) => ({ fontSize: m ? 10 : 11, color: '#7f8c8d', marginTop: 10, textAlign: 'center' }),
  studentScrollArea: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 20, maxHeight: '400px', overflowY: 'auto' },
  studentItem: (m) => ({ padding: m ? '10px' : '12px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center', transition: '0.2s' }),
  studentName: (m) => ({ fontWeight: 'bold', fontSize: m ? '11px' : '13px' }),
  studentStatus: { fontSize: '10px', opacity: 0.8 },
  step2Title: (m) => ({ marginTop: 0, color: '#e67e22', fontSize: m ? '14px' : '16px' }),
  textarea: (m) => ({ width: '100%', padding: '15px', borderRadius: '10px', border: '1px solid #ddd', boxSizing: 'border-box', fontSize: m ? 13 : 14, marginBottom: 20, outline: 'none', resize: 'vertical' }),
  footerBtns: (m) => ({ display: 'flex', gap: 10, flexDirection: m ? 'column' : 'row' }),
  btnMain: (m) => ({ flex: 1, padding: m ? '12px' : '14px', background: '#3498db', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: m ? '12px' : '14px' }),
  btnSecondary: (m) => ({ padding: m ? '12px' : '14px 25px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: m ? '12px' : '14px', textAlign: 'center' }),
  btnSave: (m, loading) => ({ flex: 1, padding: m ? '12px' : '14px', background: loading ? '#bdc3c7' : '#2c3e50', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: m ? '12px' : '14px' })
};

export default ClassSession;