import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  
  // STATE UI (Loading & View Mode)
  const [loading, setLoading] = useState(true);
  const [existingLog, setExistingLog] = useState(null); // Ini kunci SMART SYNC

  // STATE FORM INPUT
  const [programType, setProgramType] = useState("Reguler"); // Reguler / English
  const [jenjang, setJenjang] = useState("SD");
  const [mapel, setMapel] = useState("");
  const [activityType, setActivityType] = useState("Mengajar");
  const [jurnal, setJurnal] = useState(""); 
  const [durasi, setDurasi] = useState(1.5); // Default 1.5 Jam
  const [siswaHadir, setSiswaHadir] = useState(1);
  const [englishLevel, setEnglishLevel] = useState("kids");

  // 1. INIT & SMART SYNC (Cek apakah sudah absen di device lain?)
  useEffect(() => {
    const checkSessionAndSync = async () => {
        const session = localStorage.getItem("guruSession");
        if (!session) { navigate('/login-guru'); return; }
        
        const guruData = JSON.parse(session);
        setGuru(guruData);

        // SYNC KE SERVER: Cek aktivitas hari ini
        try {
            const today = new Date().toISOString().split('T')[0];
            const q = query(
                collection(db, "teacher_logs"), 
                where("teacherId", "==", guruData.id), 
                where("tanggal", "==", today)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                // JIKA ADA DATA -> TAMPILKAN MODE "SUDAH ABSEN" (Jangan Form Kosong)
                setExistingLog(snap.docs[0].data());
            }
        } catch (error) {
            console.error("Gagal Sync:", error);
        } finally {
            setLoading(false);
        }
    };
    checkSessionAndSync();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("guruSession");
    navigate('/login-guru');
  };

  // 2. LOGIKA HITUNG GAJI (DI BELAKANG LAYAR)
  const calculateAndSubmit = async (e) => {
    e.preventDefault();
    if(!guru) return;

    // A. VALIDASI FINAL: Jurnal Wajib Diisi (Anti Curang)
    if (programType === "Reguler" && activityType === "Mengajar" && jurnal.length < 5) {
        alert("⚠️ Jurnal Mengajar WAJIB diisi detail (Bab/Halaman) untuk transparansi ke Ortu.");
        return;
    }

    try {
        // B. AMBIL SETTING HARGA DARI SERVER
        const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
        const rules = settingsSnap.data().salaryRules;
        const prices = settingsSnap.data().prices;

        let nominal = 0;
        let finalDetail = "";
        let finalDurasi = 0;

        // C. LOGIKA GAJI BENSIN (0 Siswa)
        if (parseInt(siswaHadir) === 0) {
            nominal = parseInt(rules.transport);
            finalDetail = "Transport Only (0 Siswa)";
            finalDurasi = 0;
        } else {
            // D. LOGIKA NORMAL
            if (programType === "English") {
                // LOGIKA LOCK ENGLISH: Harga Flat, Durasi Dianggap 1 Sesi
                // Kita pakai asumsi tarif English = Tarif SD * 1.5 + Bonus (Atau bisa ambil dari prices.english jika itu honor guru)
                // Disini saya pakai logika aman: Honor Mengajar Standar + Bonus Inggris
                const baseRate = parseInt(rules.honorSD) + parseInt(rules.bonusInggris);
                nominal = baseRate * 1.5; // Asumsi 1 Sesi = 90 Menit (1.5 Jam)
                finalDetail = `English Level ${englishLevel}`;
                finalDurasi = 1.5; // LOCKED DURATION
            } else {
                // LOGIKA REGULER
                if (activityType === "Mengajar") {
                    let rate = jenjang === "SD" ? rules.honorSD : rules.honorSMP;
                    nominal = (parseInt(rate) * parseFloat(durasi)) + parseInt(rules.transport);
                    finalDetail = `${jenjang} - ${mapel} (${jurnal})`;
                    finalDurasi = parseFloat(durasi);
                } else {
                    // Ujian / Soal
                    nominal = activityType === "Ujian" ? rules.pengawas : rules.buatSoal;
                    finalDetail = `${activityType} (${jurnal})`;
                    finalDurasi = parseFloat(durasi);
                }
            }
        }

        // E. DATA YANG DISIMPAN
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
            nominal: nominal, // DISIMPAN TAPI TIDAK DITAMPILKAN KE GURU
            status: "Menunggu Validasi"
        };

        // F. SAVE & UPDATE UI
        await addDoc(collection(db, "teacher_logs"), logData);
        setExistingLog(logData); // Update tampilan jadi "Sudah Absen"
        alert("✅ Absensi Berhasil Disimpan! Data aman di server.");

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan. Coba lagi.");
    }
  };

  if (loading) return <div style={{padding:20, textAlign:'center'}}>🔄 Sinkronisasi Data...</div>;

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
        
        {/* === TAMPILAN 1: JIKA SUDAH ABSEN (SMART SYNC) === */}
        {existingLog ? (
            <div style={styles.successCard}>
                <div style={{textAlign:'center', marginBottom:15}}>
                    <span style={{fontSize:40}}>✅</span>
                    <h3 style={{color:'#27ae60', margin:'10px 0'}}>Data Hari Ini Masuk!</h3>
                    <p style={{color:'#7f8c8d', fontSize:14}}>Anda sudah melakukan absensi di perangkat ini atau perangkat lain.</p>
                </div>
                
                <div style={styles.detailBox}>
                    <div style={styles.rowDetail}>
                        <span>Program:</span> <strong>{existingLog.program}</strong>
                    </div>
                    <div style={styles.rowDetail}>
                        <span>Detail:</span> <strong>{existingLog.detail}</strong>
                    </div>
                    <div style={styles.rowDetail}>
                        <span>Siswa Hadir:</span> <strong>{existingLog.siswaHadir} Orang</strong>
                    </div>
                    <div style={styles.rowDetail}>
                        <span>Durasi:</span> <strong>{existingLog.durasiJam} Jam</strong>
                    </div>
                    <hr style={{border:'0.5px dashed #ccc'}}/>
                    <div style={styles.rowDetail}>
                        <span>Status Gaji:</span> <span style={styles.badgePending}>⏳ {existingLog.status}</span>
                    </div>
                    {/* NOMINAL SENGAJA TIDAK DITAMPILKAN (HIDDEN SALARY) */}
                </div>

                <div style={{marginTop:20, textAlign:'center', fontSize:12, color:'#95a5a6'}}>
                    *Jika ada kesalahan data, silakan hubungi Admin untuk Koreksi (Edit).
                </div>
            </div>
        ) : (
        
        /* === TAMPILAN 2: JIKA BELUM ABSEN (FORMULIR) === */
        <div style={styles.card}>
            <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:10, color:'#2c3e50'}}>📝 Input Aktivitas</h3>
            
            <form onSubmit={calculateAndSubmit}>
                
                {/* PILIH PROGRAM (BRANCHING) */}
                <div style={{marginBottom:15}}>
                    <label style={styles.label}>Program Kelas</label>
                    <div style={{display:'flex', gap:10}}>
                        <button type="button" onClick={()=>setProgramType("Reguler")} style={programType==="Reguler" ? styles.btnActive : styles.btnInactive}>📚 Reguler</button>
                        <button type="button" onClick={()=>setProgramType("English")} style={programType==="English" ? styles.btnActive : styles.btnInactive}>🇬🇧 English</button>
                    </div>
                </div>

                {/* --- FORM REGULER (KOMPLEKS) --- */}
                {programType === "Reguler" && (
                    <>
                        <div style={styles.row}>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Jenjang</label>
                                <select style={styles.input} value={jenjang} onChange={e=>setJenjang(e.target.value)}>
                                    <option>SD</option><option>SMP</option><option>SMA</option>
                                </select>
                            </div>
                            <div style={{flex:1}}>
                                <label style={styles.label}>Aktivitas</label>
                                <select style={styles.input} value={activityType} onChange={e=>setActivityType(e.target.value)}>
                                    <option value="Mengajar">Mengajar</option>
                                    <option value="Ujian">Jaga Ujian</option>
                                    <option value="Soal">Buat Soal</option>
                                </select>
                            </div>
                        </div>

                        {activityType === "Mengajar" && (
                            <>
                                <div style={{marginBottom:10}}>
                                    <label style={styles.label}>Mata Pelajaran</label>
                                    <input style={styles.input} value={mapel} onChange={e=>setMapel(e.target.value)} placeholder="Matematika / IPA" required />
                                </div>
                                <div style={{marginBottom:10}}>
                                    <label style={styles.label}>Jurnal (Wajib)</label>
                                    <input style={styles.input} value={jurnal} onChange={e=>setJurnal(e.target.value)} placeholder="Bab 3, Halaman 40..." required />
                                    <small style={{color:'#e67e22', fontSize:11}}>*Data ini akan dilihat Orang Tua.</small>
                                </div>
                                <div style={{marginBottom:10}}>
                                    <label style={styles.label}>Durasi (Jam)</label>
                                    <input type="number" step="0.5" style={styles.input} value={durasi} onChange={e=>setDurasi(e.target.value)} />
                                </div>
                            </>
                        )}
                        
                        {(activityType === "Ujian" || activityType === "Soal") && (
                             <div style={{marginBottom:10}}>
                                <label style={styles.label}>Keterangan Paket</label>
                                <input style={styles.input} value={jurnal} onChange={e=>setJurnal(e.target.value)} placeholder="Contoh: Paket Ujian Tengah Semester" required />
                            </div>
                        )}
                    </>
                )}

                {/* --- FORM ENGLISH (LOCKED DURATION) --- */}
                {programType === "English" && (
                    <div style={{marginBottom:15, background:'#f9fbe7', padding:15, borderRadius:5, border:'1px solid #cddc39'}}>
                        <label style={styles.label}>Level English</label>
                        <select style={styles.input} value={englishLevel} onChange={e=>setEnglishLevel(e.target.value)}>
                            <option value="kids">Kids</option>
                            <option value="junior">Junior</option>
                            <option value="professional">Professional</option>
                        </select>
                        
                        {/* FITUR LOCK DURASI */}
                        <div style={{marginTop:10, fontSize:13, color:'#827717', display:'flex', alignItems:'center', gap:5}}>
                            <span>🔒 Durasi Terkunci:</span> 
                            <strong>1 Sesi (90 Menit)</strong>
                        </div>
                    </div>
                )}

                {/* JUMLAH SISWA (GAJI BENSIN LOGIC) */}
                <div style={{marginBottom:20}}>
                    <label style={styles.label}>Jumlah Siswa Hadir</label>
                    <input type="number" style={styles.input} value={siswaHadir} onChange={e=>setSiswaHadir(e.target.value)} min="0" required />
                    
                    {parseInt(siswaHadir) === 0 && (
                        <div style={{background:'#ffebee', color:'#c62828', padding:10, borderRadius:5, marginTop:5, fontSize:12, fontWeight:'bold'}}>
                            ⚠️ PERHATIAN: 0 Siswa.<br/>
                            Sistem akan mencatat ini sebagai Transport Only (Gaji Bensin).
                        </div>
                    )}
                </div>

                <button type="submit" style={styles.btnSubmit}>SIMPAN AKTIVITAS</button>
            </form>
        </div>
        )}

      </div>
    </div>
  );
};

