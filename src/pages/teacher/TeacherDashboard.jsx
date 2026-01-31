import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from "firebase/firestore";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [guru, setGuru] = useState(null);
  
  // STATE INPUT
  const [programType, setProgramType] = useState("Reguler"); // Reguler / English
  const [jenjang, setJenjang] = useState("SD");
  const [mapel, setMapel] = useState("");
  const [activityType, setActivityType] = useState("Mengajar");
  const [jurnal, setJurnal] = useState(""); // Bukti Mengajar
  const [durasi, setDurasi] = useState(1);
  const [siswaHadir, setSiswaHadir] = useState(1);
  const [englishLevel, setEnglishLevel] = useState("kids");
  
  // STATE RIWAYAT
  const [history, setHistory] = useState([]);

  // LOAD DATA & SETTINGS
  useEffect(() => {
    const session = localStorage.getItem("guruSession");
    if (!session) { navigate('/login-guru'); return; }
    setGuru(JSON.parse(session));
    fetchHistory(JSON.parse(session).id);
  }, []);

  const fetchHistory = async (guruId) => {
    // Ambil log hari ini saja biar ringan
    const today = new Date().toISOString().split('T')[0];
    const q = query(collection(db, "teacher_logs"), where("teacherId", "==", guruId), where("tanggal", "==", today));
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => d.data()));
  };

  const handleLogout = () => {
    localStorage.removeItem("guruSession");
    navigate('/login-guru');
  };

  // --- LOGIKA UTAMA (SMART LOGIC) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!guru) return;

    // 1. CEK ANTI DOBEL INPUT (SERVER SIDE)
    const today = new Date().toISOString().split('T')[0];
    // Asumsi: Guru tidak mungkin input 2x dalam rentang waktu berdekatan. 
    // Kita cek apakah sudah ada inputan dengan detail yang sama persis hari ini.
    const duplicateCheck = history.find(h => 
        h.program === programType && 
        (programType === "Reguler" ? h.detail.includes(mapel) : h.detail.includes(englishLevel))
    );

    if (duplicateCheck) {
        alert("⚠️ DUPLIKASI TERDETEKSI!\nAnda sudah memasukkan data kelas ini hari ini. Hubungi Admin jika ingin koreksi.");
        return;
    }

    try {
        // 2. AMBIL RUMUS GAJI DARI SERVER
        const settingsSnap = await getDoc(doc(db, "settings", "global_config"));
        const rules = settingsSnap.data().salaryRules;
        const prices = settingsSnap.data().prices;

        // 3. HITUNG NOMINAL (DI BELAKANG LAYAR)
        let nominal = 0;
        
        // Cek Kehadiran Siswa (Transport Only Logic)
        if (parseInt(siswaHadir) === 0) {
            nominal = parseInt(rules.transport); // Cuma dapat transport
        } else {
            // Hitung Normal
            if (programType === "English") {
                // English Logic (Flat Price tapi kita asumsikan per sesi ada standar honornya, 
                // atau sementara kita pakai tarif mengajar normal + bonus inggris jika belum ada setting honor spesifik English)
                // *Catatan: Biasanya honor english lebih tinggi, kita pakai Honor SD + Bonus Inggris sebagai base logic kalau belum ada setting honor english khusus guru*
                nominal = (parseInt(rules.honorSD) + parseInt(rules.bonusInggris)) * 1.5; // Asumsi 90 menit (1.5 jam)
            } else {
                // Reguler Logic
                if (activityType === "Mengajar") {
                    let rate = jenjang === "SD" ? rules.honorSD : rules.honorSMP;
                    nominal = (parseInt(rate) * durasi) + parseInt(rules.transport);
                } else {
                    // Ujian / Soal
                    nominal = activityType === "Ujian" ? rules.pengawas : rules.buatSoal;
                }
            }
        }

        // 4. SIMPAN KE DATABASE
        await addDoc(collection(db, "teacher_logs"), {
            teacherId: guru.id,
            namaGuru: guru.nama,
            tanggal: today,
            waktu: new Date().toLocaleTimeString(),
            program: programType,
            kegiatan: activityType,
            detail: programType === "Reguler" ? `${jenjang} - ${mapel} (${jurnal})` : `English ${englishLevel}`,
            siswaHadir: siswaHadir,
            nominal: nominal, // TERSIMPAN TAPI TIDAK DITAMPILKAN DI UI GURU
            status: "Menunggu Validasi"
        });

        alert("✅ Absensi Berhasil Disimpan!");
        fetchHistory(guru.id); // Refresh tabel
        
        // Reset Form
        setJurnal(""); setMapel("");

    } catch (error) {
        console.error(error);
        alert("Gagal menyimpan data.");
    }
  };

  if(!guru) return null;

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <div style={styles.header}>
        <div>
            <h2 style={{margin:0, color:'white'}}>Halo, {guru.nama} 👋</h2>
            <p style={{margin:0, color:'#bdc3c7', fontSize:12}}>Selamat Mengajar!</p>
        </div>
        <button onClick={handleLogout} style={styles.btnLogout}>Keluar</button>
      </div>

      <div style={styles.content}>
        
        {/* FORM INPUT ABSENSI */}
        <div style={styles.card}>
            <h3 style={{marginTop:0, borderBottom:'1px solid #eee', paddingBottom:10}}>📝 Input Aktivitas Hari Ini</h3>
            
            <form onSubmit={handleSubmit}>
                
                {/* PILIH PROGRAM (BRANCHING) */}
                <div style={{marginBottom:15}}>
                    <label style={styles.label}>Program Kelas</label>
                    <div style={{display:'flex', gap:10}}>
                        <button type="button" onClick={()=>setProgramType("Reguler")} style={programType==="Reguler" ? styles.btnActive : styles.btnInactive}>📚 Reguler</button>
                        <button type="button" onClick={()=>setProgramType("English")} style={programType==="English" ? styles.btnActive : styles.btnInactive}>🇬🇧 English</button>
                    </div>
                </div>

                {/* FORM REGULER */}
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
                                <label style={styles.label}>Jenis</label>
                                <select style={styles.input} value={activityType} onChange={e=>setActivityType(e.target.value)}>
                                    <option value="Mengajar">Mengajar</option>
                                    <option value="Ujian">Pengawas Ujian</option>
                                    <option value="Soal">Buat Soal</option>
                                </select>
                            </div>
                        </div>

                        {activityType === "Mengajar" && (
                            <>
                                <div style={{marginBottom:10}}>
                                    <label style={styles.label}>Mata Pelajaran</label>
                                    <input style={styles.input} value={mapel} onChange={e=>setMapel(e.target.value)} placeholder="Contoh: Matematika" required />
                                </div>
                                <div style={{marginBottom:10}}>
                                    <label style={styles.label}>Jurnal Mengajar (Wajib)</label>
                                    <textarea 
                                        style={styles.textarea} 
                                        value={jurnal} 
                                        onChange={e=>setJurnal(e.target.value)} 
                                        placeholder="Bab berapa? Halaman berapa? Catatan siswa?" 
                                        required 
                                    />
                                    <small style={{color:'red', fontSize:11}}>*Data ini akan dilaporkan ke Orang Tua.</small>
                                </div>
                                <div style={{marginBottom:10}}>
                                    <label style={styles.label}>Durasi (Jam)</label>
                                    <input type="number" style={styles.input} value={durasi} onChange={e=>setDurasi(e.target.value)} />
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* FORM ENGLISH */}
                {programType === "English" && (
                    <div style={{marginBottom:15, background:'#f0f4c3', padding:10, borderRadius:5}}>
                        <label style={styles.label}>Level English</label>
                        <select style={styles.input} value={englishLevel} onChange={e=>setEnglishLevel(e.target.value)}>
                            <option value="kids">Kids</option>
                            <option value="junior">Junior</option>
                            <option value="professional">Professional</option>
                        </select>
                        <p style={{fontSize:12, color:'#555'}}>*Durasi otomatis tercatat 1 Sesi (90 Menit)</p>
                    </div>
                )}

                {/* LOGIKA GAJI BENSIN */}
                <div style={{marginBottom:20}}>
                    <label style={styles.label}>Jumlah Siswa Hadir</label>
                    <input type="number" style={styles.input} value={siswaHadir} onChange={e=>setSiswaHadir(e.target.value)} min="0" required />
                    {parseInt(siswaHadir) === 0 && (
                        <small style={{color:'orange', fontWeight:'bold'}}>⚠️ Siswa Kosong = Gaji Transport Only</small>
                    )}
                </div>

                <button type="submit" style={styles.btnSubmit}>SIMPAN ABSENSI</button>
            </form>
        </div>

        {/* RIWAYAT (HIDDEN SALARY) */}
        <div style={{marginTop:20}}>
            <h3 style={{color:'#555'}}>🕒 Riwayat Hari Ini</h3>
            {history.length === 0 ? <p style={{color:'#999'}}>Belum ada aktivitas hari ini.</p> : (
                history.map((h, i) => (
                    <div key={i} style={styles.historyCard}>
                        <div>
                            <strong style={{color:'#2c3e50'}}>{h.program} - {h.kegiatan}</strong>
                            <div style={{fontSize:12, color:'#7f8c8d'}}>{h.detail}</div>
                            <div style={{fontSize:11, color:'#7f8c8d'}}>Siswa: {h.siswaHadir} | Waktu: {h.waktu}</div>
                        </div>
                        <div style={{textAlign:'right'}}>
                            <div style={{color:'green', fontWeight:'bold', fontSize:12}}>✅ Terekam</div>
                            <div style={{fontSize:10, color:'#999'}}>Menunggu Admin</div>
                        </div>
                    </div>
                ))
            )}
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { minHeight:'100vh', background:'#f4f7f6', fontFamily:'sans-serif' },
  header: { background:'#2c3e50', padding:'20px', display:'flex', justifyContent:'space-between', alignItems:'center' },
  btnLogout: { background:'#c0392b', color:'white', border:'none', padding:'5px 15px', borderRadius:5, cursor:'pointer' },
  content: { padding:20, maxWidth:'600px', margin:'0 auto' },
  card: { background:'white', padding:20, borderRadius:10, boxShadow:'0 2px 5px rgba(0,0,0,0.05)' },
  label: { display:'block', marginBottom:5, fontWeight:'bold', color:'#333', fontSize:13 },
  input: { width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc', boxSizing:'border-box', background:'white', color:'black' },
  textarea: { width:'100%', padding:10, borderRadius:5, border:'1px solid #ccc', minHeight:80, boxSizing:'border-box', background:'white', color:'black' },
  row: { display:'flex', gap:10, marginBottom:10 },
  btnActive: { flex:1, padding:10, background:'#3498db', color:'white', border:'none', borderRadius:5, cursor:'pointer', fontWeight:'bold' },
  btnInactive: { flex:1, padding:10, background:'#ecf0f1', color:'#333', border:'1px solid #bdc3c7', borderRadius:5, cursor:'pointer' },
  btnSubmit: { width:'100%', padding:15, background:'#27ae60', color:'white', border:'none', borderRadius:5, fontWeight:'bold', cursor:'pointer', fontSize:16 },
  historyCard: { background:'white', padding:15, borderRadius:8, marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', borderLeft:'4px solid #27ae60', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }
};

export default TeacherDashboard;