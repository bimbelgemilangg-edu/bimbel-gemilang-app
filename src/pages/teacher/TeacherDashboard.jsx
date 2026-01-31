import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase'; // Pastikan ini mengarah ke file firebase.js Anda
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  
  // STATE UI
  const [loading, setLoading] = useState(true);
  const [existingLog, setExistingLog] = useState(null);

  // STATE FORM INPUT
  const [programType, setProgramType] = useState("Reguler");
  const [jenjang, setJenjang] = useState("SD");
  const [mapel, setMapel] = useState("");
  const [activityType, setActivityType] = useState("Mengajar");
  const [jurnal, setJurnal] = useState(""); 
  const [durasi, setDurasi] = useState(1.5);
  const [siswaHadir, setSiswaHadir] = useState(1);
  const [englishLevel, setEnglishLevel] = useState("kids");

  // --- INIT & SMART SYNC (VERSI AMAN / ANTI-BLANK) ---
  useEffect(() => {
    const initData = async () => {
        try {
            // 1. Ambil Sesi dengan Aman
            const session = localStorage.getItem("guruSession");
            if (!session) { 
                throw new Error("No Session"); // Lempar ke catch
            }
            
            const guruData = JSON.parse(session); // Jika ini gagal, akan masuk catch
            setGuru(guruData);

            // 2. Sync ke Firebase
            const today = new Date().toISOString().split('T')[0];
            const q = query(
                collection(db, "teacher_logs"), 
                where("teacherId", "==", guruData.id), 
                where("tanggal", "==", today)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                setExistingLog(snap.docs[0].data());
            }
            setLoading(false);

        } catch (error) {
            console.error("Sesi Error atau Expired:", error);
            // JIKA ERROR, JANGAN BLANK. TENDANG BALIK KE LOGIN.
            localStorage.removeItem("guruSession"); // Bersihkan sampah
            navigate('/login-guru');
        }
    };

    initData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("guruSession");
    navigate('/login-guru');
  };

  // --- LOGIKA HITUNG GAJI ---
  const calculateAndSubmit = async (e) => {
    e.preventDefault();
    if(!guru) return;

    // VALIDASI JURNAL
    if (programType === "Reguler" && activityType === "Mengajar" && jurnal.length < 3) {
        alert("⚠️ Jurnal Mengajar WAJIB diisi (Bab/Halaman)!");
        return;
    }

    setLoading(true); // Tampilkan loading biar user tau sistem bekerja

    try {
        const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
        
        // Safety Check: Jika setting belum ada di database
        if (!settingsSnap.exists()) {
            alert("⚠️ Admin belum mengatur Harga Gaji di Settings. Hubungi Admin.");
            setLoading(false);
            return;
        }

        const rules = settingsSnap.data().salaryRules;
        let nominal = 0;
        let finalDetail = "";
        let finalDurasi = 0;

        // LOGIKA GAJI
        if (parseInt(siswaHadir) === 0) {
            nominal = parseInt(rules.transport);
            finalDetail = "Transport Only (0 Siswa)";
            finalDurasi = 0;
        } else {
            if (programType === "English") {
                const baseRate = parseInt(rules.honorSD) + parseInt(rules.bonusInggris);
                nominal = baseRate * 1.5; 
                finalDetail = `English Level ${englishLevel}`;
                finalDurasi = 1.5; 
            } else {
                if (activityType === "Mengajar") {
                    let rate = jenjang === "SD" ? rules.honorSD : rules.honorSMP;
                    nominal = (parseInt(rate) * parseFloat(durasi)) + parseInt(rules.transport);
                    finalDetail = `${jenjang} - ${mapel} (${jurnal})`;
                    finalDurasi = parseFloat(durasi);
                } else {
                    nominal = activityType === "Ujian" ? rules.pengawas : rules.buatSoal;
                    finalDetail = `${activityType} (${jurnal})`;
                    finalDurasi = parseFloat(durasi);
                }
            }
        }

        // SIMPAN DATA
        const logData = {
            teacherId: guru.id,
            namaGuru: guru.nama,
            tanggal: new Date().toISOString().split('T')[0],
            waktu: new Date().toLocaleTimeString(),
            program: programType,
            kegiatan: activityType,
            detail: finalDetail,
            siswaHadir: siswaHadir,
            durasiJam: finalDurasi,
            nominal: nominal,
            status: "Menunggu Validasi"
        };

        await addDoc(collection(db, "teacher_logs"), logData);
        setExistingLog(logData);
        alert("✅ Absensi Berhasil Disimpan!");

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan: " + error.message);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', flexDirection:'column'}}>
        <h3>🔄 Memuat Data Guru...</h3>
        <p>Mohon tunggu sebentar</p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
            <h2 style={{margin:0, color:'white'}}>Halo, {guru?.nama} 👋</h2>
            <p style={{margin:0, color:'#bdc3c7', fontSize:12}}>Akses Guru Terverifikasi</p>
        </div>
        <button onClick={handleLogout} style={styles.btnLogout}>Keluar</button>
      </div>

      <div style={styles.content}>
        
        {/* TAMPILAN SUDAH ABSEN */}
        {existingLog ? (
            <div style={styles.successCard}>
                <div style={{textAlign:'center', marginBottom:15}}>
                    <span style={{fontSize:40}}>✅</span>
                    <h3 style={{color:'#27ae60', margin:'10px 0'}}>Absensi Masuk!</h3>
                </div>
                <div style={styles.detailBox}>
                    <div style={styles.rowDetail}><span>Program:</span> <strong>{existingLog.program}</strong></div>
                    <div style={styles.rowDetail}><span>Detail:</span> <strong>{existingLog.detail}</strong></div>
                    <div style={styles.rowDetail}><span>Durasi:</span> <strong>{existingLog.durasiJam} Jam</strong></div>
                    <div style={styles.rowDetail}><span>Status:</span> <span style={styles.badgePending}>⏳ {existingLog.status}</span></div>
                </div>
            </div>
        ) : (
        
        /* TAMPILAN FORMULIR */
        <div style={styles.card}>
            <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:10, color:'#2c3e50'}}>📝 Input Aktivitas</h3>
            <form onSubmit={calculateAndSubmit}>
                <div style={{marginBottom:15}}>
                    <label style={styles.label}>Program</label>
                    <div style={{display:'flex', gap:10}}>
                        <button type="button" onClick={()=>setProgramType("Reguler")} style={programType==="Reguler" ? styles.btnActive : styles.btnInactive}>📚 Reguler</button>
                        <button type="button" onClick={()=>setProgramType("English")} style={programType==="English" ? styles.btnActive : styles.btnInactive}>🇬🇧 English</button>
                    </div>
                </div>

                {programType === "Reguler" && (
                    <>
                        <div style={styles.row}>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Jenjang</label>
                                <select style={styles.input} value={jenjang} onChange={e=>setJenjang(e.target.value)}><option>SD</option><option>SMP</option><option>SMA</option></select>
                            </div>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Aktivitas</label>
                                <select style={styles.input} value={activityType} onChange={e=>setActivityType(e.target.value)}>
                                    <option value="Mengajar">Mengajar</option>
                                    <option value="Ujian">Ujian</option>
                                    <option value="Soal">Buat Soal</option>
                                </select>
                            </div>
                        </div>
                        {activityType === "Mengajar" && (
                            <>
                                <div style={{marginBottom:10}}><label style={styles.label}>Mapel</label><input style={styles.input} value={mapel} onChange={e=>setMapel(e.target.value)} placeholder="Matematika" required /></div>
                                <div style={{marginBottom:10}}><label style={styles.label}>Jurnal</label><input style={styles.input} value={jurnal} onChange={e=>setJurnal(e.target.value)} placeholder="Bab/Hal..." required /></div>
                                <div style={{marginBottom:10}}><label style={styles.label}>Durasi (Jam)</label><input type="number" step="0.5" style={styles.input} value={durasi} onChange={e=>setDurasi(e.target.value)} /></div>
                            </>
                        )}
                         {(activityType === "Ujian" || activityType === "Soal") && (
                             <div style={{marginBottom:10}}><label style={styles.label}>Ket. Paket</label><input style={styles.input} value={jurnal} onChange={e=>setJurnal(e.target.value)} placeholder="Nama Paket..." required /></div>
                        )}
                    </>
                )}

                {programType === "English" && (
                    <div style={{marginBottom:15, background:'#f9fbe7', padding:15, borderRadius:5, border:'1px solid #cddc39'}}>
                        <label style={styles.label}>Level</label>
                        <select style={styles.input} value={englishLevel} onChange={e=>setEnglishLevel(e.target.value)}><option value="kids">Kids</option><option value="junior">Junior</option><option value="professional">Pro</option></select>
                        <div style={{marginTop:10, fontSize:13, color:'#827717'}}>🔒 Durasi: <strong>1 Sesi (90 Menit)</strong></div>
                    </div>
                )}

                <div style={{marginBottom:20}}>
                    <label style={styles.label}>Siswa Hadir</label>
                    <input type="number" style={styles.input} value={siswaHadir} onChange={e=>setSiswaHadir(e.target.value)} min="0" required />
                    {parseInt(siswaHadir) === 0 && <div style={{color:'red', fontSize:12, marginTop:5}}>⚠️ 0 Siswa = Gaji Transport Only</div>}
                </div>

                <button type="submit" style={styles.btnSubmit}>SIMPAN</button>
            </form>
        </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif' },
  header: { background:'#2c3e50', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  btnLogout: { background:'#c0392b', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer' },
  content: { padding:20, maxWidth:'500px', margin:'0 auto' },
  card: { background:'white', padding:25, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  successCard: { background:'white', padding:30, borderRadius:10, borderTop:'5px solid #27ae60' },
  label: { display:'block', marginBottom:5, fontWeight:'bold', color:'#333', fontSize:13 },
  input: { width:'100%', padding:10, borderRadius:5, border:'1px solid #ddd', boxSizing:'border-box' },
  row: { display:'flex', gap:10, marginBottom:10 },
  btnActive: { flex:1, padding:10, background:'#3498db', color:'white', border:'none', borderRadius:5, fontWeight:'bold' },
  btnInactive: { flex:1, padding:10, background:'#ecf0f1', color:'#7f8c8d', border:'1px solid #bdc3c7', borderRadius:5 },
  btnSubmit: { width:'100%', padding:15, background:'#27ae60', color:'white', border:'none', borderRadius:5, fontWeight:'bold', fontSize:16, marginTop:10 },
  detailBox: { background:'#f8f9fa', padding:15, borderRadius:8, border:'1px solid #eee' },
  rowDetail: { display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 },
  badgePending: { background:'#fff3cd', color:'#856404', padding:'2px 8px', borderRadius:4, fontSize:12, fontWeight:'bold' }
};

export default TeacherDashboard;