// CSS STYLES
const styles = {
  container: { minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif' },
  header: { background:'#2c3e50', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 5px rgba(0,0,0,0.1)' },
  btnLogout: { background:'#c0392b', color:'white', border:'none', padding:'8px 15px', borderRadius:5, cursor:'pointer', fontSize:12 },
  content: { padding:20, maxWidth:'500px', margin:'0 auto' },
  card: { background:'white', padding:25, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  successCard: { background:'white', padding:30, borderRadius:10, boxShadow:'0 4px 10px rgba(0,0,0,0.05)', borderTop:'5px solid #27ae60' },
  
  label: { display:'block', marginBottom:5, fontWeight:'bold', color:'#333', fontSize:13 },
  input: { width:'100%', padding:12, borderRadius:5, border:'1px solid #ddd', boxSizing:'border-box', background:'white', color:'#333', fontSize:14 },
  row: { display:'flex', gap:15, marginBottom:15 },
  
  btnActive: { flex:1, padding:10, background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold', boxShadow:'0 2px 4px rgba(0,0,0,0.2)' },
  btnInactive: { flex:1, padding:10, background:'#ecf0f1', color:'#7f8c8d', border:'1px solid #bdc3c7', borderRadius:5, cursor:'pointer' },
  btnSubmit: { width:'100%', padding:15, background:'#27ae60', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer', fontSize:16, marginTop:10, boxShadow:'0 4px 6px rgba(0,0,0,0.1)' },
  
  detailBox: { background:'#f8f9fa', padding:15, borderRadius:8, border:'1px solid #eee' },
  rowDetail: { display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14, color:'#555' },
  badgePending: { background:'#fff3cd', color:'#856404', padding:'2px 8px', borderRadius:4, fontSize:12, fontWeight:'bold' }
};

export default TeacherDashboard;